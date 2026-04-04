'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import SectionEditor from './SectionEditor'

const C = {
  bg:      '#0C0C0C',
  surface: '#141414',
  over:    '#1A1A1A',
  border:  'rgba(255,255,255,0.10)',
  borderS: 'rgba(255,255,255,0.06)',
  cyan:    '#00AAFF',
  cyanD:   'rgba(0,170,255,0.12)',
  cyanB:   'rgba(0,170,255,0.22)',
  t1:      '#FFFFFF',
  t2:      'rgba(255,255,255,0.65)',
  t3:      'rgba(255,255,255,0.35)',
  t4:      'rgba(255,255,255,0.20)',
}
const F = "'Geist', -apple-system, sans-serif"

const QUICK_CHIPS = [
  'Generate my landing page',
  'Build a page for my hero product',
  'Make it premium and minimal',
  'Create a page that converts',
]

const DS_OPTIONS = [
  { key: 'editorial',          label: 'Editorial' },
  { key: 'minimal_architect',  label: 'Minimal'   },
  { key: 'bold_expressionist', label: 'Bold'      },
  { key: 'warm_storyteller',   label: 'Warm'      },
]

const ADD_SECTION_OPTIONS = [
  { type: 'testimonials', label: 'Testimonials',         desc: 'Add 3 customer reviews' },
  { type: 'gallery',      label: 'Photo Gallery',         desc: 'Showcase your product photos' },
  { type: 'features',     label: 'Features Grid',         desc: '4 key benefits or features' },
  { type: 'faq',          label: 'FAQ',                   desc: 'Answer common questions' },
  { type: 'ingredients',  label: 'Ingredients / Details', desc: 'What goes into your product' },
  { type: 'founder_note', label: 'Founder Note',          desc: 'Put a human face on the brand' },
  { type: 'cta_banner',   label: 'CTA Banner',            desc: 'Full-width conversion section' },
  { type: 'video',        label: 'Video Section',         desc: 'Embed YouTube or Vimeo' },
]

type Msg     = { role: 'user' | 'nexa'; content: string }
type TabType = 'preview' | 'sections'

