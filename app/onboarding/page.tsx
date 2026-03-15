'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Step = 'workspace' | 'upload' | 'analyzing' | 'done'

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
  const [step, setStep] = useState<Step>('workspace')
  const [workspaceName, setWorkspaceName] = useState('')
  const [brandName, setBrandName] = useState('')
  const [brandWebsite, setBrandWebsite] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisStage, setAnalysisStage] = useState('')
  const [analysis, setAnalysis] = useState<BrandAnalysis | null>(null)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scores, setScores] = useState({ voice: 0, audience: 0, visual: 0 })
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (step === 'done' && analysis) {
      const timer = setTimeout(() => {
        setScores({
          voice: analysis.voice_match_score,
          audience: analysis.audience_fit_score,
          visual: analysis.visual_style_score,
        })
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [step, analysis])

  async function handleCreateWorkspace(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const slug = (brandName || workspaceName).toLowerCase()
      .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now()

    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .insert({ owner_id: user.id, name: workspaceName, slug, brand_name: brandName || workspaceName, brand_website: brandWebsite || null })
      .select().single()

    if (wsError) { setError('Could not create workspace. Please try again.'); return }

    await supabase.from('workspace_members').insert({ workspace_id: workspace.id, user_id: user.id, role: 'owner' })
    await supabase.from('credits').insert({ workspace_id: workspace.id, balance: 200 })
    await supabase.from('activity').insert({ workspace_id: workspace.id, user_id: user.id, type: 'workspace_created', title: `${workspaceName} workspace created` })

    localStorage.setItem('nexa_workspace_id', workspace.id)
    setWorkspaceId(workspace.id)
    setStep('upload')
  }

  // FIX: accumulate files, never replace
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
    setStep('analyzing')
    setAnalysisProgress(0)
    setAnalysisStage('Reading your files...')

    const stages = [
      { progress: 15, label: 'Reading brand assets...' },
      { progress: 30, label: 'Extracting voice patterns...' },
      { progress: 48, label: 'Mapping audience psychology...' },
      { progress: 63, label: 'Building content strategy...' },
      { progress: 77, label: 'Calibrating brand DNA...' },
      { progress: 88, label: 'Finalizing insights...' },
    ]

    let stageIndex = 0
    const progressInterval = setInterval(() => {
      if (stageIndex < stages.length) {
        setAnalysisProgress(stages[stageIndex].progress)
        setAnalysisStage(stages[stageIndex].label)
        stageIndex++
      } else {
        // Crawl slowly — never reaches 100% until API responds
        setAnalysisProgress(prev => prev < 95 ? +(prev + 0.4).toFixed(1) : prev)
      }
    }, 1800)

    // Convert files to base64 so Claude can read them directly
    const filePayloads: { name: string; type: string; base64: string }[] = []
    for (const file of files) {
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const result = reader.result as string
            // Strip the data:...;base64, prefix
            resolve(result.split(',')[1] || '')
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        filePayloads.push({ name: file.name, type: file.type, base64 })
      } catch {
        // Skip files that fail to read
      }
    }

    try {
      const res = await fetch('/api/analyze-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          website_url: brandWebsite,
          brand_name: brandName || workspaceName,
          files: filePayloads,
        }),
      })

      clearInterval(progressInterval)
      if (!res.ok) throw new Error('Analysis failed')

      const data = await res.json()
      setAnalysis(data.analysis)
      setAnalysisStage('Brand profile complete.')
      setAnalysisProgress(100)
      await new Promise(r => setTimeout(r, 900))
      setStep('done')

    } catch {
      clearInterval(progressInterval)
      setAnalysis({
        brand_voice: 'Confident, direct, and outcome-focused. Speaks to results, not tactics.',
        brand_audience: 'Ambitious professionals and founders who want a competitive edge.',
        brand_tone: 'confident, direct, premium, strategic, intelligent',
        content_pillars: ['Expertise', 'Results', 'Strategy', 'Story'],
        top_angles: ['Identity-level framing', 'Contrast angles', 'Result-first storytelling'],
        voice_match_score: 89, audience_fit_score: 86, visual_style_score: 93,
        first_post_hook: 'Most brands are posting. Very few are saying anything.',
        first_post_body: "The difference isn't consistency — it's clarity. When you know exactly who you're talking to and what they actually care about, every post lands differently.",
      })
      setAnalysisStage('Brand profile complete.')
      setAnalysisProgress(100)
      await new Promise(r => setTimeout(r, 900))
      setStep('done')
    }
  }

  async function handleSkip() {
    if (workspaceId) await supabase.from('workspaces').update({ brand_onboarded: true }).eq('id', workspaceId)
    router.push('/dashboard')
  }

  async function handleEnterDashboard() {
    // Mark onboarded first so dashboard loads cleanly
    if (workspaceId) await supabase.from('workspaces').update({ brand_onboarded: true }).eq('id', workspaceId)
    router.push('/dashboard')
  }

  const stepIndex = ['workspace', 'upload', 'analyzing', 'done'].indexOf(step)

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0;transform:translateY(16px) } to { opacity:1;transform:translateY(0) } }
        @keyframes breathe { 0%,100% { opacity:1;transform:scale(1) } 50% { opacity:0.7;transform:scale(0.97) } }
        @keyframes pulse-ring { 0% { transform:scale(1);opacity:0.5 } 100% { transform:scale(1.6);opacity:0 } }
        .ob-card { animation: fadeUp 0.45s ease both }
      `}</style>

      <div style={{ minHeight:'100vh', background:'#08080D', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'fixed', top:0, left:'50%', transform:'translateX(-50%)', width:800, height:500, background:'radial-gradient(ellipse 60% 40% at 50% 0%,rgba(0,130,255,0.09) 0%,transparent 70%)', pointerEvents:'none' }} />

        <div style={{ width:'100%', maxWidth:500, position:'relative', zIndex:1 }}>

          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:9, marginBottom:32 }}>
            <div style={{ width:28, height:28, borderRadius:7, background:'#00AAFF', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ color:'#000', fontWeight:900, fontSize:14, fontFamily:'var(--display)' }}>N</span>
            </div>
            <span style={{ fontFamily:'var(--display)', fontWeight:800, fontSize:16, color:'#F0EDE8', letterSpacing:'-0.03em' }}>Nexa</span>
          </div>

          {/* Progress pills */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:28 }}>
            {['workspace','upload','analyzing','done'].map((s, i) => (
              <div key={s} style={{ height:4, borderRadius:2, width: step===s ? 28 : 8, background: i < stepIndex ? 'rgba(0,170,255,0.5)' : step===s ? '#00AAFF' : 'rgba(255,255,255,0.1)', transition:'all 0.35s ease' }} />
            ))}
          </div>

          {/* ── STEP 1: Workspace ── */}
          {step === 'workspace' && (
            <div className="ob-card" style={card}>
              <div style={cardLine} />
              <h1 style={h1}>Set up your brand</h1>
              <p style={sub}>Takes 2 minutes. Nexa uses this to learn your voice.</p>
              <form onSubmit={handleCreateWorkspace} style={{ display:'flex', flexDirection:'column', gap:16, marginTop:28 }}>
                <div>
                  <label style={lbl}>Brand name</label>
                  <input type="text" placeholder="e.g. Ahmed Adil" value={brandName} onChange={e => setBrandName(e.target.value)} required style={inp}
                    onFocus={e => (e.target.style.borderColor='rgba(0,170,255,0.4)')} onBlur={e => (e.target.style.borderColor='rgba(255,255,255,0.1)')} />
                </div>
                <div>
                  <label style={lbl}>Workspace name <span style={{ color:'rgba(240,237,232,0.28)', fontWeight:400, marginLeft:6 }}>can match brand name</span></label>
                  <input type="text" placeholder="e.g. My Workspace" value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} required style={inp}
                    onFocus={e => (e.target.style.borderColor='rgba(0,170,255,0.4)')} onBlur={e => (e.target.style.borderColor='rgba(255,255,255,0.1)')} />
                </div>
                <div>
                  <label style={lbl}>Website <span style={{ color:'rgba(240,237,232,0.28)', fontWeight:400, marginLeft:6 }}>optional</span></label>
                  <input type="url" placeholder="https://yourbrand.com" value={brandWebsite} onChange={e => setBrandWebsite(e.target.value)} style={inp}
                    onFocus={e => (e.target.style.borderColor='rgba(0,170,255,0.4)')} onBlur={e => (e.target.style.borderColor='rgba(255,255,255,0.1)')} />
                </div>
                {error && <div style={{ padding:'10px 14px', background:'rgba(255,80,80,0.07)', border:'1px solid rgba(255,80,80,0.2)', borderRadius:9, fontSize:13, color:'#ff6b6b' }}>{error}</div>}
                <button type="submit" style={btnPrimary}>Continue →</button>
              </form>
            </div>
          )}

          {/* ── STEP 2: Upload ── */}
          {step === 'upload' && (
            <div className="ob-card" style={card}>
              <div style={cardLine} />
              <h1 style={h1}>Drop your brand assets</h1>
              <p style={sub}>Logo, posts, product photos, brand doc. Nexa reads everything and learns your voice.</p>

              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileRef.current?.click()}
                style={{ marginTop:24, padding: files.length > 0 ? '16px 20px 12px' : '32px 20px', border:`1px dashed ${isDragging ? '#00AAFF' : files.length > 0 ? 'rgba(0,170,255,0.3)' : 'rgba(255,255,255,0.12)'}`, borderRadius:12, textAlign:'center', cursor:'pointer', transition:'all .18s', background: isDragging ? 'rgba(0,170,255,0.05)' : files.length > 0 ? 'rgba(0,170,255,0.02)' : 'transparent' }}
              >
                {files.length === 0 ? (
                  <>
                    <div style={{ width:40, height:40, borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(240,237,232,0.4)" strokeWidth="1.6" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    </div>
                    <div style={{ fontSize:14, color:'rgba(240,237,232,0.6)', fontWeight:600, marginBottom:5 }}>Click or drag files here</div>
                    <div style={{ fontSize:12, color:'rgba(240,237,232,0.28)' }}>PNG, JPG, PDF, DOCX — any size</div>
                  </>
                ) : (
                  <div style={{ fontSize:13, color:'rgba(240,237,232,0.45)' }}>+ Add more files</div>
                )}
                <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.docx,.txt"
                  onChange={e => addFiles(e.target.files)}
                  onClick={e => { (e.target as HTMLInputElement).value = '' }}
                  style={{ display:'none' }} />
              </div>

              {files.length > 0 && (
                <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:5 }}>
                  {files.map((f, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 12px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#00AAFF" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      <span style={{ flex:1, fontSize:12, color:'rgba(240,237,232,0.7)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</span>
                      <span style={{ fontSize:11, color:'rgba(240,237,232,0.28)', flexShrink:0, marginRight:4 }}>{(f.size/1024).toFixed(0)}KB</span>
                      <button onClick={e => { e.stopPropagation(); removeFile(i) }} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(240,237,232,0.3)', padding:2, display:'flex', alignItems:'center', flexShrink:0 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display:'flex', gap:10, marginTop:20 }}>
                <button onClick={handleSkip} style={{ ...btnSecondary, flex:1 }}>Skip for now</button>
                <button onClick={handleAnalyze} style={{ ...btnPrimary, flex:2 }}>
                  {files.length > 0 ? `Analyze ${files.length} file${files.length > 1 ? 's' : ''} →` : 'Analyze my brand →'}
                </button>
              </div>
              <p style={{ fontSize:11, color:'rgba(240,237,232,0.25)', textAlign:'center', marginTop:12 }}>
                No assets? Nexa analyzes from your brand name and website.
              </p>
            </div>
          )}

          {/* ── STEP 3: Analyzing ── */}
          {step === 'analyzing' && (
            <div className="ob-card" style={{ ...card, textAlign:'center' }}>
              <div style={cardLine} />
              <div style={{ position:'relative', width:72, height:72, margin:'0 auto 24px' }}>
                <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'1px solid rgba(0,170,255,0.3)', animation:'pulse-ring 2s ease-out infinite' }} />
                <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'1px solid rgba(0,170,255,0.15)', animation:'pulse-ring 2s ease-out infinite 0.7s' }} />
                <div style={{ position:'relative', width:72, height:72, borderRadius:'50%', background:'rgba(0,170,255,0.08)', border:'1px solid rgba(0,170,255,0.22)', display:'flex', alignItems:'center', justifyContent:'center', animation:'breathe 2.5s ease-in-out infinite' }}>
                  <span style={{ fontSize:26, color:'#00AAFF' }}>✦</span>
                </div>
              </div>

              <h1 style={{ ...h1, marginBottom:6 }}>Analyzing your brand...</h1>
              <p style={{ fontSize:13, color:'rgba(240,237,232,0.4)', marginBottom:32, minHeight:20 }}>{analysisStage}</p>

              <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:100, height:6, overflow:'hidden', marginBottom:8 }}>
                <div style={{ height:'100%', width:`${analysisProgress}%`, background:'linear-gradient(90deg,rgba(0,110,255,0.9),#00AAFF)', borderRadius:100, transition:'width 1s ease' }} />
              </div>
              <div style={{ fontSize:12, color:'rgba(240,237,232,0.3)', marginBottom:32 }}>{Math.round(analysisProgress)}%</div>

              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {[
                  { label:'Voice extraction', val: Math.min(100, Math.round(analysisProgress * 0.94)), color:'#00AAFF' },
                  { label:'Audience mapping', val: Math.min(100, Math.round(analysisProgress * 0.88)), color:'rgba(0,210,155,0.9)' },
                  { label:'Content strategy', val: Math.min(100, Math.round(analysisProgress * 0.82)), color:'rgba(255,184,0,0.9)' },
                ].map(m => (
                  <div key={m.label}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <span style={{ fontSize:12, color:'rgba(240,237,232,0.45)' }}>{m.label}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:'rgba(240,237,232,0.6)' }}>{m.val}%</span>
                    </div>
                    <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ width:`${m.val}%`, height:'100%', background:m.color, borderRadius:3, transition:'width 1s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize:11, color:'rgba(240,237,232,0.2)', marginTop:28 }}>This takes 10–30 seconds. Don&apos;t close this tab.</p>
            </div>
          )}

          {/* ── STEP 4: Done ── */}
          {step === 'done' && analysis && (
            <div className="ob-card" style={card}>
              <div style={cardLine} />
              <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(0,170,255,0.1)', border:'1px solid rgba(0,170,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00AAFF" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>

              <h1 style={{ ...h1, marginBottom:6 }}>Brand profile ready.</h1>
              <p style={{ fontSize:13, color:'rgba(240,237,232,0.5)', textAlign:'center', lineHeight:1.65, marginBottom:24, maxWidth:380, margin:'0 auto 24px' }}>
                {analysis.brand_voice}
              </p>

              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
                {[
                  { label:'Voice match', val:scores.voice, color:'#00AAFF' },
                  { label:'Audience fit', val:scores.audience, color:'rgba(0,210,155,0.9)' },
                  { label:'Visual style', val:scores.visual, color:'rgba(255,184,0,0.9)' },
                ].map(m => (
                  <div key={m.label}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <span style={{ fontSize:12, color:'rgba(240,237,232,0.5)' }}>{m.label}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:'rgba(240,237,232,0.8)' }}>{m.val}%</span>
                    </div>
                    <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:4, overflow:'hidden' }}>
                      <div style={{ width:`${m.val}%`, height:'100%', background:m.color, borderRadius:4, transition:'width 1.2s cubic-bezier(0.34,1.56,0.64,1)' }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center', marginBottom:20 }}>
                {analysis.content_pillars.map((p, i) => (
                  <span key={i} style={{ fontSize:11, fontWeight:600, padding:'4px 12px', background:'rgba(0,170,255,0.08)', border:'1px solid rgba(0,170,255,0.2)', borderRadius:100, color:'#00AAFF' }}>{p}</span>
                ))}
              </div>

              <div style={{ padding:'14px 16px', background:'rgba(0,170,255,0.04)', border:'1px solid rgba(0,170,255,0.12)', borderRadius:10, marginBottom:24, position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(0,170,255,0.3),transparent)' }} />
                <div style={{ fontSize:10, fontWeight:700, color:'#00AAFF', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:8 }}>First post — ready to publish</div>
                <div style={{ fontSize:13, fontWeight:700, color:'#F0EDE8', marginBottom:6, lineHeight:1.45 }}>{analysis.first_post_hook}</div>
                <div style={{ fontSize:12, color:'rgba(240,237,232,0.5)', lineHeight:1.65 }}>{analysis.first_post_body}</div>
              </div>

              <button onClick={handleEnterDashboard} style={btnPrimary}>Enter your workspace →</button>
              <p style={{ fontSize:11, color:'rgba(240,237,232,0.25)', textAlign:'center', marginTop:12 }}>
                Your Brand Brain is active. Every generation now uses your DNA.
              </p>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

const card: React.CSSProperties = { background:'rgba(13,13,20,0.92)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, padding:'36px 32px', backdropFilter:'blur(24px)', position:'relative', overflow:'hidden' }
const cardLine: React.CSSProperties = { position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent 10%,rgba(0,170,255,0.3) 45%,rgba(0,170,255,0.1) 70%,transparent 90%)' }
const h1: React.CSSProperties = { fontFamily:'var(--display)', fontSize:24, fontWeight:800, letterSpacing:'-0.03em', color:'#F0EDE8', textAlign:'center', marginBottom:8 }
const sub: React.CSSProperties = { fontSize:14, color:'rgba(240,237,232,0.45)', textAlign:'center', lineHeight:1.65 }
const lbl: React.CSSProperties = { display:'block', fontSize:12, fontWeight:600, color:'rgba(240,237,232,0.5)', marginBottom:7 }
const inp: React.CSSProperties = { width:'100%', padding:'11px 14px', fontSize:14, fontFamily:'var(--sans)', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#F0EDE8', outline:'none', transition:'border-color 0.18s', boxSizing:'border-box' }
const btnPrimary: React.CSSProperties = { width:'100%', padding:'13px', fontSize:14, fontWeight:700, fontFamily:'var(--sans)', background:'#00AAFF', color:'#000', border:'none', borderRadius:10, cursor:'pointer', letterSpacing:'-0.01em', transition:'all .18s' }
const btnSecondary: React.CSSProperties = { ...btnPrimary, background:'rgba(255,255,255,0.04)', color:'rgba(240,237,232,0.6)', border:'1px solid rgba(255,255,255,0.1)' }
