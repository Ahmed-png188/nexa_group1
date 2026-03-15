'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import Link from 'next/link'

/* ─────────────────────────────────────────────────
   ICONS — one family, 1.5 stroke, round caps
───────────────────────────────────────────────── */
const Ic = {
  bolt:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  copy:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  clock:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  msg:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  chart:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18"/><path d="M5 20V14l4-4 4 3 4-6 4 4v9"/></svg>,
  cal:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  brain:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>,
  star:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  arrow:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  check:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  play:    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  close:   <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
}

/* ─────────────────────────────────────────────────
   AGENT CONFIG
───────────────────────────────────────────────── */
const AGENTS = [
  {
    id: 'content',
    name: 'Content Agent',
    tagline: 'A full week of posts, written in your voice',
    color: '#4D9FFF',
    cost: 'Free',
  },
  {
    id: 'timing',
    name: 'Timing Agent',
    tagline: 'The exact windows your audience is most receptive',
    color: '#34D399',
    cost: 'Free',
  },
  {
    id: 'engagement',
    name: 'Engagement Agent',
    tagline: 'Replies that sound like you, not a bot',
    color: '#FF7A40',
    cost: 'Free',
  },
  {
    id: 'insights',
    name: 'Insights Agent',
    tagline: 'Weekly performance digest with clear next steps',
    color: '#A78BFA',
    cost: 'Free',
  },
]

