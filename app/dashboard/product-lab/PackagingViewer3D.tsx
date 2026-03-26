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

// ── Canvas texture (2048×1024 for retina sharpness) ───────────────
function buildTexture(design: any): HTMLCanvasElement {
  const W = 2048, H = 1024
  const cv = document.createElement('canvas')
  cv.width = W; cv.height = H
  const ctx = cv.getContext('2d')!

  const bg     = design?.bg_color     || '#1A1A2E'
  const textC  = design?.text_color   || '#FFFFFF'
  const accent = design?.accent_color || '#00AAFF'

  // Background
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Subtle noise
  ctx.globalAlpha = 0.03
  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1)
  }
  ctx.globalAlpha = 1

  // Accent bars top/bottom
  ctx.fillStyle = accent
  ctx.fillRect(0, 0, W, 8)
  ctx.fillRect(0, H - 8, W, 8)

  // Gradient overlay
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0,   'rgba(255,255,255,0.07)')
  grad.addColorStop(0.5, 'rgba(0,0,0,0)')
  grad.addColorStop(1,   'rgba(0,0,0,0.20)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // Logo placeholder
  if (design?.logo_url) {
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.fillRect(W / 2 - 80, 60, 160, 90)
    ctx.fillStyle = accent
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('LOGO', W / 2, 112)
  }

  // Brand name
  const brand    = design?.brand_name_display || 'BRAND'
  const fontSize = Math.min(160, Math.max(80, W / (brand.length * 0.65)))
  ctx.fillStyle    = textC
  ctx.font         = `700 ${fontSize}px "Geist", "Arial", sans-serif`
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor  = 'rgba(0,0,0,0.45)'
  ctx.shadowBlur   = 20
  ctx.fillText(brand.toUpperCase(), W / 2, design?.tagline_display ? H / 2 - fontSize * 0.38 : H / 2)
  ctx.shadowBlur = 0

  // Tagline
  if (design?.tagline_display) {
    ctx.fillStyle = accent
    ctx.font = `500 ${Math.round(fontSize * 0.30)}px "Geist", "Arial", sans-serif`
    ctx.fillText(design.tagline_display, W / 2, H / 2 + fontSize * 0.60)
  }

  // Main copy
  if (design?.main_copy) {
    const line = design.main_copy.split('\n')[0].slice(0, 60)
    ctx.fillStyle    = textC
    ctx.globalAlpha  = 0.40
    ctx.font         = `400 28px "Geist", "Arial", sans-serif`
    ctx.fillText(line, W / 2, H - 90)
    ctx.globalAlpha  = 1
  }

  // Accent dot row
  ctx.fillStyle   = accent
  ctx.globalAlpha = 0.35
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.arc(120 + i * 36, H - 140, 6, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  return cv
}

// ── Geometry per type ─────────────────────────────────────────────
function buildGeometry(type: string): THREE.BufferGeometry {
  switch (type) {
    case 'box':     return new THREE.BoxGeometry(2, 2.8, 1.2)
    case 'label':   return new THREE.CylinderGeometry(0.8, 0.8, 2.4, 64, 1, true)
    case 'pouch': {
      const shape = new THREE.Shape()
      shape.moveTo(-0.8, -1.4)
      shape.lineTo( 0.8, -1.4)
      shape.quadraticCurveTo( 1.2, -1.2,  1.1,  1.2)
      shape.quadraticCurveTo( 0.9,  1.6,  0.5,  1.6)
      shape.lineTo(-0.5,  1.6)
      shape.quadraticCurveTo(-0.9,  1.6, -1.1,  1.2)
      shape.quadraticCurveTo(-1.2, -1.2, -0.8, -1.4)
      return new THREE.ExtrudeGeometry(shape, { depth:0.22, bevelEnabled:true, bevelSize:0.06, bevelSegments:3 })
    }
    case 'bag':     return new THREE.BoxGeometry(1.6, 3.0, 0.35)
    case 'sleeve':  return new THREE.CylinderGeometry(0.9, 0.9, 2.6, 64, 1, true)
    default:        return new THREE.BoxGeometry(2, 2.8, 1.2)
  }
}

// ── Materials ─────────────────────────────────────────────────────
function buildMaterials(
  texture: THREE.CanvasTexture,
  type: string,
  bg: string,
): THREE.Material[] {
  const frontMat = new THREE.MeshStandardMaterial({
    map:             texture,
    roughness:       0.15,
    metalness:       0.0,
    envMapIntensity: 0.5,
    side:            THREE.FrontSide,
  })
  const sideColor = new THREE.Color(bg).multiplyScalar(0.75)
  const sideMat = new THREE.MeshStandardMaterial({
    color:     sideColor,
    roughness: 0.50,
    metalness: 0.0,
  })
  const topMat = new THREE.MeshStandardMaterial({
    color:     new THREE.Color(bg).multiplyScalar(0.82),
    roughness: 0.48,
    metalness: 0.0,
  })

  if (type === 'box') {
    // BoxGeometry: +x, -x, +y, -y, +z (front), -z (back)
    return [sideMat, sideMat, topMat, topMat, frontMat, sideMat]
  }
  if (type === 'label' || type === 'sleeve') {
    return [frontMat]
  }
  // pouch / bag
  return [frontMat, sideMat, topMat, topMat, sideMat, sideMat]
}

// ── Component ─────────────────────────────────────────────────────
const PackagingViewer3D = forwardRef<PackagingViewer3DHandle, Props>(
  function PackagingViewer3D(
    { design, packagingType = 'box', autoRotate = true, width = 520, height = 400 },
    ref,
  ) {
    const mountRef    = useRef<HTMLDivElement>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const sceneRef    = useRef<THREE.Scene | null>(null)
    const cameraRef   = useRef<THREE.PerspectiveCamera | null>(null)
    const meshRef     = useRef<THREE.Mesh | null>(null)
    const textureRef  = useRef<THREE.CanvasTexture | null>(null)
    const frameRef    = useRef<number>(0)
    const isDragging  = useRef(false)
    const lastMouse   = useRef({ x: 0, y: 0 })
    const rotationRef = useRef({ x: 0.2, y: 0 })
    const autoRotRef  = useRef(autoRotate)

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

    // Init Three.js (once)
    useEffect(() => {
      const mount = mountRef.current
      if (!mount) return

      const renderer = new THREE.WebGLRenderer({
        antialias:           true,
        preserveDrawingBuffer: true,
        alpha:               false,
        powerPreference:     'high-performance',
      })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5))
      renderer.setSize(width, height)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type    = THREE.PCFSoftShadowMap
      renderer.toneMapping       = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.4
      renderer.setClearColor(0x080808, 1)
      mount.appendChild(renderer.domElement)
      rendererRef.current = renderer

      const scene = new THREE.Scene()
      sceneRef.current = scene

      const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100)
      camera.position.set(0, 0.4, 6)
      cameraRef.current = camera

      // Ambient
      scene.add(new THREE.AmbientLight(0xffffff, 0.55))

      // Hemisphere (sky/ground) for ambient depth
      const hemi = new THREE.HemisphereLight(0xB8D4FF, 0x1A1000, 0.4)
      scene.add(hemi)

      // Key light — warm, upper-right
      const key = new THREE.DirectionalLight(0xfff4e0, 3.0)
      key.position.set(4, 6, 5)
      key.castShadow = true
      key.shadow.camera.near = 1
      key.shadow.camera.far  = 30
      key.shadow.mapSize.set(2048, 2048)
      scene.add(key)

      // Fill light — cool, left
      const fill = new THREE.DirectionalLight(0xd0e8ff, 0.6)
      fill.position.set(-5, 2, 3)
      scene.add(fill)

      // Rim light
      const rim = new THREE.DirectionalLight(0xffffff, 1.0)
      rim.position.set(2, -3, -6)
      scene.add(rim)

      // Floor shadow catcher
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(14, 14),
        new THREE.ShadowMaterial({ opacity: 0.22 }),
      )
      floor.rotation.x = -Math.PI / 2
      floor.position.y = -2.2
      floor.receiveShadow = true
      scene.add(floor)

      return () => {
        cancelAnimationFrame(frameRef.current)
        renderer.dispose()
        if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
        rendererRef.current = null
        sceneRef.current    = null
        cameraRef.current   = null
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Build/replace mesh when design or type changes
    useEffect(() => {
      const scene    = sceneRef.current
      const renderer = rendererRef.current
      if (!scene) return

      // Dispose old mesh
      if (meshRef.current) {
        scene.remove(meshRef.current)
        meshRef.current.geometry.dispose()
        const mats = Array.isArray(meshRef.current.material)
          ? meshRef.current.material
          : [meshRef.current.material]
        mats.forEach((m: THREE.Material) => m.dispose())
        meshRef.current = null
      }
      if (textureRef.current) {
        textureRef.current.dispose()
        textureRef.current = null
      }

      // Handle custom uploaded texture
      if (design?._customTexture) {
        const img = new Image()
        img.onload = () => {
          const cv = document.createElement('canvas')
          cv.width = img.naturalWidth || 2048
          cv.height = img.naturalHeight || 1024
          cv.getContext('2d')!.drawImage(img, 0, 0)
          createAndAddMesh(cv, scene, renderer)
        }
        img.src = design._customTexture
        return
      }

      const cv = buildTexture(design)
      createAndAddMesh(cv, scene, renderer)

      function createAndAddMesh(
        canvas: HTMLCanvasElement,
        scene: THREE.Scene,
        renderer: THREE.WebGLRenderer | null,
      ) {
        const texture = new THREE.CanvasTexture(canvas)
        texture.wrapS         = THREE.RepeatWrapping
        texture.wrapT         = THREE.ClampToEdgeWrapping
        texture.minFilter     = THREE.LinearMipmapLinearFilter
        texture.magFilter     = THREE.LinearFilter
        texture.generateMipmaps = true
        if (renderer) {
          texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
        }
        texture.needsUpdate = true
        textureRef.current = texture

        const bg       = design?.bg_color || '#1A1A2E'
        const geometry = buildGeometry(packagingType)
        const materials = buildMaterials(texture, packagingType, bg)
        const mesh = new THREE.Mesh(
          geometry,
          materials.length === 1 ? materials[0] : materials,
        )
        mesh.castShadow    = true
        mesh.receiveShadow = true
        meshRef.current = mesh
        scene.add(mesh)
      }
    }, [design, packagingType])

    // Animation loop
    useEffect(() => {
      let t = 0
      function animate() {
        frameRef.current = requestAnimationFrame(animate)
        const mesh = meshRef.current
        if (!mesh) return
        t += 0.01
        if (autoRotRef.current) {
          mesh.rotation.y  += 0.005
          mesh.position.y   = Math.sin(t * 0.7) * 0.05
        } else {
          mesh.rotation.x = rotationRef.current.x
          mesh.rotation.y = rotationRef.current.y
        }
        rendererRef.current?.render(sceneRef.current!, cameraRef.current!)
      }
      animate()
      return () => cancelAnimationFrame(frameRef.current)
    }, [])

    // Mouse/touch drag
    const onMouseDown  = useCallback((e: React.MouseEvent) => {
      isDragging.current = true
      lastMouse.current  = { x: e.clientX, y: e.clientY }
      autoRotRef.current = false
    }, [])

    const onMouseMove  = useCallback((e: React.MouseEvent) => {
      if (!isDragging.current) return
      const dx = e.clientX - lastMouse.current.x
      const dy = e.clientY - lastMouse.current.y
      rotationRef.current.y += dx * 0.01
      rotationRef.current.x += dy * 0.01
      lastMouse.current = { x: e.clientX, y: e.clientY }
    }, [])

    const onMouseUp    = useCallback(() => { isDragging.current = false }, [])

    const onTouchStart = useCallback((e: React.TouchEvent) => {
      isDragging.current = true
      lastMouse.current  = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      autoRotRef.current = false
    }, [])

    const onTouchMove  = useCallback((e: React.TouchEvent) => {
      if (!isDragging.current) return
      const dx = e.touches[0].clientX - lastMouse.current.x
      const dy = e.touches[0].clientY - lastMouse.current.y
      rotationRef.current.y += dx * 0.01
      rotationRef.current.x += dy * 0.01
      lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }, [])

    const onTouchEnd   = useCallback(() => { isDragging.current = false }, [])

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
  },
)

export default PackagingViewer3D
