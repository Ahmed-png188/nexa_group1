'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, addMonths, subMonths, parseISO } from 'date-fns'

type Platform = 'instagram'|'linkedin'|'x'|'tiktok'|'email'|'general'
type ViewMode  = 'calendar'|'queue'|'platforms'

const PLAT_COLOR: Record<string,string> = {
  instagram:'#E1306C', linkedin:'#0A66C2', x:'#E7E7E7',
  tiktok:'#FF0050',    email:'#4D9FFF',    general:'#888',
}
const PLAT_LABEL: Record<string,string> = {
  instagram:'Instagram', linkedin:'LinkedIn', x:'X',
  tiktok:'TikTok',       email:'Email',       general:'General',
}

/* ── Icons ── */
const Ic = {
  cal:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  list:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  link:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  plus:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  check:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  edit:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  chevL:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>,
  chevR:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>,
  close:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
}

const DAYS_OF_WEEK = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

/* ── Platform dot ── */
function PlatDot({ platform, size=6 }: { platform:string; size?:number }) {
  return <div style={{ width:size, height:size, borderRadius:'50%', background:PLAT_COLOR[platform]||'#888', flexShrink:0 }}/>
}

function SchedulePageInner() {
  const supabase     = createClient()
  const searchParams = useSearchParams()

  const [ws,            setWs]         = useState<any>(null)
  const [view,          setView]       = useState<ViewMode>('calendar')
  const [month,         setMonth]      = useState(new Date())
  const [posts,         setPosts]      = useState<any[]>([])
  const [drafts,        setDrafts]     = useState<any[]>([])
  const [connPlatforms, setConnPlats]  = useState<any[]>([])
  const [loading,       setLoading]    = useState(true)
  const [selDay,        setSelDay]     = useState<Date|null>(null)
  const [showModal,     setShowModal]  = useState(false)
  const [modalPost,     setModalPost]  = useState<any>(null)
  const [toast,         setToast]      = useState<{msg:string;type:'success'|'error'}|null>(null)

  // form
  const [fPlatform, setFPlatform] = useState<Platform>('instagram')
  const [fDate,     setFDate]     = useState('')
  const [fTime,     setFTime]     = useState('09:00')
  const [fBody,     setFBody]     = useState('')
  const [fTitle,    setFTitle]    = useState('')
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)

  function showToast(msg:string, type:'success'|'error'='success') { setToast({msg,type}); setTimeout(()=>setToast(null),4000) }

  useEffect(() => {
    const conn = searchParams.get('connected')
    if (conn) showToast(`${PLAT_LABEL[conn]||conn} connected!`)
    loadData()
  }, [])

  async function loadData() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return
    const { data:m } = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id',user.id).limit(1).single()
    const w = (m as any)?.workspaces
    setWs(w)
    const [{ data:sched }, { data:draft }, { data:plat }] = await Promise.all([
      supabase.from('content').select('*').eq('workspace_id',w?.id).eq('status','scheduled').order('scheduled_for',{ascending:true}),
      supabase.from('content').select('*').eq('workspace_id',w?.id).eq('status','draft').order('created_at',{ascending:false}).limit(20),
      supabase.from('platform_connections').select('*').eq('workspace_id',w?.id).eq('is_active',true),
    ])
    setPosts(sched??[]); setDrafts(draft??[]); setConnPlats(plat??[]); setLoading(false)
    supabase.channel('schedule-rt')
      .on('postgres_changes',{event:'*',schema:'public',table:'content',filter:`workspace_id=eq.${w?.id}`},()=>loadData())
      .subscribe()
  }

  async function schedulePost() {
    if (!fBody.trim()||!fDate||saving) return
    setSaving(true)
    const dt = new Date(`${fDate}T${fTime}:00`)
    try {
      const r = await fetch('/api/schedule-post',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspace_id:ws.id,platform:fPlatform,body:fBody,title:fTitle,scheduled_for:dt.toISOString()})})
      if (r.ok) { setSaved(true); showToast('Post scheduled'); setFBody(''); setFTitle(''); setTimeout(()=>{setShowModal(false);setSaved(false)},1200) }
      else showToast('Failed to schedule','error')
    } catch { showToast('Error','error') }
    setSaving(false)
  }

  async function publishNow(postId:string) {
    try {
      const r = await fetch('/api/schedule-post',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({content_id:postId,action:'publish'})})
      if (r.ok) { showToast('Published!'); loadData() }
      else showToast('Failed to publish','error')
    } catch { showToast('Error','error') }
  }

  async function deletePost(postId:string) {
    await supabase.from('content').delete().eq('id',postId)
    showToast('Deleted'); loadData()
  }

  function openScheduleForDay(day:Date) {
    setFDate(format(day,'yyyy-MM-dd'))
    setShowModal(true); setModalPost(null)
  }

  function openScheduleForDraft(draft:any) {
    setFBody(draft.body||''); setFTitle(draft.title||''); setFPlatform(draft.platform||'instagram')
    setShowModal(true); setModalPost(draft)
  }

  const days      = eachDayOfInterval({ start:startOfMonth(month), end:endOfMonth(month) })
  const startPad  = days[0].getDay()
  const postsOnDay= (d:Date) => posts.filter(p=>p.scheduled_for&&isSameDay(parseISO(p.scheduled_for),d))
  const upcoming  = posts.filter(p=>p.scheduled_for&&new Date(p.scheduled_for)>=new Date())

  return (
    <>
      <style>{`
        @keyframes schedUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes schedSpin{to{transform:rotate(360deg)}}
        .cal-day:hover{background:rgba(255,255,255,0.05)!important;}
        .q-row:hover{background:rgba(255,255,255,0.04)!important;}
        .draft-row:hover{background:rgba(255,255,255,0.04)!important;}
        input[type="date"],input[type="time"],input[type="text"],textarea,select{color-scheme:dark;}
      `}</style>

      <div style={{ padding:'24px 28px', overflowY:'auto', height:'calc(100vh - var(--topbar-h))' }}>

        {/* ── Header ── */}
        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:20,animation:'schedUp .4s ease both' }}>
          <div>
            <h1 style={{ fontFamily:'var(--display)',fontSize:22,fontWeight:800,letterSpacing:'-0.04em',color:'rgba(255,255,255,0.92)',lineHeight:1,marginBottom:4 }}>Schedule</h1>
            <p style={{ fontSize:12,color:'rgba(255,255,255,0.3)' }}>{upcoming.length} post{upcoming.length!==1?'s':''} queued · {connPlatforms.length} platform{connPlatforms.length!==1?'s':''} connected</p>
          </div>
          <div style={{ display:'flex',gap:8,alignItems:'center' }}>
            {/* View toggle */}
            <div style={{ display:'flex',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,padding:3,gap:2 }}>
              {([{v:'calendar' as ViewMode,i:Ic.cal},{v:'queue' as ViewMode,i:Ic.list},{v:'platforms' as ViewMode,i:Ic.link}]).map(({v,i})=>(
                <button key={v} onClick={()=>setView(v)}
                  style={{ width:32,height:30,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',border:`1px solid ${view===v?'rgba(255,255,255,0.12)':'transparent'}`,background:view===v?'rgba(255,255,255,0.08)':'transparent',color:view===v?'rgba(255,255,255,0.85)':'rgba(255,255,255,0.35)',cursor:'pointer',transition:'all .15s' }}>
                  {i}
                </button>
              ))}
            </div>
            {/* New post */}
            <button onClick={()=>{setShowModal(true);setModalPost(null);setFBody('');setFTitle('');setFDate(format(new Date(),'yyyy-MM-dd'))}}
              style={{ display:'flex',alignItems:'center',gap:7,padding:'8px 16px',fontSize:13,fontWeight:700,background:'#4D9FFF',color:'#000',border:'none',borderRadius:10,cursor:'pointer',fontFamily:'var(--sans)',boxShadow:'0 4px 16px rgba(77,159,255,0.3)',transition:'all .2s',letterSpacing:'-0.01em' }}>
              <span style={{ display:'flex' }}>{Ic.plus}</span>New post
            </button>
          </div>
        </div>

        {/* ══════════ CALENDAR VIEW ══════════ */}
        {view==='calendar' && (
          <div style={{ animation:'schedUp .35s ease both' }}>
            {/* Month nav */}
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16 }}>
              <button onClick={()=>setMonth(subMonths(month,1))}
                style={{ width:32,height:32,borderRadius:8,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.09)',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,0.5)',cursor:'pointer',transition:'all .15s' }}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.85)'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.5)'}}>
                {Ic.chevL}
              </button>
              <div style={{ fontFamily:'var(--display)',fontSize:16,fontWeight:800,letterSpacing:'-0.03em',color:'rgba(255,255,255,0.88)' }}>
                {format(month,'MMMM yyyy')}
              </div>
              <button onClick={()=>setMonth(addMonths(month,1))}
                style={{ width:32,height:32,borderRadius:8,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.09)',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,0.5)',cursor:'pointer',transition:'all .15s' }}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.85)'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.5)'}}>
                {Ic.chevR}
              </button>
            </div>

            {/* Day-of-week headers */}
            <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4,marginBottom:4 }}>
              {DAYS_OF_WEEK.map(d=>(
                <div key={d} style={{ textAlign:'center',fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.25)',letterSpacing:'.07em',textTransform:'uppercase',padding:'4px 0' }}>{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4 }}>
              {/* Padding cells */}
              {Array.from({length:startPad}).map((_,i)=>(
                <div key={`pad-${i}`} style={{ minHeight:80,borderRadius:10 }}/>
              ))}
              {/* Day cells */}
              {days.map(day=>{
                const dayPosts = postsOnDay(day)
                const today    = isToday(day)
                const selected = selDay && isSameDay(day,selDay)
                const inMonth  = isSameMonth(day,month)
                return (
                  <div key={day.toISOString()} className="cal-day"
                    onClick={()=>{ setSelDay(selected?null:day); if(!selected)openScheduleForDay(day) }}
                    style={{ minHeight:88,padding:'8px 8px',borderRadius:10,background:selected?'rgba(77,159,255,0.08)':today?'rgba(255,255,255,0.04)':'rgba(255,255,255,0.02)',border:`1px solid ${selected?'rgba(77,159,255,0.28)':today?'rgba(255,255,255,0.12)':'rgba(255,255,255,0.06)'}`,cursor:'pointer',transition:'all .15s',opacity:inMonth?1:0.35 }}>
                    {/* Day number */}
                    <div style={{ width:24,height:24,borderRadius:7,background:today?'#4D9FFF':'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--display)',fontSize:12,fontWeight:today?800:600,color:today?'#000':'rgba(255,255,255,0.6)',marginBottom:5,letterSpacing:'-0.02em' }}>
                      {format(day,'d')}
                    </div>
                    {/* Post dots */}
                    <div style={{ display:'flex',flexDirection:'column',gap:3 }}>
                      {dayPosts.slice(0,3).map((p,i)=>(
                        <div key={p.id} style={{ display:'flex',alignItems:'center',gap:4,padding:'2px 5px',borderRadius:5,background:PLAT_COLOR[p.platform]?`${PLAT_COLOR[p.platform]}18`:'rgba(255,255,255,0.05)' }}
                          onClick={e=>{e.stopPropagation();setModalPost(p);setShowModal(true)}}>
                          <PlatDot platform={p.platform} size={5}/>
                          <span style={{ fontSize:9,color:'rgba(255,255,255,0.55)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',lineHeight:1.2 }}>
                            {p.title||p.body?.slice(0,18)||'Post'}
                          </span>
                        </div>
                      ))}
                      {dayPosts.length>3 && (
                        <div style={{ fontSize:9,color:'rgba(255,255,255,0.35)',paddingLeft:5 }}>+{dayPosts.length-3} more</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ══════════ QUEUE VIEW ══════════ */}
        {view==='queue' && (
          <div style={{ animation:'schedUp .35s ease both' }}>
            {/* Scheduled */}
            <div style={{ marginBottom:28 }}>
              <div style={{ fontSize:9,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'rgba(255,255,255,0.25)',marginBottom:12 }}>Scheduled · {upcoming.length}</div>
              {upcoming.length>0 ? upcoming.map(post=>(
                <div key={post.id} className="q-row"
                  style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:11,marginBottom:6,transition:'background .15s' }}>
                  <PlatDot platform={post.platform} size={7}/>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:12.5,fontWeight:600,color:'rgba(255,255,255,0.8)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                      {post.title||post.body?.slice(0,60)||'Post'}
                    </div>
                    <div style={{ display:'flex',gap:8,alignItems:'center',marginTop:3 }}>
                      <span style={{ fontSize:10,color:`${PLAT_COLOR[post.platform]}cc`,fontWeight:600 }}>{PLAT_LABEL[post.platform]||post.platform}</span>
                      <span style={{ fontSize:10,color:'rgba(255,255,255,0.28)' }}>
                        {post.scheduled_for ? format(parseISO(post.scheduled_for),'MMM d, h:mm a') : ''}
                      </span>
                    </div>
                  </div>
                  <div style={{ display:'flex',gap:5 }}>
                    <button onClick={()=>publishNow(post.id)} title="Publish now"
                      style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 11px',borderRadius:7,fontSize:11,fontWeight:600,background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.2)',color:'#34D399',cursor:'pointer',fontFamily:'var(--sans)',transition:'all .15s' }}>
                      <span style={{ display:'flex' }}>{Ic.check}</span>Publish
                    </button>
                    <button onClick={()=>deletePost(post.id)} title="Delete"
                      style={{ width:30,height:30,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',background:'transparent',border:'1px solid rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.3)',cursor:'pointer',transition:'all .15s' }}
                      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(255,87,87,0.3)';(e.currentTarget as HTMLElement).style.color='#FF5757'}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.07)';(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.3)'}}>
                      {Ic.trash}
                    </button>
                  </div>
                </div>
              )) : (
                <div style={{ textAlign:'center',padding:'32px',color:'rgba(255,255,255,0.25)',fontSize:13,border:'1px dashed rgba(255,255,255,0.07)',borderRadius:12 }}>
                  Nothing scheduled yet.{' '}
                  <button onClick={()=>setShowModal(true)} style={{ background:'none',border:'none',color:'#4D9FFF',cursor:'pointer',fontFamily:'var(--sans)',fontSize:13,fontWeight:600 }}>
                    Schedule your first post →
                  </button>
                </div>
              )}
            </div>

            {/* Drafts */}
            {drafts.length>0 && (
              <div>
                <div style={{ fontSize:9,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'rgba(255,255,255,0.25)',marginBottom:12 }}>Drafts · {drafts.length}</div>
                {drafts.map(draft=>(
                  <div key={draft.id} className="draft-row"
                    style={{ display:'flex',alignItems:'center',gap:12,padding:'11px 14px',background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:11,marginBottom:5,transition:'background .15s' }}>
                    <PlatDot platform={draft.platform||'general'} size={7}/>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:12.5,color:'rgba(255,255,255,0.6)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                        {draft.title||draft.body?.slice(0,60)||'Draft'}
                      </div>
                      <div style={{ fontSize:10,color:'rgba(255,255,255,0.25)',marginTop:2 }}>
                        {PLAT_LABEL[draft.platform]||'General'} · Draft
                      </div>
                    </div>
                    <button onClick={()=>openScheduleForDraft(draft)}
                      style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 11px',borderRadius:7,fontSize:11,fontWeight:600,background:'rgba(77,159,255,0.08)',border:'1px solid rgba(77,159,255,0.2)',color:'#4D9FFF',cursor:'pointer',fontFamily:'var(--sans)',transition:'all .15s' }}>
                      <span style={{ display:'flex' }}>{Ic.cal}</span>Schedule
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════ PLATFORMS VIEW ══════════ */}
        {view==='platforms' && (
          <div style={{ animation:'schedUp .35s ease both' }}>
            <div style={{ fontSize:9,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'rgba(255,255,255,0.25)',marginBottom:14 }}>Connected platforms</div>

            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))',gap:10,marginBottom:24 }}>
              {(['instagram','linkedin','x','tiktok','email'] as const).map(plat=>{
                const conn = connPlatforms.find(p=>p.platform===plat)
                const color= PLAT_COLOR[plat]
                return (
                  <div key={plat} style={{ padding:'16px 18px',background:conn?`${color}08`:'rgba(255,255,255,0.025)',border:`1px solid ${conn?`${color}28`:'rgba(255,255,255,0.07)'}`,borderRadius:14,transition:'all .15s' }}>
                    <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12 }}>
                      <div style={{ display:'flex',alignItems:'center',gap:9 }}>
                        <div style={{ width:8,height:8,borderRadius:'50%',background:conn?color:'rgba(255,255,255,0.15)',boxShadow:conn?`0 0 8px ${color}`:' none' }}/>
                        <span style={{ fontSize:13,fontWeight:700,color:conn?'rgba(255,255,255,0.88)':'rgba(255,255,255,0.4)' }}>{PLAT_LABEL[plat]}</span>
                      </div>
                      {conn && <span style={{ fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:100,background:`${color}14`,border:`1px solid ${color}28`,color }}>{conn.status||'active'}</span>}
                    </div>
                    {conn ? (
                      <div>
                        <div style={{ fontSize:11,color:'rgba(255,255,255,0.38)',marginBottom:10 }}>
                          {conn.account_name||conn.account_id||'Connected'}
                        </div>
                        <div style={{ display:'flex',gap:6 }}>
                          <div style={{ flex:1,padding:'8px 10px',background:'rgba(0,0,0,0.2)',borderRadius:8,textAlign:'center' }}>
                            <div style={{ fontFamily:'var(--display)',fontSize:16,fontWeight:800,color:'rgba(255,255,255,0.75)',letterSpacing:'-0.03em' }}>
                              {posts.filter(p=>p.platform===plat).length}
                            </div>
                            <div style={{ fontSize:9,color:'rgba(255,255,255,0.28)',marginTop:1 }}>queued</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <a href={`/api/oauth/${plat}`}
                        style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'8px 14px',borderRadius:9,fontSize:12,fontWeight:600,background:`${color}10`,border:`1px solid ${color}20`,color,textDecoration:'none',transition:'all .15s' }}>
                        <span style={{ display:'flex' }}>{Ic.plus}</span>Connect {PLAT_LABEL[plat]}
                      </a>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Posts by platform */}
            {connPlatforms.length>0 && (
              <div>
                <div style={{ fontSize:9,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'rgba(255,255,255,0.25)',marginBottom:12 }}>By platform</div>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))',gap:10 }}>
                  {connPlatforms.map(cp=>{
                    const platPosts = posts.filter(p=>p.platform===cp.platform).slice(0,4)
                    const color = PLAT_COLOR[cp.platform]||'#888'
                    return (
                      <div key={cp.id} style={{ padding:'16px 18px',background:'rgba(255,255,255,0.03)',border:`1px solid ${color}18`,borderRadius:12 }}>
                        <div style={{ display:'flex',alignItems:'center',gap:7,marginBottom:12 }}>
                          <PlatDot platform={cp.platform} size={7}/>
                          <span style={{ fontSize:13,fontWeight:700,color:'rgba(255,255,255,0.8)' }}>{PLAT_LABEL[cp.platform]||cp.platform}</span>
                          <span style={{ fontSize:10,color:'rgba(255,255,255,0.3)',marginLeft:'auto' }}>{platPosts.length} upcoming</span>
                        </div>
                        {platPosts.length>0 ? platPosts.map(p=>(
                          <div key={p.id} style={{ display:'flex',gap:8,padding:'7px 0',borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize:11,color:'rgba(255,255,255,0.5)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                              {p.title||p.body?.slice(0,35)||'Post'}
                            </div>
                            <div style={{ fontSize:10,color:'rgba(255,255,255,0.28)',flexShrink:0 }}>
                              {p.scheduled_for?format(parseISO(p.scheduled_for),'MMM d'):''}
                            </div>
                          </div>
                        )) : (
                          <div style={{ fontSize:11,color:'rgba(255,255,255,0.25)',padding:'8px 0' }}>No posts queued</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════ SCHEDULE MODAL ══════════ */}
      {showModal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(12px)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}
          onClick={e=>{ if(e.target===e.currentTarget)setShowModal(false) }}>
          <div style={{ background:'rgba(14,14,22,0.98)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:18,padding:'24px',width:'100%',maxWidth:480,boxShadow:'0 32px 80px rgba(0,0,0,0.8)',animation:'schedUp .2s ease both' }}>

            {/* Header */}
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
              <div style={{ fontFamily:'var(--display)',fontSize:16,fontWeight:800,letterSpacing:'-0.03em',color:'rgba(255,255,255,0.9)' }}>
                {modalPost?.status==='scheduled'?'Edit scheduled post':'Schedule a post'}
              </div>
              <button onClick={()=>setShowModal(false)} style={{ width:26,height:26,borderRadius:7,background:'rgba(255,255,255,0.06)',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
                {Ic.close}
              </button>
            </div>

            {/* Platform */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:9,fontWeight:700,letterSpacing:'.09em',textTransform:'uppercase',color:'rgba(255,255,255,0.28)',marginBottom:8 }}>Platform</div>
              <div style={{ display:'flex',gap:5,flexWrap:'wrap' }}>
                {(['instagram','linkedin','x','tiktok','email','general'] as Platform[]).map(p=>(
                  <button key={p} onClick={()=>setFPlatform(p)}
                    style={{ padding:'5px 13px',borderRadius:100,fontSize:12,fontWeight:600,background:fPlatform===p?`${PLAT_COLOR[p]}18`:'rgba(255,255,255,0.04)',border:`1px solid ${fPlatform===p?`${PLAT_COLOR[p]}44`:'rgba(255,255,255,0.08)'}`,color:fPlatform===p?PLAT_COLOR[p]:'rgba(255,255,255,0.4)',cursor:'pointer',fontFamily:'var(--sans)',transition:'all .15s' }}>
                    {PLAT_LABEL[p]}
                  </button>
                ))}
              </div>
            </div>

            {/* Date + Time */}
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16 }}>
              <div>
                <div style={{ fontSize:9,fontWeight:700,letterSpacing:'.09em',textTransform:'uppercase',color:'rgba(255,255,255,0.28)',marginBottom:8 }}>Date</div>
                <input type="date" value={fDate} onChange={e=>setFDate(e.target.value)}
                  style={{ width:'100%',padding:'9px 12px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:9,color:'rgba(255,255,255,0.8)',fontSize:13,fontFamily:'var(--sans)',outline:'none' }}
                  onFocus={e=>e.target.style.borderColor='rgba(77,159,255,0.35)'}
                  onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
              </div>
              <div>
                <div style={{ fontSize:9,fontWeight:700,letterSpacing:'.09em',textTransform:'uppercase',color:'rgba(255,255,255,0.28)',marginBottom:8 }}>Time</div>
                <input type="time" value={fTime} onChange={e=>setFTime(e.target.value)}
                  style={{ width:'100%',padding:'9px 12px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:9,color:'rgba(255,255,255,0.8)',fontSize:13,fontFamily:'var(--sans)',outline:'none' }}
                  onFocus={e=>e.target.style.borderColor='rgba(77,159,255,0.35)'}
                  onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
              </div>
            </div>

            {/* Caption */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:9,fontWeight:700,letterSpacing:'.09em',textTransform:'uppercase',color:'rgba(255,255,255,0.28)',marginBottom:8 }}>Caption</div>
              <textarea value={fBody} onChange={e=>setFBody(e.target.value)} rows={5}
                placeholder="Write or paste your post caption here…"
                style={{ width:'100%',padding:'12px 13px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'rgba(255,255,255,0.88)',fontSize:13,fontFamily:'var(--sans)',outline:'none',resize:'vertical',lineHeight:1.65,transition:'border-color .15s' }}
                onFocus={e=>e.target.style.borderColor='rgba(77,159,255,0.3)'}
                onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
            </div>

            {/* CTA */}
            <button onClick={schedulePost} disabled={!fBody.trim()||!fDate||saving}
              style={{ width:'100%',padding:'13px',fontSize:14,fontWeight:700,fontFamily:'var(--display)',letterSpacing:'-0.02em',background:fBody.trim()&&fDate?'#4D9FFF':'rgba(255,255,255,0.04)',color:fBody.trim()&&fDate?'#000':'rgba(255,255,255,0.2)',border:'none',borderRadius:11,cursor:fBody.trim()&&fDate?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',gap:9,transition:'all .2s',boxShadow:fBody.trim()&&fDate?'0 4px 20px rgba(77,159,255,0.35)':'none' }}>
              {saving
                ? <><div style={{ width:14,height:14,border:'2px solid rgba(0,0,0,0.25)',borderTopColor:'#000',borderRadius:'50%',animation:'schedSpin .8s linear infinite' }}/>Scheduling…</>
                : saved
                ? <><span style={{ display:'flex' }}>{Ic.check}</span>Scheduled!</>
                : <><span style={{ display:'flex' }}>{Ic.cal}</span>
                  {fDate?`Schedule for ${format(new Date(fDate+'T12:00:00'),'MMM d')} at ${fTime}`:'Schedule post'}</>}
            </button>
          </div>
        </div>
      )}

      {/* ══════════ TOAST ══════════ */}
      {toast && (
        <div style={{ position:'fixed',bottom:24,right:24,zIndex:9999,padding:'12px 18px',borderRadius:11,background:toast.type==='error'?'rgba(255,87,87,0.12)':'rgba(52,211,153,0.1)',border:`1px solid ${toast.type==='error'?'rgba(255,87,87,0.3)':'rgba(52,211,153,0.25)'}`,color:toast.type==='error'?'#FF5757':'#34D399',fontSize:13,fontWeight:600,backdropFilter:'blur(16px)',boxShadow:'0 8px 32px rgba(0,0,0,0.4)',animation:'schedUp .2s ease both' }}>
          {toast.msg}
        </div>
      )}
    </>
  )
}

export default function SchedulePage() {
  return <Suspense fallback={<div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'rgba(255,255,255,0.3)',fontSize:13 }}>Loading…</div>}><SchedulePageInner/></Suspense>
}
