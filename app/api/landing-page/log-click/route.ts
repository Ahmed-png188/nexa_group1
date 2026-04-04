export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as svcClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const {
      workspace_id, product_name,
      action_type, page_slug, referrer,
    } = await req.json()

    if (!workspace_id) return NextResponse.json({ ok: true })

    const svc = svcClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await svc.from('activity').insert({
      workspace_id,
      type:  'landing_page_click',
      title: `Product interest: ${product_name}`,
      metadata: {
        product_name, action_type,
        page_slug, referrer,
        timestamp: new Date().toISOString(),
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
