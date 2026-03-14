import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()
  const soon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // expires within 7 days

  const { data: expiring } = await supabase
    .from('connected_platforms')
    .select('*')
    .eq('is_active', true)
    .in('platform', ['x', 'tiktok'])
    .not('refresh_token', 'is', null)
    .lte('token_expires_at', soon)

  if (!expiring?.length) return NextResponse.json({ refreshed: 0 })

  const results = []

  for (const conn of expiring) {
    try {
      if (conn.platform === 'x') {
        const clientId = process.env.X_CLIENT_ID!
        const clientSecret = process.env.X_CLIENT_SECRET!
        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

        const res = await fetch('https://api.twitter.com/2/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`,
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: conn.refresh_token,
          }),
        })
        const data = await res.json()
        if (data.access_token) {
          await supabase.from('connected_platforms').update({
            access_token: data.access_token,
            refresh_token: data.refresh_token ?? conn.refresh_token,
            token_expires_at: data.expires_in
              ? new Date(Date.now() + data.expires_in * 1000).toISOString()
              : null,
          }).eq('id', conn.id)
          results.push({ id: conn.id, platform: 'x', status: 'refreshed' })
        }

      } else if (conn.platform === 'tiktok') {
        const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_key: process.env.TIKTOK_CLIENT_KEY!,
            client_secret: process.env.TIKTOK_CLIENT_SECRET!,
            grant_type: 'refresh_token',
            refresh_token: conn.refresh_token,
          }),
        })
        const data = await res.json()
        if (data.access_token) {
          await supabase.from('connected_platforms').update({
            access_token: data.access_token,
            refresh_token: data.refresh_token ?? conn.refresh_token,
            token_expires_at: data.expires_in
              ? new Date(Date.now() + data.expires_in * 1000).toISOString()
              : null,
          }).eq('id', conn.id)
          results.push({ id: conn.id, platform: 'tiktok', status: 'refreshed' })
        }
      }
    } catch (err: any) {
      results.push({ id: conn.id, platform: conn.platform, status: 'error', error: err.message })
    }
  }

  return NextResponse.json({ refreshed: results.filter(r => r.status === 'refreshed').length, results })
}
