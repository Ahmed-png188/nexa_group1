'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const Ic = {
  plus:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  back:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>,
  users:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  bolt:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  close:  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  check:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  arrow:  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  chart:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 20h18"/><path d="M5 20V14l4-4 4 3 4-6 4 4v9"/></svg>,
  dollar: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
}

/* ─── Avatar ─── */
function Avatar({ name, size=40 }: { name:string; size?:number }) {
  const initials = name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()||'C'
  const colors = ['#4D9FFF','#A78BFA','#34D399','#FF7A40','#FFB547','#FF5757','#38BFFF','#F472B6']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div style={{ width:size, height:size, borderRadius:Math.round(size*0.3), background:`linear-gradient(135deg, ${color}, ${color}99)`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--display)', fontSize:Math.round(size*0.38), fontWeight:800, color:'#fff', flexShrink:0, boxShadow:`0 4px 12px ${color}30` }}>
      {initials}
    </div>
  )
}

export default function AgencyPage() {
  const supabase = createClient()
  const router = useRouter()

  const [ws,       setWs]       = useState<any>(null)
  const [clients,  setClients]  = useState<any[]>([])
  const [invites,  setInvites]  = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [sel,      setSel]      = useState<any>(null)
  const [showNew,  setShowNew]  = useState(false)
  const [creating, setCreating] = useState(false)
  const [isAgency, setIsAgency] = useState(false)
  const [toast,    setToast]    = useState<{msg:string;ok:boolean}|null>(null)
  const [mounted,  setMounted]  = useState(false)

  const [cName,     setCName]     = useState('')
  const [cEmail,    setCEmail]    = useState('')
  const [cBrand,    setCBrand]    = useState('')
  const [cRetainer, setCRetainer] = useState('')

  function toast_(msg:string, ok=true) { setToast({msg,ok}); setTimeout(()=>setToast(null),4000) }

  useEffect(() => { setMounted(true); load() }, [])

  async function load() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return
    const { data:m } = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id',user.id).limit(1).single()
    const w = (m as any)?.workspaces; setWs(w)
    setIsAgency(w?.plan==='agency'||w?.is_agency||false)
    const [{ data:cl },{ data:inv }] = await Promise.all([
      supabase.from('client_workspaces').select('*, client_workspace:client_workspace_id(id,name,brand_name,brand_voice,plan)').eq('agency_workspace_id',w?.id).order('created_at',{ascending:false}),
      supabase.from('client_invites').select('*').eq('agency_workspace_id',w?.id).eq('status','pending').order('created_at',{ascending:false}),
    ])
    setClients(cl??[]); setInvites(inv??[]); setLoading(false)
  }

  async function addClient() {
    if (!cName.trim()||creating) return; setCreating(true)
    try {
      const r = await fetch('/api/agency/create-client',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({client_name:cName,client_email:cEmail,brand_name:cBrand,agency_workspace_id:ws.id,monthly_retainer:parseFloat(cRetainer)||0})})
      const d = await r.json()
      if (d.success) { toast_('Client added'); setShowNew(false); setCName(''); setCEmail(''); setCBrand(''); setCRetainer(''); load() }
      else toast_(d.error||'Failed', false)
    } catch { toast_('Error', false) }
    setCreating(false)
  }

  async function switchWs(id:string) {
    try {
      const r = await fetch('/api/agency',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'switch_workspace',workspace_id:id})})
      const d = await r.json()
      if (d.success) router.push('/dashboard')
      else toast_('Failed to switch', false)
    } catch { toast_('Error', false) }
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - var(--topbar-h))', flexDirection:'column', gap:16, background:'#000' }}>
      <div className="nexa-spinner" style={{ width:22, height:22 }}/>
      <div style={{ fontSize:11, color:'var(--t4)', fontFamily:'var(--sans)', letterSpacing:'0.06em', textTransform:'uppercase' as const, fontWeight:500 }}>Loading</div>
    </div>
  )

  const totalMRR = clients.reduce((a,c)=>a+(c.monthly_retainer||0),0)
  const activeCount = clients.filter(c=>c.status!=='inactive').length

  /* ─── NON-AGENCY UPSELL ─── */
  if (!isAgency) return (
    <div style={{ height:'calc(100vh - var(--topbar-h))', overflowY:'auto', background:'#000' }}>
      <div style={{ position:'relative', overflow:'hidden', padding:'64px 40px', textAlign:'center' }}>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, rgba(6,10,20,0.5) 0%, rgba(8,6,24,0.5) 40%, transparent 100%)' }}/>
        <div style={{ position:'absolute', top:-60, left:'20%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(77,159,255,0.2) 0%, transparent 65%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:-40, right:'15%', width:240, height:240, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,122,64,0.15) 0%, transparent 65%)', pointerEvents:'none' }}/>

        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ width:72, height:72, borderRadius:20, background:'rgba(77,159,255,0.08)', border:'1px solid rgba(77,159,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', color:'#4D9FFF' }}>
            {Ic.users}
          </div>
          <h1 style={{ fontFamily:'var(--display)', fontSize:30, fontWeight:800, letterSpacing:'-0.05em', color:'#F4F0FF', marginBottom:12, lineHeight:1.1 }}>
            Run your agency from one place
          </h1>
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.4)', lineHeight:1.85, maxWidth:480, margin:'0 auto 32px' }}>
            Manage multiple client workspaces, track monthly retainers, switch between brands instantly, and produce brand-accurate content for every client — all without leaving Nexa.
          </p>

          {/* Feature grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, maxWidth:600, margin:'0 auto 36px', textAlign:'left' }}>
            {[
              { color:'#4D9FFF', icon:Ic.users,  title:'Client workspaces',  desc:'Each client gets their own Brand Brain, strategy, and content' },
              { color:'#34D399', icon:Ic.chart,  title:'Retainer tracking',   desc:'Track MRR across all clients from a single dashboard' },
              { color:'#FF7A40', icon:Ic.bolt,   title:'One-click switching', desc:'Jump between client workspaces without logging out' },
            ].map(f => (
              <div key={f.title} style={{ padding:'16px', background:'rgba(255,255,255,0.03)', border:`1px solid ${f.color}18`, borderRadius:14 }}>
                <div style={{ width:28, height:28, borderRadius:8, background:`${f.color}12`, border:`1px solid ${f.color}22`, display:'flex', alignItems:'center', justifyContent:'center', color:f.color, marginBottom:10 }}>{f.icon}</div>
                <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.82)', marginBottom:4, letterSpacing:'-0.01em' }}>{f.title}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', lineHeight:1.55 }}>{f.desc}</div>
              </div>
            ))}
          </div>

          <Link href="/dashboard/settings?tab=billing"
            style={{ display:'inline-flex', alignItems:'center', gap:9, padding:'14px 32px', fontSize:15, fontWeight:700, fontFamily:'var(--display)', letterSpacing:'-0.02em', background:'#4D9FFF', color:'#000', borderRadius:13, textDecoration:'none', boxShadow:'0 4px 28px rgba(77,159,255,0.4)', transition:'all 0.18s' }}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-2px)';(e.currentTarget as HTMLElement).style.boxShadow='0 8px 36px rgba(77,159,255,0.5)'}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.boxShadow='0 4px 28px rgba(77,159,255,0.4)'}}>
            <span style={{ display:'flex' }}>{Ic.bolt}</span>
            Upgrade to Agency
          </Link>
        </div>
      </div>
    </div>
  )

  /* ─── CLIENT DETAIL ─── */
  if (sel) return (
    <div style={{ padding:'28px 32px 48px', height:'calc(100vh - var(--topbar-h))', overflowY:'auto', background:'#000' }}>
      {/* Back + header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
        <button onClick={() => setSel(null)}
          style={{ width:34, height:34, borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.5)', cursor:'pointer', transition:'all 0.15s' }}
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.88)'}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.5)'}>
          {Ic.back}
        </button>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <h1 style={{ fontFamily:'var(--display)', fontSize:22, fontWeight:800, letterSpacing:'-0.04em', color:'rgba(255,255,255,0.92)', lineHeight:1 }}>
              {sel.client_name}
            </h1>
            <span style={{ fontSize:9, fontWeight:700, padding:'2px 9px', borderRadius:100, background:sel.status==='active'?'rgba(52,211,153,0.08)':'rgba(255,255,255,0.05)', border:`1px solid ${sel.status==='active'?'rgba(52,211,153,0.2)':'rgba(255,255,255,0.1)'}`, color:sel.status==='active'?'#34D399':'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.05em' }}>
              {sel.status||'active'}
            </span>
          </div>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.32)', marginTop:3 }}>{sel.brand_name||'No brand name set'}</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))', gap:8, marginBottom:24 }}>
        {[
          { label:'Monthly retainer', value:sel.monthly_retainer?`$${sel.monthly_retainer?.toLocaleString()}/mo`:'—', color:'#34D399' },
          { label:'Content created',  value:String(sel.content_count||0),   color:'#A78BFA' },
          { label:'Active since',     value:sel.created_at?.slice(0,10)||'—', color:'#4D9FFF' },
          { label:'Status',           value:sel.status||'active',           color:sel.status==='active'?'#34D399':'#FFB547' },
        ].map(s => (
          <div key={s.label} className="nexa-card" style={{ padding:'14px 16px', borderRadius:13 }}>
            <div className="nexa-label" style={{ marginBottom:6 }}>{s.label}</div>
            <div className="nexa-num" style={{ fontSize:18, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Notes */}
      {sel.notes && (
        <div style={{ padding:'16px 18px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, marginBottom:20, fontSize:13, color:'rgba(255,255,255,0.58)', lineHeight:1.72 }}>
          {sel.notes}
        </div>
      )}

      {/* Switch workspace CTA */}
      {sel.client_workspace_id && (
        <div style={{ padding:'20px 24px', background:'linear-gradient(145deg, rgba(77,159,255,0.08) 0%, rgba(77,159,255,0.03) 100%)', border:'1px solid rgba(77,159,255,0.2)', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.85)', marginBottom:3, letterSpacing:'-0.01em' }}>
              Switch to {sel.client_name}'s workspace
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.38)' }}>
              Create content, run strategy, and manage everything from their dashboard
            </div>
          </div>
          <button onClick={() => switchWs(sel.client_workspace_id)}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 22px', fontSize:13, fontWeight:700, fontFamily:'var(--display)', letterSpacing:'-0.02em', background:'#4D9FFF', color:'#000', border:'none', borderRadius:11, cursor:'pointer', boxShadow:'0 4px 18px rgba(77,159,255,0.35)', transition:'all 0.18s', flexShrink:0 }}>
            <span style={{ display:'flex' }}>{Ic.bolt}</span>Switch workspace
          </button>
        </div>
      )}
    </div>
  )

  /* ─── MAIN AGENCY DASHBOARD ─── */
  return (
    <>
      <div style={{
        padding:'28px 32px 48px', height:'calc(100vh - var(--topbar-h))', overflowY:'auto', background:'#000',
        opacity:mounted?1:0, transition:'opacity 0.4s ease',
      }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28 }}>
          <div>
            <h1 style={{ fontFamily:'var(--display)', fontSize:22, fontWeight:800, letterSpacing:'-0.03em', color:'rgba(255,255,255,0.92)', lineHeight:1, marginBottom:5 }}>Agency</h1>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>
              {activeCount} active client{activeCount!==1?'s':''} · ${totalMRR.toLocaleString()} MRR
            </p>
          </div>
          <button onClick={() => setShowNew(true)}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 18px', fontFamily:'var(--display)', fontWeight:700, fontSize:13, letterSpacing:'-0.02em', background:'#4D9FFF', color:'#000', border:'none', borderRadius:11, cursor:'pointer', boxShadow:'0 4px 18px rgba(77,159,255,0.35)', transition:'all 0.18s' }}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-1px)';(e.currentTarget as HTMLElement).style.boxShadow='0 7px 24px rgba(77,159,255,0.45)'}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.boxShadow='0 4px 18px rgba(77,159,255,0.35)'}}>
            <span style={{ display:'flex' }}>{Ic.plus}</span>Add client
          </button>
        </div>

        {/* MRR + stats bar */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(170px,1fr))', gap:8, marginBottom:24 }}>
          {[
            { label:'Active clients',  value:activeCount,                        color:'#34D399', icon:Ic.users  },
            { label:'Pending invites', value:invites.length,                     color:'#FFB547', icon:Ic.arrow  },
            { label:'Monthly revenue', value:`$${totalMRR.toLocaleString()}`,    color:'#4D9FFF', icon:Ic.dollar },
            { label:'Total clients',   value:clients.length,                     color:'#A78BFA', icon:Ic.chart  },
          ].map(s => (
            <div key={s.label} className="nexa-card" style={{ padding:'14px 18px', borderRadius:14, display:'flex', alignItems:'center', gap:11 }}>
              <div style={{ width:32, height:32, borderRadius:9, background:`${s.color}12`, border:`1px solid ${s.color}22`, display:'flex', alignItems:'center', justifyContent:'center', color:s.color, flexShrink:0 }}>{s.icon}</div>
              <div>
                <div className="nexa-num" style={{ fontFamily:'var(--mono)', fontWeight:300, fontSize:28, letterSpacing:'-0.04em', color:s.color }}>{s.value}</div>
                <div className="nexa-label" style={{ fontFamily:'var(--sans)', fontSize:9, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase' as const, color:'var(--t4)', marginTop:3 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Client grid */}
        {clients.length > 0 ? (
          <>
            <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.28)', letterSpacing:'0.09em', textTransform:'uppercase', marginBottom:14 }}>
              Clients · {clients.length}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(290px,1fr))', gap:10 }}>
              {clients.map(c => (
                <div key={c.id}
                  onClick={() => setSel(c)}
                  className="nexa-card"
                  style={{ padding:'20px 22px', borderRadius:18, cursor:'pointer' }}>
                  {/* Top row */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <Avatar name={c.client_name} size={40}/>
                      <div>
                        <div style={{ fontFamily:'var(--display)', fontWeight:600, fontSize:14, color:'rgba(255,255,255,0.9)', letterSpacing:'-0.02em', marginBottom:2 }}>{c.client_name}</div>
                        <div style={{ fontSize:11, color:'rgba(255,255,255,0.38)' }}>{c.brand_name||'No brand set'}</div>
                      </div>
                    </div>
                    <span style={{ fontSize:9, fontWeight:700, padding:'3px 9px', borderRadius:100, background:c.status==='active'?'rgba(52,211,153,0.08)':'rgba(255,255,255,0.05)', border:`1px solid ${c.status==='active'?'rgba(52,211,153,0.2)':'rgba(255,255,255,0.09)'}`, color:c.status==='active'?'#34D399':'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                      {c.status||'active'}
                    </span>
                  </div>

                  {/* Retainer + switch */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div>
                      {c.monthly_retainer > 0 ? (
                        <div style={{ fontFamily:'var(--mono)', fontWeight:300, fontSize:13, color:'rgba(255,255,255,0.72)', letterSpacing:0, lineHeight:1 }}>
                          ${c.monthly_retainer?.toLocaleString()}
                          <span style={{ fontSize:11, fontWeight:400, color:'rgba(255,255,255,0.3)', letterSpacing:0 }}>/mo</span>
                        </div>
                      ) : (
                        <div style={{ fontSize:12, color:'rgba(255,255,255,0.28)' }}>No retainer set</div>
                      )}
                    </div>
                    {c.client_workspace_id && (
                      <button
                        onClick={e => { e.stopPropagation(); switchWs(c.client_workspace_id) }}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 13px', borderRadius:9, fontSize:11, fontWeight:700, background:'rgba(77,159,255,0.1)', border:'1px solid rgba(77,159,255,0.22)', color:'#4D9FFF', cursor:'pointer', fontFamily:'var(--sans)', transition:'all 0.15s', letterSpacing:'-0.01em' }}
                        onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(77,159,255,0.18)';(e.currentTarget as HTMLElement).style.borderColor='rgba(77,159,255,0.38)'}}
                        onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(77,159,255,0.1)';(e.currentTarget as HTMLElement).style.borderColor='rgba(77,159,255,0.22)'}}>
                        <span style={{ display:'flex' }}>{Ic.bolt}</span>
                        Switch →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'44vh', textAlign:'center', padding:'40px', border:'1px dashed rgba(255,255,255,0.08)', borderRadius:18 }}>
            <div style={{ width:56, height:56, borderRadius:16, background:'rgba(77,159,255,0.07)', border:'1px solid rgba(77,159,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'#4D9FFF', marginBottom:20 }}>
              {Ic.users}
            </div>
            <h3 style={{ fontFamily:'var(--display)', fontWeight:700, fontSize:20, letterSpacing:'-0.02em', color:'rgba(255,255,255,0.85)', marginBottom:9 }}>No clients yet</h3>
            <p style={{ fontFamily:'var(--sans)', fontSize:14, lineHeight:1.75, color:'rgba(255,255,255,0.32)', maxWidth:360, marginBottom:22 }}>
              Add your first client to start managing their brand, content, and workspace from one place.
            </p>
            <button onClick={() => setShowNew(true)}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 26px', fontFamily:'var(--display)', fontWeight:700, fontSize:13, letterSpacing:'-0.02em', background:'#4D9FFF', color:'#000', border:'none', borderRadius:11, cursor:'pointer', boxShadow:'0 4px 22px rgba(77,159,255,0.38)', transition:'all 0.18s' }}>
              <span style={{ display:'flex' }}>{Ic.plus}</span>Add first client
            </button>
          </div>
        )}

        {/* Pending invites */}
        {invites.length > 0 && (
          <div style={{ marginTop:28 }}>
            <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.28)', letterSpacing:'0.09em', textTransform:'uppercase', marginBottom:12 }}>
              Pending invites · {invites.length}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              {invites.map(inv => (
                <div key={inv.id} style={{ display:'flex', alignItems:'center', gap:13, padding:'13px 16px', background:'rgba(255,181,71,0.04)', border:'1px solid rgba(255,181,71,0.14)', borderRadius:13 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:'#FFB547', boxShadow:'0 0 6px #FFB547', flexShrink:0 }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.78)', letterSpacing:'-0.01em' }}>{inv.client_name}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:2 }}>
                      {inv.client_email} · Invite sent
                    </div>
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:100, background:'rgba(255,181,71,0.1)', border:'1px solid rgba(255,181,71,0.22)', color:'#FFB547', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                    Pending
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add client modal */}
      {showNew && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(14px)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={e => { if(e.target===e.currentTarget) setShowNew(false) }}>
          <div style={{ background:'rgba(10,10,18,0.98)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, padding:'26px', width:'100%', maxWidth:440, boxShadow:'0 32px 80px rgba(0,0,0,0.85)', animation:'pageUp 0.22s ease both' }}>

            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
              <div>
                <div style={{ fontFamily:'var(--display)', fontSize:17, fontWeight:800, letterSpacing:'-0.03em', color:'rgba(255,255,255,0.92)', lineHeight:1, marginBottom:3 }}>
                  Add new client
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>They'll receive an invite to join their workspace</div>
              </div>
              <button onClick={() => setShowNew(false)}
                style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,0.06)', border:'none', color:'rgba(255,255,255,0.38)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {Ic.close}
              </button>
            </div>

            {/* Form */}
            {[
              { label:'Client name',           val:cName,     set:setCName,     ph:'Ahmed Al-Rashidi',  type:'text',   req:true  },
              { label:'Email',                 val:cEmail,    set:setCEmail,    ph:'ahmed@brand.com',   type:'email',  req:false },
              { label:'Brand / company name',  val:cBrand,    set:setCBrand,    ph:'Brand Inc.',        type:'text',   req:false },
              { label:'Monthly retainer ($)',  val:cRetainer, set:setCRetainer, ph:'2,500',             type:'number', req:false },
            ].map(f => (
              <div key={f.label} style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.42)', marginBottom:7 }}>
                  {f.label}{f.req && <span style={{ color:'#FF5757', marginLeft:3 }}>*</span>}
                </div>
                <input
                  type={f.type}
                  value={f.val}
                  onChange={e => f.set(e.target.value)}
                  placeholder={f.ph}
                  style={{ width:'100%', padding:'11px 13px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'rgba(255,255,255,0.88)', fontSize:13, fontFamily:'var(--sans)', outline:'none', transition:'border-color 0.15s', boxSizing:'border-box' as const }}
                  onFocus={e=>e.target.style.borderColor='rgba(77,159,255,0.35)'}
                  onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}
                />
              </div>
            ))}

            <button onClick={addClient} disabled={!cName.trim()||creating}
              style={{ width:'100%', padding:'14px', fontSize:14, fontWeight:700, fontFamily:'var(--display)', letterSpacing:'-0.02em', background:cName.trim()?'#4D9FFF':'rgba(255,255,255,0.04)', color:cName.trim()?'#000':'rgba(255,255,255,0.2)', border:'none', borderRadius:12, cursor:cName.trim()?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:9, marginTop:8, transition:'all 0.18s', boxShadow:cName.trim()?'0 4px 22px rgba(77,159,255,0.38)':'none' }}>
              {creating
                ? <><div className="nexa-spinner" style={{ width:14, height:14 }}/>Adding client…</>
                : <><span style={{ display:'flex' }}>{Ic.plus}</span>Add client</>}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, padding:'12px 20px', borderRadius:12, background:toast.ok?'rgba(52,211,153,0.1)':'rgba(255,87,87,0.12)', border:`1px solid ${toast.ok?'rgba(52,211,153,0.28)':'rgba(255,87,87,0.3)'}`, color:toast.ok?'#34D399':'#FF5757', fontSize:13, fontWeight:600, backdropFilter:'blur(16px)', boxShadow:'0 8px 32px rgba(0,0,0,0.45)', animation:'pageUp 0.2s ease both' }}>
          {toast.msg}
        </div>
      )}
    </>
  )
}
