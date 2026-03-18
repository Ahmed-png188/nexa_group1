import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as serviceClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { api_key, workspace_id } = await request.json()
    if (!api_key || !workspace_id) {
      return NextResponse.json({ error: 'Missing api_key or workspace_id' }, { status: 400 })
    }

    // Verify workspace membership
    const { data: member } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .eq('workspace_id', workspace_id)
      .single()
    if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Verify API key with Kit/ConvertKit
    const accountRes = await fetch(`https://api.convertkit.com/v3/account?api_key=${encodeURIComponent(api_key)}`)
    const accountData = await accountRes.json()
    if (!accountData.primary_email_address) {
      return NextResponse.json({ error: 'Invalid Kit API key' }, { status: 400 })
    }

    const service = serviceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Save API key to workspace
    await service.from('workspaces').update({ kit_api_key: api_key }).eq('id', workspace_id)

    // Import subscribers as contacts
    let page = 1
    let imported = 0
    let hasMore = true

    while (hasMore) {
      const subRes = await fetch(`https://api.convertkit.com/v3/subscribers?api_key=${encodeURIComponent(api_key)}&page=${page}&per_page=100`)
      const subData = await subRes.json()
      const subs: any[] = subData.subscribers || []

      if (subs.length === 0) { hasMore = false; break }

      const contacts = subs.map(s => ({
        workspace_id,
        email: s.email_address.toLowerCase().trim(),
        name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email_address,
        first_name: s.first_name || '',
        last_name: s.last_name || '',
        source: 'kit',
        tags: ['kit-subscriber'],
      }))

      const { data: inserted } = await service
        .from('contacts')
        .upsert(contacts, { onConflict: 'workspace_id,email' })
        .select('id')

      imported += inserted?.length ?? 0
      page++

      // Kit limits — stop if fewer than 100 returned
      if (subs.length < 100) hasMore = false
    }

    // Log activity
    try {
      await service.from('activity').insert({
        workspace_id,
        type: 'kit_synced',
        title: `Kit synced — ${imported} subscribers imported`,
      })
    } catch {}

    return NextResponse.json({
      success: true,
      account_email: accountData.primary_email_address,
      imported,
    })
  } catch (error: unknown) {
    console.error('[kit/connect] Error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Kit connect failed' }, { status: 500 })
  }
}
