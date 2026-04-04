'use client'

import { useState } from 'react'
import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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
}
const F = "'Geist', -apple-system, sans-serif"

// ── Section metadata ───────────────────────────────────────────
const SECTION_META: Record<string, {
  label: string
  preview: (cfg: any) => string
  fields: Array<{ key: string; label: string; type: 'text' | 'textarea' | 'list' }>
}> = {
  hero:         { label: 'Hero',          preview: c => c.headline_line1 || '',
    fields: [
      { key: 'eyebrow',         label: 'Eyebrow',       type: 'text'     },
      { key: 'headline_line1',  label: 'Headline 1',    type: 'text'     },
      { key: 'headline_line2',  label: 'Headline 2',    type: 'text'     },
      { key: 'headline_italic', label: 'Italic part',   type: 'text'     },
      { key: 'body',            label: 'Body text',     type: 'textarea' },
      { key: 'cta_primary',     label: 'Primary CTA',   type: 'text'     },
      { key: 'cta_secondary',   label: 'Secondary CTA', type: 'text'     },
    ],
  },
  marquee:      { label: 'Marquee',       preview: c => (c.items || [])[0] || '',
    fields: [],
  },
  statement:    { label: 'Statement',     preview: c => c.left_headline || '',
    fields: [
      { key: 'left_headline', label: 'Headline',  type: 'text'     },
      { key: 'left_italic',   label: 'Italic',    type: 'text'     },
      { key: 'body',          label: 'Body',      type: 'textarea' },
    ],
  },
  products:     { label: 'Products',      preview: c => c.headline || '',
    fields: [
      { key: 'headline',        label: 'Section headline', type: 'text' },
      { key: 'headline_italic', label: 'Italic part',      type: 'text' },
      { key: 'link_label',      label: 'Link label',       type: 'text' },
    ],
  },
  pull_quote:   { label: 'Pull Quote',    preview: c => c.quote?.slice(0, 60) || '',
    fields: [
      { key: 'quote',    label: 'Quote',    type: 'textarea' },
      { key: 'author',   label: 'Author',   type: 'text'     },
      { key: 'location', label: 'Location', type: 'text'     },
    ],
  },
  story:        { label: 'Brand Story',   preview: c => c.headline || '',
    fields: [
      { key: 'tag',             label: 'Tag',             type: 'text'     },
      { key: 'headline',        label: 'Headline',        type: 'text'     },
      { key: 'headline_italic', label: 'Italic part',     type: 'text'     },
      { key: 'body',            label: 'Body',            type: 'textarea' },
    ],
  },
  reviews:      { label: 'Reviews',       preview: c => c.headline || '',
    fields: [
      { key: 'headline', label: 'Headline', type: 'text' },
      { key: 'score',    label: 'Score',    type: 'text' },
      { key: 'count',    label: 'Count',    type: 'text' },
    ],
  },
  form:         { label: 'Lead Form',     preview: c => c.headline_line1 || '',
    fields: [
      { key: 'tag',             label: 'Tag',        type: 'text'     },
      { key: 'headline_line1',  label: 'Headline 1', type: 'text'     },
      { key: 'headline_line2',  label: 'Headline 2', type: 'text'     },
      { key: 'body',            label: 'Body',       type: 'textarea' },
      { key: 'cta',             label: 'CTA',        type: 'text'     },
      { key: 'note',            label: 'Note',       type: 'text'     },
    ],
  },
  band:         { label: 'Band',          preview: c => (c.items || [])[0]?.text || '',
    fields: [],
  },
  strip:        { label: 'Strip',         preview: c => (c.items || [])[0] || '',
    fields: [],
  },
  philosophy:   { label: 'Philosophy',    preview: c => c.headline || '',
    fields: [
      { key: 'label',           label: 'Label',           type: 'text'     },
      { key: 'headline',        label: 'Headline',        type: 'text'     },
      { key: 'headline_italic', label: 'Italic part',     type: 'text'     },
      { key: 'body',            label: 'Body',            type: 'textarea' },
    ],
  },
  founder_note: { label: 'Founder Note',  preview: c => c.name || '',
    fields: [
      { key: 'text', label: 'Letter text', type: 'textarea' },
      { key: 'name', label: 'Name',        type: 'text'     },
      { key: 'role', label: 'Role',        type: 'text'     },
    ],
  },
  ingredients:  { label: 'Ingredients',   preview: c => c.headline || '',
    fields: [
      { key: 'headline', label: 'Headline',   type: 'text'     },
      { key: 'desc',     label: 'Intro text', type: 'textarea' },
    ],
  },
  features:     { label: 'Features',      preview: c => c.headline || '',
    fields: [
      { key: 'headline', label: 'Headline', type: 'text' },
    ],
  },
  intro:        { label: 'Intro',          preview: c => c.headline || '',
    fields: [
      { key: 'tag',             label: 'Tag',         type: 'text'     },
      { key: 'headline',        label: 'Headline',    type: 'text'     },
      { key: 'headline_italic', label: 'Italic part', type: 'text'     },
      { key: 'body',            label: 'Body',        type: 'textarea' },
    ],
  },
  footer:       { label: 'Footer',         preview: c => c.tagline || '',
    fields: [
      { key: 'tagline', label: 'Tagline', type: 'textarea' },
    ],
  },
}

