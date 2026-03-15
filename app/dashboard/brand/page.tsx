'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type AssetType = 'logo' | 'sample_post' | 'product_photo' | 'brand_doc' | 'other'
type Tab = 'overview' | 'voice' | 'audience' | 'visual' | 'positioning' | 'assets'

// ── Icons (no emojis) ─────────────────────────────────────────────────────
const Ic = {
  brain:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9.5 2a2.5 2.5 0 0 1 5 0"/><path d="M9.5 22a2.5 2.5 0 0 0 5 0"/><path d="M14.5 2C17 2 19 4 19 6.5c0 2-1.5 3.5-3.5 4C17 11 19 12.5 19 15c0 2.5-2 4.5-4.5 4.5"/><path d="M9.5 2C7 2 5 4 5 6.5c0 2 1.5 3.5 3.5 4C7 11 5 12.5 5 15c0 2.5 2 4.5 4.5 4.5"/></svg>,
  voice:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  audience: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  visual:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/></svg>,
  position: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  assets:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  upload:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  file:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  image:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  trash:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  refresh:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  check:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  spark:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  save:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',    label: 'Overview',    icon: Ic.brain },
  { id: 'voice',       label: 'Voice',       icon: Ic.voice },
  { id: 'audience',    label: 'Audience',    icon: Ic.audience },
  { id: 'visual',      label: 'Visual',      icon: Ic.visual },
  { id: 'positioning', label: 'Positioning', icon: Ic.position },
  { id: 'assets',      label: 'Assets',      icon: Ic.assets },
]

const ASSET_TYPES: { id: AssetType; label: string; desc: string }[] = [
  { id: 'logo',          label: 'Logo',             desc: 'Your brand logo' },
  { id: 'brand_doc',     label: 'Brand Doc',        desc: 'PDF or brand guide' },
  { id: 'sample_post',   label: 'Content Sample',   desc: 'Posts that performed' },
  { id: 'product_photo', label: 'Product Photo',    desc: 'Visuals of your work' },
  { id: 'other',         label: 'Other',            desc: 'Anything brand-related' },
]

