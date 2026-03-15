'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type TabId = 'overview' | 'pillars' | 'angles' | 'plan' | 'schedule' | 'timing' | 'competitors'

export default function StrategyPage() {
  const supabase = createClient()
  const [workspace, setWorkspace] = useState<any>(null)
  const [strategy, setStrategy] = useState<any>(null)
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  // Timing state
  const [timingData, setTimingData] = useState<any>(null)
  const [generatingTiming, setGeneratingTiming] = useState(false)

  // Competitor state
  const [competitorData, setCompetitorData] = useState<any>(null)
  const [generatingCompetitors, setGeneratingCompetitors] = useState(false)
  const [competitorInput, setCompetitorInput] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: membership } = await supabase
        .from('workspace_members').select('workspace_id, workspaces(*)')
        .eq('user_id', user.id).limit(1).single()
      const ws = (membership as any)?.workspaces
      setWorkspace(ws)
      setCompetitorInput(ws?.brand_tone || '')

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
        // Load timing if saved
        if (plan.platform_strategy?.timing) setTimingData(plan.platform_strategy.timing)
      }

      // Load competitor data from brand learnings
      const { data: learnings } = await supabase
        .from('brand_learnings')
        .select('*')
        .eq('workspace_id', ws?.id)
        .eq('source_name', 'Competitor Analysis')
        .order('created_at', { ascending: false })
        .limit(1)

      setLoading(false)
    }
    load()
  }, [])

  async function generateStrategy() {
    if (!workspace || generating) return
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-strategy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspace.id }),
      })
      const data = await res.json()
      if (data.success) setStrategy(data.strategy)
    } catch (err) { console.error(err) }
    setGenerating(false)
  }

  async function generateTiming() {
    if (!workspace || generatingTiming) return
    setGeneratingTiming(true)
    try {
      const res = await fetch('/api/strategy-timing', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspace.id }),
      })
      const data = await res.json()
      if (data.success) setTimingData(data.timing)
    } catch (err) { console.error(err) }
    setGeneratingTiming(false)
  }

  async function generateCompetitorAnalysis() {
    if (!workspace || generatingCompetitors) return
    setGeneratingCompetitors(true)
    try {
      const res = await fetch('/api/competitor-analysis', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspace.id, competitors: competitorInput }),
      })
      const data = await res.json()
      if (data.success) setCompetitorData(data.analysis)
    } catch (err) { console.error(err) }
    setGeneratingCompetitors(false)
  }

  const TABS = [
    { id: 'overview' as TabId,    label: 'Overview' },
    { id: 'pillars' as TabId,     label: 'Pillars' },
    { id: 'angles' as TabId,      label: 'Angles' },
    { id: 'plan' as TabId,        label: '30-Day Plan' },
    { id: 'schedule' as TabId,    label: 'Schedule' },
    { id: 'timing' as TabId,      label: '⏰ Timing' },
    { id: 'competitors' as TabId, label: '🎯 Competitors' },
  ]

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
      <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 10 }}>Build your content strategy</h2>
      <p style={{ fontSize: 14, color: 'var(--t4)', lineHeight: 1.7, maxWidth: 460, marginBottom: 28 }}>
        Nexa will analyze your brand and build a complete strategy — audience psychology, content pillars, top angles, 30-day plan, optimal timing, and competitive intelligence.
      </p>
      <button onClick={generateStrategy} style={{ padding: '13px 32px', fontSize: 14, fontWeight: 700, background: 'var(--cyan)', color: '#000', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
        Build my strategy →
      </button>
    </div>
  )

  if (generating) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 14 }}>
      <div style={{ width: 36, height: 36, border: '2px solid rgba(0,170,255,0.2)', borderTopColor: 'var(--cyan)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ fontSize: 14, color: 'var(--t2)', fontWeight: 600 }}>Building your strategy...</div>
      <div style={{ fontSize: 12, color: 'var(--t5)' }}>Analyzing your brand, audience, and content patterns</div>
    </div>
  )

  const aud = strategy?.audience_psychology ?? {}
  const pillars = strategy?.content_pillars ?? []
  const angles = strategy?.top_performing_angles ?? []
  const schedule = strategy?.weekly_schedule ?? {}
  const plan = strategy?.month_one_plan ?? []
  const insights = strategy?.key_insights ?? []

  return (
    <div style={{ padding: '28px', maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 3 }}>Strategy</h1>
          <div style={{ fontSize: 12, color: 'var(--t4)' }}>Your AI-powered content intelligence</div>
        </div>
        <button onClick={generateStrategy} disabled={generating}
          style={{ padding: '8px 18px', fontSize: 12, fontWeight: 700, background: 'var(--glass)', color: 'var(--t3)', border: '1px solid var(--line2)', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
          ↺ Regenerate
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', marginBottom: 24, gap: 0, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === t.id ? 700 : 500, color: activeTab === t.id ? 'var(--t1)' : 'var(--t4)', borderBottom: activeTab === t.id ? '2px solid var(--cyan)' : '2px solid transparent', fontFamily: 'var(--sans)', whiteSpace: 'nowrap', transition: 'all .15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && aud && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {insights.length > 0 && (
            <div style={{ padding: '16px 18px', background: 'rgba(0,170,255,0.04)', border: '1px solid var(--cline2)', borderRadius: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>Key Insights</div>
              {insights.map((insight: string, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7, fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 }}>
                  <span style={{ color: 'var(--cyan)', flexShrink: 0 }}>→</span> {insight}
                </div>
              ))}
            </div>
          )}
          {Object.entries(aud).slice(0, 4).map(([key, val]: [string, any]) => (
            <div key={key} style={{ padding: '14px 16px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t5)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>{key.replace(/_/g, ' ')}</div>
              <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 }}>{typeof val === 'string' ? val : Array.isArray(val) ? val.join(', ') : JSON.stringify(val)}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── PILLARS ── */}
      {activeTab === 'pillars' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {(Array.isArray(pillars) ? pillars : Object.entries(pillars)).map((pillar: any, i: number) => {
            const p = typeof pillar === 'string' ? { name: pillar, description: '', topics: [] } : Array.isArray(pillar) ? { name: pillar[0], description: pillar[1] } : pillar
            return (
              <div key={i} style={{ padding: '16px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(0,170,255,0.08)', border: '1px solid var(--cline2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--cyan)' }}>{i + 1}</div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{p.name || p.pillar || `Pillar ${i+1}`}</span>
                </div>
                {(p.description || p.purpose) && <div style={{ fontSize: 12, color: 'var(--t4)', lineHeight: 1.6, marginBottom: 8 }}>{p.description || p.purpose}</div>}
                {p.topics?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {p.topics.map((topic: string, j: number) => (
                      <span key={j} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 100, background: 'var(--glass2)', border: '1px solid var(--line)', color: 'var(--t4)' }}>{topic}</span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── ANGLES ── */}
      {activeTab === 'angles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {angles.map((angle: any, i: number) => {
            const a = typeof angle === 'string' ? { title: angle, hook: '', why: '' } : angle
            return (
              <div key={i} style={{ padding: '16px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 5, background: 'rgba(0,170,255,0.08)', border: '1px solid var(--cline2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--cyan)', flexShrink: 0 }}>{i + 1}</div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{a.title || a.angle || `Angle ${i+1}`}</span>
                </div>
                {a.hook && <div style={{ fontSize: 12, color: 'var(--cyan)', fontStyle: 'italic', marginBottom: 6, paddingLeft: 32 }}>"{a.hook}"</div>}
                {a.why && <div style={{ fontSize: 12, color: 'var(--t4)', lineHeight: 1.5, paddingLeft: 32 }}>{a.why}</div>}
              </div>
            )
          })}
        </div>
      )}

      {/* ── 30-DAY PLAN ── */}
      {activeTab === 'plan' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
          {(Array.isArray(plan) ? plan : []).map((day: any, i: number) => (
            <div key={i} style={{ padding: '12px 14px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--cyan)', marginBottom: 5 }}>Day {day.day || i+1}</div>
              <div style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 600, marginBottom: 3 }}>{day.theme || day.topic || ''}</div>
              <div style={{ fontSize: 11, color: 'var(--t4)', lineHeight: 1.5 }}>{day.content || day.description || ''}</div>
              {day.platform && <div style={{ fontSize: 9, color: 'var(--t5)', marginTop: 5, textTransform: 'uppercase', fontWeight: 600 }}>{day.platform}</div>}
            </div>
          ))}
        </div>
      )}

      {/* ── WEEKLY SCHEDULE ── */}
      {activeTab === 'schedule' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Object.entries(schedule).filter(([k]) => k !== 'timing').map(([day, info]: [string, any]) => (
            <div key={day} style={{ padding: '14px 16px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>{day}</div>
              <div style={{ fontSize: 13, color: 'var(--t3)', lineHeight: 1.6 }}>
                {typeof info === 'string' ? info : Array.isArray(info) ? info.join(', ') : JSON.stringify(info)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TIMING ENGINE ── */}
      {activeTab === 'timing' && (
        <div>
          {!timingData ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>⏰</div>
              <h3 style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 10 }}>Timing Engine</h3>
              <p style={{ fontSize: 13, color: 'var(--t4)', lineHeight: 1.7, maxWidth: 420, margin: '0 auto 24px' }}>
                Nexa analyzes your audience's psychology, daily routines, and behavior patterns to find the exact moments they're most receptive to your content.
              </p>
              <button onClick={generateTiming} disabled={generatingTiming}
                style={{ padding: '12px 32px', fontSize: 13, fontWeight: 700, background: 'var(--cyan)', color: '#000', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--sans)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {generatingTiming ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Analyzing audience...</> : 'Generate timing analysis →'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Analysis summary */}
              {timingData.analysis && (
                <div style={{ padding: '16px 18px', background: 'rgba(0,170,255,0.04)', border: '1px solid var(--cline2)', borderRadius: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Why these times work</div>
                  <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.7 }}>{timingData.analysis}</div>
                </div>
              )}

              {/* Golden hours */}
              {timingData.golden_hours && (
                <div style={{ padding: '14px 16px', background: 'rgba(212,82,26,0.06)', border: '1px solid rgba(212,82,26,0.2)', borderRadius: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>⚡ Golden Hours</div>
                  <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 }}>{timingData.golden_hours}</div>
                </div>
              )}

              {/* Platform breakdowns */}
              {timingData.platforms && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {Object.entries(timingData.platforms).map(([platform, data]: [string, any]) => (
                    <div key={platform} style={{ padding: '16px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', marginBottom: 10, textTransform: 'capitalize' }}>{platform}</div>
                      {data.best_times?.map((slot: any, i: number) => (
                        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, padding: '8px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cyan)' }}>{slot.time}</div>
                            <div style={{ fontSize: 10, color: 'var(--t5)' }}>{slot.day_type}</div>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--t4)', lineHeight: 1.5, flex: 1 }}>{slot.reason}</div>
                          <div style={{ fontSize: 9, fontWeight: 700, color: slot.engagement_potential === 'high' ? '#00d68f' : slot.engagement_potential === 'medium' ? 'var(--amber)' : 'var(--t5)', textTransform: 'uppercase', flexShrink: 0 }}>{slot.engagement_potential}</div>
                        </div>
                      ))}
                      {data.frequency && <div style={{ fontSize: 11, color: 'var(--t4)', marginTop: 6 }}>📅 {data.frequency}</div>}
                      {data.algorithm_tip && <div style={{ fontSize: 11, color: 'var(--t5)', marginTop: 4, lineHeight: 1.5 }}>💡 {data.algorithm_tip}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Weekly calendar */}
              {timingData.weekly_calendar && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', marginBottom: 10 }}>Weekly Calendar</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                    {timingData.weekly_calendar.map((day: any, i: number) => (
                      <div key={i} style={{ background: 'var(--glass)', border: '1px solid var(--line)', borderRadius: 10, padding: '10px 8px' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', marginBottom: 6 }}>{day.day?.slice(0, 3)}</div>
                        {day.slots?.map((slot: any, j: number) => (
                          <div key={j} style={{ marginBottom: 6 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--cyan)' }}>{slot.time}</div>
                            <div style={{ fontSize: 9, color: 'var(--t5)', textTransform: 'capitalize' }}>{slot.platform}</div>
                            <div style={{ fontSize: 9, color: 'var(--t4)', lineHeight: 1.4 }}>{slot.content_type}</div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {timingData.consistency_tip && (
                <div style={{ padding: '12px 16px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 10, fontSize: 12, color: 'var(--t3)', lineHeight: 1.6 }}>
                  <strong style={{ color: 'var(--t2)' }}>Key principle:</strong> {timingData.consistency_tip}
                </div>
              )}

              <button onClick={generateTiming} disabled={generatingTiming}
                style={{ alignSelf: 'flex-start', padding: '8px 16px', fontSize: 12, fontWeight: 600, background: 'var(--glass)', color: 'var(--t3)', border: '1px solid var(--line2)', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                ↺ Regenerate
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── COMPETITOR ANALYSIS ── */}
      {activeTab === 'competitors' && (
        <div>
          {!competitorData ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>🎯</div>
              <h3 style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 10 }}>Competitor Intelligence</h3>
              <p style={{ fontSize: 13, color: 'var(--t4)', lineHeight: 1.7, maxWidth: 420, margin: '0 auto 20px' }}>
                Nexa analyzes your competitive landscape to find white space, winning angles, and differentiation strategies your competitors are ignoring.
              </p>
              <div style={{ maxWidth: 420, margin: '0 auto 20px', textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--t4)', marginBottom: 7 }}>
                  Who are your competitors? (optional — Nexa will infer if blank)
                </label>
                <textarea value={competitorInput} onChange={e => setCompetitorInput(e.target.value)}
                  placeholder="e.g. Buffer, Hootsuite, Later — or describe the space: 'social media scheduling tools for small businesses'"
                  rows={3}
                  style={{ width: '100%', padding: '12px', fontSize: 13, fontFamily: 'var(--sans)', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 10, color: 'var(--t1)', outline: 'none', resize: 'vertical' }} />
              </div>
              <button onClick={generateCompetitorAnalysis} disabled={generatingCompetitors}
                style={{ padding: '12px 32px', fontSize: 13, fontWeight: 700, background: 'var(--cyan)', color: '#000', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--sans)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {generatingCompetitors ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Analyzing competitors...</> : 'Run competitor analysis →'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Market position */}
              {competitorData.market_position && (
                <div style={{ padding: '16px 18px', background: 'rgba(0,170,255,0.04)', border: '1px solid var(--cline2)', borderRadius: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Your Market Position</div>
                  <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.7 }}>{competitorData.market_position}</div>
                </div>
              )}

              {/* Positioning statement */}
              {competitorData.differentiation_strategy?.positioning_statement && (
                <div style={{ padding: '16px 18px', background: 'rgba(212,82,26,0.06)', border: '1px solid rgba(212,82,26,0.2)', borderRadius: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>⚡ Your Positioning Statement</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.5, fontFamily: 'var(--display)' }}>"{competitorData.differentiation_strategy.positioning_statement}"</div>
                </div>
              )}

              {/* White space opportunities */}
              {competitorData.white_space?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', marginBottom: 10 }}>🏳️ White Space Opportunities</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {competitorData.white_space.map((ws: any, i: number) => (
                      <div key={i} style={{ padding: '14px 16px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>{ws.opportunity}</div>
                        <div style={{ fontSize: 12, color: 'var(--t5)', marginBottom: 6 }}>Why nobody owns it: {ws.why_nobody_owns_it}</div>
                        <div style={{ fontSize: 12, color: 'var(--cyan)' }}>→ {ws.how_to_claim_it}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Winning angles */}
              {competitorData.winning_angles?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', marginBottom: 10 }}>🎯 Winning Angles Competitors Ignore</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {competitorData.winning_angles.map((angle: any, i: number) => (
                      <div key={i} style={{ padding: '14px 16px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>{angle.angle}</div>
                        <div style={{ fontSize: 12, color: 'var(--cyan)', fontStyle: 'italic', marginBottom: 6 }}>"{angle.example_hook}"</div>
                        <div style={{ fontSize: 11, color: 'var(--t5)' }}>{angle.why_it_wins}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Competitors breakdown */}
              {competitorData.competitors?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', marginBottom: 10 }}>Competitor Breakdown</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                    {competitorData.competitors.map((comp: any, i: number) => (
                      <div key={i} style={{ padding: '14px 16px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 10 }}>{comp.name}</div>
                        {comp.strengths?.length > 0 && (
                          <div style={{ marginBottom: 8 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#00d68f', textTransform: 'uppercase', marginBottom: 4 }}>Strengths</div>
                            {comp.strengths.slice(0, 2).map((s: string, j: number) => <div key={j} style={{ fontSize: 11, color: 'var(--t4)', marginBottom: 2 }}>+ {s}</div>)}
                          </div>
                        )}
                        {comp.weaknesses?.length > 0 && (
                          <div style={{ marginBottom: 8 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', marginBottom: 4 }}>Weaknesses</div>
                            {comp.weaknesses.slice(0, 2).map((w: string, j: number) => <div key={j} style={{ fontSize: 11, color: 'var(--t4)', marginBottom: 2 }}>− {w}</div>)}
                          </div>
                        )}
                        {comp.differentiation_opportunity && (
                          <div style={{ padding: '8px 10px', background: 'rgba(0,170,255,0.05)', border: '1px solid var(--cline2)', borderRadius: 7, fontSize: 11, color: 'var(--cyan)', lineHeight: 1.5 }}>
                            Your edge: {comp.differentiation_opportunity}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick wins */}
              {competitorData.quick_wins?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', marginBottom: 10 }}>⚡ Quick Wins This Week</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {competitorData.quick_wins.map((win: any, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 10 }}>
                        <div style={{ fontSize: 16, flexShrink: 0 }}>→</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginBottom: 3 }}>{win.action}</div>
                          <div style={{ fontSize: 11, color: 'var(--t4)' }}>{win.impact} · {win.time_to_implement}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={generateCompetitorAnalysis} disabled={generatingCompetitors}
                style={{ alignSelf: 'flex-start', padding: '8px 16px', fontSize: 12, fontWeight: 600, background: 'var(--glass)', color: 'var(--t3)', border: '1px solid var(--line2)', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                ↺ Re-analyze
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
