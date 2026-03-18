'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type View = 'inbox' | 'sent' | 'sequences' | 'contacts' | 'compose'
type Contact = { id: string; email: string; name: string; company: string; tags: string[]; status: string }
type EmailAccount = { id: string; email: string; name: string; provider: string }
type Sequence = { id: string; name: string; status: string; created_at: string }
type SentEmail = { id: string; to_email: string; subject: string; body: string; status: string; opened_count: number; sent_at: string; contact_id: string }

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

  useEffect(() => {
    setMounted(true)
    loadData()
    const params = new URLSearchParams(window.location.search)
    if (params.get('gmail_connected') === 'true') {
      window.history.replaceState({}, '', '/dashboard/automate')
    }
  }, [])

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
        setSendError(data.error || 'Failed to send')
      }
    } catch {
      setSendError('Failed to send email')
    } finally {
      setSending(false)
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

  async function writeWithBrandBrain() {
    const context = `Email to ${composeTo || 'a contact'} about ${composeSubject || 'this topic'}`
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          message: `Write a professional email in my brand voice. Context: ${context}. Return only the email body, no subject line, no greeting metadata.`,
        }),
      })
      const data = await res.json()
      if (data.reply) setComposeBody(data.reply)
    } catch (e) {
      console.error('[BrandBrain] Error:', e instanceof Error ? e.message : 'Unknown')
    }
  }

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
              <span style={{ fontSize: 11, fontWeight: 600, color: '#4ADE80', fontFamily: 'var(--sans)' }}>Gmail connected</span>
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
                    onClick={writeWithBrandBrain}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'rgba(30,142,240,0.08)', border: '1px solid rgba(30,142,240,0.2)', borderRadius: 6, fontSize: 11, color: 'var(--blue2)', cursor: 'pointer', fontFamily: 'var(--sans)' }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                    Write with Brand Brain
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
          <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: 4 }}>Sequences</div>
                <div style={{ fontSize: 13, color: 'var(--t4)', fontFamily: 'var(--sans)' }}>Automated email flows</div>
              </div>
              <button
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: 'var(--blue)', border: 'none', borderRadius: 8, fontFamily: 'var(--display)', fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New sequence
              </button>
            </div>

            {sequences.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>No sequences yet</div>
                <div style={{ fontSize: 14, color: 'var(--t4)', marginBottom: 8, fontFamily: 'var(--sans)' }}>Build an automated email sequence.</div>
                <div style={{ fontSize: 13, color: 'var(--t4)', marginBottom: 24, fontFamily: 'var(--sans)' }}>Import contacts first, then create a sequence to enroll them.</div>
              </div>
            ) : sequences.map(seq => (
              <div key={seq.id} style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '16px 20px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{seq.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--t4)', fontFamily: 'var(--sans)' }}>Created {new Date(seq.created_at).toLocaleDateString()}</div>
                </div>
                <span style={{ padding: '3px 9px', background: seq.status === 'active' ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.05)', border: `1px solid ${seq.status === 'active' ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 5, fontSize: 10, fontWeight: 600, color: seq.status === 'active' ? '#4ADE80' : 'var(--t4)', fontFamily: 'var(--sans)' }}>
                  {seq.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* INBOX VIEW */}
        {view === 'inbox' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Inbox coming soon</div>
            <div style={{ fontSize: 14, color: 'var(--t4)', textAlign: 'center', maxWidth: 380, lineHeight: 1.7, fontFamily: 'var(--sans)' }}>
              Full inbox with reply tracking is in development. For now, use Compose to send emails and Sent to track them.
            </div>
            <button onClick={() => setView('compose')} style={{ padding: '10px 24px', background: 'var(--blue)', border: 'none', borderRadius: 8, fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
              Compose email →
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
