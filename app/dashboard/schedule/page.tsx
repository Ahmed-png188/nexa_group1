'use client'
import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, addMonths, subMonths, parseISO } from 'date-fns'
import Link from 'next/link'

type Platform = 'instagram'|'linkedin'|'x'|'tiktok'|'email'|'general'
type View     = 'calendar'|'queue'|'platforms'

const PC: Record<string,string> = {
  instagram:'#E1306C', linkedin:'#0A66C2', x:'#E7E7E7',
  tiktok:'#FF0050',    email:'#4D9FFF',    general:'#888',
}
const PL: Record<string,string> = {
  instagram:'Instagram', linkedin:'LinkedIn', x:'X',
  tiktok:'TikTok', email:'Email', general:'General',
}

const Ic = {
  cal:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  list:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  link:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  plus:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  check:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  chevL:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>,
  chevR:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>,
  close:  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  bolt:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
}

const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function Dot({ platform, size=6 }: { platform:string; size?:number }) {
  return <div style={{ width:size, height:size, borderRadius:'50%', background:PC[platform]||'#888', flexShrink:0, boxShadow:`0 0 ${size}px ${PC[platform]||'#888'}60` }}/>
}

function SLabel({ children }: any) {
  return <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase', color:'rgba(255,255,255,0.25)', marginBottom:9 }}>{children}</div>
}

