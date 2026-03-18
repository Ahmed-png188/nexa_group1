'use client'
import NexaTour, { useTourState } from './NexaTour'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { marked } from 'marked'

/* ─────────────────────────────────────────────────
   NEXA LOGO — clean, no glow
───────────────────────────────────────────────── */
function NexaLogo({ size = 30 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: Math.round(size * 0.26),
      overflow: 'hidden',
      flexShrink: 0,
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      <img
        src="/favicon.png"
        alt="Nexa"
        width={size}
        height={size}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  )
}

/* ─────────────────────────────────────────────────
   ICONS
───────────────────────────────────────────────── */
const Ic = {
  // Nav icons — clean minimal Feather-style
  home:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  studio:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  brand:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  strategy: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  schedule: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  automate: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  amplify:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>,
  insights: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  agency:        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  integrations:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="9" height="9" rx="2"/><rect x="13" y="2" width="9" height="9" rx="2"/><rect x="2" y="13" width="9" height="9" rx="2"/><rect x="13" y="13" width="9" height="9" rx="2"/></svg>,
  // UI icons
  settings: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  bell:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 6 3 8 3 8H3s3-2 3-8"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  chat:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/><path d="M8 10h8M8 14h5" opacity=".5"/></svg>,
  send:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>,
  close:    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  chevron:  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>,
  user:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"/></svg>,
  billing:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="2" y="5" width="20" height="15" rx="2"/><path d="M2 10h20"/><path d="M6 15h4" opacity=".5"/></svg>,
  signout:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" opacity=".5"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>,
  clip:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
  search:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>,
  bolt:     <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
}

/* ─────────────────────────────────────────────────
   NAV CONFIG
───────────────────────────────────────────────── */
const NAV = [
  { id:'home',     href:'/dashboard',          icon:'home',     label:'Home',        color:'#4D9FFF' },
  { id:'studio',   href:'/dashboard/studio',   icon:'studio',   label:'Studio',      color:'#A78BFA' },
  { id:'brand',    href:'/dashboard/brand',    icon:'brand',    label:'Brand Brain', color:'#34D399' },
  { id:'strategy', href:'/dashboard/strategy', icon:'strategy', label:'Strategy',    color:'#FFB547' },
  { id:'schedule', href:'/dashboard/schedule', icon:'schedule', label:'Schedule',    color:'#4D9FFF' },
  { id:'automate',     href:'/dashboard/automate',     icon:'automate',     label:'Automate',      color:'#FF5757' },
  { id:'amplify',      href:'/dashboard/amplify',      icon:'amplify',      label:'Amplify',       color:'#F97316' },
  { id:'integrations', href:'/dashboard/integrations', icon:'integrations', label:'Integrations',  color:'#A855F7' },
  { id:'insights',     href:'/dashboard/insights',     icon:'insights',     label:'Insights',      color:'#38BFFF' },
  { id:'agency',   href:'/dashboard/agency',   icon:'agency',   label:'Agency',      color:'#FF7A40' },
]

const QUICK = ['Write a post', 'Build strategy', 'Analyze brand', 'Content ideas']

interface Props { user: any; workspace: any; credits: number; children: React.ReactNode }

