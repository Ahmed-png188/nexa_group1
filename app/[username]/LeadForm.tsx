'use client'

import { useState } from 'react'

interface Workspace {
  id: string
  name: string
  brand_name: string | null
  niche: string | null
  lead_page_custom_question: string | null
}

export default function LeadForm({ workspace: ws }: { workspace: Workspace }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [customAnswer, setCustomAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const brandName = ws.brand_name || ws.name
  const customQ = ws.lead_page_custom_question || "What's your biggest challenge right now?"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setSubmitting(true)
    setError('')
    try {
      const r = await fetch('/api/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: ws.id,
          name,
          email,
          custom_answer: customAnswer,
          source: 'lead_page',
        }),
      })
      if (r.ok) setSubmitted(true)
      else setError('Something went wrong. Please try again.')
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setSubmitting(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000010', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: 800, height: 500, background: 'radial-gradient(ellipse 50% 35% at 50% 0%, rgba(0,120,255,0.07) 0%, transparent 70%)', pointerEvents: 'none' }}/>

      <div style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#1E8EF0,#7B6FFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'serif' }}>
            {brandName[0]?.toUpperCase()}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', marginBottom: 8, fontFamily: 'serif' }}>{brandName}</h1>
          {ws.niche && (
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, maxWidth: 360, margin: '0 auto' }}>{ws.niche}</p>
          )}
        </div>

        {/* Form card */}
        <div style={{ background: 'rgba(10,10,18,0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '32px 28px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(30,142,240,0.4),transparent)' }}/>

          {submitted ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.03em' }}>You're in.</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>I'll be in touch soon.</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>Your name</div>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="First name"
                  style={{ width: '100%', padding: '11px 14px', fontSize: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'sans-serif' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(30,142,240,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>Email address <span style={{ color: '#1E8EF0' }}>*</span></div>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="you@example.com"
                  style={{ width: '100%', padding: '11px 14px', fontSize: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'sans-serif' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(30,142,240,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>{customQ}</div>
                <textarea
                  value={customAnswer} onChange={e => setCustomAnswer(e.target.value)}
                  rows={3} placeholder="Your answer..."
                  style={{ width: '100%', padding: '11px 14px', fontSize: 13, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', outline: 'none', resize: 'vertical', lineHeight: 1.65, boxSizing: 'border-box', fontFamily: 'sans-serif' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(30,142,240,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
              {error && <div style={{ fontSize: 13, color: '#FF5757', padding: '8px 12px', background: 'rgba(255,87,87,0.07)', border: '1px solid rgba(255,87,87,0.2)', borderRadius: 8 }}>{error}</div>}
              <button type="submit" disabled={submitting || !email}
                style={{ width: '100%', padding: '13px', fontSize: 14, fontWeight: 700, background: email ? '#1E8EF0' : 'rgba(255,255,255,0.04)', color: email ? '#000' : 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, cursor: email ? 'pointer' : 'not-allowed', transition: 'all 0.18s', fontFamily: 'sans-serif' }}>
                {submitting ? 'Submitting…' : 'Submit →'}
              </button>
            </form>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
          Powered by <a href="https://nexaa.cc" style={{ color: 'rgba(30,142,240,0.5)', textDecoration: 'none' }}>Nexa</a>
        </div>
      </div>
    </div>
  )
}
