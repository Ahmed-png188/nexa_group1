'use client'
import { useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PACKAGING_TEMPLATES, getTemplate } from '@/lib/packaging-templates'
import { CREDIT_COSTS } from '@/lib/plan-constants'

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
  green:   '#22C55E',
  greenD:  'rgba(34,197,94,0.12)',
  amber:   '#F59E0B',
  amberD:  'rgba(245,158,11,0.10)',
  red:     '#EF4444',
  redD:    'rgba(239,68,68,0.10)',
}
const F = "'Geist', -apple-system, sans-serif"

type ProductType = 'fragrance'|'apparel'|'flower'|'accessory'|'food'|'electronics'|'general'
type SceneStyle  = 'minimal'|'luxury'|'outdoor'|'home'|'fashion'|'abstract'
type OutputMode  = 'shots'|'lifestyle'|'both'

const SCENE_STYLES: { id: SceneStyle; label: string; desc: string }[] = [
  { id: 'minimal',  label: 'Minimal',  desc: 'Clean, white surfaces' },
  { id: 'luxury',   label: 'Luxury',   desc: 'Premium materials' },
  { id: 'outdoor',  label: 'Outdoor',  desc: 'Natural daylight' },
  { id: 'home',     label: 'Home',     desc: 'Warm ambience' },
  { id: 'fashion',  label: 'Fashion',  desc: 'Editorial styling' },
  { id: 'abstract', label: 'Abstract', desc: 'Artistic composition' },
]

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  fragrance:   'Fragrance',
  apparel:     'Apparel',
  flower:      'Flowers',
  accessory:   'Accessory',
  food:        'Food',
  electronics: 'Electronics',
  general:     'General',
}

function UploadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  )
}

