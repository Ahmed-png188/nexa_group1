export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createService } from '@supabase/supabase-js'
import { guardWorkspace } from '@/lib/workspace-guard'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const {
      workspace_id,
      config,
      conversation,
      publish = false,
    } = await req.json()

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    const svc = createService(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Generate slug from brand name
    const base = ((config?.brand_name || 'brand') as string)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 28)

    const { data: existing } = await svc
      .from('landing_pages')
      .select('id, slug, published_at')
      .eq('workspace_id', workspace_id)
      .maybeSingle()

    const slug = existing?.slug || `${base}-${Math.random().toString(36).slice(2, 6)}`
    const now  = new Date().toISOString()

    const payload: Record<string, any> = {
      workspace_id,
      slug,
      design_system:   config?.design_system || 'editorial',
      config:          config  || {},
      conversation:    conversation || [],
      meta_title:      config?.meta_title       || null,
      meta_description: config?.meta_description || null,
      status:          publish ? 'published' : 'draft',
      updated_at:      now,
    }

    if (publish && !existing?.published_at) {
      payload.published_at = now
    }

    if (existing) {
      const { error } = await svc
        .from('landing_pages')
        .update(payload)
        .eq('id', existing.id)
      if (error) throw error
    } else {
      payload.created_at = now
      const { error } = await svc
        .from('landing_pages')
        .insert(payload)
      if (error) throw error
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nexaa.cc'
    return NextResponse.json({
      success: true,
      slug,
      url:    `${appUrl}/p/${slug}`,
      status: publish ? 'published' : 'draft',
    })
  } catch (err: any) {
    console.error('[landing-page/save]', err?.message || err)
    return NextResponse.json({ error: err?.message || 'Save failed' }, { status: 500 })
  }
}
