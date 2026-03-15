'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, formatDistanceToNow } from 'date-fns'

const AGENTS = [
  {
    id: 'content',
    name: 'Content Agent',
    desc: 'Generates a full week of brand-aligned posts',
    icon: '✍️',
    color: 'rgba(0,170,255,0.08)',
    borderColor: 'var(--cline2)',
    textColor: 'var(--cyan)',
    cost: '0 credits',
  },
  {
    id: 'timing',
    name: 'Timing Agent',
    desc: 'Finds optimal posting times for your audience',
    icon: '⏰',
    color: 'rgba(0,214,143,0.06)',
    borderColor: 'rgba(0,214,143,0.2)',
    textColor: '#00d68f',
    cost: '0 credits',
  },
  {
    id: 'engagement',
    name: 'Engagement Agent',
    desc: 'Drafts replies to comments in your brand voice',
    icon: '💬',
    color: 'rgba(212,82,26,0.06)',
    borderColor: 'rgba(212,82,26,0.2)',
    textColor: 'var(--orange)',
    cost: '0 credits',
  },
  {
    id: 'insights',
    name: 'Insights Agent',
    desc: 'Weekly performance report with recommendations',
    icon: '📊',
    color: 'rgba(139,92,246,0.06)',
    borderColor: 'rgba(139,92,246,0.2)',
    textColor: '#8b5cf6',
    cost: '0 credits',
  },
]

