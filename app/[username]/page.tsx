import { createClient } from '@supabase/supabase-js'
import LeadForm from './LeadForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// These slugs belong to the app — never render a lead page for them.
// Middleware handles routing these to the correct app pages.
const RESERVED_SLUGS = new Set([
  'dashboard', 'auth', 'api', 'onboarding', 'landing',
  'unsubscribe', 'settings', 'studio', 'amplify', 'automate',
  'schedule', 'insights', 'lead-page', 'agency', 'brand-brain',
  'brand', 'strategy', 'integrations',
])

export default async function LeadPage({
  params
}: {
  params: { username: string }
}) {
  const { username } = params

  // Reserved paths should never reach this component.
  // If they do (routing anomaly), show nothing to avoid loops.
  if (RESERVED_SLUGS.has(username.toLowerCase())) {
    return null
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: ws, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('slug', username)
    .maybeSingle()

  if (!ws) {
    return (
      <div style={{
        minHeight: '100vh', background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 12, fontFamily: 'sans-serif',
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
