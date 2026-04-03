export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import LandingPageRenderer from './LandingPageRenderer'

function anon() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const { data } = await anon()
    .from('landing_pages')
    .select('meta_title,meta_description,config')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!data) return { title: 'Page not found' }
  const cfg = (data.config as any) || {}
  return {
    title:       data.meta_title || cfg.brand_name || 'Brand',
    description: data.meta_description || cfg.meta_description || '',
    openGraph: {
      title:       data.meta_title || cfg.brand_name || '',
      description: data.meta_description || '',
    },
  }
}

export default async function Page({ params }: { params: { slug: string } }) {
  const { data: page } = await anon()
    .from('landing_pages')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!page) notFound()

  // Increment views (fire-and-forget)
  void Promise.resolve(
    anon().rpc('increment_page_views', { page_id: page.id })
  ).catch(() => {})

  return <LandingPageRenderer page={page as any} />
}
