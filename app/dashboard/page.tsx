'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, formatDistanceToNow } from 'date-fns'

/* ── Icons ── */
const Ic = {
  bolt:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  copy:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  cal:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  brain:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2a2.5 2.5 0 0 1 5 0"/><path d="M9.5 22a2.5 2.5 0 0 0 5 0"/><path d="M14.5 2C17 2 19 4 19 6.5c0 2-1.5 3.5-3.5 4C17 11 19 12.5 19 15c0 2.5-2 4.5-4.5 4.5"/><path d="M9.5 2C7 2 5 4 5 6.5c0 2 1.5 3.5 3.5 4C7 11 5 12.5 5 15c0 2.5 2 4.5 4.5 4.5"/></svg>,
  chart:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18"/><path d="M5 20V14l4-4 4 3 4-6 4 4v9"/></svg>,
  fire:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  arrow:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  check:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  play:    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  warning: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  star:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
}

const AGENTS = [
  { id:'content',    name:'Content Agent',    desc:'Full week of brand posts',           color:'#4D9FFF', bg:'rgba(77,159,255,0.08)',  border:'rgba(77,159,255,0.18)'  },
  { id:'timing',     name:'Timing Agent',     desc:'Optimal windows for your audience',  color:'#34D399', bg:'rgba(52,211,153,0.06)',  border:'rgba(52,211,153,0.16)'  },
  { id:'insights',   name:'Insights Agent',   desc:'Weekly digest with next steps',      color:'#A78BFA', bg:'rgba(167,139,250,0.06)', border:'rgba(167,139,250,0.16)' },
  { id:'engagement', name:'Engage Agent',     desc:'Replies in your exact brand voice',  color:'#FF7A40', bg:'rgba(255,122,64,0.06)',  border:'rgba(255,122,64,0.16)'  },
]

const STATUS_CONFIG: Record<string, {color:string;bg:string;label:string}> = {
  on_fire:      { color:'#FF7A40', bg:'rgba(255,122,64,0.1)',   label:'On Fire 🔥' },
  building:     { color:'#4D9FFF', bg:'rgba(77,159,255,0.08)',  label:'Building'   },
  needs_push:   { color:'#FFB547', bg:'rgba(255,181,71,0.08)',  label:'Needs Push' },
  just_starting:{ color:'#34D399', bg:'rgba(52,211,153,0.07)', label:'Starting Up' },
}

