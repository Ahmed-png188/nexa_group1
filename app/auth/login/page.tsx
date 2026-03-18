'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forgotMode, setForgotMode] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' },
    })
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError('Enter your email address first.'); return }
    setResetLoading(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setResetLoading(false)
    if (error) { setError(error.message); return }
    setResetSent(true)
  }

  return (
    <div style={cardStyle}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, justifyContent: 'center' }}>
        <img src="/favicon.png" alt="Nexa" style={{
          width: 28, height: 28, borderRadius: 7, objectFit: 'cover',
        }}/>
        <span style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Nexa
        </span>
      </div>

      {forgotMode ? (
        <>
          <h1 style={{ ...headingStyle, marginBottom: 6 }}>Reset password</h1>
          <p style={{ color: 'var(--t4)', fontSize: 14, textAlign: 'center', marginBottom: 28 }}>
            We&apos;ll send a reset link to your email
          </p>

          {resetSent ? (
            <div style={{ padding: '16px', background: 'rgba(0,229,160,0.07)', border: '1px solid rgba(0,229,160,0.2)', borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)', marginBottom: 4 }}>Reset link sent</div>
              <div style={{ fontSize: 12, color: 'var(--t4)' }}>Check your inbox at {email}</div>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Email address</label>
                <input
                  type="email"
                  placeholder="you@brand.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'var(--cyan-line)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--line2)')}
                />
              </div>
              {error && (
                <div style={{ padding: '10px 14px', background: 'rgba(255,107,107,0.07)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 8, fontSize: 13, color: 'var(--red)' }}>
                  {error}
                </div>
              )}
              <button type="submit" disabled={resetLoading} style={{ ...btnStyle, opacity: resetLoading ? 0.7 : 1, cursor: resetLoading ? 'not-allowed' : 'pointer' }}>
                {resetLoading ? 'Sending...' : 'Send reset link →'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--t4)', marginTop: 20 }}>
            <button onClick={() => { setForgotMode(false); setResetSent(false); setError(null) }}
              style={{ background: 'none', border: 'none', color: 'var(--cyan)', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0 }}>
              ← Back to sign in
            </button>
          </p>
        </>
      ) : (
        <>
          <h1 style={{ ...headingStyle, marginBottom: 6 }}>Welcome back</h1>
          <p style={{ color: 'var(--t4)', fontSize: 14, textAlign: 'center', marginBottom: 28 }}>
            Sign in to your workspace
          </p>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            style={{ ...googleBtnStyle, opacity: googleLoading ? 0.7 : 1, cursor: googleLoading ? 'not-allowed' : 'pointer', marginBottom: 18 }}
          >
            {googleLoading ? 'Redirecting…' : (
              <><GoogleIcon />Continue with Google</>
            )}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--line2)' }} />
            <span style={{ fontSize: 11, color: 'var(--t5)', fontWeight: 500, whiteSpace: 'nowrap' }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: 'var(--line2)' }} />
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Email address</label>
              <input
                type="email"
                placeholder="you@brand.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--cyan-line)')}
                onBlur={e => (e.target.style.borderColor = 'var(--line2)')}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                <button type="button" onClick={() => { setForgotMode(true); setError(null) }}
                  style={{ background: 'none', border: 'none', color: 'var(--t4)', cursor: 'pointer', fontSize: 12, padding: 0, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--cyan)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--t4)')}>
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--cyan-line)')}
                onBlur={e => (e.target.style.borderColor = 'var(--line2)')}
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(255,107,107,0.07)',
                border: '1px solid rgba(255,107,107,0.2)',
                borderRadius: 8,
                fontSize: 13,
                color: 'var(--red)',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                ...btnStyle,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  <span className="nexa-spinner" style={{ width:14, height:14 }}/>
                  Signing in...
                </span>
              ) : 'Sign in →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--t4)', marginTop: 20 }}>
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" style={{ color: 'var(--cyan)', textDecoration: 'none', fontWeight: 600 }}>
              Start for free
            </Link>
          </p>
        </>
      )}
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 420,
  background: 'var(--bg2)',
  border: '1px solid var(--line2)',
  borderRadius: 18,
  padding: '36px 32px',
  position: 'relative',
  zIndex: 1,
  backdropFilter: 'blur(20px)',
}

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--display)',
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: '-0.03em',
  color: 'var(--t1)',
  textAlign: 'center',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--t4)',
  marginBottom: 7,
  letterSpacing: '0.01em',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  fontSize: 14,
  fontFamily: 'var(--sans)',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--line2)',
  borderRadius: 10,
  color: 'var(--t1)',
  outline: 'none',
  transition: 'border-color 0.18s',
}

const btnStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  fontSize: 14,
  fontWeight: 700,
  fontFamily: 'var(--sans)',
  background: 'var(--cyan)',
  color: '#000',
  border: 'none',
  borderRadius: 10,
  cursor: 'pointer',
  letterSpacing: '-0.01em',
  transition: 'all 0.18s',
  marginTop: 4,
}

const googleBtnStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  padding: '11px 16px',
  fontSize: 14,
  fontWeight: 600,
  fontFamily: 'var(--sans)',
  background: 'rgba(255,255,255,0.04)',
  color: 'rgba(255,255,255,0.82)',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: 10,
  cursor: 'pointer',
  letterSpacing: '-0.01em',
  transition: 'all 0.18s',
}

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}
