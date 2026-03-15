'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type ContentType = 'post'|'thread'|'email'|'caption'|'hook'|'bio'|'ad'|'story'
type Platform    = 'instagram'|'linkedin'|'x'|'tiktok'|'email'|'general'
type Tab         = 'copy'|'image'|'video'|'voice'

/* ─── Icons ─── */
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
  mic:     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>,
  film:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  upload:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  arrow:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
}

/* ─── Data ─── */
const TABS = [
  { id:'copy'  as Tab, label:'Copy',  sub:'Free · Claude',     color:'#4D9FFF', dim:'rgba(77,159,255,0.12)',  icon:Ic.copy  },
  { id:'image' as Tab, label:'Image', sub:'5 cr · Flux',       color:'#A78BFA', dim:'rgba(167,139,250,0.12)', icon:Ic.image },
  { id:'video' as Tab, label:'Video', sub:'20 cr · Kling',     color:'#FF7A40', dim:'rgba(255,122,64,0.12)',  icon:Ic.video },
  { id:'voice' as Tab, label:'Voice', sub:'8 cr · ElevenLabs', color:'#34D399', dim:'rgba(52,211,153,0.12)',  icon:Ic.voice },
]

const FORMATS = [
  { id:'post'    as ContentType, label:'Post',    cost:3  },
  { id:'hook'    as ContentType, label:'Hook',    cost:2  },
  { id:'thread'  as ContentType, label:'Thread',  cost:5  },
  { id:'caption' as ContentType, label:'Caption', cost:2  },
  { id:'email'   as ContentType, label:'Email',   cost:5  },
  { id:'story'   as ContentType, label:'Story',   cost:2  },
  { id:'ad'      as ContentType, label:'Ad Copy', cost:5  },
  { id:'bio'     as ContentType, label:'Bio',     cost:2  },
]

const PLATFORMS = [
  { id:'instagram' as Platform, label:'Instagram', color:'#E1306C' },
  { id:'linkedin'  as Platform, label:'LinkedIn',  color:'#0A66C2' },
  { id:'x'         as Platform, label:'X',         color:'#E7E7E7' },
  { id:'tiktok'    as Platform, label:'TikTok',    color:'#FF2D55' },
  { id:'email'     as Platform, label:'Email',     color:'#4D9FFF' },
  { id:'general'   as Platform, label:'General',   color:'#888'    },
]

const IMG_STYLES  = ['Photorealistic','Cinematic','Minimal','Dark & Moody','Vibrant','Illustration']
const IMG_IDS     = ['photorealistic','cinematic','minimal clean white background','dark moody premium','vibrant colorful','flat design illustration']
const RATIOS      = [{ id:'1:1',l:'1:1',d:'Square' },{ id:'4:5',l:'4:5',d:'Portrait' },{ id:'16:9',l:'16:9',d:'Wide' },{ id:'9:16',l:'9:16',d:'Story' }]
const VID_STYLES  = ['Cinematic','Documentary','Brand Ad','Social','Minimal','Dramatic']
const VID_MODES   = [
  { id:'text'  as const, label:'Text → Video',  desc:'Describe a scene' },
  { id:'image' as const, label:'Image → Video', desc:'Animate a still'  },
  { id:'frame' as const, label:'Start → End',   desc:'Two keyframes'    },
]
const VOICES = [
  { id:'rachel',name:'Rachel',desc:'Warm · F'         },
  { id:'drew',  name:'Drew',  desc:'Confident · M'    },
  { id:'clyde', name:'Clyde', desc:'Expressive · M'   },
  { id:'paul',  name:'Paul',  desc:'Authority · M'    },
  { id:'domi',  name:'Domi',  desc:'Strong · F'       },
  { id:'bella', name:'Bella', desc:'Soft · F'         },
  { id:'Antoni',name:'Antoni',desc:'Natural · M'      },
  { id:'elli',  name:'Elli',  desc:'Emotional · F'    },
]
const ANGLES = [
  'The belief that separates those who grow from those who stay stuck',
  'What your audience is getting wrong about this space',
  'The uncomfortable truth everyone sees but nobody says',
  'Why less input produces better results here',
]

/* ─────────────────────────────────────────────────
   ATOMS
───────────────────────────────────────────────── */

function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase', color:'rgba(255,255,255,0.22)', marginBottom:9 }}>
      {children}
    </div>
  )
}

function FormatBtn({ f, active, onClick, color }: any) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '13px 10px 11px',
        borderRadius: 11,
        background: active ? `${color}10` : hov ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.025)',
        border: `1px solid ${active ? `${color}35` : hov ? 'rgba(255,255,255,0.11)' : 'rgba(255,255,255,0.07)'}`,
        cursor: 'pointer',
        fontFamily: 'var(--sans)',
        textAlign: 'left',
        transition: 'all 0.15s',
        position: 'relative',
        boxShadow: active ? `0 0 16px ${color}18` : 'none',
      }}>
      {active && <div style={{ position:'absolute', top:7, right:7, width:4, height:4, borderRadius:'50%', background:color, boxShadow:`0 0 5px ${color}` }}/>}
      <div style={{ fontSize:13, fontWeight:700, color: active ? color : 'rgba(255,255,255,0.78)', marginBottom:3, letterSpacing:'-0.01em' }}>
        {f.label}
      </div>
      <div style={{ fontSize:10, color: active ? `${color}70` : 'rgba(255,255,255,0.22)' }}>
        {f.cost} cr
      </div>
    </button>
  )
}

