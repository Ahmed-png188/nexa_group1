'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type ContentType = 'post'|'thread'|'email'|'caption'|'hook'|'bio'|'ad'|'story'
type Platform    = 'instagram'|'linkedin'|'x'|'tiktok'|'email'|'general'
type ActiveTab   = 'copy'|'image'|'video'|'voice'

/* ─────────────────────────────────────────────────────────────────
   ICON SYSTEM — all same family, 15px, stroke 1.5, round
───────────────────────────────────────────────────────────────── */
const Ic = {
  copy:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  image:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  video:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  voice:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  bolt:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  clone:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  check:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  dl:      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  redo:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>,
  cal:     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  narrate: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>,
  animate: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  upload:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
}

/* ─────────────────────────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────────────────────────── */
const TABS = [
  { id:'copy'  as ActiveTab, label:'Copy',  meta:'Free · Claude',     color:'#4D9FFF', glow:'rgba(77,159,255,0.18)',  icon: Ic.copy  },
  { id:'image' as ActiveTab, label:'Image', meta:'5 cr · Flux',       color:'#A78BFA', glow:'rgba(167,139,250,0.18)', icon: Ic.image },
  { id:'video' as ActiveTab, label:'Video', meta:'20 cr · Kling',     color:'#FF7A40', glow:'rgba(255,122,64,0.18)',  icon: Ic.video },
  { id:'voice' as ActiveTab, label:'Voice', meta:'8 cr · ElevenLabs', color:'#34D399', glow:'rgba(52,211,153,0.18)',  icon: Ic.voice },
]

const FORMATS = [
  { id:'post'    as ContentType, label:'Post',    cost:3,  emoji:'✦' },
  { id:'hook'    as ContentType, label:'Hook',    cost:2,  emoji:'⚡' },
  { id:'thread'  as ContentType, label:'Thread',  cost:5,  emoji:'◈' },
  { id:'caption' as ContentType, label:'Caption', cost:2,  emoji:'◎' },
  { id:'email'   as ContentType, label:'Email',   cost:5,  emoji:'◻' },
  { id:'story'   as ContentType, label:'Story',   cost:2,  emoji:'◑' },
  { id:'ad'      as ContentType, label:'Ad Copy', cost:5,  emoji:'◆' },
  { id:'bio'     as ContentType, label:'Bio',     cost:2,  emoji:'◉' },
]

const PLATFORMS = [
  { id:'instagram' as Platform, label:'Instagram', color:'#F56040' },
  { id:'linkedin'  as Platform, label:'LinkedIn',  color:'#0A66C2' },
  { id:'x'         as Platform, label:'X',         color:'#FFFFFF' },
  { id:'tiktok'    as Platform, label:'TikTok',    color:'#FF2D55' },
  { id:'email'     as Platform, label:'Email',     color:'#4D9FFF' },
  { id:'general'   as Platform, label:'General',   color:'#888' },
]

const IMG_STYLES = ['Photorealistic','Cinematic','Minimal','Dark & Moody','Vibrant','Illustration']
const IMG_STYLE_IDS = ['photorealistic','cinematic','minimal clean white background','dark moody premium','vibrant colorful','flat design illustration']
const RATIOS = [{ id:'1:1',label:'1:1',desc:'Square' },{ id:'4:5',label:'4:5',desc:'Portrait' },{ id:'16:9',label:'16:9',desc:'Wide' },{ id:'9:16',label:'9:16',desc:'Story' }]
const VID_STYLES = ['Cinematic','Documentary','Brand Ad','Social','Minimal','Dramatic']
const VID_MODES = [
  { id:'text'  as const, label:'Text → Video', desc:'From a description' },
  { id:'image' as const, label:'Image → Video',desc:'Animate a still' },
  { id:'frame' as const, label:'Start → End',  desc:'Control both frames' },
]
const VOICES = [
  { id:'rachel',name:'Rachel',desc:'Warm · F' },{ id:'drew',name:'Drew',desc:'Bold · M' },
  { id:'clyde', name:'Clyde', desc:'Expressive · M' },{ id:'paul',name:'Paul',desc:'Authority · M' },
  { id:'domi',  name:'Domi',  desc:'Strong · F' },{ id:'bella',name:'Bella',desc:'Soft · F' },
  { id:'Antoni',name:'Antoni',desc:'Natural · M' },{ id:'elli', name:'Elli', desc:'Emotional · F' },
]
const ANGLES = [
  'The belief separating those who grow from those who stay stuck',
  'What your audience is getting wrong about this space',
  'The uncomfortable truth behind a common misconception',
  'Why doing less produces better results here',
]

/* ─────────────────────────────────────────────────────────────────
   ATOMS
───────────────────────────────────────────────────────────────── */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.2)', marginBottom:8 }}>
      {children}
    </div>
  )
}

