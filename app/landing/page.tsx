'use client'
import { useLang } from '@/lib/language-context'
import LandingPageAr from './page.ar'
import LandingPageEn from './page.en'

export default function LandingPage() {
  const { isArabic } = useLang()
  return isArabic ? <LandingPageAr /> : <LandingPageEn />
}
