'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PACKAGING_TEMPLATES, getTemplate } from '@/lib/packaging-templates'
import { CREDIT_COSTS } from '@/lib/plan-constants'
import { usePackagingDownload } from './usePackagingDownload'
import type { PackagingViewer3DHandle } from './PackagingViewer3D'

const PackagingViewer3D = dynamic(() => import('./PackagingViewer3D'), { ssr: false })

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
  red:     '#EF4444',
}
const F = "'Tajawal', system-ui, sans-serif"

type ProductType = 'fragrance'|'apparel'|'flower'|'accessory'|'food'|'electronics'|'general'
type SceneStyle  = 'minimal'|'luxury'|'outdoor'|'home'|'fashion'|'abstract'
type OutputMode  = 'shots'|'lifestyle'|'both'

const SCENE_STYLES: { id: SceneStyle; label: string; desc: string }[] = [
  { id: 'minimal',  label: 'بسيط',    desc: 'خلفية نظيفة بيضاء' },
  { id: 'luxury',   label: 'فاخر',    desc: 'مواد متميزة' },
  { id: 'outdoor',  label: 'خارجي',   desc: 'ضوء طبيعي' },
  { id: 'home',     label: 'منزلي',   desc: 'أجواء دافئة' },
  { id: 'fashion',  label: 'أزياء',   desc: 'تصوير إبداعي' },
  { id: 'abstract', label: 'فني',     desc: 'تكوين فني' },
]

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  fragrance:   'عطر',
  apparel:     'ملابس',
  flower:      'ورود',
  accessory:   'إكسسوار',
  food:        'طعام',
  electronics: 'إلكترونيات',
  general:     'عام',
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

