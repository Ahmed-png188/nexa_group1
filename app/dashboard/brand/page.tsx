'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type Tab = 'overview' | 'voice' | 'audience' | 'visual' | 'assets'

const Ic = {
  bolt:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  upload:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  refresh: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  trash:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  mic:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>,
  users:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  eye:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  file:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  arrow:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  check:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  brain:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>,
  email:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
}

const TABS = [
  { id:'overview' as Tab, label:'Overview', icon:Ic.brain },
  { id:'voice'    as Tab, label:'Voice',    icon:Ic.mic   },
  { id:'audience' as Tab, label:'Audience', icon:Ic.users },
  { id:'visual'   as Tab, label:'Visual',   icon:Ic.eye   },
  { id:'assets'   as Tab, label:'Assets',   icon:Ic.file  },
]

const ASSET_TYPES = [
  { id:'logo',          label:'Logo'          },
  { id:'sample_post',   label:'Sample Post'   },
  { id:'product_photo', label:'Product Photo' },
  { id:'brand_doc',     label:'Brand Doc'     },
  { id:'other',         label:'Other'         },
] as const

/* ─── Score ring ─── */
function ScoreRing({ score, color, label, size=80 }: { score:number; color:string; label:string; size?:number }) {
  const r = size/2 - 8
  const circ = 2 * Math.PI * r
  const dash = (score/100) * circ
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'10px' }}>
      <div style={{ position:'relative', width:size, height:size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ/4} strokeLinecap="round"
            style={{ transition:'stroke-dasharray 1.4s cubic-bezier(0.34,1.56,0.64,1)' }}/>
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ fontSize:'18px', fontWeight:700, color:'#FFFFFF', letterSpacing:'-0.04em', fontFamily:"'Geist Mono', monospace" }}>{score}</div>
        </div>
      </div>
      <div style={{ fontSize:'10px', fontWeight:600, color:'rgba(255,255,255,0.35)', textAlign:'center', letterSpacing:'0.06em', textTransform:'uppercase', fontFamily:"'Geist', sans-serif" }}>{label}</div>
    </div>
  )
}

