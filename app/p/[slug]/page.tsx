import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import LandingPageRenderer from './LandingPageRenderer'
import type { LandingPageConfig, WorkspaceProduct } from '@/lib/landing-types'

function publicDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const db = publicDb()
  const { data } = await db
    .from('landing_pages')
    .select('meta_title, meta_description, config')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single()

  if (!data) return { title: 'Not found' }

  const config = data.config as LandingPageConfig
  return {
    title:       data.meta_title || config.brand_name || 'Brand',
    description: data.meta_description || '',
    openGraph: {
      title:       data.meta_title || config.brand_name || '',
      description: data.meta_description || '',
      images:      config.product_images?.[0]
        ? [{ url: config.product_images[0] }]
        : [],
    },
  }
}

export default async function PublicLandingPage(
  { params }: { params: { slug: string } }
) {
  const db = publicDb()

  const { data: page } = await db
    .from('landing_pages')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single()

  if (!page) notFound()

  const config = page.config as LandingPageConfig

  // Fetch real product data if products section exists
  let products: WorkspaceProduct[] = []
  if (config.products?.product_ids?.length) {
    const { data: productData } = await db
      .from('workspace_products')
      .select('*')
      .in('id', config.products.product_ids)
      .eq('active', true)

    // Maintain the order from product_ids
    const productMap = new Map(
      (productData || []).map((p: any) => [p.id, p])
    )
    products = config.products.product_ids
      .map(id => productMap.get(id))
      .filter(Boolean) as WorkspaceProduct[]
  }

  // Track view (fire and forget)
  void db.rpc('increment_page_views', { page_id: page.id })

  return (
    <LandingPageRenderer
      page={page as any}
      products={products}
      isPreview={false}
    />
  )
}
