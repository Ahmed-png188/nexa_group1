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
    // Step 1: Exchange code for Facebook access token
    const tokenRes = await fetch('https://graph.facebook.com/v19.0/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code,
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) throw new Error('No access token returned')

    // Step 2: Get long-lived token
    const longLivedRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
    )
    const longLivedData = await longLivedRes.json()
    const finalToken = longLivedData.access_token ?? tokenData.access_token

    // Step 3: Get Facebook user's connected Instagram accounts
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${finalToken}`
    )
    const pagesData = await pagesRes.json()
    const page = pagesData.data?.[0]

    let igUserId = null
    let igUsername = 'instagram_user'

    if (page) {
      // Get Instagram Business Account connected to this Facebook Page
      const igRes = await fetch(
        `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token ?? finalToken}`
      )
      const igData = await igRes.json()
      igUserId = igData.instagram_business_account?.id

      if (igUserId) {
        const igProfileRes = await fetch(
          `https://graph.facebook.com/v19.0/${igUserId}?fields=username&access_token=${finalToken}`
        )
        const igProfile = await igProfileRes.json()
        igUsername = igProfile.username ?? igUsername
      }
    }

    // Step 4: Get basic Facebook user info as fallback
    const meRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${finalToken}`)
    const meData = await meRes.json()

    const expiresAt = longLivedData.expires_in
      ? new Date(Date.now() + longLivedData.expires_in * 1000).toISOString()
      : null

    await supabase.from('connected_platforms').upsert({
      workspace_id: state.workspace_id,
      platform: 'instagram',
      platform_user_id: igUserId ?? meData.id,
      platform_username: igUsername,
      platform_name: igUsername,
      access_token: finalToken,
      token_expires_at: expiresAt,
      is_active: true,
      connected_at: new Date().toISOString(),
    }, { onConflict: 'workspace_id,platform' })

    await supabase.from('activity').insert({
      workspace_id: state.workspace_id,
      user_id: state.user_id,
      type: 'platform_connected',
      title: `Instagram connected (@${igUsername})`,
    })

    return NextResponse.redirect(`${appUrl}/dashboard/schedule?connected=instagram`)

  } catch (err: any) {
    console.error('Instagram OAuth error:', err)
    return NextResponse.redirect(`${appUrl}/dashboard/schedule?error=instagram_failed`)
  }
}
