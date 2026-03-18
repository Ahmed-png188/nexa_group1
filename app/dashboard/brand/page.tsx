'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type Tab = 'overview'|'voice'|'audience'|'visual'|'assets'

/* ─── Icons ─── */
const Ic = {
  bolt:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  upload:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  refresh: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  trash:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  brain:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>,
  mic:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>,
  users:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  eye:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  file:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  arrow:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  check:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  palette: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12.5" r="2.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>,
}

const TABS = [
  { id:'overview' as Tab, label:'Overview',  color:'#A78BFA', icon:Ic.brain  },
  { id:'voice'    as Tab, label:'Voice',     color:'#4D9FFF', icon:Ic.mic    },
  { id:'audience' as Tab, label:'Audience',  color:'#34D399', icon:Ic.users  },
  { id:'visual'   as Tab, label:'Visual',    color:'#FF7A40', icon:Ic.eye    },
  { id:'assets'   as Tab, label:'Assets',    color:'#FFB547', icon:Ic.file   },
]

const ASSET_TYPES = [
  { id:'logo',          label:'Logo',          color:'#4D9FFF' },
  { id:'sample_post',   label:'Sample post',   color:'#A78BFA' },
  { id:'product_photo', label:'Product photo', color:'#34D399' },
  { id:'brand_doc',     label:'Brand doc',     color:'#FF7A40' },
  { id:'other',         label:'Other',         color:'#888'    },
] as const

const LEARNING_COLORS: Record<string,string> = {
  voice:'#4D9FFF', audience:'#34D399', visual:'#FF7A40',
  engagement:'#A78BFA', content:'#FFB547', default:'#FF7A40',
}

/* ─── Score ring — SVG donut for each brand health metric ─── */
function ScoreRing({ score, color, label, size=80 }: { score:number; color:string; label:string; size?:number }) {
  const r    = size/2 - 7
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
      <div style={{ position:'relative', width:size, height:size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={r+4} fill="none" stroke={color} strokeWidth="1" opacity="0.08"/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${dash} ${circ}`}
            strokeDashoffset={circ/4}
            strokeLinecap="round"
            style={{ transition:'stroke-dasharray 1.4s cubic-bezier(0.34,1.56,0.64,1)', filter:`drop-shadow(0 0 8px ${color}80)` }}/>
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
          <div style={{ fontFamily:'var(--mono)', fontSize:18, fontWeight:300, color:'rgba(255,255,255,0.9)', letterSpacing:'-0.04em', lineHeight:1 }}>{score}</div>
        </div>
      </div>
      <div style={{ fontSize:10, color:'var(--t4)', fontFamily:'var(--sans)', fontWeight:600, textAlign:'center', letterSpacing:'0.06em', textTransform:'uppercase' }}>{label}</div>
    </div>
  )
}

/* ─── Info block — label + rich value ─── */
function InfoBlock({ label, value, accent = '#A78BFA', tags }: { label:string; value?:string; accent?:string; tags?:string[] }) {
  if (!value && (!tags || !tags.length)) return null
  return (
    <div style={{
      padding:'16px 18px',
      background:'linear-gradient(145deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.012) 100%)',
      border:'1px solid rgba(255,255,255,0.09)',
      borderRadius:14,
      position:'relative',
      overflow:'hidden',
      transition:'all 0.18s',
    }}>
      <div style={{ position:'absolute', top:0, left:0, width:32, height:2, background:accent, borderRadius:'14px 0 0 0', opacity:0.7 }}/>
      <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.28)', marginBottom:9 }}>{label}</div>
      {value && <div style={{ fontSize:13, color:'rgba(255,255,255,0.72)', lineHeight:1.75 }}>{value}</div>}
      {tags && tags.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:value?10:0 }}>
          {tags.map((t,i) => (
            <span key={i} style={{ fontSize:11, padding:'3px 10px', borderRadius:100, background:`${accent}12`, border:`1px solid ${accent}28`, color:`${accent}cc`, letterSpacing:'-0.01em' }}>
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Voice trait bar ─── */
function TraitBar({ label, value, color }: { label:string; value:number; color:string }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
        <span style={{ fontSize:12.5, color:'rgba(255,255,255,0.65)', fontWeight:500 }}>{label}</span>
        <span style={{ fontSize:11, fontWeight:700, color }}>
          {value < 33 ? 'Low' : value < 66 ? 'Moderate' : 'High'}
        </span>
      </div>
      <div style={{ height:4, background:'rgba(255,255,255,0.07)', borderRadius:100, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${value}%`, background:`linear-gradient(90deg, ${color}88, ${color})`, borderRadius:100, transition:'width 1.3s cubic-bezier(0.34,1.56,0.64,1)', boxShadow:`0 0 8px ${color}60` }}/>
      </div>
    </div>
  )
}

