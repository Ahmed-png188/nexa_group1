export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient as serviceClient } from '@supabase/supabase-js'


export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug') || 'whiskerwoo'
  
  const service = serviceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await service
    .from('workspaces')
    .select('id, slug, lead_page_headline, lead_page_theme, lead_page_accent, lead_page_fields, lead_page_font, lead_page_cta, lead_page_button_style')
    .eq('slug', slug)
    .single()

  return NextResponse.json({ data, error })
}
