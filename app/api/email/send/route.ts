import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as serviceClient } from '@supabase/supabase-js'

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

    // Build RFC 2822 email
    const emailContent = [
      `From: ${emailAccount.name} <${emailAccount.email}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      body.replace(/\n/g, '<br>'),
    ].join('\r\n')

    const encodedEmail = Buffer.from(emailContent).toString('base64url')

    // Send via Gmail API
    const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${emailAccount.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedEmail }),
    })

    const sendData = await sendRes.json()

    if (!sendData.id) {
      console.error('[Email Send] Gmail error:', sendData.error?.message)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    // Save to emails_sent
    await service.from('emails_sent').insert({
      workspace_id: member.workspace_id,
      contact_id: contactId || null,
      from_email: emailAccount.email,
      to_email: to,
      subject,
      body,
      thread_id: sendData.threadId,
      message_id: sendData.id,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, messageId: sendData.id })
  } catch (error: unknown) {
    console.error('[Email Send] Error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
