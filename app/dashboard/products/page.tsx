'use client'
import { useLang } from '@/lib/language-context'
import ProductsEn from './page.en'
import ProductsAr from './page.ar'
export default function ProductsPage() {
  const { isArabic } = useLang()
  return isArabic ? <ProductsAr /> : <ProductsEn />
}
