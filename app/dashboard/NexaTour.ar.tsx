'use client'
import { useState, useEffect } from 'react'

interface TourStep {
  id: string; title: string; body: string; color: string
  navId?: string; action?: string; actionHref?: string
}

const STEPS: TourStep[] = [
  { id:'welcome',  title:'أهلاً في Nexa', body:'أمامك مركز القيادة. كل صباح Nexa تولّد لك إحاطة يومية — ايش تنشئ اليوم، حالة براندك، وأهم فرصة متاحة.', color:'var(--cyan)' },
  { id:'brand',    title:'ابدأ هنا — Brand Brain', body:'قبل ما Nexa تكتب بصوتك، لازم تتعلّمه. ارفع شعارك، منشوراتك النموذجية، أو وثيقة براند. Nexa تحلّل كل شيء وتبني ملفك.', color:'var(--success)', navId:'brand', action:'افتح Brand Brain', actionHref:'/dashboard/brand' },
  { id:'studio',   title:'الاستوديو — أنشئ أي شيء', body:'نصوص، صور، فيديوهات، وأصوات — كلها في مكان واحد. كل إنتاج يستخدم Brand Brain الخاص بك فيبدو وكأنك أنت كتبته.', color:'#A78BFA', navId:'studio', action:'افتح الاستوديو', actionHref:'/dashboard/studio' },
  { id:'strategy', title:'الاستراتيجية — مخططك لـ 30 يوم', body:'نقرة واحدة تولّد استراتيجيتك الكاملة: ركائز، زوايا رابحة، خطة يوم بيوم، أفضل أوقات النشر، وذكاء تنافسي.', color:'var(--warning)', navId:'strategy', action:'ابنِ استراتيجيتي', actionHref:'/dashboard/strategy' },
  { id:'schedule', title:'الجدولة — انشر في كل مكان', body:'وصّل Instagram وLinkedIn وX وTikTok. اسحب الكونتنت على التقويم، حدّد الوقت، وNexa تنشر تلقائياً.', color:'var(--cyan)', navId:'schedule', action:'وصّل المنصات', actionHref:'/dashboard/schedule' },
  { id:'automate', title:'Automate — شغّل وانسَ', body:'ابنِ تسلسلات إيميل تشتغل وحدها. Nexa تكتب كل إيميل بصوت براندك، ثم ترسله بناءً على مشغّلات تحددها أنت.', color:'var(--error)', navId:'automate' },
  { id:'insights', title:'الإنسايتس — ايش فعلاً يشتغل', body:'كل أداء كونتنتك في نظرة واحدة. اضغط "اشرح لي بالذكاء" وNexa تخبرك بالضبط ايش تسوي بعدين.', color:'var(--cyan)', navId:'insights' },
  { id:'credits',  title:'الأرصدة — كيف يُحسب الإنتاج', body:'كل إنتاج AI يكلّف أرصدة: 3 لمنشور، 5 لصورة، 8 لصوت، 15 لفيديو. الاستراتيجية والمحادثة والجدولة مجانية دائماً.', color:'var(--cyan)' },
  { id:'done',     title:'أنت جاهز تبني', body:'ابدأ بـ Brand Brain — ارفع أي شيء يمثّل براندك. لمّا Nexa تعرف صوتك، كل قسم يحيا. الاستراتيجية تُغذّي الاستوديو، الاستوديو يُغذّي الجدولة.', color:'var(--success)', navId:'brand', action:'درّب Brand Brain الآن', actionHref:'/dashboard/brand' },
]

const TOUR_KEY = 'nexa_tour_v1_completed'

