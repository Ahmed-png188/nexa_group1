import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const code = request.nextUrl.searchParams.get('code')
  const workspaceId = request.nextUrl.searchParams.get('state')

  console.log('[Meta Connect] Step 1 - code present:', !!code, '| workspaceId:', workspaceId)

  if (!code) return NextResponse.redirect('https://nexaa.cc/dashboard/amplify?error=no_code')
  if (!workspaceId) return NextResponse.redirect('https://nexaa.cc/dashboard/amplify?error=no_state')

  try {
    // Exchange code for token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&redirect_uri=https%3A%2F%2Fnexaa.cc%2Fapi%2Fmeta%2Fconnect&code=${code}`
    )
    const tokenData = await tokenRes.json()
    console.log('[Meta Connect] Step 2 - token present:', !!tokenData?.access_token, '| error:', tokenData?.error, '| error_description:', tokenData?.error_description)
    if (!tokenData.access_token) {
      console.error('[Meta Connect] Token error:', tokenData)
      return NextResponse.redirect('https://nexaa.cc/dashboard/amplify?error=token_failed')
    }

    // Get ad accounts
    const accountsRes = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status&access_token=${tokenData.access_token}`
    )
    const accountsData = await accountsRes.json()
    console.log('[Meta Connect] Step 3 - adaccounts raw:', JSON.stringify(accountsData).slice(0, 200))
    const activeAccount = accountsData.data?.find((a: any) => a.account_status === 1) || accountsData.data?.[0]
    const adAccountId = activeAccount?.id || null
    console.log('[Meta Connect] Step 3b - selected account:', adAccountId, 'status:', activeAccount?.account_status)

    // Get pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${tokenData.access_token}`
    )
    const pagesData = await pagesRes.json()
    console.log('[Meta Connect] Step 4 - pages raw:', JSON.stringify(pagesData).slice(0, 200))
    const firstPage = pagesData.data?.[0]
    const pageId = firstPage?.id || null

    console.log('[Meta Connect] Step 5 - upserting workspace_id:', workspaceId, '| ad_account_id:', adAccountId, '| page_id:', pageId)

    // Delete existing connection first to avoid unique constraint conflicts
    await supabase
      .from('meta_connections')
      .delete()
      .eq('workspace_id', workspaceId)

    // Then insert fresh
    const { error: insertError } = await supabase
      .from('meta_connections')
      .insert({
        workspace_id: workspaceId,
        access_token: tokenData.access_token,
        ad_account_id: adAccountId,
        page_id: pageId,
        business_name: activeAccount?.name || firstPage?.name || 'Meta Account',
        updated_at: new Date().toISOString(),
      })

    console.log('[Meta Connect] Step 6 - insert error:', insertError?.message, insertError?.code, insertError?.details)

    if (insertError) {
      return NextResponse.redirect('https://nexaa.cc/dashboard/amplify?error=save_failed&reason=' + encodeURIComponent(insertError.message))
    }

    return NextResponse.redirect('https://nexaa.cc/dashboard/amplify?connected=true')
  } catch (err) {
    console.error('[Meta Connect] Error:', err)
    return NextResponse.redirect('https://nexaa.cc/dashboard/amplify?error=failed')
  }
}
