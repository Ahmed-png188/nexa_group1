'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const C = {
  bg:     '#080808',
  surface:'#111111',
  over:   '#161616',
  border: 'rgba(255,255,255,0.08)',
  borderS:'rgba(255,255,255,0.05)',
  cyan:   '#00AAFF',
  cyanD:  'rgba(0,170,255,0.10)',
  cyanB:  'rgba(0,170,255,0.20)',
  t1:     '#FFFFFF',
  t2:     'rgba(255,255,255,0.65)',
  t3:     'rgba(255,255,255,0.35)',
  t4:     'rgba(255,255,255,0.18)',
}
const EN = "'Geist', -apple-system, sans-serif"

const MOCKUP_LIBRARY = [
  // BOXES
  { id:'box_tuck',      type:'box',    name:'Tuck-top box',     category:'Boxes',   popular:true,
    desc:'Most common retail box',
    preview: { shape:'box'      as const, w:1.4, h:2.0, d:0.7, color:'#F5F0E8' } },
  { id:'box_rigid',     type:'box',    name:'Rigid gift box',   category:'Boxes',   popular:false,
    desc:'Luxury two-piece box',
    preview: { shape:'box'      as const, w:1.6, h:0.7, d:1.6, color:'#1A1A1A' } },
  { id:'box_mailer',    type:'box',    name:'Mailer box',       category:'Boxes',   popular:true,
    desc:'E-commerce shipping box',
    preview: { shape:'box'      as const, w:2.0, h:1.2, d:1.4, color:'#E8E0D0' } },
  { id:'box_square',    type:'box',    name:'Square box',       category:'Boxes',   popular:false,
    desc:'Equal sides, versatile',
    preview: { shape:'box'      as const, w:1.5, h:1.5, d:1.5, color:'#FFFFFF' } },

  // LABELS
  { id:'label_round',   type:'label',  name:'Round label',      category:'Labels',  popular:true,
    desc:'Bottles and jars',
    preview: { shape:'cylinder' as const, w:1.0, h:0.3, d:1.0, color:'#E8F4F8' } },
  { id:'label_rect',    type:'label',  name:'Rectangle label',  category:'Labels',  popular:true,
    desc:'Standard product label',
    preview: { shape:'cylinder' as const, w:1.2, h:0.8, d:1.2, color:'#F8F0E8' } },
  { id:'label_oval',    type:'label',  name:'Oval label',       category:'Labels',  popular:false,
    desc:'Elegant bottle label',
    preview: { shape:'cylinder' as const, w:1.0, h:0.5, d:1.0, color:'#F0F8F0' } },

  // BAGS
  { id:'bag_paper',     type:'bag',    name:'Paper retail bag', category:'Bags',    popular:true,
    desc:'Classic shopping bag',
    preview: { shape:'bag'      as const, w:1.4, h:1.8, d:0.5, color:'#F5F5F0' } },
  { id:'bag_luxury',    type:'bag',    name:'Luxury matte bag', category:'Bags',    popular:false,
    desc:'Premium black bag',
    preview: { shape:'bag'      as const, w:1.2, h:1.6, d:0.4, color:'#0A0A0A' } },
  { id:'bag_kraft',     type:'bag',    name:'Kraft paper bag',  category:'Bags',    popular:false,
    desc:'Eco-friendly natural',
    preview: { shape:'bag'      as const, w:1.3, h:1.7, d:0.5, color:'#C8A882' } },

  // POUCHES
  { id:'pouch_standup', type:'pouch',  name:'Stand-up pouch',   category:'Pouches', popular:true,
    desc:'Coffee, food, supplements',
    preview: { shape:'bag'      as const, w:1.0, h:1.6, d:0.5, color:'#1A1A2E' } },
  { id:'pouch_flat',    type:'pouch',  name:'Flat bottom bag',  category:'Pouches', popular:false,
    desc:'Premium shelf presence',
    preview: { shape:'bag'      as const, w:1.1, h:1.7, d:0.5, color:'#2D1B4E' } },

  // SLEEVES
  { id:'sleeve_bottle', type:'sleeve', name:'Bottle sleeve',    category:'Sleeves', popular:false,
    desc:'Wraps around bottles',
    preview: { shape:'cylinder' as const, w:0.8, h:1.4, d:0.8, color:'#E8E8F0' } },
  { id:'sleeve_box',    type:'sleeve', name:'Box sleeve',       category:'Sleeves', popular:false,
    desc:'Slide-off card',
    preview: { shape:'box'      as const, w:1.8, h:1.0, d:0.2, color:'#F0E8F0' } },
]

