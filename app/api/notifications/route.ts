import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { guardWorkspace } from '@/lib/workspace-guard'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const workspace_id = searchParams.get('workspace_id')

    if (!workspace_id) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })
    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    const { data: activity } = await supabase
      .from('activity')
      .select('*')
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false })
      .limit(15)

    // Count unread (last 24 hours)
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    const unreadCount = activity?.filter(
      a => new Date(a.created_at) > oneDayAgo
    ).length ?? 0

    return NextResponse.json({
      notifications: activity ?? [],
      unread: unreadCount,
    })

  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to get notifications' }, { status: 500 })
  }
}
