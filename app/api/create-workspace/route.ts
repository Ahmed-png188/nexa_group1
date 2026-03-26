export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'


export async function POST(request: NextRequest) {
  // Use regular client to verify the user session
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // Use admin client to bypass RLS for workspace creation
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { workspaceName, brandName, brandWebsite } = await request.json()

  if (!workspaceName || typeof workspaceName !== 'string' || workspaceName.trim().length < 2 || workspaceName.trim().length > 80) {
    return NextResponse.json({ error: 'Workspace name must be between 2 and 80 characters' }, { status: 400 })
  }
  if (brandName && (typeof brandName !== 'string' || brandName.trim().length > 80)) {
    return NextResponse.json({ error: 'Brand name must be 80 characters or fewer' }, { status: 400 })
  }

  const slug = (brandName || workspaceName).toLowerCase()
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now()

  const { data: workspace, error: wsError } = await admin
    .from('workspaces')
    .insert({ owner_id: user.id, name: workspaceName, slug, brand_name: brandName || workspaceName, brand_website: brandWebsite || null })
    .select().single()

  if (wsError) return NextResponse.json({ error: wsError.message }, { status: 400 })

  const { error: memberError } = await admin
    .from('workspace_members')
    .insert({ workspace_id: workspace.id, user_id: user.id, role: 'owner' })

  if (memberError) return NextResponse.json({ error: memberError.message }, { status: 400 })

  await admin.from('credits').insert({ workspace_id: workspace.id, balance: 150 }) // Trial: 150 credits

  await admin.from('activity').insert({
    workspace_id: workspace.id,
    user_id: user.id,
    type: 'workspace_created',
    title: `${workspaceName} workspace created`,
  })

  await admin.from('profiles')
    .update({ active_workspace_id: workspace.id })
    .eq('id', user.id)

  return NextResponse.json({ workspace })
}
