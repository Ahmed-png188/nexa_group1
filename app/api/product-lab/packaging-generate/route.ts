export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { guardWorkspace } from '@/lib/workspace-guard'
import { checkCredits, CREDIT_COSTS } from '@/lib/plan-gate'
import { getSize } from '@/lib/packaging-templates'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const {
      workspace_id, product_id,
      packaging_type, size_id, custom_dims,
      lang = 'en',
    } = await request.json()

    if (!workspace_id || !packaging_type || !size_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    const { ok, error: creditErr } = await checkCredits(
      workspace_id, user.id,
      CREDIT_COSTS.packaging_generate,
      'packaging_generate',
      'Packaging design generation',
    )
    if (!ok) return creditErr!

    // Load workspace brand data
    const { data: ws } = await supabase
      .from('workspaces')
      .select('brand_name, brand_voice, brand_tone, brand_colors, brand_tagline')
      .eq('id', workspace_id)
      .single()

    // Load logo from brand_assets
    const { data: logoAsset } = await supabase
      .from('brand_assets')
      .select('file_url')
      .eq('workspace_id', workspace_id)
      .eq('type', 'logo')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Resolve dimensions
    const sizeInfo = getSize(packaging_type, size_id)
    const dims = custom_dims || sizeInfo?.dims || { width_mm: 100, height_mm: 100, depth_mm: 0, bleed_mm: 3 }

    // Build brand context
    const brandContext = [
      ws?.brand_name    && `Brand: ${ws.brand_name}`,
      ws?.brand_tagline && `Tagline: ${ws.brand_tagline}`,
      ws?.brand_voice   && `Voice: ${ws.brand_voice}`,
      ws?.brand_tone    && `Tone: ${ws.brand_tone}`,
      ws?.brand_colors  && `Colors: ${JSON.stringify(ws.brand_colors)}`,
    ].filter(Boolean).join('\n')

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

    const systemPrompt = lang === 'ar'
      ? 'أنت مصمم تغليف محترف متخصص في العلامات التجارية العربية الخليجية. تصمم تغليفاً جاهزاً للطباعة يعكس هوية العلامة التجارية بدقة. أجب بـ JSON فقط.'
      : 'You are a professional packaging designer specializing in premium brand identity. You design print-ready packaging that perfectly reflects brand identity. Respond with JSON only.'

    const depthStr = dims.depth_mm ? `×${dims.depth_mm}mm` : ''

    const userPrompt = lang === 'ar'
      ? `صمّم تغليف ${packaging_type} لهذه العلامة التجارية. أعطني المواصفات الكاملة بـ JSON:

${brandContext}
الأبعاد: ${dims.width_mm}×${dims.height_mm}mm${depthStr}

{
  "bg_color": "لون الخلفية الرئيسي hex",
  "text_color": "لون النص hex",
  "accent_color": "لون التمييز hex",
  "brand_name_display": "اسم العلامة كما يظهر على التغليف",
  "tagline_display": "الشعار/التاغلاين (اختياري)",
  "main_copy": "النص الرئيسي على التغليف (2-3 أسطر)",
  "secondary_copy": "نص ثانوي (مكونات، وصف مختصر، اختياري)",
  "design_style": "minimal | luxury | bold | playful | organic | tech",
  "font_weight": "light | regular | medium | bold",
  "layout": "centered | left | asymmetric",
  "special_elements": ["عنصر تصميمي 1", "عنصر تصميمي 2"],
  "print_notes": "ملاحظات الطباعة والتشطيب"
}`
      : `Design a ${packaging_type} for this brand. Give me complete specifications as JSON:

${brandContext}
Dimensions: ${dims.width_mm}×${dims.height_mm}mm${depthStr}

{
  "bg_color": "main background color hex",
  "text_color": "text color hex",
  "accent_color": "accent color hex",
  "brand_name_display": "brand name as shown on packaging",
  "tagline_display": "tagline (optional)",
  "main_copy": "main copy on packaging (2-3 lines)",
  "secondary_copy": "secondary text (ingredients, short desc, optional)",
  "design_style": "minimal | luxury | bold | playful | organic | tech",
  "font_weight": "light | regular | medium | bold",
  "layout": "centered | left | asymmetric",
  "special_elements": ["design element 1", "design element 2"],
  "print_notes": "printing and finishing notes"
}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    let designSpec: any = {}
    try {
      const raw = (response.content[0] as any).text
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) designSpec = JSON.parse(match[0])
    } catch {
      designSpec = {
        bg_color:            (ws?.brand_colors as any)?.primary || '#0C0C0C',
        text_color:          '#FFFFFF',
        accent_color:        '#00AAFF',
        brand_name_display:  ws?.brand_name || 'Brand',
        tagline_display:     ws?.brand_tagline || '',
        main_copy:           ws?.brand_voice || 'Quality you can feel.',
        secondary_copy:      '',
        design_style:        'minimal',
        font_weight:         'medium',
        layout:              'centered',
        special_elements:    [],
        print_notes:         'Standard CMYK print.',
      }
    }

    // Save to packaging_designs
    const { data: saved } = await supabase.from('packaging_designs').insert({
      workspace_id,
      product_id: product_id || null,
      packaging_type,
      size_preset: size_id,
      dimensions: dims,
      design_data: {
        ...designSpec,
        logo_url: logoAsset?.file_url || null,
        dims,
      },
    }).select().single()

    return NextResponse.json({
      id:             saved?.id,
      design:         designSpec,
      dims,
      logo_url:       logoAsset?.file_url || null,
      packaging_type,
    })

  } catch (err) {
    console.error('[product-lab/packaging-generate]', err)
    return NextResponse.json({ error: 'Packaging generation failed' }, { status: 500 })
  }
}