export default function DashboardShell({ user, workspace, credits: init, children }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const endRef   = useRef<HTMLDivElement>(null)
  const fileRef  = useRef<HTMLInputElement>(null)

  const { show: showTour, dismiss: dismissTour } = useTourState()
  const [credits,     setCredits]     = useState(init)
  const [chatOpen,    setChatOpen]    = useState(true)
  const [isNarrow,    setIsNarrow]    = useState(false)
  const [input,       setInput]       = useState('')
  const [msgs,        setMsgs]        = useState([{ role:'assistant', content:'Your brand intelligence is online. What are we creating today?' }])
  const [chatLoading, setChatLoading] = useState(false)
  const [files,       setFiles]       = useState<any[]>([])
  const [uploading,   setUploading]   = useState(false)
  const [pillOpen,    setPillOpen]    = useState(false)
  const [notifOpen,   setNotifOpen]   = useState(false)
  const [notifs,      setNotifs]      = useState<any[]>([])
  const [unread,      setUnread]      = useState(0)
  const [hoverId,     setHoverId]     = useState<string|null>(null)
  const [searchQ,     setSearchQ]     = useState('')
  const [searchOpen,  setSearchOpen]  = useState(false)

  const activeId   = NAV.find(n => n.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(n.href))?.id ?? 'home'
  const activeItem = NAV.find(n => n.id === activeId)
  const initial    = (user?.full_name?.[0] ?? user?.email?.[0] ?? 'N').toUpperCase()
  const firstName  = user?.full_name?.split(' ')[0] ?? 'there'

  // Trial countdown
  const trialDaysLeft: number | null = (() => {
    if (workspace?.plan_status !== 'trialing') return null
    const created  = new Date(workspace.created_at)
    const trialEnd = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000)
    const diff     = trialEnd.getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)))
  })()

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-dd]')) { setPillOpen(false); setNotifOpen(false) }
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  // Hide chat panel on narrow screens (<1200px)
  useEffect(() => {
    function handleResize() {
      const narrow = window.innerWidth < 1200
      setIsNarrow(narrow)
      if (narrow) setChatOpen(false)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }) }, [msgs])

  useEffect(() => {
    if (!workspace?.id) return
    loadNotifs()
    const ch = supabase.channel(`shell-${workspace.id}`)
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'credits', filter:`workspace_id=eq.${workspace.id}` }, (p:any) => {
        if (p.new?.balance !== undefined) setCredits(p.new.balance)
      })
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'activity', filter:`workspace_id=eq.${workspace.id}` }, () => loadNotifs())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [workspace?.id])

  async function loadNotifs() {
    try {
      const r = await fetch(`/api/notifications?workspace_id=${workspace.id}`, { credentials: 'include' })
      if (r.ok) { const d = await r.json(); setNotifs(d.notifications??[]); setUnread(d.unread??0) }
    } catch {}
  }

  async function signOut() { await supabase.auth.signOut(); router.push('/') }

  async function send() {
    if ((!input.trim() && files.length === 0) || chatLoading) return
    const msg = input.trim() || 'Analyze this file.'
    const fs  = [...files]
    setInput(''); setFiles([])
    setMsgs(p => [...p, { role:'user', content:msg }])
    setChatLoading(true)
    try {
      const r = await fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body:JSON.stringify({ message:msg, workspace_id:workspace.id, history:msgs, files:fs }) })
      const d = await r.json()
      setMsgs(p => [...p, { role:'assistant', content:d.reply }])
    } catch {
      setMsgs(p => [...p, { role:'assistant', content:'Something went wrong. Try again.' }])
    }
    setChatLoading(false)
  }

  async function uploadFile(file: File) {
    setUploading(true)
    const reader = new FileReader()
    reader.onload = e => {
      const b64 = (e.target?.result as string)?.split(',')[1]
      const ft  = file.type || 'application/octet-stream'
      setFiles(p => [...p, { name:file.name, type:ft.includes('pdf')?'pdf':ft, data:b64, size:file.size }])
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  /* ─── Shared topbar + rail background color ─── */
  const SURFACE = 'rgba(8,8,14,0.95)'
  const BORDER  = 'rgba(255,255,255,0.07)'

  return (
    <div style={{ display:'grid', gridTemplateColumns:`var(--rail-w, 52px) 1fr ${chatOpen && !isNarrow?'var(--chat-w, 360px)':'0px'}`, height:'100vh', overflow:'hidden', background:'var(--bg)', transition:'grid-template-columns 0.22s cubic-bezier(0.4,0,0.2,1)', fontFamily:'var(--sans)' }}>

      {/* ═══════════════════════════════════════════════════
          LEFT RAIL
      ═══════════════════════════════════════════════════ */}
      <div style={{ background:SURFACE, borderRight:`1px solid rgba(255,255,255,0.055)`, display:'flex', flexDirection:'column', alignItems:'center', padding:'16px 0 16px', overflow:'hidden', zIndex:20, backdropFilter:'blur(20px)' }}>

        {/* Logo — clean, no glow */}
        <div style={{ marginBottom:20, flexShrink:0 }}>
          <NexaLogo size={30}/>
        </div>

        {/* Nav items */}
        <div style={{ display:'flex', flexDirection:'column', gap:3, flex:1, width:'100%', padding:'0 8px', overflowY:'auto', scrollbarWidth:'none' }}>
          {NAV.map(item => {
            const active = activeId === item.id
            return (
              <Link key={item.id} href={item.href} data-tour={item.id}
                style={{ textDecoration:'none', display:'block', position:'relative' }}
                onMouseEnter={() => setHoverId(item.id)}
                onMouseLeave={() => setHoverId(null)}>
                <div
                  style={{
                    width:38, height:38, borderRadius:11,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    background: active ? `${item.color}16` : 'transparent',
                    color: active ? item.color : 'rgba(255,255,255,0.28)',
                    transition:'all 0.18s cubic-bezier(0.22,1,0.36,1)',
                    cursor:'pointer', position:'relative', margin:'0 auto',
                    boxShadow: active ? `0 0 20px ${item.color}20, inset 0 1px 0 ${item.color}20` : 'none',
                  }}
                  onMouseEnter={e => { if(!active){ (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.7)' }}}
                  onMouseLeave={e => { if(!active){ (e.currentTarget as HTMLElement).style.background='transparent'; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.28)' }}}>
                  {/* Active indicator — left accent bar */}
                  {active && (
                    <div style={{ position:'absolute', left:-16, top:'50%', transform:'translateY(-50%)', width:3, height:18, borderRadius:'0 4px 4px 0', background:item.color, boxShadow:`0 0 8px ${item.color}80` }}/>
                  )}
                  {(Ic as any)[item.icon]}
                </div>

                {/* Tooltip */}
                {hoverId === item.id && (
                  <div style={{ position:'absolute', left:'calc(100% + 12px)', top:'50%', transform:'translateY(-50%)', background:'rgba(10,10,18,0.98)', border:`1px solid rgba(255,255,255,0.1)`, borderRadius:12, whiteSpace:'nowrap', zIndex:9999, pointerEvents:'none', backdropFilter:'blur(24px)', boxShadow:'0 16px 48px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.06) inset', overflow:'hidden', minWidth:140 }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg, transparent, ${item.color}50, transparent)` }}/>
                    <div style={{ padding:'10px 14px' }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.9)', letterSpacing:'-0.02em', marginBottom:2, fontFamily:'var(--sans)' }}>{item.label}</div>
                      <div style={{ fontSize:10.5, color:'rgba(255,255,255,0.35)', lineHeight:1.4, fontFamily:'var(--sans)' }}>{item.id === 'home' ? 'Morning brief + agents' : item.id === 'studio' ? 'Create in your voice' : item.id === 'brand' ? 'Your brand DNA' : item.id === 'strategy' ? '30-day content plan' : item.id === 'schedule' ? 'Publish everywhere' : item.id === 'automate' ? 'Sequences & flows' : item.id === 'amplify' ? 'Run Meta Ads' : item.id === 'insights' ? "What's working" : 'Client workspaces'}</div>
                    </div>
                  </div>
                )}
              </Link>
            )
          })}
        </div>

        {/* Bottom — settings + avatar */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, padding:'0 8px', width:'100%', flexShrink:0 }}>
          <div style={{ height:1, background:BORDER, width:'100%', margin:'4px 0' }}/>

          <Link href="/dashboard/settings" style={{ textDecoration:'none' }}>
            <div
              style={{ width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.28)', margin:'0 auto', transition:'all 0.15s', cursor:'pointer' }}
              onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.65)'; (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.06)' }}
              onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.28)'; (e.currentTarget as HTMLElement).style.background='transparent' }}>
              {Ic.settings}
            </div>
          </Link>

          {/* Avatar — links to settings profile */}
          <Link href="/dashboard/settings?tab=profile" style={{ textDecoration:'none' }}>
            <div
              style={{ width:32, height:32, borderRadius:10, background:'linear-gradient(135deg,#4D9FFF,#A78BFA)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', cursor:'pointer', fontFamily:'var(--display)', transition:'opacity 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity='0.8'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity='1'}>
              {initial}
            </div>
          </Link>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          MAIN COLUMN — topbar + content
      ═══════════════════════════════════════════════════ */}
      <div style={{ display:'flex', flexDirection:'column', overflow:'hidden', background:'var(--bg)' }}>

        {/* ── TOPBAR ── matching rail: same surface, same border language */}
        <div style={{
          height:'var(--topbar-h)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'0 22px',
          borderBottom:`1px solid ${BORDER}`,
          flexShrink:0,
          background:SURFACE,
          zIndex:200, gap:14,
          position:'relative', overflow:'visible',
        }}>
          {/* Atmospheric wash — very subtle, matches the hero on Home */}
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 140% 400% at -5% 50%, rgba(77,159,255,0.07) 0%, transparent 55%), radial-gradient(ellipse 90% 400% at 105% 50%, rgba(255,87,30,0.06) 0%, transparent 50%)', pointerEvents:'none' }}/>

          {/* Left: date + active section dot */}
          <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0, position:'relative' }}>
            {activeItem && (
              <div style={{ width:6, height:6, borderRadius:'50%', background:activeItem.color, flexShrink:0 }}/>
            )}
            <span style={{ fontSize:12.5, fontWeight:500, color:'rgba(255,255,255,0.42)', letterSpacing:'-0.01em', whiteSpace:'nowrap', fontFamily:'var(--sans)' }}>
              {format(new Date(), 'EEEE, d MMM yyyy')}
            </span>
          </div>

          {/* Center: search with live suggestions */}
          <div style={{ flex:1, maxWidth:380, position:'relative' }} data-dd>
            <div style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.22)', display:'flex', pointerEvents:'none', zIndex:1 }}>
              {Ic.search}
            </div>
            <input
              placeholder="Jump to anywhere…"
              value={searchQ}
              onChange={e => { setSearchQ(e.target.value); setSearchOpen(e.target.value.length > 0) }}
              onFocus={e => { e.target.style.borderColor='rgba(77,159,255,0.3)'; e.target.style.background='rgba(77,159,255,0.04)'; if(searchQ) setSearchOpen(true) }}
              onBlur={e => { e.target.style.borderColor=BORDER; e.target.style.background='rgba(255,255,255,0.04)'; setTimeout(()=>setSearchOpen(false), 150) }}
              onKeyDown={e => {
                if (e.key === 'Escape') { setSearchQ(''); setSearchOpen(false); (e.target as HTMLInputElement).blur() }
              }}
              style={{ width:'100%', padding:'8px 14px 8px 36px', background:'rgba(255,255,255,0.04)', border:`1px solid ${BORDER}`, borderRadius:10, color:'rgba(255,255,255,0.75)', fontSize:13, fontFamily:'var(--sans)', outline:'none', transition:'all 0.18s', boxSizing:'border-box' as const }}
            />
            {/* Live suggestions dropdown */}
            {searchOpen && searchQ.length > 0 && (() => {
              const ALL_PAGES = [
                { label:'Home',        href:'/dashboard',              desc:'Morning brief, agents, activity',        color:'#4D9FFF' },
                { label:'Studio',      href:'/dashboard/studio',       desc:'Create everything, in your voice',  color:'#A78BFA' },
                { label:'Brand Brain', href:'/dashboard/brand',        desc:'Your brand DNA — voice, audience, style',  color:'#34D399' },
                { label:'Strategy',    href:'/dashboard/strategy',     desc:'Your complete 30-day content blueprint',      color:'#FFB547' },
                { label:'Schedule',    href:'/dashboard/schedule',     desc:'Publish everywhere, automatically',        color:'#4D9FFF' },
                { label:'Automate',      href:'/dashboard/automate',     desc:'Sequences that run while you sleep',           color:'#FF5757' },
                { label:'Amplify',       href:'/dashboard/amplify',      desc:'Run Meta Ads from your Brand Brain',            color:'#F97316' },
                { label:'Integrations', href:'/dashboard/integrations', desc:'Connect your tools, CRMs, and platforms',       color:'#A855F7' },
                { label:'Insights',     href:'/dashboard/insights',     desc:'What worked. What didn\'t. What to do next.',  color:'#38BFFF' },
                { label:'Agency',      href:'/dashboard/agency',       desc:'Manage clients and deliver at scale',      color:'#FF7A40' },
                { label:'Settings',    href:'/dashboard/settings',     desc:'Profile, workspace, billing',       color:'rgba(255,255,255,0.5)' },
                { label:'Billing',     href:'/dashboard/settings?tab=billing',   desc:'Your plan and credits', color:'#4D9FFF' },
                { label:'Profile',     href:'/dashboard/settings?tab=profile',   desc:'Name, email, bio',         color:'rgba(255,255,255,0.5)' },
                { label:'Workspace',   href:'/dashboard/settings?tab=workspace', desc:'Workspace brand settings',    color:'#A78BFA' },
              ]
              const q = searchQ.toLowerCase()
              const results = ALL_PAGES.filter(p => 
                p.label.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
              ).slice(0, 6)
              if (!results.length) return null
              return (
                <div style={{ position:'absolute', top:'calc(100% + 8px)', left:0, right:0, background:'rgba(10,10,18,0.98)', border:`1px solid ${BORDER}`, borderRadius:14, overflow:'hidden', zIndex:9999, backdropFilter:'blur(24px)', boxShadow:'0 16px 48px rgba(0,0,0,0.7)' }}>
                  <div style={{ padding:'8px 14px 6px', fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.25)', letterSpacing:'0.09em', textTransform:'uppercase' }}>
                    Pages
                  </div>
                  {results.map(r => (
                    <a key={r.href} href={r.href}
                      onClick={() => { setSearchQ(''); setSearchOpen(false) }}
                      style={{ display:'flex', alignItems:'center', gap:11, padding:'10px 14px', textDecoration:'none', transition:'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.05)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='transparent'}>
                      <div style={{ width:28, height:28, borderRadius:8, background:`${r.color}14`, border:`1px solid ${r.color}25`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <div style={{ width:6, height:6, borderRadius:'50%', background:r.color }}/>
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.88)', letterSpacing:'-0.01em' }}>{r.label}</div>
                        <div style={{ fontSize:11, color:'rgba(255,255,255,0.32)', marginTop:1 }}>{r.desc}</div>
                      </div>
                    </a>
                  ))}
                </div>
              )
            })()}
          </div>

          {/* Right: credits + notifications + chat toggle + user */}
          <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0, position:'relative' }}>

            {/* Trial countdown badge */}
            {trialDaysLeft !== null && (
              <a href="/dashboard/settings?tab=billing" style={{
                display:'flex', alignItems:'center', gap:5, padding:'5px 11px',
                borderRadius:9, textDecoration:'none',
                background: trialDaysLeft <= 1 ? 'rgba(255,80,80,0.1)' : 'rgba(255,181,71,0.08)',
                border: `1px solid ${trialDaysLeft <= 1 ? 'rgba(255,80,80,0.28)' : 'rgba(255,181,71,0.22)'}`,
                fontSize:11, fontWeight:700,
                color: trialDaysLeft <= 1 ? '#FF5757' : '#FFB547',
                whiteSpace:'nowrap',
              }}>
                {trialDaysLeft === 0 ? '⚠ Trial expired' : `Trial · ${trialDaysLeft}d left`}
              </a>
            )}

            {/* Credits chip */}
            <div data-tour="credits" title="Post: 3cr · Hook: 2cr · Thread: 5cr · Image: 5cr · Voice: 8cr · Video: 15cr · Strategy & chat: free" style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', background:'var(--blue-dim)', border:'1px solid var(--blue-border)', borderRadius:8, cursor:'help' }}>
              <div style={{ width:4, height:4, borderRadius:'50%', background:'var(--blue2)', flexShrink:0 }}/>
              <span className="nexa-num" style={{ fontSize:13, color:'var(--blue2)', fontFamily:'var(--mono)', fontWeight:300 }}>
                {credits.toLocaleString()}
              </span>
              <span style={{ fontSize:10, color:'var(--blue-border)', fontWeight:500, letterSpacing:'0.03em' }}>cr</span>
            </div>

            {/* Notification bell */}
            <div style={{ position:'relative' }} data-dd>
              <button
                onClick={() => {
                  setNotifOpen(o => !o)
                  setPillOpen(false)
                  if (!notifOpen) setUnread(0) // clear badge when opening
                }}
                style={{ width:34, height:34, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', background:notifOpen?'rgba(255,255,255,0.07)':'transparent', border:`1px solid ${notifOpen?'rgba(255,255,255,0.12)':'transparent'}`, color:notifOpen?'rgba(255,255,255,0.85)':'rgba(255,255,255,0.38)', cursor:'pointer', transition:'all 0.15s', position:'relative' }}
                onMouseEnter={e => { if(!notifOpen){ (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.7)' }}}
                onMouseLeave={e => { if(!notifOpen){ (e.currentTarget as HTMLElement).style.background='transparent'; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.38)' }}}>
                {Ic.bell}
                {unread > 0 && (
                  <div style={{ position:'absolute', top:6, right:6, width:7, height:7, borderRadius:'50%', background:'#FF5757', border:'1.5px solid var(--bg)' }}/>
                )}
              </button>

              {/* Notification dropdown */}
              {notifOpen && (
                <div style={{ position:'absolute', top:'calc(100% + 10px)', right:0, background:'rgba(10,10,18,0.98)', border:`1px solid ${BORDER}`, borderRadius:16, overflow:'hidden', width:320, zIndex:300, backdropFilter:'blur(24px)', boxShadow:'0 24px 64px rgba(0,0,0,0.75)', animation:'pageUp 0.18s ease both' }}>
                  {/* Header */}
                  <div style={{ padding:'14px 16px 12px', borderBottom:`1px solid ${BORDER}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontFamily:'var(--display)', fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.88)' }}>Notifications</span>
                    {unread > 0 && (
                      <span style={{ fontSize:10, fontWeight:700, color:'#FF5757', padding:'2px 8px', borderRadius:100, background:'rgba(255,87,87,0.1)', border:'1px solid rgba(255,87,87,0.2)' }}>
                        {unread} new
                      </span>
                    )}
                  </div>
                  {/* Items */}
                  <div style={{ maxHeight:320, overflowY:'auto' }}>
                    {notifs.length > 0 ? notifs.slice(0,8).map((n:any,i:number) => (
                      <div key={n.id||i} style={{ display:'flex', gap:11, padding:'11px 16px', borderBottom:`1px solid rgba(255,255,255,0.04)`, transition:'background 0.12s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.03)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='transparent'}>
                        <div style={{ width:7, height:7, borderRadius:'50%', background:'#4D9FFF', flexShrink:0, marginTop:5 }}/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12.5, color:'rgba(255,255,255,0.72)', lineHeight:1.5, letterSpacing:'-0.01em' }}>{n.title}</div>
                          <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)', marginTop:3 }}>
                            {n.created_at ? format(parseISO(n.created_at), 'MMM d, h:mm a') : ''}
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div style={{ padding:'28px 16px', textAlign:'center' }}>
                        <div style={{ fontSize:12, color:'rgba(255,255,255,0.28)', lineHeight:1.7 }}>
                          You're all caught up.<br/>
                          <span style={{ fontSize:11, color:'rgba(255,255,255,0.18)' }}>Activity will appear here.</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Chat toggle */}
            <button
              onClick={() => setChatOpen(o => !o)}
              style={{ width:34, height:34, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', background:chatOpen?'rgba(77,159,255,0.1)':'transparent', border:`1px solid ${chatOpen?'rgba(77,159,255,0.25)':'transparent'}`, color:chatOpen?'#4D9FFF':'rgba(255,255,255,0.38)', cursor:'pointer', transition:'all 0.15s' }}
              onMouseEnter={e => { if(!chatOpen){ (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.7)' }}}
              onMouseLeave={e => { if(!chatOpen){ (e.currentTarget as HTMLElement).style.background='transparent'; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.38)' }}}>
              {Ic.chat}
            </button>

            {/* User pill — self-contained with its own dropdown */}
            <div style={{ position:'relative' }} data-dd>
              <div
                onClick={() => { setPillOpen(o => !o); setNotifOpen(false) }}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 10px 5px 6px', background:pillOpen?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.04)', border:`1px solid ${pillOpen?'rgba(255,255,255,0.14)':BORDER}`, borderRadius:11, cursor:'pointer', transition:'all 0.15s' }}
                onMouseEnter={e => { if(!pillOpen){(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.14)';(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.07)'} }}
                onMouseLeave={e => { if(!pillOpen){(e.currentTarget as HTMLElement).style.borderColor=BORDER;(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)'} }}>
                <div style={{ width:26, height:26, borderRadius:7, background:'linear-gradient(135deg,var(--blue),var(--blue2))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff', fontFamily:'var(--display)', flexShrink:0 }}>
                  {initial}
                </div>
                <div style={{ lineHeight:1 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.78)', letterSpacing:'-0.01em' }}>{firstName}</div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.32)', marginTop:2, textTransform:'capitalize' }}>{workspace?.plan||'spark'}</div>
                </div>
                <span style={{ color:'rgba(255,255,255,0.22)', display:'flex', transform:pillOpen?'rotate(180deg)':'none', transition:'transform 0.15s' }}>{Ic.chevron}</span>
              </div>

              {pillOpen && (
                <div style={{ position:'absolute', top:'calc(100% + 10px)', right:0, background:'rgba(10,10,18,0.98)', border:`1px solid ${BORDER}`, borderRadius:14, padding:5, minWidth:220, zIndex:9999, backdropFilter:'blur(24px)', boxShadow:'0 24px 64px rgba(0,0,0,0.85)', animation:'pageUp 0.15s ease both' }}>
                  <div style={{ padding:'10px 12px 12px', borderBottom:`1px solid ${BORDER}`, marginBottom:4, display:'flex', alignItems:'center', gap:9 }}>
                    <div style={{ width:32, height:32, borderRadius:10, background:'linear-gradient(135deg,#4D9FFF,#A78BFA)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', fontFamily:'var(--display)', flexShrink:0 }}>{initial}</div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.88)', fontFamily:'var(--display)', lineHeight:1 }}>{user?.full_name||'User'}</div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginTop:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:140 }}>{user?.email}</div>
                    </div>
                  </div>
                  {[
                    { l:'Profile',   h:'/dashboard/settings?tab=profile',   i:Ic.user    },
                    { l:'Workspace', h:'/dashboard/settings?tab=workspace', i:Ic.settings },
                    { l:'Billing',   h:'/dashboard/settings?tab=billing',   i:Ic.billing  },
                  ].map(x => (
                    <a key={x.l} href={x.h} onClick={() => setPillOpen(false)}
                      style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 12px', borderRadius:9, fontSize:13, color:'rgba(255,255,255,0.55)', textDecoration:'none', transition:'all 0.12s' }}
                      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.06)';(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.9)'}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='transparent';(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.55)'}}>
                      <span style={{ color:'rgba(255,255,255,0.28)', display:'flex' }}>{x.i}</span>{x.l}
                    </a>
                  ))}
                  <div style={{ height:1, background:BORDER, margin:'4px 0' }}/>
                  <button onClick={signOut}
                    style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 12px', borderRadius:9, fontSize:13, color:'rgba(255,87,87,0.8)', background:'transparent', border:'none', cursor:'pointer', width:'100%', textAlign:'left', fontFamily:'var(--sans)', transition:'background 0.12s' }}
                    onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,87,87,0.08)')}
                    onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                    <span style={{ display:'flex' }}>{Ic.signout}</span>Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex:1, overflowY:'auto', position:'relative' }}>
          {children}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          RIGHT CHAT PANEL
      ═══════════════════════════════════════════════════ */}
      {chatOpen && (
        <div style={{ display:'flex', flexDirection:'column', borderLeft:`1px solid ${BORDER}`, background:SURFACE, overflow:'hidden', width:360, minWidth:360 }}>
          <style>{`
            .nexa-chat-body { scrollbar-width: none; }
            .nexa-chat-body::-webkit-scrollbar { display: none; }
            .nexa-msg-ai { font-size:13.5px; color:rgba(255,255,255,0.82); line-height:1.8; letter-spacing:-0.01em; }
            .nexa-msg-ai p { margin: 0 0 10px; }
            .nexa-msg-ai p:last-child { margin-bottom: 0; }
            .nexa-msg-ai strong { color:rgba(255,255,255,0.95); font-weight:700; }
            .nexa-msg-ai em { color:rgba(255,255,255,0.7); font-style:italic; }
            .nexa-msg-ai ul, .nexa-msg-ai ol { margin: 6px 0 10px 16px; display:flex; flex-direction:column; gap:4px; }
            .nexa-msg-ai li { color:rgba(255,255,255,0.75); }
            .nexa-msg-ai code { background:rgba(14,165,255,0.1); border:1px solid rgba(14,165,255,0.2); border-radius:5px; padding:1px 6px; font-size:12px; color:#0EA5FF; font-family:monospace; }
            .nexa-msg-ai h1,.nexa-msg-ai h2,.nexa-msg-ai h3 { color:rgba(255,255,255,0.95); font-weight:700; margin:12px 0 6px; letter-spacing:-0.02em; }
            .nexa-msg-ai h3 { font-size:13.5px; }
            .nexa-msg-ai a { color:#0EA5FF; text-decoration:underline; }
            .nexa-msg-ai hr { border:none; border-top:1px solid rgba(255,255,255,0.08); margin:12px 0; }
            @keyframes pulse-dot { 0%,80%,100%{opacity:0.3;transform:scale(0.8)} 40%{opacity:1;transform:scale(1)} }
            @keyframes msgIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
          `}</style>

          {/* Header */}
          <div style={{ height:'var(--topbar-h)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 18px', borderBottom:`1px solid rgba(255,255,255,0.055)`, flexShrink:0, background:SURFACE, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 200% 300% at -10% 50%, rgba(14,165,255,0.05) 0%, transparent 60%)', pointerEvents:'none' }}/>
            <div style={{ display:'flex', alignItems:'center', gap:11, position:'relative' }}>
              <div style={{ width:20, height:20, borderRadius:5, overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)', flexShrink:0 }}>
                <img src="/favicon.png" alt="Nexa" width={20} height={20} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
              </div>
              <div>
                <div style={{ fontFamily:'var(--display)', fontSize:14, fontWeight:800, color:'rgba(255,255,255,0.95)', lineHeight:1, letterSpacing:'-0.03em' }}>Nexa AI</div>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:4 }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:'#34D399', boxShadow:'0 0 6px #34D399' }}/>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,0.35)', letterSpacing:'0.01em' }}>knows your brand</span>
                </div>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)}
              style={{ width:28, height:28, borderRadius:8, background:'transparent', border:'none', color:'rgba(255,255,255,0.25)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.12s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.75)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='transparent'; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.25)' }}>
              {Ic.close}
            </button>
          </div>

          {/* Messages */}
          <div className="nexa-chat-body" style={{ flex:1, overflowY:'auto', padding:'20px 18px', display:'flex', flexDirection:'column', gap:20 }}>

            {msgs.length === 0 && (
              <div style={{ textAlign:'center', padding:'40px 16px 20px' }}>
                <div style={{ width:44, height:44, borderRadius:12, overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)', margin:'0 auto 16px' }}>
                  <img src="/favicon.png" alt="Nexa" width={44} height={44} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                </div>
                <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.65)', marginBottom:8, letterSpacing:'-0.02em', fontFamily:'var(--display)' }}>Nexa AI</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.28)', lineHeight:1.7 }}>Ask anything about your brand,<br/>content, strategy, or competitors.<br/>Attach files to teach it more.</div>
              </div>
            )}

            {msgs.map((m, i) => (
              <div key={i} style={{ display:'flex', flexDirection:'column', gap:6, animation:'msgIn 0.22s ease both', alignItems: m.role==='user' ? 'flex-end' : 'flex-start' }}>
                {/* Role label */}
                <div style={{ display:'flex', alignItems:'center', gap:7, flexDirection: m.role==='user' ? 'row-reverse' : 'row' }}>
                  {m.role === 'assistant'
                    ? <div style={{ width:22, height:22, borderRadius:6, overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)', flexShrink:0 }}><img src="/favicon.png" alt="Nexa" width={22} height={22} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/></div>
                    : <div style={{ width:22, height:22, borderRadius:6, background:'linear-gradient(135deg,#4D9FFF,#A78BFA)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, color:'#fff', fontFamily:'var(--display)', flexShrink:0 }}>{initial}</div>
                  }
                  <span style={{ fontSize:10.5, fontWeight:600, color:'rgba(255,255,255,0.3)', letterSpacing:'0.01em' }}>
                    {m.role === 'assistant' ? 'Nexa' : firstName}
                  </span>
                </div>
                {/* Message content */}
                {m.role === 'assistant'
                  ? <div className="nexa-msg-ai" style={{ paddingLeft:29 }} dangerouslySetInnerHTML={{ __html: typeof marked.parse(m.content) === 'string' ? marked.parse(m.content) as string : '' }}/>
                  : <div style={{ maxWidth:'88%', padding:'10px 14px', borderRadius:'16px 4px 16px 16px', background:'linear-gradient(135deg,rgba(14,165,255,0.14),rgba(14,165,255,0.07))', border:'1px solid rgba(14,165,255,0.2)', fontSize:13, color:'rgba(255,255,255,0.88)', lineHeight:1.7, letterSpacing:'-0.01em', fontFamily:'var(--sans)' }}>
                      {m.content}
                    </div>
                }
              </div>
            ))}

            {chatLoading && (
              <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-start' }}>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <div style={{ width:22, height:22, borderRadius:6, overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)', flexShrink:0 }}><img src="/favicon.png" alt="Nexa" width={22} height={22} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/></div>
                  <span style={{ fontSize:10.5, fontWeight:600, color:'rgba(255,255,255,0.3)' }}>Nexa</span>
                </div>
                <div style={{ paddingLeft:29, display:'flex', gap:5, alignItems:'center', height:28 }}>
                  {[0,1,2].map(j => (
                    <div key={j} style={{ width:6, height:6, borderRadius:'50%', background:'rgba(14,165,255,0.7)', animation:`pulse-dot 1.4s ease-in-out ${j*0.18}s infinite` }}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef}/>
          </div>

          {/* Quick prompts */}
          <div style={{ padding:'10px 16px', borderTop:'1px solid rgba(255,255,255,0.05)', display:'flex', gap:5, flexWrap:'wrap' }}>
            {QUICK.map(q => (
              <button key={q} onClick={() => setInput(q)}
                style={{ padding:'5px 12px', fontSize:11, fontWeight:500, color:'rgba(255,255,255,0.35)', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:100, cursor:'pointer', fontFamily:'var(--sans)', transition:'all 0.15s', letterSpacing:'-0.01em', whiteSpace:'nowrap' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color='rgba(14,165,255,0.9)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(14,165,255,0.28)'; (e.currentTarget as HTMLElement).style.background='rgba(14,165,255,0.07)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.35)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.03)' }}>
                {q}
              </button>
            ))}
          </div>

          {/* Attached files */}
          {files.length > 0 && (
            <div style={{ padding:'6px 14px', borderTop:`1px solid ${BORDER}`, display:'flex', gap:5, flexWrap:'wrap' }}>
              {files.map((f,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', background:'rgba(77,159,255,0.08)', border:'1px solid rgba(77,159,255,0.2)', borderRadius:8, fontSize:11 }}>
                  <span style={{ color:'#4D9FFF', display:'flex' }}>{Ic.clip}</span>
                  <span style={{ color:'rgba(255,255,255,0.65)', maxWidth:80, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</span>
                  <button onClick={() => setFiles(p => p.filter((_,j) => j!==i))} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', padding:0, display:'flex' }}>{Ic.close}</button>
                </div>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding:'14px 16px 16px', borderTop:'1px solid rgba(255,255,255,0.055)', flexShrink:0 }}>
            <div
              style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:16, padding:'12px 14px', transition:'all 0.18s' }}
              onFocusCapture={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(14,165,255,0.35)'; (e.currentTarget as HTMLElement).style.boxShadow='0 0 0 3px rgba(14,165,255,0.07)' }}
              onBlurCapture={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.09)'; (e.currentTarget as HTMLElement).style.boxShadow='none' }}>
              <button onClick={() => fileRef.current?.click()}
                style={{ background:'none', border:'none', color:'rgba(255,255,255,0.22)', cursor:'pointer', display:'flex', padding:'2px 0', flexShrink:0, transition:'color 0.12s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='#4D9FFF'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.22)'}>
                {Ic.clip}
              </button>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" style={{ display:'none' }} onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])}/>
              <textarea
                value={input}
                onChange={e => { setInput(e.target.value); e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,120)+'px' }}
                onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); send() }}}
                placeholder="Message Nexa…"
                rows={1}
                style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:13.5, color:'rgba(255,255,255,0.88)', fontFamily:'var(--sans)', letterSpacing:'-0.01em', resize:'none', lineHeight:1.6, maxHeight:120, overflowY:'auto', scrollbarWidth:'none' }}
              />
              <button onClick={send}
                disabled={(!input.trim() && files.length===0) || chatLoading}
                style={{ width:32, height:32, borderRadius:9, background:(input.trim()||files.length>0) ? 'var(--blue)' : 'rgba(255,255,255,0.05)', border:'none', cursor:(input.trim()||files.length>0)?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', color:(input.trim()||files.length>0)?'#fff':'rgba(255,255,255,0.2)', transition:'all 0.15s', flexShrink:0, boxShadow:(input.trim()||files.length>0)?'0 2px 12px rgba(30,142,240,0.35)':'none' }}>
                {chatLoading ? <div className="nexa-spinner" style={{ width:14, height:14 }}/> : Ic.send}
              </button>
            </div>
            <p style={{ fontSize:10, color:'rgba(255,255,255,0.16)', textAlign:'center', marginTop:8, letterSpacing:'0.01em' }}>
              {uploading ? 'Reading file…' : 'Enter to send  ·  Shift+Enter for new line'}
            </p>
          </div>
        </div>
      )}
      {showTour && <NexaTour onClose={dismissTour}/>}
    </div>
  )
}