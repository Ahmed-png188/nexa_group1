'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type ContentType = 'post' | 'thread' | 'email' | 'caption' | 'hook' | 'bio' | 'ad' | 'story'
type Platform = 'instagram' | 'linkedin' | 'x' | 'tiktok' | 'email' | 'general'
type ActiveTab = 'copy' | 'image' | 'video' | 'voice'

// ── Icons ────────────────────────────────────────────────────────────────
const Ic = {
  copy:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  image:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  video:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  voice:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  copy2:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  check:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  dl:      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  redo:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>,
  sched:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  animate: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  upload:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  spark:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
}

const CONTENT_TYPES = [
  { id: 'post' as ContentType,    label: 'Post',      cost: 3,  desc: 'Full social post' },
  { id: 'hook' as ContentType,    label: 'Hook',      cost: 2,  desc: 'Scroll-stopper opening line' },
  { id: 'thread' as ContentType,  label: 'Thread',    cost: 5,  desc: '5–7 tweet thread' },
  { id: 'caption' as ContentType, label: 'Caption',   cost: 2,  desc: 'Short visual caption' },
  { id: 'email' as ContentType,   label: 'Email',     cost: 5,  desc: 'Full email copy' },
  { id: 'story' as ContentType,   label: 'Story',     cost: 2,  desc: 'Story format' },
  { id: 'ad' as ContentType,      label: 'Ad Copy',   cost: 5,  desc: 'Headline + CTA' },
  { id: 'bio' as ContentType,     label: 'Bio',       cost: 2,  desc: 'Profile bio' },
]

const PLATFORMS = [
  { id: 'instagram' as Platform, label: 'Instagram' },
  { id: 'linkedin'  as Platform, label: 'LinkedIn' },
  { id: 'x'         as Platform, label: 'X' },
  { id: 'tiktok'    as Platform, label: 'TikTok' },
  { id: 'email'     as Platform, label: 'Email' },
  { id: 'general'   as Platform, label: 'General' },
]

const IMAGE_STYLES = [
  { id: 'photorealistic',                 label: 'Photorealistic' },
  { id: 'cinematic',                      label: 'Cinematic' },
  { id: 'minimal clean white background', label: 'Minimal' },
  { id: 'dark moody premium',             label: 'Dark & Premium' },
  { id: 'vibrant colorful',               label: 'Vibrant' },
  { id: 'flat design illustration',       label: 'Illustration' },
]

const ASPECT_RATIOS = [
  { id: '1:1',  label: '1:1',  desc: 'Square' },
  { id: '4:5',  label: '4:5',  desc: 'Portrait' },
  { id: '16:9', label: '16:9', desc: 'Wide' },
  { id: '9:16', label: '9:16', desc: 'Story' },
]

const VIDEO_STYLES = [
  { id: 'cinematic',              label: 'Cinematic' },
  { id: 'documentary',            label: 'Documentary' },
  { id: 'commercial brand',       label: 'Brand Ad' },
  { id: 'social media trending',  label: 'Social' },
  { id: 'minimalist aesthetic',   label: 'Minimal' },
  { id: 'dramatic moody',         label: 'Dramatic' },
]

const VIDEO_MODES = [
  { id: 'text',  label: 'Text to Video',  desc: 'Generate from a description' },
  { id: 'image', label: 'Image to Video', desc: 'Animate a still image' },
  { id: 'frame', label: 'Start → End',    desc: 'Control first and last frame' },
]

const VOICES = [
  { id: 'rachel', name: 'Rachel', desc: 'Warm · Female' },
  { id: 'drew',   name: 'Drew',   desc: 'Confident · Male' },
  { id: 'clyde',  name: 'Clyde',  desc: 'Expressive · Male' },
  { id: 'paul',   name: 'Paul',   desc: 'Authoritative · Male' },
  { id: 'domi',   name: 'Domi',   desc: 'Strong · Female' },
  { id: 'bella',  name: 'Bella',  desc: 'Soft · Female' },
  { id: 'Antoni', name: 'Antoni', desc: 'Natural · Male' },
  { id: 'elli',   name: 'Elli',   desc: 'Emotional · Female' },
]

// Brand-specific prompt angles — not generic, psychologically framed
const PROMPT_ANGLES = [
  'The belief that separates people who win from people who stay stuck',
  'What your audience is getting wrong about this industry',
  'The uncomfortable truth behind a common misconception',
  'Why doing less produces better results in your space',
  'The signal that separates amateurs from professionals',
  'What nobody talks about because it makes the wrong people uncomfortable',
]