export default function LandingPageBuilderEn() {
  const [wsId,            setWsId]            = useState<string | null>(null)
  const [brandName,       setBrandName]       = useState<string>('')
  const [hasBrandBrain,   setHasBrandBrain]   = useState<boolean | null>(null)
  const [hasLogo,         setHasLogo]         = useState(false)
  const [messages,        setMessages]        = useState<Msg[]>([])
  const [input,           setInput]           = useState('')
  const [generating,      setGenerating]      = useState(false)
  const [isSaving,        setIsSaving]        = useState(false)
  const [autoSaving,      setAutoSaving]      = useState(false)
  const [publishing,      setPublishing]      = useState(false)
  const [config,          setConfig]          = useState<any>(null)
  const [pageUrl,         setPageUrl]         = useState<string | null>(null)
  const [existingSlug,    setExistingSlug]    = useState<string | null>(null)
  const [isPublished,     setIsPublished]     = useState(false)
  const [forcedDs,        setForcedDs]        = useState<string | null>(null)
  const [history,         setHistory]         = useState<Msg[]>([])
  const [previewKey,      setPreviewKey]      = useState(0)
  const [activeTab,       setActiveTab]       = useState<TabType>('preview')
  const [uploading,       setUploading]       = useState(false)
  const [showSectionPicker,  setShowSectionPicker]  = useState(false)
  const [addingSectionType,  setAddingSectionType]  = useState<string | null>(null)
  const [sectionsOrder,      setSectionsOrder]      = useState<string[]>([])

  const bottomRef    = useRef<HTMLDivElement>(null)
  const textareaRef  = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const saveTimeout  = useRef<ReturnType<typeof setTimeout>>()

  // ── Load workspace + brand ─────────────────────────────────
  useEffect(() => {
    const sb = createClient()
    sb.from('workspace_members')
      .select('workspace_id')
      .eq('role', 'owner')
      .limit(1)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!data?.workspace_id) return
        const wid = data.workspace_id
        setWsId(wid)
        const [{ data: ws }, { data: logoAsset }] = await Promise.all([
          sb.from('workspaces').select('name, brand_name, brand_profile').eq('id', wid).maybeSingle(),
          sb.from('brand_assets').select('id').eq('workspace_id', wid).eq('type', 'logo').limit(1).maybeSingle(),
        ])
        setBrandName((ws as any)?.brand_name || (ws as any)?.name || '')
        setHasBrandBrain(!!(ws as any)?.brand_profile)
        setHasLogo(!!logoAsset)
      })
  }, [])

  // ── Load existing page ─────────────────────────────────────
  useEffect(() => {
    if (!wsId) return
    const sb = createClient()
    sb.from('landing_pages')
      .select('slug, status, config, conversation')
      .eq('workspace_id', wsId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return
        setConfig((data as any).config)
        setExistingSlug((data as any).slug)
        const pub = (data as any).status === 'published'
        setIsPublished(pub)
        if (pub) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nexaa.cc'
          setPageUrl(`${appUrl}/p/${(data as any).slug}`)
        }
        const order = (data as any).config?.sections_order || []
        setSectionsOrder(order)
        if (Array.isArray((data as any).conversation) && (data as any).conversation.length > 0) {
          const conv = (data as any).conversation as Msg[]
          setMessages(conv)
          setHistory(conv)
        }
      })
  }, [wsId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Debounced auto-save ────────────────────────────────────
  function debouncedSave(overrideConfig?: any) {
    clearTimeout(saveTimeout.current)
    setAutoSaving(true)
    saveTimeout.current = setTimeout(async () => {
      const cfg = overrideConfig || config
      if (!cfg || !wsId) { setAutoSaving(false); return }
      try {
        const res = await fetch('/api/landing-page/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspace_id: wsId, config: cfg, publish: isPublished }),
        })
        const d = await res.json()
        if (d.slug) { setExistingSlug(d.slug); setPreviewKey(k => k + 1) }
      } catch {} finally {
        setAutoSaving(false)
      }
    }, 1500)
  }

  function updateConfig(updates: any) {
    const updated = { ...config, ...updates }
    setConfig(updated)
    debouncedSave(updated)
  }

  // ── File upload ────────────────────────────────────────────
  async function handleFileUpload(file: File) {
    if (!wsId || uploading) return
    setUploading(true)
    const isLogo = file.name.toLowerCase().includes('logo')
    setMessages(m => [...m, { role: 'user', content: `Uploaded: ${file.name}` }])

    try {
      const sb   = createClient()
      const path = `${wsId}/uploads/${Date.now()}-${file.name}`
      const { data: up, error } = await sb.storage.from('brand-assets').upload(path, file)
      if (error || !up) throw new Error(error?.message || 'Upload failed')

      const { data: { publicUrl } } = sb.storage.from('brand-assets').getPublicUrl(up.path)
      await sb.from('brand_assets').insert({
        workspace_id: wsId,
        type:         isLogo ? 'logo' : 'product_photo',
        file_url:     publicUrl,
        file_name:    file.name,
        file_size:    file.size,
      })

      if (isLogo) {
        setHasLogo(true)
        if (config) {
          const updated = { ...config, logo_url: publicUrl }
          setConfig(updated)
          debouncedSave(updated)
        }
      }

      setMessages(m => [...m, {
        role: 'nexa',
        content: isLogo
          ? `Got your logo. Added it to your page nav and footer.${config ? ' Refresh the preview to see it.' : ''}`
          : `Got your product photo. Ask me to regenerate with your new images, or add it via the Sections tab.`,
      }])
    } catch (err: any) {
      setMessages(m => [...m, { role: 'nexa', content: `Upload failed: ${err.message}` }])
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── Send message ───────────────────────────────────────────
  async function send(text?: string) {
    const userMsg = text || input.trim()
    if (!userMsg || generating || !wsId) return
    setInput('')

    const newMsg: Msg  = { role: 'user', content: userMsg }
    const nextMessages = [...messages, newMsg]
    setMessages(nextMessages)
    setGenerating(true)

    try {
      const res = await fetch('/api/landing-page/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          workspace_id:           wsId,
          conversation:           userMsg,
          history,
          lang:                   'en',
          design_system_override: forcedDs || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')

      if (data.needs_info) {
        const finalMsgs: Msg[] = [...nextMessages, { role: 'nexa', content: data.nexa_message }]
        setMessages(finalMsgs)
        setHistory(finalMsgs)
        return
      }

      const nexaMsg: Msg     = { role: 'nexa', content: data.nexa_message || 'Your page is ready.' }
      const finalMessages    = [...nextMessages, nexaMsg]
      setMessages(finalMessages)
      setHistory(finalMessages)
      setConfig(data.config)

      // Auto-save immediately as draft
      setIsSaving(true)
      try {
        const saveRes = await fetch('/api/landing-page/save', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ workspace_id: wsId, config: data.config, conversation: finalMessages, publish: false }),
        })
        const saved = await saveRes.json()
        if (saved.slug) { setExistingSlug(saved.slug); setPreviewKey(k => k + 1) }
        if (data.config?.sections_order) setSectionsOrder(data.config.sections_order)
      } finally {
        setIsSaving(false)
      }
    } catch (err: any) {
      setMessages(m => [...m, { role: 'nexa' as const, content: `Something went wrong: ${err.message}. Try again.` }])
    } finally {
      setGenerating(false)
    }
  }

  // ── Save draft ─────────────────────────────────────────────
  async function handleSaveDraft() {
    if (!wsId || !config) return
    setIsSaving(true)
    try {
      const res  = await fetch('/api/landing-page/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ workspace_id: wsId, config, conversation: messages, publish: false }),
      })
      const data = await res.json()
      if (data.slug) { setExistingSlug(data.slug); setPreviewKey(k => k + 1) }
    } finally { setIsSaving(false) }
  }

  // ── Publish ────────────────────────────────────────────────
  async function handlePublish() {
    if (!wsId || !config) return
    setPublishing(true)
    try {
      const res  = await fetch('/api/landing-page/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ workspace_id: wsId, config, conversation: messages, publish: true }),
      })
      const data = await res.json()
      if (data.url) {
        setPageUrl(data.url)
        setExistingSlug(data.slug)
        setIsPublished(true)
        setPreviewKey(k => k + 1)
        setMessages(m => [...m, {
          role: 'nexa',
          content: `Your page is live at **${data.url}**\n\nShare this link anywhere. Changes you make will update the live page immediately.`,
        }])
      }
    } finally { setPublishing(false) }
  }

  // ── Section save (from SectionEditor) ─────────────────────
  async function handleSectionSave(cfg: any) {
    if (!wsId) return
    const res  = await fetch('/api/landing-page/save', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body:   JSON.stringify({ workspace_id: wsId, config: cfg, conversation: messages, publish: false }),
    })
    const data = await res.json()
    if (data.slug) { setExistingSlug(data.slug); setPreviewKey(k => k + 1) }
  }

  // ── Add section via AI ─────────────────────────────────────
  async function handleAddSection(type: string) {
    if (!wsId || !config) return
    setShowSectionPicker(false)
    setAddingSectionType(type)
    try {
      const res = await fetch('/api/landing-page/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          workspace_id:    wsId,
          conversation:    `Add a ${type} section to my page. Match the existing design system and brand voice. Current design system: ${config.design_system}.`,
          section_only:    type,
          existing_config: config,
          lang:            'en',
        }),
      })
      const data = await res.json()
      if (data.section_data) {
        const updated = {
          ...config,
          [type]:          data.section_data,
          sections_order:  [...(config.sections_order || sectionsOrder || []), type],
        }
        setConfig(updated)
        setSectionsOrder(updated.sections_order)
        debouncedSave(updated)
        setMessages(m => [...m, { role: 'nexa', content: `Added ${type} section to your page.` }])
      }
    } catch {
      setMessages(m => [...m, { role: 'nexa', content: 'Failed to add section. Try again.' }])
    } finally {
      setAddingSectionType(null)
    }
  }

  const hasGenerated = config !== null
  const activeDs     = forcedDs || config?.design_system || null

  const statusLine = (() => {
    const parts: string[] = []
    if (hasBrandBrain) parts.push('Brand Brain active')
    if (hasLogo)       parts.push('Logo loaded')
    return parts.join(' · ') || (hasBrandBrain === false ? 'No Brand Brain — results may be generic' : '')
  })()

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: F, background: C.bg }}>

      {/* ════════════════ LEFT: Chat panel ════════════════ */}
      <div style={{
        width: 380, minWidth: 380, display: 'flex', flexDirection: 'column',
        background: C.surface, borderRight: `1px solid ${C.border}`, overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', color: C.cyan, textTransform: 'uppercase', marginBottom: 4 }}>
            Landing Page
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.t1, letterSpacing: '-0.02em', marginBottom: pageUrl || hasGenerated ? 8 : 0 }}>
            {brandName || 'Your Brand'}
          </div>

          {pageUrl && (
            <a href={pageUrl} target="_blank" rel="noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, color: C.cyan, textDecoration: 'none', marginBottom: 8,
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18 2l4 4-10 10H8v-4L18 2z"/>
              </svg>
              {pageUrl.replace('https://', '')} ↗
            </a>
          )}

          {hasGenerated && config?.design_system && (
            <span style={{
              display: 'inline-block', background: C.cyanD, border: `1px solid ${C.cyanB}`,
              color: C.cyan, fontSize: 11, padding: '3px 10px', borderRadius: 100, fontWeight: 500,
            }}>
              {DS_OPTIONS.find(d => d.key === config.design_system)?.label || config.design_system}
            </span>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Welcome state */}
          {messages.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: C.cyanD, border: `1px solid ${C.cyanB}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18"/><path d="M9 21V9"/>
                </svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.t1, marginBottom: 6, textAlign: 'center' }}>
                Build your landing page
              </div>
              <div style={{ fontSize: 12, color: C.t3, textAlign: 'center', maxWidth: 240, lineHeight: 1.6, marginBottom: 24 }}>
                Tell me what you want. Nexa reads your Brand Brain and builds.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%' }}>
                {QUICK_CHIPS.map(q => (
                  <button key={q} onClick={() => send(q)} style={{
                    background: C.over, border: `1px solid ${C.border}`, borderRadius: 10,
                    padding: '10px 14px', fontSize: 12, color: C.t2, cursor: 'pointer',
                    textAlign: 'left', lineHeight: 1.4, fontFamily: F, transition: 'border 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.cyanB }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border }}>
                    {q}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 20, fontSize: 11, color: C.t3 }}>
                <div style={{
                  width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                  background: hasBrandBrain === null ? C.t4 : hasBrandBrain ? '#22c55e' : 'rgba(255,255,255,0.2)',
                }} />
                {hasBrandBrain === null ? 'Checking Brand Brain…'
                  : hasBrandBrain ? 'Brand Brain active'
                  : 'No Brand Brain — basic results'}
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {m.role === 'nexa' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <img src="/favicon.png" alt="" style={{ width: 20, height: 20, borderRadius: 5, objectFit: 'cover' }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: C.t4, letterSpacing: '0.06em' }}>Nexa</span>
                </div>
              )}
              <div style={{
                maxWidth: m.role === 'user' ? '80%' : '90%',
                background:   m.role === 'user' ? C.cyanD : 'transparent',
                border:       m.role === 'user' ? `1px solid ${C.cyanB}` : 'none',
                borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : 0,
                padding:      m.role === 'user' ? '10px 14px' : 0,
                paddingLeft:  m.role === 'nexa' ? 28 : undefined,
                fontSize: 13, color: m.role === 'user' ? C.t1 : C.t2,
                lineHeight: 1.75, whiteSpace: 'pre-wrap',
              }}>
                {m.content.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                  part.startsWith('**') && part.endsWith('**')
                    ? <strong key={j} style={{ color: C.t1, fontWeight: 600 }}>{part.slice(2, -2)}</strong>
                    : part
                )}
              </div>
            </div>
          ))}

          {/* Generating indicator */}
          {generating && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <img src="/favicon.png" alt="" style={{ width: 20, height: 20, borderRadius: 5 }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: C.t4, letterSpacing: '0.06em' }}>Nexa</span>
              </div>
              <div style={{ paddingLeft: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: C.cyan, animation: `lpdot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
                <span style={{ fontSize: 12, color: C.t3 }}>Building your page...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* DS switcher */}
        {hasGenerated && (
          <div style={{ padding: '10px 20px', borderTop: `1px solid ${C.borderS}`, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: C.t4, whiteSpace: 'nowrap', marginRight: 4 }}>Style:</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {DS_OPTIONS.map(ds => {
                const active = activeDs === ds.key
                return (
                  <button key={ds.key} onClick={() => {
                    setForcedDs(ds.key)
                    void send(`Rebuild this page with the ${ds.label} design system. Keep all existing copy and content exactly the same.`)
                  }} style={{
                    background: active ? C.cyanD : 'transparent',
                    border: `1px solid ${active ? C.cyanB : C.border}`,
                    color: active ? C.cyan : C.t3,
                    fontSize: 11, fontWeight: 500, padding: '4px 12px',
                    borderRadius: 100, cursor: 'pointer', fontFamily: F,
                  }}>
                    {ds.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Input area */}
        <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: hasBrandBrain ? '#22c55e' : C.t4 }} />
            <span style={{ fontSize: 10, color: C.t4 }}>{statusLine || 'Waiting for Brand Brain…'}</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) void handleFileUpload(file)
              e.target.value = ''
            }}
          />

          <div style={{ position: 'relative' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() } }}
              placeholder="Ask Nexa to build or update your page..."
              rows={2}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: C.over, border: `1px solid ${C.border}`,
                borderRadius: 12, color: C.t1, fontSize: 13,
                padding: '11px 80px 11px 14px',
                resize: 'none', outline: 'none', fontFamily: F, lineHeight: 1.5,
                minHeight: 44, maxHeight: 120,
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(0,170,255,0.35)' }}
              onBlur={e  => { e.target.style.borderColor = C.border }}
            />

            {/* Upload button */}
            <button
              title="Upload logo or product photo"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                position: 'absolute', bottom: 8, right: 42,
                width: 28, height: 28, borderRadius: '50%',
                background: C.surface, border: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: uploading ? 'default' : 'pointer',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.t3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
              </svg>
            </button>

            {/* Send button */}
            <button
              onClick={() => void send()}
              disabled={generating || !input.trim() || !wsId}
              style={{
                position: 'absolute', bottom: 8, right: 8,
                width: 28, height: 28, borderRadius: '50%',
                background: (!generating && input.trim() && wsId) ? C.cyan : C.over,
                border: `1px solid ${(!generating && input.trim() && wsId) ? 'transparent' : C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: (!generating && input.trim() && wsId) ? 'pointer' : 'default',
                transition: 'background 0.15s',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ════════════════ RIGHT: Preview / Sections ════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{
          height: 52, borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center',
          padding: '0 20px', flexShrink: 0,
        }}>
          {/* Tabs */}
          {(['preview', 'sections'] as TabType[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: 'none', border: 'none', fontFamily: F,
              fontSize: 13, cursor: 'pointer', padding: '0 16px',
              height: '100%', borderBottom: activeTab === tab ? `2px solid ${C.cyan}` : '2px solid transparent',
              color: activeTab === tab ? C.t1 : C.t3,
              fontWeight: activeTab === tab ? 500 : 400,
              textTransform: 'capitalize',
            }}>
              {tab}
            </button>
          ))}

          <div style={{ flex: 1 }} />

          {/* Status dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginRight: 12 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: autoSaving ? C.cyan : isPublished ? '#22c55e' : C.t4,
              animation: autoSaving ? 'lpdot 1.2s ease-in-out infinite' : 'none',
            }} />
            <span style={{ fontSize: 11, color: autoSaving ? C.cyan : isPublished ? '#22c55e' : C.t4 }}>
              {autoSaving ? 'Saving...' : isPublished ? 'Live' : 'Draft'}
            </span>
          </div>

          {/* Live URL chip */}
          {pageUrl && (
            <button onClick={() => window.open(pageUrl, '_blank')} style={{
              background: C.cyanD, border: `1px solid ${C.cyanB}`,
              color: C.cyan, fontSize: 11, padding: '4px 12px',
              borderRadius: 100, cursor: 'pointer', whiteSpace: 'nowrap',
              marginRight: 12, fontFamily: F,
            }}>
              {existingSlug ? `nexaa.cc/p/${existingSlug}` : 'View live'} ↗
            </button>
          )}

          {/* Save Draft */}
          <button onClick={handleSaveDraft} disabled={isSaving || !config} style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: '7px 16px', color: isSaving || !config ? C.t4 : C.t2,
            fontSize: 12, fontWeight: 500, cursor: isSaving || !config ? 'default' : 'pointer',
            fontFamily: F, marginRight: 8,
          }}>
            {isSaving ? 'Saving…' : 'Save Draft'}
          </button>

          {/* Publish / Update */}
          <button onClick={handlePublish} disabled={publishing || !config} style={{
            background: publishing || !config ? C.over : '#FFFFFF',
            border: `1px solid ${publishing || !config ? C.border : 'transparent'}`,
            borderRadius: 8, padding: '7px 16px',
            color: publishing || !config ? C.t4 : '#0C0C0C',
            fontSize: 12, fontWeight: 700,
            cursor: publishing || !config ? 'default' : 'pointer',
            fontFamily: F,
          }}>
            {publishing ? 'Publishing…' : isPublished ? 'Update →' : 'Publish →'}
          </button>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {activeTab === 'preview' ? (
            !hasGenerated ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: C.cyanD, border: `1px solid ${C.cyanB}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M3 9h18"/><path d="M9 21V9"/>
                  </svg>
                </div>
                <div style={{ fontSize: 14, color: C.t2, fontWeight: 500 }}>Generate your first landing page</div>
                <div style={{ fontSize: 12, color: C.t3 }}>Type a message on the left to get started.</div>
              </div>
            ) : wsId ? (
              existingSlug ? (
                <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                  <iframe
                    key={previewKey}
                    src={`/p/preview?ws=${wsId}&t=${previewKey}`}
                    style={{
                      width: '133.33%', height: '133.33%',
                      transform: 'scale(0.75)', transformOrigin: 'top left',
                      border: 'none', background: C.bg, display: 'block',
                    }}
                  />
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 12, color: C.t4 }}>Saving preview...</span>
                </div>
              )
            ) : null

          ) : (
            /* SECTIONS TAB */
            !hasGenerated ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 13, color: C.t4 }}>Generate a page first to edit sections.</div>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <SectionEditor
                    config={config}
                    wsId={wsId || ''}
                    lang="en"
                    onUpdate={newCfg => {
                      setConfig(newCfg)
                      if (newCfg.sections_order) setSectionsOrder(newCfg.sections_order)
                      debouncedSave(newCfg)
                    }}
                    onSave={handleSectionSave}
                  />
                </div>

                {/* Add section button */}
                <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.borderS}`, flexShrink: 0 }}>
                  {addingSectionType ? (
                    <div style={{ textAlign: 'center', fontSize: 12, color: C.t4, padding: '12px 0' }}>
                      Generating {addingSectionType} section...
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowSectionPicker(true)}
                      style={{
                        width: '100%', padding: '12px 16px',
                        background: C.cyanD, border: `1px dashed ${C.cyanB}`,
                        color: C.cyan, fontSize: 12, fontWeight: 600,
                        borderRadius: 10, cursor: 'pointer', fontFamily: F,
                      }}
                    >
                      + Add a section
                    </button>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Section picker modal */}
      {showSectionPicker && (
        <div
          onClick={() => setShowSectionPicker(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: 360, background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20, maxHeight: 480, overflowY: 'auto' }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, color: C.t1, marginBottom: 16 }}>Add a section</div>
            {ADD_SECTION_OPTIONS.map(opt => (
              <div
                key={opt.type}
                onClick={() => void handleAddSection(opt.type)}
                style={{
                  padding: '12px 14px', borderRadius: 10, border: `1px solid ${C.border}`,
                  marginBottom: 8, cursor: 'pointer', background: C.over,
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.cyanB }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{opt.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes lpdot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.3; }
          40%  { transform: translateY(-4px); opacity: 1; }
        }
        textarea::placeholder { color: ${C.t4}; }
      `}</style>
    </div>
  )
}