/* ─── Main ─── */
export default function BrandPage() {
  const supabase = createClient()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [ws,       setWs]       = useState<any>(null)
  const [tab,      setTab]      = useState<Tab>('overview')
  const [profile,  setProfile]  = useState<any>(null)
  const [learnings,setLearnings]= useState<any[]>([])
  const [assets,   setAssets]   = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [analyzing,setAnalyzing]= useState(false)
  const [uploading,setUploading]= useState(false)
  const [assetType,setAssetType]= useState('logo')
  const [dragOver, setDragOver] = useState(false)
  const [toast,    setToast]    = useState<{msg:string;ok:boolean}|null>(null)
  const [mounted,  setMounted]  = useState(false)

  function toast_(msg:string, ok=true) { setToast({msg,ok}); setTimeout(()=>setToast(null),4000) }

  useEffect(() => { setMounted(true); load() }, [])
  // Safety timeout — force-dismiss loader after 4 s if data fetch stalls
  useEffect(() => { const t = setTimeout(() => setLoading(false), 4000); return () => clearTimeout(t) }, [])

  async function load() {
    try {
      const { data:{ user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data:m } = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id',user.id).limit(1).single()
      const w = (m as any)?.workspaces; setWs(w)
      const [{ data:ba },{ data:lg },{ data:aa }] = await Promise.all([
        supabase.from('brand_assets').select('analysis').eq('workspace_id',w?.id).eq('file_name','nexa_brand_intelligence.json').single(),
        supabase.from('brand_learnings').select('*').eq('workspace_id',w?.id).order('created_at',{ascending:false}).limit(30),
        supabase.from('brand_assets').select('*').eq('workspace_id',w?.id).neq('file_name','nexa_brand_intelligence.json').order('created_at',{ascending:false}),
      ])
      if (ba?.analysis) setProfile(ba.analysis)
      setLearnings(lg??[]); setAssets(aa??[])
    } catch {}
    setLoading(false)
  }

  async function analyze() {
    if (!ws||analyzing) return; setAnalyzing(true)
    try {
      // Convert image assets to base64 so Claude can visually analyze them
      const filePayloads: {name:string;type:string;base64:string}[] = []
      const imageAssets = assets.filter(a =>
        a.file_url && !a.file_url.startsWith('internal://') && !a.file_url.startsWith('uploaded://')
      ).slice(0, 5) // max 5 images

      for (const asset of imageAssets) {
        try {
          const res = await fetch(asset.file_url)
          if (res.ok) {
            const blob = await res.blob()
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader()
              reader.onload = () => resolve((reader.result as string).split(',')[1])
              reader.readAsDataURL(blob)
            })
            filePayloads.push({
              name: asset.file_name || 'asset',
              type: blob.type || 'image/jpeg',
              base64,
            })
          }
        } catch {} // skip assets that can't be fetched
      }

      const r = await fetch('/api/analyze-brand',{
        method:'POST',
        credentials:'include',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          workspace_id:ws.id,
          files: filePayloads,
          brand_name: ws.brand_name || ws.name,
          website_url: ws.brand_website,
        })
      })
      const d = await r.json()
      if (d.success) { setProfile(d.profile); toast_('Brand Brain updated — every output now sounds sharper') }
      else toast_(d.error||'Analysis failed — try again', false)
    } catch { toast_('Something went wrong', false) }
    setAnalyzing(false)
  }

  async function upload(file: File) {
    if (!ws||uploading) return; setUploading(true)
    try {
      const ext  = file.name.split('.').pop()
      const path = `${ws.id}/${assetType}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('brand-assets').upload(path, file)
      if (error) { toast_('Upload failed — check your file and try again', false); return }
      const { data:{ publicUrl } } = supabase.storage.from('brand-assets').getPublicUrl(path)
      await supabase.from('brand_assets').insert({ workspace_id:ws.id, file_name:file.name, type:assetType, file_url:publicUrl, file_size:file.size })
      toast_('Asset uploaded — add more or run analysis')
      load()
    } catch { toast_('Upload failed — check your file and try again', false) }
    setUploading(false)
  }

  async function del(id: string) {
    await supabase.from('brand_assets').delete().eq('id',id)
    toast_('Removed'); load()
  }

  /* ─── Derived data ─── */
  const voice  = profile?.voice_profile  || profile?.voice  || {}
  const aud    = profile?.audience_profile || profile?.audience  || {}
  const visual = profile?.visual_identity || profile?.visual  || {}
  const scores = profile?.brand_scores   || {}

  const voiceScore    = scores.voice_match_score  || profile?.voice_match_score  || 88
  const audienceScore = scores.audience_fit_score || profile?.audience_fit_score || 85
  const visualScore   = scores.visual_style_score || profile?.visual_style_score || 92
  const overallScore  = Math.round((voiceScore + audienceScore + visualScore) / 3)

  // Parse voice traits from profile
  // Voice traits: use real data if present, otherwise derive from profile scores
  const voiceTraits = [
    { label:'Directness',   value: voice.directness   || scores.voice_match_score  || voiceScore,  color:'#4D9FFF' },
    { label:'Authority',    value: voice.authority    || scores.audience_fit_score || audienceScore, color:'#A78BFA' },
    { label:'Warmth',       value: voice.warmth       || 62, color:'#34D399' },
    { label:'Provocation',  value: voice.provocation  || Math.round(voiceScore * 0.82), color:'#FF7A40' },
    { label:'Storytelling', value: voice.storytelling || Math.round(voiceScore * 0.65), color:'#FFB547' },
  ]

  if (loading) return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'center',
      height:'calc(100vh - var(--topbar-h))',
      flexDirection:'column', gap:16, background:'#000',
    }}>
      <div className="nexa-spinner" style={{ width:22, height:22 }}/>
      <div style={{ fontSize:11, color:'var(--t4)', fontFamily:'var(--sans)', letterSpacing:'0.06em', textTransform:'uppercase' as const, fontWeight:500 }}>Loading</div>
    </div>
  )

  /* ─────────────────────────────────────────────────
     UNTRAINED STATE — the invitation
  ───────────────────────────────────────────────── */
  if (!profile && tab !== 'assets') return (
    <div style={{ height:'calc(100vh - var(--topbar-h))', overflowY:'auto' }}>
      {/* Full-bleed hero */}
      <div style={{ position:'relative', overflow:'hidden', padding:'56px 40px 48px', textAlign:'center' }}>
        {/* Background atmosphere */}
        <div style={{ position:'absolute', inset:0, background:'#000000' }}/>
        <div style={{ position:'absolute', top:-80, left:'20%', width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle, rgba(167,139,250,0.25) 0%, transparent 65%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:-40, right:'15%', width:240, height:240, borderRadius:'50%', background:'radial-gradient(circle, rgba(77,159,255,0.18) 0%, transparent 65%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-60, left:'35%', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 65%)', pointerEvents:'none' }}/>

        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
            <svg width="48" height="48" viewBox="0 0 36 36" fill="none">
              <defs>
                <linearGradient id="bb-grad" x1="3" y1="3" x2="33" y2="33" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#4DABF7"/>
                  <stop offset="100%" stopColor="#0C5FBF"/>
                </linearGradient>
              </defs>
              <polygon points="3,33 9,3 17,3 11,33" fill="url(#bb-grad)"/>
              <polygon points="19,3 27,3 33,33 25,33" fill="url(#bb-grad)"/>
            </svg>
          </div>

          <h1 style={{ fontFamily:'var(--display)', fontSize:36, fontWeight:800, letterSpacing:'-0.05em', color:'#ffffff', marginBottom:14, lineHeight:1.05 }}>
            Your Brand Brain is waiting
          </h1>
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.42)', lineHeight:1.85, maxWidth:520, margin:'0 auto 36px' }}>
            Upload your best content, logos, and brand documents. Nexa reads everything, extracts your voice, understands your audience, and builds a deep brand profile that makes every generation feel unmistakably <em style={{ color:'rgba(255,255,255,0.65)', fontStyle:'normal' }}>you</em>.
          </p>

          {/* What happens after training */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, maxWidth:580, margin:'0 auto 36px', textAlign:'left' }}>
            {[
              { color:'#4D9FFF', icon:Ic.mic,    title:'Voice calibrated', desc:'Every output now sounds like you wrote it' },
              { color:'#34D399', icon:Ic.users,  title:'Audience known',  desc:'Nexa writes to your specific people, not the general internet' },
              { color:'#A78BFA', icon:Ic.eye,    title:'Style captured',  desc:'Visual and aesthetic direction guides image generation' },
            ].map(f => (
              <div key={f.title} style={{ padding:'16px', background:'rgba(255,255,255,0.03)', border:`1px solid ${f.color}20`, borderRadius:14 }}>
                <div style={{ width:28, height:28, borderRadius:8, background:`${f.color}14`, border:`1px solid ${f.color}25`, display:'flex', alignItems:'center', justifyContent:'center', color:f.color, marginBottom:10 }}>{f.icon}</div>
                <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.82)', marginBottom:4, letterSpacing:'-0.01em' }}>{f.title}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', lineHeight:1.55 }}>{f.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            <button
              onClick={() => setTab('assets')}
              style={{
                display:'inline-flex', alignItems:'center', gap:8,
                padding:'12px 24px',
                background:'transparent',
                border:'1px solid rgba(255,255,255,0.14)',
                borderRadius:9,
                fontSize:14, fontWeight:600,
                fontFamily:'var(--display)',
                color:'rgba(255,255,255,0.7)',
                cursor:'pointer',
                transition:'all 0.15s',
                letterSpacing:'-0.01em',
              }}>
              <span style={{ display:'flex' }}>{Ic.upload}</span>
              Upload brand assets
            </button>
            {assets.length > 0 && (
              <button
                onClick={analyze}
                disabled={analyzing}
                style={{
                  display:'inline-flex', alignItems:'center', gap:8,
                  padding:'12px 24px',
                  background:'var(--blue)',
                  border:'none',
                  borderRadius:9,
                  fontSize:14, fontWeight:700,
                  fontFamily:'var(--display)',
                  color:'#ffffff',
                  cursor:analyzing?'not-allowed':'pointer',
                  opacity:analyzing?0.7:1,
                  transition:'all 0.15s',
                  letterSpacing:'-0.01em',
                  boxShadow:'0 0 24px rgba(30,142,240,0.25)',
                }}>
                {analyzing
                  ? <><div className="nexa-spinner" style={{ width:14, height:14 }}/>Analyzing…</>
                  : <><span style={{ display:'flex' }}>{Ic.bolt}</span>Analyze {assets.length} asset{assets.length!==1?'s':''}</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  /* ─────────────────────────────────────────────────
     TRAINED STATE — the full dashboard
  ───────────────────────────────────────────────── */
  return (
    <div style={{ height:'calc(100vh - var(--topbar-h))', overflowY:'auto', padding:'28px 32px 48px' }}>

      {/* Header */}
      <div style={{
        display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24,
        opacity:mounted?1:0, transform:mounted?'translateY(0)':'translateY(12px)',
        transition:'opacity 0.45s ease, transform 0.45s ease',
      }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5 }}>
            <h1 style={{ fontFamily:'var(--display)', fontSize:24, fontWeight:800, letterSpacing:'-0.04em', color:'rgba(255,255,255,0.92)', lineHeight:1 }}>
              Brand Brain
            </h1>
            <div style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:100, background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.22)' }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:'#34D399', boxShadow:'0 0 6px #34D399' }}/>
              <span style={{ fontSize:10, fontWeight:700, color:'#34D399' }}>Active</span>
            </div>
          </div>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>
            {assets.length} asset{assets.length!==1?'s':''} · {learnings.length} learnings · Brand score {overallScore}%
          </p>
        </div>
        <div className="nexa-ring-wrap">
          <button onClick={analyze} disabled={analyzing} className="nexa-ring-body" style={{ cursor:analyzing?'not-allowed':'pointer', opacity:analyzing?0.7:1 }}>
            {analyzing
              ? <><div className="nexa-spinner" style={{ width:13, height:13 }}/>Analyzing…</>
              : <><span style={{ display:'flex' }}>{Ic.refresh}</span>Re-analyze</>}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display:'flex', gap:2, marginBottom:26, padding:4,
        background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14,
        opacity:mounted?1:0, transform:mounted?'translateY(0)':'translateY(12px)',
        transition:'opacity 0.45s ease 0.06s, transform 0.45s ease 0.06s',
      }}>
        {TABS.map(t => {
          const on = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'8px 4px', borderRadius:10, border:`1px solid ${on?`${t.color}25`:'transparent'}`, background:on?`${t.color}0e`:'transparent', color:on?t.color:'rgba(255,255,255,0.32)', cursor:'pointer', fontSize:12, fontWeight:on?700:500, fontFamily:'var(--sans)', transition:'all 0.15s', whiteSpace:'nowrap' }}
              onMouseEnter={e => { if(!on)(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { if(!on)(e.currentTarget as HTMLElement).style.background='transparent' }}>
              <span style={{ display:'flex', opacity:on?1:0.5 }}>{t.icon}</span>
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ══════════ OVERVIEW ══════════ */}
      {tab === 'overview' && (
        <div style={{ animation:'pageUp 0.3s ease both' }}>

          {/* Brand health — 3 score rings + overall */}
          <div style={{
            padding:'24px 28px',
            background:'linear-gradient(145deg, rgba(167,139,250,0.08) 0%, rgba(167,139,250,0.03) 100%)',
            border:'1px solid rgba(167,139,250,0.2)',
            borderRadius:20,
            marginBottom:16,
            boxShadow:'0 0 48px rgba(167,139,250,0.07)',
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
              <div>
                <div style={{ fontSize:9, fontWeight:700, color:'#A78BFA', letterSpacing:'0.09em', textTransform:'uppercase', marginBottom:4 }}>Brand Health</div>
                <div style={{ fontFamily:'var(--display)', fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.65)', letterSpacing:'-0.01em' }}>
                  How well Nexa knows your brand
                </div>
              </div>
              {/* Overall score */}
              <div style={{ textAlign:'center' }}>
                <div className="nexa-num" style={{ fontSize:42, color:'var(--blue2)', lineHeight:1 }}>
                  {overallScore}
                </div>
                <div className="nexa-label" style={{ marginTop:4 }}>Overall score</div>
              </div>
            </div>
            {/* Three rings */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
              <ScoreRing score={voiceScore}    color="#4D9FFF" label="Voice match"      size={88}/>
              <ScoreRing score={audienceScore} color="#34D399" label="Audience fit"     size={88}/>
              <ScoreRing score={visualScore}   color="#FF7A40" label="Visual coherence" size={88}/>
            </div>
          </div>

          {/* Brand summary */}
          {profile?.brand_summary && (
            <div style={{ padding:'18px 22px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, marginBottom:14 }}>
              <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.28)', letterSpacing:'0.09em', textTransform:'uppercase', marginBottom:10 }}>Brand summary</div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', lineHeight:1.78, letterSpacing:'-0.01em' }}>
                {profile.brand_summary}
              </div>
            </div>
          )}

          {/* What Nexa knows — two columns */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
            <div style={{ padding:'18px 20px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16 }}>
              <div style={{ fontSize:9, fontWeight:700, color:'rgba(77,159,255,0.7)', letterSpacing:'0.09em', textTransform:'uppercase', marginBottom:12 }}>Voice fingerprint</div>
              {[
                { l:'Tone',       v:voice.tone||ws?.brand_voice||'—' },
                { l:'Style',      v:voice.style||'—' },
                { l:'Personality',v:voice.personality||'—' },
              ].map(item => item.v !== '—' && (
                <div key={item.l} style={{ display:'flex', gap:9, marginBottom:9 }}>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)', width:64, flexShrink:0, paddingTop:2 }}>{item.l}</span>
                  <span style={{ fontSize:12.5, color:'rgba(255,255,255,0.72)', lineHeight:1.5 }}>{item.v}</span>
                </div>
              ))}
            </div>
            <div style={{ padding:'18px 20px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16 }}>
              <div style={{ fontSize:9, fontWeight:700, color:'rgba(52,211,153,0.7)', letterSpacing:'0.09em', textTransform:'uppercase', marginBottom:12 }}>Audience intelligence</div>
              {[
                { l:'Profile',    v:aud.primary||aud.demographics||'—' },
                { l:'Pain',       v:Array.isArray(aud.pain_points)?aud.pain_points[0]:aud.pain_points||'—' },
                { l:'Goal',       v:Array.isArray(aud.goals)?aud.goals[0]:aud.goals||'—' },
              ].map(item => item.v !== '—' && (
                <div key={item.l} style={{ display:'flex', gap:9, marginBottom:9 }}>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)', width:64, flexShrink:0, paddingTop:2 }}>{item.l}</span>
                  <span style={{ fontSize:12.5, color:'rgba(255,255,255,0.72)', lineHeight:1.5 }}>
                    {typeof item.v === 'string' ? item.v.slice(0,80) + (item.v.length > 80 ? '…' : '') : item.v}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent learnings */}
          {learnings.length > 0 && (
            <div style={{ padding:'18px 22px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.28)', letterSpacing:'0.09em', textTransform:'uppercase' }}>Recent learnings</div>
                <span style={{ fontSize:10, color:'rgba(255,255,255,0.25)', fontWeight:500 }}>{learnings.length} total</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
                {learnings.slice(0,6).map(l => {
                  const color = LEARNING_COLORS[l.insight_type] || LEARNING_COLORS.default
                  return (
                    <div key={l.id} style={{ display:'flex', gap:11, padding:'10px 12px', background:'rgba(255,255,255,0.02)', borderRadius:10 }}
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)'}
                      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.02)'}>
                      <div style={{ width:3, borderRadius:100, background:color, flexShrink:0, alignSelf:'stretch', minHeight:16 }}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                          <span style={{ fontSize:9, fontWeight:700, padding:'1px 7px', borderRadius:4, background:`${color}10`, border:`1px solid ${color}22`, color, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                            {l.insight_type||'insight'}
                          </span>
                          {l.source_name && <span style={{ fontSize:9, color:'rgba(255,255,255,0.2)' }}>{l.source_name}</span>}
                        </div>
                        <div style={{ fontSize:12.5, color:'rgba(255,255,255,0.62)', lineHeight:1.6 }}>{l.insight}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════ VOICE ══════════ */}
      {tab === 'voice' && (
        <div style={{ animation:'pageUp 0.3s ease both' }}>
          {/* Voice trait bars */}
          <div style={{ padding:'22px 24px', background:'rgba(77,159,255,0.05)', border:'1px solid rgba(77,159,255,0.15)', borderRadius:18, marginBottom:14, boxShadow:'0 0 32px rgba(77,159,255,0.06)' }}>
            <div style={{ fontSize:9, fontWeight:700, color:'#4D9FFF', letterSpacing:'0.09em', textTransform:'uppercase', marginBottom:18 }}>
              Voice characteristics
            </div>
            {voiceTraits.map(t => <TraitBar key={t.label} {...t}/>)}
          </div>

          {/* Voice details */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:10 }}>
            <InfoBlock label="Brand tone"         value={voice.primary_tone||voice.tone||ws?.brand_voice}          accent="#4D9FFF"/>
            <InfoBlock label="Writing style"      value={voice.writing_style||voice.style}     accent="#4D9FFF"/>
            <InfoBlock label="Personality traits" value={voice.personality||voice.sentence_structure}  accent="#4D9FFF"/>
            <InfoBlock label="Content approach"   value={voice.content_approach||voice.cta_style}  accent="#4D9FFF"/>
            <InfoBlock label="Signature phrases"  tags={voice.key_phrases||voice.vocabulary||[]}  accent="#4D9FFF"/>
            <InfoBlock label="Topics to avoid"    tags={voice.avoid||voice.forbidden||[]}      accent="#FF5757"/>
          </div>

          {/* Tone examples */}
          {voice.examples && voice.examples.length > 0 && (
            <div style={{ marginTop:14 }}>
              <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.28)', letterSpacing:'0.09em', textTransform:'uppercase', marginBottom:12 }}>
                How your voice sounds
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {voice.examples.slice(0,3).map((ex: string, i: number) => (
                  <div key={i} style={{ padding:'16px 20px', background:'rgba(77,159,255,0.04)', border:'1px solid rgba(77,159,255,0.14)', borderRadius:13 }}>
                    <div style={{ fontSize:13.5, color:'rgba(255,255,255,0.8)', lineHeight:1.7, fontStyle:'italic', letterSpacing:'-0.01em' }}>
                      "{ex}"
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!Object.keys(voice).length && !ws?.brand_voice && (
            <div style={{ textAlign:'center', padding:'48px', color:'rgba(255,255,255,0.25)', fontSize:13, border:'1px dashed rgba(255,255,255,0.08)', borderRadius:14 }}>
              Upload brand content and run analysis to extract your voice profile.
            </div>
          )}
        </div>
      )}

      {/* ══════════ AUDIENCE ══════════ */}
      {tab === 'audience' && (
        <div style={{ animation:'pageUp 0.3s ease both' }}>

          {/* Audience hero card */}
          {(aud.primary||aud.demographics) && (
            <div style={{ padding:'22px 24px', background:'linear-gradient(145deg, rgba(52,211,153,0.08) 0%, rgba(52,211,153,0.03) 100%)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:18, marginBottom:14, boxShadow:'0 0 32px rgba(52,211,153,0.06)' }}>
              <div style={{ fontSize:9, fontWeight:700, color:'#34D399', letterSpacing:'0.09em', textTransform:'uppercase', marginBottom:10 }}>Who you're talking to</div>
              <div style={{ fontSize:16, fontWeight:700, color:'rgba(255,255,255,0.9)', lineHeight:1.6, letterSpacing:'-0.02em', fontFamily:'var(--display)' }}>
                {aud.primary||aud.demographics}
              </div>
            </div>
          )}

          {/* Audience details grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:10, marginBottom:14 }}>
            <InfoBlock label="Primary audience"   value={aud.primary||aud.demographics||""}                          accent="#34D399"/>
            <InfoBlock label="Psychographics"     value={aud.psychographics||aud.psychology||""}                                     accent="#34D399"/>
            <InfoBlock label="Pain points"        tags={Array.isArray(aud.pain_points)?aud.pain_points:Array.isArray(aud.pain_points)?aud.pain_points:[aud.pain_points].filter(Boolean)} accent="#FF5757"/>
            <InfoBlock label="Goals & desires"    tags={Array.isArray(aud.goals)?aud.goals:[aud.goals].filter(Boolean)}                    accent="#34D399"/>
            <InfoBlock label="Content they love"  value={aud.content_preferences}                                accent="#34D399"/>
            <InfoBlock label="Platforms they use" tags={Array.isArray(aud.platforms)?aud.platforms:[]}           accent="#4D9FFF"/>
          </div>

          {/* What makes them engage */}
          {aud.engagement_triggers && (
            <div style={{ padding:'18px 22px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16 }}>
              <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.28)', letterSpacing:'0.09em', textTransform:'uppercase', marginBottom:12 }}>
                What makes them engage
              </div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.68)', lineHeight:1.75 }}>{aud.engagement_triggers}</div>
            </div>
          )}
        </div>
      )}

      {/* ══════════ VISUAL ══════════ */}
      {tab === 'visual' && (
        <div style={{ animation:'pageUp 0.3s ease both' }}>

          {/* Color palette */}
          {(visual.colors || visual.color_palette) && (
            <div style={{ padding:'20px 22px', background:'rgba(255,122,64,0.05)', border:'1px solid rgba(255,122,64,0.15)', borderRadius:18, marginBottom:14, boxShadow:'0 0 28px rgba(255,122,64,0.05)' }}>
              <div style={{ fontSize:9, fontWeight:700, color:'#FF7A40', letterSpacing:'0.09em', textTransform:'uppercase', marginBottom:14 }}>
                Color palette
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
                {([...(visual.colors||[]), visual.color_palette, visual.color_mood].filter(Boolean)).map((c: string, i: number) => {
                  const isHex = c.startsWith('#')
                  return (
                    <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                      {isHex && <div style={{ width:44, height:44, borderRadius:12, background:c, border:'1px solid rgba(255,255,255,0.1)', boxShadow:`0 4px 12px ${c}40` }}/>}
                      <span style={{ fontSize:10, color:'rgba(255,255,255,0.5)', fontFamily:'monospace' }}>{c}</span>
                    </div>
                  )
                })}
              </div>
              {!visual.colors?.some((c: string) => c.startsWith('#')) && (
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.65 }}>{visual.color_palette}</div>
              )}
            </div>
          )}

          {/* Visual details */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:10, marginBottom:14 }}>
            <InfoBlock label="Visual style"     value={visual.aesthetic||visual.style||""}                    accent="#FF7A40"/>
            <InfoBlock label="Typography"       value={visual.typography||visual.fonts?.join(', ')||""}       accent="#FF7A40"/>
            <InfoBlock label="Image direction"  value={visual.image_guidelines||visual.photography_style||""}                           accent="#FF7A40"/>
            <InfoBlock label="Visual keywords"  tags={visual.keywords||visual.video_style?[visual.video_style]:[]}                                accent="#FF7A40"/>
          </div>

          {/* Visual assets preview */}
          {assets.filter(a=>a.type==='logo'||a.type==='product_photo').length > 0 && (
            <div style={{ padding:'18px 20px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16 }}>
              <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.28)', letterSpacing:'0.09em', textTransform:'uppercase', marginBottom:14 }}>
                Visual references
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(110px,1fr))', gap:8 }}>
                {assets.filter(a=>a.type==='logo'||a.type==='product_photo').map(a => (
                  <div key={a.id} style={{ borderRadius:12, overflow:'hidden', border:'1px solid rgba(255,255,255,0.09)', aspectRatio:'1', background:'rgba(255,255,255,0.03)' }}>
                    <img src={a.file_url} alt={a.file_name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════ ASSETS ══════════ */}
      {tab === 'assets' && (
        <div style={{ animation:'pageUp 0.3s ease both' }}>

          {/* Upload zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f=e.dataTransfer.files[0]; if(f)upload(f) }}
            onClick={() => fileRef.current?.click()}
            style={{
              padding:'40px 32px',
              border:`1px dashed ${dragOver?'rgba(255,181,71,0.5)':'rgba(255,255,255,0.1)'}`,
              borderRadius:18, textAlign:'center', cursor:'pointer',
              background:dragOver?'rgba(255,181,71,0.05)':'rgba(255,255,255,0.02)',
              transition:'all 0.15s', marginBottom:20,
              boxShadow:dragOver?'0 0 32px rgba(255,181,71,0.08)':'none',
            }}>
            <div style={{ width:52, height:52, borderRadius:16, background:dragOver?'rgba(255,181,71,0.14)':'rgba(255,181,71,0.07)', border:`1px solid ${dragOver?'rgba(255,181,71,0.35)':'rgba(255,181,71,0.18)'}`, display:'flex', alignItems:'center', justifyContent:'center', color:'#FFB547', margin:'0 auto 16px', transition:'all 0.15s' }}>
              {uploading ? <div className="nexa-spinner" style={{ width:14, height:14 }}/> : Ic.upload}
            </div>
            <div style={{ fontFamily:'var(--display)', fontSize:16, fontWeight:700, color:'rgba(255,255,255,0.78)', marginBottom:5, letterSpacing:'-0.02em' }}>
              {uploading ? 'Uploading…' : dragOver ? 'Drop it here' : 'Drop files or click to upload'}
            </div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.32)', lineHeight:1.65 }}>
              Logos, sample posts, product photos, brand guidelines, tone-of-voice docs.<br/>
              The richer the input, the sharper the intelligence.
            </div>
            <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx,.txt" style={{ display:'none' }} onChange={e => e.target.files?.[0] && upload(e.target.files[0])}/>
          </div>

          {/* Asset type */}
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.28)', letterSpacing:'0.09em', textTransform:'uppercase', marginBottom:10 }}>
              Uploading as
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {ASSET_TYPES.map(t => (
                <button key={t.id} onClick={() => setAssetType(t.id)}
                  style={{ padding:'6px 14px', borderRadius:100, fontSize:12, fontWeight:600, background:assetType===t.id?`${t.color}14`:'rgba(255,255,255,0.04)', border:`1px solid ${assetType===t.id?`${t.color}35`:'rgba(255,255,255,0.09)'}`, color:assetType===t.id?t.color:'rgba(255,255,255,0.4)', cursor:'pointer', fontFamily:'var(--sans)', transition:'all 0.14s', textTransform:'capitalize', boxShadow:assetType===t.id?`0 0 10px ${t.color}20`:'none' }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Assets grid */}
          {assets.length > 0 && (
            <>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.28)', letterSpacing:'0.09em', textTransform:'uppercase' }}>
                  {assets.length} asset{assets.length!==1?'s':''} uploaded
                </div>
                {assets.length >= 2 && !profile && (
                  <button onClick={analyze} disabled={analyzing}
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', fontSize:12, fontWeight:700, fontFamily:'var(--display)', background:'#A78BFA', color:'#000', border:'none', borderRadius:9, cursor:'pointer', boxShadow:'0 4px 14px rgba(167,139,250,0.35)', letterSpacing:'-0.01em', transition:'all 0.15s' }}>
                    {analyzing ? 'Analyzing…' : <><span style={{ display:'flex' }}>{Ic.bolt}</span>Analyze now</>}
                  </button>
                )}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:9 }}>
                {assets.map(a => {
                  const isImg = a.file_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i) || ['logo','product_photo','sample_post'].includes(a.type)
                  const typeColor = ASSET_TYPES.find(t=>t.id===a.type)?.color||'#888'
                  return (
                    <div key={a.id}
                      style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, overflow:'hidden', transition:'all 0.15s' }}
                      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.14)';(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)'}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.08)';(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.025)'}}>
                      {/* Thumbnail */}
                      {isImg && a.file_url ? (
                        <div style={{ height:110, overflow:'hidden', background:'rgba(255,255,255,0.04)' }}>
                          <img src={a.file_url} alt={a.file_name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                        </div>
                      ) : (
                        <div style={{ height:72, background:`${typeColor}07`, display:'flex', alignItems:'center', justifyContent:'center', color:typeColor, opacity:0.7 }}>
                          {Ic.file}
                        </div>
                      )}
                      {/* Info row */}
                      <div style={{ padding:'10px 12px', display:'flex', alignItems:'center', gap:9 }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.78)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'-0.01em' }}>
                            {a.file_name}
                          </div>
                          <div style={{ fontSize:10, color:typeColor, marginTop:2, textTransform:'capitalize', fontWeight:600 }}>
                            {a.type?.replace('_',' ')||'asset'}
                          </div>
                        </div>
                        <button onClick={() => del(a.id)}
                          style={{ width:26, height:26, borderRadius:7, background:'transparent', border:'1px solid transparent', color:'rgba(255,255,255,0.25)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}
                          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(255,87,87,0.35)';(e.currentTarget as HTMLElement).style.color='#FF5757'}}
                          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='transparent';(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.25)'}}>
                          {Ic.trash}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Re-analyze prompt */}
              {profile && (
                <div style={{ marginTop:20, padding:'14px 18px', background:'rgba(167,139,250,0.06)', border:'1px solid rgba(167,139,250,0.16)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontSize:12.5, color:'rgba(255,255,255,0.55)', lineHeight:1.5 }}>
                    Added new assets? Re-analyze to keep your Brand Brain up to date.
                  </div>
                  <button onClick={analyze} disabled={analyzing}
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', fontSize:12, fontWeight:700, background:'#A78BFA', color:'#000', border:'none', borderRadius:8, cursor:'pointer', flexShrink:0, marginLeft:16, fontFamily:'var(--sans)', boxShadow:'0 4px 12px rgba(167,139,250,0.3)' }}>
                    <span style={{ display:'flex' }}>{Ic.bolt}</span>
                    {analyzing ? 'Analyzing…' : 'Re-analyze'}
                  </button>
                </div>
              )}
            </>
          )}

          {assets.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px', color:'rgba(255,255,255,0.25)', fontSize:13, lineHeight:1.7 }}>
              No assets uploaded yet.<br/>
              <span style={{ color:'rgba(255,255,255,0.2)', fontSize:12 }}>The more you give Nexa, the better it knows you.</span>
            </div>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, padding:'12px 20px', borderRadius:12, background:toast.ok?'rgba(52,211,153,0.1)':'rgba(255,87,87,0.12)', border:`1px solid ${toast.ok?'rgba(52,211,153,0.28)':'rgba(255,87,87,0.3)'}`, color:toast.ok?'#34D399':'#FF5757', fontSize:13, fontWeight:600, backdropFilter:'blur(16px)', boxShadow:'0 8px 32px rgba(0,0,0,0.45)', animation:'pageUp 0.2s ease both' }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
