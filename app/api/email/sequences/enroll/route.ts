export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { checkPlanAccess } from '@/lib/plan-gate'
import { createClient } from '@/lib/supabase/server'
import { createClient as serviceClient } from '@supabase/supabase-js'


export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { sequence_id, contact_ids, workspace_id } = await request.json()
    if (!sequence_id || !contact_ids?.length) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Plan gate
    if (workspace_id) {
      const _planErr = await checkPlanAccess(workspace_id, 'email_sequences')
      if (_planErr) return _planErr
    }

    const service = serviceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const enrollments = contact_ids.map((contact_id: string) => ({
      sequence_id,
      contact_id,
      status: 'active',
      current_step: 1,
      enrolled_at: new Date().toISOString(),
      next_send_at: new Date().toISOString(),
    }))

    await service
      .from('sequence_enrollments')
      .upsert(enrollments, { onConflict: 'sequence_id,contact_id' })

    return NextResponse.json({ success: true, enrolled: contact_ids.length })
  } catch (error) {
    console.error('[Enroll]', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 })
  }
}