// Premium format card with gradient border on hover/active
function FormatCard({ f, active, onClick, color }: any) {
  const [hov, setHov] = useState(false)
  const on = active || hov
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        position: 'relative',
        padding: '14px 12px',
        borderRadius: 12,
        background: active
          ? `linear-gradient(145deg, ${color}14 0%, transparent 100%)`
          : hov ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.025)',
        border: `1px solid ${active ? `${color}44` : hov ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)'}`,
        cursor: 'pointer',
        fontFamily: 'var(--sans)',
        textAlign: 'left',
        transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: active ? `0 0 20px ${color}18, inset 0 1px 0 ${color}22` : 'none',
      }}>
      {/* Active indicator dot */}
      {active && (
        <div style={{ position:'absolute', top:8, right:8, width:5, height:5, borderRadius:'50%', background:color, boxShadow:`0 0 6px ${color}` }}/>
      )}
      <div style={{ fontSize:14, fontWeight:700, color: active ? color : 'rgba(255,255,255,0.75)', marginBottom:4, letterSpacing:'-0.02em' }}>
        {f.label}
      </div>
      <div style={{ fontSize:10, color: active ? `${color}88` : 'rgba(255,255,255,0.25)', fontWeight:600 }}>
        {f.cost} credits
      </div>
    </button>
  )
}

// Premium platform pill
function PlatformPill({ p, active, onClick }: any) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        padding: '6px 16px',
        borderRadius: 100,
        fontSize: 12,
        fontWeight: 600,
        background: active ? `${p.color}18` : hov ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${active ? `${p.color}55` : hov ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)'}`,
        color: active ? p.color : hov ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.38)',
        cursor: 'pointer',
        fontFamily: 'var(--sans)',
        transition: 'all 0.15s',
        boxShadow: active ? `0 0 12px ${p.color}22` : 'none',
        flexShrink: 0,
      }}>
      {p.label}
    </button>
  )
}

// The main generate button — the most important element on the page
function GenerateBtn({ active, loading, label, loadingLabel, onClick, color, glow }: any) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} disabled={!active||loading}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        width: '100%',
        padding: '15px 20px',
        borderRadius: 14,
        fontSize: 14,
        fontWeight: 700,
        fontFamily: 'var(--display)',
        letterSpacing: '-0.02em',
        background: active
          ? hov
            ? `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`
            : `linear-gradient(135deg, ${color}ee 0%, ${color}cc 100%)`
          : 'rgba(255,255,255,0.04)',
        color: active ? '#000' : 'rgba(255,255,255,0.2)',
        border: `1px solid ${active ? 'transparent' : 'rgba(255,255,255,0.07)'}`,
        cursor: active ? 'pointer' : 'not-allowed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: active ? `0 4px 24px ${glow}, 0 1px 0 rgba(255,255,255,0.15) inset` : 'none',
        transform: active && hov ? 'translateY(-1px)' : 'none',
      }}>
      {loading
        ? <><div style={{ width:16,height:16,border:'2px solid rgba(0,0,0,0.2)',borderTopColor:'#000',borderRadius:'50%',animation:'studioSpin 0.8s linear infinite' }}/>{loadingLabel}</>
        : <><span style={{ display:'flex', opacity:0.8 }}>{Ic.bolt}</span>{label}</>}
    </button>
  )
}

// Compact action button row
function ActionBtn({ icon, label, onClick, active=false, activeColor='#4D9FFF' }: any) {
  const [hov, setHov] = useState(false)
  const on = active || hov
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '6px 11px', borderRadius: 8, fontSize: 11, fontWeight: 600,
        background: on ? `${activeColor}14` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${on ? `${activeColor}33` : 'rgba(255,255,255,0.08)'}`,
        color: on ? activeColor : 'rgba(255,255,255,0.45)',
        cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all 0.15s',
      }}>
      <span style={{ display:'flex' }}>{icon}</span>{label}
    </button>
  )
}

// Premium textarea
function StudioTextarea({ value, onChange, placeholder, rows=5 }: any) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{
      position: 'relative',
      borderRadius: 14,
      background: focused ? 'rgba(77,159,255,0.04)' : 'rgba(255,255,255,0.025)',
      border: `1px solid ${focused ? 'rgba(77,159,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
      transition: 'all 0.2s',
      boxShadow: focused ? '0 0 0 3px rgba(77,159,255,0.06)' : 'none',
    }}>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '14px 16px',
          fontSize: 13.5, fontFamily: 'var(--sans)',
          background: 'transparent', border: 'none',
          color: 'rgba(255,255,255,0.88)', outline: 'none',
          resize: 'vertical', lineHeight: 1.7,
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

// Provider badge
function ProviderBadge({ name, desc, color }: any) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 16px', marginBottom: 22,
      background: `${color}08`,
      border: `1px solid ${color}22`,
      borderRadius: 10,
    }}>
      <div style={{ width:6, height:6, borderRadius:'50%', background:color, boxShadow:`0 0 8px ${color}` }}/>
      <span style={{ fontSize:12, fontWeight:700, color }}>{name}</span>
      <span style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>·</span>
      <span style={{ fontSize:12, color:'rgba(255,255,255,0.38)' }}>{desc}</span>
    </div>
  )
}

// Mini select pill row
function PillRow({ options, active, onSelect, color }: any) {
  return (
    <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
      {options.map((opt: any) => {
        const id   = typeof opt === 'string' ? opt : opt.id
        const lbl  = typeof opt === 'string' ? opt : opt.label
        const isOn = active === id
        return (
          <button key={id} onClick={()=>onSelect(id)}
            style={{ padding:'5px 13px', borderRadius:100, fontSize:12, fontWeight:600, background:isOn?`${color}14`:'rgba(255,255,255,0.04)', border:`1px solid ${isOn?`${color}40`:'rgba(255,255,255,0.08)'}`, color:isOn?color:'rgba(255,255,255,0.38)', cursor:'pointer', fontFamily:'var(--sans)', transition:'all 0.15s', flexShrink:0 }}>
            {lbl}
          </button>
        )
      })}
    </div>
  )
}

