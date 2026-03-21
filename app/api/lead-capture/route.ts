export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { getSenderFrom } from '@/lib/sender'


export async function POST(request: NextRequest) {
  try {
    const { workspace_id, form_values, fields, source } = await request.json()
    if (!workspace_id) return NextResponse.json({ error: 'Missing workspace_id' }, { status: 400 })

    const service = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: ws } = await service.from('workspaces').select('*').eq('id', workspace_id).single()
    if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    // Get workspace owner email for reply-to on lead magnet emails
    const { data: ownerMember } = await service
      .from('workspace_members')
      .select('users(email)')
      .eq('workspace_id', workspace_id)
      .eq('role', 'owner')
      .limit(1)
      .single()
    const ownerEmail: string | null = (ownerMember as any)?.users?.email || null
    const replyTo: string | null = ws.sender_domain_verified ? null : ownerEmail

    // ── Extract values from custom fields ──
    const emailField = (fields||[]).find((f:any) => f.type === 'email')
    const nameField  = (fields||[]).find((f:any) => f.type === 'text' && f.label.toLowerCase().includes('name'))
    const phoneField = (fields||[]).find((f:any) => f.type === 'phone')

    const email = emailField ? (form_values?.[emailField.id] || '').trim() : ''
    const name  = nameField  ? (form_values?.[nameField.id]  || '').trim() : ''
    const phone = phoneField ? (form_values?.[phoneField.id] || '').trim() : ''

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    // Build notes from all remaining fields
    const notes = (fields||[])
      .filter((f:any) => ![emailField?.id, nameField?.id, phoneField?.id].includes(f.id))
      .map((f:any) => {
        const v = form_values?.[f.id]
        if (!v || (Array.isArray(v) && v.length === 0) || v === '') return null
        return `${f.label}: ${Array.isArray(v) ? v.join(', ') : v}`
      })
      .filter(Boolean)
      .join('\n')

    // ── Upsert contact ──
    const { data: contact, error: contactErr } = await service.from('contacts').upsert({
      workspace_id,
      email:      email.toLowerCase(),
      name:       name || email.split('@')[0],
      first_name: name?.split(' ')[0] || '',
      last_name:  name?.split(' ').slice(1).join(' ') || '',
      phone:      phone || null,
      source:     source || 'lead_page',
      tags:       ['lead'],
      notes:      notes || null,
    }, { onConflict: 'workspace_id,email' }).select('id').single()

    if (contactErr) {
      console.error('[lead-capture] Contact error:', contactErr.message)
      return NextResponse.json({ error: 'Failed to save contact' }, { status: 500 })
    }

    // ── Auto-enroll in sequence ──
    if (ws.lead_page_auto_enroll && ws.lead_page_sequence_id && contact?.id) {
      try {
        // Try sequence_contacts first, fall back to sequence_enrollments
        const { error: e1 } = await service.from('sequence_contacts').upsert({
          workspace_id,
          sequence_id:   ws.lead_page_sequence_id,
          contact_id:    contact.id,
          email:         email.toLowerCase(),
          status:        'active',
          current_step:  0,
          next_send_at:  new Date().toISOString(),
        }, { onConflict: 'sequence_id,email' })
        if (e1) {
          await service.from('sequence_enrollments').upsert({
            sequence_id: ws.lead_page_sequence_id,
            contact_id:  contact.id,
            status:      'active',
            current_step: 1,
            enrolled_at:  new Date().toISOString(),
            next_send_at: new Date().toISOString(),
          }, { onConflict: 'sequence_id,contact_id' })
        }
      } catch (e) { console.error('[lead-capture] Enroll error:', e) }
    }

    // ── Send lead magnet email if enabled ──
    let magnetUrl: string | null = null
    if (ws.lead_magnet_enabled && ws.lead_magnet_url) {
      magnetUrl = ws.lead_magnet_url
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const subject = ws.lead_magnet_email_subject || 'Here is your free resource!'
        const rawBody = ws.lead_magnet_email_body ||
          `Hi ${name || 'there'},\n\nHere is the link you requested:\n${ws.lead_magnet_url}\n\nEnjoy!\n\n— ${ws.brand_name || ws.name}`
        const body = rawBody
          .replace(/\{\{name\}\}/g, name || 'there')
          .replace(/\{\{url\}\}/g, ws.lead_magnet_url)
          .replace(/\{\{brand\}\}/g, ws.brand_name || ws.name)

        await resend.emails.send({
          from:     getSenderFrom(ws),
          to:       [email],
          reply_to: replyTo || undefined,
          subject,
          html: `<div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#0C0C0C">
            <pre style="font-family:inherit;white-space:pre-wrap;line-height:1.7;font-size:15px">${body}</pre>
            <hr style="border:none;border-top:1px solid #eee;margin:32px 0"/>
            <p style="font-size:12px;color:#999;margin:0">
              You received this because you submitted a form at <a href="https://nexaa.cc/${ws.slug||''}" style="color:#00AAFF">nexaa.cc/${ws.slug||''}</a>
            </p>
          </div>`,
          text: body,
        })
      } catch (e) { console.error('[lead-capture] Magnet email error:', e) }
    }

    // ── Activity log ──
    try {
      await service.from('activity').insert({
        workspace_id,
        type:  'lead_captured',
        title: `New lead: ${name || email} via lead page`,
      })
    } catch {}

    return NextResponse.json({ success: true, contact_id: contact?.id, magnet_url: magnetUrl })
  } catch (err: unknown) {
    console.error('[lead-capture]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to capture lead' }, { status: 500 })
  }
}
