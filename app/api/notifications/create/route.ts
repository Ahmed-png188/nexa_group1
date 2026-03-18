import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { workspace_id, type, message, link } = await request.json()
    if (!workspace_id || !type || !message) {
      return NextResponse.json({ error: 'workspace_id, type, and message are required' }, { status: 400 })
    }

    const service = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await service.from('notifications').insert({
      workspace_id,
      type,
      message,
      link: link || null,
    }).select().single()

    if (error) {
      console.error('[notifications/create]', error.message)
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }

    return NextResponse.json({ success: true, notification: data })
  } catch (error) {
    console.error('[notifications/create]', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}
