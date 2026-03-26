'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ─── الخطوط والثوابت ─────────────────────────────────────────────
const F    = "'Tajawal', system-ui, sans-serif"
const MONO = "'Geist Mono', monospace"

// ─── الأيقونات ────────────────────────────────────────────────────
const Ic = {
  plus:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  back:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>,
  users:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  bolt:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  close:  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  check:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  arrow:  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  chart:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 20h18"/><path d="M5 20V14l4-4 4 3 4-6 4 4v9"/></svg>,
  dollar: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  mail:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
}

// ─── أفاتار العميل ────────────────────────────────────────────────
function ClientAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || 'ع'
  const palette  = ['#4D9FFF','#A78BFA','#34D399','#FF7A40','#FFB547','#FF5757','#38BFFF','#F472B6']
  const color    = palette[name.charCodeAt(0) % palette.length]
  return (
    <div style={{
      width: size, height: size,
      borderRadius: Math.round(size * 0.3),
      background: `linear-gradient(135deg, ${color}, ${color}99)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: F, fontSize: Math.round(size * 0.38), fontWeight: 800,
      color: '#fff', flexShrink: 0,
      boxShadow: `0 4px 14px ${color}30`,
    }}>
      {initials}
    </div>
  )
}

// ─── شارة الحالة ──────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'active' || !status
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
      background: isActive ? 'rgba(34,197,94,0.10)' : 'rgba(255,255,255,0.05)',
      border: `1px solid ${isActive ? 'rgba(34,197,94,0.22)' : 'rgba(255,255,255,0.09)'}`,
      color: isActive ? '#34D399' : 'rgba(255,255,255,0.35)',
      fontFamily: F, letterSpacing: '0.04em',
    }}>
      {isActive ? 'نشط' : 'غير نشط'}
    </span>
  )
}

// ─── الصفحة الرئيسية ─────────────────────────────────────────────
export default function AgencyPageAr() {
  const supabase = createClient()
  const router   = useRouter()

  const [ws,        setWs]        = useState<any>(null)
  const [clients,   setClients]   = useState<any[]>([])
  const [invites,   setInvites]   = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [sel,       setSel]       = useState<any>(null)
  const [showNew,   setShowNew]   = useState(false)
  const [creating,  setCreating]  = useState(false)
  const [isAgency,  setIsAgency]  = useState(false)
  const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null)
  const [mounted,   setMounted]   = useState(false)
  const [cName,     setCName]     = useState('')
  const [cEmail,    setCEmail]    = useState('')
  const [cBrand,    setCBrand]    = useState('')
  const [cRetainer, setCRetainer] = useState('')

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => { setMounted(true); load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: m } = await supabase
      .from('workspace_members')
      .select('workspace_id, workspaces(*)')
      .eq('user_id', user.id).limit(1).single()
    const w = (m as any)?.workspaces
    setWs(w)
    setIsAgency(w?.plan === 'agency' || w?.is_agency || false)
    const [{ data: cl }, { data: inv }] = await Promise.all([
      supabase.from('client_workspaces')
        .select('*, client_workspace:client_workspace_id(id,name,brand_name,brand_voice,plan)')
        .eq('agency_workspace_id', w?.id)
        .order('created_at', { ascending: false }),
      supabase.from('client_invites')
        .select('*')
        .eq('agency_workspace_id', w?.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
    ])
    setClients(cl ?? [])
    setInvites(inv ?? [])
    setLoading(false)
  }

  async function addClient() {
    if (!cName.trim() || creating) return
    setCreating(true)
    try {
      const r = await fetch('/api/agency/create-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: cName, client_email: cEmail, brand_name: cBrand,
          agency_workspace_id: ws.id, monthly_retainer: parseFloat(cRetainer) || 0,
        }),
      })
      const d = await r.json()
      if (d.success) {
        showToast('تمت إضافة العميل بنجاح')
        setShowNew(false)
        setCName(''); setCEmail(''); setCBrand(''); setCRetainer('')
        load()
      } else {
        showToast(d.error || 'حصل خطأ', false)
      }
    } catch {
      showToast('حصل خطأ غير متوقع', false)
    }
    setCreating(false)
  }

  async function switchWs(id: string) {
    try {
      const r = await fetch('/api/agency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'switch_workspace', workspace_id: id }),
      })
      const d = await r.json()
      if (d.success) router.push('/dashboard')
      else showToast('ما قدر ينتقل للمساحة', false)
    } catch {
      showToast('حصل خطأ', false)
    }
  }

  // ─── تحميل ────────────────────────────────────────────────────
  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: 'calc(100vh - var(--topbar-h))', flexDirection: 'column',
      gap: 16, background: '#0C0C0C',
    }}>
      <div className="nexa-spinner" style={{ width: 22, height: 22 }} />
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: F, letterSpacing: '0.06em' }}>
        يحمّل الوكالة...
      </div>
    </div>
  )

  const totalMRR    = clients.reduce((a, c) => a + (c.monthly_retainer || 0), 0)
  const activeCount = clients.filter(c => c.status !== 'inactive').length

  // ─── صفحة ترقية الوكالة ───────────────────────────────────────
  if (!isAgency) return (
    <div dir="rtl" style={{
      height: 'calc(100vh - var(--topbar-h))', overflowY: 'auto',
      backgroundImage: 'url(/cyan-header.png)',
      backgroundSize: 'cover', backgroundPosition: 'center',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '60px 32px', fontFamily: F,
    }}>
      <div style={{
        textAlign: 'center', maxWidth: 640,
        animation: 'pageUp 0.4s cubic-bezier(0.22,1,0.36,1) both',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '6px 16px', borderRadius: 999,
          background: 'rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.16)',
          marginBottom: 32, backdropFilter: 'blur(8px)',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(0,0,0,0.45)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(0,0,0,0.65)', fontFamily: F }}>
            الوكالة · غير مفعّل
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(34px,5vw,54px)', fontWeight: 800, color: '#0C0C0C',
          lineHeight: 1.1, marginBottom: 18, fontFamily: F, letterSpacing: '-0.03em',
        }}>
          وكالتك كاملة<br />في مكان واحد.
        </h1>

        <p style={{
          fontSize: 16, color: 'rgba(0,0,0,0.52)', lineHeight: 1.8,
          maxWidth: 500, margin: '0 auto 44px', fontFamily: F,
        }}>
          أدر عملاء متعددين، تابع الاشتراكات الشهرية، وانتقل بين البراندات في ثانية — كل شيء من داخل Nexa، بدون فوضى.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 44 }}>
          {[
            {
              icon: Ic.users,
              title: 'مساحات مستقلة للعملاء',
              desc: 'لكل عميل Brand Brain خاص، استراتيجية، وبايبلاين محتوى مستقل',
            },
            {
              icon: Ic.dollar,
              title: 'تتبع الاشتراكات',
              desc: 'شوف إيراداتك الشهرية من كل العملاء من لوحة واحدة واضحة',
            },
            {
              icon: Ic.bolt,
              title: 'انتقال بنقرة واحدة',
              desc: 'اقفز بين مساحات العملاء دون ما تسجّل خروج أو تضيع وقت',
            },
          ].map(f => (
            <div key={f.title} style={{
              padding: '22px 18px', borderRadius: 16,
              background: 'rgba(255,255,255,0.75)',
              border: '1px solid rgba(255,255,255,0.92)',
              backdropFilter: 'blur(16px)', textAlign: 'right',
            }}>
              <div style={{ color: 'rgba(0,0,0,0.55)', marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
                {f.icon}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0C0C0C', marginBottom: 7, fontFamily: F }}>
                {f.title}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.52)', lineHeight: 1.7, fontFamily: F }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/dashboard/settings?tab=billing"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '15px 36px', fontSize: 15, fontWeight: 700, fontFamily: F,
            background: '#0C0C0C', color: '#ffffff', borderRadius: 13,
            textDecoration: 'none', boxShadow: '0 6px 28px rgba(0,0,0,0.28)',
            letterSpacing: '-0.01em', transition: 'all 0.18s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 36px rgba(0,0,0,0.36)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 28px rgba(0,0,0,0.28)' }}
        >
          <span style={{ display: 'flex' }}>{Ic.bolt}</span>
          فعّل خطة الوكالة
        </Link>

        <div style={{ marginTop: 14, fontSize: 12, color: 'rgba(0,0,0,0.42)', fontFamily: F }}>
          $349/شهر · إلغاء في أي وقت · بدون رسوم إضافية
        </div>
      </div>
    </div>
  )

  // ─── صفحة تفاصيل العميل ──────────────────────────────────────
  if (sel) return (
    <div dir="rtl" style={{
      padding: '28px 32px 60px', height: 'calc(100vh - var(--topbar-h))',
      overflowY: 'auto', background: '#0C0C0C', fontFamily: F,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 30 }}>
        <button
          onClick={() => setSel(null)}
          style={{
            width: 36, height: 36, borderRadius: 11,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.45)', cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)'}
        >
          {Ic.back}
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <h1 style={{ fontFamily: F, fontSize: 22, fontWeight: 800, color: 'rgba(255,255,255,0.92)', lineHeight: 1 }}>
              {sel.client_name}
            </h1>
            <StatusBadge status={sel.status} />
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.32)', marginTop: 4, fontFamily: F }}>
            {sel.brand_name || 'ما في اسم براند محدد'}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px,1fr))', gap: 9, marginBottom: 24 }}>
        {[
          { label: 'الاشتراك الشهري', value: sel.monthly_retainer ? `$${sel.monthly_retainer?.toLocaleString()}/شهر` : '—', color: '#22C55E' },
          { label: 'محتوى مُنشأ',     value: String(sel.content_count || 0),                                                  color: '#A78BFA' },
          { label: 'عضو منذ',          value: sel.created_at?.slice(0, 10) || '—',                                             color: '#00AAFF' },
          { label: 'الحالة',            value: sel.status === 'active' ? 'نشط' : 'غير نشط',                                   color: sel.status === 'active' ? '#34D399' : '#FFB547' },
        ].map(s => (
          <div key={s.label} className="nexa-card" style={{ padding: '15px 17px', borderRadius: 14 }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginBottom: 7, fontFamily: F, letterSpacing: '0.07em', textTransform: 'uppercase' as const }}>
              {s.label}
            </div>
            <div style={{ fontFamily: MONO, fontWeight: 300, fontSize: 20, color: s.color, letterSpacing: '-0.03em' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {sel.notes && (
        <div style={{
          padding: '16px 20px', marginBottom: 20,
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14, fontSize: 13,
          color: 'rgba(255,255,255,0.56)', lineHeight: 1.75, fontFamily: F,
        }}>
          {sel.notes}
        </div>
      )}

      {sel.client_workspace_id && (
        <div style={{
          padding: '22px 26px',
          background: 'linear-gradient(145deg, rgba(77,159,255,0.08) 0%, rgba(77,159,255,0.03) 100%)',
          border: '1px solid rgba(77,159,255,0.20)', borderRadius: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.88)', marginBottom: 5, fontFamily: F }}>
              انتقل لمساحة {sel.client_name}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', lineHeight: 1.6, fontFamily: F }}>
              أنشئ محتوى، شغّل الاستراتيجية، وأدر كل شيء من داشبورد عميلك مباشرة
            </div>
          </div>
          <button
            onClick={() => switchWs(sel.client_workspace_id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '12px 24px', fontSize: 13, fontWeight: 700,
              fontFamily: F, background: '#00AAFF', color: '#0C0C0C',
              border: 'none', borderRadius: 12, cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(77,159,255,0.38)',
              transition: 'all 0.18s', flexShrink: 0,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 7px 26px rgba(77,159,255,0.50)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(77,159,255,0.38)' }}
          >
            <span style={{ display: 'flex' }}>{Ic.bolt}</span>
            انتقل للمساحة
          </button>
        </div>
      )}
    </div>
  )

  // ─── داشبورد الوكالة الرئيسي ─────────────────────────────────
  return (
    <>
      <div dir="rtl" style={{
        padding: '28px 32px 60px', height: 'calc(100vh - var(--topbar-h))',
        overflowY: 'auto', background: '#0C0C0C',
        opacity: mounted ? 1 : 0, transition: 'opacity 0.4s ease',
        fontFamily: F,
      }}>

        {/* رأس الصفحة */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 30 }}>
          <div>
            <h1 style={{
              fontFamily: F, fontSize: 22, fontWeight: 800,
              color: 'rgba(255,255,255,0.92)', lineHeight: 1, marginBottom: 6,
              letterSpacing: '-0.02em',
            }}>
              الوكالة
            </h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: F }}>
              {activeCount} عميل نشط · ${totalMRR.toLocaleString()} إيراد شهري
            </p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', fontFamily: F,
              fontWeight: 700, fontSize: 13,
              background: '#00AAFF', color: '#0C0C0C',
              border: 'none', borderRadius: 11, cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(77,159,255,0.35)',
              transition: 'all 0.18s', letterSpacing: '-0.01em',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 7px 26px rgba(77,159,255,0.48)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 18px rgba(77,159,255,0.35)' }}
          >
            <span style={{ display: 'flex' }}>{Ic.plus}</span>
            أضف عميل
          </button>
        </div>

        {/* شريط الإحصائيات */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px,1fr))', gap: 9, marginBottom: 28 }}>
          {[
            { label: 'عملاء نشطون',    value: activeCount,                      color: '#22C55E', icon: Ic.users  },
            { label: 'دعوات معلقة',    value: invites.length,                   color: '#FFB547', icon: Ic.mail   },
            { label: 'الإيراد الشهري', value: `$${totalMRR.toLocaleString()}`,  color: '#00AAFF', icon: Ic.dollar },
            { label: 'إجمالي العملاء', value: clients.length,                   color: '#A78BFA', icon: Ic.chart  },
          ].map(s => (
            <div key={s.label} className="nexa-card" style={{ padding: '14px 18px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: `${s.color}12`, border: `1px solid ${s.color}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: s.color, flexShrink: 0,
              }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontFamily: MONO, fontWeight: 300, fontSize: 28, color: s.color, letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {s.value}
                </div>
                <div style={{ fontFamily: F, fontSize: 9, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* شبكة العملاء */}
        {clients.length > 0 ? (
          <>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.09em', textTransform: 'uppercase' as const, marginBottom: 14, fontFamily: F }}>
              العملاء · {clients.length}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(295px,1fr))', gap: 10 }}>
              {clients.map(c => (
                <div
                  key={c.id}
                  onClick={() => setSel(c)}
                  className="nexa-card"
                  style={{ padding: '20px 22px', borderRadius: 18, cursor: 'pointer', transition: 'all 0.18s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 17 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <ClientAvatar name={c.client_name} size={42} />
                      <div>
                        <div style={{ fontFamily: F, fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.90)', letterSpacing: '-0.01em', marginBottom: 3 }}>
                          {c.client_name}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.36)', fontFamily: F }}>
                          {c.brand_name || 'ما في براند محدد'}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      {c.monthly_retainer > 0 ? (
                        <div style={{ fontFamily: MONO, fontWeight: 300, fontSize: 14, color: 'rgba(255,255,255,0.72)', letterSpacing: '-0.02em' }}>
                          ${c.monthly_retainer?.toLocaleString()}
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', fontFamily: F, fontWeight: 400 }}>/شهر</span>
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.26)', fontFamily: F }}>
                          ما في اشتراك محدد
                        </div>
                      )}
                    </div>
                    {c.client_workspace_id && (
                      <button
                        onClick={e => { e.stopPropagation(); switchWs(c.client_workspace_id) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '7px 14px', borderRadius: 9,
                          fontSize: 11, fontWeight: 700,
                          background: 'rgba(0,170,255,0.09)',
                          border: '1px solid rgba(77,159,255,0.22)',
                          color: '#00AAFF', cursor: 'pointer', fontFamily: F,
                          transition: 'all 0.15s', letterSpacing: '-0.01em',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(77,159,255,0.18)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,170,255,0.38)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,170,255,0.09)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(77,159,255,0.22)' }}
                      >
                        <span style={{ display: 'flex' }}>{Ic.bolt}</span>
                        انتقل
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            minHeight: '46vh', textAlign: 'center', padding: '48px',
            border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 20,
          }}>
            <div style={{
              width: 58, height: 58, borderRadius: 17,
              background: 'rgba(0,170,255,0.09)',
              border: '1px solid rgba(77,159,255,0.16)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#00AAFF', marginBottom: 22,
            }}>
              {Ic.users}
            </div>
            <h3 style={{ fontFamily: F, fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.85)', marginBottom: 10 }}>
              ما في عملاء بعد
            </h3>
            <p style={{ fontFamily: F, fontSize: 14, lineHeight: 1.8, color: 'rgba(255,255,255,0.32)', maxWidth: 380, marginBottom: 26 }}>
              أضف أول عميل وابدأ تدير براندهم، محتواهم، ومساحة عملهم — كل شيء في مكان واحد.
            </p>
            <button
              onClick={() => setShowNew(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '13px 28px', fontFamily: F, fontWeight: 700,
                fontSize: 13, letterSpacing: '-0.01em',
                background: '#00AAFF', color: '#0C0C0C',
                border: 'none', borderRadius: 12, cursor: 'pointer',
                boxShadow: '0 4px 24px rgba(77,159,255,0.40)', transition: 'all 0.18s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'none'}
            >
              <span style={{ display: 'flex' }}>{Ic.plus}</span>
              أضف أول عميل
            </button>
          </div>
        )}

        {/* الدعوات المعلقة */}
        {invites.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.09em', textTransform: 'uppercase' as const, marginBottom: 13, fontFamily: F }}>
              دعوات معلقة · {invites.length}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {invites.map(inv => (
                <div key={inv.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px',
                  background: 'rgba(255,181,71,0.04)',
                  border: '1px solid rgba(255,181,71,0.14)',
                  borderRadius: 13,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFB547', boxShadow: '0 0 6px #FFB547', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.80)', fontFamily: F, letterSpacing: '-0.01em' }}>
                      {inv.client_name}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.34)', marginTop: 3, fontFamily: F, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ display: 'flex' }}>{Ic.mail}</span>
                      {inv.client_email} · تم إرسال الدعوة
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 11px', borderRadius: 100,
                    background: 'rgba(255,181,71,0.10)', border: '1px solid rgba(255,181,71,0.24)',
                    color: '#FFB547', fontFamily: F, letterSpacing: '0.04em',
                  }}>
                    معلق
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── مودال إضافة عميل ─── */}
      {showNew && (
        <div
          dir="rtl"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(16px)', zIndex: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowNew(false) }}
        >
          <div style={{
            background: 'rgba(10,10,18,0.98)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 22, padding: '28px 26px',
            width: '100%', maxWidth: 440,
            boxShadow: '0 36px 90px rgba(0,0,0,0.88)',
            animation: 'pageUp 0.22s ease both', fontFamily: F,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 26 }}>
              <div>
                <div style={{ fontFamily: F, fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.92)', lineHeight: 1, marginBottom: 5 }}>
                  أضف عميل جديد
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: F }}>
                  سيصله إيميل دعوة للانضمام لمساحة عمله
                </div>
              </div>
              <button
                onClick={() => setShowNew(false)}
                style={{
                  width: 30, height: 30, borderRadius: 9,
                  background: 'rgba(255,255,255,0.06)', border: 'none',
                  color: 'rgba(255,255,255,0.38)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.72)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.38)'}
              >
                {Ic.close}
              </button>
            </div>

            {[
              { label: 'اسم العميل',                    val: cName,     set: setCName,     ph: 'أحمد الراشدي',      type: 'text',   req: true  },
              { label: 'الإيميل',                        val: cEmail,    set: setCEmail,    ph: 'ahmed@brand.com',   type: 'email',  req: false },
              { label: 'اسم البراند أو الشركة',          val: cBrand,    set: setCBrand,    ph: 'براند X للتسويق',   type: 'text',   req: false },
              { label: 'الاشتراك الشهري بالدولار',       val: cRetainer, set: setCRetainer, ph: '2500',              type: 'number', req: false },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 15 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.40)', marginBottom: 8, fontFamily: F }}>
                  {f.label}
                  {f.req && <span style={{ color: '#EF4444', marginRight: 4 }}>*</span>}
                </div>
                <input
                  type={f.type}
                  value={f.val}
                  onChange={e => f.set(e.target.value)}
                  placeholder={f.ph}
                  dir="rtl"
                  style={{
                    width: '100%', padding: '12px 14px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 11, color: 'rgba(255,255,255,0.88)',
                    fontSize: 13, fontFamily: F, outline: 'none',
                    transition: 'border-color 0.15s',
                    boxSizing: 'border-box' as const,
                    textAlign: 'right' as const,
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(0,170,255,0.38)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.10)'}
                />
              </div>
            ))}

            <button
              onClick={addClient}
              disabled={!cName.trim() || creating}
              style={{
                width: '100%', padding: '14px',
                fontSize: 14, fontWeight: 700, fontFamily: F,
                letterSpacing: '-0.01em',
                background: cName.trim() ? '#4D9FFF' : 'rgba(255,255,255,0.04)',
                color: cName.trim() ? '#000' : 'rgba(255,255,255,0.2)',
                border: 'none', borderRadius: 12,
                cursor: cName.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                marginTop: 10, transition: 'all 0.18s',
                boxShadow: cName.trim() ? '0 4px 22px rgba(77,159,255,0.38)' : 'none',
              }}
            >
              {creating
                ? <><div className="nexa-spinner" style={{ width: 14, height: 14 }} />يضيف العميل...</>
                : <><span style={{ display: 'flex' }}>{Ic.plus}</span>أضف العميل</>
              }
            </button>
          </div>
        </div>
      )}

      {/* ─── توست الإشعار ─── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: 24, zIndex: 9999,
          padding: '12px 20px', borderRadius: 12,
          background: toast.ok ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)',
          border: `1px solid ${toast.ok ? 'rgba(34,197,94,0.22)' : 'rgba(239,68,68,0.22)'}`,
          color: toast.ok ? '#34D399' : '#FF5757',
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