// Error banner
function ErrorBanner({ msg }: any) {
  return (
    <div style={{ marginTop:14, padding:'12px 16px', background:'rgba(255,80,80,0.07)', border:'1px solid rgba(255,80,80,0.2)', borderRadius:10, fontSize:13, color:'#FF7070', lineHeight:1.5 }}>
      {msg}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────── */
export default function StudioPage() {
  const supabase = createClient()
  const startRef = useRef<HTMLInputElement>(null)
  const endRef   = useRef<HTMLInputElement>(null)
  const imgRef   = useRef<HTMLInputElement>(null)

  const [ws,      setWs]      = useState<any>(null)
  const [credits, setCredits] = useState(0)
  const [tab,     setTab]     = useState<ActiveTab>('copy')
  const [recent,  setRecent]  = useState<any[]>([])

  // copy
  const [fmt,      setFmt]      = useState<ContentType>('post')
  const [plat,     setPlat]     = useState<Platform>('instagram')
  const [prompt,   setPrompt]   = useState('')
  const [genning,  setGenning]  = useState(false)
  const [result,   setResult]   = useState<string|null>(null)
  const [resultId, setResultId] = useState<string|null>(null)
  const [crUsed,   setCrUsed]   = useState(0)
  const [copied,   setCopied]   = useState(false)
  const [sched,    setSched]    = useState(false)
  const [copyErr,  setCopyErr]  = useState<string|null>(null)

  // image
  const [iPrompt, setIPrompt] = useState('')
  const [iStyle,  setIStyle]  = useState('photorealistic')
  const [iRatio,  setIRatio]  = useState('1:1')
  const [iGen,    setIGen]    = useState(false)
  const [iResult, setIResult] = useState<string|null>(null)
  const [iErr,    setIErr]    = useState<string|null>(null)

  // video
  const [vPrompt,  setVPrompt]  = useState('')
  const [vStyle,   setVStyle]   = useState('Cinematic')
  const [vDur,     setVDur]     = useState(5)
  const [vRatio,   setVRatio]   = useState('16:9')
  const [vMode,    setVMode]    = useState<'text'|'image'|'frame'>('text')
  const [vImgUrl,  setVImgUrl]  = useState('')
  const [startUrl, setStartUrl] = useState('')
  const [endUrl,   setEndUrl]   = useState('')
  const [motion,   setMotion]   = useState(0.5)
  const [vGen,     setVGen]     = useState(false)
  const [vResult,  setVResult]  = useState<string|null>(null)
  const [vProg,    setVProg]    = useState(0)
  const [vErr,     setVErr]     = useState<string|null>(null)

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
    setCredits(cr?.balance??0)
    loadRecent(w?.id)
    supabase.channel('studio-rt')
      .on('postgres_changes',{event:'*',schema:'public',table:'content',filter:`workspace_id=eq.${w?.id}`},()=>loadRecent(w?.id))
      .on('postgres_changes',{event:'*',schema:'public',table:'credits',filter:`workspace_id=eq.${w?.id}`},(p:any)=>{if(p.new?.balance!==undefined)setCredits(p.new.balance)})
      .subscribe()
  }

  async function loadRecent(id: string) {
    if (!id) return
    const { data } = await supabase.from('content').select('*').eq('workspace_id',id).order('created_at',{ascending:false}).limit(16)
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
      const body:any={workspace_id:ws?.id,prompt:vPrompt.trim(),style:vStyle.toLowerCase(),duration:vDur,aspect_ratio:vRatio,motion_strength:motion}
      if(vMode==='image'&&vImgUrl)body.image_url=vImgUrl
      if(vMode==='frame'){body.start_frame_url=startUrl;body.end_frame_url=endUrl}
      const r=await fetch('/api/generate-video',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
      const d=await r.json()
      clearInterval(iv)
      if(!r.ok){setVErr(r.status===402?d.message:(d.error??'Failed'));return}
      setVProg(100);setVResult(d.video_url)
    } catch{clearInterval(iv);setVErr('Something went wrong.')}
    setVGen(false)
  }
  async function generateVoice() {
    if (!vxText.trim()||vxGen) return
    setVxGen(true);setVxResult(null);setVxErr(null)
    try {
      const r=await fetch('/api/generate-voice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspace_id:ws?.id,text:vxText.trim(),voice_id:vxId,stability})})
      const d=await r.json()
      if(!r.ok){setVxErr(r.status===402?d.message:(d.error??'Failed'));return}
      setVxResult(d.audio_url)
    } catch{setVxErr('Something went wrong.')}
    setVxGen(false)
  }
  async function copyText(text:string){await navigator.clipboard.writeText(text);setCopied(true);setTimeout(()=>setCopied(false),2000)}
  async function schedulePost(){
    if(!resultId)return
    const t=new Date();t.setDate(t.getDate()+1);t.setHours(9,0,0,0)
    await supabase.from('content').update({status:'scheduled',scheduled_for:t.toISOString()}).eq('id',resultId)
    setSched(true)
  }
  function uploadFile(file:File,set:(u:string)=>void){const r=new FileReader();r.onload=e=>set(e.target?.result as string);r.readAsDataURL(file)}

  const selFmt   = FORMATS.find(f=>f.id===fmt)!
  const activeTab = TABS.find(t=>t.id===tab)!

  /* ─── Result card for copy output ─── */
  const ResultCard = () => result ? (
    <div style={{ marginTop:20, animation:'studioUp .35s ease both' }}>
      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'#4D9FFF', boxShadow:'0 0 8px #4D9FFF' }}/>
          <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.45)' }}>
            {selFmt.label} · {crUsed} credits used
          </span>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <ActionBtn icon={copied?Ic.check:Ic.clone} label={copied?'Copied':'Copy'} onClick={()=>copyText(result!)} active={copied} activeColor="#4D9FFF"/>
          <ActionBtn icon={Ic.redo}    label="Rewrite"  onClick={generateCopy}/>
          <ActionBtn icon={Ic.narrate} label="Narrate"  onClick={()=>{setVxText(result!);setTab('voice')}} activeColor="#34D399"/>
          <ActionBtn icon={sched?Ic.check:Ic.cal} label={sched?'Queued':'Schedule'} onClick={schedulePost} active={sched} activeColor="#FFB547"/>
        </div>
      </div>
      {/* Output */}
      <div style={{
        padding: '20px 22px',
        background: 'linear-gradient(145deg, rgba(77,159,255,0.06) 0%, rgba(0,0,0,0.3) 100%)',
        border: '1px solid rgba(77,159,255,0.2)',
        borderRadius: 16,
        fontSize: 14,
        color: 'rgba(255,255,255,0.88)',
        lineHeight: 1.85,
        whiteSpace: 'pre-wrap',
        boxShadow: '0 0 40px rgba(77,159,255,0.06), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}>
        {result}
      </div>
    </div>
  ) : null

  return (
    <>
      <style>{`
        @keyframes studioSpin { to { transform:rotate(360deg) } }
        @keyframes studioUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes studioPulse{ 0%,100%{opacity:1} 50%{opacity:.35} }
        input[type="range"]   { accent-color:#4D9FFF; width:100%; }
        .rc-card:hover { background:rgba(255,255,255,0.055) !important; border-color:rgba(255,255,255,0.13) !important; }
      `}</style>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 252px', height:'calc(100vh - var(--topbar-h))', overflow:'hidden', background:'var(--bg)' }}>

        {/* ═══════════════════════════════════════════
            LEFT — CREATION CANVAS
        ═══════════════════════════════════════════ */}
        <div style={{ overflowY:'auto', padding:'24px 28px 40px', borderRight:'1px solid rgba(255,255,255,0.05)' }}>

          {/* ── Page header ── */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:22, animation:'studioUp .4s ease both' }}>
            <div>
              <h1 style={{ fontFamily:'var(--display)', fontSize:22, fontWeight:800, letterSpacing:'-0.04em', color:'rgba(255,255,255,0.92)', lineHeight:1, marginBottom:4 }}>
                Studio
              </h1>
              <p style={{ fontSize:11.5, color:'rgba(255,255,255,0.28)', fontWeight:400, maxWidth:400, lineHeight:1.5 }}>
                {ws?.brand_voice
                  ? `Writing as: ${ws.brand_voice.slice(0,52)}…`
                  : 'Every generation is written in your brand voice'}
              </p>
            </div>

            {/* Credits — small subtle, not duplicating topbar */}
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 11px', background:'rgba(77,159,255,0.06)', border:'1px solid rgba(77,159,255,0.15)', borderRadius:8 }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:'#4D9FFF', animation:'studioPulse 2.5s ease-in-out infinite' }}/>
              <span style={{ fontSize:12, fontWeight:700, color:'rgba(77,159,255,0.8)', fontFamily:'var(--display)' }}>{credits.toLocaleString()} cr</span>
            </div>
          </div>

          {/* ── Tab selector — premium feel ── */}
          <div style={{ marginBottom:24, animation:'studioUp .4s ease .05s both' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap:6,
              padding: 5,
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
            }}>
              {TABS.map(t => {
                const active = tab === t.id
                return (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 4, padding: '11px 8px',
                      borderRadius: 12,
                      background: active
                        ? `linear-gradient(145deg, ${t.color}18 0%, ${t.color}08 100%)`
                        : 'transparent',
                      border: `1px solid ${active ? `${t.color}33` : 'transparent'}`,
                      color: active ? t.color : 'rgba(255,255,255,0.3)',
                      cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all .18s',
                      boxShadow: active ? `0 2px 12px ${t.glow}` : 'none',
                    }}
                    onMouseEnter={e=>{ if(!active)(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)' }}
                    onMouseLeave={e=>{ if(!active)(e.currentTarget as HTMLElement).style.background='transparent' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                      <span style={{ display:'flex', opacity: active ? 1 : 0.7 }}>{t.icon}</span>
                      <span style={{ fontSize:13, fontWeight: active ? 700 : 500 }}>{t.label}</span>
                    </div>
                    <span style={{ fontSize:10, color: active ? `${t.color}80` : 'rgba(255,255,255,0.2)', fontWeight:500 }}>{t.meta}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ──────────── COPY TAB ──────────── */}
          {tab === 'copy' && (
            <div style={{ maxWidth:620, animation:'studioUp .3s ease both' }}>

              {/* Format grid */}
              <div style={{ marginBottom:20 }}>
                <FieldLabel>Format</FieldLabel>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))', gap:8 }}>
                  {FORMATS.map(f => (
                    <FormatCard key={f.id} f={f} active={fmt===f.id} onClick={()=>setFmt(f.id)} color="#4D9FFF"/>
                  ))}
                </div>
              </div>

              {/* Platform pills */}
              <div style={{ marginBottom:20 }}>
                <FieldLabel>Platform</FieldLabel>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {PLATFORMS.map(p => (
                    <PlatformPill key={p.id} p={p} active={plat===p.id} onClick={()=>setPlat(p.id)}/>
                  ))}
                </div>
              </div>

              {/* Direction */}
              <div style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <FieldLabel>Direction</FieldLabel>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,0.16)', fontWeight:500 }}>⌘ Enter to generate</span>
                </div>
                <StudioTextarea value={prompt} onChange={setPrompt} rows={4}
                  placeholder={`Give Nexa a direction, angle, or idea.\n\n"Why perfectionism is killing your engagement" lands harder than "a post about productivity."`}/>
              </div>

              {/* Angle suggestions — ultra-subtle, blend into background */}
              <div style={{ marginBottom:20, display:'flex', gap:5, flexWrap:'wrap' }}>
                {ANGLES.map((a,i) => (
                  <button key={i} onClick={()=>setPrompt(a)}
                    style={{ padding:'4px 10px', borderRadius:100, fontSize:11, background:'transparent', border:'1px solid rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.22)', cursor:'pointer', fontFamily:'var(--sans)', transition:'all .2s', textAlign:'left' }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(77,159,255,0.2)';(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.55)';(e.currentTarget as HTMLElement).style.background='rgba(77,159,255,0.04)'}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.05)';(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.22)';(e.currentTarget as HTMLElement).style.background='transparent'}}>
                    {a.length > 46 ? a.slice(0,46)+'…' : a}
                  </button>
                ))}
              </div>

              <GenerateBtn
                active={!!prompt.trim()} loading={genning}
                label={`Write ${selFmt.label} · ${selFmt.cost} credits`}
                loadingLabel="Writing in your brand voice…"
                onClick={generateCopy} color="#4D9FFF" glow="rgba(77,159,255,0.35)"
              />

              {copyErr && <ErrorBanner msg={copyErr}/>}
              <ResultCard/>
            </div>
          )}

          {/* ──────────── IMAGE TAB ──────────── */}
          {tab === 'image' && (
            <div style={{ maxWidth:620, animation:'studioUp .3s ease both' }}>
              <ProviderBadge name="Flux" desc="Photorealistic brand imagery · ~15 seconds" color="#A78BFA"/>

              <div style={{ marginBottom:22 }}>
                <FieldLabel>Describe your image</FieldLabel>
                <StudioTextarea value={iPrompt} onChange={setIPrompt} rows={4}
                  placeholder={`Be specific. "A focused founder at a dark oak desk, morning light through tall windows, premium editorial photography" performs far better than "a business person."`}/>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:28 }}>
                <div>
                  <FieldLabel>Visual style</FieldLabel>
                  <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                    {IMG_STYLES.map((s,i) => (
                      <button key={s} onClick={()=>setIStyle(IMG_STYLE_IDS[i])}
                        style={{ padding:'5px 13px', borderRadius:100, fontSize:12, fontWeight:600, background:iStyle===IMG_STYLE_IDS[i]?'rgba(167,139,250,0.14)':'rgba(255,255,255,0.04)', border:`1px solid ${iStyle===IMG_STYLE_IDS[i]?'rgba(167,139,250,0.35)':'rgba(255,255,255,0.08)'}`, color:iStyle===IMG_STYLE_IDS[i]?'#A78BFA':'rgba(255,255,255,0.38)', cursor:'pointer', fontFamily:'var(--sans)', transition:'all .15s' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <FieldLabel>Format</FieldLabel>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:6 }}>
                    {RATIOS.map(r => (
                      <button key={r.id} onClick={()=>setIRatio(r.id)}
                        style={{ padding:'10px 8px', borderRadius:10, background:iRatio===r.id?'rgba(167,139,250,0.1)':'rgba(255,255,255,0.03)', border:`1px solid ${iRatio===r.id?'rgba(167,139,250,0.3)':'rgba(255,255,255,0.07)'}`, color:iRatio===r.id?'#A78BFA':'rgba(255,255,255,0.4)', cursor:'pointer', fontFamily:'var(--sans)', textAlign:'center', transition:'all .15s', boxShadow:iRatio===r.id?'0 0 12px rgba(167,139,250,0.15)':'none' }}>
                        <div style={{ fontSize:12, fontWeight:700 }}>{r.label}</div>
                        <div style={{ fontSize:10, opacity:.55 }}>{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <GenerateBtn active={!!iPrompt.trim()} loading={iGen} label="Generate image · 5 credits" loadingLabel="Flux is rendering…" onClick={generateImage} color="#A78BFA" glow="rgba(167,139,250,0.35)"/>
              {iErr && <ErrorBanner msg={iErr}/>}

              {iResult && (
                <div style={{ marginTop:20, animation:'studioUp .35s ease both' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                    <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.4)' }}>Image · 5 credits used</span>
                    <div style={{ display:'flex', gap:6 }}>
                      <ActionBtn icon={Ic.animate} label="Animate →" onClick={()=>{setTab('video');setVMode('image');setVImgUrl(iResult!)}} activeColor="#FF7A40"/>
                      <a href={iResult} download={`nexa-${Date.now()}.jpg`} style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 11px',borderRadius:8,fontSize:11,fontWeight:600,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.45)',textDecoration:'none' }}>{Ic.dl} Download</a>
                      <ActionBtn icon={Ic.redo} label="Redo" onClick={generateImage}/>
                    </div>
                  </div>
                  <div style={{ borderRadius:16, overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 8px 40px rgba(0,0,0,0.4)' }}>
                    <img src={iResult} alt="Generated" style={{ width:'100%', display:'block', maxHeight:540, objectFit:'cover' }}/>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ──────────── VIDEO TAB ──────────── */}
          {tab === 'video' && (
            <div style={{ maxWidth:620, animation:'studioUp .3s ease both' }}>
              <ProviderBadge name="Kling 3.0" desc="Cinematic video generation · 1–3 min to render" color="#FF7A40"/>

              <div style={{ marginBottom:20 }}>
                <FieldLabel>Mode</FieldLabel>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                  {VID_MODES.map(m => (
                    <button key={m.id} onClick={()=>setVMode(m.id)}
                      style={{ padding:'12px 10px', borderRadius:12, background:vMode===m.id?'rgba(255,122,64,0.1)':'rgba(255,255,255,0.03)', border:`1px solid ${vMode===m.id?'rgba(255,122,64,0.3)':'rgba(255,255,255,0.07)'}`, cursor:'pointer', fontFamily:'var(--sans)', textAlign:'left', transition:'all .15s', boxShadow:vMode===m.id?'0 0 16px rgba(255,122,64,0.15)':'none' }}>
                      <div style={{ fontSize:12, fontWeight:700, color:vMode===m.id?'#FF7A40':'rgba(255,255,255,0.75)', marginBottom:3 }}>{m.label}</div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)' }}>{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {vMode==='image' && (
                <div style={{ marginBottom:20 }}>
                  <FieldLabel>Source image</FieldLabel>
                  {vImgUrl ? (
                    <div style={{ position:'relative', borderRadius:12, overflow:'hidden', border:'1px solid rgba(255,122,64,0.2)' }}>
                      <img src={vImgUrl} alt="" style={{ width:'100%', maxHeight:200, objectFit:'cover', display:'block' }}/>
                      <button onClick={()=>setVImgUrl('')} style={{ position:'absolute', top:8, right:8, padding:'4px 9px', borderRadius:6, fontSize:11, background:'rgba(0,0,0,0.75)', border:'none', color:'#fff', cursor:'pointer' }}>Remove</button>
                    </div>
                  ) : (
                    <div onClick={()=>imgRef.current?.click()}
                      style={{ padding:'28px', border:'1px dashed rgba(255,255,255,0.1)', borderRadius:12, textAlign:'center', cursor:'pointer', color:'rgba(255,255,255,0.35)', display:'flex', alignItems:'center', justifyContent:'center', gap:9, fontSize:13, transition:'all .15s' }}
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor='rgba(255,122,64,0.3)'}
                      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.1)'}>
                      {Ic.upload}<span>Upload image to animate</span>
                      <input ref={imgRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>e.target.files?.[0]&&uploadFile(e.target.files[0],setVImgUrl)}/>
                    </div>
                  )}
                </div>
              )}

              {vMode==='frame' && (
                <div style={{ marginBottom:20, display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {([{l:'Start frame',u:startUrl,s:setStartUrl,r:startRef},{l:'End frame',u:endUrl,s:setEndUrl,r:endRef}] as any[]).map(f=>(
                    <div key={f.l}>
                      <FieldLabel>{f.l}</FieldLabel>
                      {f.u ? (
                        <div style={{ position:'relative', borderRadius:10, overflow:'hidden', border:'1px solid rgba(255,122,64,0.2)' }}>
                          <img src={f.u} alt="" style={{ width:'100%', height:110, objectFit:'cover', display:'block' }}/>
                          <button onClick={()=>f.s('')} style={{ position:'absolute', top:6, right:6, padding:'3px 7px', borderRadius:5, fontSize:10, background:'rgba(0,0,0,0.75)', border:'none', color:'#fff', cursor:'pointer' }}>✕</button>
                        </div>
                      ) : (
                        <div onClick={()=>f.r.current?.click()} style={{ height:110, border:'1px dashed rgba(255,255,255,0.1)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'rgba(255,255,255,0.3)', gap:7, fontSize:12 }}>
                          {Ic.upload} Upload
                          <input ref={f.r} type="file" accept="image/*" style={{ display:'none' }} onChange={(e:any)=>e.target.files?.[0]&&uploadFile(e.target.files[0],f.s)}/>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginBottom:20 }}>
                <FieldLabel>Describe the scene</FieldLabel>
                <StudioTextarea value={vPrompt} onChange={setVPrompt} rows={4} placeholder="A founder walking into a glass building at golden hour, confidence in every step, cinematic lens flare, premium brand feel…"/>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:22 }}>
                <div>
                  <FieldLabel>Style</FieldLabel>
                  <PillRow options={VID_STYLES} active={vStyle} onSelect={setVStyle} color="#FF7A40"/>
                </div>
                <div>
                  <FieldLabel>Duration & ratio</FieldLabel>
                  <div style={{ display:'flex', gap:5, marginBottom:8 }}>
                    {[5,10].map(d=>(
                      <button key={d} onClick={()=>setVDur(d)} style={{ padding:'5px 14px', borderRadius:100, fontSize:12, fontWeight:700, background:vDur===d?'rgba(255,122,64,0.14)':'rgba(255,255,255,0.04)', border:`1px solid ${vDur===d?'rgba(255,122,64,0.35)':'rgba(255,255,255,0.08)'}`, color:vDur===d?'#FF7A40':'rgba(255,255,255,0.38)', cursor:'pointer', fontFamily:'var(--sans)', transition:'all .15s' }}>{d}s</button>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:5 }}>
                    {['16:9','9:16','1:1'].map(r=>(
                      <button key={r} onClick={()=>setVRatio(r)} style={{ padding:'5px 11px', borderRadius:100, fontSize:11, fontWeight:600, background:vRatio===r?'rgba(255,122,64,0.14)':'rgba(255,255,255,0.04)', border:`1px solid ${vRatio===r?'rgba(255,122,64,0.35)':'rgba(255,255,255,0.08)'}`, color:vRatio===r?'#FF7A40':'rgba(255,255,255,0.38)', cursor:'pointer', fontFamily:'var(--sans)', transition:'all .15s' }}>{r}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom:28 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                  <FieldLabel>Motion intensity</FieldLabel>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontWeight:500 }}>{motion<.35?'Subtle':motion>.65?'Dynamic':'Balanced'} · {Math.round(motion*100)}%</span>
                </div>
                <input type="range" min="0" max="1" step="0.05" value={motion} onChange={e=>setMotion(parseFloat(e.target.value))}/>
              </div>

              <GenerateBtn active={!!vPrompt.trim()} loading={vGen} label="Generate video · 20 credits" loadingLabel="Kling is rendering your clip…" onClick={generateVideo} color="#FF7A40" glow="rgba(255,122,64,0.35)"/>

              {vGen && (
                <div style={{ marginTop:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:11, color:'rgba(255,255,255,0.35)' }}>
                    <span>Rendering. Usually 1–3 minutes.</span><span>{Math.round(vProg)}%</span>
                  </div>
                  <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${vProg}%`, background:'linear-gradient(90deg,#FF4500,#FF7A40)', borderRadius:3, transition:'width 1s ease' }}/>
                  </div>
                </div>
              )}
              {vErr && <ErrorBanner msg={vErr}/>}
              {vResult && (
                <div style={{ marginTop:20, animation:'studioUp .35s ease both' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                    <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.4)' }}>Video · 20 credits used</span>
                    <div style={{ display:'flex', gap:6 }}>
                      <a href={vResult} download={`nexa-${Date.now()}.mp4`} style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 11px',borderRadius:8,fontSize:11,fontWeight:600,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.45)',textDecoration:'none' }}>{Ic.dl} Download</a>
                      <ActionBtn icon={Ic.redo} label="Redo" onClick={generateVideo}/>
                    </div>
                  </div>
                  <div style={{ borderRadius:16, overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)', background:'#000', boxShadow:'0 8px 40px rgba(0,0,0,0.5)' }}>
                    <video src={vResult} controls style={{ width:'100%', display:'block', maxHeight:460 }}/>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ──────────── VOICE TAB ──────────── */}
          {tab === 'voice' && (
            <div style={{ maxWidth:620, animation:'studioUp .3s ease both' }}>
              <ProviderBadge name="ElevenLabs" desc="Ultra-realistic AI voiceovers · 8 languages" color="#34D399"/>

              <div style={{ marginBottom:24 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <FieldLabel>Script</FieldLabel>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.22)' }}>{vxText.length}/5000</span>
                </div>
                <StudioTextarea value={vxText} onChange={(v:string)=>setVxText(v.slice(0,5000))} rows={6} placeholder="Paste your script. Works best with copy from the Copy tab — it's already in your brand voice."/>
                {result && (
                  <button onClick={()=>setVxText(result)}
                    style={{ display:'flex', alignItems:'center', gap:6, marginTop:9, padding:'5px 12px', borderRadius:8, fontSize:11, fontWeight:600, background:'rgba(52,211,153,0.07)', border:'1px solid rgba(52,211,153,0.2)', color:'#34D399', cursor:'pointer', fontFamily:'var(--sans)' }}>
                    {Ic.clone} Use last generated copy
                  </button>
                )}
              </div>

              <div style={{ marginBottom:24 }}>
                <FieldLabel>Voice</FieldLabel>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(110px, 1fr))', gap:7 }}>
                  {VOICES.map(v => (
                    <button key={v.id} onClick={()=>setVxId(v.id)}
                      style={{ padding:'11px 10px', borderRadius:11, background:vxId===v.id?'rgba(52,211,153,0.09)':'rgba(255,255,255,0.03)', border:`1px solid ${vxId===v.id?'rgba(52,211,153,0.3)':'rgba(255,255,255,0.07)'}`, cursor:'pointer', fontFamily:'var(--sans)', textAlign:'left', transition:'all .15s', boxShadow:vxId===v.id?'0 0 14px rgba(52,211,153,0.14)':'none' }}>
                      <div style={{ fontSize:12, fontWeight:700, color:vxId===v.id?'#34D399':'rgba(255,255,255,0.75)', marginBottom:2 }}>{v.name}</div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)' }}>{v.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom:28 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                  <FieldLabel>Stability</FieldLabel>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>{stability<.4?'Expressive':stability>.7?'Consistent':'Balanced'} · {Math.round(stability*100)}%</span>
                </div>
                <input type="range" min="0" max="1" step="0.05" value={stability} onChange={e=>setStability(parseFloat(e.target.value))} style={{ accentColor:'#34D399' }}/>
              </div>

              <GenerateBtn active={!!vxText.trim()} loading={vxGen} label="Generate voiceover · 8 credits" loadingLabel="Generating with ElevenLabs…" onClick={generateVoice} color="#34D399" glow="rgba(52,211,153,0.35)"/>
              {vxErr && <ErrorBanner msg={vxErr}/>}

              {vxResult && (
                <div style={{ marginTop:20, animation:'studioUp .35s ease both' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                    <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.4)' }}>Voiceover · 8 credits used</span>
                    <div style={{ display:'flex', gap:6 }}>
                      <a href={vxResult} download={`nexa-voice-${Date.now()}.mp3`} style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 11px',borderRadius:8,fontSize:11,fontWeight:600,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.45)',textDecoration:'none' }}>{Ic.dl} Download</a>
                      <ActionBtn icon={Ic.redo} label="Redo" onClick={generateVoice} activeColor="#34D399"/>
                    </div>
                  </div>
                  <div style={{ padding:'18px 20px', background:'rgba(52,211,153,0.04)', border:'1px solid rgba(52,211,153,0.15)', borderRadius:14, boxShadow:'0 0 30px rgba(52,211,153,0.06)' }}>
                    <audio src={vxResult} controls style={{ width:'100%' }}/>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════
            RIGHT — LIVE CREATION FEED
        ═══════════════════════════════════════════ */}
        <div style={{ overflowY:'auto', background:'rgba(6,6,12,0.7)', borderLeft:'1px solid rgba(255,255,255,0.05)', display:'flex', flexDirection:'column' }}>

          {/* Header */}
          <div style={{ padding:'24px 16px 14px', flexShrink:0, borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.22)', marginBottom:2 }}>
              Recent · Live
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.2)' }}>
              {recent.length} pieces created
            </div>
          </div>

          {/* Feed */}
          <div style={{ padding:'12px 10px', flex:1 }}>
            {recent.length > 0 ? recent.map(item => {
              const typeColor = item.type==='image'?'#A78BFA':item.type==='video'?'#FF7A40':item.type==='voice'?'#34D399':'#4D9FFF'
              const typeBg    = item.type==='image'?'rgba(167,139,250,0.1)':item.type==='video'?'rgba(255,122,64,0.1)':item.type==='voice'?'rgba(52,211,153,0.08)':'rgba(77,159,255,0.08)'
              return (
                <div key={item.id} className="rc-card"
                  style={{ marginBottom:8, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:11, overflow:'hidden', cursor:'pointer', transition:'all .15s' }}
                  onClick={()=>{
                    if(item.type==='image'&&item.image_url){setTab('image');setIResult(item.image_url)}
                    else if(item.type==='video'&&item.video_url){setTab('video');setVResult(item.video_url)}
                    else if(item.type==='voice'&&item.voice_url){setTab('voice');setVxResult(item.voice_url)}
                    else if(item.body){setTab('copy');setResult(item.body);setResultId(item.id)}
                  }}>
                  {/* Image thumbnail */}
                  {item.image_url && (
                    <div style={{ position:'relative' }}>
                      <img src={item.image_url} alt="" style={{ width:'100%', height:88, objectFit:'cover', display:'block' }}/>
                      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.6) 100%)' }}/>
                    </div>
                  )}
                  {/* Video indicator */}
                  {item.type==='video' && !item.image_url && (
                    <div style={{ width:'100%', height:52, background:'rgba(255,122,64,0.06)', display:'flex', alignItems:'center', justifyContent:'center', color:'#FF7A40', gap:7, fontSize:11, fontWeight:600 }}>
                      <span style={{ display:'flex' }}>{Ic.video}</span>Video clip
                    </div>
                  )}
                  {/* Voice waveform */}
                  {item.type==='voice' && (
                    <div style={{ width:'100%', height:42, background:'rgba(52,211,153,0.04)', display:'flex', alignItems:'center', justifyContent:'center', gap:2 }}>
                      {[3,5,9,6,11,7,4,8,5,9,4,7,3,6,8].map((h,i)=>(
                        <div key={i} style={{ width:2, height:h*2.4, background:'#34D399', borderRadius:2, opacity:0.55 }}/>
                      ))}
                    </div>
                  )}
                  {/* Content info */}
                  <div style={{ padding:'9px 12px' }}>
                    <div style={{ display:'flex', gap:5, alignItems:'center', marginBottom:5 }}>
                      <span style={{ fontSize:9, fontWeight:700, padding:'1px 7px', borderRadius:4, background:typeBg, color:typeColor, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                        {item.type||'copy'}
                      </span>
                      {item.platform && <span style={{ fontSize:9, color:'rgba(255,255,255,0.25)' }}>{item.platform}</span>}
                      <span style={{ fontSize:9, color:'rgba(255,255,255,0.18)', marginLeft:'auto' }}>{item.credits_used}cr</span>
                    </div>
                    {item.body && (
                      <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.5)', lineHeight:1.55, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as const }}>
                        {item.body}
                      </div>
                    )}
                  </div>
                </div>
              )
            }) : (
              <div style={{ textAlign:'center', padding:'48px 16px', color:'rgba(255,255,255,0.2)', fontSize:12, lineHeight:1.8 }}>
                Everything you create<br/>appears here in real time.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
