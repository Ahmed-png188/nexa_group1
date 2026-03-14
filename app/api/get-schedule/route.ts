import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const workspace_id = searchParams.get('workspace_id')
    const year = parseInt(searchParams.get('year') ?? new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') ?? (new Date().getMonth() + 1).toString())

    if (!workspace_id) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })

    // Get start and end of month
    const start = new Date(year, month - 1, 1).toISOString()
    const end = new Date(year, month, 0, 23, 59, 59).toISOString()

    const { data: scheduled } = await supabase
      .from('content')
      .select('*')
      .eq('workspace_id', workspace_id)
      .in('status', ['scheduled', 'published'])
      .gte('scheduled_for', start)
      .lte('scheduled_for', end)
      .order('scheduled_for', { ascending: true })

    // Also get drafts for the queue
    const { data: drafts } = await supabase
      .from('content')
      .select('*')
      .eq('workspace_id', workspace_id)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(20)

    // Get connected platforms
    const { data: platforms } = await supabase
      .from('connected_platforms')
      .select('platform, platform_username, is_active')
      .eq('workspace_id', workspace_id)

    return NextResponse.json({
      scheduled: scheduled ?? [],
      drafts: drafts ?? [],
      platforms: platforms ?? [],
    })

  } catch (error: any) {
    console.error('Get schedule error:', error)
    return NextResponse.json({ error: 'Failed to get schedule' }, { status: 500 })
  }
}
