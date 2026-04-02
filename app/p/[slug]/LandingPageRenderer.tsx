'use client'

import { useEffect, useRef, useState } from 'react'
import type { LandingPageConfig, LandingSection } from '@/lib/landing-templates'

// ── Themes ────────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg: '#0C0C0C', surface: '#141414', elevated: '#1C1C1C',
    border: 'rgba(255,255,255,0.10)', border2: 'rgba(255,255,255,0.06)',
    text1: '#FFFFFF', text2: 'rgba(255,255,255,0.72)', text3: 'rgba(255,255,255,0.40)',
    isLight: false,
  },
  light: {
    bg: '#F5F5F5', surface: '#FFFFFF', elevated: '#F0F0F0',
    border: 'rgba(0,0,0,0.10)', border2: 'rgba(0,0,0,0.06)',
    text1: '#0C0C0C', text2: 'rgba(0,0,0,0.65)', text3: 'rgba(0,0,0,0.40)',
    isLight: true,
  },
  warm: {
    bg: '#FDF8F0', surface: '#FFFFFF', elevated: '#F5EDD8',
    border: 'rgba(0,0,0,0.08)', border2: 'rgba(0,0,0,0.05)',
    text1: '#1a1208', text2: 'rgba(26,18,8,0.65)', text3: 'rgba(26,18,8,0.40)',
    isLight: true,
  },
  midnight: {
    bg: '#070B14', surface: '#0E1420', elevated: '#141E2E',
    border: 'rgba(100,160,255,0.12)', border2: 'rgba(100,160,255,0.07)',
    text1: '#E8F0FF', text2: 'rgba(200,220,255,0.65)', text3: 'rgba(160,190,255,0.38)',
    isLight: false,
  },
}

const FONT_FAMILIES: Record<string, string> = {
  geist: "'Geist', -apple-system, BlinkMacSystemFont, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  dm:    "'DM Sans', system-ui, sans-serif",
  inter: "'Inter', system-ui, sans-serif",
}

interface Props {
  config:      LandingPageConfig
  workspaceId: string
  brandName:   string
  preview?:    boolean // compact preview mode for dashboard
}

