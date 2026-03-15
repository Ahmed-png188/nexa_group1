import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Syncs real performance data from connected platforms
 * Currently: reads from Supabase (our data)
 * Future: will pull from Instagram Graph API, LinkedIn API, X API when approved
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id } = await request.json()

    // Get connected platforms
    const { data: platforms } = await supabase
      .from('connected_platforms')
      .select('*')
      .eq('workspace_id', workspace_id)
      .eq('is_active', true)

    const syncResults: any[] = []

    for (const platform of platforms || []) {

      // ── INSTAGRAM (ready when app approved) ──
      if (platform.platform === 'instagram' && platform.access_token) {
        try {
          // When Instagram app is approved, this will pull real data:
          // const mediaRes = await fetch(`https://graph.instagram.com/v19.0/me/media?fields=id,caption,like_count,comments_count,reach,impressions,timestamp&access_token=${platform.access_token}`)
          // const mediaData = await mediaRes.json()
          // For now, mark as ready but not synced
          syncResults.push({ platform: 'instagram', status: 'ready', message: 'Awaiting app review approval to pull live data' })
        } catch (err: any) {
          syncResults.push({ platform: 'instagram', status: 'error', message: err.message })
        }
      }

      // ── LINKEDIN (ready when credentials verified) ──
      if (platform.platform === 'linkedin' && platform.access_token) {
        try {
          // When LinkedIn is connected:
          // const postsRes = await fetch('https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(urn:li:person:...)', { headers: { Authorization: `Bearer ${platform.access_token}` } })
          syncResults.push({ platform: 'linkedin', status: 'ready', message: 'Awaiting credentials to pull live data' })
        } catch (err: any) {
          syncResults.push({ platform: 'linkedin', status: 'error', message: err.message })
        }
      }

      // ── X ──
      if (platform.platform === 'x' && platform.access_token) {
        syncResults.push({ platform: 'x', status: 'ready', message: 'Awaiting credentials to pull live data' })
      }
    }

    // Update last_synced_at for all platforms
    if (platforms && platforms.length > 0) {
      await supabase
        .from('connected_platforms')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('workspace_id', workspace_id)
    }

    await supabase.from('activity').insert({
      workspace_id,
      user_id: user.id,
      type: 'data_synced',
      title: `Platform data sync attempted — ${syncResults.length} platform${syncResults.length !== 1 ? 's' : ''} checked`,
      metadata: { sync_results: syncResults },
    })

    return NextResponse.json({
      success: true,
      synced: syncResults,
      message: syncResults.length > 0
        ? 'Platforms checked. Live data will flow automatically once platform apps are approved.'
        : 'No platforms connected. Connect platforms in Schedule → Platforms.',
    })

  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
