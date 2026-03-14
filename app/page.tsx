import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If logged in, go straight to dashboard
  if (user) redirect('/dashboard')

  // Otherwise show landing — served from /public/landing.html via the /landing route
  redirect('/landing')
}
