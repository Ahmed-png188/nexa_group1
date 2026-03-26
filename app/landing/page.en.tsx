'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLang } from '@/lib/language-context'

/* ─── tokens ─── */
const DISPLAY = "'Bricolage Grotesque', sans-serif"
const SERIF   = "'Instrument Serif', serif"
const MONO    = "'Geist Mono', monospace"
const SANS    = "'DM Sans', sans-serif"
const CYAN    = '#00AAFF'
const CYAN2   = 'rgba(0,170,255,0.12)'
const CYAN3   = 'rgba(0,170,255,0.06)'
const LINE    = 'rgba(255,255,255,0.07)'
const LINE2   = 'rgba(255,255,255,0.12)'
const T1 = '#FFFFFF'
const T2 = 'rgba(255,255,255,0.65)'
const T3 = 'rgba(255,255,255,0.35)'
const T4 = 'rgba(255,255,255,0.18)'

/* ─── scroll reveal hook ─── */
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

/* ─── animated counter ─── */
function Counter({ to, suffix='' }: { to: number; suffix?: string }) {
  const { ref, visible } = useReveal(0.3)
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!visible) return
    const dur = 1800, steps = 60, inc = to / steps
    let cur = 0, t = setInterval(() => {
      cur = Math.min(cur + inc, to); setVal(Math.round(cur))
      if (cur >= to) clearInterval(t)
    }, dur / steps)
    return () => clearInterval(t)
  }, [visible, to])
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

