'use client'
import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type Tab = 'profile'|'workspace'|'billing'|'password'

const PLANS = [
  {
    id:'spark',    name:'Spark',    price:0,   credits:50,
    color:'rgba(255,255,255,0.45)',
    desc:'Try Nexa for free',
    features:['50 credits/mo','Copy generation','1 platform connection','Basic analytics'],
  },
  {
    id:'grow',     name:'Grow',     price:19,  credits:500,
    color:'#4D9FFF',
    desc:'For creators building in public',
    features:['500 credits/mo','Image generation','Brand Brain','Full analytics','All platforms'],
  },
  {
    id:'scale',    name:'Scale',    price:49,  credits:2000,
    color:'#A78BFA',
    desc:'For serious personal brands',
    popular: true,
    features:['2,000 credits/mo','Video & voice generation','Automation sequences','Competitor analysis','Strategy engine'],
  },
  {
    id:'dominate', name:'Dominate', price:99,  credits:5000,
    color:'#FF7A40',
    desc:'For agencies and power users',
    features:['5,000 credits/mo','Agency mode','Client workspaces','All AI models','Priority support'],
  },
]

const Ic = {
  user:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  ws:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  card:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  lock:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  out:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  bolt:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  check:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  warn:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
}

const NAV = [
  { id:'profile'   as Tab, label:'Profile',   icon:Ic.user, desc:'Your name, email, bio' },
  { id:'workspace' as Tab, label:'Workspace', icon:Ic.ws,   desc:'Brand voice, audience, niche' },
  { id:'billing'   as Tab, label:'Billing',   icon:Ic.card, desc:'Plan, credits, upgrades' },
  { id:'password'  as Tab, label:'Security',  icon:Ic.lock, desc:'Change your password' },
]

/* ─── Field components ─── */
function Field({ label, hint, children }: any) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.55)', marginBottom:7, letterSpacing:'-0.01em' }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize:11, color:'rgba(255,255,255,0.28)', marginTop:6, lineHeight:1.55 }}>{hint}</div>}
    </div>
  )
}

function Input({ value, onChange, placeholder, type='text', readOnly=false }: any) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width:'100%', padding:'11px 14px',
        background: readOnly ? 'rgba(255,255,255,0.02)' : focused ? 'rgba(77,159,255,0.04)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${focused ? 'rgba(77,159,255,0.32)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius:11, color: readOnly ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.9)',
        fontSize:13, fontFamily:'var(--sans)', outline:'none',
        transition:'all 0.18s', boxSizing:'border-box' as const,
        cursor: readOnly ? 'default' : 'text',
        boxShadow: focused ? '0 0 0 3px rgba(77,159,255,0.06)' : 'none',
      }}
    />
  )
}

function Textarea({ value, onChange, placeholder, rows=4, hint }: any) {
  const [focused, setFocused] = useState(false)
  return (
    <>
      <textarea
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width:'100%', padding:'12px 14px',
          background: focused ? 'rgba(77,159,255,0.04)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${focused ? 'rgba(77,159,255,0.32)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius:11, color:'rgba(255,255,255,0.9)', fontSize:13,
          fontFamily:'var(--sans)', outline:'none', resize:'vertical',
          lineHeight:1.7, boxSizing:'border-box' as const, transition:'all 0.18s',
          boxShadow: focused ? '0 0 0 3px rgba(77,159,255,0.06)' : 'none',
        }}
      />
      {hint && <div style={{ fontSize:11, color:'rgba(255,255,255,0.28)', marginTop:6, lineHeight:1.55 }}>{hint}</div>}
    </>
  )
}

function SaveBtn({ onClick, saving, saved, disabled }: any) {
  return (
    <button onClick={onClick} disabled={saving||disabled}
      style={{
        display:'flex', alignItems:'center', gap:8, padding:'11px 26px',
        fontSize:13, fontWeight:700, fontFamily:'var(--display)', letterSpacing:'-0.02em',
        background: saved ? 'rgba(52,211,153,0.1)' : saving || disabled ? 'rgba(255,255,255,0.04)' : '#4D9FFF',
        color: saved ? '#34D399' : saving || disabled ? 'rgba(255,255,255,0.25)' : '#000',
        border: `1px solid ${saved ? 'rgba(52,211,153,0.25)' : 'transparent'}`,
        borderRadius:11, cursor: saving || disabled ? 'not-allowed' : 'pointer',
        transition:'all 0.2s',
        boxShadow: saved || saving || disabled ? 'none' : '0 4px 18px rgba(77,159,255,0.35)',
      }}>
      {saving
        ? <><div style={{ width:13,height:13,border:'2px solid rgba(255,255,255,0.2)',borderTopColor:'rgba(255,255,255,0.6)',borderRadius:'50%',animation:'pageSpin .8s linear infinite' }}/>Saving…</>
        : saved
        ? <><span style={{ display:'flex' }}>{Ic.check}</span>Saved</>
        : <><span style={{ display:'flex' }}>{Ic.bolt}</span>Save changes</>}
    </button>
  )
}

