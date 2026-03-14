import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/auth/login', request.url))

  const { searchParams } = new URL(request.url)
  const workspace_id = searchParams.get('workspace_id')
  if (!workspace_id) return NextResponse.json({ error: 'Missing workspace_id' }, { status: 400 })

  const clientId = process.env.LINKEDIN_CLIENT_ID!
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nexaa.cc'
  const redirectUri = `${appUrl}/api/oauth/linkedin/callback`
  const state = Buffer.from(JSON.stringify({ workspace_id, user_id: user.id })).toString('base64')

  const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', 'openid profile email w_member_social')
  authUrl.searchParams.set('state', state)

  return NextResponse.redirect(authUrl.toString())
}
