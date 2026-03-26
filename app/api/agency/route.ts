export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { guardWorkspace } from '@/lib/workspace-guard'
import { checkPlanAccess } from '@/lib/plan-gate'


// GET — fetch all client workspaces for an agency
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const agency_workspace_id = searchParams.get('agency_workspace_id')

  if (!agency_workspace_id) return NextResponse.json({ error: 'agency_workspace_id required' }, { status: 400 })

  const deny = await guardWorkspace(supabase, agency_workspace_id, user.id)
  if (deny) return deny

    // Plan gate
    const planError = await checkPlanAccess(agency_workspace_id as string, 'agency_mode')
    if (planError) return planError

  // Get client workspaces with their data
  const { data: clients } = await supabase
    .from('client_workspaces')
    .select(`
      *,
      client_workspace:client_workspace_id (
        id, name, slug, brand_name, brand_voice, plan, plan_status,
        brand_onboarded, created_at
      )
    `)
    .eq('agency_workspace_id', agency_workspace_id)
    .order('created_at', { ascending: false })

  // For each client, get their recent stats
  const clientsWithStats = await Promise.all((clients || []).map(async (client) => {
    const clientWsId = client.client_workspace_id

    const [contentRes, creditsRes, platformsRes] = await Promise.all([
      supabase.from('content').select('id, status, created_at').eq('workspace_id', clientWsId).order('created_at', { ascending: false }).limit(10),
      supabase.from('credits').select('balance, lifetime_used').eq('workspace_id', clientWsId).single(),
      supabase.from('connected_platforms').select('platform').eq('workspace_id', clientWsId).eq('is_active', true),
    ])

    return {
      ...client,
      stats: {
        total_content: contentRes.data?.length ?? 0,
        published: contentRes.data?.filter(c => c.status === 'published').length ?? 0,
        credits_balance: creditsRes.data?.balance ?? 0,
        connected_platforms: platformsRes.data?.map(p => p.platform) ?? [],
      }
    }
  }))

  // Get pending invites
  const { data: invites } = await supabase
    .from('client_invites')
    .select('*')
    .eq('agency_workspace_id', agency_workspace_id)
    .eq('status', 'pending')

  return NextResponse.json({ clients: clientsWithStats, invites: invites ?? [] })
}

// POST — create a new client workspace OR switch active workspace
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { action } = body

  // ── Switch active workspace ──
  if (action === 'switch_workspace') {
    const { workspace_id } = body
    if (!workspace_id) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })

    // Verify user is a member of the target workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) return NextResponse.json({ error: 'Access denied to this workspace' }, { status: 403 })

    // Update user's active workspace in their profile
    await supabase.from('profiles')
      .update({ active_workspace_id: workspace_id })
      .eq('id', user.id)

    return NextResponse.json({ success: true, workspace_id })
  }

  const { agency_workspace_id, client_name, client_email, brand_name, monthly_retainer } = body

  // Check agency plan
  const { data: agencyWs } = await supabase.from('workspaces').select('plan').eq('id', agency_workspace_id).single()
  if (agencyWs?.plan !== 'agency') {
    return NextResponse.json({ error: 'Agency plan required to create client workspaces', upgrade: true }, { status: 403 })
  }

  // Create the client workspace
  const slug = `${client_name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`
  const { data: clientWs, error: wsError } = await supabase.from('workspaces').insert({
    owner_id: user.id,
    name: client_name,
    slug,
    brand_name: brand_name || client_name,
    plan: 'agency',
    plan_status: 'active',
  }).select().single()

  if (wsError) return NextResponse.json({ error: wsError.message }, { status: 500 })

  // Add agency user as member of client workspace
  await supabase.from('workspace_members').insert({
    workspace_id: clientWs.id,
    user_id: user.id,
    role: 'admin',
  })

  // Give the client workspace starter credits
  await supabase.from('credits').insert({
    workspace_id: clientWs.id,
    balance: 1000,
    lifetime_used: 0,
  })

  // Link client to agency
  const { data: link } = await supabase.from('client_workspaces').insert({
    agency_workspace_id,
    client_workspace_id: clientWs.id,
    client_name,
    client_email,
    monthly_retainer: monthly_retainer || 0,
    status: 'active',
  }).select().single()

  // Log activity
  await supabase.from('agency_activity').insert({
    agency_workspace_id,
    client_workspace_id: clientWs.id,
    user_id: user.id,
    action: 'client_created',
    description: `Created workspace for client: ${client_name}`,
  })

  await supabase.from('activity').insert({
    workspace_id: agency_workspace_id,
    user_id: user.id,
    type: 'client_added',
    title: `New client workspace created: ${client_name}`,
    metadata: { client_workspace_id: clientWs.id },
  })

  return NextResponse.json({ success: true, client: link, workspace: clientWs })
}

// DELETE — remove a client
export async function DELETE(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, agency_workspace_id } = await request.json()

  const deny = await guardWorkspace(supabase, agency_workspace_id, user.id)
  if (deny) return deny

  await supabase.from('client_workspaces').delete().eq('id', id).eq('agency_workspace_id', agency_workspace_id)

  return NextResponse.json({ success: true })
}
