'use client'
import { useLang } from '@/lib/language-context'
import AgencyPageAr from './page.ar'
import AgencyPageEn from './page.en'

export default function AgencyPage() {
  const { isArabic } = useLang()
  return isArabic ? <AgencyPageAr /> : <AgencyPageEn />
}
