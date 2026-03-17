'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading')

  useEffect(() => {
    if (!token) { setStatus('invalid'); return }
    const supabase = createClient()
    supabase
      .from('sequence_contacts')
      .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
      .eq('sequence_id', token)
      .then(({ error }) => {
        setStatus(error ? 'error' : 'success')
      })
  }, [token])

  return (
    <div style={{
      minHeight: '100vh', background: '#08080D',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        maxWidth: 420, width: '100%',
        background: 'rgba(13,13,20,0.9)', border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 18, padding: '40px 32px', textAlign: 'center',
        backdropFilter: 'blur(20px)',
      }}>
        {status === 'loading' && (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Processing…</p>
        )}

        {status === 'invalid' && (
          <>
            <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
            <h1 style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 800, color: 'rgba(255,255,255,0.9)', marginBottom: 10 }}>
              Invalid link
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.7 }}>
              This unsubscribe link is missing a token. Please use the link from the email.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', fontSize: 22,
            }}>✓</div>
            <h1 style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 800, color: 'rgba(255,255,255,0.9)', marginBottom: 10 }}>
              You&apos;ve been unsubscribed
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.7, marginBottom: 28 }}>
              You won&apos;t receive any more emails from this sequence.
            </p>
            <Link href="/" style={{ fontSize: 13, color: 'var(--cyan)', textDecoration: 'none', fontWeight: 600 }}>
              ← Back to homepage
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: 32, marginBottom: 16 }}>✗</div>
            <h1 style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 800, color: 'rgba(255,255,255,0.9)', marginBottom: 10 }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.7 }}>
              We couldn&apos;t process your unsubscribe request. Please try again or contact support.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#08080D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 13 }}>Loading…</p>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  )
}
