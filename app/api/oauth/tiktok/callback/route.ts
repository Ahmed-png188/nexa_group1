import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nexaa.cc'

  const code = searchParams.get('code')
  const stateRaw = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code || !stateRaw) {
    return NextResponse.redirect(`${appUrl}/dashboard/schedule?tab=platforms&error=tiktok_denied`)
  }

  let state: { workspace_id: string; user_id: string }
  try {
    state = JSON.parse(Buffer.from(stateRaw, 'base64').toString())
  } catch {
    return NextResponse.redirect(`${appUrl}/dashboard/schedule?tab=platforms&error=invalid_state`)
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY!
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET!
  const redirectUri = `${appUrl}/api/oauth/tiktok/callback`

  try {
    // Exchange code for token
    const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) throw new Error('No access token')

    // Get user info
    const profileRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,username', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
    })
    const profileData = await profileRes.json()
    const profile = profileData.data?.user ?? {}

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null

    await supabase.from('connected_platforms').upsert({
      workspace_id: state.workspace_id,
      platform: 'tiktok',
      platform_user_id: profile.open_id ?? tokenData.open_id,
      platform_username: profile.username ?? profile.display_name ?? 'tiktok_user',
      platform_name: profile.display_name ?? profile.username ?? 'TikTok User',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token ?? null,
      token_expires_at: expiresAt,
      is_active: true,
      connected_at: new Date().toISOString(),
    }, { onConflict: 'workspace_id,platform' })

    await supabase.from('activity').insert({
      workspace_id: state.workspace_id,
      user_id: state.user_id,
      type: 'platform_connected',
      title: `TikTok connected (${profile.display_name ?? 'user'})`,
    })

    return NextResponse.redirect(`${appUrl}/dashboard/schedule?tab=platforms&connected=tiktok`)

  } catch (err: any) {
    console.error('TikTok OAuth error:', err)
    return NextResponse.redirect(`${appUrl}/dashboard/schedule?tab=platforms&error=tiktok_failed`)
  }
}
