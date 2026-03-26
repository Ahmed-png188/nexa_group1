'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Tab = 'نظرة عامة' | 'الركائز' | 'الزوايا' | 'خطة 30 يوم' | 'التوقيت' | 'المنافسون'

const F    = "'Tajawal', sans-serif"
const MONO = "'Geist Mono', monospace"

const Ic = {
  bolt:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  refresh: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  arrow:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  users:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  star:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  chart:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18"/><path d="M5 20V14l4-4 4 3 4-6 4 4v9"/></svg>,
  cal:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  clock:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  target:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  close:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
}

// ─── مكونات مشتركة ────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'rgba(0,170,255,0.70)', marginBottom: '10px', fontFamily: F }}>
      {children}
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: any }) {
  return (
    <div style={{ padding: '20px 24px', background: '#141414', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px' }}>
      <div style={{ color: 'rgba(255,255,255,0.30)', marginBottom: '12px', display: 'flex' }}>{icon}</div>
      <div style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.04em', color: '#FFFFFF', lineHeight: 1, fontFamily: MONO, marginBottom: '6px' }}>{value}</div>
      <div style={{ fontSize: '11px', color: 'rgba(0,170,255,0.65)', fontWeight: 600, fontFamily: F, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{label}</div>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div style={{ padding: '18px 20px', background: '#141414', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px' }}>
      <Label>{label}</Label>
      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.68)', lineHeight: 1.70, fontFamily: F }}>{value}</div>
    </div>
  )
}

function EmptyState({ icon, title, desc, children }: { icon: React.ReactNode; title: string; desc: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', textAlign: 'center', padding: '48px 32px', gap: '14px' }}>
      <div style={{ width: 56, height: 56, borderRadius: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.30)' }}>{icon}</div>
      <div style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.85)', fontFamily: F }}>{title}</div>
      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.75, maxWidth: '420px', fontFamily: F }}>{desc}</div>
      {children}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════
export default function StrategyPageAr() {
  const supabase = createClient()
  const router   = useRouter()

  const TABS: Tab[] = ['نظرة عامة', 'الركائز', 'الزوايا', 'خطة 30 يوم', 'التوقيت', 'المنافسون']
  const DAYS = ['إث', 'ثل', 'أر', 'خم', 'جم', 'سب', 'أح']

  const [ws,         setWs]         = useState<any>(null)
  const [strategy,   setStrategy]   = useState<any>(null)
  const [hasBrand,   setHasBrand]   = useState(false)
  const [hasCompetitor, setHasCompetitor] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [tab,        setTab]        = useState<Tab>('نظرة عامة')
  const [timingData, setTimingData] = useState<any>(null)
  const [genTiming,  setGenTiming]  = useState(false)
  const [compData,   setCompData]   = useState<any>(null)
  const [genComp,    setGenComp]    = useState(false)
  const [compInput,  setCompInput]  = useState('')
  const [expanded,   setExpanded]   = useState<number | null>(null)
  const [mounted,    setMounted]    = useState(false)
  const [hovDay,     setHovDay]     = useState<number | null>(null)

  useEffect(() => { setMounted(true); load() }, [])
  useEffect(() => {
    if (!ws || loading) return
    if (tab === 'التوقيت'   && !timingData && !genTiming) generateTiming()
    if (tab === 'المنافسون' && !compData   && !genComp)   generateComp()
  }, [tab, ws, loading])

  // ── تحميل البيانات ─────────────────────────────────────────
  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: m } = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id', user.id).limit(1).single()
    const w = (m as any)?.workspaces
    setWs(w); setCompInput(w?.brand_tone || '')
    const wsPlan = w?.plan ?? 'spark'
    const planStatus = w?.plan_status ?? 'trialing'
    const isTrial = planStatus === 'trialing'
    const trialExpired = isTrial && (new Date() > new Date(new Date(w?.created_at).getTime() + 7 * 86400000))
    setHasCompetitor(!trialExpired && ['grow','scale','agency'].includes(wsPlan))
    const { data: ba } = await supabase.from('brand_assets').select('id').eq('workspace_id', w?.id).eq('file_name', 'nexa_brand_intelligence.json').single()
    setHasBrand(!!ba)
    const { data: plan } = await supabase.from('strategy_plans').select('*').eq('workspace_id', w?.id).eq('status', 'active').order('generated_at', { ascending: false }).limit(1).single()
    if (plan) {
      setStrategy({ audience: plan.audience_map, pillars: plan.content_pillars, angles: plan.insights?.top_angles, plan: plan.daily_plan, insights: plan.insights?.key_insights })
      if (plan.platform_strategy?.timing) setTimingData(plan.platform_strategy.timing)
    }
    setLoading(false)
  }

  // ── بناء الاستراتيجية ──────────────────────────────────────
  async function generateStrategy() {
    if (!ws || generating) return; setGenerating(true)
    try {
      const r = await fetch('/api/generate-strategy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspace_id: ws.id, lang: 'ar' }) })
      const d = await r.json()
      if (d.success) {
        const { data: ba } = await supabase.from('brand_assets').select('id').eq('workspace_id', ws?.id).eq('file_name', 'nexa_brand_intelligence.json').single()
        setHasBrand(!!ba)
        const { data: plan } = await supabase.from('strategy_plans').select('*').eq('workspace_id', ws.id).eq('status', 'active').order('generated_at', { ascending: false }).limit(1).single()
        if (plan) {
          setStrategy({ audience: plan.audience_map, pillars: plan.content_pillars, angles: plan.insights?.top_angles, plan: plan.daily_plan, insights: plan.insights?.key_insights })
          if (plan.platform_strategy?.timing) setTimingData(plan.platform_strategy.timing)
        }
      }
    } catch {}
    setGenerating(false)
  }

  async function generateTiming() {
    if (!ws || genTiming) return; setGenTiming(true)
    try {
      const r = await fetch('/api/strategy-timing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspace_id: ws.id }) })
      if (r.ok) { const d = await r.json(); if (d.success) setTimingData(d.timing) }
    } catch {}
    setGenTiming(false)
  }

  async function generateComp() {
    if (!ws || genComp) return; setGenComp(true)
    try {
      const r = await fetch('/api/competitor-analysis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspace_id: ws.id, competitors: compInput, lang: 'ar' }) })
      if (r.ok) { const d = await r.json(); if (d.success) setCompData(d.analysis) }
    } catch {}
    setGenComp(false)
  }

  // ══════════════════════════════════════════════════════════
  // حالة التحميل
  // ══════════════════════════════════════════════════════════
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - var(--topbar-h))', flexDirection: 'column', gap: '14px', background: '#0C0C0C', fontFamily: F }}>
      <div className="nexa-spinner" style={{ width: 22, height: 22 }}/>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.04em' }}>لحظة...</div>
    </div>
  )

  // ══════════════════════════════════════════════════════════
  // الحالة الأولى — قبل بناء الاستراتيجية
  // ══════════════════════════════════════════════════════════
  if (!strategy && !generating) return (
    <div dir="rtl" style={{ height: 'calc(100vh - var(--topbar-h))', overflowY: 'auto', background: '#0C0C0C', fontFamily: F }}>
      <div style={{ backgroundImage: 'url(/cyan-header.png)', backgroundSize: 'cover', backgroundPosition: 'center top', padding: '56px 0 48px', position: 'relative' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 40px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* شارة */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', background: 'rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.18)', borderRadius: '100px', marginBottom: '24px' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(0,0,0,0.50)' }}/>
            <span style={{ fontSize: '11px', color: 'rgba(0,0,0,0.65)', fontWeight: 600 }}>
              الاستراتيجية · لم تُبنَ بعد
            </span>
          </div>

          {/* العنوان */}
          <h1 style={{ fontSize: '48px', fontWeight: 700, letterSpacing: '-0.04em', color: '#0A0A0A', lineHeight: 1.05, marginBottom: '16px', fontFamily: F }}>
            استراتيجيتك<br/>تنتظرك.
          </h1>

          {/* الوصف */}
          <p style={{ fontSize: '16px', color: 'rgba(0,0,0,0.55)', lineHeight: 1.7, marginBottom: '36px', fontFamily: F }}>
            Nexa تحلّل صوت براندك وعلم نفس جمهورك وأنماط كونتنتك — وتبني لك مخططاً كاملاً: ركائز، زوايا، خطة 30 يوم، وذكاء تنافسي.
          </p>

          {/* تنبيه Brand Brain */}
          {!hasBrand && (
            <div style={{ marginBottom: '20px', padding: '10px 18px', background: 'rgba(0,0,0,0.10)', border: '1px solid rgba(0,0,0,0.16)', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(0,150,0,0.70)', flexShrink: 0 }}/>
              <span style={{ fontSize: '12px', color: 'rgba(0,0,0,0.60)', fontFamily: F }}>
                تشتغل أحسن لما تدرّب Brand Brain أول.
              </span>
              <a href="/dashboard/brand" style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(0,0,80,0.75)', textDecoration: 'none', flexShrink: 0, fontFamily: F }}>
                درّب Brand Brain ←
              </a>
            </div>
          )}

          {/* زر البناء */}
          <button onClick={generateStrategy}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', background: '#0A0A0A', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, color: '#FFFFFF', cursor: 'pointer', transition: 'background 0.15s', fontFamily: F }}>
            <span style={{ display: 'flex' }}>{Ic.bolt}</span>
            ابنِ استراتيجية جديدة
          </button>
        </div>
      </div>

      {/* بطاقات ماذا ستحصل */}
      <div style={{ padding: '40px 36px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
          {[
            { icon: Ic.star,   title: 'الركائز',              desc: 'الموضوعات الأساسية التي تحدد ما تتحدث عنه ولماذا يتابعك الناس.' },
            { icon: Ic.bolt,   title: 'الزوايا الرابحة',      desc: 'الخطافات النفسية التي تجعل كونتنتك يؤدي أفضل من المتوسط.' },
            { icon: Ic.cal,    title: 'خطة 30 يوم',           desc: 'تقويم كونتنت يومي كامل مع زوايا وأهداف وتوجيه للمنصات.' },
            { icon: Ic.clock,  title: 'أفضل أوقات النشر',     desc: 'النوافذ الزمنية التي يكون فيها جمهورك أكثر تقبّلاً.' },
            { icon: Ic.target, title: 'ذكاء المنافسين',       desc: 'أين المنافسون ضعفاء والمساحة البيضاء التي يمكنك امتلاكها.' },
            { icon: Ic.chart,  title: 'خريطة الجمهور',        desc: 'بيانات نفسية عميقة عن من تخاطب وما يحرّكه.' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '20px', background: '#141414', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}>
              <div style={{ color: 'rgba(255,255,255,0.30)', marginBottom: '12px', display: 'flex' }}>{item.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.80)', marginBottom: '6px', fontFamily: F }}>{item.title}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, fontFamily: F }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ══════════════════════════════════════════════════════════
  // حالة البناء — شاشة التحميل
  // ══════════════════════════════════════════════════════════
  if (generating) return (
    <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - var(--topbar-h))', gap: '16px', textAlign: 'center', padding: '40px', background: '#0C0C0C', fontFamily: F }}>
      <div style={{ width: 52, height: 52, borderRadius: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.30)' }}>{Ic.star}</div>
      <div style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.03em', color: 'rgba(255,255,255,0.88)', fontFamily: F }}>
        Nexa تبني استراتيجيتك...
      </div>
      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, maxWidth: '360px', fontFamily: F }}>
        تحلّل براندك وجمهورك وأنماط كونتنتك.<br/>هذا يأخذ نحو 30 ثانية.
      </div>
      <div style={{ display: 'flex', gap: '5px', marginTop: '8px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#00AAFF', animation: `pulse-dot 1.4s ease-in-out ${i * 0.2}s infinite` }}/>
        ))}
      </div>
    </div>
  )

  // ── مساعدات البيانات ───────────────────────────────────────
  const aud      = strategy?.audience ?? {}
  const pillars  = Array.isArray(strategy?.pillars) ? strategy.pillars : Object.entries(strategy?.pillars ?? {}).map(([k, v]: any) => ({ name: k, description: String(v) }))
  const angles   = Array.isArray(strategy?.angles)  ? strategy.angles  : Object.entries(strategy?.angles  ?? {}).map(([k, v]: any) => ({ title: k, why: String(v) }))
  const planDays = Array.isArray(strategy?.plan)    ? strategy.plan    : []
  const insights = strategy?.insights ?? []

  // ── ترجمة مفاتيح الجمهور ──────────────────────────────────
  function translateKey(k: string): string {
    return k
      .replace(/_/g, ' ')
      .replace(/core desire/i,       'الرغبة الجوهرية')
      .replace(/core fear/i,         'الخوف الجوهري')
      .replace(/identity/i,          'الهوية')
      .replace(/content they love/i, 'المحتوى الذي يحبونه')
      .replace(/content they hate/i, 'المحتوى الذي يكرهونه')
      .replace(/trigger words/i,     'الكلمات المحفزة')
      .replace(/pain points/i,       'نقاط الألم')
      .replace(/motivations/i,       'الدوافع')
      .replace(/psychographics/i,    'السيكوغرافيك')
      .replace(/primary/i,           'الجمهور الأساسي')
  }

  // ══════════════════════════════════════════════════════════
  // الواجهة الكاملة — الاستراتيجية جاهزة
  // ══════════════════════════════════════════════════════════
  return (
    <div dir="rtl" style={{ height: 'calc(100vh - var(--topbar-h))', overflowY: 'auto', background: '#0C0C0C', fontFamily: F }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .s-scroll::-webkit-scrollbar { display:none }
        @keyframes sUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .s-in { animation: sUp 0.35s cubic-bezier(0.22,1,0.36,1) both }
        .day-cell { border:1px solid rgba(255,255,255,0.08); border-radius:10px; cursor:pointer; transition:all 0.15s }
        .day-cell:hover { background:rgba(255,255,255,0.05)!important; border-color:rgba(255,255,255,0.16)!important }
        .comp-card:hover { border-color:rgba(255,255,255,0.18)!important; background:rgba(255,255,255,0.04)!important }
        @keyframes pulse-dot { 0%,80%,100%{transform:scale(0.6);opacity:0.3} 40%{transform:scale(1);opacity:1} }
      `}}/>

      {/* ── رأس الصفحة ─────────────────────────────────────── */}
      <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.4s ease' }}>
        <div style={{ backgroundImage: 'url(/cyan-header.png)', backgroundSize: 'cover', backgroundPosition: 'center top', padding: '40px 0 28px' }}>
          <div style={{ padding: '0 36px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px' }}>
            <div>
              <h1 style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-0.04em', color: '#0A0A0A', lineHeight: 1, marginBottom: '8px', fontFamily: F }}>الاستراتيجية</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(0,150,0,0.70)' }}/>
                <span style={{ fontSize: '13px', color: 'rgba(0,0,0,0.60)', fontWeight: 500, fontFamily: F }}>
                  {pillars.length} ركيزة · {angles.length} زاوية · {planDays.length} يوم مخطط
                </span>
              </div>
            </div>
            <button onClick={generateStrategy} disabled={generating}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 18px', background: 'rgba(0,0,0,0.14)', border: '1px solid rgba(0,0,0,0.22)', borderRadius: '10px', fontSize: '12px', fontWeight: 600, color: 'rgba(0,0,0,0.72)', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0, fontFamily: F }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.22)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.14)'}>
              <span style={{ display: 'flex' }}>{Ic.refresh}</span>
              أعد البناء
            </button>
          </div>
        </div>

        {/* شريط التبويبات */}
        <div style={{ background: '#141414', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ padding: '0 36px', display: 'flex' }}>
            {TABS.map(t => {
              const active = tab === t
              return (
                <button key={t} onClick={() => setTab(t)}
                  style={{ display: 'flex', alignItems: 'center', padding: '12px 18px', background: 'none', border: 'none', borderBottom: `2px solid ${active ? '#00AAFF' : 'transparent'}`, marginBottom: '-1px', color: active ? '#FFFFFF' : 'rgba(255,255,255,0.42)', cursor: 'pointer', fontFamily: F, fontSize: '13px', fontWeight: active ? 600 : 400, transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.72)' }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.42)' }}>
                  {t}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* صف الإحصاءات */}
      <div style={{ padding: '28px 36px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '28px' }}>
          <StatCard icon={Ic.users} label="رؤى الجمهور"    value={Object.keys(aud).length || '—'}/>
          <StatCard icon={Ic.star}  label="الركائز"         value={pillars.length          || '—'}/>
          <StatCard icon={Ic.bolt}  label="الزوايا الرابحة" value={angles.length           || '—'}/>
          <StatCard icon={Ic.cal}   label="أيام مخططة"      value={planDays.length         || '—'}/>
        </div>
      </div>

      {/* محتوى التبويبات */}
      <div style={{ padding: '0 36px 48px' }}>

        {/* ════ نظرة عامة ════ */}
        {tab === 'نظرة عامة' && (
          <div className="s-in">
            {insights.length > 0 && (
              <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px', padding: '24px', marginBottom: '16px' }}>
                <Label>إيش لقت Nexa</Label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {insights.map((ins: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                      <div style={{ width: 22, height: 22, borderRadius: '6px', background: 'rgba(0,170,255,0.10)', border: '1px solid rgba(0,170,255,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#00AAFF', fontFamily: MONO }}>{i + 1}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.70)', lineHeight: 1.72, fontFamily: F }}>{ins}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
              {Object.entries(aud).slice(0, 6).map(([k, v]: any) => (
                <InfoCard key={k} label={translateKey(k)} value={typeof v === 'string' ? v : Array.isArray(v) ? v.join('، ') : JSON.stringify(v)}/>
              ))}
            </div>
            {Object.keys(aud).length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px', color: 'rgba(255,255,255,0.25)', fontSize: '13px', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '10px', fontFamily: F }}>
                ما في بيانات جمهور. أعد بناء الاستراتيجية.
              </div>
            )}
          </div>
        )}

        {/* ════ الركائز ════ */}
        {tab === 'الركائز' && (
          <div className="s-in">
            {pillars.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
                {pillars.map((p: any, i: number) => {
                  const name    = typeof p === 'string' ? p : (p.name || p.pillar || `ركيزة ${i + 1}`)
                  const desc    = typeof p === 'string' ? '' : (p.description || p.purpose || '')
                  const topics  = p.topics  || []
                  const freq    = p.frequency || ''
                  const example = p.example_angle || ''
                  return (
                    <div key={i} style={{ padding: '22px', background: '#141414', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px', transition: 'border-color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.20)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.10)'}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(0,170,255,0.10)', border: '1px solid rgba(0,170,255,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#00AAFF', flexShrink: 0, fontFamily: MONO }}>{i + 1}</div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.02em', fontFamily: F, lineHeight: 1.2 }}>{name}</div>
                      </div>
                      {desc && <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.70, marginBottom: (topics.length || freq || example) ? '14px' : '0', fontFamily: F }}>{desc}</p>}
                      {freq && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.30)', fontWeight: 500, marginBottom: topics.length ? '10px' : '0', fontFamily: F }}>{freq}</div>}
                      {example && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.30)', fontStyle: 'italic', marginBottom: topics.length ? '10px' : '0', fontFamily: F }}>مثال: "{example}"</div>}
                      {topics.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {topics.slice(0, 4).map((topicItem: string, j: number) => (
                            <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.30)', flexShrink: 0, marginTop: '6px' }}/>
                              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.50)', fontFamily: F }}>{topicItem}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px', color: 'rgba(255,255,255,0.25)', fontSize: '13px', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '10px', fontFamily: F }}>
                ما في ركائز بعد. أعد بناء الاستراتيجية.
              </div>
            )}
          </div>
        )}

        {/* ════ الزوايا ════ */}
        {tab === 'الزوايا' && (
          <div className="s-in">
            {angles.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px' }}>
                {angles.map((a: any, i: number) => {
                  const title = typeof a === 'string' ? a : (a.angle || a.title || `زاوية ${i + 1}`)
                  const hook  = a.example_hook || a.hook || ''
                  const why   = a.why_it_works || a.why  || a.description || ''
                  return (
                    <div key={i} style={{ padding: '22px', background: '#141414', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px', transition: 'border-color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.20)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.10)'}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: (hook || why) ? '16px' : '0' }}>
                        <div style={{ width: 26, height: 26, borderRadius: '7px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.50)', flexShrink: 0, fontFamily: MONO }}>{i + 1}</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.4, fontFamily: F }}>{title}</div>
                      </div>
                      {hook && (
                        <div style={{ padding: '12px 14px', background: 'rgba(0,170,255,0.04)', border: '1px solid rgba(0,170,255,0.12)', borderRight: '3px solid rgba(0,170,255,0.40)', borderRadius: '8px 0 0 8px', marginBottom: '10px' }}>
                          <div style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(0,170,255,0.80)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '5px', fontFamily: F }}>الهوك</div>
                          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.78)', lineHeight: 1.65, fontStyle: 'italic', fontFamily: F }}>"{hook}"</div>
                        </div>
                      )}
                      {why && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.40)', lineHeight: 1.70, fontFamily: F }}>{why}</div>}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px', color: 'rgba(255,255,255,0.25)', fontSize: '13px', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '10px', fontFamily: F }}>
                ما في زوايا بعد. أعد بناء الاستراتيجية.
              </div>
            )}
          </div>
        )}

        {/* ════ خطة 30 يوم ════ */}
        {tab === 'خطة 30 يوم' && (
          <div className="s-in">
            {planDays.length > 0 ? (
              <>
                {/* شبكة التقويم */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '6px', marginBottom: '16px' }}>
                  {DAYS.map(d => (
                    <div key={d} style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.20)', textAlign: 'center', padding: '0 0 8px', letterSpacing: '0.04em', fontFamily: F }}>{d}</div>
                  ))}
                  {planDays.map((day: any, i: number) => {
                    const num    = day.day || i + 1
                    const theme  = day.theme || day.topic || ''
                    const plat   = day.platform || ''
                    const isOpen = expanded === num
                    return (
                      <div key={i}
                        onClick={() => setExpanded(isOpen ? null : num)}
                        onMouseEnter={() => setHovDay(num)}
                        onMouseLeave={() => setHovDay(null)}
                        className="day-cell"
                        style={{ padding: '10px 9px', background: isOpen ? 'rgba(0,170,255,0.08)' : 'rgba(255,255,255,0.02)', borderColor: isOpen ? 'rgba(0,170,255,0.30)' : 'rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden' }}>
                        {isOpen && <div style={{ position: 'absolute', top: 0, right: 0, left: 0, height: '2px', background: '#00AAFF' }}/>}
                        <div style={{ fontFamily: MONO, fontSize: '12px', fontWeight: 400, color: isOpen ? '#00AAFF' : 'rgba(255,255,255,0.50)', lineHeight: 1, marginBottom: '5px' }}>
                          {String(num).padStart(2, '0')}
                        </div>
                        {plat && <div style={{ fontSize: '8px', fontWeight: 700, color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px', fontFamily: F }}>{plat.slice(0, 3)}</div>}
                        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.30)', lineHeight: 1.45, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, fontFamily: F }}>{theme}</div>
                        {hovDay === num && !isOpen && (
                          <button
                            onClick={e => { e.stopPropagation(); router.push(`/dashboard/studio?strategy_day=${num}&angle=${encodeURIComponent(day.angle || day.theme || theme)}`) }}
                            style={{ position: 'absolute', bottom: '5px', left: '5px', padding: '2px 7px', borderRadius: '5px', fontSize: '9px', fontWeight: 700, background: '#FFFFFF', color: '#0C0C0C', border: 'none', cursor: 'pointer', fontFamily: F }}>
                            أنشئ
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* تفاصيل اليوم المختار */}
                {expanded !== null && (() => {
                  const day = planDays.find((d: any) => (d.day || (planDays.indexOf(d) + 1)) === expanded)
                  if (!day) return null
                  return (
                    <div style={{ padding: '24px 28px', background: '#141414', border: '1px solid rgba(0,170,255,0.20)', borderTop: '3px solid #00AAFF', borderRadius: '10px', animation: 'sUp 0.2s ease both' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.30)', marginBottom: '4px', fontFamily: F }}>
                            {day.platform ? `${day.platform} · ` : ''}الأسبوع {Math.ceil(expanded / 7)}
                          </div>
                          <div style={{ fontSize: '32px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.05em', lineHeight: 1, fontFamily: MONO, marginBottom: '4px' }}>
                            يوم {String(expanded).padStart(2, '0')}
                          </div>
                          {day.theme && <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.50)', fontFamily: F }}>{day.theme}</div>}
                        </div>
                        <button onClick={() => setExpanded(null)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '7px', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', display: 'flex', padding: '6px', transition: 'all 0.15s' }}>
                          {Ic.close}
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                        {day.angle && (
                          <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', gridColumn: day.angle.length > 60 ? 'span 2' : 'span 1' }}>
                            <Label>الزاوية</Label>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, fontFamily: F }}>{day.angle}</div>
                          </div>
                        )}
                        {day.goal && (
                          <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}>
                            <Label>الهدف</Label>
                            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, fontFamily: F }}>{day.goal}</div>
                          </div>
                        )}
                        {(day.content || day.description) && (
                          <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', gridColumn: 'span 2' }}>
                            <Label>إيش تنشئ</Label>
                            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, fontFamily: F }}>{day.content || day.description}</div>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => router.push(`/dashboard/studio?strategy_day=${expanded}&angle=${encodeURIComponent(day.angle || day.theme || '')}`)}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', background: '#FFFFFF', color: '#0C0C0C', borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: F, transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.88)'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#FFFFFF'}>
                          أنشئ في الاستوديو <span style={{ display: 'flex' }}>{Ic.arrow}</span>
                        </button>
                        <button onClick={() => router.push(`/dashboard/studio?strategy_day=${expanded}&angle=${encodeURIComponent(day.angle || day.theme || '')}&format=reel`)}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', background: 'transparent', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.50)', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: F, transition: 'all 0.15s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.22)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.80)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.10)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.50)' }}>
                          اعمل ريلز
                        </button>
                      </div>
                    </div>
                  )
                })()}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px', color: 'rgba(255,255,255,0.25)', fontSize: '13px', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '10px', fontFamily: F }}>
                ما في خطة 30 يوم بعد. أعد بناء الاستراتيجية.
              </div>
            )}
          </div>
        )}

        {/* ════ التوقيت ════ */}
        {tab === 'التوقيت' && (
          <div className="s-in">
            {!timingData ? (
              <EmptyState
                icon={Ic.clock}
                title="محرّك التوقيت"
                desc="Nexa تحلّل جدول جمهورك اليومي وتجد اللحظات التي يكونون فيها أكثر تقبّلاً لكونتنتك.">
                <button onClick={generateTiming} disabled={genTiming}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: genTiming ? 'rgba(255,255,255,0.06)' : '#FFFFFF', color: genTiming ? 'rgba(255,255,255,0.25)' : '#0C0C0C', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: genTiming ? 'not-allowed' : 'pointer', fontFamily: F, transition: 'background 0.15s' }}>
                  {genTiming
                    ? <><div className="nexa-spinner" style={{ width: 13, height: 13 }}/>Nexa تحلّل...</>
                    : <><span style={{ display: 'flex' }}>{Ic.clock}</span>خرّط أوقات نشري</>}
                </button>
              </EmptyState>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {timingData.analysis && (
                  <div style={{ padding: '20px 24px', background: '#141414', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px' }}>
                    <Label>لماذا هذه الأوقات تشتغل</Label>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.72, fontFamily: F }}>{timingData.analysis}</div>
                  </div>
                )}
                {timingData.platforms && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
                    {Object.entries(timingData.platforms).map(([pl, data]: any) => (
                      <div key={pl} style={{ padding: '20px', background: '#141414', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(0,170,255,0.80)', marginBottom: '14px', textTransform: 'capitalize', letterSpacing: '-0.01em', fontFamily: F }}>{pl}</div>
                        {data.best_times?.map((s: any, i: number) => (
                          <div key={i} style={{ display: 'flex', gap: '12px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '6px' }}>
                            <div style={{ flexShrink: 0 }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF', fontFamily: MONO }}>{s.time}</div>
                              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', marginTop: '1px', fontFamily: F }}>{s.day_type}</div>
                            </div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.40)', lineHeight: 1.55, flex: 1, fontFamily: F }}>{s.reason}</div>
                          </div>
                        ))}
                        {data.frequency && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', marginTop: '8px', fontFamily: F }}>{data.frequency}</div>}
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={generateTiming}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: 500, background: 'transparent', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.40)', borderRadius: '8px', cursor: 'pointer', fontFamily: F, transition: 'all 0.15s', alignSelf: 'flex-start' as const }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.22)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.70)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.10)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.40)' }}>
                  <span style={{ display: 'flex' }}>{Ic.refresh}</span>أعد التحليل
                </button>
              </div>
            )}
          </div>
        )}

        {/* ════ المنافسون ════ */}
        {tab === 'المنافسون' && (
          <div className="s-in">
            {!hasCompetitor ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
                <div style={{ maxWidth:440, textAlign:'center', padding:'0 24px' }}>
                  <div style={{ width:52, height:52, borderRadius:14, background:'rgba(0,170,255,0.08)', border:'1px solid rgba(0,170,255,0.20)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', color:'var(--cyan)' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/><path d="M11 7v4M11 15h.01" opacity=".6"/></svg>
                  </div>
                  <div style={{ fontSize:19, fontWeight:700, color:'var(--text-1)', marginBottom:8, fontFamily:F }}>تحليل المنافسين — Grow+</div>
                  <div style={{ fontSize:13, color:'var(--text-3)', lineHeight:1.85, marginBottom:24, fontFamily:F }}>
                    Nexa ترسم المشهد التنافسي — من يملك أي تموضع، وأين الفجوات، وكيف تتميّز. متاح من خطة Grow (٨٩$/شهر).
                  </div>
                  <a href="/dashboard/settings?tab=billing" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'11px 24px', background:'var(--cyan)', color:'#000', borderRadius:10, fontWeight:700, fontSize:13, textDecoration:'none', fontFamily:F }}>
                    طوّر إلى Grow ←
                  </a>
                  <div style={{ marginTop:12, fontSize:11, color:'var(--text-4)', fontFamily:F }}>إلغاء في أي وقت</div>
                </div>
              </div>
            ) : !compData ? (
              <EmptyState
                icon={Ic.target}
                title="ذكاء المنافسين"
                desc="Nexa ترسم المشهد التنافسي — من يملك أي تموضع، وأين الفجوات، وكيف تتميّز بطريقة لا يتحدث عنها أحد.">
                <div style={{ width: '100%', maxWidth: '480px', marginBottom: '16px', textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.30)', marginBottom: '8px', fontFamily: F }}>
                    مين منافسيك؟ <span style={{ color: 'rgba(255,255,255,0.18)' }}>(اختياري)</span>
                  </div>
                  <textarea value={compInput} onChange={e => setCompInput(e.target.value)} rows={3}
                    placeholder="مثلاً: Buffer، Hootsuite، Later — أو صف مجالك"
                    style={{ width: '100%', padding: '12px 14px', fontSize: '13px', fontFamily: F, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px', color: 'rgba(255,255,255,0.80)', outline: 'none', resize: 'vertical', lineHeight: 1.65, transition: 'border-color 0.15s', boxSizing: 'border-box' as const, direction: 'rtl' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.25)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.10)'}
                  />
                </div>
                <button onClick={generateComp} disabled={genComp}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: genComp ? 'rgba(255,255,255,0.06)' : '#FFFFFF', color: genComp ? 'rgba(255,255,255,0.25)' : '#0C0C0C', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: genComp ? 'not-allowed' : 'pointer', fontFamily: F, transition: 'background 0.15s' }}>
                  {genComp
                    ? <><div className="nexa-spinner" style={{ width: 13, height: 13 }}/>Nexa تحلّل...</>
                    : <><span style={{ display: 'flex' }}>{Ic.target}</span>شغّل تحليل المنافسين</>}
                </button>
              </EmptyState>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {compData.market_position && (
                  <div style={{ padding: '20px 24px', background: '#141414', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px' }}>
                    <Label>مكانتك في السوق</Label>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.68)', lineHeight: 1.72, fontFamily: F }}>{compData.market_position}</div>
                  </div>
                )}
                {compData.differentiation_strategy?.positioning_statement && (
                  <div style={{ padding: '22px 26px', background: '#141414', border: '1px solid rgba(255,255,255,0.10)', borderRight: '3px solid #00AAFF', borderRadius: '10px 0 0 10px' }}>
                    <Label>تموضعك</Label>
                    <div style={{ fontSize: '17px', fontWeight: 600, color: 'rgba(255,255,255,0.88)', lineHeight: 1.55, fontFamily: F, letterSpacing: '-0.02em' }}>
                      "{compData.differentiation_strategy.positioning_statement}"
                    </div>
                  </div>
                )}
                {compData.white_space?.length > 0 && (
                  <div>
                    <Label>الفرص غير المستغلة</Label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginTop: '10px' }}>
                      {compData.white_space.map((w: any, i: number) => (
                        <div key={i} className="comp-card" style={{ padding: '18px', background: '#141414', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px', transition: 'all 0.15s' }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: '6px', fontFamily: F }}>{w.opportunity}</div>
                          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '12px', lineHeight: 1.6, fontFamily: F }}>{w.why_nobody_owns_it}</div>
                          <div style={{ fontSize: '12px', color: '#00AAFF', fontWeight: 500, fontFamily: F }}>← {w.how_to_claim_it}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {compData.winning_angles?.length > 0 && (
                  <div>
                    <Label>الزوايا التي يفوّتها المنافسون</Label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px', marginTop: '10px' }}>
                      {compData.winning_angles.map((a: any, i: number) => (
                        <div key={i} style={{ padding: '18px', background: '#141414', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px', transition: 'border-color 0.15s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.20)'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.10)'}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: '8px', fontFamily: F }}>{a.angle}</div>
                          {a.example_hook && <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', fontStyle: 'italic', lineHeight: 1.65, marginBottom: '8px', fontFamily: F }}>"{a.example_hook}"</div>}
                          {a.why_it_wins  && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, fontFamily: F }}>{a.why_it_wins}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {compData.competitors?.length > 0 && (
                  <div>
                    <Label>تحليل المنافسين</Label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginTop: '10px' }}>
                      {compData.competitors.map((comp: any, i: number) => (
                        <div key={i} style={{ padding: '18px', background: '#141414', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: '14px', fontFamily: F, letterSpacing: '-0.01em' }}>{comp.name}</div>
                          {comp.strengths?.length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontSize: '9px', fontWeight: 700, color: '#22C55E', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px', fontFamily: F }}>نقاط القوة</div>
                              {comp.strengths.slice(0, 2).map((s: string, j: number) => (
                                <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', marginBottom: '4px' }}>
                                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#22C55E', flexShrink: 0, marginTop: '6px' }}/>
                                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontFamily: F }}>{s}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          {comp.weaknesses?.length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontSize: '9px', fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px', fontFamily: F }}>نقاط الضعف</div>
                              {comp.weaknesses.slice(0, 2).map((w: string, j: number) => (
                                <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', marginBottom: '4px' }}>
                                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#EF4444', flexShrink: 0, marginTop: '6px' }}/>
                                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontFamily: F }}>{w}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          {comp.differentiation_opportunity && (
                            <div style={{ padding: '9px 12px', background: 'rgba(0,170,255,0.06)', border: '1px solid rgba(0,170,255,0.15)', borderRadius: '7px', fontSize: '11px', color: '#00AAFF', lineHeight: 1.55, fontFamily: F }}>
                              ميزتك: {comp.differentiation_opportunity}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={generateComp}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: 500, background: 'transparent', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.40)', borderRadius: '8px', cursor: 'pointer', fontFamily: F, transition: 'all 0.15s', alignSelf: 'flex-start' as const }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.22)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.70)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.10)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.40)' }}>
                  <span style={{ display: 'flex' }}>{Ic.refresh}</span>أعد التحليل
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
