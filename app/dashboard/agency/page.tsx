'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const PLAT_COLORS: Record<string,string> = {
  instagram:'#E1306C', linkedin:'#0A66C2', x:'#E7E7E7',
  tiktok:'#FF0050',    email:'#4D9FFF',    general:'#888',
}

const Ic = {
  plus:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  back:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>,
  users:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  chart:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18"/><path d="M5 20V14l4-4 4 3 4-6 4 4v9"/></svg>,
  mail:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  bolt:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  check:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  close:  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
}

export default function AgencyPage() {
  const supabase = createClient()
  const [ws,         setWs]       = useState<any>(null)
  const [clients,    setClients]  = useState<any[]>([])
  const [invites,    setInvites]  = useState<any[]>([])
  const [loading,    setLoading]  = useState(true)
  const [selClient,  setSelClient]= useState<any>(null)
  const [showNew,    setShowNew]  = useState(false)
  const [creating,   setCreating] = useState(false)
  const [isAgency,   setIsAgency] = useState(false)
  const [toast,      setToast]    = useState<{msg:string;type:'success'|'error'}|null>(null)

  const [cName,    setCName]    = useState('')
  const [cEmail,   setCEmail]   = useState('')
  const [cBrand,   setCBrand]   = useState('')
  const [cRetainer,setCRetainer]= useState('')

  function showToast(msg:string, type:'success'|'error'='success') { setToast({msg,type}); setTimeout(()=>setToast(null),4000) }

  useEffect(() => { load() }, [])

  async function load() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return
    const { data:m } = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id',user.id).limit(1).single()
    const w = (m as any)?.workspaces; setWs(w)
    setIsAgency(w?.plan==='dominate'||w?.is_agency||false)
    const [{ data:cl }, { data:inv }] = await Promise.all([
      supabase.from('agency_clients').select('*, client_workspaces(*)').eq('agency_workspace_id',w?.id).order('created_at',{ascending:false}),
      supabase.from('agency_invites').select('*').eq('agency_workspace_id',w?.id).eq('status','pending').order('created_at',{ascending:false}),
    ])
    setClients(cl??[]); setInvites(inv??[]); setLoading(false)
  }

  async function createClient_() {
    if (!cName.trim()||creating) return; setCreating(true)
    try {
      const r = await fetch('/api/agency',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'invite_client',agency_workspace_id:ws.id,client_name:cName,client_email:cEmail,brand_name:cBrand,monthly_retainer:parseFloat(cRetainer)||0})})
      const d = await r.json()
      if (d.success){showToast('Client invited');setShowNew(false);setCName('');setCEmail('');setCBrand('');setCRetainer('');load()}
      else showToast(d.error||'Failed','error')
    } catch { showToast('Error','error') }
    setCreating(false)
  }

  async function switchToClient(clientWsId:string) {
    try {
      const r = await fetch('/api/agency',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'switch_workspace',workspace_id:clientWsId})})
      const d = await r.json()
      if (d.success) window.location.href='/dashboard'
      else showToast('Failed to switch','error')
    } catch { showToast('Error','error') }
  }

  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'rgba(255,255,255,0.3)',fontSize:13 }}>Loading…</div>

  return (
    <>
      <style>{`
        @keyframes agUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes agSpin{to{transform:rotate(360deg)}}
        .cl-card:hover{border-color:rgba(255,255,255,0.13)!important;background:rgba(255,255,255,0.05)!important;}
      `}</style>

      <div style={{ padding:'24px 28px',overflowY:'auto',height:'calc(100vh - var(--topbar-h))' }}>

        {/* Header */}
        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:24,animation:'agUp .4s ease both' }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            {selClient && (
              <button onClick={()=>setSelClient(null)}
                style={{ width:32,height:32,borderRadius:8,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.09)',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,0.5)',cursor:'pointer' }}>
                {Ic.back}
              </button>
            )}
            <div>
              <h1 style={{ fontFamily:'var(--display)',fontSize:22,fontWeight:800,letterSpacing:'-0.04em',color:'rgba(255,255,255,0.92)',lineHeight:1,marginBottom:4 }}>
                {selClient?selClient.client_name:'Agency'}
              </h1>
              <p style={{ fontSize:12,color:'rgba(255,255,255,0.3)' }}>
                {selClient?`${selClient.brand_name||'Client workspace'}`:`${clients.length} client${clients.length!==1?'s':''} · ${invites.length} pending`}
              </p>
            </div>
          </div>
          {!selClient && isAgency && (
            <button onClick={()=>setShowNew(true)}
              style={{ display:'flex',alignItems:'center',gap:7,padding:'8px 16px',fontSize:13,fontWeight:700,background:'#4D9FFF',color:'#000',border:'none',borderRadius:10,cursor:'pointer',fontFamily:'var(--sans)',boxShadow:'0 4px 16px rgba(77,159,255,0.3)',letterSpacing:'-0.01em' }}>
              <span style={{ display:'flex' }}>{Ic.plus}</span>Add client
            </button>
          )}
        </div>

        {/* Non-agency state */}
        {!isAgency && !selClient && (
          <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'55vh',textAlign:'center',padding:'40px 20px',animation:'agUp .3s ease both' }}>
            <div style={{ width:58,height:58,borderRadius:16,background:'rgba(77,159,255,0.07)',border:'1px solid rgba(77,159,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',color:'#4D9FFF',marginBottom:20 }}>{Ic.users}</div>
            <h3 style={{ fontFamily:'var(--display)',fontSize:18,fontWeight:800,letterSpacing:'-0.03em',marginBottom:8,color:'rgba(255,255,255,0.88)' }}>Agency Mode</h3>
            <p style={{ fontSize:13,color:'rgba(255,255,255,0.35)',lineHeight:1.7,maxWidth:420,marginBottom:22 }}>
              Manage multiple client workspaces, track retainers, and produce brand-accurate content for every client — all from one dashboard.
            </p>
            <a href="/dashboard/settings?tab=billing"
              style={{ display:'flex',alignItems:'center',gap:8,padding:'12px 24px',fontSize:13,fontWeight:700,background:'#4D9FFF',color:'#000',borderRadius:10,textDecoration:'none',boxShadow:'0 4px 16px rgba(77,159,255,0.3)',letterSpacing:'-0.01em' }}>
              <span style={{ display:'flex' }}>{Ic.bolt}</span>Upgrade to Dominate
            </a>
          </div>
        )}

        {/* Clients list */}
        {isAgency && !selClient && (
          <div style={{ animation:'agUp .35s ease both' }}>

            {/* Stats */}
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:8,marginBottom:24 }}>
              {[
                { label:'Active clients',  value:clients.filter(c=>c.status==='active').length, color:'#34D399' },
                { label:'Pending invites', value:invites.length,                                color:'#FFB547' },
                { label:'Monthly revenue', value:`$${clients.reduce((a,c)=>a+(c.monthly_retainer||0),0).toLocaleString()}`, color:'#4D9FFF' },
              ].map(s=>(
                <div key={s.label} style={{ padding:'12px 16px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12 }}>
                  <div style={{ fontFamily:'var(--display)',fontSize:22,fontWeight:800,letterSpacing:'-0.04em',color:s.color,lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:10,color:'rgba(255,255,255,0.3)',marginTop:4,fontWeight:500 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Client cards */}
            {clients.length>0 ? (
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:10 }}>
                {clients.map(c=>(
                  <div key={c.id} className="cl-card"
                    style={{ padding:'18px 20px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,transition:'all .15s',cursor:'pointer' }}
                    onClick={()=>setSelClient(c)}>
                    <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12 }}>
                      <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                        <div style={{ width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#4D9FFF,#A78BFA)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--display)',fontSize:14,fontWeight:800,color:'#fff',flexShrink:0 }}>
                          {c.client_name?.[0]?.toUpperCase()||'C'}
                        </div>
                        <div>
                          <div style={{ fontSize:14,fontWeight:700,color:'rgba(255,255,255,0.88)',letterSpacing:'-0.02em' }}>{c.client_name}</div>
                          <div style={{ fontSize:11,color:'rgba(255,255,255,0.35)' }}>{c.brand_name||'No brand set'}</div>
                        </div>
                      </div>
                      <span style={{ fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:100,background:c.status==='active'?'rgba(52,211,153,0.08)':'rgba(255,255,255,0.05)',border:`1px solid ${c.status==='active'?'rgba(52,211,153,0.2)':'rgba(255,255,255,0.1)'}`,color:c.status==='active'?'#34D399':'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:'.04em' }}>{c.status||'active'}</span>
                    </div>
                    <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                      {c.monthly_retainer>0 && (
                        <span style={{ fontFamily:'var(--display)',fontSize:16,fontWeight:800,color:'rgba(255,255,255,0.65)',letterSpacing:'-0.03em' }}>${c.monthly_retainer?.toLocaleString()}<span style={{ fontSize:10,fontWeight:400,color:'rgba(255,255,255,0.3)' }}>/mo</span></span>
                      )}
                      {c.client_workspaces?.id && (
                        <button onClick={e=>{e.stopPropagation();switchToClient(c.client_workspaces.id)}}
                          style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 11px',borderRadius:7,fontSize:11,fontWeight:600,background:'rgba(77,159,255,0.08)',border:'1px solid rgba(77,159,255,0.2)',color:'#4D9FFF',cursor:'pointer',fontFamily:'var(--sans)',transition:'all .15s' }}>
                          <span style={{ display:'flex' }}>{Ic.bolt}</span>Switch →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'40vh',textAlign:'center',padding:'40px',border:'1px dashed rgba(255,255,255,0.07)',borderRadius:14 }}>
                <div style={{ fontSize:13,color:'rgba(255,255,255,0.25)',marginBottom:16 }}>No clients yet. Add your first client to get started.</div>
                <button onClick={()=>setShowNew(true)}
                  style={{ display:'flex',alignItems:'center',gap:7,padding:'10px 20px',fontSize:13,fontWeight:700,background:'#4D9FFF',color:'#000',border:'none',borderRadius:10,cursor:'pointer',fontFamily:'var(--sans)',boxShadow:'0 4px 14px rgba(77,159,255,0.3)' }}>
                  <span style={{ display:'flex' }}>{Ic.plus}</span>Add first client
                </button>
              </div>
            )}

            {/* Pending invites */}
            {invites.length>0 && (
              <div style={{ marginTop:24 }}>
                <div style={{ fontSize:9,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'rgba(255,255,255,0.25)',marginBottom:12 }}>Pending invites · {invites.length}</div>
                {invites.map(inv=>(
                  <div key={inv.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 16px',background:'rgba(255,181,71,0.04)',border:'1px solid rgba(255,181,71,0.12)',borderRadius:11,marginBottom:6 }}>
                    <div style={{ width:8,height:8,borderRadius:'50%',background:'#FFB547',flexShrink:0 }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13,fontWeight:600,color:'rgba(255,255,255,0.75)' }}>{inv.client_name}</div>
                      <div style={{ fontSize:11,color:'rgba(255,255,255,0.35)' }}>{inv.client_email} · Invited</div>
                    </div>
                    <span style={{ fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:100,background:'rgba(255,181,71,0.1)',border:'1px solid rgba(255,181,71,0.2)',color:'#FFB547' }}>Pending</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Client detail */}
        {selClient && (
          <div style={{ animation:'agUp .3s ease both' }}>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:8,marginBottom:20 }}>
              {[
                { label:'Status',      value:selClient.status||'active',                           color:'#34D399' },
                { label:'Retainer',    value:selClient.monthly_retainer?`$${selClient.monthly_retainer?.toLocaleString()}/mo`:'—', color:'#4D9FFF' },
                { label:'Content made',value:String(selClient.content_count||0),                  color:'#A78BFA' },
                { label:'Since',       value:selClient.created_at?.slice(0,10)||'—',              color:'rgba(255,255,255,0.5)' },
              ].map(s=>(
                <div key={s.label} style={{ padding:'12px 14px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:11 }}>
                  <div style={{ fontSize:9,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',color:'rgba(255,255,255,0.25)',marginBottom:5 }}>{s.label}</div>
                  <div style={{ fontSize:13,fontWeight:700,color:s.color,letterSpacing:'-0.02em' }}>{s.value}</div>
                </div>
              ))}
            </div>
            {selClient.notes && (
              <div style={{ padding:'14px 16px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:11,marginBottom:16,fontSize:13,color:'rgba(255,255,255,0.55)',lineHeight:1.65 }}>{selClient.notes}</div>
            )}
            {selClient.client_workspaces?.id && (
              <button onClick={()=>switchToClient(selClient.client_workspaces.id)}
                style={{ display:'flex',alignItems:'center',gap:8,padding:'12px 24px',fontSize:13,fontWeight:700,background:'#4D9FFF',color:'#000',border:'none',borderRadius:10,cursor:'pointer',fontFamily:'var(--sans)',boxShadow:'0 4px 16px rgba(77,159,255,0.3)',letterSpacing:'-0.01em' }}>
                <span style={{ display:'flex' }}>{Ic.bolt}</span>Switch to {selClient.client_name}'s workspace
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add client modal */}
      {showNew && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(12px)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}
          onClick={e=>{ if(e.target===e.currentTarget)setShowNew(false) }}>
          <div style={{ background:'rgba(14,14,22,0.98)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:18,padding:'24px',width:'100%',maxWidth:420,boxShadow:'0 32px 80px rgba(0,0,0,0.8)',animation:'agUp .2s ease both' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
              <div style={{ fontFamily:'var(--display)',fontSize:16,fontWeight:800,letterSpacing:'-0.03em',color:'rgba(255,255,255,0.9)' }}>Add new client</div>
              <button onClick={()=>setShowNew(false)} style={{ width:26,height:26,borderRadius:7,background:'rgba(255,255,255,0.06)',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>{Ic.close}</button>
            </div>
            {[
              { label:'Client name *', val:cName,     set:setCName,     ph:'Ahmed's Brand',       type:'text' },
              { label:'Email',         val:cEmail,    set:setCEmail,    ph:'client@email.com',    type:'email' },
              { label:'Brand name',    val:cBrand,    set:setCBrand,    ph:'Brand Inc.',          type:'text' },
              { label:'Monthly retainer ($)', val:cRetainer, set:setCRetainer, ph:'2500',        type:'number' },
            ].map(f=>(
              <div key={f.label} style={{ marginBottom:14 }}>
                <div style={{ fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.4)',marginBottom:7 }}>{f.label}</div>
                <input type={f.type} value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph}
                  style={{ width:'100%',padding:'10px 12px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:9,color:'rgba(255,255,255,0.88)',fontSize:13,fontFamily:'var(--sans)',outline:'none' }}
                  onFocus={e=>e.target.style.borderColor='rgba(77,159,255,0.35)'}
                  onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
              </div>
            ))}
            <button onClick={createClient_} disabled={!cName.trim()||creating}
              style={{ width:'100%',padding:'13px',fontSize:14,fontWeight:700,fontFamily:'var(--display)',letterSpacing:'-0.02em',background:cName.trim()?'#4D9FFF':'rgba(255,255,255,0.04)',color:cName.trim()?'#000':'rgba(255,255,255,0.2)',border:'none',borderRadius:11,cursor:cName.trim()?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',gap:9,marginTop:6,transition:'all .2s',boxShadow:cName.trim()?'0 4px 20px rgba(77,159,255,0.35)':'none' }}>
              {creating?<><div style={{ width:14,height:14,border:'2px solid rgba(0,0,0,0.25)',borderTopColor:'#000',borderRadius:'50%',animation:'agSpin .8s linear infinite' }}/>Creating…</>:<><span style={{ display:'flex' }}>{Ic.plus}</span>Add client</>}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position:'fixed',bottom:24,right:24,zIndex:9999,padding:'12px 18px',borderRadius:11,background:toast.type==='error'?'rgba(255,87,87,0.12)':'rgba(52,211,153,0.1)',border:`1px solid ${toast.type==='error'?'rgba(255,87,87,0.3)':'rgba(52,211,153,0.25)'}`,color:toast.type==='error'?'#FF5757':'#34D399',fontSize:13,fontWeight:600,backdropFilter:'blur(16px)',boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
          {toast.msg}
        </div>
      )}
    </>
  )
}
