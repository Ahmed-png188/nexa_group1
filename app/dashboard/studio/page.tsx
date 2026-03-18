'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'

type ContentType   = 'post' | 'thread' | 'email' | 'caption' | 'hook' | 'bio' | 'ad' | 'story'
type Platform      = 'instagram' | 'linkedin' | 'x' | 'tiktok' | 'email' | 'general'
type Tab           = 'pipeline' | 'copy' | 'image' | 'video' | 'voice'
type PipelineFormat = 'post' | 'image' | 'carousel' | 'reel' | 'voice'

interface TodayAngle {
  angle: string
  platform: string
  type: string
  hook: string
  pillar: string
}

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
  mic:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>,
  film:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  lock:   <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
}

const TABS = [
  { id: 'pipeline' as Tab, label: 'Pipeline', sub: 'Start here', color: '#4D9FFF', icon: Ic.bolt,  requiredPlan: null    },
  { id: 'copy'     as Tab, label: 'Copy',     sub: 'All plans',  color: '#4D9FFF', icon: Ic.copy,  requiredPlan: null    },
  { id: 'image'    as Tab, label: 'Image',    sub: 'Grow+',      color: '#A78BFA', icon: Ic.image, requiredPlan: 'grow'  },
  { id: 'video'    as Tab, label: 'Video',    sub: 'Scale+',     color: '#FF7A40', icon: Ic.video, requiredPlan: 'scale' },
  { id: 'voice'    as Tab, label: 'Voice',    sub: 'Scale+',     color: '#34D399', icon: Ic.voice, requiredPlan: 'scale' },
]
const FORMATS = [
  { id: 'post'    as ContentType, label: 'Post',    cost: 3 },
  { id: 'hook'    as ContentType, label: 'Hook',    cost: 2 },
  { id: 'thread'  as ContentType, label: 'Thread',  cost: 5 },
  { id: 'caption' as ContentType, label: 'Caption', cost: 2 },
  { id: 'email'   as ContentType, label: 'Email',   cost: 5 },
  { id: 'story'   as ContentType, label: 'Story',   cost: 2 },
  { id: 'ad'      as ContentType, label: 'Ad Copy', cost: 5 },
  { id: 'bio'     as ContentType, label: 'Bio',     cost: 2 },
]
const PLATFORMS = [
  { id: 'instagram' as Platform, label: 'Instagram', color: '#E1306C' },
  { id: 'linkedin'  as Platform, label: 'LinkedIn',  color: '#0A66C2' },
  { id: 'x'         as Platform, label: 'X',         color: '#E7E7E7' },
  { id: 'tiktok'    as Platform, label: 'TikTok',    color: '#FF2D55' },
  { id: 'email'     as Platform, label: 'Email',     color: '#4D9FFF' },
  { id: 'general'   as Platform, label: 'General',   color: '#888888' },
]
const IMG_STYLES = ['Photorealistic','Cinematic','Minimal','Dark Moody','Vibrant','Illustration']
const IMG_IDS    = ['photorealistic','cinematic','minimal clean white background','dark moody premium','vibrant colorful','flat design illustration']
const RATIOS     = [{ id:'1:1',l:'1:1',d:'Square' },{ id:'4:5',l:'4:5',d:'Portrait' },{ id:'16:9',l:'16:9',d:'Wide' },{ id:'9:16',l:'9:16',d:'Story' }]
const VID_STYLES = ['Cinematic','Documentary','Brand Ad','Social','Minimal','Dramatic']
const VID_MODES  = [
  { id:'text'  as const, label:'Text to Video', desc:'Describe a scene' },
  { id:'image' as const, label:'Image to Video', desc:'Animate a still' },
  { id:'frame' as const, label:'Start to End',   desc:'Two keyframes' },
]
const VOICES = [
  { id:'rachel',name:'Rachel',desc:'Warm - F' },
  { id:'drew',  name:'Drew',  desc:'Confident - M' },
  { id:'clyde', name:'Clyde', desc:'Expressive - M' },
  { id:'paul',  name:'Paul',  desc:'Authority - M' },
  { id:'domi',  name:'Domi',  desc:'Strong - F' },
  { id:'bella', name:'Bella', desc:'Soft - F' },
  { id:'Antoni',name:'Antoni',desc:'Natural - M' },
  { id:'elli',  name:'Elli',  desc:'Emotional - F' },
]
const ANGLES = [
  'The belief that separates those who grow from those who stay stuck',
  'What your audience is getting wrong about this space',
  'The uncomfortable truth everyone sees but nobody says',
  'Why less input produces better results here',
]

function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="nexa-label" style={{ marginBottom:9, fontFamily:'var(--sans)', fontSize:10, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase' as const, color:'var(--t4)' }}>
      {children}
    </div>
  )
}

function FormatBtn({ f, active, onClick, color }: any) {
  const [hov, setHov] = useState(false)
  const bg = active ? color+'10' : hov ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.025)'
  const bd = '1px solid '+(active ? color+'35' : hov ? 'rgba(255,255,255,0.11)' : 'rgba(255,255,255,0.07)')
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ padding:'13px 10px 11px', borderRadius:11, background:bg, border:bd, cursor:'pointer', fontFamily:'var(--sans)', textAlign:'left', transition:'all 0.15s', position:'relative', boxShadow:active?'0 0 16px '+color+'18':'none' }}>
      {active && <div style={{ position:'absolute',top:7,right:7,width:4,height:4,borderRadius:'50%',background:color,boxShadow:'0 0 5px '+color }}/>}
      <div style={{ fontSize:13, fontWeight:700, color:active?color:'rgba(255,255,255,0.78)', marginBottom:3, letterSpacing:'-0.01em' }}>{f.label}</div>
      <div style={{ fontSize:10, color:active?color+'70':'rgba(255,255,255,0.22)' }}>{f.cost} cr</div>
    </button>
  )
}

function PlatPill({ p, active, onClick }: any) {
  const [hov, setHov] = useState(false)
  const bg = active ? p.color+'16' : hov ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.035)'
  const bd = '1px solid '+(active ? p.color+'45' : hov ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)')
  const cl = active ? p.color : hov ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.38)'
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ padding:'5px 15px', borderRadius:100, fontSize:12, fontWeight:500, background:bg, border:bd, color:cl, cursor:'pointer', fontFamily:'var(--sans)', transition:'all 0.14s', flexShrink:0 }}>
      {p.label}
    </button>
  )
}

function Pill({ label, active, onClick, color }: any) {
  const bg = active ? color+'12' : 'rgba(255,255,255,0.035)'
  const bd = '1px solid '+(active ? color+'35' : 'rgba(255,255,255,0.08)')
  return (
    <button onClick={onClick} style={{ padding:'5px 12px', borderRadius:100, fontSize:11.5, fontWeight:600, background:bg, border:bd, color:active?color:'rgba(255,255,255,0.38)', cursor:'pointer', fontFamily:'var(--sans)', transition:'all 0.14s', flexShrink:0 }}>
      {label}
    </button>
  )
}

function Textarea({ value, onChange, placeholder, rows=5 }: any) {
  const [focused, setFocused] = useState(false)
  const bg = focused ? 'rgba(77,159,255,0.035)' : 'rgba(255,255,255,0.025)'
  const bd = '1px solid '+(focused ? 'rgba(77,159,255,0.28)' : 'rgba(255,255,255,0.08)')
  return (
    <div style={{ borderRadius:13, background:bg, border:bd, transition:'all 0.18s', boxShadow:focused?'0 0 0 3px rgba(77,159,255,0.05)':'none' }}>
      <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
        onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
        style={{ width:'100%', padding:'14px 16px', fontSize:13.5, fontFamily:'var(--sans)', background:'transparent', border:'none', color:'rgba(255,255,255,0.88)', outline:'none', resize:'vertical', lineHeight:1.72, boxSizing:'border-box' }}
      />
    </div>
  )
}

function GenBtn({ active, loading, label, loadingLabel, onClick, color }: any) {
  const [hov, setHov] = useState(false)
  const bg  = active ? (hov ? color : color+'ee') : 'rgba(255,255,255,0.04)'
  const shd = active ? '0 4px 28px '+color+'40' : 'none'
  return (
    <button onClick={onClick} disabled={!active||loading} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ width:'100%', padding:'15px 20px', borderRadius:13, fontSize:14, fontWeight:700, fontFamily:'var(--display)', letterSpacing:'-0.02em', background:bg, color:active?'#000':'rgba(255,255,255,0.18)', border:'none', cursor:active?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:9, transition:'all 0.18s', boxShadow:shd, transform:(active&&hov)?'translateY(-1px)':'none' }}>
      {loading
        ? <><div className="nexa-spinner" style={{ width:15, height:15 }}/><span style={{ letterSpacing:'-0.01em' }}>{loadingLabel}</span></>
        : <><span style={{ display:'flex',opacity:0.85 }}>{Ic.bolt}</span>{label}</>
      }
    </button>
  )
}

function ActBtn({ icon, label, onClick, active=false, color='rgba(255,255,255,0.5)' }: any) {
  const [hov, setHov] = useState(false)
  const on = active||hov
  const bg = on ? color+'14' : 'rgba(255,255,255,0.035)'
  const bd = '1px solid '+(on ? color+'30' : 'rgba(255,255,255,0.08)')
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,fontSize:11,fontWeight:600,background:bg,border:bd,color:on?color:'rgba(255,255,255,0.42)',cursor:'pointer',fontFamily:'var(--sans)',transition:'all 0.14s' }}>
      <span style={{ display:'flex' }}>{icon}</span>{label}
    </button>
  )
}

function ProvBadge({ name, desc, color }: any) {
  return (
    <div style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 16px',marginBottom:22,background:color+'08',border:'1px solid '+color+'20',borderRadius:10 }}>
      <div style={{ width:7,height:7,borderRadius:'50%',background:color,boxShadow:'0 0 8px '+color+'80' }}/>
      <span style={{ fontSize:12,fontWeight:700,color,letterSpacing:'-0.01em' }}>{name}</span>
      <span style={{ fontSize:12,color:'rgba(255,255,255,0.28)' }}>-</span>
      <span style={{ fontSize:12,color:'rgba(255,255,255,0.38)' }}>{desc}</span>
    </div>
  )
}

