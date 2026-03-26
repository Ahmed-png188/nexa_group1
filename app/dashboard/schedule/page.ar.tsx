'use client'
import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, addMonths, subMonths, parseISO } from 'date-fns'
import { arSA } from 'date-fns/locale'
import Link from 'next/link'

// ── Font constants ─────────────────────────────────────────────
const F    = "'Tajawal', system-ui, sans-serif"
const MONO = "'Geist Mono', monospace"

// ── Types ──────────────────────────────────────────────────────
type Platform = 'instagram' | 'linkedin' | 'x' | 'tiktok' | 'email' | 'general'
type View     = 'calendar' | 'queue' | 'platforms'

// ── Platform colors & labels ───────────────────────────────────
const PC: Record<string, string> = {
  instagram: '#E1306C',
  linkedin:  '#0A66C2',
  x:         '#E7E7E7',
  tiktok:    '#FF0050',
  email:     '#00AAFF',
  general:   '#666',
}
const PL: Record<string, string> = {
  instagram: 'Instagram',
  linkedin:  'LinkedIn',
  x:         'X',
  tiktok:    'TikTok',
  email:     'إيميل',
  general:   'عام',
}

// ── Arabic day-of-week headers ─────────────────────────────────
// Sunday first — matches JS getDay()
const DOW_AR = ['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب']

// ── Icons ──────────────────────────────────────────────────────
const Ic = {
  cal:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  list:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  link:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  plus:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  check: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  // In RTL: chevR goes to the PREVIOUS month, chevL goes to the NEXT month
  chevR: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>,
  chevL: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>,
  close: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  bolt:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
}

// ── Small shared components ────────────────────────────────────
function Dot({ platform, size = 6 }: { platform: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: PC[platform] || '#666', flexShrink: 0 }} />
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(0,170,255,0.70)', marginBottom: '10px', fontFamily: F }}>
      {children}
    </div>
  )
}

