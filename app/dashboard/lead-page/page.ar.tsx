'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── الثوابت ────────────────────────────────────────────────────
const F    = "'Tajawal', system-ui, sans-serif"
const MONO = "'Geist Mono', monospace"

// ── أنواع الحقول ───────────────────────────────────────────────
type FieldType = 'text'|'email'|'phone'|'textarea'|'select'|'multiselect'|'checkbox'|'radio'|'number'|'url'

interface FormField {
  id:           string
  type:         FieldType
  label:        string
  placeholder?: string
  required:     boolean
  options?:     string[]
}

interface LeadPageConfig {
  slug:               string
  headline:           string
  subline:            string
  cta:                string
  theme:              string
  font:               string
  accent:             string
  logoUrl:            string
  showPoweredBy:      boolean
  buttonStyle:        'filled'|'outline'|'soft'
  layout:             'centered'|'left'
  formLang:           'auto'|'en'|'ar'
  fields:             FormField[]
  magnetEnabled:      boolean
  magnetUrl:          string
  magnetLabel:        string
  magnetEmailSubject: string
  magnetEmailBody:    string
  autoEnroll:         boolean
  sequenceId:         string
}

// ── السمات البصرية ─────────────────────────────────────────────
const THEMES: Record<string,{bg:string;surface:string;border:string;text1:string;text2:string;text3:string;label:string}> = {
  dark:     { bg:'#0C0C0C', surface:'#141414', border:'rgba(255,255,255,0.10)', text1:'#FFFFFF',  text2:'rgba(255,255,255,0.72)', text3:'rgba(255,255,255,0.40)', label:'داكن'           },
  black:    { bg:'#000000', surface:'#0a0a0a', border:'rgba(255,255,255,0.08)', text1:'#FFFFFF',  text2:'rgba(255,255,255,0.65)', text3:'rgba(255,255,255,0.35)', label:'أسود'           },
  light:    { bg:'#F5F5F5', surface:'#FFFFFF', border:'rgba(0,0,0,0.10)',       text1:'#0C0C0C',  text2:'rgba(0,0,0,0.65)',       text3:'rgba(0,0,0,0.40)',       label:'فاتح'           },
  warm:     { bg:'#FDF8F0', surface:'#FFFFFF', border:'rgba(0,0,0,0.08)',       text1:'#1a1208',  text2:'rgba(26,18,8,0.65)',     text3:'rgba(26,18,8,0.40)',     label:'دافئ'           },
  midnight: { bg:'#070B14', surface:'#0E1420', border:'rgba(100,160,255,0.12)', text1:'#E8F0FF',  text2:'rgba(200,220,255,0.65)', text3:'rgba(160,190,255,0.38)', label:'منتصف الليل'   },
  rose:     { bg:'#0f0508', surface:'#1a0a10', border:'rgba(255,100,150,0.12)', text1:'#FFE8F0',  text2:'rgba(255,220,235,0.65)', text3:'rgba(255,180,210,0.40)', label:'وردي'           },
}

// ── الخطوط ─────────────────────────────────────────────────────
const FONTS: Record<string,{family:string;label:string;sample:string}> = {
  tajawal: { family:"'Tajawal', system-ui, sans-serif",   label:'تجوّل',  sample:'نظيف وعصري'     },
  geist:   { family:"'Geist', -apple-system, sans-serif", label:'Geist',  sample:'Clean & modern'  },
  inter:   { family:"'Inter', system-ui, sans-serif",     label:'Inter',  sample:'Precise & sharp'  },
  dm:      { family:"'DM Sans', sans-serif",               label:'DM Sans',sample:'Rounded & soft'  },
  mono:    { family:"'Geist Mono', monospace",             label:'Mono',   sample:'Technical'        },
  serif:   { family:"Georgia, 'Times New Roman', serif",   label:'Serif',  sample:'كلاسيكي وأنيق'   },
}

// ── ألوان التمييز ──────────────────────────────────────────────
const ACCENTS = ['#00AAFF','#7C3AED','#059669','#DC2626','#D97706','#DB2777','#0891B2','#FFFFFF']

// ── أنواع الحقول بالعربي ───────────────────────────────────────
const FIELD_TYPES: { id: FieldType; label: string; icon: string }[] = [
  { id:'text',        label:'نص قصير',         icon:'T'   },
  { id:'email',       label:'بريد إلكتروني',   icon:'@'   },
  { id:'phone',       label:'رقم الهاتف',       icon:'#'   },
  { id:'textarea',    label:'إجابة مطوّلة',    icon:'¶'   },
  { id:'number',      label:'رقم',              icon:'٩٠' },
  { id:'url',         label:'رابط موقع',        icon:'↗'   },
  { id:'select',      label:'قائمة منسدلة',     icon:'▾'   },
  { id:'radio',       label:'اختيار واحد',      icon:'◉'   },
  { id:'multiselect', label:'اختيارات متعددة',  icon:'☑'   },
  { id:'checkbox',    label:'خانة اختيار',      icon:'✓'   },
]

// ── الحقول الافتراضية ─────────────────────────────────────────
const DEFAULT_FIELDS: FormField[] = [
  { id:'f-name',  type:'text',     label:'اسمك',                    placeholder:'الاسم الأول',      required:false },
  { id:'f-email', type:'email',    label:'البريد الإلكتروني',       placeholder:'name@example.com', required:true  },
  { id:'f-q',     type:'textarea', label:'ما أكبر تحدٍّ تواجهه؟',  placeholder:'إجابتك…',          required:false },
]

