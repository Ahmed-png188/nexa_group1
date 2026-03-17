'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

function ResetPasswordInner() {
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [success, setSuccess]       = useState(false)
  const [ready, setReady]           = useState(false)
  const router      = useRouter()
  const searchParams = useSearchParams()
  const supabase    = createClient()

  // Supabase sends the recovery token in the URL fragment (#access_token=...)
  // The client SDK detects this automatically on mount and establishes a session.
  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    // Also check if already in a valid session (e.g. after redirect)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })
  }, [])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) { setError("Passwords don't match."); return }
    if (password.length < 6)  { setError('Minimum 6 characters.'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSuccess(true)
    setTimeout(() => router.push('/dashboard'), 2200)
  }

  return (
    <div style={cardStyle}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, justifyContent: 'center' }}>
        <img src="/favicon.png" alt="Nexa" style={{ width: 28, height: 28, borderRadius: 7, objectFit: 'cover' }} />
        <span style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Nexa
        </span>
      </div>

      {success ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 22 }}>✓</div>
          <h2 style={{ ...headingStyle, marginBottom: 10 }}>Password updated</h2>
          <p style={{ color: 'var(--t4)', fontSize: 14 }}>Redirecting you to the dashboard…</p>
        </div>
      ) : !ready ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 20, height: 20, border: '2px solid var(--line2)', borderTopColor: 'var(--cyan)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--t4)', fontSize: 14 }}>Verifying your reset link…</p>
        </div>
      ) : (
        <>
          <h1 style={{ ...headingStyle, marginBottom: 6 }}>Set new password</h1>
          <p style={{ color: 'var(--t4)', fontSize: 14, textAlign: 'center', marginBottom: 28 }}>
            Choose a strong password for your account
          </p>

          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>New password</label>
              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--cyan-line)')}
                onBlur={e  => (e.target.style.borderColor = 'var(--line2)')}
              />
            </div>
            <div>
              <label style={labelStyle}>Confirm new password</label>
              <input
                type="password"
                placeholder="Repeat your new password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--cyan-line)')}
                onBlur={e  => (e.target.style.borderColor = 'var(--line2)')}
              />
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(255,107,107,0.07)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 8, fontSize: 13, color: 'var(--red)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password || !confirm}
              style={{ ...btnStyle, opacity: (loading || !password || !confirm) ? 0.6 : 1, cursor: (loading || !password || !confirm) ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Updating…' : 'Update password →'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08080D' }}>
        <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--cyan)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <ResetPasswordInner />
    </Suspense>
  )
}

const cardStyle: React.CSSProperties = {
  width: '100%', maxWidth: 420,
  background: 'rgba(13,13,20,0.9)',
  border: '1px solid var(--line2)',
  borderRadius: 18, padding: '36px 32px',
  position: 'relative', zIndex: 1,
  backdropFilter: 'blur(20px)',
}

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800,
  letterSpacing: '-0.03em', color: 'var(--t1)', textAlign: 'center',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: 'var(--t4)', marginBottom: 7, letterSpacing: '0.01em',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', fontSize: 14,
  fontFamily: 'var(--sans)', background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--line2)', borderRadius: 10,
  color: 'var(--t1)', outline: 'none', transition: 'border-color 0.18s',
}

const btnStyle: React.CSSProperties = {
  width: '100%', padding: '12px', fontSize: 14, fontWeight: 700,
  fontFamily: 'var(--sans)', background: 'var(--cyan)', color: '#000',
  border: 'none', borderRadius: 10, cursor: 'pointer',
  letterSpacing: '-0.01em', transition: 'all 0.18s', marginTop: 4,
}
