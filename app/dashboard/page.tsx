'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, formatDistanceToNow } from 'date-fns'

const Ic = {
  bolt:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  copy:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  cal:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  brain:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2a2.5 2.5 0 0 1 5 0"/><path d="M9.5 22a2.5 2.5 0 0 0 5 0"/><path d="M14.5 2C17 2 19 4 19 6.5c0 2-1.5 3.5-3.5 4C17 11 19 12.5 19 15c0 2.5-2 4.5-4.5 4.5"/><path d="M9.5 2C7 2 5 4 5 6.5c0 2 1.5 3.5 3.5 4C7 11 5 12.5 5 15c0 2.5 2 4.5 4.5 4.5"/></svg>,
  chart:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18"/><path d="M5 20V14l4-4 4 3 4-6 4 4v9"/></svg>,
  fire:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  arrow:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  check:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  play:    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  warning: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  star:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  close:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>,
}

const AGENTS = [
  { id:'content',    name:'Content Agent',    desc:'Full week of brand posts'          },
  { id:'timing',     name:'Timing Agent',     desc:'Optimal windows for your audience' },
  { id:'insights',   name:'Insights Agent',   desc:'Weekly digest with next steps'     },
  { id:'engagement', name:'Engage Agent',     desc:'Replies in your exact brand voice' },
]

const STATUS_CONFIG: Record<string, { color:string; bg:string; border:string; label:string }> = {
  on_fire:       { color:'#F59E0B', bg:'rgba(245,158,11,0.08)',  border:'rgba(245,158,11,0.20)',  label:'On Fire'     },
  building:      { color:'#00AAFF', bg:'rgba(0,170,255,0.08)',   border:'rgba(0,170,255,0.18)',   label:'Building'    },
  needs_push:    { color:'#F59E0B', bg:'rgba(245,158,11,0.08)',  border:'rgba(245,158,11,0.20)',  label:'Needs Push'  },
  just_starting: { color:'#22C55E', bg:'rgba(34,197,94,0.08)',   border:'rgba(34,197,94,0.18)',   label:'Starting Up' },
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram:'#E1306C', linkedin:'#0A66C2', x:'#E7E7E7',
  tiktok:'#FF0050', general:'#888888',
}

