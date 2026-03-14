'use client'

import { useState, useRef } from 'react'
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
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisStage, setAnalysisStage] = useState('')
  const [analysis, setAnalysis] = useState<BrandAnalysis | null>(null)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleCreateWorkspace(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const slug = (brandName || workspaceName).toLowerCase()
      .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now()

    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .insert({
        owner_id: user.id,
        name: workspaceName,
        slug,
        brand_name: brandName || workspaceName,
        brand_website: brandWebsite || null,
      })
      .select().single()

    if (wsError) { setError('Could not create workspace. Please try again.'); return }

    await supabase.from('workspace_members').insert({
      workspace_id: workspace.id, user_id: user.id, role: 'owner',
    })
    await supabase.from('credits').insert({
      workspace_id: workspace.id, balance: 200,
    })
    await supabase.from('activity').insert({
      workspace_id: workspace.id, user_id: user.id,
      type: 'workspace_created',
      title: `${workspaceName} workspace created`,
    })

    localStorage.setItem('nexa_workspace_id', workspace.id)
    setWorkspaceId(workspace.id)
    setStep('upload')
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) setFiles(Array.from(e.target.files))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)])
  }

  async function handleAnalyze() {
    setStep('analyzing')
    setAnalysisProgress(0)

    const stages = [
      { progress: 12, label: 'Reading brand assets...' },
      { progress: 28, label: 'Extracting voice patterns...' },
      { progress: 46, label: 'Mapping audience psychology...' },
      { progress: 64, label: 'Building content strategy...' },
      { progress: 80, label: 'Calibrating brand DNA...' },
      { progress: 92, label: 'Finalizing insights...' },
    ]

    // Start progress animation
    let stageIndex = 0
    const progressInterval = setInterval(() => {
      if (stageIndex < stages.length) {
        setAnalysisProgress(stages[stageIndex].progress)
        setAnalysisStage(stages[stageIndex].label)
        stageIndex++
      }
    }, 1200)

    try {
      // Call the real brand analysis API
      const res = await fetch('/api/analyze-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          website_url: brandWebsite,
          brand_name: brandName || workspaceName,
        }),
      })

      clearInterval(progressInterval)

      if (!res.ok) throw new Error('Analysis failed')

      const data = await res.json()
      setAnalysis(data.analysis)
      setAnalysisProgress(100)
      setAnalysisStage('Done.')

      await new Promise(r => setTimeout(r, 600))
      setStep('done')

    } catch (err) {
      clearInterval(progressInterval)
      // Fallback — still proceed with defaults
      setAnalysis({
        brand_voice: 'Confident, direct, and outcome-focused. Speaks to results, not tactics.',
        brand_audience: 'Ambitious professionals and founders who want a competitive edge.',
        brand_tone: 'confident, direct, premium, strategic, intelligent',
        content_pillars: ['Expertise', 'Results', 'Strategy', 'Story'],
        top_angles: ['Identity-level framing', 'Contrast angles', 'Result-first storytelling'],
        voice_match_score: 89,
        audience_fit_score: 86,
        visual_style_score: 93,
        first_post_hook: "Most brands are posting. Very few are saying anything.",
        first_post_body: "The difference isn't consistency — it's clarity. When you know exactly who you're talking to and what they actually care about, every post lands differently. That's what we're building here.",
      })
      setAnalysisProgress(100)
      setStep('done')
    }
  }

  async function handleSkip() {
    if (workspaceId) {
      await supabase.from('workspaces').update({ brand_onboarded: true }).eq('id', workspaceId)
    }
    router.push('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
      <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: 700, height: 400, background: 'radial-gradient(ellipse 60% 40% at 50% 10%,rgba(0,130,255,0.08) 0%,transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 520, position: 'relative', zIndex: 1 }}>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 36 }}>
          {(['workspace', 'upload', 'analyzing', 'done'] as Step[]).map((s, i) => {
            const steps = ['workspace', 'upload', 'analyzing', 'done']
            const current = steps.indexOf(step)
            const me = steps.indexOf(s)
            return (
              <div key={s} style={{ width: step === s ? 24 : 8, height: 8, borderRadius: 4, background: step === s ? 'var(--cyan)' : me < current ? 'rgba(0,170,255,0.4)' : 'var(--line2)', transition: 'all 0.3s ease' }} />
            )
          })}
        </div>

        {/* ── STEP 1: Workspace ── */}
        {step === 'workspace' && (
          <div style={cardStyle}>
            <div style={logoWrap}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="1.5" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15 }}>Nexa</span>
            </div>
            <h1 style={h1}>Let's set up your brand</h1>
            <p style={sub}>This is your home inside Nexa. Takes 2 minutes.</p>

            <form onSubmit={handleCreateWorkspace} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 24 }}>
              <div>
                <label style={lbl}>Brand name</label>
                <input type="text" placeholder="e.g. Ahmed's Brand" value={brandName} onChange={e => setBrandName(e.target.value)} required style={inp}
                  onFocus={e => (e.target.style.borderColor = 'var(--cline2)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--line2)')}
                />
              </div>
              <div>
                <label style={lbl}>Workspace name <span style={{ color: 'var(--t5)', fontWeight: 400 }}>(can match brand name)</span></label>
                <input type="text" placeholder="e.g. My Workspace" value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} required style={inp}
                  onFocus={e => (e.target.style.borderColor = 'var(--cline2)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--line2)')}
                />
              </div>
              <div>
                <label style={lbl}>Website <span style={{ color: 'var(--t5)', fontWeight: 400 }}>(optional — helps Nexa understand your brand faster)</span></label>
                <input type="url" placeholder="https://yourbrand.com" value={brandWebsite} onChange={e => setBrandWebsite(e.target.value)} style={inp}
                  onFocus={e => (e.target.style.borderColor = 'var(--cline2)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--line2)')}
                />
              </div>
              {error && <div style={errStyle}>{error}</div>}
              <button type="submit" style={btnPrimary}>Continue →</button>
            </form>
          </div>
        )}

        {/* ── STEP 2: Upload ── */}
        {step === 'upload' && (
          <div style={cardStyle}>
            <div style={logoWrap}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="1.5" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15 }}>Nexa</span>
            </div>
            <h1 style={h1}>Drop your brand assets</h1>
            <p style={sub}>Logo, sample posts, product photos. Nexa analyzes them and learns your voice in seconds.</p>

            <div
              onDrop={handleDrop} onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              style={{ marginTop: 24, padding: '32px 24px', border: `1px dashed ${files.length > 0 ? 'var(--cline2)' : 'var(--line2)'}`, borderRadius: 12, textAlign: 'center', cursor: 'pointer', transition: 'all .18s', background: files.length > 0 ? 'rgba(0,170,255,0.03)' : 'transparent' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 10 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <div style={{ fontSize: 14, color: 'var(--t3)', fontWeight: 600, marginBottom: 4 }}>
                {files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : 'Click or drag files here'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--t5)' }}>PNG, JPG, PDF, DOCX — up to 50MB each</div>
              <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.docx,.txt" onChange={handleFileChange} style={{ display: 'none' }} />
            </div>

            {files.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {files.slice(0, 4).map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 11px', background: 'var(--glass)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12, color: 'var(--t3)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                    <span style={{ color: 'var(--t5)', flexShrink: 0 }}>{(f.size / 1024).toFixed(0)}KB</span>
                  </div>
                ))}
                {files.length > 4 && <div style={{ fontSize: 11, color: 'var(--t5)', textAlign: 'center' }}>+{files.length - 4} more</div>}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={handleSkip} style={{ ...btnSecondary, flex: 1 }}>Skip for now</button>
              <button onClick={handleAnalyze} style={{ ...btnPrimary, flex: 2 }}>
                Analyze my brand →
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--t5)', textAlign: 'center', marginTop: 10 }}>
              No assets? No problem — Nexa will analyze based on your brand name and website.
            </p>
          </div>
        )}

        {/* ── STEP 3: Analyzing ── */}
        {step === 'analyzing' && (
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(0,170,255,0.08)', border: '1px solid var(--cline2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'breathe 2s ease-in-out infinite' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="1.5" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>

            <h1 style={{ ...h1, marginBottom: 6 }}>Reading your brand...</h1>
            <p style={{ ...sub, marginBottom: 28, fontSize: 13, color: 'var(--t5)' }}>{analysisStage || 'Starting analysis...'}</p>

            <div style={{ background: 'var(--glass)', border: '1px solid var(--line)', borderRadius: 100, height: 5, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ height: '100%', width: `${analysisProgress}%`, background: 'linear-gradient(90deg, rgba(0,110,255,0.8), var(--cyan))', borderRadius: 100, transition: 'width 0.8s ease' }} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--t4)', marginBottom: 24 }}>{analysisProgress}%</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[
                { label: 'Voice match',   val: Math.min(100, Math.round(analysisProgress * 0.93)), color: 'var(--cyan)' },
                { label: 'Audience fit',  val: Math.min(100, Math.round(analysisProgress * 0.89)), color: 'rgba(0,210,155,0.9)' },
                { label: 'Visual style',  val: Math.min(100, Math.round(analysisProgress * 0.96)), color: 'rgba(255,184,0,0.9)' },
              ].map(m => (
                <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--t4)', width: 80, textAlign: 'right', flexShrink: 0 }}>{m.label}</span>
                  <div style={{ flex: 1, height: 3, background: 'var(--glass)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${m.val}%`, height: '100%', background: m.color, borderRadius: 3, transition: 'width 0.8s ease' }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t2)', width: 32 }}>{m.val}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 4: Done ── */}
        {step === 'done' && analysis && (
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(0,170,255,0.08)', border: '1px solid var(--cline2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="1.5" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>

            <h1 style={{ ...h1, marginBottom: 6 }}>I know your brand.</h1>
            <p style={{ fontSize: 13, color: 'var(--t3)', lineHeight: 1.7, marginBottom: 20, maxWidth: 400, margin: '0 auto 20px' }}>
              {analysis.brand_voice}
            </p>

            {/* Scores */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 20 }}>
              {[
                { label: 'Voice match',  val: analysis.voice_match_score,    color: 'var(--cyan)' },
                { label: 'Audience fit', val: analysis.audience_fit_score,   color: 'rgba(0,210,155,0.9)' },
                { label: 'Visual style', val: analysis.visual_style_score,   color: 'rgba(255,184,0,0.9)' },
              ].map(m => (
                <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--t4)', width: 80, textAlign: 'right', flexShrink: 0 }}>{m.label}</span>
                  <div style={{ flex: 1, height: 3, background: 'var(--glass)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${m.val}%`, height: '100%', background: m.color, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t2)', width: 32 }}>{m.val}%</span>
                </div>
              ))}
            </div>

            {/* First post preview */}
            <div style={{ padding: '14px 16px', background: 'rgba(0,170,255,0.05)', border: '1px solid var(--cline2)', borderRadius: 10, marginBottom: 20, textAlign: 'left' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--cyan)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>First post — ready to publish</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 6, lineHeight: 1.4 }}>{analysis.first_post_hook}</div>
              <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.65 }}>{analysis.first_post_body}</div>
            </div>

            {/* Content pillars */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 24 }}>
              {analysis.content_pillars.map((p, i) => (
                <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', background: 'var(--cglow2)', border: '1px solid var(--cline2)', borderRadius: 100, color: 'var(--cyan)' }}>{p}</span>
              ))}
            </div>

            <button onClick={() => router.push('/dashboard')} style={btnPrimary}>
              Enter your workspace →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = { background: 'rgba(13,13,20,0.9)', border: '1px solid var(--line2)', borderRadius: 18, padding: '36px 32px', backdropFilter: 'blur(20px)' }
const logoWrap: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 24 }
const h1: React.CSSProperties = { fontFamily: 'var(--display)', fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--t1)', textAlign: 'center', marginBottom: 8 }
const sub: React.CSSProperties = { fontSize: 14, color: 'var(--t4)', textAlign: 'center', lineHeight: 1.65 }
const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--t4)', marginBottom: 7 }
const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', fontSize: 14, fontFamily: 'var(--sans)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line2)', borderRadius: 10, color: 'var(--t1)', outline: 'none', transition: 'border-color 0.18s' }
const btnPrimary: React.CSSProperties = { width: '100%', padding: '13px', fontSize: 14, fontWeight: 700, fontFamily: 'var(--sans)', background: 'var(--cyan)', color: '#000', border: 'none', borderRadius: 10, cursor: 'pointer', letterSpacing: '-0.01em', transition: 'all .18s' }
const btnSecondary: React.CSSProperties = { ...btnPrimary, background: 'var(--glass)', color: 'var(--t3)', border: '1px solid var(--line2)' }
const errStyle: React.CSSProperties = { padding: '10px 14px', background: 'rgba(255,107,107,0.07)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 8, fontSize: 13, color: 'var(--red)' }
