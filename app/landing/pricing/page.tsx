'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLang } from '@/lib/language-context'
import { useAdminConfig, applyDiscount, type PlanConfig } from '@/lib/use-admin-config'
import PromoBanner from '@/components/PromoBanner'

/* ─── design tokens ─── */
const DISPLAY = "'Bricolage Grotesque', sans-serif"
const MONO    = "'Geist Mono', monospace"
const SANS    = "'DM Sans', sans-serif"
const AR      = "'Tajawal', system-ui, sans-serif"
const SERIF   = "'Instrument Serif', serif"
const CYAN    = '#00AAFF'
const LINE    = 'rgba(255,255,255,0.07)'
const LINE2   = 'rgba(255,255,255,0.12)'
const T1 = '#FFFFFF'
const T2 = 'rgba(255,255,255,0.65)'
const T3 = 'rgba(255,255,255,0.35)'
const T4 = 'rgba(255,255,255,0.18)'
const SUCCESS = '#22C55E'

/* ─── Static feature comparison rows (stays hardcoded — UI copy only) ─── */
const ROWS_EN = [
  { cat:'Credits',      label:'Monthly credits',                keys:['credits'] },
  { cat:'Credits',      label:'Free trial',                     keys:['trial_credits'] },
  { cat:'Brand',        label:'Brand Brain — voice training',   keys:['brand_brain'] },
  { cat:'Brand',        label:'Text, image, video, voice gen',  keys:['copy_generation'] },
  { cat:'Brand',        label:'Nexa AI chat — unlimited',       keys:['ai_chat'] },
  { cat:'Content',      label:'Morning brief',                  keys:['morning_brief'] },
  { cat:'Content',      label:'Strategy & 30-day content plan', keys:['strategy'] },
  { cat:'Content',      label:'Lead capture page',              keys:['lead_page'] },
  { cat:'Publishing',   label:'Social platforms',               keys:['schedule_platforms'] },
  { cat:'Publishing',   label:'Scheduled posts / month',        keys:['schedule_posts_mo'] },
  { cat:'Analytics',    label:'Analytics',                      keys:['insights_basic'] },
  { cat:'Analytics',    label:'Competitor analysis',            keys:['competitor_analysis'] },
  { cat:'Analytics',    label:'Performance learning',           keys:['performance_learning'] },
  { cat:'Email',        label:'Email sequences',                keys:['email_sequences'] },
  { cat:'Email',        label:'Contacts',                       keys:['contacts_limit'] },
  { cat:'Email',        label:'Emails per month',               keys:['emails_per_month'] },
  { cat:'Email',        label:'Behavioral triggers',            keys:['behavioral_triggers'] },
  { cat:'Email',        label:'A/B testing',                    keys:['ab_testing'] },
  { cat:'Ads',          label:'Amplify — Meta Ads',             keys:['amplify'] },
  { cat:'Ads',          label:'AI ad performance monitor',      keys:['amplify_ai_monitor'] },
  { cat:'Branding',     label:'Remove Nexa branding',           keys:['lead_remove_branding'] },
  { cat:'Branding',     label:'Custom sender domain',           keys:['custom_sender_domain'] },
  { cat:'Agency',       label:'Client workspaces',              keys:['agency_mode'] },
  { cat:'Integrations', label:'Kit / ConvertKit',               keys:['kit_integration'] },
  { cat:'Integrations', label:'Zapier / custom webhooks',       keys:['custom_webhooks'] },
  { cat:'Team',         label:'Team members',                   keys:['team_members'] },
  { cat:'Support',      label:'Support',                        keys:['support'] },
]

