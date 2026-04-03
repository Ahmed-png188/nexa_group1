'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

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
  'Create a lead capture page',
  'Make it premium and minimal',
]

const DS_OPTIONS = [
  { key: 'editorial',          label: 'Editorial' },
  { key: 'minimal_architect',  label: 'Minimal'   },
  { key: 'bold_expressionist', label: 'Bold'      },
  { key: 'warm_storyteller',   label: 'Warm'      },
]

type Msg = { role: 'user' | 'nexa'; content: string }

export default function LandingPageBuilderEn() {
  const [wsId,          setWsId]          = useState<string | null>(null)
  const [brandName,     setBrandName]     = useState<string>('')
  const [hasBrandBrain, setHasBrandBrain] = useState<boolean | null>(null)
  const [messages,      setMessages]      = useState<Msg[]>([])
  const [input,         setInput]         = useState('')
  const [generating,    setGenerating]    = useState(false)
  const [isSaving,      setIsSaving]      = useState(false)
  const [publishing,    setPublishing]    = useState(false)
  const [config,        setConfig]        = useState<any>(null)
  const [pageUrl,       setPageUrl]       = useState<string | null>(null)
  const [existingSlug,  setExistingSlug]  = useState<string | null>(null)
  const [forcedDs,      setForcedDs]      = useState<string | null>(null)
  const [history,       setHistory]       = useState<Msg[]>([])
  const [previewKey,    setPreviewKey]    = useState(0)
  const bottomRef   = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load workspace + brand info
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
        // Load workspace name + brand_profile
        const { data: ws } = await sb
          .from('workspaces')
          .select('name, brand_profile')
          .eq('id', wid)
          .maybeSingle()
        if (ws?.name) setBrandName(ws.name)
        setHasBrandBrain(!!ws?.brand_profile)
      })
  }, [])

  // Load existing page
  useEffect(() => {
    if (!wsId) return
    const sb = createClient()
    sb.from('landing_pages')
      .select('slug, status, config, conversation')
      .eq('workspace_id', wsId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return
        setConfig(data.config)
        setExistingSlug(data.slug)
        if (data.status === 'published') {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nexaa.cc'
          setPageUrl(`${appUrl}/p/${data.slug}`)
        }
        if (Array.isArray(data.conversation) && data.conversation.length > 0) {
          const conv = data.conversation as Msg[]
          setMessages(conv)
          setHistory(conv)
        }
      })
  }, [wsId])

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text?: string) {
    const userMsg = text || input.trim()
    if (!userMsg || generating || !wsId) return
    setInput('')

    const newMsg: Msg = { role: 'user', content: userMsg }
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

      // Brand Brain gate: needs more info
      if (data.needs_info) {
        const finalMsgs: Msg[] = [...nextMessages, { role: 'nexa', content: data.nexa_message }]
        setMessages(finalMsgs)
        setHistory(finalMsgs)
        return
      }

      const nexaMsg: Msg = { role: 'nexa', content: data.nexa_message }
      const finalMessages = [...nextMessages, nexaMsg]
      setMessages(finalMessages)
      setHistory(finalMessages)
      setConfig(data.config)

      // Auto-save as draft immediately
      setIsSaving(true)
      try {
        const saveRes = await fetch('/api/landing-page/save', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            workspace_id: wsId,
            config:       data.config,
            conversation: finalMessages,
            publish:      false,
          }),
        })
        const saveData = await saveRes.json()
        if (saveData.slug) {
          setExistingSlug(saveData.slug)
          setPreviewKey(k => k + 1)
        }
      } finally {
        setIsSaving(false)
      }
    } catch (err: any) {
      setMessages(m => [...m, {
        role: 'nexa' as const,
        content: `Something went wrong: ${err.message}. Try again.`,
      }])
    } finally {
      setGenerating(false)
    }
  }

  async function handleSaveDraft() {
    if (!wsId || !config) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/landing-page/save', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ workspace_id: wsId, config, conversation: messages, publish: false }),
      })
      const data = await res.json()
      if (data.slug) {
        setExistingSlug(data.slug)
        setPreviewKey(k => k + 1)
      }
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePublish() {
    if (!wsId || !config) return
    setPublishing(true)
    try {
      const res = await fetch('/api/landing-page/save', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ workspace_id: wsId, config, conversation: messages, publish: true }),
      })
      const data = await res.json()
      if (data.url) {
        setPageUrl(data.url)
        setExistingSlug(data.slug)
        setMessages(m => [...m, {
          role: 'nexa',
          content: `Your page is live at **${data.url}**\n\nShare it anywhere. It's public now.`,
        }])
      }
    } finally {
      setPublishing(false)
    }
  }

  const hasGenerated = config !== null
  const activeDs = forcedDs || config?.design_system || null

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      fontFamily: F, background: C.bg,
    }}>

      {/* ══════════════════════════════════════════
          LEFT: Chat panel — 380px
      ══════════════════════════════════════════ */}
      <div style={{
        width: 380, minWidth: 380, display: 'flex', flexDirection: 'column',
        borderRight: `1px solid ${C.border}`,
      }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{
            fontSize: 10, color: C.cyan, letterSpacing: '0.10em',
            textTransform: 'uppercase', fontWeight: 600, marginBottom: 4,
          }}>
            Landing Page
          </div>
          <div style={{
            fontSize: 18, color: C.t1, fontWeight: 700,
            letterSpacing: '-0.02em',
            marginBottom: (pageUrl || hasGenerated) ? 8 : 0,
          }}>
            {brandName || 'Your Brand'}
          </div>

          {pageUrl && (
            <a href={pageUrl} target="_blank" rel="noreferrer" style={{
              display: 'block', fontSize: 11, color: C.cyan,
              textDecoration: 'none', marginBottom: 8,
            }}>
              {pageUrl.replace('https://', '')} ↗
            </a>
          )}

          {hasGenerated && config?.design_system && (
            <span style={{
              display: 'inline-block',
              background: C.cyanD, border: `1px solid ${C.cyanB}`,
              color: C.cyan, fontSize: 11, padding: '3px 10px',
              borderRadius: 100, fontWeight: 500,
            }}>
              {DS_OPTIONS.find(d => d.key === config.design_system)?.label || config.design_system}
            </span>
          )}
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: 16,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>

          {/* Welcome state */}
          {messages.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 8 }}>
              <div style={{ textAlign: 'center', padding: '0 8px' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: C.cyanD, border: `1px solid ${C.cyanB}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke={C.cyan} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M3 9h18"/>
                    <path d="M9 21V9"/>
                  </svg>
                </div>
                <div style={{ fontSize: 15, color: C.t1, fontWeight: 600, marginBottom: 6 }}>
                  Build your landing page
                </div>
                <div style={{ fontSize: 12, color: C.t3, lineHeight: 1.6 }}>
                  Tell me what you want. Nexa reads your Brand Brain and builds.
                </div>
              </div>

              {/* 2×2 chip grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {QUICK_CHIPS.map(q => (
                  <button key={q} onClick={() => send(q)} style={{
                    background: C.surface, border: `1px solid ${C.border}`,
                    borderRadius: 10, padding: '10px 14px',
                    fontSize: 12, color: C.t2, cursor: 'pointer',
                    textAlign: 'left', lineHeight: 1.5, fontFamily: F,
                  }}>
                    {q}
                  </button>
                ))}
              </div>

              {/* Brand Brain status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.t3 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  background: hasBrandBrain === null
                    ? C.t4
                    : hasBrandBrain ? '#22c55e' : '#6b7280',
                }} />
                {hasBrandBrain === null
                  ? 'Checking Brand Brain…'
                  : hasBrandBrain
                    ? 'Brand Brain loaded'
                    : 'Brand Brain not set up — go to Brand settings for better results'}
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((m, i) => (
            <div key={i} style={{
              display:       'flex',
              flexDirection: 'column',
              alignItems:    m.role === 'user' ? 'flex-end' : 'flex-start',
            }}>
              {m.role === 'nexa' && (
                <div style={{
                  fontSize: 10, color: C.cyan, fontWeight: 600,
                  letterSpacing: '0.06em', marginBottom: 4,
                }}>
                  NEXA
                </div>
              )}
              <div style={{
                maxWidth:     m.role === 'user' ? '80%' : '90%',
                background:   m.role === 'user' ? C.over : 'transparent',
                border:       m.role === 'user' ? `1px solid ${C.border}` : 'none',
                borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : 0,
                padding:      m.role === 'user' ? '10px 14px' : 0,
                fontSize:     13,
                color:        m.role === 'user' ? C.t1 : C.t2,
                lineHeight:   1.7,
                whiteSpace:   'pre-wrap',
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
              <div style={{
                fontSize: 10, color: C.cyan, fontWeight: 600,
                letterSpacing: '0.06em', marginBottom: 6,
              }}>
                NEXA
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 5, height: 5, borderRadius: '50%', background: C.cyan,
                      animation: `lpdot 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 12, color: C.t3 }}>Building your page...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* DS switcher — shown after first generation */}
        {hasGenerated && (
          <div style={{
            padding: '10px 16px', borderTop: `1px solid ${C.border}`,
            display: 'flex', gap: 6,
          }}>
            {DS_OPTIONS.map(ds => {
              const active = activeDs === ds.key
              return (
                <button key={ds.key} onClick={() => {
                  setForcedDs(ds.key)
                  send(`Switch to the ${ds.label} design system`)
                }} style={{
                  background:   active ? C.cyanD : 'transparent',
                  border:       `1px solid ${active ? C.cyanB : C.border}`,
                  color:        active ? C.cyan : C.t3,
                  fontSize:     11, padding: '5px 12px', borderRadius: 100,
                  cursor:       'pointer', fontFamily: F,
                }}>
                  {ds.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Input */}
        <div style={{ padding: 16, borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, color: C.t4, marginBottom: 8, fontWeight: 500 }}>
            Brand Brain active
          </div>
          <div style={{ position: 'relative' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() }
              }}
              placeholder="Make the headline more direct…"
              rows={2}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 12, color: C.t1, fontSize: 13,
                padding: '12px 48px 12px 14px',
                resize: 'none', outline: 'none',
                fontFamily: F, lineHeight: 1.5,
                minHeight: 44, maxHeight: 120,
              }}
              onFocus={e  => { e.target.style.borderColor = 'rgba(0,170,255,0.35)' }}
              onBlur={e   => { e.target.style.borderColor = C.border }}
            />
            <button
              onClick={() => void send()}
              disabled={generating || !input.trim() || !wsId}
              style={{
                position:       'absolute', bottom: 10, right: 10,
                width:          32, height: 32, borderRadius: '50%',
                background:     (!generating && input.trim() && wsId) ? C.cyan : C.surface,
                border:         `1px solid ${C.border}`,
                display:        'flex', alignItems: 'center', justifyContent: 'center',
                cursor:         (!generating && input.trim() && wsId) ? 'pointer' : 'default',
                transition:     'background 0.15s',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          RIGHT: Preview panel
      ══════════════════════════════════════════ */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        background: C.bg, overflow: 'hidden',
      }}>

        {/* Top bar */}
        <div style={{
          height: 52, borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center',
          padding: '0 20px', gap: 16, flexShrink: 0,
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex', height: '100%', alignItems: 'flex-end', gap: 0,
          }}>
            <div style={{
              fontSize: 12, color: C.t1, fontWeight: 500, paddingBottom: 16,
              borderBottom: `2px solid ${C.cyan}`, paddingRight: 16,
            }}>
              Preview
            </div>
            <div style={{
              fontSize: 12, color: C.t3, paddingBottom: 16, paddingLeft: 0, paddingRight: 16,
              borderBottom: '2px solid transparent',
            }}>
              Code
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {isSaving && (
            <div style={{ fontSize: 11, color: C.t4 }}>Saving…</div>
          )}

          {/* Published URL chip */}
          {pageUrl && (
            <a href={pageUrl} target="_blank" rel="noreferrer" style={{
              background:     C.cyanD, border: `1px solid ${C.cyanB}`,
              color:          C.cyan, fontSize: 11,
              padding:        '4px 10px', borderRadius: 6,
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}>
              {pageUrl.replace('https://', '')} ↗
            </a>
          )}

          {/* Save Draft */}
          <button onClick={handleSaveDraft} disabled={isSaving || !config}
            style={{
              background:  C.surface, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: '7px 16px',
              color:        isSaving || !config ? C.t4 : C.t2,
              fontSize:     12, fontWeight: 500,
              cursor:       isSaving || !config ? 'default' : 'pointer',
              fontFamily:   F,
            }}>
            {isSaving ? 'Saving…' : 'Save Draft'}
          </button>

          {/* Publish */}
          <button onClick={handlePublish} disabled={publishing || !config}
            style={{
              background:   publishing || !config ? C.over : '#FFFFFF',
              border:       `1px solid ${publishing || !config ? C.border : 'transparent'}`,
              borderRadius: 8, padding: '7px 16px',
              color:        publishing || !config ? C.t4 : '#0C0C0C',
              fontSize:     12, fontWeight: 700,
              cursor:       publishing || !config ? 'default' : 'pointer',
              fontFamily:   F,
            }}>
            {publishing ? 'Publishing…' : 'Publish →'}
          </button>
        </div>

        {/* Preview area */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {!hasGenerated ? (
            <div style={{
              height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 10,
                background: C.surface, border: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke={C.t4} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18"/>
                  <path d="M9 21V9"/>
                </svg>
              </div>
              <div style={{ fontSize: 14, color: C.t3, fontWeight: 500 }}>
                Generate your first page
              </div>
              <div style={{ fontSize: 12, color: C.t4 }}>
                Type a request or pick a quick start from the chat.
              </div>
            </div>
          ) : wsId ? (
            <iframe
              key={previewKey}
              src={`/p/preview?ws=${wsId}&t=${previewKey}`}
              style={{
                width:           '133%',
                height:          '133%',
                transform:       'scale(0.75)',
                transformOrigin: 'top left',
                border:          'none',
                background:      C.bg,
                display:         'block',
              }}
            />
          ) : null}
        </div>
      </div>

      <style>{`
        @keyframes lpdot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.3; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
