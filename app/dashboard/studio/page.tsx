'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type ContentType = 'post'|'thread'|'email'|'caption'|'hook'|'bio'|'ad'|'story'
type Platform    = 'instagram'|'linkedin'|'x'|'tiktok'|'email'|'general'
type ActiveTab   = 'copy'|'image'|'video'|'voice'

const Ic = {
  copy:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  image:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  video:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  voice:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  bolt:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  clone:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  check:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  dl:     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  redo:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>,
  cal:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  play:   <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  upload: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  narrate:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>,
  animate:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
}

const TABS = [
  { id:'copy'  as ActiveTab, label:'Copy',  sub:'Free · Claude',     color:'#0EA5FF' },
  { id:'image' as ActiveTab, label:'Image', sub:'5 cr · Flux',       color:'#A78BFA' },
  { id:'video' as ActiveTab, label:'Video', sub:'20 cr · Kling',     color:'#FF6B2B' },
  { id:'voice' as ActiveTab, label:'Voice', sub:'8 cr · ElevenLabs', color:'#00E5A0' },
]
const ICONS: Record<ActiveTab, React.ReactNode> = { copy:Ic.copy, image:Ic.image, video:Ic.video, voice:Ic.voice }

const FORMATS = [
  { id:'post' as ContentType,    label:'Post',    cost:3, desc:'Full social post' },
  { id:'hook' as ContentType,    label:'Hook',    cost:2, desc:'Scroll-stopper opener' },
  { id:'thread' as ContentType,  label:'Thread',  cost:5, desc:'5–7 part thread' },
  { id:'caption' as ContentType, label:'Caption', cost:2, desc:'Short visual caption' },
  { id:'email' as ContentType,   label:'Email',   cost:5, desc:'Full email copy' },
  { id:'story' as ContentType,   label:'Story',   cost:2, desc:'Story format' },
  { id:'ad' as ContentType,      label:'Ad Copy', cost:5, desc:'Headline + CTA' },
  { id:'bio' as ContentType,     label:'Bio',     cost:2, desc:'Profile bio' },
]
const PLATFORMS = [
  { id:'instagram' as Platform, label:'Instagram', color:'#E1306C' },
  { id:'linkedin'  as Platform, label:'LinkedIn',  color:'#0A66C2' },
  { id:'x'         as Platform, label:'X',         color:'#E7E7E7' },
  { id:'tiktok'    as Platform, label:'TikTok',    color:'#FF0050' },
  { id:'email'     as Platform, label:'Email',     color:'#0EA5FF' },
  { id:'general'   as Platform, label:'General',   color:'#888' },
]
const IMG_STYLES = [
  { id:'photorealistic',                 label:'Photorealistic' },
  { id:'cinematic',                      label:'Cinematic'      },
  { id:'minimal clean white background', label:'Minimal'        },
  { id:'dark moody premium',             label:'Dark & Moody'   },
  { id:'vibrant colorful',               label:'Vibrant'        },
  { id:'flat design illustration',       label:'Illustration'   },
]
const RATIOS = [
  { id:'1:1', label:'1:1', desc:'Square' },
  { id:'4:5', label:'4:5', desc:'Portrait' },
  { id:'16:9',label:'16:9',desc:'Wide' },
  { id:'9:16',label:'9:16',desc:'Story' },
]
const VID_STYLES = ['Cinematic','Documentary','Brand Ad','Social','Minimal','Dramatic']
const VID_MODES  = [
  { id:'text',  label:'Text → Video', desc:'From a description' },
  { id:'image', label:'Image → Video',desc:'Animate a still' },
  { id:'frame', label:'Start → End',  desc:'Control both frames' },
]
const VOICES = [
  { id:'rachel',name:'Rachel',desc:'Warm · Female' },
  { id:'drew',  name:'Drew',  desc:'Confident · Male' },
  { id:'clyde', name:'Clyde', desc:'Expressive · Male' },
  { id:'paul',  name:'Paul',  desc:'Authoritative · Male' },
  { id:'domi',  name:'Domi',  desc:'Strong · Female' },
  { id:'bella', name:'Bella', desc:'Soft · Female' },
  { id:'Antoni',name:'Antoni',desc:'Natural · Male' },
  { id:'elli',  name:'Elli',  desc:'Emotional · Female' },
]
const ANGLES = [
  'The belief that separates those who grow from those who stay stuck',
  'What your audience is getting wrong about this space',
  'The uncomfortable truth behind a common misconception',
  'Why doing less produces better results here',
  'The signal that separates amateurs from operators',
  'What nobody says because it makes the wrong people uncomfortable',
]

