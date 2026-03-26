'use client'
import { useLang } from '@/lib/language-context'
import { useState, useEffect, Suspense, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { TOPUP_PACKS_BY_PLAN, PLAN_CREDITS } from '@/lib/plan-constants'

type Tab = 'profile'|'workspace'|'billing'|'password'

const PLANS = [
  {
    id:'spark', name:'Spark', tagline:'The Creator', price:49, credits:1000,
    color:'rgba(255,255,255,0.5)',
    desc:'Build your brand and create consistently',
    popular: false,
    features:[
      '1,000 credits/mo (~7 cinema videos or 333 posts)',
      'Brand Brain — voice training',
      'All content types (text, image, video, voice)',
      'Nexa AI chat — unlimited',
      'Morning brief',
      'Strategy & 30-day plan',
      '2 social platforms',
      '60 scheduled posts/mo',
      'Lead capture page',
      'Lead magnet delivery',
      'Basic analytics',
      '1 team member',
    ],
    locked:[
      'Email sequences',
      'Amplify (Meta Ads)',
      'Competitor analysis',
    ],
  },
  {
    id:'grow', name:'Grow', tagline:'The Grower', price:89, credits:3000,
    color:'#00AAFF',
    desc:'Capture leads, run ads, grow your audience',
    popular: true,
    features:[
      '3,000 credits/mo (~21 cinema videos or 1,000 posts)',
      'Everything in Spark',
      'Email sequences (3 active)',
      'AI-written sequences',
      '2,500 contacts · 3,000 emails/mo',
      'Amplify — Meta Ads from your content',
      'One-click boost from Studio',
      'Competitor analysis',
      'Performance learning',
      '4 social platforms · unlimited posts',
      'Full analytics + AI insights',
      'Kit/ConvertKit integration',
      'Typeform webhook',
      '2 team members',
    ],
    locked:[
      'Remove Nexa branding',
      'Custom sender domain',
      'Behavioral triggers',
    ],
  },
  {
    id:'scale', name:'Scale', tagline:'The Operator', price:169, credits:7000,
    color:'#A78BFA',
    desc:'Professional, white-label, fully automated',
    popular: false,
    features:[
      '7,000 credits/mo (~50 cinema videos or 2,333 posts)',
      'Everything in Grow',
      'Remove Nexa branding everywhere',
      'Custom sender domain',
      '15 email sequences · 15,000 contacts',
      '20,000 emails/mo',
      'Behavioral triggers',
      'A/B subject line testing',
      'AI ad performance monitor',
      'Daily ad insights brief',
      'Unlimited platforms & scheduled posts',
      'Analytics export',
      'Custom & Zapier webhooks',
      '5 team members · Priority support',
    ],
    locked:[
      'Agency client workspaces',
    ],
  },
  {
    id:'agency', name:'Agency', tagline:'The Agency', price:349, credits:20000,
    color:'#FF7A40',
    desc:'Run multiple client brands from one place',
    popular: false,
    features:[
      '20,000 credits/mo (~144 cinema videos or 6,666 posts)',
      'Everything in Scale',
      'Unlimited client workspaces',
      'Separate Brand Brain per client',
      'Agency overview dashboard',
      'Retainer & MRR tracking',
      'One-click workspace switching',
      'Client invite system',
      '100,000 emails/mo',
      'Unlimited contacts',
      '25 team members',
    ],
    locked:[],
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

const NAV_EN = [
  { id:'profile'   as Tab, label:'Profile',        icon:Ic.user, desc:'Your name, email, bio' },
  { id:'workspace' as Tab, label:'Workspace',      icon:Ic.ws,   desc:'Brand voice, audience, niche' },
  { id:'billing'   as Tab, label:'Billing',        icon:Ic.card, desc:'Plan, credits, upgrades' },
  { id:'password'  as Tab, label:'Security',       icon:Ic.lock, desc:'Change your password' },
]
const NAV_AR = [
  { id:'profile'   as Tab, label:'الحساب',         icon:Ic.user, desc:'اسمك وإيميلك' },
  { id:'workspace' as Tab, label:'مساحة العمل',    icon:Ic.ws,   desc:'صوت البراند والجمهور' },
  { id:'billing'   as Tab, label:'الفوترة',        icon:Ic.card, desc:'الخطة والرصيد' },
  { id:'password'  as Tab, label:'الأمان',         icon:Ic.lock, desc:'غيّر كلمة سرك' },
]

/* ─── Field components ─── */
const AR_F = "'Tajawal', system-ui, sans-serif"
const EN_F = "'Geist', -apple-system, sans-serif"

function Field({ label, hint, children }: any) {
  const { isArabic } = useLang()
  const F = isArabic ? AR_F : EN_F
  return (
    <div style={{ marginBottom:20, direction: isArabic ? 'rtl' : 'ltr' }}>
      <div style={{ fontFamily:F, fontSize:12, fontWeight:500, color:'rgba(255,255,255,0.55)', marginBottom:7, letterSpacing:0 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize:11, color:'rgba(255,255,255,0.38)', marginTop:6, lineHeight:1.55, fontFamily:F }}>{hint}</div>}
    </div>
  )
}

function Input({ value, onChange, placeholder, type='text', readOnly=false }: any) {
  const [focused, setFocused] = useState(false)
  const { isArabic } = useLang()
  const F = isArabic ? AR_F : EN_F
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      dir={isArabic ? 'rtl' : 'ltr'}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width:'100%', padding:'11px 14px',
        background: readOnly ? 'rgba(255,255,255,0.02)' : focused ? 'rgba(0,170,255,0.04)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${focused ? 'rgba(0,170,255,0.30)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius:11, color: readOnly ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.9)',
        fontFamily:F, fontSize:14, outline:'none',
        transition:'all 0.18s', boxSizing:'border-box' as const,
        cursor: readOnly ? 'default' : 'text',
        boxShadow: focused ? '0 0 0 3px rgba(0,170,255,0.06)' : 'none',
        textAlign: isArabic ? 'right' : 'left',
      }}
    />
  )
}