export default function BrandPage() {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [workspace, setWorkspace] = useState<any>(null)
  const [assets, setAssets] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadType, setUploadType] = useState<AssetType>('brand_doc')
  const [saved, setSaved] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [brandName, setBrandName] = useState('')
  const [brandTagline, setBrandTagline] = useState('')
  const [brandWebsite, setBrandWebsite] = useState('')
  const [brandVoice, setBrandVoice] = useState('')
  const [brandAudience, setBrandAudience] = useState('')
  const [brandTone, setBrandTone] = useState('')
  const [scores, setScores] = useState({ voice: 0, audience: 0, visual: 0 })

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (profile) {
      setTimeout(() => setScores({
        voice: profile.voice_match_score || 88,
        audience: profile.audience_fit_score || 85,
        visual: profile.visual_style_score || 91,
      }), 400)
    }
  }, [profile])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: m } = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id', user.id).limit(1).single()
    const ws = (m as any)?.workspaces
    setWorkspace(ws)
    setBrandName(ws?.brand_name || ws?.name || '')
    setBrandTagline(ws?.brand_tagline || '')
    setBrandWebsite(ws?.brand_website || '')
    setBrandVoice(ws?.brand_voice || '')
    setBrandAudience(ws?.brand_audience || '')
    setBrandTone(ws?.brand_tone || '')
    const { data: a } = await supabase.from('brand_assets').select('*').eq('workspace_id', ws?.id).order('created_at', { ascending: false })
    setAssets(a ?? [])
    const p = a?.find((x: any) => x.file_name === 'nexa_brand_intelligence.json')
    if (p?.analysis) setProfile(p.analysis)
    setLoading(false)
  }

  async function saveFields() {
    if (!workspace) return
    await supabase.from('workspaces').update({
      brand_name: brandName, brand_tagline: brandTagline, brand_website: brandWebsite,
      brand_voice: brandVoice, brand_audience: brandAudience, brand_tone: brandTone,
      updated_at: new Date().toISOString(),
    }).eq('id', workspace.id)
    setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  async function uploadFile(file: File) {
    if (!workspace) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${workspace.id}/brand/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('brand-assets').upload(path, file, { upsert: true })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('brand-assets').getPublicUrl(path)
      await supabase.from('brand_assets').insert({
        workspace_id: workspace.id, type: uploadType,
        file_url: urlData.publicUrl, file_name: file.name, file_size: file.size, ai_analyzed: false,
      })
      await load()
    } catch { console.error('Upload failed') }
    setUploading(false)
  }

  async function deleteAsset(id: string) {
    await supabase.from('brand_assets').delete().eq('id', id)
    setAssets(prev => prev.filter((a: any) => a.id !== id))
  }

  async function analyzeWithAI() {
    if (!workspace) return
    setAnalyzing(true)
    try {
      const res = await fetch('/api/analyze-brand', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspace.id }),
      })
      const data = await res.json()
      if (data.success) {
        setProfile(data.profile)
        if (data.profile.voice) setBrandVoice(data.profile.voice.primary_tone)
        if (data.profile.audience) setBrandAudience(data.profile.audience.primary)
        await load()
        setActiveTab('overview')
      }
    } catch { console.error('Analysis failed') }
    setAnalyzing(false)
  }

  const nonProfileAssets = assets.filter((a: any) => a.file_name !== 'nexa_brand_intelligence.json')
  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 32, height: 32, border: '1px solid rgba(0,170,255,0.3)', borderTop: '1px solid #00AAFF', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
      <span style={{ fontSize: 12, color: 'rgba(240,237,232,0.35)' }}>Loading brand intelligence...</span>
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse-dot { 0%,100% { opacity:1 } 50% { opacity:0.35 } }
        @keyframes fadeUp { from { opacity:0;transform:translateY(12px) } to { opacity:1;transform:translateY(0) } }
        @keyframes bar-fill { from { width: 0% } }
        .brand-tab-btn:hover { background: rgba(255,255,255,0.04) !important; color: rgba(240,237,232,0.7) !important; }
        .asset-card:hover { border-color: rgba(255,255,255,0.14) !important; background: rgba(255,255,255,0.05) !important; }
        .pill-btn:hover { border-color: rgba(0,170,255,0.3) !important; color: rgba(240,237,232,0.8) !important; }
        .score-bar { transition: width 1.2s cubic-bezier(0.34,1.56,0.64,1) }
        .info-card { animation: fadeUp 0.4s ease both }
      `}</style>

      <div style={{ padding: '32px 36px', maxWidth: 900, margin: '0 auto' }}>

        {/* ── PAGE HEADER ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,170,255,0.1)', border: '1px solid rgba(0,170,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00AAFF' }}>
                  {Ic.brain}
                </div>
                <div>
                  <h1 style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 800, letterSpacing: '-0.04em', color: '#F0EDE8', lineHeight: 1 }}>Brand Brain</h1>
                  <p style={{ fontSize: 12, color: 'rgba(240,237,232,0.35)', marginTop: 3 }}>
                    {workspace?.brand_name || 'Your brand'} · cognitive fingerprint
                  </p>
                </div>
              </div>
            </div>

            {/* Status + re-analyze */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {profile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(0,214,143,0.06)', border: '1px solid rgba(0,214,143,0.2)', borderRadius: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d68f', animation: 'pulse-dot 2s ease-in-out infinite' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#00d68f' }}>Intelligence active</span>
                </div>
              )}
              <button onClick={analyzeWithAI} disabled={analyzing}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: analyzing ? 'rgba(0,170,255,0.06)' : '#00AAFF', border: `1px solid ${analyzing ? 'rgba(0,170,255,0.2)' : 'transparent'}`, borderRadius: 9, fontSize: 12, fontWeight: 700, color: analyzing ? '#00AAFF' : '#000', cursor: analyzing ? 'default' : 'pointer', fontFamily: 'var(--sans)', transition: 'all .15s' }}>
                {analyzing
                  ? <><div style={{ width: 11, height: 11, border: '1.5px solid rgba(0,170,255,0.3)', borderTopColor: '#00AAFF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Analyzing...</>
                  : <>{Ic.refresh}{profile ? 'Re-analyze' : 'Build intelligence'}</>
                }
              </button>
            </div>
          </div>

          {/* Score bars — only show if profile exists */}
          {profile && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 20 }}>
              {[
                { label: 'Voice match',   val: scores.voice,    color: '#00AAFF' },
                { label: 'Audience fit',  val: scores.audience, color: 'rgba(0,214,143,0.9)' },
                { label: 'Visual style',  val: scores.visual,   color: 'rgba(255,184,0,0.9)' },
              ].map(s => (
                <div key={s.label} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: 'rgba(240,237,232,0.45)' }}>{s.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(240,237,232,0.8)' }}>{s.val}%</span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div className="score-bar" style={{ width: `${s.val}%`, height: '100%', background: s.color, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── TABS ── */}
        <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 28 }}>
          {TABS.map(t => (
            <button key={t.id} className="brand-tab-btn" onClick={() => setActiveTab(t.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeTab === t.id ? '#00AAFF' : 'transparent'}`, color: activeTab === t.id ? '#F0EDE8' : 'rgba(240,237,232,0.38)', cursor: 'pointer', fontSize: 12.5, fontWeight: activeTab === t.id ? 600 : 400, fontFamily: 'var(--sans)', transition: 'all .15s', marginBottom: -1 }}>
              <span style={{ color: activeTab === t.id ? '#00AAFF' : 'inherit', display: 'flex' }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="info-card">
            {profile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Brand promise */}
                {profile.positioning?.brand_promise && (
                  <div style={{ padding: '18px 20px', background: 'rgba(0,170,255,0.04)', border: '1px solid rgba(0,170,255,0.12)', borderRadius: 12, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(0,170,255,0.3),transparent)' }} />
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#00AAFF', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 8 }}>Brand promise</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#F0EDE8', lineHeight: 1.5, letterSpacing: '-0.02em' }}>{profile.positioning.brand_promise}</div>
                  </div>
                )}

                {/* 2-col grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <InfoCard label="Voice" value={profile.brand_voice || profile.voice?.primary_tone} />
                  <InfoCard label="Audience" value={profile.brand_audience || profile.audience?.primary} />
                  {profile.positioning?.unique_angle && <InfoCard label="Unique angle" value={profile.positioning.unique_angle} />}
                  {profile.voice?.writing_style && <InfoCard label="Writing style" value={profile.voice.writing_style} />}
                </div>

                {/* Content pillars */}
                {(profile.content_pillars || profile.content?.themes)?.length > 0 && (
                  <div style={{ padding: '16px 18px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
                    <div style={sectionLabel}>Content pillars</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                      {(profile.content_pillars || profile.content?.themes || []).map((p: string, i: number) => (
                        <span key={i} style={{ padding: '5px 12px', background: 'rgba(0,170,255,0.07)', border: '1px solid rgba(0,170,255,0.18)', borderRadius: 100, fontSize: 12, fontWeight: 600, color: '#00AAFF' }}>{p}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Generation instructions */}
                {profile.generation_instructions?.copy_prompt_prefix && (
                  <div style={{ padding: '16px 18px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                      <span style={{ color: '#00AAFF', display: 'flex' }}>{Ic.spark}</span>
                      <div style={sectionLabel}>Generation instructions active</div>
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00d68f', animation: 'pulse-dot 2s infinite' }} />
                        <span style={{ fontSize: 10, color: '#00d68f', fontWeight: 600 }}>Injected into every generation</span>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {['copy', 'image', 'video', 'voice'].map(type => {
                        const val = profile.generation_instructions?.[`${type}_prompt_prefix`]
                        if (!val) return null
                        return (
                          <div key={type} style={{ padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,237,232,0.35)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>{type}</div>
                            <div style={{ fontSize: 11, color: 'rgba(240,237,232,0.55)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{val}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                icon={Ic.brain}
                title="Your brand has no intelligence yet."
                desc="Give Nexa your brand assets and it will learn your voice, audience, visual style, and positioning. Every generation will then speak in your exact language."
                cta="Build intelligence"
                onCta={analyzeWithAI}
                loading={analyzing}
              />
            )}
          </div>
        )}

        {/* ── VOICE ── */}
        {activeTab === 'voice' && (
          <div className="info-card">
            {profile?.voice ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <InfoCard label="Primary tone" value={profile.voice.primary_tone} />
                  <InfoCard label="Writing style" value={profile.voice.writing_style} />
                  <InfoCard label="Sentence structure" value={profile.voice.sentence_structure} />
                  {profile.voice.emotional_triggers?.length > 0 && (
                    <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10 }}>
                      <div style={sectionLabel}>Emotional triggers</div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
                        {profile.voice.emotional_triggers.map((t: string, i: number) => <Tag key={i} label={t} />)}
                      </div>
                    </div>
                  )}
                </div>

                {profile.voice.vocabulary?.length > 0 && (
                  <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10 }}>
                    <div style={sectionLabel}>Brand vocabulary</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
                      {profile.voice.vocabulary.map((w: string, i: number) => <Tag key={i} label={w} />)}
                    </div>
                  </div>
                )}

                {profile.voice.forbidden?.length > 0 && (
                  <div style={{ padding: '14px 16px', background: 'rgba(255,60,60,0.04)', border: '1px solid rgba(255,60,60,0.12)', borderRadius: 10 }}>
                    <div style={{ ...sectionLabel, color: 'rgba(255,107,107,0.7)' }}>Never use</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
                      {profile.voice.forbidden.map((w: string, i: number) => (
                        <span key={i} style={{ padding: '4px 10px', background: 'rgba(255,80,80,0.07)', border: '1px solid rgba(255,80,80,0.18)', borderRadius: 100, fontSize: 12, color: '#ff7070' }}>{w}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ padding: '1px', background: 'rgba(255,255,255,0.06)', borderRadius: 12 }}>
                  <div style={{ background: '#0D0D14', borderRadius: 11, padding: '16px 18px' }}>
                    <div style={sectionLabel}>Edit voice manually</div>
                    <textarea value={brandVoice} onChange={e => setBrandVoice(e.target.value)} rows={3}
                      placeholder="Describe your brand's voice and tone..."
                      style={textArea} />
                    <SaveButton saved={saved} onClick={saveFields} />
                  </div>
                </div>
              </div>
            ) : <EmptyState icon={Ic.voice} title="Voice profile not yet built." desc="Run intelligence analysis to extract your exact brand voice — tone, vocabulary, sentence structure, and what to never say." cta="Build intelligence" onCta={analyzeWithAI} loading={analyzing} />}
          </div>
        )}

        {/* ── AUDIENCE ── */}
        {activeTab === 'audience' && (
          <div className="info-card">
            {profile?.audience ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <InfoCard label="Who they are" value={profile.audience.primary} />
                  <InfoCard label="Psychology" value={profile.audience.psychology} />
                  <InfoCard label="How they speak" value={profile.audience.language} />
                </div>
                {profile.audience.pain_points?.length > 0 && (
                  <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10 }}>
                    <div style={sectionLabel}>Pain points</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                      {profile.audience.pain_points.map((p: string, i: number) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'rgba(240,237,232,0.65)' }}>
                          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#00AAFF', flexShrink: 0, marginTop: 7 }} />{p}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {profile.audience.desires?.length > 0 && (
                  <div style={{ padding: '14px 16px', background: 'rgba(0,214,143,0.03)', border: '1px solid rgba(0,214,143,0.1)', borderRadius: 10 }}>
                    <div style={{ ...sectionLabel, color: 'rgba(0,214,143,0.7)' }}>What they want</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                      {profile.audience.desires.map((d: string, i: number) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'rgba(240,237,232,0.65)' }}>
                          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#00d68f', flexShrink: 0, marginTop: 7 }} />{d}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ padding: '1px', background: 'rgba(255,255,255,0.06)', borderRadius: 12 }}>
                  <div style={{ background: '#0D0D14', borderRadius: 11, padding: '16px 18px' }}>
                    <div style={sectionLabel}>Edit audience manually</div>
                    <textarea value={brandAudience} onChange={e => setBrandAudience(e.target.value)} rows={4}
                      placeholder="Who is your ideal audience? Be specific." style={textArea} />
                    <SaveButton saved={saved} onClick={saveFields} />
                  </div>
                </div>
              </div>
            ) : <EmptyState icon={Ic.audience} title="Audience map not yet built." desc="Nexa will map your audience psychology — who they are, what drives them, their pain points and desires." cta="Build intelligence" onCta={analyzeWithAI} loading={analyzing} />}
          </div>
        )}

        {/* ── VISUAL ── */}
        {activeTab === 'visual' && (
          <div className="info-card">
            {profile?.visual ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <InfoCard label="Aesthetic" value={profile.visual.aesthetic} />
                <InfoCard label="Photography style" value={profile.visual.photography_style} />
                <InfoCard label="Color mood" value={profile.visual.color_mood} />
                <InfoCard label="Composition" value={profile.visual.composition} />
                {profile.visual.video_style && <InfoCard label="Video style" value={profile.visual.video_style} span2={false} />}
              </div>
            ) : <EmptyState icon={Ic.visual} title="Visual identity not yet extracted." desc="Upload logos, product photos, or visual samples and run intelligence analysis. Nexa will inject your visual style into every image and video generation." cta="Build intelligence" onCta={analyzeWithAI} loading={analyzing} />}
          </div>
        )}

        {/* ── POSITIONING ── */}
        {activeTab === 'positioning' && (
          <div className="info-card">
            {profile?.positioning ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {profile.positioning.brand_promise && (
                  <div style={{ padding: '18px 20px', background: 'rgba(0,170,255,0.04)', border: '1px solid rgba(0,170,255,0.12)', borderRadius: 12, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(0,170,255,0.3),transparent)' }} />
                    <div style={sectionLabel}>Brand promise</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#F0EDE8', lineHeight: 1.5, marginTop: 8, letterSpacing: '-0.02em' }}>{profile.positioning.brand_promise}</div>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <InfoCard label="Unique angle" value={profile.positioning.unique_angle} />
                  <InfoCard label="Competitor contrast" value={profile.positioning.competitor_contrast} />
                </div>
                {profile.positioning.authority_signals?.length > 0 && (
                  <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10 }}>
                    <div style={sectionLabel}>Authority signals</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                      {profile.positioning.authority_signals.map((s: string, i: number) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'rgba(240,237,232,0.65)' }}>
                          <div style={{ color: '#00AAFF', display: 'flex', flexShrink: 0, marginTop: 2 }}>{Ic.check}</div>{s}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ padding: '1px', background: 'rgba(255,255,255,0.06)', borderRadius: 12 }}>
                  <div style={{ background: '#0D0D14', borderRadius: 11, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={sectionLabel}>Edit positioning</div>
                    <div>
                      <label style={lbl}>Brand name</label>
                      <input value={brandName} onChange={e => setBrandName(e.target.value)} style={inpStyle} placeholder="Your brand name" />
                    </div>
                    <div>
                      <label style={lbl}>Tagline</label>
                      <input value={brandTagline} onChange={e => setBrandTagline(e.target.value)} style={inpStyle} placeholder="e.g. Create. Automate. Dominate." />
                    </div>
                    <div>
                      <label style={lbl}>Website</label>
                      <input value={brandWebsite} onChange={e => setBrandWebsite(e.target.value)} style={inpStyle} placeholder="https://yourbrand.com" />
                    </div>
                    <SaveButton saved={saved} onClick={saveFields} />
                  </div>
                </div>
              </div>
            ) : <EmptyState icon={Ic.position} title="Positioning not yet mapped." desc="Nexa will identify your unique angle, brand promise, authority signals, and how to position you against alternatives." cta="Build intelligence" onCta={analyzeWithAI} loading={analyzing} />}
          </div>
        )}

        {/* ── ASSETS ── */}
        {activeTab === 'assets' && (
          <div className="info-card">
            {/* Asset type selector */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {ASSET_TYPES.map(t => (
                <button key={t.id} className="pill-btn" onClick={() => setUploadType(t.id)}
                  style={{ padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, background: uploadType === t.id ? 'rgba(0,170,255,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${uploadType === t.id ? 'rgba(0,170,255,0.25)' : 'rgba(255,255,255,0.08)'}`, color: uploadType === t.id ? '#00AAFF' : 'rgba(240,237,232,0.4)', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all .15s' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Drop zone */}
            <div
              onDrop={e => { e.preventDefault(); setIsDragging(false); Array.from(e.dataTransfer.files).forEach(uploadFile) }}
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileRef.current?.click()}
              style={{ padding: '28px', border: `1px dashed ${isDragging ? '#00AAFF' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, textAlign: 'center', cursor: 'pointer', background: isDragging ? 'rgba(0,170,255,0.04)' : 'transparent', transition: 'all .15s', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'rgba(240,237,232,0.4)', marginBottom: 6 }}>
                {Ic.upload}
                <span style={{ fontSize: 13, fontWeight: 600 }}>{uploading ? 'Uploading...' : 'Click or drag files to upload'}</span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(240,237,232,0.25)' }}>PDF · PNG · JPG · DOCX · MP4</div>
              <input ref={fileRef} type="file" style={{ display: 'none' }} multiple
                onChange={async e => { const files = Array.from(e.target.files ?? []); for (const f of files) await uploadFile(f) }} />
            </div>

            {/* Assets grid */}
            {nonProfileAssets.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                {nonProfileAssets.map((asset: any) => (
                  <div key={asset.id} className="asset-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, overflow: 'hidden', transition: 'all .15s' }}>
                    {isImage(asset.file_url) ? (
                      <img src={asset.file_url} alt={asset.file_name} style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.25)', color: 'rgba(240,237,232,0.3)' }}>
                        {asset.type === 'brand_doc' ? Ic.file : Ic.image}
                      </div>
                    )}
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(240,237,232,0.75)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.file_name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 10, color: 'rgba(240,237,232,0.3)' }}>{ASSET_TYPES.find(t => t.id === asset.type)?.label}</span>
                        {asset.ai_analyzed && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 700, color: '#00AAFF' }}>
                            {Ic.check} AI read
                          </span>
                        )}
                      </div>
                      <button onClick={() => deleteAsset(asset.id)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%', marginTop: 8, padding: '5px', fontSize: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, color: 'rgba(240,237,232,0.3)', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all .12s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,80,80,0.3)'; (e.currentTarget as HTMLElement).style.color = '#ff7070' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.color = 'rgba(240,237,232,0.3)' }}>
                        {Ic.trash} Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 20px', color: 'rgba(240,237,232,0.3)', fontSize: 13 }}>
                No assets yet. Upload your brand materials above.
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ── Reusable sub-components ───────────────────────────────────────────────

function InfoCard({ label, value, span2 = false }: { label: string; value?: string; span2?: boolean }) {
  if (!value) return null
  return (
    <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, gridColumn: span2 ? 'span 2' : undefined }}>
      <div style={sectionLabel}>{label}</div>
      <div style={{ fontSize: 13, color: 'rgba(240,237,232,0.7)', lineHeight: 1.6, marginTop: 6 }}>{value}</div>
    </div>
  )
}

function Tag({ label }: { label: string }) {
  return <span style={{ padding: '4px 10px', background: 'rgba(0,170,255,0.07)', border: '1px solid rgba(0,170,255,0.18)', borderRadius: 100, fontSize: 12, color: '#00AAFF' }}>{label}</span>
}

function SaveButton({ saved, onClick }: { saved: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: saved ? 'rgba(0,214,143,0.1)' : '#00AAFF', border: `1px solid ${saved ? 'rgba(0,214,143,0.3)' : 'transparent'}`, borderRadius: 9, fontSize: 12, fontWeight: 700, color: saved ? '#00d68f' : '#000', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all .15s', alignSelf: 'flex-start' }}>
      {saved ? <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>Saved</> : <>Save changes</>}
    </button>
  )
}

function EmptyState({ icon, title, desc, cta, onCta, loading }: { icon: React.ReactNode; title: string; desc: string; cta: string; onCta: () => void; loading?: boolean }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 32px' }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,170,255,0.07)', border: '1px solid rgba(0,170,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'rgba(0,170,255,0.6)' }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(240,237,232,0.7)', marginBottom: 8, letterSpacing: '-0.02em' }}>{title}</div>
      <div style={{ fontSize: 13, color: 'rgba(240,237,232,0.35)', lineHeight: 1.7, maxWidth: 380, margin: '0 auto 20px' }}>{desc}</div>
      <button onClick={onCta} disabled={loading}
        style={{ padding: '10px 20px', background: '#00AAFF', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, color: '#000', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
        {loading ? 'Analyzing...' : cta}
      </button>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────
const sectionLabel: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: 'rgba(240,237,232,0.35)', textTransform: 'uppercase', letterSpacing: '.07em' }
const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(240,237,232,0.4)', marginBottom: 6 }
const textArea: React.CSSProperties = { width: '100%', padding: '11px 13px', fontSize: 13, fontFamily: 'var(--sans)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, color: '#F0EDE8', outline: 'none', resize: 'vertical', lineHeight: 1.6, marginTop: 8, boxSizing: 'border-box' }
const inpStyle: React.CSSProperties = { width: '100%', padding: '10px 13px', fontSize: 13, fontFamily: 'var(--sans)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, color: '#F0EDE8', outline: 'none', boxSizing: 'border-box' }