// ── Main inner component ───────────────────────────────────────
function ScheduleArInner() {
  const supabase     = createClient()
  const searchParams = useSearchParams()

  const [ws,        setWs]        = useState<any>(null)
  const [view,      setView]      = useState<View>('calendar')
  const [month,     setMonth]     = useState(new Date())
  const [posts,     setPosts]     = useState<any[]>([])
  const [drafts,    setDrafts]    = useState<any[]>([])
  const [connPlats, setConnPlats] = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(false)
  const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null)
  const [mounted,   setMounted]   = useState(false)

  // Modal form state
  const [fPlat,  setFPlat]  = useState<Platform>('instagram')
  const [fDate,  setFDate]  = useState('')
  const [fTime,  setFTime]  = useState('09:00')
  const [fBody,  setFBody]  = useState('')
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    setMounted(true)
    const c = searchParams.get('connected')
    if (c) showToast(`تم توصيل ${PL[c] || c}!`)
    load()
  }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: m } = await supabase
      .from('workspace_members')
      .select('workspace_id, workspaces(*)')
      .eq('user_id', user.id)
      .limit(1)
      .single()
    const w = (m as any)?.workspaces
    setWs(w)

    const [{ data: s }, { data: d }, { data: p }] = await Promise.all([
      supabase.from('content').select('*').eq('workspace_id', w?.id).eq('status', 'scheduled').order('scheduled_for', { ascending: true }),
      supabase.from('content').select('*').eq('workspace_id', w?.id).eq('status', 'draft').order('created_at', { ascending: false }).limit(20),
      supabase.from('connected_platforms').select('*').eq('workspace_id', w?.id).eq('is_active', true),
    ])
    setPosts(s ?? [])
    setDrafts(d ?? [])
    setConnPlats(p ?? [])
    setLoading(false)

    supabase
      .channel('sched-ar-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'content', filter: `workspace_id=eq.${w?.id}` }, () => load())
      .subscribe()
  }

  async function schedule() {
    if (!fBody.trim() || !fDate || saving) return
    setSaving(true)
    const dt = new Date(`${fDate}T${fTime}:00`)
    try {
      const r = await fetch('/api/schedule-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: ws.id, platform: fPlat, body: fBody, scheduled_for: dt.toISOString() }),
      })
      if (r.ok) {
        setSaved(true)
        showToast('تم الجدولة — المنشور في القائمة')
        setFBody('')
        setTimeout(() => { setModal(false); setSaved(false) }, 1400)
      } else {
        showToast('صار خطأ — جرّب مرة ثانية', false)
      }
    } catch {
      showToast('صار خطأ', false)
    }
    setSaving(false)
  }

  async function publishNow(id: string) {
    try {
      const r = await fetch('/api/schedule-post', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_id: id, action: 'publish' }),
      })
      if (r.ok) { showToast('تم النشر!'); load() }
      else showToast('فشل النشر', false)
    } catch {}
  }

  async function del(id: string) {
    await fetch(`/api/schedule-post?id=${id}`, { method: 'DELETE' })
    showToast('تم الحذف')
    load()
  }

  function openForDay(day: Date) {
    setFDate(format(day, 'yyyy-MM-dd'))
    setFBody('')
    setModal(true)
  }

  function openForDraft(draft: any) {
    setFBody(draft.body || '')
    setFPlat(draft.platform || 'instagram')
    setFDate(format(new Date(), 'yyyy-MM-dd'))
    setModal(true)
  }

  // ── Loading ────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - var(--topbar-h))', flexDirection: 'column', gap: '14px', background: '#0C0C0C' }}>
      <div className="nexa-spinner" style={{ width: 22, height: 22 }} />
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', fontFamily: F }}>يحمّل...</div>
    </div>
  )

  // ── Derived data ───────────────────────────────────────────
  const days     = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const pad      = days[0].getDay() // 0 = Sunday
  const onDay    = (d: Date) => posts.filter(p => p.scheduled_for && isSameDay(parseISO(p.scheduled_for), d))
  const upcoming = posts.filter(p => p.scheduled_for && new Date(p.scheduled_for) >= new Date())
  const ready    = fBody.trim() && fDate

  return (
    <>
      <div dir="rtl" style={{ height: 'calc(100vh - var(--topbar-h))', overflowY: 'auto', background: '#0C0C0C', fontFamily: F }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes schUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
          .sc-in  { animation: schUp 0.35s cubic-bezier(0.22,1,0.36,1) both; }
          .day-cell { transition: all 0.15s; }
          .day-cell:hover { border-color: rgba(255,255,255,0.18) !important; background: rgba(255,255,255,0.04) !important; }
          .queue-row:hover { background: rgba(255,255,255,0.04) !important; border-color: rgba(255,255,255,0.14) !important; }
          .draft-row:hover { background: rgba(255,255,255,0.04) !important; border-color: rgba(255,255,255,0.12) !important; }
          input[type=date]::-webkit-calendar-picker-indicator,
          input[type=time]::-webkit-calendar-picker-indicator { filter: invert(0.4); }
        ` }} />

        {/* ══════════════════ HEADER ══════════════════ */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '28px 36px 0',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.4s ease, transform 0.4s ease',
        }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#FFFFFF', lineHeight: 1, marginBottom: '6px', fontFamily: F }}>
              الجدول
            </h1>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontFamily: F }}>
              {upcoming.length > 0
                ? `${upcoming.length} منشور مجدوَل · ${connPlats.length} منصة متصلة`
                : 'كل ما تصنعه، في كل مكان يحتاجه.'
              }
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* View toggle */}
            <div style={{ display: 'flex', background: '#141414', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px', padding: '3px', gap: '2px' }}>
              {([
                { v: 'calendar'  as View, icon: Ic.cal  },
                { v: 'queue'     as View, icon: Ic.list },
                { v: 'platforms' as View, icon: Ic.link },
              ]).map(({ v, icon }) => (
                <button key={v} onClick={() => setView(v)}
                  style={{ width: 34, height: 30, borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${view === v ? 'rgba(255,255,255,0.14)' : 'transparent'}`, background: view === v ? 'rgba(255,255,255,0.08)' : 'transparent', color: view === v ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.30)', cursor: 'pointer', transition: 'all 0.15s' }}>
                  {icon}
                </button>
              ))}
            </div>

            {/* New post button */}
            <button
              onClick={() => { setModal(true); setFBody(''); setFDate(format(new Date(), 'yyyy-MM-dd')) }}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px', fontSize: '13px', fontWeight: 600, fontFamily: F, background: '#FFFFFF', color: '#0C0C0C', border: 'none', borderRadius: '10px', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.88)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#FFFFFF'}>
              <span style={{ display: 'flex' }}>{Ic.plus}</span>
              منشور جديد
            </button>
          </div>
        </div>

        <div style={{ padding: '24px 36px 48px' }}>

          {/* ══════════════════ CALENDAR VIEW ══════════════════ */}
          {view === 'calendar' && (
            <div className="sc-in">

              {/* Month navigation — RTL: right arrow = previous, left arrow = next */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                {/* Right arrow → goes to PREVIOUS month in RTL */}
                <button
                  onClick={() => setMonth(subMonths(month, 1))}
                  style={{ width: 34, height: 34, borderRadius: '9px', background: '#141414', border: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.40)', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.88)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.40)'}>
                  {Ic.chevR}
                </button>

                <div style={{ fontSize: '17px', fontWeight: 600, color: '#FFFFFF', fontFamily: F }}>
                  {format(month, 'MMMM yyyy', { locale: arSA })}
                </div>

                {/* Left arrow → goes to NEXT month in RTL */}
                <button
                  onClick={() => setMonth(addMonths(month, 1))}
                  style={{ width: 34, height: 34, borderRadius: '9px', background: '#141414', border: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.40)', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.88)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.40)'}>
                  {Ic.chevL}
                </button>
              </div>

              {/* Day-of-week headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px', marginBottom: '6px' }}>
                {DOW_AR.map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 600, color: 'rgba(0,170,255,0.60)', padding: '4px 0', fontFamily: F }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px' }}>
                {/* Leading empty cells */}
                {Array.from({ length: pad }).map((_, i) => (
                  <div key={`pad-${i}`} style={{ minHeight: '96px' }} />
                ))}

                {days.map(day => {
                  const dp    = onDay(day)
                  const today = isToday(day)
                  const inMon = isSameMonth(day, month)
                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => openForDay(day)}
                      className="day-cell"
                      style={{
                        minHeight: '96px',
                        padding: '9px 8px',
                        borderRadius: '10px',
                        background: today ? 'rgba(0,170,255,0.06)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${today ? 'rgba(0,170,255,0.25)' : 'rgba(255,255,255,0.07)'}`,
                        cursor: 'pointer',
                        opacity: inMon ? 1 : 0.30,
                        position: 'relative',
                        overflow: 'hidden',
                      }}>
                      {/* Today top bar */}
                      {today && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: '#00AAFF', borderRadius: '10px 10px 0 0' }} />
                      )}
                      {/* Day number */}
                      <div style={{ width: 24, height: 24, borderRadius: '6px', background: today ? '#00AAFF' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: '12px', fontWeight: 400, color: today ? '#0C0C0C' : 'rgba(255,255,255,0.45)', marginBottom: '6px' }}>
                        {format(day, 'd')}
                      </div>
                      {/* Post dots for this day */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {dp.slice(0, 3).map(p => (
                          <div
                            key={p.id}
                            onClick={e => {
                              e.stopPropagation()
                              setFBody(p.body || '')
                              setFPlat(p.platform || 'instagram')
                              setFDate(format(parseISO(p.scheduled_for), 'yyyy-MM-dd'))
                              setModal(true)
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 5px', borderRadius: '4px', background: PC[p.platform] ? `${PC[p.platform]}18` : 'rgba(255,255,255,0.05)' }}>
                            <Dot platform={p.platform} size={4} />
                            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2, fontFamily: F }}>
                              {p.title || p.body?.slice(0, 18) || 'منشور'}
                            </span>
                          </div>
                        ))}
                        {dp.length > 3 && (
                          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', paddingRight: '4px', fontFamily: F }}>+{dp.length - 3}</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Platform legend */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '20px', flexWrap: 'wrap' }}>
                {Object.entries(PC).filter(([k]) => k !== 'general').map(([plat, color]) => (
                  <div key={plat} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'rgba(255,255,255,0.28)', fontFamily: F }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    {PL[plat]}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════ QUEUE VIEW ══════════════════ */}
          {view === 'queue' && (
            <div className="sc-in">

              {/* Upcoming scheduled posts */}
              <div style={{ marginBottom: '32px' }}>
                <SectionLabel>المجدوَل · {upcoming.length}</SectionLabel>

                {upcoming.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {upcoming.map(post => (
                      <div key={post.id} className="queue-row"
                        style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', background: '#141414', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px', transition: 'all 0.15s' }}>
                        <Dot platform={post.platform} size={8} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: F, marginBottom: '3px' }}>
                            {post.title || post.body?.slice(0, 65) || 'منشور'}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontWeight: 500, fontFamily: F }}>
                              {PL[post.platform] || post.platform}
                            </span>
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontFamily: MONO }}>
                              {post.scheduled_for ? format(parseISO(post.scheduled_for), 'd MMM · h:mm a', { locale: arSA }) : ''}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '5px', flexShrink: 0, alignItems: 'center' }}>
                          {post.platform === 'instagram' && (
                            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', maxWidth: '120px', lineHeight: 1.4, textAlign: 'right', fontFamily: F }}>
                              انشر يدوياً على إنستغرام
                            </span>
                          )}
                          <button
                            onClick={() => publishNow(post.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.20)', color: '#22C55E', cursor: 'pointer', fontFamily: F, transition: 'all 0.15s' }}>
                            <span style={{ display: 'flex' }}>{Ic.check}</span>
                            انشر الحين
                          </button>
                          <button
                            onClick={() => del(post.id)}
                            style={{ width: 32, height: 32, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', transition: 'all 0.15s' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.30)'; (e.currentTarget as HTMLElement).style.color = '#EF4444' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.25)' }}>
                            {Ic.trash}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '36px 24px', background: '#141414', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.30)', lineHeight: 1.7, marginBottom: '20px', fontFamily: F }}>
                      القائمة فاضية لحسابها.<br />
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.20)' }}>
                        اختار يوم من التقويم أو أنشئ شيئاً جديداً.
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => { setModal(true); setFBody(''); setFDate(format(new Date(), 'yyyy-MM-dd')) }}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 600, background: '#FFFFFF', color: '#0C0C0C', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: F, transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.88)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#FFFFFF'}>
                        <span style={{ display: 'flex' }}>{Ic.plus}</span>
                        جدوِل منشور
                      </button>
                      <Link href="/dashboard/studio"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 500, background: 'transparent', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.45)', borderRadius: '8px', textDecoration: 'none', fontFamily: F, transition: 'all 0.15s' }}>
                        <span style={{ display: 'flex' }}>{Ic.bolt}</span>
                        أنشئ في الاستوديو
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Drafts */}
              {drafts.length > 0 && (
                <div>
                  <SectionLabel>المسودات · {drafts.length}</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {drafts.map(draft => (
                      <div key={draft.id} className="draft-row"
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', transition: 'all 0.15s' }}>
                        <Dot platform={draft.platform || 'general'} size={7} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: F, marginBottom: '2px' }}>
                            {draft.title || draft.body?.slice(0, 65) || 'مسودة'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', fontFamily: F }}>
                            {PL[draft.platform] || 'عام'} · مسودة
                          </div>
                        </div>
                        <button
                          onClick={() => openForDraft(draft)}
                          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, background: 'rgba(0,170,255,0.08)', border: '1px solid rgba(0,170,255,0.20)', color: '#00AAFF', cursor: 'pointer', fontFamily: F, transition: 'all 0.15s', flexShrink: 0 }}>
                          <span style={{ display: 'flex' }}>{Ic.cal}</span>
                          جدوِل
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════ PLATFORMS VIEW ══════════════════ */}
          {view === 'platforms' && (
            <div className="sc-in">
              <SectionLabel>المنصات المتصلة</SectionLabel>

              {/* Platform cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '10px', marginBottom: '32px' }}>
                {(['instagram', 'linkedin', 'x', 'tiktok', 'email'] as const).map(plat => {
                  const conn  = connPlats.find(p => p.platform === plat)
                  const color = PC[plat]
                  return (
                    <div key={plat} style={{ padding: '20px', background: '#141414', border: `1px solid ${conn ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '10px', transition: 'all 0.15s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: conn ? color : 'rgba(255,255,255,0.15)' }} />
                          <span style={{ fontSize: '13px', fontWeight: 600, color: conn ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.35)', fontFamily: F }}>
                            {PL[plat]}
                          </span>
                        </div>
                        {conn && (
                          <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '100px', background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.20)', color: '#22C55E', fontFamily: F }}>
                            نشط
                          </span>
                        )}
                      </div>

                      {conn ? (
                        <>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.30)', marginBottom: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: F }}>
                            {conn.platform_username || conn.account_name || 'متصل'}
                          </div>
                          <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '22px', fontWeight: 700, color: '#FFFFFF', lineHeight: 1, fontFamily: MONO, marginBottom: '4px' }}>
                              {posts.filter(p => p.platform === plat).length}
                            </div>
                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.30)', fontFamily: F }}>مجدوَل</div>
                          </div>
                        </>
                      ) : (
                        <a
                          href={`/api/oauth/${plat}?workspace_id=${ws?.id}`}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.45)', textDecoration: 'none', transition: 'all 0.15s', fontFamily: F }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)' }}>
                          <span style={{ display: 'flex' }}>{Ic.plus}</span>
                          وصّل
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Queue breakdown per platform */}
              {connPlats.length > 0 && (
                <>
                  <SectionLabel>القائمة حسب المنصة</SectionLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginTop: '10px' }}>
                    {connPlats.map(cp => {
                      const platPosts = posts.filter(p => p.platform === cp.platform).slice(0, 5)
                      return (
                        <div key={cp.id} style={{ padding: '18px 20px', background: '#141414', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                            <Dot platform={cp.platform} size={7} />
                            <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.75)', fontFamily: F }}>
                              {PL[cp.platform] || cp.platform}
                            </span>
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginRight: 'auto', fontFamily: F }}>
                              {platPosts.length} قادم
                            </span>
                          </div>
                          {platPosts.length > 0 ? platPosts.map(p => (
                            <div key={p.id} style={{ display: 'flex', gap: '10px', padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.50)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: F }}>
                                {p.title || p.body?.slice(0, 38) || 'منشور'}
                              </div>
                              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', flexShrink: 0, fontFamily: MONO }}>
                                {p.scheduled_for ? format(parseISO(p.scheduled_for), 'd MMM') : ''}
                              </div>
                            </div>
                          )) : (
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.22)', padding: '6px 0', fontFamily: F }}>
                              ما في مجدوَل
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════ SCHEDULE MODAL ══════════════════ */}
      {modal && (
        <div
          dir="rtl"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={e => { if (e.target === e.currentTarget) setModal(false) }}>
          <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.12)', borderTop: '2px solid #00AAFF', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '500px', boxShadow: '0 40px 100px rgba(0,0,0,0.90)', animation: 'schUp 0.22s ease both', fontFamily: F }}>

            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#FFFFFF', marginBottom: '4px', fontFamily: F }}>
                  جدوِل منشور
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.30)', fontFamily: F }}>
                  احفظ في تقويمك — انشر يدوياً وقت ما تكون جاهز.
                </div>
              </div>
              <button
                onClick={() => setModal(false)}
                style={{ width: 28, height: 28, borderRadius: '7px', background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {Ic.close}
              </button>
            </div>

            {/* Platform selector */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(0,170,255,0.70)', marginBottom: '10px', fontFamily: F }}>
                المنصة
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '7px' }}>
                {(['instagram', 'linkedin', 'x', 'tiktok', 'email', 'general'] as Platform[]).map(p => (
                  <button key={p} onClick={() => setFPlat(p)}
                    style={{ padding: '8px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, background: fPlat === p ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.03)', border: `1px solid ${fPlat === p ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'}`, color: fPlat === p ? '#FFFFFF' : 'rgba(255,255,255,0.40)', cursor: 'pointer', fontFamily: F, transition: 'all 0.14s', textAlign: 'center' as const }}>
                    {PL[p]}
                  </button>
                ))}
              </div>
            </div>

            {/* Date + Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              {[
                { label: 'التاريخ', type: 'date', value: fDate, set: setFDate },
                { label: 'الوقت',   type: 'time', value: fTime, set: setFTime },
              ].map(field => (
                <div key={field.label}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(0,170,255,0.70)', marginBottom: '10px', fontFamily: F }}>
                    {field.label}
                  </div>
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={e => field.set(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '8px', color: 'rgba(255,255,255,0.80)', fontSize: '13px', fontFamily: F, outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box' as const }}
                    onFocus={e => e.target.style.borderColor = 'rgba(0,170,255,0.35)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.10)'}
                  />
                </div>
              ))}
            </div>

            {/* Caption textarea */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(0,170,255,0.70)', fontFamily: F }}>
                  الكابشن
                </div>
                {fDate && (
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', fontFamily: F }}>
                    {format(new Date(fDate + 'T12:00:00'), 'd MMM', { locale: arSA })} الساعة {fTime}
                  </span>
                )}
              </div>
              <div style={{ borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${fBody ? 'rgba(0,170,255,0.20)' : 'rgba(255,255,255,0.08)'}`, transition: 'all 0.15s' }}>
                <textarea
                  value={fBody}
                  onChange={e => setFBody(e.target.value)}
                  dir="rtl"
                  rows={6}
                  placeholder={'اكتب أو الصق الكابشن هنا.\n\nنصيحة: ولّده في الاستوديو — سيكون بصوت براندك مباشرة.'}
                  style={{ width: '100%', padding: '13px 14px', fontSize: '13px', fontFamily: F, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.85)', outline: 'none', resize: 'vertical', lineHeight: 1.7, boxSizing: 'border-box' as const, direction: 'rtl' }}
                />
              </div>
            </div>

            {/* Schedule CTA */}
            <button
              onClick={schedule}
              disabled={!ready || saving}
              style={{ width: '100%', padding: '13px', fontSize: '13px', fontWeight: 600, fontFamily: F, background: ready ? '#FFFFFF' : 'rgba(255,255,255,0.06)', color: ready ? '#0C0C0C' : 'rgba(255,255,255,0.20)', border: 'none', borderRadius: '10px', cursor: ready ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.15s' }}
              onMouseEnter={e => { if (ready) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.88)' }}
              onMouseLeave={e => { if (ready) (e.currentTarget as HTMLElement).style.background = '#FFFFFF' }}>
              {saving ? (
                <><div className="nexa-spinner" style={{ width: 13, height: 13 }} />جارٍ الجدولة...</>
              ) : saved ? (
                <><span style={{ display: 'flex' }}>{Ic.check}</span>تم الجدولة!</>
              ) : (
                <>
                  <span style={{ display: 'flex' }}>{Ic.cal}</span>
                  {fDate
                    ? `جدوِل في ${format(new Date(fDate + 'T12:00:00'), 'd MMM', { locale: arSA })} الساعة ${fTime}`
                    : 'أضف للقائمة'
                  }
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════ TOAST ══════════════════ */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', left: '24px', zIndex: 9999, padding: '12px 20px', borderRadius: '10px', background: toast.ok ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)', border: `1px solid ${toast.ok ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`, color: toast.ok ? '#22C55E' : '#EF4444', fontSize: '13px', fontWeight: 600, fontFamily: F, boxShadow: '0 8px 32px rgba(0,0,0,0.45)', animation: 'schUp 0.2s ease both' }}>
          {toast.msg}
        </div>
      )}
    </>
  )
}

export default function SchedulePageAr() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.25)', fontSize: '13px', fontFamily: "'Tajawal', system-ui, sans-serif" }}>
        يحمّل...
      </div>
    }>
      <ScheduleArInner />
    </Suspense>
  )
}
