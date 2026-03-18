'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'

/* ─── design tokens ─── */
const B = '#000000'
const W = '#ffffff'
const BLUE = '#4DABF7'
const LINE = 'rgba(255,255,255,0.08)'
const LINE2 = 'rgba(255,255,255,0.12)'
const T1 = '#ffffff'
const T2 = 'rgba(255,255,255,0.72)'
const T3 = 'rgba(255,255,255,0.48)'
const DISPLAY = "'Bricolage Grotesque', sans-serif"
const SERIF = "'Instrument Serif', serif"
const MONO = "'Geist Mono', monospace"
const SANS = "'DM Sans', sans-serif"

/* ─── marquee items ─── */
const MARQUEE_ITEMS = [
  'Brand Voice AI', 'Content Studio', 'Auto-Scheduling', 'Email Sequences',
  'AI Strategy', 'Video Generation', 'Social Publishing', 'Meta Ads',
  'Competitor Intel', 'Voice Cloning', 'Client Workspaces',
]

/* ─── plans ─── */
const PLANS = [
  {
    name: 'Spark', price: '$19', period: '/mo',
    desc: 'For solo creators just starting out',
    credits: '500 credits/mo',
    features: ['Brand Brain voice model', 'Studio — copy + images', '30-day content strategy', 'Content scheduling', 'Email support'],
    cta: 'Start with Spark', popular: false,
  },
  {
    name: 'Grow', price: '$39', period: '/mo',
    desc: 'For business owners serious about growth',
    credits: '1,500 credits/mo',
    features: ['Everything in Spark', 'AI Agents + Automation', 'Email sequences', 'Competitor analysis', 'Priority support'],
    cta: 'Start with Grow', popular: true,
  },
  {
    name: 'Scale', price: '$89', period: '/mo',
    desc: 'For established businesses scaling fast',
    credits: '5,000 credits/mo',
    features: ['Everything in Grow', 'Video generation (Veo 3.1)', 'Voice generation', 'Meta Ads (Amplify)', 'Advanced analytics'],
    cta: 'Start with Scale', popular: false,
  },
  {
    name: 'Agency', price: '$349', period: '/mo',
    desc: 'For agencies managing client brands',
    credits: '15,000 credits/mo',
    features: ['Everything in Scale', 'Unlimited client workspaces', 'White-label ready', 'Dedicated onboarding', 'SLA support'],
    cta: 'Start with Agency', popular: false,
  },
]

/* ─── faqs ─── */
const FAQS = [
  { q: 'Will it actually sound like me?', a: 'Yes. Brand Brain trains on your actual writing — your tone, vocabulary, opinions. The more you feed it, the more accurate it gets. Most users hit 90%+ voice match within the first week.' },
  { q: "I'm not a tech person. Will I be able to use this?", a: 'Nexa was designed for business owners, not developers. Setup takes 3 minutes. If you can type a message, you can use Nexa.' },
  { q: 'What is a credit?', a: 'Credits power AI generations. A text post costs 3 credits. An image costs 5. A video costs 20. Chat, strategy, and scheduling are always free.' },
  { q: 'How is Nexa different from ChatGPT?', a: "ChatGPT doesn't know your brand, your audience, your offers, or your strategy. Nexa builds a full Brand Brain from your business data. Every output is calibrated to your voice and goals." },
  { q: 'Can I try before I pay?', a: 'Yes. Every account gets 500 free credits — enough for 160+ posts. No credit card required.' },
  { q: 'Does it work for agencies?', a: 'Yes. The Agency plan gives each client their own isolated workspace with their own Brand Brain, publishing connections, and content history.' },
]

/* ─── testimonials ─── */
const TESTIMONIALS = [
  { name: 'Lena Fischer', role: 'Founder, Bloom Skincare', body: "I post more in a week with Nexa than I used to in a month. And somehow it sounds more like me than when I was writing it myself.", avatar: 'LF' },
  { name: 'Marcus Reed', role: 'CEO, Reed Capital', body: "The competitor intel alone is worth the subscription. Knowing what's working for rivals in real time is an unfair advantage.", avatar: 'MR' },
  { name: 'Aisha Okonkwo', role: 'Marketing Director, Zenith', body: "We run 22 client brands through Nexa's Agency plan. It replaced three tools and one full-time hire.", avatar: 'AO' },
  { name: 'Tom Bauer', role: 'Solo consultant', body: "My LinkedIn reach went from 800 to 41,000 impressions per month. Nexa runs my content while I sleep.", avatar: 'TB' },
  { name: 'Priya Nair', role: 'E-commerce founder', body: "The email sequences are the real gem. We set them up once and they convert on autopilot every single week.", avatar: 'PN' },
  { name: 'James Oluwole', role: 'Agency owner', body: "Our clients used to churn when content slowed down. Now Nexa keeps the pipeline full. Churn is down 60%.", avatar: 'JO' },
]

/* ─── grid card style helper ─── */
function gridCard(extra?: React.CSSProperties): React.CSSProperties {
  return { background: '#0a0a0a', border: `1px solid ${LINE}`, padding: '32px', ...extra }
}

