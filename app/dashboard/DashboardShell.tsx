'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'

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
  home:         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>,
  studio:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15.5 5.5L18.5 8.5L8 19H5V16L15.5 5.5z"/><path d="M13 8l3 3"/></svg>,
  brand:        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>,
  strategy:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h20"/><path d="M6 20V14"/><path d="M10 20V8"/><path d="M14 20V11"/><path d="M18 20V4"/></svg>,
  schedule:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  automate:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  insights:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18"/><path d="M5 20V14l4-4 4 3 4-6 4 4v9"/></svg>,
  agency:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  settings:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  bell:         <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  chat:         <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  send:         <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  close:        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  chevron:      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>,
  user:         <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  billing:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  signout:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  clip:         <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
  search:       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  bolt:         <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
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
  { id:'automate', href:'/dashboard/automate', icon:'automate', label:'Automate',    color:'#FF5757' },
  { id:'insights', href:'/dashboard/insights', icon:'insights', label:'Insights',    color:'#38BFFF' },
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

  const [credits,     setCredits]     = useState(init)
  const [chatOpen,    setChatOpen]    = useState(true)
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

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-dd]')) { setPillOpen(false); setNotifOpen(false) }
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
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
      const r = await fetch(`/api/notifications?workspace_id=${workspace.id}`)
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
      const r = await fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ message:msg, workspace_id:workspace.id, history:msgs, files:fs }) })
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
    <div style={{ display:'grid', gridTemplateColumns:`52px 1fr ${chatOpen?'var(--chat-w)':'0px'}`, height:'100vh', overflow:'hidden', background:'var(--bg)', transition:'grid-template-columns 0.22s cubic-bezier(0.4,0,0.2,1)', fontFamily:'var(--sans)' }}>

      {/* ═══════════════════════════════════════════════════
          LEFT RAIL
      ═══════════════════════════════════════════════════ */}
      <div style={{ background:SURFACE, borderRight:`1px solid ${BORDER}`, display:'flex', flexDirection:'column', alignItems:'center', padding:'14px 0 14px', overflow:'hidden', zIndex:20 }}>

        {/* Logo — clean, no glow */}
        <div style={{ marginBottom:20, flexShrink:0 }}>
          <NexaLogo size={30}/>
        </div>

        {/* Nav items */}
        <div style={{ display:'flex', flexDirection:'column', gap:3, flex:1, width:'100%', padding:'0 8px', overflowY:'auto', scrollbarWidth:'none' }}>
          {NAV.map(item => {
            const active = activeId === item.id
            return (
              <Link key={item.id} href={item.href}
                style={{ textDecoration:'none', display:'block', position:'relative' }}
                onMouseEnter={() => setHoverId(item.id)}
                onMouseLeave={() => setHoverId(null)}>
                <div
                  style={{
                    width:36, height:36, borderRadius:10,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    background: active ? `${item.color}14` : 'transparent',
                    color: active ? item.color : 'rgba(255,255,255,0.3)',
                    transition:'all 0.15s',
                    cursor:'pointer', position:'relative', margin:'0 auto',
                  }}
                  onMouseEnter={e => { if(!active){ (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.65)' }}}
                  onMouseLeave={e => { if(!active){ (e.currentTarget as HTMLElement).style.background='transparent'; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.3)' }}}>
                  {/* Active indicator */}
                  {active && (
                    <div style={{ position:'absolute', left:-8, top:'50%', transform:'translateY(-50%)', width:3, height:16, borderRadius:'0 3px 3px 0', background:item.color }}/>
                  )}
                  {(Ic as any)[item.icon]}
                </div>

                {/* Tooltip */}
                {hoverId === item.id && (
                  <div style={{ position:'absolute', left:'calc(100% + 14px)', top:'50%', transform:'translateY(-50%)', background:'rgba(10,10,18,0.97)', border:`1px solid ${BORDER}`, color:'rgba(255,255,255,0.82)', fontSize:12, fontWeight:500, padding:'5px 11px', borderRadius:8, whiteSpace:'nowrap', zIndex:9999, pointerEvents:'none', backdropFilter:'blur(12px)', boxShadow:'0 8px 24px rgba(0,0,0,0.5)' }}>
                    {item.label}
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
            <span style={{ fontSize:12.5, fontWeight:500, color:'rgba(255,255,255,0.42)', letterSpacing:'-0.01em', whiteSpace:'nowrap' }}>
              {format(new Date(), 'EEEE, d MMM yyyy')}
            </span>
          </div>

          {/* Center: search with live suggestions */}
          <div style={{ flex:1, maxWidth:380, position:'relative' }} data-dd>
            <div style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.22)', display:'flex', pointerEvents:'none', zIndex:1 }}>
              {Ic.search}
            </div>
            <input
              placeholder="Search pages, tools…"
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
                { label:'Home',        href:'/dashboard',              desc:'Overview, agents, activity',        color:'#4D9FFF' },
                { label:'Studio',      href:'/dashboard/studio',       desc:'Write copy, images, video, voice',  color:'#A78BFA' },
                { label:'Brand Brain', href:'/dashboard/brand',        desc:'Voice, audience, visual identity',  color:'#34D399' },
                { label:'Strategy',    href:'/dashboard/strategy',     desc:'Pillars, angles, 30-day plan',      color:'#FFB547' },
                { label:'Schedule',    href:'/dashboard/schedule',     desc:'Calendar, queue, platforms',        color:'#4D9FFF' },
                { label:'Automate',    href:'/dashboard/automate',     desc:'Email sequences, automations',      color:'#FF5757' },
                { label:'Insights',    href:'/dashboard/insights',     desc:'Analytics, charts, performance',    color:'#38BFFF' },
                { label:'Agency',      href:'/dashboard/agency',       desc:'Client workspaces, retainers',      color:'#FF7A40' },
                { label:'Settings',    href:'/dashboard/settings',     desc:'Profile, workspace, billing',       color:'rgba(255,255,255,0.5)' },
                { label:'Billing',     href:'/dashboard/settings?tab=billing',   desc:'Plans, credits, upgrades', color:'#4D9FFF' },
                { label:'Profile',     href:'/dashboard/settings?tab=profile',   desc:'Name, email, bio',         color:'rgba(255,255,255,0.5)' },
                { label:'Workspace',   href:'/dashboard/settings?tab=workspace', desc:'Brand voice, audience',    color:'#A78BFA' },
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

            {/* Credits pill — full word */}
            <div style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 13px', background:'rgba(77,159,255,0.07)', border:'1px solid rgba(77,159,255,0.18)', borderRadius:9, cursor:'default' }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:'#4D9FFF' }}/>
              <span style={{ fontFamily:'var(--display)', fontSize:13, fontWeight:700, color:'#4D9FFF', letterSpacing:'-0.02em' }}>
                {credits.toLocaleString()}
              </span>
              <span style={{ fontSize:11, color:'rgba(77,159,255,0.55)', fontWeight:500 }}>credits</span>
            </div>

            {/* Notification bell */}
            <div style={{ position:'relative' }} data-dd>
              <button
                onClick={() => { setNotifOpen(o => !o); setDdOpen(false) }}
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
                <div style={{ width:26, height:26, borderRadius:8, background:'linear-gradient(135deg,#4D9FFF,#A78BFA)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff', fontFamily:'var(--display)', flexShrink:0 }}>
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
        <div style={{ display:'flex', flexDirection:'column', borderLeft:`1px solid ${BORDER}`, background:SURFACE, overflow:'hidden' }}>

          {/* Chat header — matches rail height exactly */}
          <div style={{ height:'var(--topbar-h)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', borderBottom:`1px solid ${BORDER}`, flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {/* Logo — no glow */}
              <NexaLogo size={28}/>
              <div>
                <div style={{ fontFamily:'var(--display)', fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.88)', lineHeight:1, letterSpacing:'-0.01em' }}>Nexa AI</div>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:3 }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:'#34D399' }}/>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,0.32)' }}>Online · brand-aware</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              style={{ width:26, height:26, borderRadius:7, background:'transparent', border:'none', color:'rgba(255,255,255,0.28)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.12s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.72)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='transparent'; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.28)' }}>
              {Ic.close}
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:'auto', padding:'16px 14px', display:'flex', flexDirection:'column', gap:12, scrollbarWidth:'none' }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display:'flex', gap:8, flexDirection:m.role==='user'?'row-reverse':'row', alignItems:'flex-start', animation:'pageUp 0.2s ease both' }}>
                {/* Avatar */}
                <div style={{ width:24, height:24, flexShrink:0, borderRadius:7, overflow:'hidden' }}>
                  {m.role === 'assistant'
                    ? <NexaLogo size={24}/>
                    : <div style={{ width:24, height:24, borderRadius:7, background:'rgba(255,255,255,0.06)', border:`1px solid ${BORDER}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.5)', fontFamily:'var(--display)' }}>{initial}</div>}
                </div>
                {/* Bubble */}
                <div style={{
                  maxWidth:'84%',
                  padding:'10px 13px',
                  borderRadius: m.role==='user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                  background: m.role==='user' ? 'rgba(77,159,255,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${m.role==='user'?'rgba(77,159,255,0.2)':BORDER}`,
                  fontSize:13, color:'rgba(255,255,255,0.8)', lineHeight:1.65, letterSpacing:'-0.01em',
                }}>
                  {m.content}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                <div style={{ width:24, height:24, borderRadius:7, overflow:'hidden', flexShrink:0 }}>
                  <NexaLogo size={24}/>
                </div>
                <div style={{ padding:'10px 14px', borderRadius:'4px 12px 12px 12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${BORDER}`, display:'flex', gap:5, alignItems:'center' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width:5, height:5, borderRadius:'50%', background:'rgba(255,255,255,0.3)', animation:`pageSpin 1.4s ease-in-out ${i*0.18}s infinite` }}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef}/>
          </div>

          {/* Quick prompts */}
          <div style={{ padding:'8px 12px', borderTop:`1px solid ${BORDER}`, display:'flex', gap:5, flexWrap:'wrap' }}>
            {QUICK.map(q => (
              <button key={q} onClick={() => setInput(q)}
                style={{ padding:'4px 10px', fontSize:11, fontWeight:500, color:'rgba(255,255,255,0.35)', background:'rgba(255,255,255,0.03)', border:`1px solid ${BORDER}`, borderRadius:100, cursor:'pointer', fontFamily:'var(--sans)', transition:'all 0.12s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.72)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.14)'; (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.06)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.35)'; (e.currentTarget as HTMLElement).style.borderColor=BORDER; (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.03)' }}>
                {q}
              </button>
            ))}
          </div>

          {/* Attached files */}
          {files.length > 0 && (
            <div style={{ padding:'6px 12px', borderTop:`1px solid ${BORDER}`, display:'flex', gap:5, flexWrap:'wrap' }}>
              {files.map((f,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 9px', background:'rgba(77,159,255,0.08)', border:'1px solid rgba(77,159,255,0.2)', borderRadius:7, fontSize:10 }}>
                  <span style={{ color:'#4D9FFF', display:'flex' }}>{Ic.clip}</span>
                  <span style={{ color:'rgba(255,255,255,0.6)', maxWidth:72, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</span>
                  <button onClick={() => setFiles(p => p.filter((_,j) => j!==i))} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', padding:0, display:'flex' }}>{Ic.close}</button>
                </div>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding:'10px 12px', borderTop:`1px solid ${BORDER}`, flexShrink:0 }}>
            <div
              style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.04)', border:`1px solid ${BORDER}`, borderRadius:12, padding:'8px 12px', transition:'border-color 0.18s' }}
              onFocusCapture={e => (e.currentTarget as HTMLElement).style.borderColor='rgba(77,159,255,0.28)'}
              onBlurCapture={e => (e.currentTarget as HTMLElement).style.borderColor=BORDER}>
              {/* Attach file */}
              <button
                onClick={() => fileRef.current?.click()}
                style={{ background:'none', border:'none', color:'rgba(255,255,255,0.25)', cursor:'pointer', display:'flex', padding:0, flexShrink:0, transition:'color 0.12s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='#4D9FFF'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.25)'}>
                {Ic.clip}
              </button>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" style={{ display:'none' }} onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])}/>
              {/* Text input */}
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key==='Enter' && !e.shiftKey && send()}
                placeholder="Message Nexa…"
                style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:13, color:'rgba(255,255,255,0.85)', fontFamily:'var(--sans)', letterSpacing:'-0.01em' }}
              />
              {/* Send */}
              <button
                onClick={send}
                disabled={(!input.trim() && files.length===0) || chatLoading}
                style={{ width:28, height:28, borderRadius:8, background:(input.trim()||files.length>0)?'#4D9FFF':'rgba(255,255,255,0.05)', border:`1px solid ${(input.trim()||files.length>0)?'transparent':BORDER}`, cursor:(input.trim()||files.length>0)?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', color:(input.trim()||files.length>0)?'#000':'rgba(255,255,255,0.2)', transition:'all 0.15s', flexShrink:0 }}>
                {Ic.send}
              </button>
            </div>
            <p style={{ fontSize:9.5, color:'rgba(255,255,255,0.18)', textAlign:'center', marginTop:6 }}>
              {uploading ? 'Reading file…' : '↵ send  ·  attach files to teach Nexa your brand'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
