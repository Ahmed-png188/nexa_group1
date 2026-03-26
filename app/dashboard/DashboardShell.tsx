'use client'
import { useLang } from '@/lib/language-context'
import DashboardShellAr from './DashboardShell.ar'
import DashboardShellEn from './DashboardShell.en'

interface Props { user: any; workspace: any; credits: number; children: React.ReactNode }

export default function DashboardShell(props: Props) {
  const { isArabic } = useLang()
  return isArabic ? <DashboardShellAr {...props} /> : <DashboardShellEn {...props} />
}