const ADD_SECTION_OPTIONS = [
  { key: 'reviews',      label: 'Testimonial Block',   desc: 'Add 3 customer reviews'             },
  { key: 'features',     label: 'Features Grid',        desc: '4 key benefits or features'         },
  { key: 'philosophy',   label: 'Philosophy',           desc: 'Brand belief statement'             },
  { key: 'ingredients',  label: 'Ingredients / Details',desc: 'What goes into your product'        },
  { key: 'founder_note', label: 'Team / Founder',       desc: 'Put a human face on the brand'      },
  { key: 'story',        label: 'Brand Story',          desc: 'Origin story section'               },
  { key: 'pull_quote',   label: 'Pull Quote',           desc: 'Large featured testimonial'         },
  { key: 'intro',        label: 'Intro Section',        desc: 'Overview with feature cards'        },
  { key: 'band',         label: 'CTA Banner',           desc: 'Full-width conversion section'      },
]

// ── Sortable section item ──────────────────────────────────────
function SortableSection({
  sectionKey, config, expanded, onToggle, onChange, onDelete,
}: {
  sectionKey: string
  config:     any
  expanded:   boolean
  onToggle:   () => void
  onChange:   (key: string, field: string, value: string) => void
  onDelete:   (key: string) => void
}) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: sectionKey })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const meta     = SECTION_META[sectionKey]
  const sectionData = config[sectionKey] || {}
  const preview  = meta?.preview(sectionData) || ''

  return (
    <div ref={setNodeRef} style={{ ...style, marginBottom: 8 }}>
      <div style={{
        background: C.surface, border: `1px solid ${expanded ? C.cyan + '40' : C.border}`,
        borderRadius: 10, overflow: 'hidden',
      }}>
        {/* Header row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
          cursor: 'pointer',
        }} onClick={onToggle}>
          {/* Drag handle */}
          <div {...listeners} {...attributes}
            onClick={e => e.stopPropagation()}
            style={{ cursor: 'grab', display: 'flex', flexDirection: 'column', gap: 3, padding: '2px 4px', flexShrink: 0 }}>
            {[0,1].map(row => (
              <div key={row} style={{ display: 'flex', gap: 3 }}>
                {[0,1,2].map(col => (
                  <div key={col} style={{ width: 3, height: 3, borderRadius: '50%', background: C.t4 }} />
                ))}
              </div>
            ))}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: C.t1, fontWeight: 500 }}>
              {meta?.label || sectionKey}
            </div>
            {preview && (
              <div style={{
                fontSize: 11, color: C.t4, marginTop: 2,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {preview}
              </div>
            )}
          </div>

          {/* Delete */}
          <button
            onClick={e => { e.stopPropagation(); onDelete(sectionKey) }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px', borderRadius: 4, opacity: 0, color: C.t3,
              fontSize: 14,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0' }}
          >
            ×
          </button>

          {/* Chevron */}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke={C.t3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>

        {/* Expanded editor */}
        {expanded && (
          <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${C.borderS}` }}>
            {(meta?.fields || []).map(field => (
              <div key={field.key} style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10, color: C.t4, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                  {field.label}
                </div>
                {field.type === 'textarea' ? (
                  <textarea
                    value={sectionData[field.key] || ''}
                    onChange={e => onChange(sectionKey, field.key, e.target.value)}
                    rows={3}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: C.over, border: `1px solid ${C.border}`,
                      borderRadius: 8, color: C.t1, fontSize: 12,
                      padding: '8px 10px', resize: 'vertical', outline: 'none',
                      fontFamily: F, lineHeight: 1.5,
                    }}
                  />
                ) : (
                  <input
                    type="text"
                    value={sectionData[field.key] || ''}
                    onChange={e => onChange(sectionKey, field.key, e.target.value)}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: C.over, border: `1px solid ${C.border}`,
                      borderRadius: 8, color: C.t1, fontSize: 12,
                      padding: '8px 10px', outline: 'none', fontFamily: F,
                    }}
                  />
                )}
              </div>
            ))}
            {(meta?.fields || []).length === 0 && (
              <div style={{ fontSize: 11, color: C.t4, marginTop: 10 }}>
                This section's content is managed by Nexa automatically.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main SectionEditor ─────────────────────────────────────────
interface SectionEditorProps {
  config:     any
  wsId:       string
  lang:       string
  onUpdate:   (newConfig: any) => void
  onSave:     (cfg: any) => Promise<void>
}

export default function SectionEditor({ config, wsId, lang, onUpdate, onSave }: SectionEditorProps) {
  const [expanded,       setExpanded]       = useState<string | null>(null)
  const [showAddPicker,  setShowAddPicker]  = useState(false)
  const [addingSection,  setAddingSection]  = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  }))

  // Derive section order from config or design system default
  const DS_SECTIONS: Record<string, string[]> = {
    editorial:          ['hero','marquee','statement','products','pull_quote','story','reviews','form','footer'],
    minimal_architect:  ['hero','strip','products','philosophy','pull_quote','story','reviews','form','footer'],
    bold_expressionist: ['hero','marquee','products','statement','story','reviews','form','footer'],
    warm_storyteller:   ['hero','band','intro','products','founder_note','ingredients','reviews','form','footer'],
  }

  const defaultOrder = DS_SECTIONS[config?.design_system] || DS_SECTIONS.editorial
  const sectionOrder: string[] = config?.sections_order ||
    defaultOrder.filter((k: string) => !!config?.[k])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sectionOrder.indexOf(active.id as string)
    const newIndex  = sectionOrder.indexOf(over.id as string)
    const newOrder  = arrayMove(sectionOrder, oldIndex, newIndex)
    const newConfig = { ...config, sections_order: newOrder }
    onUpdate(newConfig)
    void onSave(newConfig)
  }

  function handleFieldChange(sectionKey: string, fieldKey: string, value: string) {
    const newConfig = {
      ...config,
      [sectionKey]: { ...(config[sectionKey] || {}), [fieldKey]: value },
    }
    onUpdate(newConfig)
  }

  function handleBlurSave() {
    void onSave(config)
  }

  function handleDelete(sectionKey: string) {
    if (!confirm(`Remove the ${SECTION_META[sectionKey]?.label || sectionKey} section?`)) return
    const newOrder  = sectionOrder.filter(k => k !== sectionKey)
    const { [sectionKey]: _removed, sections_order: _old, ...rest } = config as any
    const newConfig = { ...rest, sections_order: newOrder }
    onUpdate(newConfig)
    void onSave(newConfig)
  }

  async function handleAddSection(sectionType: string) {
    setShowAddPicker(false)
    setAddingSection(true)
    try {
      const res = await fetch('/api/landing-page/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          workspace_id:    wsId,
          conversation:    `Add a ${sectionType} section to my page. Match the existing design and brand voice. Current design system: ${config.design_system}.`,
          history:         [],
          lang,
          section_only:    sectionType,
          existing_config: config,
          design_system_override: config.design_system,
        }),
      })
      const data = await res.json()
      if (data.config?.[sectionType]) {
        const newOrder  = [...sectionOrder, sectionType]
        const newConfig = { ...config, [sectionType]: data.config[sectionType], sections_order: newOrder }
        onUpdate(newConfig)
        await onSave(newConfig)
        setExpanded(sectionType)
      }
    } finally {
      setAddingSection(false)
    }
  }

  // Sections not yet in the page
  const availableToAdd = ADD_SECTION_OPTIONS.filter(s => !sectionOrder.includes(s.key))

  return (
    <div style={{
      flex: 1, overflowY: 'auto', padding: 16,
      display: 'flex', flexDirection: 'column',
      fontFamily: F,
    }}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
          {sectionOrder.map(key => (
            <div key={key} onBlur={handleBlurSave}>
              <SortableSection
                sectionKey={key}
                config={config}
                expanded={expanded === key}
                onToggle={() => setExpanded(prev => prev === key ? null : key)}
                onChange={handleFieldChange}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </SortableContext>
      </DndContext>

      {/* Add section */}
      <div style={{ position: 'relative', marginTop: 8 }}>
        <button
          onClick={() => setShowAddPicker(p => !p)}
          disabled={addingSection}
          style={{
            width: '100%', background: C.cyanD, border: `1px solid ${C.cyanB}`,
            borderRadius: 10, padding: '10px 16px',
            color: addingSection ? C.t4 : C.cyan,
            fontSize: 12, fontWeight: 600, cursor: addingSection ? 'default' : 'pointer',
            fontFamily: F, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          {addingSection ? 'Adding section…' : '+ Add section'}
        </button>

        {showAddPicker && availableToAdd.length > 0 && (
          <div style={{
            position: 'absolute', bottom: '110%', left: 0, right: 0, zIndex: 100,
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 12, overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}>
            {availableToAdd.map((s, i) => (
              <button key={s.key} onClick={() => handleAddSection(s.key)} style={{
                width: '100%', background: 'none', border: 'none',
                borderBottom: i < availableToAdd.length - 1 ? `1px solid ${C.borderS}` : 'none',
                padding: '12px 16px', textAlign: 'left', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', gap: 2,
                fontFamily: F,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = C.over }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none' }}>
                <div style={{ fontSize: 13, color: C.t1, fontWeight: 500 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: C.t3 }}>{s.desc}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
