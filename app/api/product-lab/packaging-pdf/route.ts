export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { guardWorkspace } from '@/lib/workspace-guard'
import { jsPDF } from 'jspdf'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, design_id } = await request.json()
    if (!workspace_id || !design_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    // Load the design
    const { data: design } = await supabase
      .from('packaging_designs')
      .select('*')
      .eq('id', design_id)
      .eq('workspace_id', workspace_id)
      .single()

    if (!design) return NextResponse.json({ error: 'Design not found' }, { status: 404 })

    const dims = design.dimensions as any
    const d    = design.design_data as any

    const widthMM  = (dims.width_mm  || 100) + (dims.bleed_mm || 3) * 2
    const heightMM = (dims.height_mm || 100) + (dims.bleed_mm || 3) * 2

    const doc = new jsPDF({
      orientation: widthMM > heightMM ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [widthMM, heightMM],
    })

    // Background fill
    const bg = d.bg_color || '#FFFFFF'
    doc.setFillColor(bg)
    doc.rect(0, 0, widthMM, heightMM, 'F')

    // Crop / bleed marks
    const b       = dims.bleed_mm || 3
    const markLen = 3
    const markOff = 1
    doc.setDrawColor('#000000')
    doc.setLineWidth(0.25)
    // Top-left
    doc.line(b - markOff - markLen, b, b - markOff, b)
    doc.line(b, b - markOff - markLen, b, b - markOff)
    // Top-right
    doc.line(widthMM - b + markOff, b, widthMM - b + markOff + markLen, b)
    doc.line(widthMM - b, b - markOff - markLen, widthMM - b, b - markOff)
    // Bottom-left
    doc.line(b - markOff - markLen, heightMM - b, b - markOff, heightMM - b)
    doc.line(b, heightMM - b + markOff, b, heightMM - b + markOff + markLen)
    // Bottom-right
    doc.line(widthMM - b + markOff, heightMM - b, widthMM - b + markOff + markLen, heightMM - b)
    doc.line(widthMM - b, heightMM - b + markOff, widthMM - b, heightMM - b + markOff + markLen)

    // Safe area guide (dashed)
    doc.setDrawColor('#CCCCCC')
    doc.setLineWidth(0.1)
    doc.setLineDashPattern([1, 1], 0)
    doc.rect(b, b, dims.width_mm || 100, dims.height_mm || 100)
    doc.setLineDashPattern([], 0)

    // Text content
    const textColor  = d.text_color  || '#000000'
    const accentColor = d.accent_color || textColor
    const centerX = widthMM / 2
    const centerY = heightMM / 2

    // Brand name — large
    doc.setTextColor(textColor)
    doc.setFontSize(Math.max(8, Math.min(24, (dims.width_mm || 100) / 8)))
    doc.text(d.brand_name_display || 'Brand', centerX, centerY - 8, { align: 'center' })

    // Tagline
    if (d.tagline_display) {
      doc.setFontSize(Math.max(6, Math.min(12, (dims.width_mm || 100) / 14)))
      doc.setTextColor(accentColor)
      doc.text(d.tagline_display, centerX, centerY + 2, { align: 'center' })
    }

    // Main copy
    if (d.main_copy) {
      doc.setFontSize(Math.max(5, Math.min(9, (dims.width_mm || 100) / 18)))
      doc.setTextColor(textColor)
      const lines = doc.splitTextToSize(d.main_copy, (dims.width_mm || 100) - 10)
      doc.text(lines, centerX, centerY + 12, { align: 'center' })
    }

    // Print notes footer
    doc.setFontSize(5)
    doc.setTextColor('#888888')
    doc.text(
      `Bleed: ${b}mm | Size: ${dims.width_mm || 100}×${dims.height_mm || 100}mm | ${d.print_notes || 'CMYK'}`,
      b + 1, heightMM - 1
    )

    // Export PDF as buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    // Upload to Supabase Storage via service role
    const supabaseService = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const path = `packaging/${workspace_id}/${design_id}.pdf`
    await supabaseService.storage.from('brand-assets').upload(path, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

    const { data: { publicUrl } } = supabaseService.storage
      .from('brand-assets')
      .getPublicUrl(path)

    // Update design record with PDF URL
    await supabaseService
      .from('packaging_designs')
      .update({ pdf_url: publicUrl })
      .eq('id', design_id)

    return NextResponse.json({ pdf_url: publicUrl })

  } catch (err) {
    console.error('[product-lab/packaging-pdf]', err)
    return NextResponse.json({ error: 'PDF export failed' }, { status: 500 })
  }
}
