'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO } from 'date-fns'

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  linkedin:  '#0A66C2',
  x:         '#1DA1F2',
  tiktok:    '#000000',
  email:     '#00AAFF',
  general:   '#888888',
}

const IconBar = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
const IconRefresh = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
const IconStar = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
const IconUp = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
const IconMail = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>

export default function InsightsPage() {
  const supabase = createClient()
  const [workspace, setWorkspace] = useState<any>(null)
  const [insights, setInsights] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(30)
  const [aiExplanation, setAiExplanation] = useState<string | null>(null)
  const [explaining, setExplaining] = useState(false)

  useEffect(() => { loadInsights() }, [period])

  async function loadInsights() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: m } = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id', user.id).limit(1).single()
    const ws = (m as any)?.workspaces
    setWorkspace(ws)

    const res = await fetch(`/api/get-insights?workspace_id=${ws?.id}&period=${period}`)
    if (res.ok) {
      const data = await res.json()
      setInsights(data)
    }
    setLoading(false)
  }

  async function getAiExplanation() {
    if (!insights || explaining) return
    setExplaining(true)
    setAiExplanation(null)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspace.id,
          message: `Analyze my content performance data for the last ${period} days and give me 3 specific, actionable insights:

Data:
- Total content created: ${insights.overview.total_content}
- Published: ${insights.overview.published}
- Total reach: ${insights.overview.total_reach}
- Total engagements: ${insights.overview.total_engagements}
- Credits used: ${insights.overview.credits_used}
- Platform breakdown: ${JSON.stringify(insights.platform_breakdown)}
- Email open rate: ${insights.email_stats.avg_open_rate}%
- Active email sequences: ${insights.email_stats.active_sequences}

Give me 3 specific insights about what's working, what's not, and exactly what to do next. Be direct and data-driven.`,
          history: [],
        }),
      })
      const data = await res.json()
      setAiExplanation(data.reply)
    } catch (err) { console.error(err) }
    setExplaining(false)
  }

  // Simple bar chart component
  function MiniBarChart({ data, maxVal }: { data: number[]; maxVal: number }) {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 48 }}>
        {data.map((v, i) => (
          <div key={i} style={{
            flex: 1,
            height: maxVal > 0 ? `${Math.max(4, (v / maxVal) * 100)}%` : '4px',
            background: v > 0 ? 'var(--cyan)' : 'var(--glass)',
            borderRadius: '2px 2px 0 0',
            opacity: v > 0 ? (0.4 + (v / maxVal) * 0.6) : 0.2,
            transition: 'height 0.3s ease',
          }} />
        ))}
      </div>
    )
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div style={{ fontSize: 13, color: 'var(--t4)' }}>Loading insights...</div>
    </div>
  )

  const ov = insights?.overview ?? {}
  const chart = insights?.chart_data ?? []
  const chartMax = Math.max(...chart.map((d: any) => d.content), 1)
  const platforms = insights?.platform_breakdown ?? {}
  const emailStats = insights?.email_stats ?? {}
  const topContent = insights?.top_content ?? []
  const activity = insights?.recent_activity ?? []

  return (
    <div style={{ padding: '28px', maxWidth: 1000 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 3 }}>Insights</h1>
          <p style={{ fontSize: 12, color: 'var(--t4)' }}>Your content performance across all platforms</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Period selector */}
          <div style={{ display: 'flex', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 9, padding: 3, gap: 2 }}>
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setPeriod(d)} style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: period === d ? 'var(--glass2)' : 'transparent', color: period === d ? 'var(--t1)' : 'var(--t4)', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--sans)' }}>
                {d}d
              </button>
            ))}
          </div>
          <button onClick={loadInsights} style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--glass)', border: '1px solid var(--line2)', color: 'var(--t4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconRefresh />
          </button>
        </div>
      </div>

      {/* Overview stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Content created', value: ov.total_content ?? 0,     icon: <IconStar />,  color: 'var(--t1)' },
          { label: 'Published',       value: ov.published ?? 0,          icon: <IconUp />,    color: '#00d68f' },
          { label: 'Total reach',     value: ov.total_reach > 0 ? `${(ov.total_reach/1000).toFixed(1)}k` : '0', icon: <IconBar />, color: 'var(--cyan)' },
          { label: 'Engagements',     value: ov.total_engagements ?? 0,  icon: <IconStar />,  color: 'var(--t1)' },
        ].map(stat => (
          <div key={stat.label} style={{ padding: '16px 14px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ color: 'var(--t4)' }}>{stat.icon}</div>
            </div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: 'var(--t4)', marginTop: 5 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Chart + AI explanation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 10, marginBottom: 16 }}>

        {/* Content activity chart */}
        <div style={{ padding: '18px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)' }}>Content activity · Last {period} days</div>
            <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--t5)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--cyan)', display: 'inline-block' }} /> Created</span>
            </div>
          </div>
          <MiniBarChart data={chart.map((d: any) => d.content)} maxVal={chartMax} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            {chart.filter((_: any, i: number) => i % Math.ceil(chart.length / 6) === 0).map((d: any) => (
              <span key={d.date} style={{ fontSize: 9, color: 'var(--t5)' }}>{d.label}</span>
            ))}
          </div>
        </div>

        {/* Email stats */}
        <div style={{ padding: '18px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconMail /> Email performance
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Active sequences', value: emailStats.active_sequences ?? 0, color: 'var(--cyan)' },
              { label: 'Total sent',       value: emailStats.total_sent ?? 0,        color: 'var(--t1)' },
              { label: 'Avg open rate',    value: `${emailStats.avg_open_rate ?? 0}%`, color: emailStats.avg_open_rate > 40 ? '#00d68f' : emailStats.avg_open_rate > 20 ? 'var(--amber)' : 'var(--t1)' },
            ].map(stat => (
              <div key={stat.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--t4)' }}>{stat.label}</span>
                <span style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 800, letterSpacing: '-0.03em', color: stat.color }}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform breakdown + AI insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>

        {/* Platform breakdown */}
        <div style={{ padding: '18px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', marginBottom: 14 }}>Platform breakdown</div>
          {Object.keys(platforms).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(platforms).map(([platform, data]: [string, any]) => (
                <div key={platform} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: PLATFORM_COLORS[platform] ?? '#888', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--t3)', flex: 1, textTransform: 'capitalize' }}>{platform}</span>
                  <span style={{ fontSize: 11, color: 'var(--t4)', marginRight: 8 }}>{data.count} posts</span>
                  <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, (data.count / ov.total_content) * 100)}%`, background: PLATFORM_COLORS[platform] ?? '#888', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 12, color: 'var(--t5)' }}>
              No published content yet. Start creating in Studio.
            </div>
          )}
        </div>

        {/* Credits used */}
        <div style={{ padding: '18px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', marginBottom: 14 }}>Credits used · {period} days</div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 48, fontWeight: 800, letterSpacing: '-0.05em', color: 'var(--t1)', lineHeight: 1, marginBottom: 6 }}>
            {ov.credits_used ?? 0}
          </div>
          <div style={{ fontSize: 12, color: 'var(--t4)', marginBottom: 16 }}>credits consumed this period</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(insights?.content_type_breakdown ?? {}).map(([type, count]: [string, any]) => (
              <div key={type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--t4)', textTransform: 'capitalize' }}>{type}</span>
                <span style={{ color: 'var(--t2)', fontWeight: 600 }}>{count} pieces</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Signal Explanation */}
      <div style={{ marginBottom: 16, padding: '18px', background: 'rgba(0,170,255,0.04)', border: '1px solid var(--cline2)', borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: aiExplanation ? 14 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(0,170,255,0.1)', border: '1px solid var(--cline2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--cyan)' }}>✦</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Nexa AI reads your signals</span>
          </div>
          <button onClick={getAiExplanation} disabled={explaining} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: 12, fontWeight: 700, background: 'var(--cyan)', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
            {explaining ? (
              <><div style={{ width: 11, height: 11, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Analyzing...</>
            ) : '✦ Explain my data'}
          </button>
        </div>

        {aiExplanation && (
          <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.75, whiteSpace: 'pre-line' as const }}>
            {aiExplanation}
          </div>
        )}

        {!aiExplanation && !explaining && (
          <div style={{ fontSize: 12, color: 'var(--t4)', marginTop: 8 }}>
            Ask Nexa AI to analyze your data and tell you exactly what to do next. Free — uses your chat.
          </div>
        )}
      </div>

      {/* Recent activity */}
      {activity.length > 0 && (
        <div style={{ padding: '18px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', marginBottom: 14 }}>Recent activity</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activity.map((item: any) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--t2)', flex: 1 }}>{item.title}</span>
                <span style={{ fontSize: 10, color: 'var(--t5)', flexShrink: 0 }}>{item.created_at ? format(parseISO(item.created_at), 'MMM d, h:mm a') : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
