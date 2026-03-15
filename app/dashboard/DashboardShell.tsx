'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'

// ── Icons ──────────────────────────────────────────────────
const I = {
  home:         <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  studio:       <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  brand:        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  strategy:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  schedule:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  automate:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>,
  insights:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 21H3"/><path d="M3 10l5 5 4-6 5 4 4-8"/></svg>,
  integrations: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="9" height="9" rx="2"/><rect x="13" y="2" width="9" height="9" rx="2"/><rect x="2" y="13" width="9" height="9" rx="2"/><path d="M17.5 13v8M13 17.5h8"/></svg>,
  agency:       <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  settings:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  bell:         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  chat:         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  send:         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  close:        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  chevron:      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>,
  user:         <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  billing:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  signout:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  clip:         <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
}

const NAV = [
  { id: 'home',         href: '/dashboard',              label: 'Home',         icon: I.home,         group: 'main' },
  { id: 'studio',       href: '/dashboard/studio',       label: 'Studio',       icon: I.studio,       group: 'main' },
  { id: 'brand',        href: '/dashboard/brand',        label: 'Brand Brain',  icon: I.brand,        group: 'main' },
  { id: 'strategy',     href: '/dashboard/strategy',     label: 'Strategy',     icon: I.strategy,     group: 'main' },
  { id: 'schedule',     href: '/dashboard/schedule',     label: 'Schedule',     icon: I.schedule,     group: 'main' },
  { id: 'automate',     href: '/dashboard/automate',     label: 'Automate',     icon: I.automate,     group: 'main' },
  { id: 'insights',     href: '/dashboard/insights',     label: 'Insights',     icon: I.insights,     group: 'main' },
  { id: 'integrations', href: '/dashboard/integrations', label: 'Integrations', icon: I.integrations, group: 'more' },
  { id: 'agency',       href: '/dashboard/agency',       label: 'Agency',       icon: I.agency,       group: 'more' },
]

interface Props { user: any; workspace: any; credits: number; children: React.ReactNode }

