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
    return NextResponse.redirect(`${appUrl}/dashboard/schedule?tab=platforms&error=x_denied`)
  }

  let state: { workspace_id: string; user_id: string; code_verifier: string }
  try {
    state = JSON.parse(Buffer.from(stateRaw, 'base64').toString())
  } catch {
    return NextResponse.redirect(`${appUrl}/dashboard/schedule?tab=platforms&error=invalid_state`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${appUrl}/auth/login`)
  const deny = await guardWorkspace(supabase, state.workspace_id, user.id)
  if (deny) return NextResponse.redirect(`${appUrl}/dashboard/schedule?tab=platforms&error=unauthorized`)

  const clientId = process.env.X_CLIENT_ID!
  const clientSecret = process.env.X_CLIENT_SECRET!
  const redirectUri = `${appUrl}/api/oauth/x/callback`

  try {
    // Exchange code + PKCE verifier for tokens
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: state.code_verifier,
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) throw new Error('No access token')

    // Get user profile
    const profileRes = await fetch('https://api.twitter.com/2/users/me?user.fields=username,name', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
    })
    const profileData = await profileRes.json()
    const profile = profileData.data

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null

    await supabase.from('connected_platforms').upsert({
      workspace_id: state.workspace_id,
      platform: 'x',
      platform_user_id: profile.id,
      platform_username: profile.username,
      platform_name: profile.name,
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
      title: `X connected (@${profile.username})`,
    })

    return NextResponse.redirect(`${appUrl}/dashboard/schedule?tab=platforms&connected=x`)

  } catch (err: any) {
    console.error('X OAuth error:', err)
    return NextResponse.redirect(`${appUrl}/dashboard/schedule?tab=platforms&error=x_failed`)
  }
}
