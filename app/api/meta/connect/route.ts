import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect('https://nexaa.cc/auth/login')

  const code = request.nextUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect('https://nexaa.cc/dashboard/amplify?error=no_code')
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${process.env.META_APP_ID}&` +
      `client_secret=${process.env.META_APP_SECRET}&` +
      `redirect_uri=https%3A%2F%2Fnexaa.cc%2Fapi%2Fmeta%2Fconnect&` +
      `code=${code}`
    )
    const tokenData = await tokenRes.json() as { access_token?: string }

    if (!tokenData.access_token) {
      return NextResponse.redirect('https://nexaa.cc/dashboard/amplify?error=token_failed')
    }

    // Get user's ad accounts
    const accountsRes = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?` +
      `access_token=${tokenData.access_token}&` +
      `fields=id,name,account_status`
    )
    const accountsData = await accountsRes.json() as { data?: { id: string; name: string }[] }
    const firstAccount = accountsData.data?.[0]

    // Get workspace
    const { data: member } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .single()

    if (!member) return NextResponse.redirect('https://nexaa.cc/dashboard/amplify?error=no_workspace')

    // Save connection
    await supabase.from('meta_connections').upsert({
      workspace_id: member.workspace_id,
      access_token: tokenData.access_token,
      ad_account_id: firstAccount?.id,
      business_name: firstAccount?.name,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'workspace_id' })

    return NextResponse.redirect('https://nexaa.cc/dashboard/amplify?connected=true')
  } catch (error) {
    console.error('[Meta Connect]', error)
    return NextResponse.redirect('https://nexaa.cc/dashboard/amplify?error=failed')
  }
}
