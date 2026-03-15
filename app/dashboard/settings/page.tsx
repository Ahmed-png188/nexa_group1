'use client'
import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'

type Tab = 'profile'|'workspace'|'billing'|'password'

const PLANS = [
  { id:'spark',      name:'Spark',      price:0,    credits:100,  desc:'Get started for free',                  color:'rgba(255,255,255,0.5)' },
  { id:'grow',       name:'Grow',       price:29,   credits:1000, desc:'For creators building in public',       color:'#4D9FFF' },
  { id:'scale',      name:'Scale',      price:79,   credits:3500, desc:'For serious personal brands',           color:'#A78BFA' },
  { id:'dominate',   name:'Dominate',   price:149,  credits:8000, desc:'For agencies and teams',                color:'#FF7A40' },
]

const Ic = {
  user:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  ws:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  billing: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  lock:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  check:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  out:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  bolt:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
}

const TABS = [
  { id:'profile'   as Tab, label:'Profile',   icon:Ic.user    },
  { id:'workspace' as Tab, label:'Workspace', icon:Ic.ws      },
  { id:'billing'   as Tab, label:'Billing',   icon:Ic.billing },
  { id:'password'  as Tab, label:'Password',  icon:Ic.lock    },
]

function Input({ label, value, onChange, placeholder, type='text', hint }: any) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.45)',marginBottom:7 }}>{label}</div>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ width:'100%',padding:'11px 13px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'rgba(255,255,255,0.88)',fontSize:13,fontFamily:'var(--sans)',outline:'none',transition:'border-color .15s' }}
        onFocus={e=>e.target.style.borderColor='rgba(77,159,255,0.35)'}
        onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
      {hint && <div style={{ fontSize:10,color:'rgba(255,255,255,0.28)',marginTop:5 }}>{hint}</div>}
    </div>
  )
}

function TextArea({ label, value, onChange, placeholder, rows=4, hint }: any) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.45)',marginBottom:7 }}>{label}</div>
      <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
        style={{ width:'100%',padding:'11px 13px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'rgba(255,255,255,0.88)',fontSize:13,fontFamily:'var(--sans)',outline:'none',resize:'vertical',lineHeight:1.65,transition:'border-color .15s' }}
        onFocus={e=>e.target.style.borderColor='rgba(77,159,255,0.35)'}
        onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
      {hint && <div style={{ fontSize:10,color:'rgba(255,255,255,0.28)',marginTop:5 }}>{hint}</div>}
    </div>
  )
}

function SaveBtn({ onClick, saving, saved }: any) {
  return (
    <button onClick={onClick} disabled={saving}
      style={{ display:'flex',alignItems:'center',gap:8,padding:'11px 24px',fontSize:13,fontWeight:700,fontFamily:'var(--display)',letterSpacing:'-0.02em',background:saved?'rgba(52,211,153,0.12)':saving?'rgba(255,255,255,0.04)':'#4D9FFF',color:saved?'#34D399':saving?'rgba(255,255,255,0.3)':'#000',border:`1px solid ${saved?'rgba(52,211,153,0.25)':'transparent'}`,borderRadius:10,cursor:saving?'default':'pointer',transition:'all .2s',boxShadow:saved||saving?'none':'0 4px 16px rgba(77,159,255,0.3)' }}>
      {saving?<><div style={{ width:13,height:13,border:'2px solid rgba(255,255,255,0.2)',borderTopColor:'rgba(255,255,255,0.6)',borderRadius:'50%',animation:'settSpin .8s linear infinite' }}/>Saving…</>:saved?<><span style={{ display:'flex' }}>{Ic.check}</span>Saved</>:<><span style={{ display:'flex' }}>{Ic.bolt}</span>Save changes</>}
    </button>
  )
}

