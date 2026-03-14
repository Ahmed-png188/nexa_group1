'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type ContentType = 'post' | 'thread' | 'email' | 'caption' | 'hook' | 'bio' | 'ad' | 'story'
type Platform = 'instagram' | 'linkedin' | 'x' | 'tiktok' | 'email' | 'general'
type ActiveTab = 'copy' | 'image' | 'video' | 'voice'

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

const VIDEO_STYLES = [
  { id: 'cinematic', label: 'Cinematic' },
  { id: 'documentary', label: 'Documentary' },
  { id: 'commercial brand', label: 'Brand Ad' },
  { id: 'social media trending', label: 'Social' },
  { id: 'minimalist aesthetic', label: 'Minimal' },
  { id: 'dramatic moody', label: 'Dramatic' },
]

const VIDEO_DURATIONS = [
  { id: 5,  label: '5s' },
  { id: 10, label: '10s' },
]

const VOICES = [
  { id: 'rachel',  name: 'Rachel',  desc: 'Warm · Female' },
  { id: 'drew',    name: 'Drew',    desc: 'Confident · Male' },
  { id: 'clyde',   name: 'Clyde',   desc: 'Expressive · Male' },
  { id: 'paul',    name: 'Paul',    desc: 'Authoritative · Male' },
  { id: 'domi',    name: 'Domi',    desc: 'Strong · Female' },
  { id: 'bella',   name: 'Bella',   desc: 'Soft · Female' },
  { id: 'Antoni',  name: 'Antoni',  desc: 'Natural · Male' },
  { id: 'elli',    name: 'Elli',    desc: 'Emotional · Female' },
]

