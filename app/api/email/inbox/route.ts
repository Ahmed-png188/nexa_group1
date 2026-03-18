import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as serviceClient } from '@supabase/supabase-js'

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

    if (!account?.access_token) {
      return NextResponse.json({ messages: [] })
    }

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
          const newExpiry = tokens.expires_in
            ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
            : null
          await service.from('email_accounts').update({
            access_token: tokens.access_token,
            token_expires_at: newExpiry,
          }).eq('id', account.id)
        }
      }
    }

    // Fetch INBOX message IDs
    const listRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&maxResults=20',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!listRes.ok) {
      const err = await listRes.json()
      console.error('[inbox] Gmail list error:', err)
      return NextResponse.json({ messages: [] })
    }

    const listData = await listRes.json()
    const messageIds: string[] = (listData.messages || []).map((m: any) => m.id)

    if (messageIds.length === 0) return NextResponse.json({ messages: [] })

    // Fetch metadata for each message (parallel, limit 20)
    const metaRequests = messageIds.map(id =>
      fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      ).then(r => r.json())
    )

    const metas = await Promise.all(metaRequests)

    const messages = metas.map((meta: any) => {
      const headers: any[] = meta.payload?.headers || []
      const get = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || ''

      const rawFrom = get('From')
      const fromMatch = rawFrom.match(/^"?([^"<]+)"?\s*<?([^>]*)>?$/)
      const fromName = fromMatch?.[1]?.trim() || rawFrom
      const fromEmail = fromMatch?.[2]?.trim() || rawFrom

      const rawDate = get('Date')
      let formattedDate = ''
      try {
        const d = new Date(rawDate)
        const now = new Date()
        const isToday = d.toDateString() === now.toDateString()
        formattedDate = isToday
          ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : d.toLocaleDateString([], { month: 'short', day: 'numeric' })
      } catch {}

      return {
        id: meta.id,
        threadId: meta.threadId,
        subject: get('Subject') || '(no subject)',
        fromName,
        fromEmail,
        date: formattedDate,
        snippet: meta.snippet || '',
        unread: (meta.labelIds || []).includes('UNREAD'),
      }
    })

    return NextResponse.json({ messages })
  } catch (error: unknown) {
    console.error('[inbox] Error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Failed to load inbox' }, { status: 500 })
  }
}
