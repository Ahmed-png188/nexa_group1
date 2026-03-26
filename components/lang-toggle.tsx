'use client'

import { useLang } from '@/lib/language-context'

export function LangToggle() {
  const { lang, setLang } = useLang()
  const isAr = lang === 'ar'

  return (
    <button
      onClick={() => setLang(isAr ? 'en' : 'ar')}
      aria-label={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
      style={{
        fontSize: '13px',
        letterSpacing: isAr ? '0' : '0.04em',
        fontFamily: isAr ? 'DM Sans, sans-serif' : 'Noto Naskh Arabic, serif',
        color: 'rgba(255,255,255,0.45)',
        background: 'none',
        border: '0.5px solid rgba(255,255,255,0.12)',
        borderRadius: '6px',
        padding: '5px 12px',
        cursor: 'pointer',
        transition: 'color 0.2s, border-color 0.2s',
      }}
      onMouseEnter={e => {
        const el = e.target as HTMLButtonElement
        el.style.color = 'rgba(255,255,255,0.85)'
        el.style.borderColor = 'rgba(255,255,255,0.25)'
      }}
      onMouseLeave={e => {
        const el = e.target as HTMLButtonElement
        el.style.color = 'rgba(255,255,255,0.45)'
        el.style.borderColor = 'rgba(255,255,255,0.12)'
      }}
    >
      {isAr ? 'English' : 'عربي'}
    </button>
  )
}
