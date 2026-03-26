'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLang } from '@/lib/language-context'

/* ─── design tokens — match landing page exactly ─── */
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

/* ─── plan definitions ─── */
const PLANS_EN = [
  { id:'spark',  name:'Spark',  tagline:'The Creator',  price:49,  credits:1000,  color:'rgba(255,255,255,0.75)', popular:false, cta:'Start with Spark',  trial:'200 credits free' },
  { id:'grow',   name:'Grow',   tagline:'The Grower',   price:89,  credits:3000,  color:CYAN,                    popular:true,  cta:'Start with Grow',   trial:null },
  { id:'scale',  name:'Scale',  tagline:'The Operator', price:169, credits:7000,  color:'#a78bfa',               popular:false, cta:'Start with Scale',  trial:null },
  { id:'agency', name:'Agency', tagline:'The Agency',   price:349, credits:20000, color:'#fb923c',               popular:false, cta:'Start with Agency', trial:null },
]
const PLANS_AR = [
  { id:'spark',  name:'Spark',  tagline:'للمبدع',        price:49,  credits:1000,  color:'rgba(255,255,255,0.75)', popular:false, cta:'ابدأ بـ Spark',  trial:'٢٠٠ رصيد مجاناً' },
  { id:'grow',   name:'Grow',   tagline:'للنمو',         price:89,  credits:3000,  color:CYAN,                    popular:true,  cta:'ابدأ بـ Grow',   trial:null },
  { id:'scale',  name:'Scale',  tagline:'للمحترف',      price:169, credits:7000,  color:'#a78bfa',               popular:false, cta:'ابدأ بـ Scale',  trial:null },
  { id:'agency', name:'Agency', tagline:'للوكالة',       price:349, credits:20000, color:'#fb923c',               popular:false, cta:'ابدأ بـ Agency', trial:null },
]

/* ─── feature comparison table ─── */
const ROWS_EN = [
  { cat:'Credits',      label:'Monthly credits',                spark:'1,000 cr',     grow:'3,000 cr',        scale:'7,000 cr',   agency:'20,000 cr' },
  { cat:'Credits',      label:'Free trial',                     spark:'200 cr free',  grow:false,             scale:false,        agency:false },
  { cat:'Brand',        label:'Brand Brain — voice training',   spark:true,           grow:true,              scale:true,         agency:true },
  { cat:'Brand',        label:'Text, image, video, voice gen',  spark:true,           grow:true,              scale:true,         agency:true },
  { cat:'Brand',        label:'Nexa AI chat — unlimited',       spark:true,           grow:true,              scale:true,         agency:true },
  { cat:'Content',      label:'Morning brief',                  spark:true,           grow:true,              scale:true,         agency:true },
  { cat:'Content',      label:'Strategy & 30-day content plan', spark:true,           grow:true,              scale:true,         agency:true },
  { cat:'Content',      label:'Lead capture page',              spark:true,           grow:true,              scale:true,         agency:true },
  { cat:'Content',      label:'Lead magnet delivery',           spark:true,           grow:true,              scale:true,         agency:true },
  { cat:'Publishing',   label:'Social platforms',               spark:'2 platforms',  grow:'4 platforms',     scale:'Unlimited',  agency:'Unlimited' },
  { cat:'Publishing',   label:'Scheduled posts / month',        spark:'60 posts',     grow:'Unlimited',       scale:'Unlimited',  agency:'Unlimited' },
  { cat:'Analytics',    label:'Analytics',                      spark:'Basic',        grow:'Full + AI',       scale:'Full + export', agency:'Full + export' },
  { cat:'Analytics',    label:'Competitor analysis',            spark:false,          grow:true,              scale:true,         agency:true },
  { cat:'Analytics',    label:'Performance learning',           spark:false,          grow:true,              scale:true,         agency:true },
  { cat:'Email',        label:'Email sequences',                spark:false,          grow:'3 active',        scale:'15 sequences', agency:'Unlimited' },
  { cat:'Email',        label:'Contacts',                       spark:false,          grow:'2,500',           scale:'15,000',     agency:'Unlimited' },
  { cat:'Email',        label:'Emails per month',               spark:false,          grow:'3,000',           scale:'20,000',     agency:'100,000' },
  { cat:'Email',        label:'AI-written sequences',           spark:false,          grow:true,              scale:true,         agency:true },
  { cat:'Email',        label:'A/B subject line testing',       spark:false,          grow:false,             scale:true,         agency:true },
  { cat:'Email',        label:'Behavioral triggers',            spark:false,          grow:false,             scale:true,         agency:true },
  { cat:'Ads',          label:'Amplify — Meta Ads',             spark:false,          grow:true,              scale:true,         agency:true },
  { cat:'Ads',          label:'One-click boost from Studio',    spark:false,          grow:true,              scale:true,         agency:true },
  { cat:'Ads',          label:'AI ad performance monitor',      spark:false,          grow:false,             scale:true,         agency:true },
  { cat:'Ads',          label:'Daily ad insights brief',        spark:false,          grow:false,             scale:true,         agency:true },
  { cat:'Branding',     label:'Remove Nexa branding',           spark:false,          grow:false,             scale:true,         agency:true },
  { cat:'Branding',     label:'Custom sender domain',           spark:false,          grow:false,             scale:true,         agency:true },
  { cat:'Agency',       label:'Client workspaces',              spark:false,          grow:false,             scale:false,        agency:'Unlimited' },
  { cat:'Agency',       label:'Separate Brand Brain per client',spark:false,          grow:false,             scale:false,        agency:true },
  { cat:'Agency',       label:'Retainer & MRR tracking',        spark:false,          grow:false,             scale:false,        agency:true },
  { cat:'Integrations', label:'Kit / ConvertKit',               spark:false,          grow:true,              scale:true,         agency:true },
  { cat:'Integrations', label:'Zapier / custom webhooks',       spark:false,          grow:false,             scale:true,         agency:true },
  { cat:'Team',         label:'Team members',                   spark:'1',            grow:'2',               scale:'5',          agency:'25' },
  { cat:'Support',      label:'Support',                        spark:'Email',        grow:'Priority email',  scale:'Priority',   agency:'Dedicated' },
]

