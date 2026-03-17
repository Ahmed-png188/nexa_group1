import Link from 'next/link'

export default function NotFound() {
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
        background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,170,255,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}/>

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: 40 }}>
          <img src="/favicon.png" alt="Nexa" style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }} />
          <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 800, fontSize: 18, color: '#F4F0FF', letterSpacing: '-0.03em' }}>Nexa</span>
        </div>

        {/* 404 number */}
        <div style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: 'clamp(80px, 15vw, 120px)',
          fontWeight: 800,
          letterSpacing: '-0.06em',
          lineHeight: 1,
          background: 'linear-gradient(135deg, rgba(0,170,255,0.9) 0%, rgba(167,139,250,0.7) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: 16,
        }}>
          404
        </div>

        <h1 style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: 22,
          fontWeight: 700,
          color: '#F4F0FF',
          letterSpacing: '-0.03em',
          marginBottom: 10,
        }}>
          Page not found
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(244,240,255,0.38)', marginBottom: 36, maxWidth: 360, margin: '0 auto 36px' }}>
          This page doesn&apos;t exist or has been moved. Head back to your dashboard.
        </p>

        <Link href="/dashboard" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 28px',
          background: '#00AAFF',
          color: '#000',
          borderRadius: 10,
          fontWeight: 700,
          fontSize: 14,
          textDecoration: 'none',
          letterSpacing: '-0.01em',
          boxShadow: '0 4px 20px rgba(0,170,255,0.35)',
          transition: 'all 0.15s',
        }}>
          Back to dashboard →
        </Link>
      </div>
    </div>
  )
}