export default function DashboardShell({ user, workspace, credits: initialCredits, children }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatFileRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const [credits, setCredits] = useState(initialCredits)
  const [chatOpen, setChatOpen] = useState(true)
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState([{ role: 'assistant', content: `I'm Nexa AI — your brand co-pilot. What are we creating today?` }])
  const [chatLoading, setChatLoading] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<any[]>([])
  const [uploadingFile, setUploadingFile] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const activeId = NAV.find(n => n.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(n.href))?.id ?? 'home'
  const firstName = user?.full_name?.split(' ')[0] ?? 'there'
  const initial = (user?.full_name?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const t = e.target as HTMLElement
      if (!t.closest('[data-dd]')) { setDropdownOpen(false); setNotifOpen(false) }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!workspace?.id) return
    loadNotifs()
    const ch = supabase.channel(`shell-${workspace.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'credits', filter: `workspace_id=eq.${workspace.id}` }, (p: any) => {
        if (p.new?.balance !== undefined) setCredits(p.new.balance)
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity', filter: `workspace_id=eq.${workspace.id}` }, () => loadNotifs())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [workspace?.id])

  async function loadNotifs() {
    try {
      const res = await fetch(`/api/notifications?workspace_id=${workspace.id}`)
      if (res.ok) { const d = await res.json(); setNotifications(d.notifications ?? []); setUnreadCount(d.unread ?? 0) }
    } catch {}
  }

  async function handleSignOut() { await supabase.auth.signOut(); router.push('/') }

  async function sendMessage() {
    if ((!chatInput.trim() && attachedFiles.length === 0) || chatLoading) return
    const msg = chatInput.trim() || 'Please analyze this file.'
    const files = [...attachedFiles]
    setChatInput(''); setAttachedFiles([])
    setMessages(p => [...p, { role: 'user', content: msg }])
    setChatLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, workspace_id: workspace.id, history: messages, files }),
      })
      const d = await res.json()
      setMessages(p => [...p, { role: 'assistant', content: d.reply }])
    } catch {
      setMessages(p => [...p, { role: 'assistant', content: 'Something went wrong. Try again.' }])
    }
    setChatLoading(false)
  }

  async function handleFileUpload(file: File) {
    setUploadingFile(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      const b64 = (e.target?.result as string)?.split(',')[1]
      const ft = file.type || 'application/octet-stream'
      setAttachedFiles(p => [...p, { name: file.name, type: ft.includes('pdf') ? 'pdf' : ft, data: b64, size: file.size }])
      setUploadingFile(false)
    }
    reader.readAsDataURL(file)
  }

  const sideW = sidebarCollapsed ? 56 : 220

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `${sideW}px 1fr ${chatOpen ? '320px' : '0px'}`,
      gridTemplateRows: '1fr',
      height: '100vh',
      overflow: 'hidden',
      transition: 'grid-template-columns 0.2s cubic-bezier(0.4,0,0.2,1)',
      background: 'var(--bg)',
    }}>

      {/* ══ SIDEBAR ══════════════════════════════════════════ */}
      <div style={{
        gridColumn: '1', gridRow: '1',
        display: 'flex', flexDirection: 'column',
        background: '#08080C',
        borderRight: '1px solid var(--line)',
        overflow: 'hidden',
        position: 'relative',
        transition: 'width 0.2s cubic-bezier(0.4,0,0.2,1)',
      }}>

        {/* Logo + workspace */}
        <div style={{ padding: sidebarCollapsed ? '16px 12px' : '16px 14px', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }} onClick={() => setSidebarCollapsed(c => !c)}>
            <div style={{ width: 28, height: 28, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--line2)' }}>
              <img src="data:image/png;base64,/9j/4AAQSkZJRgABAQAASABIAAD/4QBMRXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAB9KADAAQAAAABAAAB9AAAAAD/7QA4UGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAAA4QklNBCUAAAAAABDUHYzZjwCyBOmACZjs+EJ+" alt="N" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            {!sidebarCollapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--t1)', lineHeight: 1 }}>Nexa</div>
                <div style={{ fontSize: 10, color: 'var(--t5)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{workspace?.name || 'Workspace'}</div>
              </div>
            )}
          </div>
        </div>

        {/* Nav groups */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px', scrollbarWidth: 'none' }}>

          {/* Main nav */}
          {NAV.filter(n => n.group === 'main').map(item => {
            const active = activeId === item.id
            return (
              <Link key={item.id} href={item.href}
                title={sidebarCollapsed ? item.label : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: sidebarCollapsed ? '9px 10px' : '8px 10px',
                  borderRadius: 8,
                  marginBottom: 1,
                  color: active ? 'var(--t1)' : 'var(--t4)',
                  background: active ? 'var(--glass2)' : 'transparent',
                  textDecoration: 'none',
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  transition: 'all 0.12s',
                  position: 'relative',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--glass)' }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                {active && <div style={{ position: 'absolute', left: 0, top: '20%', width: 2, height: '60%', borderRadius: 2, background: 'var(--cyan)' }} />}
                <span style={{ color: active ? 'var(--cyan)' : 'inherit', flexShrink: 0, display: 'flex' }}>{item.icon}</span>
                {!sidebarCollapsed && <span style={{ lineHeight: 1 }}>{item.label}</span>}
              </Link>
            )
          })}

          {/* Separator */}
          <div style={{ height: 1, background: 'var(--line)', margin: '8px 4px' }} />

          {/* More nav */}
          {NAV.filter(n => n.group === 'more').map(item => {
            const active = activeId === item.id
            return (
              <Link key={item.id} href={item.href}
                title={sidebarCollapsed ? item.label : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: sidebarCollapsed ? '9px 10px' : '8px 10px',
                  borderRadius: 8, marginBottom: 1,
                  color: active ? 'var(--t1)' : 'var(--t4)',
                  background: active ? 'var(--glass2)' : 'transparent',
                  textDecoration: 'none',
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  transition: 'all 0.12s',
                  position: 'relative',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--glass)' }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                {active && <div style={{ position: 'absolute', left: 0, top: '20%', width: 2, height: '60%', borderRadius: 2, background: 'var(--cyan)' }} />}
                <span style={{ color: active ? 'var(--cyan)' : 'inherit', flexShrink: 0, display: 'flex' }}>{item.icon}</span>
                {!sidebarCollapsed && <span style={{ lineHeight: 1 }}>{item.label}</span>}
              </Link>
            )
          })}
        </div>

        {/* Bottom: credits + user */}
        <div style={{ padding: '8px', borderTop: '1px solid var(--line)', flexShrink: 0 }}>

          {/* Credits pill */}
          {!sidebarCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 10px', borderRadius: 8, background: 'var(--glass)', marginBottom: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', animation: 'pulse-dot 2s ease-in-out infinite', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t2)' }}>{credits.toLocaleString()} credits</div>
                <div style={{ fontSize: 9, color: 'var(--t5)' }}>{workspace?.plan || 'spark'} plan</div>
              </div>
              <Link href="/dashboard/settings?tab=billing" style={{ fontSize: 9, fontWeight: 700, color: 'var(--cyan)', textDecoration: 'none', background: 'rgba(0,170,255,0.08)', padding: '2px 7px', borderRadius: 4 }}>Top up</Link>
            </div>
          )}

          {/* User row */}
          <div style={{ position: 'relative' }} data-dd>
            <div onClick={() => setDropdownOpen(o => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.12s', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--glass)'}
              onMouseLeave={e => { if (!dropdownOpen) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(0,170,255,0.1)', border: '1px solid var(--cline2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--cyan)', flexShrink: 0 }}>
                {initial}
              </div>
              {!sidebarCollapsed && (
                <>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name || 'User'}</div>
                    <div style={{ fontSize: 10, color: 'var(--t5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
                  </div>
                  <span style={{ color: 'var(--t5)', display: 'flex' }}>{I.chevron}</span>
                </>
              )}
            </div>

            {dropdownOpen && (
              <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, background: 'rgba(12,12,18,0.98)', border: '1px solid var(--line2)', borderRadius: 12, padding: 5, minWidth: 200, zIndex: 300, backdropFilter: 'blur(24px)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
                <div style={{ padding: '10px 12px 10px', borderBottom: '1px solid var(--line)', marginBottom: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>{user?.full_name || 'User'}</div>
                  <div style={{ fontSize: 10, color: 'var(--t4)', marginTop: 1 }}>{user?.email}</div>
                </div>
                {[
                  { label: 'Profile', href: '/dashboard/settings?tab=profile', icon: I.user },
                  { label: 'Workspace', href: '/dashboard/settings?tab=workspace', icon: I.settings },
                  { label: 'Billing', href: '/dashboard/settings?tab=billing', icon: I.billing },
                ].map(item => (
                  <a key={item.label} href={item.href} onClick={() => setDropdownOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', borderRadius: 7, fontSize: 13, color: 'var(--t3)', textDecoration: 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--glass2)'; (e.currentTarget as HTMLElement).style.color = 'var(--t1)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--t3)' }}
                  >
                    <span style={{ color: 'var(--t4)', display: 'flex' }}>{item.icon}</span>{item.label}
                  </a>
                ))}
                <div style={{ height: 1, background: 'var(--line)', margin: '4px 0' }} />
                <button onClick={handleSignOut}
                  style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', borderRadius: 7, fontSize: 13, color: 'var(--red)', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: 'var(--sans)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,107,107,0.07)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ display: 'flex' }}>{I.signout}</span>Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ MAIN CANVAS ══════════════════════════════════════ */}
      <div style={{ gridColumn: '2', gridRow: '1', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>

        {/* Topbar */}
        <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid var(--line)', flexShrink: 0, background: 'rgba(8,8,12,0.8)', backdropFilter: 'blur(20px)' }}>

          {/* Page title */}
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t2)' }}>
            {NAV.find(n => n.id === activeId)?.label || 'Dashboard'}
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

            {/* Notifications */}
            <div style={{ position: 'relative' }} data-dd>
              <button onClick={() => { setNotifOpen(o => !o); setDropdownOpen(false) }}
                style={{ width: 32, height: 32, borderRadius: 8, background: notifOpen ? 'var(--glass2)' : 'transparent', border: `1px solid ${notifOpen ? 'var(--line2)' : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t4)', cursor: 'pointer', position: 'relative', transition: 'all 0.12s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--glass)'; (e.currentTarget as HTMLElement).style.color = 'var(--t2)' }}
                onMouseLeave={e => { if (!notifOpen) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--t4)' } }}
              >
                {I.bell}
                {unreadCount > 0 && <div style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: '50%', background: 'var(--cyan)', border: '2px solid var(--bg)' }} />}
              </button>
              {notifOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'rgba(12,12,18,0.98)', border: '1px solid var(--line2)', borderRadius: 12, padding: 6, width: 300, zIndex: 200, backdropFilter: 'blur(24px)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
                  <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid var(--line)', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>Notifications</span>
                    <span style={{ fontSize: 10, color: 'var(--t5)' }}>Recent activity</span>
                  </div>
                  {notifications.length > 0 ? notifications.slice(0, 6).map((n: any) => (
                    <div key={n.id} style={{ display: 'flex', gap: 9, padding: '8px 12px', borderRadius: 7 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--cyan)', flexShrink: 0, marginTop: 5 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.4 }}>{n.title}</div>
                        <div style={{ fontSize: 10, color: 'var(--t5)', marginTop: 1 }}>{n.created_at ? format(parseISO(n.created_at), 'MMM d, h:mm a') : ''}</div>
                      </div>
                    </div>
                  )) : <div style={{ fontSize: 12, color: 'var(--t5)', textAlign: 'center', padding: '20px 0' }}>No recent activity</div>}
                </div>
              )}
            </div>

            {/* Chat toggle */}
            <button onClick={() => setChatOpen(o => !o)}
              style={{ width: 32, height: 32, borderRadius: 8, background: chatOpen ? 'rgba(0,170,255,0.1)' : 'transparent', border: `1px solid ${chatOpen ? 'var(--cline2)' : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: chatOpen ? 'var(--cyan)' : 'var(--t4)', cursor: 'pointer', transition: 'all 0.12s' }}
              onMouseEnter={e => { if (!chatOpen) { (e.currentTarget as HTMLElement).style.background = 'var(--glass)'; (e.currentTarget as HTMLElement).style.color = 'var(--t2)' } }}
              onMouseLeave={e => { if (!chatOpen) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--t4)' } }}
            >
              {I.chat}
            </button>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
          {children}
        </div>
      </div>

      {/* ══ CHAT PANEL ═══════════════════════════════════════ */}
      {chatOpen && (
        <div style={{
          gridColumn: '3', gridRow: '1',
          display: 'flex', flexDirection: 'column',
          borderLeft: '1px solid var(--line)',
          background: '#08080C',
          overflow: 'hidden',
        }}>
          {/* Chat header */}
          <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, overflow: 'hidden', border: '1px solid var(--cline2)', flexShrink: 0 }}>
                <img src="data:image/png;base64,/9j/4AAQSkZJRgABAQAASABIAAD/4QBMRXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAB9KADAAQAAAABAAAB9AAAAAD/7QA4UGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAAA4QklNBCUAAAAAABDUHYzZjwCyBOmACZjs+EJ+" alt="N" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', fontFamily: 'var(--display)' }}>Nexa AI</div>
                <div style={{ fontSize: 10, color: 'var(--t4)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00e87a' }} />
                  Online
                </div>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)}
              style={{ width: 26, height: 26, borderRadius: 6, background: 'transparent', border: 'none', color: 'var(--t5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--glass)'; (e.currentTarget as HTMLElement).style.color = 'var(--t2)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--t5)' }}
            >
              {I.close}
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 12, scrollbarWidth: 'none' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, overflow: 'hidden', background: msg.role === 'assistant' ? 'rgba(0,170,255,0.1)' : 'var(--glass2)', border: `1px solid ${msg.role === 'assistant' ? 'var(--cline2)' : 'var(--line2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {msg.role === 'assistant'
                    ? <img src="data:image/png;base64,/9j/4AAQSkZJRgABAQAASABIAAD/4QBMRXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAB9KADAAQAAAABAAAB9AAAAAD/7QA4UGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAAA4QklNBCUAAAAAABDUHYzZjwCyBOmACZjs+EJ+" alt="N" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--t4)' }}>{initial}</span>
                  }
                </div>
                <div style={{ maxWidth: '80%', padding: '9px 11px', borderRadius: msg.role === 'assistant' ? '2px 10px 10px 10px' : '10px 2px 10px 10px', background: msg.role === 'assistant' ? 'var(--glass)' : 'rgba(0,140,255,0.1)', border: `1px solid ${msg.role === 'assistant' ? 'var(--line)' : 'var(--cline2)'}`, fontSize: 12.5, lineHeight: 1.6, color: msg.role === 'assistant' ? 'var(--t2)' : 'var(--t1)', whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--cline2)', flexShrink: 0 }}>
                  <img src="data:image/png;base64,/9j/4AAQSkZJRgABAQAASABIAAD/4QBMRXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAB9KADAAQAAAABAAAB9AAAAAD/7QA4UGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAAA4QklNBCUAAAAAABDUHYzZjwCyBOmACZjs+EJ+" alt="N" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '9px 12px', background: 'var(--glass)', border: '1px solid var(--line)', borderRadius: '2px 10px 10px 10px', display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--t4)', animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick prompts */}
          <div style={{ padding: '6px 10px', display: 'flex', gap: 4, flexWrap: 'wrap', borderTop: '1px solid var(--line)' }}>
            {['Write a post', 'Build strategy', 'Analyze my brand', 'What to create today?'].map(s => (
              <button key={s} onClick={() => setChatInput(s)}
                style={{ padding: '4px 9px', fontSize: 10.5, fontWeight: 500, color: 'var(--t4)', background: 'var(--glass)', border: '1px solid var(--line)', borderRadius: 100, cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all 0.12s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--t2)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--line2)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--t4)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)' }}
              >{s}</button>
            ))}
          </div>

          {/* File attachments preview */}
          {attachedFiles.length > 0 && (
            <div style={{ padding: '5px 10px', borderTop: '1px solid var(--line)', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {attachedFiles.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'rgba(0,170,255,0.08)', border: '1px solid var(--cline2)', borderRadius: 6, fontSize: 10 }}>
                  <span style={{ color: 'var(--cyan)', display: 'flex' }}>{I.clip}</span>
                  <span style={{ color: 'var(--t3)', maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                  <button onClick={() => setAttachedFiles(p => p.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--t5)', cursor: 'pointer', fontSize: 11, padding: 0, display: 'flex' }}>{I.close}</button>
                </div>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '8px 10px', borderTop: '1px solid var(--line)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 10, padding: '7px 10px', transition: 'border-color 0.12s' }}
              onFocusCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--cline2)' }}
              onBlurCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line2)' }}
            >
              <button onClick={() => chatFileRef.current?.click()}
                style={{ background: 'none', border: 'none', color: 'var(--t5)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, flexShrink: 0, transition: 'color 0.12s' }}
                title="Attach file — Nexa will learn from it"
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--cyan)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--t5)'}
              >
                {I.clip}
              </button>
              <input ref={chatFileRef} type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={attachedFiles.length > 0 ? 'Add a message...' : 'Message Nexa...'}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12.5, color: 'var(--t1)', fontFamily: 'var(--sans)' }}
              />
              <button onClick={sendMessage}
                disabled={(!chatInput.trim() && attachedFiles.length === 0) || chatLoading}
                style={{ width: 26, height: 26, borderRadius: 7, background: (chatInput.trim() || attachedFiles.length > 0) ? 'var(--cyan)' : 'var(--glass2)', border: `1px solid ${(chatInput.trim() || attachedFiles.length > 0) ? 'transparent' : 'var(--line)'}`, cursor: (chatInput.trim() || attachedFiles.length > 0) ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', color: (chatInput.trim() || attachedFiles.length > 0) ? '#000' : 'var(--t5)', transition: 'all 0.12s', flexShrink: 0 }}>
                {I.send}
              </button>
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--t5)', textAlign: 'center', marginTop: 4 }}>
              {uploadingFile ? 'Reading file...' : '↵ send · 📎 teach Nexa your brand'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
