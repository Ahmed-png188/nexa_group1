'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LANDING_TEMPLATES, SECTION_LABELS, SECTION_ICONS,
  type LandingPageConfig, type LandingSection, type SectionType,
} from '@/lib/landing-templates'
import LandingPageRenderer from '@/app/p/[slug]/LandingPageRenderer'

/* ─── Theme/Font options ─── */
const THEMES_EN = [
  { id:'dark',     label:'Dark',     dot:'#0C0C0C' },
  { id:'light',    label:'Light',    dot:'#F5F5F5' },
  { id:'warm',     label:'Warm',     dot:'#FDF8F0' },
  { id:'midnight', label:'Midnight', dot:'#070B14' },
]
const FONTS_EN = [
  { id:'geist', label:'Geist',   sample:'Clean & modern'   },
  { id:'serif', label:'Serif',   sample:'Classic editorial' },
  { id:'dm',    label:'DM Sans', sample:'Friendly & round' },
  { id:'inter', label:'Inter',   sample:'Precise & neutral' },
]
const ACCENTS = ['#00AAFF','#7C3AED','#059669','#DC2626','#D97706','#DB2777','#0891B2','#FFFFFF']

const ADDABLE_SECTIONS: SectionType[] = ['hero','products','about','features','testimonials','gallery','cta_banner','lead_form','footer']

function newSection(type: SectionType): LandingSection {
  const defaults: Record<SectionType, Record<string,any>> = {
    hero:         { headline:'Your Headline', subheadline:'Your subheadline here.', cta_label:'Get Started', cta_url:'#' },
    products:     { headline:'Our Products', items: [{ id:'p1', name:'Product', price:'$49', description:'Description', image:'' }] },
    about:        { headline:'About Us', text:'Tell your brand story here.', image:'' },
    features:     { headline:'Why Choose Us', features: [{ icon:'⚡', title:'Feature', desc:'Description' }] },
    testimonials: { headline:'What They Say', testimonials: [{ name:'Customer Name', role:'Role', text:'Great experience!' }] },
    gallery:      { headline:'Our Gallery', images: [] },
    cta_banner:   { headline:'Ready to start?', subline:'Join thousands of happy customers.', cta_label:'Get Started', cta_url:'#' },
    lead_form:    { headline:'Get in Touch', subline:"We'll reply within 24 hours.", cta:'Send →',
      fields: [
        { id:'f-name',  type:'text',  label:'Your name',     placeholder:'Name',               required:false },
        { id:'f-email', type:'email', label:'Email address', placeholder:'you@example.com',    required:true  },
      ]},
    footer:       { copyright:`© ${new Date().getFullYear()} Brand. All rights reserved.` },
  }
  return { id: `${type}-${Date.now()}`, type, content: defaults[type] || {} }
}

/* ─── Sub-components ─── */
function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', marginBottom:6 }}>{children}</div>
}
function NexaInput({ value, onChange, placeholder, multiline }: {
  value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean
}) {
  if (multiline) return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="nexa-input" style={{ fontSize:12, resize:'vertical' as const, minHeight:72, lineHeight:1.6 }} />
  )
  return <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    className="nexa-input" style={{ fontSize:12 }} />
}

