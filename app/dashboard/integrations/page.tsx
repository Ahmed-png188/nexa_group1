'use client'
import { useLang } from '@/lib/language-context'
import PageAr from './page.ar'
import PageEn from './page.en'

export default function Page() {
  const { isArabic } = useLang()
  return isArabic ? <PageAr /> : <PageEn />
}
