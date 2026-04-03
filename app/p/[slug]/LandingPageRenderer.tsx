'use client'

import { useEffect, useRef, useState } from 'react'

// ── Types ─────────────────────────────────────────────────────
interface Page {
  id:     string
  slug:   string
  config: Record<string, any>
}

// ── Font imports per design system ────────────────────────────
const FONT_URLS: Record<string, string> = {
  editorial:          'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Syne:wght@400;500;600;700;800&display=swap',
  minimal_architect:  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Inter:wght@300;400;500&display=swap',
  bold_expressionist: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@300;400;500;600;700&display=swap',
  warm_storyteller:   'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Jost:wght@300;400;500;600&display=swap',
}

// ── Shared utilities ──────────────────────────────────────────
function useScrollAnim(deps: any[] = []) {
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('lp-in')
          obs.unobserve(e.target)
        }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
    )
    document.querySelectorAll('[data-animate]').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, deps)
}

function useFormSubmit(workspaceId: string, slug: string) {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [done, setDone]         = useState(false)
  const [busy, setBusy]         = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setBusy(true)
    try {
      await fetch('/api/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          form_values:  { 'f-name': name, 'f-email': email },
          fields: [
            { id:'f-name',  type:'text',  label:'Name',  required:false },
            { id:'f-email', type:'email', label:'Email', required:true  },
          ],
          source: `landing_page:${slug}`,
        }),
      })
      setDone(true)
    } catch {}
    setBusy(false)
  }

  return { name, setName, email, setEmail, done, busy, submit }
}

// ── Image helper ──────────────────────────────────────────────
function Img({ src, alt, style }: { src?: string; alt?: string; style?: React.CSSProperties }) {
  if (!src) return null
  return <img src={src} alt={alt || ''} style={{ display:'block', width:'100%', height:'100%', objectFit:'cover', ...style }} />
}

// ── Click logging ─────────────────────────────────────────────
function logClick(workspaceId: string, productName: string, actionType: string, pageSlug: string) {
  if (!workspaceId) return
  fetch('/api/landing-page/log-click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspace_id: workspaceId,
      product_name: productName,
      action_type:  actionType,
      page_slug:    pageSlug,
      referrer:     typeof document !== 'undefined' ? document.referrer : '',
    }),
  }).catch(() => {})
}

// ── Product modal ─────────────────────────────────────────────
interface SelectedProduct { item: any; itemIndex: number }

