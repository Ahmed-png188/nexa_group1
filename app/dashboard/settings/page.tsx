'use client'
import { useLang } from '@/lib/language-context'
import SettingsPageAr from './page.ar'
import SettingsPageEn from './page.en'

export default function SettingsPage() {
  const { isArabic } = useLang()
  return isArabic ? <SettingsPageAr /> : <SettingsPageEn />
}
