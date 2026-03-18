import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { guardWorkspace } from '@/lib/workspace-guard'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, content_id, platform, scheduled_for, title, body, type, strategy_day_id } = await request.json()

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    // Deduct 1 credit for scheduling
    const { data: deducted } = await supabase.rpc('deduct_credits', {
      p_workspace_id: workspace_id,
      p_amount: 1,
      p_action: 'schedule_post',
      p_user_id: user.id,
      p_description: `Scheduled ${type ?? 'post'} for ${platform}`,
    })

    if (!deducted) {
      return NextResponse.json({ error: 'Insufficient credits', message: 'Scheduling costs 1 credit.' }, { status: 402 })
    }

    let savedId = content_id

    if (content_id) {
      // Update existing content piece
      await supabase.from('content').update({
        status: 'scheduled',
        platform,
        scheduled_for,
      }).eq('id', content_id)
    } else {
      // Create new content entry
      const { data: newContent } = await supabase.from('content').insert({
        workspace_id,
        created_by: user.id,
        type: type ?? 'post',
        platform,
        status: 'scheduled',
        title,
        body,
        scheduled_for,
        credits_used: 1,
      }).select().single()
      savedId = newContent?.id
    }

    // Log activity
    await supabase.from('activity').insert({
      workspace_id,
      user_id: user.id,
      type: 'post_scheduled',
      title: `Post scheduled for ${platform} · ${new Date(scheduled_for).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
      metadata: { content_id: savedId, platform, scheduled_for },
    })

    // Mark strategy day complete if linked
    if (strategy_day_id) {
      try {
        const { data: plan } = await supabase
          .from('strategy_plans')
          .select('daily_plan')
          .eq('workspace_id', workspace_id)
          .eq('status', 'active')
          .single()

        if (plan?.daily_plan) {
          const dayNum = parseInt(strategy_day_id)
          const updatedPlan = (plan.daily_plan as any[]).map((day: any, i: number) =>
            (day.day ?? i + 1) === dayNum ? { ...day, status: 'scheduled', content_id: savedId } : day
          )
          await supabase
            .from('strategy_plans')
            .update({ daily_plan: updatedPlan })
            .eq('workspace_id', workspace_id)
            .eq('status', 'active')
        }
      } catch { /* non-fatal */ }
    }

    return NextResponse.json({ success: true, content_id: savedId })

  } catch (error: any) {
    console.error('Schedule error:', error)
    return NextResponse.json({ error: 'Failed to schedule post' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { content_id } = await request.json()

    await supabase.from('content').update({
      status: 'draft',
      scheduled_for: null,
    }).eq('id', content_id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to unschedule' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { content_id, action } = await request.json()
    if (action !== 'publish') return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

    // Get the content
    const { data: post } = await supabase.from('content').select('*').eq('id', content_id).single()
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    // Get platform connection
    const { data: connection } = await supabase
      .from('connected_platforms')
      .select('*')
      .eq('workspace_id', post.workspace_id)
      .eq('platform', post.platform)
      .eq('is_active', true)
      .single()

    let published = false
    let platformPostId = null

    if (connection?.access_token) {
      // Try to publish via platform API
      if (post.platform === 'linkedin') {
        try {
          const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${connection.access_token}`,
              'Content-Type': 'application/json',
              'X-Restli-Protocol-Version': '2.0.0',
            },
            body: JSON.stringify({
              author: `urn:li:person:${connection.platform_user_id}`,
              lifecycleState: 'PUBLISHED',
              specificContent: {
                'com.linkedin.ugc.ShareContent': {
                  shareCommentary: { text: post.body },
                  shareMediaCategory: 'NONE',
                },
              },
              visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
            }),
          })
          const data = await res.json()
          if (data.id) { published = true; platformPostId = data.id }
        } catch {}
      } else if (post.platform === 'x') {
        try {
          const res = await fetch('https://api.twitter.com/2/tweets', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${connection.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: post.body?.slice(0, 280) }),
          })
          const data = await res.json()
          if (data.data?.id) { published = true; platformPostId = data.data.id }
        } catch {}
      } else {
        // Platform integration pending — mark as published manually
        published = true
      }
    } else {
      // No connection — mark as published (manual)
      published = true
    }

    await supabase.from('content').update({
      status: 'published',
      published_at: new Date().toISOString(),
      platform_post_id: platformPostId,
    }).eq('id', content_id)

    await supabase.from('activity').insert({
      workspace_id: post.workspace_id,
      user_id: user.id,
      type: 'post_published',
      title: `Post published to ${post.platform}`,
      metadata: { content_id, platform: post.platform, manual: !connection },
    })

    return NextResponse.json({ success: true, published })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to publish' }, { status: 500 })
  }
}
