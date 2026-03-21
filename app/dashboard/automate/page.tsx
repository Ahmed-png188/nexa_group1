'use client'
import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type View     = 'sequences' | 'contacts' | 'compose'
type Contact  = { id:string; email:string; name:string; company:string; tags:string[]; status:string; source:string }
type Sequence = { id:string; name:string; status:string; created_at:string; steps?:any[]; emails_sent?:number }

const F    = "'Geist', -apple-system, sans-serif"
const MONO = "'Geist Mono', monospace"
const CYAN = '#00AAFF'

// ── Upgrade gate — exact agency page pattern (cyan-header.png background) ──
function UpgradeGate({ feature, requiredPlan }: { feature:string; requiredPlan:string }) {
  const plans: Record<string,{ price:string; label:string; tagline:string; features:{ icon:any; title:string; desc:string }[] }> = {
    grow: {
      price:'$89/mo', label:'Grow', tagline:'The Grower',
      features:[
        {
          icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.37"/></svg>,
          title:'AI email sequences',
          desc:'Brand-voice emails written automatically and sent to your list on autopilot',
        },
        {
          icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
          title:'2,500 contacts',
          desc:'Import, segment, and auto-enroll contacts from your lead forms',
        },
        {
          icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>,
          title:'Amplify (Meta Ads)',
          desc:'Launch real Meta campaigns powered by your Brand Brain — no agency needed',
        },
      ],
    },
  }
  const plan = plans[requiredPlan] || plans.grow

  return (
    <div style={{
      flex:1,
      backgroundImage:'url(/cyan-header.png)',
      backgroundSize:'cover',
      backgroundPosition:'center',
      display:'flex',
      flexDirection:'column' as const,
      alignItems:'center',
      justifyContent:'center',
      padding:'60px 32px',
      position:'relative',
      overflow:'hidden',
    }}>
      <div style={{ position:'relative', zIndex:1, textAlign:'center' as const, maxWidth:620, animation:'pageUp 0.4s cubic-bezier(0.22,1,0.36,1) both' }}>

        {/* Top pill badge */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'6px 14px', borderRadius:999, background:'rgba(0,0,0,0.12)', border:'1px solid rgba(0,0,0,0.16)', marginBottom:32, backdropFilter:'blur(8px)' }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'rgba(0,0,0,0.45)' }}/>
          <span style={{ fontSize:12, fontWeight:600, color:'rgba(0,0,0,0.65)', letterSpacing:'0.02em' }}>
            {feature} &middot; {plan.label} plan required
          </span>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize:'clamp(30px,5vw,50px)', fontWeight:800, letterSpacing:'-0.04em', color:'#0C0C0C', lineHeight:1.1, marginBottom:16, fontFamily:'var(--sans)' }}>
          Automate your emails.<br/>Grow your audience.
        </h1>

        {/* Sub */}
        <p style={{ fontSize:16, color:'rgba(0,0,0,0.52)', lineHeight:1.75, maxWidth:480, margin:'0 auto 40px', fontFamily:'var(--sans)' }}>
          AI writes every email in your brand voice, sends them on the right day, and enrolls new leads automatically — without you lifting a finger.
        </p>

        {/* Feature cards — glassmorphic, exact agency style */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:40 }}>
          {plan.features.map(f => (
            <div key={f.title} style={{ padding:'20px 18px', borderRadius:14, background:'rgba(255,255,255,0.72)', border:'1px solid rgba(255,255,255,0.90)', backdropFilter:'blur(16px)', textAlign:'left' as const }}>
              <div style={{ color:'rgba(0,0,0,0.55)', marginBottom:12, display:'flex' }}>{f.icon}</div>
              <div style={{ fontSize:14, fontWeight:700, color:'#0C0C0C', marginBottom:6, letterSpacing:'-0.02em', fontFamily:'var(--sans)' }}>{f.title}</div>
              <div style={{ fontSize:12, color:'rgba(0,0,0,0.50)', lineHeight:1.65, fontFamily:'var(--sans)' }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* CTA — exact agency black button */}
        <a
          href="/dashboard/settings?tab=billing"
          style={{ display:'inline-flex', alignItems:'center', gap:9, padding:'14px 32px', fontSize:15, fontWeight:700, fontFamily:'var(--sans)', letterSpacing:'-0.02em', background:'#0C0C0C', color:'#ffffff', borderRadius:12, textDecoration:'none', boxShadow:'0 4px 24px rgba(0,0,0,0.30)', transition:'all 0.18s' }}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='#1a1a1a';(e.currentTarget as HTMLElement).style.transform='translateY(-2px)'}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#0C0C0C';(e.currentTarget as HTMLElement).style.transform='none'}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          Upgrade to {plan.label}
        </a>

        <div style={{ marginTop:14, fontSize:12, color:'rgba(0,0,0,0.45)', fontFamily:'var(--sans)' }}>
          {plan.price} &middot; Cancel anytime &middot; No setup fees
        </div>

      </div>
    </div>
  )
}

const Ic = {
  bolt:    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  seq:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.37"/></svg>,
  users:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  compose: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  upload:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  dl:      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  arrow:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  check:   <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  link:    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  send:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
}