const ROWS_AR = [
  { cat:'الأرصدة',       label:'الأرصدة الشهرية',                spark:'١٬٠٠٠ رصيد',  grow:'٣٬٠٠٠ رصيد',     scale:'٧٬٠٠٠ رصيد',   agency:'٢٠٬٠٠٠ رصيد' },
  { cat:'الأرصدة',       label:'التجربة المجانية',               spark:'٢٠٠ مجاناً',  grow:false,             scale:false,           agency:false },
  { cat:'العلامة',       label:'Brand Brain — نمذجة الصوت',     spark:true,           grow:true,              scale:true,            agency:true },
  { cat:'العلامة',       label:'نص، صورة، فيديو، صوت',          spark:true,           grow:true,              scale:true,            agency:true },
  { cat:'العلامة',       label:'محادثة Nexa AI — غير محدودة',   spark:true,           grow:true,              scale:true,            agency:true },
  { cat:'المحتوى',       label:'البريف اليومي الصباحي',          spark:true,           grow:true,              scale:true,            agency:true },
  { cat:'المحتوى',       label:'استراتيجية وخطة ٣٠ يوم',        spark:true,           grow:true,              scale:true,            agency:true },
  { cat:'المحتوى',       label:'صفحة استقطاب العملاء',           spark:true,           grow:true,              scale:true,            agency:true },
  { cat:'المحتوى',       label:'إرسال المغناطيس الرقمي',        spark:true,           grow:true,              scale:true,            agency:true },
  { cat:'النشر',         label:'المنصات الاجتماعية',             spark:'٢ منصات',     grow:'٤ منصات',         scale:'غير محدود',     agency:'غير محدود' },
  { cat:'النشر',         label:'المنشورات المجدولة / شهر',       spark:'٦٠ منشور',    grow:'غير محدود',       scale:'غير محدود',     agency:'غير محدود' },
  { cat:'التحليل',       label:'التحليلات',                      spark:'أساسية',       grow:'كاملة + AI',      scale:'كاملة + تصدير', agency:'كاملة + تصدير' },
  { cat:'التحليل',       label:'تحليل المنافسين',                spark:false,          grow:true,              scale:true,            agency:true },
  { cat:'التحليل',       label:'التعلم من الأداء',               spark:false,          grow:true,              scale:true,            agency:true },
  { cat:'الإيميل',       label:'سيكوانسات الإيميل',              spark:false,          grow:'٣ نشطة',          scale:'١٥ سيكوانس',    agency:'غير محدود' },
  { cat:'الإيميل',       label:'جهات الاتصال',                   spark:false,          grow:'٢٬٥٠٠',          scale:'١٥٬٠٠٠',        agency:'غير محدود' },
  { cat:'الإيميل',       label:'إيميلات شهرياً',                 spark:false,          grow:'٣٬٠٠٠',          scale:'٢٠٬٠٠٠',        agency:'١٠٠٬٠٠٠' },
  { cat:'الإيميل',       label:'سيكوانسات مكتوبة بـ AI',         spark:false,          grow:true,              scale:true,            agency:true },
  { cat:'الإيميل',       label:'اختبار A/B للعناوين',            spark:false,          grow:false,             scale:true,            agency:true },
  { cat:'الإيميل',       label:'المحفزات السلوكية',              spark:false,          grow:false,             scale:true,            agency:true },
  { cat:'الإعلانات',     label:'Amplify — إعلانات Meta',         spark:false,          grow:true,              scale:true,            agency:true },
  { cat:'الإعلانات',     label:'بوست مباشر من الاستوديو',        spark:false,          grow:true,              scale:true,            agency:true },
  { cat:'الإعلانات',     label:'مراقبة أداء الإعلانات بـ AI',   spark:false,          grow:false,             scale:true,            agency:true },
  { cat:'الإعلانات',     label:'بريف الإعلانات اليومي',          spark:false,          grow:false,             scale:true,            agency:true },
  { cat:'العلامة',       label:'إزالة شعار Nexa',                spark:false,          grow:false,             scale:true,            agency:true },
  { cat:'العلامة',       label:'نطاق الإرسال الخاص',             spark:false,          grow:false,             scale:true,            agency:true },
  { cat:'الوكالة',       label:'مساحات عمل العملاء',             spark:false,          grow:false,             scale:false,           agency:'غير محدود' },
  { cat:'الوكالة',       label:'Brand Brain منفصل لكل عميل',    spark:false,          grow:false,             scale:false,           agency:true },
  { cat:'الوكالة',       label:'تتبع الريتينر والـ MRR',         spark:false,          grow:false,             scale:false,           agency:true },
  { cat:'التكاملات',     label:'Kit / ConvertKit',               spark:false,          grow:true,              scale:true,            agency:true },
  { cat:'التكاملات',     label:'Zapier / Webhooks مخصصة',        spark:false,          grow:false,             scale:true,            agency:true },
  { cat:'الفريق',        label:'أعضاء الفريق',                   spark:'١',            grow:'٢',               scale:'٥',             agency:'٢٥' },
  { cat:'الدعم',         label:'الدعم الفني',                    spark:'إيميل',        grow:'إيميل أولوية',    scale:'أولوية',        agency:'مخصص' },
]

