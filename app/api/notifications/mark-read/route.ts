export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { guardWorkspace } from '@/lib/workspace-guard'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const workspace_id = searchParams.get('workspace_id')
    if (!workspace_id) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('workspace_id', workspace_id)
      .is('read_at', null)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
