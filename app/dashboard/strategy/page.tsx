'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Tab = 'overview'|'pillars'|'angles'|'plan'|'timing'|'competitors'

const Ic = {
  bolt:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  refresh: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  arrow:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  users:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  star:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  chart:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18"/><path d="M5 20V14l4-4 4 3 4-6 4 4v9"/></svg>,
  cal:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  clock:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  target:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  close:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
}

const TABS: { id: Tab; label: string; color: string }[] = [
  { id:'overview',    label:'Overview',    color:'#4D9FFF' },
  { id:'pillars',     label:'Pillars',     color:'#A78BFA' },
  { id:'angles',      label:'Angles',      color:'#FF7A40' },
  { id:'plan',        label:'30-Day Plan', color:'#34D399' },
  { id:'timing',      label:'Timing',      color:'#FFB547' },
  { id:'competitors', label:'Competitors', color:'#FF5757' },
]

const PILLAR_COLORS = ['#4D9FFF','#A78BFA','#34D399','#FF7A40','#FFB547','#FF5757','#38BFFF','#F472B6']

/* ─── Atoms ─── */
function SLabel({ children }: any) {
  return <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase', color:'rgba(255,255,255,0.25)', marginBottom:10 }}>{children}</div>
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <div style={{ padding:'14px 18px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, display:'flex', alignItems:'center', gap:12 }}>
      <div style={{ width:34, height:34, borderRadius:10, background:`${color}12`, border:`1px solid ${color}25`, display:'flex', alignItems:'center', justifyContent:'center', color, flexShrink:0 }}>{icon}</div>
      <div>
        <div className="nexa-num" style={{ fontSize:28, fontFamily:'var(--mono)', fontWeight:300, letterSpacing:'-0.04em' }}>{value}</div>
        <div className="nexa-label" style={{ marginTop:4 }}>{label}</div>
      </div>
    </div>
  )
}

function InfoCard({ label, value, accent = '#4D9FFF' }: any) {
  if (!value) return null
  return (
    <div style={{ padding:'14px 16px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderLeft:`2px solid ${accent}55`, borderRadius:12 }}>
      <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.28)', marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:13, color:'rgba(255,255,255,0.68)', lineHeight:1.68 }}>{value}</div>
    </div>
  )
}

function GhostBtn({ icon, label, onClick }: any) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', fontSize:12, fontWeight:600, background:hov?'rgba(255,255,255,0.06)':'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.1)', color:hov?'rgba(255,255,255,0.75)':'rgba(255,255,255,0.42)', borderRadius:9, cursor:'pointer', fontFamily:'var(--sans)', transition:'all 0.15s' }}>
      <span style={{ display:'flex' }}>{icon}</span>{label}
    </button>
  )
}

function EmptyTab({ icon, title, desc, btnLabel, btnColor, onAction, loading }: any) {
  const [hov, setHov] = useState(false)
  const isLight = btnColor !== '#FF5757' && btnColor !== '#FF7A40'
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'54vh', textAlign:'center', padding:'40px 20px' }}>
      <div style={{ width:62, height:62, borderRadius:18, background:`${btnColor}0a`, border:`1px solid ${btnColor}22`, display:'flex', alignItems:'center', justifyContent:'center', color:btnColor, marginBottom:22 }}>{icon}</div>
      <h3 style={{ fontFamily:'var(--display)', fontSize:19, fontWeight:800, letterSpacing:'-0.03em', marginBottom:9, color:'rgba(255,255,255,0.9)', lineHeight:1.2 }}>{title}</h3>
      <p style={{ fontSize:13, color:'rgba(255,255,255,0.35)', lineHeight:1.75, maxWidth:420, marginBottom:26 }}>{desc}</p>
      <button onClick={onAction} disabled={loading}
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 26px', fontSize:13, fontWeight:700, fontFamily:'var(--display)', letterSpacing:'-0.02em', background:loading?'rgba(255,255,255,0.04)':hov?btnColor:`${btnColor}ee`, color:loading?'rgba(255,255,255,0.25)':isLight?'#000':'#fff', border:'none', borderRadius:11, cursor:loading?'not-allowed':'pointer', transition:'all 0.18s', boxShadow:loading?'none':`0 4px 22px ${btnColor}40`, transform:hov&&!loading?'translateY(-1px)':'none' }}>
        {loading
          ? <><div className="nexa-spinner" style={{ width:13, height:13 }}/>Building…</>
          : <><span style={{ display:'flex' }}>{Ic.bolt}</span>{btnLabel}</>}
      </button>
    </div>
  )
}