const ROWS_AR = [
  { cat:'الأرصدة',    label:'الأرصدة الشهرية',              keys:['credits'] },
  { cat:'الأرصدة',    label:'التجربة المجانية',             keys:['trial_credits'] },
  { cat:'العلامة',    label:'Brand Brain — نمذجة الصوت',   keys:['brand_brain'] },
  { cat:'العلامة',    label:'نص، صورة، فيديو، صوت',        keys:['copy_generation'] },
  { cat:'العلامة',    label:'Nexa AI محادثة غير محدودة',   keys:['ai_chat'] },
  { cat:'المحتوى',    label:'البريف الصباحي',               keys:['morning_brief'] },
  { cat:'المحتوى',    label:'استراتيجية وخطة ٣٠ يوم',      keys:['strategy'] },
  { cat:'المحتوى',    label:'صفحة استقطاب العملاء',         keys:['lead_page'] },
  { cat:'النشر',      label:'المنصات الاجتماعية',           keys:['schedule_platforms'] },
  { cat:'النشر',      label:'المنشورات المجدولة / شهر',     keys:['schedule_posts_mo'] },
  { cat:'التحليل',    label:'التحليلات',                    keys:['insights_basic'] },
  { cat:'التحليل',    label:'تحليل المنافسين',              keys:['competitor_analysis'] },
  { cat:'التحليل',    label:'التعلم من الأداء',             keys:['performance_learning'] },
  { cat:'الإيميل',    label:'سيكوانسات الإيميل',            keys:['email_sequences'] },
  { cat:'الإيميل',    label:'جهات الاتصال',                 keys:['contacts_limit'] },
  { cat:'الإيميل',    label:'إيميلات شهرياً',               keys:['emails_per_month'] },
  { cat:'الإيميل',    label:'المحفزات السلوكية',            keys:['behavioral_triggers'] },
  { cat:'الإيميل',    label:'اختبار A/B',                   keys:['ab_testing'] },
  { cat:'الإعلانات',  label:'Amplify — إعلانات Meta',      keys:['amplify'] },
  { cat:'الإعلانات',  label:'مراقبة الإعلانات بـ AI',      keys:['amplify_ai_monitor'] },
  { cat:'العلامة',    label:'إزالة شعار Nexa',              keys:['lead_remove_branding'] },
  { cat:'العلامة',    label:'نطاق الإرسال الخاص',           keys:['custom_sender_domain'] },
  { cat:'الوكالة',    label:'مساحات عمل العملاء',           keys:['agency_mode'] },
  { cat:'التكاملات',  label:'Kit / ConvertKit',             keys:['kit_integration'] },
  { cat:'التكاملات',  label:'Zapier / Webhooks',            keys:['custom_webhooks'] },
  { cat:'الفريق',     label:'أعضاء الفريق',                 keys:['team_members'] },
  { cat:'الدعم',      label:'الدعم الفني',                  keys:['support'] },
]

const FAQS_EN = [
  { q:'What is a credit?', a:'Credits power all AI generation. A text post costs 3 credits, an image costs 5, a short video costs 20, and voice generation costs 5–20 depending on length. Chat, strategy, scheduling, and analytics are always free.' },
  { q:'Can I switch plans anytime?', a:'Yes. Upgrade or downgrade whenever you want. Upgrades take effect immediately. Downgrades apply at the next billing cycle. No contracts, no lock-in.' },
  { q:"Do unused credits roll over?", a:"No. Credits reset monthly with your billing cycle. Most active users find they don't come close to their limit." },
  { q:'Is there a free trial?', a:'Spark plan users get 150 credits free when they sign up — no credit card required.' },
  { q:'What happens if I run out of credits?', a:'You can top up credits at any time from your settings page. We never cut off access mid-campaign.' },
  { q:'How does the Agency plan work?', a:'Each client gets their own isolated workspace with a dedicated Brand Brain. You manage everything from one master dashboard.' },
  { q:'Is there a money-back guarantee?', a:'Yes. All paid plans include a 7-day money-back guarantee on your first payment.' },
]