function Label({ children }: { children: any }) {
  return <div style={{ fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' as const, color:'rgba(0,170,255,0.70)', marginBottom:'8px', fontFamily:F }}>{children}</div>
}

export default function AutomatePage() {
  const supabase = createClient()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [loading,          setLoading]          = useState(true)
  const [view,             setView]             = useState<View>('sequences')
  const [workspaceId,      setWorkspaceId]      = useState<string|null>(null)
  const [contacts,         setContacts]         = useState<Contact[]>([])
  const [hasSequences,     setHasSequences]     = useState(false)  // plan gate
  const [hasAmplify,       setHasAmplify]       = useState(false)
  const [editingSenderName,setEditingSenderName]= useState(false)
  const [senderNameDraft,  setSenderNameDraft]  = useState('')
  const [sequences,        setSequences]        = useState<Sequence[]>([])
  const [selectedSeq,      setSelectedSeq]      = useState<any>(null)
  const [seqSteps,         setSeqSteps]         = useState<any[]>([])
  const [enrollSelected,   setEnrollSelected]   = useState<string[]>([])
  const [showEnrollModal,  setShowEnrollModal]  = useState(false)
  const [enrolling,        setEnrolling]        = useState(false)
  const [editingStepId,    setEditingStepId]    = useState<string|null>(null)
  const [editSubject,      setEditSubject]      = useState('')
  const [editBody,         setEditBody]         = useState('')
  const [showAiModal,      setShowAiModal]      = useState(false)
  const [aiGoal,           setAiGoal]           = useState('')
  const [aiType,           setAiType]           = useState('default')
  const [aiEmails,         setAiEmails]         = useState(5)
  const [seqGenerating,    setSeqGenerating]    = useState(false)
  const [seqGenError,      setSeqGenError]      = useState<string|null>(null)
  const [csvImporting,     setCsvImporting]     = useState(false)
  const [senderEmail,      setSenderEmail]      = useState('hello@nexaa.cc')
  const [senderName,       setSenderName]       = useState('')
  const [showLinkModal,    setShowLinkModal]    = useState(false)
  const [linkSequenceId,   setLinkSequenceId]   = useState('')
  const [linkSaving,       setLinkSaving]       = useState(false)
  const [currentLinkSeqId, setCurrentLinkSeqId] = useState<string|null>(null)

  // Compose state
  const [composeTo,        setComposeTo]        = useState('')
  const [composeSubject,   setComposeSubject]   = useState('')
  const [composeBody,      setComposeBody]      = useState('')
  const [composeContext,   setComposeContext]   = useState('')
  const [composeSending,   setComposeSending]   = useState(false)
  const [composeWriting,   setComposeWriting]   = useState(false)
  const [composeSent,      setComposeSent]      = useState(false)
  const [composeError,     setComposeError]     = useState<string|null>(null)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: member } = await supabase.from('workspace_members').select('workspace_id').eq('user_id', user.id).single()
    if (!member) return
    const wsId = (member as any).workspace_id
    setWorkspaceId(wsId)

    const [{ data: ws }, { data: cts }, { data: seqs }] = await Promise.all([
      supabase.from('workspaces').select('sender_name,sender_email,brand_name,name,lead_page_sequence_id').eq('id', wsId).single(),
      supabase.from('contacts').select('*').eq('workspace_id', wsId).order('created_at', { ascending: false }),
      supabase.from('email_sequences').select('*').eq('workspace_id', wsId).order('created_at', { ascending: false }),
    ])

    setContacts((cts ?? []) as Contact[])
    setSequences((seqs ?? []) as Sequence[])
    if ((ws as any)?.sender_email) setSenderEmail((ws as any).sender_email)
    const resolvedName = (ws as any)?.sender_name || (ws as any)?.brand_name || (ws as any)?.name || ''
    if (resolvedName) { setSenderName(resolvedName); setSenderNameDraft(resolvedName) }
    if ((ws as any)?.lead_page_sequence_id) setCurrentLinkSeqId((ws as any).lead_page_sequence_id)
    // Plan gate
    const plan   = (ws as any)?.plan   ?? 'spark'
    const status = (ws as any)?.plan_status ?? 'trialing'
    const isTrial = status === 'trialing'
    const trialExpired = isTrial && (new Date() > new Date(new Date((ws as any)?.created_at).getTime()+7*86400000))
    const isActive = !trialExpired
    const seqPlans = ['grow','scale','agency']
    setHasSequences(isActive && seqPlans.includes(plan))
    setHasAmplify(isActive && seqPlans.includes(plan))
    setLoading(false)
  }

  async function handleCSVImport(file: File) {
    if (!workspaceId) return
    setCsvImporting(true)
    const text = await file.text()
    const lines = text.split('\n').filter(Boolean)
    const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase().replace(/"/g,''))
    const rows = lines.slice(1).map((line: string) => {
      const vals = line.split(',').map((v: string) => v.trim().replace(/"/g,''))
      const obj: Record<string,string> = {}
      headers.forEach((h: string, i: number) => { obj[h] = vals[i] || '' })
      return obj
    }).filter((r: Record<string,string>) => r.email?.includes('@'))

    const records = rows.map((r: Record<string,string>) => ({
      workspace_id: workspaceId,
      email:        r.email?.toLowerCase(),
      name:         r.name || r['full name'] || r.first_name || r.email?.split('@')[0],
      first_name:   r.first_name || r.name?.split(' ')[0] || '',
      last_name:    r.last_name  || r.name?.split(' ').slice(1).join(' ') || '',
      company:      r.company || r.organization || '',
      source:       'csv_import',
      tags:         ['imported'],
      status:       'active',
    }))

    await supabase.from('contacts').upsert(records, { onConflict: 'workspace_id,email' })
    const { data } = await supabase.from('contacts').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false })
    setContacts((data ?? []) as Contact[])
    setCsvImporting(false)
  }

  function exportContacts() {
    if (!contacts.length) return
    const headers = ['Name','Email','Company','Source','Status','Tags']
    const rows = contacts.map((c: Contact) => [
      c.name||'', c.email, c.company||'', c.source||'', c.status,
      Array.isArray(c.tags) ? c.tags.join(';') : ''
    ])
    const csv = [headers, ...rows].map((r: string[]) => r.map((v: string) => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type:'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href=url; a.download='nexa-contacts.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    if (selectedSeq) setSeqSteps(selectedSeq.steps || [])
  }, [selectedSeq])

  async function saveLinkSequence() {
    if (!workspaceId) return
    setLinkSaving(true)
    await supabase.from('workspaces').update({
      lead_page_sequence_id: linkSequenceId || null,
      lead_page_auto_enroll: !!linkSequenceId,
    }).eq('id', workspaceId)
    setCurrentLinkSeqId(linkSequenceId || null)
    setShowLinkModal(false)
    setLinkSaving(false)
  }

  async function writeEmailWithAI() {
    if (!workspaceId || composeWriting) return
    setComposeWriting(true)
    try {
      const res = await fetch('/api/generate-content', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          type: 'email',
          prompt: `Write a professional one-off email.\nRecipient: ${composeTo || 'the recipient'}\nContext/goal: ${composeContext || composeSubject || 'general outreach'}\n\nRules:\n- Max 180 words\n- Human, direct, no filler phrases\n- No "I hope this email finds you well"\n- Write in first person as the brand\n\nReturn ONLY this format:\nSUBJECT: [subject line]\nBODY:\n[email body]`,
        }),
      })
      const d = await res.json()
      const text: string = d.content || d.text || ''
      const subjectMatch = text.match(/^SUBJECT:\s*(.+)/m)
      const bodyMatch = text.match(/^BODY:\s*([\s\S]+)/m)
      if (subjectMatch?.[1] && !composeSubject) setComposeSubject(subjectMatch[1].trim())
      if (bodyMatch?.[1]) setComposeBody(bodyMatch[1].trim())
    } catch {}
    setComposeWriting(false)
  }

  async function sendOneOffEmail() {
    if (!workspaceId || !composeTo || !composeSubject || !composeBody || composeSending) return
    setComposeSending(true); setComposeError(null)
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          to_emails: [{ email: composeTo.trim(), name: composeTo.split('@')[0] }],
          subject: composeSubject,
          body: composeBody,
          from_name: senderName,
          step_number: 1,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Send failed')
      setComposeSent(true)
      setTimeout(() => {
        setComposeSent(false); setComposeTo(''); setComposeSubject(''); setComposeBody(''); setComposeContext('')
        setView('sequences')
      }, 2500)
    } catch (e: any) {
      setComposeError(e.message || 'Failed to send')
    }
    setComposeSending(false)
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - var(--topbar-h))', background:'#0C0C0C' }}>
      <div className="nexa-spinner" style={{ width:18, height:18 }}/>
    </div>
  )

  return (
    <div style={{ display:'flex', height:'calc(100vh - var(--topbar-h))', overflow:'hidden', background:'#0C0C0C', fontFamily:F }}>

      {/* Sidebar */}
      <aside style={{ width:220, borderRight:'1px solid rgba(255,255,255,0.08)', display:'flex', flexDirection:'column', flexShrink:0, background:'#141414' }}>
        <div style={{ padding:'16px 12px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize:'9px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' as const, color:'rgba(0,170,255,0.55)', marginBottom:'8px', fontFamily:F }}>Sending as</div>
          <div style={{ padding:'10px 12px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px' }}>
            {editingSenderName ? (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <input value={senderNameDraft} onChange={e=>setSenderNameDraft(e.target.value)} autoFocus
                  style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(0,170,255,0.30)', borderRadius:5, padding:'4px 8px', fontSize:'11px', color:'#FFFFFF', fontFamily:F, outline:'none', width:'100%', boxSizing:'border-box' as const }}
                  onKeyDown={async e => {
                    if (e.key==='Enter') {
                      setSenderName(senderNameDraft)
                      setEditingSenderName(false)
                      if (workspaceId) await supabase.from('workspaces').update({ sender_name: senderNameDraft }).eq('id', workspaceId)
                    }
                    if (e.key==='Escape') { setSenderNameDraft(senderName); setEditingSenderName(false) }
                  }}/>
                <div style={{ display:'flex', gap:4 }}>
                  <button onClick={async()=>{ setSenderName(senderNameDraft); setEditingSenderName(false); if(workspaceId) await supabase.from('workspaces').update({sender_name:senderNameDraft}).eq('id',workspaceId) }}
                    style={{ flex:1, padding:'3px 0', background:'#FFFFFF', border:'none', borderRadius:4, fontSize:'10px', fontWeight:600, color:'#0C0C0C', cursor:'pointer', fontFamily:F }}>Save</button>
                  <button onClick={()=>{ setSenderNameDraft(senderName); setEditingSenderName(false) }}
                    style={{ flex:1, padding:'3px 0', background:'transparent', border:'1px solid rgba(255,255,255,0.10)', borderRadius:4, fontSize:'10px', color:'rgba(255,255,255,0.35)', cursor:'pointer', fontFamily:F }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:2 }}>
                  <div style={{ fontSize:'12px', fontWeight:600, color:'rgba(255,255,255,0.80)', fontFamily:F }}>{senderName || 'Set sender name'}</div>
                  <button onClick={()=>{ setSenderNameDraft(senderName); setEditingSenderName(true) }}
                    style={{ background:'transparent', border:'none', cursor:'pointer', padding:0, fontSize:'10px', color:'rgba(255,255,255,0.28)', fontFamily:F }}>Edit</button>
                </div>
                <div style={{ fontSize:'10px', color:'rgba(0,170,255,0.60)', fontFamily:MONO }}>{senderEmail}</div>
              </div>
            )}
          </div>
        </div>
        <nav style={{ padding:'10px 8px', display:'flex', flexDirection:'column', gap:'2px' }}>
          {([
            { id:'sequences' as View, label:'Sequences', count:sequences.filter(s=>s.status==='active').length, icon:Ic.seq },
            { id:'contacts'  as View, label:'Contacts',  count:contacts.length, icon:Ic.users },
            { id:'compose'   as View, label:'Write email', count:0, icon:Ic.compose },
          ]).map(item => (
            <button key={item.id} onClick={() => setView(item.id)}
              style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 10px', borderRadius:'8px', background:view===item.id?'rgba(0,170,255,0.08)':'transparent', border:`1px solid ${view===item.id?'rgba(0,170,255,0.18)':'transparent'}`, color:view===item.id?'#FFFFFF':'rgba(255,255,255,0.42)', cursor:'pointer', fontFamily:F, fontSize:'12px', fontWeight:view===item.id?600:400, transition:'all 0.15s', textAlign:'left' as const, width:'100%' }}>
              <span style={{ display:'flex', opacity:view===item.id?1:0.5 }}>{item.icon}</span>
              <span style={{ flex:1 }}>{item.label}</span>
              {item.count > 0 && <span style={{ padding:'1px 6px', background:'rgba(0,170,255,0.12)', borderRadius:'100px', fontSize:'10px', fontWeight:700, color:'#00AAFF', fontFamily:MONO }}>{item.count}</span>}
            </button>
          ))}
        </nav>
        <div style={{ padding:'10px 12px', borderTop:'1px solid rgba(255,255,255,0.07)', marginTop:'auto' }}>
          <div style={{ fontSize:'9px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' as const, color:'rgba(0,170,255,0.55)', marginBottom:'8px', fontFamily:F }}>Lead form</div>
          <div style={{ padding:'10px 12px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px' }}>
            {currentLinkSeqId ? (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:4 }}>
                  <span style={{ display:'flex', color:'#22C55E' }}>{Ic.link}</span>
                  <div style={{ fontSize:'11px', fontWeight:600, color:'#22C55E', fontFamily:F }}>Auto-enroll on</div>
                </div>
                <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.30)', fontFamily:F, marginBottom:8, lineHeight:1.4 }}>
                  {sequences.find(s=>s.id===currentLinkSeqId)?.name || 'Linked'}
                </div>
                <button onClick={() => { setLinkSequenceId(currentLinkSeqId||''); setShowLinkModal(true) }}
                  style={{ fontSize:'10px', color:'rgba(255,255,255,0.35)', background:'transparent', border:'none', cursor:'pointer', fontFamily:F, padding:0 }}>
                  Change &rarr;
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.45)', fontFamily:F, marginBottom:8, lineHeight:1.4 }}>Link lead form to a sequence</div>
                <button onClick={() => { setLinkSequenceId(''); setShowLinkModal(true) }}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 10px', background:'rgba(0,170,255,0.08)', border:'1px solid rgba(0,170,255,0.18)', borderRadius:'6px', fontSize:'11px', fontWeight:600, color:'#00AAFF', cursor:'pointer', fontFamily:F }}>
                  <span style={{ display:'flex' }}>{Ic.link}</span>Link sequence
                </button>
              </div>
            )}
          </div>
        </div>
        <div style={{ padding:'8px 12px 12px' }}>
          <button onClick={() => fileRef.current?.click()} disabled={csvImporting}
            style={{ display:'flex', alignItems:'center', gap:'7px', padding:'7px 10px', borderRadius:'7px', cursor:'pointer', border:'1px solid rgba(255,255,255,0.08)', background:'transparent', color:'rgba(255,255,255,0.35)', fontFamily:F, fontSize:'11px', width:'100%', transition:'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.70)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='transparent'; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.35)' }}>
            {csvImporting ? <div className="nexa-spinner" style={{ width:10, height:10 }}/> : <span style={{ display:'flex' }}>{Ic.upload}</span>}
            {csvImporting ? 'Importing\u2026' : 'Import CSV'}
          </button>
          <input ref={fileRef} type="file" accept=".csv" style={{ display:'none' }} onChange={e => { if(e.target.files?.[0]) handleCSVImport(e.target.files[0]) }}/>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* SEQUENCES */}
        {view === 'sequences' && (
          <div className="a-in" style={{ flex:1, display:'flex', overflow:'hidden' }}>
            {!hasSequences ? (
              <UpgradeGate feature="Email Sequences" requiredPlan="grow"/>
            ) : (<>
            <div style={{ width:260, borderRight:'1px solid rgba(255,255,255,0.08)', display:'flex', flexDirection:'column', flexShrink:0, background:'#141414' }}>
              <div style={{ padding:'16px 14px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' as const, color:'rgba(0,170,255,0.70)', marginBottom:'12px', fontFamily:F }}>Sequences</div>
                <button onClick={() => { setShowAiModal(true); setAiGoal(''); setSeqGenError(null) }}
                  style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'7px', padding:'10px', background:'rgba(0,170,255,0.08)', border:'1px solid rgba(0,170,255,0.22)', borderRadius:'8px', fontSize:'12px', fontFamily:F, fontWeight:600, color:'#00AAFF', cursor:'pointer', transition:'all 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='rgba(0,170,255,0.14)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='rgba(0,170,255,0.08)'}>
                  <span style={{ display:'flex' }}>{Ic.bolt}</span> New sequence with AI
                </button>
              </div>
              <div className="ns" style={{ flex:1, overflowY:'auto' }}>
                {sequences.length === 0 ? (
                  <div style={{ padding:'32px 16px', textAlign:'center' as const, fontSize:'12px', color:'rgba(255,255,255,0.22)', fontFamily:F, lineHeight:1.7 }}>No sequences yet.<br/>Create one with AI above.</div>
                ) : sequences.map(seq => (
                  <div key={seq.id} onClick={() => setSelectedSeq(seq)}
                    style={{ padding:'11px 14px', borderBottom:'1px solid rgba(255,255,255,0.05)', cursor:'pointer', background:selectedSeq?.id===seq.id?'rgba(0,170,255,0.08)':'transparent', borderLeft:`2px solid ${selectedSeq?.id===seq.id?'#00AAFF':'transparent'}`, transition:'all 0.12s' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'8px' }}>
                      <div style={{ fontSize:'12px', fontWeight:selectedSeq?.id===seq.id?600:500, color:selectedSeq?.id===seq.id?'#FFFFFF':'rgba(255,255,255,0.70)', fontFamily:F, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const, flex:1 }}>{seq.name}</div>
                      <span style={{ padding:'2px 7px', borderRadius:'4px', fontSize:'9px', fontWeight:600, fontFamily:F, flexShrink:0, textTransform:'uppercase' as const, letterSpacing:'0.04em', background:seq.status==='active'?'rgba(34,197,94,0.10)':'rgba(255,255,255,0.05)', border:`1px solid ${seq.status==='active'?'rgba(34,197,94,0.20)':'rgba(255,255,255,0.08)'}`, color:seq.status==='active'?'#22C55E':'rgba(255,255,255,0.30)' }}>{seq.status}</span>
                    </div>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.25)', marginTop:'3px', fontFamily:F }}>
                      {seq.steps?.length ?? 0} email{(seq.steps?.length??0)!==1?'s':''}{seq.emails_sent ? ` \u00b7 ${seq.emails_sent} sent` : ''}
                    </div>
                    {currentLinkSeqId===seq.id && <div style={{ fontSize:'10px', color:'rgba(0,170,255,0.55)', marginTop:2, fontFamily:F, display:'flex', alignItems:'center', gap:3 }}><span style={{ display:'flex' }}>{Ic.link}</span> Form auto-enroll</div>}
                  </div>
                ))}
              </div>
            </div>
            <div className="ns" style={{ flex:1, overflowY:'auto', background:'#0C0C0C' }}>
              {!selectedSeq ? (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', flexDirection:'column', gap:'14px' }}>
                  <div style={{ width:52, height:52, borderRadius:'14px', background:'rgba(0,170,255,0.06)', border:'1px solid rgba(0,170,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(0,170,255,0.50)' }}>{Ic.bolt}</div>
                  <div style={{ fontSize:'16px', fontWeight:600, color:'rgba(255,255,255,0.45)', fontFamily:F, letterSpacing:'-0.02em' }}>AI writes your sequences</div>
                  <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.22)', fontFamily:F, maxWidth:'260px', textAlign:'center' as const, lineHeight:1.7 }}>
                    Tell Nexa the goal and it writes every email in your brand voice, sent from <span style={{ color:'rgba(0,170,255,0.60)' }}>{senderEmail}</span>.
                  </div>
                  <button onClick={() => { setShowAiModal(true); setAiGoal(''); setSeqGenError(null) }}
                    style={{ display:'flex', alignItems:'center', gap:'7px', padding:'10px 20px', background:'rgba(0,170,255,0.08)', border:'1px solid rgba(0,170,255,0.22)', borderRadius:'9px', fontSize:'13px', fontFamily:F, fontWeight:600, color:'#00AAFF', cursor:'pointer' }}>
                    <span style={{ display:'flex' }}>{Ic.bolt}</span> Create your first sequence
                  </button>
                </div>
              ) : (
                <div style={{ padding:'28px 36px 48px', maxWidth:'660px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'28px' }}>
                    <div>
                      <h2 style={{ fontSize:'20px', fontWeight:700, color:'#FFFFFF', letterSpacing:'-0.03em', marginBottom:'5px', fontFamily:F }}>{selectedSeq.name}</h2>
                      <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)', fontFamily:F }}>
                        {seqSteps.length} email{seqSteps.length!==1?'s':''} &middot; <span style={{ color:selectedSeq.status==='active'?'#22C55E':'rgba(255,255,255,0.35)' }}>{selectedSeq.status}</span>
                        {(selectedSeq.emails_sent ?? 0) > 0 && <span style={{ marginLeft:8, color:'rgba(255,255,255,0.25)' }}>&middot; {selectedSeq.emails_sent} sent</span>}
                      </div>
                      <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.25)', marginTop:4, fontFamily:F }}>Sends from <span style={{ color:'rgba(0,170,255,0.55)', fontFamily:MONO }}>{senderEmail}</span></div>
                    </div>
                    <div style={{ display:'flex', gap:'8px' }}>
                      {selectedSeq.status==='active' && <>
                        <button onClick={() => setShowEnrollModal(true)}
                          style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 16px', background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.20)', borderRadius:'8px', fontSize:'12px', fontFamily:F, fontWeight:600, color:'#22C55E', cursor:'pointer' }}>
                          Enroll contacts <span style={{ display:'inline-flex' }}>{Ic.arrow}</span>
                        </button>
                        <button onClick={async () => {
                          await supabase.from('email_sequences').update({status:'paused'}).eq('id',selectedSeq.id)
                          setSelectedSeq((p:any)=>({...p,status:'paused'}))
                          setSequences(prev=>prev.map(s=>s.id===selectedSeq.id?{...s,status:'paused'}:s))
                        }} style={{ padding:'8px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'8px', fontSize:'12px', fontFamily:F, color:'rgba(255,255,255,0.45)', cursor:'pointer' }}>Pause</button>
                      </>}
                      {(selectedSeq.status==='draft'||selectedSeq.status==='paused') && seqSteps.length > 0 && (
                        <button onClick={async () => {
                          await supabase.from('email_sequences').update({status:'active'}).eq('id',selectedSeq.id)
                          setSelectedSeq((p:any)=>({...p,status:'active'}))
                          setSequences(prev=>prev.map(s=>s.id===selectedSeq.id?{...s,status:'active'}:s))
                        }} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 18px', background:'#FFFFFF', border:'none', borderRadius:'8px', fontSize:'12px', fontFamily:F, fontWeight:600, color:'#0C0C0C', cursor:'pointer' }}>
                          {selectedSeq.status==='paused'?'Resume':'Activate'} <span style={{ display:'inline-flex' }}>{Ic.arrow}</span>
                        </button>
                      )}
                    </div>
                  </div>
                  {seqSteps.length > 0 ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'24px' }}>
                      {seqSteps.map((step:any, i:number) => (
                        <div key={step.id||i}>
                          <div style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px', overflow:'hidden' }}>
                            <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:'10px', borderBottom:editingStepId===step.id?'1px solid rgba(255,255,255,0.08)':'none' }}>
                              <div style={{ width:28, height:28, borderRadius:'7px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,170,255,0.08)', border:'1px solid rgba(0,170,255,0.18)', color:'#00AAFF', fontSize:'11px', fontWeight:700, fontFamily:MONO }}>{String(i+1).padStart(2,'0')}</div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:'13px', fontWeight:600, color:'rgba(255,255,255,0.85)', fontFamily:F, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{step.subject||'Email subject'}</div>
                                <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.30)', fontFamily:F, marginTop:'1px', display:'flex', gap:8 }}>
                                  <span>{i===0?'Sends immediately':`Day ${step.delay_days} after enroll`}</span>
                                  {step.goal&&<span style={{ color:'rgba(0,170,255,0.45)' }}>&middot; {step.goal}</span>}
                                  {step.status==='sent'&&<span style={{ color:'#22C55E' }}>&middot; &check; sent ({step.sent_count||0})</span>}
                                </div>
                              </div>
                              <button onClick={() => { if(editingStepId===step.id){setEditingStepId(null)}else{setEditingStepId(step.id);setEditSubject(step.subject||'');setEditBody(step.body||'')} }}
                                style={{ padding:'4px 10px', background:'transparent', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'6px', fontSize:'11px', color:'rgba(255,255,255,0.35)', cursor:'pointer', fontFamily:F, flexShrink:0 }}>
                                {editingStepId===step.id?'Done':'Edit'}
                              </button>
                            </div>
                            {editingStepId===step.id && (
                              <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:'10px' }}>
                                <div><Label>Subject</Label>
                                  <input value={editSubject} onChange={e=>setEditSubject(e.target.value)}
                                    style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'7px', padding:'8px 12px', fontSize:'13px', color:'#FFFFFF', fontFamily:F, outline:'none', boxSizing:'border-box' as const }}
                                    onFocus={e=>e.target.style.borderColor='rgba(0,170,255,0.30)'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.10)'}/>
                                </div>
                                <div><Label>Body</Label>
                                  <textarea value={editBody} onChange={e=>setEditBody(e.target.value)} rows={8}
                                    style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'7px', padding:'10px 12px', fontSize:'13px', color:'#FFFFFF', fontFamily:F, outline:'none', resize:'vertical' as const, lineHeight:1.65, boxSizing:'border-box' as const }}
                                    onFocus={e=>e.target.style.borderColor='rgba(0,170,255,0.30)'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.10)'}/>
                                </div>
                                <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end' }}>
                                  <button onClick={async () => {
                                    const updated=seqSteps.map((s:any)=>s.id===step.id?{...s,subject:editSubject,body:editBody}:s)
                                    await supabase.from('email_sequences').update({steps:updated}).eq('id',selectedSeq.id)
                                    setSeqSteps(updated); setEditingStepId(null)
                                  }} style={{ padding:'7px 16px', background:'#FFFFFF', border:'none', borderRadius:'7px', fontSize:'12px', fontWeight:600, color:'#0C0C0C', cursor:'pointer', fontFamily:F }}>Save changes</button>
                                </div>
                              </div>
                            )}
                            {editingStepId!==step.id&&step.body&&(
                              <div style={{ padding:'0 16px 12px' }}>
                                <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)', lineHeight:1.6, fontFamily:F, display:'-webkit-box', overflow:'hidden', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as const }}>{step.body}</div>
                              </div>
                            )}
                          </div>
                          {i<seqSteps.length-1&&<div style={{ display:'flex', justifyContent:'center', padding:'4px 0' }}><div style={{ width:1, height:16, background:'rgba(0,170,255,0.20)' }}/></div>}
                        </div>
                      ))}
                    </div>
                  ) : <div style={{ textAlign:'center' as const, padding:'40px 0', color:'rgba(255,255,255,0.25)', fontSize:'13px', fontFamily:F }}>No emails yet.</div>}
                </div>
              )}
            </div>
            </>)}
          </div>
        )}

        {/* CONTACTS */}
        {view === 'contacts' && (
          <div className="ns a-in" style={{ flex:1, overflowY:'auto', padding:'28px 36px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
              <div>
                <h2 style={{ fontSize:'20px', fontWeight:600, color:'#FFFFFF', letterSpacing:'-0.03em', marginBottom:'4px', fontFamily:F }}>Contacts</h2>
                <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)', fontFamily:F }}>{contacts.length} total</div>
              </div>
              <div style={{ display:'flex', gap:'8px' }}>
                {contacts.length > 0 && (
                  <button onClick={exportContacts}
                    style={{ display:'flex', alignItems:'center', gap:'7px', padding:'9px 16px', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'8px', fontFamily:F, fontSize:'12px', fontWeight:500, color:'rgba(255,255,255,0.55)', cursor:'pointer' }}>
                    <span style={{ display:'flex' }}>{Ic.dl}</span>Export CSV
                  </button>
                )}
                <button onClick={() => fileRef.current?.click()}
                  style={{ display:'flex', alignItems:'center', gap:'7px', padding:'9px 18px', background:'#FFFFFF', border:'none', borderRadius:'8px', fontFamily:F, fontSize:'12px', fontWeight:600, color:'#0C0C0C', cursor:'pointer' }}>
                  <span style={{ display:'flex' }}>{Ic.upload}</span>Import CSV
                </button>
              </div>
            </div>
            {contacts.length === 0 ? (
              <div style={{ textAlign:'center' as const, padding:'64px 20px' }}>
                <div style={{ fontSize:'15px', fontWeight:600, color:'rgba(255,255,255,0.40)', marginBottom:'8px', fontFamily:F }}>No contacts yet</div>
                <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.22)', marginBottom:'24px', fontFamily:F, lineHeight:1.65 }}>Import a CSV or set up your lead form to collect contacts automatically</div>
                <button onClick={() => fileRef.current?.click()} style={{ padding:'10px 24px', background:'#FFFFFF', border:'none', borderRadius:'8px', fontFamily:F, fontSize:'13px', fontWeight:600, color:'#0C0C0C', cursor:'pointer' }}>Import CSV</button>
              </div>
            ) : (
              <div style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px', overflow:'hidden' }}>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1.2fr 1fr 0.8fr', padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.08)', fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' as const, color:'rgba(0,170,255,0.70)', fontFamily:F }}>
                  <div>Name</div><div>Email</div><div>Company</div><div>Source</div><div>Status</div>
                </div>
                {contacts.map((c:Contact) => (
                  <div key={c.id}
                    style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1.2fr 1fr 0.8fr', padding:'11px 16px', borderBottom:'1px solid rgba(255,255,255,0.05)', alignItems:'center', transition:'background 0.1s' }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.02)'}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                    <div style={{ fontSize:'13px', fontWeight:500, color:'rgba(255,255,255,0.80)', fontFamily:F }}>{c.name||'—'}</div>
                    <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.42)', fontFamily:F, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{c.email}</div>
                    <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.28)', fontFamily:F }}>{c.company||'—'}</div>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.28)', fontFamily:F }}>{c.source||'—'}</div>
                    <span style={{ padding:'2px 7px', background:c.status==='active'?'rgba(34,197,94,0.08)':'rgba(255,255,255,0.04)', border:`1px solid ${c.status==='active'?'rgba(34,197,94,0.16)':'rgba(255,255,255,0.08)'}`, borderRadius:'4px', fontSize:'10px', fontWeight:600, color:c.status==='active'?'#22C55E':'rgba(255,255,255,0.28)', fontFamily:F, width:'fit-content' }}>{c.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* COMPOSE */}
        {view === 'compose' && (
          <div className="ns a-in" style={{ flex:1, overflowY:'auto', padding:'32px 40px' }}>
            <div style={{ maxWidth:'600px', margin:'0 auto' }}>

              {/* Header */}
              <div style={{ marginBottom:'28px' }}>
                <h2 style={{ fontSize:'20px', fontWeight:700, color:'#FFFFFF', letterSpacing:'-0.03em', marginBottom:'5px', fontFamily:F }}>Write an email</h2>
                <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)', fontFamily:F }}>
                  Sends from <span style={{ color:'rgba(0,170,255,0.60)', fontFamily:MONO }}>{senderEmail}</span> &middot; Powered by Resend
                </div>
              </div>

              {/* Fields */}
              <div style={{ display:'flex', flexDirection:'column', gap:'14px', marginBottom:'20px' }}>

                {/* To */}
                <div>
                  <div style={{ fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' as const, color:'rgba(0,170,255,0.70)', marginBottom:'7px', fontFamily:F }}>To</div>
                  <input
                    value={composeTo} onChange={e => setComposeTo(e.target.value)}
                    placeholder="recipient@email.com"
                    type="email"
                    style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'9px', padding:'11px 14px', fontSize:'13px', color:'#FFFFFF', fontFamily:F, outline:'none', boxSizing:'border-box' as const, transition:'border-color 0.15s' }}
                    onFocus={e => e.target.style.borderColor='rgba(0,170,255,0.35)'}
                    onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.10)'}
                  />
                </div>

                {/* Subject */}
                <div>
                  <div style={{ fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' as const, color:'rgba(0,170,255,0.70)', marginBottom:'7px', fontFamily:F }}>Subject</div>
                  <input
                    value={composeSubject} onChange={e => setComposeSubject(e.target.value)}
                    placeholder="Email subject line"
                    style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'9px', padding:'11px 14px', fontSize:'13px', color:'#FFFFFF', fontFamily:F, outline:'none', boxSizing:'border-box' as const, transition:'border-color 0.15s' }}
                    onFocus={e => e.target.style.borderColor='rgba(0,170,255,0.35)'}
                    onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.10)'}
                  />
                </div>

                {/* Context hint for AI */}
                <div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'7px' }}>
                    <div style={{ fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' as const, color:'rgba(0,170,255,0.70)', fontFamily:F }}>What is this email about?</div>
                    <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.25)', fontFamily:F }}>Helps AI write better</span>
                  </div>
                  <input
                    value={composeContext} onChange={e => setComposeContext(e.target.value)}
                    placeholder="e.g. Follow up after our call about the new offer…"
                    style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'9px', padding:'11px 14px', fontSize:'13px', color:'#FFFFFF', fontFamily:F, outline:'none', boxSizing:'border-box' as const, transition:'border-color 0.15s' }}
                    onFocus={e => e.target.style.borderColor='rgba(0,170,255,0.35)'}
                    onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.10)'}
                  />
                </div>

                {/* Body */}
                <div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'7px' }}>
                    <div style={{ fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' as const, color:'rgba(0,170,255,0.70)', fontFamily:F }}>Message</div>
                    <button onClick={writeEmailWithAI} disabled={composeWriting}
                      style={{ display:'flex', alignItems:'center', gap:'6px', padding:'4px 12px', background:'rgba(0,170,255,0.08)', border:'1px solid rgba(0,170,255,0.22)', borderRadius:'6px', fontSize:'11px', fontWeight:600, color:composeWriting?'rgba(255,255,255,0.25)':'#00AAFF', cursor:composeWriting?'not-allowed':'pointer', fontFamily:F, transition:'all 0.15s' }}>
                      {composeWriting
                        ? <><div className="nexa-spinner" style={{ width:9, height:9 }}/> Writing&hellip;</>
                        : <><span style={{ display:'flex' }}>{Ic.bolt}</span> Write with AI</>
                      }
                    </button>
                  </div>
                  <textarea
                    value={composeBody} onChange={e => setComposeBody(e.target.value)}
                    placeholder="Write your message here, or use AI to draft it for you in your brand voice…"
                    rows={12}
                    style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'9px', padding:'12px 14px', fontSize:'13px', color:'#FFFFFF', fontFamily:F, outline:'none', resize:'vertical' as const, lineHeight:1.75, boxSizing:'border-box' as const, transition:'border-color 0.15s' }}
                    onFocus={e => e.target.style.borderColor='rgba(0,170,255,0.35)'}
                    onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.10)'}
                  />
                </div>
              </div>

              {/* Error */}
              {composeError && (
                <div style={{ padding:'10px 14px', background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.18)', borderRadius:'8px', fontSize:'12px', color:'rgba(239,68,68,0.85)', marginBottom:'16px', fontFamily:F }}>
                  {composeError}
                </div>
              )}

              {/* Actions */}
              <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
                {composeSent ? (
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 24px', background:'rgba(34,197,94,0.10)', border:'1px solid rgba(34,197,94,0.25)', borderRadius:'9px', fontSize:'13px', fontWeight:600, color:'#22C55E', fontFamily:F }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Email sent
                  </div>
                ) : (
                  <button onClick={sendOneOffEmail}
                    disabled={composeSending || !composeTo || !composeSubject || !composeBody}
                    style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 24px', background:composeSending||!composeTo||!composeSubject||!composeBody?'rgba(255,255,255,0.06)':'#FFFFFF', border:'none', borderRadius:'9px', fontSize:'13px', fontWeight:700, color:composeSending||!composeTo||!composeSubject||!composeBody?'rgba(255,255,255,0.20)':'#0C0C0C', cursor:composeSending||!composeTo||!composeSubject||!composeBody?'not-allowed':'pointer', fontFamily:F, transition:'all 0.15s' }}>
                    {composeSending
                      ? <><div className="nexa-spinner" style={{ width:13, height:13, borderColor:'rgba(0,0,0,0.15)', borderTopColor:'#0C0C0C' }}/> Sending&hellip;</>
                      : <><span style={{ display:'flex' }}>{Ic.send}</span> Send email</>
                    }
                  </button>
                )}
                <button onClick={() => { setComposeTo(''); setComposeSubject(''); setComposeBody(''); setComposeContext(''); setComposeError(null) }}
                  style={{ padding:'12px 18px', background:'transparent', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'9px', fontSize:'13px', color:'rgba(255,255,255,0.35)', cursor:'pointer', fontFamily:F }}>
                  Clear
                </button>
              </div>

              {/* Sender note */}
              <div style={{ marginTop:'16px', padding:'10px 14px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'8px', display:'flex', gap:'8px', alignItems:'flex-start' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" style={{ marginTop:1, flexShrink:0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.30)', lineHeight:1.65, fontFamily:F }}>
                  This email sends from <span style={{ color:'rgba(0,170,255,0.55)', fontFamily:MONO }}>{senderName} &lt;{senderEmail}&gt;</span> via Resend. Recipients can reply directly to your inbox if you set up reply-to in your domain settings.
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* Enroll Modal */}
      {showEnrollModal && selectedSeq && (
        <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.80)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={e=>{if(e.target===e.currentTarget){setShowEnrollModal(false);setEnrollSelected([])}}}>
          <div style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.12)', borderTop:'2px solid #00AAFF', borderRadius:'12px', padding:'24px', width:'100%', maxWidth:'440px', maxHeight:'80vh', overflow:'auto' }}>
            <h3 style={{ fontSize:'16px', fontWeight:600, color:'#FFFFFF', marginBottom:'4px', fontFamily:F }}>Enroll contacts</h3>
            <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.35)', fontFamily:F, marginBottom:'18px' }}>Select who to add to &ldquo;{selectedSeq.name}&rdquo;</div>
            {contacts.length===0 ? <div style={{ textAlign:'center' as const, padding:'24px 0', fontSize:'13px', color:'rgba(255,255,255,0.25)', fontFamily:F }}>No contacts yet.</div> : <>
              <div style={{ display:'flex', gap:'6px', marginBottom:'12px' }}>
                <button onClick={()=>setEnrollSelected(contacts.map(c=>c.id))} style={{ padding:'5px 12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'6px', fontSize:'11px', color:'rgba(255,255,255,0.50)', cursor:'pointer', fontFamily:F }}>Select all</button>
                <button onClick={()=>setEnrollSelected([])} style={{ padding:'5px 12px', background:'transparent', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'6px', fontSize:'11px', color:'rgba(255,255,255,0.28)', cursor:'pointer', fontFamily:F }}>Clear</button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'4px', maxHeight:'240px', overflowY:'auto', marginBottom:'18px' }}>
                {contacts.map((c:Contact)=>(
                  <div key={c.id} onClick={()=>setEnrollSelected(prev=>prev.includes(c.id)?prev.filter(id=>id!==c.id):[...prev,c.id])}
                    style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 12px', borderRadius:'8px', cursor:'pointer', background:enrollSelected.includes(c.id)?'rgba(0,170,255,0.08)':'rgba(255,255,255,0.02)', border:`1px solid ${enrollSelected.includes(c.id)?'rgba(0,170,255,0.20)':'rgba(255,255,255,0.07)'}`, transition:'all 0.1s' }}>
                    <div style={{ width:16, height:16, borderRadius:'4px', flexShrink:0, background:enrollSelected.includes(c.id)?'#00AAFF':'transparent', border:`1.5px solid ${enrollSelected.includes(c.id)?'#00AAFF':'rgba(255,255,255,0.20)'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {enrollSelected.includes(c.id)&&<span style={{ display:'flex', color:'#0C0C0C' }}>{Ic.check}</span>}
                    </div>
                    <div>
                      <div style={{ fontSize:'13px', fontWeight:500, color:'rgba(255,255,255,0.80)', fontFamily:F }}>{c.name}</div>
                      <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.28)', fontFamily:F }}>{c.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>}
            <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end' }}>
              <button onClick={()=>{setShowEnrollModal(false);setEnrollSelected([])}} style={{ padding:'9px 16px', background:'transparent', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'8px', fontSize:'12px', color:'rgba(255,255,255,0.40)', cursor:'pointer', fontFamily:F }}>Cancel</button>
              <button onClick={async()=>{
                if(!enrollSelected.length)return; setEnrolling(true)
                try{const res=await fetch('/api/email/sequences/enroll',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sequence_id:selectedSeq.id,contact_ids:enrollSelected})});if(res.ok){setShowEnrollModal(false);setEnrollSelected([])}}catch{}finally{setEnrolling(false)}
              }} disabled={!enrollSelected.length||enrolling}
                style={{ padding:'9px 20px', background:enrollSelected.length?'#FFFFFF':'rgba(255,255,255,0.06)', border:'none', borderRadius:'8px', fontFamily:F, fontSize:'13px', fontWeight:600, color:enrollSelected.length?'#0C0C0C':'rgba(255,255,255,0.20)', cursor:enrollSelected.length?'pointer':'not-allowed' }}>
                {enrolling?'Enrolling\u2026':`Enroll ${enrollSelected.length} \u2192`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Sequence Modal */}
      {showAiModal && (
        <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.80)', backdropFilter:'blur(14px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={e=>{if(e.target===e.currentTarget&&!seqGenerating)setShowAiModal(false)}}>
          <div style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.12)', borderTop:'2px solid #00AAFF', borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'500px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'24px' }}>
              <div style={{ width:36, height:36, borderRadius:'10px', background:'rgba(0,170,255,0.10)', border:'1px solid rgba(0,170,255,0.22)', display:'flex', alignItems:'center', justifyContent:'center', color:'#00AAFF' }}>{Ic.bolt}</div>
              <div>
                <div style={{ fontSize:'17px', fontWeight:700, color:'#FFFFFF', letterSpacing:'-0.03em', fontFamily:F }}>Create sequence with AI</div>
                <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)', fontFamily:F }}>Sends from <span style={{ color:'rgba(0,170,255,0.60)', fontFamily:MONO }}>{senderEmail}</span></div>
              </div>
            </div>
            <div style={{ marginBottom:'20px' }}>
              <Label>What is this sequence for?</Label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'7px' }}>
                {[{id:'welcome',label:'Welcome',desc:'New leads'},{id:'nurture',label:'Nurture',desc:'Build trust'},{id:'reengage',label:'Re-engage',desc:'Win back'},{id:'launch',label:'Launch',desc:'New offer'},{id:'sales',label:'Sales',desc:'Convert'},{id:'default',label:'Custom',desc:'Other goal'}].map(t=>(
                  <button key={t.id} onClick={()=>setAiType(t.id)}
                    style={{ padding:'10px 8px', borderRadius:'9px', background:aiType===t.id?'rgba(0,170,255,0.10)':'rgba(255,255,255,0.03)', border:`1px solid ${aiType===t.id?'rgba(0,170,255,0.35)':'rgba(255,255,255,0.08)'}`, cursor:'pointer', fontFamily:F, textAlign:'left' as const, transition:'all 0.15s' }}>
                    <div style={{ fontSize:'11px', fontWeight:600, color:aiType===t.id?'#FFFFFF':'rgba(255,255,255,0.60)' }}>{t.label}</div>
                    <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.28)', marginTop:2 }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:'16px' }}>
              <Label>What should it achieve?</Label>
              <textarea value={aiGoal} onChange={e=>setAiGoal(e.target.value)} rows={2}
                placeholder="e.g. Welcome new leads from the waitlist and get them excited about the launch..."
                style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'8px', padding:'10px 12px', fontSize:'13px', color:'#FFFFFF', fontFamily:F, outline:'none', resize:'none' as const, lineHeight:1.65, boxSizing:'border-box' as const }}
                onFocus={e=>e.target.style.borderColor='rgba(0,170,255,0.30)'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.10)'}/>
            </div>
            <div style={{ marginBottom:'20px' }}>
              <Label>Number of emails</Label>
              <div style={{ display:'flex', gap:'6px' }}>
                {[3,4,5].map(n=>(
                  <button key={n} onClick={()=>setAiEmails(n)}
                    style={{ padding:'7px 16px', borderRadius:'7px', fontSize:'13px', fontWeight:500, background:aiEmails===n?'rgba(0,170,255,0.10)':'rgba(255,255,255,0.04)', border:`1px solid ${aiEmails===n?'rgba(0,170,255,0.30)':'rgba(255,255,255,0.08)'}`, color:aiEmails===n?'#00AAFF':'rgba(255,255,255,0.45)', cursor:'pointer', fontFamily:F }}>
                    {n} emails
                  </button>
                ))}
              </div>
            </div>
            {seqGenError&&<div style={{ padding:'10px 14px', background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.18)', borderRadius:'8px', fontSize:'12px', color:'rgba(239,68,68,0.85)', marginBottom:'16px', fontFamily:F }}>{seqGenError}</div>}
            <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
              <button onClick={()=>setShowAiModal(false)} disabled={seqGenerating} style={{ padding:'10px 18px', background:'transparent', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'8px', fontSize:'13px', color:'rgba(255,255,255,0.40)', cursor:seqGenerating?'not-allowed':'pointer', fontFamily:F }}>Cancel</button>
              <button onClick={async()=>{
                if(!aiGoal.trim()||seqGenerating)return
                setSeqGenerating(true);setSeqGenError(null)
                try{
                  const res=await fetch('/api/create-sequence',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspace_id:workspaceId,name:aiGoal.trim().split(' ').slice(0,5).join(' '),goal:aiGoal.trim(),sequence_type:aiType,num_emails:aiEmails,generate_with_ai:true})})
                  const d=await res.json()
                  if(!res.ok)throw new Error(d.error||'Generation failed')
                  const newSeq={...d.sequence,steps:d.steps}
                  setSequences(prev=>[newSeq,...prev]);setSelectedSeq(newSeq);setSeqSteps(d.steps||[]);setShowAiModal(false)
                }catch(e:any){setSeqGenError(e.message||'Something went wrong.')}
                setSeqGenerating(false)
              }} disabled={!aiGoal.trim()||seqGenerating}
                style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 22px', background:aiGoal.trim()&&!seqGenerating?'#FFFFFF':'rgba(255,255,255,0.08)', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:700, color:aiGoal.trim()&&!seqGenerating?'#0C0C0C':'rgba(255,255,255,0.25)', cursor:aiGoal.trim()&&!seqGenerating?'pointer':'not-allowed', fontFamily:F }}>
                {seqGenerating?<><div className="nexa-spinner" style={{ width:13, height:13, borderColor:'rgba(0,0,0,0.15)', borderTopColor:'#0C0C0C' }}/>Writing&hellip;</>:<><span style={{ display:'flex' }}>{Ic.bolt}</span>Generate {aiEmails} emails &rarr;</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form-Sequence Link Modal */}
      {showLinkModal && (
        <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.80)', backdropFilter:'blur(14px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={e=>{if(e.target===e.currentTarget)setShowLinkModal(false)}}>
          <div style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.12)', borderTop:'2px solid #00AAFF', borderRadius:'14px', padding:'28px', width:'100%', maxWidth:'420px' }}>
            <div style={{ fontSize:'17px', fontWeight:700, color:'#FFFFFF', letterSpacing:'-0.03em', marginBottom:'6px', fontFamily:F }}>Link lead form to sequence</div>
            <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)', fontFamily:F, marginBottom:'20px', lineHeight:1.6 }}>
              When someone fills your lead page form, they&apos;ll be automatically enrolled. Emails send from <span style={{ color:'rgba(0,170,255,0.60)', fontFamily:MONO }}>{senderEmail}</span>.
            </div>
            <Label>Select an active sequence</Label>
            <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginBottom:'20px', maxHeight:240, overflowY:'auto' }}>
              {sequences.filter(s=>s.status==='active').length===0 ? (
                <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.30)', fontFamily:F, padding:'12px 0' }}>No active sequences. Activate one first.</div>
              ) : sequences.filter(s=>s.status==='active').map(s=>(
                <div key={s.id} onClick={()=>setLinkSequenceId(s.id)}
                  style={{ padding:'11px 14px', borderRadius:'9px', cursor:'pointer', background:linkSequenceId===s.id?'rgba(0,170,255,0.10)':'rgba(255,255,255,0.03)', border:`1px solid ${linkSequenceId===s.id?'rgba(0,170,255,0.30)':'rgba(255,255,255,0.08)'}`, transition:'all 0.15s' }}>
                  <div style={{ fontSize:'13px', fontWeight:600, color:linkSequenceId===s.id?'#FFFFFF':'rgba(255,255,255,0.65)', fontFamily:F }}>{s.name}</div>
                  <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.30)', fontFamily:F, marginTop:2 }}>{s.steps?.length??0} emails</div>
                </div>
              ))}
            </div>
            {currentLinkSeqId&&<button onClick={()=>setLinkSequenceId('')} style={{ fontSize:'12px', color:'rgba(239,68,68,0.60)', background:'transparent', border:'none', cursor:'pointer', fontFamily:F, padding:0, marginBottom:16, display:'block' }}>Remove link</button>}
            <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
              <button onClick={()=>setShowLinkModal(false)} style={{ padding:'9px 18px', background:'transparent', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'8px', fontSize:'13px', color:'rgba(255,255,255,0.40)', cursor:'pointer', fontFamily:F }}>Cancel</button>
              <button onClick={saveLinkSequence} disabled={linkSaving} style={{ padding:'9px 20px', background:'#FFFFFF', border:'none', borderRadius:'8px', fontFamily:F, fontSize:'13px', fontWeight:600, color:'#0C0C0C', cursor:linkSaving?'not-allowed':'pointer' }}>
                {linkSaving?'Saving\u2026':'Save link \u2192'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
