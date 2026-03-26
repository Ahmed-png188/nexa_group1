'use client'
import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import * as THREE from 'three'

export interface PackagingViewer3DHandle {
  downloadPNG: () => void
}

interface Props {
  design: any
  packagingType: 'box' | 'label' | 'pouch' | 'bag' | 'sleeve'
  autoRotate?: boolean
  width?: number
  height?: number
}

// ── Build canvas texture ──────────────────────────────────────────
function buildTexture(design: any): HTMLCanvasElement {
  const W = 1024, H = 512
  const cv = document.createElement('canvas')
  cv.width = W; cv.height = H
  const ctx = cv.getContext('2d')!

  const bg      = design?.bg_color     || '#1A1A2E'
  const textCol = design?.text_color   || '#FFFFFF'
  const accent  = design?.accent_color || '#00AAFF'

  // Background fill
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Subtle noise texture
  ctx.globalAlpha = 0.04
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * W, y = Math.random() * H
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x, y, 1, 1)
  }
  ctx.globalAlpha = 1

  // Accent bar at top
  ctx.fillStyle = accent
  ctx.fillRect(0, 0, W, 6)

  // Accent bar at bottom
  ctx.fillRect(0, H - 6, W, 6)

  // Subtle vertical gradient overlay
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0,   'rgba(255,255,255,0.06)')
  grad.addColorStop(0.5, 'rgba(0,0,0,0)')
  grad.addColorStop(1,   'rgba(0,0,0,0.18)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // Logo placeholder or image
  if (design?.logo_url) {
    // We draw a placeholder rect since cross-origin images need async loading
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.fillRect(W / 2 - 50, 50, 100, 60)
    ctx.fillStyle = accent
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('LOGO', W / 2, 85)
  }

  // Brand name
  const brandName = design?.brand_name_display || 'BRAND'
  const fontSize = Math.min(90, Math.max(48, W / (brandName.length * 0.7)))
  ctx.fillStyle = textCol
  ctx.font = `700 ${fontSize}px "Geist", "Arial", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(0,0,0,0.4)'
  ctx.shadowBlur = 12
  ctx.fillText(brandName.toUpperCase(), W / 2, design?.tagline_display ? H / 2 - 20 : H / 2)
  ctx.shadowBlur = 0

  // Tagline
  if (design?.tagline_display) {
    ctx.fillStyle = accent
    ctx.font = `500 26px "Geist", "Arial", sans-serif`
    ctx.fillText(design.tagline_display, W / 2, H / 2 + fontSize / 2 + 10)
  }

  // Main copy (first line only)
  if (design?.main_copy) {
    const line = design.main_copy.split('\n')[0].slice(0, 60)
    ctx.fillStyle = textCol
    ctx.globalAlpha = 0.45
    ctx.font = `400 18px "Geist", "Arial", sans-serif`
    ctx.fillText(line, W / 2, H - 60)
    ctx.globalAlpha = 1
  }

  // Accent dots decoration
  ctx.fillStyle = accent
  ctx.globalAlpha = 0.35
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.arc(80 + i * 24, H - 90, 4, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  return cv
}

// ── Build geometry per packaging type ────────────────────────────
function buildGeometry(type: string): THREE.BufferGeometry {
  switch (type) {
    case 'box':
      return new THREE.BoxGeometry(2, 2.8, 1.2)
    case 'label':
      return new THREE.CylinderGeometry(0.8, 0.8, 2.4, 48, 1, true)
    case 'pouch': {
      const shape = new THREE.Shape()
      shape.moveTo(-0.8, -1.4)
      shape.lineTo( 0.8, -1.4)
      shape.quadraticCurveTo( 1.2, -1.2,  1.1,  1.2)
      shape.quadraticCurveTo( 0.9,  1.6,  0.5,  1.6)
      shape.lineTo(-0.5,  1.6)
      shape.quadraticCurveTo(-0.9,  1.6, -1.1,  1.2)
      shape.quadraticCurveTo(-1.2, -1.2, -0.8, -1.4)
      return new THREE.ExtrudeGeometry(shape, { depth: 0.22, bevelEnabled: true, bevelSize: 0.06, bevelSegments: 3 })
    }
    case 'bag':
      return new THREE.BoxGeometry(1.6, 3.0, 0.35)
    case 'sleeve':
      return new THREE.CylinderGeometry(0.9, 0.9, 2.6, 48, 1, true)
    default:
      return new THREE.BoxGeometry(2, 2.8, 1.2)
  }
}

// ── Build materials ───────────────────────────────────────────────
function buildMaterials(texture: THREE.CanvasTexture, type: string, bg: string): THREE.Material[] {
  const frontMat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.35,
    metalness: 0.08,
    side: THREE.FrontSide,
  })
  const sideMat = new THREE.MeshStandardMaterial({
    color: bg,
    roughness: 0.55,
    metalness: 0.05,
  })
  const topMat = new THREE.MeshStandardMaterial({
    color: bg,
    roughness: 0.5,
    metalness: 0.05,
  })

  if (type === 'box') {
    // BoxGeometry faces: +x, -x, +y, -y, +z (front), -z (back)
    return [sideMat, sideMat, topMat, topMat, frontMat, sideMat]
  }
  if (type === 'label' || type === 'sleeve') {
    return [frontMat]
  }
  // pouch / bag
  return [frontMat, sideMat, topMat, topMat, sideMat, sideMat]
}

// ── Component ─────────────────────────────────────────────────────
const PackagingViewer3D = forwardRef<PackagingViewer3DHandle, Props>(function PackagingViewer3D(
  { design, packagingType = 'box', autoRotate = true, width = 520, height = 400 },
  ref
) {
  const mountRef     = useRef<HTMLDivElement>(null)
  const rendererRef  = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef     = useRef<THREE.Scene | null>(null)
  const cameraRef    = useRef<THREE.PerspectiveCamera | null>(null)
  const meshRef      = useRef<THREE.Mesh | null>(null)
  const textureRef   = useRef<THREE.CanvasTexture | null>(null)
  const frameRef     = useRef<number>(0)
  const isDragging   = useRef(false)
  const lastMouse    = useRef({ x: 0, y: 0 })
  const rotationRef  = useRef({ x: 0.2, y: 0 })
  const autoRotRef   = useRef(autoRotate)

  useEffect(() => { autoRotRef.current = autoRotate }, [autoRotate])

  // Expose downloadPNG
  useImperativeHandle(ref, () => ({
    downloadPNG() {
      const renderer = rendererRef.current
      if (!renderer) return
      renderer.render(sceneRef.current!, cameraRef.current!)
      const url = renderer.domElement.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = `packaging-3d-${packagingType}.png`
      a.click()
    },
  }))

  // Init Three.js scene (once)
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: true,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100)
    camera.position.set(0, 0.4, 6)
    cameraRef.current = camera

    // ── Lighting ──────────────────────────────────────────────────
    // Ambient
    const ambient = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambient)

    // Key light (warm, upper-right)
    const key = new THREE.DirectionalLight(0xfff4e0, 1.8)
    key.position.set(4, 6, 5)
    key.castShadow = true
    key.shadow.camera.near = 1
    key.shadow.camera.far = 30
    key.shadow.mapSize.set(1024, 1024)
    scene.add(key)

    // Fill light (cool, left)
    const fill = new THREE.DirectionalLight(0xd0e8ff, 0.55)
    fill.position.set(-5, 2, 3)
    scene.add(fill)

    // Rim light (back-right)
    const rim = new THREE.DirectionalLight(0xffffff, 0.9)
    rim.position.set(2, -3, -6)
    scene.add(rim)

    // Floor shadow catcher
    const floorGeo = new THREE.PlaneGeometry(12, 12)
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.18 })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -2.2
    floor.receiveShadow = true
    scene.add(floor)

    return () => {
      cancelAnimationFrame(frameRef.current)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
      rendererRef.current = null
      sceneRef.current = null
      cameraRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Build/replace mesh when design or type changes
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    // Remove old mesh
    if (meshRef.current) {
      scene.remove(meshRef.current)
      meshRef.current.geometry.dispose()
      if (Array.isArray(meshRef.current.material)) {
        meshRef.current.material.forEach((m: THREE.Material) => m.dispose())
      } else {
        (meshRef.current.material as THREE.Material).dispose()
      }
      meshRef.current = null
    }
    if (textureRef.current) {
      textureRef.current.dispose()
      textureRef.current = null
    }

    const cv      = buildTexture(design)
    const texture = new THREE.CanvasTexture(cv)
    texture.wrapS  = THREE.RepeatWrapping
    texture.wrapT  = THREE.ClampToEdgeWrapping
    texture.needsUpdate = true
    textureRef.current = texture

    const bg       = design?.bg_color || '#1A1A2E'
    const geometry = buildGeometry(packagingType)
    const materials = buildMaterials(texture, packagingType, bg)
    const mesh = new THREE.Mesh(
      geometry,
      materials.length === 1 ? materials[0] : materials
    )
    mesh.castShadow = true
    mesh.receiveShadow = true
    meshRef.current = mesh
    scene.add(mesh)
  }, [design, packagingType])

  // Animation loop (separate effect — runs once after scene init)
  useEffect(() => {
    let t = 0
    function animate() {
      frameRef.current = requestAnimationFrame(animate)
      const mesh = meshRef.current
      if (!mesh) return
      t += 0.01
      if (autoRotRef.current) {
        mesh.rotation.y += 0.006
        mesh.position.y = Math.sin(t * 0.7) * 0.05
      } else {
        mesh.rotation.x = rotationRef.current.x
        mesh.rotation.y = rotationRef.current.y
      }
      rendererRef.current?.render(sceneRef.current!, cameraRef.current!)
    }
    animate()
    return () => cancelAnimationFrame(frameRef.current)
  }, [])

  // Mouse drag handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    lastMouse.current = { x: e.clientX, y: e.clientY }
    autoRotRef.current = false
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !meshRef.current) return
    const dx = e.clientX - lastMouse.current.x
    const dy = e.clientY - lastMouse.current.y
    rotationRef.current.y += dx * 0.01
    rotationRef.current.x += dy * 0.01
    lastMouse.current = { x: e.clientX, y: e.clientY }
  }, [])

  const onMouseUp = useCallback(() => { isDragging.current = false }, [])

  // Touch drag handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    isDragging.current = true
    lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    autoRotRef.current = false
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || !meshRef.current) return
    const dx = e.touches[0].clientX - lastMouse.current.x
    const dy = e.touches[0].clientY - lastMouse.current.y
    rotationRef.current.y += dx * 0.01
    rotationRef.current.x += dy * 0.01
    lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }, [])

  const onTouchEnd = useCallback(() => { isDragging.current = false }, [])

  return (
    <div
      ref={mountRef}
      style={{ width, height, cursor: isDragging.current ? 'grabbing' : 'grab', userSelect: 'none' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    />
  )
})

export default PackagingViewer3D
