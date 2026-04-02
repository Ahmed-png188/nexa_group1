'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const F  = "'Geist', -apple-system, sans-serif"
const C  = {
  bg:      '#0C0C0C',
  surface: '#141414',
  border:  'rgba(255,255,255,0.10)',
  cyan:    '#00AAFF',
  cyanD:   'rgba(0,170,255,0.12)',
  t1:      '#FFFFFF',
  t2:      'rgba(255,255,255,0.65)',
  t3:      'rgba(255,255,255,0.35)',
  t4:      'rgba(255,255,255,0.20)',
}

const STAGES = [
  { id:'foundation', label:'Foundation', color:'#F59E0B', num:1 },
  { id:'momentum',   label:'Momentum',   color:'#10B981', num:2 },
  { id:'amplify',    label:'Amplify',    color:'#00AAFF', num:3 },
  { id:'operate',    label:'Operate',    color:'#A78BFA', num:4 },
  { id:'dominate',   label:'Dominate',   color:'#F43F5E', num:5 },
]

const STAGE_FOCUS: Record<string, { ceo:string; cmo:string; creative:string }> = {
  foundation: {
    ceo:      'Nail the positioning. Define exactly who you serve and why you win over every alternative.',
    cmo:      'Build the content engine. Post consistently and systematically learn what resonates.',
    creative: 'Establish visual identity. Every touchpoint should feel intentional and unmistakably yours.',
  },
  momentum: {
    ceo:      'Double down on what is working. Remove every initiative that is not contributing to the core goal.',
    cmo:      'Amplify the best-performing content. Test distribution channels with scientific discipline.',
    creative: 'Develop hero content formats. Find your signature style that audiences recognise instantly.',
  },
  amplify: {
    ceo:      'Pour fuel on the fire. Profitable acquisition channels deserve more budget, not more experiments.',
    cmo:      'Scale paid with organic learnings. Your best-performing organic content is your best ad creative.',
    creative: 'Production quality matters now. Raise the bar on every asset — audiences can feel the difference.',
  },
  operate: {
    ceo:      'Build systems, not habits. Everything repeatable must be automated or delegated.',
    cmo:      'Retention is the new acquisition. Existing customers are your best and cheapest marketers.',
    creative: 'Consistency at scale. Maintain brand standards while dramatically increasing output volume.',
  },
  dominate: {
    ceo:      'Own the category. Set the agenda that competitors are forced to react to.',
    cmo:      'Build movements, not campaigns. Community and word-of-mouth are your sustainable moat.',
    creative: 'Cultural relevance. Your brand should be a reference point, not a participant.',
  },
}

