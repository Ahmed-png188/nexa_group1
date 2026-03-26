'use client'
import NexaTour, { useTourState } from './NexaTour.ar'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ar } from 'date-fns/locale'
import { marked } from 'marked'
import { getCreditThresholds, TOPUP_PACKS_BY_PLAN, PLAN_CREDITS } from '@/lib/plan-constants'
import { useLang } from '@/lib/language-context'

const F = "'Tajawal', system-ui, sans-serif"
const MONO = "'Geist Mono', monospace"

const C = {
  bg:      '#0C0C0C',
  surface: '#141414',
  over:    '#1A1A1A',
  border:  'rgba(255,255,255,0.10)',
  borderS: 'rgba(255,255,255,0.06)',
  cyan:    '#00AAFF',
  cyanD:   'rgba(0,170,255,0.12)',
  cyanB:   'rgba(0,170,255,0.22)',
  t1:      '#FFFFFF',
  t2:      'rgba(255,255,255,0.65)',
  t3:      'rgba(255,255,255,0.35)',
  t4:      'rgba(255,255,255,0.20)',
}

const NAV_ICONS: Record<string, JSX.Element> = {
  home:         <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  studio:       <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  brand:        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2a2.5 2.5 0 0 1 5 0"/><path d="M9.5 22a2.5 2.5 0 0 0 5 0"/><path d="M14.5 2C17 2 19 4 19 6.5c0 2-1.5 3.5-3.5 4C17 11 19 12.5 19 15c0 2.5-2 4.5-4.5 4.5"/><path d="M9.5 2C7 2 5 4 5 6.5c0 2 1.5 3.5 3.5 4C7 11 5 12.5 5 15c0 2.5 2 4.5 4.5 4.5"/></svg>,
  strategy:     <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  schedule:     <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  automate:     <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  amplify:      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>,
  integrations: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="9" height="9" rx="2"/><rect x="13" y="2" width="9" height="9" rx="2"/><rect x="2" y="13" width="9" height="9" rx="2"/><rect x="13" y="13" width="9" height="9" rx="2"/></svg>,
  insights:     <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  agency:       <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  leadpage:     <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  lab:          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  settings:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
}

const Ic = {
  bell:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 6 3 8 3 8H3s3-2 3-8"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  chat:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/><path d="M8 10h8M8 14h5" opacity=".5"/></svg>,
  send:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>,
  close:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  chevron: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>,
  search:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>,
  user:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"/></svg>,
  billing: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="2" y="5" width="20" height="15" rx="2"/><path d="M2 10h20"/><path d="M6 15h4" opacity=".5"/></svg>,
  signout: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" opacity=".5"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>,
  clip:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
}

const NAV = [
  { id:'home',         href:'/dashboard',              icon:'home',         label:'الرئيسية',     desc:'ملخص اليوم والوكلاء'   },
  { id:'studio',       href:'/dashboard/studio',       icon:'studio',       label:'الاستوديو',    desc:'اكتب بصوتك'            },
  { id:'brand',        href:'/dashboard/brand',        icon:'brand',        label:'Brand Brain',  desc:'هوية براندك'           },
  { id:'strategy',     href:'/dashboard/strategy',     icon:'strategy',     label:'الاستراتيجية', desc:'خطة 30 يوم'            },
  { id:'schedule',     href:'/dashboard/schedule',     icon:'schedule',     label:'الجدول',       desc:'انشر في كل مكان'       },
  { id:'automate',     href:'/dashboard/automate',     icon:'automate',     label:'الأتمتة',      desc:'تسلسلات وتدفقات'       },
  { id:'amplify',      href:'/dashboard/amplify',      icon:'amplify',      label:'Amplify',      desc:'إعلانات Meta'          },
  { id:'integrations', href:'/dashboard/integrations', icon:'integrations', label:'الاتصالات',    desc:'وصّل أدواتك'           },
  { id:'insights',     href:'/dashboard/insights',     icon:'insights',     label:'الإنسايتس',    desc:'إيش يشتغل'             },
  { id:'lead-page',    href:'/dashboard/lead-page',    icon:'leadpage',     label:'صفحة العملاء', desc:'اصطد العملاء'          },
  { id:'agency',       href:'/dashboard/agency',       icon:'agency',       label:'الوكالة',      desc:'مساحات العملاء'        },
  { id:'product-lab',  href:'/dashboard/product-lab',  icon:'lab',          label:'مختبر المنتج', desc:'تصوير المنتجات'        },
]

const SEARCH_PAGES = [
  { label:'الرئيسية',     href:'/dashboard',              desc:'ملخص اليوم'         },
  { label:'الاستوديو',    href:'/dashboard/studio',       desc:'اكتب بصوتك'         },
  { label:'Brand Brain',  href:'/dashboard/brand',        desc:'هوية براندك'        },
  { label:'الاستراتيجية', href:'/dashboard/strategy',     desc:'خطة 30 يوم'         },
  { label:'الجدول',       href:'/dashboard/schedule',     desc:'انشر في كل مكان'    },
  { label:'الأتمتة',      href:'/dashboard/automate',     desc:'تسلسلات وتدفقات'    },
  { label:'Amplify',      href:'/dashboard/amplify',      desc:'إعلانات Meta'       },
  { label:'الاتصالات',    href:'/dashboard/integrations', desc:'وصّل أدواتك'        },
  { label:'الإنسايتس',    href:'/dashboard/insights',     desc:'إيش يشتغل'          },
  { label:'صفحة العملاء', href:'/dashboard/lead-page',    desc:'اصطد العملاء'       },
  { label:'الوكالة',      href:'/dashboard/agency',       desc:'مساحات العملاء'     },
  { label:'مختبر المنتج', href:'/dashboard/product-lab',  desc:'تصوير المنتجات'     },
  { label:'الإعدادات',    href:'/dashboard/settings',     desc:'حسابك وفواتيرك'     },
]

