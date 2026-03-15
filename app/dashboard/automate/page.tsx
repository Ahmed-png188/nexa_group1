'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow, parseISO } from 'date-fns'

type View = 'sequences'|'new'|'detail'|'webhooks'

const STATUS_COLORS: Record<string,string> = {
  active:'#34D399', paused:'#FFB547', draft:'rgba(255,255,255,0.3)',
  completed:'#4D9FFF', failed:'#FF5757',
}

const Ic = {
  bolt:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  plus:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  play:   <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  pause:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  back:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>,
  mail:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  webhook:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>,
  trash:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  copy:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  check:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  close:  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
}

const SEQUENCE_TEMPLATES = [
  { id:'welcome',  name:'Welcome Sequence',    desc:'Onboard new subscribers with 5 brand-voice emails over 7 days', steps:5, icon:Ic.mail,    color:'#4D9FFF' },
  { id:'nurture',  name:'Nurture Sequence',    desc:'Keep leads warm with weekly value-first content for 30 days',  steps:8, icon:Ic.bolt,    color:'#A78BFA' },
  { id:'launch',   name:'Product Launch',      desc:'Build anticipation and drive conversions across 7 touchpoints', steps:7, icon:Ic.play,    color:'#FF7A40' },
  { id:'reengag',  name:'Re-engagement',       desc:'Win back cold leads with a 3-email pattern interrupt sequence', steps:3, icon:Ic.webhook, color:'#34D399' },
]

const TRIGGER_OPTIONS = [
  'New subscriber joins list','Lead magnet downloaded','Form submission','Purchase completed',
  'Trial started','Webinar registered','Manual trigger','Webhook received',
]

