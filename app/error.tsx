'use client'

import { useEffect } from 'react'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#08080D',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "'Inter', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 800, height: 500,
        background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,77,77,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}/>

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: 40 }}>
          <img src="/favicon.png" alt="Nexa" style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }} />
          <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 800, fontSize: 18, color: '#F4F0FF', letterSpacing: '-0.03em' }}>Nexa</span>
        </div>

        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(255,77,77,0.08)',
          border: '1px solid rgba(255,77,77,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,77,77,0.8)" strokeWidth="1.8" strokeLinecap="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>

        <h1 style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: 22,
          fontWeight: 700,
          color: '#F4F0FF',
          letterSpacing: '-0.03em',
          marginBottom: 10,
        }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(244,240,255,0.38)', marginBottom: 8, lineHeight: 1.6 }}>
          An unexpected error occurred. Our team has been notified.
        </p>
        {error.digest && (
          <p style={{ fontSize: 11, color: 'rgba(244,240,255,0.2)', marginBottom: 32, fontFamily: 'monospace' }}>
            Error ID: {error.digest}
          </p>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={reset}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '11px 24px',
              background: '#00AAFF', color: '#000',
              borderRadius: 10, border: 'none',
              fontWeight: 700, fontSize: 14,
              cursor: 'pointer',
              letterSpacing: '-0.01em',
              boxShadow: '0 4px 20px rgba(0,170,255,0.3)',
            }}
          >
            Try again
          </button>
          <a
            href="/dashboard"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '11px 24px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(244,240,255,0.7)',
              borderRadius: 10,
              fontWeight: 600, fontSize: 14,
              textDecoration: 'none',
              letterSpacing: '-0.01em',
            }}
          >
            Back to dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