/* ─── Inner page ─── */
function Inner() {
  const supabase     = createClient()
  const searchParams = useSearchParams()

  const [ws,       setWs]      = useState<any>(null)
  const [view,     setView]    = useState<View>('calendar')
  const [month,    setMonth]   = useState(new Date())
  const [posts,    setPosts]   = useState<any[]>([])
  const [drafts,   setDrafts]  = useState<any[]>([])
  const [connPlats,setConnPlats]= useState<any[]>([])
  const [loading,  setLoading] = useState(true)
  const [modal,    setModal]   = useState(false)
  const [toast,    setToast]   = useState<{msg:string;ok:boolean}|null>(null)
  const [mounted,  setMounted] = useState(false)

  // form state
  const [fPlat,  setFPlat]  = useState<Platform>('instagram')
  const [fDate,  setFDate]  = useState('')
  const [fTime,  setFTime]  = useState('09:00')
  const [fBody,  setFBody]  = useState('')
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  function toast_(msg:string, ok=true) { setToast({msg,ok}); setTimeout(()=>setToast(null),3500) }

  useEffect(() => {
    setMounted(true)
    const c = searchParams.get('connected')
    if (c) toast_(`${PL[c]||c} connected!`)
    load()
  }, [])

  async function load() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return
    const { data:m } = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id',user.id).limit(1).single()
    const w = (m as any)?.workspaces; setWs(w)
    const [{ data:s },{ data:d },{ data:p }] = await Promise.all([
      supabase.from('content').select('*').eq('workspace_id',w?.id).eq('status','scheduled').order('scheduled_for',{ascending:true}),
      supabase.from('content').select('*').eq('workspace_id',w?.id).eq('status','draft').order('created_at',{ascending:false}).limit(20),
      supabase.from('connected_platforms').select('*').eq('workspace_id',w?.id).eq('is_active',true),
    ])
    setPosts(s??[]); setDrafts(d??[]); setConnPlats(p??[]); setLoading(false)
    supabase.channel('sched-rt')
      .on('postgres_changes',{event:'*',schema:'public',table:'content',filter:`workspace_id=eq.${w?.id}`},()=>load())
      .subscribe()
  }

  async function schedule() {
    if (!fBody.trim()||!fDate||saving) return
    setSaving(true)
    const dt = new Date(`${fDate}T${fTime}:00`)
    try {
      const r = await fetch('/api/schedule-post',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspace_id:ws.id,platform:fPlat,body:fBody,scheduled_for:dt.toISOString()})})
      if (r.ok) {
        setSaved(true); toast_('Post scheduled — it\'s in the queue')
        setFBody('')
        setTimeout(()=>{ setModal(false); setSaved(false) },1400)
      } else toast_('Failed to schedule','error' as any)
    } catch { toast_('Something went wrong','error' as any) }
    setSaving(false)
  }

  async function publishNow(id:string) {
    try {
      const r = await fetch('/api/schedule-post',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({content_id:id,action:'publish'})})
      if (r.ok) { toast_('Published!'); load() } else toast_('Failed','error' as any)
    } catch {}
  }

  async function del(id:string) {
    await supabase.from('content').delete().eq('id',id)
    toast_('Deleted'); load()
  }

  function openForDay(day:Date) {
    setFDate(format(day,'yyyy-MM-dd')); setModal(true)
  }

  function openForDraft(draft:any) {
    setFBody(draft.body||''); setFPlat(draft.platform||'instagram')
    setFDate(format(new Date(),'yyyy-MM-dd')); setModal(true)
  }

  const days     = eachDayOfInterval({ start:startOfMonth(month), end:endOfMonth(month) })
  const pad      = days[0].getDay()
  const onDay    = (d:Date) => posts.filter(p=>p.scheduled_for&&isSameDay(parseISO(p.scheduled_for),d))
  const upcoming = posts.filter(p=>p.scheduled_for&&new Date(p.scheduled_for)>=new Date())
  const ready    = fBody.trim() && fDate

  return (
    <>
      <div style={{ padding:'28px 32px 48px', height:'calc(100vh - var(--topbar-h))', overflowY:'auto' }}>

        {/* Header */}
        <div style={{
          display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24,
          opacity:mounted?1:0, transform:mounted?'translateY(0)':'translateY(12px)',
          transition:'opacity 0.45s ease, transform 0.45s ease',
        }}>
          <div>
            <h1 style={{ fontFamily:'var(--display)', fontSize:24, fontWeight:800, letterSpacing:'-0.04em', color:'rgba(255,255,255,0.92)', lineHeight:1, marginBottom:5 }}>
              Schedule
            </h1>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>
              {upcoming.length > 0
                ? `${upcoming.length} post${upcoming.length!==1?'s':''} queued · ${connPlats.length} platform${connPlats.length!==1?'s':''} connected`
                : 'Plan and publish your content across every platform'}
            </p>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {/* View toggle */}
            <div style={{ display:'flex', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:11, padding:3, gap:2 }}>
              {([{v:'calendar' as View,i:Ic.cal},{v:'queue' as View,i:Ic.list},{v:'platforms' as View,i:Ic.link}] as const).map(({v,i})=>(
                <button key={v} onClick={()=>setView(v)}
                  style={{ width:33, height:31, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${view===v?'rgba(255,255,255,0.12)':'transparent'}`, background:view===v?'rgba(255,255,255,0.08)':'transparent', color:view===v?'rgba(255,255,255,0.85)':'rgba(255,255,255,0.32)', cursor:'pointer', transition:'all 0.15s' }}>
                  {i}
                </button>
              ))}
            </div>
            {/* New post */}
            <button
              onClick={() => { setModal(true); setFBody(''); setFDate(format(new Date(),'yyyy-MM-dd')) }}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', fontSize:13, fontWeight:700, fontFamily:'var(--display)', letterSpacing:'-0.02em', background:'#4D9FFF', color:'#000', border:'none', borderRadius:10, cursor:'pointer', boxShadow:'0 4px 18px rgba(77,159,255,0.35)', transition:'all 0.18s' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-1px)';(e.currentTarget as HTMLElement).style.boxShadow='0 7px 24px rgba(77,159,255,0.45)'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.boxShadow='0 4px 18px rgba(77,159,255,0.35)'}}>
              <span style={{ display:'flex' }}>{Ic.plus}</span>New post
            </button>
          </div>
        </div>

        {/* ════════ CALENDAR ════════ */}
        {view === 'calendar' && (
          <div style={{ animation:'pageUp 0.35s ease both' }}>
            {/* Month nav */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
              <button onClick={()=>setMonth(subMonths(month,1))}
                style={{ width:34, height:34, borderRadius:9, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.45)', cursor:'pointer', transition:'all 0.15s' }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.88)'}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.45)'}>
                {Ic.chevL}
              </button>
              <div style={{ fontFamily:'var(--display)', fontSize:17, fontWeight:800, letterSpacing:'-0.03em', color:'rgba(255,255,255,0.9)' }}>
                {format(month,'MMMM yyyy')}
              </div>
              <button onClick={()=>setMonth(addMonths(month,1))}
                style={{ width:34, height:34, borderRadius:9, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.45)', cursor:'pointer', transition:'all 0.15s' }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.88)'}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.45)'}>
                {Ic.chevR}
              </button>
            </div>

            {/* Day headers */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:5 }}>
              {DOW.map(d => (
                <div key={d} style={{ textAlign:'center', fontSize:9.5, fontWeight:700, color:'rgba(255,255,255,0.22)', letterSpacing:'0.07em', textTransform:'uppercase', padding:'4px 0' }}>{d}</div>
              ))}
            </div>

            {/* Grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
              {Array.from({length:pad}).map((_,i) => <div key={`p${i}`} style={{ minHeight:90 }}/>)}
              {days.map(day => {
                const dp     = onDay(day)
                const today  = isToday(day)
                const inMon  = isSameMonth(day,month)
                return (
                  <div key={day.toISOString()}
                    onClick={() => openForDay(day)}
                    style={{ minHeight:90, padding:'8px 7px', borderRadius:11, background:today?'rgba(255,255,255,0.04)':'rgba(255,255,255,0.02)', border:`1px solid ${today?'rgba(255,255,255,0.12)':'rgba(255,255,255,0.06)'}`, cursor:'pointer', transition:'all 0.15s', opacity:inMon?1:0.3 }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.055)';(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.13)'}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background=today?'rgba(255,255,255,0.04)':'rgba(255,255,255,0.02)';(e.currentTarget as HTMLElement).style.borderColor=today?'rgba(255,255,255,0.12)':'rgba(255,255,255,0.06)'}}>
                    {/* Day number */}
                    <div style={{ width:26, height:26, borderRadius:8, background:today?'#4D9FFF':'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--display)', fontSize:12, fontWeight:today?800:600, color:today?'#000':'rgba(255,255,255,0.58)', marginBottom:6, letterSpacing:'-0.02em' }}>
                      {format(day,'d')}
                    </div>
                    {/* Posts */}
                    <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                      {dp.slice(0,3).map((p,i) => (
                        <div key={p.id}
                          onClick={e => { e.stopPropagation(); setFBody(p.body||''); setFPlat(p.platform||'instagram'); setFDate(format(parseISO(p.scheduled_for),'yyyy-MM-dd')); setModal(true) }}
                          style={{ display:'flex', alignItems:'center', gap:4, padding:'2px 5px', borderRadius:5, background:PC[p.platform]?`${PC[p.platform]}18`:'rgba(255,255,255,0.05)' }}>
                          <Dot platform={p.platform} size={4}/>
                          <span style={{ fontSize:9, color:'rgba(255,255,255,0.55)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.2 }}>
                            {p.title||p.body?.slice(0,18)||'Post'}
                          </span>
                        </div>
                      ))}
                      {dp.length > 3 && <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', paddingLeft:4 }}>+{dp.length-3}</div>}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div style={{ display:'flex', gap:14, marginTop:18, flexWrap:'wrap' }}>
              {Object.entries(PC).filter(([k])=>k!=='general').map(([plat,color])=>(
                <div key={plat} style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, color:'rgba(255,255,255,0.3)' }}>
                  <Dot platform={plat} size={5}/>
                  {PL[plat]}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════ QUEUE ════════ */}
        {view === 'queue' && (
          <div style={{ animation:'pageUp 0.35s ease both' }}>

            {/* Upcoming */}
            <div style={{ marginBottom:32 }}>
              <SLabel>Scheduled · {upcoming.length}</SLabel>
              {upcoming.length > 0 ? (
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {upcoming.map(post => (
                    <div key={post.id}
                      style={{ display:'flex', alignItems:'center', gap:13, padding:'13px 16px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:13, transition:'all 0.15s' }}
                      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.045)';(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.12)'}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.025)';(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.07)'}}>
                      <Dot platform={post.platform} size={8}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.82)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'-0.01em' }}>
                          {post.title||post.body?.slice(0,65)||'Post'}
                        </div>
                        <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:3 }}>
                          <span style={{ fontSize:10, color:`${PC[post.platform]||'#888'}cc`, fontWeight:700 }}>{PL[post.platform]||post.platform}</span>
                          <span style={{ fontSize:10, color:'rgba(255,255,255,0.28)' }}>
                            {post.scheduled_for ? format(parseISO(post.scheduled_for),'MMM d, h:mm a') : ''}
                          </span>
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:5, flexShrink:0 }}>
                        <button onClick={() => publishNow(post.id)}
                          style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8, fontSize:11, fontWeight:700, background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.22)', color:'#34D399', cursor:'pointer', fontFamily:'var(--sans)', transition:'all 0.15s' }}>
                          <span style={{ display:'flex' }}>{Ic.check}</span>Publish now
                        </button>
                        <button onClick={() => del(post.id)}
                          style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background:'transparent', border:'1px solid rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.28)', cursor:'pointer', transition:'all 0.15s' }}
                          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(255,87,87,0.35)';(e.currentTarget as HTMLElement).style.color='#FF5757'}}
                          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.07)';(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.28)'}}>
                          {Ic.trash}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding:'32px 24px', background:'rgba(255,255,255,0.02)', border:'1px dashed rgba(255,255,255,0.08)', borderRadius:14, textAlign:'center' }}>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.28)', lineHeight:1.7, marginBottom:14 }}>
                    Nothing queued yet. Pick a day on the calendar<br/>or create something new in Studio.
                  </div>
                  <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
                    <button onClick={() => { setModal(true); setFBody(''); setFDate(format(new Date(),'yyyy-MM-dd')) }}
                      style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', fontSize:12, fontWeight:700, background:'rgba(77,159,255,0.1)', border:'1px solid rgba(77,159,255,0.22)', color:'#4D9FFF', borderRadius:9, cursor:'pointer', fontFamily:'var(--sans)' }}>
                      <span style={{ display:'flex' }}>{Ic.plus}</span>Schedule post
                    </button>
                    <Link href="/dashboard/studio"
                      style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', fontSize:12, fontWeight:700, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.5)', borderRadius:9, textDecoration:'none', fontFamily:'var(--sans)' }}>
                      <span style={{ display:'flex' }}>{Ic.bolt}</span>Create in Studio
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Drafts */}
            {drafts.length > 0 && (
              <div>
                <SLabel>Drafts · {drafts.length}</SLabel>
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  {drafts.map(draft => (
                    <div key={draft.id}
                      style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, transition:'all 0.15s' }}
                      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)';(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.1)'}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.02)';(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.06)'}}>
                      <Dot platform={draft.platform||'general'} size={7}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12.5, color:'rgba(255,255,255,0.62)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'-0.01em' }}>
                          {draft.title||draft.body?.slice(0,65)||'Draft'}
                        </div>
                        <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)', marginTop:2 }}>
                          {PL[draft.platform]||'General'} · Draft
                        </div>
                      </div>
                      <button onClick={() => openForDraft(draft)}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:8, fontSize:11, fontWeight:700, background:'rgba(77,159,255,0.08)', border:'1px solid rgba(77,159,255,0.22)', color:'#4D9FFF', cursor:'pointer', fontFamily:'var(--sans)', transition:'all 0.15s', flexShrink:0 }}>
                        <span style={{ display:'flex' }}>{Ic.cal}</span>Schedule
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════ PLATFORMS ════════ */}
        {view === 'platforms' && (
          <div style={{ animation:'pageUp 0.35s ease both' }}>
            <SLabel>Connected platforms</SLabel>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:10, marginBottom:28 }}>
              {(['instagram','linkedin','x','tiktok','email'] as const).map(plat => {
                const conn  = connPlats.find(p => p.platform===plat)
                const color = PC[plat]
                return (
                  <div key={plat}
                    style={{ padding:'18px 20px', background:conn?`${color}07`:'rgba(255,255,255,0.02)', border:`1px solid ${conn?`${color}25`:'rgba(255,255,255,0.07)'}`, borderRadius:15, transition:'all 0.15s' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                        <div style={{ width:9, height:9, borderRadius:'50%', background:conn?color:'rgba(255,255,255,0.12)', boxShadow:conn?`0 0 8px ${color}80`:'none' }}/>
                        <span style={{ fontSize:13, fontWeight:700, color:conn?'rgba(255,255,255,0.88)':'rgba(255,255,255,0.35)', letterSpacing:'-0.01em' }}>{PL[plat]}</span>
                      </div>
                      {conn && (
                        <span style={{ fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:100, background:`${color}12`, border:`1px solid ${color}28`, color, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                          {conn.status||'active'}
                        </span>
                      )}
                    </div>
                    {conn ? (
                      <>
                        <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginBottom:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {conn.account_name||conn.account_id||'Connected'}
                        </div>
                        <div style={{ padding:'9px 12px', background:'rgba(0,0,0,0.25)', borderRadius:9, textAlign:'center' }}>
                          <div style={{ fontFamily:'var(--display)', fontSize:18, fontWeight:800, color:'rgba(255,255,255,0.78)', letterSpacing:'-0.03em', lineHeight:1 }}>
                            {posts.filter(p=>p.platform===plat).length}
                          </div>
                          <div style={{ fontSize:9.5, color:'rgba(255,255,255,0.28)', marginTop:2 }}>posts queued</div>
                        </div>
                      </>
                    ) : (
                      <a href={`/api/oauth/${plat}`}
                        style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'9px 14px', borderRadius:10, fontSize:12, fontWeight:700, background:`${color}0e`, border:`1px solid ${color}22`, color, textDecoration:'none', transition:'all 0.15s' }}
                        onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background=`${color}18`;(e.currentTarget as HTMLElement).style.borderColor=`${color}38`}}
                        onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background=`${color}0e`;(e.currentTarget as HTMLElement).style.borderColor=`${color}22`}}>
                        <span style={{ display:'flex' }}>{Ic.plus}</span>Connect {PL[plat]}
                      </a>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Per-platform queue breakdown */}
            {connPlats.length > 0 && (
              <>
                <SLabel>Queue by platform</SLabel>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:10, marginTop:10 }}>
                  {connPlats.map(cp => {
                    const platPosts = posts.filter(p=>p.platform===cp.platform).slice(0,5)
                    const color = PC[cp.platform]||'#888'
                    return (
                      <div key={cp.id} style={{ padding:'16px 18px', background:'rgba(255,255,255,0.025)', border:`1px solid ${color}18`, borderRadius:14 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:13 }}>
                          <Dot platform={cp.platform} size={7}/>
                          <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.82)', letterSpacing:'-0.01em' }}>{PL[cp.platform]||cp.platform}</span>
                          <span style={{ fontSize:10, color:'rgba(255,255,255,0.28)', marginLeft:'auto' }}>{platPosts.length} upcoming</span>
                        </div>
                        {platPosts.length > 0 ? platPosts.map(p => (
                          <div key={p.id} style={{ display:'flex', gap:9, padding:'7px 0', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.52)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {p.title||p.body?.slice(0,38)||'Post'}
                            </div>
                            <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)', flexShrink:0 }}>
                              {p.scheduled_for?format(parseISO(p.scheduled_for),'MMM d'):''}
                            </div>
                          </div>
                        )) : (
                          <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)', padding:'6px 0' }}>Nothing queued</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ════════ MODAL ════════ */}
      {modal && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(14px)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={e => { if(e.target===e.currentTarget) setModal(false) }}>
          <div style={{ background:'rgba(11,11,18,0.98)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, padding:'26px', width:'100%', maxWidth:500, boxShadow:'0 32px 80px rgba(0,0,0,0.85)', animation:'pageUp 0.22s ease both' }}>

            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
              <div style={{ fontFamily:'var(--display)', fontSize:17, fontWeight:800, letterSpacing:'-0.03em', color:'rgba(255,255,255,0.92)' }}>
                Schedule a post
              </div>
              <button onClick={()=>setModal(false)}
                style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,0.06)', border:'none', color:'rgba(255,255,255,0.38)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {Ic.close}
              </button>
            </div>

            {/* Platform */}
            <div style={{ marginBottom:18 }}>
              <SLabel>Platform</SLabel>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                {(['instagram','linkedin','x','tiktok','email','general'] as Platform[]).map(p => (
                  <button key={p} onClick={() => setFPlat(p)}
                    style={{ padding:'5px 14px', borderRadius:100, fontSize:12, fontWeight:600, background:fPlat===p?`${PC[p]}16`:'rgba(255,255,255,0.04)', border:`1px solid ${fPlat===p?`${PC[p]}44`:'rgba(255,255,255,0.08)'}`, color:fPlat===p?PC[p]:'rgba(255,255,255,0.38)', cursor:'pointer', fontFamily:'var(--sans)', transition:'all 0.14s', boxShadow:fPlat===p?`0 0 10px ${PC[p]}25`:'none' }}>
                    {PL[p]}
                  </button>
                ))}
              </div>
            </div>

            {/* Date + Time */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:18 }}>
              {[
                { label:'Date', type:'date', value:fDate, set:setFDate },
                { label:'Time', type:'time', value:fTime, set:setFTime },
              ].map(f => (
                <div key={f.label}>
                  <SLabel>{f.label}</SLabel>
                  <input type={f.type} value={f.value} onChange={e=>f.set(e.target.value)}
                    style={{ width:'100%', padding:'10px 13px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'rgba(255,255,255,0.82)', fontSize:13, fontFamily:'var(--sans)', outline:'none', transition:'border-color 0.15s', boxSizing:'border-box' }}
                    onFocus={e=>e.target.style.borderColor='rgba(77,159,255,0.35)'}
                    onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
                </div>
              ))}
            </div>

            {/* Caption */}
            <div style={{ marginBottom:22 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:9 }}>
                <SLabel>Caption</SLabel>
                {fDate && <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontWeight:500 }}>Scheduling for {format(new Date(fDate+'T12:00:00'),'MMM d')} at {fTime}</span>}
              </div>
              <div style={{ borderRadius:12, background:fBody?'rgba(77,159,255,0.03)':'rgba(255,255,255,0.025)', border:`1px solid ${fBody?'rgba(77,159,255,0.22)':'rgba(255,255,255,0.09)'}`, transition:'all 0.18s' }}>
                <textarea
                  value={fBody}
                  onChange={e => setFBody(e.target.value)}
                  rows={6}
                  placeholder={`Write or paste your caption here.\n\nTip: Generate it first in Studio — it'll already be in your brand voice.`}
                  style={{ width:'100%', padding:'13px 15px', fontSize:13, fontFamily:'var(--sans)', background:'transparent', border:'none', color:'rgba(255,255,255,0.88)', outline:'none', resize:'vertical', lineHeight:1.7, boxSizing:'border-box' }}
                />
              </div>
            </div>

            {/* CTA */}
            <button onClick={schedule} disabled={!ready||saving}
              style={{ width:'100%', padding:'14px', fontSize:14, fontWeight:700, fontFamily:'var(--display)', letterSpacing:'-0.02em', background:ready?'#4D9FFF':'rgba(255,255,255,0.04)', color:ready?'#000':'rgba(255,255,255,0.2)', border:'none', borderRadius:12, cursor:ready?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:9, transition:'all 0.18s', boxShadow:ready?'0 4px 22px rgba(77,159,255,0.38)':'none' }}>
              {saving
                ? <><div style={{ width:15,height:15,border:'2px solid rgba(0,0,0,0.2)',borderTopColor:'#000',borderRadius:'50%',animation:'pageSpin 0.7s linear infinite' }}/>Scheduling…</>
                : saved
                ? <><span style={{ display:'flex' }}>{Ic.check}</span>Scheduled!</>
                : <><span style={{ display:'flex' }}>{Ic.cal}</span>{fDate?`Schedule for ${format(new Date(fDate+'T12:00:00'),'MMM d')} at ${fTime}`:'Schedule post'}</>}
            </button>
          </div>
        </div>
      )}

      {/* ════════ TOAST ════════ */}
      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, padding:'12px 20px', borderRadius:12, background:toast.ok?'rgba(52,211,153,0.1)':'rgba(255,87,87,0.12)', border:`1px solid ${toast.ok?'rgba(52,211,153,0.28)':'rgba(255,87,87,0.3)'}`, color:toast.ok?'#34D399':'#FF5757', fontSize:13, fontWeight:600, backdropFilter:'blur(16px)', boxShadow:'0 8px 32px rgba(0,0,0,0.45)', animation:'pageUp 0.2s ease both' }}>
          {toast.msg}
        </div>
      )}
    </>
  )
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'rgba(255,255,255,0.28)',fontSize:13 }}>Loading…</div>}>
      <Inner/>
    </Suspense>
  )
}
