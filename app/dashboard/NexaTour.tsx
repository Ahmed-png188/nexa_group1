'use client'
import { useState, useEffect } from 'react'

interface TourStep {
  id: string; title: string; body: string; color: string
  navId?: string; action?: string; actionHref?: string
}

const STEPS: TourStep[] = [
  { id:'welcome',  title:'Welcome to Nexa', body:"You're looking at your Command Center. Every morning Nexa generates a briefing — what to create today, your brand status, and your top opportunity.", color:'var(--cyan)' },
  { id:'brand',    title:'Start here — Brand Brain', body:"Before Nexa can write in your voice, it needs to learn it. Upload your logo, sample posts, or a brand doc. Claude analyzes everything and builds your brand profile.", color:'var(--success)', navId:'brand', action:'Open Brand Brain', actionHref:'/dashboard/brand' },
  { id:'studio',   title:'Studio — Create anything', body:"Copy, images, video, and voiceovers — all in one place. Every generation uses your Brand Brain so every output sounds like you.", color:'#A78BFA', navId:'studio', action:'Open Studio', actionHref:'/dashboard/studio' },
  { id:'strategy', title:'Strategy — Your 30-day blueprint', body:"One click generates your full content strategy: pillars, winning angles, a day-by-day plan, optimal posting times, and competitor intelligence.", color:'var(--warning)', navId:'strategy', action:'Build my strategy', actionHref:'/dashboard/strategy' },
  { id:'schedule', title:'Schedule — Publish everywhere', body:"Connect Instagram, LinkedIn, X, and TikTok. Drag content onto the calendar, set your time, and Nexa publishes automatically.", color:'var(--cyan)', navId:'schedule', action:'Connect platforms', actionHref:'/dashboard/schedule' },
  { id:'automate', title:'Automate — Set it and forget it', body:"Build email sequences that run automatically. Nexa writes every email in your brand voice, then sends based on triggers.", color:'var(--error)', navId:'automate' },
  { id:'insights', title:"Insights — What's actually working", body:"All your content performance in one view. Hit Explain with AI and Nexa tells you exactly what to do next.", color:'var(--cyan)', navId:'insights' },
  { id:'credits',  title:'Credits — How generation is priced', body:"Every AI generation costs credits: 3 for a post, 5 for an image, 8 for a voiceover, 15 for a video. Strategy, chat, and scheduling are always free.", color:'var(--cyan)' },
  { id:'done',     title:"You're ready to build", body:"Start with Brand Brain — upload anything that represents your brand. Once Nexa knows your voice, every section comes alive. Strategy informs Studio, Studio feeds Schedule.", color:'var(--success)', navId:'brand', action:'Train Brand Brain now', actionHref:'/dashboard/brand' },
]

const TOUR_KEY = 'nexa_tour_v1_completed'

export function useTourState(workspaceId?: string) {
  const [show, setShow] = useState(false)
  const [checked, setChecked] = useState(false)
  useEffect(() => {
    const key = workspaceId ? `nexa_tour_done_${workspaceId}` : TOUR_KEY
    const timer = setTimeout(() => { if (!localStorage.getItem(key)) setShow(true); setChecked(true) }, workspaceId ? 1500 : 0)
    return () => clearTimeout(timer)
  }, [workspaceId])
  function dismiss() { const key = workspaceId ? `nexa_tour_done_${workspaceId}` : TOUR_KEY; localStorage.setItem(key,'1'); localStorage.setItem(TOUR_KEY,'1'); setShow(false) }
  return { show: checked && show, dismiss }
}

