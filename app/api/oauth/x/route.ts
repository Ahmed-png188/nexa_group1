import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHash, randomBytes } from 'crypto'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/auth/login', request.url))

  const { searchParams } = new URL(request.url)
  const workspace_id = searchParams.get('workspace_id')
  if (!workspace_id) return NextResponse.json({ error: 'Missing workspace_id' }, { status: 400 })

  const clientId = process.env.X_CLIENT_ID!
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nexaa.cc'
  const redirectUri = `${appUrl}/api/oauth/x/callback`

  // PKCE code verifier + challenge
  const codeVerifier = randomBytes(32).toString('base64url')
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url')

  // State carries workspace, user, and PKCE verifier
  const statePayload = { workspace_id, user_id: user.id, code_verifier: codeVerifier }
  const state = Buffer.from(JSON.stringify(statePayload)).toString('base64')

  const authUrl = new URL('https://twitter.com/i/oauth2/authorize')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', 'tweet.read tweet.write users.read offline.access')
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('code_challenge', codeChallenge)
  authUrl.searchParams.set('code_challenge_method', 'S256')

  return NextResponse.redirect(authUrl.toString())
}