export default function ProductLabAr() {
  const supabase = createClient()
  const router   = useRouter()

  const [uploadedUrl, setUploadedUrl]     = useState<string|null>(null)
  const [uploading, setUploading]         = useState(false)
  const [dragOver, setDragOver]           = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [detecting, setDetecting]         = useState(false)
  const [productType, setProductType]     = useState<ProductType>('general')
  const [detectedType, setDetectedType]   = useState<ProductType|null>(null)
  const [detectionNotes, setDetectionNotes] = useState('')
  const [productName, setProductName]     = useState('منتجي')

  const [removingBg, setRemovingBg]       = useState(false)
  const [cleanedUrl, setCleanedUrl]       = useState<string|null>(null)
  const [productId, setProductId]         = useState<string|null>(null)

  const [outputMode, setOutputMode]       = useState<OutputMode>('shots')
  const [sceneStyle, setSceneStyle]       = useState<SceneStyle>('minimal')
  const [shotCount, setShotCount]         = useState(4)

  const [generating, setGenerating]       = useState(false)
  const [generatedShots, setGeneratedShots]       = useState<{id:string;url:string}[]>([])
  const [generatedLifestyle, setGeneratedLifestyle] = useState<{id:string;url:string}[]>([])
  const [error, setError]                 = useState('')

  const [tab, setTab]                     = useState<'shots'|'lifestyle'|'packaging'>('shots')
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
  const [pkgAutoRotate, setPkgAutoRotate] = useState(true)
  const [pkgDlOpen,     setPkgDlOpen]     = useState(false)
  const viewerRef = useRef<PackagingViewer3DHandle>(null)
  const { downloadPNG, downloadHiRes } = usePackagingDownload(viewerRef, pkgDesign, pkgType)

  useEffect(() => {
    supabase.from('workspace_members')
      .select('workspace_id').limit(1).single()
      .then(({ data }) => { if (data) setWorkspaceId(data.workspace_id) })
  }, [])

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { setError('الرجاء رفع صورة'); return }
    setUploading(true); setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('غير مسجل الدخول')
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('media').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path)
      setUploadedUrl(urlData.publicUrl)
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
        setProductName(d.suggested_name || 'منتجي')
        setDetectionNotes(d.notes || '')
        setDetecting(false)
      }
    } catch (e: any) {
      setError(e.message || 'فشل الرفع')
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
        body: JSON.stringify({ workspace_id: workspaceId, product_id: prod?.id || null, image_url: uploadedUrl }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'فشل إزالة الخلفية')
      setCleanedUrl(d.url)
    } catch (e: any) {
      setError(e.message || 'فشل إزالة الخلفية')
    } finally {
      setRemovingBg(false)
    }
  }

  async function handleGenerate() {
    const imageUrl = cleanedUrl || uploadedUrl
    if (!imageUrl || !workspaceId) return
    setGenerating(true); setError('')

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
          body: JSON.stringify({ workspace_id: workspaceId, product_id: pid, cleaned_image_url: imageUrl, product_type: productType, count: shotCount }),
        })
        const d = await res.json()
        if (!res.ok) throw new Error(d.error || 'فشل التوليد')
        setGeneratedShots(d.shots || [])
        setTab('shots')
      }

      if (outputMode === 'lifestyle' || outputMode === 'both') {
        const res = await fetch('/api/product-lab/generate-lifestyle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspace_id: workspaceId, product_id: pid, cleaned_image_url: imageUrl, product_type: productType, scene_style: sceneStyle, count: outputMode === 'both' ? 2 : shotCount }),
        })
        const d = await res.json()
        if (!res.ok) throw new Error(d.error || 'فشل التوليد')
        setGeneratedLifestyle(d.shots || [])
        if (outputMode === 'lifestyle') setTab('lifestyle')
      }
    } catch (e: any) {
      setError(e.message || 'فشل التوليد')
    } finally {
      setGenerating(false)
    }
  }

  function downloadImage(url: string) {
    const a = document.createElement('a')
    a.href = url; a.download = 'product-image.png'; a.click()
  }

  async function sendToStudio(url: string) {
    localStorage.setItem('studio_import_url', url)
    window.location.href = '/dashboard/studio'
  }

  const creditCost = (() => {
    if (outputMode === 'shots') return 5 * shotCount
    if (outputMode === 'lifestyle') return 5 * Math.min(shotCount, 4)
    return 5 * shotCount + 5 * 2
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
          lang: 'ar',
        }),
      })
      const data = await res.json()
      if (!res.ok) { setPkgError(data.error || 'فشل التوليد'); return }
      setPkgDesign({ ...data.design, logo_url: data.logo_url, dims: data.dims })
      setPkgDesignId(data.id)
      setPkgHistory(prev => [{ ...data.design, logo_url: data.logo_url, dims: data.dims }, ...prev].slice(0, 5))
    } catch {
      setPkgError('فشل التوليد')
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
      if (!res.ok) { setPkgError('فشل تصدير PDF'); return }
      window.open(data.pdf_url, '_blank')
    } catch {
      setPkgError('فشل تصدير PDF')
    } finally {
      setPkgExporting(false)
    }
  }

  const hasResults = generatedShots.length > 0 || generatedLifestyle.length > 0
  const imageToShow = cleanedUrl || uploadedUrl

  return (
    <div dir="rtl" style={{ fontFamily:F, letterSpacing:0, background:C.bg, minHeight:'100vh', color:C.t1, padding:'32px 36px' }}>
      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4, flexDirection:'row-reverse', justifyContent:'flex-end' }}>
          <div style={{
            width:36, height:36, borderRadius:10,
            background:C.cyanD, border:`1px solid ${C.cyanB}`,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
          <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:0, margin:0 }}>مختبر المنتج</h1>
        </div>
        <p style={{ fontSize:13, color:C.t3, margin:0, textAlign:'right' }}>ارفع صورة منتجك وأنشئ تصوير احترافي في ثوانٍ.</p>
      </div>

      <div style={{ display:'flex', gap:24, alignItems:'flex-start', flexDirection:'row-reverse' }}>
        {/* ── RIGHT PANEL (results) ── */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {/* Tabs — always visible */}
            <div style={{ display:'flex', flexDirection:'row-reverse', borderBottom:`1px solid ${C.borderS}`, marginBottom:20 }}>
              {[
                { id:'shots',     label:'لقطات الاستوديو', count:generatedShots.length },
                { id:'lifestyle', label:'مشاهد حياتية',    count:generatedLifestyle.length },
                { id:'packaging', label:'التغليف',          count: pkgDesign ? 1 : 0 },
              ].map(t => (
                <button key={t.id}
                  onClick={()=>setTab(t.id as any)}
                  style={{
                    padding:'10px 16px', background:'transparent', border:'none',
                    borderBottom:`2px solid ${tab===t.id ? C.cyan : 'transparent'}`,
                    fontSize:13, fontWeight: tab===t.id ? 600 : 400,
                    color: tab===t.id ? C.t1 : C.t3,
                    cursor:'pointer', marginBottom:'-1px',
                    display:'flex', alignItems:'center', gap:6, fontFamily:F, letterSpacing:0,
                  }}
                >
                  {t.label}
                  {t.count > 0 && (
                    <span style={{ background:C.cyanD, color:C.cyan, borderRadius:10, padding:'1px 6px', fontSize:10, fontWeight:700 }}>{t.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Loading state */}
            {generating && (
              <div style={{
                background:C.cyanD, border:`1px solid ${C.cyanB}`,
                borderRadius:12, padding:'24px',
                display:'flex', alignItems:'center', gap:12, marginBottom:20, flexDirection:'row-reverse',
              }}>
                <LoadingDots/>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:13, fontWeight:500, color:C.t1 }}>جاري توليد صورك…</div>
                  <div style={{ fontSize:12, color:C.t3, marginTop:2 }}>قد يستغرق ذلك 30–60 ثانية</div>
                </div>
              </div>
            )}

            {/* Shots tab */}
            {tab === 'shots' && (
              <div>
                {generatedShots.length > 0 ? (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:12 }}>
                    {generatedShots.map(shot => (
                      <ImageCardAr key={shot.id} url={shot.url} onDownload={()=>downloadImage(shot.url)} onSendToStudio={()=>sendToStudio(shot.url)} onRegenerate={handleGenerate} />
                    ))}
                  </div>
                ) : (
                  !generating && (
                    <div style={{
                      background:C.surface, border:`1px solid ${C.borderS}`,
                      borderRadius:14, padding:'64px 32px',
                      display:'flex', flexDirection:'column', alignItems:'center', gap:16, textAlign:'center',
                    }}>
                      <div style={{ color:C.t4 }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontSize:16, fontWeight:600, color:C.t2, marginBottom:4 }}>ستظهر صورك هنا</div>
                        <div style={{ fontSize:13, color:C.t4 }}>ارفع صورة المنتج واضغط توليد</div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Lifestyle tab */}
            {tab === 'lifestyle' && (
              <div>
                {generatedLifestyle.length > 0 ? (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:12 }}>
                    {generatedLifestyle.map(shot => (
                      <ImageCardAr key={shot.id} url={shot.url} onDownload={()=>downloadImage(shot.url)} onSendToStudio={()=>sendToStudio(shot.url)} onRegenerate={handleGenerate} />
                    ))}
                  </div>
                ) : (
                  !generating && <EmptyTabAr label="لا توجد مشاهد حياتية بعد" sub="اختر 'مشاهد حياتية' ثم اضغط توليد" />
                )}
              </div>
            )}

            {/* تبويب التغليف — فتح الاستوديو المستقل */}
            {tab === 'packaging' && (
              <div dir="rtl" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:400, padding:'48px 24px' }}>
                <div style={{
                  maxWidth:480, width:'100%', textAlign:'center',
                  padding:'48px 40px',
                  background:'rgba(255,255,255,0.02)',
                  border:`1px solid rgba(255,255,255,0.08)`,
                  borderRadius:20,
                  fontFamily:FA,
                }}>
                  <div style={{ fontSize:48, marginBottom:24, lineHeight:1 }}>📦</div>
                  <div style={{ fontSize:22, fontWeight:700, color:'#FFFFFF', marginBottom:10, letterSpacing:0 }}>
                    استوديو التغليف
                  </div>
                  <div style={{ fontSize:14, color:'rgba(255,255,255,0.65)', lineHeight:1.8, marginBottom:28, letterSpacing:0 }}>
                    صمّم تغليفاً احترافياً لمنتجاتك. اختر من أكثر من 14 نوعاً، وولّد تصاميم متوافقة مع علامتك التجارية بالذكاء الاصطناعي، أو ارفع تصميمك الخاص.
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, justifyContent:'center', marginBottom:28 }}>
                    {['معاينة ثلاثية الأبعاد','تصميم AI','محرر مرئي','PDF للطباعة','14+ قالب'].map(f => (
                      <span key={f} style={{
                        fontSize:11, padding:'4px 10px', borderRadius:99, letterSpacing:0,
                        background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)',
                        color:'rgba(255,255,255,0.35)',
                      }}>{f}</span>
                    ))}
                  </div>
                  <button
                    onClick={() => router.push('/dashboard/product-lab/packaging')}
                    style={{
                      padding:'14px 32px', borderRadius:12, fontSize:14, fontWeight:700,
                      background:'#FFFFFF', color:'#0C0C0C', border:'none', cursor:'pointer',
                      transition:'all 0.15s', display:'inline-flex', alignItems:'center', gap:8,
                      letterSpacing:0,
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.88)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='#FFFFFF'}
                  >
                    افتح استوديو التغليف ←
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── LEFT PANEL (controls) ── */}
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
              borderRadius:14, overflow:'hidden',
              cursor: uploadedUrl ? 'default' : 'pointer',
              transition:'all 0.2s',
              minHeight: uploadedUrl ? 'auto' : 180,
              display:'flex', alignItems:'center', justifyContent:'center',
              flexDirection:'column', gap:12, position:'relative',
            }}
          >
            {imageToShow ? (
              <>
                <img src={imageToShow} alt="Product" style={{ width:'100%', aspectRatio:'1', objectFit:'contain', display:'block', background:'#fff', borderRadius:12 }} />
                {cleanedUrl && (
                  <div style={{
                    position:'absolute', top:10, right:10,
                    background:C.greenD, border:`1px solid ${C.green}`,
                    borderRadius:6, padding:'3px 8px',
                    fontSize:11, fontWeight:600, color:C.green,
                    display:'flex', alignItems:'center', gap:4,
                  }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    تمت إزالة الخلفية
                  </div>
                )}
                <button
                  onClick={e=>{ e.stopPropagation(); setUploadedUrl(null); setCleanedUrl(null); setDetectedType(null); setProductId(null); setGeneratedShots([]); setGeneratedLifestyle([]) }}
                  style={{
                    position:'absolute', top:10, left:10,
                    width:28, height:28, borderRadius:8,
                    background:'rgba(0,0,0,0.6)', border:`1px solid ${C.border}`,
                    color:C.t2, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14,
                  }}
                >✕</button>
              </>
            ) : (
              <>
                {uploading ? (
                  <><LoadingDots/><span style={{ fontSize:13, color:C.t3, fontFamily:F, letterSpacing:0 }}>جاري الرفع…</span></>
                ) : (
                  <>
                    <div style={{ color:C.t4 }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    </div>
                    <div style={{ textAlign:'center', fontFamily:F, letterSpacing:0 }}>
                      <div style={{ fontSize:13, fontWeight:500, color:C.t2 }}>أفلت صورة المنتج هنا</div>
                      <div style={{ fontSize:12, color:C.t4, marginTop:3 }}>أو انقر للاختيار · PNG, JPG, WEBP</div>
                    </div>
                  </>
                )}
              </>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }}
              onChange={e=>{ const f=e.target.files?.[0]; if(f) handleFile(f) }}/>
          </div>

          {/* Detection */}
          {uploadedUrl && (
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:'12px 16px', display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexDirection:'row-reverse' }}>
                <div style={{ fontSize:11, fontWeight:600, letterSpacing:0, textTransform:'uppercase', color:C.t4 }}>المنتج</div>
                {detecting && <div style={{ fontSize:11, color:C.cyan, display:'flex', alignItems:'center', gap:4 }}>
                  <LoadingDots/> جاري الكشف…
                </div>}
                {detectedType && !detecting && (
                  <div style={{ background:C.cyanD, border:`1px solid ${C.cyanB}`, borderRadius:6, padding:'2px 8px', fontSize:11, fontWeight:600, color:C.cyan }}>
                    تم الكشف تلقائياً
                  </div>
                )}
              </div>
              <input
                value={productName}
                onChange={e=>setProductName(e.target.value)}
                placeholder="اسم المنتج"
                dir="rtl"
                style={{
                  background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border}`,
                  borderRadius:8, padding:'8px 12px', fontSize:13, color:C.t1,
                  fontFamily:F, letterSpacing:0, outline:'none', width:'100%', boxSizing:'border-box',
                  textAlign:'right',
                }}
              />
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, justifyContent:'flex-end' }}>
                {(Object.keys(PRODUCT_TYPE_LABELS) as ProductType[]).map(type => (
                  <button key={type} onClick={()=>setProductType(type)}
                    style={{
                      padding:'4px 10px', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer', border:'1px solid',
                      background: productType===type ? C.cyanD : 'transparent',
                      borderColor: productType===type ? C.cyanB : C.border,
                      color: productType===type ? C.cyan : C.t3,
                      fontFamily:F, letterSpacing:0,
                    }}
                  >{PRODUCT_TYPE_LABELS[type]}</button>
                ))}
              </div>
              {detectionNotes && <div style={{ fontSize:11, color:C.t3, lineHeight:1.5, textAlign:'right' }}>{detectionNotes}</div>}
            </div>
          )}

          {/* Background Removal */}
          {uploadedUrl && !cleanedUrl && (
            <button onClick={handleRemoveBg} disabled={removingBg}
              style={{
                background: removingBg ? 'rgba(255,255,255,0.04)' : C.over,
                border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 16px',
                display:'flex', alignItems:'center', gap:8, cursor: removingBg ? 'not-allowed' : 'pointer',
                color: removingBg ? C.t4 : C.t2, fontSize:13, fontWeight:500,
                fontFamily:F, letterSpacing:0, flexDirection:'row-reverse',
              }}
            >
              {removingBg ? (
                <><LoadingDots/> جاري إزالة الخلفية… <span style={{ marginRight:'auto', fontSize:11, color:C.t4 }}>٢ cr</span></>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                  </svg>
                  إزالة الخلفية
                  <span style={{ marginRight:'auto', fontSize:11, color:C.t4 }}>٢ cr</span>
                </>
              )}
            </button>
          )}

          {/* Output selection */}
          {uploadedUrl && (
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:'16px', display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ fontSize:11, fontWeight:600, letterSpacing:0, textTransform:'uppercase', color:C.t4, textAlign:'right' }}>نوع الإخراج</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {([
                  { id:'shots',     label:'لقطات الاستوديو', desc:'خلفية بيضاء · 4 زوايا',  cost:'٥ cr' },
                  { id:'lifestyle', label:'مشاهد حياتية',    desc:'بيئات مصممة',             cost:'٥ cr' },
                  { id:'both',      label:'كلاهما',          desc:'لقطات + مشاهد حياتية',   cost:'٥ cr' },
                ] as { id:OutputMode; label:string; desc:string; cost:string }[]).map(o => (
                  <button key={o.id} onClick={()=>setOutputMode(o.id)}
                    style={{
                      background: outputMode===o.id ? C.cyanD : 'transparent',
                      border:`1px solid ${outputMode===o.id ? C.cyanB : C.borderS}`,
                      borderRadius:8, padding:'10px 12px', cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'space-between', flexDirection:'row-reverse',
                      fontFamily:F, letterSpacing:0,
                    }}
                  >
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:2 }}>
                      <span style={{ fontSize:13, fontWeight:500, color: outputMode===o.id ? C.cyan : C.t1 }}>{o.label}</span>
                      <span style={{ fontSize:11, color:C.t3 }}>{o.desc}</span>
                    </div>
                    <span style={{ fontSize:11, color: outputMode===o.id ? C.cyan : C.t4 }}>{o.cost}</span>
                  </button>
                ))}
              </div>

              {(outputMode === 'shots' || outputMode === 'both') && (
                <div>
                  <div style={{ fontSize:11, color:C.t4, marginBottom:6, textAlign:'right' }}>عدد اللقطات ({shotCount})</div>
                  <div style={{ display:'flex', gap:6 }}>
                    {[1,2,3,4].map(n => (
                      <button key={n} onClick={()=>setShotCount(n)}
                        style={{
                          flex:1, padding:'6px 0', borderRadius:6, fontSize:12, fontWeight:600,
                          cursor:'pointer', border:'1px solid',
                          background: shotCount===n ? C.cyanD : 'transparent',
                          borderColor: shotCount===n ? C.cyanB : C.border,
                          color: shotCount===n ? C.cyan : C.t3,
                          fontFamily:F, letterSpacing:0,
                        }}>{n}</button>
                    ))}
                  </div>
                </div>
              )}

              {(outputMode === 'lifestyle' || outputMode === 'both') && (
                <div>
                  <div style={{ fontSize:11, color:C.t4, marginBottom:6, textAlign:'right' }}>أسلوب المشهد</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, justifyContent:'flex-end' }}>
                    {SCENE_STYLES.map(s => (
                      <button key={s.id} onClick={()=>setSceneStyle(s.id)}
                        title={s.desc}
                        style={{
                          padding:'5px 10px', borderRadius:6, fontSize:11, fontWeight:600,
                          cursor:'pointer', border:'1px solid',
                          background: sceneStyle===s.id ? C.cyanD : 'transparent',
                          borderColor: sceneStyle===s.id ? C.cyanB : C.border,
                          color: sceneStyle===s.id ? C.cyan : C.t3,
                          fontFamily:F, letterSpacing:0,
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
                display:'flex', alignItems:'center', justifyContent:'space-between', flexDirection:'row-reverse',
              }}>
                <span style={{ fontSize:12, color:C.t2, fontFamily:F, letterSpacing:0 }}>الرصيد المطلوب</span>
                <span style={{ fontSize:13, fontWeight:700, color:C.cyan }}>{creditCost} cr</span>
              </div>

              {error && (
                <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.20)', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#EF4444', textAlign:'right', fontFamily:F, letterSpacing:0 }}>{error}</div>
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
                  fontFamily:F, letterSpacing:0,
                }}
              >
                {generating ? (
                  <><LoadingDots/> جاري التوليد…</>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
                    </svg>
                    توليد
                  </>
                )}
              </button>
            </div>
          )}

          {/* Empty hint */}
          {!uploadedUrl && !uploading && (
            <div style={{ background:C.surface, border:`1px solid ${C.borderS}`, borderRadius:10, padding:'16px', display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ fontSize:11, fontWeight:600, letterSpacing:0, textTransform:'uppercase', color:C.t4, textAlign:'right' }}>كيف يعمل</div>
              {[
                { icon:'①', text:'ارفع صورة منتجك' },
                { icon:'②', text:'أزل الخلفية (اختياري)' },
                { icon:'③', text:'اختر نوع الإخراج والأسلوب' },
                { icon:'④', text:'أنشئ لقطات احترافية' },
              ].map(step => (
                <div key={step.icon} style={{ display:'flex', gap:10, alignItems:'center', flexDirection:'row-reverse' }}>
                  <span style={{ fontSize:14, color:C.cyan, width:18, flexShrink:0, textAlign:'center' }}>{step.icon}</span>
                  <span style={{ fontSize:12, color:C.t2, textAlign:'right' }}>{step.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ImageCardAr({ url, onDownload, onSendToStudio, onRegenerate }: {
  url: string
  onDownload: () => void
  onSendToStudio: () => void
  onRegenerate: () => void
}) {
  const [hover, setHover] = useState(false)
  const F2 = "'Tajawal', system-ui, sans-serif"
  return (
    <div
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>setHover(false)}
      style={{
        background:'#141414', border:`1px solid ${hover ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.10)'}`,
        borderRadius:12, overflow:'hidden', position:'relative', transition:'border-color 0.15s',
      }}
    >
      <img src={url} alt="Generated" style={{ width:'100%', aspectRatio:'1', objectFit:'cover', display:'block' }}/>
      {hover && (
        <div style={{
          position:'absolute', inset:0, background:'rgba(0,0,0,0.55)',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, padding:12,
        }}>
          {[
            { label:'تنزيل',          fn: onDownload },
            { label:'إرسال للاستوديو', fn: onSendToStudio },
            { label:'توليد مجدداً',    fn: onRegenerate },
          ].map(btn => (
            <button key={btn.label} onClick={btn.fn}
              style={{
                background:'rgba(255,255,255,0.10)', border:'1px solid rgba(255,255,255,0.16)',
                borderRadius:8, padding:'7px 14px', width:'100%',
                display:'flex', alignItems:'center', gap:6, justifyContent:'center',
                color:'#fff', fontSize:12, fontWeight:500, cursor:'pointer',
                fontFamily:F2, letterSpacing:0,
              }}
            >{btn.label}</button>
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyTabAr({ label, sub }: { label: string; sub: string }) {
  const F2 = "'Tajawal', system-ui, sans-serif"
  return (
    <div style={{
      background:'#141414', border:'1px solid rgba(255,255,255,0.06)',
      borderRadius:12, padding:'48px 24px',
      display:'flex', flexDirection:'column', alignItems:'center', gap:8, textAlign:'center',
    }}>
      <div style={{ fontSize:14, fontWeight:500, color:'rgba(255,255,255,0.35)', fontFamily:F2, letterSpacing:0 }}>{label}</div>
      <div style={{ fontSize:12, color:'rgba(255,255,255,0.20)', fontFamily:F2, letterSpacing:0 }}>{sub}</div>
    </div>
  )
}

const FA = "'Tajawal', system-ui, sans-serif"

const PKG_ICONS_AR: Record<string, JSX.Element> = {
  bag:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  box:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  label:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  pouch:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z"/><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/><line x1="4" y1="11" x2="20" y2="11"/></svg>,
  sleeve: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20M2 14h20"/></svg>,
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function shadeColorAr(hex: string, pct: number): string {
  try {
    const n = parseInt(hex.replace('#',''), 16)
    const r = Math.min(255, Math.max(0, (n>>16) + pct))
    const g = Math.min(255, Math.max(0, ((n>>8)&0xff) + pct))
    const b = Math.min(255, Math.max(0, (n&0xff) + pct))
    return `rgb(${r},${g},${b})`
  } catch { return hex }
}

const PKG_LOADING_MSGS_AR = ['تعيين القوام على الشكل…', 'ضبط إضاءة الاستوديو…', 'عرض النموذج ثلاثي الأبعاد…', 'يكاد ينتهي…']

function Pkg3DLoadingAr() {
  const [msg, setMsg] = useState(PKG_LOADING_MSGS_AR[0])
  useEffect(() => {
    let i = 0
    const iv = setInterval(() => { i = (i + 1) % PKG_LOADING_MSGS_AR.length; setMsg(PKG_LOADING_MSGS_AR[i]) }, 1400)
    return () => clearInterval(iv)
  }, [])
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
      <LoadingDotsAr/>
      <div style={{ fontSize:13, color:'rgba(255,255,255,0.35)', fontFamily:FA, letterSpacing:0 }}>{msg}</div>
    </div>
  )
}

function LoadingDotsAr() {
  return (
    <span style={{ display:'inline-flex', gap:3, alignItems:'center' }}>
      {[0,1,2].map(i => (
        <span key={i} style={{ width:4, height:4, borderRadius:'50%', background:'#00AAFF', animation:`dot-pulse 1.2s ease-in-out ${i*0.2}s infinite` }}/>
      ))}
    </span>
  )
}

function PackagingTabAr({
  pkgType, setPkgType, pkgSizeId, setPkgSizeId,
  pkgCustomW, setPkgCustomW, pkgCustomH, setPkgCustomH,
  pkgGenerating, pkgDesign, setPkgDesign, pkgDesignId,
  pkgExporting, pkgEditField, setPkgEditField,
  pkgHistory, pkgSpecOpen, setPkgSpecOpen,
  pkgError, pkgAutoRotate, setPkgAutoRotate,
  pkgDlOpen, setPkgDlOpen, viewerRef,
  onGenerate, onExportPDF, onDownloadPNG, onDownloadHiRes,
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
  pkgHistory: any[]
  pkgSpecOpen: boolean; setPkgSpecOpen: (o: boolean) => void
  pkgError: string
  pkgAutoRotate: boolean; setPkgAutoRotate: (v: boolean) => void
  pkgDlOpen: boolean; setPkgDlOpen: (v: boolean) => void
  viewerRef: React.RefObject<PackagingViewer3DHandle | null>
  onGenerate: (isRegen?: boolean) => void
  onExportPDF: () => void
  onDownloadPNG: () => void
  onDownloadHiRes: () => void
}) {
  const tmpl = getTemplate(pkgType)
  const selectedSize = tmpl?.sizes.find(s => s.id === pkgSizeId)
  const dims = selectedSize?.dims

  const editableFields = [
    { key:'bg_color',           label:'الخلفية',    type:'color' },
    { key:'text_color',         label:'النص',       type:'color' },
    { key:'accent_color',       label:'التمييز',    type:'color' },
    { key:'brand_name_display', label:'اسم العلامة', type:'text' },
    { key:'tagline_display',    label:'التاغلاين',  type:'text' },
    { key:'main_copy',          label:'النص الرئيسي', type:'textarea' },
  ]

  return (
    <div dir="rtl" style={{ display:'flex', gap:24, flexDirection:'row-reverse' }}>
      {/* ── RIGHT CONTROLS ── */}
      <div style={{ width:320, flexShrink:0, display:'flex', flexDirection:'column', gap:14 }}>

        {/* Packaging type */}
        <div style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:10, padding:'14px 16px' }}>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:0, textTransform:'uppercase', color:'rgba(255,255,255,0.25)', marginBottom:10, textAlign:'right', fontFamily:FA }}>
            نوع التغليف
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
            {PACKAGING_TEMPLATES.map(t => (
              <button key={t.id} onClick={()=>setPkgType(t.id)}
                style={{
                  background: pkgType===t.id ? 'rgba(0,170,255,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${pkgType===t.id ? 'rgba(0,170,255,0.22)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius:10, padding:'12px 14px', cursor:'pointer',
                  display:'flex', alignItems:'center', gap:8, flexDirection:'row-reverse',
                  color: pkgType===t.id ? '#00AAFF' : 'rgba(255,255,255,0.50)',
                  fontSize:12, fontWeight: pkgType===t.id ? 600 : 400,
                  transition:'all 0.14s', fontFamily:FA, letterSpacing:0, height:46,
                }}
              >
                {PKG_ICONS_AR[t.id]}
                {t.name_ar}
              </button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:10, padding:'14px 16px' }}>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:0, textTransform:'uppercase', color:'rgba(255,255,255,0.25)', marginBottom:8, textAlign:'right', fontFamily:FA }}>
            الحجم
          </div>
          <div style={{ position:'relative' }}>
            <select value={pkgSizeId} onChange={e=>setPkgSizeId(e.target.value)} dir="rtl"
              style={{ width:'100%', padding:'10px 14px', borderRadius:9, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.10)', color:'#FFFFFF', fontSize:13, fontFamily:FA, letterSpacing:0, outline:'none', cursor:'pointer', appearance:'none' as any, textAlign:'right' }}>
              {tmpl?.sizes.map(s => (
                <option key={s.id} value={s.id} style={{ background:'#1A1A1A' }}>{s.label_ar}</option>
              ))}
            </select>
            <div style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'rgba(255,255,255,0.35)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
            </div>
          </div>

          {pkgSizeId === 'label_custom' && (
            <div style={{ display:'flex', gap:8, marginTop:8, flexDirection:'row-reverse' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.30)', marginBottom:4, textAlign:'right', fontFamily:FA, letterSpacing:0 }}>العرض (mm)</div>
                <input type="number" value={pkgCustomW} onChange={e=>setPkgCustomW(Number(e.target.value))}
                  style={{ width:'100%', padding:'7px 10px', borderRadius:7, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.10)', color:'#fff', fontSize:12, fontFamily:FA, letterSpacing:0, outline:'none', boxSizing:'border-box' as const }} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.30)', marginBottom:4, textAlign:'right', fontFamily:FA, letterSpacing:0 }}>الارتفاع (mm)</div>
                <input type="number" value={pkgCustomH} onChange={e=>setPkgCustomH(Number(e.target.value))}
                  style={{ width:'100%', padding:'7px 10px', borderRadius:7, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.10)', color:'#fff', fontSize:12, fontFamily:FA, letterSpacing:0, outline:'none', boxSizing:'border-box' as const }} />
              </div>
            </div>
          )}

          {dims && pkgSizeId !== 'label_custom' && (
            <div style={{ marginTop:8, fontSize:11, color:'rgba(255,255,255,0.25)', fontFamily:FA, letterSpacing:0, textAlign:'right' }}>
              {dims.width_mm}×{dims.height_mm}mm{dims.depth_mm ? `×${dims.depth_mm}mm` : ''} · يشمل {dims.bleed_mm}mm bleed
            </div>
          )}
        </div>

        {/* Editable fields */}
        {pkgDesign && (
          <div style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:10, padding:'14px 16px', display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ fontSize:10, fontWeight:600, letterSpacing:0, textTransform:'uppercase', color:'rgba(255,255,255,0.25)', textAlign:'right', fontFamily:FA }}>
              إعدادات البراند
            </div>
            {editableFields.map(f => (
              <div key={f.key}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.30)', marginBottom:3, textAlign:'right', fontFamily:FA, letterSpacing:0 }}>{f.label}</div>
                {pkgEditField === f.key ? (
                  f.type === 'textarea' ? (
                    <textarea autoFocus dir="rtl" defaultValue={pkgDesign[f.key] || ''}
                      onBlur={e=>{ setPkgDesign({...pkgDesign,[f.key]:e.target.value}); setPkgEditField(null) }}
                      style={{ width:'100%', padding:'6px 10px', borderRadius:7, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(0,170,255,0.30)', color:'#fff', fontSize:12, fontFamily:FA, letterSpacing:0, outline:'none', resize:'none', boxSizing:'border-box' as const }}
                      rows={3} />
                  ) : f.type === 'color' ? (
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexDirection:'row-reverse' }}>
                      <input type="color" value={pkgDesign[f.key]||'#000000'}
                        onChange={e=>setPkgDesign({...pkgDesign,[f.key]:e.target.value})}
                        onBlur={()=>setPkgEditField(null)}
                        style={{ width:36, height:28, borderRadius:6, border:'none', cursor:'pointer', background:'none' }}/>
                      <span style={{ fontSize:12, color:'rgba(255,255,255,0.60)', fontFamily:"'Geist Mono', monospace" }}>{pkgDesign[f.key]}</span>
                    </div>
                  ) : (
                    <input autoFocus dir="rtl" type="text" defaultValue={pkgDesign[f.key]||''}
                      onBlur={e=>{ setPkgDesign({...pkgDesign,[f.key]:e.target.value}); setPkgEditField(null) }}
                      onKeyDown={e=>{ if(e.key==='Enter'){setPkgDesign({...pkgDesign,[f.key]:(e.target as HTMLInputElement).value});setPkgEditField(null)} }}
                      style={{ width:'100%', padding:'6px 10px', borderRadius:7, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(0,170,255,0.30)', color:'#fff', fontSize:12, fontFamily:FA, letterSpacing:0, outline:'none', boxSizing:'border-box' as const, textAlign:'right' }} />
                  )
                ) : (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexDirection:'row-reverse' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0, flexDirection:'row-reverse' }}>
                      {f.type === 'color' && <div style={{ width:20, height:20, borderRadius:4, background:pkgDesign[f.key]||'#000', border:'1px solid rgba(255,255,255,0.15)', flexShrink:0 }}/>}
                      <span style={{ fontSize:12, color:'rgba(255,255,255,0.55)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:180, fontFamily:FA, letterSpacing:0, textAlign:'right' }}>
                        {pkgDesign[f.key]||'—'}
                      </span>
                    </div>
                    <button onClick={()=>setPkgEditField(f.key)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.25)', padding:3, display:'flex', alignItems:'center', flexShrink:0 }}>
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

        {pkgError && (
          <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.20)', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#EF4444', textAlign:'right', fontFamily:FA, letterSpacing:0 }}>
            {pkgError}
          </div>
        )}

        {/* Buttons */}
        {!pkgDesign ? (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ background:'rgba(0,170,255,0.08)', border:'1px solid rgba(0,170,255,0.18)', borderRadius:8, padding:'8px 12px', display:'flex', justifyContent:'space-between', alignItems:'center', flexDirection:'row-reverse' }}>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.65)', fontFamily:FA, letterSpacing:0 }}>الرصيد المطلوب</span>
              <span style={{ fontSize:13, fontWeight:700, color:'#00AAFF' }}>{CREDIT_COSTS.packaging_generate} cr</span>
            </div>
            <button onClick={()=>onGenerate(false)} disabled={pkgGenerating}
              style={{ background: pkgGenerating ? 'rgba(255,255,255,0.06)' : '#FFFFFF', color: pkgGenerating ? 'rgba(255,255,255,0.35)' : '#0C0C0C', border:'none', borderRadius:10, padding:'12px 20px', fontSize:14, fontWeight:700, cursor: pkgGenerating ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:FA, letterSpacing:0 }}>
              {pkgGenerating ? <><LoadingDotsAr/> جاري التوليد…</> : <>✦ توليد التغليف →</>}
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>onGenerate(true)} disabled={pkgGenerating}
              style={{ flex:1, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'10px 14px', fontSize:12, fontWeight:600, cursor:'pointer', color: pkgGenerating ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.70)', display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontFamily:FA, letterSpacing:0 }}>
              {pkgGenerating ? <LoadingDotsAr/> : '↺'} إعادة التوليد
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.30)' }}>5 cr</span>
            </button>
            <button onClick={onExportPDF} disabled={pkgExporting}
              style={{ flex:1, background:'rgba(0,170,255,0.10)', border:'1px solid rgba(0,170,255,0.22)', borderRadius:10, padding:'10px 14px', fontSize:12, fontWeight:700, cursor:'pointer', color: pkgExporting ? 'rgba(0,170,255,0.40)' : '#00AAFF', display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontFamily:FA, letterSpacing:0 }}>
              {pkgExporting ? <LoadingDotsAr/> : '↓'} تصدير PDF →
            </button>
          </div>
        )}
      </div>

      {/* ── LEFT PANEL: 3D VIEWER ── */}
      <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:12 }}>

        {/* Viewer container */}
        <div style={{
          background:'#0C0C0C', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14,
          overflow:'hidden', position:'relative',
          display:'flex', alignItems:'center', justifyContent:'center',
          minHeight:360,
        }}>
          {!pkgDesign && !pkgGenerating ? (
            <div style={{ padding:'40px 32px', display:'flex', flexDirection:'column', alignItems:'center', gap:12, textAlign:'center' }}>
              <div style={{ color:'rgba(255,255,255,0.15)' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
              </div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.30)', fontFamily:FA, letterSpacing:0 }}>جهّز التغليف وولّد تصميمك</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.18)', fontFamily:FA, letterSpacing:0 }}>النموذج ثلاثي الأبعاد سيظهر هنا</div>
            </div>
          ) : pkgGenerating ? (
            <div style={{ padding:'40px 32px' }}><Pkg3DLoadingAr/></div>
          ) : (
            <PackagingViewer3D
              ref={viewerRef as any}
              design={pkgDesign}
              packagingType={pkgType as any}
              autoRotate={pkgAutoRotate}
              width={520}
              height={380}
            />
          )}

          {/* Viewer controls */}
          {pkgDesign && !pkgGenerating && (
            <div style={{ position:'absolute', bottom:10, left:10, display:'flex', gap:6 }}>
              <button
                onClick={()=>setPkgAutoRotate(!pkgAutoRotate)}
                title={pkgAutoRotate ? 'إيقاف الدوران' : 'تشغيل الدوران'}
                style={{
                  background:'rgba(0,0,0,0.60)', border:'1px solid rgba(255,255,255,0.14)',
                  borderRadius:7, padding:'5px 8px', cursor:'pointer',
                  fontSize:11, color:pkgAutoRotate ? '#00AAFF' : 'rgba(255,255,255,0.35)',
                  display:'flex', alignItems:'center', gap:4, fontFamily:FA, letterSpacing:0,
                }}
              >
                {pkgAutoRotate ? '⏸' : '▶'} {pkgAutoRotate ? 'إيقاف' : 'دوران'}
              </button>
              <div style={{ position:'relative' }}>
                <button
                  onClick={()=>setPkgDlOpen(!pkgDlOpen)}
                  style={{
                    background:'rgba(0,170,255,0.18)', border:'1px solid rgba(0,170,255,0.35)',
                    borderRadius:7, padding:'5px 10px', cursor:'pointer',
                    fontSize:11, fontWeight:600, color:'#00AAFF',
                    display:'flex', alignItems:'center', gap:5, fontFamily:FA, letterSpacing:0,
                  }}
                >
                  ↓ تصدير ▾
                </button>
                {pkgDlOpen && (
                  <div style={{
                    position:'absolute', bottom:'calc(100% + 6px)', left:0,
                    background:'#1A1A1A', border:'1px solid rgba(255,255,255,0.10)',
                    borderRadius:9, padding:6, minWidth:170, zIndex:50,
                    display:'flex', flexDirection:'column', gap:2, direction:'rtl',
                  }}>
                    {[
                      { label:'PNG ثلاثي الأبعاد', fn:()=>{ onDownloadPNG(); setPkgDlOpen(false) } },
                      { label:'طباعة 4K عالية الدقة', fn:()=>{ onDownloadHiRes(); setPkgDlOpen(false) } },
                      { label:'PDF Dieline', fn:()=>{ onExportPDF(); setPkgDlOpen(false) } },
                    ].map(item => (
                      <button key={item.label} onClick={item.fn}
                        style={{
                          background:'transparent', border:'none', cursor:'pointer',
                          padding:'8px 10px', borderRadius:6, textAlign:'right',
                          fontSize:12, color:'rgba(255,255,255,0.65)', fontFamily:FA, letterSpacing:0,
                        }}
                        onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.06)')}
                        onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
                      >{item.label}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {pkgDesign && !pkgGenerating && (
            <div style={{ position:'absolute', bottom:10, right:10, fontSize:10, color:'rgba(255,255,255,0.20)', fontFamily:FA, letterSpacing:0, pointerEvents:'none' }}>
              اسحب للتدوير · اضغط تصدير للتنزيل
            </div>
          )}
        </div>

        {pkgDesign && (
          <div style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, overflow:'hidden' }}>
            <button onClick={()=>setPkgSpecOpen(!pkgSpecOpen)}
              style={{ width:'100%', padding:'12px 16px', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', flexDirection:'row-reverse', fontFamily:FA }}>
              <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.55)', letterSpacing:0 }}>مواصفات التصميم</span>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.30)' }}>{pkgSpecOpen ? '↑' : '↓'}</span>
            </button>
            {pkgSpecOpen && (
              <div style={{ padding:'0 16px 14px', display:'flex', flexDirection:'column', gap:5 }}>
                {[
                  ['الأسلوب',   pkgDesign.design_style],
                  ['التخطيط',   pkgDesign.layout],
                  ['الخط',      pkgDesign.font_weight],
                  ['العناصر',   (pkgDesign.special_elements||[]).join('، ')],
                  ['نص ثانوي',  pkgDesign.secondary_copy],
                  ['الأبعاد',   pkgDesign.dims ? `${pkgDesign.dims.width_mm}×${pkgDesign.dims.height_mm}mm` : null],
                ].filter(([,v])=>v).map(([k,v]) => (
                  <div key={k as string} style={{ display:'flex', gap:8, fontSize:12, flexDirection:'row-reverse' }}>
                    <span style={{ color:'rgba(255,255,255,0.30)', width:70, flexShrink:0, textAlign:'right', fontFamily:FA, letterSpacing:0 }}>{k}</span>
                    <span style={{ color:'rgba(255,255,255,0.65)', textAlign:'right', fontFamily:FA, letterSpacing:0 }}>{v}</span>
                  </div>
                ))}
                {pkgDesign.print_notes && (
                  <div style={{ marginTop:4, fontSize:11, color:'rgba(255,255,255,0.30)', fontStyle:'italic', textAlign:'right', fontFamily:FA, letterSpacing:0 }}>{pkgDesign.print_notes}</div>
                )}
              </div>
            )}
          </div>
        )}

        {pkgHistory.length > 1 && (
          <div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)', marginBottom:8, textAlign:'right', fontFamily:FA, letterSpacing:0 }}>التصاميم السابقة</div>
            <div style={{ display:'flex', gap:8, flexDirection:'row-reverse' }}>
              {pkgHistory.slice(1, 5).map((h, i) => (
                <button key={i} onClick={()=>setPkgDesign(h)} title={h.brand_name_display||'تصميم'}
                  style={{ width:60, height:60, borderRadius:8, cursor:'pointer', background:h.bg_color||'#1A1A1A', border:'1px solid rgba(255,255,255,0.12)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, overflow:'hidden', padding:4 }}>
                  <div style={{ fontSize:8, color:h.text_color||'#fff', fontWeight:700, textAlign:'center', overflow:'hidden', maxWidth:52, fontFamily:FA, letterSpacing:0 }}>
                    {(h.brand_name_display||'براند').slice(0,8)}
                  </div>
                  {h.accent_color && <div style={{ width:20, height:3, borderRadius:2, background:h.accent_color }}/>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
