'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const PLANS = [
  {
    id: 'spark', name: 'Spark', price: '$19', period: '/mo',
    desc: 'For solo creators just starting out',
    credits: '500 credits/mo',
    features: ['Brand Brain', 'Studio — copy + images', '30-day strategy', 'Content scheduling', 'Email support'],
    cta: 'Start with Spark', popular: false,
  },
  {
    id: 'grow', name: 'Grow', price: '$39', period: '/mo',
    desc: 'For business owners serious about growth',
    credits: '1,500 credits/mo',
    features: ['Everything in Spark', 'Agents + Automation', 'Email sequences', 'Competitor analysis', 'Priority support'],
    cta: 'Start with Grow', popular: true,
  },
  {
    id: 'scale', name: 'Scale', price: '$89', period: '/mo',
    desc: 'For established businesses scaling fast',
    credits: '5,000 credits/mo',
    features: ['Everything in Grow', 'Video generation (Veo 3.1)', 'Voice generation', 'Amplify — Meta Ads', 'Advanced analytics'],
    cta: 'Start with Scale', popular: false,
  },
  {
    id: 'agency', name: 'Agency', price: '$349', period: '/mo',
    desc: 'For agencies managing client brands',
    credits: '15,000 credits/mo',
    features: ['Everything in Scale', 'Client workspaces', 'White-label ready', 'Dedicated onboarding', 'SLA support'],
    cta: 'Start with Agency', popular: false,
  },
]

const FAQS = [
  {
    q: 'Will it actually sound like me?',
    a: 'Yes. Brand Brain trains on your actual writing — your tone, your vocabulary, your opinions. The more you feed it, the more accurate it gets. Most users hit 90%+ voice match within the first week.',
  },
  {
    q: "I'm not a tech person. Will I be able to use this?",
    a: 'Nexa was designed for business owners, not developers. Setup takes 3 minutes. If you can type a message, you can use Nexa.',
  },
  {
    q: 'What is a credit?',
    a: 'Credits power AI generations. A text post costs 3 credits. An image costs 5. A video costs 20. Chat, strategy, and scheduling are always free. The Grow plan gives you 1,500 credits monthly — enough for 500 posts.',
  },
  {
    q: 'Can I use Nexa for my clients?',
    a: 'Yes — the Agency plan gives you separate workspaces for each client. Each workspace has its own Brand Brain, strategy, and content library. Your clients get a clean, focused experience.',
  },
  {
    q: 'How is Nexa different from ChatGPT?',
    a: "ChatGPT gives you a blank box and expects you to know what to ask. Nexa knows your business, your voice, your audience, and your strategy. It's the difference between a tool and a team member.",
  },
  {
    q: 'Is my data safe?',
    a: 'Yes. All data is encrypted at rest and in transit. We never train our models on your data. Your brand voice is yours.',
  },
]