function LoadingDots() {
  return (
    <span style={{ display:'inline-flex', gap:3, alignItems:'center' }}>
      {[0,1,2].map(i => (
        <span key={i} style={{
          width:4, height:4, borderRadius:'50%',
          background: C.cyan,
          animation: `dot-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
        }}/>
      ))}
      <style>{`@keyframes dot-pulse{0%,80%,100%{opacity:.2;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}`}</style>
    </span>
  )
}

export default function ProductLabEn() {
  const supabase = createClient()

  // Upload state
  const [uploadedUrl, setUploadedUrl]     = useState<string|null>(null)
  const [uploadedFile, setUploadedFile]   = useState<File|null>(null)
  const [uploading, setUploading]         = useState(false)
  const [dragOver, setDragOver]           = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Detection state
  const [detecting, setDetecting]         = useState(false)
  const [productType, setProductType]     = useState<ProductType>('general')
  const [detectedType, setDetectedType]   = useState<ProductType|null>(null)
  const [detectionNotes, setDetectionNotes] = useState('')
  const [productName, setProductName]     = useState('My Product')

  // Background removal state
  const [removingBg, setRemovingBg]       = useState(false)
  const [cleanedUrl, setCleanedUrl]       = useState<string|null>(null)
  const [productId, setProductId]         = useState<string|null>(null)

  // Generation options
  const [outputMode, setOutputMode]       = useState<OutputMode>('shots')
  const [sceneStyle, setSceneStyle]       = useState<SceneStyle>('minimal')
  const [shotCount, setShotCount]         = useState(4)

  // Generation state
  const [generating, setGenerating]       = useState(false)
  const [generatedShots, setGeneratedShots]       = useState<{id:string;url:string}[]>([])
  const [generatedLifestyle, setGeneratedLifestyle] = useState<{id:string;url:string}[]>([])
  const [error, setError]                 = useState('')

  // Tab
  const [tab, setTab]                     = useState<'shots'|'lifestyle'|'packaging'>('shots')

  // Workspace
  const [workspaceId, setWorkspaceId]     = useState<string|null>(null)

  // Packaging state
  const [pkgType,       setPkgType]       = useState<string>('label')
  const [pkgSizeId,     setPkgSizeId]     = useState<string>('label_rect_md')
  const [pkgCustomW,    setPkgCustomW]    = useState<number>(100)
  const [pkgCustomH,    setPkgCustomH]    = useState<number>(70)
  const [pkgGenerating, setPkgGenerating] = useState(false)
  const [pkgDesign,     setPkgDesign]     = useState<any>(null)
  const [pkgDesignId,   setPkgDesignId]   = useState<string|null>(null)
  const [pkgExporting,  setPkgExporting]  = useState(false)
  const [pkgEditField,  setPkgEditField]  = useState<string|null>(null)
  const [pkgHistory,    setPkgHistory]    = useState<any[]>([])
  const [pkgSpecOpen,   setPkgSpecOpen]   = useState(false)
  const [pkgError,      setPkgError]      = useState('')

  // Load workspace on mount
  useState(() => {
    supabase.from('workspace_members')
      .select('workspace_id').limit(1).single()
      .then(({ data }) => { if (data) setWorkspaceId(data.workspace_id) })
  })

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { setError('Please upload an image file'); return }
    setUploading(true); setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('media').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path)
      setUploadedUrl(urlData.publicUrl)
      setUploadedFile(file)
      // Auto-detect
      if (workspaceId) {
        setDetecting(true)
        const res = await fetch('/api/product-lab/detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_url: urlData.publicUrl, workspace_id: workspaceId }),
        })
        const d = await res.json()
        setDetectedType(d.type || 'general')
        setProductType(d.type || 'general')
        setProductName(d.suggested_name || 'My Product')
        setDetectionNotes(d.notes || '')
        setDetecting(false)
      }
    } catch (e: any) {
      setError(e.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [workspaceId])

  async function handleRemoveBg() {
    if (!uploadedUrl || !workspaceId) return
    setRemovingBg(true); setError('')
    try {
      // Create product record first
      const { data: prod } = await supabase.from('products').insert({
        workspace_id: workspaceId,
        name: productName,
        type: productType,
        original_photos: [uploadedUrl],
      }).select('id').single()
      if (prod) setProductId(prod.id)

      const res = await fetch('/api/product-lab/remove-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          product_id: prod?.id || null,
          image_url: uploadedUrl,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Background removal failed')
      setCleanedUrl(d.url)
    } catch (e: any) {
      setError(e.message || 'Background removal failed')
    } finally {
      setRemovingBg(false)
    }
  }

  async function handleGenerate() {
    const imageUrl = cleanedUrl || uploadedUrl
    if (!imageUrl || !workspaceId) return
    setGenerating(true); setError('')

    // Ensure product exists
    let pid = productId
    if (!pid) {
      const { data: prod } = await supabase.from('products').insert({
        workspace_id: workspaceId,
        name: productName,
        type: productType,
        original_photos: [uploadedUrl || ''],
        cleaned_image_url: cleanedUrl || null,
      }).select('id').single()
      pid = prod?.id || null
      if (pid) setProductId(pid)
    }

    try {
      if (outputMode === 'shots' || outputMode === 'both') {
        const res = await fetch('/api/product-lab/generate-shots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspace_id: workspaceId,
            product_id: pid,
            cleaned_image_url: imageUrl,
            product_type: productType,
            count: shotCount,
          }),
        })
        const d = await res.json()
        if (!res.ok) throw new Error(d.error || 'Shot generation failed')
        setGeneratedShots(d.shots || [])
        setTab('shots')
      }

      if (outputMode === 'lifestyle' || outputMode === 'both') {
        const res = await fetch('/api/product-lab/generate-lifestyle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspace_id: workspaceId,
            product_id: pid,
            cleaned_image_url: imageUrl,
            product_type: productType,
            scene_style: sceneStyle,
            count: outputMode === 'both' ? 2 : shotCount,
          }),
        })
        const d = await res.json()
        if (!res.ok) throw new Error(d.error || 'Lifestyle generation failed')
        setGeneratedLifestyle(d.shots || [])
        if (outputMode === 'lifestyle') setTab('lifestyle')
      }
    } catch (e: any) {
      setError(e.message || 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  function downloadImage(url: string) {
    const a = document.createElement('a')
    a.href = url; a.download = 'product-image.png'; a.click()
  }

  async function sendToStudio(url: string) {
    // Store URL in localStorage for Studio to pick up
    localStorage.setItem('studio_import_url', url)
    window.location.href = '/dashboard/studio'
  }

  const creditCost = (() => {
    if (outputMode === 'shots') return 5 * shotCount
    if (outputMode === 'lifestyle') return 5 * (shotCount === 1 ? 1 : Math.min(shotCount, 4))
    return 5 * shotCount + 5 * 2 // both: shots + 2 lifestyle
  })()

  async function generatePackaging(isRegen = false) {
    if (!workspaceId || pkgGenerating) return
    setPkgGenerating(true); setPkgError('')
    try {
      const isCustom = pkgSizeId === 'label_custom'
      const res = await fetch('/api/product-lab/packaging-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          product_id: productId || undefined,
          packaging_type: pkgType,
          size_id: pkgSizeId,
          custom_dims: isCustom ? { width_mm: pkgCustomW, height_mm: pkgCustomH, depth_mm: 0, bleed_mm: 2 } : undefined,
          lang: 'en',
        }),
      })
      const data = await res.json()
      if (!res.ok) { setPkgError(data.error || 'Generation failed'); return }
      setPkgDesign({ ...data.design, logo_url: data.logo_url, dims: data.dims })
      setPkgDesignId(data.id)
      setPkgHistory(prev => [{ ...data.design, logo_url: data.logo_url, dims: data.dims }, ...prev].slice(0, 5))
    } catch {
      setPkgError('Generation failed')
    } finally {
      setPkgGenerating(false)
    }
  }

  async function exportPDF() {
    if (!pkgDesignId || !workspaceId || pkgExporting) return
    setPkgExporting(true); setPkgError('')
    try {
      const res = await fetch('/api/product-lab/packaging-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId, design_id: pkgDesignId }),
      })
      const data = await res.json()
      if (!res.ok) { setPkgError('PDF export failed'); return }
      window.open(data.pdf_url, '_blank')
    } catch {
      setPkgError('PDF export failed')
    } finally {
      setPkgExporting(false)
    }
  }

  const hasResults = generatedShots.length > 0 || generatedLifestyle.length > 0
  const imageToShow = cleanedUrl || uploadedUrl

  return (
    <div style={{ fontFamily:F, background:C.bg, minHeight:'100vh', color:C.t1, padding:'32px 36px' }}>
      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
          <div style={{
            width:36, height:36, borderRadius:10,
            background: C.cyanD, border:`1px solid ${C.cyanB}`,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
          <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.02em', margin:0 }}>Product Lab</h1>
        </div>
        <p style={{ fontSize:13, color:C.t3, margin:0 }}>Upload a product photo and generate professional photography in seconds.</p>
      </div>

      <div style={{ display:'flex', gap:24, alignItems:'flex-start' }}>
        {/* ── LEFT PANEL ── */}
        <div style={{ width:340, flexShrink:0, display:'flex', flexDirection:'column', gap:16 }}>

          {/* Upload Zone */}
          <div
            onDragOver={e=>{ e.preventDefault(); setDragOver(true) }}
            onDragLeave={()=>setDragOver(false)}
            onDrop={onDrop}
            onClick={()=>!uploadedUrl && fileInputRef.current?.click()}
            style={{
              background: dragOver ? C.cyanD : C.surface,
              border: `2px dashed ${dragOver ? C.cyan : uploadedUrl ? C.border : 'rgba(255,255,255,0.14)'}`,
              borderRadius:14,
              overflow:'hidden',
              cursor: uploadedUrl ? 'default' : 'pointer',
              transition:'all 0.2s',
              minHeight: uploadedUrl ? 'auto' : 180,
              display:'flex', alignItems:'center', justifyContent:'center',
              flexDirection:'column', gap:12,
              position:'relative',
            }}
          >
            {imageToShow ? (
              <>
                <img
                  src={imageToShow}
                  alt="Product"
                  style={{ width:'100%', aspectRatio:'1', objectFit:'contain', display:'block', background:'#fff', borderRadius:12 }}
                />
                {cleanedUrl && (
                  <div style={{
                    position:'absolute', top:10, left:10,
                    background: C.greenD, border:`1px solid ${C.green}`,
                    borderRadius:6, padding:'3px 8px',
                    fontSize:11, fontWeight:600, color:C.green,
                    display:'flex', alignItems:'center', gap:4,
                  }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Background removed
                  </div>
                )}
                <button
                  onClick={e=>{ e.stopPropagation(); setUploadedUrl(null); setUploadedFile(null); setCleanedUrl(null); setDetectedType(null); setProductId(null); setGeneratedShots([]); setGeneratedLifestyle([]) }}
                  style={{
                    position:'absolute', top:10, right:10,
                    width:28, height:28, borderRadius:8,
                    background:'rgba(0,0,0,0.6)', border:`1px solid ${C.border}`,
                    color:C.t2, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14,
                  }}
                >✕</button>
              </>
            ) : (
              <>
                {uploading ? (
                  <>
                    <LoadingDots/>
                    <span style={{ fontSize:13, color:C.t3 }}>Uploading…</span>
                  </>
                ) : (
                  <>
                    <div style={{ color: C.t4 }}><UploadIcon/></div>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:13, fontWeight:500, color:C.t2 }}>Drop your product image</div>
                      <div style={{ fontSize:12, color:C.t4, marginTop:3 }}>or click to browse · PNG, JPG, WEBP</div>
                    </div>
                  </>
                )}
              </>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }}
              onChange={e=>{ const f=e.target.files?.[0]; if(f) handleFile(f) }}/>
          </div>

          {/* Detection badge */}
          {uploadedUrl && (
            <div style={{
              background:C.surface, border:`1px solid ${C.border}`,
              borderRadius:10, padding:'12px 16px',
              display:'flex', flexDirection:'column', gap:8,
            }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:C.t4 }}>
                  Product
                </div>
                {detecting && <div style={{ fontSize:11, color:C.cyan, display:'flex', alignItems:'center', gap:4 }}>
                  <LoadingDots/> Detecting…
                </div>}
                {detectedType && !detecting && (
                  <div style={{
                    background:C.cyanD, border:`1px solid ${C.cyanB}`,
                    borderRadius:6, padding:'2px 8px',
                    fontSize:11, fontWeight:600, color:C.cyan,
                  }}>
                    Auto-detected
                  </div>
                )}
              </div>
              {/* Product name */}
              <input
                value={productName}
                onChange={e=>setProductName(e.target.value)}
                placeholder="Product name"
                style={{
                  background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border}`,
                  borderRadius:8, padding:'8px 12px', fontSize:13, color:C.t1,
                  fontFamily:F, outline:'none', width:'100%', boxSizing:'border-box',
                }}
              />
              {/* Type selector */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {(Object.keys(PRODUCT_TYPE_LABELS) as ProductType[]).map(type => (
                  <button key={type}
                    onClick={()=>setProductType(type)}
                    style={{
                      padding:'4px 10px', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer', border:'1px solid',
                      background: productType===type ? C.cyanD : 'transparent',
                      borderColor: productType===type ? C.cyanB : C.border,
                      color: productType===type ? C.cyan : C.t3,
                      transition:'all 0.15s',
                    }}
                  >{PRODUCT_TYPE_LABELS[type]}</button>
                ))}
              </div>
              {detectionNotes && (
                <div style={{ fontSize:11, color:C.t3, lineHeight:1.5 }}>{detectionNotes}</div>
              )}
            </div>
          )}

          {/* Background Removal */}
          {uploadedUrl && !cleanedUrl && (
            <button
              onClick={handleRemoveBg}
              disabled={removingBg}
              style={{
                background: removingBg ? 'rgba(255,255,255,0.04)' : C.over,
                border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 16px',
                display:'flex', alignItems:'center', gap:8, cursor: removingBg ? 'not-allowed' : 'pointer',
                color: removingBg ? C.t4 : C.t2, fontSize:13, fontWeight:500,
                transition:'all 0.15s',
              }}
            >
              {removingBg ? (
                <><LoadingDots/> Removing background… <span style={{ marginLeft:'auto', fontSize:11, color:C.t4 }}>2 cr</span></>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                  </svg>
                  Remove background
                  <span style={{ marginLeft:'auto', fontSize:11, color:C.t4 }}>2 cr</span>
                </>
              )}
            </button>
          )}

          {/* Output selection */}
          {uploadedUrl && (
            <div style={{
              background:C.surface, border:`1px solid ${C.border}`,
              borderRadius:10, padding:'16px',
              display:'flex', flexDirection:'column', gap:12,
            }}>
              <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:C.t4 }}>
                Output Type
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {([
                  { id:'shots',     label:'Studio Shots',      desc:'White background · 4 angles', cost:'5 cr each' },
                  { id:'lifestyle', label:'Lifestyle Scenes',   desc:'Styled environments',          cost:'5 cr each' },
                  { id:'both',      label:'Both',               desc:'Shots + lifestyle scenes',      cost:'5 cr each' },
                ] as { id:OutputMode; label:string; desc:string; cost:string }[]).map(o => (
                  <button key={o.id}
                    onClick={()=>setOutputMode(o.id)}
                    style={{
                      background: outputMode===o.id ? C.cyanD : 'transparent',
                      border:`1px solid ${outputMode===o.id ? C.cyanB : C.borderS}`,
                      borderRadius:8, padding:'10px 12px', cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      transition:'all 0.15s',
                    }}
                  >
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', gap:2 }}>
                      <span style={{ fontSize:13, fontWeight:500, color: outputMode===o.id ? C.cyan : C.t1 }}>{o.label}</span>
                      <span style={{ fontSize:11, color:C.t3 }}>{o.desc}</span>
                    </div>
                    <span style={{ fontSize:11, color: outputMode===o.id ? C.cyan : C.t4 }}>{o.cost}</span>
                  </button>
                ))}
              </div>

              {/* Shot count */}
              {(outputMode === 'shots' || outputMode === 'both') && (
                <div>
                  <div style={{ fontSize:11, color:C.t4, marginBottom:6 }}>Shots ({shotCount})</div>
                  <div style={{ display:'flex', gap:6 }}>
                    {[1,2,3,4].map(n => (
                      <button key={n} onClick={()=>setShotCount(n)}
                        style={{
                          flex:1, padding:'6px 0', borderRadius:6, fontSize:12, fontWeight:600,
                          cursor:'pointer', border:'1px solid',
                          background: shotCount===n ? C.cyanD : 'transparent',
                          borderColor: shotCount===n ? C.cyanB : C.border,
                          color: shotCount===n ? C.cyan : C.t3,
                        }}>{n}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Scene style (lifestyle/both) */}
              {(outputMode === 'lifestyle' || outputMode === 'both') && (
                <div>
                  <div style={{ fontSize:11, color:C.t4, marginBottom:6 }}>Scene Style</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {SCENE_STYLES.map(s => (
                      <button key={s.id} onClick={()=>setSceneStyle(s.id)}
                        title={s.desc}
                        style={{
                          padding:'5px 10px', borderRadius:6, fontSize:11, fontWeight:600,
                          cursor:'pointer', border:'1px solid',
                          background: sceneStyle===s.id ? C.cyanD : 'transparent',
                          borderColor: sceneStyle===s.id ? C.cyanB : C.border,
                          color: sceneStyle===s.id ? C.cyan : C.t3,
                          transition:'all 0.15s',
                        }}>{s.label}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Credit summary + Generate */}
          {uploadedUrl && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{
                background:C.cyanD, border:`1px solid ${C.cyanB}`,
                borderRadius:8, padding:'8px 12px',
                display:'flex', alignItems:'center', justifyContent:'space-between',
              }}>
                <span style={{ fontSize:12, color:C.t2 }}>Credits required</span>
                <span style={{ fontSize:13, fontWeight:700, color:C.cyan }}>{creditCost} cr</span>
              </div>

              {error && (
                <div style={{
                  background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.20)',
                  borderRadius:8, padding:'8px 12px', fontSize:12, color:'#EF4444',
                }}>{error}</div>
              )}

              <button
                onClick={handleGenerate}
                disabled={generating || !workspaceId}
                style={{
                  background: generating ? 'rgba(255,255,255,0.06)' : C.t1,
                  color: generating ? C.t3 : '#0C0C0C',
                  border:'none', borderRadius:10, padding:'12px 20px',
                  fontSize:14, fontWeight:700, cursor: generating ? 'not-allowed' : 'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  transition:'all 0.2s', letterSpacing:'-0.01em',
                }}
              >
                {generating ? (
                  <><LoadingDots/> Generating…</>
                ) : (
                  <><SparkleIcon/> Generate</>
                )}
              </button>
            </div>
          )}

          {/* Empty state hint */}
          {!uploadedUrl && !uploading && (
            <div style={{
              background:C.surface, border:`1px solid ${C.borderS}`,
              borderRadius:10, padding:'16px',
              display:'flex', flexDirection:'column', gap:8,
            }}>
              <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:C.t4 }}>
                How it works
              </div>
              {[
                { icon:'①', text:'Upload your product photo' },
                { icon:'②', text:'Remove background (optional)' },
                { icon:'③', text:'Pick output type and style' },
                { icon:'④', text:'Generate professional shots' },
              ].map(step => (
                <div key={step.icon} style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <span style={{ fontSize:14, color:C.cyan, width:18, flexShrink:0 }}>{step.icon}</span>
                  <span style={{ fontSize:12, color:C.t2 }}>{step.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ flex:1, minWidth:0 }}>
          {!hasResults && !generating && tab !== 'packaging' ? (
            <div style={{
              background:C.surface, border:`1px solid ${C.borderS}`,
              borderRadius:14, padding:'64px 32px',
              display:'flex', flexDirection:'column', alignItems:'center', gap:16, textAlign:'center',
            }}>
              <div style={{ color:C.t4 }}>
                <ImageIcon/>
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:600, color:C.t2, marginBottom:4 }}>Your shots will appear here</div>
                <div style={{ fontSize:13, color:C.t4 }}>Upload a product image and click Generate</div>
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
              {/* Tabs */}
              <div style={{
                display:'flex', gap:0,
                borderBottom:`1px solid ${C.borderS}`, marginBottom:20,
              }}>
                {[
                  { id:'shots', label:'Studio Shots', count:generatedShots.length },
                  { id:'lifestyle', label:'Lifestyle', count:generatedLifestyle.length },
                  { id:'packaging', label:'Packaging', count: pkgDesign ? 1 : 0 },
                ].map(t => (
                  <button key={t.id}
                    onClick={()=>setTab(t.id as any)}
                    style={{
                      padding:'10px 16px', background:'transparent', border:'none',
                      borderBottom:`2px solid ${tab===t.id ? C.cyan : 'transparent'}`,
                      fontSize:13, fontWeight: tab===t.id ? 600 : 400,
                      color: tab===t.id ? C.t1 : C.t3,
                      cursor:'pointer', marginBottom:'-1px',
                      display:'flex', alignItems:'center', gap:6, fontFamily:F,
                    }}
                  >
                    {t.label}
                    {t.count > 0 && (
                      <span style={{
                        background:C.cyanD, color:C.cyan,
                        borderRadius:10, padding:'1px 6px', fontSize:10, fontWeight:700,
                      }}>{t.count}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Loading state */}
              {generating && (
                <div style={{
                  background:C.cyanD, border:`1px solid ${C.cyanB}`,
                  borderRadius:12, padding:'24px',
                  display:'flex', alignItems:'center', gap:12, marginBottom:20,
                }}>
                  <LoadingDots/>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500, color:C.t1 }}>Generating your images…</div>
                    <div style={{ fontSize:12, color:C.t3, marginTop:2 }}>This may take 30–60 seconds</div>
                  </div>
                </div>
              )}

              {/* Shots grid */}
              {tab === 'shots' && (
                <div>
                  {generatedShots.length > 0 ? (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:12 }}>
                      {generatedShots.map(shot => (
                        <ImageCard key={shot.id} url={shot.url} onDownload={()=>downloadImage(shot.url)} onSendToStudio={()=>sendToStudio(shot.url)} onRegenerate={handleGenerate} />
                      ))}
                    </div>
                  ) : (
                    !generating && <EmptyTab label="No studio shots yet" sub="Select 'Studio Shots' and generate" />
                  )}
                </div>
              )}

              {/* Lifestyle grid */}
              {tab === 'lifestyle' && (
                <div>
                  {generatedLifestyle.length > 0 ? (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:12 }}>
                      {generatedLifestyle.map(shot => (
                        <ImageCard key={shot.id} url={shot.url} onDownload={()=>downloadImage(shot.url)} onSendToStudio={()=>sendToStudio(shot.url)} onRegenerate={handleGenerate} />
                      ))}
                    </div>
                  ) : (
                    !generating && <EmptyTab label="No lifestyle shots yet" sub="Select 'Lifestyle Scenes' and generate" />
                  )}
                </div>
              )}

              {/* Packaging design tab */}
              {tab === 'packaging' && (
                <PackagingTab
                  pkgType={pkgType} setPkgType={(t)=>{ setPkgType(t); setPkgSizeId(getTemplate(t)?.sizes[0]?.id || '') }}
                  pkgSizeId={pkgSizeId} setPkgSizeId={setPkgSizeId}
                  pkgCustomW={pkgCustomW} setPkgCustomW={setPkgCustomW}
                  pkgCustomH={pkgCustomH} setPkgCustomH={setPkgCustomH}
                  pkgGenerating={pkgGenerating}
                  pkgDesign={pkgDesign} setPkgDesign={setPkgDesign}
                  pkgDesignId={pkgDesignId}
                  pkgExporting={pkgExporting}
                  pkgEditField={pkgEditField} setPkgEditField={setPkgEditField}
                  pkgHistory={pkgHistory} setPkgHistory={setPkgHistory}
                  pkgSpecOpen={pkgSpecOpen} setPkgSpecOpen={setPkgSpecOpen}
                  pkgError={pkgError}
                  onGenerate={generatePackaging}
                  onExportPDF={exportPDF}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ImageCard({ url, onDownload, onSendToStudio, onRegenerate }: {
  url: string
  onDownload: () => void
  onSendToStudio: () => void
  onRegenerate: () => void
}) {
  const [hover, setHover] = useState(false)
  const C2 = {
    surface:'#141414', border:'rgba(255,255,255,0.10)',
    over:'#1A1A1A', t2:'rgba(255,255,255,0.65)', t4:'rgba(255,255,255,0.20)',
    cyan:'#00AAFF', cyanD:'rgba(0,170,255,0.12)', cyanB:'rgba(0,170,255,0.22)',
  }
  return (
    <div
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>setHover(false)}
      style={{
        background: C2.surface, border:`1px solid ${hover ? 'rgba(255,255,255,0.16)' : C2.border}`,
        borderRadius:12, overflow:'hidden', position:'relative',
        transition:'border-color 0.15s',
      }}
    >
      <img src={url} alt="Generated" style={{ width:'100%', aspectRatio:'1', objectFit:'cover', display:'block' }}/>
      {hover && (
        <div style={{
          position:'absolute', inset:0, background:'rgba(0,0,0,0.55)',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, padding:12,
        }}>
          {[
            { icon:<DownloadIcon/>,  label:'Download',       fn: onDownload },
            { icon:<SendIcon/>,      label:'Send to Studio', fn: onSendToStudio },
            { icon:<RefreshIcon/>,   label:'Regenerate',     fn: onRegenerate },
          ].map(btn => (
            <button key={btn.label} onClick={btn.fn}
              style={{
                background:'rgba(255,255,255,0.10)', border:'1px solid rgba(255,255,255,0.16)',
                borderRadius:8, padding:'7px 14px', width:'100%',
                display:'flex', alignItems:'center', gap:6, justifyContent:'center',
                color:'#fff', fontSize:12, fontWeight:500, cursor:'pointer',
                fontFamily:"'Geist', -apple-system, sans-serif",
              }}
            >{btn.icon}{btn.label}</button>
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyTab({ label, sub }: { label: string; sub: string }) {
  return (
    <div style={{
      background:'#141414', border:'1px solid rgba(255,255,255,0.06)',
      borderRadius:12, padding:'48px 24px',
      display:'flex', flexDirection:'column', alignItems:'center', gap:8, textAlign:'center',
    }}>
      <div style={{ fontSize:14, fontWeight:500, color:'rgba(255,255,255,0.35)' }}>{label}</div>
      <div style={{ fontSize:12, color:'rgba(255,255,255,0.20)' }}>{sub}</div>
    </div>
  )
}

// ─── Packaging icons ───────────────────────────────────────────
const PKG_ICONS: Record<string, JSX.Element> = {
  bag:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  box:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  label:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  pouch:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z"/><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/><line x1="4" y1="11" x2="20" y2="11"/></svg>,
  sleeve: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20M2 14h20"/></svg>,
}

// ─── Packaging preview ─────────────────────────────────────────
function PackagingPreview({ design, packagingType }: { design: any; packagingType: string }) {
  const bg      = design?.bg_color      || '#1A1A1A'
  const textCol = design?.text_color    || '#FFFFFF'
  const accent  = design?.accent_color  || '#00AAFF'
  const dims    = design?.dims          || { width_mm: 100, height_mm: 100, depth_mm: 0 }
  const scale   = 2.2
  const maxW    = 320
  const maxH    = 240
  const previewW = Math.min(maxW, dims.width_mm  * scale)
  const previewH = Math.min(maxH, dims.height_mm * scale)

  const isOval   = packagingType === 'label' && previewW / previewH > 1.3
  const isCircle = packagingType === 'label' && Math.abs(previewW - previewH) < 10

  const borderRadius = isCircle ? '50%' : isOval ? '50%' : packagingType === 'pouch' ? '12px 12px 4px 4px' : '8px'

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
      <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.08em', color:'rgba(255,255,255,0.25)', textTransform:'uppercase' }}>
        Preview
      </div>

      {/* Main shape */}
      <div style={{
        width: previewW, height: previewH,
        background: bg,
        border: '3px solid rgba(255,255,255,0.15)',
        borderRadius,
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        padding: 16, textAlign:'center', position:'relative', overflow:'hidden',
        boxShadow:'0 12px 40px rgba(0,0,0,0.6)',
        transition:'all 0.25s',
      }}>
        {/* Box side panels indicator */}
        {packagingType === 'box' && dims.depth_mm > 0 && (
          <>
            <div style={{
              position:'absolute', left:0, top:0, bottom:0, width: Math.min(40, dims.depth_mm * scale * 0.4),
              background: shadeColor(bg, -20), borderRight:'1px dashed rgba(255,255,255,0.15)',
            }}/>
            <div style={{
              position:'absolute', right:0, top:0, bottom:0, width: Math.min(40, dims.depth_mm * scale * 0.4),
              background: shadeColor(bg, -20), borderLeft:'1px dashed rgba(255,255,255,0.15)',
            }}/>
          </>
        )}
        {/* Pouch zipper */}
        {packagingType === 'pouch' && (
          <div style={{ position:'absolute', top:14, left:8, right:8, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2 }}/>
        )}
        {/* Bag handle */}
        {packagingType === 'bag' && (
          <div style={{
            position:'absolute', top:-8, left:'50%', transform:'translateX(-50%)',
            width:60, height:16, border:'3px solid rgba(255,255,255,0.25)',
            borderBottom:'none', borderRadius:'8px 8px 0 0',
          }}/>
        )}

        {/* Logo */}
        {design?.logo_url && (
          <img src={design.logo_url} alt="logo"
            style={{ maxWidth:60, maxHeight:40, objectFit:'contain', marginBottom:8, position:'relative', zIndex:1 }}/>
        )}

        {/* Brand name */}
        <div style={{
          fontSize: Math.max(10, Math.min(20, previewW / 10)),
          fontWeight:700, color: textCol, letterSpacing:'-0.02em',
          position:'relative', zIndex:1, wordBreak:'break-word',
        }}>
          {design?.brand_name_display || 'Brand'}
        </div>

        {/* Tagline */}
        {design?.tagline_display && (
          <div style={{ fontSize: Math.max(7, Math.min(11, previewW / 16)), color: accent, marginTop:4, position:'relative', zIndex:1 }}>
            {design.tagline_display}
          </div>
        )}

        {/* Main copy */}
        {design?.main_copy && (
          <div style={{
            fontSize: Math.max(6, Math.min(9, previewW / 20)),
            color: textCol, opacity:0.65, marginTop:6, lineHeight:1.4,
            position:'relative', zIndex:1, maxWidth:'80%',
          }}>
            {design.main_copy.split('\n')[0]}
          </div>
        )}
      </div>

      {/* Dimensions badge */}
      <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)' }}>
        {dims.width_mm}×{dims.height_mm}mm{dims.depth_mm ? `×${dims.depth_mm}mm` : ''} + {dims.bleed_mm || 3}mm bleed
      </div>
    </div>
  )
}

function shadeColor(hex: string, pct: number): string {
  try {
    const n = parseInt(hex.replace('#',''), 16)
    const r = Math.min(255, Math.max(0, (n>>16) + pct))
    const g = Math.min(255, Math.max(0, ((n>>8)&0xff) + pct))
    const b = Math.min(255, Math.max(0, (n&0xff) + pct))
    return `rgb(${r},${g},${b})`
  } catch { return hex }
}

// ─── Full packaging tab ────────────────────────────────────────
function PackagingTab({
  pkgType, setPkgType, pkgSizeId, setPkgSizeId,
  pkgCustomW, setPkgCustomW, pkgCustomH, setPkgCustomH,
  pkgGenerating, pkgDesign, setPkgDesign, pkgDesignId,
  pkgExporting, pkgEditField, setPkgEditField,
  pkgHistory, setPkgHistory, pkgSpecOpen, setPkgSpecOpen,
  pkgError, onGenerate, onExportPDF,
}: {
  pkgType: string; setPkgType: (t: string) => void
  pkgSizeId: string; setPkgSizeId: (s: string) => void
  pkgCustomW: number; setPkgCustomW: (n: number) => void
  pkgCustomH: number; setPkgCustomH: (n: number) => void
  pkgGenerating: boolean
  pkgDesign: any; setPkgDesign: (d: any) => void
  pkgDesignId: string | null
  pkgExporting: boolean
  pkgEditField: string | null; setPkgEditField: (f: string | null) => void
  pkgHistory: any[]; setPkgHistory: (h: any[]) => void
  pkgSpecOpen: boolean; setPkgSpecOpen: (o: boolean) => void
  pkgError: string
  onGenerate: (isRegen?: boolean) => void
  onExportPDF: () => void
}) {
  const tmpl = getTemplate(pkgType)
  const selectedSize = tmpl?.sizes.find(s => s.id === pkgSizeId)
  const dims = selectedSize?.dims

  const editableFields = [
    { key:'bg_color',           label:'Background',   type:'color' },
    { key:'text_color',         label:'Text',         type:'color' },
    { key:'accent_color',       label:'Accent',       type:'color' },
    { key:'brand_name_display', label:'Brand name',   type:'text'  },
    { key:'tagline_display',    label:'Tagline',      type:'text'  },
    { key:'main_copy',          label:'Main copy',    type:'textarea' },
  ]

  return (
    <div style={{ display:'flex', gap:24 }}>
      {/* ── LEFT CONTROLS ── */}
      <div style={{ width:320, flexShrink:0, display:'flex', flexDirection:'column', gap:14 }}>

        {/* Packaging type */}
        <div style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:10, padding:'14px 16px' }}>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:'rgba(255,255,255,0.25)', marginBottom:10 }}>
            Packaging Type
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
            {PACKAGING_TEMPLATES.map(t => (
              <button key={t.id} onClick={()=>setPkgType(t.id)}
                style={{
                  background: pkgType===t.id ? 'rgba(0,170,255,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${pkgType===t.id ? 'rgba(0,170,255,0.22)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius:10, padding:'12px 14px', cursor:'pointer',
                  display:'flex', alignItems:'center', gap:8,
                  color: pkgType===t.id ? '#00AAFF' : 'rgba(255,255,255,0.50)',
                  fontSize:12, fontWeight: pkgType===t.id ? 600 : 400,
                  transition:'all 0.14s', fontFamily:"'Geist', -apple-system, sans-serif",
                  height:46,
                }}
              >
                {PKG_ICONS[t.id]}
                {t.name_en}
              </button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:10, padding:'14px 16px' }}>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:'rgba(255,255,255,0.25)', marginBottom:8 }}>
            Size
          </div>
          <div style={{ position:'relative' }}>
            <select
              value={pkgSizeId}
              onChange={e => setPkgSizeId(e.target.value)}
              style={{
                width:'100%', padding:'10px 14px', borderRadius:9,
                background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.10)',
                color:'#FFFFFF', fontSize:13, fontFamily:"'Geist', -apple-system, sans-serif",
                outline:'none', cursor:'pointer', appearance:'none',
              }}
            >
              {tmpl?.sizes.map(s => (
                <option key={s.id} value={s.id} style={{ background:'#1A1A1A' }}>{s.label_en}</option>
              ))}
            </select>
            <div style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'rgba(255,255,255,0.35)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
            </div>
          </div>

          {pkgSizeId === 'label_custom' && (
            <div style={{ display:'flex', gap:8, marginTop:8 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.30)', marginBottom:4 }}>Width (mm)</div>
                <input type="number" value={pkgCustomW} onChange={e=>setPkgCustomW(Number(e.target.value))}
                  style={{ width:'100%', padding:'7px 10px', borderRadius:7, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.10)', color:'#fff', fontSize:12, fontFamily:"'Geist', sans-serif", outline:'none', boxSizing:'border-box' as const }} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.30)', marginBottom:4 }}>Height (mm)</div>
                <input type="number" value={pkgCustomH} onChange={e=>setPkgCustomH(Number(e.target.value))}
                  style={{ width:'100%', padding:'7px 10px', borderRadius:7, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.10)', color:'#fff', fontSize:12, fontFamily:"'Geist', sans-serif", outline:'none', boxSizing:'border-box' as const }} />
              </div>
            </div>
          )}

          {dims && pkgSizeId !== 'label_custom' && (
            <div style={{ marginTop:8, fontSize:11, color:'rgba(255,255,255,0.25)' }}>
              {dims.width_mm}×{dims.height_mm}mm{dims.depth_mm ? `×${dims.depth_mm}mm` : ''} · Includes {dims.bleed_mm}mm bleed
            </div>
          )}
        </div>

        {/* Editable fields (when design exists) */}
        {pkgDesign && (
          <div style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:10, padding:'14px 16px', display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:'rgba(255,255,255,0.25)' }}>
              Brand Settings
            </div>
            {editableFields.map(f => (
              <div key={f.key}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.30)', marginBottom:3, textTransform:'uppercase', letterSpacing:'0.04em' }}>{f.label}</div>
                {pkgEditField === f.key ? (
                  f.type === 'textarea' ? (
                    <textarea
                      autoFocus
                      defaultValue={pkgDesign[f.key] || ''}
                      onBlur={e => { setPkgDesign({ ...pkgDesign, [f.key]: e.target.value }); setPkgEditField(null) }}
                      style={{ width:'100%', padding:'6px 10px', borderRadius:7, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(0,170,255,0.30)', color:'#fff', fontSize:12, fontFamily:"'Geist', sans-serif", outline:'none', resize:'none', rows:3, boxSizing:'border-box' as const } as React.CSSProperties}
                      rows={3}
                    />
                  ) : f.type === 'color' ? (
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <input type="color" value={pkgDesign[f.key] || '#000000'}
                        onChange={e => setPkgDesign({ ...pkgDesign, [f.key]: e.target.value })}
                        onBlur={() => setPkgEditField(null)}
                        style={{ width:36, height:28, borderRadius:6, border:'none', cursor:'pointer', background:'none' }} />
                      <span style={{ fontSize:12, color:'rgba(255,255,255,0.60)', fontFamily:"'Geist Mono', monospace" }}>{pkgDesign[f.key]}</span>
                    </div>
                  ) : (
                    <input autoFocus type="text" defaultValue={pkgDesign[f.key] || ''}
                      onBlur={e => { setPkgDesign({ ...pkgDesign, [f.key]: e.target.value }); setPkgEditField(null) }}
                      onKeyDown={e => { if (e.key === 'Enter') { setPkgDesign({ ...pkgDesign, [f.key]: (e.target as HTMLInputElement).value }); setPkgEditField(null) } }}
                      style={{ width:'100%', padding:'6px 10px', borderRadius:7, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(0,170,255,0.30)', color:'#fff', fontSize:12, fontFamily:"'Geist', sans-serif", outline:'none', boxSizing:'border-box' as const }} />
                  )
                ) : (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
                      {f.type === 'color' && (
                        <div style={{ width:20, height:20, borderRadius:4, background: pkgDesign[f.key] || '#000', border:'1px solid rgba(255,255,255,0.15)', flexShrink:0 }}/>
                      )}
                      <span style={{ fontSize:12, color:'rgba(255,255,255,0.55)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:180 }}>
                        {pkgDesign[f.key] || '—'}
                      </span>
                    </div>
                    <button onClick={()=>setPkgEditField(f.key)}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.25)', padding:3, display:'flex', alignItems:'center', flexShrink:0 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {pkgError && (
          <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.20)', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#EF4444' }}>
            {pkgError}
          </div>
        )}

        {/* Credit info + action buttons */}
        {!pkgDesign ? (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ background:'rgba(0,170,255,0.08)', border:'1px solid rgba(0,170,255,0.18)', borderRadius:8, padding:'8px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.65)' }}>Credits required</span>
              <span style={{ fontSize:13, fontWeight:700, color:'#00AAFF' }}>{CREDIT_COSTS.packaging_generate} cr</span>
            </div>
            <button onClick={()=>onGenerate(false)} disabled={pkgGenerating}
              style={{
                background: pkgGenerating ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                color: pkgGenerating ? 'rgba(255,255,255,0.35)' : '#0C0C0C',
                border:'none', borderRadius:10, padding:'12px 20px',
                fontSize:14, fontWeight:700, cursor: pkgGenerating ? 'not-allowed' : 'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                fontFamily:"'Geist', -apple-system, sans-serif",
              }}
            >
              {pkgGenerating ? <><LoadingDots/> Generating…</> : <>✦ Generate packaging →</>}
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>onGenerate(true)} disabled={pkgGenerating}
              style={{
                flex:1, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)',
                borderRadius:10, padding:'10px 14px', fontSize:12, fontWeight:600, cursor:'pointer',
                color: pkgGenerating ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.70)',
                display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                fontFamily:"'Geist', -apple-system, sans-serif",
              }}
            >
              {pkgGenerating ? <LoadingDots/> : '↺'} Regenerate
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.30)' }}>5 cr</span>
            </button>
            <button onClick={onExportPDF} disabled={pkgExporting}
              style={{
                flex:1, background:'rgba(0,170,255,0.10)', border:'1px solid rgba(0,170,255,0.22)',
                borderRadius:10, padding:'10px 14px', fontSize:12, fontWeight:700, cursor:'pointer',
                color: pkgExporting ? 'rgba(0,170,255,0.40)' : '#00AAFF',
                display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                fontFamily:"'Geist', -apple-system, sans-serif",
              }}
            >
              {pkgExporting ? <LoadingDots/> : '↓'} Export PDF →
            </button>
          </div>
        )}
      </div>

      {/* ── RIGHT PREVIEW ── */}
      <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{
          background:'#0C0C0C', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14,
          padding:'40px 32px', display:'flex', alignItems:'center', justifyContent:'center',
          minHeight:300,
        }}>
          {!pkgDesign && !pkgGenerating ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, textAlign:'center' }}>
              <div style={{ color:'rgba(255,255,255,0.15)' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
              </div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.30)' }}>Configure packaging and generate your design</div>
            </div>
          ) : pkgGenerating ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
              <LoadingDots/>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.40)' }}>Designing your packaging…</div>
            </div>
          ) : (
            <PackagingPreview design={pkgDesign} packagingType={pkgType} />
          )}
        </div>

        {/* Design spec card */}
        {pkgDesign && (
          <div style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, overflow:'hidden' }}>
            <button onClick={()=>setPkgSpecOpen(!pkgSpecOpen)}
              style={{
                width:'100%', padding:'12px 16px', background:'none', border:'none', cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'space-between',
                fontFamily:"'Geist', -apple-system, sans-serif",
              }}>
              <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.55)' }}>Design specifications</span>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.30)' }}>{pkgSpecOpen ? '↑' : '↓'}</span>
            </button>
            {pkgSpecOpen && (
              <div style={{ padding:'0 16px 14px', display:'flex', flexDirection:'column', gap:5 }}>
                {[
                  ['Style',       pkgDesign.design_style],
                  ['Layout',      pkgDesign.layout],
                  ['Font weight', pkgDesign.font_weight],
                  ['Elements',    (pkgDesign.special_elements || []).join(', ')],
                  ['Secondary',   pkgDesign.secondary_copy],
                ].filter(([,v])=>v).map(([k,v]) => (
                  <div key={k} style={{ display:'flex', gap:8, fontSize:12 }}>
                    <span style={{ color:'rgba(255,255,255,0.30)', width:90, flexShrink:0 }}>{k}</span>
                    <span style={{ color:'rgba(255,255,255,0.65)' }}>{v}</span>
                  </div>
                ))}
                {pkgDesign.print_notes && (
                  <div style={{ marginTop:4, fontSize:11, color:'rgba(255,255,255,0.30)', fontStyle:'italic' }}>{pkgDesign.print_notes}</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* History row */}
        {pkgHistory.length > 1 && (
          <div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)', marginBottom:8 }}>Previous designs</div>
            <div style={{ display:'flex', gap:8 }}>
              {pkgHistory.slice(1, 5).map((h, i) => (
                <button key={i} onClick={()=>{ /* restore from history */ }}
                  title={h.brand_name_display || 'Design'}
                  style={{
                    width:60, height:60, borderRadius:8, cursor:'pointer',
                    background: h.bg_color || '#1A1A1A',
                    border:'1px solid rgba(255,255,255,0.12)',
                    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3,
                    overflow:'hidden', padding:4,
                  }}
                >
                  <div style={{ fontSize:8, color: h.text_color || '#fff', fontWeight:700, textAlign:'center', overflow:'hidden', maxWidth:52 }}>
                    {(h.brand_name_display || 'Brand').slice(0, 8)}
                  </div>
                  {h.accent_color && (
                    <div style={{ width:20, height:3, borderRadius:2, background: h.accent_color }} />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
