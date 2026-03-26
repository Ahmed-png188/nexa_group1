export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient as serviceClient } from '@supabase/supabase-js'


// 1x1 transparent GIF
const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: NextRequest) {
  const emailId = request.nextUrl.searchParams.get('id')

  if (emailId && UUID_RE.test(emailId)) {
    try {
      const service = serviceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data: email } = await service
        .from('emails_sent')
        .select('opened_count')
        .eq('id', emailId)
        .single()

      await service
        .from('emails_sent')
        .update({
          opened_count: (email?.opened_count || 0) + 1,
          ...(email?.opened_count === 0 ? { opened_at: new Date().toISOString() } : {}),
          status: 'opened',
        })
        .eq('id', emailId)
    } catch {
      // Fail silently — tracking should never break email delivery
    }
  }

  return new NextResponse(PIXEL, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
    },
  })
}