export default function AutomatePage() {
  const supabase = createClient()
  const [ws,         setWs]        = useState<any>(null)
  const [view,       setView]      = useState<View>('sequences')
  const [sequences,  setSequences] = useState<any[]>([])
  const [webhooks,   setWebhooks]  = useState<any[]>([])
  const [runs,       setRuns]      = useState<any[]>([])
  const [loading,    setLoading]   = useState(true)
  const [selSeq,     setSelSeq]    = useState<any>(null)
  const [toast,      setToast]     = useState<{msg:string;type:'success'|'error'}|null>(null)
  const [copiedId,   setCopiedId]  = useState<string|null>(null)

  // new sequence form
  const [nName,     setNName]     = useState('')
  const [nTrigger,  setNTrigger]  = useState(TRIGGER_OPTIONS[0])
  const [nTemplate, setNTemplate] = useState<string|null>(null)
  const [nDesc,     setNDesc]     = useState('')
  const [creating,  setCreating]  = useState(false)

  function showToast(msg:string, type:'success'|'error'='success') { setToast({msg,type}); setTimeout(()=>setToast(null),4000) }

  useEffect(() => { load() }, [])

  async function load() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return
    const { data:m } = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id',user.id).limit(1).single()
    const w = (m as any)?.workspaces; setWs(w)
    const [{ data:seq }, { data:wh }, { data:r }] = await Promise.all([
      supabase.from('sequences').select('*').eq('workspace_id',w?.id).order('created_at',{ascending:false}),
      supabase.from('webhooks').select('*').eq('workspace_id',w?.id).order('created_at',{ascending:false}),
      supabase.from('agent_runs').select('*').eq('workspace_id',w?.id).order('created_at',{ascending:false}).limit(20),
    ])
    setSequences(seq??[]); setWebhooks(wh??[]); setRuns(r??[]); setLoading(false)
  }

  async function createSequence() {
    if (!nName.trim()||creating) return
    setCreating(true)
    try {
      const tmpl = SEQUENCE_TEMPLATES.find(t=>t.id===nTemplate)
      const r = await fetch('/api/create-sequence',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspace_id:ws.id,name:nName,trigger:nTrigger,description:nDesc||tmpl?.desc||'',template:nTemplate,steps:tmpl?.steps||3})})
      const d = await r.json()
      if (d.success) { showToast('Sequence created'); setView('sequences'); setNName(''); setNTemplate(null); load() }
      else showToast(d.error||'Failed','error')
    } catch { showToast('Error','error') }
    setCreating(false)
  }

  async function toggleStatus(seq:any) {
    const next = seq.status==='active'?'paused':'active'
    await supabase.from('sequences').update({status:next}).eq('id',seq.id)
    showToast(`Sequence ${next}`); load()
  }

  async function deleteSequence(id:string) {
    await supabase.from('sequences').delete().eq('id',id)
    showToast('Deleted'); load(); if(selSeq?.id===id)setView('sequences')
  }

  async function copyWebhookUrl(url:string, id:string) {
    await navigator.clipboard.writeText(url)
    setCopiedId(id); setTimeout(()=>setCopiedId(null),2000)
  }

  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'rgba(255,255,255,0.3)',fontSize:13 }}>Loading…</div>

  return (
    <>
      <style>{`
        @keyframes autoUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes autoSpin{to{transform:rotate(360deg)}}
        .seq-card:hover{border-color:rgba(255,255,255,0.13)!important;background:rgba(255,255,255,0.05)!important;}
        .tmpl-card:hover{border-color:rgba(255,255,255,0.14)!important;}
        .run-row:hover{background:rgba(255,255,255,0.04)!important;}
      `}</style>

      <div style={{ padding:'24px 28px',overflowY:'auto',height:'calc(100vh - var(--topbar-h))' }}>

        {/* Header */}
        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:24,animation:'autoUp .4s ease both' }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            {(view==='new'||view==='detail'||view==='webhooks') && (
              <button onClick={()=>setView('sequences')}
                style={{ width:32,height:32,borderRadius:8,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.09)',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,0.5)',cursor:'pointer',marginRight:4 }}>
                {Ic.back}
              </button>
            )}
            <div>
              <h1 style={{ fontFamily:'var(--display)',fontSize:22,fontWeight:800,letterSpacing:'-0.04em',color:'rgba(255,255,255,0.92)',lineHeight:1,marginBottom:4 }}>
                {view==='new'?'New Sequence':view==='webhooks'?'Webhooks':view==='detail'&&selSeq?selSeq.name:'Automate'}
              </h1>
              <p style={{ fontSize:12,color:'rgba(255,255,255,0.3)' }}>
                {view==='sequences'?`${sequences.length} sequence${sequences.length!==1?'s':''} · ${runs.length} total runs`:''}
                {view==='new'?'Build an automated email or content sequence':''}
                {view==='webhooks'?'Trigger Nexa from external tools':''}
              </p>
            </div>
          </div>
          {view==='sequences' && (
            <div style={{ display:'flex',gap:6 }}>
              <button onClick={()=>setView('webhooks')}
                style={{ display:'flex',alignItems:'center',gap:6,padding:'7px 14px',fontSize:12,fontWeight:600,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.5)',borderRadius:9,cursor:'pointer',fontFamily:'var(--sans)' }}>
                <span style={{ display:'flex' }}>{Ic.webhook}</span>Webhooks
              </button>
              <button onClick={()=>setView('new')}
                style={{ display:'flex',alignItems:'center',gap:7,padding:'8px 16px',fontSize:13,fontWeight:700,background:'#4D9FFF',color:'#000',border:'none',borderRadius:10,cursor:'pointer',fontFamily:'var(--sans)',boxShadow:'0 4px 16px rgba(77,159,255,0.3)',letterSpacing:'-0.01em' }}>
                <span style={{ display:'flex' }}>{Ic.plus}</span>New sequence
              </button>
            </div>
          )}
        </div>

        {/* ── SEQUENCES LIST ── */}
        {view==='sequences' && (
          <div style={{ animation:'autoUp .35s ease both' }}>

            {/* Stats row */}
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:8,marginBottom:24 }}>
              {[
                { label:'Active',    value:sequences.filter(s=>s.status==='active').length,    color:'#34D399' },
                { label:'Paused',    value:sequences.filter(s=>s.status==='paused').length,    color:'#FFB547' },
                { label:'Total runs',value:runs.length,                                        color:'#4D9FFF' },
                { label:'Completed', value:runs.filter(r=>r.status==='completed').length,      color:'#A78BFA' },
              ].map(s=>(
                <div key={s.label} style={{ padding:'12px 16px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12 }}>
                  <div style={{ fontFamily:'var(--display)',fontSize:22,fontWeight:800,letterSpacing:'-0.04em',color:s.color,lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:10,color:'rgba(255,255,255,0.3)',marginTop:4,fontWeight:500 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Sequences */}
            {sequences.length>0 ? (
              <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                {sequences.map(seq=>(
                  <div key={seq.id} className="seq-card"
                    style={{ display:'flex',alignItems:'center',gap:14,padding:'14px 18px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:13,transition:'all .15s',cursor:'pointer' }}
                    onClick={()=>{setSelSeq(seq);setView('detail')}}>
                    <div style={{ width:38,height:38,borderRadius:10,background:`${STATUS_COLORS[seq.status]||'rgba(255,255,255,0.1)'}14`,border:`1px solid ${STATUS_COLORS[seq.status]||'rgba(255,255,255,0.1)'}28`,display:'flex',alignItems:'center',justifyContent:'center',color:STATUS_COLORS[seq.status]||'rgba(255,255,255,0.4)',flexShrink:0 }}>
                      {Ic.mail}
                    </div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:14,fontWeight:700,color:'rgba(255,255,255,0.88)',marginBottom:3,letterSpacing:'-0.02em' }}>{seq.name}</div>
                      <div style={{ display:'flex',gap:10,alignItems:'center' }}>
                        <span style={{ fontSize:10,fontWeight:700,padding:'1px 8px',borderRadius:100,background:`${STATUS_COLORS[seq.status]||'rgba(255,255,255,0.1)'}14`,border:`1px solid ${STATUS_COLORS[seq.status]||'rgba(255,255,255,0.1)'}28`,color:STATUS_COLORS[seq.status]||'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'.04em' }}>{seq.status}</span>
                        <span style={{ fontSize:11,color:'rgba(255,255,255,0.3)' }}>{seq.trigger||'Manual trigger'}</span>
                        <span style={{ fontSize:11,color:'rgba(255,255,255,0.28)' }}>{seq.steps_count||0} steps</span>
                      </div>
                    </div>
                    <div style={{ display:'flex',gap:5 }} onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>toggleStatus(seq)}
                        style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 11px',borderRadius:7,fontSize:11,fontWeight:600,background:seq.status==='active'?'rgba(255,181,71,0.08)':'rgba(52,211,153,0.08)',border:`1px solid ${seq.status==='active'?'rgba(255,181,71,0.2)':'rgba(52,211,153,0.2)'}`,color:seq.status==='active'?'#FFB547':'#34D399',cursor:'pointer',fontFamily:'var(--sans)',transition:'all .15s' }}>
                        <span style={{ display:'flex' }}>{seq.status==='active'?Ic.pause:Ic.play}</span>
                        {seq.status==='active'?'Pause':'Resume'}
                      </button>
                      <button onClick={()=>deleteSequence(seq.id)}
                        style={{ width:30,height:30,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',background:'transparent',border:'1px solid rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.28)',cursor:'pointer',transition:'all .15s' }}
                        onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(255,87,87,0.3)';(e.currentTarget as HTMLElement).style.color='#FF5757'}}
                        onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.07)';(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.28)'}}>
                        {Ic.trash}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'40vh',textAlign:'center',padding:'40px 20px' }}>
                <div style={{ width:56,height:56,borderRadius:14,background:'rgba(77,159,255,0.07)',border:'1px solid rgba(77,159,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',color:'#4D9FFF',marginBottom:18 }}>{Ic.bolt}</div>
                <h3 style={{ fontFamily:'var(--display)',fontSize:18,fontWeight:800,letterSpacing:'-0.03em',marginBottom:8,color:'rgba(255,255,255,0.85)' }}>No sequences yet</h3>
                <p style={{ fontSize:13,color:'rgba(255,255,255,0.35)',lineHeight:1.7,maxWidth:380,marginBottom:22 }}>Automate your email sequences, content publishing, and audience nurturing — all written in your brand voice.</p>
                <button onClick={()=>setView('new')}
                  style={{ display:'flex',alignItems:'center',gap:8,padding:'12px 24px',fontSize:13,fontWeight:700,background:'#4D9FFF',color:'#000',border:'none',borderRadius:10,cursor:'pointer',fontFamily:'var(--sans)',boxShadow:'0 4px 16px rgba(77,159,255,0.3)',letterSpacing:'-0.01em' }}>
                  <span style={{ display:'flex' }}>{Ic.plus}</span>Build first sequence
                </button>
              </div>
            )}

            {/* Recent runs */}
            {runs.length>0 && (
              <div style={{ marginTop:28 }}>
                <div style={{ fontSize:9,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'rgba(255,255,255,0.25)',marginBottom:12 }}>Recent runs</div>
                {runs.slice(0,8).map(run=>(
                  <div key={run.id} className="run-row"
                    style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,transition:'background .15s',marginBottom:4 }}>
                    <div style={{ width:7,height:7,borderRadius:'50%',background:STATUS_COLORS[run.status]||'rgba(255,255,255,0.3)',flexShrink:0 }}/>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:12,color:'rgba(255,255,255,0.65)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{run.agent_type||run.sequence_name||'Automation run'}</div>
                      <div style={{ fontSize:10,color:'rgba(255,255,255,0.28)',marginTop:2 }}>{run.created_at?formatDistanceToNow(parseISO(run.created_at))+ ' ago':''}</div>
                    </div>
                    <span style={{ fontSize:10,fontWeight:600,color:STATUS_COLORS[run.status]||'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'.04em' }}>{run.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── NEW SEQUENCE ── */}
        {view==='new' && (
          <div style={{ maxWidth:620,animation:'autoUp .35s ease both' }}>

            {/* Templates */}
            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:9,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'rgba(255,255,255,0.25)',marginBottom:12 }}>Start from a template</div>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:8 }}>
                {SEQUENCE_TEMPLATES.map(tmpl=>(
                  <div key={tmpl.id} className="tmpl-card"
                    onClick={()=>{setNTemplate(nTemplate===tmpl.id?null:tmpl.id);if(!nName)setNName(tmpl.name)}}
                    style={{ padding:'14px 16px',background:nTemplate===tmpl.id?`${tmpl.color}09`:'rgba(255,255,255,0.03)',border:`1px solid ${nTemplate===tmpl.id?`${tmpl.color}30`:'rgba(255,255,255,0.07)'}`,borderRadius:12,cursor:'pointer',transition:'all .15s',boxShadow:nTemplate===tmpl.id?`0 0 20px ${tmpl.color}12`:'none' }}>
                    <div style={{ display:'flex',alignItems:'center',gap:9,marginBottom:8 }}>
                      <div style={{ width:28,height:28,borderRadius:8,background:`${tmpl.color}14`,border:`1px solid ${tmpl.color}28`,display:'flex',alignItems:'center',justifyContent:'center',color:tmpl.color,flexShrink:0 }}>{tmpl.icon}</div>
                      <span style={{ fontSize:13,fontWeight:700,color:nTemplate===tmpl.id?tmpl.color:'rgba(255,255,255,0.82)',letterSpacing:'-0.02em' }}>{tmpl.name}</span>
                    </div>
                    <div style={{ fontSize:11.5,color:'rgba(255,255,255,0.38)',lineHeight:1.55,marginBottom:8 }}>{tmpl.desc}</div>
                    <div style={{ fontSize:10,fontWeight:600,color:tmpl.color,opacity:0.7 }}>{tmpl.steps} steps</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
              <div>
                <div style={{ fontSize:9,fontWeight:700,letterSpacing:'.09em',textTransform:'uppercase',color:'rgba(255,255,255,0.28)',marginBottom:8 }}>Sequence name</div>
                <input value={nName} onChange={e=>setNName(e.target.value)} placeholder="Welcome New Subscribers"
                  style={{ width:'100%',padding:'11px 13px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'rgba(255,255,255,0.88)',fontSize:13,fontFamily:'var(--sans)',outline:'none',transition:'border-color .15s' }}
                  onFocus={e=>e.target.style.borderColor='rgba(77,159,255,0.35)'}
                  onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
              </div>
              <div>
                <div style={{ fontSize:9,fontWeight:700,letterSpacing:'.09em',textTransform:'uppercase',color:'rgba(255,255,255,0.28)',marginBottom:8 }}>Trigger</div>
                <select value={nTrigger} onChange={e=>setNTrigger(e.target.value)}
                  style={{ width:'100%',padding:'11px 13px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'rgba(255,255,255,0.8)',fontSize:13,fontFamily:'var(--sans)',outline:'none',cursor:'pointer' }}>
                  {TRIGGER_OPTIONS.map(t=><option key={t} value={t} style={{ background:'#0E0E16' }}>{t}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize:9,fontWeight:700,letterSpacing:'.09em',textTransform:'uppercase',color:'rgba(255,255,255,0.28)',marginBottom:8 }}>Description <span style={{ fontWeight:400,color:'rgba(255,255,255,0.2)' }}>(optional)</span></div>
                <textarea value={nDesc} onChange={e=>setNDesc(e.target.value)} rows={3} placeholder="What is this sequence for?"
                  style={{ width:'100%',padding:'11px 13px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'rgba(255,255,255,0.8)',fontSize:13,fontFamily:'var(--sans)',outline:'none',resize:'vertical',transition:'border-color .15s' }}
                  onFocus={e=>e.target.style.borderColor='rgba(77,159,255,0.35)'}
                  onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
              </div>
              <button onClick={createSequence} disabled={!nName.trim()||creating}
                style={{ padding:'13px',fontSize:14,fontWeight:700,fontFamily:'var(--display)',letterSpacing:'-0.02em',background:nName.trim()?'#4D9FFF':'rgba(255,255,255,0.04)',color:nName.trim()?'#000':'rgba(255,255,255,0.2)',border:'none',borderRadius:12,cursor:nName.trim()?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',gap:9,transition:'all .2s',boxShadow:nName.trim()?'0 4px 20px rgba(77,159,255,0.35)':'none' }}>
                {creating?<><div style={{ width:15,height:15,border:'2px solid rgba(0,0,0,0.25)',borderTopColor:'#000',borderRadius:'50%',animation:'autoSpin .8s linear infinite' }}/>Creating…</>:<><span style={{ display:'flex' }}>{Ic.bolt}</span>Create sequence</>}
              </button>
            </div>
          </div>
        )}

        {/* ── DETAIL VIEW ── */}
        {view==='detail' && selSeq && (
          <div style={{ animation:'autoUp .35s ease both' }}>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:8,marginBottom:22 }}>
              {[
                { label:'Status',    value:selSeq.status||'draft', color:STATUS_COLORS[selSeq.status]||'rgba(255,255,255,0.4)' },
                { label:'Trigger',   value:selSeq.trigger||'Manual', color:'rgba(255,255,255,0.7)' },
                { label:'Steps',     value:String(selSeq.steps_count||0), color:'#4D9FFF' },
                { label:'Sent',      value:String(selSeq.emails_sent||0), color:'#A78BFA' },
              ].map(s=>(
                <div key={s.label} style={{ padding:'12px 14px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:11 }}>
                  <div style={{ fontSize:9,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',color:'rgba(255,255,255,0.25)',marginBottom:6 }}>{s.label}</div>
                  <div style={{ fontSize:13,fontWeight:700,color:s.color,letterSpacing:'-0.02em' }}>{s.value}</div>
                </div>
              ))}
            </div>
            {selSeq.description && (
              <div style={{ padding:'14px 16px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:11,marginBottom:18,fontSize:13,color:'rgba(255,255,255,0.55)',lineHeight:1.65 }}>{selSeq.description}</div>
            )}
            <div style={{ display:'flex',gap:8 }}>
              <button onClick={()=>toggleStatus(selSeq)}
                style={{ display:'flex',alignItems:'center',gap:7,padding:'9px 18px',fontSize:13,fontWeight:700,background:selSeq.status==='active'?'rgba(255,181,71,0.1)':'rgba(52,211,153,0.1)',border:`1px solid ${selSeq.status==='active'?'rgba(255,181,71,0.25)':'rgba(52,211,153,0.25)'}`,color:selSeq.status==='active'?'#FFB547':'#34D399',borderRadius:10,cursor:'pointer',fontFamily:'var(--sans)',transition:'all .15s' }}>
                <span style={{ display:'flex' }}>{selSeq.status==='active'?Ic.pause:Ic.play}</span>
                {selSeq.status==='active'?'Pause sequence':'Resume sequence'}
              </button>
              <button onClick={()=>deleteSequence(selSeq.id)}
                style={{ display:'flex',alignItems:'center',gap:7,padding:'9px 18px',fontSize:13,fontWeight:700,background:'rgba(255,87,87,0.07)',border:'1px solid rgba(255,87,87,0.18)',color:'#FF5757',borderRadius:10,cursor:'pointer',fontFamily:'var(--sans)' }}>
                <span style={{ display:'flex' }}>{Ic.trash}</span>Delete
              </button>
            </div>
          </div>
        )}

        {/* ── WEBHOOKS ── */}
        {view==='webhooks' && (
          <div style={{ animation:'autoUp .35s ease both' }}>
            <div style={{ padding:'16px 18px',background:'rgba(77,159,255,0.06)',border:'1px solid rgba(77,159,255,0.18)',borderRadius:12,marginBottom:20 }}>
              <div style={{ fontSize:11,fontWeight:700,color:'#4D9FFF',marginBottom:6 }}>How webhooks work</div>
              <div style={{ fontSize:12.5,color:'rgba(255,255,255,0.55)',lineHeight:1.65 }}>
                Send a POST request to your webhook URL to trigger content generation, sequences, or any Nexa automation from any external tool — Zapier, Make, your CRM, or custom code.
              </div>
            </div>
            {webhooks.length>0 ? webhooks.map(wh=>(
              <div key={wh.id} style={{ padding:'14px 18px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,marginBottom:8 }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:13,fontWeight:700,color:'rgba(255,255,255,0.85)',marginBottom:3 }}>{wh.name||'Webhook'}</div>
                    <div style={{ fontSize:10,fontWeight:700,padding:'1px 8px',borderRadius:100,background:wh.is_active?'rgba(52,211,153,0.08)':'rgba(255,255,255,0.04)',border:`1px solid ${wh.is_active?'rgba(52,211,153,0.2)':'rgba(255,255,255,0.08)'}`,color:wh.is_active?'#34D399':'rgba(255,255,255,0.3)',display:'inline-flex',textTransform:'uppercase',letterSpacing:'.04em' }}>{wh.is_active?'Active':'Inactive'}</div>
                  </div>
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:8,padding:'9px 12px',background:'rgba(0,0,0,0.3)',borderRadius:8,fontFamily:'monospace',fontSize:11,color:'rgba(255,255,255,0.55)' }}>
                  <span style={{ flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{wh.url}</span>
                  <button onClick={()=>copyWebhookUrl(wh.url,wh.id)}
                    style={{ display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:6,fontSize:11,fontWeight:600,background:copiedId===wh.id?'rgba(52,211,153,0.1)':'rgba(255,255,255,0.06)',border:`1px solid ${copiedId===wh.id?'rgba(52,211,153,0.25)':'rgba(255,255,255,0.1)'}`,color:copiedId===wh.id?'#34D399':'rgba(255,255,255,0.5)',cursor:'pointer',fontFamily:'var(--sans)',transition:'all .15s',flexShrink:0 }}>
                    <span style={{ display:'flex' }}>{copiedId===wh.id?Ic.check:Ic.copy}</span>
                    {copiedId===wh.id?'Copied':'Copy'}
                  </button>
                </div>
              </div>
            )) : (
              <div style={{ textAlign:'center',padding:'32px',color:'rgba(255,255,255,0.25)',fontSize:13,border:'1px dashed rgba(255,255,255,0.07)',borderRadius:12 }}>
                No webhooks configured yet. Connect external tools to trigger Nexa automations.
              </div>
            )}
          </div>
        )}
      </div>

      {toast && (
        <div style={{ position:'fixed',bottom:24,right:24,zIndex:9999,padding:'12px 18px',borderRadius:11,background:toast.type==='error'?'rgba(255,87,87,0.12)':'rgba(52,211,153,0.1)',border:`1px solid ${toast.type==='error'?'rgba(255,87,87,0.3)':'rgba(52,211,153,0.25)'}`,color:toast.type==='error'?'#FF5757':'#34D399',fontSize:13,fontWeight:600,backdropFilter:'blur(16px)',boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
          {toast.msg}
        </div>
      )}
    </>
  )
}
