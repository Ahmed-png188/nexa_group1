'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import { getTemplate, getSize } from '@/lib/packaging-templates'
import { CREDIT_COSTS } from '@/lib/plan-constants'

const PackagingViewer3D = dynamic(
  () => import('../../PackagingViewer3D'),
  {
    ssr: false,
    loading: () => (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'100%', height:'100%' }}>
        <div className="nexa-spinner" style={{ width:32, height:32 }}/>
      </div>
    ),
  }
)

const PackagingEditor = dynamic(() => import('../../PackagingEditor'), { ssr: false })
const DielineUpload   = dynamic(() => import('../../DielineUpload'),   { ssr: false })

const C = {
  bg:     '#080808',
  surface:'#0E0E0E',
  over:   '#141414',
  border: 'rgba(255,255,255,0.08)',
  borderS:'rgba(255,255,255,0.05)',
  cyan:   '#00AAFF',
  cyanD:  'rgba(0,170,255,0.10)',
  cyanB:  'rgba(0,170,255,0.20)',
  t1:     '#FFFFFF',
  t2:     'rgba(255,255,255,0.65)',
  t3:     'rgba(255,255,255,0.35)',
  t4:     'rgba(255,255,255,0.18)',
}
const EN   = "'Geist', -apple-system, sans-serif"
const MONO = "'Geist Mono', monospace"

type EditorMode = 'ai' | 'editor' | 'upload'

const GEN_MESSAGES = [
  'Reading your brand identity…',
  'Detecting design archetype…',
  'Building layout structure…',
  'Applying brand typography…',
  'Adding design elements…',
  'Finalising packaging design…',
]

