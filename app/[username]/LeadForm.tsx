'use client'
import { useState } from 'react'

interface Workspace {
  id: string
  name: string
  brand_name: string | null
  niche: string | null
  lead_page_custom_question: string | null
  segment: string | null
}

export default function LeadForm({ workspace }: { workspace: Workspace }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const brandName = workspace.brand_name || workspace.name
  const customQ = workspace.lead_page_custom_question || "What's your biggest challenge right now?"
  const initial = brandName[0]?.toUpperCase() || 'N'

  const segmentCopy: Record<string, { headline: string; sub: string; cta: string }> = {
    creator: {
      headline: `Get exclusive content from ${brandName}`,
      sub: 'Join the community. First access to everything.',
      cta: "I'm in →",
    },
    freelancer: {
      headline: `Work with ${brandName}`,
      sub: "Limited spots available. Let's talk about your project.",
      cta: 'Start the conversation →',
    },
    business: {
      headline: `Connect with ${brandName}`,
      sub: "Drop your details and we'll be in touch within 24 hours.",
      cta: 'Get in touch →',
    },
    agency: {
      headline: `Partner with ${brandName}`,
      sub: "Tell us about your goals and we'll show you what's possible.",
      cta: "Let's talk →",
    },
  }

  const copy = segmentCopy[workspace.segment || 'business'] || segmentCopy.business

  async function handleSubmit() {
    if (!email || !email.includes('@')) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspace.id,
          name,
          email,
          answers: answer ? { [customQ]: answer } : {},
          source: 'lead_page',
        }),
      })
      if (res.ok) setSubmitted(true)
      else setError('Something went wrong. Please try again.')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=DM+Sans:wght@300;400;500;600&family=Instrument+Serif:ital@1&display=swap');
        * { box-sizing: border-box; }
        input, textarea { font-family: 'DM Sans', sans-serif; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.25); }
        input:focus, textarea:focus { border-color: rgba(30,142,240,0.4) !important; outline: none; }
      `}</style>

      {/* Background effects */}
      <div style={{ position:'fixed', inset:0, opacity:0.03, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize:'256px 256px', pointerEvents:'none' }}/>
      <div style={{ position:'fixed', top:'20%', left:'50%', transform:'translateX(-50%)', width:600, height:400, borderRadius:'50%', background:'radial-gradient(ellipse, rgba(30,142,240,0.06) 0%, transparent 70%)', pointerEvents:'none' }}/>

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:440 }}>

        {/* Brand avatar */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{
            width:60, height:60, borderRadius:16,
            background:'linear-gradient(135deg, #1E8EF0, #7B6FFF)',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 16px',
            fontFamily:"'Bricolage Grotesque', sans-serif",
            fontSize:24, fontWeight:800, color:'#fff',
            boxShadow:'0 0 0 1px rgba(255,255,255,0.08), 0 8px 24px rgba(30,142,240,0.2)',
          }}>
            {initial}
          </div>
          <div style={{
            fontFamily:"'Bricolage Grotesque', sans-serif",
            fontSize:26, fontWeight:800,
            color:'#fff', letterSpacing:'-0.04em',
            marginBottom:6,
          }}>
            {copy.headline}
          </div>
          <div style={{
            fontFamily:"'Instrument Serif', serif",
            fontStyle:'italic',
            fontSize:15, color:'rgba(255,255,255,0.5)',
            lineHeight:1.65,
          }}>
            {copy.sub}
          </div>
        </div>

        {/* Form card */}
        <div style={{
          background:'rgba(10,10,15,0.98)',
          border:'1px solid rgba(255,255,255,0.07)',
          borderRadius:18, padding:'28px 24px',
          position:'relative', overflow:'hidden',
          boxShadow:'0 24px 64px rgba(0,0,0,0.5)',
        }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(30,142,240,0.35),transparent)' }}/>

          {submitted ? (
            <div style={{ textAlign:'center', padding:'24px 0' }}>
              <div style={{
                width:52, height:52, borderRadius:'50%',
                background:'rgba(34,197,94,0.08)',
                border:'1px solid rgba(34,197,94,0.25)',
                display:'flex', alignItems:'center', justifyContent:'center',
                margin:'0 auto 16px',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:22, fontWeight:800, color:'#fff', marginBottom:8, letterSpacing:'-0.03em' }}>You&apos;re in.</div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.45)', lineHeight:1.65 }}>
                Expect to hear from {brandName} soon.
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.4)', marginBottom:6 }}>Your name</div>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="First name"
                  style={{ width:'100%', padding:'11px 14px', fontSize:14, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:10, color:'#fff', transition:'border-color 0.15s' }}
                />
              </div>

              <div>
                <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.4)', marginBottom:6 }}>
                  Email address <span style={{ color:'#1E8EF0' }}>*</span>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="you@example.com"
                  style={{ width:'100%', padding:'11px 14px', fontSize:14, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:10, color:'#fff', transition:'border-color 0.15s' }}
                />
              </div>

              <div>
                <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.4)', marginBottom:6 }}>
                  {customQ}
                </div>
                <textarea
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Your answer..."
                  rows={3}
                  style={{ width:'100%', padding:'11px 14px', fontSize:13, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:10, color:'#fff', resize:'vertical' as const, lineHeight:1.65, transition:'border-color 0.15s' }}
                />
              </div>

              {error && (
                <div style={{ fontSize:12, color:'#FF5757', padding:'8px 12px', background:'rgba(255,87,87,0.07)', border:'1px solid rgba(255,87,87,0.18)', borderRadius:8 }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting || !email}
                style={{
                  width:'100%', padding:'13px',
                  background: email ? 'linear-gradient(135deg, #1E8EF0, #0C5FBF)' : 'rgba(255,255,255,0.05)',
                  color: email ? '#fff' : 'rgba(255,255,255,0.2)',
                  border:'none', borderRadius:10,
                  fontFamily:"'Bricolage Grotesque',sans-serif",
                  fontSize:14, fontWeight:700,
                  cursor: email ? 'pointer' : 'not-allowed',
                  transition:'all 0.18s',
                  letterSpacing:'-0.01em',
                  boxShadow: email ? '0 4px 16px rgba(30,142,240,0.3)' : 'none',
                }}
              >
                {submitting ? 'Submitting...' : copy.cta}
              </button>
            </div>
          )}
        </div>

        <div style={{ textAlign:'center', marginTop:20, fontSize:11, color:'rgba(255,255,255,0.18)' }}>
          Powered by <a href="https://nexaa.cc" style={{ color:'rgba(30,142,240,0.5)', textDecoration:'none' }}>Nexa</a>
        </div>
      </div>
    </div>
  )
}