const QUICK = [
  'اكتب منشور إنستغرام',
  'حلّل براندي',
  'بناء استراتيجية',
  'أفكار محتوى',
]

const CREDIT_COSTS = [
  ['منشور / كابشن','٣ cr'],
  ['ثريد / إعلان','٥ cr'],
  ['مقالة كاملة','١٠ cr'],
  ['صورة','٥ cr'],
  ['فيديو ٥ث ستاندرد','٦٥ cr'],
  ['فيديو ٨ث سينمائي','١٣٨ cr'],
  ['صوت قصير','٥ cr'],
  ['صوت طويل','٣٩ cr'],
]

interface Props { user: any; workspace: any; credits: number; children: React.ReactNode }

export default function DashboardShellAr({ user, workspace, credits: init, children }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const endRef   = useRef<HTMLDivElement>(null)
  const fileRef  = useRef<HTMLInputElement>(null)
  const { setLang } = useLang()

  const { show: showTour, dismiss: dismissTour } = useTourState(workspace?.id)

  const [credits,               setCredits]               = useState(init)
  const [topupOpen,             setTopupOpen]             = useState(false)
  const [topupLoading,          setTopupLoading]          = useState(false)
  const [chatOpen,              setChatOpen]              = useState(true)
  const [isNarrow,              setIsNarrow]              = useState(false)
  const [input,                 setInput]                 = useState('')
  const [msgs,                  setMsgs]                  = useState([{ role:'assistant', content:'أهلاً! أنا Nexa AI، مساعدك الذكي. ايش تبي تسوي اليوم؟' }])
  const [chatLoading,           setChatLoading]           = useState(false)
  const [files,                 setFiles]                 = useState<any[]>([])
  const [mounted,               setMounted]               = useState(false)
  const [uploading,             setUploading]             = useState(false)
  const [pillOpen,              setPillOpen]              = useState(false)
  const [notifOpen,             setNotifOpen]             = useState(false)
  const [notifs,                setNotifs]                = useState<any[]>([])
  const [unread,                setUnread]                = useState(0)
  const [hoverId,               setHoverId]               = useState<string|null>(null)
  const [isAgency,              setIsAgency]              = useState(false)
  const [clientWorkspaces,      setClientWorkspaces]      = useState<any[]>([])
  const [showWorkspaceSwitcher, setShowWorkspaceSwitcher] = useState(false)
  const [activeWorkspaceName,   setActiveWorkspaceName]   = useState('مساحتي')
  const [ownWorkspaceId,        setOwnWorkspaceId]        = useState<string|null>(null)
  const [searchQ,               setSearchQ]               = useState('')
  const [searchOpen,            setSearchOpen]            = useState(false)

  const activeId  = NAV.find(n => n.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(n.href))?.id ?? 'home'
  const initial   = (user?.full_name?.[0] ?? user?.email?.[0] ?? 'N').toUpperCase()
  const avatarUrl = user?.avatar_url as string | null | undefined
  const firstName = user?.full_name?.split(' ')[0] ?? ''

  const trialDaysLeft: number | null = (() => {
    if (workspace?.plan_status !== 'trialing') return null
    const created  = new Date(workspace.created_at)
    const trialEnd = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000)
    const diff     = trialEnd.getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)))
  })()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-dd]')) {
        setPillOpen(false); setNotifOpen(false); setShowWorkspaceSwitcher(false)
      }
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
      setIsAgency(true); setOwnWorkspaceId(workspace.id)
      supabase.from('client_workspaces').select('client_workspace_id, client_name').eq('agency_workspace_id', workspace.id)
        .then(({ data }) => setClientWorkspaces(data || []))
    }
  }, [workspace?.id])

  useEffect(() => {
    if (!workspace?.id) return
    loadNotifs()
    const channel = supabase.channel(`shell-ar-${workspace.id}`)
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'credits', filter:`workspace_id=eq.${workspace.id}` }, (payload:any) => {
        if (payload.new?.balance !== undefined) {
          setCredits(payload.new.balance)
          if (payload.new.balance <= 0) setTopupOpen(true)
        }
      })
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'notifications', filter:`workspace_id=eq.${workspace.id}` }, () => loadNotifs())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
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
    const msg = input.trim() || 'حلّلي هذا الملف.'
    const fs  = [...files]
    setInput(''); setFiles([])
    setMsgs(prev => [...prev, { role:'user', content:msg }])
    setChatLoading(true)
    try {
      const r = await fetch('/api/chat', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        credentials:'include',
        body:JSON.stringify({ message:msg, workspace_id:workspace.id, history:msgs, files:fs, lang:'ar' })
      })
      if (!r.ok) throw new Error('Chat failed')
      const d = await r.json()
      setMsgs(prev => [...prev, { role:'assistant', content:d.reply ?? 'صار خطأ. جرّب مرة ثانية.' }])
    } catch {
      setMsgs(prev => [...prev, { role:'assistant', content:'صار خطأ. جرّب مرة ثانية.' }])
    }
    setChatLoading(false)
  }

  async function uploadFile(file: File) {
    setUploading(true)
    const reader = new FileReader()
    reader.onload = e => {
      const b64 = (e.target?.result as string)?.split(',')[1]
      const ft  = file.type || 'application/octet-stream'
      setFiles(prev => [...prev, { name:file.name, type:ft.includes('pdf')?'pdf':ft, data:b64, size:file.size }])
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div
      dir="rtl"
      data-lang="ar"
      style={{ display:'grid', gridTemplateColumns:`60px 1fr ${chatOpen && !isNarrow ? '320px' : '0px'}`, height:'100vh', overflow:'hidden', background:C.bg, transition:'grid-template-columns 0.22s cubic-bezier(0.4,0,0.2,1)', fontFamily:F, direction:'rtl' }}
    >
      <style dangerouslySetInnerHTML={{ __html:`
        * { font-family: '${F}'; }
        .ns::-webkit-scrollbar{display:none}.ns{scrollbar-width:none}
        .nav-item{transition:all 0.15s ease}
        .nav-item:hover{background:rgba(255,255,255,0.07)!important;color:rgba(255,255,255,0.75)!important}
        .nexa-msg-ai{font-family:'Tajawal',sans-serif;font-size:14px;color:rgba(255,255,255,0.75);line-height:1.9;direction:rtl;text-align:right}
        .nexa-msg-ai p{margin:0 0 8px}.nexa-msg-ai p:last-child{margin:0}
        .nexa-msg-ai strong{color:#fff;font-weight:600}
        .nexa-msg-ai code{background:rgba(0,170,255,0.10);border:1px solid rgba(0,170,255,0.20);border-radius:4px;padding:1px 5px;font-size:12px;color:#00AAFF}
        .nexa-msg-ai ul,.nexa-msg-ai ol{margin:4px 16px 8px 0;padding-right:16px;padding-left:0}
        @keyframes pulse-dot{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1)}}
        @keyframes msgIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes dropIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .tb-btn{transition:all 0.15s}
        .tb-btn:hover{background:rgba(255,255,255,0.10)!important;color:rgba(255,255,255,0.90)!important}
        input, textarea, button { font-family: 'Tajawal', system-ui, sans-serif !important; }
      `}}/>

      {/* ── SIDEBAR ── */}
      <aside style={{ background:C.surface, borderLeft:`1px solid ${C.border}`, display:'flex', flexDirection:'column', alignItems:'center', padding:'14px 0 12px', overflow:'hidden', zIndex:20, position:'relative' }}>
        <div style={{ marginBottom:'20px', flexShrink:0 }}>
          <div style={{ width:32, height:32, borderRadius:8, overflow:'hidden', border:'1px solid rgba(255,255,255,0.12)' }}>
            <img src="/favicon.png" alt="Nexa" width={32} height={32} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
          </div>
        </div>

        <nav className="ns" style={{ display:'flex', flexDirection:'column', gap:'2px', flex:1, width:'100%', padding:'0 9px', overflowY:'auto' }}>
          {NAV.map(item => {
            const active = activeId === item.id
            return (
              <Link key={item.id} href={item.href} data-tour={item.id}
                style={{ textDecoration:'none', display:'block', position:'relative' }}
                onMouseEnter={() => setHoverId(item.id)}
                onMouseLeave={() => setHoverId(null)}>
                <div className={active ? '' : 'nav-item'} style={{ width:42, height:40, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto', cursor:'pointer', position:'relative', background: active ? C.cyanD : 'transparent', color: active ? C.cyan : C.t3, border: active ? `1px solid ${C.cyanB}` : '1px solid transparent' }}>
                  {active && <div style={{ position:'absolute', right:-9, top:'50%', transform:'translateY(-50%)', width:2, height:16, borderRadius:'2px 0 0 2px', background:C.cyan }}/>}
                  {NAV_ICONS[item.icon]}
                </div>
                {hoverId === item.id && (
                  <div style={{ position:'absolute', right:'calc(100% + 12px)', top:'50%', transform:'translateY(-50%)', background:C.over, border:`1px solid ${C.border}`, borderRadius:8, whiteSpace:'nowrap', zIndex:9999, pointerEvents:'none', boxShadow:'0 8px 24px rgba(0,0,0,0.5)', padding:'8px 12px', animation:'dropIn 0.15s ease both', minWidth:130, direction:'rtl', textAlign:'right' }}>
                    <div style={{ fontSize:12, fontWeight:600, color:C.t1, marginBottom:2, fontFamily:F }}>{item.label}</div>
                    <div style={{ fontSize:11, color:C.t3, lineHeight:1.4, fontFamily:F }}>{item.desc}</div>
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'0 9px', width:'100%', flexShrink:0 }}>
          <div style={{ height:1, background:C.borderS, width:'80%', margin:'6px auto' }}/>
          <Link href="/dashboard/settings" style={{ textDecoration:'none', display:'block', position:'relative' }}
            onMouseEnter={() => setHoverId('settings')} onMouseLeave={() => setHoverId(null)}>
            <div className="nav-item" style={{ width:42, height:40, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto', cursor:'pointer', color:C.t3, border:'1px solid transparent' }}>
              {NAV_ICONS.settings}
            </div>
            {hoverId === 'settings' && (
              <div style={{ position:'absolute', right:'calc(100% + 12px)', top:'50%', transform:'translateY(-50%)', background:C.over, border:`1px solid ${C.border}`, borderRadius:8, whiteSpace:'nowrap', zIndex:9999, pointerEvents:'none', boxShadow:'0 8px 24px rgba(0,0,0,0.5)', padding:'8px 12px', animation:'dropIn 0.15s ease both', fontFamily:F }}>
                <div style={{ fontSize:12, fontWeight:600, color:C.t1 }}>الإعدادات</div>
              </div>
            )}
          </Link>
          <Link href="/dashboard/settings?tab=profile" style={{ textDecoration:'none' }}>
            <div style={{ width:32, height:32, borderRadius:8, background:avatarUrl?'transparent':`linear-gradient(135deg, ${C.cyan}, #0055AA)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', cursor:'pointer', transition:'opacity 0.15s', fontFamily:F, overflow:'hidden' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity='0.75'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity='1'}>
              {avatarUrl?<img src={avatarUrl} alt={initial} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:initial}
            </div>
          </Link>
        </div>
      </aside>

      {/* ── MAIN COLUMN ── */}
      <div style={{ display:'flex', flexDirection:'column', overflow:'hidden', background:C.bg }}>

        {/* TOPBAR */}
        <header style={{ height:54, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', borderBottom:`1px solid rgba(255,255,255,0.08)`, flexShrink:0, zIndex:200, gap:14, position:'relative', overflow:'visible', background:'#141414', direction:'rtl' }}>

          <span style={{ fontSize:12.5, fontWeight:500, color:'rgba(255,255,255,0.50)', whiteSpace:'nowrap', flexShrink:0, fontFamily:F }}>
            {mounted ? format(new Date(), 'EEEE، d MMMM yyyy', { locale: ar }) : ''}
          </span>

          {/* Search */}
          <div style={{ flex:1, maxWidth:380, position:'relative' }} data-dd>
            <div style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.30)', display:'flex', pointerEvents:'none', zIndex:1 }}>{Ic.search}</div>
            <input
              placeholder="اذهب إلى أي مكان..."
              value={searchQ}
              onChange={e => { setSearchQ(e.target.value); setSearchOpen(e.target.value.length > 0) }}
              onFocus={e => { e.target.style.borderColor='rgba(255,255,255,0.28)'; e.target.style.background='rgba(255,255,255,0.08)'; if(searchQ) setSearchOpen(true) }}
              onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.10)'; e.target.style.background='rgba(255,255,255,0.05)'; setTimeout(()=>setSearchOpen(false),150) }}
              onKeyDown={e => { if(e.key==='Escape'){setSearchQ('');setSearchOpen(false);(e.target as HTMLInputElement).blur()} }}
              style={{ width:'100%', padding:'8px 34px 8px 13px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:9, color:'#fff', fontSize:13, fontFamily:F, outline:'none', transition:'all 0.15s', boxSizing:'border-box' as const, direction:'rtl', textAlign:'right' }}
            />
            {searchOpen && searchQ.length > 0 && (() => {
              const q = searchQ.toLowerCase()
              const results = SEARCH_PAGES.filter(p => p.label.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)).slice(0,6)
              if (!results.length) return null
              return (
                <div style={{ position:'absolute', top:'calc(100% + 8px)', left:0, right:0, background:C.over, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden', zIndex:9999, boxShadow:'0 16px 48px rgba(0,0,0,0.7)', animation:'dropIn 0.15s ease both' }}>
                  {results.map(r => (
                    <a key={r.href} href={r.href} onClick={() => {setSearchQ('');setSearchOpen(false)}}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', textDecoration:'none', transition:'background 0.1s', direction:'rtl' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.05)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='transparent'}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:C.cyan, flexShrink:0 }}/>
                      <div>
                        <div style={{ fontSize:13, fontWeight:500, color:C.t1, fontFamily:F }}>{r.label}</div>
                        <div style={{ fontSize:11, color:C.t3, marginTop:1, fontFamily:F }}>{r.desc}</div>
                      </div>
                    </a>
                  ))}
                </div>
              )
            })()}
          </div>

          {/* Right controls (appear on left in RTL) */}
          <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0, position:'relative' }}>

            {trialDaysLeft !== null && (
              <a href="/dashboard/settings?tab=billing" style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:7, textDecoration:'none', background:trialDaysLeft<=1?'rgba(239,68,68,0.12)':'rgba(245,158,11,0.10)', border:`1px solid ${trialDaysLeft<=1?'rgba(239,68,68,0.25)':'rgba(245,158,11,0.25)'}`, fontSize:11, fontWeight:600, color:trialDaysLeft<=1?'#EF4444':'#F59E0B', whiteSpace:'nowrap', fontFamily:F }}>
                {trialDaysLeft === 0 ? 'انتهت التجربة' : `تجربة · ${trialDaysLeft} أيام`}
              </a>
            )}

            {isAgency && clientWorkspaces.length > 0 && (
              <div style={{ position:'relative' }} data-dd>
                <button onClick={() => {setShowWorkspaceSwitcher(o=>!o);setPillOpen(false);setNotifOpen(false)}}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', background:'rgba(0,170,255,0.15)', border:`1px solid ${C.cyanB}`, borderRadius:7, fontSize:12, fontWeight:600, color:'#fff', cursor:'pointer', fontFamily:F }}>
                  {activeWorkspaceName}
                  <span style={{ color:'rgba(255,255,255,0.50)', display:'flex' }}>{Ic.chevron}</span>
                </button>
                {showWorkspaceSwitcher && (
                  <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0, background:C.over, border:`1px solid ${C.border}`, borderRadius:9, padding:5, minWidth:190, zIndex:1000, boxShadow:'0 8px 24px rgba(0,0,0,0.5)', animation:'dropIn 0.15s ease both', direction:'rtl' }}>
                    <div onClick={() => switchWorkspace(ownWorkspaceId!, 'مساحتي')} style={{ padding:'7px 11px', borderRadius:6, cursor:'pointer', fontSize:12, color:C.t1, transition:'background 0.1s', fontFamily:F }} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.06)'} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>مساحتي</div>
                    {clientWorkspaces.map((cw:any) => (
                      <div key={cw.client_workspace_id} onClick={() => switchWorkspace(cw.client_workspace_id,cw.client_name)} style={{ padding:'7px 11px', borderRadius:6, cursor:'pointer', fontSize:12, color:C.t2, transition:'background 0.1s', fontFamily:F }} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.06)'} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>{cw.client_name}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Credits */}
            {(() => {
              const _thr = getCreditThresholds(PLAN_CREDITS[workspace?.plan||'spark']||PLAN_CREDITS.spark)
              const isCritical = credits <= _thr.CRITICAL
              const isLow      = credits <= _thr.LOW && !isCritical
              const isEmpty    = credits <= _thr.EMPTY
              const bg     = isEmpty ? 'rgba(239,68,68,0.15)' : isCritical ? 'rgba(239,68,68,0.10)' : isLow ? 'rgba(245,158,11,0.10)' : 'rgba(255,255,255,0.06)'
              const border = isEmpty ? '1px solid rgba(239,68,68,0.40)' : isCritical ? '1px solid rgba(239,68,68,0.28)' : isLow ? '1px solid rgba(245,158,11,0.28)' : '1px solid rgba(255,255,255,0.12)'
              const numColor = isEmpty || isCritical ? '#EF4444' : isLow ? '#F59E0B' : 'rgba(255,255,255,0.85)'
              const statusLabel = isEmpty ? 'فارغ' : isCritical ? 'حرج' : isLow ? 'منخفض' : ''
              return (
                <button onClick={() => setTopupOpen(true)}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', background:bg, border, borderRadius:7, cursor:'pointer', transition:'all 0.2s' }}>
                  {(isLow||isCritical||isEmpty) && <div style={{ width:6, height:6, borderRadius:'50%', background:isEmpty||isCritical?'#EF4444':'#F59E0B', animation:isEmpty||isCritical?'pulse-dot 1.5s ease-in-out infinite':'none', flexShrink:0 }}/>}
                  <span style={{ fontSize:13, color:numColor, fontFamily:MONO, fontWeight:400 }}>{credits.toLocaleString()}</span>
                  <span style={{ fontSize:10, color:isEmpty||isCritical?'#EF4444':isLow?'#F59E0B':'rgba(255,255,255,0.35)', fontWeight:600, fontFamily:F }}>cr</span>
                  {(isLow||isCritical||isEmpty) && <span style={{ fontSize:9, fontWeight:700, color:isEmpty||isCritical?'#EF4444':'#F59E0B', fontFamily:F }}>{statusLabel}</span>}
                </button>
              )
            })()}

            {/* Bell */}
            <div style={{ position:'relative' }} data-dd>
              <button className="tb-btn" onClick={() => { const o=!notifOpen; setNotifOpen(o); setPillOpen(false); if(o){setUnread(0);fetch(`/api/notifications/mark-read?workspace_id=${workspace.id}`,{method:'POST',credentials:'include'}).catch(()=>{})} }}
                style={{ width:34, height:34, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.10)', color:'rgba(255,255,255,0.55)', cursor:'pointer', position:'relative', transition:'all 0.15s' }}>
                {Ic.bell}
                {unread>0 && <div style={{ position:'absolute', top:-2, left:-2, minWidth:15, height:15, borderRadius:8, background:'#EF4444', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'#fff', border:'1.5px solid #fff', padding:'0 3px', pointerEvents:'none', fontFamily:MONO }}>{unread>9?'9+':unread}</div>}
              </button>
              {notifOpen && (
                <div style={{ position:'absolute', top:'calc(100% + 10px)', left:0, background:C.over, border:`1px solid ${C.border}`, borderTop:`2px solid ${C.cyan}`, borderRadius:12, overflow:'hidden', width:320, zIndex:300, boxShadow:'0 20px 56px rgba(0,0,0,0.75)', animation:'dropIn 0.15s ease both', direction:'rtl' }}>
                  <div style={{ padding:'12px 14px 10px', borderBottom:`1px solid ${C.borderS}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontSize:13, fontWeight:600, color:C.t1, fontFamily:F }}>الإشعارات</span>
                    {unread>0 && <span style={{ fontSize:10, fontWeight:700, color:'#00AAFF', padding:'2px 7px', borderRadius:100, background:'rgba(0,170,255,0.10)', border:'1px solid rgba(0,170,255,0.20)', fontFamily:F }}>{unread} جديد</span>}
                  </div>
                  <div className="ns" style={{ maxHeight:340, overflowY:'auto' }}>
                    {notifs.length>0 ? notifs.slice(0,10).map((n:any,i:number)=>{
                      const isUnread = !n.read_at
                      const dotColor = n.type==='ad_live'||n.type==='post_published'||n.type==='brand_analyzed'||n.type==='strategy_ready'||n.type==='platform_connected' ? '#22C55E' : n.type==='ad_rejected'||n.type==='post_failed'||n.type==='credits_low' ? '#EF4444' : n.type==='ad_performance' ? '#F59E0B' : n.type==='lead_captured' ? '#A78BFA' : '#00AAFF'
                      return (
                        <div key={n.id||i} onClick={()=>{if(n.link){setNotifOpen(false);router.push(n.link)}}}
                          style={{ display:'flex', gap:10, padding:'11px 14px', borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background 0.1s', cursor:n.link?'pointer':'default', background:isUnread?'rgba(255,255,255,0.02)':'transparent' }}
                          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)'}
                          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=isUnread?'rgba(255,255,255,0.02)':'transparent'}>
                          <div style={{ width:7, height:7, borderRadius:'50%', background:isUnread?dotColor:'rgba(255,255,255,0.15)', flexShrink:0, marginTop:5 }}/>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:12, color:isUnread?C.t2:'rgba(255,255,255,0.38)', lineHeight:1.55, fontFamily:F }}>{n.message||n.title}</div>
                            <div style={{ fontSize:10, color:C.t4, marginTop:3, fontFamily:F }}>{n.created_at?format(parseISO(n.created_at),'MMM d, h:mm a'):''}</div>
                          </div>
                        </div>
                      )
                    }) : (
                      <div style={{ padding:'28px 14px', textAlign:'center', fontSize:12, color:C.t3, lineHeight:1.7, fontFamily:F }}>كل شيء تمام 👌</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Lang toggle — switch to English */}
            <button
              onClick={() => setLang('en')}
              style={{ fontSize:13, color:'rgba(255,255,255,0.45)', background:'none', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:6, padding:'5px 12px', cursor:'pointer', transition:'all 0.2s', fontFamily:"'Geist', sans-serif" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.85)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.25)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.45)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.12)' }}>
              English
            </button>

            {/* Chat toggle */}
            <button className="tb-btn" onClick={()=>setChatOpen(o=>!o)}
              style={{ width:34, height:34, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background:chatOpen?C.cyanD:'rgba(255,255,255,0.05)', border:`1px solid ${chatOpen?C.cyanB:'rgba(255,255,255,0.10)'}`, color:chatOpen?C.cyan:'rgba(255,255,255,0.55)', cursor:'pointer', transition:'all 0.15s' }}>
              {Ic.chat}
            </button>

            {/* User pill */}
            <div style={{ position:'relative' }} data-dd>
              <div onClick={()=>{setPillOpen(o=>!o);setNotifOpen(false)}}
                style={{ display:'flex', alignItems:'center', gap:7, padding:'4px 9px 4px 5px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:9, cursor:'pointer', transition:'all 0.15s', direction:'rtl' }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.10)'}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.05)'}>
                <div style={{ width:24, height:24, borderRadius:6, background:avatarUrl?'transparent':`linear-gradient(135deg,${C.cyan},#0055AA)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff', flexShrink:0, fontFamily:F, overflow:'hidden' }}>{avatarUrl?<img src={avatarUrl} alt={initial} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:initial}</div>
                <div style={{ lineHeight:1 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.88)', fontFamily:F }}>{firstName}</div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.40)', marginTop:2, textTransform:'capitalize', fontFamily:F }}>{workspace?.plan||'spark'}</div>
                </div>
                <span style={{ color:'rgba(255,255,255,0.30)', display:'flex', transform:pillOpen?'rotate(180deg)':'none', transition:'transform 0.15s' }}>{Ic.chevron}</span>
              </div>
              {pillOpen && (
                <div style={{ position:'absolute', top:'calc(100% + 8px)', left:0, background:C.over, border:`1px solid ${C.border}`, borderRadius:12, padding:5, minWidth:210, zIndex:9999, boxShadow:'0 20px 56px rgba(0,0,0,0.80)', animation:'dropIn 0.15s ease both', direction:'rtl' }}>
                  <div style={{ padding:'10px 12px 11px', borderBottom:`1px solid ${C.borderS}`, marginBottom:4, display:'flex', alignItems:'center', gap:9 }}>
                    <div style={{ width:30, height:30, borderRadius:8, background:avatarUrl?'transparent':`linear-gradient(135deg,${C.cyan},#0055AA)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0, fontFamily:F, overflow:'hidden' }}>{avatarUrl?<img src={avatarUrl} alt={initial} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:initial}</div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:C.t1, lineHeight:1, fontFamily:F }}>{user?.full_name||'المستخدم'}</div>
                      <div style={{ fontSize:10, color:C.t3, marginTop:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:140, fontFamily:F }}>{user?.email}</div>
                    </div>
                  </div>
                  {[
                    { l:'الحساب الشخصي', h:'/dashboard/settings?tab=profile',   i:Ic.user           },
                    { l:'مساحة العمل',   h:'/dashboard/settings?tab=workspace', i:NAV_ICONS.settings },
                    { l:'الفوترة',       h:'/dashboard/settings?tab=billing',   i:Ic.billing        },
                  ].map(x=>(
                    <a key={x.l} href={x.h} onClick={()=>setPillOpen(false)} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 11px', borderRadius:7, fontSize:12, color:C.t2, textDecoration:'none', transition:'all 0.12s', fontFamily:F }} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.06)';(e.currentTarget as HTMLElement).style.color=C.t1}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='transparent';(e.currentTarget as HTMLElement).style.color=C.t2}}>
                      <span style={{ color:C.t3, display:'flex' }}>{x.i}</span>{x.l}
                    </a>
                  ))}
                  <div style={{ height:1, background:C.borderS, margin:'4px 0' }}/>
                  <button onClick={signOut} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 11px', borderRadius:7, fontSize:12, color:'#EF4444', background:'transparent', border:'none', cursor:'pointer', width:'100%', textAlign:'right', fontFamily:F, transition:'background 0.12s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.08)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <span style={{ display:'flex' }}>{Ic.signout}</span>تسجيل الخروج
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main style={{ flex:1, overflowY:'auto', position:'relative', background:C.bg }}>
          {children}
        </main>
      </div>

      {/* ── CHAT PANEL ── */}
      {chatOpen && !isNarrow && (
        <div style={{ display:'flex', flexDirection:'column', borderRight:`1px solid ${C.border}`, background:C.surface, overflow:'hidden', width:320, minWidth:320 }}>

          <div style={{ height:54, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', borderBottom:`1px solid ${C.borderS}`, flexShrink:0, direction:'rtl' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:20, height:20, borderRadius:5, overflow:'hidden', border:`1px solid ${C.borderS}`, flexShrink:0 }}>
                <img src="/favicon.png" alt="Nexa" width={20} height={20} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:C.t1, lineHeight:1, fontFamily:F }}>Nexa AI</div>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:3 }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:'#22C55E' }}/>
                  <span style={{ fontSize:10, color:C.t3, fontFamily:F }}>متصل</span>
                </div>
              </div>
            </div>
            <button onClick={()=>setChatOpen(false)} style={{ width:26, height:26, borderRadius:6, background:'transparent', border:'none', color:C.t3, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.12s' }} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.07)';(e.currentTarget as HTMLElement).style.color=C.t1}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='transparent';(e.currentTarget as HTMLElement).style.color=C.t3}}>{Ic.close}</button>
          </div>

          <div className="ns" style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:16 }}>
            {msgs.map((m,i)=>(
              <div key={i} style={{ display:'flex', flexDirection:'column', gap:5, animation:'msgIn 0.2s ease both', alignItems:m.role==='user'?'flex-start':'flex-end' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, flexDirection:m.role==='user'?'row-reverse':'row' }}>
                  {m.role==='assistant'
                    ? <div style={{ width:20, height:20, borderRadius:5, overflow:'hidden', border:`1px solid ${C.borderS}`, flexShrink:0 }}><img src="/favicon.png" alt="Nexa" width={20} height={20} style={{ width:'100%', height:'100%', objectFit:'cover' }}/></div>
                    : <div style={{ width:20, height:20, borderRadius:5, background:avatarUrl?'transparent':`linear-gradient(135deg,${C.cyan},#0055AA)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, color:'#fff', flexShrink:0, fontFamily:F, overflow:'hidden' }}>{avatarUrl?<img src={avatarUrl} alt={initial} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:initial}</div>
                  }
                  <span style={{ fontSize:10, fontWeight:600, color:C.t4, fontFamily:F }}>{m.role==='assistant'?'Nexa':firstName}</span>
                </div>
                {m.role==='assistant'
                  ? <div className="nexa-msg-ai" style={{ paddingRight:26 }} dangerouslySetInnerHTML={{ __html:String(marked.parse(m.content)) }}/>
                  : <div style={{ maxWidth:'88%', padding:'9px 13px', borderRadius:'3px 14px 14px 14px', background:C.cyanD, border:`1px solid ${C.cyanB}`, fontSize:13, color:C.t1, lineHeight:1.65, direction:'rtl', textAlign:'right', fontFamily:F }}>{m.content}</div>
                }
              </div>
            ))}
            {chatLoading && (
              <div style={{ display:'flex', flexDirection:'column', gap:5, alignItems:'flex-end' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:20, height:20, borderRadius:5, overflow:'hidden', border:`1px solid ${C.borderS}`, flexShrink:0 }}><img src="/favicon.png" alt="Nexa" width={20} height={20} style={{ width:'100%', height:'100%', objectFit:'cover' }}/></div>
                  <span style={{ fontSize:10, fontWeight:600, color:C.t4, fontFamily:F }}>Nexa</span>
                </div>
                <div style={{ paddingRight:26, display:'flex', gap:4, alignItems:'center', height:24 }}>
                  {[0,1,2].map(j=><div key={j} style={{ width:5, height:5, borderRadius:'50%', background:'rgba(0,170,255,0.6)', animation:`pulse-dot 1.2s ease-in-out ${j*0.2}s infinite` }}/>)}
                </div>
              </div>
            )}
            <div ref={endRef}/>
          </div>

          <div style={{ padding:'8px 14px', borderTop:`1px solid ${C.borderS}`, display:'flex', gap:4, flexWrap:'wrap', direction:'rtl' }}>
            {QUICK.map(q=>(
              <button key={q} onClick={()=>setInput(q)} style={{ padding:'4px 10px', fontSize:11, fontWeight:500, color:C.t3, background:'transparent', border:`1px solid ${C.borderS}`, borderRadius:100, cursor:'pointer', fontFamily:F, transition:'all 0.14s', whiteSpace:'nowrap' }} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color=C.cyan;(e.currentTarget as HTMLElement).style.borderColor=C.cyanB;(e.currentTarget as HTMLElement).style.background=C.cyanD}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color=C.t3;(e.currentTarget as HTMLElement).style.borderColor=C.borderS;(e.currentTarget as HTMLElement).style.background='transparent'}}>
                {q}
              </button>
            ))}
          </div>

          {files.length>0 && (
            <div style={{ padding:'6px 14px', borderTop:`1px solid ${C.borderS}`, display:'flex', gap:5, flexWrap:'wrap', direction:'rtl' }}>
              {files.map((f,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 9px', background:C.cyanD, border:`1px solid ${C.cyanB}`, borderRadius:6, fontSize:11 }}>
                  <span style={{ color:C.cyan, display:'flex' }}>{Ic.clip}</span>
                  <span style={{ color:C.t2, maxWidth:80, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:F }}>{f.name}</span>
                  <button onClick={()=>setFiles(prev=>prev.filter((_,j)=>j!==i))} style={{ background:'none', border:'none', color:C.t4, cursor:'pointer', padding:0, display:'flex' }}>{Ic.close}</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ padding:'12px 14px 14px', borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border}`, borderRadius:12, padding:'10px 12px', transition:'all 0.15s', direction:'rtl' }}
              onFocusCapture={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.cyanB;(e.currentTarget as HTMLElement).style.boxShadow='0 0 0 3px rgba(0,170,255,0.06)'}}
              onBlurCapture={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.border;(e.currentTarget as HTMLElement).style.boxShadow='none'}}>
              <button onClick={()=>fileRef.current?.click()} style={{ background:'none', border:'none', color:C.t4, cursor:'pointer', display:'flex', padding:0, flexShrink:0, transition:'color 0.12s' }} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color=C.cyan} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color=C.t4}>{Ic.clip}</button>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" style={{ display:'none' }} onChange={e=>e.target.files?.[0]&&uploadFile(e.target.files[0])}/>
              <textarea
                value={input}
                onChange={e=>{setInput(e.target.value);e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,120)+'px'}}
                onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}}
                placeholder="أرسل Nexa أي شيء عن براندك..."
                rows={1}
                dir="rtl"
                style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:13, color:C.t1, fontFamily:F, resize:'none', lineHeight:1.6, maxHeight:120, overflowY:'auto', scrollbarWidth:'none' as any, direction:'rtl', textAlign:'right' }}
              />
              <button onClick={send} disabled={(!input.trim()&&files.length===0)||chatLoading} style={{ width:30, height:30, borderRadius:8, background:(input.trim()||files.length>0)?C.cyan:'rgba(255,255,255,0.05)', border:'none', cursor:(input.trim()||files.length>0)?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', color:(input.trim()||files.length>0)?'#fff':'rgba(255,255,255,0.18)', transition:'all 0.14s', flexShrink:0 }}>{Ic.send}</button>
            </div>
            <p style={{ fontSize:10, color:C.t4, textAlign:'center', marginTop:7, fontFamily:F }}>
              {uploading ? 'يقرأ الملف...' : 'Enter للإرسال · Shift+Enter سطر جديد'}
            </p>
          </div>
        </div>
      )}

      {showTour && <NexaTour onClose={dismissTour}/>}

      {/* ── TOP-UP MODAL ── */}
      {topupOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(14px)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={e=>{ if(e.target===e.currentTarget) setTopupOpen(false) }}>
          <div style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.12)', borderRadius:20, padding:28, width:'100%', maxWidth:460, boxShadow:'0 32px 80px rgba(0,0,0,0.7)', direction:'rtl', fontFamily:F }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
              <div>
                <div style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:4, fontFamily:F }}>أضف رصيداً</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', fontFamily:F }}>
                  {(()=>{ const _mt=getCreditThresholds(PLAN_CREDITS[workspace?.plan||'spark']||PLAN_CREDITS.spark); return (<>رصيدك الحالي <span style={{ fontFamily:MONO, color:credits<=_mt.CRITICAL?'#EF4444':credits<=_mt.LOW?'#F59E0B':'#fff', fontWeight:600 }}>{credits.toLocaleString()}</span> كريديت</>)})()}
                </div>
              </div>
              <button onClick={()=>setTopupOpen(false)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.35)', cursor:'pointer', fontSize:18, padding:'2px 6px', lineHeight:1 }}>✕</button>
            </div>

            <div style={{ padding:'12px 14px', background:'rgba(0,170,255,0.06)', border:'1px solid rgba(0,170,255,0.15)', borderRadius:10, marginBottom:20 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'rgba(0,170,255,0.8)', marginBottom:8, fontFamily:F }}>تكلفة الرصيد لكل عملية</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 16px' }}>
                {CREDIT_COSTS.map(([label,cost])=>(
                  <div key={label} style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'rgba(255,255,255,0.55)', fontFamily:F }}>
                    <span>{label}</span>
                    <span style={{ fontFamily:MONO, color:'rgba(255,255,255,0.8)' }}>{cost}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
              {(TOPUP_PACKS_BY_PLAN[workspace?.plan as keyof typeof TOPUP_PACKS_BY_PLAN]||TOPUP_PACKS_BY_PLAN.spark).map(pack=>{ const cinemaVids=Math.floor(pack.credits/138); return (
                <button key={pack.credits}
                  onClick={async()=>{
                    if(topupLoading) return
                    setTopupLoading(true)
                    try {
                      const r = await fetch('/api/create-checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspace_id:workspace.id,top_up_credits:pack.credits})})
                      const d = await r.json()
                      if(d.url) window.location.href=d.url
                    } catch {}
                    setTopupLoading(false)
                  }}
                  style={{ padding:'14px 12px', background:pack.tag?'rgba(0,170,255,0.08)':'rgba(255,255,255,0.04)', border:`1px solid ${pack.tag?'rgba(0,170,255,0.25)':'rgba(255,255,255,0.10)'}`, borderRadius:12, cursor:'pointer', textAlign:'right' as const, transition:'all 0.15s', position:'relative' as const }}>
                  {pack.tag && <div style={{ position:'absolute' as const, top:-8, left:10, fontSize:9, fontWeight:700, color:'#00AAFF', background:'rgba(0,170,255,0.15)', border:'1px solid rgba(0,170,255,0.3)', borderRadius:99, padding:'2px 8px', fontFamily:F, letterSpacing:0 }}>{pack.tag === 'Quick boost' ? 'شحن سريع' : pack.tag === 'Best value' ? 'الأوفر' : pack.tag}</div>}
                  <div style={{ fontSize:18, fontWeight:700, color:'#fff', lineHeight:1, marginBottom:4, fontFamily:F, letterSpacing:0 }}>{pack.label}</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:6, fontFamily:F, letterSpacing:0 }}>{cinemaVids>0?`~${cinemaVids} فيديو سينمائي أو `:''}~{Math.floor(pack.credits/3)} منشور</div>
                  <div style={{ fontSize:15, fontWeight:600, color:'#00AAFF', fontFamily:MONO }}>${(pack.price/100).toFixed(0)}</div>
                </button>
              )})}
            </div>

            <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)', textAlign:'center' as const, fontFamily:F }}>دفعة واحدة · رصيد لا ينتهي</div>
          </div>
        </div>
      )}
    </div>
  )
}
