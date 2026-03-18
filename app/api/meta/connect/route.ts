import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const code = request.nextUrl.searchParams.get('code')
  const workspaceId = request.nextUrl.searchParams.get('state')

  if (!code) return NextResponse.redirect('https://nexaa.cc/dashboard/amplify?error=no_code')
  if (!workspaceId) return NextResponse.redirect('https://nexaa.cc/dashboard/amplify?error=no_state')

  try {
    // Exchange code for token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&redirect_uri=https%3A%2F%2Fnexaa.cc%2Fapi%2Fmeta%2Fconnect&code=${code}`
    )
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) {
      console.error('[Meta Connect] Token error:', tokenData)
      return NextResponse.redirect('https://nexaa.cc/dashboard/amplify?error=token_failed')
    }

    // Get ad accounts
    const accountsRes = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status&access_token=${tokenData.access_token}`
    )
    const accountsData = await accountsRes.json()
    const firstAccount = accountsData.data?.[0]
    const adAccountId = firstAccount?.id || null

    // Get pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${tokenData.access_token}`
    )
    const pagesData = await pagesRes.json()
    const firstPage = pagesData.data?.[0]
    const pageId = firstPage?.id || null

    // Save to Supabase
    const { error } = await supabase
      .from('meta_connections')
      .upsert({
        workspace_id: workspaceId,
        access_token: tokenData.access_token,
        ad_account_id: adAccountId,
        page_id: pageId,
        business_name: firstAccount?.name || firstPage?.name || 'Meta Account',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'workspace_id' })

    if (error) {
      console.error('[Meta Connect] Save error:', error)
      return NextResponse.redirect('https://nexaa.cc/dashboard/amplify?error=save_failed')
    }

    return NextResponse.redirect('https://nexaa.cc/dashboard/amplify?connected=true')
  } catch (err) {
    console.error('[Meta Connect] Error:', err)
    return NextResponse.redirect('https://nexaa.cc/dashboard/amplify?error=failed')
  }
}
