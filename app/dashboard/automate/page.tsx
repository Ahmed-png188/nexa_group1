'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO } from 'date-fns'

type View = 'sequences' | 'new' | 'detail' | 'webhooks'

const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--t4)', marginBottom: 7 }
const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', fontSize: 13, fontFamily: 'var(--sans)', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 9, color: 'var(--t1)', outline: 'none', transition: 'border-color .15s' }
const inputStyle = inp

const IconZap = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
const IconPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IconMail = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
const IconPlay = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const IconPause = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
const IconBack = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
const IconSend = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="22 2 15 22 11 13 2 9"/></svg>

const STATUS_COLORS: Record<string, string> = {
  draft: 'var(--t4)',
  active: 'var(--cyan)',
  paused: 'var(--amber)',
  completed: '#00d68f',
}

export default function AutomatePage() {
  const supabase = createClient()
  const [workspace, setWorkspace] = useState<any>(null)
  const [credits, setCredits] = useState(0)
  const [view, setView] = useState<View>('sequences')
  const [sequences, setSequences] = useState<any[]>([])
  const [selectedSeq, setSelectedSeq] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [sending, setSending] = useState(false)

  // New sequence form
  const [seqName, setSeqName] = useState('')
  const [seqGoal, setSeqGoal] = useState('')
  const [seqAudience, setSeqAudience] = useState('')
  const [seqEmails, setSeqEmails] = useState(5)

  // Webhooks state
  const [webhooks, setWebhooks] = useState<any[]>([])
  const [showNewWebhook, setShowNewWebhook] = useState(false)
  const [webhookName, setWebhookName] = useState('')
  const [webhookTrigger, setWebhookTrigger] = useState('new_lead')
  const [webhookAction, setWebhookAction] = useState('generate_post')
  const [webhookPlatform, setWebhookPlatform] = useState('instagram')
  const [savingWebhook, setSavingWebhook] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Send modal
  const [showSendModal, setShowSendModal] = useState(false)
  const [sendStep, setSendStep] = useState(1)
  const [contactsText, setContactsText] = useState('')
  const [sendResult, setSendResult] = useState<any>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: m } = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id', user.id).limit(1).single()
    const ws = (m as any)?.workspaces
    setWorkspace(ws)
    const { data: cr } = await supabase.from('credits').select('balance').eq('workspace_id', ws?.id).single()
    setCredits(cr?.balance ?? 0)

    // Load webhooks
    try {
      const whRes = await fetch(`/api/webhooks?workspace_id=${ws?.id}`)
      if (whRes.ok) { const whData = await whRes.json(); setWebhooks(whData.webhooks ?? []) }
    } catch {}

    const res = await fetch(`/api/create-sequence?workspace_id=${ws?.id}`)
    if (res.ok) {
      const data = await res.json()
      setSequences(data.sequences ?? [])
    }
    setLoading(false)
  }

  async function createSequence() {
    if (!seqName.trim() || !seqGoal.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/create-sequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspace.id,
          name: seqName,
          goal: seqGoal,
          audience: seqAudience,
          num_emails: seqEmails,
          generate_with_ai: true,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setSelectedSeq(data.sequence)
        await loadData()
        setView('detail')
        setSeqName(''); setSeqGoal(''); setSeqAudience('')
      }
    } catch (err) { console.error(err) }
    setCreating(false)
  }

  async function sendSequenceStep() {
    if (!contactsText.trim() || !selectedSeq) return
    setSending(true)

    // Parse contacts from textarea (one per line, format: email or "Name <email>")
    const lines = contactsText.trim().split('\n').filter(l => l.trim())
    const contacts = lines.map(line => {
      const match = line.match(/^(.+?)\s*<(.+?)>$/)
      if (match) return { name: match[1].trim(), email: match[2].trim() }
      return { name: '', email: line.trim() }
    }).filter(c => c.email.includes('@'))

    if (contacts.length === 0) { setSending(false); return }

    const step = selectedSeq.steps?.[sendStep - 1]
    if (!step) { setSending(false); return }

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspace.id,
          sequence_id: selectedSeq.id,
          to_emails: contacts,
          step_number: sendStep,
          subject: step.subject,
          body: step.body,
          from_name: workspace.brand_name ?? workspace.name,
        }),
      })
      const data = await res.json()
      setSendResult(data)
      if (data.success) {
        setCredits(prev => prev - (data.credits_used ?? 0))
        await loadData()
      }
    } catch (err) { console.error(err) }
    setSending(false)
  }

  async function updateSequenceStatus(seqId: string, status: string) {
    await supabase.from('email_sequences').update({ status }).eq('id', seqId)
    await loadData()
    if (selectedSeq?.id === seqId) {
      setSelectedSeq((prev: any) => prev ? { ...prev, status } : prev)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div style={{ fontSize: 13, color: 'var(--t4)' }}>Loading automations...</div>
    </div>
  )

  return (
    <div style={{ padding: '28px', maxWidth: 900 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          {view !== 'sequences' && (
            <button onClick={() => setView('sequences')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--t4)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 8, fontFamily: 'var(--sans)', padding: 0 }}>
              <IconBack /> Back to sequences
            </button>
          )}
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 3 }}>
            {view === 'new' ? 'New sequence' : view === 'detail' ? selectedSeq?.name : 'Automate'}
          </h1>
          <div style={{ fontSize: 12, color: 'var(--t4)', display: 'flex', gap: 12 }}>
            {view === 'sequences' && <span>{sequences.length} sequence{sequences.length !== 1 ? 's' : ''}</span>}
            <span style={{ color: 'var(--cyan)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--cyan)', animation: 'pulse-dot 2s ease-in-out infinite' }} />
              {credits} credits
            </span>
          </div>
        </div>
        {view === 'sequences' && (
          <button onClick={() => setView('new')} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', fontSize: 13, fontWeight: 700, background: 'var(--cyan)', color: '#000', border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
            <IconPlus /> New sequence
          </button>
        )}
      </div>

      {/* Tab switcher */}
      {(view === 'sequences' || view === 'webhooks') && (
        <div style={{ display: 'flex', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 10, padding: 3, gap: 2, marginBottom: 20, width: 'fit-content' }}>
          {[
            { id: 'sequences', label: '📧 Email Sequences' },
            { id: 'webhooks', label: '⚡ Webhooks' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id as any)}
              style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: view === tab.id ? 'var(--glass2)' : 'transparent', color: view === tab.id ? 'var(--t1)' : 'var(--t4)', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--sans)' }}>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── SEQUENCES LIST ── */}
      {view === 'sequences' && (
        <div>
          {sequences.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sequences.map(seq => (
                <div key={seq.id} style={{ padding: '18px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12, cursor: 'pointer', transition: 'border-color .15s' }}
                  onClick={() => { setSelectedSeq(seq); setView('detail') }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--line2)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--cglow2)', border: '1px solid var(--cline2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)' }}>
                        <IconMail />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>{seq.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--t4)' }}>{seq.steps?.length ?? 0} emails · {seq.total_contacts ?? 0} contacts</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: `${STATUS_COLORS[seq.status]}18`, color: STATUS_COLORS[seq.status], border: `1px solid ${STATUS_COLORS[seq.status]}33`, textTransform: 'capitalize' as const }}>
                        {seq.status}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {[
                      { label: 'Sent',      value: seq.emails_sent ?? 0 },
                      { label: 'Opened',    value: seq.emails_opened ?? 0 },
                      { label: 'Clicked',   value: seq.emails_clicked ?? 0 },
                      { label: 'Open rate', value: seq.emails_sent > 0 ? `${Math.round((seq.emails_opened / seq.emails_sent) * 100)}%` : '—' },
                    ].map(stat => (
                      <div key={stat.label} style={{ padding: '8px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 7 }}>
                        <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--t1)', lineHeight: 1 }}>{stat.value}</div>
                        <div style={{ fontSize: 10, color: 'var(--t5)', marginTop: 3 }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 40px', background: 'var(--glass)', border: '1px solid var(--line)', borderRadius: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--cglow2)', border: '1px solid var(--cline2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--cyan)' }}>
                <IconZap />
              </div>
              <h2 style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 10, color: 'var(--t1)' }}>No sequences yet</h2>
              <p style={{ fontSize: 13, color: 'var(--t4)', maxWidth: 360, margin: '0 auto 24px', lineHeight: 1.7 }}>
                Create an email sequence and Nexa AI will write all the emails for you — welcome flows, nurture sequences, outreach campaigns.
              </p>
              <p style={{ fontSize: 12, color: 'var(--cyan)', fontWeight: 600, marginBottom: 20 }}>15 credits per 100 sends · Writing is free</p>
              <button onClick={() => setView('new')} style={{ padding: '11px 24px', fontSize: 13, fontWeight: 700, background: 'var(--cyan)', color: '#000', border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                Create your first sequence →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── NEW SEQUENCE FORM ── */}
      {view === 'new' && (
        <div style={{ maxWidth: 560 }}>
          <div style={{ padding: '24px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lbl}>Sequence name</label>
                <input value={seqName} onChange={e => setSeqName(e.target.value)} placeholder="e.g. Welcome sequence, Cold outreach, Product launch" style={inp}
                  onFocus={e => (e.target.style.borderColor = 'var(--cline2)')} onBlur={e => (e.target.style.borderColor = 'var(--line2)')}/>
              </div>
              <div>
                <label style={lbl}>Goal of this sequence</label>
                <input value={seqGoal} onChange={e => setSeqGoal(e.target.value)} placeholder="e.g. Convert leads to discovery calls, Onboard new customers, Re-engage cold contacts" style={inp}
                  onFocus={e => (e.target.style.borderColor = 'var(--cline2)')} onBlur={e => (e.target.style.borderColor = 'var(--line2)')}/>
              </div>
              <div>
                <label style={lbl}>Who is this for? <span style={{ color: 'var(--t5)', fontWeight: 400 }}>(optional)</span></label>
                <input value={seqAudience} onChange={e => setSeqAudience(e.target.value)} placeholder="e.g. Founders who downloaded our guide, Dubai-based consultants" style={inp}
                  onFocus={e => (e.target.style.borderColor = 'var(--cline2)')} onBlur={e => (e.target.style.borderColor = 'var(--line2)')}/>
              </div>
              <div>
                <label style={lbl}>Number of emails</label>
                <div style={{ display: 'flex', gap: 7 }}>
                  {[3, 5, 7, 10].map(n => (
                    <button key={n} onClick={() => setSeqEmails(n)} style={{ flex: 1, padding: '9px', borderRadius: 9, background: seqEmails === n ? 'rgba(0,170,255,0.08)' : 'var(--glass)', border: `1px solid ${seqEmails === n ? 'var(--cline2)' : 'var(--line2)'}`, color: seqEmails === n ? 'var(--cyan)' : 'var(--t4)', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'var(--sans)' }}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ padding: '12px 14px', background: 'rgba(0,170,255,0.04)', border: '1px solid var(--cline2)', borderRadius: 9, fontSize: 12, color: 'var(--t3)', lineHeight: 1.6 }}>
                <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>Nexa AI</span> will write all {seqEmails} emails in your brand voice — subject lines, bodies, and CTAs. Writing is free. Sending costs 15 credits per 100 contacts.
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setView('sequences')} style={{ flex: 1, padding: '11px', fontSize: 13, fontWeight: 600, background: 'var(--glass)', color: 'var(--t3)', border: '1px solid var(--line2)', borderRadius: 9, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                  Cancel
                </button>
                <button onClick={createSequence} disabled={!seqName.trim() || !seqGoal.trim() || creating} style={{ flex: 2, padding: '11px', fontSize: 13, fontWeight: 700, background: seqName.trim() && seqGoal.trim() ? 'var(--cyan)' : 'var(--glass)', color: seqName.trim() && seqGoal.trim() ? '#000' : 'var(--t5)', border: 'none', borderRadius: 9, cursor: seqName.trim() ? 'pointer' : 'not-allowed', fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {creating ? (
                    <>
                      <div style={{ width: 13, height: 13, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      Nexa is writing your emails...
                    </>
                  ) : `Generate ${seqEmails} emails with AI →`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SEQUENCE DETAIL ── */}
      {view === 'detail' && selectedSeq && (
        <div>
          {/* Status bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '12px 16px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: `${STATUS_COLORS[selectedSeq.status]}18`, color: STATUS_COLORS[selectedSeq.status], border: `1px solid ${STATUS_COLORS[selectedSeq.status]}33`, textTransform: 'capitalize' as const }}>
              {selectedSeq.status}
            </span>
            <span style={{ fontSize: 12, color: 'var(--t4)' }}>{selectedSeq.steps?.length ?? 0} emails · Created {selectedSeq.created_at ? format(parseISO(selectedSeq.created_at), 'MMM d') : 'recently'}</span>
            <div style={{ flex: 1 }} />
            <button onClick={() => setShowSendModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: 12, fontWeight: 700, background: 'var(--cyan)', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
              <IconSend /> Send to contacts
            </button>
            {selectedSeq.status === 'active' ? (
              <button onClick={() => updateSequenceStatus(selectedSeq.id, 'paused')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', fontSize: 12, fontWeight: 600, background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 8, color: 'var(--amber)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                <IconPause /> Pause
              </button>
            ) : selectedSeq.status !== 'completed' && (
              <button onClick={() => updateSequenceStatus(selectedSeq.id, 'active')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', fontSize: 12, fontWeight: 600, background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 8, color: 'var(--cyan)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                <IconPlay /> Activate
              </button>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
            {[
              { label: 'Emails sent',  value: selectedSeq.emails_sent ?? 0,   color: 'var(--t1)' },
              { label: 'Opened',       value: selectedSeq.emails_opened ?? 0,  color: 'var(--cyan)' },
              { label: 'Clicked',      value: selectedSeq.emails_clicked ?? 0, color: 'var(--t1)' },
              { label: 'Open rate',    value: selectedSeq.emails_sent > 0 ? `${Math.round(((selectedSeq.emails_opened ?? 0) / selectedSeq.emails_sent) * 100)}%` : '—', color: '#00d68f' },
            ].map(stat => (
              <div key={stat.label} style={{ padding: '14px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 10 }}>
                <div style={{ fontFamily: 'var(--display)', fontSize: 24, fontWeight: 800, letterSpacing: '-0.04em', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: 'var(--t4)', marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Email steps */}
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t4)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>Email sequence</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(selectedSeq.steps ?? []).map((step: any, i: number) => (
              <div key={i} style={{ background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--cglow2)', border: '1px solid var(--cline2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--cyan)', flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 2 }}>{step.subject}</div>
                    <div style={{ fontSize: 11, color: 'var(--t4)', display: 'flex', gap: 10 }}>
                      <span>Day {step.delay_days}</span>
                      {step.goal && <span>· {step.goal}</span>}
                    </div>
                  </div>
                  <button onClick={() => { setSendStep(i + 1); setShowSendModal(true) }} style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 7, color: 'var(--t3)', cursor: 'pointer', fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <IconSend /> Send this
                  </button>
                </div>
                <div style={{ padding: '0 16px 14px', fontSize: 12.5, color: 'var(--t3)', lineHeight: 1.65, borderTop: '1px solid var(--line)', paddingTop: 12, whiteSpace: 'pre-line' as const }}>
                  {step.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Send Modal ── */}
      {showSendModal && selectedSeq && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) { setShowSendModal(false); setSendResult(null); setContactsText('') } }}
        >
          <div style={{ width: '100%', maxWidth: 500, background: '#0D0D14', border: '1px solid var(--line2)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.7)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700 }}>Send email · Step {sendStep}</div>
              <button onClick={() => { setShowSendModal(false); setSendResult(null); setContactsText('') }} style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--glass)', border: '1px solid var(--line)', color: 'var(--t4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--sans)' }}>✕</button>
            </div>
            <div style={{ padding: 20 }}>
              {sendResult ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(0,214,143,0.1)', border: '1px solid rgba(0,214,143,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 20 }}>✓</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>{sendResult.sent} emails sent</div>
                  {sendResult.failed > 0 && <div style={{ fontSize: 12, color: 'var(--amber)', marginBottom: 6 }}>{sendResult.failed} failed</div>}
                  <div style={{ fontSize: 12, color: 'var(--t4)' }}>{sendResult.credits_used} credits used</div>
                  <button onClick={() => { setShowSendModal(false); setSendResult(null); setContactsText('') }} style={{ marginTop: 20, padding: '10px 24px', fontSize: 13, fontWeight: 700, background: 'var(--cyan)', color: '#000', border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: 'var(--sans)' }}>Done</button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ padding: '10px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--line)', borderRadius: 8, marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t5)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Sending</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{selectedSeq.steps?.[sendStep - 1]?.subject}</div>
                    </div>
                    <label style={lbl}>
                      Recipients <span style={{ color: 'var(--t5)', fontWeight: 400 }}>(one per line — email or "Name {'<email>'}") </span>
                    </label>
                    <textarea
                      value={contactsText}
                      onChange={e => setContactsText(e.target.value)}
                      placeholder={`ahmed@brand.com\nSara Al-Rashidi <sara@brand.com>\nMarcus Kim <marcus@elevate.com>`}
                      rows={6}
                      style={{ ...inp, resize: 'vertical' as const, lineHeight: 1.6, fontFamily: 'monospace', fontSize: 12 }}
                      onFocus={e => (e.target.style.borderColor = 'var(--cline2)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--line2)')}
                    />
                    <div style={{ fontSize: 11, color: 'var(--t5)', marginTop: 5 }}>
                      {contactsText.trim() ? `${contactsText.trim().split('\n').filter(l => l.includes('@')).length} valid contacts · ${Math.ceil(contactsText.trim().split('\n').filter(l => l.includes('@')).length / 100) * 15} credits` : 'Paste your contact list above'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setShowSendModal(false); setContactsText('') }} style={{ flex: 1, padding: '11px', fontSize: 13, fontWeight: 600, background: 'var(--glass)', color: 'var(--t3)', border: '1px solid var(--line2)', borderRadius: 9, cursor: 'pointer', fontFamily: 'var(--sans)' }}>Cancel</button>
                    <button onClick={sendSequenceStep} disabled={!contactsText.trim() || sending} style={{ flex: 2, padding: '11px', fontSize: 13, fontWeight: 700, background: contactsText.trim() ? 'var(--cyan)' : 'var(--glass)', color: contactsText.trim() ? '#000' : 'var(--t5)', border: 'none', borderRadius: 9, cursor: contactsText.trim() ? 'pointer' : 'not-allowed', fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                      {sending ? <><div style={{ width: 13, height: 13, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Sending...</> : <><IconSend /> Send emails</>}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── WEBHOOKS VIEW ── */}
      {view === 'webhooks' && (
        <div>
          <div style={{ marginBottom: 16, padding: '14px 16px', background: 'rgba(0,170,255,0.04)', border: '1px solid var(--cline2)', borderRadius: 12, fontSize: 12, color: 'var(--t3)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--cyan)' }}>Connect Nexa to Make, Zapier, or any automation tool.</strong> When something happens in your other tools (new lead, form submission, purchase), Nexa automatically generates content, adds contacts to sequences, or sends notifications.
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--t4)' }}>{webhooks.length} webhook{webhooks.length !== 1 ? 's' : ''} configured</div>
            <button onClick={() => setShowNewWebhook(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', fontSize: 13, fontWeight: 700, background: 'var(--cyan)', color: '#000', border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
              + New webhook
            </button>
          </div>

          {/* Webhook list */}
          {webhooks.length > 0 ? webhooks.map((wh: any) => (
            <div key={wh.id} style={{ marginBottom: 10, padding: '16px', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: wh.is_active ? '#00d68f' : 'var(--t5)' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{wh.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: 'rgba(0,170,255,0.08)', border: '1px solid var(--cline2)', color: 'var(--cyan)' }}>{wh.trigger}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ fontSize: 10, color: 'var(--t5)' }}>{wh.trigger_count || 0} triggers</span>
                  <button onClick={async () => {
                    await fetch('/api/webhooks', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: wh.id }) })
                    setWebhooks(prev => prev.filter((w: any) => w.id !== wh.id))
                  }} style={{ padding: '3px 8px', borderRadius: 5, fontSize: 10, background: 'transparent', border: '1px solid var(--line2)', color: 'var(--t5)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>Delete</button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                <span style={{ fontSize: 10, color: 'var(--t5)', flexShrink: 0 }}>Webhook URL:</span>
                <span style={{ fontSize: 10, color: 'var(--t3)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{wh.webhook_url}</span>
                <button onClick={() => { navigator.clipboard.writeText(wh.webhook_url); setCopiedId(wh.id); setTimeout(() => setCopiedId(null), 2000) }}
                  style={{ padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600, background: copiedId === wh.id ? 'rgba(0,214,143,0.1)' : 'var(--glass2)', border: `1px solid ${copiedId === wh.id ? 'rgba(0,214,143,0.3)' : 'var(--line2)'}`, color: copiedId === wh.id ? '#00d68f' : 'var(--cyan)', cursor: 'pointer', fontFamily: 'var(--sans)', flexShrink: 0 }}>
                  {copiedId === wh.id ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--glass)', border: '1px solid var(--line)', borderRadius: 14 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t2)', marginBottom: 6 }}>No webhooks yet</div>
              <div style={{ fontSize: 13, color: 'var(--t4)', lineHeight: 1.6, marginBottom: 16 }}>Connect Nexa to Make or Zapier to automate content creation when things happen in your other tools.</div>
              <button onClick={() => setShowNewWebhook(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, background: 'var(--cyan)', color: '#000', border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: 'var(--sans)' }}>Create your first webhook →</button>
            </div>
          )}

          {/* New webhook modal */}
          {showNewWebhook && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
              <div style={{ background: 'var(--bg)', border: '1px solid var(--line2)', borderRadius: 16, padding: 28, width: 480, maxWidth: '90vw' }}>
                <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--display)', marginBottom: 20 }}>New Webhook</div>

                <div style={{ marginBottom: 14 }}>
                  <label style={lbl}>Webhook name</label>
                  <input value={webhookName} onChange={e => setWebhookName(e.target.value)} placeholder="e.g. New lead from Typeform" style={inputStyle} />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={lbl}>Trigger (what sends to this webhook)</label>
                  <select value={webhookTrigger} onChange={e => setWebhookTrigger(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="new_lead">New lead / form submission</option>
                    <option value="new_customer">New customer / purchase</option>
                    <option value="content_request">Content request</option>
                    <option value="scheduled">Scheduled (cron)</option>
                    <option value="custom">Custom event</option>
                  </select>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={lbl}>Action (what Nexa does)</label>
                  <select value={webhookAction} onChange={e => setWebhookAction(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="generate_post">Generate & save a post</option>
                    <option value="add_to_sequence">Add contact to email sequence</option>
                    <option value="send_notification">Log notification to activity</option>
                  </select>
                </div>

                {webhookAction === 'generate_post' && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={lbl}>Platform</label>
                    <select value={webhookPlatform} onChange={e => setWebhookPlatform(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="instagram">Instagram</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="x">X</option>
                      <option value="tiktok">TikTok</option>
                    </select>
                  </div>
                )}

                <div style={{ marginBottom: 20, padding: '12px 14px', background: 'rgba(0,170,255,0.04)', border: '1px solid var(--cline2)', borderRadius: 10, fontSize: 12, color: 'var(--t3)', lineHeight: 1.7 }}>
                  <strong style={{ color: 'var(--cyan)' }}>How it works:</strong> You'll get a unique URL. Paste it into Make or Zapier as the webhook destination. When triggered, Nexa will automatically {webhookAction === 'generate_post' ? `generate a ${webhookPlatform} post and save it as a draft` : webhookAction === 'add_to_sequence' ? 'add the contact to your email sequence' : 'log the event to your activity feed'}.
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowNewWebhook(false)} style={{ flex: 1, padding: '11px', fontSize: 13, fontWeight: 600, background: 'var(--glass)', color: 'var(--t3)', border: '1px solid var(--line2)', borderRadius: 9, cursor: 'pointer', fontFamily: 'var(--sans)' }}>Cancel</button>
                  <button
                    onClick={async () => {
                      if (!webhookName.trim()) return
                      setSavingWebhook(true)
                      try {
                        const res = await fetch('/api/webhooks', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            workspace_id: workspace?.id,
                            name: webhookName,
                            trigger: webhookTrigger,
                            actions: [{ type: webhookAction, platform: webhookPlatform }],
                          }),
                        })
                        const data = await res.json()
                        if (data.webhook) {
                          setWebhooks(prev => [data.webhook, ...prev])
                          setShowNewWebhook(false)
                          setWebhookName('')
                        }
                      } catch {}
                      setSavingWebhook(false)
                    }}
                    disabled={!webhookName.trim() || savingWebhook}
                    style={{ flex: 2, padding: '11px', fontSize: 13, fontWeight: 700, background: webhookName.trim() ? 'var(--cyan)' : 'var(--glass)', color: webhookName.trim() ? '#000' : 'var(--t5)', border: 'none', borderRadius: 9, cursor: webhookName.trim() ? 'pointer' : 'not-allowed', fontFamily: 'var(--sans)' }}>
                    {savingWebhook ? 'Creating...' : 'Create webhook →'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