function ErrBanner({ msg }: { msg: string }) {
  const isUpgrade = msg.includes('requires the')||msg.includes('upgrade')||msg.includes('Trial expired')||msg.includes('plan')
  if (isUpgrade) {
    const m = msg.match(/requires the (\w+) plan/i)
    const planName = m ? m[1] : 'next'
    const planId   = planName.toLowerCase()
    return (
      <div style={{ marginTop:14,padding:'16px 18px',background:'rgba(167,139,250,0.06)',border:'1px solid rgba(167,139,250,0.22)',borderRadius:13 }}>
        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:14 }}>
          <div>
            <div style={{ display:'flex',alignItems:'center',gap:7,marginBottom:7 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span style={{ fontSize:12,fontWeight:700,color:'#A78BFA' }}>Feature locked</span>
            </div>
            <div style={{ fontSize:12.5,color:'rgba(255,255,255,0.6)',lineHeight:1.6 }}>{msg}</div>
          </div>
          <a href={'/dashboard/settings?tab=billing&highlight='+planId}
            style={{ display:'flex',alignItems:'center',gap:6,padding:'9px 18px',background:'#A78BFA',borderRadius:9,fontSize:12,fontWeight:700,color:'#000',textDecoration:'none',whiteSpace:'nowrap',flexShrink:0 }}>
            Upgrade to {planName}
          </a>
        </div>
      </div>
    )
  }
  return (
    <div style={{ marginTop:14,padding:'12px 16px',background:'rgba(255,80,80,0.07)',border:'1px solid rgba(255,80,80,0.2)',borderRadius:11,fontSize:13,color:'#FF7878',lineHeight:1.55 }}>
      {msg}
    </div>
  )
}

