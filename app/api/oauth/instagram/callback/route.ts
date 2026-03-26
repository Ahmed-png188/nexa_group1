export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { guardWorkspace } from '@/lib/workspace-guard'


export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nexaa.cc'

  const code = searchParams.get('code')
  const stateRaw = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code || !stateRaw) {
    return NextResponse.redirect(`${appUrl}/dashboard/schedule?error=instagram_denied`)
  }

  let state: { workspace_id: string; user_id: string }
  try {
    state = JSON.parse(Buffer.from(stateRaw, 'base64').toString())
  } catch {
    return NextResponse.redirect(`${appUrl}/dashboard/schedule?error=invalid_state`)
  }

  // Verify the current user is authorized for the workspace in state
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${appUrl}/auth/login`)
  const deny = await guardWorkspace(supabase, state.workspace_id, user.id)
  if (deny) return NextResponse.redirect(`${appUrl}/dashboard/schedule?error=unauthorized`)

  const appId = process.env.INSTAGRAM_APP_ID!
  const appSecret = process.env.INSTAGRAM_APP_SECRET!
  const redirectUri = `${appUrl}/api/oauth/instagram/callback`

  try {
    // Exchange code for short-lived token
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
    if (!tokenData.access_token) throw new Error('No access token')

    // Exchange for long-lived token
    const longRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${tokenData.access_token}`
    )
    const longData = await longRes.json()
    const finalToken = longData.access_token ?? tokenData.access_token

    // Get profile
    const profileRes = await fetch(
      `https://graph.instagram.com/v19.0/me?fields=id,username&access_token=${finalToken}`
    )
    const profile = await profileRes.json()

    const expiresAt = longData.expires_in
      ? new Date(Date.now() + longData.expires_in * 1000).toISOString()
      : null

    await supabase.from('connected_platforms').upsert({
      workspace_id: state.workspace_id,
      platform: 'instagram',
      platform_user_id: profile.id ?? tokenData.user_id,
      platform_username: profile.username ?? 'instagram_user',
      platform_name: profile.username ?? 'Instagram',
      access_token: finalToken,
      token_expires_at: expiresAt,
      is_active: true,
      connected_at: new Date().toISOString(),
    }, { onConflict: 'workspace_id,platform' })

    await supabase.from('activity').insert({
      workspace_id: state.workspace_id,
      user_id: state.user_id,
      type: 'platform_connected',
      title: `Instagram connected (@${profile.username ?? 'user'})`,
    })

    return NextResponse.redirect(`${appUrl}/dashboard/schedule?connected=instagram`)

  } catch (err: any) {
    console.error('Instagram OAuth error:', err)
    return NextResponse.redirect(`${appUrl}/dashboard/schedule?error=instagram_failed`)
  }
}
