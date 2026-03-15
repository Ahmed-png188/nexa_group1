'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type TabId = 'overview' | 'pillars' | 'angles' | 'plan' | 'timing' | 'competitors'

const Ic = {
  bolt:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  refresh: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  arrow:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  clock:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  target:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  star:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  users:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  chart:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18"/><path d="M5 20V14l4-4 4 3 4-6 4 4v9"/></svg>,
  cal:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
}

const TABS: { id: TabId; label: string; color: string }[] = [
  { id:'overview',    label:'Overview',    color:'#4D9FFF' },
  { id:'pillars',     label:'Pillars',     color:'#A78BFA' },
  { id:'angles',      label:'Angles',      color:'#FF7A40' },
  { id:'plan',        label:'30-Day Plan', color:'#34D399' },
  { id:'timing',      label:'Timing',      color:'#FFB547' },
  { id:'competitors', label:'Competitors', color:'#FF5757' },
]

const PILLAR_COLORS = ['#4D9FFF','#A78BFA','#34D399','#FF7A40','#FFB547','#FF5757','#38BFFF','#F472B6']

function SectionTitle({ children }: any) {
  return <div style={{ fontSize:9,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'rgba(255,255,255,0.25)',marginBottom:10 }}>{children}</div>
}

function InfoCard({ label, value, accent='#4D9FFF' }: any) {
  if (!value) return null
  return (
    <div style={{ padding:'14px 16px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,borderLeft:`2px solid ${accent}66` }}>
      <div style={{ fontSize:9,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',color:'rgba(255,255,255,0.28)',marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:12.5,color:'rgba(255,255,255,0.65)',lineHeight:1.65 }}>{value}</div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <div style={{ display:'flex',alignItems:'center',gap:10,padding:'12px 16px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12 }}>
      <div style={{ width:32,height:32,borderRadius:9,background:`${color}14`,border:`1px solid ${color}28`,display:'flex',alignItems:'center',justifyContent:'center',color,flexShrink:0 }}>{icon}</div>
      <div>
        <div style={{ fontFamily:'var(--display)',fontSize:20,fontWeight:800,letterSpacing:'-0.04em',color:'rgba(255,255,255,0.88)',lineHeight:1 }}>{value}</div>
        <div style={{ fontSize:10,color:'rgba(255,255,255,0.3)',marginTop:3,fontWeight:500 }}>{label}</div>
      </div>
    </div>
  )
}

function EmptyState({ icon, title, desc, btnLabel, btnColor, onAction, loading }: any) {
  return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'52vh',textAlign:'center',padding:'40px 20px' }}>
      <div style={{ width:58,height:58,borderRadius:16,background:`${btnColor}09`,border:`1px solid ${btnColor}20`,display:'flex',alignItems:'center',justifyContent:'center',color:btnColor,marginBottom:20 }}>{icon}</div>
      <h3 style={{ fontFamily:'var(--display)',fontSize:18,fontWeight:800,letterSpacing:'-0.03em',marginBottom:8,color:'rgba(255,255,255,0.88)' }}>{title}</h3>
      <p style={{ fontSize:13,color:'rgba(255,255,255,0.35)',lineHeight:1.7,maxWidth:420,marginBottom:24 }}>{desc}</p>
      <button onClick={onAction} disabled={loading}
        style={{ display:'flex',alignItems:'center',gap:8,padding:'12px 24px',fontSize:13,fontWeight:700,background:loading?'rgba(255,255,255,0.04)':btnColor,color:loading?'rgba(255,255,255,0.3)':btnColor==='#FF5757'?'#fff':'#000',border:'none',borderRadius:10,cursor:'pointer',fontFamily:'var(--sans)',transition:'all .2s',boxShadow:loading?'none':`0 4px 16px ${btnColor}40`,letterSpacing:'-0.01em' }}>
        {loading
          ? <><div style={{ width:13,height:13,border:'2px solid rgba(255,255,255,0.2)',borderTopColor:'rgba(255,255,255,0.6)',borderRadius:'50%',animation:'stratSpin .8s linear infinite' }}/>Working…</>
          : <><span style={{ display:'flex' }}>{Ic.bolt}</span>{btnLabel}</>}
      </button>
    </div>
  )
}

