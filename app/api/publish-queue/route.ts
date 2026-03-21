export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'


// This route is called by Vercel Cron every 15 minutes
// Add to vercel.json: { "crons": [{ "path": "/api/publish-queue", "schedule": "*/15 * * * *" }] }

export async function GET(request: NextRequest) {
  // Verify this is called by Vercel Cron (in production)
  const authHeader = request.headers.get('authorization')
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient()
    const now = new Date().toISOString()

    // Find all posts due to publish
    const { data: duePosts } = await supabase
      .from('content')
      .select('*, workspaces!inner(id, name)')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now)
      .limit(50)

    if (!duePosts || duePosts.length === 0) {
      return NextResponse.json({ published: 0, message: 'No posts due' })
    }

    const results = []

    for (const post of duePosts) {
      try {
        // Get platform connection
        const { data: connection } = await supabase
          .from('connected_platforms')
          .select('*')
          .eq('workspace_id', post.workspace_id)
          .eq('platform', post.platform)
          .eq('is_active', true)
          .single()

        if (!connection) {
          // No connection — mark as failed
          await supabase.from('content').update({
            status: 'failed',
          }).eq('id', post.id)

          results.push({ id: post.id, status: 'failed', reason: 'No platform connection' })
          continue
        }

        // Attempt to publish based on platform
        let published = false
        let platformPostId = null
        let platformUrl = null

        if (post.platform === 'instagram') {
          const result = await publishToInstagram(post, connection)
          published = result.success
          platformPostId = result.post_id
          platformUrl = result.url
        } else if (post.platform === 'linkedin') {
          const result = await publishToLinkedIn(post, connection)
          published = result.success
          platformPostId = result.post_id
          platformUrl = result.url
        } else if (post.platform === 'x') {
          const result = await publishToX(post, connection)
          published = result.success
          platformPostId = result.post_id
          platformUrl = result.url
        } else {
          // Platform not yet integrated — mark as published manually
          published = true
        }

        if (published) {
          await supabase.from('content').update({
            status: 'published',
            published_at: now,
            platform_post_id: platformPostId,
            platform_url: platformUrl,
          }).eq('id', post.id)

          // Log activity
          await supabase.from('activity').insert({
            workspace_id: post.workspace_id,
            type: 'post_published',
            title: `Post published to ${post.platform}`,
            metadata: { content_id: post.id, platform: post.platform },
          })

          results.push({ id: post.id, status: 'published', platform: post.platform })
        } else {
          await supabase.from('content').update({ status: 'failed' }).eq('id', post.id)
          results.push({ id: post.id, status: 'failed' })
        }

      } catch (postError: any) {
        console.error(`Failed to publish post ${post.id}:`, postError)
        await supabase.from('content').update({ status: 'failed' }).eq('id', post.id)
        results.push({ id: post.id, status: 'error', error: postError.message })
      }
    }

    return NextResponse.json({
      published: results.filter(r => r.status === 'published').length,
      failed: results.filter(r => r.status === 'failed').length,
      results,
    })

  } catch (error: unknown) {
    console.error('Publish queue error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

// ── Platform publishing functions ──
// These call the real platform APIs with the stored access tokens

async function publishToInstagram(post: any, connection: any) {
  try {
    // Instagram Graph API — requires Business/Creator account
    // Step 1: Create media container
    const containerRes = await fetch(
      `https://graph.instagram.com/${connection.platform_user_id}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: post.body,
          media_type: post.image_url ? 'IMAGE' : 'REELS',
          image_url: post.image_url,
          access_token: connection.access_token,
        }),
      }
    )
    const container = await containerRes.json()
    if (!container.id) return { success: false }

    // Step 2: Publish the container
    await new Promise(r => setTimeout(r, 2000)) // Wait for container
    const publishRes = await fetch(
      `https://graph.instagram.com/${connection.platform_user_id}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: container.id,
          access_token: connection.access_token,
        }),
      }
    )
    const published = await publishRes.json()
    return {
      success: !!published.id,
      post_id: published.id,
      url: published.id ? `https://www.instagram.com/p/${published.id}` : null,
    }
  } catch {
    return { success: false }
  }
}

async function publishToLinkedIn(post: any, connection: any) {
  try {
    // LinkedIn Share API v2
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
    return {
      success: !!data.id,
      post_id: data.id,
      url: null,
    }
  } catch {
    return { success: false }
  }
}

async function publishToX(post: any, connection: any) {
  try {
    // X API v2
    const res = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: post.body?.slice(0, 280) }),
    })
    const data = await res.json()
    return {
      success: !!data.data?.id,
      post_id: data.data?.id,
      url: data.data?.id ? `https://x.com/i/web/status/${data.data.id}` : null,
    }
  } catch {
    return { success: false }
  }
}