const FAQS_AR = [
  { q:'إيش هو الرصيد؟', a:'الأرصدة تشغّل كل إنتاج بالذكاء الاصطناعي. المنشور ٣ أرصدة، الصورة ٥، الفيديو ٢٠، الصوت ٥–٢٠. المحادثة والاستراتيجية والجدولة مجانية دايماً.' },
  { q:'هل أقدر أغيّر خطتي في أي وقت؟', a:'أيوه. رفّع أو خفّض متى تبي. الترقية تسري فوراً. التخفيض يطبّق في دورة الفوترة الجاية.' },
  { q:'هل الأرصدة غير المستخدمة تترحّل؟', a:'لا. الأرصدة تتجدد شهرياً مع دورة فوترتك.' },
  { q:'هل في تجربة مجانية؟', a:'مستخدمو Spark يحصلون على ١٥٠ رصيد مجاناً عند التسجيل — بدون بطاقة ائتمانية.' },
  { q:'إيش يصير لو خلصت أرصدتي؟', a:'تقدر تشحن أرصدة في أي وقت من صفحة الإعدادات. ما نقطع الوصول أبداً.' },
  { q:'كيف تشتغل خطة الوكالة؟', a:'كل عميل مساحة عمل معزولة بـ Brand Brain مخصص. تدير كل شيء من لوحة تحكم واحدة.' },
  { q:'هل في ضمان استرداد؟', a:'أيوه. ضمان ٧ أيام على أول دفعة. نرد المبلغ كاملاً بدون أسئلة.' },
]

/* ─── Helpers ─── */
function formatFeatureValue(key: string, val: any, isAr: boolean): string | boolean {
  if (val === true)  return true
  if (val === false || val === 0 || val === null) return false
  if (typeof val === 'string') return val

  // Numeric fields
  if (key === 'credits')          return `${Number(val).toLocaleString()} cr`
  if (key === 'trial_credits')    return val > 0 ? (isAr ? `${val} رصيد مجاناً` : `${val} credits free`) : false
  if (key === 'schedule_platforms') return val >= 9999 ? (isAr ? 'غير محدود' : 'Unlimited') : `${val}`
  if (key === 'schedule_posts_mo')  return val >= 9999 ? (isAr ? 'غير محدود' : 'Unlimited') : `${val}`
  if (key === 'contacts_limit')     return val >= 9999999 ? (isAr ? 'غير محدود' : 'Unlimited') : val > 0 ? Number(val).toLocaleString() : false
  if (key === 'emails_per_month')   return val > 0 ? Number(val).toLocaleString() : false
  if (key === 'team_members')       return `${val}`
  if (key === 'email_sequences')    return val === true ? true : val > 0 ? `${val} ${isAr ? 'نشطة' : 'active'}` : false
  if (key === 'insights_basic')     return val === true ? (isAr ? 'أساسية' : 'Basic') : false
  if (key === 'support')            return val || (isAr ? 'إيميل' : 'Email')
  if (key === 'morning_brief')      return val === true ? true : false

  return val ? true : false
}

function Check({ color = CYAN }: { color?: string }) {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
}
function Cross() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.12 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useReveal()
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(32px)', transition: `opacity 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms` }}>
      {children}
    </div>
  )
}