function ProductModal({
  sel, imgs, accent, workspaceId, slug, onClose,
}: {
  sel:         SelectedProduct
  imgs:        string[]
  accent:      string
  workspaceId: string
  slug:        string
  onClose:     () => void
}) {
  const { item, itemIndex } = sel
  const photos: string[] = (item.photos?.length ? item.photos : [imgs[itemIndex]]).filter(Boolean)
  const [photoIdx, setPhotoIdx] = useState(0)

  const actionType  = item.action_type  || 'lead_form'
  const actionValue = item.action_value || ''

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleAction() {
    logClick(workspaceId, item.name, actionType, slug)
    if (actionType === 'whatsapp') {
      const msg = encodeURIComponent(item.whatsapp_text || `Hi, I'm interested in ${item.name}`)
      const num = actionValue.replace(/\D/g, '')
      window.open(`https://wa.me/${num}?text=${msg}`, '_blank')
    } else if (actionType === 'stripe' || actionType === 'external') {
      window.open(actionValue, '_blank')
    } else {
      onClose()
      setTimeout(() => document.getElementById('form')?.scrollIntoView({ behavior: 'smooth' }), 120)
    }
  }

  const btnLabel =
    actionType === 'whatsapp' ? '💬 WhatsApp' :
    actionType === 'stripe'   ? '🔒 Buy Now' :
    actionType === 'external' ? '→ Learn More' :
    'Get Access →'

  return (
    <div
      onClick={onClose}
      style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.78)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background:'#FAFAF8', borderRadius:4, overflow:'hidden', maxWidth:860, width:'100%', display:'grid', gridTemplateColumns:'1fr 1fr', maxHeight:'90vh', boxShadow:'0 32px 80px rgba(0,0,0,0.4)' }}
      >
        {/* Left — photo carousel */}
        <div style={{ background:'#F0EDE8', position:'relative', overflow:'hidden', minHeight:380 }}>
          {photos.length > 0 ? (
            <>
              <img src={photos[photoIdx]} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', minHeight:380 }} />
              {photos.length > 1 && (
                <>
                  <button onClick={() => setPhotoIdx(p => (p - 1 + photos.length) % photos.length)} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', background:'rgba(0,0,0,0.45)', color:'#fff', border:'none', borderRadius:'50%', width:34, height:34, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
                  <button onClick={() => setPhotoIdx(p => (p + 1) % photos.length)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'rgba(0,0,0,0.45)', color:'#fff', border:'none', borderRadius:'50%', width:34, height:34, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
                  <div style={{ position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)', display:'flex', gap:6 }}>
                    {photos.map((_, pi) => <div key={pi} style={{ width:6, height:6, borderRadius:'50%', background: pi === photoIdx ? '#fff' : 'rgba(255,255,255,0.4)', transition:'background .2s' }} />)}
                  </div>
                </>
              )}
            </>
          ) : (
            <div style={{ height:'100%', minHeight:380, display:'flex', alignItems:'center', justifyContent:'center', fontSize:64 }}>📦</div>
          )}
        </div>
        {/* Right — details */}
        <div style={{ padding:'36px 32px', display:'flex', flexDirection:'column', overflowY:'auto' }}>
          <button onClick={onClose} style={{ alignSelf:'flex-end', background:'none', border:'none', fontSize:18, cursor:'pointer', color:'#999', marginBottom:16, lineHeight:1 }}>✕</button>
          {item.badge && (
            <div style={{ display:'inline-block', fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', padding:'3px 10px', background:`${accent}22`, color: accent, marginBottom:14 }}>{item.badge}</div>
          )}
          <h2 style={{ fontSize:22, fontWeight:700, color:'#0F0D0A', lineHeight:1.2, marginBottom:10 }}>{item.name}</h2>
          <p style={{ fontSize:14, color:'rgba(15,13,10,0.58)', lineHeight:1.72, marginBottom:20, flex:1 }}>{item.desc}</p>
          {item.price && <div style={{ fontSize:22, fontWeight:700, color: accent, marginBottom:28 }}>{item.price}</div>}
          <button
            onClick={handleAction}
            style={{ display:'block', width:'100%', padding:'13px 24px', background: accent, color:'#fff', border:'none', borderRadius:3, fontSize:14, fontWeight:700, cursor:'pointer', letterSpacing:'0.04em', marginTop:'auto' }}
          >
            {btnLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════
export default function LandingPageRenderer({ page }: { page: Page }) {
  const cfg = page.config || {}
  const ds  = cfg.design_system || 'editorial'

  const globalCss = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    img { max-width: 100%; }
    a { color: inherit; text-decoration: none; }
    [data-animate] { opacity: 0; transform: translateY(22px); transition: opacity .7s ease, transform .7s cubic-bezier(.16,1,.3,1); }
    [data-animate].lp-in { opacity: 1; transform: translateY(0); }
    [data-animate-d1] { transition-delay: .1s !important; }
    [data-animate-d2] { transition-delay: .2s !important; }
    [data-animate-d3] { transition-delay: .3s !important; }
    @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
    @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.35} }
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-thumb { background: rgba(128,128,128,.25); border-radius: 3px; }
  `

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: globalCss }} />
      <link rel="stylesheet" href={FONT_URLS[ds] || FONT_URLS.editorial} />
      {ds === 'editorial'          && <Editorial         cfg={cfg} page={page} />}
      {ds === 'minimal_architect'  && <MinimalArchitect  cfg={cfg} page={page} />}
      {ds === 'bold_expressionist' && <BoldExpressionist cfg={cfg} page={page} />}
      {ds === 'warm_storyteller'   && <WarmStoryteller   cfg={cfg} page={page} />}
      {!['editorial','minimal_architect','bold_expressionist','warm_storyteller'].includes(ds) && (
        <Editorial cfg={cfg} page={page} />
      )}
    </>
  )
}

// ══════════════════════════════════════════════════════════════
// 1. EDITORIAL — Magazine aesthetic, Playfair + Syne, cream
// ══════════════════════════════════════════════════════════════
function Editorial({ cfg, page }: { cfg: any; page: Page }) {
  useScrollAnim([cfg])
  const accent = cfg.accent || '#8B6914'
  const rtl    = cfg.lang === 'ar'
  const dir    = rtl ? 'rtl' : 'ltr'
  const F      = { h: "'Playfair Display', Georgia, serif", b: "'Syne', system-ui, sans-serif" }
  const P      = { bg:'#F7F3ED', bg2:'#EDE8E0', bg3:'#DDD6CA', ink:'#0F0D0A', ink2:'rgba(15,13,10,0.55)', ink3:'rgba(15,13,10,0.28)', ink4:'rgba(15,13,10,0.10)', dark:'#13110E' }
  const hero   = cfg.hero      || {}
  const mq     = cfg.marquee   || {}
  const stmt   = cfg.statement || {}
  const prods  = cfg.products  || {}
  const pq     = cfg.pull_quote || {}
  const story  = cfg.story     || {}
  const revs   = cfg.reviews   || {}
  const form   = cfg.form      || {}
  const footer = cfg.footer    || {}
  const nav    = cfg.nav       || {}
  const imgs   = cfg.product_images || []
  const form_  = useFormSubmit(cfg.workspace_id, page.slug)
  const [navBg, setNavBg] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null)
  useEffect(() => {
    const onScroll = () => setNavBg(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div dir={dir} style={{ background: P.bg, color: P.ink, fontFamily: F.b, minHeight:'100vh', overflowX:'hidden' }}>

      {/* NAV */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, padding:'16px 40px', display:'flex', alignItems:'center', justifyContent:'space-between', background: navBg ? 'rgba(247,243,237,0.95)' : 'transparent', backdropFilter: navBg ? 'blur(12px)' : 'none', borderBottom: navBg ? `1px solid ${P.ink4}` : 'none', transition:'background .3s, border-color .3s' }}>
        <div style={{ fontFamily: F.h, fontSize:18, fontWeight:700, fontStyle:'italic', letterSpacing:'-0.02em' }}>
          {cfg.logo_url ? <img src={cfg.logo_url} alt={cfg.brand_name} style={{ height:32, objectFit:'contain' }} /> : cfg.brand_name}
        </div>
        <div style={{ display:'flex', gap:32, alignItems:'center' }}>
          {(nav.links || []).map((l: string, i: number) => (
            <a key={i} href={`#${l.toLowerCase().replace(/\s/g, '-')}`} style={{ fontSize:12, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color: P.ink2, transition:'color .2s' }}>{l}</a>
          ))}
          {nav.cta_label && (
            <a href="#form" style={{ padding:'8px 20px', border:`1.5px solid ${P.ink}`, fontSize:12, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color: P.ink, transition:'all .2s' }}>{nav.cta_label}</a>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position:'relative', paddingTop:120, paddingBottom:80, paddingLeft:40, paddingRight:40, minHeight:'90vh', display:'flex', alignItems:'center', overflow:'hidden' }}>
        {/* Ghost watermark */}
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontSize:'18vw', fontFamily: F.h, fontWeight:900, color: P.ink, opacity:0.04, whiteSpace:'nowrap', pointerEvents:'none', userSelect:'none', lineHeight:1 }}>
          {cfg.brand_name}
        </div>
        <div style={{ maxWidth:1100, margin:'0 auto', width:'100%', position:'relative', zIndex:1 }}>
          <div data-animate style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color: accent, marginBottom:28 }}>
            {hero.eyebrow}
          </div>
          <h1 data-animate data-animate-d1 style={{ fontFamily: F.h, fontSize:'clamp(42px,7vw,92px)', fontWeight:900, letterSpacing:'-0.03em', lineHeight:0.95, marginBottom:32, maxWidth:'65%' }}>
            {hero.headline_line1}
            {hero.headline_line2 && <><br /><em style={{ color: accent }}>{hero.headline_line2}</em></>}
          </h1>
          <p data-animate data-animate-d2 style={{ fontSize:'clamp(15px,1.4vw,18px)', color: P.ink2, lineHeight:1.7, maxWidth:480, marginBottom:40 }}>
            {hero.body}
          </p>
          <div data-animate data-animate-d3 style={{ display:'flex', gap:16, flexWrap:'wrap', alignItems:'center', marginBottom:40 }}>
            {hero.cta_primary && (
              <a href="#form" style={{ display:'inline-flex', alignItems:'center', padding:'14px 32px', background: P.ink, color: P.bg, fontFamily: F.b, fontSize:13, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', transition:'opacity .2s' }}>{hero.cta_primary}</a>
            )}
            {hero.cta_secondary && (
              <a href="#products" style={{ display:'inline-flex', alignItems:'center', padding:'14px 32px', border:`1.5px solid ${P.ink3}`, color: P.ink, fontSize:13, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase' }}>{hero.cta_secondary}</a>
            )}
          </div>
          {(hero.trust_items || []).length > 0 && (
            <div data-animate style={{ display:'flex', gap:32, flexWrap:'wrap' }}>
              {(hero.trust_items as string[]).map((t, i) => (
                <span key={i} style={{ fontSize:12, color: P.ink3 }}>— {t}</span>
              ))}
            </div>
          )}
        </div>
        {imgs[0] && (
          <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'36%', overflow:'hidden' }}>
            <Img src={imgs[0]} style={{ width:'100%', height:'100%' }} />
            <div style={{ position:'absolute', inset:0, background:`linear-gradient(to right, ${P.bg} 0%, transparent 40%)` }} />
          </div>
        )}
      </section>

      {/* MARQUEE */}
      {(mq.items || []).length > 0 && (
        <div style={{ background: P.dark, overflow:'hidden', padding:'14px 0', borderTop:`1px solid rgba(255,255,255,0.05)` }}>
          <div style={{ display:'flex', animation:'marquee 28s linear infinite', width:'max-content' }}>
            {[...Array(3)].flatMap(() => (mq.items as string[]).map((item, i) => (
              <span key={`${item}-${i}`} style={{ fontFamily: F.b, fontSize:12, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.7)', whiteSpace:'nowrap', paddingRight:60 }}>
                {item} <span style={{ color: accent, marginRight:60 }}>·</span>
              </span>
            )))}
          </div>
        </div>
      )}

      {/* STATEMENT */}
      {stmt.left_headline && (
        <section id="statement" style={{ padding:'100px 40px', maxWidth:1100, margin:'0 auto', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'50%', right:0, transform:'translateY(-50%)', fontSize:160, fontFamily: F.h, fontWeight:900, color: P.ink, opacity:0.045, lineHeight:1, pointerEvents:'none', userSelect:'none' }}>
            {stmt.number || '01'}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'start' }}>
            <div data-animate>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color: P.ink3, marginBottom:16 }}>
                {stmt.number || '01'}
              </div>
              <h2 style={{ fontFamily: F.h, fontSize:'clamp(28px,3.5vw,46px)', fontWeight:700, lineHeight:1.1, marginBottom:8 }}>
                {stmt.left_headline} <em style={{ color: accent }}>{stmt.left_italic}</em>
              </h2>
            </div>
            <div data-animate data-animate-d1>
              <p style={{ fontSize:16, color: P.ink2, lineHeight:1.8, marginBottom:40 }}>{stmt.body}</p>
              {(stmt.stats || []).length > 0 && (
                <div style={{ display:'grid', gridTemplateColumns:`repeat(${(stmt.stats as any[]).length},1fr)`, gap:24, borderTop:`1px solid ${P.ink4}`, paddingTop:32 }}>
                  {(stmt.stats as any[]).map((s, i) => (
                    <div key={i}>
                      <div style={{ fontFamily: F.h, fontSize:'clamp(28px,3vw,40px)', fontWeight:700, color: accent, marginBottom:4 }}>{s.num}</div>
                      <div style={{ fontSize:11, color: P.ink3, letterSpacing:'0.04em' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* PRODUCTS */}
      {(prods.items || []).length > 0 && (
        <section id="products" style={{ padding:'80px 40px', background: P.bg2 }}>
          <div style={{ maxWidth:1100, margin:'0 auto' }}>
            <div data-animate style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:48, borderBottom:`1px solid ${P.ink4}`, paddingBottom:20 }}>
              <h2 style={{ fontFamily: F.h, fontSize:'clamp(28px,3vw,42px)', fontWeight:700 }}>
                {prods.headline} <em style={{ color: accent }}>{prods.headline_italic}</em>
              </h2>
              {prods.link_label && <a href="#" style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color: accent, borderBottom:`1px solid ${accent}` }}>{prods.link_label} →</a>}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:1, background: P.ink4 }}>
              {(prods.items as any[]).map((item, i) => (
                <div key={i} data-animate onClick={() => setSelectedProduct({ item, itemIndex: i + 1 })} style={{ background: item.featured ? P.ink : P.bg, padding:'36px 28px', position:'relative', transition:'background .3s', cursor:'pointer' }}>
                  {item.badge && <div style={{ position:'absolute', top:20, right:20, fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', padding:'3px 8px', background: accent, color:'#fff' }}>{item.badge}</div>}
                  <div style={{ fontSize:10, color: item.featured ? 'rgba(255,255,255,0.4)' : P.ink3, marginBottom:12, letterSpacing:'0.06em' }}>{item.num}</div>
                  {imgs[i + 1] && (
                    <div style={{ height:180, marginBottom:20, overflow:'hidden' }}>
                      <Img src={imgs[i + 1]} style={{ filter: item.featured ? 'brightness(0.9)' : 'none' }} />
                    </div>
                  )}
                  <h3 style={{ fontFamily: F.h, fontSize:20, fontWeight:700, color: item.featured ? '#fff' : P.ink, marginBottom:10 }}>{item.name}</h3>
                  <p style={{ fontSize:13, color: item.featured ? 'rgba(255,255,255,0.6)' : P.ink2, lineHeight:1.6, marginBottom:16 }}>{item.desc}</p>
                  {item.price && <div style={{ fontSize:16, fontWeight:700, color: accent }}>{item.price}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PULL QUOTE */}
      {pq.quote && (
        <section style={{ padding:'80px 40px', background: P.bg3 }}>
          <div data-animate style={{ maxWidth:820, margin:'0 auto', textAlign:'center' }}>
            <div style={{ fontFamily: F.h, fontSize:'clamp(24px,3vw,36px)', fontStyle:'italic', fontWeight:400, lineHeight:1.45, color: P.ink, marginBottom:24 }}>
              "{pq.quote}"
            </div>
            <div style={{ fontSize:12, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color: P.ink3 }}>
              {pq.author}{pq.location && <span style={{ fontWeight:400, marginLeft:12 }}>— {pq.location}</span>}
            </div>
          </div>
        </section>
      )}

      {/* STORY */}
      {story.headline && (
        <section id="story" style={{ padding:'100px 40px' }}>
          <div style={{ maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:80 }}>
            <div data-animate>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color: P.ink3, marginBottom:20 }}>{story.tag}</div>
              <h2 style={{ fontFamily: F.h, fontSize:'clamp(28px,3vw,44px)', fontWeight:700, lineHeight:1.1, marginBottom:24 }}>
                {story.headline} <em style={{ color: accent }}>{story.headline_italic}</em>
              </h2>
              <p style={{ fontSize:15, color: P.ink2, lineHeight:1.8, marginBottom:36 }}>{story.body}</p>
            </div>
            <div data-animate data-animate-d1 style={{ borderLeft:`1px solid ${P.ink4}`, paddingLeft:48, display:'flex', flexDirection:'column', gap:0 }}>
              {(story.values || []).map((v: any, i: number) => (
                <div key={i} style={{ padding:'24px 0', borderBottom:`1px solid ${P.ink4}` }}>
                  <div style={{ fontSize:13, fontWeight:700, marginBottom:6, color: P.ink }}>{v.title}</div>
                  <div style={{ fontSize:13, color: P.ink2, lineHeight:1.6 }}>{v.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* REVIEWS */}
      {(revs.items || []).length > 0 && (
        <section id="reviews" style={{ padding:'80px 40px', background: P.bg2 }}>
          <div style={{ maxWidth:1100, margin:'0 auto' }}>
            <div data-animate style={{ marginBottom:48 }}>
              <h2 style={{ fontFamily: F.h, fontSize:'clamp(24px,2.5vw,36px)', fontWeight:700, marginBottom:8 }}>{revs.headline}</h2>
              <div style={{ fontSize:12, color: P.ink3 }}>{revs.score} · {revs.count}</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:32, alignItems:'start' }}>
              {(revs.items as any[]).map((r, i) => (
                <div key={i} data-animate style={{ paddingTop: i===1 ? 80 : i===2 ? 40 : 0 }}>
                  <p style={{ fontFamily: F.h, fontSize:16, fontStyle:'italic', color: P.ink, lineHeight:1.6, marginBottom:16 }}>"{r.quote}"</p>
                  <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.06em', color: P.ink3 }}>{r.author}</div>
                  <div style={{ fontSize:11, color: P.ink3, opacity:.7, marginTop:2 }}>{r.location}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FORM */}
      <section id="form" style={{ padding:'100px 40px', background: P.dark }}>
        <div style={{ maxWidth:600, margin:'0 auto' }}>
          <div data-animate style={{ marginBottom:40 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', marginBottom:16 }}>{form.tag}</div>
            <h2 style={{ fontFamily: F.h, fontSize:'clamp(28px,3vw,44px)', fontWeight:700, color:'#fff', lineHeight:1.1, marginBottom:12 }}>
              {form.headline_line1}<br /><em style={{ color: accent }}>{form.headline_italic || form.headline_line2}</em>
            </h2>
            <p style={{ fontSize:14, color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>{form.body}</p>
          </div>
          {form_.done ? (
            <div style={{ fontSize:18, fontFamily: F.h, fontStyle:'italic', color: accent }}>Thank you. We'll be in touch.</div>
          ) : (
            <form onSubmit={form_.submit} style={{ display:'flex', flexDirection:'column', gap:24 }}>
              <div>
                <input type="text" value={form_.name} onChange={e => form_.setName(e.target.value)} placeholder="Your name" style={{ width:'100%', background:'transparent', border:'none', borderBottom:'1px solid rgba(255,255,255,0.2)', padding:'12px 0', color:'#fff', fontSize:15, fontFamily: F.b, outline:'none' }} />
              </div>
              <div>
                <input type="email" value={form_.email} onChange={e => form_.setEmail(e.target.value)} placeholder="Email address" required style={{ width:'100%', background:'transparent', border:'none', borderBottom:'1px solid rgba(255,255,255,0.2)', padding:'12px 0', color:'#fff', fontSize:15, fontFamily: F.b, outline:'none' }} />
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <button type="submit" disabled={form_.busy} style={{ padding:'14px 36px', background: accent, color:'#fff', border:'none', fontSize:12, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer', opacity: form_.busy ? 0.6 : 1 }}>
                  {form_.busy ? '...' : (form.cta || 'Submit')}
                </button>
                {form.note && <span style={{ fontSize:11, color:'rgba(255,255,255,0.25)' }}>{form.note}</span>}
              </div>
            </form>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: P.dark, borderTop:'1px solid rgba(255,255,255,0.06)', padding:'40px 40px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:32 }}>
          <div>
            <div style={{ fontFamily: F.h, fontSize:22, fontStyle:'italic', fontWeight:700, color:'rgba(255,255,255,0.9)', marginBottom:8 }}>
              {cfg.logo_url ? <img src={cfg.logo_url} alt="" style={{ height:28, opacity:.8 }} /> : cfg.brand_name}
            </div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.3)', maxWidth:260 }}>{footer.tagline}</div>
          </div>
          <div style={{ display:'flex', gap:48 }}>
            {(footer.cols || []).map((col: any, i: number) => (
              <div key={i}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', marginBottom:14 }}>{col.title}</div>
                {(col.links || []).map((l: string, j: number) => (
                  <div key={j} style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:8 }}><a href="#">{l}</a></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </footer>

      {selectedProduct && (
        <ProductModal
          sel={selectedProduct}
          imgs={imgs}
          accent={accent}
          workspaceId={cfg.workspace_id || ''}
          slug={page.slug}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// 2. MINIMAL ARCHITECT — Luxury restraint, Cormorant, near-white
// ══════════════════════════════════════════════════════════════
function MinimalArchitect({ cfg, page }: { cfg: any; page: Page }) {
  useScrollAnim([cfg])
  const accent = cfg.accent || '#9A7B3C'
  const rtl    = cfg.lang === 'ar'
  const dir    = rtl ? 'rtl' : 'ltr'
  const F      = { h: "'Cormorant Garamond', Georgia, serif", b: "'Inter', system-ui, sans-serif" }
  const P      = { bg:'#FAFAF8', bg2:'#F2F0EC', bg3:'#E8E4DE', ink:'#0A0907', ink2:'rgba(10,9,7,0.45)', ink3:'rgba(10,9,7,0.22)', ink4:'rgba(10,9,7,0.10)', dark:'#0A0907' }
  const hero   = cfg.hero      || {}
  const strip  = cfg.strip     || {}
  const prods  = cfg.products  || {}
  const phil   = cfg.philosophy || {}
  const pqd    = cfg.pull_quote || {}
  const story  = cfg.story     || {}
  const revs   = cfg.reviews   || {}
  const form   = cfg.form      || {}
  const footer = cfg.footer    || {}
  const nav    = cfg.nav       || {}
  const imgs   = cfg.product_images || []
  const form_  = useFormSubmit(cfg.workspace_id, page.slug)
  const [navBg, setNavBg] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null)
  useEffect(() => {
    const fn = () => setNavBg(window.scrollY > 60)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  const ROMAN = ['I.','II.','III.','IV.','V.','VI.']

  return (
    <div dir={dir} style={{ background: P.bg, color: P.ink, fontFamily: F.b, minHeight:'100vh', overflowX:'hidden' }}>

      {/* NAV */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, padding:'20px 48px', display:'flex', alignItems:'center', justifyContent:'space-between', background: navBg ? 'rgba(250,250,248,0.96)' : 'transparent', backdropFilter: navBg ? 'blur(16px)' : 'none', borderBottom: navBg ? `1px solid ${P.ink4}` : 'none', transition:'all .4s' }}>
        <div style={{ fontSize:11, fontWeight:400, letterSpacing:'0.22em', textTransform:'uppercase', color: P.ink }}>{cfg.brand_name}</div>
        <div style={{ display:'flex', gap:36, alignItems:'center' }}>
          {(nav.links || []).map((l: string, i: number) => (
            <a key={i} href={`#${l.toLowerCase().replace(/\s/g,'-')}`} style={{ fontSize:10, fontWeight:300, letterSpacing:'0.14em', textTransform:'uppercase', color: P.ink2 }}>{l}</a>
          ))}
          {nav.cta_label && <a href="#form" style={{ fontSize:10, fontWeight:400, letterSpacing:'0.14em', textTransform:'uppercase', color: accent, borderBottom:`1px solid ${accent}`, paddingBottom:1 }}>{nav.cta_label}</a>}
        </div>
      </nav>

      {/* HERO — 50/50 split */}
      <section style={{ minHeight:'100vh', display:'grid', gridTemplateColumns:'1fr 1fr', position:'relative' }}>
        {/* Grid lines */}
        <div style={{ position:'absolute', top:'50%', left:0, right:0, height:1, background: P.ink4, pointerEvents:'none' }} />
        <div style={{ position:'absolute', left:'50%', top:0, bottom:0, width:1, background: P.ink4, pointerEvents:'none' }} />

        {/* Left: text */}
        <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', padding:'120px 48px 60px' }}>
          {hero.eyebrow && <div data-animate style={{ fontSize:9, fontWeight:400, letterSpacing:'0.22em', textTransform:'uppercase', color: P.ink3, marginBottom:32 }}>{hero.eyebrow}</div>}
          <h1 data-animate data-animate-d1 style={{ fontFamily: F.h, fontSize:'clamp(36px,5vw,72px)', fontWeight:300, lineHeight:1.05, letterSpacing:'-0.02em', marginBottom:28 }}>
            {hero.headline_line1}<br /><em style={{ color: accent }}>{hero.headline_italic || hero.headline_line2}</em>
          </h1>
          <p data-animate data-animate-d2 style={{ fontSize:14, fontWeight:300, color: P.ink2, lineHeight:1.8, maxWidth:380, marginBottom:40 }}>{hero.body}</p>
          <div data-animate data-animate-d3 style={{ display:'flex', gap:20 }}>
            {hero.cta_primary && (
              <a href="#form" style={{ padding:'11px 28px', background: P.ink, color: P.bg, fontSize:10, fontWeight:400, letterSpacing:'0.14em', textTransform:'uppercase', display:'inline-block' }}>{hero.cta_primary}</a>
            )}
            {hero.cta_secondary && (
              <a href="#products" style={{ padding:'11px 28px', border:`1px solid ${P.ink3}`, color: P.ink2, fontSize:10, fontWeight:400, letterSpacing:'0.14em', textTransform:'uppercase', display:'inline-block' }}>{hero.cta_secondary}</a>
            )}
          </div>
        </div>

        {/* Right: product image grid */}
        <div style={{ background: P.bg2, display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background2: P.ink4 } as any}>
          {[imgs[0], imgs[1], imgs[2], imgs[3]].map((img, i) => (
            <div key={i} style={{ background: P.bg, aspectRatio:'1', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {img ? <Img src={img} /> : <div style={{ fontSize:10, letterSpacing:'0.1em', color: P.ink3 }}>{ROMAN[i]}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* STRIP */}
      {(strip.items || []).length > 0 && (
        <div style={{ padding:'18px 48px', borderTop:`1px solid ${P.ink4}`, borderBottom:`1px solid ${P.ink4}`, display:'flex', alignItems:'center', justifyContent:'space-between', gap:24 }}>
          {(strip.items as string[]).map((item, i) => (
            <span key={i} style={{ fontSize:10, fontWeight:300, letterSpacing:'0.12em', textTransform:'uppercase', color: P.ink3 }}>
              {i > 0 && <span style={{ marginRight:24, color: P.ink4 }}>|</span>}
              {item}
            </span>
          ))}
        </div>
      )}

      {/* PRODUCTS — 1px gap grid, Roman numerals */}
      {(prods.items || []).length > 0 && (
        <section id="products" style={{ padding:'80px 0' }}>
          <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 48px', marginBottom:36 }}>
            <h2 data-animate style={{ fontFamily: F.h, fontSize:'clamp(28px,3vw,48px)', fontWeight:300, letterSpacing:'-0.02em' }}>
              {prods.headline} <em style={{ color: accent }}>{prods.headline_italic}</em>
            </h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min((prods.items as any[]).length, 4)},1fr)`, gap:1, background: P.ink4 }}>
            {(prods.items as any[]).map((item, i) => (
              <div key={i} data-animate onClick={() => setSelectedProduct({ item, itemIndex: i })} style={{ background: P.bg, padding:'40px 32px', cursor:'pointer' }}>
                <div style={{ fontSize:9, fontWeight:300, letterSpacing:'0.2em', textTransform:'uppercase', color: P.ink3, marginBottom:24 }}>{ROMAN[i]}</div>
                {imgs[i] && <div style={{ height:200, marginBottom:20, overflow:'hidden' }}><Img src={imgs[i]} /></div>}
                <h3 style={{ fontFamily: F.h, fontSize:22, fontWeight:400, color: P.ink, marginBottom:10 }}>{item.name}</h3>
                <p style={{ fontSize:12, fontWeight:300, color: P.ink2, lineHeight:1.7, marginBottom:12 }}>{item.desc}</p>
                {item.price && <div style={{ fontSize:13, fontWeight:400, color: accent }}>{item.price}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PHILOSOPHY */}
      {phil.headline && (
        <section id="philosophy" style={{ padding:'100px 48px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', left:48, top:'50%', transform:'translateY(-50%)', fontFamily: F.h, fontSize:200, fontWeight:300, color: P.ink, opacity:0.04, lineHeight:1, pointerEvents:'none' }}>{phil.number}</div>
          <div style={{ maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 2fr', gap:80 }}>
            <div data-animate>
              <div style={{ fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase', color: P.ink3, marginBottom:20 }}>{phil.label}</div>
              <div style={{ width:40, height:1, background: accent, marginBottom:20 }} />
            </div>
            <div data-animate data-animate-d1>
              <h2 style={{ fontFamily: F.h, fontSize:'clamp(24px,2.5vw,38px)', fontWeight:300, lineHeight:1.2, marginBottom:24 }}>
                {phil.headline} <em style={{ color: accent }}>{phil.headline_italic}</em>
              </h2>
              <p style={{ fontSize:14, fontWeight:300, color: P.ink2, lineHeight:1.8, marginBottom:40 }}>{phil.body}</p>
              <div style={{ display:'flex', flexDirection:'column', gap:20, borderTop:`1px solid ${P.ink4}`, paddingTop:32 }}>
                {(phil.principles || []).map((p: any, i: number) => (
                  <div key={i} style={{ display:'flex', gap:20 }}>
                    <span style={{ fontSize:11, fontFamily: F.h, fontStyle:'italic', color: accent, width:24, flexShrink:0 }}>{p.num}</span>
                    <div>
                      <div style={{ fontSize:12, fontWeight:500, color: P.ink, marginBottom:4 }}>{p.title}</div>
                      <div style={{ fontSize:12, fontWeight:300, color: P.ink2 }}>{p.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* PULL QUOTE — full bleed dark */}
      {pqd.quote && (
        <section style={{ background: P.dark, padding:'80px 48px' }}>
          <div data-animate style={{ maxWidth:700, margin:'0 auto', textAlign:'center' }}>
            <div style={{ width:1, height:48, background:'rgba(255,255,255,0.15)', margin:'0 auto 32px' }} />
            <p style={{ fontFamily: F.h, fontSize:'clamp(20px,2.5vw,32px)', fontWeight:300, fontStyle:'italic', color:'rgba(255,255,255,0.85)', lineHeight:1.5, marginBottom:28 }}>
              "{pqd.quote}"
            </p>
            <div style={{ fontSize:10, fontWeight:300, letterSpacing:'0.16em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)' }}>
              {pqd.author}{pqd.location && ` — ${pqd.location}`}
            </div>
            <div style={{ width:1, height:48, background:'rgba(255,255,255,0.15)', margin:'32px auto 0' }} />
          </div>
        </section>
      )}

      {/* STORY */}
      {story.headline && (
        <section id="story" style={{ padding:'100px 48px' }}>
          <div style={{ maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:80 }}>
            <div data-animate>
              {imgs[0] && <div style={{ aspectRatio:'3/4', overflow:'hidden' }}><Img src={imgs[0]} /></div>}
            </div>
            <div data-animate data-animate-d1 style={{ paddingTop:20 }}>
              <div style={{ fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase', color: P.ink3, marginBottom:24 }}>{story.tag}</div>
              <h2 style={{ fontFamily: F.h, fontSize:'clamp(24px,2.5vw,38px)', fontWeight:400, lineHeight:1.15, marginBottom:24 }}>
                {story.headline} <em style={{ color: accent }}>{story.headline_italic}</em>
              </h2>
              <p style={{ fontSize:14, fontWeight:300, color: P.ink2, lineHeight:1.8, marginBottom:36 }}>{story.body}</p>
              {(story.values || []).map((v: any, i: number) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'14px 0', borderBottom:`1px solid ${P.ink4}`, fontSize:12 }}>
                  <span style={{ fontWeight:500, color: P.ink, letterSpacing:'0.06em' }}>{v.title}</span>
                  <span style={{ fontWeight:300, color: P.ink2, maxWidth:'55%', textAlign:'right' }}>{v.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* REVIEWS — 3-col 1px gap, center bg2 */}
      {(revs.items || []).length > 0 && (
        <section id="reviews" style={{ padding:'80px 0', background: P.bg2 }}>
          <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 48px', marginBottom:36 }}>
            <h2 data-animate style={{ fontFamily: F.h, fontSize:'clamp(22px,2.5vw,36px)', fontWeight:400 }}>{revs.headline}</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, background: P.ink4 }}>
            {(revs.items as any[]).map((r, i) => (
              <div key={i} data-animate style={{ background: i===1 ? P.bg3 : P.bg, padding:'40px 36px' }}>
                <p style={{ fontFamily: F.h, fontSize:17, fontStyle:'italic', fontWeight:400, color: P.ink, lineHeight:1.55, marginBottom:20 }}>"{r.quote}"</p>
                <div style={{ fontSize:10, fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color: P.ink3 }}>{r.author}</div>
                <div style={{ fontSize:10, fontWeight:300, color: P.ink3, opacity:.6, marginTop:4 }}>{r.location}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FORM — 2-col split */}
      <section id="form" style={{ padding:'100px 0', borderTop:`1px solid ${P.ink4}` }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 48px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:80 }}>
          <div data-animate>
            <div style={{ fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase', color: P.ink3, marginBottom:24 }}>{form.tag}</div>
            <h2 style={{ fontFamily: F.h, fontSize:'clamp(24px,3vw,44px)', fontWeight:400, lineHeight:1.1, marginBottom:16 }}>
              {form.headline_line1}<br /><em style={{ color: accent }}>{form.headline_italic || form.headline_line2}</em>
            </h2>
            <p style={{ fontSize:13, fontWeight:300, color: P.ink2, lineHeight:1.8 }}>{form.body}</p>
          </div>
          <div data-animate data-animate-d1 style={{ paddingTop:48 }}>
            {form_.done ? (
              <p style={{ fontFamily: F.h, fontSize:20, fontStyle:'italic', color: accent }}>Thank you.</p>
            ) : (
              <form onSubmit={form_.submit} style={{ display:'flex', flexDirection:'column', gap:28 }}>
                <input type="text" value={form_.name} onChange={e => form_.setName(e.target.value)} placeholder="Name" style={{ background:'transparent', border:'none', borderBottom:`1px solid ${P.ink3}`, padding:'10px 0', fontSize:13, fontWeight:300, fontFamily: F.b, color: P.ink, outline:'none', width:'100%' }} />
                <input type="email" value={form_.email} onChange={e => form_.setEmail(e.target.value)} placeholder="Email" required style={{ background:'transparent', border:'none', borderBottom:`1px solid ${P.ink3}`, padding:'10px 0', fontSize:13, fontWeight:300, fontFamily: F.b, color: P.ink, outline:'none', width:'100%' }} />
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:8 }}>
                  <button type="submit" disabled={form_.busy} style={{ display:'flex', alignItems:'center', gap:10, background:'none', border:'none', cursor:'pointer', fontSize:11, fontWeight:400, letterSpacing:'0.1em', textTransform:'uppercase', color: P.ink, opacity: form_.busy ? 0.5 : 1 }}>
                    {form.cta || 'Submit'}
                    <div style={{ width:28, height:28, borderRadius:'50%', border:`1px solid ${P.ink}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>→</div>
                  </button>
                  {form.note && <span style={{ fontSize:10, fontWeight:300, color: P.ink3 }}>{form.note}</span>}
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding:'40px 48px', borderTop:`1px solid ${P.ink4}` }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:32 }}>
          <div>
            <div style={{ fontSize:10, fontWeight:400, letterSpacing:'0.22em', textTransform:'uppercase', color: P.ink, marginBottom:8 }}>{cfg.brand_name}</div>
            <div style={{ fontSize:11, fontWeight:300, color: P.ink3, maxWidth:240 }}>{footer.tagline}</div>
          </div>
          <div style={{ display:'flex', gap:40 }}>
            {(footer.cols || []).map((col: any, i: number) => (
              <div key={i}>
                <div style={{ fontSize:9, fontWeight:500, letterSpacing:'0.16em', textTransform:'uppercase', color: P.ink3, marginBottom:12 }}>{col.title}</div>
                {(col.links || []).map((l: string, j: number) => (
                  <div key={j} style={{ fontSize:11, fontWeight:300, color: P.ink3, marginBottom:7 }}><a href="#">{l}</a></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </footer>

      {selectedProduct && (
        <ProductModal
          sel={selectedProduct}
          imgs={imgs}
          accent={accent}
          workspaceId={cfg.workspace_id || ''}
          slug={page.slug}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// 3. BOLD EXPRESSIONIST — Bebas Neue, black/red, performance
// ══════════════════════════════════════════════════════════════
function BoldExpressionist({ cfg, page }: { cfg: any; page: Page }) {
  useScrollAnim([cfg])
  const accent = cfg.accent || '#E8200A'
  const dir    = cfg.lang === 'ar' ? 'rtl' : 'ltr'
  const F      = { h: "'Bebas Neue', Impact, sans-serif", b: "'Space Grotesk', system-ui, sans-serif" }
  const P      = { bg:'#080808', bg2:'#101010', bg3:'#181818', ink:'#F5F4F0', ink2:'rgba(245,244,240,0.65)', ink3:'rgba(245,244,240,0.25)', ink4:'rgba(245,244,240,0.08)', dark:'#040404' }
  const hero   = cfg.hero      || {}
  const mq     = cfg.marquee   || {}
  const prods  = cfg.products  || {}
  const stmt   = cfg.statement || {}
  const story  = cfg.story     || {}
  const revs   = cfg.reviews   || {}
  const form   = cfg.form      || {}
  const footer = cfg.footer    || {}
  const nav    = cfg.nav       || {}
  const imgs   = cfg.product_images || []
  const form_  = useFormSubmit(cfg.workspace_id, page.slug)
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null)

  return (
    <div dir={dir} style={{ background: P.bg, color: P.ink, fontFamily: F.b, minHeight:'100vh', overflowX:'hidden' }}>

      {/* NAV */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, padding:'16px 40px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(8,8,8,0.9)', backdropFilter:'blur(12px)', borderBottom:`1px solid ${P.ink4}` }}>
        <div style={{ fontFamily: F.h, fontSize:22, letterSpacing:'0.1em', color: P.ink }}>
          {cfg.logo_url ? <img src={cfg.logo_url} alt="" style={{ height:28 }} /> : cfg.brand_name?.toUpperCase()}
        </div>
        <div style={{ display:'flex', gap:28, alignItems:'center' }}>
          {(nav.links || []).map((l: string, i: number) => (
            <a key={i} href={`#${l.toLowerCase().replace(/\s/g,'-')}`} style={{ fontSize:11, fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', color: P.ink3 }}>{l}</a>
          ))}
          {nav.cta_label && <a href="#form" style={{ padding:'8px 20px', background: accent, color:'#fff', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' }}>{nav.cta_label}</a>}
        </div>
      </nav>

      {/* HERO — full viewport, Bebas huge type */}
      <section style={{ minHeight:'100vh', position:'relative', display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'0 40px 0', overflow:'hidden' }}>
        {imgs[0] && (
          <div style={{ position:'absolute', inset:0 }}>
            <Img src={imgs[0]} style={{ filter:'brightness(0.25)' }} />
            <div style={{ position:'absolute', inset:0, background:`linear-gradient(to top, ${P.bg} 0%, transparent 60%)` }} />
          </div>
        )}
        {!imgs[0] && (
          <div style={{ position:'absolute', right:-20, top:'10%', fontFamily: F.h, fontSize:'28vw', lineHeight:1, color: P.ink4, userSelect:'none', pointerEvents:'none' }}>
            {(cfg.brand_name || 'BRAND').toUpperCase()}
          </div>
        )}
        <div style={{ position:'relative', zIndex:1, paddingTop:120 }}>
          {hero.eyebrow && <div style={{ fontSize:11, fontWeight:500, letterSpacing:'0.14em', textTransform:'uppercase', color: accent, marginBottom:16 }}>{hero.eyebrow}</div>}
          <h1 style={{ fontFamily: F.h, fontSize:'clamp(60px,14vw,180px)', lineHeight:0.88, letterSpacing:'0.03em', textTransform:'uppercase', marginBottom:0 }}>
            <span style={{ display:'block', WebkitTextStroke:`1px ${P.ink}`, color:'transparent' }}>{hero.headline_line1}</span>
            <span style={{ display:'block', color: P.ink }}>{hero.headline_line2 || hero.headline_italic}</span>
          </h1>
        </div>

        {/* Stat bar */}
        {(hero.trust_items || stmt.stats || []).length > 0 && (
          <div style={{ position:'relative', zIndex:1, display:'grid', gridTemplateColumns:`repeat(${Math.min((hero.trust_items || stmt.stats || [] as any[]).length, 4)},1fr)`, gap:1, background: P.ink4, marginTop:40 }}>
            {((hero.trust_items || stmt.stats || []) as any[]).slice(0,4).map((s: any, i: number) => (
              <div key={i} style={{ background: P.bg2, padding:'16px 20px' }}>
                <div style={{ fontFamily: F.h, fontSize:28, letterSpacing:'0.04em', color: i===0 ? accent : P.ink, marginBottom:2 }}>
                  {typeof s === 'string' ? '—' : s.num}
                </div>
                <div style={{ fontSize:10, fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', color: P.ink3 }}>
                  {typeof s === 'string' ? s : s.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MARQUEE — red bg, fast */}
      {(mq.items || []).length > 0 && (
        <div style={{ background: accent, overflow:'hidden', padding:'12px 0' }}>
          <div style={{ display:'flex', animation:'marquee 12s linear infinite', width:'max-content' }}>
            {[...Array(4)].flatMap(() => (mq.items as string[]).map((item, i) => (
              <span key={`${item}-${i}`} style={{ fontFamily: F.h, fontSize:14, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.9)', whiteSpace:'nowrap', paddingRight:48 }}>
                {item} <span style={{ opacity:.5, paddingRight:48 }}>/</span>
              </span>
            )))}
          </div>
        </div>
      )}

      {/* PRODUCTS — vertical border grid */}
      {(prods.items || []).length > 0 && (
        <section id="products" style={{ padding:'80px 0' }}>
          <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 40px', marginBottom:36 }}>
            <h2 data-animate style={{ fontFamily: F.h, fontSize:'clamp(36px,5vw,72px)', letterSpacing:'0.03em', textTransform:'uppercase' }}>
              {prods.headline}
            </h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min((prods.items as any[]).length, 3)},1fr)`, borderTop:`1px solid ${P.ink4}` }}>
            {(prods.items as any[]).map((item, i) => (
              <div key={i} data-animate onClick={() => setSelectedProduct({ item, itemIndex: i })} style={{
                background: item.featured ? P.bg3 : 'transparent',
                borderRight:`1px solid ${P.ink4}`, borderBottom:`1px solid ${P.ink4}`,
                padding:'40px 32px', position:'relative', cursor:'pointer'
              }}>
                {item.featured && <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background: accent }} />}
                {imgs[i] && <div style={{ height:220, marginBottom:24, overflow:'hidden' }}><Img src={imgs[i]} style={{ filter:'brightness(0.85)' }} /></div>}
                <div style={{ fontSize:10, fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color: P.ink3, marginBottom:12 }}>{item.num}</div>
                <h3 style={{ fontFamily: F.h, fontSize:28, letterSpacing:'0.04em', textTransform:'uppercase', color: P.ink, marginBottom:10 }}>{item.name}</h3>
                <p style={{ fontSize:13, color: P.ink2, lineHeight:1.6, marginBottom:16 }}>{item.desc}</p>
                {item.price && <div style={{ fontFamily: F.h, fontSize:22, color: item.featured ? accent : P.ink3, letterSpacing:'0.04em' }}>{item.price}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* STATEMENT — ghost brand name behind */}
      {stmt.left_headline && (
        <section id="statement" style={{ padding:'100px 40px', position:'relative', overflow:'hidden', background: P.bg2 }}>
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily: F.h, fontSize:'20vw', letterSpacing:'0.1em', textTransform:'uppercase', WebkitTextStroke:`1px ${P.ink4}`, color:'transparent', pointerEvents:'none', userSelect:'none' }}>
            {cfg.brand_name}
          </div>
          <div style={{ maxWidth:1100, margin:'0 auto', position:'relative', zIndex:1 }}>
            <h2 data-animate style={{ fontFamily: F.h, fontSize:'clamp(42px,7vw,100px)', letterSpacing:'0.03em', textTransform:'uppercase', lineHeight:0.9, marginBottom:32 }}>
              <span style={{ WebkitTextStroke:`2px ${P.ink}`, color:'transparent' }}>{stmt.left_headline}</span><br />
              <span style={{ color: accent }}>{stmt.left_italic}</span>
            </h2>
            <p data-animate data-animate-d1 style={{ fontSize:15, color: P.ink2, lineHeight:1.7, maxWidth:560 }}>{stmt.body}</p>
          </div>
        </section>
      )}

      {/* STORY */}
      {story.headline && (
        <section id="story" style={{ padding:'80px 0', display:'grid', gridTemplateColumns:'1fr 1fr' }}>
          <div style={{ background: P.bg3, position:'relative', overflow:'hidden', minHeight:400 }}>
            {imgs[0] && <Img src={imgs[0]} style={{ filter:'brightness(0.4)' }} />}
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily: F.h, fontSize:'8vw', letterSpacing:'0.1em', textTransform:'uppercase', WebkitTextStroke:`1px ${P.ink4}`, color:'transparent' }}>
              {story.tag?.toUpperCase()}
            </div>
          </div>
          <div data-animate style={{ padding:'60px 48px', background: P.bg2 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color: accent, marginBottom:16 }}>{story.tag}</div>
            <h2 style={{ fontFamily: F.h, fontSize:'clamp(28px,3.5vw,52px)', letterSpacing:'0.03em', textTransform:'uppercase', lineHeight:1, marginBottom:20 }}>{story.headline}</h2>
            <p style={{ fontSize:14, color: P.ink2, lineHeight:1.7, marginBottom:28 }}>{story.body}</p>
            {(story.values || []).map((v: any, i: number) => (
              <div key={i} style={{ display:'flex', gap:16, padding:'12px 0', borderBottom:`1px solid ${P.ink4}` }}>
                <div style={{ width:3, height:'100%', background: i===0?accent:P.ink4, flexShrink:0 }} />
                <div>
                  <div style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color: P.ink, marginBottom:3 }}>{v.title}</div>
                  <div style={{ fontSize:12, color: P.ink2 }}>{v.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* REVIEWS — 3-col 1px gap */}
      {(revs.items || []).length > 0 && (
        <section id="reviews" style={{ padding:'80px 0', background: P.bg }}>
          <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 40px', marginBottom:36 }}>
            <h2 data-animate style={{ fontFamily: F.h, fontSize:'clamp(32px,4vw,64px)', letterSpacing:'0.03em', textTransform:'uppercase' }}>{revs.headline}</h2>
            <div style={{ fontSize:11, color: P.ink3, marginTop:4 }}>{revs.score} — {revs.count}</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, background: P.ink4, maxWidth:1100, margin:'0 auto' }}>
            {(revs.items as any[]).map((r, i) => (
              <div key={i} data-animate style={{ background: i===1 ? P.bg2 : P.bg3, padding:'36px 28px' }}>
                <p style={{ fontSize:14, color: P.ink2, lineHeight:1.65, marginBottom:20, fontStyle:'italic' }}>"{r.quote}"</p>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color: i===1?accent:P.ink3 }}>{r.author}</div>
                <div style={{ fontSize:10, color: P.ink3, opacity:.6, marginTop:4 }}>{r.location}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FORM — red left / dark right split */}
      <section id="form" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', minHeight:400 }}>
        <div style={{ background: accent, padding:'80px 48px', display:'flex', flexDirection:'column', justifyContent:'center' }}>
          <div data-animate>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(255,255,255,0.6)', marginBottom:20 }}>{form.tag}</div>
            <h2 style={{ fontFamily: F.h, fontSize:'clamp(32px,4vw,64px)', letterSpacing:'0.03em', textTransform:'uppercase', color:'#fff', lineHeight:0.95, marginBottom:12 }}>
              {form.headline_line1}<br />{form.headline_line2}
            </h2>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.7)', lineHeight:1.7 }}>{form.body}</p>
          </div>
        </div>
        <div style={{ background: P.bg2, padding:'80px 48px', display:'flex', flexDirection:'column', justifyContent:'center' }}>
          <div data-animate>
            {form_.done ? (
              <div style={{ fontFamily: F.h, fontSize:32, letterSpacing:'0.06em', textTransform:'uppercase', color: accent }}>Done.</div>
            ) : (
              <form onSubmit={form_.submit} style={{ display:'flex', flexDirection:'column', gap:28 }}>
                <input type="text" value={form_.name} onChange={e => form_.setName(e.target.value)} placeholder="YOUR NAME" style={{ background:'transparent', border:'none', borderBottom:`1px solid ${P.ink4}`, padding:'12px 0', color: P.ink, fontSize:12, fontWeight:500, letterSpacing:'0.06em', textTransform:'uppercase', outline:'none', fontFamily: F.b, width:'100%' }} />
                <input type="email" value={form_.email} onChange={e => form_.setEmail(e.target.value)} placeholder="YOUR EMAIL" required style={{ background:'transparent', border:'none', borderBottom:`1px solid ${P.ink4}`, padding:'12px 0', color: P.ink, fontSize:12, fontWeight:500, letterSpacing:'0.06em', textTransform:'uppercase', outline:'none', fontFamily: F.b, width:'100%' }} />
                <button type="submit" disabled={form_.busy} style={{ background: accent, color:'#fff', border:'none', padding:'16px', fontFamily: F.h, fontSize:20, letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer', opacity: form_.busy ? 0.6 : 1, marginTop:8 }}>
                  {form_.busy ? '...' : (form.cta || 'Submit')}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {selectedProduct && (
        <ProductModal
          sel={selectedProduct}
          imgs={imgs}
          accent={accent}
          workspaceId={cfg.workspace_id || ''}
          slug={page.slug}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* FOOTER — giant Bebas wordmark */}
      <footer style={{ background: P.dark, borderTop:`1px solid ${P.ink4}`, paddingTop:48 }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 40px' }}>
          <div style={{ fontFamily: F.h, fontSize:'clamp(48px,8vw,100px)', letterSpacing:'0.06em', textTransform:'uppercase', lineHeight:1, marginBottom:32 }}>
            {(cfg.brand_name || 'BRAND').split('').map((ch: string, i: number, arr: string[]) => (
              <span key={i} style={{ color: i === arr.length - 1 ? accent : P.ink }}>{ch}</span>
            ))}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', paddingBottom:32, borderTop:`1px solid ${P.ink4}`, paddingTop:24, flexWrap:'wrap', gap:24 }}>
            <div style={{ fontSize:12, color: P.ink3, maxWidth:300 }}>{footer.tagline}</div>
            <div style={{ display:'flex', gap:40 }}>
              {(footer.cols || []).map((col: any, i: number) => (
                <div key={i}>
                  <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color: P.ink3, marginBottom:12 }}>{col.title}</div>
                  {(col.links || []).map((l: string, j: number) => (
                    <div key={j} style={{ fontSize:11, color: P.ink3, marginBottom:8 }}><a href="#">{l}</a></div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// 4. WARM STORYTELLER — Lora, sand palette, founder present
// ══════════════════════════════════════════════════════════════
function WarmStoryteller({ cfg, page }: { cfg: any; page: Page }) {
  useScrollAnim([cfg])
  const accent = cfg.accent || '#8C5E1A'
  const dir    = cfg.lang === 'ar' ? 'rtl' : 'ltr'
  const F      = { h: "'Lora', Georgia, serif", b: "'Jost', system-ui, sans-serif" }
  const P      = { bg:'#F5EFE2', bg2:'#EDE4D0', bg3:'#E0D4BB', ink:'#2C1F0E', ink2:'rgba(44,31,14,0.55)', ink3:'rgba(44,31,14,0.28)', ink4:'rgba(44,31,14,0.10)', dark:'#2C1F0E' }
  const hero   = cfg.hero          || {}
  const band   = cfg.band          || {}
  const intro  = cfg.intro         || {}
  const prods  = cfg.products      || {}
  const fn_    = cfg.founder_note  || {}
  const ingr   = cfg.ingredients   || {}
  const revs   = cfg.reviews       || {}
  const form   = cfg.form          || {}
  const footer = cfg.footer        || {}
  const nav    = cfg.nav           || {}
  const imgs   = cfg.product_images || []
  const form_  = useFormSubmit(cfg.workspace_id, page.slug)
  const [navBg, setNavBg] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null)
  useEffect(() => {
    const fn2 = () => setNavBg(window.scrollY > 60)
    window.addEventListener('scroll', fn2, { passive: true })
    return () => window.removeEventListener('scroll', fn2)
  }, [])

  const BAND_ICONS: Record<string,string> = {
    leaf:   '🌿', home:'🏡', shield:'🛡️', clock:'⏱️', heart:'❤️', star:'⭐'
  }

  return (
    <div dir={dir} style={{ background: P.bg, color: P.ink, fontFamily: F.b, minHeight:'100vh', overflowX:'hidden' }}>

      {/* NAV */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, padding:'18px 40px', display:'flex', alignItems:'center', justifyContent:'space-between', background: navBg ? 'rgba(245,239,226,0.96)' : 'transparent', backdropFilter: navBg ? 'blur(12px)' : 'none', borderBottom: navBg ? `1px solid ${P.ink4}` : 'none', transition:'all .3s' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* Circular mark */}
          <div style={{ width:32, height:32, borderRadius:'50%', border:`1.5px solid ${accent}40`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:14 }}>🌿</span>
          </div>
          <span style={{ fontFamily: F.h, fontSize:16, fontWeight:500, fontStyle:'italic', letterSpacing:'-0.01em' }}>
            {cfg.logo_url ? <img src={cfg.logo_url} alt="" style={{ height:28 }} /> : cfg.brand_name}
          </span>
        </div>
        <div style={{ display:'flex', gap:28, alignItems:'center' }}>
          {(nav.links || []).map((l: string, i: number) => (
            <a key={i} href={`#${l.toLowerCase().replace(/\s/g,'-')}`} style={{ fontSize:12, fontWeight:400, color: P.ink2, letterSpacing:'0.02em' }}>{l}</a>
          ))}
          {nav.cta_label && <a href="#form" style={{ padding:'8px 22px', background: accent, color:'#fff', fontSize:12, fontWeight:600, borderRadius:2 }}>{nav.cta_label}</a>}
        </div>
      </nav>

      {/* HERO — 5/4 split, stacked product visuals */}
      <section style={{ minHeight:'100vh', display:'grid', gridTemplateColumns:'5fr 4fr', paddingTop:80, overflow:'hidden' }}>
        <div style={{ padding:'60px 40px 60px 48px', display:'flex', flexDirection:'column', justifyContent:'center' }}>
          {/* Pulsing season dot */}
          <div data-animate style={{ display:'flex', alignItems:'center', gap:8, marginBottom:28 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background: accent, animation:'pulse 2.2s ease-in-out infinite' }} />
            <span style={{ fontSize:11, fontWeight:400, letterSpacing:'0.06em', textTransform:'uppercase', color: P.ink2 }}>{hero.eyebrow || 'Seasonal Collection'}</span>
          </div>
          <h1 data-animate data-animate-d1 style={{ fontFamily: F.h, fontSize:'clamp(36px,5.5vw,72px)', fontWeight:600, lineHeight:1.1, letterSpacing:'-0.02em', marginBottom:24 }}>
            {hero.headline_line1}
            {(hero.headline_line2 || hero.headline_italic) && (
              <><br /><em style={{ color: accent, fontStyle:'italic' }}>{hero.headline_italic || hero.headline_line2}</em></>
            )}
          </h1>
          <p data-animate data-animate-d2 style={{ fontSize:'clamp(14px,1.3vw,17px)', color: P.ink2, lineHeight:1.75, maxWidth:440, marginBottom:36 }}>{hero.body}</p>
          <div data-animate data-animate-d3 style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
            {hero.cta_primary && (
              <a href="#products" style={{ display:'inline-flex', alignItems:'center', padding:'13px 30px', background: accent, color:'#fff', fontSize:13, fontWeight:600, borderRadius:2, letterSpacing:'0.02em' }}>{hero.cta_primary}</a>
            )}
            {hero.cta_secondary && (
              <a href="#story" style={{ display:'inline-flex', alignItems:'center', padding:'13px 30px', border:`1.5px solid ${P.ink4}`, color: P.ink, fontSize:13, fontWeight:500 }}>{hero.cta_secondary}</a>
            )}
          </div>
          {(hero.trust_items || []).length > 0 && (
            <div data-animate style={{ display:'flex', gap:20, marginTop:36, flexWrap:'wrap' }}>
              {(hero.trust_items as string[]).map((t, i) => (
                <span key={i} style={{ fontSize:11, color: P.ink3 }}>✓ {t}</span>
              ))}
            </div>
          )}
        </div>

        {/* Stacked product jars/visuals */}
        <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center', background: P.bg2 }}>
          {imgs.slice(0,3).map((src: string, i: number) => (
            <div key={i} style={{
              position:'absolute',
              width:'52%', aspectRatio:'3/4',
              overflow:'hidden', borderRadius:2,
              transform: `rotate(${[-4,0,4][i]}deg) translateY(${[-20,0,20][i]}px)`,
              boxShadow:'0 12px 48px rgba(44,31,14,0.15)',
              zIndex: i === 1 ? 3 : i === 0 ? 2 : 1,
            }}>
              <Img src={src} />
            </div>
          ))}
          {imgs.length === 0 && (
            <div style={{ width:'55%', aspectRatio:'3/4', background: P.bg3, borderRadius:2, display:'flex', alignItems:'center', justifyContent:'center', fontSize:40 }}>🫙</div>
          )}
        </div>
      </section>

      {/* BAND — dark bg with icons */}
      {(band.items || []).length > 0 && (
        <div style={{ background: P.dark, padding:'32px 40px' }}>
          <div style={{ maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns:`repeat(${(band.items as any[]).length},1fr)`, gap:0 }}>
            {(band.items as any[]).map((item, i) => (
              <div key={i} style={{ padding:'20px 24px', borderRight: i < (band.items as any[]).length-1 ? '1px solid rgba(255,255,255,0.08)' : 'none', display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:20 }}>{BAND_ICONS[item.icon] || '✦'}</span>
                <span style={{ fontSize:12, fontWeight:400, color:'rgba(255,255,255,0.65)', lineHeight:1.4 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INTRO — 2-col, feature cards */}
      {intro.headline && (
        <section id="story" style={{ padding:'80px 40px' }}>
          <div style={{ maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:60 }}>
            <div data-animate>
              <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color: accent, marginBottom:20 }}>{intro.tag}</div>
              <h2 style={{ fontFamily: F.h, fontSize:'clamp(26px,3vw,42px)', fontWeight:600, lineHeight:1.2, marginBottom:20 }}>
                {intro.headline} <em style={{ color: accent }}>{intro.headline_italic}</em>
              </h2>
              <p style={{ fontSize:15, color: P.ink2, lineHeight:1.75 }}>{intro.body}</p>
            </div>
            <div data-animate data-animate-d1 style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {(intro.features || []).map((f: any, i: number) => (
                <div key={i} style={{ background: P.bg2, padding:'20px 22px', borderRadius:2, border:`1px solid ${P.ink4}` }}>
                  <div style={{ fontSize:13, fontWeight:600, color: P.ink, marginBottom:4 }}>{f.title}</div>
                  <div style={{ fontSize:12, color: P.ink2, lineHeight:1.55 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PRODUCTS — rounded cards */}
      {(prods.items || []).length > 0 && (
        <section id="products" style={{ padding:'80px 40px', background: P.bg2 }}>
          <div style={{ maxWidth:1100, margin:'0 auto' }}>
            <h2 data-animate style={{ fontFamily: F.h, fontSize:'clamp(24px,3vw,40px)', fontWeight:600, marginBottom:40, letterSpacing:'-0.02em' }}>
              {prods.headline} <em style={{ color: accent }}>{prods.headline_italic}</em>
            </h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:20 }}>
              {(prods.items as any[]).map((item, i) => (
                <div key={i} data-animate onClick={() => setSelectedProduct({ item, itemIndex: i })} style={{ background: item.featured ? P.dark : '#fff', borderRadius:4, overflow:'hidden', border:`1px solid ${P.ink4}`, boxShadow:'0 2px 12px rgba(44,31,14,0.06)', cursor:'pointer' }}>
                  {imgs[i] && <div style={{ height:200, overflow:'hidden' }}><Img src={imgs[i]} /></div>}
                  <div style={{ padding:'22px 20px' }}>
                    {item.badge && <div style={{ display:'inline-block', fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', padding:'2px 8px', background:`${accent}20`, color: accent, borderRadius:2, marginBottom:10 }}>{item.badge}</div>}
                    <h3 style={{ fontFamily: F.h, fontSize:18, fontWeight:600, color: item.featured ? '#fff' : P.ink, marginBottom:8 }}>{item.name}</h3>
                    <p style={{ fontSize:12, color: item.featured ? 'rgba(255,255,255,0.55)' : P.ink2, lineHeight:1.6, marginBottom:14 }}>{item.desc}</p>
                    {item.price && <div style={{ fontSize:15, fontWeight:600, color: accent }}>{item.price}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FOUNDER NOTE — parchment card with wax seal */}
      {fn_.text && (
        <section style={{ padding:'80px 40px' }}>
          <div data-animate style={{ maxWidth:680, margin:'0 auto', background:'#FBF5E6', border:`1px solid ${P.ink4}`, borderRadius:4, padding:'48px 44px', position:'relative', boxShadow:'0 8px 40px rgba(44,31,14,0.08)' }}>
            {/* Wax seal */}
            <div style={{ position:'absolute', top:-20, right:36, width:44, height:44, borderRadius:'50%', background: accent, border:`3px solid #FBF5E6`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(140,94,26,0.3)' }}>
              <span style={{ fontSize:16 }}>🌿</span>
            </div>
            <p style={{ fontFamily: F.h, fontSize:16, fontStyle:'italic', lineHeight:1.85, color: P.ink, marginBottom:28 }}>{fn_.text}</p>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:32, height:1, background: P.ink4 }} />
              <div>
                <div style={{ fontSize:13, fontWeight:600, color: P.ink }}>{fn_.name}</div>
                <div style={{ fontSize:11, color: P.ink2 }}>{fn_.role}</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* INGREDIENTS — 4-col grid */}
      {(ingr.items || []).length > 0 && (
        <section style={{ padding:'80px 40px', background: P.bg2 }}>
          <div style={{ maxWidth:1100, margin:'0 auto' }}>
            <div data-animate style={{ marginBottom:40 }}>
              <h2 style={{ fontFamily: F.h, fontSize:'clamp(24px,3vw,40px)', fontWeight:600, marginBottom:10 }}>
                {ingr.headline} <em style={{ color: accent }}>{ingr.headline_italic}</em>
              </h2>
              <p style={{ fontSize:14, color: P.ink2, lineHeight:1.7, maxWidth:500 }}>{ingr.desc}</p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
              {(ingr.items as any[]).map((item, i) => (
                <div key={i} data-animate style={{ background: P.bg, padding:'24px 20px', borderRadius:4, border:`1px solid ${P.ink4}` }}>
                  <div style={{ fontSize:22, marginBottom:12 }}>🌿</div>
                  <div style={{ fontSize:13, fontWeight:600, color: P.ink, marginBottom:8 }}>{item.name}</div>
                  <div style={{ fontSize:12, color: P.ink2, lineHeight:1.6, marginBottom:10 }}>{item.desc}</div>
                  <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.04em', textTransform:'uppercase', color: accent }}>{item.source}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* REVIEWS — 3-col, center dark */}
      {(revs.items || []).length > 0 && (
        <section id="reviews" style={{ padding:'80px 40px' }}>
          <div style={{ maxWidth:1100, margin:'0 auto' }}>
            <div data-animate style={{ marginBottom:36 }}>
              <h2 style={{ fontFamily: F.h, fontSize:'clamp(22px,2.5vw,36px)', fontWeight:600 }}>{revs.headline}</h2>
              <div style={{ fontSize:12, color: P.ink3, marginTop:6 }}>{revs.score} · {revs.count}</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
              {(revs.items as any[]).map((r, i) => (
                <div key={i} data-animate style={{ background: i===1 ? P.dark : P.bg2, padding:'32px 28px', borderRadius:4, border:`1px solid ${i===1?'transparent':P.ink4}` }}>
                  <p style={{ fontFamily: F.h, fontSize:15, fontStyle:'italic', lineHeight:1.65, color: i===1?'rgba(255,255,255,0.85)':P.ink, marginBottom:18 }}>"{r.quote}"</p>
                  <div style={{ fontSize:12, fontWeight:600, color: i===1?'rgba(255,255,255,0.6)':P.ink3 }}>{r.author}</div>
                  <div style={{ fontSize:11, color: i===1?'rgba(255,255,255,0.35)':P.ink3, opacity:.7, marginTop:3 }}>{r.location}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FORM — 2-col split */}
      <section id="form" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', minHeight:400 }}>
        <div style={{ background: P.dark, padding:'80px 48px', display:'flex', flexDirection:'column', justifyContent:'center' }}>
          <div data-animate>
            <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color: `${accent}`, marginBottom:20 }}>{form.tag}</div>
            <h2 style={{ fontFamily: F.h, fontSize:'clamp(28px,3vw,46px)', fontWeight:600, color:'rgba(255,255,255,0.9)', lineHeight:1.1, marginBottom:12 }}>
              {form.headline_line1}<br /><em style={{ color: accent }}>{form.headline_italic || form.headline_line2}</em>
            </h2>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)', lineHeight:1.7 }}>{form.body}</p>
          </div>
        </div>
        <div style={{ background: P.bg, padding:'80px 48px', display:'flex', flexDirection:'column', justifyContent:'center' }}>
          <div data-animate>
            {form_.done ? (
              <p style={{ fontFamily: F.h, fontSize:18, fontStyle:'italic', color: accent }}>Thank you. We'll be in touch soon.</p>
            ) : (
              <form onSubmit={form_.submit} style={{ display:'flex', flexDirection:'column', gap:24 }}>
                <input type="text" value={form_.name} onChange={e => form_.setName(e.target.value)} placeholder="Your name" style={{ background:'transparent', border:'none', borderBottom:`1px solid ${P.ink4}`, padding:'11px 0', color: P.ink, fontSize:14, fontFamily: F.b, outline:'none', width:'100%' }} />
                <input type="email" value={form_.email} onChange={e => form_.setEmail(e.target.value)} placeholder="Email address" required style={{ background:'transparent', border:'none', borderBottom:`1px solid ${P.ink4}`, padding:'11px 0', color: P.ink, fontSize:14, fontFamily: F.b, outline:'none', width:'100%' }} />
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
                  <button type="submit" disabled={form_.busy} style={{ padding:'13px 28px', background: accent, color:'#fff', border:'none', fontSize:13, fontWeight:600, borderRadius:2, cursor:'pointer', opacity: form_.busy?0.6:1 }}>
                    {form_.busy ? '...' : (form.cta || 'Submit')}
                  </button>
                  {form.note && <span style={{ fontSize:11, color: P.ink3 }}>{form.note}</span>}
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: P.bg2, borderTop:`1px solid ${P.ink4}`, padding:'40px 40px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:32 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ width:26, height:26, borderRadius:'50%', border:`1.5px solid ${accent}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>🌿</div>
              <span style={{ fontFamily: F.h, fontSize:16, fontStyle:'italic', fontWeight:500 }}>{cfg.brand_name}</span>
            </div>
            <div style={{ fontSize:12, color: P.ink2, maxWidth:240, lineHeight:1.6 }}>{footer.tagline}</div>
          </div>
          <div style={{ display:'flex', gap:40 }}>
            {(footer.cols || []).map((col: any, i: number) => (
              <div key={i}>
                <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color: P.ink3, marginBottom:12 }}>{col.title}</div>
                {(col.links || []).map((l: string, j: number) => (
                  <div key={j} style={{ fontSize:12, color: P.ink2, marginBottom:8 }}><a href="#">{l}</a></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </footer>

      {selectedProduct && (
        <ProductModal
          sel={selectedProduct}
          imgs={imgs}
          accent={accent}
          workspaceId={cfg.workspace_id || ''}
          slug={page.slug}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  )
}
