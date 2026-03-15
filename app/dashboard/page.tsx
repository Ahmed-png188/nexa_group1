'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, formatDistanceToNow } from 'date-fns'

/* ── Icons ── */
const Ic = {
  copy:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15.5 5.5L18.5 8.5L8 19H5V16L15.5 5.5z"/><path d="M13 8l3 3"/></svg>,
  clock:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  msg:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  chart:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18"/><path d="M5 20V14l4-4 4 3 4-6 4 4v9"/></svg>,
  bolt:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  arrow:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  eye:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  star:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  play:    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  check:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  cal:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  brand:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4"/></svg>,
}

const AGENTS = [
  { id:'content',    name:'Content Agent',   desc:'Generates a week of brand-aligned posts',    icon:'copy',  color:'#0EA5FF', bg:'rgba(14,165,255,0.08)',  border:'rgba(14,165,255,0.18)',  cost:'Free' },
  { id:'timing',     name:'Timing Agent',    desc:'Finds optimal posting windows for your ICP', icon:'clock', color:'#00E5A0', bg:'rgba(0,229,160,0.06)',   border:'rgba(0,229,160,0.16)',   cost:'Free' },
  { id:'engagement', name:'Engagement Agent',desc:'Drafts replies in your exact brand voice',   icon:'msg',   color:'#FF6B2B', bg:'rgba(255,107,43,0.06)',  border:'rgba(255,107,43,0.16)',  cost:'Free' },
  { id:'insights',   name:'Insights Agent',  desc:'Weekly performance digest with next steps',  icon:'chart', color:'#A78BFA', bg:'rgba(167,139,250,0.06)', border:'rgba(167,139,250,0.16)', cost:'Free' },
]

/* ── Stat card ── */
function StatCard({ label, value, sub, color, accent }: any) {
  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--line)', borderRadius:14, padding:'18px 20px', display:'flex', flexDirection:'column', gap:0, transition:'border-color .15s', cursor:'default' }}
      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor='var(--line2)'}
      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor='var(--line)'}>
      <div style={{ fontSize:10, fontWeight:700, color:'rgba(244,240,255,0.35)', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:10 }}>{label}</div>
      <div style={{ fontFamily:'var(--display)', fontSize:32, fontWeight:800, letterSpacing:'-0.04em', color:color||'var(--t1)', lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'rgba(244,240,255,0.35)', marginTop:6 }}>{sub}</div>}
      {accent && <div style={{ marginTop:10, height:2, borderRadius:2, background:`linear-gradient(90deg, ${accent}, transparent)`, width:'60%' }}/>}
    </div>
  )
}

/* ── Section header ── */
function SectionHeader({ label, action, href }: any) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
      <div style={{ fontSize:11, fontWeight:700, color:'rgba(244,240,255,0.35)', letterSpacing:'.07em', textTransform:'uppercase' }}>{label}</div>
      {action && <a href={href||'#'} style={{ fontSize:11, fontWeight:600, color:'var(--cyan)', textDecoration:'none', display:'flex', alignItems:'center', gap:4, opacity:0.8 }}
        onMouseEnter={e=>(e.currentTarget as HTMLElement).style.opacity='1'} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.opacity='0.8'}>
        {action} <span style={{ display:'flex' }}>{Ic.arrow}</span>
      </a>}
    </div>
  )
}

