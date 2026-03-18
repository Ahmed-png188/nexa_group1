'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Tab = 'overview'|'content'|'email'|'platforms'

/* ─────────────────────────────────────────────────
   PLATFORM COLORS
───────────────────────────────────────────────── */
const PC: Record<string,string> = {
  instagram:'#E1306C', linkedin:'#0A66C2', x:'#E7E7E7',
  tiktok:'#FF0050',    email:'#4D9FFF',    general:'#888',
}

/* ─────────────────────────────────────────────────
   ICONS
───────────────────────────────────────────────── */
const Ic = {
  eye:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  heart:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  users:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  click:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l16 5-7 2-2 7z"/></svg>,
  chart:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18"/><path d="M5 20V14l4-4 4 3 4-6 4 4v9"/></svg>,
  mail:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  bolt:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  refresh: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  up:      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>,
  down:    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>,
  star:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
}

const TABS = [
  { id:'overview'  as Tab, label:'Overview',  color:'#4D9FFF' },
  { id:'content'   as Tab, label:'Content',   color:'#A78BFA' },
  { id:'email'     as Tab, label:'Email',      color:'#34D399' },
  { id:'platforms' as Tab, label:'Platforms',  color:'#FF7A40' },
]

/* ─────────────────────────────────────────────────
   CHART PRIMITIVES — pure SVG, no deps
───────────────────────────────────────────────── */

// Sparkline — small inline trend line
function Sparkline({ data, color, width=80, height=28 }: { data:number[]; color:string; width?:number; height?:number }) {
  if (data.length < 2) return <div style={{ width, height }}/>
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const pts = data.map((v,i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return `${x},${y}`
  })
  const path = `M ${pts.join(' L ')}`
  const areaPath = `M ${pts[0]} L ${pts.join(' L ')} L ${width},${height} L 0,${height} Z`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow:'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#sg-${color.replace('#','')})`}/>
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Last point dot */}
      <circle cx={width} cy={height - ((data[data.length-1] - min) / range) * height} r="2.5" fill={color}/>
    </svg>
  )
}

