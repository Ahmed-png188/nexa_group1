import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { workspace_id, name, email, custom_answer, source } = await request.json()

    if (!workspace_id || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const service = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify workspace exists and has a public lead page
    const { data: ws } = await service
      .from('workspaces')
      .select('id, lead_page_auto_enroll, lead_page_sequence_id')
      .eq('id', workspace_id)
      .single()

    if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    // Upsert contact
    const { data: contact, error: contactErr } = await service
      .from('contacts')
      .upsert({
        workspace_id,
        email: email.toLowerCase().trim(),
        name: name || email.split('@')[0],
        first_name: name?.split(' ')[0] || '',
        last_name: name?.split(' ').slice(1).join(' ') || '',
        source: source || 'lead_page',
        tags: ['lead'],
        notes: custom_answer || null,
      }, { onConflict: 'workspace_id,email' })
      .select('id')
      .single()

    if (contactErr) {
      console.error('[lead-capture] Contact upsert error:', contactErr.message)
      return NextResponse.json({ error: 'Failed to save contact' }, { status: 500 })
    }

    // Log activity
    try {
      await service.from('activity').insert({
        workspace_id,
        type: 'lead_captured',
        title: `New lead: ${name || email} via lead page`,
      })
    } catch {}

    return NextResponse.json({ success: true, contact_id: contact?.id })
  } catch (error: unknown) {
    console.error('[lead-capture] Error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Failed to capture lead' }, { status: 500 })
  }
}
