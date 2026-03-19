'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Step = 'segment' | 'username' | 'workspace' | 'voice' | 'upload' | 'analyzing' | 'reveal' | 'done'
type Segment = 'creator' | 'freelancer' | 'business' | 'agency'

interface BrandAnalysis {
  brand_voice: string
  brand_audience: string
  brand_tone: string
  content_pillars: string[]
  top_angles: string[]
  content_angles?: string[]
  voice_match_score: number
  audience_fit_score: number
  visual_style_score: number
  voice_score?: number
  first_post_hook: string
  first_post_body: string
}

const SEGMENTS: { id: Segment; label: string; sub: string; color: string; emoji: string }[] = [
  { id: 'creator',    label: 'Creator',    sub: 'Content, audience, influence',   color: '#A78BFA', emoji: '✦' },
  { id: 'freelancer', label: 'Freelancer', sub: 'Services, clients, rates',        color: '#4D9FFF', emoji: '⌖' },
  { id: 'business',   label: 'Business',   sub: 'Products, revenue, growth',       color: '#34D399', emoji: '◆' },
  { id: 'agency',     label: 'Agency',     sub: 'Team, clients, scale',            color: '#FF7A40', emoji: '⬡' },
]

/* ── Animated analyzing steps component ── */
function AnalyzingSteps() {
  const steps = [
    'Reading your content...',
    'Extracting your voice...',
    'Building your audience profile...',
    'Calibrating your tone...',
    'Mapping your content angles...',
    'Brand Brain is ready.',
  ]
  const [visibleSteps, setVisibleSteps] = useState<number[]>([])
  const [allDone, setAllDone] = useState(false)

  useEffect(() => {
    steps.forEach((_, i) => {
      setTimeout(() => {
        setVisibleSteps(prev => [...prev, i])
        if (i === steps.length - 1) {
          setTimeout(() => setAllDone(true), 400)
        }
      }, i * 800 + 200)
    })
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {steps.map((step, i) => (
        <div
          key={i}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            opacity: visibleSteps.includes(i) ? 1 : 0,
            transform: visibleSteps.includes(i) ? 'translateY(0)' : 'translateY(8px)',
            transition: 'all 0.4s ease',
          }}
        >
          <div style={{
            width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
            background: i === steps.length - 1 && visibleSteps.includes(i)
              ? 'rgba(34,197,94,0.15)'
              : 'rgba(30,142,240,0.1)',
            border: `1px solid ${i === steps.length - 1 && visibleSteps.includes(i) ? 'rgba(34,197,94,0.3)' : 'rgba(30,142,240,0.2)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {i === steps.length - 1 && visibleSteps.includes(i) ? (
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            ) : visibleSteps.includes(i) && i < steps.length - 1 ? (
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4DABF7' }}/>
            ) : null}
          </div>
          <span style={{
            fontFamily: 'var(--sans)',
            fontSize: 14,
            color: i === steps.length - 1 && visibleSteps.includes(i)
              ? '#4ADE80'
              : 'rgba(255,255,255,0.65)',
            fontWeight: i === steps.length - 1 && visibleSteps.includes(i) ? 600 : 400,
          }}>
            {step}
          </span>
        </div>
      ))}
      {allDone && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, opacity: 1, transition: 'opacity 0.4s ease' }}>
          {[0,1,2].map(d => (
            <div key={d} style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'rgba(30,142,240,0.5)',
              animation: `pulse 1.2s ease-in-out ${d * 0.2}s infinite`,
            }}/>
          ))}
          <style>{`@keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
        </div>
      )}
    </div>
  )
}

export default function OnboardingPage() {
  const [step, setStep]                   = useState<Step>('segment')
  const [segment, setSegment]             = useState<Segment | null>(null)
  const [workspaceName, setWorkspaceName] = useState('')
  const [brandName, setBrandName]         = useState('')
  const [brandWebsite, setBrandWebsite]   = useState('')
  const [brandVoice, setBrandVoice]       = useState('')
  const [brandAudience, setBrandAudience] = useState('')
  const [files, setFiles]                 = useState<File[]>([])
  const [isDragging, setIsDragging]       = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisStage, setAnalysisStage] = useState('')
  const [analysis, setAnalysis]           = useState<BrandAnalysis | null>(null)
  const [workspaceId, setWorkspaceId]     = useState<string | null>(null)
  const [analyzeError, setAnalyzeError]   = useState<string | null>(null)
  const [error, setError]                 = useState<string | null>(null)
  const [scores, setScores]               = useState({ voice: 0, audience: 0, visual: 0 })
  const [usernameSlug, setUsernameSlug]   = useState('')
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [slugClaimed, setSlugClaimed]     = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router  = useRouter()
  const supabase = createClient()

  // Redirect if user already has a workspace
  useEffect(() => {
    async function checkExistingWorkspace() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()
      if (data?.workspace_id) router.replace('/dashboard')
    }
    checkExistingWorkspace()
  }, [])

  useEffect(() => {
    if (step === 'done' && analysis) {
      const t = setTimeout(() => setScores({
        voice:    analysis.voice_match_score,
        audience: analysis.audience_fit_score,
        visual:   analysis.visual_style_score,
      }), 300)
      return () => clearTimeout(t)
    }
  }, [step, analysis])

  useEffect(() => {
    if (step === 'done') {
      if (workspaceId) {
        fetch('/api/generate-strategy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspace_id: workspaceId }),
        }).catch(() => {})
      }
      setTimeout(() => router.push('/dashboard'), 1800)
    }
  }, [step])

  async function checkSlugAvailability() {
    if (!usernameSlug || usernameSlug.length < 2) return
    const { data } = await supabase
      .from('workspaces')
      .select('id')
      .eq('slug', usernameSlug)
      .single()
    setSlugAvailable(!data)
  }

  async function handleCreateWorkspace(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const res = await fetch('/api/create-workspace', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceName, brandName, brandWebsite }),
    })

    const data = await res.json()
    if (!res.ok) { setError('Something went wrong. Please try again.'); return }

    const wsId = data.workspace.id
    setWorkspaceId(wsId)

    // Save segment to workspace
    if (segment) {
      await supabase.from('workspaces').update({ segment }).eq('id', wsId)
    }

    // Save claimed slug if available
    if (usernameSlug && slugAvailable) {
      await supabase.from('workspaces').update({ slug: usernameSlug }).eq('id', wsId)
    }

    setStep('voice')
  }

  async function handleVoiceContinue(e: React.FormEvent) {
    e.preventDefault()
    if (!workspaceId) return
    await supabase.from('workspaces').update({
      brand_voice:    brandVoice.trim(),
      brand_audience: brandAudience.trim(),
    }).eq('id', workspaceId)
    setStep('upload')
  }

  function addFiles(incoming: FileList | null) {
    if (!incoming) return
    const newFiles = Array.from(incoming)
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size))
      return [...prev, ...newFiles.filter(f => !existing.has(f.name + f.size))]
    })
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }

  async function handleAnalyze() {
    if (!workspaceId) return
    setAnalyzeError(null)
    setStep('analyzing')
    setAnalysisProgress(0)

    const stages = [
      { progress: 12, label: 'Reading your brand...' },
      { progress: 28, label: 'Extracting voice patterns...' },
      { progress: 45, label: 'Mapping audience psychology...' },
      { progress: 62, label: 'Building content pillars...' },
      { progress: 76, label: 'Calibrating brand DNA...' },
      { progress: 89, label: 'Generating your first post...' },
    ]

    let stageIndex = 0
    const iv = setInterval(() => {
      if (stageIndex < stages.length) {
        setAnalysisProgress(stages[stageIndex].progress)
        setAnalysisStage(stages[stageIndex].label)
        stageIndex++
      } else {
        setAnalysisProgress(prev => prev < 95 ? +(prev + 0.3).toFixed(1) : prev)
      }
    }, 1800)

    const filePayloads: { name: string; type: string; base64: string }[] = []
    for (const file of files) {
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload  = () => resolve((reader.result as string).split(',')[1] || '')
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        filePayloads.push({ name: file.name, type: file.type, base64 })
      } catch { /* skip */ }
    }

    try {
      const res = await fetch('/api/analyze-brand', {
        method: 'POST',
      credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id:   workspaceId,
          website_url:    brandWebsite,
          brand_name:     brandName || workspaceName,
          brand_voice:    brandVoice,
          brand_audience: brandAudience,
          files:          filePayloads,
        }),
      })

      clearInterval(iv)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Analysis failed')
      }

      const data = await res.json()
      setAnalysis(data.analysis)
      setAnalysisStage('Brand profile complete.')
      setAnalysisProgress(100)
      await new Promise(r => setTimeout(r, 800))
      setStep('reveal') // show reveal screen instead of going straight to done

    } catch {
      clearInterval(iv)
      setAnalyzeError('Analysis failed. Check your connection and try again.')
      setStep('upload')
      setAnalysisProgress(0)
    }
  }

  async function handleEnterDashboard() {
    if (workspaceId) await supabase.from('workspaces').update({ brand_onboarded: true }).eq('id', workspaceId)
    router.push('/dashboard')
  }

  const STEPS: Step[] = ['segment', 'username', 'workspace', 'voice', 'upload', 'analyzing', 'reveal', 'done']
  const stepIndex = STEPS.indexOf(step)

  return (
    <>
      <style>{`
        @keyframes fadeUp   { from { opacity:0;transform:translateY(16px) } to { opacity:1;transform:translateY(0) } }
        @keyframes breathe  { 0%,100% { opacity:1;transform:scale(1) } 50% { opacity:0.7;transform:scale(0.97) } }
        @keyframes pulse-ring { 0% { transform:scale(1);opacity:0.5 } 100% { transform:scale(1.6);opacity:0 } }
        .ob-card { animation: fadeUp 0.45s ease both }
        .ob-inp:focus { border-color: rgba(0,170,255,0.4) !important; box-shadow: 0 0 0 3px rgba(0,170,255,0.08) !important; }
        .ob-inp::placeholder { color: rgba(255,255,255,0.25) }
        .ob-inp { caret-color: #1E8EF0 }
        .ob-ta::placeholder { color: rgba(255,255,255,0.25) }
        .ob-ta { caret-color: #1E8EF0 }
        .ob-btn-primary:hover { background: #4DABF7 !important; transform: translateY(-1px) }
        .ob-btn-sec:hover { background: rgba(255,255,255,0.07) !important; border-color: rgba(255,255,255,0.18) !important }
      `}</style>

      {/* ── ANALYZING SCREEN ── */}
      {step === 'analyzing' && (
        <div style={{
          position: 'fixed', inset: 0,
          background: '#000',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          zIndex: 100,
        }}>
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.032,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '256px 256px', pointerEvents: 'none',
          }}/>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 400, height: 300, borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(30,142,240,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}/>
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 440, padding: '0 24px' }}>
            <svg width="40" height="40" viewBox="0 0 36 36" fill="none" style={{ marginBottom: 32 }}>
              <defs><linearGradient id="anlg" x1="3" y1="3" x2="33" y2="33" gradientUnits="userSpaceOnUse"><stop stopColor="#4DABF7"/><stop offset="1" stopColor="#0C5FBF"/></linearGradient></defs>
              <polygon points="3,33 9,3 17,3 11,33" fill="url(#anlg)"/>
              <polygon points="19,3 27,3 33,33 25,33" fill="url(#anlg)"/>
            </svg>
            <AnalyzingSteps />
          </div>
        </div>
      )}

      {/* ── REVEAL SCREEN ── */}
      {step === 'reveal' && analysis && (
        <div style={{
          position: 'fixed', inset: 0,
          background: '#000',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '40px 24px',
          zIndex: 100,
          overflow: 'hidden',
        }}>
          <div style={{ position:'absolute', inset:0, opacity:0.032, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize:'256px 256px', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:500, height:400, borderRadius:'50%', background:'radial-gradient(ellipse, rgba(30,142,240,0.07) 0%, transparent 70%)', pointerEvents:'none' }}/>

          <div style={{ position:'relative', zIndex:1, textAlign:'center', maxWidth:520, animation:'fadeUp 0.5s ease both' }}>
            <div style={{ marginBottom: 8, fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--sans)' }}>
              Brand Brain · Active
            </div>

            <div style={{ fontFamily: 'var(--mono)', fontSize: 80, fontWeight: 300, color: '#fff', letterSpacing: '-0.05em', lineHeight: 1, marginBottom: 4 }}>
              {analysis.voice_score || analysis.voice_match_score || 94}
            </div>
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginBottom: 32, fontFamily: 'var(--sans)' }}>% voice match</div>

            {analysis.brand_voice && (
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12,
                padding: '16px 20px',
                marginBottom: 20,
                fontStyle: 'italic',
                fontSize: 15,
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.7,
                fontFamily: 'var(--serif)',
              }}>
                &ldquo;{analysis.brand_voice}&rdquo;
              </div>
            )}

            {(analysis.content_angles || analysis.top_angles) && (analysis.content_angles || analysis.top_angles)!.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.3)', marginBottom: 12, fontFamily: 'var(--sans)' }}>
                  Your top content angles
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(analysis.content_angles || analysis.top_angles || []).slice(0, 3).map((angle: string, i: number) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '10px 14px',
                      background: 'rgba(30,142,240,0.04)',
                      border: '1px solid rgba(30,142,240,0.1)',
                      borderRadius: 9,
                      textAlign: 'left',
                    }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 300, color: '#4DABF7', flexShrink: 0, marginTop: 1 }}>0{i + 1}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55, fontFamily: 'var(--sans)' }}>{angle}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={async () => {
                setStep('done')
                try {
                  await fetch('/api/generate-strategy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ workspace_id: workspaceId }),
                  })
                } catch (e) {
                  console.error('[Onboarding] Strategy gen failed:', e)
                }
              }}
              style={{
                padding: '14px 40px',
                background: '#fff',
                border: 'none',
                borderRadius: 10,
                fontFamily: 'var(--display)',
                fontSize: 15, fontWeight: 800,
                color: '#000',
                cursor: 'pointer',
                letterSpacing: '-0.02em',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f0f0f0'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
            >
              Let&apos;s build your strategy →
            </button>

            <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--sans)' }}>
              Your 30-day content plan is generating in the background
            </div>
          </div>
        </div>
      )}

      <div style={{ minHeight:'100vh', background:'#000000', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'fixed', top:0, left:'50%', transform:'translateX(-50%)', width:900, height:600, background:'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,130,255,0.08) 0%, transparent 70%)', pointerEvents:'none' }}/>

        <div style={{ width:'100%', maxWidth:500, position:'relative', zIndex:1 }}>

          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:9, marginBottom:28 }}>
            <img src="/favicon.png" alt="Nexa" style={{ width:28, height:28, borderRadius:7 }} />
            <span style={{ fontFamily:'var(--display)', fontWeight:800, fontSize:16, color:'#ffffff', letterSpacing:'-0.03em' }}>Nexa</span>
          </div>

          {/* Progress dots — hide for fullscreen steps */}
          {step !== 'analyzing' && step !== 'reveal' && step !== 'done' && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:24 }}>
              {STEPS.filter(s => s !== 'analyzing' && s !== 'reveal' && s !== 'done').map((s, i, arr) => (
                <div key={s} style={{ height:3, borderRadius:2, width: step===s ? 28 : 8, background: arr.indexOf(step) > i ? 'rgba(30,142,240,0.55)' : step===s ? '#1E8EF0' : 'rgba(255,255,255,0.1)', transition:'all 0.35s ease' }}/>
              ))}
            </div>
          )}

          {/* ── SEGMENT ── */}
          {step === 'segment' && (
            <div className="ob-card" style={card}>
              <div style={topLine}/>
              <h1 style={h1}>What best describes you?</h1>
              <p style={{ ...sub, marginBottom:24 }}>Nexa tailors everything — strategy, content, voice — to your business type.</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:22 }}>
                {SEGMENTS.map(s => {
                  const selected = segment === s.id
                  return (
                    <button key={s.id} onClick={() => setSegment(s.id)}
                      style={{ padding:'18px 16px', borderRadius:12, background:selected?`${s.color}12`:'rgba(255,255,255,0.03)', border:`1px solid ${selected?s.color+'44':'rgba(255,255,255,0.1)'}`, cursor:'pointer', textAlign:'left', transition:'all 0.18s', outline:'none', boxShadow:selected?`0 0 0 1px ${s.color}22`:'none' }}>
                      <div style={{ marginBottom:10 }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background:s.color, boxShadow:`0 0 8px ${s.color}80` }}/>
                      </div>
                      <div style={{ fontFamily:'var(--display)', fontSize:15, fontWeight:800, color:selected?'#fff':'rgba(255,255,255,0.75)', marginBottom:3, letterSpacing:'-0.02em' }}>{s.label}</div>
                      <div style={{ fontSize:11, color:selected?`${s.color}cc`:'rgba(255,255,255,0.35)', lineHeight:1.4 }}>{s.sub}</div>
                    </button>
                  )
                })}
              </div>
              <button onClick={() => { if (segment) setStep('username') }} className="ob-btn-primary"
                style={{ ...btnPrimary, opacity: segment ? 1 : 0.5 }}>
                Continue →
              </button>
            </div>
          )}

          {/* ── USERNAME CLAIM ── */}
          {step === 'username' && (
            <div className="ob-card" style={card}>
              <div style={topLine}/>
              <h1 style={h1}>Claim your lead page</h1>
              <p style={{ ...sub, marginBottom: 24 }}>
                Your public page captures leads from your content 24/7.
              </p>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 8, fontFamily: 'var(--sans)' }}>
                  Your page will be at:
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${slugAvailable === false ? 'rgba(255,87,87,0.3)' : slugAvailable === true ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 10, overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '11px 14px',
                    fontSize: 14, color: 'rgba(255,255,255,0.35)',
                    fontFamily: 'var(--mono)', fontWeight: 300,
                    borderRight: '1px solid rgba(255,255,255,0.08)',
                    whiteSpace: 'nowrap' as const,
                    flexShrink: 0,
                  }}>
                    nexaa.cc/
                  </div>
                  <input
                    value={usernameSlug}
                    onChange={e => {
                      const clean = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30)
                      setUsernameSlug(clean)
                      setSlugAvailable(null)
                    }}
                    onBlur={checkSlugAvailability}
                    placeholder="yourname"
                    style={{
                      flex: 1, padding: '11px 14px',
                      fontSize: 14, background: 'transparent',
                      border: 'none', color: '#fff',
                      outline: 'none', fontFamily: 'var(--sans)',
                    }}
                  />
                  {slugAvailable === true && (
                    <div style={{ padding: '0 12px', color: '#4ADE80', fontSize: 12, fontWeight: 600 }}>✓</div>
                  )}
                  {slugAvailable === false && (
                    <div style={{ padding: '0 12px', color: '#FF5757', fontSize: 12, fontWeight: 600 }}>✗</div>
                  )}
                </div>
                {slugAvailable === false && (
                  <div style={{ fontSize: 11, color: '#FF5757', marginTop: 6, fontFamily: 'var(--sans)' }}>
                    This username is taken. Try another.
                  </div>
                )}
                {slugAvailable === true && (
                  <div style={{ fontSize: 11, color: '#4ADE80', marginTop: 6, fontFamily: 'var(--sans)' }}>
                    nexaa.cc/{usernameSlug} is available!
                  </div>
                )}
              </div>

              {slugClaimed ? (
                <div style={{ padding: '20px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700, color: '#4ADE80', marginBottom: 6 }}>nexaa.cc/{usernameSlug} is yours!</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--sans)' }}>Your lead page is reserved. Continue to set up your workspace.</div>
                </div>
              ) : null}

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setStep('workspace')}
                  className="ob-btn-sec"
                  style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontFamily: 'var(--sans)', fontSize: 13, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.18s' }}
                >
                  {slugClaimed ? 'Continue →' : 'Skip for now'}
                </button>
                {!slugClaimed && (
                  <button
                    onClick={() => {
                      if (slugAvailable && usernameSlug.length >= 2) {
                        setSlugClaimed(true)
                      } else {
                        setStep('workspace')
                      }
                    }}
                    disabled={usernameSlug.length >= 2 && slugAvailable === false}
                    className="ob-btn-primary"
                    style={{ ...btnPrimary, flex: 2, opacity: usernameSlug.length < 2 ? 0.5 : 1 }}
                  >
                    {usernameSlug.length >= 2 ? 'Claim it →' : 'Continue →'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── WORKSPACE ── */}
          {step === 'workspace' && (
            <div className="ob-card" style={card}>
              <div style={topLine}/>
              <h1 style={h1}>What business are you building?</h1>
              <p style={sub}>Takes 2 minutes. This powers everything Nexa creates to grow it.</p>
              <form onSubmit={handleCreateWorkspace} style={{ display:'flex', flexDirection:'column', gap:14, marginTop:26 }}>
                <div>
                  <label style={lbl}>Brand name <span style={req}>required</span></label>
                  <input className="ob-inp" type="text" placeholder="e.g. Ahmed Adil Brand" value={brandName} onChange={e => setBrandName(e.target.value)} required style={inp}/>
                </div>
                <div>
                  <label style={lbl}>Workspace name <span style={opt}>can match brand name</span></label>
                  <input className="ob-inp" type="text" placeholder="e.g. My Workspace" value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} required style={inp}/>
                </div>
                <div>
                  <label style={lbl}>Website <span style={opt}>optional</span></label>
                  <input className="ob-inp" type="text" placeholder="https://yourbrand.com" value={brandWebsite} onChange={e => setBrandWebsite(e.target.value)} style={inp}/>
                </div>
                {error && <div style={errBox}>{error}</div>}
                <button type="submit" className="ob-btn-primary" style={btnPrimary}>Continue →</button>
              </form>
            </div>
          )}

          {/* ── VOICE ── */}
          {step === 'voice' && (
            <div className="ob-card" style={card}>
              <div style={topLine}/>
              <h1 style={h1}>Define your market position</h1>
              <p style={sub}>This is the minimum Nexa needs to write like you and win clients.</p>
              <form onSubmit={handleVoiceContinue} style={{ display:'flex', flexDirection:'column', gap:18, marginTop:26 }}>
                <div>
                  <label style={lbl}>How do you want to show up in your market? <span style={req}>required</span></label>
                  <textarea className="ob-ta" placeholder="e.g. Direct, no-fluff, confident. The person who tells the truth other coaches won't. Short sentences, never corporate language." value={brandVoice} onChange={e => setBrandVoice(e.target.value)} required rows={4} style={{ ...inp, resize:'vertical', lineHeight:1.65, padding:'12px 14px' }}/>
                </div>
                <div>
                  <label style={lbl}>Who is your ideal client or customer? <span style={req}>required</span></label>
                  <textarea className="ob-ta" placeholder="e.g. B2B founders, 28-45, building real companies. They've tried generic advice. They want tactics that actually close deals." value={brandAudience} onChange={e => setBrandAudience(e.target.value)} required rows={3} style={{ ...inp, resize:'vertical', lineHeight:1.65, padding:'12px 14px' }}/>
                </div>
                <button type="submit" className="ob-btn-primary" style={{ ...btnPrimary, opacity: (brandVoice.trim().length > 10 && brandAudience.trim().length > 10) ? 1 : 0.5 }}>
                  Continue →
                </button>
              </form>
            </div>
          )}

          {/* ── UPLOAD ── */}
          {step === 'upload' && (
            <div className="ob-card" style={card}>
              <div style={topLine}/>
              <h1 style={h1}>Upload brand assets</h1>
              <p style={{ ...sub, marginBottom:22 }}>Logo, sample posts, brand doc. Optional — you can add more later.</p>
              <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setIsDragging(true) }} onDragLeave={() => setIsDragging(false)} onClick={() => fileRef.current?.click()} style={{ padding: files.length > 0 ? '14px 16px 10px' : '28px 20px', border:`1px dashed ${isDragging ? '#1E8EF0' : files.length > 0 ? 'rgba(30,142,240,0.3)' : 'rgba(255,255,255,0.12)'}`, borderRadius:12, textAlign:'center', cursor:'pointer', transition:'all .18s', background: isDragging ? 'rgba(30,142,240,0.05)' : 'transparent', marginBottom:12 }}>
                {files.length === 0 ? (
                  <>
                    <div style={{ fontSize:13, color:'rgba(255,255,255,0.65)', fontWeight:600, marginBottom:4 }}>Click or drag files here</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>PNG, JPG, PDF, DOCX</div>
                  </>
                ) : (
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>+ Add more files</div>
                )}
                <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.docx,.txt" onChange={e => addFiles(e.target.files)} onClick={e => { (e.target as HTMLInputElement).value = '' }} style={{ display:'none' }}/>
              </div>
              {files.length > 0 && (
                <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:16 }}>
                  {files.map((f, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:9, padding:'7px 12px', background:'rgba(30,142,240,0.04)', border:'1px solid rgba(30,142,240,0.12)', borderRadius:8 }}>
                      <span style={{ flex:1, fontSize:12, color:'rgba(255,255,255,0.75)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</span>
                      <button onClick={e => { e.stopPropagation(); removeFile(i) }} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.35)', padding:2 }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
              {analyzeError && <div style={{ ...errBox, marginBottom:14 }}>{analyzeError}</div>}
              <button onClick={handleAnalyze} className="ob-btn-primary" style={btnPrimary}>
                {files.length > 0 ? `Analyze brand + ${files.length} file${files.length > 1 ? 's' : ''} →` : 'Analyze my brand →'}
              </button>
            </div>
          )}

          {/* ── DONE ── (auto-redirects) */}
          {step === 'done' && (
            <div className="ob-card" style={{ ...card, textAlign: 'center' }}>
              <div style={topLine}/>
              <div style={{ width:52, height:52, borderRadius:'50%', background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h1 style={{ ...h1, marginBottom:8 }}>All set — building your workspace</h1>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', lineHeight:1.65 }}>Taking you to your dashboard…</p>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

const card:       React.CSSProperties = { background:'rgba(10,10,10,0.96)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, padding:'34px 30px', backdropFilter:'blur(24px)', position:'relative', overflow:'hidden' }
const topLine:    React.CSSProperties = { position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent 10%,rgba(30,142,240,0.3) 45%,rgba(30,142,240,0.1) 70%,transparent 90%)' }
const h1:         React.CSSProperties = { fontFamily:'var(--display)', fontSize:24, fontWeight:800, letterSpacing:'-0.04em', color:'#ffffff', textAlign:'center', marginBottom:8 }
const sub:        React.CSSProperties = { fontSize:13, color:'rgba(255,255,255,0.55)', textAlign:'center', lineHeight:1.65 }
const lbl:        React.CSSProperties = { display:'block', fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)', marginBottom:7 }
const req:        React.CSSProperties = { color:'rgba(30,142,240,0.7)', fontWeight:500, marginLeft:6 }
const opt:        React.CSSProperties = { color:'rgba(255,255,255,0.3)', fontWeight:400, marginLeft:6 }
const inp:        React.CSSProperties = { width:'100%', padding:'11px 14px', fontSize:13.5, fontFamily:'var(--sans)', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#ffffff', outline:'none', transition:'border-color 0.18s, box-shadow 0.18s', boxSizing:'border-box' }
const errBox:     React.CSSProperties = { padding:'10px 14px', background:'rgba(255,80,80,0.07)', border:'1px solid rgba(255,80,80,0.2)', borderRadius:9, fontSize:13, color:'#ff6b6b' }
const btnPrimary: React.CSSProperties = { width:'100%', padding:'13px', fontSize:14, fontWeight:700, fontFamily:'var(--display)', background:'var(--blue)', color:'#000', border:'none', borderRadius:10, cursor:'pointer', letterSpacing:'-0.01em', transition:'all .18s' }
