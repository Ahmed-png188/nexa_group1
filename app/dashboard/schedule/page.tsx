'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, addMonths, subMonths, parseISO } from 'date-fns'

type Platform = 'instagram' | 'linkedin' | 'x' | 'tiktok' | 'email' | 'general'
type ViewMode = 'calendar' | 'queue' | 'platforms'

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C', linkedin: '#0A66C2', x: '#1DA1F2',
  tiktok: '#FF0050', email: '#00AAFF', general: '#888',
}
const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram', linkedin: 'LinkedIn', x: 'X',
  tiktok: 'TikTok', email: 'Email', general: 'General',
}

const IconCal  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const IconList = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
const IconLink = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
const IconPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IconTrash = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
const IconCheck = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
const IconEdit  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>

function SchedulePageInner() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const [workspace, setWorkspace] = useState<any>(null)
  const [credits, setCredits] = useState(0)
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([])
  const [draftPosts, setDraftPosts] = useState<any[]>([])
  const [platforms, setPlatforms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [modalPost, setModalPost] = useState<any>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  // Schedule form state
  const [schedPlatform, setSchedPlatform] = useState<Platform>('instagram')
  const [schedDate, setSchedDate] = useState('')
  const [schedTime, setSchedTime] = useState('09:00')
  const [schedBody, setSchedBody] = useState('')
  const [schedTitle, setSchedTitle] = useState('')
  const [scheduling, setScheduling] = useState(false)
  const [scheduleSuccess, setScheduleSuccess] = useState(false)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')
    if (connected) {
      showToast(`${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully!`, 'success')
      setViewMode('platforms')
      window.history.replaceState({}, '', '/dashboard/schedule')
    }
    if (error) {
      const msgs: Record<string, string> = {
        instagram_denied: 'Instagram connection cancelled.',
        instagram_failed: 'Instagram connection failed — check your app credentials.',
        linkedin_denied: 'LinkedIn connection cancelled.',
        linkedin_failed: 'LinkedIn connection failed — check your app credentials.',
        x_denied: 'X connection cancelled.',
        x_failed: 'X connection failed — check your app credentials.',
        tiktok_denied: 'TikTok connection cancelled.',
        tiktok_failed: 'TikTok connection failed — check your app credentials.',
      }
      showToast(msgs[error] ?? 'Connection failed. Please try again.', 'error')
      window.history.replaceState({}, '', '/dashboard/schedule')
    }
    loadData()
  }, [currentMonth])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: membership } = await supabase
      .from('workspace_members').select('workspace_id, workspaces(*)')
      .eq('user_id', user.id).limit(1).single()
    const ws = (membership as any)?.workspaces
    setWorkspace(ws)
    const { data: cr } = await supabase.from('credits').select('balance').eq('workspace_id', ws?.id).single()
    setCredits(cr?.balance ?? 0)
    const res = await fetch(`/api/get-schedule?workspace_id=${ws?.id}&year=${currentMonth.getFullYear()}&month=${currentMonth.getMonth() + 1}`)
    if (res.ok) {
      const data = await res.json()
      setScheduledPosts(data.scheduled ?? [])
      setDraftPosts(data.drafts ?? [])
      setPlatforms(data.platforms ?? [])
    }
    setLoading(false)
  }

  async function schedulePost() {
    if (!schedBody.trim() || !schedDate) return
    setScheduling(true)
    const scheduledFor = new Date(`${schedDate}T${schedTime}`).toISOString()
    const res = await fetch('/api/schedule-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspace_id: workspace.id,
        content_id: modalPost?.id ?? null,
        platform: schedPlatform,
        scheduled_for: scheduledFor,
        title: schedTitle,
        body: schedBody,
        type: 'post',
      }),
    })
    if (res.ok) {
      setScheduleSuccess(true)
      setCredits(prev => prev - 1)
      await loadData()
      setTimeout(() => {
        setScheduleSuccess(false)
        setShowScheduleModal(false)
        setSchedBody(''); setSchedTitle(''); setModalPost(null)
      }, 1500)
    }
    setScheduling(false)
  }

  async function unschedulePost(contentId: string) {
    await fetch('/api/schedule-post', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_id: contentId }),
    })
    await loadData()
  }

  async function disconnectPlatform(platformId: string) {
    setDisconnecting(platformId)
    await fetch('/api/connect-platform', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace_id: workspace.id, platform: platformId }),
    })
    await loadData()
    setDisconnecting(null)
    showToast(`${PLATFORM_LABELS[platformId]} disconnected.`, 'success')
  }

  const monthDays = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const getPostsForDay = (day: Date) => scheduledPosts.filter(p => p.scheduled_for && isSameDay(parseISO(p.scheduled_for), day))
  const startDayOfWeek = startOfMonth(currentMonth).getDay()

  const PLATFORM_LIST = [
    { id: 'instagram', name: 'Instagram', desc: 'Posts, Reels, Stories', color: '#E1306C', envKey: 'INSTAGRAM_APP_ID' },
    { id: 'linkedin',  name: 'LinkedIn',  desc: 'Posts, Articles',       color: '#0A66C2', envKey: 'LINKEDIN_CLIENT_ID' },
    { id: 'x',         name: 'X / Twitter', desc: 'Tweets, Threads',     color: '#1DA1F2', envKey: 'X_CLIENT_ID' },
    { id: 'tiktok',    name: 'TikTok',    desc: 'Videos',                color: '#FF0050', envKey: 'TIKTOK_CLIENT_KEY' },
  ]

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div style={{ fontSize: 13, color: 'var(--t4)' }}>Loading schedule...</div>
    </div>
  )

  return (
    <div style={{ height: 'calc(100vh - var(--topbar-h))', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 500,
          padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          background: toast.type === 'success' ? 'rgba(0,214,143,0.12)' : 'rgba(255,107,107,0.12)',
          border: `1px solid ${toast.type === 'success' ? 'rgba(0,214,143,0.3)' : 'rgba(255,107,107,0.3)'}`,
          color: toast.type === 'success' ? '#00d68f' : '#ff6b6b',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(12px)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ padding: '20px 28px 0', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 3 }}>Schedule</h1>
            <div style={{ fontSize: 12, color: 'var(--t4)', display: 'flex', gap: 12 }}>
              <span>{scheduledPosts.length} posts scheduled</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--cyan)', fontWeight: 600 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--cyan)', animation: 'pulse-dot 2s ease-in-out infinite' }} />
                {credits} credits
              </span>
              <span style={{ color: platforms.filter(p => p.is_active).length > 0 ? '#00d68f' : 'var(--t5)' }}>
                {platforms.filter(p => p.is_active).length} platform{platforms.filter(p => p.is_active).length !== 1 ? 's' : ''} connected
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ display: 'flex', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 9, padding: 3, gap: 2 }}>
              {([
                { id: 'calendar', icon: <IconCal /> },
                { id: 'queue',    icon: <IconList /> },
                { id: 'platforms', icon: <IconLink /> },
              ] as { id: ViewMode; icon: React.ReactNode }[]).map(v => (
                <button key={v.id} onClick={() => setViewMode(v.id)} style={{ padding: '5px 10px', borderRadius: 7, border: 'none', background: viewMode === v.id ? 'var(--glass2)' : 'transparent', color: viewMode === v.id ? 'var(--t1)' : 'var(--t4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontFamily: 'var(--sans)', fontWeight: 600 }}>
                  {v.icon} {v.id.charAt(0).toUpperCase() + v.id.slice(1)}
                </button>
              ))}
            </div>
            <button onClick={() => { setShowScheduleModal(true); setSchedDate(format(selectedDay ?? new Date(), 'yyyy-MM-dd')) }} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', fontSize: 13, fontWeight: 700, background: 'var(--cyan)', color: '#000', border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
              <IconPlus /> Schedule post
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>

        {/* ── CALENDAR VIEW ── */}
        {viewMode === 'calendar' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--t1)' }}>
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--glass)', border: '1px solid var(--line2)', color: 'var(--t3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button onClick={() => setCurrentMonth(new Date())} style={{ padding: '5px 12px', borderRadius: 8, background: 'var(--glass)', border: '1px solid var(--line2)', color: 'var(--t3)', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--sans)' }}>Today</button>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--glass)', border: '1px solid var(--line2)', color: 'var(--t3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--t5)', padding: '4px 0', letterSpacing: '.04em', textTransform: 'uppercase' }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} style={{ minHeight: 90, borderRadius: 8, background: 'rgba(255,255,255,0.015)' }} />
              ))}
              {monthDays.map(day => {
                const posts = getPostsForDay(day)
                const isSelected = selectedDay && isSameDay(day, selectedDay)
                const today = isToday(day)
                return (
                  <div key={day.toISOString()}
                    onClick={() => { setSelectedDay(day); if (posts.length === 0) { setShowScheduleModal(true); setSchedDate(format(day, 'yyyy-MM-dd')) } }}
                    style={{ minHeight: 90, padding: '8px 6px', borderRadius: 8, background: isSelected ? 'rgba(0,170,255,0.06)' : 'var(--glass)', border: `1px solid ${isSelected ? 'var(--cline2)' : today ? 'rgba(0,170,255,0.2)' : 'var(--line)'}`, cursor: 'pointer', transition: 'all .15s', position: 'relative' }}
                  >
                    <div style={{ fontSize: 12, fontWeight: today ? 700 : 500, color: today ? 'var(--cyan)' : isSameMonth(day, currentMonth) ? 'var(--t2)' : 'var(--t5)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {today && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--cyan)' }} />}
                      {format(day, 'd')}
                    </div>
                    {posts.slice(0, 3).map(post => (
                      <div key={post.id}
                        onClick={e => { e.stopPropagation(); setModalPost(post); setSchedBody(post.body ?? ''); setSchedPlatform(post.platform); setSchedDate(format(parseISO(post.scheduled_for), 'yyyy-MM-dd')); setSchedTime(format(parseISO(post.scheduled_for), 'HH:mm')); setShowScheduleModal(true) }}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 5px', borderRadius: 4, marginBottom: 2, background: `${PLATFORM_COLORS[post.platform] ?? '#666'}18`, border: `1px solid ${PLATFORM_COLORS[post.platform] ?? '#666'}33`, cursor: 'pointer' }}
                      >
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: PLATFORM_COLORS[post.platform] ?? '#666', flexShrink: 0 }} />
                        <span style={{ fontSize: 10, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {format(parseISO(post.scheduled_for), 'h:mm a')} · {post.body?.slice(0, 20) ?? 'Post'}
                        </span>
                      </div>
                    ))}
                    {posts.length > 3 && <div style={{ fontSize: 9, color: 'var(--t5)', textAlign: 'center', marginTop: 2 }}>+{posts.length - 3} more</div>}
                  </div>
                )
              })}
            </div>
            {selectedDay && getPostsForDay(selectedDay).length > 0 && (
              <div style={{ marginTop: 20, padding: 16, background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t2)', marginBottom: 12 }}>{format(selectedDay, 'EEEE, MMMM d')}</div>
                {getPostsForDay(selectedDay).map(post => (
                  <div key={post.id} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--line)', borderRadius: 9, marginBottom: 7 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: PLATFORM_COLORS[post.platform] ?? '#888', flexShrink: 0, marginTop: 3 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: PLATFORM_COLORS[post.platform], background: `${PLATFORM_COLORS[post.platform]}18`, padding: '1px 7px', borderRadius: 3 }}>{PLATFORM_LABELS[post.platform]}</span>
                        <span style={{ fontSize: 10, color: 'var(--t4)' }}>{format(parseISO(post.scheduled_for), 'h:mm a')}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: post.status === 'published' ? '#00d68f' : 'var(--amber)', marginLeft: 'auto' }}>{post.status}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.5 }}>{post.body}</div>
                    </div>
                    {post.status === 'scheduled' && (
                      <button onClick={() => unschedulePost(post.id)} style={{ padding: '4px', background: 'transparent', border: 'none', color: 'var(--t5)', cursor: 'pointer', flexShrink: 0 }}>
                        <IconTrash />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── QUEUE VIEW ── */}
        {viewMode === 'queue' && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t4)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                Scheduled · {scheduledPosts.length} posts
              </div>
              {scheduledPosts.length > 0 ? scheduledPosts.map(post => (
                <div key={post.id} style={{ display: 'flex', gap: 12, padding: '14px 16px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 11, marginBottom: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: PLATFORM_COLORS[post.platform] ?? '#888', flexShrink: 0, marginTop: 4 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: PLATFORM_COLORS[post.platform], background: `${PLATFORM_COLORS[post.platform]}15`, padding: '2px 8px', borderRadius: 4 }}>{PLATFORM_LABELS[post.platform]}</span>
                      <span style={{ fontSize: 11, color: 'var(--t4)' }}>{post.scheduled_for ? format(parseISO(post.scheduled_for), 'MMM d · h:mm a') : 'No date'}</span>
                      {post.status === 'published' && <span style={{ fontSize: 10, fontWeight: 700, color: '#00d68f', background: 'rgba(0,214,143,0.08)', padding: '1px 7px', borderRadius: 3, marginLeft: 'auto' }}>Published</span>}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                      {post.body ?? post.title ?? 'No content'}
                    </div>
                  </div>
                  {post.status === 'scheduled' && (
                    <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                      <button onClick={() => { setModalPost(post); setSchedBody(post.body ?? ''); setSchedPlatform(post.platform); setSchedDate(format(parseISO(post.scheduled_for), 'yyyy-MM-dd')); setSchedTime(format(parseISO(post.scheduled_for), 'HH:mm')); setShowScheduleModal(true) }} style={{ padding: '6px 7px', background: 'var(--glass)', border: '1px solid var(--line)', borderRadius: 7, color: 'var(--t4)', cursor: 'pointer' }}>
                        <IconEdit />
                      </button>
                      <button onClick={() => unschedulePost(post.id)} style={{ padding: '6px 7px', background: 'var(--glass)', border: '1px solid var(--line)', borderRadius: 7, color: 'var(--t5)', cursor: 'pointer' }}>
                        <IconTrash />
                      </button>
                    </div>
                  )}
                </div>
              )) : (
                <div style={{ padding: '32px', textAlign: 'center', background: 'var(--glass)', border: '1px solid var(--line)', borderRadius: 12 }}>
                  <div style={{ fontSize: 13, color: 'var(--t5)', marginBottom: 10 }}>No posts scheduled yet</div>
                  <button onClick={() => setShowScheduleModal(true)} style={{ fontSize: 12, fontWeight: 600, color: 'var(--cyan)', background: 'var(--cglow2)', border: '1px solid var(--cline2)', padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                    Schedule your first post →
                  </button>
                </div>
              )}
            </div>
            {draftPosts.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t4)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Drafts · {draftPosts.length} ready to schedule
                </div>
                {draftPosts.map(post => (
                  <div key={post.id} style={{ display: 'flex', gap: 12, padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: 11, marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 7, marginBottom: 5 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t4)', background: 'var(--glass)', padding: '1px 7px', borderRadius: 3, textTransform: 'uppercase' }}>{post.type}</span>
                        <span style={{ fontSize: 10, color: 'var(--t5)' }}>{post.created_at ? format(parseISO(post.created_at), 'MMM d') : ''}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--t3)', lineHeight: 1.55 }}>{post.body ?? 'No content'}</div>
                    </div>
                    <button onClick={() => { setModalPost(post); setSchedBody(post.body ?? ''); setSchedDate(format(new Date(), 'yyyy-MM-dd')); setShowScheduleModal(true) }} style={{ padding: '7px 12px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 8, color: 'var(--t3)', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'var(--sans)', flexShrink: 0 }}>
                      Schedule →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PLATFORMS VIEW ── */}
        {viewMode === 'platforms' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, color: 'var(--t3)', lineHeight: 1.7, maxWidth: 560, marginBottom: 16 }}>
                Connect your platforms to enable auto-publishing. Nexa checks for due posts every 15 minutes and publishes automatically.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {PLATFORM_LIST.map(platform => {
                const connected = platforms.find(p => p.platform === platform.id && p.is_active)
                return (
                  <div key={platform.id} style={{ padding: '20px', background: 'var(--glass)', border: `1px solid ${connected ? platform.color + '44' : 'var(--line2)'}`, borderRadius: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: connected ? 12 : 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: platform.color }} />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>{platform.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--t4)' }}>{platform.desc}</div>
                        </div>
                      </div>
                      {connected ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#00d68f', background: 'rgba(0,214,143,0.07)', padding: '4px 10px', borderRadius: 100, border: '1px solid rgba(0,214,143,0.2)' }}>
                          <IconCheck /> Connected
                        </div>
                      ) : (
                        <a
                          href={workspace?.id ? `/api/oauth/${platform.id}?workspace_id=${workspace.id}` : '#'}
                          onClick={e => { if (!workspace?.id) e.preventDefault() }}
                          style={{ fontSize: 11, fontWeight: 700, color: workspace?.id ? 'var(--t2)' : 'var(--t5)', background: 'var(--glass2)', border: '1px solid var(--line2)', padding: '6px 14px', borderRadius: 8, cursor: workspace?.id ? 'pointer' : 'not-allowed', fontFamily: 'var(--sans)', textDecoration: 'none', display: 'inline-block', opacity: workspace?.id ? 1 : 0.5 }}>
                          Connect →
                        </a>
                      )}
                    </div>

                    {connected && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>@{connected.platform_username}</div>
                          {connected.token_expires_at && (
                            <div style={{ fontSize: 10, color: 'var(--t5)', marginTop: 2 }}>
                              Token expires {format(parseISO(connected.token_expires_at), 'MMM d, yyyy')}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => disconnectPlatform(platform.id)}
                          disabled={disconnecting === platform.id}
                          style={{ fontSize: 10, fontWeight: 600, color: 'var(--red)', background: 'transparent', border: '1px solid rgba(255,107,107,0.2)', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--sans)' }}
                        >
                          {disconnecting === platform.id ? 'Disconnecting...' : 'Disconnect'}
                        </button>
                      </div>
                    )}

                    {!connected && (
                      <div style={{ fontSize: 11, color: 'var(--t5)', marginTop: 10, lineHeight: 1.5 }}>
                        Requires <code style={{ fontSize: 10, background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: 3 }}>{platform.envKey}</code> in Vercel env vars
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div style={{ padding: '16px 18px', background: 'rgba(0,170,255,0.04)', border: '1px solid var(--cline2)', borderRadius: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cyan)', marginBottom: 8 }}>How auto-publish works</div>
              <div style={{ fontSize: 12, color: 'var(--t4)', lineHeight: 1.7 }}>
                Once connected, Nexa runs a cron job every 15 minutes. Any post with a <code style={{ fontSize: 11, background: 'rgba(255,255,255,0.05)', padding: '1px 4px', borderRadius: 3 }}>scheduled</code> status whose time has passed gets published automatically via the platform API. No manual action needed.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Schedule Modal ── */}
      {showScheduleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) { setShowScheduleModal(false); setModalPost(null); setSchedBody('') } }}
        >
          <div style={{ width: '100%', maxWidth: 520, background: '#0D0D14', border: '1px solid var(--line2)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.7)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700 }}>
                {modalPost ? 'Edit scheduled post' : 'Schedule a post'}
              </div>
              <button onClick={() => { setShowScheduleModal(false); setModalPost(null); setSchedBody('') }} style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--glass)', border: '1px solid var(--line)', color: 'var(--t4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Platform</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(['instagram','linkedin','x','tiktok','general'] as Platform[]).map(p => (
                    <button key={p} onClick={() => setSchedPlatform(p)} style={{ padding: '5px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, background: schedPlatform === p ? `${PLATFORM_COLORS[p]}18` : 'var(--glass)', border: `1px solid ${schedPlatform === p ? PLATFORM_COLORS[p] + '44' : 'var(--line2)'}`, color: schedPlatform === p ? PLATFORM_COLORS[p] : 'var(--t4)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                      {PLATFORM_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div>
                  <label style={lbl}>Date</label>
                  <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} style={inp} onFocus={e => (e.target.style.borderColor = 'var(--cline2)')} onBlur={e => (e.target.style.borderColor = 'var(--line2)')}/>
                </div>
                <div>
                  <label style={lbl}>Time</label>
                  <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)} style={inp} onFocus={e => (e.target.style.borderColor = 'var(--cline2)')} onBlur={e => (e.target.style.borderColor = 'var(--line2)')}/>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={lbl}>Content</label>
                <textarea value={schedBody} onChange={e => setSchedBody(e.target.value)} placeholder="What do you want to post? You can generate content in Studio first and schedule from there." rows={5} style={{ ...inp, resize: 'vertical' as const, lineHeight: 1.6 }} onFocus={e => (e.target.style.borderColor = 'var(--cline2)')} onBlur={e => (e.target.style.borderColor = 'var(--line2)')}/>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setShowScheduleModal(false); setModalPost(null); setSchedBody('') }} style={{ flex: 1, padding: '11px', fontSize: 13, fontWeight: 600, fontFamily: 'var(--sans)', background: 'var(--glass)', color: 'var(--t3)', border: '1px solid var(--line2)', borderRadius: 9, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={schedulePost} disabled={!schedBody.trim() || !schedDate || scheduling}
                  style={{ flex: 2, padding: '11px', fontSize: 13, fontWeight: 700, fontFamily: 'var(--sans)', background: schedBody.trim() && schedDate ? 'var(--cyan)' : 'var(--glass)', color: schedBody.trim() && schedDate ? '#000' : 'var(--t5)', border: 'none', borderRadius: 9, cursor: schedBody.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {scheduleSuccess ? <><IconCheck /> Scheduled!</> : scheduling ? 'Scheduling...' : 'Schedule · 1 credit'}
                </button>
              </div>
              <div style={{ fontSize: 11, color: 'var(--t5)', textAlign: 'center', marginTop: 10 }}>
                Posts publish automatically when the platform is connected
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}><div style={{ fontSize: 13, color: 'var(--t4)' }}>Loading...</div></div>}>
      <SchedulePageInner />
    </Suspense>
  )
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--t4)', marginBottom: 7 }
const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', fontSize: 13, fontFamily: 'var(--sans)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line2)', borderRadius: 9, color: 'var(--t1)', outline: 'none', transition: 'border-color 0.18s' }
