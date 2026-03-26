'use client'
import { useRef, useEffect, useState, useCallback } from 'react'

interface Props {
  design: any
  packagingType: string
  dims: { width_mm: number; height_mm: number; depth_mm: number; bleed_mm: number }
  onExport: (dataUrl: string) => void
}

const C = {
  bg:     '#080808',
  surface:'#111111',
  border: 'rgba(255,255,255,0.08)',
  cyan:   '#00AAFF',
  cyanD:  'rgba(0,170,255,0.10)',
  t1:     '#FFFFFF',
  t2:     'rgba(255,255,255,0.65)',
  t3:     'rgba(255,255,255,0.35)',
  t4:     'rgba(255,255,255,0.18)',
}
const F = "'Geist', -apple-system, sans-serif"

export default function PackagingEditor({ design, packagingType, dims, onExport }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Scale canvas to fit the available space while keeping aspect ratio
  const aspect = dims.width_mm > 0 && dims.height_mm > 0
    ? dims.width_mm / dims.height_mm
    : 1

  const canvasW = Math.min(600, 560)
  const canvasH = Math.round(canvasW / aspect)

  // Render design onto the canvas
  const render = useCallback(() => {
    const cv  = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')!

    const bg     = design?.bg_color     || '#FFFFFF'
    const textC  = design?.text_color   || '#000000'
    const accent = design?.accent_color || '#000000'

    cv.width  = canvasW
    cv.height = canvasH

    // Background
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, canvasW, canvasH)

    // Bleed indicator
    const bleedPx = Math.round((dims.bleed_mm / dims.width_mm) * canvasW)
    ctx.strokeStyle = 'rgba(255,100,100,0.35)'
    ctx.lineWidth   = 1
    ctx.setLineDash([4, 4])
    ctx.strokeRect(bleedPx, bleedPx, canvasW - bleedPx * 2, canvasH - bleedPx * 2)
    ctx.setLineDash([])

    // Accent bars
    ctx.fillStyle = accent
    ctx.fillRect(0, 0, canvasW, 4)
    ctx.fillRect(0, canvasH - 4, canvasW, 4)

    // Brand name
    const brand    = design?.brand_name_display || 'BRAND'
    const fontSize = Math.min(80, Math.max(32, canvasW / (brand.length * 0.6)))
    ctx.fillStyle   = textC
    ctx.font        = `700 ${fontSize}px "Geist", Arial, sans-serif`
    ctx.textAlign   = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(brand.toUpperCase(), canvasW / 2, design?.tagline_display ? canvasH / 2 - fontSize * 0.4 : canvasH / 2)

    // Tagline
    if (design?.tagline_display) {
      ctx.fillStyle   = accent
      ctx.font        = `500 ${Math.round(fontSize * 0.3)}px "Geist", Arial, sans-serif`
      ctx.fillText(design.tagline_display, canvasW / 2, canvasH / 2 + fontSize * 0.6)
    }

    // Main copy
    if (design?.main_copy) {
      ctx.fillStyle   = textC
      ctx.globalAlpha = 0.5
      ctx.font        = `400 14px "Geist", Arial, sans-serif`
      ctx.fillText(design.main_copy.split('\n')[0].slice(0, 60), canvasW / 2, canvasH - 40)
      ctx.globalAlpha = 1
    }

    // Dimension badge
    ctx.fillStyle   = 'rgba(255,255,255,0.15)'
    ctx.font        = '11px monospace'
    ctx.textAlign   = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(`${dims.width_mm}×${dims.height_mm}mm +${dims.bleed_mm}mm bleed`, 10, 10)
  }, [design, canvasW, canvasH, dims])

  useEffect(() => { render() }, [render])

  function handleApply() {
    const cv = canvasRef.current
    if (!cv) return
    onExport(cv.toDataURL('image/png', 1.0))
  }

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 16, padding: 24, fontFamily: F,
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px',
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
      }}>
        <span style={{ fontSize: 11, color: C.t4, marginRight: 4 }}>Visual Editor</span>
        <div style={{ width: 1, height: 14, background: C.border }}/>
        <span style={{ fontSize: 11, color: C.t3 }}>
          {canvasW}×{canvasH}px · {dims.width_mm}×{dims.height_mm}mm
        </span>
        <div style={{ flex: 1 }}/>
        <button
          onClick={handleApply}
          style={{
            padding: '6px 16px', borderRadius: 7, fontSize: 12, fontWeight: 700,
            background: C.cyan, color: '#000', border: 'none', cursor: 'pointer',
          }}
        >
          Apply to 3D →
        </button>
      </div>

      {/* Canvas */}
      <div style={{
        position: 'relative',
        boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        borderRadius: 4,
        overflow: 'hidden',
      }}>
        <canvas
          ref={canvasRef}
          width={canvasW}
          height={canvasH}
          style={{ display: 'block', maxWidth: '100%' }}
        />
        {/* Bleed legend */}
        <div style={{
          position: 'absolute', top: 8, right: 8,
          fontSize: 10, color: 'rgba(255,100,100,0.6)',
          background: 'rgba(0,0,0,0.6)',
          padding: '3px 7px', borderRadius: 4,
        }}>
          — bleed zone
        </div>
      </div>

      <div style={{ fontSize: 11, color: C.t4, textAlign: 'center', maxWidth: 400 }}>
        This is a design preview. Click "Apply to 3D" to wrap this artwork onto the 3D mockup.
      </div>
    </div>
  )
}