/* ─ Small atoms ─ */
function Label({ children }: any) {
  return <div style={{ fontSize:10,fontWeight:700,color:'rgba(244,240,255,0.32)',letterSpacing:'.09em',textTransform:'uppercase',marginBottom:9 }}>{children}</div>
}
function Pill({ label,active,onClick,color='rgba(244,240,255,0.5)' }: any) {
  return (
    <button onClick={onClick} style={{ padding:'5px 13px',borderRadius:100,fontSize:12,fontWeight:600,background:active?`${color}12`:'rgba(255,255,255,0.04)',border:`1px solid ${active?`${color}33`:'rgba(255,255,255,0.08)'}`,color:active?color:'rgba(244,240,255,0.4)',cursor:'pointer',fontFamily:'var(--sans)',transition:'all .15s',flexShrink:0 }}>
      {label}
    </button>
  )
}
function FmtBtn({ f, active, onClick, color }: any) {
  return (
    <button onClick={onClick} style={{ padding:'11px 10px',borderRadius:10,background:active?`${color}09`:'rgba(255,255,255,0.03)',border:`1px solid ${active?`${color}2E`:'rgba(255,255,255,0.07)'}`,cursor:'pointer',fontFamily:'var(--sans)',textAlign:'left',transition:'all .15s' }}>
      <div style={{ fontSize:12,fontWeight:700,color:active?color:'rgba(244,240,255,0.75)',marginBottom:3 }}>{f.label}</div>
      <div style={{ fontSize:10,color:'rgba(244,240,255,0.3)' }}>{f.cost} cr</div>
    </button>
  )
}
function TA({ value,onChange,placeholder,rows=5 }: any) {
  return (
    <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{ width:'100%',padding:'13px 14px',fontSize:13,fontFamily:'var(--sans)',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:11,color:'rgba(244,240,255,0.9)',outline:'none',resize:'vertical',lineHeight:1.65,transition:'border-color .15s',boxSizing:'border-box' }}
      onFocus={e=>e.target.style.borderColor='rgba(14,165,255,0.35)'}
      onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.09)'}/>
  )
}
function GenBtn({ active,loading,onClick,label,loadingLabel,color='#0EA5FF' }: any) {
  return (
    <button onClick={onClick} disabled={!active||loading} style={{ width:'100%',padding:'14px',fontSize:14,fontWeight:700,fontFamily:'var(--display)',background:active?color:'rgba(255,255,255,0.04)',color:active?'#000':'rgba(244,240,255,0.2)',border:`1px solid ${active?'transparent':'rgba(255,255,255,0.07)'}`,borderRadius:12,cursor:active?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',gap:9,letterSpacing:'-0.01em',transition:'all .2s' }}>
      {loading
        ? <><div style={{ width:15,height:15,border:'2px solid rgba(0,0,0,0.25)',borderTopColor:'#000',borderRadius:'50%',animation:'spin 0.8s linear infinite' }}/>Writing…</>
        : <><span style={{ display:'flex' }}>{Ic.bolt}</span>{label}</>}
    </button>
  )
}
function ActBtn({ icon,label,onClick,active=false,color='rgba(244,240,255,0.5)' }: any) {
  return (
    <button onClick={onClick} style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,fontSize:11,fontWeight:600,background:active?`${color}14`:'rgba(255,255,255,0.04)',border:`1px solid ${active?`${color}33`:'rgba(255,255,255,0.08)'}`,color:active?color:'rgba(244,240,255,0.5)',cursor:'pointer',fontFamily:'var(--sans)',transition:'all .15s' }}>
      <span style={{ display:'flex' }}>{icon}</span>{label}
    </button>
  )
}
function ErrMsg({ msg }: any) {
  return <div style={{ marginTop:12,padding:'12px 14px',background:'rgba(255,77,77,0.06)',border:'1px solid rgba(255,77,77,0.18)',borderRadius:10,fontSize:13,color:'#FF6B6B' }}>{msg}</div>
}
function ProvBadge({ name,desc,color }: any) {
  return (
    <div style={{ display:'flex',alignItems:'center',gap:8,padding:'9px 14px',background:`${color}08`,border:`1px solid ${color}22`,borderRadius:10,marginBottom:20 }}>
      <div style={{ width:5,height:5,borderRadius:'50%',background:color,flexShrink:0 }}/>
      <span style={{ fontSize:12,fontWeight:700,color }}>{name}</span>
      <span style={{ fontSize:12,color:'rgba(244,240,255,0.35)' }}>·</span>
      <span style={{ fontSize:12,color:'rgba(244,240,255,0.4)' }}>{desc}</span>
    </div>
  )
}

