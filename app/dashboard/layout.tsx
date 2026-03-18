import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardShell from './DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(*)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: true })

  const workspaces = memberships?.map(m => m.workspaces).flat() ?? []
  if (workspaces.length === 0) redirect('/onboarding')

  // Use active_workspace_id from profile if set (allows workspace switching)
  const preferredId = profile?.active_workspace_id
  const activeWorkspace = (preferredId
    ? workspaces.find((w: any) => w?.id === preferredId)
    : null) ?? workspaces[0] as any

  const { data: credits } = await supabase
    .from('credits').select('balance').eq('workspace_id', activeWorkspace.id).single()

  // Note: trial expiry is enforced at the API level via checkPlanAccess in plan-gate.ts
  // Settings/billing page remains accessible so users can upgrade

  return (
    <DashboardShell user={profile} workspace={activeWorkspace} credits={credits?.balance ?? 0}>
      {children}
    </DashboardShell>
  )
}
