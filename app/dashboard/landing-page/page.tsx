'use client'
import { useLang } from '@/lib/language-context'
import LandingBuilder from './LandingBuilder'

export default function LandingPage() {
  const { isArabic } = useLang()
  return <LandingBuilder lang={isArabic ? 'ar' : 'en'} />
}
