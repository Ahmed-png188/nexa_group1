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

    const { workspace_id, ordered_ids } = await req.json()
    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    await Promise.all(
      (ordered_ids as string[]).map((id: string, index: number) =>
        svc()
          .from('workspace_products')
          .update({ sort_order: index })
          .eq('id', id)
      )
    )

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
