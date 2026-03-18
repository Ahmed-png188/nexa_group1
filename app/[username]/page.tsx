import { createClient } from '@supabase/supabase-js'
import LeadForm from './LeadForm'

export default async function LeadPage({ params }: { params: { username: string } }) {
  const { username } = params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: ws } = await supabase
    .from('workspaces')
    .select('id, name, brand_name, niche, lead_page_custom_question')
    .eq('slug', username)
    .single()

  if (!ws) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 64, fontWeight: 800, color: 'rgba(255,255,255,0.06)', fontFamily: 'serif', letterSpacing: '-0.04em' }}>404</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.35)', fontFamily: 'sans-serif' }}>This page doesn't exist.</div>
        <a href="https://nexaa.cc" style={{ marginTop: 8, fontSize: 12, color: 'rgba(30,142,240,0.5)', textDecoration: 'none', fontFamily: 'sans-serif' }}>Powered by Nexa</a>
      </div>
    )
  }

  return <LeadForm workspace={ws} />
}