export default function DashboardHome() {
  const supabase = createClient()
  const [workspace,        setWorkspace]        = useState<any>(null)
  const [profile,          setProfile]          = useState<any>(null)
  const [credits,          setCredits]          = useState<any>(null)
  const [recentContent,    setRecentContent]    = useState<any[]>([])
  const [activity,         setActivity]         = useState<any[]>([])
  const [scheduledContent, setScheduledContent] = useState<any[]>([])
  const [conversations,    setConversations]    = useState<any[]>([])
  const [agentRuns,        setAgentRuns]        = useState<any[]>([])
  const [brandLearnings,   setBrandLearnings]   = useState<any[]>([])
  const [brandProfile,     setBrandProfile]     = useState<any>(null)
  const [runningAgent,     setRunningAgent]     = useState<string|null>(null)
  const [agentResult,      setAgentResult]      = useState<any>(null)
  const [loading,          setLoading]          = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return
    const { data:p }  = await supabase.from('profiles').select('*').eq('id', user.id).single()
    const { data:m }  = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id', user.id).limit(1).single()
    const ws = (m as any)?.workspaces
    setProfile(p); setWorkspace(ws)

    const [crRes, ctRes, acRes, scRes, cvRes] = await Promise.all([
      supabase.from('credits').select('balance,lifetime_used').eq('workspace_id', ws?.id).single(),
      supabase.from('content').select('*').eq('workspace_id', ws?.id).order('created_at',{ascending:false}).limit(6),
      supabase.from('activity').select('*').eq('workspace_id', ws?.id).order('created_at',{ascending:false}).limit(8),
      supabase.from('content').select('*').eq('workspace_id', ws?.id).eq('status','scheduled').order('scheduled_for',{ascending:true}).limit(4),
      supabase.from('conversations').select('*').eq('workspace_id', ws?.id).order('updated_at',{ascending:false}).limit(5),
    ])

    let agRes = { data: [] as any[] }
    let lgRes = { data: [] as any[] }
    let bpRes = { data: null as any }
    try { const r = await supabase.from('agent_runs').select('*').eq('workspace_id',ws?.id).order('created_at',{ascending:false}).limit(10); agRes = { data: r.data??[] } } catch {}
    try { const r = await supabase.from('brand_learnings').select('*').eq('workspace_id',ws?.id).order('created_at',{ascending:false}).limit(10); lgRes = { data: r.data??[] } } catch {}
    try { const r = await supabase.from('brand_assets').select('analysis').eq('workspace_id',ws?.id).eq('file_name','nexa_brand_intelligence.json').single(); bpRes = { data: r.data } } catch {}

    setCredits(crRes.data)
    setRecentContent(ctRes.data??[])
    setActivity(acRes.data??[])
    setScheduledContent(scRes.data??[])
    setConversations(cvRes.data??[])
    setAgentRuns(agRes.data??[])
    setBrandLearnings(lgRes.data??[])
    if (bpRes.data?.analysis) setBrandProfile(bpRes.data.analysis)
    setLoading(false)

    supabase.channel('home-rt')
      .on('postgres_changes',{event:'*',schema:'public',table:'activity',filter:`workspace_id=eq.${ws?.id}`},()=>load())
      .on('postgres_changes',{event:'*',schema:'public',table:'credits',filter:`workspace_id=eq.${ws?.id}`},(p:any)=>{ if(p.new?.balance!==undefined) setCredits((c:any)=>({...c,balance:p.new.balance})) })
      .subscribe()
  }

  async function runAgent(agentId: string) {
    if (!workspace || runningAgent) return
    setRunningAgent(agentId); setAgentResult(null)
    try {
      const res = await fetch('/api/agents',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ workspace_id:workspace.id, agent_type:agentId }) })
      const data = await res.json()
      try { await supabase.from('agent_runs').insert({ workspace_id:workspace.id, agent_type:agentId, status:data.success?'completed':'failed', result:data, items_created:data.posts?.length||0 }) } catch {}
      setAgentResult({ type:agentId, data })
      await load()
    } catch (err) { console.error(err) }
    setRunningAgent(null)
  }

  const hour      = new Date().getHours()
  const greeting  = hour<12?'Good morning':hour<17?'Good afternoon':'Good evening'
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  const actColor = (type:string) => {
    if (type.includes('generat')||type.includes('analyz')) return 'var(--cyan)'
    if (type.includes('publish')||type.includes('connect')) return 'var(--green)'
    if (type.includes('agent')) return 'var(--purple)'
    if (type.includes('brand')) return 'var(--orange)'
    return 'rgba(244,240,255,0.3)'
  }

  /* ── Sparkline bars (mini chart) ── */
  const sparkData = [3,7,5,9,6,11,8,14,10,13,16,12]

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'rgba(244,240,255,0.3)', fontSize:13 }}>
      Loading your workspace…
    </div>
  )

  return (
    <div style={{ padding:'24px 28px', overflowY:'auto', height:'calc(100vh - var(--topbar-h))', background:'var(--bg)' }}>

      {/* ── HERO HEADER — the Ofinans gradient moment ── */}
      <div style={{ borderRadius:18, overflow:'hidden', marginBottom:16, position:'relative', background:'linear-gradient(135deg,#080c18 0%,#0b0818 35%,#170910 65%,#1c0c05 100%)', border:'1px solid rgba(255,255,255,0.07)', animation:'fadeUp 0.4s ease both' }}>
        {/* Gradient orbs */}
        <div style={{ position:'absolute', top:-60, left:80, width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle,rgba(14,165,255,0.32) 0%,transparent 65%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:-40, left:'38%', width:220, height:220, borderRadius:'50%', background:'radial-gradient(circle,rgba(123,111,255,0.28) 0%,transparent 65%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:-20, right:80, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,107,43,0.22) 0%,transparent 65%)', pointerEvents:'none' }}/>

        <div style={{ position:'relative', zIndex:1, padding:'24px 28px' }}>
          <div style={{ fontSize:11, fontWeight:600, color:'rgba(244,240,255,0.38)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:5 }}>{greeting}</div>
          <div style={{ fontFamily:'var(--display)', fontSize:26, fontWeight:800, letterSpacing:'-0.04em', color:'#F4F0FF', marginBottom:20 }}>{firstName}'s Workspace</div>

          {/* 4 stat boxes inline */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:18, gap:0 }}>
            {[
              { label:'Credits', value:credits?.balance?.toLocaleString()??'0', tag:'+active', tagC:'#00E5A0', href:'/dashboard/settings?tab=billing' },
              { label:'Content created', value:recentContent.length.toString(), tag:`${recentContent.filter(c=>c.status==='published').length} published`, tagC:'#0EA5FF', href:'/dashboard/studio' },
              { label:'Scheduled', value:scheduledContent.length.toString(), tag:'upcoming', tagC:'#FFB547', href:'/dashboard/schedule' },
              { label:'Agent runs', value:agentRuns.length.toString(), tag:'total', tagC:'#A78BFA', href:'/dashboard/automate' },
            ].map((s,i)=>(
              <a key={i} href={s.href} style={{ textDecoration:'none', padding:`0 ${i>0?'20px':'0'} 0 ${i>0?'20px':'0'}`, borderLeft:i>0?'1px solid rgba(255,255,255,0.07)':'none' }}>
                <div style={{ fontSize:10, color:'rgba(244,240,255,0.38)', marginBottom:5, display:'flex', alignItems:'center', gap:6 }}>
                  {s.label}
                  <span style={{ color:s.tagC, fontWeight:700 }}>↑ {s.tag}</span>
                </div>
                <div style={{ fontFamily:'var(--display)', fontSize:28, fontWeight:800, letterSpacing:'-0.04em', color:'#F4F0FF', lineHeight:1 }}>{s.value}</div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>

        {/* ── Agents ── */}
        <div style={{ background:'var(--card)', border:'1px solid var(--line)', borderRadius:16, padding:'18px 20px', animation:'fadeUp 0.4s ease 0.06s both' }}>
          <SectionHeader label="AI Agents" action="View all" href="/dashboard/automate"/>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {AGENTS.map(agent => {
              const lastRun = agentRuns.find(r => r.agent_type===agent.id)
              const running = runningAgent===agent.id
              return (
                <div key={agent.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', background:running?agent.bg:'rgba(255,255,255,0.025)', border:`1px solid ${running?agent.border:'rgba(255,255,255,0.06)'}`, borderRadius:11, transition:'all .2s' }}
                  onMouseEnter={e=>{ if(!running){ (e.currentTarget as HTMLElement).style.background=agent.bg; (e.currentTarget as HTMLElement).style.borderColor=agent.border }}}
                  onMouseLeave={e=>{ if(!running){ (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.025)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.06)' }}}>
                  <div style={{ width:32, height:32, borderRadius:9, background:agent.bg, border:`1px solid ${agent.border}`, display:'flex', alignItems:'center', justifyContent:'center', color:agent.color, flexShrink:0 }}>
                    {(Ic as any)[agent.icon]}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'rgba(244,240,255,0.85)', marginBottom:2 }}>{agent.name}</div>
                    <div style={{ fontSize:10, color:'rgba(244,240,255,0.35)' }}>
                      {lastRun ? `Last run ${formatDistanceToNow(new Date(lastRun.created_at))} ago` : agent.desc}
                    </div>
                  </div>
                  <button onClick={() => runAgent(agent.id)} disabled={!!runningAgent}
                    style={{ padding:'5px 13px', borderRadius:7, fontSize:11, fontWeight:700, fontFamily:'var(--sans)', background:running?agent.color:'rgba(255,255,255,0.06)', border:`1px solid ${running?'transparent':'rgba(255,255,255,0.09)'}`, color:running?'#000':'rgba(244,240,255,0.5)', cursor:runningAgent?'not-allowed':'pointer', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:5, transition:'all .15s' }}>
                    {running ? (
                      <><div style={{ width:8, height:8, border:`1.5px solid ${running?'rgba(0,0,0,0.3)':'rgba(244,240,255,0.3)'}`, borderTopColor:running?'#000':'rgba(244,240,255,0.7)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>Running</>
                    ) : <><span style={{ display:'flex' }}>{Ic.play}</span>Run</>}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Agent result */}
          {agentResult && (
            <div style={{ marginTop:12, padding:'12px 14px', background:'rgba(14,165,255,0.05)', border:'1px solid rgba(14,165,255,0.15)', borderRadius:10, animation:'fadeUp 0.25s ease both' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ display:'flex', color:'var(--green)' }}>{Ic.check}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:'var(--green)' }}>{AGENTS.find(a=>a.id===agentResult.type)?.name} completed</span>
                </div>
                <button onClick={()=>setAgentResult(null)} style={{ background:'none', border:'none', color:'rgba(244,240,255,0.3)', cursor:'pointer', fontSize:14 }}>✕</button>
              </div>
              {agentResult.type==='content' && agentResult.data.posts?.length>0 && (
                <div style={{ fontSize:12, color:'rgba(244,240,255,0.5)' }}>
                  {agentResult.data.posts.length} posts saved as drafts. <a href="/dashboard/studio" style={{ color:'var(--cyan)', textDecoration:'none' }}>View in Studio →</a>
                </div>
              )}
              {agentResult.type==='insights' && agentResult.data.insights?.summary && (
                <div style={{ fontSize:12, color:'rgba(244,240,255,0.6)', lineHeight:1.6 }}>{agentResult.data.insights.summary}</div>
              )}
            </div>
          )}
        </div>

        {/* ── Scheduled Queue + Conversations ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* Queue */}
          <div style={{ background:'var(--card)', border:'1px solid var(--line)', borderRadius:16, padding:'18px 20px', flex:1, animation:'fadeUp 0.4s ease 0.12s both' }}>
            <SectionHeader label="Scheduled Queue" action="Manage" href="/dashboard/schedule"/>
            {scheduledContent.length>0 ? scheduledContent.map(item=>(
              <div key={item.id} style={{ display:'flex', alignItems:'center', gap:9, marginBottom:8, padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.05)', transition:'border-color .15s' }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.1)'}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.05)'}>
                <div style={{ width:24, height:24, borderRadius:6, background:'rgba(14,165,255,0.08)', border:'1px solid rgba(14,165,255,0.14)', fontSize:8, fontWeight:700, color:'var(--cyan)', display:'flex', alignItems:'center', justifyContent:'center', textTransform:'uppercase', flexShrink:0 }}>
                  {item.platform?.slice(0,2)||'ge'}
                </div>
                <span style={{ fontSize:12, color:'rgba(244,240,255,0.6)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.title??item.body?.slice(0,40)??'Post'}</span>
                <span style={{ fontSize:10, color:'rgba(244,240,255,0.3)', flexShrink:0, display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ display:'flex' }}>{Ic.cal}</span>
                  {item.scheduled_for ? format(new Date(item.scheduled_for),'MMM d') : 'Soon'}
                </span>
              </div>
            )) : (
              <div style={{ textAlign:'center', padding:'16px 0', fontSize:12, color:'rgba(244,240,255,0.25)', lineHeight:1.7 }}>
                Nothing queued.<br/>
                <a href="/dashboard/studio" style={{ color:'var(--cyan)', textDecoration:'none', fontWeight:600 }}>Create your first post →</a>
              </div>
            )}
          </div>

          {/* Recent chats */}
          <div style={{ background:'var(--card)', border:'1px solid var(--line)', borderRadius:16, padding:'18px 20px', animation:'fadeUp 0.4s ease 0.18s both' }}>
            <SectionHeader label="Recent Chats" />
            {conversations.length>0 ? conversations.slice(0,3).map(conv=>(
              <div key={conv.id} style={{ display:'flex', alignItems:'center', gap:9, padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width:26, height:26, borderRadius:7, background:'rgba(167,139,250,0.08)', border:'1px solid rgba(167,139,250,0.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--purple)', flexShrink:0 }}>{Ic.msg}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:500, color:'rgba(244,240,255,0.7)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{conv.title||'Chat session'}</div>
                  <div style={{ fontSize:10, color:'rgba(244,240,255,0.28)', marginTop:1 }}>{conv.message_count||0} messages · {formatDistanceToNow(new Date(conv.updated_at||conv.created_at))} ago</div>
                </div>
              </div>
            )) : (
              <div style={{ fontSize:12, color:'rgba(244,240,255,0.25)', textAlign:'center', padding:'12px 0' }}>
                Conversations with Nexa AI appear here automatically.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>

        {/* Activity feed */}
        <div style={{ background:'var(--card)', border:'1px solid var(--line)', borderRadius:16, padding:'18px 20px', animation:'fadeUp 0.4s ease 0.24s both' }}>
          <SectionHeader label="Activity Feed"/>
          {activity.length>0 ? activity.slice(0,6).map(item=>(
            <div key={item.id} style={{ display:'flex', alignItems:'flex-start', gap:10, paddingBottom:10, marginBottom:10, borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:actColor(item.type), marginTop:5, flexShrink:0 }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, color:'rgba(244,240,255,0.65)', lineHeight:1.45 }}>{item.title}</div>
                <div style={{ fontSize:10, color:'rgba(244,240,255,0.28)', marginTop:2 }}>{formatDistanceToNow(new Date(item.created_at))} ago</div>
              </div>
            </div>
          )) : (
            <div style={{ fontSize:12, color:'rgba(244,240,255,0.25)', textAlign:'center', padding:'20px 0' }}>
              Activity appears as you use Nexa.
            </div>
          )}
        </div>

        {/* Brand intelligence */}
        <div style={{ background:'var(--card)', border:'1px solid var(--line)', borderRadius:16, padding:'18px 20px', animation:'fadeUp 0.4s ease 0.30s both' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'rgba(244,240,255,0.35)', letterSpacing:'.07em', textTransform:'uppercase' }}>Brand Intelligence</div>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              {brandProfile && <><div className="dot-green" style={{ width:5, height:5 }}/><span style={{ fontSize:10, color:'var(--green)', fontWeight:600 }}>Active</span></>}
              <a href="/dashboard/brand" style={{ fontSize:11, fontWeight:600, color:'var(--cyan)', textDecoration:'none', marginLeft:8, opacity:0.8 }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.opacity='1'} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.opacity='0.8'}>
                Manage →
              </a>
            </div>
          </div>

          {brandProfile ? (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { label:'Voice match',  val:brandProfile.voice_match_score||88,   color:'linear-gradient(90deg,#0EA5FF,#7B6FFF)' },
                { label:'Audience fit', val:brandProfile.audience_fit_score||85,  color:'linear-gradient(90deg,#00E5A0,#0EA5FF)' },
                { label:'Visual style', val:brandProfile.visual_style_score||92,  color:'linear-gradient(90deg,#A78BFA,#FF6B2B)' },
              ].map(m=>(
                <div key={m.label}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:11, color:'rgba(244,240,255,0.45)' }}>{m.label}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:'rgba(244,240,255,0.75)' }}>{m.val}%</span>
                  </div>
                  <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ width:`${m.val}%`, height:'100%', background:m.color, borderRadius:3, transition:'width 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}/>
                  </div>
                </div>
              ))}
              {brandLearnings.length>0 && (
                <div style={{ marginTop:4, paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize:10, color:'rgba(244,240,255,0.28)', marginBottom:8, textTransform:'uppercase', letterSpacing:'.06em', fontWeight:700 }}>Recent learnings</div>
                  {brandLearnings.slice(0,2).map(l=>(
                    <div key={l.id} style={{ display:'flex', gap:7, marginBottom:7 }}>
                      <span style={{ fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:3, background:'rgba(255,107,43,0.08)', border:'1px solid rgba(255,107,43,0.18)', color:'var(--orange)', flexShrink:0, height:'fit-content', marginTop:1, textTransform:'uppercase' }}>{l.insight_type}</span>
                      <div style={{ fontSize:11, color:'rgba(244,240,255,0.5)', lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{l.insight}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ fontSize:12, color:'rgba(244,240,255,0.3)', marginBottom:12, lineHeight:1.7 }}>
                Nexa learns your brand with every asset you upload. The more it knows, the sharper every generation.
              </div>
              <a href="/dashboard/brand" style={{ fontSize:12, fontWeight:700, color:'var(--cyan)', textDecoration:'none', padding:'8px 18px', background:'rgba(14,165,255,0.07)', border:'1px solid rgba(14,165,255,0.18)', borderRadius:9, display:'inline-block', transition:'all .15s' }}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(14,165,255,0.12)';(e.currentTarget as HTMLElement).style.borderColor='rgba(14,165,255,0.3)'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(14,165,255,0.07)';(e.currentTarget as HTMLElement).style.borderColor='rgba(14,165,255,0.18)'}}>
                Build Brand Brain →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick actions row ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginTop:12, animation:'fadeUp 0.4s ease 0.36s both' }}>
        {[
          { label:'Generate content', href:'/dashboard/studio',   icon:'copy',  color:'#0EA5FF' },
          { label:'Build strategy',   href:'/dashboard/strategy', icon:'star',  color:'#A78BFA' },
          { label:'Schedule posts',   href:'/dashboard/schedule', icon:'cal',   color:'#FF6B2B' },
          { label:'Brand Brain',      href:'/dashboard/brand',    icon:'brand', color:'#00E5A0' },
        ].map(a=>(
          <a key={a.label} href={a.href} style={{ display:'flex', alignItems:'center', gap:9, padding:'12px 16px', background:'var(--card)', border:'1px solid var(--line)', borderRadius:12, fontSize:13, fontWeight:600, color:'rgba(244,240,255,0.55)', textDecoration:'none', transition:'all .15s' }}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=`${a.color}33`;(e.currentTarget as HTMLElement).style.color=a.color;(e.currentTarget as HTMLElement).style.background=`${a.color}08`}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--line)';(e.currentTarget as HTMLElement).style.color='rgba(244,240,255,0.55)';(e.currentTarget as HTMLElement).style.background='var(--card)'}}>
            <span style={{ color:a.color, display:'flex' }}>{(Ic as any)[a.icon]}</span>
            {a.label}
          </a>
        ))}
      </div>
    </div>
  )
}
