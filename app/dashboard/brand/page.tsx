'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type AssetType = 'logo' | 'sample_post' | 'product_photo' | 'brand_doc' | 'other'

const ASSET_TYPES: { id: AssetType; label: string; desc: string; icon: string }[] = [
  { id: 'logo',          label: 'Logo',             desc: 'Your brand logo',            icon: '◈' },
  { id: 'brand_doc',     label: 'Brand Guidelines', desc: 'PDF, doc, or brand guide',   icon: '📋' },
  { id: 'sample_post',   label: 'Content Samples',  desc: 'Posts that performed well',  icon: '✍️' },
  { id: 'product_photo', label: 'Product Photos',   desc: 'Product or service visuals', icon: '🖼' },
  { id: 'other',         label: 'Other Assets',     desc: 'Anything else brand-related', icon: '📎' },
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
  const [activeSection, setActiveSection] = useState<'assets' | 'voice' | 'audience' | 'visual' | 'strategy'>('assets')
  const [brandName, setBrandName] = useState('')
  const [brandTagline, setBrandTagline] = useState('')
  const [brandWebsite, setBrandWebsite] = useState('')
  const [brandVoice, setBrandVoice] = useState('')
  const [brandAudience, setBrandAudience] = useState('')
  const [brandTone, setBrandTone] = useState('')
  const [contentPillars, setContentPillars] = useState('')
  const [competitors, setCompetitors] = useState('')
  const [brandMission, setBrandMission] = useState('')

  useEffect(() => { load() }, [])

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
    const profileAsset = a?.find((x: any) => x.file_name === 'nexa_brand_intelligence.json')
    if (profileAsset?.analysis) {
      setProfile(profileAsset.analysis)
      setContentPillars(profileAsset.analysis.content?.themes?.join('\n') || '')
      setCompetitors(profileAsset.analysis.positioning?.competitor_contrast || '')
      setBrandMission(profileAsset.analysis.positioning?.brand_promise || '')
    }
    setLoading(false)
  }

  async function saveFields() {
    if (!workspace) return
    await supabase.from('workspaces').update({
      brand_name: brandName, brand_tagline: brandTagline, brand_website: brandWebsite,
      brand_voice: brandVoice, brand_audience: brandAudience, brand_tone: brandTone,
      updated_at: new Date().toISOString(),
    }).eq('id', workspace.id)
    setSaved(true); setTimeout(() => setSaved(false), 2000)
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
    } catch (err) { console.error('Upload failed:', err) }
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
        if (data.profile.content?.themes) setContentPillars(data.profile.content.themes.join('\n'))
        if (data.profile.positioning?.brand_promise) setBrandMission(data.profile.positioning.brand_promise)
        await load()
      }
    } catch (err) { console.error('Analysis failed:', err) }
    setAnalyzing(false)
  }

  const nonProfileAssets = assets.filter((a: any) => a.file_name !== 'nexa_brand_intelligence.json')
  const SECTIONS = [
    { id: 'assets', label: 'Assets', icon: '📁' },
    { id: 'voice', label: 'Voice', icon: '🎙' },
    { id: 'audience', label: 'Audience', icon: '👥' },
    { id: 'visual', label: 'Visual', icon: '🎨' },
    { id: 'strategy', label: 'Strategy', icon: '🧠' },
  ]

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--t4)', fontSize: 13 }}>Loading brand profile...</div>

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', height: 'calc(100vh - var(--topbar-h))', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ borderRight: '1px solid var(--line)', padding: '24px 16px', overflowY: 'auto', background: 'rgba(8,8,13,0.6)' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t5)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 12 }}>Brand Brain</div>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id as any)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, border: 'none', background: activeSection === s.id ? 'var(--glass2)' : 'transparent', color: activeSection === s.id ? 'var(--t1)' : 'var(--t4)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: activeSection === s.id ? 600 : 400, textAlign: 'left', marginBottom: 2 }}>
              <span style={{ fontSize: 14 }}>{s.icon}</span> {s.label}
            </button>
          ))}
        </div>
        <div style={{ padding: '12px', background: 'rgba(0,170,255,0.05)', border: '1px solid var(--cline2)', borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', marginBottom: 6 }}>Brand Intelligence</div>
          <div style={{ fontSize: 11, color: 'var(--t5)', lineHeight: 1.6, marginBottom: 10 }}>
            {profile ? 'Active — all generations use your brand DNA.' : 'Let Nexa learn your brand and power every generation.'}
          </div>
          {profile && <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d68f' }} /><span style={{ fontSize: 10, fontWeight: 600, color: '#00d68f' }}>Profile active</span></div>}
          <button onClick={analyzeWithAI} disabled={analyzing}
            style={{ width: '100%', padding: '9px', fontSize: 11, fontWeight: 700, fontFamily: 'var(--sans)', background: analyzing ? 'var(--glass)' : 'var(--cyan)', color: analyzing ? 'var(--t5)' : '#000', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {analyzing ? <><div style={{ width: 10, height: 10, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: 'var(--t4)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Analyzing...</> : profile ? '↺ Re-analyze' : '✦ Build profile'}
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ overflowY: 'auto', padding: '28px 32px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 4 }}>Brand Brain</h1>
          <p style={{ fontSize: 13, color: 'var(--t4)' }}>Everything Nexa knows about your brand. This powers every generation.</p>
        </div>

        {/* ASSETS */}
        {activeSection === 'assets' && (
          <>
            <div style={{ marginBottom: 20, padding: '14px 16px', background: 'rgba(0,170,255,0.04)', border: '1px solid var(--cline2)', borderRadius: 12, fontSize: 12, color: 'var(--t3)', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--cyan)' }}>Upload your brand assets.</strong> The more you give Nexa, the better it understands you. Upload logos, brand guidelines, content samples, product photos — anything that represents your brand.
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Asset type</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {ASSET_TYPES.map(t => (
                  <button key={t.id} onClick={() => setUploadType(t.id)}
                    style={{ padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, background: uploadType === t.id ? 'rgba(0,170,255,0.08)' : 'var(--glass)', border: `1px solid ${uploadType === t.id ? 'var(--cline2)' : 'var(--line2)'}`, color: uploadType === t.id ? 'var(--cyan)' : 'var(--t4)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
              <div onClick={() => fileRef.current?.click()}
                style={{ padding: '32px', border: '1px dashed var(--line2)', borderRadius: 12, textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t2)', marginBottom: 4 }}>{uploading ? 'Uploading...' : 'Click to upload'}</div>
                <div style={{ fontSize: 11, color: 'var(--t5)' }}>PDF, PNG, JPG, MP4, DOC — any format</div>
                <input ref={fileRef} type="file" style={{ display: 'none' }} multiple
                  onChange={async e => { const files = Array.from(e.target.files ?? []); for (const f of files) await uploadFile(f) }} />
              </div>
            </div>
            {nonProfileAssets.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                {nonProfileAssets.map((asset: any) => (
                  <div key={asset.id} style={{ background: 'var(--glass)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
                    {asset.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img src={asset.file_url} alt={asset.file_name} style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', fontSize: 26 }}>
                        {ASSET_TYPES.find(t => t.id === asset.type)?.icon || '📎'}
                      </div>
                    )}
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.file_name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 10, color: 'var(--t5)' }}>{ASSET_TYPES.find(t => t.id === asset.type)?.label}</span>
                        {asset.ai_analyzed && <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--cyan)', background: 'rgba(0,170,255,0.1)', padding: '1px 5px', borderRadius: 3 }}>AI read</span>}
                      </div>
                      <button onClick={() => deleteAsset(asset.id)} style={{ width: '100%', padding: '4px', fontSize: 10, background: 'transparent', border: '1px solid var(--line2)', borderRadius: 5, color: 'var(--t5)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--t5)', fontSize: 13 }}>No assets yet. Upload your brand materials above.</div>}
          </>
        )}

        {/* VOICE */}
        {activeSection === 'voice' && (
          <>
            {profile?.voice && (
              <div style={{ marginBottom: 20, padding: '16px', background: 'rgba(0,170,255,0.04)', border: '1px solid var(--cline2)', borderRadius: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', marginBottom: 10 }}>✦ AI-extracted voice profile</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><div style={aiLabel}>Primary tone</div><div style={aiVal}>{profile.voice.primary_tone}</div></div>
                  <div><div style={aiLabel}>Writing style</div><div style={aiVal}>{profile.voice.writing_style}</div></div>
                  {profile.voice.vocabulary?.length > 0 && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={aiLabel}>Brand vocabulary</div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
                        {profile.voice.vocabulary.map((w: string, i: number) => <span key={i} style={tag}>{w}</span>)}
                      </div>
                    </div>
                  )}
                  {profile.voice.forbidden?.length > 0 && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={aiLabel}>Never use</div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
                        {profile.voice.forbidden.map((w: string, i: number) => <span key={i} style={tagRed}>{w}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
              <div><label style={lbl}>Brand voice</label><textarea value={brandVoice} onChange={e => setBrandVoice(e.target.value)} rows={3} placeholder="e.g. Confident and direct. Speak like a trusted expert friend, not a corporation." style={textareaStyle} /></div>
              <div><label style={lbl}>Tone markers</label><input value={brandTone} onChange={e => setBrandTone(e.target.value)} placeholder="e.g. Bold, honest, motivating, premium but accessible" style={inputStyle} /></div>
              <div><label style={lbl}>Brand promise</label><textarea value={brandMission} onChange={e => setBrandMission(e.target.value)} rows={2} placeholder="The transformation your brand delivers" style={textareaStyle} /></div>
              <button onClick={saveFields} style={saveBtn}>{saved ? '✓ Saved' : 'Save'}</button>
            </div>
          </>
        )}

        {/* AUDIENCE */}
        {activeSection === 'audience' && (
          <>
            {profile?.audience && (
              <div style={{ marginBottom: 20, padding: '16px', background: 'rgba(0,170,255,0.04)', border: '1px solid var(--cline2)', borderRadius: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', marginBottom: 10 }}>✦ AI-extracted audience map</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><div style={aiLabel}>Who they are</div><div style={aiVal}>{profile.audience.primary}</div></div>
                  <div><div style={aiLabel}>Psychology</div><div style={aiVal}>{profile.audience.psychology}</div></div>
                  {profile.audience.pain_points?.length > 0 && (
                    <div><div style={aiLabel}>Pain points</div>{profile.audience.pain_points.map((p: string, i: number) => <div key={i} style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 2 }}>→ {p}</div>)}</div>
                  )}
                  {profile.audience.desires?.length > 0 && (
                    <div><div style={aiLabel}>Desires</div>{profile.audience.desires.map((d: string, i: number) => <div key={i} style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 2 }}>→ {d}</div>)}</div>
                  )}
                </div>
              </div>
            )}
            <div><label style={lbl}>Audience description</label><textarea value={brandAudience} onChange={e => setBrandAudience(e.target.value)} rows={5} placeholder="Who is your ideal customer? Be specific — age, profession, mindset, where they hang out, what they care about." style={textareaStyle} /></div>
            <button onClick={saveFields} style={{ ...saveBtn, marginTop: 16 }}>{saved ? '✓ Saved' : 'Save'}</button>
          </>
        )}

        {/* VISUAL */}
        {activeSection === 'visual' && (
          <>
            {profile?.visual ? (
              <div style={{ marginBottom: 20, padding: '16px', background: 'rgba(0,170,255,0.04)', border: '1px solid var(--cline2)', borderRadius: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', marginBottom: 10 }}>✦ AI-extracted visual identity</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {Object.entries(profile.visual).map(([key, val]: [string, any]) => (
                    <div key={key}><div style={aiLabel}>{key.replace(/_/g, ' ')}</div><div style={aiVal}>{val}</div></div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ padding: '20px', background: 'var(--glass)', border: '1px solid var(--line)', borderRadius: 12, fontSize: 13, color: 'var(--t4)', lineHeight: 1.7 }}>
                Upload visual assets in the Assets tab and run AI analysis to extract your visual identity. Nexa will inject your visual style into every image and video generation.
              </div>
            )}
          </>
        )}

        {/* STRATEGY */}
        {activeSection === 'strategy' && (
          <>
            {profile?.positioning && (
              <div style={{ marginBottom: 20, padding: '16px', background: 'rgba(0,170,255,0.04)', border: '1px solid var(--cline2)', borderRadius: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', marginBottom: 10 }}>✦ AI-extracted positioning</div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                  <div><div style={aiLabel}>Unique angle</div><div style={aiVal}>{profile.positioning.unique_angle}</div></div>
                  <div><div style={aiLabel}>Brand promise</div><div style={aiVal}>{profile.positioning.brand_promise}</div></div>
                  {profile.content?.themes?.length > 0 && (
                    <div><div style={aiLabel}>Content pillars</div><div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>{profile.content.themes.map((t: string, i: number) => <span key={i} style={tag}>{t}</span>)}</div></div>
                  )}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
              <div><label style={lbl}>Brand name</label><input value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="Your brand name" style={inputStyle} /></div>
              <div><label style={lbl}>Tagline</label><input value={brandTagline} onChange={e => setBrandTagline(e.target.value)} placeholder="e.g. Create. Automate. Dominate." style={inputStyle} /></div>
              <div><label style={lbl}>Website</label><input value={brandWebsite} onChange={e => setBrandWebsite(e.target.value)} placeholder="https://yourbrand.com" style={inputStyle} /></div>
              <div><label style={lbl}>Content pillars (one per line)</label><textarea value={contentPillars} onChange={e => setContentPillars(e.target.value)} rows={5} placeholder={`Marketing psychology\nBrand building\nContent strategy`} style={textareaStyle} /></div>
              <div><label style={lbl}>Competitors (to differentiate from)</label><textarea value={competitors} onChange={e => setCompetitors(e.target.value)} rows={2} placeholder="e.g. Buffer, Hootsuite — we differ because..." style={textareaStyle} /></div>
              <button onClick={saveFields} style={saveBtn}>{saved ? '✓ Saved' : 'Save'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--t4)', marginBottom: 7 }
const textareaStyle: React.CSSProperties = { width: '100%', padding: '13px 14px', fontSize: 13, fontFamily: 'var(--sans)', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12, color: 'var(--t1)', outline: 'none', resize: 'vertical' as const, lineHeight: 1.6 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '11px 14px', fontSize: 13, fontFamily: 'var(--sans)', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 10, color: 'var(--t1)', outline: 'none' }
const saveBtn: React.CSSProperties = { padding: '12px 24px', fontSize: 13, fontWeight: 700, fontFamily: 'var(--sans)', background: 'var(--cyan)', color: '#000', border: 'none', borderRadius: 10, cursor: 'pointer' }
const aiLabel: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: 'var(--t5)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }
const aiVal: React.CSSProperties = { fontSize: 12, color: 'var(--t2)' }
const tag: React.CSSProperties = { padding: '3px 8px', borderRadius: 100, fontSize: 11, background: 'rgba(0,170,255,0.08)', border: '1px solid var(--cline2)', color: 'var(--cyan)' }
const tagRed: React.CSSProperties = { padding: '3px 8px', borderRadius: 100, fontSize: 11, background: 'rgba(255,107,107,0.07)', border: '1px solid rgba(255,107,107,0.2)', color: '#ff6b6b' }