function UpgradeGate({ feature, requiredPlan, color }: { feature:string; requiredPlan:string; color:string }) {
  const prices: Record<string,string> = { grow:'$89/mo', scale:'$179/mo', agency:'$349/mo' }
  const feats: Record<string,string[]> = {
    grow:   ['Image generation','Email sequences','Webhooks','1,500 credits/mo'],
    scale:  ['Video generation','Voice generation','Competitor analysis','5,000 credits/mo'],
    agency: ['Client workspaces','Agency dashboard','All AI models','15,000 credits/mo'],
  }
  const label = requiredPlan.charAt(0).toUpperCase()+requiredPlan.slice(1)
  return (
    <div style={{ padding:'40px 24px',display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center' }}>
      <div style={{ width:56,height:56,borderRadius:16,background:color+'10',border:'1px solid '+color+'25',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      </div>
      <div style={{ fontFamily:'var(--display)',fontSize:18,fontWeight:800,letterSpacing:'-0.03em',color:'rgba(255,255,255,0.88)',marginBottom:8 }}>
        {feature} - {label} plan
      </div>
      <div style={{ fontSize:13,color:'rgba(255,255,255,0.4)',lineHeight:1.7,marginBottom:24,maxWidth:320 }}>
        Unlock {feature.toLowerCase()} on the {label} plan.
      </div>
      <div style={{ display:'flex',flexDirection:'column',gap:8,marginBottom:28,alignSelf:'stretch',maxWidth:300 }}>
        {(feats[requiredPlan]||[]).map((f,i) => (
          <div key={i} style={{ display:'flex',alignItems:'center',gap:9,textAlign:'left' }}>
            <div style={{ width:16,height:16,borderRadius:'50%',background:color+'15',border:'1px solid '+color+'30',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <span style={{ fontSize:12,color:'rgba(255,255,255,0.6)' }}>{f}</span>
          </div>
        ))}
      </div>
      <a href="/dashboard/settings?tab=billing"
        style={{ display:'flex',alignItems:'center',gap:8,padding:'12px 28px',background:color,borderRadius:12,fontSize:13,fontWeight:700,color:'#000',textDecoration:'none',boxShadow:'0 4px 20px '+color+'30' }}>
        Upgrade to {label} - {prices[requiredPlan]}
      </a>
      <div style={{ fontSize:11,color:'rgba(255,255,255,0.25)',marginTop:12 }}>Cancel anytime</div>
    </div>
  )
}

function StudioInner() {
  const supabase     = createClient()
  const searchParams = useSearchParams()
  const router       = useRouter()
  const startRef     = useRef<HTMLInputElement>(null)
  const endRef       = useRef<HTMLInputElement>(null)
  const imgRef       = useRef<HTMLInputElement>(null)

  const [ws,             setWs]             = useState<any>(null)
  const [creditBalance,  setCreditBalance]  = useState<number>(9999)
  const [tab,            setTab]            = useState<Tab>('pipeline')
  const [recent,         setRecent]         = useState<any[]>([])
  const [mounted,        setMounted]        = useState(false)
  const [todayAngle,     setTodayAngle]     = useState<TodayAngle|null>(null)
  const [strategyAngles, setStrategyAngles] = useState<string[]>([])
  const [planAccess,     setPlanAccess]     = useState({ image:false, video:false, voice:false })
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
  const [iPrompt,  setIPrompt]  = useState('')
  const [iStyle,   setIStyle]   = useState('photorealistic')
  const [iRatio,   setIRatio]   = useState('1:1')
  const [iGen,     setIGen]     = useState(false)
  const [iResult,  setIResult]  = useState<string|null>(null)
  const [iErr,     setIErr]     = useState<string|null>(null)
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
  const [vResult,  setVResult]  = useState<string|null>(null)
  const [vProg,    setVProg]    = useState(0)
  const [vConfirm, setVConfirm] = useState(false)
  const [vErr,     setVErr]     = useState<string|null>(null)
  const [vxText,   setVxText]   = useState('')
  const [vxId,      setVxId]      = useState('rachel')
  const [stab,      setStab]      = useState(0.5)
  const [vxGen,     setVxGen]     = useState(false)
  const [vxResult,  setVxResult]  = useState<string|null>(null)
  const [vxErr,     setVxErr]     = useState<string|null>(null)
  const [vxConfirm, setVxConfirm] = useState(false)

  // ── Pipeline state ──
  const [pipelineCopy,         setPipelineCopy]         = useState('')
  const [pipelineFormat,       setPipelineFormat]       = useState<PipelineFormat|null>(null)
  const [pipelineAsset,        setPipelineAsset]        = useState<string|null>(null)
  const [pipelineAssetId,      setPipelineAssetId]      = useState<string|null>(null)
  const [pipelineStage,        setPipelineStage]        = useState<1|2|3|4>(1)
  const [strategyDayId,        setStrategyDayId]        = useState<string|null>(null)
  const [pipePlat,             setPipePlat]             = useState<Platform>('instagram')
  const [pipelineScheduleTime, setPipelineScheduleTime] = useState('')
  const [pipelineGenning,      setPipelineGenning]      = useState(false)
  const [pipeSched,            setPipeSched]            = useState(false)
  const [pipelineScheduled,    setPipelineScheduled]    = useState(false)
  const [pipelineErr,          setPipelineErr]          = useState<string|null>(null)
  const [pipelineImgPrompt,    setPipelineImgPrompt]    = useState('')
  const [pipelineImgStyle,     setPipelineImgStyle]     = useState('photorealistic')
  const [pipelineVidPrompt,    setPipelineVidPrompt]    = useState('')
  const [pipelineVidDur,       setPipelineVidDur]       = useState(5)
  const [pipelineVoiceId,      setPipelineVoiceId]      = useState('rachel')
  const [pipelineSlideCount,   setPipelineSlideCount]   = useState(5)

  useEffect(() => {
    setMounted(true)
    loadWs()
    const q       = searchParams.get('q')
    const angle   = searchParams.get('angle')
    const dayId   = searchParams.get('strategy_day')
    const fmt     = searchParams.get('format') as PipelineFormat | null
    if (q) setPrompt(decodeURIComponent(q))
    if (angle) {
      setPipelineCopy(decodeURIComponent(angle))
      setTab('pipeline')
      if (fmt) { setPipelineFormat(fmt); setPipelineStage(fmt === 'post' ? 4 : 3) } else { setPipelineStage(2) }
    }
    if (dayId) setStrategyDayId(dayId)
  }, [])

  async function loadWs() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return
    const { data:m } = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id',user.id).limit(1).single()
    const w = (m as any)?.workspaces
    setWs(w)
    if (w?.id) {
      const { data: cr } = await supabase.from('credits').select('balance').eq('workspace_id', w.id).single()
      if (cr?.balance !== undefined) setCreditBalance(cr.balance)
    }
    const plan   = w?.plan ?? 'spark'
    const status = w?.plan_status ?? 'trialing'
    const isTrial = status === 'trialing'
    const trialExpired = isTrial && (new Date() > new Date(new Date(w?.created_at).getTime()+7*86400000))
    setPlanAccess({
      image: ['grow','scale','agency'].includes(plan)||(isTrial&&!trialExpired),
      video: ['scale','agency'].includes(plan)||(isTrial&&!trialExpired),
      voice: ['scale','agency'].includes(plan)||(isTrial&&!trialExpired),
    })
    loadRecent(w?.id)
    loadTodayStrategy(w?.id)
    supabase.channel('studio-rt')
      .on('postgres_changes',{ event:'*',schema:'public',table:'content',filter:'workspace_id=eq.'+w?.id },()=>loadRecent(w?.id))
      .subscribe()
  }

  async function loadTodayStrategy(wsId: string) {
    if (!wsId) return
    try {
      const { data:plan } = await supabase.from('strategy_plans').select('content_pillars,platform_strategy,insights,daily_plan').eq('workspace_id',wsId).eq('status','active').order('generated_at',{ascending:false}).limit(1).single()
      if (!plan) return
      const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
      const todayPlan = (plan.platform_strategy as any)?.[days[new Date().getDay()]]
      const topAngle  = (plan.insights as any)?.top_angles?.[0]
      if (todayPlan||topAngle) {
        setTodayAngle({
          angle:    topAngle?.angle||todayPlan?.angle||'Build authority through contrast',
          platform: todayPlan?.platform||'linkedin',
          type:     todayPlan?.type||'post',
          hook:     topAngle?.example_hook||'',
          pillar:   (plan.content_pillars as any)?.[0]?.name||'',
        })
      }
      const allAngles = ((plan.insights as any)?.top_angles||[]).map((a:any)=>a.example_hook||a.angle).filter(Boolean).slice(0,6)
      if (allAngles.length > 0) setStrategyAngles(allAngles)
    } catch { /* ignore */ }
  }

  async function loadRecent(id: string) {
    if (!id) return
    const { data } = await supabase.from('content').select('*').eq('workspace_id',id).order('created_at',{ascending:false}).limit(18)
    setRecent(data??[])
  }

  async function generateCopy() {
    if (!prompt.trim()||genning) return
    setGenning(true); setResult(null); setCopyErr(null); setSched(false); setCopied(false)
    try {
      const r = await fetch('/api/generate-content',{ method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ workspace_id:ws?.id,type:fmt,platform:plat,prompt:prompt.trim() }) })
      const d = await r.json()
      if (!r.ok) { setCopyErr(r.status===402?d.message:(d.error??'Generation failed')); setGenning(false); return }
      setResult(d.content); setResultId(d.content_id); setCrUsed(d.credits_used)
    } catch { setCopyErr('Something went wrong. Try again.') }
    setGenning(false)
  }

  async function generateImage() {
    if (!iPrompt.trim()||iGen) return
    setIGen(true); setIResult(null); setIErr(null)
    try {
      const r = await fetch('/api/generate-image',{ method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ workspace_id:ws?.id,prompt:iPrompt.trim(),style:iStyle,aspect_ratio:iRatio }) })
      const d = await r.json()
      if (!r.ok) { setIErr(r.status===402?d.message:(d.error??'Failed')); setIGen(false); return }
      setIResult(d.image_url)
    } catch { setIErr('Something went wrong.') }
    setIGen(false)
  }

  async function generateVideo() {
    if (!vPrompt.trim()||vGen) return
    if (creditBalance < 20) { setVErr('Insufficient credits. Video generation costs 20 credits.'); return }
    setVGen(true); setVResult(null); setVErr(null); setVProg(0)
    const iv = setInterval(()=>setVProg(p=>p<88?+(p+Math.random()*4).toFixed(1):p),4000)
    try {
      const body:any = { workspace_id:ws?.id,prompt:vPrompt.trim(),style:vStyle.toLowerCase(),duration:vDur,aspect_ratio:vRatio,motion_strength:motion }
      if (vMode==='image'&&vImg) body.image_url = vImg
      if (vMode==='frame') { body.start_frame_url=startUrl; body.end_frame_url=endUrl }
      const r = await fetch('/api/generate-video',{ method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body) })
      const d = await r.json()
      clearInterval(iv)
      if (!r.ok) { setVErr(r.status===402?d.message:(d.error??'Failed')); setVGen(false); return }
      setVProg(100); setVResult(d.video_url)
    } catch { clearInterval(iv); setVErr('Something went wrong.') }
    setVGen(false)
  }

  async function generateVoice() {
    if (!vxText.trim()||vxGen) return
    if (creditBalance < 8) { setVxErr('Insufficient credits. Voice generation costs 8 credits.'); return }
    setVxGen(true); setVxResult(null); setVxErr(null)
    try {
      const r = await fetch('/api/generate-voice',{ method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ workspace_id:ws?.id,text:vxText.trim(),voice_id:vxId,stability:stab }) })
      const d = await r.json()
      if (!r.ok) { setVxErr(r.status===402?d.message:(d.error??'Failed')); setVxGen(false); return }
      setVxResult(d.audio_url)
    } catch { setVxErr('Something went wrong.') }
    setVxGen(false)
  }

  // ─────────────── Pipeline functions ───────────────
  async function generatePipelineCopy() {
    if (!pipelineCopy.trim() || pipelineGenning) return
    setPipelineGenning(true); setPipelineErr(null)
    try {
      const r = await fetch('/api/generate-content', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ workspace_id:ws?.id, type:'post', platform:pipePlat, prompt:pipelineCopy.trim() }) })
      const d = await r.json()
      if (r.ok) setPipelineCopy(d.content)
      else setPipelineErr(d.message || d.error || 'Generation failed')
    } catch { setPipelineErr('Something went wrong.') }
    setPipelineGenning(false)
  }

  async function generatePipelineImage() {
    if (!pipelineImgPrompt.trim() || pipelineGenning) return
    setPipelineGenning(true); setPipelineErr(null)
    try {
      const r = await fetch('/api/generate-image', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ workspace_id:ws?.id, prompt:pipelineImgPrompt, style:pipelineImgStyle, aspect_ratio:'4:5' }) })
      const d = await r.json()
      if (!r.ok) { setPipelineErr(r.status===402?d.message:(d.error||'Failed')); setPipelineGenning(false); return }
      setPipelineAsset(d.image_url); setPipelineAssetId(d.content_id); setPipelineStage(4)
    } catch { setPipelineErr('Something went wrong.') }
    setPipelineGenning(false)
  }

  async function generatePipelineCarousel() {
    if (!pipelineCopy.trim() || pipelineGenning) return
    setPipelineGenning(true); setPipelineErr(null)
    try {
      const r = await fetch('/api/generate-content', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ workspace_id:ws?.id, type:'post', platform:pipePlat, prompt:`Create a ${pipelineSlideCount}-slide carousel from this copy. Format each slide as "Slide N: [text]". Make each a standalone insight. Last slide = CTA. Copy: ${pipelineCopy}` }) })
      const d = await r.json()
      if (!r.ok) { setPipelineErr(d.message||'Failed'); setPipelineGenning(false); return }
      setPipelineAsset(d.content); setPipelineStage(4)
    } catch { setPipelineErr('Something went wrong.') }
    setPipelineGenning(false)
  }

  async function generatePipelineVideo() {
    if (!pipelineVidPrompt.trim() || pipelineGenning) return
    if (creditBalance < 20) { setPipelineErr('Insufficient credits. Video generation costs 20 credits.'); return }
    setPipelineGenning(true); setPipelineErr(null)
    try {
      const r = await fetch('/api/generate-video', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ workspace_id:ws?.id, prompt:pipelineVidPrompt, style:'cinematic', duration:pipelineVidDur, aspect_ratio:'9:16' }) })
      const d = await r.json()
      if (!r.ok) { setPipelineErr(r.status===402?d.message:(d.error||'Failed')); setPipelineGenning(false); return }
      setPipelineAsset(d.video_url); setPipelineAssetId(d.content_id); setPipelineStage(4)
    } catch { setPipelineErr('Something went wrong.') }
    setPipelineGenning(false)
  }

  async function generatePipelineVoice() {
    if (!pipelineCopy.trim() || pipelineGenning) return
    if (creditBalance < 8) { setPipelineErr('Insufficient credits. Voice generation costs 8 credits.'); return }
    setPipelineGenning(true); setPipelineErr(null)
    try {
      const r = await fetch('/api/generate-voice', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ workspace_id:ws?.id, text:pipelineCopy, voice_id:pipelineVoiceId, stability:0.5 }) })
      const d = await r.json()
      if (!r.ok) { setPipelineErr(r.status===402?d.message:(d.error||'Failed')); setPipelineGenning(false); return }
      setPipelineAsset(d.audio_url); setPipelineAssetId(d.content_id); setPipelineStage(4)
    } catch { setPipelineErr('Something went wrong.') }
    setPipelineGenning(false)
  }

  async function schedulePipelinePost() {
    if (!pipelineScheduleTime || pipeSched) return
    setPipeSched(true); setPipelineErr(null)
    try {
      const r = await fetch('/api/schedule-post', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({
        workspace_id: ws?.id,
        content_id:   pipelineAssetId || undefined,
        platform:     pipePlat,
        scheduled_for: new Date(pipelineScheduleTime).toISOString(),
        body:          pipelineCopy,
        type:          pipelineFormat === 'reel' ? 'video' : pipelineFormat === 'voice' ? 'voice' : 'post',
        strategy_day_id: strategyDayId || undefined,
      }) })
      if (r.ok) setPipelineScheduled(true)
      else { const d = await r.json(); setPipelineErr(d.message||'Failed to schedule') }
    } catch { setPipelineErr('Something went wrong.') }
    setPipeSched(false)
  }
  // ─────────────────────────────────────────────────

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(true); setTimeout(()=>setCopied(false),2000)
  }

  async function schedulePost() {
    if (!resultId||!ws?.id) return
    const t = new Date(); t.setDate(t.getDate()+1); t.setHours(9,0,0,0)
    try {
      const r = await fetch('/api/schedule-post',{ method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ workspace_id:ws.id,content_id:resultId,platform:plat,scheduled_for:t.toISOString() }) })
      if (r.ok) { setSched(true) } else { const d=await r.json(); if (r.status===402) setCopyErr(d.message) }
    } catch { /* ignore */ }
  }

  function uploadFile(file: File, set: (u:string)=>void) {
    const reader = new FileReader()
    reader.onload = e => set(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const selFmt   = FORMATS.find(f=>f.id===fmt)!
  const hasBrand  = !!(ws?.brand_voice)
  const voiceStr  = hasBrand ? ('Writing in your voice - '+(ws.brand_voice.length > 55 ? ws.brand_voice.slice(0,55)+'...' : ws.brand_voice)) : 'Train Brand Brain first for outputs that actually sound like you.'

  return (
    <div style={{ display:'grid',gridTemplateColumns:'1fr 252px',height:'calc(100vh - var(--topbar-h))',overflow:'hidden' }}>

      <div style={{ overflowY:'auto',padding:'28px 32px 48px',borderRight:'1px solid rgba(255,255,255,0.05)' }}>

        <div style={{ marginBottom:24,opacity:mounted?1:0,transform:mounted?'translateY(0)':'translateY(12px)',transition:'opacity 0.45s ease, transform 0.45s ease' }}>
          <h1 style={{ fontFamily:'var(--display)',fontSize:22,fontWeight:800,letterSpacing:'-0.03em',color:'rgba(255,255,255,0.92)',lineHeight:1,marginBottom:5 }}>Studio</h1>
          <p style={{ fontSize:12,color:'rgba(255,255,255,0.3)',lineHeight:1.5 }}>
              {hasBrand
                ? <span style={{display:'flex',alignItems:'center',gap:6}}><span style={{display:'inline-block',width:6,height:6,borderRadius:'50%',background:'#34D399',boxShadow:'0 0 6px #34D399',flexShrink:0}}/>{voiceStr}</span>
                : <span>{voiceStr} <a href="/dashboard/brand" style={{color:'#34D399',fontWeight:700,textDecoration:'none'}}>Train Brand Brain →</a></span>
              }
            </p>
        </div>

        {todayAngle && tab === 'copy' && (
          <div onClick={()=>{ setPrompt(todayAngle.hook||todayAngle.angle); if(todayAngle.platform) setPlat(todayAngle.platform as Platform) }}
            style={{ marginBottom:20,padding:'12px 16px',background:'linear-gradient(135deg,rgba(77,159,255,0.08) 0%,rgba(77,159,255,0.04) 100%)',border:'1px solid rgba(77,159,255,0.2)',borderRadius:13,cursor:'pointer' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:5 }}>
              <div style={{ display:'flex',alignItems:'center',gap:7 }}>
                <div style={{ width:5,height:5,borderRadius:'50%',background:'#4D9FFF' }}/>
                <span style={{ fontSize:9,fontWeight:700,color:'#4D9FFF',letterSpacing:'0.09em',textTransform:'uppercase' }}>Strategy - Today&apos;s angle</span>
                {todayAngle.pillar && <span style={{ fontSize:9,color:'rgba(255,255,255,0.28)',fontWeight:500 }}>- {todayAngle.pillar}</span>}
              </div>
              <span style={{ fontSize:10,color:'rgba(77,159,255,0.55)' }}>Click to use</span>
            </div>
            <div style={{ fontSize:13,fontWeight:600,color:'rgba(255,255,255,0.82)',lineHeight:1.5 }}>{todayAngle.angle}</div>
            {todayAngle.hook && <div style={{ fontSize:11.5,color:'rgba(255,255,255,0.42)',marginTop:5,fontStyle:'italic' }}>Hook: {todayAngle.hook}</div>}
          </div>
        )}

        <div style={{ marginBottom:28,opacity:mounted?1:0,transform:mounted?'translateY(0)':'translateY(12px)',transition:'opacity 0.45s ease 0.06s, transform 0.45s ease 0.06s' }}>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:5,padding:4,background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16 }}>
            {TABS.map(t => {
              const active = tab===t.id
              const locked = !!(t.requiredPlan && !planAccess[t.id as 'image'|'video'|'voice'])
              const tbg = active?'var(--bg3)':'transparent'
              const tbd = '1px solid '+(active?'var(--line2)':'transparent')
              const tcl = active?'var(--t1)':(locked?'rgba(255,255,255,0.18)':'rgba(255,255,255,0.3)')
              return (
                <button key={t.id} onClick={()=>setTab(t.id)}
                  style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:3,padding:'11px 6px',borderRadius:12,background:tbg,border:tbd,color:tcl,cursor:'pointer',fontFamily:'var(--sans)',transition:'all 0.16s',opacity:locked?0.7:1 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                    <span style={{ display:'flex',opacity:active?1:0.6 }}>{t.icon}</span>
                    <span style={{ fontSize:13,fontWeight:600,fontFamily:'var(--display)' }}>{t.label}</span>
                    {locked && <span style={{ display:'flex' }}>{Ic.lock}</span>}
                  </div>
                  <span style={{ fontSize:9.5,color:active?t.color+'80':'rgba(255,255,255,0.2)',fontWeight:500 }}>{t.sub}</span>
                </button>
              )
            })}
          </div>
        </div>

        {tab === 'pipeline' && (
          <div style={{ width:'100%', animation:'pageUp 0.3s ease both' }}>
            {/* Stage indicators */}
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:28 }}>
              {(['Copy','Format','Asset','Schedule'] as const).map((label, i) => {
                const s = (i + 1) as 1|2|3|4
                const done = pipelineStage > s
                const cur  = pipelineStage === s
                return (
                  <div key={s} style={{ display:'flex', alignItems:'center', gap:6, flex: i < 3 ? 1 : 'none' }}>
                    <div onClick={() => done && setPipelineStage(s)}
                      style={{ width:26, height:26, borderRadius:'50%', flexShrink:0,
                        background: cur ? '#4D9FFF' : done ? 'rgba(77,159,255,0.25)' : 'rgba(255,255,255,0.06)',
                        border: cur ? 'none' : done ? '1px solid rgba(77,159,255,0.4)' : '1px solid rgba(255,255,255,0.1)',
                        color: cur ? '#000' : done ? '#4D9FFF' : 'rgba(255,255,255,0.25)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:10, fontWeight:700, cursor: done ? 'pointer' : 'default', transition:'all 0.2s',
                      }}>{done ? '✓' : s}</div>
                    <span style={{ fontSize:10, fontWeight:600, color: cur ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)', letterSpacing:'0.02em' }}>{label}</span>
                    {i < 3 && <div style={{ flex:1, height:1, background: done ? 'rgba(77,159,255,0.3)' : 'rgba(255,255,255,0.07)', marginLeft:4 }}/>}
                  </div>
                )
              })}
            </div>

            {/* ── Stage 1: Copy ── */}
            {pipelineStage === 1 && (
              <div>
                {strategyDayId && (
                  <div style={{ marginBottom:16, padding:'10px 14px', background:'rgba(77,159,255,0.06)', border:'1px solid rgba(77,159,255,0.2)', borderRadius:10, fontSize:12, color:'rgba(77,159,255,0.75)' }}>
                    Strategy Day {strategyDayId} — write content for this angle
                  </div>
                )}
                <div style={{ marginBottom:18 }}>
                  <SLabel>Platform</SLabel>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {PLATFORMS.map(p => <PlatPill key={p.id} p={p} active={pipePlat===p.id} onClick={() => setPipePlat(p.id)}/>)}
                  </div>
                </div>
                <div style={{ marginBottom:18 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:9 }}>
                    <SLabel>Copy / Script</SLabel>
                    <span style={{ fontSize:10, color:'rgba(255,255,255,0.18)' }}>Type your own or generate below</span>
                  </div>
                  <Textarea value={pipelineCopy} onChange={setPipelineCopy} rows={7} placeholder="Give Nexa a direction, paste your draft, or enter your script. This becomes the foundation for everything."/>
                </div>
                <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:18 }}>
                  {(strategyAngles.length > 0 ? strategyAngles : ANGLES).map((a,i) => (
                    <button key={i} onClick={() => setPipelineCopy(a)}
                      style={{ padding:'4px 10px', borderRadius:100, fontSize:11, background:'transparent', border:'1px solid rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.22)', cursor:'pointer', fontFamily:'var(--sans)', transition:'all 0.18s' }}>
                      {a.length > 48 ? a.slice(0,48)+'...' : a}
                    </button>
                  ))}
                </div>
                <GenBtn active={!!pipelineCopy.trim()} loading={pipelineGenning} label="Generate with Brand Brain" loadingLabel="Writing in your brand voice..." onClick={generatePipelineCopy} color="#4D9FFF"/>
                {pipelineErr && <ErrBanner msg={pipelineErr}/>}
                {pipelineCopy.trim() && !pipelineGenning && (
                  <button onClick={() => setPipelineStage(2)}
                    style={{ marginTop:12, width:'100%', padding:'14px', borderRadius:13, background:'rgba(77,159,255,0.06)', border:'1px solid rgba(77,159,255,0.2)', color:'#4D9FFF', cursor:'pointer', fontFamily:'var(--sans)', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.18s' }}>
                    Continue — choose format →
                  </button>
                )}
              </div>
            )}

            {/* ── Stage 2: Format chooser ── */}
            {pipelineStage === 2 && (
              <div>
                <div style={{ marginBottom:18, padding:'14px 16px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12 }}>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginBottom:6, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Your copy</div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.72)', lineHeight:1.6, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical' as const }}>{pipelineCopy}</div>
                  <button onClick={() => setPipelineStage(1)} style={{ fontSize:11, color:'rgba(77,159,255,0.6)', background:'none', border:'none', cursor:'pointer', padding:'6px 0 0', fontFamily:'var(--sans)' }}>Edit copy</button>
                </div>
                <SLabel>Choose your format</SLabel>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {([
                    { id:'post'     as PipelineFormat, label:'Post only',   emoji:'📝', cost:'Ready to schedule',  desc:'Schedule the copy directly to any platform' },
                    { id:'image'    as PipelineFormat, label:'+ Image',      emoji:'🖼', cost:'+5 credits',         desc:'AI-generated brand visual paired with copy' },
                    { id:'carousel' as PipelineFormat, label:'+ Carousel',   emoji:'🎠', cost:'+credits by slides', desc:'Multi-slide breakdown of your copy' },
                    { id:'reel'     as PipelineFormat, label:'→ Reel',       emoji:'🎬', cost:'+20 credits',        desc:'Cinematic video generated from the copy' },
                    { id:'voice'    as PipelineFormat, label:'🎙 Voiceover', emoji:'🎙', cost:'+8 credits',         desc:'Professional narration of the copy' },
                  ] as const).map(f => {
                    const active = pipelineFormat === f.id
                    return (
                      <div key={f.id}
                        onClick={() => { setPipelineFormat(f.id); setPipelineAsset(null); setPipelineAssetId(null); setPipelineErr(null); setPipelineScheduled(false); if (f.id === 'image') setPipelineImgPrompt(pipelineCopy.slice(0,200)); if (f.id === 'reel') setPipelineVidPrompt(pipelineCopy.slice(0,200)); if (f.id === 'post') setPipelineStage(4); else setPipelineStage(3) }}
                        style={{ padding:'18px 16px', borderRadius:14, background: active ? 'rgba(77,159,255,0.08)' : 'rgba(255,255,255,0.025)', border: `1px solid ${active ? 'rgba(77,159,255,0.3)' : 'rgba(255,255,255,0.07)'}`, cursor:'pointer', transition:'all 0.15s', gridColumn: f.id === 'post' ? 'span 2' : 'span 1' }}>
                        <div style={{ fontSize:22, marginBottom:8 }}>{f.emoji}</div>
                        <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.88)', marginBottom:4, letterSpacing:'-0.01em' }}>{f.label}</div>
                        <div style={{ fontSize:11, color:'rgba(255,255,255,0.33)', marginBottom:5, lineHeight:1.5 }}>{f.desc}</div>
                        <div style={{ fontSize:10, fontWeight:600, color: active ? '#4D9FFF' : 'rgba(255,255,255,0.2)' }}>{f.cost}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Stage 3: Asset generation ── */}
            {pipelineStage === 3 && (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:22 }}>
                  <button onClick={() => setPipelineStage(2)} style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 12px', borderRadius:8, fontSize:11, fontWeight:600, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontFamily:'var(--sans)' }}>← Back</button>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>
                    {pipelineFormat === 'image' && 'Generate a brand image'}
                    {pipelineFormat === 'carousel' && 'Build your carousel'}
                    {pipelineFormat === 'reel' && 'Generate a cinematic reel'}
                    {pipelineFormat === 'voice' && 'Generate a voiceover'}
                  </span>
                </div>

                {pipelineFormat === 'image' && <>
                  <ProvBadge name="Nexa Visuals" desc="Brand-accurate AI image generation" color="#A78BFA"/>
                  {!planAccess.image ? <UpgradeGate feature="Image generation" requiredPlan="grow" color="#A78BFA"/> : <>
                    <div style={{ marginBottom:18 }}>
                      <SLabel>Visual direction</SLabel>
                      <Textarea value={pipelineImgPrompt} onChange={setPipelineImgPrompt} rows={4} placeholder="Describe the visual — Nexa enhances it cinematically."/>
                    </div>
                    <div style={{ marginBottom:22 }}>
                      <SLabel>Style</SLabel>
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                        {IMG_STYLES.map((s,i) => <Pill key={s} label={s} active={pipelineImgStyle===IMG_IDS[i]} onClick={() => setPipelineImgStyle(IMG_IDS[i])} color="#A78BFA"/>)}
                      </div>
                    </div>
                    <GenBtn active={!!pipelineImgPrompt.trim()} loading={pipelineGenning} label="Generate image — 5 credits" loadingLabel="Generating your image..." onClick={generatePipelineImage} color="#A78BFA"/>
                  </>}
                </>}

                {pipelineFormat === 'carousel' && <>
                  <div style={{ marginBottom:18 }}>
                    <SLabel>Number of slides</SLabel>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {[3,5,7,10].map(n => (
                        <button key={n} onClick={() => setPipelineSlideCount(n)}
                          style={{ padding:'8px 18px', borderRadius:100, fontSize:13, fontWeight:600, background:pipelineSlideCount===n?'rgba(167,139,250,0.12)':'rgba(255,255,255,0.04)', border:`1px solid ${pipelineSlideCount===n?'rgba(167,139,250,0.3)':'rgba(255,255,255,0.08)'}`, color:pipelineSlideCount===n?'#A78BFA':'rgba(255,255,255,0.4)', cursor:'pointer', fontFamily:'var(--sans)', transition:'all 0.14s' }}>
                          {n} slides
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom:14, padding:'12px 16px', background:'rgba(167,139,250,0.05)', border:'1px solid rgba(167,139,250,0.12)', borderRadius:10, fontSize:12, color:'rgba(255,255,255,0.38)', lineHeight:1.65 }}>
                    Nexa splits your copy into {pipelineSlideCount} carousel slides — hook, insights, and CTA — in your exact brand voice.
                  </div>
                  <GenBtn active={!!pipelineCopy.trim()} loading={pipelineGenning} label={`Generate ${pipelineSlideCount} slides — ${pipelineSlideCount * 2} credits`} loadingLabel="Building carousel..." onClick={generatePipelineCarousel} color="#A78BFA"/>
                </>}

                {pipelineFormat === 'reel' && <>
                  <ProvBadge name="Nexa Video" desc="Cinematic AI video generation" color="#FF7A40"/>
                  {!planAccess.video ? <UpgradeGate feature="Video generation" requiredPlan="scale" color="#FF7A40"/> : <>
                    <div style={{ marginBottom:18 }}>
                      <SLabel>Scene description</SLabel>
                      <Textarea value={pipelineVidPrompt} onChange={setPipelineVidPrompt} rows={4} placeholder="Describe the scene — Nexa will direct it cinematically."/>
                    </div>
                    <div style={{ marginBottom:18 }}>
                      <SLabel>Duration</SLabel>
                      <div style={{ display:'flex', gap:6 }}>
                        {[5,10].map(d => (
                          <button key={d} onClick={() => setPipelineVidDur(d)}
                            style={{ padding:'8px 18px', borderRadius:100, fontSize:13, fontWeight:600, background:pipelineVidDur===d?'rgba(255,122,64,0.12)':'rgba(255,255,255,0.04)', border:`1px solid ${pipelineVidDur===d?'rgba(255,122,64,0.3)':'rgba(255,255,255,0.08)'}`, color:pipelineVidDur===d?'#FF7A40':'rgba(255,255,255,0.4)', cursor:'pointer', fontFamily:'var(--sans)', transition:'all 0.14s' }}>
                            {d}s
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:6 }}>
                      <span style={{ fontSize:11, color: creditBalance < 20 ? '#FF5757' : 'rgba(255,255,255,0.28)', fontWeight:500 }}>
                        {creditBalance < 20 ? `⚠ Need 20 credits (have ${creditBalance})` : `20 credits · ${creditBalance} available`}
                      </span>
                    </div>
                    <GenBtn active={!!pipelineVidPrompt.trim()} loading={pipelineGenning} label="Generate reel — 20 credits" loadingLabel="Rendering your video..." onClick={generatePipelineVideo} color="#FF7A40"/>
                  </>}
                </>}

                {pipelineFormat === 'voice' && <>
                  <ProvBadge name="Nexa Voice" desc="Ultra-realistic AI voiceovers, indistinguishable from human speech" color="#34D399"/>
                  {!planAccess.voice ? <UpgradeGate feature="Voice generation" requiredPlan="scale" color="#34D399"/> : <>
                    <div style={{ marginBottom:22 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:9 }}>
                        <SLabel>Script</SLabel>
                        <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)' }}>{pipelineCopy.length} / 5,000</span>
                      </div>
                      <Textarea value={pipelineCopy} onChange={setPipelineCopy} rows={6} placeholder="Your script..."/>
                    </div>
                    <div style={{ marginBottom:22 }}>
                      <SLabel>Voice</SLabel>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))', gap:7 }}>
                        {VOICES.map(v => (
                          <button key={v.id} onClick={() => setPipelineVoiceId(v.id)}
                            style={{ padding:'11px 10px', borderRadius:11, background:pipelineVoiceId===v.id?'rgba(52,211,153,0.09)':'rgba(255,255,255,0.025)', border:'1px solid '+(pipelineVoiceId===v.id?'rgba(52,211,153,0.28)':'rgba(255,255,255,0.07)'), cursor:'pointer', fontFamily:'var(--sans)', textAlign:'left', transition:'all 0.15s' }}>
                            <div style={{ fontSize:12, fontWeight:700, color:pipelineVoiceId===v.id?'#34D399':'rgba(255,255,255,0.75)', marginBottom:2 }}>{v.name}</div>
                            <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)' }}>{v.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:6 }}>
                      <span style={{ fontSize:11, color: creditBalance < 8 ? '#FF5757' : 'rgba(255,255,255,0.28)', fontWeight:500 }}>
                        {creditBalance < 8 ? `⚠ Need 8 credits (have ${creditBalance})` : `8 credits · ${creditBalance} available`}
                      </span>
                    </div>
                    <GenBtn active={!!pipelineCopy.trim()} loading={pipelineGenning} label="Generate voiceover — 8 credits" loadingLabel="Rendering your voiceover..." onClick={generatePipelineVoice} color="#34D399"/>
                  </>}
                </>}

                {pipelineErr && <ErrBanner msg={pipelineErr}/>}
              </div>
            )}

            {/* ── Stage 4: Review + Schedule ── */}
            {pipelineStage === 4 && (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:22 }}>
                  <button onClick={() => setPipelineStage(pipelineFormat === 'post' ? 2 : 3)} style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 12px', borderRadius:8, fontSize:11, fontWeight:600, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontFamily:'var(--sans)' }}>← Back</button>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:'#34D399', boxShadow:'0 0 6px #34D399' }}/>
                  <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.55)' }}>Review & schedule</span>
                </div>

                {/* Copy preview */}
                <div style={{ marginBottom:16, padding:'18px 20px', background:'rgba(77,159,255,0.04)', border:'1px solid rgba(77,159,255,0.15)', borderRadius:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontSize:9, fontWeight:700, color:'rgba(77,159,255,0.7)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Copy</span>
                    <button onClick={() => setPipelineStage(1)} style={{ fontSize:11, color:'rgba(77,159,255,0.55)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--sans)' }}>Edit</button>
                  </div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.8)', lineHeight:1.7, whiteSpace:'pre-wrap', maxHeight:160, overflowY:'auto' }}>{pipelineCopy}</div>
                </div>

                {/* Asset preview */}
                {pipelineAsset && pipelineFormat === 'image' && (
                  <div style={{ marginBottom:16, borderRadius:14, overflow:'hidden', border:'1px solid rgba(167,139,250,0.2)' }}>
                    <img src={pipelineAsset} alt="Generated" style={{ width:'100%', display:'block', maxHeight:360, objectFit:'cover' }}/>
                  </div>
                )}
                {pipelineAsset && pipelineFormat === 'reel' && (
                  <div style={{ marginBottom:16, borderRadius:14, overflow:'hidden', border:'1px solid rgba(255,122,64,0.2)', background:'#000' }}>
                    <video src={pipelineAsset} controls style={{ width:'100%', display:'block', maxHeight:300 }}/>
                  </div>
                )}
                {pipelineAsset && pipelineFormat === 'voice' && (
                  <div style={{ marginBottom:16, padding:'18px 20px', background:'rgba(52,211,153,0.05)', border:'1px solid rgba(52,211,153,0.18)', borderRadius:14 }}>
                    <audio src={pipelineAsset} controls style={{ width:'100%' }}/>
                  </div>
                )}
                {pipelineAsset && pipelineFormat === 'carousel' && (
                  <div style={{ marginBottom:16, padding:'16px 18px', background:'rgba(167,139,250,0.04)', border:'1px solid rgba(167,139,250,0.15)', borderRadius:14 }}>
                    <div style={{ fontSize:9, fontWeight:700, color:'rgba(167,139,250,0.7)', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.08em' }}>Carousel slides</div>
                    <div style={{ fontSize:13, color:'rgba(255,255,255,0.72)', lineHeight:1.8, whiteSpace:'pre-wrap', maxHeight:220, overflowY:'auto' }}>{pipelineAsset}</div>
                  </div>
                )}

                {/* Schedule controls */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:18 }}>
                  <div>
                    <SLabel>Platform</SLabel>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {PLATFORMS.filter(p => p.id !== 'general' && p.id !== 'email').map(p => (
                        <PlatPill key={p.id} p={p} active={pipePlat===p.id} onClick={() => setPipePlat(p.id)}/>
                      ))}
                    </div>
                  </div>
                  <div>
                    <SLabel>Schedule for</SLabel>
                    <input
                      type="datetime-local"
                      value={pipelineScheduleTime}
                      onChange={e => setPipelineScheduleTime(e.target.value)}
                      style={{ width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, color:'rgba(255,255,255,0.85)', fontSize:12, fontFamily:'var(--sans)', outline:'none', boxSizing:'border-box' }}
                    />
                  </div>
                </div>

                {strategyDayId && (
                  <div style={{ marginBottom:14, padding:'10px 14px', background:'rgba(52,211,153,0.06)', border:'1px solid rgba(52,211,153,0.18)', borderRadius:10, fontSize:12, color:'rgba(52,211,153,0.75)' }}>
                    ✓ Linked to Day {strategyDayId} of your strategy — will mark complete when scheduled
                  </div>
                )}

                <GenBtn active={!!pipelineScheduleTime && !pipelineScheduled} loading={pipeSched} label="Schedule post — 1 credit" loadingLabel="Scheduling..." onClick={schedulePipelinePost} color="#34D399"/>
                {pipelineErr && <ErrBanner msg={pipelineErr}/>}

                {pipelineScheduled && (
                  <div style={{ marginTop:14, padding:'16px 18px', background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.22)', borderRadius:13 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#34D399', marginBottom:4 }}>Scheduled ✓</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:1.6 }}>
                      Your {pipelineFormat} has been added to the queue.{strategyDayId ? ` Day ${strategyDayId} marked complete in your strategy.` : ''}
                    </div>
                    <button onClick={() => { setPipelineStage(1); setPipelineCopy(''); setPipelineFormat(null); setPipelineAsset(null); setPipelineAssetId(null); setPipelineScheduled(false); setPipelineScheduleTime(''); setStrategyDayId(null) }}
                      style={{ marginTop:12, padding:'8px 18px', borderRadius:9, fontSize:12, fontWeight:700, background:'rgba(52,211,153,0.12)', border:'1px solid rgba(52,211,153,0.25)', color:'#34D399', cursor:'pointer', fontFamily:'var(--sans)' }}>
                      Create another →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'copy' && (
          <div style={{ width:'100%',animation:'pageUp 0.3s ease both' }}>
            <div style={{ marginBottom:22 }}>
              <SLabel>Format</SLabel>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:7 }}>
                {FORMATS.map(f=><FormatBtn key={f.id} f={f} active={fmt===f.id} onClick={()=>setFmt(f.id)} color="#4D9FFF"/>)}
              </div>
            </div>
            <div style={{ marginBottom:22 }}>
              <SLabel>Platform</SLabel>
              <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
                {PLATFORMS.map(p=><PlatPill key={p.id} p={p} active={plat===p.id} onClick={()=>setPlat(p.id)}/>)}
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:9 }}>
                <SLabel>Direction</SLabel>
                <span style={{ fontSize:10,color:'rgba(255,255,255,0.18)' }}>Enter to generate</span>
              </div>
              <Textarea value={prompt} onChange={setPrompt} rows={5} placeholder="Give Nexa a direction or angle. Be specific - Nexa will handle the craft."/>
            </div>
            <div style={{ display:'flex',gap:5,flexWrap:'wrap',marginBottom:22 }}>
              {(strategyAngles.length > 0 ? strategyAngles : ANGLES).map((a,i)=>(
                <button key={i} onClick={()=>setPrompt(a)}
                  style={{ padding:'4px 10px',borderRadius:100,fontSize:11,background:'transparent',border:'1px solid rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.22)',cursor:'pointer',fontFamily:'var(--sans)',transition:'all 0.18s' }}>
                  {a.length > 48 ? a.slice(0,48)+'...' : a}
                </button>
              ))}
            </div>
            <GenBtn active={!!prompt.trim()} loading={genning} label={'Write '+selFmt.label+' - '+selFmt.cost+' credits'} loadingLabel="Writing in your brand voice..." onClick={generateCopy} color="#4D9FFF"/>
            {copyErr && <ErrBanner msg={copyErr}/>}
            {result && (
              <div style={{ marginTop:22,animation:'pageUp 0.35s ease both' }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:11 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:7 }}>
                    <div style={{ width:6,height:6,borderRadius:'50%',background:'#4D9FFF',boxShadow:'0 0 7px #4D9FFF' }}/>
                    <span style={{ fontSize:11.5,fontWeight:600,color:'rgba(255,255,255,0.42)' }}>{selFmt.label} - {crUsed} credits used</span>
                  </div>
                  <div style={{ display:'flex',gap:5 }}>
                    <ActBtn icon={copied?Ic.check:Ic.clone} label={copied?'Copied':'Copy'} onClick={()=>copyText(result!)} active={copied} color="#4D9FFF"/>
                    <ActBtn icon={Ic.redo} label="Rewrite" onClick={generateCopy}/>
                    <ActBtn icon={Ic.mic} label="Narrate" onClick={()=>{ setVxText(result!); setTab('voice') }} color="#34D399"/>
                    <ActBtn icon={sched?Ic.check:Ic.cal} label={sched?'Queued':'Schedule'} onClick={schedulePost} active={sched} color="#FFB547"/>
                  </div>
                </div>
                <div className="nexa-card" style={{ padding:'26px 28px',background:'linear-gradient(160deg,rgba(77,159,255,0.07) 0%,rgba(0,0,0,0.4) 100%)',border:'1px solid rgba(77,159,255,0.2)',borderRadius:18,fontSize:15,color:'rgba(255,255,255,0.9)',lineHeight:1.8,whiteSpace:'pre-wrap',letterSpacing:'-0.015em',position:'relative',overflow:'hidden',fontFamily:'var(--serif)' }}>
                  {result}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'image' && (
          <div style={{ width:'100%',animation:'pageUp 0.3s ease both' }}>
            {!planAccess.image && <UpgradeGate feature="Image generation" requiredPlan="grow" color="#A78BFA"/>}
            {planAccess.image && (
              <div>
                <ProvBadge name="Nexa Visuals" desc="Brand-accurate AI image generation" color="#A78BFA"/>
                <div style={{ marginBottom:22 }}>
                  <SLabel>Describe your image</SLabel>
                  <Textarea value={iPrompt} onChange={setIPrompt} rows={4} placeholder="Be specific. A focused founder at a dark oak desk, morning light, premium editorial photography."/>
                </div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:22,marginBottom:26 }}>
                  <div>
                    <SLabel>Visual style</SLabel>
                    <div style={{ display:'flex',gap:5,flexWrap:'wrap' }}>
                      {IMG_STYLES.map((s,i)=><Pill key={s} label={s} active={iStyle===IMG_IDS[i]} onClick={()=>setIStyle(IMG_IDS[i])} color="#A78BFA"/>)}
                    </div>
                  </div>
                  <div>
                    <SLabel>Format</SLabel>
                    <div style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:6 }}>
                      {RATIOS.map(r=>{
                        const ra = iRatio===r.id
                        return (
                          <button key={r.id} onClick={()=>setIRatio(r.id)}
                            style={{ padding:'9px 6px',borderRadius:9,background:ra?'rgba(167,139,250,0.1)':'rgba(255,255,255,0.025)',border:'1px solid '+(ra?'rgba(167,139,250,0.28)':'rgba(255,255,255,0.07)'),color:ra?'#A78BFA':'rgba(255,255,255,0.4)',cursor:'pointer',fontFamily:'var(--sans)',textAlign:'center',transition:'all 0.15s' }}>
                            <div style={{ fontSize:12,fontWeight:700 }}>{r.l}</div>
                            <div style={{ fontSize:9.5,opacity:0.55 }}>{r.d}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <GenBtn active={!!iPrompt.trim()} loading={iGen} label="Generate image - 5 credits" loadingLabel="Generating your image..." onClick={generateImage} color="#A78BFA"/>
                {iErr && <ErrBanner msg={iErr}/>}
                {iResult && (
                  <div style={{ marginTop:22,animation:'pageUp 0.35s ease both' }}>
                    <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:11 }}>
                      <div style={{ display:'flex',alignItems:'center',gap:7 }}>
                        <div style={{ width:6,height:6,borderRadius:'50%',background:'#A78BFA',boxShadow:'0 0 7px #A78BFA' }}/>
                        <span style={{ fontSize:11.5,fontWeight:600,color:'rgba(255,255,255,0.42)' }}>Image - 5 credits used</span>
                      </div>
                      <div style={{ display:'flex',gap:5 }}>
                        <ActBtn icon={Ic.film} label="Animate" onClick={()=>{ setTab('video'); setVMode('image'); setVImg(iResult!) }} color="#FF7A40"/>
                        <a href={iResult} download={'nexa-'+Date.now()+'.jpg'} style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,fontSize:11,fontWeight:600,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.42)',textDecoration:'none' }}>{Ic.dl} Save</a>
                        <ActBtn icon={Ic.redo} label="Redo" onClick={generateImage}/>
                      </div>
                    </div>
                    <div style={{ borderRadius:18,overflow:'hidden',border:'1px solid rgba(167,139,250,0.2)',boxShadow:'0 20px 60px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.05)' }}>
                      <img src={iResult} alt="Generated" style={{ width:'100%',display:'block',maxHeight:560,objectFit:'cover' }}/>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'video' && (
          <div style={{ width:'100%',animation:'pageUp 0.3s ease both' }}>
            {!planAccess.video && <UpgradeGate feature="Video generation" requiredPlan="scale" color="#FF7A40"/>}
            {planAccess.video && (
              <div>
                <ProvBadge name="Nexa Video" desc="Cinematic AI video generation" color="#FF7A40"/>
                <div style={{ marginBottom:20 }}>
                  <SLabel>Mode</SLabel>
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7 }}>
                    {VID_MODES.map(m=>{
                      const ma = vMode===m.id
                      return (
                        <button key={m.id} onClick={()=>setVMode(m.id)}
                          style={{ padding:'12px 10px',borderRadius:11,background:ma?'rgba(255,122,64,0.1)':'rgba(255,255,255,0.025)',border:'1px solid '+(ma?'rgba(255,122,64,0.28)':'rgba(255,255,255,0.07)'),cursor:'pointer',fontFamily:'var(--sans)',textAlign:'left',transition:'all 0.15s' }}>
                          <div style={{ fontSize:12,fontWeight:700,color:ma?'#FF7A40':'rgba(255,255,255,0.75)',marginBottom:3 }}>{m.label}</div>
                          <div style={{ fontSize:10,color:'rgba(255,255,255,0.3)' }}>{m.desc}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
                {vMode==='image' && (
                  <div style={{ marginBottom:20 }}>
                    <SLabel>Source image</SLabel>
                    {vImg?(
                      <div style={{ position:'relative',borderRadius:12,overflow:'hidden',border:'1px solid rgba(255,122,64,0.2)' }}>
                        <img src={vImg} alt="" style={{ width:'100%',maxHeight:200,objectFit:'cover',display:'block' }}/>
                        <button onClick={()=>setVImg('')} style={{ position:'absolute',top:8,right:8,padding:'4px 10px',borderRadius:6,fontSize:11,fontWeight:600,background:'rgba(0,0,0,0.8)',border:'none',color:'#fff',cursor:'pointer' }}>Remove</button>
                      </div>
                    ):(
                      <div onClick={()=>imgRef.current?.click()} style={{ padding:'32px',border:'1px dashed rgba(255,255,255,0.1)',borderRadius:12,textAlign:'center',cursor:'pointer',color:'rgba(255,255,255,0.35)',fontSize:13 }}>Click to upload image</div>
                    )}
                    <input ref={imgRef} type="file" accept=".png,.jpg,.jpeg,.webp" style={{ display:'none' }} onChange={e=>e.target.files?.[0]&&uploadFile(e.target.files[0],setVImg)}/>
                  </div>
                )}
                {vMode==='frame' && (
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20 }}>
                    {[{ label:'Start frame',val:startUrl,set:setStartUrl,ref:startRef },{ label:'End frame',val:endUrl,set:setEndUrl,ref:endRef }].map(fr=>(
                      <div key={fr.label}>
                        <SLabel>{fr.label}</SLabel>
                        {fr.val?(
                          <div style={{ position:'relative',borderRadius:10,overflow:'hidden' }}>
                            <img src={fr.val} alt="" style={{ width:'100%',height:120,objectFit:'cover',display:'block' }}/>
                            <button onClick={()=>fr.set('')} style={{ position:'absolute',top:6,right:6,padding:'3px 8px',borderRadius:5,fontSize:10,fontWeight:600,background:'rgba(0,0,0,0.8)',border:'none',color:'#fff',cursor:'pointer' }}>x</button>
                          </div>
                        ):(
                          <div onClick={()=>fr.ref.current?.click()} style={{ padding:'24px',border:'1px dashed rgba(255,255,255,0.1)',borderRadius:10,textAlign:'center',cursor:'pointer',color:'rgba(255,255,255,0.3)',fontSize:12 }}>Upload</div>
                        )}
                        <input ref={fr.ref} type="file" accept=".png,.jpg,.jpeg" style={{ display:'none' }} onChange={e=>e.target.files?.[0]&&uploadFile(e.target.files[0],fr.set)}/>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginBottom:22 }}>
                  <SLabel>Scene description</SLabel>
                  <Textarea value={vPrompt} onChange={setVPrompt} rows={4} placeholder="A founder stepping off a private jet at golden hour, slow-motion, cinematic lens flare..."/>
                </div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:22,marginBottom:26 }}>
                  <div>
                    <SLabel>Style</SLabel>
                    <div style={{ display:'flex',gap:5,flexWrap:'wrap' }}>
                      {VID_STYLES.map(s=><Pill key={s} label={s} active={vStyle===s} onClick={()=>setVStyle(s)} color="#FF7A40"/>)}
                    </div>
                  </div>
                  <div>
                    <SLabel>Settings</SLabel>
                    <div style={{ display:'flex',gap:7,marginBottom:10 }}>
                      {[5,10].map(d=>(
                        <button key={d} onClick={()=>setVDur(d)}
                          style={{ padding:'7px 14px',borderRadius:8,background:vDur===d?'rgba(255,122,64,0.1)':'rgba(255,255,255,0.025)',border:'1px solid '+(vDur===d?'rgba(255,122,64,0.28)':'rgba(255,255,255,0.07)'),color:vDur===d?'#FF7A40':'rgba(255,255,255,0.4)',cursor:'pointer',fontFamily:'var(--sans)',fontSize:12,fontWeight:600 }}>
                          {d}s
                        </button>
                      ))}
                    </div>
                    <div style={{ display:'flex',gap:7 }}>
                      {['16:9','9:16','1:1'].map(r=>(
                        <button key={r} onClick={()=>setVRatio(r)}
                          style={{ padding:'7px 12px',borderRadius:8,background:vRatio===r?'rgba(255,122,64,0.1)':'rgba(255,255,255,0.025)',border:'1px solid '+(vRatio===r?'rgba(255,122,64,0.28)':'rgba(255,255,255,0.07)'),color:vRatio===r?'#FF7A40':'rgba(255,255,255,0.4)',cursor:'pointer',fontFamily:'var(--sans)',fontSize:12,fontWeight:600 }}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ marginBottom:26 }}>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:9 }}>
                    <SLabel>Motion intensity</SLabel>
                    <span style={{ fontSize:11,color:'rgba(255,255,255,0.3)' }}>{motion<0.4?'Subtle':motion>0.7?'Dynamic':'Balanced'} - {Math.round(motion*100)}%</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.05" value={motion} onChange={e=>setMotion(parseFloat(e.target.value))} style={{ width:'100%',accentColor:'#FF7A40' }}/>
                </div>
                <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:6 }}>
                  <span style={{ fontSize:11, color: creditBalance < 20 ? '#FF5757' : 'rgba(255,255,255,0.28)', fontWeight:500 }}>
                    {creditBalance < 20 ? `⚠ Need 20 credits (have ${creditBalance})` : `20 credits · ${creditBalance} available`}
                  </span>
                </div>
                <GenBtn active={!!vPrompt.trim()} loading={vGen} label="Generate video - 20 credits" loadingLabel="Rendering your video..." onClick={()=>setVConfirm(true)} color="#FF7A40"/>
                {vConfirm && !vGen && (
                  <div style={{ marginTop:10, padding:'14px 16px', background:'rgba(255,122,64,0.07)', border:'1px solid rgba(255,122,64,0.22)', borderRadius:12 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.85)', marginBottom:4 }}>Confirm generation</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginBottom:12 }}>This will use <strong style={{ color:'#FF7A40' }}>20 credits</strong> from your balance.</div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={()=>{ setVConfirm(false); generateVideo() }} style={{ padding:'8px 18px', background:'#FF7A40', color:'#000', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' }}>Confirm →</button>
                      <button onClick={()=>setVConfirm(false)} style={{ padding:'8px 14px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)', cursor:'pointer' }}>Cancel</button>
                    </div>
                  </div>
                )}
                {vGen && (
                  <div style={{ marginTop:14,padding:'12px 16px',background:'rgba(255,122,64,0.06)',border:'1px solid rgba(255,122,64,0.15)',borderRadius:11 }}>
                    <div style={{ display:'flex',justifyContent:'space-between',marginBottom:8 }}>
                      <span style={{ fontSize:12,color:'rgba(255,255,255,0.5)' }}>Rendering...</span>
                      <span style={{ fontSize:12,fontWeight:700,color:'#FF7A40' }}>{vProg}%</span>
                    </div>
                    <div style={{ height:3,background:'rgba(255,255,255,0.07)',borderRadius:3,overflow:'hidden' }}>
                      <div style={{ height:'100%',width:vProg+'%',background:'linear-gradient(90deg,#FF4500,#FF7A40,#FFB547)',borderRadius:3,transition:'width 0.8s cubic-bezier(0.22,1,0.36,1)',boxShadow:'0 0 8px rgba(255,122,64,0.6)' }}/>
                    </div>
                  </div>
                )}
                {vErr && <ErrBanner msg={vErr}/>}
                {vResult && (
                  <div style={{ marginTop:22,animation:'pageUp 0.35s ease both' }}>
                    <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:11 }}>
                      <div style={{ display:'flex',alignItems:'center',gap:7 }}>
                        <div style={{ width:6,height:6,borderRadius:'50%',background:'#FF7A40',boxShadow:'0 0 7px #FF7A40' }}/>
                        <span style={{ fontSize:11.5,fontWeight:600,color:'rgba(255,255,255,0.42)' }}>Video - 15 credits used</span>
                      </div>
                      <div style={{ display:'flex',gap:5 }}>
                        <a href={vResult} download={'nexa-'+Date.now()+'.mp4'} style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,fontSize:11,fontWeight:600,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.42)',textDecoration:'none' }}>{Ic.dl} Save</a>
                        <ActBtn icon={Ic.redo} label="Redo" onClick={generateVideo}/>
                      </div>
                    </div>
                    <div style={{ borderRadius:18,overflow:'hidden',border:'1px solid rgba(255,122,64,0.2)',background:'#000',boxShadow:'0 20px 60px rgba(0,0,0,0.7)' }}>
                      <video src={vResult} controls style={{ width:'100%',display:'block',maxHeight:460 }}/>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'voice' && (
          <div style={{ width:'100%',animation:'pageUp 0.3s ease both' }}>
            {!planAccess.voice && <UpgradeGate feature="Voice generation" requiredPlan="scale" color="#34D399"/>}
            {planAccess.voice && (
              <div>
                <ProvBadge name="Nexa Voice" desc="Ultra-realistic AI voiceovers, indistinguishable from human speech" color="#34D399"/>
                <div style={{ marginBottom:24 }}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:9 }}>
                    <SLabel>Script</SLabel>
                    <span style={{ fontSize:10,color:'rgba(255,255,255,0.2)' }}>{vxText.length} / 5,000</span>
                  </div>
                  <Textarea value={vxText} onChange={(v:string)=>setVxText(v.slice(0,5000))} rows={6} placeholder="Your script goes here. Use copy from the Copy tab for authentic brand-voice narration."/>
                  {result && (
                    <button onClick={()=>setVxText(result)}
                      style={{ display:'flex',alignItems:'center',gap:6,marginTop:9,padding:'5px 13px',borderRadius:8,fontSize:11,fontWeight:600,background:'rgba(52,211,153,0.07)',border:'1px solid rgba(52,211,153,0.2)',color:'#34D399',cursor:'pointer',fontFamily:'var(--sans)' }}>
                      {Ic.clone} Use last generated copy
                    </button>
                  )}
                </div>
                <div style={{ marginBottom:22 }}>
                  <SLabel>Voice</SLabel>
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:7 }}>
                    {VOICES.map(v=>(
                      <button key={v.id} onClick={()=>setVxId(v.id)}
                        style={{ padding:'11px 10px',borderRadius:11,background:vxId===v.id?'rgba(52,211,153,0.09)':'rgba(255,255,255,0.025)',border:'1px solid '+(vxId===v.id?'rgba(52,211,153,0.28)':'rgba(255,255,255,0.07)'),cursor:'pointer',fontFamily:'var(--sans)',textAlign:'left',transition:'all 0.15s' }}>
                        <div style={{ fontSize:12,fontWeight:700,color:vxId===v.id?'#34D399':'rgba(255,255,255,0.75)',marginBottom:2 }}>{v.name}</div>
                        <div style={{ fontSize:10,color:'rgba(255,255,255,0.28)' }}>{v.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom:26 }}>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:9 }}>
                    <SLabel>Stability</SLabel>
                    <span style={{ fontSize:11,color:'rgba(255,255,255,0.3)' }}>{stab<0.4?'Expressive':stab>0.7?'Consistent':'Balanced'} - {Math.round(stab*100)}%</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.05" value={stab} onChange={e=>setStab(parseFloat(e.target.value))} style={{ width:'100%',accentColor:'#34D399' }}/>
                </div>
                <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:6 }}>
                  <span style={{ fontSize:11, color: creditBalance < 8 ? '#FF5757' : 'rgba(255,255,255,0.28)', fontWeight:500 }}>
                    {creditBalance < 8 ? `⚠ Need 8 credits (have ${creditBalance})` : `8 credits · ${creditBalance} available`}
                  </span>
                </div>
                <GenBtn active={!!vxText.trim()} loading={vxGen} label="Generate voiceover - 8 credits" loadingLabel="Rendering your voiceover..." onClick={()=>setVxConfirm(true)} color="#34D399"/>
                {vxConfirm && !vxGen && (
                  <div style={{ marginTop:10, padding:'14px 16px', background:'rgba(52,211,153,0.07)', border:'1px solid rgba(52,211,153,0.22)', borderRadius:12 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.85)', marginBottom:4 }}>Confirm generation</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginBottom:12 }}>This will use <strong style={{ color:'#34D399' }}>8 credits</strong> from your balance.</div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={()=>{ setVxConfirm(false); generateVoice() }} style={{ padding:'8px 18px', background:'#34D399', color:'#000', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' }}>Confirm →</button>
                      <button onClick={()=>setVxConfirm(false)} style={{ padding:'8px 14px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)', cursor:'pointer' }}>Cancel</button>
                    </div>
                  </div>
                )}
                {vxErr && <ErrBanner msg={vxErr}/>}
                {vxResult && (
                  <div style={{ marginTop:22,animation:'pageUp 0.35s ease both' }}>
                    <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:11 }}>
                      <div style={{ display:'flex',alignItems:'center',gap:7 }}>
                        <div style={{ width:6,height:6,borderRadius:'50%',background:'#34D399',boxShadow:'0 0 7px #34D399' }}/>
                        <span style={{ fontSize:11.5,fontWeight:600,color:'rgba(255,255,255,0.42)' }}>Voiceover - 8 credits used</span>
                      </div>
                      <div style={{ display:'flex',gap:5 }}>
                        <a href={vxResult} download={'nexa-voice-'+Date.now()+'.mp3'} style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,fontSize:11,fontWeight:600,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.42)',textDecoration:'none' }}>{Ic.dl} Save</a>
                        <ActBtn icon={Ic.redo} label="Redo" onClick={generateVoice} color="#34D399"/>
                      </div>
                    </div>
                    <div style={{ padding:'20px 22px',background:'linear-gradient(145deg,rgba(52,211,153,0.08) 0%,rgba(0,0,0,0.35) 100%)',border:'1px solid rgba(52,211,153,0.2)',borderRadius:16,boxShadow:'0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(52,211,153,0.1)' }}>
                      <audio src={vxResult} controls style={{ width:'100%' }}/>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      <div style={{ overflowY:'auto',background:'rgba(5,5,10,0.75)',borderLeft:'1px solid rgba(255,255,255,0.05)',display:'flex',flexDirection:'column' }}>
        <div style={{ padding:'22px 16px 12px',flexShrink:0,borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.55)',marginBottom:2 }}>Recent</div>
          <div style={{ fontSize:11,color:'rgba(255,255,255,0.22)' }}>
            {recent.length > 0 ? (recent.length+' pieces created') : 'Nothing yet - start creating'}
          </div>
        </div>
        <div style={{ padding:'10px 10px 20px',flex:1 }}>
          {recent.length > 0 ? recent.map(item=>{
            const tc = item.type==='image'?'#A78BFA':item.type==='video'?'#FF7A40':item.type==='voice'?'#34D399':'#4D9FFF'
            const tb = item.type==='image'?'rgba(167,139,250,0.1)':item.type==='video'?'rgba(255,122,64,0.1)':item.type==='voice'?'rgba(52,211,153,0.08)':'rgba(77,159,255,0.08)'
            return (
              <div key={item.id} className="rc-card"
                style={{ marginBottom:7,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:11,overflow:'hidden',cursor:'pointer',transition:'all 0.15s' }}
                onClick={()=>{
                  if (item.type==='image'&&item.image_url) { setTab('image'); setIResult(item.image_url) }
                  else if (item.type==='video'&&item.video_url) { setTab('video'); setVResult(item.video_url) }
                  else if (item.type==='voice'&&item.voice_url) { setTab('voice'); setVxResult(item.voice_url) }
                  else if (item.body) { setTab('copy'); setResult(item.body); setResultId(item.id) }
                }}>
                {item.image_url && (
                  <div style={{ position:'relative' }}>
                    <img src={item.image_url} alt="" style={{ width:'100%',height:88,objectFit:'cover',display:'block' }}/>
                    <div style={{ position:'absolute',inset:0,background:'linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.65) 100%)' }}/>
                  </div>
                )}
                {item.type==='video'&&!item.image_url && (
                  <div style={{ height:48,background:'rgba(255,122,64,0.07)',display:'flex',alignItems:'center',justifyContent:'center',color:'#FF7A40',gap:6,fontSize:11,fontWeight:600 }}>
                    <span style={{ display:'flex' }}>{Ic.video}</span>Video clip
                  </div>
                )}
                {item.type==='voice' && (
                  <div style={{ height:38,background:'rgba(52,211,153,0.04)',display:'flex',alignItems:'center',justifyContent:'center',gap:2 }}>
                    {[3,5,8,5,10,7,4,8,5,9,4,7,3,6,8].map((h,i)=>(
                      <div key={i} style={{ width:2,height:h*2.2,background:'#34D399',borderRadius:2,opacity:0.5 }}/>
                    ))}
                  </div>
                )}
                <div style={{ padding:'8px 11px' }}>
                  <div style={{ display:'flex',gap:5,alignItems:'center',marginBottom:4 }}>
                    <span style={{ fontSize:9,fontWeight:700,padding:'1px 7px',borderRadius:4,background:tb,color:tc,textTransform:'uppercase',letterSpacing:'0.04em' }}>{item.type||'copy'}</span>
                    {item.platform && <span style={{ fontSize:9,color:'rgba(255,255,255,0.25)' }}>{item.platform}</span>}
                    <span style={{ fontSize:9,color:'rgba(255,255,255,0.18)',marginLeft:'auto' }}>{item.credits_used}cr</span>
                  </div>
                  {item.body && (
                    <div style={{ fontSize:11.5,color:'rgba(255,255,255,0.5)',lineHeight:1.52,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' as const }}>
                      {item.body}
                    </div>
                  )}
                </div>
              </div>
            )
          }):(
            <div style={{ display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',padding:'40px 16px' }}>
              <div style={{ width:44,height:44,borderRadius:13,background:'rgba(77,159,255,0.06)',border:'1px solid rgba(77,159,255,0.12)',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(77,159,255,0.4)',marginBottom:14 }}>
                {Ic.copy}
              </div>
              <div style={{ fontSize:12,color:'rgba(255,255,255,0.28)',lineHeight:1.7 }}>Every piece you create appears here instantly.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function StudioPage() {
  return (
    <Suspense fallback={<div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'calc(100vh - var(--topbar-h))',color:'rgba(255,255,255,0.28)',fontSize:13 }}>Loading...</div>}>
      <StudioInner/>
    </Suspense>
  )
}
