import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const workspace_id = searchParams.get('workspace_id')

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