function Textarea({ value, onChange, placeholder, rows=4, hint }: any) {
  const [focused, setFocused] = useState(false)
  const { isArabic } = useLang()
  const F = isArabic ? AR_F : EN_F
  return (
    <>
      <textarea
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
        dir={isArabic ? 'rtl' : 'ltr'}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width:'100%', padding:'12px 14px',
          background: focused ? 'rgba(0,170,255,0.04)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${focused ? 'rgba(0,170,255,0.30)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius:11, color:'rgba(255,255,255,0.9)', fontSize:13,
          fontFamily:F, outline:'none', resize:'vertical',
          lineHeight:1.7, boxSizing:'border-box' as const, transition:'all 0.18s',
          boxShadow: focused ? '0 0 0 3px rgba(0,170,255,0.06)' : 'none',
          textAlign: isArabic ? 'right' : 'left',
          direction: isArabic ? 'rtl' : 'ltr',
        }}
      />
      {hint && <div style={{ fontSize:11, color:'rgba(255,255,255,0.38)', marginTop:6, lineHeight:1.55, fontFamily:F }}>{hint}</div>}
    </>
  )
}

function SaveBtn({ onClick, saving, saved, disabled }: any) {
  const { isArabic } = useLang()
  const F = isArabic ? AR_F : EN_F
  return (
    <button onClick={onClick} disabled={saving||disabled}
      className={saved ? '' : saving || disabled ? 'btn-secondary' : 'btn-primary'}
      style={{
        display:'flex', alignItems:'center', gap:8, fontFamily:F,
        ...(saved ? {
          padding:'9px 18px', fontSize:13, fontWeight:600, borderRadius:10, cursor:'not-allowed',
          background:'rgba(34,197,94,0.10)', color:'#22C55E', border:'1px solid rgba(34,197,94,0.20)',
        } : {}),
        transition:'all 0.2s',
      }}>
      {saving
        ? <><div className="nexa-spinner" style={{ width:13, height:13 }}/>{isArabic?'يحفظ...':'Saving…'}</>
        : saved
        ? <><span style={{ display:'flex' }}>{Ic.check}</span>{isArabic?'تم':'Saved'}</>
        : <><span style={{ display:'flex' }}>{Ic.bolt}</span>{isArabic ? 'احفظ التغييرات' : 'Save changes'}</>}
    </button>
  )
}

