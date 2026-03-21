'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, formatDistanceToNow } from 'date-fns'

const Ic = {
  copy:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  cal:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  brain:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2a2.5 2.5 0 0 1 5 0"/><path d="M9.5 22a2.5 2.5 0 0 0 5 0"/><path d="M14.5 2C17 2 19 4 19 6.5c0 2-1.5 3.5-3.5 4C17 11 19 12.5 19 15c0 2.5-2 4.5-4.5 4.5"/><path d="M9.5 2C7 2 5 4 5 6.5c0 2 1.5 3.5 3.5 4C7 11 5 12.5 5 15c0 2.5 2 4.5 4.5 4.5"/></svg>,
  fire:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  arrow:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  check:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  play:    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  warning: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  star:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  close:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>,
}

const AGENTS = [
  { id:'content',    name:'Content Agent',    desc:'Full week of brand posts'          },
  { id:'timing',     name:'Timing Agent',     desc:'Optimal windows for your audience' },
  { id:'insights',   name:'Insights Agent',   desc:'Weekly digest with next steps'     },
  { id:'engagement', name:'Engage Agent',     desc:'Replies in your exact brand voice' },
]

const STATUS_CONFIG: Record<string, { color:string; bg:string; border:string; label:string }> = {
  on_fire:       { color:'#F59E0B', bg:'rgba(245,158,11,0.10)', border:'rgba(245,158,11,0.25)', label:'On Fire'     },
  building:      { color:'#00AAFF', bg:'rgba(0,170,255,0.10)',  border:'rgba(0,170,255,0.25)',  label:'Building'    },
  needs_push:    { color:'#F59E0B', bg:'rgba(245,158,11,0.10)', border:'rgba(245,158,11,0.25)', label:'Needs Push'  },
  just_starting: { color:'#22C55E', bg:'rgba(34,197,94,0.10)',  border:'rgba(34,197,94,0.25)',  label:'Starting Up' },
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram:'#E1306C', linkedin:'#0A66C2', x:'#E7E7E7',
  tiktok:'#FF0050', general:'#666666',
}

