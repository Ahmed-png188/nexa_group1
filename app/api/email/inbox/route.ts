export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as serviceClient } from '@supabase/supabase-js'


// Decode base64url Gmail body
function decodeBase64(data: string): string {
  try {
    return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
  } catch { return '' }
}

// Strip HTML to clean readable plain text
function stripHtml(html: string): string {
  return html
    // Remove entire style/script blocks
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    // Block elements → newlines
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li|h[1-6]|blockquote|section|article|header|footer)>/gi, '\n')
    // Headings — add extra line before
    .replace(/<h[1-6][^>]*>/gi, '\n')
    // List items — add bullet
    .replace(/<li[^>]*>/gi, '• ')
    // Links — keep just the text, strip the href
    .replace(/<a[^>]*href=["']([^"']*?)["'][^>]*>(.*?)<\/a>/gi, '$2')
    // Strip all remaining tags
    .replace(/<[^>]+>/g, '')
    // Decode entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_: string, n: string) => String.fromCharCode(Number(n)))
    // Clean up whitespace
    .replace(/[ \t]{2,}/g, ' ')       // collapse inline spaces
    .replace(/\n[ \t]+/g, '\n')      // trim line-leading spaces
    .replace(/[ \t]+\n/g, '\n')      // trim line-trailing spaces
    .replace(/\n{3,}/g, '\n\n')      // max double newline
    .trim()
}


// Extract readable plain text from Gmail payload — prefer text/plain, fallback to stripped HTML
function extractBody(payload: any): string {
  if (!payload) return ''
  if (payload.body?.data) {
    const decoded = decodeBase64(payload.body.data)
    return payload.mimeType === 'text/html' ? stripHtml(decoded) : decoded
  }
  if (payload.parts) {
    let plain = '', html = ''
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        plain = decodeBase64(part.body.data)
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        html = stripHtml(decodeBase64(part.body.data))
      } else if (part.parts) {
        const nested = extractBody(part)
        if (nested) plain = plain || nested
      }
    }
    // Always prefer plain text — it's already clean readable content
    return plain || html
  }
  return ''
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: member } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .single()
    if (!member) return NextResponse.json({ error: 'No workspace' }, { status: 404 })

    const service = serviceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: account } = await service
      .from('email_accounts')
      .select('*')
      .eq('workspace_id', member.workspace_id)
      .single()

    if (!account?.access_token) return NextResponse.json({ messages: [] })

    // Refresh token if needed
    let accessToken = account.access_token
    if (account.token_expires_at) {
      const expiresAt = new Date(account.token_expires_at).getTime()
      if (Date.now() + 5 * 60 * 1000 >= expiresAt && account.refresh_token) {
        const res = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            refresh_token: account.refresh_token,
            grant_type: 'refresh_token',
          }),
        })
        const tokens = await res.json()
        if (tokens.access_token) {
          accessToken = tokens.access_token
          await service.from('email_accounts').update({
            access_token: tokens.access_token,
            token_expires_at: tokens.expires_in
              ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
              : null,
          }).eq('id', account.id)
        }
      }
    }

    // Fetch inbox message list
    const listRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&maxResults=20',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!listRes.ok) return NextResponse.json({ messages: [] })

    const listData = await listRes.json()
    const messageIds: string[] = (listData.messages || []).map((m: any) => m.id)
    if (messageIds.length === 0) return NextResponse.json({ messages: [] })

    // Fetch full message with body for each ID
    const fullMessages = await Promise.all(
      messageIds.map(id =>
        fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        ).then(r => r.json())
      )
    )

    const messages = fullMessages.map((msg: any) => {
      const headers: any[] = msg.payload?.headers || []
      const get = (name: string) =>
        headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || ''

      const rawFrom   = get('From')
      const fromMatch = rawFrom.match(/^"?([^"<]+)"?\s*<?([^>]*)>?$/)
      const fromName  = fromMatch?.[1]?.trim() || rawFrom
      const fromEmail = fromMatch?.[2]?.trim() || rawFrom

      let formattedDate = ''
      try {
        const d = new Date(get('Date'))
        const now = new Date()
        formattedDate = d.toDateString() === now.toDateString()
          ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : d.toLocaleDateString([], { month: 'short', day: 'numeric' })
      } catch {}

      // Extract clean readable body
      const body = extractBody(msg.payload)

      // Clean snippet for list preview
      const snippet = (msg.snippet || '')
        .replace(/&#(\d+);/g, (_: string, n: string) => String.fromCharCode(Number(n)))
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
        .trim()

      return {
        id:       msg.id,
        threadId: msg.threadId,
        subject:  get('Subject') || '(no subject)',
        fromName,
        fromEmail,
        date:     formattedDate,
        snippet,
        body:     body || snippet,
        unread:   (msg.labelIds || []).includes('UNREAD'),
      }
    })

    return NextResponse.json({ messages })
  } catch (error: unknown) {
    console.error('[inbox] Error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Failed to load inbox' }, { status: 500 })
  }
}