export default function RoadmapPageEn() {
  const supabase  = createClient()
  const router    = useRouter()

  const [workspace,  setWorkspace]  = useState<any>(null)
  const [milestones, setMilestones] = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toast,      setToast]      = useState('')

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3500) }

  useEffect(() => { load() }, [])

  async function load() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    const { data:m } = await supabase.from('workspace_members')
      .select('workspace_id, workspaces(*)')
      .eq('user_id', user.id).limit(1).single()
    const ws = (m as any)?.workspaces
    setWorkspace(ws)
    if (ws?.id) {
      const { data:miles } = await supabase.from('roadmap_milestones')
        .select('*').eq('workspace_id', ws.id).order('created_at',{ascending:false})
      setMilestones(miles || [])
    }
    setLoading(false)
  }

  async function refreshPriorities() {
    if (!workspace?.id || refreshing) return
    setRefreshing(true)
    try {
      const r = await fetch('/api/roadmap/refresh', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ workspace_id: workspace.id }),
      })
      if (r.ok) {
        const d = await r.json()
        if (d.workspace) setWorkspace((prev: any) => ({ ...prev, ...d.workspace }))
        showToast('Priorities refreshed — your intelligence engine just ran.')
        load()
      } else {
        showToast('Refresh failed — try again shortly.')
      }
    } catch {
      showToast('Refresh failed — check your connection.')
    }
    setRefreshing(false)
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', fontFamily:F, color:C.t3, fontSize:13 }}>
      Loading roadmap...
    </div>
  )

  const stage       = workspace?.client_stage || 'foundation'
  const priorities  = workspace?.weekly_priorities
  const stageIdx    = STAGES.findIndex(s => s.id === stage)
  const currentStage = STAGES[stageIdx] || STAGES[0]
  const focus       = STAGE_FOCUS[stage] || STAGE_FOCUS.foundation
  const brandName   = workspace?.brand_name || workspace?.name || 'Your brand'
  const genAt       = priorities?.generated_at
    ? new Date(priorities.generated_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
    : null

  return (
    <div style={{ padding:'32px 36px 60px', maxWidth:820, margin:'0 auto', fontFamily:F }}>

      <style dangerouslySetInnerHTML={{__html:`
        .rm-card:hover { border-color: rgba(255,255,255,0.18) !important; }
        .rm-btn:hover  { background: rgba(0,170,255,0.20) !important; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .rm-anim { animation: fadeUp 0.35s cubic-bezier(0.22,1,0.36,1) both; }
      `}} />

      {/* Header */}
      <div className="rm-anim" style={{ marginBottom:32, display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:C.t1, margin:0, letterSpacing:'-0.3px' }}>Growth Roadmap</h1>
          <p style={{ fontSize:13, color:C.t3, margin:'5px 0 0', letterSpacing:'0.01em' }}>
            {brandName} · Intelligence-driven priorities
          </p>
        </div>
        <button
          className="rm-btn"
          onClick={refreshPriorities}
          disabled={refreshing}
          style={{
            background:C.cyanD, border:'1px solid rgba(0,170,255,0.25)', borderRadius:9,
            color:C.cyan, fontSize:12, fontWeight:600, padding:'9px 18px',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            opacity: refreshing ? 0.55 : 1, fontFamily:F, letterSpacing:'0.02em',
            transition:'background 0.15s',
          }}
        >
          {refreshing ? 'Running analysis...' : '↻  Refresh Priorities'}
        </button>
      </div>

      {/* Stage Progress */}
      <div className="rm-anim rm-card" style={{
        background:C.surface, border:`1px solid ${C.border}`, borderRadius:14,
        padding:'22px 26px', marginBottom:22, transition:'border-color 0.15s',
      }}>
        <div style={{ fontSize:10, color:C.t3, letterSpacing:'0.09em', textTransform:'uppercase', marginBottom:18, fontWeight:600 }}>
          GROWTH STAGE · {currentStage.label.toUpperCase()}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:0, flexWrap:'wrap', rowGap:12 }}>
          {STAGES.map((s, i) => {
            const isPast    = i < stageIdx
            const isCurrent = i === stageIdx
            return (
              <div key={s.id} style={{ display:'flex', alignItems:'center' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                  <div style={{
                    width:34, height:34, borderRadius:'50%',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    background: isCurrent ? s.color : isPast ? 'rgba(255,255,255,0.10)' : 'transparent',
                    border: isCurrent ? `2px solid ${s.color}` : isPast ? '2px solid rgba(255,255,255,0.22)' : `2px solid ${C.t4}`,
                    fontSize:12, fontWeight:700,
                    color: isCurrent ? '#000' : isPast ? C.t2 : C.t3,
                    boxShadow: isCurrent ? `0 0 14px ${s.color}55` : 'none',
                    transition:'all 0.2s',
                  }}>
                    {isPast ? '✓' : s.num}
                  </div>
                  <span style={{
                    fontSize:10, fontWeight: isCurrent ? 700 : 400,
                    color: isCurrent ? s.color : isPast ? C.t2 : C.t3,
                    letterSpacing:'0.02em', whiteSpace:'nowrap',
                  }}>
                    {s.label}
                  </span>
                </div>
                {i < STAGES.length - 1 && (
                  <div style={{
                    width:40, height:2, borderRadius:1, margin:'0 6px 18px',
                    background: i < stageIdx ? 'rgba(255,255,255,0.22)' : C.t4,
                  }} />
                )}
              </div>
            )
          })}
        </div>
        {priorities?.assessment && (
          <div style={{
            marginTop:18, padding:'12px 16px',
            background:'rgba(255,255,255,0.04)', borderRadius:9,
            fontSize:13, color:C.t2, lineHeight:1.65,
          }}>
            {priorities.assessment}
            {genAt && <span style={{ fontSize:11, color:C.t3, marginLeft:10 }}>· Updated {genAt}</span>}
          </div>
        )}
      </div>

      {/* Executive Team Focus */}
      <div className="rm-anim" style={{ marginBottom:22 }}>
        <div style={{ fontSize:10, color:C.t3, letterSpacing:'0.09em', textTransform:'uppercase', marginBottom:12, fontWeight:600 }}>
          EXECUTIVE TEAM FOCUS
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:12 }}>
          {[
            { title:'CEO', sub:'Business Strategy', body:focus.ceo,      color:'#F59E0B' },
            { title:'CMO', sub:'Market Growth',     body:focus.cmo,      color:'#00AAFF' },
            { title:'CD',  sub:'Creative Direction',body:focus.creative, color:'#A78BFA' },
          ].map(ex => (
            <div key={ex.title} className="rm-card" style={{
              background:C.surface, border:`1px solid ${C.border}`, borderRadius:11,
              padding:'16px 18px', transition:'border-color 0.15s',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:9 }}>
                <span style={{
                  fontSize:10, fontWeight:700, color: ex.color,
                  background:`${ex.color}18`, border:`1px solid ${ex.color}30`,
                  borderRadius:5, padding:'2px 8px', letterSpacing:'0.06em',
                }}>{ex.title}</span>
                <span style={{ fontSize:11, color:C.t3 }}>{ex.sub}</span>
              </div>
              <p style={{ fontSize:12, color:C.t2, lineHeight:1.7, margin:0 }}>{ex.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Priorities */}
      <div className="rm-anim" style={{ marginBottom:22 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, flexWrap:'wrap', gap:8 }}>
          <div style={{ fontSize:10, color:C.t3, letterSpacing:'0.09em', textTransform:'uppercase', fontWeight:600 }}>
            THIS WEEK'S PRIORITIES
          </div>
          {priorities?.main_constraint && (
            <div style={{
              fontSize:11, color:'rgba(251,191,36,0.85)',
              background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.18)',
              borderRadius:6, padding:'3px 10px', maxWidth:360,
            }}>
              ⚠ Constraint: {priorities.main_constraint}
            </div>
          )}
        </div>
        {priorities?.priorities?.length > 0 ? (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {(priorities.priorities as any[]).map((p: any, i: number) => (
              <div key={i} className="rm-card" style={{
                background:C.surface, border:`1px solid ${C.border}`, borderRadius:11,
                padding:'17px 20px', display:'grid', gridTemplateColumns:'32px 1fr', gap:14,
                transition:'border-color 0.15s',
              }}>
                <div style={{
                  width:32, height:32, borderRadius:'50%',
                  background:C.cyanD, border:'1px solid rgba(0,170,255,0.25)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:12, fontWeight:700, color:C.cyan, flexShrink:0,
                }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:C.t1, marginBottom:5, letterSpacing:'-0.01em' }}>{p.title}</div>
                  <div style={{ fontSize:12, color:C.t2, lineHeight:1.6, marginBottom:p.why ? 6 : 0 }}>{p.action}</div>
                  {p.why && <div style={{ fontSize:11, color:C.t3, fontStyle:'italic' }}>Why now: {p.why}</div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            background:C.surface, border:`1px dashed ${C.border}`, borderRadius:11,
            padding:'30px 24px', textAlign:'center',
          }}>
            <p style={{ fontSize:13, color:C.t3, margin:'0 0 6px' }}>
              No priorities generated yet.
            </p>
            <p style={{ fontSize:12, color:C.t3, margin:0 }}>
              The Intelligence Engine runs every Sunday at 2AM UTC. Hit "Refresh Priorities" to run it now for your workspace.
            </p>
          </div>
        )}
      </div>

      {/* 90-day target */}
      {priorities?.ninety_day_goal && (
        <div className="rm-anim" style={{
          background:'rgba(0,170,255,0.06)', border:'1px solid rgba(0,170,255,0.20)', borderRadius:11,
          padding:'17px 22px', marginBottom:22,
        }}>
          <div style={{ fontSize:10, color:C.cyan, letterSpacing:'0.09em', textTransform:'uppercase', fontWeight:700, marginBottom:7 }}>
            90-DAY TARGET
          </div>
          <p style={{ fontSize:14, color:C.t1, margin:0, fontWeight:500, lineHeight:1.5 }}>
            {priorities.ninety_day_goal}
          </p>
        </div>
      )}

      {/* Milestones */}
      {milestones.length > 0 && (
        <div className="rm-anim" style={{ marginBottom:22 }}>
          <div style={{ fontSize:10, color:C.t3, letterSpacing:'0.09em', textTransform:'uppercase', fontWeight:600, marginBottom:12 }}>
            MILESTONES
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {milestones.slice(0, 6).map((m: any) => (
              <div key={m.id} style={{
                background:C.surface, border:`1px solid ${C.border}`, borderRadius:9,
                padding:'12px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12,
              }}>
                <div style={{ flex:1 }}>
                  <div style={{
                    fontSize:13, color: m.status === 'completed' ? C.t3 : C.t1,
                    fontWeight:500, textDecoration: m.status === 'completed' ? 'line-through' : 'none',
                  }}>{m.title}</div>
                  {m.due_date && (
                    <div style={{ fontSize:11, color:C.t3, marginTop:3 }}>
                      Due {new Date(m.due_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                    </div>
                  )}
                </div>
                <div style={{
                  fontSize:10, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase',
                  padding:'3px 10px', borderRadius:5, whiteSpace:'nowrap',
                  background: m.status === 'completed' ? 'rgba(34,197,94,0.10)' : m.status === 'active' ? C.cyanD : 'rgba(255,255,255,0.06)',
                  color: m.status === 'completed' ? '#22C55E' : m.status === 'active' ? C.cyan : C.t3,
                  border: `1px solid ${m.status === 'completed' ? 'rgba(34,197,94,0.22)' : m.status === 'active' ? 'rgba(0,170,255,0.22)' : C.border}`,
                }}>
                  {m.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WhatsApp tip */}
      <div className="rm-anim" style={{
        background:'rgba(37,211,102,0.05)', border:'1px solid rgba(37,211,102,0.14)', borderRadius:11,
        padding:'15px 20px', display:'flex', gap:14, alignItems:'flex-start',
      }}>
        <span style={{ fontSize:20, flexShrink:0, lineHeight:1 }}>💬</span>
        <div>
          <div style={{ fontSize:12, fontWeight:600, color:'#25D366', marginBottom:4 }}>WhatsApp Tip</div>
          <p style={{ fontSize:12, color:C.t2, margin:0, lineHeight:1.65 }}>
            Send <strong style={{ color:C.t1 }}>"priorities"</strong> to your Nexa WhatsApp number anytime to get this week's top 3 priorities straight to your phone.
          </p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed', bottom:28, left:'50%', transform:'translateX(-50%)',
          background:'#1C1C1C', border:`1px solid ${C.border}`, borderRadius:10,
          padding:'11px 22px', fontSize:13, color:C.t1, zIndex:9999,
          boxShadow:'0 8px 40px rgba(0,0,0,0.7)', whiteSpace:'nowrap',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