const CATEGORIES = ['All', 'Boxes', 'Labels', 'Bags', 'Pouches', 'Sleeves']

export default function PackagingGalleryPage() {
  const router   = useRouter()
  const [cat,    setCat]    = useState('All')
  const [hovered, setHovered] = useState<string | null>(null)

  const filtered = cat === 'All'
    ? MOCKUP_LIBRARY
    : MOCKUP_LIBRARY.filter(m => m.category === cat)

  const handleSelect = (mockup: typeof MOCKUP_LIBRARY[0]) => {
    router.push(`/dashboard/product-lab/packaging/editor?type=${mockup.type}&variant=${mockup.id}`)
  }

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: C.bg, fontFamily: EN, color: C.t1, overflow: 'hidden',
    }}>

      {/* ── TOP BAR ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', height: 56,
        borderBottom: `1px solid ${C.border}`,
        background: C.surface, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => router.push('/dashboard/product-lab')}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
              background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`,
              color: C.t3, cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.t1 }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.t3 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Product Lab
          </button>
          <div style={{ width: 1, height: 18, background: C.border }}/>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.t1 }}>Packaging Studio</span>
        </div>
        <span style={{ fontSize: 12, color: C.t4 }}>Choose a packaging type to start designing</span>
      </div>

      {/* ── CATEGORY FILTER ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '14px 28px', borderBottom: `1px solid ${C.borderS}`,
        flexShrink: 0,
      }}>
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCat(c)}
            style={{
              padding: '6px 16px', borderRadius: 99, fontSize: 12, fontWeight: 500,
              background: cat === c ? C.cyan : 'rgba(255,255,255,0.04)',
              border: `1px solid ${cat === c ? C.cyan : C.border}`,
              color: cat === c ? '#000000' : C.t3,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >{c}</button>
        ))}
        <div style={{ flex: 1 }}/>
        <span style={{ fontSize: 11, color: C.t4 }}>{filtered.length} templates</span>
      </div>

      {/* ── GRID ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
        }}>
          {filtered.map(mockup => (
            <div
              key={mockup.id}
              onClick={() => handleSelect(mockup)}
              onMouseEnter={() => setHovered(mockup.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                borderRadius: 14,
                border: `1px solid ${hovered === mockup.id ? 'rgba(0,170,255,0.30)' : C.border}`,
                background: hovered === mockup.id ? 'rgba(255,255,255,0.03)' : C.surface,
                cursor: 'pointer', transition: 'all 0.18s',
                overflow: 'hidden', position: 'relative',
                transform: hovered === mockup.id ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: hovered === mockup.id ? '0 12px 40px rgba(0,0,0,0.5)' : 'none',
              }}
            >
              {mockup.popular && (
                <div style={{
                  position: 'absolute', top: 10, right: 10, zIndex: 10,
                  fontSize: 9, fontWeight: 700, padding: '3px 8px',
                  borderRadius: 99, letterSpacing: '0.06em',
                  background: 'rgba(0,170,255,0.15)', border: '1px solid rgba(0,170,255,0.25)',
                  color: C.cyan,
                }}>POPULAR</div>
              )}
              <PackagingThumbnail mockup={mockup} isHovered={hovered === mockup.id} />
              <div style={{ padding: '14px 16px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.t1, marginBottom: 3 }}>
                  {mockup.name}
                </div>
                <div style={{ fontSize: 11, color: C.t4 }}>{mockup.desc}</div>
                {hovered === mockup.id && (
                  <div style={{
                    marginTop: 10, padding: '7px 12px', borderRadius: 7,
                    background: C.cyan, color: '#000',
                    fontSize: 11, fontWeight: 700, textAlign: 'center',
                    animation: 'fadeIn 0.15s ease',
                  }}>
                    Start designing →
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:translateY(0) } }
        ::-webkit-scrollbar { width: 4px }
        ::-webkit-scrollbar-track { background: transparent }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.10); border-radius: 4px }
      `}</style>
    </div>
  )
}

// ── CSS 3D thumbnail ─────────────────────────────────────────────
function PackagingThumbnail({
  mockup, isHovered,
}: {
  mockup: typeof MOCKUP_LIBRARY[0]
  isHovered: boolean
}) {
  const p = mockup.preview
  const bg = p.color

  const r = parseInt(bg.slice(1,3),16)
  const g = parseInt(bg.slice(3,5),16)
  const b = parseInt(bg.slice(5,7),16)
  const isDark = r*0.299 + g*0.587 + b*0.114 < 128
  const accentColor = isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.20)'

  return (
    <div style={{
      height: 180,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, #141414 0%, #0C0C0C 100%)',
      position: 'relative', overflow: 'hidden',
      perspective: '600px',
    }}>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
        background: 'linear-gradient(to top, rgba(255,255,255,0.02), transparent)',
        pointerEvents: 'none',
      }}/>

      <div style={{
        position: 'relative',
        transformStyle: 'preserve-3d',
        transform: `rotateX(${p.shape === 'cylinder' ? '5deg' : '12deg'}) rotateY(${isHovered ? '-28deg' : '-22deg'})`,
        transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        width:  `${p.w * 80}px`,
        height: `${p.h * 80}px`,
      }}>
        {p.shape !== 'cylinder' ? (
          <>
            {/* Front face */}
            <div style={{
              position: 'absolute', inset: 0,
              background: bg,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              transform: `translateZ(${p.d * 40}px)`,
              backfaceVisibility: 'hidden',
              borderRadius: p.shape === 'bag' ? '6px 6px 3px 3px' : 2,
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
            }}>
              <div style={{ width:'60%', height:2, background:accentColor, marginBottom:6, borderRadius:1 }}/>
              <div style={{ width:'40%', height:1.5, background:accentColor, opacity:0.5, borderRadius:1 }}/>
            </div>
            {/* Right face */}
            <div style={{
              position: 'absolute', top:0, right:0,
              width: `${p.d * 80}px`, height: '100%',
              background: `rgba(0,0,0,0.3)`,
              backgroundImage: `linear-gradient(to right, ${bg}, rgba(0,0,0,0.4))`,
              transform: 'rotateY(90deg)',
              transformOrigin: 'right center',
              backfaceVisibility: 'hidden',
            }}/>
            {/* Top face */}
            <div style={{
              position: 'absolute', top:0, left:0, right:0,
              height: `${p.d * 32}px`,
              background: `rgba(255,255,255,0.12)`,
              backgroundImage: `linear-gradient(${bg}, rgba(255,255,255,0.08))`,
              transform: 'rotateX(90deg)',
              transformOrigin: 'top center',
              backfaceVisibility: 'hidden',
            }}/>
          </>
        ) : (
          // Cylinder for labels
          <div style={{
            width:'100%', height:'100%',
            background: `conic-gradient(
              from 0deg,
              rgba(0,0,0,0.35) 0deg,
              ${bg} 60deg,
              rgba(255,255,255,0.15) 120deg,
              ${bg} 180deg,
              rgba(0,0,0,0.25) 360deg
            )`,
            borderRadius: '50%',
            boxShadow: `0 8px 32px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.10)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width:'55%', height:'40%',
              background: 'rgba(255,255,255,0.10)',
              borderRadius: 3,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
              <div style={{ width:'70%', height:1.5, background:'rgba(255,255,255,0.5)', borderRadius:1 }}/>
              <div style={{ width:'50%', height:1, background:'rgba(255,255,255,0.3)', borderRadius:1 }}/>
            </div>
          </div>
        )}
      </div>

      {isHovered && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, rgba(0,170,255,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}/>
      )}
    </div>
  )
}
