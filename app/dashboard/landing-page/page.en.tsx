'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const QUICK_STARTS = [
  'Generate my landing page',
  'Build a page for my hero product',
  'Create a minimalist brand page',
  'Make a bold high-energy page',
  'Build a warm storytelling page',
]

const DS_OPTIONS = [
  { key: 'editorial',          label: 'Editorial',  desc: 'Refined · Playfair Display' },
  { key: 'minimal_architect',  label: 'Minimal',    desc: 'Clean · Cormorant' },
  { key: 'bold_expressionist', label: 'Bold',       desc: 'Loud · Bebas Neue' },
  { key: 'warm_storyteller',   label: 'Warm',       desc: 'Artisan · Lora' },
]

type Msg = { role: 'user' | 'nexa'; content: string }

export default function LandingPageBuilderEn() {
  const [wsId,       setWsId]       = useState<string | null>(null)
  const [messages,   setMessages]   = useState<Msg[]>([])
  const [input,      setInput]      = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [config,     setConfig]     = useState<any>(null)
  const [pageUrl,    setPageUrl]    = useState<string | null>(null)
  const [forcedDs,   setForcedDs]   = useState<string | null>(null)
  const [history,    setHistory]    = useState<Msg[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sb = createClient()
    sb.from('workspace_members')
      .select('workspace_id')
      .eq('role', 'owner')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.workspace_id) setWsId(data.workspace_id)
      })
  }, [])

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
        if (data.status === 'published') {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nexaa.cc'
          setPageUrl(`${appUrl}/p/${data.slug}`)
        }
        if (Array.isArray(data.conversation) && data.conversation.length > 0) {
          setMessages(data.conversation as Msg[])
          setHistory(data.conversation as Msg[])
        }
      })
  }, [wsId])

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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: wsId,
          conversation: userMsg,
          history,
          lang: 'en',
          design_system_override: forcedDs || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')

      const nexaMsg: Msg = { role: 'nexa', content: data.nexa_message }
      const finalMessages = [...nextMessages, nexaMsg]
      setMessages(finalMessages)
      setHistory(finalMessages)
      setConfig(data.config)

      await savePage(data.config, false, finalMessages)
    } catch (err: any) {
      setMessages(m => [...m, {
        role: 'nexa' as const,
        content: `Something went wrong: ${err.message}. Try again.`,
      }])
    } finally {
      setGenerating(false)
    }
  }

  async function savePage(cfg: any, publish: boolean, msgs?: Msg[]) {
    if (!wsId) return
    if (publish) setPublishing(true); else setSaving(true)
    try {
      const res = await fetch('/api/landing-page/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: wsId,
          config: cfg ?? config,
          conversation: msgs ?? messages,
          publish,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (publish && data.url) setPageUrl(data.url)
    } catch (err: any) {
      console.error('[save]', err.message)
    } finally {
      if (publish) setPublishing(false); else setSaving(false)
    }
  }

  const hasGenerated = config !== null

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: '#0a0a0a',
    }}>

      {/* Chat panel */}
      <div style={{
        width: 400, minWidth: 400, display: 'flex', flexDirection: 'column',
        borderRight: '1px solid #1e1e1e', background: '#0d0d0d',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 20px 14px', borderBottom: '1px solid #1a1a1a',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff',
          }}>N</div>
          <div>
            <div style={{ color: '#f5f5f5', fontSize: 14, fontWeight: 600 }}>
              Landing Page Builder
            </div>
            <div style={{ color: '#555', fontSize: 11, marginTop: 1 }}>
              Nexa Creative Director
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '20px 16px',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          {messages.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                background: '#141414', border: '1px solid #222',
                borderRadius: 12, padding: '16px 18px',
              }}>
                <div style={{ color: '#f5f5f5', fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}>
                  I'll build your landing page. I already know your brand — tell me what you want,
                  or just ask me to generate.
                </div>
                <div style={{ color: '#555', fontSize: 11 }}>
                  I pick the design system from your brand voice. You can override it anytime.
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {QUICK_STARTS.map(q => (
                  <button key={q} onClick={() => send(q)} style={{
                    background: '#111', border: '1px solid #2a2a2a',
                    color: '#999', fontSize: 12, padding: '7px 14px',
                    borderRadius: 100, cursor: 'pointer',
                  }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            }}>
              {m.role === 'nexa' && (
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: '#fff', marginRight: 8, marginTop: 2,
                }}>N</div>
              )}
              <div style={{
                maxWidth: '80%',
                background: m.role === 'user' ? '#1e1e2e' : '#141414',
                border: `1px solid ${m.role === 'user' ? '#2d2d4e' : '#1e1e1e'}`,
                borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '4px 12px 12px 12px',
                padding: '10px 14px',
                color: m.role === 'user' ? '#c7c7ff' : '#ccc',
                fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap',
              }}>
                {m.content.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                  part.startsWith('**') && part.endsWith('**')
                    ? <strong key={j} style={{ color: '#f5f5f5' }}>{part.slice(2, -2)}</strong>
                    : part
                )}
              </div>
            </div>
          ))}

          {generating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: '#fff',
              }}>N</div>
              <div style={{
                background: '#141414', border: '1px solid #1e1e1e',
                borderRadius: '4px 12px 12px 12px', padding: '12px 16px',
                display: 'flex', gap: 6, alignItems: 'center',
              }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: '50%', background: '#6366f1',
                    animation: `lp-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Design system switcher */}
        {hasGenerated && (
          <div style={{
            padding: '10px 16px', borderTop: '1px solid #1a1a1a',
            display: 'flex', gap: 6, flexWrap: 'wrap',
          }}>
            {DS_OPTIONS.map(ds => {
              const active = forcedDs === ds.key || (!forcedDs && config?.design_system === ds.key)
              return (
                <button key={ds.key} onClick={() => {
                  setForcedDs(ds.key)
                  send(`Switch to the ${ds.label} design system`)
                }} style={{
                  background: active ? '#1e1e2e' : 'transparent',
                  border: `1px solid ${active ? '#6366f1' : '#222'}`,
                  color: active ? '#a5b4fc' : '#555',
                  fontSize: 11, padding: '5px 12px', borderRadius: 100, cursor: 'pointer',
                }}>
                  {ds.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Input */}
        <div style={{
          padding: '12px 16px', borderTop: '1px solid #1a1a1a',
          display: 'flex', gap: 8, alignItems: 'flex-end',
        }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
            }}
            placeholder="Make the headline more direct…"
            rows={2}
            style={{
              flex: 1, background: '#111', border: '1px solid #222',
              borderRadius: 10, color: '#f5f5f5', fontSize: 13,
              padding: '10px 14px', resize: 'none', outline: 'none',
              fontFamily: 'inherit', lineHeight: 1.5,
            }}
          />
          <button
            onClick={() => send()}
            disabled={generating || !input.trim() || !wsId}
            style={{
              background: generating || !input.trim() || !wsId ? '#1a1a1a' : '#6366f1',
              border: 'none', borderRadius: 10, width: 40, height: 40, flexShrink: 0,
              color: generating || !input.trim() || !wsId ? '#444' : '#fff',
              cursor: generating || !input.trim() || !wsId ? 'default' : 'pointer',
              fontSize: 16,
            }}
          >
            ↑
          </button>
        </div>
      </div>

      {/* Info panel */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 40, background: '#0a0a0a',
      }}>
        {!hasGenerated ? (
          <div style={{ textAlign: 'center', maxWidth: 360 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              border: '1px solid #1e1e1e', margin: '0 auto 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
            }}>◻</div>
            <div style={{ color: '#333', fontSize: 13, lineHeight: 1.7 }}>
              Your landing page preview will appear here.<br />
              Start by typing a request or picking a quick start.
            </div>
          </div>
        ) : (
          <div style={{
            background: '#0d0d0d', border: '1px solid #1e1e1e',
            borderRadius: 16, padding: 28, maxWidth: 400, width: '100%',
          }}>
            {config?.design_system && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: '#444', fontSize: 11, marginBottom: 6, letterSpacing: '0.08em' }}>
                  DESIGN SYSTEM
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    background: '#1e1e2e', border: '1px solid #2d2d4e',
                    borderRadius: 8, padding: '5px 12px',
                    color: '#a5b4fc', fontSize: 13, fontWeight: 600,
                  }}>
                    {DS_OPTIONS.find(d => d.key === config.design_system)?.label || config.design_system}
                  </div>
                  <div style={{ color: '#444', fontSize: 12 }}>
                    {DS_OPTIONS.find(d => d.key === config.design_system)?.desc}
                  </div>
                </div>
              </div>
            )}

            {config?.accent && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: '#444', fontSize: 11, marginBottom: 6, letterSpacing: '0.08em' }}>
                  ACCENT
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 4,
                    background: config.accent, border: '1px solid #2a2a2a',
                  }} />
                  <div style={{ color: '#555', fontSize: 12, fontFamily: 'monospace' }}>
                    {config.accent}
                  </div>
                </div>
              </div>
            )}

            {pageUrl && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: '#444', fontSize: 11, marginBottom: 6, letterSpacing: '0.08em' }}>
                  LIVE PAGE
                </div>
                <a href={pageUrl} target="_blank" rel="noreferrer" style={{
                  color: '#6366f1', fontSize: 13, textDecoration: 'none',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {pageUrl} <span style={{ fontSize: 11 }}>↗</span>
                </a>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {wsId && (
                <a href={`/p/preview?ws=${wsId}`} target="_blank" rel="noreferrer" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: '#111', border: '1px solid #2a2a2a',
                  borderRadius: 10, padding: '10px 20px',
                  color: '#999', fontSize: 13, textDecoration: 'none',
                }}>
                  View Preview ↗
                </a>
              )}
              <button onClick={() => savePage(config, false)} disabled={saving || !config}
                style={{
                  background: '#111', border: '1px solid #2a2a2a', borderRadius: 10,
                  padding: '10px 20px', color: saving ? '#444' : '#888', fontSize: 13,
                  cursor: saving ? 'default' : 'pointer',
                }}>
                {saving ? 'Saving…' : 'Save Draft'}
              </button>
              <button onClick={() => savePage(config, true)} disabled={publishing || !config}
                style={{
                  background: '#1e1e2e', border: '1px solid #2d2d4e', borderRadius: 10,
                  padding: '10px 20px', color: publishing ? '#555' : '#a5b4fc',
                  fontSize: 13, fontWeight: 600, cursor: publishing ? 'default' : 'pointer',
                }}>
                {publishing ? 'Publishing…' : pageUrl ? 'Update Published Page' : 'Publish Page'}
              </button>
            </div>

            {pageUrl && (
              <div style={{ marginTop: 14, color: '#2a2a2a', fontSize: 11, textAlign: 'center' }}>
                Page is live and publicly accessible.
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes lp-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
