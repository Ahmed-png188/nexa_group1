'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'

/* ─── NEXA LOGO — real brand mark ─────────────────────────────── */
function NexaLogo({ size = 30, glow = false }: { size?: number; glow?: boolean }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: Math.round(size * 0.26),
      overflow: 'hidden',
      flexShrink: 0,
      boxShadow: glow ? '0 0 16px rgba(14,165,255,0.5), 0 0 32px rgba(14,165,255,0.2)' : 'none',
      transition: 'box-shadow 0.3s',
      border: glow ? '1px solid rgba(14,165,255,0.3)' : '1px solid rgba(255,255,255,0.08)',
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

/* ─── Icon system ──────────────────────────────────────────────── */
const Ic = {
  home:         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>,
  studio:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15.5 5.5L18.5 8.5L8 19H5V16L15.5 5.5z"/><path d="M13 8l3 3"/></svg>,
  brand:        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>,
  strategy:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h20"/><path d="M6 20V14"/><path d="M10 20V8"/><path d="M14 20V11"/><path d="M18 20V4"/></svg>,
  schedule:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  automate:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  insights:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18"/><path d="M5 20V14l4-4 4 3 4-6 4 4v9"/></svg>,
  integrations: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M9 6h6M6 9v6M18 9v3a6 6 0 0 1-6 6H9"/></svg>,
  agency:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  settings:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
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
  mic:          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
}

const NAV = [
  { id:'home',         href:'/dashboard',              icon:'home',         label:'Home',         color:'#0EA5FF' },
  { id:'studio',       href:'/dashboard/studio',       icon:'studio',       label:'Studio',       color:'#A78BFA' },
  { id:'brand',        href:'/dashboard/brand',        icon:'brand',        label:'Brand Brain',  color:'#00E5A0' },
  { id:'strategy',     href:'/dashboard/strategy',     icon:'strategy',     label:'Strategy',     color:'#FFB547' },
  { id:'schedule',     href:'/dashboard/schedule',     icon:'schedule',     label:'Schedule',     color:'#FF6B2B' },
  { id:'automate',     href:'/dashboard/automate',     icon:'automate',     label:'Automate',     color:'#FF4D4D' },
  { id:'insights',     href:'/dashboard/insights',     icon:'insights',     label:'Insights',     color:'#38BFFF' },
  { id:'integrations', href:'/dashboard/integrations', icon:'integrations', label:'Integrations', color:'#A78BFA' },
  { id:'agency',       href:'/dashboard/agency',       icon:'agency',       label:'Agency',       color:'#00E5A0' },
]

const QUICK = ['Write a post', 'Build strategy', 'Analyze brand', 'Content ideas']

interface Props { user: any; workspace: any; credits: number; children: React.ReactNode }

export default function DashboardShell({ user, workspace, credits: init, children }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const endRef   = useRef<HTMLDivElement>(null)
  const fileRef  = useRef<HTMLInputElement>(null)

  const [credits, setCredits]   = useState(init)
  const [chatOpen, setChatOpen] = useState(true)
  const [input, setInput]       = useState('')
  const [msgs, setMsgs]         = useState([{ role: 'assistant', content: 'Your brand intelligence is online. What are we creating today?' }])
  const [chatLoading, setChatLoading] = useState(false)
  const [files, setFiles]       = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [ddOpen, setDdOpen]     = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs]     = useState<any[]>([])
  const [unread, setUnread]     = useState(0)
  const [hoverId, setHoverId]   = useState<string | null>(null)

  const activeId   = NAV.find(n => n.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(n.href))?.id ?? 'home'
  const activeItem = NAV.find(n => n.id === activeId)
  const initial    = (user?.full_name?.[0] ?? user?.email?.[0] ?? 'N').toUpperCase()
  const firstName  = user?.full_name?.split(' ')[0] ?? 'there'

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest('[data-dd]')) { setDdOpen(false); setNotifOpen(false) } }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  useEffect(() => {
    if (!workspace?.id) return
    loadNotifs()
    const ch = supabase.channel(`shell-${workspace.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'credits', filter: `workspace_id=eq.${workspace.id}` }, (p: any) => { if (p.new?.balance !== undefined) setCredits(p.new.balance) })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity', filter: `workspace_id=eq.${workspace.id}` }, () => loadNotifs())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [workspace?.id])

  async function loadNotifs() {
    try { const r = await fetch(`/api/notifications?workspace_id=${workspace.id}`); if (r.ok) { const d = await r.json(); setNotifs(d.notifications ?? []); setUnread(d.unread ?? 0) } } catch {}
  }

  async function signOut() { await supabase.auth.signOut(); router.push('/') }

  async function send() {
    if ((!input.trim() && files.length === 0) || chatLoading) return
    const msg = input.trim() || 'Analyze this file.'
    const fs = [...files]
    setInput(''); setFiles([])
    setMsgs(p => [...p, { role: 'user', content: msg }])
    setChatLoading(true)
    try {
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg, workspace_id: workspace.id, history: msgs, files: fs }) })
      const d = await r.json()
      setMsgs(p => [...p, { role: 'assistant', content: d.reply }])
    } catch { setMsgs(p => [...p, { role: 'assistant', content: 'Something went wrong. Try again.' }]) }
    setChatLoading(false)
  }

  async function uploadFile(file: File) {
    setUploading(true)
    const reader = new FileReader()
    reader.onload = e => {
      const b64 = (e.target?.result as string)?.split(',')[1]
      const ft = file.type || 'application/octet-stream'
      setFiles(p => [...p, { name: file.name, type: ft.includes('pdf') ? 'pdf' : ft, data: b64, size: file.size }])
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  /* ── Icon button helper ── */
  const IconBtn = ({ onClick, active = false, activeColor = 'var(--cyan)', children, title }: any) => (
    <button onClick={onClick} title={title}
      style={{ width: 32, height: 32, borderRadius: 8, background: active ? `${activeColor}18` : 'transparent', border: `1px solid ${active ? `${activeColor}33` : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? activeColor : 'rgba(244,240,255,0.28)', cursor: 'pointer', transition: 'all 0.12s', flexShrink: 0 }}
      onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = 'rgba(244,240,255,0.7)' } }}
      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(244,240,255,0.28)' } }}
    >{children}</button>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `52px 1fr ${chatOpen ? 'var(--chat-w)' : '0px'}`, height: '100vh', overflow: 'hidden', background: 'var(--bg)', transition: 'grid-template-columns 0.2s cubic-bezier(0.4,0,0.2,1)', fontFamily: 'var(--sans)' }}>

      {/* ═══════════════════════════════════════
          LEFT RAIL — icon-only nav
      ═══════════════════════════════════════ */}
      <div style={{ background: 'var(--rail)', borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 0 12px', overflow: 'hidden', zIndex: 20 }}>

        {/* Nexa logo at top */}
        <div style={{ marginBottom: 18, flexShrink: 0 }}>
          <NexaLogo size={32} glow />
        </div>

        {/* Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, width: '100%', padding: '0 8px', overflowY: 'auto', scrollbarWidth: 'none' }}>
          {NAV.map(item => {
            const active = activeId === item.id
            return (
              <Link key={item.id} href={item.href} style={{ textDecoration: 'none', display: 'block', position: 'relative' }}
                onMouseEnter={() => setHoverId(item.id)} onMouseLeave={() => setHoverId(null)}>
                <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? `${item.color}18` : 'transparent', color: active ? item.color : 'rgba(244,240,255,0.28)', transition: 'all 0.15s', cursor: 'pointer', position: 'relative', margin: '0 auto' }}
                  onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(244,240,255,0.65)' } }}
                  onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(244,240,255,0.28)' } }}>
                  {/* Active left bar */}
                  {active && <div style={{ position: 'absolute', left: -8, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, borderRadius: '0 3px 3px 0', background: item.color, boxShadow: `0 0 8px ${item.color}` }} />}
                  {(Ic as any)[item.icon]}
                </div>
                {/* Tooltip */}
                {hoverId === item.id && (
                  <div style={{ position: 'absolute', left: 'calc(100% + 12px)', top: '50%', transform: 'translateY(-50%)', background: 'rgba(10,10,20,0.96)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(244,240,255,0.85)', fontSize: 12, fontWeight: 500, padding: '5px 10px', borderRadius: 7, whiteSpace: 'nowrap', zIndex: 9999, pointerEvents: 'none', backdropFilter: 'blur(12px)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', fontFamily: 'var(--sans)' }}>
                    {item.label}
                  </div>
                )}
              </Link>
            )
          })}
        </div>

        {/* Bottom — divider + settings + avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '0 8px', width: '100%', flexShrink: 0 }}>
          <div style={{ height: 1, background: 'var(--line)', width: '100%', margin: '4px 0' }} />

          <Link href="/dashboard/settings" style={{ textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(244,240,255,0.25)', margin: '0 auto', transition: 'all 0.15s', cursor: 'pointer' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(244,240,255,0.65)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(244,240,255,0.25)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              {Ic.settings}
            </div>
          </Link>

          {/* Avatar with dropdown */}
          <div style={{ position: 'relative' }} data-dd>
            <div onClick={() => setDdOpen(o => !o)} style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #0EA5FF, #7B6FFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'var(--display)', border: '2px solid rgba(14,165,255,0.25)', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,255,0.5)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,255,0.25)'}>
              {initial}
            </div>

            {ddOpen && (
              <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, background: 'rgba(11,11,18,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 5, minWidth: 210, zIndex: 500, backdropFilter: 'blur(24px)', boxShadow: '0 24px 64px rgba(0,0,0,0.85)', animation: 'fadeUp 0.15s ease both' }}>
                <div style={{ padding: '10px 12px 10px', borderBottom: '1px solid var(--line)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg, #0EA5FF, #7B6FFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: 'var(--display)', flexShrink: 0 }}>{initial}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', fontFamily: 'var(--display)', lineHeight: 1 }}>{user?.full_name || 'User'}</div>
                    <div style={{ fontSize: 10, color: 'var(--t4)', marginTop: 2 }}>{user?.email}</div>
                  </div>
                </div>
                {[
                  { l: 'Profile',   h: '/dashboard/settings?tab=profile',   i: Ic.user },
                  { l: 'Workspace', h: '/dashboard/settings?tab=workspace', i: Ic.settings },
                  { l: 'Billing',   h: '/dashboard/settings?tab=billing',   i: Ic.billing },
                ].map(x => (
                  <a key={x.l} href={x.h} onClick={() => setDdOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', borderRadius: 8, fontSize: 13, color: 'var(--t3)', textDecoration: 'none', transition: 'all 0.1s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = 'var(--t1)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--t3)' }}>
                    <span style={{ color: 'var(--t4)', display: 'flex' }}>{x.i}</span>{x.l}
                  </a>
                ))}
                <div style={{ height: 1, background: 'var(--line)', margin: '4px 0' }} />
                <button onClick={signOut}
                  style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', borderRadius: 8, fontSize: 13, color: 'var(--red)', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: 'var(--sans)', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--red-dim)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <span style={{ display: 'flex' }}>{Ic.signout}</span>Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          MAIN CANVAS
      ═══════════════════════════════════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)', position: 'relative' }}>

        {/* Top bar — gradient wash like Ofinans reference */}
        <div style={{ height: 'var(--topbar-h)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid var(--line)', flexShrink: 0, background: 'var(--bg2)', zIndex: 10, gap: 12, position: 'relative', overflow: 'hidden' }}>
          {/* Gradient wash — teal left, warm red right, exactly like reference */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 120% 300% at -10% 50%, rgba(0,210,180,0.13) 0%, transparent 50%), radial-gradient(ellipse 80% 300% at 110% 50%, rgba(220,60,20,0.10) 0%, transparent 50%)', pointerEvents: 'none' }} />

          {/* Left: date + active page dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            {activeItem && <div style={{ width: 7, height: 7, borderRadius: '50%', background: activeItem.color, boxShadow: `0 0 8px ${activeItem.color}`, flexShrink: 0 }} />}
            <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(244,240,255,0.5)', letterSpacing: '-0.01em' }}>
              {format(new Date(), 'EEEE, d MMM yyyy')}
            </span>
          </div>

          {/* Center: search */}
          <div style={{ flex: 1, maxWidth: 400, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(244,240,255,0.25)', display: 'flex' }}>{Ic.search}</div>
            <input placeholder="Search anything…"
              style={{ width: '100%', padding: '8px 12px 8px 36px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, color: 'rgba(244,240,255,0.75)', fontSize: 13, fontFamily: 'var(--sans)', outline: 'none', transition: 'border-color 0.15s' }}
              onFocus={e => (e.target.style.borderColor = 'rgba(14,165,255,0.35)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')} />
          </div>

          {/* Right: actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>

            {/* Credits */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', background: 'rgba(14,165,255,0.06)', border: '1px solid rgba(14,165,255,0.18)', borderRadius: 8, marginRight: 2 }}>
              <div className="dot-live" />
              <span style={{ fontFamily: 'var(--display)', fontSize: 12, fontWeight: 700, color: '#0EA5FF' }}>{credits.toLocaleString()}</span>
              <span style={{ fontSize: 10, color: 'rgba(14,165,255,0.45)' }}>cr</span>
            </div>

            <IconBtn title="Voice input">{Ic.mic}</IconBtn>

            {/* Notifications */}
            <div style={{ position: 'relative' }} data-dd>
              <IconBtn onClick={() => { setNotifOpen(o => !o); setDdOpen(false) }} active={notifOpen}>
                <>
                  {Ic.bell}
                  {unread > 0 && <div style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', border: '1.5px solid var(--bg)', boxShadow: '0 0 6px var(--cyan)' }} />}
                </>
              </IconBtn>
              {notifOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'rgba(11,11,18,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 6, width: 300, zIndex: 200, backdropFilter: 'blur(24px)', boxShadow: '0 24px 64px rgba(0,0,0,0.75)', animation: 'fadeUp 0.15s ease both' }}>
                  <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid var(--line)', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', fontFamily: 'var(--display)' }}>Notifications</span>
                    {unread > 0 && <span style={{ fontSize: 10, color: 'var(--cyan)', fontWeight: 600 }}>{unread} new</span>}
                  </div>
                  {notifs.length > 0 ? notifs.slice(0, 6).map((n: any) => (
                    <div key={n.id} style={{ display: 'flex', gap: 9, padding: '8px 12px', borderRadius: 8 }}>
                      <div className="dot-live" style={{ marginTop: 4 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.4 }}>{n.title}</div>
                        <div style={{ fontSize: 10, color: 'var(--t5)', marginTop: 2 }}>{n.created_at ? format(parseISO(n.created_at), 'MMM d, h:mm a') : ''}</div>
                      </div>
                    </div>
                  )) : <div style={{ fontSize: 12, color: 'var(--t5)', textAlign: 'center', padding: '20px 0' }}>You're all caught up</div>}
                </div>
              )}
            </div>

            <IconBtn onClick={() => setChatOpen(o => !o)} active={chatOpen} activeColor="var(--cyan)" title="Nexa AI">
              {Ic.chat}
            </IconBtn>

            {/* User pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px 5px 5px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, cursor: 'pointer', marginLeft: 2, transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.09)'}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg,#0EA5FF,#7B6FFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', fontFamily: 'var(--display)', flexShrink: 0 }}>{initial}</div>
              <div style={{ lineHeight: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(244,240,255,0.75)' }}>{firstName}</div>
                <div style={{ fontSize: 9, color: 'rgba(244,240,255,0.28)', marginTop: 2 }}>{workspace?.plan || 'spark'}</div>
              </div>
              <span style={{ color: 'rgba(244,240,255,0.2)', display: 'flex' }}>{Ic.chevron}</span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </div>

      {/* ═══════════════════════════════════════
          RIGHT CHAT PANEL — Nexa AI
      ═══════════════════════════════════════ */}
      {chatOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--line)', background: 'var(--rail)', overflow: 'hidden' }}>

          {/* Header — real logo here */}
          <div style={{ height: 'var(--topbar-h)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <NexaLogo size={30} glow />
              <div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, color: 'var(--t1)', lineHeight: 1 }}>Nexa AI</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                  <div className="dot-green" style={{ width: 5, height: 5 }} />
                  <span style={{ fontSize: 10, color: 'rgba(244,240,255,0.35)' }}>Online · brand-aware</span>
                </div>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)}
              style={{ width: 26, height: 26, borderRadius: 7, background: 'transparent', border: 'none', color: 'rgba(244,240,255,0.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(244,240,255,0.7)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(244,240,255,0.25)' }}>
              {Ic.close}
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12, scrollbarWidth: 'none' }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, flexDirection: m.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start', animation: 'fadeUp 0.2s ease both' }}>
                <div style={{ width: 24, height: 24, flexShrink: 0, borderRadius: 7, overflow: 'hidden' }}>
                  {m.role === 'assistant'
                    ? <NexaLogo size={24} glow />
                    : <div style={{ width: 24, height: 24, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'rgba(244,240,255,0.45)', fontFamily: 'var(--display)' }}>{initial}</div>}
                </div>
                <div className={m.role === 'assistant' ? 'chat-ai' : 'chat-user'} style={{ maxWidth: '84%' }}>
                  {m.content}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ width: 24, height: 24, borderRadius: 7, overflow: 'hidden', flexShrink: 0 }}>
                  <NexaLogo size={24} glow />
                </div>
                <div className="chat-ai" style={{ display: 'flex', gap: 4, alignItems: 'center', minHeight: 36 }}>
                  <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick prompts */}
          <div style={{ padding: '8px 12px', borderTop: '1px solid var(--line)', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {QUICK.map(q => (
              <button key={q} onClick={() => setInput(q)}
                style={{ padding: '4px 10px', fontSize: 10.5, fontWeight: 500, color: 'rgba(244,240,255,0.35)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 100, cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all 0.12s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(244,240,255,0.75)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.14)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(244,240,255,0.35)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)' }}>
                {q}
              </button>
            ))}
          </div>

          {/* Attached files */}
          {files.length > 0 && (
            <div style={{ padding: '5px 12px', borderTop: '1px solid var(--line)', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {files.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'var(--cyan-dim)', border: '1px solid var(--cyan-line)', borderRadius: 6, fontSize: 10 }}>
                  <span style={{ color: 'var(--cyan)', display: 'flex' }}>{Ic.clip}</span>
                  <span style={{ color: 'rgba(244,240,255,0.6)', maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                  <button onClick={() => setFiles(p => p.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'rgba(244,240,255,0.3)', cursor: 'pointer', padding: 0, display: 'flex' }}>{Ic.close}</button>
                </div>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--line)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, padding: '8px 12px', transition: 'border-color 0.15s' }}
              onFocusCapture={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,255,0.3)'}
              onBlurCapture={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.09)'}>
              <button onClick={() => fileRef.current?.click()}
                style={{ background: 'none', border: 'none', color: 'rgba(244,240,255,0.25)', cursor: 'pointer', display: 'flex', padding: 0, flexShrink: 0, transition: 'color 0.12s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--cyan)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(244,240,255,0.25)'}>
                {Ic.clip}
              </button>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])} />
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Message Nexa…"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--t1)', fontFamily: 'var(--sans)' }} />
              <button onClick={send} disabled={(!input.trim() && files.length === 0) || chatLoading}
                style={{ width: 28, height: 28, borderRadius: 8, background: (input.trim() || files.length > 0) ? 'var(--cyan)' : 'rgba(255,255,255,0.05)', border: `1px solid ${(input.trim() || files.length > 0) ? 'transparent' : 'rgba(255,255,255,0.08)'}`, cursor: (input.trim() || files.length > 0) ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', color: (input.trim() || files.length > 0) ? '#000' : 'rgba(244,240,255,0.25)', transition: 'all 0.12s', flexShrink: 0 }}>
                {Ic.send}
              </button>
            </div>
            <p style={{ fontSize: 9.5, color: 'rgba(244,240,255,0.18)', textAlign: 'center', marginTop: 6 }}>
              {uploading ? 'Reading file…' : '↵ send  ·  attach files to teach Nexa your brand'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
