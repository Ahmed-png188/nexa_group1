'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useLang } from '@/lib/language-context'
import { automate as studioCopy, t } from '@/content/copy'
import { getVideoCreditCost } from '@/lib/plan-constants'

type ContentType    = 'post' | 'thread' | 'email' | 'caption' | 'hook' | 'bio' | 'ad' | 'story'
type Platform       = 'instagram' | 'linkedin' | 'x' | 'tiktok' | 'email' | 'general'
type Tab            = 'pipeline' | 'copy' | 'image' | 'video' | 'voice'
type PipelineFormat = 'post' | 'image' | 'carousel' | 'reel' | 'voice'
interface TodayAngle { angle:string; platform:string; type:string; hook:string; pillar:string }
type ELVoice = { id:string; name:string; preview:string|null; gender:string; accent:string; age:string; style:string }

const Ic = {
  copy:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  image:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  video:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  voice:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  bolt:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  clone:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  check:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  dl:     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  redo:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>,
  cal:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  mic:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>,
  film:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  lock:   <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  arrow:  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  back:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  amplify:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>,
}

const IMG_STYLES    = ['Photorealistic','Cinematic','Minimal','Dark Moody','Vibrant','Illustration']
const IMG_IDS       = ['photorealistic','cinematic','minimal clean white background','dark moody premium','vibrant colorful','flat design illustration']
const RATIOS        = [{ id:'1:1',l:'1:1',d:'Square' },{ id:'4:5',l:'4:5',d:'Portrait' },{ id:'16:9',l:'16:9',d:'Wide' },{ id:'9:16',l:'9:16',d:'Story' }]
const VID_STYLES    = ['Cinematic','Documentary','Brand Ad','Social','Minimal','Dramatic']
const VID_MODES     = [
  { id:'text'  as const, label:'Text to Video',  labelAr:'نص إلى فيديو',   desc:'Describe a scene',    descAr:'صف المشهد'       },
  { id:'image' as const, label:'Image to Video',  labelAr:'صورة إلى فيديو', desc:'Animate a still',    descAr:'حرّك صورة'       },
  { id:'frame' as const, label:'Start to End',    labelAr:'من البداية للنهاية', desc:'Two keyframes',  descAr:'إطاران رئيسيان'  },
]
const VOICES_PER_PAGE = 8
const ANGLES = [
  'The belief that separates those who grow from those who stay stuck',
  'What your audience is getting wrong about this space',
  'The uncomfortable truth everyone sees but nobody says',
  'Why less input produces better results here',
]
const ANGLES_AR = [
  'القناعة التي تفرق بين من ينمو ومن يبقى في مكانه',
  'ما يفهمه جمهورك بشكل خاطئ في هذا المجال',
  'الحقيقة التي يراها الجميع ولا يقولها أحد',
  'لماذا الأقل إنتاج نتائج أفضل هنا',
]

// ─── Sub-components ───────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.35)', marginBottom:'10px' }}>
      {children}
    </div>
  )
}

function StudioTextarea({ value, onChange, placeholder, rows=5, isArabic=false }: any) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ borderRadius:'10px', background: focused ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)', border: `1px solid ${focused ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.08)'}`, transition:'all 0.15s' }}>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width:'100%', padding:'14px 16px', fontSize:'13px', fontFamily: isArabic ? "'Tajawal', sans-serif" : "'Geist', sans-serif", background:'transparent', border:'none', color:'rgba(255,255,255,0.88)', outline:'none', resize:'vertical', lineHeight:1.72, boxSizing:'border-box' as const, direction: isArabic ? 'rtl' : 'ltr' }}
      />
    </div>
  )
}

function GenerateBtn({ active, loading, label, loadingLabel, onClick }: any) {
  return (
    <button onClick={onClick} disabled={!active || loading}
      style={{ width:'100%', padding:'13px 20px', borderRadius:'10px', fontSize:'13px', fontWeight:600, background: active ? '#FFFFFF' : 'rgba(255,255,255,0.06)', color: active ? '#0C0C0C' : 'rgba(255,255,255,0.20)', border:'none', cursor: active ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', transition:'all 0.15s', letterSpacing:'-0.01em' }}
      onMouseEnter={e => { if(active && !loading) (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.88)' }}
      onMouseLeave={e => { if(active && !loading) (e.currentTarget as HTMLElement).style.background='#FFFFFF' }}>
      {loading
        ? <><div className="nexa-spinner" style={{ width:'13px', height:'13px' }}/><span>{loadingLabel}</span></>
        : <><span style={{ display:'flex', opacity:0.7 }}>{Ic.bolt}</span>{label}</>
      }
    </button>
  )
}

function ActionBtn({ icon, label, onClick, active=false }: any) {
  return (
    <button onClick={onClick}
      style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 11px', borderRadius:'7px', fontSize:'11px', fontWeight:500, background: active ? 'rgba(0,170,255,0.08)' : 'transparent', border:`1px solid ${active ? 'rgba(0,170,255,0.20)' : 'rgba(255,255,255,0.08)'}`, color: active ? '#00AAFF' : 'rgba(255,255,255,0.40)', cursor:'pointer', transition:'all 0.14s' }}
      onMouseEnter={e => { if(!active){ (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.18)'; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.75)' }}}
      onMouseLeave={e => { if(!active){ (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.40)' }}}>
      <span style={{ display:'flex' }}>{icon}</span>{label}
    </button>
  )
}

function PlatformPill({ p, active, onClick }: any) {
  return (
    <button onClick={onClick}
      style={{ padding:'9px 12px', borderRadius:'8px', fontSize:'12px', fontWeight:500, background: active ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.02)', border:`1px solid ${active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'}`, color: active ? '#FFFFFF' : 'rgba(255,255,255,0.35)', cursor:'pointer', transition:'all 0.14s', textAlign:'center' as const }}>
      {p.label}
    </button>
  )
}

