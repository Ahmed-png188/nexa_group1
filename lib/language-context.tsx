'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Lang = 'en' | 'ar'

interface LangContextType {
  lang: Lang
  setLang: (l: Lang) => void
  isArabic: boolean
  dir: 'ltr' | 'rtl'
  fontClass: string
}

// Read lang synchronously before first render — eliminates flash
function getInitialLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  try {
    const stored = localStorage.getItem('nexa_lang')
    if (stored === 'ar' || stored === 'en') return stored
    return navigator.language?.startsWith('ar') ? 'ar' : 'en'
  } catch {
    return 'en'
  }
}

const LanguageContext = createContext<LangContextType>({
  lang: 'en',
  setLang: () => {},
  isArabic: false,
  dir: 'ltr',
  fontClass: '',
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Initialize directly from localStorage — no flash
  const [lang, setLangState] = useState<Lang>(getInitialLang)

  const setLang = (l: Lang) => {
    setLangState(l)
    try { localStorage.setItem('nexa_lang', l) } catch {}
    // Update html attributes immediately without reload
    document.documentElement.lang = l
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.setAttribute('data-lang', l)
    document.body.setAttribute('data-lang', l)
    document.body.style.fontFamily = l === 'ar'
      ? "'Tajawal', system-ui, sans-serif"
      : "'Geist', -apple-system, sans-serif"
  }

  // Sync html attrs on mount and on lang change
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.setAttribute('data-lang', lang)
    document.body.setAttribute('data-lang', lang)
    document.body.style.fontFamily = lang === 'ar'
      ? "'Tajawal', system-ui, sans-serif"
      : "'Geist', -apple-system, sans-serif"
  }, [lang])

  const isArabic = lang === 'ar'

  return (
    <LanguageContext.Provider value={{
      lang,
      setLang,
      isArabic,
      dir: isArabic ? 'rtl' : 'ltr',
      fontClass: isArabic ? 'font-arabic' : '',
    }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLang = () => useContext(LanguageContext)