function PlatPill({ p, active, onClick }: any) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '5px 15px',
        borderRadius: 100,
        fontSize: 12,
        fontWeight: 600,
        background: active ? `${p.color}16` : hov ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.035)',
        border: `1px solid ${active ? `${p.color}45` : hov ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)'}`,
        color: active ? p.color : hov ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.38)',
        cursor: 'pointer',
        fontFamily: 'var(--sans)',
        transition: 'all 0.14s',
        flexShrink: 0,
        boxShadow: active ? `0 0 10px ${p.color}20` : 'none',
      }}>
      {p.label}
    </button>
  )
}

function Pill({ label, active, onClick, color }: any) {
  return (
    <button onClick={onClick} style={{ padding:'5px 12px', borderRadius:100, fontSize:11.5, fontWeight:600, background:active?`${color}12`:'rgba(255,255,255,0.035)', border:`1px solid ${active?`${color}35`:'rgba(255,255,255,0.08)'}`, color:active?color:'rgba(255,255,255,0.38)', cursor:'pointer', fontFamily:'var(--sans)', transition:'all 0.14s', flexShrink:0 }}>
      {label}
    </button>
  )
}

function Textarea({ value, onChange, placeholder, rows = 5 }: any) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{
      borderRadius: 13,
      background: focused ? 'rgba(77,159,255,0.035)' : 'rgba(255,255,255,0.025)',
      border: `1px solid ${focused ? 'rgba(77,159,255,0.28)' : 'rgba(255,255,255,0.08)'}`,
      transition: 'all 0.18s',
      boxShadow: focused ? '0 0 0 3px rgba(77,159,255,0.05)' : 'none',
    }}>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ width:'100%', padding:'14px 16px', fontSize:13.5, fontFamily:'var(--sans)', background:'transparent', border:'none', color:'rgba(255,255,255,0.88)', outline:'none', resize:'vertical', lineHeight:1.72, boxSizing:'border-box' }}
      />
    </div>
  )
}

function GenBtn({ active, loading, label, loadingLabel, onClick, color }: any) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={!active || loading}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%',
        padding: '15px 20px',
        borderRadius: 13,
        fontSize: 14,
        fontWeight: 700,
        fontFamily: 'var(--display)',
        letterSpacing: '-0.02em',
        background: active
          ? hov
            ? color
            : `${color}ee`
          : 'rgba(255,255,255,0.04)',
        color: active ? '#000' : 'rgba(255,255,255,0.18)',
        border: 'none',
        cursor: active ? 'pointer' : 'not-allowed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 9,
        transition: 'all 0.18s',
        boxShadow: active ? `0 4px 28px ${color}40, 0 1px 0 rgba(255,255,255,0.18) inset` : 'none',
        transform: active && hov ? 'translateY(-1px)' : 'none',
      }}>
      {loading ? (
        <><div style={{ width:15,height:15,border:'2px solid rgba(0,0,0,0.2)',borderTopColor:'#000',borderRadius:'50%',animation:'pageSpin 0.7s linear infinite' }}/>{loadingLabel}</>
      ) : (
        <><span style={{ display:'flex', opacity:0.85 }}>{Ic.bolt}</span>{label}</>
      )}
    </button>
  )
}

function ActBtn({ icon, label, onClick, active = false, color = 'rgba(255,255,255,0.5)' }: any) {
  const [hov, setHov] = useState(false)
  const on = active || hov
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8, fontSize:11, fontWeight:600, background:on?`${color}14`:'rgba(255,255,255,0.035)', border:`1px solid ${on?`${color}30`:'rgba(255,255,255,0.08)'}`, color:on?color:'rgba(255,255,255,0.42)', cursor:'pointer', fontFamily:'var(--sans)', transition:'all 0.14s' }}>
      <span style={{ display:'flex' }}>{icon}</span>{label}
    </button>
  )
}

function ProvBadge({ name, desc, color }: any) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', marginBottom:22, background:`${color}08`, border:`1px solid ${color}20`, borderRadius:10 }}>
      <div style={{ width:7, height:7, borderRadius:'50%', background:color, boxShadow:`0 0 8px ${color}80` }}/>
      <span style={{ fontSize:12, fontWeight:700, color, letterSpacing:'-0.01em' }}>{name}</span>
      <span style={{ fontSize:12, color:'rgba(255,255,255,0.28)' }}>·</span>
      <span style={{ fontSize:12, color:'rgba(255,255,255,0.38)' }}>{desc}</span>
    </div>
  )
}

function ErrBanner({ msg }: any) {
  return (
    <div style={{ marginTop:14, padding:'12px 16px', background:'rgba(255,80,80,0.07)', border:'1px solid rgba(255,80,80,0.2)', borderRadius:11, fontSize:13, color:'#FF7878', lineHeight:1.55 }}>
      {msg}
    </div>
  )
}