/* ─── Discount tag on plan card ─── */
function DiscountTag({ plan, activeCodes, isAr }: { plan: PlanConfig; activeCodes: any[]; isAr: boolean }) {
  const code = activeCodes.find(c => c.plan === 'all' || c.plan === plan.id)
  if (!code) return null
  const label = code.type === 'percent' ? `${code.value}% ${isAr ? 'خصم' : 'OFF'}` : `$${code.value} ${isAr ? 'خصم' : 'OFF'}`
  return (
    <div style={{ position: 'absolute', top: 12, right: 12, background: SUCCESS, color: '#000', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 5, letterSpacing: '0.08em', fontFamily: MONO }}>
      {label}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════ */
export default function PricingPage() {
  const { lang, setLang, isArabic } = useLang()
  const isAr = isArabic
  const F    = isAr ? AR : SANS
  const H    = isAr ? AR : DISPLAY
  const dir  = isAr ? 'rtl' : 'ltr'

  const { plans, activeCodes, loading } = useAdminConfig()

  const [scrolled,  setScrolled]  = useState(false)
  const [mounted,   setMounted]   = useState(false)
  const [faqOpen,   setFaqOpen]   = useState<number | null>(null)

  useEffect(() => {
    setMounted(true)
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const rows = isAr ? ROWS_AR : ROWS_EN
  const faqs = isAr ? FAQS_AR : FAQS_EN
  const cats = Array.from(new Set(rows.map(r => r.cat)))

  // Active banner promo (for price display)
  const bannerPromo = activeCodes.find(c => c.show_banner)

  return (
    <div dir={dir} style={{ background: '#080808', color: T1, fontFamily: F, minHeight: '100vh', overflowX: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=Instrument+Serif:ital@1&family=DM+Sans:wght@300;400;500;600&family=Geist+Mono:wght@300;400;500&display=swap');
        *{box-sizing:border-box}
        @keyframes orb-a{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(12%,-15%) scale(1.1)}66%{transform:translate(-10%,12%) scale(0.92)}}
        @keyframes orb-b{0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(-15%,10%) scale(0.88)}70%{transform:translate(12%,-14%) scale(1.1)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        .grad-text{background:linear-gradient(135deg,#fff 0%,${CYAN} 55%,#fff 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;background-size:200%;animation:shimmer 5s linear infinite;display:inline-block}
        .nav-link{color:rgba(255,255,255,0.35);text-decoration:none;font-size:14px;transition:color 0.15s}
        .nav-link:hover{color:#fff}
        .plan-card{transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1),border-color 0.2s,box-shadow 0.3s}
        .plan-card:hover{transform:translateY(-6px)}
        .cta-btn{transition:all 0.2s;text-decoration:none;display:block;text-align:center;border-radius:10px;font-weight:700;font-size:14px}
        .trow:hover td{background:rgba(255,255,255,0.025)}
        .trow td{transition:background 0.15s}
        .faq-q{cursor:pointer;padding:20px 0;display:flex;justify-content:space-between;align-items:center;gap:16px;border:none;background:none;width:100%;text-align:${isAr ? 'right' : 'left'};color:${T1}}
        .faq-icon{transition:transform 0.3s,color 0.2s;color:${T3};flex-shrink:0}
        @media(max-width:900px){.plan-grid{grid-template-columns:1fr 1fr !important}.comparison-table{display:none !important}}
        @media(max-width:560px){.plan-grid{grid-template-columns:1fr !important}.sp{padding-left:24px !important;padding-right:24px !important}}
      ` }} />

      {/* Promo Banner — auto-shows from Supabase */}
      <PromoBanner isArabic={isAr} />

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-15%', width: '75vw', height: '75vw', borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(0,170,255,0.12) 0%,transparent 65%)', animation: 'orb-a 12s ease infinite', filter: 'blur(50px)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(100,80,255,0.08) 0%,transparent 65%)', animation: 'orb-b 15s ease infinite', filter: 'blur(60px)' }} />
      </div>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: activeCodes.length > 0 ? 42 : 0, left: 0, right: 0, zIndex: 100, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', borderBottom: `1px solid ${scrolled ? LINE : 'transparent'}`, background: scrolled ? 'rgba(8,8,8,0.92)' : 'transparent', backdropFilter: scrolled ? 'blur(24px)' : 'none', transition: 'all 0.35s' }}>
        <Link href="/landing" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <Image src="/favicon.png" alt="Nexa" width={24} height={24} style={{ borderRadius: 6 }} />
          <span style={{ fontFamily: H, fontWeight: 800, fontSize: 17, color: T1, letterSpacing: isAr ? 0 : '-0.03em' }}>Nexa</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <Link href="/landing" className="nav-link" style={{ fontFamily: F }}>{isAr ? 'الرئيسية' : 'Home'}</Link>
          <Link href="/landing/about" className="nav-link" style={{ fontFamily: F }}>{isAr ? 'عن Nexa' : 'About'}</Link>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => setLang(isAr ? 'en' : 'ar')} style={{ background: 'none', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 6, color: 'rgba(255,255,255,0.40)', fontSize: 13, padding: '5px 12px', cursor: 'pointer', fontFamily: isAr ? SANS : AR }}>
            {isAr ? 'English' : 'عربي'}
          </button>
          <Link href="/auth/login" style={{ padding: '7px 16px', borderRadius: 8, border: `1px solid ${LINE2}`, background: 'none', color: T2, fontSize: 13, fontFamily: F, textDecoration: 'none' }}>
            {isAr ? 'دخول' : 'Sign in'}
          </Link>
          <Link href="/auth/signup" style={{ padding: '7px 20px', borderRadius: 8, background: CYAN, color: '#000', fontSize: 13, fontWeight: 700, fontFamily: H, textDecoration: 'none' }}>
            {isAr ? 'ابدأ مجاناً ←' : 'Start free →'}
          </Link>
        </div>
      </nav>

      <div style={{ position: 'relative', zIndex: 1, paddingTop: activeCodes.length > 0 ? 106 : 64 }}>

        {/* ── HERO ── */}
        <section className="sp" style={{ padding: '90px 40px 70px', textAlign: 'center', maxWidth: 860, margin: '0 auto' }}>
          {/* Active promo badge in hero */}
          {bannerPromo && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, border: `1px solid ${SUCCESS}30`, background: `${SUCCESS}08`, marginBottom: 20, opacity: mounted ? 1 : 0, transition: 'opacity 0.5s' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: SUCCESS, display: 'inline-block', boxShadow: `0 0 8px ${SUCCESS}` }} />
              <span style={{ fontSize: 12, fontFamily: MONO, color: SUCCESS }}>
                {isAr ? `كود: ${bannerPromo.code}` : `Code: ${bannerPromo.code}`}
                {' · '}
                {bannerPromo.type === 'percent' ? `${bannerPromo.value}% ${isAr ? 'خصم' : 'off'}` : `$${bannerPromo.value} ${isAr ? 'خصم' : 'off'}`}
              </span>
            </div>
          )}

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, border: '1px solid rgba(0,170,255,0.25)', background: 'rgba(0,170,255,0.05)', marginBottom: 36, opacity: mounted ? 1 : 0, transition: 'opacity 0.6s 0.2s', backdropFilter: 'blur(12px)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 8px #4ade80' }} />
            <span style={{ fontSize: 12, fontFamily: MONO, color: T3 }}>
              {isAr ? 'ابدأ بـ ١٥٠ رصيد مجاناً · بدون بطاقة' : 'Start free — 150 credits on us · No card required'}
            </span>
          </div>

          <h1 style={{ fontFamily: H, fontWeight: 800, fontSize: 'clamp(52px,8vw,96px)', lineHeight: isAr ? 1.2 : 0.92, letterSpacing: isAr ? 0 : '-0.05em', marginBottom: 28, opacity: mounted ? 1 : 0, transition: 'opacity 0.7s 0.1s' }}>
            {isAr
              ? <><span className="grad-text">أسعار</span><br />واضحة<br />بدون مفاجآت</>
              : <><span className="grad-text">Pricing</span><br />that makes<br />sense.</>
            }
          </h1>
          <p style={{ fontSize: 'clamp(16px,2vw,20px)', color: T3, fontFamily: isAr ? AR : SERIF, fontStyle: isAr ? 'normal' : 'italic', lineHeight: 1.7, maxWidth: 600, margin: '0 auto 16px', opacity: mounted ? 1 : 0, transition: 'opacity 0.6s 0.4s' }}>
            {isAr ? 'كل خطة تشمل Brand Brain الكامل.' : 'Every plan includes the full Brand Brain.'}
          </p>
          <p style={{ fontSize: 13, color: T4, fontFamily: MONO, opacity: mounted ? 1 : 0, transition: 'opacity 0.6s 0.55s' }}>
            {isAr ? 'ضمان استرداد ٧ أيام · إلغاء في أي وقت' : '7-day money-back guarantee · Cancel anytime'}
          </p>
        </section>

        {/* ── PLAN CARDS ── */}
        <section className="sp" style={{ padding: '0 40px 80px', maxWidth: 1200, margin: '0 auto' }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ height: 340, borderRadius: 18, background: 'rgba(255,255,255,0.02)', border: `1px solid ${LINE}`, animation: 'shimmer 1.5s linear infinite', backgroundSize: '200%' }} />
              ))}
            </div>
          ) : (
            <div className="plan-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${plans.length},1fr)`, gap: 16, alignItems: 'stretch' }}>
              {plans.map((plan, i) => {
                const discountedPrice = bannerPromo && (bannerPromo.plan === 'all' || bannerPromo.plan === plan.id)
                  ? applyDiscount(plan.price, bannerPromo)
                  : null

                return (
                  <Reveal key={plan.id} delay={i * 70}>
                    <div className="plan-card" style={{
                      background: plan.popular ? 'rgba(0,170,255,0.06)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${plan.popular ? 'rgba(0,170,255,0.35)' : LINE}`,
                      borderRadius: 18, padding: '28px 22px 24px',
                      position: 'relative', height: '100%',
                      display: 'flex', flexDirection: 'column',
                      boxShadow: plan.popular ? '0 0 60px rgba(0,170,255,0.08)' : 'none',
                    }}>
                      {/* Popular badge */}
                      {plan.popular && (
                        <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', background: CYAN, color: '#000', fontSize: 10, fontWeight: 800, fontFamily: H, padding: '4px 14px', borderRadius: '0 0 8px 8px', letterSpacing: isAr ? 0 : '0.06em', whiteSpace: 'nowrap' }}>
                          {isAr ? 'الأكثر شعبية' : 'MOST POPULAR'}
                        </div>
                      )}

                      {/* Discount tag */}
                      <DiscountTag plan={plan} activeCodes={activeCodes} isAr={isAr} />

                      {/* Trial badge */}
                      {plan.trial_credits > 0 && (
                        <div style={{ fontSize: 9, fontFamily: MONO, color: '#4ade80', padding: '3px 9px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.20)', borderRadius: 6, display: 'inline-block', marginBottom: 14, letterSpacing: '0.06em', alignSelf: 'flex-start' }}>
                          {isAr ? `${plan.trial_credits} رصيد مجاناً` : `${plan.trial_credits} CREDITS FREE`}
                        </div>
                      )}

                      <div style={{ fontFamily: H, fontWeight: 800, fontSize: 22, color: plan.popular ? CYAN : T1, marginBottom: 2, letterSpacing: isAr ? 0 : '-0.03em' }}>{plan.label}</div>
                      <div style={{ fontSize: 12, color: T4, fontFamily: F, marginBottom: 20, fontStyle: isAr ? 'normal' : 'italic' }}>{isAr ? plan.tagline_ar : plan.tagline}</div>

                      {/* Price — with optional strikethrough */}
                      <div style={{ marginBottom: 6, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        {discountedPrice !== null ? (
                          <>
                            <span style={{ fontFamily: MONO, fontWeight: 300, fontSize: 42, color: T1, letterSpacing: '-0.05em', lineHeight: 1 }}>${discountedPrice}</span>
                            <span style={{ fontFamily: MONO, fontSize: 18, color: T4, textDecoration: 'line-through' }}>${plan.price}</span>
                          </>
                        ) : (
                          <span style={{ fontFamily: MONO, fontWeight: 300, fontSize: 42, color: T1, letterSpacing: '-0.05em', lineHeight: 1 }}>${plan.price}</span>
                        )}
                        <span style={{ fontSize: 13, color: T4, fontFamily: F, marginLeft: 2 }}>{isAr ? '/ شهر' : '/mo'}</span>
                      </div>

                      {/* Credits */}
                      <div style={{ fontSize: 12, fontFamily: MONO, color: plan.color, marginBottom: 24 }}>
                        {plan.credits.toLocaleString()} {isAr ? 'رصيد/شهر' : 'credits/mo'}
                      </div>

                      {/* CTA */}
                      <Link href="/auth/signup" className="cta-btn" style={{
                        padding: '12px 16px',
                        background: plan.popular ? CYAN : 'transparent',
                        color: plan.popular ? '#000' : T2,
                        border: plan.popular ? 'none' : `1px solid ${LINE2}`,
                        fontFamily: H, letterSpacing: isAr ? 0 : '-0.02em', marginTop: 'auto',
                      }}>
                        {isAr ? plan.cta_ar : plan.cta_en}
                      </Link>
                    </div>
                  </Reveal>
                )
              })}
            </div>
          )}
        </section>

        {/* ── COMPARISON TABLE ── */}
        <section className="sp" style={{ padding: '0 40px 100px', maxWidth: 1200, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ fontSize: 10, fontFamily: MONO, color: CYAN, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16, opacity: 0.7 }}>
                {isAr ? 'مقارنة المميزات' : 'Feature comparison'}
              </div>
              <h2 style={{ fontFamily: H, fontWeight: 800, fontSize: 'clamp(28px,4vw,48px)', letterSpacing: isAr ? 0 : '-0.04em', color: T1, lineHeight: isAr ? 1.3 : 1.05 }}>
                {isAr ? 'كل شيء جنب بجنب' : 'Everything, side by side.'}
              </h2>
            </div>
          </Reveal>

          <div className="comparison-table" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: '34%', padding: '0 0 24px', textAlign: isAr ? 'right' : 'left', fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 400 }}>
                    {isAr ? 'الميزة' : 'Feature'}
                  </th>
                  {plans.map(plan => (
                    <th key={plan.id} style={{ padding: '0 12px 24px', textAlign: 'center' }}>
                      <div style={{ fontFamily: H, fontWeight: 800, fontSize: 15, color: plan.popular ? CYAN : T1, letterSpacing: isAr ? 0 : '-0.025em', marginBottom: 2 }}>{plan.label}</div>
                      <div style={{ fontFamily: MONO, fontSize: 11, color: plan.color }}>${plan.price}{isAr ? '/شهر' : '/mo'}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cats.map((cat, ci) => {
                  const catRows = rows.filter(r => r.cat === cat)
                  return (
                    <>
                      <tr key={`cat-${ci}`}>
                        <td colSpan={plans.length + 1} style={{ padding: '20px 0 10px', borderTop: `1px solid ${LINE}` }}>
                          <span style={{ fontSize: 10, fontFamily: MONO, color: CYAN, letterSpacing: '0.10em', textTransform: 'uppercase', opacity: 0.7 }}>{cat}</span>
                        </td>
                      </tr>
                      {catRows.map((row, ri) => (
                        <tr key={`row-${ci}-${ri}`} className="trow">
                          <td style={{ padding: '11px 0', fontSize: 13, color: T2, fontFamily: F, borderTop: `1px solid ${LINE}`, lineHeight: 1.5, textAlign: isAr ? 'right' : 'left' }}>
                            {row.label}
                          </td>
                          {plans.map(plan => {
                            const featureKey = row.keys[0]
                            const rawVal = plan.features?.[featureKey] ?? (plan as any)[featureKey]
                            const val = formatFeatureValue(featureKey, rawVal, isAr)
                            return (
                              <td key={plan.id} style={{ padding: '11px 12px', textAlign: 'center', borderTop: `1px solid ${LINE}` }}>
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                  {val === true
                                    ? <Check color={plan.color} />
                                    : val === false
                                    ? <Cross />
                                    : <span style={{ fontSize: 12, fontFamily: F, color: T2, fontWeight: 500 }}>{String(val)}</span>
                                  }
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </>
                  )
                })}
                {/* CTA row */}
                <tr>
                  <td style={{ padding: '32px 0 0', borderTop: `1px solid ${LINE}` }} />
                  {plans.map(plan => (
                    <td key={plan.id} style={{ padding: '32px 12px 0', borderTop: `1px solid ${LINE}`, textAlign: 'center' }}>
                      <Link href="/auth/signup" style={{ display: 'inline-block', padding: '10px 20px', borderRadius: 9, background: plan.popular ? CYAN : 'transparent', color: plan.popular ? '#000' : T2, border: plan.popular ? 'none' : `1px solid ${LINE2}`, fontSize: 13, fontWeight: 700, fontFamily: H, textDecoration: 'none', letterSpacing: isAr ? 0 : '-0.02em', whiteSpace: 'nowrap' }}>
                        {isAr ? plan.cta_ar : plan.cta_en}
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="sp" style={{ padding: '0 40px 100px', maxWidth: 780, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <h2 style={{ fontFamily: H, fontWeight: 800, fontSize: 'clamp(28px,4vw,48px)', letterSpacing: isAr ? 0 : '-0.04em', color: T1, lineHeight: isAr ? 1.3 : 1.05 }}>
                {isAr ? 'أسئلة حول الأسعار' : 'Pricing questions.'}
              </h2>
            </div>
          </Reveal>
          <div style={{ borderTop: `1px solid ${LINE}` }}>
            {faqs.map((item, i) => (
              <div key={i} style={{ borderBottom: `1px solid ${LINE}` }}>
                <button className="faq-q" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                  <span style={{ fontSize: 15, fontWeight: 600, fontFamily: H, color: T1, letterSpacing: isAr ? 0 : '-0.02em', textAlign: isAr ? 'right' : 'left' }}>{item.q}</span>
                  <span className="faq-icon" style={{ transform: faqOpen === i ? 'rotate(45deg)' : 'none' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  </span>
                </button>
                {faqOpen === i && (
                  <div style={{ padding: '0 0 20px', animation: 'fadeUp 0.25s ease both' }}>
                    <p style={{ fontSize: 14, color: T3, lineHeight: isAr ? 1.9 : 1.8, fontFamily: F, textAlign: isAr ? 'right' : 'left' }}>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="sp" style={{ padding: '40px 40px 120px', textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
          <Reveal>
            <div style={{ padding: '64px 48px', background: 'rgba(0,170,255,0.04)', border: `1px solid rgba(0,170,255,0.18)`, borderRadius: 24, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-40%', left: '50%', transform: 'translateX(-50%)', width: '60%', height: '200%', background: 'radial-gradient(ellipse,rgba(0,170,255,0.12) 0%,transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative' }}>
                <h2 style={{ fontFamily: H, fontWeight: 800, fontSize: 'clamp(28px,5vw,56px)', letterSpacing: isAr ? 0 : '-0.04em', color: T1, lineHeight: isAr ? 1.3 : 1, marginBottom: 16 }}>
                  {isAr ? <>ابدأ بـ ١٥٠ رصيد.<br /><span className="grad-text">مجاناً.</span></> : <>Start with 150 credits.<br /><span className="grad-text">On us.</span></>}
                </h2>
                <p style={{ fontFamily: isAr ? AR : SERIF, fontStyle: isAr ? 'normal' : 'italic', fontSize: 17, color: T3, marginBottom: 36 }}>
                  {isAr ? 'بدون بطاقة ائتمانية. الإعداد في ٣ دقائق.' : 'No credit card. Setup in 3 minutes.'}
                </p>
                <Link href="/auth/signup" style={{ display: 'inline-block', padding: '15px 40px', borderRadius: 12, background: CYAN, color: '#000', fontSize: 15, fontWeight: 800, fontFamily: H, textDecoration: 'none', letterSpacing: isAr ? 0 : '-0.03em', boxShadow: '0 0 40px rgba(0,170,255,0.2)' }}>
                  {isAr ? 'ابدأ مجاناً ←' : 'Start free →'}
                </Link>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: `1px solid ${LINE}`, padding: '28px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Link href="/landing" style={{ fontSize: 13, fontFamily: MONO, color: T4, textDecoration: 'none' }}>{isAr ? '→ العودة لـ Nexa' : '← Back to Nexa'}</Link>
          <span style={{ fontSize: 12, color: T4, fontFamily: MONO }}>© 2026 Nexa · Dubai, UAE</span>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link href="/landing/terms" style={{ fontSize: 12, color: T4, fontFamily: MONO, textDecoration: 'none' }}>{isAr ? 'الشروط' : 'Terms'}</Link>
            <Link href="/landing/privacy" style={{ fontSize: 12, color: T4, fontFamily: MONO, textDecoration: 'none' }}>{isAr ? 'الخصوصية' : 'Privacy'}</Link>
          </div>
        </footer>
      </div>
    </div>
  )
}
