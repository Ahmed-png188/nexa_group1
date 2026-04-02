'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LANDING_TEMPLATES, SECTION_LABELS, SECTION_ICONS,
  type LandingPageConfig, type LandingSection, type SectionType,
} from '@/lib/landing-templates'
import LandingPageRenderer from '@/app/p/[slug]/LandingPageRenderer'

const THEMES_AR = [
  { id:'dark',     label:'داكن',    dot:'#0C0C0C' },
  { id:'light',    label:'فاتح',    dot:'#F5F5F5' },
  { id:'warm',     label:'دافئ',    dot:'#FDF8F0' },
  { id:'midnight', label:'منتصف الليل', dot:'#070B14' },
]
const FONTS_AR = [
  { id:'geist', label:'Geist',    sample:'نظيف وعصري'  },
  { id:'serif', label:'Serif',    sample:'كلاسيكي'     },
  { id:'dm',    label:'DM Sans',  sample:'ودود ومستدير' },
  { id:'inter', label:'Inter',    sample:'دقيق ومحايد' },
]
const ACCENTS = ['#00AAFF','#7C3AED','#059669','#DC2626','#D97706','#DB2777','#0891B2','#FFFFFF']
const ADDABLE_SECTIONS: SectionType[] = ['hero','products','about','features','testimonials','gallery','cta_banner','lead_form','footer']
const SECTION_LABELS_AR: Record<SectionType, string> = {
  hero:'قسم البطل', products:'المنتجات', about:'من نحن', features:'المميزات',
  testimonials:'الشهادات', gallery:'المعرض', cta_banner:'دعوة للعمل', lead_form:'نموذج العملاء', footer:'التذييل',
}

function newSection(type: SectionType): LandingSection {
  const defaults: Record<SectionType, Record<string,any>> = {
    hero:         { headline:'عنوانك الرئيسي', subheadline:'عنوان داعم هنا.', cta_label:'ابدأ الآن', cta_url:'#' },
    products:     { headline:'منتجاتنا', items: [{ id:'p1', name:'المنتج', price:'49 ر.س', description:'الوصف', image:'' }] },
    about:        { headline:'من نحن', text:'احكِ قصة علامتك التجارية هنا.', image:'' },
    features:     { headline:'لماذا تختارنا', features: [{ icon:'⚡', title:'الميزة', desc:'الوصف' }] },
    testimonials: { headline:'ماذا يقولون', testimonials: [{ name:'اسم العميل', role:'المنصب', text:'تجربة رائعة!' }] },
    gallery:      { headline:'معرضنا', images: [] },
    cta_banner:   { headline:'مستعد للبدء؟', subline:'انضم إلى آلاف العملاء السعداء.', cta_label:'ابدأ الآن', cta_url:'#' },
    lead_form:    { headline:'تواصل معنا', subline:'سنرد خلال 24 ساعة.', cta:'أرسل ←',
      fields: [
        { id:'f-name',  type:'text',  label:'اسمك',     placeholder:'الاسم',           required:false },
        { id:'f-email', type:'email', label:'البريد الإلكتروني', placeholder:'you@example.com', required:true },
      ]},
    footer:       { copyright:`© ${new Date().getFullYear()} العلامة التجارية. جميع الحقوق محفوظة.` },
  }
  return { id: `${type}-${Date.now()}`, type, content: defaults[type] || {} }
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', marginBottom:6 }}>{children}</div>
}
function NexaInput({ value, onChange, placeholder, multiline }: {
  value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean
}) {
  if (multiline) return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="nexa-input" style={{ fontSize:12, resize:'vertical' as const, minHeight:72, lineHeight:1.6, direction:'rtl', textAlign:'right' }} />
  )
  return <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    className="nexa-input" style={{ fontSize:12, direction:'rtl', textAlign:'right' }} />
}

