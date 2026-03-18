import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as serviceClient } from '@supabase/supabase-js'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = serviceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get workspace
    const { data: member } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .single()

    if (member?.workspace_id) {
      const wsId = member.workspace_id
      // Delete workspace data
      await service.from('content').delete().eq('workspace_id', wsId)
      await service.from('credits').delete().eq('workspace_id', wsId)
      await service.from('credit_transactions').delete().eq('workspace_id', wsId)
      await service.from('activity').delete().eq('workspace_id', wsId)
      await service.from('brand_assets').delete().eq('workspace_id', wsId)
      await service.from('brand_learnings').delete().eq('workspace_id', wsId)
      await service.from('email_accounts').delete().eq('workspace_id', wsId)
      await service.from('contacts').delete().eq('workspace_id', wsId)
      await service.from('workspace_members').delete().eq('workspace_id', wsId)
      await service.from('workspaces').delete().eq('id', wsId)
    }

    // Delete auth user
    const { error } = await service.auth.admin.deleteUser(user.id)
    if (error) {
      console.error('[account/delete] Auth user delete failed:', error.message)
      return NextResponse.json({ error: 'Failed to delete auth user' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('[account/delete] Error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
