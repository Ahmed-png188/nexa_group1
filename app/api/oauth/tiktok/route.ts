export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'


export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/auth/login', request.url))

  const { searchParams } = new URL(request.url)
  const workspace_id = searchParams.get('workspace_id')
  if (!workspace_id) return NextResponse.json({ error: 'Missing workspace_id' }, { status: 400 })
  if (!process.env.TIKTOK_CLIENT_KEY) {
    return NextResponse.redirect(new URL(`/dashboard/schedule?error=tiktok_not_configured`, request.url))
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY!
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nexaa.cc'
  const redirectUri = `${appUrl}/api/oauth/tiktok/callback`
  const csrfState = randomBytes(16).toString('hex')
  const state = Buffer.from(JSON.stringify({ workspace_id, user_id: user.id, csrf: csrfState })).toString('base64')

  const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/')
  authUrl.searchParams.set('client_key', clientKey)
  authUrl.searchParams.set('scope', 'user.info.basic,video.publish,video.upload')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('state', state)

  return NextResponse.redirect(authUrl.toString())
}
