'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow, parseISO } from 'date-fns'

/* ─────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────── */
type StepType = 'email'|'wait'|'post'|'tag'|'condition'

interface Step {
  id: string
  type: StepType
  config: Record<string, any>
}

/* ─────────────────────────────────────────────────
   ICONS
───────────────────────────────────────────────── */
const Ic = {
  bolt:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  plus:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  mail:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  clock:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  post:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  tag:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  branch:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>,
  play:    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  pause:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  trash:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  copy:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  check:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  close:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  webhook: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>,
  back:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>,
  arrow:   <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
}

/* ─────────────────────────────────────────────────
   STEP CONFIG
───────────────────────────────────────────────── */
const STEP_TYPES: { id: StepType; label: string; desc: string; color: string; icon: any }[] = [
  { id:'email',     label:'Send Email',    desc:'AI-written in your brand voice',       color:'#4D9FFF', icon:Ic.mail    },
  { id:'wait',      label:'Wait',          desc:'Delay before the next step',           color:'#FFB547', icon:Ic.clock   },
  { id:'post',      label:'Publish Post',  desc:'Auto-publish to social platforms',     color:'#A78BFA', icon:Ic.post    },
  { id:'tag',       label:'Add Tag',       desc:'Tag contacts for segmentation',        color:'#34D399', icon:Ic.tag     },
  { id:'condition', label:'If/Else Branch',desc:'Branch based on contact behavior',     color:'#FF7A40', icon:Ic.branch  },
]

const STATUS_COLOR: Record<string,string> = {
  active:'#34D399', paused:'#FFB547', draft:'rgba(255,255,255,0.35)', completed:'#4D9FFF', failed:'#FF5757',
}

const TEMPLATES = [
  { id:'welcome', name:'Welcome Sequence',   steps:5, desc:'Onboard new subscribers over 7 days', color:'#4D9FFF',
    flow:[ {type:'email' as StepType,config:{subject:'Welcome to the family',tone:'warm, personal'}}, {type:'wait' as StepType,config:{days:2}}, {type:'email' as StepType,config:{subject:'Here\'s exactly what to do first',tone:'direct, actionable'}}, {type:'wait' as StepType,config:{days:3}}, {type:'email' as StepType,config:{subject:'The one thing that separates the 1%',tone:'educational'}} ]
  },
  { id:'nurture', name:'Nurture Sequence',   steps:8, desc:'Keep leads warm for 30 days',          color:'#A78BFA',
    flow:[ {type:'email' as StepType,config:{subject:'Value drop #1',tone:'educational'}}, {type:'wait' as StepType,config:{days:7}}, {type:'post' as StepType,config:{platform:'linkedin',tone:'thought leadership'}}, {type:'wait' as StepType,config:{days:7}}, {type:'email' as StepType,config:{subject:'The framework I use every week',tone:'authoritative'}} ]
  },
  { id:'launch',  name:'Product Launch',     steps:7, desc:'Build anticipation and drive sales',   color:'#FF7A40',
    flow:[ {type:'email' as StepType,config:{subject:'Something big is coming…',tone:'mysterious'}}, {type:'wait' as StepType,config:{days:2}}, {type:'post' as StepType,config:{platform:'instagram',tone:'teaser'}}, {type:'wait' as StepType,config:{days:3}}, {type:'email' as StepType,config:{subject:'It\'s live. Here\'s why it matters.',tone:'persuasive'}} ]
  },
  { id:'reengag', name:'Re-engagement',      steps:3, desc:'Win back cold leads with pattern interrupts', color:'#FF5757',
    flow:[ {type:'email' as StepType,config:{subject:'Did I do something wrong?',tone:'vulnerable'}}, {type:'wait' as StepType,config:{days:3}}, {type:'email' as StepType,config:{subject:'Last one — then I\'ll leave you alone',tone:'honest'}} ]
  },
]

const TRIGGERS = [
  'New subscriber joins list',
  'Lead magnet downloaded',
  'Form submitted',
  'Purchase completed',
  'Trial started',
  'Webinar registered',
  'Manual trigger',
  'Webhook received',
]

