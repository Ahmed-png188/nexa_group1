'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type ContentType = 'post' | 'thread' | 'email' | 'caption' | 'hook' | 'bio' | 'ad' | 'story'
type Platform = 'instagram' | 'linkedin' | 'x' | 'tiktok' | 'email' | 'general'
type ActiveTab = 'copy' | 'image'

const CONTENT_TYPES: { id: ContentType; label: string; cost: number; desc: string }[] = [
  { id: 'post',    label: 'Post',    cost: 3,  desc: 'Full social media post' },
  { id: 'hook',    label: 'Hook',    cost: 2,  desc: 'Scroll-stopping opener' },
  { id: 'thread',  label: 'Thread',  cost: 5,  desc: '5-7 tweet thread' },
  { id: 'caption', label: 'Caption', cost: 2,  desc: 'Short punchy caption' },
  { id: 'email',   label: 'Email',   cost: 5,  desc: 'Full email with subject' },
  { id: 'story',   label: 'Story',   cost: 2,  desc: 'Story-format post' },
  { id: 'ad',      label: 'Ad Copy', cost: 5,  desc: 'Headline + body + CTA' },
  { id: 'bio',     label: 'Bio',     cost: 2,  desc: 'Profile bio' },
]

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'linkedin',  label: 'LinkedIn' },
  { id: 'x',         label: 'X' },
  { id: 'tiktok',    label: 'TikTok' },
  { id: 'email',     label: 'Email' },
  { id: 'general',   label: 'General' },
]

const IMAGE_STYLES = [
  { id: 'photorealistic', label: 'Photo' },
  { id: 'cinematic', label: 'Cinematic' },
  { id: 'minimal clean white background', label: 'Minimal' },
  { id: 'dark moody premium', label: 'Dark & Premium' },
  { id: 'vibrant colorful', label: 'Vibrant' },
  { id: 'flat design illustration', label: 'Illustration' },
]

const ASPECT_RATIOS = [
  { id: '1:1',  label: '1:1',  desc: 'Square' },
  { id: '4:5',  label: '4:5',  desc: 'Portrait' },
  { id: '16:9', label: '16:9', desc: 'Landscape' },
  { id: '9:16', label: '9:16', desc: 'Story' },
]

const PROMPT_IDEAS = [
  "Why most brands fail at content marketing",
  "Share a contrarian take on social media",
  "The #1 mistake my customers make",
  "What nobody talks about in my industry",
  "The transformation my product creates",
  "Why I started this brand",
  "What makes us different from everyone else",
  "The future of my industry",
]