export default function NexaTour({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const [tooltipTop, setTooltipTop] = useState<number|null>(null)
  const current = STEPS[step]
  const isFirst = step === 0
  const isLast  = step === STEPS.length - 1

  useEffect(() => {
    if (!current.navId) { setTooltipTop(null); return }
    const el = document.querySelector(`[data-tour="${current.navId}"]`)
    if (!el) { setTooltipTop(null); return }
    const rect = el.getBoundingClientRect()
    setTooltipTop(rect.top + rect.height / 2)
  }, [step, current.navId])

  function next()   { if (isLast) finish(); else setStep(s => s+1) }
  function prev()   { if (step > 0) setStep(s => s-1) }
  function finish() { localStorage.setItem(TOUR_KEY,'1'); onClose() }

  const isPositioned = current.navId && tooltipTop !== null
  const RAIL_W = 52

  const dotBar = (
    <div style={{display:'flex',gap:3,marginBottom:16}}>
      {STEPS.map((_,i)=>(
        <div key={i} onClick={()=>setStep(i)} style={{height:2,flex:1,borderRadius:2,cursor:'pointer',background:i<step?`color-mix(in srgb,${current.color} 40%,transparent)`:i===step?current.color:'var(--border)',transition:'all 0.3s'}}/>
      ))}
    </div>
  )

  const controls = (size: 'sm'|'lg') => (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,marginTop:size==='lg'?28:18}}>
      <button onClick={finish} style={{fontSize:size==='lg'?12:11,color:'var(--text-3)',background:'none',border:'none',cursor:'pointer',fontFamily:'var(--sans)',padding:'6px 0',flexShrink:0}}>
        Skip tour
      </button>
      <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap' as const,justifyContent:'flex-end'}}>
        {!isFirst&&(
          <button onClick={prev} className="btn-secondary" style={{padding:size==='lg'?'9px 16px':'7px 12px',fontSize:size==='lg'?13:12}}>Back</button>
        )}
        <button onClick={next} style={{padding:size==='lg'?'9px 20px':'7px 14px',borderRadius:'var(--r)',fontSize:size==='lg'?13:12,fontWeight:700,background:current.color,color:'var(--bg)',border:'none',cursor:'pointer',fontFamily:'var(--sans)',whiteSpace:'nowrap' as const}}>
          {isLast ? (size==='lg'?'Get started':'Done') : 'Next →'}
        </button>
        {current.action&&current.actionHref&&(
          <a href={current.actionHref} style={{padding:size==='lg'?'9px 16px':'7px 12px',borderRadius:'var(--r)',fontSize:size==='lg'?13:12,fontWeight:600,background:'var(--elevated)',border:'1px solid var(--border)',color:current.color,textDecoration:'none',fontFamily:'var(--sans)',whiteSpace:'nowrap' as const,display:'block'}}>
            {current.action} ↗
          </a>
        )}
      </div>
    </div>
  )

  return (
    <>
      <style dangerouslySetInnerHTML={{__html:`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
        @keyframes popUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .tour-overlay{animation:fadeIn 0.2s ease}
        .tour-side{animation:slideIn 0.25s ease both}
        .tour-center{animation:popUp 0.25s ease both}
      `}}/>

      <div className="tour-overlay" style={{position:'fixed',inset:0,zIndex:9990,background:isPositioned?'rgba(0,0,0,0.55)':'rgba(0,0,0,0.75)',backdropFilter:'blur(4px)',pointerEvents:'none',clipPath:isPositioned?`inset(0 0 0 ${RAIL_W}px)`:undefined}}/>

      {isPositioned&&(
        <div style={{position:'fixed',left:4,top:(tooltipTop as number)-22,width:44,height:44,borderRadius:13,border:`2px solid ${current.color}`,boxShadow:`0 0 20px ${current.color}60`,zIndex:9995,pointerEvents:'none',transition:'top 0.3s ease'}}/>
      )}

      {isPositioned ? (
        <div className="tour-side" style={{position:'fixed',left:RAIL_W+14,top:Math.min(Math.max((tooltipTop as number)-120,12),window.innerHeight-340),width:296,zIndex:9999,background:'var(--surface)',border:`1px solid color-mix(in srgb,${current.color} 25%,var(--border))`,borderRadius:'var(--r-lg)',padding:'20px 20px 16px',boxShadow:`0 24px 60px rgba(0,0,0,0.8), 0 0 40px color-mix(in srgb,${current.color} 8%,transparent)`,pointerEvents:'all'}}>
          <div style={{position:'absolute',left:-8,top:Math.min(Math.max((tooltipTop as number)-Math.min(Math.max((tooltipTop as number)-120,12),window.innerHeight-340)-16,20),200),width:0,height:0,borderTop:'8px solid transparent',borderBottom:'8px solid transparent',borderRight:`8px solid color-mix(in srgb,${current.color} 25%,var(--border))`}}/>
          <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${current.color},transparent)`,borderRadius:'var(--r-lg) var(--r-lg) 0 0'}}/>
          {dotBar}
          <div style={{width:7,height:7,borderRadius:'50%',background:current.color,boxShadow:`0 0 10px ${current.color}`,marginBottom:10}}/>
          <h3 style={{fontFamily:'var(--sans)',fontSize:14,fontWeight:700,letterSpacing:'-0.02em',color:'var(--text-1)',marginBottom:8,lineHeight:1.3}}>{current.title}</h3>
          <p style={{fontSize:12,color:'var(--text-2)',lineHeight:1.75,marginBottom:0}}>{current.body}</p>
          {controls('sm')}
          <div style={{textAlign:'center',marginTop:12,fontSize:10,color:'var(--text-4)'}}>{step+1} / {STEPS.length}</div>
        </div>
      ) : (
        <div className="tour-center" style={{position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}>
          <div style={{width:460,maxWidth:'calc(100vw - 32px)',background:'var(--surface)',border:`1px solid color-mix(in srgb,${current.color} 20%,var(--border))`,borderRadius:'var(--r-xl)',padding:'32px 32px 24px',boxShadow:`0 40px 80px rgba(0,0,0,0.85), 0 0 60px color-mix(in srgb,${current.color} 8%,transparent)`,pointerEvents:'all',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${current.color},transparent)`}}/>
            {dotBar}
            <div style={{width:10,height:10,borderRadius:'50%',background:current.color,boxShadow:`0 0 16px ${current.color}`,marginBottom:14}}/>
            <h2 style={{fontFamily:'var(--sans)',fontSize:20,fontWeight:700,letterSpacing:'-0.03em',color:'var(--text-1)',marginBottom:10,lineHeight:1.2}}>{current.title}</h2>
            <p style={{fontSize:13,color:'var(--text-2)',lineHeight:1.8,marginBottom:0}}>{current.body}</p>
            {controls('lg')}
            <div style={{textAlign:'center',marginTop:16,fontSize:11,color:'var(--text-4)'}}>{step+1} of {STEPS.length}</div>
          </div>
        </div>
      )}
    </>
  )
}
