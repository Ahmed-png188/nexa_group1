'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CREDIT_COSTS } from '@/lib/plan-constants'

const C = {
  bg:'#0C0C0C', surface:'#141414', over:'#1A1A1A',
  border:'rgba(255,255,255,0.10)', borderS:'rgba(255,255,255,0.06)',
  cyan:'#00AAFF', cyanD:'rgba(0,170,255,0.12)', cyanB:'rgba(0,170,255,0.22)',
  t1:'#FFFFFF', t2:'rgba(255,255,255,0.65)', t3:'rgba(255,255,255,0.35)', t4:'rgba(255,255,255,0.18)',
  green:'#22C55E', greenD:'rgba(34,197,94,0.12)',
  amber:'#F59E0B', amberD:'rgba(245,158,11,0.10)',
}
const EN = "'Geist', -apple-system, sans-serif"
const MONO = "'Geist Mono', monospace"

type Stage = 'upload' | 'analyzing' | 'configure' | 'shooting' | 'gallery'
type OutputType = 'studio' | 'lifestyle' | 'both'
type ShotStyle = 'hero' | 'angle_34' | 'top_down' | 'detail' | 'side_profile' | 'floating'
interface Asset { id: string; url: string; type: 'studio' | 'lifestyle' | 'edit'; style?: string; scene?: string; label?: string }

const SHOT_STYLES: { id: ShotStyle; label: string; desc: string }[] = [
  { id: 'hero',         label: 'Hero',        desc: 'Front-facing hero' },
  { id: 'angle_34',     label: '3/4 Angle',   desc: 'Three-quarter view' },
  { id: 'top_down',     label: 'Top Down',    desc: 'Overhead flat lay' },
  { id: 'detail',       label: 'Detail',      desc: 'Macro close-up' },
  { id: 'side_profile', label: 'Side',        desc: 'Profile shot' },
  { id: 'floating',     label: 'Floating',    desc: 'Levitating product' },
]

const LIFESTYLE_SCENES: { id: string; label: string; desc: string }[] = [
  { id: 'marble_minimal', label: 'Marble Minimal', desc: 'Polished white marble' },
  { id: 'golden_hour',    label: 'Golden Hour',    desc: 'Warm sunset light' },
  { id: 'dark_luxury',    label: 'Dark Luxury',    desc: 'Slate & gold accents' },
  { id: 'garden_fresh',   label: 'Garden Fresh',   desc: 'Botanicals & flowers' },
  { id: 'home_cozy',      label: 'Home & Cozy',    desc: 'Warm home interior' },
  { id: 'tech_dark',      label: 'Tech Dark',      desc: 'Carbon fiber + RGB' },
  { id: 'beach_summer',   label: 'Beach Summer',   desc: 'Sandy summer light' },
  { id: 'cafe_morning',   label: 'Café Morning',   desc: 'Morning café table' },
  { id: 'urban_concrete', label: 'Urban Concrete', desc: 'Raw urban texture' },
  { id: 'fashion_studio', label: 'Fashion Studio', desc: 'Editorial spotlight' },
  { id: 'pastel_dream',   label: 'Pastel Dream',   desc: 'Dreamy soft palette' },
]

