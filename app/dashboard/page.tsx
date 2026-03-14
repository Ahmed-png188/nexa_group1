import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

const IconStar = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
const IconGen = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
const IconCal = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const IconZap = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
const IconUp = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
const IconAct = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>

export default async function DashboardHome() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: memberships } = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id', user.id).limit(1).single()
  const workspace = (memberships as any)?.workspaces as any
  if (!workspace) redirect('/onboarding')

  const { data: credits } = await supabase.from('credits').select('balance, lifetime_used').eq('workspace_id', workspace.id).single()
  const { data: agents } = await supabase.from('agents').select('*').eq('workspace_id', workspace.id).limit(5)
  const { data: recentContent } = await supabase.from('content').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false }).limit(5)
  const { data: activity } = await supabase.from('activity').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false }).limit(6)
  const { data: scheduledContent } = await supabase.from('content').select('*').eq('workspace_id', workspace.id).eq('status', 'scheduled').order('scheduled_for', { ascending: true }).limit(4)

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const today = format(new Date(), 'EEEE, MMMM d')
  const runningAgents = agents?.filter(a => a.status === 'running') ?? []

  const quickActions = [
    { label: 'Generate a post', href: '/dashboard/studio', icon: <IconGen /> },
    { label: 'Build my strategy', href: '/dashboard/strategy', icon: <IconStar /> },
    { label: 'Schedule content', href: '/dashboard/schedule', icon: <IconCal /> },
    { label: 'Set up automation', href: '/dashboard/automate', icon: <IconZap /> },
  ]

  const actIcon = (type: string) => type === 'content_generated' ? <IconStar /> : type === 'post_published' ? <IconUp /> : <IconAct />

  return (
    <div style={{ padding: '28px', maxWidth: 1100 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 5 }}>{greeting}, {firstName}.</h1>
        <div style={{ fontSize: 13, color: 'var(--t4)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{today}</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--t5)', display: 'inline-block' }} />
          <span>{workspace.name}</span>
          {runningAgents.length > 0 && <><span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--t5)', display: 'inline-block' }} /><span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--cyan)', animation: 'pulse-dot 2s ease-in-out infinite' }} />{runningAgents.length} agent{runningAgents.length > 1 ? 's' : ''} running</span></>}
        </div>
      </div>

      {!workspace.brand_onboarded ? (
        <div style={{ marginBottom: 20, padding: '16px 18px', background: 'rgba(0,170,255,0.04)', border: '1px solid var(--cline2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t2)', marginBottom: 3 }}>Finish setting up your brand</div><div style={{ fontSize: 12, color: 'var(--t4)' }}>Upload your assets and let Nexa learn your voice in 8 seconds.</div></div>
          <a href="/onboarding" style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700, background: 'var(--cyan)', color: '#000', borderRadius: 8, textDecoration: 'none' }}>Complete setup →</a>
        </div>
      ) : (
        <div style={{ marginBottom: 20, padding: '14px 18px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12, borderLeft: '2px solid rgba(0,170,255,0.3)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent 10%,rgba(0,170,255,0.18) 40%,transparent 80%)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--cyan)', animation: 'pulse-dot 2s ease-in-out infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Morning Brief</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 }}>{workspace.brand_voice ? `Brand voice: "${workspace.brand_voice.slice(0, 80)}..." — Head to Studio to create your next post.` : `Everything is ready. Ask Nexa AI what to create today.`}</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Credits left',   value: credits?.balance?.toLocaleString() ?? '0',         color: 'var(--t1)' },
          { label: 'Credits used',   value: credits?.lifetime_used?.toLocaleString() ?? '0',    color: 'var(--t1)' },
          { label: 'Content pieces', value: (recentContent?.length ?? 0).toString(),            color: 'var(--t1)' },
          { label: 'Active agents',  value: runningAgents.length.toString(),                    color: runningAgents.length > 0 ? 'var(--cyan)' : 'var(--t1)' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12, padding: '16px 14px' }}>
            <div style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: 'var(--t4)', marginTop: 5 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)' }}>Active Agents</span>
            <a href="/dashboard/automate" style={{ fontSize: 11, color: 'var(--cyan)', textDecoration: 'none' }}>View all →</a>
          </div>
          {agents && agents.length > 0 ? agents.map(agent => (
            <div key={agent.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: agent.status === 'running' ? 'var(--cyan)' : 'var(--t5)', animation: agent.status === 'running' ? 'pulse-dot 2s ease-in-out infinite' : 'none' }} />
                <span style={{ fontSize: 12, fontWeight: 500, flex: 1, color: 'var(--t2)' }}>{agent.name}</span>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: agent.status === 'running' ? 'rgba(0,170,255,0.08)' : 'var(--glass)', color: agent.status === 'running' ? 'var(--cyan)' : 'var(--t4)', border: `1px solid ${agent.status === 'running' ? 'var(--cline2)' : 'var(--line)'}`, textTransform: 'capitalize' as const }}>{agent.status}</span>
              </div>
              {agent.progress > 0 && <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}><div style={{ width: `${agent.progress}%`, height: '100%', background: 'linear-gradient(90deg,rgba(0,110,255,0.7),var(--cyan))', borderRadius: 2 }} /></div>}
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 13, color: 'var(--t5)', marginBottom: 10 }}>No agents running yet</div>
              <a href="/dashboard/automate" style={{ fontSize: 12, fontWeight: 600, color: 'var(--cyan)', textDecoration: 'none', padding: '6px 14px', background: 'var(--cglow2)', border: '1px solid var(--cline2)', borderRadius: 7 }}>Create your first agent →</a>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12, padding: 16, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', marginBottom: 12 }}>Recent Activity</div>
            {activity && activity.length > 0 ? activity.slice(0, 4).map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--line)' }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--glass2)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t4)', flexShrink: 0 }}>{actIcon(item.type)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--t2)', lineHeight: 1.3 }}>{item.title}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--t5)', marginTop: 2 }}>{format(new Date(item.created_at), 'MMM d, h:mm a')}</div>
                </div>
              </div>
            )) : <div style={{ fontSize: 12, color: 'var(--t5)', textAlign: 'center', padding: '16px 0' }}>Activity will appear here as you create content.</div>}
          </div>
          <div style={{ background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)' }}>Queue</span>
              <a href="/dashboard/schedule" style={{ fontSize: 11, color: 'var(--cyan)', textDecoration: 'none' }}>Manage →</a>
            </div>
            {scheduledContent && scheduledContent.length > 0 ? scheduledContent.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: 'var(--glass2)', border: '1px solid var(--line)', fontSize: 8, fontWeight: 700, color: 'var(--t4)', display: 'flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase' as const }}>{item.platform?.slice(0, 2)}</div>
                <span style={{ fontSize: 11.5, color: 'var(--t3)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title ?? item.body?.slice(0, 40) ?? 'Untitled'}</span>
                <span style={{ fontSize: 9, color: 'var(--t5)' }}>{item.scheduled_for ? format(new Date(item.scheduled_for), 'MMM d') : 'Soon'}</span>
              </div>
            )) : <div style={{ fontSize: 12, color: 'var(--t5)', textAlign: 'center', padding: '8px 0' }}>No posts scheduled. <a href="/dashboard/studio" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>Create one →</a></div>}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {quickActions.map(action => (
          <a key={action.label} href={action.href} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 14px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 10, fontSize: 12.5, fontWeight: 600, color: 'var(--t3)', textDecoration: 'none' }}>
            <span style={{ color: 'var(--cyan)', display: 'flex', flexShrink: 0 }}>{action.icon}</span>
            {action.label}
          </a>
        ))}
      </div>
    </div>
  )
}
