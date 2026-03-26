'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading'|'success'|'error'|'invalid'>('loading')
  const [isAr,   setIsAr]   = useState(false)

  useEffect(() => {
    try { setIsAr(localStorage.getItem('nexa_lang') === 'ar') } catch {}
    if (!token) { setStatus('invalid'); return }
    const supabase = createClient()
    supabase
      .from('sequence_contacts')
      .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
      .eq('id', token)
      .then(({ error }) => setStatus(error ? 'error' : 'success'))
  }, [token])

  const F = isAr ? "'Tajawal', system-ui, sans-serif" : 'var(--sans)'
  const H = isAr ? "'Tajawal', system-ui, sans-serif" : 'var(--display)'

  return (
    <div dir={isAr?'rtl':'ltr'} style={{ minHeight:'100vh', background:'#08080D', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', fontFamily:F }}>
      <div style={{ maxWidth:420, width:'100%', background:'rgba(13,13,20,0.9)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:18, padding:'40px 32px', textAlign:'center', backdropFilter:'blur(20px)' }}>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:32 }}>
          <img src="/favicon.png" alt="Nexa" style={{ width:26, height:26, borderRadius:6 }}/>
          <span style={{ fontFamily:H, fontWeight:800, fontSize:15, color:'rgba(255,255,255,0.9)', letterSpacing: isAr?0:'-0.02em' }}>Nexa</span>
        </div>

        {status === 'loading' && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
            <div style={{ width:20, height:20, border:'2px solid rgba(255,255,255,0.1)', borderTopColor:'var(--cyan)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
            <p style={{ color:'rgba(255,255,255,0.4)', fontSize:14, fontFamily:F }}>
              {isAr ? '...جارٍ المعالجة' : 'Processing…'}
            </p>
          </div>
        )}

        {status === 'invalid' && (
          <>
            <div style={{ fontSize:32, marginBottom:16 }}>⚠️</div>
            <h1 style={{ fontFamily:H, fontSize:20, fontWeight:800, color:'rgba(255,255,255,0.9)', marginBottom:10 }}>
              {isAr ? 'رابط غير صحيح' : 'Invalid link'}
            </h1>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.38)', lineHeight:1.75, fontFamily:F }}>
              {isAr
                ? 'هذا الرابط لا يحتوي على رمز صحيح. استخدم الرابط الموجود في الإيميل.'
                : 'This unsubscribe link is missing a token. Please use the link from the email.'}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ width:52, height:52, borderRadius:14, background:'rgba(0,229,160,0.08)', border:'1px solid rgba(0,229,160,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(0,229,160,0.9)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h1 style={{ fontFamily:H, fontSize:20, fontWeight:800, color:'rgba(255,255,255,0.9)', marginBottom:10 }}>
              {isAr ? 'تم إلغاء اشتراكك' : "You've been unsubscribed"}
            </h1>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.38)', lineHeight:1.75, marginBottom:28, fontFamily:F }}>
              {isAr
                ? 'لن تصلك أي رسائل إضافية من هذا السيكوانس.'
                : "You won't receive any more emails from this sequence."}
            </p>
            <Link href="/landing" style={{ fontSize:13, color:'var(--cyan)', textDecoration:'none', fontWeight:600, fontFamily:F }}>
              {isAr ? '→ العودة للرئيسية' : '← Back to homepage'}
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ width:52, height:52, borderRadius:14, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,0.9)" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
            <h1 style={{ fontFamily:H, fontSize:20, fontWeight:800, color:'rgba(255,255,255,0.9)', marginBottom:10 }}>
              {isAr ? 'حدث خطأ' : 'Something went wrong'}
            </h1>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.38)', lineHeight:1.75, fontFamily:F }}>
              {isAr
                ? 'لم نتمكن من معالجة طلبك. حاول مرة أخرى أو تواصل معنا على hello@nexaa.cc'
                : "We couldn't process your unsubscribe request. Please try again or contact hello@nexaa.cc"}
            </p>
          </>
        )}
      </div>
      <style dangerouslySetInnerHTML={{ __html:`@keyframes spin{to{transform:rotate(360deg)}}` }}/>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:'100vh', background:'#08080D', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:20, height:20, border:'2px solid rgba(255,255,255,0.1)', borderTopColor:'var(--cyan)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  )
}