function SettingsInner() {
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
  const [toast,     setToast]     = useState<{msg:string;ok:boolean}|null>(null)

  // form state
  const [fullName,   setFullName]   = useState('')
  const [bio,        setBio]        = useState('')
  const [wsName,     setWsName]     = useState('')
  const [niche,      setNiche]      = useState('')
  const [voice,      setVoice]      = useState('')
  const [tone,       setTone]       = useState('')
  const [audience,   setAudience]   = useState('')
  const [newPw,      setNewPw]      = useState('')
  const [confPw,     setConfPw]     = useState('')
  const [pwErr,      setPwErr]      = useState('')

  function toast_(msg:string, ok=true) { setToast({msg,ok}); setTimeout(()=>setToast(null),4000) }

  useEffect(() => { load() }, [])
  useEffect(() => { const t=searchParams.get('tab') as Tab; if(t)setTab(t) }, [searchParams])

  async function load() {
    const { data:{ user:u } } = await supabase.auth.getUser()
    if (!u) return
    const { data:p } = await supabase.from('profiles').select('*').eq('id',u.id).single()
    const { data:m } = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id',u.id).limit(1).single()
    const w = (m as any)?.workspaces
    const { data:cr } = await supabase.from('credits').select('*').eq('workspace_id',w?.id).single()
    setUser({...u,...p}); setWs(w); setCredits(cr)
    setFullName(p?.full_name||''); setBio(p?.bio||'')
    setWsName(w?.name||''); setNiche(w?.niche||'')
    setVoice(w?.brand_voice||''); setTone(w?.brand_tone||'')
    setAudience(w?.target_audience||'')
    setLoading(false)
  }

  async function saveProfile() {
    setSaving(true); setSaved(false)
    const { data:{ user:u } } = await supabase.auth.getUser()
    await supabase.from('profiles').update({ full_name:fullName, bio }).eq('id',u!.id)
    toast_('Profile saved'); setSaved(true); setTimeout(()=>setSaved(false),3000); setSaving(false)
  }

  async function saveWorkspace() {
    if (!ws) return; setSaving(true); setSaved(false)
    await supabase.from('workspaces').update({ name:wsName, niche, brand_voice:voice, brand_tone:tone, target_audience:audience }).eq('id',ws.id)
    toast_('Workspace saved'); setSaved(true); setTimeout(()=>setSaved(false),3000); setSaving(false)
  }

  async function savePassword() {
    if (newPw !== confPw) { setPwErr("Passwords don't match"); return }
    if (newPw.length < 6) { setPwErr('Minimum 6 characters'); return }
    setPwErr(''); setSaving(true)
    const { error } = await supabase.auth.updateUser({ password:newPw })
    if (error) toast_(error.message, false)
    else { toast_('Password updated'); setNewPw(''); setConfPw('') }
    setSaving(false)
  }

  async function checkout(planId:string) {
    const r = await fetch('/api/create-checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan_id:planId,workspace_id:ws?.id})})
    const d = await r.json()
    if (d.url) router.push(d.url)
  }

  async function signOut() { await supabase.auth.signOut(); router.push('/') }

  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'rgba(255,255,255,0.28)',fontSize:13 }}>Loading…</div>

  const initial = (user?.full_name?.[0]||user?.email?.[0]||'U').toUpperCase()
  const currentPlan = ws?.plan||'spark'
  const planColor = PLANS.find(p=>p.id===currentPlan)?.color||'rgba(255,255,255,0.5)'

  return (
    <>
      <div style={{ display:'grid', gridTemplateColumns:'240px 1fr', height:'calc(100vh - var(--topbar-h))', overflow:'hidden' }}>

        {/* ── LEFT NAV ── */}
        <div style={{ borderRight:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', padding:'20px 14px', overflow:'hidden' }}>

          {/* User card */}
          <div style={{ padding:'16px', borderRadius:14, background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:42, height:42, borderRadius:13, background:'linear-gradient(135deg,#4D9FFF,#A78BFA)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--display)', fontSize:17, fontWeight:800, color:'#fff', flexShrink:0, boxShadow:'0 4px 12px rgba(77,159,255,0.3)' }}>
                {initial}
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.88)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'-0.01em' }}>
                  {user?.full_name||'Your account'}
                </div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:1 }}>
                  {user?.email}
                </div>
              </div>
            </div>
            {/* Plan badge */}
            <div style={{ marginTop:12, display:'flex', alignItems:'center', gap:7, padding:'6px 10px', borderRadius:8, background:`${planColor}0a`, border:`1px solid ${planColor}20` }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:planColor, boxShadow:`0 0 6px ${planColor}` }}/>
              <span style={{ fontSize:11, fontWeight:700, color:planColor, textTransform:'capitalize', letterSpacing:'-0.01em' }}>{currentPlan} plan</span>
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginLeft:'auto' }}>
                {credits?.balance?.toLocaleString()||0} cr
              </span>
            </div>
          </div>

          {/* Nav items */}
          <div style={{ display:'flex', flexDirection:'column', gap:2, flex:1 }}>
            {NAV.map(n => {
              const on = tab === n.id
              return (
                <button key={n.id} onClick={() => { setTab(n.id); setSaved(false) }}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:11, background:on?'rgba(77,159,255,0.08)':'transparent', border:`1px solid ${on?'rgba(77,159,255,0.18)':'transparent'}`, color:on?'#4D9FFF':'rgba(255,255,255,0.45)', cursor:'pointer', fontFamily:'var(--sans)', fontSize:13, fontWeight:on?600:400, transition:'all 0.15s', textAlign:'left', width:'100%' }}
                  onMouseEnter={e => { if(!on)(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)' }}
                  onMouseLeave={e => { if(!on)(e.currentTarget as HTMLElement).style.background='transparent' }}>
                  <span style={{ display:'flex', opacity:on?1:0.6 }}>{n.icon}</span>
                  <div>
                    <div style={{ lineHeight:1 }}>{n.label}</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)', marginTop:2, fontWeight:400 }}>{n.desc}</div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Sign out */}
          <button onClick={signOut}
            style={{ display:'flex', alignItems:'center', gap:9, padding:'10px 12px', borderRadius:11, background:'transparent', border:'1px solid transparent', color:'rgba(255,87,87,0.65)', cursor:'pointer', fontSize:13, fontFamily:'var(--sans)', transition:'all 0.15s', width:'100%' }}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,87,87,0.07)';(e.currentTarget as HTMLElement).style.borderColor='rgba(255,87,87,0.15)'}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='transparent';(e.currentTarget as HTMLElement).style.borderColor='transparent'}}>
            <span style={{ display:'flex' }}>{Ic.out}</span>Sign out
          </button>
        </div>

        {/* ── CONTENT ── */}
        <div style={{ overflowY:'auto', padding:'32px 40px 60px' }}>

          {/* ════ PROFILE ════ */}
          {tab === 'profile' && (
            <div style={{ maxWidth:520, animation:'pageUp 0.35s ease both' }}>
              <div style={{ marginBottom:28 }}>
                <h2 style={{ fontFamily:'var(--display)', fontSize:20, fontWeight:800, letterSpacing:'-0.04em', color:'rgba(255,255,255,0.92)', marginBottom:5 }}>Profile</h2>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>How you appear across your workspace</p>
              </div>
              <Field label="Full name">
                <Input value={fullName} onChange={setFullName} placeholder="Your full name"/>
              </Field>
              <Field label="Email">
                <Input value={user?.email} readOnly/>
              </Field>
              <Field label="Bio" hint="Appears in your workspace profile. Keep it to one strong sentence.">
                <Textarea value={bio} onChange={setBio} placeholder="The one-liner that defines who you are and who you help." rows={3}/>
              </Field>
              <SaveBtn onClick={saveProfile} saving={saving} saved={saved}/>
            </div>
          )}

          {/* ════ WORKSPACE ════ */}
          {tab === 'workspace' && (
            <div style={{ maxWidth:560, animation:'pageUp 0.35s ease both' }}>
              <div style={{ marginBottom:28 }}>
                <h2 style={{ fontFamily:'var(--display)', fontSize:20, fontWeight:800, letterSpacing:'-0.04em', color:'rgba(255,255,255,0.92)', marginBottom:5 }}>Workspace</h2>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>These settings power every AI generation across the entire product</p>
              </div>

              <Field label="Workspace name">
                <Input value={wsName} onChange={setWsName} placeholder="My Brand"/>
              </Field>
              <Field label="Niche" hint="The space you operate in. The more specific, the sharper the outputs.">
                <Input value={niche} onChange={setNiche} placeholder="e.g. Personal branding for startup founders"/>
              </Field>

              <div style={{ height:1, background:'rgba(255,255,255,0.06)', margin:'24px 0' }}/>

              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#4D9FFF', letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:4 }}>Brand voice</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginBottom:16 }}>
                  This is the most important setting. Every generation — copy, email, strategy — uses this as its foundation.
                </div>
              </div>

              <Field label="Brand voice" hint="Describe how you write. Be specific — this is what Nexa imitates.">
                <Textarea value={voice} onChange={setVoice} placeholder="Direct, psychology-backed insights delivered with confidence. I write for operators and builders, not beginners. No fluff, no filler — every sentence earns its place." rows={4}/>
              </Field>
              <Field label="Brand tone" hint="The emotional register. How you want people to feel when they read you.">
                <Textarea value={tone} onChange={setTone} placeholder="Confident but not arrogant. Honest but not harsh. Educational but never condescending." rows={3}/>
              </Field>
              <Field label="Target audience" hint="The more specific this is, the more accurate every audience-aware generation becomes.">
                <Textarea value={audience} onChange={setAudience} placeholder="Ambitious founders and operators aged 28–42 who want to build a powerful personal brand but don't know where to start. They're smart, busy, and allergic to generic content." rows={4}/>
              </Field>

              <SaveBtn onClick={saveWorkspace} saving={saving} saved={saved}/>
            </div>
          )}

          {/* ════ BILLING ════ */}
          {tab === 'billing' && (
            <div style={{ animation:'pageUp 0.35s ease both' }}>
              <div style={{ marginBottom:28 }}>
                <h2 style={{ fontFamily:'var(--display)', fontSize:20, fontWeight:800, letterSpacing:'-0.04em', color:'rgba(255,255,255,0.92)', marginBottom:5 }}>Billing</h2>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>Manage your plan and credits</p>
              </div>

              {/* Current usage card */}
              <div style={{ padding:'20px 24px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, marginBottom:28, display:'flex', alignItems:'center', gap:20 }}>
                <div>
                  <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.28)', letterSpacing:'0.09em', textTransform:'uppercase', marginBottom:6 }}>Current plan</div>
                  <div style={{ fontFamily:'var(--display)', fontSize:22, fontWeight:800, letterSpacing:'-0.04em', color:planColor, textTransform:'capitalize' }}>{currentPlan}</div>
                </div>
                <div style={{ width:1, height:48, background:'rgba(255,255,255,0.08)' }}/>
                <div>
                  <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.28)', letterSpacing:'0.09em', textTransform:'uppercase', marginBottom:6 }}>Credits remaining</div>
                  <div style={{ fontFamily:'var(--display)', fontSize:22, fontWeight:800, letterSpacing:'-0.04em', color:'rgba(255,255,255,0.88)' }}>
                    {credits?.balance?.toLocaleString()||0}
                  </div>
                </div>
                <div style={{ width:1, height:48, background:'rgba(255,255,255,0.08)' }}/>
                <div>
                  <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.28)', letterSpacing:'0.09em', textTransform:'uppercase', marginBottom:6 }}>Lifetime used</div>
                  <div style={{ fontFamily:'var(--display)', fontSize:22, fontWeight:800, letterSpacing:'-0.04em', color:'rgba(255,255,255,0.88)' }}>
                    {credits?.lifetime_used?.toLocaleString()||0}
                  </div>
                </div>
              </div>

              {/* Plan cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(210px,1fr))', gap:10 }}>
                {PLANS.map(plan => {
                  const isCurrent = currentPlan === plan.id
                  return (
                    <div key={plan.id}
                      style={{ padding:'20px', background:isCurrent?`${plan.color}09`:'rgba(255,255,255,0.025)', border:`1px solid ${isCurrent?`${plan.color}28`:'rgba(255,255,255,0.08)'}`, borderRadius:16, transition:'all 0.15s', position:'relative', boxShadow:isCurrent?`0 0 24px ${plan.color}12`:'none' }}
                      onMouseEnter={e => { if(!isCurrent){(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.14)';(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)'} }}
                      onMouseLeave={e => { if(!isCurrent){(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.08)';(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.025)'} }}>

                      {/* Popular badge */}
                      {plan.popular && !isCurrent && (
                        <div style={{ position:'absolute', top:-1, right:16, fontSize:9, fontWeight:700, padding:'3px 9px', borderRadius:'0 0 8px 8px', background:plan.color, color:'#000', letterSpacing:'0.05em', textTransform:'uppercase' }}>
                          Most popular
                        </div>
                      )}

                      {/* Plan name + badge */}
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                        <span style={{ fontFamily:'var(--display)', fontSize:16, fontWeight:800, letterSpacing:'-0.03em', color:isCurrent?plan.color:'rgba(255,255,255,0.82)' }}>{plan.name}</span>
                        {isCurrent && (
                          <span style={{ fontSize:9, fontWeight:700, padding:'2px 9px', borderRadius:100, background:`${plan.color}14`, border:`1px solid ${plan.color}28`, color:plan.color, textTransform:'uppercase', letterSpacing:'0.05em' }}>Active</span>
                        )}
                      </div>

                      {/* Price */}
                      <div style={{ marginBottom:4 }}>
                        <span style={{ fontFamily:'var(--display)', fontSize:28, fontWeight:800, letterSpacing:'-0.05em', color:'rgba(255,255,255,0.92)' }}>
                          {plan.price === 0 ? 'Free' : `$${plan.price}`}
                        </span>
                        {plan.price > 0 && <span style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginLeft:3 }}>/mo</span>}
                      </div>
                      <div style={{ fontSize:11, fontWeight:600, color:plan.color, marginBottom:4 }}>
                        {plan.credits.toLocaleString()} credits/mo
                      </div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.32)', lineHeight:1.55, marginBottom:16 }}>{plan.desc}</div>

                      {/* Features */}
                      <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:18 }}>
                        {plan.features.map(f => (
                          <div key={f} style={{ display:'flex', alignItems:'center', gap:7, fontSize:11, color:'rgba(255,255,255,0.55)' }}>
                            <span style={{ color:plan.color, display:'flex', flexShrink:0 }}>{Ic.check}</span>{f}
                          </div>
                        ))}
                      </div>

                      {!isCurrent && plan.price > 0 && (
                        <button onClick={() => checkout(plan.id)}
                          style={{ width:'100%', padding:'10px', fontSize:12, fontWeight:700, background:plan.color, color:'#000', border:'none', borderRadius:10, cursor:'pointer', fontFamily:'var(--sans)', transition:'all 0.15s', boxShadow:`0 4px 14px ${plan.color}35`, letterSpacing:'-0.01em' }}>
                          Upgrade to {plan.name}
                        </button>
                      )}
                      {isCurrent && (
                        <div style={{ padding:'9px', borderRadius:10, background:`${plan.color}08`, border:`1px solid ${plan.color}18`, textAlign:'center', fontSize:12, color:plan.color, fontWeight:600 }}>
                          Your current plan
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ════ SECURITY ════ */}
          {tab === 'password' && (
            <div style={{ maxWidth:420, animation:'pageUp 0.35s ease both' }}>
              <div style={{ marginBottom:28 }}>
                <h2 style={{ fontFamily:'var(--display)', fontSize:20, fontWeight:800, letterSpacing:'-0.04em', color:'rgba(255,255,255,0.92)', marginBottom:5 }}>Security</h2>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>Update your password</p>
              </div>
              <Field label="New password">
                <Input value={newPw} onChange={(v:string)=>{setNewPw(v);setPwErr('')}} type="password" placeholder="Minimum 6 characters"/>
              </Field>
              <Field label="Confirm new password">
                <Input value={confPw} onChange={(v:string)=>{setConfPw(v);setPwErr('')}} type="password" placeholder="Repeat your new password"/>
              </Field>
              {pwErr && (
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 13px', background:'rgba(255,87,87,0.07)', border:'1px solid rgba(255,87,87,0.2)', borderRadius:10, fontSize:12, color:'#FF5757', marginBottom:16 }}>
                  <span style={{ display:'flex' }}>{Ic.warn}</span>{pwErr}
                </div>
              )}
              <SaveBtn onClick={savePassword} saving={saving} saved={saved} disabled={!newPw||!confPw}/>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, padding:'12px 20px', borderRadius:12, background:toast.ok?'rgba(52,211,153,0.1)':'rgba(255,87,87,0.12)', border:`1px solid ${toast.ok?'rgba(52,211,153,0.28)':'rgba(255,87,87,0.3)'}`, color:toast.ok?'#34D399':'#FF5757', fontSize:13, fontWeight:600, backdropFilter:'blur(16px)', boxShadow:'0 8px 32px rgba(0,0,0,0.45)', animation:'pageUp 0.2s ease both' }}>
          {toast.msg}
        </div>
      )}
    </>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'rgba(255,255,255,0.28)',fontSize:13 }}>Loading…</div>}>
      <SettingsInner/>
    </Suspense>
  )
}
