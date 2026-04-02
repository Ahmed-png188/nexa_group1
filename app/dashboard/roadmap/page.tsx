'use client'
import { useLang } from '@/lib/language-context'
import RoadmapPageAr from './page.ar'
import RoadmapPageEn from './page.en'

export default function RoadmapPage() {
  const { isArabic } = useLang()
  return isArabic ? <RoadmapPageAr /> : <RoadmapPageEn />
}
