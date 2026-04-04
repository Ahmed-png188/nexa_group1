'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WorkspaceProduct, ProductVariant } from '@/lib/landing-types'

const C = {
  bg:      '#0C0C0C',
  surface: '#141414',
  over:    '#1A1A1A',
  border:  'rgba(255,255,255,0.10)',
  borderS: 'rgba(255,255,255,0.06)',
  cyan:    '#00AAFF',
  cyanD:   'rgba(0,170,255,0.12)',
  cyanB:   'rgba(0,170,255,0.22)',
  t1:      '#FFFFFF',
  t2:      'rgba(255,255,255,0.65)',
  t3:      'rgba(255,255,255,0.35)',
  t4:      'rgba(255,255,255,0.20)',
  red:     '#EF4444',
  green:   '#22C55E',
}
const F = "'Tajawal', system-ui, sans-serif"

const ACTION_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  whatsapp: { label: 'واتساب',   color: C.green,   bg: 'rgba(34,197,94,0.12)'   },
  stripe:   { label: 'Stripe',   color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  external: { label: 'رابط',     color: C.cyan,    bg: C.cyanD                  },
  lead_form:{ label: 'نموذج',    color: C.t3,      bg: 'rgba(255,255,255,0.06)' },
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        width: 30, height: 16, borderRadius: 8,
        background: on ? C.green : 'rgba(255,255,255,0.15)',
        position: 'relative', cursor: 'pointer',
        transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 2,
        left: on ? 16 : 2, width: 12, height: 12,
        borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s',
      }} />
    </div>
  )
}

type FormState = Partial<WorkspaceProduct> & { variants?: ProductVariant[] }

const BLANK_FORM: FormState = {
  name: '', short_desc: '', full_desc: '',
  price: '', badge: '', featured: false,
  images: [], variants: [],
  action_type: 'lead_form', action_value: '',
  whatsapp_number: '', whatsapp_message: '',
}

