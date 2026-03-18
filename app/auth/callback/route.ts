import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = createClient()
    const { data } = await supabase.auth.exchangeCodeForSession(code)

    if (data?.user) {
      const { email, user_metadata } = data.user
      const name = user_metadata?.full_name ?? email?.split('@')[0] ?? 'there'

      // Check if user already has a workspace → send to dashboard, else onboarding
      const { data: membership } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', data.user.id)
        .limit(1)
        .single()

      if (membership?.workspace_id) {
        return NextResponse.redirect(`${origin}/dashboard`)
      }

      // New user — send welcome email (non-blocking)
      fetch(`${origin}/api/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': process.env.INTERNAL_API_SECRET ?? '',
        },
        body: JSON.stringify({ type: 'welcome', to: email, name }),
      }).catch(err => console.error('[callback] Welcome email failed:', err))
    }
  }

  return NextResponse.redirect(`${origin}/onboarding`)
}
