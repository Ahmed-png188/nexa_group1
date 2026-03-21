'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

/* ─── Field types ─── */
type FieldType = 'text'|'email'|'phone'|'textarea'|'select'|'multiselect'|'checkbox'|'radio'|'number'|'url'

interface FormField {
  id:       string
  type:     FieldType
  label:    string
  placeholder?: string
  required: boolean
  options?: string[] // for select/radio/multiselect/checkbox
}

interface LeadPageConfig {
  slug:          string
  headline:      string
  subline:       string
  cta:           string
  theme:         string
  font:          string
  accent:        string
  logoUrl:       string
  showPoweredBy: boolean
  buttonStyle:   'filled'|'outline'|'soft'
  layout:        'centered'|'left'
  fields:        FormField[]
  // Lead magnet
  magnetEnabled: boolean
  magnetUrl:     string
  magnetLabel:   string
  magnetEmailSubject: string
  magnetEmailBody:    string
  // Automation
  autoEnroll:    boolean
  sequenceId:    string
}

/* ─── Themes ─── */
const THEMES: Record<string,{bg:string;surface:string;border:string;text1:string;text2:string;text3:string;label:string}> = {
  dark:     {bg:'#0C0C0C',surface:'#141414',border:'rgba(255,255,255,0.10)',text1:'#FFFFFF', text2:'rgba(255,255,255,0.72)',text3:'rgba(255,255,255,0.40)',label:'Dark'    },
  black:    {bg:'#000000',surface:'#0a0a0a',border:'rgba(255,255,255,0.08)',text1:'#FFFFFF', text2:'rgba(255,255,255,0.65)',text3:'rgba(255,255,255,0.35)',label:'Black'   },
  light:    {bg:'#F5F5F5',surface:'#FFFFFF',border:'rgba(0,0,0,0.10)',      text1:'#0C0C0C', text2:'rgba(0,0,0,0.65)',      text3:'rgba(0,0,0,0.40)',      label:'Light'   },
  warm:     {bg:'#FDF8F0',surface:'#FFFFFF',border:'rgba(0,0,0,0.08)',      text1:'#1a1208', text2:'rgba(26,18,8,0.65)',    text3:'rgba(26,18,8,0.40)',    label:'Warm'    },
  midnight: {bg:'#070B14',surface:'#0E1420',border:'rgba(100,160,255,0.12)',text1:'#E8F0FF', text2:'rgba(200,220,255,0.65)',text3:'rgba(160,190,255,0.38)',label:'Midnight'},
  rose:     {bg:'#0f0508',surface:'#1a0a10',border:'rgba(255,100,150,0.12)',text1:'#FFE8F0', text2:'rgba(255,220,235,0.65)',text3:'rgba(255,180,210,0.40)',label:'Rose'    },
}
const FONTS: Record<string,{family:string;label:string;sample:string}> = {
  geist: {family:"'Geist',-apple-system,sans-serif",      label:'Geist',  sample:'Clean & modern'     },
  inter: {family:"'Inter',system-ui,sans-serif",           label:'Inter',  sample:'Precise & neutral'  },
  dm:    {family:"'DM Sans',sans-serif",                   label:'DM Sans',sample:'Friendly & round'   },
  mono:  {family:"'Geist Mono',monospace",                 label:'Mono',   sample:'Technical & precise'},
  serif: {family:"Georgia,'Times New Roman',serif",        label:'Serif',  sample:'Classic & editorial'},
}
const ACCENTS = ['#00AAFF','#7C3AED','#059669','#DC2626','#D97706','#DB2777','#0891B2','#FFFFFF']

const FIELD_TYPES: {id:FieldType;label:string;icon:string}[] = [
  {id:'text',        label:'Short text',       icon:'T'   },
  {id:'email',       label:'Email',            icon:'@'   },
  {id:'phone',       label:'Phone number',     icon:'#'   },
  {id:'textarea',    label:'Long answer',      icon:'¶'   },
  {id:'number',      label:'Number',           icon:'0-9' },
  {id:'url',         label:'Website URL',      icon:'↗'   },
  {id:'select',      label:'Dropdown',         icon:'▾'   },
  {id:'radio',       label:'Single choice',    icon:'◉'   },
  {id:'multiselect', label:'Multiple choice',  icon:'☑'   },
  {id:'checkbox',    label:'Checkbox',         icon:'✓'   },
]

const DEFAULT_FIELDS: FormField[] = [
  {id:'f-name',  type:'text',  label:'Your name',       placeholder:'First name',        required:false},
  {id:'f-email', type:'email', label:'Email address',   placeholder:'you@example.com',   required:true },
  {id:'f-q',     type:'textarea',label:"What's your biggest challenge?", placeholder:'Your answer…', required:false},
]

