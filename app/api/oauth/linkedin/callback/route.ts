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
    return NextResponse.redirect(`${appUrl}/dashboard/schedule?tab=platforms&error=linkedin_denied`)
  }

  let state: { workspace_id: string; user_id: string }
  try {
    state = JSON.parse(Buffer.from(stateRaw, 'base64').toString())
  } catch {
    return NextResponse.redirect(`${appUrl}/dashboard/schedule?tab=platforms&error=invalid_state`)
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID!
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!
  const redirectUri = `${appUrl}/api/oauth/linkedin/callback`

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) throw new Error('No access token')

    // Get user profile via OpenID
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
    })
    const profile = await profileRes.json()

    const username = profile.email ?? profile.sub
    const displayName = `${profile.given_name ?? ''} ${profile.family_name ?? ''}`.trim()
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null

    await supabase.from('connected_platforms').upsert({
      workspace_id: state.workspace_id,
      platform: 'linkedin',
      platform_user_id: profile.sub,
      platform_username: username,
      platform_name: displayName,
      access_token: tokenData.access_token,
      token_expires_at: expiresAt,
      is_active: true,
      connected_at: new Date().toISOString(),
    }, { onConflict: 'workspace_id,platform' })

    await supabase.from('activity').insert({
      workspace_id: state.workspace_id,
      user_id: state.user_id,
      type: 'platform_connected',
      title: `LinkedIn connected (${displayName})`,
    })

    return NextResponse.redirect(`${appUrl}/dashboard/schedule?tab=platforms&connected=linkedin`)

  } catch (err: any) {
    console.error('LinkedIn OAuth error:', err)
    return NextResponse.redirect(`${appUrl}/dashboard/schedule?tab=platforms&error=linkedin_failed`)
  }
}