export default function ProductsAr() {
  const supabase = createClient()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [wsId,           setWsId]           = useState<string|null>(null)
  const [products,       setProducts]       = useState<WorkspaceProduct[]>([])
  const [loading,        setLoading]        = useState(true)
  const [drawerOpen,     setDrawerOpen]     = useState(false)
  const [editingProduct, setEditingProduct] = useState<WorkspaceProduct|null>(null)
  const [form,           setForm]           = useState<FormState>(BLANK_FORM)
  const [saving,         setSaving]         = useState(false)
  const [uploading,      setUploading]      = useState(false)
  const [variantsOpen,   setVariantsOpen]   = useState(false)
  const [deleteConfirm,  setDeleteConfirm]  = useState<string|null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: mem } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()
      if (mem?.workspace_id) {
        setWsId(mem.workspace_id)
        await loadProducts(mem.workspace_id)
      }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadProducts(wid: string) {
    setLoading(true)
    const res = await fetch(`/api/products?workspace_id=${wid}`)
    const json = await res.json()
    setProducts(json.products || [])
    setLoading(false)
  }

  function openAdd() {
    setEditingProduct(null)
    setForm(BLANK_FORM)
    setVariantsOpen(false)
    setDrawerOpen(true)
  }

  function openEdit(p: WorkspaceProduct) {
    setEditingProduct(p)
    setForm({
      name:             p.name,
      short_desc:       p.short_desc,
      full_desc:        p.full_desc,
      price:            p.price,
      badge:            p.badge,
      featured:         p.featured,
      images:           p.images || [],
      variants:         p.variants || [],
      action_type:      p.action_type,
      action_value:     p.action_value,
      whatsapp_number:  p.whatsapp_number,
      whatsapp_message: p.whatsapp_message,
    })
    setVariantsOpen((p.variants || []).length > 0)
    setDrawerOpen(true)
  }

  function closeDrawer() {
    setDrawerOpen(false)
    setEditingProduct(null)
    setForm(BLANK_FORM)
  }

  async function saveProduct() {
    if (!wsId || !form.name?.trim()) return
    setSaving(true)
    try {
      if (editingProduct) {
        await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      } else {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspace_id: wsId, ...form }),
        })
      }
      await loadProducts(wsId)
      closeDrawer()
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(p: WorkspaceProduct) {
    await fetch(`/api/products/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !p.active }),
    })
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, active: !x.active } : x))
  }

  async function deleteProduct(id: string) {
    await fetch(`/api/products/${id}`, { method: 'DELETE' })
    setProducts(prev => prev.filter(x => x.id !== id))
    setDeleteConfirm(null)
  }

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    if (!editingProduct || !e.target.files?.[0]) return
    const file = e.target.files[0]
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`/api/products/${editingProduct.id}/upload-image`, {
      method: 'POST', body: fd,
    })
    const json = await res.json()
    if (json.images) {
      setForm(prev => ({ ...prev, images: json.images }))
      setProducts(prev =>
        prev.map(x => x.id === editingProduct.id ? { ...x, images: json.images } : x)
      )
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function removeImage(idx: number) {
    const imgs = (form.images || []).filter((_, i) => i !== idx)
    setForm(prev => ({ ...prev, images: imgs }))
  }

  function addVariantGroup() {
    const vars = [...(form.variants || []), { name: '', options: [] }]
    setForm(prev => ({ ...prev, variants: vars }))
  }

  function removeVariantGroup(i: number) {
    const vars = (form.variants || []).filter((_, j) => j !== i)
    setForm(prev => ({ ...prev, variants: vars }))
  }

  function setVariantName(i: number, name: string) {
    const vars = (form.variants || []).map((v, j) => j === i ? { ...v, name } : v)
    setForm(prev => ({ ...prev, variants: vars }))
  }

  function setVariantOptions(i: number, raw: string) {
    const options = raw.split(',').map(s => s.trim()).filter(Boolean)
    const vars = (form.variants || []).map((v, j) => j === i ? { ...v, options } : v)
    setForm(prev => ({ ...prev, variants: vars }))
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: C.over, border: `1px solid ${C.border}`,
    borderRadius: 8, padding: '9px 12px',
    color: C.t1, fontFamily: F, fontSize: 14,
    outline: 'none', textAlign: 'right',
    letterSpacing: 0,
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 600,
    color: C.t3, marginBottom: 6, letterSpacing: 0,
    textAlign: 'right',
  }
  const sectionStyle: React.CSSProperties = {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottom: `1px solid ${C.borderS}`,
  }

  return (
    <div dir="rtl" style={{ fontFamily: F, background: C.bg, minHeight: '100vh', color: C.t1, letterSpacing: 0 }}>
      {/* Header */}
      <div style={{
        padding: '20px 32px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>المنتجات</div>
          <div style={{ fontSize: 13, color: C.t3, marginTop: 2 }}>كتالوج منتجاتك</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 11, color: C.t4 }}>
            {products.length} منتج
          </div>
          <button
            onClick={openAdd}
            style={{
              background: C.cyan, color: '#000',
              border: 'none', borderRadius: 8,
              padding: '9px 20px', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: F,
            }}
          >
            + إضافة منتج
          </button>
        </div>
      </div>

      {/* Product List */}
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: C.t3, fontSize: 14 }}>
          جار التحميل…
        </div>
      ) : products.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: 80, textAlign: 'center',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 12,
            background: C.cyanD, display: 'flex', alignItems: 'center',
            justifyContent: 'center', marginBottom: 16,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke={C.cyan} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.t1, marginBottom: 8 }}>
            لا منتجات بعد
          </div>
          <div style={{ fontSize: 13, color: C.t3, marginBottom: 24, maxWidth: 320 }}>
            أضف منتجك الأول لتبدأ في بناء متجرك.
          </div>
          <button
            onClick={openAdd}
            style={{
              background: C.cyan, color: '#000',
              border: 'none', borderRadius: 8,
              padding: '9px 20px', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: F,
            }}
          >
            + إضافة منتج
          </button>
        </div>
      ) : (
        <div>
          {products.map(p => {
            const ac = ACTION_CONFIG[p.action_type] || ACTION_CONFIG.lead_form
            const thumb = p.images?.[0]?.url
            return (
              <div
                key={p.id}
                style={{
                  padding: '14px 32px', borderBottom: `1px solid ${C.borderS}`,
                  display: 'flex', alignItems: 'center', gap: 16, flexDirection: 'row-reverse',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = C.surface)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Delete */}
                {deleteConfirm === p.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, color: C.t3 }}>متأكد؟</span>
                    <button
                      onClick={() => deleteProduct(p.id)}
                      style={{
                        background: C.red, color: '#fff', border: 'none',
                        borderRadius: 6, padding: '3px 8px', fontSize: 12,
                        cursor: 'pointer', fontFamily: F,
                      }}
                    >نعم</button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      style={{
                        background: C.over, color: C.t2, border: 'none',
                        borderRadius: 6, padding: '3px 8px', fontSize: 12,
                        cursor: 'pointer', fontFamily: F,
                      }}
                    >لا</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(p.id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '4px', color: C.t4, display: 'flex',
                    }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = C.red)}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = C.t4)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14H6L5 6"/>
                      <path d="M10 11v6M14 11v6"/>
                      <path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                )}

                {/* Edit */}
                <button
                  onClick={() => openEdit(p)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 12, color: C.t3, fontFamily: F, padding: '4px 8px',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = C.t1)}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = C.t3)}
                >
                  تعديل
                </button>

                {/* Active toggle */}
                <Toggle on={p.active} onChange={() => toggleActive(p)} />

                {/* Action badge */}
                <div style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 8px',
                  borderRadius: 100, color: ac.color, background: ac.bg,
                }}>
                  {ac.label}
                </div>

                {/* Price */}
                <div style={{ fontSize: 14, fontWeight: 500, color: C.t2, minWidth: 80, textAlign: 'right' }}>
                  {p.price || '—'}
                </div>

                {/* Product info */}
                <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.t1 }}>{p.name}</div>
                  <div style={{
                    fontSize: 12, color: C.t3, marginTop: 1,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {p.short_desc ? p.short_desc.slice(0, 60) : '—'}
                  </div>
                </div>

                {/* Thumbnail */}
                <div style={{
                  width: 48, height: 48, borderRadius: 8,
                  background: C.over, overflow: 'hidden', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {p.images?.[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0].url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 18, color: C.t3 }}>
                      {(p.name || '?')[0]}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Drawer overlay */}
      {drawerOpen && (
        <div
          onClick={closeDrawer}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
        />
      )}

      {/* Drawer — slides from left (RTL) */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: 480, background: C.surface,
        borderRight: `1px solid ${C.border}`,
        transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        zIndex: 50, display: 'flex', flexDirection: 'column',
      }}>
        {/* Drawer header */}
        <div style={{
          padding: '20px 24px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <button
            onClick={closeDrawer}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t3, padding: 4 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.t1 }}>
            {editingProduct ? 'تعديل المنتج' : 'إضافة منتج'}
          </div>
        </div>

        {/* Drawer body */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>

          {/* Basic Info */}
          <div style={sectionStyle}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.t2, marginBottom: 16, textAlign: 'right' }}>
              المعلومات الأساسية
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>الاسم *</label>
              <input
                style={inputStyle}
                placeholder="مثال: سيروم مرطب للوجه"
                value={form.name || ''}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>وصف مختصر</label>
              <textarea
                style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
                placeholder="يظهر على بطاقة المنتج — ١٠٠ حرف كحد أقصى"
                maxLength={100}
                value={form.short_desc || ''}
                onChange={e => setForm(p => ({ ...p, short_desc: e.target.value }))}
              />
              <div style={{ fontSize: 10, color: C.t4, marginTop: 4, textAlign: 'right' }}>
                {(form.short_desc || '').length}/١٠٠ حرف
              </div>
            </div>

            <div>
              <label style={labelStyle}>وصف كامل</label>
              <textarea
                style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
                placeholder="صف المنتج بالكامل — العميل يقرأ هذا قبل الشراء"
                value={form.full_desc || ''}
                onChange={e => setForm(p => ({ ...p, full_desc: e.target.value }))}
              />
            </div>
          </div>

          {/* Pricing */}
          <div style={sectionStyle}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.t2, marginBottom: 16, textAlign: 'right' }}>
              السعر
            </div>
            <label style={labelStyle}>السعر</label>
            <input
              style={inputStyle}
              placeholder="مثال: ٨٨ ريال أو $58"
              value={form.price || ''}
              onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
            />
            <div style={{ fontSize: 11, color: C.t4, marginTop: 6, textAlign: 'right' }}>
              أدخل السعر كما تريده أن يظهر (مثال: ٨٨ ريال، $58)
            </div>
          </div>

          {/* Badge */}
          <div style={sectionStyle}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.t2, marginBottom: 16, textAlign: 'right' }}>
              الشارة <span style={{ fontWeight: 400, color: C.t4 }}>(اختياري)</span>
            </div>
            <label style={labelStyle}>نص الشارة</label>
            <input
              style={inputStyle}
              placeholder="مثال: الأكثر مبيعاً، جديد، إصدار محدود"
              value={form.badge || ''}
              onChange={e => setForm(p => ({ ...p, badge: e.target.value }))}
            />
            <div style={{ fontSize: 11, color: C.t4, marginTop: 6, textAlign: 'right' }}>
              تظهر كتسمية على بطاقة المنتج
            </div>
          </div>

          {/* Featured */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Toggle on={form.featured || false} onChange={v => setForm(p => ({ ...p, featured: v }))} />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.t1 }}>منتج مميز</div>
                <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>
                  المنتجات المميزة تظهر في الموقع المركزي البارز
                </div>
              </div>
            </div>
          </div>

          {/* Product Photos */}
          <div style={sectionStyle}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.t2, marginBottom: 4, textAlign: 'right' }}>
              صور المنتج
            </div>
            <div style={{ fontSize: 11, color: C.t3, marginBottom: 16, textAlign: 'right' }}>
              الصورة الأولى تظهر على البطاقة. جميع الصور تظهر في نافذة التفاصيل.
            </div>

            {!editingProduct ? (
              <div style={{
                border: `1px dashed ${C.border}`, borderRadius: 8, padding: 16,
                fontSize: 13, color: C.t4, textAlign: 'center',
              }}>
                احفظ المنتج أولاً ثم أضف الصور
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                  {(form.images || []).map((img, i) => (
                    <div key={i} style={{
                      position: 'relative', width: 80, height: 80,
                      borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.border}`,
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        onClick={() => removeImage(i)}
                        style={{
                          position: 'absolute', top: 4, right: 4,
                          width: 18, height: 18, borderRadius: '50%',
                          background: 'rgba(0,0,0,0.7)', border: 'none',
                          cursor: 'pointer', color: '#fff', fontSize: 10,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >×</button>
                    </div>
                  ))}
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadImage} />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  style={{
                    background: C.over, border: `1px solid ${C.border}`,
                    borderRadius: 8, padding: '8px 16px',
                    fontSize: 13, color: C.t2, cursor: 'pointer',
                    fontFamily: F, display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  {uploading ? 'جار الرفع…' : '+ إضافة صورة'}
                </button>
              </>
            )}
          </div>

          {/* Customer Action */}
          <div style={sectionStyle}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.t2, marginBottom: 4, textAlign: 'right' }}>
              إجراء العميل
            </div>
            <div style={{ fontSize: 11, color: C.t3, marginBottom: 14, textAlign: 'right' }}>
              ماذا يحدث حين يضغط العميل على زر الشراء؟
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {([
                ['whatsapp', 'طلب واتساب',  'العميل يراسلك على واتساب'],
                ['stripe',   'دفع Stripe',  'العميل يدفع عبر رابط Stripe'],
                ['external', 'رابط خارجي', 'يفتح رابطك المخصص'],
                ['lead_form','نموذج تواصل','العميل يملأ نموذجاً في صفحتك'],
              ] as const).map(([val, title, desc]) => {
                const selected = form.action_type === val
                return (
                  <div
                    key={val}
                    onClick={() => setForm(p => ({ ...p, action_type: val }))}
                    style={{
                      background: selected ? C.cyanD : C.over,
                      border: `1px solid ${selected ? C.cyanB : C.border}`,
                      borderRadius: 10, padding: 14, cursor: 'pointer',
                      transition: 'all 0.15s', textAlign: 'right',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.t1, marginBottom: 4 }}>{title}</div>
                    <div style={{ fontSize: 11, color: C.t3 }}>{desc}</div>
                  </div>
                )
              })}
            </div>

            {form.action_type === 'whatsapp' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={labelStyle}>رقم الواتساب</label>
                  <input style={inputStyle} placeholder="+971 50 123 4567"
                    value={form.whatsapp_number || ''}
                    onChange={e => setForm(p => ({ ...p, whatsapp_number: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>رسالة مخصصة (اختياري)</label>
                  <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
                    placeholder={`مرحبا، أريد أن أطلب: ${form.name || '[اسم المنتج]'}`}
                    value={form.whatsapp_message || ''}
                    onChange={e => setForm(p => ({ ...p, whatsapp_message: e.target.value }))} />
                </div>
              </div>
            )}
            {form.action_type === 'stripe' && (
              <div>
                <label style={labelStyle}>رابط Stripe للدفع</label>
                <input style={inputStyle} placeholder="https://buy.stripe.com/..."
                  value={form.action_value || ''}
                  onChange={e => setForm(p => ({ ...p, action_value: e.target.value }))} />
                <div style={{ fontSize: 11, color: C.t4, marginTop: 6, textAlign: 'right' }}>
                  أنشئه من لوحة Stripe ← المنتجات ← روابط الدفع
                </div>
              </div>
            )}
            {form.action_type === 'external' && (
              <div>
                <label style={labelStyle}>رابط المنتج</label>
                <input style={inputStyle} placeholder="https://yoursite.com/product/..."
                  value={form.action_value || ''}
                  onChange={e => setForm(p => ({ ...p, action_value: e.target.value }))} />
              </div>
            )}
            {form.action_type === 'lead_form' && (
              <div style={{
                background: C.over, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: 12, fontSize: 13, color: C.t3, textAlign: 'right',
              }}>
                العميل يملأ نموذجاً في صفحتك. بياناته تصل إلى صندوق وارد Nexa.
              </div>
            )}
          </div>

          {/* Variants */}
          <div style={{ marginBottom: 24 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: variantsOpen ? 16 : 0,
            }}>
              <Toggle on={variantsOpen} onChange={v => { setVariantsOpen(v); if (!v) setForm(p => ({ ...p, variants: [] })) }} />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.t1 }}>متغيرات المنتج</div>
                <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>
                  المقاس، اللون، النكهة، إلخ. (اختياري)
                </div>
              </div>
            </div>

            {variantsOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(form.variants || []).map((v, i) => (
                  <div key={i} style={{
                    background: C.over, border: `1px solid ${C.border}`,
                    borderRadius: 8, padding: 12,
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                  }}>
                    <button
                      onClick={() => removeVariantGroup(i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t4, padding: 4, marginTop: 2 }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = C.red)}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = C.t4)}
                    >×</button>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <input style={{ ...inputStyle, padding: '7px 10px' }}
                        placeholder="اسم المجموعة (مثال: المقاس)"
                        value={v.name} onChange={e => setVariantName(i, e.target.value)} />
                      <input style={{ ...inputStyle, padding: '7px 10px' }}
                        placeholder="الخيارات: S, M, L, XL"
                        value={v.options.join(', ')} onChange={e => setVariantOptions(i, e.target.value)} />
                    </div>
                  </div>
                ))}
                <button
                  onClick={addVariantGroup}
                  style={{
                    background: 'none', border: `1px dashed ${C.border}`,
                    borderRadius: 8, padding: '9px 14px', cursor: 'pointer',
                    fontSize: 13, color: C.t3, fontFamily: F, textAlign: 'right',
                  }}
                >
                  + إضافة مجموعة متغيرات
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Drawer footer */}
        <div style={{
          padding: '16px 24px', borderTop: `1px solid ${C.border}`,
          display: 'flex', gap: 10, flexShrink: 0,
        }}>
          <button
            onClick={saveProduct}
            disabled={saving || !form.name?.trim()}
            style={{
              flex: 2, background: saving ? C.t4 : '#fff', color: '#000',
              border: 'none', borderRadius: 8, padding: '10px',
              fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: F, opacity: !form.name?.trim() ? 0.5 : 1,
            }}
          >
            {saving ? 'جار الحفظ…' : 'حفظ المنتج'}
          </button>
          <button
            onClick={closeDrawer}
            style={{
              flex: 1, background: 'none', border: `1px solid ${C.border}`,
              borderRadius: 8, padding: '10px', fontSize: 14, fontWeight: 500,
              color: C.t2, cursor: 'pointer', fontFamily: F,
            }}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  )
}
