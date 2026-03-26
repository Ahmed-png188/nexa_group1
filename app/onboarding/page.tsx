'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Step = 'segment' | 'username' | 'workspace' | 'voice' | 'upload' | 'analyzing' | 'reveal' | 'done'
type Segment = 'creator' | 'freelancer' | 'business' | 'agency'

interface BrandAnalysis {
  brand_voice: string; brand_audience: string; brand_tone: string
  content_pillars: string[]; top_angles: string[]; content_angles?: string[]
  voice_match_score: number; audience_fit_score: number; visual_style_score: number
  voice_score?: number; first_post_hook: string; first_post_body: string
}

const SEGMENTS_EN = [
  { id:'creator'    as Segment, label:'Creator',    sub:'Content, audience, influence', icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  { id:'freelancer' as Segment, label:'Freelancer', sub:'Services, clients, rates',     icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { id:'business'   as Segment, label:'Business',   sub:'Products, revenue, growth',    icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { id:'agency'     as Segment, label:'Agency',     sub:'Team, clients, scale',         icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
]
const SEGMENTS_AR = [
  { id:'creator'    as Segment, label:'كريتور',     sub:'محتوى، جمهور، تأثير',          icon:SEGMENTS_EN[0].icon },
  { id:'freelancer' as Segment, label:'فريلانسر',   sub:'خدمات، عملاء، أسعار',          icon:SEGMENTS_EN[1].icon },
  { id:'business'   as Segment, label:'بيزنس',      sub:'منتجات، إيراد، نمو',           icon:SEGMENTS_EN[2].icon },
  { id:'agency'     as Segment, label:'وكالة',      sub:'فريق، عملاء، تمدّد',           icon:SEGMENTS_EN[3].icon },
]

function AnalyzingSteps({ isArabic = false }: { isArabic?: boolean }) {
  const steps = isArabic
    ? ['يقرأ محتواك...', 'يستخرج صوتك...', 'يبني ملف جمهورك...', 'يضبط نبرتك...', 'يرسم زوايا المحتوى...', '.Brand Brain جاهز']
    : ['Reading your content...','Extracting your voice...','Building your audience profile...','Calibrating your tone...','Mapping your content angles...','Brand Brain is ready.']
  const [visible, setVisible] = useState<number[]>([])
  useEffect(() => { steps.forEach((_,i) => setTimeout(() => setVisible(p=>[...p,i]), i*800+200)) }, [])
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      {steps.map((s,i) => { const v=visible.includes(i),last=i===steps.length-1,done=last&&v; return (
        <div key={i} style={{display:'flex',alignItems:'center',gap:10,opacity:v?1:0,transform:v?'translateY(0)':'translateY(6px)',transition:'all 0.4s ease'}}>
          <div style={{width:20,height:20,borderRadius:'50%',flexShrink:0,background:done?'var(--success-dim)':'var(--cyan-dim)',border:`1px solid ${done?'var(--success-border)':'var(--cyan-border)'}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
            {done ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : v ? <div style={{width:5,height:5,borderRadius:'50%',background:'var(--cyan)'}}/>
                      : null}
          </div>
          <span style={{fontFamily:'var(--sans)',fontSize:13,color:done?'var(--success)':'var(--text-2)',fontWeight:done?600:400}}>{s}</span>
        </div>
      )})}
    </div>
  )
}

export default function OnboardingPage() {
  const [step,setStep]                   = useState<Step>('segment')
  const [segment,setSegment]             = useState<Segment|null>(null)
  const [workspaceName,setWorkspaceName] = useState('')
  const [brandName,setBrandName]         = useState('')
  const [brandWebsite,setBrandWebsite]   = useState('')
  const [brandVoice,setBrandVoice]       = useState('')
  const [brandAudience,setBrandAudience] = useState('')
  const [files,setFiles]                 = useState<File[]>([])
  const [isDragging,setIsDragging]       = useState(false)
  const [analysis,setAnalysis]           = useState<BrandAnalysis|null>(null)
  const [workspaceId,setWorkspaceId]     = useState<string|null>(null)
  const [analyzeError,setAnalyzeError]   = useState<string|null>(null)
  const [error,setError]                 = useState<string|null>(null)
  const [usernameSlug,setUsernameSlug]   = useState('')
  const [slugAvailable,setSlugAvailable] = useState<boolean|null>(null)
  const [slugClaimed,setSlugClaimed]     = useState(false)
  const [lang,setLang]                   = useState<'en'|'ar'>('en')
  const fileRef = useRef<HTMLInputElement>(null)
  const router  = useRouter()
  const supabase = createClient()

  const isArabic = lang === 'ar'
  const AR = "'Tajawal', system-ui, sans-serif"
  const EN = "'Geist', -apple-system, sans-serif"
  const font = isArabic ? AR : EN
  const SEGMENTS = isArabic ? SEGMENTS_AR : SEGMENTS_EN

  useEffect(() => {
    try {
      const stored = localStorage.getItem('nexa_lang')
      if (stored === 'ar' || stored === 'en') setLang(stored)
    } catch {}
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({data:{user}}) => {
      if (!user) return
      supabase.from('workspace_members').select('workspace_id').eq('user_id',user.id).limit(1).single()
        .then(({data}) => { if (data?.workspace_id) router.replace('/dashboard') })
    })
  }, [])

  useEffect(() => {
    if (step === 'done') {
      if (workspaceId) fetch('/api/generate-strategy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspace_id:workspaceId})}).catch(()=>{})
      setTimeout(()=>router.push('/dashboard'),1600)
    }
  }, [step])

  async function checkSlug() {
    if (!usernameSlug||usernameSlug.length<2) return
    const {data} = await supabase.from('workspaces').select('id').eq('slug',usernameSlug).single()
    setSlugAvailable(!data)
  }

  async function handleCreateWorkspace(e: React.FormEvent) {
    e.preventDefault(); setError(null)
    const res = await fetch('/api/create-workspace',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspaceName,brandName,brandWebsite})})
    const data = await res.json()
    if (!res.ok) { setError('Something went wrong. Please try again.'); return }
    const wsId = data.workspace.id; setWorkspaceId(wsId)
    if (segment) await supabase.from('workspaces').update({segment}).eq('id',wsId)
    if (usernameSlug&&slugAvailable) await supabase.from('workspaces').update({slug:usernameSlug}).eq('id',wsId)
    setStep('voice')
  }

  async function handleVoiceContinue(e: React.FormEvent) {
    e.preventDefault()
    if (!workspaceId) return
    await supabase.from('workspaces').update({brand_voice:brandVoice.trim(),brand_audience:brandAudience.trim()}).eq('id',workspaceId)
    setStep('upload')
  }

  function addFiles(fl: FileList|null) {
    if (!fl) return
    const n = Array.from(fl)
    setFiles(p => { const e = new Set(p.map(f=>f.name+f.size)); return [...p,...n.filter(f=>!e.has(f.name+f.size))] })
  }

  async function handleAnalyze() {
    if (!workspaceId) return
    setAnalyzeError(null); setStep('analyzing')
    const fp: {name:string;type:string;base64:string}[] = []
    for (const f of files) {
      try { const b64 = await new Promise<string>((res,rej)=>{ const r=new FileReader(); r.onload=()=>res((r.result as string).split(',')[1]||''); r.onerror=rej; r.readAsDataURL(f) }); fp.push({name:f.name,type:f.type,base64:b64}) } catch {}
    }
    try {
      const res = await fetch('/api/analyze-brand',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspace_id:workspaceId,website_url:brandWebsite,brand_name:brandName||workspaceName,brand_voice:brandVoice,brand_audience:brandAudience,files:fp})})
      if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(e.error||'Failed') }
      const data = await res.json(); setAnalysis(data.analysis)
      await new Promise(r=>setTimeout(r,600)); setStep('reveal')
    } catch { setAnalyzeError('Analysis failed. Check your connection and try again.'); setStep('upload') }
  }

  const VSTEPS: Step[] = ['segment','username','workspace','voice','upload']
  const vIdx = VSTEPS.indexOf(step)
  const topLine = <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,var(--cyan-border),transparent)'}}/>

  return (
    <>
      <style dangerouslySetInnerHTML={{__html:`
        @keyframes ob-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .ob-card{animation:ob-up 0.4s cubic-bezier(0.22,1,0.36,1) both}
        .ob-inp{width:100%;padding:10px 14px;font-size:13px;font-family:var(--sans);background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--r);color:var(--text-1);outline:none;transition:border-color 0.15s,box-shadow 0.15s;box-sizing:border-box}
        .ob-inp:focus{border-color:var(--border-focus);box-shadow:0 0 0 3px rgba(255,255,255,0.04)}
        .ob-inp::placeholder{color:var(--text-4)}
        .ob-ta{resize:vertical;line-height:1.65;min-height:80px}
      `}}/>

      {/* ANALYZING */}
      {step==='analyzing'&&(
        <div style={{position:'fixed',inset:0,background:'var(--bg)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:500,height:400,borderRadius:'50%',background:'radial-gradient(ellipse,var(--cyan-dim) 0%,transparent 70%)',pointerEvents:'none'}}/>
          <div style={{position:'relative',zIndex:1,textAlign:'center',maxWidth:400,padding:'0 24px'}}>
            <div style={{width:44,height:44,borderRadius:12,background:'var(--cyan-dim)',border:'1px solid var(--cyan-border)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 32px',color:'var(--cyan)'}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9.5 2a2.5 2.5 0 0 1 5 0"/><path d="M9.5 22a2.5 2.5 0 0 0 5 0"/><path d="M14.5 2C17 2 19 4 19 6.5c0 2-1.5 3.5-3.5 4C17 11 19 12.5 19 15c0 2.5-2 4.5-4.5 4.5"/><path d="M9.5 2C7 2 5 4 5 6.5c0 2 1.5 3.5 3.5 4C7 11 5 12.5 5 15c0 2.5 2 4.5 4.5 4.5"/></svg>
            </div>
            <AnalyzingSteps isArabic={isArabic}/>
          </div>
        </div>
      )}

      {/* REVEAL */}
      {step==='reveal'&&analysis&&(
        <div style={{position:'fixed',inset:0,background:'var(--bg)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px',zIndex:100,overflowY:'auto'}}>
          <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:500,height:400,borderRadius:'50%',background:'radial-gradient(ellipse,var(--cyan-dim) 0%,transparent 70%)',pointerEvents:'none'}}/>
          <div style={{position:'relative',zIndex:1,textAlign:'center',maxWidth:500,animation:'ob-up 0.5s ease both'}}>
            <div style={{fontSize:10,fontWeight:600,letterSpacing:isArabic?0:'0.1em',textTransform:'uppercase' as const,color:'var(--text-3)',marginBottom:8}}>Brand Brain · Active</div>
            <div style={{fontSize:80,fontWeight:700,color:'var(--text-1)',letterSpacing:isArabic?0:'-0.05em',lineHeight:1,marginBottom:4,fontFamily:'var(--sans)'}}>
              {analysis.voice_score||analysis.voice_match_score||94}
            </div>
            <div style={{fontSize:14,color:'var(--text-3)',marginBottom:32}}>% voice match</div>
            {analysis.brand_voice&&(
              <div className="card" style={{marginBottom:20,fontStyle:'italic',fontSize:14,color:'var(--text-2)',lineHeight:1.75,textAlign:'left'}}>
                &ldquo;{analysis.brand_voice}&rdquo;
              </div>
            )}
            {(analysis.content_angles||analysis.top_angles||[]).slice(0,3).length>0&&(
              <div style={{marginBottom:32}}>
                <div style={{fontSize:10,fontWeight:600,letterSpacing:isArabic?0:'0.08em',textTransform:'uppercase' as const,color:'var(--text-3)',marginBottom:12}}>Your top content angles</div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {(analysis.content_angles||analysis.top_angles||[]).slice(0,3).map((a,i)=>(
                    <div key={i} className="card-accent" style={{padding:'10px 14px',display:'flex',alignItems:'flex-start',gap:10,textAlign:'left'}}>
                      <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--cyan)',flexShrink:0,marginTop:1}}>0{i+1}</div>
                      <div style={{fontSize:13,color:'var(--text-2)',lineHeight:1.55}}>{a}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={async()=>{setStep('done');try{await fetch('/api/generate-strategy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspace_id:workspaceId})})}catch{}}} className="btn-primary" style={{width:'100%',padding:'12px',fontSize:14}}>
              Let&apos;s build your strategy →
            </button>
            <div style={{marginTop:10,fontSize:12,color:'var(--text-3)'}}>Your 30-day content plan is generating in the background</div>
          </div>
        </div>
      )}

      {/* MAIN */}
      <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px 16px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'fixed',top:0,left:'50%',transform:'translateX(-50%)',width:800,height:500,background:'radial-gradient(ellipse 60% 40% at 50% 0%,var(--cyan-dim) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{width:'100%',maxWidth:480,position:'relative',zIndex:1}}>

          {/* Logo */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:9,marginBottom:28}}>
            <img src="/favicon.png" alt="Nexa" style={{width:26,height:26,borderRadius:6}}/>
            <span style={{fontFamily:'var(--sans)',fontWeight:700,fontSize:15,color:'var(--text-1)',letterSpacing:isArabic?0:'-0.02em'}}>Nexa</span>
          </div>

          {/* Progress */}
          {!['analyzing','reveal','done'].includes(step)&&(
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:5,marginBottom:24}}>
              {VSTEPS.map((s,i)=>(
                <div key={s} style={{height:3,borderRadius:2,width:step===s?28:8,background:vIdx>i?'var(--cyan)':step===s?'var(--cyan)':'var(--border)',transition:'all 0.35s ease',opacity:vIdx>i?0.5:1}}/>
              ))}
            </div>
          )}

          {/* SEGMENT */}
          {step==='segment'&&(
            <div className="ob-card card" style={{padding:'32px 28px',position:'relative',overflow:'hidden'}}>
              {topLine}
              <h1 style={{fontSize:22,fontWeight:700,letterSpacing:isArabic?0:'-0.03em',color:'var(--text-1)',textAlign:'center',marginBottom:6}}>What best describes you?</h1>
              <p style={{fontSize:13,color:'var(--text-3)',textAlign:'center',lineHeight:1.6,marginBottom:24}}>Nexa tailors everything to your business type.</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:24}}>
                {SEGMENTS.map(s=>{const sel=segment===s.id;return(
                  <button key={s.id} onClick={()=>setSegment(s.id)} style={{padding:'18px 16px',borderRadius:'var(--r)',background:sel?'var(--cyan-dim)':'rgba(255,255,255,0.03)',border:`1px solid ${sel?'var(--cyan-border)':'var(--border)'}`,cursor:'pointer',textAlign:'left',transition:'all 0.15s',outline:'none'}}>
                    <div style={{color:sel?'var(--cyan)':'var(--text-3)',display:'flex',marginBottom:10}}>{s.icon}</div>
                    <div style={{fontSize:14,fontWeight:600,color:sel?'var(--text-1)':'var(--text-2)',marginBottom:3,letterSpacing:isArabic?0:'-0.01em'}}>{s.label}</div>
                    <div style={{fontSize:11,color:sel?'var(--cyan)':'var(--text-3)',lineHeight:1.4}}>{s.sub}</div>
                  </button>
                )})}
              </div>
              <button onClick={()=>{if(segment)setStep('username')}} className="btn-primary" style={{width:'100%',padding:'11px',fontSize:13,opacity:segment?1:0.4,fontFamily:font}}>
                {isArabic ? 'تابع ←' : 'Continue →'}
              </button>
            </div>
          )}

          {/* USERNAME */}
          {step==='username'&&(
            <div className="ob-card card" style={{padding:'32px 28px',position:'relative',overflow:'hidden'}}>
              {topLine}
              <h1 style={{fontSize:22,fontWeight:700,letterSpacing:isArabic?0:'-0.03em',color:'var(--text-1)',textAlign:'center',marginBottom:6}}>Claim your lead page</h1>
              <p style={{fontSize:13,color:'var(--text-3)',textAlign:'center',lineHeight:1.6,marginBottom:24}}>Your public page captures leads from your content 24/7.</p>
              <div style={{marginBottom:20}}>
                <div style={{fontSize:11,color:'var(--text-3)',marginBottom:8}}>Your page will be at:</div>
                <div style={{display:'flex',alignItems:'center',background:'rgba(255,255,255,0.04)',border:`1px solid ${slugAvailable===false?'var(--error-border)':slugAvailable===true?'var(--success-border)':'var(--border)'}`,borderRadius:'var(--r)',overflow:'hidden'}}>
                  <div style={{padding:'10px 12px',fontSize:13,color:'var(--text-3)',fontFamily:'var(--mono)',borderRight:'1px solid var(--border-subtle)',whiteSpace:'nowrap' as const,flexShrink:0}}>nexaa.cc/</div>
                  <input value={usernameSlug} onChange={e=>{setUsernameSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,30));setSlugAvailable(null)}} onBlur={checkSlug} placeholder="yourname"
                    style={{flex:1,padding:'10px 12px',fontSize:13,background:'transparent',border:'none',color:'var(--text-1)',outline:'none',fontFamily:'var(--sans)'}}/>
                  {slugAvailable===true&&<div style={{padding:'0 12px',color:'var(--success)',fontSize:12,fontWeight:700}}>✓</div>}
                  {slugAvailable===false&&<div style={{padding:'0 12px',color:'var(--error)',fontSize:12,fontWeight:700}}>✗</div>}
                </div>
                {slugAvailable===false&&<div style={{fontSize:11,color:'var(--error)',marginTop:6}}>This username is taken. Try another.</div>}
                {slugAvailable===true&&<div style={{fontSize:11,color:'var(--success)',marginTop:6}}>nexaa.cc/{usernameSlug} is available!</div>}
              </div>
              {slugClaimed&&(
                <div className="card-success" style={{textAlign:'center',marginBottom:16}}>
                  <div style={{fontSize:14,fontWeight:600,color:'var(--success)',marginBottom:4}}>nexaa.cc/{usernameSlug} is yours!</div>
                  <div style={{fontSize:12,color:'var(--text-2)'}}>Reserved. Continue to set up your workspace.</div>
                </div>
              )}
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>setStep('workspace')} className="btn-secondary" style={{flex:1,padding:'10px 14px',fontSize:13}}>{slugClaimed?'Continue →':'Skip for now'}</button>
                {!slugClaimed&&(<button onClick={()=>{if(slugAvailable&&usernameSlug.length>=2)setSlugClaimed(true);else setStep('workspace')}} disabled={usernameSlug.length>=2&&slugAvailable===false} className="btn-primary" style={{flex:2,padding:'10px 14px',fontSize:13,opacity:usernameSlug.length<2?0.5:1}}>{usernameSlug.length>=2?'Claim it →':'Continue →'}</button>)}
              </div>
            </div>
          )}

          {/* WORKSPACE */}
          {step==='workspace'&&(
            <div className="ob-card card" style={{padding:'32px 28px',position:'relative',overflow:'hidden'}}>
              {topLine}
              <h1 style={{fontSize:22,fontWeight:700,letterSpacing:isArabic?0:'-0.03em',color:'var(--text-1)',textAlign:'center',marginBottom:6}}>What business are you building?</h1>
              <p style={{fontSize:13,color:'var(--text-3)',textAlign:'center',lineHeight:1.6,marginBottom:24}}>Takes 2 minutes. This powers everything Nexa creates.</p>
              <form onSubmit={handleCreateWorkspace} style={{display:'flex',flexDirection:'column',gap:14}}>
                <div><label style={{display:'block',fontSize:11,fontWeight:600,color:'var(--text-3)',marginBottom:7,fontFamily:font}}>{isArabic ? <>اسم البراند <span style={{color:'var(--cyan)',fontWeight:500}}>مطلوب</span></> : <>Brand name <span style={{color:'var(--cyan)',fontWeight:500}}>required</span></>}</label><input className="ob-inp" type="text" placeholder={isArabic ? 'مثال: براند أحمد عادل' : 'e.g. Ahmed Adil Brand'} value={brandName} onChange={e=>setBrandName(e.target.value)} required style={{direction:isArabic?'rtl':'ltr',fontFamily:font}}/></div>
                <div><label style={{display:'block',fontSize:11,fontWeight:600,color:'var(--text-3)',marginBottom:7,fontFamily:font}}>{isArabic ? <>اسم مساحة العمل <span style={{color:'var(--text-4)',fontWeight:400}}>ممكن يطابق البراند</span></> : <>Workspace name <span style={{color:'var(--text-4)',fontWeight:400}}>can match brand</span></>}</label><input className="ob-inp" type="text" placeholder={isArabic ? 'مثال: مساحتي' : 'e.g. My Workspace'} value={workspaceName} onChange={e=>setWorkspaceName(e.target.value)} required style={{direction:isArabic?'rtl':'ltr',fontFamily:font}}/></div>
                <div><label style={{display:'block',fontSize:11,fontWeight:600,color:'var(--text-3)',marginBottom:7,fontFamily:font}}>{isArabic ? <>الموقع <span style={{color:'var(--text-4)',fontWeight:400}}>اختياري</span></> : <>Website <span style={{color:'var(--text-4)',fontWeight:400}}>optional</span></>}</label><input className="ob-inp" type="text" placeholder="https://yourbrand.com" value={brandWebsite} onChange={e=>setBrandWebsite(e.target.value)} style={{direction:'ltr',fontFamily:font}}/></div>
                {error&&<div className="error-state" style={{fontSize:12}}>{error}</div>}
                <button type="submit" className="btn-primary" style={{width:'100%',padding:'11px',fontSize:13}}>Continue →</button>
              </form>
            </div>
          )}

          {/* VOICE */}
          {step==='voice'&&(
            <div className="ob-card card" style={{padding:'32px 28px',position:'relative',overflow:'hidden'}}>
              {topLine}
              <h1 style={{fontSize:22,fontWeight:700,letterSpacing:isArabic?0:'-0.03em',color:'var(--text-1)',textAlign:'center',marginBottom:6}}>Define your market position</h1>
              <p style={{fontSize:13,color:'var(--text-3)',textAlign:'center',lineHeight:1.6,marginBottom:24}}>The minimum Nexa needs to write in your voice and win clients.</p>
              <form onSubmit={handleVoiceContinue} style={{display:'flex',flexDirection:'column',gap:16}}>
                <div><label style={{display:'block',fontSize:11,fontWeight:600,color:'var(--text-3)',marginBottom:7,fontFamily:font}}>{isArabic ? <>كيف تريد أن تظهر؟ <span style={{color:'var(--cyan)',fontWeight:500}}>مطلوب</span></> : <>How do you want to show up? <span style={{color:'var(--cyan)',fontWeight:500}}>required</span></>}</label><textarea className="ob-inp ob-ta" placeholder={isArabic ? 'مثال: مباشر، واثق، بلا حشو. جمل قصيرة، بعيد عن اللغة الرسمية الجافة.' : 'e.g. Direct, no-fluff, confident. Short sentences, never corporate language.'} value={brandVoice} onChange={e=>setBrandVoice(e.target.value)} required rows={4} style={{direction:isArabic?'rtl':'ltr',fontFamily:font}}/></div>
                <div><label style={{display:'block',fontSize:11,fontWeight:600,color:'var(--text-3)',marginBottom:7,fontFamily:font}}>{isArabic ? <>مين عميلك المثالي؟ <span style={{color:'var(--cyan)',fontWeight:500}}>مطلوب</span></> : <>Who is your ideal client? <span style={{color:'var(--cyan)',fontWeight:500}}>required</span></>}</label><textarea className="ob-inp ob-ta" placeholder={isArabic ? 'مثال: رواد أعمال خليجيون، ٢٥-٤٠ سنة، يبنون مشاريع حقيقية ويريدون نتائج ملموسة.' : 'e.g. B2B founders, 28–45, building real companies. They want tactics that actually close deals.'} value={brandAudience} onChange={e=>setBrandAudience(e.target.value)} required rows={3} style={{direction:isArabic?'rtl':'ltr',fontFamily:font}}/></div>
                <button type="submit" className="btn-primary" style={{width:'100%',padding:'11px',fontSize:13,opacity:(brandVoice.trim().length>10&&brandAudience.trim().length>10)?1:0.45}}>Continue →</button>
              </form>
            </div>
          )}

          {/* UPLOAD */}
          {step==='upload'&&(
            <div className="ob-card card" style={{padding:'32px 28px',position:'relative',overflow:'hidden'}}>
              {topLine}
              <h1 style={{fontSize:22,fontWeight:700,letterSpacing:isArabic?0:'-0.03em',color:'var(--text-1)',textAlign:'center',marginBottom:6}}>Upload brand assets</h1>
              <p style={{fontSize:13,color:'var(--text-3)',textAlign:'center',lineHeight:1.6,marginBottom:22}}>Logo, sample posts, brand doc. Optional — add more later.</p>
              <div onDrop={e=>{e.preventDefault();setIsDragging(false);addFiles(e.dataTransfer.files)}} onDragOver={e=>{e.preventDefault();setIsDragging(true)}} onDragLeave={()=>setIsDragging(false)} onClick={()=>fileRef.current?.click()}
                style={{padding:files.length>0?'12px 16px':'28px 20px',border:`1px dashed ${isDragging?'var(--cyan)':files.length>0?'var(--cyan-border)':'var(--border)'}`,borderRadius:'var(--r)',textAlign:'center',cursor:'pointer',transition:'all 0.15s',background:isDragging?'var(--cyan-dim)':'transparent',marginBottom:10}}>
                {files.length===0?(<><div style={{fontSize:13,color:'var(--text-2)',fontWeight:500,marginBottom:4}}>{isArabic?'اضغط أو اسحب ملفاتك هنا':'Click or drag files here'}</div><div style={{fontSize:11,color:'var(--text-3)'}}>{isArabic?'PNG، JPG، PDF، DOCX':'PNG, JPG, PDF, DOCX'}</div></>):(<div style={{fontSize:12,color:'var(--text-3)'}}>{isArabic?'+ أضف المزيد':'+ Add more files'}</div>)}
                <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.docx,.txt" onChange={e=>addFiles(e.target.files)} onClick={e=>{(e.target as HTMLInputElement).value=''}} style={{display:'none'}}/>
              </div>
              {files.length>0&&(
                <div style={{display:'flex',flexDirection:'column',gap:5,marginBottom:14}}>
                  {files.map((f,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:9,padding:'7px 12px',background:'var(--cyan-dim)',border:'1px solid var(--cyan-border)',borderRadius:'var(--r-sm)'}}>
                      <span style={{flex:1,fontSize:12,color:'var(--text-2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</span>
                      <button onClick={e=>{e.stopPropagation();setFiles(p=>p.filter((_,j)=>j!==i))}} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-3)',padding:2,display:'flex'}}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {analyzeError&&<div className="error-state" style={{marginBottom:14,fontSize:12}}>{analyzeError}</div>}
              <button onClick={handleAnalyze} className="btn-primary" style={{width:'100%',padding:'11px',fontSize:13}}>
                {files.length>0?`Analyze brand + ${files.length} file${files.length>1?'s':''} →`:'Analyze my brand →'}
              </button>
            </div>
          )}

          {/* DONE */}
          {step==='done'&&(
            <div className="ob-card card" style={{padding:'32px 28px',textAlign:'center'}}>
              <div style={{width:52,height:52,borderRadius:'50%',background:'var(--success-dim)',border:'1px solid var(--success-border)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px'}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h1 style={{fontSize:22,fontWeight:700,letterSpacing:isArabic?0:'-0.03em',color:'var(--text-1)',marginBottom:8}}>All set — building your workspace</h1>
              <p style={{fontSize:13,color:'var(--text-3)',lineHeight:1.65}}>Taking you to your dashboard…</p>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
