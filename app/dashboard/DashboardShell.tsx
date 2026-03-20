'use client'
import NexaTour, { useTourState } from './NexaTour'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { marked } from 'marked'

const T = {
  bg:         '#0C0C0C',
  surface:    '#141414',
  surface2:   '#1A1A1A',
  border:     'rgba(255,255,255,0.10)',
  cyan:       '#00AAFF',
  cyanDim:    'rgba(0,170,255,0.12)',
  cyanBorder: 'rgba(0,170,255,0.25)',
  text:       '#FFFFFF',
  textMuted:  'rgba(255,255,255,0.42)',
  textDim:    'rgba(255,255,255,0.20)',
}

function NexaLogo({ size = 32 }: { size?: number }) {
  return (
    <div style={{ width:size, height:size, borderRadius:Math.round(size*0.26), overflow:'hidden', flexShrink:0, border:'1px solid rgba(255,255,255,0.15)' }}>
      <img src="/favicon.png" alt="Nexa" width={size} height={size} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
    </div>
  )
}

/* ── PNG icon component — white icon on transparent bg ── */
function NavIcon({ src, size = 18 }: { src: string; size?: number }) {
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      style={{
        width: size, height: size,
        objectFit: 'contain',
        display: 'block',
        filter: 'brightness(0) invert(1)',
        opacity: 'inherit',
      }}
    />
  )
}

const NAV = [
  { id:'home',         href:'/dashboard',              icon:'/icons/home.png',         label:'Home',         desc:'Morning brief + agents'   },
  { id:'studio',       href:'/dashboard/studio',       icon:'/icons/studio.png',       label:'Studio',       desc:'Create in your voice'     },
  { id:'brand',        href:'/dashboard/brand',        icon:'/icons/brand.png',        label:'Brand Brain',  desc:'Your brand DNA'           },
  { id:'strategy',     href:'/dashboard/strategy',     icon:'/icons/strategy.png',     label:'Strategy',     desc:'30-day content plan'      },
  { id:'schedule',     href:'/dashboard/schedule',     icon:'/icons/schedule.png',     label:'Schedule',     desc:'Publish everywhere'       },
  { id:'automate',     href:'/dashboard/automate',     icon:'/icons/automate.png',     label:'Automate',     desc:'Sequences & flows'        },
  { id:'amplify',      href:'/dashboard/amplify',      icon:'/icons/amplify.png',      label:'Amplify',      desc:'Run Meta Ads'             },
  { id:'integrations', href:'/dashboard/integrations', icon:'/icons/integrations.png', label:'Integrations', desc:'Connect your tools'       },
  { id:'insights',     href:'/dashboard/insights',     icon:'/icons/insights.png',     label:'Insights',     desc:"What's working"           },
  { id:'agency',       href:'/dashboard/agency',       icon:'/icons/agency.png',       label:'Agency',       desc:'Client workspaces'        },
]

const QUICK = ['Write a post', 'Build strategy', 'Analyze brand', 'Content ideas']

/* ── Inline SVG icons for UI (non-nav) ── */
const Ic = {
  settings: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  bell:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 6 3 8 3 8H3s3-2 3-8"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  chat:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/><path d="M8 10h8M8 14h5" opacity=".5"/></svg>,
  send:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>,
  close:    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  chevron:  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>,
  search:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>,
  user:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"/></svg>,
  billing:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="2" y="5" width="20" height="15" rx="2"/><path d="M2 10h20"/><path d="M6 15h4" opacity=".5"/></svg>,
  signout:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" opacity=".5"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>,
  clip:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
}

interface Props { user: any; workspace: any; credits: number; children: React.ReactNode }

