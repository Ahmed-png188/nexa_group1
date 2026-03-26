'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CREDIT_COSTS } from '@/lib/plan-constants'

const C = {
  bg:'#0C0C0C', surface:'#141414', over:'#1A1A1A',
  border:'rgba(255,255,255,0.10)', borderS:'rgba(255,255,255,0.06)',
  cyan:'#00AAFF', cyanD:'rgba(0,170,255,0.12)', cyanB:'rgba(0,170,255,0.22)',
  t1:'#FFFFFF', t2:'rgba(255,255,255,0.65)', t3:'rgba(255,255,255,0.35)', t4:'rgba(255,255,255,0.18)',
  green:'#22C55E', greenD:'rgba(34,197,94,0.12)',
}
const AR = "'Tajawal', system-ui, sans-serif"
const MONO = "'Geist Mono', monospace"

type Stage = 'upload' | 'analyzing' | 'configure' | 'shooting' | 'gallery'
type OutputType = 'studio' | 'lifestyle' | 'both'
type ShotStyle = 'hero' | 'angle_34' | 'top_down' | 'detail' | 'side_profile' | 'floating'
interface Asset { id: string; url: string; type: 'studio' | 'lifestyle' | 'edit'; style?: string; scene?: string; label?: string }

const SHOT_STYLES: { id: ShotStyle; label: string; desc: string }[] = [
  { id: 'hero',         label: 'الصورة الرئيسية',   desc: 'أمامي مباشر' },
  { id: 'angle_34',     label: 'زاوية ثلاثة أرباع', desc: 'منظور جانبي' },
  { id: 'top_down',     label: 'من أعلى',            desc: 'تصوير علوي' },
  { id: 'detail',       label: 'تفاصيل',             desc: 'تصوير ماكرو' },
  { id: 'side_profile', label: 'الجانب',             desc: 'منظور جانبي' },
  { id: 'floating',     label: 'معلق',               desc: 'منتج عائم' },
]

const LIFESTYLE_SCENES: { id: string; label: string; desc: string }[] = [
  { id: 'marble_minimal', label: 'رخام أبيض',           desc: 'رخام أبيض لامع' },
  { id: 'golden_hour',    label: 'الساعة الذهبية',       desc: 'ضوء غروب دافئ' },
  { id: 'dark_luxury',    label: 'فخامة داكنة',         desc: 'ذهب على خلفية داكنة' },
  { id: 'garden_fresh',   label: 'حديقة نضرة',          desc: 'نباتات وورود طبيعية' },
  { id: 'home_cozy',      label: 'منزل دافئ',           desc: 'إضاءة منزلية هادئة' },
  { id: 'tech_dark',      label: 'تقني داكن',           desc: 'ألياف كربونية + ضوء' },
  { id: 'beach_summer',   label: 'شاطئ صيفي',           desc: 'شمس ورمال صيفية' },
  { id: 'cafe_morning',   label: 'مقهى صباحي',          desc: 'طاولة مقهى صباحية' },
  { id: 'urban_concrete', label: 'حضري خرساني',         desc: 'خلفية حضرية خشنة' },
  { id: 'fashion_studio', label: 'استوديو موضة',        desc: 'إضاءة تحريرية' },
  { id: 'pastel_dream',   label: 'أحلام باستيل',        desc: 'لوحة ألوان ناعمة' },
]