export function useTourState(workspaceId?: string) {
  const [show,    setShow]    = useState(false)
  const [checked, setChecked] = useState(false)
  useEffect(() => {
    const key   = workspaceId ? `nexa_tour_done_${workspaceId}` : TOUR_KEY
    const timer = setTimeout(() => { if (!localStorage.getItem(key)) setShow(true); setChecked(true) }, workspaceId ? 1500 : 0)
    return () => clearTimeout(timer)
  }, [workspaceId])
  function dismiss() {
    const key = workspaceId ? `nexa_tour_done_${workspaceId}` : TOUR_KEY
    localStorage.setItem(key, '1'); localStorage.setItem(TOUR_KEY, '1'); setShow(false)
  }
  return { show: checked && show, dismiss }
}

export default function NexaTourAr({ onClose }: { onClose: () => void }) {
  const [step,       setStep]       = useState(0)
  const [tooltipTop, setTooltipTop] = useState<number|null>(null)
  const current = STEPS[step]
  const isFirst = step === 0
  const isLast  = step === STEPS.length - 1

  useEffect(() => {
    if (!current.navId) { setTooltipTop(null); return }
    const el = document.querySelector(`[data-tour="${current.navId}"]`)
    if (!el)            { setTooltipTop(null); return }
    const rect = el.getBoundingClientRect()
    setTooltipTop(rect.top + rect.height / 2)
  }, [step, current.navId])

  function next()   { if (isLast) finish(); else setStep(s => s + 1) }
  function prev()   { if (step > 0) setStep(s => s - 1) }
  function finish() { localStorage.setItem(TOUR_KEY, '1'); onClose() }

  const isPositioned = current.navId && tooltipTop !== null
  const RAIL_W = 52

  const dotBar = (
    <div style={{ display:'flex', gap:3, marginBottom:16 }}>
      {STEPS.map((_, i) => (
        <div key={i} onClick={() => setStep(i)} style={{ height:2, flex:1, borderRadius:2, cursor:'pointer', background:i < step ? `color-mix(in srgb,${current.color} 40%,transparent)` : i === step ? current.color : 'var(--border)', transition:'all 0.3s' }}/>
      ))}
    </div>
  )

  const controls = (size: 'sm'|'lg') => (
    <div dir="rtl" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginTop:size === 'lg' ? 28 : 18 }}>
      <button onClick={finish} style={{ fontSize:size === 'lg' ? 12 : 11, color:'var(--text-3)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--sans)', padding:'6px 0', flexShrink:0 }}>
        تجاوز الجولة
      </button>
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' as const, justifyContent:'flex-start' }}>
        {!isFirst && (
          <button onClick={prev} className="btn-secondary" style={{ padding:size === 'lg' ? '9px 16px' : '7px 12px', fontSize:size === 'lg' ? 13 : 12 }}>رجوع</button>
        )}
        <button onClick={next} style={{ padding:size === 'lg' ? '9px 20px' : '7px 14px', borderRadius:'var(--r)', fontSize:size === 'lg' ? 13 : 12, fontWeight:700, background:current.color, color:'var(--bg)', border:'none', cursor:'pointer', fontFamily:'var(--sans)', whiteSpace:'nowrap' as const }}>
          {isLast ? (size === 'lg' ? 'ابدأ الآن' : 'تمّ') : '← التالي'}
        </button>
        {current.action && current.actionHref && (
          <a href={current.actionHref} style={{ padding:size === 'lg' ? '9px 16px' : '7px 12px', borderRadius:'var(--r)', fontSize:size === 'lg' ? 13 : 12, fontWeight:600, background:'var(--elevated)', border:'1px solid var(--border)', color:current.color, textDecoration:'none', fontFamily:'var(--sans)', whiteSpace:'nowrap' as const, display:'block' }}>
            ↙ {current.action}
          </a>
        )}
      </div>
    </div>
  )

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html:`
        @keyframes fadeIn  { from{opacity:0}                          to{opacity:1} }
        @keyframes slideIn { from{opacity:0;transform:translateX(10px)} to{opacity:1;transform:translateX(0)} }
        @keyframes popUp   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .tour-overlay { animation:fadeIn 0.2s ease }
        .tour-side    { animation:slideIn 0.25s ease both }
        .tour-center  { animation:popUp  0.25s ease both }
      `}}/>

      <div className="tour-overlay" style={{ position:'fixed', inset:0, zIndex:9990, background:isPositioned ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.75)', backdropFilter:'blur(4px)', pointerEvents:'none', clipPath:isPositioned ? `inset(0 0 0 ${RAIL_W}px)` : undefined }}/>

      {isPositioned && (
        <div style={{ position:'fixed', left:4, top:(tooltipTop as number) - 22, width:44, height:44, borderRadius:13, border:`2px solid ${current.color}`, boxShadow:`0 0 20px ${current.color}60`, zIndex:9995, pointerEvents:'none', transition:'top 0.3s ease' }}/>
      )}

      {isPositioned ? (
        /* ── tooltip جانبي مع RTL ── */
        <div className="tour-side" dir="rtl" style={{ position:'fixed', left:RAIL_W + 14, top:Math.min(Math.max((tooltipTop as number) - 120, 12), window.innerHeight - 340), width:296, zIndex:9999, background:'var(--surface)', border:`1px solid color-mix(in srgb,${current.color} 25%,var(--border))`, borderRadius:'var(--r-lg)', padding:'20px 20px 16px', boxShadow:`0 24px 60px rgba(0,0,0,0.8), 0 0 40px color-mix(in srgb,${current.color} 8%,transparent)`, pointerEvents:'all' }}>
          <div style={{ position:'absolute', left:-8, top:Math.min(Math.max((tooltipTop as number) - Math.min(Math.max((tooltipTop as number) - 120, 12), window.innerHeight - 340) - 16, 20), 200), width:0, height:0, borderTop:'8px solid transparent', borderBottom:'8px solid transparent', borderRight:`8px solid color-mix(in srgb,${current.color} 25%,var(--border))` }}/>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${current.color},transparent)`, borderRadius:'var(--r-lg) var(--r-lg) 0 0' }}/>
          {dotBar}
          <div style={{ width:7, height:7, borderRadius:'50%', background:current.color, boxShadow:`0 0 10px ${current.color}`, marginBottom:10 }}/>
          <h3 style={{ fontFamily:'var(--sans)', fontSize:14, fontWeight:700, letterSpacing:'-0.02em', color:'var(--text-1)', marginBottom:8, lineHeight:1.3 }}>{current.title}</h3>
          <p style={{ fontSize:12, color:'var(--text-2)', lineHeight:1.75, marginBottom:0 }}>{current.body}</p>
          {controls('sm')}
          <div style={{ textAlign:'center', marginTop:12, fontSize:10, color:'var(--text-4)' }}>{step + 1} / {STEPS.length}</div>
        </div>
      ) : (
        /* ── بطاقة مركزية ── */
        <div className="tour-center" style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
          <div dir="rtl" style={{ width:460, maxWidth:'calc(100vw - 32px)', background:'var(--surface)', border:`1px solid color-mix(in srgb,${current.color} 20%,var(--border))`, borderRadius:'var(--r-xl)', padding:'32px 32px 24px', boxShadow:`0 40px 80px rgba(0,0,0,0.85), 0 0 60px color-mix(in srgb,${current.color} 8%,transparent)`, pointerEvents:'all', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${current.color},transparent)` }}/>
            {dotBar}
            <div style={{ width:10, height:10, borderRadius:'50%', background:current.color, boxShadow:`0 0 16px ${current.color}`, marginBottom:14 }}/>
            <h2 style={{ fontFamily:'var(--sans)', fontSize:20, fontWeight:700, letterSpacing:'-0.03em', color:'var(--text-1)', marginBottom:10, lineHeight:1.2 }}>{current.title}</h2>
            <p style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.8, marginBottom:0 }}>{current.body}</p>
            {controls('lg')}
            <div style={{ textAlign:'center', marginTop:16, fontSize:11, color:'var(--text-4)' }}>{step + 1} من {STEPS.length}</div>
          </div>
        </div>
      )}
    </>
  )
}
