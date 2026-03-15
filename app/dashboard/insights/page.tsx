'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  linkedin:  '#0A66C2',
  x:         '#1DA1F2',
  tiktok:    '#FF0050',
  email:     '#00AAFF',
  general:   '#888888',
}

type TabId = 'overview' | 'content' | 'email' | 'platforms' | 'export'

export default function InsightsPage() {
  const supabase = createClient()
  const [workspace, setWorkspace] = useState<any>(null)
  const [insights, setInsights] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(30)
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [aiExplanation, setAiExplanation] = useState<string | null>(null)
  const [explaining, setExplaining] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<any>(null)
  const [connectedPlatforms, setConnectedPlatforms] = useState<any[]>([])
  const [exporting, setExporting] = useState(false)

  useEffect(() => { loadInsights() }, [period])

  async function loadInsights() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: m } = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id', user.id).limit(1).single()
    const ws = (m as any)?.workspaces
    setWorkspace(ws)

    const [insightsRes, platformsRes] = await Promise.all([
      fetch(`/api/get-insights?workspace_id=${ws?.id}&period=${period}`),
      supabase.from('connected_platforms').select('*').eq('workspace_id', ws?.id).eq('is_active', true),
    ])

    if (insightsRes.ok) {
      const data = await insightsRes.json()
      setInsights(data)
    }
    setConnectedPlatforms(platformsRes.data ?? [])
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
          message: `Analyze my content performance for the last ${period} days and give me 3 specific, actionable insights. Data: ${JSON.stringify(insights.overview)}. Platform breakdown: ${JSON.stringify(insights.platform_breakdown)}. Content types: ${JSON.stringify(insights.content_type_breakdown)}. Email: ${JSON.stringify(insights.email_stats)}. Be direct and tactical — what should I do differently next week?`,
          history: [],
        }),
      })
      const data = await res.json()
      setAiExplanation(data.reply)
    } catch { setAiExplanation('Unable to generate AI analysis right now.') }
    setExplaining(false)
  }

  async function syncPlatformData() {
    if (!workspace || syncing) return
    setSyncing(true)
    try {
      const res = await fetch('/api/sync-platform-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspace.id }),
      })
      const data = await res.json()
      setSyncResult(data)
      await loadInsights()
    } catch {}
    setSyncing(false)
  }

  async function exportData(format_type: 'csv' | 'json') {
    if (!insights) return
    setExporting(true)

    const exportData = {
      workspace: workspace?.name,
      period: `Last ${period} days`,
      generated_at: new Date().toISOString(),
      overview: insights.overview,
      platform_breakdown: insights.platform_breakdown,
      content_type_breakdown: insights.content_type_breakdown,
      email_stats: insights.email_stats,
      top_content: insights.top_content?.map((c: any) => ({
        type: c.type,
        platform: c.platform,
        status: c.status,
        body_preview: c.body?.slice(0, 100),
        likes: c.likes,
        comments: c.comments,
        shares: c.shares,
        reach: c.reach,
        created_at: c.created_at,
      })),
    }

    if (format_type === 'json') {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nexa-insights-${workspace?.name}-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      // CSV export
      const rows = [
        ['Metric', 'Value'],
        ['Total content', insights.overview.total_content],
        ['Published', insights.overview.published],
        ['Scheduled', insights.overview.scheduled],
        ['Total reach', insights.overview.total_reach],
        ['Total engagements', insights.overview.total_engagements],
        ['Credits used', insights.overview.credits_used],
        ['', ''],
        ['Platform', 'Posts', 'Reach', 'Engagements'],
        ...Object.entries(insights.platform_breakdown || {}).map(([p, d]: [string, any]) => [p, d.count, d.reach, d.engagements]),
        ['', ''],
        ['Email Sequences', insights.email_stats.total_sequences],
        ['Emails sent', insights.email_stats.total_sent],
        ['Avg open rate', `${insights.email_stats.avg_open_rate}%`],
      ]
      const csv = rows.map(r => r.join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nexa-insights-${workspace?.name}-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
    setExporting(false)
  }

  const TABS: { id: TabId; label: string }[] = [
    { id: 'overview',   label: 'Overview' },
    { id: 'content',    label: 'Content' },
    { id: 'email',      label: 'Email' },
    { id: 'platforms',  label: 'Platforms' },
    { id: 'export',     label: '↓ Export' },
  ]

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--t4)', fontSize: 13 }}>
      Loading insights...
    </div>
  )

  const ov = insights?.overview ?? {}
  const chartData = insights?.chart_data ?? []
  const maxChart = Math.max(...chartData.map((d: any) => d.content), 1)

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1000, overflowY: 'auto', height: 'calc(100vh - var(--topbar-h))' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 3 }}>Insights</h1>
          <div style={{ fontSize: 12, color: 'var(--t4)' }}>Performance analytics for your brand</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Period selector */}
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setPeriod(d)}
              style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, background: period === d ? 'rgba(0,170,255,0.08)' : 'var(--glass)', border: `1px solid ${period === d ? 'var(--cline2)' : 'var(--line2)'}`, color: period === d ? 'var(--cyan)' : 'var(--t4)', borderRadius: 7, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
              {d}d
            </button>
          ))}
          <button onClick={syncPlatformData} disabled={syncing}
            style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, background: 'var(--glass)', border: '1px solid var(--line2)', color: 'var(--t3)', borderRadius: 7, cursor: 'pointer', fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', gap: 5 }}>
            {syncing ? <>Syncing...</> : <>↺ Sync</>}
          </button>
        </div>
      </div>

      {/* Sync result banner */}
      {syncResult && (
        <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(0,170,255,0.04)', border: '1px solid var(--cline2)', borderRadius: 10, fontSize: 12, color: 'var(--t3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{syncResult.message}</span>
          <button onClick={() => setSyncResult(null)} style={{ background: 'none', border: 'none', color: 'var(--t5)', cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', marginBottom: 24, gap: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: activeTab === t.id ? 700 : 500, color: activeTab === t.id ? 'var(--t1)' : 'var(--t4)', borderBottom: activeTab === t.id ? '2px solid var(--cyan)' : '2px solid transparent', fontFamily: 'var(--sans)', transition: 'all .15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: 'Content created', value: ov.total_content ?? 0, color: 'var(--cyan)', sub: `${period}d period` },
              { label: 'Published', value: ov.published ?? 0, color: '#00d68f', sub: 'live on platforms' },
              { label: 'Total reach', value: (ov.total_reach ?? 0).toLocaleString(), color: 'var(--t1)', sub: 'across all platforms' },
              { label: 'Engagements', value: (ov.total_engagements ?? 0).toLocaleString(), color: '#8b5cf6', sub: 'likes + comments + shares' },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12, padding: '16px' }}>
                <div style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)', marginTop: 5 }}>{stat.label}</div>
                <div style={{ fontSize: 10, color: 'var(--t5)', marginTop: 2 }}>{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Activity chart */}
          <div style={{ background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', marginBottom: 16 }}>Content created · last {period} days</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
              {chartData.filter((_: any, i: number) => period <= 30 || i % 3 === 0).map((d: any, i: number) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div style={{ width: '100%', background: d.content > 0 ? 'var(--cyan)' : 'rgba(255,255,255,0.04)', borderRadius: '3px 3px 0 0', height: `${Math.max((d.content / maxChart) * 70, d.content > 0 ? 4 : 2)}px`, transition: 'height 0.3s', opacity: d.content > 0 ? 0.8 : 0.3 }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 10, color: 'var(--t5)' }}>{chartData[0]?.label}</span>
              <span style={{ fontSize: 10, color: 'var(--t5)' }}>{chartData[chartData.length - 1]?.label}</span>
            </div>
          </div>

          {/* AI explanation */}
          <div style={{ background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: aiExplanation ? 12 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--cyan)', animation: 'pulse-dot 2s ease-in-out infinite' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Nexa AI Analysis</span>
              </div>
              <button onClick={getAiExplanation} disabled={explaining}
                style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, background: explaining ? 'var(--glass)' : 'var(--cyan)', color: explaining ? 'var(--t4)' : '#000', border: 'none', borderRadius: 7, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                {explaining ? 'Analyzing...' : aiExplanation ? '↺ Re-analyze' : 'Analyze my data →'}
              </button>
            </div>
            {aiExplanation && (
              <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{aiExplanation}</div>
            )}
            {!aiExplanation && !explaining && (
              <div style={{ fontSize: 12, color: 'var(--t5)', marginTop: 8 }}>Get AI-powered insights and specific recommendations based on your performance data.</div>
            )}
          </div>
        </div>
      )}

      {/* ── CONTENT ── */}
      {activeTab === 'content' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Content type breakdown */}
          <div style={{ background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', marginBottom: 14 }}>Content by type</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.entries(insights?.content_type_breakdown || {}).map(([type, count]: [string, any]) => (
                <div key={type} style={{ padding: '10px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--line)', borderRadius: 10 }}>
                  <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, color: 'var(--cyan)', lineHeight: 1 }}>{count}</div>
                  <div style={{ fontSize: 11, color: 'var(--t4)', marginTop: 4, textTransform: 'capitalize' }}>{type}</div>
                </div>
              ))}
              {Object.keys(insights?.content_type_breakdown || {}).length === 0 && (
                <div style={{ fontSize: 13, color: 'var(--t5)' }}>No content created in this period yet.</div>
              )}
            </div>
          </div>

          {/* Top performing content */}
          <div style={{ background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)' }}>Top performing content</div>
              <div style={{ fontSize: 11, color: 'var(--t5)' }}>Sorted by engagements</div>
            </div>
            {insights?.top_content?.length > 0 ? insights.top_content.map((c: any, i: number) => (
              <div key={c.id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: i < insights.top_content.length - 1 ? '1px solid var(--line)' : 'none' }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(0,170,255,0.08)', border: '1px solid var(--cline2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--cyan)', flexShrink: 0 }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: 'var(--glass2)', border: '1px solid var(--line)', color: 'var(--t4)', textTransform: 'uppercase' }}>{c.type}</span>
                    <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 3, background: `${PLATFORM_COLORS[c.platform] || '#888'}15`, color: PLATFORM_COLORS[c.platform] || 'var(--t4)', textTransform: 'uppercase' }}>{c.platform}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.body?.slice(0, 80) || c.title || 'Untitled'}</div>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--t4)', flexShrink: 0 }}>
                  <span>❤️ {c.likes ?? 0}</span>
                  <span>💬 {c.comments ?? 0}</span>
                  <span>↗️ {c.shares ?? 0}</span>
                </div>
              </div>
            )) : (
              <div style={{ fontSize: 13, color: 'var(--t5)', textAlign: 'center', padding: '20px 0' }}>
                No published content yet. Publish posts to see performance data here.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── EMAIL ── */}
      {activeTab === 'email' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { label: 'Active sequences', value: insights?.email_stats?.active_sequences ?? 0, color: 'var(--cyan)' },
              { label: 'Emails sent', value: (insights?.email_stats?.total_sent ?? 0).toLocaleString(), color: 'var(--t1)' },
              { label: 'Avg open rate', value: `${insights?.email_stats?.avg_open_rate ?? 0}%`, color: insights?.email_stats?.avg_open_rate > 30 ? '#00d68f' : 'var(--amber)' },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12, padding: '16px' }}>
                <div style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)', marginTop: 5 }}>{stat.label}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '16px 18px', background: 'rgba(0,170,255,0.04)', border: '1px solid var(--cline2)', borderRadius: 12, fontSize: 13, color: 'var(--t3)', lineHeight: 1.7 }}>
            Industry average open rate is 20-25%. {insights?.email_stats?.avg_open_rate > 25 ? `Your ${insights.email_stats.avg_open_rate}% is above average — your subject lines and audience targeting are working.` : 'Build your email sequences in the Automate tab to start growing this number.'}
          </div>
          <a href="/dashboard/automate" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', fontSize: 12, fontWeight: 700, background: 'var(--cyan)', color: '#000', border: 'none', borderRadius: 9, textDecoration: 'none', width: 'fit-content' }}>
            Manage email sequences →
          </a>
        </div>
      )}

      {/* ── PLATFORMS ── */}
      {activeTab === 'platforms' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Connected platforms */}
          <div style={{ background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)' }}>Connected platforms</div>
              <a href="/dashboard/schedule" style={{ fontSize: 11, color: 'var(--cyan)', textDecoration: 'none' }}>Manage →</a>
            </div>
            {connectedPlatforms.length > 0 ? connectedPlatforms.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${PLATFORM_COLORS[p.platform] || '#888'}20`, border: `1px solid ${PLATFORM_COLORS[p.platform] || '#888'}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: PLATFORM_COLORS[p.platform] || 'var(--t3)', textTransform: 'capitalize', flexShrink: 0 }}>
                  {p.platform.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', textTransform: 'capitalize' }}>{p.platform}</div>
                  <div style={{ fontSize: 11, color: 'var(--t5)' }}>@{p.platform_username || 'connected'} · Connected {p.connected_at ? format(new Date(p.connected_at), 'MMM d') : ''}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d68f' }} />
                  <span style={{ fontSize: 11, color: '#00d68f', fontWeight: 600 }}>Active</span>
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 13, color: 'var(--t5)' }}>
                No platforms connected. <a href="/dashboard/schedule" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>Connect platforms →</a>
              </div>
            )}
          </div>

          {/* Platform performance breakdown */}
          {Object.keys(insights?.platform_breakdown || {}).length > 0 && (
            <div style={{ background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', marginBottom: 14 }}>Performance by platform</div>
              {Object.entries(insights.platform_breakdown).map(([platform, data]: [string, any]) => (
                <div key={platform} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: `${PLATFORM_COLORS[platform] || '#888'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: PLATFORM_COLORS[platform] || 'var(--t3)', flexShrink: 0 }}>{platform.slice(0, 2).toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)', marginBottom: 4, textTransform: 'capitalize' }}>{platform}</div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min((data.count / Math.max(...Object.values(insights.platform_breakdown).map((d: any) => d.count), 1)) * 100, 100)}%`, background: PLATFORM_COLORS[platform] || 'var(--cyan)', borderRadius: 4 }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--t4)', textAlign: 'right', flexShrink: 0 }}>
                    <div>{data.count} posts</div>
                    <div style={{ color: 'var(--t5)' }}>{data.engagements} engagements</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Live data status */}
          <div style={{ padding: '16px 18px', background: 'rgba(212,82,26,0.04)', border: '1px solid rgba(212,82,26,0.2)', borderRadius: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--orange)', marginBottom: 6 }}>Live platform data</div>
            <div style={{ fontSize: 12, color: 'var(--t4)', lineHeight: 1.7, marginBottom: 10 }}>
              Real-time reach, impressions, and engagement data from Instagram, LinkedIn, and X will flow automatically here once the platform apps are approved. The infrastructure is built and ready — it activates the moment approvals come through.
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Instagram', 'LinkedIn', 'X', 'TikTok'].map(p => (
                <span key={p} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: connectedPlatforms.find(c => c.platform === p.toLowerCase()) ? 'rgba(0,214,143,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${connectedPlatforms.find(c => c.platform === p.toLowerCase()) ? 'rgba(0,214,143,0.3)' : 'var(--line)'}`, color: connectedPlatforms.find(c => c.platform === p.toLowerCase()) ? '#00d68f' : 'var(--t5)' }}>
                  {p} {connectedPlatforms.find(c => c.platform === p.toLowerCase()) ? '✓ Connected' : '○ Not connected'}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── EXPORT ── */}
      {activeTab === 'export' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ padding: '16px 18px', background: 'rgba(0,170,255,0.04)', border: '1px solid var(--cline2)', borderRadius: 12, fontSize: 13, color: 'var(--t3)', lineHeight: 1.7 }}>
            Export your Nexa performance data for reporting, analysis, or sharing with clients. Choose your format and period below.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { format: 'csv' as const, label: 'CSV Export', desc: 'Open in Excel, Google Sheets, or any spreadsheet tool. Includes all metrics, platform breakdown, and email stats.', icon: '📊' },
              { format: 'json' as const, label: 'JSON Export', desc: 'Full structured data export. Use for custom dashboards, API integrations, or developer tools.', icon: '{ }' },
            ].map(opt => (
              <div key={opt.format} style={{ padding: '20px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 14 }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{opt.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>{opt.label}</div>
                <div style={{ fontSize: 12, color: 'var(--t4)', lineHeight: 1.6, marginBottom: 16 }}>{opt.desc}</div>
                <button onClick={() => exportData(opt.format)} disabled={exporting}
                  style={{ width: '100%', padding: '10px', fontSize: 13, fontWeight: 700, background: 'var(--cyan)', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                  Download {opt.format.toUpperCase()} →
                </button>
              </div>
            ))}
          </div>

          {/* What's included */}
          <div style={{ background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', marginBottom: 12 }}>What's included in the export</div>
            {[
              'Overview metrics (content created, published, reach, engagements)',
              'Platform breakdown (posts, reach, engagements per platform)',
              'Content type breakdown (posts, images, videos, threads)',
              'Email sequence stats (sent, opened, open rate)',
              'Top performing content with engagement metrics',
              'Period: last ' + period + ' days',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 12, color: 'var(--t3)' }}>
                <span style={{ color: '#00d68f' }}>✓</span> {item}
              </div>
            ))}
            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--t5)' }}>
              Live platform data (Instagram/LinkedIn reach + impressions) will be included once platform apps are approved.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