/* ─── reveal wrapper ─── */
function Reveal({ children, delay=0, from='bottom', className='' }: { children: React.ReactNode; delay?: number; from?: 'bottom'|'left'|'right'|'scale'; className?: string }) {
  const { ref, visible } = useReveal()
  const transforms: Record<string, string> = {
    bottom: 'translateY(48px)',
    left:   'translateX(-60px)',
    right:  'translateX(60px)',
    scale:  'scale(0.88) translateY(24px)',
  }
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : transforms[from],
      transition: `opacity 0.85s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.85s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

/* ─── FAQ data ─── */
const FAQS = [
  { q: 'Will it actually sound like me?', a: 'Yes. Brand Brain trains on your actual writing — your tone, vocabulary, sentence rhythm, opinions. The more you feed it, the sharper it gets. Most users hit 90%+ voice match within the first week.' },
  { q: "I'm not a tech person. Will I be able to use this?", a: 'Nexa was designed for business owners, not developers. Setup takes 3 minutes. If you can type a message, you can use Nexa.' },
  { q: 'What is a credit?', a: 'Credits power AI generations. A text post costs 3 credits. An image costs 5. A short video costs 20. Chat, strategy, and scheduling are always free. Your first 150 credits are on us.' },
  { q: 'How is this different from ChatGPT?', a: "ChatGPT doesn't know your brand, your audience, your offers, or your strategy. Nexa builds a full Brand Brain from your business data — every output is calibrated to your exact voice and goals. It's the difference between a generic ghostwriter and a partner who's been working with you for years." },
  { q: 'Does it work for agencies?', a: 'Yes. The Agency plan gives each client their own isolated workspace — separate Brand Brain, publishing connections, content history, and retainer tracking. All managed from one dashboard.' },
  { q: 'Can I cancel anytime?', a: 'Yes. No contracts, no lock-ins. Cancel from your settings in one click. You keep access until the end of your billing period.' },
]

/* ─── comparison table rows ─── */
const TABLE_ROWS = [
  { category: 'Credits', label: 'Monthly credits', spark: '500 cr', grow: '1,500 cr', scale: '4,000 cr', agency: '12,000 cr' },
  { category: 'Credits', label: 'Free trial', spark: '150 cr free', grow: false, scale: false, agency: false },
  { category: 'Brand', label: 'Brand Brain — voice training', spark: true, grow: true, scale: true, agency: true },
  { category: 'Brand', label: 'All content types (text, image, video, voice)', spark: true, grow: true, scale: true, agency: true },
  { category: 'Brand', label: 'Nexa AI chat — unlimited', spark: true, grow: true, scale: true, agency: true },
  { category: 'Content', label: 'Morning brief', spark: true, grow: true, scale: true, agency: true },
  { category: 'Content', label: 'Strategy & 30-day plan', spark: true, grow: true, scale: true, agency: true },
  { category: 'Content', label: 'Lead capture page', spark: true, grow: true, scale: true, agency: true },
  { category: 'Content', label: 'Lead magnet delivery', spark: true, grow: true, scale: true, agency: true },
  { category: 'Publishing', label: 'Social platforms', spark: '2 platforms', grow: '4 platforms', scale: 'Unlimited', agency: 'Unlimited' },
  { category: 'Publishing', label: 'Scheduled posts/mo', spark: '60 posts', grow: 'Unlimited', scale: 'Unlimited', agency: 'Unlimited' },
  { category: 'Analytics', label: 'Analytics', spark: 'Basic', grow: 'Full + AI insights', scale: 'Full + export', agency: 'Full + export' },
  { category: 'Analytics', label: 'Competitor analysis', spark: false, grow: true, scale: true, agency: true },
  { category: 'Analytics', label: 'Performance learning', spark: false, grow: true, scale: true, agency: true },
  { category: 'Email', label: 'Email sequences', spark: false, grow: '3 active', scale: '15 sequences', agency: 'Unlimited' },
  { category: 'Email', label: 'Contacts', spark: false, grow: '2,500', scale: '15,000', agency: 'Unlimited' },
  { category: 'Email', label: 'Emails per month', spark: false, grow: '3,000', scale: '20,000', agency: '100,000' },
  { category: 'Email', label: 'AI-written sequences', spark: false, grow: true, scale: true, agency: true },
  { category: 'Email', label: 'A/B subject line testing', spark: false, grow: false, scale: true, agency: true },
  { category: 'Email', label: 'Behavioral triggers', spark: false, grow: false, scale: true, agency: true },
  { category: 'Ads', label: 'Amplify — Meta Ads', spark: false, grow: true, scale: true, agency: true },
  { category: 'Ads', label: 'One-click boost from Studio', spark: false, grow: true, scale: true, agency: true },
  { category: 'Ads', label: 'AI ad performance monitor', spark: false, grow: false, scale: true, agency: true },
  { category: 'Ads', label: 'Daily ad insights brief', spark: false, grow: false, scale: true, agency: true },
  { category: 'Branding', label: 'Remove Nexa branding', spark: false, grow: false, scale: true, agency: true },
  { category: 'Branding', label: 'Custom sender domain', spark: false, grow: false, scale: true, agency: true },
  { category: 'Agency', label: 'Client workspaces', spark: false, grow: false, scale: false, agency: 'Unlimited' },
  { category: 'Agency', label: 'Separate Brand Brain per client', spark: false, grow: false, scale: false, agency: true },
  { category: 'Agency', label: 'Retainer & MRR tracking', spark: false, grow: false, scale: false, agency: true },
  { category: 'Integrations', label: 'Kit/ConvertKit', spark: false, grow: true, scale: true, agency: true },
  { category: 'Integrations', label: 'Zapier / custom webhooks', spark: false, grow: false, scale: true, agency: true },
  { category: 'Team', label: 'Team members', spark: '1', grow: '2', scale: '5', agency: '25' },
  { category: 'Support', label: 'Support', spark: 'Email', grow: 'Priority email', scale: 'Priority', agency: 'Dedicated' },
]

export default function LandingPage() {
  const { setLang } = useLang()
  const [faqOpen, setFaqOpen] = useState<number|null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [mounted, setMounted] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    const onScroll = () => { setScrolled(window.scrollY > 40); setScrollY(window.scrollY) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Parallax values
  const heroParallax = scrollY * 0.35
  const mockupTilt = Math.min(scrollY * 0.018, 12)

  return (
    <div style={{ background:'#080808', color:T1, fontFamily:SANS, overflowX:'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html:`
        /* Animated gradient orbs */
        @keyframes orb-a { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(15%,-18%) scale(1.15)} 66%{transform:translate(-12%,14%) scale(0.90)} }
        @keyframes orb-b { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-18%,12%) scale(0.86)} 70%{transform:translate(14%,-16%) scale(1.12)} }
        @keyframes orb-c { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-10%,20%) scale(1.18)} }
        @keyframes orb-d { 0%,100%{transform:translate(0,0)} 45%{transform:translate(18%,-14%)} 85%{transform:translate(-14%,18%)} }

        /* Hero word reveal */
        @keyframes word-in { from{opacity:0;transform:translateY(60px) skewY(3deg)} to{opacity:1;transform:translateY(0) skewY(0)} }

        /* Marquee */
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .marquee-track { animation: marquee 28s linear infinite; display:flex; gap:0; width:max-content; }
        .marquee-track:hover { animation-play-state:paused; }

        /* Glow pulse */
        @keyframes glow-pulse { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:0.9;transform:scale(1.06)} }
        @keyframes ring-expand { 0%,100%{opacity:0.3;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.08)} }

        /* Grain */
        @keyframes grain { 0%,100%{transform:translate(0,0)} 10%{transform:translate(-2%,-3%)} 30%{transform:translate(1%,2%)} 50%{transform:translate(-1%,1%)} 70%{transform:translate(2%,-1%)} 90%{transform:translate(-2%,2%)} }

        /* Counter float */
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }

        /* Line draw */
        @keyframes line-draw { from{stroke-dashoffset:1000} to{stroke-dashoffset:0} }

        /* Card shimmer */
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

        /* Fade up */
        @keyframes fadeUp { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }

        /* Blink */
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

        /* Typing cursor */
        .cursor::after { content:'|'; animation:blink 1.1s step-end infinite; color:#00AAFF; }

        /* Nav links */
        .nav-link { color:rgba(255,255,255,0.35); text-decoration:none; font-size:14px; font-family:'DM Sans', sans-serif; transition:color 0.15s; }
        .nav-link:hover { color:#FFFFFF; }

        /* Hover lift */
        .lift { transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1), border-color 0.2s; }
        .lift:hover { transform:translateY(-4px); }

        /* Table row */
        .trow:hover { background:rgba(0,170,255,0.04) !important; }

        /* CTA glow */
        .cta-glow { box-shadow: 0 0 0 0 rgba(0,170,255,0.4); transition: box-shadow 0.3s; }
        .cta-glow:hover { box-shadow: 0 0 40px 8px rgba(0,170,255,0.18), 0 0 0 1px rgba(0,170,255,0.35); }

        /* Gradient text */
        .grad-text { background: linear-gradient(135deg, #fff 0%, #00AAFF 60%, #fff 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; background-size:200%; animation:shimmer 4s linear infinite; }

        /* Scroll indicator */
        @keyframes scroll-hint { 0%,100%{transform:translateY(0);opacity:0.6} 50%{transform:translateY(8px);opacity:1} }
        .scroll-hint { animation: scroll-hint 1.8s ease-in-out infinite; }

        /* Word animation */
        .word-1 { animation: word-in 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
        .word-2 { animation: word-in 0.9s cubic-bezier(0.16,1,0.3,1) 0.28s both; }
        .word-3 { animation: word-in 0.9s cubic-bezier(0.16,1,0.3,1) 0.46s both; }

        /* Feature line connector */
        .connector { background:linear-gradient(to bottom, transparent, rgba(0,170,255,0.3), transparent); }

        /* Mobile */
        @media (max-width:768px) {
          .hero-title { font-size:clamp(52px,14vw,80px) !important; }
          .grid-2 { grid-template-columns:1fr !important; }
          .grid-3 { grid-template-columns:1fr !important; }
          .grid-4 { grid-template-columns:1fr 1fr !important; }
          .hide-mobile { display:none !important; }
          .nav-links { display:none !important; }
          .table-scroll { overflow-x:auto; }
        }
      `}}/>

      {/* ════════════════════════════════
          ANIMATED BACKGROUND
      ════════════════════════════════ */}
      <div style={{ position:'fixed', inset:0, background:'#080808', zIndex:0, overflow:'hidden', pointerEvents:'none' }}>
        <div style={{ position:'absolute', top:'-20%', left:'-15%', width:'80vw', height:'80vw', borderRadius:'50%', background:'radial-gradient(ellipse,rgba(0,170,255,0.14) 0%,transparent 65%)', animation:'orb-a 10s ease infinite', filter:'blur(48px)' }}/>
        <div style={{ position:'absolute', bottom:'-20%', right:'-15%', width:'65vw', height:'65vw', borderRadius:'50%', background:'radial-gradient(ellipse,rgba(0,110,255,0.10) 0%,transparent 65%)', animation:'orb-b 13s ease infinite', filter:'blur(56px)' }}/>
        <div style={{ position:'absolute', top:'35%', left:'45%', width:'50vw', height:'50vw', borderRadius:'50%', background:'radial-gradient(ellipse,rgba(0,200,255,0.07) 0%,transparent 70%)', animation:'orb-c 17s ease infinite', filter:'blur(64px)' }}/>
        <div style={{ position:'absolute', top:'65%', left:'15%', width:'35vw', height:'35vw', borderRadius:'50%', background:'radial-gradient(ellipse,rgba(0,170,255,0.09) 0%,transparent 70%)', animation:'orb-d 11s ease infinite', filter:'blur(40px)' }}/>
        {/* Grain */}
        <div style={{ position:'absolute', inset:0, opacity:0.028, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, animation:'grain 8s steps(10) infinite' }}/>
        {/* Top vignette */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'40%', background:'linear-gradient(to bottom,rgba(8,8,8,0.7),transparent)' }}/>
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'30%', background:'linear-gradient(to top,rgba(8,8,8,0.8),transparent)' }}/>
      </div>

      {/* ════════════════════════════════
          NAV
      ════════════════════════════════ */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, height:60, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 40px', borderBottom:`1px solid ${scrolled?LINE:'transparent'}`, background:scrolled?'rgba(8,8,8,0.90)':'transparent', backdropFilter:scrolled?'blur(24px)':'none', transition:'all 0.35s' }}>
        <Link href="/landing" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none' }}>
          <Image src="/favicon.png" alt="Nexa" width={22} height={22} style={{ borderRadius:6 }}/>
          <span style={{ fontFamily:DISPLAY, fontWeight:800, fontSize:16, color:T1, letterSpacing:'-0.03em' }}>Nexa</span>
        </Link>
        <div className="nav-links" style={{ display:'flex', alignItems:'center', gap:32 }}>
          {[['Story','#story'],['Features','#features'],['Pricing','#pricing'],['FAQ','#faq']].map(([l,h]) => (
            <a key={l} href={h} className="nav-link">{l}</a>
          ))}
          <Link href="/landing/about" className="nav-link">About</Link>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button onClick={() => { setLang('ar'); localStorage.setItem('nexa_lang','ar') }} style={{ fontFamily:"'Noto Naskh Arabic', serif", fontSize:13, color:'rgba(255,255,255,0.40)', background:'none', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:6, padding:'5px 12px', cursor:'pointer', transition:'color 0.2s, border-color 0.2s', letterSpacing:0 }} onMouseEnter={e=>{(e.target as HTMLElement).style.color='rgba(255,255,255,0.80)';(e.target as HTMLElement).style.borderColor='rgba(255,255,255,0.25)'}} onMouseLeave={e=>{(e.target as HTMLElement).style.color='rgba(255,255,255,0.40)';(e.target as HTMLElement).style.borderColor='rgba(255,255,255,0.12)'}}>عربي</button>
          <Link href="/auth/login" style={{ padding:'7px 16px', borderRadius:8, border:`1px solid ${LINE2}`, background:'none', color:T2, fontSize:13, fontFamily:SANS, textDecoration:'none', transition:'border-color 0.15s' }}>Sign in</Link>
          <Link href="/auth/signup" className="cta-glow" style={{ padding:'7px 20px', borderRadius:8, background:CYAN, color:'#000', fontSize:13, fontWeight:700, fontFamily:DISPLAY, textDecoration:'none', letterSpacing:'-0.02em', transition:'all 0.2s' }}>Start free →</Link>
        </div>
      </nav>

      {/* ════════════════════════════════
          1. HERO
      ════════════════════════════════ */}
      <section ref={heroRef} style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'120px 40px 80px', textAlign:'center', position:'relative', zIndex:1 }}>

        {/* Live badge */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:100, border:`1px solid rgba(0,170,255,0.25)`, background:'rgba(0,170,255,0.05)', marginBottom:40, opacity:mounted?1:0, transition:'opacity 0.6s 0.3s', backdropFilter:'blur(12px)' }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80', display:'inline-block', boxShadow:'0 0 8px #4ade80' }}/>
          <span style={{ fontSize:11, fontFamily:MONO, color:T3, letterSpacing:'0.10em' }}>EARLY ACCESS · 150 FREE CREDITS · NO CARD NEEDED</span>
        </div>

        {/* Main headline */}
        <div className="hero-title" style={{ fontFamily:DISPLAY, fontWeight:800, fontSize:'clamp(68px,10vw,128px)', lineHeight:0.90, letterSpacing:'-0.05em', marginBottom:0, overflow:'hidden' }}>
          <div className="word-1" style={{ display:'block', color:T1 }}>Create.</div>
          <div className="word-2" style={{ display:'block', color:T1 }}>Automate.</div>
          <div className="word-3" style={{ display:'block' }}>
            <span className="grad-text">Dominate.</span>
          </div>
        </div>

        {/* Subheadline */}
        <p style={{ fontFamily:SERIF, fontStyle:'italic', fontSize:'clamp(17px,2.2vw,22px)', color:T3, maxWidth:560, margin:'36px auto 0', lineHeight:1.65, opacity:mounted?1:0, transform:mounted?'none':'translateY(20px)', transition:'all 0.8s 0.8s' }}>
          The platform that learns your voice, builds your strategy, and publishes your content — while you run your business.
        </p>

        {/* CTAs */}
        <div style={{ display:'flex', gap:12, justifyContent:'center', marginTop:44, flexWrap:'wrap', opacity:mounted?1:0, transform:mounted?'none':'translateY(20px)', transition:'all 0.8s 1s' }}>
          <Link href="/auth/signup" className="cta-glow" style={{ padding:'14px 36px', borderRadius:10, background:CYAN, color:'#000', fontSize:15, fontWeight:800, fontFamily:DISPLAY, textDecoration:'none', letterSpacing:'-0.03em', transition:'all 0.2s' }}>
            Start free — 150 credits on us →
          </Link>
          <a href="#story" style={{ padding:'14px 26px', borderRadius:10, border:`1px solid ${LINE2}`, background:'rgba(255,255,255,0.03)', color:T2, fontSize:15, fontFamily:SANS, textDecoration:'none', transition:'all 0.2s', backdropFilter:'blur(12px)' }}>
            See how it works
          </a>
        </div>
        <p style={{ fontSize:12, color:T4, marginTop:18, fontFamily:MONO, opacity:mounted?1:0, transition:'opacity 0.6s 1.2s' }}>500 credits on paid plans · Setup in 3 min · Cancel anytime</p>

        {/* Artistic dashboard illustration */}
        <div style={{ position:'relative', zIndex:1, marginTop:80, maxWidth:960, width:'100%', opacity:mounted?1:0, transition:'opacity 0.9s 0.6s', transform:`perspective(1200px) rotateX(${mockupTilt}deg) translateY(${-heroParallax * 0.1}px)`, transformOrigin:'50% 100%' }}>

          {/* Outer glow ring */}
          <div style={{ position:'absolute', inset:-1, borderRadius:20, background:`linear-gradient(135deg,rgba(0,170,255,0.3),transparent 40%,transparent 60%,rgba(0,170,255,0.15))`, zIndex:-1 }}/>

          <div style={{ background:'rgba(10,10,12,0.95)', border:`1px solid rgba(255,255,255,0.10)`, borderRadius:18, overflow:'hidden', boxShadow:'0 60px 160px rgba(0,0,0,0.9), 0 0 80px rgba(0,170,255,0.08)', backdropFilter:'blur(24px)' }}>
            {/* Browser chrome */}
            <div style={{ background:'rgba(15,15,18,1)', borderBottom:`1px solid ${LINE}`, padding:'11px 16px', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ display:'flex', gap:6 }}>
                {['#ff5f57','#ffbd2e','#28c840'].map((c,i) => <div key={i} style={{ width:10, height:10, borderRadius:'50%', background:c, opacity:0.8 }}/>)}
              </div>
              <div style={{ flex:1, background:'rgba(255,255,255,0.05)', borderRadius:6, padding:'4px 12px', fontSize:11, fontFamily:MONO, color:T4, textAlign:'center' }}>nexaa.cc/dashboard</div>
              <div style={{ width:60 }}/>
            </div>

            {/* Dashboard interior */}
            <div style={{ padding:'28px 24px 20px', background:'linear-gradient(160deg,#080810 0%,#060608 50%,#090608 100%)', position:'relative', minHeight:440, display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

              {/* Purple bloom */}
              <div style={{ position:'absolute', top:-60, left:-20, width:320, height:240, borderRadius:'50%', background:'#4c1d95', filter:'blur(110px)', opacity:0.18, pointerEvents:'none' }}/>
              {/* Cyan glow */}
              <div style={{ position:'absolute', top:40, right:40, width:200, height:160, borderRadius:'50%', background:CYAN, filter:'blur(90px)', opacity:0.09, pointerEvents:'none' }}/>
              {/* Amber ember */}
              <div style={{ position:'absolute', bottom:-30, left:'35%', width:180, height:120, borderRadius:'50%', background:'#92400e', filter:'blur(80px)', opacity:0.14, pointerEvents:'none' }}/>

              {/* LEFT col — Morning brief */}
              <div style={{ position:'relative', zIndex:1 }}>
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', color:T4, fontFamily:MONO, marginBottom:5 }}>Good morning · Command Center</div>
                  <div style={{ fontFamily:DISPLAY, fontSize:28, fontWeight:800, color:T1, letterSpacing:'-0.04em', lineHeight:1.1 }}>Ahmed</div>
                </div>

                {/* Stats row */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14 }}>
                  {[{l:'Credits',v:'491',c:CYAN},{l:'Voice match',v:'94%',c:'#4ade80'},{l:'Streak',v:'14d',c:'#fb923c'}].map((s,i) => (
                    <div key={i} style={{ padding:'10px 12px', background:'rgba(255,255,255,0.03)', border:`1px solid ${LINE}`, borderRadius:10 }}>
                      <div style={{ fontSize:8, color:T4, fontFamily:MONO, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 }}>{s.l}</div>
                      <div style={{ fontFamily:MONO, fontSize:18, fontWeight:300, color:s.c, letterSpacing:'-0.04em' }}>{s.v}</div>
                    </div>
                  ))}
                </div>

                {/* Brand Brain card */}
                <div style={{ padding:'14px 16px', background:'rgba(0,170,255,0.05)', border:`1px solid rgba(0,170,255,0.18)`, borderRadius:12, marginBottom:10, position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${CYAN}55,transparent)` }}/>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:T1, fontFamily:DISPLAY, letterSpacing:'-0.01em' }}>Brand Brain</div>
                      <div style={{ fontSize:9, color:T4, fontFamily:SANS }}>Intelligence layer · Active</div>
                    </div>
                    {/* Brain icon rings */}
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
                  {[['Voice consistency','98%'],['Tone accuracy','92%'],['Vocabulary match','94%']].map(([l,v],i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:10, marginBottom:5 }}>
                      <span style={{ color:T4, fontFamily:SANS }}>{l}</span>
                      <span style={{ color:CYAN, fontFamily:MONO }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Agents */}
                <div style={{ padding:'12px 14px', background:'rgba(255,255,255,0.02)', border:`1px solid ${LINE}`, borderRadius:10 }}>
                  <div style={{ fontSize:9, color:T4, fontFamily:MONO, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8 }}>Active Agents</div>
                  {[['Content Agent','Running','#4ade80'],['Timing Agent','Active','#4ade80'],['Ad Monitor','Live','#fb923c']].map(([n,s,c],i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                      <span style={{ fontSize:10, color:T2, fontFamily:SANS }}>{n}</span>
                      <span style={{ fontSize:9, color:c, fontFamily:MONO, padding:'2px 7px', background:`${c}14`, borderRadius:4 }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT col — Studio + Amplify */}
              <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', gap:12 }}>

                {/* Studio visual */}
                <div style={{ padding:'14px 16px', background:'rgba(255,255,255,0.03)', border:`1px solid ${LINE}`, borderRadius:12, flex:1 }}>
                  <div style={{ fontSize:9, color:T4, fontFamily:MONO, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>Studio — Content Queue</div>
                  {/* Content items with color coding */}
                  {[
                    { type:'Post', platform:'Instagram', status:'Ready', color:'#E1306C' },
                    { type:'Video', platform:'TikTok', status:'Generating', color:'#FF0050' },
                    { type:'Email', platform:'Sequence', status:'Scheduled', color:CYAN },
                    { type:'Ad', platform:'Meta', status:'Live', color:'#4ade80' },
                  ].map((item,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', background:i===1?'rgba(0,170,255,0.04)':'transparent', borderRadius:7, marginBottom:3 }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:item.color, flexShrink:0 }}/>
                      <span style={{ fontSize:10, color:T2, fontFamily:SANS, flex:1 }}>{item.type} · {item.platform}</span>
                      <span style={{ fontSize:9, color:item.status==='Live'?'#4ade80':item.status==='Generating'?CYAN:T4, fontFamily:MONO }}>{item.status}</span>
                    </div>
                  ))}
                </div>

                {/* Amplify metrics */}
                <div style={{ padding:'14px 16px', background:'rgba(255,255,255,0.03)', border:`1px solid ${LINE}`, borderRadius:12 }}>
                  <div style={{ fontSize:9, color:T4, fontFamily:MONO, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>Amplify · Ad Performance</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                    {[{l:'ROAS',v:'4.2×',c:'#4ade80'},{l:'CTR',v:'3.8%',c:CYAN},{l:'CPL',v:'$4.10',c:'#fb923c'}].map((m,i) => (
                      <div key={i} style={{ textAlign:'center' as const }}>
                        <div style={{ fontFamily:MONO, fontSize:16, fontWeight:300, color:m.c, letterSpacing:'-0.03em' }}>{m.v}</div>
                        <div style={{ fontSize:8, color:T4, fontFamily:MONO, marginTop:2 }}>{m.l}</div>
                      </div>
                    ))}
                  </div>
                  {/* Mini bar chart */}
                  <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:28, marginTop:10 }}>
                    {[40,55,45,70,60,80,75,90,72,88,95,100].map((h,i) => (
                      <div key={i} style={{ flex:1, height:`${h}%`, background:i>9?CYAN:`rgba(0,170,255,${0.1+i*0.04})`, borderRadius:2 }}/>
                    ))}
                  </div>
                </div>

                {/* Insights */}
                <div style={{ padding:'14px 16px', background:'rgba(255,255,255,0.02)', border:`1px solid ${LINE}`, borderRadius:10 }}>
                  <div style={{ fontSize:9, color:T4, fontFamily:MONO, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8 }}>Notifications</div>
                  {[
                    { msg:'Brand Brain updated · 94% match', color:'#4ade80' },
                    { msg:'"Spring Campaign" is now live on Meta', color:CYAN },
                    { msg:'New lead: sarah@bloom.co captured', color:'#a78bfa' },
                  ].map((n,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5 }}>
                      <div style={{ width:5, height:5, borderRadius:'50%', background:n.color, flexShrink:0 }}/>
                      <span style={{ fontSize:9, color:T3, fontFamily:SANS }}>{n.msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="scroll-hint" style={{ position:'absolute', bottom:32, left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:6, opacity:0.4 }}>
          <span style={{ fontSize:10, fontFamily:MONO, color:T4, letterSpacing:'0.08em' }}>SCROLL</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T4} strokeWidth="1.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </section>

      {/* ════════════════════════════════
          MARQUEE
      ════════════════════════════════ */}
      <div style={{ borderTop:`1px solid ${LINE}`, borderBottom:`1px solid ${LINE}`, padding:'14px 0', overflow:'hidden', background:'rgba(0,0,0,0.4)', position:'relative', zIndex:1, backdropFilter:'blur(8px)' }}>
        <div className="marquee-track">
          {[...Array(2)].flatMap(() =>
            ['Brand Voice AI','Content Studio','Auto-Scheduling','Email Sequences','Meta Ads','AI Strategy','Video Generation','Voice Cloning','Competitor Intel','Lead Capture','Agency Workspaces','Insights'].map((item,i) => (
              <div key={`${item}-${i}`} style={{ display:'flex', alignItems:'center', gap:0, flexShrink:0 }}>
                <span style={{ padding:'0 28px', fontSize:12, fontFamily:MONO, color:T4, letterSpacing:'0.07em', whiteSpace:'nowrap' }}>{item}</span>
                <span style={{ color:'rgba(0,170,255,0.30)', fontSize:14 }}>·</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ════════════════════════════════
          2. THE STORY — "Your Day Before Nexa"
      ════════════════════════════════ */}
      <section id="story" style={{ padding:'120px 40px', maxWidth:1100, margin:'0 auto', position:'relative', zIndex:1 }}>
        <Reveal>
          <div style={{ textAlign:'center', marginBottom:80 }}>
            <div style={{ fontSize:11, fontFamily:MONO, color:T4, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:16 }}>The story you know</div>
            <h2 style={{ fontFamily:DISPLAY, fontWeight:800, fontSize:'clamp(36px,5.5vw,64px)', letterSpacing:'-0.04em', color:T1, lineHeight:1, marginBottom:0 }}>
              You're good at what you do.<br/>
              <span style={{ color:T3 }}>Content shouldn't be a second job.</span>
            </h2>
          </div>
        </Reveal>

        {/* Three pain cards — fly in from different directions */}
        <div className="grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, background:LINE, borderRadius:16, overflow:'hidden' }}>
          {[
            { from:'left' as const, delay:0, title:'You know what to say.', sub:'You just never have time to say it.', body:'Every day you have ideas — insights, opinions, things your clients need to hear. But between serving clients, running operations, and actually living your life, content creation is the first thing that gets pushed to tomorrow. And tomorrow never comes.', color:'rgba(239,68,68,0.5)' },
            { from:'bottom' as const, delay:100, title:'You\'ve tried ChatGPT.', sub:'It didn\'t sound like you.', body:'Generic tools give generic output. You spend more time editing AI content than it would have taken to write it yourself. The problem is not the technology — it is that the technology does not know you.', color:'rgba(245,158,11,0.5)' },
            { from:'right' as const, delay:200, title:'You post for two weeks.', sub:'Then disappear for three.', body:'Inconsistency kills audience growth. Your competitors who post consistently — even if their content is worse than yours — are winning. Not because they are better. Because they show up.', color:'rgba(239,68,68,0.5)' },
          ].map(({ from, delay, title, sub, body, color }) => (
            <Reveal key={title} from={from} delay={delay}>
              <div className="lift" style={{ background:'#0A0A0A', padding:'40px 32px', height:'100%', borderTop:`2px solid ${color}` }}>
                <div style={{ fontFamily:DISPLAY, fontWeight:800, fontSize:20, color:T1, marginBottom:6, letterSpacing:'-0.03em', lineHeight:1.2 }}>{title}</div>
                <div style={{ fontFamily:SERIF, fontStyle:'italic', fontSize:15, color:T3, marginBottom:20 }}>{sub}</div>
                <p style={{ fontSize:14, color:T3, lineHeight:1.75, fontFamily:SANS }}>{body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={300}>
          <div style={{ textAlign:'center', marginTop:56 }}>
            <p style={{ fontFamily:SERIF, fontStyle:'italic', fontSize:'clamp(20px,3vw,28px)', color:T2, maxWidth:600, margin:'0 auto' }}>
              Nexa solves all three. Not with tricks. With a system that learns who you are.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ════════════════════════════════
          3. THE JOURNEY — Feature story
      ════════════════════════════════ */}
      <section id="features" style={{ position:'relative', zIndex:1 }}>

        {/* ── ACT 1: Brand Brain ── */}
        <div style={{ padding:'80px 40px', maxWidth:1100, margin:'0 auto' }}>
          <div className="grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center' }}>
            <Reveal from="left">
              <div>
                <div style={{ fontSize:11, fontFamily:MONO, color:CYAN, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:20, opacity:0.7 }}>01 — Where it starts</div>
                <h2 style={{ fontFamily:DISPLAY, fontWeight:800, fontSize:'clamp(32px,4.5vw,52px)', letterSpacing:'-0.04em', color:T1, lineHeight:1.05, marginBottom:20 }}>
                  Nexa learns<br/>to think like you.
                </h2>
                <p style={{ fontFamily:SERIF, fontStyle:'italic', fontSize:18, color:T3, marginBottom:24, lineHeight:1.65 }}>
                  Upload your past content, your website, your brand doc. Brand Brain reads it all and builds a model of your voice — your tone, your sentence rhythm, your opinions, your way of seeing the world.
                </p>
                <p style={{ fontSize:14, color:T3, lineHeight:1.8, fontFamily:SANS, marginBottom:28 }}>
                  Most AI tools make you sound like everyone else. Brand Brain makes you sound like the best version of yourself — direct, confident, always on-point. Users hit 90%+ voice match within a week.
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {['Trained on your exact writing and vocabulary','Learns your audience, offers, and positioning','Calibrates tone — confident without being arrogant','Sharpens itself every time you generate something new'].map(f => (
                    <div key={f} style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:13, fontFamily:SANS, color:T2 }}>
                      <span style={{ color:CYAN, flexShrink:0, marginTop:2 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </span>{f}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Brand Brain illustration */}
            <Reveal from="right" delay={150}>
              <div style={{ position:'relative', height:360, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {/* Outer rings */}
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ position:'absolute', width:280+i*70, height:280+i*70, borderRadius:'50%', border:`1px solid rgba(0,170,255,${0.18-i*0.04})`, animation:`ring-expand ${2.5+i*0.6}s ease infinite ${i*0.4}s` }}/>
                ))}
                {/* Center sphere */}
                <div style={{ width:120, height:120, borderRadius:'50%', background:'radial-gradient(circle at 35% 35%,rgba(0,170,255,0.35) 0%,rgba(0,170,255,0.08) 60%,transparent 100%)', border:`1px solid rgba(0,170,255,0.4)`, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', zIndex:2, boxShadow:`0 0 60px rgba(0,170,255,0.20)` }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.2" strokeLinecap="round">
                    <path d="M9.5 2a2.5 2.5 0 0 1 5 0"/><path d="M9.5 22a2.5 2.5 0 0 0 5 0"/>
                    <path d="M14.5 2C17 2 19 4 19 6.5c0 2-1.5 3.5-3.5 4C17 11 19 12.5 19 15c0 2.5-2 4.5-4.5 4.5"/>
                    <path d="M9.5 2C7 2 5 4 5 6.5c0 2 1.5 3.5 3.5 4C7 11 5 12.5 5 15c0 2.5 2 4.5 4.5 4.5"/>
                  </svg>
                </div>
                {/* Orbiting labels */}
                {[{label:'Voice',angle:0},{label:'Tone',angle:72},{label:'Audience',angle:144},{label:'Offers',angle:216},{label:'Goals',angle:288}].map(({ label, angle }) => {
                  const rad = (angle - 90) * Math.PI / 180
                  const r = 150
                  const x = Math.cos(rad) * r
                  const y = Math.sin(rad) * r
                  return (
                    <div key={label} style={{ position:'absolute', left:`calc(50% + ${x}px)`, top:`calc(50% + ${y}px)`, transform:'translate(-50%,-50%)', padding:'5px 12px', background:'rgba(10,10,14,0.90)', border:`1px solid rgba(0,170,255,0.25)`, borderRadius:20, fontSize:11, fontFamily:MONO, color:CYAN, whiteSpace:'nowrap', backdropFilter:'blur(8px)' }}>
                      {label}
                    </div>
                  )
                })}
                {/* Score badge */}
                <div style={{ position:'absolute', bottom:10, right:20, padding:'10px 16px', background:'rgba(0,170,255,0.08)', border:`1px solid rgba(0,170,255,0.25)`, borderRadius:12, textAlign:'center' as const, backdropFilter:'blur(12px)' }}>
                  <div style={{ fontFamily:MONO, fontSize:28, fontWeight:300, color:CYAN, letterSpacing:'-0.04em' }}>94%</div>
                  <div style={{ fontSize:9, color:T4, fontFamily:MONO, marginTop:2 }}>VOICE MATCH</div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Divider line */}
        <div style={{ width:1, height:80, background:'linear-gradient(to bottom,transparent,rgba(0,170,255,0.25),transparent)', margin:'0 auto' }}/>

        {/* ── ACT 2: Studio ── */}
        <div style={{ padding:'80px 40px', maxWidth:1100, margin:'0 auto' }}>
          <div className="grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center' }}>

            {/* Studio illustration — format grid */}
            <Reveal from="left" delay={100}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[
                  { type:'Post', platform:'Instagram', color:'#E1306C', preview:'Direct, no-fluff, confident. 3 punchy lines. CTA that actually converts...', icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="white" stroke="none"/></svg> },
                  { type:'Video Script', platform:'TikTok', color:'#FF0050', preview:'Hook: "Most people get this wrong..." — 60s script, your delivery style...', icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg> },
                  { type:'Email', platform:'Sequence', color:CYAN, preview:'Subject: The one thing your competitors aren\'t doing yet...', icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
                  { type:'Ad Creative', platform:'Meta', color:'#4ade80', preview:'Headline: Stop paying for content that doesn\'t convert...', icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg> },
                  { type:'Image', platform:'LinkedIn', color:'#0A66C2', preview:'Brand-consistent visual — your colors, your typography, your style...', icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
                  { type:'Voiceover', platform:'Podcast', color:'#fb923c', preview:'60s audio in your exact voice, tone, and pacing...', icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg> },
                ].map((item, i) => (
                  <Reveal key={item.type} delay={i * 60} from="scale">
                    <div className="lift" style={{ padding:'16px', background:'rgba(255,255,255,0.03)', border:`1px solid ${LINE}`, borderRadius:12, cursor:'default' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                        <div style={{ width:26, height:26, borderRadius:7, background:item.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{item.icon}</div>
                        <div>
                          <div style={{ fontSize:12, fontWeight:700, color:T1, fontFamily:DISPLAY, letterSpacing:'-0.01em' }}>{item.type}</div>
                          <div style={{ fontSize:10, color:T4, fontFamily:MONO }}>{item.platform}</div>
                        </div>
                      </div>
                      <p style={{ fontSize:11, color:T4, lineHeight:1.5, fontFamily:SANS, fontStyle:'italic' }}>{item.preview}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </Reveal>

            <Reveal from="right" delay={100}>
              <div>
                <div style={{ fontSize:11, fontFamily:MONO, color:CYAN, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:20, opacity:0.7 }}>02 — Then it creates</div>
                <h2 style={{ fontFamily:DISPLAY, fontWeight:800, fontSize:'clamp(32px,4.5vw,52px)', letterSpacing:'-0.04em', color:T1, lineHeight:1.05, marginBottom:20 }}>
                  Every format.<br/>Every platform.<br/>All in your voice.
                </h2>
                <p style={{ fontFamily:SERIF, fontStyle:'italic', fontSize:18, color:T3, marginBottom:24, lineHeight:1.65 }}>
                  Text posts. Images. Videos. Voiceovers. Ad creatives. Email sequences. All generated in the Studio — and every single output sounds like you, not like a robot pretending to be you.
                </p>
                <div style={{ padding:'16px 18px', background:CYAN2, border:`1px solid rgba(0,170,255,0.20)`, borderRadius:10, marginBottom:20 }}>
                  <div style={{ fontSize:11, fontFamily:MONO, color:CYAN, letterSpacing:'0.06em', marginBottom:6 }}>CREDIT COSTS</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 16px' }}>
                    {[['Post / Caption','2–3 cr'],['Image','5 cr'],['Short Video (8s)','10 cr'],['Full Video (16s)','20 cr'],['Voiceover (30s)','5 cr'],['Email / Ad copy','5 cr']].map(([l,c]) => (
                      <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:T3, fontFamily:SANS }}>
                        <span>{l}</span><span style={{ color:CYAN, fontFamily:MONO }}>{c}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize:10, color:T4, fontFamily:SANS, marginTop:8 }}>Strategy, chat, and scheduling are always free.</div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        <div style={{ width:1, height:80, background:'linear-gradient(to bottom,transparent,rgba(0,170,255,0.25),transparent)', margin:'0 auto' }}/>

        {/* ── ACT 3: Strategy + Schedule ── */}
        <div style={{ padding:'80px 40px', maxWidth:1100, margin:'0 auto' }}>
          <div className="grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center' }}>
            <Reveal from="left">
              <div>
                <div style={{ fontSize:11, fontFamily:MONO, color:CYAN, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:20, opacity:0.7 }}>03 — Then it plans</div>
                <h2 style={{ fontFamily:DISPLAY, fontWeight:800, fontSize:'clamp(32px,4.5vw,52px)', letterSpacing:'-0.04em', color:T1, lineHeight:1.05, marginBottom:20 }}>
                  30-day strategy.<br/>Built in seconds.<br/>Published automatically.
                </h2>
                <p style={{ fontFamily:SERIF, fontStyle:'italic', fontSize:18, color:T3, marginBottom:24, lineHeight:1.65 }}>
                  Tell Nexa your goals. It builds a complete content calendar — topics, formats, posting times, platform mix — all tuned to your audience and competitive landscape.
                </p>
                <p style={{ fontSize:14, color:T3, lineHeight:1.8, fontFamily:SANS, marginBottom:24 }}>
                  Connect Instagram, LinkedIn, X, and TikTok. Schedule weeks in advance. Nexa publishes at the exact right time, monitors performance, and adjusts the plan based on what's working.
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {['AI-generated 30-day content calendar','Optimal posting times by platform + audience','Topic clusters that build category authority','Auto-publish across Instagram, LinkedIn, X, TikTok'].map(f => (
                    <div key={f} style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:13, fontFamily:SANS, color:T2 }}>
                      <span style={{ color:'#4ade80', flexShrink:0, marginTop:2 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </span>{f}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Calendar illustration */}
            <Reveal from="right" delay={150}>
              <div style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${LINE}`, borderRadius:16, padding:24, position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${CYAN}40,transparent)` }}/>
                <div style={{ fontSize:9, color:T4, fontFamily:MONO, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:16 }}>Content Calendar — March</div>
                {/* Day headers */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:6 }}>
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                    <div key={d} style={{ textAlign:'center', fontSize:9, color:T4, fontFamily:MONO }}>{d}</div>
                  ))}
                </div>
                {/* Calendar grid */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
                  {Array.from({length:31},(_,i)=>{
                    const scheduled = [1,3,5,8,10,12,15,17,19,22,24,26,29,31].includes(i+1)
                    const today = i+1 === 18
                    const colors: Record<number,string> = {1:'#E1306C',3:CYAN,5:'#4ade80',8:'#0A66C2',10:'#E1306C',12:CYAN,15:'#4ade80',17:'#0A66C2',19:CYAN,22:'#E1306C',24:'#4ade80',26:CYAN,29:'#0A66C2',31:'#4ade80'}
                    return (
                      <div key={i} style={{ aspectRatio:'1/1', borderRadius:6, background:today?`rgba(0,170,255,0.15)`:scheduled?`${colors[i+1]}18`:'rgba(255,255,255,0.02)', border:`1px solid ${today?'rgba(0,170,255,0.45)':scheduled?`${colors[i+1]}40`:LINE}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontSize:9, fontFamily:MONO, color:today?CYAN:scheduled?colors[i+1]:T4 }}>
                        {i+1}
                        {scheduled && <div style={{ width:4, height:4, borderRadius:'50%', background:colors[i+1], marginTop:2 }}/>}
                      </div>
                    )
                  })}
                </div>
                <div style={{ marginTop:14, display:'flex', gap:8, flexWrap:'wrap' as const }}>
                  {[['Instagram','#E1306C'],['LinkedIn','#0A66C2'],['TikTok','#FF0050'],[CYAN,'X']].map(([color,label],i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:5, fontSize:9, color:T4, fontFamily:MONO }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:color }}/>
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        <div style={{ width:1, height:80, background:'linear-gradient(to bottom,transparent,rgba(0,170,255,0.25),transparent)', margin:'0 auto' }}/>

        {/* ── ACT 4: Automate — Sequences + Agents ── */}
        <div style={{ padding:'80px 40px', maxWidth:1100, margin:'0 auto' }}>
          <Reveal>
            <div style={{ textAlign:'center', marginBottom:56 }}>
              <div style={{ fontSize:11, fontFamily:MONO, color:CYAN, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:16, opacity:0.7 }}>04 — Then it runs itself</div>
              <h2 style={{ fontFamily:DISPLAY, fontWeight:800, fontSize:'clamp(32px,5vw,60px)', letterSpacing:'-0.04em', color:T1, lineHeight:1, marginBottom:16 }}>
                Marketing that runs<br/>while you sleep.
              </h2>
              <p style={{ fontFamily:SERIF, fontStyle:'italic', fontSize:18, color:T3, maxWidth:560, margin:'0 auto' }}>
                Agents. Sequences. Automation. Set it up once. It never stops.
              </p>
            </div>
          </Reveal>

          <div className="grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {/* Email sequences illustration */}
            <Reveal from="left" delay={100}>
              <div className="lift" style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${LINE}`, borderRadius:16, padding:28, height:'100%' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:CYAN2, border:`1px solid rgba(0,170,255,0.25)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.5" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:T1, fontFamily:DISPLAY, letterSpacing:'-0.02em' }}>Email Sequences</div>
                    <div style={{ fontSize:11, color:T4, fontFamily:SANS }}>Written in your voice. Sent automatically.</div>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {[{d:'Day 1',s:'Welcome — the reason I built this',o:'68%'},{d:'Day 3',s:'The mistake 90% of founders make',o:'54%'},{d:'Day 5',s:'How I 3× my revenue in 6 months',o:'61%'},{d:'Day 7',s:'The offer — and why you\'re ready',o:'41%'},{d:'Day 10',s:'Last call — but no pressure',o:'38%'}].map((item,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:'rgba(255,255,255,0.02)', border:`1px solid ${LINE}`, borderRadius:8 }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', background:CYAN2, border:`1px solid rgba(0,170,255,0.25)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontFamily:MONO, color:CYAN, flexShrink:0 }}>{i+1}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:10, fontWeight:600, color:T4, fontFamily:MONO }}>{item.d}</div>
                        <div style={{ fontSize:12, color:T2, fontFamily:SANS, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.s}</div>
                      </div>
                      <div style={{ fontSize:10, color:'#4ade80', fontFamily:MONO, flexShrink:0 }}>{item.o}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(74,222,128,0.05)', border:'1px solid rgba(74,222,128,0.15)', borderRadius:8, fontSize:11, color:'#4ade80', fontFamily:SANS }}>
                  Every new lead automatically enters the sequence. You never follow up manually again.
                </div>
              </div>
            </Reveal>

            {/* Agents illustration */}
            <Reveal from="right" delay={150}>
              <div className="lift" style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${LINE}`, borderRadius:16, padding:28, height:'100%' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:'rgba(167,139,250,0.10)', border:'1px solid rgba(167,139,250,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:T1, fontFamily:DISPLAY, letterSpacing:'-0.02em' }}>Autonomous Agents</div>
                    <div style={{ fontSize:11, color:T4, fontFamily:SANS }}>Your marketing team that never sleeps.</div>
                  </div>
                </div>
                {[
                  { name:'Content Agent', action:'Generated 3 posts for today', time:'2 min ago', color:'#4ade80', active:true },
                  { name:'Timing Agent', action:'Found optimal slot: Tue 9AM, Fri 7PM', time:'1 hr ago', color:CYAN, active:true },
                  { name:'Competitor Watch', action:'Alert: rival launched new offer', time:'3 hrs ago', color:'#fb923c', active:true },
                  { name:'Insights Agent', action:'Weekly digest ready — 41K reach', time:'8 hrs ago', color:'#a78bfa', active:true },
                  { name:'Ad Monitor', action:'Campaign CTR up 24% vs last week', time:'Morning', color:'#4ade80', active:false },
                ].map((agent,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px', background:'rgba(255,255,255,0.02)', border:`1px solid ${LINE}`, borderRadius:8, marginBottom:6 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:agent.color, marginTop:4, flexShrink:0, boxShadow:agent.active?`0 0 6px ${agent.color}`:'none' }}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:11, fontWeight:600, color:T2, fontFamily:SANS }}>{agent.name}</div>
                      <div style={{ fontSize:11, color:T4, fontFamily:SANS, marginTop:1 }}>{agent.action}</div>
                    </div>
                    <div style={{ fontSize:9, color:T4, fontFamily:MONO, flexShrink:0 }}>{agent.time}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>

        <div style={{ width:1, height:80, background:'linear-gradient(to bottom,transparent,rgba(0,170,255,0.25),transparent)', margin:'0 auto' }}/>

        {/* ── ACT 5: Amplify ── */}
        <div style={{ padding:'80px 40px', maxWidth:1100, margin:'0 auto' }}>
          <div className="grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center' }}>
            <Reveal from="left">
              <div>
                <div style={{ fontSize:11, fontFamily:MONO, color:CYAN, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:20, opacity:0.7 }}>05 — Then it amplifies</div>
                <h2 style={{ fontFamily:DISPLAY, fontWeight:800, fontSize:'clamp(32px,4.5vw,52px)', letterSpacing:'-0.04em', color:T1, lineHeight:1.05, marginBottom:20 }}>
                  Your best content<br/>becomes your<br/>best ad.
                </h2>
                <p style={{ fontFamily:SERIF, fontStyle:'italic', fontSize:18, color:T3, marginBottom:24, lineHeight:1.65 }}>
                  Amplify turns your top-performing content into Meta ad campaigns — with AI-written copy, AI-generated creatives, and direct publishing to Facebook and Instagram. One click from Studio to live ad.
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:24 }}>
                  {['AI ad copy and hooks from your brand voice','Image and video creatives in your brand style','Audience targeting recommendations','Direct Meta Ads publishing — no Ads Manager needed','Daily performance monitoring + AI insights'].map(f => (
                    <div key={f} style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:13, fontFamily:SANS, color:T2 }}>
                      <span style={{ color:CYAN, flexShrink:0, marginTop:2 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </span>{f}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Amplify illustration */}
            <Reveal from="right" delay={150}>
              <div style={{ position:'relative' }}>
                {/* Big metrics */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
                  {[{label:'ROAS',value:4.2,suffix:'×',color:'#4ade80',trend:'+18%'},{label:'CTR',value:3.8,suffix:'%',color:CYAN,trend:'+24%'},{label:'CPL',value:4.1,prefix:'$',color:'#fb923c',trend:'-31%'}].map((m,i) => (
                    <Reveal key={m.label} delay={i*80} from="scale">
                      <div style={{ padding:'16px', background:'rgba(255,255,255,0.03)', border:`1px solid ${LINE}`, borderRadius:12, textAlign:'center' as const }}>
                        <div style={{ fontFamily:MONO, fontSize:28, fontWeight:300, color:m.color, letterSpacing:'-0.04em', lineHeight:1 }}>
                          {m.prefix}<Counter to={m.value*10}/>{m.suffix === '×' ? '×' : m.suffix === '%' ? '%' : ''}
                        </div>
                        <div style={{ fontSize:9, color:T4, fontFamily:MONO, marginTop:4 }}>{m.label}</div>
                        <div style={{ fontSize:10, color:m.color, fontFamily:MONO, marginTop:3 }}>{m.trend}</div>
                      </div>
                    </Reveal>
                  ))}
                </div>

                {/* Performance chart */}
                <div style={{ padding:'18px', background:'rgba(255,255,255,0.02)', border:`1px solid ${LINE}`, borderRadius:14 }}>
                  <div style={{ fontSize:9, color:T4, fontFamily:MONO, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:14 }}>Ad Performance — Last 30 Days</div>
                  <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:60 }}>
                    {[22,35,28,44,38,52,48,60,55,68,62,72,66,78,72,80,76,84,80,88,82,90,86,92,88,94,90,96,94,100].map((h,i) => (
                      <div key={i} style={{ flex:1, height:`${h}%`, background:i>24?CYAN:`rgba(0,170,255,${0.1+i*0.025})`, borderRadius:'2px 2px 0 0', transition:'height 0.3s' }}/>
                    ))}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:9, color:T4, fontFamily:MONO }}>
                    <span>Mar 1</span><span>Mar 15</span><span>Mar 30</span>
                  </div>
                </div>

                {/* Live ad preview */}
                <div style={{ marginTop:10, padding:'14px 16px', background:'rgba(0,170,255,0.05)', border:`1px solid rgba(0,170,255,0.20)`, borderRadius:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80', boxShadow:'0 0 6px #4ade80' }}/>
                    <span style={{ fontSize:10, color:'#4ade80', fontFamily:MONO }}>LIVE · Spring Campaign</span>
                    <span style={{ marginLeft:'auto', fontSize:10, color:T4, fontFamily:MONO }}>$48.20 spent</span>
                  </div>
                  <div style={{ fontSize:11, color:T3, fontFamily:SANS }}>Reaching 14,200 people in your target audience. CTR tracking 3.8% — above industry avg.</div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        <div style={{ width:1, height:80, background:'linear-gradient(to bottom,transparent,rgba(0,170,255,0.25),transparent)', margin:'0 auto' }}/>

        {/* ── ACT 6: Lead Page + Insights ── */}
        <div style={{ padding:'80px 40px', maxWidth:1100, margin:'0 auto' }}>
          <div className="grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {/* Lead capture */}
            <Reveal from="left" delay={100}>
              <div className="lift" style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${LINE}`, borderRadius:16, padding:28, position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${CYAN}55,transparent)` }}/>
                <div style={{ fontSize:11, fontFamily:MONO, color:CYAN, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:16, opacity:0.7 }}>06 — Lead Capture</div>
                <h3 style={{ fontFamily:DISPLAY, fontWeight:800, fontSize:24, color:T1, letterSpacing:'-0.03em', marginBottom:12, lineHeight:1.1 }}>Turn followers<br/>into contacts.</h3>
                <p style={{ fontSize:13, color:T3, fontFamily:SANS, lineHeight:1.7, marginBottom:18 }}>
                  Your Nexa lead page lives at nexaa.cc/yourname. Drop the link in your bio. Every person who visits gets captured — automatically enrolled in your email sequence, automatically followed up with.
                </p>
                {/* Simulated lead form */}
                <div style={{ padding:'16px', background:'rgba(255,255,255,0.02)', border:`1px solid ${LINE}`, borderRadius:10 }}>
                  <div style={{ fontSize:10, color:T4, fontFamily:MONO, marginBottom:10 }}>nexaa.cc/ahmed → live lead form</div>
                  {['Full name','Email address','What\'s your biggest challenge?'].map((ph,i) => (
                    <div key={i} style={{ marginBottom:8 }}>
                      <div style={{ height:34, background:'rgba(255,255,255,0.04)', border:`1px solid ${LINE2}`, borderRadius:7, padding:'0 12px', display:'flex', alignItems:'center', fontSize:11, color:T4, fontFamily:SANS }}>{ph}</div>
                    </div>
                  ))}
                  <div style={{ height:36, background:CYAN, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#000', fontFamily:DISPLAY }}>Get the free guide →</div>
                </div>
                <div style={{ marginTop:12, fontSize:11, color:'#4ade80', fontFamily:SANS }}>↑ 3 new leads captured today · Auto-enrolled in sequence</div>
              </div>
            </Reveal>

            {/* Insights */}
            <Reveal from="right" delay={150}>
              <div className="lift" style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${LINE}`, borderRadius:16, padding:28, position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,rgba(74,222,128,0.55),transparent)' }}/>
                <div style={{ fontSize:11, fontFamily:MONO, color:'#4ade80', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:16, opacity:0.7 }}>07 — Insights</div>
                <h3 style={{ fontFamily:DISPLAY, fontWeight:800, fontSize:24, color:T1, letterSpacing:'-0.03em', marginBottom:12, lineHeight:1.1 }}>See what's<br/>actually working.</h3>
                <p style={{ fontSize:13, color:T3, fontFamily:SANS, lineHeight:1.7, marginBottom:18 }}>
                  All your performance data in one view. Impressions, engagement, follower growth, email open rates. Hit "Explain with AI" and Nexa tells you exactly what to do next week.
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
                  {[{l:'Impressions',v:'41.2K',c:CYAN,trend:'+18%'},{l:'Engagement',v:'3,840',c:'#a78bfa',trend:'+24%'},{l:'New followers',v:'+312',c:'#4ade80',trend:'+31%'},{l:'Email open rate',v:'54%',c:'#fb923c',trend:'+8%'}].map((s,i) => (
                    <div key={i} style={{ padding:'12px', background:'rgba(255,255,255,0.03)', border:`1px solid ${LINE}`, borderRadius:10 }}>
                      <div style={{ fontSize:9, color:T4, fontFamily:MONO, marginBottom:4 }}>{s.l}</div>
                      <div style={{ fontFamily:MONO, fontSize:20, fontWeight:300, color:s.c, letterSpacing:'-0.03em', lineHeight:1 }}>{s.v}</div>
                      <div style={{ fontSize:10, color:s.c, fontFamily:MONO, marginTop:3 }}>{s.trend}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:12, padding:'10px 12px', background:'rgba(255,255,255,0.02)', border:`1px solid ${LINE}`, borderRadius:8, fontSize:11, color:T3, fontFamily:SANS, fontStyle:'italic' }}>
                  "Your Tuesday posts consistently outperform. Double down on Thursday — your audience is there but you're not posting."
                </div>
              </div>
            </Reveal>
          </div>
        </div>

      </section>

      {/* ════════════════════════════════
          4. NUMBERS
      ════════════════════════════════ */}
      <section style={{ padding:'100px 40px', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <Reveal>
            <div style={{ textAlign:'center', marginBottom:64 }}>
              <h2 style={{ fontFamily:DISPLAY, fontWeight:800, fontSize:'clamp(32px,5vw,56px)', letterSpacing:'-0.04em', color:T1, marginBottom:12 }}>Built for builders.</h2>
              <p style={{ fontFamily:SERIF, fontStyle:'italic', fontSize:18, color:T3 }}>The results speak for themselves.</p>
            </div>
          </Reveal>
          <div className="grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, background:LINE, borderRadius:16, overflow:'hidden' }}>
            {[
              { num:2400, suffix:'+', label:'businesses on Nexa', sub:'and growing every day', color:CYAN },
              { num:94, suffix:'%', label:'report more consistent posting', sub:'within the first 30 days', color:'#4ade80' },
              { num:12, suffix:'×', label:'faster content production', sub:'vs. writing from scratch', color:'#fb923c' },
            ].map(({ num, suffix, label, sub, color }) => (
              <Reveal key={label} from="scale">
                <div style={{ background:'#080808', padding:'52px 36px', textAlign:'center' as const }}>
                  <div style={{ fontFamily:MONO, fontWeight:300, fontSize:'clamp(44px,7vw,72px)', color, letterSpacing:'-0.05em', lineHeight:1, animation:'float 4s ease-in-out infinite' }}>
                    <Counter to={num}/>{suffix}
                  </div>
                  <div style={{ fontSize:14, color:T2, marginTop:12, fontFamily:SANS, fontWeight:600 }}>{label}</div>
                  <div style={{ fontSize:12, color:T4, marginTop:4, fontFamily:SANS }}>{sub}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          5. TESTIMONIALS
      ════════════════════════════════ */}
      <section style={{ padding:'80px 40px', maxWidth:1100, margin:'0 auto', position:'relative', zIndex:1 }}>
        <Reveal>
          <div style={{ textAlign:'center', marginBottom:64 }}>
            <div style={{ fontSize:11, fontFamily:MONO, color:T4, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:16 }}>Real people. Real results.</div>
            <h2 style={{ fontFamily:DISPLAY, fontWeight:800, fontSize:'clamp(32px,5vw,52px)', letterSpacing:'-0.04em', color:T1 }}>
              What happens when you<br/>stop fighting content.
            </h2>
          </div>
        </Reveal>
        <div className="grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          {[
            { name:'Lena Fischer', role:'Founder, Bloom Skincare', body:'I post more in a week with Nexa than I used to in a month. And somehow it sounds more like me than when I was writing it myself.', avatar:'LF', color:CYAN },
            { name:'Marcus Reed', role:'CEO, Reed Capital', body:'The competitor intel alone is worth the subscription. Knowing what is working for rivals in real time is an unfair advantage.', avatar:'MR', color:'#4ade80' },
            { name:'Aisha Okonkwo', role:'Marketing Director, Zenith', body:'We run 22 client brands through the Agency plan. It replaced three tools and one full-time hire.', avatar:'AO', color:'#a78bfa' },
            { name:'Tom Bauer', role:'Solo consultant', body:'My LinkedIn reach went from 800 to 41,000 impressions per month. Nexa runs my content while I sleep.', avatar:'TB', color:'#fb923c' },
            { name:'Priya Nair', role:'E-commerce founder', body:'The email sequences are the real gem. We set them up once and they convert on autopilot every single week.', avatar:'PN', color:CYAN },
            { name:'James Oluwole', role:'Agency owner', body:'Our clients used to churn when content slowed down. Now Nexa keeps the pipeline full. Churn is down 60%.', avatar:'JO', color:'#4ade80' },
          ].map(({ name, role, body, avatar, color }, i) => (
            <Reveal key={name} delay={i * 60} from={i % 3 === 0 ? 'left' : i % 3 === 2 ? 'right' : 'bottom'}>
              <div className="lift" style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${LINE}`, borderRadius:14, padding:'26px 24px', height:'100%' }}>
                <p style={{ fontSize:14, fontFamily:SANS, color:T2, lineHeight:1.75, marginBottom:22, fontStyle:'italic' }}>&ldquo;{body}&rdquo;</p>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:`${color}18`, border:`1px solid ${color}35`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontFamily:MONO, color, flexShrink:0 }}>{avatar}</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, fontFamily:DISPLAY, color:T1, letterSpacing:'-0.02em' }}>{name}</div>
                    <div style={{ fontSize:11, color:T4, fontFamily:SANS }}>{role}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════
          6. PRICING
      ════════════════════════════════ */}
      <section id="pricing" style={{ padding:'100px 40px', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <Reveal>
            <div style={{ textAlign:'center', marginBottom:64 }}>
              <div style={{ fontSize:11, fontFamily:MONO, color:T4, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:16 }}>Pricing</div>
              <h2 style={{ fontFamily:DISPLAY, fontWeight:800, fontSize:'clamp(36px,5.5vw,64px)', letterSpacing:'-0.04em', color:T1, marginBottom:12, lineHeight:1 }}>
                Simple. Honest. Scalable.
              </h2>
              <p style={{ fontFamily:SERIF, fontStyle:'italic', fontSize:18, color:T3 }}>Start free. Upgrade when you're ready. Cancel anytime.</p>
            </div>
          </Reveal>

          {/* Plan cards */}
          <div className="grid-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
            {[
              { id:'spark', name:'Spark', tagline:'The Creator', price:49, credits:1000, color:'rgba(255,255,255,0.65)', popular:false, trial:'200 credits free to start', cta:'Start with Spark' },
              { id:'grow', name:'Grow', tagline:'The Grower', price:89, credits:3000, color:CYAN, popular:true, trial:null, cta:'Start with Grow' },
              { id:'scale', name:'Scale', tagline:'The Operator', price:169, credits:7000, color:'#a78bfa', popular:false, trial:null, cta:'Start with Scale' },
              { id:'agency', name:'Agency', tagline:'The Agency', price:349, credits:20000, color:'#fb923c', popular:false, trial:null, cta:'Start with Agency' },
            ].map((plan, i) => (
              <Reveal key={plan.id} delay={i * 80} from="scale">
                <div className="lift" style={{ background:plan.popular?'rgba(0,170,255,0.06)':'rgba(255,255,255,0.02)', border:`1px solid ${plan.popular?'rgba(0,170,255,0.30)':LINE}`, borderRadius:16, padding:'28px 22px', position:'relative', height:'100%' }}>
                  {plan.popular && (
                    <div style={{ position:'absolute', top:-1, left:'50%', transform:'translateX(-50%)', fontSize:9, fontFamily:MONO, color:'#000', padding:'4px 12px', background:CYAN, borderRadius:'0 0 8px 8px', letterSpacing:'0.08em', fontWeight:700, whiteSpace:'nowrap' }}>MOST POPULAR</div>
                  )}
                  {plan.trial && (
                    <div style={{ fontSize:9, fontFamily:MONO, color:'#4ade80', padding:'3px 9px', background:'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.20)', borderRadius:6, display:'inline-block', marginBottom:14, letterSpacing:'0.06em' }}>{plan.trial.toUpperCase()}</div>
                  )}
                  <div style={{ fontFamily:DISPLAY, fontWeight:800, fontSize:20, color:plan.popular?CYAN:T1, marginBottom:2, letterSpacing:'-0.03em' }}>{plan.name}</div>
                  <div style={{ fontSize:11, color:T4, fontFamily:SANS, fontStyle:'italic', marginBottom:18 }}>{plan.tagline}</div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:3, marginBottom:6 }}>
                    <span style={{ fontFamily:MONO, fontWeight:300, fontSize:40, color:T1, letterSpacing:'-0.05em', lineHeight:1 }}>${plan.price}</span>
                    <span style={{ fontSize:12, color:T4, fontFamily:SANS }}>/mo</span>
                  </div>
                  <div style={{ fontSize:11, fontFamily:MONO, color:plan.color, marginBottom:20 }}>{plan.credits.toLocaleString()} credits/mo</div>
                  <Link href="/auth/signup" style={{ display:'block', textAlign:'center', padding:'11px', borderRadius:9, background:plan.popular?CYAN:'transparent', color:plan.popular?'#000':T2, border:plan.popular?'none':`1px solid ${LINE2}`, fontSize:13, fontWeight:700, fontFamily:DISPLAY, textDecoration:'none', letterSpacing:'-0.02em', transition:'all 0.2s' }}>
                    {plan.cta}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Full comparison link */}
          <Reveal>
            <div style={{ textAlign:'center' }}>
              <Link href="/landing/pricing" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 24px', background:'rgba(255,255,255,0.03)', border:`1px solid ${LINE2}`, borderRadius:10, fontSize:13, color:T3, textDecoration:'none', fontFamily:SANS, transition:'all 0.2s' }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color=T1}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color=T3}>
                View full feature comparison →
              </Link>
              <p style={{ fontSize:12, color:T4, marginTop:14, fontFamily:SANS }}>All plans include a 7-day money-back guarantee.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════
          7. FAQ
      ════════════════════════════════ */}
      <section id="faq" style={{ padding:'80px 40px', maxWidth:720, margin:'0 auto', position:'relative', zIndex:1 }}>
        <Reveal>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <div style={{ fontSize:11, fontFamily:MONO, color:T4, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:16 }}>Questions</div>
            <h2 style={{ fontFamily:DISPLAY, fontWeight:800, fontSize:'clamp(32px,5vw,52px)', letterSpacing:'-0.04em', color:T1 }}>Every question<br/>answered honestly.</h2>
          </div>
        </Reveal>
        <div style={{ border:`1px solid ${LINE}`, borderRadius:14, overflow:'hidden' }}>
          {FAQS.map(({ q, a }, i) => (
            <div key={i} style={{ borderBottom:i<FAQS.length-1?`1px solid ${LINE}`:'none' }}>
              <button onClick={() => setFaqOpen(faqOpen===i?null:i)}
                style={{ width:'100%', background:'none', border:'none', padding:'22px 28px', textAlign:'left', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', gap:16 }}>
                <span style={{ fontSize:15, fontWeight:700, fontFamily:DISPLAY, color:T1, letterSpacing:'-0.02em' }}>{q}</span>
                <span style={{ fontSize:20, flexShrink:0, transition:'transform 0.25s, color 0.2s', transform:faqOpen===i?'rotate(45deg)':'none', color:faqOpen===i?CYAN:T4 }}>+</span>
              </button>
              {faqOpen===i && (
                <div style={{ padding:'0 28px 22px', fontSize:14, fontFamily:SANS, color:T3, lineHeight:1.8, animation:'fadeUp 0.25s ease both' }}>{a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════
          8. FINAL CTA
      ════════════════════════════════ */}
      <section style={{ padding:'120px 40px', textAlign:'center', position:'relative', zIndex:1, overflow:'hidden' }}>
        {/* Large blurred cyan glow behind CTA */}
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'60vw', height:'40vh', borderRadius:'50%', background:CYAN, filter:'blur(120px)', opacity:0.06, pointerEvents:'none' }}/>
        <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(${LINE} 1px,transparent 1px),linear-gradient(90deg,${LINE} 1px,transparent 1px)`, backgroundSize:'60px 60px', opacity:0.25, pointerEvents:'none' }}/>

        <Reveal>
          <div style={{ position:'relative', zIndex:1 }}>
            <h2 style={{ fontFamily:DISPLAY, fontWeight:800, fontSize:'clamp(44px,8vw,100px)', letterSpacing:'-0.05em', color:T1, lineHeight:0.92, marginBottom:20 }}>
              Stop planning.<br/><span className="grad-text">Start building.</span>
            </h2>
            <p style={{ fontFamily:SERIF, fontStyle:'italic', fontSize:'clamp(16px,2.2vw,22px)', color:T3, maxWidth:520, margin:'0 auto 48px', lineHeight:1.65 }}>
              Every day you wait is a day your competitors are showing up. Your audience is out there. The content is already inside you. Nexa just gets it out.
            </p>
            <Link href="/auth/signup" className="cta-glow" style={{ display:'inline-block', padding:'18px 48px', borderRadius:12, background:CYAN, color:'#000', fontSize:16, fontWeight:800, fontFamily:DISPLAY, textDecoration:'none', letterSpacing:'-0.03em', transition:'all 0.2s' }}>
              Start free — 150 credits on us →
            </Link>
            <p style={{ fontSize:13, color:T4, marginTop:18, fontFamily:MONO }}>No credit card · 3-minute setup · Cancel anytime</p>
          </div>
        </Reveal>
      </section>

      {/* ════════════════════════════════
          FOOTER
      ════════════════════════════════ */}
      <footer style={{ borderTop:`1px solid ${LINE}`, padding:'56px 40px 32px', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div className="grid-4" style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:40, marginBottom:56 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                <Image src="/favicon.png" alt="Nexa" width={22} height={22} style={{ borderRadius:6 }}/>
                <span style={{ fontFamily:DISPLAY, fontWeight:800, fontSize:16, color:T1, letterSpacing:'-0.03em' }}>Nexa</span>
              </div>
              <p style={{ fontSize:13, color:T4, lineHeight:1.7, fontFamily:SANS, maxWidth:260, marginBottom:20 }}>
                The AI platform that learns your brand voice, builds your strategy, and runs your content marketing — on autopilot.
              </p>
              <p style={{ fontSize:12, color:T4, fontFamily:MONO }}>Dubai, UAE · hello@nexaa.cc</p>
            </div>
            <div>
              <div style={{ fontSize:10, fontFamily:MONO, color:T4, letterSpacing:'0.10em', textTransform:'uppercase', marginBottom:16 }}>Product</div>
              {['Brand Brain','Studio','Strategy','Agents','Sequences','Amplify','Integrations','Insights'].map(item => (
                <div key={item} style={{ marginBottom:9 }}>
                  <Link href="/auth/signup" style={{ fontSize:13, color:T3, textDecoration:'none', fontFamily:SANS, transition:'color 0.15s' }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color=T1}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color=T3}>{item}</Link>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize:10, fontFamily:MONO, color:T4, letterSpacing:'0.10em', textTransform:'uppercase', marginBottom:16 }}>Company</div>
              {[['About','about'],['Pricing','#pricing'],['FAQ','#faq'],['Sign in','/auth/login'],['Start free','/auth/signup']].map(([label,href]) => (
                <div key={label} style={{ marginBottom:9 }}>
                  <a href={href.startsWith('/')|| href.startsWith('#') ? href : `/landing/${href}`} style={{ fontSize:13, color:T3, textDecoration:'none', fontFamily:SANS, transition:'color 0.15s' }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color=T1}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color=T3}>{label}</a>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize:10, fontFamily:MONO, color:T4, letterSpacing:'0.10em', textTransform:'uppercase', marginBottom:16 }}>Legal</div>
              {[['Privacy Policy','/landing/privacy'],['Terms of Service','/landing/terms']].map(([label,href]) => (
                <div key={label} style={{ marginBottom:9 }}>
                  <Link href={href} style={{ fontSize:13, color:T3, textDecoration:'none', fontFamily:SANS, transition:'color 0.15s' }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color=T1}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color=T3}>{label}</Link>
                </div>
              ))}
              <div style={{ marginTop:24 }}>
                <div style={{ fontSize:10, fontFamily:MONO, color:T4, letterSpacing:'0.10em', textTransform:'uppercase', marginBottom:10 }}>Contact</div>
                <a href="mailto:hello@nexaa.cc" style={{ fontSize:13, color:T3, textDecoration:'none', fontFamily:SANS }}>hello@nexaa.cc</a>
              </div>
            </div>
          </div>
          <div style={{ borderTop:`1px solid ${LINE}`, paddingTop:24, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap' as const, gap:10 }}>
            <span style={{ fontSize:12, color:T4, fontFamily:MONO }}>© 2026 Nexa. All rights reserved.</span>
            <span style={{ fontSize:12, color:T4, fontFamily:MONO }}>Built with obsession in Dubai.</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