export default function HomePage() {
  const supabase = createClient()

  const [profile,    setProfile]    = useState<any>(null)
  const [workspace,  setWorkspace]  = useState<any>(null)
  const [credits,    setCredits]    = useState<any>(null)
  const [content,    setContent]    = useState<any[]>([])
  const [scheduled,  setScheduled]  = useState<any[]>([])
  const [activity,   setActivity]   = useState<any[]>([])
  const [agentRuns,  setAgentRuns]  = useState<any[]>([])
  const [learnings,  setLearnings]  = useState<any[]>([])
  const [brandData,  setBrandData]  = useState<any>(null)
  const [brief,      setBrief]      = useState<any>(null)
  const [briefLoading, setBriefLoading] = useState(false)
  const [running,    setRunning]    = useState<string|null>(null)
  const [result,     setResult]     = useState<any>(null)
  const [loading,    setLoading]    = useState(true)
  const [mounted,    setMounted]    = useState(false)
  const [voiceDrift, setVoiceDrift] = useState<any>(null)
  const [totalContent, setTotalContent] = useState(0)

  useEffect(() => { setMounted(true); load() }, [])

  async function load() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return
    const { data:p }  = await supabase.from('profiles').select('*').eq('id', user.id).single()
    const { data:m }  = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id', user.id).limit(1).single()
    const ws = (m as any)?.workspaces
    setProfile(p); setWorkspace(ws); setLoading(false)
    if (!ws?.id) return

    const [cr, ctCount, ct, sc, ac] = await Promise.all([
      supabase.from('credits').select('balance,lifetime_used').eq('workspace_id', ws.id).single(),
      supabase.from('content').select('id', { count:'exact', head:true }).eq('workspace_id', ws.id),
      supabase.from('content').select('*').eq('workspace_id', ws.id).order('created_at',{ascending:false}).limit(6),
      supabase.from('content').select('*').eq('workspace_id', ws.id).eq('status','scheduled').order('scheduled_for',{ascending:true}).limit(5),
      supabase.from('activity').select('*').eq('workspace_id', ws.id).order('created_at',{ascending:false}).limit(10),
    ])

    let runs: any[] = []
    let brand: any  = null
    let lg: any[]   = []

    try { const r = await supabase.from('agent_runs').select('*').eq('workspace_id', ws.id).order('created_at',{ascending:false}).limit(20); runs = r.data??[] } catch {}
    try { const r = await supabase.from('brand_assets').select('analysis').eq('workspace_id', ws.id).eq('file_name','nexa_brand_intelligence.json').single(); brand = r.data?.analysis??null } catch {}
    try { const r = await supabase.from('brand_learnings').select('*').eq('workspace_id', ws.id).order('created_at',{ascending:false}).limit(6); lg = r.data??[] } catch {}

    setCredits(cr.data)
    setTotalContent(ctCount.count ?? ct.data?.length ?? 0)
    setContent(ct.data??[])
    setScheduled(sc.data??[])
    setActivity(ac.data??[])
    setAgentRuns(runs)
    setBrandData(brand)
    setLearnings(lg)

    // Load morning brief (non-blocking)
    loadBrief(ws.id)

    supabase.channel('home-rt')
      .on('postgres_changes',{event:'*',schema:'public',table:'activity',filter:`workspace_id=eq.${ws.id}`},()=>load())
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'credits',filter:`workspace_id=eq.${ws.id}`},(p:any)=>{
        if (p.new?.balance!==undefined) setCredits((c:any)=>({...c,balance:p.new.balance}))
      })
      .subscribe()
  }

  async function loadBrief(wsId: string) {
    // Use cached brief if one exists for today
    const today    = new Date().toISOString().slice(0, 10) // "YYYY-MM-DD"
    const cacheKey = `nexa_brief_${wsId}_${today}`
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed?.brief) { setBrief(parsed.brief); return }
      }
    } catch {}

    setBriefLoading(true)
    try {
      const r = await fetch('/api/morning-brief', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ workspace_id: wsId })
      })
      const d = await r.json()
      if (d.brief) {
        setBrief(d.brief)
        try { localStorage.setItem(cacheKey, JSON.stringify({ brief: d.brief })) } catch {}
      }
    } catch {}
    setBriefLoading(false)
  }

  async function runAgent(id: string) {
    if (!workspace || running) return
    setRunning(id); setResult(null)
    try {
      const r = await fetch('/api/agents',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({workspace_id:workspace.id,agent_type:id}) })
      const d = await r.json()
      try { await supabase.from('agent_runs').insert({ workspace_id:workspace.id, agent_type:id, status:d.success?'completed':'failed', result:d }) } catch {}
      setResult({ type:id, data:d }); load()
    } catch {}
    setRunning(null)
  }

  async function checkVoiceDrift() {
    if (!workspace) return
    try {
      const r = await fetch('/api/voice-drift',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({workspace_id:workspace.id}) })
      const d = await r.json()
      setVoiceDrift(d)
    } catch {}
  }

  const hour      = new Date().getHours()
  const greeting  = hour<12?'Good morning':hour<17?'Good afternoon':'Good evening'
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const balance   = credits?.balance ?? 0
  const streak    = workspace?.posting_streak ?? 0
  const voiceScore = workspace?.voice_score_avg ?? brandData?.voice_match_score ?? 0
  const statusCfg = STATUS_CONFIG[brief?.status || 'building']

  const actColor = (type:string) => {
    if (type?.includes('generat')||type?.includes('creat')) return '#4D9FFF'
    if (type?.includes('publish')||type?.includes('schedul')) return '#34D399'
    if (type?.includes('agent')) return '#A78BFA'
    if (type?.includes('brand')||type?.includes('analyz')) return '#FF7A40'
    if (type?.includes('drift')) return '#FFB547'
    return 'rgba(255,255,255,0.25)'
  }

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'calc(100vh - var(--topbar-h))',flexDirection:'column',gap:16}}>
      <div className="nexa-spinner" style={{ width:28, height:28 }}/>
      <div style={{fontSize:12,color:'var(--t4)',letterSpacing:'0.04em',fontWeight:500}}>Loading your workspace</div>
    </div>
  )

  return (
    <div style={{padding:'24px 28px 40px',height:'calc(100vh - var(--topbar-h))',overflowY:'auto',overflowX:'hidden'}}>

      {/* ── COMMAND HEADER ── */}
      <div style={{
        position:'relative', borderRadius:20, overflow:'hidden', marginBottom:14,
        border:'1px solid rgba(255,255,255,0.08)',
        opacity:mounted?1:0, transform:mounted?'translateY(0)':'translateY(16px)',
        transition:'opacity 0.5s ease, transform 0.5s ease',
      }}>
        {/* Atmospheric bg */}
        <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,#050510 0%,#07071A 40%,#0A0720 70%,#0F0710 100%)'}}/>
        <div className="nexa-cinema-bg"/>

        <div style={{position:'relative',zIndex:1,padding:'28px 32px'}}>
          {/* Top row: greeting + brand status */}
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:20}}>
            <div>
              <div style={{fontSize:11,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(255,255,255,0.38)',marginBottom:6}}>
                {greeting} · {format(new Date(),'EEEE, MMMM d')}
              </div>
              <div style={{display:'flex',alignItems:'baseline',gap:12,marginBottom:8}}>
                <div style={{fontFamily:'var(--serif)',fontSize:36,fontWeight:400,letterSpacing:'-0.01em',color:'var(--t1)',lineHeight:1}}>{firstName}</div>
                <div style={{fontSize:10,fontWeight:500,color:'var(--t4)',letterSpacing:'0.06em',textTransform:'uppercase',paddingBottom:2}}>command center</div>
              </div>

              {/* Morning brief headline */}
              {briefLoading ? (
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:5,height:5,borderRadius:'50%',background:'rgba(14,165,255,0.7)',animation:'pulse-dot 1.2s ease-in-out 0s infinite'}}/>
                    <div style={{width:5,height:5,borderRadius:'50%',background:'rgba(14,165,255,0.5)',animation:'pulse-dot 1.2s ease-in-out 0.2s infinite'}}/>
                    <div style={{width:5,height:5,borderRadius:'50%',background:'rgba(14,165,255,0.3)',animation:'pulse-dot 1.2s ease-in-out 0.4s infinite'}}/>
                    <span style={{fontSize:11,color:'rgba(255,255,255,0.25)',letterSpacing:'0.04em'}}>Reading your brand signals</span>
                  </div>
              ) : brief?.headline ? (
                <div style={{fontSize:14,color:'rgba(255,255,255,0.72)',lineHeight:1.5,maxWidth:520,letterSpacing:'-0.01em'}}>
                  {brief.headline}
                </div>
              ) : (
                <div style={{fontSize:13,color:'rgba(255,255,255,0.35)'}}>
                  {brandData ? 'Your brand is ready. What are we building today?' : (
                    <span>Brand Brain not trained yet. <a href="/dashboard/brand" style={{color:'#34D399',textDecoration:'none',fontWeight:700}}>Upload assets to get started →</a></span>
                  )}
                </div>
              )}
            </div>

            {/* Status pill + streak */}
            <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:8,flexShrink:0}}>
              {brief?.status && (
                <div style={{display:'flex',alignItems:'center',gap:7,padding:'7px 14px',background:statusCfg.bg,border:`1px solid ${statusCfg.color}28`,borderRadius:100,fontSize:12,fontWeight:700,color:statusCfg.color}}>
                  {brief.status==='on_fire' && <span style={{display:'flex'}}>{Ic.fire}</span>}
                  {statusCfg.label}
                </div>
              )}
              {streak > 0 && (
                <div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 12px',background:'rgba(255,181,71,0.08)',border:'1px solid rgba(255,181,71,0.2)',borderRadius:100,fontSize:11,fontWeight:700,color:'#FFB547'}}>
                  <span style={{display:'flex'}}>{Ic.fire}</span>
                  {streak} day streak
                </div>
              )}
            </div>
          </div>

          {/* Brief intelligence row */}
          {brief && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,paddingTop:20,borderTop:'1px solid rgba(255,255,255,0.08)'}}>
              {/* Today's priority */}
              <div style={{padding:'18px 18px',background:'linear-gradient(145deg,rgba(77,159,255,0.07) 0%,rgba(0,0,0,0.3) 100%)',border:'1px solid rgba(77,159,255,0.18)',borderRadius:14,position:'relative',overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,0.4),inset 0 1px 0 rgba(77,159,255,0.1)'}}>
                <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(77,159,255,0.5),transparent)'}}/>
                <div style={{fontSize:8.5,fontWeight:700,color:'rgba(77,159,255,0.7)',letterSpacing:'0.11em',textTransform:'uppercase',marginBottom:9}}>Today&apos;s priority</div>
                <div style={{fontSize:13,fontWeight:600,color:'rgba(255,255,255,0.88)',lineHeight:1.58,letterSpacing:'-0.01em'}}>{brief.todays_priority}</div>
              </div>

              {/* Today's angle */}
              {brief.todays_angle && (
                <div
                  onClick={() => { window.location.href = '/dashboard/studio' }}
                  style={{padding:'14px 16px',background:'rgba(167,139,250,0.06)',border:'1px solid rgba(167,139,250,0.15)',borderRadius:13,cursor:'pointer',transition:'all 0.15s'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(167,139,250,0.1)';(e.currentTarget as HTMLElement).style.borderColor='rgba(167,139,250,0.3)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(167,139,250,0.06)';(e.currentTarget as HTMLElement).style.borderColor='rgba(167,139,250,0.15)'}}>
                  <div style={{fontSize:9,fontWeight:700,color:'#A78BFA',letterSpacing:'0.09em',textTransform:'uppercase',marginBottom:8}}>Write This Today →</div>
                  <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.85)',lineHeight:1.5}}>{brief.todays_angle}</div>
                  {brief.todays_platform && <div style={{fontSize:10,color:'rgba(255,255,255,0.35)',marginTop:5,textTransform:'capitalize'}}>Best on {brief.todays_platform}</div>}
                </div>
              )}

              {/* The one thing */}
              <div style={{padding:'18px 18px',background:'linear-gradient(145deg,rgba(52,211,153,0.06) 0%,rgba(0,0,0,0.3) 100%)',border:'1px solid rgba(52,211,153,0.16)',borderRadius:14,position:'relative',overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,0.4),inset 0 1px 0 rgba(52,211,153,0.08)'}}>
                <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(52,211,153,0.45),transparent)'}}/>
                <div style={{fontSize:8.5,fontWeight:700,color:'rgba(52,211,153,0.7)',letterSpacing:'0.11em',textTransform:'uppercase',marginBottom:9}}>One thing</div>
                <div style={{fontSize:13,fontWeight:600,color:'rgba(255,255,255,0.88)',lineHeight:1.58,letterSpacing:'-0.01em'}}>{brief.one_thing}</div>
              </div>
            </div>
          )}

          {/* Voice drift warning */}
          {(brief?.warning || (voiceDrift?.drift_detected && voiceDrift.drift_severity !== 'none')) && (
            <div style={{marginTop:12,padding:'12px 16px',background:'rgba(255,181,71,0.06)',border:'1px solid rgba(255,181,71,0.2)',borderRadius:11,display:'flex',alignItems:'flex-start',gap:10}}>
              <span style={{display:'flex',color:'#FFB547',flexShrink:0,marginTop:1}}>{Ic.warning}</span>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:'#FFB547',marginBottom:3}}>Voice Drift Detected</div>
                <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',lineHeight:1.55}}>{voiceDrift?.alert_message || brief?.warning}</div>
              </div>
              <a href="/dashboard/brand" style={{marginLeft:'auto',flexShrink:0,fontSize:11,fontWeight:700,color:'#FFB547',textDecoration:'none',padding:'5px 12px',background:'rgba(255,181,71,0.1)',border:'1px solid rgba(255,181,71,0.25)',borderRadius:7}}>Recalibrate</a>
            </div>
          )}

          {/* Stats row */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',borderTop:'1px solid rgba(255,255,255,0.09)',marginTop:brief?20:0,paddingTop:20}}>
            {[
              { label:'Credits',        value:balance.toLocaleString(),  tag:workspace?.plan||'spark',  tagColor:'#4D9FFF', href:'/dashboard/settings?tab=billing', icon:'●' },
              { label:'Built', value:totalContent,             tag:`${content.filter(c=>c.status==='published').length} published`, tagColor:'#34D399', href:'/dashboard/studio' },
              { label:'Scheduled',      value:scheduled.length,          tag:'upcoming',                tagColor:'#FFB547', href:'/dashboard/schedule' },
              { label:'Streak',         value:streak > 0 ? `${streak}d` : '—', tag:streak>0?'keep it up':'start one', tagColor:streak>0?'#FF7A40':'rgba(255,255,255,0.3)', href:'/dashboard/schedule' },
              { label:'Voice score',    value:voiceScore > 0 ? `${Math.round(voiceScore)}%` : '—', tag:voiceScore>80?'on brand':voiceScore>60?'check Brand Brain':'train Brand Brain', tagColor:voiceScore>80?'#34D399':voiceScore>60?'#FFB547':'rgba(255,255,255,0.3)', href:'/dashboard/brand' },
            ].map((s,i) => (
              <a key={i} href={s.href} style={{
                textDecoration:'none', padding:i===0?'0 20px 0 0':i===4?'0 0 0 20px':'0 20px',
                borderLeft:i>0?'1px solid rgba(255,255,255,0.08)':'none', display:'block',
              }}>
                <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:8}}>
                  <span className="nexa-label">{s.label}</span>
                  <span style={{color:s.tagColor,fontWeight:600,fontSize:9,background:`${s.tagColor}18`,border:`1px solid ${s.tagColor}28`,padding:'1px 6px',borderRadius:4,letterSpacing:'0.04em',textTransform:'uppercase'}}>
                    {s.tag}
                  </span>
                </div>
                <div className="nexa-num" style={{fontSize:28}}>{s.value}</div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>

        {/* ── AI AGENTS ── */}
        <div style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:18,padding:'20px 22px',opacity:mounted?1:0,transform:mounted?'translateY(0)':'translateY(12px)',transition:'opacity 0.5s ease 0.08s, transform 0.5s ease 0.08s'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div>
              <div style={{fontFamily:'var(--display)',fontSize:16,fontWeight:800,color:'rgba(255,255,255,0.92)',letterSpacing:'-0.03em',marginBottom:2}}>Agents</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.32)'}}>One click. Nexa executes.</div>
            </div>
            <a href="/dashboard/automate" style={{fontSize:11,fontWeight:600,color:'#4D9FFF',textDecoration:'none',display:'flex',alignItems:'center',gap:4,opacity:0.75,transition:'opacity 0.15s'}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.opacity='1'}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.opacity='0.75'}>
              All agents <span style={{display:'flex'}}>{Ic.arrow}</span>
            </a>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:7}}>
            {AGENTS.map(agent => {
              const lastRun   = agentRuns.find(r => r.agent_type===agent.id)
              const isRunning = running===agent.id
              return (
                <div key={agent.id} style={{
                  display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:12,
                  background:isRunning?`${agent.color}0c`:'rgba(255,255,255,0.025)',
                  border:`1px solid ${isRunning?`${agent.color}28`:'rgba(255,255,255,0.06)'}`,
                  transition:'all 0.2s',
                }}
                  onMouseEnter={e=>{if(!isRunning){(e.currentTarget as HTMLElement).style.background=`${agent.color}08`;(e.currentTarget as HTMLElement).style.borderColor=`${agent.color}20`}}}
                  onMouseLeave={e=>{if(!isRunning){(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.025)';(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.06)'}}}>
                  <div style={{width:3,height:28,borderRadius:3,background:isRunning?agent.color:'rgba(255,255,255,0.1)',boxShadow:isRunning?`0 0 8px ${agent.color}`:'none',flexShrink:0,transition:'all 0.2s'}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:'rgba(255,255,255,0.85)',marginBottom:2,letterSpacing:'-0.01em'}}>{agent.name}</div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,0.32)',lineHeight:1.4}}>
                      {lastRun ? `Last run ${formatDistanceToNow(new Date(lastRun.created_at))} ago` : agent.desc}
                    </div>
                  </div>
                  <button onClick={()=>runAgent(agent.id)} disabled={!!running}
                    style={{display:'flex',alignItems:'center',gap:5,padding:'6px 14px',borderRadius:8,fontSize:11,fontWeight:700,fontFamily:'var(--sans)',background:isRunning?agent.color:'rgba(255,255,255,0.06)',border:`1px solid ${isRunning?'transparent':'rgba(255,255,255,0.09)'}`,color:isRunning?'#000':'rgba(255,255,255,0.5)',cursor:running?'not-allowed':'pointer',transition:'all 0.15s',whiteSpace:'nowrap'}}
                    onMouseEnter={e=>{if(!running){(e.currentTarget as HTMLElement).style.background=`${agent.color}18`;(e.currentTarget as HTMLElement).style.borderColor=`${agent.color}33`;(e.currentTarget as HTMLElement).style.color=agent.color}}}
                    onMouseLeave={e=>{if(!running&&!isRunning){(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.06)';(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.09)';(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.5)'}}}>
                    {isRunning ? (<><div className="nexa-spinner" style={{width:8,height:8}}/>Running</>) : (<><span style={{display:'flex'}}>{Ic.play}</span>Run</>)}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Agent result */}
          {result && (
            <div style={{marginTop:12,padding:'12px 14px',background:'rgba(52,211,153,0.06)',border:'1px solid rgba(52,211,153,0.2)',borderRadius:11,animation:'pageUp 0.3s ease both'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{display:'flex',color:'#34D399'}}>{Ic.check}</span>
                  <span style={{fontSize:12,fontWeight:700,color:'#34D399'}}>{AGENTS.find(a=>a.id===result.type)?.name} completed</span>
                </div>
                <button onClick={()=>setResult(null)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.3)',cursor:'pointer',display:'flex',fontSize:14}}>✕</button>
              </div>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',lineHeight:1.6}}>
                {result.data.posts?.length>0 ? <>{result.data.posts.length} posts saved as drafts. <a href="/dashboard/studio" style={{color:'#4D9FFF',textDecoration:'none',fontWeight:600}}>Open Studio →</a></> :
                 result.data.insights?.summary ? <>{result.data.insights.summary} <a href="/dashboard/insights" style={{color:'#4D9FFF',textDecoration:'none',fontWeight:600}}>See full report →</a></> :
                 result.data.message || 'Completed.'}
              </div>
            </div>
          )}
        </div>

        {/* ── SCHEDULED QUEUE ── */}
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:18,padding:'20px 22px',flex:1,opacity:mounted?1:0,transform:mounted?'translateY(0)':'translateY(12px)',transition:'opacity 0.5s ease 0.14s, transform 0.5s ease 0.14s'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <div>
                <div style={{fontFamily:'var(--display)',fontSize:15,fontWeight:700,color:'rgba(255,255,255,0.88)',letterSpacing:'-0.02em',marginBottom:2}}>Queue</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.32)'}}>{scheduled.length>0?`${scheduled.length} post${scheduled.length!==1?'s':''} scheduled`:'Queue is clear'}</div>
              </div>
              <a href="/dashboard/schedule" style={{fontSize:11,fontWeight:600,color:'#FFB547',textDecoration:'none',opacity:0.75,transition:'opacity 0.15s'}} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.opacity='1'} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.opacity='0.75'}>Manage</a>
            </div>
            {scheduled.length>0 ? (
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {scheduled.map(item=>(
                  <div key={item.id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:10}}>
                    <div style={{width:6,height:6,borderRadius:'50%',flexShrink:0,background:{instagram:'#E1306C',linkedin:'#0A66C2',x:'#E7E7E7',tiktok:'#FF0050',general:'#888'}[item.platform as string]||'#888'}}/>
                    <span style={{fontSize:12,color:'rgba(255,255,255,0.65)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.title||item.body?.slice(0,45)||'Post'}</span>
                    <span style={{fontSize:10,color:'rgba(255,255,255,0.28)',flexShrink:0}}>{item.scheduled_for?format(new Date(item.scheduled_for),'MMM d · ha'):'—'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{textAlign:'center',padding:'20px 0'}}>
                <div style={{fontSize:12,color:'rgba(255,255,255,0.28)',lineHeight:1.7,marginBottom:12}}>Nothing queued yet.</div>
                <a href="/dashboard/studio" style={{fontSize:12,fontWeight:700,color:'#4D9FFF',textDecoration:'none',padding:'7px 16px',background:'rgba(77,159,255,0.08)',border:'1px solid rgba(77,159,255,0.2)',borderRadius:8}}>Create your first post →</a>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7,opacity:mounted?1:0,transform:mounted?'translateY(0)':'translateY(12px)',transition:'opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s'}}>
            {[
              { label:'Write content',  sub:'Studio',      href:'/dashboard/studio',   color:'#4D9FFF', icon:Ic.copy  },
              { label:'Build strategy', sub:'Strategy',    href:'/dashboard/strategy', color:'#A78BFA', icon:Ic.star  },
              { label:'Schedule',       sub:'Calendar',    href:'/dashboard/schedule', color:'#FFB547', icon:Ic.cal   },
              { label:'Brand Brain',    sub:'Intelligence',href:'/dashboard/brand',    color:'#34D399', icon:Ic.brain },
            ].map(a=>(
              <a key={a.label} href={a.href} style={{display:'flex',flexDirection:'column',gap:8,padding:'14px 16px',background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,textDecoration:'none',transition:'all 0.18s'}}
                onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.background=`${a.color}0e`;el.style.borderColor=`${a.color}30`;el.style.transform='translateY(-2px)'}}
                onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.background='rgba(255,255,255,0.025)';el.style.borderColor='rgba(255,255,255,0.07)';el.style.transform='translateY(0)'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{color:a.color,display:'flex'}}>{a.icon}</div>
                  <div style={{color:'rgba(255,255,255,0.2)',display:'flex'}}>{Ic.arrow}</div>
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:'rgba(255,255,255,0.82)',letterSpacing:'-0.02em',marginBottom:1}}>{a.label}</div>
                  <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',fontWeight:500}}>{a.sub}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW: Activity + Brand Intelligence ── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>

        {/* Activity */}
        <div style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:18,padding:'20px 22px',opacity:mounted?1:0,transform:mounted?'translateY(0)':'translateY(12px)',transition:'opacity 0.5s ease 0.22s, transform 0.5s ease 0.22s'}}>
          <div style={{marginBottom:16}}>
            <div style={{fontFamily:'var(--display)',fontSize:15,fontWeight:700,color:'rgba(255,255,255,0.88)',letterSpacing:'-0.02em',marginBottom:2}}>Activity</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.32)'}}>Everything happening in real time</div>
          </div>
          {activity.length>0 ? (
            <div style={{display:'flex',flexDirection:'column',gap:0}}>
              {activity.slice(0,7).map((item,i)=>(
                <div key={item.id} style={{display:'flex',alignItems:'flex-start',gap:11,padding:'9px 0',borderBottom:i<6?'1px solid rgba(255,255,255,0.04)':'none'}}>
                  <div style={{width:7,height:7,borderRadius:'50%',flexShrink:0,marginTop:4,background:actColor(item.type),boxShadow:`0 0 6px ${actColor(item.type)}80`}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,color:'rgba(255,255,255,0.65)',lineHeight:1.5,letterSpacing:'-0.01em'}}>{item.title}</div>
                    <div style={{fontSize:10,color:'rgba(255,255,255,0.25)',marginTop:2}}>{item.created_at?formatDistanceToNow(new Date(item.created_at))+' ago':''}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{textAlign:'center',padding:'28px 0',fontSize:12,color:'rgba(255,255,255,0.3)',lineHeight:1.7}}>
              Every generation, publish, and run<br/>appears here as it happens.
            </div>
          )}
        </div>

        {/* Brand Intelligence + Learnings */}
        <div style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:18,padding:'20px 22px',opacity:mounted?1:0,transform:mounted?'translateY(0)':'translateY(12px)',transition:'opacity 0.5s ease 0.28s, transform 0.5s ease 0.28s'}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16}}>
            <div>
              <div style={{fontFamily:'var(--display)',fontSize:15,fontWeight:700,color:'rgba(255,255,255,0.88)',letterSpacing:'-0.02em',marginBottom:2}}>Brand Intelligence</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.32)'}}>{brandData?'Profile active — learning from every generation':'Not yet trained'}</div>
            </div>
            <div style={{display:'flex',gap:7,alignItems:'center'}}>
              {brandData && <div style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:6,height:6,borderRadius:'50%',background:'#34D399',boxShadow:'0 0 6px #34D399',animation:'pulse-dot 2.2s ease-in-out infinite'}}/><span style={{fontSize:10,color:'#34D399',fontWeight:600}}>Active</span></div>}
              {brandData && (
                <button onClick={checkVoiceDrift} style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,0.4)',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:6,padding:'4px 9px',cursor:'pointer',fontFamily:'var(--sans)',transition:'all 0.15s'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.7)';(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.15)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.4)';(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.08)'}}>
                  Check drift
                </button>
              )}
            </div>
          </div>

          {brandData ? (
            <div>
              <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:16}}>
                {[
                  { label:'Voice match',  score:brandData.voice_match_score||voiceScore||0,  color:'linear-gradient(90deg,#4D9FFF,#7B6FFF)' },
                  { label:'Audience fit', score:brandData.audience_fit_score||0,             color:'linear-gradient(90deg,#34D399,#4D9FFF)' },
                  { label:'Visual style', score:brandData.visual_style_score||0,             color:'linear-gradient(90deg,#A78BFA,#FF7A40)' },
                ].map(m=>(
                  <div key={m.label}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                      <span style={{fontSize:12,color:'rgba(255,255,255,0.45)',letterSpacing:'-0.01em'}}>{m.label}</span>
                      <span style={{fontSize:12,fontWeight:700,color:'rgba(255,255,255,0.78)'}}>{m.score>0?`${m.score}%`:'—'}</span>
                    </div>
                    <div style={{height:3,background:'rgba(255,255,255,0.07)',borderRadius:3,overflow:'hidden'}}>
                      <div style={{height:'100%',background:m.color,borderRadius:3,width:`${m.score}%`,transition:'width 1.4s cubic-bezier(0.34,1.56,0.64,1)'}}/>
                    </div>
                  </div>
                ))}
              </div>

              {learnings.length>0 && (
                <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:14}}>
                  <div style={{fontSize:9,fontWeight:700,color:'rgba(255,255,255,0.25)',letterSpacing:'.09em',textTransform:'uppercase',marginBottom:10}}>
                    What Nexa has learned from your content
                  </div>
                  {learnings.slice(0,3).map(l=>(
                    <div key={l.id} style={{display:'flex',gap:8,marginBottom:9}}>
                      <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:4,flexShrink:0,height:'fit-content',marginTop:1,textTransform:'uppercase',letterSpacing:'0.04em',background:l.source==='performance_analysis'?'rgba(52,211,153,0.09)':'rgba(255,122,64,0.09)',border:`1px solid ${l.source==='performance_analysis'?'rgba(52,211,153,0.2)':'rgba(255,122,64,0.2)'}`,color:l.source==='performance_analysis'?'#34D399':'#FF7A40'}}>
                        {l.insight_type||'insight'}
                      </span>
                      <div style={{fontSize:11.5,color:'rgba(255,255,255,0.48)',lineHeight:1.55}}>
                        {l.insight?.slice(0,90)}{(l.insight?.length||0)>90?'…':''}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {brief?.insight && (
                <div style={{marginTop:12,padding:'11px 14px',background:'rgba(77,159,255,0.05)',border:'1px solid rgba(77,159,255,0.12)',borderRadius:10}}>
                  <div style={{fontSize:9,fontWeight:700,color:'#4D9FFF',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:6}}>Nexa's Insight</div>
                  <div style={{fontSize:12,color:'rgba(255,255,255,0.6)',lineHeight:1.6}}>{brief.insight}</div>
                </div>
              )}
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',padding:'16px 0'}}>
              <div style={{position:'relative',width:56,height:56,marginBottom:16}}>
                <div style={{position:'absolute',inset:0,borderRadius:'50%',border:'1px solid rgba(167,139,250,0.15)'}}/>
                <div style={{position:'absolute',inset:8,borderRadius:'50%',border:'1px solid rgba(167,139,250,0.22)'}}/>
                <div style={{position:'absolute',inset:16,borderRadius:'50%',background:'rgba(167,139,250,0.08)',border:'1px solid rgba(167,139,250,0.3)',display:'flex',alignItems:'center',justifyContent:'center',color:'#A78BFA'}}>{Ic.brain}</div>
              </div>
              <div style={{fontSize:13,fontWeight:600,color:'rgba(255,255,255,0.6)',marginBottom:6}}>Brand Brain isn't trained yet</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.3)',lineHeight:1.7,marginBottom:16,maxWidth:240}}>Upload your brand assets and Nexa learns your voice, style, and audience.</div>
              <a href="/dashboard/brand" style={{fontSize:12,fontWeight:700,color:'#A78BFA',textDecoration:'none',padding:'8px 18px',background:'rgba(167,139,250,0.08)',border:'1px solid rgba(167,139,250,0.22)',borderRadius:9,transition:'all 0.15s'}}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(167,139,250,0.14)';(e.currentTarget as HTMLElement).style.borderColor='rgba(167,139,250,0.35)'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(167,139,250,0.08)';(e.currentTarget as HTMLElement).style.borderColor='rgba(167,139,250,0.22)'}}>
                Train Brand Brain →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