/* ─────────────────────────────────────────────────
   ANIMATED COUNTER
───────────────────────────────────────────────── */
function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const startRef = useRef<number | null>(null)
  const rafRef   = useRef<number>()

  useEffect(() => {
    if (value === 0) return
    startRef.current = null
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const progress = Math.min((ts - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [value, duration])

  return <>{display.toLocaleString()}</>
}

/* ─────────────────────────────────────────────────
   PLATFORM DOT
───────────────────────────────────────────────── */
const PLAT_COLORS: Record<string, string> = {
  instagram: '#E1306C', linkedin: '#0A66C2', x: '#E7E7E7',
  tiktok: '#FF0050', email: '#4D9FFF', general: '#888',
}

/* ─────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────── */
export default function HomePage() {
  const supabase = createClient()

  const [profile,    setProfile]    = useState<any>(null)
  const [workspace,  setWorkspace]  = useState<any>(null)
  const [credits,    setCredits]    = useState<any>(null)
  const [content,    setContent]    = useState<any[]>([])
  const [scheduled,  setScheduled]  = useState<any[]>([])
  const [activity,   setActivity]   = useState<any[]>([])
  const [agentRuns,  setAgentRuns]  = useState<any[]>([])
  const [brandData,  setBrandData]  = useState<any>(null)
  const [learnings,  setLearnings]  = useState<any[]>([])
  const [running,    setRunning]    = useState<string | null>(null)
  const [result,     setResult]     = useState<any>(null)
  const [loading,    setLoading]    = useState(true)
  const [mounted,    setMounted]    = useState(false)

  useEffect(() => { setMounted(true); load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    const { data: m } = await supabase.from('workspace_members')
      .select('workspace_id, workspaces(*)').eq('user_id', user.id).limit(1).single()
    const ws = (m as any)?.workspaces
    setProfile(p); setWorkspace(ws)

    const [cr, ct, sc, ac] = await Promise.all([
      supabase.from('credits').select('balance,lifetime_used').eq('workspace_id', ws?.id).single(),
      supabase.from('content').select('*').eq('workspace_id', ws?.id).order('created_at', { ascending: false }).limit(6),
      supabase.from('content').select('*').eq('workspace_id', ws?.id).eq('status', 'scheduled').order('scheduled_for', { ascending: true }).limit(5),
      supabase.from('activity').select('*').eq('workspace_id', ws?.id).order('created_at', { ascending: false }).limit(10),
    ])

    let runs: any[] = []
    let brand: any = null
    let lg: any[] = []

    try {
      const r = await supabase.from('agent_runs').select('*').eq('workspace_id', ws?.id).order('created_at', { ascending: false }).limit(20)
      runs = r.data ?? []
    } catch {}
    try {
      const r = await supabase.from('brand_assets').select('analysis').eq('workspace_id', ws?.id).eq('file_name', 'nexa_brand_intelligence.json').single()
      brand = r.data?.analysis ?? null
    } catch {}
    try {
      const r = await supabase.from('brand_learnings').select('*').eq('workspace_id', ws?.id).order('created_at', { ascending: false }).limit(6)
      lg = r.data ?? []
    } catch {}

    setCredits(cr.data)
    setContent(ct.data ?? [])
    setScheduled(sc.data ?? [])
    setActivity(ac.data ?? [])
    setAgentRuns(runs)
    setBrandData(brand)
    setLearnings(lg)
    setLoading(false)

    supabase.channel('home-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity', filter: `workspace_id=eq.${ws?.id}` }, () => load())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'credits', filter: `workspace_id=eq.${ws?.id}` }, (p: any) => {
        if (p.new?.balance !== undefined) setCredits((c: any) => ({ ...c, balance: p.new.balance }))
      })
      .subscribe()
  }

  async function runAgent(id: string) {
    if (!workspace || running) return
    setRunning(id); setResult(null)
    try {
      const r = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspace.id, agent_type: id }),
      })
      const d = await r.json()
      try {
        await supabase.from('agent_runs').insert({
          workspace_id: workspace.id, agent_type: id,
          status: d.success ? 'completed' : 'failed', result: d,
        })
      } catch {}
      setResult({ type: id, data: d })
      load()
    } catch {}
    setRunning(null)
  }

  /* ── Derived ── */
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const balance = credits?.balance ?? 0
  const published = content.filter(c => c.status === 'published').length
  const actColor = (type: string) => {
    if (type?.includes('generat') || type?.includes('creat')) return '#4D9FFF'
    if (type?.includes('publish') || type?.includes('schedul')) return '#34D399'
    if (type?.includes('agent')) return '#A78BFA'
    if (type?.includes('brand') || type?.includes('analyz')) return '#FF7A40'
    return 'rgba(255,255,255,0.25)'
  }

  /* ── Loading skeleton ── */
  if (loading) return (
    <div style={{ padding: '32px 28px', height: 'calc(100vh - var(--topbar-h))', overflow: 'hidden' }}>
      {/* Hero skeleton */}
      <div style={{ height: 180, borderRadius: 20, background: 'rgba(255,255,255,0.04)', marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite' }}/>
      </div>
      {/* Cards skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[180, 240].map(h => (
          <div key={h} style={{ height: h, borderRadius: 16, background: 'rgba(255,255,255,0.03)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite' }}/>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ padding: '28px 28px 40px', height: 'calc(100vh - var(--topbar-h))', overflowY: 'auto', overflowX: 'hidden' }}>

      {/* ═══════════════════════════════════════════════════
          HERO — The Ofinans moment. Full-bleed painted canvas.
      ═══════════════════════════════════════════════════ */}
      <div style={{
        position: 'relative',
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 14,
        border: '1px solid rgba(255,255,255,0.08)',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}>
        {/* Painted atmospheric background — the key visual */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, #060d1a 0%, #080618 40%, #130616 70%, #1a0908 100%)',
        }}/>
        {/* Left orb — cyan */}
        <div style={{
          position: 'absolute', top: -80, left: -40,
          width: 340, height: 340, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14,165,255,0.38) 0%, rgba(14,165,255,0.12) 40%, transparent 70%)',
          pointerEvents: 'none',
        }}/>
        {/* Center orb — purple */}
        <div style={{
          position: 'absolute', top: -60, left: '35%', transform: 'translateX(-50%)',
          width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(120,80,255,0.32) 0%, rgba(120,80,255,0.08) 45%, transparent 70%)',
          pointerEvents: 'none',
        }}/>
        {/* Right orb — orange */}
        <div style={{
          position: 'absolute', top: -50, right: -60,
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,80,30,0.28) 0%, rgba(255,80,30,0.08) 45%, transparent 70%)',
          pointerEvents: 'none',
        }}/>
        {/* Subtle noise overlay for depth */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.03\'/%3E%3C/svg%3E")',
          pointerEvents: 'none',
        }}/>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, padding: '28px 32px 24px' }}>

          {/* Greeting */}
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.38)', marginBottom: 6,
          }}>
            {greeting}
          </div>

          {/* Name — big Syne 800 */}
          <div style={{
            fontFamily: 'var(--display)', fontSize: 32, fontWeight: 800,
            letterSpacing: '-0.05em', color: '#F4F0FF', lineHeight: 1, marginBottom: 28,
          }}>
            {firstName}'s Workspace
          </div>

          {/* 4 stats inline — the Ofinans row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            borderTop: '1px solid rgba(255,255,255,0.09)',
            paddingTop: 20,
          }}>
            {[
              {
                label: 'Credits',
                value: balance,
                tag: workspace?.plan || 'spark',
                tagColor: '#4D9FFF',
                href: '/dashboard/settings?tab=billing',
              },
              {
                label: 'Content created',
                value: content.length,
                tag: `${published} published`,
                tagColor: '#34D399',
                href: '/dashboard/studio',
              },
              {
                label: 'Scheduled',
                value: scheduled.length,
                tag: 'upcoming',
                tagColor: '#FFB547',
                href: '/dashboard/schedule',
              },
              {
                label: 'Agent runs',
                value: agentRuns.length,
                tag: 'total',
                tagColor: '#A78BFA',
                href: '/dashboard/automate',
              },
            ].map((s, i) => (
              <Link key={i} href={s.href} style={{
                textDecoration: 'none',
                padding: i === 0 ? '0 24px 0 0' : i === 3 ? '0 0 0 24px' : '0 24px',
                borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                display: 'block',
              }}>
                {/* Label + tag */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  fontSize: 10, color: 'rgba(255,255,255,0.38)',
                  fontWeight: 500, marginBottom: 8, letterSpacing: '0.02em',
                }}>
                  {s.label}
                  <span style={{
                    color: s.tagColor, fontWeight: 700, fontSize: 10,
                    background: `${s.tagColor}18`,
                    border: `1px solid ${s.tagColor}28`,
                    padding: '1px 6px', borderRadius: 4,
                  }}>
                    {s.tag}
                  </span>
                </div>
                {/* Big number */}
                <div style={{
                  fontFamily: 'var(--display)', fontSize: 34, fontWeight: 800,
                  letterSpacing: '-0.05em', color: '#F4F0FF', lineHeight: 1,
                }}>
                  <AnimatedNumber value={s.value} duration={900}/>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          MAIN GRID — 2 column, responds to chat open/close
      ═══════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>

        {/* ── LEFT: AI AGENTS ── */}
        <div style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 18,
          padding: '20px 22px',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.5s ease 0.08s, transform 0.5s ease 0.08s',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.02em', marginBottom: 2 }}>
                AI Agents
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)' }}>
                Autopilot for your brand
              </div>
            </div>
            <Link href="/dashboard/automate" style={{
              fontSize: 11, fontWeight: 600, color: '#4D9FFF', textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 4, opacity: 0.75,
              transition: 'opacity 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '0.75'}>
              All agents <span style={{ display: 'flex' }}>{Ic.arrow}</span>
            </Link>
          </div>

          {/* Agent list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {AGENTS.map((agent, i) => {
              const lastRun = agentRuns.find(r => r.agent_type === agent.id)
              const isRunning = running === agent.id
              const completedToday = agentRuns.filter(r => r.agent_type === agent.id && r.status === 'completed').length

              return (
                <div key={agent.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: isRunning ? `${agent.color}0c` : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${isRunning ? `${agent.color}28` : 'rgba(255,255,255,0.06)'}`,
                  transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                  cursor: 'default',
                }}
                  onMouseEnter={e => {
                    if (!isRunning) {
                      (e.currentTarget as HTMLElement).style.background = `${agent.color}08`
                      ;(e.currentTarget as HTMLElement).style.borderColor = `${agent.color}20`
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isRunning) {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)'
                      ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'
                    }
                  }}>

                  {/* Color indicator */}
                  <div style={{
                    width: 3, height: 28, borderRadius: 3,
                    background: isRunning ? agent.color : 'rgba(255,255,255,0.1)',
                    boxShadow: isRunning ? `0 0 8px ${agent.color}` : 'none',
                    flexShrink: 0,
                    transition: 'all 0.2s',
                  }}/>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 2, letterSpacing: '-0.01em' }}>
                      {agent.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', lineHeight: 1.4 }}>
                      {lastRun
                        ? `Last run ${formatDistanceToNow(new Date(lastRun.created_at))} ago${completedToday > 0 ? ` · ${completedToday}× total` : ''}`
                        : agent.tagline}
                    </div>
                  </div>

                  {/* Run button */}
                  <button
                    onClick={() => runAgent(agent.id)}
                    disabled={!!running}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '6px 14px', borderRadius: 8,
                      fontSize: 11, fontWeight: 700, fontFamily: 'var(--sans)',
                      background: isRunning ? agent.color : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${isRunning ? 'transparent' : 'rgba(255,255,255,0.09)'}`,
                      color: isRunning ? '#000' : 'rgba(255,255,255,0.5)',
                      cursor: running ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s',
                      whiteSpace: 'nowrap',
                      letterSpacing: '-0.01em',
                      boxShadow: isRunning ? `0 0 14px ${agent.color}40` : 'none',
                    }}
                    onMouseEnter={e => {
                      if (!running) {
                        (e.currentTarget as HTMLElement).style.background = `${agent.color}18`
                        ;(e.currentTarget as HTMLElement).style.borderColor = `${agent.color}33`
                        ;(e.currentTarget as HTMLElement).style.color = agent.color
                      }
                    }}
                    onMouseLeave={e => {
                      if (!running && !isRunning) {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'
                        ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.09)'
                        ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'
                      }
                    }}>
                    {isRunning ? (
                      <>
                        <div style={{
                          width: 8, height: 8,
                          border: '1.5px solid rgba(0,0,0,0.3)',
                          borderTopColor: '#000',
                          borderRadius: '50%',
                          animation: 'pageSpin 0.7s linear infinite',
                        }}/>
                        Running
                      </>
                    ) : (
                      <><span style={{ display: 'flex' }}>{Ic.play}</span>Run</>
                    )}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Agent result */}
          {result && (
            <div style={{
              marginTop: 12,
              padding: '12px 14px',
              background: 'rgba(52,211,153,0.06)',
              border: '1px solid rgba(52,211,153,0.2)',
              borderRadius: 11,
              animation: 'pageUp 0.3s ease both',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'flex', color: '#34D399' }}>{Ic.check}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#34D399' }}>
                    {AGENTS.find(a => a.id === result.type)?.name} completed
                  </span>
                </div>
                <button
                  onClick={() => setResult(null)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex' }}>
                  {Ic.close}
                </button>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                {result.data.posts?.length > 0
                  ? <>{result.data.posts.length} posts saved as drafts. <Link href="/dashboard/studio" style={{ color: '#4D9FFF', textDecoration: 'none', fontWeight: 600 }}>Open Studio →</Link></>
                  : result.data.insights?.summary || 'Done. Check your dashboard for updates.'}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: SCHEDULED + QUICK ACTIONS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Scheduled queue */}
          <div style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 18,
            padding: '20px 22px',
            flex: 1,
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.5s ease 0.14s, transform 0.5s ease 0.14s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.02em', marginBottom: 2 }}>
                  Scheduled
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)' }}>
                  {scheduled.length > 0 ? `${scheduled.length} post${scheduled.length !== 1 ? 's' : ''} queued` : 'Nothing queued yet'}
                </div>
              </div>
              <Link href="/dashboard/schedule" style={{ fontSize: 11, fontWeight: 600, color: '#FFB547', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, opacity: 0.75, transition: 'opacity 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '0.75'}>
                Manage <span style={{ display: 'flex' }}>{Ic.arrow}</span>
              </Link>
            </div>

            {scheduled.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {scheduled.map(item => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 10,
                    transition: 'border-color 0.15s',
                    cursor: 'default',
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.11)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'}>
                    {/* Platform dot */}
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                      background: PLAT_COLORS[item.platform] || '#888',
                    }}/>
                    <span style={{
                      fontSize: 12, color: 'rgba(255,255,255,0.65)', flex: 1,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      letterSpacing: '-0.01em',
                    }}>
                      {item.title || item.body?.slice(0, 45) || 'Post'}
                    </span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', flexShrink: 0 }}>
                      {item.scheduled_for ? format(parseISO(item.scheduled_for), 'MMM d') : '—'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '20px 0', textAlign: 'center',
              }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', lineHeight: 1.7, marginBottom: 12 }}>
                  Your scheduled posts will appear here.
                </div>
                <Link href="/dashboard/studio" style={{
                  fontSize: 12, fontWeight: 700, color: '#4D9FFF',
                  textDecoration: 'none', padding: '7px 16px',
                  background: 'rgba(77,159,255,0.08)',
                  border: '1px solid rgba(77,159,255,0.2)',
                  borderRadius: 8, transition: 'all 0.15s',
                }}>
                  Create your first post →
                </Link>
              </div>
            )}
          </div>

          {/* Quick actions — 4 buttons */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7,
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s',
          }}>
            {[
              { label: 'Write content', sub: 'Studio', href: '/dashboard/studio', color: '#4D9FFF', icon: Ic.copy },
              { label: 'Build strategy', sub: 'Strategy', href: '/dashboard/strategy', color: '#A78BFA', icon: Ic.star },
              { label: 'Schedule', sub: 'Calendar', href: '/dashboard/schedule', color: '#FFB547', icon: Ic.cal },
              { label: 'Brand Brain', sub: 'Intelligence', href: '/dashboard/brand', color: '#34D399', icon: Ic.brain },
            ].map(a => (
              <Link key={a.label} href={a.href} style={{
                display: 'flex', flexDirection: 'column', gap: 8,
                padding: '14px 16px',
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14,
                textDecoration: 'none',
                transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
                cursor: 'pointer',
              }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = `${a.color}0e`
                  el.style.borderColor = `${a.color}30`
                  el.style.transform = 'translateY(-2px)'
                  el.style.boxShadow = `0 8px 24px ${a.color}14`
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'rgba(255,255,255,0.025)'
                  el.style.borderColor = 'rgba(255,255,255,0.07)'
                  el.style.transform = 'translateY(0)'
                  el.style.boxShadow = 'none'
                }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ color: a.color, display: 'flex' }}>{a.icon}</div>
                  <div style={{ color: 'rgba(255,255,255,0.2)', display: 'flex' }}>{Ic.arrow}</div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.82)', letterSpacing: '-0.02em', marginBottom: 1 }}>{a.label}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>{a.sub}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          BOTTOM ROW — Activity + Brand Intelligence
      ═══════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

        {/* Activity feed */}
        <div style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 18,
          padding: '20px 22px',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.5s ease 0.22s, transform 0.5s ease 0.22s',
        }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.02em', marginBottom: 2 }}>
              Activity
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)' }}>
              Everything happening in real time
            </div>
          </div>

          {activity.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {activity.slice(0, 7).map((item, i) => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 11,
                  padding: '9px 0',
                  borderBottom: i < 6 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  {/* Colored dot */}
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                    background: actColor(item.type),
                    boxShadow: `0 0 6px ${actColor(item.type)}80`,
                  }}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, letterSpacing: '-0.01em' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
                      {item.created_at ? formatDistanceToNow(parseISO(item.created_at)) + ' ago' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'rgba(77,159,255,0.06)', border: '1px solid rgba(77,159,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(77,159,255,0.5)', margin: '0 auto 12px',
              }}>
                {Ic.bolt}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.7 }}>
                Every generation, publish, and run<br/>appears here as it happens.
              </div>
            </div>
          )}
        </div>

        {/* Brand Intelligence */}
        <div style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 18,
          padding: '20px 22px',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.5s ease 0.28s, transform 0.5s ease 0.28s',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.02em', marginBottom: 2 }}>
                Brand Intelligence
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)' }}>
                {brandData ? 'Your brand profile is active' : 'Not yet trained'}
              </div>
            </div>
            {brandData && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 6px #34D399', animation: 'pulse-dot 2.2s ease-in-out infinite' }}/>
                <span style={{ fontSize: 10, color: '#34D399', fontWeight: 600 }}>Active</span>
              </div>
            )}
          </div>

          {brandData ? (
            <div>
              {/* Score bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Voice match',    score: brandData.voice_match_score || 88,    color: 'linear-gradient(90deg, #4D9FFF, #7B6FFF)' },
                  { label: 'Audience fit',   score: brandData.audience_fit_score || 85,   color: 'linear-gradient(90deg, #34D399, #4D9FFF)' },
                  { label: 'Visual style',   score: brandData.visual_style_score || 92,   color: 'linear-gradient(90deg, #A78BFA, #FF7A40)' },
                ].map(m => (
                  <div key={m.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', letterSpacing: '-0.01em' }}>{m.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.78)' }}>{m.score}%</span>
                    </div>
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', background: m.color, borderRadius: 3,
                        width: `${m.score}%`,
                        transition: 'width 1.4s cubic-bezier(0.34,1.56,0.64,1)',
                      }}/>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent learnings */}
              {learnings.length > 0 && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '.09em', textTransform: 'uppercase', marginBottom: 10 }}>
                    Recent learnings
                  </div>
                  {learnings.slice(0, 2).map(l => (
                    <div key={l.id} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, flexShrink: 0, height: 'fit-content', marginTop: 1,
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                        background: 'rgba(255,122,64,0.09)',
                        border: '1px solid rgba(255,122,64,0.2)',
                        color: '#FF7A40',
                      }}>{l.insight_type || 'insight'}</span>
                      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.48)', lineHeight: 1.55 }}>
                        {l.insight?.slice(0, 80)}{(l.insight?.length || 0) > 80 ? '…' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '16px 0' }}>
              {/* Decorative rings */}
              <div style={{ position: 'relative', width: 56, height: 56, marginBottom: 16 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(167,139,250,0.15)' }}/>
                <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '1px solid rgba(167,139,250,0.22)' }}/>
                <div style={{ position: 'absolute', inset: 16, borderRadius: '50%', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A78BFA' }}>
                  {Ic.brain}
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 6, letterSpacing: '-0.01em' }}>
                Brand Brain isn't trained yet
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.7, marginBottom: 16, maxWidth: 240 }}>
                Upload your brand assets and Nexa learns your voice, style, and audience deeply.
              </div>
              <Link href="/dashboard/brand" style={{
                fontSize: 12, fontWeight: 700, color: '#A78BFA', textDecoration: 'none',
                padding: '8px 18px', background: 'rgba(167,139,250,0.08)',
                border: '1px solid rgba(167,139,250,0.22)', borderRadius: 9,
                transition: 'all 0.15s', letterSpacing: '-0.01em',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(167,139,250,0.14)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(167,139,250,0.35)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(167,139,250,0.08)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(167,139,250,0.22)'
                }}>
                Train Brand Brain →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