/* ─────────────────────────────────────────────────
   MAIN
───────────────────────────────────────────────── */
export default function StudioPage() {
  const supabase  = createClient()
  const startRef  = useRef<HTMLInputElement>(null)
  const endRef    = useRef<HTMLInputElement>(null)
  const imgRef    = useRef<HTMLInputElement>(null)

  const [ws,       setWs]       = useState<any>(null)
  const [tab,      setTab]      = useState<Tab>('copy')
  const [recent,   setRecent]   = useState<any[]>([])
  const [mounted,  setMounted]  = useState(false)

  // copy
  const [fmt,      setFmt]      = useState<ContentType>('post')
  const [plat,     setPlat]     = useState<Platform>('instagram')
  const [prompt,   setPrompt]   = useState('')
  const [genning,  setGenning]  = useState(false)
  const [result,   setResult]   = useState<string | null>(null)
  const [resultId, setResultId] = useState<string | null>(null)
  const [crUsed,   setCrUsed]   = useState(0)
  const [copied,   setCopied]   = useState(false)
  const [sched,    setSched]    = useState(false)
  const [copyErr,  setCopyErr]  = useState<string | null>(null)

  // image
  const [iPrompt,  setIPrompt]  = useState('')
  const [iStyle,   setIStyle]   = useState('photorealistic')
  const [iRatio,   setIRatio]   = useState('1:1')
  const [iGen,     setIGen]     = useState(false)
  const [iResult,  setIResult]  = useState<string | null>(null)
  const [iErr,     setIErr]     = useState<string | null>(null)

  // video
  const [vPrompt,  setVPrompt]  = useState('')
  const [vStyle,   setVStyle]   = useState('Cinematic')
  const [vDur,     setVDur]     = useState(5)
  const [vRatio,   setVRatio]   = useState('16:9')
  const [vMode,    setVMode]    = useState<'text'|'image'|'frame'>('text')
  const [vImg,     setVImg]     = useState('')
  const [startUrl, setStartUrl] = useState('')
  const [endUrl,   setEndUrl]   = useState('')
  const [motion,   setMotion]   = useState(0.5)
  const [vGen,     setVGen]     = useState(false)
  const [vResult,  setVResult]  = useState<string | null>(null)
  const [vProg,    setVProg]    = useState(0)
  const [vErr,     setVErr]     = useState<string | null>(null)

  // voice
  const [vxText,   setVxText]   = useState('')
  const [vxId,     setVxId]     = useState('rachel')
  const [stab,     setStab]     = useState(0.5)
  const [vxGen,    setVxGen]    = useState(false)
  const [vxResult, setVxResult] = useState<string | null>(null)
  const [vxErr,    setVxErr]    = useState<string | null>(null)

  useEffect(() => { setMounted(true); loadWs() }, [])

  async function loadWs() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: m } = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id', user.id).limit(1).single()
    const w = (m as any)?.workspaces
    setWs(w)
    loadRecent(w?.id)
    supabase.channel('studio-rt')
      .on('postgres_changes', { event:'*', schema:'public', table:'content', filter:`workspace_id=eq.${w?.id}` }, () => loadRecent(w?.id))
      .subscribe()
  }

  async function loadRecent(id: string) {
    if (!id) return
    const { data } = await supabase.from('content').select('*').eq('workspace_id', id).order('created_at', { ascending:false }).limit(18)
    setRecent(data ?? [])
  }

  async function generateCopy() {
    if (!prompt.trim() || genning) return
    setGenning(true); setResult(null); setCopyErr(null); setSched(false); setCopied(false)
    try {
      const r = await fetch('/api/generate-content', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ workspace_id:ws?.id, type:fmt, platform:plat, prompt:prompt.trim() }) })
      const d = await r.json()
      if (!r.ok) { setCopyErr(r.status === 402 ? d.message : (d.error ?? 'Generation failed')); return }
      setResult(d.content); setResultId(d.content_id); setCrUsed(d.credits_used)
    } catch { setCopyErr('Something went wrong. Try again.') }
    setGenning(false)
  }

  async function generateImage() {
    if (!iPrompt.trim() || iGen) return
    setIGen(true); setIResult(null); setIErr(null)
    try {
      const r = await fetch('/api/generate-image', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ workspace_id:ws?.id, prompt:iPrompt.trim(), style:iStyle, aspect_ratio:iRatio }) })
      const d = await r.json()
      if (!r.ok) { setIErr(r.status === 402 ? d.message : (d.error ?? 'Failed')); return }
      setIResult(d.image_url)
    } catch { setIErr('Something went wrong.') }
    setIGen(false)
  }

  async function generateVideo() {
    if (!vPrompt.trim() || vGen) return
    setVGen(true); setVResult(null); setVErr(null); setVProg(0)
    const iv = setInterval(() => setVProg(p => p < 88 ? +(p + Math.random() * 4).toFixed(1) : p), 4000)
    try {
      const body: any = { workspace_id:ws?.id, prompt:vPrompt.trim(), style:vStyle.toLowerCase(), duration:vDur, aspect_ratio:vRatio, motion_strength:motion }
      if (vMode === 'image' && vImg) body.image_url = vImg
      if (vMode === 'frame') { body.start_frame_url = startUrl; body.end_frame_url = endUrl }
      const r = await fetch('/api/generate-video', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })
      const d = await r.json()
      clearInterval(iv)
      if (!r.ok) { setVErr(r.status === 402 ? d.message : (d.error ?? 'Failed')); return }
      setVProg(100); setVResult(d.video_url)
    } catch { clearInterval(iv); setVErr('Something went wrong.') }
    setVGen(false)
  }

  async function generateVoice() {
    if (!vxText.trim() || vxGen) return
    setVxGen(true); setVxResult(null); setVxErr(null)
    try {
      const r = await fetch('/api/generate-voice', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ workspace_id:ws?.id, text:vxText.trim(), voice_id:vxId, stability:stab }) })
      const d = await r.json()
      if (!r.ok) { setVxErr(r.status === 402 ? d.message : (d.error ?? 'Failed')); return }
      setVxResult(d.audio_url)
    } catch { setVxErr('Something went wrong.') }
    setVxGen(false)
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  async function schedulePost() {
    if (!resultId) return
    const t = new Date(); t.setDate(t.getDate() + 1); t.setHours(9, 0, 0, 0)
    await supabase.from('content').update({ status:'scheduled', scheduled_for:t.toISOString() }).eq('id', resultId)
    setSched(true)
  }

  function upload(file: File, set: (u: string) => void) {
    const r = new FileReader()
    r.onload = e => set(e.target?.result as string)
    r.readAsDataURL(file)
  }

  const selFmt   = FORMATS.find(f => f.id === fmt)!
  const activeT  = TABS.find(t => t.id === tab)!

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 252px', height:'calc(100vh - var(--topbar-h))', overflow:'hidden' }}>

      {/* ═══════════════════════════════════════
          LEFT — CANVAS
      ═══════════════════════════════════════ */}
      <div style={{ overflowY:'auto', padding:'28px 32px 48px', borderRight:'1px solid rgba(255,255,255,0.05)' }}>

        {/* Header */}
        <div style={{
          marginBottom: 24,
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.45s ease, transform 0.45s ease',
        }}>
          <h1 style={{ fontFamily:'var(--display)', fontSize:24, fontWeight:800, letterSpacing:'-0.04em', color:'rgba(255,255,255,0.92)', lineHeight:1, marginBottom:5 }}>
            Studio
          </h1>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)', lineHeight:1.5 }}>
            {ws?.brand_voice
              ? `Writing in your voice — ${ws.brand_voice.slice(0, 55)}${ws.brand_voice.length > 55 ? '…' : ''}`
              : 'Every output is written in your brand voice. Train Brand Brain to make it sharper.'}
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{
          marginBottom: 28,
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.45s ease 0.06s, transform 0.45s ease 0.06s',
        }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(0, 1fr))', gap:5, padding:4, background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16 }}>
            {TABS.map(t => {
              const active = tab === t.id
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{
                    display: 'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                    gap: 3, padding: '11px 6px',
                    borderRadius: 12,
                    background: active ? `linear-gradient(160deg, ${t.color}18 0%, ${t.color}08 100%)` : 'transparent',
                    border: `1px solid ${active ? `${t.color}30` : 'transparent'}`,
                    color: active ? t.color : 'rgba(255,255,255,0.3)',
                    cursor: 'pointer', fontFamily:'var(--sans)', transition:'all 0.16s',
                    boxShadow: active ? `0 2px 14px ${t.color}18` : 'none',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ display:'flex', opacity: active ? 1 : 0.6 }}>{t.icon}</span>
                    <span style={{ fontSize:13, fontWeight: active ? 700 : 500 }}>{t.label}</span>
                  </div>
                  <span style={{ fontSize:9.5, color: active ? `${t.color}80` : 'rgba(255,255,255,0.2)', fontWeight:500 }}>{t.sub}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ──────── COPY ──────── */}
        {tab === 'copy' && (
          <div style={{ width:'100%', animation:'pageUp 0.3s ease both' }}>

            {/* Format */}
            <div style={{ marginBottom:22 }}>
              <SLabel>Format</SLabel>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(110px, 1fr))', gap:7 }}>
                {FORMATS.map(f => <FormatBtn key={f.id} f={f} active={fmt===f.id} onClick={() => setFmt(f.id)} color="#4D9FFF"/>)}
              </div>
            </div>

            {/* Platform */}
            <div style={{ marginBottom:22 }}>
              <SLabel>Platform</SLabel>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {PLATFORMS.map(p => <PlatPill key={p.id} p={p} active={plat===p.id} onClick={() => setPlat(p.id)}/>)}
              </div>
            </div>

            {/* Direction */}
            <div style={{ marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:9 }}>
                <SLabel>Direction</SLabel>
                <span style={{ fontSize:10, color:'rgba(255,255,255,0.18)' }}>⌘ Enter to generate</span>
              </div>
              <Textarea
                value={prompt}
                onChange={setPrompt}
                rows={5}
                placeholder={`Give Nexa a direction, angle, or idea.\n\n"Why perfectionism is killing your engagement" lands harder than "a post about productivity."\n\nBe specific. Nexa will handle the craft.`}
              />
            </div>

            {/* Angle chips — ultra subtle */}
            <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:22 }}>
              {ANGLES.map((a, i) => (
                <button key={i} onClick={() => setPrompt(a)}
                  style={{ padding:'4px 10px', borderRadius:100, fontSize:11, background:'transparent', border:'1px solid rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.22)', cursor:'pointer', fontFamily:'var(--sans)', transition:'all 0.18s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(77,159,255,0.22)'; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.6)'; (e.currentTarget as HTMLElement).style.background='rgba(77,159,255,0.05)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.22)'; (e.currentTarget as HTMLElement).style.background='transparent' }}>
                  {a.length > 48 ? a.slice(0, 48) + '…' : a}
                </button>
              ))}
            </div>

            <GenBtn
              active={!!prompt.trim()}
              loading={genning}
              label={`Write ${selFmt.label} · ${selFmt.cost} credits`}
              loadingLabel="Writing in your brand voice…"
              onClick={generateCopy}
              color="#4D9FFF"
            />

            {copyErr && <ErrBanner msg={copyErr}/>}

            {/* RESULT — the output deserves real estate */}
            {result && (
              <div style={{ marginTop:22, animation:'pageUp 0.35s ease both' }}>
                {/* Result header */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:11 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:'#4D9FFF', boxShadow:'0 0 7px #4D9FFF' }}/>
                    <span style={{ fontSize:11.5, fontWeight:600, color:'rgba(255,255,255,0.42)', letterSpacing:'-0.01em' }}>
                      {selFmt.label} · {crUsed} credits used
                    </span>
                  </div>
                  <div style={{ display:'flex', gap:5 }}>
                    <ActBtn icon={copied ? Ic.check : Ic.clone} label={copied ? 'Copied' : 'Copy'} onClick={() => copyText(result!)} active={copied} color="#4D9FFF"/>
                    <ActBtn icon={Ic.redo}    label="Rewrite"   onClick={generateCopy}/>
                    <ActBtn icon={Ic.mic}     label="Narrate"   onClick={() => { setVxText(result!); setTab('voice') }} color="#34D399"/>
                    <ActBtn icon={sched ? Ic.check : Ic.cal} label={sched ? 'Queued' : 'Schedule'} onClick={schedulePost} active={sched} color="#FFB547"/>
                  </div>
                </div>
                {/* Output card — premium treatment */}
                <div style={{
                  padding: '22px 24px',
                  background: 'linear-gradient(160deg, rgba(77,159,255,0.07) 0%, rgba(0,0,0,0.28) 100%)',
                  border: '1px solid rgba(77,159,255,0.18)',
                  borderRadius: 16,
                  fontSize: 14.5,
                  color: 'rgba(255,255,255,0.88)',
                  lineHeight: 1.88,
                  whiteSpace: 'pre-wrap',
                  letterSpacing: '-0.01em',
                  boxShadow: '0 0 40px rgba(77,159,255,0.07), inset 0 1px 0 rgba(255,255,255,0.07)',
                  fontWeight: 400,
                }}>
                  {result}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ──────── IMAGE ──────── */}
        {tab === 'image' && (
          <div style={{ width:'100%', animation:'pageUp 0.3s ease both' }}>
            <ProvBadge name="Flux" desc="Photorealistic brand imagery · ~15 seconds" color="#A78BFA"/>

            <div style={{ marginBottom:22 }}>
              <SLabel>Describe your image</SLabel>
              <Textarea
                value={iPrompt}
                onChange={setIPrompt}
                rows={4}
                placeholder={`Be specific. "A focused founder at a dark oak desk, morning light through tall windows, premium editorial photography" produces something extraordinary.\n\nVague gets vague.`}
              />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:22, marginBottom:26 }}>
              <div>
                <SLabel>Visual style</SLabel>
                <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                  {IMG_STYLES.map((s, i) => (
                    <Pill key={s} label={s} active={iStyle === IMG_IDS[i]} onClick={() => setIStyle(IMG_IDS[i])} color="#A78BFA"/>
                  ))}
                </div>
              </div>
              <div>
                <SLabel>Format</SLabel>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:6 }}>
                  {RATIOS.map(r => (
                    <button key={r.id} onClick={() => setIRatio(r.id)}
                      style={{ padding:'9px 6px', borderRadius:9, background:iRatio===r.id?'rgba(167,139,250,0.1)':'rgba(255,255,255,0.025)', border:`1px solid ${iRatio===r.id?'rgba(167,139,250,0.28)':'rgba(255,255,255,0.07)'}`, color:iRatio===r.id?'#A78BFA':'rgba(255,255,255,0.4)', cursor:'pointer', fontFamily:'var(--sans)', textAlign:'center', transition:'all 0.15s', boxShadow:iRatio===r.id?'0 0 12px rgba(167,139,250,0.14)':'none' }}>
                      <div style={{ fontSize:12, fontWeight:700 }}>{r.l}</div>
                      <div style={{ fontSize:9.5, opacity:0.55 }}>{r.d}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <GenBtn active={!!iPrompt.trim()} loading={iGen} label="Generate image · 5 credits" loadingLabel="Flux is painting your image…" onClick={generateImage} color="#A78BFA"/>
            {iErr && <ErrBanner msg={iErr}/>}

            {iResult && (
              <div style={{ marginTop:22, animation:'pageUp 0.35s ease both' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:11 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:'#A78BFA', boxShadow:'0 0 7px #A78BFA' }}/>
                    <span style={{ fontSize:11.5, fontWeight:600, color:'rgba(255,255,255,0.42)' }}>Image · 5 credits used</span>
                  </div>
                  <div style={{ display:'flex', gap:5 }}>
                    <ActBtn icon={Ic.film} label="Animate →" onClick={() => { setTab('video'); setVMode('image'); setVImg(iResult!) }} color="#FF7A40"/>
                    <a href={iResult} download={`nexa-${Date.now()}.jpg`} style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,fontSize:11,fontWeight:600,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.42)',textDecoration:'none' }}>{Ic.dl} Save</a>
                    <ActBtn icon={Ic.redo} label="Redo" onClick={generateImage}/>
                  </div>
                </div>
                <div style={{ borderRadius:16, overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 12px 48px rgba(0,0,0,0.5)' }}>
                  <img src={iResult} alt="Generated" style={{ width:'100%', display:'block', maxHeight:560, objectFit:'cover' }}/>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ──────── VIDEO ──────── */}
        {tab === 'video' && (
          <div style={{ width:'100%', animation:'pageUp 0.3s ease both' }}>
            <ProvBadge name="Kling 3.0" desc="Cinematic video · renders in 1–3 minutes" color="#FF7A40"/>

            <div style={{ marginBottom:20 }}>
              <SLabel>Mode</SLabel>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:7 }}>
                {VID_MODES.map(m => (
                  <button key={m.id} onClick={() => setVMode(m.id)}
                    style={{ padding:'12px 10px', borderRadius:11, background:vMode===m.id?'rgba(255,122,64,0.1)':'rgba(255,255,255,0.025)', border:`1px solid ${vMode===m.id?'rgba(255,122,64,0.28)':'rgba(255,255,255,0.07)'}`, cursor:'pointer', fontFamily:'var(--sans)', textAlign:'left', transition:'all 0.15s', boxShadow:vMode===m.id?'0 0 14px rgba(255,122,64,0.14)':'none' }}>
                    <div style={{ fontSize:12, fontWeight:700, color:vMode===m.id?'#FF7A40':'rgba(255,255,255,0.75)', marginBottom:3 }}>{m.label}</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)' }}>{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {vMode === 'image' && (
              <div style={{ marginBottom:20 }}>
                <SLabel>Source image</SLabel>
                {vImg ? (
                  <div style={{ position:'relative', borderRadius:12, overflow:'hidden', border:'1px solid rgba(255,122,64,0.2)' }}>
                    <img src={vImg} alt="" style={{ width:'100%', maxHeight:200, objectFit:'cover', display:'block' }}/>
                    <button onClick={() => setVImg('')} style={{ position:'absolute',top:8,right:8,padding:'4px 10px',borderRadius:6,fontSize:11,fontWeight:600,background:'rgba(0,0,0,0.8)',border:'none',color:'#fff',cursor:'pointer' }}>Remove</button>
                  </div>
                ) : (
                  <div onClick={() => imgRef.current?.click()}
                    style={{ padding:'32px', border:'1px dashed rgba(255,255,255,0.1)', borderRadius:12, textAlign:'center', cursor:'pointer', color:'rgba(255,255,255,0.35)', display:'flex', alignItems:'center', justifyContent:'center', gap:10, fontSize:13, transition:'all 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,122,64,0.3)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'}>
                    {Ic.upload}<span>Drop your image here, or click to browse</span>
                    <input ref={imgRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => e.target.files?.[0] && upload(e.target.files[0], setVImg)}/>
                  </div>
                )}
              </div>
            )}

            {vMode === 'frame' && (
              <div style={{ marginBottom:20, display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {([{ l:'Start frame',u:startUrl,s:setStartUrl,r:startRef },{ l:'End frame',u:endUrl,s:setEndUrl,r:endRef }] as any[]).map(f => (
                  <div key={f.l}>
                    <SLabel>{f.l}</SLabel>
                    {f.u ? (
                      <div style={{ position:'relative', borderRadius:10, overflow:'hidden', border:'1px solid rgba(255,122,64,0.2)' }}>
                        <img src={f.u} alt="" style={{ width:'100%', height:120, objectFit:'cover', display:'block' }}/>
                        <button onClick={() => f.s('')} style={{ position:'absolute',top:6,right:6,padding:'3px 8px',borderRadius:5,fontSize:10,fontWeight:600,background:'rgba(0,0,0,0.8)',border:'none',color:'#fff',cursor:'pointer' }}>✕</button>
                      </div>
                    ) : (
                      <div onClick={() => f.r.current?.click()} style={{ height:120, border:'1px dashed rgba(255,255,255,0.1)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'rgba(255,255,255,0.3)', gap:7, fontSize:12 }}>
                        {Ic.upload} Upload frame
                        <input ref={f.r} type="file" accept="image/*" style={{ display:'none' }} onChange={(e: any) => e.target.files?.[0] && upload(e.target.files[0], f.s)}/>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginBottom:20 }}>
              <SLabel>Describe the scene</SLabel>
              <Textarea value={vPrompt} onChange={setVPrompt} rows={4} placeholder="A founder stepping off a private jet at golden hour, slow-motion, cinematic lens flare, premium brand aesthetic…"/>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:22, marginBottom:22 }}>
              <div>
                <SLabel>Style</SLabel>
                <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                  {VID_STYLES.map(s => <Pill key={s} label={s} active={vStyle===s} onClick={() => setVStyle(s)} color="#FF7A40"/>)}
                </div>
              </div>
              <div>
                <SLabel>Duration & ratio</SLabel>
                <div style={{ display:'flex', gap:5, marginBottom:7 }}>
                  {[5,10].map(d => <Pill key={d} label={`${d}s`} active={vDur===d} onClick={() => setVDur(d)} color="#FF7A40"/>)}
                </div>
                <div style={{ display:'flex', gap:5 }}>
                  {['16:9','9:16','1:1'].map(r => <Pill key={r} label={r} active={vRatio===r} onClick={() => setVRatio(r)} color="#FF7A40"/>)}
                </div>
              </div>
            </div>

            <div style={{ marginBottom:26 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:9 }}>
                <SLabel>Motion intensity</SLabel>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontWeight:500 }}>
                  {motion < 0.35 ? 'Subtle' : motion > 0.65 ? 'Dynamic' : 'Balanced'} · {Math.round(motion * 100)}%
                </span>
              </div>
              <input type="range" min="0" max="1" step="0.05" value={motion} onChange={e => setMotion(parseFloat(e.target.value))} style={{ width:'100%', accentColor:'#FF7A40' }}/>
            </div>

            <GenBtn active={!!vPrompt.trim()} loading={vGen} label="Generate video · 20 credits" loadingLabel="Kling is rendering your clip…" onClick={generateVideo} color="#FF7A40"/>

            {vGen && (
              <div style={{ marginTop:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7, fontSize:11, color:'rgba(255,255,255,0.3)' }}>
                  <span>Rendering in the background. Usually 1–3 minutes.</span>
                  <span style={{ fontWeight:700 }}>{Math.round(vProg)}%</span>
                </div>
                <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${vProg}%`, background:'linear-gradient(90deg,#FF4500,#FF7A40)', borderRadius:3, transition:'width 1s ease' }}/>
                </div>
              </div>
            )}
            {vErr && <ErrBanner msg={vErr}/>}
            {vResult && (
              <div style={{ marginTop:22, animation:'pageUp 0.35s ease both' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:11 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:'#FF7A40', boxShadow:'0 0 7px #FF7A40' }}/>
                    <span style={{ fontSize:11.5, fontWeight:600, color:'rgba(255,255,255,0.42)' }}>Video · 20 credits used</span>
                  </div>
                  <div style={{ display:'flex', gap:5 }}>
                    <a href={vResult} download={`nexa-${Date.now()}.mp4`} style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,fontSize:11,fontWeight:600,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.42)',textDecoration:'none' }}>{Ic.dl} Save</a>
                    <ActBtn icon={Ic.redo} label="Redo" onClick={generateVideo}/>
                  </div>
                </div>
                <div style={{ borderRadius:16, overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)', background:'#000', boxShadow:'0 12px 48px rgba(0,0,0,0.6)' }}>
                  <video src={vResult} controls style={{ width:'100%', display:'block', maxHeight:460 }}/>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ──────── VOICE ──────── */}
        {tab === 'voice' && (
          <div style={{ width:'100%', animation:'pageUp 0.3s ease both' }}>
            <ProvBadge name="ElevenLabs" desc="Ultra-realistic voiceovers · 8 languages" color="#34D399"/>

            <div style={{ marginBottom:24 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:9 }}>
                <SLabel>Script</SLabel>
                <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)' }}>{vxText.length} / 5,000</span>
              </div>
              <Textarea
                value={vxText}
                onChange={(v: string) => setVxText(v.slice(0, 5000))}
                rows={6}
                placeholder="Your script goes here. It works best with copy generated in the Copy tab — it's already written in your brand voice, so the narration will sound completely authentic."
              />
              {result && (
                <button onClick={() => setVxText(result)}
                  style={{ display:'flex',alignItems:'center',gap:6,marginTop:9,padding:'5px 13px',borderRadius:8,fontSize:11,fontWeight:600,background:'rgba(52,211,153,0.07)',border:'1px solid rgba(52,211,153,0.2)',color:'#34D399',cursor:'pointer',fontFamily:'var(--sans)',transition:'all 0.15s' }}>
                  {Ic.clone} Use last generated copy
                </button>
              )}
            </div>

            <div style={{ marginBottom:22 }}>
              <SLabel>Voice</SLabel>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(110px, 1fr))', gap:7 }}>
                {VOICES.map(v => (
                  <button key={v.id} onClick={() => setVxId(v.id)}
                    style={{ padding:'11px 10px', borderRadius:11, background:vxId===v.id?'rgba(52,211,153,0.09)':'rgba(255,255,255,0.025)', border:`1px solid ${vxId===v.id?'rgba(52,211,153,0.28)':'rgba(255,255,255,0.07)'}`, cursor:'pointer', fontFamily:'var(--sans)', textAlign:'left', transition:'all 0.15s', boxShadow:vxId===v.id?'0 0 14px rgba(52,211,153,0.12)':'none' }}>
                    <div style={{ fontSize:12, fontWeight:700, color:vxId===v.id?'#34D399':'rgba(255,255,255,0.75)', marginBottom:2 }}>{v.name}</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)' }}>{v.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:26 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:9 }}>
                <SLabel>Stability</SLabel>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>
                  {stab < 0.4 ? 'Expressive' : stab > 0.7 ? 'Consistent' : 'Balanced'} · {Math.round(stab * 100)}%
                </span>
              </div>
              <input type="range" min="0" max="1" step="0.05" value={stab} onChange={e => setStab(parseFloat(e.target.value))} style={{ width:'100%', accentColor:'#34D399' }}/>
            </div>

            <GenBtn active={!!vxText.trim()} loading={vxGen} label="Generate voiceover · 8 credits" loadingLabel="ElevenLabs is rendering…" onClick={generateVoice} color="#34D399"/>
            {vxErr && <ErrBanner msg={vxErr}/>}
            {vxResult && (
              <div style={{ marginTop:22, animation:'pageUp 0.35s ease both' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:11 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:'#34D399', boxShadow:'0 0 7px #34D399' }}/>
                    <span style={{ fontSize:11.5, fontWeight:600, color:'rgba(255,255,255,0.42)' }}>Voiceover · 8 credits used</span>
                  </div>
                  <div style={{ display:'flex', gap:5 }}>
                    <a href={vxResult} download={`nexa-voice-${Date.now()}.mp3`} style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,fontSize:11,fontWeight:600,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.42)',textDecoration:'none' }}>{Ic.dl} Save</a>
                    <ActBtn icon={Ic.redo} label="Redo" onClick={generateVoice} color="#34D399"/>
                  </div>
                </div>
                <div style={{ padding:'18px 20px', background:'rgba(52,211,153,0.05)', border:'1px solid rgba(52,211,153,0.15)', borderRadius:14, boxShadow:'0 0 30px rgba(52,211,153,0.06)' }}>
                  <audio src={vxResult} controls style={{ width:'100%' }}/>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════
          RIGHT — LIVE FEED
      ═══════════════════════════════════════ */}
      <div style={{ overflowY:'auto', background:'rgba(5,5,10,0.75)', borderLeft:'1px solid rgba(255,255,255,0.05)', display:'flex', flexDirection:'column' }}>

        {/* Feed header */}
        <div style={{ padding:'22px 16px 12px', flexShrink:0, borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.55)', letterSpacing:'-0.01em', marginBottom:2 }}>
            Recent
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.22)' }}>
            {recent.length > 0 ? `${recent.length} pieces created` : 'Nothing yet — start creating'}
          </div>
        </div>

        {/* Feed items */}
        <div style={{ padding:'10px 10px 20px', flex:1 }}>
          {recent.length > 0 ? recent.map(item => {
            const tColor = item.type==='image'?'#A78BFA':item.type==='video'?'#FF7A40':item.type==='voice'?'#34D399':'#4D9FFF'
            const tBg    = item.type==='image'?'rgba(167,139,250,0.1)':item.type==='video'?'rgba(255,122,64,0.1)':item.type==='voice'?'rgba(52,211,153,0.08)':'rgba(77,159,255,0.08)'
            return (
              <div key={item.id} className="rc-card"
                style={{ marginBottom:7, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:11, overflow:'hidden', cursor:'pointer', transition:'all 0.15s' }}
                onClick={() => {
                  if (item.type==='image'&&item.image_url) { setTab('image'); setIResult(item.image_url) }
                  else if (item.type==='video'&&item.video_url) { setTab('video'); setVResult(item.video_url) }
                  else if (item.type==='voice'&&item.voice_url) { setTab('voice'); setVxResult(item.voice_url) }
                  else if (item.body) { setTab('copy'); setResult(item.body); setResultId(item.id) }
                }}>
                {item.image_url && (
                  <div style={{ position:'relative' }}>
                    <img src={item.image_url} alt="" style={{ width:'100%', height:88, objectFit:'cover', display:'block' }}/>
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.65) 100%)' }}/>
                  </div>
                )}
                {item.type==='video' && !item.image_url && (
                  <div style={{ height:48, background:'rgba(255,122,64,0.07)', display:'flex', alignItems:'center', justifyContent:'center', color:'#FF7A40', gap:6, fontSize:11, fontWeight:600 }}>
                    <span style={{ display:'flex' }}>{Ic.video}</span>Video clip
                  </div>
                )}
                {item.type==='voice' && (
                  <div style={{ height:38, background:'rgba(52,211,153,0.04)', display:'flex', alignItems:'center', justifyContent:'center', gap:2 }}>
                    {[3,5,8,5,10,7,4,8,5,9,4,7,3,6,8].map((h, i) => (
                      <div key={i} style={{ width:2, height:h*2.2, background:'#34D399', borderRadius:2, opacity:0.5 }}/>
                    ))}
                  </div>
                )}
                <div style={{ padding:'8px 11px' }}>
                  <div style={{ display:'flex', gap:5, alignItems:'center', marginBottom:4 }}>
                    <span style={{ fontSize:9, fontWeight:700, padding:'1px 7px', borderRadius:4, background:tBg, color:tColor, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                      {item.type || 'copy'}
                    </span>
                    {item.platform && <span style={{ fontSize:9, color:'rgba(255,255,255,0.25)' }}>{item.platform}</span>}
                    <span style={{ fontSize:9, color:'rgba(255,255,255,0.18)', marginLeft:'auto' }}>{item.credits_used}cr</span>
                  </div>
                  {item.body && (
                    <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.5)', lineHeight:1.52, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as const }}>
                      {item.body}
                    </div>
                  )}
                </div>
              </div>
            )
          }) : (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', padding:'40px 16px' }}>
              <div style={{ width:44, height:44, borderRadius:13, background:'rgba(77,159,255,0.06)', border:'1px solid rgba(77,159,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(77,159,255,0.4)', marginBottom:14 }}>
                {Ic.copy}
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.28)', lineHeight:1.7 }}>
                Every piece you create<br/>appears here instantly.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