export default function LandingPageRenderer({ config, workspaceId, brandName, preview = false }: Props) {
  const t      = THEMES[config.theme as keyof typeof THEMES] || THEMES.dark
  const font   = FONT_FAMILIES[config.font] || FONT_FAMILIES.geist
  const accent = config.accent || '#00AAFF'
  const dir    = config.rtl ? 'rtl' : 'ltr'
  const [navVisible, setNavVisible] = useState(false)
  const [formState, setFormState] = useState<Record<string, Record<string, string>>>({})
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})
  const observerRef = useRef<IntersectionObserver | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fixed nav appearance on scroll
  useEffect(() => {
    if (preview) return
    const onScroll = () => setNavVisible(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [preview])

  // Scroll-triggered animations
  useEffect(() => {
    if (preview) return
    observerRef.current = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('lp-visible'); observerRef.current?.unobserve(e.target) } }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    const els = containerRef.current?.querySelectorAll('.lp-fade')
    els?.forEach(el => observerRef.current?.observe(el))
    return () => observerRef.current?.disconnect()
  }, [config.sections, preview])

  // ── Form submission ───────────────────────────────────────────
  async function handleFormSubmit(sectionId: string, section: LandingSection) {
    if (submitting[sectionId]) return
    const values = formState[sectionId] || {}
    const fields = section.content.fields || []
    // Validate required
    for (const f of fields) {
      if (f.required && !values[f.id]) {
        alert('Please fill all required fields')
        return
      }
    }
    setSubmitting(s => ({ ...s, [sectionId]: true }))
    try {
      await fetch('/api/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          form_values:  values,
          fields,
          source:       'landing_page',
        }),
      })
      setSubmitted(s => ({ ...s, [sectionId]: true }))
    } catch {}
    setSubmitting(s => ({ ...s, [sectionId]: false }))
  }

  // ── Section helpers ───────────────────────────────────────────
  const visibleSections = (config.sections || []).filter(s => !s.hidden)

  // ── CSS vars (injected inline since this is a public page) ────
  const cssVars = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
    .lp-fade { opacity: 0; transform: translateY(28px); transition: opacity 0.7s ease, transform 0.7s cubic-bezier(.16,1,.3,1); }
    .lp-fade.lp-visible { opacity: 1; transform: translateY(0); }
    .lp-fade-d1 { transition-delay: 0.1s; }
    .lp-fade-d2 { transition-delay: 0.2s; }
    .lp-fade-d3 { transition-delay: 0.3s; }
    .lp-hover-scale { transition: transform 0.25s ease, box-shadow 0.25s ease; }
    .lp-hover-scale:hover { transform: translateY(-3px) scale(1.01); box-shadow: 0 12px 40px rgba(0,0,0,0.18); }
    .lp-btn { display: inline-flex; align-items: center; justify-content: center; border-radius: 10px; font-weight: 700; cursor: pointer; border: none; transition: transform 0.15s ease, opacity 0.15s ease; letter-spacing: -0.01em; text-decoration: none; }
    .lp-btn:hover { transform: translateY(-1px); opacity: 0.92; }
    .lp-btn:active { transform: scale(0.98); }
    .lp-input { width: 100%; padding: 11px 14px; border-radius: 9px; font-size: 14px; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
    .lp-nav-link { font-size: 13px; font-weight: 500; text-decoration: none; opacity: 0.7; transition: opacity 0.2s; }
    .lp-nav-link:hover { opacity: 1; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    img { max-width: 100%; }
    a { color: inherit; }
    ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.3); border-radius: 3px; }
    @media (max-width: 640px) { .lp-grid-2 { grid-template-columns: 1fr !important; } .lp-grid-3 { grid-template-columns: 1fr 1fr !important; } .lp-hero-h { font-size: clamp(28px, 8vw, 52px) !important; } }
  `

  // ── Nav ──────────────────────────────────────────────────────
  const navLinks = config.nav_links || visibleSections
    .filter(s => ['products','about','features','lead_form'].includes(s.type))
    .slice(0, 4)
    .map(s => ({ label: s.content.headline || s.type, href: `#${s.id}` }))

  const initial = (config.logo_url ? '' : (brandName[0] || 'N').toUpperCase())

  // ── Render ───────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      dir={dir}
      style={{
        background: t.bg,
        color:      t.text1,
        fontFamily: font,
        minHeight:  '100vh',
        overflowX:  'hidden',
        position:   'relative',
      }}
    >
      {!preview && <style dangerouslySetInnerHTML={{ __html: cssVars }} />}

      {/* ── Fixed Nav ── */}
      {!preview && (
        <nav style={{
          position:   'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          padding:    '14px 32px',
          display:    'flex', alignItems: 'center', justifyContent: 'space-between',
          background: navVisible ? (t.isLight ? 'rgba(255,255,255,0.92)' : 'rgba(10,10,10,0.88)') : 'transparent',
          backdropFilter: navVisible ? 'blur(16px)' : 'none',
          borderBottom: navVisible ? `1px solid ${t.border}` : 'none',
          transition: 'background 0.3s ease, border-color 0.3s ease',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
            {config.logo_url
              ? <img src={config.logo_url} alt={brandName} style={{ height: 32, objectFit: 'contain', borderRadius: 6 }} />
              : <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `${accent}25`, border: `1.5px solid ${accent}50`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: accent,
                }}>{initial}</div>
            }
            <span style={{ fontSize: 15, fontWeight: 700, color: t.text1, letterSpacing: '-0.02em' }}>{brandName}</span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {navLinks.map(link => (
              <a key={link.href} href={link.href} className="lp-nav-link" style={{ color: t.text2 }}>
                {link.label}
              </a>
            ))}
          </div>
        </nav>
      )}

      {/* ── Sections ── */}
      <main style={{ paddingTop: preview ? 0 : (visibleSections[0]?.type === 'hero' ? 0 : 80) }}>
        {visibleSections.map((section, i) => (
          <SectionRenderer
            key={section.id}
            section={section}
            index={i}
            t={t}
            font={font}
            accent={accent}
            preview={preview}
            workspaceId={workspaceId}
            formValues={formState[section.id] || {}}
            onFormChange={(fieldId, val) => setFormState(s => ({
              ...s,
              [section.id]: { ...(s[section.id] || {}), [fieldId]: val }
            }))}
            submitted={!!submitted[section.id]}
            submitting={!!submitting[section.id]}
            onFormSubmit={() => handleFormSubmit(section.id, section)}
          />
        ))}
      </main>

      {/* ── WhatsApp Float ── */}
      {!preview && config.whatsapp && (
        <a
          href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'fixed', bottom: 24, right: dir === 'rtl' ? 'auto' : 24, left: dir === 'rtl' ? 24 : 'auto',
            width: 52, height: 52, borderRadius: '50%',
            background: '#25D366', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 24px rgba(37,211,102,0.4)',
            zIndex: 90, transition: 'transform 0.2s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}

      {/* ── Built with Nexa ── */}
      {!preview && (
        <div style={{
          textAlign: 'center', padding: '12px 0',
          fontSize: 11, color: t.text3, background: t.bg,
          borderTop: `1px solid ${t.border}`,
        }}>
          Built with <span style={{ color: accent, fontWeight: 600 }}>Nexa</span>
        </div>
      )}
    </div>
  )
}