function SettingsPageInner() {
  const supabase     = createClient()
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [tab,       setTab]       = useState<Tab>((searchParams.get('tab') as Tab)||'profile')
  const [user,      setUser]      = useState<any>(null)
  const [ws,        setWs]        = useState<any>(null)
  const [credits,   setCredits]   = useState<any>(null)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [toast,     setToast]     = useState<{msg:string;type:'success'|'error'}|null>(null)

  // profile
  const [fullName,  setFullName]  = useState('')
  const [bio,       setBio]       = useState('')
  // workspace
  const [wsName,    setWsName]    = useState('')
  const [brandVoice,setBrandVoice]= useState('')
  const [brandTone, setBrandTone] = useState('')
  const [targetAud, setTargetAud] = useState('')
  const [niche,     setNiche]     = useState('')
  // password
  const [newPw,     setNewPw]     = useState('')
  const [confPw,    setConfPw]    = useState('')
  const [pwErr,     setPwErr]     = useState('')

  function showToast(msg:string, type:'success'|'error'='success') { setToast({msg,type}); setTimeout(()=>setToast(null),4000) }

  useEffect(() => { load() }, [])
  useEffect(() => {
    const t = searchParams.get('tab') as Tab
    if (t) setTab(t)
  }, [searchParams])

  async function load() {
    const { data:{ user:u } } = await supabase.auth.getUser()
    if (!u) return
    const [{ data:p }, { data:m }, { data:cr }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id',u.id).single(),
      supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id',u.id).limit(1).single(),
      supabase.from('credits').select('*').eq('workspace_id',(m as any)?.workspace_id).single(),
    ])
    const w = (m as any)?.workspaces
    setUser({ ...u, ...p }); setWs(w); setCredits(cr)
    setFullName(p?.full_name||''); setBio(p?.bio||'')
    setWsName(w?.name||''); setBrandVoice(w?.brand_voice||''); setBrandTone(w?.brand_tone||'')
    setTargetAud(w?.target_audience||''); setNiche(w?.niche||'')
    setLoading(false)
  }

  async function saveProfile() {
    setSaving(true); setSaved(false)
    const { data:{ user:u } } = await supabase.auth.getUser()
    await supabase.from('profiles').update({ full_name:fullName, bio }).eq('id',u!.id)
    showToast('Profile saved'); setSaved(true); setTimeout(()=>setSaved(false),3000)
    setSaving(false)
  }

  async function saveWorkspace() {
    if (!ws) return; setSaving(true); setSaved(false)
    await supabase.from('workspaces').update({ name:wsName, brand_voice:brandVoice, brand_tone:brandTone, target_audience:targetAud, niche }).eq('id',ws.id)
    showToast('Workspace saved'); setSaved(true); setTimeout(()=>setSaved(false),3000)
    setSaving(false)
  }

  async function savePassword() {
    if (newPw!==confPw) { setPwErr("Passwords don't match"); return }
    if (newPw.length<6) { setPwErr('Minimum 6 characters'); return }
    setPwErr(''); setSaving(true)
    const { error } = await supabase.auth.updateUser({ password:newPw })
    if (error) showToast(error.message,'error')
    else { showToast('Password updated'); setNewPw(''); setConfPw('') }
    setSaving(false)
  }

  async function checkout(planId:string) {
    const r = await fetch('/api/create-checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan_id:planId,workspace_id:ws?.id})})
    const d = await r.json()
    if (d.url) router.push(d.url)
  }

  async function signOut() { await supabase.auth.signOut(); router.push('/') }

  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'rgba(255,255,255,0.3)',fontSize:13 }}>Loading…</div>

  const initial = (user?.full_name?.[0]||user?.email?.[0]||'U').toUpperCase()
  const currentPlan = ws?.plan||'spark'

  return (
    <>
      <style>{`
        @keyframes settSpin{to{transform:rotate(360deg)}}
        @keyframes settUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .stab:hover{background:rgba(255,255,255,0.05)!important;}
        .plan-card:hover{border-color:rgba(255,255,255,0.14)!important;}
      `}</style>

      <div style={{ display:'grid',gridTemplateColumns:'200px 1fr',height:'calc(100vh - var(--topbar-h))',overflow:'hidden' }}>

        {/* Sidebar */}
        <div style={{ borderRight:'1px solid rgba(255,255,255,0.06)',padding:'24px 16px',display:'flex',flexDirection:'column',gap:2 }}>
          {/* User */}
          <div style={{ padding:'12px',borderRadius:12,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',marginBottom:16,textAlign:'center' }}>
            <div style={{ width:44,height:44,borderRadius:14,background:'linear-gradient(135deg,#4D9FFF,#A78BFA)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--display)',fontSize:18,fontWeight:800,color:'#fff',margin:'0 auto 8px' }}>{initial}</div>
            <div style={{ fontSize:12,fontWeight:700,color:'rgba(255,255,255,0.85)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user?.full_name||'User'}</div>
            <div style={{ fontSize:10,color:'rgba(255,255,255,0.35)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user?.email}</div>
          </div>

          {TABS.map(t=>{
            const on = tab===t.id
            return (
              <button key={t.id} className="stab" onClick={()=>setTab(t.id)}
                style={{ display:'flex',alignItems:'center',gap:9,padding:'9px 12px',borderRadius:9,background:on?'rgba(77,159,255,0.08)':'transparent',border:`1px solid ${on?'rgba(77,159,255,0.2)':'transparent'}`,color:on?'#4D9FFF':'rgba(255,255,255,0.45)',cursor:'pointer',fontSize:13,fontWeight:on?600:400,fontFamily:'var(--sans)',transition:'all .15s',textAlign:'left',width:'100%' }}>
                <span style={{ display:'flex' }}>{t.icon}</span>{t.label}
              </button>
            )
          })}

          <div style={{ flex:1 }}/>

          <button onClick={signOut}
            style={{ display:'flex',alignItems:'center',gap:9,padding:'9px 12px',borderRadius:9,background:'transparent',border:'1px solid transparent',color:'rgba(255,87,87,0.7)',cursor:'pointer',fontSize:13,fontFamily:'var(--sans)',transition:'all .15s',textAlign:'left',width:'100%',marginTop:8 }}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,87,87,0.07)';(e.currentTarget as HTMLElement).style.borderColor='rgba(255,87,87,0.18)'}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='transparent';(e.currentTarget as HTMLElement).style.borderColor='transparent'}}>
            <span style={{ display:'flex' }}>{Ic.out}</span>Sign out
          </button>
        </div>

        {/* Content */}
        <div style={{ overflowY:'auto',padding:'28px 32px' }}>

          {/* ── PROFILE ── */}
          {tab==='profile' && (
            <div style={{ maxWidth:520,animation:'settUp .35s ease both' }}>
              <h2 style={{ fontFamily:'var(--display)',fontSize:18,fontWeight:800,letterSpacing:'-0.03em',color:'rgba(255,255,255,0.9)',marginBottom:22 }}>Profile</h2>
              <Input label="Full name"    value={fullName}  onChange={setFullName}  placeholder="Ahmed Adil"/>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.45)',marginBottom:7 }}>Email</div>
                <div style={{ padding:'11px 13px',background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,fontSize:13,color:'rgba(255,255,255,0.45)' }}>{user?.email}</div>
              </div>
              <TextArea label="Bio" value={bio} onChange={setBio} placeholder="Tell your audience who you are…" rows={3}/>
              <SaveBtn onClick={saveProfile} saving={saving} saved={saved}/>
            </div>
          )}

          {/* ── WORKSPACE ── */}
          {tab==='workspace' && (
            <div style={{ maxWidth:520,animation:'settUp .35s ease both' }}>
              <h2 style={{ fontFamily:'var(--display)',fontSize:18,fontWeight:800,letterSpacing:'-0.03em',color:'rgba(255,255,255,0.9)',marginBottom:22 }}>Workspace</h2>
              <Input label="Workspace name" value={wsName} onChange={setWsName} placeholder="My Brand"/>
              <Input label="Niche"          value={niche}  onChange={setNiche}  placeholder="Personal branding, SaaS, Fitness…"/>
              <TextArea label="Target audience" value={targetAud} onChange={setTargetAud} placeholder="Describe your ideal audience — who they are, what they want, what they struggle with…" rows={3} hint="This powers audience-aware content generation across every tool."/>
              <TextArea label="Brand voice"     value={brandVoice} onChange={setBrandVoice} placeholder="Direct, psychology-backed, anti-fluff. I speak to operators, not beginners…" rows={3} hint="Every piece of content Nexa generates will match this voice."/>
              <TextArea label="Brand tone"      value={brandTone}  onChange={setBrandTone}  placeholder="Confident but not arrogant. Educational but not boring…" rows={2}/>
              <SaveBtn onClick={saveWorkspace} saving={saving} saved={saved}/>
            </div>
          )}

          {/* ── BILLING ── */}
          {tab==='billing' && (
            <div style={{ animation:'settUp .35s ease both' }}>
              <h2 style={{ fontFamily:'var(--display)',fontSize:18,fontWeight:800,letterSpacing:'-0.03em',color:'rgba(255,255,255,0.9)',marginBottom:6 }}>Billing</h2>
              <p style={{ fontSize:12,color:'rgba(255,255,255,0.35)',marginBottom:24 }}>
                Current plan: <span style={{ fontWeight:700,color:'#4D9FFF',textTransform:'capitalize' }}>{currentPlan}</span>
                {credits&&<span style={{ marginLeft:12 }}>· <span style={{ fontWeight:700,color:'rgba(255,255,255,0.7)' }}>{credits.balance?.toLocaleString()}</span> credits remaining</span>}
              </p>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10,marginBottom:24 }}>
                {PLANS.map(plan=>{
                  const isCurrent = currentPlan===plan.id
                  return (
                    <div key={plan.id} className="plan-card"
                      style={{ padding:'18px 20px',background:isCurrent?`${plan.color}09`:'rgba(255,255,255,0.03)',border:`1px solid ${isCurrent?`${plan.color}30`:'rgba(255,255,255,0.07)'}`,borderRadius:14,transition:'all .15s',boxShadow:isCurrent?`0 0 20px ${plan.color}12`:'none' }}>
                      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12 }}>
                        <span style={{ fontFamily:'var(--display)',fontSize:15,fontWeight:800,letterSpacing:'-0.03em',color:isCurrent?plan.color:'rgba(255,255,255,0.82)' }}>{plan.name}</span>
                        {isCurrent && <span style={{ fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:100,background:`${plan.color}14`,border:`1px solid ${plan.color}28`,color:plan.color,textTransform:'uppercase',letterSpacing:'.04em' }}>Current</span>}
                      </div>
                      <div style={{ fontFamily:'var(--display)',fontSize:24,fontWeight:800,letterSpacing:'-0.04em',color:'rgba(255,255,255,0.9)',marginBottom:4 }}>
                        {plan.price===0?'Free':`$${plan.price}`}
                        {plan.price>0&&<span style={{ fontSize:12,fontWeight:400,color:'rgba(255,255,255,0.35)',letterSpacing:0 }}>/mo</span>}
                      </div>
                      <div style={{ fontSize:11,color:'rgba(255,255,255,0.55)',marginBottom:4,fontWeight:600 }}>{plan.credits.toLocaleString()} credits/mo</div>
                      <div style={{ fontSize:11,color:'rgba(255,255,255,0.3)',marginBottom:16,lineHeight:1.5 }}>{plan.desc}</div>
                      {!isCurrent && plan.price>0 && (
                        <button onClick={()=>checkout(plan.id)}
                          style={{ width:'100%',padding:'9px',fontSize:12,fontWeight:700,background:plan.color,color:'#000',border:'none',borderRadius:9,cursor:'pointer',fontFamily:'var(--sans)',transition:'all .15s',boxShadow:`0 4px 12px ${plan.color}30` }}>
                          Upgrade to {plan.name}
                        </button>
                      )}
                      {!isCurrent && plan.price===0 && (
                        <div style={{ textAlign:'center',fontSize:11,color:'rgba(255,255,255,0.3)' }}>Downgrade</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── PASSWORD ── */}
          {tab==='password' && (
            <div style={{ maxWidth:400,animation:'settUp .35s ease both' }}>
              <h2 style={{ fontFamily:'var(--display)',fontSize:18,fontWeight:800,letterSpacing:'-0.03em',color:'rgba(255,255,255,0.9)',marginBottom:22 }}>Change password</h2>
              <Input label="New password"     value={newPw}  onChange={(v:string)=>{setNewPw(v);setPwErr('')}}  type="password" placeholder="Minimum 6 characters"/>
              <Input label="Confirm password" value={confPw} onChange={(v:string)=>{setConfPw(v);setPwErr('')}} type="password" placeholder="Repeat your new password"/>
              {pwErr && <div style={{ fontSize:12,color:'#FF5757',marginBottom:14,padding:'9px 12px',background:'rgba(255,87,87,0.07)',borderRadius:8,border:'1px solid rgba(255,87,87,0.18)' }}>{pwErr}</div>}
              <SaveBtn onClick={savePassword} saving={saving} saved={saved}/>
            </div>
          )}

        </div>
      </div>

      {toast && (
        <div style={{ position:'fixed',bottom:24,right:24,zIndex:9999,padding:'12px 18px',borderRadius:11,background:toast.type==='error'?'rgba(255,87,87,0.12)':'rgba(52,211,153,0.1)',border:`1px solid ${toast.type==='error'?'rgba(255,87,87,0.3)':'rgba(52,211,153,0.25)'}`,color:toast.type==='error'?'#FF5757':'#34D399',fontSize:13,fontWeight:600,backdropFilter:'blur(16px)',boxShadow:'0 8px 32px rgba(0,0,0,0.4)',animation:'settUp .2s ease both' }}>
          {toast.msg}
        </div>
      )}
    </>
  )
}

export default function SettingsPage() {
  return <Suspense fallback={<div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'rgba(255,255,255,0.3)',fontSize:13 }}>Loading…</div>}><SettingsPageInner/></Suspense>
}
