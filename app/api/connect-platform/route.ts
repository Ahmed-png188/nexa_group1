export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { checkPlanAccess } from '@/lib/plan-gate'
import { createClient } from '@/lib/supabase/server'


// Platform OAuth config
// In production, replace these with your real OAuth app credentials
const PLATFORM_CONFIG: Record<string, { auth_url: string; name: string }> = {
  instagram: {
    name: 'Instagram',
    auth_url: 'https://api.instagram.com/oauth/authorize',
  },
  linkedin: {
    name: 'LinkedIn',
    auth_url: 'https://www.linkedin.com/oauth/v2/authorization',
  },
  x: {
    name: 'X / Twitter',
    auth_url: 'https://twitter.com/i/oauth2/authorize',
  },
  tiktok: {
    name: 'TikTok',
    auth_url: 'https://www.tiktok.com/auth/authorize/',
  },
}

// GET — returns connection status for all platforms
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    // Plan gate
    const _planErr = await checkPlanAccess(workspace_id, 'schedule')
    if (_planErr) return _planErr

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const workspace_id = searchParams.get('workspace_id')

    const { data: connections } = await supabase
      .from('connected_platforms')
      .select('platform, platform_username, platform_name, is_active, connected_at, last_synced_at')
      .eq('workspace_id', workspace_id)

    return NextResponse.json({ connections: connections ?? [] })

  } catch (error: unknown) {
    return NextResponse.json({ error: 'Failed to get connections' }, { status: 500 })
  }
}

// POST — save a platform connection (after OAuth callback)
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, platform, access_token, platform_username, platform_name, platform_user_id } = await request.json()

    // Upsert connection
    await supabase.from('connected_platforms').upsert({
      workspace_id,
      platform,
      platform_user_id: platform_user_id ?? platform_username,
      platform_username,
      platform_name: platform_name ?? platform_username,
      access_token,
      is_active: true,
      connected_at: new Date().toISOString(),
    }, { onConflict: 'workspace_id,platform' })

    // Log activity
    await supabase.from('activity').insert({
      workspace_id,
      user_id: user.id,
      type: 'platform_connected',
      title: `${PLATFORM_CONFIG[platform]?.name ?? platform} connected`,
    })

    return NextResponse.json({ success: true })

  } catch (error: unknown) {
    return NextResponse.json({ error: 'Failed to connect platform' }, { status: 500 })
  }
}

// DELETE — disconnect a platform
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, platform } = await request.json()

    await supabase.from('connected_platforms')
      .update({ is_active: false })
      .eq('workspace_id', workspace_id)
      .eq('platform', platform)

    return NextResponse.json({ success: true })

  } catch (error: unknown) {
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }
}