const INTEGRATIONS = [
  'Notion','Slack','HubSpot','Google Drive','Google Analytics',
  'Asana','Calendly','Instagram','LinkedIn','X','TikTok','Make.com','Zapier','WhatsApp Business',
]

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--blue2)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
)

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const twoCol: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap: isMobile ? 40 : 64,
    alignItems: 'center',
  }

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--t1)', fontFamily: 'var(--sans)', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(3,3,10,0.88)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(255,255,255,0.055)',
        padding: '0 40px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <Image src="/favicon.png" alt="Nexa" width={20} height={20} style={{ borderRadius: 5 }} />
          <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--t1)' }}>Nexa</span>
        </Link>

        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {['Product','How it works','Pricing','Stories'].map(label => {
              const id = label.toLowerCase().replace(/ /g, '-')
              return (
                <a key={label} href={`#${id === 'product' ? 'brand-brain' : id === 'stories' ? 'stories' : id}`}
                  style={{ fontSize: 13, color: 'var(--t3)', textDecoration: 'none', cursor: 'pointer' }}>
                  {label}
                </a>
              )
            })}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isMobile && (
            <button onClick={() => setMobileOpen(o => !o)} style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', padding: 6 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {mobileOpen ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
              </svg>
            </button>
          )}
          <Link href="/auth/login" style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--line2)', background: 'none', color: 'var(--t3)', fontSize: 13, textDecoration: 'none', cursor: 'pointer' }}>Sign in</Link>
          <Link href="/auth/signup" style={{ padding: '7px 16px', borderRadius: 8, background: 'var(--blue)', color: '#fff', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>Start free →</Link>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{ position: 'fixed', top: 60, left: 0, right: 0, zIndex: 49, background: 'rgba(3,3,10,0.96)', borderBottom: '1px solid var(--line)', padding: '20px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[['Product','brand-brain'],['How it works','how-it-works'],['Pricing','pricing'],['Stories','stories']].map(([label, id]) => (
            <a key={label} href={`#${id}`} onClick={() => setMobileOpen(false)} style={{ fontSize: 15, color: 'var(--t2)', textDecoration: 'none' }}>{label}</a>
          ))}
        </div>
      )}

      {/* ── HERO ── */}
      <section style={{ position: 'relative', padding: isMobile ? '80px 24px 60px' : '100px 40px 80px', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, left: -80, width: 400, height: 400, borderRadius: '50%', background: '#5B21B6', filter: 'blur(140px)', opacity: 0.07, pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 360, height: 360, borderRadius: '50%', background: '#C2410C', filter: 'blur(140px)', opacity: 0.07, pointerEvents: 'none' }}/>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(30,142,240,0.08)', border: '1px solid rgba(30,142,240,0.16)', borderRadius: 20, marginBottom: 20, cursor: 'pointer' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4DABF7' }}/>
            <span style={{ fontSize: 12, color: '#4DABF7' }}>Nexa 1.0 is live — try it free today →</span>
          </div>

          <h1 style={{ fontFamily: 'var(--serif)', fontSize: isMobile ? 38 : 58, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 20 }}>
            Your business deserves<br/>
            <span style={{ color: 'var(--blue2)', fontStyle: 'italic' }}>a marketing team</span> that<br/>
            never clocks out.
          </h1>

          <p style={{ fontSize: 17, color: 'var(--t3)', lineHeight: 1.75, maxWidth: 520, margin: '0 auto 32px' }}>
            Nexa is the AI business engine that creates content in your voice, builds your strategy, runs your ads, and keeps you accountable — so you can focus on what you actually do.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/auth/signup" style={{ background: 'var(--blue)', color: '#fff', padding: '14px 28px', borderRadius: 10, fontSize: 14, fontWeight: 500, textDecoration: 'none', display: 'inline-block' }}>
              Start free — no card needed →
            </Link>
            <a href="#how-it-works" style={{ padding: '14px 24px', borderRadius: 10, border: '1px solid var(--line2)', color: 'var(--t2)', fontSize: 14, textDecoration: 'none', cursor: 'pointer' }}>
              Watch 90-second demo
            </a>
          </div>

          <p style={{ fontSize: 12, color: 'var(--t5)', marginTop: 16 }}>500 free credits · No credit card · Setup in 3 minutes</p>

          {/* Browser mockup */}
          <div style={{ marginTop: 48, position: 'relative', maxWidth: 900, margin: '48px auto 0' }}>
            <div style={{ background: 'var(--bg3)', border: '1px solid var(--line2)', borderRadius: '12px 12px 0 0', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }}/>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E' }}/>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }}/>
              </div>
              <div style={{ flex: 1, background: 'var(--bg4)', borderRadius: 5, padding: '4px 12px', fontSize: 11, color: 'var(--t5)', textAlign: 'center' }}>nexaa.cc/dashboard</div>
            </div>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: '0 0 12px 12px', height: isMobile ? 320 : 420, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -60, left: -40, width: 300, height: 250, borderRadius: '50%', background: '#5B21B6', filter: 'blur(100px)', opacity: 0.09 }}/>
              <div style={{ position: 'absolute', bottom: -40, right: -20, width: 260, height: 200, borderRadius: '50%', background: '#C2410C', filter: 'blur(90px)', opacity: 0.06 }}/>
              <div style={{ position: 'relative', zIndex: 1, width: '90%' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: isMobile ? 18 : 28, fontWeight: 400, color: 'var(--t1)', marginBottom: 24, letterSpacing: '-0.02em' }}>Good morning, Ahmed</div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3,1fr)' : 'repeat(5,1fr)', borderTop: '1px solid var(--line)', paddingTop: 16, gap: 0, marginBottom: 24 }}>
                  {[['Credits','1,240','agency'],['Built','8','0 published'],['Scheduled','3','upcoming'],['Streak','14','days'],['Voice','94','% match']].slice(0, isMobile ? 3 : 5).map(([label,val,tag],i,arr) => (
                    <div key={i} style={{ paddingRight: 12, borderRight: i < arr.length - 1 ? '1px solid var(--line)' : 'none', paddingLeft: i > 0 ? 12 : 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--t4)', marginBottom: 6 }}>{label}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: isMobile ? 16 : 24, fontWeight: 300, color: 'var(--t1)', letterSpacing: '-0.04em', lineHeight: 1 }}>{val}</div>
                      <div style={{ fontSize: 10, color: 'var(--blue2)', marginTop: 4 }}>{tag}</div>
                    </div>
                  ))}
                </div>
                {!isMobile && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={{ background: 'var(--bg3)', border: '1px solid var(--line)', borderRadius: 10, padding: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', marginBottom: 4 }}>Agents</div>
                      <div style={{ fontSize: 11, color: 'var(--t4)', marginBottom: 10 }}>One click. Nexa executes.</div>
                      {[['Content Agent','Last run 2 hours ago'],['Timing Agent','Optimal: 9AM & 7PM'],['Insights Agent','Weekly digest ready']].map(([name,sub],i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: 'var(--bg4)', borderRadius: 7, marginBottom: 5, border: '1px solid var(--line)' }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--t2)' }}>{name}</div>
                            <div style={{ fontSize: 10, color: 'var(--t4)' }}>{sub}</div>
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--t3)', padding: '3px 8px', background: 'var(--bg3)', border: '1px solid var(--line2)', borderRadius: 5 }}>Run →</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: 'var(--bg3)', border: '1px solid var(--line)', borderRadius: 10, padding: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', marginBottom: 4 }}>Brand Brain</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '12px 0' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 300, color: 'var(--t1)', letterSpacing: '-0.04em' }}>94</span>
                        <span style={{ fontSize: 12, color: 'var(--t4)' }}>% voice match</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 10 }}>12 assets trained · Active</div>
                      <div style={{ padding: '8px 12px', background: 'rgba(30,142,240,0.06)', border: '1px solid rgba(30,142,240,0.14)', borderRadius: 7, fontSize: 11, color: 'var(--blue2)', cursor: 'pointer' }}>Re-analyze brand →</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1px 1fr 1px 1fr', padding: '20px 40px', borderBottom: '1px solid var(--line)', borderTop: '1px solid var(--line)' }}>
        {isMobile ? (
          ['2,400+ pieces of content created','94% average voice match score','Trusted in 12+ countries'].map((s,i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 13, color: 'var(--t4)', padding: '8px 0' }}>{s}</div>
          ))
        ) : (
          <>
            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--t4)' }}>2,400+ pieces of content created</div>
            <div style={{ background: 'var(--line)', height: 32, alignSelf: 'center' }}/>
            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--t4)' }}>94% average voice match score</div>
            <div style={{ background: 'var(--line)', height: 32, alignSelf: 'center' }}/>
            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--t4)' }}>Trusted in 12+ countries</div>
          </>
        )}
      </div>

      {/* ── PROBLEM ── */}
      <section id="problem" style={{ padding: isMobile ? '60px 24px' : '80px 40px' }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: isMobile ? 28 : 40, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: 48, textAlign: 'center' }}>
          You know you need to show up.<br/>
          You just never have time to do it well.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 16 }}>
          {[
            "You sit down to write a post and end up staring at a blank screen for 40 minutes. The deadline passes. Nothing gets published.",
            "You hire someone to write your content. It sounds nothing like you. Your clients notice. You spend more time editing than if you'd written it yourself.",
            "You know marketing works. You just can't find 3 consistent hours a week to actually do it. Everything else always comes first.",
          ].map((text, i) => (
            <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 12, padding: 24, borderLeft: '3px solid rgba(239,68,68,0.35)' }}>
              <p style={{ fontSize: 14, color: 'var(--t3)', lineHeight: 1.8 }}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── BRAND BRAIN ── */}
      <section id="brand-brain" style={{ padding: isMobile ? '60px 24px' : '80px 40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: '#5B21B6', filter: 'blur(120px)', opacity: 0.06, pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: 0, left: '25%', width: 200, height: 200, borderRadius: '50%', background: '#1E8EF0', filter: 'blur(100px)', opacity: 0.05, pointerEvents: 'none' }}/>
        <div style={{ ...twoCol, position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--blue2)', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Brand Brain · The intelligence layer</div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: isMobile ? 30 : 40, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: 20 }}>Nexa learns your business. Then it speaks for it.</h2>
            <p style={{ fontSize: 15, color: 'var(--t3)', lineHeight: 1.8, marginBottom: 24 }}>
              Train Brand Brain once — upload your best work, your voice, your story. Nexa reads everything. From that moment on, every piece of content sounds like you wrote it at your best. Not AI trying to sound like you. Actually you.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Learns your vocabulary, tone, and opinions','Adapts to every platform automatically','Gets smarter every time you create','94% average voice match score'].map((f,i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--t2)' }}>
                  <CheckIcon/>{f}
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'var(--bg2)', border: '1px solid rgba(30,142,240,0.2)', borderRadius: 14, padding: 24, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: -1, borderRadius: 15, background: 'conic-gradient(rgba(0,0,0,0), rgba(30,142,240,0.3) 8%, rgba(0,0,0,0) 17%, rgba(0,0,0,0) 50%, rgba(91,33,182,0.2) 57%, rgba(0,0,0,0) 66%)', animation: 'nexaSpin 5s linear infinite' }}/>
            <div style={{ position: 'relative', zIndex: 1, background: 'var(--bg2)', borderRadius: 13, padding: 20, margin: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--t4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Brand Intelligence</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 52, fontWeight: 300, color: 'var(--t1)', letterSpacing: '-0.04em', lineHeight: 1 }}>94</span>
                <span style={{ fontSize: 14, color: 'var(--t4)' }}>% voice match</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 20 }}>12 assets · Last analyzed 2 hours ago</div>
              <div style={{ height: 1, background: 'var(--line)', marginBottom: 16 }}/>
              {[['Voice consistency','98%'],['Tone accuracy','91%'],['Vocabulary match','94%']].map(([label,val],i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--t3)' }}>{label}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--blue2)' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── NEXA AI CHAT ── */}
      <section id="nexa-ai" style={{ padding: isMobile ? '60px 24px' : '80px 40px' }}>
        <div style={{ ...twoCol }}>
          {/* LEFT — chat mockup */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden', maxWidth: 440 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,var(--blue3),var(--blue))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Nexa AI</div>
                <div style={{ fontSize: 11, color: 'var(--t4)' }}>Knows your business</div>
              </div>
              <div style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: '#22C55E' }}/>
            </div>
            <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ background: 'var(--blue)', color: '#fff', padding: '9px 13px', borderRadius: '10px 10px 2px 10px', fontSize: 12, maxWidth: 260, lineHeight: 1.6 }}>
                  I need a LinkedIn post about why most freelancers undercharge
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0, background: 'linear-gradient(135deg,var(--blue3),var(--blue))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </div>
                <div style={{ background: 'var(--bg3)', border: '1px solid var(--line)', padding: '10px 13px', borderRadius: '10px 10px 10px 2px', fontSize: 12, color: 'var(--t2)', maxWidth: 300, lineHeight: 1.75 }}>
                  <span style={{ color: 'var(--t1)', fontStyle: 'italic' }}>Most freelancers don&apos;t have a pricing problem.<br/>They have a confidence problem.</span><br/><br/>
                  You quote low because you&apos;re afraid of a &quot;no.&quot;<br/>
                  But every low quote trains your clients to expect low prices.<br/><br/>
                  The fix isn&apos;t raising your rates tomorrow.<br/>
                  It&apos;s saying your real number out loud — and not apologizing for it.
                  <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--line)', display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 10, color: 'var(--blue2)', cursor: 'pointer' }}>Send to Studio</span>
                    <span style={{ fontSize: 10, color: 'var(--t4)' }}>·</span>
                    <span style={{ fontSize: 10, color: 'var(--blue2)', cursor: 'pointer' }}>Copy</span>
                    <span style={{ fontSize: 10, color: 'var(--t4)' }}>·</span>
                    <span style={{ fontSize: 10, color: 'var(--blue2)', cursor: 'pointer' }}>Schedule</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ background: 'var(--blue)', color: '#fff', padding: '9px 13px', borderRadius: '10px 10px 2px 10px', fontSize: 12, maxWidth: 200, lineHeight: 1.6 }}>
                  Make it punchier for X
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0, background: 'linear-gradient(135deg,var(--blue3),var(--blue))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </div>
                <div style={{ background: 'var(--bg3)', border: '1px solid var(--line)', padding: '10px 13px', borderRadius: '10px 10px 10px 2px', fontSize: 12, color: 'var(--t1)', maxWidth: 260, lineHeight: 1.8, fontStyle: 'italic' }}>
                  Freelancers don&apos;t have a pricing problem.<br/>
                  They have a confidence problem.<br/><br/>
                  Every low quote trains your clients<br/>
                  to expect low prices.<br/><br/>
                  Know your worth. Say the number.<br/>
                  Watch what happens.
                </div>
              </div>
            </div>
            <div style={{ padding: '10px 14px', borderTop: '1px solid var(--line)', display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1, padding: '8px 12px', background: 'var(--bg3)', border: '1px solid var(--line2)', borderRadius: 8, fontSize: 12, color: 'var(--t4)' }}>Ask anything about your business...</div>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </div>
            </div>
          </div>
          {/* RIGHT — text */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--blue2)', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Nexa AI · Always on</div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: isMobile ? 30 : 40, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: 20 }}>A chief of staff that knows your business better than you do.</h2>
            <p style={{ fontSize: 15, color: 'var(--t3)', lineHeight: 1.8, marginBottom: 24 }}>
              Ask Nexa anything. What should I post today? How do I position against my competitor? Write me a cold email for a restaurant owner. Nexa knows your voice, your audience, your strategy, and your market. Every answer is specific to your business — not generic advice that works for no one.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Knows your brand voice from day one','Remembers context across every conversation','Connected to your strategy and content library','Available 24/7 — no waiting, no briefing'].map((f,i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--t2)' }}><CheckIcon/>{f}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STUDIO ── */}
      <section id="studio" style={{ padding: isMobile ? '60px 24px' : '80px 40px' }}>
        <div style={{ ...twoCol }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--blue2)', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Studio · Create anything</div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: isMobile ? 28 : 38, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: 20 }}>Type 5 words. Get a complete piece of content.</h2>
            <p style={{ fontSize: 15, color: 'var(--t3)', lineHeight: 1.8, marginBottom: 24 }}>
              Studio writes the post, generates the image, scripts the reel, and records the voiceover. One pipeline. Your voice. Every output is processed through a cinematic quality enhancer — your visuals look like they were produced by a creative agency, not an AI tool.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Copy → Image → Reel → Voice in one flow','Cinematic AI image generation','Studio-quality video with native audio','ElevenLabs voiceover with delivery notation'].map((f,i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--t2)' }}><CheckIcon/>{f}</div>
              ))}
            </div>
          </div>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Content Pipeline</div>
            {[
              { num: '01', label: 'Copy', desc: 'Brand Brain writes in your voice', status: 'done' },
              { num: '02', label: 'Format', desc: '→ Reel selected · 9:16 · 8 seconds', status: 'done' },
              { num: '03', label: 'Asset', desc: 'Veo 3.1 rendering · Cinematic enhanced', status: 'active' },
              { num: '04', label: 'Schedule', desc: 'Ready to schedule · Instagram + LinkedIn', status: 'pending' },
            ].map((stage,i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', background: stage.status === 'active' ? 'rgba(30,142,240,0.05)' : 'var(--bg3)', border: `1px solid ${stage.status === 'active' ? 'rgba(30,142,240,0.18)' : 'var(--line)'}`, borderRadius: 9, marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: stage.status === 'pending' ? 'var(--t5)' : stage.status === 'active' ? 'var(--blue)' : 'var(--blue2)', fontWeight: 300, marginTop: 1, flexShrink: 0 }}>{stage.num}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: stage.status === 'pending' ? 'var(--t4)' : 'var(--t1)', marginBottom: 2 }}>{stage.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--t4)' }}>{stage.desc}</div>
                </div>
                {stage.status === 'done' && (
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
                {stage.status === 'active' && <div style={{ flexShrink: 0 }}><div className="nexa-spinner" style={{ width: 14, height: 14 }}/></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STRATEGY ── */}
      <section id="strategy" style={{ padding: isMobile ? '60px 24px' : '80px 40px' }}>
        <div style={{ ...twoCol }}>
          {/* LEFT — calendar */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 14, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>March 2026</div>
              <div style={{ fontSize: 11, color: 'var(--blue2)' }}>30-day plan active</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
              {['M','T','W','T','F','S','S'].map((d,i) => (
                <div key={i} style={{ textAlign: 'center', fontSize: 10, color: 'var(--t5)', fontWeight: 500, paddingBottom: 6 }}>{d}</div>
              ))}
              {Array.from({ length: 31 }, (_,i) => {
                const done = [1,2,3,4,5,7,8,9,10,11,14,15,16,17].includes(i+1)
                const today = i+1 === 18
                const scheduled = [19,20,21,22].includes(i+1)
                return (
                  <div key={i} style={{
                    aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 6, fontSize: 11, fontWeight: today ? 600 : 400,
                    background: today ? 'var(--blue)' : done ? 'rgba(34,197,94,0.1)' : scheduled ? 'rgba(30,142,240,0.08)' : 'var(--bg3)',
                    border: `1px solid ${today ? 'var(--blue)' : done ? 'rgba(34,197,94,0.2)' : scheduled ? 'rgba(30,142,240,0.14)' : 'var(--line)'}`,
                    color: today ? '#fff' : done ? '#4ADE80' : scheduled ? 'var(--blue2)' : 'var(--t4)',
                    cursor: 'pointer',
                  }}>{i+1}</div>
                )
              })}
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 12, fontSize: 10, color: 'var(--t4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(34,197,94,0.2)' }}/>Done</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(30,142,240,0.15)' }}/>Scheduled</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--blue)' }}/>Today</div>
            </div>
          </div>
          {/* RIGHT — text */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--blue2)', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Strategy · 30-day plan</div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: isMobile ? 28 : 38, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: 20 }}>Your content calendar. Built in 60 seconds.</h2>
            <p style={{ fontSize: 15, color: 'var(--t3)', lineHeight: 1.8, marginBottom: 24 }}>
              Nexa analyzes your market, your competitors, and your Brand Brain data. It builds a complete 30-day content plan with angles, formats, and optimal timing. Click any day and the content is created automatically — copy, visual, everything.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Market and competitor analysis built in','Content pillars mapped to business outcomes','One-click creation from any strategy day','Tracks completion as you publish'].map((f,i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--t2)' }}><CheckIcon/>{f}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── AGENTS ── */}
      <section id="agents" style={{ padding: isMobile ? '60px 24px' : '80px 40px' }}>
        <div style={{ ...twoCol }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--blue2)', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Agents · Automated marketing</div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: isMobile ? 28 : 38, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: 20 }}>Your marketing team. Runs while you sleep.</h2>
            <p style={{ fontSize: 15, color: 'var(--t3)', lineHeight: 1.8, marginBottom: 24 }}>
              Content Agent, Timing Agent, Insights Agent, Engage Agent. Each handles a specific part of your marketing operation. Together they keep your business showing up every single day — without you lifting a finger.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Content Agent creates daily content from strategy','Timing Agent finds when your audience is most active','Insights Agent surfaces what\'s actually working','Engage Agent drafts replies in your voice'].map((f,i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--t2)' }}><CheckIcon/>{f}</div>
              ))}
            </div>
          </div>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 14, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Agents</div>
              <span style={{ fontSize: 11, color: 'var(--blue2)' }}>All agents →</span>
            </div>
            {[
              { name: 'Content Agent', sub: 'Last run 2 hours ago · 3 posts created', dot: '#22C55E' },
              { name: 'Timing Agent', sub: 'Best times: 9AM, 7PM, 11PM', dot: '#22C55E' },
              { name: 'Insights Agent', sub: 'Weekly digest ready · 23% reach increase', dot: '#FBBF24' },
              { name: 'Engage Agent', sub: '12 replies drafted · awaiting review', dot: '#4DABF7' },
            ].map((agent,i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--line)', borderRadius: 9, marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: agent.dot, flexShrink: 0 }}/>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--t2)' }}>{agent.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--t4)' }}>{agent.sub}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--t3)', padding: '4px 10px', background: 'var(--bg4)', border: '1px solid var(--line2)', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                  Run
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EMAIL SEQUENCES ── */}
      <section id="sequences" style={{ padding: isMobile ? '60px 24px' : '80px 40px' }}>
        <div style={{ ...twoCol }}>
          {/* LEFT — sequence mockup */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Welcome sequence</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.16)', borderRadius: 5 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22C55E' }}/>
                <span style={{ fontSize: 10, color: '#4ADE80' }}>Active · 847 contacts</span>
              </div>
            </div>
            <div style={{ padding: 16 }}>
              {[
                { day: 'Day 0', subject: 'Welcome to [Business Name]', open: '68%' },
                { day: 'Day 2', subject: 'The one thing most clients get wrong', open: '54%' },
                { day: 'Day 5', subject: "Here's what we do differently", open: '47%' },
                { day: 'Day 9', subject: 'Ready to talk?', open: '39%' },
              ].map((step,i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--line)', borderRadius: 8, marginBottom: 6 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 7, background: 'rgba(30,142,240,0.08)', border: '1px solid rgba(30,142,240,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--blue2)', fontFamily: 'var(--mono)' }}>{step.day}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 500, marginBottom: 2 }}>{step.subject}</div>
                    <div style={{ fontSize: 10, color: 'var(--t4)' }}>Written in your voice · Nexa AI</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 300, color: 'var(--blue2)' }}>{step.open}</div>
                    <div style={{ fontSize: 9, color: 'var(--t5)' }}>open rate</div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(30,142,240,0.04)', border: '1px solid rgba(30,142,240,0.1)', borderRadius: 8, fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>
                847 contacts receiving this sequence · 52% average open rate
              </div>
            </div>
          </div>
          {/* RIGHT — text */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--blue2)', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Sequences · Email automation</div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: isMobile ? 28 : 38, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: 20 }}>Nurture every lead. Automatically.</h2>
            <p style={{ fontSize: 15, color: 'var(--t3)', lineHeight: 1.8, marginBottom: 24 }}>
              Build email sequences that sound like you wrote every word — because Nexa did, using your Brand Brain. New lead signs up? They enter your sequence automatically. Every email is personalized, timed perfectly, and written in your voice.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Sequences written in your exact voice','Triggered automatically from any source','Open rate tracking and AI optimization','Connects to HubSpot, Zapier, and more'].map((f,i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--t2)' }}><CheckIcon/>{f}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── AMPLIFY ── */}
      <section id="amplify" style={{ padding: isMobile ? '60px 24px' : '80px 40px' }}>
        <div style={{ ...twoCol }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--blue2)', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Amplify · Meta Ads</div>
              <span style={{ padding: '4px 10px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 5, fontSize: 10, color: '#FBB040' }}>Coming soon</span>
            </div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: isMobile ? 28 : 38, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: 20 }}>Meta Ads. Finally simple.</h2>
            <p style={{ fontSize: 15, color: 'var(--t3)', lineHeight: 1.8, marginBottom: 24 }}>
              Connect your Meta account. Nexa uses your Brand Brain data to build the targeting, writes the ad copy in your voice, generates the creative, and launches the campaign. You set the budget. Nexa handles the rest.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Brand Brain data builds your audience automatically','Ad copy written in your voice','AI-generated creatives that don\'t look like AI','Plain-English performance reporting'].map((f,i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--t2)' }}><CheckIcon/>{f}</div>
              ))}
            </div>
          </div>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 14, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Amplify</div>
              <span style={{ fontSize: 10, color: '#FBB040', padding: '2px 8px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.16)', borderRadius: 4 }}>Coming soon</span>
            </div>
            <div style={{ padding: 14, background: 'var(--bg3)', border: '1px solid var(--line)', borderRadius: 10, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--t1)' }}>Brand awareness · March</div>
                <div style={{ fontSize: 10, color: '#4ADE80' }}>Active</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {[['Spent','$124'],['Reached','8,420'],['Clicks','284']].map(([l,v],i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 300, color: 'var(--t1)' }}>{v}</div>
                    <div style={{ fontSize: 10, color: 'var(--t4)', marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '12px 14px', background: 'rgba(30,142,240,0.05)', border: '1px solid rgba(30,142,240,0.12)', borderRadius: 9, fontSize: 12, color: 'var(--t3)', lineHeight: 1.65 }}>
              💡 <strong style={{ color: 'var(--t2)' }}>Nexa insight:</strong> Your best performing creative used the same hook as your top LinkedIn post. Try boosting it directly.
            </div>
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS ── */}
      <section id="integrations" style={{ padding: isMobile ? '60px 24px' : '80px 40px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: isMobile ? 26 : 36, fontWeight: 400, letterSpacing: '-0.02em', marginBottom: 16 }}>Connects to the tools you already use.</h2>
        <p style={{ fontSize: 15, color: 'var(--t3)', maxWidth: 480, margin: '0 auto 48px', lineHeight: 1.75 }}>
          Nexa fits into your existing workflow. Connect your CRM, your project tools, your publishing platforms. Everything talks to everything.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, maxWidth: 680, margin: '0 auto 48px' }}>
          {INTEGRATIONS.map(name => (
            <div key={name} style={{ padding: '12px 20px', background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 9, fontSize: 13, color: 'var(--t3)' }}>{name}</div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: 'var(--t4)' }}>14 integrations</div>
          <div style={{ fontSize: 13, color: 'var(--t4)' }}>New ones added weekly</div>
        </div>
        <Link href="/auth/signup" style={{ fontSize: 14, color: 'var(--blue2)', textDecoration: 'none' }}>View all integrations →</Link>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: isMobile ? '60px 24px' : '80px 40px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: isMobile ? 26 : 36, fontWeight: 400, letterSpacing: '-0.02em', marginBottom: 48 }}>Up and running in 3 minutes.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 32, maxWidth: 900, margin: '0 auto' }}>
          {[
            { num: '01', title: 'Train Brand Brain', desc: 'Upload your best content, logo, or brand document. Nexa reads everything and builds your complete voice profile in minutes.' },
            { num: '02', title: 'Build your strategy', desc: 'One click generates your 30-day content calendar with angles, formats, and timing tailored to your market and audience.' },
            { num: '03', title: 'Create and grow', desc: 'Let agents run your content daily, or jump in and create manually. Watch your audience grow and your pipeline fill.' },
          ].map((step,i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 300, color: 'var(--blue)', lineHeight: 1 }}>{step.num}</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--t1)', marginTop: 16, marginBottom: 8 }}>{step.title}</div>
              <div style={{ fontSize: 14, color: 'var(--t3)', lineHeight: 1.75 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: isMobile ? '60px 24px' : '80px 40px' }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: isMobile ? 28 : 40, fontWeight: 400, letterSpacing: '-0.02em', textAlign: 'center', marginBottom: 12 }}>Simple pricing. Serious results.</h2>
        <p style={{ fontSize: 15, color: 'var(--t3)', textAlign: 'center', marginBottom: 48 }}>Every plan includes Brand Brain, Studio, and Strategy. Pay for what you use.</p>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4,1fr)', gap: 12, maxWidth: 1100, margin: '0 auto 24px' }}>
          {PLANS.map(plan => (
            <div key={plan.id} style={{
              background: plan.popular ? 'rgba(30,142,240,0.04)' : 'var(--bg2)',
              border: `1px solid ${plan.popular ? 'var(--blue-border)' : 'var(--line)'}`,
              borderRadius: 12, padding: 24, position: 'relative',
            }}>
              {plan.popular && (
                <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', padding: '4px 12px', background: 'var(--blue)', color: '#fff', fontSize: 10, fontWeight: 600, borderRadius: '0 0 8px 8px', whiteSpace: 'nowrap' }}>Most popular</div>
              )}
              <div style={{ paddingTop: plan.popular ? 16 : 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)', marginBottom: 4 }}>{plan.name}</div>
                <div style={{ fontSize: 12, color: 'var(--t4)', marginBottom: 16 }}>{plan.desc}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 300, color: 'var(--t1)', letterSpacing: '-0.04em' }}>{plan.price}</span>
                  <span style={{ fontSize: 13, color: 'var(--t4)' }}>{plan.period}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--blue2)', marginBottom: 20 }}>{plan.credits}</div>
                <div style={{ height: 1, background: 'var(--line)', marginBottom: 16 }}/>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  {plan.features.map((f,i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--t3)' }}>
                      <CheckIcon/>{f}
                    </div>
                  ))}
                </div>
                <Link href={`/auth/signup?plan=${plan.id}`} style={{
                  display: 'block', textAlign: 'center', padding: '10px 0',
                  background: plan.popular ? 'var(--blue)' : 'var(--bg3)',
                  border: `1px solid ${plan.popular ? 'var(--blue)' : 'var(--line2)'}`,
                  color: plan.popular ? '#fff' : 'var(--t2)',
                  borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: 'none',
                }}>{plan.cta}</Link>
              </div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--t4)' }}>All plans include a 7-day free trial. Cancel anytime. No contracts.</p>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="stories" style={{ padding: isMobile ? '60px 24px' : '80px 40px' }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: isMobile ? 28 : 40, fontWeight: 400, letterSpacing: '-0.02em', textAlign: 'center', marginBottom: 48 }}>Real businesses. Real results.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 16, maxWidth: 1000, margin: '0 auto' }}>
          {[
            { quote: 'Nexa wrote a LinkedIn post that got me 3 discovery calls in one week. The voice match is insane — my clients thought I wrote it myself.', name: 'Sarah K.', role: 'Brand consultant, Dubai' },
            { quote: 'I run a 12-person agency. Nexa replaced 3 tools and saves us 20 hours a week. The agency workspaces are exactly what we needed.', name: 'Marcus T.', role: 'Agency founder, London' },
            { quote: 'I used to spend Sunday nights stressed about what to post. Now I open Nexa on Monday morning and everything is already scheduled.', name: 'Layla M.', role: 'Freelance designer, Abu Dhabi' },
          ].map((t,i) => (
            <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 12, padding: 24 }}>
              <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                {Array.from({ length: 5 }).map((_,j) => (
                  <div key={j} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue2)' }}/>
                ))}
              </div>
              <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--t2)', lineHeight: 1.75, marginBottom: 16 }}>&ldquo;{t.quote}&rdquo;</p>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{t.name}</div>
              <div style={{ fontSize: 12, color: 'var(--t4)', marginTop: 3 }}>{t.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: isMobile ? '60px 24px' : '80px 40px', maxWidth: 720, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: isMobile ? 26 : 36, fontWeight: 400, letterSpacing: '-0.02em', textAlign: 'center', marginBottom: 48 }}>Questions we hear a lot</h2>
        {FAQS.map((faq,i) => (
          <div key={i} style={{ borderBottom: '1px solid var(--line)', padding: '20px 0' }}>
            <div onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--t1)' }}>{faq.q}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth="2" strokeLinecap="round" style={{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0, marginLeft: 16 }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
            {openFaq === i && (
              <p style={{ fontSize: 14, color: 'var(--t3)', lineHeight: 1.8, paddingTop: 12, paddingBottom: 4 }}>{faq.a}</p>
            )}
          </div>
        ))}
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: isMobile ? '80px 24px' : '100px 40px', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
        <div style={{ position: 'absolute', top: -80, left: -80, width: 400, height: 400, borderRadius: '50%', background: '#5B21B6', filter: 'blur(140px)', opacity: 0.07, pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 360, height: 360, borderRadius: '50%', background: '#C2410C', filter: 'blur(140px)', opacity: 0.07, pointerEvents: 'none' }}/>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 12, color: 'var(--t4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 }}>Join 2,400+ business owners already growing with Nexa</p>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: isMobile ? 34 : 48, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 8 }}>
            Your competitors are already<br/>showing up every day.
          </h2>
          <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: isMobile ? 28 : 40, color: 'var(--blue2)', marginTop: 8 }}>Are you?</p>
          <p style={{ fontSize: 15, color: 'var(--t3)', marginTop: 16, marginBottom: 32 }}>Start free. No credit card. Cancel any time.</p>
          <Link href="/auth/signup" style={{ display: 'inline-block', padding: '16px 36px', background: 'var(--blue)', color: '#fff', borderRadius: 12, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>
            Start building with Nexa →
          </Link>
          <p style={{ fontSize: 12, color: 'var(--t5)', marginTop: 16 }}>500 free credits · Setup in 3 minutes · No card needed</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid var(--line)', padding: '48px 40px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr 1fr', gap: 40, maxWidth: 1100, margin: '0 auto', marginBottom: 32 }}>
          <div>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 12 }}>
              <Image src="/favicon.png" alt="Nexa" width={20} height={20} style={{ borderRadius: 5 }} />
              <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--t1)' }}>Nexa</span>
            </Link>
            <p style={{ fontSize: 13, color: 'var(--t4)', lineHeight: 1.75, maxWidth: 240 }}>
              The business intelligence engine for entrepreneurs, creatives, and agencies who are serious about growth.
            </p>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Product</div>
            {['Studio','Strategy','Agents','Amplify','AI Chat','Sequences','Pricing','Integrations'].map(item => (
              <div key={item} style={{ marginBottom: 10 }}>
                <a href={`#${item.toLowerCase().replace(' ','-')}`} style={{ fontSize: 13, color: 'var(--t3)', textDecoration: 'none' }}>{item}</a>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Company</div>
            {['About','Blog','Careers','Contact','Press'].map(item => (
              <div key={item} style={{ marginBottom: 10 }}>
                <a href="#" style={{ fontSize: 13, color: 'var(--t3)', textDecoration: 'none' }}>{item}</a>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Legal</div>
            <div style={{ marginBottom: 10 }}><Link href="/landing/privacy" style={{ fontSize: 13, color: 'var(--t3)', textDecoration: 'none' }}>Privacy Policy</Link></div>
            <div style={{ marginBottom: 10 }}><Link href="/landing/terms" style={{ fontSize: 13, color: 'var(--t3)', textDecoration: 'none' }}>Terms of Service</Link></div>
            <div style={{ marginBottom: 10 }}><a href="#" style={{ fontSize: 13, color: 'var(--t3)', textDecoration: 'none' }}>Security</a></div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, maxWidth: 1100, margin: '0 auto' }}>
          <span style={{ fontSize: 12, color: 'var(--t4)' }}>© 2026 Nexa. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 20 }}>
            {['X','LinkedIn','Instagram'].map(s => (
              <a key={s} href="#" style={{ fontSize: 12, color: 'var(--t4)', textDecoration: 'none' }}>{s}</a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  )
}
