'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type TabId = 'overview'|'content'|'email'|'platforms'

const PLAT_COLORS: Record<string,string> = {
  instagram:'#E1306C', linkedin:'#0A66C2', x:'#E7E7E7',
  tiktok:'#FF0050',    email:'#4D9FFF',    general:'#888',
}

const Ic = {
  chart:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18"/><path d="M5 20V14l4-4 4 3 4-6 4 4v9"/></svg>,
  bolt:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  refresh: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  dl:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  eye:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  heart:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  msg:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  users:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  arrow:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
}

const TABS = [
  { id:'overview'  as TabId, label:'Overview',  color:'#4D9FFF' },
  { id:'content'   as TabId, label:'Content',   color:'#A78BFA' },
  { id:'email'     as TabId, label:'Email',      color:'#34D399' },
  { id:'platforms' as TabId, label:'Platforms',  color:'#FF7A40' },
]

function MetricCard({ icon, label, value, sub, color, trend }: any) {
  const isPos = trend>0; const isNeg = trend<0
  return (
    <div style={{ padding:'16px 18px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:13 }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12 }}>
        <div style={{ width:30,height:30,borderRadius:8,background:`${color}14`,border:`1px solid ${color}28`,display:'flex',alignItems:'center',justifyContent:'center',color,flexShrink:0 }}>{icon}</div>
        {trend!==undefined && (
          <span style={{ fontSize:11,fontWeight:700,color:isPos?'#34D399':isNeg?'#FF5757':'rgba(255,255,255,0.35)' }}>
            {isPos?'↑':isNeg?'↓':''}{Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ fontFamily:'var(--display)',fontSize:26,fontWeight:800,letterSpacing:'-0.04em',color:'rgba(255,255,255,0.9)',lineHeight:1,marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:11,color:'rgba(255,255,255,0.35)',fontWeight:500 }}>{label}</div>
      {sub && <div style={{ fontSize:10,color:'rgba(255,255,255,0.25)',marginTop:3 }}>{sub}</div>}
    </div>
  )
}

function Bar({ pct, color }: { pct:number; color:string }) {
  return (
    <div style={{ height:3,background:'rgba(255,255,255,0.06)',borderRadius:3,overflow:'hidden',marginTop:5 }}>
      <div style={{ height:'100%',width:`${Math.min(100,pct)}%`,background:color,borderRadius:3,transition:'width 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}/>
    </div>
  )
}

export default function InsightsPage() {
  const supabase = createClient()
  const [ws,        setWs]        = useState<any>(null)
  const [insights,  setInsights]  = useState<any>(null)
  const [loading,   setLoading]   = useState(true)
  const [period,    setPeriod]    = useState(30)
  const [tab,       setTab]       = useState<TabId>('overview')
  const [aiText,    setAiText]    = useState<string|null>(null)
  const [explaining,setExplaining]= useState(false)
  const [syncing,   setSyncing]   = useState(false)
  const [connPlats, setConnPlats] = useState<any[]>([])

  useEffect(() => { load() }, [period])

  async function load() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return
    const { data:m } = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id',user.id).limit(1).single()
    const w = (m as any)?.workspaces; setWs(w)
    const [{ data:ins }, { data:plats }] = await Promise.all([
      supabase.from('analytics').select('*').eq('workspace_id',w?.id).gte('date',new Date(Date.now()-period*86400000).toISOString().split('T')[0]).order('date',{ascending:false}),
      supabase.from('platform_connections').select('*').eq('workspace_id',w?.id).eq('is_active',true),
    ])
    if (ins&&ins.length>0) {
      const agg = ins.reduce((acc:any,row:any)=>({
        impressions:(acc.impressions||0)+(row.impressions||0),
        reach:(acc.reach||0)+(row.reach||0),
        engagement:(acc.engagement||0)+(row.engagement||0),
        clicks:(acc.clicks||0)+(row.clicks||0),
        posts_created:(acc.posts_created||0)+(row.posts_created||0),
        followers_gained:(acc.followers_gained||0)+(row.followers_gained||0),
        email_opens:(acc.email_opens||0)+(row.email_opens||0),
        email_clicks:(acc.email_clicks||0)+(row.email_clicks||0),
        email_sent:(acc.email_sent||0)+(row.email_sent||0),
      }),{})
      setInsights({ ...agg, by_platform:ins, raw:ins })
    }
    setConnPlats(plats??[]); setLoading(false)
  }

  async function syncData() {
    if (!ws||syncing) return; setSyncing(true)
    try { await fetch('/api/sync-platform-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspace_id:ws.id})}); await load() } catch {}
    setSyncing(false)
  }

  async function getAiExplanation() {
    if (!ws||explaining||!insights) return; setExplaining(true)
    try {
      const r = await fetch('/api/get-insights',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspace_id:ws.id,period,metrics:insights})})
      const d = await r.json()
      if (d.explanation) setAiText(d.explanation)
    } catch {}
    setExplaining(false)
  }

  function fmt(n:number) { return n>=1000?`${(n/1000).toFixed(1)}K`:String(n||0) }
  function rate(a:number,b:number) { return b>0?`${((a/b)*100).toFixed(1)}%`:'—' }

  const activeColor = TABS.find(t=>t.id===tab)?.color??'#4D9FFF'

  return (
    <>
      <style>{`
        @keyframes insUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes insSpin{to{transform:rotate(360deg)}}
        .itab:hover{background:rgba(255,255,255,0.05)!important;}
        .row:hover{background:rgba(255,255,255,0.04)!important;}
      `}</style>

      <div style={{ padding:'24px 28px',overflowY:'auto',height:'calc(100vh - var(--topbar-h))' }}>

        {/* Header */}
        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:20,animation:'insUp .4s ease both' }}>
          <div>
            <h1 style={{ fontFamily:'var(--display)',fontSize:22,fontWeight:800,letterSpacing:'-0.04em',color:'rgba(255,255,255,0.92)',lineHeight:1,marginBottom:4 }}>Insights</h1>
            <p style={{ fontSize:12,color:'rgba(255,255,255,0.3)' }}>Last {period} days · {connPlats.length} platform{connPlats.length!==1?'s':''} connected</p>
          </div>
          <div style={{ display:'flex',gap:6,alignItems:'center' }}>
            {/* Period pills */}
            <div style={{ display:'flex',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,padding:3,gap:2 }}>
              {[7,30,90].map(d=>(
                <button key={d} onClick={()=>setPeriod(d)}
                  style={{ padding:'5px 12px',borderRadius:8,fontSize:12,fontWeight:period===d?700:500,background:period===d?'rgba(255,255,255,0.08)':'transparent',border:`1px solid ${period===d?'rgba(255,255,255,0.12)':'transparent'}`,color:period===d?'rgba(255,255,255,0.85)':'rgba(255,255,255,0.35)',cursor:'pointer',fontFamily:'var(--sans)',transition:'all .15s' }}>
                  {d}d
                </button>
              ))}
            </div>
            <button onClick={syncData} disabled={syncing}
              style={{ display:'flex',alignItems:'center',gap:6,padding:'7px 14px',fontSize:12,fontWeight:600,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.5)',borderRadius:9,cursor:'pointer',fontFamily:'var(--sans)',transition:'all .15s' }}>
              <span style={{ display:'flex',animation:syncing?'insSpin .8s linear infinite':'none' }}>{Ic.refresh}</span>
              {syncing?'Syncing…':'Sync'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex',gap:2,marginBottom:22,background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:4,animation:'insUp .4s ease .05s both' }}>
          {TABS.map(t=>{
            const on=tab===t.id
            return (
              <button key={t.id} className="itab" onClick={()=>setTab(t.id)}
                style={{ flex:1,padding:'8px 6px',borderRadius:9,border:`1px solid ${on?`${t.color}28`:'transparent'}`,background:on?`${t.color}10`:'transparent',color:on?t.color:'rgba(255,255,255,0.32)',cursor:'pointer',fontSize:12,fontWeight:on?700:500,fontFamily:'var(--sans)',transition:'all .15s' }}>
                {t.label}
              </button>
            )
          })}
        </div>

        {loading && <div style={{ textAlign:'center',padding:'40px',color:'rgba(255,255,255,0.3)',fontSize:13 }}>Loading analytics…</div>}

        {!loading && !insights && (
          <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'50vh',textAlign:'center',padding:'40px 20px' }}>
            <div style={{ width:56,height:56,borderRadius:14,background:'rgba(77,159,255,0.07)',border:'1px solid rgba(77,159,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',color:'#4D9FFF',marginBottom:18 }}>{Ic.chart}</div>
            <h3 style={{ fontFamily:'var(--display)',fontSize:18,fontWeight:800,letterSpacing:'-0.03em',marginBottom:8,color:'rgba(255,255,255,0.85)' }}>No analytics yet</h3>
            <p style={{ fontSize:13,color:'rgba(255,255,255,0.35)',lineHeight:1.7,maxWidth:380,marginBottom:22 }}>Connect your social platforms to start tracking impressions, engagement, and audience growth in real time.</p>
            <button onClick={syncData}
              style={{ display:'flex',alignItems:'center',gap:8,padding:'12px 24px',fontSize:13,fontWeight:700,background:'#4D9FFF',color:'#000',border:'none',borderRadius:10,cursor:'pointer',fontFamily:'var(--sans)',boxShadow:'0 4px 16px rgba(77,159,255,0.3)',letterSpacing:'-0.01em' }}>
              <span style={{ display:'flex' }}>{Ic.refresh}</span>Sync platforms
            </button>
          </div>
        )}

        {!loading && insights && (
          <>
            {/* ── OVERVIEW ── */}
            {tab==='overview' && (
              <div style={{ animation:'insUp .3s ease both' }}>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',gap:8,marginBottom:20 }}>
                  <MetricCard icon={Ic.eye}   label="Impressions"   value={fmt(insights.impressions)} color="#4D9FFF"  trend={12}/>
                  <MetricCard icon={Ic.users} label="Reach"         value={fmt(insights.reach)}       color="#A78BFA"  trend={8}/>
                  <MetricCard icon={Ic.heart} label="Engagements"   value={fmt(insights.engagement)}  color="#FF7A40"  trend={-3}/>
                  <MetricCard icon={Ic.arrow} label="Link clicks"   value={fmt(insights.clicks)}      color="#34D399"  trend={22}/>
                  <MetricCard icon={Ic.chart} label="Posts created" value={fmt(insights.posts_created||0)} color="#FFB547" trend={0}/>
                  <MetricCard icon={Ic.users} label="New followers" value={fmt(insights.followers_gained||0)} color="#FF5757" trend={5}/>
                </div>

                {/* AI explanation */}
                {aiText ? (
                  <div style={{ padding:'16px 18px',background:'rgba(77,159,255,0.06)',border:'1px solid rgba(77,159,255,0.18)',borderRadius:12,marginBottom:16,animation:'insUp .3s ease both' }}>
                    <div style={{ fontSize:9,fontWeight:700,color:'#4D9FFF',letterSpacing:'.09em',textTransform:'uppercase',marginBottom:8 }}>AI Analysis</div>
                    <div style={{ fontSize:13,color:'rgba(255,255,255,0.65)',lineHeight:1.7 }}>{aiText}</div>
                  </div>
                ) : (
                  <button onClick={getAiExplanation} disabled={explaining}
                    style={{ display:'flex',alignItems:'center',gap:7,padding:'9px 18px',fontSize:12,fontWeight:600,background:'rgba(77,159,255,0.06)',border:'1px solid rgba(77,159,255,0.18)',color:'#4D9FFF',borderRadius:9,cursor:'pointer',fontFamily:'var(--sans)',marginBottom:16,transition:'all .15s' }}>
                    <span style={{ display:'flex',animation:explaining?'insSpin .8s linear infinite':'none' }}>{Ic.bolt}</span>
                    {explaining?'Analyzing…':'Explain my performance with AI'}
                  </button>
                )}

                {/* Engagement rate */}
                {insights.reach>0 && (
                  <div style={{ padding:'16px 18px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12 }}>
                    <div style={{ fontSize:9,fontWeight:700,letterSpacing:'.09em',textTransform:'uppercase',color:'rgba(255,255,255,0.28)',marginBottom:12 }}>Engagement rates</div>
                    {[
                      { label:'Overall engagement rate', pct:(insights.engagement/insights.reach)*100, color:'#4D9FFF' },
                      { label:'Click-through rate',       pct:(insights.clicks/insights.impressions)*100, color:'#34D399' },
                    ].map(m=>(
                      <div key={m.label} style={{ marginBottom:12 }}>
                        <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}>
                          <span style={{ fontSize:12,color:'rgba(255,255,255,0.55)' }}>{m.label}</span>
                          <span style={{ fontSize:12,fontWeight:700,color:'rgba(255,255,255,0.8)' }}>{m.pct.toFixed(1)}%</span>
                        </div>
                        <Bar pct={m.pct} color={m.color}/>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── CONTENT ── */}
            {tab==='content' && (
              <div style={{ animation:'insUp .3s ease both' }}>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',gap:8,marginBottom:20 }}>
                  <MetricCard icon={Ic.chart} label="Posts created"   value={fmt(insights.posts_created||0)}              color="#A78BFA"/>
                  <MetricCard icon={Ic.eye}   label="Total impressions"value={fmt(insights.impressions)}                   color="#4D9FFF"/>
                  <MetricCard icon={Ic.heart} label="Total engagements"value={fmt(insights.engagement)}                   color="#FF7A40"/>
                  <MetricCard icon={Ic.users} label="Avg per post"     value={insights.posts_created>0?fmt(Math.round(insights.impressions/insights.posts_created)):'—'} color="#34D399"/>
                </div>
                {insights.raw?.slice(0,10).map((row:any,i:number)=>(
                  <div key={i} className="row" style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,transition:'background .15s',marginBottom:4 }}>
                    <div style={{ width:7,height:7,borderRadius:'50%',background:PLAT_COLORS[row.platform]||'#888',flexShrink:0 }}/>
                    <div style={{ flex:1,fontSize:12,color:'rgba(255,255,255,0.62)' }}>{row.date?.slice(0,10)||'—'}</div>
                    <div style={{ fontSize:12,color:'rgba(255,255,255,0.5)',minWidth:80,textAlign:'right' }}>{fmt(row.impressions||0)} imp</div>
                    <div style={{ fontSize:12,color:'rgba(255,255,255,0.5)',minWidth:80,textAlign:'right' }}>{fmt(row.engagement||0)} eng</div>
                    <div style={{ fontSize:10,color:PLAT_COLORS[row.platform]||'rgba(255,255,255,0.3)',fontWeight:600,minWidth:70,textAlign:'right',textTransform:'capitalize' }}>{row.platform||'—'}</div>
                  </div>
                ))}
              </div>
            )}

            {/* ── EMAIL ── */}
            {tab==='email' && (
              <div style={{ animation:'insUp .3s ease both' }}>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',gap:8,marginBottom:20 }}>
                  <MetricCard icon={Ic.msg}   label="Emails sent"  value={fmt(insights.email_sent||0)}                                  color="#34D399"/>
                  <MetricCard icon={Ic.eye}   label="Opens"        value={fmt(insights.email_opens||0)}                                  color="#4D9FFF"  trend={7}/>
                  <MetricCard icon={Ic.arrow} label="Clicks"       value={fmt(insights.email_clicks||0)}                                 color="#A78BFA"/>
                  <MetricCard icon={Ic.chart} label="Open rate"    value={rate(insights.email_opens||0,insights.email_sent||0)}          color="#FFB547"/>
                </div>
                {(insights.email_sent||0)===0 && (
                  <div style={{ textAlign:'center',padding:'32px',color:'rgba(255,255,255,0.25)',fontSize:13,border:'1px dashed rgba(255,255,255,0.07)',borderRadius:12 }}>
                    No email data yet. Connect your email provider to track opens and clicks.
                  </div>
                )}
              </div>
            )}

            {/* ── PLATFORMS ── */}
            {tab==='platforms' && (
              <div style={{ animation:'insUp .3s ease both' }}>
                {connPlats.length>0 ? (
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:10 }}>
                    {connPlats.map(plat=>{
                      const color = PLAT_COLORS[plat.platform]||'#888'
                      const platData = insights.raw?.filter((r:any)=>r.platform===plat.platform)||[]
                      const totImp = platData.reduce((a:number,r:any)=>a+(r.impressions||0),0)
                      const totEng = platData.reduce((a:number,r:any)=>a+(r.engagement||0),0)
                      return (
                        <div key={plat.id} style={{ padding:'16px 18px',background:'rgba(255,255,255,0.03)',border:`1px solid ${color}18`,borderRadius:13 }}>
                          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:14 }}>
                            <div style={{ width:8,height:8,borderRadius:'50%',background:color,boxShadow:`0 0 7px ${color}` }}/>
                            <span style={{ fontSize:13,fontWeight:700,color:'rgba(255,255,255,0.85)',textTransform:'capitalize' }}>{plat.platform}</span>
                            {plat.account_name && <span style={{ fontSize:10,color:'rgba(255,255,255,0.3)',marginLeft:'auto' }}>{plat.account_name}</span>}
                          </div>
                          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
                            <div style={{ padding:'10px 12px',background:'rgba(0,0,0,0.2)',borderRadius:9 }}>
                              <div style={{ fontFamily:'var(--display)',fontSize:18,fontWeight:800,color:'rgba(255,255,255,0.85)',letterSpacing:'-0.03em',lineHeight:1 }}>{fmt(totImp)}</div>
                              <div style={{ fontSize:10,color:'rgba(255,255,255,0.3)',marginTop:3 }}>Impressions</div>
                            </div>
                            <div style={{ padding:'10px 12px',background:'rgba(0,0,0,0.2)',borderRadius:9 }}>
                              <div style={{ fontFamily:'var(--display)',fontSize:18,fontWeight:800,color:'rgba(255,255,255,0.85)',letterSpacing:'-0.03em',lineHeight:1 }}>{fmt(totEng)}</div>
                              <div style={{ fontSize:10,color:'rgba(255,255,255,0.3)',marginTop:3 }}>Engagements</div>
                            </div>
                          </div>
                          {totImp>0 && <Bar pct={(totEng/totImp)*100} color={color}/>}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign:'center',padding:'40px',color:'rgba(255,255,255,0.25)',fontSize:13 }}>
                    No platforms connected. Go to{' '}
                    <a href="/dashboard/schedule?view=platforms" style={{ color:'#4D9FFF',textDecoration:'none',fontWeight:600 }}>Schedule → Platforms</a> to connect.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
