'use client'
import { useLang } from '@/lib/language-context'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Tab = 'overview'|'content'|'email'|'platforms'

const F_DEFAULT = "'Geist', -apple-system, sans-serif"
const F = F_DEFAULT
const MONO = "'Geist Mono', monospace"

const PC: Record<string,string> = {
  instagram:'#E1306C', linkedin:'#0A66C2', x:'#E7E7E7',
  tiktok:'#FF0050', email:'#00AAFF', general:'#666',
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
  arrow:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
}

const TABS_EN = [
  { id:'overview'  as Tab, label:'Overview'  },
  { id:'content'   as Tab, label:'Content'   },
  { id:'email'     as Tab, label:'Email'     },
  { id:'platforms' as Tab, label:'Platforms' },
]
const TABS_AR = [
  { id:'overview'  as Tab, label:'نظرة عامة' },
  { id:'content'   as Tab, label:'المحتوى'   },
  { id:'email'     as Tab, label:'الإيميل'   },
  { id:'platforms' as Tab, label:'المنصات'   },
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
  if (sorted.length < 2) return (
    <div style={{ height, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.20)', fontSize:'12px', fontFamily:F }}>
      Not enough data to plot
    </div>
  )
  const W=600, H=height, max=Math.max(...sorted.map(d=>d.value)), range=max||1
  const pts = sorted.map((d,i)=>({ x:(i/(sorted.length-1))*W, y:H-((d.value/range)*(H*0.85)), ...d }))
  const id = `ag${label.replace(/[^a-z0-9]/gi,'')}`
  return (
    <div style={{ position:'relative' }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display:'block', overflow:'visible' }}>
        <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.18"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
        {[0.25,0.5,0.75,1].map(r=><line key={r} x1="0" y1={H*(1-r*0.85)} x2={W} y2={H*(1-r*0.85)} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>)}
        <path d={`M 0,${H} L ${pts.map(p=>`${p.x},${p.y}`).join(' L ')} L ${W},${H} Z`} fill={`url(#${id})`}/>
        <path d={`M ${pts.map(p=>`${p.x},${p.y}`).join(' L ')}`} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.filter((_,i)=>i%Math.ceil(pts.length/6)===0||i===pts.length-1).map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="3" fill={color} opacity="0.7"/>)}
      </svg>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:'6px' }}>
        {[sorted[0], sorted[Math.floor(sorted.length/2)], sorted[sorted.length-1]].map((d,i)=>(
          <span key={i} style={{ fontSize:'9px', color:'rgba(255,255,255,0.25)', fontFamily:F }}>{d.date.slice(5)}</span>
        ))}
      </div>
    </div>
  )
}

