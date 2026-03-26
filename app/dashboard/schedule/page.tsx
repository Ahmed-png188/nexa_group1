'use client'
import { useLang } from '@/lib/language-context'
import SchedulePageAr from './page.ar'
import SchedulePageEn from './page.en'

export default function SchedulePage() {
  const { isArabic } = useLang()
  return isArabic ? <SchedulePageAr /> : <SchedulePageEn />
}
