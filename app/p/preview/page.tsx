'use client'
import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import LandingPageRenderer from '../[slug]/LandingPageRenderer'
import type { WorkspaceProduct } from '@/lib/landing-types'

function PreviewContent() {
  const params   = useSearchParams()
  const wsId     = params.get('ws')
  const tick     = params.get('t')

  const [page,     setPage]     = useState<any>(null)
  const [products, setProducts] = useState<WorkspaceProduct[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!wsId) { setLoading(false); return }
    const supabase = createClient()

    supabase
      .from('landing_pages')
      .select('*')
      .eq('workspace_id', wsId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()
      .then(async ({ data: pageData }) => {
        if (!pageData) { setLoading(false); return }
        setPage(pageData)

        const config = pageData.config as any
        if (config?.products?.product_ids?.length) {
          const { data: pd } = await supabase
            .from('workspace_products')
            .select('*')
            .in('id', config.products.product_ids)
          setProducts((pd || []) as WorkspaceProduct[])
        }
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsId, tick])

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#0C0C0C',
      color: 'rgba(255,255,255,0.3)', fontFamily: 'system-ui', fontSize: 13,
    }}>
      Loading preview...
    </div>
  )

  if (!page) return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#0C0C0C', gap: 8,
    }}>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontFamily: 'system-ui' }}>
        No landing page yet
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', fontFamily: 'system-ui' }}>
        Generate one from the dashboard
      </div>
    </div>
  )

  const isPublished = page.status === 'published'

  return (
    <>
      {/* Preview banner */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        height: 32,
        background: isPublished
          ? 'rgba(34,197,94,0.92)'
          : 'rgba(245,158,11,0.92)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700,
        color: '#fff',
        letterSpacing: '0.08em', textTransform: 'uppercase',
        fontFamily: 'system-ui',
      }}>
        {isPublished ? '● LIVE — Published' : '○ Preview — Not Published'}
      </div>
      <div style={{ paddingTop: 32 }}>
        <LandingPageRenderer
          page={page}
          products={products}
          isPreview={true}
        />
      </div>
    </>
  )
}

export default function PreviewPage() {
  return (
    <Suspense fallback={
      <div style={{ background: '#0C0C0C', height: '100vh' }} />
    }>
      <PreviewContent />
    </Suspense>
  )
}