// ── المعاينة المباشرة ─────────────────────────────────────────
function LivePreview({ cfg, brandName }: { cfg: LeadPageConfig; brandName: string }) {
  const t       = THEMES[cfg.theme] || THEMES.dark
  const isPreviewAr = cfg.formLang !== 'en' // default AR for AR editor, unless explicitly EN
  const fam     = isPreviewAr ? (FONTS[cfg.font]?.family || FONTS.tajawal.family) : "'Geist', -apple-system, sans-serif"
  const a       = cfg.accent || '#00AAFF'
  const isLight = ['light','warm'].includes(cfg.theme)
  const initial = brandName[0]?.toUpperCase() || 'N'
  const dir     = isPreviewAr ? 'rtl' : 'ltr'

  const btnBg     = cfg.buttonStyle==='filled' ? a : cfg.buttonStyle==='soft' ? `${a}20` : 'transparent'
  const btnColor  = cfg.buttonStyle==='filled' ? (isLight?'#fff':'#000') : a
  const btnBorder = cfg.buttonStyle==='outline' ? `2px solid ${a}` : 'none'

  const inpBase: React.CSSProperties = {
    width:'100%', padding:'9px 11px',
    background: isLight?'rgba(0,0,0,0.05)':'rgba(255,255,255,0.07)',
    border: `1px solid ${t.border}`, borderRadius:8,
    color: t.text3, fontSize:12, fontFamily:fam, boxSizing:'border-box',
    textAlign: isPreviewAr ? 'right' : 'left' as const,
    direction: dir,
  }

  function renderField(field: FormField) {
    if (field.type==='textarea')
      return <div style={{ ...inpBase, minHeight:56, lineHeight:1.5 }}>{field.placeholder||''}</div>

    if (field.type==='select')
      return (
        <div style={{ ...inpBase, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          {isPreviewAr ? <><span style={{ opacity:0.5, fontSize:10 }}>▾</span><span>{field.placeholder || 'اختر…'}</span></> : <><span>{field.placeholder || 'Select…'}</span><span style={{ opacity:0.5, fontSize:10 }}>▾</span></>}
        </div>
      )

    if (field.type==='radio' || field.type==='multiselect')
      return (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {(field.options||['Option 1','Option 2']).slice(0,3).map((o,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:t.text2, direction:dir, flexDirection:isPreviewAr?'row-reverse':'row' }}>
              <div style={{ width:15, height:15, borderRadius:field.type==='radio'?'50%':4, border:`1.5px solid ${t.border}`, flexShrink:0, background:'transparent' }}/>
              {o}
            </div>
          ))}
        </div>
      )

    if (field.type==='checkbox')
      return (
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:t.text2, direction:dir, flexDirection:isPreviewAr?'row-reverse':'row' }}>
          <div style={{ width:15, height:15, borderRadius:4, border:`1.5px solid ${t.border}`, flexShrink:0 }}/>
          <span>{field.label}</span>
        </div>
      )

    return <div style={inpBase}>{field.placeholder || <span style={{ opacity:0 }}>&nbsp;</span>}</div>
  }

  return (
    <div dir={dir} style={{
      width:'100%', height:'100%',
      background:t.bg, fontFamily:fam,
      overflowY:'auto', overflowX:'hidden',
      padding:'32px 24px 40px',
      display:'flex', flexDirection:'column', alignItems:'center',
      position:'relative',
    }}>
      {/* توهج الخلفية */}
      <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'140%', height:200, background:`radial-gradient(ellipse,${a}20 0%,transparent 65%)`, pointerEvents:'none', zIndex:0 }}/>

      <div style={{ width:'100%', maxWidth:280, position:'relative', zIndex:1, textAlign:cfg.layout==='left'?'right':'center' }}>

        {/* الشعار */}
        <div style={{ marginBottom:20 }}>
          {cfg.logoUrl
            ? <img src={cfg.logoUrl} alt={brandName} style={{ width:56, height:56, borderRadius:16, objectFit:'cover', display:cfg.layout==='left'?'block':'inline-block', marginBottom:14, border:`1.5px solid ${t.border}`, boxShadow:`0 4px 16px ${a}20` }}/>
            : <div style={{ width:56, height:56, borderRadius:16, background:`${a}20`, border:`1.5px solid ${a}40`, display:'flex', alignItems:'center', justifyContent:'center', margin:cfg.layout==='left'?'0 0 14px':'0 auto 14px', fontSize:22, fontWeight:700, color:a, boxShadow:`0 4px 20px ${a}25` }}>{initial}</div>
          }
          <div style={{ fontSize:18, fontWeight:700, color:t.text1, letterSpacing:'-0.02em', marginBottom:6, lineHeight:1.3, fontFamily:fam }}>
            {cfg.headline || `تواصل مع ${brandName}`}
          </div>
          <div style={{ fontSize:12, color:t.text2, lineHeight:1.7, fontFamily:fam }}>
            {cfg.subline || 'اترك بياناتك وسنتواصل معك في أقرب وقت.'}
          </div>
        </div>

        {/* بطاقة النموذج */}
        <div style={{
          background:t.surface,
          border:`1px solid ${t.border}`,
          borderRadius:16,
          padding:'20px 18px',
          position:'relative',
          overflow:'hidden',
          boxShadow:`0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px ${a}08`,
          textAlign:'right',
        }}>
          {/* خط اللون العلوي */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${a}70,transparent)` }}/>

          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {cfg.fields.map(field => (
              <div key={field.id}>
                {field.type !== 'checkbox' && (
                  <div style={{ fontSize:9, fontWeight:700, letterSpacing:isPreviewAr?0:'0.07em', color:t.text3, marginBottom:5, lineHeight:1, textAlign:isPreviewAr?'right':'left' as const }}>
                    {field.label}{field.required && <span style={{ color:a, [isPreviewAr?'marginRight':'marginLeft']:2 }}>*</span>}
                  </div>
                )}
                {renderField(field)}
              </div>
            ))}

            {cfg.magnetEnabled && cfg.magnetLabel && (
              <div style={{ padding:'9px 11px', background:`${a}12`, border:`1px solid ${a}28`, borderRadius:8, display:'flex', alignItems:'center', gap:7 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={a} strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span style={{ fontSize:11, fontWeight:600, color:a }}>{cfg.magnetLabel}</span>
              </div>
            )}

            <button style={{
              width:'100%', padding:'12px',
              background:btnBg, color:btnColor,
              border:btnBorder, borderRadius:10,
              fontFamily:fam, fontSize:13, fontWeight:700,
              cursor:'pointer', letterSpacing:'-0.01em',
              boxShadow:cfg.buttonStyle==='filled'?`0 4px 16px ${a}45`:'none',
              marginTop:2,
            }}>
              {cfg.cta || 'أرسل →'}
            </button>
          </div>
        </div>

        {cfg.showPoweredBy && (
          <div style={{ textAlign:'center', marginTop:14, fontSize:10, color:t.text3, opacity:0.7 }}>
            بدعم من <span style={{ color:a, fontWeight:600 }}>nexaa.cc</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── مكوّنات واجهة المستخدم المشتركة ──────────────────────────
function Section({ title, children }: { title:string; children:React.ReactNode }) {
  return (
    <div style={{ marginBottom:24 }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' as const, color:'var(--text-3)', marginBottom:12, paddingBottom:8, borderBottom:'1px solid var(--border-subtle)' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Lbl({ children, hint }: { children:React.ReactNode; hint?:string }) {
  return (
    <div style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', marginBottom:6 }}>
      {children}{hint && <span style={{ fontWeight:400, marginRight:4, opacity:0.7 }}>{hint}</span>}
    </div>
  )
}

function Toggle({ label, desc, value, onChange }: { label:string; desc?:string; value:boolean; onChange:(v:boolean)=>void }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 0' }}>
      <div>
        <div style={{ fontSize:13, fontWeight:500, color:'var(--text-1)' }}>{label}</div>
        {desc && <div style={{ fontSize:11, color:'var(--text-3)', marginTop:1 }}>{desc}</div>}
      </div>
      <button onClick={() => onChange(!value)}
        style={{ width:36, height:20, borderRadius:10, background:value?'var(--cyan)':'var(--border)', border:'none', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
        <div style={{ position:'absolute', top:2, left:value?17:2, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.3)' }}/>
      </button>
    </div>
  )
}

// ── صف تحرير الحقل ────────────────────────────────────────────
function FieldRow({ field, index, total, onChange, onDelete, onMove }: {
  field:FormField; index:number; total:number
  onChange:(f:FormField)=>void; onDelete:()=>void; onMove:(dir:1|-1)=>void
}) {
  const [open, setOpen] = useState(false)
  const hasOptions = ['select','radio','multiselect'].includes(field.type)

  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', marginBottom:8, overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', cursor:'pointer' }} onClick={() => setOpen(o => !o)}>
        <div style={{ width:24, height:24, borderRadius:6, background:'var(--elevated)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'var(--text-3)', flexShrink:0 }}>
          {FIELD_TYPES.find(f => f.id===field.type)?.icon || 'T'}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:500, color:'var(--text-1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {field.label || 'حقل بدون اسم'}
          </div>
          <div style={{ fontSize:10, color:'var(--text-3)' }}>
            {FIELD_TYPES.find(f => f.id===field.type)?.label}{field.required ? ' · مطلوب' : ' · اختياري'}
          </div>
        </div>
        <div style={{ display:'flex', gap:4, alignItems:'center' }}>
          <button onClick={e=>{e.stopPropagation();onMove(-1)}} disabled={index===0}
            style={{ background:'none', border:'none', cursor:index===0?'not-allowed':'pointer', color:'var(--text-3)', padding:'2px 4px', opacity:index===0?0.3:1, fontSize:12 }}>↑</button>
          <button onClick={e=>{e.stopPropagation();onMove(1)}} disabled={index===total-1}
            style={{ background:'none', border:'none', cursor:index===total-1?'not-allowed':'pointer', color:'var(--text-3)', padding:'2px 4px', opacity:index===total-1?0.3:1, fontSize:12 }}>↓</button>
          <button onClick={e=>{e.stopPropagation();onDelete()}}
            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--error)', padding:'2px 6px', fontSize:12 }}>✕</button>
          <span style={{ color:'var(--text-4)', fontSize:11 }}>{open?'▲':'▼'}</span>
        </div>
      </div>

      {open && (
        <div style={{ padding:'12px', borderTop:'1px solid var(--border-subtle)', display:'flex', flexDirection:'column', gap:10 }}>
          <div>
            <Lbl>نوع الحقل</Lbl>
            <select value={field.type}
              onChange={e => onChange({ ...field, type:e.target.value as FieldType, options:['select','radio','multiselect'].includes(e.target.value)?['خيار ١','خيار ٢']:undefined })}
              className="nexa-input" style={{ fontSize:12, cursor:'pointer' }}>
              {FIELD_TYPES.map(ft => <option key={ft.id} value={ft.id}>{ft.label}</option>)}
            </select>
          </div>
          <div>
            <Lbl>التسمية</Lbl>
            <input value={field.label} onChange={e => onChange({ ...field, label:e.target.value })}
              className="nexa-input" style={{ fontSize:12 }} placeholder="اسم الحقل"/>
          </div>
          {field.type!=='checkbox' && field.type!=='radio' && field.type!=='multiselect' && (
            <div>
              <Lbl>النص التوضيحي</Lbl>
              <input value={field.placeholder||''} onChange={e => onChange({ ...field, placeholder:e.target.value })}
                className="nexa-input" style={{ fontSize:12 }} placeholder="ما يظهر داخل الحقل"/>
            </div>
          )}
          {hasOptions && (
            <div>
              <Lbl hint="(خيار في كل سطر)">الخيارات</Lbl>
              <textarea
                value={(field.options||[]).join('\n')}
                onChange={e => onChange({ ...field, options:e.target.value.split('\n').filter(Boolean) })}
                className="nexa-input"
                style={{ fontSize:12, resize:'vertical' as const, minHeight:80, lineHeight:1.6 }}
                placeholder={'خيار ١\nخيار ٢\nخيار ٣'}/>
            </div>
          )}
          <Toggle label="مطلوب" desc="لا يمكن الإرسال بدون ملء هذا الحقل" value={field.required} onChange={v => onChange({ ...field, required:v })}/>
        </div>
      )}
    </div>
  )
}

// ── جدول الاستجابات ───────────────────────────────────────────
function Submissions({ wsId, sequences, toast_ }: { wsId:string; sequences:any[]; toast_:(m:string,ok?:boolean)=>void }) {
  const supabase  = createClient()
  const [subs,     setSubs]     = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [adding,   setAdding]   = useState(false)

  useEffect(() => {
    supabase.from('contacts').select('*')
      .eq('workspace_id', wsId).eq('source','lead_page')
      .order('created_at',{ascending:false})
      .then(({ data }) => { setSubs(data||[]); setLoading(false) })
  }, [wsId])

  function toggleAll() {
    if (selected.size === subs.length) setSelected(new Set())
    else setSelected(new Set(subs.map(s => s.id)))
  }

  function exportCSV() {
    const rows = [['الاسم','البريد الإلكتروني','الهاتف','ملاحظات','التاريخ']]
    const toExport = subs.filter(s => selected.size===0 || selected.has(s.id))
    toExport.forEach(s => rows.push([s.name||'', s.email||'', s.phone||'', s.notes||'', s.created_at?.slice(0,10)||'']))
    const csv = rows.map(r => r.map(v => `"${v.replace(/"/g,'""')}"`).join(',')).join('\n')
    const anchor = document.createElement('a')
    anchor.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv)
    anchor.download = 'leads.csv'
    anchor.click()
    toast_(`تم تصدير ${toExport.length} عميل محتمل`)
  }

  async function addToContacts() {
    const toAdd = subs.filter(s => selected.size===0 || selected.has(s.id))
    setAdding(true)
    await supabase.from('contacts').upsert(
      toAdd.map(s => ({ ...s, tags:Array.from(new Set([...(s.tags||[]),'lead'])) })),
      { onConflict:'workspace_id,email' }
    )
    toast_(`تم تحديث ${toAdd.length} جهة اتصال`)
    setAdding(false)
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:40 }}>
      <div className="nexa-spinner" style={{ width:18, height:18 }}/>
    </div>
  )

  return (
    <div dir="rtl">
      {/* شريط الأدوات */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:600, color:'var(--text-1)', letterSpacing:'-0.02em', fontFamily:F }}>الاستجابات</div>
          <div style={{ fontSize:12, color:'var(--text-3)', marginTop:2, fontFamily:F }}>
            {subs.length > 0 ? `${subs.length} عميل محتمل` : 'لا توجد استجابات بعد'}
          </div>
        </div>
        {subs.length > 0 && (
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={exportCSV} className="btn-secondary" style={{ fontSize:12, padding:'7px 12px', display:'flex', alignItems:'center', gap:6, fontFamily:F }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              تصدير CSV
            </button>
            <button onClick={addToContacts} disabled={adding} className="btn-accent" style={{ fontSize:12, padding:'7px 12px', display:'flex', alignItems:'center', gap:6, fontFamily:F }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
              {adding ? 'جارٍ الإضافة…' : 'أضف للجهات'}
            </button>
          </div>
        )}
      </div>

      {subs.length === 0 ? (
        <div className="empty-state" style={{ minHeight:'30vh' }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'var(--cyan-dim)', border:'1px solid var(--cyan-border)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--cyan)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <div className="empty-state-title" style={{ fontFamily:F }}>لا توجد استجابات بعد</div>
          <div className="empty-state-desc" style={{ fontFamily:F }}>شارك رابط صفحتك وستظهر الاستجابات هنا فور وصولها.</div>
        </div>
      ) : (
        <>
          {/* صف التحديد الكلي */}
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 14px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', marginBottom:8, fontSize:12, color:'var(--text-3)', fontFamily:F }}>
            <input type="checkbox" checked={selected.size===subs.length && subs.length>0} onChange={toggleAll} style={{ accentColor:'var(--cyan)', cursor:'pointer' }}/>
            <span>{selected.size > 0 ? `${selected.size} محدد` : 'تحديد الكل'}</span>
            {selected.size > 0 && (
              <span style={{ marginRight:'auto', color:'var(--cyan)', cursor:'pointer', fontWeight:600 }} onClick={() => setSelected(new Set())}>إلغاء</span>
            )}
          </div>

          {/* صفوف الاستجابات */}
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {subs.map(s => (
              <div key={s.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'var(--surface)', border:`1px solid ${selected.has(s.id)?'var(--cyan-border)':'var(--border)'}`, borderRadius:'var(--r)', transition:'border-color 0.15s' }}>
                <input type="checkbox" checked={selected.has(s.id)} onChange={e => {
                  const n = new Set(selected)
                  e.target.checked ? n.add(s.id) : n.delete(s.id)
                  setSelected(n)
                }} style={{ accentColor:'var(--cyan)', cursor:'pointer', flexShrink:0 }}/>
                <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--cyan-dim)', border:'1px solid var(--cyan-border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'var(--cyan)', flexShrink:0 }}>
                  {(s.name||s.email||'?')[0].toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:'var(--text-1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:F }}>{s.name||'—'}</div>
                  <div style={{ fontSize:11, color:'var(--text-3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:MONO }}>{s.email}</div>
                </div>
                {s.phone && <div style={{ fontSize:11, color:'var(--text-3)', flexShrink:0, fontFamily:MONO }}>{s.phone}</div>}
                {s.notes && (
                  <div style={{ fontSize:11, color:'var(--text-2)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', background:'var(--elevated)', border:'1px solid var(--border)', borderRadius:6, padding:'2px 8px', fontFamily:F }} title={s.notes}>
                    {s.notes}
                  </div>
                )}
                <div style={{ fontSize:10, color:'var(--text-4)', flexShrink:0, fontFamily:MONO, direction:'ltr' }}>
                  {s.created_at?.slice(0,10)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ══════════════════════════════════════
//   الصفحة الرئيسية
// ══════════════════════════════════════
export default function LeadPageEditorAr() {
  const supabase = createClient()
  const logoRef  = useRef<HTMLInputElement>(null)

  const [ws,        setWs]        = useState<any>(null)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast,     setToast]     = useState<{ msg:string; ok:boolean }|null>(null)
  const [sequences, setSequences] = useState<any[]>([])
  const [view,      setView]      = useState<'editor'|'submissions'>('editor')
  const [section,   setSection]   = useState<'content'|'fields'|'design'|'settings'>('content')

  const [cfg, setCfg] = useState<LeadPageConfig>({
    slug:'', headline:'', subline:'', cta:'أرسل →',
    theme:'dark', font:'tajawal', accent:'#00AAFF', logoUrl:'',
    showPoweredBy:true, buttonStyle:'filled', layout:'centered', formLang:'auto' as const,
    fields:DEFAULT_FIELDS,
    magnetEnabled:false, magnetUrl:'', magnetLabel:'حمّل المورد المجاني',
    magnetEmailSubject:'إليك المورد الذي طلبته!',
    magnetEmailBody:'مرحباً {{name}}،\n\nإليك الرابط الذي طلبته:\n{{url}}\n\nاستمتع به!',
    autoEnroll:false, sequenceId:'',
  })

  // ── الذكاء الاصطناعي ─────────────────────────────────────
  const [aiGoal,       setAiGoal]       = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiPanel,      setAiPanel]      = useState(false)
  const [aiReasoning,  setAiReasoning]  = useState('')

  const brandName         = ws?.brand_name || ws?.name || 'علامتك'
  const plan              = ws?.plan || 'spark'
  const canRemoveBranding = ['scale','agency'].includes(plan)

  function toast_(msg:string, ok=true) { setToast({msg,ok}); setTimeout(()=>setToast(null),3000) }
  function upd<K extends keyof LeadPageConfig>(key:K, val:LeadPageConfig[K]) { setCfg(p=>({...p,[key]:val})); setSaved(false) }

  // ── توليد بالذكاء الاصطناعي ─────────────────────────────
  async function generateWithAI() {
    if (!ws || aiGenerating) return
    setAiGenerating(true)
    try {
      const r = await fetch('/api/lead-page/generate',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ workspace_id:ws.id, goal:aiGoal, lang:'ar' }),
      })
      const d = await r.json()
      if (!d.success) throw new Error(d.error)
      const g = d.result
      setCfg(p=>({
        ...p,
        headline:           g.headline           || p.headline,
        subline:            g.subline            || p.subline,
        cta:                g.cta                || p.cta,
        fields:             g.fields?.length     ? g.fields : p.fields,
        magnetEnabled:      g.magnetEnabled      ?? p.magnetEnabled,
        magnetLabel:        g.magnetLabel        || p.magnetLabel,
        magnetEmailSubject: g.magnetEmailSubject || p.magnetEmailSubject,
        magnetEmailBody:    g.magnetEmailBody    || p.magnetEmailBody,
        theme:              g.theme              || p.theme,
        accent:             g.accent             || p.accent,
      }))
      setAiReasoning(g.reasoning||'')
      setSaved(false)
      setAiPanel(false)
      toast_('✦ Nexa ولّدت نموذجك!')
    } catch { toast_('فشل التوليد — جرّب مرة أخرى', false) }
    setAiGenerating(false)
  }

  // ── تحميل البيانات ─────────────────────────────────────
  useEffect(()=>{ load() },[])

  async function load() {
    const {data:{user}} = await supabase.auth.getUser()
    if (!user) return
    const {data:m} = await supabase.from('workspace_members').select('workspace_id,workspaces(*)').eq('user_id',user.id).limit(1).single()
    const w = (m as any)?.workspaces; setWs(w)
    const {data:seqs} = await supabase.from('email_sequences').select('id,name').eq('workspace_id',(m as any)?.workspace_id).eq('status','active')
    setSequences(seqs||[])
    if (w) {
      let fields:FormField[] = DEFAULT_FIELDS
      try { if (w.lead_page_fields) fields=JSON.parse(w.lead_page_fields) } catch {}
      setCfg({
        slug:               w.slug||(w.name||'').toLowerCase().replace(/[^a-z0-9]/g,'-').replace(/-+/g,'-').slice(0,30)||'',
        headline:           w.lead_page_headline        || '',
        subline:            w.lead_page_subline         || '',
        cta:                w.lead_page_cta             || 'أرسل →',
        theme:              w.lead_page_theme           || 'dark',
        font:               w.lead_page_font            || 'tajawal',
        accent:             w.lead_page_accent          || '#00AAFF',
        logoUrl:            w.lead_page_logo_url        || '',
        showPoweredBy:      w.lead_page_show_powered_by ?? true,
        buttonStyle:        w.lead_page_button_style    || 'filled',
        layout:             w.lead_page_layout          || 'centered',
        formLang:           (w.lead_page_lang||'auto') as 'auto'|'en'|'ar',
        fields,
        magnetEnabled:      w.lead_magnet_enabled          || false,
        magnetUrl:          w.lead_magnet_url              || '',
        magnetLabel:        w.lead_magnet_label            || 'حمّل المورد المجاني',
        magnetEmailSubject: w.lead_magnet_email_subject    || 'إليك المورد الذي طلبته!',
        magnetEmailBody:    w.lead_magnet_email_body       || '',
        autoEnroll:         w.lead_page_auto_enroll        || false,
        sequenceId:         w.lead_page_sequence_id        || '',
      })
    }
    setLoading(false)
  }

  // ── رفع الشعار ─────────────────────────────────────────
  async function uploadLogo(file:File) {
    if (!ws||uploading) return; setUploading(true)
    try {
      const ext  = file.name.split('.').pop()
      const path = `${ws.id}/lead-logo-${Date.now()}.${ext}`
      const {error:e} = await supabase.storage.from('brand-assets').upload(path,file,{upsert:true})
      if (e) throw e
      const {data:u} = supabase.storage.from('brand-assets').getPublicUrl(path)
      upd('logoUrl',u.publicUrl)
      toast_('تم رفع الشعار!')
    } catch { toast_('فشل الرفع',false) }
    setUploading(false)
  }

  // ── حفظ ونشر ───────────────────────────────────────────
  async function save() {
    if (!ws||saving) return; setSaving(true)
    try {
      const res = await fetch('/api/lead-page/save',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          workspace_id:               ws.id,
          slug:                       cfg.slug.trim()||ws.slug,
          lead_page_headline:         cfg.headline||null,
          lead_page_subline:          cfg.subline||null,
          lead_page_cta:              cfg.cta||'أرسل →',
          lead_page_theme:            cfg.theme,
          lead_page_font:             cfg.font,
          lead_page_accent:           cfg.accent,
          lead_page_logo_url:         cfg.logoUrl||null,
          lead_page_show_powered_by:  canRemoveBranding?cfg.showPoweredBy:true,
          lead_page_button_style:     cfg.buttonStyle,
          lead_page_layout:           cfg.layout,
          lead_page_lang:             cfg.formLang==='auto'?null:cfg.formLang,
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
      if (!res.ok||d.error) {
        toast_(`فشل النشر: ${d.error||res.statusText}`, false)
      } else {
        toast_('✓ نُشر — التغييرات مباشرة على nexaa.cc/'+(cfg.slug||ws.slug))
        setSaved(true); setTimeout(()=>setSaved(false),3000)
      }
    } catch { toast_('فشل النشر — تحقق من الاتصال',false) }
    setSaving(false)
  }

  // ── إدارة الحقول ────────────────────────────────────────
  function addField(type:FieldType) {
    const id=`f-${Date.now()}`
    const defaults:Partial<Record<FieldType,Partial<FormField>>> = {
      text:        { label:'إجابة قصيرة',               placeholder:'إجابتك'                  },
      email:       { label:'البريد الإلكتروني',          placeholder:'name@example.com'         },
      phone:       { label:'رقم الهاتف',                 placeholder:'+966 5x xxx xxxx'         },
      textarea:    { label:'أخبرنا أكثر',               placeholder:'إجابتك…'                  },
      number:      { label:'رقم',                        placeholder:'٠'                        },
      url:         { label:'موقع إلكتروني',              placeholder:'https://'                 },
      select:      { label:'اختر واحداً',                options:['خيار ١','خيار ٢','خيار ٣']   },
      radio:       { label:'اختر واحداً',                options:['خيار ١','خيار ٢','خيار ٣']   },
      multiselect: { label:'اختر كل ما ينطبق',          options:['خيار ١','خيار ٢','خيار ٣']   },
      checkbox:    { label:'أوافق على الشروط والأحكام'                                          },
    }
    upd('fields',[...cfg.fields,{id,type,required:false,...defaults[type]} as FormField])
  }

  function updateField(idx:number,field:FormField){ const f=[...cfg.fields];f[idx]=field;upd('fields',f) }
  function deleteField(idx:number){ upd('fields',cfg.fields.filter((_,i)=>i!==idx)) }
  function moveField(idx:number,dir:1|-1){
    const f=[...cfg.fields]; const t=idx+dir
    if(t<0||t>=f.length) return
    ;[f[idx],f[t]]=[f[t],f[idx]]; upd('fields',f)
  }

  // ── شاشة التحميل ───────────────────────────────────────
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - var(--topbar-h))', flexDirection:'column', gap:14 }}>
      <div className="nexa-spinner" style={{ width:22, height:22 }}/>
      <div style={{ fontSize:11, color:'var(--text-3)', letterSpacing:'0.06em', textTransform:'uppercase' as const, fontFamily:F }}>جارٍ التحميل</div>
    </div>
  )

  const liveUrl = cfg.slug ? `https://nexaa.cc/${cfg.slug}` : null

  return (
    <div dir="rtl" style={{ display:'flex', flexDirection:'column', height:'calc(100vh - var(--topbar-h))', overflow:'hidden', fontFamily:F }}>

      {/* ── الشريط العلوي ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', height:52, borderBottom:'1px solid var(--border)', flexShrink:0, background:'var(--surface)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {/* تبديل العرض */}
          <div style={{ display:'flex', background:'var(--elevated)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:3, gap:2 }}>
            {([['editor','المحرر'],['submissions','الاستجابات']] as const).map(([v,l])=>(
              <button key={v} onClick={()=>setView(v)}
                style={{ padding:'5px 14px', borderRadius:7, border:'none', background:view===v?'var(--surface)':'transparent', color:view===v?'var(--text-1)':'var(--text-3)', fontSize:12, fontWeight:view===v?600:400, cursor:'pointer', fontFamily:F, transition:'all 0.15s' }}>
                {l}
              </button>
            ))}
          </div>
          {liveUrl&&(
            <a href={liveUrl} target="_blank" rel="noreferrer"
              style={{ fontSize:11, color:'var(--cyan)', fontFamily:MONO, textDecoration:'none', opacity:0.8, direction:'ltr' }}>
              {liveUrl.replace('https://','')}
            </a>
          )}
        </div>

        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {liveUrl&&(
            <button onClick={()=>{navigator.clipboard.writeText(liveUrl);toast_('تم نسخ الرابط!')}}
              className="btn-secondary" style={{ fontSize:12, padding:'6px 12px', display:'flex', alignItems:'center', gap:6, fontFamily:F }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              انسخ الرابط
            </button>
          )}

          {/* زر توليد Nexa */}
          <button onClick={()=>setAiPanel(p=>!p)}
            style={{ padding:'7px 14px', fontSize:12, fontWeight:600, borderRadius:'var(--r)', border:'1px solid var(--cyan-border)', background:aiPanel?'var(--cyan-dim)':'transparent', color:'var(--cyan)', cursor:'pointer', fontFamily:F, display:'flex', alignItems:'center', gap:6, transition:'all 0.15s' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9.5 2a2.5 2.5 0 0 1 5 0"/><path d="M9.5 22a2.5 2.5 0 0 0 5 0"/><path d="M14.5 2C17 2 19 4 19 6.5c0 2-1.5 3.5-3.5 4C17 11 19 12.5 19 15c0 2.5-2 4.5-4.5 4.5"/><path d="M9.5 2C7 2 5 4 5 6.5c0 2 1.5 3.5 3.5 4C7 11 5 12.5 5 15c0 2.5 2 4.5 4.5 4.5"/></svg>
            توليد مع Nexa
          </button>

          {/* نشر */}
          <button onClick={save} disabled={saving}
            style={{ padding:'7px 18px', fontSize:13, fontWeight:600, borderRadius:'var(--r)', border:'none', cursor:saving?'not-allowed':'pointer', fontFamily:F, transition:'all 0.2s',
              background:saved?'var(--success-dim)':saving?'var(--elevated)':'var(--text-1)',
              color:saved?'var(--success)':saving?'var(--text-3)':'var(--bg)' }}>
            {saving?'يحفظ…':saved?'✓ نُشر':'انشر'}
          </button>
        </div>
      </div>

      {/* ── لوحة الذكاء الاصطناعي ── */}
      {aiPanel&&(
        <div style={{ padding:'14px 20px', background:'var(--cyan-dim)', borderBottom:'1px solid var(--cyan-border)', flexShrink:0, animation:'pageUp 0.2s ease both' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="1.5" strokeLinecap="round"><path d="M9.5 2a2.5 2.5 0 0 1 5 0"/><path d="M9.5 22a2.5 2.5 0 0 0 5 0"/><path d="M14.5 2C17 2 19 4 19 6.5c0 2-1.5 3.5-3.5 4C17 11 19 12.5 19 15c0 2.5-2 4.5-4.5 4.5"/><path d="M9.5 2C7 2 5 4 5 6.5c0 2 1.5 3.5 3.5 4C7 11 5 12.5 5 15c0 2.5 2 4.5 4.5 4.5"/></svg>
              <span style={{ fontSize:12, fontWeight:600, color:'var(--cyan)', whiteSpace:'nowrap' as const }}>هذا النموذج لماذا؟</span>
            </div>
            <input
              value={aiGoal}
              onChange={e=>setAiGoal(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&generateWithAI()}
              placeholder={'مثلاً: "أجمع عملاء لـ PDF مجاني"، "أحجز مكالمات استراتيجية"، "قائمة انتظار النشرة"'}
              style={{ flex:1, padding:'8px 12px', background:'rgba(0,170,255,0.10)', border:'1px solid var(--cyan-border)', borderRadius:'var(--r)', color:'var(--text-1)', fontSize:12, fontFamily:F, outline:'none', boxSizing:'border-box' as const, textAlign:'right' as const }}
            />
            <button onClick={generateWithAI} disabled={aiGenerating} className="btn-primary"
              style={{ fontSize:12, padding:'8px 16px', flexShrink:0, display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' as const, fontFamily:F }}>
              {aiGenerating
                ?<><div className="nexa-spinner" style={{ width:12,height:12,borderTopColor:'#000' }}/>جارٍ التوليد…</>
                :<>✦ ولّد</>}
            </button>
          </div>
          {aiReasoning&&(
            <div style={{ marginTop:8, fontSize:11, color:'var(--cyan)', opacity:0.75, fontStyle:'italic', paddingRight:2, fontFamily:F }}>✦ {aiReasoning}</div>
          )}
        </div>
      )}

      {/* ── المحتوى ── */}
      {view==='submissions'?(
        <div style={{ flex:1, overflowY:'auto', padding:'32px 36px' }}>
          {ws&&<Submissions wsId={ws.id} sequences={sequences} toast_={toast_}/>}
        </div>
      ):(
        <div style={{ display:'grid', gridTemplateColumns:'360px 1fr', flex:1, overflow:'hidden' }}>

          {/* اللوح الأيمن — الإعدادات */}
          <div style={{ borderLeft:'1px solid var(--border)', display:'flex', flexDirection:'column', overflow:'hidden' }}>

            {/* تبويبات القسم */}
            <div style={{ display:'flex', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
              {([['content','المحتوى'],['fields','الحقول'],['design','التصميم'],['settings','الإعدادات']] as const).map(([s,l])=>(
                <button key={s} onClick={()=>setSection(s)}
                  style={{ flex:1, padding:'10px 4px', background:'none', border:'none', borderBottom:`2px solid ${section===s?'var(--cyan)':'transparent'}`, color:section===s?'var(--text-1)':'var(--text-3)', cursor:'pointer', fontSize:11, fontWeight:section===s?600:400, fontFamily:F, transition:'all 0.15s', marginBottom:-1 }}>
                  {l}
                </button>
              ))}
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'18px' }}>

              {/* ── المحتوى ── */}
              {section==='content'&&(
                <>
                  <Section title="رابط الصفحة">
                    <div style={{ display:'flex', alignItems:'center', background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden' }}>
                      <input value={cfg.slug} onChange={e=>upd('slug',e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,30))}
                        placeholder="yourname"
                        style={{ flex:1, padding:'9px 10px', fontSize:12, background:'transparent', border:'none', color:'var(--text-1)', outline:'none', fontFamily:MONO, direction:'ltr', textAlign:'left' as const }}/>
                      <div style={{ padding:'9px 10px', fontSize:12, color:'var(--text-3)', fontFamily:MONO, borderRight:'1px solid var(--border-subtle)', whiteSpace:'nowrap' as const, flexShrink:0 }}>
                        /nexaa.cc
                      </div>
                    </div>
                  </Section>

                  <Section title="الشعار">
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
                      <div style={{ width:52, height:52, borderRadius:12, background:'var(--elevated)', border:'1px solid var(--border)', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {cfg.logoUrl
                          ?<img src={cfg.logoUrl} alt="logo" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                          :<div style={{ fontSize:18, fontWeight:700, color:'var(--text-4)' }}>{brandName[0]?.toUpperCase()}</div>}
                      </div>
                      <div style={{ flex:1 }}>
                        <button onClick={()=>logoRef.current?.click()} disabled={uploading} className="btn-secondary"
                          style={{ width:'100%', fontSize:12, display:'flex', alignItems:'center', gap:6, justifyContent:'center', fontFamily:F }}>
                          {uploading
                            ?<><div className="nexa-spinner" style={{ width:11,height:11 }}/>يرفع…</>
                            :<><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>ارفع شعاراً</>}
                        </button>
                        <input ref={logoRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>e.target.files?.[0]&&uploadLogo(e.target.files[0])}/>
                        {cfg.logoUrl&&<button onClick={()=>upd('logoUrl','')} style={{ marginTop:5, background:'none', border:'none', fontSize:11, color:'var(--error)', cursor:'pointer', padding:0, width:'100%', textAlign:'center' as const, fontFamily:F }}>إزالة</button>}
                      </div>
                    </div>
                    <div style={{ fontSize:11, color:'var(--text-3)', fontFamily:F }}>PNG أو JPG · مربع · الحجم الأقصى ٢ ميغا</div>
                  </Section>

                  <Section title="النصوص">
                    <Lbl>العنوان الرئيسي</Lbl>
                    <input value={cfg.headline} onChange={e=>upd('headline',e.target.value)}
                      placeholder={`تواصل مع ${brandName}`} className="nexa-input" style={{ marginBottom:10, fontSize:12 }}/>
                    <Lbl>النص الفرعي</Lbl>
                    <input value={cfg.subline} onChange={e=>upd('subline',e.target.value)}
                      placeholder="اترك بياناتك وسنتواصل معك في أقرب وقت." className="nexa-input" style={{ marginBottom:10, fontSize:12 }}/>
                    <Lbl>نص زر الإرسال</Lbl>
                    <input value={cfg.cta} onChange={e=>upd('cta',e.target.value)}
                      placeholder="أرسل →" className="nexa-input" style={{ fontSize:12 }}/>
                  </Section>

                  <Section title="المورد المجاني (Lead Magnet)">
                    <Toggle label="تفعيل المورد المجاني" desc="أرسل مورداً عند إرسال النموذج" value={cfg.magnetEnabled} onChange={v=>upd('magnetEnabled',v)}/>
                    {cfg.magnetEnabled&&(
                      <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:10 }}>
                        <div>
                          <Lbl>نص الزر</Lbl>
                          <input value={cfg.magnetLabel} onChange={e=>upd('magnetLabel',e.target.value)}
                            className="nexa-input" style={{ fontSize:12 }} placeholder="حمّل المورد المجاني"/>
                        </div>
                        <div>
                          <Lbl hint="(رابط تحميل مباشر أو Google Drive)">رابط المورد</Lbl>
                          <input value={cfg.magnetUrl} onChange={e=>upd('magnetUrl',e.target.value)}
                            className="nexa-input" style={{ fontSize:12 }} placeholder="https://…"/>
                        </div>
                        <div>
                          <Lbl>موضوع البريد المُرسَل</Lbl>
                          <input value={cfg.magnetEmailSubject} onChange={e=>upd('magnetEmailSubject',e.target.value)}
                            className="nexa-input" style={{ fontSize:12 }} placeholder="إليك المورد الذي طلبته!"/>
                        </div>
                        <div>
                          <Lbl hint="استخدم {{name}} و {{url}}">نص البريد</Lbl>
                          <textarea value={cfg.magnetEmailBody} onChange={e=>upd('magnetEmailBody',e.target.value)}
                            className="nexa-input" style={{ fontSize:12, resize:'vertical' as const, minHeight:100, lineHeight:1.6 }}
                            placeholder={'مرحباً {{name}}،\n\nإليك الرابط:\n{{url}}'}/>
                        </div>
                        <div style={{ fontSize:11, color:'var(--text-3)', padding:'8px 10px', background:'var(--cyan-dim)', border:'1px solid var(--cyan-border)', borderRadius:'var(--r-sm)', fontFamily:F }}>
                          يُرسَل الرابط بالبريد بعد الإرسال — يجب على الزوار ملء الحقول المطلوبة أولاً.
                        </div>
                      </div>
                    )}
                  </Section>
                </>
              )}

              {/* ── الحقول ── */}
              {section==='fields'&&(
                <>
                  <Section title="حقول النموذج">
                    {cfg.fields.map((field,i)=>(
                      <FieldRow key={field.id} field={field} index={i} total={cfg.fields.length}
                        onChange={f=>updateField(i,f)} onDelete={()=>deleteField(i)} onMove={d=>moveField(i,d)}/>
                    ))}
                  </Section>
                  <Section title="أضف حقلاً">
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                      {FIELD_TYPES.map(ft=>(
                        <button key={ft.id} onClick={()=>addField(ft.id)}
                          style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)', borderRadius:'var(--r)', cursor:'pointer', fontSize:12, color:'var(--text-2)', transition:'all 0.15s', fontFamily:F }}
                          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--border-strong)';(e.currentTarget as HTMLElement).style.color='var(--text-1)'}}
                          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--border)';(e.currentTarget as HTMLElement).style.color='var(--text-2)'}}>
                          <span style={{ width:20, height:20, borderRadius:5, background:'var(--elevated)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'var(--text-3)', flexShrink:0 }}>{ft.icon}</span>
                          {ft.label}
                        </button>
                      ))}
                    </div>
                  </Section>
                </>
              )}

              {/* ── التصميم ── */}
              {section==='design'&&(
                <>
                  <Section title="السمة">
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                      {Object.entries(THEMES).map(([id,t])=>(
                        <button key={id} onClick={()=>upd('theme',id)}
                          style={{ padding:'10px 8px', borderRadius:'var(--r)', background:t.bg, border:`2px solid ${cfg.theme===id?cfg.accent:'transparent'}`, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:5, transition:'border-color 0.15s' }}>
                          <div style={{ width:'100%', height:18, borderRadius:4, background:t.surface, border:`1px solid ${t.border}` }}/>
                          <div style={{ fontSize:10, fontWeight:600, color:cfg.theme===id?cfg.accent:t.text2, fontFamily:F }}>{t.label}</div>
                        </button>
                      ))}
                    </div>
                  </Section>

                  <Section title="لون التمييز">
                    <div style={{ display:'flex', gap:7, marginBottom:10, flexWrap:'wrap' as const }}>
                      {ACCENTS.map(c=>(
                        <button key={c} onClick={()=>upd('accent',c)}
                          style={{ width:26, height:26, borderRadius:'50%', background:c, border:`3px solid ${cfg.accent===c?'var(--text-1)':'transparent'}`, cursor:'pointer', transition:'all 0.15s', outline:cfg.accent===c?'1px solid var(--border)':'none' }}/>
                      ))}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <input type="color" value={cfg.accent} onChange={e=>upd('accent',e.target.value)}
                        style={{ width:36, height:34, padding:3, background:'var(--elevated)', border:'1px solid var(--border)', borderRadius:'var(--r)', cursor:'pointer' }}/>
                      <input value={cfg.accent} onChange={e=>upd('accent',e.target.value)}
                        placeholder="#00AAFF" className="nexa-input" style={{ flex:1, fontSize:12 }}/>
                      <div style={{ width:34, height:34, borderRadius:'var(--r)', background:cfg.accent, border:'1px solid var(--border)', flexShrink:0 }}/>
                    </div>
                  </Section>

                  <Section title="الخط">
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {Object.entries(FONTS).map(([id,f])=>(
                        <button key={id} onClick={()=>upd('font',id)}
                          style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', borderRadius:'var(--r)', background:cfg.font===id?'var(--cyan-dim)':'rgba(255,255,255,0.03)', border:`1px solid ${cfg.font===id?'var(--cyan-border)':'var(--border)'}`, cursor:'pointer', transition:'all 0.15s' }}>
                          <span style={{ fontSize:12, fontWeight:600, color:cfg.font===id?'var(--cyan)':'var(--text-2)', fontFamily:F }}>{f.label}</span>
                          <span style={{ fontSize:12, color:'var(--text-3)', fontFamily:f.family }}>{f.sample}</span>
                        </button>
                      ))}
                    </div>
                  </Section>

                  <Section title="التخطيط">
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
                      {[{id:'centered',label:'في المنتصف'},{id:'left',label:'محاذاة لليمين'}].map(l=>(
                        <button key={l.id} onClick={()=>upd('layout',l.id as any)}
                          style={{ padding:'9px', borderRadius:'var(--r)', background:cfg.layout===l.id?'var(--cyan-dim)':'rgba(255,255,255,0.03)', border:`1px solid ${cfg.layout===l.id?'var(--cyan-border)':'var(--border)'}`, cursor:'pointer', fontSize:12, fontWeight:cfg.layout===l.id?600:400, color:cfg.layout===l.id?'var(--cyan)':'var(--text-2)', transition:'all 0.15s', fontFamily:F }}>
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </Section>

                  <Section title="لغة النموذج">
                    <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:8, fontFamily:F }}>تحديد اللغة التي يراها الزوار في الصفحة العامة</div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14 }}>
                      {[{id:'auto',label:'تلقائي'},{id:'ar',label:'عربي'},{id:'en',label:'English'}].map(l=>(
                        <button key={l.id} onClick={()=>upd('formLang',l.id as any)}
                          style={{ padding:'9px', borderRadius:'var(--r)', background:cfg.formLang===l.id?'var(--cyan-dim)':'rgba(255,255,255,0.03)', border:`1px solid ${cfg.formLang===l.id?'var(--cyan-border)':'var(--border)'}`, cursor:'pointer', fontSize:12, fontWeight:cfg.formLang===l.id?600:400, color:cfg.formLang===l.id?'var(--cyan)':'var(--text-2)', transition:'all 0.15s', fontFamily:F }}>
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </Section>

                  <Section title="شكل الزر">
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14 }}>
                      {[{id:'filled',label:'ممتلئ'},{id:'outline',label:'إطار'},{id:'soft',label:'ناعم'}].map(b=>(
                        <button key={b.id} onClick={()=>upd('buttonStyle',b.id as any)}
                          style={{ padding:'9px', borderRadius:'var(--r)', background:cfg.buttonStyle===b.id?'var(--cyan-dim)':'rgba(255,255,255,0.03)', border:`1px solid ${cfg.buttonStyle===b.id?'var(--cyan-border)':'var(--border)'}`, cursor:'pointer', fontSize:12, fontWeight:cfg.buttonStyle===b.id?600:400, color:cfg.buttonStyle===b.id?'var(--cyan)':'var(--text-2)', transition:'all 0.15s', fontFamily:F }}>
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </Section>

                  <Section title="الهوية">
                    {canRemoveBranding?(
                      <Toggle label="'بدعم من Nexa'" desc="أوقفه لتظهر الصفحة بهويتك الكاملة" value={cfg.showPoweredBy} onChange={v=>upd('showPoweredBy',v)}/>
                    ):(
                      <div className="card" style={{ padding:'12px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:500, color:'var(--text-2)', fontFamily:F }}>إزالة شعار Nexa</div>
                          <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2, fontFamily:F }}>متاح في خطتَي Scale و Agency</div>
                        </div>
                        <a href="/dashboard/settings?tab=billing" className="btn-accent" style={{ fontSize:11, padding:'5px 10px', textDecoration:'none', whiteSpace:'nowrap' as const, fontFamily:F }}>ترقية</a>
                      </div>
                    )}
                  </Section>
                </>
              )}

              {/* ── الإعدادات ── */}
              {section==='settings'&&(
                <>
                  <Section title="سلوك العملاء المحتملين">
                    <Toggle label="تسجيل تلقائي في تسلسل بريدي" desc="أضف عملاء جدد لتسلسل بريدي تلقائياً" value={cfg.autoEnroll} onChange={v=>upd('autoEnroll',v)}/>
                    {cfg.autoEnroll&&(
                      <div style={{ marginTop:10 }}>
                        <Lbl>التسلسل البريدي</Lbl>
                        <select value={cfg.sequenceId} onChange={e=>upd('sequenceId',e.target.value)} className="nexa-input" style={{ cursor:'pointer', fontSize:12, fontFamily:F }}>
                          <option value="">اختر تسلسلاً…</option>
                          {sequences.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        {sequences.length===0&&(
                          <div style={{ fontSize:11, color:'var(--text-3)', marginTop:6, fontFamily:F }}>
                            لا توجد تسلسلات نشطة.{' '}
                            <a href="/dashboard/automate" style={{ color:'var(--cyan)' }}>أنشئ واحداً →</a>
                          </div>
                        )}
                      </div>
                    )}
                  </Section>

                  <Section title="الاتصالات">
                    <div className="card" style={{ padding:'14px', marginBottom:8 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--text-1)', marginBottom:2, fontFamily:F }}>Webhook — Typeform</div>
                      <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:8, fontFamily:F }}>
                        الصق هذا الرابط في Typeform ← Connect ← Webhooks
                      </div>
                      {ws?.id&&(
                        <div style={{ fontSize:10, color:'var(--text-3)', fontFamily:MONO, wordBreak:'break-all' as const, padding:'6px 9px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-sm)', direction:'ltr', textAlign:'left' as const }}>
                          nexaa.cc/api/integrations/typeform/webhook?workspace_id={ws.id}
                        </div>
                      )}
                    </div>
                  </Section>
                </>
              )}

            </div>
          </div>

          {/* اللوح الأيسر — المعاينة المباشرة */}
          <div style={{ background:'#0a0a0a', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'28px 24px', position:'relative', overflow:'hidden', gap:16 }}>

            {/* علامة المعاينة */}
            <div style={{ position:'absolute', top:16, left:'50%', transform:'translateX(-50%)', fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:999, padding:'4px 12px', whiteSpace:'nowrap' as const, fontFamily:F }}>
              معاينة مباشرة
            </div>

            {/* غلاف الهاتف */}
            <div style={{ width:280, flexShrink:0, borderRadius:44, background:'linear-gradient(145deg,#2a2a2a,#1a1a1a)', padding:10, boxShadow:'0 40px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.1)', position:'relative' }}>
              <div style={{ position:'absolute', left:-3, top:80,  width:3, height:28, background:'#333', borderRadius:'2px 0 0 2px' }}/>
              <div style={{ position:'absolute', left:-3, top:118, width:3, height:48, background:'#333', borderRadius:'2px 0 0 2px' }}/>
              <div style={{ position:'absolute', left:-3, top:176, width:3, height:48, background:'#333', borderRadius:'2px 0 0 2px' }}/>
              <div style={{ position:'absolute', right:-3, top:110, width:3, height:72, background:'#333', borderRadius:'0 2px 2px 0' }}/>

              <div style={{ borderRadius:36, overflow:'hidden', background:'#000', position:'relative' }}>
                <div style={{ position:'absolute', top:10, left:'50%', transform:'translateX(-50%)', width:90, height:28, background:'#000', borderRadius:14, zIndex:20, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:'#111', border:'1px solid #222' }}/>
                  <div style={{ width:18, height:10, borderRadius:5, background:'#111', border:'1px solid #222' }}/>
                </div>
                <div style={{ height:540, overflow:'hidden', position:'relative' }}>
                  <div style={{ paddingTop:48, height:'100%' }}>
                    <LivePreview cfg={cfg} brandName={brandName}/>
                  </div>
                </div>
                <div style={{ background:THEMES[cfg.theme]?.bg||'#0C0C0C', padding:'8px 0 12px', display:'flex', justifyContent:'center' }}>
                  <div style={{ width:100, height:4, borderRadius:2, background:'rgba(255,255,255,0.2)' }}/>
                </div>
              </div>
            </div>

            {/* شريحة المعلومات */}
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 14px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:999 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:THEMES[cfg.theme]?.bg||'#0C0C0C', border:'1px solid rgba(255,255,255,0.15)' }}/>
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontFamily:F }}>
                {THEMES[cfg.theme]?.label||'داكن'} · {FONTS[cfg.font]?.label||'تجوّل'}
              </span>
              <div style={{ width:8, height:8, borderRadius:'50%', background:cfg.accent||'#00AAFF', boxShadow:`0 0 6px ${cfg.accent||'#00AAFF'}60` }}/>
            </div>
          </div>
        </div>
      )}

      {/* إشعار Toast */}
      {toast&&(
        <div style={{ position:'fixed', bottom:24, left:24, zIndex:9999, padding:'11px 18px', borderRadius:'var(--r)', background:toast.ok?'var(--success-dim)':'var(--error-dim)', border:`1px solid ${toast.ok?'var(--success-border)':'var(--error-border)'}`, color:toast.ok?'var(--success)':'var(--error)', fontSize:13, fontWeight:600, backdropFilter:'blur(16px)', boxShadow:'0 8px 32px rgba(0,0,0,0.45)', animation:'pageUp 0.2s ease both', fontFamily:F }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
