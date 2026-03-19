'use client'
import { useState, useEffect, useRef } from 'react'

interface TourStep {
  id: string
  title: string
  body: string
  color: string
  navId?: string        // matches NAV item id to highlight + position next to
  action?: string
  actionHref?: string
}

const STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Nexa',
    body: "You're looking at your Command Center. Every morning Nexa generates a briefing — what to create today, your brand status, and your top opportunity.",
    color: '#4D9FFF',
  },
  {
    id: 'brand-brain',
    title: 'Start here — Brand Brain',
    body: "Before Nexa can write in your voice, it needs to learn it. Upload your logo, sample posts, or a brand doc. Claude analyzes everything and builds your brand profile.",
    color: '#34D399',
    navId: 'brand',
    action: 'Open Brand Brain',
    actionHref: '/dashboard/brand',
  },
  {
    id: 'studio',
    title: 'Studio — Create anything',
    body: "Copy, images, video, and voiceovers — all in one place. Every generation uses your Brand Brain so every output sounds like you.",
    color: '#A78BFA',
    navId: 'studio',
    action: 'Open Studio',
    actionHref: '/dashboard/studio',
  },
  {
    id: 'strategy',
    title: 'Strategy — Your 30-day blueprint',
    body: "One click generates your full content strategy: pillars, winning angles, a day-by-day plan, optimal posting times, and competitor intelligence.",
    color: '#FFB547',
    navId: 'strategy',
    action: 'Build my strategy',
    actionHref: '/dashboard/strategy',
  },
  {
    id: 'schedule',
    title: 'Schedule — Publish everywhere',
    body: "Connect Instagram, LinkedIn, X, and TikTok. Drag content onto the calendar, set your time, and Nexa publishes automatically.",
    color: '#4D9FFF',
    navId: 'schedule',
    action: 'Connect platforms',
    actionHref: '/dashboard/schedule',
  },
  {
    id: 'automate',
    title: 'Automate — Set it and forget it',
    body: "Build email sequences that run automatically. Nexa writes every email in your brand voice, then sends based on triggers — new subscriber, purchase, form submission.",
    color: '#FF5757',
    navId: 'automate',
  },
  {
    id: 'insights',
    title: "Insights — What's actually working",
    body: "All your content performance in one view. Connect your platforms to pull real engagement data. Hit Explain with AI and Nexa tells you exactly what to do next.",
    color: '#38BFFF',
    navId: 'insights',
  },
  {
    id: 'credits',
    title: 'Credits — How generation is priced',
    body: "Every AI generation costs credits: 3 for a post, 5 for an image, 8 for a voiceover, 15 for a video. Strategy, chat, and scheduling are always free. You start with 500.",
    color: '#4D9FFF',
  },
  {
    id: 'done',
    title: "You're ready to build",
    body: "Start with Brand Brain — upload anything that represents your brand. Once Nexa knows your voice, every section comes alive. Strategy informs Studio, Studio feeds Schedule.",
    color: '#34D399',
    navId: 'brand',
    action: 'Train Brand Brain now',
    actionHref: '/dashboard/brand',
  },
]

const TOUR_KEY = 'nexa_tour_v1_completed'

export function useTourState(workspaceId?: string) {
  const [show, setShow] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const key = workspaceId ? `nexa_tour_done_${workspaceId}` : TOUR_KEY
    const timer = setTimeout(() => {
      const done = localStorage.getItem(key)
      if (!done) setShow(true)
      setChecked(true)
    }, workspaceId ? 1500 : 0)
    return () => clearTimeout(timer)
  }, [workspaceId])

  function dismiss() {
    const key = workspaceId ? `nexa_tour_done_${workspaceId}` : TOUR_KEY
    localStorage.setItem(key, '1')
    localStorage.setItem(TOUR_KEY, '1')
    setShow(false)
  }
  return { show: checked && show, dismiss }
}

