import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import LandingPageRenderer from './LandingPageRenderer'
import type { LandingPageConfig } from '@/lib/landing-templates'

export const dynamic = 'force-dynamic'

function getService() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const service = getService()
  const { data } = await service
    .from('landing_pages')
    .select('title, config')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!data) return { title: 'Page not found' }

  const config = data.config as LandingPageConfig
  return {
    title:       config?.seo_title       || data.title,
    description: config?.seo_description || undefined,
  }
}

export default async function LandingPage({ params }: { params: { slug: string } }) {
  const service = getService()

  const { data: page } = await service
    .from('landing_pages')
    .select('id, title, config, workspace_id')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!page) notFound()

  // Increment view count
  await service.rpc('increment_page_views', { page_id: page.id })

  // Get workspace info for brand name fallback
  const { data: ws } = await service
    .from('workspaces')
    .select('brand_name, name')
    .eq('id', page.workspace_id)
    .maybeSingle()

  const brandName = ws?.brand_name || ws?.name || ''

  return (
    <LandingPageRenderer
      config={page.config as LandingPageConfig}
      workspaceId={page.workspace_id}
      brandName={brandName}
    />
  )
}