function SettingsInner() {
  const supabase     = createClient()
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { isArabic } = useLang()
  const F = isArabic ? "'Tajawal', system-ui, sans-serif" : "'Geist', -apple-system, sans-serif"
  const NAV = isArabic ? NAV_AR : NAV_EN
  const [tab,       setTab]       = useState<Tab>((searchParams.get('tab') as Tab)||'profile')
  const [user,      setUser]      = useState<any>(null)
  const [ws,        setWs]        = useState<any>(null)
  const [credits,   setCredits]   = useState<any>(null)
  const [highlightPlan, setHighlightPlan] = useState<string|null>(null)
  const [loading,        setLoading]        = useState(true)
  const [saving,         setSaving]         = useState(false)
  const [saved,          setSaved]          = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)
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
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const [slug,           setSlug]           = useState('')
  const [customQ,        setCustomQ]        = useState('')
  const [copied,         setCopied]         = useState(false)
  const [leadAutoEnroll, setLeadAutoEnroll] = useState(false)
  const [leadSequenceId, setLeadSequenceId] = useState('')
  const [kitApiKey,      setKitApiKey]      = useState('')
  const [sequences,      setSequences]      = useState<any[]>([])
  const [avatarUrl,      setAvatarUrl]      = useState('')
  const [avatarUploading,setAvatarUploading]= useState(false)
  const avatarRef = useRef<HTMLInputElement>(null)

  function toast_(msg:string, ok=true) { setToast({msg,ok}); setTimeout(()=>setToast(null),4000) }

  function generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 40)
  }

  useEffect(() => { 
    load()
    // Handle Stripe redirect success
    const success = searchParams.get('success')
    const plan    = searchParams.get('plan')
    if (success === 'true') {
      if (plan) toast_(`You're now on the ${plan.charAt(0).toUpperCase()+plan.slice(1)} plan! Credits have been added.`)
      else toast_('Payment successful — credits added to your account')
      setTab('billing')
    }
  }, [])
  useEffect(() => { const t=searchParams.get('tab') as Tab; if(t)setTab(t) }, [searchParams])

  async function load() {
    const { data:{ user:u } } = await supabase.auth.getUser()
    if (!u) return
    const { data:p } = await supabase.from('profiles').select('*').eq('id',u.id).single()
    const { data:m } = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id',u.id).limit(1).single()
    const w = (m as any)?.workspaces
    const { data:cr } = await supabase.from('credits').select('*').eq('workspace_id',w?.id).single()
    setUser({...u,...p}); setWs(w); setCredits(cr)
    setFullName(p?.full_name||''); setBio(p?.bio||''); setAvatarUrl(p?.avatar_url||'')
    setWsName(w?.name||''); setNiche(w?.niche||'')
    setVoice(w?.brand_voice||''); setTone(w?.brand_tone||'')
    setAudience(w?.brand_audience||'')
    setSlug(w?.slug || generateSlug(w?.brand_name || w?.name || ''))
    setCustomQ(w?.lead_page_custom_question || '')
    setLeadAutoEnroll(w?.lead_page_auto_enroll || false)
    setLeadSequenceId(w?.lead_page_sequence_id || '')
    setKitApiKey(w?.kit_api_key ? '••••••••' : '')
    const { data: seqData } = await supabase.from('email_sequences').select('id, name').eq('workspace_id', (m as any)?.workspace_id).eq('status', 'active')
    setSequences(seqData || [])
    setLoading(false)
  }

  async function uploadAvatar(file: File) {
    if (!user || avatarUploading) return
    setAvatarUploading(true)
    try {
      const ext  = file.name.split('.').pop()
      const path = `avatars/${user.id}/avatar-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('brand-assets').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('brand-assets').getPublicUrl(path)
      const url = urlData.publicUrl
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id)
      setAvatarUrl(url)
      setUser((p: any) => ({ ...p, avatar_url: url }))
      toast_(isArabic ? 'تم رفع الصورة ✓' : 'Photo uploaded ✓')
    } catch { toast_(isArabic ? 'فشل الرفع' : 'Upload failed', false) }
    setAvatarUploading(false)
  }

  async function saveProfile() {
    setSaving(true); setSaved(false)
    const { data:{ user:u } } = await supabase.auth.getUser()
    await supabase.from('profiles').update({ full_name:fullName, bio }).eq('id',u!.id)
    toast_('Profile saved'); setSaved(true); setTimeout(()=>setSaved(false),3000); setSaving(false)
  }

  async function saveWorkspace() {
    if (!ws) return; setSaving(true); setSaved(false)
    await supabase.from('workspaces').update({ name:wsName, niche, brand_voice:voice, brand_tone:tone, brand_audience:audience }).eq('id',ws.id)
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

  async function checkout(planId: string | null, topUpCredits?: number) {
    setBillingLoading(true)
    try {
      const body: Record<string, unknown> = { workspace_id: ws?.id }
      if (topUpCredits) body.top_up_credits = topUpCredits
      else body.plan = planId
      const r = await fetch('/api/create-checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await r.json()
      if (d.url) window.location.href = d.url
      else toast_('Could not start checkout', false)
    } catch { toast_('Checkout failed', false) }
    setBillingLoading(false)
  }

  async function signOut() { await supabase.auth.signOut(); router.push('/') }

  async function deleteAccount() {
    if (!deleteConfirm) { setDeleteConfirm(true); return }
    setDeleting(true)
    try {
      const r = await fetch('/api/account/delete', { method: 'DELETE' })
      if (!r.ok) throw new Error('Delete failed')
      await supabase.auth.signOut()
      router.push('/')
    } catch {
      toast_('Failed to delete account. Please contact support.', false)
      setDeleting(false)
      setDeleteConfirm(false)
    }
  }

  async function openPortal() {
    const r = await fetch('/api/stripe/portal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspace_id: ws?.id }) })
    const d = await r.json()
    if (d.url) router.push(d.url)
    else toast_('Could not open billing portal', false)
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - var(--topbar-h))', flexDirection:'column', gap:16 }}>
      <div className="nexa-spinner" style={{ width:22, height:22 }}/>
      <div style={{ fontSize:11, color:'rgba(255,255,255,0.38)', fontFamily:isArabic ? "'Tajawal', system-ui, sans-serif" : "'Geist', -apple-system, sans-serif", letterSpacing:'0.06em', textTransform:'uppercase' as const, fontWeight:500 }}>Loading</div>
    </div>
  )

  const initial = (user?.full_name?.[0]||user?.email?.[0]||'U').toUpperCase()
  const currentPlan = ws?.plan||'spark'
  const planColor = PLANS.find(p=>p.id===currentPlan)?.color||'rgba(255,255,255,0.5)'

  return (
    <>
      <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', height:'calc(100vh - var(--topbar-h))', overflow:'hidden' }}>

        {/* ── LEFT NAV ── */}
        <div style={{ borderRight:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', padding:'20px 12px', overflow:'hidden', background:'#141414' }}>

          {/* User card */}
          <div className="card" style={{ padding:'14px 16px', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:38, height:38, borderRadius:11, background:'linear-gradient(135deg, #00AAFF, rgba(0,170,255,0.5))', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:isArabic ? "'Tajawal', system-ui, sans-serif" : "'Geist', -apple-system, sans-serif", fontSize:15, fontWeight:700, color:'#fff', flexShrink:0 }}>
                {initial}
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#FFFFFF', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'-0.01em' }}>
                  {user?.full_name||'Your account'}
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.38)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:1 }}>
                  {user?.email}
                </div>
              </div>
            </div>
            {/* Plan badge */}
            <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:7, padding:'5px 9px', borderRadius:7, background:`${planColor}0d`, border:`1px solid ${planColor}22` }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:planColor, boxShadow:`0 0 6px ${planColor}` }}/>
              <span style={{ fontSize:11, fontWeight:600, color:planColor, textTransform:'capitalize', letterSpacing:'-0.01em' }}>{currentPlan} plan</span>
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.38)', marginLeft:'auto' }}>
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
                  style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 11px', borderRadius:10, background:on?'rgba(0,170,255,0.10)':'transparent', border:`1px solid ${on?'rgba(0,170,255,0.20)':'transparent'}`, color:on?'#00AAFF':'rgba(255,255,255,0.38)', cursor:'pointer', fontFamily:isArabic ? "'Tajawal', system-ui, sans-serif" : "'Geist', -apple-system, sans-serif", fontSize:13, fontWeight:on?600:400, transition:'all 0.15s', textAlign:'left', width:'100%' }}
                  onMouseEnter={e => { if(!on)(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)' }}
                  onMouseLeave={e => { if(!on)(e.currentTarget as HTMLElement).style.background='transparent' }}>
                  <span style={{ display:'flex', opacity:on?1:0.55 }}>{n.icon}</span>
                  <div>
                    <div style={{ lineHeight:1 }}>{n.label}</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.38)', marginTop:2, fontWeight:400 }}>{n.desc}</div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Sign out */}
          <button onClick={signOut}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 11px', borderRadius:10, background:'transparent', border:'1px solid transparent', color:'#EF4444', opacity:0.65, cursor:'pointer', fontSize:13, fontFamily:isArabic ? "'Tajawal', system-ui, sans-serif" : "'Geist', -apple-system, sans-serif", transition:'all 0.15s', width:'100%' }}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(239,68,68,0.10)';(e.currentTarget as HTMLElement).style.opacity='1';(e.currentTarget as HTMLElement).style.borderColor='rgba(239,68,68,0.20)'}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='transparent';(e.currentTarget as HTMLElement).style.opacity='0.65';(e.currentTarget as HTMLElement).style.borderColor='transparent'}}>
            <span style={{ display:'flex' }}>{Ic.out}</span>{isArabic?'تسجيل الخروج':'Sign out'}
          </button>
        </div>

        {/* ── CONTENT ── */}
        <div style={{ overflowY:'auto', padding:'32px 36px 60px' }}>

          {/* ════ PROFILE ════ */}
          {tab === 'profile' && (
            <div style={{ maxWidth:520, animation:'pageUp 0.35s ease both' }}>
              <div style={{ marginBottom:28 }}>
                <h2 style={{ fontSize:20, fontWeight:700, letterSpacing:'-0.03em', color:'#FFFFFF', marginBottom:5 }}>{isArabic?'الحساب الشخصي':'Profile'}</h2>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.38)' }}>{isArabic?'كيف تظهر في مساحة عملك':'How you appear across your workspace'}</p>
              </div>

              {/* ── Avatar upload ── */}
              <div style={{ marginBottom:28 }}>
                <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.35)', marginBottom:12 }}>
                  {isArabic ? 'صورة الحساب' : 'Profile photo'}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:16, flexDirection:isArabic?'row-reverse':'row' }}>
                  {/* Avatar preview */}
                  <div style={{ width:64, height:64, borderRadius:18, overflow:'hidden', flexShrink:0, border:'1px solid rgba(255,255,255,0.12)', background:'rgba(0,170,255,0.10)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700, color:'#00AAFF', position:'relative' }}>
                    {avatarUrl
                      ? <img src={avatarUrl} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                      : <span>{(user?.full_name||user?.email||'U')[0].toUpperCase()}</span>
                    }
                    {avatarUploading && (
                      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <div className="nexa-spinner" style={{ width:16, height:16 }}/>
                      </div>
                    )}
                  </div>
                  {/* Upload / remove */}
                  <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                    <button onClick={() => avatarRef.current?.click()} disabled={avatarUploading}
                      className="btn-secondary" style={{ fontSize:12, display:'flex', alignItems:'center', gap:6 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      {avatarUploading ? (isArabic ? '...جارٍ الرفع' : 'Uploading…') : (isArabic ? 'رفع صورة' : 'Upload photo')}
                    </button>
                    {avatarUrl && (
                      <button onClick={async () => { await supabase.from('profiles').update({ avatar_url: null }).eq('id', user?.id); setAvatarUrl(''); toast_(isArabic ? 'تم حذف الصورة' : 'Photo removed') }}
                        style={{ fontSize:11, color:'rgba(239,68,68,0.7)', background:'none', border:'none', cursor:'pointer', padding:0, textAlign:isArabic?'right':'left' as const }}>
                        {isArabic ? 'حذف الصورة' : 'Remove photo'}
                      </button>
                    )}
                  </div>
                  <input ref={avatarRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])}/>
                </div>
                <p style={{ fontSize:11, color:'rgba(255,255,255,0.25)', marginTop:10 }}>
                  {isArabic ? 'JPG أو PNG — بحجم أقصاه ٥ ميغابايت' : 'JPG or PNG — max 5 MB'}
                </p>
              </div>

              <Field label={isArabic ? "الاسم الكامل" : "Full name"}>
                <Input value={fullName} onChange={setFullName} placeholder="Your full name"/>
              </Field>
              <Field label={isArabic ? "الإيميل" : "Email"}>
                <Input value={user?.email} readOnly/>
              </Field>
              <Field label={isArabic?"البايو":"Bio"} hint="Appears in your workspace profile. Keep it to one strong sentence.">
                <Textarea value={bio} onChange={setBio} placeholder="The one-liner that defines who you are and who you help." rows={3}/>
              </Field>
              <SaveBtn onClick={saveProfile} saving={saving} saved={saved}/>
            </div>
          )}

          {/* ════ WORKSPACE ════ */}
          {tab === 'workspace' && (
            <div style={{ maxWidth:560, animation:'pageUp 0.35s ease both' }}>
              <div style={{ marginBottom:28 }}>
                <h2 style={{ fontSize:20, fontWeight:700, letterSpacing:'-0.03em', color:'#FFFFFF', marginBottom:5 }}>{isArabic?'مساحة العمل':'Workspace'}</h2>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.38)' }}>These settings power every AI generation across the entire product</p>
              </div>

              <Field label={isArabic ? "اسم مساحة العمل" : "Workspace name"}>
                <Input value={wsName} onChange={setWsName} placeholder="My Brand"/>
              </Field>
              <Field label={isArabic?"المجال":"Niche"} hint="The space you operate in. The more specific, the sharper the outputs.">
                <Input value={niche} onChange={setNiche} placeholder="e.g. Personal branding for startup founders"/>
              </Field>

              <div style={{ height:1, background:'rgba(255,255,255,0.06)', margin:'24px 0' }}/>

              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:600, color:'#00AAFF', letterSpacing:'0.06em', textTransform:'uppercase' as const, marginBottom:4 }}>{isArabic?'صوت البراند':'Brand voice'}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.38)', marginBottom:16 }}>
                  This is the most important setting. Every generation — copy, email, strategy — uses this as its foundation.
                </div>
              </div>

              <Field label={isArabic ? "صوت البراند" : "Brand voice"} hint="Describe how you write. Be specific — this is what Nexa imitates.">
                <Textarea value={voice} onChange={setVoice} placeholder="Direct, psychology-backed insights delivered with confidence. I write for operators and builders, not beginners. No fluff, no filler — every sentence earns its place." rows={4}/>
              </Field>
              <Field label={isArabic?"نبرة البراند":"Brand tone"} hint="The emotional register. How you want people to feel when they read you.">
                <Textarea value={tone} onChange={setTone} placeholder="Confident but not arrogant. Honest but not harsh. Educational but never condescending." rows={3}/>
              </Field>
              <Field label={isArabic ? "الجمهور المستهدف" : "Target audience"} hint="The more specific this is, the more accurate every audience-aware generation becomes.">
                <Textarea value={audience} onChange={setAudience} placeholder="Ambitious founders and operators aged 28–42 who want to build a powerful personal brand but don't know where to start. They're smart, busy, and allergic to generic content." rows={4}/>
              </Field>

              <SaveBtn onClick={saveWorkspace} saving={saving} saved={saved}/>

              {/* ── Email sender settings ── */}
              <div style={{ height:1, background:'rgba(255,255,255,0.06)', margin:'32px 0' }}/>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:600, color:'#00AAFF', letterSpacing:'0.06em', textTransform:'uppercase' as const, marginBottom:4 }}>{isArabic?'هوية المرسل':'Email sender identity'}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.38)', lineHeight:1.7 }}>
                  Control who emails appear to come from — lead magnets, sequences, and automations. By default emails send from <span style={{ fontFamily:"'Geist Mono', monospace", color:'rgba(255,255,255,0.72)' }}>hello@nexaa.cc</span> with your brand name. Connect a custom domain to send from your own address.
                </div>
              </div>

              <Field label="Sender name" hint="Name recipients see in their inbox">
                <Input value={ws?.sender_name||ws?.brand_name||''} onChange={()=>{}} placeholder={ws?.brand_name||ws?.name||'Your Brand'} readOnly/>
              </Field>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.38)', marginTop:-8, marginBottom:16 }}>Automatically uses your brand name — edit it in Brand name above</div>

              <div style={{ padding:'16px', background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px', marginBottom:16 }}>
                {['scale','agency'].includes(currentPlan) ? (
                  <>
                    <div style={{ fontSize:13, fontWeight:600, color:'#FFFFFF', marginBottom:4 }}>Custom sender domain</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.38)', marginBottom:12 }}>
                      Send from <span style={{ fontFamily:"'Geist Mono', monospace" }}>hello@yourdomain.com</span>. You&apos;ll need to add DNS records to verify.
                    </div>
                    <a href="/dashboard/settings?tab=billing" className="btn-secondary" style={{ fontSize:12, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:6 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      Configure custom domain →
                    </a>
                  </>
                ) : (
                  <>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.72)', marginBottom:3 }}>Custom sender domain</div>
                        <div style={{ fontSize:12, color:'rgba(255,255,255,0.38)' }}>Send from your own domain on Scale & Agency</div>
                      </div>
                      <a href="/dashboard/settings?tab=billing" className="btn-accent" style={{ fontSize:11, padding:'5px 10px', textDecoration:'none', whiteSpace:'nowrap' as const }}>{isArabic?'طوّر':'Upgrade'}</a>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ════ BILLING ════ */}
          {tab === 'billing' && (
            <div style={{ animation:'pageUp 0.35s ease both' }}>
              <div style={{ marginBottom:28 }}>
                <h2 style={{ fontSize:20, fontWeight:700, letterSpacing:'-0.03em', color:'#FFFFFF', marginBottom:5 }}>{isArabic?'الفوترة':'Billing'}</h2>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.38)' }}>{isArabic?'أدر خطتك ورصيدك':'Manage your plan and credits'}</p>
              </div>

              {/* Current usage card */}
              <div className="card" style={{ marginBottom:24, display:'flex', alignItems:'center', gap:20 }}>
                <div>
                  <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.38)', marginBottom:5 }}>{isArabic?'الخطة الحالية':'Current plan'}</div>
                  <div style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.04em', color:planColor, textTransform:'capitalize', fontFamily:isArabic ? "'Tajawal', system-ui, sans-serif" : "'Geist', -apple-system, sans-serif" }}>{currentPlan}</div>
                  {ws?.plan_status==='trialing' && (
                    <div style={{ marginTop:10, padding:'10px 14px', background:'rgba(245,158,11,0.10)', border:'1px solid rgba(245,158,11,0.20)', borderRadius:10 }}>
                      <div style={{ fontSize:11, fontWeight:600, color:'#F59E0B', marginBottom:3 }}>{isArabic?'التجربة نشطة':'Trial active'}</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.72)', lineHeight:1.55 }}>
                        You're on a 7-day free trial. Upgrade before it ends to keep your Brand Brain, content, and automations running.
                      </div>
                    </div>
                  )}
                  {ws?.plan_status==='past_due' && (
                    <div style={{ marginTop:10, padding:'10px 14px', background:'rgba(239,68,68,0.10)', border:'1px solid rgba(239,68,68,0.20)', borderRadius:10 }}>
                      <div style={{ fontSize:11, fontWeight:600, color:'#EF4444', marginBottom:3 }}>{isArabic?'فشل الدفع':'Payment failed'}</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.72)', lineHeight:1.55 }}>
                        Your last payment failed. Update your payment method to avoid losing access.
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ width:1, height:44, background:'rgba(255,255,255,0.10)' }}/>
                <div>
                  <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.38)', marginBottom:5 }}>{isArabic?'الرصيد المتبقي':'Credits remaining'}</div>
                  <div style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.04em', color:'#FFFFFF', fontFamily:isArabic ? "'Tajawal', system-ui, sans-serif" : "'Geist', -apple-system, sans-serif" }}>
                    {credits?.balance?.toLocaleString()||0}
                  </div>
                </div>
                <div style={{ width:1, height:44, background:'rgba(255,255,255,0.10)' }}/>
                <div>
                  <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.38)', marginBottom:5 }}>{isArabic?'الكلي المستهلك':'Lifetime used'}</div>
                  <div style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.04em', color:'#FFFFFF', fontFamily:isArabic ? "'Tajawal', system-ui, sans-serif" : "'Geist', -apple-system, sans-serif" }}>
                    {credits?.lifetime_used?.toLocaleString()||0}
                  </div>
                </div>
              </div>

              {/* Manage subscription */}
              {ws?.stripe_subscription_id && (
                <div style={{ marginBottom:20 }}>
                  <button onClick={openPortal} className="btn-secondary" style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ display:'flex' }}>{Ic.card}</span>Manage subscription →
                  </button>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.38)', marginTop:6 }}>Update payment method, view invoices, or cancel</div>
                </div>
              )}

              {/* Plan cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:12, marginBottom:28 }}>
                {PLANS.map(plan => {
                  const isCurrent = currentPlan === plan.id
                  const isDowngrade = ['spark','grow','scale','agency'].indexOf(plan.id) < ['spark','grow','scale','agency'].indexOf(currentPlan)
                  return (
                    <div key={plan.id}
                      style={{ padding:'20px', position:'relative', borderRadius:'10px',
                        background: isCurrent ? `${plan.color}08` : '#141414',
                        border: isCurrent ? `1.5px solid ${plan.color}35` : '1px solid rgba(255,255,255,0.10)',
                        transition:'border-color 0.15s' }}
                      onMouseEnter={e => { if(!isCurrent)(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.18)' }}
                      onMouseLeave={e => { if(!isCurrent)(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.10)' }}>

                      {plan.popular && !isCurrent && (
                        <div style={{ position:'absolute', top:-1, right:14, fontSize:9, fontWeight:700, padding:'3px 9px', borderRadius:'0 0 7px 7px', background:plan.color, color:'#000', letterSpacing:'0.05em', textTransform:'uppercase' as const }}>
                          Most popular
                        </div>
                      )}

                      {/* Name + tagline */}
                      <div style={{ marginBottom:12 }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:2 }}>
                          <span style={{ fontWeight:700, fontSize:16, letterSpacing:'-0.03em', color:isCurrent?plan.color:'#FFFFFF' }}>{plan.name}</span>
                          {isCurrent && <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase' as const, color:plan.color, padding:'2px 8px', background:`${plan.color}12`, border:`1px solid ${plan.color}25`, borderRadius:99 }}>Active</span>}
                        </div>
                        <div style={{ fontSize:11, color:'rgba(255,255,255,0.38)', fontStyle:'italic' }}>{plan.tagline}</div>
                      </div>

                      {/* Price */}
                      <div style={{ marginBottom:4 }}>
                        <span style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.05em', color:'#FFFFFF' }}>${plan.price}</span>
                        <span style={{ fontSize:12, color:'rgba(255,255,255,0.38)', marginLeft:3 }}>/mo</span>
                      </div>

                      {/* Credits with examples */}
                      <div style={{ padding:'8px 10px', background:`${plan.color}0d`, border:`1px solid ${plan.color}18`, borderRadius:8, marginBottom:14 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:plan.color, marginBottom:4 }}>{plan.credits.toLocaleString()} credits/mo</div>
                        <div style={{ fontSize:10, color:'rgba(255,255,255,0.38)', lineHeight:1.6 }}>
                          ~{Math.floor(plan.credits/138)} cinema videos · ~{Math.floor(plan.credits/3)} posts · ~{Math.floor(plan.credits/5)} images
                        </div>
                      </div>

                      {/* Included features */}
                      <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:plan.locked.length>0?10:16 }}>
                        {plan.features.map(f => (
                          <div key={f} style={{ display:'flex', alignItems:'flex-start', gap:7, fontSize:11, color:'rgba(255,255,255,0.72)', lineHeight:1.45 }}>
                            <span style={{ color:plan.color, flexShrink:0, marginTop:1 }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </span>{f}
                          </div>
                        ))}
                      </div>

                      {/* Locked features (upgrade hints) */}
                      {plan.locked.length > 0 && !isCurrent && (
                        <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:16, paddingTop:8, borderTop:'1px solid rgba(255,255,255,0.10)' }}>
                          {plan.locked.map(f => (
                            <div key={f} style={{ display:'flex', alignItems:'flex-start', gap:7, fontSize:11, color:'rgba(255,255,255,0.20)', lineHeight:1.45 }}>
                              <span style={{ flexShrink:0, marginTop:1, opacity:0.4 }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                              </span>
                              <span style={{ textDecoration:'line-through', opacity:0.45 }}>{f}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* CTA */}
                      {!isCurrent && (
                        <button onClick={() => checkout(plan.id)} disabled={billingLoading}
                          style={{ width:'100%', padding:'10px', fontSize:12, fontWeight:700,
                            background: isDowngrade ? 'transparent' : plan.color,
                            color: isDowngrade ? 'rgba(255,255,255,0.38)' : '#000',
                            border: isDowngrade ? '1px solid rgba(255,255,255,0.10)' : 'none',
                            borderRadius:'10px', cursor:'pointer', fontFamily:isArabic ? "'Tajawal', system-ui, sans-serif" : "'Geist', -apple-system, sans-serif", transition:'all 0.15s', letterSpacing:'-0.01em',
                            opacity: billingLoading ? 0.6 : 1 }}>
                          {isDowngrade ? `Switch to ${plan.name}` : `Upgrade to ${plan.name} →`}
                        </button>
                      )}
                      {isCurrent && (
                        <div style={{ padding:'9px', borderRadius:'10px', background:`${plan.color}0d`, border:`1px solid ${plan.color}20`, textAlign:'center' as const, fontSize:12, color:plan.color, fontWeight:600 }}>
                          ✓ Your current plan
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Low-credits banner */}
              {(() => {
                const planKey = currentPlan as keyof typeof PLAN_CREDITS
                const planTotal = PLAN_CREDITS[planKey] || PLAN_CREDITS.spark
                const bal = credits?.balance || 0
                const isTrial = ws?.plan_status === 'trialing'
                const isLow = bal < planTotal * 0.15
                if (!isLow) return null
                return (
                  <div style={{ marginBottom:20, padding:'12px 16px', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.22)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ color:'#F59E0B', flexShrink:0 }}>{Ic.warn}</span>
                      <div>
                        <div style={{ fontSize:12, fontWeight:600, color:'#F59E0B', marginBottom:2 }}>Running low on credits</div>
                        <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)' }}>Top up or upgrade for more.</div>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                      {!isTrial && (
                        <button onClick={() => {
                          const section = document.getElementById('topup-section')
                          section?.scrollIntoView({ behavior:'smooth' })
                        }} style={{ padding:'7px 14px', fontSize:11, fontWeight:600, background:'rgba(245,158,11,0.12)', color:'#F59E0B', border:'1px solid rgba(245,158,11,0.25)', borderRadius:8, cursor:'pointer' }}>
                          Top up
                        </button>
                      )}
                      <button onClick={() => checkout('grow')} style={{ padding:'7px 14px', fontSize:11, fontWeight:600, background:'rgba(0,170,255,0.10)', color:'#00AAFF', border:'1px solid rgba(0,170,255,0.22)', borderRadius:8, cursor:'pointer' }}>
                        Upgrade plan →
                      </button>
                    </div>
                  </div>
                )
              })()}

              {/* Top-up credits section */}
              {ws?.plan_status !== 'trialing' && (
              <div id="topup-section" style={{ marginBottom:28 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#FFFFFF', letterSpacing:'-0.02em', marginBottom:4 }}>Need more credits?</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.38)', marginBottom:14 }}>
                  One-time top-ups — credits never expire and stack on top of your monthly allowance.
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(145px,1fr))', gap:8 }}>
                  {(TOPUP_PACKS_BY_PLAN[currentPlan as keyof typeof TOPUP_PACKS_BY_PLAN] || TOPUP_PACKS_BY_PLAN.spark).map(pack => {
                    const perCredit = ((pack.price / 100) / pack.credits * 100).toFixed(1)
                    const cinemaVids = Math.floor(pack.credits / 138)
                    return (
                      <button key={pack.credits}
                        onClick={() => checkout(null, pack.credits)}
                        disabled={billingLoading}
                        style={{ padding:'14px 12px', background:'#141414', border:`1px solid ${pack.tag?'rgba(0,170,255,0.25)':'rgba(255,255,255,0.10)'}`, borderRadius:10, cursor:'pointer', textAlign:'left' as const, position:'relative' as const, transition:'border-color 0.15s', opacity: billingLoading?0.6:1 }}
                        onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.2)'}
                        onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor=pack.tag?'rgba(0,170,255,0.25)':'rgba(255,255,255,0.10)'}>
                        {pack.tag && (
                          <div style={{ position:'absolute' as const, top:-7, right:8, fontSize:8, fontWeight:700, color:'#00AAFF', background:'rgba(0,170,255,0.12)', border:'1px solid rgba(0,170,255,0.25)', borderRadius:99, padding:'1px 6px', letterSpacing:'0.06em', textTransform:'uppercase' as const }}>{pack.tag}</div>
                        )}
                        <div style={{ fontSize:15, fontWeight:700, color:'#FFFFFF', letterSpacing:'-0.03em', marginBottom:1 }}>{pack.label}</div>
                        <div style={{ fontSize:10, color:'rgba(255,255,255,0.38)', marginBottom:8 }}>
                          {cinemaVids > 0 ? `~${cinemaVids} cinema videos (8s)` : `~${Math.floor(pack.credits/3)} posts`}
                        </div>
                        <div style={{ display:'flex', alignItems:'baseline', gap:6, justifyContent:'space-between' }}>
                          <div style={{ fontSize:14, fontWeight:700, color:'#00AAFF' }}>${(pack.price/100).toFixed(0)}</div>
                          <div style={{ fontSize:10, color:'rgba(255,255,255,0.30)' }}>{perCredit}¢/cr</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
              )}

              {/* Credit cost reference */}
              <div style={{ padding:'16px', background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.38)', letterSpacing:'0.08em', textTransform:'uppercase' as const, marginBottom:12 }}>{isArabic?'تكلفة الرصيد لكل إجراء':'Credit costs per action'}</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 24px' }}>
                  {[
                    ['Post / Caption / Hook / Bio','3 cr'],
                    ['Thread / Email / Ad','5 cr'],
                    ['Full article','10 cr'],
                    ['Image (any size)','5 cr'],
                    ['Video 5s standard (silent)','65 cr'],
                    ['Video 8s standard (audio)','155 cr'],
                    ['Video 8s cinema (audio)','138 cr'],
                    ['Voice short (~30s)','5 cr'],
                    ['Voice medium (~60s)','10 cr'],
                    ['Voice long (~3 min)','39 cr'],
                  ].map(([label,cost]) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:11 }}>
                      <span style={{ color:'rgba(255,255,255,0.38)' }}>{label}</span>
                      <span style={{ fontFamily:"'Geist Mono', monospace", color:'rgba(255,255,255,0.72)', fontWeight:600, fontSize:11 }}>{cost}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════ SECURITY ════ */}
          {tab === 'password' && (
            <div style={{ maxWidth:420, animation:'pageUp 0.35s ease both' }}>
              <div style={{ marginBottom:28 }}>
                <h2 style={{ fontSize:20, fontWeight:700, letterSpacing:'-0.03em', color:'#FFFFFF', marginBottom:5 }}>{isArabic?'الأمان':'Security'}</h2>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.38)' }}>{isArabic?'حدّث كلمة سرك':'Update your password'}</p>
              </div>
              <Field label={isArabic ? "كلمة السر الجديدة" : "New password"}>
                <Input value={newPw} onChange={(v:string)=>{setNewPw(v);setPwErr('')}} type="password" placeholder="Minimum 6 characters"/>
              </Field>
              <Field label={isArabic?"تأكيد كلمة السر":"Confirm new password"}>
                <Input value={confPw} onChange={(v:string)=>{setConfPw(v);setPwErr('')}} type="password" placeholder="Repeat your new password"/>
              </Field>
              {pwErr && (
                <div className="error-state" style={{ marginBottom:16, fontSize:12 }}>
                  <span style={{ display:'flex', color:'#EF4444' }}>{Ic.warn}</span>{pwErr}
                </div>
              )}
              <SaveBtn onClick={savePassword} saving={saving} saved={saved} disabled={!newPw||!confPw}/>

              {/* Delete account */}
              <div style={{ marginTop:40, paddingTop:28, borderTop:'1px solid rgba(239,68,68,0.20)' }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#EF4444', opacity:0.8, marginBottom:5 }}>{isArabic?'المنطقة الخطرة':'Danger zone'}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.38)', marginBottom:16, lineHeight:1.55 }}>
                  Permanently delete your account and all workspace data. This cannot be undone.
                </div>
                {deleteConfirm && (
                  <div className="card-danger" style={{ padding:'12px 16px', fontSize:12, color:'#EF4444', marginBottom:12, lineHeight:1.55 }}>
                    <strong>Are you sure?</strong> This will permanently delete your workspace and all data.
                  </div>
                )}
                <button
                  onClick={deleteAccount}
                  disabled={deleting}
                  className="btn-danger"
                  style={{ opacity:deleting?0.5:1, cursor:deleting?'not-allowed':'pointer' }}>
                  {deleting ? 'Deleting...' : deleteConfirm ? 'Yes, delete my account' : 'Delete account'}
                </button>
                {deleteConfirm && !deleting && (
                  <button onClick={()=>setDeleteConfirm(false)} style={{ marginTop:8, background:'none', border:'none', color:'rgba(255,255,255,0.38)', fontSize:12, cursor:'pointer', padding:0 }}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, padding:'11px 18px', borderRadius:'10px', background:toast.ok?'rgba(34,197,94,0.10)':'rgba(239,68,68,0.10)', border:`1px solid ${toast.ok?'rgba(34,197,94,0.20)':'rgba(239,68,68,0.20)'}`, color:toast.ok?'#22C55E':'#EF4444', fontSize:13, fontWeight:600, backdropFilter:'blur(16px)', boxShadow:'0 8px 32px rgba(0,0,0,0.45)', animation:'pageUp 0.2s ease both' }}>
          {toast.msg}
        </div>
      )}
    </>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'rgba(255,255,255,0.38)',fontSize:13 }}>Loading…</div>}>
      <SettingsInner/>
    </Suspense>
  )
}