export default function StrategyPage() {
  const supabase = createClient()
  const [ws,             setWs]           = useState<any>(null)
  const [strategy,       setStrategy]     = useState<any>(null)
  const [generating,     setGenerating]   = useState(false)
  const [loading,        setLoading]      = useState(true)
  const [tab,            setTab]          = useState<TabId>('overview')
  const [timingData,     setTimingData]   = useState<any>(null)
  const [genTiming,      setGenTiming]    = useState(false)
  const [compData,       setCompData]     = useState<any>(null)
  const [genComp,        setGenComp]      = useState(false)
  const [compInput,      setCompInput]    = useState('')
  const [expandedDay,    setExpandedDay]  = useState<number|null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return
    const { data:m } = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id',user.id).limit(1).single()
    const w = (m as any)?.workspaces
    setWs(w); setCompInput(w?.brand_tone||'')
    const { data:plan } = await supabase.from('strategy_plans').select('*').eq('workspace_id',w?.id).eq('status','active').order('generated_at',{ascending:false}).limit(1).single()
    if (plan) {
      setStrategy({ audience_psychology:plan.audience_map, content_pillars:plan.content_pillars, top_performing_angles:plan.insights?.top_angles, month_one_plan:plan.daily_plan, key_insights:plan.insights?.key_insights, weekly_schedule:plan.platform_strategy })
      if (plan.platform_strategy?.timing) setTimingData(plan.platform_strategy.timing)
    }
    setLoading(false)
  }

  async function generateStrategy() {
    if (!ws||generating) return
    setGenerating(true)
    try { const r=await fetch('/api/generate-strategy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspace_id:ws.id})}); const d=await r.json(); if(d.success)setStrategy(d.strategy) } catch {}
    setGenerating(false)
  }
  async function generateTiming() {
    if (!ws||genTiming) return; setGenTiming(true)
    try { const r=await fetch('/api/strategy-timing',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspace_id:ws.id})}); const d=await r.json(); if(d.success)setTimingData(d.timing) } catch {}
    setGenTiming(false)
  }
  async function generateComp() {
    if (!ws||genComp) return; setGenComp(true)
    try { const r=await fetch('/api/competitor-analysis',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspace_id:ws.id,competitors:compInput})}); const d=await r.json(); if(d.success)setCompData(d.analysis) } catch {}
    setGenComp(false)
  }

  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'rgba(255,255,255,0.3)',fontSize:13 }}>Loading strategy…</div>

  if (!strategy && !generating) return (
    <div style={{ padding:'24px 28px',overflowY:'auto',height:'calc(100vh - var(--topbar-h))' }}>
      <style>{`@keyframes stratSpin{to{transform:rotate(360deg)}}@keyframes stratUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <EmptyState icon={Ic.star} title="Build your content strategy" desc="Nexa analyzes your brand and builds a complete strategy — audience psychology, content pillars, top angles, 30-day plan, optimal timing, and competitive intelligence." btnLabel="Build my strategy" btnColor="#4D9FFF" onAction={generateStrategy} loading={generating}/>
    </div>
  )

  if (generating) return (
    <div style={{ padding:'24px 28px',overflowY:'auto',height:'calc(100vh - var(--topbar-h))' }}>
      <style>{`@keyframes stratSpin{to{transform:rotate(360deg)}}@keyframes stratUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <EmptyState icon={Ic.star} title="Building your strategy…" desc="Analyzing your brand, audience, and content patterns. This takes about 30 seconds." btnLabel="Building…" btnColor="#4D9FFF" onAction={()=>{}} loading={true}/>
    </div>
  )

  const aud     = strategy?.audience_psychology ?? {}
  const pillars = strategy?.content_pillars ?? []
  const angles  = strategy?.top_performing_angles ?? []
  const plan    = strategy?.month_one_plan ?? []
  const insights= strategy?.key_insights ?? []

  const pillarsArr = Array.isArray(pillars)?pillars:Object.entries(pillars).map(([k,v]:any)=>({name:k,description:String(v)}))
  const anglesArr  = Array.isArray(angles)?angles:Object.entries(angles).map(([k,v]:any)=>({title:k,why:String(v)}))
  const planArr    = Array.isArray(plan)?plan:[]

  const activeColor = TABS.find(t=>t.id===tab)?.color??'#4D9FFF'

  return (
    <>
      <style>{`
        @keyframes stratSpin{to{transform:rotate(360deg)}}
        @keyframes stratUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .stab:hover{background:rgba(255,255,255,0.05)!important;}
        .s-card:hover{border-color:rgba(255,255,255,0.13)!important;background:rgba(255,255,255,0.05)!important;}
        .day-cell:hover{border-color:rgba(255,255,255,0.14)!important;background:rgba(255,255,255,0.05)!important;}
      `}</style>

      <div style={{ padding:'24px 28px',overflowY:'auto',height:'calc(100vh - var(--topbar-h))' }}>

        {/* Header */}
        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:20,animation:'stratUp .4s ease both' }}>
          <div>
            <h1 style={{ fontFamily:'var(--display)',fontSize:22,fontWeight:800,letterSpacing:'-0.04em',color:'rgba(255,255,255,0.92)',lineHeight:1,marginBottom:4 }}>Strategy</h1>
            <p style={{ fontSize:12,color:'rgba(255,255,255,0.3)' }}>Your AI-powered content intelligence</p>
          </div>
          <button onClick={generateStrategy} disabled={generating}
            style={{ display:'flex',alignItems:'center',gap:6,padding:'7px 14px',fontSize:12,fontWeight:600,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.45)',borderRadius:9,cursor:'pointer',fontFamily:'var(--sans)',transition:'all .15s' }}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.18)';(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.8)'}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.1)';(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.45)'}}>
            <span style={{ display:'flex' }}>{Ic.refresh}</span>Regenerate
          </button>
        </div>

        {/* Stat bar */}
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(170px,1fr))',gap:8,marginBottom:20,animation:'stratUp .4s ease .05s both' }}>
          <StatCard icon={Ic.users} label="Audience insights" value={Object.keys(aud).length||'—'} color="#4D9FFF"/>
          <StatCard icon={Ic.star}  label="Content pillars"   value={pillarsArr.length||'—'}        color="#A78BFA"/>
          <StatCard icon={Ic.bolt}  label="Winning angles"    value={anglesArr.length||'—'}         color="#FF7A40"/>
          <StatCard icon={Ic.cal}   label="Days planned"      value={planArr.length||'—'}           color="#34D399"/>
        </div>

        {/* Tab bar */}
        <div style={{ display:'flex',gap:2,marginBottom:22,background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:4,animation:'stratUp .4s ease .1s both' }}>
          {TABS.map(t=>{
            const on = tab===t.id
            return (
              <button key={t.id} className="stab" onClick={()=>setTab(t.id)}
                style={{ flex:1,padding:'8px 4px',borderRadius:9,border:`1px solid ${on?`${t.color}28`:'transparent'}`,background:on?`${t.color}10`:'transparent',color:on?t.color:'rgba(255,255,255,0.32)',cursor:'pointer',fontSize:11.5,fontWeight:on?700:500,fontFamily:'var(--sans)',transition:'all .15s',whiteSpace:'nowrap' }}>
                {t.label}
              </button>
            )
          })}
        </div>

        {/* ── OVERVIEW ── */}
        {tab==='overview' && (
          <div style={{ animation:'stratUp .3s ease both' }}>
            {insights.length>0 && (
              <div style={{ padding:'16px 18px',background:`rgba(77,159,255,0.06)`,border:'1px solid rgba(77,159,255,0.18)',borderRadius:13,marginBottom:14,boxShadow:'0 0 32px rgba(77,159,255,0.05)' }}>
                <div style={{ display:'flex',alignItems:'center',gap:7,marginBottom:10 }}>
                  <div style={{ width:5,height:5,borderRadius:'50%',background:'#4D9FFF',boxShadow:'0 0 7px #4D9FFF' }}/>
                  <span style={{ fontSize:9,fontWeight:700,color:'#4D9FFF',letterSpacing:'.09em',textTransform:'uppercase' }}>Key Insights</span>
                </div>
                {insights.map((ins:string,i:number)=>(
                  <div key={i} style={{ display:'flex',gap:9,fontSize:12.5,color:'rgba(255,255,255,0.65)',lineHeight:1.65,marginBottom:7 }}>
                    <span style={{ color:'#4D9FFF',flexShrink:0,marginTop:3,display:'flex' }}>{Ic.arrow}</span>{ins}
                  </div>
                ))}
              </div>
            )}
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(270px,1fr))',gap:10 }}>
              {Object.entries(aud).slice(0,6).map(([k,v]:any)=>(
                <InfoCard key={k} label={k.replace(/_/g,' ')} value={typeof v==='string'?v:Array.isArray(v)?v.join(', '):JSON.stringify(v)} accent="#4D9FFF"/>
              ))}
            </div>
          </div>
        )}

        {/* ── PILLARS ── */}
        {tab==='pillars' && (
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(250px,1fr))',gap:10,animation:'stratUp .3s ease both' }}>
            {pillarsArr.length>0 ? pillarsArr.map((p:any,i:number)=>{
              const name   = typeof p==='string'?p:(p.name||p.pillar||`Pillar ${i+1}`)
              const desc   = typeof p==='string'?'':(p.description||p.purpose||'')
              const topics = p.topics||[]
              const color  = PILLAR_COLORS[i%PILLAR_COLORS.length]
              return (
                <div key={i} className="s-card" style={{ padding:'18px 20px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,transition:'all .15s' }}>
                  <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:11 }}>
                    <div style={{ width:30,height:30,borderRadius:9,background:`${color}14`,border:`1px solid ${color}28`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--display)',fontSize:12,fontWeight:800,color,flexShrink:0 }}>{i+1}</div>
                    <span style={{ fontSize:14,fontWeight:700,color:'rgba(255,255,255,0.88)',letterSpacing:'-0.02em' }}>{name}</span>
                  </div>
                  {desc && <p style={{ fontSize:12.5,color:'rgba(255,255,255,0.42)',lineHeight:1.65,marginBottom:topics.length?12:0 }}>{desc}</p>}
                  {topics.length>0 && (
                    <div style={{ display:'flex',flexWrap:'wrap',gap:5 }}>
                      {topics.slice(0,4).map((t:string,j:number)=>(
                        <span key={j} style={{ fontSize:10,padding:'2px 9px',borderRadius:100,background:`${color}10`,border:`1px solid ${color}22`,color:`${color}cc` }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              )
            }) : <div style={{ gridColumn:'1/-1',textAlign:'center',padding:'40px',color:'rgba(255,255,255,0.25)',fontSize:13 }}>No pillars yet. Regenerate your strategy.</div>}
          </div>
        )}

        {/* ── ANGLES ── */}
        {tab==='angles' && (
          <div style={{ display:'flex',flexDirection:'column',gap:10,animation:'stratUp .3s ease both' }}>
            {anglesArr.length>0 ? anglesArr.map((a:any,i:number)=>{
              const title = typeof a==='string'?a:(a.title||a.angle||`Angle ${i+1}`)
              const hook  = a.hook||''
              const why   = a.why||a.description||''
              return (
                <div key={i} className="s-card" style={{ padding:'18px 20px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,transition:'all .15s' }}>
                  <div style={{ display:'flex',alignItems:'flex-start',gap:11,marginBottom:(hook||why)?12:0 }}>
                    <div style={{ width:24,height:24,borderRadius:7,background:'rgba(255,122,64,0.1)',border:'1px solid rgba(255,122,64,0.22)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:'#FF7A40',flexShrink:0,fontFamily:'var(--display)',marginTop:1 }}>{i+1}</div>
                    <span style={{ fontSize:14,fontWeight:700,color:'rgba(255,255,255,0.88)',letterSpacing:'-0.02em',lineHeight:1.4 }}>{title}</span>
                  </div>
                  {hook && <p style={{ fontSize:13,color:'#FF7A40',fontStyle:'italic',lineHeight:1.65,paddingLeft:35,marginBottom:why?8:0,opacity:0.85 }}>"{hook}"</p>}
                  {why  && <p style={{ fontSize:12.5,color:'rgba(255,255,255,0.38)',lineHeight:1.65,paddingLeft:35 }}>{why}</p>}
                </div>
              )
            }) : <div style={{ textAlign:'center',padding:'40px',color:'rgba(255,255,255,0.25)',fontSize:13 }}>No angles yet. Regenerate your strategy.</div>}
          </div>
        )}

        {/* ── 30-DAY PLAN ── */}
        {tab==='plan' && (
          <div style={{ animation:'stratUp .3s ease both' }}>
            {planArr.length>0 ? (
              <>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(88px,1fr))',gap:6,marginBottom:14 }}>
                  {planArr.map((day:any,i:number)=>{
                    const num   = day.day||i+1
                    const theme = day.theme||day.topic||''
                    const plat  = day.platform||''
                    const open  = expandedDay===num
                    const wkCol = PILLAR_COLORS[Math.floor(i/7)%PILLAR_COLORS.length]
                    return (
                      <div key={i} className="day-cell" onClick={()=>setExpandedDay(open?null:num)}
                        style={{ padding:'10px',background:open?`${wkCol}0d`:'rgba(255,255,255,0.03)',border:`1px solid ${open?`${wkCol}30`:'rgba(255,255,255,0.07)'}`,borderRadius:10,cursor:'pointer',transition:'all .15s' }}>
                        <div style={{ fontFamily:'var(--display)',fontSize:15,fontWeight:800,color:open?wkCol:'rgba(255,255,255,0.55)',lineHeight:1,marginBottom:5,letterSpacing:'-0.03em' }}>{String(num).padStart(2,'0')}</div>
                        {plat && <div style={{ fontSize:9,fontWeight:700,color:open?wkCol:'rgba(255,255,255,0.22)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:3 }}>{plat.slice(0,3)}</div>}
                        <div style={{ fontSize:10,color:'rgba(255,255,255,0.35)',lineHeight:1.4,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' as const }}>{theme}</div>
                      </div>
                    )
                  })}
                </div>
                {expandedDay!==null && (()=>{
                  const day = planArr.find((d:any)=>(d.day||(planArr.indexOf(d)+1))===expandedDay)
                  if (!day) return null
                  const col = PILLAR_COLORS[Math.floor((expandedDay-1)/7)%PILLAR_COLORS.length]
                  return (
                    <div style={{ padding:'18px 20px',background:`${col}08`,border:`1px solid ${col}22`,borderRadius:14,animation:'stratUp .2s ease both' }}>
                      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14 }}>
                        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                          <span style={{ fontFamily:'var(--display)',fontSize:26,fontWeight:800,color:col,letterSpacing:'-0.04em',lineHeight:1 }}>Day {String(expandedDay).padStart(2,'0')}</span>
                          {day.platform && <span style={{ fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:100,background:`${col}14`,border:`1px solid ${col}28`,color:col }}>{day.platform}</span>}
                        </div>
                        <button onClick={()=>setExpandedDay(null)} style={{ background:'none',border:'none',color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:16 }}>✕</button>
                      </div>
                      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
                        {day.theme && <InfoCard label="Theme" value={day.theme} accent={col}/>}
                        {(day.content||day.description) && <InfoCard label="Content" value={day.content||day.description} accent={col}/>}
                      </div>
                    </div>
                  )
                })()}
              </>
            ) : <div style={{ textAlign:'center',padding:'48px',color:'rgba(255,255,255,0.25)',fontSize:13 }}>No plan yet. Regenerate your strategy.</div>}
          </div>
        )}

        {/* ── TIMING ── */}
        {tab==='timing' && (
          <div style={{ animation:'stratUp .3s ease both' }}>
            {!timingData
              ? <EmptyState icon={Ic.clock} title="Timing Engine" desc="Nexa analyzes your audience's psychology, daily routines, and behavior patterns to find the exact moments they're most receptive to your content." btnLabel="Generate timing analysis" btnColor="#FFB547" onAction={generateTiming} loading={genTiming}/>
              : (
                <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
                  {timingData.analysis && (
                    <div style={{ padding:'16px 18px',background:'rgba(255,181,71,0.06)',border:'1px solid rgba(255,181,71,0.18)',borderRadius:12 }}>
                      <SectionTitle>Why these times work</SectionTitle>
                      <div style={{ fontSize:13,color:'rgba(255,255,255,0.62)',lineHeight:1.7 }}>{timingData.analysis}</div>
                    </div>
                  )}
                  {timingData.platforms && (
                    <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(250px,1fr))',gap:10 }}>
                      {Object.entries(timingData.platforms).map(([pl,data]:any)=>(
                        <div key={pl} style={{ padding:'16px 18px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12 }}>
                          <div style={{ fontSize:12,fontWeight:700,color:'rgba(255,255,255,0.82)',marginBottom:10,textTransform:'capitalize' }}>{pl}</div>
                          {data.best_times?.map((s:any,i:number)=>(
                            <div key={i} style={{ display:'flex',gap:10,padding:'8px 10px',background:'rgba(0,0,0,0.2)',borderRadius:8,marginBottom:6 }}>
                              <div><div style={{ fontSize:12,fontWeight:700,color:'#FFB547' }}>{s.time}</div><div style={{ fontSize:10,color:'rgba(255,255,255,0.28)' }}>{s.day_type}</div></div>
                              <div style={{ fontSize:11,color:'rgba(255,255,255,0.42)',lineHeight:1.5,flex:1 }}>{s.reason}</div>
                            </div>
                          ))}
                          {data.frequency && <div style={{ fontSize:11,color:'rgba(255,255,255,0.32)',marginTop:6 }}>{data.frequency}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={generateTiming} style={{ alignSelf:'flex-start',display:'flex',alignItems:'center',gap:6,padding:'7px 14px',fontSize:12,fontWeight:600,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.45)',borderRadius:8,cursor:'pointer',fontFamily:'var(--sans)' }}>
                    <span style={{ display:'flex' }}>{Ic.refresh}</span>Regenerate
                  </button>
                </div>
              )
            }
          </div>
        )}

        {/* ── COMPETITORS ── */}
        {tab==='competitors' && (
          <div style={{ animation:'stratUp .3s ease both' }}>
            {!compData ? (
              <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'52vh',textAlign:'center',padding:'40px 20px' }}>
                <div style={{ width:58,height:58,borderRadius:16,background:'rgba(255,87,87,0.08)',border:'1px solid rgba(255,87,87,0.18)',display:'flex',alignItems:'center',justifyContent:'center',color:'#FF5757',marginBottom:20 }}>{Ic.target}</div>
                <h3 style={{ fontFamily:'var(--display)',fontSize:18,fontWeight:800,letterSpacing:'-0.03em',marginBottom:8,color:'rgba(255,255,255,0.88)' }}>Competitor Intelligence</h3>
                <p style={{ fontSize:13,color:'rgba(255,255,255,0.35)',lineHeight:1.7,maxWidth:420,marginBottom:18 }}>Nexa analyzes your competitive landscape to find white space, winning angles, and differentiation strategies your competitors are ignoring.</p>
                <div style={{ width:'100%',maxWidth:440,marginBottom:20,textAlign:'left' }}>
                  <div style={{ fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.32)',marginBottom:7 }}>Who are your competitors? <span style={{ fontWeight:400,color:'rgba(255,255,255,0.2)' }}>(optional)</span></div>
                  <textarea value={compInput} onChange={e=>setCompInput(e.target.value)} rows={3}
                    placeholder="e.g. Buffer, Hootsuite — or describe your space"
                    style={{ width:'100%',padding:'11px 13px',fontSize:13,fontFamily:'var(--sans)',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'rgba(255,255,255,0.8)',outline:'none',resize:'vertical',transition:'border-color .15s' }}
                    onFocus={e=>e.target.style.borderColor='rgba(255,87,87,0.3)'}
                    onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
                </div>
                <button onClick={generateComp} disabled={genComp}
                  style={{ display:'flex',alignItems:'center',gap:8,padding:'12px 24px',fontSize:13,fontWeight:700,background:genComp?'rgba(255,255,255,0.04)':'#FF5757',color:genComp?'rgba(255,255,255,0.3)':'#fff',border:'none',borderRadius:10,cursor:'pointer',fontFamily:'var(--sans)',transition:'all .2s',boxShadow:genComp?'none':'0 4px 16px rgba(255,87,87,0.3)' }}>
                  {genComp?<><div style={{ width:13,height:13,border:'2px solid rgba(255,255,255,0.2)',borderTopColor:'rgba(255,255,255,0.6)',borderRadius:'50%',animation:'stratSpin .8s linear infinite' }}/>Analyzing…</>:<><span style={{ display:'flex' }}>{Ic.target}</span>Run competitor analysis</>}
                </button>
              </div>
            ) : (
              <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
                {compData.market_position && (
                  <div style={{ padding:'16px 18px',background:'rgba(255,87,87,0.05)',border:'1px solid rgba(255,87,87,0.15)',borderRadius:13 }}>
                    <SectionTitle>Your market position</SectionTitle>
                    <div style={{ fontSize:13,color:'rgba(255,255,255,0.65)',lineHeight:1.7 }}>{compData.market_position}</div>
                  </div>
                )}
                {compData.differentiation_strategy?.positioning_statement && (
                  <div style={{ padding:'18px 20px',background:'linear-gradient(135deg,rgba(255,87,87,0.07),rgba(255,122,64,0.05))',border:'1px solid rgba(255,87,87,0.18)',borderRadius:14 }}>
                    <SectionTitle>⚡ Your positioning statement</SectionTitle>
                    <div style={{ fontSize:16,fontWeight:700,color:'rgba(255,255,255,0.9)',lineHeight:1.55,fontFamily:'var(--display)',letterSpacing:'-0.02em' }}>"{compData.differentiation_strategy.positioning_statement}"</div>
                  </div>
                )}
                {compData.white_space?.length>0 && (
                  <div>
                    <SectionTitle>White space opportunities</SectionTitle>
                    <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))',gap:10,marginTop:10 }}>
                      {compData.white_space.map((w:any,i:number)=>(
                        <div key={i} className="s-card" style={{ padding:'16px 18px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,transition:'all .15s' }}>
                          <div style={{ fontSize:13,fontWeight:700,color:'rgba(255,255,255,0.85)',marginBottom:6 }}>{w.opportunity}</div>
                          <div style={{ fontSize:11.5,color:'rgba(255,255,255,0.35)',marginBottom:8 }}>{w.why_nobody_owns_it}</div>
                          <div style={{ fontSize:12,color:'#FF5757',fontWeight:600 }}>→ {w.how_to_claim_it}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {compData.winning_angles?.length>0 && (
                  <div>
                    <SectionTitle>Winning angles competitors miss</SectionTitle>
                    <div style={{ display:'flex',flexDirection:'column',gap:8,marginTop:10 }}>
                      {compData.winning_angles.map((a:any,i:number)=>(
                        <div key={i} className="s-card" style={{ padding:'16px 18px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,transition:'all .15s' }}>
                          <div style={{ fontSize:13,fontWeight:700,color:'rgba(255,255,255,0.85)',marginBottom:6 }}>{a.angle}</div>
                          <div style={{ fontSize:13,color:'#FF7A40',fontStyle:'italic',marginBottom:6 }}>"{a.example_hook}"</div>
                          <div style={{ fontSize:11.5,color:'rgba(255,255,255,0.38)' }}>{a.why_it_wins}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {compData.competitors?.length>0 && (
                  <div>
                    <SectionTitle>Competitor breakdown</SectionTitle>
                    <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(230px,1fr))',gap:10,marginTop:10 }}>
                      {compData.competitors.map((c:any,i:number)=>(
                        <div key={i} className="s-card" style={{ padding:'16px 18px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,transition:'all .15s' }}>
                          <div style={{ fontSize:14,fontWeight:700,color:'rgba(255,255,255,0.85)',marginBottom:10 }}>{c.name}</div>
                          {c.strengths?.length>0 && <><div style={{ fontSize:9,fontWeight:700,color:'#34D399',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:4 }}>Strengths</div>{c.strengths.slice(0,2).map((s:string,j:number)=><div key={j} style={{ fontSize:11,color:'rgba(255,255,255,0.45)',marginBottom:3 }}>+ {s}</div>)}</>}
                          {c.weaknesses?.length>0 && <><div style={{ fontSize:9,fontWeight:700,color:'#FF5757',textTransform:'uppercase',letterSpacing:'.06em',marginTop:8,marginBottom:4 }}>Weaknesses</div>{c.weaknesses.slice(0,2).map((w:string,j:number)=><div key={j} style={{ fontSize:11,color:'rgba(255,255,255,0.45)',marginBottom:3 }}>− {w}</div>)}</>}
                          {c.differentiation_opportunity && <div style={{ marginTop:8,padding:'8px 10px',background:'rgba(255,87,87,0.06)',border:'1px solid rgba(255,87,87,0.15)',borderRadius:8,fontSize:11,color:'#FF5757',lineHeight:1.5 }}>Your edge: {c.differentiation_opportunity}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={generateComp} style={{ alignSelf:'flex-start',display:'flex',alignItems:'center',gap:6,padding:'7px 14px',fontSize:12,fontWeight:600,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.45)',borderRadius:8,cursor:'pointer',fontFamily:'var(--sans)' }}>
                  <span style={{ display:'flex' }}>{Ic.refresh}</span>Re-analyze
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </>
  )
}