const FAQS_EN = [
  { q:'What is a credit?', a:'Credits power all AI generation. A text post costs 3 credits, an image costs 5, a short standard video (5s silent) starts at 49 credits, and voice generation costs 5–39 depending on length. Chat, strategy, scheduling, and analytics are always free — they never touch your credits.' },
  { q:'Can I switch plans anytime?', a:'Yes. Upgrade or downgrade whenever you want. Upgrades take effect immediately. Downgrades apply at the next billing cycle. No contracts, no lock-in.' },
  { q:"Do unused credits roll over?", a:"No. Credits reset monthly with your billing cycle. This keeps pricing predictable for both sides. Most active users find they don't come close to their limit." },
  { q:'Is there a free trial?', a:'Spark plan users get 200 credits free when they sign up — no credit card required. That is enough to generate around 40–60 pieces of content and see exactly how Nexa works.' },
  { q:'What happens if I run out of credits?', a:'You can top up credits at any time from your settings page. Or upgrade your plan for a higher monthly allocation. We never cut off access mid-campaign.' },
  { q:'How does the Agency plan work?', a:'Each client gets their own isolated workspace with a dedicated Brand Brain, publishing connections, and content history. You manage everything from one master dashboard. Client data is completely separated — they never see each other.' },
  { q:'Is there a money-back guarantee?', a:'Yes. All paid plans include a 7-day money-back guarantee on your first payment. If Nexa is not right for you, we will refund in full — no questions asked.' },
]

const FAQS_AR = [
  { q:'إيش هو الرصيد؟', a:'الأرصدة تشغّل كل إنتاج بالذكاء الاصطناعي. المنشور النصي يكلّف ٣ أرصدة، الصورة ٥، الفيديو القصير يبدأ من ٤٩ رصيداً، وتوليد الصوت بين ٥ و٣٩ حسب الطول. المحادثة والاستراتيجية والجدولة والتحليلات مجانية دايماً — ما تلمس أرصدتك أبداً.' },
  { q:'هل أقدر أغيّر خطتي في أي وقت؟', a:'أيوه. رفّع أو خفّض متى تبي. الترقية تسري فوراً. التخفيض يطبّق في دورة الفوترة الجاية. بدون عقود، بدون قيود.' },
  { q:'هل الأرصدة غير المستخدمة تترحّل؟', a:'لا. الأرصدة تتجدد شهرياً مع دورة فوترتك. هذا يخلي التسعير متوقعاً للطرفين. معظم المستخدمين النشطين ما يقتربون من حدّهم أصلاً.' },
  { q:'هل في تجربة مجانية؟', a:'مستخدمو خطة Spark يحصلون على ٢٠٠ رصيد مجاناً عند التسجيل — بدون بطاقة ائتمانية. يكفي لإنتاج ٤٠–٦٠ قطعة محتوى وتشوف Nexa كيف تشتغل بالضبط.' },
  { q:'إيش يصير لو خلصت أرصدتي؟', a:'تقدر تشحن أرصدة في أي وقت من صفحة الإعدادات. أو رفّع خطتك للحصول على تخصيص شهري أعلى. ما نقطع الوصول في وسط حملة أبداً.' },
  { q:'كيف تشتغل خطة الوكالة؟', a:'كل عميل يحصل على مساحة عمل معزولة بـ Brand Brain مخصص، اتصالات نشر، وسجل محتوى. تدير كل شيء من لوحة تحكم رئيسية واحدة. بيانات العملاء منفصلة تماماً — ما يشوف بعضهم أبداً.' },
  { q:'هل في ضمان استرداد المبلغ؟', a:'أيوه. جميع الخطط المدفوعة تشمل ضمان استرداد ٧ أيام على أول دفعة. لو Nexa مو مناسبة لك، نرد المبلغ كاملاً — بدون أسئلة.' },
]

