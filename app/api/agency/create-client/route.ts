export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { checkPlanAccess } from '@/lib/plan-gate'
import { createClient } from '@/lib/supabase/server'
import { createClient as serviceClient } from '@supabase/supabase-js'


export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    // Plan gate
    const _planErr = await checkPlanAccess(agency_workspace_id, 'agency_mode')
    if (_planErr) return _planErr

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { client_name, client_email, brand_name, agency_workspace_id, monthly_retainer } = await request.json()

    const { data: member } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .single()
    if (!member) return NextResponse.json({ error: 'No workspace' }, { status: 403 })

    if (member.workspace_id !== agency_workspace_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const service = serviceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create isolated client workspace
    const { data: clientWorkspace, error: wsError } = await service
      .from('workspaces')
      .insert({
        name: client_name,
        brand_name: brand_name || client_name,
        owner_id: user.id,
        plan: 'agency_client',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (wsError || !clientWorkspace) {
      console.error('[Agency Create Client] workspace error:', wsError?.message)
      return NextResponse.json({ error: 'Failed to create client workspace' }, { status: 500 })
    }

    // Initialize credits for client
    await service.from('credits').insert({
      workspace_id: clientWorkspace.id,
      balance: 500,
    })

    // Link client to agency
    await service.from('client_workspaces').upsert({
      agency_workspace_id,
      client_workspace_id: clientWorkspace.id,
      client_name,
      client_email: client_email || null,
      brand_name: brand_name || client_name,
      monthly_retainer: monthly_retainer || 0,
      status: 'active',
      created_at: new Date().toISOString(),
    })

    // Send invite email (non-blocking)
    if (client_email) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://nexaa.cc'}/api/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': process.env.INTERNAL_API_SECRET || '',
        },
        body: JSON.stringify({
          type: 'client_invite',
          to: client_email,
          name: client_name,
          agency_name: brand_name,
        }),
      }).catch(() => {})
    }

    return NextResponse.json({ success: true, workspace: clientWorkspace })
  } catch (error) {
    console.error('[Agency Create Client]', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
