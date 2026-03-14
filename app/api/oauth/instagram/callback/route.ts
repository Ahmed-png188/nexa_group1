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
    return NextResponse.redirect(`${appUrl}/dashboard/schedule?tab=platforms&error=instagram_denied`)
  }

  let state: { workspace_id: string; user_id: string }
  try {
    state = JSON.parse(Buffer.from(stateRaw, 'base64').toString())
  } catch {
    return NextResponse.redirect(`${appUrl}/dashboard/schedule?tab=platforms&error=invalid_state`)
  }

  const appId = process.env.INSTAGRAM_APP_ID!
  const appSecret = process.env.INSTAGRAM_APP_SECRET!
  const redirectUri = `${appUrl}/api/oauth/instagram/callback`

  try {
    // Step 1: Exchange code for short-lived token
    const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) throw new Error('No access token returned')

    // Step 2: Exchange for long-lived token (60 days)
    const longLivedRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${tokenData.access_token}`
    )
    const longLivedData = await longLivedRes.json()
    const finalToken = longLivedData.access_token ?? tokenData.access_token

    // Step 3: Get user profile
    const profileRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username&access_token=${finalToken}`
    )
    const profile = await profileRes.json()

    // Step 4: Save to DB
    const expiresAt = longLivedData.expires_in
      ? new Date(Date.now() + longLivedData.expires_in * 1000).toISOString()
      : null

    await supabase.from('connected_platforms').upsert({
      workspace_id: state.workspace_id,
      platform: 'instagram',
      platform_user_id: profile.id,
      platform_username: profile.username,
      platform_name: profile.username,
      access_token: finalToken,
      token_expires_at: expiresAt,
      is_active: true,
      connected_at: new Date().toISOString(),
    }, { onConflict: 'workspace_id,platform' })

    await supabase.from('activity').insert({
      workspace_id: state.workspace_id,
      user_id: state.user_id,
      type: 'platform_connected',
      title: `Instagram connected (@${profile.username})`,
    })

    return NextResponse.redirect(`${appUrl}/dashboard/schedule?tab=platforms&connected=instagram`)

  } catch (err: any) {
    console.error('Instagram OAuth error:', err)
    return NextResponse.redirect(`${appUrl}/dashboard/schedule?tab=platforms&error=instagram_failed`)
  }
}
