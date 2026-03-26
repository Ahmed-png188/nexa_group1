'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const F = "'Tajawal', system-ui, sans-serif"

const inp: React.CSSProperties = {
  width:'100%', padding:'11px 14px', fontSize:14, fontFamily:F,
  background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.12)',
  borderRadius:10, color:'#fff', outline:'none', transition:'border-color 0.18s',
  boxSizing:'border-box', direction:'rtl', textAlign:'right',
}

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginPageAr() {
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState<string|null>(null)
  const [forgotMode,   setForgotMode]   = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSent,    setResetSent]    = useState(false)
  const [gLoading,     setGLoading]     = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  async function googleLogin() {
    setGLoading(true)
    await supabase.auth.signInWithOAuth({ provider:'google', options:{ redirectTo:'https://nexaa.cc/auth/callback' } })
  }

  async function login(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('الإيميل أو كلمة السر غلط.'); setLoading(false); return }
    router.push('/dashboard'); router.refresh()
  }

  async function forgot(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError('أدخل إيميلك أولاً.'); return }
    setResetLoading(true); setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo:`${window.location.origin}/auth/reset-password` })
    setResetLoading(false)
    if (error) { setError(error.message); return }
    setResetSent(true)
  }

  const card: React.CSSProperties = {
    width:'100%', maxWidth:420, background:'#141414',
    border:'1px solid rgba(255,255,255,0.10)', borderRadius:18,
    padding:'36px 32px', position:'relative', zIndex:1,
    backdropFilter:'blur(20px)', direction:'rtl', fontFamily:F,
  }

  return (
    <div style={card}>
      {/* الشعار */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:28, justifyContent:'center' }}>
        <img src="/favicon.png" alt="Nexa" style={{ width:28, height:28, borderRadius:7, objectFit:'cover' }}/>
        <span style={{ fontFamily:F, fontSize:16, fontWeight:700, letterSpacing:'-0.02em', color:'#fff' }}>Nexa</span>
      </div>

      {forgotMode ? (
        /* ── وضع نسيت كلمة السر ── */
        <>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', textAlign:'center', marginBottom:6, fontFamily:F }}>
            إعادة تعيين كلمة السر.
          </h1>
          <p style={{ color:'rgba(255,255,255,0.40)', fontSize:14, textAlign:'center', marginBottom:28, fontFamily:F }}>
            بنرسل لك رابط على إيميلك.
          </p>

          {resetSent ? (
            <div style={{ padding:'16px', background:'rgba(34,197,94,0.07)', border:'1px solid rgba(34,197,94,0.20)', borderRadius:10, textAlign:'center' }}>
              <div style={{ fontSize:20, marginBottom:8 }}>✓</div>
              <div style={{ fontSize:13, fontWeight:600, color:'#22C55E', marginBottom:4, fontFamily:F }}>راجع إيميلك.</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.40)', fontFamily:F }}>{email}</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.40)', marginBottom:7, fontFamily:F }}>الإيميل</label>
                <input type="email" placeholder="بريدك@مثال.com" value={email}
                  onChange={e=>setEmail(e.target.value)} style={inp}
                  onFocus={e=>(e.target.style.borderColor='rgba(0,170,255,0.50)')}
                  onBlur={e=>(e.target.style.borderColor='rgba(255,255,255,0.12)')}/>
              </div>
              {error && (
                <div style={{ padding:'10px 14px', background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.20)', borderRadius:8, fontSize:13, color:'#EF4444', fontFamily:F }}>
                  {error}
                </div>
              )}
              <button onClick={forgot as any} disabled={resetLoading}
                style={{ width:'100%', padding:'12px', fontSize:14, fontWeight:700, fontFamily:F, background:'#00AAFF', color:'#000', border:'none', borderRadius:10, cursor:resetLoading?'not-allowed':'pointer', opacity:resetLoading?0.7:1, marginTop:4 }}>
                {resetLoading ? '...جارٍ الإرسال' : 'أرسل رابط الإعادة'}
              </button>
            </div>
          )}

          <p style={{ textAlign:'center', fontSize:13, color:'rgba(255,255,255,0.40)', marginTop:20, fontFamily:F }}>
            <button onClick={()=>{ setForgotMode(false); setResetSent(false); setError(null) }}
              style={{ background:'none', border:'none', color:'#00AAFF', cursor:'pointer', fontSize:13, fontWeight:600, padding:0, fontFamily:F }}>
              ارجع لتسجيل الدخول
            </button>
          </p>
        </>
      ) : (
        /* ── وضع تسجيل الدخول الرئيسي ── */
        <>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', textAlign:'center', marginBottom:6, fontFamily:F }}>
            أهلاً بعودتك.
          </h1>
          <p style={{ color:'rgba(255,255,255,0.40)', fontSize:14, textAlign:'center', marginBottom:28, fontFamily:F }}>
            أكمل من حيث توقفت.
          </p>

          {/* Google */}
          <button type="button" onClick={googleLogin} disabled={gLoading}
            style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'11px 16px', fontSize:14, fontWeight:600, fontFamily:F, background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.82)', border:'1px solid rgba(255,255,255,0.18)', borderRadius:10, cursor:gLoading?'not-allowed':'pointer', opacity:gLoading?0.7:1, marginBottom:18 }}>
            {gLoading ? '...تحويل' : <><GoogleIcon />تسجيل الدخول بـ Google</>}
          </button>

          {/* الفاصل */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
            <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.10)' }}/>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.28)', fontWeight:500, whiteSpace:'nowrap', fontFamily:F }}>أو تابع بـ</span>
            <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.10)' }}/>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {/* الإيميل */}
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.40)', marginBottom:7, fontFamily:F }}>الإيميل</label>
              <input type="email" placeholder="بريدك@مثال.com" value={email}
                onChange={e=>setEmail(e.target.value)} style={inp}
                onFocus={e=>(e.target.style.borderColor='rgba(0,170,255,0.50)')}
                onBlur={e=>(e.target.style.borderColor='rgba(255,255,255,0.12)')}/>
            </div>

            {/* كلمة السر */}
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:7 }}>
                <button type="button" onClick={()=>{ setForgotMode(true); setError(null) }}
                  style={{ background:'none', border:'none', color:'rgba(255,255,255,0.35)', cursor:'pointer', fontSize:12, padding:0, fontFamily:F, transition:'color 0.15s' }}
                  onMouseEnter={e=>(e.currentTarget.style.color='#00AAFF')}
                  onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.35)')}>
                  نسيت كلمة السر؟
                </button>
                <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.40)', fontFamily:F }}>كلمة السر</label>
              </div>
              <input type="password" placeholder="••••••••" value={password}
                onChange={e=>setPassword(e.target.value)} style={inp}
                onFocus={e=>(e.target.style.borderColor='rgba(0,170,255,0.50)')}
                onBlur={e=>(e.target.style.borderColor='rgba(255,255,255,0.12)')}/>
            </div>

            {error && (
              <div style={{ padding:'10px 14px', background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.20)', borderRadius:8, fontSize:13, color:'#EF4444', fontFamily:F }}>
                {error}
              </div>
            )}

            <button type="button" onClick={login as any} disabled={loading}
              style={{ width:'100%', padding:'12px', fontSize:14, fontWeight:700, fontFamily:F, background:'#00AAFF', color:'#000', border:'none', borderRadius:10, cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, marginTop:4 }}>
              {loading
                ? <span style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}>
                    <span className="nexa-spinner" style={{ width:14, height:14 }}/>...جارٍ التحقق
                  </span>
                : '← سجّل الدخول'}
            </button>
          </div>

          <p style={{ textAlign:'center', fontSize:13, color:'rgba(255,255,255,0.40)', marginTop:20, fontFamily:F }}>
            ما عندك حساب؟{' '}
            <Link href="/auth/signup" style={{ color:'#00AAFF', textDecoration:'none', fontWeight:600 }}>سجّل</Link>
          </p>
        </>
      )}

      {/* زر تبديل اللغة */}
      <div style={{ textAlign:'center', marginTop:20 }}>
        <button onClick={()=>{ localStorage.setItem('nexa_lang','en'); window.location.href='/auth/login' }}
          style={{ background:'none', border:'1px solid rgba(255,255,255,0.10)', borderRadius:6, color:'rgba(255,255,255,0.30)', fontSize:12, padding:'4px 12px', cursor:'pointer', fontFamily:"'Geist', sans-serif", transition:'all 0.15s' }}
          onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.70)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.25)' }}
          onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.30)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.10)' }}>
          English
        </button>
      </div>
    </div>
  )
}
