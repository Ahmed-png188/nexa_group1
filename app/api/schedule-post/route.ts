import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, content_id, platform, scheduled_for, title, body, type } = await request.json()

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