export default function HomePage() {
  const supabase = createClient()

  const [profile,      setProfile]      = useState<any>(null)
  const [workspace,    setWorkspace]    = useState<any>(null)
  const [credits,      setCredits]      = useState<any>(null)
  const [content,      setContent]      = useState<any[]>([])
  const [scheduled,    setScheduled]    = useState<any[]>([])
  const [activity,     setActivity]     = useState<any[]>([])
  const [learnings,    setLearnings]    = useState<any[]>([])
  const [brandData,    setBrandData]    = useState<any>(null)
  const [brief,        setBrief]        = useState<any>(null)
  const [briefLoading, setBriefLoading] = useState(false)
  const [result,       setResult]       = useState<any>(null)
  const [loading,      setLoading]      = useState(true)
  const [mounted,      setMounted]      = useState(false)
  const [voiceDrift,   setVoiceDrift]   = useState<any>(null)
  const [totalContent, setTotalContent] = useState(0)
  const [agentRunning, setAgentRunning] = useState<string|null>(null)
  const [agentResults, setAgentResults] = useState<Record<string,string>>({})
  const [agentLastRuns,setAgentLastRuns]= useState<Record<string,string>>({})

  useEffect(() => { setMounted(true); load() }, [])

  async function load() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return
    const { data:p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    const { data:m } = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id', user.id).limit(1).single()
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

    let brand: any = null, lg: any[] = []
    try { const r = await supabase.from('brand_assets').select('analysis').eq('workspace_id', ws.id).eq('file_name','nexa_brand_intelligence.json').single(); brand = r.data?.analysis??null } catch {}
    try { const r = await supabase.from('brand_learnings').select('*').eq('workspace_id', ws.id).order('created_at',{ascending:false}).limit(6); lg = r.data??[] } catch {}

    try {
      const { data: agentRunsData } = await supabase.from('agent_runs').select('agent_id, agent_type, ran_at').eq('workspace_id', ws.id).order('ran_at',{ascending:false}).limit(20)
      const lastRunMap: Record<string,string> = {}
      agentRunsData?.forEach((run: any) => {
        const type = run.agent_type || run.agent_id
        if (type && !lastRunMap[type]) {
          const d = new Date(run.ran_at)
          const isToday = d.toDateString() === new Date().toDateString()
          lastRunMap[type] = isToday ? `Today ${d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}` : d.toLocaleDateString('en-US',{month:'short',day:'numeric'})
        }
      })
      setAgentLastRuns(lastRunMap)
    } catch {}

    setCredits(cr.data); setTotalContent(ctCount.count ?? ct.data?.length ?? 0)
    setContent(ct.data??[]); setScheduled(sc.data??[]); setActivity(ac.data??[])
    setBrandData(brand); setLearnings(lg)
    loadBrief(ws.id)

    supabase.channel('home-rt')
      .on('postgres_changes',{event:'*',schema:'public',table:'activity',filter:`workspace_id=eq.${ws.id}`},()=>load())
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'credits',filter:`workspace_id=eq.${ws.id}`},(p:any)=>{
        if (p.new?.balance!==undefined) setCredits((c:any)=>({...c,balance:p.new.balance}))
      })
      .subscribe()
  }

  async function loadBrief(wsId: string) {
    const today = new Date().toISOString().slice(0,10)
    const cacheKey = `nexa_brief_${wsId}_${today}`
    try { const cached = localStorage.getItem(cacheKey); if (cached) { const p = JSON.parse(cached); if (p?.brief) { setBrief(p.brief); return } } } catch {}
    setBriefLoading(true)
    try {
      const r = await fetch('/api/morning-brief',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspace_id:wsId})})
      const d = await r.json()
      if (d.brief) { setBrief(d.brief); try { localStorage.setItem(cacheKey, JSON.stringify({brief:d.brief})) } catch {} }
    } catch {}
    setBriefLoading(false)
  }

  async function runAgent(agentType: string, agentName: string) {
    if (!workspace || agentRunning) return
    const ENDPOINTS: Record<string,string> = {
      content:  `/api/cron/content-agent?workspace_id=${workspace.id}`,
      timing:   `/api/cron/timing-agent?workspace_id=${workspace.id}`,
      insights: `/api/cron/insights-agent?workspace_id=${workspace.id}`,
      email:    `/api/cron/email-agent?workspace_id=${workspace.id}`,
    }
    setAgentRunning(agentName); setResult(null)
    try {
      const endpoint = ENDPOINTS[agentType]
      const res = endpoint ? await fetch(endpoint) : await fetch('/api/agents',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspace_id:workspace.id,agent_type:agentType})})
      const data = await res.json()
      setAgentResults(prev => ({...prev,[agentName]: data.message||`${agentName} completed`}))
      setResult({type:agentType,data})
      setTimeout(()=>load(),1000)
    } catch {
      setAgentResults(prev => ({...prev,[agentName]:'Failed — check console'}))
    } finally { setAgentRunning(null) }
  }

  async function checkVoiceDrift() {
    if (!workspace) return
    try { const r = await fetch('/api/voice-drift',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspace_id:workspace.id})}); const d = await r.json(); setVoiceDrift(d) } catch {}
  }

  const hour       = new Date().getHours()
  const greeting   = hour<12?'Good morning':hour<17?'Good afternoon':'Good evening'
  const firstName  = profile?.full_name?.split(' ')[0] ?? 'there'
  const balance    = credits?.balance ?? 0
  const streak     = workspace?.posting_streak ?? 0
  const voiceScore = workspace?.voice_score_avg ?? brandData?.voice_match_score ?? 0
  const statusCfg  = STATUS_CONFIG[brief?.status || 'building']

  const actColor = (type:string) => {
    if (type?.includes('generat')||type?.includes('creat')) return '#00AAFF'
    if (type?.includes('publish')||type?.includes('schedul')) return '#22C55E'
    if (type?.includes('agent')) return '#A78BFA'
    if (type?.includes('brand')||type?.includes('analyz')) return '#F59E0B'
    return 'rgba(255,255,255,0.20)'
  }

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'calc(100vh - var(--topbar-h))',flexDirection:'column',gap:14,background:'#0C0C0C'}}>
      <div className="nexa-spinner" style={{width:24,height:24}}/>
      <div style={{fontSize:12,color:'rgba(255,255,255,0.35)',letterSpacing:'0.04em',fontFamily:'var(--sans)'}}>Loading your workspace</div>
    </div>
  )

  return (
    <div style={{
      height:'calc(100vh - var(--topbar-h))',
      overflowY:'auto', overflowX:'hidden',
      background:'#0C0C0C',
      fontFamily:'var(--sans)',
    }}>

      <style dangerouslySetInnerHTML={{__html:`
        .dash-page { padding: 0 0 48px; }
        .stat-item:hover { background: #1A1A1A !important; }
        .agent-row:hover { background: rgba(255,255,255,0.04) !important; border-color: rgba(255,255,255,0.10) !important; }
        .qa-card:hover { background: #1A1A1A !important; border-color: rgba(255,255,255,0.16) !important; }
        .brief-card:hover { border-color: rgba(255,255,255,0.16) !important; }
        .activity-row:hover { background: rgba(255,255,255,0.03) !important; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .anim-1 { animation: fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.05s both; }
        .anim-2 { animation: fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.10s both; }
        .anim-3 { animation: fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.15s both; }
        .anim-4 { animation: fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.20s both; }
      `}}/>

      {/* ═══════════════════════════════════════
          HERO HEADER — cyan gradient image bg
      ═══════════════════════════════════════ */}
      <div style={{
        position:'relative',
        backgroundImage:'url(/cyan-header.png)',
        backgroundSize:'cover',
        backgroundPosition:'center top',
      }}>
        {/* No overlay — raw gradient shows fully */}
        {/* Bottom fade into dark page */}
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:'80px',background:'linear-gradient(to bottom, transparent, #0C0C0C)',pointerEvents:'none'}}/>

        <div style={{position:'relative',zIndex:1,padding:'44px 40px 52px'}}>

          {/* Greeting + name — dark text on bright gradient */}
          <div style={{marginBottom:'32px'}}>
            <div style={{fontSize:'11px',fontWeight:600,letterSpacing:'0.10em',textTransform:'uppercase',color:'rgba(0,0,0,0.55)',marginBottom:'12px',fontFamily:'var(--sans)'}}>
              {greeting} · {format(new Date(),'EEEE, MMMM d')}
            </div>
            <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'20px',flexWrap:'wrap'}}>
              <div>
                <h1 style={{fontSize:'42px',fontWeight:700,letterSpacing:'-0.04em',color:'#0A0A0A',lineHeight:1,marginBottom:'8px',fontFamily:'var(--sans)'}}>
                  {firstName}
                  <span style={{fontSize:'18px',fontWeight:500,color:'rgba(0,0,0,0.45)',marginLeft:'14px',letterSpacing:'-0.01em'}}>command center</span>
                </h1>
                {briefLoading ? (
                  <div style={{display:'flex',alignItems:'center',gap:'10px',height:'22px'}}>
                    <div style={{display:'flex',gap:'4px',alignItems:'center'}}>
                      {[0,1,2].map(i=><div key={i} style={{width:'5px',height:'5px',borderRadius:'50%',background:'rgba(0,0,0,0.35)',animation:`pulse-dot 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}
                    </div>
                    <span style={{fontSize:'13px',color:'rgba(0,0,0,0.45)',fontFamily:'var(--sans)'}}>Reading your brand signals</span>
                  </div>
                ) : brief?.headline ? (
                  <p style={{fontSize:'15px',color:'rgba(0,0,0,0.65)',lineHeight:1.55,maxWidth:'580px',letterSpacing:'-0.01em',margin:0,fontFamily:'var(--sans)',fontWeight:500}}>
                    {brief.headline}
                  </p>
                ) : (
                  <p style={{fontSize:'14px',color:'rgba(0,0,0,0.50)',margin:0,fontFamily:'var(--sans)'}}>
                    {brandData ? 'Your brand is ready. What are we building today?' : (
                      <span>Brand Brain not trained. <a href="/dashboard/brand" style={{color:'#003399',textDecoration:'none',fontWeight:600}}>Upload assets to get started →</a></span>
                    )}
                  </p>
                )}
              </div>

              {/* Status badges — dark style on bright bg */}
              <div style={{display:'flex',alignItems:'center',gap:'8px',flexShrink:0}}>
                {brief?.status && (
                  <div style={{display:'flex',alignItems:'center',gap:'6px',padding:'7px 14px',background:'rgba(0,0,0,0.15)',border:'1px solid rgba(0,0,0,0.20)',borderRadius:'10px',fontSize:'12px',fontWeight:600,color:'rgba(0,0,0,0.70)',backdropFilter:'blur(8px)'}}>
                    {brief.status==='on_fire' && <span style={{display:'flex'}}>{Ic.fire}</span>}
                    {statusCfg.label}
                  </div>
                )}
                {streak > 0 && (
                  <div style={{display:'flex',alignItems:'center',gap:'6px',padding:'7px 14px',background:'rgba(0,0,0,0.12)',border:'1px solid rgba(0,0,0,0.18)',borderRadius:'10px',fontSize:'12px',fontWeight:600,color:'rgba(0,0,0,0.65)',backdropFilter:'blur(8px)'}}>
                    <span style={{display:'flex'}}>{Ic.fire}</span>{streak}d streak
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats row — inside hero */}
          <div className="anim-1" style={{
            display:'grid',gridTemplateColumns:'repeat(5,1fr)',
            background:'rgba(20,20,20,0.80)',
            border:'1px solid rgba(255,255,255,0.10)',
            borderRadius:'12px',
            backdropFilter:'blur(20px)',
            overflow:'hidden',
          }}>
            {[
              { label:'Credits',     value:balance.toLocaleString(), tag:workspace?.plan||'spark',                                              tagColor:'#00AAFF',  href:'/dashboard/settings?tab=billing' },
              { label:'Built',       value:String(totalContent),     tag:`${content.filter((c:any)=>c.status==='published').length} published`, tagColor:'#22C55E',  href:'/dashboard/studio'               },
              { label:'Scheduled',   value:String(scheduled.length), tag:'upcoming',                                                           tagColor:'#F59E0B',  href:'/dashboard/schedule'             },
              { label:'Streak',      value:streak>0?`${streak}d`:'—',tag:streak>0?'keep it up':'start one',                                    tagColor:streak>0?'#F59E0B':'rgba(255,255,255,0.25)', href:'/dashboard/schedule' },
              { label:'Voice Score', value:voiceScore>0?`${Math.round(voiceScore)}%`:'—', tag:voiceScore>80?'on brand':voiceScore>60?'good':'train brain', tagColor:voiceScore>80?'#22C55E':voiceScore>60?'#F59E0B':'rgba(255,255,255,0.25)', href:'/dashboard/brand' },
            ].map((s,i) => (
              <a key={i} className="stat-item" href={s.href} style={{
                textDecoration:'none',
                padding:'20px 24px',
                borderLeft:i>0?'1px solid rgba(255,255,255,0.08)':'none',
                display:'block',
                transition:'background 0.15s',
                background:'transparent',
              }}>
                <div style={{display:'flex',alignItems:'center',gap:'7px',marginBottom:'10px'}}>
                  <span style={{fontSize:'10px',fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(255,255,255,0.35)',fontFamily:'var(--sans)'}}>{s.label}</span>
                  <span style={{fontSize:'10px',fontWeight:700,color:s.tagColor,padding:'1px 7px',borderRadius:'4px',background:`${s.tagColor}18`,letterSpacing:'0.03em',textTransform:'uppercase',fontFamily:'var(--sans)'}}>
                    {s.tag}
                  </span>
                </div>
                <div style={{fontSize:'28px',fontWeight:700,letterSpacing:'-0.04em',color:'#FFFFFF',lineHeight:1,fontFamily:"'Geist Mono', monospace"}}>{s.value}</div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          PAGE CONTENT
      ═══════════════════════════════════════ */}
      <div style={{padding:'0 40px 48px'}}>

        {/* Morning Brief */}
        {brief && (
          <div className="anim-2" style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px',marginBottom:'28px'}}>
            {/* Today's Priority */}
            <div className="brief-card" style={{
              padding:'20px 24px',
              background:'#141414',
              border:'1px solid rgba(255,255,255,0.10)',
              borderLeft:'3px solid #00AAFF',
              borderRadius:'0 10px 10px 0',
              transition:'border-color 0.15s',
            }}>
              <div style={{fontSize:'10px',fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(0,170,255,0.7)',marginBottom:'10px',fontFamily:'var(--sans)'}}>Today's Priority</div>
              <div style={{fontSize:'13px',fontWeight:500,color:'rgba(255,255,255,0.85)',lineHeight:1.65,fontFamily:'var(--sans)'}}>{brief.todays_priority}</div>
            </div>

            {/* Write This Today */}
            {brief.todays_angle && (
              <a href={`/dashboard/studio${brief.todays_angle?`?angle=${encodeURIComponent(brief.todays_angle)}`:''}`}
                className="brief-card"
                style={{
                  padding:'20px 24px',
                  background:'#141414',
                  border:'1px solid rgba(255,255,255,0.10)',
                  borderLeft:'3px solid rgba(255,255,255,0.20)',
                  borderRadius:'0 10px 10px 0',
                  textDecoration:'none',display:'block',
                  transition:'border-color 0.15s',
                }}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
                  <div style={{fontSize:'10px',fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(255,255,255,0.35)',fontFamily:'var(--sans)'}}>Write This Today</div>
                  <span style={{color:'rgba(255,255,255,0.25)',display:'flex'}}>{Ic.arrow}</span>
                </div>
                <div style={{fontSize:'13px',fontWeight:500,color:'rgba(255,255,255,0.85)',lineHeight:1.65,fontFamily:'var(--sans)'}}>{brief.todays_angle}</div>
                {brief.todays_platform && <div style={{fontSize:'11px',color:'rgba(255,255,255,0.30)',marginTop:'8px',textTransform:'capitalize',fontFamily:'var(--sans)'}}>Best on {brief.todays_platform}</div>}
              </a>
            )}

            {/* One Thing */}
            <div className="brief-card" style={{
              padding:'20px 24px',
              background:'#141414',
              border:'1px solid rgba(255,255,255,0.10)',
              borderLeft:'3px solid rgba(255,255,255,0.12)',
              borderRadius:'0 10px 10px 0',
              transition:'border-color 0.15s',
            }}>
              <div style={{fontSize:'10px',fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(255,255,255,0.35)',marginBottom:'10px',fontFamily:'var(--sans)'}}>One Thing</div>
              <div style={{fontSize:'13px',fontWeight:500,color:'rgba(255,255,255,0.85)',lineHeight:1.65,fontFamily:'var(--sans)'}}>{brief.one_thing}</div>
            </div>
          </div>
        )}

        {/* Voice Drift Warning */}
        {(brief?.warning || (voiceDrift?.drift_detected && voiceDrift.drift_severity !== 'none')) && (
          <div style={{
            display:'flex',alignItems:'flex-start',gap:'12px',
            padding:'16px 20px',
            background:'rgba(245,158,11,0.06)',
            border:'1px solid rgba(245,158,11,0.20)',
            borderLeft:'3px solid #F59E0B',
            borderRadius:'0 10px 10px 0',
            marginBottom:'28px',
          }}>
            <span style={{display:'flex',color:'#F59E0B',flexShrink:0,marginTop:'1px'}}>{Ic.warning}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:'13px',fontWeight:600,color:'#F59E0B',marginBottom:'4px',fontFamily:'var(--sans)'}}>Voice Drift Detected</div>
              <div style={{fontSize:'12px',color:'rgba(255,255,255,0.50)',lineHeight:1.6,fontFamily:'var(--sans)'}}>{voiceDrift?.alert_message||brief?.warning}</div>
            </div>
            <a href="/dashboard/brand" style={{flexShrink:0,fontSize:'12px',fontWeight:600,color:'#F59E0B',textDecoration:'none',padding:'6px 14px',background:'rgba(245,158,11,0.10)',border:'1px solid rgba(245,158,11,0.25)',borderRadius:'8px',whiteSpace:'nowrap',fontFamily:'var(--sans)'}}>Recalibrate</a>
          </div>
        )}

        {/* Main grid — Agents + Queue/Quick Actions */}
        <div className="anim-3" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>

          {/* Agents */}
          <div style={{background:'#141414',border:'1px solid rgba(255,255,255,0.10)',borderRadius:'10px',padding:'24px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px'}}>
              <div>
                <div style={{fontSize:'15px',fontWeight:600,letterSpacing:'-0.02em',color:'#FFFFFF',marginBottom:'3px',fontFamily:'var(--sans)'}}>Agents</div>
                <div style={{fontSize:'12px',color:'rgba(255,255,255,0.35)',fontFamily:'var(--sans)'}}>One click. Nexa executes.</div>
              </div>
              <a href="/dashboard/automate" style={{fontSize:'12px',fontWeight:500,color:'rgba(255,255,255,0.35)',textDecoration:'none',display:'flex',alignItems:'center',gap:'4px',transition:'color 0.15s',fontFamily:'var(--sans)'}}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.80)'}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.35)'}>
                View all {Ic.arrow}
              </a>
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              {AGENTS.map(agent => {
                const isRunning = agentRunning === agent.name
                const lastRunStr = agentLastRuns[agent.id]
                const resultMsg = agentResults[agent.name]
                return (
                  <div key={agent.id} className="agent-row" style={{
                    display:'flex',alignItems:'center',gap:'12px',
                    padding:'12px 14px',borderRadius:'8px',
                    background:isRunning?'rgba(0,170,255,0.06)':'rgba(255,255,255,0.02)',
                    border:`1px solid ${isRunning?'rgba(0,170,255,0.20)':'rgba(255,255,255,0.06)'}`,
                    transition:'all 0.15s',
                  }}>
                    <div style={{
                      width:'3px',height:'28px',borderRadius:'2px',flexShrink:0,
                      background:isRunning?'#00AAFF':'rgba(255,255,255,0.10)',
                      transition:'background 0.15s',
                    }}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:'13px',fontWeight:500,color:'rgba(255,255,255,0.88)',marginBottom:'2px',fontFamily:'var(--sans)'}}>{agent.name}</div>
                      <div style={{fontSize:'11px',color:'rgba(255,255,255,0.30)',lineHeight:1.4,fontFamily:'var(--sans)'}}>
                        {resultMsg ? <span style={{color:'#22C55E'}}>{resultMsg}</span>
                          : lastRunStr ? `Last run ${lastRunStr}`
                          : agent.desc}
                      </div>
                    </div>
                    <button onClick={()=>runAgent(agent.id,agent.name)} disabled={!!agentRunning}
                      style={{
                        display:'flex',alignItems:'center',gap:'5px',
                        padding:'6px 12px',borderRadius:'7px',
                        fontSize:'11px',fontWeight:600,fontFamily:'var(--sans)',
                        background:isRunning?'#00AAFF':'transparent',
                        border:`1px solid ${isRunning?'transparent':'rgba(255,255,255,0.10)'}`,
                        color:isRunning?'#000':'rgba(255,255,255,0.40)',
                        cursor:agentRunning?'not-allowed':'pointer',
                        transition:'all 0.15s',
                      }}
                      onMouseEnter={e=>{ if(!agentRunning){ (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.25)'; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.88)' }}}
                      onMouseLeave={e=>{ if(!agentRunning&&!isRunning){ (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.10)'; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.40)' }}}>
                      {isRunning
                        ? <><div className="nexa-spinner" style={{width:'10px',height:'10px'}}/>Running</>
                        : <><span style={{display:'flex'}}>{Ic.play}</span>Run</>}
                    </button>
                  </div>
                )
              })}
            </div>

            {result && (
              <div style={{marginTop:'14px',padding:'14px 16px',background:'rgba(34,197,94,0.06)',border:'1px solid rgba(34,197,94,0.20)',borderRadius:'8px',animation:'fadeUp 0.3s ease both'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'6px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                    <span style={{display:'flex',color:'#22C55E'}}>{Ic.check}</span>
                    <span style={{fontSize:'12px',fontWeight:600,color:'#22C55E',fontFamily:'var(--sans)'}}>{AGENTS.find(a=>a.id===result.type)?.name} completed</span>
                  </div>
                  <button onClick={()=>setResult(null)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.25)',cursor:'pointer',display:'flex'}}>{Ic.close}</button>
                </div>
                <div style={{fontSize:'12px',color:'rgba(255,255,255,0.50)',lineHeight:1.6,fontFamily:'var(--sans)'}}>
                  {result.data.posts?.length>0
                    ? <>{result.data.posts.length} posts saved. <a href="/dashboard/studio" style={{color:'#00AAFF',textDecoration:'none',fontWeight:600}}>Open Studio →</a></>
                    : result.data.message||'Completed.'}
                </div>
              </div>
            )}
          </div>

          {/* Queue + Quick Actions */}
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>

            {/* Queue */}
            <div style={{background:'#141414',border:'1px solid rgba(255,255,255,0.10)',borderRadius:'10px',padding:'24px',flex:1}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px'}}>
                <div>
                  <div style={{fontSize:'15px',fontWeight:600,letterSpacing:'-0.02em',color:'#FFFFFF',marginBottom:'3px',fontFamily:'var(--sans)'}}>Queue</div>
                  <div style={{fontSize:'12px',color:'rgba(255,255,255,0.35)',fontFamily:'var(--sans)'}}>
                    {scheduled.length>0?`${scheduled.length} post${scheduled.length!==1?'s':''} scheduled`:'Queue is clear'}
                  </div>
                </div>
                <a href="/dashboard/schedule" style={{fontSize:'12px',fontWeight:500,color:'rgba(255,255,255,0.35)',textDecoration:'none',display:'flex',alignItems:'center',gap:'4px',transition:'color 0.15s',fontFamily:'var(--sans)'}}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.80)'}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.35)'}>
                  Manage {Ic.arrow}
                </a>
              </div>

              {scheduled.length>0 ? (
                <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                  {scheduled.map(item=>(
                    <div key={item.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'8px'}}>
                      <div style={{width:'6px',height:'6px',borderRadius:'50%',flexShrink:0,background:PLATFORM_COLORS[item.platform]||'#666'}}/>
                      <span style={{fontSize:'12px',color:'rgba(255,255,255,0.65)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:'var(--sans)'}}>{item.title||item.body?.slice(0,45)||'Post'}</span>
                      <span style={{fontSize:'11px',color:'rgba(255,255,255,0.25)',flexShrink:0,fontFamily:'var(--sans)'}}>{item.scheduled_for?format(new Date(item.scheduled_for),'MMM d · ha'):'—'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',padding:'24px 0',gap:'10px'}}>
                  <div style={{fontSize:'13px',fontWeight:500,color:'rgba(255,255,255,0.35)',fontFamily:'var(--sans)'}}>Nothing queued yet</div>
                  <div style={{fontSize:'12px',color:'rgba(255,255,255,0.20)',fontFamily:'var(--sans)'}}>Schedule your first post to see it here</div>
                  <a href="/dashboard/studio" style={{
                    marginTop:'4px',fontSize:'12px',fontWeight:600,
                    color:'#0C0C0C',background:'#FFFFFF',
                    padding:'7px 16px',borderRadius:'8px',
                    textDecoration:'none',display:'inline-flex',
                    alignItems:'center',gap:'6px',
                    transition:'background 0.15s',
                    fontFamily:'var(--sans)',
                  }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.88)'}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='#FFFFFF'}>
                    Create a post {Ic.arrow}
                  </a>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              {[
                { label:'Write content',  sub:'Studio',       href:'/dashboard/studio',   icon:Ic.copy  },
                { label:'Build strategy', sub:'Strategy',     href:'/dashboard/strategy', icon:Ic.star  },
                { label:'Schedule',       sub:'Calendar',     href:'/dashboard/schedule', icon:Ic.cal   },
                { label:'Brand Brain',    sub:'Intelligence', href:'/dashboard/brand',    icon:Ic.brain },
              ].map(a=>(
                <a key={a.label} href={a.href} className="qa-card" style={{
                  display:'flex',flexDirection:'column',gap:'12px',
                  padding:'16px',
                  background:'#141414',
                  border:'1px solid rgba(255,255,255,0.10)',
                  borderRadius:'10px',
                  textDecoration:'none',
                  transition:'all 0.15s',
                }}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div style={{color:'rgba(255,255,255,0.35)',display:'flex'}}>{a.icon}</div>
                    <div style={{color:'rgba(255,255,255,0.20)',display:'flex'}}>{Ic.arrow}</div>
                  </div>
                  <div>
                    <div style={{fontSize:'12px',fontWeight:600,color:'rgba(255,255,255,0.88)',letterSpacing:'-0.01em',marginBottom:'2px',fontFamily:'var(--sans)'}}>{a.label}</div>
                    <div style={{fontSize:'11px',color:'rgba(255,255,255,0.30)',fontFamily:'var(--sans)'}}>{a.sub}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom row — Activity + Brand Intelligence */}
        <div className="anim-4" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>

          {/* Activity */}
          <div style={{background:'#141414',border:'1px solid rgba(255,255,255,0.10)',borderRadius:'10px',padding:'24px'}}>
            <div style={{marginBottom:'20px'}}>
              <div style={{fontSize:'15px',fontWeight:600,letterSpacing:'-0.02em',color:'#FFFFFF',marginBottom:'3px',fontFamily:'var(--sans)'}}>Activity</div>
              <div style={{fontSize:'12px',color:'rgba(255,255,255,0.35)',fontFamily:'var(--sans)'}}>Everything happening in real time</div>
            </div>
            {activity.length>0 ? (
              <div style={{display:'flex',flexDirection:'column'}}>
                {activity.slice(0,7).map((item,i)=>(
                  <div key={item.id} className="activity-row" style={{
                    display:'flex',alignItems:'flex-start',gap:'12px',
                    padding:'10px 8px',
                    borderBottom:i<6?'1px solid rgba(255,255,255,0.05)':'none',
                    borderRadius:'6px',
                    transition:'background 0.12s',
                    marginLeft:'-8px',marginRight:'-8px',
                  }}>
                    <div style={{width:'6px',height:'6px',borderRadius:'50%',flexShrink:0,marginTop:'5px',background:actColor(item.type)}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:'12px',color:'rgba(255,255,255,0.65)',lineHeight:1.5,fontFamily:'var(--sans)'}}>{item.title}</div>
                      <div style={{fontSize:'11px',color:'rgba(255,255,255,0.25)',marginTop:'2px',fontFamily:'var(--sans)'}}>{item.created_at?formatDistanceToNow(new Date(item.created_at))+' ago':''}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',padding:'32px 0',gap:'8px'}}>
                <div style={{fontSize:'13px',fontWeight:500,color:'rgba(255,255,255,0.25)',fontFamily:'var(--sans)'}}>No activity yet</div>
                <div style={{fontSize:'12px',color:'rgba(255,255,255,0.15)',fontFamily:'var(--sans)'}}>Every generation and publish appears here</div>
              </div>
            )}
          </div>

          {/* Brand Intelligence */}
          <div style={{background:'#141414',border:'1px solid rgba(255,255,255,0.10)',borderRadius:'10px',padding:'24px'}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'20px'}}>
              <div>
                <div style={{fontSize:'15px',fontWeight:600,letterSpacing:'-0.02em',color:'#FFFFFF',marginBottom:'3px',fontFamily:'var(--sans)'}}>Brand Intelligence</div>
                <div style={{fontSize:'12px',color:'rgba(255,255,255,0.35)',fontFamily:'var(--sans)'}}>{brandData?'Active — learning from every generation':'Not yet trained'}</div>
              </div>
              <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                {brandData && (
                  <div style={{display:'flex',alignItems:'center',gap:'5px'}}>
                    <div style={{width:'6px',height:'6px',borderRadius:'50%',background:'#22C55E'}}/>
                    <span style={{fontSize:'11px',color:'#22C55E',fontWeight:600,fontFamily:'var(--sans)'}}>Active</span>
                  </div>
                )}
                {brandData && (
                  <button onClick={checkVoiceDrift} style={{
                    fontSize:'11px',fontWeight:500,color:'rgba(255,255,255,0.35)',
                    background:'transparent',border:'1px solid rgba(255,255,255,0.10)',
                    borderRadius:'7px',padding:'5px 10px',cursor:'pointer',
                    fontFamily:'var(--sans)',transition:'all 0.15s',
                  }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.72)';(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.25)'}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.35)';(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.10)'}}>
                    Check drift
                  </button>
                )}
              </div>
            </div>

            {brandData ? (
              <div>
                <div style={{display:'flex',flexDirection:'column',gap:'14px',marginBottom:'20px'}}>
                  {[
                    { label:'Voice match',  score:brandData.voice_match_score||voiceScore||0 },
                    { label:'Audience fit', score:brandData.audience_fit_score||0            },
                    { label:'Visual style', score:brandData.visual_style_score||0            },
                  ].map(m=>(
                    <div key={m.label}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'7px'}}>
                        <span style={{fontSize:'12px',color:'rgba(255,255,255,0.40)',fontFamily:'var(--sans)'}}>{m.label}</span>
                        <span style={{fontSize:'12px',fontWeight:600,color:'rgba(255,255,255,0.88)',fontFamily:'var(--sans)'}}>{m.score>0?`${m.score}%`:'—'}</span>
                      </div>
                      <div style={{height:'3px',background:'rgba(255,255,255,0.06)',borderRadius:'3px',overflow:'hidden'}}>
                        <div style={{height:'100%',background:'#00AAFF',borderRadius:'3px',width:`${m.score}%`,transition:'width 1.2s cubic-bezier(0.34,1.56,0.64,1)'}}/>
                      </div>
                    </div>
                  ))}
                </div>

                {learnings.length>0 && (
                  <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:'16px'}}>
                    <div style={{fontSize:'10px',fontWeight:600,color:'rgba(255,255,255,0.25)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:'12px',fontFamily:'var(--sans)'}}>What Nexa has learned</div>
                    {learnings.slice(0,3).map(l=>(
                      <div key={l.id} style={{display:'flex',gap:'10px',marginBottom:'10px',alignItems:'flex-start'}}>
                        <span style={{
                          fontSize:'10px',fontWeight:600,padding:'2px 7px',borderRadius:'4px',
                          flexShrink:0,height:'fit-content',marginTop:'1px',
                          textTransform:'uppercase',letterSpacing:'0.04em',
                          background:l.source==='performance_analysis'?'rgba(34,197,94,0.08)':'rgba(245,158,11,0.08)',
                          border:`1px solid ${l.source==='performance_analysis'?'rgba(34,197,94,0.20)':'rgba(245,158,11,0.20)'}`,
                          color:l.source==='performance_analysis'?'#22C55E':'#F59E0B',
                          fontFamily:'var(--sans)',
                        }}>
                          {l.insight_type||'insight'}
                        </span>
                        <div style={{fontSize:'12px',color:'rgba(255,255,255,0.40)',lineHeight:1.55,fontFamily:'var(--sans)'}}>
                          {l.insight?.slice(0,90)}{(l.insight?.length||0)>90?'…':''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {brief?.insight && (
                  <div style={{marginTop:'16px',padding:'14px 16px',background:'rgba(0,170,255,0.05)',border:'1px solid rgba(0,170,255,0.15)',borderLeft:'3px solid rgba(0,170,255,0.50)',borderRadius:'0 8px 8px 0'}}>
                    <div style={{fontSize:'10px',fontWeight:600,color:'rgba(0,170,255,0.70)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:'6px',fontFamily:'var(--sans)'}}>Nexa's Insight</div>
                    <div style={{fontSize:'12px',color:'rgba(255,255,255,0.55)',lineHeight:1.65,fontFamily:'var(--sans)'}}>{brief.insight}</div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',padding:'28px 0',gap:'12px'}}>
                <div style={{color:'rgba(255,255,255,0.15)',marginBottom:'4px'}}>{Ic.brain}</div>
                <div style={{fontSize:'14px',fontWeight:600,color:'rgba(255,255,255,0.45)',fontFamily:'var(--sans)'}}>Brand Brain isn't trained yet</div>
                <div style={{fontSize:'12px',color:'rgba(255,255,255,0.25)',lineHeight:1.65,maxWidth:'260px',fontFamily:'var(--sans)'}}>Upload your brand assets and Nexa learns your voice, style, and audience</div>
                <a href="/dashboard/brand" style={{
                  marginTop:'4px',fontSize:'12px',fontWeight:600,
                  color:'#0C0C0C',background:'#FFFFFF',
                  padding:'7px 16px',borderRadius:'8px',
                  textDecoration:'none',display:'inline-flex',
                  alignItems:'center',gap:'6px',
                  transition:'background 0.15s',
                  fontFamily:'var(--sans)',
                }}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.88)'}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='#FFFFFF'}>
                  Train Brand Brain {Ic.arrow}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