function FormatCard({ f, active, onClick }: any) {
  return (
    <button onClick={onClick}
      style={{ padding:'13px 12px', borderRadius:'10px', background: active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)', border:`1px solid ${active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.07)'}`, cursor:'pointer', textAlign:'left' as const, transition:'all 0.15s' }}
      onMouseEnter={e => { if(!active) (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)' }}
      onMouseLeave={e => { if(!active) (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.02)' }}>
      <div style={{ fontSize:'13px', fontWeight:600, color: active ? '#FFFFFF' : 'rgba(255,255,255,0.65)', marginBottom:'3px', letterSpacing:'-0.01em' }}>{f.label}</div>
      <div style={{ fontSize:'10px', color: active ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.22)' }}>{f.cost} cr</div>
    </button>
  )
}

function SelectPill({ label, active, onClick }: any) {
  return (
    <button onClick={onClick}
      style={{ padding:'9px 10px', borderRadius:'8px', fontSize:'11px', fontWeight:500, background: active ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.02)', border:`1px solid ${active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'}`, color: active ? '#FFFFFF' : 'rgba(255,255,255,0.35)', cursor:'pointer', transition:'all 0.14s', textAlign:'center' as const }}>
      {label}
    </button>
  )
}

function ErrBanner({ msg, isArabic }: { msg: string; isArabic: boolean }) {
  const isUpgrade = msg.includes('requires the') || msg.includes('upgrade') || msg.includes('Trial expired') || msg.includes('plan')
  if (isUpgrade) {
    const m = msg.match(/requires the (\w+) plan/i)
    const planName = m ? m[1] : 'next'
    const planId   = planName.toLowerCase()
    return (
      <div style={{ marginTop:'14px', padding:'16px 18px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'14px' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'6px' }}>
              <span style={{ display:'flex', color:'rgba(255,255,255,0.35)' }}>{Ic.lock}</span>
              <span style={{ fontSize:'12px', fontWeight:600, color:'rgba(255,255,255,0.65)' }}>{isArabic ? 'الميزة مقفلة' : 'Feature locked'}</span>
            </div>
            <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.40)', lineHeight:1.6 }}>{msg}</div>
          </div>
          <a href={'/dashboard/settings?tab=billing&highlight='+planId}
            style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 16px', background:'#FFFFFF', borderRadius:'8px', fontSize:'12px', fontWeight:600, color:'#0C0C0C', textDecoration:'none', whiteSpace:'nowrap', flexShrink:0 }}>
            {isArabic ? 'طوّر حسابك' : 'Upgrade'}
          </a>
        </div>
      </div>
    )
  }
  return (
    <div style={{ marginTop:'12px', padding:'12px 16px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.18)', borderRadius:'10px', fontSize:'12px', color:'rgba(239,68,68,0.85)', lineHeight:1.55 }}>
      {msg}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────

function StudioInner() {
  const supabase     = createClient()
  const searchParams = useSearchParams()
  const router       = useRouter()
  const startRef     = useRef<HTMLInputElement>(null)
  const endRef       = useRef<HTMLInputElement>(null)
  const imgRef       = useRef<HTMLInputElement>(null)
  const { lang, isArabic } = useLang()
  const c = t(studioCopy, lang)

  const TABS = [
    { id:'pipeline' as Tab, label: isArabic ? 'البايبلاين' : 'Pipeline', sub: isArabic ? 'ابدأ هنا' : 'Start here',   icon:Ic.bolt  },
    { id:'copy'     as Tab, label: isArabic ? 'الكتابة'    : 'Copy',     sub: isArabic ? 'كل الخطط' : 'All plans',    icon:Ic.copy  },
    { id:'image'    as Tab, label: isArabic ? 'الصورة'     : 'Image',    sub: isArabic ? '٥ cr/صورة' : '5 cr/image', icon:Ic.image },
    { id:'video'    as Tab, label: isArabic ? 'الفيديو'    : 'Video',    sub: isArabic ? '٤٩–٣٠٩ cr' : '49–309 cr',  icon:Ic.video },
    { id:'voice'    as Tab, label: isArabic ? 'الصوت'      : 'Voice',    sub: isArabic ? '٥–٢٠ cr'  : '5–20 cr',     icon:Ic.voice },
  ]

  const FORMATS = [
    { id:'post'    as ContentType, label: isArabic ? 'منشور'   : 'Post',    cost:3 },
    { id:'hook'    as ContentType, label: isArabic ? 'هوك'     : 'Hook',    cost:3 },
    { id:'thread'  as ContentType, label: isArabic ? 'ثريد'    : 'Thread',  cost:5 },
    { id:'caption' as ContentType, label: isArabic ? 'كابشن'   : 'Caption', cost:3 },
    { id:'email'   as ContentType, label: isArabic ? 'إيميل'   : 'Email',   cost:5 },
    { id:'story'   as ContentType, label: isArabic ? 'ستوري'   : 'Story',   cost:3 },
    { id:'ad'      as ContentType, label: isArabic ? 'إعلان'   : 'Ad Copy', cost:5 },
    { id:'bio'     as ContentType, label: isArabic ? 'بايو'    : 'Bio',     cost:3 },
  ]

  const PLATFORMS = [
    { id:'instagram' as Platform, label:'Instagram' },
    { id:'linkedin'  as Platform, label:'LinkedIn'  },
    { id:'x'         as Platform, label:'X'         },
    { id:'tiktok'    as Platform, label:'TikTok'    },
    { id:'email'     as Platform, label: isArabic ? 'إيميل' : 'Email' },
    { id:'general'   as Platform, label: isArabic ? 'عام'   : 'General' },
  ]

  const [ws,             setWs]             = useState<any>(null)
  const [creditBalance,  setCreditBalance]  = useState<number>(0)
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
  const [copied,          setCopied]          = useState(false)
  const [sched,           setSched]           = useState(false)
  const [copyErr,         setCopyErr]         = useState<string|null>(null)
  const [showBriefBanner, setShowBriefBanner] = useState(false)
  const [productLabRef,   setProductLabRef]   = useState(false)
  const [iPrompt,  setIPrompt]  = useState('')
  const [iStyle,   setIStyle]   = useState('photorealistic')
  const [iRatio,   setIRatio]   = useState('1:1')
  const [iGen,     setIGen]     = useState(false)
  const [iResult,  setIResult]  = useState<string|null>(null)
  const [iErr,     setIErr]     = useState<string|null>(null)
  const [vPrompt,   setVPrompt]   = useState('')
  const [vStyle,    setVStyle]    = useState('Cinematic')
  const [vDur,      setVDur]      = useState<5|8|10|16>(8)
  const [vRatio,    setVRatio]    = useState('16:9')
  const [vMode,     setVMode]     = useState<'text'|'image'|'frame'>('text')
  const [vQuality,  setVQuality]  = useState<'standard'|'cinema'>('standard')
  const [vAudio,    setVAudio]    = useState(true)
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
  const [vxId,     setVxId]     = useState('21m00Tcm4TlvDq8ikWAM')
  const [vxPage,   setVxPage]   = useState(0)
  const [vxAudio,  setVxAudio]  = useState<HTMLAudioElement|null>(null)
  const [voices,   setVoices]   = useState<ELVoice[]>([])
  const [voicesLoading, setVoicesLoading] = useState(true)
  const [voicesErr,     setVoicesErr]     = useState(false)
  const [playingId,     setPlayingId]     = useState<string|null>(null)
  const [stab,     setStab]     = useState(0.5)
  const [vxGen,    setVxGen]    = useState(false)
  const [vxResult, setVxResult] = useState<string|null>(null)
  const [vxErr,    setVxErr]    = useState<string|null>(null)
  const [vxConfirm,setVxConfirm]= useState(false)
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
  const [pipelineVoiceId,      setPipelineVoiceId]      = useState('21m00Tcm4TlvDq8ikWAM')
  const [pipelineSlideCount,   setPipelineSlideCount]   = useState(5)

  useEffect(() => {
    setMounted(true); loadWs()
    const q     = searchParams.get('q')
    const angle = searchParams.get('angle')
    const dayId = searchParams.get('strategy_day')
    const fmtP  = searchParams.get('format') as PipelineFormat | null
    if (q) setPrompt(decodeURIComponent(q))
    if (angle) { setPipelineCopy(decodeURIComponent(angle)); setTab('pipeline'); if (fmtP) { setPipelineFormat(fmtP); setPipelineStage(fmtP==='post'?4:3) } else { setPipelineStage(2) } }
    if (dayId) setStrategyDayId(dayId)
  }, [])

  // Ready post from morning brief
  useEffect(() => {
    const isReady = searchParams.get('ready') === '1'
    if (!isReady) return
    const savedPost = localStorage.getItem('nexa_ready_post')
    const savedPlatform = localStorage.getItem('nexa_ready_platform')
    if (!savedPost) return

    setTab('copy')
    setResult(savedPost)

    if (savedPlatform) {
      const platformMap: Record<string, string> = {
        instagram: 'instagram', linkedin: 'linkedin',
        x: 'x', twitter: 'x', tiktok: 'tiktok',
        general: 'general', email: 'email',
      }
      const mapped = platformMap[savedPlatform.toLowerCase()]
      if (mapped) setPlat(mapped as Platform)
    }

    setShowBriefBanner(true)

    localStorage.removeItem('nexa_ready_post')
    localStorage.removeItem('nexa_ready_platform')
  }, [searchParams])

  // Read product image from Product Lab
  useEffect(() => {
    const refParam = searchParams.get('ref')
    if (refParam !== 'product') return

    const refImage = localStorage.getItem('studio_reference_image')
    if (!refImage) return

    setVImg(refImage)
    setVMode('image')
    setTab('video')
    setProductLabRef(true)

    localStorage.removeItem('studio_reference_image')
    localStorage.removeItem('studio_reference_type')
  }, [searchParams])

  async function loadWs() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return
    const { data:m } = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id',user.id).limit(1).single()
    const w = (m as any)?.workspaces; setWs(w)
    if (w?.id) {
      const { data:cr } = await supabase.from('credits').select('balance').eq('workspace_id',w.id).single()
      if (cr?.balance !== undefined) setCreditBalance(cr.balance)
    }
    const status = w?.plan_status ?? 'trialing'
    const isTrial = status === 'trialing'
    const trialExpired = isTrial && (new Date() > new Date(new Date(w?.created_at).getTime()+7*86400000))
    const isActive = !trialExpired
    setPlanAccess({ image:isActive, video:isActive, voice:isActive })
    loadRecent(w?.id); loadTodayStrategy(w?.id); loadVoices()
    supabase.channel('studio-rt').on('postgres_changes',{ event:'*',schema:'public',table:'content',filter:'workspace_id=eq.'+w?.id },()=>loadRecent(w?.id)).subscribe()
  }

  async function loadTodayStrategy(wsId: string) {
    if (!wsId) return
    try {
      const { data:plan } = await supabase.from('strategy_plans').select('content_pillars,platform_strategy,insights,daily_plan').eq('workspace_id',wsId).eq('status','active').order('generated_at',{ascending:false}).limit(1).single()
      if (!plan) return
      const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
      const todayPlan = (plan.platform_strategy as any)?.[days[new Date().getDay()]]
      const topAngle  = (plan.insights as any)?.top_angles?.[0]
      if (todayPlan||topAngle) setTodayAngle({ angle:topAngle?.angle||todayPlan?.angle||'Build authority through contrast', platform:todayPlan?.platform||'linkedin', type:todayPlan?.type||'post', hook:topAngle?.example_hook||'', pillar:(plan.content_pillars as any)?.[0]?.name||'' })
      const allAngles = ((plan.insights as any)?.top_angles||[]).map((a:any)=>a.example_hook||a.angle).filter(Boolean).slice(0,6)
      if (allAngles.length > 0) setStrategyAngles(allAngles)
    } catch {}
  }

  async function loadRecent(id: string) {
    if (!id) return
    const { data } = await supabase.from('content').select('*').eq('workspace_id',id).order('created_at',{ascending:false}).limit(18)
    setRecent(data??[])
  }

  async function loadVoices() {
    setVoicesLoading(true); setVoicesErr(false)
    try {
      const r = await fetch('/api/voices'); const d = await r.json()
      if (d.error==='not_configured') { setVoicesErr(false); setVoices([]); setVoicesLoading(false); return }
      if (!d.voices||d.voices.length===0) throw new Error(d.error||'No voices')
      setVoices(d.voices)
      const rachel = d.voices.find((v:ELVoice)=>v.name==='Rachel')
      if (rachel) setVxId(rachel.id); else if (d.voices.length>0) setVxId(d.voices[0].id)
    } catch { setVoicesErr(true) }
    setVoicesLoading(false)
  }

  async function generateCopy() {
    if (!prompt.trim()||genning) return
    setGenning(true); setResult(null); setCopyErr(null); setSched(false); setCopied(false)
    try {
      const r = await fetch('/api/generate-content',{ method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ workspace_id:ws?.id,type:fmt,platform:plat,prompt:prompt.trim(),lang }) })
      const d = await r.json()
      if (!r.ok) { setCopyErr(r.status===402?d.message:(d.error??'Generation failed')); setGenning(false); return }
      setResult(d.content); setResultId(d.content_id); setCrUsed(d.credits_used)
    } catch { setCopyErr(isArabic ? 'صار خطأ — جرّب مرة ثانية.' : 'Something went wrong. Try again.') }
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
    } catch { setIErr(isArabic ? 'صار خطأ ما.' : 'Something went wrong.') }
    setIGen(false)
  }

  async function generateVideo() {
    if (!vPrompt.trim()||vGen) return
    const vidCr = getVideoCreditCost(vDur, vMode==='frame' ? 'frame' : vQuality, vAudio)
    if (creditBalance < vidCr) { setVErr(isArabic ? `رصيدك ما يكفي. هذا الفيديو يحتاج ${vidCr} كريديت.` : `Insufficient credits. This video costs ${vidCr} credits.`); return }
    setVGen(true); setVResult(null); setVErr(null); setVProg(0)
    const iv = setInterval(()=>setVProg(p=>p<88?+(p+Math.random()*4).toFixed(1):p),4000)
    try {
      const body:any = { workspace_id:ws?.id, prompt:vPrompt.trim(), mode:vMode, quality:vQuality, audio:vAudio, duration:vDur }
      if (vMode==='image'&&vImg) body.image_url = vImg
      if (vMode==='frame') { body.start_frame_url=startUrl; body.end_frame_url=endUrl }
      const r = await fetch('/api/generate-video',{ method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body) })
      const d = await r.json()
      clearInterval(iv)
      if (!r.ok) { setVErr(r.status===402?d.message:(d.error??'Failed')); setVGen(false); return }
      setVProg(100); setVResult(d.video_url)
    } catch { clearInterval(iv); setVErr(isArabic ? 'صار خطأ ما.' : 'Something went wrong.') }
    setVGen(false)
  }

  async function generateVoice() {
    if (!vxText.trim()||vxGen) return
    const vxCr = vxText.length<=200?5:vxText.length<=600?10:20
    if (creditBalance < vxCr) { setVxErr(isArabic ? `رصيدك ما يكفي. التعليق الصوتي يحتاج ${vxCr} كريديت.` : `Insufficient credits. This voiceover costs ${vxCr} credits.`); return }
    setVxGen(true); setVxResult(null); setVxErr(null)
    try {
      const r = await fetch('/api/generate-voice',{ method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ workspace_id:ws?.id,text:vxText.trim(),voice_id:vxId,stability:stab }) })
      const d = await r.json()
      if (!r.ok) { setVxErr(r.status===402?d.message:(d.error??'Failed')); setVxGen(false); return }
      setVxResult(d.audio_url)
    } catch { setVxErr(isArabic ? 'صار خطأ ما.' : 'Something went wrong.') }
    setVxGen(false)
  }

  async function generatePipelineCopy() {
    if (!pipelineCopy.trim()||pipelineGenning) return
    setPipelineGenning(true); setPipelineErr(null)
    try {
      const r = await fetch('/api/generate-content',{ method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ workspace_id:ws?.id,type:'post',platform:pipePlat,prompt:pipelineCopy.trim(),lang }) })
      const d = await r.json()
      if (r.ok) setPipelineCopy(d.content)
      else setPipelineErr(d.message||d.error||'Generation failed')
    } catch { setPipelineErr(isArabic ? 'صار خطأ ما.' : 'Something went wrong.') }
    setPipelineGenning(false)
  }

  async function generatePipelineImage() {
    if (!pipelineImgPrompt.trim()||pipelineGenning) return
    setPipelineGenning(true); setPipelineErr(null)
    try {
      const r = await fetch('/api/generate-image',{ method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ workspace_id:ws?.id,prompt:pipelineImgPrompt,style:pipelineImgStyle,aspect_ratio:'4:5' }) })
      const d = await r.json()
      if (!r.ok) { setPipelineErr(r.status===402?d.message:(d.error||'Failed')); setPipelineGenning(false); return }
      setPipelineAsset(d.image_url); setPipelineAssetId(d.content_id); setPipelineStage(4)
    } catch { setPipelineErr(isArabic ? 'صار خطأ ما.' : 'Something went wrong.') }
    setPipelineGenning(false)
  }

  async function generatePipelineCarousel() {
    if (!pipelineCopy.trim()||pipelineGenning) return
    setPipelineGenning(true); setPipelineErr(null)
    try {
      const r = await fetch('/api/generate-content',{ method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ workspace_id:ws?.id,type:'post',platform:pipePlat,prompt:`Create a ${pipelineSlideCount}-slide carousel from this copy. Format each slide as "Slide N: [text]". Make each a standalone insight. Last slide = CTA. Copy: ${pipelineCopy}` }) })
      const d = await r.json()
      if (!r.ok) { setPipelineErr(d.message||'Failed'); setPipelineGenning(false); return }
      setPipelineAsset(d.content); setPipelineStage(4)
    } catch { setPipelineErr(isArabic ? 'صار خطأ ما.' : 'Something went wrong.') }
    setPipelineGenning(false)
  }

  async function generatePipelineVideo() {
    if (!pipelineVidPrompt.trim()||pipelineGenning) return
    const pVidCr = getVideoCreditCost(pipelineVidDur as 5|8|10|16, 'standard', false)
    if (creditBalance < pVidCr) { setPipelineErr(isArabic ? `رصيدك ما يكفي. الفيديو يحتاج ${pVidCr} كريديت.` : `Insufficient credits. ${pipelineVidDur}s video costs ${pVidCr} credits.`); return }
    setPipelineGenning(true); setPipelineErr(null)
    try {
      const r = await fetch('/api/generate-video',{ method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ workspace_id:ws?.id,prompt:pipelineVidPrompt,style:'cinematic',duration:pipelineVidDur,aspect_ratio:'9:16' }) })
      const d = await r.json()
      if (!r.ok) { setPipelineErr(r.status===402?d.message:(d.error||'Failed')); setPipelineGenning(false); return }
      setPipelineAsset(d.video_url); setPipelineAssetId(d.content_id); setPipelineStage(4)
    } catch { setPipelineErr(isArabic ? 'صار خطأ ما.' : 'Something went wrong.') }
    setPipelineGenning(false)
  }

  async function generatePipelineVoice() {
    if (!pipelineCopy.trim()||pipelineGenning) return
    const pVxCr = pipelineCopy.length<=200?5:pipelineCopy.length<=600?10:20
    if (creditBalance < pVxCr) { setPipelineErr(isArabic ? `رصيدك ما يكفي. التعليق يحتاج ${pVxCr} كريديت.` : `Insufficient credits. This voiceover costs ${pVxCr} credits.`); return }
    setPipelineGenning(true); setPipelineErr(null)
    try {
      const r = await fetch('/api/generate-voice',{ method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ workspace_id:ws?.id,text:pipelineCopy,voice_id:pipelineVoiceId,stability:0.5 }) })
      const d = await r.json()
      if (!r.ok) { setPipelineErr(r.status===402?d.message:(d.error||'Failed')); setPipelineGenning(false); return }
      setPipelineAsset(d.audio_url); setPipelineAssetId(d.content_id); setPipelineStage(4)
    } catch { setPipelineErr(isArabic ? 'صار خطأ ما.' : 'Something went wrong.') }
    setPipelineGenning(false)
  }

  async function schedulePipelinePost() {
    if (!pipelineScheduleTime||pipeSched) return
    setPipeSched(true); setPipelineErr(null)
    try {
      const r = await fetch('/api/schedule-post',{ method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ workspace_id:ws?.id,content_id:pipelineAssetId||undefined,platform:pipePlat,scheduled_for:new Date(pipelineScheduleTime).toISOString(),body:pipelineCopy,type:pipelineFormat==='reel'?'video':pipelineFormat==='voice'?'voice':'post',strategy_day_id:strategyDayId||undefined }) })
      if (r.ok) setPipelineScheduled(true)
      else { const d = await r.json(); setPipelineErr(d.message||'Failed to schedule') }
    } catch { setPipelineErr(isArabic ? 'صار خطأ ما.' : 'Something went wrong.') }
    setPipeSched(false)
  }

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
    } catch {}
  }

  function uploadFile(file: File, set: (u:string)=>void) {
    const reader = new FileReader()
    reader.onload = e => set(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const selFmt   = FORMATS.find(f=>f.id===fmt)!
  const hasBrand = !!(ws?.brand_voice)
  const CURRENT_ANGLES = strategyAngles.length > 0 ? strategyAngles : (isArabic ? ANGLES_AR : ANGLES)

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 240px', height:'calc(100vh - var(--topbar-h))', overflow:'hidden', background:'#0C0C0C' }}>

      <style dangerouslySetInnerHTML={{ __html:`
        .studio-scroll::-webkit-scrollbar{display:none}.studio-scroll{scrollbar-width:none}
        @keyframes studioUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .s-in{animation:studioUp 0.3s cubic-bezier(0.22,1,0.36,1) both}
        input[type=datetime-local]::-webkit-calendar-picker-indicator{filter:invert(0.5)}
        input[type=range]{accent-color:#00AAFF}
      `}}/>

      {/* LEFT — Main studio */}
      <div className="studio-scroll" style={{ overflowY:'auto', borderRight:'1px solid rgba(255,255,255,0.08)' }}>

        {/* HERO */}
        <div style={{ opacity:mounted?1:0, transition:'opacity 0.4s ease' }}>
          <div style={{ backgroundImage:'url(/cyan-header.png)', backgroundSize:'cover', backgroundPosition:'center top', padding:'40px 0 28px' }}>
            <div style={{ maxWidth:'680px', margin:'0 auto', padding:'0 40px' }}>
              <h1 style={{ fontSize:'36px', fontWeight:700, letterSpacing:'-0.04em', color:'#0A0A0A', lineHeight:1, marginBottom:'8px' }}>
                {isArabic ? 'الاستوديو' : 'Studio'}
              </h1>
              <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                {hasBrand
                  ? <><div style={{ width:6, height:6, borderRadius:'50%', background:'rgba(0,0,0,0.45)', flexShrink:0 }}/><span style={{ fontSize:'13px', color:'rgba(0,0,0,0.80)', fontWeight:500 }}>{isArabic ? 'تكتب Nexa بصوتك' : 'Writing in your voice'}</span></>
                  : <><div style={{ width:6, height:6, borderRadius:'50%', background:'rgba(0,0,0,0.30)', flexShrink:0 }}/><span style={{ fontSize:'13px', color:'rgba(0,0,0,0.70)' }}>{isArabic ? 'درّب Brand Brain' : 'Train Brand Brain'} <a href="/dashboard/brand" style={{ color:'rgba(0,0,80,0.70)', textDecoration:'none', fontWeight:600 }}>←</a></span></>
                }
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ background:'#141414', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ maxWidth:'680px', margin:'0 auto', padding:'0 40px', display:'flex', justifyContent:'center' }}>
              {TABS.map(tabItem => {
                const active = tab === tabItem.id
                return (
                  <button key={tabItem.id} onClick={() => setTab(tabItem.id)}
                    style={{ display:'flex', alignItems:'center', gap:'7px', padding:'12px 20px', background:'none', border:'none', borderBottom:`2px solid ${active ? '#00AAFF' : 'transparent'}`, marginBottom:'-1px', color: active ? '#FFFFFF' : 'rgba(255,255,255,0.42)', cursor:'pointer', fontFamily: isArabic ? "'Tajawal',sans-serif" : "'Geist',sans-serif", fontSize:'13px', fontWeight: active ? 600 : 400, transition:'all 0.15s', whiteSpace:'nowrap' }}
                    onMouseEnter={e => { if(!active) (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.72)' }}
                    onMouseLeave={e => { if(!active) (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.42)' }}>
                    <span style={{ display:'flex', opacity: active ? 1 : 0.5 }}>{tabItem.icon}</span>
                    {tabItem.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Tab content */}
        <div style={{ padding:'32px 40px 60px', maxWidth:'680px', margin:'0 auto', width:'100%', boxSizing:'border-box' as const }}>

          {/* Today's angle banner */}
          {todayAngle && tab === 'copy' && (
            <div className="s-in" onClick={() => { setPrompt(todayAngle.hook||todayAngle.angle); if(todayAngle.platform) setPlat(todayAngle.platform as Platform) }}
              style={{ marginBottom:'24px', padding:'14px 18px', background:'rgba(0,170,255,0.05)', border:'1px solid rgba(0,170,255,0.15)', borderLeft: isArabic ? 'none' : '3px solid rgba(0,170,255,0.50)', borderRight: isArabic ? '3px solid rgba(0,170,255,0.50)' : 'none', borderRadius: isArabic ? '10px 0 0 10px' : '0 10px 10px 0', cursor:'pointer', transition:'border-color 0.15s' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'6px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                  <span style={{ fontSize:'10px', fontWeight:600, color:'rgba(0,170,255,0.70)', letterSpacing:'0.08em', textTransform:'uppercase' }}>
                    {isArabic ? 'الاستراتيجية · زاوية اليوم' : "Strategy · Today's angle"}
                  </span>
                  {todayAngle.pillar && <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.25)' }}>· {todayAngle.pillar}</span>}
                </div>
                <span style={{ fontSize:'11px', color:'rgba(0,170,255,0.45)' }}>{isArabic ? 'اضغط للاستخدام ←' : 'Click to use →'}</span>
              </div>
              <div style={{ fontSize:'13px', fontWeight:500, color:'rgba(255,255,255,0.80)', lineHeight:1.5 }}>{todayAngle.angle}</div>
              {todayAngle.hook && <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', marginTop:'5px', fontStyle:'italic' }}>{isArabic ? 'الهوك: ' : 'Hook: '}{todayAngle.hook}</div>}
            </div>
          )}

          {/* ── PIPELINE TAB ── */}
          {tab === 'pipeline' && (
            <div className="s-in">
              {/* Stage indicators */}
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'32px', justifyContent:'center' }}>
                {(isArabic ? ['الكتابة','الشكل','الأصل','الجدولة'] : ['Copy','Format','Asset','Schedule']).map((label,i) => {
                  const s   = (i+1) as 1|2|3|4
                  const done = pipelineStage > s
                  const cur  = pipelineStage === s
                  return (
                    <div key={s} style={{ display:'flex', alignItems:'center', gap:'8px', flex: i < 3 ? 1 : 'none' }}>
                      <div onClick={() => done && setPipelineStage(s)}
                        style={{ width:24, height:24, borderRadius:'50%', flexShrink:0, background: cur ? '#FFFFFF' : done ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)', border: cur ? 'none' : `1px solid ${done?'rgba(255,255,255,0.25)':'rgba(255,255,255,0.10)'}`, color: cur ? '#0C0C0C' : done ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.20)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, cursor: done ? 'pointer' : 'default', transition:'all 0.2s' }}>
                        {done ? '✓' : s}
                      </div>
                      <span style={{ fontSize:'11px', fontWeight:600, color: cur ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.22)', letterSpacing:'0.02em' }}>{label}</span>
                      {i < 3 && <div style={{ flex:1, height:1, background: done ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)', marginLeft:'4px' }}/>}
                    </div>
                  )
                })}
              </div>

              {/* Stage 1 — Copy */}
              {pipelineStage === 1 && (
                <div>
                  <div style={{ marginBottom:'20px' }}>
                    <Label>{isArabic ? 'المنصة' : 'Platform'}</Label>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
                      {PLATFORMS.map(p => <PlatformPill key={p.id} p={p} active={pipePlat===p.id} onClick={() => setPipePlat(p.id)}/>)}
                    </div>
                  </div>
                  <div style={{ marginBottom:'20px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                      <Label>{isArabic ? 'الكتابة / السكريبت' : 'Copy / Script'}</Label>
                      <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.20)' }}>{isArabic ? 'اكتب بنفسك أو ولّد' : 'Type your own or generate below'}</span>
                    </div>
                    <StudioTextarea value={pipelineCopy} onChange={setPipelineCopy} rows={7} isArabic={isArabic}
                      placeholder={isArabic ? 'أعطِ Nexa اتجاهاً، الصق مسودتك، أو أدخل سكريبتك. هذا أساس كل شيء.' : 'Give Nexa a direction, paste your draft, or enter your script. This becomes the foundation for everything.'}/>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'8px', marginBottom:'20px' }}>
                    {CURRENT_ANGLES.map((a,i) => (
                      <button key={i} onClick={() => setPipelineCopy(a)}
                        style={{ padding:'9px 12px', borderRadius:'8px', fontSize:'11px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.35)', cursor:'pointer', fontFamily: isArabic ? "'Tajawal',sans-serif" : "'Geist',sans-serif", transition:'all 0.15s', textAlign: isArabic ? 'right' : 'left' as const, lineHeight:1.5 }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.55)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.15)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.22)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.06)' }}>
                        {a.length > 48 ? a.slice(0,48)+'...' : a}
                      </button>
                    ))}
                  </div>
                  <GenerateBtn active={!!pipelineCopy.trim()} loading={pipelineGenning}
                    label={isArabic ? 'ولّدي مع Brand Brain' : 'Generate with Brand Brain'}
                    loadingLabel={isArabic ? 'Nexa تكتب بصوتك...' : 'Writing in your brand voice...'}
                    onClick={generatePipelineCopy}/>
                  {pipelineErr && <ErrBanner msg={pipelineErr} isArabic={isArabic}/>}
                  {pipelineCopy.trim() && !pipelineGenning && (
                    <button onClick={() => setPipelineStage(2)}
                      style={{ marginTop:'10px', width:'100%', padding:'12px', borderRadius:'10px', background:'transparent', border:'1px solid rgba(255,255,255,0.10)', color:'rgba(255,255,255,0.50)', cursor:'pointer', fontFamily: isArabic ? "'Tajawal',sans-serif" : "'Geist',sans-serif", fontSize:'13px', fontWeight:500, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', transition:'all 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.22)'; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.80)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.10)'; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.50)' }}>
                      {isArabic ? 'تابع — اختار الشكل' : 'Continue — choose format'} <span style={{ display:'flex' }}>{Ic.arrow}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Stage 2 — Format */}
              {pipelineStage === 2 && (
                <div>
                  <div style={{ marginBottom:'20px', padding:'14px 16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                      <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.25)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>{isArabic ? 'كتابتك' : 'Your copy'}</span>
                      <button onClick={() => setPipelineStage(1)} style={{ fontSize:'11px', color:'rgba(255,255,255,0.40)', background:'none', border:'none', cursor:'pointer', fontFamily: isArabic ? "'Tajawal',sans-serif" : "'Geist',sans-serif" }}>{isArabic ? 'عدّل' : 'Edit'}</button>
                    </div>
                    <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.65)', lineHeight:1.6, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical' as const }}>{pipelineCopy}</div>
                  </div>
                  <Label>{isArabic ? 'اختار الشكل' : 'Choose format'}</Label>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                    {([
                      { id:'post'     as PipelineFormat, label: isArabic ? 'منشور فقط'    : 'Post only',   sub: isArabic ? 'جدوِله مباشرة' : 'Schedule directly',  desc: isArabic ? 'جاهز للنشر. ما تحتاج أصل.'         : 'Ready to post. No asset needed.' },
                      { id:'image'    as PipelineFormat, label: isArabic ? '+ صورة'        : '+ Image',     sub: isArabic ? '+٥ كريديت'     : '+5 credits',          desc: isArabic ? 'صورة AI مع الكتابة'                : 'AI visual paired with copy'      },
                      { id:'carousel' as PipelineFormat, label: isArabic ? '+ كاروسيل'     : '+ Carousel',  sub: isArabic ? '+كريديت حسب الشرائح' : '+credits by slides', desc: isArabic ? 'تفصيل متعدد الشرائح'          : 'Multi-slide breakdown'            },
                      { id:'reel'     as PipelineFormat, label: isArabic ? '+ ريلز'         : '+ Reel',      sub: isArabic ? '+١٠–٢٠ كريديت' : '+10–20 credits',       desc: isArabic ? 'فيديو سينمائي من الكتابة'         : 'Cinematic video from copy'        },
                      { id:'voice'    as PipelineFormat, label: isArabic ? '+ تعليق صوتي'   : '+ Voiceover', sub: isArabic ? '+٥–٢٠ كريديت' : '+5–20 credits',         desc: isArabic ? 'تعليق صوتي احترافي'              : 'Professional narration'           },
                    ]).map(f => {
                      const active = pipelineFormat === f.id
                      return (
                        <div key={f.id}
                          onClick={() => { setPipelineFormat(f.id); setPipelineAsset(null); setPipelineAssetId(null); setPipelineErr(null); setPipelineScheduled(false); if (f.id==='image') setPipelineImgPrompt(pipelineCopy.slice(0,200)); if (f.id==='reel') setPipelineVidPrompt(pipelineCopy.slice(0,200)); if (f.id==='post') setPipelineStage(4); else setPipelineStage(3) }}
                          style={{ padding:'16px', borderRadius:'10px', background: active ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)', border:`1px solid ${active?'rgba(255,255,255,0.20)':'rgba(255,255,255,0.07)'}`, cursor:'pointer', transition:'all 0.15s', gridColumn: f.id==='post' ? 'span 2' : 'span 1', textAlign: isArabic ? 'right' : 'left' as const }}>
                          <div style={{ fontSize:'13px', fontWeight:600, color: active ? '#FFFFFF' : 'rgba(255,255,255,0.75)', marginBottom:'4px', letterSpacing:'-0.01em' }}>{f.label}</div>
                          <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.30)', marginBottom:'4px', lineHeight:1.5 }}>{f.desc}</div>
                          <div style={{ fontSize:'10px', fontWeight:600, color: active ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.20)' }}>{f.sub}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Stage 3 — Asset */}
              {pipelineStage === 3 && (
                <div>
                  <button onClick={() => setPipelineStage(2)}
                    style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 12px', borderRadius:'8px', fontSize:'12px', fontWeight:500, background:'transparent', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.35)', cursor:'pointer', fontFamily: isArabic ? "'Tajawal',sans-serif" : "'Geist',sans-serif", marginBottom:'24px', transition:'all 0.15s' }}>
                    <span style={{ display:'flex' }}>{Ic.back}</span> {isArabic ? 'ارجع' : 'Back'}
                  </button>

                  {pipelineFormat === 'image' && (
                    <>
                      <div style={{ marginBottom:'20px' }}>
                        <Label>{isArabic ? 'الاتجاه البصري' : 'Visual direction'}</Label>
                        <StudioTextarea value={pipelineImgPrompt} onChange={setPipelineImgPrompt} rows={4} isArabic={isArabic}
                          placeholder={isArabic ? 'صف الصورة — Nexa ستطوّرها بصرياً.' : 'Describe the visual — Nexa enhances it cinematically.'}/>
                      </div>
                      <div style={{ marginBottom:'24px' }}>
                        <Label>{isArabic ? 'الأسلوب' : 'Style'}</Label>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
                          {IMG_STYLES.map((s,i) => <SelectPill key={s} label={s} active={pipelineImgStyle===IMG_IDS[i]} onClick={() => setPipelineImgStyle(IMG_IDS[i])}/>)}
                        </div>
                      </div>
                      <GenerateBtn active={!!pipelineImgPrompt.trim()} loading={pipelineGenning}
                        label={isArabic ? 'ولّدي صورة — ٥ كريديت' : 'Generate image — 5 credits'}
                        loadingLabel={isArabic ? 'Nexa تولّد الصورة...' : 'Generating your image...'}
                        onClick={generatePipelineImage}/>
                    </>
                  )}

                  {pipelineFormat === 'carousel' && (
                    <>
                      <div style={{ marginBottom:'20px' }}>
                        <Label>{isArabic ? 'عدد الشرائح' : 'Number of slides'}</Label>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px' }}>
                          {[3,5,7,10].map(n => (
                            <button key={n} onClick={() => setPipelineSlideCount(n)}
                              style={{ padding:'7px 16px', borderRadius:'100px', fontSize:'12px', fontWeight:500, background: pipelineSlideCount===n ? 'rgba(255,255,255,0.10)' : 'transparent', border:`1px solid ${pipelineSlideCount===n?'rgba(255,255,255,0.22)':'rgba(255,255,255,0.08)'}`, color: pipelineSlideCount===n ? '#FFFFFF' : 'rgba(255,255,255,0.35)', cursor:'pointer', transition:'all 0.14s' }}>
                              {n} {isArabic ? 'شرائح' : 'slides'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <GenerateBtn active={!!pipelineCopy.trim()} loading={pipelineGenning}
                        label={isArabic ? `ولّدي ${pipelineSlideCount} شرائح — ${pipelineSlideCount*2} كريديت` : `Generate ${pipelineSlideCount} slides — ${pipelineSlideCount*2} credits`}
                        loadingLabel={isArabic ? 'Nexa تبني الكاروسيل...' : 'Building carousel...'}
                        onClick={generatePipelineCarousel}/>
                    </>
                  )}

                  {pipelineFormat === 'reel' && (
                    <>
                      <div style={{ marginBottom:'20px' }}>
                        <Label>{isArabic ? 'وصف المشهد' : 'Scene description'}</Label>
                        <StudioTextarea value={pipelineVidPrompt} onChange={setPipelineVidPrompt} rows={4} isArabic={isArabic}
                          placeholder={isArabic ? 'صف المشهد — Nexa ستخرجه سينمائياً.' : 'Describe the scene — Nexa will direct it cinematically.'}/>
                      </div>
                      <div style={{ marginBottom:'20px' }}>
                        <Label>{isArabic ? 'المدة' : 'Duration'}</Label>
                        <div style={{ display:'flex', gap:'6px' }}>
                          {[5,10].map(d => (
                            <button key={d} onClick={() => setPipelineVidDur(d)}
                              style={{ padding:'7px 16px', borderRadius:'100px', fontSize:'12px', fontWeight:500, background: pipelineVidDur===d ? 'rgba(255,255,255,0.10)' : 'transparent', border:`1px solid ${pipelineVidDur===d?'rgba(255,255,255,0.22)':'rgba(255,255,255,0.08)'}`, color: pipelineVidDur===d ? '#FFFFFF' : 'rgba(255,255,255,0.35)', cursor:'pointer', transition:'all 0.14s' }}>
                              {d}{isArabic ? 'ث' : 's'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <GenerateBtn active={!!pipelineVidPrompt.trim()} loading={pipelineGenning}
                        label={isArabic ? 'ولّدي ريلز — ٢٠ كريديت' : 'Generate reel — 20 credits'}
                        loadingLabel={isArabic ? 'Nexa تصوّر الفيديو...' : 'Rendering your video...'}
                        onClick={generatePipelineVideo}/>
                    </>
                  )}

                  {pipelineFormat === 'voice' && (
                    <>
                      <div style={{ marginBottom:'20px' }}>
                        <Label>{isArabic ? 'السكريبت' : 'Script'}</Label>
                        <StudioTextarea value={pipelineCopy} onChange={setPipelineCopy} rows={6} isArabic={isArabic} placeholder={isArabic ? 'سكريبتك هنا...' : 'Your script...'}/>
                      </div>
                      <GenerateBtn active={!!pipelineCopy.trim()} loading={pipelineGenning}
                        label={isArabic ? 'ولّدي تعليق صوتي — ٨ كريديت' : 'Generate voiceover — 8 credits'}
                        loadingLabel={isArabic ? 'Nexa تصوّر الصوت...' : 'Rendering your voiceover...'}
                        onClick={generatePipelineVoice}/>
                    </>
                  )}

                  {pipelineErr && <ErrBanner msg={pipelineErr} isArabic={isArabic}/>}
                </div>
              )}

              {/* Stage 4 — Schedule */}
              {pipelineStage === 4 && (
                <div>
                  <button onClick={() => setPipelineStage(pipelineFormat==='post'?2:3)}
                    style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 12px', borderRadius:'8px', fontSize:'12px', fontWeight:500, background:'transparent', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.35)', cursor:'pointer', fontFamily: isArabic ? "'Tajawal',sans-serif" : "'Geist',sans-serif", marginBottom:'24px', transition:'all 0.15s' }}>
                    <span style={{ display:'flex' }}>{Ic.back}</span> {isArabic ? 'ارجع' : 'Back'}
                  </button>

                  <div style={{ marginBottom:'16px', padding:'18px 20px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
                      <span style={{ fontSize:'10px', fontWeight:600, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{isArabic ? 'الكتابة' : 'Copy'}</span>
                      <button onClick={() => setPipelineStage(1)} style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', background:'none', border:'none', cursor:'pointer', fontFamily: isArabic ? "'Tajawal',sans-serif" : "'Geist',sans-serif" }}>{isArabic ? 'عدّل' : 'Edit'}</button>
                    </div>
                    <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.75)', lineHeight:1.7, whiteSpace:'pre-wrap', maxHeight:160, overflowY:'auto' }}>{pipelineCopy}</div>
                  </div>

                  {pipelineAsset && pipelineFormat==='image' && (
                    <div style={{ marginBottom:'16px', borderRadius:'10px', overflow:'hidden', border:'1px solid rgba(255,255,255,0.10)' }}>
                      <img src={pipelineAsset} alt="Generated" style={{ width:'100%', display:'block', maxHeight:360, objectFit:'cover' }}/>
                    </div>
                  )}
                  {pipelineAsset && pipelineFormat==='reel' && (
                    <div style={{ marginBottom:'16px', borderRadius:'10px', overflow:'hidden', border:'1px solid rgba(255,255,255,0.10)', background:'#000' }}>
                      <video src={pipelineAsset} controls style={{ width:'100%', display:'block', maxHeight:300 }}/>
                    </div>
                  )}
                  {pipelineAsset && pipelineFormat==='voice' && (
                    <div style={{ marginBottom:'16px', padding:'18px 20px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px' }}>
                      <audio src={pipelineAsset} controls style={{ width:'100%' }}/>
                    </div>
                  )}
                  {pipelineAsset && pipelineFormat==='carousel' && (
                    <div style={{ marginBottom:'16px', padding:'16px 18px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px' }}>
                      <div style={{ fontSize:'10px', fontWeight:600, color:'rgba(255,255,255,0.25)', marginBottom:'10px', textTransform:'uppercase', letterSpacing:'0.06em' }}>{isArabic ? 'شرائح الكاروسيل' : 'Carousel slides'}</div>
                      <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.65)', lineHeight:1.8, whiteSpace:'pre-wrap', maxHeight:220, overflowY:'auto' }}>{pipelineAsset}</div>
                    </div>
                  )}

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'20px' }}>
                    <div>
                      <Label>{isArabic ? 'المنصة' : 'Platform'}</Label>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
                        {PLATFORMS.filter(p => p.id!=='general'&&p.id!=='email').map(p => (
                          <PlatformPill key={p.id} p={p} active={pipePlat===p.id} onClick={() => setPipePlat(p.id)}/>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>{isArabic ? 'موعد النشر' : 'Schedule for'}</Label>
                      <input type="datetime-local" value={pipelineScheduleTime} onChange={e => setPipelineScheduleTime(e.target.value)}
                        style={{ width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'8px', color:'rgba(255,255,255,0.75)', fontSize:'12px', fontFamily: isArabic ? "'Tajawal',sans-serif" : "'Geist',sans-serif", outline:'none', boxSizing:'border-box' as const }}/>
                    </div>
                  </div>

                  <GenerateBtn active={!!pipelineScheduleTime && !pipelineScheduled} loading={pipeSched}
                    label={isArabic ? 'جدوِل المنشور — ١ كريديت' : 'Schedule post — 1 credit'}
                    loadingLabel={isArabic ? 'Nexa تجدوِل...' : 'Scheduling...'}
                    onClick={schedulePipelinePost}/>
                  {pipelineErr && <ErrBanner msg={pipelineErr} isArabic={isArabic}/>}

                  {pipelineScheduled && (
                    <div style={{ marginTop:'14px', padding:'18px 20px', background:'rgba(34,197,94,0.05)', border:'1px solid rgba(34,197,94,0.18)', borderRadius:'10px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
                        <span style={{ display:'flex', color:'#22C55E' }}>{Ic.check}</span>
                        <span style={{ fontSize:'14px', fontWeight:600, color:'#22C55E' }}>{isArabic ? 'تم الجدولة' : 'Scheduled'}</span>
                      </div>
                      <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.40)', lineHeight:1.6 }}>
                        {isArabic ? `تم إضافة ${pipelineFormat} للقائمة.` : `Your ${pipelineFormat} has been added to the queue.`}
                      </div>
                      <button onClick={() => { setPipelineStage(1); setPipelineCopy(''); setPipelineFormat(null); setPipelineAsset(null); setPipelineAssetId(null); setPipelineScheduled(false); setPipelineScheduleTime(''); setStrategyDayId(null) }}
                        style={{ marginTop:'12px', padding:'8px 16px', borderRadius:'8px', fontSize:'12px', fontWeight:600, background:'transparent', border:'1px solid rgba(255,255,255,0.10)', color:'rgba(255,255,255,0.50)', cursor:'pointer', fontFamily: isArabic ? "'Tajawal',sans-serif" : "'Geist',sans-serif", transition:'all 0.15s' }}>
                        {isArabic ? 'أنشئ شيئاً آخر ←' : 'Create another →'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── COPY TAB ── */}
          {tab === 'copy' && (
            <div className="s-in">
              <div style={{ marginBottom:'24px' }}>
                <Label>{isArabic ? 'النوع' : 'Format'}</Label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))', gap:'7px' }}>
                  {FORMATS.map(f => <FormatCard key={f.id} f={f} active={fmt===f.id} onClick={() => setFmt(f.id)}/>)}
                </div>
              </div>
              <div style={{ marginBottom:'24px' }}>
                <Label>{isArabic ? 'المنصة' : 'Platform'}</Label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
                  {PLATFORMS.map(p => <PlatformPill key={p.id} p={p} active={plat===p.id} onClick={() => setPlat(p.id)}/>)}
                </div>
              </div>
              <div style={{ marginBottom:'16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                  <Label>{isArabic ? 'الاتجاه' : 'Direction'}</Label>
                  <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.25)' }}>{isArabic ? 'Enter للتوليد' : 'Enter to generate'}</span>
                </div>
                <StudioTextarea value={prompt} onChange={setPrompt} rows={5} isArabic={isArabic}
                  placeholder={isArabic ? 'أعطِ Nexa اتجاهاً أو زاوية. كن محدداً — Nexa تتكفّل بالحرفة.' : "Give Nexa a direction or angle. Be specific — Nexa handles the craft."}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'24px' }}>
                {CURRENT_ANGLES.map((a,i) => (
                  <button key={i} onClick={() => setPrompt(a)}
                    style={{ padding:'9px 12px', borderRadius:'8px', fontSize:'11px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.35)', cursor:'pointer', fontFamily: isArabic ? "'Tajawal',sans-serif" : "'Geist',sans-serif", transition:'all 0.15s', textAlign: isArabic ? 'right' : 'left' as const, lineHeight:1.5 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.55)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.15)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.22)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.06)' }}>
                    {a.length > 48 ? a.slice(0,48)+'...' : a}
                  </button>
                ))}
              </div>
              <GenerateBtn active={!!prompt.trim()} loading={genning}
                label={isArabic ? `اكتبي ${selFmt?.label} — ${selFmt?.cost} كريديت` : `Write ${selFmt?.label} — ${selFmt?.cost} credits`}
                loadingLabel={isArabic ? 'Nexa تكتب بصوتك...' : 'Writing in your brand voice...'}
                onClick={generateCopy}/>
              {copyErr && <ErrBanner msg={copyErr} isArabic={isArabic}/>}

              {result && (
                <div style={{ marginTop:'28px', animation:'studioUp 0.3s ease both' }}>
                  {showBriefBanner && (
                    <div style={{
                      display:'flex', alignItems:'center', gap:8, marginBottom:12, padding:'8px 12px',
                      background:'rgba(0,170,255,0.06)', border:'1px solid rgba(0,170,255,0.15)',
                      borderRadius:8,
                    }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:'#00AAFF', flexShrink:0 }}/>
                      <span style={{ fontSize:'11px', color:'rgba(0,170,255,0.80)', fontFamily: isArabic ? "'Tajawal', sans-serif" : "'Geist', sans-serif" }}>
                        From your morning brief — ready to schedule
                      </span>
                      <button
                        onClick={() => setShowBriefBanner(false)}
                        style={{ marginLeft:'auto', background:'none', border:'none', color:'rgba(255,255,255,0.30)', cursor:'pointer', padding:0 }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                  )}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:'#00AAFF' }}/>
                      <span style={{ fontSize:'11px', fontWeight:500, color:'rgba(255,255,255,0.35)' }}>{selFmt?.label} · {crUsed} {isArabic ? 'كريديت' : 'credits used'}</span>
                    </div>
                    <div style={{ display:'flex', gap:'5px' }}>
                      <ActionBtn icon={copied ? Ic.check : Ic.clone} label={copied ? c.copied : c.copy_btn} onClick={() => copyText(result!)} active={copied}/>
                      <ActionBtn icon={Ic.redo} label={isArabic ? 'أعيدي الكتابة' : 'Rewrite'} onClick={generateCopy}/>
                      <ActionBtn icon={Ic.mic} label={isArabic ? 'صوّتي' : 'Narrate'} onClick={() => { setVxText(result!); setTab('voice') }}/>
                      <ActionBtn icon={sched ? Ic.check : Ic.cal} label={sched ? (isArabic ? 'في القائمة' : 'Queued') : (isArabic ? 'جدوِل' : 'Schedule')} onClick={schedulePost} active={sched}/>
                    </div>
                  </div>
                  <div style={{ padding:'24px 28px', background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px', fontSize:'14px', color:'rgba(255,255,255,0.88)', lineHeight:1.85, whiteSpace:'pre-wrap', letterSpacing:'-0.01em', fontFamily: isArabic ? "'Tajawal', sans-serif" : "Georgia, serif", direction: isArabic ? 'rtl' : 'ltr', textAlign: isArabic ? 'right' : 'left' as const }}>
                    {result}
                  </div>
                  <div style={{ marginTop:'10px', display:'flex', justifyContent:'flex-end' }}>
                    <button
                      onClick={() => { const p = new URLSearchParams({ boost:'true', content:result.slice(0,500), platform:plat, ...(resultId?{content_id:resultId}:{}) }); window.location.href = `/dashboard/amplify?${p.toString()}` }}
                      style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'7px 14px', background:'transparent', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', fontSize:'12px', fontWeight:500, color:'rgba(255,255,255,0.35)', cursor:'pointer', transition:'all 0.15s', fontFamily: isArabic ? "'Tajawal',sans-serif" : "'Geist',sans-serif" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.18)'; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.65)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.35)' }}>
                      <span style={{ display:'flex' }}>{Ic.amplify}</span> {isArabic ? 'وسّع مع Amplify' : 'Boost with Amplify'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── IMAGE TAB ── */}
          {tab === 'image' && (
            <div className="s-in">
              <div style={{ marginBottom:'24px' }}>
                <Label>{isArabic ? 'صف صورتك' : 'Describe your image'}</Label>
                <StudioTextarea value={iPrompt} onChange={setIPrompt} rows={4} isArabic={isArabic}
                  placeholder={isArabic ? 'كن محدداً. مؤسس مركّز على مكتب خشبي، ضوء الصباح، تصوير احترافي.' : 'Be specific. A focused founder at a dark oak desk, morning light, premium editorial photography.'}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px', marginBottom:'28px' }}>
                <div>
                  <Label>{isArabic ? 'الأسلوب البصري' : 'Visual style'}</Label>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
                    {IMG_STYLES.map((s,i) => <SelectPill key={s} label={s} active={iStyle===IMG_IDS[i]} onClick={() => setIStyle(IMG_IDS[i])}/>)}
                  </div>
                </div>
                <div>
                  <Label>{isArabic ? 'النسبة' : 'Format'}</Label>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'6px' }}>
                    {RATIOS.map(r => (
                      <button key={r.id} onClick={() => setIRatio(r.id)}
                        style={{ padding:'9px 6px', borderRadius:'8px', background: iRatio===r.id ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)', border:`1px solid ${iRatio===r.id?'rgba(255,255,255,0.20)':'rgba(255,255,255,0.07)'}`, color: iRatio===r.id ? '#FFFFFF' : 'rgba(255,255,255,0.35)', cursor:'pointer', textAlign:'center' as const, transition:'all 0.15s' }}>
                        <div style={{ fontSize:'12px', fontWeight:600 }}>{r.l}</div>
                        <div style={{ fontSize:'10px', opacity:0.55 }}>{r.d}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <GenerateBtn active={!!iPrompt.trim()} loading={iGen}
                label={isArabic ? 'ولّدي صورة — ٥ كريديت' : 'Generate image — 5 credits'}
                loadingLabel={isArabic ? 'Nexa تولّد صورتك...' : 'Generating your image...'}
                onClick={generateImage}/>
              {iErr && <ErrBanner msg={iErr} isArabic={isArabic}/>}
              {iResult && (
                <div style={{ marginTop:'28px', animation:'studioUp 0.3s ease both' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:'#00AAFF' }}/>
                      <span style={{ fontSize:'11px', fontWeight:500, color:'rgba(255,255,255,0.35)' }}>{isArabic ? 'صورة · ٥ كريديت' : 'Image · 5 credits used'}</span>
                    </div>
                    <div style={{ display:'flex', gap:'5px' }}>
                      <ActionBtn icon={Ic.film} label={isArabic ? 'حرّكي' : 'Animate'} onClick={() => { setTab('video'); setVMode('image'); setVImg(iResult!) }}/>
                      <a href={iResult} download={'nexa-'+Date.now()+'.jpg'} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 11px', borderRadius:'7px', fontSize:'11px', fontWeight:500, background:'transparent', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.40)', textDecoration:'none' }}>{Ic.dl} {isArabic ? 'احفظ' : 'Save'}</a>
                      <ActionBtn icon={Ic.redo} label={isArabic ? 'أعيدي' : 'Redo'} onClick={generateImage}/>
                    </div>
                  </div>
                  <div style={{ borderRadius:'10px', overflow:'hidden', border:'1px solid rgba(255,255,255,0.10)' }}>
                    <img src={iResult} alt="Generated" style={{ width:'100%', display:'block', maxHeight:560, objectFit:'cover' }}/>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── VIDEO TAB ── */}
          {tab === 'video' && (
            <div className="s-in">
              {/* 1. Mode */}
              <div style={{ marginBottom:'20px' }}>
                <Label>Mode</Label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
                  {VID_MODES.map(m => (
                    <button key={m.id} onClick={() => setVMode(m.id)}
                      style={{ padding:'12px 10px', borderRadius:'10px', background: vMode===m.id ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)', border:`1px solid ${vMode===m.id?'rgba(255,255,255,0.20)':'rgba(255,255,255,0.07)'}`, cursor:'pointer', textAlign:'left' as const, transition:'all 0.15s' }}>
                      <div style={{ fontSize:'12px', fontWeight:600, color: vMode===m.id ? '#FFFFFF' : 'rgba(255,255,255,0.60)', marginBottom:'3px' }}>{m.label}</div>
                      <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.28)' }}>{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Image upload for image mode */}
              {vMode==='image' && (
                <div style={{ marginBottom:'20px' }}>
                  <Label>Source image</Label>
                  {productLabRef && vImg && (
                    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:8, marginBottom:10, background:'rgba(0,170,255,0.06)', border:'1px solid rgba(0,170,255,0.15)' }}>
                      <div style={{ width:5, height:5, borderRadius:'50%', background:'#00AAFF', flexShrink:0 }}/>
                      <span style={{ fontSize:11, color:'rgba(0,170,255,0.80)', fontFamily:"'Geist', -apple-system, sans-serif" }}>
                        From Product Lab — your product is ready to animate
                      </span>
                      <button onClick={() => setProductLabRef(false)} style={{ marginLeft:'auto', background:'none', border:'none', color:'rgba(255,255,255,0.25)', cursor:'pointer', padding:0, fontSize:16, lineHeight:1 }}>×</button>
                    </div>
                  )}
                  {vImg ? (
                    <div style={{ position:'relative', borderRadius:'10px', overflow:'hidden', border:'1px solid rgba(255,255,255,0.10)' }}>
                      <img src={vImg} alt="" style={{ width:'100%', maxHeight:200, objectFit:'cover', display:'block' }}/>
                      <button onClick={() => setVImg('')} style={{ position:'absolute', top:8, right:8, padding:'4px 10px', borderRadius:'6px', fontSize:'11px', fontWeight:600, background:'rgba(0,0,0,0.80)', border:'none', color:'#fff', cursor:'pointer' }}>Remove</button>
                    </div>
                  ) : (
                    <div onClick={() => imgRef.current?.click()} style={{ padding:'32px', border:'1px dashed rgba(255,255,255,0.10)', borderRadius:'10px', textAlign:'center' as const, cursor:'pointer', color:'rgba(255,255,255,0.25)', fontSize:'13px' }}>
                      Click to upload image
                    </div>
                  )}
                  <input ref={imgRef} type="file" accept=".png,.jpg,.jpeg,.webp" style={{ display:'none' }} onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0],setVImg)}/>
                </div>
              )}

              {/* 3. Two dropzones for frame mode */}
              {vMode==='frame' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'20px' }}>
                  {[
                    { label:'Start frame', val:startUrl, set:setStartUrl, ref:startRef },
                    { label:'End frame',   val:endUrl,   set:setEndUrl,   ref:endRef   },
                  ].map(fr => (
                    <div key={fr.label}>
                      <Label>{fr.label}</Label>
                      {fr.val ? (
                        <div style={{ position:'relative', borderRadius:'8px', overflow:'hidden' }}>
                          <img src={fr.val} alt="" style={{ width:'100%', height:120, objectFit:'cover', display:'block' }}/>
                          <button onClick={() => fr.set('')} style={{ position:'absolute', top:6, right:6, padding:'3px 8px', borderRadius:'5px', fontSize:'10px', fontWeight:600, background:'rgba(0,0,0,0.80)', border:'none', color:'#fff', cursor:'pointer' }}>×</button>
                        </div>
                      ) : (
                        <div onClick={() => fr.ref.current?.click()} style={{ padding:'24px', border:'1px dashed rgba(255,255,255,0.10)', borderRadius:'8px', textAlign:'center' as const, cursor:'pointer', color:'rgba(255,255,255,0.25)', fontSize:'12px' }}>Upload</div>
                      )}
                      <input ref={fr.ref} type="file" accept=".png,.jpg,.jpeg" style={{ display:'none' }} onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0],fr.set)}/>
                    </div>
                  ))}
                </div>
              )}

              {/* 4. Quality selector */}
              <div style={{ marginBottom:'20px' }}>
                <Label>Quality</Label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                  {([
                    { id:'standard' as const, label:'Standard', sub:'High quality, cinematic' },
                    { id:'cinema'   as const, label:'Cinema',   sub:'Maximum quality'         },
                  ]).map(q => (
                    <button key={q.id} onClick={() => setVQuality(q.id)}
                      style={{ padding:'12px 14px', borderRadius:'10px', background: vQuality===q.id ? 'rgba(0,170,255,0.08)' : 'rgba(255,255,255,0.02)', border:`1px solid ${vQuality===q.id?'rgba(0,170,255,0.28)':'rgba(255,255,255,0.07)'}`, cursor:'pointer', textAlign:'left' as const, transition:'all 0.15s' }}>
                      <div style={{ fontSize:'12px', fontWeight:600, color: vQuality===q.id ? '#00AAFF' : 'rgba(255,255,255,0.60)', marginBottom:'2px' }}>{q.label}</div>
                      <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.28)' }}>{q.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Audio toggle */}
              <div style={{ marginBottom:'20px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'10px' }}>
                <div>
                  <div style={{ fontSize:'12px', fontWeight:600, color:'rgba(255,255,255,0.75)' }}>Include audio</div>
                  {vAudio && <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.28)', marginTop:2 }}>AI generates atmospheric audio</div>}
                </div>
                <button onClick={() => setVAudio(v => !v)}
                  style={{ width:42, height:24, borderRadius:100, background: vAudio ? '#00AAFF' : 'rgba(255,255,255,0.12)', border:'none', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
                  <div style={{ position:'absolute', top:3, left: vAudio ? 21 : 3, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }}/>
                </button>
              </div>

              {/* 6. Duration selector */}
              <div style={{ marginBottom:'24px' }}>
                <Label>Duration</Label>
                <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' as const }}>
                  {([5,8,10,16] as const).map(d => {
                    const cr = getVideoCreditCost(d, vMode==='frame' ? 'frame' : vQuality, vAudio)
                    return (
                      <button key={d} onClick={() => setVDur(d)}
                        style={{ padding:'8px 14px', borderRadius:'100px', fontSize:'12px', fontWeight:500, background: vDur===d ? 'rgba(255,255,255,0.10)' : 'transparent', border:`1px solid ${vDur===d?'rgba(255,255,255,0.22)':'rgba(255,255,255,0.08)'}`, color: vDur===d ? '#FFFFFF' : 'rgba(255,255,255,0.35)', cursor:'pointer', transition:'all 0.14s', display:'flex', alignItems:'center', gap:5 }}>
                        {d}s <span style={{ fontSize:'9px', color: vDur===d?'rgba(255,255,255,0.45)':'rgba(255,255,255,0.20)', fontWeight:400 }}>{cr}cr</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Scene description */}
              <div style={{ marginBottom:'24px' }}>
                <Label>Scene description</Label>
                <StudioTextarea value={vPrompt} onChange={setVPrompt} rows={4}
                  placeholder="A founder stepping off a private jet at golden hour, slow-motion, cinematic lens flare..."/>
              </div>

              {/* 7. Credit cost preview + generate */}
              {(() => {
                const vidCr = getVideoCreditCost(vDur, vMode==='frame' ? 'frame' : vQuality, vAudio)
                const hasEnough = creditBalance >= vidCr
                return (
                  <>
                    <div style={{ marginBottom:'12px', padding:'12px 14px', background: hasEnough ? 'rgba(255,255,255,0.03)' : 'rgba(245,158,11,0.06)', border:`1px solid ${hasEnough?'rgba(255,255,255,0.08)':'rgba(245,158,11,0.22)'}`, borderRadius:'10px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:'13px', fontWeight:600, color: hasEnough ? 'rgba(255,255,255,0.70)' : '#F59E0B' }}>
                        This will use <span style={{ fontFamily:"'Geist Mono',monospace", color: hasEnough ? '#FFFFFF' : '#F59E0B' }}>{vidCr} credits</span>
                      </span>
                      <span style={{ fontSize:'11px', color: hasEnough ? 'rgba(255,255,255,0.25)' : '#F59E0B', fontWeight:500 }}>
                        {hasEnough ? `${creditBalance} available` : `Need ${vidCr} · have ${creditBalance}`}
                      </span>
                    </div>
                    <GenerateBtn active={!!vPrompt.trim() && hasEnough} loading={vGen}
                      label={`Generate Video → ${vidCr} credits`}
                      loadingLabel="Rendering your video..."
                      onClick={() => setVConfirm(true)}/>
                    {!hasEnough && (
                      <div style={{ marginTop:'8px', fontSize:'11px', color:'rgba(245,158,11,0.80)', textAlign:'center' as const }}>
                        Not enough credits. <a href="/dashboard/settings?tab=billing" style={{ color:'#00AAFF', textDecoration:'none' }}>Top up →</a>
                      </div>
                    )}
                    {vConfirm && !vGen && (
                      <div style={{ marginTop:'10px', padding:'14px 16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px' }}>
                        <div style={{ fontSize:'13px', fontWeight:600, color:'rgba(255,255,255,0.80)', marginBottom:'4px' }}>Confirm — {vidCr} credits</div>
                        <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)', marginBottom:'12px' }}>{vDur}s · {vQuality} · {vAudio ? 'audio' : 'silent'}.</div>
                        <div style={{ display:'flex', gap:'8px' }}>
                          <button onClick={() => { setVConfirm(false); generateVideo() }} style={{ padding:'8px 18px', background:'#FFFFFF', color:'#0C0C0C', border:'none', borderRadius:'8px', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>Confirm</button>
                          <button onClick={() => setVConfirm(false)} style={{ padding:'8px 14px', background:'transparent', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'8px', fontSize:'12px', fontWeight:500, color:'rgba(255,255,255,0.40)', cursor:'pointer' }}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}

              {vGen && (
                <div style={{ marginTop:'14px', padding:'14px 16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                    <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)' }}>Rendering your video...</span>
                    <span style={{ fontSize:'12px', fontWeight:600, color:'rgba(255,255,255,0.65)' }}>{vProg}%</span>
                  </div>
                  <div style={{ height:'3px', background:'rgba(255,255,255,0.06)', borderRadius:'3px', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:vProg+'%', background:'#00AAFF', borderRadius:'3px', transition:'width 0.8s cubic-bezier(0.22,1,0.36,1)' }}/>
                  </div>
                </div>
              )}
              {vErr && <ErrBanner msg={vErr} isArabic={false}/>}
              {vResult && (
                <div style={{ marginTop:'28px', animation:'studioUp 0.3s ease both' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:'#00AAFF' }}/>
                      <span style={{ fontSize:'11px', fontWeight:500, color:'rgba(255,255,255,0.35)' }}>Video {vDur}s · {getVideoCreditCost(vDur, vMode==='frame'?'frame':vQuality, vAudio)} credits used</span>
                    </div>
                    <div style={{ display:'flex', gap:'5px' }}>
                      <a href={vResult} download={'nexa-'+Date.now()+'.mp4'} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 11px', borderRadius:'7px', fontSize:'11px', fontWeight:500, background:'transparent', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.40)', textDecoration:'none' }}>{Ic.dl} Save</a>
                      <ActionBtn icon={Ic.redo} label="Redo" onClick={generateVideo}/>
                    </div>
                  </div>
                  <div style={{ borderRadius:'10px', overflow:'hidden', border:'1px solid rgba(255,255,255,0.10)', background:'#000' }}>
                    <video src={vResult} controls style={{ width:'100%', display:'block', maxHeight:460 }}/>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── VOICE TAB ── */}
          {tab === 'voice' && (
            <div className="s-in">
              <div style={{ marginBottom:'24px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                  <Label>{isArabic ? 'السكريبت' : 'Script'}</Label>
                  <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.20)' }}>{vxText.length} / 5,000</span>
                </div>
                <StudioTextarea value={vxText} onChange={(v: string) => setVxText(v.slice(0,5000))} rows={6} isArabic={isArabic}
                  placeholder={isArabic ? 'سكريبتك هنا. استخدم الكتابة من تاب الكتابة للحصول على صوت براندك الحقيقي.' : 'Your script goes here. Use copy from the Copy tab for authentic brand-voice narration.'}/>
                {result && (
                  <button onClick={() => setVxText(result)}
                    style={{ display:'flex', alignItems:'center', gap:'6px', marginTop:'10px', padding:'5px 12px', borderRadius:'7px', fontSize:'11px', fontWeight:500, background:'transparent', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.35)', cursor:'pointer', transition:'all 0.15s' }}>
                    <span style={{ display:'flex' }}>{Ic.clone}</span> {isArabic ? 'استخدم آخر كتابة' : 'Use last generated copy'}
                  </button>
                )}
              </div>

              <div style={{ marginBottom:'24px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                  <Label>{isArabic ? 'الصوت' : 'Voice'}</Label>
                  {!voicesLoading && !voicesErr && voices.length > 0 && (
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.25)' }}>
                        {vxPage*VOICES_PER_PAGE+1}–{Math.min((vxPage+1)*VOICES_PER_PAGE,voices.length)} {isArabic?'من':' of '} {voices.length}
                      </span>
                      <button onClick={() => setVxPage(p=>Math.max(0,p-1))} disabled={vxPage===0}
                        style={{ width:22,height:22,borderRadius:5,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.10)',color:vxPage===0?'rgba(255,255,255,0.15)':'rgba(255,255,255,0.55)',cursor:vxPage===0?'default':'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,lineHeight:'1' }}>‹</button>
                      <button onClick={() => setVxPage(p=>Math.min(Math.ceil(voices.length/VOICES_PER_PAGE)-1,p+1))} disabled={vxPage>=Math.ceil(voices.length/VOICES_PER_PAGE)-1}
                        style={{ width:22,height:22,borderRadius:5,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.10)',color:vxPage>=Math.ceil(voices.length/VOICES_PER_PAGE)-1?'rgba(255,255,255,0.15)':'rgba(255,255,255,0.55)',cursor:vxPage>=Math.ceil(voices.length/VOICES_PER_PAGE)-1?'default':'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,lineHeight:'1' }}>›</button>
                    </div>
                  )}
                </div>

                {voicesLoading && (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'7px' }}>
                    {Array.from({length:8}).map((_,i) => (
                      <div key={i} style={{ padding:'10px 8px',borderRadius:'10px',background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',height:72,display:'flex',flexDirection:'column',gap:5,justifyContent:'center' }}>
                        <div style={{ height:8,width:'60%',background:'rgba(255,255,255,0.06)',borderRadius:4 }}/>
                        <div style={{ height:6,width:'80%',background:'rgba(255,255,255,0.04)',borderRadius:4 }}/>
                      </div>
                    ))}
                  </div>
                )}

                {voicesErr && !voicesLoading && (
                  <div style={{ padding:'20px',background:'rgba(239,68,68,0.06)',border:'1px solid rgba(239,68,68,0.15)',borderRadius:10,textAlign:'center' as const }}>
                    <div style={{ fontSize:'12px',color:'rgba(239,68,68,0.75)',marginBottom:8 }}>{isArabic ? 'ما قدرنا نحمّل الأصوات' : 'Could not load voices'}</div>
                    <button onClick={loadVoices} style={{ padding:'5px 14px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.10)',borderRadius:6,color:'rgba(255,255,255,0.50)',fontSize:'11px',cursor:'pointer' }}>{isArabic ? 'جرّب مرة ثانية' : 'Try again'}</button>
                  </div>
                )}

                {!voicesLoading && !voicesErr && voices.length > 0 && (
                  <>
                    <div style={{ display:'flex',gap:4,marginBottom:10,flexWrap:'wrap' as const }}>
                      {Array.from({length:Math.ceil(voices.length/VOICES_PER_PAGE)}).map((_,i)=>(
                        <button key={i} onClick={()=>setVxPage(i)}
                          style={{ width:vxPage===i?16:6,height:6,borderRadius:3,background:vxPage===i?'rgba(0,170,255,0.8)':'rgba(255,255,255,0.15)',border:'none',cursor:'pointer',transition:'all 0.2s',padding:0 }}/>
                      ))}
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'7px' }}>
                      {voices.slice(vxPage*VOICES_PER_PAGE,(vxPage+1)*VOICES_PER_PAGE).map((v,idx) => {
                        const num       = vxPage*VOICES_PER_PAGE+idx+1
                        const isSelected = vxId===v.id
                        const isPlaying  = playingId===v.id
                        const noPreview  = !v.preview
                        return (
                          <button key={v.id}
                            onClick={() => {
                              setVxId(v.id)
                              if (!v.preview) return
                              if (vxAudio) { vxAudio.pause(); vxAudio.currentTime=0 }
                              if (isPlaying) { setPlayingId(null); setVxAudio(null); return }
                              const a = new Audio(v.preview); a.volume=0.85
                              setPlayingId(v.id); setVxAudio(a)
                              a.play().catch(()=>setPlayingId(null))
                              a.onended = ()=>{ setPlayingId(null); setVxAudio(null) }
                            }}
                            style={{ padding:'10px 8px',borderRadius:'10px',background:isSelected?'rgba(0,170,255,0.10)':'rgba(255,255,255,0.02)',border:`1px solid ${isSelected?'rgba(0,170,255,0.35)':'rgba(255,255,255,0.07)'}`,cursor:'pointer',textAlign:'left' as const,transition:'all 0.15s',position:'relative' as const,opacity:noPreview?0.65:1 }}>
                            <div style={{ fontSize:'9px',color:isSelected?'rgba(0,170,255,0.6)':'rgba(255,255,255,0.20)',fontWeight:600,marginBottom:2,letterSpacing:'0.04em' }}>{String(num).padStart(2,'0')}</div>
                            <div style={{ fontSize:'12px',fontWeight:600,color:isSelected?'#FFFFFF':'rgba(255,255,255,0.65)',marginBottom:'1px',lineHeight:1.2 }}>{v.name}</div>
                            <div style={{ fontSize:'9px',color:'rgba(255,255,255,0.28)',lineHeight:1.3 }}>{[v.gender,v.accent].filter(Boolean).join(' · ')||'Voice'}</div>
                            {v.style && <div style={{ fontSize:'9px',color:'rgba(255,255,255,0.20)',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const }}>{v.style}</div>}
                            <div style={{ position:'absolute' as const,bottom:6,right:6 }}>
                              {isPlaying
                                ? <div style={{ display:'flex',gap:1.5,alignItems:'flex-end',height:10 }}>{[0,1,2].map(i=><div key={i} style={{ width:2,background:'rgba(0,170,255,0.8)',borderRadius:1,animation:`pulse-dot 0.7s ease-in-out ${i*0.12}s infinite`,height:i===1?'100%':'55%' }}/>)}</div>
                                : noPreview
                                ? <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/></svg>
                                : <svg width="7" height="7" viewBox="0 0 24 24" fill={isSelected?'rgba(0,170,255,0.5)':'rgba(255,255,255,0.15)'}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                              }
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    <div style={{ marginTop:8,fontSize:'10px',color:'rgba(255,255,255,0.20)',textAlign:'center' as const }}>
                      {isArabic ? 'اضغط للاختيار والمعاينة · المختار: ' : 'Click to select & preview · Selected: '}
                      <span style={{ color:'rgba(255,255,255,0.40)' }}>{voices.find(v=>v.id===vxId)?.name||'—'}</span>
                      {playingId && <span style={{ marginLeft:8,color:'rgba(0,170,255,0.55)' }}> ▶ {isArabic ? 'يعزف...' : 'Playing…'}</span>}
                    </div>
                  </>
                )}
              </div>

              <div style={{ marginBottom:'24px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                  <Label>{isArabic ? 'الثبات' : 'Stability'}</Label>
                  <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.25)' }}>{stab<0.4?(isArabic?'معبّر':'Expressive'):stab>0.7?(isArabic?'ثابت':'Consistent'):(isArabic?'متوازن':'Balanced')} · {Math.round(stab*100)}%</span>
                </div>
                <input type="range" min="0" max="1" step="0.05" value={stab} onChange={e => setStab(parseFloat(e.target.value))} style={{ width:'100%' }}/>
              </div>

              {(() => {
                const vxCr = vxText.length<=200?5:vxText.length<=600?10:20
                const durLabel = vxText.length<=200?(isArabic?'~٣٠ث':'~30s'):vxText.length<=600?(isArabic?'~٦٠ث':'~60s'):(isArabic?'~٣ د':'~3min')
                const hasEnough = creditBalance >= vxCr
                return (
                  <>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                      <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.25)' }}>
                        {durLabel} · <span style={{ fontFamily:"'Geist Mono',monospace" }}>{vxCr} {isArabic?'كريديت':'credits'}</span>
                      </span>
                      <span style={{ fontSize:'11px', color: hasEnough ? 'rgba(255,255,255,0.25)' : '#EF4444', fontWeight:500 }}>
                        {hasEnough ? `${creditBalance} ${isArabic?'متاح':'available'}` : `${isArabic?'تحتاج':'Need'} ${vxCr} · ${isArabic?'عندك':'have'} ${creditBalance}`}
                      </span>
                    </div>
                    <GenerateBtn active={!!vxText.trim()} loading={vxGen}
                      label={isArabic ? `ولّدي تعليق صوتي — ${vxCr} كريديت` : `Generate voiceover — ${vxCr} credits`}
                      loadingLabel={isArabic ? 'Nexa تصوّر الصوت...' : 'Rendering your voiceover...'}
                      onClick={() => setVxConfirm(true)}/>
                    {vxConfirm && !vxGen && (
                      <div style={{ marginTop:'10px', padding:'14px 16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px' }}>
                        <div style={{ fontSize:'13px', fontWeight:600, color:'rgba(255,255,255,0.80)', marginBottom:'4px' }}>{isArabic ? `تأكيد — ${vxCr} كريديت` : `Confirm — ${vxCr} credits`}</div>
                        <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)', marginBottom:'12px' }}>{voices.find(v=>v.id===vxId)?.name} · {durLabel}.</div>
                        <div style={{ display:'flex', gap:'8px' }}>
                          <button onClick={() => { setVxConfirm(false); generateVoice() }} style={{ padding:'8px 18px', background:'#FFFFFF', color:'#0C0C0C', border:'none', borderRadius:'8px', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>{isArabic ? 'تأكيد' : 'Confirm'}</button>
                          <button onClick={() => setVxConfirm(false)} style={{ padding:'8px 14px', background:'transparent', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'8px', fontSize:'12px', fontWeight:500, color:'rgba(255,255,255,0.40)', cursor:'pointer' }}>{isArabic ? 'إلغاء' : 'Cancel'}</button>
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
              {vxErr && <ErrBanner msg={vxErr} isArabic={isArabic}/>}
              {vxResult && (
                <div style={{ marginTop:'28px', animation:'studioUp 0.3s ease both' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:'#00AAFF' }}/>
                      <span style={{ fontSize:'11px', fontWeight:500, color:'rgba(255,255,255,0.35)' }}>{isArabic ? 'تعليق صوتي' : 'Voiceover'} · {vxText.length<=200?5:vxText.length<=600?10:20} {isArabic ? 'كريديت' : 'credits used'}</span>
                    </div>
                    <div style={{ display:'flex', gap:'5px' }}>
                      <a href={vxResult} download={'nexa-voice-'+Date.now()+'.mp3'} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 11px', borderRadius:'7px', fontSize:'11px', fontWeight:500, background:'transparent', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.40)', textDecoration:'none' }}>{Ic.dl} {isArabic ? 'احفظ' : 'Save'}</a>
                      <ActionBtn icon={Ic.redo} label={isArabic ? 'أعيدي' : 'Redo'} onClick={generateVoice}/>
                    </div>
                  </div>
                  <div style={{ padding:'20px 22px', background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px' }}>
                    <audio src={vxResult} controls style={{ width:'100%' }}/>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT — Recent sidebar */}
      <div className="studio-scroll" style={{ overflowY:'auto', background:'#0E0E0E', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'20px 16px 12px', flexShrink:0, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize:'12px', fontWeight:600, color:'rgba(255,255,255,0.50)', marginBottom:'2px' }}>{isArabic ? 'آخر ما أنتجته Nexa' : 'Recent'}</div>
          <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.20)' }}>
            {recent.length > 0 ? `${recent.length} ${isArabic ? 'قطعة' : 'pieces'}` : (isArabic ? 'لا شيء بعد' : 'Nothing yet')}
          </div>
        </div>
        <div style={{ padding:'10px 10px 20px', flex:1 }}>
          {recent.length > 0 ? recent.map(item => (
            <div key={item.id}
              style={{ marginBottom:'7px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px', overflow:'hidden', cursor:'pointer', transition:'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.10)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.03)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.06)' }}
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
                <div style={{ height:40, background:'rgba(255,255,255,0.03)', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.25)', gap:6, fontSize:11 }}>
                  <span style={{ display:'flex' }}>{Ic.video}</span>{isArabic ? 'فيديو' : 'Video'}
                </div>
              )}
              {item.type==='voice' && (
                <div style={{ height:32, background:'rgba(255,255,255,0.02)', display:'flex', alignItems:'center', justifyContent:'center', gap:2 }}>
                  {[3,5,8,5,10,7,4,8,5].map((h,i) => (
                    <div key={i} style={{ width:2, height:h*1.8, background:'rgba(255,255,255,0.20)', borderRadius:2 }}/>
                  ))}
                </div>
              )}
              <div style={{ padding:'8px 11px' }}>
                <div style={{ display:'flex', gap:5, alignItems:'center', marginBottom:4 }}>
                  <span style={{ fontSize:'9px', fontWeight:700, padding:'1px 7px', borderRadius:'4px', background:'rgba(0,170,255,0.10)', color:'#00AAFF', textTransform:'uppercase', letterSpacing:'0.04em' }}>{item.type||'copy'}</span>
                  {item.platform && <span style={{ fontSize:'9px', color:'rgba(255,255,255,0.20)' }}>{item.platform}</span>}
                  <span style={{ fontSize:'9px', color:'rgba(255,255,255,0.15)', marginLeft:'auto' }}>{item.credits_used}cr</span>
                </div>
                {item.body && (
                  <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.40)', lineHeight:1.5, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as const }}>
                    {item.body}
                  </div>
                )}
              </div>
            </div>
          )) : (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', padding:'40px 16px', gap:'10px' }}>
              <div style={{ color:'rgba(255,255,255,0.15)', display:'flex' }}>{Ic.copy}</div>
              <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.20)', lineHeight:1.7 }}>{isArabic ? 'كل ما تنتجه Nexa يظهر هنا.' : 'Every piece you create appears here.'}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function StudioPage() {
  return (
    <Suspense fallback={<div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - var(--topbar-h))', color:'rgba(255,255,255,0.25)', fontSize:'13px' }}>لحظة...</div>}>
      <StudioInner/>
    </Suspense>
  )
}