export default function ProductLabEN() {
  const [stage, setStage]           = useState<Stage>('upload')
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [productId, setProductId]   = useState<string | null>(null)
  const [originalUrl, setOriginalUrl] = useState<string>('')
  const [cleanedUrl, setCleanedUrl]   = useState<string>('')
  const [productType, setProductType] = useState<string>('general')
  const [productName, setProductName] = useState<string>('My product')
  const [outputType, setOutputType]   = useState<OutputType>('studio')
  const [selectedShots, setSelectedShots]   = useState<ShotStyle[]>(['hero', 'angle_34', 'top_down', 'detail'])
  const [selectedScenes, setSelectedScenes] = useState<string[]>(['marble_minimal', 'golden_hour'])
  const [analysisStep, setAnalysisStep]     = useState(0)
  const [shootingStep, setShootingStep]     = useState(0)
  const [shootingTotal, setShootingTotal]   = useState(0)
  const [assets, setAssets]         = useState<Asset[]>([])
  const [selected, setSelected]     = useState<Asset | null>(null)
  const [editPrompt, setEditPrompt] = useState('')
  const [editing, setEditing]       = useState(false)
  const [dragOver, setDragOver]     = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      sb.from('workspace_members').select('workspace_id').eq('user_id', user.id).limit(1).single()
        .then(({ data }) => { if (data) setWorkspaceId(data.workspace_id) })
    })
  }, [])

  const uploadToStorage = async (file: File): Promise<string> => {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user || !workspaceId) throw new Error('Not authenticated')
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${workspaceId}/product-originals/${Date.now()}.${ext}`
    const { error: upErr } = await sb.storage.from('brand-assets').upload(path, file, { upsert: true })
    if (upErr) throw upErr
    const { data: urlData } = sb.storage.from('brand-assets').getPublicUrl(path)
    return urlData.publicUrl
  }

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Please upload an image file.'); return }
    setError(null)
    setStage('analyzing')
    setAnalysisStep(0)

    try {
      // Upload original
      const url = await uploadToStorage(file)
      setOriginalUrl(url)
      setAnalysisStep(1)

      // Detect product type
      const detectRes = await fetch('/api/product-lab/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: url, workspace_id: workspaceId }),
      })
      const detected = await detectRes.json()
      setProductType(detected.type || 'general')
      setProductName(detected.suggested_name || 'My product')
      setAnalysisStep(2)

      // Remove background
      const cleanRes = await fetch('/api/product-lab/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: url, workspace_id: workspaceId, product_id: productId }),
      })
      const cleaned = await cleanRes.json()
      if (cleaned.cleaned_url) {
        setCleanedUrl(cleaned.cleaned_url)
      } else {
        setCleanedUrl(url)
      }
      setAnalysisStep(3)

      // Create product record
      if (workspaceId) {
        const sb = createClient()
        const { data: prod } = await sb.from('products').insert({
          workspace_id: workspaceId,
          name: detected.suggested_name || 'My product',
          product_type: detected.type || 'general',
          original_url: url,
          cleaned_url: cleaned.cleaned_url || url,
        }).select('id').single()
        if (prod) setProductId(prod.id)
      }

      setStage('configure')
    } catch (err: any) {
      setError(err?.message || 'Processing failed. Please try again.')
      setStage('upload')
    }
  }, [workspaceId, productId])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleShoot = async () => {
    if (!cleanedUrl || !workspaceId) return
    setStage('shooting')
    setShootingStep(0)
    const newAssets: Asset[] = []

    const needStudio = outputType !== 'lifestyle'
    const needLife   = outputType !== 'studio'
    const total = (needStudio ? selectedShots.length : 0) + (needLife ? selectedScenes.length : 0)
    setShootingTotal(total)

    if (needStudio) {
      const res = await fetch('/api/product-lab/studio-shots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          product_id: productId,
          image_url: cleanedUrl,
          product_type: productType,
          shots: selectedShots,
        }),
      })
      const data = await res.json()
      if (data.shots) {
        data.shots.forEach((s: any) => {
          newAssets.push({ id: s.id, url: s.url, type: 'studio', style: s.style, label: s.label })
          setShootingStep(p => p + 1)
        })
      }
    }

    if (needLife) {
      const res = await fetch('/api/product-lab/lifestyle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          product_id: productId,
          image_url: cleanedUrl,
          product_type: productType,
          scenes: selectedScenes,
        }),
      })
      const data = await res.json()
      if (data.scenes) {
        data.scenes.forEach((s: any) => {
          newAssets.push({ id: s.id, url: s.url, type: 'lifestyle', scene: s.scene, label: s.label })
          setShootingStep(p => p + 1)
        })
      }
    }

    setAssets(newAssets)
    if (newAssets.length > 0) setSelected(newAssets[0])
    setStage('gallery')
  }

  const handleEdit = async () => {
    if (!selected || !editPrompt.trim() || !workspaceId) return
    setEditing(true)
    try {
      const res = await fetch('/api/product-lab/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          product_id: productId,
          image_url: selected.url,
          edit_prompt: editPrompt,
        }),
      })
      const data = await res.json()
      if (data.edited_url) {
        const edited: Asset = { id: data.asset_id || `edit-${Date.now()}`, url: data.edited_url, type: 'edit', label: 'Edited' }
        setAssets(p => [edited, ...p])
        setSelected(edited)
        setEditPrompt('')
      }
    } catch { /* silent */ }
    setEditing(false)
  }

  const downloadAsset = (asset: Asset) => {
    const a = document.createElement('a'); a.href = asset.url
    a.download = `product-${asset.type}-${Date.now()}.png`; a.click()
  }

  const toggleShot = (id: ShotStyle) =>
    setSelectedShots(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id])

  const toggleScene = (id: string) =>
    setSelectedScenes(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id])

  const creditCost = (() => {
    if (outputType === 'studio')    return CREDIT_COSTS.product_clean + selectedShots.length  * CREDIT_COSTS.product_studio
    if (outputType === 'lifestyle') return CREDIT_COSTS.product_clean + selectedScenes.length * CREDIT_COSTS.product_lifestyle
    return CREDIT_COSTS.product_clean + selectedShots.length * CREDIT_COSTS.product_studio + selectedScenes.length * CREDIT_COSTS.product_lifestyle
  })()

  // ── UPLOAD ──────────────────────────────────────────────────────────
  if (stage === 'upload') return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:EN, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:40 }}>
      <div style={{ textAlign:'center', marginBottom:40 }}>
        <div style={{ fontSize:13, fontWeight:600, letterSpacing:'0.10em', color:C.cyan, textTransform:'uppercase', marginBottom:12 }}>Product Lab</div>
        <div style={{ fontSize:34, fontWeight:700, color:C.t1, letterSpacing:'-0.02em', marginBottom:10 }}>AI Product Photography</div>
        <div style={{ fontSize:15, color:C.t3, maxWidth:400 }}>Drop your product photo — we remove the background, then shoot it in any scene.</div>
      </div>

      {error && (
        <div style={{ marginBottom:20, padding:'10px 18px', borderRadius:10, background:'rgba(239,68,68,0.10)', border:'1px solid rgba(239,68,68,0.25)', color:'#EF4444', fontSize:13 }}>
          {error}
        </div>
      )}

      <div
        onDrop={onDrop} onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
        onClick={() => fileRef.current?.click()}
        style={{
          width:'100%', maxWidth:480, aspectRatio:'1.6', borderRadius:20, cursor:'pointer', transition:'all 0.2s',
          border:`2px dashed ${dragOver ? C.cyan : C.border}`,
          background: dragOver ? C.cyanD : C.surface,
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16,
          transform: dragOver ? 'scale(1.01)' : 'scale(1)',
        }}
      >
        <div style={{ width:56, height:56, borderRadius:14, background:dragOver ? C.cyanB : 'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={dragOver ? C.cyan : C.t3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize:15, fontWeight:600, color: dragOver ? C.cyan : C.t2, textAlign:'center' }}>Drop product photo here</div>
          <div style={{ fontSize:12, color:C.t4, textAlign:'center', marginTop:4 }}>or click to browse — JPG, PNG, WEBP</div>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />

      <div style={{ display:'flex', gap:24, marginTop:36 }}>
        {[
          { icon:'🖼', label:'Auto BG Removal', sub:'Clean cutout in seconds' },
          { icon:'📸', label:'Studio Shots',     sub:'6 pro angles available' },
          { icon:'🌿', label:'Lifestyle Scenes', sub:'11 scene settings' },
        ].map(f => (
          <div key={f.label} style={{ textAlign:'center', width:130 }}>
            <div style={{ fontSize:22, marginBottom:6 }}>{f.icon}</div>
            <div style={{ fontSize:12, fontWeight:600, color:C.t2 }}>{f.label}</div>
            <div style={{ fontSize:11, color:C.t4, marginTop:2 }}>{f.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )

  // ── ANALYZING ───────────────────────────────────────────────────────
  if (stage === 'analyzing') {
    const steps = ['Uploading photo...', 'Analyzing product...', 'Removing background...', 'Done!']
    return (
      <div style={{ minHeight:'100vh', background:C.bg, fontFamily:EN, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:32 }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:20, fontWeight:600, color:C.t1, marginBottom:8 }}>Preparing your product</div>
          <div style={{ fontSize:13, color:C.t3 }}>This takes about 30 seconds</div>
        </div>
        <div style={{ width:360, display:'flex', flexDirection:'column', gap:10 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:12, background: i < analysisStep ? C.greenD : i === analysisStep ? C.cyanD : 'transparent', border:`1px solid ${i < analysisStep ? 'rgba(34,197,94,0.20)' : i === analysisStep ? 'rgba(0,170,255,0.20)' : C.borderS}`, transition:'all 0.4s' }}>
              <div style={{ width:22, height:22, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background: i < analysisStep ? C.green : i === analysisStep ? C.cyan : 'transparent', border:`2px solid ${i < analysisStep ? C.green : i === analysisStep ? C.cyan : C.border}`, flexShrink:0, transition:'all 0.4s' }}>
                {i < analysisStep
                  ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : i === analysisStep
                  ? <div className="nexa-spinner" style={{ width:10, height:10, borderWidth:2, borderTopColor:'#000' }}/>
                  : null}
              </div>
              <span style={{ fontSize:13, color: i <= analysisStep ? C.t1 : C.t4, fontWeight: i === analysisStep ? 600 : 400 }}>{step}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── CONFIGURE ───────────────────────────────────────────────────────
  if (stage === 'configure') return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:EN, display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 28px', height:56, borderBottom:`1px solid ${C.border}`, background:C.surface, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => setStage('upload')} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', borderRadius:8, background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border}`, color:C.t3, cursor:'pointer', fontSize:12 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            New upload
          </button>
          <span style={{ fontSize:14, fontWeight:600, color:C.t1 }}>{productName}</span>
          <span style={{ fontSize:11, padding:'3px 8px', borderRadius:99, background:C.cyanD, border:`1px solid rgba(0,170,255,0.20)`, color:C.cyan, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>{productType}</span>
        </div>
        <button
          onClick={handleShoot}
          disabled={selectedShots.length === 0 && selectedScenes.length === 0}
          style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 20px', borderRadius:10, background:C.cyan, color:'#000', fontSize:13, fontWeight:700, cursor:'pointer', border:'none', opacity: (selectedShots.length === 0 && selectedScenes.length === 0) ? 0.4 : 1 }}
        >
          Shoot — {creditCost} credits
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      </div>

      <div style={{ flex:1, display:'grid', gridTemplateColumns:'220px 1fr', overflow:'hidden' }}>
        {/* Left — product preview + type */}
        <div style={{ borderRight:`1px solid ${C.border}`, padding:20, display:'flex', flexDirection:'column', gap:16, overflowY:'auto' }}>
          {cleanedUrl && (
            <div style={{ borderRadius:12, overflow:'hidden', background:C.surface, border:`1px solid ${C.border}`, aspectRatio:'1' }}>
              <img src={cleanedUrl} alt="Product" style={{ width:'100%', height:'100%', objectFit:'contain', padding:12 }}/>
            </div>
          )}
          <div>
            <div style={{ fontSize:11, color:C.t4, marginBottom:8, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' }}>Output type</div>
            {(['studio','lifestyle','both'] as OutputType[]).map(t => (
              <button key={t} onClick={() => setOutputType(t)} style={{ display:'block', width:'100%', padding:'8px 12px', borderRadius:8, marginBottom:4, background: outputType === t ? C.cyan : 'transparent', border:`1px solid ${outputType === t ? C.cyan : C.border}`, color: outputType === t ? '#000' : C.t3, fontSize:12, fontWeight: outputType === t ? 700 : 400, cursor:'pointer', textAlign:'left', textTransform:'capitalize' }}>
                {t === 'studio' ? 'Studio shots' : t === 'lifestyle' ? 'Lifestyle scenes' : 'Both'}
              </button>
            ))}
          </div>
        </div>

        {/* Right — shot/scene selectors */}
        <div style={{ overflowY:'auto', padding:24 }}>
          {(outputType === 'studio' || outputType === 'both') && (
            <div style={{ marginBottom:32 }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.t1, marginBottom:4 }}>Studio shots <span style={{ fontFamily:MONO, fontSize:11, color:C.t4, fontWeight:400 }}>{CREDIT_COSTS.product_studio} credits each</span></div>
              <div style={{ fontSize:12, color:C.t4, marginBottom:16 }}>Professional white-background photography from 6 angles</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:10 }}>
                {SHOT_STYLES.map(s => (
                  <button key={s.id} onClick={() => toggleShot(s.id)} style={{ padding:'12px 14px', borderRadius:10, border:`1px solid ${selectedShots.includes(s.id) ? C.cyan : C.border}`, background: selectedShots.includes(s.id) ? C.cyanD : C.surface, cursor:'pointer', textAlign:'left' }}>
                    <div style={{ fontSize:12, fontWeight:600, color: selectedShots.includes(s.id) ? C.cyan : C.t2 }}>{s.label}</div>
                    <div style={{ fontSize:11, color:C.t4, marginTop:2 }}>{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(outputType === 'lifestyle' || outputType === 'both') && (
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:C.t1, marginBottom:4 }}>Lifestyle scenes <span style={{ fontFamily:MONO, fontSize:11, color:C.t4, fontWeight:400 }}>{CREDIT_COSTS.product_lifestyle} credits each</span></div>
              <div style={{ fontSize:12, color:C.t4, marginBottom:16 }}>Your product in real-world editorial environments</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:10 }}>
                {LIFESTYLE_SCENES.map(s => (
                  <button key={s.id} onClick={() => toggleScene(s.id)} style={{ padding:'12px 14px', borderRadius:10, border:`1px solid ${selectedScenes.includes(s.id) ? C.cyan : C.border}`, background: selectedScenes.includes(s.id) ? C.cyanD : C.surface, cursor:'pointer', textAlign:'left' }}>
                    <div style={{ fontSize:12, fontWeight:600, color: selectedScenes.includes(s.id) ? C.cyan : C.t2 }}>{s.label}</div>
                    <div style={{ fontSize:11, color:C.t4, marginTop:2 }}>{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // ── SHOOTING ────────────────────────────────────────────────────────
  if (stage === 'shooting') return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:EN, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:32 }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:20, fontWeight:700, color:C.t1, marginBottom:8 }}>Shooting your product</div>
        <div style={{ fontSize:13, color:C.t3 }}>AI is generating each photo — this may take 1–2 minutes</div>
      </div>

      {shootingTotal > 0 && (
        <div style={{ width:360 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:12, color:C.t3 }}>Progress</span>
            <span style={{ fontSize:12, color:C.t1, fontFamily:MONO }}>{shootingStep}/{shootingTotal}</span>
          </div>
          <div style={{ height:4, borderRadius:4, background:'rgba(255,255,255,0.08)' }}>
            <div style={{ height:'100%', borderRadius:4, background:C.cyan, width:`${(shootingStep / shootingTotal) * 100}%`, transition:'width 0.5s ease' }}/>
          </div>
        </div>
      )}

      {/* Live preview grid */}
      {assets.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 120px)', gap:8 }}>
          {assets.map(a => (
            <div key={a.id} style={{ borderRadius:10, overflow:'hidden', border:`1px solid ${C.border}`, aspectRatio:'1' }}>
              <img src={a.url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ── GALLERY ─────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:EN, display:'flex', flexDirection:'column', overflow:'hidden', height:'100vh' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', height:52, borderBottom:`1px solid ${C.border}`, background:C.surface, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => { setStage('upload'); setAssets([]); setSelected(null); setOriginalUrl(''); setCleanedUrl('') }}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', borderRadius:8, background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border}`, color:C.t3, cursor:'pointer', fontSize:12 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            New shoot
          </button>
          <span style={{ fontSize:13, fontWeight:600, color:C.t1 }}>{productName}</span>
          <span style={{ fontSize:11, color:C.t4, fontFamily:MONO }}>{assets.length} photos</span>
        </div>
        <button onClick={() => setStage('configure')} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:8, background:C.cyanD, border:`1px solid rgba(0,170,255,0.20)`, color:C.cyan, fontSize:12, fontWeight:600, cursor:'pointer' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          More shots
        </button>
      </div>

      <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 320px', overflow:'hidden' }}>
        {/* Masonry grid */}
        <div style={{ overflowY:'auto', padding:20 }}>
          <div style={{ columns:'3', columnGap:12 }}>
            {assets.map(a => (
              <div key={a.id} onClick={() => setSelected(a)}
                style={{ marginBottom:12, borderRadius:12, overflow:'hidden', cursor:'pointer', border:`1px solid ${selected?.id === a.id ? C.cyan : C.border}`, transition:'all 0.15s', breakInside:'avoid', boxShadow: selected?.id === a.id ? `0 0 0 2px ${C.cyan}` : 'none' }}>
                <img src={a.url} alt="" style={{ width:'100%', display:'block' }}/>
                <div style={{ padding:'6px 10px', background:C.surface, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:10, color:C.t4, textTransform:'capitalize' }}>{a.label || a.type}</span>
                  <button onClick={e => { e.stopPropagation(); downloadAsset(a) }} style={{ background:'transparent', border:'none', color:C.t4, cursor:'pointer', padding:2 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div style={{ borderLeft:`1px solid ${C.border}`, display:'flex', flexDirection:'column', overflow:'hidden', background:C.surface }}>
          {selected ? (
            <>
              <div style={{ flex:1, overflowY:'auto', padding:16 }}>
                <img src={selected.url} alt="" style={{ width:'100%', borderRadius:12, marginBottom:16, border:`1px solid ${C.border}` }}/>
                <div style={{ fontSize:12, fontWeight:700, color:C.t2, marginBottom:4 }}>{selected.label || selected.type}</div>
                <div style={{ fontSize:11, color:C.t4, marginBottom:16 }}>{selected.style || selected.scene || selected.type}</div>
                <button onClick={() => downloadAsset(selected)} style={{ width:'100%', padding:'9px 0', borderRadius:10, background:C.cyanD, border:`1px solid rgba(0,170,255,0.20)`, color:C.cyan, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download
                </button>
              </div>

              {/* Art direction */}
              <div style={{ borderTop:`1px solid ${C.border}`, padding:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:C.t3, marginBottom:10, letterSpacing:'0.08em', textTransform:'uppercase' }}>Art direction — {CREDIT_COSTS.product_edit} credits</div>
                <textarea
                  value={editPrompt}
                  onChange={e => setEditPrompt(e.target.value)}
                  placeholder="Change the background to a dark marble surface with gold accents..."
                  style={{ width:'100%', minHeight:80, padding:'10px 12px', borderRadius:10, background:C.over, border:`1px solid ${C.border}`, color:C.t1, fontSize:12, fontFamily:EN, resize:'none', outline:'none', boxSizing:'border-box' }}
                />
                <button
                  onClick={handleEdit}
                  disabled={!editPrompt.trim() || editing}
                  style={{ marginTop:8, width:'100%', padding:'9px 0', borderRadius:10, background:editing ? 'rgba(255,255,255,0.06)' : C.cyan, color: editing ? C.t4 : '#000', fontSize:12, fontWeight:700, cursor: editing ? 'not-allowed' : 'pointer', border:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  {editing ? <><div className="nexa-spinner" style={{ width:12, height:12, borderWidth:2, borderTopColor:'currentColor' }}/> Editing...</> : 'Apply edit'}
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:C.t4, fontSize:13 }}>
              Select a photo to preview
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