/* ─── Info block ─── */
function InfoBlock({ label, value, tags }: { label:string; value?:string; tags?:string[] }) {
  if (!value && (!tags || !tags.length)) return null
  return (
    <div style={{ padding:'18px 20px', background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px' }}>
      <div style={{ fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)', marginBottom:'10px', fontFamily:"'Geist', sans-serif" }}>{label}</div>
      {value && <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.72)', lineHeight:1.75, fontFamily:"'Geist', sans-serif" }}>{value}</div>}
      {tags && tags.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginTop:value?'10px':'0' }}>
          {tags.map((t,i) => (
            <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'8px' }}>
              <div style={{ width:'4px', height:'4px', borderRadius:'50%', background:'rgba(255,255,255,0.35)', flexShrink:0, marginTop:'6px' }}/>
              <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.65)', lineHeight:1.55, fontFamily:"'Geist', sans-serif" }}>{t}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Trait bar ─── */
function TraitBar({ label, value }: { label:string; value:number }) {
  return (
    <div style={{ marginBottom:'16px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
        <span style={{ fontSize:'13px', color:'rgba(255,255,255,0.65)', fontWeight:500, fontFamily:"'Geist', sans-serif" }}>{label}</span>
        <span style={{ fontSize:'11px', fontWeight:600, color:'rgba(255,255,255,0.40)', fontFamily:"'Geist', sans-serif" }}>
          {value < 33 ? 'Low' : value < 66 ? 'Moderate' : 'High'}
        </span>
      </div>
      <div style={{ height:'3px', background:'rgba(255,255,255,0.06)', borderRadius:'100px', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${value}%`, background:'#00AAFF', borderRadius:'100px', transition:'width 1.3s cubic-bezier(0.34,1.56,0.64,1)' }}/>
      </div>
    </div>
  )
}

/* ─── Main ─── */
export default function BrandPage() {
  const supabase = createClient()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [ws,        setWs]        = useState<any>(null)
  const [tab,       setTab]       = useState<Tab>('overview')
  const [profile,   setProfile]   = useState<any>(null)
  const [learnings, setLearnings] = useState<any[]>([])
  const [assets,    setAssets]    = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [assetType, setAssetType] = useState('logo')
  const [dragOver,  setDragOver]  = useState(false)
  const [toast,     setToast]     = useState<{msg:string;ok:boolean}|null>(null)
  const [mounted,   setMounted]   = useState(false)

  function showToast(msg:string, ok=true) { setToast({msg,ok}); setTimeout(()=>setToast(null),4000) }

  useEffect(() => { setMounted(true); load() }, [])
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
      const filePayloads: {name:string;type:string;base64:string}[] = []
      const imageAssets = assets.filter(a => a.file_url && !a.file_url.startsWith('internal://') && !a.file_url.startsWith('uploaded://')).slice(0,5)
      for (const asset of imageAssets) {
        try {
          const res = await fetch(asset.file_url)
          if (res.ok) {
            const blob = await res.blob()
            const base64 = await new Promise<string>((resolve) => { const reader = new FileReader(); reader.onload = () => resolve((reader.result as string).split(',')[1]); reader.readAsDataURL(blob) })
            filePayloads.push({ name:asset.file_name||'asset', type:blob.type||'image/jpeg', base64 })
          }
        } catch {}
      }
      const r = await fetch('/api/analyze-brand',{ method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ workspace_id:ws.id, files:filePayloads, brand_name:ws.brand_name||ws.name, website_url:ws.brand_website }) })
      const d = await r.json()
      if (d.success) { setProfile(d.profile); showToast('Brand Brain updated — every output now sounds sharper') }
      else showToast(d.error||'Analysis failed — try again', false)
    } catch { showToast('Something went wrong', false) }
    setAnalyzing(false)
  }

  async function upload(file: File) {
    if (!ws||uploading) return; setUploading(true)
    try {
      const ext  = file.name.split('.').pop()
      const path = `${ws.id}/${assetType}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('brand-assets').upload(path, file)
      if (error) { showToast('Upload failed — check your file and try again', false); return }
      const { data:{ publicUrl } } = supabase.storage.from('brand-assets').getPublicUrl(path)
      await supabase.from('brand_assets').insert({ workspace_id:ws.id, file_name:file.name, type:assetType, file_url:publicUrl, file_size:file.size })
      showToast('Asset uploaded — add more or run analysis')
      load()
    } catch { showToast('Upload failed — check your file and try again', false) }
    setUploading(false)
  }

  async function del(id: string) {
    await supabase.from('brand_assets').delete().eq('id',id)
    showToast('Removed'); load()
  }

  /* Derived */
  const voice  = profile?.voice_profile  || profile?.voice  || {}
  const aud    = profile?.audience_profile || profile?.audience  || {}
  const visual = profile?.visual_identity || profile?.visual  || {}
  const scores = profile?.brand_scores   || {}

  const voiceScore    = scores.voice_match_score  || profile?.voice_match_score  || 88
  const audienceScore = scores.audience_fit_score || profile?.audience_fit_score || 85
  const visualScore   = scores.visual_style_score || profile?.visual_style_score || 92
  const overallScore  = Math.round((voiceScore + audienceScore + visualScore) / 3)

  const voiceTraits = [
    { label:'Directness',   value: voice.directness   || voiceScore        },
    { label:'Authority',    value: voice.authority    || audienceScore      },
    { label:'Warmth',       value: voice.warmth       || 62                 },
    { label:'Provocation',  value: voice.provocation  || Math.round(voiceScore * 0.82) },
    { label:'Storytelling', value: voice.storytelling || Math.round(voiceScore * 0.65) },
  ]

  /* Loading */
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - var(--topbar-h))', flexDirection:'column', gap:'14px', background:'#0C0C0C' }}>
      <div className="nexa-spinner" style={{ width:22, height:22 }}/>
      <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.25)', fontFamily:"'Geist', sans-serif", letterSpacing:'0.04em' }}>Loading</div>
    </div>
  )

  /* ─────────────────────────────────────
     UNTRAINED STATE
  ───────────────────────────────────── */
  if (!profile && tab !== 'assets') return (
    <div style={{
      height: 'calc(100vh - var(--topbar-h))',
      overflowY: 'auto',
      backgroundImage: 'url(/cyan-header.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 32px',
      position: 'relative',
    }}>
      <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx,.txt" style={{ display:'none' }} onChange={e => e.target.files?.[0] && upload(e.target.files[0])}/>

      <div style={{ position:'relative', zIndex:1, textAlign:'center', maxWidth:620, animation:'pageUp 0.4s cubic-bezier(0.22,1,0.36,1) both' }}>

        {/* Badge */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'6px 14px', borderRadius:999, background:'rgba(0,0,0,0.12)', border:'1px solid rgba(0,0,0,0.16)', marginBottom:32, backdropFilter:'blur(8px)' }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'rgba(0,0,0,0.45)' }}/>
          <span style={{ fontSize:12, fontWeight:600, color:'rgba(0,0,0,0.65)', letterSpacing:'0.02em' }}>Brand Brain · Not trained yet</span>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize:'clamp(32px,5vw,52px)', fontWeight:800, letterSpacing:'-0.04em', color:'#0C0C0C', lineHeight:1.1, marginBottom:16, fontFamily:'var(--sans)' }}>
          Your Brand Brain<br/>is waiting.
        </h1>

        {/* Subline */}
        <p style={{ fontSize:16, color:'rgba(0,0,0,0.52)', lineHeight:1.75, maxWidth:460, margin:'0 auto 40px' }}>
          Upload your best content, logos, and brand documents. Nexa reads everything and builds a profile that makes every generation sound unmistakably you.
        </p>

        {/* Feature cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:40 }}>
          {[
            { icon:Ic.mic,   title:'Voice calibrated', desc:'Every output sounds like you wrote it, not like a robot' },
            { icon:Ic.users, title:'Audience known',    desc:'Writes directly to your clients, not the whole internet' },
            { icon:Ic.eye,   title:'Style captured',    desc:'Visual direction guides every image Nexa generates' },
          ].map((item, i) => (
            <div key={i} style={{ padding:'20px 18px', borderRadius:14, background:'rgba(255,255,255,0.72)', border:'1px solid rgba(255,255,255,0.90)', backdropFilter:'blur(16px)', textAlign:'left' }}>
              <div style={{ width:34, height:34, borderRadius:9, background:'rgba(0,0,0,0.07)', border:'1px solid rgba(0,0,0,0.10)', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(0,0,0,0.55)', marginBottom:12 }}>
                {item.icon}
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:'#0C0C0C', marginBottom:6, letterSpacing:'-0.02em' }}>{item.title}</div>
              <div style={{ fontSize:12, color:'rgba(0,0,0,0.50)', lineHeight:1.65 }}>{item.desc}</div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display:'flex', gap:10, justifyContent:'center', alignItems:'center' }}>
          <button
            onClick={() => fileRef.current?.click()}
            style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'13px 28px', background:'#0C0C0C', border:'none', borderRadius:12, fontSize:14, fontWeight:700, color:'#FFFFFF', cursor:'pointer', transition:'all 0.18s', fontFamily:'var(--sans)', letterSpacing:'-0.01em', boxShadow:'0 4px 24px rgba(0,0,0,0.28)' }}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='#1a1a1a';(e.currentTarget as HTMLElement).style.transform='translateY(-2px)'}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#0C0C0C';(e.currentTarget as HTMLElement).style.transform='none'}}>
            <span style={{ display:'flex' }}>{Ic.upload}</span>
            Upload brand assets
          </button>
          {assets.length > 0 && (
            <button onClick={analyze} disabled={analyzing}
              style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'13px 24px', background:'rgba(0,0,0,0.12)', border:'1px solid rgba(0,0,0,0.18)', borderRadius:12, fontSize:14, fontWeight:600, color:'rgba(0,0,0,0.72)', cursor:analyzing?'not-allowed':'pointer', transition:'all 0.15s', fontFamily:'var(--sans)', backdropFilter:'blur(8px)' }}>
              {analyzing
                ? <><div className="nexa-spinner" style={{ width:13, height:13 }}/>Analyzing…</>
                : <><span style={{ display:'flex' }}>{Ic.bolt}</span>Analyze {assets.length} asset{assets.length!==1?'s':''}</>}
            </button>
          )}
        </div>

        {/* Sub note */}
        <div style={{ marginTop:14, fontSize:12, color:'rgba(0,0,0,0.42)' }}>
          Supports PNG, JPG, PDF, DOCX, TXT · You can add more later
        </div>

        {/* Uploaded assets preview */}
        {assets.length > 0 && (
          <div style={{ marginTop:32 }}>
            <div style={{ fontSize:10, fontWeight:600, color:'rgba(0,0,0,0.40)', letterSpacing:'0.08em', textTransform:'uppercase' as const, marginBottom:12 }}>
              {assets.length} asset{assets.length!==1?'s':''} uploaded
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' as const }}>
              {assets.slice(0,4).map(a => (
                <div key={a.id} style={{ padding:'7px 14px', background:'rgba(255,255,255,0.65)', border:'1px solid rgba(255,255,255,0.85)', borderRadius:8, backdropFilter:'blur(8px)' }}>
                  <div style={{ fontSize:12, fontWeight:500, color:'#0C0C0C', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{a.file_name}</div>
                  <div style={{ fontSize:10, color:'rgba(0,0,0,0.45)', marginTop:2, textTransform:'capitalize' as const }}>{a.type?.replace('_',' ')}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )

  /* ─────────────────────────────────────
     TRAINED STATE
  ───────────────────────────────────── */
  return (
    <div style={{ height:'calc(100vh - var(--topbar-h))', overflowY:'auto', background:'#0C0C0C', fontFamily:"'Geist', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html:`
        .brand-scroll::-webkit-scrollbar { display:none; }
        @keyframes brandUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .b-in { animation: brandUp 0.35s cubic-bezier(0.22,1,0.36,1) both; }
      `}}/>

      {/* ── GRADIENT HERO ── */}
      <div style={{ opacity:mounted?1:0, transition:'opacity 0.4s ease' }}>
        {/* Gradient title */}
        <div style={{
          backgroundImage:'url(/cyan-header.png)',
          backgroundSize:'cover',
          backgroundPosition:'center top',
          padding:'40px 0 28px',
        }}>
          <div style={{ padding:'0 36px', display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:'20px' }}>
            <div>
              <h1 style={{ fontSize:'36px', fontWeight:700, letterSpacing:'-0.04em', color:'#0A0A0A', lineHeight:1, marginBottom:'8px' }}>Brand Brain</h1>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'rgba(0,150,0,0.70)' }}/>
                <span style={{ fontSize:'13px', color:'rgba(0,0,0,0.60)', fontWeight:500 }}>
                  Active · {assets.length} asset{assets.length!==1?'s':''} · {learnings.length} learnings
                </span>
              </div>
            </div>
            {/* Re-analyze CTA — dark on gradient */}
            <button onClick={analyze} disabled={analyzing}
              style={{ display:'inline-flex', alignItems:'center', gap:'7px', padding:'9px 18px', background:'rgba(0,0,0,0.14)', border:'1px solid rgba(0,0,0,0.22)', borderRadius:'10px', fontSize:'12px', fontWeight:600, color:'rgba(0,0,0,0.72)', cursor:analyzing?'not-allowed':'pointer', transition:'all 0.15s', flexShrink:0 }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='rgba(0,0,0,0.22)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='rgba(0,0,0,0.14)'}>
              {analyzing ? <><div className="nexa-spinner" style={{ width:12, height:12 }}/>Analyzing…</> : <><span style={{ display:'flex' }}>{Ic.refresh}</span>Re-analyze</>}
            </button>
          </div>
        </div>

        {/* Tab bar — solid dark */}
        <div style={{ background:'#141414', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ padding:'0 36px', display:'flex' }}>
            {TABS.map(t => {
              const active = tab === t.id
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{ display:'flex', alignItems:'center', gap:'7px', padding:'12px 20px', background:'none', border:'none', borderBottom:`2px solid ${active ? '#00AAFF' : 'transparent'}`, marginBottom:'-1px', color: active ? '#FFFFFF' : 'rgba(255,255,255,0.42)', cursor:'pointer', fontFamily:"'Geist', sans-serif", fontSize:'13px', fontWeight: active ? 600 : 400, transition:'all 0.15s', whiteSpace:'nowrap' }}
                  onMouseEnter={e => { if(!active) (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.72)' }}
                  onMouseLeave={e => { if(!active) (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.42)' }}>
                  <span style={{ display:'flex', opacity: active ? 1 : 0.5 }}>{t.icon}</span>
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── PAGE CONTENT ── */}
      <div style={{ padding:'28px 36px 48px' }}>

        {/* ══════ OVERVIEW ══════ */}
        {tab === 'overview' && (
          <div className="b-in">

            {/* Score rings */}
            <div style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px', padding:'28px 32px', marginBottom:'12px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'28px' }}>
                <div>
                  <div style={{ fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)', marginBottom:'4px' }}>Brand Health</div>
                  <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.55)' }}>How well Nexa knows your brand</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'42px', fontWeight:700, letterSpacing:'-0.05em', color:'#00AAFF', lineHeight:1, fontFamily:"'Geist Mono', monospace" }}>{overallScore}</div>
                  <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.35)', marginTop:'4px', letterSpacing:'0.04em', textTransform:'uppercase' }}>Overall</div>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'20px' }}>
                <ScoreRing score={voiceScore}    color="#00AAFF" label="Voice match"   size={88}/>
                <ScoreRing score={audienceScore} color="#22C55E" label="Audience fit"  size={88}/>
                <ScoreRing score={visualScore}   color="#F59E0B" label="Visual style"  size={88}/>
              </div>
            </div>

            {/* Brand summary */}
            {profile?.brand_summary && (
              <div style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px', padding:'20px 24px', marginBottom:'12px' }}>
                <div style={{ fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)', marginBottom:'10px' }}>Brand Summary</div>
                <div style={{ fontSize:'14px', color:'rgba(255,255,255,0.75)', lineHeight:1.78, letterSpacing:'-0.01em' }}>{profile.brand_summary}</div>
              </div>
            )}

            {/* Two-col: voice + audience */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>
              <div style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px', padding:'20px' }}>
                <div style={{ fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)', marginBottom:'14px' }}>Voice Fingerprint</div>
                {[
                  { l:'Tone',        v:voice.tone||ws?.brand_voice||'—' },
                  { l:'Style',       v:voice.style||'—'                 },
                  { l:'Personality', v:voice.personality||'—'           },
                ].map(item => item.v !== '—' && (
                  <div key={item.l} style={{ display:'flex', gap:'10px', marginBottom:'10px' }}>
                    <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.28)', width:'72px', flexShrink:0, paddingTop:'1px' }}>{item.l}</span>
                    <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.70)', lineHeight:1.5 }}>{item.v}</span>
                  </div>
                ))}
              </div>
              <div style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px', padding:'20px' }}>
                <div style={{ fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)', marginBottom:'14px' }}>Audience Intelligence</div>
                {[
                  { l:'Profile', v:aud.primary||aud.demographics||'—'                                          },
                  { l:'Pain',    v:Array.isArray(aud.pain_points)?aud.pain_points[0]:aud.pain_points||'—'      },
                  { l:'Goal',    v:Array.isArray(aud.goals)?aud.goals[0]:aud.goals||'—'                        },
                ].map(item => item.v !== '—' && (
                  <div key={item.l} style={{ display:'flex', gap:'10px', marginBottom:'10px' }}>
                    <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.28)', width:'72px', flexShrink:0, paddingTop:'1px' }}>{item.l}</span>
                    <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.70)', lineHeight:1.5 }}>{typeof item.v==='string'?item.v.slice(0,80)+(item.v.length>80?'…':''):item.v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick action */}
            <div style={{ marginBottom:'12px' }}>
              <button onClick={() => { const params = new URLSearchParams({ view:'compose', context:`Writing to my audience: ${aud?.primary||aud?.demographics||ws?.brand_audience||'my target audience'}`, objective:'nurture' }); window.location.href = `/dashboard/automate?${params.toString()}` }}
                style={{ display:'inline-flex', alignItems:'center', gap:'7px', padding:'9px 18px', background:'transparent', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px', fontFamily:"'Geist', sans-serif", fontSize:'12px', fontWeight:500, color:'rgba(255,255,255,0.50)', cursor:'pointer', transition:'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.22)'; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.80)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.10)'; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.50)' }}>
                <span style={{ display:'flex' }}>{Ic.email}</span> Email my audience <span style={{ display:'flex' }}>{Ic.arrow}</span>
              </button>
            </div>

            {/* Learnings */}
            {learnings.length > 0 && (
              <div style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px', padding:'20px 24px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
                  <div style={{ fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)' }}>Recent Learnings</div>
                  <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.25)' }}>{learnings.length} total</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                  {learnings.slice(0,6).map(l => (
                    <div key={l.id} style={{ display:'flex', gap:'12px', padding:'10px 12px', background:'rgba(255,255,255,0.02)', borderRadius:'8px', transition:'background 0.12s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.02)'}>
                      <div style={{ width:'3px', borderRadius:'100px', background:'#00AAFF', flexShrink:0, alignSelf:'stretch', minHeight:'16px' }}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px' }}>
                          <span style={{ fontSize:'9px', fontWeight:700, padding:'1px 7px', borderRadius:'4px', background:'rgba(0,170,255,0.10)', border:'1px solid rgba(0,170,255,0.20)', color:'#00AAFF', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                            {l.insight_type||'insight'}
                          </span>
                          {l.source_name && <span style={{ fontSize:'9px', color:'rgba(255,255,255,0.20)' }}>{l.source_name}</span>}
                        </div>
                        <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.60)', lineHeight:1.6 }}>{l.insight}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════ VOICE ══════ */}
        {tab === 'voice' && (
          <div className="b-in">
            {/* Trait bars */}
            <div style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px', padding:'24px', marginBottom:'12px' }}>
              <div style={{ fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)', marginBottom:'20px' }}>Voice Characteristics</div>
              {voiceTraits.map(t => <TraitBar key={t.label} {...t}/>)}
            </div>

            {/* Info blocks grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>
              <InfoBlock label="Brand tone"         value={voice.primary_tone||voice.tone||ws?.brand_voice}/>
              <InfoBlock label="Writing style"      value={voice.writing_style||voice.style}/>
              <InfoBlock label="Personality traits" value={voice.personality||voice.sentence_structure}/>
              <InfoBlock label="Content approach"   value={voice.content_approach||voice.cta_style}/>
              <InfoBlock label="Signature phrases"  tags={voice.key_phrases||voice.vocabulary||[]}/>
              <InfoBlock label="Topics to avoid"    tags={voice.avoid||voice.forbidden||[]}/>
            </div>

            {/* Voice examples */}
            {voice.examples && voice.examples.length > 0 && (
              <div style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px', padding:'20px 24px' }}>
                <div style={{ fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)', marginBottom:'14px' }}>How Your Voice Sounds</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  {voice.examples.slice(0,3).map((ex: string, i: number) => (
                    <div key={i} style={{ padding:'14px 18px', background:'rgba(0,170,255,0.04)', border:'1px solid rgba(0,170,255,0.12)', borderLeft:'3px solid rgba(0,170,255,0.40)', borderRadius:'0 8px 8px 0' }}>
                      <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.75)', lineHeight:1.72, fontStyle:'italic' }}>"{ex}"</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!Object.keys(voice).length && !ws?.brand_voice && (
              <div style={{ textAlign:'center', padding:'48px', color:'rgba(255,255,255,0.25)', fontSize:'13px', border:'1px dashed rgba(255,255,255,0.08)', borderRadius:'10px' }}>
                Upload brand content and run analysis to extract your voice profile.
              </div>
            )}
          </div>
        )}

        {/* ══════ AUDIENCE ══════ */}
        {tab === 'audience' && (
          <div className="b-in">
            {/* Hero audience card */}
            {(aud.primary||aud.demographics) && (
              <div style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px', padding:'24px', marginBottom:'12px' }}>
                <div style={{ fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)', marginBottom:'10px' }}>Who You&apos;re Talking To</div>
                <div style={{ fontSize:'16px', fontWeight:600, color:'rgba(255,255,255,0.88)', lineHeight:1.6, letterSpacing:'-0.02em' }}>
                  {aud.primary||aud.demographics}
                </div>
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px', marginBottom:'12px' }}>
              <InfoBlock label="Primary audience"   value={aud.primary||aud.demographics||''}/>
              <InfoBlock label="Psychographics"     value={aud.psychographics||aud.psychology||''}/>
              <InfoBlock label="Pain points"        tags={Array.isArray(aud.pain_points)?aud.pain_points:[aud.pain_points].filter(Boolean)}/>
              <InfoBlock label="Goals & desires"    tags={Array.isArray(aud.goals)?aud.goals:[aud.goals].filter(Boolean)}/>
              <InfoBlock label="Content they love"  value={aud.content_preferences}/>
              <InfoBlock label="Platforms they use" tags={Array.isArray(aud.platforms)?aud.platforms:[]}/>
            </div>

            {aud.engagement_triggers && (
              <div style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px', padding:'20px 24px' }}>
                <div style={{ fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)', marginBottom:'12px' }}>What Makes Them Engage</div>
                <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.65)', lineHeight:1.75 }}>{aud.engagement_triggers}</div>
              </div>
            )}
          </div>
        )}

        {/* ══════ VISUAL ══════ */}
        {tab === 'visual' && (
          <div className="b-in">
            {/* Color palette */}
            {(visual.colors||visual.color_palette) && (
              <div style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px', padding:'24px', marginBottom:'12px' }}>
                <div style={{ fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)', marginBottom:'16px' }}>Color Palette</div>
                <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', marginBottom:'12px' }}>
                  {([...(visual.colors||[]), visual.color_palette, visual.color_mood].filter(Boolean)).map((c: string, i: number) => {
                    const isHex = c.startsWith('#')
                    return (
                      <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'6px' }}>
                        {isHex && <div style={{ width:44, height:44, borderRadius:'10px', background:c, border:'1px solid rgba(255,255,255,0.10)' }}/>}
                        <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.40)', fontFamily:"'Geist Mono', monospace" }}>{c}</span>
                      </div>
                    )
                  })}
                </div>
                {!visual.colors?.some((c: string) => c.startsWith('#')) && (
                  <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.65)', lineHeight:1.65 }}>{visual.color_palette}</div>
                )}
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px', marginBottom:'12px' }}>
              <InfoBlock label="Visual style"    value={visual.aesthetic||visual.style||''}/>
              <InfoBlock label="Typography"      value={visual.typography||visual.fonts?.join(', ')||''}/>
              <InfoBlock label="Image direction" value={visual.image_guidelines||visual.photography_style||''}/>
              <InfoBlock label="Visual keywords" tags={visual.keywords||visual.video_style?[visual.video_style]:[]}/>
            </div>

            {assets.filter((a:any) => a.type==='logo'||a.type==='product_photo').length > 0 && (
              <div style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px', padding:'20px 24px' }}>
                <div style={{ fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)', marginBottom:'14px' }}>Visual References</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px' }}>
                  {assets.filter((a:any) => a.type==='logo'||a.type==='product_photo').map((a:any) => (
                    <div key={a.id} style={{ borderRadius:'8px', overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)', aspectRatio:'1', background:'rgba(255,255,255,0.03)' }}>
                      <img src={a.file_url} alt={a.file_name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════ ASSETS ══════ */}
        {tab === 'assets' && (
          <div className="b-in">

            {/* Upload zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f=e.dataTransfer.files[0]; if(f) upload(f) }}
              onClick={() => fileRef.current?.click()}
              style={{
                padding:'40px 32px', border:`1px dashed ${dragOver?'rgba(0,170,255,0.40)':'rgba(255,255,255,0.10)'}`,
                borderRadius:'10px', textAlign:'center', cursor:'pointer',
                background:dragOver?'rgba(0,170,255,0.04)':'rgba(255,255,255,0.02)',
                transition:'all 0.15s', marginBottom:'24px',
              }}>
              <div style={{ width:48, height:48, borderRadius:'12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.10)', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.35)', margin:'0 auto 16px', transition:'all 0.15s' }}>
                {uploading ? <div className="nexa-spinner" style={{ width:14, height:14 }}/> : Ic.upload}
              </div>
              <div style={{ fontSize:'15px', fontWeight:600, color:'rgba(255,255,255,0.72)', marginBottom:'6px', letterSpacing:'-0.01em' }}>
                {uploading ? 'Uploading…' : dragOver ? 'Drop it here' : 'Drop files or click to upload'}
              </div>
              <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.30)', lineHeight:1.65 }}>
                Logos, sample posts, product photos, brand guidelines, tone docs.<br/>
                The richer the input, the sharper the intelligence.
              </div>
              <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx,.txt" style={{ display:'none' }} onChange={e => e.target.files?.[0] && upload(e.target.files[0])}/>
            </div>

            {/* Asset type grid */}
            <div style={{ marginBottom:'24px' }}>
              <div style={{ fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)', marginBottom:'12px' }}>Uploading as</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'8px' }}>
                {ASSET_TYPES.map(t => (
                  <button key={t.id} onClick={() => setAssetType(t.id)}
                    style={{ padding:'9px 8px', borderRadius:'8px', fontSize:'11px', fontWeight:500, background: assetType===t.id ? 'rgba(0,170,255,0.10)' : 'rgba(255,255,255,0.02)', border:`1px solid ${assetType===t.id ? 'rgba(0,170,255,0.25)' : 'rgba(255,255,255,0.08)'}`, color: assetType===t.id ? '#00AAFF' : 'rgba(255,255,255,0.35)', cursor:'pointer', fontFamily:"'Geist', sans-serif", transition:'all 0.14s', textAlign:'center', whiteSpace:'nowrap' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Assets grid */}
            {assets.length > 0 && (
              <>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
                  <div style={{ fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)' }}>
                    {assets.length} asset{assets.length!==1?'s':''} uploaded
                  </div>
                  {assets.length >= 2 && !profile && (
                    <button onClick={analyze} disabled={analyzing}
                      style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 16px', fontSize:'12px', fontWeight:600, fontFamily:"'Geist', sans-serif", background:'#FFFFFF', color:'#0C0C0C', border:'none', borderRadius:'8px', cursor:'pointer', transition:'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.88)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='#FFFFFF'}>
                      {analyzing ? 'Analyzing…' : <><span style={{ display:'flex' }}>{Ic.bolt}</span>Analyze now</>}
                    </button>
                  )}
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px' }}>
                  {assets.map((a:any) => {
                    const isImg = a.file_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i) || ['logo','product_photo','sample_post'].includes(a.type)
                    return (
                      <div key={a.id}
                        style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', overflow:'hidden', transition:'all 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.16)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.08)' }}>
                        {isImg && a.file_url ? (
                          <div style={{ height:'100px', overflow:'hidden', background:'rgba(255,255,255,0.04)' }}>
                            <img src={a.file_url} alt={a.file_name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                          </div>
                        ) : (
                          <div style={{ height:'60px', background:'rgba(255,255,255,0.02)', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.20)' }}>
                            {Ic.file}
                          </div>
                        )}
                        <div style={{ padding:'10px 12px', display:'flex', alignItems:'center', gap:'8px' }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:'11px', fontWeight:500, color:'rgba(255,255,255,0.65)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.file_name}</div>
                            <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.28)', marginTop:'2px', textTransform:'capitalize' }}>{a.type?.replace('_',' ')||'asset'}</div>
                          </div>
                          <button onClick={() => del(a.id)}
                            style={{ width:24, height:24, borderRadius:'6px', background:'transparent', border:'1px solid transparent', color:'rgba(255,255,255,0.20)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(239,68,68,0.30)'; (e.currentTarget as HTMLElement).style.color='#EF4444' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='transparent'; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.20)' }}>
                            {Ic.trash}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {profile && (
                  <div style={{ marginTop:'20px', padding:'16px 20px', background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.45)', lineHeight:1.5 }}>
                      Added new assets? Re-analyze to keep Brand Brain sharp.
                    </div>
                    <button onClick={analyze} disabled={analyzing}
                      style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 16px', fontSize:'12px', fontWeight:600, background:'#FFFFFF', color:'#0C0C0C', border:'none', borderRadius:'8px', cursor:'pointer', flexShrink:0, marginLeft:'16px', fontFamily:"'Geist', sans-serif", transition:'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.88)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='#FFFFFF'}>
                      <span style={{ display:'flex' }}>{Ic.bolt}</span>
                      {analyzing ? 'Analyzing…' : 'Re-analyze'}
                    </button>
                  </div>
                )}
              </>
            )}

            {assets.length === 0 && (
              <div style={{ textAlign:'center', padding:'40px', color:'rgba(255,255,255,0.25)', fontSize:'13px', lineHeight:1.7 }}>
                No assets uploaded yet.<br/>
                <span style={{ color:'rgba(255,255,255,0.18)', fontSize:'12px' }}>The more you give Nexa, the better it knows you.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:'24px', right:'24px', zIndex:9999, padding:'12px 20px', borderRadius:'10px', background:toast.ok?'rgba(34,197,94,0.10)':'rgba(239,68,68,0.10)', border:`1px solid ${toast.ok?'rgba(34,197,94,0.25)':'rgba(239,68,68,0.25)'}`, color:toast.ok?'#22C55E':'#EF4444', fontSize:'13px', fontWeight:600, fontFamily:"'Geist', sans-serif", boxShadow:'0 8px 32px rgba(0,0,0,0.45)', animation:'brandUp 0.2s ease both' }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
