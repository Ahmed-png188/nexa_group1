import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as serviceClient } from '@supabase/supabase-js'

async function getValidToken(emailAccount: any, service: any): Promise<string> {
  if (emailAccount.token_expires_at) {
    const expiresAt = new Date(emailAccount.token_expires_at).getTime()
    const fiveMinutes = 5 * 60 * 1000
    if (Date.now() + fiveMinutes >= expiresAt && emailAccount.refresh_token) {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: emailAccount.refresh_token,
          grant_type: 'refresh_token',
        }),
      })
      const tokens = await res.json()
      if (tokens.access_token) {
        const newExpiry = tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          : null
        await service.from('email_accounts').update({
          access_token: tokens.access_token,
          token_expires_at: newExpiry,
        }).eq('id', emailAccount.id)
        return tokens.access_token
      }
    }
  }
  return emailAccount.access_token
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { to, subject, body, contactId } = await request.json()
    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: member } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .single()
    if (!member) return NextResponse.json({ error: 'No workspace' }, { status: 403 })

    const service = serviceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: emailAccount } = await service
      .from('email_accounts')
      .select('*')
      .eq('workspace_id', member.workspace_id)
      .eq('provider', 'gmail')
      .single()

    if (!emailAccount) {
      return NextResponse.json({ error: 'No email account connected' }, { status: 400 })
    }

    const accessToken = await getValidToken(emailAccount, service)

    // Save a draft record first to get the tracking ID
    const { data: draftRecord } = await service.from('emails_sent').insert({
      workspace_id: member.workspace_id,
      contact_id: contactId || null,
      from_email: emailAccount.email,
      to_email: to,
      subject,
      body,
      status: 'sending',
      opened_count: 0,
      sent_at: new Date().toISOString(),
    }).select('id').single()

    // Build HTML email with tracking pixel
    const trackingPixel = draftRecord?.id
      ? `<img src="https://nexaa.cc/api/email/track/open?id=${draftRecord.id}" width="1" height="1" style="display:none"/>`
      : ''

    const textToHtml = (text: string): string => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .split('\n')
        .map(line => line.trim() === '' ? '<br/>' : `<p style="margin:0 0 12px;line-height:1.7;color:#1a1a1a;">${line}</p>`)
        .join('')
    }

    const htmlBody = `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.7;color:#1a1a1a;padding:20px;max-width:600px;">${textToHtml(body)}${trackingPixel}</body></html>`

    const encodedSubject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`

    const emailContent = [
      `From: ${emailAccount.name} <${emailAccount.email}>`,
      `To: ${to}`,
      `Subject: ${encodedSubject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      htmlBody,
    ].join('\r\n')

    const encodedEmail = Buffer.from(emailContent)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    console.log('[Email Send] Sending to:', to, 'subject:', subject, 'from:', emailAccount.email)

    // Send via Gmail API
    const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedEmail }),
    })

    const sendData = await sendRes.json()
    console.log('[Email Send] Gmail response status:', sendRes.status, 'id:', sendData.id, 'error:', sendData.error?.message)

    if (sendData.error || !sendData.id) {
      const gmailErr = sendData.error?.message || 'Unknown Gmail error'
      const gmailCode = sendData.error?.code || sendRes.status
      console.error('[Email Send] Gmail error:', gmailErr, 'code:', gmailCode)
      // Clean up draft record
      if (draftRecord?.id) await service.from('emails_sent').delete().eq('id', draftRecord.id)
      return NextResponse.json({ error: gmailErr, code: gmailCode }, { status: 500 })
    }

    // Update draft record with real message/thread IDs
    if (draftRecord?.id) {
      await service.from('emails_sent').update({
        thread_id: sendData.threadId,
        message_id: sendData.id,
        status: 'sent',
      }).eq('id', draftRecord.id)
    }

    // Fire notification (non-blocking)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_API_SECRET || '',
      },
      body: JSON.stringify({
        workspace_id: member.workspace_id,
        type: 'email',
        message: `Email sent to ${to}`,
        link: '/dashboard/automate',
      }),
    }).catch(() => {})

    return NextResponse.json({ success: true, messageId: sendData.id })
  } catch (error: unknown) {
    console.error('[Email Send] Error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
