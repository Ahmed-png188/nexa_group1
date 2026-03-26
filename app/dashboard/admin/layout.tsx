import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminPage from './page'

const ADMIN_EMAILS = ['ahamedday221@gmail.com']

export default async function AdminRoute() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) redirect('/dashboard')
  return <AdminPage />
}
