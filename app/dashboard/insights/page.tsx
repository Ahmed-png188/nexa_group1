'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Tab = 'overview'|'content'|'email'|'platforms'

const PC: Record<string,string> = {
  instagram:'#E1306C', linkedin:'#0A66C2', x:'#E7E7E7',
  tiktok:'#FF0050', email:'var(--cyan)', general:'#888',
}

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
  { id:'overview'  as Tab, label:'Overview',  color:'var(--cyan)'    },
  { id:'content'   as Tab, label:'Content',   color:'var(--cyan)'    },
  { id:'email'     as Tab, label:'Email',     color:'var(--success)' },
  { id:'platforms' as Tab, label:'Platforms', color:'var(--cyan)'    },
]

/* ── Chart primitives ── */
function Sparkline({ data, color, width=80, height=28 }: { data:number[]; color:string; width?:number; height?:number }) {
  if (data.length < 2) return <div style={{ width, height }}/>
  const max = Math.max(...data), min = Math.min(...data), range = max-min||1
  const pts = data.map((v,i)=>`${(i/(data.length-1))*width},${height-((v-min)/range)*height}`)
  const path = `M ${pts.join(' L ')}`
  const area = `M ${pts[0]} L ${pts.join(' L ')} L ${width},${height} L 0,${height} Z`
  const id = `sg${color.replace(/[^a-z0-9]/gi,'')}`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow:'visible' }}>
      <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.25"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <path d={area} fill={`url(#${id})`}/>
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={width} cy={height-((data[data.length-1]-min)/range)*height} r="2.5" fill={color}/>
    </svg>
  )
}

function AreaChart({ data, color, height=120, label='' }: { data:{date:string;value:number}[]; color:string; height?:number; label?:string }) {
  const sorted = [...data].sort((a,b)=>a.date.localeCompare(b.date)).slice(-30)
  if (sorted.length < 2) return <div style={{ height, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-4)', fontSize:12 }}>Not enough data to plot</div>
  const W=600, H=height, max=Math.max(...sorted.map(d=>d.value)), range=max||1
  const pts = sorted.map((d,i)=>({ x:(i/(sorted.length-1))*W, y:H-((d.value/range)*(H*0.85)), ...d }))
  const id = `ag${label.replace(/[^a-z0-9]/gi,'')}`
  return (
    <div style={{ position:'relative' }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display:'block', overflow:'visible' }}>
        <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.2"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
        {[0.25,0.5,0.75,1].map(r=><line key={r} x1="0" y1={H*(1-r*0.85)} x2={W} y2={H*(1-r*0.85)} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>)}
        <path d={`M 0,${H} L ${pts.map(p=>`${p.x},${p.y}`).join(' L ')} L ${W},${H} Z`} fill={`url(#${id})`}/>
        <path d={`M ${pts.map(p=>`${p.x},${p.y}`).join(' L ')}`} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.filter((_,i)=>i%Math.ceil(pts.length/6)===0||i===pts.length-1).map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="3" fill={color} opacity="0.7"/>)}
      </svg>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
        {[sorted[0], sorted[Math.floor(sorted.length/2)], sorted[sorted.length-1]].map((d,i)=>(
          <span key={i} style={{ fontSize:9, color:'var(--text-4)', fontWeight:500 }}>{d.date.slice(5)}</span>
        ))}
      </div>
    </div>
  )
}