export default function StudioPage() {
  const supabase = createClient()
  const [workspace, setWorkspace] = useState<any>(null)
  const [credits, setCredits] = useState(0)
  const [activeTab, setActiveTab] = useState<ActiveTab>('copy')
  const startFrameRef = useRef<HTMLInputElement>(null)
  const endFrameRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLInputElement>(null)

  // Copy
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

  // Image
  const [imagePrompt, setImagePrompt] = useState('')
  const [imageStyle, setImageStyle] = useState('photorealistic')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [generatingImage, setGeneratingImage] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  // Video
  const [videoPrompt, setVideoPrompt] = useState('')
  const [videoStyle, setVideoStyle] = useState('cinematic')
  const [videoDuration, setVideoDuration] = useState(5)
  const [videoAspect, setVideoAspect] = useState('16:9')
  const [videoMode, setVideoMode] = useState<'text' | 'image' | 'frame'>('text')
  const [videoImageUrl, setVideoImageUrl] = useState('')
  const [startFrameUrl, setStartFrameUrl] = useState('')
  const [endFrameUrl, setEndFrameUrl] = useState('')
  const [motionStrength, setMotionStrength] = useState(0.5)
  const [generatingVideo, setGeneratingVideo] = useState(false)
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [videoProgress, setVideoProgress] = useState(0)

  // Voice
  const [voiceText, setVoiceText] = useState('')
  const [selectedVoice, setSelectedVoice] = useState('rachel')
  const [stability, setStability] = useState(0.5)
  const [generatingVoice, setGeneratingVoice] = useState(false)
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null)
  const [voiceError, setVoiceError] = useState<string | null>(null)

  const [recentContent, setRecentContent] = useState<any[]>([])

  useEffect(() => { loadWorkspace() }, [])

  async function loadWorkspace() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: m } = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id', user.id).limit(1).single()
    const ws = (m as any)?.workspaces
    setWorkspace(ws)
    const { data: cr } = await supabase.from('credits').select('balance').eq('workspace_id', ws?.id).single()
    setCredits(cr?.balance ?? 0)
    loadRecentContent(ws?.id)
    supabase.channel('studio')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'content', filter: `workspace_id=eq.${ws?.id}` }, () => loadRecentContent(ws?.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credits', filter: `workspace_id=eq.${ws?.id}` }, (p: any) => { if (p.new?.balance !== undefined) setCredits(p.new.balance) })
      .subscribe()
  }

  async function loadRecentContent(workspaceId: string) {
    if (!workspaceId) return
    const { data } = await supabase.from('content').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(12)
    setRecentContent(data ?? [])
  }

  async function generateCopy() {
    if (!prompt.trim() || generating) return
    setGenerating(true); setResult(null); setError(null); setScheduled(false); setCopied(false)
    try {
      const res = await fetch('/api/generate-content', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspace?.id, type: contentType, platform, prompt: prompt.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(res.status === 402 ? data.message : (data.error ?? 'Generation failed')); return }
      setResult(data.content); setResultId(data.content_id); setCreditsUsed(data.credits_used)
    } catch { setError('Something went wrong. Try again.') }
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
      if (!res.ok) { setImageError(res.status === 402 ? data.message : (data.error ?? 'Generation failed')); return }
      setGeneratedImage(data.image_url)
    } catch { setImageError('Something went wrong.') }
    setGeneratingImage(false)
  }

  async function generateVideo() {
    if (!videoPrompt.trim() || generatingVideo) return
    setGeneratingVideo(true); setGeneratedVideo(null); setVideoError(null); setVideoProgress(0)
    const interval = setInterval(() => setVideoProgress(p => p < 88 ? +(p + Math.random() * 5).toFixed(1) : p), 4000)
    try {
      const body: any = { workspace_id: workspace?.id, prompt: videoPrompt.trim(), style: videoStyle, duration: videoDuration, aspect_ratio: videoAspect, motion_strength: motionStrength }
      if (videoMode === 'image' && videoImageUrl) body.image_url = videoImageUrl
      if (videoMode === 'frame') { body.start_frame_url = startFrameUrl; body.end_frame_url = endFrameUrl }
      const res = await fetch('/api/generate-video', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      clearInterval(interval)
      if (!res.ok) { setVideoError(res.status === 402 ? data.message : (data.error ?? 'Generation failed')); return }
      setVideoProgress(100); setGeneratedVideo(data.video_url)
    } catch { clearInterval(interval); setVideoError('Something went wrong.') }
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
      if (!res.ok) { setVoiceError(res.status === 402 ? data.message : (data.error ?? 'Generation failed')); return }
      setGeneratedAudio(data.audio_url)
    } catch { setVoiceError('Something went wrong.') }
    setGeneratingVoice(false)
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  async function scheduleContent() {
    if (!resultId) return
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(9, 0, 0, 0)
    await supabase.from('content').update({ status: 'scheduled', scheduled_for: tomorrow.toISOString() }).eq('id', resultId)
    setScheduled(true)
  }

  function handleFileUpload(file: File, setter: (url: string) => void) {
    const reader = new FileReader()
    reader.onload = e => setter(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const selectedType = CONTENT_TYPES.find(t => t.id === contentType)!

  const TABS = [
    { id: 'copy'  as ActiveTab, label: 'Copy',  icon: Ic.copy,  sub: 'Write' },
    { id: 'image' as ActiveTab, label: 'Image', icon: Ic.image, sub: '5 cr · Flux' },
    { id: 'video' as ActiveTab, label: 'Video', icon: Ic.video, sub: '20 cr · Kling' },
    { id: 'voice' as ActiveTab, label: 'Voice', icon: Ic.voice, sub: '8 cr · ElevenLabs' },
  ]

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse-dot { 0%,100% { opacity:1 } 50% { opacity:0.35 } }
        @keyframes fadeUp { from { opacity:0;transform:translateY(10px) } to { opacity:1;transform:translateY(0) } }
        @keyframes shimmer { 0% { background-position: -200% center } 100% { background-position: 200% center } }
        .studio-tab:hover { background: rgba(255,255,255,0.04) !important; color: rgba(240,237,232,0.8) !important }
        .pill:hover { border-color: rgba(0,170,255,0.3) !important; color: rgba(240,237,232,0.8) !important }
        .action-btn:hover { background: rgba(255,255,255,0.07) !important; border-color: rgba(255,255,255,0.18) !important; color: #F0EDE8 !important }
        .type-btn:hover { border-color: rgba(0,170,255,0.25) !important; background: rgba(0,170,255,0.04) !important }
        .recent-item:hover { background: rgba(255,255,255,0.05) !important; border-color: rgba(255,255,255,0.12) !important }
        .gen-btn { transition: all .2s }
        .gen-btn:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px) }
        .gen-btn:active:not(:disabled) { transform: translateY(0) }
        .result-area { animation: fadeUp 0.35s ease both }
        textarea:focus { border-color: rgba(0,170,255,0.4) !important; outline: none }
        input[type="range"] { accent-color: #00AAFF }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', height: 'calc(100vh - 52px)', overflow: 'hidden' }}>

        {/* ── LEFT: Studio canvas ── */}
        <div style={{ padding: '28px 32px', overflowY: 'auto', borderRight: '1px solid rgba(255,255,255,0.07)' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 800, letterSpacing: '-0.04em', color: '#F0EDE8', marginBottom: 3 }}>Studio</h1>
              <p style={{ fontSize: 12, color: 'rgba(240,237,232,0.35)' }}>
                {workspace?.brand_voice ? `Writing as: ${workspace.brand_voice.slice(0, 50)}...` : 'Your brand voice powers every generation'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(0,170,255,0.06)', border: '1px solid rgba(0,170,255,0.15)', borderRadius: 8 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00AAFF', animation: 'pulse-dot 2s infinite' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#00AAFF' }}>{credits.toLocaleString()}</span>
              <span style={{ fontSize: 11, color: 'rgba(0,170,255,0.6)' }}>credits</span>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 28 }}>
            {TABS.map(tab => (
              <button key={tab.id} className="studio-tab" onClick={() => setActiveTab(tab.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeTab === tab.id ? '#00AAFF' : 'transparent'}`, color: activeTab === tab.id ? '#F0EDE8' : 'rgba(240,237,232,0.38)', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400, fontFamily: 'var(--sans)', transition: 'all .15s', marginBottom: -1 }}>
                <span style={{ color: activeTab === tab.id ? '#00AAFF' : 'inherit', display: 'flex' }}>{tab.icon}</span>
                {tab.label}
                <span style={{ fontSize: 10, color: activeTab === tab.id ? 'rgba(0,170,255,0.6)' : 'rgba(240,237,232,0.2)', marginLeft: 2 }}>{tab.sub}</span>
              </button>
            ))}
          </div>

          {/* ── COPY TAB ── */}
          {activeTab === 'copy' && (
            <div style={{ maxWidth: 640 }}>
              {/* Format */}
              <div style={{ marginBottom: 20 }}>
                <label style={lbl}>Format</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {CONTENT_TYPES.map(type => (
                    <button key={type.id} className="type-btn" onClick={() => setContentType(type.id)}
                      style={{ padding: '10px 8px', borderRadius: 9, background: contentType === type.id ? 'rgba(0,170,255,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${contentType === type.id ? 'rgba(0,170,255,0.25)' : 'rgba(255,255,255,0.07)'}`, cursor: 'pointer', fontFamily: 'var(--sans)', textAlign: 'left', transition: 'all .15s' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: contentType === type.id ? '#00AAFF' : 'rgba(240,237,232,0.75)', marginBottom: 2 }}>{type.label}</div>
                      <div style={{ fontSize: 10, color: 'rgba(240,237,232,0.3)' }}>{type.cost} cr</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform */}
              <div style={{ marginBottom: 20 }}>
                <label style={lbl}>Platform</label>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {PLATFORMS.map(p => (
                    <button key={p.id} className="pill" onClick={() => setPlatform(p.id)}
                      style={{ padding: '5px 13px', borderRadius: 100, fontSize: 12, fontWeight: 600, background: platform === p.id ? 'rgba(0,170,255,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${platform === p.id ? 'rgba(0,170,255,0.25)' : 'rgba(255,255,255,0.08)'}`, color: platform === p.id ? '#00AAFF' : 'rgba(240,237,232,0.4)', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all .15s' }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ ...lbl, marginBottom: 0 }}>What should Nexa write?</label>
                  <span style={{ fontSize: 11, color: 'rgba(240,237,232,0.25)' }}>⌘+Enter to generate</span>
                </div>
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) generateCopy() }}
                  placeholder={`Describe the angle, idea, or topic.\n\nBe specific — "Why perfectionism is costing your audience engagement" performs better than "a tip about content."`}
                  rows={5} style={tArea} />
              </div>

              {/* Prompt angles */}
              <div style={{ marginBottom: 20, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {PROMPT_ANGLES.slice(0, 4).map((angle, i) => (
                  <button key={i} className="pill" onClick={() => setPrompt(angle)}
                    style={{ padding: '4px 11px', borderRadius: 100, fontSize: 11, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(240,237,232,0.4)', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all .15s' }}>
                    {angle.length > 48 ? angle.slice(0, 48) + '...' : angle}
                  </button>
                ))}
              </div>

              {/* Generate */}
              <button onClick={generateCopy} disabled={!prompt.trim() || generating} className="gen-btn"
                style={{ width: '100%', padding: '13px', fontSize: 14, fontWeight: 700, fontFamily: 'var(--display)', background: prompt.trim() ? '#00AAFF' : 'rgba(255,255,255,0.04)', color: prompt.trim() ? '#000' : 'rgba(240,237,232,0.25)', border: `1px solid ${prompt.trim() ? 'transparent' : 'rgba(255,255,255,0.07)'}`, borderRadius: 11, cursor: prompt.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, letterSpacing: '-0.01em' }}>
                {generating
                  ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.25)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Writing in your brand voice...</>
                  : <><span style={{ display: 'flex' }}>{Ic.spark}</span>Write {selectedType.label} · {selectedType.cost} credits</>
                }
              </button>

              {error && <ErrorCard message={error} />}

              {result && (
                <div className="result-area" style={{ marginTop: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00AAFF' }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(240,237,232,0.7)' }}>{selectedType.label} · {creditsUsed} cr used</span>
                    </div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <ActionBtn icon={copied ? Ic.check : Ic.copy2} label={copied ? 'Copied' : 'Copy'} active={copied} onClick={() => copyToClipboard(result!)} />
                      <ActionBtn icon={Ic.redo} label="Redo" onClick={generateCopy} />
                      <ActionBtn icon={Ic.voice} label="Narrate" onClick={() => { setVoiceText(result!); setActiveTab('voice') }} />
                      <ActionBtn icon={scheduled ? Ic.check : Ic.sched} label={scheduled ? 'Scheduled' : 'Schedule'} active={scheduled} onClick={scheduleContent} />
                    </div>
                  </div>
                  <div style={{ padding: '18px 20px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 14, color: '#F0EDE8', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{result}</div>
                </div>
              )}
            </div>
          )}

          {/* ── IMAGE TAB ── */}
          {activeTab === 'image' && (
            <div style={{ maxWidth: 640 }}>
              <ProviderBadge name="Flux" desc="Photorealistic brand imagery · ~15 seconds · 5 credits" />

              <div style={{ marginBottom: 20 }}>
                <label style={lbl}>Describe your image</label>
                <textarea value={imagePrompt} onChange={e => setImagePrompt(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) generateImage() }}
                  placeholder={`Be specific. "A focused founder at a dark oak desk, morning light through tall windows, premium editorial photography" generates far better than "a business person working".`}
                  rows={4} style={tArea} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>
                <div>
                  <label style={lbl}>Visual style</label>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {IMAGE_STYLES.map(s => (
                      <button key={s.id} className="pill" onClick={() => setImageStyle(s.id)}
                        style={{ padding: '5px 11px', borderRadius: 100, fontSize: 11.5, fontWeight: 600, background: imageStyle === s.id ? 'rgba(0,170,255,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${imageStyle === s.id ? 'rgba(0,170,255,0.25)' : 'rgba(255,255,255,0.07)'}`, color: imageStyle === s.id ? '#00AAFF' : 'rgba(240,237,232,0.4)', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all .15s' }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Format</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 5 }}>
                    {ASPECT_RATIOS.map(r => (
                      <button key={r.id} className="type-btn" onClick={() => setAspectRatio(r.id)}
                        style={{ padding: '8px 6px', borderRadius: 8, background: aspectRatio === r.id ? 'rgba(0,170,255,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${aspectRatio === r.id ? 'rgba(0,170,255,0.25)' : 'rgba(255,255,255,0.07)'}`, color: aspectRatio === r.id ? '#00AAFF' : 'rgba(240,237,232,0.45)', cursor: 'pointer', fontFamily: 'var(--sans)', textAlign: 'center', transition: 'all .15s' }}>
                        <div style={{ fontSize: 11, fontWeight: 700 }}>{r.label}</div>
                        <div style={{ fontSize: 10, opacity: 0.55 }}>{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <GenButton active={!!imagePrompt.trim()} loading={generatingImage} onClick={generateImage}
                label="Generate image · 5 credits" loadingLabel="Generating with Flux..." icon={Ic.image} />

              {imageError && <ErrorCard message={imageError} />}

              {generatedImage && (
                <div className="result-area" style={{ marginTop: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(240,237,232,0.7)' }}>Image · 5 cr used</span>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <ActionBtn icon={Ic.animate} label="Animate →" onClick={() => { setActiveTab('video'); setVideoMode('image'); setVideoImageUrl(generatedImage!) }} />
                      <a href={generatedImage} download={`nexa-${Date.now()}.jpg`} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(240,237,232,0.6)', textDecoration: 'none' }}>
                        {Ic.dl} Download
                      </a>
                      <ActionBtn icon={Ic.redo} label="Redo" onClick={generateImage} />
                    </div>
                  </div>
                  <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.09)' }}>
                    <img src={generatedImage} alt="Generated" style={{ width: '100%', display: 'block', maxHeight: 500, objectFit: 'cover' }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── VIDEO TAB ── */}
          {activeTab === 'video' && (
            <div style={{ maxWidth: 640 }}>
              <ProviderBadge name="Kling 3.0" desc="Cinematic video generation · 1–3 minutes to render · 20 credits" />

              <div style={{ marginBottom: 18 }}>
                <label style={lbl}>Mode</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                  {VIDEO_MODES.map(m => (
                    <button key={m.id} className="type-btn" onClick={() => setVideoMode(m.id as any)}
                      style={{ padding: '10px 8px', borderRadius: 9, background: videoMode === m.id ? 'rgba(0,170,255,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${videoMode === m.id ? 'rgba(0,170,255,0.25)' : 'rgba(255,255,255,0.07)'}`, cursor: 'pointer', fontFamily: 'var(--sans)', textAlign: 'left', transition: 'all .15s' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: videoMode === m.id ? '#00AAFF' : 'rgba(240,237,232,0.75)', marginBottom: 3 }}>{m.label}</div>
                      <div style={{ fontSize: 10, color: 'rgba(240,237,232,0.3)' }}>{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Image upload for image2video */}
              {videoMode === 'image' && (
                <div style={{ marginBottom: 18 }}>
                  <label style={lbl}>Source image</label>
                  {videoImageUrl ? (
                    <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(0,170,255,0.2)' }}>
                      <img src={videoImageUrl} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} />
                      <button onClick={() => setVideoImageUrl('')} style={{ position: 'absolute', top: 8, right: 8, padding: '4px 8px', borderRadius: 6, fontSize: 11, background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', cursor: 'pointer' }}>Remove</button>
                    </div>
                  ) : (
                    <div onClick={() => imageRef.current?.click()} style={{ padding: '24px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 10, textAlign: 'center', cursor: 'pointer', color: 'rgba(240,237,232,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      {Ic.upload}<span style={{ fontSize: 13 }}>Upload image to animate</span>
                      <input ref={imageRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], setVideoImageUrl)} />
                    </div>
                  )}
                </div>
              )}

              {/* Start + end frames */}
              {videoMode === 'frame' && (
                <div style={{ marginBottom: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Start frame', url: startFrameUrl, setter: setStartFrameUrl, ref: startFrameRef },
                    { label: 'End frame',   url: endFrameUrl,   setter: setEndFrameUrl,   ref: endFrameRef },
                  ].map(frame => (
                    <div key={frame.label}>
                      <label style={lbl}>{frame.label}</label>
                      {frame.url ? (
                        <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(0,170,255,0.2)' }}>
                          <img src={frame.url} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
                          <button onClick={() => frame.setter('')} style={{ position: 'absolute', top: 6, right: 6, padding: '3px 7px', borderRadius: 5, fontSize: 10, background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
                        </div>
                      ) : (
                        <div onClick={() => frame.ref.current?.click()} style={{ height: 120, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(240,237,232,0.3)', gap: 6, fontSize: 12 }}>
                          {Ic.upload} Upload
                          <input ref={frame.ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], frame.setter)} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginBottom: 18 }}>
                <label style={lbl}>Describe the scene</label>
                <textarea value={videoPrompt} onChange={e => setVideoPrompt(e.target.value)}
                  placeholder="A founder walking into a glass building at golden hour, confidence in every step, cinematic lens flare, premium brand feel..."
                  rows={4} style={tArea} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
                <div>
                  <label style={lbl}>Style</label>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {VIDEO_STYLES.map(s => (
                      <button key={s.id} className="pill" onClick={() => setVideoStyle(s.id)}
                        style={{ padding: '5px 11px', borderRadius: 100, fontSize: 11.5, fontWeight: 600, background: videoStyle === s.id ? 'rgba(0,170,255,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${videoStyle === s.id ? 'rgba(0,170,255,0.25)' : 'rgba(255,255,255,0.07)'}`, color: videoStyle === s.id ? '#00AAFF' : 'rgba(240,237,232,0.4)', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all .15s' }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Duration & format</label>
                  <div style={{ display: 'flex', gap: 5, marginBottom: 7 }}>
                    {[5, 10].map(d => (
                      <button key={d} className="pill" onClick={() => setVideoDuration(d)}
                        style={{ padding: '5px 14px', borderRadius: 100, fontSize: 12, fontWeight: 700, background: videoDuration === d ? 'rgba(0,170,255,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${videoDuration === d ? 'rgba(0,170,255,0.25)' : 'rgba(255,255,255,0.07)'}`, color: videoDuration === d ? '#00AAFF' : 'rgba(240,237,232,0.4)', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all .15s' }}>
                        {d}s
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {['16:9', '9:16', '1:1'].map(r => (
                      <button key={r} className="pill" onClick={() => setVideoAspect(r)}
                        style={{ padding: '5px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: videoAspect === r ? 'rgba(0,170,255,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${videoAspect === r ? 'rgba(0,170,255,0.25)' : 'rgba(255,255,255,0.07)'}`, color: videoAspect === r ? '#00AAFF' : 'rgba(240,237,232,0.4)', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all .15s' }}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                  <label style={{ ...lbl, marginBottom: 0 }}>Motion intensity</label>
                  <span style={{ fontSize: 11, color: 'rgba(240,237,232,0.35)' }}>{motionStrength < 0.35 ? 'Subtle' : motionStrength > 0.65 ? 'Dynamic' : 'Balanced'} · {Math.round(motionStrength * 100)}%</span>
                </div>
                <input type="range" min="0" max="1" step="0.05" value={motionStrength} onChange={e => setMotionStrength(parseFloat(e.target.value))} style={{ width: '100%' }} />
              </div>

              <GenButton active={!!videoPrompt.trim()} loading={generatingVideo} onClick={generateVideo}
                label="Generate video · 20 credits" loadingLabel="Kling is rendering your clip..." icon={Ic.video} />

              {generatingVideo && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11, color: 'rgba(240,237,232,0.35)' }}>
                    <span>Rendering takes 1–3 minutes. Sit tight.</span>
                    <span>{Math.round(videoProgress)}%</span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${videoProgress}%`, background: 'linear-gradient(90deg,rgba(0,110,255,0.9),#00AAFF)', borderRadius: 3, transition: 'width 1s ease' }} />
                  </div>
                </div>
              )}

              {videoError && <ErrorCard message={videoError} />}

              {generatedVideo && (
                <div className="result-area" style={{ marginTop: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(240,237,232,0.7)' }}>Video · 20 cr used</span>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <a href={generatedVideo} download={`nexa-${Date.now()}.mp4`} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(240,237,232,0.6)', textDecoration: 'none' }}>
                        {Ic.dl} Download
                      </a>
                      <ActionBtn icon={Ic.redo} label="Redo" onClick={generateVideo} />
                    </div>
                  </div>
                  <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.09)', background: '#000' }}>
                    <video src={generatedVideo} controls style={{ width: '100%', display: 'block', maxHeight: 440 }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── VOICE TAB ── */}
          {activeTab === 'voice' && (
            <div style={{ maxWidth: 640 }}>
              <ProviderBadge name="ElevenLabs" desc="Ultra-realistic AI voiceovers · 8 languages · 8 credits per generation" />

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ ...lbl, marginBottom: 0 }}>Script</label>
                  <span style={{ fontSize: 11, color: 'rgba(240,237,232,0.25)' }}>{voiceText.length}/5000</span>
                </div>
                <textarea value={voiceText} onChange={e => setVoiceText(e.target.value.slice(0, 5000))}
                  placeholder="Paste your script. Works best with copy generated in the Copy tab — it's already written in your brand voice."
                  rows={6} style={tArea} />
                {result && (
                  <button onClick={() => setVoiceText(result)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, background: 'rgba(0,170,255,0.07)', border: '1px solid rgba(0,170,255,0.18)', color: '#00AAFF', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                    {Ic.copy2} Use last generated copy
                  </button>
                )}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={lbl}>Voice</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
                  {VOICES.map(v => (
                    <button key={v.id} className="type-btn" onClick={() => setSelectedVoice(v.id)}
                      style={{ padding: '10px 8px', borderRadius: 9, background: selectedVoice === v.id ? 'rgba(0,170,255,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedVoice === v.id ? 'rgba(0,170,255,0.25)' : 'rgba(255,255,255,0.07)'}`, cursor: 'pointer', fontFamily: 'var(--sans)', textAlign: 'left', transition: 'all .15s' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: selectedVoice === v.id ? '#00AAFF' : 'rgba(240,237,232,0.75)', marginBottom: 2 }}>{v.name}</div>
                      <div style={{ fontSize: 10, color: 'rgba(240,237,232,0.3)' }}>{v.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                  <label style={{ ...lbl, marginBottom: 0 }}>Stability</label>
                  <span style={{ fontSize: 11, color: 'rgba(240,237,232,0.35)' }}>{stability < 0.4 ? 'Expressive' : stability > 0.7 ? 'Consistent' : 'Balanced'} · {Math.round(stability * 100)}%</span>
                </div>
                <input type="range" min="0" max="1" step="0.05" value={stability} onChange={e => setStability(parseFloat(e.target.value))} style={{ width: '100%' }} />
              </div>

              <GenButton active={!!voiceText.trim()} loading={generatingVoice} onClick={generateVoice}
                label="Generate voiceover · 8 credits" loadingLabel="Generating with ElevenLabs..." icon={Ic.voice} />

              {voiceError && <ErrorCard message={voiceError} />}

              {generatedAudio && (
                <div className="result-area" style={{ marginTop: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(240,237,232,0.7)' }}>Voiceover · 8 cr used</span>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <a href={generatedAudio} download={`nexa-voice-${Date.now()}.mp3`} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(240,237,232,0.6)', textDecoration: 'none' }}>
                        {Ic.dl} Download
                      </a>
                      <ActionBtn icon={Ic.redo} label="Redo" onClick={generateVoice} />
                    </div>
                  </div>
                  <div style={{ padding: '16px 18px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
                    <audio src={generatedAudio} controls style={{ width: '100%' }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT: Recent content ── */}
        <div style={{ overflowY: 'auto', padding: '24px 16px', background: 'rgba(8,8,12,0.6)', borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,237,232,0.28)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 14 }}>Recent · live</div>
          {recentContent.length > 0 ? recentContent.map(item => (
            <div key={item.id} className="recent-item"
              style={{ marginBottom: 7, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, overflow: 'hidden', cursor: 'pointer', transition: 'all .15s' }}
              onClick={() => {
                if (item.type === 'image' && item.image_url) { setActiveTab('image'); setGeneratedImage(item.image_url) }
                else if (item.type === 'video' && item.video_url) { setActiveTab('video'); setGeneratedVideo(item.video_url) }
                else if (item.type === 'voice' && item.voice_url) { setActiveTab('voice'); setGeneratedAudio(item.voice_url) }
                else if (item.body) { setActiveTab('copy'); setResult(item.body); setResultId(item.id) }
              }}
            >
              {item.image_url && <img src={item.image_url} alt="" style={{ width: '100%', height: 72, objectFit: 'cover', display: 'block' }} />}
              {item.type === 'video' && (
                <div style={{ width: '100%', height: 50, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00AAFF' }}>
                  {Ic.video}
                </div>
              )}
              {item.type === 'voice' && (
                <div style={{ width: '100%', height: 38, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  {[3, 5, 7, 5, 8, 5, 3, 6, 4].map((h, i) => (
                    <div key={i} style={{ width: 2, height: h * 2.5, background: '#00AAFF', borderRadius: 2, opacity: 0.7 }} />
                  ))}
                </div>
              )}
              <div style={{ padding: '9px 11px' }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: 'rgba(0,170,255,0.08)', border: '1px solid rgba(0,170,255,0.18)', color: '#00AAFF', textTransform: 'uppercase' }}>{item.type}</span>
                  {item.platform && <span style={{ fontSize: 9, color: 'rgba(240,237,232,0.3)' }}>{item.platform}</span>}
                  <span style={{ fontSize: 9, color: 'rgba(240,237,232,0.2)', marginLeft: 'auto' }}>{item.credits_used}cr</span>
                </div>
                {item.body && (
                  <div style={{ fontSize: 11, color: 'rgba(240,237,232,0.55)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {item.body}
                  </div>
                )}
              </div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '32px 12px', color: 'rgba(240,237,232,0.22)', fontSize: 12, lineHeight: 1.7 }}>
              Everything you create appears here automatically.
            </div>
          )}
        </div>

      </div>
    </>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────

function ProviderBadge({ name, desc }: { name: string; desc: string }) {
  return (
    <div style={{ marginBottom: 20, padding: '10px 14px', background: 'rgba(0,170,255,0.04)', border: '1px solid rgba(0,170,255,0.12)', borderRadius: 9, fontSize: 12, color: 'rgba(240,237,232,0.5)', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontWeight: 700, color: '#00AAFF' }}>{name}</span>
      <span style={{ color: 'rgba(255,255,255,0.12)' }}>·</span>
      {desc}
    </div>
  )
}

function GenButton({ active, loading, onClick, label, loadingLabel, icon }: { active: boolean; loading: boolean; onClick: () => void; label: string; loadingLabel: string; icon: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={!active || loading} className="gen-btn"
      style={{ width: '100%', padding: '13px', fontSize: 14, fontWeight: 700, fontFamily: 'var(--display)', background: active ? '#00AAFF' : 'rgba(255,255,255,0.04)', color: active ? '#000' : 'rgba(240,237,232,0.2)', border: `1px solid ${active ? 'transparent' : 'rgba(255,255,255,0.07)'}`, borderRadius: 11, cursor: active ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, letterSpacing: '-0.01em' }}>
      {loading
        ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.25)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />{loadingLabel}</>
        : <><span style={{ display: 'flex' }}>{icon}</span>{label}</>
      }
    </button>
  )
}

function ActionBtn({ icon, label, onClick, active = false }: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} className="action-btn"
      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 600, background: active ? 'rgba(0,170,255,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? 'rgba(0,170,255,0.2)' : 'rgba(255,255,255,0.09)'}`, color: active ? '#00AAFF' : 'rgba(240,237,232,0.55)', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all .15s' }}>
      <span style={{ display: 'flex' }}>{icon}</span>{label}
    </button>
  )
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(255,80,80,0.06)', border: '1px solid rgba(255,80,80,0.18)', borderRadius: 10, fontSize: 13, color: '#ff7070' }}>
      {message}
    </div>
  )
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(240,237,232,0.4)', marginBottom: 8, letterSpacing: '0.02em', textTransform: 'uppercase' }
const tArea: React.CSSProperties = { width: '100%', padding: '13px 14px', fontSize: 13.5, fontFamily: 'var(--sans)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 11, color: '#F0EDE8', outline: 'none', resize: 'vertical', lineHeight: 1.65, transition: 'border-color .18s', boxSizing: 'border-box' }
