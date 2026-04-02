export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as serviceClient } from '@supabase/supabase-js'
import { guardWorkspace } from '@/lib/workspace-guard'
import { checkPlanAccess } from '@/lib/plan-gate'

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 60)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { workspace_id, page_id, config, status = 'draft', title } = body

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    const planError = await checkPlanAccess(workspace_id, 'lead_page')
    if (planError) return planError

    const service = serviceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get workspace slug for prefix
    const { data: ws } = await service
      .from('workspaces')
      .select('slug, brand_name, name')
      .eq('id', workspace_id)
      .single()

    const pageTitle = title || config?.title || 'my-page'
    const wsSlug    = ws?.slug || workspace_id.slice(0, 8)

    let slug: string
    let tries = 0

    if (page_id) {
      // Updating existing page — keep its slug
      const { data: existing } = await service
        .from('landing_pages')
        .select('slug')
        .eq('id', page_id)
        .single()
      slug = existing?.slug || `${wsSlug}-${slugify(pageTitle)}`
    } else {
      // New page — generate unique slug
      const base = `${wsSlug}-${slugify(pageTitle)}`
      slug = base
      while (tries < 10) {
        const { data: conflict } = await service
          .from('landing_pages')
          .select('id')
          .eq('slug', slug)
          .maybeSingle()
        if (!conflict) break
        tries++
        slug = `${base}-${tries + 1}`
      }
    }

    const payload = {
      workspace_id,
      title: pageTitle,
      slug,
      config: config || {},
      status,
      updated_at: new Date().toISOString(),
    }

    let savedId: string

    if (page_id) {
      const { error } = await service
        .from('landing_pages')
        .update(payload)
        .eq('id', page_id)
        .eq('workspace_id', workspace_id)
      if (error) {
        console.error('[landing-page/save update]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      savedId = page_id
    } else {
      const { data, error } = await service
        .from('landing_pages')
        .insert({ ...payload, created_at: new Date().toISOString() })
        .select('id')
        .single()
      if (error || !data) {
        console.error('[landing-page/save insert]', error)
        return NextResponse.json({ error: error?.message || 'Insert failed' }, { status: 500 })
      }
      savedId = data.id
    }

    return NextResponse.json({ success: true, page_id: savedId, slug })
  } catch (err: unknown) {
    console.error('[landing-page/save]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Save failed' }, { status: 500 })
  }
}