function HBar({ value, max, color, label, sub }: { value:number; max:number; color:string; label:string; sub:string }) {
  const pct = max>0?(value/max)*100:0
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:color, boxShadow:`0 0 5px ${color}` }}/>
          <span style={{ fontSize:12, color:'var(--text-2)', fontWeight:600, letterSpacing:'-0.01em', textTransform:'capitalize' as const }}>{label}</span>
        </div>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--text-1)', letterSpacing:'-0.02em' }}>{sub}</div>
      </div>
      <div className="progress-track">
        <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${color}cc,${color})`, borderRadius:3, transition:'width 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}/>
      </div>
    </div>
  )
}

function Donut({ pct, color, size=88 }: { pct:number; color:string; size?:number }) {
  const r=size/2-8, circ=2*Math.PI*r, dash=(pct/100)*circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ/4} strokeLinecap="round"
        style={{ transition:'stroke-dasharray 1.3s cubic-bezier(0.34,1.56,0.64,1)', filter:`drop-shadow(0 0 6px ${color}80)` }}/>
    </svg>
  )
}

function HeroStat({ icon, label, value, rawData, color, trend }: any) {
  const isPos=trend>0, isNeg=trend<0
  return (
    <div className="card" style={{ padding:'18px 20px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:`${color}14`, filter:'blur(20px)', pointerEvents:'none' }}/>
      <div style={{ position:'relative' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:`${color}14`, border:`1px solid ${color}25`, display:'flex', alignItems:'center', justifyContent:'center', color, flexShrink:0 }}>{icon}</div>
            <span style={{ fontSize:10, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' as const, color:'var(--text-3)' }}>{label}</span>
          </div>
          {trend !== undefined && (
            <div style={{ display:'flex', alignItems:'center', gap:3, padding:'3px 8px', borderRadius:100, background:isPos?'var(--success-dim)':isNeg?'var(--error-dim)':'rgba(255,255,255,0.05)', border:`1px solid ${isPos?'var(--success-border)':isNeg?'var(--error-border)':'var(--border)'}` }}>
              <span style={{ display:'flex', color:isPos?'var(--success)':isNeg?'var(--error)':'var(--text-3)' }}>{isPos?Ic.up:isNeg?Ic.down:null}</span>
              <span style={{ fontSize:11, fontWeight:700, color:isPos?'var(--success)':isNeg?'var(--error)':'var(--text-3)' }}>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <div style={{ fontSize:32, fontWeight:700, letterSpacing:'-0.04em', color:'var(--text-1)', lineHeight:1, marginBottom:10, fontFamily:'var(--sans)' }}>{value}</div>
        {rawData && rawData.length>1 && <Sparkline data={rawData} color={color} width={100} height={32}/>}
      </div>
    </div>
  )
}

export default function InsightsPage() {
  const supabase = createClient()
  const [ws,          setWs]          = useState<any>(null)
  const [raw,         setRaw]         = useState<any[]>([])
  const [insights,    setInsights]    = useState<any>(null)
  const [loading,     setLoading]     = useState(true)
  const [period,      setPeriod]      = useState(30)
  const [tab,         setTab]         = useState<Tab>('overview')
  const [aiText,      setAiText]      = useState<string|null>(null)
  const [explaining,  setExplaining]  = useState(false)
  const [syncing,     setSyncing]     = useState(false)
  const [showBanner,  setShowBanner]  = useState(false)
  const [connPlats,   setConnPlats]   = useState<any[]>([])
  const [mounted,     setMounted]     = useState(false)

  useEffect(()=>{ setMounted(true) },[])
  useEffect(()=>{ load() },[period])
  useEffect(()=>{ const t=setTimeout(()=>setLoading(false),4000); return ()=>clearTimeout(t) },[])

  async function load() {
    try {
      const {data:{user}} = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const {data:m} = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id',user.id).limit(1).single()
      const w=(m as any)?.workspaces; setWs(w)
      const now=new Date(), cutoff=new Date(now.getTime()-period*86400000).toISOString(), prevCut=new Date(now.getTime()-period*2*86400000).toISOString()
      const [{data:content},{data:prevContent},{data:plats},{data:emailSeqs}] = await Promise.all([
        supabase.from('content').select('*').eq('workspace_id',w?.id).gte('created_at',cutoff).order('created_at',{ascending:true}),
        supabase.from('content').select('id,impressions,engagement,clicks,reach,likes,comments,shares,created_at').eq('workspace_id',w?.id).gte('created_at',prevCut).lt('created_at',cutoff),
        supabase.from('connected_platforms').select('*').eq('workspace_id',w?.id).eq('is_active',true),
        supabase.from('email_sequences').select('*').eq('workspace_id',w?.id),
      ])
      setConnPlats(plats??[])
      const rows=content??[], prev=prevContent??[]
      const byDate: Record<string,any>={}
      for (const c of rows) {
        const date=c.created_at?.split('T')[0]; if(!date) continue
        if(!byDate[date]) byDate[date]={date,impressions:0,reach:0,engagement:0,clicks:0,posts_created:0,followers_gained:0,email_opens:0,email_clicks:0,email_sent:0,platform:c.platform}
        byDate[date].posts_created++
        byDate[date].impressions+=c.impressions||0; byDate[date].reach+=c.reach||0
        byDate[date].engagement+=(c.likes||0)+(c.comments||0)+(c.shares||0)
        byDate[date].clicks+=c.clicks||0; byDate[date].followers_gained+=c.followers_gained||0
      }
      setRaw(Object.values(byDate).sort((a:any,b:any)=>a.date.localeCompare(b.date)))
      const agg={
        impressions:rows.reduce((s,r)=>s+(r.impressions||0),0),
        reach:rows.reduce((s,r)=>s+(r.reach||0),0),
        engagement:rows.reduce((s,r)=>s+(r.likes||0)+(r.comments||0)+(r.shares||0),0),
        clicks:rows.reduce((s,r)=>s+(r.clicks||0),0),
        posts_created:rows.length,
        followers_gained:rows.reduce((s,r)=>s+(r.followers_gained||0),0),
        email_sent:emailSeqs?.reduce((s:number,e:any)=>s+(e.emails_sent||0),0)||0,
        email_opens:emailSeqs?.reduce((s:number,e:any)=>s+(e.emails_opened||0),0)||0,
        email_clicks:emailSeqs?.reduce((s:number,e:any)=>s+(e.emails_clicked||0),0)||0,
      }
      const prevAgg={impressions:prev.reduce((s,r)=>s+(r.impressions||0),0),reach:prev.reduce((s,r)=>s+(r.reach||0),0),engagement:prev.reduce((s,r)=>s+(r.likes||0)+(r.comments||0)+(r.shares||0),0),clicks:prev.reduce((s,r)=>s+(r.clicks||0),0),posts_created:prev.length}
      const trend=(cur:number,prv:number)=>prv>0?Math.round(((cur-prv)/prv)*100):(cur>0?100:0)
      setInsights(rows.length>0?{...agg,rows,trends:{impressions:trend(agg.impressions,prevAgg.impressions),reach:trend(agg.reach,prevAgg.reach),engagement:trend(agg.engagement,prevAgg.engagement),clicks:trend(agg.clicks,prevAgg.clicks),posts_created:trend(agg.posts_created,prevAgg.posts_created)}}:null)
    } catch {}
    setLoading(false)
  }

  async function sync() {
    if (!ws||syncing) return
    if (connPlats.length===0) { setShowBanner(true); return }
    setSyncing(true); setShowBanner(false)
    try { await fetch('/api/sync-platform-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspace_id:ws.id})}); load() } catch {}
    setSyncing(false)
  }

  async function explain() {
    if (!ws||explaining||!insights) return; setExplaining(true)
    try {
      const summary=`Posts: ${insights.posts_created||0}, Impressions: ${insights.impressions||0}, Engagement: ${insights.engagement||0}, Reach: ${insights.reach||0}, Clicks: ${insights.clicks||0} over last ${period} days.`
      const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspace_id:ws.id,message:`Analyze my content performance for the last ${period} days. Give me 3 specific, actionable insights. Data: ${summary} What's working, what needs improvement, what should I focus on next week? Be direct.`,history:[]})})
      const d=await r.json(); setAiText(d.reply||'No insights available yet. Publish content and connect platforms to start tracking.')
    } catch {}
    setExplaining(false)
  }

  function fmt(n:number){ if(n>=1000000) return `${(n/1000000).toFixed(1)}M`; if(n>=1000) return `${(n/1000).toFixed(1)}K`; return String(n||0) }
  function pct(a:number,b:number){ return b>0?((a/b)*100).toFixed(1)+'%':'—' }
  const series=(key:string)=>(raw||[]).map(r=>({date:r.date,value:r[key]||0}))
  const spark=(key:string)=>(raw||[]).map(r=>r[key]||0)
  const platBreak=connPlats.map(cp=>{
    const pr=raw.filter(r=>r.platform===cp.platform)
    return {platform:cp.platform,account:cp.platform_username||cp.account_name||'',impressions:pr.reduce((a,r)=>a+(r.impressions||0),0),engagement:pr.reduce((a,r)=>a+(r.engagement||0),0),followers:pr.reduce((a,r)=>a+(r.followers_gained||0),0),clicks:pr.reduce((a,r)=>a+(r.clicks||0),0)}
  })
  const engRate=insights?.reach>0?(insights.engagement/insights.reach)*100:0
  const ctr=insights?.impressions>0?(insights.clicks/insights.impressions)*100:0
  const openRate=insights?.email_sent>0?(insights.email_opens/insights.email_sent)*100:0
  const clickRate=insights?.email_sent>0?(insights.email_clicks/insights.email_sent)*100:0
  const maxPlat=Math.max(...platBreak.map(p=>p.impressions),1)

  return (
    <div className="nexa-page">

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28, opacity:mounted?1:0, transform:mounted?'none':'translateY(8px)', transition:'all 0.4s ease' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.03em', color:'var(--text-1)', lineHeight:1.2, marginBottom:4 }}>Insights</h1>
          <p style={{ fontSize:13, color:'var(--text-3)' }}>
            {connPlats.length>0?`${connPlats.length} platform${connPlats.length!==1?'s':''} connected · last ${period} days`:`Tracking last ${period} days`}
          </p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {/* Period pills */}
          <div style={{ display:'flex', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:3, gap:2 }}>
            {[7,30,90].map(d=>(
              <button key={d} onClick={()=>setPeriod(d)}
                style={{ padding:'5px 13px', borderRadius:8, fontSize:12, fontWeight:period===d?700:500, background:period===d?'var(--elevated)':'transparent', border:`1px solid ${period===d?'var(--border-strong)':'transparent'}`, color:period===d?'var(--text-1)':'var(--text-3)', cursor:'pointer', fontFamily:'var(--sans)', transition:'all 0.15s' }}>
                {d}d
              </button>
            ))}
          </div>
          <button onClick={sync} disabled={syncing} className="btn-secondary" style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', fontSize:12 }}>
            {syncing?<div className="nexa-spinner" style={{width:12,height:12}}/>:<span style={{display:'flex'}}>{Ic.refresh}</span>}
            {syncing?'Syncing…':'Sync'}
          </button>
        </div>
      </div>

      {showBanner&&(
        <div style={{ padding:'12px 16px', background:'var(--cyan-dim)', border:'1px solid var(--cyan-border)', borderRadius:'var(--r)', fontSize:13, color:'var(--text-2)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:20 }}>
          <span>Connect a publishing platform to sync your analytics</span>
          <Link href="/dashboard/integrations" style={{ fontSize:12, color:'var(--cyan)', textDecoration:'none', fontWeight:600, whiteSpace:'nowrap' as const }}>Connect platforms →</Link>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="tab-bar" style={{ borderBottom:'none', marginBottom:24, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:4, gap:2, display:'flex' }}>
        {TABS.map(t=>{
          const on=tab===t.id
          return (
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{ flex:1, padding:'8px 4px', borderRadius:8, border:`1px solid ${on?'var(--border-strong)':'transparent'}`, background:on?'var(--elevated)':'transparent', color:on?'var(--text-1)':'var(--text-3)', cursor:'pointer', fontSize:12, fontWeight:on?600:400, fontFamily:'var(--sans)', transition:'all 0.15s' }}
              onMouseEnter={e=>{if(!on)(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)'}}
              onMouseLeave={e=>{if(!on)(e.currentTarget as HTMLElement).style.background='transparent'}}>
              {t.label}
            </button>
          )
        })}
      </div>

      {loading&&(
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'40vh', flexDirection:'column', gap:14 }}>
          <div className="nexa-spinner" style={{width:22,height:22}}/>
          <div style={{ fontSize:11, color:'var(--text-3)', letterSpacing:'0.06em', textTransform:'uppercase' as const }}>Loading</div>
        </div>
      )}

      {/* ── NO DATA ── */}
      {!loading&&!insights&&(
        <div className="empty-state" style={{ minHeight:'50vh' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'var(--cyan-dim)', border:'1px solid var(--cyan-border)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--cyan)' }}>{Ic.chart}</div>
          <div style={{ fontSize:15, fontWeight:600, color:'var(--text-1)' }}>No data yet for this period</div>
          <div style={{ fontSize:13, color:'var(--text-3)', lineHeight:1.7, maxWidth:400 }}>Connect your platforms and sync analytics. Nexa tracks impressions, engagement, follower growth, and email performance in real time.</div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={sync} className="btn-primary" style={{ display:'flex', alignItems:'center', gap:7 }}>
              <span style={{display:'flex'}}>{Ic.refresh}</span>Sync platforms
            </button>
            <Link href="/dashboard/integrations" className="btn-secondary" style={{ display:'flex', alignItems:'center', gap:7, textDecoration:'none' }}>
              Connect platforms →
            </Link>
          </div>
        </div>
      )}

      {!loading&&insights&&(
        <>
          {/* ════ OVERVIEW ════ */}
          {tab==='overview'&&(
            <div style={{ animation:'pageUp 0.3s ease both' }}>
              {connPlats.length===0&&insights.posts_created===0&&(
                <div className="card-accent" style={{ marginBottom:24, textAlign:'center', padding:'32px 24px' }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:'var(--cyan-dim)', border:'1px solid var(--cyan-border)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', color:'var(--cyan)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  </div>
                  <div style={{ fontSize:15, fontWeight:600, color:'var(--text-1)', marginBottom:6 }}>No performance data yet</div>
                  <div style={{ fontSize:12, color:'var(--text-3)', lineHeight:1.7, maxWidth:340, margin:'0 auto 20px' }}>Connect your social platforms to track impressions, reach, and engagement in real time.</div>
                  <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' as const }}>
                    {[{id:'instagram',label:'Instagram',color:'#E1306C'},{id:'linkedin',label:'LinkedIn',color:'#0A66C2'},{id:'x',label:'X',color:'#888'},{id:'tiktok',label:'TikTok',color:'#FF2D55'}].map(p=>(
                      <a key={p.id} href={`/api/oauth/${p.id}?workspace_id=${ws?.id||''}`}
                        style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', fontSize:12, fontWeight:500, color:'var(--text-2)', textDecoration:'none' }}>
                        <div style={{width:6,height:6,borderRadius:'50%',background:p.color}}/>{p.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Stat grid */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10, marginBottom:16 }}>
                <HeroStat icon={Ic.eye}   label="Impressions"   value={fmt(insights.impressions)}         rawData={spark('impressions')}       color="var(--cyan)"    trend={insights?.trends?.impressions}/>
                <HeroStat icon={Ic.users} label="Reach"         value={fmt(insights.reach)}               rawData={spark('reach')}             color="var(--cyan)"        trend={insights?.trends?.reach}/>
                <HeroStat icon={Ic.heart} label="Engagements"   value={fmt(insights.engagement)}          rawData={spark('engagement')}        color="var(--cyan)" trend={insights?.trends?.engagement}/>
                <HeroStat icon={Ic.click} label="Link clicks"   value={fmt(insights.clicks)}              rawData={spark('clicks')}            color="var(--success)" trend={insights?.trends?.clicks}/>
                <HeroStat icon={Ic.chart} label="Posts created" value={fmt(insights.posts_created||0)}    rawData={spark('posts_created')}     color="var(--cyan)"        trend={insights?.trends?.posts_created}/>
                <HeroStat icon={Ic.users} label="New followers" value={fmt(insights.followers_gained||0)} rawData={spark('followers_gained')}  color="var(--cyan)"   trend={3}/>
              </div>

              {/* Impressions over time */}
              <div className="card" style={{ marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:'var(--text-1)', letterSpacing:'-0.02em', marginBottom:2 }}>Impressions over time</div>
                    <div style={{ fontSize:11, color:'var(--text-3)' }}>Last {period} days</div>
                  </div>
                  <div style={{ fontSize:24, fontWeight:700, letterSpacing:'-0.04em', color:'var(--cyan)', fontFamily:'var(--sans)' }}>{fmt(insights.impressions)}</div>
                </div>
                <AreaChart data={series('impressions')} color="var(--cyan)" height={120} label="impressions"/>
              </div>

              {/* Engagement + CTR donut cards */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                {[
                  {label:'Engagement rate', pct:engRate, color:'var(--cyan)', sub:`${engRate.toFixed(2)}% of reach`, desc:'Engagements ÷ reach'},
                  {label:'Click-through rate', pct:ctr, color:'var(--success)', sub:`${ctr.toFixed(2)}% of impressions`, desc:'Clicks ÷ impressions'},
                ].map(m=>(
                  <div key={m.label} className="card" style={{ display:'flex', alignItems:'center', gap:16 }}>
                    <div style={{ position:'relative', flexShrink:0 }}>
                      <Donut pct={Math.min(m.pct,100)} color={m.color} size={84}/>
                      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <div style={{ fontSize:14, fontWeight:700, color:'var(--text-1)', letterSpacing:'-0.03em' }}>{m.pct.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--text-1)', marginBottom:4, letterSpacing:'-0.01em' }}>{m.label}</div>
                      <div style={{ fontSize:12, color:m.color, fontWeight:600, marginBottom:3 }}>{m.sub}</div>
                      <div style={{ fontSize:11, color:'var(--text-3)' }}>{m.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI analysis */}
              {aiText?(
                <div className="card-accent" style={{ animation:'pageUp 0.3s ease both' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
                    <div className="dot-live"/>
                    <span style={{ fontSize:10, fontWeight:600, color:'var(--cyan)', letterSpacing:'0.08em', textTransform:'uppercase' as const }}>AI Analysis</span>
                  </div>
                  <div style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.75 }}>{aiText}</div>
                </div>
              ):(
                <button onClick={explain} disabled={explaining} className="btn-accent"
                  style={{ display:'flex', alignItems:'center', gap:8, width:'100%', justifyContent:'center', padding:'11px' }}>
                  {explaining?<div className="nexa-spinner" style={{width:12,height:12}}/>:<span style={{display:'flex'}}>{Ic.bolt}</span>}
                  {explaining?'Reading your numbers…':'What does this mean?'}
                </button>
              )}
            </div>
          )}

          {/* ════ CONTENT ════ */}
          {tab==='content'&&(
            <div style={{ animation:'pageUp 0.3s ease both' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10, marginBottom:16 }}>
                <HeroStat icon={Ic.chart} label="Posts created"    value={fmt(insights.posts_created||0)} rawData={spark('posts_created')} color="var(--cyan)"/>
                <HeroStat icon={Ic.eye}   label="Total impressions" value={fmt(insights.impressions)}      rawData={spark('impressions')}   color="var(--cyan)"/>
                <HeroStat icon={Ic.heart} label="Total engagements" value={fmt(insights.engagement)}       rawData={spark('engagement')}    color="var(--cyan)"/>
                <HeroStat icon={Ic.star}  label="Avg per post"      value={insights.posts_created>0?fmt(Math.round(insights.impressions/(insights.posts_created||1))):'—'} color="var(--success)"/>
              </div>
              <div className="card" style={{ marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:'var(--text-1)', marginBottom:2 }}>Engagement over time</div>
                    <div style={{ fontSize:11, color:'var(--text-3)' }}>Likes, comments, shares · last {period} days</div>
                  </div>
                  <div style={{ fontSize:24, fontWeight:700, letterSpacing:'-0.04em', color:'var(--cyan)', fontFamily:'var(--sans)' }}>{fmt(insights.engagement)}</div>
                </div>
                <AreaChart data={series('engagement')} color="var(--cyan)" height={110} label="engagement"/>
              </div>
              {raw.length>0&&(
                <div className="card">
                  <div style={{ fontSize:10, fontWeight:600, color:'var(--text-3)', letterSpacing:'0.08em', textTransform:'uppercase' as const, marginBottom:14 }}>Daily breakdown</div>
                  {raw.slice(-10).reverse().map((row,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 0', borderBottom:i<9?'1px solid var(--border-subtle)':'none' }}>
                      <div style={{ width:7, height:7, borderRadius:'50%', background:PC[row.platform]||'var(--text-4)', flexShrink:0 }}/>
                      <div style={{ fontSize:11, color:'var(--text-3)', width:72, flexShrink:0 }}>{row.date?.slice(5)||'—'}</div>
                      <div style={{ flex:1 }}>
                        <div className="progress-track">
                          <div style={{ height:'100%', width:`${Math.min(100,(row.impressions||0)/Math.max(...raw.map((r:any)=>r.impressions||0),1)*100)}%`, background:PC[row.platform]||'var(--border)', borderRadius:3 }}/>
                        </div>
                      </div>
                      <div style={{ fontSize:12, color:'var(--text-2)', fontWeight:600, minWidth:55, textAlign:'right' as const }}>{fmt(row.impressions||0)}</div>
                      <div style={{ fontSize:10, color:'var(--text-3)', minWidth:55, textAlign:'right' as const }}>{fmt(row.engagement||0)} eng</div>
                      <div style={{ fontSize:10, color:PC[row.platform]||'var(--text-3)', fontWeight:600, minWidth:60, textAlign:'right' as const, textTransform:'capitalize' as const }}>{row.platform||'—'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════ EMAIL ════ */}
          {tab==='email'&&(
            <div style={{ animation:'pageUp 0.3s ease both' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10, marginBottom:16 }}>
                <HeroStat icon={Ic.mail}  label="Emails sent" value={fmt(insights.email_sent||0)}   rawData={spark('email_sent')}   color="var(--success)"/>
                <HeroStat icon={Ic.eye}   label="Opens"       value={fmt(insights.email_opens||0)}  rawData={spark('email_opens')}  color="var(--cyan)"/>
                <HeroStat icon={Ic.click} label="Clicks"      value={fmt(insights.email_clicks||0)} rawData={spark('email_clicks')} color="var(--cyan)"/>
                <HeroStat icon={Ic.chart} label="Open rate"   value={pct(insights.email_opens||0,insights.email_sent||0)} color="var(--cyan)"/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                {[
                  {label:'Open rate',  pct:openRate,  color:'var(--cyan)',    sub:`${openRate.toFixed(1)}%`,  desc:'Industry avg: 21%',  good:openRate>21},
                  {label:'Click rate', pct:clickRate, color:'var(--cyan)', sub:`${clickRate.toFixed(1)}%`, desc:'Industry avg: 2.3%', good:clickRate>2.3},
                ].map(m=>(
                  <div key={m.label} className="card" style={{ display:'flex', alignItems:'center', gap:18 }}>
                    <div style={{ position:'relative', flexShrink:0 }}>
                      <Donut pct={Math.min(m.pct*2,100)} color={m.color} size={88}/>
                      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <div style={{ fontSize:15, fontWeight:700, color:'var(--text-1)', letterSpacing:'-0.03em' }}>{m.pct.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--text-1)', marginBottom:4 }}>{m.label}</div>
                      <div style={{ fontSize:12, color:m.color, fontWeight:600, marginBottom:4 }}>{m.sub} of sent</div>
                      <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:8 }}>{m.desc}</div>
                      <span className={`badge ${m.good?'badge-success':'badge-warning'}`}>{m.good?'↑ Above average':'→ Room to improve'}</span>
                    </div>
                  </div>
                ))}
              </div>
              {insights.email_sent===0&&(
                <div className="empty-state" style={{ padding:'40px 24px' }}>
                  <div className="empty-state-icon">{Ic.mail}</div>
                  <div className="empty-state-title">No email data yet</div>
                  <div className="empty-state-desc">Connect your email provider or start sending sequences via Automate.</div>
                </div>
              )}
            </div>
          )}

          {/* ════ PLATFORMS ════ */}
          {tab==='platforms'&&(
            <div style={{ animation:'pageUp 0.3s ease both' }}>
              {connPlats.length>0?(
                <>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                    <div className="card">
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--text-1)', marginBottom:18 }}>Impressions by platform</div>
                      {platBreak.map(p=><HBar key={p.platform} value={p.impressions} max={maxPlat} color={PC[p.platform]||'#888'} label={p.platform} sub={fmt(p.impressions)}/>)}
                    </div>
                    <div className="card">
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--text-1)', marginBottom:18 }}>Engagement by platform</div>
                      {platBreak.map(p=><HBar key={p.platform} value={p.engagement} max={Math.max(...platBreak.map(x=>x.engagement),1)} color={PC[p.platform]||'#888'} label={p.platform} sub={fmt(p.engagement)}/>)}
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:10 }}>
                    {platBreak.map(p=>{
                      const color=PC[p.platform]||'#888'
                      const platRaw=raw.filter(r=>r.platform===p.platform)
                      const engR=p.impressions>0?(p.engagement/p.impressions)*100:0
                      return (
                        <div key={p.platform} className="card" style={{ borderColor:`${color}22`, background:`${color}06` }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <div style={{ width:8, height:8, borderRadius:'50%', background:color, boxShadow:`0 0 6px ${color}` }}/>
                              <span style={{ fontSize:13, fontWeight:700, color:'var(--text-1)', textTransform:'capitalize' as const }}>{p.platform}</span>
                            </div>
                            {p.account&&<span style={{ fontSize:10, color:'var(--text-3)' }}>{p.account}</span>}
                          </div>
                          {platRaw.length>1&&<div style={{ marginBottom:12 }}><Sparkline data={platRaw.map(r=>r.impressions||0)} color={color} width={200} height={32}/></div>}
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:12 }}>
                            {[{l:'Impressions',v:fmt(p.impressions)},{l:'Engagements',v:fmt(p.engagement)},{l:'Followers',v:`+${fmt(p.followers)}`}].map(s=>(
                              <div key={s.l} style={{ padding:'8px', background:'rgba(0,0,0,0.22)', borderRadius:'var(--r-sm)', textAlign:'center' as const }}>
                                <div style={{ fontSize:15, fontWeight:700, color:'var(--text-1)', letterSpacing:'-0.03em', lineHeight:1 }}>{s.v}</div>
                                <div style={{ fontSize:9, color:'var(--text-3)', marginTop:2 }}>{s.l}</div>
                              </div>
                            ))}
                          </div>
                          <div>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                              <span style={{ fontSize:10, color:'var(--text-3)' }}>Engagement rate</span>
                              <span style={{ fontSize:10, fontWeight:700, color:'var(--text-2)' }}>{engR.toFixed(2)}%</span>
                            </div>
                            <div className="progress-track">
                              <div style={{ height:'100%', width:`${Math.min(engR*10,100)}%`, background:`linear-gradient(90deg,${color}88,${color})`, borderRadius:3, transition:'width 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}/>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              ):(
                <div className="empty-state" style={{ minHeight:'50vh' }}>
                  <div className="empty-state-icon">{Ic.chart}</div>
                  <div className="empty-state-title">No platforms connected yet</div>
                  <div className="empty-state-desc">Connect your social platforms to see per-platform analytics.</div>
                  <Link href="/dashboard/integrations" className="btn-primary" style={{ textDecoration:'none', display:'inline-flex', alignItems:'center', gap:7 }}>Connect platforms →</Link>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
