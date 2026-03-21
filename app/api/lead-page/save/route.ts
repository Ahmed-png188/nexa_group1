export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as serviceClient } from '@supabase/supabase-js'
import { guardWorkspace } from '@/lib/workspace-guard'
import { checkPlanAccess } from '@/lib/plan-gate'


export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { workspace_id, ...fields } = body

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    // Plan gate
    const planError = await checkPlanAccess(workspace_id, 'lead_page')
    if (planError) return planError

    // Use service role to bypass RLS for new columns
    const service = serviceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await service
      .from('workspaces')
      .update(fields)
      .eq('id', workspace_id)

    if (error) {
      console.error('[lead-page/save]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[lead-page/save]', err)
    return NextResponse.json({ error: 'Save failed' }, { status: 500 })
  }
}