/* ─── Page ─── */
export default function StrategyPage() {
  const supabase = createClient()
  const router   = useRouter()

  const [ws,         setWs]        = useState<any>(null)
  const [strategy,   setStrategy]  = useState<any>(null)
  const [hasBrand,   setHasBrand]  = useState(false)
  const [generating, setGenerating]= useState(false)
  const [loading,    setLoading]   = useState(true)
  const [tab,        setTab]       = useState<Tab>('overview')
  const [timingData, setTimingData]= useState<any>(null)
  const [genTiming,  setGenTiming] = useState(false)
  const [compData,   setCompData]  = useState<any>(null)
  const [genComp,    setGenComp]   = useState(false)
  const [compInput,  setCompInput] = useState('')
  const [expanded,   setExpanded]  = useState<number|null>(null)
  const [mounted,    setMounted]   = useState(false)
  const [hovDay,     setHovDay]    = useState<number|null>(null)

  useEffect(() => { setMounted(true); load() }, [])

  useEffect(() => {
    if (!ws || loading) return
    if (tab === 'timing' && !timingData && !genTiming) generateTiming()
    if (tab === 'competitors' && !compData && !genComp) generateComp()
  }, [tab, ws, loading])

  async function load() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return
    const { data:m } = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id',user.id).limit(1).single()
    const w = (m as any)?.workspaces
    setWs(w); setCompInput(w?.brand_tone||'')
    const { data:ba } = await supabase.from('brand_assets').select('id').eq('workspace_id',w?.id).eq('file_name','nexa_brand_intelligence.json').single()
    setHasBrand(!!ba)
    const { data:plan } = await supabase.from('strategy_plans').select('*').eq('workspace_id',w?.id).eq('status','active').order('generated_at',{ascending:false}).limit(1).single()
    if (plan) {
      setStrategy({ audience:plan.audience_map, pillars:plan.content_pillars, angles:plan.insights?.top_angles, plan:plan.daily_plan, insights:plan.insights?.key_insights })
      if (plan.platform_strategy?.timing) setTimingData(plan.platform_strategy.timing)
    }
    setLoading(false)
  }

  async function generateStrategy() {
    if (!ws||generating) return; setGenerating(true)
    try {
      const r = await fetch('/api/generate-strategy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspace_id:ws.id})})
      const d = await r.json()
      if (d.success) {
        // Reload from DB so field mapping is consistent with normal load path
        const { data:ba } = await supabase.from('brand_assets').select('id').eq('workspace_id',ws?.id).eq('file_name','nexa_brand_intelligence.json').single()
    setHasBrand(!!ba)
    const { data:plan } = await supabase.from('strategy_plans').select('*').eq('workspace_id',ws.id).eq('status','active').order('generated_at',{ascending:false}).limit(1).single()
        if (plan) {
          setStrategy({ audience:plan.audience_map, pillars:plan.content_pillars, angles:plan.insights?.top_angles, plan:plan.daily_plan, insights:plan.insights?.key_insights })
          if (plan.platform_strategy?.timing) setTimingData(plan.platform_strategy.timing)
        }
      }
    } catch {}
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

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - var(--topbar-h))', flexDirection:'column', gap:16, background:'#000' }}>
      <div className="nexa-spinner" style={{ width:22, height:22 }}/>
      <div style={{ fontSize:11, color:'var(--t4)', fontFamily:'var(--sans)', letterSpacing:'0.06em', textTransform:'uppercase' as const, fontWeight:500 }}>Loading</div>
    </div>
  )

  /* ── No strategy yet ── */
  if (!strategy && !generating) return (
    <div style={{ padding:'28px 32px', height:'calc(100vh - var(--topbar-h))', overflowY:'auto' }}>
      <div style={{
        position:'relative', borderRadius:20, overflow:'hidden',
        background:'linear-gradient(135deg, #060d1a 0%, #080618 40%, #130616 70%, #1a0908 100%)',
        border:'1px solid rgba(255,255,255,0.08)', padding:'48px 40px', textAlign:'center',
        marginBottom:16,
      }}>
        {/* Orbs */}
        <div style={{ position:'absolute', top:-60, left:'10%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(14,165,255,0.22) 0%, transparent 65%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:-40, right:'10%', width:260, height:260, borderRadius:'50%', background:'radial-gradient(circle, rgba(120,80,255,0.2) 0%, transparent 65%)', pointerEvents:'none' }}/>
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ width:64, height:64, borderRadius:18, background:'rgba(77,159,255,0.08)', border:'1px solid rgba(77,159,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#4D9FFF', margin:'0 auto 22px', fontSize:28 }}>
            {Ic.star}
          </div>
          <h2 style={{ fontFamily:'var(--display)', fontSize:28, fontWeight:800, letterSpacing:'-0.04em', color:'#F4F0FF', marginBottom:12, lineHeight:1.1 }}>
            Your strategy is waiting
          </h2>
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.38)', lineHeight:1.8, maxWidth:480, margin:'0 auto 32px' }}>
            Nexa analyzes your brand voice, audience psychology, and content patterns — then builds a complete strategy: pillars, winning angles, a 30-day plan, optimal posting times, and competitive intelligence.
          </p>
          {!hasBrand && (
            <div style={{ marginBottom:20, padding:'12px 20px', background:'rgba(52,211,153,0.06)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:11, display:'inline-flex', alignItems:'center', gap:10 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#34D399', flexShrink:0 }}/>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.55)' }}>Strategy works best after Brand Brain is trained.</span>
              <a href="/dashboard/brand" style={{ fontSize:12, fontWeight:700, color:'#34D399', textDecoration:'none', flexShrink:0 }}>Train Brand Brain →</a>
            </div>
          )}
          <div className="nexa-ring-wrap">
            <button onClick={generateStrategy} className="nexa-ring-body" style={{ padding:'12px 32px', fontSize:15, fontFamily:'var(--display)', fontWeight:800 }}>
              <span style={{ display:'flex' }}>{Ic.bolt}</span>
              Build my strategy
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  /* ── Building ── */
  if (generating) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'calc(100vh - var(--topbar-h))', gap:16, textAlign:'center', padding:40 }}>
      <div style={{ width:56, height:56, borderRadius:16, background:'rgba(77,159,255,0.08)', border:'1px solid rgba(77,159,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#4D9FFF' }}>{Ic.star}</div>
      <h3 style={{ fontFamily:'var(--display)', fontSize:20, fontWeight:800, letterSpacing:'-0.03em', color:'rgba(255,255,255,0.9)' }}>Building your strategy…</h3>
      <p style={{ fontSize:13, color:'rgba(255,255,255,0.35)', lineHeight:1.7, maxWidth:380 }}>
        Analyzing your brand, audience, and content patterns.<br/>This takes about 30 seconds.
      </p>
      <div style={{ display:'flex', gap:5, marginTop:8 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width:7, height:7, borderRadius:'50%', background:'#4D9FFF', opacity:0.4, animation:`pageSpin 1.4s ease-in-out ${i*0.2}s infinite` }}/>
        ))}
      </div>
    </div>
  )

  /* ── Data helpers ── */
  const aud      = strategy?.audience ?? {}
  const pillars  = Array.isArray(strategy?.pillars) ? strategy.pillars : Object.entries(strategy?.pillars??{}).map(([k,v]:any)=>({name:k,description:String(v)}))
  const angles   = Array.isArray(strategy?.angles)  ? strategy.angles  : Object.entries(strategy?.angles??{}).map(([k,v]:any)=>({title:k,why:String(v)}))
  const planDays = Array.isArray(strategy?.plan)    ? strategy.plan    : []
  const insights = strategy?.insights ?? []
  const activeColor = TABS.find(t=>t.id===tab)?.color ?? '#4D9FFF'

  return (
    <div style={{ padding:'28px 32px 48px', height:'calc(100vh - var(--topbar-h))', overflowY:'auto' }}>

      {/* ── Header ── */}
      <div style={{
        display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:22,
        opacity: mounted?1:0, transform: mounted?'translateY(0)':'translateY(12px)',
        transition:'opacity 0.45s ease, transform 0.45s ease',
      }}>
        <div>
          <h1 style={{ fontFamily:'var(--display)', fontSize:22, fontWeight:800, letterSpacing:'-0.03em', color:'rgba(255,255,255,0.92)', lineHeight:1, marginBottom:5 }}>
            Strategy
          </h1>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>
            Your brand's complete content blueprint
          </p>
        </div>
        <GhostBtn icon={Ic.refresh} label="Regenerate" onClick={generateStrategy}/>
      </div>

      {/* ── Stat bar ── */}
      <div style={{
        display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(175px,1fr))', gap:8, marginBottom:22,
        opacity: mounted?1:0, transform: mounted?'translateY(0)':'translateY(12px)',
        transition:'opacity 0.45s ease 0.06s, transform 0.45s ease 0.06s',
      }}>
        <StatCard icon={Ic.users} label="Audience insights" value={Object.keys(aud).length||'—'} color="#4D9FFF"/>
        <StatCard icon={Ic.star}  label="Content pillars"   value={pillars.length||'—'}           color="#A78BFA"/>
        <StatCard icon={Ic.bolt}  label="Winning angles"    value={angles.length||'—'}            color="#FF7A40"/>
        <StatCard icon={Ic.cal}   label="Days planned"      value={planDays.length||'—'}          color="#34D399"/>
      </div>

      {/* ── Tab bar ── */}
      <div style={{
        display:'flex', gap:2, marginBottom:24, padding:4,
        background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14,
        opacity: mounted?1:0, transform: mounted?'translateY(0)':'translateY(12px)',
        transition:'opacity 0.45s ease 0.1s, transform 0.45s ease 0.1s',
      }}>
        {TABS.map(t => {
          const on = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex:1, padding:'8px 4px', borderRadius:10, border:`1px solid ${on?`${t.color}25`:'transparent'}`, background:on?`${t.color}0e`:'transparent', color:on?t.color:'rgba(255,255,255,0.32)', cursor:'pointer', fontSize:13, fontWeight:500, fontFamily:'var(--sans)', transition:'all 0.15s', whiteSpace:'nowrap' }}
              onMouseEnter={e => { if(!on)(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { if(!on)(e.currentTarget as HTMLElement).style.background='transparent' }}>
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ════════════ OVERVIEW ════════════ */}
      {tab === 'overview' && (
        <div style={{ animation:'pageUp 0.3s ease both' }}>

          {/* Key insights hero card */}
          {insights.length > 0 && (
            <div style={{
              padding:'24px 26px', marginBottom:20,
              background:'linear-gradient(145deg, rgba(77,159,255,0.07) 0%, rgba(0,0,0,0.4) 100%)',
              border:'1px solid rgba(77,159,255,0.18)', borderRadius:18,
              boxShadow:'0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(77,159,255,0.1)',
              position:'relative', overflow:'hidden',
            }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg, transparent, rgba(77,159,255,0.5), transparent)' }}/>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:'#4D9FFF', boxShadow:'0 0 10px #4D9FFF' }}/>
                <span style={{ fontSize:10, fontWeight:700, color:'#4D9FFF', letterSpacing:'0.1em', textTransform:'uppercase' }}>What Nexa found</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {insights.map((ins: string, i: number) => (
                  <div key={i} style={{ display:'flex', gap:14, fontSize:13.5, color:'rgba(255,255,255,0.75)', lineHeight:1.72, letterSpacing:'-0.01em' }}>
                    <div style={{ width:20, height:20, borderRadius:6, background:'rgba(77,159,255,0.12)', border:'1px solid rgba(77,159,255,0.22)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                      <span style={{ fontSize:9, fontWeight:800, color:'#4D9FFF' }}>{i+1}</span>
                    </div>
                    {ins}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audience data */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:10 }}>
            {Object.entries(aud).slice(0,6).map(([k,v]: any) => (
              <InfoCard key={k}
                label={k.replace(/_/g,' ')}
                value={typeof v==='string'?v:Array.isArray(v)?v.join(', '):JSON.stringify(v)}
                accent="#4D9FFF"
              />
            ))}
          </div>

          {Object.keys(aud).length === 0 && (
            <div style={{ textAlign:'center', padding:'32px', color:'rgba(255,255,255,0.25)', fontSize:13 }}>
              No audience data yet. Regenerate your strategy.
            </div>
          )}
        </div>
      )}

      {/* ════════════ PILLARS ════════════ */}
      {tab === 'pillars' && (
        <div style={{ animation:'pageUp 0.3s ease both' }}>
          {pillars.length > 0 ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:10 }}>
              {pillars.map((p: any, i: number) => {
                const name        = typeof p==='string'?p:(p.name||p.pillar||`Pillar ${i+1}`)
                const desc        = typeof p==='string'?'':(p.description||p.purpose||'')
                const topics      = p.topics||[]
                const frequency   = p.frequency||''
                const exampleAngle= p.example_angle||''
                const color  = PILLAR_COLORS[i % PILLAR_COLORS.length]
                return (
                  <div key={i} className="strategy-card" style={{ padding:'24px 22px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                      <div style={{ width:36, height:36, borderRadius:11, background:`${color}14`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--display)', fontSize:15, fontWeight:800, color, flexShrink:0, boxShadow:`0 0 16px ${color}18` }}>
                        {i+1}
                      </div>
                      <div>
                        <span style={{ fontSize:16, fontWeight:800, color:'rgba(255,255,255,0.92)', letterSpacing:'-0.03em', fontFamily:'var(--display)', display:'block', lineHeight:1.2 }}>{name}</span>
                        {frequency && <span style={{ fontSize:10, fontWeight:700, color:`${color}aa`, letterSpacing:'0.05em', textTransform:'uppercase' }}>{frequency}</span>}
                      </div>
                    </div>
                    {desc && <p style={{ fontSize:12.5, color:'rgba(255,255,255,0.45)', lineHeight:1.68, marginBottom:(topics.length||frequency||exampleAngle)?14:0 }}>{desc}</p>}
                    {(frequency||exampleAngle) && (
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:topics.length?10:0 }}>
                        {frequency && <span style={{ fontSize:10, padding:'3px 10px', borderRadius:100, background:`${color}10`, border:`1px solid ${color}22`, color:`${color}cc`, fontWeight:600 }}>{frequency}</span>}
                        {exampleAngle && <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontStyle:'italic' }}>e.g. "{exampleAngle}"</span>}
                      </div>
                    )}
                    {topics.length > 0 && (
                      <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                        {topics.slice(0,4).map((t: string, j: number) => (
                          <span key={j} style={{ fontSize:10, padding:'2px 9px', borderRadius:100, background:`${color}10`, border:`1px solid ${color}22`, color:`${color}cc` }}>{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'48px', color:'rgba(255,255,255,0.25)', fontSize:13 }}>
              No pillars yet. Regenerate your strategy to build them.
            </div>
          )}
        </div>
      )}

      {/* ════════════ ANGLES ════════════ */}
      {tab === 'angles' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10, animation:'pageUp 0.3s ease both' }}>
          {angles.length > 0 ? angles.map((a: any, i: number) => {
            const title = typeof a==='string'?a:(a.angle||a.title||`Angle ${i+1}`)
            const hook  = a.example_hook||a.hook||''
            const why   = a.why_it_works||a.why||a.description||''
            return (
              <div key={i} className="angle-card" style={{ padding:'24px 22px' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:(hook||why)?16:0 }}>
                  <div style={{ width:28, height:28, borderRadius:9, background:'rgba(255,122,64,0.12)', border:'1px solid rgba(255,122,64,0.28)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#FF7A40', flexShrink:0, fontFamily:'var(--display)', marginTop:2, boxShadow:'0 0 12px rgba(255,122,64,0.15)' }}>
                    {i+1}
                  </div>
                  <span style={{ fontSize:15, fontWeight:800, color:'rgba(255,255,255,0.92)', letterSpacing:'-0.03em', lineHeight:1.38, fontFamily:'var(--display)' }}>{title}</span>
                </div>
                {hook && (
                  <div className="hook-quote" style={{ margin:'0 0 12px 42px', padding:'12px 16px', background:'rgba(255,122,64,0.05)', borderRadius:10 }}>
                    <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,122,64,0.6)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:5 }}>Hook</div>
                    <p style={{ fontSize:13.5, color:'rgba(255,255,255,0.82)', lineHeight:1.65, letterSpacing:'-0.01em', fontStyle:'italic' }}>
                      &ldquo;{hook}&rdquo;
                    </p>
                  </div>
                )}
                {why && (
                  <p style={{ fontSize:12.5, color:'rgba(255,255,255,0.42)', lineHeight:1.72, paddingLeft:42 }}>{why}</p>
                )}
              </div>
            )
          }) : (
            <div style={{ textAlign:'center', padding:'48px', color:'rgba(255,255,255,0.25)', fontSize:13 }}>
              No angles yet. Regenerate your strategy to unlock them.
            </div>
          )}
        </div>
      )}

      {/* ════════════ 30-DAY PLAN ════════════ */}
      {tab === 'plan' && (
        <div style={{ animation:'pageUp 0.3s ease both' }}>
          {planDays.length > 0 ? (
            <>
              {/* Calendar grid */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(86px,1fr))', gap:6, marginBottom:16 }}>
                {planDays.map((day: any, i: number) => {
                  const num    = day.day||i+1
                  const theme  = day.theme||day.topic||''
                  const plat   = day.platform||''
                  const isOpen = expanded === num
                  const wkCol  = PILLAR_COLORS[Math.floor(i/7) % PILLAR_COLORS.length]
                  return (
                    <div key={i}
                      onClick={() => setExpanded(isOpen ? null : num)}
                      onMouseEnter={() => setHovDay(num)}
                      onMouseLeave={() => setHovDay(null)}
                      className="day-cell"
                      style={{
                        padding:'12px 10px',
                        background: isOpen ? `${wkCol}12` : 'rgba(255,255,255,0.025)',
                        borderColor: isOpen ? `${wkCol}35` : 'rgba(255,255,255,0.07)',
                        boxShadow: isOpen ? `0 0 0 1.5px ${wkCol}40, 0 4px 20px rgba(0,0,0,0.5)` : 'none',
                        position:'relative', overflow:'hidden',
                      }}>
                      {isOpen && <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:wkCol, borderRadius:'12px 12px 0 0' }}/>}
                      <div style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:300, color:isOpen?wkCol:'rgba(255,255,255,0.55)', lineHeight:1, marginBottom:6, letterSpacing:'-0.04em' }}>
                        {String(num).padStart(2,'0')}
                      </div>
                      {plat && (
                        <div style={{ fontSize:8.5, fontWeight:700, color:isOpen?`${wkCol}cc`:'rgba(255,255,255,0.2)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>
                          {plat.slice(0,3)}
                        </div>
                      )}
                      <div style={{ fontSize:9.5, color:isOpen?'rgba(255,255,255,0.5)':'rgba(255,255,255,0.28)', lineHeight:1.45, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as const }}>
                        {theme}
                      </div>
                      {hovDay === num && !isOpen && (
                        <button
                          onClick={e => { e.stopPropagation(); router.push(`/dashboard/studio?strategy_day=${num}&angle=${encodeURIComponent(day.angle||day.theme||theme)}`) }}
                          style={{ position:'absolute', bottom:6, right:6, padding:'3px 8px', borderRadius:6, fontSize:9, fontWeight:700, background:wkCol, color:'#000', border:'none', cursor:'pointer', fontFamily:'var(--sans)', whiteSpace:'nowrap' }}>
                          Create →
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Expanded day */}
              {expanded !== null && (() => {
                const day = planDays.find((d: any) => (d.day||(planDays.indexOf(d)+1)) === expanded)
                if (!day) return null
                const col = PILLAR_COLORS[Math.floor((expanded-1)/7) % PILLAR_COLORS.length]
                return (
                  <div style={{ padding:'28px 26px', background:`linear-gradient(145deg, ${col}0d 0%, rgba(0,0,0,0.4) 100%)`, border:`1px solid ${col}25`, borderRadius:18, animation:'pageUp 0.2s ease both', boxShadow:`0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 ${col}20`, position:'relative', overflow:'hidden' }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${col}, transparent)` }}/>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:22 }}>
                      <div>
                        <div style={{ fontSize:10, fontWeight:700, color:`${col}99`, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>
                          {day.platform ? `${day.platform} · ` : ''}{Math.ceil(expanded/7) ? `Week ${Math.ceil(expanded/7)}` : ''}
                        </div>
                        <span style={{ fontFamily:'var(--display)', fontSize:36, fontWeight:800, color:col, letterSpacing:'-0.05em', lineHeight:1, display:'block', marginBottom:4 }}>
                          Day {String(expanded).padStart(2,'0')}
                        </span>
                        {day.theme && <div style={{ fontSize:14, color:'rgba(255,255,255,0.55)', letterSpacing:'-0.01em' }}>{day.theme}</div>}
                      </div>
                      <button onClick={() => setExpanded(null)} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'rgba(255,255,255,0.4)', cursor:'pointer', display:'flex', padding:'6px', transition:'all 0.15s' }}>
                        {Ic.close}
                      </button>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      {day.angle && (
                        <div style={{ padding:'16px', background:'rgba(0,0,0,0.3)', border:`1px solid ${col}20`, borderRadius:12, gridColumn:(day.angle.length > 60 ? 'span 2' : 'span 1') }}>
                          <div style={{ fontSize:9, fontWeight:700, color:`${col}88`, letterSpacing:'0.09em', textTransform:'uppercase', marginBottom:8 }}>Angle</div>
                          <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.88)', lineHeight:1.5, letterSpacing:'-0.02em', fontFamily:'var(--display)' }}>{day.angle}</div>
                        </div>
                      )}
                      {day.goal && (
                        <div style={{ padding:'16px', background:'rgba(0,0,0,0.3)', border:`1px solid ${col}20`, borderRadius:12 }}>
                          <div style={{ fontSize:9, fontWeight:700, color:`${col}88`, letterSpacing:'0.09em', textTransform:'uppercase', marginBottom:8 }}>Goal</div>
                          <div style={{ fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.6 }}>{day.goal}</div>
                        </div>
                      )}
                      {(day.content||day.description) && (
                        <div style={{ padding:'16px', background:'rgba(0,0,0,0.3)', border:`1px solid ${col}20`, borderRadius:12, gridColumn:'span 2' }}>
                          <div style={{ fontSize:9, fontWeight:700, color:`${col}88`, letterSpacing:'0.09em', textTransform:'uppercase', marginBottom:8 }}>What to create</div>
                          <div style={{ fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.7 }}>{day.content||day.description}</div>
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop:18, display:'flex', gap:8, flexWrap:'wrap' }}>
                      <button
                        onClick={() => router.push(`/dashboard/studio?strategy_day=${expanded}&angle=${encodeURIComponent(day.angle||day.theme||'')}`)  }
                        style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', background:col, color:'#000', borderRadius:9, fontSize:12, fontWeight:700, border:'none', cursor:'pointer', fontFamily:'var(--sans)', boxShadow:`0 4px 16px ${col}40`, transition:'all 0.15s' }}>
                        Create content in Studio →
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/studio?strategy_day=${expanded}&angle=${encodeURIComponent(day.angle||day.theme||'')}&format=reel`)}
                        style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.6)', borderRadius:9, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'var(--sans)', transition:'all 0.15s' }}>
                        → Make a Reel
                      </button>
                    </div>
                  </div>
                )
              })()}
            </>
          ) : (
            <div style={{ textAlign:'center', padding:'48px', color:'rgba(255,255,255,0.25)', fontSize:13 }}>
              No 30-day plan yet. Regenerate your strategy.
            </div>
          )}
        </div>
      )}

      {/* ════════════ TIMING ════════════ */}
      {tab === 'timing' && (
        <div style={{ animation:'pageUp 0.3s ease both' }}>
          {!timingData ? (
            <EmptyTab
              icon={Ic.clock}
              title="Timing Engine"
              desc="Nexa reverse-engineers your audience's daily schedule — their morning routines, commute windows, evening habits — and finds the exact moments they're most receptive to your content."
              btnLabel="Map my posting times"
              btnColor="#FFB547"
              onAction={generateTiming}
              loading={genTiming}
            />
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {timingData.analysis && (
                <div style={{ padding:'18px 20px', background:'rgba(255,181,71,0.06)', border:'1px solid rgba(255,181,71,0.18)', borderRadius:14, boxShadow:'0 0 30px rgba(255,181,71,0.05)' }}>
                  <SLabel>Why these times work</SLabel>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.72 }}>{timingData.analysis}</div>
                </div>
              )}
              {timingData.platforms && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:10 }}>
                  {Object.entries(timingData.platforms).map(([pl, data]: any) => (
                    <div key={pl} style={{ padding:'16px 18px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.82)', marginBottom:12, textTransform:'capitalize', letterSpacing:'-0.01em' }}>{pl}</div>
                      {data.best_times?.map((s: any, i: number) => (
                        <div key={i} style={{ display:'flex', gap:12, padding:'9px 11px', background:'rgba(0,0,0,0.2)', borderRadius:9, marginBottom:6 }}>
                          <div style={{ flexShrink:0 }}>
                            <div style={{ fontSize:13, fontWeight:700, color:'#FFB547' }}>{s.time}</div>
                            <div style={{ fontSize:9.5, color:'rgba(255,255,255,0.28)', marginTop:1 }}>{s.day_type}</div>
                          </div>
                          <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.45)', lineHeight:1.55, flex:1 }}>{s.reason}</div>
                        </div>
                      ))}
                      {data.frequency && <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:7 }}>{data.frequency}</div>}
                    </div>
                  ))}
                </div>
              )}
              <GhostBtn icon={Ic.refresh} label="Regenerate" onClick={generateTiming}/>
            </div>
          )}
        </div>
      )}

      {/* ════════════ COMPETITORS ════════════ */}
      {tab === 'competitors' && (
        <div style={{ animation:'pageUp 0.3s ease both' }}>
          {!compData ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'54vh', textAlign:'center', padding:'40px 20px' }}>
              <div style={{ width:62, height:62, borderRadius:18, background:'rgba(255,87,87,0.08)', border:'1px solid rgba(255,87,87,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#FF5757', marginBottom:22 }}>
                {Ic.target}
              </div>
              <h3 style={{ fontFamily:'var(--display)', fontSize:19, fontWeight:800, letterSpacing:'-0.03em', marginBottom:9, color:'rgba(255,255,255,0.9)' }}>
                Competitor Intelligence
              </h3>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.35)', lineHeight:1.75, maxWidth:420, marginBottom:22 }}>
                Nexa maps your competitive landscape — who owns what positioning, where the gaps are, and exactly how to differentiate so you own a space nobody else is talking to.
              </p>
              <div style={{ width:'100%', maxWidth:460, marginBottom:22, textAlign:'left' }}>
                <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.32)', marginBottom:8 }}>
                  Who are your competitors?
                  <span style={{ fontWeight:400, color:'rgba(255,255,255,0.2)', marginLeft:6 }}>(optional — Nexa infers from your niche if left blank)</span>
                </div>
                <textarea
                  value={compInput}
                  onChange={e => setCompInput(e.target.value)}
                  rows={3}
                  placeholder="e.g. Buffer, Hootsuite, Later — or describe your space"
                  style={{ width:'100%', padding:'12px 14px', fontSize:13, fontFamily:'var(--sans)', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:11, color:'rgba(255,255,255,0.82)', outline:'none', resize:'vertical', lineHeight:1.65, transition:'border-color 0.15s', boxSizing:'border-box' }}
                  onFocus={e => e.target.style.borderColor='rgba(255,87,87,0.32)'}
                  onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'}
                />
              </div>
              <button onClick={generateComp} disabled={genComp}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 28px', fontSize:13, fontWeight:700, fontFamily:'var(--display)', letterSpacing:'-0.02em', background:genComp?'rgba(255,255,255,0.04)':'#FF5757', color:genComp?'rgba(255,255,255,0.25)':'#fff', border:'none', borderRadius:11, cursor:genComp?'not-allowed':'pointer', transition:'all 0.18s', boxShadow:genComp?'none':'0 4px 22px rgba(255,87,87,0.35)' }}>
                {genComp
                  ? <><div className="nexa-spinner" style={{ width:13, height:13 }}/>Analyzing competitors…</>
                  : <><span style={{ display:'flex' }}>{Ic.target}</span>Run competitor analysis</>}
              </button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

              {/* Market position */}
              {compData.market_position && (
                <div style={{ padding:'18px 20px', background:'rgba(255,87,87,0.05)', border:'1px solid rgba(255,87,87,0.15)', borderRadius:14 }}>
                  <SLabel>Your market position</SLabel>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.68)', lineHeight:1.72 }}>{compData.market_position}</div>
                </div>
              )}

              {/* Positioning statement — the hero card */}
              {compData.differentiation_strategy?.positioning_statement && (
                <div style={{
                  padding:'22px 24px',
                  background:'linear-gradient(145deg, rgba(255,87,87,0.08) 0%, rgba(255,122,64,0.05) 100%)',
                  border:'1px solid rgba(255,87,87,0.2)', borderRadius:16,
                  boxShadow:'0 0 40px rgba(255,87,87,0.07)',
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12 }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:'#FF5757', boxShadow:'0 0 8px #FF5757' }}/>
                    <span style={{ fontSize:9, fontWeight:700, color:'#FF5757', letterSpacing:'0.09em', textTransform:'uppercase' }}>Your positioning statement</span>
                  </div>
                  <div style={{ fontSize:17, fontWeight:700, color:'rgba(255,255,255,0.92)', lineHeight:1.55, fontFamily:'var(--display)', letterSpacing:'-0.02em' }}>
                    "{compData.differentiation_strategy.positioning_statement}"
                  </div>
                </div>
              )}

              {/* White space */}
              {compData.white_space?.length > 0 && (
                <div>
                  <SLabel>White space opportunities</SLabel>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(270px,1fr))', gap:10, marginTop:10 }}>
                    {compData.white_space.map((w: any, i: number) => (
                      <div key={i}
                        style={{ padding:'16px 18px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:13, transition:'all 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,87,87,0.2)'; (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.025)' }}>
                        <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.85)', marginBottom:6, letterSpacing:'-0.01em' }}>{w.opportunity}</div>
                        <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginBottom:10, lineHeight:1.6 }}>{w.why_nobody_owns_it}</div>
                        <div style={{ fontSize:12, color:'#FF5757', fontWeight:700, letterSpacing:'-0.01em' }}>→ {w.how_to_claim_it}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Winning angles */}
              {compData.winning_angles?.length > 0 && (
                <div>
                  <SLabel>Winning angles competitors miss</SLabel>
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>
                    {compData.winning_angles.map((a: any, i: number) => (
                      <div key={i}
                        style={{ padding:'16px 20px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:13, transition:'all 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.12)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.025)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.07)' }}>
                        <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.85)', marginBottom:6, letterSpacing:'-0.01em' }}>{a.angle}</div>
                        {a.example_hook && <div style={{ fontSize:13.5, color:'#FF7A40', fontStyle:'italic', lineHeight:1.65, marginBottom:7 }}>"{a.example_hook}"</div>}
                        {a.why_it_wins  && <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', lineHeight:1.6 }}>{a.why_it_wins}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Competitors */}
              {compData.competitors?.length > 0 && (
                <div>
                  <SLabel>Competitor breakdown</SLabel>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px,1fr))', gap:10, marginTop:10 }}>
                    {compData.competitors.map((c: any, i: number) => (
                      <div key={i} style={{ padding:'16px 18px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:13 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.85)', marginBottom:12, letterSpacing:'-0.02em' }}>{c.name}</div>
                        {c.strengths?.length > 0 && (
                          <>
                            <div style={{ fontSize:9, fontWeight:700, color:'#34D399', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:5 }}>Strengths</div>
                            {c.strengths.slice(0,2).map((s: string, j: number) => <div key={j} style={{ fontSize:11.5, color:'rgba(255,255,255,0.45)', marginBottom:3 }}>+ {s}</div>)}
                          </>
                        )}
                        {c.weaknesses?.length > 0 && (
                          <>
                            <div style={{ fontSize:9, fontWeight:700, color:'#FF5757', textTransform:'uppercase', letterSpacing:'0.07em', marginTop:10, marginBottom:5 }}>Weaknesses</div>
                            {c.weaknesses.slice(0,2).map((w: string, j: number) => <div key={j} style={{ fontSize:11.5, color:'rgba(255,255,255,0.45)', marginBottom:3 }}>− {w}</div>)}
                          </>
                        )}
                        {c.differentiation_opportunity && (
                          <div style={{ marginTop:12, padding:'9px 11px', background:'rgba(255,87,87,0.06)', border:'1px solid rgba(255,87,87,0.15)', borderRadius:9, fontSize:11.5, color:'#FF5757', lineHeight:1.55 }}>
                            Your edge: {c.differentiation_opportunity}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <GhostBtn icon={Ic.refresh} label="Re-analyze" onClick={generateComp}/>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