export default function HomePage() {
  const supabase = createClient()

  const [profile,      setProfile]      = useState<any>(null)
  const [workspace,    setWorkspace]    = useState<any>(null)
  const [credits,      setCredits]      = useState<any>(null)
  const [content,      setContent]      = useState<any[]>([])
  const [scheduled,    setScheduled]    = useState<any[]>([])
  const [activity,     setActivity]     = useState<any[]>([])
  const [agentRuns,    setAgentRuns]    = useState<any[]>([])
  const [learnings,    setLearnings]    = useState<any[]>([])
  const [brandData,    setBrandData]    = useState<any>(null)
  const [brief,        setBrief]        = useState<any>(null)
  const [briefLoading, setBriefLoading] = useState(false)
  const [running,      setRunning]      = useState<string|null>(null)
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

    let runs: any[] = [], brand: any = null, lg: any[] = []
    try { const r = await supabase.from('agent_runs').select('*').eq('workspace_id', ws.id).order('created_at',{ascending:false}).limit(20); runs = r.data??[] } catch {}
    try { const r = await supabase.from('brand_assets').select('analysis').eq('workspace_id', ws.id).eq('file_name','nexa_brand_intelligence.json').single(); brand = r.data?.analysis??null } catch {}
    try { const r = await supabase.from('brand_learnings').select('*').eq('workspace_id', ws.id).order('created_at',{ascending:false}).limit(6); lg = r.data??[] } catch {}

    try {
      const { data: agentRunsData } = await supabase.from('agent_runs').select('agent_id, agent_type, status, ran_at').eq('workspace_id', ws.id).order('ran_at',{ascending:false}).limit(20)
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
    setAgentRuns(runs); setBrandData(brand); setLearnings(lg)
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
    setAgentRunning(agentName); setRunning(agentType); setResult(null)
    try {
      const endpoint = ENDPOINTS[agentType]
      const res = endpoint
        ? await fetch(endpoint)
        : await fetch('/api/agents',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspace_id:workspace.id,agent_type:agentType})})
      const data = await res.json()
      const msg = data.success||data.message ? data.message||`${agentName} completed` : `${agentName} — nothing to do right now`
      setAgentResults(prev => ({...prev,[agentName]:msg}))
      setResult({type:agentType,data})
      setTimeout(()=>load(),1000)
    } catch {
      setAgentResults(prev => ({...prev,[agentName]:'Failed — check console'}))
    } finally { setAgentRunning(null); setRunning(null) }
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
    if (type?.includes('generat')||type?.includes('creat')) return 'var(--cyan)'
    if (type?.includes('publish')||type?.includes('schedul')) return 'var(--success)'
    if (type?.includes('agent')) return '#A78BFA'
    if (type?.includes('brand')||type?.includes('analyz')) return 'var(--warning)'
    return 'rgba(255,255,255,0.20)'
  }

  /* ─── Loading ─── */
  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'calc(100vh - var(--topbar-h))',flexDirection:'column',gap:14}}>
      <div className="nexa-spinner" style={{width:24,height:24}}/>
      <div style={{fontSize:12,color:'var(--text-3)',letterSpacing:'0.04em'}}>Loading your workspace</div>
    </div>
  )

  return (
    <div style={{
      padding:'36px 40px 48px',
      height:'calc(100vh - var(--topbar-h))',
      overflowY:'auto', overflowX:'hidden',
      fontFamily:'var(--sans)',
    }}>

      {/* ── PAGE HEADER ── */}
      <div style={{marginBottom:'32px'}}>
        <div style={{fontSize:'11px',fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text-3)',marginBottom:'8px'}}>
          {greeting} · {format(new Date(),'EEEE, MMMM d')}
        </div>
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'16px'}}>
          <div>
            <h1 style={{fontSize:'28px',fontWeight:700,letterSpacing:'-0.03em',color:'var(--text-1)',lineHeight:1.1,marginBottom:'6px'}}>
              {firstName}
              <span style={{fontSize:'14px',fontWeight:400,color:'var(--text-3)',marginLeft:'12px',letterSpacing:'-0.01em'}}>command center</span>
            </h1>
            {briefLoading ? (
              <div style={{display:'flex',alignItems:'center',gap:'8px',height:'20px'}}>
                <div className="processing-dots">
                  <div className="processing-dot"/>
                  <div className="processing-dot"/>
                  <div className="processing-dot"/>
                </div>
                <span style={{fontSize:'12px',color:'var(--text-4)'}}>Reading your brand signals</span>
              </div>
            ) : brief?.headline ? (
              <div style={{fontSize:'14px',color:'var(--text-2)',lineHeight:1.5,maxWidth:'560px',letterSpacing:'-0.01em'}}>
                {brief.headline}
              </div>
            ) : (
              <div style={{fontSize:'13px',color:'var(--text-3)'}}>
                {brandData ? 'Your brand is ready. What are we building today?' : (
                  <span>Brand Brain not trained yet. <a href="/dashboard/brand" style={{color:'var(--cyan)',textDecoration:'none',fontWeight:600}}>Upload assets to get started →</a></span>
                )}
              </div>
            )}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'8px',flexShrink:0}}>
            {brief?.status && (
              <div style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 12px',background:statusCfg.bg,border:`1px solid ${statusCfg.border}`,borderRadius:'var(--r)',fontSize:'12px',fontWeight:600,color:statusCfg.color}}>
                {brief.status==='on_fire' && <span style={{display:'flex'}}>{Ic.fire}</span>}
                {statusCfg.label}
              </div>
            )}
            {streak > 0 && (
              <div style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 12px',background:'var(--warning-dim)',border:'1px solid var(--warning-border)',borderRadius:'var(--r)',fontSize:'12px',fontWeight:600,color:'var(--warning)'}}>
                <span style={{display:'flex'}}>{Ic.fire}</span>
                {streak}d streak
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div style={{
        display:'grid',gridTemplateColumns:'repeat(5,1fr)',
        background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',
        marginBottom:'32px',overflow:'hidden',
        opacity:mounted?1:0,transform:mounted?'translateY(0)':'translateY(8px)',
        transition:'opacity 0.4s ease, transform 0.4s ease',
      }}>
        {[
          { label:'Credits',     value:balance.toLocaleString(), tag:workspace?.plan||'spark',           tagColor:'var(--cyan)',    href:'/dashboard/settings?tab=billing' },
          { label:'Built',       value:totalContent,              tag:`${content.filter(c=>c.status==='published').length} published`, tagColor:'var(--success)', href:'/dashboard/studio'  },
          { label:'Scheduled',   value:scheduled.length,          tag:'upcoming',                        tagColor:'var(--warning)', href:'/dashboard/schedule' },
          { label:'Streak',      value:streak>0?`${streak}d`:'—', tag:streak>0?'keep it up':'start one', tagColor:streak>0?'var(--warning)':'var(--text-4)', href:'/dashboard/schedule' },
          { label:'Voice Score', value:voiceScore>0?`${Math.round(voiceScore)}%`:'—', tag:voiceScore>80?'on brand':voiceScore>60?'good':'train brain', tagColor:voiceScore>80?'var(--success)':voiceScore>60?'var(--warning)':'var(--text-4)', href:'/dashboard/brand' },
        ].map((s,i) => (
          <a key={i} href={s.href} style={{
            textDecoration:'none',padding:'20px 24px',
            borderLeft:i>0?'1px solid var(--border)':'none',
            display:'block',transition:'background 0.15s',
          }}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='var(--elevated)'}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
              <span style={{fontSize:'10px',fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text-3)'}}>{s.label}</span>
              <span style={{fontSize:'10px',fontWeight:600,color:s.tagColor,background:`color-mix(in srgb, ${s.tagColor} 10%, transparent)`,padding:'1px 6px',borderRadius:'4px',letterSpacing:'0.04em',textTransform:'uppercase'}}>
                {s.tag}
              </span>
            </div>
            <div style={{fontSize:'26px',fontWeight:700,letterSpacing:'-0.04em',color:'var(--text-1)',lineHeight:1,fontFamily:"'Geist Mono', monospace"}}>{s.value}</div>
          </a>
        ))}
      </div>

      {/* ── MORNING BRIEF ── */}
      {brief && (
        <div style={{
          display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px',
          marginBottom:'32px',
          opacity:mounted?1:0,transform:mounted?'translateY(0)':'translateY(8px)',
          transition:'opacity 0.4s ease 0.05s, transform 0.4s ease 0.05s',
        }}>
          <div className="card" style={{padding:'20px 24px'}}>
            <div style={{fontSize:'10px',fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text-3)',marginBottom:'10px'}}>Today's Priority</div>
            <div style={{fontSize:'13px',fontWeight:500,color:'var(--text-1)',lineHeight:1.6}}>{brief.todays_priority}</div>
          </div>
          {brief.todays_angle && (
            <a href={`/dashboard/studio${brief.todays_angle?`?angle=${encodeURIComponent(brief.todays_angle)}`:''}`}
              className="card"
              style={{padding:'20px 24px',textDecoration:'none',display:'block',transition:'border-color 0.15s'}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor='var(--border-strong)'}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor='var(--border)'}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
                <div style={{fontSize:'10px',fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text-3)'}}>Write This Today</div>
                <span style={{color:'var(--text-4)',display:'flex'}}>{Ic.arrow}</span>
              </div>
              <div style={{fontSize:'13px',fontWeight:500,color:'var(--text-1)',lineHeight:1.6}}>{brief.todays_angle}</div>
              {brief.todays_platform && <div style={{fontSize:'11px',color:'var(--text-3)',marginTop:'8px',textTransform:'capitalize'}}>Best on {brief.todays_platform}</div>}
            </a>
          )}
          <div className="card" style={{padding:'20px 24px'}}>
            <div style={{fontSize:'10px',fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text-3)',marginBottom:'10px'}}>One Thing</div>
            <div style={{fontSize:'13px',fontWeight:500,color:'var(--text-1)',lineHeight:1.6}}>{brief.one_thing}</div>
          </div>
        </div>
      )}

      {/* ── VOICE DRIFT WARNING ── */}
      {(brief?.warning || (voiceDrift?.drift_detected && voiceDrift.drift_severity !== 'none')) && (
        <div style={{
          display:'flex',alignItems:'flex-start',gap:'12px',padding:'16px 20px',
          background:'var(--warning-dim)',border:'1px solid var(--warning-border)',borderRadius:'var(--r)',
          marginBottom:'32px',
        }}>
          <span style={{display:'flex',color:'var(--warning)',flexShrink:0,marginTop:'1px'}}>{Ic.warning}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:'13px',fontWeight:600,color:'var(--warning)',marginBottom:'4px'}}>Voice Drift Detected</div>
            <div style={{fontSize:'12px',color:'var(--text-2)',lineHeight:1.55}}>{voiceDrift?.alert_message||brief?.warning}</div>
          </div>
          <a href="/dashboard/brand" style={{flexShrink:0,fontSize:'12px',fontWeight:600,color:'var(--warning)',textDecoration:'none',padding:'6px 12px',background:'rgba(245,158,11,0.10)',border:'1px solid rgba(245,158,11,0.20)',borderRadius:'var(--r-sm)',whiteSpace:'nowrap'}}>Recalibrate</a>
        </div>
      )}

      {/* ── MAIN GRID: Agents + Queue ── */}
      <div style={{
        display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px',
        opacity:mounted?1:0,transform:mounted?'translateY(0)':'translateY(8px)',
        transition:'opacity 0.4s ease 0.10s, transform 0.4s ease 0.10s',
      }}>

        {/* Agents */}
        <div className="card" style={{padding:'24px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px'}}>
            <div>
              <div style={{fontSize:'16px',fontWeight:600,letterSpacing:'-0.02em',color:'var(--text-1)',marginBottom:'3px'}}>Agents</div>
              <div style={{fontSize:'12px',color:'var(--text-3)'}}>One click. Nexa executes.</div>
            </div>
            <a href="/dashboard/automate" style={{fontSize:'12px',fontWeight:500,color:'var(--text-3)',textDecoration:'none',display:'flex',alignItems:'center',gap:'4px',transition:'color 0.15s'}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='var(--text-1)'}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color='var(--text-3)'}>
              View all <span style={{display:'flex'}}>{Ic.arrow}</span>
            </a>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
            {AGENTS.map(agent => {
              const isRunning = agentRunning === agent.name
              const lastRunStr = agentLastRuns[agent.id]
              const resultMsg = agentResults[agent.name]
              return (
                <div key={agent.id} style={{
                  display:'flex',alignItems:'center',gap:'12px',
                  padding:'12px 16px',borderRadius:'var(--r)',
                  background:isRunning?'var(--cyan-dim)':'rgba(255,255,255,0.03)',
                  border:`1px solid ${isRunning?'var(--cyan-border)':'var(--border-subtle)'}`,
                  transition:'all 0.15s',
                }}
                  onMouseEnter={e=>{ if(!isRunning){ (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.borderColor='var(--border)' }}}
                  onMouseLeave={e=>{ if(!isRunning){ (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.03)'; (e.currentTarget as HTMLElement).style.borderColor='var(--border-subtle)' }}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:'13px',fontWeight:500,color:'var(--text-1)',marginBottom:'2px'}}>{agent.name}</div>
                    <div style={{fontSize:'11px',color:'var(--text-3)',lineHeight:1.4}}>
                      {resultMsg ? <span style={{color:'var(--success)'}}>{resultMsg}</span>
                        : lastRunStr ? `Last run ${lastRunStr}`
                        : agent.desc}
                    </div>
                  </div>
                  <button onClick={()=>runAgent(agent.id,agent.name)} disabled={!!agentRunning}
                    style={{
                      display:'flex',alignItems:'center',gap:'5px',padding:'6px 12px',
                      borderRadius:'var(--r-sm)',fontSize:'11px',fontWeight:600,
                      fontFamily:'var(--sans)',
                      background:isRunning?'var(--cyan)':'transparent',
                      border:`1px solid ${isRunning?'transparent':'var(--border)'}`,
                      color:isRunning?'#0C0C0C':'var(--text-3)',
                      cursor:agentRunning?'not-allowed':'pointer',transition:'all 0.15s',
                    }}
                    onMouseEnter={e=>{ if(!agentRunning){ (e.currentTarget as HTMLElement).style.borderColor='var(--border-strong)'; (e.currentTarget as HTMLElement).style.color='var(--text-1)' }}}
                    onMouseLeave={e=>{ if(!agentRunning&&!isRunning){ (e.currentTarget as HTMLElement).style.borderColor='var(--border)'; (e.currentTarget as HTMLElement).style.color='var(--text-3)' }}}>
                    {isRunning ? (<><div className="nexa-spinner" style={{width:'10px',height:'10px'}}/>Running</>) : (<><span style={{display:'flex'}}>{Ic.play}</span>Run</>)}
                  </button>
                </div>
              )
            })}
          </div>

          {result && (
            <div style={{marginTop:'16px',padding:'14px 16px',background:'var(--success-dim)',border:'1px solid var(--success-border)',borderRadius:'var(--r)',animation:'pageUp 0.3s ease both'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'6px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                  <span style={{display:'flex',color:'var(--success)'}}>{Ic.check}</span>
                  <span style={{fontSize:'12px',fontWeight:600,color:'var(--success)'}}>{AGENTS.find(a=>a.id===result.type)?.name} completed</span>
                </div>
                <button onClick={()=>setResult(null)} style={{background:'none',border:'none',color:'var(--text-3)',cursor:'pointer',display:'flex'}}>{Ic.close}</button>
              </div>
              <div style={{fontSize:'12px',color:'var(--text-2)',lineHeight:1.6}}>
                {result.data.posts?.length>0 ? <>{result.data.posts.length} posts saved as drafts. <a href="/dashboard/studio" style={{color:'var(--cyan)',textDecoration:'none',fontWeight:600}}>Open Studio →</a></>
                  : result.data.insights?.summary ? <>{result.data.insights.summary} <a href="/dashboard/insights" style={{color:'var(--cyan)',textDecoration:'none',fontWeight:600}}>See report →</a></>
                  : result.data.message||'Completed.'}
              </div>
            </div>
          )}
        </div>

        {/* Queue + Quick Actions */}
        <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>

          {/* Queue */}
          <div className="card" style={{padding:'24px',flex:1}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px'}}>
              <div>
                <div style={{fontSize:'16px',fontWeight:600,letterSpacing:'-0.02em',color:'var(--text-1)',marginBottom:'3px'}}>Queue</div>
                <div style={{fontSize:'12px',color:'var(--text-3)'}}>
                  {scheduled.length>0?`${scheduled.length} post${scheduled.length!==1?'s':''} scheduled`:'Queue is clear'}
                </div>
              </div>
              <a href="/dashboard/schedule" style={{fontSize:'12px',fontWeight:500,color:'var(--text-3)',textDecoration:'none',display:'flex',alignItems:'center',gap:'4px',transition:'color 0.15s'}}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='var(--text-1)'}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color='var(--text-3)'}>
                Manage <span style={{display:'flex'}}>{Ic.arrow}</span>
              </a>
            </div>

            {scheduled.length>0 ? (
              <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                {scheduled.map(item=>(
                  <div key={item.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',background:'rgba(255,255,255,0.02)',border:'1px solid var(--border-subtle)',borderRadius:'var(--r-sm)'}}>
                    <div style={{width:'6px',height:'6px',borderRadius:'50%',flexShrink:0,background:PLATFORM_COLORS[item.platform]||'#888'}}/>
                    <span style={{fontSize:'12px',color:'var(--text-2)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.title||item.body?.slice(0,45)||'Post'}</span>
                    <span style={{fontSize:'11px',color:'var(--text-3)',flexShrink:0}}>{item.scheduled_for?format(new Date(item.scheduled_for),'MMM d · ha'):'—'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{padding:'24px 0'}}>
                <div className="empty-state-title">Nothing queued yet</div>
                <div className="empty-state-desc">Schedule your first post to see it appear here</div>
                <a href="/dashboard/studio" className="btn-primary" style={{marginTop:'4px',fontSize:'12px',padding:'7px 16px',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:'6px'}}>
                  Create a post <span style={{display:'flex'}}>{Ic.arrow}</span>
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
              <a key={a.label} href={a.href} style={{
                display:'flex',flexDirection:'column',gap:'10px',
                padding:'16px',background:'var(--surface)',border:'1px solid var(--border)',
                borderRadius:'var(--r)',textDecoration:'none',transition:'all 0.15s',
              }}
                onMouseEnter={e=>{ const el=e.currentTarget as HTMLElement; el.style.background='var(--elevated)'; el.style.borderColor='var(--border-strong)' }}
                onMouseLeave={e=>{ const el=e.currentTarget as HTMLElement; el.style.background='var(--surface)'; el.style.borderColor='var(--border)' }}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{color:'var(--text-3)',display:'flex'}}>{a.icon}</div>
                  <div style={{color:'var(--text-4)',display:'flex'}}>{Ic.arrow}</div>
                </div>
                <div>
                  <div style={{fontSize:'12px',fontWeight:600,color:'var(--text-1)',letterSpacing:'-0.01em',marginBottom:'2px'}}>{a.label}</div>
                  <div style={{fontSize:'11px',color:'var(--text-3)'}}>{a.sub}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW: Activity + Brand Intelligence ── */}
      <div style={{
        display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',
        opacity:mounted?1:0,transform:mounted?'translateY(0)':'translateY(8px)',
        transition:'opacity 0.4s ease 0.15s, transform 0.4s ease 0.15s',
      }}>

        {/* Activity */}
        <div className="card" style={{padding:'24px'}}>
          <div style={{marginBottom:'20px'}}>
            <div style={{fontSize:'16px',fontWeight:600,letterSpacing:'-0.02em',color:'var(--text-1)',marginBottom:'3px'}}>Activity</div>
            <div style={{fontSize:'12px',color:'var(--text-3)'}}>Everything happening in real time</div>
          </div>
          {activity.length>0 ? (
            <div style={{display:'flex',flexDirection:'column'}}>
              {activity.slice(0,7).map((item,i)=>(
                <div key={item.id} style={{display:'flex',alignItems:'flex-start',gap:'12px',padding:'10px 0',borderBottom:i<6?'1px solid var(--border-subtle)':'none'}}>
                  <div style={{width:'6px',height:'6px',borderRadius:'50%',flexShrink:0,marginTop:'5px',background:actColor(item.type)}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:'12px',color:'var(--text-2)',lineHeight:1.5,letterSpacing:'-0.01em'}}>{item.title}</div>
                    <div style={{fontSize:'11px',color:'var(--text-3)',marginTop:'2px'}}>{item.created_at?formatDistanceToNow(new Date(item.created_at))+' ago':''}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{padding:'28px 0'}}>
              <div className="empty-state-title">No activity yet</div>
              <div className="empty-state-desc">Every generation, publish, and run appears here as it happens</div>
            </div>
          )}
        </div>

        {/* Brand Intelligence */}
        <div className="card" style={{padding:'24px'}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'20px'}}>
            <div>
              <div style={{fontSize:'16px',fontWeight:600,letterSpacing:'-0.02em',color:'var(--text-1)',marginBottom:'3px'}}>Brand Intelligence</div>
              <div style={{fontSize:'12px',color:'var(--text-3)'}}>{brandData?'Active — learning from every generation':'Not yet trained'}</div>
            </div>
            <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
              {brandData && (
                <div style={{display:'flex',alignItems:'center',gap:'5px'}}>
                  <div className="dot-green"/>
                  <span style={{fontSize:'11px',color:'var(--success)',fontWeight:600}}>Active</span>
                </div>
              )}
              {brandData && (
                <button onClick={checkVoiceDrift} className="btn-secondary" style={{fontSize:'11px',padding:'5px 10px'}}>
                  Check drift
                </button>
              )}
            </div>
          </div>

          {brandData ? (
            <div>
              <div style={{display:'flex',flexDirection:'column',gap:'14px',marginBottom:'20px'}}>
                {[
                  { label:'Voice match',  score:brandData.voice_match_score||voiceScore||0  },
                  { label:'Audience fit', score:brandData.audience_fit_score||0             },
                  { label:'Visual style', score:brandData.visual_style_score||0             },
                ].map(m=>(
                  <div key={m.label}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
                      <span style={{fontSize:'12px',color:'var(--text-3)'}}>{m.label}</span>
                      <span style={{fontSize:'12px',fontWeight:600,color:'var(--text-1)'}}>{m.score>0?`${m.score}%`:'—'}</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{width:`${m.score}%`}}/>
                    </div>
                  </div>
                ))}
              </div>

              {learnings.length>0 && (
                <div style={{borderTop:'1px solid var(--border)',paddingTop:'16px'}}>
                  <div style={{fontSize:'10px',fontWeight:600,color:'var(--text-3)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:'12px'}}>
                    What Nexa has learned
                  </div>
                  {learnings.slice(0,3).map(l=>(
                    <div key={l.id} style={{display:'flex',gap:'10px',marginBottom:'10px',alignItems:'flex-start'}}>
                      <span className={`badge ${l.source==='performance_analysis'?'badge-success':'badge-warning'}`}>
                        {l.insight_type||'insight'}
                      </span>
                      <div style={{fontSize:'12px',color:'var(--text-3)',lineHeight:1.55}}>
                        {l.insight?.slice(0,90)}{(l.insight?.length||0)>90?'…':''}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {brief?.insight && (
                <div style={{marginTop:'16px',padding:'14px 16px',background:'var(--cyan-dim)',border:'1px solid var(--cyan-border)',borderRadius:'var(--r)'}}>
                  <div style={{fontSize:'10px',fontWeight:600,color:'var(--cyan)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:'6px'}}>Nexa's Insight</div>
                  <div style={{fontSize:'12px',color:'var(--text-2)',lineHeight:1.6}}>{brief.insight}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state" style={{padding:'24px 0'}}>
              <div style={{color:'var(--text-4)',marginBottom:'4px'}}>{Ic.brain}</div>
              <div className="empty-state-title">Brand Brain isn't trained yet</div>
              <div className="empty-state-desc">Upload your brand assets and Nexa learns your voice, style, and audience</div>
              <a href="/dashboard/brand" className="btn-primary" style={{marginTop:'4px',fontSize:'12px',padding:'7px 16px',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:'6px'}}>
                Train Brand Brain <span style={{display:'flex'}}>{Ic.arrow}</span>
              </a>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
