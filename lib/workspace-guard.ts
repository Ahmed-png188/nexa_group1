import type { SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * Verifies the authenticated user is a member of the given workspace.
 * Returns a 403 NextResponse if access is denied, or null if access is granted.
 * Usage:
 *   const deny = await guardWorkspace(supabase, workspace_id, user.id)
 *   if (deny) return deny
 */
export async function guardWorkspace(
  supabase: SupabaseClient,
  workspaceId: string,
  userId: string
): Promise<NextResponse | null> {
  if (!workspaceId) {
    return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })
  }
  const { data } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single()
  if (!data) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }
  return null
}
