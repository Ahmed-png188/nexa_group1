import { useCallback } from 'react'
import { PackagingViewer3DHandle } from './PackagingViewer3D'

export function usePackagingDownload(
  viewerRef: React.RefObject<PackagingViewer3DHandle | null>,
  design: any,
  packagingType: string
) {
  // 3D PNG — delegates to WebGLRenderer.toDataURL via the viewer's exposed handle
  const downloadPNG = useCallback(() => {
    viewerRef.current?.downloadPNG()
  }, [viewerRef])

  // Hi-res 4K flat print-ready PNG — renders the design onto a large 2D canvas
  const downloadHiRes = useCallback(() => {
    const W = 3840, H = 2160
    const cv = document.createElement('canvas')
    cv.width = W; cv.height = H
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const bg     = design?.bg_color     || '#1A1A2E'
    const textC  = design?.text_color   || '#FFFFFF'
    const accent = design?.accent_color || '#00AAFF'

    // Background
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // Top & bottom accent bars
    ctx.fillStyle = accent
    ctx.fillRect(0, 0, W, 18)
    ctx.fillRect(0, H - 18, W, 18)

    // Gradient overlay
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0,   'rgba(255,255,255,0.05)')
    grad.addColorStop(0.5, 'rgba(0,0,0,0)')
    grad.addColorStop(1,   'rgba(0,0,0,0.15)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Brand name
    const brand    = design?.brand_name_display || 'BRAND'
    const fontSize = Math.min(320, Math.max(160, W / (brand.length * 0.65)))
    ctx.fillStyle     = textC
    ctx.font          = `700 ${fontSize}px "Geist", "Arial", sans-serif`
    ctx.textAlign     = 'center'
    ctx.textBaseline  = 'middle'
    ctx.shadowColor   = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur    = 40
    ctx.fillText(brand.toUpperCase(), W / 2, design?.tagline_display ? H / 2 - 60 : H / 2)
    ctx.shadowBlur    = 0

    // Tagline
    if (design?.tagline_display) {
      ctx.fillStyle   = accent
      ctx.font        = `500 90px "Geist", "Arial", sans-serif`
      ctx.fillText(design.tagline_display, W / 2, H / 2 + fontSize / 2 + 40)
    }

    // Main copy
    if (design?.main_copy) {
      const line = design.main_copy.split('\n')[0].slice(0, 80)
      ctx.fillStyle   = textC
      ctx.globalAlpha = 0.45
      ctx.font        = `400 56px "Geist", "Arial", sans-serif`
      ctx.fillText(line, W / 2, H - 180)
      ctx.globalAlpha = 1
    }

    // Dimensions watermark
    const dims = design?.dims
    if (dims) {
      ctx.fillStyle   = textC
      ctx.globalAlpha = 0.20
      ctx.font        = '400 36px monospace'
      ctx.textAlign   = 'right'
      ctx.fillText(`${dims.width_mm}×${dims.height_mm}mm — ${packagingType.toUpperCase()}`, W - 60, H - 60)
      ctx.globalAlpha = 1
    }

    // Trigger download
    const url  = cv.toDataURL('image/png')
    const a    = document.createElement('a')
    a.href     = url
    a.download = `packaging-print-4k-${packagingType}.png`
    a.click()
  }, [design, packagingType])

  return { downloadPNG, downloadHiRes }
}