const PROMPT_IDEAS = [
  "Why most brands fail at content marketing",
  "Share a contrarian take on social media",
  "The #1 mistake my customers make",
  "What nobody talks about in my industry",
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

  // Video state
  const [videoPrompt, setVideoPrompt] = useState('')
  const [videoStyle, setVideoStyle] = useState('cinematic')
  const [videoDuration, setVideoDuration] = useState(5)
  const [videoAspect, setVideoAspect] = useState('16:9')
  const [generatingVideo, setGeneratingVideo] = useState(false)
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [videoProgress, setVideoProgress] = useState(0)

  // Voice state
  const [voiceText, setVoiceText] = useState('')
  const [selectedVoice, setSelectedVoice] = useState('rachel')
  const [stability, setStability] = useState(0.5)
  const [generatingVoice, setGeneratingVoice] = useState(false)
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null)
  const [voiceError, setVoiceError] = useState<string | null>(null)

  // Recent content
  const [recentContent, setRecentContent] = useState<any[]>([])

  useEffect(() => {
    loadWorkspace()
  }, [])

  async function loadWorkspace() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: m } = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id', user.id).limit(1).single()
    const ws = (m as any)?.workspaces
    setWorkspace(ws)
    const { data: cr } = await supabase.from('credits').select('balance').eq('workspace_id', ws?.id).single()
    setCredits(cr?.balance ?? 0)
    loadRecentContent(ws?.id)

    const channel = supabase.channel('studio-content')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'content', filter: `workspace_id=eq.${ws?.id}` }, () => loadRecentContent(ws?.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credits', filter: `workspace_id=eq.${ws?.id}` }, (payload: any) => {
        if (payload.new?.balance !== undefined) setCredits(payload.new.balance)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }

  async function loadRecentContent(workspaceId: string) {
    if (!workspaceId) return
    const { data } = await supabase.from('content').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(12)
    setRecentContent(data ?? [])
  }

  async function generateCopy() {
    if (!prompt.trim() || generating) return
    setGenerating(true); setResult(null); setError(null); setScheduled(false)
    try {
      const res = await fetch('/api/generate-content', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspace?.id, type: contentType, platform, prompt: prompt.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(res.status === 402 ? data.message : (data.error ?? 'Generation failed.')); return }
      setResult(data.content); setResultId(data.content_id); setCreditsUsed(data.credits_used)
    } catch { setError('Something went wrong. Please try again.') }
    setGenerating(false)
  }

  async function generateImage() {
    if (!imagePrompt.trim() || generatingImage) return
    setGeneratingImage(true); setGeneratedImage(null); setImageError(null)
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspace?.id, prompt: imagePrompt.trim(), style: imageStyle, aspect_ratio: aspectRatio }),
      })
      const data = await res.json()
      if (!res.ok) { setImageError(res.status === 402 ? data.message : (data.error ?? 'Image generation failed.')); return }
      setGeneratedImage(data.image_url)
    } catch { setImageError('Something went wrong. Please try again.') }
    setGeneratingImage(false)
  }

  async function generateVideo() {
    if (!videoPrompt.trim() || generatingVideo) return
    setGeneratingVideo(true); setGeneratedVideo(null); setVideoError(null); setVideoProgress(0)

    // Progress simulation while waiting
    const progressInterval = setInterval(() => {
      setVideoProgress(prev => prev < 85 ? prev + Math.random() * 8 : prev)
    }, 4000)

    try {
      const res = await fetch('/api/generate-video', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspace?.id, prompt: videoPrompt.trim(), style: videoStyle, duration: videoDuration, aspect_ratio: videoAspect }),
      })
      const data = await res.json()
      clearInterval(progressInterval)
      if (!res.ok) { setVideoError(res.status === 402 ? data.message : (data.error ?? 'Video generation failed.')); return }
      setVideoProgress(100)
      setGeneratedVideo(data.video_url)
    } catch {
      clearInterval(progressInterval)
      setVideoError('Something went wrong. Please try again.')
    }
    setGeneratingVideo(false)
  }

  async function generateVoice() {
    if (!voiceText.trim() || generatingVoice) return
    setGeneratingVoice(true); setGeneratedAudio(null); setVoiceError(null)
    try {
      const res = await fetch('/api/generate-voice', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspace?.id, text: voiceText.trim(), voice_id: selectedVoice, stability }),
      })
      const data = await res.json()
      if (!res.ok) { setVoiceError(res.status === 402 ? data.message : (data.error ?? 'Voice generation failed.')); return }
      setGeneratedAudio(data.audio_url)
    } catch { setVoiceError('Something went wrong. Please try again.') }
    setGeneratingVoice(false)
  }

  async function copyToClipboard() {
    if (!result) return
    await navigator.clipboard.writeText(result)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  async function scheduleContent() {
    if (!resultId) return
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(9, 0, 0, 0)
    await supabase.from('content').update({ status: 'scheduled', scheduled_for: tomorrow.toISOString() }).eq('id', resultId)
    setScheduled(true)
  }

  const selectedType = CONTENT_TYPES.find(t => t.id === contentType)!

  const TABS = [
    { id: 'copy'  as ActiveTab, label: 'Copy',       cost: null,   icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
    { id: 'image' as ActiveTab, label: 'Image · 5cr', cost: 5,     icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
    { id: 'video' as ActiveTab, label: 'Video · 20cr', cost: 20,   icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> },
    { id: 'voice' as ActiveTab, label: 'Voice · 8cr',  cost: 8,    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg> },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', height: 'calc(100vh - var(--topbar-h))', overflow: 'hidden' }}>

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
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 8, border: 'none', background: activeTab === tab.id ? 'var(--glass2)' : 'transparent', color: activeTab === tab.id ? 'var(--t1)' : 'var(--t4)', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--sans)', transition: 'all .15s' }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── COPY TAB ── */}
        {activeTab === 'copy' && (
          <>
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

            <div style={{ marginBottom: 18, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {PROMPT_IDEAS.map((idea, i) => (
                <button key={i} onClick={() => setPrompt(idea)} style={{ padding: '5px 11px', borderRadius: 100, fontSize: 11, fontWeight: 500, background: 'var(--glass)', border: '1px solid var(--line)', color: 'var(--t4)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                  {idea}
                </button>
              ))}
            </div>

            <button onClick={generateCopy} disabled={!prompt.trim() || generating} style={{ width: '100%', padding: '13px', fontSize: 14, fontWeight: 700, fontFamily: 'var(--sans)', background: prompt.trim() ? 'var(--cyan)' : 'var(--glass)', color: prompt.trim() ? '#000' : 'var(--t5)', border: `1px solid ${prompt.trim() ? 'transparent' : 'var(--line2)'}`, borderRadius: 11, cursor: prompt.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {generating ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Generating...</> : <>Generate {selectedType.label} · {selectedType.cost} credits</>}
            </button>

            {error && <div style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(255,107,107,0.07)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 10, fontSize: 13, color: 'var(--red)' }}>{error}</div>}

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
            <button onClick={generateImage} disabled={!imagePrompt.trim() || generatingImage} style={{ width: '100%', padding: '13px', fontSize: 14, fontWeight: 700, fontFamily: 'var(--sans)', background: imagePrompt.trim() ? 'var(--cyan)' : 'var(--glass)', color: imagePrompt.trim() ? '#000' : 'var(--t5)', border: `1px solid ${imagePrompt.trim() ? 'transparent' : 'var(--line2)'}`, borderRadius: 11, cursor: imagePrompt.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {generatingImage ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Generating image...</> : <>Generate image · 5 credits</>}
            </button>
            {imageError && <div style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(255,107,107,0.07)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 10, fontSize: 13, color: 'var(--red)' }}>{imageError}</div>}
            {generatedImage && (
              <div style={{ marginTop: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t2)' }}>Generated image · 5 cr</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { const a = document.createElement('a'); a.href = generatedImage; a.download = `nexa-image-${Date.now()}.jpg`; a.click() }} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, background: 'var(--glass)', border: '1px solid var(--line2)', color: 'var(--t3)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>Download</button>
                    <button onClick={generateImage} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, background: 'var(--glass)', border: '1px solid var(--line2)', color: 'var(--t3)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>Redo</button>
                  </div>
                </div>
                <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line2)' }}>
                  <img src={generatedImage} alt="Generated" style={{ width: '100%', display: 'block', maxHeight: 480, objectFit: 'cover' }} />
                </div>
              </div>
            )}
          </>
        )}

        {/* ── VIDEO TAB ── */}
        {activeTab === 'video' && (
          <>
            <div style={{ marginBottom: 18, padding: '12px 14px', background: 'rgba(0,170,255,0.04)', border: '1px solid var(--cline2)', borderRadius: 10, fontSize: 12, color: 'var(--t3)', lineHeight: 1.6 }}>
              <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>Kling 3.0</span> · Generates cinematic video clips from your prompt. Takes 1–3 minutes. 20 credits per clip.
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Describe your video</label>
              <textarea value={videoPrompt} onChange={e => setVideoPrompt(e.target.value)}
                placeholder="A sleek product reveal on a dark studio surface, slow cinematic push-in, professional brand video..."
                rows={4} style={{ ...textareaStyle }}
                onFocus={e => (e.target.style.borderColor = 'var(--cline2)')}
                onBlur={e => (e.target.style.borderColor = 'var(--line2)')}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Style</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {VIDEO_STYLES.map(s => (
                  <button key={s.id} onClick={() => setVideoStyle(s.id)} style={{ padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, background: videoStyle === s.id ? 'rgba(0,170,255,0.08)' : 'var(--glass)', border: `1px solid ${videoStyle === s.id ? 'var(--cline2)' : 'var(--line2)'}`, color: videoStyle === s.id ? 'var(--cyan)' : 'var(--t4)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
              <div>
                <label style={lbl}>Duration</label>
                <div style={{ display: 'flex', gap: 7 }}>
                  {VIDEO_DURATIONS.map(d => (
                    <button key={d.id} onClick={() => setVideoDuration(d.id)} style={{ flex: 1, padding: '10px', borderRadius: 9, background: videoDuration === d.id ? 'rgba(0,170,255,0.08)' : 'var(--glass)', border: `1px solid ${videoDuration === d.id ? 'var(--cline2)' : 'var(--line2)'}`, color: videoDuration === d.id ? 'var(--cyan)' : 'var(--t3)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 700 }}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={lbl}>Aspect ratio</label>
                <div style={{ display: 'flex', gap: 7 }}>
                  {[{ id: '16:9', label: '16:9' }, { id: '9:16', label: '9:16' }, { id: '1:1', label: '1:1' }].map(r => (
                    <button key={r.id} onClick={() => setVideoAspect(r.id)} style={{ flex: 1, padding: '10px', borderRadius: 9, background: videoAspect === r.id ? 'rgba(0,170,255,0.08)' : 'var(--glass)', border: `1px solid ${videoAspect === r.id ? 'var(--cline2)' : 'var(--line2)'}`, color: videoAspect === r.id ? 'var(--cyan)' : 'var(--t3)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 700 }}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={generateVideo} disabled={!videoPrompt.trim() || generatingVideo} style={{ width: '100%', padding: '13px', fontSize: 14, fontWeight: 700, fontFamily: 'var(--sans)', background: videoPrompt.trim() ? 'var(--cyan)' : 'var(--glass)', color: videoPrompt.trim() ? '#000' : 'var(--t5)', border: `1px solid ${videoPrompt.trim() ? 'transparent' : 'var(--line2)'}`, borderRadius: 11, cursor: videoPrompt.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {generatingVideo ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Generating video (~2 min)...</> : <>Generate video · 20 credits</>}
            </button>

            {generatingVideo && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--t4)', marginBottom: 6 }}>
                  <span>Kling is rendering your clip...</span>
                  <span>{Math.round(videoProgress)}%</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${videoProgress}%`, height: '100%', background: 'linear-gradient(90deg, rgba(0,110,255,0.8), var(--cyan))', borderRadius: 4, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            )}

            {videoError && <div style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(255,107,107,0.07)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 10, fontSize: 13, color: 'var(--red)' }}>{videoError}</div>}

            {generatedVideo && (
              <div style={{ marginTop: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t2)' }}>Generated video · 20 cr</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <a href={generatedVideo} download={`nexa-video-${Date.now()}.mp4`} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, background: 'var(--glass)', border: '1px solid var(--line2)', color: 'var(--t3)', cursor: 'pointer', fontFamily: 'var(--sans)', textDecoration: 'none' }}>Download</a>
                    <button onClick={generateVideo} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, background: 'var(--glass)', border: '1px solid var(--line2)', color: 'var(--t3)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>Redo</button>
                  </div>
                </div>
                <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line2)', background: 'rgba(0,0,0,0.3)' }}>
                  <video src={generatedVideo} controls style={{ width: '100%', display: 'block', maxHeight: 400 }} />
                </div>
              </div>
            )}
          </>
        )}

        {/* ── VOICE TAB ── */}
        {activeTab === 'voice' && (
          <>
            <div style={{ marginBottom: 18, padding: '12px 14px', background: 'rgba(0,170,255,0.04)', border: '1px solid var(--cline2)', borderRadius: 10, fontSize: 12, color: 'var(--t3)', lineHeight: 1.6 }}>
              <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>ElevenLabs</span> · Ultra-realistic AI voiceovers. Paste your script and choose a voice. 8 credits per generation.
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                <label style={{ ...lbl, marginBottom: 0 }}>Your script</label>
                <span style={{ fontSize: 11, color: 'var(--t5)' }}>{voiceText.length}/5000 chars</span>
              </div>
              <textarea value={voiceText} onChange={e => setVoiceText(e.target.value.slice(0, 5000))}
                placeholder="Paste your script here. Nexa will generate a professional voiceover in your chosen voice..."
                rows={6} style={{ ...textareaStyle }}
                onFocus={e => (e.target.style.borderColor = 'var(--cline2)')}
                onBlur={e => (e.target.style.borderColor = 'var(--line2)')}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Voice</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>
                {VOICES.map(v => (
                  <button key={v.id} onClick={() => setSelectedVoice(v.id)} style={{ padding: '10px 8px', borderRadius: 10, background: selectedVoice === v.id ? 'rgba(0,170,255,0.08)' : 'var(--glass)', border: `1px solid ${selectedVoice === v.id ? 'var(--cline2)' : 'var(--line2)'}`, cursor: 'pointer', fontFamily: 'var(--sans)', textAlign: 'left' as const, transition: 'all .15s' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: selectedVoice === v.id ? 'var(--cyan)' : 'var(--t2)', marginBottom: 2 }}>{v.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--t5)' }}>{v.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                <label style={{ ...lbl, marginBottom: 0 }}>Stability</label>
                <span style={{ fontSize: 11, color: 'var(--t4)' }}>{Math.round(stability * 100)}% — {stability < 0.4 ? 'More expressive' : stability > 0.7 ? 'More consistent' : 'Balanced'}</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" value={stability} onChange={e => setStability(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--cyan)' }} />
            </div>
            <button onClick={generateVoice} disabled={!voiceText.trim() || generatingVoice} style={{ width: '100%', padding: '13px', fontSize: 14, fontWeight: 700, fontFamily: 'var(--sans)', background: voiceText.trim() ? 'var(--cyan)' : 'var(--glass)', color: voiceText.trim() ? '#000' : 'var(--t5)', border: `1px solid ${voiceText.trim() ? 'transparent' : 'var(--line2)'}`, borderRadius: 11, cursor: voiceText.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {generatingVoice ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Generating voiceover...</> : <>Generate voiceover · 8 credits</>}
            </button>

            {voiceError && <div style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(255,107,107,0.07)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 10, fontSize: 13, color: 'var(--red)' }}>{voiceError}</div>}

            {generatedAudio && (
              <div style={{ marginTop: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t2)' }}>Generated voiceover · 8 cr</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <a href={generatedAudio} download={`nexa-voice-${Date.now()}.mp3`} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, background: 'var(--glass)', border: '1px solid var(--line2)', color: 'var(--t3)', cursor: 'pointer', fontFamily: 'var(--sans)', textDecoration: 'none' }}>Download</a>
                    <button onClick={generateVoice} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, background: 'var(--glass)', border: '1px solid var(--line2)', color: 'var(--t3)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>Redo</button>
                  </div>
                </div>
                <div style={{ padding: '16px', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--line2)', borderRadius: 12 }}>
                  <audio src={generatedAudio} controls style={{ width: '100%' }} />
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
              if (item.type === 'image' && item.image_url) { setActiveTab('image'); setGeneratedImage(item.image_url) }
              else if (item.type === 'video' && item.video_url) { setActiveTab('video'); setGeneratedVideo(item.video_url) }
              else if (item.type === 'voice' && item.voice_url) { setActiveTab('voice'); setGeneratedAudio(item.voice_url) }
              else if (item.body) { setActiveTab('copy'); setResult(item.body); setResultId(item.id) }
            }}
          >
            {item.image_url && <img src={item.image_url} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }} />}
            {item.type === 'video' && (
              <div style={{ width: '100%', height: 60, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--cyan)" stroke="none"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" fill="none" stroke="var(--cyan)" strokeWidth="1.5"/></svg>
              </div>
            )}
            {item.type === 'voice' && (
              <div style={{ width: '100%', height: 40, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                {[3,5,7,5,3,6,4,6,3].map((h, i) => <div key={i} style={{ width: 2, height: h * 3, background: 'var(--cyan)', borderRadius: 2, opacity: 0.7 }} />)}
              </div>
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