// Area chart — full width, for main overview
function AreaChart({ data, color, height=120, label='' }: { data:{date:string;value:number}[]; color:string; height?:number; label?:string }) {
  const sorted = [...data].sort((a,b) => a.date.localeCompare(b.date)).slice(-30)
  if (sorted.length < 2) return (
    <div style={{ height, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.15)', fontSize:12 }}>
      Not enough data to plot
    </div>
  )
  const W = 600; const H = height
  const max = Math.max(...sorted.map(d=>d.value))
  const min = 0
  const range = max - min || 1
  const pts = sorted.map((d,i) => {
    const x = (i / (sorted.length - 1)) * W
    const y = H - ((d.value - min) / range) * (H * 0.85)
    return { x, y, ...d }
  })
  const linePath = `M ${pts.map(p=>`${p.x},${p.y}`).join(' L ')}`
  const areaPath = `M 0,${H} L ${pts.map(p=>`${p.x},${p.y}`).join(' L ')} L ${W},${H} Z`
  return (
    <div style={{ position:'relative' }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display:'block', overflow:'visible' }}>
        <defs>
          <linearGradient id={`ag-${label}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0.25,0.5,0.75,1].map(r => (
          <line key={r} x1="0" y1={H*(1-r*0.85)} x2={W} y2={H*(1-r*0.85)} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
        ))}
        {/* Area fill */}
        <path d={areaPath} fill={`url(#ag-${label})`}/>
        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {/* Dots on hover regions (every 5th) */}
        {pts.filter((_,i)=>i%Math.ceil(pts.length/6)===0||i===pts.length-1).map((p,i)=>(
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} opacity="0.7"/>
        ))}
      </svg>
      {/* X axis labels */}
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
        {[sorted[0], sorted[Math.floor(sorted.length/2)], sorted[sorted.length-1]].map((d,i)=>(
          <span key={i} style={{ fontSize:9, color:'rgba(255,255,255,0.25)', fontWeight:500 }}>
            {d.date.slice(5)}
          </span>
        ))}
      </div>
    </div>
  )
}

// Bar chart — horizontal bars for platform breakdown
function HBar({ value, max, color, label, sub }: { value:number; max:number; color:string; label:string; sub:string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:color, boxShadow:`0 0 5px ${color}` }}/>
          <span style={{ fontSize:12, color:'rgba(255,255,255,0.72)', fontWeight:600, letterSpacing:'-0.01em' }}>{label}</span>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.88)', fontFamily:'var(--display)', letterSpacing:'-0.02em' }}>{sub}</div>
        </div>
      </div>
      <div style={{ height:6, background:'rgba(255,255,255,0.06)', borderRadius:100, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg, ${color}cc, ${color})`, borderRadius:100, transition:'width 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}/>
      </div>
    </div>
  )
}

// Donut ring — for engagement rate
function Donut({ pct, color, size=88 }: { pct:number; color:string; size?:number }) {
  const r = size/2 - 8
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ/4}
        strokeLinecap="round"
        style={{ transition:'stroke-dasharray 1.3s cubic-bezier(0.34,1.56,0.64,1)', filter:`drop-shadow(0 0 6px ${color}80)` }}/>
    </svg>
  )
}

/* ─────────────────────────────────────────────────
   STAT HERO CARD — large number + sparkline + trend
───────────────────────────────────────────────── */
function HeroStat({ icon, label, value, rawData, color, trend }: any) {
  const isPos = trend > 0; const isNeg = trend < 0
  return (
    <div className="nexa-card" style={{ padding:'18px 20px', position:'relative', overflow:'hidden' }}>
      {/* Subtle color wash */}
      <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:`${color}18`, filter:'blur(20px)', pointerEvents:'none' }}/>
      <div style={{ position:'relative' }}>
        {/* Top row */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:`${color}14`, border:`1px solid ${color}25`, display:'flex', alignItems:'center', justifyContent:'center', color, flexShrink:0 }}>
              {icon}
            </div>
            <span className="nexa-label">{label}</span>
          </div>
          {trend !== undefined && (
            <div style={{ display:'flex', alignItems:'center', gap:3, padding:'3px 8px', borderRadius:100, background:isPos?'rgba(52,211,153,0.1)':isNeg?'rgba(255,87,87,0.1)':'rgba(255,255,255,0.05)', border:`1px solid ${isPos?'rgba(52,211,153,0.2)':isNeg?'rgba(255,87,87,0.2)':'rgba(255,255,255,0.08)'}` }}>
              <span style={{ display:'flex', color:isPos?'#34D399':isNeg?'#FF5757':'rgba(255,255,255,0.3)' }}>{isPos?Ic.up:isNeg?Ic.down:null}</span>
              <span style={{ fontSize:11, fontWeight:700, color:isPos?'#34D399':isNeg?'#FF5757':'rgba(255,255,255,0.35)' }}>
                {Math.abs(trend)}%
              </span>
            </div>
          )}
        </div>
        {/* Big number */}
        <div className="nexa-num" style={{ fontSize:32, lineHeight:1, marginBottom:10 }}>
          {value}
        </div>
        {/* Sparkline */}
        {rawData && rawData.length > 1 && (
          <Sparkline data={rawData} color={color} width={100} height={32}/>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────
   MAIN
───────────────────────────────────────────────── */
export default function InsightsPage() {
  const supabase = createClient()
  const router = useRouter()

  const [ws,        setWs]       = useState<any>(null)
  const [raw,       setRaw]      = useState<any[]>([])
  const [insights,  setInsights] = useState<any>(null)
  const [loading,   setLoading]  = useState(true)
  const [period,    setPeriod]   = useState(30)
  const [tab,       setTab]      = useState<Tab>('overview')
  const [aiText,    setAiText]   = useState<string|null>(null)
  const [explaining,setExplaining]= useState(false)
  const [syncing,   setSyncing]  = useState(false)
  const [showSyncBanner, setShowSyncBanner] = useState(false)
  const [connPlats, setConnPlats]= useState<any[]>([])
  const [mounted,   setMounted]  = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { load() }, [period])
  // Safety timeout — force-dismiss loader after 4 s if fetch stalls
  useEffect(() => { const t = setTimeout(() => setLoading(false), 4000); return () => clearTimeout(t) }, [])

  async function load() {
    try {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data:m } = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id',user.id).limit(1).single()
    const w = (m as any)?.workspaces; setWs(w)
    const now     = new Date()
    const cutoff  = new Date(now.getTime() - period * 86400000).toISOString()
    const prevCut = new Date(now.getTime() - period * 2 * 86400000).toISOString()

    const [{ data:content },{ data:prevContent },{ data:plats },{ data:emailSeqs }] = await Promise.all([
      // Current period — published content with engagement data
      supabase.from('content').select('*').eq('workspace_id',w?.id).gte('created_at',cutoff).order('created_at',{ascending:true}),
      // Previous period — for trend calculation
      supabase.from('content').select('id,impressions,engagement,clicks,reach,likes,comments,shares,created_at').eq('workspace_id',w?.id).gte('created_at',prevCut).lt('created_at',cutoff),
      supabase.from('connected_platforms').select('*').eq('workspace_id',w?.id).eq('is_active',true),
      supabase.from('email_sequences').select('*').eq('workspace_id',w?.id),
    ])

    setConnPlats(plats??[])

    const rows = content ?? []
    const prev = prevContent ?? []

    // Build daily series from content table
    // Group by date, aggregate engagement metrics across all platforms
    const byDate: Record<string, any> = {}
    for (const c of rows) {
      const date = c.created_at?.split('T')[0]
      if (!date) continue
      if (!byDate[date]) byDate[date] = {
        date, impressions:0, reach:0, engagement:0, clicks:0,
        posts_created:0, followers_gained:0,
        email_opens:0, email_clicks:0, email_sent:0,
        platform: c.platform, // keep for display
      }
      byDate[date].posts_created++
      byDate[date].impressions   += c.impressions||0
      byDate[date].reach         += c.reach||0
      byDate[date].engagement    += (c.likes||0) + (c.comments||0) + (c.shares||0)
      byDate[date].clicks        += c.clicks||0
      byDate[date].followers_gained += c.followers_gained||0
    }
    const rawRows = Object.values(byDate).sort((a:any,b:any) => a.date.localeCompare(b.date))
    setRaw(rawRows)

    // Build per-platform aggregates for the platform breakdown (store on raw too)
    // Used by platBreakdown below

    // Aggregate totals for current period
    const agg = {
      impressions:      rows.reduce((s,r) => s+(r.impressions||0), 0),
      reach:            rows.reduce((s,r) => s+(r.reach||0), 0),
      engagement:       rows.reduce((s,r) => s+(r.likes||0)+(r.comments||0)+(r.shares||0), 0),
      clicks:           rows.reduce((s,r) => s+(r.clicks||0), 0),
      posts_created:    rows.length,
      followers_gained: rows.reduce((s,r) => s+(r.followers_gained||0), 0),
      email_sent:       emailSeqs?.reduce((s:number,e:any) => s+(e.emails_sent||0), 0) || 0,
      email_opens:      emailSeqs?.reduce((s:number,e:any) => s+(e.emails_opened||0), 0) || 0,
      email_clicks:     emailSeqs?.reduce((s:number,e:any) => s+(e.emails_clicked||0), 0) || 0,
    }

    // Compute real trends vs previous period
    const prevAgg = {
      impressions:   prev.reduce((s,r) => s+(r.impressions||0), 0),
      reach:         prev.reduce((s,r) => s+(r.reach||0), 0),
      engagement:    prev.reduce((s,r) => s+(r.likes||0)+(r.comments||0)+(r.shares||0), 0),
      clicks:        prev.reduce((s,r) => s+(r.clicks||0), 0),
      posts_created: prev.length,
    }
    const trend = (cur: number, prv: number) => prv > 0 ? Math.round(((cur - prv) / prv) * 100) : (cur > 0 ? 100 : 0)

    setInsights(rows.length > 0 ? {
      ...agg,
      rows,
      trends: {
        impressions:   trend(agg.impressions, prevAgg.impressions),
        reach:         trend(agg.reach, prevAgg.reach),
        engagement:    trend(agg.engagement, prevAgg.engagement),
        clicks:        trend(agg.clicks, prevAgg.clicks),
        posts_created: trend(agg.posts_created, prevAgg.posts_created),
      }
    } : null)
    } catch {}
    setLoading(false)
  }

  async function sync() {
    if (!ws||syncing) return
    if (connPlats.length === 0) { setShowSyncBanner(true); return }
    setSyncing(true)
    setShowSyncBanner(false)
    try { await fetch('/api/sync-platform-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspace_id:ws.id})}); load() } catch {}
    setSyncing(false)
  }

  async function explain() {
    if (!ws||explaining||!insights) return; setExplaining(true)
    try {
      // Use the AI chat endpoint to get an intelligent performance analysis
      const summary = `Posts created: ${insights.posts_created||0}, Impressions: ${insights.impressions||0}, Engagement: ${insights.engagement||0}, Reach: ${insights.reach||0}, Clicks: ${insights.clicks||0} over the last ${period} days.`
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: ws.id,
          message: `Analyze my content performance for the last ${period} days and give me 3 specific, actionable insights. Data: ${summary} What's working, what needs improvement, and what should I focus on next week? Be direct and specific to my brand.`,
          history: [],
        })
      })
      const d = await r.json()
      setAiText(d.reply || 'No insights available yet. Publish content and connect your platforms to start tracking.')
    } catch {}
    setExplaining(false)
  }

  function fmt(n:number) {
    if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n/1000).toFixed(1)}K`
    return String(n||0)
  }
  function pct(a:number,b:number) { return b>0 ? ((a/b)*100).toFixed(1)+'%' : '—' }

  // Build time-series from rows
  const series = (key:string) => (raw||[]).map(r=>({ date:r.date, value:r[key]||0 }))
  const sparkSeries = (key:string) => (raw||[]).map(r=>r[key]||0)

  // Platform breakdown
  const platBreakdown = connPlats.map(cp => {
    const platRows = raw.filter(r=>r.platform===cp.platform)
    return {
      platform: cp.platform,
      account: cp.platform_username||cp.account_name||cp.platform_name||'',
      impressions: platRows.reduce((a,r)=>a+(r.impressions||0),0),
      engagement: platRows.reduce((a,r)=>a+(r.engagement||0),0),
      followers: platRows.reduce((a,r)=>a+(r.followers_gained||0),0),
      clicks: platRows.reduce((a,r)=>a+(r.clicks||0),0),
    }
  })

  const engRate   = insights?.reach > 0 ? (insights.engagement / insights.reach) * 100 : 0
  const ctr       = insights?.impressions > 0 ? (insights.clicks / insights.impressions) * 100 : 0
  const openRate  = insights?.email_sent > 0 ? (insights.email_opens / insights.email_sent) * 100 : 0
  const clickRate = insights?.email_sent > 0 ? (insights.email_clicks / insights.email_sent) * 100 : 0

  const maxPlat = Math.max(...platBreakdown.map(p=>p.impressions), 1)

  return (
    <div style={{ padding:'28px 32px 48px', height:'calc(100vh - var(--topbar-h))', overflowY:'auto', background:'#000' }}>

      {/* ── Header ── */}
      <div style={{
        display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:22,
        opacity:mounted?1:0, transform:mounted?'translateY(0)':'translateY(12px)',
        transition:'opacity 0.45s ease, transform 0.45s ease',
      }}>
        <div>
          <h1 style={{ fontFamily:'var(--display)', fontSize:24, fontWeight:800, letterSpacing:'-0.04em', color:'rgba(255,255,255,0.92)', lineHeight:1, marginBottom:5 }}>
            Insights
          </h1>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>
            {connPlats.length > 0
              ? `${connPlats.length} platform${connPlats.length!==1?'s':''} connected · last ${period} days`
              : `Tracking last ${period} days`}
          </p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {/* Period selector */}
          <div style={{ display:'flex', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:11, padding:3, gap:2 }}>
            {[7,30,90].map(d => (
              <button key={d} onClick={() => setPeriod(d)}
                style={{ padding:'5px 13px', borderRadius:8, fontSize:12, fontWeight:period===d?700:500, background:period===d?'rgba(255,255,255,0.09)':'transparent', border:`1px solid ${period===d?'rgba(255,255,255,0.13)':'transparent'}`, color:period===d?'rgba(255,255,255,0.88)':'rgba(255,255,255,0.35)', cursor:'pointer', fontFamily:'var(--sans)', transition:'all 0.15s' }}>
                {d}d
              </button>
            ))}
          </div>
          <button onClick={sync} disabled={syncing}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', fontSize:12, fontWeight:600, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.48)', borderRadius:9, cursor:'pointer', fontFamily:'var(--sans)', transition:'all 0.15s' }}>
            {syncing ? <div className="nexa-spinner" style={{ width:12, height:12 }}/> : <span style={{ display:'flex' }}>{Ic.refresh}</span>}
            {syncing?'Syncing…':'Sync'}
          </button>
          {showSyncBanner && (
            <div style={{ padding:'12px 16px', background:'rgba(30,142,240,0.06)', border:'1px solid rgba(30,142,240,0.14)', borderRadius:9, fontSize:13, color:'var(--t3)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
              <span>Connect a publishing platform to sync your analytics</span>
              <a href="/dashboard/integrations" style={{ fontSize:12, color:'var(--blue2)', textDecoration:'none', fontWeight:500, whiteSpace:'nowrap' }}>Connect platforms →</a>
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display:'flex', gap:2, marginBottom:24, padding:4,
        background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14,
        opacity:mounted?1:0, transform:mounted?'translateY(0)':'translateY(12px)',
        transition:'opacity 0.45s ease 0.06s, transform 0.45s ease 0.06s',
      }}>
        {TABS.map(t => {
          const on = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex:1, padding:'8px 4px', borderRadius:10, border:`1px solid ${on?`${t.color}25`:'transparent'}`, background:on?`${t.color}0e`:'transparent', color:on?t.color:'rgba(255,255,255,0.32)', cursor:'pointer', fontSize:12, fontWeight:on?700:500, fontFamily:'var(--sans)', transition:'all 0.15s' }}
              onMouseEnter={e => { if(!on)(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { if(!on)(e.currentTarget as HTMLElement).style.background='transparent' }}>
              {t.label}
            </button>
          )
        })}
      </div>

      {loading && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - var(--topbar-h))', flexDirection:'column', gap:16, background:'#000' }}>
          <div className="nexa-spinner" style={{ width:22, height:22 }}/>
          <div style={{ fontSize:11, color:'var(--t4)', fontFamily:'var(--sans)', letterSpacing:'0.06em', textTransform:'uppercase' as const, fontWeight:500 }}>Loading</div>
        </div>
      )}

      {/* ── NO DATA ── */}
      {!loading && !insights && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'54vh', textAlign:'center', padding:'40px 20px', animation:'pageUp 0.3s ease both' }}>
          <div style={{ position:'relative', width:72, height:72, marginBottom:24 }}>
            <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'1px solid rgba(77,159,255,0.12)' }}/>
            <div style={{ position:'absolute', inset:10, borderRadius:'50%', border:'1px solid rgba(77,159,255,0.18)' }}/>
            <div style={{ position:'absolute', inset:20, borderRadius:'50%', background:'rgba(77,159,255,0.08)', border:'1px solid rgba(77,159,255,0.28)', display:'flex', alignItems:'center', justifyContent:'center', color:'#4D9FFF' }}>
              {Ic.chart}
            </div>
          </div>
          <h3 style={{ fontFamily:'var(--display)', fontSize:19, fontWeight:800, letterSpacing:'-0.03em', color:'rgba(255,255,255,0.9)', marginBottom:9 }}>
            No data yet for this period
          </h3>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.35)', lineHeight:1.75, maxWidth:400, marginBottom:26 }}>
            Connect your platforms and sync your analytics. Nexa will start tracking impressions, engagement, follower growth, and email performance in real time.
          </p>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={sync}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 24px', fontSize:13, fontWeight:700, fontFamily:'var(--display)', letterSpacing:'-0.02em', background:'#4D9FFF', color:'#000', border:'none', borderRadius:11, cursor:'pointer', boxShadow:'0 4px 22px rgba(77,159,255,0.38)', transition:'all 0.18s' }}>
              <span style={{ display:'flex' }}>{Ic.refresh}</span>Sync platforms
            </button>
            <Link href="/dashboard/integrations"
              style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 24px', fontSize:13, fontWeight:700, fontFamily:'var(--display)', letterSpacing:'-0.02em', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.65)', borderRadius:11, textDecoration:'none', transition:'all 0.18s' }}>
              Connect platforms →
            </Link>
          </div>
        </div>
      )}

      {!loading && insights && (
        <>
          {/* ════════ OVERVIEW ════════ */}
          {tab === 'overview' && (
            <div style={{ animation:'pageUp 0.3s ease both' }}>

              {/* ── Empty state: no platforms + no data ── */}
              {connPlats.length === 0 && (!insights || insights.posts_created === 0) && (
                <div style={{ margin:'12px 0 28px', padding:'36px 28px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:18, textAlign:'center' }}>
                  <div style={{ width:48, height:48, borderRadius:14, background:'rgba(56,191,255,0.08)', border:'1px solid rgba(56,191,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38BFFF" strokeWidth="1.5" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  </div>
                  <div style={{ fontFamily:'var(--display)', fontSize:17, fontWeight:800, letterSpacing:'-0.03em', color:'rgba(255,255,255,0.88)', marginBottom:8 }}>No performance data yet</div>
                  <div style={{ fontSize:12.5, color:'rgba(255,255,255,0.38)', lineHeight:1.75, maxWidth:340, margin:'0 auto 24px' }}>
                    Connect your social platforms to track impressions, reach, and engagement in real time.
                  </div>
                  <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap', marginBottom:16 }}>
                    {[{id:'instagram',label:'Instagram',color:'#E1306C'},{id:'linkedin',label:'LinkedIn',color:'#0A66C2'},{id:'x',label:'X',color:'#E7E7E7'},{id:'tiktok',label:'TikTok',color:'#FF2D55'}].map(p=>(
                      <a key={p.id} href={'/api/oauth/'+p.id+'?workspace_id='+(ws?.id||'')}
                        style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:9, fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.55)', textDecoration:'none' }}>
                        <div style={{ width:6,height:6,borderRadius:'50%',background:p.color }}/>
                        {p.label}
                      </a>
                    ))}
                  </div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.2)' }}>Already publishing? Hit <strong style={{color:'rgba(255,255,255,0.38)'}}>Sync</strong> above.</div>
                </div>
              )}

              {/* ── Hero stat grid ── */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:10, marginBottom:18 }}>
                <HeroStat icon={Ic.eye}    label="Impressions"    value={fmt(insights.impressions)}          rawData={sparkSeries('impressions')}          color="#4D9FFF" trend={insights?.trends?.impressions}/>
                <HeroStat icon={Ic.users}  label="Reach"          value={fmt(insights.reach)}                rawData={sparkSeries('reach')}                color="#A78BFA" trend={insights?.trends?.reach}/>
                <HeroStat icon={Ic.heart}  label="Engagements"    value={fmt(insights.engagement)}           rawData={sparkSeries('engagement')}           color="#FF7A40" trend={insights?.trends?.engagement}/>
                <HeroStat icon={Ic.click}  label="Link clicks"    value={fmt(insights.clicks)}               rawData={sparkSeries('clicks')}               color="#34D399" trend={insights?.trends?.clicks}/>
                <HeroStat icon={Ic.chart}  label="Posts created"  value={fmt(insights.posts_created||0)}     rawData={sparkSeries('posts_created')}        color="#FFB547" trend={insights?.trends?.posts_created}/>
                <HeroStat icon={Ic.users}  label="New followers"  value={fmt(insights.followers_gained||0)}  rawData={sparkSeries('followers_gained')}     color="#FF5757" trend={3}/>
              </div>

              {/* ── Main area chart ── */}
              <div style={{ padding:'24px 24px', background:'linear-gradient(145deg,rgba(77,159,255,0.06) 0%,rgba(0,0,0,0.35) 100%)', border:'1px solid rgba(77,159,255,0.15)', borderRadius:18, marginBottom:14, boxShadow:'0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(77,159,255,0.08)', position:'relative', overflow:'hidden' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
                  <div>
                    <div style={{ fontFamily:'var(--display)', fontSize:15, fontWeight:700, color:'rgba(255,255,255,0.88)', letterSpacing:'-0.02em', marginBottom:2 }}>
                      Impressions over time
                    </div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>Last {period} days</div>
                  </div>
                  <div style={{ fontFamily:'var(--display)', fontSize:26, fontWeight:800, letterSpacing:'-0.05em', color:'#4D9FFF' }}>
                    {fmt(insights.impressions)}
                  </div>
                </div>
                <AreaChart data={series('impressions')} color="#4D9FFF" height={120} label="impressions"/>
              </div>

              {/* ── Engagement + CTR donut cards ── */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                {[
                  { label:'Engagement rate',  pct:engRate,  color:'#FF7A40', sub:`${engRate.toFixed(2)}% of reach`, desc:'Engagements ÷ reach' },
                  { label:'Click rate', pct:ctr,    color:'#34D399', sub:`${ctr.toFixed(2)}% of impressions`, desc:'clicks / impressions' },
                ].map(m => (
                  <div key={m.label} style={{ padding:'20px 22px', background:`linear-gradient(145deg,${m.color}06 0%,rgba(0,0,0,0.3) 100%)`, border:`1px solid ${m.color}18`, borderRadius:16, display:'flex', alignItems:'center', gap:18, boxShadow:`0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 ${m.color}10` }}>
                    <div style={{ position:'relative', flexShrink:0 }}>
                      <Donut pct={Math.min(m.pct, 100)} color={m.color} size={88}/>
                      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
                        <div style={{ fontFamily:'var(--display)', fontSize:15, fontWeight:800, color:'rgba(255,255,255,0.88)', letterSpacing:'-0.03em', lineHeight:1 }}>
                          {m.pct.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.85)', letterSpacing:'-0.02em', marginBottom:4 }}>{m.label}</div>
                      <div style={{ fontSize:12, color:m.color, fontWeight:600, marginBottom:4 }}>{m.sub}</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>{m.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── AI analysis ── */}
              {aiText ? (
                <div style={{ padding:'18px 22px', background:'linear-gradient(145deg, rgba(77,159,255,0.08) 0%, rgba(77,159,255,0.03) 100%)', border:'1px solid rgba(77,159,255,0.2)', borderRadius:16, animation:'pageUp 0.3s ease both' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:10 }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:'#4D9FFF', boxShadow:'0 0 7px #4D9FFF' }}/>
                    <span style={{ fontSize:9, fontWeight:700, color:'#4D9FFF', letterSpacing:'0.09em', textTransform:'uppercase' }}>AI Analysis</span>
                  </div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.68)', lineHeight:1.75 }}>{aiText}</div>
                </div>
              ) : (
                <button onClick={explain} disabled={explaining}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 20px', fontSize:13, fontWeight:600, background:'rgba(77,159,255,0.07)', border:'1px solid rgba(77,159,255,0.2)', color:'#4D9FFF', borderRadius:11, cursor:'pointer', fontFamily:'var(--sans)', transition:'all 0.15s', width:'100%', justifyContent:'center' }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(77,159,255,0.12)';(e.currentTarget as HTMLElement).style.borderColor='rgba(77,159,255,0.32)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(77,159,255,0.07)';(e.currentTarget as HTMLElement).style.borderColor='rgba(77,159,255,0.2)'}}>
                  {explaining ? <div className="nexa-spinner" style={{ width:12, height:12 }}/> : <span style={{ display:'flex' }}>{Ic.bolt}</span>}
                  {explaining ? 'Reading your numbers…' : 'What does this mean?'}
                </button>
              )}
            </div>
          )}

          {/* ════════ CONTENT ════════ */}
          {tab === 'content' && (
            <div style={{ animation:'pageUp 0.3s ease both' }}>
              {/* Stats */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:10, marginBottom:18 }}>
                <HeroStat icon={Ic.chart}  label="Posts created"   value={fmt(insights.posts_created||0)}     rawData={sparkSeries('posts_created')}     color="#A78BFA"/>
                <HeroStat icon={Ic.eye}    label="Total impressions"value={fmt(insights.impressions)}          rawData={sparkSeries('impressions')}       color="#4D9FFF"/>
                <HeroStat icon={Ic.heart}  label="Total engagements"value={fmt(insights.engagement)}           rawData={sparkSeries('engagement')}        color="#FF7A40"/>
                <HeroStat icon={Ic.star}   label="Avg per post"     value={insights.posts_created>0?fmt(Math.round(insights.impressions/(insights.posts_created||1))):'—'} color="#34D399"/>
              </div>

              {/* Engagement over time */}
              <div style={{ padding:'24px 24px', background:'linear-gradient(145deg,rgba(77,159,255,0.06) 0%,rgba(0,0,0,0.35) 100%)', border:'1px solid rgba(77,159,255,0.15)', borderRadius:18, marginBottom:14, boxShadow:'0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(77,159,255,0.08)', position:'relative', overflow:'hidden' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
                  <div>
                    <div style={{ fontFamily:'var(--display)', fontSize:15, fontWeight:700, color:'rgba(255,255,255,0.88)', letterSpacing:'-0.02em', marginBottom:2 }}>Engagement over time</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>Likes, comments, shares · last {period} days</div>
                  </div>
                  <div style={{ fontFamily:'var(--display)', fontSize:26, fontWeight:800, letterSpacing:'-0.05em', color:'#FF7A40' }}>
                    {fmt(insights.engagement)}
                  </div>
                </div>
                <AreaChart data={series('engagement')} color="#FF7A40" height={110} label="engagement"/>
              </div>

              {/* Top content rows */}
              {raw.length > 0 && (
                <div style={{ padding:'18px 20px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16 }}>
                  <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.28)', letterSpacing:'0.09em', textTransform:'uppercase', marginBottom:14 }}>Daily breakdown</div>
                  {raw.slice(-10).reverse().map((row,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ width:7, height:7, borderRadius:'50%', background:PC[row.platform]||'#888', flexShrink:0, boxShadow:`0 0 4px ${PC[row.platform]||'#888'}` }}/>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', width:72, flexShrink:0 }}>{row.date?.slice(5)||'—'}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:100, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${Math.min(100,(row.impressions||0)/Math.max(...raw.map((r:any)=>r.impressions||0),1)*100)}%`, background:PC[row.platform]||'#888', borderRadius:100 }}/>
                        </div>
                      </div>
                      <div style={{ fontSize:12, color:'rgba(255,255,255,0.62)', fontWeight:600, minWidth:55, textAlign:'right' }}>{fmt(row.impressions||0)}</div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)', minWidth:55, textAlign:'right' }}>{fmt(row.engagement||0)} eng</div>
                      <div style={{ fontSize:10, color:PC[row.platform]||'rgba(255,255,255,0.28)', fontWeight:600, minWidth:60, textAlign:'right', textTransform:'capitalize' }}>{row.platform||'—'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════════ EMAIL ════════ */}
          {tab === 'email' && (
            <div style={{ animation:'pageUp 0.3s ease both' }}>
              {/* Stats */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:10, marginBottom:18 }}>
                <HeroStat icon={Ic.mail}  label="Emails sent"   value={fmt(insights.email_sent||0)}    rawData={sparkSeries('email_sent')}    color="#34D399"/>
                <HeroStat icon={Ic.eye}   label="Opens"         value={fmt(insights.email_opens||0)}   rawData={sparkSeries('email_opens')}   color="#4D9FFF"/>
                <HeroStat icon={Ic.click} label="Clicks"        value={fmt(insights.email_clicks||0)}  rawData={sparkSeries('email_clicks')}  color="#A78BFA"/>
                <HeroStat icon={Ic.chart} label="Open rate"     value={pct(insights.email_opens||0,insights.email_sent||0)} color="#FFB547"/>
              </div>

              {/* Open rate + click rate donuts */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                {[
                  { label:'Open rate',  pct:openRate,  color:'#4D9FFF', sub:`${openRate.toFixed(1)}% of sent`,  desc:'Industry avg: 21%', good:openRate>21 },
                  { label:'Click rate', pct:clickRate, color:'#A78BFA', sub:`${clickRate.toFixed(1)}% of sent`, desc:'Industry avg: 2.3%', good:clickRate>2.3 },
                ].map(m => (
                  <div key={m.label} style={{ padding:'20px 22px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, display:'flex', alignItems:'center', gap:20 }}>
                    <div style={{ position:'relative', flexShrink:0 }}>
                      <Donut pct={Math.min(m.pct*2, 100)} color={m.color} size={96}/>
                      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
                        <div style={{ fontFamily:'var(--display)', fontSize:16, fontWeight:800, color:'rgba(255,255,255,0.9)', letterSpacing:'-0.03em', lineHeight:1 }}>{m.pct.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.85)', letterSpacing:'-0.02em', marginBottom:5 }}>{m.label}</div>
                      <div style={{ fontSize:12, color:m.color, fontWeight:600, marginBottom:5 }}>{m.sub}</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.28)', marginBottom:6 }}>{m.desc}</div>
                      <div style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 9px', borderRadius:100, background:m.good?'rgba(52,211,153,0.1)':'rgba(255,181,71,0.1)', border:`1px solid ${m.good?'rgba(52,211,153,0.2)':'rgba(255,181,71,0.2)'}` }}>
                        <span style={{ fontSize:10, fontWeight:700, color:m.good?'#34D399':'#FFB547' }}>
                          {m.good?'↑ Above average':'→ Room to improve'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Opens over time */}
              {raw.some(r=>r.email_opens>0) && (
                <div style={{ padding:'20px 22px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
                    <div>
                      <div style={{ fontFamily:'var(--display)', fontSize:15, fontWeight:700, color:'rgba(255,255,255,0.88)', letterSpacing:'-0.02em', marginBottom:2 }}>Email opens over time</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>Last {period} days</div>
                    </div>
                    <div style={{ fontFamily:'var(--display)', fontSize:26, fontWeight:800, letterSpacing:'-0.05em', color:'#34D399' }}>
                      {fmt(insights.email_opens||0)}
                    </div>
                  </div>
                  <AreaChart data={series('email_opens')} color="#34D399" height={110} label="email"/>
                </div>
              )}

              {insights.email_sent === 0 && (
                <div style={{ padding:'32px', border:'1px dashed rgba(255,255,255,0.08)', borderRadius:14, textAlign:'center', color:'rgba(255,255,255,0.28)', fontSize:13, lineHeight:1.75 }}>
                  No email data yet. Connect your email provider or<br/>start sending sequences via Automate.
                </div>
              )}
            </div>
          )}

          {/* ════════ PLATFORMS ════════ */}
          {tab === 'platforms' && (
            <div style={{ animation:'pageUp 0.3s ease both' }}>
              {connPlats.length > 0 ? (
                <>
                  {/* Platform bars */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:18 }}>
                    {/* Impressions by platform */}
                    <div style={{ padding:'20px 22px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18 }}>
                      <div style={{ fontFamily:'var(--display)', fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.85)', letterSpacing:'-0.02em', marginBottom:18 }}>
                        Impressions by platform
                      </div>
                      {platBreakdown.map(p => (
                        <HBar key={p.platform} value={p.impressions} max={maxPlat} color={PC[p.platform]||'#888'} label={p.platform} sub={fmt(p.impressions)}/>
                      ))}
                    </div>
                    {/* Engagement by platform */}
                    <div style={{ padding:'20px 22px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18 }}>
                      <div style={{ fontFamily:'var(--display)', fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.85)', letterSpacing:'-0.02em', marginBottom:18 }}>
                        Engagement by platform
                      </div>
                      {platBreakdown.map(p => (
                        <HBar key={p.platform} value={p.engagement} max={Math.max(...platBreakdown.map(x=>x.engagement),1)} color={PC[p.platform]||'#888'} label={p.platform} sub={fmt(p.engagement)}/>
                      ))}
                    </div>
                  </div>

                  {/* Per-platform detail cards */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:10 }}>
                    {platBreakdown.map(p => {
                      const color  = PC[p.platform]||'#888'
                      const platRaw= raw.filter(r=>r.platform===p.platform)
                      const engR   = p.impressions>0?(p.engagement/p.impressions)*100:0
                      return (
                        <div key={p.platform} style={{ padding:'18px 20px', background:`${color}06`, border:`1px solid ${color}22`, borderRadius:16 }}>
                          {/* Header */}
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <div style={{ width:9, height:9, borderRadius:'50%', background:color, boxShadow:`0 0 8px ${color}` }}/>
                              <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.88)', textTransform:'capitalize', letterSpacing:'-0.01em' }}>{p.platform}</span>
                            </div>
                            {p.account && <span style={{ fontSize:10, color:'rgba(255,255,255,0.28)' }}>{p.account}</span>}
                          </div>

                          {/* Mini sparkline */}
                          {platRaw.length > 1 && (
                            <div style={{ marginBottom:14 }}>
                              <Sparkline data={platRaw.map(r=>r.impressions||0)} color={color} width={200} height={36}/>
                            </div>
                          )}

                          {/* Stats grid */}
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
                            {[
                              { l:'Impressions', v:fmt(p.impressions) },
                              { l:'Engagements', v:fmt(p.engagement) },
                              { l:'Followers',   v:`+${fmt(p.followers)}` },
                            ].map(s=>(
                              <div key={s.l} style={{ padding:'8px 10px', background:'rgba(0,0,0,0.22)', borderRadius:9, textAlign:'center' }}>
                                <div style={{ fontFamily:'var(--display)', fontSize:16, fontWeight:800, color:'rgba(255,255,255,0.82)', letterSpacing:'-0.03em', lineHeight:1 }}>{s.v}</div>
                                <div style={{ fontSize:9, color:'rgba(255,255,255,0.28)', marginTop:2 }}>{s.l}</div>
                              </div>
                            ))}
                          </div>

                          {/* Engagement rate bar */}
                          <div style={{ marginTop:12 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                              <span style={{ fontSize:10, color:'rgba(255,255,255,0.38)' }}>Engagement rate</span>
                              <span style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.72)' }}>{engR.toFixed(2)}%</span>
                            </div>
                            <div style={{ height:4, background:'rgba(255,255,255,0.07)', borderRadius:100, overflow:'hidden' }}>
                              <div style={{ height:'100%', width:`${Math.min(engR*10,100)}%`, background:`linear-gradient(90deg, ${color}88, ${color})`, borderRadius:100, transition:'width 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}/>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'50vh', textAlign:'center', padding:'40px 20px' }}>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.28)', lineHeight:1.7, marginBottom:16 }}>
                    No platforms connected yet.
                  </div>
                  <Link href="/dashboard/integrations"
                    style={{ fontSize:12, fontWeight:700, color:'#4D9FFF', background:'rgba(77,159,255,0.08)', border:'1px solid rgba(77,159,255,0.22)', borderRadius:9, padding:'8px 18px', textDecoration:'none', fontFamily:'var(--sans)' }}>
                    Connect platforms →
                  </Link>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
