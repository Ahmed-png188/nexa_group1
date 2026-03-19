import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const code = request.nextUrl.searchParams.get('code')
  const workspaceId = request.nextUrl.searchParams.get('state')

  console.log('[Gmail Connect] Step 1 - code:', !!code, 'workspaceId:', workspaceId)

  if (!code || !workspaceId) {
    return NextResponse.redirect('https://nexaa.cc/dashboard/automate?error=missing_params')
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: 'https://nexaa.cc/api/email/gmail/callback',
        grant_type: 'authorization_code',
      }),
    })
    const tokens = await tokenRes.json()

    console.log('[Gmail Connect] Step 2 - tokens:', !!tokens.access_token, 'error:', tokens.error)

    if (!tokens.access_token) {
      return NextResponse.redirect('https://nexaa.cc/dashboard/automate?error=token_failed')
    }

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const userInfo = await userRes.json()

    console.log('[Gmail Connect] Step 3 - userInfo fetched, saving to workspace:', workspaceId)

    // Delete existing record first to avoid constraint conflicts
    await supabase
      .from('email_accounts')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('provider', 'gmail')

    // Then insert fresh
    const { error: insertError } = await supabase
      .from('email_accounts')
      .insert({
        workspace_id: workspaceId,
        provider: 'gmail',
        email: userInfo.email,
        name: userInfo.name,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        token_expires_at: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          : null,
        is_active: true,
      })

    console.log('[Gmail Connect] Insert error:', insertError?.message, insertError?.code)

    if (insertError) {
      return NextResponse.redirect(
        'https://nexaa.cc/dashboard/automate?error=save_failed&reason=' +
        encodeURIComponent(insertError.message || 'unknown')
      )
    }

    return NextResponse.redirect('https://nexaa.cc/dashboard/automate?gmail_connected=true')
  } catch (err) {
    console.error('[Gmail Connect] Error:', err instanceof Error ? err.message : 'Unknown')
    return NextResponse.redirect('https://nexaa.cc/dashboard/automate?error=failed')
  }
}