export default function DashboardHome() {
  const supabase = createClient()
  const [workspace, setWorkspace] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [credits, setCredits] = useState<any>(null)
  const [recentContent, setRecentContent] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [scheduledContent, setScheduledContent] = useState<any[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [agentRuns, setAgentRuns] = useState<any[]>([])
  const [brandLearnings, setBrandLearnings] = useState<any[]>([])
  const [brandProfile, setBrandProfile] = useState<any>(null)
  const [runningAgent, setRunningAgent] = useState<string | null>(null)
  const [agentResult, setAgentResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [intelligence, setIntelligence] = useState<any>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    const { data: m } = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id', user.id).limit(1).single()
    const ws = (m as any)?.workspaces
    setProfile(p)
    setWorkspace(ws)

    const [creditsRes, contentRes, activityRes, scheduledRes, convsRes] = await Promise.all([
      supabase.from('credits').select('balance, lifetime_used').eq('workspace_id', ws?.id).single(),
      supabase.from('content').select('*').eq('workspace_id', ws?.id).order('created_at', { ascending: false }).limit(6),
      supabase.from('activity').select('*').eq('workspace_id', ws?.id).order('created_at', { ascending: false }).limit(8),
      supabase.from('content').select('*').eq('workspace_id', ws?.id).eq('status', 'scheduled').order('scheduled_for', { ascending: true }).limit(4),
      supabase.from('conversations').select('*').eq('workspace_id', ws?.id).order('updated_at', { ascending: false }).limit(5),
    ])

    // These tables may not exist yet — handle gracefully
    let agentRunsRes = { data: [] as any[] }
    let learningsRes = { data: [] as any[] }
    let profileAssetRes = { data: null as any }
    try { const r = await supabase.from('agent_runs').select('*').eq('workspace_id', ws?.id).order('created_at', { ascending: false }).limit(10); agentRunsRes = { data: r.data ?? [] } } catch {}
    try { const r = await supabase.from('brand_learnings').select('*').eq('workspace_id', ws?.id).order('created_at', { ascending: false }).limit(10); learningsRes = { data: r.data ?? [] } } catch {}
    try { const r = await supabase.from('brand_assets').select('analysis').eq('workspace_id', ws?.id).eq('file_name', 'nexa_brand_intelligence.json').single(); profileAssetRes = { data: r.data } } catch {}

    setCredits(creditsRes.data)
    setRecentContent(contentRes.data ?? [])
    setActivity(activityRes.data ?? [])
    setScheduledContent(scheduledRes.data ?? [])
    setConversations(convsRes.data ?? [])
    setAgentRuns((agentRunsRes as any).data ?? [])
    setBrandLearnings((learningsRes as any).data ?? [])
    if ((profileAssetRes as any).data?.analysis) setBrandProfile((profileAssetRes as any).data.analysis)

    // Build intelligence summary
    const totalContent = contentRes.data?.length ?? 0
    const totalConvs = convsRes.data?.length ?? 0
    const totalRuns = (agentRunsRes as any).data?.length ?? 0
    const totalLearnings = (learningsRes as any).data?.length ?? 0
    setIntelligence({ totalContent, totalConvs, totalRuns, totalLearnings })

    setLoading(false)

    // Subscribe to real-time updates
    supabase.channel('home-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity', filter: `workspace_id=eq.${ws?.id}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credits', filter: `workspace_id=eq.${ws?.id}` }, (payload: any) => {
        if (payload.new?.balance !== undefined) setCredits(payload.new)
      })
      .subscribe()
  }

  async function runAgent(agentId: string) {
    if (!workspace || runningAgent) return
    setRunningAgent(agentId)
    setAgentResult(null)
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspace.id, agent_type: agentId }),
      })
      const data = await res.json()

      // Save agent run to DB
      try { await supabase.from('agent_runs').insert({
        workspace_id: workspace.id,
        agent_type: agentId,
        status: data.success ? 'completed' : 'failed',
        result: data,
        items_created: data.posts?.length || data.replies?.length || 0,
      }).catch(() => {})

      // Save brand learnings if insights agent
      if (agentId === 'insights' && data.insights) {
        const learnings = [
          data.insights.whats_working?.map((w: string) => ({ workspace_id: workspace.id, source: 'generation', source_name: 'Insights Agent', insight_type: 'content', insight: w })),
          data.insights.recommendations?.map((r: any) => ({ workspace_id: workspace.id, source: 'generation', source_name: 'Insights Agent', insight_type: 'strategy', insight: r.action })),
        ].flat().filter(Boolean)

        if (learnings.length > 0) {
          await supabase.from('brand_learnings').insert(learnings) } catch {}
        }
      }

      setAgentResult({ type: agentId, data })
      await load()
    } catch (err) {
      console.error('Agent error:', err)
    }
    setRunningAgent(null)
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  const actColor = (type: string) => {
    if (type.includes('generated') || type.includes('analyzed')) return 'var(--cyan)'
    if (type.includes('published') || type.includes('connected')) return '#00d68f'
    if (type.includes('agent')) return '#8b5cf6'
    if (type.includes('brand')) return 'var(--orange)'
    return 'var(--t4)'
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--t4)', fontSize: 13 }}>
      Loading your workspace...
    </div>
  )

  return (
    <div style={{ padding: '24px 28px', overflowY: 'auto', height: 'calc(100vh - var(--topbar-h))' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 5 }}>
          {greeting}, {firstName}.
        </h1>
        <div style={{ fontSize: 13, color: 'var(--t4)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{format(new Date(), 'EEEE, MMMM d')}</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--t5)' }} />
          <span>{workspace?.name}</span>
          {brandProfile && (
            <>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--t5)' }} />
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#00d68f' }} />
                <span style={{ color: '#00d68f', fontSize: 12 }}>Brand Brain active</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Morning brief */}
      <div style={{ marginBottom: 20, padding: '14px 18px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12, borderLeft: '2px solid rgba(0,170,255,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--cyan)', animation: 'pulse-dot 2s ease-in-out infinite' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Morning Brief</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 }}>
          {brandProfile
            ? `Nexa knows your brand. Voice: "${brandProfile.voice?.primary_tone?.slice(0, 60)}". ${scheduledContent.length > 0 ? `${scheduledContent.length} post${scheduledContent.length > 1 ? 's' : ''} scheduled. ` : ''}${recentContent.length > 0 ? `${recentContent.length} pieces created. ` : ''}Ask Nexa AI what to create today.`
            : `Welcome back. Upload brand assets in Brand Brain to unlock intelligent generation.`}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 20 }}>
        {[
          { label: 'Credits', value: credits?.balance?.toLocaleString() ?? '0', sub: `${credits?.lifetime_used?.toLocaleString() ?? '0'} used`, color: 'var(--cyan)' },
          { label: 'Content created', value: recentContent.length.toString(), sub: 'all time', color: 'var(--t1)' },
          { label: 'Scheduled', value: scheduledContent.length.toString(), sub: 'upcoming', color: scheduledContent.length > 0 ? '#00d68f' : 'var(--t1)' },
          { label: 'Agent runs', value: agentRuns.length.toString(), sub: 'total executions', color: '#8b5cf6' },
          { label: 'Brand learnings', value: brandLearnings.length.toString(), sub: 'insights stored', color: 'var(--orange)' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12, padding: '14px 14px' }}>
            <div style={{ fontFamily: 'var(--display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4, fontWeight: 600 }}>{stat.label}</div>
            <div style={{ fontSize: 10, color: 'var(--t5)', marginTop: 2 }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>

        {/* Agents */}
        <div style={{ background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Agents</div>
              <div style={{ fontSize: 11, color: 'var(--t5)', marginTop: 2 }}>Run AI agents to automate your brand</div>
            </div>
            <a href="/dashboard/automate" style={{ fontSize: 11, color: 'var(--cyan)', textDecoration: 'none' }}>View all →</a>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {AGENTS.map(agent => {
              const lastRun = agentRuns.find(r => r.agent_type === agent.id)
              const isRunning = runningAgent === agent.id
              return (
                <div key={agent.id} style={{ padding: '12px 14px', background: isRunning ? agent.color : 'rgba(255,255,255,0.02)', border: `1px solid ${isRunning ? agent.borderColor : 'var(--line)'}`, borderRadius: 10, transition: 'all .2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{agent.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>{agent.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--t5)', marginTop: 1 }}>
                        {lastRun ? `Last run ${formatDistanceToNow(new Date(lastRun.created_at))} ago` : agent.desc}
                      </div>
                    </div>
                    <button
                      onClick={() => runAgent(agent.id)}
                      disabled={!!runningAgent}
                      style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700, fontFamily: 'var(--sans)', background: isRunning ? agent.color : 'var(--glass2)', border: `1px solid ${isRunning ? agent.borderColor : 'var(--line2)'}`, color: isRunning ? agent.textColor : 'var(--t3)', cursor: runningAgent ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                      {isRunning ? (
                        <><div style={{ width: 8, height: 8, border: `1.5px solid ${agent.textColor}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Running</>
                      ) : 'Run →'}
                    </button>
                  </div>
                  {isRunning && (
                    <div style={{ marginTop: 8, height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '60%', background: `linear-gradient(90deg,transparent,${agent.textColor})`, borderRadius: 2, animation: 'progress-pulse 1.5s ease-in-out infinite' }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Recent conversations */}
          <div style={{ background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 14, padding: 18, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Recent Chats</div>
              <span style={{ fontSize: 10, color: 'var(--t5)' }}>Saved automatically</span>
            </div>
            {conversations.length > 0 ? conversations.slice(0, 4).map(conv => (
              <div key={conv.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(0,170,255,0.08)', border: '1px solid var(--cline2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>💬</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.title || 'Chat session'}</div>
                  <div style={{ fontSize: 10, color: 'var(--t5)', marginTop: 1 }}>{conv.message_count || 0} messages · {formatDistanceToNow(new Date(conv.updated_at || conv.created_at))} ago</div>
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 12, color: 'var(--t5)' }}>
                Chats with Nexa AI appear here automatically.
              </div>
            )}
          </div>

          {/* Queue */}
          <div style={{ background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 14, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Scheduled Queue</div>
              <a href="/dashboard/schedule" style={{ fontSize: 11, color: 'var(--cyan)', textDecoration: 'none' }}>Manage →</a>
            </div>
            {scheduledContent.length > 0 ? scheduledContent.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--glass2)', border: '1px solid var(--line)', fontSize: 8, fontWeight: 700, color: 'var(--t4)', display: 'flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase', flexShrink: 0 }}>{item.platform?.slice(0, 2) || 'ge'}</div>
                <span style={{ fontSize: 11.5, color: 'var(--t3)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title ?? item.body?.slice(0, 40) ?? 'Post'}</span>
                <span style={{ fontSize: 9, color: 'var(--t5)', flexShrink: 0 }}>{item.scheduled_for ? format(new Date(item.scheduled_for), 'MMM d') : 'Soon'}</span>
              </div>
            )) : (
              <div style={{ fontSize: 12, color: 'var(--t5)', textAlign: 'center', padding: '8px 0' }}>
                No posts scheduled. <a href="/dashboard/studio" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>Create one →</a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Agent result panel */}
      {agentResult && (
        <div style={{ marginBottom: 12, padding: '16px 18px', background: 'rgba(0,170,255,0.04)', border: '1px solid var(--cline2)', borderRadius: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cyan)' }}>
              ✓ {AGENTS.find(a => a.id === agentResult.type)?.name} completed
            </div>
            <button onClick={() => setAgentResult(null)} style={{ background: 'none', border: 'none', color: 'var(--t5)', cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>

          {/* Content agent results */}
          {agentResult.type === 'content' && agentResult.data.posts?.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {agentResult.data.posts.slice(0, 3).map((post: any, i: number) => (
                <div key={i} style={{ padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 10, border: '1px solid var(--line)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--cyan)', marginBottom: 5 }}>{post.day} · {post.theme}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.body}</div>
                </div>
              ))}
            </div>
          )}

          {/* Timing agent results */}
          {agentResult.type === 'timing' && agentResult.data.schedule && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {Object.entries(agentResult.data.schedule).filter(([k]) => !k.includes('schedule')).slice(0, 4).map(([platform, data]: [string, any]) => (
                <div key={platform} style={{ padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 10, border: '1px solid var(--line)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t2)', marginBottom: 4, textTransform: 'capitalize' }}>{platform}</div>
                  <div style={{ fontSize: 10, color: 'var(--t4)' }}>Best times: {data.best_times?.slice(0, 2).join(', ')}</div>
                  <div style={{ fontSize: 10, color: 'var(--t5)', marginTop: 2 }}>{data.frequency}</div>
                </div>
              ))}
            </div>
          )}

          {/* Insights agent results */}
          {agentResult.type === 'insights' && agentResult.data.insights && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {agentResult.data.insights.summary && (
                <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 }}>{agentResult.data.insights.summary}</div>
              )}
              {agentResult.data.insights.recommendations?.slice(0, 2).map((r: any, i: number) => (
                <div key={i} style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid var(--line)', display: 'flex', gap: 8 }}>
                  <span style={{ color: r.impact === 'high' ? 'var(--cyan)' : '#00d68f', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{r.impact?.toUpperCase()}</span>
                  <span style={{ fontSize: 12, color: 'var(--t3)' }}>{r.action}</span>
                </div>
              ))}
              {agentResult.data.insights.big_opportunity && (
                <div style={{ padding: '10px 14px', background: 'rgba(0,170,255,0.05)', border: '1px solid var(--cline2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--cyan)', marginBottom: 4 }}>BIG OPPORTUNITY</div>
                  <div style={{ fontSize: 12, color: 'var(--t2)' }}>{agentResult.data.insights.big_opportunity}</div>
                </div>
              )}
            </div>
          )}

          {agentResult.type === 'content' && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--t4)' }}>
              {agentResult.data.posts?.length} posts saved as drafts in Studio →
              <a href="/dashboard/studio" style={{ color: 'var(--cyan)', textDecoration: 'none', marginLeft: 6 }}>View in Studio</a>
            </div>
          )}
        </div>
      )}

      {/* Activity + Brand learnings row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

        {/* Activity feed */}
        <div style={{ background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 12 }}>Activity Feed</div>
          {activity.length > 0 ? activity.slice(0, 6).map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--line)' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: actColor(item.type), marginTop: 5, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.4 }}>{item.title}</div>
                <div style={{ fontSize: 10, color: 'var(--t5)', marginTop: 2 }}>{formatDistanceToNow(new Date(item.created_at))} ago</div>
              </div>
            </div>
          )) : (
            <div style={{ fontSize: 12, color: 'var(--t5)', textAlign: 'center', padding: '20px 0' }}>Activity appears as you use Nexa.</div>
          )}
        </div>

        {/* Brand learnings */}
        <div style={{ background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Brand Intelligence</div>
            <a href="/dashboard/brand" style={{ fontSize: 11, color: 'var(--cyan)', textDecoration: 'none' }}>Manage →</a>
          </div>
          {brandLearnings.length > 0 ? brandLearnings.slice(0, 5).map(learning => (
            <div key={learning.id} style={{ display: 'flex', gap: 8, marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--line)' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--orange)', background: 'rgba(212,82,26,0.08)', border: '1px solid rgba(212,82,26,0.2)', padding: '1px 6px', borderRadius: 3, textTransform: 'uppercase', flexShrink: 0, height: 'fit-content', marginTop: 1 }}>{learning.insight_type}</span>
              <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{learning.insight}</div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 12, color: 'var(--t5)', marginBottom: 10 }}>Nexa learns as you use it. Upload brand assets to start.</div>
              <a href="/dashboard/brand" style={{ fontSize: 12, fontWeight: 600, color: 'var(--cyan)', textDecoration: 'none', padding: '6px 14px', background: 'var(--cglow2)', border: '1px solid var(--cline2)', borderRadius: 7 }}>Open Brand Brain →</a>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {[
          { label: 'Generate content', href: '/dashboard/studio', icon: '✍️' },
          { label: 'Build strategy', href: '/dashboard/strategy', icon: '🧠' },
          { label: 'Schedule posts', href: '/dashboard/schedule', icon: '📅' },
          { label: 'Brand Brain', href: '/dashboard/brand', icon: '⚡' },
        ].map(action => (
          <a key={action.label} href={action.href}
            style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 14px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 10, fontSize: 12.5, fontWeight: 600, color: 'var(--t3)', textDecoration: 'none' }}>
            <span style={{ fontSize: 14 }}>{action.icon}</span>
            {action.label}
          </a>
        ))}
      </div>

    </div>
  )
}
