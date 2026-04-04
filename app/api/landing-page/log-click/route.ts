export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const { workspace_id, product_name, action_type, page_slug, referrer } = await req.json()

    if (!workspace_id || !product_name) return NextResponse.json({ ok: true })

    const svc = db()

    // Log to activity (fire and forget)
    await svc.from('activity').insert({
      workspace_id,
      type:  'landing_page_click',
      title: `Product interest: ${product_name}`,
      metadata: {
        product_name,
        action_type,
        page_slug,
        referrer,
        timestamp: new Date().toISOString(),
      },
    })

    // If lead_form action, increment leads_count on the page
    if (action_type === 'lead_form') {
      const { data: lp } = await svc
        .from('landing_pages')
        .select('id, leads_count')
        .eq('workspace_id', workspace_id)
        .maybeSingle()
      if (lp?.id) {
        await svc.from('landing_pages')
          .update({ leads_count: (lp.leads_count || 0) + 1 })
          .eq('id', lp.id)
      }
    }

    return NextResponse.json({ ok: true })
  } catch {
    // Never fail the user experience
    return NextResponse.json({ ok: true })
  }
}
