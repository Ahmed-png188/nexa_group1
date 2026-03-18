'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type View = 'inbox' | 'sent' | 'sequences' | 'contacts' | 'compose'
type Contact = { id: string; email: string; name: string; company: string; tags: string[]; status: string }
type EmailAccount = { id: string; email: string; name: string; provider: string }
type Sequence = { id: string; name: string; status: string; created_at: string }
type SentEmail = { id: string; to_email: string; subject: string; body: string; status: string; opened_count: number; sent_at: string; contact_id: string }
type InboxMessage = { id: string; threadId: string; subject: string; fromName: string; fromEmail: string; from: string; fromFull: string; date: string; snippet: string; unread: boolean }

export default function AutomatePage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('inbox')
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [emailAccount, setEmailAccount] = useState<EmailAccount | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([])
  const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(null)
  const [mounted, setMounted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Compose state
  const [composeTo, setComposeTo] = useState('')
  const [composeSubject, setComposeSubject] = useState('')
  const [composeBody, setComposeBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [writingEmail, setWritingEmail] = useState(false)
  const [gmailConnectError, setGmailConnectError] = useState<string | null>(null)

  // Brand Brain context panel
  const [showContextPanel, setShowContextPanel] = useState(false)
  const [emailObjective, setEmailObjective] = useState('')
  const [emailContext, setEmailContext] = useState('')

  // Inbox state
  const [inboxMessages, setInboxMessages] = useState<InboxMessage[]>([])
  const [inboxLoading, setInboxLoading] = useState(false)
  const [selectedInboxMessage, setSelectedInboxMessage] = useState<InboxMessage | null>(null)

  // Reply state
  const [replyBody, setReplyBody] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  // Sequence builder state
  const [selectedSequence, setSelectedSequence] = useState<any>(null)
  const [sequenceSteps, setSequenceSteps] = useState<any[]>([])
  const [newSequenceName, setNewSequenceName] = useState('')
  const [buildingStep, setBuildingStep] = useState(false)
  const [editingStep, setEditingStep] = useState<any>(null)

  // Enrollment state
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadData()
    const params = new URLSearchParams(window.location.search)
    if (params.get('gmail_connected') === 'true') {
      window.history.replaceState({}, '', '/dashboard/automate')
    }
    const gmailError = params.get('error')
    const gmailReason = params.get('reason')
    if (gmailError) {
      console.error('[Gmail] Connect error:', gmailError, gmailReason)
      setGmailConnectError(`Connection failed: ${gmailReason || gmailError}`)
    }
    // Brand Brain → Email deep link
    const urlView = params.get('view') as View | null
    const urlContext = params.get('context')
    const urlObjective = params.get('objective')
    if (urlView === 'compose') {
      setView('compose')
      if (urlContext) setEmailContext(decodeURIComponent(urlContext))
      if (urlObjective) setEmailObjective(decodeURIComponent(urlObjective))
      setShowContextPanel(true)
      window.history.replaceState({}, '', '/dashboard/automate')
    }
  }, [])

  useEffect(() => {
    if (view === 'inbox' && emailAccount) loadInbox()
  }, [view, emailAccount])

  async function loadInbox() {
    setInboxLoading(true)
    try {
      const res = await fetch('/api/email/inbox')
      const data = await res.json()
      setInboxMessages((data.messages || []).map((m: any) => ({
        ...m,
        from: m.fromName || m.fromEmail,
        fromFull: m.fromName ? `"${m.fromName}" <${m.fromEmail}>` : m.fromEmail,
      })))
    } catch (e) {
      console.error('[Inbox] Load error:', e instanceof Error ? e.message : 'Unknown')
    } finally {
      setInboxLoading(false)
    }
  }

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: member } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .single()
      if (!member) return
      setWorkspaceId(member.workspace_id)

      const [accountRes, contactsRes, seqRes, sentRes] = await Promise.all([
        supabase.from('email_accounts').select('*').eq('workspace_id', member.workspace_id).single(),
        supabase.from('contacts').select('*').eq('workspace_id', member.workspace_id).order('created_at', { ascending: false }).limit(100),
        supabase.from('email_sequences').select('*').eq('workspace_id', member.workspace_id).order('created_at', { ascending: false }),
        supabase.from('emails_sent').select('*').eq('workspace_id', member.workspace_id).order('sent_at', { ascending: false }).limit(50),
      ])

      setEmailAccount(accountRes.data)
      setContacts(contactsRes.data || [])
      setSequences(seqRes.data || [])
      setSentEmails(sentRes.data || [])
    } catch (e) {
      console.error('[Automate] Load error:', e instanceof Error ? e.message : 'Unknown')
    } finally {
      setLoading(false)
    }
  }

  async function handleSend() {
    if (!composeTo || !composeSubject || !composeBody) return
    setSending(true)
    setSendError(null)
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: composeTo, subject: composeSubject, body: composeBody }),
      })
      const data = await res.json()
      if (data.success) {
        setComposeTo('')
        setComposeSubject('')
        setComposeBody('')
        setView('sent')
        loadData()
      } else {
        const errMsg = data.error || 'Failed to send'
        const errCode = data.code ? ` (code: ${data.code})` : ''
        alert(`Email send failed: ${errMsg}${errCode}`)
        setSendError(errMsg)
      }
    } catch {
      alert('Email send failed: network error')
      setSendError('Failed to send email')
    } finally {
      setSending(false)
    }
  }

  async function handleReply() {
    if (!selectedInboxMessage || !replyBody.trim()) return
    setSendingReply(true)
    try {
      const res = await fetch('/api/email/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: selectedInboxMessage.threadId,
          to: selectedInboxMessage.fromFull,
          subject: `Re: ${selectedInboxMessage.subject}`,
          body: replyBody,
          messageId: selectedInboxMessage.id,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setReplyBody('')
        setSelectedInboxMessage(null)
        loadInbox()
      } else {
        alert('Reply failed: ' + (data.error || 'Unknown error'))
      }
    } catch (e) {
      console.error('[Reply]', e)
    } finally {
      setSendingReply(false)
    }
  }

  async function handleCSVImport(file: File) {
    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) return
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''))

    const parsed = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
      const obj: Record<string, string> = {}
      headers.forEach((h, i) => { obj[h] = values[i] || '' })
      return {
        email: obj.email || obj['e-mail'] || obj.mail || '',
        name: obj.name || obj['full name'] || `${obj['first name'] || ''} ${obj['last name'] || ''}`.trim() || '',
        first_name: obj['first name'] || obj.firstname || obj.first_name || '',
        last_name: obj['last name'] || obj.lastname || obj.last_name || '',
        company: obj.company || obj.organization || '',
        tags: [] as string[],
      }
    }).filter(c => c.email.includes('@'))

    const res = await fetch('/api/email/contacts/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contacts: parsed }),
    })
    const data = await res.json()
    if (data.success) {
      loadData()
      setView('contacts')
    }
  }

  async function writeWithBrandBrain(promptOverride?: string) {
    setShowContextPanel(false)
    setWritingEmail(true)
    const context = [emailObjective, emailContext].filter(Boolean).join(' — ')
    try {
      const message = promptOverride || `Write a professional outreach email in my exact brand voice.

Recipient: ${composeTo || 'the recipient'}
Objective: ${emailObjective || 'general outreach'}
Context/Topic: ${context || composeSubject || 'general outreach'}

Rules:
- No more than 150 words
- Conversational, direct, human tone
- Write as if I am writing it personally

Return your response in EXACTLY this format:
SUBJECT: [subject line here]
BODY:
[email body here]`

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId, message }),
      })
      const data = await res.json()
      const raw = data.reply || data.message || data.content || ''

      const subjectMatch = raw.match(/^SUBJECT:\s*(.+)$/im)
      const bodyMatch = raw.match(/^BODY:\s*\n([\s\S]+)$/im)

      const parsedSubject = subjectMatch?.[1]?.trim() || ''
      const cleaned = (bodyMatch?.[1] || raw)
        .replace(/^here'?s? (your |the )?email:?\s*/i, '')
        .replace(/^---+\s*/gm, '')
        .replace(/\*[^*]+\*/g, '')
        .replace(/^\s*drop in.*$/gim, '')
        .replace(/^subject:.*$/gim, '')
        .trim()

      if (view === 'inbox' && selectedInboxMessage) {
        setReplyBody(cleaned)
      } else {
        setComposeBody(cleaned)
        if (parsedSubject && !composeSubject) setComposeSubject(parsedSubject)
      }
    } catch (e) {
      console.error('[BrandBrain Email] Error:', e instanceof Error ? e.message : 'Unknown')
    } finally {
      setWritingEmail(false)
      if (!promptOverride) {
        setEmailObjective('')
        setEmailContext('')
      }
    }
  }

  // ── Sequence builder functions ──────────────────────────────────────────

  async function createSequence() {
    if (!newSequenceName.trim() || !workspaceId) return
    const { data } = await supabase
      .from('email_sequences')
      .insert({ workspace_id: workspaceId, name: newSequenceName, status: 'draft' })
      .select()
      .single()
    if (data) {
      setSequences(prev => [data, ...prev])
      setSelectedSequence(data)
      setSequenceSteps([])
      setNewSequenceName('')
    }
  }

  async function loadSequenceSteps(sequenceId: string) {
    const { data } = await supabase
      .from('sequence_steps')
      .select('*')
      .eq('sequence_id', sequenceId)
      .order('step_number', { ascending: true })
    setSequenceSteps(data || [])
  }

  async function addStep(type: 'email' | 'wait' | 'condition') {
    if (!selectedSequence) return
    const stepNumber = sequenceSteps.length + 1

    if (type === 'wait') {
      const { data } = await supabase
        .from('sequence_steps')
        .insert({ sequence_id: selectedSequence.id, step_number: stepNumber, step_type: 'wait', delay_days: 3, subject: '', body: '' })
        .select()
        .single()
      if (data) setSequenceSteps(prev => [...prev, data])
      return
    }

    if (type === 'condition') {
      const { data } = await supabase
        .from('sequence_steps')
        .insert({ sequence_id: selectedSequence.id, step_number: stepNumber, step_type: 'condition', condition: 'opened', subject: '', body: '' })
        .select()
        .single()
      if (data) setSequenceSteps(prev => [...prev, data])
      return
    }

    // Email step — generate with Brand Brain
    setBuildingStep(true)
    try {
      const objective = selectedSequence.name || 'nurture'
      const stepContext = stepNumber === 1
        ? `First email in a sequence called "${objective}". This is the introduction.`
        : `Email ${stepNumber} in a sequence called "${objective}". Previous steps: ${sequenceSteps.length} emails sent.`

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Write email ${stepNumber} for an email sequence.

Sequence goal: ${objective}
Context: ${stepContext}

Return EXACTLY in this format:
SUBJECT: [subject line]
BODY:
[email body, max 150 words, end with my name]`,
        }),
      })
      const data = await res.json()
      const raw = data.message || data.content || data.reply || ''
      const subjectMatch = raw.match(/^SUBJECT:\s*(.+)$/im)
      const bodyMatch = raw.match(/^BODY:\s*\n([\s\S]+)$/im)

      const { data: step } = await supabase
        .from('sequence_steps')
        .insert({
          sequence_id: selectedSequence.id,
          step_number: stepNumber,
          step_type: 'email',
          delay_days: stepNumber === 1 ? 0 : 3,
          subject: subjectMatch?.[1]?.trim() || `Follow up ${stepNumber}`,
          body: bodyMatch?.[1]?.trim() || raw,
        })
        .select()
        .single()

      if (step) setSequenceSteps(prev => [...prev, step])
    } finally {
      setBuildingStep(false)
    }
  }

  async function updateStep(stepId: string, updates: any) {
    await supabase.from('sequence_steps').update(updates).eq('id', stepId)
    setSequenceSteps(prev => prev.map(s => s.id === stepId ? { ...s, ...updates } : s))
  }

  async function deleteStep(stepId: string) {
    await supabase.from('sequence_steps').delete().eq('id', stepId)
    setSequenceSteps(prev => prev.filter(s => s.id !== stepId))
  }

  async function activateSequence() {
    if (!selectedSequence || sequenceSteps.length === 0) return
    await supabase.from('email_sequences').update({ status: 'active' }).eq('id', selectedSequence.id)
    setSelectedSequence((prev: any) => ({ ...prev, status: 'active' }))
    setSequences(prev => prev.map(s => s.id === selectedSequence.id ? { ...s, status: 'active' } : s))
  }

  // ───────────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - var(--topbar-h))', flexDirection:'column', gap:14, background:'#000' }}>
      <div className="nexa-spinner" style={{ width:20, height:20 }}/>
      <div style={{ fontSize:11, color:'var(--t4)', fontFamily:'var(--sans)', letterSpacing:'0.06em', textTransform:'uppercase' }}>Loading Email</div>
    </div>
  )

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - var(--topbar-h))',
      background: '#000',
      opacity: mounted ? 1 : 0,
      transition: 'opacity 0.3s ease',
    }}>

      {/* LEFT SIDEBAR */}
      <div style={{
        width: 220,
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>

        {/* Compose button */}
        <div style={{ padding: '16px 12px 12px' }}>
          <button
            onClick={() => setView('compose')}
            style={{
              width: '100%', padding: '9px',
              background: 'var(--blue)', border: 'none', borderRadius: 8,
              fontFamily: 'var(--display)', fontSize: 12, fontWeight: 700,
              color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Compose
          </button>
        </div>

        {/* Gmail connection badge */}
        {emailAccount ? (
          <div style={{ margin: '0 10px 8px', padding: '8px 10px', background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.14)', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#4ADE80', fontFamily: 'var(--sans)', flex: 1 }}>Gmail connected</span>
              <span
                onClick={() => workspaceId && (window.location.href = `/api/email/gmail/connect?workspace_id=${workspaceId}`)}
                style={{ fontSize: 9, color: 'var(--t4)', cursor: 'pointer', fontFamily: 'var(--sans)', textDecoration: 'underline' }}
              >
                Reconnect
              </span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--t4)', fontFamily: 'var(--sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emailAccount.email}</div>
          </div>
        ) : (
          <div style={{ margin: '0 10px 8px', padding: '8px 10px', background: 'rgba(249,115,22,0.04)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#F97316', marginBottom: 4, fontFamily: 'var(--display)' }}>Connect Gmail</div>
            <div style={{ fontSize: 10, color: 'var(--t4)', marginBottom: 8, fontFamily: 'var(--sans)' }}>Send emails from your real inbox</div>
            <button
              onClick={() => workspaceId && (window.location.href = `/api/email/gmail/connect?workspace_id=${workspaceId}`)}
              style={{ width: '100%', padding: '6px', background: '#F97316', border: 'none', borderRadius: 6, fontFamily: 'var(--display)', fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
            >
              Connect Gmail →
            </button>
            {gmailConnectError && (
              <div style={{ fontSize: 10, color: '#FF5757', marginTop: 6, fontFamily: 'var(--sans)', lineHeight: 1.5 }}>
                {gmailConnectError}
              </div>
            )}
          </div>
        )}

        {/* Nav items */}
        {([
          { id: 'inbox' as View, label: 'Inbox', count: null as number | null, icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
          { id: 'sent' as View, label: 'Sent', count: sentEmails.length as number | null, icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> },
          { id: 'sequences' as View, label: 'Sequences', count: sequences.filter(s => s.status === 'active').length as number | null, icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.37"/></svg> },
          { id: 'contacts' as View, label: 'Contacts', count: contacts.length as number | null, icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
        ]).map(item => (
          <div
            key={item.id}
            onClick={() => setView(item.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 10px', borderRadius: 7,
              margin: '1px 6px', cursor: 'pointer',
              background: view === item.id ? 'rgba(30,142,240,0.08)' : 'transparent',
              border: view === item.id ? '1px solid rgba(30,142,240,0.16)' : '1px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ color: view === item.id ? 'var(--blue2)' : 'var(--t3)', display: 'flex' }}>{item.icon}</div>
            <span style={{ fontSize: 12, fontWeight: 500, color: view === item.id ? '#fff' : 'var(--t3)', fontFamily: 'var(--sans)', flex: 1 }}>{item.label}</span>
            {item.count !== null && item.count > 0 && (
              <span style={{ padding: '1px 6px', background: view === item.id ? 'var(--blue)' : 'rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: 'var(--mono)' }}>{item.count}</span>
            )}
          </div>
        ))}

        {/* Import section */}
        <div style={{ marginTop: 'auto', padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t4)', marginBottom: 8, paddingLeft: 4, fontFamily: 'var(--sans)' }}>Import contacts</div>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7, cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.15s' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--t3)', fontFamily: 'var(--sans)' }}>Upload CSV</span>
          </div>
          <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleCSVImport(e.target.files[0]) }}/>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* COMPOSE VIEW */}
        {view === 'compose' && (
          <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: 20 }}>New email</div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t4)', marginBottom: 6, fontFamily: 'var(--sans)' }}>To</div>
                <input
                  value={composeTo}
                  onChange={e => setComposeTo(e.target.value)}
                  placeholder="recipient@email.com"
                  style={{ width: '100%', background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#fff', fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t4)', marginBottom: 6, fontFamily: 'var(--sans)' }}>Subject</div>
                <input
                  value={composeSubject}
                  onChange={e => setComposeSubject(e.target.value)}
                  placeholder="Email subject..."
                  style={{ width: '100%', background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#fff', fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t4)', fontFamily: 'var(--sans)' }}>Message</div>
                  <button
                    onClick={() => { setEmailObjective(''); setEmailContext(''); setShowContextPanel(true) }}
                    disabled={writingEmail}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '5px 12px',
                      background: writingEmail ? 'rgba(30,142,240,0.05)' : 'rgba(30,142,240,0.08)',
                      border: '1px solid rgba(30,142,240,0.2)',
                      borderRadius: 6, fontSize: 11,
                      color: writingEmail ? 'var(--t4)' : 'var(--blue2)',
                      cursor: writingEmail ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--sans)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {writingEmail ? (
                      <><div className="nexa-spinner" style={{ width: 10, height: 10 }}/>Writing...</>
                    ) : (
                      <>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                        Write with Brand Brain
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  value={composeBody}
                  onChange={e => setComposeBody(e.target.value)}
                  placeholder="Write your message..."
                  style={{ width: '100%', background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#fff', fontFamily: 'var(--sans)', outline: 'none', resize: 'vertical', minHeight: 280, lineHeight: 1.75, boxSizing: 'border-box' }}
                />
              </div>

              {sendError && (
                <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(255,87,87,0.06)', border: '1px solid rgba(255,87,87,0.2)', borderRadius: 8, fontSize: 12, color: '#FF5757', fontFamily: 'var(--sans)' }}>
                  {sendError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={() => setView('inbox')}
                  style={{ padding: '9px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: 12, color: 'var(--t3)', cursor: 'pointer', fontFamily: 'var(--sans)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending || !composeTo || !composeSubject || !composeBody || !emailAccount}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 24px', background: (sending || !emailAccount) ? 'rgba(30,142,240,0.4)' : 'var(--blue)', border: 'none', borderRadius: 8, fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, color: '#fff', cursor: sending ? 'not-allowed' : 'pointer', letterSpacing: '-0.01em' }}
                >
                  {sending ? (
                    <><div className="nexa-spinner" style={{ width: 14, height: 14 }}/>Sending...</>
                  ) : (
                    <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Send email</>
                  )}
                </button>
              </div>

              {!emailAccount && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 8, fontSize: 12, color: '#F97316', fontFamily: 'var(--sans)' }}>
                  Connect Gmail first to send emails
                </div>
              )}
            </div>
          </div>
        )}

        {/* SENT VIEW */}
        {view === 'sent' && (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <div style={{ width: 340, borderRight: '1px solid rgba(255,255,255,0.07)', overflowY: 'auto', flexShrink: 0 }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 700, color: '#fff' }}>Sent</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 300, color: 'var(--t4)' }}>{sentEmails.length}</div>
              </div>
              {sentEmails.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--t4)', fontSize: 13, fontFamily: 'var(--sans)' }}>No emails sent yet</div>
              ) : sentEmails.map(email => (
                <div
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', background: selectedEmail?.id === email.id ? 'rgba(30,142,240,0.05)' : 'transparent', transition: 'background 0.1s' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#fff', fontFamily: 'var(--sans)' }}>{email.to_email}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 300, color: 'var(--t4)' }}>{new Date(email.sent_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--sans)' }}>{email.subject}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {email.opened_count > 0 && (
                      <span style={{ padding: '1px 6px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 4, fontSize: 9, fontWeight: 600, color: '#4ADE80', fontFamily: 'var(--sans)' }}>Opened ×{email.opened_count}</span>
                    )}
                    {email.status === 'replied' && (
                      <span style={{ padding: '1px 6px', background: 'rgba(30,142,240,0.08)', border: '1px solid rgba(30,142,240,0.15)', borderRadius: 4, fontSize: 9, fontWeight: 600, color: 'var(--blue2)', fontFamily: 'var(--sans)' }}>Replied</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
              {selectedEmail ? (
                <div style={{ maxWidth: 680 }}>
                  <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.025em', marginBottom: 6 }}>{selectedEmail.subject}</div>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 12, color: 'var(--t4)', fontFamily: 'var(--sans)' }}>To: <span style={{ color: 'var(--t2)' }}>{selectedEmail.to_email}</span></div>
                    <div style={{ fontSize: 12, color: 'var(--t4)', fontFamily: 'var(--sans)' }}>{new Date(selectedEmail.sent_at).toLocaleString()}</div>
                  </div>
                  {selectedEmail.opened_count > 0 && (
                    <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#4ADE80', fontFamily: 'var(--sans)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        Opened {selectedEmail.opened_count}×
                      </div>
                    </div>
                  )}
                  <div style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '16px 18px', fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, fontFamily: 'var(--sans)', whiteSpace: 'pre-wrap' }}>
                    {selectedEmail.body}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12 }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  <div style={{ fontSize: 13, color: 'var(--t4)', fontFamily: 'var(--sans)' }}>Select an email to view</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONTACTS VIEW */}
        {view === 'contacts' && (
          <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: 4 }}>Contacts</div>
                <div style={{ fontSize: 13, color: 'var(--t4)', fontFamily: 'var(--sans)' }}>{contacts.length} total</div>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: 'var(--blue)', border: 'none', borderRadius: 8, fontFamily: 'var(--display)', fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Import CSV
              </button>
            </div>

            {contacts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>No contacts yet</div>
                <div style={{ fontSize: 14, color: 'var(--t4)', marginBottom: 20, fontFamily: 'var(--sans)' }}>Upload a CSV to import your contacts</div>
                <button onClick={() => fileInputRef.current?.click()} style={{ padding: '10px 24px', background: 'var(--blue)', border: 'none', borderRadius: 8, fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                  Upload CSV →
                </button>
              </div>
            ) : (
              <div style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t4)', fontFamily: 'var(--sans)' }}>
                  <div>Name</div><div>Email</div><div>Company</div><div>Status</div>
                </div>
                {contacts.map(c => (
                  <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', padding: '11px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', fontFamily: 'var(--sans)' }}>{c.name || '—'}</div>
                    <div style={{ fontSize: 12, color: 'var(--t3)', fontFamily: 'var(--sans)' }}>{c.email}</div>
                    <div style={{ fontSize: 12, color: 'var(--t4)', fontFamily: 'var(--sans)' }}>{c.company || '—'}</div>
                    <span style={{ padding: '2px 7px', background: c.status === 'active' ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.05)', border: `1px solid ${c.status === 'active' ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 4, fontSize: 10, fontWeight: 600, color: c.status === 'active' ? '#4ADE80' : 'var(--t4)', fontFamily: 'var(--sans)', width: 'fit-content' }}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SEQUENCES VIEW */}
        {view === 'sequences' && (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

            {/* Sequence list sidebar */}
            <div style={{ width: 260, borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              <div style={{ padding: '14px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Sequences</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    value={newSequenceName}
                    onChange={e => setNewSequenceName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && createSequence()}
                    placeholder="New sequence name..."
                    style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '7px 10px', fontSize: 12, color: '#fff', fontFamily: 'var(--sans)', outline: 'none' }}
                  />
                  <button
                    onClick={createSequence}
                    disabled={!newSequenceName.trim()}
                    style={{ padding: '7px 10px', background: 'var(--blue)', border: 'none', borderRadius: 7, fontSize: 12, fontFamily: 'var(--display)', fontWeight: 700, color: '#fff', cursor: 'pointer', flexShrink: 0 }}
                  >+</button>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {sequences.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 12, color: 'var(--t4)', fontFamily: 'var(--sans)' }}>
                    No sequences yet. Create your first one above.
                  </div>
                ) : sequences.map(seq => (
                  <div
                    key={seq.id}
                    onClick={() => {
                      setSelectedSequence(seq)
                      loadSequenceSteps(seq.id)
                    }}
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      cursor: 'pointer',
                      background: selectedSequence?.id === seq.id ? 'rgba(30,142,240,0.06)' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#fff', fontFamily: 'var(--sans)' }}>{seq.name}</div>
                      <span style={{
                        padding: '2px 7px', borderRadius: 4,
                        fontSize: 9, fontWeight: 600,
                        background: seq.status === 'active' ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${seq.status === 'active' ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)'}`,
                        color: seq.status === 'active' ? '#4ADE80' : 'var(--t4)',
                        fontFamily: 'var(--sans)',
                      }}>
                        {seq.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sequence builder */}
            <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
              {!selectedSequence ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12 }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.37"/></svg>
                  <div style={{ fontSize: 13, color: 'var(--t4)', fontFamily: 'var(--sans)' }}>Select or create a sequence</div>
                </div>
              ) : (
                <div style={{ maxWidth: 680 }}>
                  {/* Sequence header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: 4 }}>
                        {selectedSequence.name}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--t4)', fontFamily: 'var(--sans)' }}>
                        {sequenceSteps.length} steps · {selectedSequence.status}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {selectedSequence.status === 'active' && (
                        <button
                          onClick={() => setShowEnrollModal(true)}
                          style={{ padding: '9px 18px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, fontFamily: 'var(--display)', fontSize: 12, fontWeight: 700, color: '#4ADE80', cursor: 'pointer' }}
                        >
                          Enroll contacts →
                        </button>
                      )}
                      {selectedSequence.status === 'draft' && sequenceSteps.length > 0 && (
                        <button
                          onClick={activateSequence}
                          style={{ padding: '9px 18px', background: 'var(--blue)', border: 'none', borderRadius: 8, fontFamily: 'var(--display)', fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
                        >
                          Activate →
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Steps */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {sequenceSteps.map((step, i) => (
                      <div key={step.id}>
                        <div style={{
                          background: '#0A0A0A',
                          border: `1px solid ${step.step_type === 'condition' ? 'rgba(251,146,60,0.2)' : step.step_type === 'wait' ? 'rgba(255,255,255,0.07)' : 'rgba(30,142,240,0.15)'}`,
                          borderRadius: 10, padding: '14px 16px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                              background: step.step_type === 'email' ? 'rgba(30,142,240,0.1)' : step.step_type === 'wait' ? 'rgba(255,255,255,0.05)' : 'rgba(251,146,60,0.1)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {step.step_type === 'email' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4DABF7" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
                              {step.step_type === 'wait' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                              {step.step_type === 'condition' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FB923C" strokeWidth="1.5" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              {step.step_type === 'wait' ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: 13, color: 'var(--t3)', fontFamily: 'var(--sans)' }}>Wait</span>
                                  <input
                                    type="number"
                                    value={step.delay_days}
                                    onChange={e => updateStep(step.id, { delay_days: parseInt(e.target.value) || 1 })}
                                    min={1} max={30}
                                    style={{ width: 48, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 8px', fontSize: 13, color: '#fff', fontFamily: 'var(--mono)', textAlign: 'center', outline: 'none' }}
                                  />
                                  <span style={{ fontSize: 13, color: 'var(--t3)', fontFamily: 'var(--sans)' }}>days before next step</span>
                                </div>
                              ) : step.step_type === 'condition' ? (
                                <div>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: '#FB923C', fontFamily: 'var(--display)', marginBottom: 6 }}>Condition</div>
                                  <select
                                    value={step.condition || 'opened'}
                                    onChange={e => updateStep(step.id, { condition: e.target.value })}
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#fff', fontFamily: 'var(--sans)', outline: 'none', cursor: 'pointer' }}
                                  >
                                    <option value="opened">If previous email was opened → continue</option>
                                    <option value="not_opened">If previous email was NOT opened → send follow-up</option>
                                    <option value="clicked">If link was clicked → continue</option>
                                    <option value="replied">If they replied → stop sequence</option>
                                    <option value="not_replied">If no reply → send follow-up</option>
                                  </select>
                                </div>
                              ) : (
                                <div>
                                  {editingStep?.id === step.id ? (
                                    <div>
                                      <input
                                        value={editingStep.subject}
                                        onChange={e => setEditingStep((prev: any) => ({ ...prev, subject: e.target.value }))}
                                        placeholder="Subject line..."
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, padding: '8px 12px', fontSize: 13, color: '#fff', fontFamily: 'var(--sans)', outline: 'none', marginBottom: 8, boxSizing: 'border-box' }}
                                      />
                                      <textarea
                                        value={editingStep.body}
                                        onChange={e => setEditingStep((prev: any) => ({ ...prev, body: e.target.value }))}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, padding: '8px 12px', fontSize: 13, color: '#fff', fontFamily: 'var(--sans)', outline: 'none', resize: 'vertical' as const, minHeight: 120, lineHeight: 1.65, boxSizing: 'border-box' }}
                                      />
                                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                        <button
                                          onClick={() => {
                                            updateStep(step.id, { subject: editingStep.subject, body: editingStep.body })
                                            setEditingStep(null)
                                          }}
                                          style={{ padding: '6px 14px', background: 'var(--blue)', border: 'none', borderRadius: 6, fontSize: 12, fontFamily: 'var(--display)', fontWeight: 700, color: '#fff', cursor: 'pointer' }}
                                        >Save</button>
                                        <button
                                          onClick={() => setEditingStep(null)}
                                          style={{ padding: '6px 14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12, color: 'var(--t4)', cursor: 'pointer', fontFamily: 'var(--sans)' }}
                                        >Cancel</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'var(--display)', letterSpacing: '-0.01em', marginBottom: 3 }}>{step.subject || 'No subject'}</div>
                                      <div style={{ fontSize: 12, color: 'var(--t4)', fontFamily: 'var(--sans)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                                        {step.body || 'No body'}
                                      </div>
                                      <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                                        <button
                                          onClick={() => setEditingStep({ ...step })}
                                          style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, fontSize: 11, color: 'var(--t3)', cursor: 'pointer', fontFamily: 'var(--sans)' }}
                                        >Edit</button>
                                        {step.delay_days > 0 && (
                                          <span style={{ fontSize: 11, color: 'var(--t4)', fontFamily: 'var(--sans)' }}>
                                            Sends {step.delay_days} day{step.delay_days !== 1 ? 's' : ''} after previous
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => deleteStep(step.id)}
                              style={{ padding: '4px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', flexShrink: 0 }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                            </button>
                          </div>
                        </div>

                        {i < sequenceSteps.length - 1 && (
                          <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
                            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.07)' }}/>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add step buttons */}
                  <div style={{ marginTop: sequenceSteps.length > 0 ? 16 : 0, display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                    <button
                      onClick={() => addStep('email')}
                      disabled={buildingStep}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(30,142,240,0.07)', border: '1px solid rgba(30,142,240,0.2)', borderRadius: 8, fontSize: 12, fontFamily: 'var(--display)', fontWeight: 600, color: '#4DABF7', cursor: buildingStep ? 'not-allowed' : 'pointer' }}
                    >
                      {buildingStep ? <><div className="nexa-spinner" style={{ width: 11, height: 11 }}/>Writing...</> : <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add email</>}
                    </button>
                    <button
                      onClick={() => addStep('wait')}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12, fontFamily: 'var(--sans)', fontWeight: 500, color: 'var(--t3)', cursor: 'pointer' }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      Add delay
                    </button>
                    <button
                      onClick={() => addStep('condition')}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: 8, fontSize: 12, fontFamily: 'var(--sans)', fontWeight: 500, color: '#FB923C', cursor: 'pointer' }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                      Add condition
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* INBOX VIEW */}
        {view === 'inbox' && (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Message list */}
            <div style={{ width: 340, borderRight: '1px solid rgba(255,255,255,0.07)', overflowY: 'auto', flexShrink: 0 }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 700, color: '#fff' }}>Inbox</div>
                <button onClick={loadInbox} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t4)', display: 'flex', padding: 4 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.37"/></svg>
                </button>
              </div>

              {!emailAccount ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--t4)', fontSize: 13, fontFamily: 'var(--sans)' }}>Connect Gmail to view inbox</div>
              ) : inboxLoading ? (
                <div style={{ padding: '40px 20px', display: 'flex', justifyContent: 'center' }}>
                  <div className="nexa-spinner" style={{ width: 16, height: 16 }}/>
                </div>
              ) : inboxMessages.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--t4)', fontSize: 13, fontFamily: 'var(--sans)' }}>No messages in inbox</div>
              ) : inboxMessages.map(msg => (
                <div
                  key={msg.id}
                  onClick={() => { setSelectedInboxMessage(msg); setReplyBody('') }}
                  style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', background: selectedInboxMessage?.id === msg.id ? 'rgba(30,142,240,0.05)' : 'transparent', transition: 'background 0.1s' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, gap: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: msg.unread ? 700 : 500, color: msg.unread ? '#fff' : 'rgba(255,255,255,0.75)', fontFamily: 'var(--sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{msg.fromName || msg.fromEmail}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 300, color: 'var(--t4)', flexShrink: 0 }}>{msg.date}</div>
                  </div>
                  <div style={{ fontSize: 12, color: msg.unread ? 'rgba(255,255,255,0.7)' : 'var(--t3)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--sans)' }}>{msg.subject}</div>
                  <div style={{ fontSize: 11, color: 'var(--t4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--sans)' }}>{msg.snippet}</div>
                </div>
              ))}
            </div>

            {/* Message detail */}
            <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
              {selectedInboxMessage ? (
                <div style={{ maxWidth: 680 }}>
                  <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.025em', marginBottom: 6 }}>{selectedInboxMessage.subject}</div>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 12, color: 'var(--t4)', fontFamily: 'var(--sans)' }}>From: <span style={{ color: 'var(--t2)' }}>{selectedInboxMessage.fromName} {selectedInboxMessage.fromEmail ? `<${selectedInboxMessage.fromEmail}>` : ''}</span></div>
                    <div style={{ fontSize: 12, color: 'var(--t4)', fontFamily: 'var(--sans)' }}>{selectedInboxMessage.date}</div>
                  </div>
                  <div style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '16px 18px', fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, fontFamily: 'var(--sans)', whiteSpace: 'pre-wrap', marginBottom: 20 }}>
                    {selectedInboxMessage.snippet}
                    <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(30,142,240,0.05)', border: '1px solid rgba(30,142,240,0.12)', borderRadius: 7, fontSize: 12, color: 'var(--t4)' }}>
                      Open Gmail to read full message →
                    </div>
                  </div>

                  {/* Reply area */}
                  <div style={{ marginTop: 4 }}>
                    <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t4)', marginBottom: 8, fontFamily: 'var(--sans)' }}>Reply</div>
                    <textarea
                      value={replyBody}
                      onChange={e => setReplyBody(e.target.value)}
                      placeholder={`Reply to ${selectedInboxMessage.from}...`}
                      style={{ width: '100%', background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#fff', fontFamily: 'var(--sans)', outline: 'none', resize: 'vertical' as const, minHeight: 120, lineHeight: 1.65, boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <button
                        onClick={() => writeWithBrandBrain(`Reply to this email from ${selectedInboxMessage.from}: "${selectedInboxMessage.snippet}". Keep it short, direct, and in my voice.`)}
                        disabled={writingEmail}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'rgba(30,142,240,0.08)', border: '1px solid rgba(30,142,240,0.2)', borderRadius: 6, fontSize: 11, color: 'var(--blue2)', cursor: writingEmail ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)' }}
                      >
                        {writingEmail ? (
                          <><div className="nexa-spinner" style={{ width: 10, height: 10 }}/>Writing...</>
                        ) : (
                          <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>Write with Brand Brain</>
                        )}
                      </button>
                      <button
                        onClick={handleReply}
                        disabled={sendingReply || !replyBody.trim()}
                        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', background: replyBody.trim() ? 'var(--blue)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8, fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, color: replyBody.trim() ? '#fff' : 'var(--t5)', cursor: replyBody.trim() ? 'pointer' : 'not-allowed' }}
                      >
                        {sendingReply ? <><div className="nexa-spinner" style={{ width: 13, height: 13 }}/>Sending...</> : <>Send reply →</>}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12 }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <div style={{ fontSize: 13, color: 'var(--t4)', fontFamily: 'var(--sans)' }}>Select a message to preview</div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* BRAND BRAIN CONTEXT PANEL */}
      {showContextPanel && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowContextPanel(false) }}>
          <div style={{ width: '100%', maxWidth: 480, background: 'rgba(10,10,18,0.99)', border: '1px solid rgba(30,142,240,0.2)', borderRadius: 18, padding: '28px 28px 24px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(30,142,240,0.5),transparent)', borderRadius: '18px 18px 0 0' }}/>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--blue2)" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              <div style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>Brand Brain — Email</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--t4)', marginBottom: 10, fontFamily: 'var(--sans)' }}>What&apos;s the objective?</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {['Cold outreach', 'Follow-up', 'Partnership', 'Sales pitch', 'Thank you', 'Newsletter'].map(obj => (
                  <button key={obj} onClick={() => setEmailObjective(obj === emailObjective ? '' : obj)}
                    style={{ padding: '6px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all 0.15s', background: emailObjective === obj ? 'rgba(30,142,240,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${emailObjective === obj ? 'rgba(30,142,240,0.4)' : 'rgba(255,255,255,0.1)'}`, color: emailObjective === obj ? 'var(--blue2)' : 'var(--t3)' }}>
                    {obj}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--t4)', marginBottom: 8, fontFamily: 'var(--sans)' }}>Context (optional)</div>
              <textarea
                value={emailContext}
                onChange={e => setEmailContext(e.target.value)}
                placeholder="What should Nexa know? e.g. recipient's company, what they do, why you're reaching out..."
                rows={3}
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#fff', fontFamily: 'var(--sans)', outline: 'none', resize: 'none', lineHeight: 1.65, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowContextPanel(false)}
                style={{ padding: '9px 18px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: 'var(--t3)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                Cancel
              </button>
              <button onClick={() => writeWithBrandBrain()}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', background: 'var(--blue)', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'var(--display)' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                Generate email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ENROLLMENT MODAL */}
      {showEnrollModal && selectedSequence && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14, padding: 24, width: '100%', maxWidth: 480,
            maxHeight: '80vh', overflow: 'auto',
          }}>
            <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
              Enroll contacts
            </div>
            <div style={{ fontSize: 13, color: 'var(--t4)', fontFamily: 'var(--sans)', marginBottom: 16 }}>
              Select contacts to enroll in &ldquo;{selectedSequence.name}&rdquo;
            </div>

            {contacts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--t4)', fontFamily: 'var(--sans)' }}>
                No contacts yet. Import contacts first.
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <button
                    onClick={() => setSelectedContacts(contacts.map((c: Contact) => c.id))}
                    style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, fontSize: 11, color: 'var(--t3)', cursor: 'pointer', fontFamily: 'var(--sans)' }}
                  >Select all ({contacts.length})</button>
                  <button
                    onClick={() => setSelectedContacts([])}
                    style={{ padding: '5px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, fontSize: 11, color: 'var(--t4)', cursor: 'pointer', fontFamily: 'var(--sans)' }}
                  >Clear</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 300, overflowY: 'auto', marginBottom: 16 }}>
                  {contacts.map((contact: Contact) => (
                    <div
                      key={contact.id}
                      onClick={() => setSelectedContacts(prev =>
                        prev.includes(contact.id) ? prev.filter(id => id !== contact.id) : [...prev, contact.id]
                      )}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                        background: selectedContacts.includes(contact.id) ? 'rgba(30,142,240,0.06)' : 'transparent',
                        border: `1px solid ${selectedContacts.includes(contact.id) ? 'rgba(30,142,240,0.2)' : 'rgba(255,255,255,0.06)'}`,
                        transition: 'all 0.1s',
                      }}
                    >
                      <div style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                        background: selectedContacts.includes(contact.id) ? 'var(--blue)' : 'transparent',
                        border: `1.5px solid ${selectedContacts.includes(contact.id) ? 'var(--blue)' : 'rgba(255,255,255,0.2)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {selectedContacts.includes(contact.id) && (
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', fontFamily: 'var(--sans)' }}>{contact.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--t4)', fontFamily: 'var(--sans)' }}>{contact.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowEnrollModal(false); setSelectedContacts([]) }}
                style={{ padding: '9px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: 'var(--t4)', cursor: 'pointer', fontFamily: 'var(--sans)' }}
              >Cancel</button>
              <button
                onClick={async () => {
                  if (selectedContacts.length === 0) return
                  setEnrolling(true)
                  try {
                    await fetch('/api/email/sequences/enroll', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ sequence_id: selectedSequence.id, contact_ids: selectedContacts }),
                    })
                    setShowEnrollModal(false)
                    setSelectedContacts([])
                  } finally {
                    setEnrolling(false)
                  }
                }}
                disabled={selectedContacts.length === 0 || enrolling}
                style={{
                  padding: '9px 20px',
                  background: selectedContacts.length > 0 ? 'var(--blue)' : 'rgba(255,255,255,0.05)',
                  border: 'none', borderRadius: 8,
                  fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700,
                  color: selectedContacts.length > 0 ? '#fff' : 'var(--t5)',
                  cursor: selectedContacts.length > 0 ? 'pointer' : 'not-allowed',
                }}
              >
                {enrolling ? 'Enrolling...' : `Enroll ${selectedContacts.length} contact${selectedContacts.length !== 1 ? 's' : ''} →`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