/* ─── Live Preview ─── */
function LivePreview({cfg,brandName}:{cfg:LeadPageConfig;brandName:string}) {
  const t = THEMES[cfg.theme]||THEMES.dark
  const f = FONTS[cfg.font]?.family||FONTS.geist.family
  const a = cfg.accent||'#00AAFF'
  const isLight = ['light','warm'].includes(cfg.theme)
  const initial = brandName[0]?.toUpperCase()||'N'

  const btnBg    = cfg.buttonStyle==='filled'?a:cfg.buttonStyle==='soft'?`${a}20`:'transparent'
  const btnColor = cfg.buttonStyle==='filled'?(isLight?'#fff':'#000'):a
  const btnBorder= cfg.buttonStyle==='outline'?`2px solid ${a}`:'none'

  const inpBase:React.CSSProperties = {
    width:'100%', padding:'9px 11px',
    background: isLight?'rgba(0,0,0,0.05)':'rgba(255,255,255,0.07)',
    border:`1px solid ${t.border}`, borderRadius:8,
    color:t.text3, fontSize:12, fontFamily:f, boxSizing:'border-box',
  }

  function renderField(field:FormField) {
    if (field.type==='textarea') return <div style={{...inpBase,minHeight:56,lineHeight:1.5}}>{field.placeholder||''}</div>
    if (field.type==='select') return (
      <div style={{...inpBase,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span>{field.placeholder||'Select…'}</span><span style={{opacity:0.4,fontSize:10}}>▾</span>
      </div>
    )
    if (field.type==='radio'||field.type==='multiselect') return (
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {(field.options||['Option 1','Option 2']).slice(0,3).map((o,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:8,fontSize:12,color:t.text2}}>
            <div style={{width:15,height:15,borderRadius:field.type==='radio'?'50%':4,border:`1.5px solid ${t.border}`,flexShrink:0,background:'transparent'}}/>
            {o}
          </div>
        ))}
      </div>
    )
    if (field.type==='checkbox') return (
      <div style={{display:'flex',alignItems:'center',gap:8,fontSize:12,color:t.text2}}>
        <div style={{width:15,height:15,borderRadius:4,border:`1.5px solid ${t.border}`,flexShrink:0}}/>
        <span>{field.label}</span>
      </div>
    )
    return <div style={inpBase}>{field.placeholder||<span style={{opacity:0}}>&nbsp;</span>}</div>
  }

  return (
    <div style={{
      width:'100%', height:'100%',
      background:t.bg, fontFamily:f,
      overflowY:'auto', overflowX:'hidden',
      padding:'32px 24px 40px',
      display:'flex', flexDirection:'column', alignItems:'center',
      position:'relative',
    }}>
      {/* Ambient glow */}
      <div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:'140%',height:200,background:`radial-gradient(ellipse,${a}20 0%,transparent 65%)`,pointerEvents:'none',zIndex:0}}/>

      <div style={{width:'100%',maxWidth:280,position:'relative',zIndex:1,textAlign:cfg.layout==='left'?'left':'center'}}>

        {/* Logo */}
        <div style={{marginBottom:20, paddingLeft:cfg.layout==='left'?'18px':0, paddingRight:cfg.layout==='left'?'18px':0}}>
          {cfg.logoUrl
            ?<img src={cfg.logoUrl} alt={brandName} style={{width:56,height:56,borderRadius:16,objectFit:'cover',display:cfg.layout==='left'?'block':'inline-block',marginBottom:14,border:`1.5px solid ${t.border}`,boxShadow:`0 4px 16px ${a}20`}}/>
            :<div style={{width:56,height:56,borderRadius:16,background:`${a}20`,border:`1.5px solid ${a}40`,display:'flex',alignItems:'center',justifyContent:'center',margin:cfg.layout==='left'?'0 0 14px':'0 auto 14px',fontSize:22,fontWeight:700,color:a,boxShadow:`0 4px 20px ${a}25`}}>{initial}</div>
          }
          <div style={{fontSize:18,fontWeight:700,color:t.text1,letterSpacing:'-0.03em',marginBottom:6,lineHeight:1.2,fontFamily:f}}>
            {cfg.headline||`Get in touch with ${brandName}`}
          </div>
          <div style={{fontSize:12,color:t.text2,lineHeight:1.65,fontFamily:f}}>
            {cfg.subline||"Drop your details and we'll be in touch soon."}
          </div>
        </div>

        {/* Form card */}
        <div style={{
          background:t.surface,
          border:`1px solid ${t.border}`,
          borderRadius:16,
          padding:'20px 18px',
          position:'relative',
          overflow:'hidden',
          boxShadow:`0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px ${a}08`,
          textAlign:'left',
        }}>
          {/* Accent line top */}
          <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${a}70,transparent)`}}/>

          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {cfg.fields.map(field=>(
              <div key={field.id}>
                {field.type!=='checkbox'&&(
                  <div style={{fontSize:9,fontWeight:700,letterSpacing:'0.07em',textTransform:'uppercase' as const,color:t.text3,marginBottom:5,lineHeight:1,textAlign:'left' as const}}>
                    {field.label}{field.required&&<span style={{color:a,marginLeft:2}}>*</span>}
                  </div>
                )}
                {renderField(field)}
              </div>
            ))}

            {cfg.magnetEnabled&&cfg.magnetLabel&&(
              <div style={{padding:'9px 11px',background:`${a}12`,border:`1px solid ${a}28`,borderRadius:8,display:'flex',alignItems:'center',gap:7}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={a} strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span style={{fontSize:11,fontWeight:600,color:a}}>{cfg.magnetLabel}</span>
              </div>
            )}

            <button style={{
              width:'100%', padding:'12px',
              background:btnBg, color:btnColor,
              border:btnBorder, borderRadius:10,
              fontFamily:f, fontSize:13, fontWeight:700,
              cursor:'pointer', letterSpacing:'-0.01em',
              boxShadow:cfg.buttonStyle==='filled'?`0 4px 16px ${a}45`:'none',
              marginTop:2,
            }}>
              {cfg.cta||'Send →'}
            </button>
          </div>
        </div>

        {cfg.showPoweredBy&&(
          <div style={{textAlign:'center',marginTop:14,fontSize:10,color:t.text3,opacity:0.7}}>
            Powered by <span style={{color:a,fontWeight:600}}>nexaa.cc</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Reusable UI ─── */
function Section({title,children}:{title:string;children:React.ReactNode}) {
  return (
    <div style={{marginBottom:24}}>
      <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase' as const,color:'var(--text-3)',marginBottom:12,paddingBottom:8,borderBottom:'1px solid var(--border-subtle)'}}>{title}</div>
      {children}
    </div>
  )
}
function Lbl({children,hint}:{children:React.ReactNode;hint?:string}) {
  return <div style={{fontSize:11,fontWeight:600,color:'var(--text-3)',marginBottom:6}}>{children}{hint&&<span style={{fontWeight:400,marginLeft:4,opacity:0.7}}>{hint}</span>}</div>
}
function Toggle({label,desc,value,onChange}:{label:string;desc?:string;value:boolean;onChange:(v:boolean)=>void}) {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 0'}}>
      <div><div style={{fontSize:13,fontWeight:500,color:'var(--text-1)'}}>{label}</div>{desc&&<div style={{fontSize:11,color:'var(--text-3)',marginTop:1}}>{desc}</div>}</div>
      <button onClick={()=>onChange(!value)} style={{width:36,height:20,borderRadius:10,background:value?'var(--cyan)':'var(--border)',border:'none',cursor:'pointer',position:'relative',transition:'background 0.2s',flexShrink:0}}>
        <div style={{position:'absolute',top:2,left:value?17:2,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left 0.2s',boxShadow:'0 1px 4px rgba(0,0,0,0.3)'}}/>
      </button>
    </div>
  )
}

/* ─── Field editor row ─── */
function FieldRow({field,index,total,onChange,onDelete,onMove}:{field:FormField;index:number;total:number;onChange:(f:FormField)=>void;onDelete:()=>void;onMove:(dir:1|-1)=>void}) {
  const [open,setOpen] = useState(false)
  const hasOptions = ['select','radio','multiselect'].includes(field.type)
  return (
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',marginBottom:8,overflow:'hidden'}}>
      <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',cursor:'pointer'}} onClick={()=>setOpen(o=>!o)}>
        <div style={{width:24,height:24,borderRadius:6,background:'var(--elevated)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'var(--text-3)',flexShrink:0}}>
          {FIELD_TYPES.find(f=>f.id===field.type)?.icon||'T'}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:500,color:'var(--text-1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{field.label||'Untitled field'}</div>
          <div style={{fontSize:10,color:'var(--text-3)'}}>{FIELD_TYPES.find(f=>f.id===field.type)?.label} {field.required?'· Required':'· Optional'}</div>
        </div>
        <div style={{display:'flex',gap:4,alignItems:'center'}}>
          <button onClick={e=>{e.stopPropagation();onMove(-1)}} disabled={index===0} style={{background:'none',border:'none',cursor:index===0?'not-allowed':'pointer',color:'var(--text-3)',padding:'2px 4px',opacity:index===0?0.3:1,fontSize:12}}>↑</button>
          <button onClick={e=>{e.stopPropagation();onMove(1)}} disabled={index===total-1} style={{background:'none',border:'none',cursor:index===total-1?'not-allowed':'pointer',color:'var(--text-3)',padding:'2px 4px',opacity:index===total-1?0.3:1,fontSize:12}}>↓</button>
          <button onClick={e=>{e.stopPropagation();onDelete()}} style={{background:'none',border:'none',cursor:'pointer',color:'var(--error)',padding:'2px 6px',fontSize:12}}>✕</button>
          <span style={{color:'var(--text-4)',fontSize:11}}>{open?'▲':'▼'}</span>
        </div>
      </div>
      {open&&(
        <div style={{padding:'0 12px 12px',borderTop:'1px solid var(--border-subtle)',paddingTop:12,display:'flex',flexDirection:'column',gap:10}}>
          <div>
            <Lbl>Field type</Lbl>
            <select value={field.type} onChange={e=>onChange({...field,type:e.target.value as FieldType,options:['select','radio','multiselect'].includes(e.target.value)?['Option 1','Option 2']:undefined})}
              className="nexa-input" style={{fontSize:12,cursor:'pointer'}}>
              {FIELD_TYPES.map(ft=><option key={ft.id} value={ft.id}>{ft.label}</option>)}
            </select>
          </div>
          <div>
            <Lbl>Label</Lbl>
            <input value={field.label} onChange={e=>onChange({...field,label:e.target.value})} className="nexa-input" style={{fontSize:12}} placeholder="Field label"/>
          </div>
          {field.type!=='checkbox'&&field.type!=='radio'&&field.type!=='multiselect'&&(
            <div>
              <Lbl>Placeholder</Lbl>
              <input value={field.placeholder||''} onChange={e=>onChange({...field,placeholder:e.target.value})} className="nexa-input" style={{fontSize:12}} placeholder="Placeholder text"/>
            </div>
          )}
          {hasOptions&&(
            <div>
              <Lbl>Options <span style={{fontWeight:400,color:'var(--text-4)'}}>(one per line)</span></Lbl>
              <textarea value={(field.options||[]).join('\n')} onChange={e=>onChange({...field,options:e.target.value.split('\n').filter(Boolean)})}
                className="nexa-input" style={{fontSize:12,resize:'vertical' as const,minHeight:80,lineHeight:1.6}}
                placeholder={'Option 1\nOption 2\nOption 3'}/>
            </div>
          )}
          <Toggle label="Required" desc="Visitor can't submit without filling this" value={field.required} onChange={v=>onChange({...field,required:v})}/>
        </div>
      )}
    </div>
  )
}

/* ─── Submissions table ─── */
function Submissions({wsId,sequences,toast_}:{wsId:string;sequences:any[];toast_:(m:string,ok?:boolean)=>void}) {
  const supabase = createClient()
  const [subs,setSubs]     = useState<any[]>([])
  const [loading,setLoading] = useState(true)
  const [selected,setSelected] = useState<Set<string>>(new Set())
  const [adding,setAdding]   = useState(false)

  useEffect(()=>{
    supabase.from('contacts').select('*').eq('workspace_id',wsId).eq('source','lead_page').order('created_at',{ascending:false}).then(({data})=>{
      setSubs(data||[])
      setLoading(false)
    })
  },[wsId])

  function toggleAll() {
    if (selected.size===subs.length) setSelected(new Set())
    else setSelected(new Set(subs.map(s=>s.id)))
  }

  function exportCSV() {
    const rows = [['Name','Email','Phone','Notes','Date']]
    const toExport = subs.filter(s=>selected.size===0||selected.has(s.id))
    toExport.forEach(s=>rows.push([s.name||'',s.email||'',s.phone||'',s.notes||'',s.created_at?.slice(0,10)||'']))
    const csv = rows.map(r=>r.map(v=>`"${v.replace(/"/g,'""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,'+encodeURIComponent(csv)
    a.download = 'leads.csv'
    a.click()
    toast_(`Exported ${toExport.length} leads`)
  }

  async function addToContacts() {
    const toAdd = subs.filter(s=>selected.size===0||selected.has(s.id))
    setAdding(true)
    await supabase.from('contacts').upsert(toAdd.map(s=>({...s,tags:[...new Set([...(s.tags||[]),'lead'])]})),{onConflict:'workspace_id,email'})
    toast_(`${toAdd.length} contacts updated`)
    setAdding(false)
  }

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:40}}><div className="nexa-spinner" style={{width:18,height:18}}/></div>

  return (
    <div>
      {/* Toolbar */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <div>
          <div style={{fontSize:16,fontWeight:600,color:'var(--text-1)',letterSpacing:'-0.02em'}}>Submissions</div>
          <div style={{fontSize:12,color:'var(--text-3)',marginTop:2}}>{subs.length} lead{subs.length!==1?'s':''} captured</div>
        </div>
        <div style={{display:'flex',gap:8}}>
          {subs.length>0&&<>
            <button onClick={exportCSV} className="btn-secondary" style={{fontSize:12,padding:'7px 12px',display:'flex',alignItems:'center',gap:6}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export CSV
            </button>
            <button onClick={addToContacts} disabled={adding} className="btn-accent" style={{fontSize:12,padding:'7px 12px',display:'flex',alignItems:'center',gap:6}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
              {adding?'Adding…':'Add to contacts'}
            </button>
          </>}
        </div>
      </div>

      {subs.length===0?(
        <div className="empty-state" style={{minHeight:'30vh'}}>
          <div style={{width:44,height:44,borderRadius:12,background:'var(--cyan-dim)',border:'1px solid var(--cyan-border)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--cyan)'}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <div className="empty-state-title">No submissions yet</div>
          <div className="empty-state-desc">Share your lead page link and submissions will appear here in real time.</div>
        </div>
      ):(
        <>
          {/* Select all row */}
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',marginBottom:8,fontSize:12,color:'var(--text-3)'}}>
            <input type="checkbox" checked={selected.size===subs.length&&subs.length>0} onChange={toggleAll} style={{accentColor:'var(--cyan)',cursor:'pointer'}}/>
            <span>{selected.size>0?`${selected.size} selected`:'Select all'}</span>
            {selected.size>0&&<span style={{marginLeft:'auto',color:'var(--cyan)',cursor:'pointer',fontWeight:600}} onClick={()=>setSelected(new Set())}>Clear</span>}
          </div>

          {/* Rows */}
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {subs.map(s=>(
              <div key={s.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:'var(--surface)',border:`1px solid ${selected.has(s.id)?'var(--cyan-border)':'var(--border)'}`,borderRadius:'var(--r)',transition:'border-color 0.15s'}}>
                <input type="checkbox" checked={selected.has(s.id)} onChange={e=>{const n=new Set(selected);e.target.checked?n.add(s.id):n.delete(s.id);setSelected(n)}} style={{accentColor:'var(--cyan)',cursor:'pointer',flexShrink:0}}/>
                <div style={{width:32,height:32,borderRadius:'50%',background:'var(--cyan-dim)',border:'1px solid var(--cyan-border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'var(--cyan)',flexShrink:0}}>
                  {(s.name||s.email||'?')[0].toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:500,color:'var(--text-1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.name||'—'}</div>
                  <div style={{fontSize:11,color:'var(--text-3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.email}</div>
                </div>
                {s.phone&&<div style={{fontSize:11,color:'var(--text-3)',flexShrink:0}}>{s.phone}</div>}
                {s.notes&&(
                  <div style={{fontSize:11,color:'var(--text-2)',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',background:'var(--elevated)',border:'1px solid var(--border)',borderRadius:6,padding:'2px 8px'}} title={s.notes}>
                    {s.notes}
                  </div>
                )}
                <div style={{fontSize:10,color:'var(--text-4)',flexShrink:0,fontFamily:'var(--mono)'}}>{s.created_at?.slice(0,10)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ═══════════════════════════════════
   MAIN PAGE
═══════════════════════════════════ */
export default function LeadPageEditor() {
  const supabase  = createClient()
  const logoRef   = useRef<HTMLInputElement>(null)

  const [ws,        setWs]        = useState<any>(null)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast,     setToast]     = useState<{msg:string;ok:boolean}|null>(null)
  const [sequences, setSequences] = useState<any[]>([])
  const [view,      setView]      = useState<'editor'|'submissions'>('editor')
  const [section,   setSection]   = useState<'content'|'fields'|'design'|'settings'>('content')

  const [cfg, setCfg] = useState<LeadPageConfig>({
    slug:'',headline:'',subline:'',cta:'Send →',
    theme:'dark',font:'geist',accent:'#00AAFF',logoUrl:'',
    showPoweredBy:true,buttonStyle:'filled',layout:'centered',
    fields:DEFAULT_FIELDS,
    magnetEnabled:false,magnetUrl:'',magnetLabel:'Download free resource',
    magnetEmailSubject:'Here is your free resource!',magnetEmailBody:'Hi {{name}},\n\nHere is the link you requested:\n{{url}}\n\nEnjoy!',
    autoEnroll:false,sequenceId:'',
  })

  const brandName  = ws?.brand_name||ws?.name||'Your Brand'
  const plan       = ws?.plan||'spark'
  const canRemoveBranding = ['scale','agency'].includes(plan)

  // AI state
  const [aiGoal,      setAiGoal]      = useState('')
  const [aiGenerating,setAiGenerating]= useState(false)
  const [aiPanel,     setAiPanel]     = useState(false)
  const [aiReasoning, setAiReasoning] = useState('')

  function toast_(msg:string,ok=true){setToast({msg,ok});setTimeout(()=>setToast(null),3000)}
  function upd<K extends keyof LeadPageConfig>(key:K,val:LeadPageConfig[K]){setCfg(p=>({...p,[key]:val}));setSaved(false)}

  async function generateWithAI() {
    if (!ws||aiGenerating) return
    setAiGenerating(true)
    try {
      const r = await fetch('/api/lead-page/generate', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({workspace_id:ws.id, goal:aiGoal}),
      })
      const d = await r.json()
      if (!d.success) throw new Error(d.error)
      const g = d.result
      // Apply generated config, preserve slug and logoUrl
      setCfg(p=>({
        ...p,
        headline:      g.headline      || p.headline,
        subline:       g.subline       || p.subline,
        cta:           g.cta           || p.cta,
        fields:        g.fields?.length ? g.fields : p.fields,
        magnetEnabled: g.magnetEnabled ?? p.magnetEnabled,
        magnetLabel:   g.magnetLabel   || p.magnetLabel,
        magnetEmailSubject: g.magnetEmailSubject || p.magnetEmailSubject,
        magnetEmailBody:    g.magnetEmailBody    || p.magnetEmailBody,
        theme:         g.theme         || p.theme,
        accent:        g.accent        || p.accent,
      }))
      setAiReasoning(g.reasoning||'')
      setSaved(false)
      setAiPanel(false)
      toast_('✦ Nexa generated your form!')
    } catch(e) { toast_('Generation failed — try again', false) }
    setAiGenerating(false)
  }

  useEffect(()=>{load()},[])

  async function load(){
    const {data:{user}} = await supabase.auth.getUser()
    if (!user) return
    const {data:m} = await supabase.from('workspace_members').select('workspace_id,workspaces(*)').eq('user_id',user.id).limit(1).single()
    const w=(m as any)?.workspaces; setWs(w)
    const {data:seqs} = await supabase.from('email_sequences').select('id,name').eq('workspace_id',(m as any)?.workspace_id).eq('status','active')
    setSequences(seqs||[])
    if (w){
      let fields:FormField[] = DEFAULT_FIELDS
      try { if (w.lead_page_fields) fields=JSON.parse(w.lead_page_fields) } catch{}
      setCfg({
        slug:               w.slug||(w.name||'').toLowerCase().replace(/[^a-z0-9]/g,'-').replace(/-+/g,'-').slice(0,30)||'',
        headline:           w.lead_page_headline||'',
        subline:            w.lead_page_subline||'',
        cta:                w.lead_page_cta||'Send →',
        theme:              w.lead_page_theme||'dark',
        font:               w.lead_page_font||'geist',
        accent:             w.lead_page_accent||'#00AAFF',
        logoUrl:            w.lead_page_logo_url||'',
        showPoweredBy:      w.lead_page_show_powered_by??true,
        buttonStyle:        w.lead_page_button_style||'filled',
        layout:             w.lead_page_layout||'centered',
        fields,
        magnetEnabled:      w.lead_magnet_enabled||false,
        magnetUrl:          w.lead_magnet_url||'',
        magnetLabel:        w.lead_magnet_label||'Download free resource',
        magnetEmailSubject: w.lead_magnet_email_subject||'Here is your free resource!',
        magnetEmailBody:    w.lead_magnet_email_body||'',
        autoEnroll:         w.lead_page_auto_enroll||false,
        sequenceId:         w.lead_page_sequence_id||'',
      })
    }
    setLoading(false)
  }

  async function uploadLogo(file:File){
    if (!ws||uploading) return; setUploading(true)
    try{
      const ext=file.name.split('.').pop()
      const path=`${ws.id}/lead-logo-${Date.now()}.${ext}`
      const {error:e} = await supabase.storage.from('brand-assets').upload(path,file,{upsert:true})
      if (e) throw e
      const {data:u} = supabase.storage.from('brand-assets').getPublicUrl(path)
      upd('logoUrl',u.publicUrl)
      toast_('Logo uploaded!')
    } catch { toast_('Upload failed',false) }
    setUploading(false)
  }

  async function save(){
    if (!ws||saving) return; setSaving(true)
    try {
      const res = await fetch('/api/lead-page/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id:               ws.id,
          slug:                       cfg.slug.trim()||ws.slug,
          lead_page_headline:         cfg.headline||null,
          lead_page_subline:          cfg.subline||null,
          lead_page_cta:              cfg.cta||'Send →',
          lead_page_theme:            cfg.theme,
          lead_page_font:             cfg.font,
          lead_page_accent:           cfg.accent,
          lead_page_logo_url:         cfg.logoUrl||null,
          lead_page_show_powered_by:  canRemoveBranding?cfg.showPoweredBy:true,
          lead_page_button_style:     cfg.buttonStyle,
          lead_page_layout:           cfg.layout,
          lead_page_fields:           JSON.stringify(cfg.fields),
          lead_page_auto_enroll:      cfg.autoEnroll,
          lead_page_sequence_id:      cfg.sequenceId||null,
          lead_magnet_enabled:        cfg.magnetEnabled,
          lead_magnet_url:            cfg.magnetUrl||null,
          lead_magnet_label:          cfg.magnetLabel||null,
          lead_magnet_email_subject:  cfg.magnetEmailSubject||null,
          lead_magnet_email_body:     cfg.magnetEmailBody||null,
        }),
      })
      const d = await res.json()
      if (!res.ok || d.error) {
        toast_(`Save failed: ${d.error||res.statusText}`, false)
      } else {
        toast_('✓ Published — changes are live at nexaa.cc/' + (cfg.slug||ws.slug))
        setSaved(true)
        setTimeout(()=>setSaved(false),3000)
      }
    } catch(e) {
      toast_('Save failed — check connection', false)
    }
    setSaving(false)
  }

  function addField(type:FieldType){
    const id=`f-${Date.now()}`
    const defaults:Partial<Record<FieldType,Partial<FormField>>>={
      text:        {label:'Short answer',placeholder:'Your answer'},
      email:       {label:'Email address',placeholder:'you@example.com'},
      phone:       {label:'Phone number',placeholder:'+1 (555) 000-0000'},
      textarea:    {label:'Tell us more',placeholder:'Your answer…'},
      number:      {label:'Number',placeholder:'0'},
      url:         {label:'Website',placeholder:'https://'},
      select:      {label:'Choose one',options:['Option 1','Option 2','Option 3']},
      radio:       {label:'Choose one',options:['Option 1','Option 2','Option 3']},
      multiselect: {label:'Choose all that apply',options:['Option 1','Option 2','Option 3']},
      checkbox:    {label:'I agree to the terms'},
    }
    upd('fields',[...cfg.fields,{id,type,required:false,...defaults[type]} as FormField])
  }

  function updateField(idx:number,field:FormField){const f=[...cfg.fields];f[idx]=field;upd('fields',f)}
  function deleteField(idx:number){upd('fields',cfg.fields.filter((_,i)=>i!==idx))}
  function moveField(idx:number,dir:1|-1){
    const f=[...cfg.fields];const t=idx+dir
    if(t<0||t>=f.length)return
    ;[f[idx],f[t]]=[f[t],f[idx]];upd('fields',f)
  }

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'calc(100vh - var(--topbar-h))',flexDirection:'column',gap:14}}>
      <div className="nexa-spinner" style={{width:22,height:22}}/>
      <div style={{fontSize:11,color:'var(--text-3)',letterSpacing:'0.06em',textTransform:'uppercase' as const}}>Loading</div>
    </div>
  )

  const liveUrl = cfg.slug?`https://nexaa.cc/${cfg.slug}`:null

  return (
    <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - var(--topbar-h))',overflow:'hidden'}}>

      {/* ── TOP BAR ── */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px',height:52,borderBottom:'1px solid var(--border)',flexShrink:0,background:'var(--surface)'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {/* View toggle */}
          <div style={{display:'flex',background:'var(--elevated)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:3,gap:2}}>
            {([['editor','Editor'],['submissions','Submissions']] as const).map(([v,l])=>(
              <button key={v} onClick={()=>setView(v)}
                style={{padding:'5px 14px',borderRadius:7,border:'none',background:view===v?'var(--surface)':'transparent',color:view===v?'var(--text-1)':'var(--text-3)',fontSize:12,fontWeight:view===v?600:400,cursor:'pointer',fontFamily:'var(--sans)',transition:'all 0.15s'}}>
                {l}
              </button>
            ))}
          </div>
          {liveUrl&&<a href={liveUrl} target="_blank" rel="noreferrer" style={{fontSize:11,color:'var(--cyan)',fontFamily:'var(--mono)',textDecoration:'none',opacity:0.8}}>{liveUrl.replace('https://','')}</a>}
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {liveUrl&&(
            <button onClick={()=>{navigator.clipboard.writeText(liveUrl);toast_('Link copied!')}} className="btn-secondary" style={{fontSize:12,padding:'6px 12px',display:'flex',alignItems:'center',gap:6}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copy link
            </button>
          )}
          {/* AI Generate button */}
          <button onClick={()=>setAiPanel(p=>!p)}
            style={{padding:'7px 14px',fontSize:12,fontWeight:600,borderRadius:'var(--r)',border:'1px solid var(--cyan-border)',background:aiPanel?'var(--cyan-dim)':'transparent',color:'var(--cyan)',cursor:'pointer',fontFamily:'var(--sans)',display:'flex',alignItems:'center',gap:6,transition:'all 0.15s'}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9.5 2a2.5 2.5 0 0 1 5 0"/><path d="M9.5 22a2.5 2.5 0 0 0 5 0"/><path d="M14.5 2C17 2 19 4 19 6.5c0 2-1.5 3.5-3.5 4C17 11 19 12.5 19 15c0 2.5-2 4.5-4.5 4.5"/><path d="M9.5 2C7 2 5 4 5 6.5c0 2 1.5 3.5 3.5 4C7 11 5 12.5 5 15c0 2.5 2 4.5 4.5 4.5"/></svg>
            Generate with Nexa
          </button>
          <button onClick={save} disabled={saving}
            style={{padding:'7px 18px',fontSize:13,fontWeight:600,borderRadius:'var(--r)',border:'none',cursor:saving?'not-allowed':'pointer',fontFamily:'var(--sans)',transition:'all 0.2s',
              background:saved?'var(--success-dim)':saving?'var(--elevated)':'var(--text-1)',
              color:saved?'var(--success)':saving?'var(--text-3)':'var(--bg)'}}>
            {saving?'Saving…':saved?'✓ Published':'Publish'}
          </button>
        </div>
      </div>

      {/* ── AI PANEL ── */}
      {aiPanel&&(
        <div style={{padding:'14px 20px',background:'var(--cyan-dim)',borderBottom:'1px solid var(--cyan-border)',flexShrink:0,animation:'pageUp 0.2s ease both'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            {/* Icon + label */}
            <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="1.5" strokeLinecap="round"><path d="M9.5 2a2.5 2.5 0 0 1 5 0"/><path d="M9.5 22a2.5 2.5 0 0 0 5 0"/><path d="M14.5 2C17 2 19 4 19 6.5c0 2-1.5 3.5-3.5 4C17 11 19 12.5 19 15c0 2.5-2 4.5-4.5 4.5"/><path d="M9.5 2C7 2 5 4 5 6.5c0 2 1.5 3.5 3.5 4C7 11 5 12.5 5 15c0 2.5 2 4.5 4.5 4.5"/></svg>
              <span style={{fontSize:12,fontWeight:600,color:'var(--cyan)',whiteSpace:'nowrap' as const}}>What is this form for?</span>
            </div>
            {/* Input */}
            <input
              value={aiGoal}
              onChange={e=>setAiGoal(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&generateWithAI()}
              placeholder={`e.g. "Capture leads for my free PDF", "Book strategy calls", "Newsletter waitlist"`}
              style={{flex:1,padding:'8px 12px',background:'rgba(0,170,255,0.10)',border:'1px solid var(--cyan-border)',borderRadius:'var(--r)',color:'var(--text-1)',fontSize:12,fontFamily:'var(--sans)',outline:'none',boxSizing:'border-box' as const}}
            />
            {/* Generate button */}
            <button
              onClick={generateWithAI}
              disabled={aiGenerating}
              className="btn-primary"
              style={{fontSize:12,padding:'8px 16px',flexShrink:0,display:'flex',alignItems:'center',gap:6,whiteSpace:'nowrap' as const}}>
              {aiGenerating
                ?<><div className="nexa-spinner" style={{width:12,height:12,borderTopColor:'#000'}}/>Generating…</>
                :<>✦ Generate</>}
            </button>
          </div>
          {aiReasoning&&(
            <div style={{marginTop:8,fontSize:11,color:'var(--cyan)',opacity:0.75,fontStyle:'italic',paddingLeft:2}}>✦ {aiReasoning}</div>
          )}
        </div>
      )}

      {/* ── BODY ── */}
      {view==='submissions'?(
        <div style={{flex:1,overflowY:'auto',padding:'32px 36px'}}>
          {ws&&<Submissions wsId={ws.id} sequences={sequences} toast_={toast_}/>}
        </div>
      ):(
        <div style={{display:'grid',gridTemplateColumns:'360px 1fr',flex:1,overflow:'hidden'}}>

          {/* LEFT PANEL */}
          <div style={{borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
            {/* Section tabs */}
            <div style={{display:'flex',borderBottom:'1px solid var(--border)',flexShrink:0}}>
              {(['content','fields','design','settings'] as const).map(s=>(
                <button key={s} onClick={()=>setSection(s)}
                  style={{flex:1,padding:'10px 4px',background:'none',border:'none',borderBottom:`2px solid ${section===s?'var(--cyan)':'transparent'}`,color:section===s?'var(--text-1)':'var(--text-3)',cursor:'pointer',fontSize:11,fontWeight:section===s?600:400,fontFamily:'var(--sans)',transition:'all 0.15s',marginBottom:-1,textTransform:'capitalize' as const}}>
                  {s}
                </button>
              ))}
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'18px'}}>

              {/* ── CONTENT ── */}
              {section==='content'&&(
                <>
                  <Section title="Page URL">
                    <div style={{display:'flex',alignItems:'center',background:'rgba(255,255,255,0.04)',border:'1px solid var(--border)',borderRadius:'var(--r)',overflow:'hidden'}}>
                      <div style={{padding:'9px 10px',fontSize:12,color:'var(--text-3)',fontFamily:'var(--mono)',borderRight:'1px solid var(--border-subtle)',whiteSpace:'nowrap' as const,flexShrink:0}}>nexaa.cc/</div>
                      <input value={cfg.slug} onChange={e=>upd('slug',e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,30))}
                        placeholder="yourname" style={{flex:1,padding:'9px 10px',fontSize:12,background:'transparent',border:'none',color:'var(--text-1)',outline:'none',fontFamily:'var(--mono)'}}/>
                    </div>
                  </Section>

                  <Section title="Logo">
                    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
                      <div style={{width:52,height:52,borderRadius:12,background:'var(--elevated)',border:'1px solid var(--border)',overflow:'hidden',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                        {cfg.logoUrl?<img src={cfg.logoUrl} alt="logo" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                          :<div style={{fontSize:18,fontWeight:700,color:'var(--text-4)'}}>{brandName[0]?.toUpperCase()}</div>}
                      </div>
                      <div style={{flex:1}}>
                        <button onClick={()=>logoRef.current?.click()} disabled={uploading} className="btn-secondary" style={{width:'100%',fontSize:12,display:'flex',alignItems:'center',gap:6,justifyContent:'center'}}>
                          {uploading?<><div className="nexa-spinner" style={{width:11,height:11}}/>Uploading…</>
                            :<><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>Upload logo</>}
                        </button>
                        <input ref={logoRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>e.target.files?.[0]&&uploadLogo(e.target.files[0])}/>
                        {cfg.logoUrl&&<button onClick={()=>upd('logoUrl','')} style={{marginTop:5,background:'none',border:'none',fontSize:11,color:'var(--error)',cursor:'pointer',padding:0,width:'100%',textAlign:'center' as const}}>Remove</button>}
                      </div>
                    </div>
                    <div style={{fontSize:11,color:'var(--text-3)'}}>PNG, JPG · Square · Max 2MB</div>
                  </Section>

                  <Section title="Copy">
                    <Lbl>Headline</Lbl>
                    <input value={cfg.headline} onChange={e=>upd('headline',e.target.value)} placeholder={`Get in touch with ${brandName}`} className="nexa-input" style={{marginBottom:10,fontSize:12}}/>
                    <Lbl>Subline</Lbl>
                    <input value={cfg.subline} onChange={e=>upd('subline',e.target.value)} placeholder="Drop your details and we'll be in touch soon." className="nexa-input" style={{marginBottom:10,fontSize:12}}/>
                    <Lbl>Button label</Lbl>
                    <input value={cfg.cta} onChange={e=>upd('cta',e.target.value)} placeholder="Send →" className="nexa-input" style={{fontSize:12}}/>
                  </Section>

                  <Section title="Lead magnet">
                    <Toggle label="Enable lead magnet" desc="Unlock a resource when someone submits" value={cfg.magnetEnabled} onChange={v=>upd('magnetEnabled',v)}/>
                    {cfg.magnetEnabled&&(
                      <div style={{marginTop:10,display:'flex',flexDirection:'column',gap:10}}>
                        <div><Lbl>Button label</Lbl><input value={cfg.magnetLabel} onChange={e=>upd('magnetLabel',e.target.value)} className="nexa-input" style={{fontSize:12}} placeholder="Download free resource"/></div>
                        <div><Lbl hint="(paste a direct download link or Google Drive URL)">Resource URL</Lbl><input value={cfg.magnetUrl} onChange={e=>upd('magnetUrl',e.target.value)} className="nexa-input" style={{fontSize:12}} placeholder="https://…"/></div>
                        <div>
                          <Lbl>Email subject sent to submitter</Lbl>
                          <input value={cfg.magnetEmailSubject} onChange={e=>upd('magnetEmailSubject',e.target.value)} className="nexa-input" style={{fontSize:12}} placeholder="Here is your free resource!"/>
                        </div>
                        <div>
                          <Lbl hint="Use {{name}} and {{url}}">Email body</Lbl>
                          <textarea value={cfg.magnetEmailBody} onChange={e=>upd('magnetEmailBody',e.target.value)} className="nexa-input" style={{fontSize:12,resize:'vertical' as const,minHeight:100,lineHeight:1.6}} placeholder={'Hi {{name}},\n\nHere is the link:\n{{url}}'}/>
                        </div>
                        <div style={{fontSize:11,color:'var(--text-3)',padding:'8px 10px',background:'var(--cyan-dim)',border:'1px solid var(--cyan-border)',borderRadius:'var(--r-sm)'}}>
                          The resource link is sent by email after submission — visitors must fill all required fields first.
                        </div>
                      </div>
                    )}
                  </Section>
                </>
              )}

              {/* ── FIELDS ── */}
              {section==='fields'&&(
                <>
                  <Section title="Form fields">
                    {cfg.fields.map((field,i)=>(
                      <FieldRow key={field.id} field={field} index={i} total={cfg.fields.length}
                        onChange={f=>updateField(i,f)} onDelete={()=>deleteField(i)} onMove={d=>moveField(i,d)}/>
                    ))}
                  </Section>
                  <Section title="Add field">
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                      {FIELD_TYPES.map(ft=>(
                        <button key={ft.id} onClick={()=>addField(ft.id)}
                          style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',background:'rgba(255,255,255,0.03)',border:'1px solid var(--border)',borderRadius:'var(--r)',cursor:'pointer',fontSize:12,color:'var(--text-2)',transition:'all 0.15s',fontFamily:'var(--sans)'}}
                          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--border-strong)';(e.currentTarget as HTMLElement).style.color='var(--text-1)'}}
                          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--border)';(e.currentTarget as HTMLElement).style.color='var(--text-2)'}}>
                          <span style={{width:20,height:20,borderRadius:5,background:'var(--elevated)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'var(--text-3)',flexShrink:0}}>{ft.icon}</span>
                          {ft.label}
                        </button>
                      ))}
                    </div>
                  </Section>
                </>
              )}

              {/* ── DESIGN ── */}
              {section==='design'&&(
                <>
                  <Section title="Theme">
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                      {Object.entries(THEMES).map(([id,t])=>(
                        <button key={id} onClick={()=>upd('theme',id)}
                          style={{padding:'10px 8px',borderRadius:'var(--r)',background:t.bg,border:`2px solid ${cfg.theme===id?cfg.accent:'transparent'}`,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:5,transition:'border-color 0.15s'}}>
                          <div style={{width:'100%',height:18,borderRadius:4,background:t.surface,border:`1px solid ${t.border}`}}/>
                          <div style={{fontSize:10,fontWeight:600,color:cfg.theme===id?cfg.accent:t.text2}}>{t.label}</div>
                        </button>
                      ))}
                    </div>
                  </Section>

                  <Section title="Accent color">
                    <div style={{display:'flex',gap:7,marginBottom:10,flexWrap:'wrap' as const}}>
                      {ACCENTS.map(c=>(
                        <button key={c} onClick={()=>upd('accent',c)}
                          style={{width:26,height:26,borderRadius:'50%',background:c,border:`3px solid ${cfg.accent===c?'var(--text-1)':'transparent'}`,cursor:'pointer',transition:'all 0.15s',outline:cfg.accent===c?'1px solid var(--border)':'none'}}/>
                      ))}
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <input type="color" value={cfg.accent} onChange={e=>upd('accent',e.target.value)}
                        style={{width:36,height:34,padding:3,background:'var(--elevated)',border:'1px solid var(--border)',borderRadius:'var(--r)',cursor:'pointer'}}/>
                      <input value={cfg.accent} onChange={e=>upd('accent',e.target.value)} placeholder="#00AAFF" className="nexa-input" style={{flex:1,fontSize:12}}/>
                      <div style={{width:34,height:34,borderRadius:'var(--r)',background:cfg.accent,border:'1px solid var(--border)',flexShrink:0}}/>
                    </div>
                  </Section>

                  <Section title="Font">
                    <div style={{display:'flex',flexDirection:'column',gap:6}}>
                      {Object.entries(FONTS).map(([id,f])=>(
                        <button key={id} onClick={()=>upd('font',id)}
                          style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 12px',borderRadius:'var(--r)',background:cfg.font===id?'var(--cyan-dim)':'rgba(255,255,255,0.03)',border:`1px solid ${cfg.font===id?'var(--cyan-border)':'var(--border)'}`,cursor:'pointer',transition:'all 0.15s'}}>
                          <span style={{fontSize:12,fontWeight:600,color:cfg.font===id?'var(--cyan)':'var(--text-2)'}}>{f.label}</span>
                          <span style={{fontSize:12,color:'var(--text-3)',fontFamily:f.family}}>{f.sample}</span>
                        </button>
                      ))}
                    </div>
                  </Section>

                  <Section title="Layout">
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
                      {[{id:'centered',label:'Centered'},{id:'left',label:'Left aligned'}].map(l=>(
                        <button key={l.id} onClick={()=>upd('layout',l.id as any)}
                          style={{padding:'9px',borderRadius:'var(--r)',background:cfg.layout===l.id?'var(--cyan-dim)':'rgba(255,255,255,0.03)',border:`1px solid ${cfg.layout===l.id?'var(--cyan-border)':'var(--border)'}`,cursor:'pointer',fontSize:12,fontWeight:cfg.layout===l.id?600:400,color:cfg.layout===l.id?'var(--cyan)':'var(--text-2)',transition:'all 0.15s'}}>
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </Section>

                  <Section title="Button style">
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
                      {[{id:'filled',label:'Filled'},{id:'outline',label:'Outline'},{id:'soft',label:'Soft'}].map(b=>(
                        <button key={b.id} onClick={()=>upd('buttonStyle',b.id as any)}
                          style={{padding:'9px',borderRadius:'var(--r)',background:cfg.buttonStyle===b.id?'var(--cyan-dim)':'rgba(255,255,255,0.03)',border:`1px solid ${cfg.buttonStyle===b.id?'var(--cyan-border)':'var(--border)'}`,cursor:'pointer',fontSize:12,fontWeight:cfg.buttonStyle===b.id?600:400,color:cfg.buttonStyle===b.id?'var(--cyan)':'var(--text-2)',transition:'all 0.15s'}}>
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </Section>

                  <Section title="Branding">
                    {canRemoveBranding?(
                      <Toggle label="'Powered by Nexa'" desc="Turn off to make the page fully yours" value={cfg.showPoweredBy} onChange={v=>upd('showPoweredBy',v)}/>
                    ):(
                      <div className="card" style={{padding:'12px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
                        <div>
                          <div style={{fontSize:13,fontWeight:500,color:'var(--text-2)'}}>Remove Nexa branding</div>
                          <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>Available on Scale & Agency plans</div>
                        </div>
                        <a href="/dashboard/settings?tab=billing" className="btn-accent" style={{fontSize:11,padding:'5px 10px',textDecoration:'none',whiteSpace:'nowrap' as const}}>Upgrade</a>
                      </div>
                    )}
                  </Section>
                </>
              )}

              {/* ── SETTINGS ── */}
              {section==='settings'&&(
                <>
                  <Section title="Lead behavior">
                    <Toggle label="Auto-enroll in email sequence" desc="Add new leads to a sequence automatically" value={cfg.autoEnroll} onChange={v=>upd('autoEnroll',v)}/>
                    {cfg.autoEnroll&&(
                      <div style={{marginTop:10}}>
                        <Lbl>Sequence</Lbl>
                        <select value={cfg.sequenceId} onChange={e=>upd('sequenceId',e.target.value)} className="nexa-input" style={{cursor:'pointer',fontSize:12}}>
                          <option value="">Choose a sequence…</option>
                          {sequences.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        {sequences.length===0&&<div style={{fontSize:11,color:'var(--text-3)',marginTop:6}}>No active sequences. <a href="/dashboard/automate" style={{color:'var(--cyan)'}}>Create one →</a></div>}
                      </div>
                    )}
                  </Section>

                  <Section title="Integrations">
                    <div className="card" style={{padding:'14px',marginBottom:8}}>
                      <div style={{fontSize:13,fontWeight:600,color:'var(--text-1)',marginBottom:2}}>Typeform webhook</div>
                      <div style={{fontSize:11,color:'var(--text-3)',marginBottom:8}}>Paste this URL in Typeform → Connect → Webhooks</div>
                      {ws?.id&&<div style={{fontSize:10,color:'var(--text-3)',fontFamily:'var(--mono)',wordBreak:'break-all' as const,padding:'6px 9px',background:'rgba(255,255,255,0.03)',border:'1px solid var(--border-subtle)',borderRadius:'var(--r-sm)'}}>
                        nexaa.cc/api/integrations/typeform/webhook?workspace_id={ws.id}
                      </div>}
                    </div>
                  </Section>
                </>
              )}

            </div>
          </div>

          {/* RIGHT PANEL — Live preview */}
          <div style={{background:'#0a0a0a',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'28px 24px',position:'relative',overflow:'hidden',gap:16}}>

            {/* Live preview label */}
            <div style={{position:'absolute',top:16,left:'50%',transform:'translateX(-50%)',fontSize:10,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase' as const,color:'rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:999,padding:'4px 12px',whiteSpace:'nowrap' as const}}>
              Live preview
            </div>

            {/* Phone shell */}
            <div style={{
              width:280, flexShrink:0,
              borderRadius:44,
              background:'linear-gradient(145deg,#2a2a2a,#1a1a1a)',
              padding:10,
              boxShadow:'0 40px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.1)',
              position:'relative',
            }}>
              {/* Side buttons */}
              <div style={{position:'absolute',left:-3,top:80,width:3,height:28,background:'#333',borderRadius:'2px 0 0 2px'}}/>
              <div style={{position:'absolute',left:-3,top:118,width:3,height:48,background:'#333',borderRadius:'2px 0 0 2px'}}/>
              <div style={{position:'absolute',left:-3,top:176,width:3,height:48,background:'#333',borderRadius:'2px 0 0 2px'}}/>
              <div style={{position:'absolute',right:-3,top:110,width:3,height:72,background:'#333',borderRadius:'0 2px 2px 0'}}/>

              {/* Screen bezel */}
              <div style={{
                borderRadius:36,
                overflow:'hidden',
                background:'#000',
                position:'relative',
              }}>
                {/* Dynamic island */}
                <div style={{position:'absolute',top:10,left:'50%',transform:'translateX(-50%)',width:90,height:28,background:'#000',borderRadius:14,zIndex:20,display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                  <div style={{width:10,height:10,borderRadius:'50%',background:'#111',border:'1px solid #222'}}/>
                  <div style={{width:18,height:10,borderRadius:5,background:'#111',border:'1px solid #222'}}/>
                </div>

                {/* Screen content */}
                <div style={{height:540,overflow:'hidden',position:'relative'}}>
                  <div style={{paddingTop:48,height:'100%'}}>
                    <LivePreview cfg={cfg} brandName={brandName}/>
                  </div>
                </div>

                {/* Home indicator */}
                <div style={{background:THEMES[cfg.theme]?.bg||'#0C0C0C',padding:'8px 0 12px',display:'flex',justifyContent:'center'}}>
                  <div style={{width:100,height:4,borderRadius:2,background:'rgba(255,255,255,0.2)'}}/>
                </div>
              </div>
            </div>

            {/* Info pill */}
            <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 14px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:999}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:THEMES[cfg.theme]?.bg||'#0C0C0C',border:'1px solid rgba(255,255,255,0.15)'}}/>
              <span style={{fontSize:11,color:'rgba(255,255,255,0.35)',fontFamily:'var(--sans)'}}>{THEMES[cfg.theme]?.label||'Dark'} · {FONTS[cfg.font]?.label||'Geist'}</span>
              <div style={{width:8,height:8,borderRadius:'50%',background:cfg.accent||'#00AAFF',boxShadow:`0 0 6px ${cfg.accent||'#00AAFF'}60`}}/>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast&&(
        <div style={{position:'fixed',bottom:24,right:24,zIndex:9999,padding:'11px 18px',borderRadius:'var(--r)',background:toast.ok?'var(--success-dim)':'var(--error-dim)',border:`1px solid ${toast.ok?'var(--success-border)':'var(--error-border)'}`,color:toast.ok?'var(--success)':'var(--error)',fontSize:13,fontWeight:600,backdropFilter:'blur(16px)',boxShadow:'0 8px 32px rgba(0,0,0,0.45)',animation:'pageUp 0.2s ease both'}}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
