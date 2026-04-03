'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import LandingPageRenderer from '../[slug]/LandingPageRenderer'

function PreviewInner() {
  const params = useSearchParams()
  const wsId   = params.get('ws')
  const [page, setPage]     = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!wsId) { setLoading(false); return }
    const sb = createClient()
    sb.from('landing_pages')
      .select('*')
      .eq('workspace_id', wsId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setPage(data)
        setLoading(false)
      })
  }, [wsId])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#0a0a0a',
        fontFamily: 'system-ui, sans-serif', color: '#666', fontSize: 14,
      }}>
        Loading preview…
      </div>
    )
  }

  if (!page) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#0a0a0a',
        fontFamily: 'system-ui, sans-serif', color: '#666', fontSize: 14,
        flexDirection: 'column', gap: 12,
      }}>
        <div style={{ fontSize: 32 }}>◻</div>
        <div>No landing page found for this workspace.</div>
        <div style={{ fontSize: 12, color: '#444' }}>Generate one from the dashboard first.</div>
      </div>
    )
  }

  return (
    <>
      {/* Preview banner */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        background: '#1a1a1a', borderBottom: '1px solid #333',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 40,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            background: '#f59e0b', color: '#000', fontSize: 10,
            fontWeight: 700, letterSpacing: '0.1em', padding: '2px 8px',
            borderRadius: 2,
          }}>
            PREVIEW
          </span>
          <span style={{ color: '#888', fontSize: 12 }}>
            {page.status === 'published'
              ? 'This page is published.'
              : 'This page is not published yet — only you can see this.'}
          </span>
        </div>
        <button
          onClick={() => window.close()}
          style={{
            background: 'none', border: '1px solid #333', color: '#888',
            fontSize: 12, padding: '4px 12px', borderRadius: 4, cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>

      {/* Offset for banner */}
      <div style={{ paddingTop: 40 }}>
        <LandingPageRenderer page={page} />
      </div>
    </>
  )
}

export default function PreviewPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#0a0a0a',
        fontFamily: 'system-ui, sans-serif', color: '#666', fontSize: 14,
      }}>
        Loading…
      </div>
    }>
      <PreviewInner />
    </Suspense>
  )
}
