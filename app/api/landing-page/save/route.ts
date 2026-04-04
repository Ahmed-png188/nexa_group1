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

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, config, conversation, publish = false } = await req.json()

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    const { data: existing } = await svc()
      .from('landing_pages')
      .select('id, slug, status, published_at')
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const slug = existing?.slug || (() => {
      const base = (config.brand_name || 'brand')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 28)
      return `${base}-${Math.random().toString(36).slice(2, 5)}`
    })()

    const now = new Date().toISOString()
    const payload: Record<string, any> = {
      workspace_id,
      slug,
      design_system:    config.design_system || 'editorial',
      config,
      conversation:     conversation || [],
      meta_title:       config.meta_title || null,
      meta_description: config.meta_description || null,
      status:           publish ? 'published' : (existing?.status || 'draft'),
      updated_at:       now,
    }

    if (publish && !existing?.published_at) {
      payload.published_at = now
    }

    let result: any
    if (existing) {
      const { data } = await svc()
        .from('landing_pages')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single()
      result = data
    } else {
      const { data } = await svc()
        .from('landing_pages')
        .insert(payload)
        .select()
        .single()
      result = data
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nexaa.cc'
    return NextResponse.json({
      success: true,
      slug,
      url: `${appUrl}/p/${slug}`,
      status: result?.status,
    })
  } catch (err: any) {
    console.error('[landing-page/save]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, section, field, value } = await req.json()

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    const { data: page } = await svc()
      .from('landing_pages')
      .select('id, config')
      .eq('workspace_id', workspace_id)
      .single()

    if (!page) return NextResponse.json({ error: 'No page found' }, { status: 404 })

    const config = page.config as Record<string, any>
    if (config[section] !== undefined) {
      config[section][field] = value
    }

    await svc()
      .from('landing_pages')
      .update({ config, updated_at: new Date().toISOString() })
      .eq('id', page.id)

    return NextResponse.json({ success: true, updated: { section, field, value } })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
