'use client'

import {
  useState, useEffect, useRef, useCallback,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  DndContext, closestCenter,
  useSensor, useSensors, PointerSensor,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { marked } from 'marked'
import type {
  LandingPageConfig, WorkspaceProduct, DesignSystem,
} from '@/lib/landing-types'
import { DESIGN_SYSTEMS } from '@/lib/landing-types'
import LandingPageRenderer from '@/app/p/[slug]/LandingPageRenderer'

// ─────────────────────────────────────────────────
// DESIGN SYSTEM CONSTANTS
// ─────────────────────────────────────────────────

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
const F    = "'Geist', -apple-system, sans-serif"
const FAR  = "'Tajawal', system-ui, sans-serif"
const MONO = "'Geist Mono', monospace"

// ─────────────────────────────────────────────────
// TRANSLATIONS
// ─────────────────────────────────────────────────

const T = {
  en: {
    pageTitle:         'Landing Page',
    brandSubtitle:     'Your brand website',
    preview:           'Preview',
    sections:          'Sections',
    style:             'Style',
    saveDraft:         'Save Draft',
    publish:           'Publish →',
    update:            'Update →',
    publishing:        'Publishing...',
    saving:            'Saving...',
    live:              'Live',
    draft:             'Draft',
    generate:          'Generate my landing page',
    productPage:       'Build a page for my hero product',
    premium:           'Make it premium and minimal',
    converts:          'Create a page that converts',
    buildHint:         'Tell me what you want. Nexa reads your Brand Brain and builds.',
    buildTitle:        'Build your landing page',
    brandBrainActive:  'Brand Brain active',
    brandBrainMissing: 'No Brand Brain — results will be basic',
    logoLoaded:        '· Logo loaded',
    productsLoaded:    (n: number) => `· ${n} product${n !== 1 ? 's' : ''} loaded`,
    building:          'Building your page...',
    switchStyle:       'Style:',
    addSection:        '+ Add a section',
    addSectionTitle:   'Add a section',
    dragToReorder:     'Drag to reorder',
    noPage:            'Generate your first landing page',
    noPageHint:        'Type a message on the left to get started',
    placeholder:       'Ask Nexa to build or update your page...',
    uploadHint:        'Upload logo or product photo',
    sectionLabels: {
      hero:         'Hero',
      marquee:      'Ticker Strip',
      statement:    'Statement',
      products:     'Products',
      pull_quote:   'Pull Quote',
      story:        'Brand Story',
      features:     'Features',
      reviews:      'Reviews',
      form:         'Lead Form',
      founder_note: 'Founder Note',
      ingredients:  'Ingredients',
      gallery:      'Gallery',
      cta_banner:   'CTA Banner',
      faq:          'FAQ',
      video:        'Video',
      stats:        'Stats',
      footer:       'Footer',
    } as Record<string, string>,
    addableSections: [
      { type: 'reviews',      label: 'Testimonials',    desc: 'Add customer reviews' },
      { type: 'gallery',      label: 'Photo Gallery',   desc: 'Showcase product photos' },
      { type: 'features',     label: 'Features Grid',   desc: '4 key benefits or features' },
      { type: 'faq',          label: 'FAQ',             desc: 'Answer common questions' },
      { type: 'ingredients',  label: 'Ingredients',     desc: 'What goes into your product' },
      { type: 'founder_note', label: 'Founder Note',    desc: 'Put a human face on the brand' },
      { type: 'cta_banner',   label: 'CTA Banner',      desc: 'Full-width conversion section' },
      { type: 'pull_quote',   label: 'Pull Quote',      desc: 'Feature a customer quote' },
      { type: 'statement',    label: 'Brand Statement', desc: 'Your position in the market' },
      { type: 'stats',        label: 'Stats Bar',       desc: 'Key numbers and proof points' },
    ],
  },
  ar: {
    pageTitle:         'الصفحة الترويجية',
    brandSubtitle:     'موقع علامتك التجارية',
    preview:           'معاينة',
    sections:          'الأقسام',
    style:             'الأسلوب',
    saveDraft:         'حفظ مسودة',
    publish:           'نشر ←',
    update:            'تحديث ←',
    publishing:        'جارٍ النشر...',
    saving:            'جارٍ الحفظ...',
    live:              'منشور',
    draft:             'مسودة',
    generate:          'أنشئ صفحتي الترويجية',
    productPage:       'ابنِ صفحة لمنتجي الرئيسي',
    premium:           'اجعلها راقية ومنيمال',
    converts:          'صفحة عالية التحويل',
    buildHint:         'أخبرني بما تريد. Nexa تقرأ Brand Brain الخاص بك وتبني.',
    buildTitle:        'ابنِ صفحتك الترويجية',
    brandBrainActive:  'Brand Brain نشط',
    brandBrainMissing: 'لا Brand Brain — النتائج ستكون أساسية',
    logoLoaded:        '· شعار محمّل',
    productsLoaded:    (n: number) => `· ${n} منتج${n > 1 ? 'ات' : ''} محمّل`,
    building:          'جارٍ بناء صفحتك...',
    switchStyle:       'الأسلوب:',
    addSection:        '+ إضافة قسم',
    addSectionTitle:   'إضافة قسم',
    dragToReorder:     'اسحب لإعادة الترتيب',
    noPage:            'أنشئ صفحتك الترويجية الأولى',
    noPageHint:        'اكتب رسالة على اليسار للبدء',
    placeholder:       'اطلب من Nexa بناء أو تعديل صفحتك...',
    uploadHint:        'ارفع شعاراً أو صورة منتج',
    sectionLabels: {
      hero:         'الهيرو',
      marquee:      'الشريط المتحرك',
      statement:    'موقف العلامة',
      products:     'المنتجات',
      pull_quote:   'اقتباس بارز',
      story:        'قصة العلامة',
      features:     'المميزات',
      reviews:      'التقييمات',
      form:         'نموذج التواصل',
      founder_note: 'كلمة المؤسس',
      ingredients:  'المكونات',
      gallery:      'معرض الصور',
      cta_banner:   'بانر التحويل',
      faq:          'الأسئلة الشائعة',
      video:        'فيديو',
      stats:        'الإحصائيات',
      footer:       'التذييل',
    } as Record<string, string>,
    addableSections: [
      { type: 'reviews',      label: 'تقييمات العملاء',  desc: 'أضف آراء العملاء' },
      { type: 'gallery',      label: 'معرض الصور',       desc: 'اعرض صور المنتجات' },
      { type: 'features',     label: 'شبكة المميزات',    desc: '٤ فوائد أو ميزات رئيسية' },
      { type: 'faq',          label: 'الأسئلة الشائعة',  desc: 'أجب على أسئلة العملاء' },
      { type: 'ingredients',  label: 'المكونات',          desc: 'ما يدخل في منتجك' },
      { type: 'founder_note', label: 'كلمة المؤسس',      desc: 'إنسانية العلامة' },
      { type: 'cta_banner',   label: 'بانر التحويل',     desc: 'قسم تحويل بعرض كامل' },
      { type: 'pull_quote',   label: 'اقتباس بارز',      desc: 'أبرز تقييماً مميزاً' },
      { type: 'statement',    label: 'موقف العلامة',     desc: 'موقعك في السوق' },
      { type: 'stats',        label: 'شريط الإحصائيات',  desc: 'أرقام وإثباتات' },
    ],
  },
}

// ─────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────

interface Message {
  id:        string
  role:      'user' | 'nexa'
  content:   string
  timestamp: Date
}

interface Props {
  lang: 'en' | 'ar'
}

// ─────────────────────────────────────────────────
// SECTION FIELD INPUT
// Defined at module level to avoid React unmount/remount
// ─────────────────────────────────────────────────

function SectionFieldInput({
  label, initialValue, multiline, rows,
  isAr, onChange,
}: {
  label:        string
  initialValue: string
  multiline?:   boolean
  rows?:        number
  isAr:         boolean
  onChange:     (v: string) => void
}) {
  const [val, setVal] = useState(initialValue)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const dir   = isAr ? 'rtl' : 'ltr'

  function handleChange(v: string) {
    setVal(v)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => onChange(v), 600)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '8px 10px',
    color: C.t1,
    fontSize: 12,
    fontFamily: isAr ? FAR : F,
    outline: 'none',
    resize: multiline ? 'vertical' : 'none',
    direction: dir,
    boxSizing: 'border-box',
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        fontSize: 10, fontWeight: 600,
        color: C.t4, marginBottom: 5,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontFamily: F,
        direction: 'ltr',
      }}>
        {label}
      </div>
      {multiline ? (
        <textarea
          value={val}
          onChange={e => handleChange(e.target.value)}
          rows={rows || 2}
          style={{ ...inputStyle, minHeight: (rows || 2) * 22 + 16 }}
        />
      ) : (
        <input
          value={val}
          onChange={e => handleChange(e.target.value)}
          style={inputStyle}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────
// SECTION FIELDS
// Editable fields for each section type
// ─────────────────────────────────────────────────

function SectionFields({
  sectionType, config, onUpdate, lang, products,
}: {
  sectionType: string
  config:      LandingPageConfig
  onUpdate:    (section: string, data: any) => void
  lang:        'en' | 'ar'
  products:    WorkspaceProduct[]
}) {
  const isAr = lang === 'ar'
  const dir  = isAr ? 'rtl' : 'ltr'
  const data = (config as any)[sectionType] || {}

  function field(label: string, fieldKey: string, multiline = false, rows = 2) {
    return (
      <SectionFieldInput
        key={`${sectionType}-${fieldKey}`}
        label={label}
        initialValue={data[fieldKey] || ''}
        multiline={multiline}
        rows={rows}
        isAr={isAr}
        onChange={v => onUpdate(sectionType, { ...data, [fieldKey]: v })}
      />
    )
  }

  const pad: React.CSSProperties = {
    padding: '4px 16px 16px',
    display: 'flex',
    flexDirection: 'column',
    borderTop: `1px solid ${C.borderS}`,
    direction: dir,
    fontFamily: isAr ? FAR : F,
  }

  switch (sectionType) {
    case 'hero':
      return (
        <div style={pad}>
          {field('Eyebrow',         'eyebrow')}
          {field('Headline line 1', 'headline_line1')}
          {field('Headline line 2', 'headline_line2')}
          {field('Italic part',     'headline_italic')}
          {field('Body copy',       'body', true, 3)}
          {field('Primary CTA',     'cta_primary')}
          {field('Secondary CTA',   'cta_secondary')}
        </div>
      )

    case 'story':
      return (
        <div style={pad}>
          {field('Tag',          'tag')}
          {field('Headline',     'headline')}
          {field('Italic part',  'headline_italic')}
          {field('Body',         'body', true, 4)}
        </div>
      )

    case 'products':
      return (
        <div style={pad}>
          {field('Section title',    'section_title')}
          {field('Section subtitle', 'section_subtitle')}
          {products.length > 0 && (
            <div style={{
              marginTop: 8,
              padding: '10px 12px',
              background: C.cyanD,
              border: `1px solid ${C.cyanB}`,
              borderRadius: 8,
              fontSize: 11, color: C.cyan,
              fontFamily: F,
            }}>
              {products.length} product{products.length !== 1 ? 's' : ''} loaded from your catalog.{' '}
              <a href="/dashboard/products" style={{ color: C.cyan }}>
                Manage products →
              </a>
            </div>
          )}
        </div>
      )

    case 'reviews':
      return (
        <div style={pad}>
          {field('Section headline', 'headline')}
          {field('Rating score',     'score')}
          {field('Review count',     'count')}
          <div style={{ fontSize: 10, color: C.t4, marginTop: 4, fontFamily: F }}>
            Edit individual reviews by regenerating via chat.
          </div>
        </div>
      )

    case 'form':
      return (
        <div style={pad}>
          {field('Section tag',     'tag')}
          {field('Headline line 1', 'headline_line1')}
          {field('Headline line 2', 'headline_line2')}
          {field('Body',            'body', true, 2)}
          {field('Submit button',   'cta')}
          {field('Privacy note',    'note')}
        </div>
      )

    case 'marquee':
      return (
        <div style={pad}>
          <div style={{ fontSize: 10, color: C.t4, fontFamily: F, marginBottom: 8 }}>
            Items (edit via chat for best results)
          </div>
          {((data.items || []) as string[]).map((item: string, i: number) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <input
                defaultValue={item}
                onChange={e => {
                  const newItems = [...(data.items || [])]
                  newItems[i] = e.target.value
                  onUpdate(sectionType, { ...data, items: newItems })
                }}
                style={{
                  width: '100%',
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  padding: '6px 8px',
                  color: C.t1, fontSize: 11,
                  fontFamily: isAr ? FAR : F,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          ))}
        </div>
      )

    case 'statement':
      return (
        <div style={pad}>
          {field('Headline',    'left_headline')}
          {field('Italic part', 'left_italic')}
          {field('Body',        'body', true, 3)}
        </div>
      )

    case 'pull_quote':
      return (
        <div style={pad}>
          {field('Quote',    'quote', true, 2)}
          {field('Author',   'author')}
          {field('Location', 'location')}
        </div>
      )

    case 'founder_note':
      return (
        <div style={pad}>
          {field('The letter', 'text', true, 4)}
          {field('Name',       'name')}
          {field('Role',       'role')}
        </div>
      )

    case 'footer':
      return (
        <div style={pad}>
          {field('Tagline', 'tagline', true, 2)}
        </div>
      )

    default:
      return (
        <div style={pad}>
          <div style={{ fontSize: 11, color: C.t3, fontFamily: F, padding: '8px 0' }}>
            Edit this section via chat for best results.
          </div>
        </div>
      )
  }
}

// ─────────────────────────────────────────────────
// SORTABLE SECTION ITEM
// ─────────────────────────────────────────────────

function SortableSection({
  id, sectionType, config, isExpanded,
  onToggle, onDelete, onUpdate, lang, products,
}: {
  id:          string
  sectionType: string
  config:      LandingPageConfig
  isExpanded:  boolean
  onToggle:    () => void
  onDelete:    () => void
  onUpdate:    (section: string, data: any) => void
  lang:        'en' | 'ar'
  products:    WorkspaceProduct[]
}) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id })

  const t    = T[lang]
  const isAr = lang === 'ar'
  const dir  = isAr ? 'rtl' : 'ltr'
  const label = t.sectionLabels[sectionType] || sectionType

  const sectionData = (config as any)[sectionType]
  const previewText: string = sectionData?.headline
    || sectionData?.headline_line1
    || sectionData?.eyebrow
    || sectionData?.tag
    || sectionData?.quote
    || sectionData?.section_title
    || ''

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    marginBottom: 8,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{
        background: isExpanded ? C.over : C.surface,
        border: `1px solid ${isExpanded ? C.cyanB : C.border}`,
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'border-color 0.15s',
      }}>
        {/* Header row */}
        <div style={{
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          direction: dir,
        }}>
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
              color: C.t4,
              display: 'flex',
              flexShrink: 0,
              padding: '2px 4px',
            }}>
            <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
              <circle cx="3" cy="3" r="1.5"/>
              <circle cx="9" cy="3" r="1.5"/>
              <circle cx="3" cy="8" r="1.5"/>
              <circle cx="9" cy="8" r="1.5"/>
              <circle cx="3" cy="13" r="1.5"/>
              <circle cx="9" cy="13" r="1.5"/>
            </svg>
          </div>

          {/* Label + preview */}
          <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={onToggle}>
            <div style={{
              fontSize: 13, fontWeight: 600,
              color: isExpanded ? C.cyan : C.t1,
              marginBottom: 2,
            }}>
              {label}
            </div>
            {previewText && !isExpanded && (
              <div style={{
                fontSize: 11, color: C.t4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {previewText}
              </div>
            )}
          </div>

          {/* Delete */}
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            style={{
              background: 'none', border: 'none',
              cursor: 'pointer', color: C.t4,
              padding: '4px', display: 'flex',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = C.red)}
            onMouseLeave={e => (e.currentTarget.style.color = C.t4)}>
            <svg width="13" height="13" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
            </svg>
          </button>

          {/* Chevron */}
          <div
            onClick={onToggle}
            style={{
              color: C.t4, cursor: 'pointer',
              transform: isExpanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
              display: 'flex',
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>

        {/* Expanded fields */}
        {isExpanded && (
          <SectionFields
            sectionType={sectionType}
            config={config}
            onUpdate={onUpdate}
            lang={lang}
            products={products}
          />
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────
// ACCENT COLOR PICKER
// ─────────────────────────────────────────────────

function AccentPicker({ value, onChange }: {
  value:    string
  onChange: (color: string) => void
}) {
  const presets = [
    '#00AAFF','#E8200A','#8B6914','#9A7B3C',
    '#8C5E1A','#7C3AED','#059669','#DB2777',
    '#F59E0B','#0891B2','#FFFFFF','#000000',
  ]
  const [hex, setHex] = useState(value)

  return (
    <div style={{ padding: '12px 16px 16px' }}>
      <div style={{
        fontSize: 10, fontWeight: 600,
        color: C.t4, marginBottom: 10,
        letterSpacing: '0.08em',
        textTransform: 'uppercase', fontFamily: F,
      }}>
        Accent Color
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {presets.map(c => (
          <div
            key={c}
            onClick={() => { setHex(c); onChange(c) }}
            style={{
              width: 24, height: 24, borderRadius: '50%',
              background: c, cursor: 'pointer',
              border: value === c ? '2px solid #fff' : '2px solid transparent',
              transition: 'border 0.15s', boxSizing: 'border-box',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="color"
          value={hex}
          onChange={e => { setHex(e.target.value); onChange(e.target.value) }}
          style={{
            width: 32, height: 32, borderRadius: 6,
            border: `1px solid ${C.border}`,
            cursor: 'pointer', background: 'none', padding: 0,
          }}
        />
        <input
          value={hex}
          onChange={e => {
            setHex(e.target.value)
            if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value))
              onChange(e.target.value)
          }}
          style={{
            flex: 1,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 6, padding: '6px 8px',
            color: C.t1, fontSize: 12,
            fontFamily: MONO, outline: 'none',
          }}
          placeholder="#hex"
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────

export default function LandingBuilder({ lang }: Props) {
  const isAr = lang === 'ar'
  const dir  = isAr ? 'rtl' : 'ltr'
  const t    = T[lang]
  const fnt  = isAr ? FAR : F
  const supabase = createClient()

  // ── State ──────────────────────────────────────

  const [messages,      setMessages]      = useState<Message[]>([])
  const [input,         setInput]         = useState('')
  const [config,        setConfig]        = useState<LandingPageConfig | null>(null)
  const [products,      setProducts]      = useState<WorkspaceProduct[]>([])
  const [generating,    setGenerating]    = useState(false)
  const [autoSaving,    setAutoSaving]    = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [publishing,    setPublishing]    = useState(false)
  const [isPublished,   setIsPublished]   = useState(false)
  const [pageUrl,       setPageUrl]       = useState<string | null>(null)
  const [existingSlug,  setExistingSlug]  = useState<string | null>(null)
  const [activeTab,     setActiveTab]     = useState<'preview' | 'sections' | 'style'>('preview')
  const [wsId,          setWsId]          = useState<string | null>(null)
  const [wsName,        setWsName]        = useState('Your Brand')
  const [hasBrandBrain, setHasBrandBrain] = useState(false)
  const [hasLogo,       setHasLogo]       = useState(false)
  const [forcedDs,      setForcedDs]      = useState<DesignSystem | null>(null)
  const [showSwitcher,  setShowSwitcher]  = useState(false)
  const [previewKey,    setPreviewKey]    = useState(0)
  const [uploading,     setUploading]     = useState(false)
  const [showPicker,    setShowPicker]    = useState(false)
  const [addingSection, setAddingSection] = useState<string | null>(null)
  const [expandedSects, setExpandedSects] = useState<Set<string>>(new Set())
  const [sectionsOrder, setSectionsOrder] = useState<string[]>([])
  const [toast,         setToast]         = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef   = useRef<HTMLInputElement>(null)
  const saveTimerRef   = useRef<ReturnType<typeof setTimeout>>()

  // ── DnD Sensors ────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // ── Helpers ────────────────────────────────────

  function addMessage(role: 'user' | 'nexa', content: string) {
    setMessages(prev => [...prev, {
      id:        Date.now().toString(),
      role, content,
      timestamp: new Date(),
    }])
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => { scrollToBottom() }, [messages])

  // ── Load data ──────────────────────────────────

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: member } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()
    if (!member) return

    const wid = (member as any).workspace_id as string
    setWsId(wid)

    const [wsRes, brandRes, logoRes, pageRes, productsRes] = await Promise.all([
      supabase.from('workspaces')
        .select('brand_name, name')
        .eq('id', wid).single(),
      supabase.from('brand_assets')
        .select('file_name')
        .eq('workspace_id', wid)
        .eq('file_name', 'nexa_brand_intelligence.json')
        .single(),
      supabase.from('brand_assets')
        .select('file_url')
        .eq('workspace_id', wid)
        .eq('type', 'logo')
        .limit(1)
        .single(),
      supabase.from('landing_pages')
        .select('*')
        .eq('workspace_id', wid)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single(),
      supabase.from('workspace_products')
        .select('*')
        .eq('workspace_id', wid)
        .eq('active', true)
        .order('sort_order', { ascending: true }),
    ])

    setWsName(
      (wsRes.data as any)?.brand_name ||
      (wsRes.data as any)?.name ||
      'Your Brand'
    )
    setHasBrandBrain(!!brandRes.data)
    setHasLogo(!!(logoRes.data as any)?.file_url)
    setProducts((productsRes.data || []) as WorkspaceProduct[])

    if (pageRes.data) {
      const page = pageRes.data as any
      setConfig(page.config as LandingPageConfig)
      setIsPublished(page.status === 'published')
      setExistingSlug(page.slug)
      setSectionsOrder(page.config?.sections_order || [])
      setShowSwitcher(true)
      if (page.status === 'published') {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nexaa.cc'
        setPageUrl(`${appUrl}/p/${page.slug}`)
      }
    }
  }

  // ── Auto-save (debounced) ──────────────────────

  const debouncedSave = useCallback((cfg: LandingPageConfig) => {
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      if (!wsId) return
      setAutoSaving(true)
      try {
        const res = await fetch('/api/landing-page/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspace_id: wsId,
            config: cfg,
            publish: false,
          }),
        })
        const d = await res.json()
        if (d.slug) {
          setExistingSlug(d.slug)
          setPreviewKey(k => k + 1)
        }
      } finally {
        setAutoSaving(false)
      }
    }, 1200)
  }, [wsId])

  // ── Update config ──────────────────────────────

  function updateConfig(updates: Partial<LandingPageConfig>) {
    setConfig(prev => {
      if (!prev) return prev
      const next = { ...prev, ...updates }
      debouncedSave(next)
      return next
    })
  }

  const updateSection = useCallback((section: string, data: any) => {
    setConfig(prev => {
      if (!prev) return prev
      const next = { ...prev, [section]: data }
      debouncedSave(next)
      return next
    })
  }, [debouncedSave])

  // ── Send message ───────────────────────────────

  async function sendMessage(text?: string) {
    const msg = (text || input).trim()
    if (!msg || !wsId || generating) return
    setInput('')
    addMessage('user', msg)
    setGenerating(true)

    try {
      const res = await fetch('/api/landing-page/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id:           wsId,
          conversation:           msg,
          history:                messages.slice(-8).map(m => ({
            role:    m.role === 'nexa' ? 'assistant' : 'user',
            content: m.content,
          })),
          lang,
          design_system_override: forcedDs || undefined,
          existing_config:        config || undefined,
        }),
      })

      const data = await res.json()

      if (data.needs_info) {
        addMessage('nexa', data.nexa_message)
        return
      }

      if (data.config) {
        setConfig(data.config)
        setSectionsOrder(data.config.sections_order || [])
        setShowSwitcher(true)
        addMessage('nexa', data.nexa_message || '')

        setAutoSaving(true)
        const saveRes = await fetch('/api/landing-page/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspace_id: wsId,
            config:       data.config,
            conversation: messages,
            publish:      false,
          }),
        })
        const saved = await saveRes.json()
        if (saved.slug) {
          setExistingSlug(saved.slug)
          setPreviewKey(k => k + 1)
        }
        setAutoSaving(false)
      }
    } catch {
      addMessage('nexa', isAr
        ? 'حدث خطأ. حاول مرة أخرى.'
        : 'Something went wrong. Please try again.')
    } finally {
      setGenerating(false)
      scrollToBottom()
    }
  }

  // ── Save / Publish ─────────────────────────────

  async function handleSave(publishFlag = false) {
    if (!config || !wsId) return
    publishFlag ? setPublishing(true) : setSaving(true)

    try {
      const res = await fetch('/api/landing-page/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: wsId,
          config,
          conversation: messages,
          publish:      publishFlag,
        }),
      })
      const d = await res.json()

      if (d.success) {
        setExistingSlug(d.slug)
        if (publishFlag) {
          setIsPublished(true)
          setPageUrl(d.url)
          setPreviewKey(k => k + 1)
          addMessage('nexa', isAr
            ? `صفحتك منشورة الآن:\n**${d.url}**\n\nشاركها في أي مكان.`
            : `Your page is live at:\n**${d.url}**\n\nShare it anywhere. Changes update immediately.`
          )
        } else {
          showToast(isAr ? 'تم حفظ المسودة' : 'Draft saved')
        }
      }
    } finally {
      publishFlag ? setPublishing(false) : setSaving(false)
    }
  }

  // ── File upload ────────────────────────────────

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !wsId) return

    addMessage('user', isAr ? `رفع: ${file.name}` : `Uploaded: ${file.name}`)
    setUploading(true)

    try {
      const ext  = file.name.split('.').pop() || 'jpg'
      const path = `${wsId}/uploads/${Date.now()}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('brand-assets')
        .upload(path, file, { upsert: true })

      if (uploadErr) throw uploadErr

      const { data: urlData } = supabase.storage
        .from('brand-assets')
        .getPublicUrl(path)

      const fileUrl    = urlData.publicUrl
      const isLogo     = file.name.toLowerCase().includes('logo')
      const assetType  = isLogo ? 'logo' : 'product_photo'

      await supabase.from('brand_assets').insert({
        workspace_id: wsId,
        type:         assetType,
        file_url:     fileUrl,
        file_name:    file.name,
      })

      if (isLogo && config) {
        const updated = { ...config, logo_url: fileUrl }
        setConfig(updated)
        debouncedSave(updated)
        setHasLogo(true)
      } else if (config) {
        const updated = {
          ...config,
          product_images: [...(config.product_images || []), fileUrl],
        }
        setConfig(updated)
        debouncedSave(updated)
      }

      addMessage('nexa', isLogo
        ? (isAr ? 'تم رفع الشعار وإضافته للصفحة.' : 'Logo uploaded and added to your page.')
        : (isAr ? 'تم رفع الصورة. قل لي إذا تريد إضافتها للصفحة.' : 'Photo uploaded. Tell me if you want to use it on the page.')
      )
    } catch {
      addMessage('nexa', isAr ? 'فشل الرفع. حاول مرة أخرى.' : 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── Drag end ───────────────────────────────────

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIdx  = sectionsOrder.indexOf(active.id as string)
    const newIdx  = sectionsOrder.indexOf(over.id as string)
    const newOrder = arrayMove(sectionsOrder, oldIdx, newIdx)

    setSectionsOrder(newOrder)
    if (config) {
      const updated = { ...config, sections_order: newOrder as any }
      setConfig(updated)
      debouncedSave(updated)
    }
  }

  // ── Add section ────────────────────────────────

  async function addSection(sectionType: string) {
    if (!wsId || !config) return
    setShowPicker(false)
    setAddingSection(sectionType)

    try {
      const res = await fetch('/api/landing-page/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id:    wsId,
          conversation:    `Add a ${sectionType} section.`,
          history:         [],
          lang,
          section_only:    sectionType,
          existing_config: config,
        }),
      })
      const data = await res.json()

      if (data.section_data) {
        const newOrder = [
          ...sectionsOrder.filter(s => s !== 'footer'),
          sectionType,
          ...(sectionsOrder.includes('footer') ? ['footer'] : []),
        ]
        const updated = {
          ...config,
          [sectionType]:  data.section_data,
          sections_order: newOrder as any,
        }
        setConfig(updated)
        setSectionsOrder(newOrder)
        debouncedSave(updated)
        addMessage('nexa', data.nexa_message || '')
      }
    } catch {
      addMessage('nexa', isAr ? 'فشل إضافة القسم.' : 'Failed to add section.')
    } finally {
      setAddingSection(null)
    }
  }

  // ── Style switch (instant) ─────────────────────

  function switchDesignSystem(ds: DesignSystem) {
    setForcedDs(ds)
    if (config) {
      const dsInfo  = DESIGN_SYSTEMS[ds]
      const updated = { ...config, design_system: ds }
      setConfig(updated)
      debouncedSave(updated)
      addMessage('nexa', isAr
        ? `تم التحويل إلى **${dsInfo.nameAr}**.`
        : `Switched to **${dsInfo.name}** — ${dsInfo.description}`
      )
    }
  }

  // ── Status ─────────────────────────────────────

  const statusText  = autoSaving
    ? (isAr ? 'جارٍ الحفظ...' : 'Saving...')
    : isPublished ? t.live : t.draft

  const statusColor = autoSaving ? C.cyan : isPublished ? C.green : C.t4

  // ── Render ─────────────────────────────────────

  return (
    <div style={{
      display: 'flex', height: '100vh',
      fontFamily: fnt, background: C.bg,
      overflow: 'hidden', direction: dir,
    }}>

      {/* ════════════════ LEFT PANEL — CHAT ════════════════ */}

      <div style={{
        width: 380, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        background: C.surface,
        borderRight: isAr ? 'none' : `1px solid ${C.border}`,
        borderLeft:  isAr ? `1px solid ${C.border}` : 'none',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700,
            letterSpacing: '0.10em', color: C.cyan,
            textTransform: 'uppercase', marginBottom: 4, fontFamily: F,
          }}>
            {t.pageTitle}
          </div>
          <div style={{
            fontSize: 18, fontWeight: 700,
            color: C.t1, letterSpacing: '-0.02em', marginBottom: 4,
          }}>
            {wsName}
          </div>

          {pageUrl && (
            <a href={pageUrl} target="_blank" rel="noopener noreferrer"
              style={{
                fontSize: 11, color: C.cyan,
                textDecoration: 'none',
                display: 'flex', alignItems: 'center',
                gap: 4, marginBottom: 8,
              }}>
              {pageUrl.replace('https://', '')} ↗
            </a>
          )}

          {config && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: C.cyanD, border: `1px solid ${C.cyanB}`,
              borderRadius: 100, padding: '3px 10px',
              fontSize: 11, color: C.cyan,
            }}>
              {DESIGN_SYSTEMS[config.design_system]?.name || config.design_system}
            </div>
          )}
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '20px',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>

          {messages.length === 0 ? (
            /* Welcome state */
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              height: '100%', gap: 0,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: C.cyanD, border: `1px solid ${C.cyanB}`,
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', marginBottom: 16,
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24"
                  fill="none" stroke={C.cyan} strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18M9 21V9"/>
                </svg>
              </div>

              <div style={{
                fontSize: 15, fontWeight: 600, color: C.t1,
                textAlign: 'center', marginBottom: 6,
              }}>
                {t.buildTitle}
              </div>
              <div style={{
                fontSize: 12, color: C.t3, textAlign: 'center',
                maxWidth: 240, lineHeight: 1.6, marginBottom: 24,
              }}>
                {t.buildHint}
              </div>

              {/* Quick chips */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: 8, width: '100%',
              }}>
                {[t.generate, t.productPage, t.premium, t.converts].map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(chip)}
                    style={{
                      background: C.over, border: `1px solid ${C.border}`,
                      borderRadius: 10, padding: '10px 12px',
                      fontSize: 12, color: C.t2, cursor: 'pointer',
                      textAlign: isAr ? 'right' : 'left',
                      lineHeight: 1.4, fontFamily: fnt,
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = C.cyanB)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
                    {chip}
                  </button>
                ))}
              </div>

              {/* Brand Brain status */}
              <div style={{
                display: 'flex', alignItems: 'center',
                gap: 6, marginTop: 20, fontSize: 11, color: C.t3,
                flexWrap: 'wrap', justifyContent: 'center',
              }}>
                <div style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: hasBrandBrain ? C.green : C.t4,
                }}/>
                {hasBrandBrain ? t.brandBrainActive : t.brandBrainMissing}
                {hasLogo && <span style={{ color: C.t4 }}>{t.logoLoaded}</span>}
                {products.length > 0 && (
                  <span style={{ color: C.t4 }}>{t.productsLoaded(products.length)}</span>
                )}
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: msg.role === 'user'
                    ? (isAr ? 'flex-start' : 'flex-end')
                    : (isAr ? 'flex-end' : 'flex-start'),
                }}>

                {msg.role === 'nexa' && (
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    gap: 8, marginBottom: 6,
                    flexDirection: isAr ? 'row-reverse' : 'row',
                  }}>
                    <div style={{
                      width: 20, height: 20,
                      borderRadius: 5, overflow: 'hidden', flexShrink: 0,
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/favicon.png" alt="Nexa"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: C.t4, fontFamily: F }}>
                      Nexa
                    </span>
                  </div>
                )}

                {msg.role === 'nexa' ? (
                  <div
                    style={{
                      paddingLeft:  isAr ? 0 : 28,
                      paddingRight: isAr ? 28 : 0,
                      fontSize: 13, color: C.t2,
                      lineHeight: 1.75, maxWidth: '92%', fontFamily: fnt,
                    }}
                    dangerouslySetInnerHTML={{
                      __html: marked.parse(msg.content) as string,
                    }}
                  />
                ) : (
                  <div style={{
                    background: C.cyanD, border: `1px solid ${C.cyanB}`,
                    borderRadius: isAr ? '12px 12px 12px 4px' : '12px 12px 4px 12px',
                    padding: '10px 14px',
                    fontSize: 13, color: C.t1,
                    maxWidth: '80%', lineHeight: 1.65, fontFamily: fnt,
                  }}>
                    {msg.content}
                  </div>
                )}
              </div>
            ))
          )}

          {generating && (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: isAr ? 'flex-end' : 'flex-start',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
                flexDirection: isAr ? 'row-reverse' : 'row',
              }}>
                <div style={{ width: 20, height: 20, borderRadius: 5, overflow: 'hidden' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/favicon.png" alt="Nexa"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: C.t4, fontFamily: F }}>
                  Nexa
                </span>
              </div>
              <div style={{
                paddingLeft:  isAr ? 0 : 28,
                paddingRight: isAr ? 28 : 0,
                display: 'flex', gap: 5,
                alignItems: 'center', height: 24,
              }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: C.cyan,
                    animation: `dotpulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}/>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef}/>
        </div>

        {/* Design system switcher */}
        {showSwitcher && (
          <div style={{
            borderTop: `1px solid ${C.borderS}`,
            padding: '10px 20px', flexShrink: 0,
            display: 'flex', alignItems: 'center',
            gap: 8, flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 10, color: C.t4, fontFamily: F }}>{t.switchStyle}</span>
            {(['editorial', 'minimal', 'bold', 'warm'] as DesignSystem[]).map(ds => {
              const isActive = config?.design_system === ds
              return (
                <button
                  key={ds}
                  onClick={() => switchDesignSystem(ds)}
                  style={{
                    fontSize: 11, fontWeight: 500,
                    padding: '4px 12px', borderRadius: 100,
                    border: `1px solid ${isActive ? C.cyanB : C.border}`,
                    background: isActive ? C.cyanD : 'transparent',
                    color: isActive ? C.cyan : C.t3,
                    cursor: 'pointer', fontFamily: F, transition: 'all 0.15s',
                  }}>
                  {DESIGN_SYSTEMS[ds].name}
                </button>
              )
            })}
          </div>
        )}

        {/* Input area */}
        <div style={{
          padding: '12px 20px',
          borderTop: `1px solid ${C.border}`,
          flexShrink: 0,
        }}>
          <div style={{
            fontSize: 10, color: C.t4, marginBottom: 8,
            display: 'flex', alignItems: 'center', gap: 6, fontFamily: F,
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: hasBrandBrain ? C.green : C.t4,
            }}/>
            {hasBrandBrain ? t.brandBrainActive : t.brandBrainMissing}
          </div>

          <div style={{ position: 'relative' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder={t.placeholder}
              rows={2}
              style={{
                width: '100%',
                background: C.over, border: `1px solid ${C.border}`,
                borderRadius: 12, padding: '11px 80px 11px 14px',
                fontSize: 13, color: C.t1, fontFamily: fnt,
                resize: 'none', outline: 'none',
                boxSizing: 'border-box', direction: dir,
                minHeight: 44, maxHeight: 120,
              }}
              onFocus={e  => (e.currentTarget.style.borderColor = 'rgba(0,170,255,0.35)')}
              onBlur={e   => (e.currentTarget.style.borderColor = C.border)}
            />

            {/* Upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title={t.uploadHint}
              style={{
                position: 'absolute', bottom: 8,
                right: isAr ? 'auto' : 44, left: isAr ? 44 : 'auto',
                width: 28, height: 28, borderRadius: '50%',
                background: C.surface, border: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: uploading ? C.cyan : C.t3,
              }}>
              <svg width="13" height="13" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
              </svg>
            </button>

            {/* Send button */}
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || generating}
              style={{
                position: 'absolute', bottom: 8,
                right: isAr ? 'auto' : 8, left: isAr ? 8 : 'auto',
                width: 28, height: 28, borderRadius: '50%',
                background: input.trim() && !generating ? C.cyan : C.over,
                border: input.trim() && !generating ? 'none' : `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: input.trim() && !generating ? 'pointer' : 'default',
                transition: 'all 0.15s',
              }}>
              <svg width="13" height="13" viewBox="0 0 24 24"
                fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* ════════════════ RIGHT PANEL ════════════════ */}

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', background: C.bg,
      }}>

        {/* Top bar */}
        <div style={{
          height: 52, flexShrink: 0,
          borderBottom: `1px solid ${C.border}`,
          padding: '0 20px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', direction: dir,
        }}>

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: 0, height: 52,
            flexDirection: isAr ? 'row-reverse' : 'row',
          }}>
            {(['preview', 'sections', 'style'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  height: 52, padding: '0 16px',
                  background: 'none', border: 'none',
                  borderBottom: activeTab === tab
                    ? `2px solid ${C.cyan}` : '2px solid transparent',
                  color: activeTab === tab ? C.t1 : C.t3,
                  fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', fontFamily: fnt,
                  transition: 'color 0.15s',
                }}>
                {tab === 'preview' ? t.preview : tab === 'sections' ? t.sections : t.style}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex', gap: 10, alignItems: 'center',
            flexDirection: isAr ? 'row-reverse' : 'row',
          }}>
            {/* Status dot */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: statusColor,
                animation: autoSaving ? 'pulse 1s ease infinite' : 'none',
              }}/>
              <span style={{ fontSize: 11, color: statusColor, fontFamily: F }}>
                {statusText}
              </span>
            </div>

            {pageUrl && existingSlug && (
              <a
                href={pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: C.cyanD, border: `1px solid ${C.cyanB}`,
                  color: C.cyan, fontSize: 11,
                  padding: '4px 12px', borderRadius: 100,
                  textDecoration: 'none', fontFamily: F,
                }}>
                {existingSlug.slice(0, 20)}... ↗
              </a>
            )}

            <button
              onClick={() => handleSave(false)}
              disabled={!config || saving}
              style={{
                padding: '7px 16px', borderRadius: 8,
                background: C.surface, border: `1px solid ${C.border}`,
                color: C.t2, fontSize: 12, fontWeight: 500,
                cursor: config ? 'pointer' : 'not-allowed', fontFamily: fnt,
              }}>
              {saving ? t.saving : t.saveDraft}
            </button>

            <button
              onClick={() => handleSave(true)}
              disabled={!config || publishing}
              style={{
                padding: '7px 16px', borderRadius: 8,
                background: config ? '#FFFFFF' : C.surface,
                border: 'none',
                color: config ? '#0C0C0C' : C.t4,
                fontSize: 12, fontWeight: 700,
                cursor: config ? 'pointer' : 'not-allowed', fontFamily: fnt,
              }}>
              {publishing ? t.publishing : isPublished ? t.update : t.publish}
            </button>
          </div>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>

          {!config ? (
            /* Empty state */
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              height: '100%', gap: 12,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: C.cyanD, border: `1px solid ${C.cyanB}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24"
                  fill="none" stroke={C.cyan} strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18M9 21V9"/>
                </svg>
              </div>
              <div style={{ fontSize: 14, color: C.t2, fontFamily: fnt }}>{t.noPage}</div>
              <div style={{ fontSize: 12, color: C.t3, fontFamily: fnt }}>{t.noPageHint}</div>
            </div>

          ) : activeTab === 'preview' ? (
            /* Live preview — React component scaled to fit panel */
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
              <div style={{
                transform: 'scale(0.75)',
                transformOrigin: 'top left',
                width: '133.33%', height: '133.33%',
                overflow: 'auto',
                pointerEvents: 'none', userSelect: 'none',
              }}>
                <LandingPageRenderer
                  key={`${config.design_system}-${previewKey}`}
                  page={{
                    config,
                    workspace_id: wsId || '',
                    slug:         existingSlug || 'preview',
                    status:       isPublished ? 'published' : 'draft',
                  }}
                  products={products}
                  isPreview={true}
                />
              </div>
            </div>

          ) : activeTab === 'sections' ? (
            /* Sections editor */
            <div style={{ height: '100%', overflowY: 'auto', padding: '20px', direction: dir }}>
              <div style={{
                fontSize: 11, color: C.t4, marginBottom: 16, fontFamily: F,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
                {t.dragToReorder}
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}>
                <SortableContext items={sectionsOrder} strategy={verticalListSortingStrategy}>
                  {sectionsOrder.map(sectionType => (
                    <SortableSection
                      key={sectionType}
                      id={sectionType}
                      sectionType={sectionType}
                      config={config}
                      isExpanded={expandedSects.has(sectionType)}
                      onToggle={() => setExpandedSects(prev => {
                        const next = new Set(prev)
                        next.has(sectionType) ? next.delete(sectionType) : next.add(sectionType)
                        return next
                      })}
                      onDelete={() => {
                        const newOrder = sectionsOrder.filter(s => s !== sectionType)
                        setSectionsOrder(newOrder)
                        const updated = { ...config, sections_order: newOrder as any }
                        setConfig(updated)
                        debouncedSave(updated)
                      }}
                      onUpdate={updateSection}
                      lang={lang}
                      products={products}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              <button
                onClick={() => setShowPicker(true)}
                style={{
                  width: '100%', marginTop: 8, padding: '12px 16px',
                  background: C.cyanD, border: `1px dashed ${C.cyanB}`,
                  borderRadius: 10, color: C.cyan, fontSize: 12, fontWeight: 600,
                  cursor: addingSection ? 'not-allowed' : 'pointer',
                  fontFamily: fnt, opacity: addingSection ? 0.6 : 1,
                }}>
                {addingSection
                  ? (isAr ? 'جارٍ الإضافة...' : `Adding ${addingSection}...`)
                  : t.addSection}
              </button>
            </div>

          ) : (
            /* Style tab */
            <div style={{ height: '100%', overflowY: 'auto', padding: '20px', direction: dir }}>

              <div style={{
                fontSize: 11, color: C.t4, marginBottom: 12, fontFamily: F,
                fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                Design System
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {(['editorial', 'minimal', 'bold', 'warm'] as DesignSystem[]).map(ds => {
                  const dsInfo   = DESIGN_SYSTEMS[ds]
                  const isActive = config?.design_system === ds
                  return (
                    <button
                      key={ds}
                      onClick={() => switchDesignSystem(ds)}
                      style={{
                        padding: '14px', borderRadius: 10,
                        background: isActive ? C.cyanD : C.surface,
                        border: `1px solid ${isActive ? C.cyanB : C.border}`,
                        cursor: 'pointer',
                        textAlign: isAr ? 'right' : 'left',
                        transition: 'all 0.15s', fontFamily: fnt,
                      }}>
                      <div style={{
                        fontSize: 13, fontWeight: 600,
                        color: isActive ? C.cyan : C.t1, marginBottom: 4,
                      }}>
                        {isAr ? dsInfo.nameAr : dsInfo.name}
                      </div>
                      <div style={{ fontSize: 11, color: C.t4, lineHeight: 1.4 }}>
                        {dsInfo.description.split('.')[0]}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Accent color picker */}
              {config && (
                <div style={{
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 12, overflow: 'hidden', marginBottom: 16,
                }}>
                  <AccentPicker
                    value={config.accent || '#00AAFF'}
                    onChange={color => updateConfig({ accent: color })}
                  />
                </div>
              )}

              {/* Creative direction */}
              {config?.creative_direction && (
                <div style={{
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 12, padding: '16px',
                }}>
                  <div style={{
                    fontSize: 10, fontWeight: 600, color: C.t4,
                    marginBottom: 12, letterSpacing: '0.08em',
                    textTransform: 'uppercase', fontFamily: F,
                  }}>
                    Creative Direction
                  </div>
                  {([
                    ['Hero',    config.creative_direction.hero_layout],
                    ['Type',    config.creative_direction.type_scale],
                    ['Spacing', config.creative_direction.spacing],
                    ['Color',   config.creative_direction.color_application],
                  ] as [string, string][]).map(([label, value]) => (
                    <div key={label} style={{
                      display: 'flex', justifyContent: 'space-between',
                      marginBottom: 8, fontSize: 12,
                      flexDirection: isAr ? 'row-reverse' : 'row',
                    }}>
                      <span style={{ color: C.t3, fontFamily: F }}>{label}</span>
                      <span style={{ color: C.t1, fontFamily: MONO, fontSize: 11 }}>{value}</span>
                    </div>
                  ))}
                  {config.creative_direction.reasoning && (
                    <div style={{
                      marginTop: 12, padding: '10px 12px',
                      background: C.over, borderRadius: 8,
                      fontSize: 11, color: C.t3, lineHeight: 1.6, fontFamily: F,
                    }}>
                      {config.creative_direction.reasoning}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════ SECTION PICKER MODAL ════════════════ */}

      {showPicker && (
        <div
          onClick={() => setShowPicker(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)', zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: 360, background: C.surface,
              borderRadius: 16, border: `1px solid ${C.border}`,
              padding: '20px', maxHeight: 520, overflowY: 'auto', direction: dir,
            }}>
            <div style={{
              fontSize: 15, fontWeight: 700, color: C.t1,
              marginBottom: 16, fontFamily: fnt,
            }}>
              {t.addSectionTitle}
            </div>

            {t.addableSections.map(sec => {
              const alreadyAdded = sectionsOrder.includes(sec.type)
              return (
                <button
                  key={sec.type}
                  onClick={() => !alreadyAdded && addSection(sec.type)}
                  disabled={alreadyAdded}
                  style={{
                    width: '100%', padding: '12px 14px',
                    borderRadius: 10, border: `1px solid ${C.border}`,
                    background: alreadyAdded ? C.borderS : C.over,
                    marginBottom: 8,
                    cursor: alreadyAdded ? 'not-allowed' : 'pointer',
                    textAlign: isAr ? 'right' : 'left',
                    opacity: alreadyAdded ? 0.5 : 1,
                    transition: 'border-color 0.15s', fontFamily: fnt,
                  }}
                  onMouseEnter={e => {
                    if (!alreadyAdded)
                      (e.currentTarget.style.borderColor = C.cyanB)
                  }}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.t1, marginBottom: 2 }}>
                    {sec.label}
                    {alreadyAdded && (
                      <span style={{ fontSize: 10, color: C.t4, marginLeft: 8, fontFamily: F }}>
                        ✓ added
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: C.t4 }}>{sec.desc}</div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ════════════════ TOAST ════════════════ */}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24,
          right: isAr ? 'auto' : 24, left: isAr ? 24 : 'auto',
          zIndex: 9999, padding: '11px 18px',
          borderRadius: 10, fontSize: 13, fontWeight: 500,
          background: C.cyanD, border: `1px solid ${C.cyanB}`,
          color: C.cyan, fontFamily: fnt, backdropFilter: 'blur(16px)',
        }}>
          {toast}
        </div>
      )}

      {/* Global animations */}
      <style>{`
        @keyframes dotpulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        * { box-sizing: border-box; }
        textarea { font-family: inherit; }
        button { font-family: inherit; }
      `}</style>
    </div>
  )
}
