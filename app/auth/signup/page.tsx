'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleGoogleSignup() {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://nexaa.cc/auth/callback' },
    })
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div style={cardStyle}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48,
            borderRadius: 12,
            background: 'rgba(0,214,143,0.1)',
            border: '1px solid rgba(0,214,143,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: 22,
          }}>✓</div>
          <h2 style={{ ...headingStyle, marginBottom: 10 }}>Check your email</h2>
          <p style={{ color: 'var(--t4)', fontSize: 14, lineHeight: 1.65 }}>
            We sent a confirmation link to <strong style={{ color: 'var(--t2)' }}>{email}</strong>.
            Click it to activate your account.
          </p>
          <p style={{ color: 'var(--t5)', fontSize: 12, marginTop: 16 }}>
            Check your spam folder if you don&apos;t see it.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={cardStyle}>
      {/* Logo + wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, justifyContent: 'center' }}>
        <img src="/favicon.png" alt="Nexa" style={{
          width: 28, height: 28, borderRadius: 7, objectFit: 'cover',
        }}/>
        <span style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Nexa
        </span>
      </div>

      <h1 style={{ ...headingStyle, marginBottom: 6 }}>Create your account</h1>
      <p style={{ color: 'var(--t4)', fontSize: 14, textAlign: 'center', marginBottom: 28 }}>
        14-day free trial · No credit card required
      </p>

      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogleSignup}
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

      <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={labelStyle}>Full name</label>
          <input
            type="text"
            placeholder="Ahmed Al-Rashidi"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--cyan-line)')}
            onBlur={e => (e.target.style.borderColor = 'var(--line2)')}
          />
        </div>

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
          <label style={labelStyle}>Password</label>
          <input
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
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
              Creating account...
            </span>
          ) : 'Create account →'}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--t4)', marginTop: 20 }}>
        Already have an account?{' '}
        <Link href="/auth/login" style={{ color: 'var(--cyan)', textDecoration: 'none', fontWeight: 600 }}>
          Sign in
        </Link>
      </p>

      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--t5)', marginTop: 16, lineHeight: 1.6 }}>
        By signing up you agree to our{' '}
        <a href="/terms" style={{ color: 'var(--t4)', textDecoration: 'none' }}>Terms</a>
        {' '}and{' '}
        <a href="/privacy" style={{ color: 'var(--t4)', textDecoration: 'none' }}>Privacy Policy</a>.
      </p>
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
