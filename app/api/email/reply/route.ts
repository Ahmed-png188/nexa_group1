import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as serviceClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { threadId, to, subject, body, messageId } = await request.json()
    if (!threadId || !to || !body) {
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
      return NextResponse.json({ error: 'No Gmail account connected' }, { status: 400 })
    }

    // Refresh token if needed
    let accessToken = emailAccount.access_token
    if (emailAccount.token_expires_at) {
      const expiresAt = new Date(emailAccount.token_expires_at).getTime()
      if (Date.now() + 5 * 60 * 1000 >= expiresAt && emailAccount.refresh_token) {
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
          accessToken = tokens.access_token
          const newExpiry = tokens.expires_in
            ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
            : null
          await service.from('email_accounts').update({
            access_token: tokens.access_token,
            token_expires_at: newExpiry,
          }).eq('id', emailAccount.id)
        }
      }
    }

    // Build reply email with thread headers
    const replySubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`
    const emailLines = [
      `From: "${emailAccount.name}" <${emailAccount.email}>`,
      `To: ${to}`,
      `Subject: ${replySubject}`,
      `In-Reply-To: <${messageId}>`,
      `References: <${messageId}>`,
      `MIME-Version: 1.0`,
      `Content-Type: text/plain; charset=UTF-8`,
      ``,
      body,
    ]
    const emailContent = emailLines.join('\r\n')
    const encodedEmail = Buffer.from(emailContent)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    const sendRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encodedEmail, threadId }),
      }
    )

    const sendData = await sendRes.json()

    if (sendData.error) {
      return NextResponse.json({ error: sendData.error.message }, { status: 500 })
    }

    // Save reply to emails_sent
    await service.from('emails_sent').insert({
      workspace_id: member.workspace_id,
      from_email: emailAccount.email,
      to_email: to,
      subject: replySubject,
      body,
      thread_id: threadId,
      message_id: sendData.id,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, messageId: sendData.id })
  } catch (error) {
    console.error('[Reply]', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 })
  }
}
