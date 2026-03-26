'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLang } from '@/lib/language-context'

/* ─── tokens ─── */
const F       = "'Tajawal', system-ui, sans-serif"
const CYAN    = '#00AAFF'
const CYAN2   = 'rgba(0,170,255,0.12)'
const LINE    = 'rgba(255,255,255,0.07)'
const LINE2   = 'rgba(255,255,255,0.12)'
const T1      = '#FFFFFF'
const T2      = 'rgba(255,255,255,0.65)'
const T3      = 'rgba(255,255,255,0.35)'
const T4      = 'rgba(255,255,255,0.18)'

function useReveal(threshold = 0.15) {
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

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const { ref, visible } = useReveal(0.3)
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!visible) return
    const dur = 1800, steps = 60, inc = to / steps
    let cur = 0
    const t = setInterval(() => {
      cur = Math.min(cur + inc, to); setVal(Math.round(cur))
      if (cur >= to) clearInterval(t)
    }, dur / steps)
    return () => clearInterval(t)
  }, [visible, to])
  return <span ref={ref}>{val.toLocaleString('ar-SA')}{suffix}</span>
}

function Reveal({ children, delay = 0, from = 'bottom', className = '' }: {
  children: React.ReactNode; delay?: number
  from?: 'bottom' | 'left' | 'right' | 'scale'; className?: string
}) {
  const { ref, visible } = useReveal()
  const transforms: Record<string, string> = {
    bottom: 'translateY(48px)', left: 'translateX(-60px)',
    right:  'translateX(60px)', scale: 'scale(0.88) translateY(24px)',
  }
  return (
    <div ref={ref} className={className} style={{
      opacity:   visible ? 1 : 0,
      transform: visible ? 'none' : transforms[from],
      transition:`opacity 0.85s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.85s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

const FAQS = [
  { q:'هل راح يبدو المحتوى وكأنني أنا كتبته؟', a:'أيوه. الدماغ التجاري يتدرّب على كتاباتك الفعلية — نبرتك، مفرداتك، إيقاع جملك، وآراءك. كلما أعطيته أكثر كلما صار أقوى. معظم المستخدمين يوصلون لـ 90%+ توافق صوت خلال أول أسبوع.' },
  { q:'أنا مو تقني — هل راح أقدر أستخدمه؟', a:'Nexa مصممة لأصحاب الأعمال، مو للمطورين. الإعداد يأخذ 3 دقائق. إذا تقدر تكتب رسالة واتساب، تقدر تستخدم Nexa.' },
  { q:'ايش هو الرصيد؟', a:'الأرصدة تشغّل الإنتاج بالذكاء الاصطناعي. منشور يكلّف 3 أرصدة، صورة 5، فيديو قصير 20. المحادثة والاستراتيجية والجدولة مجانية دائماً. الـ 150 رصيد الأولى هدية منّا بدون أي التزام.' },
  { q:'ايش الفرق بين هذا وبين ChatGPT؟', a:'ChatGPT ما يعرف علامتك التجارية، جمهورك، عروضك، ولا استراتيجيتك. Nexa تبني دماغاً تجارياً كاملاً من بيانات عملك — كل ما تنتجه مضبوط على صوتك وأهدافك بالضبط. الفرق بين كاتب عشوائي وشريك يعرفك من سنوات.' },
  { q:'هل تشتغل للوكالات؟', a:'أيوه. خطة الوكالة تعطي كل عميل مساحة عمل مستقلة — دماغ تجاري خاص، اتصالات نشر منفصلة، وسجل محتوى مستقل. كل هذا تديره من لوحة تحكم واحدة.' },
  { q:'هل أقدر أوقف الاشتراك في أي وقت؟', a:'أيوه. بدون عقود، بدون قيود. أوقفه من الإعدادات بنقرة واحدة. تبقى تستخدم الخدمة حتى نهاية فترة الفوترة.' },
]

export default function LandingPageAr() {
  const { setLang } = useLang()
  const [faqOpen,  setFaqOpen]  = useState<number | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [scrollY,  setScrollY]  = useState(0)
  const [mounted,  setMounted]  = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    const onScroll = () => { setScrolled(window.scrollY > 40); setScrollY(window.scrollY) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const mockupTilt = Math.min(scrollY * 0.018, 12)

  return (
    <div dir="rtl" style={{ background:'#080808', color:T1, fontFamily:F, overflowX:'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html:`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes orb-a { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(15%,-18%) scale(1.15)} 66%{transform:translate(-12%,14%) scale(0.90)} }
        @keyframes orb-b { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-18%,12%) scale(0.86)} 70%{transform:translate(14%,-16%) scale(1.12)} }
        @keyframes orb-c { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-10%,20%) scale(1.18)} }
        @keyframes orb-d { 0%,100%{transform:translate(0,0)} 45%{transform:translate(18%,-14%)} 85%{transform:translate(-14%,18%)} }
        @keyframes word-in { from{opacity:0;transform:translateY(60px)} to{opacity:1;transform:translateY(0)} }
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .marquee-track { animation:marquee 32s linear infinite; display:flex; width:max-content; }
        .marquee-track:hover { animation-play-state:paused; }
        @keyframes ring-expand { 0%,100%{opacity:0.3;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.08)} }
        @keyframes grain { 0%,100%{transform:translate(0,0)} 10%{transform:translate(-2%,-3%)} 30%{transform:translate(1%,2%)} 50%{transform:translate(-1%,1%)} 70%{transform:translate(2%,-1%)} 90%{transform:translate(-2%,2%)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes scroll-hint { 0%,100%{transform:translateX(-50%) translateY(0);opacity:0.6} 50%{transform:translateX(-50%) translateY(8px);opacity:1} }
        .nav-link { color:rgba(255,255,255,0.35); text-decoration:none; font-size:15px; font-family:'Tajawal',sans-serif; font-weight:500; transition:color 0.15s; }
        .nav-link:hover { color:#fff; }
        .lift { transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1), border-color 0.2s; }
        .lift:hover { transform:translateY(-4px); }
        .cta-glow { box-shadow:0 0 0 0 rgba(0,170,255,0.4); transition:box-shadow 0.3s; }
        .cta-glow:hover { box-shadow:0 0 40px 8px rgba(0,170,255,0.18), 0 0 0 1px rgba(0,170,255,0.35); }
        .grad-text { background:linear-gradient(135deg,#fff 0%,#00AAFF 60%,#fff 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; background-size:200%; animation:shimmer 4s linear infinite; display:inline-block; unicode-bidi:isolate; direction:ltr; }
        .word-1 { animation:word-in 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
        .word-2 { animation:word-in 0.9s cubic-bezier(0.16,1,0.3,1) 0.3s both; }
        .word-3 { animation:word-in 0.9s cubic-bezier(0.16,1,0.3,1) 0.5s both; }
        @media (max-width:768px) {
          .hero-title { font-size:clamp(42px,12vw,72px) !important; }
          .grid-2 { grid-template-columns:1fr !important; }
          .grid-3 { grid-template-columns:1fr !important; }
          .grid-4 { grid-template-columns:1fr 1fr !important; }
          .nav-links { display:none !important; }
          .sp { padding-left:24px !important; padding-right:24px !important; }
        }
        @media (max-width:480px) {
          .grid-4 { grid-template-columns:1fr !important; }
        }
      `}}/>

      {/* الخلفية */}
      <div style={{ position:'fixed', inset:0, background:'#080808', zIndex:0, overflow:'hidden', pointerEvents:'none' }}>
        <div style={{ position:'absolute', top:'-20%', right:'-15%', width:'80vw', height:'80vw', borderRadius:'50%', background:'radial-gradient(ellipse,rgba(0,170,255,0.14) 0%,transparent 65%)', animation:'orb-a 10s ease infinite', filter:'blur(48px)' }}/>
        <div style={{ position:'absolute', bottom:'-20%', left:'-15%', width:'65vw', height:'65vw', borderRadius:'50%', background:'radial-gradient(ellipse,rgba(0,110,255,0.10) 0%,transparent 65%)', animation:'orb-b 13s ease infinite', filter:'blur(56px)' }}/>
        <div style={{ position:'absolute', top:'35%', right:'45%', width:'50vw', height:'50vw', borderRadius:'50%', background:'radial-gradient(ellipse,rgba(0,200,255,0.07) 0%,transparent 70%)', animation:'orb-c 17s ease infinite', filter:'blur(64px)' }}/>
        <div style={{ position:'absolute', top:'65%', right:'15%', width:'35vw', height:'35vw', borderRadius:'50%', background:'radial-gradient(ellipse,rgba(0,170,255,0.09) 0%,transparent 70%)', animation:'orb-d 11s ease infinite', filter:'blur(40px)' }}/>
        <div style={{ position:'absolute', inset:0, opacity:0.025, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, animation:'grain 8s steps(10) infinite' }}/>
      </div>

      {/* ═══ الشريط العلوي ═══ */}
      <nav style={{ position:'fixed', top:0, right:0, left:0, zIndex:100, height:64, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px', borderBottom:`1px solid ${scrolled?LINE:'transparent'}`, background:scrolled?'rgba(8,8,8,0.92)':'transparent', backdropFilter:scrolled?'blur(24px)':'none', transition:'all 0.35s' }}>
        <Link href="/landing" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none', flexShrink:0 }}>
          <Image src="/favicon.png" alt="Nexa" width={24} height={24} style={{ borderRadius:6 }}/>
          <span style={{ fontFamily:F, fontWeight:900, fontSize:17, color:T1 }}>Nexa</span>
        </Link>
        <div className="nav-links" style={{ display:'flex', alignItems:'center', gap:32, flex:1, justifyContent:'center' }}>
          {[['القصة','#story'],['المميزات','#features'],['الأسعار','#pricing'],['أسئلة','#faq'],['عن Nexa','/landing/about']].map(([l,h])=>(
            <a key={l} href={h} className="nav-link">{l}</a>
          ))}
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexShrink:0 }}>
          <button onClick={() => { setLang('en'); localStorage.setItem('nexa_lang','en') }} style={{ fontFamily:"'DM Sans', sans-serif", fontSize:13, color:'rgba(255,255,255,0.40)', background:'none', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:6, padding:'5px 12px', cursor:'pointer', transition:'color 0.2s, border-color 0.2s', letterSpacing:'0.04em' }} onMouseEnter={e=>{(e.target as HTMLElement).style.color='rgba(255,255,255,0.80)';(e.target as HTMLElement).style.borderColor='rgba(255,255,255,0.25)'}} onMouseLeave={e=>{(e.target as HTMLElement).style.color='rgba(255,255,255,0.40)';(e.target as HTMLElement).style.borderColor='rgba(255,255,255,0.12)'}}>English</button>
          <Link href="/auth/login" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'8px 18px', borderRadius:8, border:`1px solid ${LINE2}`, background:'none', color:T2, fontSize:14, fontFamily:F, fontWeight:500, textDecoration:'none', whiteSpace:'nowrap' }}>دخول</Link>
          <Link href="/auth/signup" className="cta-glow" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'8px 22px', borderRadius:8, background:CYAN, color:'#000', fontSize:14, fontWeight:800, fontFamily:F, textDecoration:'none', whiteSpace:'nowrap' }}>ابدأ مجاناً ←</Link>
        </div>
      </nav>

      {/* ═══════════════════════════
          ١. الهيرو
      ═══════════════════════════ */}
      <section ref={heroRef} className="sp" style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'140px 40px 100px', textAlign:'center', position:'relative', zIndex:1 }}>

        <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'7px 18px', borderRadius:100, border:`1px solid rgba(0,170,255,0.25)`, background:'rgba(0,170,255,0.05)', marginBottom:48, opacity:mounted?1:0, transition:'opacity 0.6s 0.3s', backdropFilter:'blur(12px)' }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80', display:'inline-block', boxShadow:'0 0 8px #4ade80' }}/>
          <span style={{ fontSize:12, fontFamily:F, fontWeight:500, color:T3 }}>وصول مبكر · ١٥٠ رصيد مجاناً · بدون بطاقة</span>
        </div>

        <div className="hero-title" style={{ fontFamily:F, fontWeight:900, fontSize:'clamp(56px,9vw,110px)', lineHeight:1.30, paddingTop:16 }}>
          <div className="word-1" style={{ display:'block', color:T1, overflow:'visible' }}>أنشئ.</div>
          <div className="word-2" style={{ display:'block', color:T1, overflow:'visible' }}>أتمِت.</div>
          <div className="word-3" style={{ display:'block', overflow:'visible' }}><span className="grad-text">تصدّر.</span></div>
        </div>

        <p style={{ fontFamily:F, fontWeight:400, fontSize:'clamp(15px,2vw,19px)', color:T3, maxWidth:560, margin:'36px auto 0', lineHeight:2.0, textAlign:'center', opacity:mounted?1:0, transform:mounted?'none':'translateY(20px)', transition:'all 0.8s 0.8s', display:'block' }}>
          المنصة اللي تتعلّم صوتك، تبني استراتيجيتك، وتنشر محتواك — وأنت تركّز على تطوير أعمالك.
        </p>

        <div style={{ display:'flex', gap:14, justifyContent:'center', marginTop:48, flexWrap:'wrap', opacity:mounted?1:0, transform:mounted?'none':'translateY(20px)', transition:'all 0.8s 1s' }}>
          <Link href="/auth/signup" className="cta-glow" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'15px 38px', borderRadius:10, background:CYAN, color:'#000', fontSize:16, fontWeight:800, fontFamily:F, textDecoration:'none' }}>
            ابدأ مجاناً ← ١٥٠ رصيد هدية
          </Link>
          <a href="#story" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'15px 28px', borderRadius:10, border:`1px solid ${LINE2}`, background:'rgba(255,255,255,0.03)', color:T2, fontSize:16, fontFamily:F, fontWeight:500, textDecoration:'none', backdropFilter:'blur(12px)' }}>
            كيف يشتغل؟
          </a>
        </div>
        <p style={{ fontSize:12, color:T4, marginTop:20, fontFamily:F, opacity:mounted?1:0, transition:'opacity 0.6s 1.2s' }}>
          ٥٠٠ رصيد في الخطط المدفوعة · الإعداد في ٣ دقائق · إلغاء في أي وقت
        </p>

        {/* معاينة اللوحة */}
        <div style={{ position:'relative', zIndex:1, marginTop:80, maxWidth:960, width:'100%', opacity:mounted?1:0, transition:'opacity 0.9s 0.6s', transform:`perspective(1200px) rotateX(${mockupTilt}deg)`, transformOrigin:'50% 100%' }}>
          <div style={{ position:'absolute', inset:-1, borderRadius:20, background:`linear-gradient(135deg,rgba(0,170,255,0.3),transparent 40%,transparent 60%,rgba(0,170,255,0.15))`, zIndex:-1 }}/>
          <div style={{ background:'rgba(10,10,12,0.95)', border:`1px solid rgba(255,255,255,0.10)`, borderRadius:18, overflow:'hidden', boxShadow:'0 60px 160px rgba(0,0,0,0.9), 0 0 80px rgba(0,170,255,0.08)' }}>
            <div style={{ background:'rgba(15,15,18,1)', borderBottom:`1px solid ${LINE}`, padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ display:'flex', gap:6 }}>
                {['#ff5f57','#ffbd2e','#28c840'].map((c,i)=><div key={i} style={{ width:10, height:10, borderRadius:'50%', background:c, opacity:0.8 }}/>)}
              </div>
              <div style={{ flex:1, background:'rgba(255,255,255,0.05)', borderRadius:6, padding:'4px 12px', fontSize:11, fontFamily:F, color:T4, textAlign:'center' }}>nexaa.cc/dashboard</div>
              <div style={{ width:60 }}/>
            </div>
            <div style={{ padding:'28px 24px 20px', background:'linear-gradient(160deg,#080810 0%,#060608 50%,#090608 100%)', position:'relative', minHeight:440, display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div style={{ position:'absolute', top:-60, right:-20, width:320, height:240, borderRadius:'50%', background:'#4c1d95', filter:'blur(110px)', opacity:0.18, pointerEvents:'none' }}/>
              <div style={{ position:'absolute', top:40, left:40, width:200, height:160, borderRadius:'50%', background:CYAN, filter:'blur(90px)', opacity:0.09, pointerEvents:'none' }}/>
              <div style={{ position:'relative', zIndex:1 }}>
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.10em', textTransform:'uppercase', color:T4, fontFamily:F, marginBottom:5 }}>صباح الخير · لوحة التحكم</div>
                  <div style={{ fontFamily:F, fontSize:26, fontWeight:900, color:T1, lineHeight:1.2 }}>أحمد</div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14 }}>
                  {[{l:'الأرصدة',v:'491',c:CYAN},{l:'توافق الصوت',v:'94%',c:'#4ade80'},{l:'أيام متواصلة',v:'14',c:'#fb923c'}].map((s,i)=>(
                    <div key={i} style={{ padding:'10px 10px', background:'rgba(255,255,255,0.03)', border:`1px solid ${LINE}`, borderRadius:10 }}>
                      <div style={{ fontSize:8, color:T4, fontFamily:F, marginBottom:4, lineHeight:1.4 }}>{s.l}</div>
                      <div style={{ fontFamily:F, fontSize:17, fontWeight:300, color:s.c }}>{s.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding:'12px 14px', background:'rgba(0,170,255,0.05)', border:`1px solid rgba(0,170,255,0.18)`, borderRadius:12, marginBottom:10, position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${CYAN}55,transparent)` }}/>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:T1, fontFamily:F }}>الدماغ التجاري</div>
                      <div style={{ fontSize:9, color:T4, fontFamily:F, marginTop:2 }}>طبقة الذكاء · نشطة</div>
                    </div>
                    <div style={{ position:'relative', width:36, height:36 }}>
                      <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:`1px solid rgba(0,170,255,0.35)`, animation:'ring-expand 2.5s ease infinite' }}/>
                      <div style={{ position:'absolute', inset:4, borderRadius:'50%', border:`1px solid rgba(0,170,255,0.20)`, animation:'ring-expand 2.5s ease infinite 0.5s' }}/>
                      <div style={{ position:'absolute', inset:8, borderRadius:'50%', background:'rgba(0,170,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.5" strokeLinecap="round">
                          <path d="M9.5 2a2.5 2.5 0 0 1 5 0"/><path d="M9.5 22a2.5 2.5 0 0 0 5 0"/>
                          <path d="M14.5 2C17 2 19 4 19 6.5c0 2-1.5 3.5-3.5 4C17 11 19 12.5 19 15c0 2.5-2 4.5-4.5 4.5"/>
                          <path d="M9.5 2C7 2 5 4 5 6.5c0 2 1.5 3.5 3.5 4C7 11 5 12.5 5 15c0 2.5 2 4.5 4.5 4.5"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  {[['اتساق الصوت','98%'],['دقة النبرة','92%'],['توافق المفردات','94%']].map(([l,v],i)=>(
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:10, marginBottom:5 }}>
                      <span style={{ color:T4, fontFamily:F }}>{l}</span>
                      <span style={{ color:CYAN, fontFamily:F, fontWeight:600 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding:'10px 12px', background:'rgba(255,255,255,0.02)', border:`1px solid ${LINE}`, borderRadius:10 }}>
                  <div style={{ fontSize:9, color:T4, fontFamily:F, marginBottom:8 }}>الوكلاء النشطون</div>
                  {[['وكيل المحتوى','يعمل','#4ade80'],['وكيل التوقيت','نشط','#4ade80'],['مراقب الإعلانات','مباشر','#fb923c']].map(([n,s,c],i)=>(
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                      <span style={{ fontSize:10, color:T2, fontFamily:F }}>{n}</span>
                      <span style={{ fontSize:9, color:c, fontFamily:F, fontWeight:600, padding:'2px 7px', background:`${c}14`, borderRadius:4 }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ padding:'12px 14px', background:'rgba(255,255,255,0.03)', border:`1px solid ${LINE}`, borderRadius:12, flex:1 }}>
                  <div style={{ fontSize:9, color:T4, fontFamily:F, marginBottom:10 }}>الاستوديو — قائمة الإنتاج</div>
                  {[
                    {type:'منشور',  platform:'Instagram', status:'جاهز',   color:'#E1306C'},
                    {type:'فيديو',  platform:'TikTok',    status:'يُنتَج', color:'#FF0050'},
                    {type:'رسالة',  platform:'تسلسل',    status:'مجدول',  color:CYAN},
                    {type:'إعلان',  platform:'Meta',      status:'مباشر',  color:'#4ade80'},
                  ].map((item,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', background:i===1?'rgba(0,170,255,0.04)':'transparent', borderRadius:7, marginBottom:3 }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:item.color, flexShrink:0 }}/>
                      <span style={{ fontSize:10, color:T2, fontFamily:F, flex:1 }}>{item.type} · {item.platform}</span>
                      <span style={{ fontSize:9, color:item.status==='مباشر'?'#4ade80':item.status==='يُنتَج'?CYAN:T4, fontFamily:F, fontWeight:600 }}>{item.status}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding:'12px 14px', background:'rgba(255,255,255,0.03)', border:`1px solid ${LINE}`, borderRadius:12 }}>
                  <div style={{ fontSize:9, color:T4, fontFamily:F, marginBottom:10 }}>Amplify · أداء الإعلانات</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                    {[{l:'ROAS',v:'4.2×',c:'#4ade80'},{l:'CTR',v:'3.8%',c:CYAN},{l:'CPL',v:'$4.10',c:'#fb923c'}].map((m,i)=>(
                      <div key={i} style={{ textAlign:'center' as const }}>
                        <div style={{ fontFamily:F, fontSize:15, fontWeight:300, color:m.c }}>{m.v}</div>
                        <div style={{ fontSize:8, color:T4, fontFamily:F, marginTop:2 }}>{m.l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:26, marginTop:10 }}>
                    {[40,55,45,70,60,80,75,90,72,88,95,100].map((h,i)=>(
                      <div key={i} style={{ flex:1, height:`${h}%`, background:i>9?CYAN:`rgba(0,170,255,${0.1+i*0.04})`, borderRadius:2 }}/>
                    ))}
                  </div>
                </div>
                <div style={{ padding:'12px 14px', background:'rgba(255,255,255,0.02)', border:`1px solid ${LINE}`, borderRadius:10 }}>
                  <div style={{ fontSize:9, color:T4, fontFamily:F, marginBottom:8 }}>الإشعارات</div>
                  {[
                    {msg:'الدماغ التجاري تحدّث · 94% توافق', color:'#4ade80'},
                    {msg:'"حملة الربيع" مباشرة على Meta الآن', color:CYAN},
                    {msg:'عميل جديد: sarah@bloom.co استُقطب', color:'#a78bfa'},
                  ].map((n,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5 }}>
                      <div style={{ width:5, height:5, borderRadius:'50%', background:n.color, flexShrink:0 }}/>
                      <span style={{ fontSize:9, color:T3, fontFamily:F }}>{n.msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ position:'absolute', bottom:32, left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:6, opacity:0.4, animation:'scroll-hint 1.8s ease-in-out infinite' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T4} strokeWidth="1.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          <span style={{ fontSize:10, fontFamily:F, color:T4 }}>اسحب للأسفل</span>
        </div>
      </section>

      {/* شريط التمرير */}
      <div style={{ borderTop:`1px solid ${LINE}`, borderBottom:`1px solid ${LINE}`, padding:'14px 0', overflow:'hidden', background:'rgba(0,0,0,0.4)', position:'relative', zIndex:1, backdropFilter:'blur(8px)' }}>
        <div className="marquee-track">
          {[...Array(2)].flatMap(()=>
            ['صوت العلامة التجارية','استوديو المحتوى','نشر تلقائي','تسلسلات البريد','إعلانات Meta','استراتيجية AI','إنتاج الفيديو','استنساخ الصوت','ذكاء المنافسين','استقطاب العملاء','مساحات الوكالات','التحليلات'].map((item,i)=>(
              <div key={`${item}-${i}`} style={{ display:'flex', alignItems:'center', flexShrink:0 }}>
                <span style={{ padding:'0 28px', fontSize:12, fontFamily:F, fontWeight:500, color:T4, whiteSpace:'nowrap' }}>{item}</span>
                <span style={{ color:'rgba(0,170,255,0.30)', fontSize:14 }}>·</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ═══════════════════════════
          ٢. القصة
      ═══════════════════════════ */}
      <section id="story" className="sp" style={{ padding:'120px 40px', maxWidth:1100, margin:'0 auto', position:'relative', zIndex:1 }}>
        <Reveal>
          <div style={{ textAlign:'center', marginBottom:80 }}>
            <div style={{ fontSize:11, fontFamily:F, fontWeight:600, color:T4, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:20 }}>القصة اللي تعرفها</div>
            <h2 style={{ fontFamily:F, fontWeight:900, fontSize:'clamp(28px,4.5vw,52px)', color:T1, lineHeight:1.45, marginBottom:0 }}>
              أنت شاطر فيما تسويه.<br/>
              <span style={{ color:T3, fontSize:'clamp(22px,3.5vw,42px)', display:'block', marginTop:8 }}>المحتوى ما المفروض يكون وظيفة ثانية.</span>
            </h2>
          </div>
        </Reveal>
        <div className="grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, background:LINE, borderRadius:16, overflow:'hidden' }}>
          {[
            { from:'left' as const,   delay:0,   color:'rgba(239,68,68,0.5)',   title:'عندك ما تقوله.', sub:'بس ما عندك وقت تقوله.', body:'كل يوم عندك أفكار — رؤى، آراء، وأشياء يحتاجها عملاؤك. بس بين خدمة العملاء وإدارة الأعمال والحياة، المحتوى هو أول شيء يُؤجَّل. والغد اللي ما يجي أبداً.' },
            { from:'bottom' as const, delay:100, color:'rgba(245,158,11,0.5)',  title:'جرّبت ChatGPT.', sub:'ما بدا وكأنك أنت.', body:'الأدوات العامة تنتج مخرجات عامة. تمضي وقتاً أطول في تعديل ما أنتجه الذكاء الاصطناعي مما كان ليأخذه لو كتبته بنفسك. المشكلة مو في التقنية — المشكلة أن التقنية ما تعرفك.' },
            { from:'right' as const,  delay:200, color:'rgba(239,68,68,0.5)',   title:'تنشر أسبوعين.', sub:'ثم تختفي لثلاثة.', body:'عدم الانتظام يقتل نمو جمهورك. منافسيك اللي ينشرون بانتظام — حتى لو محتواهم أقل من محتواك — يفوزون. مو لأنهم أفضل. لأنهم يظهرون.' },
          ].map(({ from, delay, title, sub, body, color }) => (
            <Reveal key={title} from={from} delay={delay}>
              <div className="lift" style={{ background:'#0A0A0A', padding:'44px 32px', height:'100%', borderTop:`2px solid ${color}` }}>
                <div style={{ fontFamily:F, fontWeight:800, fontSize:21, color:T1, marginBottom:10, lineHeight:1.35 }}>{title}</div>
                <div style={{ fontFamily:F, fontWeight:400, fontSize:15, color:T3, marginBottom:22, lineHeight:1.65 }}>{sub}</div>
                <p style={{ fontSize:14, color:T3, lineHeight:1.9, fontFamily:F, fontWeight:400 }}>{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={300}>
          <div style={{ textAlign:'center', marginTop:60 }}>
            <p style={{ fontFamily:F, fontWeight:600, fontSize:'clamp(19px,3vw,26px)', color:T2, maxWidth:580, margin:'0 auto', lineHeight:1.7 }}>
              Nexa تحلّ الثلاثة. مو بحيل. بنظام يتعلّم منك أنت.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════════════
          ٣. المميزات
      ═══════════════════════════ */}
      <section id="features" style={{ position:'relative', zIndex:1 }}>

        {/* الدماغ التجاري */}
        <div className="sp" style={{ padding:'80px 40px', maxWidth:1100, margin:'0 auto' }}>
          <div className="grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center' }}>
            <Reveal from="right">
              <div>
                <div style={{ fontSize:11, fontFamily:F, fontWeight:700, color:CYAN, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:20, opacity:0.8 }}>٠١ — من هنا تبدأ</div>
                <h2 style={{ fontFamily:F, fontWeight:900, fontSize:'clamp(30px,4.5vw,50px)', color:T1, lineHeight:1.35, marginBottom:22 }}>Nexa تتعلّم<br/>تفكّر مثلك.</h2>
                <p style={{ fontFamily:F, fontWeight:400, fontSize:17, color:T3, marginBottom:22, lineHeight:1.9 }}>
                  ارفع محتواك السابق، موقعك، أو وثيقة علامتك التجارية. الدماغ التجاري يقرأ كل شيء ويبني نموذجاً لصوتك — نبرتك، إيقاع جملك، آراؤك، وطريقتك في رؤية العالم.
                </p>
                <p style={{ fontSize:14, color:T3, lineHeight:1.9, fontFamily:F, fontWeight:400, marginBottom:26 }}>
                  معظم أدوات الذكاء الاصطناعي تجعلك تبدو مثل الجميع. الدماغ التجاري يجعلك تبدو مثل أفضل نسخة منك — واضح، واثق، ودائماً في صلب الموضوع.
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {['يتدرّب على كتاباتك ومفرداتك بالضبط','يتعلّم جمهورك، عروضك، وتموضعك','يضبط النبرة — واثقة بدون غرور','يصقل نفسه في كل مرة تنتج محتوى جديداً'].map(f=>(
                    <div key={f} style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:14, fontFamily:F, fontWeight:400, color:T2 }}>
                      <span style={{ color:CYAN, flexShrink:0, marginTop:3 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></span>{f}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal from="left" delay={150}>
              <div style={{ position:'relative', height:360, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {[0,1,2,3].map(i=>(
                  <div key={i} style={{ position:'absolute', width:280+i*70, height:280+i*70, borderRadius:'50%', border:`1px solid rgba(0,170,255,${0.18-i*0.04})`, animation:`ring-expand ${2.5+i*0.6}s ease infinite ${i*0.4}s` }}/>
                ))}
                <div style={{ width:120, height:120, borderRadius:'50%', background:'radial-gradient(circle at 35% 35%,rgba(0,170,255,0.35) 0%,rgba(0,170,255,0.08) 60%,transparent 100%)', border:`1px solid rgba(0,170,255,0.4)`, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', zIndex:2, boxShadow:`0 0 60px rgba(0,170,255,0.20)` }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.2" strokeLinecap="round">
                    <path d="M9.5 2a2.5 2.5 0 0 1 5 0"/><path d="M9.5 22a2.5 2.5 0 0 0 5 0"/>
                    <path d="M14.5 2C17 2 19 4 19 6.5c0 2-1.5 3.5-3.5 4C17 11 19 12.5 19 15c0 2.5-2 4.5-4.5 4.5"/>
                    <path d="M9.5 2C7 2 5 4 5 6.5c0 2 1.5 3.5 3.5 4C7 11 5 12.5 5 15c0 2.5 2 4.5 4.5 4.5"/>
                  </svg>
                </div>
                {[{label:'الصوت',angle:0},{label:'النبرة',angle:72},{label:'الجمهور',angle:144},{label:'العروض',angle:216},{label:'الأهداف',angle:288}].map(({label,angle})=>{
                  const rad=(angle-90)*Math.PI/180, r=150, x=Math.cos(rad)*r, y=Math.sin(rad)*r
                  return (
                    <div key={label} style={{ position:'absolute', left:`calc(50% + ${x}px)`, top:`calc(50% + ${y}px)`, transform:'translate(-50%,-50%)', padding:'5px 14px', background:'rgba(10,10,14,0.90)', border:`1px solid rgba(0,170,255,0.25)`, borderRadius:20, fontSize:12, fontFamily:F, fontWeight:600, color:CYAN, whiteSpace:'nowrap', backdropFilter:'blur(8px)' }}>{label}</div>
                  )
                })}
                <div style={{ position:'absolute', bottom:10, left:20, padding:'10px 16px', background:'rgba(0,170,255,0.08)', border:`1px solid rgba(0,170,255,0.25)`, borderRadius:12, textAlign:'center' as const, backdropFilter:'blur(12px)' }}>
                  <div style={{ fontFamily:F, fontSize:28, fontWeight:300, color:CYAN }}>94%</div>
                  <div style={{ fontSize:9, color:T4, fontFamily:F, marginTop:2 }}>توافق الصوت</div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        <div style={{ width:1, height:80, background:'linear-gradient(to bottom,transparent,rgba(0,170,255,0.25),transparent)', margin:'0 auto' }}/>

        {/* الاستوديو */}
        <div className="sp" style={{ padding:'80px 40px', maxWidth:1100, margin:'0 auto' }}>
          <div className="grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center' }}>
            <Reveal from="right" delay={100}>
              <div>
                <div style={{ fontSize:11, fontFamily:F, fontWeight:700, color:CYAN, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:20, opacity:0.8 }}>٠٢ — ثم تنشئ</div>
                <h2 style={{ fontFamily:F, fontWeight:900, fontSize:'clamp(30px,4.5vw,50px)', color:T1, lineHeight:1.35, marginBottom:22 }}>كل تنسيق.<br/>كل منصة.<br/>كله بصوتك.</h2>
                <p style={{ fontFamily:F, fontWeight:400, fontSize:17, color:T3, marginBottom:24, lineHeight:1.9 }}>
                  منشورات. صور. فيديوهات. تسجيلات صوتية. إعلانات. رسائل بريد. كلها تُنتَج من الاستوديو — وكل مخرج يبدو وكأنك أنت كتبته، مو روبوت يتظاهر بأنه أنت.
                </p>
                <div style={{ padding:'16px 18px', background:CYAN2, border:`1px solid rgba(0,170,255,0.20)`, borderRadius:12, marginBottom:20 }}>
                  <div style={{ fontSize:13, fontFamily:F, fontWeight:700, color:CYAN, marginBottom:12 }}>تكلفة الأرصدة</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 16px' }}>
                    {[['منشور / تعليق','٢-٣ أرصدة'],['صورة','٥ أرصدة'],['فيديو قصير (٨ ثواني)','١٠ أرصدة'],['فيديو كامل (١٦ ثانية)','٢٠ رصيداً'],['صوت (٣٠ ثانية)','٥ أرصدة'],['بريد / إعلان','٥ أرصدة']].map(([l,c])=>(
                      <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:T3, fontFamily:F }}>
                        <span>{l}</span><span style={{ color:CYAN, fontWeight:600 }}>{c}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize:11, color:T4, fontFamily:F, marginTop:10 }}>الاستراتيجية والمحادثة والجدولة مجانية دائماً.</div>
                </div>
              </div>
            </Reveal>
            <Reveal from="left" delay={100}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[
                  {type:'منشور',        platform:'Instagram', color:'#E1306C', preview:'مباشر، بلا حشو، واثق. ٣ جمل موجزة. دعوة للتفاعل تحوّل فعلاً...'},
                  {type:'سكريبت فيديو', platform:'TikTok',    color:'#FF0050', preview:'الهوك: "معظم الناس مخطئون في هذا..." — ٦٠ ثانية بأسلوبك...'},
                  {type:'رسالة بريد',   platform:'تسلسل',    color:CYAN,      preview:'الموضوع: الشيء الواحد اللي منافسيك ما يسوونه...'},
                  {type:'إعلان',        platform:'Meta',      color:'#4ade80', preview:'العنوان: وقّف الدفع لمحتوى ما يحوّل...'},
                  {type:'صورة',         platform:'LinkedIn',  color:'#0A66C2', preview:'تصميم يتسق مع علامتك — ألوانك، خطوطك، أسلوبك...'},
                  {type:'تسجيل صوتي',  platform:'بودكاست',  color:'#fb923c', preview:'٦٠ ثانية بصوتك وإيقاعك بالضبط...'},
                ].map((item,i)=>(
                  <Reveal key={item.type} delay={i*60} from="scale">
                    <div className="lift" style={{ padding:'16px', background:'rgba(255,255,255,0.03)', border:`1px solid ${LINE}`, borderRadius:12 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                        <div style={{ width:26, height:26, borderRadius:7, background:item.color, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {item.type==='منشور'        && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>}
                          {item.type==='سكريبت فيديو'&& <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>}
                          {item.type==='رسالة بريد'  && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
                          {item.type==='إعلان'        && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
                          {item.type==='صورة'         && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>}
                          {item.type==='تسجيل صوتي'  && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
                        </div>
                        <div>
                          <div style={{ fontSize:12, fontWeight:700, color:T1, fontFamily:F }}>{item.type}</div>
                          <div style={{ fontSize:10, color:T4, fontFamily:F }}>{item.platform}</div>
                        </div>
                      </div>
                      <p style={{ fontSize:11, color:T4, lineHeight:1.7, fontFamily:F }}>{item.preview}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </Reveal>
          </div>
        </div>

        <div style={{ width:1, height:80, background:'linear-gradient(to bottom,transparent,rgba(0,170,255,0.25),transparent)', margin:'0 auto' }}/>

        {/* الاستراتيجية */}
        <div className="sp" style={{ padding:'80px 40px', maxWidth:1100, margin:'0 auto' }}>
          <div className="grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center' }}>
            <Reveal from="right">
              <div>
                <div style={{ fontSize:11, fontFamily:F, fontWeight:700, color:CYAN, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:20, opacity:0.8 }}>٠٣ — ثم تخطّط</div>
                <h2 style={{ fontFamily:F, fontWeight:900, fontSize:'clamp(30px,4.5vw,50px)', color:T1, lineHeight:1.35, marginBottom:22 }}>خطة ٣٠ يوم.<br/>تُبنى في ثوانٍ.<br/>تنشر تلقائياً.</h2>
                <p style={{ fontFamily:F, fontWeight:400, fontSize:17, color:T3, marginBottom:24, lineHeight:1.9 }}>
                  أخبر Nexa بأهدافك. تبني لك جدول محتوى كامل — المواضيع، التنسيقات، أوقات النشر، توزيع المنصات — كله مضبوط على جمهورك وبيئتك التنافسية.
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {['جدول محتوى ٣٠ يوم بالذكاء الاصطناعي','أفضل أوقات النشر حسب المنصة والجمهور','محاور موضوعية تبني سلطتك في مجالك','نشر تلقائي على Instagram وLinkedIn وX وTikTok'].map(f=>(
                    <div key={f} style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:14, fontFamily:F, fontWeight:400, color:T2 }}>
                      <span style={{ color:'#4ade80', flexShrink:0, marginTop:3 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></span>{f}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal from="left" delay={150}>
              <div style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${LINE}`, borderRadius:16, padding:24, position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${CYAN}40,transparent)` }}/>
                <div style={{ fontSize:10, color:T4, fontFamily:F, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:16 }}>جدول المحتوى — مارس</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:6 }}>
                  {['إث','ثل','أر','خم','جم','سب','أح'].map(d=>(
                    <div key={d} style={{ textAlign:'center', fontSize:9, color:T4, fontFamily:F }}>{d}</div>
                  ))}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
                  {Array.from({length:31},(_,i)=>{
                    const scheduled=[1,3,5,8,10,12,15,17,19,22,24,26,29,31].includes(i+1)
                    const today=i+1===18
                    const colors:Record<number,string>={1:'#E1306C',3:CYAN,5:'#4ade80',8:'#0A66C2',10:'#E1306C',12:CYAN,15:'#4ade80',17:'#0A66C2',19:CYAN,22:'#E1306C',24:'#4ade80',26:CYAN,29:'#0A66C2',31:'#4ade80'}
                    return (
                      <div key={i} style={{ aspectRatio:'1/1', borderRadius:6, background:today?'rgba(0,170,255,0.15)':scheduled?`${colors[i+1]}18`:'rgba(255,255,255,0.02)', border:`1px solid ${today?'rgba(0,170,255,0.45)':scheduled?`${colors[i+1]}40`:LINE}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontSize:9, fontFamily:F, color:today?CYAN:scheduled?colors[i+1]:T4 }}>
                        {i+1}{scheduled&&<div style={{ width:4, height:4, borderRadius:'50%', background:colors[i+1], marginTop:2 }}/>}
                      </div>
                    )
                  })}
                </div>
                <div style={{ marginTop:14, display:'flex', gap:10, flexWrap:'wrap' as const }}>
                  {[['#E1306C','Instagram'],['#0A66C2','LinkedIn'],['#FF0050','TikTok'],[CYAN,'X']].map(([color,label],i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, color:T4, fontFamily:F }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:color }}/>{label}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        <div style={{ width:1, height:80, background:'linear-gradient(to bottom,transparent,rgba(0,170,255,0.25),transparent)', margin:'0 auto' }}/>

        {/* الأتمتة */}
        <div className="sp" style={{ padding:'80px 40px 100px', maxWidth:1100, margin:'0 auto' }}>
          <Reveal>
            <div style={{ textAlign:'center', marginBottom:56 }}>
              <div style={{ fontSize:11, fontFamily:F, fontWeight:700, color:CYAN, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:16, opacity:0.8 }}>٠٤ — ثم تشتغل وحدها</div>
              <h2 style={{ fontFamily:F, fontWeight:900, fontSize:'clamp(30px,5vw,58px)', color:T1, lineHeight:1.3, marginBottom:18 }}>تسويق يشتغل<br/>وأنت نايم.</h2>
              <p style={{ fontFamily:F, fontWeight:400, fontSize:17, color:T3, maxWidth:480, margin:'0 auto', lineHeight:1.9 }}>وكلاء أذكياء. تسلسلات بريد. أتمتة كاملة. اضبطها مرة واحدة. لا تتوقف أبداً.</p>
            </div>
          </Reveal>
          <div className="grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <Reveal from="right" delay={100}>
              <div className="lift" style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${LINE}`, borderRadius:16, padding:28, height:'100%' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:CYAN2, border:`1px solid rgba(0,170,255,0.25)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.5" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:T1, fontFamily:F }}>تسلسلات البريد</div>
                    <div style={{ fontSize:11, color:T4, fontFamily:F }}>تُكتب بصوتك. تُرسَل تلقائياً.</div>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {[{d:'اليوم ١',s:'مرحباً — السبب اللي خلّاني أبني هذا',o:'68%'},{d:'اليوم ٣',s:'الخطأ اللي 90% من الرواد يقعون فيه',o:'54%'},{d:'اليوم ٥',s:'كيف ضاعفت إيراداتي في ٦ أشهر',o:'61%'},{d:'اليوم ٧',s:'العرض — ولماذا أنت جاهز الآن',o:'41%'},{d:'اليوم ١٠',s:'آخر فرصة — بدون أي ضغط',o:'38%'}].map((item,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:'rgba(255,255,255,0.02)', border:`1px solid ${LINE}`, borderRadius:8 }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', background:CYAN2, border:`1px solid rgba(0,170,255,0.25)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontFamily:F, fontWeight:700, color:CYAN, flexShrink:0 }}>{i+1}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:10, fontWeight:600, color:T4, fontFamily:F }}>{item.d}</div>
                        <div style={{ fontSize:12, color:T2, fontFamily:F, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.s}</div>
                      </div>
                      <div style={{ fontSize:10, color:'#4ade80', fontFamily:F, fontWeight:600, flexShrink:0 }}>{item.o}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(74,222,128,0.05)', border:'1px solid rgba(74,222,128,0.15)', borderRadius:8, fontSize:12, color:'#4ade80', fontFamily:F, lineHeight:1.7 }}>
                  كل عميل جديد يدخل التسلسل تلقائياً. ما راح تتابع يدوياً مرة ثانية.
                </div>
              </div>
            </Reveal>
            <Reveal from="left" delay={150}>
              <div className="lift" style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${LINE}`, borderRadius:16, padding:28, height:'100%' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:'rgba(167,139,250,0.10)', border:'1px solid rgba(167,139,250,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:T1, fontFamily:F }}>الوكلاء الأذكياء</div>
                    <div style={{ fontSize:11, color:T4, fontFamily:F }}>فريق تسويقك اللي ما ينام.</div>
                  </div>
                </div>
                {[
                  {name:'وكيل المحتوى',    action:'أنشأ ٣ منشورات لليوم',                      time:'منذ دقيقتين', color:'#4ade80', active:true},
                  {name:'وكيل التوقيت',    action:'أفضل وقت: الثلاثاء ٩ص، الجمعة ٧م',         time:'منذ ساعة',    color:CYAN,      active:true},
                  {name:'مراقب المنافسين', action:'تنبيه: منافس أطلق عرضاً جديداً',            time:'منذ ٣ ساعات', color:'#fb923c', active:true},
                  {name:'وكيل التحليلات', action:'الملخص الأسبوعي جاهز — ٤١K وصول',           time:'صباحاً',      color:'#a78bfa', active:true},
                  {name:'مراقب الإعلانات',action:'نسبة النقر ارتفعت ٢٤% عن الأسبوع الماضي', time:'أمس',         color:'#4ade80', active:false},
                ].map((agent,i)=>(
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px', background:'rgba(255,255,255,0.02)', border:`1px solid ${LINE}`, borderRadius:8, marginBottom:6 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:agent.color, marginTop:4, flexShrink:0, boxShadow:agent.active?`0 0 6px ${agent.color}`:'none' }}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:T2, fontFamily:F }}>{agent.name}</div>
                      <div style={{ fontSize:11, color:T4, fontFamily:F, marginTop:2 }}>{agent.action}</div>
                    </div>
                    <div style={{ fontSize:9, color:T4, fontFamily:F, flexShrink:0 }}>{agent.time}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>

        <div style={{ width:1, height:80, background:'linear-gradient(to bottom,transparent,rgba(0,170,255,0.25),transparent)', margin:'0 auto' }}/>

        {/* استقطاب العملاء + التحليلات */}
        <div className="sp" style={{ padding:'80px 40px', maxWidth:1100, margin:'0 auto' }}>
          <div className="grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <Reveal from="right" delay={100}>
              <div className="lift" style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${LINE}`, borderRadius:16, padding:28, position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${CYAN}55,transparent)` }}/>
                <div style={{ fontSize:11, fontFamily:F, fontWeight:700, color:CYAN, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:16, opacity:0.8 }}>٠٥ — استقطاب العملاء</div>
                <h3 style={{ fontFamily:F, fontWeight:800, fontSize:24, color:T1, marginBottom:14, lineHeight:1.4 }}>حوّل المتابعين<br/>لعملاء محتملين.</h3>
                <p style={{ fontSize:13, color:T3, fontFamily:F, lineHeight:1.9, marginBottom:18 }}>
                  صفحتك على Nexa تعيش على nexaa.cc/اسمك. ضعها في البايو. كل زائر يُستقطب تلقائياً — يُضاف لتسلسل بريدك ويُتابَع معه بدون أي تدخل منك.
                </p>
                <div style={{ padding:'16px', background:'rgba(255,255,255,0.02)', border:`1px solid ${LINE}`, borderRadius:10 }}>
                  <div style={{ fontSize:10, color:T4, fontFamily:F, marginBottom:10 }}>nexaa.cc/ahmed → نموذج عملاء مباشر</div>
                  {['الاسم الكامل','البريد الإلكتروني','ما أكبر تحدٍّ يواجهك؟'].map((ph,i)=>(
                    <div key={i} style={{ marginBottom:8 }}>
                      <div style={{ height:36, background:'rgba(255,255,255,0.04)', border:`1px solid ${LINE2}`, borderRadius:7, padding:'0 14px', display:'flex', alignItems:'center', fontSize:12, color:T4, fontFamily:F }}>{ph}</div>
                    </div>
                  ))}
                  <div style={{ height:38, background:CYAN, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#000', fontFamily:F, cursor:'pointer' }}>احصل على الدليل المجاني ←</div>
                </div>
                <div style={{ marginTop:12, fontSize:12, color:'#4ade80', fontFamily:F, fontWeight:500 }}>↑ ٣ عملاء جدد استُقطبوا اليوم · دخلوا التسلسل تلقائياً</div>
              </div>
            </Reveal>
            <Reveal from="left" delay={150}>
              <div className="lift" style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${LINE}`, borderRadius:16, padding:28, position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,rgba(74,222,128,0.55),transparent)' }}/>
                <div style={{ fontSize:11, fontFamily:F, fontWeight:700, color:'#4ade80', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:16, opacity:0.8 }}>٠٦ — التحليلات</div>
                <h3 style={{ fontFamily:F, fontWeight:800, fontSize:24, color:T1, marginBottom:14, lineHeight:1.4 }}>شوف ايش فعلاً<br/>يشتغل.</h3>
                <p style={{ fontSize:13, color:T3, fontFamily:F, lineHeight:1.9, marginBottom:18 }}>
                  كل بيانات أدائك في نظرة واحدة. ظهور، تفاعل، نمو المتابعين، ونسب فتح البريد. اضغط "اشرح بالذكاء" وNexa تخبرك بالضبط ايش تسوي الأسبوع القادم.
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
                  {[{l:'إجمالي الظهور',v:'41.2K',c:CYAN,trend:'+18%'},{l:'التفاعل',v:'3,840',c:'#a78bfa',trend:'+24%'},{l:'متابعون جدد',v:'+312',c:'#4ade80',trend:'+31%'},{l:'فتح البريد',v:'54%',c:'#fb923c',trend:'+8%'}].map((s,i)=>(
                    <div key={i} style={{ padding:'12px', background:'rgba(255,255,255,0.03)', border:`1px solid ${LINE}`, borderRadius:10 }}>
                      <div style={{ fontSize:9, color:T4, fontFamily:F, marginBottom:4 }}>{s.l}</div>
                      <div style={{ fontFamily:F, fontSize:20, fontWeight:300, color:s.c, lineHeight:1 }}>{s.v}</div>
                      <div style={{ fontSize:11, color:s.c, fontFamily:F, fontWeight:600, marginTop:4 }}>{s.trend}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:14, padding:'12px 14px', background:'rgba(255,255,255,0.02)', border:`1px solid ${LINE}`, borderRadius:8, fontSize:12, color:T3, fontFamily:F, lineHeight:1.8 }}>
                  «منشورات الثلاثاء تتفوق باستمرار. ضاعف الخميس — جمهورك موجود لكنك ما تنشر.»
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════
          ٤. الأرقام
      ═══════════════════════════ */}
      <section style={{ padding:'100px 40px', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <Reveal>
            <div style={{ textAlign:'center', marginBottom:64 }}>
              <h2 style={{ fontFamily:F, fontWeight:900, fontSize:'clamp(32px,5vw,54px)', color:T1, marginBottom:14, lineHeight:1.25 }}>بُني للبناة.</h2>
              <p style={{ fontFamily:F, fontWeight:400, fontSize:18, color:T3 }}>النتائج تتكلم بنفسها.</p>
            </div>
          </Reveal>
          <div className="grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, background:LINE, borderRadius:16, overflow:'hidden' }}>
            {[
              {num:2400, suffix:'+', label:'شركة وعمل تجاري على Nexa',        sub:'ويزداد كل يوم',                  color:CYAN},
              {num:94,   suffix:'%', label:'يُبلّغون بانتظام أكبر في النشر', sub:'خلال أول ٣٠ يوم',                color:'#4ade80'},
              {num:12,   suffix:'×', label:'أسرع في إنتاج المحتوى',           sub:'مقارنة بالكتابة من الصفر',       color:'#fb923c'},
            ].map(({num,suffix,label,sub,color})=>(
              <Reveal key={label} from="scale">
                <div style={{ background:'#080808', padding:'52px 36px', textAlign:'center' as const }}>
                  <div style={{ fontFamily:F, fontWeight:300, fontSize:'clamp(44px,7vw,72px)', color, lineHeight:1, animation:'float 4s ease-in-out infinite' }}>
                    <Counter to={num}/>{suffix}
                  </div>
                  <div style={{ fontSize:15, color:T2, marginTop:14, fontFamily:F, fontWeight:700, lineHeight:1.4 }}>{label}</div>
                  <div style={{ fontSize:12, color:T4, marginTop:6, fontFamily:F }}>{sub}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════
          ٥. آراء المستخدمين
      ═══════════════════════════ */}
      <section style={{ padding:'80px 40px', maxWidth:1100, margin:'0 auto', position:'relative', zIndex:1 }}>
        <Reveal>
          <div style={{ textAlign:'center', marginBottom:64 }}>
            <div style={{ fontSize:11, fontFamily:F, fontWeight:600, color:T4, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:16 }}>أشخاص حقيقيون. نتائج حقيقية.</div>
            <h2 style={{ fontFamily:F, fontWeight:900, fontSize:'clamp(30px,5vw,50px)', color:T1, lineHeight:1.35 }}>
              ايش يصير لمّا تتوقف<br/>عن المعاناة مع المحتوى.
            </h2>
          </div>
        </Reveal>
        <div className="grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          {[
            {name:'لينا فيشر',    role:'مؤسسة، Bloom Skincare',    body:'أنشر في أسبوع مع Nexa أكثر مما كنت أنشره في شهر. والغريب أنه يبدو أكثر مني مما حين كنت أكتبه بيدي.',      avatar:'LF', color:CYAN},
            {name:'ماركس ريد',    role:'رئيس تنفيذي، Reed Capital',body:'ذكاء المنافسين وحده يستحق الاشتراك. معرفة ما يشتغل للمنافسين في الوقت الفعلي ميزة غير عادلة.',          avatar:'MR', color:'#4ade80'},
            {name:'عائشة أوكونكو',role:'مديرة تسويق، Zenith',      body:'ندير ٢٢ علامة تجارية لعملائنا على خطة الوكالة. استبدلت ثلاث أدوات وموظفاً بدوام كامل.',                  avatar:'AO', color:'#a78bfa'},
            {name:'توم باور',     role:'مستشار مستقل',             body:'وصولي على LinkedIn انتقل من ٨٠٠ لـ ٤١,٠٠٠ ظهور شهرياً. Nexa تدير محتواي وأنا نايم.',                   avatar:'TB', color:'#fb923c'},
            {name:'بريا نير',     role:'مؤسسة متجر إلكتروني',     body:'تسلسلات البريد هي الجوهرة الحقيقية. أعددناها مرة واحدة وتحوّل تلقائياً كل أسبوع.',                      avatar:'PN', color:CYAN},
            {name:'جيمس أولوولي', role:'صاحب وكالة',              body:'عملاؤنا كانوا يتركوننا حين يتباطأ المحتوى. الآن Nexa تبقي الخط مليئاً. الإلغاءات انخفضت ٦٠%.',          avatar:'JO', color:'#4ade80'},
          ].map(({name,role,body,avatar,color},i)=>(
            <Reveal key={name} delay={i*60} from={i%3===0?'right':i%3===2?'left':'bottom'}>
              <div className="lift" style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${LINE}`, borderRadius:14, padding:'28px 24px', height:'100%' }}>
                <p style={{ fontSize:14, fontFamily:F, fontWeight:400, color:T2, lineHeight:1.9, marginBottom:22 }}>"{body}"</p>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:38, height:38, borderRadius:'50%', background:`${color}18`, border:`1px solid ${color}35`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontFamily:F, fontWeight:700, color, flexShrink:0 }}>{avatar}</div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, fontFamily:F, color:T1 }}>{name}</div>
                    <div style={{ fontSize:11, color:T4, fontFamily:F, marginTop:2 }}>{role}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════
          ٦. الأسعار
      ═══════════════════════════ */}
      <section id="pricing" style={{ padding:'100px 40px', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <Reveal>
            <div style={{ textAlign:'center', marginBottom:64 }}>
              <div style={{ fontSize:11, fontFamily:F, fontWeight:600, color:T4, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:16 }}>الأسعار</div>
              <h2 style={{ fontFamily:F, fontWeight:900, fontSize:'clamp(34px,5.5vw,62px)', color:T1, marginBottom:14, lineHeight:1.25 }}>بسيط. واضح. يكبر معك.</h2>
              <p style={{ fontFamily:F, fontWeight:400, fontSize:17, color:T3, lineHeight:1.8 }}>ابدأ مجاناً. طوّر حين تكون جاهزاً. ألغِ في أي وقت.</p>
            </div>
          </Reveal>
          <div className="grid-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24, paddingTop:16 }}>
            {[
              {id:'spark', name:'Spark', tagline:'للمبدع',  price:49,  credits:1000,  color:'rgba(255,255,255,0.65)', popular:false, trial:'٢٠٠ رصيد مجاناً للبدء', cta:'ابدأ بـ Spark'},
              {id:'grow',  name:'Grow',  tagline:'للنمو',   price:89,  credits:3000,  color:CYAN,                    popular:true,  trial:null,                    cta:'ابدأ بـ Grow'},
              {id:'scale', name:'Scale', tagline:'للتوسع',  price:169, credits:7000,  color:'#a78bfa',               popular:false, trial:null,                    cta:'ابدأ بـ Scale'},
              {id:'agency',name:'Agency',tagline:'للوكالة', price:349, credits:20000, color:'#fb923c',               popular:false, trial:null,                    cta:'ابدأ بـ Agency'},
            ].map((plan,i)=>(
              <Reveal key={plan.id} delay={i*80} from="scale">
                <div className="lift" style={{ background:plan.popular?'rgba(0,170,255,0.06)':'rgba(255,255,255,0.02)', border:`1px solid ${plan.popular?'rgba(0,170,255,0.30)':LINE}`, borderRadius:16, padding:'32px 22px', position:'relative', height:'100%' }}>
                  {plan.popular&&<div style={{ position:'absolute', top:-1, left:'50%', transform:'translateX(-50%)', fontSize:10, fontFamily:F, fontWeight:800, color:'#000', padding:'4px 14px', background:CYAN, borderRadius:'0 0 8px 8px', whiteSpace:'nowrap', direction:'rtl' }}>الأكثر اختياراً</div>}
                  {plan.trial&&<div style={{ fontSize:10, fontFamily:F, fontWeight:600, color:'#4ade80', padding:'3px 10px', background:'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.20)', borderRadius:6, display:'inline-block', marginBottom:14 }}>{plan.trial}</div>}
                  <div style={{ fontFamily:F, fontWeight:900, fontSize:20, color:plan.popular?CYAN:T1, marginBottom:4 }}>{plan.name}</div>
                  <div style={{ fontSize:12, color:T4, fontFamily:F, marginBottom:20 }}>{plan.tagline}</div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:6 }}>
                    <span style={{ fontFamily:F, fontWeight:300, fontSize:40, color:T1, lineHeight:1 }}>${plan.price}</span>
                    <span style={{ fontSize:13, color:T4, fontFamily:F }}>/شهر</span>
                  </div>
                  <div style={{ fontSize:12, fontFamily:F, fontWeight:600, color:plan.color, marginBottom:22 }}>{plan.credits.toLocaleString('ar-SA')} رصيد/شهر</div>
                  <Link href="/auth/signup" style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'12px', borderRadius:9, background:plan.popular?CYAN:'transparent', color:plan.popular?'#000':T2, border:plan.popular?'none':`1px solid ${LINE2}`, fontSize:14, fontWeight:800, fontFamily:F, textDecoration:'none', transition:'all 0.2s' }}>
                    {plan.cta}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div style={{ textAlign:'center' }}>
              <Link href="/landing/pricing" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 24px', background:'rgba(255,255,255,0.03)', border:`1px solid ${LINE2}`, borderRadius:10, fontSize:14, color:T3, textDecoration:'none', fontFamily:F, fontWeight:500, transition:'all 0.2s' }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color=T1}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color=T3}>
                شاهد مقارنة المميزات الكاملة ←
              </Link>
              <p style={{ fontSize:12, color:T4, marginTop:14, fontFamily:F }}>جميع الخطط تشمل ضمان استرداد المبلغ خلال ٧ أيام.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════
          ٧. الأسئلة الشائعة
      ═══════════════════════════ */}
      <section id="faq" style={{ padding:'80px 40px', maxWidth:720, margin:'0 auto', position:'relative', zIndex:1 }}>
        <Reveal>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <div style={{ fontSize:11, fontFamily:F, fontWeight:600, color:T4, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:16 }}>أسئلة</div>
            <h2 style={{ fontFamily:F, fontWeight:900, fontSize:'clamp(30px,5vw,50px)', color:T1, lineHeight:1.35 }}>كل سؤال<br/>إجابة واضحة.</h2>
          </div>
        </Reveal>
        <div style={{ border:`1px solid ${LINE}`, borderRadius:14, overflow:'hidden' }}>
          {FAQS.map(({q,a},i)=>(
            <div key={i} style={{ borderBottom:i<FAQS.length-1?`1px solid ${LINE}`:'none' }}>
              <button onClick={()=>setFaqOpen(faqOpen===i?null:i)}
                style={{ width:'100%', background:'none', border:'none', padding:'22px 28px', textAlign:'right', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', gap:16, direction:'rtl' }}>
                <span style={{ fontSize:16, fontWeight:700, fontFamily:F, color:T1, lineHeight:1.5, textAlign:'right', flex:1 }}>{q}</span>
                <span style={{ fontSize:22, flexShrink:0, transition:'transform 0.25s, color 0.2s', transform:faqOpen===i?'rotate(45deg)':'none', color:faqOpen===i?CYAN:T4 }}>+</span>
              </button>
              {faqOpen===i&&(
                <div style={{ padding:'0 28px 24px', fontSize:14, fontFamily:F, color:T3, lineHeight:1.9, animation:'fadeUp 0.25s ease both', direction:'rtl', textAlign:'right' }}>{a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════
          ٨. CTA النهائي
      ═══════════════════════════ */}
      <section style={{ padding:'120px 40px', textAlign:'center', position:'relative', zIndex:1, overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'60vw', height:'40vh', borderRadius:'50%', background:CYAN, filter:'blur(120px)', opacity:0.06, pointerEvents:'none' }}/>
        <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(${LINE} 1px,transparent 1px),linear-gradient(90deg,${LINE} 1px,transparent 1px)`, backgroundSize:'60px 60px', opacity:0.25, pointerEvents:'none' }}/>
        <Reveal>
          <div style={{ position:'relative', zIndex:1 }}>
            <h2 style={{ fontFamily:F, fontWeight:900, fontSize:'clamp(38px,7vw,88px)', color:T1, lineHeight:1.2, marginBottom:24 }}>
              وقّف التخطيط.<br/><span className="grad-text" style={{ display:'inline-block', direction:'ltr', unicodeBidi:'isolate' }}>ابدأ البناء.</span>
            </h2>
            <p style={{ fontFamily:F, fontWeight:400, fontSize:'clamp(16px,2.2vw,20px)', color:T3, maxWidth:480, margin:'0 auto 52px', lineHeight:1.95 }}>
              كل يوم تأخير هو يوم منافسيك يظهرون فيه. جمهورك موجود. المحتوى فيك — Nexa بس تطلّعه.
            </p>
            <Link href="/auth/signup" className="cta-glow" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'18px 52px', borderRadius:12, background:CYAN, color:'#000', fontSize:17, fontWeight:900, fontFamily:F, textDecoration:'none', transition:'all 0.2s' }}>
              ابدأ مجاناً ← ١٥٠ رصيد هدية
            </Link>
            <p style={{ fontSize:13, color:T4, marginTop:20, fontFamily:F }}>بدون بطاقة · إعداد في ٣ دقائق · إلغاء في أي وقت</p>
          </div>
        </Reveal>
      </section>

      {/* الفوتر */}
      <footer style={{ borderTop:`1px solid ${LINE}`, padding:'56px 40px 32px', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div className="grid-4" style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:40, marginBottom:56 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
                <Image src="/favicon.png" alt="Nexa" width={22} height={22} style={{ borderRadius:6 }}/>
                <span style={{ fontFamily:F, fontWeight:900, fontSize:17, color:T1 }}>Nexa</span>
              </div>
              <p style={{ fontSize:13, color:T4, lineHeight:1.85, fontFamily:F, maxWidth:260, marginBottom:20 }}>
                منصة الذكاء الاصطناعي التي تتعلّم صوت علامتك التجارية، تبني استراتيجيتك، وتدير تسويق محتواك — بشكل تلقائي كامل.
              </p>
              <p style={{ fontSize:12, color:T4, fontFamily:F }}>دبي، الإمارات · hello@nexaa.cc</p>
            </div>
            <div>
              <div style={{ fontSize:10, fontFamily:F, fontWeight:700, color:T4, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:18 }}>المنتج</div>
              {['الدماغ التجاري','الاستوديو','الاستراتيجية','الوكلاء','التسلسلات','Amplify','التكاملات','التحليلات'].map(item=>(
                <div key={item} style={{ marginBottom:10 }}>
                  <Link href="/auth/signup" style={{ fontSize:13, color:T3, textDecoration:'none', fontFamily:F, transition:'color 0.15s' }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color=T1}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color=T3}>{item}</Link>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize:10, fontFamily:F, fontWeight:700, color:T4, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:18 }}>الشركة</div>
              {[['عن Nexa','about'],['الأسعار','#pricing'],['الأسئلة الشائعة','#faq'],['تسجيل الدخول','/auth/login'],['ابدأ مجاناً','/auth/signup']].map(([label,href])=>(
                <div key={label} style={{ marginBottom:10 }}>
                  <a href={href.startsWith('/')||href.startsWith('#')?href:`/landing/${href}`} style={{ fontSize:13, color:T3, textDecoration:'none', fontFamily:F, transition:'color 0.15s' }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color=T1}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color=T3}>{label}</a>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize:10, fontFamily:F, fontWeight:700, color:T4, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:18 }}>القانوني</div>
              {[['سياسة الخصوصية','/landing/privacy'],['شروط الخدمة','/landing/terms']].map(([label,href])=>(
                <div key={label} style={{ marginBottom:10 }}>
                  <Link href={href} style={{ fontSize:13, color:T3, textDecoration:'none', fontFamily:F, transition:'color 0.15s' }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color=T1}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color=T3}>{label}</Link>
                </div>
              ))}
              <div style={{ marginTop:24 }}>
                <div style={{ fontSize:10, fontFamily:F, fontWeight:700, color:T4, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:10 }}>تواصل</div>
                <a href="mailto:hello@nexaa.cc" style={{ fontSize:13, color:T3, textDecoration:'none', fontFamily:F }}>hello@nexaa.cc</a>
              </div>
            </div>
          </div>
          <div style={{ borderTop:`1px solid ${LINE}`, paddingTop:24, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap' as const, gap:10 }}>
            <span style={{ fontSize:12, color:T4, fontFamily:F }}>صُنع بشغف في دبي 🇦🇪</span>
            <span style={{ fontSize:12, color:T4, fontFamily:F }}>© 2026 Nexa. جميع الحقوق محفوظة.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