/* ─────────────────────────────────────────────────
   STEP NODE — the Apollo-style visual node
───────────────────────────────────────────────── */
function StepNode({ step, index, total, onRemove, onChange }: {
  step: Step; index: number; total: number
  onRemove: () => void; onChange: (config: Record<string,any>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const cfg = STEP_TYPES.find(s => s.id === step.type)!

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
      {/* Node card */}
      <div style={{
        width:'100%', maxWidth:420,
        background: expanded ? `${cfg.color}0c` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${expanded ? `${cfg.color}30` : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 14,
        transition: 'all 0.18s',
        overflow: 'hidden',
      }}>
        {/* Node header — always visible */}
        <div
          style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', cursor:'pointer' }}
          onClick={() => setExpanded(!expanded)}>
          {/* Step number bubble */}
          <div style={{
            width:28, height:28, borderRadius:9, flexShrink:0,
            background:`${cfg.color}18`, border:`1px solid ${cfg.color}35`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'var(--display)', fontSize:11, fontWeight:800, color:cfg.color,
          }}>
            {index + 1}
          </div>
          {/* Icon */}
          <div style={{ color:cfg.color, display:'flex', flexShrink:0 }}>{cfg.icon}</div>
          {/* Label */}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.88)', letterSpacing:'-0.02em', marginBottom:2 }}>
              {cfg.label}
              {step.type === 'wait' && step.config.days && (
                <span style={{ fontWeight:400, color:'rgba(255,255,255,0.4)', marginLeft:6 }}>· {step.config.days} day{step.config.days !== 1 ? 's' : ''}</span>
              )}
              {step.type === 'email' && step.config.subject && (
                <span style={{ fontWeight:400, color:'rgba(255,255,255,0.4)', marginLeft:6 }}>· {step.config.subject.slice(0,30)}{step.config.subject.length > 30 ? '…' : ''}</span>
              )}
              {step.type === 'post' && step.config.platform && (
                <span style={{ fontWeight:400, color:'rgba(255,255,255,0.4)', marginLeft:6 }}>· {step.config.platform}</span>
              )}
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>{cfg.desc}</div>
          </div>
          {/* Expand arrow */}
          <div style={{ color:'rgba(255,255,255,0.3)', display:'flex', transform: expanded ? 'rotate(90deg)' : 'none', transition:'transform 0.15s', flexShrink:0 }}>{Ic.arrow}</div>
          {/* Remove */}
          <button
            onClick={e => { e.stopPropagation(); onRemove() }}
            style={{ width:26, height:26, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', background:'transparent', border:'1px solid transparent', color:'rgba(255,255,255,0.25)', cursor:'pointer', transition:'all 0.15s', flexShrink:0 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,87,87,0.35)'; (e.currentTarget as HTMLElement).style.color='#FF5757' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='transparent'; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.25)' }}>
            {Ic.trash}
          </button>
        </div>

        {/* Expanded config */}
        {expanded && (
          <div style={{ padding:'0 16px 16px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            {step.type === 'email' && (
              <div style={{ display:'flex', flexDirection:'column', gap:10, paddingTop:14 }}>
                <div>
                  <div className="nexa-label" style={{ marginBottom:7 }}>Subject line</div>
                  <input
                    value={step.config.subject || ''}
                    onChange={e => onChange({...step.config, subject:e.target.value})}
                    placeholder="What gets them to open it?"
                    style={{ width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, color:'rgba(255,255,255,0.85)', fontSize:12.5, fontFamily:'var(--sans)', outline:'none', boxSizing:'border-box', transition:'border-color 0.15s' }}
                    onFocus={e => e.target.style.borderColor=`${cfg.color}45`}
                    onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'}
                  />
                </div>
                <div>
                  <div className="nexa-label" style={{ marginBottom:7 }}>Tone & angle</div>
                  <input
                    value={step.config.tone || ''}
                    onChange={e => onChange({...step.config, tone:e.target.value})}
                    placeholder="e.g. warm + educational, direct + honest"
                    style={{ width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, color:'rgba(255,255,255,0.85)', fontSize:12.5, fontFamily:'var(--sans)', outline:'none', boxSizing:'border-box', transition:'border-color 0.15s' }}
                    onFocus={e => e.target.style.borderColor=`${cfg.color}45`}
                    onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'}
                  />
                </div>
                <div style={{ padding:'8px 10px', background:'rgba(77,159,255,0.05)', border:'1px solid rgba(77,159,255,0.12)', borderRadius:8, fontSize:11.5, color:'rgba(255,255,255,0.42)', lineHeight:1.55 }}>
                  Nexa writes this email in your exact brand voice when the sequence runs.
                </div>
              </div>
            )}
            {step.type === 'wait' && (
              <div style={{ paddingTop:14 }}>
                <div className="nexa-label" style={{ marginBottom:7 }}>Wait duration</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {[1,2,3,5,7,14,21,30].map(d => (
                    <button key={d} onClick={() => onChange({...step.config, days:d})}
                      style={{ padding:'6px 14px', borderRadius:100, fontSize:12, fontWeight:600, background:step.config.days===d?`${cfg.color}14`:'rgba(255,255,255,0.04)', border:`1px solid ${step.config.days===d?`${cfg.color}40`:'rgba(255,255,255,0.09)'}`, color:step.config.days===d?cfg.color:'rgba(255,255,255,0.45)', cursor:'pointer', fontFamily:'var(--sans)', transition:'all 0.14s' }}>
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
            )}
            {step.type === 'post' && (
              <div style={{ paddingTop:14 }}>
                <div className="nexa-label" style={{ marginBottom:7 }}>Platform</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {['instagram','linkedin','x','tiktok','email'].map(p => (
                    <button key={p} onClick={() => onChange({...step.config, platform:p})}
                      style={{ padding:'6px 13px', borderRadius:100, fontSize:12, fontWeight:600, background:step.config.platform===p?`${cfg.color}14`:'rgba(255,255,255,0.04)', border:`1px solid ${step.config.platform===p?`${cfg.color}40`:'rgba(255,255,255,0.09)'}`, color:step.config.platform===p?cfg.color:'rgba(255,255,255,0.45)', cursor:'pointer', fontFamily:'var(--sans)', transition:'all 0.14s', textTransform:'capitalize' }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {step.type === 'tag' && (
              <div style={{ paddingTop:14 }}>
                <div className="nexa-label" style={{ marginBottom:7 }}>Tag name</div>
                <input
                  value={step.config.tag || ''}
                  onChange={e => onChange({...step.config, tag:e.target.value})}
                  placeholder="e.g. hot-lead, completed-onboarding"
                  style={{ width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, color:'rgba(255,255,255,0.85)', fontSize:12.5, fontFamily:'var(--sans)', outline:'none', boxSizing:'border-box' }}
                />
              </div>
            )}
            {step.type === 'condition' && (
              <div style={{ paddingTop:14 }}>
                <div className="nexa-label" style={{ marginBottom:7 }}>Condition</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {['Opened last email','Clicked link','Has tag','Did not open'].map(c => (
                    <button key={c} onClick={() => onChange({...step.config, condition:c})}
                      style={{ padding:'6px 12px', borderRadius:100, fontSize:11.5, fontWeight:600, background:step.config.condition===c?`${cfg.color}14`:'rgba(255,255,255,0.04)', border:`1px solid ${step.config.condition===c?`${cfg.color}40`:'rgba(255,255,255,0.09)'}`, color:step.config.condition===c?cfg.color:'rgba(255,255,255,0.45)', cursor:'pointer', fontFamily:'var(--sans)', transition:'all 0.14s' }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Connector line + add button between steps */}
      {index < total - 1 && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:0, position:'relative', zIndex:1 }}>
          <div style={{ width:1, height:20, background:'rgba(255,255,255,0.1)' }}/>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)' }}/>
          <div style={{ width:1, height:20, background:'rgba(255,255,255,0.1)' }}/>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────
   ADD STEP PICKER
───────────────────────────────────────────────── */
function AddStepPicker({ onAdd }: { onAdd: (type: StepType) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginTop:8 }}>
      {/* Connector */}
      <div style={{ width:1, height:20, background:'rgba(255,255,255,0.1)' }}/>

      {/* Add button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width:32, height:32, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center',
          background:open?'rgba(77,159,255,0.12)':'rgba(255,255,255,0.04)',
          border:`1px solid ${open?'rgba(77,159,255,0.3)':'rgba(255,255,255,0.1)'}`,
          color:open?'#4D9FFF':'rgba(255,255,255,0.45)',
          cursor:'pointer', transition:'all 0.15s',
        }}
        onMouseEnter={e => { if(!open){(e.currentTarget as HTMLElement).style.background='rgba(77,159,255,0.08)';(e.currentTarget as HTMLElement).style.borderColor='rgba(77,159,255,0.25)';(e.currentTarget as HTMLElement).style.color='#4D9FFF'} }}
        onMouseLeave={e => { if(!open){(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)';(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.1)';(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.45)'} }}>
        {Ic.plus}
      </button>

      {/* Picker dropdown */}
      {open && (
        <div style={{
          marginTop:10, width:320,
          background:'rgba(10,10,16,0.98)', border:'1px solid rgba(255,255,255,0.1)',
          borderRadius:14, overflow:'hidden', boxShadow:'0 16px 48px rgba(0,0,0,0.65)',
          animation:'pageUp 0.18s ease both',
        }}>
          <div className="nexa-label" style={{ padding:'12px 14px 8px' }}>
            Add a step
          </div>
          {STEP_TYPES.map(s => (
            <button
              key={s.id}
              onClick={() => { onAdd(s.id); setOpen(false) }}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:11, padding:'11px 14px', background:'transparent', border:'none', cursor:'pointer', fontFamily:'var(--sans)', textAlign:'left', transition:'background 0.12s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background=`${s.color}0a`}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='transparent'}>
              <div style={{ width:30, height:30, borderRadius:9, background:`${s.color}12`, border:`1px solid ${s.color}25`, display:'flex', alignItems:'center', justifyContent:'center', color:s.color, flexShrink:0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.85)', marginBottom:1, letterSpacing:'-0.01em' }}>{s.label}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.32)' }}>{s.desc}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────── */
export default function AutomatePage() {
  const supabase = createClient()

  const [ws,        setWs]       = useState<any>(null)
  const [sequences, setSeqs]     = useState<any[]>([])
  const [webhooks,  setWebhooks] = useState<any[]>([])
  const [runs,      setRuns]     = useState<any[]>([])
  const [loading,   setLoading]  = useState(true)
  const [selSeq,    setSelSeq]   = useState<any>(null)
  const [panel,     setPanel]    = useState<'list'|'builder'|'webhooks'>('list')
  const [toast,     setToast]    = useState<{msg:string;ok:boolean}|null>(null)
  const [copiedId,  setCopiedId] = useState<string|null>(null)
  const [mounted,   setMounted]  = useState(false)

  // Builder state
  const [bName,     setBName]    = useState('')
  const [bTrigger,  setBTrigger] = useState(TRIGGERS[0])
  const [bSteps,    setBSteps]   = useState<Step[]>([])
  const [bTemplate, setBTemplate]= useState<string|null>(null)
  const [creating,  setCreating] = useState(false)

  function toast_(msg:string, ok=true) { setToast({msg,ok}); setTimeout(()=>setToast(null),3500) }

  useEffect(() => { setMounted(true); load() }, [])

  async function load() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return
    const { data:m } = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id',user.id).limit(1).single()
    const w = (m as any)?.workspaces; setWs(w)
    const [{ data:s },{ data:wh },{ data:r }] = await Promise.all([
      supabase.from('email_sequences').select('*, agents(status,stats)').eq('workspace_id',w?.id).order('created_at',{ascending:false}),
      supabase.from('webhooks').select('*').eq('workspace_id',w?.id).order('created_at',{ascending:false}),
      supabase.from('agent_runs').select('*').eq('workspace_id',w?.id).order('created_at',{ascending:false}).limit(20),
    ])
    setSeqs(s??[]); setWebhooks(wh??[]); setRuns(r??[]); setLoading(false)
  }

  function applyTemplate(tmpl: typeof TEMPLATES[0]) {
    setBTemplate(tmpl.id)
    if (!bName) setBName(tmpl.name)
    setBSteps(tmpl.flow.map((f,i) => ({ id:`s${Date.now()}_${i}`, type:f.type, config:f.config })))
  }

  function addStep(type: StepType) {
    setBSteps(prev => [...prev, { id:`s${Date.now()}`, type, config:{} }])
  }

  function removeStep(id: string) {
    setBSteps(prev => prev.filter(s => s.id !== id))
  }

  function updateStep(id: string, config: Record<string,any>) {
    setBSteps(prev => prev.map(s => s.id === id ? {...s, config} : s))
  }

  async function createSequence() {
    if (!bName.trim() || creating) return
    setCreating(true)
    try {
      // Build a goal from the trigger and name so the API generates real AI emails
      const goal = `${bName} — triggered by: ${bTrigger}`
      const r = await fetch('/api/create-sequence',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspace_id:ws.id,name:bName,goal,audience:ws?.brand_audience||'target audience',num_emails:Math.max(bSteps.length,3),generate_with_ai:true,trigger:bTrigger,template:bTemplate})})
      const d = await r.json()
      if (d.success) {
        toast_('Sequence created and ready')
        setBName(''); setBSteps([]); setBTemplate(null)
        setPanel('list'); load()
      } else toast_(d.error||'Failed','error' as any)
    } catch { toast_('Something went wrong','error' as any) }
    setCreating(false)
  }

  async function toggleStatus(seq: any) {
    const next = seq.status === 'active' ? 'paused' : 'active'
    const updateData: any = { status: next }
    // Set started_at when first activated so sequence runner knows day 0
    if (next === 'active' && !seq.started_at) {
      updateData.started_at = new Date().toISOString()
    }
    await supabase.from('email_sequences').update(updateData).eq('id',seq.id)
    toast_(`Sequence ${next}`); load()
    if (selSeq?.id === seq.id) setSelSeq({...seq, status:next})
  }

  async function del(id: string) {
    await supabase.from('email_sequences').delete().eq('id',id)
    toast_('Deleted'); load()
    if (selSeq?.id === id) { setSelSeq(null); setPanel('list') }
  }

  async function copyUrl(url: string, id: string) {
    await navigator.clipboard.writeText(url)
    setCopiedId(id); setTimeout(()=>setCopiedId(null),2000)
  }

  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'rgba(255,255,255,0.28)',fontSize:13 }}>Loading…</div>

  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          TWO-PANEL LAYOUT — Left: list | Right: builder/detail
      ═══════════════════════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', height:'calc(100vh - var(--topbar-h))', overflow:'hidden' }}>

        {/* ── LEFT PANEL — Sequence list ── */}
        <div style={{
          borderRight:'1px solid rgba(255,255,255,0.06)',
          display:'flex', flexDirection:'column', overflow:'hidden',
          opacity:mounted?1:0, transition:'opacity 0.4s ease',
        }}>
          {/* Panel header */}
          <div style={{ padding:'20px 18px 14px', borderBottom:'1px solid rgba(255,255,255,0.05)', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div>
                <div style={{ fontFamily:'var(--display)', fontSize:16, fontWeight:800, letterSpacing:'-0.04em', color:'rgba(255,255,255,0.92)', lineHeight:1, marginBottom:2 }}>Sequences</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>{sequences.length} sequence{sequences.length!==1?'s':''}</div>
              </div>
              <button
                onClick={() => { setPanel('builder'); setSelSeq(null); setBName(''); setBSteps([]); setBTemplate(null) }}
                style={{ width:30, height:30, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(77,159,255,0.12)', border:'1px solid rgba(77,159,255,0.25)', color:'#4D9FFF', cursor:'pointer', transition:'all 0.15s' }}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(77,159,255,0.2)'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(77,159,255,0.12)'}}>
                {Ic.plus}
              </button>
            </div>
            {/* Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
              {[
                { label:'Active',    value:sequences.filter(s=>s.status==='active').length,  color:'#34D399' },
                { label:'Paused',    value:sequences.filter(s=>s.status==='paused').length,  color:'#FFB547' },
              ].map(s=>(
                <div key={s.label} className="nexa-card" style={{ padding:'10px 11px', textAlign:'center' }}>
                  <div className="nexa-num" style={{ fontSize:18, color:s.color, lineHeight:1 }}>{s.value}</div>
                  <div className="nexa-label" style={{ marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sequence list */}
          <div style={{ flex:1, overflowY:'auto', padding:'10px 10px' }}>
            {sequences.length > 0 ? sequences.map(seq => {
              const isActive = selSeq?.id === seq.id && panel !== 'builder'
              const sc = STATUS_COLOR[seq.status] || 'rgba(255,255,255,0.3)'
              return (
                <div
                  key={seq.id}
                  onClick={() => { setSelSeq(seq); setPanel('list') }}
                  style={{
                    padding:'12px 13px', borderRadius:12, marginBottom:5,
                    background:isActive?'rgba(14,165,255,0.08)':'rgba(255,255,255,0.015)',
                    border:`1px solid ${isActive?'rgba(14,165,255,0.22)':'rgba(255,255,255,0.05)'}`,
                    boxShadow:isActive?'0 2px 12px rgba(0,0,0,0.4)':'none',
                    cursor:'pointer', transition:'all 0.14s',
                  }}
                  onMouseEnter={e=>{ if(!isActive){(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)';(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.08)'} }}
                  onMouseLeave={e=>{ if(!isActive){(e.currentTarget as HTMLElement).style.background='transparent';(e.currentTarget as HTMLElement).style.borderColor='transparent'} }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                    {/* Status dot */}
                    <div style={{ width:6, height:6, borderRadius:'50%', background:sc, boxShadow:`0 0 5px ${sc}`, flexShrink:0 }}/>
                    <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.85)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'-0.01em', flex:1 }}>
                      {seq.name}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8, paddingLeft:14, alignItems:'center' }}>
                    <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)' }}>{seq.steps_count||0} steps</span>
                    <span style={{ fontSize:9, color:'rgba(255,255,255,0.18)' }}>·</span>
                    <span style={{ fontSize:10, color:sc, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>{seq.status}</span>
                  </div>
                </div>
              )
            }) : (
              <div style={{ textAlign:'center', padding:'32px 16px' }}>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.25)', lineHeight:1.7, marginBottom:14 }}>
                  No sequences yet.<br/>Build your first automation.
                </div>
                <button
                  onClick={() => { setPanel('builder'); setBName(''); setBSteps([]); setBTemplate(null) }}
                  style={{ fontSize:12, fontWeight:700, color:'#4D9FFF', background:'rgba(77,159,255,0.08)', border:'1px solid rgba(77,159,255,0.2)', borderRadius:8, padding:'7px 16px', cursor:'pointer', fontFamily:'var(--sans)' }}>
                  Build a sequence
                </button>
              </div>
            )}
          </div>

          {/* Webhooks link */}
          <div style={{ padding:'10px 10px', borderTop:'1px solid rgba(255,255,255,0.05)', flexShrink:0 }}>
            <button
              onClick={() => setPanel('webhooks')}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:'10px 12px', borderRadius:10, background:panel==='webhooks'?'rgba(255,255,255,0.05)':'transparent', border:'1px solid transparent', color:'rgba(255,255,255,0.38)', cursor:'pointer', fontFamily:'var(--sans)', fontSize:12, fontWeight:500, transition:'all 0.14s' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)'}}
              onMouseLeave={e=>{if(panel!=='webhooks')(e.currentTarget as HTMLElement).style.background='transparent'}}>
              <span style={{ display:'flex' }}>{Ic.webhook}</span>
              Webhooks
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)', marginLeft:'auto' }}>{webhooks.length}</span>
            </button>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ overflowY:'auto', display:'flex', flexDirection:'column' }}>

          {/* ════ BUILDER ════ */}
          {panel === 'builder' && (
            <div style={{ flex:1, display:'flex', flexDirection:'column', animation:'pageUp 0.3s ease both' }}>
              {/* Builder header */}
              <div style={{ padding:'20px 28px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
                <div>
                  <div style={{ fontFamily:'var(--display)', fontSize:17, fontWeight:800, letterSpacing:'-0.03em', color:'rgba(255,255,255,0.92)' }}>
                    {bName || 'New Sequence'}
                  </div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:2 }}>
                    {bSteps.length} step{bSteps.length!==1?'s':''} · {bTrigger}
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button
                    onClick={() => setPanel('list')}
                    style={{ padding:'7px 14px', borderRadius:9, fontSize:12, fontWeight:600, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.45)', cursor:'pointer', fontFamily:'var(--sans)' }}>
                    Cancel
                  </button>
                  <button
                    onClick={createSequence}
                    disabled={!bName.trim() || bSteps.length === 0 || creating}
                    style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 18px', borderRadius:9, fontSize:13, fontWeight:700, fontFamily:'var(--display)', letterSpacing:'-0.02em', background:bName.trim()&&bSteps.length>0?'#4D9FFF':'rgba(255,255,255,0.04)', color:bName.trim()&&bSteps.length>0?'#000':'rgba(255,255,255,0.2)', border:'none', cursor:bName.trim()&&bSteps.length>0?'pointer':'not-allowed', transition:'all 0.18s', boxShadow:bName.trim()&&bSteps.length>0?'0 4px 18px rgba(77,159,255,0.35)':'none' }}>
                    {creating
                      ? <><div className="nexa-spinner" style={{ width:14, height:14 }}/>Saving…</>
                      : <><span style={{ display:'flex' }}>{Ic.bolt}</span>Save sequence</>}
                  </button>
                </div>
              </div>

              {/* Builder body — 2 columns */}
              <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 320px', overflow:'hidden' }}>

                {/* Flow canvas */}
                <div style={{ overflowY:'auto', padding:'28px 40px 60px', borderRight:'1px solid rgba(255,255,255,0.05)' }}>

                  {/* Sequence name input */}
                  <div style={{ marginBottom:24, maxWidth:420 }}>
                    <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.28)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8 }}>Sequence name</div>
                    <input
                      value={bName}
                      onChange={e => setBName(e.target.value)}
                      placeholder="Give your sequence a clear name"
                      style={{ width:'100%', padding:'11px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:11, color:'rgba(255,255,255,0.9)', fontSize:14, fontFamily:'var(--sans)', outline:'none', fontWeight:600, letterSpacing:'-0.01em', transition:'border-color 0.15s', boxSizing:'border-box' }}
                      onFocus={e=>e.target.style.borderColor='rgba(77,159,255,0.35)'}
                      onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}
                    />
                  </div>

                  {/* TRIGGER node — always first */}
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                    {/* Trigger card */}
                    <div style={{ width:'100%', maxWidth:420, padding:'16px 18px', background:'linear-gradient(145deg, rgba(77,159,255,0.1) 0%, rgba(77,159,255,0.05) 100%)', border:'1px solid rgba(77,159,255,0.28)', borderRadius:16, boxShadow:'0 0 24px rgba(77,159,255,0.08)', marginBottom:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                        <div style={{ width:30, height:30, borderRadius:9, background:'rgba(77,159,255,0.15)', border:'1px solid rgba(77,159,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', color:'#4D9FFF', flexShrink:0 }}>
                          {Ic.bolt}
                        </div>
                        <div>
                          <div style={{ fontSize:9, fontWeight:700, color:'#4D9FFF', letterSpacing:'0.09em', textTransform:'uppercase', marginBottom:1 }}>Trigger</div>
                          <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.88)', letterSpacing:'-0.02em' }}>When this happens…</div>
                        </div>
                      </div>
                      <select
                        value={bTrigger}
                        onChange={e => setBTrigger(e.target.value)}
                        style={{ width:'100%', padding:'10px 13px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(77,159,255,0.2)', borderRadius:9, color:'rgba(255,255,255,0.85)', fontSize:13, fontFamily:'var(--sans)', outline:'none', cursor:'pointer', boxSizing:'border-box' }}>
                        {TRIGGERS.map(t => <option key={t} value={t} style={{ background:'#0E0E16' }}>{t}</option>)}
                      </select>
                    </div>

                    {/* Steps */}
                    {bSteps.length > 0 && (
                      <>
                        {/* Connector to first step */}
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                          <div style={{ width:1, height:20, background:'rgba(255,255,255,0.1)' }}/>
                          <div style={{ width:6, height:6, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)' }}/>
                          <div style={{ width:1, height:20, background:'rgba(255,255,255,0.1)' }}/>
                        </div>

                        <div style={{ width:'100%', display:'flex', flexDirection:'column', alignItems:'center', maxWidth:420 }}>
                          {bSteps.map((step, i) => (
                            <StepNode
                              key={step.id}
                              step={step}
                              index={i}
                              total={bSteps.length}
                              onRemove={() => removeStep(step.id)}
                              onChange={config => updateStep(step.id, config)}
                            />
                          ))}
                        </div>
                      </>
                    )}

                    {/* Add step button */}
                    <AddStepPicker onAdd={addStep}/>

                    {bSteps.length === 0 && (
                      <div style={{ marginTop:16, fontSize:12, color:'rgba(255,255,255,0.25)', textAlign:'center', maxWidth:280 }}>
                        Add steps below the trigger to define what Nexa does when someone enters this sequence.
                      </div>
                    )}
                  </div>
                </div>

                {/* Right sidebar — templates */}
                <div style={{ overflowY:'auto', padding:'24px 20px', background:'rgba(255,255,255,0.01)' }}>
                  <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.28)', letterSpacing:'0.09em', textTransform:'uppercase', marginBottom:14 }}>
                    Start from a template
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
                    {TEMPLATES.map(t => (
                      <div
                        key={t.id}
                        onClick={() => applyTemplate(t)}
                        style={{
                          padding:'14px 16px', borderRadius:13, cursor:'pointer', transition:'all 0.15s',
                          background:bTemplate===t.id?`${t.color}0c`:'rgba(255,255,255,0.025)',
                          border:`1px solid ${bTemplate===t.id?`${t.color}28`:'rgba(255,255,255,0.07)'}`,
                          boxShadow:bTemplate===t.id?`0 0 20px ${t.color}10`:'none',
                        }}
                        onMouseEnter={e=>{ if(bTemplate!==t.id){(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.045)';(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.12)'} }}
                        onMouseLeave={e=>{ if(bTemplate!==t.id){(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.025)';(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.07)'} }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                          <div style={{ fontSize:13, fontWeight:700, color:bTemplate===t.id?t.color:'rgba(255,255,255,0.82)', letterSpacing:'-0.02em' }}>{t.name}</div>
                          <span style={{ fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:100, background:`${t.color}12`, border:`1px solid ${t.color}28`, color:t.color }}>
                            {t.steps} steps
                          </span>
                        </div>
                        <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.35)', lineHeight:1.55 }}>{t.desc}</div>
                      </div>
                    ))}
                  </div>

                  {/* Step type legend */}
                  <div style={{ marginTop:24 }}>
                    <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.28)', letterSpacing:'0.09em', textTransform:'uppercase', marginBottom:12 }}>
                      Step types
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                      {STEP_TYPES.map(s => (
                        <div key={s.id} style={{ display:'flex', alignItems:'center', gap:9 }}>
                          <div style={{ width:24, height:24, borderRadius:7, background:`${s.color}12`, border:`1px solid ${s.color}22`, display:'flex', alignItems:'center', justifyContent:'center', color:s.color, flexShrink:0 }}>
                            {s.icon}
                          </div>
                          <div>
                            <div style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.72)', letterSpacing:'-0.01em' }}>{s.label}</div>
                            <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)' }}>{s.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ SEQUENCE DETAIL ════ */}
          {panel === 'list' && selSeq && (
            <div style={{ flex:1, padding:'28px 32px', overflowY:'auto', animation:'pageUp 0.3s ease both' }}>
              {/* Header */}
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:STATUS_COLOR[selSeq.status]||'rgba(255,255,255,0.3)', boxShadow:`0 0 8px ${STATUS_COLOR[selSeq.status]||'rgba(255,255,255,0.3)'}` }}/>
                    <h2 style={{ fontFamily:'var(--display)', fontSize:22, fontWeight:800, letterSpacing:'-0.04em', color:'rgba(255,255,255,0.92)', lineHeight:1 }}>
                      {selSeq.name}
                    </h2>
                  </div>
                  <p style={{ fontSize:12, color:'rgba(255,255,255,0.32)', marginLeft:18 }}>
                    {selSeq.trigger||'Manual trigger'} · {selSeq.steps_count||0} steps
                  </p>
                </div>
                <div style={{ display:'flex', gap:7 }}>
                  <button onClick={() => toggleStatus(selSeq)}
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:9, fontSize:12, fontWeight:700, background:selSeq.status==='active'?'rgba(255,181,71,0.1)':'rgba(52,211,153,0.1)', border:`1px solid ${selSeq.status==='active'?'rgba(255,181,71,0.25)':'rgba(52,211,153,0.25)'}`, color:selSeq.status==='active'?'#FFB547':'#34D399', cursor:'pointer', fontFamily:'var(--sans)', transition:'all 0.15s' }}>
                    <span style={{ display:'flex' }}>{selSeq.status==='active'?Ic.pause:Ic.play}</span>
                    {selSeq.status==='active'?'Pause':'Activate'}
                  </button>
                  <button onClick={() => del(selSeq.id)}
                    style={{ width:34, height:34, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', background:'transparent', border:'1px solid rgba(255,255,255,0.09)', color:'rgba(255,255,255,0.3)', cursor:'pointer', transition:'all 0.15s' }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(255,87,87,0.35)';(e.currentTarget as HTMLElement).style.color='#FF5757'}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.09)';(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.3)'}}>
                    {Ic.trash}
                  </button>
                </div>
              </div>

              {/* Stat cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px,1fr))', gap:8, marginBottom:28 }}>
                {[
                  { label:'Status',   value:selSeq.status||'draft',           color:STATUS_COLOR[selSeq.status]||'rgba(255,255,255,0.4)' },
                  { label:'Steps',    value:String(selSeq.steps_count||0),    color:'#4D9FFF' },
                  { label:'Contacts',  value:String(selSeq.total_contacts||0), color:'#A78BFA' },
                  { label:'Sent',     value:String(selSeq.emails_sent||0),    color:'#34D399' },
                ].map(s=>(
                  <div key={s.label} style={{ padding:'13px 16px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12 }}>
                    <div style={{ fontFamily:'var(--display)', fontSize:22, fontWeight:800, letterSpacing:'-0.04em', color:s.color, lineHeight:1, marginBottom:4 }}>{s.value}</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontWeight:500 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Description */}
              {selSeq.description && (
                <div style={{ padding:'14px 18px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, marginBottom:24, fontSize:13, color:'rgba(255,255,255,0.58)', lineHeight:1.7 }}>
                  {selSeq.description}
                </div>
              )}

              {/* Recent runs for this sequence */}
              {runs.filter(r=>r.sequence_id===selSeq.id||r.agent_type===selSeq.id).length > 0 && (
                <div>
                  <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.28)', letterSpacing:'0.09em', textTransform:'uppercase', marginBottom:12 }}>Recent activity</div>
                  {runs.filter(r=>r.sequence_id===selSeq.id||r.agent_type===selSeq.id).slice(0,6).map(run=>(
                    <div key={run.id} style={{ display:'flex', alignItems:'center', gap:11, padding:'9px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ width:7, height:7, borderRadius:'50%', background:STATUS_COLOR[run.status]||'rgba(255,255,255,0.3)', flexShrink:0 }}/>
                      <div style={{ flex:1, fontSize:12, color:'rgba(255,255,255,0.6)' }}>{run.agent_type||'Run'}</div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)' }}>{run.created_at?formatDistanceToNow(parseISO(run.created_at))+' ago':''}</div>
                      <span style={{ fontSize:10, fontWeight:600, color:STATUS_COLOR[run.status]||'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{run.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════ EMPTY RIGHT PANEL ════ */}
          {panel === 'list' && !selSeq && (
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:40, textAlign:'center', animation:'pageUp 0.3s ease both' }}>
              <div style={{ width:56, height:56, borderRadius:16, background:'rgba(77,159,255,0.07)', border:'1px solid rgba(77,159,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'#4D9FFF', marginBottom:20 }}>
                {Ic.bolt}
              </div>
              <h3 style={{ fontFamily:'var(--display)', fontSize:18, fontWeight:800, letterSpacing:'-0.03em', color:'rgba(255,255,255,0.85)', marginBottom:9 }}>
                {sequences.length > 0 ? 'Select a sequence' : 'Nothing running yet'}
              </h3>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.32)', lineHeight:1.75, maxWidth:360, marginBottom:24 }}>
                {sequences.length > 0
                  ? 'Click any sequence on the left to view its stats and manage it.'
                  : 'Build sequences that automatically email, publish, and nurture your audience — all written in your brand voice, running while you sleep.'}
              </p>
              <button
                onClick={() => { setPanel('builder'); setBName(''); setBSteps([]); setBTemplate(null) }}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 26px', fontSize:13, fontWeight:700, fontFamily:'var(--display)', letterSpacing:'-0.02em', background:'#4D9FFF', color:'#000', border:'none', borderRadius:11, cursor:'pointer', boxShadow:'0 4px 22px rgba(77,159,255,0.38)', transition:'all 0.18s' }}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-1px)';(e.currentTarget as HTMLElement).style.boxShadow='0 7px 28px rgba(77,159,255,0.48)'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.boxShadow='0 4px 22px rgba(77,159,255,0.38)'}}>
                <span style={{ display:'flex' }}>{Ic.plus}</span>Build first sequence
              </button>
            </div>
          )}

          {/* ════ WEBHOOKS ════ */}
          {panel === 'webhooks' && (
            <div style={{ flex:1, padding:'28px 32px', overflowY:'auto', animation:'pageUp 0.3s ease both' }}>
              <div style={{ marginBottom:24 }}>
                <h2 style={{ fontFamily:'var(--display)', fontSize:20, fontWeight:800, letterSpacing:'-0.04em', color:'rgba(255,255,255,0.92)', marginBottom:6 }}>Webhooks</h2>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>Trigger any Nexa automation from external tools — Zapier, Make, your CRM, or custom code.</p>
              </div>

              {/* Explainer */}
              <div style={{ padding:'16px 20px', background:'rgba(77,159,255,0.06)', border:'1px solid rgba(77,159,255,0.18)', borderRadius:14, marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#4D9FFF', marginBottom:7, letterSpacing:'-0.01em' }}>How it works</div>
                <div style={{ fontSize:12.5, color:'rgba(255,255,255,0.55)', lineHeight:1.7 }}>
                  Send a <code style={{ background:'rgba(77,159,255,0.12)', padding:'1px 6px', borderRadius:4, color:'#4D9FFF', fontSize:11 }}>POST</code> request to your webhook URL with a JSON body. Nexa triggers the connected automation instantly. Use it to connect any tool that supports webhooks.
                </div>
              </div>

              {webhooks.length > 0 ? webhooks.map(wh => (
                <div key={wh.id} style={{ padding:'16px 18px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, marginBottom:10 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.88)', marginBottom:4, letterSpacing:'-0.01em' }}>{wh.name||'Webhook'}</div>
                      <span style={{ fontSize:9, fontWeight:700, padding:'2px 9px', borderRadius:100, background:wh.is_active?'rgba(52,211,153,0.08)':'rgba(255,255,255,0.04)', border:`1px solid ${wh.is_active?'rgba(52,211,153,0.22)':'rgba(255,255,255,0.09)'}`, color:wh.is_active?'#34D399':'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.04em', display:'inline-block' }}>
                        {wh.is_active?'Active':'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 13px', background:'rgba(0,0,0,0.3)', borderRadius:9, fontFamily:'monospace', fontSize:11.5, color:'rgba(255,255,255,0.55)' }}>
                    <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{wh.url}</span>
                    <button onClick={() => copyUrl(wh.url, wh.id)}
                      style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 11px', borderRadius:7, fontSize:11, fontWeight:600, background:copiedId===wh.id?'rgba(52,211,153,0.1)':'rgba(255,255,255,0.06)', border:`1px solid ${copiedId===wh.id?'rgba(52,211,153,0.25)':'rgba(255,255,255,0.12)'}`, color:copiedId===wh.id?'#34D399':'rgba(255,255,255,0.5)', cursor:'pointer', fontFamily:'var(--sans)', transition:'all 0.14s', flexShrink:0 }}>
                      <span style={{ display:'flex' }}>{copiedId===wh.id?Ic.check:Ic.copy}</span>
                      {copiedId===wh.id?'Copied!':'Copy URL'}
                    </button>
                  </div>
                </div>
              )) : (
                <div style={{ padding:'32px', border:'1px dashed rgba(255,255,255,0.08)', borderRadius:14, textAlign:'center', color:'rgba(255,255,255,0.28)', fontSize:13, lineHeight:1.7 }}>
                  No webhooks configured yet.<br/>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.2)' }}>Webhooks are created when you set up external integrations.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, padding:'12px 20px', borderRadius:12, background:toast.ok?'rgba(52,211,153,0.1)':'rgba(255,87,87,0.12)', border:`1px solid ${toast.ok?'rgba(52,211,153,0.28)':'rgba(255,87,87,0.3)'}`, color:toast.ok?'#34D399':'#FF5757', fontSize:13, fontWeight:600, backdropFilter:'blur(16px)', boxShadow:'0 8px 32px rgba(0,0,0,0.45)', animation:'pageUp 0.2s ease both' }}>
          {toast.msg}
        </div>
      )}
    </>
  )
}
