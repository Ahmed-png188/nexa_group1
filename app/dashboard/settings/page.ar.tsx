'use client'
import { useState, useEffect, Suspense, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'
import { TOPUP_PACKS_BY_PLAN, PLAN_CREDITS } from '@/lib/plan-constants'

// ─── الخطوط والثوابت ─────────────────────────────────────────────
const F    = "'Tajawal', system-ui, sans-serif"
const MONO = "'Geist Mono', monospace"

type Tab = 'profile' | 'workspace' | 'billing' | 'password'

// ─── خطط الاشتراك ─────────────────────────────────────────────────
const PLANS = [
  {
    id: 'spark', name: 'Spark', tagline: 'المبدع', price: 49, credits: 1000,
    color: 'rgba(255,255,255,0.5)', popular: false,
    desc: 'ابنِ براندك وأنشئ بثبات',
    features: [
      '١٠٠٠ كريديت/شهر (~٧ فيديو سينمائي أو ٣٣٣ منشور)',
      'Brand Brain — تدريب الصوت',
      'كل أنواع المحتوى (نص، صورة، فيديو، صوت)',
      'دردشة Nexa AI — بلا حدود',
      'الموجز الصباحي',
      'الاستراتيجية وخطة ٣٠ يوم',
      'منصتان اجتماعيتان',
      '٦٠ منشور مجدوَل/شهر',
      'صفحة Lead Capture',
      'تسليم Lead Magnet',
      'تحليلات أساسية',
      'عضو فريق واحد',
    ],
    locked: [
      'تسلسلات الإيميل',
      'Amplify (إعلانات Meta)',
      'تحليل المنافسين',
    ],
  },
  {
    id: 'grow', name: 'Grow', tagline: 'المنمّي', price: 89, credits: 3000,
    color: '#00AAFF', popular: true,
    desc: 'اجمع العملاء المحتملين، أدر إعلانات، كبّر جمهورك',
    features: [
      '٣٠٠٠ كريديت/شهر (~٢١ فيديو سينمائي أو ١٠٠٠ منشور)',
      'كل مزايا Spark',
      'تسلسلات إيميل (٣ نشطة)',
      'تسلسلات مكتوبة بالذكاء',
      '٢٥٠٠ جهة اتصال · ٣٠٠٠ إيميل/شهر',
      'Amplify — إعلانات Meta من محتواك',
      'بوست ترقية بنقرة من الاستوديو',
      'تحليل المنافسين',
      'التعلم من الأداء',
      '٤ منصات · منشورات بلا حدود',
      'تحليلات كاملة + إنسايتس بالذكاء',
      'دمج Kit/ConvertKit',
      '٢ عضو فريق',
    ],
    locked: [
      'إزالة علامة Nexa',
      'نطاق مرسل مخصص',
      'محفزات سلوكية',
    ],
  },
  {
    id: 'scale', name: 'Scale', tagline: 'المشغّل', price: 169, credits: 7000,
    color: '#A78BFA', popular: false,
    desc: 'احترافي، وايت ليبل، مؤتمت بالكامل',
    features: [
      '٧٠٠٠ كريديت/شهر (~٥٠ فيديو سينمائي أو ٢٣٣٣ منشور)',
      'كل مزايا Grow',
      'إزالة علامة Nexa من كل مكان',
      'نطاق مرسل مخصص',
      '١٥ تسلسل · ١٥٠٠٠ جهة اتصال',
      '٢٠٠٠٠ إيميل/شهر',
      'محفزات سلوكية',
      'اختبار سطر الموضوع A/B',
      'مراقب أداء الإعلانات بالذكاء',
      'موجز إنسايتس يومي',
      'منصات ومنشورات بلا حدود',
      'تصدير التحليلات',
      '٥ أعضاء فريق · دعم أولوي',
    ],
    locked: [
      'مساحات عمل العملاء للوكالة',
    ],
  },
  {
    id: 'agency', name: 'Agency', tagline: 'الوكالة', price: 349, credits: 20000,
    color: '#FF7A40', popular: false,
    desc: 'أدر براندات عملاء متعددين من مكان واحد',
    features: [
      '٢٠٠٠٠ كريديت/شهر (~١٤٤ فيديو سينمائي أو ٦٦٦٦ منشور)',
      'كل مزايا Scale',
      'مساحات عمل عملاء بلا حدود',
      'Brand Brain مستقل لكل عميل',
      'داشبورد نظرة عامة للوكالة',
      'تتبع الاشتراكات والإيراد الشهري',
      'انتقال بنقرة بين المساحات',
      'نظام دعوة العملاء',
      '١٠٠٠٠٠ إيميل/شهر',
      'جهات اتصال بلا حدود',
      '٢٥ عضو فريق',
    ],
    locked: [],
  },
]

// ─── الأيقونات ────────────────────────────────────────────────────
const Ic = {
  user:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  ws:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  card:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  lock:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  out:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  bolt:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  check: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  warn:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
}

// ─── تبويبات الإعدادات ────────────────────────────────────────────
const NAV: { id: Tab; label: string; icon: JSX.Element; desc: string }[] = [
  { id: 'profile',   label: 'الحساب',      icon: Ic.user, desc: 'اسمك وإيميلك وبايوك' },
  { id: 'workspace', label: 'مساحة العمل', icon: Ic.ws,   desc: 'صوت البراند والجمهور' },
  { id: 'billing',   label: 'الفوترة',     icon: Ic.card, desc: 'الخطة والرصيد والترقية' },
  { id: 'password',  label: 'الأمان',      icon: Ic.lock, desc: 'غيّر كلمة سرك' },
]

// ─── مكوّنات مساعدة ──────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontFamily: F, fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.55)', marginBottom: 7 }}>
        {label}
      </div>
      {children}
      {hint && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 6, lineHeight: 1.6, fontFamily: F }}>
          {hint}
        </div>
      )}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text', readOnly = false }: any) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type={type} value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder} readOnly={readOnly} dir="rtl"
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{
        width: '100%', padding: '11px 14px',
        background: readOnly ? 'rgba(255,255,255,0.02)' : focused ? 'rgba(0,170,255,0.04)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${focused ? 'rgba(0,170,255,0.30)' : 'rgba(255,255,255,0.10)'}`,
        borderRadius: 11, color: readOnly ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.9)',
        fontFamily: F, fontSize: 14, outline: 'none',
        transition: 'all 0.18s', boxSizing: 'border-box' as const,
        textAlign: 'right' as const, cursor: readOnly ? 'default' : 'text',
        boxShadow: focused ? '0 0 0 3px rgba(0,170,255,0.06)' : 'none',
      }}
    />
  )
}