// ── Individual Section Renderer ───────────────────────────────
function SectionRenderer({
  section, index, t, font, accent, preview,
  workspaceId, formValues, onFormChange, submitted, submitting, onFormSubmit,
}: {
  section:       LandingSection
  index:         number
  t:             typeof THEMES.dark
  font:          string
  accent:        string
  preview:       boolean
  workspaceId:   string
  formValues:    Record<string, string>
  onFormChange:  (id: string, val: string) => void
  submitted:     boolean
  submitting:    boolean
  onFormSubmit:  () => void
}) {
  const c  = section.content
  const id = section.id
  const sp = preview ? '32px 20px' : '80px 24px'
  const maxW = 1100

  const sectionBase: React.CSSProperties = {
    padding:  sp,
    position: 'relative',
    width:    '100%',
  }
  const inner: React.CSSProperties = {
    maxWidth: maxW,
    margin:   '0 auto',
    width:    '100%',
  }
  const sectionHeadline: React.CSSProperties = {
    fontSize:      preview ? 14 : 'clamp(20px,3vw,32px)',
    fontWeight:    700,
    color:         t.text1,
    letterSpacing: '-0.03em',
    marginBottom:  preview ? 16 : 40,
    textAlign:     'center',
    fontFamily:    font,
  }
  const fadeClass = preview ? '' : 'lp-fade'

  // ── HERO ──────────────────────────────────────────────────────
  if (section.type === 'hero') {
    return (
      <section id={id} style={{
        ...sectionBase,
        minHeight:    preview ? 'auto' : '88vh',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
        padding:      preview ? '40px 20px' : '120px 24px 80px',
        overflow:     'hidden',
        background:   t.bg,
      }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', top: '-10%', left: '50%',
          transform: 'translateX(-50%)',
          width: '80%', height: '60%',
          background: `radial-gradient(ellipse at center, ${accent}22 0%, transparent 65%)`,
          pointerEvents: 'none', zIndex: 0,
        }} />
        <div className={fadeClass} style={{ ...inner, zIndex: 1, textAlign: 'center' }}>
          <h1 className="lp-hero-h" style={{
            fontSize:      preview ? 22 : 'clamp(32px,6vw,68px)',
            fontWeight:    800,
            color:         t.text1,
            letterSpacing: '-0.04em',
            lineHeight:    1.08,
            marginBottom:  preview ? 10 : 24,
            fontFamily:    font,
            maxWidth:      750,
            margin:        `0 auto ${preview ? '10px' : '20px'}`,
          }}>
            {c.headline || 'Your Headline Here'}
          </h1>
          <p className={preview ? '' : 'lp-fade lp-fade-d1'} style={{
            fontSize:     preview ? 12 : 'clamp(15px,1.8vw,20px)',
            color:        t.text2,
            maxWidth:     580,
            margin:       `0 auto ${preview ? '16px' : '40px'}`,
            lineHeight:   1.6,
            fontFamily:   font,
          }}>
            {c.subheadline || ''}
          </p>
          <div className={preview ? '' : 'lp-fade lp-fade-d2'} style={{
            display:    'flex', gap: preview ? 8 : 16,
            justifyContent: 'center', flexWrap: 'wrap',
          }}>
            {c.cta_label && (
              <a href={c.cta_url || '#'} className="lp-btn" style={{
                background: accent, color: t.isLight ? '#fff' : '#000',
                padding:    preview ? '8px 18px' : '14px 32px',
                fontSize:   preview ? 12 : 16,
              }}>
                {c.cta_label}
              </a>
            )}
            {c.cta2_label && (
              <a href={c.cta2_url || '#'} className="lp-btn" style={{
                background: 'transparent',
                color:      t.text1,
                border:     `1.5px solid ${t.border}`,
                padding:    preview ? '8px 18px' : '14px 32px',
                fontSize:   preview ? 12 : 16,
              }}>
                {c.cta2_label}
              </a>
            )}
          </div>
        </div>
      </section>
    )
  }

  // ── PRODUCTS ──────────────────────────────────────────────────
  if (section.type === 'products') {
    const items: any[] = c.items || []
    return (
      <section id={id} style={{ ...sectionBase, background: t.bg }}>
        <div style={inner}>
          {c.headline && <h2 className={fadeClass} style={sectionHeadline}>{c.headline}</h2>}
          <div className="lp-grid-3" style={{
            display:             'grid',
            gridTemplateColumns: preview ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(280px, 1fr))',
            gap:                 preview ? 10 : 24,
          }}>
            {items.map((item: any, i: number) => (
              <div key={item.id || i} className={`${fadeClass} lp-hover-scale`} style={{
                background:   t.surface,
                border:       `1px solid ${t.border}`,
                borderRadius: preview ? 10 : 16,
                overflow:     'hidden',
                display:      'flex',
                flexDirection:'column',
              }}>
                {item.image && (
                  <div style={{ paddingTop: '65%', position: 'relative', background: t.elevated }}>
                    <img src={item.image} alt={item.name} style={{
                      position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                    }} />
                  </div>
                )}
                {!item.image && (
                  <div style={{
                    paddingTop: '50%', position: 'relative',
                    background: `linear-gradient(135deg, ${accent}15, ${accent}05)`,
                    border: `none`,
                  }}>
                    <div style={{
                      position: 'absolute', inset: 0, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: preview ? 20 : 36, opacity: 0.3,
                    }}>🛍️</div>
                  </div>
                )}
                <div style={{ padding: preview ? '10px 12px' : '18px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: preview ? 11 : 14, fontWeight: 700, color: t.text1, fontFamily: font }}>{item.name}</div>
                  {item.description && (
                    <div style={{ fontSize: preview ? 10 : 12, color: t.text3, lineHeight: 1.5, flex: 1 }}>{item.description}</div>
                  )}
                  {item.price && (
                    <div style={{
                      fontSize: preview ? 12 : 16, fontWeight: 700, color: accent,
                      marginTop: 4,
                    }}>{item.price}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // ── ABOUT ─────────────────────────────────────────────────────
  if (section.type === 'about') {
    return (
      <section id={id} style={{ ...sectionBase, background: t.surface }}>
        <div className={fadeClass} style={{
          ...inner,
          display: 'grid',
          gridTemplateColumns: (c.image && !preview) ? '1fr 1fr' : '1fr',
          gap: preview ? 16 : 56,
          alignItems: 'center',
        }}>
          <div>
            {c.headline && (
              <h2 style={{
                fontSize:      preview ? 14 : 'clamp(22px,3vw,38px)',
                fontWeight:    800,
                color:         t.text1,
                letterSpacing: '-0.03em',
                marginBottom:  preview ? 8 : 20,
                fontFamily:    font,
                lineHeight:    1.15,
              }}>
                {c.headline}
              </h2>
            )}
            {c.text && (
              <p style={{
                fontSize:   preview ? 11 : 16,
                color:      t.text2,
                lineHeight: 1.7,
                fontFamily: font,
              }}>
                {c.text}
              </p>
            )}
          </div>
          {c.image && !preview && (
            <div style={{ borderRadius: 16, overflow: 'hidden', aspectRatio: '4/3' }}>
              <img src={c.image} alt={c.headline || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
        </div>
      </section>
    )
  }

  // ── FEATURES ──────────────────────────────────────────────────
  if (section.type === 'features') {
    const features: any[] = c.features || []
    return (
      <section id={id} style={{ ...sectionBase, background: t.bg }}>
        <div style={inner}>
          {c.headline && <h2 className={fadeClass} style={sectionHeadline}>{c.headline}</h2>}
          <div className="lp-grid-2" style={{
            display:             'grid',
            gridTemplateColumns: preview ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(260px, 1fr))',
            gap:                 preview ? 8 : 20,
          }}>
            {features.map((f: any, i: number) => (
              <div key={i} className={`${fadeClass}`} style={{
                background:   t.surface,
                border:       `1px solid ${t.border}`,
                borderRadius: preview ? 10 : 14,
                padding:      preview ? '12px 14px' : '24px 26px',
                display:      'flex',
                gap:          preview ? 10 : 16,
                alignItems:   'flex-start',
              }}>
                <div style={{ fontSize: preview ? 18 : 28, lineHeight: 1, flexShrink: 0 }}>{f.icon || '✦'}</div>
                <div>
                  <div style={{ fontSize: preview ? 11 : 15, fontWeight: 700, color: t.text1, marginBottom: 4, fontFamily: font }}>{f.title}</div>
                  <div style={{ fontSize: preview ? 10 : 13, color: t.text2, lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // ── TESTIMONIALS ──────────────────────────────────────────────
  if (section.type === 'testimonials') {
    const testimonials: any[] = c.testimonials || []
    return (
      <section id={id} style={{ ...sectionBase, background: t.surface }}>
        <div style={inner}>
          {c.headline && <h2 className={fadeClass} style={sectionHeadline}>{c.headline}</h2>}
          <div className="lp-grid-3" style={{
            display:             'grid',
            gridTemplateColumns: preview ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(280px, 1fr))',
            gap:                 preview ? 8 : 20,
          }}>
            {testimonials.map((tm: any, i: number) => (
              <div key={i} className={fadeClass} style={{
                background:   t.elevated,
                border:       `1px solid ${t.border}`,
                borderRadius: preview ? 10 : 16,
                padding:      preview ? '12px 14px' : '24px 28px',
                position:     'relative',
              }}>
                <div style={{
                  position: 'absolute', top: preview ? 8 : 16, right: preview ? 10 : 20,
                  fontSize: preview ? 20 : 32, color: accent, opacity: 0.3, lineHeight: 1,
                }}>"</div>
                <p style={{ fontSize: preview ? 10 : 14, color: t.text2, lineHeight: 1.6, marginBottom: preview ? 8 : 18, fontStyle: 'italic' }}>
                  "{tm.text}"
                </p>
                <div style={{ fontSize: preview ? 10 : 13, fontWeight: 700, color: t.text1 }}>{tm.name}</div>
                {tm.role && <div style={{ fontSize: preview ? 9 : 11, color: t.text3, marginTop: 2 }}>{tm.role}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // ── GALLERY ───────────────────────────────────────────────────
  if (section.type === 'gallery') {
    const images: string[] = c.images || []
    return (
      <section id={id} style={{ ...sectionBase, background: t.bg }}>
        <div style={inner}>
          {c.headline && <h2 className={fadeClass} style={sectionHeadline}>{c.headline}</h2>}
          {images.length > 0 ? (
            <div style={{
              display:             'grid',
              gridTemplateColumns: preview ? 'repeat(3, 1fr)' : 'repeat(auto-fill, minmax(220px, 1fr))',
              gap:                 preview ? 6 : 12,
            }}>
              {images.map((src: string, i: number) => (
                <div key={i} className={`${fadeClass} lp-hover-scale`} style={{
                  borderRadius: preview ? 8 : 12,
                  overflow:     'hidden',
                  aspectRatio:  '1',
                  background:   t.surface,
                }}>
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              display:             'grid',
              gridTemplateColumns: preview ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)',
              gap:                 preview ? 6 : 12,
            }}>
              {[...Array(preview ? 6 : 8)].map((_, i) => (
                <div key={i} style={{
                  aspectRatio: '1', borderRadius: preview ? 8 : 12,
                  background: `linear-gradient(135deg, ${accent}12, ${accent}05)`,
                  border: `1px solid ${t.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: preview ? 16 : 24, opacity: 0.4,
                }}>🖼️</div>
              ))}
            </div>
          )}
        </div>
      </section>
    )
  }

  // ── CTA BANNER ────────────────────────────────────────────────
  if (section.type === 'cta_banner') {
    return (
      <section id={id} style={{
        ...sectionBase,
        background: `linear-gradient(135deg, ${accent}20, ${accent}08)`,
        borderTop:    `1px solid ${accent}30`,
        borderBottom: `1px solid ${accent}30`,
      }}>
        <div className={fadeClass} style={{ ...inner, textAlign: 'center' }}>
          <h2 style={{
            fontSize:      preview ? 14 : 'clamp(20px,3vw,34px)',
            fontWeight:    800,
            color:         t.text1,
            letterSpacing: '-0.03em',
            marginBottom:  preview ? 6 : 14,
            fontFamily:    font,
          }}>
            {c.headline || 'Ready to get started?'}
          </h2>
          {c.subline && (
            <p style={{ fontSize: preview ? 11 : 16, color: t.text2, marginBottom: preview ? 14 : 28 }}>
              {c.subline}
            </p>
          )}
          {c.cta_label && (
            <a href={c.cta_url || '#'} className="lp-btn" style={{
              background: accent,
              color:      t.isLight ? '#fff' : '#000',
              padding:    preview ? '9px 20px' : '14px 36px',
              fontSize:   preview ? 12 : 16,
            }}>
              {c.cta_label}
            </a>
          )}
        </div>
      </section>
    )
  }

  // ── LEAD FORM ─────────────────────────────────────────────────
  if (section.type === 'lead_form') {
    const fields: any[] = c.fields || [
      { id: 'f-name',  type: 'text',  label: 'Your name',     placeholder: 'Enter name',         required: false },
      { id: 'f-email', type: 'email', label: 'Email address', placeholder: 'you@example.com',    required: true  },
    ]
    return (
      <section id={id} style={{ ...sectionBase, background: t.surface }}>
        <div style={{ ...inner, maxWidth: 520 }}>
          <div className={fadeClass} style={{
            background:   t.bg,
            border:       `1px solid ${t.border}`,
            borderRadius: preview ? 12 : 20,
            padding:      preview ? '20px 18px' : '44px 40px',
            position:     'relative',
            overflow:     'hidden',
          }}>
            {/* Accent line */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

            {c.headline && (
              <h2 style={{
                fontSize: preview ? 14 : 24, fontWeight: 700, color: t.text1,
                marginBottom: preview ? 4 : 8, letterSpacing: '-0.02em', fontFamily: font,
              }}>{c.headline}</h2>
            )}
            {c.subline && (
              <p style={{ fontSize: preview ? 10 : 14, color: t.text3, marginBottom: preview ? 14 : 28 }}>{c.subline}</p>
            )}

            {submitted ? (
              <div style={{
                textAlign: 'center', padding: '20px 0',
                fontSize: preview ? 12 : 16, color: accent, fontWeight: 600,
              }}>
                ✓ {c.thank_you || "Thanks! We'll be in touch soon."}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: preview ? 10 : 16 }}>
                {fields.map((field: any) => (
                  <div key={field.id}>
                    <label style={{
                      display: 'block', fontSize: preview ? 9 : 11,
                      fontWeight: 700, letterSpacing: '0.06em',
                      textTransform: 'uppercase', color: t.text3,
                      marginBottom: preview ? 4 : 7,
                    }}>
                      {field.label}{field.required && <span style={{ color: accent, marginLeft: 2 }}>*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        className="lp-input"
                        placeholder={field.placeholder || ''}
                        value={formValues[field.id] || ''}
                        onChange={e => onFormChange(field.id, e.target.value)}
                        style={{
                          background: t.surface, border: `1px solid ${t.border}`,
                          color: t.text1, fontFamily: font,
                          minHeight: preview ? 56 : 80, resize: 'vertical',
                          fontSize: preview ? 12 : 14,
                        }}
                      />
                    ) : (
                      <input
                        type={field.type}
                        className="lp-input"
                        placeholder={field.placeholder || ''}
                        value={formValues[field.id] || ''}
                        onChange={e => onFormChange(field.id, e.target.value)}
                        style={{
                          background: t.surface, border: `1px solid ${t.border}`,
                          color: t.text1, fontFamily: font,
                          fontSize: preview ? 12 : 14,
                        }}
                      />
                    )}
                  </div>
                ))}
                <button
                  onClick={onFormSubmit}
                  disabled={submitting}
                  className="lp-btn"
                  style={{
                    background: accent,
                    color:      t.isLight ? '#fff' : '#000',
                    padding:    preview ? '10px' : '14px',
                    fontSize:   preview ? 12 : 15,
                    width:      '100%',
                    marginTop:  4,
                    opacity:    submitting ? 0.6 : 1,
                  }}
                >
                  {submitting ? '...' : (c.cta || 'Submit')}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  // ── FOOTER ────────────────────────────────────────────────────
  if (section.type === 'footer') {
    const links: any[] = c.links || []
    return (
      <footer id={id} style={{
        ...sectionBase,
        padding:      preview ? '20px' : '48px 24px',
        background:   t.surface,
        borderTop:    `1px solid ${t.border}`,
      }}>
        <div style={{ ...inner, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: preview ? 8 : 16 }}>
          {links.length > 0 && (
            <div style={{ display: 'flex', gap: preview ? 12 : 24, justifyContent: 'center', flexWrap: 'wrap' }}>
              {links.map((link: any, i: number) => (
                <a key={i} href={link.url || '#'} style={{
                  fontSize: preview ? 10 : 13, color: t.text3,
                  textDecoration: 'none', transition: 'color 0.2s',
                }} onMouseEnter={e => (e.currentTarget.style.color = accent)}
                   onMouseLeave={e => (e.currentTarget.style.color = t.text3)}>
                  {link.label}
                </a>
              ))}
            </div>
          )}
          <p style={{ fontSize: preview ? 9 : 12, color: t.text3 }}>
            {c.copyright || `© ${new Date().getFullYear()} All rights reserved.`}
          </p>
        </div>
      </footer>
    )
  }

  return null
}