function Check({ color = CYAN }: { color?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}
function Cross() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useReveal()
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(32px)',
      transition: `opacity 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

function CellValue({ val, planColor, isAr }: { val: string | boolean; planColor: string; isAr: boolean }) {
  const F = isAr ? AR : SANS
  if (val === true)  return <Check color={planColor} />
  if (val === false) return <Cross />
  return <span style={{ fontSize:12, fontFamily:F, color:T2, fontWeight:500 }}>{val as string}</span>
}

export default function PricingPage() {
  const { lang, setLang, isArabic } = useLang()
  const isAr  = isArabic
  const F     = isAr ? AR : SANS
  const H     = isAr ? AR : DISPLAY
  const dir   = isAr ? 'rtl' : 'ltr'

  const [scrolled,    setScrolled]    = useState(false)
  const [mounted,     setMounted]     = useState(false)
  const [faqOpen,     setFaqOpen]     = useState<number|null>(null)
  const [activeCol,   setActiveCol]   = useState<string|null>(null)

  useEffect(() => {
    setMounted(true)
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const plans = isAr ? PLANS_AR : PLANS_EN
  const rows  = isAr ? ROWS_AR  : ROWS_EN
  const faqs  = isAr ? FAQS_AR  : FAQS_EN

  // Group rows by category
  const cats = Array.from(new Set(rows.map(r => r.cat)))

  const planCols: Array<keyof typeof rows[0]> = ['spark','grow','scale','agency']
  const planColors = { spark:'rgba(255,255,255,0.75)', grow:CYAN, scale:'#a78bfa', agency:'#fb923c' }

  return (
    <div dir={dir} style={{ background:'#080808', color:T1, fontFamily:F, minHeight:'100vh', overflowX:'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html:`
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
        .lang-btn{background:none;border:0.5px solid rgba(255,255,255,0.12);border-radius:6px;color:rgba(255,255,255,0.40);font-size:13px;padding:5px 12px;cursor:pointer;transition:color 0.2s,border-color 0.2s}
        .lang-btn:hover{color:rgba(255,255,255,0.85);border-color:rgba(255,255,255,0.28)}
        .trow:hover td{background:rgba(255,255,255,0.025)}
        .trow td{transition:background 0.15s}
        .col-highlight td.col-grow{background:rgba(0,170,255,0.04) !important}
        .faq-q{cursor:pointer;padding:20px 0;display:flex;justify-content:space-between;align-items:center;gap:16px;border:none;background:none;width:100%;text-align:${isAr?'right':'left'};color:${T1}}
        .faq-q:hover .faq-icon{color:${CYAN}}
        .faq-icon{transition:transform 0.3s,color 0.2s;color:${T3};flex-shrink:0}
        @media(max-width:900px){
          .plan-grid{grid-template-columns:1fr 1fr !important}
          .comparison-table{display:none !important}
          .mobile-note{display:block !important}
        }
        @media(max-width:560px){
          .plan-grid{grid-template-columns:1fr !important}
          .hero-title{font-size:clamp(40px,11vw,72px) !important}
          .sp{padding-left:24px !important;padding-right:24px !important}
        }
      `}}/>

      {/* Background */}
      <div style={{position:'fixed',inset:0,zIndex:0,overflow:'hidden',pointerEvents:'none'}}>
        <div style={{position:'absolute',top:'-20%',right:'-15%',width:'75vw',height:'75vw',borderRadius:'50%',background:'radial-gradient(ellipse,rgba(0,170,255,0.12) 0%,transparent 65%)',animation:'orb-a 12s ease infinite',filter:'blur(50px)'}}/>
        <div style={{position:'absolute',bottom:'-20%',left:'-10%',width:'60vw',height:'60vw',borderRadius:'50%',background:'radial-gradient(ellipse,rgba(100,80,255,0.08) 0%,transparent 65%)',animation:'orb-b 15s ease infinite',filter:'blur(60px)'}}/>
        <div style={{position:'absolute',inset:0,opacity:0.02,backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`}}/>
      </div>

      {/* Nav */}
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,height:64,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 40px',borderBottom:`1px solid ${scrolled?LINE:'transparent'}`,background:scrolled?'rgba(8,8,8,0.92)':'transparent',backdropFilter:scrolled?'blur(24px)':'none',transition:'all 0.35s'}}>
        <Link href="/landing" style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none'}}>
          <Image src="/favicon.png" alt="Nexa" width={24} height={24} style={{borderRadius:6}}/>
          <span style={{fontFamily:H,fontWeight:800,fontSize:17,color:T1,letterSpacing:isAr?0:'-0.03em'}}>Nexa</span>
        </Link>
        <div style={{display:'flex',alignItems:'center',gap:28}}>
          <Link href="/landing" className="nav-link" style={{fontFamily:F}}>{isAr?'الرئيسية':'Home'}</Link>
          <Link href="/landing/about" className="nav-link" style={{fontFamily:F}}>{isAr?'عن Nexa':'About'}</Link>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <button onClick={()=>setLang(isAr?'en':'ar')} className="lang-btn" style={{fontFamily:isAr?SANS:AR,letterSpacing:isAr?'0.04em':0}}>
            {isAr?'English':'عربي'}
          </button>
          <Link href="/auth/login" style={{padding:'7px 16px',borderRadius:8,border:`1px solid ${LINE2}`,background:'none',color:T2,fontSize:13,fontFamily:F,textDecoration:'none',transition:'border-color 0.15s'}}>
            {isAr?'دخول':'Sign in'}
          </Link>
          <Link href="/auth/signup" style={{padding:'7px 20px',borderRadius:8,background:CYAN,color:'#000',fontSize:13,fontWeight:700,fontFamily:H,textDecoration:'none',letterSpacing:isAr?0:'-0.02em'}}>
            {isAr?'ابدأ مجاناً ←':'Start free →'}
          </Link>
        </div>
      </nav>

      <div style={{position:'relative',zIndex:1,paddingTop:64}}>

        {/* ══ HERO ══ */}
        <section className="sp" style={{padding:'90px 40px 70px',textAlign:'center',maxWidth:860,margin:'0 auto'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'6px 16px',borderRadius:100,border:'1px solid rgba(0,170,255,0.25)',background:'rgba(0,170,255,0.05)',marginBottom:36,opacity:mounted?1:0,transition:'opacity 0.6s 0.2s',backdropFilter:'blur(12px)'}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'#4ade80',display:'inline-block',boxShadow:'0 0 8px #4ade80'}}/>
            <span style={{fontSize:12,fontFamily:MONO,color:T3}}>
              {isAr?'ابدأ بـ ٢٠٠ رصيد مجاناً · بدون بطاقة':'Start free — 200 credits on us · No card required'}
            </span>
          </div>

          <h1 className="hero-title" style={{fontFamily:H,fontWeight:800,fontSize:'clamp(52px,8vw,96px)',lineHeight:isAr?1.2:0.92,letterSpacing:isAr?0:'-0.05em',marginBottom:28,opacity:mounted?1:0,transition:'opacity 0.7s 0.1s'}}>
            {isAr
              ? <><span className="grad-text">أسعار</span><br/>واضحة<br/>بدون مفاجآت</>
              : <><span className="grad-text">Pricing</span><br/>that makes<br/>sense.</>
            }
          </h1>

          <p style={{fontSize:'clamp(16px,2vw,20px)',color:T3,fontFamily:isAr?AR:SERIF,fontStyle:isAr?'normal':'italic',lineHeight:1.7,maxWidth:600,margin:'0 auto 16px',opacity:mounted?1:0,transition:'opacity 0.6s 0.4s'}}>
            {isAr
              ? 'كل خطة تشمل Brand Brain الكامل. الفرق في الأرصدة، التوسع، والمميزات المتقدمة.'
              : 'Every plan includes the full Brand Brain. The difference is credits, scale, and advanced features.'
            }
          </p>
          <p style={{fontSize:13,color:T4,fontFamily:MONO,opacity:mounted?1:0,transition:'opacity 0.6s 0.55s'}}>
            {isAr?'ضمان استرداد ٧ أيام على أول دفعة · إلغاء في أي وقت':'7-day money-back guarantee · Cancel anytime'}
          </p>
        </section>

        {/* ══ PLAN CARDS ══ */}
        <section className="sp" style={{padding:'0 40px 80px',maxWidth:1200,margin:'0 auto'}}>
          <div className="plan-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,alignItems:'stretch'}}>
            {plans.map((plan, i) => (
              <Reveal key={plan.id} delay={i * 70}>
                <div className="plan-card" style={{
                  background: plan.popular ? 'rgba(0,170,255,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${plan.popular ? 'rgba(0,170,255,0.35)' : LINE}`,
                  borderRadius:18,
                  padding:'28px 22px 24px',
                  position:'relative',
                  height:'100%',
                  display:'flex',
                  flexDirection:'column',
                  boxShadow: plan.popular ? '0 0 60px rgba(0,170,255,0.08)' : 'none',
                }}>
                  {/* Popular badge */}
                  {plan.popular && (
                    <div style={{position:'absolute',top:-1,left:'50%',transform:'translateX(-50%)',background:CYAN,color:'#000',fontSize:10,fontWeight:800,fontFamily:H,padding:'4px 14px',borderRadius:'0 0 8px 8px',letterSpacing:isAr?0:'0.06em',whiteSpace:'nowrap'}}>
                      {isAr?'الأكثر شعبية':'MOST POPULAR'}
                    </div>
                  )}

                  {/* Trial badge */}
                  {plan.trial && (
                    <div style={{fontSize:9,fontFamily:MONO,color:'#4ade80',padding:'3px 9px',background:'rgba(74,222,128,0.08)',border:'1px solid rgba(74,222,128,0.20)',borderRadius:6,display:'inline-block',marginBottom:14,letterSpacing:'0.06em',alignSelf:'flex-start'}}>
                      {plan.trial.toUpperCase()}
                    </div>
                  )}

                  <div style={{fontFamily:H,fontWeight:800,fontSize:22,color:plan.popular?CYAN:T1,marginBottom:2,letterSpacing:isAr?0:'-0.03em'}}>{plan.name}</div>
                  <div style={{fontSize:12,color:T4,fontFamily:F,marginBottom:20,fontStyle:isAr?'normal':'italic'}}>{plan.tagline}</div>

                  {/* Price */}
                  <div style={{marginBottom:6,display:'flex',alignItems:'baseline',gap:2}}>
                    <span style={{fontFamily:MONO,fontWeight:300,fontSize:42,color:T1,letterSpacing:'-0.05em',lineHeight:1}}>
                      ${plan.price}
                    </span>
                    <span style={{fontSize:13,color:T4,fontFamily:F,marginLeft:4}}>{isAr?'/ شهر':'/mo'}</span>
                  </div>

                  {/* Credits */}
                  <div style={{fontSize:12,fontFamily:MONO,color:plan.color,marginBottom:24}}>
                    {isAr
                      ? `${plan.credits.toLocaleString('ar-SA')} ${plan.credits >= 1000 ? 'رصيد / شهر' : 'رصيد / شهر'}`
                      : `${plan.credits.toLocaleString()} credits/mo`
                    }
                  </div>

                  {/* CTA */}
                  <Link href="/auth/signup" className="cta-btn" style={{
                    padding:'12px 16px',
                    background: plan.popular ? CYAN : 'transparent',
                    color: plan.popular ? '#000' : T2,
                    border: plan.popular ? 'none' : `1px solid ${LINE2}`,
                    fontFamily:H,
                    letterSpacing: isAr ? 0 : '-0.02em',
                    marginTop:'auto',
                  }}
                    onMouseEnter={e => {
                      if (!plan.popular) {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'
                        ;(e.currentTarget as HTMLElement).style.color = T1
                      }
                    }}
                    onMouseLeave={e => {
                      if (!plan.popular) {
                        (e.currentTarget as HTMLElement).style.background = 'transparent'
                        ;(e.currentTarget as HTMLElement).style.color = T2
                      }
                    }}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Credit cost explainer */}
          <Reveal delay={320}>
            <div style={{marginTop:32,display:'flex',justifyContent:'center',gap:24,flexWrap:'wrap'}}>
              {(isAr
                ? [['نص','٣ أرصدة'],['صورة','٥ أرصدة'],['فيديو','٤٩+ رصيداً'],['محادثة','مجاني'],['جدولة','مجاني']]
                : [['Text post','3 credits'],['Image','5 credits'],['Video','49+ credits'],['Chat','Free'],['Scheduling','Free']]
              ).map(([label, cost], i) => (
                <div key={i} style={{display:'flex',alignItems:'center',gap:7,fontSize:12,color:T4,fontFamily:MONO}}>
                  <span style={{width:5,height:5,borderRadius:'50%',background:'rgba(255,255,255,0.15)',display:'inline-block'}}/>
                  <span style={{color:T3}}>{label}</span>
                  <span>→</span>
                  <span style={{color:cost.includes('Free')||cost.includes('مجاني')?'#4ade80':T2}}>{cost}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ══ FEATURE COMPARISON TABLE ══ */}
        <section className="sp" style={{padding:'0 40px 100px',maxWidth:1200,margin:'0 auto'}}>
          <Reveal>
            <div style={{textAlign:'center',marginBottom:56}}>
              <div style={{fontSize:10,fontFamily:MONO,color:CYAN,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:16,opacity:0.7}}>
                {isAr?'مقارنة المميزات':'Feature comparison'}
              </div>
              <h2 style={{fontFamily:H,fontWeight:800,fontSize:'clamp(28px,4vw,48px)',letterSpacing:isAr?0:'-0.04em',color:T1,lineHeight:isAr?1.3:1.05}}>
                {isAr?'كل شيء جنب بجنب':'Everything, side by side.'}
              </h2>
            </div>
          </Reveal>

          {/* Mobile note */}
          <div className="mobile-note" style={{display:'none',textAlign:'center',padding:'16px',background:'rgba(255,255,255,0.02)',border:`1px solid ${LINE}`,borderRadius:10,marginBottom:24,fontSize:13,color:T3,fontFamily:F}}>
            {isAr?'دوّر الشاشة أفقياً لرؤية المقارنة الكاملة':'Rotate your device or use a wider screen to see the full comparison.'}
          </div>

          <div className="comparison-table" style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',tableLayout:'fixed'}}>
              {/* Header */}
              <thead>
                <tr>
                  <th style={{width:isAr?'auto':'34%',padding:'0 0 24px',textAlign:isAr?'right':'left',fontFamily:MONO,fontSize:11,color:T4,letterSpacing:'0.08em',textTransform:'uppercase',fontWeight:400}}>
                    {isAr?'الميزة':'Feature'}
                  </th>
                  {plans.map(plan => (
                    <th key={plan.id} style={{padding:'0 12px 24px',textAlign:'center',width:'16.5%'}}>
                      <div style={{fontFamily:H,fontWeight:800,fontSize:15,color:plan.popular?CYAN:T1,letterSpacing:isAr?0:'-0.025em',marginBottom:2}}>{plan.name}</div>
                      <div style={{fontFamily:MONO,fontSize:11,color:plan.color}}>
                        ${plan.price}{isAr?'/شهر':'/mo'}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {cats.map((cat, ci) => {
                  const catRows = rows.filter(r => r.cat === cat)
                  return (
                    <>
                      {/* Category header row */}
                      <tr key={`cat-${ci}`}>
                        <td colSpan={5} style={{padding:'20px 0 10px',borderTop:`1px solid ${LINE}`}}>
                          <span style={{fontSize:10,fontFamily:MONO,color:CYAN,letterSpacing:'0.10em',textTransform:'uppercase',opacity:0.7}}>{cat}</span>
                        </td>
                      </tr>
                      {/* Feature rows */}
                      {catRows.map((row, ri) => (
                        <tr key={`row-${ci}-${ri}`} className="trow">
                          <td style={{padding:'11px 0',fontSize:13,color:T2,fontFamily:F,borderTop:`1px solid ${LINE}`,lineHeight:1.5,textAlign:isAr?'right':'left'}}>
                            {row.label}
                          </td>
                          {planCols.map(col => (
                            <td key={col} className={`col-${col}`} style={{padding:'11px 12px',textAlign:'center',borderTop:`1px solid ${LINE}`,borderRadius:0}}>
                              <div style={{display:'flex',justifyContent:'center',alignItems:'center'}}>
                                <CellValue
                                  val={row[col] as string | boolean}
                                  planColor={planColors[col as keyof typeof planColors]}
                                  isAr={isAr}
                                />
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </>
                  )
                })}

                {/* CTA row at bottom */}
                <tr>
                  <td style={{padding:'32px 0 0',borderTop:`1px solid ${LINE}`}}/>
                  {plans.map(plan => (
                    <td key={plan.id} style={{padding:'32px 12px 0',borderTop:`1px solid ${LINE}`,textAlign:'center'}}>
                      <Link href="/auth/signup" style={{
                        display:'inline-block',
                        padding:'10px 20px',
                        borderRadius:9,
                        background: plan.popular ? CYAN : 'transparent',
                        color: plan.popular ? '#000' : T2,
                        border: plan.popular ? 'none' : `1px solid ${LINE2}`,
                        fontSize:13,
                        fontWeight:700,
                        fontFamily:H,
                        textDecoration:'none',
                        letterSpacing: isAr ? 0 : '-0.02em',
                        whiteSpace:'nowrap',
                        transition:'all 0.2s',
                      }}>
                        {plan.cta}
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ══ FAQ ══ */}
        <section className="sp" style={{padding:'0 40px 100px',maxWidth:780,margin:'0 auto'}}>
          <Reveal>
            <div style={{textAlign:'center',marginBottom:52}}>
              <div style={{fontSize:10,fontFamily:MONO,color:CYAN,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:16,opacity:0.7}}>
                {isAr?'أسئلة شائعة':'FAQ'}
              </div>
              <h2 style={{fontFamily:H,fontWeight:800,fontSize:'clamp(28px,4vw,48px)',letterSpacing:isAr?0:'-0.04em',color:T1,lineHeight:isAr?1.3:1.05}}>
                {isAr?'أسئلة حول الأسعار':'Pricing questions.'}
              </h2>
            </div>
          </Reveal>

          <div style={{borderTop:`1px solid ${LINE}`}}>
            {faqs.map((item, i) => (
              <div key={i} style={{borderBottom:`1px solid ${LINE}`}}>
                <button className="faq-q" onClick={()=>setFaqOpen(faqOpen===i?null:i)}>
                  <span style={{fontSize:15,fontWeight:600,fontFamily:H,color:T1,letterSpacing:isAr?0:'-0.02em',textAlign:isAr?'right':'left'}}>
                    {item.q}
                  </span>
                  <span className="faq-icon" style={{transform:faqOpen===i?'rotate(45deg)':'none'}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </span>
                </button>
                {faqOpen === i && (
                  <div style={{padding:'0 0 20px',animation:'fadeUp 0.25s ease both'}}>
                    <p style={{fontSize:14,color:T3,lineHeight:isAr?1.9:1.8,fontFamily:F,textAlign:isAr?'right':'left'}}>
                      {item.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ══ FINAL CTA ══ */}
        <section className="sp" style={{padding:'40px 40px 120px',textAlign:'center',maxWidth:760,margin:'0 auto'}}>
          <Reveal>
            <div style={{padding:'64px 48px',background:'rgba(0,170,255,0.04)',border:`1px solid rgba(0,170,255,0.18)`,borderRadius:24,position:'relative',overflow:'hidden'}}>
              {/* Glow */}
              <div style={{position:'absolute',top:'-40%',left:'50%',transform:'translateX(-50%)',width:'60%',height:'200%',background:'radial-gradient(ellipse,rgba(0,170,255,0.12) 0%,transparent 70%)',pointerEvents:'none'}}/>

              <div style={{position:'relative'}}>
                <div style={{fontSize:10,fontFamily:MONO,color:CYAN,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:20,opacity:0.7}}>
                  {isAr?'جاهز؟':'Ready?'}
                </div>
                <h2 style={{fontFamily:H,fontWeight:800,fontSize:'clamp(28px,5vw,56px)',letterSpacing:isAr?0:'-0.04em',color:T1,lineHeight:isAr?1.3:1,marginBottom:16}}>
                  {isAr
                    ? <>ابدأ بـ ٢٠٠ رصيد.<br/><span className="grad-text">مجاناً.</span></>
                    : <>Start with 200 credits.<br/><span className="grad-text">On us.</span></>
                  }
                </h2>
                <p style={{fontFamily:isAr?AR:SERIF,fontStyle:isAr?'normal':'italic',fontSize:17,color:T3,marginBottom:36}}>
                  {isAr?'بدون بطاقة ائتمانية. الإعداد في ٣ دقائق.':'No credit card. Setup in 3 minutes.'}
                </p>
                <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
                  <Link href="/auth/signup" style={{
                    display:'inline-block',padding:'15px 40px',borderRadius:12,
                    background:CYAN,color:'#000',fontSize:15,fontWeight:800,
                    fontFamily:H,textDecoration:'none',letterSpacing:isAr?0:'-0.03em',
                    boxShadow:'0 0 40px rgba(0,170,255,0.2)',transition:'box-shadow 0.3s',
                  }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.boxShadow='0 0 60px rgba(0,170,255,0.35)'}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.boxShadow='0 0 40px rgba(0,170,255,0.2)'}
                  >
                    {isAr?'ابدأ مجاناً ←':'Start free →'}
                  </Link>
                  <Link href="/landing" style={{
                    display:'inline-block',padding:'15px 32px',borderRadius:12,
                    background:'transparent',color:T2,fontSize:14,fontWeight:600,
                    fontFamily:F,textDecoration:'none',border:`1px solid ${LINE2}`,
                    transition:'all 0.2s',
                  }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color=T1;(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.28)'}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color=T2;(e.currentTarget as HTMLElement).style.borderColor=LINE2}}
                  >
                    {isAr?'← العودة للرئيسية':'← Back to home'}
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Footer */}
        <footer style={{borderTop:`1px solid ${LINE}`,padding:'28px 40px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
          <Link href="/landing" style={{fontSize:13,fontFamily:MONO,color:T4,textDecoration:'none'}}>
            {isAr?'→ العودة لـ Nexa':'← Back to Nexa'}
          </Link>
          <span style={{fontSize:12,color:T4,fontFamily:MONO}}>© 2026 Nexa · Dubai, UAE</span>
          <div style={{display:'flex',gap:20}}>
            <Link href="/landing/about"  style={{fontSize:12,color:T4,fontFamily:MONO,textDecoration:'none'}}>{isAr?'عن Nexa':'About'}</Link>
            <Link href="/landing/terms"  style={{fontSize:12,color:T4,fontFamily:MONO,textDecoration:'none'}}>{isAr?'الشروط':'Terms'}</Link>
            <Link href="/landing/privacy" style={{fontSize:12,color:T4,fontFamily:MONO,textDecoration:'none'}}>{isAr?'الخصوصية':'Privacy'}</Link>
          </div>
        </footer>
      </div>
    </div>
  )
}