function EditorPageInner() {
  const searchParams   = useSearchParams()
  const router         = useRouter()
  const supabase       = createClient()

  const packagingType  = searchParams.get('type')    || 'box'

  const template       = getTemplate(packagingType)
  const [selectedSize, setSelectedSize] = useState(template?.sizes[0]?.id || '')
  const currentDims    = getSize(packagingType, selectedSize)?.dims ||
                         { width_mm:100, height_mm:100, depth_mm:0, bleed_mm:3 }

  const [wsId,        setWsId]       = useState<string|null>(null)
  const [credits,     setCredits]    = useState(0)

  const [design,      setDesign]     = useState<any>(null)
  const [designId,    setDesignId]   = useState<string|null>(null)
  const [generating,  setGenerating] = useState(false)
  const [genMsg,      setGenMsg]     = useState('')
  const [mode,        setMode]       = useState<EditorMode>('ai')

  const [exportOpen,  setExportOpen] = useState(false)
  const [exporting,   setExporting]  = useState(false)

  const [toast, setToast] = useState<{msg:string;ok:boolean}|null>(null)
  const toast_ = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3200)
  }

  const viewerContainerRef = useRef<HTMLDivElement>(null)

  // Load workspace + credits
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('workspace_members')
        .select('workspace_id, workspaces(credits_balance, plan)')
        .eq('user_id', user.id)
        .limit(1)
        .single()
        .then(({ data }) => {
          if (!data) return
          setWsId(data.workspace_id)
          const ws = (data as any).workspaces
          setCredits(ws?.credits_balance ?? 0)
        })
    })
  }, [])

  async function generateDesign() {
    if (!wsId || generating) return
    if (credits < CREDIT_COSTS.packaging_generate) {
      toast_('Not enough credits', false); return
    }
    setGenerating(true)
    setDesign(null)

    let msgIdx = 0
    setGenMsg(GEN_MESSAGES[0])
    const iv = setInterval(() => {
      msgIdx = (msgIdx + 1) % GEN_MESSAGES.length
      setGenMsg(GEN_MESSAGES[msgIdx])
    }, 1800)

    try {
      const res = await fetch('/api/product-lab/packaging-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: wsId,
          packaging_type: packagingType,
          size_id: selectedSize,
          lang: 'en',
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast_(err.error || 'Generation failed', false)
        return
      }
      const data = await res.json()
      setDesign({ ...data.design, packaging_type: packagingType, dims: currentDims })
      setDesignId(data.id)
      const { data: ws } = await supabase
        .from('workspaces')
        .select('credits_balance')
        .eq('id', wsId)
        .single()
      if (ws) setCredits((ws as any).credits_balance ?? 0)
    } catch {
      toast_('Something went wrong', false)
    } finally {
      clearInterval(iv)
      setGenerating(false)
      setGenMsg('')
    }
  }

  async function exportPDF() {
    if (!designId || !wsId || exporting) return
    setExporting(true)
    try {
      const res = await fetch('/api/product-lab/packaging-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: wsId, design_id: designId }),
      })
      if (!res.ok) { toast_('PDF export failed', false); return }
      const data = await res.json()
      window.open(data.pdf_url, '_blank')
      toast_('PDF ready — opening download')
    } catch { toast_('Export failed', false) }
    finally { setExporting(false); setExportOpen(false) }
  }

  function downloadMockupPNG() {
    const canvas = viewerContainerRef.current?.querySelector('canvas') as HTMLCanvasElement | null
    if (!canvas) { toast_('No mockup to download', false); return }
    const link = document.createElement('a')
    link.download = `nexa-mockup-3d-${packagingType}.png`
    link.href = canvas.toDataURL('image/png', 1.0)
    link.click()
    setExportOpen(false)
    toast_('3D mockup downloaded')
  }

  // ── RENDER ──────────────────────────────────────────────────────
  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: C.bg, fontFamily: EN, color: C.t1, overflow: 'hidden',
    }}>

      {/* ── TOP BAR ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 20px', height: 52,
        borderBottom: `1px solid ${C.border}`,
        background: C.surface, flexShrink: 0, zIndex: 100,
      }}>
        {/* Back */}
        <button
          onClick={() => router.push('/dashboard/product-lab/packaging')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 11px', borderRadius: 7, fontSize: 12,
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${C.border}`,
            color: C.t3, cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.t1}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.t3}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Gallery
        </button>

        <div style={{ width:1, height:16, background:C.border }}/>

        <span style={{ fontSize:13, fontWeight:600, color:C.t1 }}>
          {template?.name_en || packagingType}
        </span>

        {/* Size pills */}
        <div style={{ display:'flex', gap:4, marginLeft:6 }}>
          {template?.sizes.slice(0,4).map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedSize(s.id)}
              style={{
                padding:'4px 10px', borderRadius:6, fontSize:10, fontWeight:500,
                background: selectedSize===s.id ? C.cyanD : 'transparent',
                border: `1px solid ${selectedSize===s.id ? C.cyanB : C.border}`,
                color: selectedSize===s.id ? C.cyan : C.t4,
                cursor:'pointer', transition:'all 0.15s', whiteSpace:'nowrap',
              }}
            >{s.label_en.split('(')[0].trim()}</button>
          ))}
        </div>

        <div style={{ flex:1 }}/>

        {/* Mode switcher */}
        <div style={{
          display:'flex', gap:2, padding:'3px',
          background:'rgba(255,255,255,0.04)',
          border:`1px solid ${C.border}`, borderRadius:9,
        }}>
          {([
            { id:'ai',
              icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
              label:'AI Design' },
            { id:'editor',
              icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
              label:'Visual Editor' },
            { id:'upload',
              icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
              label:'Upload' },
          ] as { id:EditorMode; icon:React.ReactNode; label:string }[]).map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              title={m.label}
              style={{
                padding:'5px 10px', borderRadius:6, fontSize:11, fontWeight:500,
                background: mode===m.id ? 'rgba(255,255,255,0.10)' : 'transparent',
                border:'none', color: mode===m.id ? C.t1 : C.t4,
                cursor:'pointer', transition:'all 0.14s',
                display:'flex', alignItems:'center', gap:5,
              }}
            >
              {m.icon}
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {/* Credits */}
        <div style={{
          fontSize:11, color:C.t4, fontFamily:MONO,
          padding:'4px 10px', borderRadius:6,
          background:'rgba(255,255,255,0.03)',
          border:`1px solid ${C.border}`,
        }}>
          {credits.toLocaleString()} cr
        </div>

        {/* Export */}
        {design && (
          <div style={{ position:'relative' }}>
            <button
              onClick={() => setExportOpen(!exportOpen)}
              style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'7px 14px', borderRadius:8, fontSize:12, fontWeight:700,
                background:C.cyan, color:'#000000', border:'none', cursor:'pointer',
              }}
            >
              Export
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {exportOpen && (
              <div style={{
                position:'absolute', top:'calc(100% + 6px)', right:0,
                background:C.over, border:`1px solid ${C.border}`,
                borderRadius:10, overflow:'hidden', width:200,
                boxShadow:'0 16px 48px rgba(0,0,0,0.7)', zIndex:200,
              }}>
                {[
                  { label:'3D Mockup PNG',   sub:'Screenshot of 3D view',    action: downloadMockupPNG },
                  { label:'Print-ready PDF', sub:'With bleed + crop marks', action: exportPDF },
                ].map((opt, i) => (
                  <button
                    key={i}
                    onClick={opt.action}
                    style={{
                      width:'100%', padding:'12px 14px',
                      textAlign:'left', background:'none', border:'none',
                      cursor:'pointer',
                      borderBottom: i===0 ? `1px solid ${C.borderS}` : 'none',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.05)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='none'}
                  >
                    <div style={{ fontSize:12, fontWeight:600, color:C.t1, fontFamily:EN }}>{opt.label}</div>
                    <div style={{ fontSize:10, color:C.t4, marginTop:2 }}>{opt.sub}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MAIN AREA ── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* ── 3D VIEWPORT ── */}
        <div style={{
          flex:1, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center',
          background:'radial-gradient(ellipse 80% 60% at 50% 50%, #0D1520 0%, #080808 100%)',
          position:'relative', overflow:'hidden',
        }}>
          {/* Grid floor */}
          <div style={{
            position:'absolute', inset:0,
            backgroundImage:`
              linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)
            `,
            backgroundSize:'40px 40px',
            maskImage:'radial-gradient(ellipse 70% 70% at 50% 60%, black 30%, transparent 100%)',
            pointerEvents:'none',
          }}/>

          {/* Empty state */}
          {!design && !generating && mode === 'ai' && (
            <div style={{ textAlign:'center', zIndex:10, animation:'fadeIn 0.4s ease' }}>
              <div style={{
                width:160, height:200, margin:'0 auto 28px',
                perspective:'600px',
              }}>
                <div style={{
                  width:'100%', height:'100%',
                  transformStyle:'preserve-3d',
                  transform:'rotateX(10deg) rotateY(-20deg)',
                  animation:'float 4s ease-in-out infinite',
                  position:'relative',
                }}>
                  <div style={{
                    position:'absolute', inset:0,
                    background:'linear-gradient(135deg, rgba(0,170,255,0.15) 0%, rgba(0,170,255,0.05) 100%)',
                    border:'1px solid rgba(0,170,255,0.20)',
                    borderRadius:8, backdropFilter:'blur(8px)',
                    transform:'translateZ(20px)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <div style={{ opacity:0.3 }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00AAFF" strokeWidth="1" strokeLinecap="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                        <line x1="12" y1="22.08" x2="12" y2="12"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ fontSize:16, fontWeight:600, color:C.t1, marginBottom:8 }}>
                Your design will appear here
              </div>
              <div style={{ fontSize:13, color:C.t3, marginBottom:24 }}>
                Configure options on the right, then generate
              </div>
            </div>
          )}

          {/* Loading */}
          {generating && (
            <div style={{ textAlign:'center', zIndex:10 }}>
              <div style={{
                width:56, height:56,
                border:'2px solid rgba(0,170,255,0.15)',
                borderTop:`2px solid ${C.cyan}`,
                borderRadius:'50%', margin:'0 auto 20px',
                animation:'spin 1s linear infinite',
              }}/>
              <div style={{ fontSize:14, fontWeight:500, color:C.t2, marginBottom:6 }}>{genMsg}</div>
              <div style={{ fontSize:11, color:C.t4 }}>AI reads your brand and designs for you</div>
            </div>
          )}

          {/* 3D Viewer — AI mode */}
          {design && mode === 'ai' && (
            <div ref={viewerContainerRef} style={{ zIndex:10 }}>
              <PackagingViewer3D
                design={{ ...design, dims:currentDims }}
                packagingType={packagingType as any}
                width={560}
                height={480}
                autoRotate
              />
            </div>
          )}

          {/* Visual editor */}
          {mode === 'editor' && (
            <div style={{ width:'100%', height:'100%', zIndex:10 }}>
              <PackagingEditor
                design={design || { bg_color:'#FFFFFF', text_color:'#000000', accent_color:'#000000', brand_name_display:'YOUR BRAND' }}
                packagingType={packagingType}
                dims={currentDims}
                onExport={dataUrl => {
                  setDesign((prev: any) => ({ ...prev, _customTexture: dataUrl, _ts: Date.now() }))
                  toast_('Design applied to 3D mockup')
                  setMode('ai')
                }}
              />
            </div>
          )}

          {/* Upload mode */}
          {mode === 'upload' && (
            <div style={{ width:'100%', height:'100%', zIndex:10, overflowY:'auto' }}>
              <DielineUpload
                packagingType={packagingType}
                dims={currentDims}
                onUpload={dataUrl => {
                  setDesign((prev: any) => ({
                    ...(prev || { bg_color:'#FFFFFF', text_color:'#000000', accent_color:'#000000', brand_name_display:'Brand' }),
                    _customTexture: dataUrl, _ts: Date.now(),
                  }))
                  toast_('Artwork uploaded')
                  setMode('ai')
                }}
              />
            </div>
          )}

          {/* Drag hint */}
          {design && mode === 'ai' && (
            <div style={{
              position:'absolute', bottom:20, left:'50%',
              transform:'translateX(-50%)',
              fontSize:11, color:C.t4, fontStyle:'italic',
              display:'flex', alignItems:'center', gap:6,
              pointerEvents:'none',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
                <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
                <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
                <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
              </svg>
              Drag to rotate · Scroll to zoom
            </div>
          )}

          <style>{`
            @keyframes float {
              0%,100% { transform: rotateX(10deg) rotateY(-20deg) translateY(0px) }
              50%      { transform: rotateX(10deg) rotateY(-20deg) translateY(-12px) }
            }
            @keyframes spin    { to { transform: rotate(360deg) } }
            @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
          `}</style>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{
          width:300, flexShrink:0,
          borderLeft:`1px solid ${C.border}`,
          background:C.surface,
          display:'flex', flexDirection:'column',
          overflowY:'auto',
        }}>

          {/* AI MODE */}
          {mode === 'ai' && (
            <>
              {/* Size */}
              <div style={{ padding:'20px 18px', borderBottom:`1px solid ${C.borderS}` }}>
                <div style={{
                  fontSize:10, fontWeight:700, letterSpacing:'0.08em',
                  textTransform:'uppercase', color:C.t4, marginBottom:12,
                }}>Size</div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {template?.sizes.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSize(s.id)}
                      style={{
                        padding:'10px 12px', borderRadius:8, textAlign:'left',
                        background: selectedSize===s.id ? C.cyanD : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${selectedSize===s.id ? C.cyanB : C.borderS}`,
                        cursor:'pointer', transition:'all 0.14s',
                      }}
                    >
                      <div style={{ fontSize:12, fontWeight:500, color: selectedSize===s.id ? C.cyan : C.t2 }}>
                        {s.label_en.split('(')[0].trim()}
                      </div>
                      <div style={{ fontSize:10, color:C.t4, marginTop:2 }}>
                        {s.dims.width_mm}×{s.dims.height_mm}
                        {s.dims.depth_mm ? `×${s.dims.depth_mm}` : ''}mm
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Design tweaks — after generation */}
              {design && (
                <div style={{ padding:'20px 18px', borderBottom:`1px solid ${C.borderS}` }}>
                  <div style={{
                    fontSize:10, fontWeight:700, letterSpacing:'0.08em',
                    textTransform:'uppercase', color:C.t4, marginBottom:12,
                  }}>Design</div>

                  {design.archetype && (
                    <div style={{
                      marginBottom:12, padding:'7px 10px',
                      background:'rgba(255,255,255,0.03)',
                      border:`1px solid ${C.borderS}`, borderRadius:7,
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                    }}>
                      <span style={{ fontSize:11, color:C.t4 }}>Style</span>
                      <span style={{ fontSize:11, fontWeight:600, color:C.cyan, textTransform:'capitalize' }}>
                        {design.archetype}
                      </span>
                    </div>
                  )}

                  {/* Colours */}
                  {[
                    { label:'Background', key:'bg_color' },
                    { label:'Text',       key:'text_color' },
                    { label:'Accent',     key:'accent_color' },
                  ].map(f => (
                    <div key={f.key} style={{
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'8px 10px', borderRadius:7, marginBottom:4,
                      background:'rgba(255,255,255,0.02)',
                      border:`1px solid ${C.borderS}`,
                    }}>
                      <span style={{ fontSize:11, color:C.t4 }}>{f.label}</span>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:10, color:C.t3, fontFamily:MONO }}>
                          {design[f.key] || ''}
                        </span>
                        <div style={{ position:'relative' }}>
                          <div style={{
                            width:22, height:22, borderRadius:5,
                            background: design[f.key] || '#000',
                            border:'1px solid rgba(255,255,255,0.15)',
                            cursor:'pointer',
                          }}/>
                          <input
                            type="color"
                            value={design[f.key] || '#000000'}
                            onChange={e => setDesign((p: any) => ({ ...p, [f.key]: e.target.value, _ts: Date.now() }))}
                            style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer', width:'100%', height:'100%' }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Text fields */}
                  {[
                    { label:'Brand name', key:'brand_name_display' },
                    { label:'Tagline',    key:'tagline_display' },
                  ].map(f => (
                    <div key={f.key} style={{ marginBottom:8 }}>
                      <div style={{ fontSize:10, color:C.t4, marginBottom:4 }}>{f.label}</div>
                      <input
                        value={design[f.key] || ''}
                        onChange={e => setDesign((p: any) => ({ ...p, [f.key]: e.target.value, _ts: Date.now() }))}
                        style={{
                          width:'100%', padding:'8px 10px', borderRadius:7,
                          background:'rgba(255,255,255,0.03)',
                          border:`1px solid ${C.borderS}`,
                          color:C.t1, fontSize:12, fontFamily:EN,
                          outline:'none', boxSizing:'border-box',
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Generate button — sticky at bottom */}
              <div style={{ padding:'18px', marginTop:'auto' }}>
                {!design ? (
                  <>
                    <button
                      onClick={generateDesign}
                      disabled={generating || credits < CREDIT_COSTS.packaging_generate}
                      style={{
                        width:'100%', padding:'13px', borderRadius:10,
                        fontSize:13, fontWeight:700,
                        background: generating || credits < CREDIT_COSTS.packaging_generate
                          ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                        color: generating || credits < CREDIT_COSTS.packaging_generate
                          ? 'rgba(255,255,255,0.20)' : '#0C0C0C',
                        border:'none',
                        cursor: generating || credits < CREDIT_COSTS.packaging_generate
                          ? 'not-allowed' : 'pointer',
                        transition:'all 0.15s',
                      }}
                    >
                      {generating ? 'Designing…' : 'Generate packaging →'}
                    </button>
                    <div style={{ textAlign:'center', marginTop:8, fontSize:11, color:C.t4 }}>
                      {CREDIT_COSTS.packaging_generate} credits · AI reads your brand
                    </div>
                  </>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    <button
                      onClick={generateDesign}
                      disabled={generating}
                      style={{
                        width:'100%', padding:'10px', borderRadius:9,
                        fontSize:12, fontWeight:600,
                        background:'rgba(255,255,255,0.06)',
                        border:`1px solid ${C.border}`,
                        color:C.t2, cursor:'pointer',
                      }}
                    >
                      Regenerate (5 cr)
                    </button>
                    <button
                      onClick={() => setMode('editor')}
                      style={{
                        width:'100%', padding:'10px', borderRadius:9,
                        fontSize:12, fontWeight:600,
                        background:C.cyanD, border:`1px solid ${C.cyanB}`,
                        color:C.cyan, cursor:'pointer',
                      }}
                    >
                      Edit in Visual Editor →
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* EDITOR / UPLOAD — instructions */}
          {(mode === 'editor' || mode === 'upload') && (
            <div style={{ padding:'20px 18px' }}>
              <div style={{ fontSize:12, fontWeight:600, color:C.t1, marginBottom:8 }}>
                {mode === 'editor' ? 'Visual Editor' : 'Upload artwork'}
              </div>
              <div style={{ fontSize:11, color:C.t3, lineHeight:1.7, marginBottom:16 }}>
                {mode === 'editor'
                  ? 'Edit the design on the canvas, then click "Apply to 3D" to preview on the mockup.'
                  : `Download the dieline (${currentDims.width_mm}×${currentDims.height_mm}mm), design in your tool, then upload the finished artwork.`}
              </div>
              <button
                onClick={() => setMode('ai')}
                style={{
                  width:'100%', padding:'9px', borderRadius:8,
                  fontSize:12, fontWeight:500,
                  background:'rgba(255,255,255,0.04)',
                  border:`1px solid ${C.border}`,
                  color:C.t3, cursor:'pointer',
                }}
              >← Back to 3D view</button>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed', bottom:24, left:'50%',
          transform:'translateX(-50%)',
          padding:'11px 20px', borderRadius:10, fontSize:13, fontWeight:500,
          background: toast.ok ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.08)',
          border: toast.ok ? '1px solid rgba(34,197,94,0.20)' : '1px solid rgba(239,68,68,0.18)',
          color: toast.ok ? '#22C55E' : '#EF4444',
          backdropFilter:'blur(16px)',
          boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
          zIndex:9999, fontFamily:EN,
          animation:'fadeIn 0.2s ease',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#080808' }}>
        <div className="nexa-spinner" style={{ width:28, height:28 }}/>
      </div>
    }>
      <EditorPageInner/>
    </Suspense>
  )
}
