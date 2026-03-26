'use client'
import { useLang } from '@/lib/language-context'
import HomePageAr from './page.ar'
import HomePageEn from './page.en'

export default function HomePage() {
  const { isArabic } = useLang()
  return isArabic ? <HomePageAr /> : <HomePageEn />
}