/* ─── Section editor ─── */
function SectionEditor({ section, onChange, onDelete, onMove, index, total }: {
  section: LandingSection; onChange: (s: LandingSection) => void; onDelete: () => void
  onMove: (dir: 1|-1) => void; index: number; total: number
}) {
  const [open, setOpen] = useState(false)
  const c = section.content

  function setContent(key: string, val: any) {
    onChange({ ...section, content: { ...c, [key]: val } })
  }

  function renderEditor() {
    if (section.type === 'hero') return (
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <div><Label>Headline</Label><NexaInput value={c.headline||''} onChange={v=>setContent('headline',v)} placeholder="Main headline" /></div>
        <div><Label>Sub-headline</Label><NexaInput value={c.subheadline||''} onChange={v=>setContent('subheadline',v)} placeholder="Supporting line" multiline /></div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <div><Label>CTA Label</Label><NexaInput value={c.cta_label||''} onChange={v=>setContent('cta_label',v)} placeholder="Button text" /></div>
          <div><Label>CTA Link</Label><NexaInput value={c.cta_url||''} onChange={v=>setContent('cta_url',v)} placeholder="#products" /></div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <div><Label>2nd CTA (optional)</Label><NexaInput value={c.cta2_label||''} onChange={v=>setContent('cta2_label',v)} placeholder="Learn more" /></div>
          <div><Label>2nd CTA Link</Label><NexaInput value={c.cta2_url||''} onChange={v=>setContent('cta2_url',v)} placeholder="#about" /></div>
        </div>
      </div>
    )

    if (section.type === 'products') {
      const items: any[] = c.items || []
      return (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div><Label>Section headline</Label><NexaInput value={c.headline||''} onChange={v=>setContent('headline',v)} placeholder="Our Products" /></div>
          <Label>Items</Label>
          {items.map((item: any, i: number) => (
            <div key={item.id||i} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px', display:'flex', flexDirection:'column', gap:7 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 80px', gap:6 }}>
                <NexaInput value={item.name||''} onChange={v=>{ const a=[...items]; a[i]={...a[i],name:v}; setContent('items',a) }} placeholder="Item name" />
                <NexaInput value={item.price||''} onChange={v=>{ const a=[...items]; a[i]={...a[i],price:v}; setContent('items',a) }} placeholder="Price" />
              </div>
              <NexaInput value={item.description||''} onChange={v=>{ const a=[...items]; a[i]={...a[i],description:v}; setContent('items',a) }} placeholder="Description" />
              <NexaInput value={item.image||''} onChange={v=>{ const a=[...items]; a[i]={...a[i],image:v}; setContent('items',a) }} placeholder="Image URL (optional)" />
              <button onClick={()=>{ const a=items.filter((_,idx)=>idx!==i); setContent('items',a) }}
                style={{ alignSelf:'flex-start', background:'none', border:'none', color:'var(--error)', fontSize:11, cursor:'pointer', padding:0 }}>
                Remove item
              </button>
            </div>
          ))}
          <button onClick={()=>setContent('items',[...items,{id:`p${Date.now()}`,name:'New Item',price:'',description:'',image:''}])}
            style={{ background:'var(--elevated)', border:'1px dashed var(--border)', borderRadius:8, padding:'7px', fontSize:12, color:'var(--text-3)', cursor:'pointer' }}>
            + Add item
          </button>
        </div>
      )
    }

    if (section.type === 'about') return (
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <div><Label>Headline</Label><NexaInput value={c.headline||''} onChange={v=>setContent('headline',v)} placeholder="About Us" /></div>
        <div><Label>Text</Label><NexaInput value={c.text||''} onChange={v=>setContent('text',v)} placeholder="Your brand story..." multiline /></div>
        <div><Label>Image URL (optional)</Label><NexaInput value={c.image||''} onChange={v=>setContent('image',v)} placeholder="https://..." /></div>
      </div>
    )

    if (section.type === 'features') {
      const features: any[] = c.features || []
      return (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div><Label>Headline</Label><NexaInput value={c.headline||''} onChange={v=>setContent('headline',v)} placeholder="Features" /></div>
          <Label>Features</Label>
          {features.map((f: any, i: number) => (
            <div key={i} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px', display:'flex', flexDirection:'column', gap:7 }}>
              <div style={{ display:'grid', gridTemplateColumns:'48px 1fr', gap:6 }}>
                <NexaInput value={f.icon||''} onChange={v=>{ const a=[...features]; a[i]={...a[i],icon:v}; setContent('features',a) }} placeholder="⚡" />
                <NexaInput value={f.title||''} onChange={v=>{ const a=[...features]; a[i]={...a[i],title:v}; setContent('features',a) }} placeholder="Feature title" />
              </div>
              <NexaInput value={f.desc||''} onChange={v=>{ const a=[...features]; a[i]={...a[i],desc:v}; setContent('features',a) }} placeholder="Short description" />
              <button onClick={()=>{ const a=features.filter((_,idx)=>idx!==i); setContent('features',a) }}
                style={{ alignSelf:'flex-start', background:'none', border:'none', color:'var(--error)', fontSize:11, cursor:'pointer', padding:0 }}>Remove</button>
            </div>
          ))}
          <button onClick={()=>setContent('features',[...features,{icon:'✦',title:'Feature',desc:'Description'}])}
            style={{ background:'var(--elevated)', border:'1px dashed var(--border)', borderRadius:8, padding:'7px', fontSize:12, color:'var(--text-3)', cursor:'pointer' }}>
            + Add feature
          </button>
        </div>
      )
    }

    if (section.type === 'testimonials') {
      const list: any[] = c.testimonials || []
      return (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div><Label>Headline</Label><NexaInput value={c.headline||''} onChange={v=>setContent('headline',v)} placeholder="What They Say" /></div>
          <Label>Testimonials</Label>
          {list.map((tm: any, i: number) => (
            <div key={i} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px', display:'flex', flexDirection:'column', gap:7 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                <NexaInput value={tm.name||''} onChange={v=>{ const a=[...list]; a[i]={...a[i],name:v}; setContent('testimonials',a) }} placeholder="Name" />
                <NexaInput value={tm.role||''} onChange={v=>{ const a=[...list]; a[i]={...a[i],role:v}; setContent('testimonials',a) }} placeholder="Role/Title" />
              </div>
              <NexaInput value={tm.text||''} onChange={v=>{ const a=[...list]; a[i]={...a[i],text:v}; setContent('testimonials',a) }} placeholder="Their quote..." multiline />
              <button onClick={()=>{ const a=list.filter((_,idx)=>idx!==i); setContent('testimonials',a) }}
                style={{ alignSelf:'flex-start', background:'none', border:'none', color:'var(--error)', fontSize:11, cursor:'pointer', padding:0 }}>Remove</button>
            </div>
          ))}
          <button onClick={()=>setContent('testimonials',[...list,{name:'Customer',role:'Buyer',text:'Great experience!'}])}
            style={{ background:'var(--elevated)', border:'1px dashed var(--border)', borderRadius:8, padding:'7px', fontSize:12, color:'var(--text-3)', cursor:'pointer' }}>
            + Add testimonial
          </button>
        </div>
      )
    }

    if (section.type === 'cta_banner') return (
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <div><Label>Headline</Label><NexaInput value={c.headline||''} onChange={v=>setContent('headline',v)} placeholder="Ready to start?" /></div>
        <div><Label>Sub-line</Label><NexaInput value={c.subline||''} onChange={v=>setContent('subline',v)} placeholder="Supporting text" /></div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <div><Label>Button Label</Label><NexaInput value={c.cta_label||''} onChange={v=>setContent('cta_label',v)} placeholder="Get Started" /></div>
          <div><Label>Button Link</Label><NexaInput value={c.cta_url||''} onChange={v=>setContent('cta_url',v)} placeholder="#" /></div>
        </div>
      </div>
    )

    if (section.type === 'lead_form') return (
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <div><Label>Headline</Label><NexaInput value={c.headline||''} onChange={v=>setContent('headline',v)} placeholder="Get in Touch" /></div>
        <div><Label>Sub-line</Label><NexaInput value={c.subline||''} onChange={v=>setContent('subline',v)} placeholder="We'll reply within 24 hours" /></div>
        <div><Label>Button Label</Label><NexaInput value={c.cta||''} onChange={v=>setContent('cta',v)} placeholder="Send →" /></div>
        <div><Label>Thank you message</Label><NexaInput value={c.thank_you||''} onChange={v=>setContent('thank_you',v)} placeholder="Thanks! We'll be in touch." /></div>
      </div>
    )

    if (section.type === 'footer') return (
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <div><Label>Copyright text</Label><NexaInput value={c.copyright||''} onChange={v=>setContent('copyright',v)} placeholder="© 2025 Brand. All rights reserved." /></div>
      </div>
    )

    if (section.type === 'gallery') return (
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <div><Label>Headline</Label><NexaInput value={c.headline||''} onChange={v=>setContent('headline',v)} placeholder="Our Gallery" /></div>
        <div>
          <Label>Image URLs (one per line)</Label>
          <textarea
            value={(c.images||[]).join('\n')} onChange={e => setContent('images', e.target.value.split('\n').filter(Boolean))}
            className="nexa-input" style={{ fontSize:11, resize:'vertical', minHeight:80, lineHeight:1.5 }}
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
          <div style={{ fontSize:13, fontWeight:500, color:'var(--text-1)' }}>{SECTION_LABELS[section.type]}</div>
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

/* ─── Main Page ─── */
export default function LandingPageBuilderEn() {
  const supabase = createClient()
  const [wsId, setWsId]       = useState('')
  const [brandName, setBrandName] = useState('')
  const [brandType, setBrandType] = useState('physical_product')
  const [pages, setPages]     = useState<any[]>([])
  const [pageId, setPageId]   = useState<string|null>(null)
  const [tab, setTab]         = useState<'builder'|'pages'>('builder')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [toast, setToast]     = useState('')
  const [showAddSection, setShowAddSection] = useState(false)

  const [config, setConfig] = useState<LandingPageConfig>({
    title:       'My Landing Page',
    template_id: 'hero-product',
    theme:       'dark',
    font:        'geist',
    accent:      '#00AAFF',
    rtl:         false,
    logo_url:    '',
    whatsapp:    '',
    sections:    LANDING_TEMPLATES[0].sections,
    seo_title:   '',
    seo_description: '',
  })

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // Load workspace + pages
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: member } = await supabase
        .from('workspace_members').select('workspace_id').eq('user_id', user.id).limit(1).single()
      if (!member) return
      setWsId(member.workspace_id)
      const { data: ws } = await supabase
        .from('workspaces').select('brand_name, name, segment').eq('id', member.workspace_id).single()
      setBrandName(ws?.brand_name || ws?.name || '')
      setBrandType(ws?.segment || 'physical_product')

      // Load existing landing pages
      loadPages(member.workspace_id)
    })
  }, [])

  async function loadPages(wid: string) {
    const { data } = await supabase
      .from('landing_pages')
      .select('id, title, slug, status, views, leads_count, created_at')
      .eq('workspace_id', wid)
      .order('created_at', { ascending: false })
    setPages(data || [])
  }

  function loadPage(page: any) {
    setPageId(page.id)
    setConfig(page.config || config)
    setTab('builder')
  }

  // Template selection
  function selectTemplate(tpl: typeof LANDING_TEMPLATES[0]) {
    setConfig(c => ({
      ...c,
      template_id: tpl.id,
      theme:       tpl.defaultTheme,
      font:        tpl.defaultFont,
      accent:      tpl.defaultAccent,
      sections:    tpl.sections,
    }))
    setPageId(null)
  }

  // Section management
  function updateSection(index: number, updated: LandingSection) {
    setConfig(c => ({ ...c, sections: c.sections.map((s,i) => i===index ? updated : s) }))
  }
  function deleteSection(index: number) {
    setConfig(c => ({ ...c, sections: c.sections.filter((_,i) => i!==index) }))
  }
  function moveSection(index: number, dir: 1|-1) {
    setConfig(c => {
      const arr = [...c.sections]
      const to  = index + dir
      if (to < 0 || to >= arr.length) return c
      ;[arr[index], arr[to]] = [arr[to], arr[index]]
      return { ...c, sections: arr }
    })
  }
  function addSection(type: SectionType) {
    setConfig(c => ({ ...c, sections: [...c.sections, newSection(type)] }))
    setShowAddSection(false)
  }

  // Generate with AI
  async function handleGenerate() {
    if (!wsId) return
    setGenerating(true)
    try {
      const res = await fetch('/api/landing-page/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: wsId, template_id: config.template_id, goal: '' }),
      })
      const { result } = await res.json()
      if (result) {
        setConfig(c => ({
          ...c,
          title:           result.title       || c.title,
          theme:           result.suggested_theme  || c.theme,
          accent:          result.suggested_accent || c.accent,
          font:            result.suggested_font   || c.font,
          seo_title:       result.seo_title        || c.seo_title,
          seo_description: result.seo_description  || c.seo_description,
          sections:        result.sections         || c.sections,
        }))
        showToast('Page generated by Brand Brain ✓')
      }
    } catch { showToast('Generation failed') }
    setGenerating(false)
  }

  // Save page
  async function handleSave(publish = false) {
    if (!wsId) return
    setSaving(true)
    try {
      const res = await fetch('/api/landing-page/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: wsId,
          page_id:      pageId,
          config,
          title:        config.title,
          status:       publish ? 'published' : 'draft',
        }),
      })
      const { page_id, slug } = await res.json()
      if (page_id) {
        setPageId(page_id)
        showToast(publish ? `Published → nexaa.cc/p/${slug}` : 'Draft saved ✓')
        loadPages(wsId)
      }
    } catch { showToast('Save failed') }
    setSaving(false)
  }

  // ── Render ─────────────────────────────────────────────────
  const C = {
    bg: '#0C0C0C', surface: '#141414', elevated: '#1C1C1C',
    border: 'rgba(255,255,255,0.10)', t1: '#FFFFFF',
    t2: 'rgba(255,255,255,0.6)', t3: 'rgba(255,255,255,0.35)',
    cyan: '#00D4FF',
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background: C.bg, color: C.t1, fontFamily:"'Geist',-apple-system,sans-serif" }}>

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position:'fixed', top:20, left:'50%', transform:'translateX(-50%)', background:'#1C2A1C', border:'1px solid #2d4a2d', borderRadius:10, padding:'10px 20px', fontSize:13, color:'#6fcf6f', zIndex:9999, whiteSpace:'nowrap' }}>
          {toast}
        </div>
      )}

      {/* ── Top bar ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderBottom:`1px solid ${C.border}`, background: C.surface, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, letterSpacing:'-0.02em' }}>Landing Page Builder</div>
            <div style={{ fontSize:11, color: C.t3 }}>Build & publish your brand page</div>
          </div>
          <div style={{ display:'flex', gap:2 }}>
            {(['builder','pages'] as const).map(t => (
              <button key={t} onClick={()=>setTab(t)} style={{
                padding:'5px 12px', borderRadius:7, border:'none', cursor:'pointer', fontSize:12, fontWeight:500,
                background: tab===t ? C.elevated : 'transparent',
                color:      tab===t ? C.t1 : C.t3,
              }}>
                {t === 'builder' ? 'Builder' : `My Pages (${pages.length})`}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={handleGenerate} disabled={generating||!wsId} style={{
            padding:'8px 16px', borderRadius:8, border:`1px solid ${C.cyan}40`, cursor:'pointer',
            background:`${C.cyan}12`, color: C.cyan, fontSize:13, fontWeight:600,
            opacity: generating ? 0.6 : 1,
          }}>
            {generating ? 'Generating…' : '✦ Generate with AI'}
          </button>
          <button onClick={()=>handleSave(false)} disabled={saving} style={{
            padding:'8px 16px', borderRadius:8, border:`1px solid ${C.border}`, cursor:'pointer',
            background:'transparent', color: C.t2, fontSize:13,
          }}>Save Draft</button>
          <button onClick={()=>handleSave(true)} disabled={saving} style={{
            padding:'8px 18px', borderRadius:8, border:'none', cursor:'pointer',
            background: C.cyan, color:'#000', fontSize:13, fontWeight:700,
          }}>
            {saving ? 'Saving…' : 'Publish →'}
          </button>
        </div>
      </div>

      {/* ── Pages list tab ── */}
      {tab === 'pages' && (
        <div style={{ flex:1, overflowY:'auto', padding:24 }}>
          <div style={{ maxWidth:800, margin:'0 auto' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div style={{ fontSize:18, fontWeight:700 }}>Your Landing Pages</div>
              <button onClick={()=>{ setPageId(null); setConfig(c=>({...c, sections: LANDING_TEMPLATES[0].sections})); setTab('builder') }}
                style={{ padding:'8px 16px', borderRadius:8, background: C.cyan, color:'#000', border:'none', cursor:'pointer', fontSize:13, fontWeight:600 }}>
                + New Page
              </button>
            </div>
            {pages.length === 0 ? (
              <div style={{ textAlign:'center', padding:60, color: C.t3, fontSize:14 }}>No pages yet. Create your first landing page above.</div>
            ) : pages.map(page => (
              <div key={page.id} style={{ background: C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:'16px 20px', marginBottom:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:600 }}>{page.title}</div>
                  <div style={{ fontSize:11, color: C.t3, marginTop:3 }}>
                    <span style={{ color: page.status==='published' ? '#6fcf6f' : C.t3 }}>
                      {page.status === 'published' ? '● Published' : '○ Draft'}
                    </span>
                    {' · '}nexaa.cc/p/{page.slug}{' · '}{page.views} views
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  {page.status === 'published' && (
                    <a href={`/p/${page.slug}`} target="_blank" rel="noopener noreferrer"
                      style={{ padding:'6px 12px', borderRadius:7, border:`1px solid ${C.border}`, background:'transparent', color: C.t2, fontSize:12, textDecoration:'none' }}>
                      View ↗
                    </a>
                  )}
                  <button onClick={()=>loadPage(page)} style={{
                    padding:'6px 12px', borderRadius:7, border:`1px solid ${C.cyan}40`,
                    background:`${C.cyan}12`, color: C.cyan, fontSize:12, cursor:'pointer',
                  }}>Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Builder ── */}
      {tab === 'builder' && (
        <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

          {/* ── Left panel ── */}
          <div style={{ width:340, flexShrink:0, overflowY:'auto', borderRight:`1px solid ${C.border}`, background: C.surface }}>
            <div style={{ padding:'16px 16px 80px' }}>

              {/* Page title */}
              <div style={{ marginBottom:16 }}>
                <Label>Page title</Label>
                <input value={config.title} onChange={e=>setConfig(c=>({...c,title:e.target.value}))}
                  className="nexa-input" style={{ fontSize:13, fontWeight:600 }} placeholder="My Landing Page" />
              </div>

              {/* Template picker */}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' as const, color: C.t3, marginBottom:10 }}>Template</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
                  {LANDING_TEMPLATES.map(tpl => (
                    <button key={tpl.id} onClick={()=>selectTemplate(tpl)} style={{
                      padding:'10px 10px', borderRadius:9,
                      border: `1px solid ${config.template_id===tpl.id ? C.cyan : C.border}`,
                      background: config.template_id===tpl.id ? `${C.cyan}10` : C.elevated,
                      color: config.template_id===tpl.id ? C.cyan : C.t2,
                      cursor:'pointer', textAlign:'left', fontSize:12,
                    }}>
                      <div style={{ fontSize:18, marginBottom:3 }}>{tpl.emoji}</div>
                      <div style={{ fontWeight:600, fontSize:11 }}>{tpl.label}</div>
                      <div style={{ fontSize:10, color: C.t3, marginTop:2, lineHeight:1.3 }}>{tpl.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme */}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' as const, color: C.t3, marginBottom:8 }}>Theme</div>
                <div style={{ display:'flex', gap:6 }}>
                  {THEMES_EN.map(th => (
                    <button key={th.id} onClick={()=>setConfig(c=>({...c,theme:th.id as LandingPageConfig['theme']}))} style={{
                      flex:1, padding:'7px 4px', borderRadius:7, border:`1px solid ${config.theme===th.id?C.cyan:C.border}`,
                      background: config.theme===th.id ? `${C.cyan}10` : C.elevated,
                      color: config.theme===th.id ? C.cyan : C.t2,
                      cursor:'pointer', fontSize:11, fontWeight:500,
                      display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                    }}>
                      <div style={{ width:16, height:16, borderRadius:4, background:th.dot, border:`1px solid ${C.border}` }} />
                      {th.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font */}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' as const, color: C.t3, marginBottom:8 }}>Font</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                  {FONTS_EN.map(f => (
                    <button key={f.id} onClick={()=>setConfig(c=>({...c,font:f.id as LandingPageConfig['font']}))} style={{
                      padding:'7px 10px', borderRadius:7, border:`1px solid ${config.font===f.id?C.cyan:C.border}`,
                      background: config.font===f.id ? `${C.cyan}10` : C.elevated,
                      color: config.font===f.id ? C.cyan : C.t2,
                      cursor:'pointer', textAlign:'left', fontSize:11,
                    }}>
                      <div style={{ fontWeight:700 }}>{f.label}</div>
                      <div style={{ fontSize:9, color: C.t3 }}>{f.sample}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent color */}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' as const, color: C.t3, marginBottom:8 }}>Accent Color</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' as const, alignItems:'center' }}>
                  {ACCENTS.map(a => (
                    <button key={a} onClick={()=>setConfig(c=>({...c,accent:a}))} style={{
                      width:24, height:24, borderRadius:6, background:a, border:'none', cursor:'pointer',
                      boxShadow: config.accent===a ? `0 0 0 2px ${C.bg}, 0 0 0 4px ${a}` : 'none',
                      transition:'box-shadow 0.2s',
                    }} />
                  ))}
                  <input type="color" value={config.accent} onChange={e=>setConfig(c=>({...c,accent:e.target.value}))}
                    style={{ width:24, height:24, borderRadius:6, border:`1px solid ${C.border}`, padding:1, background:C.elevated, cursor:'pointer' }} />
                </div>
              </div>

              {/* Settings */}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' as const, color: C.t3, marginBottom:10 }}>Page Settings</div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <div>
                    <Label>Logo URL</Label>
                    <NexaInput value={config.logo_url||''} onChange={v=>setConfig(c=>({...c,logo_url:v}))} placeholder="https://... (optional)" />
                  </div>
                  <div>
                    <Label>WhatsApp number</Label>
                    <NexaInput value={config.whatsapp||''} onChange={v=>setConfig(c=>({...c,whatsapp:v}))} placeholder="+966 5X XXX XXXX (optional)" />
                  </div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0' }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:500, color: C.t1 }}>Right-to-left (RTL)</div>
                      <div style={{ fontSize:11, color: C.t3 }}>For Arabic content</div>
                    </div>
                    <button onClick={()=>setConfig(c=>({...c,rtl:!c.rtl}))} style={{
                      width:36, height:20, borderRadius:10, background:config.rtl?C.cyan:'var(--border)', border:'none', cursor:'pointer',
                      position:'relative', transition:'background 0.2s',
                    }}>
                      <div style={{ position:'absolute', top:2, left:config.rtl?17:2, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.3)' }}/>
                    </button>
                  </div>
                  <div>
                    <Label>SEO Title</Label>
                    <NexaInput value={config.seo_title||''} onChange={v=>setConfig(c=>({...c,seo_title:v}))} placeholder="Meta title for search engines" />
                  </div>
                  <div>
                    <Label>SEO Description</Label>
                    <NexaInput value={config.seo_description||''} onChange={v=>setConfig(c=>({...c,seo_description:v}))} placeholder="Meta description (under 160 chars)" multiline />
                  </div>
                </div>
              </div>

              {/* Sections */}
              <div>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' as const, color: C.t3, marginBottom:10 }}>Sections</div>
                {config.sections.map((s, i) => (
                  <SectionEditor
                    key={s.id}
                    section={s}
                    index={i}
                    total={config.sections.length}
                    onChange={updated=>updateSection(i,updated)}
                    onDelete={()=>deleteSection(i)}
                    onMove={dir=>moveSection(i,dir)}
                  />
                ))}

                {/* Add section */}
                {showAddSection ? (
                  <div style={{ background: C.elevated, border:`1px solid ${C.border}`, borderRadius:10, padding:12, marginTop:8 }}>
                    <div style={{ fontSize:11, fontWeight:600, color: C.t3, marginBottom:10 }}>Add Section</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                      {ADDABLE_SECTIONS.map(type => (
                        <button key={type} onClick={()=>addSection(type)} style={{
                          padding:'8px 10px', borderRadius:7, border:`1px solid ${C.border}`,
                          background:'transparent', color: C.t2, cursor:'pointer', fontSize:11,
                          display:'flex', alignItems:'center', gap:6,
                        }}>
                          <span>{SECTION_ICONS[type]}</span>
                          <span>{SECTION_LABELS[type]}</span>
                        </button>
                      ))}
                    </div>
                    <button onClick={()=>setShowAddSection(false)} style={{ marginTop:10, background:'none', border:'none', color: C.t3, fontSize:11, cursor:'pointer' }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={()=>setShowAddSection(true)} style={{
                    width:'100%', padding:'9px', borderRadius:9, border:`1px dashed ${C.border}`,
                    background:'transparent', color: C.t3, cursor:'pointer', fontSize:12, marginTop:4,
                  }}>
                    + Add Section
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Right panel: live preview ── */}
          <div style={{ flex:1, overflow:'auto', background:'#080808', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'24px 32px' }}>
            <div style={{ width:'100%', maxWidth:700 }}>
              <div style={{ marginBottom:12, display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ fontSize:11, color: C.t3 }}>Live Preview</div>
                {pageId && (
                  <a href={`/p/${pages.find(p=>p.id===pageId)?.slug || ''}`} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize:11, color: C.cyan, textDecoration:'none' }}>
                    View live page ↗
                  </a>
                )}
              </div>
              <div style={{ border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}>
                <div style={{ background:'#1a1a1a', padding:'9px 14px', display:'flex', alignItems:'center', gap:7, borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:'#FF5F56' }}/>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:'#FFBD2E' }}/>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:'#27C93F' }}/>
                  <div style={{ flex:1, background:'#0f0f0f', borderRadius:5, padding:'3px 10px', fontSize:10, color: C.t3, marginLeft:8 }}>
                    nexaa.cc/p/your-page
                  </div>
                </div>
                <div style={{ maxHeight:640, overflowY:'auto' }}>
                  <LandingPageRenderer
                    config={config}
                    workspaceId={wsId}
                    brandName={brandName}
                    preview={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
