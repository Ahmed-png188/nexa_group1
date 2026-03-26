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

    const { data: member } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .single()
    if (!member) return NextResponse.json({ error: 'No workspace' }, { status: 403 })

    const workspace_id = (member as any).workspace_id

    // Plan gate
    const _planErr = await checkPlanAccess(workspace_id, 'email_sequences')
    if (_planErr) return _planErr

    const body = await request.json()
    const { contacts } = body

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: 'No contacts provided' }, { status: 400 })
    }

    const service = serviceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    if (contacts.length > 10000) {
      return NextResponse.json({ error: 'Too many contacts (max 10,000 per import)' }, { status: 400 })
    }

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const toInsert = contacts
      .filter((c: any) => c.email && EMAIL_RE.test(String(c.email).trim()))
      .map((c: any) => ({
        workspace_id: member.workspace_id,
        email: c.email.toLowerCase().trim(),
        name: c.name || c.email,
        first_name: c.first_name || c.name?.split(' ')[0] || '',
        last_name: c.last_name || c.name?.split(' ').slice(1).join(' ') || '',
        company: c.company || '',
        tags: c.tags || [],
        source: 'csv',
      }))

    const { data, error } = await service
      .from('contacts')
      .upsert(toInsert, { onConflict: 'workspace_id,email' })
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, imported: data?.length || 0 })
  } catch (error: unknown) {
    console.error('[Contacts Import] Error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }
}
