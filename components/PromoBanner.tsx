'use client'
/**
 * PromoBanner — shows a dismissible discount tag at the top of any page
 * when an active promo code has show_banner: true in Supabase.
 *
 * Place at: components/PromoBanner.tsx
 * Use in:   app/landing/layout.tsx  (wraps all landing pages automatically)
 */

import { useState, useEffect } from 'react'
import { useAdminConfig, applyDiscount } from '@/lib/use-admin-config'

const CYAN    = '#00AAFF'
const SUCCESS = '#22C55E'

interface Props {
  isArabic?: boolean
}

export default function PromoBanner({ isArabic = false }: Props) {
  const { activeCodes, loading } = useAdminConfig()
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check if user already dismissed this session
    const key = activeCodes.map(c => c.code).join(',')
    if (sessionStorage.getItem(`promo-dismissed-${key}`)) setDismissed(true)
  }, [activeCodes])

  if (!mounted || loading || dismissed || activeCodes.length === 0) return null

  // Pick the first active banner promo
  const promo = activeCodes[0]
  const discountLabel = promo.type === 'percent'
    ? `${promo.value}% OFF`
    : `$${promo.value} OFF`

  const text = isArabic
    ? (promo.banner_text_ar || `كود الخصم: ${promo.code} — خصم ${promo.type === 'percent' ? promo.value + '%' : '$' + promo.value} على ${promo.plan === 'all' ? 'جميع الخطط' : promo.plan}`)
    : (promo.banner_text_en || `Use code ${promo.code} — ${discountLabel} on ${promo.plan === 'all' ? 'all plans' : `the ${promo.plan} plan`}`)

  const expiryText = promo.expires_at
    ? (isArabic ? `· ينتهي ${new Date(promo.expires_at).toLocaleDateString('ar')}` : `· Expires ${new Date(promo.expires_at).toLocaleDateString()}`)
    : ''

  function dismiss() {
    setDismissed(true)
    const key = activeCodes.map(c => c.code).join(',')
    sessionStorage.setItem(`promo-dismissed-${key}`, '1')
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 200,
      background: `linear-gradient(90deg, ${SUCCESS}18, ${CYAN}18)`,
      borderBottom: `1px solid ${SUCCESS}30`,
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: '9px 48px',
      animation: 'promoBannerIn 0.4s cubic-bezier(0.16,1,0.3,1)',
    }}>
      <style>{`
        @keyframes promoBannerIn {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
      `}</style>

      {/* Discount badge */}
      <span style={{
        background: SUCCESS,
        color: '#000',
        fontSize: 10,
        fontWeight: 800,
        padding: '3px 8px',
        borderRadius: 5,
        letterSpacing: '0.08em',
        fontFamily: "'Geist Mono', monospace",
        flexShrink: 0,
      }}>
        {discountLabel}
      </span>

      {/* Code pill */}
      <span style={{
        fontFamily: "'Geist Mono', monospace",
        fontSize: 12,
        color: CYAN,
        background: `${CYAN}15`,
        border: `1px solid ${CYAN}30`,
        padding: '2px 10px',
        borderRadius: 5,
        letterSpacing: '0.06em',
        flexShrink: 0,
      }}>
        {promo.code}
      </span>

      {/* Text */}
      <span style={{
        fontSize: 13,
        color: 'rgba(255,255,255,0.72)',
        fontFamily: isArabic ? "'Tajawal', sans-serif" : "'DM Sans', sans-serif",
        textAlign: 'center',
      }}>
        {text}
        {expiryText && <span style={{ color: 'rgba(255,255,255,0.35)', marginLeft: 6 }}>{expiryText}</span>}
      </span>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        style={{
          position: 'absolute',
          right: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.3)',
          cursor: 'pointer',
          padding: 4,
          lineHeight: 1,
          fontSize: 16,
        }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}
