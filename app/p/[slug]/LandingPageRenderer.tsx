'use client'
import { useState, useEffect } from 'react'
import type {
  LandingPageConfig, WorkspaceProduct, DesignSystem,
  CreativeDirection, SectionType,
} from '@/lib/landing-types'
import { DESIGN_SYSTEMS } from '@/lib/landing-types'

interface Props {
  page:      any
  products:  WorkspaceProduct[]
  isPreview: boolean
}

export default function LandingPageRenderer({ page, products, isPreview }: Props) {
  const config      = page.config as LandingPageConfig
  const ds          = DESIGN_SYSTEMS[config.design_system as DesignSystem] || DESIGN_SYSTEMS.editorial
  const cd          = (config.creative_direction || {}) as CreativeDirection
  const accent      = config.accent || ds.defaultPalette.accent
  const lang        = config.lang || 'en'
  const isAr        = lang === 'ar'
  const dir         = isAr ? 'rtl' : 'ltr'
  const T           = ds.defaultPalette
  const fontSerif   = isAr ? ds.fonts.arabic : ds.fonts.serif
  const fontSans    = isAr ? ds.fonts.arabic : ds.fonts.sans
  const fontDisplay = isAr ? ds.fonts.arabic : ds.fonts.display

  // ── Scroll animations ──────────────────────────────────────────
  const [visible, setVisible] = useState<Set<string>>(new Set())
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting && e.target.id)
          setVisible(prev => { const s = new Set(prev); s.add(e.target.id); return s })
      }),
      { threshold: 0.06 }
    )
    document.querySelectorAll('[data-animate]').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const fadeIn = (id: string): React.CSSProperties => ({
    opacity:    visible.has(id) ? 1 : 0,
    transform:  visible.has(id) ? 'translateY(0)' : 'translateY(28px)',
    transition: 'opacity 0.7s ease, transform 0.7s cubic-bezier(0.22,1,0.36,1)',
  })

  // ── Nav scroll state ───────────────────────────────────────────
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // ── Product modal ──────────────────────────────────────────────
  const [selectedProduct, setSelectedProduct] = useState<WorkspaceProduct | null>(null)
  const [modalPhotoIdx,   setModalPhotoIdx]   = useState(0)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})

  // ── Form state ─────────────────────────────────────────────────
  const [formValues,    setFormValues]    = useState<Record<string, string>>({})
  const [formSubmitting,setFormSubmitting]= useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [formError,     setFormError]     = useState('')

  // ── FAQ state ──────────────────────────────────────────────────
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormSubmitting(true)
    setFormError('')
    try {
      const formConfig = config.form
      const fields = formConfig?.fields || [
        { id: 'f-name',  type: 'text',  label: 'Name',  required: false },
        { id: 'f-email', type: 'email', label: 'Email', required: true  },
      ]
      const res = await fetch('/api/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: config.workspace_id,
          form_values:  formValues,
          fields,
          source: `landing_page:${page.slug}`,
        }),
      })
      if (!res.ok) throw new Error('Submission failed')
      setFormSubmitted(true)
    } catch {
      setFormError(isAr ? 'حدث خطأ. حاول مرة أخرى.' : 'Something went wrong. Please try again.')
    } finally {
      setFormSubmitting(false)
    }
  }

  function logClick(productName: string, actionType: string) {
    fetch('/api/landing-page/log-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspace_id: config.workspace_id,
        product_name: productName,
        action_type:  actionType,
        page_slug:    page.slug,
        referrer:     typeof document !== 'undefined' ? document.referrer : '',
      }),
    }).catch(() => {})
  }

  function getWhatsAppUrl(product: WorkspaceProduct): string {
    const num = (product.whatsapp_number || '').replace(/\D/g, '')
    const msg = product.whatsapp_message
      || `Hi, I'd like to order: ${product.name} from ${config.brand_name}`
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`
  }

  function getProductActionButton(product: WorkspaceProduct) {
    const baseStyle: React.CSSProperties = {
      width: '100%', padding: '15px 24px', borderRadius: 10,
      fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 10, fontFamily: fontSans, letterSpacing: '0.04em',
      textDecoration: 'none', transition: 'opacity 0.2s',
    }
    switch (product.action_type) {
      case 'whatsapp':
        return (
          <a href={getWhatsAppUrl(product)} target="_blank" rel="noopener noreferrer"
            onClick={() => logClick(product.name, 'whatsapp')}
            style={{ ...baseStyle, background: '#25D366', color: '#fff' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {isAr ? 'اطلب عبر واتساب' : 'Order on WhatsApp'}
          </a>
        )
      case 'stripe':
        return (
          <a href={product.action_value} target="_blank" rel="noopener noreferrer"
            onClick={() => logClick(product.name, 'stripe')}
            style={{ ...baseStyle, background: accent, color: T.isLight ? '#fff' : '#000' }}>
            {isAr ? 'اشترِ الآن' : 'Buy Now'}
          </a>
        )
      case 'external':
        return (
          <a href={product.action_value} target="_blank" rel="noopener noreferrer"
            onClick={() => logClick(product.name, 'external')}
            style={{ ...baseStyle, background: accent, color: T.isLight ? '#fff' : '#000' }}>
            {isAr ? 'تسوق الآن' : 'Shop Now'}
          </a>
        )
      default: // lead_form
        return (
          <button
            onClick={() => {
              logClick(product.name, 'lead_form')
              setSelectedProduct(null)
              document.getElementById('lp-form')?.scrollIntoView({ behavior: 'smooth' })
            }}
            style={{ ...baseStyle, background: accent, color: T.isLight ? '#fff' : '#000' }}>
            {isAr ? 'اطلب هذا المنتج' : 'Request This Product'}
          </button>
        )
    }
  }

  // ─────────────────────────────────────────────
  // PRODUCT MODAL
  // ─────────────────────────────────────────────

  function renderProductModal() {
    if (!selectedProduct) return null
    const p = selectedProduct
    const images = ((p.images as any[]) || [])
      .sort((a: any, b: any) => a.order - b.order)
      .map((i: any) => i.url)

    return (
      <div
        onClick={() => setSelectedProduct(null)}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: 'min(900px, 96vw)', maxHeight: '92vh',
            background: T.isLight ? T.bg : T.bg2,
            borderRadius: 20, overflow: 'hidden',
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            position: 'relative', direction: dir,
          }}>

          {/* Close */}
          <button
            onClick={() => setSelectedProduct(null)}
            style={{
              position: 'absolute', top: 16, right: 16, zIndex: 10,
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(0,0,0,0.12)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: T.ink, fontSize: 18, lineHeight: '1',
            }}>
            ×
          </button>

          {/* LEFT: Photo carousel */}
          <div style={{ background: T.bg2, position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 400 }}>
            {images.length > 0 ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={images[modalPhotoIdx]} alt={p.name}
                  style={{ width: '100%', flex: 1, objectFit: 'cover', minHeight: 300 }} />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setModalPhotoIdx(i => (i - 1 + images.length) % images.length)}
                      style={{
                        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                        width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.3)',
                        border: 'none', cursor: 'pointer', color: '#fff', fontSize: 18,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>‹</button>
                    <button
                      onClick={() => setModalPhotoIdx(i => (i + 1) % images.length)}
                      style={{
                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.3)',
                        border: 'none', cursor: 'pointer', color: '#fff', fontSize: 18,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>›</button>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', padding: '12px 0' }}>
                      {images.map((_: string, i: number) => (
                        <div key={i} onClick={() => setModalPhotoIdx(i)}
                          style={{
                            width: i === modalPhotoIdx ? 20 : 6, height: 6, borderRadius: 3,
                            background: i === modalPhotoIdx ? accent : T.ink4,
                            cursor: 'pointer', transition: 'width 0.2s, background 0.2s',
                          }} />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: T.bg3, fontFamily: fontSerif, fontSize: 80, color: T.ink4, fontStyle: 'italic',
              }}>
                {config.brand_initial || 'B'}
              </div>
            )}
          </div>

          {/* RIGHT: Product info */}
          <div style={{ padding: 36, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: fontSans }}>
            {p.badge && (
              <div style={{
                display: 'inline-block', padding: '4px 12px', borderRadius: 100,
                background: accent, color: T.isLight ? '#fff' : '#000',
                fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', width: 'fit-content',
              }}>{p.badge}</div>
            )}

            <div>
              <h2 style={{
                fontFamily: fontSerif, fontSize: 28, fontWeight: 400,
                letterSpacing: '-0.01em', color: T.ink, margin: 0, lineHeight: 1.2,
              }}>{p.name}</h2>
              <div style={{ fontSize: 22, fontWeight: 600, color: accent, marginTop: 8, fontFamily: fontSerif }}>
                {p.price}
              </div>
            </div>

            {p.full_desc && (
              <p style={{ fontSize: 14, color: T.ink2, lineHeight: 1.85, margin: 0, fontWeight: 300 }}>
                {p.full_desc}
              </p>
            )}

            {/* Variants */}
            {((p.variants as any[]) || []).map((variant: any, vi: number) => (
              <div key={vi}>
                <div style={{
                  fontSize: 11, fontWeight: 600, color: T.ink3,
                  letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 8,
                }}>
                  {variant.name}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {variant.options.map((opt: string) => (
                    <button key={opt}
                      onClick={() => setSelectedVariants(prev => ({ ...prev, [variant.name]: opt }))}
                      style={{
                        padding: '7px 16px', borderRadius: 8,
                        border: selectedVariants[variant.name] === opt ? `2px solid ${accent}` : `1px solid ${T.ink4}`,
                        background: selectedVariants[variant.name] === opt ? `${accent}15` : 'transparent',
                        color: selectedVariants[variant.name] === opt ? accent : T.ink2,
                        fontSize: 13, cursor: 'pointer', fontFamily: fontSans,
                        fontWeight: selectedVariants[variant.name] === opt ? 600 : 400, transition: 'all 0.15s',
                      }}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {getProductActionButton(p)}

            {/* Trust signals */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', paddingTop: 8, borderTop: `1px solid ${T.ink4}` }}>
              {(config.hero?.trust_items || [
                isAr ? 'شحن مجاني' : 'Free shipping',
                isAr ? 'ضمان ٣٠ يوم' : '30-day guarantee',
              ]).slice(0, 3).map((item, i) => (
                <div key={i} style={{ fontSize: 11, color: T.ink3, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: accent }}>✓</span>{item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // NAV
  // ─────────────────────────────────────────────

  function renderNav() {
    const navBg     = scrolled ? `${T.bg}ee` : 'transparent'
    const navBorder = scrolled ? `1px solid ${T.ink4}` : '1px solid transparent'

    return (
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isAr ? '0 40px' : '0 48px',
        background: navBg, borderBottom: navBorder,
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        transition: 'all 0.3s', direction: dir, fontFamily: fontSans,
      }}>
        {/* Logo */}
        {config.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={config.logo_url} alt={config.brand_name}
            style={{ height: 32, width: 'auto', maxWidth: 160, objectFit: 'contain' }} />
        ) : (
          <span style={{
            fontFamily: fontSerif,
            fontSize: config.design_system === 'bold' ? 22 : 19,
            fontWeight: 400, color: T.ink,
            letterSpacing: config.design_system === 'minimal' ? '0.10em' : '0.02em',
            textTransform: config.design_system === 'minimal' ? 'uppercase' : 'none',
            fontStyle: config.design_system === 'editorial' ? 'italic' : 'normal',
          }}>
            {config.brand_name}
          </span>
        )}

        {/* Links */}
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {(config.sections_order || [])
            .filter(s => ['products', 'story', 'reviews', 'form'].includes(s))
            .slice(0, 4)
            .map(s => {
              const labels: Record<string, string> = {
                products: isAr ? 'المنتجات' : 'Shop',
                story:    isAr ? 'قصتنا' : 'Story',
                reviews:  isAr ? 'التقييمات' : 'Reviews',
                form:     isAr ? 'تواصل' : 'Contact',
              }
              return (
                <a key={s} href={`#lp-${s}`} style={{
                  fontSize: 12, fontWeight: 500, color: T.ink2,
                  textDecoration: 'none', letterSpacing: '0.06em', transition: 'color 0.2s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = T.ink)}
                  onMouseLeave={e => (e.currentTarget.style.color = T.ink2)}>
                  {labels[s] || s}
                </a>
              )
            })}

          {config.hero?.cta_primary && (
            <a href="#lp-form" style={{
              padding: '9px 22px', background: accent,
              color: T.isLight ? '#fff' : '#000',
              borderRadius: config.design_system === 'minimal' ? 0 : 100,
              fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
              textDecoration: 'none', transition: 'opacity 0.2s',
              fontFamily: config.design_system === 'bold' ? fontDisplay : fontSans,
              textTransform: config.design_system === 'bold' ? 'uppercase' : 'none',
            }}>
              {config.hero.cta_primary}
            </a>
          )}
        </div>
      </nav>
    )
  }

  // ─────────────────────────────────────────────
  // HERO
  // ─────────────────────────────────────────────

  function renderHero() {
    const hero = config.hero
    if (!hero) return null
    const heroLayout = cd.hero_layout || 'split_balanced'
    const typeScale  = cd.type_scale  || 'expressive'
    const spacing    = cd.spacing     || 'breathing'

    const headlineSize = ({
      expressive:  'clamp(52px,8vw,110px)',
      restrained:  'clamp(36px,5vw,72px)',
      aggressive:  'clamp(64px,10vw,140px)',
      literary:    'clamp(40px,5.5vw,80px)',
    } as Record<string, string>)[typeScale] || 'clamp(52px,8vw,110px)'

    const vPad = ({ tight: '60px', breathing: '100px', dramatic: '140px' } as Record<string, string>)[spacing] || '100px'

    const hasImage = !!(hero.image_url || config.product_images?.[0])
    const imageUrl = hero.image_url || config.product_images?.[0]
    const isSplit    = heroLayout === 'split_balanced'
    const isProduct  = heroLayout === 'product_dominant'
    const isCentered = heroLayout === 'headline_dominant' || heroLayout === 'full_bleed'

    return (
      <section id="lp-hero" data-animate style={{
        minHeight: '100vh', paddingTop: 60, background: T.bg,
        direction: dir, position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', ...fadeIn('lp-hero'),
      }}>
        {/* Ghost watermark */}
        {(config.design_system === 'editorial' || config.design_system === 'warm') && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            fontFamily: fontSerif, fontSize: 'clamp(120px,20vw,300px)',
            fontWeight: 900, color: `${T.ink}05`, whiteSpace: 'nowrap',
            pointerEvents: 'none', userSelect: 'none', zIndex: 0,
            fontStyle: 'italic', letterSpacing: '-0.05em',
          }}>
            {config.brand_name}
          </div>
        )}

        <div style={{
          flex: 1, display: 'grid',
          gridTemplateColumns: (isSplit || isProduct) && hasImage
            ? (isProduct ? '5fr 4fr' : '1fr 1fr') : '1fr',
          maxWidth: 1280, width: '100%', margin: '0 auto',
          padding: `${vPad} 48px`, gap: 64, alignItems: 'center',
          position: 'relative', zIndex: 1,
          textAlign: isCentered ? 'center' : 'left',
        }}>
          {/* Text */}
          <div style={{ maxWidth: isCentered ? 800 : '100%', margin: isCentered ? '0 auto' : 0 }}>
            {hero.eyebrow && (
              <div style={{
                fontSize: 11, fontWeight: 600, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: accent, marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 10,
                justifyContent: isCentered ? 'center' : 'flex-start',
                fontFamily: fontSans,
              }}>
                {config.design_system !== 'bold' && (
                  <div style={{ width: 28, height: 1, background: accent, flexShrink: 0 }} />
                )}
                {hero.eyebrow}
              </div>
            )}

            <h1 style={{
              fontFamily: fontDisplay, fontSize: headlineSize, fontWeight: 400,
              lineHeight: config.design_system === 'bold' ? 0.9 : 1.05,
              letterSpacing: config.design_system === 'bold' ? '0.02em' : '-0.02em',
              color: T.ink, margin: '0 0 24px',
              textTransform: config.design_system === 'bold' ? 'uppercase' : 'none',
            }}>
              {hero.headline_line1}
              {hero.headline_line2 && (
                <><br /><span style={{
                  fontStyle: config.design_system !== 'bold' ? 'italic' : 'normal',
                  color: hero.headline_italic ? accent : T.ink,
                }}>{hero.headline_line2}</span></>
              )}
            </h1>

            {hero.body && (
              <p style={{
                fontSize: typeScale === 'restrained' ? 15 : 16, color: T.ink2,
                lineHeight: 1.8, maxWidth: isCentered ? 540 : 480,
                margin: isCentered ? '0 auto 40px' : '0 0 40px',
                fontWeight: 300, fontFamily: fontSans,
              }}>
                {hero.body}
              </p>
            )}

            <div style={{
              display: 'flex', gap: 12, flexWrap: 'wrap',
              justifyContent: isCentered ? 'center' : 'flex-start',
              flexDirection: isAr ? 'row-reverse' : 'row',
            }}>
              {hero.cta_primary && (
                <a href={hero.cta_primary_href || '#lp-products'} style={{
                  padding: config.design_system === 'bold' ? '14px 32px' : '14px 30px',
                  background: accent, color: T.isLight ? '#fff' : '#000',
                  borderRadius: config.design_system === 'minimal' ? 2 : 100,
                  fontSize: config.design_system === 'bold' ? 13 : 14, fontWeight: 700,
                  letterSpacing: config.design_system === 'bold' ? '0.12em' : '0.04em',
                  textDecoration: 'none',
                  fontFamily: config.design_system === 'bold' ? fontDisplay : fontSans,
                  textTransform: config.design_system === 'bold' ? 'uppercase' : 'none',
                  display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'opacity 0.2s',
                }}>
                  {hero.cta_primary}
                </a>
              )}
              {hero.cta_secondary && (
                <a href={hero.cta_secondary_href || '#lp-story'} style={{
                  padding: '14px 30px', background: 'transparent', color: T.ink,
                  borderRadius: config.design_system === 'minimal' ? 2 : 100,
                  border: `1px solid ${T.ink4}`, fontSize: 14, fontWeight: 400,
                  letterSpacing: '0.04em', textDecoration: 'none', fontFamily: fontSans,
                  transition: 'border-color 0.2s',
                }}>
                  {hero.cta_secondary}
                </a>
              )}
            </div>

            {(hero.trust_items || []).length > 0 && (
              <div style={{
                display: 'flex', gap: 24, marginTop: 40, flexWrap: 'wrap',
                justifyContent: isCentered ? 'center' : 'flex-start',
                flexDirection: isAr ? 'row-reverse' : 'row',
              }}>
                {hero.trust_items.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 12, color: T.ink3, fontFamily: fontSans,
                  }}>
                    <span style={{ color: accent, fontWeight: 700 }}>✓</span>{item}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Image */}
          {(isSplit || isProduct) && hasImage && (
            <div style={{ position: 'relative' }}>
              <div style={{
                borderRadius: config.design_system === 'minimal' ? 0 : 20,
                overflow: 'hidden', aspectRatio: isProduct ? '3/4' : '4/5',
                background: T.bg2, border: `1px solid ${T.ink4}`,
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt={config.brand_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {/* Floating rating badge */}
              {(config.design_system === 'editorial' || config.design_system === 'warm') && config.reviews?.score && (
                <div style={{
                  position: 'absolute', bottom: -20,
                  [isAr ? 'right' : 'left']: -20,
                  background: T.bg, border: `1px solid ${T.ink4}`,
                  borderRadius: 14, padding: '14px 18px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  backdropFilter: 'blur(12px)',
                }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: accent, fontFamily: fontSerif }}>
                    {config.reviews.score}
                  </div>
                  <div style={{ fontSize: 11, color: T.ink3, fontFamily: fontSans }}>
                    {config.reviews.count}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scroll hint */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingBottom: 32, position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.ink3, fontFamily: fontSans }}>
            {isAr ? 'انزل' : 'Scroll'}
          </div>
          <div style={{
            width: 1, height: 40, background: T.ink, opacity: 0.2,
            animation: 'scrollpulse 2s ease-in-out infinite',
          }} />
        </div>
      </section>
    )
  }

  // ─────────────────────────────────────────────
  // MARQUEE
  // ─────────────────────────────────────────────

  function renderMarquee() {
    const m = config.marquee
    if (!m) return null
    const items = [...(m.items || []), ...(m.items || [])]
    const duration = m.speed === 'fast' ? '10s' : m.speed === 'slow' ? '30s' : '18s'

    return (
      <div style={{
        background: config.design_system === 'bold' ? accent : T.ink,
        height: 44, overflow: 'hidden', display: 'flex', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', animation: `marqueeScroll ${duration} linear infinite`, whiteSpace: 'nowrap' }}>
          {items.map((item, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 20,
              padding: '0 28px',
              fontSize: config.design_system === 'bold' ? 18 : 11,
              fontWeight: config.design_system === 'bold' ? 400 : 600,
              letterSpacing: config.design_system === 'bold' ? '0.06em' : '0.14em',
              textTransform: 'uppercase',
              color: config.design_system === 'bold' ? '#fff' : 'rgba(255,255,255,0.55)',
              fontFamily: config.design_system === 'bold' ? fontDisplay : fontSans,
            }}>
              {item}
              <span style={{
                width: config.design_system !== 'bold' ? 3 : undefined,
                height: config.design_system !== 'bold' ? 3 : undefined,
                borderRadius: '50%', display: 'inline-block',
                background: config.design_system !== 'bold' ? 'rgba(255,255,255,0.3)' : 'transparent',
                fontSize: config.design_system === 'bold' ? 16 : 0,
              }}>
                {config.design_system === 'bold' ? '/' : ''}
              </span>
            </span>
          ))}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // PRODUCTS
  // ─────────────────────────────────────────────

  function renderProducts() {
    if (!config.products) return null
    const sec = config.products

    return (
      <section id="lp-products" data-animate style={{
        padding: '100px 48px', background: T.bg2,
        direction: dir, ...fadeIn('lp-products'),
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            marginBottom: 64, flexDirection: isAr ? 'row-reverse' : 'row',
          }}>
            <div>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.16em',
                textTransform: 'uppercase', color: accent, marginBottom: 12, fontFamily: fontSans,
              }}>
                {isAr ? 'المجموعة' : 'Collection'}
              </div>
              <h2 style={{
                fontFamily: fontDisplay, fontSize: 'clamp(36px,5vw,72px)', fontWeight: 400,
                letterSpacing: config.design_system === 'bold' ? '0.02em' : '-0.02em',
                color: T.ink, margin: 0, lineHeight: 1,
                textTransform: config.design_system === 'bold' ? 'uppercase' : 'none',
              }}>
                {sec.section_title}
                {config.design_system !== 'bold' && sec.section_subtitle && (
                  <><br /><em style={{ fontStyle: 'italic', color: accent }}>{sec.section_subtitle}</em></>
                )}
              </h2>
            </div>
          </div>

          {/* Grid */}
          {products.length > 0 ? (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
              gap: config.design_system === 'minimal' ? 1 : 24,
              background: config.design_system === 'minimal' ? T.ink4 : 'transparent',
            }}>
              {products.map((product, i) => {
                const imgs = ((product.images as any[]) || []).sort((a: any, b: any) => a.order - b.order)
                const firstImg = imgs[0]?.url
                const isFeatured = product.featured

                return (
                  <div
                    key={product.id}
                    onClick={() => { setSelectedProduct(product); setModalPhotoIdx(0); setSelectedVariants({}) }}
                    style={{
                      background: isFeatured && config.design_system !== 'minimal' ? T.ink : T.bg,
                      borderRadius: config.design_system === 'minimal' ? 0 : 16,
                      overflow: 'hidden', cursor: 'pointer',
                      transition: 'transform 0.25s, box-shadow 0.25s',
                      border: config.design_system === 'minimal' ? 'none' : `1px solid ${T.ink4}`,
                    }}
                    onMouseEnter={e => {
                      if (config.design_system !== 'minimal') {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
                        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)'
                      }
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.transform = 'none'
                      ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                    }}>

                    {config.design_system === 'minimal' && (
                      <div style={{ padding: '20px 28px 0', fontFamily: fontSerif, fontSize: 12, fontWeight: 300, color: T.ink3, fontStyle: 'italic', letterSpacing: '0.10em' }}>
                        {['I.', 'II.', 'III.', 'IV.', 'V.', 'VI.'][i] || `${i + 1}.`}
                      </div>
                    )}

                    <div style={{
                      aspectRatio: config.design_system === 'bold' ? '3/4' : '1',
                      background: isFeatured ? (config.design_system === 'bold' ? `${accent}20` : 'rgba(255,255,255,0.06)') : T.bg2,
                      position: 'relative', overflow: 'hidden',
                    }}>
                      {firstImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={firstImg} alt={product.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }} />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          fontFamily: fontSerif, fontSize: 56,
                          color: isFeatured ? 'rgba(255,255,255,0.12)' : T.ink4, fontStyle: 'italic',
                        }}>
                          {config.brand_initial || 'B'}
                        </div>
                      )}
                      {product.badge && (
                        <div style={{
                          position: 'absolute', top: 12,
                          [isAr ? 'right' : 'left']: 12,
                          padding: '4px 10px',
                          borderRadius: config.design_system === 'minimal' ? 0 : 100,
                          background: accent, color: T.isLight ? '#fff' : '#000',
                          fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', fontFamily: fontSans,
                        }}>
                          {product.badge}
                        </div>
                      )}
                    </div>

                    <div style={{ padding: config.design_system === 'minimal' ? '24px 28px 28px' : '22px' }}>
                      <h3 style={{
                        fontFamily: fontSerif, fontSize: config.design_system === 'bold' ? 22 : 18, fontWeight: 400,
                        color: isFeatured && config.design_system !== 'minimal' ? '#fff' : T.ink,
                        margin: '0 0 6px', letterSpacing: config.design_system === 'bold' ? '0.04em' : '0.01em',
                        textTransform: config.design_system === 'bold' ? 'uppercase' : 'none',
                      }}>
                        {product.name}
                      </h3>
                      <p style={{
                        fontSize: 13, color: isFeatured && config.design_system !== 'minimal' ? 'rgba(255,255,255,0.5)' : T.ink3,
                        margin: '0 0 18px', lineHeight: 1.6, fontFamily: fontSans, fontWeight: 300,
                      }}>
                        {product.short_desc}
                      </p>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        borderTop: config.design_system === 'minimal' ? `1px solid ${T.ink4}` : 'none',
                        paddingTop: config.design_system === 'minimal' ? 18 : 0,
                        flexDirection: isAr ? 'row-reverse' : 'row',
                      }}>
                        <span style={{ fontFamily: fontSerif, fontSize: 18, fontWeight: 500, color: accent }}>
                          {product.price}
                        </span>
                        <button style={{
                          padding: '8px 18px',
                          borderRadius: config.design_system === 'minimal' ? 0 : 100,
                          background: isFeatured && config.design_system !== 'minimal' ? 'rgba(255,255,255,0.15)' : T.bg2,
                          border: `1px solid ${isFeatured && config.design_system !== 'minimal' ? 'rgba(255,255,255,0.2)' : T.ink4}`,
                          color: isFeatured && config.design_system !== 'minimal' ? '#fff' : T.ink,
                          fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: fontSans,
                          letterSpacing: '0.06em', transition: 'all 0.2s',
                        }}>
                          {isAr ? 'عرض المنتج' : 'View Product'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            // Placeholder
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  aspectRatio: '1', background: T.bg3, borderRadius: 16,
                  border: `1px dashed ${T.ink4}`, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  <div style={{ fontSize: 32, fontFamily: fontSerif, color: T.ink4, fontStyle: 'italic' }}>
                    {['I.', 'II.', 'III.'][i - 1]}
                  </div>
                  <div style={{ fontSize: 11, color: T.ink4, fontFamily: fontSans, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {isAr ? 'أضف منتجاً' : 'Add product'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    )
  }

  // ─────────────────────────────────────────────
  // STATEMENT
  // ─────────────────────────────────────────────

  function renderStatement() {
    const s = config.statement
    if (!s) return null

    return (
      <section id="lp-statement" data-animate style={{
        padding: '120px 48px', background: T.bg,
        borderBottom: `1px solid ${T.ink4}`, direction: dir,
        position: 'relative', overflow: 'hidden', ...fadeIn('lp-statement'),
      }}>
        {config.design_system === 'bold' && (
          <div style={{
            position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)',
            fontFamily: fontDisplay, fontSize: 240, color: `${T.ink}03`,
            textTransform: 'uppercase', pointerEvents: 'none', lineHeight: 1, letterSpacing: '0.02em',
          }}>
            {config.brand_name}
          </div>
        )}

        <div style={{
          maxWidth: 1280, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 0,
          borderLeft: config.design_system === 'minimal' ? `1px solid ${T.ink4}` : 'none',
        }}>
          <div style={{
            paddingRight: 80, borderRight: `1px solid ${T.ink4}`,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.ink3, fontFamily: fontSans }}>
              {isAr ? 'موقفنا' : 'Our position'}
            </div>
            <div style={{ fontFamily: fontSerif, fontSize: 120, fontWeight: 400, color: `${T.ink}06`, fontStyle: 'italic', lineHeight: 1 }}>
              {s.number}
            </div>
          </div>

          <div style={{ paddingLeft: 80 }}>
            {config.design_system === 'bold' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, fontFamily: fontSans }}>
                <div style={{ width: 24, height: 2, background: accent }} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: accent }}>
                  {isAr ? 'موقفنا' : 'Our position'}
                </span>
              </div>
            )}

            <h2 style={{
              fontFamily: fontDisplay, fontSize: 'clamp(36px,5.5vw,80px)', fontWeight: 400, lineHeight: 1,
              letterSpacing: config.design_system === 'bold' ? '0.02em' : '-0.01em',
              color: T.ink, margin: '0 0 48px',
              textTransform: config.design_system === 'bold' ? 'uppercase' : 'none',
            }}>
              {s.left_headline}
              {s.left_italic && (
                <><br />
                <span style={{
                  color: config.design_system === 'bold' ? 'transparent' : accent,
                  WebkitTextStroke: config.design_system === 'bold' ? `1px ${T.ink3}` : undefined,
                  fontStyle: config.design_system !== 'bold' ? 'italic' : 'normal',
                } as React.CSSProperties}>
                  {s.left_italic}
                </span></>
              )}
            </h2>
            <p style={{ fontSize: 15, color: T.ink2, lineHeight: 1.85, fontWeight: 300, maxWidth: 640, margin: '0 0 60px', fontFamily: fontSans }}>
              {(s as any).body}
            </p>

            {(s.stats || []).length > 0 && (
              <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
                {s.stats.map((stat, i) => (
                  <div key={i}>
                    <div style={{
                      fontFamily: fontSerif, fontSize: 40, fontWeight: config.design_system === 'bold' ? 400 : 700,
                      color: config.design_system === 'bold' ? T.ink : accent,
                      letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 4,
                      textTransform: config.design_system === 'bold' ? 'uppercase' : 'none',
                    }}>
                      {stat.num}
                    </div>
                    <div style={{ fontSize: 11, color: T.ink3, letterSpacing: '0.10em', textTransform: 'uppercase', fontFamily: fontSans }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  // ─────────────────────────────────────────────
  // PULL QUOTE
  // ─────────────────────────────────────────────

  function renderPullQuote() {
    const pq = config.pull_quote
    if (!pq) return null

    return (
      <section id="lp-pull_quote" data-animate style={{
        padding: '120px 48px', background: T.bg2, textAlign: 'center',
        direction: dir, ...fadeIn('lp-pull_quote'),
      }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          {config.design_system === 'minimal' ? (
            <div style={{ width: 1, height: 60, background: `${T.ink}20`, margin: '0 auto 60px' }} />
          ) : (
            <div style={{ fontFamily: fontSerif, fontSize: 80, fontWeight: 400, color: `${T.ink}12`, lineHeight: 0.7, marginBottom: 24 }}>
              "
            </div>
          )}
          <p style={{
            fontFamily: fontSerif, fontSize: 'clamp(20px,3vw,36px)', fontWeight: 400,
            fontStyle: 'italic', lineHeight: 1.5, color: T.ink, margin: '0 0 40px', letterSpacing: '-0.01em',
          }}>
            {pq.quote}
          </p>
          <div style={{ fontSize: 11, color: T.ink3, letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: fontSans }}>
            {pq.author}
            {pq.location && <span style={{ color: T.ink4 }}> — {pq.location}</span>}
          </div>
          {config.design_system === 'minimal' && (
            <div style={{ width: 1, height: 60, background: `${T.ink}20`, margin: '60px auto 0' }} />
          )}
        </div>
      </section>
    )
  }

  // ─────────────────────────────────────────────
  // STORY
  // ─────────────────────────────────────────────

  function renderStory() {
    const s = config.story
    if (!s) return null

    return (
      <section id="lp-story" data-animate style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        minHeight: 600, borderTop: `1px solid ${T.ink4}`,
        borderBottom: `1px solid ${T.ink4}`, direction: dir, ...fadeIn('lp-story'),
      }}>
        <div style={{
          background: T.bg2, display: 'flex', alignItems: 'center',
          justifyContent: 'center', position: 'relative', overflow: 'hidden',
          order: isAr ? 1 : 0,
        }}>
          {s.image_url || config.product_images?.[1] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.image_url || config.product_images?.[1]} alt={s.tag}
              style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
          ) : (
            <div style={{
              width: '60%', aspectRatio: '3/4', background: T.bg3, border: `1px solid ${T.ink4}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
            }}>
              <div style={{ fontFamily: fontSerif, fontSize: 80, fontWeight: 400, color: T.ink4, fontStyle: 'italic', lineHeight: 1 }}>
                {config.brand_initial || 'B'}
              </div>
              <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.ink4, fontFamily: fontSans }}>
                {config.brand_name}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', fontFamily: fontSans }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: accent, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 24, height: 1, background: accent, flexShrink: 0 }} />{s.tag}
          </div>
          <h2 style={{
            fontFamily: fontDisplay, fontSize: 'clamp(28px,4vw,52px)', fontWeight: 400,
            lineHeight: 1.15, letterSpacing: config.design_system === 'bold' ? '0.02em' : '-0.01em',
            color: T.ink, margin: '0 0 32px',
            textTransform: config.design_system === 'bold' ? 'uppercase' : 'none',
          }}>
            {s.headline}
            {s.headline_italic && (
              <><br /><em style={{ fontStyle: 'italic', color: accent }}>{s.headline_italic}</em></>
            )}
          </h2>
          <p style={{ fontSize: 14, color: T.ink2, lineHeight: 1.9, fontWeight: 300, margin: '0 0 48px' }}>
            {s.body}
          </p>
          {(s.values || []).length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {s.values.map((v, i) => (
                <div key={i} style={{
                  padding: '18px 0', borderTop: `1px solid ${T.ink4}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  flexDirection: isAr ? 'row-reverse' : 'row',
                  ...(i === s.values.length - 1 ? { borderBottom: `1px solid ${T.ink4}` } : {}),
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, letterSpacing: '0.02em', fontFamily: fontSans }}>{v.title}</div>
                  <div style={{ fontSize: 12, color: T.ink3, maxWidth: 200, textAlign: isAr ? 'left' : 'right', lineHeight: 1.5, fontWeight: 300 }}>{v.desc}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    )
  }

  // ─────────────────────────────────────────────
  // FEATURES
  // ─────────────────────────────────────────────

  function renderFeatures() {
    const f = config.features
    if (!f) return null

    const ICONS: Record<string, React.ReactNode> = {
      shield:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
      lightning: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
      heart:     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
      users:     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    }

    return (
      <section id="lp-features" data-animate style={{
        padding: '100px 48px', background: T.bg2, direction: dir, ...fadeIn('lp-features'),
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h2 style={{
            fontFamily: fontDisplay, fontSize: 'clamp(32px,4vw,56px)', fontWeight: 400,
            letterSpacing: '-0.02em', color: T.ink, margin: '0 0 64px', textAlign: 'center',
            textTransform: config.design_system === 'bold' ? 'uppercase' : 'none',
          }}>
            {f.headline}
          </h2>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
            gap: config.design_system === 'minimal' ? 1 : 20,
            background: config.design_system === 'minimal' ? T.ink4 : 'transparent',
          }}>
            {(f.items || []).map((item, i) => (
              <div key={i} style={{
                padding: '28px', background: T.bg,
                borderRadius: config.design_system === 'minimal' ? 0 : 14,
                border: config.design_system === 'minimal' ? 'none' : `1px solid ${T.ink4}`,
                transition: 'border-color 0.2s',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, background: `${accent}12`,
                  border: `1px solid ${accent}25`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', marginBottom: 20,
                }}>
                  {ICONS[item.icon] || ICONS.shield}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: T.ink, margin: '0 0 8px', fontFamily: fontSans, letterSpacing: '0.01em' }}>{item.title}</h3>
                <p style={{ fontSize: 13, color: T.ink3, lineHeight: 1.65, margin: 0, fontFamily: fontSans, fontWeight: 300 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // ─────────────────────────────────────────────
  // REVIEWS
  // ─────────────────────────────────────────────

  function renderReviews() {
    const r = config.reviews
    if (!r) return null

    return (
      <section id="lp-reviews" data-animate style={{
        padding: '100px 48px', background: T.bg, direction: dir, ...fadeIn('lp-reviews'),
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 64, flexDirection: isAr ? 'row-reverse' : 'row' }}>
            <h2 style={{
              fontFamily: fontDisplay, fontSize: 'clamp(36px,5vw,68px)', fontWeight: 400, lineHeight: 1,
              letterSpacing: config.design_system === 'bold' ? '0.02em' : '-0.02em', color: T.ink, margin: 0,
              textTransform: config.design_system === 'bold' ? 'uppercase' : 'none',
            }}>
              {r.headline}
            </h2>
            <div style={{ textAlign: isAr ? 'left' : 'right' }}>
              <div style={{ fontFamily: fontSerif, fontSize: 52, fontWeight: 500, color: accent, lineHeight: 1, letterSpacing: '-0.02em' }}>{r.score}</div>
              <div style={{ fontSize: 10, color: T.ink3, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: fontSans }}>{r.count}</div>
            </div>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
            gap: config.design_system === 'minimal' ? 1 : 20,
            background: config.design_system === 'minimal' ? T.ink4 : 'transparent',
          }}>
            {(r.items || []).map((item, i) => (
              <div key={i} style={{
                padding: '36px',
                background: i === 1 && config.design_system !== 'minimal' ? T.ink : T.bg2,
                borderRadius: config.design_system === 'minimal' ? 0 : 16,
                border: config.design_system === 'minimal' ? 'none' : `1px solid ${T.ink4}`,
                marginTop: (config.design_system === 'editorial' || config.design_system === 'warm')
                  ? (i === 1 ? 60 : i === 2 ? 30 : 0) : 0,
              }}>
                {config.design_system === 'bold' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                    <div style={{ width: 16, height: 2, background: accent }} />
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent, fontFamily: fontSans }}>Verified</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 2, marginBottom: 20 }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <svg key={s} width="12" height="12" viewBox="0 0 12 12">
                        <polygon points="6,.5 7.5,4 11.5,4.5 8.5,7.5 9.5,11.5 6,9.5 2.5,11.5 3.5,7.5 .5,4.5 4.5,4" fill={accent} />
                      </svg>
                    ))}
                  </div>
                )}
                <p style={{
                  fontFamily: fontSerif, fontSize: 15, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.8,
                  color: i === 1 && config.design_system !== 'minimal' ? 'rgba(255,255,255,0.8)' : T.ink2,
                  margin: '0 0 28px',
                }}>
                  "{item.quote}"
                </p>
                <div style={{ borderTop: `1px solid ${i === 1 && config.design_system !== 'minimal' ? 'rgba(255,255,255,0.1)' : T.ink4}`, paddingTop: 20 }}>
                  <div style={{
                    fontSize: config.design_system === 'bold' ? 14 : 13, fontWeight: 600, fontFamily: fontSans,
                    color: i === 1 && config.design_system !== 'minimal' ? '#fff' : T.ink,
                    letterSpacing: config.design_system === 'bold' ? '0.06em' : 0,
                    textTransform: config.design_system === 'bold' ? 'uppercase' : 'none', marginBottom: 2,
                  }}>
                    {item.author}
                  </div>
                  <div style={{ fontSize: 11, color: i === 1 && config.design_system !== 'minimal' ? 'rgba(255,255,255,0.35)' : T.ink3, fontFamily: fontSans, fontWeight: 300 }}>
                    {item.location}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // ─────────────────────────────────────────────
  // FORM
  // ─────────────────────────────────────────────

  function renderForm() {
    const f = config.form
    if (!f) return null
    const fields = f.fields || [
      { id: 'f-name',  type: 'text',  label: isAr ? 'الاسم' : 'Name',  placeholder: isAr ? 'اسمك' : 'Your name', required: false },
      { id: 'f-email', type: 'email', label: isAr ? 'البريد الإلكتروني' : 'Email', placeholder: isAr ? 'بريدك@مثال.com' : 'you@example.com', required: true },
    ]
    const isDark       = config.design_system === 'bold' || cd.color_application === 'inverted_sections'
    const formBg       = isDark ? T.ink : T.dark
    const formInk2     = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.5)'
    const inputBorder  = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.2)'

    return (
      <section id="lp-form" data-animate style={{
        background: formBg, display: 'grid', gridTemplateColumns: '1fr 1fr',
        minHeight: 500, direction: dir, ...fadeIn('lp-form'),
      }}>
        {/* Left: headline */}
        <div style={{ padding: '100px 60px', borderRight: `1px solid ${inputBorder}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: formInk2, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, fontFamily: fontSans }}>
            <div style={{ width: 28, height: 1, background: formInk2 }} />{f.tag}
          </div>
          <h2 style={{
            fontFamily: fontDisplay, fontSize: 'clamp(36px,5vw,72px)', fontWeight: 400, lineHeight: 1.05,
            letterSpacing: config.design_system === 'bold' ? '0.02em' : '-0.01em', color: '#fff', margin: '0 0 24px',
            textTransform: config.design_system === 'bold' ? 'uppercase' : 'none',
          }}>
            {f.headline_line1}
            {f.headline_line2 && (
              <><br /><em style={{ fontStyle: 'italic', color: accent }}>{f.headline_italic || f.headline_line2}</em></>
            )}
          </h2>
          <p style={{ fontSize: 14, color: formInk2, lineHeight: 1.8, fontWeight: 300, maxWidth: 360, fontFamily: fontSans }}>{f.body}</p>
        </div>

        {/* Right: form */}
        <div style={{ padding: '100px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', fontFamily: fontSans }}>
          {formSubmitted ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
                {isAr ? 'تم الإرسال!' : 'Submitted!'}
              </div>
              <div style={{ fontSize: 13, color: formInk2 }}>
                {isAr ? 'سنتواصل معك قريباً' : "We'll be in touch soon"}
              </div>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {fields.map((field: any) => (
                <div key={field.id}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: formInk2, marginBottom: 10 }}>
                    {field.label}{field.required && <span style={{ color: accent }}> *</span>}
                  </label>
                  <input
                    type={field.type || 'text'}
                    placeholder={field.placeholder}
                    required={field.required}
                    value={formValues[field.id] || ''}
                    onChange={e => setFormValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                    style={{
                      width: '100%', padding: '0 0 14px', background: 'transparent',
                      border: 'none', borderBottom: `1px solid ${inputBorder}`,
                      color: '#fff', fontSize: 16, fontFamily: fontSerif, fontWeight: 300,
                      outline: 'none', transition: 'border-color 0.2s',
                      letterSpacing: isAr ? 0 : '0.01em', direction: dir,
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = inputBorder)}
                  />
                </div>
              ))}

              {formError && (
                <div style={{ fontSize: 12, color: '#ef4444', fontFamily: fontSans }}>{formError}</div>
              )}

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginTop: 16, borderTop: `1px solid ${inputBorder}`, paddingTop: 28,
                flexDirection: isAr ? 'row-reverse' : 'row',
              }}>
                <button type="submit" disabled={formSubmitting}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fff', fontFamily: fontSans }}>
                    {formSubmitting ? (isAr ? 'جارٍ الإرسال...' : 'Sending...') : f.cta}
                  </span>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
                <div style={{ fontSize: 11, color: formInk2, fontFamily: fontSans }}>{f.note}</div>
              </div>
            </form>
          )}
        </div>
      </section>
    )
  }

  // ─────────────────────────────────────────────
  // FOUNDER NOTE
  // ─────────────────────────────────────────────

  function renderFounderNote() {
    const fn = config.founder_note
    if (!fn) return null

    return (
      <section id="lp-founder_note" data-animate style={{
        padding: '100px 48px', background: T.bg2, direction: dir, ...fadeIn('lp-founder_note'),
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: accent, marginBottom: 40, display: 'flex', alignItems: 'center', gap: 12, fontFamily: fontSans }}>
            <div style={{ width: 28, height: 1, background: accent }} />
            {isAr ? 'كلمة المؤسس' : 'A note from the founder'}
          </div>

          <div style={{ background: T.bg, border: `1px solid ${T.ink4}`, borderRadius: 4, padding: 56, position: 'relative' }}>
            <p style={{ fontFamily: fontSerif, fontSize: 'clamp(18px,2.2vw,24px)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.8, color: T.ink, margin: '0 0 48px' }}>
              "{fn.text}"
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 28, borderTop: `1px solid ${T.ink4}`, flexDirection: isAr ? 'row-reverse' : 'row' }}>
              {fn.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fn.image_url} alt={fn.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${T.ink4}` }} />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: T.bg3, border: `2px solid ${T.ink4}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fontSerif, fontSize: 18, color: T.ink3, fontStyle: 'italic' }}>
                  {fn.name?.[0] || 'F'}
                </div>
              )}
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: T.ink, letterSpacing: '0.02em', fontFamily: fontSans, marginBottom: 2 }}>{fn.name}</div>
                <div style={{ fontSize: 12, color: T.ink3, fontFamily: fontSans, fontWeight: 300 }}>{fn.role}</div>
              </div>
            </div>

            {/* Wax seal */}
            <div style={{
              position: 'absolute', bottom: 40,
              [isAr ? 'left' : 'right']: 48,
              width: 48, height: 48, borderRadius: '50%', background: accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: fontSerif, fontSize: 18, fontWeight: 600, color: T.isLight ? '#fff' : '#000', fontStyle: 'italic' }}>
                {config.brand_initial || 'B'}
              </span>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // ─────────────────────────────────────────────
  // INGREDIENTS
  // ─────────────────────────────────────────────

  function renderIngredients() {
    const ing = config.ingredients
    if (!ing) return null

    return (
      <section id="lp-ingredients" data-animate style={{
        padding: '100px 48px', background: T.bg, direction: dir, ...fadeIn('lp-ingredients'),
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 80, alignItems: 'start', marginBottom: 60 }}>
            <h2 style={{ fontFamily: fontDisplay, fontSize: 'clamp(28px,4vw,52px)', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.01em', color: T.ink, margin: 0, fontStyle: 'italic' }}>
              {ing.headline}
              {ing.headline_italic && <><br /><em style={{ color: accent }}>{ing.headline_italic}</em></>}
            </h2>
            <p style={{ fontSize: 15, color: T.ink2, lineHeight: 1.9, fontWeight: 300, paddingTop: 8, fontFamily: fontSans }}>{ing.desc}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: T.ink4, border: `1px solid ${T.ink4}` }}>
            {(ing.items || []).map((item, i) => (
              <div key={i} style={{ background: T.bg, padding: '32px 28px', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = T.bg2)}
                onMouseLeave={e => (e.currentTarget.style.background = T.bg)}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${accent}18`, border: `1px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <span style={{ color: accent, fontSize: 20 }}>✦</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: T.ink, marginBottom: 6, fontFamily: fontSans }}>{item.name}</div>
                <div style={{ fontSize: 12, color: T.ink2, lineHeight: 1.7, fontWeight: 300, marginBottom: 14, fontFamily: fontSans }}>{item.desc}</div>
                <div style={{ fontSize: 10, color: accent, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 500, fontFamily: fontSans }}>{item.source}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // ─────────────────────────────────────────────
  // GALLERY
  // ─────────────────────────────────────────────

  function renderGallery() {
    const g = config.gallery
    const images = g?.image_ids?.length ? g.image_ids : (config.product_images || [])
    if (!images.length) return null

    return (
      <section id="lp-gallery" data-animate style={{
        padding: '100px 48px', background: T.bg2, direction: dir, ...fadeIn('lp-gallery'),
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {g?.headline && (
            <h2 style={{ fontFamily: fontDisplay, fontSize: 'clamp(32px,4vw,56px)', fontWeight: 400, letterSpacing: '-0.02em', color: T.ink, margin: '0 0 48px', textAlign: 'center' }}>
              {g.headline}
            </h2>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {images.slice(0, 6).map((url, i) => (
              <div key={i} style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: i === 0 || i === 3 ? '1/1.3' : '1', background: T.bg3 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Gallery ${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // ─────────────────────────────────────────────
  // CTA BANNER
  // ─────────────────────────────────────────────

  function renderCTABanner() {
    const cta = config.cta_banner
    if (!cta) return null

    return (
      <section id="lp-cta_banner" data-animate style={{
        padding: '80px 48px', background: accent, textAlign: 'center', direction: dir, ...fadeIn('lp-cta_banner'),
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{
            fontFamily: fontDisplay, fontSize: 'clamp(32px,5vw,60px)', fontWeight: 400, lineHeight: 1.05,
            letterSpacing: config.design_system === 'bold' ? '0.02em' : '-0.02em',
            color: T.isLight ? '#fff' : '#000', margin: '0 0 16px',
            textTransform: config.design_system === 'bold' ? 'uppercase' : 'none',
          }}>
            {cta.headline}
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: T.isLight ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)', margin: '0 0 36px', fontFamily: fontSans, fontWeight: 300 }}>
            {cta.subline}
          </p>
          <a href={cta.cta_href || '#lp-form'} style={{
            display: 'inline-block', padding: '14px 36px',
            background: T.isLight ? '#fff' : '#000', color: accent,
            borderRadius: config.design_system === 'minimal' ? 2 : 100,
            fontSize: 14, fontWeight: 700, letterSpacing: '0.06em',
            textDecoration: 'none', fontFamily: fontSans, transition: 'opacity 0.2s',
          }}>
            {cta.cta}
          </a>
        </div>
      </section>
    )
  }

  // ─────────────────────────────────────────────
  // FAQ
  // ─────────────────────────────────────────────

  function renderFAQ() {
    const faq = config.faq
    if (!faq) return null

    return (
      <section id="lp-faq" data-animate style={{
        padding: '100px 48px', background: T.bg, direction: dir, ...fadeIn('lp-faq'),
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontFamily: fontDisplay, fontSize: 'clamp(32px,4vw,56px)', fontWeight: 400, letterSpacing: '-0.02em', color: T.ink, margin: '0 0 64px', textAlign: 'center' }}>
            {faq.headline}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {(faq.items || []).map((item, i) => (
              <div key={i} style={{ borderTop: `1px solid ${T.ink4}`, ...(i === faq.items.length - 1 ? { borderBottom: `1px solid ${T.ink4}` } : {}) }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', textAlign: isAr ? 'right' : 'left', background: 'none', border: 'none',
                    padding: '22px 0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', gap: 16, flexDirection: isAr ? 'row-reverse' : 'row',
                  }}>
                  <span style={{ fontSize: 15, fontWeight: 500, color: T.ink, fontFamily: fontSans, letterSpacing: '0.01em' }}>{item.question}</span>
                  <span style={{ color: accent, fontSize: 20, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ paddingBottom: 24, fontSize: 14, color: T.ink2, lineHeight: 1.8, fontWeight: 300, fontFamily: fontSans }}>
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // ─────────────────────────────────────────────
  // STATS
  // ─────────────────────────────────────────────

  function renderStats() {
    const s = config.stats
    if (!s) return null

    return (
      <section id="lp-stats" data-animate style={{
        padding: '80px 48px', background: T.bg2, direction: dir, ...fadeIn('lp-stats'),
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: `repeat(${Math.min(s.items?.length || 3, 4)},1fr)`, gap: 1, background: T.ink4, border: `1px solid ${T.ink4}` }}>
          {(s.items || []).map((item, i) => (
            <div key={i} style={{ background: T.bg, padding: '48px 32px', textAlign: 'center' }}>
              <div style={{ fontFamily: fontSerif, fontSize: 52, fontWeight: 400, color: accent, lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 8 }}>{item.num}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 6, fontFamily: fontSans }}>{item.label}</div>
              <div style={{ fontSize: 12, color: T.ink3, fontFamily: fontSans, fontWeight: 300 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  // ─────────────────────────────────────────────
  // VIDEO
  // ─────────────────────────────────────────────

  function renderVideo() {
    const v = config.video
    if (!v?.embed_url) return null

    return (
      <section id="lp-video" data-animate style={{
        padding: '100px 48px', background: T.bg, direction: dir, ...fadeIn('lp-video'),
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          {v.headline && (
            <h2 style={{ fontFamily: fontDisplay, fontSize: 'clamp(28px,4vw,52px)', fontWeight: 400, letterSpacing: '-0.02em', color: T.ink, margin: '0 0 40px', textAlign: 'center' }}>
              {v.headline}
            </h2>
          )}
          <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: 16, overflow: 'hidden', background: T.bg2 }}>
            <iframe
              src={v.embed_url} title={v.headline || 'Video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
            />
          </div>
          {v.caption && <p style={{ fontSize: 12, color: T.ink3, textAlign: 'center', marginTop: 16, fontFamily: fontSans }}>{v.caption}</p>}
        </div>
      </section>
    )
  }

  // ─────────────────────────────────────────────
  // FOOTER
  // ─────────────────────────────────────────────

  function renderFooter() {
    const f = config.footer
    if (!f) return null
    const waNumber = (products.find(p => p.whatsapp_number)?.whatsapp_number || '').replace(/\D/g, '')

    return (
      <footer style={{
        padding: '80px 48px 48px',
        background: T.isLight ? T.dark : T.bg2,
        direction: dir, fontFamily: fontSans,
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 60, borderBottom: '1px solid rgba(255,255,255,0.08)', flexDirection: isAr ? 'row-reverse' : 'row' }}>
            {config.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={config.logo_url} alt={config.brand_name} style={{ height: 36, width: 'auto', maxWidth: 160, objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.8 }} />
            ) : (
              <span style={{
                fontFamily: fontSerif, fontSize: config.design_system === 'bold' ? 48 : 28,
                fontWeight: 400, color: '#fff',
                fontStyle: config.design_system !== 'bold' ? 'italic' : 'normal',
                letterSpacing: config.design_system === 'minimal' ? '0.10em' : '0.02em',
                textTransform: (config.design_system === 'minimal' || config.design_system === 'bold') ? 'uppercase' : 'none',
                lineHeight: 1,
              }}>
                {config.brand_name}
              </span>
            )}
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', maxWidth: 280, textAlign: isAr ? 'left' : 'right', lineHeight: 1.8, fontWeight: 300 }}>
              {f.tagline}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${(f.cols?.length || 2) + 1},1fr)`, gap: 0, padding: '60px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {(f.cols || []).map((col, i) => (
              <div key={i} style={{ paddingRight: 48 }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 20 }}>{col.title}</div>
                {(col.links || []).map((link, j) => (
                  <div key={j} style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 12, cursor: 'pointer', transition: 'color 0.2s', fontWeight: 300 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}>
                    {link}
                  </div>
                ))}
              </div>
            ))}

            {waNumber && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 20 }}>
                  {isAr ? 'تواصل' : 'Contact'}
                </div>
                <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(37,211,102,0.8)', textDecoration: 'none', borderBottom: '1px solid rgba(37,211,102,0.3)', paddingBottom: 2, transition: 'opacity 0.2s', fontWeight: 400 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(37,211,102,0.8)">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {isAr ? 'واتساب' : 'WhatsApp'}
                </a>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, flexDirection: isAr ? 'row-reverse' : 'row' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 300 }}>
              © {new Date().getFullYear()} {config.brand_name}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.12)', letterSpacing: '0.10em' }}>
              Built with Nexa
            </div>
          </div>
        </div>
      </footer>
    )
  }

  // ─────────────────────────────────────────────
  // SECTION ROUTER
  // ─────────────────────────────────────────────

  const SECTION_RENDERERS: Partial<Record<SectionType, () => React.ReactNode>> = {
    hero:          renderHero,
    marquee:       renderMarquee,
    statement:     renderStatement,
    products:      renderProducts,
    pull_quote:    renderPullQuote,
    story:         renderStory,
    features:      renderFeatures,
    reviews:       renderReviews,
    form:          renderForm,
    founder_note:  renderFounderNote,
    ingredients:   renderIngredients,
    gallery:       renderGallery,
    cta_banner:    renderCTABanner,
    faq:           renderFAQ,
    video:         renderVideo,
    stats:         renderStats,
    footer:        renderFooter,
  }

  const sectionsOrder = config.sections_order
    || ['hero', 'marquee', 'products', 'story', 'reviews', 'form', 'footer']

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${ds.fonts.googleFonts}&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: ${T.bg}; color: ${T.ink}; font-family: ${fontSans}; overflow-x: hidden; }
        @keyframes marqueeScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes scrollpulse { 0%, 100% { opacity: 0.15; } 50% { opacity: 0.45; } }
        img { display: block; max-width: 100%; }
        a { color: inherit; }
        @media (max-width: 768px) {
          section { padding-left: 24px !important; padding-right: 24px !important; }
          [style*="grid-template-columns: 1fr 1fr"],
          [style*="grid-template-columns: repeat(3"] { grid-template-columns: 1fr !important; }
          [style*="grid-template-columns: repeat(4"] { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>

      <div style={{ background: T.bg, minHeight: '100vh', fontFamily: fontSans, direction: dir }}>
        {renderNav()}

        {sectionsOrder.map(sectionType => {
          const renderer = SECTION_RENDERERS[sectionType as SectionType]
          if (!renderer) return null
          return <div key={sectionType}>{renderer()}</div>
        })}

        {!sectionsOrder.includes('footer') && renderFooter()}

        {renderProductModal()}
      </div>
    </>
  )
}