function Textarea({ value, onChange, placeholder, rows = 4 }: any) {
  const [focused, setFocused] = useState(false)
  return (
    <textarea
      value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} rows={rows} dir="rtl"
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{
        width: '100%', padding: '12px 14px',
        background: focused ? 'rgba(0,170,255,0.04)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${focused ? 'rgba(0,170,255,0.30)' : 'rgba(255,255,255,0.10)'}`,
        borderRadius: 11, color: 'rgba(255,255,255,0.9)',
        fontSize: 13, fontFamily: F, outline: 'none', resize: 'vertical',
        lineHeight: 1.75, boxSizing: 'border-box' as const, transition: 'all 0.18s',
        textAlign: 'right' as const, direction: 'rtl',
        boxShadow: focused ? '0 0 0 3px rgba(0,170,255,0.06)' : 'none',
      }}
    />
  )
}

function SaveBtn({ onClick, saving, saved, disabled }: any) {
  return (
    <button
      onClick={onClick} disabled={saving || disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, fontFamily: F,
        padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 10,
        cursor: saving || disabled ? 'not-allowed' : 'pointer',
        background: saved ? 'rgba(34,197,94,0.10)' : saving ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
        color: saved ? '#22C55E' : saving ? 'rgba(255,255,255,0.25)' : '#0C0C0C',
        border: saved ? '1px solid rgba(34,197,94,0.22)' : 'none',
        transition: 'all 0.2s',
      }}
    >
      {saving
        ? <><div className="nexa-spinner" style={{ width: 13, height: 13 }} />يحفظ...</>
        : saved
        ? <><span style={{ display: 'flex' }}>{Ic.check}</span>تم الحفظ</>
        : <><span style={{ display: 'flex' }}>{Ic.bolt}</span>احفظ التغييرات</>
      }
    </button>
  )
}