function HBar({ value, max, color, label, sub }: { value:number; max:number; color:string; label:string; sub:string }) {
  const pct = max>0?(value/max)*100:0
  return (
    <div style={{ marginBottom:'14px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:color, flexShrink:0 }}/>
          <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.65)', fontWeight:500, textTransform:'capitalize' as const, fontFamily:F }}>{label}</span>
        </div>
        <div style={{ fontSize:'13px', fontWeight:700, color:'#FFFFFF', letterSpacing:'-0.02em', fontFamily:MONO }}>{sub}</div>
      </div>
      <div style={{ height:'3px', background:'rgba(255,255,255,0.06)', borderRadius:'100px', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:'100px', transition:'width 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}/>
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
        style={{ transition:'stroke-dasharray 1.3s cubic-bezier(0.34,1.56,0.64,1)' }}/>
    </svg>
  )
}

function StatCard({ icon, label, value, rawData, color, trend }: any) {
  const isPos=trend>0, isNeg=trend<0
  return (
    <div style={{ padding:'20px', background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px', position:'relative', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
          <div style={{ color:'rgba(255,255,255,0.30)', display:'flex' }}>{icon}</div>
          <span style={{ fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' as const, color:'rgba(0,170,255,0.70)', fontFamily:F }}>{label}</span>
        </div>
        {trend !== undefined && (
          <div style={{ display:'flex', alignItems:'center', gap:'3px', padding:'3px 7px', borderRadius:'100px', background:isPos?'rgba(34,197,94,0.08)':isNeg?'rgba(239,68,68,0.08)':'rgba(255,255,255,0.04)', border:`1px solid ${isPos?'rgba(34,197,94,0.18)':isNeg?'rgba(239,68,68,0.18)':'rgba(255,255,255,0.08)'}` }}>
            <span style={{ display:'flex', color:isPos?'#22C55E':isNeg?'#EF4444':'rgba(255,255,255,0.30)' }}>{isPos?Ic.up:isNeg?Ic.down:null}</span>
            <span style={{ fontSize:'11px', fontWeight:700, color:isPos?'#22C55E':isNeg?'#EF4444':'rgba(255,255,255,0.30)', fontFamily:MONO }}>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div style={{ fontSize:'28px', fontWeight:700, letterSpacing:'-0.04em', color:'#FFFFFF', lineHeight:1, marginBottom:'10px', fontFamily:MONO }}>{value}</div>
      {rawData && rawData.length>1 && <Sparkline data={rawData} color={color} width={100} height={28}/>}
    </div>
  )
}

export default function InsightsPage() {
  const supabase = createClient()
  const { isArabic } = useLang()
  const F = isArabic ? "'Tajawal', system-ui, sans-serif" : F_DEFAULT
  const TABS = isArabic ? TABS_AR : TABS_EN
  const [ws,         setWs]         = useState<any>(null)
  const [raw,        setRaw]        = useState<any[]>([])
  const [insights,   setInsights]   = useState<any>(null)
  const [loading,    setLoading]    = useState(true)
  const [period,     setPeriod]     = useState(30)
  const [tab,        setTab]        = useState<Tab>('overview')
  const [aiText,     setAiText]     = useState<string|null>(null)
  const [explaining, setExplaining] = useState(false)
  const [syncing,    setSyncing]    = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [connPlats,  setConnPlats]  = useState<any[]>([])
  const [mounted,    setMounted]    = useState(false)

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
      const d=await r.json(); setAiText(d.reply||'No insights available yet.')
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

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - var(--topbar-h))', flexDirection:'column', gap:'14px', background:'#0C0C0C', fontFamily:F }}>
      <div className="nexa-spinner" style={{ width:22, height:22 }}/>
      <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.25)', letterSpacing:'0.04em' }}>Loading</div>
    </div>
  )

  return (
    <div style={{ height:'calc(100vh - var(--topbar-h))', overflowY:'auto', background:'#0C0C0C', fontFamily:F }}>
      <style dangerouslySetInnerHTML={{ __html:`
        .ins-scroll::-webkit-scrollbar { display:none; }
        @keyframes insUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .i-in { animation: insUp 0.35s cubic-bezier(0.22,1,0.36,1) both; }
      `}}/>

      {/* ── GRADIENT HERO ── */}
      <div style={{ opacity:mounted?1:0, transition:'opacity 0.4s ease' }}>
        <div style={{ backgroundImage:'url(/cyan-header.png)', backgroundSize:'cover', backgroundPosition:'center top', padding:'40px 0 28px' }}>
          <div style={{ padding:'0 36px', display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:'20px' }}>
            <div>
              <h1 style={{ fontSize:'36px', fontWeight:700, letterSpacing:'-0.04em', color:'#0A0A0A', lineHeight:1, marginBottom:'8px' }}>{isArabic ? 'الإنسايتس' : 'Insights'}</h1>
              <div style={{ fontSize:'13px', color:'rgba(0,0,0,0.60)', fontWeight:500 }}>
                {connPlats.length>0 ? `${connPlats.length} platform${connPlats.length!==1?'s':''} connected · last ${period} days` : `Tracking last ${period} days`}
              </div>
            </div>
            {/* Controls */}
            <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
              <div style={{ display:'flex', background:'rgba(0,0,0,0.12)', border:'1px solid rgba(0,0,0,0.16)', borderRadius:'10px', padding:'3px', gap:'2px' }}>
                {[7,30,90].map(d => (
                  <button key={d} onClick={() => setPeriod(d)}
                    style={{ padding:'5px 13px', borderRadius:'7px', fontSize:'12px', fontWeight:period===d?600:400, background:period===d?'rgba(0,0,0,0.18)':'transparent', border:`1px solid ${period===d?'rgba(0,0,0,0.22)':'transparent'}`, color:period===d?'#0A0A0A':'rgba(0,0,0,0.50)', cursor:'pointer', fontFamily:F, transition:'all 0.15s' }}>
                    {d}d
                  </button>
                ))}
              </div>
              <button onClick={sync} disabled={syncing}
                style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 16px', background:'rgba(0,0,0,0.14)', border:'1px solid rgba(0,0,0,0.20)', borderRadius:'10px', fontSize:'12px', fontWeight:500, color:'rgba(0,0,0,0.70)', cursor:'pointer', fontFamily:F, transition:'all 0.15s' }}>
                {syncing ? <div className="nexa-spinner" style={{ width:12, height:12 }}/> : <span style={{ display:'flex' }}>{Ic.refresh}</span>}
                {syncing ? (isArabic?'يزامن...':'Syncing…') : (isArabic?'مزامنة':'Sync')}
              </button>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ background:'#141414', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ padding:'0 36px', display:'flex' }}>
            {TABS.map(t => {
              const active = tab === t.id
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{ display:'flex', alignItems:'center', padding:'12px 18px', background:'none', border:'none', borderBottom:`2px solid ${active ? '#00AAFF' : 'transparent'}`, marginBottom:'-1px', color: active ? '#FFFFFF' : 'rgba(255,255,255,0.42)', cursor:'pointer', fontFamily:F, fontSize:'13px', fontWeight: active ? 600 : 400, transition:'all 0.15s', whiteSpace:'nowrap' }}
                  onMouseEnter={e => { if(!active) (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.72)' }}
                  onMouseLeave={e => { if(!active) (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.42)' }}>
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ padding:'28px 36px 60px' }}>

        {/* Connect banner */}
        {showBanner && (
          <div style={{ padding:'12px 18px', background:'rgba(0,170,255,0.05)', border:'1px solid rgba(0,170,255,0.18)', borderRadius:'10px', fontSize:'13px', color:'rgba(255,255,255,0.65)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', marginBottom:'24px', fontFamily:F }}>
            <span>{isArabic?'وصّل منصة نشر لمزامنة بياناتك':'Connect a publishing platform to sync your analytics'}</span>
            <Link href="/dashboard/integrations" style={{ fontSize:'12px', color:'#00AAFF', textDecoration:'none', fontWeight:600, whiteSpace:'nowrap' as const }}>Connect platforms <span style={{ display:'inline-flex' }}>{Ic.arrow}</span></Link>
          </div>
        )}

        {/* No data */}
        {!insights && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'50vh', textAlign:'center', gap:'16px', fontFamily:F }}>
            <div style={{ width:52, height:52, borderRadius:'14px', background:'rgba(0,170,255,0.08)', border:'1px solid rgba(0,170,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(0,170,255,0.60)' }}>{Ic.chart}</div>
            <div style={{ fontSize:'16px', fontWeight:600, color:'rgba(255,255,255,0.70)', letterSpacing:'-0.02em' }}>{isArabic ? 'ما في بيانات لهذه الفترة' : 'No data yet for this period'}</div>
            <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.35)', lineHeight:1.7, maxWidth:'380px' }}>Connect your platforms and sync analytics. Nexa tracks impressions, engagement, follower growth, and email performance.</div>
            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={sync} style={{ display:'flex', alignItems:'center', gap:'7px', padding:'10px 20px', background:'#FFFFFF', border:'none', borderRadius:'10px', fontSize:'13px', fontWeight:600, color:'#0C0C0C', cursor:'pointer', fontFamily:F }}>
                <span style={{ display:'flex' }}>{Ic.refresh}</span>{isArabic?'زامن المنصات':'Sync platforms'}
              </button>
              <Link href="/dashboard/integrations" style={{ display:'flex', alignItems:'center', gap:'7px', padding:'10px 20px', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'10px', fontSize:'13px', fontWeight:500, color:'rgba(255,255,255,0.50)', textDecoration:'none', fontFamily:F }}>
                Connect platforms <span style={{ display:'inline-flex' }}>{Ic.arrow}</span>
              </Link>
            </div>
          </div>
        )}

        {insights && (
          <>
            {/* ════ OVERVIEW ════ */}
            {tab==='overview' && (
              <div className="i-in">
                {/* No platform data nudge */}
                {connPlats.length===0 && insights.posts_created===0 && (
                  <div style={{ marginBottom:'24px', padding:'20px 24px', background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px', textAlign:'center' }}>
                    <div style={{ fontSize:'14px', fontWeight:600, color:'rgba(255,255,255,0.70)', marginBottom:'6px', fontFamily:F }}>{isArabic?'ما في بيانات أداء بعد':'No performance data yet'}</div>
                    <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)', lineHeight:1.7, maxWidth:'340px', margin:'0 auto 16px', fontFamily:F }}>Connect your social platforms to track impressions, reach, and engagement in real time.</div>
                    <div style={{ display:'flex', gap:'8px', justifyContent:'center', flexWrap:'wrap' as const }}>
                      {[{id:'instagram',label:'Instagram'},{id:'linkedin',label:'LinkedIn'},{id:'x',label:'X'},{id:'tiktok',label:'TikTok'}].map(p=>(
                        <a key={p.id} href={`/api/oauth/${p.id}?workspace_id=${ws?.id||''}`}
                          style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'8px', fontSize:'12px', fontWeight:500, color:'rgba(255,255,255,0.55)', textDecoration:'none', fontFamily:F }}>
                          <div style={{ width:6, height:6, borderRadius:'50%', background:PC[p.id] }}/>{p.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stat grid — 3 col */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'16px' }}>
                  <StatCard icon={Ic.eye}   label={isArabic?"الإمبريشنز":"Impressions"}   value={fmt(insights.impressions)}         rawData={spark('impressions')}       color="#00AAFF" trend={insights?.trends?.impressions}/>
                  <StatCard icon={Ic.users} label={isArabic?"الوصول":"Reach"}         value={fmt(insights.reach)}               rawData={spark('reach')}             color="#00AAFF" trend={insights?.trends?.reach}/>
                  <StatCard icon={Ic.heart} label={isArabic?"التفاعل":"Engagements"}   value={fmt(insights.engagement)}          rawData={spark('engagement')}        color="#00AAFF" trend={insights?.trends?.engagement}/>
                  <StatCard icon={Ic.click} label={isArabic?"النقرات":"Link Clicks"}   value={fmt(insights.clicks)}              rawData={spark('clicks')}            color="#22C55E" trend={insights?.trends?.clicks}/>
                  <StatCard icon={Ic.chart} label={isArabic?"المنشورات":"Posts Created"} value={fmt(insights.posts_created||0)}    rawData={spark('posts_created')}     color="#00AAFF" trend={insights?.trends?.posts_created}/>
                  <StatCard icon={Ic.users} label={isArabic?"متابعون جدد":"New Followers"} value={fmt(insights.followers_gained||0)} rawData={spark('followers_gained')}  color="#00AAFF" trend={3}/>
                </div>

                {/* Impressions chart */}
                <div style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px', padding:'20px 24px', marginBottom:'12px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
                    <div>
                      <div style={{ fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(0,170,255,0.70)', marginBottom:'4px', fontFamily:F }}>{isArabic?'الإمبريشنز عبر الوقت':'Impressions over time'}</div>
                      <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.30)', fontFamily:F }}>Last {period} days</div>
                    </div>
                    <div style={{ fontSize:'24px', fontWeight:700, letterSpacing:'-0.04em', color:'#00AAFF', fontFamily:MONO }}>{fmt(insights.impressions)}</div>
                  </div>
                  <AreaChart data={series('impressions')} color="#00AAFF" height={120} label="impressions"/>
                </div>

                {/* Donut metrics */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px' }}>
                  {[
                    { label: isArabic?'نسبة التفاعل':'Engagement rate', pct:engRate, sub:`${engRate.toFixed(2)}% of reach`, desc: isArabic?'التفاعل ÷ الوصول':'Engagements ÷ reach' },
                    { label: isArabic?'نسبة النقر':'Click-through rate', pct:ctr, sub:`${ctr.toFixed(2)}% of impressions`, desc: isArabic?'النقرات ÷ الإمبريشنز':'Clicks ÷ impressions' },
                  ].map(m => (
                    <div key={m.label} style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px', padding:'20px', display:'flex', alignItems:'center', gap:'16px' }}>
                      <div style={{ position:'relative', flexShrink:0 }}>
                        <Donut pct={Math.min(m.pct,100)} color="#00AAFF" size={80}/>
                        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <div style={{ fontSize:'13px', fontWeight:700, color:'#FFFFFF', letterSpacing:'-0.02em', fontFamily:MONO }}>{m.pct.toFixed(1)}%</div>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(0,170,255,0.70)', marginBottom:'6px', fontFamily:F }}>{m.label}</div>
                        <div style={{ fontSize:'14px', fontWeight:600, color:'#FFFFFF', marginBottom:'3px', fontFamily:F }}>{m.sub}</div>
                        <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.30)', fontFamily:F }}>{m.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* AI analysis */}
                {aiText ? (
                  <div style={{ background:'#141414', border:'1px solid rgba(0,170,255,0.18)', borderLeft:'3px solid #00AAFF', borderRadius:'0 10px 10px 0', padding:'20px 24px' }}>
                    <div style={{ fontSize:'10px', fontWeight:600, color:'rgba(0,170,255,0.70)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'10px', fontFamily:F }}>{isArabic?'تحليل الذكاء':'AI Analysis'}</div>
                    <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.70)', lineHeight:1.75, fontFamily:F }}>{aiText}</div>
                  </div>
                ) : (
                  <button onClick={explain} disabled={explaining}
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', width:'100%', padding:'12px', background: explaining ? 'rgba(255,255,255,0.04)' : '#FFFFFF', border:'none', borderRadius:'10px', fontSize:'13px', fontWeight:600, color: explaining ? 'rgba(255,255,255,0.25)' : '#0C0C0C', cursor: explaining ? 'not-allowed' : 'pointer', fontFamily:F, transition:'background 0.15s' }}>
                    {explaining ? <><div className="nexa-spinner" style={{ width:12, height:12 }}/>{isArabic?'يقرأ أرقامك...':'Reading your numbers…'}</> : <><span style={{ display:'flex' }}>{Ic.bolt}</span>{isArabic?'ايش تعني هذه الأرقام؟':'What does this mean?'}</>}
                  </button>
                )}
              </div>
            )}

            {/* ════ CONTENT ════ */}
            {tab==='content' && (
              <div className="i-in">
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'16px' }}>
                  <StatCard icon={Ic.chart} label="Posts Created"    value={fmt(insights.posts_created||0)} rawData={spark('posts_created')} color="#00AAFF"/>
                  <StatCard icon={Ic.eye}   label={isArabic?"إجمالي الإمبريشنز":"Total Impressions"} value={fmt(insights.impressions)}      rawData={spark('impressions')}   color="#00AAFF"/>
                  <StatCard icon={Ic.heart} label={isArabic?"إجمالي التفاعل":"Total Engagements"} value={fmt(insights.engagement)}       rawData={spark('engagement')}    color="#00AAFF"/>
                  <StatCard icon={Ic.star}  label={isArabic?"متوسط لكل منشور":"Avg per Post"}      value={insights.posts_created>0?fmt(Math.round(insights.impressions/(insights.posts_created||1))):'—'} color="#22C55E"/>
                </div>
                <div style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px', padding:'20px 24px', marginBottom:'12px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
                    <div>
                      <div style={{ fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(0,170,255,0.70)', marginBottom:'4px', fontFamily:F }}>{isArabic?'التفاعل عبر الوقت':'Engagement over time'}</div>
                      <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.30)', fontFamily:F }}>Likes, comments, shares · last {period} days</div>
                    </div>
                    <div style={{ fontSize:'24px', fontWeight:700, letterSpacing:'-0.04em', color:'#00AAFF', fontFamily:MONO }}>{fmt(insights.engagement)}</div>
                  </div>
                  <AreaChart data={series('engagement')} color="#00AAFF" height={110} label="engagement"/>
                </div>
                {raw.length>0 && (
                  <div style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px', padding:'20px 24px' }}>
                    <div style={{ fontSize:'10px', fontWeight:600, color:'rgba(0,170,255,0.70)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'16px', fontFamily:F }}>Daily breakdown</div>
                    {raw.slice(-10).reverse().map((row,i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'9px 0', borderBottom: i<9 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                        <div style={{ width:6, height:6, borderRadius:'50%', background:PC[row.platform]||'rgba(255,255,255,0.20)', flexShrink:0 }}/>
                        <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.30)', width:'72px', flexShrink:0, fontFamily:F }}>{row.date?.slice(5)||'—'}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ height:'3px', background:'rgba(255,255,255,0.06)', borderRadius:'100px', overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${Math.min(100,(row.impressions||0)/Math.max(...raw.map((r:any)=>r.impressions||0),1)*100)}%`, background:PC[row.platform]||'rgba(255,255,255,0.20)', borderRadius:'100px' }}/>
                          </div>
                        </div>
                        <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.70)', fontWeight:600, minWidth:'55px', textAlign:'right', fontFamily:MONO }}>{fmt(row.impressions||0)}</div>
                        <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.30)', minWidth:'55px', textAlign:'right', fontFamily:F }}>{fmt(row.engagement||0)} eng</div>
                        <div style={{ fontSize:'10px', color:PC[row.platform]||'rgba(255,255,255,0.30)', fontWeight:600, minWidth:'60px', textAlign:'right', textTransform:'capitalize', fontFamily:F }}>{row.platform||'—'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ════ EMAIL ════ */}
            {tab==='email' && (
              <div className="i-in">
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'16px' }}>
                  <StatCard icon={Ic.mail}  label={isArabic?"الإيميلات المرسلة":"Emails Sent"} value={fmt(insights.email_sent||0)}   rawData={spark('email_sent')}   color="#22C55E"/>
                  <StatCard icon={Ic.eye}   label={isArabic?"المفتوحة":"Opens"}       value={fmt(insights.email_opens||0)}  rawData={spark('email_opens')}  color="#00AAFF"/>
                  <StatCard icon={Ic.click} label={isArabic?"النقرات":"Clicks"}      value={fmt(insights.email_clicks||0)} rawData={spark('email_clicks')} color="#00AAFF"/>
                  <StatCard icon={Ic.chart} label={isArabic?"نسبة الفتح":"Open Rate"}   value={pct(insights.email_opens||0,insights.email_sent||0)} color="#00AAFF"/>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px' }}>
                  {[
                    { label:'Open rate',  pct:openRate,  sub:`${openRate.toFixed(1)}%`,  desc:'Industry avg: 21%',  good:openRate>21  },
                    { label:'Click rate', pct:clickRate, sub:`${clickRate.toFixed(1)}%`, desc:'Industry avg: 2.3%', good:clickRate>2.3 },
                  ].map(m => (
                    <div key={m.label} style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px', padding:'20px', display:'flex', alignItems:'center', gap:'18px' }}>
                      <div style={{ position:'relative', flexShrink:0 }}>
                        <Donut pct={Math.min(m.pct*2,100)} color="#00AAFF" size={88}/>
                        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <div style={{ fontSize:'14px', fontWeight:700, color:'#FFFFFF', letterSpacing:'-0.02em', fontFamily:MONO }}>{m.pct.toFixed(1)}%</div>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(0,170,255,0.70)', marginBottom:'6px', fontFamily:F }}>{m.label}</div>
                        <div style={{ fontSize:'15px', fontWeight:600, color:'#FFFFFF', marginBottom:'4px', fontFamily:F }}>{m.sub} of sent</div>
                        <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.30)', marginBottom:'8px', fontFamily:F }}>{m.desc}</div>
                        <span style={{ fontSize:'10px', fontWeight:700, padding:'3px 8px', borderRadius:'4px', fontFamily:F, background:m.good?'rgba(34,197,94,0.08)':'rgba(245,158,11,0.08)', border:`1px solid ${m.good?'rgba(34,197,94,0.18)':'rgba(245,158,11,0.18)'}`, color:m.good?'#22C55E':'#F59E0B' }}>
                          {m.good ? '↑ Above average' : '→ Room to improve'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {insights.email_sent===0 && (
                  <div style={{ textAlign:'center', padding:'48px', color:'rgba(255,255,255,0.25)', fontSize:'13px', border:'1px dashed rgba(255,255,255,0.08)', borderRadius:'10px', fontFamily:F }}>
                    No email data yet. Start sending sequences via Automate.
                  </div>
                )}
              </div>
            )}

            {/* ════ PLATFORMS ════ */}
            {tab==='platforms' && (
              <div className="i-in">
                {connPlats.length>0 ? (
                  <>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>
                      <div style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px', padding:'20px 24px' }}>
                        <div style={{ fontSize:'10px', fontWeight:600, color:'rgba(0,170,255,0.70)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'18px', fontFamily:F }}>{isArabic?'الإمبريشنز حسب المنصة':'Impressions by Platform'}</div>
                        {platBreak.map(p => <HBar key={p.platform} value={p.impressions} max={maxPlat} color={PC[p.platform]||'#666'} label={p.platform} sub={fmt(p.impressions)}/>)}
                      </div>
                      <div style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px', padding:'20px 24px' }}>
                        <div style={{ fontSize:'10px', fontWeight:600, color:'rgba(0,170,255,0.70)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'18px', fontFamily:F }}>{isArabic?'التفاعل حسب المنصة':'Engagement by Platform'}</div>
                        {platBreak.map(p => <HBar key={p.platform} value={p.engagement} max={Math.max(...platBreak.map(x=>x.engagement),1)} color={PC[p.platform]||'#666'} label={p.platform} sub={fmt(p.engagement)}/>)}
                      </div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
                      {platBreak.map(p => {
                        const color=PC[p.platform]||'#666'
                        const platRaw=raw.filter(r=>r.platform===p.platform)
                        const engR=p.impressions>0?(p.engagement/p.impressions)*100:0
                        return (
                          <div key={p.platform} style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px', padding:'20px' }}>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                                <div style={{ width:8, height:8, borderRadius:'50%', background:color, flexShrink:0 }}/>
                                <span style={{ fontSize:'13px', fontWeight:600, color:'#FFFFFF', textTransform:'capitalize', fontFamily:F }}>{p.platform}</span>
                              </div>
                              {p.account && <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.28)', fontFamily:F }}>{p.account}</span>}
                            </div>
                            {platRaw.length>1 && <div style={{ marginBottom:'12px' }}><Sparkline data={platRaw.map(r=>r.impressions||0)} color={color} width={200} height={28}/></div>}
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'6px', marginBottom:'12px' }}>
                              {[{l:'Impressions',v:fmt(p.impressions)},{l:'Engagements',v:fmt(p.engagement)},{l:'Followers',v:`+${fmt(p.followers)}`}].map(s=>(
                                <div key={s.l} style={{ padding:'8px', background:'rgba(255,255,255,0.03)', borderRadius:'7px', textAlign:'center' as const }}>
                                  <div style={{ fontSize:'14px', fontWeight:700, color:'#FFFFFF', letterSpacing:'-0.02em', lineHeight:1, fontFamily:MONO }}>{s.v}</div>
                                  <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.28)', marginTop:'2px', fontFamily:F }}>{s.l}</div>
                                </div>
                              ))}
                            </div>
                            <div>
                              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
                                <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.30)', fontFamily:F }}>Engagement rate</span>
                                <span style={{ fontSize:'10px', fontWeight:600, color:'rgba(255,255,255,0.55)', fontFamily:MONO }}>{engR.toFixed(2)}%</span>
                              </div>
                              <div style={{ height:'3px', background:'rgba(255,255,255,0.06)', borderRadius:'100px', overflow:'hidden' }}>
                                <div style={{ height:'100%', width:`${Math.min(engR*10,100)}%`, background:color, borderRadius:'100px', transition:'width 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}/>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'50vh', textAlign:'center', gap:'16px', fontFamily:F }}>
                    <div style={{ width:52, height:52, borderRadius:'14px', background:'rgba(0,170,255,0.08)', border:'1px solid rgba(0,170,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(0,170,255,0.60)' }}>{Ic.chart}</div>
                    <div style={{ fontSize:'16px', fontWeight:600, color:'rgba(255,255,255,0.65)', fontFamily:F }}>{isArabic?'ما في منصات متصلة بعد':'No platforms connected yet'}</div>
                    <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.35)', fontFamily:F }}>Connect your social platforms to see per-platform analytics.</div>
                    <Link href="/dashboard/integrations" style={{ padding:'10px 22px', background:'#FFFFFF', borderRadius:'10px', fontSize:'13px', fontWeight:600, color:'#0C0C0C', textDecoration:'none', fontFamily:F }}>
                      Connect platforms
                    </Link>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
