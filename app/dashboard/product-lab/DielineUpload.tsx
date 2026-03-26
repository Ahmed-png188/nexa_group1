'use client'
import { useRef, useState } from 'react'

interface Props {
  packagingType: string
  dims: { width_mm: number; height_mm: number; depth_mm: number; bleed_mm: number }
  onUpload: (dataUrl: string) => void
}

const C = {
  bg:     '#080808',
  surface:'#111111',
  border: 'rgba(255,255,255,0.08)',
  borderS:'rgba(255,255,255,0.05)',
  cyan:   '#00AAFF',
  cyanD:  'rgba(0,170,255,0.10)',
  cyanB:  'rgba(0,170,255,0.20)',
  t1:     '#FFFFFF',
  t2:     'rgba(255,255,255,0.65)',
  t3:     'rgba(255,255,255,0.35)',
  t4:     'rgba(255,255,255,0.18)',
  green:  '#22C55E',
}
const F = "'Geist', -apple-system, sans-serif"

export default function DielineUpload({ packagingType, dims, onUpload }: Props) {
  const fileRef  = useRef<HTMLInputElement>(null)
  const [drag,   setDrag]   = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [name,   setName]   = useState('')
  const [error,  setError]  = useState('')

  function processFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a PNG, JPG, or WEBP file')
      return
    }
    setError('')
    setName(file.name)
    const reader = new FileReader()
    reader.onload = e => {
      const dataUrl = e.target?.result as string
      setPreview(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  function handleApply() {
    if (preview) onUpload(preview)
  }

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 20, padding: 32, fontFamily: F,
    }}>

      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: C.t1, marginBottom: 6 }}>
          Upload your artwork
        </div>
        <div style={{ fontSize: 13, color: C.t3, lineHeight: 1.7 }}>
          Design in your preferred app using the dimensions below,
          then upload the finished flat artwork to wrap it on the 3D mockup.
        </div>
      </div>

      {/* Dimensions card */}
      <div style={{
        display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center',
      }}>
        {[
          { label: 'Width',  value: `${dims.width_mm}mm` },
          { label: 'Height', value: `${dims.height_mm}mm` },
          { label: 'Bleed',  value: `+${dims.bleed_mm}mm` },
          { label: 'Format', value: packagingType.toUpperCase() },
        ].map(item => (
          <div key={item.label} style={{
            padding: '10px 18px', background: C.surface,
            border: `1px solid ${C.borderS}`, borderRadius: 10,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, color: C.t4, marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
              {item.label}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.t1, fontFamily: "'Geist Mono', monospace" }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => {
          e.preventDefault(); setDrag(false)
          const f = e.dataTransfer.files[0]
          if (f) processFile(f)
        }}
        onClick={() => fileRef.current?.click()}
        style={{
          width: '100%', maxWidth: 480, padding: '36px 24px',
          border: `2px dashed ${drag ? C.cyan : preview ? C.cyanB : C.border}`,
          borderRadius: 14, cursor: 'pointer', textAlign: 'center',
          background: drag ? C.cyanD : preview ? 'rgba(34,197,94,0.05)' : C.surface,
          transition: 'all 0.18s',
        }}
      >
        {preview ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <img
              src={preview}
              alt="Preview"
              style={{ maxWidth: 280, maxHeight: 200, objectFit: 'contain', borderRadius: 6, border: `1px solid ${C.borderS}` }}
            />
            <div style={{ fontSize: 12, color: C.green }}>{name}</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 28, marginBottom: 10, opacity: 0.3 }}>↑</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.t2 }}>Drop your artwork here</div>
            <div style={{ fontSize: 11, color: C.t4, marginTop: 4 }}>PNG, JPG, WEBP accepted</div>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }}
        />
      </div>

      {error && (
        <div style={{ fontSize: 12, color: '#EF4444', textAlign: 'center' }}>{error}</div>
      )}

      {/* Apply button */}
      {preview && (
        <button
          onClick={handleApply}
          style={{
            padding: '12px 32px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            background: C.cyan, color: '#000', border: 'none', cursor: 'pointer',
          }}
        >
          Wrap artwork on 3D mockup →
        </button>
      )}

      <div style={{ fontSize: 11, color: C.t4, textAlign: 'center', maxWidth: 380 }}>
        Tip: include {dims.bleed_mm}mm bleed on all sides and use 300 DPI for print quality.
      </div>
    </div>
  )
}
