'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import LandingPageRenderer from '../[slug]/LandingPageRenderer'

function PreviewContent() {
  const params  = useSearchParams()
  const wsId    = params.get('ws')
  // 't' param is used as a cache-buster from the dashboard iframe
  const t       = params.get('t')
  const [page,    setPage]    = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!wsId) { setLoading(false); return }
    const supabase = createClient()
    supabase
      .from('landing_pages')
      .select('*')
      .eq('workspace_id', wsId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setPage(data)
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsId, t])

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#0C0C0C',
      color: 'rgba(255,255,255,0.3)', fontFamily: 'system-ui', fontSize: 13,
    }}>
      Loading...
    </div>
  )

  if (!page) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#0C0C0C',
      color: 'rgba(255,255,255,0.3)', fontFamily: 'system-ui', fontSize: 13,
      flexDirection: 'column', gap: 8,
    }}>
      <div>No page saved yet.</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>
        Generate and save a page from the dashboard first.
      </div>
    </div>
  )

  return (
    <div>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        height: 32, background: 'rgba(0,170,255,0.9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: '#fff',
        letterSpacing: '0.08em', textTransform: 'uppercase',
        fontFamily: 'system-ui, sans-serif',
      }}>
        Preview — {page.status === 'published' ? 'published' : 'not published'}
      </div>
      <div style={{ paddingTop: 32 }}>
        <LandingPageRenderer page={page} />
      </div>
    </div>
  )
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div style={{ background: '#0C0C0C', height: '100vh' }} />}>
      <PreviewContent />
    </Suspense>
  )
}
