import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function PackagingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#080808',
      overflow: 'hidden',
      zIndex: 9999,
    }}>
      {children}
    </div>
  )
}
