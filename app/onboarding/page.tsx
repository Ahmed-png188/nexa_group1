'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Step = 'workspace' | 'voice' | 'upload' | 'analyzing' | 'done'

interface BrandAnalysis {
  brand_voice: string
  brand_audience: string
  brand_tone: string
  content_pillars: string[]
  top_angles: string[]
  voice_match_score: number
  audience_fit_score: number
  visual_style_score: number
  first_post_hook: string
  first_post_body: string
}

export default function OnboardingPage() {
  const [step, setStep]                   = useState<Step>('workspace')
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

    setWorkspaceId(data.workspace.id)
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
      setStep('done')

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

  const STEPS: Step[] = ['workspace', 'voice', 'upload', 'analyzing', 'done']
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

      <div style={{ minHeight:'100vh', background:'#000000', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'fixed', top:0, left:'50%', transform:'translateX(-50%)', width:900, height:600, background:'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,130,255,0.08) 0%, transparent 70%)', pointerEvents:'none' }}/>

        <div style={{ width:'100%', maxWidth:500, position:'relative', zIndex:1 }}>

          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:9, marginBottom:28 }}>
            <img src="/favicon.png" alt="Nexa" style={{ width:28, height:28, borderRadius:7 }} />
            <span style={{ fontFamily:'var(--display)', fontWeight:800, fontSize:16, color:'#ffffff', letterSpacing:'-0.03em' }}>Nexa</span>
          </div>

          {/* Progress dots */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:24 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ height:3, borderRadius:2, width: step===s ? 28 : 8, background: i < stepIndex ? 'rgba(30,142,240,0.55)' : step===s ? '#1E8EF0' : 'rgba(255,255,255,0.1)', transition:'all 0.35s ease' }}/>
            ))}
          </div>

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

          {step === 'analyzing' && (
            <div className="ob-card" style={{ ...card, textAlign:'center' }}>
              <div style={topLine}/>
              <div style={{ position:'relative', width:72, height:72, margin:'0 auto 24px' }}>
                <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'1px solid rgba(30,142,240,0.3)', animation:'pulse-ring 2s ease-out infinite' }}/>
                <div style={{ position:'relative', width:72, height:72, borderRadius:'50%', background:'rgba(30,142,240,0.08)', border:'1px solid rgba(30,142,240,0.22)', display:'flex', alignItems:'center', justifyContent:'center', animation:'breathe 2.5s ease-in-out infinite' }}>
                  <span style={{ fontSize:26, color:'#1E8EF0' }}>✦</span>
                </div>
              </div>
              <h1 style={{ ...h1, marginBottom:6 }}>Building your Brand Brain...</h1>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginBottom:28, minHeight:20 }}>{analysisStage}</p>
              <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:100, height:5, overflow:'hidden', marginBottom:8 }}>
                <div style={{ height:'100%', width:`${analysisProgress}%`, background:'linear-gradient(90deg,#0C5FBF,#1E8EF0,#4DABF7)', borderRadius:100, transition:'width 1s ease' }}/>
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>{Math.round(analysisProgress)}%</div>
            </div>
          )}

          {step === 'done' && analysis && (
            <div className="ob-card" style={card}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,#1E8EF0,#4DABF7,transparent)', borderRadius:'18px 18px 0 0' }}/>
              <div style={{ width:52, height:52, borderRadius:'50%', background:'rgba(30,142,240,0.1)', border:'1px solid rgba(30,142,240,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E8EF0" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h1 style={{ ...h1, marginBottom:4 }}>Nexa knows your brand.</h1>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.55)', textAlign:'center', lineHeight:1.65, maxWidth:380, margin:'0 auto 22px' }}>{analysis.brand_voice}</p>
              <div style={{ display:'flex', flexDirection:'column', gap:9, marginBottom:18 }}>
                {([['Voice match', scores.voice, '#1E8EF0'], ['Audience fit', scores.audience, 'rgba(0,210,155,0.9)'], ['Visual style', scores.visual, 'rgba(255,184,0,0.9)']] as [string,number,string][]).map(([label, val, color]) => (
                  <div key={label}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:12, color:'rgba(255,255,255,0.6)' }}>{label}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.85)' }}>{val}%</span>
                    </div>
                    <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:4, overflow:'hidden' }}>
                      <div style={{ width:`${val}%`, height:'100%', background:color, borderRadius:4, transition:'width 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}/>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap', justifyContent:'center', marginBottom:18 }}>
                {analysis.content_pillars.map((p, i) => (
                  <span key={i} style={{ fontSize:11, fontWeight:600, padding:'4px 11px', background:'rgba(30,142,240,0.08)', border:'1px solid rgba(30,142,240,0.2)', borderRadius:100, color:'#4DABF7' }}>{p}</span>
                ))}
              </div>
              <div style={{ padding:'14px 16px', background:'rgba(30,142,240,0.04)', border:'1px solid rgba(30,142,240,0.12)', borderRadius:11, marginBottom:22 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#4DABF7', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:8 }}>First post — written in your voice</div>
                <div style={{ fontSize:13, fontWeight:700, color:'#ffffff', marginBottom:5, lineHeight:1.45 }}>{analysis.first_post_hook}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)', lineHeight:1.65 }}>{analysis.first_post_body}</div>
              </div>
              <button onClick={handleEnterDashboard} className="ob-btn-primary" style={btnPrimary}>Enter your workspace →</button>
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