export default function DashboardShell({ user, workspace, credits: init, children }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const endRef   = useRef<HTMLDivElement>(null)
  const fileRef  = useRef<HTMLInputElement>(null)

  const { show: showTour, dismiss: dismissTour } = useTourState(workspace?.id)
  const [credits,               setCredits]               = useState(init)
  const [chatOpen,              setChatOpen]              = useState(true)
  const [isNarrow,              setIsNarrow]              = useState(false)
  const [input,                 setInput]                 = useState('')
  const [msgs,                  setMsgs]                  = useState([{ role:'assistant', content:'Your brand intelligence is online. What are we creating today?' }])
  const [chatLoading,           setChatLoading]           = useState(false)
  const [files,                 setFiles]                 = useState<any[]>([])
  const [uploading,             setUploading]             = useState(false)
  const [pillOpen,              setPillOpen]              = useState(false)
  const [notifOpen,             setNotifOpen]             = useState(false)
  const [notifs,                setNotifs]                = useState<any[]>([])
  const [unread,                setUnread]                = useState(0)
  const [hoverId,               setHoverId]               = useState<string|null>(null)
  const [isAgency,              setIsAgency]              = useState(false)
  const [clientWorkspaces,      setClientWorkspaces]      = useState<any[]>([])
  const [showWorkspaceSwitcher, setShowWorkspaceSwitcher] = useState(false)
  const [activeWorkspaceName,   setActiveWorkspaceName]   = useState('My workspace')
  const [ownWorkspaceId,        setOwnWorkspaceId]        = useState<string|null>(null)
  const [searchQ,               setSearchQ]               = useState('')
  const [searchOpen,            setSearchOpen]            = useState(false)

  const activeId  = NAV.find(n => n.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(n.href))?.id ?? 'home'
  const initial   = (user?.full_name?.[0] ?? user?.email?.[0] ?? 'N').toUpperCase()
  const firstName = user?.full_name?.split(' ')[0] ?? 'there'

  const trialDaysLeft: number | null = (() => {
    if (workspace?.plan_status !== 'trialing') return null
    const created  = new Date(workspace.created_at)
    const trialEnd = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000)
    const diff     = trialEnd.getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)))
  })()

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-dd]')) { setPillOpen(false); setNotifOpen(false); setShowWorkspaceSwitcher(false) }
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

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
    if (workspace?.plan === 'agency' || workspace?.is_agency) {
      setIsAgency(true)
      setOwnWorkspaceId(workspace.id)
      supabase.from('client_workspaces').select('client_workspace_id, client_name').eq('agency_workspace_id', workspace.id)
        .then(({ data }) => setClientWorkspaces(data || []))
    }
  }, [workspace?.id])

  useEffect(() => {
    if (!workspace?.id) return
    loadNotifs()
    const ch = supabase.channel(`shell-${workspace.id}`)
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'credits', filter:`workspace_id=eq.${workspace.id}` }, (p:any) => {
        if (p.new?.balance !== undefined) setCredits(p.new.balance)
      })
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'activity', filter:`workspace_id=eq.${workspace.id}` }, () => loadNotifs())
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'notifications', filter:`workspace_id=eq.${workspace.id}` }, () => loadNotifs())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [workspace?.id])

  async function loadNotifs() {
    try {
      const r = await fetch(`/api/notifications?workspace_id=${workspace.id}`, { credentials:'include' })
      if (r.ok) { const d = await r.json(); setNotifs(d.notifications??[]); setUnread(d.unread??0) }
    } catch {}
  }

  async function signOut() { await supabase.auth.signOut(); router.push('/') }

  async function switchWorkspace(id: string, name: string) {
    setShowWorkspaceSwitcher(false); setActiveWorkspaceName(name)
    try {
      await fetch('/api/agency', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ action:'switch_workspace', workspace_id:id }) })
      router.push('/dashboard')
    } catch {}
  }

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

  return (
    <div style={{ display:'grid', gridTemplateColumns:`60px 1fr ${chatOpen && !isNarrow ? '340px' : '0px'}`, height:'100vh', overflow:'hidden', background:T.bg, transition:'grid-template-columns 0.22s cubic-bezier(0.4,0,0.2,1)', fontFamily:'var(--sans)' }}>

      <style dangerouslySetInnerHTML={{ __html: `
        .ns { scrollbar-width:none; }
        .ns::-webkit-scrollbar { display:none; }
        .nav-btn { transition:all 0.16s ease; }
        .nav-btn:hover { background:rgba(255,255,255,0.07) !important; }
        .nav-btn:hover img { opacity:0.85 !important; filter:brightness(0) invert(1) !important; }
        .nexa-msg-ai { font-size:13.5px; color:rgba(255,255,255,0.82); line-height:1.8; letter-spacing:-0.01em; }
        .nexa-msg-ai p { margin:0 0 10px; }
        .nexa-msg-ai p:last-child { margin-bottom:0; }
        .nexa-msg-ai strong { color:rgba(255,255,255,0.95); font-weight:700; }
        .nexa-msg-ai code { background:rgba(0,170,255,0.1); border:1px solid rgba(0,170,255,0.2); border-radius:5px; padding:1px 6px; font-size:12px; color:#00AAFF; font-family:monospace; }
        .nexa-msg-ai ul,.nexa-msg-ai ol { margin:6px 0 10px 16px; display:flex; flex-direction:column; gap:4px; }
        .nexa-msg-ai li { color:rgba(255,255,255,0.75); }
        .nexa-msg-ai a { color:#00AAFF; text-decoration:underline; }
        .nexa-msg-ai hr { border:none; border-top:1px solid rgba(255,255,255,0.08); margin:12px 0; }
        .nexa-msg-ai h1,.nexa-msg-ai h2,.nexa-msg-ai h3 { color:rgba(255,255,255,0.95); font-weight:700; margin:12px 0 6px; }
        @keyframes pulse-dot { 0%,80%,100%{opacity:0.3;transform:scale(0.8)} 40%{opacity:1;transform:scale(1)} }
        @keyframes msgIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pageUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      ` }} />

      {/* ── SIDEBAR ── */}
      <div style={{ background:T.surface, borderRight:`1px solid ${T.border}`, display:'flex', flexDirection:'column', alignItems:'center', padding:'16px 0', overflow:'hidden', zIndex:20 }}>

        <div style={{ marginBottom:24, flexShrink:0 }}><NexaLogo size={32}/></div>

        <div className="ns" style={{ display:'flex', flexDirection:'column', gap:2, flex:1, width:'100%', padding:'0 10px', overflowY:'auto' }}>
          {NAV.map(item => {
            const active = activeId === item.id
            return (
              <Link key={item.id} href={item.href} data-tour={item.id}
                style={{ textDecoration:'none', display:'block', position:'relative' }}
                onMouseEnter={() => setHoverId(item.id)}
                onMouseLeave={() => setHoverId(null)}>

                <div className={active ? '' : 'nav-btn'} style={{
                  width:42, height:42, borderRadius:12,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background: active ? T.cyanDim : 'transparent',
                  border: active ? `1px solid ${T.cyanBorder}` : '1px solid transparent',
                  cursor:'pointer', margin:'0 auto', position:'relative',
                  boxShadow: active ? '0 0 16px rgba(0,170,255,0.15)' : 'none',
                }}>
                  {/* Active left bar */}
                  {active && (
                    <div style={{ position:'absolute', left:-11, top:'50%', transform:'translateY(-50%)', width:3, height:20, borderRadius:'0 3px 3px 0', background:T.cyan, boxShadow:`0 0 8px ${T.cyan}` }}/>
                  )}
                  <img
                    src={item.icon}
                    alt={item.label}
                    width={18}
                    height={18}
                    style={{
                      width:18, height:18,
                      objectFit:'contain',
                      display:'block',
                      filter: active
                        ? 'brightness(0) saturate(100%) invert(48%) sepia(98%) saturate(2000%) hue-rotate(185deg) brightness(105%)'
                        : 'brightness(0) invert(1)',
                      opacity: active ? 1 : 0.3,
                      transition:'all 0.16s ease',
                    }}
                  />
                </div>

                {/* Tooltip */}
                {hoverId === item.id && (
                  <div style={{ position:'absolute', left:'calc(100% + 14px)', top:'50%', transform:'translateY(-50%)', background:T.surface2, border:`1px solid ${T.border}`, borderRadius:10, whiteSpace:'nowrap', zIndex:9999, pointerEvents:'none', boxShadow:'0 8px 32px rgba(0,0,0,0.6)', overflow:'hidden', minWidth:140 }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${T.cyan}40,transparent)` }}/>
                    <div style={{ padding:'10px 14px' }}>
                      <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:2 }}>{item.label}</div>
                      <div style={{ fontSize:11, color:T.textMuted, lineHeight:1.4 }}>{item.desc}</div>
                    </div>
                  </div>
                )}
              </Link>
            )
          })}
        </div>

        {/* Bottom */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'0 10px', width:'100%', flexShrink:0 }}>
          <div style={{ height:1, background:T.border, width:'80%', margin:'6px auto' }}/>
          <Link href="/dashboard/settings" style={{ textDecoration:'none' }}>
            <div className="nav-btn" style={{ width:42, height:42, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', color:T.textDim, margin:'0 auto', cursor:'pointer', border:'1px solid transparent' }}>
              <img src="/icons/settings.png" alt="Settings" width={18} height={18} style={{ width:18, height:18, objectFit:'contain', filter:'brightness(0) invert(1)', opacity:0.3, transition:'all 0.16s' }}/>
            </div>
          </Link>
          <Link href="/dashboard/settings?tab=profile" style={{ textDecoration:'none' }}>
            <div style={{ width:34, height:34, borderRadius:10, background:`linear-gradient(135deg,${T.cyan},#0066CC)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', cursor:'pointer', transition:'opacity 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity='0.8'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity='1'}>
              {initial}
            </div>
          </Link>
        </div>
      </div>

      {/* ── MAIN COLUMN ── */}
      <div style={{ display:'flex', flexDirection:'column', overflow:'hidden', background:T.bg }}>

        {/* TOPBAR — cyan gradient image as background */}
        <div style={{
          height:'var(--topbar-h,54px)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'0 24px',
          borderBottom:`1px solid ${T.border}`,
          flexShrink:0, zIndex:200, gap:14,
          position:'relative', overflow:'visible',
          backgroundImage:'url(/cyan-header.png)',
          backgroundSize:'cover',
          backgroundPosition:'center',
        }}>
          {/* Dark overlay so text stays readable */}
          <div style={{ position:'absolute', inset:0, background:'rgba(10,10,15,0.55)', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,${T.cyan}60,transparent 60%)`, pointerEvents:'none' }}/>

          {/* Date */}
          <span style={{ fontSize:13, fontWeight:500, color:'rgba(255,255,255,0.7)', letterSpacing:'-0.01em', whiteSpace:'nowrap', position:'relative', flexShrink:0 }}>
            {format(new Date(), 'EEEE, d MMMM yyyy')}
          </span>

          {/* Search */}
          <div style={{ flex:1, maxWidth:400, position:'relative' }} data-dd>
            <div style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.4)', display:'flex', pointerEvents:'none', zIndex:1 }}>{Ic.search}</div>
            <input
              placeholder="Jump to anywhere…"
              value={searchQ}
              onChange={e => { setSearchQ(e.target.value); setSearchOpen(e.target.value.length > 0) }}
              onFocus={e => { e.target.style.borderColor=T.cyanBorder; e.target.style.background='rgba(0,170,255,0.15)'; if(searchQ) setSearchOpen(true) }}
              onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.15)'; e.target.style.background='rgba(255,255,255,0.1)'; setTimeout(()=>setSearchOpen(false),150) }}
              onKeyDown={e => { if(e.key==='Escape'){setSearchQ('');setSearchOpen(false);(e.target as HTMLInputElement).blur()} }}
              style={{ width:'100%', padding:'9px 14px 9px 38px', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:10, color:'#fff', fontSize:13, fontFamily:'var(--sans)', outline:'none', transition:'all 0.18s', boxSizing:'border-box' as const }}
            />
            {searchOpen && searchQ.length > 0 && (() => {
              const PAGES = [
                {label:'Home',href:'/dashboard',desc:'Morning brief, agents'},
                {label:'Studio',href:'/dashboard/studio',desc:'Create in your voice'},
                {label:'Brand Brain',href:'/dashboard/brand',desc:'Your brand DNA'},
                {label:'Strategy',href:'/dashboard/strategy',desc:'30-day content plan'},
                {label:'Schedule',href:'/dashboard/schedule',desc:'Publish everywhere'},
                {label:'Automate',href:'/dashboard/automate',desc:'Sequences & flows'},
                {label:'Amplify',href:'/dashboard/amplify',desc:'Run Meta Ads'},
                {label:'Integrations',href:'/dashboard/integrations',desc:'Connect your tools'},
                {label:'Insights',href:'/dashboard/insights',desc:"What's working"},
                {label:'Agency',href:'/dashboard/agency',desc:'Client workspaces'},
                {label:'Settings',href:'/dashboard/settings',desc:'Profile, billing'},
              ]
              const q = searchQ.toLowerCase()
              const results = PAGES.filter(p => p.label.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)).slice(0,6)
              if (!results.length) return null
              return (
                <div style={{ position:'absolute', top:'calc(100% + 8px)', left:0, right:0, background:T.surface2, border:`1px solid ${T.border}`, borderRadius:12, overflow:'hidden', zIndex:9999, boxShadow:'0 16px 48px rgba(0,0,0,0.7)' }}>
                  <div style={{ padding:'8px 14px 6px', fontSize:9, fontWeight:700, color:T.textMuted, letterSpacing:'0.09em', textTransform:'uppercase' }}>Pages</div>
                  {results.map(r => (
                    <a key={r.href} href={r.href} onClick={() => {setSearchQ('');setSearchOpen(false)}}
                      style={{ display:'flex', alignItems:'center', gap:11, padding:'10px 14px', textDecoration:'none', transition:'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.05)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='transparent'}>
                      <div style={{ width:7, height:7, borderRadius:'50%', background:T.cyan, flexShrink:0 }}/>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{r.label}</div>
                        <div style={{ fontSize:11, color:T.textMuted, marginTop:1 }}>{r.desc}</div>
                      </div>
                    </a>
                  ))}
                </div>
              )
            })()}
          </div>

          {/* Right controls */}
          <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0, position:'relative' }}>

            {trialDaysLeft !== null && (
              <a href="/dashboard/settings?tab=billing" style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 11px', borderRadius:8, textDecoration:'none', background:trialDaysLeft<=1?'rgba(255,80,80,0.2)':'rgba(255,181,71,0.15)', border:`1px solid ${trialDaysLeft<=1?'rgba(255,80,80,0.4)':'rgba(255,181,71,0.35)'}`, fontSize:11, fontWeight:700, color:trialDaysLeft<=1?'#FF5757':'#FFB547', whiteSpace:'nowrap' }}>
                {trialDaysLeft === 0 ? '⚠ Trial expired' : `Trial · ${trialDaysLeft}d left`}
              </a>
            )}

            {isAgency && clientWorkspaces.length > 0 && (
              <div style={{ position:'relative' }} data-dd>
                <button onClick={() => {setShowWorkspaceSwitcher(o=>!o);setPillOpen(false);setNotifOpen(false)}}
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', background:'rgba(0,170,255,0.2)', border:`1px solid ${T.cyanBorder}`, borderRadius:8, fontSize:12, fontWeight:600, color:'#fff', cursor:'pointer', fontFamily:'var(--display)' }}>
                  {activeWorkspaceName}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {showWorkspaceSwitcher && (
                  <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, background:T.surface2, border:`1px solid ${T.border}`, borderRadius:10, padding:6, minWidth:200, zIndex:1000, boxShadow:'0 8px 24px rgba(0,0,0,0.5)', animation:'pageUp 0.15s ease both' }}>
                    <div onClick={() => switchWorkspace(ownWorkspaceId!,'My workspace')} style={{ padding:'8px 12px', borderRadius:7, cursor:'pointer', fontSize:12, color:T.text, transition:'background 0.1s' }} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.06)'} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>My workspace</div>
                    {clientWorkspaces.map((cw:any) => (
                      <div key={cw.client_workspace_id} onClick={() => switchWorkspace(cw.client_workspace_id,cw.client_name)} style={{ padding:'8px 12px', borderRadius:7, cursor:'pointer', fontSize:12, color:T.textMuted, transition:'background 0.1s' }} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.06)'} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>{cw.client_name}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Credits */}
            <div title="Post:3cr · Hook:2cr · Thread:5cr · Image:5cr · Voice:8cr · Video:15cr" style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, cursor:'help', backdropFilter:'blur(8px)' }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:T.cyan, flexShrink:0 }}/>
              <span style={{ fontSize:13, color:'#fff', fontFamily:'var(--mono)', fontWeight:500 }}>{credits.toLocaleString()}</span>
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.5)', fontWeight:600, letterSpacing:'0.03em' }}>cr</span>
            </div>

            {/* Bell */}
            <div style={{ position:'relative' }} data-dd>
              <button onClick={() => { const o=!notifOpen; setNotifOpen(o); setPillOpen(false); if(o){setUnread(0);fetch(`/api/notifications/mark-read?workspace_id=${workspace.id}`,{method:'POST',credentials:'include'}).catch(()=>{})} }}
                style={{ width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.25)', border:'1px solid rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.75)', cursor:'pointer', transition:'all 0.15s', position:'relative', backdropFilter:'blur(8px)' }}>
                {Ic.bell}
                {unread>0 && <div style={{ position:'absolute', top:-2, right:-2, minWidth:16, height:16, borderRadius:8, background:'#FF5757', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'#fff', border:'1.5px solid #000', padding:'0 3px', pointerEvents:'none' }}>{unread>9?'9+':unread}</div>}
              </button>
              {notifOpen && (
                <div style={{ position:'absolute', top:'calc(100% + 10px)', right:0, background:T.surface2, border:`1px solid ${T.border}`, borderRadius:16, overflow:'hidden', width:320, zIndex:300, boxShadow:'0 24px 64px rgba(0,0,0,0.75)', animation:'pageUp 0.18s ease both' }}>
                  <div style={{ padding:'14px 16px 12px', borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontSize:13, fontWeight:700, color:T.text }}>Notifications</span>
                    {unread>0 && <span style={{ fontSize:10, fontWeight:700, color:'#FF5757', padding:'2px 8px', borderRadius:100, background:'rgba(255,87,87,0.1)', border:'1px solid rgba(255,87,87,0.2)' }}>{unread} new</span>}
                  </div>
                  <div className="ns" style={{ maxHeight:320, overflowY:'auto' }}>
                    {notifs.length>0 ? notifs.slice(0,8).map((n:any,i:number)=>(
                      <div key={n.id||i} onClick={()=>{if(n.link){setNotifOpen(false);router.push(n.link)}}} style={{ display:'flex', gap:11, padding:'11px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background 0.12s', cursor:n.link?'pointer':'default' }} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.03)'} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                        <div style={{ width:7, height:7, borderRadius:'50%', background:T.cyan, flexShrink:0, marginTop:5 }}/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12.5, color:T.textMuted, lineHeight:1.5 }}>{n.message||n.title}</div>
                          <div style={{ fontSize:10, color:T.textDim, marginTop:3 }}>{n.created_at?format(parseISO(n.created_at),'MMM d, h:mm a'):''}</div>
                        </div>
                      </div>
                    )) : (
                      <div style={{ padding:'28px 16px', textAlign:'center' }}>
                        <div style={{ fontSize:12, color:T.textMuted, lineHeight:1.7 }}>You're all caught up.<br/><span style={{ fontSize:11, color:T.textDim }}>Activity will appear here.</span></div>
                      </div>
                    )}
                  </div>
                  <button onClick={async()=>{ await fetch('/api/notifications/create',{method:'POST',headers:{'Content-Type':'application/json','x-internal-secret':process.env.NEXT_PUBLIC_INTERNAL_SECRET||''},body:JSON.stringify({workspace_id:workspace.id,type:'system',message:'Test notification — system working ✓'})}); loadNotifs() }} style={{ margin:'8px 16px', padding:'7px 12px', background:'rgba(255,255,255,0.03)', border:`1px solid ${T.border}`, borderRadius:7, fontSize:11, color:T.textMuted, cursor:'pointer', fontFamily:'var(--sans)', width:'calc(100% - 32px)' }}>+ Test notification</button>
                </div>
              )}
            </div>

            {/* Chat toggle */}
            <button onClick={()=>setChatOpen(o=>!o)}
              style={{ width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:chatOpen?'rgba(0,170,255,0.3)':'rgba(0,0,0,0.25)', border:`1px solid ${chatOpen?T.cyanBorder:'rgba(255,255,255,0.15)'}`, color:'rgba(255,255,255,0.85)', cursor:'pointer', transition:'all 0.15s', backdropFilter:'blur(8px)' }}>
              {Ic.chat}
            </button>

            {/* User pill */}
            <div style={{ position:'relative' }} data-dd>
              <div onClick={()=>{setPillOpen(o=>!o);setNotifOpen(false)}}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 10px 5px 6px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:11, cursor:'pointer', transition:'all 0.15s', backdropFilter:'blur(8px)' }}>
                <div style={{ width:26, height:26, borderRadius:7, background:`linear-gradient(135deg,${T.cyan},#0066CC)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff', flexShrink:0 }}>{initial}</div>
                <div style={{ lineHeight:1 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:'#fff', letterSpacing:'-0.01em' }}>{firstName}</div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.55)', marginTop:2, textTransform:'capitalize' }}>{workspace?.plan||'spark'}</div>
                </div>
                <span style={{ color:'rgba(255,255,255,0.5)', display:'flex', transform:pillOpen?'rotate(180deg)':'none', transition:'transform 0.15s' }}>{Ic.chevron}</span>
              </div>
              {pillOpen && (
                <div style={{ position:'absolute', top:'calc(100% + 10px)', right:0, background:T.surface2, border:`1px solid ${T.border}`, borderRadius:14, padding:5, minWidth:220, zIndex:9999, boxShadow:'0 24px 64px rgba(0,0,0,0.85)', animation:'pageUp 0.15s ease both' }}>
                  <div style={{ padding:'10px 12px 12px', borderBottom:`1px solid ${T.border}`, marginBottom:4, display:'flex', alignItems:'center', gap:9 }}>
                    <div style={{ width:32, height:32, borderRadius:10, background:`linear-gradient(135deg,${T.cyan},#0066CC)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>{initial}</div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:T.text, lineHeight:1 }}>{user?.full_name||'User'}</div>
                      <div style={{ fontSize:10, color:T.textMuted, marginTop:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:140 }}>{user?.email}</div>
                    </div>
                  </div>
                  {[{l:'Profile',h:'/dashboard/settings?tab=profile',i:Ic.user},{l:'Workspace',h:'/dashboard/settings?tab=workspace',i:Ic.settings},{l:'Billing',h:'/dashboard/settings?tab=billing',i:Ic.billing}].map(x=>(
                    <a key={x.l} href={x.h} onClick={()=>setPillOpen(false)} style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 12px', borderRadius:9, fontSize:13, color:T.textMuted, textDecoration:'none', transition:'all 0.12s' }} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.06)';(e.currentTarget as HTMLElement).style.color=T.text}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='transparent';(e.currentTarget as HTMLElement).style.color=T.textMuted}}>
                      <span style={{ color:T.textDim, display:'flex' }}>{x.i}</span>{x.l}
                    </a>
                  ))}
                  <div style={{ height:1, background:T.border, margin:'4px 0' }}/>
                  <button onClick={signOut} style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 12px', borderRadius:9, fontSize:13, color:'rgba(255,87,87,0.8)', background:'transparent', border:'none', cursor:'pointer', width:'100%', textAlign:'left', fontFamily:'var(--sans)', transition:'background 0.12s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,87,87,0.08)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <span style={{ display:'flex' }}>{Ic.signout}</span>Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex:1, overflowY:'auto', position:'relative', background:T.bg }}>
          {children}
        </div>
      </div>

      {/* ── CHAT PANEL ── */}
      {chatOpen && !isNarrow && (
        <div style={{ display:'flex', flexDirection:'column', borderLeft:`1px solid ${T.border}`, background:T.surface, overflow:'hidden', width:340, minWidth:340 }}>
          <div style={{ height:'var(--topbar-h,54px)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 18px', borderBottom:`1px solid ${T.border}`, flexShrink:0, background:T.surface, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 200% 300% at -10% 50%,rgba(0,170,255,0.05) 0%,transparent 60%)`, pointerEvents:'none' }}/>
            <div style={{ display:'flex', alignItems:'center', gap:11, position:'relative' }}>
              <div style={{ width:22, height:22, borderRadius:6, overflow:'hidden', border:`1px solid ${T.border}`, flexShrink:0 }}><img src="/favicon.png" alt="Nexa" width={22} height={22} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/></div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:T.text, lineHeight:1, letterSpacing:'-0.02em' }}>Nexa AI</div>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:4 }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:'#34D399', boxShadow:'0 0 6px #34D399' }}/>
                  <span style={{ fontSize:10, color:T.textMuted }}>knows your brand</span>
                </div>
              </div>
            </div>
            <button onClick={()=>setChatOpen(false)} style={{ width:28, height:28, borderRadius:8, background:'transparent', border:'none', color:T.textDim, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.12s' }} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.07)';(e.currentTarget as HTMLElement).style.color=T.text}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='transparent';(e.currentTarget as HTMLElement).style.color=T.textDim}}>{Ic.close}</button>
          </div>

          <div className="ns" style={{ flex:1, overflowY:'auto', padding:'20px 18px', display:'flex', flexDirection:'column', gap:20 }}>
            {msgs.map((m,i)=>(
              <div key={i} style={{ display:'flex', flexDirection:'column', gap:6, animation:'msgIn 0.22s ease both', alignItems:m.role==='user'?'flex-end':'flex-start' }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, flexDirection:m.role==='user'?'row-reverse':'row' }}>
                  {m.role==='assistant' ? <div style={{ width:22, height:22, borderRadius:6, overflow:'hidden', border:`1px solid ${T.border}`, flexShrink:0 }}><img src="/favicon.png" alt="Nexa" width={22} height={22} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/></div> : <div style={{ width:22, height:22, borderRadius:6, background:`linear-gradient(135deg,${T.cyan},#0066CC)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, color:'#fff', flexShrink:0 }}>{initial}</div>}
                  <span style={{ fontSize:10.5, fontWeight:600, color:T.textDim }}>{m.role==='assistant'?'Nexa':firstName}</span>
                </div>
                {m.role==='assistant'
                  ? <div className="nexa-msg-ai" style={{ paddingLeft:29 }} dangerouslySetInnerHTML={{ __html:String(marked.parse(m.content)) }}/>
                  : <div style={{ maxWidth:'88%', padding:'10px 14px', borderRadius:'16px 4px 16px 16px', background:T.cyanDim, border:`1px solid ${T.cyanBorder}`, fontSize:13, color:T.text, lineHeight:1.7 }}>{m.content}</div>
                }
              </div>
            ))}
            {chatLoading && (
              <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-start' }}>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <div style={{ width:22, height:22, borderRadius:6, overflow:'hidden', border:`1px solid ${T.border}`, flexShrink:0 }}><img src="/favicon.png" alt="Nexa" width={22} height={22} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/></div>
                  <span style={{ fontSize:10.5, fontWeight:600, color:T.textDim }}>Nexa</span>
                </div>
                <div style={{ paddingLeft:29, display:'flex', gap:5, alignItems:'center', height:28 }}>
                  {[0,1,2].map(j=><div key={j} style={{ width:6, height:6, borderRadius:'50%', background:'rgba(0,170,255,0.7)', animation:`pulse-dot 1.4s ease-in-out ${j*0.18}s infinite` }}/>)}
                </div>
              </div>
            )}
            <div ref={endRef}/>
          </div>

          <div style={{ padding:'10px 16px', borderTop:'1px solid rgba(255,255,255,0.05)', display:'flex', gap:5, flexWrap:'wrap' }}>
            {QUICK.map(q=>(
              <button key={q} onClick={()=>setInput(q)} style={{ padding:'5px 12px', fontSize:11, fontWeight:500, color:T.textMuted, background:'rgba(255,255,255,0.03)', border:`1px solid ${T.border}`, borderRadius:100, cursor:'pointer', fontFamily:'var(--sans)', transition:'all 0.15s', whiteSpace:'nowrap' }} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color=T.cyan;(e.currentTarget as HTMLElement).style.borderColor=T.cyanBorder;(e.currentTarget as HTMLElement).style.background=T.cyanDim}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color=T.textMuted;(e.currentTarget as HTMLElement).style.borderColor=T.border;(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.03)'}}>
                {q}
              </button>
            ))}
          </div>

          {files.length>0 && (
            <div style={{ padding:'6px 14px', borderTop:`1px solid ${T.border}`, display:'flex', gap:5, flexWrap:'wrap' }}>
              {files.map((f,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', background:T.cyanDim, border:`1px solid ${T.cyanBorder}`, borderRadius:8, fontSize:11 }}>
                  <span style={{ color:T.cyan, display:'flex' }}>{Ic.clip}</span>
                  <span style={{ color:T.textMuted, maxWidth:80, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</span>
                  <button onClick={()=>setFiles(p=>p.filter((_,j)=>j!==i))} style={{ background:'none', border:'none', color:T.textDim, cursor:'pointer', padding:0, display:'flex' }}>{Ic.close}</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ padding:'14px 16px 16px', borderTop:`1px solid ${T.border}`, flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:14, padding:'12px 14px', transition:'all 0.18s' }} onFocusCapture={e=>{(e.currentTarget as HTMLElement).style.borderColor=T.cyanBorder;(e.currentTarget as HTMLElement).style.boxShadow='0 0 0 3px rgba(0,170,255,0.07)'}} onBlurCapture={e=>{(e.currentTarget as HTMLElement).style.borderColor=T.border;(e.currentTarget as HTMLElement).style.boxShadow='none'}}>
              <button onClick={()=>fileRef.current?.click()} style={{ background:'none', border:'none', color:T.textDim, cursor:'pointer', display:'flex', padding:'2px 0', flexShrink:0, transition:'color 0.12s' }} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color=T.cyan} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color=T.textDim}>{Ic.clip}</button>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" style={{ display:'none' }} onChange={e=>e.target.files?.[0]&&uploadFile(e.target.files[0])}/>
              <textarea value={input} onChange={e=>{setInput(e.target.value);e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,120)+'px'}} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}} placeholder="Message Nexa…" rows={1} style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:13.5, color:T.text, fontFamily:'var(--sans)', letterSpacing:'-0.01em', resize:'none', lineHeight:1.6, maxHeight:120, overflowY:'auto', scrollbarWidth:'none' as any }}/>
              <button onClick={send} disabled={(!input.trim()&&files.length===0)||chatLoading} style={{ width:32, height:32, borderRadius:9, background:(input.trim()||files.length>0)?T.cyan:'rgba(255,255,255,0.05)', border:'none', cursor:(input.trim()||files.length>0)?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', color:(input.trim()||files.length>0)?'#fff':'rgba(255,255,255,0.2)', transition:'all 0.15s', flexShrink:0, boxShadow:(input.trim()||files.length>0)?`0 2px 12px rgba(0,170,255,0.4)`:'none' }}>{Ic.send}</button>
            </div>
            <p style={{ fontSize:10, color:T.textDim, textAlign:'center', marginTop:8 }}>{uploading?'Reading file…':'Enter to send  ·  Shift+Enter for new line'}</p>
          </div>
        </div>
      )}

      {showTour && <NexaTour onClose={dismissTour}/>}
    </div>
  )
}
