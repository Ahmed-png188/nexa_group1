import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import LandingPageRenderer from '../[slug]/LandingPageRenderer'
import type { LandingPageConfig, WorkspaceProduct } from '@/lib/landing-types'

export default async function CustomDomainPage(
  { searchParams }: { searchParams: { domain?: string } }
) {
  const domain = searchParams.domain
  if (!domain) notFound()

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: page } = await db
    .from('landing_pages')
    .select('*')
    .eq('custom_domain', domain)
    .eq('status', 'published')
    .single()

  if (!page) notFound()

  const config = page.config as LandingPageConfig
  let products: WorkspaceProduct[] = []

  if (config.products?.product_ids?.length) {
    const { data: productData } = await db
      .from('workspace_products')
      .select('*')
      .in('id', config.products.product_ids)
      .eq('active', true)

    const productMap = new Map(
      (productData || []).map((p: any) => [p.id, p])
    )
    products = config.products.product_ids
      .map(id => productMap.get(id))
      .filter(Boolean) as WorkspaceProduct[]
  }

  return (
    <LandingPageRenderer
      page={page as any}
      products={products}
      isPreview={false}
    />
  )
}