export default function StudioPage() {
  const supabase = createClient()
  const [workspace, setWorkspace] = useState<any>(null)
  const [credits, setCredits] = useState(0)
  const [activeTab, setActiveTab] = useState<ActiveTab>('copy')

  // Copy state
  const [contentType, setContentType] = useState<ContentType>('post')
  const [platform, setPlatform] = useState<Platform>('instagram')
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [resultId, setResultId] = useState<string | null>(null)
  const [creditsUsed, setCreditsUsed] = useState(0)
  const [copied, setCopied] = useState(false)
  const [scheduled, setScheduled] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Image state
  const [imagePrompt, setImagePrompt] = useState('')
  const [imageStyle, setImageStyle] = useState('photorealistic')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [generatingImage, setGeneratingImage] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  // Recent content with realtime
  const [recentContent, setRecentContent] = useState<any[]>([])

  useEffect(() => {
    loadWorkspace()
  }, [])

  async function loadWorkspace() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: m } = await supabase
      .from('workspace_members').select('workspace_id, workspaces(*)')
      .eq('user_id', user.id).limit(1).single()
    const ws = (m as any)?.workspaces
    setWorkspace(ws)

    const { data: cr } = await supabase.from('credits').select('balance').eq('workspace_id', ws?.id).single()
    setCredits(cr?.balance ?? 0)

    loadRecentContent(ws?.id)

    // ── REALTIME: subscribe to content changes ──
    const channel = supabase
      .channel('studio-content')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'content',
        filter: `workspace_id=eq.${ws?.id}`,
      }, () => {
        loadRecentContent(ws?.id)
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'credits',
        filter: `workspace_id=eq.${ws?.id}`,
      }, (payload: any) => {
        if (payload.new?.balance !== undefined) {
          setCredits(payload.new.balance)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }

  async function loadRecentContent(workspaceId: string) {
    if (!workspaceId) return
    const { data } = await supabase
      .from('content').select('*').eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false }).limit(10)
    setRecentContent(data ?? [])
  }

  async function generateCopy() {
    if (!prompt.trim() || generating) return
    setGenerating(true)
    setResult(null)
    setError(null)
    setScheduled(false)

    try {
      const res = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspace?.id,
          type: contentType,
          platform,
          prompt: prompt.trim(),
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(res.status === 402 ? data.message : (data.error ?? 'Generation failed.'))
        return
      }

      setResult(data.content)
      setResultId(data.content_id)
      setCreditsUsed(data.credits_used)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function generateImage() {
    if (!imagePrompt.trim() || generatingImage) return
    setGeneratingImage(true)
    setGeneratedImage(null)
    setImageError(null)

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspace?.id,
          prompt: imagePrompt.trim(),
          style: imageStyle,
          aspect_ratio: aspectRatio,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setImageError(res.status === 402 ? data.message : (data.error ?? 'Image generation failed.'))
        return
      }

      setGeneratedImage(data.image_url)
    } catch {
      setImageError('Something went wrong. Please try again.')
    } finally {
      setGeneratingImage(false)
    }
  }

  async function copyToClipboard() {
    if (!result) return
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function scheduleContent() {
    if (!resultId) return
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    await supabase.from('content').update({ status: 'scheduled', scheduled_for: tomorrow.toISOString() }).eq('id', resultId)
    setScheduled(true)
  }

  async function downloadImage() {
    if (!generatedImage) return
    const a = document.createElement('a')
    a.href = generatedImage
    a.download = `nexa-image-${Date.now()}.jpg`
    a.click()
  }

  const selectedType = CONTENT_TYPES.find(t => t.id === contentType)!

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', height: 'calc(100vh - var(--topbar-h))', overflow: 'hidden' }}>

      {/* ── Left: Generator ── */}
      <div style={{ padding: '24px 28px', overflowY: 'auto', borderRight: '1px solid var(--line)' }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 4 }}>Studio</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--t4)' }}>
            <span>Generate content in your brand voice</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--cyan)', fontWeight: 600 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--cyan)', animation: 'pulse-dot 2s ease-in-out infinite' }} />
              {credits.toLocaleString()} credits
            </span>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 10, padding: 3, gap: 3, marginBottom: 22, width: 'fit-content' }}>
          {[
            { id: 'copy' as ActiveTab, label: 'Copy', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
            { id: 'image' as ActiveTab, label: 'Image · 5 cr', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 8, border: 'none', background: activeTab === tab.id ? 'var(--glass2)' : 'transparent', color: activeTab === tab.id ? 'var(--t1)' : 'var(--t4)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--sans)', transition: 'all .15s' }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── COPY TAB ── */}
        {activeTab === 'copy' && (
          <>
            {/* Content type */}
            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Content type</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>
                {CONTENT_TYPES.map(type => (
                  <button key={type.id} onClick={() => setContentType(type.id)} style={{ padding: '10px 8px', borderRadius: 10, background: contentType === type.id ? 'rgba(0,170,255,0.08)' : 'var(--glass)', border: `1px solid ${contentType === type.id ? 'var(--cline2)' : 'var(--line2)'}`, cursor: 'pointer', transition: 'all .15s', fontFamily: 'var(--sans)', textAlign: 'left' as const }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: contentType === type.id ? 'var(--cyan)' : 'var(--t2)', marginBottom: 2 }}>{type.label}</div>
                    <div style={{ fontSize: 10, color: contentType === type.id ? 'rgba(0,170,255,0.7)' : 'var(--t5)' }}>{type.cost} cr</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Platform */}
            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Platform</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {PLATFORMS.map(p => (
                  <button key={p.id} onClick={() => setPlatform(p.id)} style={{ padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, background: platform === p.id ? 'rgba(0,170,255,0.08)' : 'var(--glass)', border: `1px solid ${platform === p.id ? 'var(--cline2)' : 'var(--line2)'}`, color: platform === p.id ? 'var(--cyan)' : 'var(--t4)', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all .15s' }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                <label style={{ ...lbl, marginBottom: 0 }}>What do you want to say?</label>
                <span style={{ fontSize: 11, color: 'var(--t5)' }}>{selectedType.desc}</span>
              </div>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) generateCopy() }}
                placeholder={`Tell Nexa what to write...\n\nExamples:\n• ${PROMPT_IDEAS[0]}\n• ${PROMPT_IDEAS[2]}`}
                rows={5} style={{ ...textareaStyle }}
                onFocus={e => (e.target.style.borderColor = 'var(--cline2)')}
                onBlur={e => (e.target.style.borderColor = 'var(--line2)')}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                <span style={{ fontSize: 11, color: 'var(--t5)' }}>⌘+Enter to generate</span>
                <span style={{ fontSize: 11, color: 'var(--t5)' }}>{selectedType.cost} credits</span>
              </div>
            </div>

            {/* Idea chips */}
            <div style={{ marginBottom: 18, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {PROMPT_IDEAS.slice(0, 4).map((idea, i) => (
                <button key={i} onClick={() => setPrompt(idea)} style={{ padding: '5px 11px', borderRadius: 100, fontSize: 11, fontWeight: 500, background: 'var(--glass)', border: '1px solid var(--line)', color: 'var(--t4)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                  {idea}
                </button>
              ))}
            </div>

            {/* Generate button */}
            <button onClick={generateCopy} disabled={!prompt.trim() || generating} style={{ width: '100%', padding: '13px', fontSize: 14, fontWeight: 700, fontFamily: 'var(--sans)', background: prompt.trim() ? 'var(--cyan)' : 'var(--glass)', color: prompt.trim() ? '#000' : 'var(--t5)', border: `1px solid ${prompt.trim() ? 'transparent' : 'var(--line2)'}`, borderRadius: 11, cursor: prompt.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {generating ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Generating...</> : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>Generate {selectedType.label} · {selectedType.cost} credits</>}
            </button>

            {error && <div style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(255,107,107,0.07)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 10, fontSize: 13, color: 'var(--red)' }}>{error}</div>}

            {/* Result */}
            {result && (
              <div style={{ marginTop: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--cyan)' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t2)' }}>Generated {selectedType.label}</span>
                    <span style={{ fontSize: 10, color: 'var(--t5)' }}>· {creditsUsed} cr</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={copyToClipboard} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, background: copied ? 'rgba(0,214,143,0.08)' : 'var(--glass)', border: `1px solid ${copied ? 'rgba(0,214,143,0.2)' : 'var(--line2)'}`, color: copied ? '#00d68f' : 'var(--t3)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                    <button onClick={generateCopy} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, background: 'var(--glass)', border: '1px solid var(--line2)', color: 'var(--t3)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>Redo</button>
                    <button onClick={scheduleContent} disabled={scheduled} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, background: scheduled ? 'rgba(0,170,255,0.08)' : 'var(--glass)', border: `1px solid ${scheduled ? 'var(--cline2)' : 'var(--line2)'}`, color: scheduled ? 'var(--cyan)' : 'var(--t3)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                      {scheduled ? '✓ Scheduled' : 'Schedule'}
                    </button>
                  </div>
                </div>
                <div style={{ padding: '16px', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--line2)', borderRadius: 12, fontSize: 13.5, color: 'var(--t1)', lineHeight: 1.75, whiteSpace: 'pre-wrap' as const }}>
                  {result}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── IMAGE TAB ── */}
        {activeTab === 'image' && (
          <>
            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Describe your image</label>
              <textarea value={imagePrompt} onChange={e => setImagePrompt(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) generateImage() }}
                placeholder="A confident entrepreneur working at a sleek dark desk, ambient lighting, premium brand photography..."
                rows={4} style={{ ...textareaStyle }}
                onFocus={e => (e.target.style.borderColor = 'var(--cline2)')}
                onBlur={e => (e.target.style.borderColor = 'var(--line2)')}
              />
            </div>

            {/* Style */}
            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Style</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {IMAGE_STYLES.map(s => (
                  <button key={s.id} onClick={() => setImageStyle(s.id)} style={{ padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, background: imageStyle === s.id ? 'rgba(0,170,255,0.08)' : 'var(--glass)', border: `1px solid ${imageStyle === s.id ? 'var(--cline2)' : 'var(--line2)'}`, color: imageStyle === s.id ? 'var(--cyan)' : 'var(--t4)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect ratio */}
            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Aspect ratio</label>
              <div style={{ display: 'flex', gap: 7 }}>
                {ASPECT_RATIOS.map(r => (
                  <button key={r.id} onClick={() => setAspectRatio(r.id)} style={{ flex: 1, padding: '10px 6px', borderRadius: 9, background: aspectRatio === r.id ? 'rgba(0,170,255,0.08)' : 'var(--glass)', border: `1px solid ${aspectRatio === r.id ? 'var(--cline2)' : 'var(--line2)'}`, color: aspectRatio === r.id ? 'var(--cyan)' : 'var(--t3)', cursor: 'pointer', fontFamily: 'var(--sans)', textAlign: 'center' as const }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{r.label}</div>
                    <div style={{ fontSize: 10, opacity: 0.6 }}>{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate image button */}
            <button onClick={generateImage} disabled={!imagePrompt.trim() || generatingImage} style={{ width: '100%', padding: '13px', fontSize: 14, fontWeight: 700, fontFamily: 'var(--sans)', background: imagePrompt.trim() ? 'var(--cyan)' : 'var(--glass)', color: imagePrompt.trim() ? '#000' : 'var(--t5)', border: `1px solid ${imagePrompt.trim() ? 'transparent' : 'var(--line2)'}`, borderRadius: 11, cursor: imagePrompt.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {generatingImage ? (
                <><div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Generating image... (~15 seconds)</>
              ) : (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>Generate image · 5 credits</>
              )}
            </button>

            {imageError && <div style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(255,107,107,0.07)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 10, fontSize: 13, color: 'var(--red)' }}>{imageError}</div>}

            {/* Generated image result */}
            {generatedImage && (
              <div style={{ marginTop: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00d68f' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t2)' }}>Generated image</span>
                    <span style={{ fontSize: 10, color: 'var(--t5)' }}>· 5 cr</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={downloadImage} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, background: 'var(--glass)', border: '1px solid var(--line2)', color: 'var(--t3)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>Download</button>
                    <button onClick={generateImage} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, background: 'var(--glass)', border: '1px solid var(--line2)', color: 'var(--t3)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>Regenerate</button>
                  </div>
                </div>
                <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line2)', background: 'rgba(0,0,0,0.3)' }}>
                  <img src={generatedImage} alt="Generated" style={{ width: '100%', display: 'block', maxHeight: 480, objectFit: 'cover' }} />
                </div>
              </div>
            )}

            {/* Loading skeleton */}
            {generatingImage && (
              <div style={{ marginTop: 18, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line2)', background: 'rgba(0,0,0,0.3)', aspectRatio: aspectRatio === '16:9' ? '16/9' : aspectRatio === '9:16' ? '9/16' : aspectRatio === '4:5' ? '4/5' : '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 40, height: 40, border: '3px solid var(--glass)', borderTopColor: 'var(--cyan)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                  <div style={{ fontSize: 12, color: 'var(--t4)' }}>Generating your image...</div>
                  <div style={{ fontSize: 11, color: 'var(--t5)', marginTop: 4 }}>This takes ~15 seconds with Flux</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Right: Recent content ── */}
      <div style={{ overflowY: 'auto', padding: '24px 20px', background: 'rgba(8,8,13,0.5)', borderLeft: '1px solid var(--line)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t4)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>
          Recent · auto-updates
        </div>

        {recentContent.length > 0 ? recentContent.map(item => (
          <div key={item.id} style={{ marginBottom: 8, background: 'var(--glass)', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', transition: 'border-color .15s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--line2)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--line)')}
            onClick={() => {
              if (item.type === 'image' && item.image_url) {
                setActiveTab('image'); setGeneratedImage(item.image_url)
              } else if (item.body) {
                setActiveTab('copy'); setResult(item.body); setResultId(item.id)
              }
            }}
          >
            {/* Image thumbnail */}
            {item.image_url && (
              <img src={item.image_url} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }} />
            )}
            <div style={{ padding: '9px 11px' }}>
              <div style={{ display: 'flex', gap: 5, marginBottom: 5 }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: 'var(--cglow2)', border: '1px solid var(--cline2)', color: 'var(--cyan)', textTransform: 'uppercase' as const }}>{item.type}</span>
                {item.platform !== 'general' && <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 3, background: 'var(--glass2)', border: '1px solid var(--line)', color: 'var(--t4)', textTransform: 'uppercase' as const }}>{item.platform}</span>}
                <span style={{ fontSize: 9, color: 'var(--t5)', marginLeft: 'auto' }}>{item.credits_used}cr</span>
              </div>
              {item.body && (
                <div style={{ fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                  {item.body}
                </div>
              )}
            </div>
          </div>
        )) : (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--t5)', fontSize: 12, lineHeight: 1.7 }}>
            Content you generate will appear here automatically.
          </div>
        )}
      </div>
    </div>
  )
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--t4)', marginBottom: 7, letterSpacing: '0.01em' }
const textareaStyle: React.CSSProperties = { width: '100%', padding: '13px 14px', fontSize: 13.5, fontFamily: 'var(--sans)', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12, color: 'var(--t1)', outline: 'none', resize: 'vertical' as const, lineHeight: 1.6, transition: 'border-color .18s' }
