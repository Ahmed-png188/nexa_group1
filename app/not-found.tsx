'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function NotFound() {
  const [isAr, setIsAr] = useState(false)
  useEffect(() => {
    try { setIsAr(localStorage.getItem('nexa_lang') === 'ar') } catch {}
  }, [])

  const F = isAr ? "'Tajawal', system-ui, sans-serif" : 'var(--sans)'

  return (
    <div dir={isAr?'rtl':'ltr'} style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px', fontFamily:F, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'fixed', top:0, left:'50%', transform:'translateX(-50%)', width:800, height:500, background:'radial-gradient(ellipse 60% 40% at 50% 0%, var(--cyan-dim) 0%, transparent 70%)', pointerEvents:'none' }}/>

      <div style={{ textAlign:'center', position:'relative', zIndex:1, animation:'pageUp 0.4s cubic-bezier(0.22,1,0.36,1) both' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:9, marginBottom:48 }}>
          <img src="/favicon.png" alt="Nexa" style={{ width:28, height:28, borderRadius:7 }} />
          <span style={{ fontWeight:700, fontSize:15, color:'var(--text-1)', letterSpacing: isAr?0:'-0.02em', fontFamily:F }}>Nexa</span>
        </div>

        <div style={{ fontSize:'clamp(72px,14vw,110px)', fontWeight:700, letterSpacing:'-0.06em', lineHeight:1, color:'var(--text-1)', opacity:0.08, marginBottom:16, fontFamily:'var(--sans)' }}>
          404
        </div>

        <div style={{ width:48, height:48, borderRadius:14, background:'var(--cyan-dim)', border:'1px solid var(--cyan-border)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', color:'var(--cyan)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
        </div>

        <h1 style={{ fontSize:22, fontWeight:700, color:'var(--text-1)', letterSpacing:isAr?0:'-0.03em', marginBottom:10, fontFamily:F }}>
          {isAr ? 'الصفحة غير موجودة' : 'Page not found'}
        </h1>
        <p style={{ fontSize:13, color:'var(--text-3)', marginBottom:32, maxWidth:340, margin:'0 auto 32px', lineHeight:1.75, fontFamily:F }}>
          {isAr ? 'هذه الصفحة غير موجودة أو تم نقلها. عد للوحة تحكمك.' : "This page doesn't exist or has been moved. Head back to your dashboard."}
        </p>

        <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
          <Link href="/dashboard" className="btn-primary" style={{ textDecoration:'none', display:'inline-flex', alignItems:'center', gap:7, fontFamily:F }}>
            {isAr ? '← العودة للوحة التحكم' : 'Back to dashboard →'}
          </Link>
          <Link href="/landing" className="btn-secondary" style={{ textDecoration:'none', display:'inline-flex', alignItems:'center', gap:7, fontFamily:F }}>
            {isAr ? 'الصفحة الرئيسية' : 'Go to homepage'}
          </Link>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html:`@keyframes pageUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}` }}/>
    </div>
  )
}