export default function LandingPage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const marqueeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]

  return (
    <div style={{ background: B, color: T1, fontFamily: SANS, overflowX: 'hidden' }}>

      {/* ── KEYFRAMES ── */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.04); }
        }
        .marquee-track { animation: marquee 32s linear infinite; display: flex; gap: 0; width: max-content; }
        .marquee-track:hover { animation-play-state: paused; }
        .fade-up { animation: fadeUp 0.7s ease both; }
        .plan-card { transition: border-color 0.2s, transform 0.2s; }
        .plan-card:hover { border-color: rgba(77,171,247,0.35) !important; transform: translateY(-2px); }
        .faq-item { border-bottom: 1px solid ${LINE}; }
        .faq-item:last-child { border-bottom: none; }
        .nav-link { color: ${T3}; text-decoration: none; font-size: 14px; font-family: ${SANS}; transition: color 0.15s; }
        .nav-link:hover { color: ${T1}; }
        .testimonial-card { transition: border-color 0.2s; }
        .testimonial-card:hover { border-color: rgba(77,171,247,0.25) !important; }
        .feature-row { transition: background 0.15s; }
        .feature-row:hover { background: rgba(255,255,255,0.025) !important; }
      `}</style>

      {/* ── 1. NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        borderBottom: scrolled ? `1px solid ${LINE}` : '1px solid transparent',
        background: scrolled ? 'rgba(0,0,0,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        transition: 'all 0.3s',
        padding: '0 40px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/landing" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <Image src="/favicon.png" alt="Nexa" width={22} height={22} style={{ borderRadius: 6 }} />
          <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 16, color: T1, letterSpacing: '-0.03em' }}>Nexa</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {[['Features', '#features'], ['Pricing', '#pricing'], ['FAQ', '#faq']].map(([label, href]) => (
            <a key={label} href={href} className="nav-link">{label}</a>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/auth/login" style={{ padding: '7px 16px', borderRadius: 8, border: `1px solid ${LINE2}`, background: 'none', color: T2, fontSize: 13, fontFamily: SANS, textDecoration: 'none' }}>Sign in</Link>
          <Link href="/auth/signup" style={{ padding: '7px 18px', borderRadius: 8, background: W, color: B, fontSize: 13, fontWeight: 700, fontFamily: DISPLAY, textDecoration: 'none', letterSpacing: '-0.02em' }}>Start free →</Link>
        </div>
      </nav>

      {/* ── 2. HERO ── */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 40px 80px', textAlign: 'center', position: 'relative' }}>
        {/* faint grid bg */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${LINE} 1px, transparent 1px), linear-gradient(90deg, ${LINE} 1px, transparent 1px)`, backgroundSize: '60px 60px', opacity: 0.5, pointerEvents: 'none' }} />
        {/* radial fade */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(77,171,247,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 900 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, border: `1px solid ${LINE2}`, marginBottom: 32, fontSize: 12, fontFamily: MONO, color: T3, letterSpacing: '0.08em' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 6px #4ade80' }} />
            LIVE — 2,400+ businesses on Nexa
          </div>

          <h1 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(64px, 9vw, 112px)', lineHeight: 0.92, letterSpacing: '-0.05em', marginBottom: 0 }}>
            <span style={{ display: 'block', color: T1 }}>Create.</span>
            <span style={{ display: 'block', color: T1 }}>Automate.</span>
            <span style={{ display: 'block', color: BLUE }}>Dominate.</span>
          </h1>

          <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 'clamp(18px, 2.2vw, 24px)', color: T3, maxWidth: 560, margin: '32px auto 0', lineHeight: 1.6 }}>
            The AI platform that learns your brand voice, builds your strategy, and publishes your content — while you focus on your business.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 40, flexWrap: 'wrap' }}>
            <Link href="/auth/signup" style={{ padding: '14px 32px', borderRadius: 10, background: W, color: B, fontSize: 15, fontWeight: 800, fontFamily: DISPLAY, textDecoration: 'none', letterSpacing: '-0.03em' }}>
              Start free — no card needed →
            </Link>
            <a href="#features" style={{ padding: '14px 24px', borderRadius: 10, border: `1px solid ${LINE2}`, background: 'transparent', color: T2, fontSize: 15, fontFamily: SANS, textDecoration: 'none' }}>
              See how it works
            </a>
          </div>

          <p style={{ fontSize: 12, color: T3, marginTop: 20, fontFamily: MONO }}>500 free credits · No credit card · Setup in 3 min</p>
        </div>

        {/* Browser mockup */}
        <div style={{ position: 'relative', zIndex: 1, marginTop: 80, maxWidth: 900, width: '100%' }}>
          <div style={{ background: '#0d0d0d', border: `1px solid ${LINE2}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)' }}>
            {/* Browser chrome */}
            <div style={{ background: '#111', borderBottom: `1px solid ${LINE}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {['#ff5f57','#ffbd2e','#28c840'].map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
              </div>
              <div style={{ flex: 1, background: '#1a1a1a', borderRadius: 6, padding: '4px 12px', fontSize: 11, fontFamily: MONO, color: T3, textAlign: 'center' }}>nexaa.cc/dashboard</div>
            </div>
            {/* Dashboard preview */}
            <div style={{
              background: 'linear-gradient(135deg, #050510 0%, #07071A 35%, #0A0720 65%, #0F0710 100%)',
              borderLeft: '1px solid rgba(255,255,255,0.07)',
              borderRight: '1px solid rgba(255,255,255,0.07)',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '0 0 12px 12px',
              padding: '28px 24px',
              position: 'relative',
              overflow: 'hidden',
              minHeight: 440,
            }}>
              <div style={{ position:'absolute', top:-80, left:-40, width:380, height:280, borderRadius:'50%', background:'#5B21B6', filter:'blur(130px)', opacity:0.18, pointerEvents:'none' }}/>
              <div style={{ position:'absolute', top:-20, right:-60, width:300, height:220, borderRadius:'50%', background:'#C2410C', filter:'blur(120px)', opacity:0.12, pointerEvents:'none' }}/>
              <div style={{ position:'absolute', bottom:-40, left:'40%', width:260, height:180, borderRadius:'50%', background:'#0C5FBF', filter:'blur(100px)', opacity:0.08, pointerEvents:'none' }}/>

              <div style={{ position:'relative', zIndex:1 }}>
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(255,255,255,0.28)', fontFamily:"'DM Sans',sans-serif", marginBottom:6 }}>Good morning · Wednesday, March 18</div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:12 }}>
                    <div style={{ fontFamily:"'Bricolage Grotesque',system-ui,sans-serif", fontSize:34, fontWeight:800, color:'#fff', letterSpacing:'-0.035em', lineHeight:1 }}>Ahmed</div>
                    <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.28)', fontFamily:"'DM Sans',sans-serif" }}>Command Center</div>
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:16, marginBottom:20 }}>
                  {[
                    {label:'Credits', value:'491', tag:'agency', tagColor:'#4DABF7'},
                    {label:'Built', value:'8', tag:'0 published', tagColor:'#4ADE80'},
                    {label:'Scheduled', value:'1', tag:'upcoming', tagColor:'#4DABF7'},
                    {label:'Streak', value:'14', tag:'days', tagColor:'rgba(255,255,255,0.2)'},
                    {label:'Voice', value:'94', tag:'% match', tagColor:'#4DABF7'},
                  ].map((s,i) => (
                    <div key={i} style={{ paddingRight:i<4?16:0, paddingLeft:i>0?16:0, borderRight:i<4?'1px solid rgba(255,255,255,0.07)':'none' }}>
                      <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.28)', fontFamily:"'DM Sans',sans-serif", marginBottom:6 }}>{s.label}</div>
                      <div style={{ fontFamily:"'Geist Mono',monospace", fontSize:22, fontWeight:300, color:'#fff', letterSpacing:'-0.04em', lineHeight:1, marginBottom:5 }}>{s.value}</div>
                      <div style={{ fontSize:9, color:s.tagColor, fontFamily:"'DM Sans',sans-serif", padding:'1px 6px', background:`${s.tagColor}18`, border:`1px solid ${s.tagColor}28`, borderRadius:3, display:'inline-block' }}>{s.tag}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:16, boxShadow:'0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)', position:'relative', overflow:'hidden' }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(77,171,247,0.3),transparent)' }}/>
                    <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:13, fontWeight:700, color:'#fff', letterSpacing:'-0.01em', marginBottom:3 }}>Agents</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:"'DM Sans',sans-serif", marginBottom:12 }}>One click. Nexa executes.</div>
                    {[['Content Agent','Last run 2 hours ago'],['Timing Agent','Best: 9AM, 7PM'],['Insights Agent','Weekly digest ready']].map(([name,sub],i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 10px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, marginBottom:5 }}>
                        <div>
                          <div style={{ fontSize:11, fontWeight:500, color:'rgba(255,255,255,0.72)', fontFamily:"'DM Sans',sans-serif" }}>{name}</div>
                          <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)', fontFamily:"'DM Sans',sans-serif" }}>{sub}</div>
                        </div>
                        <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', padding:'3px 8px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:5, fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', gap:4 }}>
                          <svg width="7" height="7" viewBox="0 0 24 24" fill="rgba(255,255,255,0.5)"><path d="M5 3l14 9-14 9V3z"/></svg>Run
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(30,142,240,0.2)', borderRadius:12, padding:16, boxShadow:'0 8px 32px rgba(0,0,0,0.5), 0 0 40px rgba(30,142,240,0.07), inset 0 1px 0 rgba(30,142,240,0.12)', position:'relative', overflow:'hidden' }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(30,142,240,0.5),transparent)' }}/>
                    <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, borderRadius:'50%', background:'#1E8EF0', filter:'blur(50px)', opacity:0.08, pointerEvents:'none' }}/>
                    <div style={{ position:'relative', zIndex:1 }}>
                      <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:13, fontWeight:700, color:'#fff', letterSpacing:'-0.01em', marginBottom:3 }}>Brand Brain</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:"'DM Sans',sans-serif", marginBottom:14 }}>Intelligence layer · Active</div>
                      <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:6 }}>
                        <span style={{ fontFamily:"'Geist Mono',monospace", fontSize:40, fontWeight:300, color:'#fff', letterSpacing:'-0.05em', lineHeight:1 }}>94</span>
                        <span style={{ fontSize:12, color:'rgba(255,255,255,0.35)', fontFamily:"'DM Sans',sans-serif" }}>% voice match</span>
                      </div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.28)', fontFamily:"'DM Sans',sans-serif", marginBottom:14 }}>12 assets trained · Last analyzed 2h ago</div>
                      <div style={{ height:1, background:'rgba(255,255,255,0.07)', marginBottom:12 }}/>
                      {[['Voice consistency','98%'],['Tone accuracy','91%'],['Vocabulary match','94%']].map(([label,val],i) => (
                        <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                          <span style={{ fontSize:11, color:'rgba(255,255,255,0.38)', fontFamily:"'DM Sans',sans-serif" }}>{label}</span>
                          <span style={{ fontFamily:"'Geist Mono',monospace", fontSize:11, fontWeight:300, color:'#4DABF7' }}>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* glow */}
          <div style={{ position: 'absolute', bottom: -60, left: '50%', transform: 'translateX(-50%)', width: '60%', height: 120, background: `radial-gradient(ellipse, rgba(77,171,247,0.15), transparent)`, pointerEvents: 'none' }} />
        </div>
      </section>

      {/* ── 3. MARQUEE ── */}
      <div style={{ borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}`, padding: '16px 0', overflow: 'hidden', background: '#050505' }}>
        <div className="marquee-track">
          {doubled.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
              <span style={{ padding: '0 32px', fontSize: 13, fontFamily: MONO, color: T3, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{item}</span>
              <span style={{ color: LINE2, fontSize: 16 }}>·</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. BIG NUMBERS ── */}
      <section style={{ padding: '100px 40px', textAlign: 'center' }}>
        <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 16, color: T3, marginBottom: 64 }}>Trusted by thousands of businesses worldwide</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', maxWidth: 800, margin: '0 auto', gap: 1, background: LINE, borderRadius: 2, overflow: 'hidden' }}>
          {[
            { num: '2,400+', label: 'businesses on Nexa' },
            { num: '94%', label: 'report more consistent posting' },
            { num: '12×', label: 'faster content production' },
          ].map(({ num, label }) => (
            <div key={num} style={{ background: B, padding: '48px 32px', textAlign: 'center' }}>
              <div style={{ fontFamily: MONO, fontWeight: 300, fontSize: 'clamp(40px, 6vw, 64px)', color: T1, letterSpacing: '-0.04em', lineHeight: 1 }}>{num}</div>
              <div style={{ fontSize: 13, color: T3, marginTop: 12, fontFamily: SANS }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. PROBLEM ── */}
      <section style={{ padding: '80px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(32px, 5vw, 52px)', letterSpacing: '-0.04em', color: T1, marginBottom: 12 }}>
            The content problem<br />every business owner knows
          </h2>
          <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 18, color: T3 }}>Sound familiar?</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: LINE, borderRadius: 12, overflow: 'hidden' }}>
          {[
            {
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
              title: 'No time',
              body: 'You know you need to post consistently. But between client work, operations, and everything else — content keeps getting pushed to tomorrow.',
            },
            {
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
              title: 'No consistency',
              body: "You post for a week, then disappear for three. Your audience doesn't grow because your presence isn't steady enough to build trust.",
            },
            {
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
              title: 'No voice',
              body: "Generic AI tools produce generic output. It doesn't sound like you. So you rewrite everything — which takes as long as writing from scratch.",
            },
          ].map(({ icon, title, body }) => (
            <div key={title} style={{ background: '#070707', padding: '36px 32px', borderTop: '2px solid rgba(255,80,80,0.5)' }}>
              <div style={{ marginBottom: 16 }}>{icon}</div>
              <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 20, color: T1, marginBottom: 10, letterSpacing: '-0.03em' }}>{title}</div>
              <p style={{ fontSize: 14, color: T3, lineHeight: 1.7, fontFamily: SANS }}>{body}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 20, color: T2 }}>Nexa solves all three. Here&apos;s how.</p>
        </div>
      </section>

      {/* ── 6. BRAND BRAIN ── */}
      <section id="features" style={{ padding: '80px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: LINE, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ background: '#060606', padding: '56px 48px' }}>
            <div style={{ fontSize: 11, fontFamily: MONO, color: T3, letterSpacing: '0.1em', marginBottom: 20 }}>01 / BRAND BRAIN</div>
            <h2 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 40, letterSpacing: '-0.04em', color: T1, marginBottom: 16, lineHeight: 1.05 }}>
              AI that thinks<br />like you do
            </h2>
            <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 18, color: T3, marginBottom: 24, lineHeight: 1.6 }}>
              Feed it your past content, your offers, your audience. Brand Brain learns your voice so precisely that outputs need zero editing.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {['Trained on your actual writing', 'Learns your offers and positioning', 'Knows your audience better than you do', 'Gets sharper every week'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 14, fontFamily: SANS, color: T2 }}>
                  <span style={{ color: BLUE, fontSize: 16 }}>→</span> {f}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ background: '#080808', padding: '56px 48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Brand Brain visual */}
            <div style={{ position: 'relative', width: 240, height: 240 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1px solid rgba(77,171,247,0.15)`, animation: 'pulse-ring 3s ease infinite' }} />
              <div style={{ position: 'absolute', inset: 20, borderRadius: '50%', border: `1px solid rgba(77,171,247,0.1)`, animation: 'pulse-ring 3s ease infinite 0.5s' }} />
              <div style={{ position: 'absolute', inset: 40, borderRadius: '50%', border: `1px solid rgba(77,171,247,0.08)`, animation: 'pulse-ring 3s ease infinite 1s' }} />
              <div style={{ position: 'absolute', inset: '50%', transform: 'translate(-50%, -50%)', width: 96, height: 96, borderRadius: '50%', background: 'radial-gradient(circle, rgba(77,171,247,0.2) 0%, rgba(77,171,247,0.04) 70%)', border: `1px solid rgba(77,171,247,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 11, color: BLUE, letterSpacing: '0.05em' }}>BRAIN</span>
              </div>
              {/* orbiting dots */}
              {['Voice', 'Tone', 'Offers', 'Goals'].map((label, i) => {
                const angle = (i / 4) * Math.PI * 2 - Math.PI / 4
                const r = 106
                const x = Math.cos(angle) * r + 120
                const y = Math.sin(angle) * r + 120
                return (
                  <div key={label} style={{ position: 'absolute', left: x - 24, top: y - 12, padding: '4px 10px', background: '#111', border: `1px solid ${LINE2}`, borderRadius: 20, fontSize: 10, fontFamily: MONO, color: T3, whiteSpace: 'nowrap' }}>
                    {label}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. AI CHAT ── */}
      <section style={{ padding: '0 40px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: LINE, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ background: '#080808', padding: '56px 48px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Chat mockup */}
            <div style={{ fontSize: 11, fontFamily: MONO, color: T3, letterSpacing: '0.1em', marginBottom: 8 }}>NEXA CHAT</div>
            {[
              { from: 'user', text: 'Write me a LinkedIn post about our new product launch' },
              { from: 'ai', text: "Here's a post in your voice: 'After 18 months of obsessing over one problem...' [continuing in your exact tone]" },
              { from: 'user', text: 'Make it shorter and add a CTA' },
              { from: 'ai', text: 'Done. Trimmed to 3 punchy lines, CTA added. Ready to schedule?' },
            ].map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '75%', padding: '10px 14px', borderRadius: msg.from === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px', background: msg.from === 'user' ? 'rgba(77,171,247,0.15)' : '#111', border: `1px solid ${msg.from === 'user' ? 'rgba(77,171,247,0.25)' : LINE}`, fontSize: 12, fontFamily: SANS, color: T2, lineHeight: 1.5 }}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: '#060606', padding: '56px 48px' }}>
            <div style={{ fontSize: 11, fontFamily: MONO, color: T3, letterSpacing: '0.1em', marginBottom: 20 }}>02 / AI CHAT</div>
            <h2 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 40, letterSpacing: '-0.04em', color: T1, marginBottom: 16, lineHeight: 1.05 }}>
              Your strategist.<br />Always on.
            </h2>
            <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 18, color: T3, marginBottom: 24, lineHeight: 1.6 }}>
              Ask anything. Get content, strategy, edits, and ideas instantly — all informed by your Brand Brain.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {['Generate posts, emails, scripts, ads', 'Refine tone and messaging in real time', 'Strategy questions answered in seconds', 'Context-aware across all your content'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 14, fontFamily: SANS, color: T2 }}>
                  <span style={{ color: BLUE, fontSize: 16 }}>→</span> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── 8. STUDIO ── */}
      <section style={{ padding: '0 40px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: LINE, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ background: '#060606', padding: '56px 48px' }}>
            <div style={{ fontSize: 11, fontFamily: MONO, color: T3, letterSpacing: '0.1em', marginBottom: 20 }}>03 / STUDIO</div>
            <h2 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 40, letterSpacing: '-0.04em', color: T1, marginBottom: 16, lineHeight: 1.05 }}>
              Every format.<br />One place.
            </h2>
            <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 18, color: T3, marginBottom: 24, lineHeight: 1.6 }}>
              Text, images, video, and voice — all generated in your brand style and ready to publish without leaving the platform.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Copy', cost: '3 credits', color: '#4ade80' },
                { label: 'Images', cost: '5 credits', color: BLUE },
                { label: 'Video (Veo 3.1)', cost: '20 credits', color: '#a78bfa' },
                { label: 'Voice', cost: '10 cr/min', color: '#fb923c' },
              ].map(({ label, cost, color }) => (
                <div key={label} style={{ padding: '14px 16px', background: '#0d0d0d', border: `1px solid ${LINE}`, borderRadius: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: DISPLAY, color: T1, marginBottom: 4, letterSpacing: '-0.02em' }}>{label}</div>
                  <div style={{ fontSize: 11, fontFamily: MONO, color }}>{cost}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: '#080808', padding: '56px 48px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, fontFamily: MONO, color: T3, letterSpacing: '0.1em', marginBottom: 8 }}>GENERATION PIPELINE</div>
            {['Brand Brain analysis →', 'Prompt optimization →', 'Multi-model generation →', 'Quality check →', 'Ready to publish ✓'].map((step, i) => (
              <div key={step} className="feature-row" style={{ padding: '12px 16px', background: i === 4 ? 'rgba(74,222,128,0.06)' : '#0d0d0d', border: `1px solid ${i === 4 ? 'rgba(74,222,128,0.2)' : LINE}`, borderRadius: 10, fontSize: 13, fontFamily: MONO, color: i === 4 ? '#4ade80' : T3 }}>
                {step}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. STRATEGY ── */}
      <section style={{ padding: '0 40px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: LINE, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ background: '#080808', padding: '56px 48px' }}>
            <div style={{ fontSize: 11, fontFamily: MONO, color: T3, letterSpacing: '0.1em', marginBottom: 12 }}>CONTENT CALENDAR</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 16 }}>
              {['M','T','W','T','F','S','S'].map((d,i) => (
                <div key={i} style={{ textAlign: 'center', fontSize: 10, fontFamily: MONO, color: T3, paddingBottom: 6 }}>{d}</div>
              ))}
              {Array.from({ length: 28 }, (_, i) => (
                <div key={i} style={{ aspectRatio: '1/1', borderRadius: 6, background: [2,5,8,11,15,18,22,25].includes(i) ? 'rgba(77,171,247,0.2)' : '#111', border: `1px solid ${[2,5,8,11,15,18,22,25].includes(i) ? 'rgba(77,171,247,0.35)' : LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontFamily: MONO, color: [2,5,8,11,15,18,22,25].includes(i) ? BLUE : T3 }}>
                  {i + 1}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, fontFamily: MONO, color: T3 }}>8 posts scheduled · Next: Mon 9am</div>
          </div>
          <div style={{ background: '#060606', padding: '56px 48px' }}>
            <div style={{ fontSize: 11, fontFamily: MONO, color: T3, letterSpacing: '0.1em', marginBottom: 20 }}>04 / STRATEGY</div>
            <h2 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 40, letterSpacing: '-0.04em', color: T1, marginBottom: 16, lineHeight: 1.05 }}>
              30-day plan.<br />Built in seconds.
            </h2>
            <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 18, color: T3, marginBottom: 24, lineHeight: 1.6 }}>
              Tell Nexa your goals. It builds a complete content calendar with topics, formats, and posting times — tailored to your audience.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {['AI-generated 30-day content plan', 'Optimal posting times by platform', 'Topic clusters that build authority', 'Auto-reschedule on missed posts'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 14, fontFamily: SANS, color: T2 }}>
                  <span style={{ color: BLUE, fontSize: 16 }}>→</span> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── 10. AGENTS ── */}
      <section style={{ padding: '0 40px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: LINE, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ background: '#060606', padding: '56px 48px' }}>
            <div style={{ fontSize: 11, fontFamily: MONO, color: T3, letterSpacing: '0.1em', marginBottom: 20 }}>05 / AGENTS</div>
            <h2 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 40, letterSpacing: '-0.04em', color: T1, marginBottom: 16, lineHeight: 1.05 }}>
              Marketing that<br />runs itself.
            </h2>
            <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 18, color: T3, marginBottom: 24, lineHeight: 1.6 }}>
              Set up autonomous agents to monitor trends, generate content, post to socials, and report results — without you lifting a finger.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {['Daily posting agent', 'Trend monitor and alert agent', 'Competitor tracking agent', 'Performance report agent'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 14, fontFamily: SANS, color: T2 }}>
                  <span style={{ color: BLUE, fontSize: 16 }}>→</span> {f}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ background: '#080808', padding: '56px 48px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, fontFamily: MONO, color: T3, letterSpacing: '0.1em', marginBottom: 8 }}>ACTIVE AGENTS</div>
            {[
              { name: 'Daily Post Agent', status: 'Running', color: '#4ade80' },
              { name: 'Trend Monitor', status: 'Running', color: '#4ade80' },
              { name: 'Competitor Watch', status: 'Running', color: '#4ade80' },
              { name: 'Weekly Report', status: 'Scheduled', color: BLUE },
            ].map(({ name, status, color }) => (
              <div key={name} style={{ padding: '12px 16px', background: '#0d0d0d', border: `1px solid ${LINE}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontFamily: SANS, color: T2 }}>{name}</span>
                <span style={{ fontSize: 10, fontFamily: MONO, color, padding: '3px 8px', background: `${color}11`, borderRadius: 100, border: `1px solid ${color}33` }}>{status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 11. EMAIL SEQUENCES ── */}
      <section style={{ padding: '0 40px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: LINE, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ background: '#080808', padding: '56px 48px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, fontFamily: MONO, color: T3, letterSpacing: '0.1em', marginBottom: 8 }}>EMAIL SEQUENCE BUILDER</div>
            {['Day 1 — Welcome + Brand story', 'Day 3 — Core value proposition', 'Day 5 — Social proof + case study', 'Day 7 — Offer + CTA', 'Day 10 — Follow-up + objection handling'].map((step, i) => (
              <div key={step} style={{ padding: '10px 14px', background: '#0d0d0d', border: `1px solid ${LINE}`, borderRadius: 8, fontSize: 12, fontFamily: SANS, color: T2, display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: `rgba(77,171,247,0.15)`, border: `1px solid rgba(77,171,247,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontFamily: MONO, color: BLUE, flexShrink: 0 }}>{i + 1}</span>
                {step}
              </div>
            ))}
          </div>
          <div style={{ background: '#060606', padding: '56px 48px' }}>
            <div style={{ fontSize: 11, fontFamily: MONO, color: T3, letterSpacing: '0.1em', marginBottom: 20 }}>06 / SEQUENCES</div>
            <h2 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 40, letterSpacing: '-0.04em', color: T1, marginBottom: 16, lineHeight: 1.05 }}>
              Emails that<br />convert on repeat.
            </h2>
            <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 18, color: T3, marginBottom: 24, lineHeight: 1.6 }}>
              Build nurture sequences in your voice. Set them once. They go out to every new lead automatically, forever.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {['Full sequence generation in minutes', 'Personalized by subscriber segment', 'A/B test subject lines automatically', 'Performance analytics built in'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 14, fontFamily: SANS, color: T2 }}>
                  <span style={{ color: BLUE, fontSize: 16 }}>→</span> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── 12. AMPLIFY ── */}
      <section style={{ padding: '0 40px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: LINE, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ background: '#060606', padding: '56px 48px' }}>
            <div style={{ fontSize: 11, fontFamily: MONO, color: T3, letterSpacing: '0.1em', marginBottom: 20 }}>07 / AMPLIFY</div>
            <h2 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 40, letterSpacing: '-0.04em', color: T1, marginBottom: 16, lineHeight: 1.05 }}>
              Paid ads.<br />Powered by AI.
            </h2>
            <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 18, color: T3, marginBottom: 24, lineHeight: 1.6 }}>
              Generate Meta ad copy and creatives that match your brand — then launch directly from Nexa to Facebook and Instagram.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {['AI-generated ad copy and hooks', 'Image and video ad creatives', 'Audience targeting recommendations', 'Direct Meta Ads publishing'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 14, fontFamily: SANS, color: T2 }}>
                  <span style={{ color: BLUE, fontSize: 16 }}>→</span> {f}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ background: '#080808', padding: '56px 48px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 11, fontFamily: MONO, color: T3, letterSpacing: '0.1em', marginBottom: 8 }}>AD PERFORMANCE</div>
            {[
              { label: 'ROAS', value: '4.2×', trend: '+18%' },
              { label: 'CTR', value: '3.8%', trend: '+24%' },
              { label: 'CPL', value: '$4.10', trend: '-31%' },
            ].map(({ label, value, trend }) => (
              <div key={label} style={{ padding: '16px 20px', background: '#0d0d0d', border: `1px solid ${LINE}`, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontFamily: MONO, color: T3 }}>{label}</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontFamily: MONO, fontWeight: 300, color: T1, letterSpacing: '-0.04em' }}>{value}</div>
                  <div style={{ fontSize: 10, fontFamily: MONO, color: '#4ade80' }}>{trend} vs last month</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 13. INTEGRATIONS ── */}
      <section style={{ padding: '0 40px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontFamily: MONO, color: T3, letterSpacing: '0.1em', marginBottom: 16 }}>08 / INTEGRATIONS</div>
          <h2 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(32px, 5vw, 52px)', letterSpacing: '-0.04em', color: T1, marginBottom: 12 }}>
            Works with everything<br />you already use
          </h2>
          <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 18, color: T3 }}>Publish, sync, automate — across all your tools</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: LINE, borderRadius: 12, overflow: 'hidden' }}>
          {[
            { name: 'Instagram', color: '#E1306C', status: 'Live' },
            { name: 'LinkedIn', color: '#0A66C2', status: 'Live' },
            { name: 'X / Twitter', color: '#ffffff', status: 'Live' },
            { name: 'TikTok', color: '#FF0050', status: 'Live' },
            { name: 'Make.com', color: '#A855F7', status: 'Live' },
            { name: 'Zapier', color: '#FF6B35', status: 'Live' },
            { name: 'HubSpot', color: '#FF7A59', status: 'Soon' },
            { name: 'Notion', color: '#ffffff', status: 'Soon' },
          ].map(({ name, color, status }) => (
            <div key={name} style={{ background: '#070707', padding: '24px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}33`, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: DISPLAY, color: T1, letterSpacing: '-0.02em' }}>{name}</div>
                <div style={{ fontSize: 10, fontFamily: MONO, color: status === 'Live' ? '#4ade80' : T3, marginTop: 2 }}>{status}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 14. HOW IT WORKS ── */}
      <section style={{ padding: '80px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 11, fontFamily: MONO, color: T3, letterSpacing: '0.1em', marginBottom: 16 }}>09 / HOW IT WORKS</div>
          <h2 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(32px, 5vw, 52px)', letterSpacing: '-0.04em', color: T1, marginBottom: 12 }}>
            Up and running<br />in under 3 minutes
          </h2>
          <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 18, color: T3 }}>No setup calls. No onboarding sessions. Just results.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: LINE, borderRadius: 12, overflow: 'hidden' }}>
          {[
            { step: '01', title: 'Create account', body: 'Sign up in 30 seconds. No credit card required. You get 500 credits free.' },
            { step: '02', title: 'Train Brand Brain', body: 'Paste your website, past posts, or a short description of your business and voice.' },
            { step: '03', title: 'Generate content', body: 'Ask for posts, emails, videos, ads. Get outputs in your voice, ready to publish.' },
            { step: '04', title: 'Automate everything', body: 'Set your schedule, activate agents, connect your channels. Nexa runs the rest.' },
          ].map(({ step, title, body }) => (
            <div key={step} style={{ background: '#070707', padding: '36px 28px', borderTop: `2px solid ${BLUE}22` }}>
              <div style={{ fontFamily: MONO, fontWeight: 300, fontSize: 40, color: BLUE, letterSpacing: '-0.04em', marginBottom: 16, opacity: 0.6 }}>{step}</div>
              <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 18, color: T1, marginBottom: 10, letterSpacing: '-0.03em' }}>{title}</div>
              <p style={{ fontSize: 13, color: T3, lineHeight: 1.7, fontFamily: SANS }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 15. PRICING ── */}
      <section id="pricing" style={{ padding: '80px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 11, fontFamily: MONO, color: T3, letterSpacing: '0.1em', marginBottom: 16 }}>10 / PRICING</div>
          <h2 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(32px, 5vw, 52px)', letterSpacing: '-0.04em', color: T1, marginBottom: 12 }}>
            Simple. Honest. Scalable.
          </h2>
          <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 18, color: T3 }}>Start free. Upgrade when you&apos;re ready.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: LINE, borderRadius: 12, overflow: 'hidden' }}>
          {PLANS.map(plan => (
            <div key={plan.name} className="plan-card" style={{ background: plan.popular ? '#070f1a' : '#070707', padding: '36px 28px', border: plan.popular ? `1px solid rgba(77,171,247,0.3)` : `1px solid transparent`, position: 'relative' }}>
              {plan.popular && (
                <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 9, fontFamily: MONO, color: BLUE, padding: '3px 8px', border: `1px solid rgba(77,171,247,0.3)`, borderRadius: 100, letterSpacing: '0.08em' }}>MOST POPULAR</div>
              )}
              <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 18, color: T1, marginBottom: 4, letterSpacing: '-0.03em' }}>{plan.name}</div>
              <div style={{ fontSize: 12, color: T3, marginBottom: 20, fontFamily: SANS }}>{plan.desc}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 4 }}>
                <span style={{ fontFamily: MONO, fontWeight: 300, fontSize: 40, color: T1, letterSpacing: '-0.04em' }}>{plan.price}</span>
                <span style={{ fontSize: 13, color: T3, fontFamily: SANS }}>{plan.period}</span>
              </div>
              <div style={{ fontSize: 11, fontFamily: MONO, color: T3, marginBottom: 24 }}>{plan.credits}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ fontSize: 13, fontFamily: SANS, color: T2, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: '#4ade80', flexShrink: 0, marginTop: 1 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" style={{ display: 'block', textAlign: 'center', padding: '11px', borderRadius: 9, background: plan.popular ? W : 'transparent', color: plan.popular ? B : T2, border: plan.popular ? 'none' : `1px solid ${LINE2}`, fontSize: 13, fontWeight: 700, fontFamily: DISPLAY, textDecoration: 'none', letterSpacing: '-0.02em' }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: 13, color: T3, marginTop: 24, fontFamily: SANS }}>
          All plans include a 7-day money-back guarantee. Cancel anytime.
        </p>
      </section>

      {/* ── 16. TESTIMONIALS ── */}
      <section style={{ padding: '80px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 11, fontFamily: MONO, color: T3, letterSpacing: '0.1em', marginBottom: 16 }}>11 / TESTIMONIALS</div>
          <h2 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(32px, 5vw, 52px)', letterSpacing: '-0.04em', color: T1, marginBottom: 12 }}>
            What our users say
          </h2>
          <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 18, color: T3 }}>Real businesses. Real results.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: LINE, borderRadius: 12, overflow: 'hidden' }}>
          {TESTIMONIALS.map(({ name, role, body, avatar }) => (
            <div key={name} className="testimonial-card" style={{ background: '#070707', padding: '32px 28px', border: `1px solid transparent` }}>
              <p style={{ fontSize: 14, fontFamily: SANS, color: T2, lineHeight: 1.75, marginBottom: 24, fontStyle: 'italic' }}>&ldquo;{body}&rdquo;</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: `rgba(77,171,247,0.12)`, border: `1px solid rgba(77,171,247,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: MONO, color: BLUE, flexShrink: 0 }}>{avatar}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: DISPLAY, color: T1, letterSpacing: '-0.02em' }}>{name}</div>
                  <div style={{ fontSize: 11, color: T3, fontFamily: SANS }}>{role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 17. FAQ ── */}
      <section id="faq" style={{ padding: '80px 40px', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 11, fontFamily: MONO, color: T3, letterSpacing: '0.1em', marginBottom: 16 }}>12 / FAQ</div>
          <h2 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(32px, 5vw, 52px)', letterSpacing: '-0.04em', color: T1, marginBottom: 12 }}>
            Questions answered
          </h2>
        </div>
        <div style={{ border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden' }}>
          {FAQS.map(({ q, a }, i) => (
            <div key={i} className="faq-item">
              <button
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                style={{ width: '100%', background: 'none', border: 'none', padding: '22px 28px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}
              >
                <span style={{ fontSize: 15, fontWeight: 700, fontFamily: DISPLAY, color: T1, letterSpacing: '-0.02em' }}>{q}</span>
                <span style={{ color: T3, fontSize: 20, flexShrink: 0, transition: 'transform 0.2s', transform: faqOpen === i ? 'rotate(45deg)' : 'none' }}>+</span>
              </button>
              {faqOpen === i && (
                <div style={{ padding: '0 28px 22px', fontSize: 14, fontFamily: SANS, color: T3, lineHeight: 1.75 }}>{a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── 18. FINAL CTA ── */}
      <section style={{ padding: '100px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(77,171,247,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${LINE} 1px, transparent 1px), linear-gradient(90deg, ${LINE} 1px, transparent 1px)`, backgroundSize: '60px 60px', opacity: 0.3, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(40px, 7vw, 88px)', letterSpacing: '-0.05em', color: T1, marginBottom: 16, lineHeight: 0.95 }}>
            Ready to<br /><span style={{ color: BLUE }}>dominate?</span>
          </h2>
          <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 20, color: T3, marginBottom: 40, maxWidth: 480, margin: '0 auto 40px' }}>
            Join 2,400+ businesses that stopped struggling with content and started growing.
          </p>
          <Link href="/auth/signup" style={{ display: 'inline-block', padding: '16px 40px', borderRadius: 12, background: W, color: B, fontSize: 16, fontWeight: 800, fontFamily: DISPLAY, textDecoration: 'none', letterSpacing: '-0.03em' }}>
            Start free — 500 credits on us →
          </Link>
          <p style={{ fontSize: 13, color: T3, marginTop: 16, fontFamily: MONO }}>No credit card · Cancel anytime · Setup in 3 min</p>
        </div>
      </section>

      {/* ── 19. FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${LINE}`, padding: '48px 40px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 40, marginBottom: 48 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Image src="/favicon.png" alt="Nexa" width={20} height={20} style={{ borderRadius: 5 }} />
                <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 15, color: T1, letterSpacing: '-0.03em' }}>Nexa</span>
              </div>
              <p style={{ fontSize: 13, color: T3, lineHeight: 1.65, fontFamily: SANS, maxWidth: 220 }}>
                The AI business intelligence platform that learns your brand and runs your content.
              </p>
            </div>
            <div>
              <div style={{ fontSize: 11, fontFamily: MONO, color: T3, letterSpacing: '0.08em', marginBottom: 16 }}>PRODUCT</div>
              {['Brand Brain', 'Studio', 'Strategy', 'Agents', 'Sequences', 'Amplify'].map(item => (
                <div key={item} style={{ marginBottom: 10 }}>
                  <Link href="/auth/signup" style={{ fontSize: 13, color: T3, textDecoration: 'none', fontFamily: SANS, transition: 'color 0.15s' }}>{item}</Link>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontFamily: MONO, color: T3, letterSpacing: '0.08em', marginBottom: 16 }}>COMPANY</div>
              {[['Pricing', '#pricing'], ['FAQ', '#faq'], ['Sign in', '/auth/login'], ['Start free', '/auth/signup']].map(([label, href]) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <a href={href} style={{ fontSize: 13, color: T3, textDecoration: 'none', fontFamily: SANS }}>{label}</a>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontFamily: MONO, color: T3, letterSpacing: '0.08em', marginBottom: 16 }}>LEGAL</div>
              {[['Privacy Policy', '/landing/privacy'], ['Terms of Service', '/landing/terms']].map(([label, href]) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <Link href={href} style={{ fontSize: 13, color: T3, textDecoration: 'none', fontFamily: SANS }}>{label}</Link>
                </div>
              ))}
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11, fontFamily: MONO, color: T3, letterSpacing: '0.08em', marginBottom: 8 }}>CONTACT</div>
                <a href="mailto:hello@nexaa.cc" style={{ fontSize: 13, color: T3, textDecoration: 'none', fontFamily: SANS }}>hello@nexaa.cc</a>
              </div>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: T3, fontFamily: MONO }}>© 2026 Nexa. All rights reserved.</span>
            <span style={{ fontSize: 12, color: T3, fontFamily: MONO }}>Dubai, UAE · hello@nexaa.cc</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
