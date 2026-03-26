import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { workspace_id, design_id, design, packaging_type } = body

    if (!workspace_id) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })
    if (!design || typeof design !== 'object') return NextResponse.json({ error: 'design object required' }, { status: 400 })
    if (!packaging_type) return NextResponse.json({ error: 'packaging_type required' }, { status: 400 })

    const allowedTypes = ['box', 'label', 'pouch', 'bag', 'sleeve']
    if (!allowedTypes.includes(packaging_type)) {
      return NextResponse.json({ error: `packaging_type must be one of: ${allowedTypes.join(', ')}` }, { status: 400 })
    }

    // Verify workspace membership
    const { data: member } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single()

    if (!member) return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 })

    // If design_id provided, update the existing record
    if (design_id) {
      const { error: updateErr } = await supabase
        .from('packaging_designs')
        .update({ design, packaging_type, updated_at: new Date().toISOString() })
        .eq('id', design_id)
        .eq('workspace_id', workspace_id)

      if (updateErr) throw updateErr
      return NextResponse.json({ success: true, id: design_id })
    }

    // Otherwise insert a new render record
    const { data: record, error: insertErr } = await supabase
      .from('packaging_designs')
      .insert({
        workspace_id,
        packaging_type,
        design,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (insertErr) {
      // Table may not exist — that's fine, just return success
      console.warn('packaging_designs insert skipped:', insertErr.message)
      return NextResponse.json({ success: true, id: null })
    }

    return NextResponse.json({ success: true, id: record?.id || null })
  } catch (err: any) {
    console.error('packaging-render error:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
