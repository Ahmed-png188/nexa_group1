'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/language-context'

export default function ArabicEntry() {
  const { setLang } = useLang()
  const router = useRouter()

  useEffect(() => {
    setLang('ar')
    router.replace('/dashboard')
  }, [])

  return null
}