export default function ProductLabAR() {
  const router = useRouter()
  const [stage, setStage]             = useState<Stage>('upload')
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [productId, setProductId]     = useState<string | null>(null)
  const [originalUrl, setOriginalUrl] = useState<string>('')
  const [cleanedUrl, setCleanedUrl]   = useState<string>('')
  const [productType, setProductType] = useState<string>('general')
  const [productName, setProductName] = useState<string>('منتجي')
  const [outputType, setOutputType]   = useState<OutputType>('studio')
  const [selectedShots, setSelectedShots]   = useState<ShotStyle[]>(['hero', 'angle_34', 'top_down', 'detail'])
  const [selectedScenes, setSelectedScenes] = useState<string[]>(['marble_minimal', 'golden_hour'])
  const [analysisStep, setAnalysisStep]     = useState(0)
  const [shootingStep, setShootingStep]     = useState(0)
  const [shootingTotal, setShootingTotal]   = useState(0)
  const [assets, setAssets]           = useState<Asset[]>([])
  const [selected, setSelected]       = useState<Asset | null>(null)
  const [editPrompt, setEditPrompt]   = useState('')
  const [editing, setEditing]         = useState(false)
  const [dragOver, setDragOver]       = useState(false)
  const [error, setError]             = useState<string | null>(null)
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
    if (!user || !workspaceId) throw new Error('غير مسجل الدخول')
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${workspaceId}/product-originals/${Date.now()}.${ext}`
    const { error: upErr } = await sb.storage.from('brand-assets').upload(path, file, { upsert: true })
    if (upErr) throw upErr
    const { data: urlData } = sb.storage.from('brand-assets').getPublicUrl(path)
    return urlData.publicUrl
  }

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('يرجى رفع ملف صورة.'); return }
    setError(null)
    setStage('analyzing')
    setAnalysisStep(0)
    try {
      const url = await uploadToStorage(file)
      setOriginalUrl(url)
      setAnalysisStep(1)
      const detectRes = await fetch('/api/product-lab/detect', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: url, workspace_id: workspaceId }),
      })
      const detected = await detectRes.json()
      setProductType(detected.type || 'general')
      setProductName(detected.suggested_name || 'منتجي')
      setAnalysisStep(2)
      const cleanRes = await fetch('/api/product-lab/clean', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: url, workspace_id: workspaceId, product_id: productId }),
      })
      const cleaned = await cleanRes.json()
      setCleanedUrl(cleaned.cleaned_url || url)
      setAnalysisStep(3)
      if (workspaceId) {
        const sb = createClient()
        const { data: prod } = await sb.from('products').insert({
          workspace_id: workspaceId, name: detected.suggested_name || 'منتجي',
          product_type: detected.type || 'general', original_url: url, cleaned_url: cleaned.cleaned_url || url,
        }).select('id').single()
        if (prod) setProductId(prod.id)
      }
      setStage('configure')
    } catch (err: any) {
      setError(err?.message || 'فشل المعالجة. حاول مرة أخرى.')
      setStage('upload')
    }
  }, [workspaceId, productId])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]; if (file) handleFile(file)
  }, [handleFile])

  const resetToUpload = () => {
    setStage('upload'); setOriginalUrl(''); setCleanedUrl('')
    setProductId(null); setAssets([]); setSelected(null)
  }

  const handleShoot = async () => {
    if (!cleanedUrl || !workspaceId) return
    setStage('shooting'); setShootingStep(0)
    const collectedAssets: Asset[] = []
    const needStudio = outputType !== 'lifestyle'
    const needLife   = outputType !== 'studio'
    const total = (needStudio ? selectedShots.length : 0) + (needLife ? selectedScenes.length : 0)
    setShootingTotal(total)
    if (needStudio) {
      const res = await fetch('/api/product-lab/studio-shots', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId, product_id: productId, image_url: cleanedUrl, product_type: productType, shots: selectedShots }),
      })
      const data = await res.json()
      if (data.shots) data.shots.forEach((s: any) => { collectedAssets.push({ id: s.id, url: s.url, type: 'studio', style: s.style, label: s.label }); setShootingStep(p => p + 1) })
    }
    if (needLife) {
      const res = await fetch('/api/product-lab/lifestyle', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId, product_id: productId, image_url: cleanedUrl, product_type: productType, scenes: selectedScenes }),
      })
      const data = await res.json()
      if (data.scenes) data.scenes.forEach((s: any) => { collectedAssets.push({ id: s.id, url: s.url, type: 'lifestyle', scene: s.scene, label: s.label }); setShootingStep(p => p + 1) })
    }
    setAssets(collectedAssets)
    if (collectedAssets.length === 0) {
      setError('لم يتم إنشاء أي صور — يرجى التحقق من رصيدك والمحاولة مرة أخرى.')
      setStage('configure')
    } else {
      setSelected(collectedAssets[0])
      setStage('gallery')
    }
  }

  const handleEdit = async () => {
    if (!selected || !editPrompt.trim() || !workspaceId) return
    setEditing(true)
    try {
      const res = await fetch('/api/product-lab/edit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId, product_id: productId, image_url: selected.url, edit_prompt: editPrompt }),
      })
      const data = await res.json()
      if (data.edited_url) {
        const edited: Asset = { id: data.asset_id || `edit-${Date.now()}`, url: data.edited_url, type: 'edit', label: 'معدّل' }
        setAssets(p => [edited, ...p]); setSelected(edited); setEditPrompt('')
      }
    } catch { /* silent */ }
    setEditing(false)
  }

  const downloadAsset = (asset: Asset) => {
    const a = document.createElement('a'); a.href = asset.url
    a.download = `product-${asset.type}-${Date.now()}.png`; a.click()
  }

  const toggleShot  = (id: ShotStyle) => setSelectedShots(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id])
  const toggleScene = (id: string)    => setSelectedScenes(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id])

  const creditCost = (() => {
    if (outputType === 'studio')    return CREDIT_COSTS.product_clean + selectedShots.length  * CREDIT_COSTS.product_studio
    if (outputType === 'lifestyle') return CREDIT_COSTS.product_clean + selectedScenes.length * CREDIT_COSTS.product_lifestyle
    return CREDIT_COSTS.product_clean + selectedShots.length * CREDIT_COSTS.product_studio + selectedScenes.length * CREDIT_COSTS.product_lifestyle
  })()

  // ── UPLOAD ───────────────────────────────────────────────────────────
  if (stage === 'upload') return (
    <div dir="rtl" style={{ minHeight:'100vh', background:C.bg, fontFamily:AR, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:40, letterSpacing:0 }}>
      <div style={{ textAlign:'center', marginBottom:40 }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.cyan, marginBottom:12, letterSpacing:0 }}>مختبر المنتجات</div>
        <div style={{ fontSize:34, fontWeight:700, color:C.t1, letterSpacing:0, marginBottom:10 }}>تصوير المنتجات بالذكاء الاصطناعي</div>
        <div style={{ fontSize:15, color:C.t3, maxWidth:420, letterSpacing:0 }}>ارفع صورة منتجك — سنحذف الخلفية تلقائياً ثم نصوّره في أي مشهد تحتاجه.</div>
      </div>
      {error && <div style={{ marginBottom:20, padding:'10px 18px', borderRadius:10, background:'rgba(239,68,68,0.10)', border:'1px solid rgba(239,68,68,0.25)', color:'#EF4444', fontSize:13, letterSpacing:0 }}>{error}</div>}
      <div
        onDrop={onDrop} onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
        onClick={() => fileRef.current?.click()}
        style={{ width:'100%', maxWidth:480, aspectRatio:'1.6', borderRadius:20, cursor:'pointer', transition:'all 0.2s', border:`2px dashed ${dragOver ? C.cyan : C.border}`, background: dragOver ? C.cyanD : C.surface, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, transform: dragOver ? 'scale(1.01)' : 'scale(1)' }}>
        <div style={{ width:56, height:56, borderRadius:14, background: dragOver ? C.cyanB : 'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={dragOver ? C.cyan : C.t3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color: dragOver ? C.cyan : C.t2, textAlign:'center', letterSpacing:0 }}>أفلت الصورة هنا</div>
          <div style={{ fontSize:12, color:C.t4, textAlign:'center', marginTop:4, letterSpacing:0 }}>أو انقر للتصفح — JPG، PNG، WEBP</div>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      <div style={{ display:'flex', flexDirection:'row-reverse', gap:36, marginTop:44 }}>
        <div style={{ textAlign:'center', width:120 }}>
          <div style={{ color:C.cyan, display:'flex', justifyContent:'center', marginBottom:12 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </div>
          <div style={{ fontSize:12, fontWeight:600, color:C.t2, letterSpacing:0 }}>إزالة الخلفية</div>
          <div style={{ fontSize:11, color:C.t4, marginTop:3, letterSpacing:0 }}>قطع نظيف في ثوانٍ</div>
        </div>
        <div style={{ textAlign:'center', width:120 }}>
          <div style={{ color:C.cyan, display:'flex', justifyContent:'center', marginBottom:12 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </div>
          <div style={{ fontSize:12, fontWeight:600, color:C.t2, letterSpacing:0 }}>لقطات الاستوديو</div>
          <div style={{ fontSize:11, color:C.t4, marginTop:3, letterSpacing:0 }}>6 زوايا احترافية</div>
        </div>
        <div style={{ textAlign:'center', width:120 }}>
          <div style={{ color:C.cyan, display:'flex', justifyContent:'center', marginBottom:12 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <div style={{ fontSize:12, fontWeight:600, color:C.t2, letterSpacing:0 }}>مشاهد أسلوب الحياة</div>
          <div style={{ fontSize:11, color:C.t4, marginTop:3, letterSpacing:0 }}>11 مشهداً مختلفاً</div>
        </div>
      </div>
    </div>
  )

  // ── ANALYZING ────────────────────────────────────────────────────────
  if (stage === 'analyzing') {
    const steps = ['جارٍ الرفع...', 'تحليل المنتج...', 'إزالة الخلفية...', 'اكتمل!']
    return (
      <div dir="rtl" style={{ minHeight:'100vh', background:C.bg, fontFamily:AR, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:32, letterSpacing:0 }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:20, fontWeight:700, color:C.t1, marginBottom:8, letterSpacing:0 }}>جارٍ تجهيز منتجك</div>
          <div style={{ fontSize:13, color:C.t3, letterSpacing:0 }}>يستغرق هذا حوالي 30 ثانية</div>
        </div>
        <div style={{ width:360, display:'flex', flexDirection:'column', gap:10 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display:'flex', flexDirection:'row-reverse', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:12, background: i < analysisStep ? C.greenD : i === analysisStep ? C.cyanD : 'transparent', border:`1px solid ${i < analysisStep ? 'rgba(34,197,94,0.20)' : i === analysisStep ? 'rgba(0,170,255,0.20)' : C.borderS}`, transition:'all 0.4s' }}>
              <div style={{ width:22, height:22, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background: i < analysisStep ? C.green : i === analysisStep ? C.cyan : 'transparent', border:`2px solid ${i < analysisStep ? C.green : i === analysisStep ? C.cyan : C.border}`, flexShrink:0 }}>
                {i < analysisStep ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : i === analysisStep ? <div className="nexa-spinner" style={{ width:10, height:10, borderWidth:2, borderTopColor:'#000' }}/> : null}
              </div>
              <span style={{ fontSize:13, color: i <= analysisStep ? C.t1 : C.t4, fontWeight: i === analysisStep ? 700 : 400, letterSpacing:0 }}>{step}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── CONFIGURE ────────────────────────────────────────────────────────
  if (stage === 'configure') return (
    <div dir="rtl" style={{ height:'100vh', background:C.bg, fontFamily:AR, display:'flex', overflow:'hidden', letterSpacing:0 }}>
      {/* Right panel — 220px fixed (first child = right in RTL) */}
      <div style={{ width:220, flexShrink:0, borderLeft:`1px solid ${C.border}`, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Mini header row */}
        <div style={{ padding:'16px 16px 0', flexShrink:0 }}>
          <button onClick={resetToUpload} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:C.t3, background:'none', border:'none', cursor:'pointer', padding:0, fontFamily:AR, letterSpacing:0 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform:'rotate(180deg)' }}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            رفع جديد
          </button>
        </div>
        {/* Product name + type badge */}
        <div style={{ padding:'10px 16px 0', flexShrink:0 }}>
          <div style={{ fontSize:14, fontWeight:600, color:C.t1, letterSpacing:0 }}>{productName}</div>
          <span style={{ display:'inline-block', marginTop:4, fontSize:10, padding:'2px 7px', borderRadius:99, background:C.cyanD, border:`1px solid rgba(0,170,255,0.20)`, color:C.cyan, fontWeight:700, letterSpacing:0 }}>{productType}</span>
        </div>
        {/* Scrollable content */}
        <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:14 }}>
          {cleanedUrl && (
            <div style={{ borderRadius:12, overflow:'hidden', background:C.surface, border:`1px solid ${C.border}`, aspectRatio:'1' }}>
              <img src={cleanedUrl} alt="المنتج" style={{ width:'100%', height:'100%', objectFit:'contain', padding:12 }}/>
            </div>
          )}
          {error && (
            <div style={{ padding:'8px 10px', borderRadius:8, background:'rgba(239,68,68,0.10)', border:'1px solid rgba(239,68,68,0.25)', color:'#EF4444', fontSize:11, letterSpacing:0 }}>{error}</div>
          )}
          <div>
            <div style={{ fontSize:11, color:C.t4, marginBottom:8, fontWeight:700, letterSpacing:0 }}>نوع الإخراج</div>
            {(['studio','lifestyle','both'] as OutputType[]).map(t => (
              <button key={t} onClick={() => setOutputType(t)} style={{ display:'block', width:'100%', padding:'8px 12px', borderRadius:8, marginBottom:4, background: outputType === t ? C.cyan : 'transparent', border:`1px solid ${outputType === t ? C.cyan : C.border}`, color: outputType === t ? '#000' : C.t3, fontSize:12, fontWeight: outputType === t ? 700 : 400, cursor:'pointer', textAlign:'right', letterSpacing:0 }}>
                {t === 'studio' ? 'لقطات الاستوديو' : t === 'lifestyle' ? 'مشاهد أسلوب الحياة' : 'الاثنان معاً'}
              </button>
            ))}
          </div>
        </div>
        {/* Shoot button — pinned to bottom */}
        <div style={{ padding:'12px 16px', background:'linear-gradient(to bottom, transparent 0%, #0C0C0C 40%)', flexShrink:0 }}>
          <button onClick={handleShoot} disabled={selectedShots.length === 0 && selectedScenes.length === 0}
            style={{ width:'100%', padding:'10px 0', borderRadius:10, background:C.cyan, color:'#000', fontSize:13, fontWeight:700, cursor:'pointer', border:'none', opacity:(selectedShots.length === 0 && selectedScenes.length === 0) ? 0.4 : 1, letterSpacing:0 }}>
            ابدأ التصوير — {creditCost} رصيد
          </button>
        </div>
      </div>

      {/* Left — shot/scene selectors (flex:1) */}
      <div style={{ flex:1, overflowY:'auto', padding:24 }}>
        {(outputType === 'studio' || outputType === 'both') && (
          <div style={{ marginBottom:32 }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.t1, marginBottom:4, letterSpacing:0 }}>لقطات الاستوديو <span style={{ fontFamily:MONO, fontSize:11, color:C.t4, fontWeight:400 }}>{CREDIT_COSTS.product_studio} رصيد/لقطة</span></div>
            <div style={{ fontSize:12, color:C.t4, marginBottom:16, letterSpacing:0 }}>تصوير احترافي بخلفية بيضاء من 6 زوايا</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:10 }}>
              {SHOT_STYLES.map(s => (
                <button key={s.id} onClick={() => toggleShot(s.id)} style={{ padding:'12px 14px', borderRadius:10, border:`1px solid ${selectedShots.includes(s.id) ? C.cyan : C.border}`, background: selectedShots.includes(s.id) ? C.cyanD : C.surface, cursor:'pointer', textAlign:'right' }}>
                  <div style={{ fontSize:12, fontWeight:700, color: selectedShots.includes(s.id) ? C.cyan : C.t2, letterSpacing:0 }}>{s.label}</div>
                  <div style={{ fontSize:11, color:C.t4, marginTop:2, letterSpacing:0 }}>{s.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}
        {(outputType === 'lifestyle' || outputType === 'both') && (
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:C.t1, marginBottom:4, letterSpacing:0 }}>مشاهد أسلوب الحياة <span style={{ fontFamily:MONO, fontSize:11, color:C.t4, fontWeight:400 }}>{CREDIT_COSTS.product_lifestyle} رصيد/مشهد</span></div>
            <div style={{ fontSize:12, color:C.t4, marginBottom:16, letterSpacing:0 }}>منتجك في بيئات تحريرية واقعية</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:10 }}>
              {LIFESTYLE_SCENES.map(s => (
                <button key={s.id} onClick={() => toggleScene(s.id)} style={{ padding:'12px 14px', borderRadius:10, border:`1px solid ${selectedScenes.includes(s.id) ? C.cyan : C.border}`, background: selectedScenes.includes(s.id) ? C.cyanD : C.surface, cursor:'pointer', textAlign:'right' }}>
                  <div style={{ fontSize:12, fontWeight:700, color: selectedScenes.includes(s.id) ? C.cyan : C.t2, letterSpacing:0 }}>{s.label}</div>
                  <div style={{ fontSize:11, color:C.t4, marginTop:2, letterSpacing:0 }}>{s.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // ── SHOOTING ─────────────────────────────────────────────────────────
  if (stage === 'shooting') return (
    <div dir="rtl" style={{ minHeight:'100vh', background:C.bg, fontFamily:AR, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:32, letterSpacing:0 }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:20, fontWeight:700, color:C.t1, marginBottom:8, letterSpacing:0 }}>جارٍ تصوير منتجك</div>
        <div style={{ fontSize:13, color:C.t3, letterSpacing:0 }}>يُنشئ الذكاء الاصطناعي كل صورة — قد يستغرق ذلك دقيقة إلى دقيقتين</div>
      </div>
      {shootingTotal > 0 && (
        <div style={{ width:360 }}>
          <div style={{ display:'flex', flexDirection:'row-reverse', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:12, color:C.t3, letterSpacing:0 }}>التقدم</span>
            <span style={{ fontSize:12, color:C.t1, fontFamily:MONO }}>{shootingStep}/{shootingTotal}</span>
          </div>
          <div style={{ height:4, borderRadius:4, background:'rgba(255,255,255,0.08)' }}>
            <div style={{ height:'100%', borderRadius:4, background:C.cyan, width:`${(shootingStep / shootingTotal) * 100}%`, transition:'width 0.5s ease' }}/>
          </div>
        </div>
      )}
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

  // ── GALLERY ───────────────────────────────────────────────────────────
  return (
    <div dir="rtl" style={{ minHeight:'100vh', background:C.bg, fontFamily:AR, display:'flex', flexDirection:'column', overflow:'hidden', height:'100vh', letterSpacing:0 }}>
      <div style={{ display:'flex', flexDirection:'row-reverse', alignItems:'center', justifyContent:'space-between', padding:'0 24px', height:52, borderBottom:`1px solid ${C.border}`, background:C.surface, flexShrink:0 }}>
        <div style={{ display:'flex', flexDirection:'row-reverse', alignItems:'center', gap:12 }}>
          <button onClick={() => { setStage('upload'); setAssets([]); setSelected(null); setOriginalUrl(''); setCleanedUrl('') }}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', borderRadius:8, background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border}`, color:C.t3, cursor:'pointer', fontSize:12, letterSpacing:0 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ transform:'rotate(180deg)' }}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            تصوير جديد
          </button>
          <span style={{ fontSize:13, fontWeight:700, color:C.t1, letterSpacing:0 }}>{productName}</span>
          <span style={{ fontSize:11, color:C.t4, fontFamily:MONO }}>{assets.length} صور</span>
        </div>
        <button onClick={() => setStage('configure')} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:8, background:C.cyanD, border:`1px solid rgba(0,170,255,0.20)`, color:C.cyan, fontSize:12, fontWeight:700, cursor:'pointer', letterSpacing:0 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          المزيد من اللقطات
        </button>
      </div>

      <div style={{ flex:1, display:'grid', gridTemplateColumns:'320px 1fr', overflow:'hidden' }}>
        {/* Detail panel — right side in RTL */}
        <div style={{ borderLeft:`1px solid ${C.border}`, display:'flex', flexDirection:'column', overflow:'hidden', background:C.surface }}>
          {selected ? (
            <>
              <div style={{ flex:1, overflowY:'auto', padding:16 }}>
                <img src={selected.url} alt="" style={{ width:'100%', borderRadius:12, marginBottom:16, border:`1px solid ${C.border}` }}/>
                <div style={{ fontSize:12, fontWeight:700, color:C.t2, marginBottom:4, letterSpacing:0 }}>{selected.label || selected.type}</div>
                <div style={{ fontSize:11, color:C.t4, marginBottom:16, letterSpacing:0 }}>{selected.style || selected.scene || selected.type}</div>
                <button onClick={() => downloadAsset(selected)} style={{ width:'100%', padding:'9px 0', borderRadius:10, background:C.cyanD, border:`1px solid rgba(0,170,255,0.20)`, color:C.cyan, fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, letterSpacing:0 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  تنزيل
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('studio_reference_image', selected.url)
                    localStorage.setItem('studio_reference_type', selected.type)
                    router.push('/dashboard/studio?tab=video&ref=product')
                  }}
                  style={{ width:'100%', padding:'9px 0', borderRadius:10, background:'rgba(0,170,255,0.08)', border:'1px solid rgba(0,170,255,0.22)', color:'#00AAFF', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:8, transition:'all 0.15s', letterSpacing:0, fontFamily:AR }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,170,255,0.14)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,170,255,0.08)'}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                  حرّك في الاستوديو
                </button>
              </div>
              <div style={{ borderTop:`1px solid ${C.border}`, padding:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:C.t3, marginBottom:10, letterSpacing:0 }}>توجيه فني — {CREDIT_COSTS.product_edit} رصيد</div>
                <textarea value={editPrompt} onChange={e => setEditPrompt(e.target.value)}
                  placeholder="غيّر الخلفية إلى رخام داكن مع لمسات ذهبية..." dir="rtl"
                  style={{ width:'100%', minHeight:80, padding:'10px 12px', borderRadius:10, background:C.over, border:`1px solid ${C.border}`, color:C.t1, fontSize:12, fontFamily:AR, resize:'none', outline:'none', boxSizing:'border-box', letterSpacing:0 }}/>
                <button onClick={handleEdit} disabled={!editPrompt.trim() || editing}
                  style={{ marginTop:8, width:'100%', padding:'9px 0', borderRadius:10, background:editing ? 'rgba(255,255,255,0.06)' : C.cyan, color: editing ? C.t4 : '#000', fontSize:12, fontWeight:700, cursor: editing ? 'not-allowed' : 'pointer', border:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:6, letterSpacing:0 }}>
                  {editing ? <><div className="nexa-spinner" style={{ width:12, height:12, borderWidth:2, borderTopColor:'currentColor' }}/> جارٍ التعديل...</> : 'تطبيق التعديل'}
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:C.t4, fontSize:13, letterSpacing:0 }}>اختر صورة للمعاينة</div>
          )}
        </div>

        {/* Masonry grid */}
        <div style={{ overflowY:'auto', padding:20 }}>
          <div style={{ columns:'3', columnGap:12 }}>
            {assets.map(a => (
              <div key={a.id} onClick={() => setSelected(a)}
                style={{ marginBottom:12, borderRadius:12, overflow:'hidden', cursor:'pointer', border:`1px solid ${selected?.id === a.id ? C.cyan : C.border}`, transition:'all 0.15s', breakInside:'avoid', boxShadow: selected?.id === a.id ? `0 0 0 2px ${C.cyan}` : 'none' }}>
                <img src={a.url} alt="" style={{ width:'100%', display:'block' }}/>
                <div style={{ padding:'6px 10px', background:C.surface, display:'flex', flexDirection:'row-reverse', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:10, color:C.t4, letterSpacing:0 }}>{a.label || a.type}</span>
                  <button onClick={e => { e.stopPropagation(); downloadAsset(a) }} style={{ background:'transparent', border:'none', color:C.t4, cursor:'pointer', padding:2 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
