'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function StrategyPage() {
  const supabase = createClient()
  const [workspace, setWorkspace] = useState<any>(null)
  const [strategy, setStrategy] = useState<any>(null)
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'pillars' | 'angles' | 'plan' | 'schedule'>('overview')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: membership } = await supabase
        .from('workspace_members').select('workspace_id, workspaces(*)')
        .eq('user_id', user.id).limit(1).single()
      const ws = (membership as any)?.workspaces
      setWorkspace(ws)

      // Load existing strategy
      const { data: plan } = await supabase
        .from('strategy_plans').select('*')
        .eq('workspace_id', ws?.id).eq('status', 'active')
        .order('generated_at', { ascending: false }).limit(1).single()

      if (plan) {
        setStrategy({
          audience_psychology: plan.audience_map,
          content_pillars: plan.content_pillars,
          weekly_schedule: plan.platform_strategy,
          top_performing_angles: plan.insights?.top_angles,
          month_one_plan: plan.daily_plan,
          key_insights: plan.insights?.key_insights,
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  async function generateStrategy() {
    if (!workspace || generating) return
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspace.id }),
      })
      const data = await res.json()
      if (data.success) setStrategy(data.strategy)
    } catch (err) {
      console.error(err)
    }
    setGenerating(false)
  }

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'pillars', label: 'Content Pillars' },
    { id: 'angles', label: 'Top Angles' },
    { id: 'plan', label: '30-Day Plan' },
    { id: 'schedule', label: 'Weekly Schedule' },
  ] as const

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div style={{ fontSize: 13, color: 'var(--t4)' }}>Loading strategy...</div>
    </div>
  )

  if (!strategy && !generating) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: 40, textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(0,170,255,0.07)', border: '1px solid var(--cline2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="1.5" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      </div>
      <h1 style={{ fontFamily: 'var(--display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--t1)', marginBottom: 12 }}>
        Your 30-day strategy
      </h1>
      <p style={{ fontSize: 14, color: 'var(--t4)', maxWidth: 420, lineHeight: 1.75, marginBottom: 10 }}>
        Nexa will analyze your brand and build a complete content strategy — audience psychology map, content pillars, top-performing angles, and a day-by-day plan.
      </p>
      <p style={{ fontSize: 13, color: 'var(--cyan)', fontWeight: 600, marginBottom: 32 }}>
        Strategy generation is always free.
      </p>
      <button onClick={generateStrategy} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '13px 28px', fontSize: 14, fontWeight: 700, background: 'var(--cyan)', color: '#000', border: 'none', borderRadius: 11, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        Build my strategy
      </button>
    </div>
  )

  if (generating) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center', padding: 40 }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(0,170,255,0.07)', border: '1px solid var(--cline2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, animation: 'breathe 2s ease-in-out infinite' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="1.5" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      </div>
      <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--t1)', marginBottom: 8 }}>
        Building your strategy...
      </h2>
      <p style={{ fontSize: 13, color: 'var(--t4)', marginBottom: 28 }}>Analyzing your brand and mapping your audience psychology. This takes about 15 seconds.</p>
      <div style={{ display: 'flex', gap: 5 }}>
        {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--cyan)', animation: `pulse-dot 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
      </div>
    </div>
  )

  const aud = strategy?.audience_psychology
  const pillars = strategy?.content_pillars ?? []
  const angles = strategy?.top_performing_angles ?? []
  const plan = strategy?.month_one_plan ?? []
  const schedule = strategy?.weekly_schedule ?? {}
  const insights = strategy?.key_insights ?? []

  return (
    <div style={{ padding: '28px', maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 4 }}>Strategy</h1>
          <p style={{ fontSize: 13, color: 'var(--t4)' }}>{workspace?.brand_name ?? workspace?.name} · 30-day content blueprint</p>
        </div>
        <button onClick={generateStrategy} disabled={generating} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', fontSize: 12, fontWeight: 700, background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 9, cursor: 'pointer', color: 'var(--t3)', fontFamily: 'var(--sans)', transition: 'all .15s' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          Regenerate
        </button>
      </div>

      {/* Key insights banner */}
      {insights.length > 0 && (
        <div style={{ padding: '14px 18px', background: 'rgba(0,170,255,0.04)', border: '1px solid var(--cline2)', borderRadius: 12, marginBottom: 20, borderLeft: '2px solid var(--cyan)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--cyan)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Key insights</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {insights.map((insight: string, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.5 }}>
                <span style={{ color: 'var(--cyan)', flexShrink: 0, marginTop: 1 }}>→</span>
                {insight}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid var(--line)', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '8px 14px', fontSize: 13, fontWeight: activeTab === t.id ? 700 : 500,
            color: activeTab === t.id ? 'var(--t1)' : 'var(--t4)',
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--sans)', position: 'relative',
            borderBottom: activeTab === t.id ? '2px solid var(--cyan)' : '2px solid transparent',
            marginBottom: -1, transition: 'all .15s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && aud && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Core desire',       value: aud.core_desire,        color: 'var(--cyan)' },
            { label: 'Core fear',         value: aud.core_fear,          color: '#ff6b6b' },
            { label: 'Identity',          value: aud.identity,           color: 'rgba(150,90,255,0.9)' },
            { label: 'Content they love', value: aud.content_they_love,  color: '#00d68f' },
            { label: 'Content they hate', value: aud.content_they_hate,  color: 'var(--amber)' },
          ].map(item => (
            <div key={item.label} style={{ padding: '16px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: item.color, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>{item.label}</div>
              <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 }}>{item.value}</div>
            </div>
          ))}
          {aud.trigger_words && (
            <div style={{ padding: '16px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t4)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>Trigger words</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {aud.trigger_words.map((w: string, i: number) => (
                  <span key={i} style={{ fontSize: 12, fontWeight: 600, padding: '4px 11px', background: 'var(--cglow2)', border: '1px solid var(--cline2)', borderRadius: 100, color: 'var(--cyan)' }}>{w}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PILLARS ── */}
      {activeTab === 'pillars' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pillars.map((p: any, i: number) => (
            <div key={i} style={{ padding: '18px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>{p.name}</div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', background: 'var(--cglow2)', border: '1px solid var(--cline2)', borderRadius: 100, color: 'var(--cyan)' }}>{p.frequency}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--t3)', lineHeight: 1.65, marginBottom: 10 }}>{p.description}</p>
              <div style={{ padding: '10px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--line)', borderRadius: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t5)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>Example angle</div>
                <div style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.55, fontStyle: 'italic' }}>{p.example_angle}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ANGLES ── */}
      {activeTab === 'angles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {angles.map((a: any, i: number) => (
            <div key={i} style={{ padding: '18px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--cglow2)', border: '1px solid var(--cline2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--cyan)', flexShrink: 0 }}>{i+1}</div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>{a.angle}</div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--t4)', lineHeight: 1.65, marginBottom: 12 }}>{a.why_it_works}</p>
              <div style={{ padding: '12px 14px', background: 'rgba(0,170,255,0.04)', border: '1px solid var(--cline2)', borderRadius: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--cyan)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 5 }}>Example hook</div>
                <div style={{ fontSize: 13, color: 'var(--t1)', fontWeight: 600, lineHeight: 1.5, fontStyle: 'italic' }}>"{a.example_hook}"</div>
              </div>
              <button
                onClick={() => {
                  window.location.href = '/dashboard/studio'
                  sessionStorage.setItem('nexa_prefill_prompt', `Write a ${a.angle.toLowerCase()} post using this hook: "${a.example_hook}"`)
                }}
                style={{ marginTop: 10, padding: '7px 14px', fontSize: 12, fontWeight: 600, background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 8, color: 'var(--t3)', cursor: 'pointer', fontFamily: 'var(--sans)' }}
              >
                Use in Studio →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── 30-DAY PLAN ── */}
      {activeTab === 'plan' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {plan.map((week: any) => (
            <div key={week.week} style={{ padding: '18px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>Week {week.week} — {week.theme}</div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--t4)', marginBottom: 12 }}>{week.goal}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {week.posts?.map((post: string, j: number) => (
                  <div key={j} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid var(--line)' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t5)', flexShrink: 0, marginTop: 2 }}>Day {j * 2 + 1 + (week.week - 1) * 7}</span>
                    <span style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.5 }}>{post}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── WEEKLY SCHEDULE ── */}
      {activeTab === 'schedule' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(schedule).map(([day, info]: [string, any]) => (
            <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 11 }}>
              <div style={{ width: 80, fontSize: 12, fontWeight: 700, color: 'var(--t2)', textTransform: 'capitalize', flexShrink: 0 }}>{day}</div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', background: 'var(--cglow2)', border: '1px solid var(--cline2)', borderRadius: 100, color: 'var(--cyan)', flexShrink: 0, textTransform: 'uppercase' }}>{info.platform}</span>
              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', background: 'var(--glass2)', border: '1px solid var(--line)', borderRadius: 100, color: 'var(--t4)', flexShrink: 0, textTransform: 'capitalize' }}>{info.type}</span>
              <span style={{ fontSize: 12.5, color: 'var(--t3)', flex: 1 }}>{info.angle}</span>
              <a href="/dashboard/studio" style={{ fontSize: 11, color: 'var(--cyan)', textDecoration: 'none', flexShrink: 0, fontWeight: 600 }}>Create →</a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
