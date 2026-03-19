import { createClient } from '@supabase/supabase-js'
import LeadForm from './LeadForm'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function LeadPage({
  params
}: {
  params: { username: string }
}) {
  const { username } = params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: ws, error: wsError } = await supabase
    .from('workspaces')
    .select('*')
    .eq('slug', username)
    .maybeSingle()

  if (wsError) console.error('[LeadPage] query error:', wsError.message)

  if (!ws) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 12,
        fontFamily: 'sans-serif',
      }}>
        <div style={{ fontSize: 64, fontWeight: 800, color: 'rgba(255,255,255,0.06)', letterSpacing: '-0.04em' }}>404</div>
        <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)' }}>This page doesn&apos;t exist.</div>
        <a href="https://nexaa.cc" style={{ fontSize: 12, color: 'rgba(30,142,240,0.6)', textDecoration: 'none', marginTop: 8 }}>
          Create yours on Nexa →
        </a>
      </div>
    )
  }

  return <LeadForm workspace={ws} />
}