function SectionEditor({ section, onChange, onDelete, onMove, index, total }: {
  section: LandingSection; onChange: (s: LandingSection) => void; onDelete: () => void
  onMove: (dir: 1|-1) => void; index: number; total: number
}) {
  const [open, setOpen] = useState(false)
  const c = section.content
  function setContent(key: string, val: any) { onChange({ ...section, content: { ...c, [key]: val } }) }

  function renderEditor() {
    if (section.type === 'hero') return (
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <div><Label>العنوان الرئيسي</Label><NexaInput value={c.headline||''} onChange={v=>setContent('headline',v)} placeholder="العنوان الرئيسي" /></div>
        <div><Label>العنوان الفرعي</Label><NexaInput value={c.subheadline||''} onChange={v=>setContent('subheadline',v)} placeholder="سطر داعم" multiline /></div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <div><Label>نص الزر</Label><NexaInput value={c.cta_label||''} onChange={v=>setContent('cta_label',v)} placeholder="ابدأ الآن" /></div>
          <div><Label>رابط الزر</Label><NexaInput value={c.cta_url||''} onChange={v=>setContent('cta_url',v)} placeholder="#products" /></div>
        </div>
      </div>
    )
    if (section.type === 'products') {
      const items: any[] = c.items || []
      return (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div><Label>عنوان القسم</Label><NexaInput value={c.headline||''} onChange={v=>setContent('headline',v)} placeholder="منتجاتنا" /></div>
          <Label>العناصر</Label>
          {items.map((item: any, i: number) => (
            <div key={item.id||i} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px', display:'flex', flexDirection:'column', gap:7 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 80px', gap:6 }}>
                <NexaInput value={item.name||''} onChange={v=>{ const a=[...items]; a[i]={...a[i],name:v}; setContent('items',a) }} placeholder="اسم المنتج" />
                <NexaInput value={item.price||''} onChange={v=>{ const a=[...items]; a[i]={...a[i],price:v}; setContent('items',a) }} placeholder="السعر" />
              </div>
              <NexaInput value={item.description||''} onChange={v=>{ const a=[...items]; a[i]={...a[i],description:v}; setContent('items',a) }} placeholder="الوصف" />
              <button onClick={()=>{ const a=items.filter((_,idx)=>idx!==i); setContent('items',a) }}
                style={{ alignSelf:'flex-end', background:'none', border:'none', color:'var(--error)', fontSize:11, cursor:'pointer', padding:0 }}>
                حذف
              </button>
            </div>
          ))}
          <button onClick={()=>setContent('items',[...items,{id:`p${Date.now()}`,name:'منتج جديد',price:'',description:'',image:''}])}
            style={{ background:'var(--elevated)', border:'1px dashed var(--border)', borderRadius:8, padding:'7px', fontSize:12, color:'var(--text-3)', cursor:'pointer' }}>
            + إضافة منتج
          </button>
        </div>
      )
    }
    if (section.type === 'about') return (
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <div><Label>العنوان</Label><NexaInput value={c.headline||''} onChange={v=>setContent('headline',v)} placeholder="من نحن" /></div>
        <div><Label>النص</Label><NexaInput value={c.text||''} onChange={v=>setContent('text',v)} placeholder="قصة علامتك التجارية..." multiline /></div>
        <div><Label>رابط الصورة (اختياري)</Label><NexaInput value={c.image||''} onChange={v=>setContent('image',v)} placeholder="https://..." /></div>
      </div>
    )
    if (section.type === 'features') {
      const features: any[] = c.features || []
      return (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div><Label>عنوان القسم</Label><NexaInput value={c.headline||''} onChange={v=>setContent('headline',v)} placeholder="المميزات" /></div>
          {features.map((f: any, i: number) => (
            <div key={i} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px', display:'flex', flexDirection:'column', gap:7 }}>
              <div style={{ display:'grid', gridTemplateColumns:'48px 1fr', gap:6 }}>
                <NexaInput value={f.icon||''} onChange={v=>{ const a=[...features]; a[i]={...a[i],icon:v}; setContent('features',a) }} placeholder="⚡" />
                <NexaInput value={f.title||''} onChange={v=>{ const a=[...features]; a[i]={...a[i],title:v}; setContent('features',a) }} placeholder="عنوان الميزة" />
              </div>
              <NexaInput value={f.desc||''} onChange={v=>{ const a=[...features]; a[i]={...a[i],desc:v}; setContent('features',a) }} placeholder="وصف قصير" />
              <button onClick={()=>{ const a=features.filter((_,idx)=>idx!==i); setContent('features',a) }}
                style={{ alignSelf:'flex-end', background:'none', border:'none', color:'var(--error)', fontSize:11, cursor:'pointer', padding:0 }}>حذف</button>
            </div>
          ))}
          <button onClick={()=>setContent('features',[...features,{icon:'✦',title:'ميزة',desc:'الوصف'}])}
            style={{ background:'var(--elevated)', border:'1px dashed var(--border)', borderRadius:8, padding:'7px', fontSize:12, color:'var(--text-3)', cursor:'pointer' }}>
            + إضافة ميزة
          </button>
        </div>
      )
    }
    if (section.type === 'cta_banner') return (
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <div><Label>العنوان</Label><NexaInput value={c.headline||''} onChange={v=>setContent('headline',v)} placeholder="مستعد للبدء؟" /></div>
        <div><Label>السطر الداعم</Label><NexaInput value={c.subline||''} onChange={v=>setContent('subline',v)} placeholder="نص داعم" /></div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <div><Label>نص الزر</Label><NexaInput value={c.cta_label||''} onChange={v=>setContent('cta_label',v)} placeholder="ابدأ الآن" /></div>
          <div><Label>رابط الزر</Label><NexaInput value={c.cta_url||''} onChange={v=>setContent('cta_url',v)} placeholder="#" /></div>
        </div>
      </div>
    )
    if (section.type === 'lead_form') return (
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <div><Label>العنوان</Label><NexaInput value={c.headline||''} onChange={v=>setContent('headline',v)} placeholder="تواصل معنا" /></div>
        <div><Label>السطر الداعم</Label><NexaInput value={c.subline||''} onChange={v=>setContent('subline',v)} placeholder="سنرد خلال 24 ساعة" /></div>
        <div><Label>نص الزر</Label><NexaInput value={c.cta||''} onChange={v=>setContent('cta',v)} placeholder="أرسل ←" /></div>
      </div>
    )
    if (section.type === 'footer') return (
      <div><Label>نص حقوق النشر</Label><NexaInput value={c.copyright||''} onChange={v=>setContent('copyright',v)} placeholder="© 2025 جميع الحقوق محفوظة." /></div>
    )
    if (section.type === 'gallery') return (
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <div><Label>العنوان</Label><NexaInput value={c.headline||''} onChange={v=>setContent('headline',v)} placeholder="معرضنا" /></div>
        <div>
          <Label>روابط الصور (كل رابط في سطر)</Label>
          <textarea value={(c.images||[]).join('\n')} onChange={e => setContent('images', e.target.value.split('\n').filter(Boolean))}
            className="nexa-input" style={{ fontSize:11, resize:'vertical', minHeight:80, lineHeight:1.5, direction:'ltr' }}
            placeholder={'https://image1.jpg\nhttps://image2.jpg'} />
        </div>
      </div>
    )
    return null
  }

  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', marginBottom:8, overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', cursor:'pointer' }} onClick={()=>setOpen(o=>!o)}>
        <span style={{ fontSize:14 }}>{SECTION_ICONS[section.type]}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:500, color:'var(--text-1)' }}>{SECTION_LABELS_AR[section.type]}</div>
          {c.headline && <div style={{ fontSize:10, color:'var(--text-3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.headline}</div>}
        </div>
        <div style={{ display:'flex', gap:4, alignItems:'center' }}>
          <button onClick={e=>{e.stopPropagation();onMove(-1)}} disabled={index===0} style={{background:'none',border:'none',cursor:index===0?'not-allowed':'pointer',color:'var(--text-3)',padding:'2px 4px',opacity:index===0?0.3:1,fontSize:12}}>↑</button>
          <button onClick={e=>{e.stopPropagation();onMove(1)}} disabled={index===total-1} style={{background:'none',border:'none',cursor:index===total-1?'not-allowed':'pointer',color:'var(--text-3)',padding:'2px 4px',opacity:index===total-1?0.3:1,fontSize:12}}>↓</button>
          <button onClick={e=>{e.stopPropagation();onDelete()}} style={{background:'none',border:'none',cursor:'pointer',color:'var(--error)',padding:'2px 6px',fontSize:12}}>✕</button>
          <span style={{color:'var(--text-4)',fontSize:11}}>{open?'▲':'▼'}</span>
        </div>
      </div>
      {open && (
        <div style={{ padding:'0 12px 14px', borderTop:'1px solid var(--border-subtle)', paddingTop:12 }}>
          {renderEditor()}
        </div>
      )}
    </div>
  )
}

export default function LandingPageBuilderAr() {
  const supabase = createClient()
  const [wsId, setWsId]           = useState('')
  const [brandName, setBrandName] = useState('')
  const [pages, setPages]         = useState<any[]>([])
  const [pageId, setPageId]       = useState<string|null>(null)
  const [tab, setTab]             = useState<'builder'|'pages'>('builder')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState('')
  const [showAddSection, setShowAddSection] = useState(false)

  const [config, setConfig] = useState<LandingPageConfig>({
    title:'صفحتي', template_id:'hero-product', theme:'dark', font:'geist', accent:'#00AAFF',
    rtl:true, logo_url:'', whatsapp:'', sections: LANDING_TEMPLATES[0].sections, seo_title:'', seo_description:'',
  })

  function showToast(msg: string) { setToast(msg); setTimeout(()=>setToast(''),3000) }

  useEffect(()=>{
    supabase.auth.getUser().then(async({ data:{ user } })=>{
      if(!user) return
      const { data: member } = await supabase.from('workspace_members').select('workspace_id').eq('user_id',user.id).limit(1).single()
      if(!member) return
      setWsId(member.workspace_id)
      const { data: ws } = await supabase.from('workspaces').select('brand_name,name').eq('id',member.workspace_id).single()
      setBrandName(ws?.brand_name||ws?.name||'')
      loadPages(member.workspace_id)
    })
  },[])

  async function loadPages(wid: string) {
    const { data } = await supabase.from('landing_pages').select('id,title,slug,status,views,created_at').eq('workspace_id',wid).order('created_at',{ascending:false})
    setPages(data||[])
  }

  function selectTemplate(tpl: typeof LANDING_TEMPLATES[0]) {
    setConfig(c=>({...c,template_id:tpl.id,theme:tpl.defaultTheme,font:tpl.defaultFont,accent:tpl.defaultAccent,sections:tpl.sections}))
    setPageId(null)
  }
  function updateSection(i: number, s: LandingSection) { setConfig(c=>({...c,sections:c.sections.map((x,j)=>j===i?s:x)})) }
  function deleteSection(i: number) { setConfig(c=>({...c,sections:c.sections.filter((_,j)=>j!==i)})) }
  function moveSection(i: number, dir: 1|-1) {
    setConfig(c=>{ const arr=[...c.sections]; const to=i+dir; if(to<0||to>=arr.length) return c; [arr[i],arr[to]]=[arr[to],arr[i]]; return {...c,sections:arr} })
  }
  function addSection(type: SectionType) { setConfig(c=>({...c,sections:[...c.sections,newSection(type)]})); setShowAddSection(false) }

  async function handleGenerate() {
    if(!wsId) return
    setGenerating(true)
    try {
      const res = await fetch('/api/landing-page/generate',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ workspace_id:wsId, template_id:config.template_id, lang:'ar' }) })
      const { result } = await res.json()
      if(result) {
        setConfig(c=>({...c,title:result.title||c.title,theme:result.suggested_theme||c.theme,accent:result.suggested_accent||c.accent,font:result.suggested_font||c.font,sections:result.sections||c.sections}))
        showToast('تم توليد الصفحة بواسطة Brand Brain ✓')
      }
    } catch { showToast('فشل التوليد') }
    setGenerating(false)
  }

  async function handleSave(publish = false) {
    if(!wsId) return
    setSaving(true)
    try {
      const res = await fetch('/api/landing-page/save',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ workspace_id:wsId, page_id:pageId, config, title:config.title, status:publish?'published':'draft' }) })
      const { page_id, slug } = await res.json()
      if(page_id) { setPageId(page_id); showToast(publish?`نُشر → nexaa.cc/p/${slug}`:'تم الحفظ كمسودة ✓'); loadPages(wsId) }
    } catch { showToast('فشل الحفظ') }
    setSaving(false)
  }

  const C = { bg:'#0C0C0C',surface:'#141414',elevated:'#1C1C1C',border:'rgba(255,255,255,0.10)',t1:'#FFFFFF',t2:'rgba(255,255,255,0.6)',t3:'rgba(255,255,255,0.35)',cyan:'#00D4FF' }

  return (
    <div dir="rtl" style={{ display:'flex',flexDirection:'column',height:'100vh',overflow:'hidden',background:C.bg,color:C.t1,fontFamily:"'Tajawal',system-ui,sans-serif" }}>
      {toast && <div style={{ position:'fixed',top:20,right:'50%',transform:'translateX(50%)',background:'#1C2A1C',border:'1px solid #2d4a2d',borderRadius:10,padding:'10px 20px',fontSize:13,color:'#6fcf6f',zIndex:9999 }}>{toast}</div>}

      {/* Top bar */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 20px',borderBottom:`1px solid ${C.border}`,background:C.surface,flexShrink:0 }}>
        <div style={{ display:'flex',alignItems:'center',gap:16 }}>
          <div>
            <div style={{ fontSize:16,fontWeight:700,letterSpacing:'-0.02em' }}>منشئ صفحات الهبوط</div>
            <div style={{ fontSize:11,color:C.t3 }}>أنشئ وانشر صفحة علامتك التجارية</div>
          </div>
          <div style={{ display:'flex',gap:2 }}>
            {(['builder','pages'] as const).map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{ padding:'5px 12px',borderRadius:7,border:'none',cursor:'pointer',fontSize:12,fontWeight:500,background:tab===t?C.elevated:'transparent',color:tab===t?C.t1:C.t3 }}>
                {t==='builder'?'المنشئ':`صفحاتي (${pages.length})`}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display:'flex',gap:8 }}>
          <button onClick={handleGenerate} disabled={generating||!wsId} style={{ padding:'8px 16px',borderRadius:8,border:`1px solid ${C.cyan}40`,cursor:'pointer',background:`${C.cyan}12`,color:C.cyan,fontSize:13,fontWeight:600,opacity:generating?0.6:1 }}>
            {generating?'جارٍ التوليد…':'✦ توليد بالذكاء الاصطناعي'}
          </button>
          <button onClick={()=>handleSave(false)} disabled={saving} style={{ padding:'8px 16px',borderRadius:8,border:`1px solid ${C.border}`,cursor:'pointer',background:'transparent',color:C.t2,fontSize:13 }}>حفظ مسودة</button>
          <button onClick={()=>handleSave(true)} disabled={saving} style={{ padding:'8px 18px',borderRadius:8,border:'none',cursor:'pointer',background:C.cyan,color:'#000',fontSize:13,fontWeight:700 }}>
            {saving?'جارٍ الحفظ…':'نشر →'}
          </button>
        </div>
      </div>

      {/* Pages tab */}
      {tab==='pages' && (
        <div style={{ flex:1,overflowY:'auto',padding:24 }}>
          <div style={{ maxWidth:800,margin:'0 auto' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
              <div style={{ fontSize:18,fontWeight:700 }}>صفحات الهبوط</div>
              <button onClick={()=>{ setPageId(null); setTab('builder') }} style={{ padding:'8px 16px',borderRadius:8,background:C.cyan,color:'#000',border:'none',cursor:'pointer',fontSize:13,fontWeight:600 }}>+ صفحة جديدة</button>
            </div>
            {pages.length===0
              ? <div style={{ textAlign:'center',padding:60,color:C.t3,fontSize:14 }}>لا توجد صفحات بعد. أنشئ أول صفحة هبوط.</div>
              : pages.map(page=>(
                <div key={page.id} style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:'16px 20px',marginBottom:12,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontSize:15,fontWeight:600 }}>{page.title}</div>
                    <div style={{ fontSize:11,color:C.t3,marginTop:3 }}>
                      <span style={{ color:page.status==='published'?'#6fcf6f':C.t3 }}>{page.status==='published'?'● منشور':'○ مسودة'}</span>{' · '}nexaa.cc/p/{page.slug}
                    </div>
                  </div>
                  <button onClick={()=>{ setPageId(page.id); setConfig(page.config||config); setTab('builder') }}
                    style={{ padding:'6px 12px',borderRadius:7,border:`1px solid ${C.cyan}40`,background:`${C.cyan}12`,color:C.cyan,fontSize:12,cursor:'pointer' }}>تعديل</button>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* Builder */}
      {tab==='builder' && (
        <div style={{ flex:1,display:'flex',overflow:'hidden' }}>
          {/* Left panel */}
          <div style={{ width:340,flexShrink:0,overflowY:'auto',borderLeft:`1px solid ${C.border}`,background:C.surface }}>
            <div style={{ padding:'16px 16px 80px' }}>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11,fontWeight:600,color:'var(--text-3)',marginBottom:6 }}>عنوان الصفحة</div>
                <input value={config.title} onChange={e=>setConfig(c=>({...c,title:e.target.value}))}
                  className="nexa-input" style={{ fontSize:13,fontWeight:600,direction:'rtl',textAlign:'right' }} placeholder="صفحتي" />
              </div>

              {/* Template picker */}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:10,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase' as const,color:C.t3,marginBottom:10 }}>القالب</div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:7 }}>
                  {LANDING_TEMPLATES.map(tpl=>(
                    <button key={tpl.id} onClick={()=>selectTemplate(tpl)} style={{ padding:'10px',borderRadius:9,border:`1px solid ${config.template_id===tpl.id?C.cyan:C.border}`,background:config.template_id===tpl.id?`${C.cyan}10`:C.elevated,color:config.template_id===tpl.id?C.cyan:C.t2,cursor:'pointer',textAlign:'right' as const,fontSize:12 }}>
                      <div style={{ fontSize:18,marginBottom:3 }}>{tpl.emoji}</div>
                      <div style={{ fontWeight:600,fontSize:11 }}>{tpl.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme */}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:10,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase' as const,color:C.t3,marginBottom:8 }}>الثيم</div>
                <div style={{ display:'flex',gap:6 }}>
                  {THEMES_AR.map(th=>(
                    <button key={th.id} onClick={()=>setConfig(c=>({...c,theme:th.id as LandingPageConfig['theme']}))} style={{ flex:1,padding:'7px 4px',borderRadius:7,border:`1px solid ${config.theme===th.id?C.cyan:C.border}`,background:config.theme===th.id?`${C.cyan}10`:C.elevated,color:config.theme===th.id?C.cyan:C.t2,cursor:'pointer',fontSize:10,fontWeight:500,display:'flex',flexDirection:'column',alignItems:'center',gap:4 }}>
                      <div style={{ width:16,height:16,borderRadius:4,background:th.dot,border:`1px solid ${C.border}` }}/>
                      {th.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent */}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:10,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase' as const,color:C.t3,marginBottom:8 }}>لون مميز</div>
                <div style={{ display:'flex',gap:6,flexWrap:'wrap' as const,alignItems:'center' }}>
                  {ACCENTS.map(a=>(
                    <button key={a} onClick={()=>setConfig(c=>({...c,accent:a}))} style={{ width:24,height:24,borderRadius:6,background:a,border:'none',cursor:'pointer',boxShadow:config.accent===a?`0 0 0 2px ${C.bg}, 0 0 0 4px ${a}`:'none',transition:'box-shadow 0.2s' }}/>
                  ))}
                  <input type="color" value={config.accent} onChange={e=>setConfig(c=>({...c,accent:e.target.value}))}
                    style={{ width:24,height:24,borderRadius:6,border:`1px solid ${C.border}`,padding:1,background:C.elevated,cursor:'pointer' }}/>
                </div>
              </div>

              {/* Sections */}
              <div>
                <div style={{ fontSize:10,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase' as const,color:C.t3,marginBottom:10 }}>الأقسام</div>
                {config.sections.map((s,i)=>(
                  <SectionEditor key={s.id} section={s} index={i} total={config.sections.length}
                    onChange={u=>updateSection(i,u)} onDelete={()=>deleteSection(i)} onMove={dir=>moveSection(i,dir)}/>
                ))}
                {showAddSection ? (
                  <div style={{ background:C.elevated,border:`1px solid ${C.border}`,borderRadius:10,padding:12,marginTop:8 }}>
                    <div style={{ fontSize:11,fontWeight:600,color:C.t3,marginBottom:10 }}>إضافة قسم</div>
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:6 }}>
                      {ADDABLE_SECTIONS.map(type=>(
                        <button key={type} onClick={()=>addSection(type)} style={{ padding:'8px 10px',borderRadius:7,border:`1px solid ${C.border}`,background:'transparent',color:C.t2,cursor:'pointer',fontSize:11,display:'flex',alignItems:'center',gap:6,flexDirection:'row-reverse' }}>
                          <span>{SECTION_ICONS[type]}</span><span>{SECTION_LABELS_AR[type]}</span>
                        </button>
                      ))}
                    </div>
                    <button onClick={()=>setShowAddSection(false)} style={{ marginTop:10,background:'none',border:'none',color:C.t3,fontSize:11,cursor:'pointer' }}>إلغاء</button>
                  </div>
                ) : (
                  <button onClick={()=>setShowAddSection(true)} style={{ width:'100%',padding:'9px',borderRadius:9,border:`1px dashed ${C.border}`,background:'transparent',color:C.t3,cursor:'pointer',fontSize:12,marginTop:4 }}>
                    + إضافة قسم
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div style={{ flex:1,overflow:'auto',background:'#080808',display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'24px 32px' }}>
            <div style={{ width:'100%',maxWidth:700 }}>
              <div style={{ marginBottom:12,fontSize:11,color:C.t3 }}>معاينة مباشرة</div>
              <div style={{ border:`1px solid ${C.border}`,borderRadius:14,overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}>
                <div style={{ background:'#1a1a1a',padding:'9px 14px',display:'flex',alignItems:'center',gap:7,borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ width:10,height:10,borderRadius:'50%',background:'#FF5F56' }}/>
                  <div style={{ width:10,height:10,borderRadius:'50%',background:'#FFBD2E' }}/>
                  <div style={{ width:10,height:10,borderRadius:'50%',background:'#27C93F' }}/>
                  <div style={{ flex:1,background:'#0f0f0f',borderRadius:5,padding:'3px 10px',fontSize:10,color:C.t3,marginRight:8 }}>nexaa.cc/p/your-page</div>
                </div>
                <div style={{ maxHeight:640,overflowY:'auto' }}>
                  <LandingPageRenderer config={config} workspaceId={wsId} brandName={brandName} preview={true}/>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