export default function StudioPage() {
  const supabase = createClient()
  const startRef = useRef<HTMLInputElement>(null)
  const endRef   = useRef<HTMLInputElement>(null)
  const imgRef   = useRef<HTMLInputElement>(null)

  const [ws,      setWs]      = useState<any>(null)
  const [credits, setCr]      = useState(0)
  const [tab,     setTab]     = useState<ActiveTab>('copy')
  const [recent,  setRecent]  = useState<any[]>([])

  // copy
  const [fmt,       setFmt]       = useState<ContentType>('post')
  const [plat,      setPlat]      = useState<Platform>('instagram')
  const [prompt,    setPrompt]    = useState('')
  const [genning,   setGenning]   = useState(false)
  const [result,    setResult]    = useState<string|null>(null)
  const [resultId,  setResultId]  = useState<string|null>(null)
  const [crUsed,    setCrUsed]    = useState(0)
  const [copied,    setCopied]    = useState(false)
  const [sched,     setSched]     = useState(false)
  const [copyErr,   setCopyErr]   = useState<string|null>(null)

  // image
  const [iPrompt,   setIPrompt]   = useState('')
  const [iStyle,    setIStyle]    = useState('photorealistic')
  const [iRatio,    setIRatio]    = useState('1:1')
  const [iGen,      setIGen]      = useState(false)
  const [iResult,   setIResult]   = useState<string|null>(null)
  const [iErr,      setIErr]      = useState<string|null>(null)

  // video
  const [vPrompt,   setVPrompt]   = useState('')
  const [vStyle,    setVStyle]    = useState('Cinematic')
  const [vDur,      setVDur]      = useState(5)
  const [vRatio,    setVRatio]    = useState('16:9')
  const [vMode,     setVMode]     = useState<'text'|'image'|'frame'>('text')
  const [vImgUrl,   setVImgUrl]   = useState('')
  const [startUrl,  setStartUrl]  = useState('')
  const [endUrl,    setEndUrl]    = useState('')
  const [motion,    setMotion]    = useState(0.5)
  const [vGen,      setVGen]      = useState(false)
  const [vResult,   setVResult]   = useState<string|null>(null)
  const [vProg,     setVProg]     = useState(0)
  const [vErr,      setVErr]      = useState<string|null>(null)

  // voice
  const [vxText,    setVxText]    = useState('')
  const [vxId,      setVxId]      = useState('rachel')
  const [stability, setStability] = useState(0.5)
  const [vxGen,     setVxGen]     = useState(false)
  const [vxResult,  setVxResult]  = useState<string|null>(null)
  const [vxErr,     setVxErr]     = useState<string|null>(null)

  useEffect(() => { loadWs() }, [])

  async function loadWs() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return
    const { data:m } = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id',user.id).limit(1).single()
    const w = (m as any)?.workspaces
    setWs(w)
    const { data:cr } = await supabase.from('credits').select('balance').eq('workspace_id',w?.id).single()
    setCr(cr?.balance??0)
    loadRecent(w?.id)
    supabase.channel('studio-rt')
      .on('postgres_changes',{event:'*',schema:'public',table:'content',filter:`workspace_id=eq.${w?.id}`},()=>loadRecent(w?.id))
      .on('postgres_changes',{event:'*',schema:'public',table:'credits',filter:`workspace_id=eq.${w?.id}`},(p:any)=>{if(p.new?.balance!==undefined)setCr(p.new.balance)})
      .subscribe()
  }
  async function loadRecent(id:string) {
    if (!id) return
    const { data } = await supabase.from('content').select('*').eq('workspace_id',id).order('created_at',{ascending:false}).limit(14)
    setRecent(data??[])
  }

  async function generateCopy() {
    if (!prompt.trim()||genning) return
    setGenning(true);setResult(null);setCopyErr(null);setSched(false);setCopied(false)
    try {
      const r = await fetch('/api/generate-content',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspace_id:ws?.id,type:fmt,platform:plat,prompt:prompt.trim()})})
      const d = await r.json()
      if (!r.ok){setCopyErr(r.status===402?d.message:(d.error??'Generation failed'));return}
      setResult(d.content);setResultId(d.content_id);setCrUsed(d.credits_used)
    } catch { setCopyErr('Something went wrong. Try again.') }
    setGenning(false)
  }

  async function generateImage() {
    if (!iPrompt.trim()||iGen) return
    setIGen(true);setIResult(null);setIErr(null)
    try {
      const r = await fetch('/api/generate-image',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspace_id:ws?.id,prompt:iPrompt.trim(),style:iStyle,aspect_ratio:iRatio})})
      const d = await r.json()
      if (!r.ok){setIErr(r.status===402?d.message:(d.error??'Failed'));return}
      setIResult(d.image_url)
    } catch { setIErr('Something went wrong.') }
    setIGen(false)
  }

  async function generateVideo() {
    if (!vPrompt.trim()||vGen) return
    setVGen(true);setVResult(null);setVErr(null);setVProg(0)
    const iv = setInterval(()=>setVProg(p=>p<88?+(p+Math.random()*4).toFixed(1):p),4000)
    try {
      const body:any = {workspace_id:ws?.id,prompt:vPrompt.trim(),style:vStyle.toLowerCase(),duration:vDur,aspect_ratio:vRatio,motion_strength:motion}
      if (vMode==='image'&&vImgUrl) body.image_url=vImgUrl
      if (vMode==='frame'){body.start_frame_url=startUrl;body.end_frame_url=endUrl}
      const r = await fetch('/api/generate-video',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
      const d = await r.json()
      clearInterval(iv)
      if (!r.ok){setVErr(r.status===402?d.message:(d.error??'Failed'));return}
      setVProg(100);setVResult(d.video_url)
    } catch { clearInterval(iv);setVErr('Something went wrong.') }
    setVGen(false)
  }

  async function generateVoice() {
    if (!vxText.trim()||vxGen) return
    setVxGen(true);setVxResult(null);setVxErr(null)
    try {
      const r = await fetch('/api/generate-voice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspace_id:ws?.id,text:vxText.trim(),voice_id:vxId,stability})})
      const d = await r.json()
      if (!r.ok){setVxErr(r.status===402?d.message:(d.error??'Failed'));return}
      setVxResult(d.audio_url)
    } catch { setVxErr('Something went wrong.') }
    setVxGen(false)
  }

  async function copyText(text:string) { await navigator.clipboard.writeText(text);setCopied(true);setTimeout(()=>setCopied(false),2000) }
  async function schedulePost() {
    if (!resultId) return
    const t=new Date();t.setDate(t.getDate()+1);t.setHours(9,0,0,0)
    await supabase.from('content').update({status:'scheduled',scheduled_for:t.toISOString()}).eq('id',resultId)
    setSched(true)
  }
  function uploadFile(file:File,set:(u:string)=>void) { const r=new FileReader();r.onload=e=>set(e.target?.result as string);r.readAsDataURL(file) }

  const selFmt   = FORMATS.find(f=>f.id===fmt)!
  const tabColor = TABS.find(t=>t.id===tab)?.color??'#0EA5FF'

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.8)}}
        input[type="range"]{accent-color:var(--cyan);}
        .rc:hover{background:rgba(255,255,255,0.06)!important;border-color:rgba(255,255,255,0.12)!important;}
        .fb:hover{border-color:rgba(14,165,255,0.25)!important;background:rgba(14,165,255,0.04)!important;}
      `}</style>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 256px',height:'calc(100vh - var(--topbar-h))',overflow:'hidden' }}>

        {/* ── LEFT CANVAS ── */}
        <div style={{ overflowY:'auto',padding:'28px 32px',borderRight:'1px solid rgba(255,255,255,0.06)' }}>

          {/* Header */}
          <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:24,animation:'fadeUp .4s ease both' }}>
            <div>
              <h1 style={{ fontFamily:'var(--display)',fontSize:22,fontWeight:800,letterSpacing:'-0.04em',color:'rgba(244,240,255,0.95)',marginBottom:4,lineHeight:1 }}>Studio</h1>
              <p style={{ fontSize:12,color:'rgba(244,240,255,0.32)' }}>{ws?.brand_voice?`Writing as: ${ws.brand_voice.slice(0,55)}…`:'Your brand voice powers every generation'}</p>
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:6,padding:'6px 12px',background:'rgba(14,165,255,0.06)',border:'1px solid rgba(14,165,255,0.18)',borderRadius:9 }}>
              <div style={{ width:5,height:5,borderRadius:'50%',background:'#0EA5FF',animation:'pulse-dot 2s ease-in-out infinite' }}/>
              <span style={{ fontFamily:'var(--display)',fontSize:13,fontWeight:700,color:'#0EA5FF' }}>{credits.toLocaleString()}</span>
              <span style={{ fontSize:11,color:'rgba(14,165,255,0.5)' }}>credits</span>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display:'flex',gap:4,marginBottom:28,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:4,animation:'fadeUp .4s ease .05s both' }}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)}
                style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:7,padding:'10px 8px',borderRadius:11,background:tab===t.id?'rgba(255,255,255,0.07)':'transparent',border:`1px solid ${tab===t.id?'rgba(255,255,255,0.12)':'transparent'}`,color:tab===t.id?t.color:'rgba(244,240,255,0.32)',cursor:'pointer',fontSize:13,fontWeight:tab===t.id?700:400,fontFamily:'var(--sans)',transition:'all .15s' }}>
                <span style={{ display:'flex' }}>{ICONS[t.id]}</span>
                <span>{t.label}</span>
                <span style={{ fontSize:10,color:tab===t.id?`${t.color}80`:'rgba(244,240,255,0.18)',marginLeft:2 }}>{t.sub}</span>
              </button>
            ))}
          </div>

          {/* ── COPY ── */}
          {tab==='copy' && (
            <div style={{ maxWidth:640,animation:'fadeUp .35s ease both' }}>
              <div style={{ marginBottom:22 }}>
                <Label>Format</Label>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7 }}>
                  {FORMATS.map(f=><FmtBtn key={f.id} f={f} active={fmt===f.id} onClick={()=>setFmt(f.id)} color="#0EA5FF"/>)}
                </div>
              </div>
              <div style={{ marginBottom:22 }}>
                <Label>Platform</Label>
                <div style={{ display:'flex',gap:5,flexWrap:'wrap' }}>
                  {PLATFORMS.map(p=><Pill key={p.id} label={p.label} active={plat===p.id} onClick={()=>setPlat(p.id)} color={p.color}/>)}
                </div>
              </div>
              <div style={{ marginBottom:14 }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:9 }}>
                  <Label>Direction</Label>
                  <span style={{ fontSize:10,color:'rgba(244,240,255,0.22)' }}>⌘+Enter to generate</span>
                </div>
                <TA value={prompt} onChange={setPrompt} rows={5}
                  placeholder={`Give Nexa a direction, angle, or idea.\n\n"Why perfectionism is killing your engagement" lands harder than "a post about productivity."`}/>
              </div>
              <div style={{ marginBottom:22,display:'flex',gap:5,flexWrap:'wrap' }}>
                {ANGLES.slice(0,4).map((a,i)=>(
                  <button key={i} onClick={()=>setPrompt(a)}
                    style={{ padding:'4px 11px',borderRadius:100,fontSize:11,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',color:'rgba(244,240,255,0.38)',cursor:'pointer',fontFamily:'var(--sans)',transition:'all .15s',textAlign:'left' }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(14,165,255,0.22)';(e.currentTarget as HTMLElement).style.color='rgba(244,240,255,0.7)'}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.07)';(e.currentTarget as HTMLElement).style.color='rgba(244,240,255,0.38)'}}>
                    {a.length>52?a.slice(0,52)+'…':a}
                  </button>
                ))}
              </div>
              <GenBtn active={!!prompt.trim()} loading={genning} onClick={generateCopy}
                label={`Write ${selFmt.label} · ${selFmt.cost} credits`} loadingLabel="Writing in your brand voice…" color="#0EA5FF"/>
              {copyErr && <ErrMsg msg={copyErr}/>}
              {result && (
                <div style={{ marginTop:16,animation:'fadeUp .35s ease both' }}>
                  <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:7 }}>
                      <div style={{ width:5,height:5,borderRadius:'50%',background:'#0EA5FF' }}/>
                      <span style={{ fontSize:12,fontWeight:600,color:'rgba(244,240,255,0.55)' }}>{selFmt.label} · {crUsed} cr</span>
                    </div>
                    <div style={{ display:'flex',gap:5 }}>
                      <ActBtn icon={copied?Ic.check:Ic.clone} label={copied?'Copied':'Copy'} onClick={()=>copyText(result!)} active={copied} color="#0EA5FF"/>
                      <ActBtn icon={Ic.redo}    label="Rewrite"  onClick={generateCopy}/>
                      <ActBtn icon={Ic.narrate} label="Narrate"  onClick={()=>{setVxText(result!);setTab('voice')}} color="#00E5A0"/>
                      <ActBtn icon={sched?Ic.check:Ic.cal} label={sched?'Queued':'Schedule'} onClick={schedulePost} active={sched} color="#FFB547"/>
                    </div>
                  </div>
                  <div style={{ padding:'18px 20px',background:'rgba(0,0,0,0.35)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,fontSize:14,color:'rgba(244,240,255,0.9)',lineHeight:1.8,whiteSpace:'pre-wrap' }}>{result}</div>
                </div>
              )}
            </div>
          )}

          {/* ── IMAGE ── */}
          {tab==='image' && (
            <div style={{ maxWidth:640,animation:'fadeUp .35s ease both' }}>
              <ProvBadge name="Flux" desc="Photorealistic brand imagery · ~15 seconds · 5 credits" color="#A78BFA"/>
              <div style={{ marginBottom:20 }}>
                <Label>Describe your image</Label>
                <TA value={iPrompt} onChange={setIPrompt} rows={4}
                  placeholder={`Be specific. "A focused founder at a dark oak desk, morning light through tall windows, premium editorial photography" performs far better than "a business person."`}/>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:22 }}>
                <div>
                  <Label>Visual style</Label>
                  <div style={{ display:'flex',gap:5,flexWrap:'wrap' }}>
                    {IMG_STYLES.map(s=><Pill key={s.id} label={s.label} active={iStyle===s.id} onClick={()=>setIStyle(s.id)} color="#A78BFA"/>)}
                  </div>
                </div>
                <div>
                  <Label>Format</Label>
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:6 }}>
                    {RATIOS.map(r=>(
                      <button key={r.id} className="fb" onClick={()=>setIRatio(r.id)}
                        style={{ padding:'9px 6px',borderRadius:9,background:iRatio===r.id?'rgba(167,139,250,0.08)':'rgba(255,255,255,0.03)',border:`1px solid ${iRatio===r.id?'rgba(167,139,250,0.28)':'rgba(255,255,255,0.07)'}`,color:iRatio===r.id?'#A78BFA':'rgba(244,240,255,0.45)',cursor:'pointer',fontFamily:'var(--sans)',textAlign:'center',transition:'all .15s' }}>
                        <div style={{ fontSize:11,fontWeight:700 }}>{r.label}</div>
                        <div style={{ fontSize:10,opacity:.55 }}>{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <GenBtn active={!!iPrompt.trim()} loading={iGen} onClick={generateImage} label="Generate image · 5 credits" loadingLabel="Flux is rendering…" color="#A78BFA"/>
              {iErr && <ErrMsg msg={iErr}/>}
              {iResult && (
                <div style={{ marginTop:16,animation:'fadeUp .35s ease both' }}>
                  <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
                    <span style={{ fontSize:12,fontWeight:600,color:'rgba(244,240,255,0.55)' }}>Image · 5 cr</span>
                    <div style={{ display:'flex',gap:5 }}>
                      <ActBtn icon={Ic.animate} label="Animate" onClick={()=>{setTab('video');setVMode('image');setVImgUrl(iResult!)}} color="#FF6B2B"/>
                      <a href={iResult} download={`nexa-${Date.now()}.jpg`} style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,fontSize:11,fontWeight:600,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(244,240,255,0.5)',textDecoration:'none' }}>{Ic.dl} Download</a>
                      <ActBtn icon={Ic.redo} label="Redo" onClick={generateImage}/>
                    </div>
                  </div>
                  <div style={{ borderRadius:12,overflow:'hidden',border:'1px solid rgba(255,255,255,0.08)' }}>
                    <img src={iResult} alt="Generated" style={{ width:'100%',display:'block',maxHeight:520,objectFit:'cover' }}/>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── VIDEO ── */}
          {tab==='video' && (
            <div style={{ maxWidth:640,animation:'fadeUp .35s ease both' }}>
              <ProvBadge name="Kling 3.0" desc="Cinematic video · 1–3 min to render · 20 credits" color="#FF6B2B"/>
              <div style={{ marginBottom:20 }}>
                <Label>Mode</Label>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7 }}>
                  {VID_MODES.map(m=>(
                    <button key={m.id} className="fb" onClick={()=>setVMode(m.id as any)}
                      style={{ padding:'11px 10px',borderRadius:10,background:vMode===m.id?'rgba(255,107,43,0.08)':'rgba(255,255,255,0.03)',border:`1px solid ${vMode===m.id?'rgba(255,107,43,0.28)':'rgba(255,255,255,0.07)'}`,cursor:'pointer',fontFamily:'var(--sans)',textAlign:'left',transition:'all .15s' }}>
                      <div style={{ fontSize:12,fontWeight:700,color:vMode===m.id?'#FF6B2B':'rgba(244,240,255,0.75)',marginBottom:3 }}>{m.label}</div>
                      <div style={{ fontSize:10,color:'rgba(244,240,255,0.3)' }}>{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              {vMode==='image' && (
                <div style={{ marginBottom:20 }}>
                  <Label>Source image</Label>
                  {vImgUrl ? (
                    <div style={{ position:'relative',borderRadius:10,overflow:'hidden',border:'1px solid rgba(255,107,43,0.2)' }}>
                      <img src={vImgUrl} alt="" style={{ width:'100%',maxHeight:200,objectFit:'cover',display:'block' }}/>
                      <button onClick={()=>setVImgUrl('')} style={{ position:'absolute',top:8,right:8,padding:'4px 9px',borderRadius:6,fontSize:11,background:'rgba(0,0,0,0.75)',border:'none',color:'#fff',cursor:'pointer' }}>Remove</button>
                    </div>
                  ) : (
                    <div onClick={()=>imgRef.current?.click()} style={{ padding:'28px',border:'1px dashed rgba(255,255,255,0.1)',borderRadius:11,textAlign:'center',cursor:'pointer',color:'rgba(244,240,255,0.35)',display:'flex',alignItems:'center',justifyContent:'center',gap:9,fontSize:13 }}>
                      {Ic.upload}<span>Upload image to animate</span>
                      <input ref={imgRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>e.target.files?.[0]&&uploadFile(e.target.files[0],setVImgUrl)}/>
                    </div>
                  )}
                </div>
              )}
              {vMode==='frame' && (
                <div style={{ marginBottom:20,display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
                  {([{l:'Start frame',u:startUrl,s:setStartUrl,r:startRef},{l:'End frame',u:endUrl,s:setEndUrl,r:endRef}] as any[]).map(f=>(
                    <div key={f.l}>
                      <Label>{f.l}</Label>
                      {f.u ? (
                        <div style={{ position:'relative',borderRadius:9,overflow:'hidden',border:'1px solid rgba(255,107,43,0.2)' }}>
                          <img src={f.u} alt="" style={{ width:'100%',height:110,objectFit:'cover',display:'block' }}/>
                          <button onClick={()=>f.s('')} style={{ position:'absolute',top:6,right:6,padding:'3px 7px',borderRadius:5,fontSize:10,background:'rgba(0,0,0,0.75)',border:'none',color:'#fff',cursor:'pointer' }}>✕</button>
                        </div>
                      ) : (
                        <div onClick={()=>f.r.current?.click()} style={{ height:110,border:'1px dashed rgba(255,255,255,0.1)',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'rgba(244,240,255,0.3)',gap:7,fontSize:12 }}>
                          {Ic.upload} Upload
                          <input ref={f.r} type="file" accept="image/*" style={{ display:'none' }} onChange={(e:any)=>e.target.files?.[0]&&uploadFile(e.target.files[0],f.s)}/>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginBottom:20 }}>
                <Label>Describe the scene</Label>
                <TA value={vPrompt} onChange={setVPrompt} rows={4} placeholder="A founder walking into a glass building at golden hour, confidence in every step, cinematic lens flare, premium brand feel…"/>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:18,marginBottom:20 }}>
                <div>
                  <Label>Style</Label>
                  <div style={{ display:'flex',gap:5,flexWrap:'wrap' }}>
                    {VID_STYLES.map(s=><Pill key={s} label={s} active={vStyle===s} onClick={()=>setVStyle(s)} color="#FF6B2B"/>)}
                  </div>
                </div>
                <div>
                  <Label>Duration & ratio</Label>
                  <div style={{ display:'flex',gap:5,marginBottom:7 }}>
                    {[5,10].map(d=><Pill key={d} label={`${d}s`} active={vDur===d} onClick={()=>setVDur(d)} color="#FF6B2B"/>)}
                  </div>
                  <div style={{ display:'flex',gap:5 }}>
                    {['16:9','9:16','1:1'].map(r=><Pill key={r} label={r} active={vRatio===r} onClick={()=>setVRatio(r)} color="#FF6B2B"/>)}
                  </div>
                </div>
              </div>
              <div style={{ marginBottom:22 }}>
                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:8 }}>
                  <Label>Motion intensity</Label>
                  <span style={{ fontSize:11,color:'rgba(244,240,255,0.32)' }}>{motion<.35?'Subtle':motion>.65?'Dynamic':'Balanced'} · {Math.round(motion*100)}%</span>
                </div>
                <input type="range" min="0" max="1" step="0.05" value={motion} onChange={e=>setMotion(parseFloat(e.target.value))} style={{ width:'100%' }}/>
              </div>
              <GenBtn active={!!vPrompt.trim()} loading={vGen} onClick={generateVideo} label="Generate video · 20 credits" loadingLabel="Kling is rendering your clip…" color="#FF6B2B"/>
              {vGen && (
                <div style={{ marginTop:14 }}>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:11,color:'rgba(244,240,255,0.32)' }}>
                    <span>Rendering takes 1–3 minutes.</span><span>{Math.round(vProg)}%</span>
                  </div>
                  <div style={{ height:3,background:'rgba(255,255,255,0.06)',borderRadius:3,overflow:'hidden' }}>
                    <div style={{ height:'100%',width:`${vProg}%`,background:'linear-gradient(90deg,rgba(255,80,0,0.9),#FF6B2B)',borderRadius:3,transition:'width 1s ease' }}/>
                  </div>
                </div>
              )}
              {vErr && <ErrMsg msg={vErr}/>}
              {vResult && (
                <div style={{ marginTop:16,animation:'fadeUp .35s ease both' }}>
                  <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
                    <span style={{ fontSize:12,fontWeight:600,color:'rgba(244,240,255,0.55)' }}>Video · 20 cr</span>
                    <div style={{ display:'flex',gap:5 }}>
                      <a href={vResult} download={`nexa-${Date.now()}.mp4`} style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,fontSize:11,fontWeight:600,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(244,240,255,0.5)',textDecoration:'none' }}>{Ic.dl} Download</a>
                      <ActBtn icon={Ic.redo} label="Redo" onClick={generateVideo}/>
                    </div>
                  </div>
                  <div style={{ borderRadius:12,overflow:'hidden',border:'1px solid rgba(255,255,255,0.08)',background:'#000' }}>
                    <video src={vResult} controls style={{ width:'100%',display:'block',maxHeight:440 }}/>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── VOICE ── */}
          {tab==='voice' && (
            <div style={{ maxWidth:640,animation:'fadeUp .35s ease both' }}>
              <ProvBadge name="ElevenLabs" desc="Ultra-realistic AI voiceovers · 8 languages · 8 credits" color="#00E5A0"/>
              <div style={{ marginBottom:22 }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:9 }}>
                  <Label>Script</Label>
                  <span style={{ fontSize:11,color:'rgba(244,240,255,0.22)' }}>{vxText.length}/5000</span>
                </div>
                <TA value={vxText} onChange={(v:string)=>setVxText(v.slice(0,5000))} rows={6} placeholder="Paste your script. Works best with copy generated in the Copy tab — it's already in your brand voice."/>
                {result && (
                  <button onClick={()=>setVxText(result)} style={{ display:'flex',alignItems:'center',gap:6,marginTop:8,padding:'5px 12px',borderRadius:7,fontSize:11,fontWeight:600,background:'rgba(0,229,160,0.07)',border:'1px solid rgba(0,229,160,0.18)',color:'#00E5A0',cursor:'pointer',fontFamily:'var(--sans)' }}>
                    {Ic.clone} Use last generated copy
                  </button>
                )}
              </div>
              <div style={{ marginBottom:22 }}>
                <Label>Voice</Label>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7 }}>
                  {VOICES.map(v=>(
                    <button key={v.id} className="fb" onClick={()=>setVxId(v.id)}
                      style={{ padding:'10px 8px',borderRadius:10,background:vxId===v.id?'rgba(0,229,160,0.07)':'rgba(255,255,255,0.03)',border:`1px solid ${vxId===v.id?'rgba(0,229,160,0.25)':'rgba(255,255,255,0.07)'}`,cursor:'pointer',fontFamily:'var(--sans)',textAlign:'left',transition:'all .15s' }}>
                      <div style={{ fontSize:12,fontWeight:700,color:vxId===v.id?'#00E5A0':'rgba(244,240,255,0.75)',marginBottom:2 }}>{v.name}</div>
                      <div style={{ fontSize:10,color:'rgba(244,240,255,0.3)' }}>{v.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom:24 }}>
                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:8 }}>
                  <Label>Stability</Label>
                  <span style={{ fontSize:11,color:'rgba(244,240,255,0.32)' }}>{stability<.4?'Expressive':stability>.7?'Consistent':'Balanced'} · {Math.round(stability*100)}%</span>
                </div>
                <input type="range" min="0" max="1" step="0.05" value={stability} onChange={e=>setStability(parseFloat(e.target.value))} style={{ width:'100%' }}/>
              </div>
              <GenBtn active={!!vxText.trim()} loading={vxGen} onClick={generateVoice} label="Generate voiceover · 8 credits" loadingLabel="Generating with ElevenLabs…" color="#00E5A0"/>
              {vxErr && <ErrMsg msg={vxErr}/>}
              {vxResult && (
                <div style={{ marginTop:16,animation:'fadeUp .35s ease both' }}>
                  <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
                    <span style={{ fontSize:12,fontWeight:600,color:'rgba(244,240,255,0.55)' }}>Voiceover · 8 cr</span>
                    <div style={{ display:'flex',gap:5 }}>
                      <a href={vxResult} download={`nexa-voice-${Date.now()}.mp3`} style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,fontSize:11,fontWeight:600,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(244,240,255,0.5)',textDecoration:'none' }}>{Ic.dl} Download</a>
                      <ActBtn icon={Ic.redo} label="Redo" onClick={generateVoice}/>
                    </div>
                  </div>
                  <div style={{ padding:'16px 18px',background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12 }}>
                    <audio src={vxResult} controls style={{ width:'100%' }}/>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT — Recent feed ── */}
        <div style={{ overflowY:'auto',background:'rgba(8,8,14,0.6)',borderLeft:'1px solid rgba(255,255,255,0.06)',display:'flex',flexDirection:'column' }}>
          <div style={{ padding:'20px 14px 12px',flexShrink:0 }}>
            <div style={{ fontSize:10,fontWeight:700,color:'rgba(244,240,255,0.26)',letterSpacing:'.09em',textTransform:'uppercase',marginBottom:3 }}>Recent · live</div>
            <div style={{ fontSize:11,color:'rgba(244,240,255,0.22)' }}>{recent.length} pieces created</div>
          </div>
          <div style={{ padding:'0 10px 16px',flex:1 }}>
            {recent.length>0 ? recent.map(item=>(
              <div key={item.id} className="rc"
                style={{ marginBottom:8,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,overflow:'hidden',cursor:'pointer',transition:'all .15s' }}
                onClick={()=>{
                  if(item.type==='image'&&item.image_url){setTab('image');setIResult(item.image_url)}
                  else if(item.type==='video'&&item.video_url){setTab('video');setVResult(item.video_url)}
                  else if(item.type==='voice'&&item.voice_url){setTab('voice');setVxResult(item.voice_url)}
                  else if(item.body){setTab('copy');setResult(item.body);setResultId(item.id)}
                }}>
                {item.image_url && <img src={item.image_url} alt="" style={{ width:'100%',height:80,objectFit:'cover',display:'block' }}/>}
                {item.type==='video'&&!item.image_url && (
                  <div style={{ width:'100%',height:48,background:'rgba(255,107,43,0.06)',display:'flex',alignItems:'center',justifyContent:'center',color:'#FF6B2B',gap:7,fontSize:11 }}>
                    <span style={{ display:'flex' }}>{Ic.video}</span>Video clip
                  </div>
                )}
                {item.type==='voice' && (
                  <div style={{ width:'100%',height:38,background:'rgba(0,229,160,0.04)',display:'flex',alignItems:'center',justifyContent:'center',gap:1.5 }}>
                    {[3,5,8,5,9,6,4,7,5,8,4,6,3,5,7].map((h,i)=>(
                      <div key={i} style={{ width:2,height:h*2.1,background:'#00E5A0',borderRadius:2,opacity:0.55 }}/>
                    ))}
                  </div>
                )}
                <div style={{ padding:'8px 11px' }}>
                  <div style={{ display:'flex',gap:5,alignItems:'center',marginBottom:4 }}>
                    <span style={{ fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:4,
                      background:item.type==='image'?'rgba(167,139,250,0.1)':item.type==='video'?'rgba(255,107,43,0.1)':item.type==='voice'?'rgba(0,229,160,0.08)':'rgba(14,165,255,0.08)',
                      border:`1px solid ${item.type==='image'?'rgba(167,139,250,0.2)':item.type==='video'?'rgba(255,107,43,0.2)':item.type==='voice'?'rgba(0,229,160,0.18)':'rgba(14,165,255,0.18)'}`,
                      color:item.type==='image'?'#A78BFA':item.type==='video'?'#FF6B2B':item.type==='voice'?'#00E5A0':'#0EA5FF',
                      textTransform:'uppercase' }}>
                      {item.type||'copy'}
                    </span>
                    {item.platform && <span style={{ fontSize:9,color:'rgba(244,240,255,0.28)' }}>{item.platform}</span>}
                    <span style={{ fontSize:9,color:'rgba(244,240,255,0.18)',marginLeft:'auto' }}>{item.credits_used}cr</span>
                  </div>
                  {item.body && (
                    <div style={{ fontSize:11,color:'rgba(244,240,255,0.5)',lineHeight:1.5,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' as const }}>
                      {item.body}
                    </div>
                  )}
                </div>
              </div>
            )) : (
              <div style={{ textAlign:'center',padding:'40px 14px',color:'rgba(244,240,255,0.2)',fontSize:12,lineHeight:1.7 }}>
                Everything you create<br/>appears here live.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
