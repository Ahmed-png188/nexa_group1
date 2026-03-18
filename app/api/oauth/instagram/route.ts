import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/auth/login', request.url))

  const { searchParams } = new URL(request.url)
  const workspace_id = searchParams.get('workspace_id')
  if (!workspace_id) return NextResponse.json({ error: 'Missing workspace_id' }, { status: 400 })
  if (!process.env.INSTAGRAM_APP_ID) {
    return NextResponse.redirect(new URL(`/dashboard/schedule?error=instagram_not_configured`, request.url))
  }

  const appId = process.env.INSTAGRAM_APP_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nexaa.cc'
  const redirectUri = `${appUrl}/api/oauth/instagram/callback`

  const state = Buffer.from(JSON.stringify({ workspace_id, user_id: user.id })).toString('base64')

  // Instagram Login OAuth
  const authUrl = new URL('https://api.instagram.com/oauth/authorize')
  authUrl.searchParams.set('client_id', appId!)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_messages,instagram_business_manage_comments')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('state', state)

  return NextResponse.redirect(authUrl.toString())
}
