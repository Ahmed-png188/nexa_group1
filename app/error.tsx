'use client'
import { useState, useEffect } from 'react'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [isAr, setIsAr] = useState(false)

  useEffect(() => {
    try { setIsAr(localStorage.getItem('nexa_lang') === 'ar') } catch {}
    // Silenced in production — error.digest is surfaced to the user for support
  }, [error])

  const F = isAr ? "'Tajawal', system-ui, sans-serif" : 'var(--sans)'

  return (
    <div dir={isAr?'rtl':'ltr'} style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px', fontFamily:F, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'fixed', top:0, left:'50%', transform:'translateX(-50%)', width:800, height:500, background:'radial-gradient(ellipse 60% 40% at 50% 0%, var(--error-dim) 0%, transparent 70%)', pointerEvents:'none' }}/>

      <div style={{ textAlign:'center', position:'relative', zIndex:1, maxWidth:440, animation:'pageUp 0.4s cubic-bezier(0.22,1,0.36,1) both' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:9, marginBottom:48 }}>
          <img src="/favicon.png" alt="Nexa" style={{ width:28, height:28, borderRadius:7 }} />
          <span style={{ fontWeight:700, fontSize:15, color:'var(--text-1)', letterSpacing:isAr?0:'-0.02em', fontFamily:F }}>Nexa</span>
        </div>

        <div style={{ width:52, height:52, borderRadius:'50%', background:'var(--error-dim)', border:'1px solid var(--error-border)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', color:'var(--error)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>

        <h1 style={{ fontSize:22, fontWeight:700, color:'var(--text-1)', letterSpacing:isAr?0:'-0.03em', marginBottom:10, fontFamily:F }}>
          {isAr ? 'حدث خطأ غير متوقع' : 'Something went wrong'}
        </h1>
        <p style={{ fontSize:13, color:'var(--text-3)', marginBottom:8, lineHeight:1.75, fontFamily:F }}>
          {isAr ? 'حدث خطأ. إذا استمر، تواصل مع فريقنا.' : 'An unexpected error occurred. Our team has been notified.'}
        </p>
        {error.digest && (
          <p style={{ fontSize:11, color:'var(--text-4)', marginBottom:32, fontFamily:'var(--mono)' }}>
            {isAr ? 'معرّف الخطأ: ' : 'Error ID: '}{error.digest}
          </p>
        )}

        <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={reset} className="btn-primary" style={{ display:'inline-flex', alignItems:'center', gap:7, fontFamily:F }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            {isAr ? 'حاول مرة أخرى' : 'Try again'}
          </button>
          <a href="/dashboard" className="btn-secondary" style={{ display:'inline-flex', alignItems:'center', gap:7, textDecoration:'none', fontFamily:F }}>
            {isAr ? 'العودة للوحة التحكم' : 'Back to dashboard'}
          </a>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html:`@keyframes pageUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}` }}/>
    </div>
  )
}