export default function NexaTour({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const [tooltipTop, setTooltipTop] = useState<number | null>(null)
  const current = STEPS[step]
  const isFirst = step === 0
  const isLast  = step === STEPS.length - 1
  const progress = ((step + 1) / STEPS.length) * 100

  // Find the nav element to position next to
  useEffect(() => {
    if (!current.navId) { setTooltipTop(null); return }
    const el = document.querySelector(`[data-tour="${current.navId}"]`)
    if (!el) { setTooltipTop(null); return }
    const rect = el.getBoundingClientRect()
    setTooltipTop(rect.top + rect.height / 2)
  }, [step, current.navId])

  function next() { if (isLast) { finish(); return }; setStep(s => s + 1) }
  function prev() { if (step > 0) setStep(s => s - 1) }
  function finish() { localStorage.setItem(TOUR_KEY, '1'); onClose() }

  const isPositioned = current.navId && tooltipTop !== null
  const RAIL_W = 52

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
        @keyframes popUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .tour-overlay { animation: fadeIn 0.2s ease }
        .tour-card-side { animation: slideIn 0.25s ease both }
        .tour-card-center { animation: popUp 0.25s ease both }
      ` }} />

      {/* Overlay — clips the nav rail area so icons remain visible when highlighted */}
      <div className="tour-overlay" style={{ position:'fixed', inset:0, zIndex:9990, background: isPositioned ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.75)', backdropFilter:'blur(4px)', pointerEvents:'none', clipPath: isPositioned ? `inset(0 0 0 ${RAIL_W}px)` : undefined }}/>

      {/* Highlight the nav item */}
      {isPositioned && (
        <div style={{ position:'fixed', left:4, top:(tooltipTop as number) - 22, width:44, height:44, borderRadius:13, border:'2px solid ' + current.color, boxShadow:'0 0 20px ' + current.color + '60, 0 0 40px ' + current.color + '20', zIndex:9995, pointerEvents:'none', transition:'top 0.3s ease, border-color 0.3s ease' }}/>
      )}

      {/* Tooltip card — positioned next to nav OR centered */}
      {isPositioned ? (
        // Sidebar positioned card
        <div className="tour-card-side" style={{
          position:'fixed',
          left: RAIL_W + 14,
          top: Math.min(Math.max((tooltipTop as number) - 120, 12), window.innerHeight - 320),
          width: 300,
          zIndex: 9999,
          background:'rgba(10,10,18,0.99)',
          border:'1px solid ' + current.color + '30',
          borderRadius:18,
          padding:'22px 22px 18px',
          boxShadow:'0 0 60px ' + current.color + '10, 0 24px 60px rgba(0,0,0,0.8)',
          pointerEvents:'all',
        }}>
          {/* Arrow pointing left toward nav */}
          <div style={{ position:'absolute', left:-8, top: Math.min(Math.max((tooltipTop as number) - Math.min(Math.max((tooltipTop as number) - 120, 12), window.innerHeight - 320) - 16, 20), 200), width:0, height:0, borderTop:'8px solid transparent', borderBottom:'8px solid transparent', borderRight:'8px solid ' + current.color + '30' }}/>

          {/* Top accent */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,' + current.color + ',transparent)', borderRadius:'18px 18px 0 0' }}/>

          {/* Step dots */}
          <div style={{ display:'flex', gap:3, marginBottom:16 }}>
            {STEPS.map((_,i) => (
              <div key={i} onClick={() => setStep(i)} style={{ height:2, flex:1, borderRadius:2, cursor:'pointer', background: i < step ? current.color + '55' : i === step ? current.color : 'rgba(255,255,255,0.08)', transition:'all 0.3s' }}/>
            ))}
          </div>

          <div style={{ width:8, height:8, borderRadius:'50%', background:current.color, boxShadow:'0 0 10px ' + current.color, marginBottom:12 }}/>

          <h3 style={{ fontFamily:'var(--display)', fontSize:15, fontWeight:800, letterSpacing:'-0.03em', color:'rgba(255,255,255,0.95)', marginBottom:10, lineHeight:1.25 }}>
            {current.title}
          </h3>
          <p style={{ fontSize:12.5, color:'rgba(255,255,255,0.5)', lineHeight:1.75, marginBottom:18 }}>
            {current.body}
          </p>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
            <button onClick={finish} style={{ fontSize:11, color:'rgba(255,255,255,0.25)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--sans)', padding:'6px 0', flexShrink:0 }}>
              Skip
            </button>
            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', justifyContent:'flex-end' }}>
              {!isFirst && (
                <button onClick={prev} style={{ padding:'8px 14px', borderRadius:9, fontSize:12, fontWeight:600, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.55)', cursor:'pointer', fontFamily:'var(--sans)', whiteSpace:'nowrap' }}>
                  Back
                </button>
              )}
              <button onClick={next} style={{ padding:'8px 16px', borderRadius:9, fontSize:12, fontWeight:700, background:current.color, color:'#000', border:'none', cursor:'pointer', fontFamily:'var(--sans)', whiteSpace:'nowrap' }}>
                {isLast ? 'Done' : 'Next →'}
              </button>
              {current.action && current.actionHref && (
                <a href={current.actionHref} style={{ padding:'8px 14px', borderRadius:9, fontSize:12, fontWeight:600, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', color:current.color, textDecoration:'none', fontFamily:'var(--sans)', whiteSpace:'nowrap', display:'block' }}>
                  {current.action} ↗
                </a>
              )}
            </div>
          </div>

          <div style={{ textAlign:'center', marginTop:14, fontSize:10, color:'rgba(255,255,255,0.18)' }}>
            {step + 1} / {STEPS.length}
          </div>
        </div>
      ) : (
        // Center modal for non-nav steps
        <div className="tour-card-center" style={{
          position:'fixed', inset:0, zIndex:9999,
          display:'flex', alignItems:'center', justifyContent:'center',
          pointerEvents:'none',
        }}>
          <div style={{ width:460, maxWidth:'calc(100vw - 32px)', background:'rgba(10,10,18,0.99)', border:'1px solid ' + current.color + '28', borderRadius:22, padding:'34px 34px 26px', boxShadow:'0 0 80px ' + current.color + '10, 0 40px 80px rgba(0,0,0,0.85)', pointerEvents:'all', position:'relative', overflow:'hidden' }}>

            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,' + current.color + ',transparent)' }}/>

            <div style={{ display:'flex', gap:4, marginBottom:24 }}>
              {STEPS.map((_,i) => (
                <div key={i} onClick={() => setStep(i)} style={{ height:3, flex:1, borderRadius:3, cursor:'pointer', background: i < step ? current.color + '55' : i === step ? current.color : 'rgba(255,255,255,0.07)', transition:'all 0.3s' }}/>
              ))}
            </div>

            <div style={{ width:10, height:10, borderRadius:'50%', background:current.color, boxShadow:'0 0 16px ' + current.color, marginBottom:16 }}/>

            <h2 style={{ fontFamily:'var(--display)', fontSize:22, fontWeight:800, letterSpacing:'-0.04em', color:'rgba(255,255,255,0.95)', marginBottom:12, lineHeight:1.2 }}>
              {current.title}
            </h2>
            <p style={{ fontSize:14, color:'rgba(255,255,255,0.52)', lineHeight:1.8, marginBottom:28 }}>
              {current.body}
            </p>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
              <button onClick={finish} style={{ fontSize:12, color:'rgba(255,255,255,0.28)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--sans)', padding:'8px 0', flexShrink:0 }}>
                Skip tour
              </button>
              <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', justifyContent:'flex-end' }}>
                {!isFirst && (
                  <button onClick={prev} style={{ padding:'10px 18px', borderRadius:10, fontSize:13, fontWeight:600, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', color:'rgba(255,255,255,0.55)', cursor:'pointer', fontFamily:'var(--sans)', whiteSpace:'nowrap' }}>
                    Back
                  </button>
                )}
                <button onClick={next} style={{ padding:'10px 22px', borderRadius:10, fontSize:13, fontWeight:700, background:current.color, color:'#000', border:'none', cursor:'pointer', fontFamily:'var(--sans)', whiteSpace:'nowrap' }}>
                  {isLast ? 'Get started' : 'Next →'}
                </button>
                {current.action && current.actionHref && (
                  <a href={current.actionHref} style={{ padding:'10px 18px', borderRadius:10, fontSize:13, fontWeight:600, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', color:current.color, textDecoration:'none', fontFamily:'var(--sans)', whiteSpace:'nowrap', display:'block' }}>
                    {current.action} ↗
                  </a>
                )}
              </div>
            </div>

            <div style={{ textAlign:'center', marginTop:16, fontSize:11, color:'rgba(255,255,255,0.18)' }}>
              {step + 1} of {STEPS.length}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