// ─── المكوّن الداخلي ──────────────────────────────────────────────
function SettingsInnerAr() {
  const supabase     = createClient()
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [tab,            setTab]            = useState<Tab>((searchParams.get('tab') as Tab) || 'profile')
  const [user,           setUser]           = useState<any>(null)
  const [ws,             setWs]             = useState<any>(null)
  const [credits,        setCredits]        = useState<any>(null)
  const [loading,        setLoading]        = useState(true)
  const [saving,         setSaving]         = useState(false)
  const [saved,          setSaved]          = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)
  const [toast,          setToast]          = useState<{ msg: string; ok: boolean } | null>(null)

  // حالة النموذج
  const [fullName,      setFullName]      = useState('')
  const [bio,           setBio]           = useState('')
  const [wsName,        setWsName]        = useState('')
  const [niche,         setNiche]         = useState('')
  const [voice,         setVoice]         = useState('')
  const [tone,          setTone]          = useState('')
  const [audience,      setAudience]      = useState('')
  const [newPw,         setNewPw]         = useState('')
  const [confPw,        setConfPw]        = useState('')
  const [pwErr,         setPwErr]         = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting,      setDeleting]      = useState(false)
  const [avatarUrl,      setAvatarUrl]      = useState('')
  const [avatarUploading,setAvatarUploading]= useState(false)
  const avatarRef = useRef<HTMLInputElement>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    load()
    const success = searchParams.get('success')
    const plan    = searchParams.get('plan')
    if (success === 'true') {
      if (plan) showToast(`انتقلت بنجاح إلى خطة ${plan}! تم إضافة الكريديتات.`)
      else showToast('تمت عملية الدفع بنجاح — تم إضافة الكريديتات')
      setTab('billing')
    }
  }, [])

  useEffect(() => {
    const t = searchParams.get('tab') as Tab
    if (t) setTab(t)
  }, [searchParams])

  async function load() {
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) return
    const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single()
    const { data: m } = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id', u.id).limit(1).single()
    const w = (m as any)?.workspaces
    const { data: cr } = await supabase.from('credits').select('*').eq('workspace_id', w?.id).single()
    setUser({ ...u, ...p }); setWs(w); setCredits(cr)
    setFullName(p?.full_name || ''); setBio(p?.bio || ''); setAvatarUrl(p?.avatar_url || '')
    setWsName(w?.name || ''); setNiche(w?.niche || '')
    setVoice(w?.brand_voice || ''); setTone(w?.brand_tone || '')
    setAudience(w?.brand_audience || '')
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
      showToast('تم رفع الصورة ✓')
    } catch { showToast('فشل الرفع', false) }
    setAvatarUploading(false)
  }

  async function saveProfile() {
    setSaving(true); setSaved(false)
    const { data: { user: u } } = await supabase.auth.getUser()
    await supabase.from('profiles').update({ full_name: fullName, bio }).eq('id', u!.id)
    showToast('تم حفظ الحساب')
    setSaved(true); setTimeout(() => setSaved(false), 3000); setSaving(false)
  }

  async function saveWorkspace() {
    if (!ws) return; setSaving(true); setSaved(false)
    await supabase.from('workspaces').update({ name: wsName, niche, brand_voice: voice, brand_tone: tone, brand_audience: audience }).eq('id', ws.id)
    showToast('تم حفظ مساحة العمل')
    setSaved(true); setTimeout(() => setSaved(false), 3000); setSaving(false)
  }

  async function savePassword() {
    if (newPw !== confPw) { setPwErr('كلمتا السر غير متطابقتين'); return }
    if (newPw.length < 6) { setPwErr('٦ أحرف على الأقل'); return }
    setPwErr(''); setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) showToast(error.message, false)
    else { showToast('تم تحديث كلمة السر'); setNewPw(''); setConfPw('') }
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
      else showToast('ما قدرنا نبدأ الدفع', false)
    } catch { showToast('حصل خطأ في الدفع', false) }
    setBillingLoading(false)
  }

  async function signOut() { await supabase.auth.signOut(); router.push('/') }

  async function deleteAccount() {
    if (!deleteConfirm) { setDeleteConfirm(true); return }
    setDeleting(true)
    try {
      const r = await fetch('/api/account/delete', { method: 'DELETE' })
      if (!r.ok) throw new Error('failed')
      await supabase.auth.signOut()
      router.push('/')
    } catch {
      showToast('فشل حذف الحساب. تواصل مع الدعم.', false)
      setDeleting(false); setDeleteConfirm(false)
    }
  }

  async function openPortal() {
    const r = await fetch('/api/stripe/portal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspace_id: ws?.id }) })
    const d = await r.json()
    if (d.url) router.push(d.url)
    else showToast('ما قدرنا نفتح بوابة الفوترة', false)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - var(--topbar-h))', flexDirection: 'column', gap: 16 }}>
      <div className="nexa-spinner" style={{ width: 22, height: 22 }} />
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', fontFamily: F, letterSpacing: '0.06em' }}>يحمّل...</div>
    </div>
  )

  const initial     = (user?.full_name?.[0] || user?.email?.[0] || 'م').toUpperCase()
  const currentPlan = ws?.plan || 'spark'
  const planColor   = PLANS.find(p => p.id === currentPlan)?.color || 'rgba(255,255,255,0.5)'

  return (
    <>
      <div dir="rtl" style={{ display: 'grid', gridTemplateColumns: '230px 1fr', height: 'calc(100vh - var(--topbar-h))', overflow: 'hidden' }}>

        {/* ── القائمة الجانبية ── */}
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', padding: '20px 12px', overflow: 'hidden', background: '#141414' }}>

          {/* بطاقة المستخدم */}
          <div className="card" style={{ padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg, #00AAFF, rgba(0,170,255,0.5))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F, fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {initial}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                  {user?.full_name || 'حسابك'}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                  {user?.email}
                </div>
              </div>
            </div>
            {/* شارة الخطة */}
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 7, padding: '5px 10px', borderRadius: 8, background: `${planColor}0d`, border: `1px solid ${planColor}22` }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: planColor, boxShadow: `0 0 6px ${planColor}` }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: planColor, letterSpacing: '-0.01em', fontFamily: F }}>{currentPlan}</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginRight: 'auto', fontFamily: MONO }}>
                {credits?.balance?.toLocaleString() || 0} cr
              </span>
            </div>
          </div>

          {/* عناصر التنقل */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
            {NAV.map(n => {
              const on = tab === n.id
              return (
                <button
                  key={n.id}
                  onClick={() => { setTab(n.id); setSaved(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 11px', borderRadius: 10,
                    background: on ? 'rgba(0,170,255,0.10)' : 'transparent',
                    border: `1px solid ${on ? 'rgba(0,170,255,0.20)' : 'transparent'}`,
                    color: on ? '#00AAFF' : 'rgba(255,255,255,0.38)',
                    cursor: 'pointer', fontFamily: F,
                    fontSize: 13, fontWeight: on ? 600 : 400,
                    transition: 'all 0.15s', textAlign: 'right', width: '100%',
                  }}
                  onMouseEnter={e => { if (!on) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
                  onMouseLeave={e => { if (!on) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <span style={{ display: 'flex', opacity: on ? 1 : 0.55 }}>{n.icon}</span>
                  <div>
                    <div style={{ lineHeight: 1 }}>{n.label}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2, fontWeight: 400, fontFamily: F }}>{n.desc}</div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* تسجيل الخروج */}
          <button
            onClick={signOut}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 11px', borderRadius: 10,
              background: 'transparent', border: '1px solid transparent',
              color: '#EF4444', opacity: 0.65, cursor: 'pointer',
              fontSize: 13, fontFamily: F, transition: 'all 0.15s', width: '100%',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.10)'; (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.20)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.opacity = '0.65'; (e.currentTarget as HTMLElement).style.borderColor = 'transparent' }}
          >
            <span style={{ display: 'flex' }}>{Ic.out}</span>
            تسجيل الخروج
          </button>
        </div>

        {/* ── المحتوى ── */}
        <div style={{ overflowY: 'auto', padding: '32px 36px 60px' }}>

          {/* ════ الحساب ════ */}
          {tab === 'profile' && (
            <div style={{ maxWidth: 520, animation: 'pageUp 0.35s ease both' }}>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: '#FFFFFF', marginBottom: 5, fontFamily: F }}>الحساب الشخصي</h2>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', fontFamily: F }}>كيف تظهر في مساحة عملك</p>
              </div>

              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)', marginBottom: 12, fontFamily: F }}>
                  صورة الحساب
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexDirection: 'row-reverse' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 18, overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,170,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#00AAFF', position: 'relative' }}>
                    {avatarUrl
                      ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                      : <span>{(user?.full_name || user?.email || 'U')[0].toUpperCase()}</span>
                    }
                    {avatarUploading && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="nexa-spinner" style={{ width: 16, height: 16 }}/>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <button onClick={() => avatarRef.current?.click()} disabled={avatarUploading}
                      className="btn-secondary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, fontFamily: F }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      {avatarUploading ? '...جارٍ الرفع' : 'رفع صورة'}
                    </button>
                    {avatarUrl && (
                      <button onClick={async () => { await supabase.from('profiles').update({ avatar_url: null }).eq('id', user?.id); setAvatarUrl(''); showToast('تم حذف الصورة') }}
                        style={{ fontSize: 11, color: 'rgba(239,68,68,0.7)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'right' as const, fontFamily: F }}>
                        حذف الصورة
                      </button>
                    )}
                  </div>
                  <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])}/>
                </div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 10, fontFamily: F }}>JPG أو PNG — بحجم أقصاه ٥ ميغابايت</p>
              </div>

              <Field label="الاسم الكامل">
                <Input value={fullName} onChange={setFullName} placeholder="اسمك الكامل" />
              </Field>

              <Field label="الإيميل" hint="لا يمكن تغيير الإيميل من هنا">
                <Input value={user?.email} readOnly />
              </Field>

              <Field label="البايو" hint="يظهر في ملفك الشخصي. اجعله جملة واحدة قوية تعبّر عنك.">
                <Textarea value={bio} onChange={setBio} placeholder="الجملة الواحدة التي تعرّف من أنت ومن تساعد." rows={3} />
              </Field>

              <SaveBtn onClick={saveProfile} saving={saving} saved={saved} />
            </div>
          )}

          {/* ════ مساحة العمل ════ */}
          {tab === 'workspace' && (
            <div style={{ maxWidth: 560, animation: 'pageUp 0.35s ease both' }}>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: '#FFFFFF', marginBottom: 5, fontFamily: F }}>مساحة العمل</h2>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', fontFamily: F }}>هذه الإعدادات تُشغّل كل توليد ذكاء اصطناعي في المنتج</p>
              </div>

              <Field label="اسم مساحة العمل">
                <Input value={wsName} onChange={setWsName} placeholder="براندي" />
              </Field>

              <Field label="المجال" hint="المجال الذي تعمل فيه. كلما كان أدق، كانت النتائج أحدّ.">
                <Input value={niche} onChange={setNiche} placeholder="مثال: بناء البراند الشخصي لمؤسسي الشركات الناشئة" />
              </Field>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '24px 0' }} />

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#00AAFF', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 4, fontFamily: F }}>
                  صوت البراند
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', marginBottom: 16, lineHeight: 1.65, fontFamily: F }}>
                  هذا هو أهم إعداد. كل توليد — محتوى، إيميل، استراتيجية — يبني عليه. كن محدداً.
                </div>
              </div>

              <Field label="صوت البراند" hint="صف كيف تكتب. هذا ما يقلّده Nexa.">
                <Textarea value={voice} onChange={setVoice} placeholder="مباشر، مدعوم بعلم النفس، أقدّم الأفكار بثقة. أكتب للمشغّلين والبنّائين، لا للمبتدئين. بلا حشو — كل جملة لها مكانها." rows={4} />
              </Field>

              <Field label="نبرة البراند" hint="المستوى العاطفي. كيف تريد أن يشعر القارئ؟">
                <Textarea value={tone} onChange={setTone} placeholder="واثق لكن غير متكبّر. صريح لكن غير قاسٍ. تعليمي لكن لا يستخفّ بأحد." rows={3} />
              </Field>

              <Field label="الجمهور المستهدف" hint="كلما كان هذا أدق، كانت كل توليد يعرف الجمهور أكثر دقة.">
                <Textarea value={audience} onChange={setAudience} placeholder="مؤسسون ومشغّلون طموحون بين ٢٨ و٤٢ سنة يريدون بناء براند شخصي قوي لكن لا يعرفون من أين يبدأون. ذكاء، وقتهم ثمين، وملوا من المحتوى العام." rows={4} />
              </Field>

              <SaveBtn onClick={saveWorkspace} saving={saving} saved={saved} />

              {/* هوية المرسل */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '32px 0' }} />
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#00AAFF', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 4, fontFamily: F }}>
                  هوية المرسل
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', lineHeight: 1.7, fontFamily: F }}>
                  تحكّم في هوية المرسل في إيميلات Lead Magnet والتسلسلات. الافتراضي: الإرسال من{' '}
                  <span style={{ fontFamily: MONO, color: 'rgba(255,255,255,0.65)' }}>hello@nexaa.cc</span>{' '}
                  باسم براندك. يمكنك ربط نطاق مخصص للإرسال من عنوانك الخاص.
                </div>
              </div>

              <Field label="اسم المرسل" hint="الاسم الذي يظهر للمستقبِل في بريده الوارد">
                <Input value={ws?.sender_name || ws?.brand_name || ''} onChange={() => {}} placeholder={ws?.brand_name || ws?.name || 'براندك'} readOnly />
              </Field>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: -8, marginBottom: 16, fontFamily: F }}>
                يستخدم اسم براندك تلقائياً — غيّره من حقل الاسم أعلاه
              </div>

              <div style={{ padding: 16, background: '#141414', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, marginBottom: 16 }}>
                {['scale', 'agency'].includes(currentPlan) ? (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF', marginBottom: 4, fontFamily: F }}>نطاق مرسل مخصص</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', marginBottom: 12, fontFamily: F }}>
                      أرسل من <span style={{ fontFamily: MONO }}>hello@نطاقك.com</span>. ستحتاج لإضافة سجلات DNS للتحقق.
                    </div>
                    <a href="/dashboard/settings?tab=billing" style={{ fontSize: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, color: '#00AAFF', fontFamily: F }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      إعداد النطاق المخصص ←
                    </a>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.72)', marginBottom: 3, fontFamily: F }}>نطاق مرسل مخصص</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', fontFamily: F }}>متاح في خطتَي Scale و Agency</div>
                    </div>
                    <a href="/dashboard/settings?tab=billing" style={{ fontSize: 11, padding: '5px 12px', textDecoration: 'none', whiteSpace: 'nowrap' as const, background: '#00AAFF', color: '#000', borderRadius: 8, fontWeight: 700, fontFamily: F }}>طوّر</a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════ الفوترة ════ */}
          {tab === 'billing' && (
            <div style={{ animation: 'pageUp 0.35s ease both' }}>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: '#FFFFFF', marginBottom: 5, fontFamily: F }}>الفوترة</h2>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', fontFamily: F }}>أدر خطتك ورصيدك</p>
              </div>

              {/* بطاقة الاستخدام الحالي */}
              <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' as const }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.38)', marginBottom: 5, fontFamily: F }}>
                    الخطة الحالية
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.04em', color: planColor, textTransform: 'capitalize', fontFamily: F }}>
                    {currentPlan}
                  </div>

                  {ws?.plan_status === 'trialing' && (
                    <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.20)', borderRadius: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#F59E0B', marginBottom: 3, fontFamily: F }}>التجربة المجانية نشطة</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.72)', lineHeight: 1.6, fontFamily: F }}>
                        أنت في فترة تجربة مجانية لمدة ٧ أيام. طوّر قبل انتهائها للحفاظ على Brand Brain والمحتوى والأتمتة.
                      </div>
                    </div>
                  )}

                  {ws?.plan_status === 'past_due' && (
                    <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)', borderRadius: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#EF4444', marginBottom: 3, fontFamily: F }}>فشل الدفع</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.72)', lineHeight: 1.6, fontFamily: F }}>
                        فشلت آخر عملية دفع. حدّث طريقة الدفع لتجنب فقدان الوصول.
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ width: 1, height: 44, background: 'rgba(255,255,255,0.10)' }} />

                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.38)', marginBottom: 5, fontFamily: F }}>
                    الرصيد المتبقي
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.04em', color: '#FFFFFF', fontFamily: MONO }}>
                    {credits?.balance?.toLocaleString() || 0}
                  </div>
                </div>

                <div style={{ width: 1, height: 44, background: 'rgba(255,255,255,0.10)' }} />

                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.38)', marginBottom: 5, fontFamily: F }}>
                    الكلي المستهلك
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.04em', color: '#FFFFFF', fontFamily: MONO }}>
                    {credits?.lifetime_used?.toLocaleString() || 0}
                  </div>
                </div>
              </div>

              {/* إدارة الاشتراك */}
              {ws?.stripe_subscription_id && (
                <div style={{ marginBottom: 20 }}>
                  <button
                    onClick={openPortal}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, fontFamily: F, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: 'rgba(255,255,255,0.72)', cursor: 'pointer', transition: 'all 0.15s' }}
                  >
                    <span style={{ display: 'flex' }}>{Ic.card}</span>
                    إدارة الاشتراك ←
                  </button>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 6, fontFamily: F }}>
                    تحديث طريقة الدفع، عرض الفواتير، أو الإلغاء
                  </div>
                </div>
              )}

              {/* بطاقات الخطط */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(225px,1fr))', gap: 12, marginBottom: 32 }}>
                {PLANS.map(plan => {
                  const isCurrent  = currentPlan === plan.id
                  const planOrder  = ['spark', 'grow', 'scale', 'agency']
                  const isDowngrade = planOrder.indexOf(plan.id) < planOrder.indexOf(currentPlan)
                  return (
                    <div
                      key={plan.id}
                      style={{
                        padding: 20, position: 'relative', borderRadius: 12,
                        background: isCurrent ? `${plan.color}08` : '#141414',
                        border: isCurrent ? `1.5px solid ${plan.color}38` : '1px solid rgba(255,255,255,0.10)',
                        transition: 'border-color 0.15s',
                      }}
                      onMouseEnter={e => { if (!isCurrent) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.18)' }}
                      onMouseLeave={e => { if (!isCurrent) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.10)' }}
                    >
                      {/* شارة الأكثر شيوعاً */}
                      {plan.popular && !isCurrent && (
                        <div style={{ position: 'absolute', top: -1, left: 14, fontSize: 9, fontWeight: 700, padding: '3px 9px', borderRadius: '0 0 7px 7px', background: plan.color, color: '#000', letterSpacing: '0.05em', fontFamily: F }}>
                          الأكثر شيوعاً
                        </div>
                      )}

                      {/* الاسم والتصنيف */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.03em', color: isCurrent ? plan.color : '#FFFFFF', fontFamily: F }}>
                            {plan.name}
                          </span>
                          {isCurrent && (
                            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: plan.color, padding: '2px 8px', background: `${plan.color}12`, border: `1px solid ${plan.color}25`, borderRadius: 99, fontFamily: F }}>
                              نشطة
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontFamily: F }}>{plan.tagline}</div>
                      </div>

                      {/* السعر */}
                      <div style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.05em', color: '#FFFFFF', fontFamily: MONO }}>${plan.price}</span>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', marginRight: 3, fontFamily: F }}>/شهر</span>
                      </div>

                      {/* الكريديتات */}
                      <div style={{ padding: '8px 10px', background: `${plan.color}0d`, border: `1px solid ${plan.color}18`, borderRadius: 8, marginBottom: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: plan.color, marginBottom: 4, fontFamily: F }}>
                          {plan.credits.toLocaleString()} كريديت/شهر
                        </div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', lineHeight: 1.6, fontFamily: F }}>
                          ~{Math.floor(plan.credits / 138)} فيديو سينمائي · ~{Math.floor(plan.credits / 3)} منشور · ~{Math.floor(plan.credits / 5)} صورة
                        </div>
                      </div>

                      {/* المزايا المتضمّنة */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: plan.locked.length > 0 ? 10 : 16 }}>
                        {plan.features.map(f => (
                          <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 11, color: 'rgba(255,255,255,0.72)', lineHeight: 1.5 }}>
                            <span style={{ color: plan.color, flexShrink: 0, marginTop: 1 }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </span>
                            {f}
                          </div>
                        ))}
                      </div>

                      {/* المزايا المقفلة */}
                      {plan.locked.length > 0 && !isCurrent && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.10)' }}>
                          {plan.locked.map(f => (
                            <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 11, color: 'rgba(255,255,255,0.20)', lineHeight: 1.5 }}>
                              <span style={{ flexShrink: 0, marginTop: 1, opacity: 0.4 }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                              </span>
                              <span style={{ textDecoration: 'line-through', opacity: 0.45, fontFamily: F }}>{f}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* زر الترقية / التبديل */}
                      {!isCurrent && (
                        <button
                          onClick={() => checkout(plan.id)}
                          disabled={billingLoading}
                          style={{
                            width: '100%', padding: '10px', fontSize: 12, fontWeight: 700, fontFamily: F,
                            background: isDowngrade ? 'transparent' : plan.color,
                            color: isDowngrade ? 'rgba(255,255,255,0.38)' : '#000',
                            border: isDowngrade ? '1px solid rgba(255,255,255,0.10)' : 'none',
                            borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                            opacity: billingLoading ? 0.6 : 1, letterSpacing: '-0.01em',
                          }}
                        >
                          {isDowngrade ? `التحويل لـ ${plan.name}` : `الترقية لـ ${plan.name} ←`}
                        </button>
                      )}
                      {isCurrent && (
                        <div style={{ padding: 9, borderRadius: 10, background: `${plan.color}0d`, border: `1px solid ${plan.color}22`, textAlign: 'center' as const, fontSize: 12, color: plan.color, fontWeight: 600, fontFamily: F }}>
                          ✓ خطتك الحالية
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* بانر انخفاض الرصيد */}
              {(() => {
                const planKey = currentPlan as keyof typeof PLAN_CREDITS
                const planTotal = PLAN_CREDITS[planKey] || PLAN_CREDITS.spark
                const bal = credits?.balance || 0
                const isTrial = ws?.plan_status === 'trialing'
                const isLow = bal < planTotal * 0.15
                if (!isLow) return null
                return (
                  <div dir="rtl" style={{ marginBottom: 20, padding: '12px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: '#F59E0B', flexShrink: 0 }}>{Ic.warn}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#F59E0B', marginBottom: 2, fontFamily: F, letterSpacing: 0 }}>الرصيد على وشك النفاد</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: F, letterSpacing: 0 }}>أضف رصيداً أو رقّ خطتك.</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      {!isTrial && (
                        <button onClick={() => {
                          const section = document.getElementById('topup-section-ar')
                          section?.scrollIntoView({ behavior: 'smooth' })
                        }} style={{ padding: '7px 14px', fontSize: 11, fontWeight: 600, background: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, cursor: 'pointer', fontFamily: F, letterSpacing: 0 }}>
                          إضافة رصيد
                        </button>
                      )}
                      <button onClick={() => checkout('grow')} style={{ padding: '7px 14px', fontSize: 11, fontWeight: 600, background: 'rgba(0,170,255,0.10)', color: '#00AAFF', border: '1px solid rgba(0,170,255,0.22)', borderRadius: 8, cursor: 'pointer', fontFamily: F, letterSpacing: 0 }}>
                        ترقية الخطة →
                      </button>
                    </div>
                  </div>
                )
              })()}

              {/* إضافة رصيد */}
              {ws?.plan_status !== 'trialing' && (
              <div id="topup-section-ar" style={{ marginBottom: 32 }} dir="rtl">
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', letterSpacing: 0, marginBottom: 4, fontFamily: F }}>
                  تحتاج رصيداً إضافياً؟
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', marginBottom: 16, lineHeight: 1.6, fontFamily: F, letterSpacing: 0 }}>
                  إضافات لمرة واحدة — الكريديتات لا تنتهي صلاحيتها وتُضاف فوق رصيدك الشهري.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px,1fr))', gap: 9 }}>
                  {(TOPUP_PACKS_BY_PLAN[currentPlan as keyof typeof TOPUP_PACKS_BY_PLAN] || TOPUP_PACKS_BY_PLAN.spark).map(pack => {
                    const perCredit = ((pack.price / 100) / pack.credits * 100).toFixed(1)
                    const cinemaVids = Math.floor(pack.credits / 138)
                    return (
                      <button
                        key={pack.credits}
                        onClick={() => checkout(null, pack.credits)}
                        disabled={billingLoading}
                        style={{
                          padding: '14px 12px', background: '#141414',
                          border: `1px solid ${pack.tag ? 'rgba(0,170,255,0.25)' : 'rgba(255,255,255,0.10)'}`,
                          borderRadius: 10, cursor: 'pointer', textAlign: 'right' as const,
                          position: 'relative' as const, transition: 'border-color 0.15s',
                          opacity: billingLoading ? 0.6 : 1,
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.22)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = pack.tag ? 'rgba(0,170,255,0.25)' : 'rgba(255,255,255,0.10)'}
                      >
                        {pack.tag && (
                          <div style={{ position: 'absolute' as const, top: -7, right: 8, fontSize: 8, fontWeight: 700, color: '#00AAFF', background: 'rgba(0,170,255,0.12)', border: '1px solid rgba(0,170,255,0.25)', borderRadius: 99, padding: '1px 7px', letterSpacing: 0, fontFamily: F }}>
                            {pack.tag === 'Quick boost' ? 'شحن سريع' : pack.tag === 'Best value' ? 'الأوفر' : pack.tag}
                          </div>
                        )}
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', letterSpacing: 0, marginBottom: 1, fontFamily: F }}>
                          {pack.label}
                        </div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', marginBottom: 8, fontFamily: F, letterSpacing: 0 }}>
                          {cinemaVids > 0 ? `~${cinemaVids} فيديو سينمائي (٨ث)` : `~${Math.floor(pack.credits / 3)} منشور`}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, justifyContent: 'space-between', flexDirection: 'row-reverse' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#00AAFF', fontFamily: MONO }}>${(pack.price / 100).toFixed(0)}</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.30)', fontFamily: MONO }}>{perCredit}¢/cr</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
              )}

              {/* تكلفة الكريديت لكل إجراء */}
              <div style={{ padding: 16, background: '#141414', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 14, fontFamily: F }}>
                  تكلفة الكريديت لكل إجراء
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px 24px' }}>
                  {[
                    ['منشور / كابشن / هوك / بايو', '٣ cr'],
                    ['ثريد / إيميل / إعلان',        '٥ cr'],
                    ['مقالة كاملة',                  '١٠ cr'],
                    ['صورة (أي حجم)',                 '٥ cr'],
                    ['فيديو ٥ث ستاندرد (صامت)',       '٦٥ cr'],
                    ['فيديو ٨ث ستاندرد (مع صوت)',     '١٥٥ cr'],
                    ['فيديو ٨ث سينمائي (مع صوت)',     '١٣٨ cr'],
                    ['صوت قصير (~٣٠ ث)',              '٥ cr'],
                    ['صوت متوسط (~٦٠ ث)',             '١٠ cr'],
                    ['صوت طويل (~٣ د)',               '٣٩ cr'],
                  ].map(([label, cost]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                      <span style={{ color: 'rgba(255,255,255,0.40)', fontFamily: F }}>{label}</span>
                      <span style={{ fontFamily: MONO, color: 'rgba(255,255,255,0.72)', fontWeight: 600, fontSize: 11 }}>{cost}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════ الأمان ════ */}
          {tab === 'password' && (
            <div style={{ maxWidth: 420, animation: 'pageUp 0.35s ease both' }}>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: '#FFFFFF', marginBottom: 5, fontFamily: F }}>الأمان</h2>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', fontFamily: F }}>حدّث كلمة سرك</p>
              </div>

              <Field label="كلمة السر الجديدة">
                <Input value={newPw} onChange={(v: string) => { setNewPw(v); setPwErr('') }} type="password" placeholder="٦ أحرف على الأقل" />
              </Field>

              <Field label="تأكيد كلمة السر">
                <Input value={confPw} onChange={(v: string) => { setConfPw(v); setPwErr('') }} type="password" placeholder="أعد كتابة كلمة السر" />
              </Field>

              {pwErr && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16, fontSize: 12, color: '#EF4444', padding: '10px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 10, fontFamily: F }}>
                  <span style={{ display: 'flex', color: '#EF4444' }}>{Ic.warn}</span>
                  {pwErr}
                </div>
              )}

              <SaveBtn onClick={savePassword} saving={saving} saved={saved} disabled={!newPw || !confPw} />

              {/* المنطقة الخطرة */}
              <div style={{ marginTop: 44, paddingTop: 28, borderTop: '1px solid rgba(239,68,68,0.18)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#EF4444', opacity: 0.8, marginBottom: 6, fontFamily: F }}>
                  المنطقة الخطرة
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', marginBottom: 18, lineHeight: 1.65, fontFamily: F }}>
                  احذف حسابك ومساحة عملك بشكل دائم. هذا الإجراء لا يمكن التراجع عنه.
                </div>

                {deleteConfirm && (
                  <div style={{ padding: '12px 16px', fontSize: 12, color: '#EF4444', marginBottom: 14, lineHeight: 1.6, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.20)', borderRadius: 10, fontFamily: F }}>
                    <strong>متأكد؟</strong> سيحذف هذا مساحة عملك وكل بياناتك نهائياً بدون رجعة.
                  </div>
                )}

                <button
                  onClick={deleteAccount}
                  disabled={deleting}
                  style={{
                    padding: '9px 20px', fontSize: 13, fontWeight: 600, fontFamily: F,
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)',
                    borderRadius: 10, color: '#EF4444',
                    cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.5 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  {deleting ? 'يحذف...' : deleteConfirm ? 'نعم، احذف حسابي' : 'احذف الحساب'}
                </button>

                {deleteConfirm && !deleting && (
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    style={{ marginTop: 8, display: 'block', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 12, cursor: 'pointer', padding: 0, fontFamily: F }}
                  >
                    إلغاء
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ─── توست الإشعار ─── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: 24, zIndex: 9999,
          padding: '11px 18px', borderRadius: 10,
          background: toast.ok ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)',
          border: `1px solid ${toast.ok ? 'rgba(34,197,94,0.22)' : 'rgba(239,68,68,0.22)'}`,
          color: toast.ok ? '#22C55E' : '#EF4444',
          fontSize: 13, fontWeight: 600, fontFamily: F,
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.48)',
          animation: 'pageUp 0.2s ease both',
        }}>
          {toast.msg}
        </div>
      )}
    </>
  )
}

export default function SettingsPageAr() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.38)', fontSize: 13, fontFamily: "'Tajawal', system-ui, sans-serif" }}>
        يحمّل...
      </div>
    }>
      <SettingsInnerAr />
    </Suspense>
  )
}
