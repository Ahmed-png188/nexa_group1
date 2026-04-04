export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as svcClient } from '@supabase/supabase-js'
import { guardWorkspace } from '@/lib/workspace-guard'

function svc() {
  return svcClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const wsId = req.nextUrl.searchParams.get('workspace_id')
    if (!wsId)
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })

    const deny = await guardWorkspace(supabase, wsId, user.id)
    if (deny) return deny

    const { data, error } = await svc()
      .from('workspace_products')
      .select('*')
      .eq('workspace_id', wsId)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return NextResponse.json({ products: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { workspace_id, ...fields } = body

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    const { data: existing } = await svc()
      .from('workspace_products')
      .select('sort_order')
      .eq('workspace_id', workspace_id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextOrder = (existing?.sort_order ?? -1) + 1

    const { data, error } = await svc()
      .from('workspace_products')
      .insert({
        workspace_id,
        name:             fields.name || 'New Product',
        short_desc:       fields.short_desc || '',
        full_desc:        fields.full_desc || '',
        price:            fields.price || '',
        price_value:      fields.price_value || 0,
        currency:         fields.currency || 'USD',
        badge:            fields.badge || '',
        featured:         fields.featured || false,
        active:           true,
        images:           fields.images || [],
        variants:         fields.variants || [],
        action_type:      fields.action_type || 'lead_form',
        action_value:     fields.action_value || '',
        whatsapp_number:  fields.whatsapp_number || '',
        whatsapp_message: fields.whatsapp_message || '',
        sort_order:       nextOrder,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ product: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
