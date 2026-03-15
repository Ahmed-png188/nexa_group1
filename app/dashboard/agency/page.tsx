'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C', linkedin: '#0A66C2', x: '#1DA1F2', tiktok: '#FF0050',
}

export default function AgencyPage() {
  const supabase = createClient()
  const [workspace, setWorkspace] = useState<any>(null)
  const [clients, setClients] = useState<any[]>([])
  const [invites, setInvites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeClient, setActiveClient] = useState<any>(null)
  const [showNewClient, setShowNewClient] = useState(false)
  const [creating, setCreating] = useState(false)
  const [isAgency, setIsAgency] = useState(false)

  // New client form
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [brandName, setBrandName] = useState('')
  const [monthlyRetainer, setMonthlyRetainer] = useState('')

  // Manage view
  const [activeView, setActiveView] = useState<'clients' | 'detail'>('clients')

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: m } = await supabase
      .from('workspace_members')
      .select('workspace_id, workspaces(*)')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    const ws = (m as any)?.workspaces
    setWorkspace(ws)
    setIsAgency(ws?.plan === 'agency')

    if (ws?.plan === 'agency') {
      const res = await fetch(`/api/agency?agency_workspace_id=${ws.id}`)
      if (res.ok) {
        const data = await res.json()
        setClients(data.clients ?? [])
        setInvites(data.invites ?? [])
      }
    }
    setLoading(false)
  }

  async function createClient_() {
    if (!clientName.trim() || !workspace || creating) return
    setCreating(true)
    try {
      const res = await fetch('/api/agency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency_workspace_id: workspace.id,
          client_name: clientName,
          client_email: clientEmail,
          brand_name: brandName || clientName,
          monthly_retainer: parseFloat(monthlyRetainer) || 0,
        }),
      })
      const data = await res.json()
      if (data.upgrade) {
        alert('Agency plan required. Upgrade in Settings → Billing.')
        setCreating(false)
        return
      }
      if (data.success) {
        setShowNewClient(false)
        setClientName('')
        setClientEmail('')
        setBrandName('')
        setMonthlyRetainer('')
        await load()
      }
    } catch (err) { console.error(err) }
    setCreating(false)
  }

  async function removeClient(id: string) {
    if (!confirm('Remove this client? Their workspace data will be preserved.')) return
    await fetch('/api/agency', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, agency_workspace_id: workspace.id }),
    })
    setClients(prev => prev.filter(c => c.id !== id))
    if (activeClient?.id === id) { setActiveClient(null); setActiveView('clients') }
  }

  async function switchToClient(clientWs: any) {
    // Navigate to client workspace — open in a new context
    window.open(`/client-view/${clientWs.id}`, '_blank')
  }

  const totalMRR = clients.reduce((sum, c) => sum + (c.monthly_retainer || 0), 0)
  const activeClients = clients.filter(c => c.status === 'active').length

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--t4)', fontSize: 13 }}>
      Loading agency dashboard...
    </div>
  )

  // Not on agency plan
  if (!isAgency) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: 40, textAlign: 'center' }}>
      <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(0,170,255,0.07)', border: '1px solid var(--cline2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, fontSize: 32 }}>🏢</div>
      <h2 style={{ fontFamily: 'var(--display)', fontSize: 24, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 10 }}>Agency tier</h2>
      <p style={{ fontSize: 14, color: 'var(--t4)', lineHeight: 1.7, maxWidth: 440, marginBottom: 12 }}>
        Manage multiple client brands from one dashboard. Generate content, build strategies, and run automations for all your clients — white-labeled under your agency.
      </p>
      <div style={{ marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
        {['Unlimited client workspaces', 'Separate brand profiles per client', 'Generate content for any client brand', 'Full strategy + automation per client', '15,000 credits/month', 'White-label ready'].map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--t3)' }}>
            <span style={{ color: '#00d68f', fontSize: 14 }}>✓</span> {f}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--display)', color: 'var(--cyan)', marginBottom: 20 }}>$349<span style={{ fontSize: 14, fontWeight: 500, color: 'var(--t4)' }}>/month</span></div>
      <a href="/dashboard/settings?tab=billing"
        style={{ padding: '14px 36px', fontSize: 14, fontWeight: 700, background: 'var(--cyan)', color: '#000', border: 'none', borderRadius: 12, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}>
        Upgrade to Agency →
      </a>
    </div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: activeClient ? '280px 1fr' : '1fr', height: 'calc(100vh - var(--topbar-h))', overflow: 'hidden' }}>

      {/* ── Client list panel ── */}
      <div style={{ borderRight: activeClient ? '1px solid var(--line)' : 'none', overflowY: 'auto', padding: '24px 20px' }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 4 }}>Agency</h1>
          <div style={{ fontSize: 12, color: 'var(--t4)' }}>{activeClients} active client{activeClients !== 1 ? 's' : ''}</div>
        </div>

        {/* MRR stat */}
        {totalMRR > 0 && (
          <div style={{ marginBottom: 16, padding: '12px 14px', background: 'rgba(0,214,143,0.06)', border: '1px solid rgba(0,214,143,0.2)', borderRadius: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#00d68f', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>Monthly Retainer</div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 26, fontWeight: 800, color: '#00d68f', letterSpacing: '-0.04em' }}>${totalMRR.toLocaleString()}</div>
          </div>
        )}

        {/* New client button */}
        <button onClick={() => setShowNewClient(true)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', fontSize: 13, fontWeight: 700, background: 'var(--cyan)', color: '#000', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--sans)', marginBottom: 16 }}>
          + Add client
        </button>

        {/* Client cards */}
        {clients.length > 0 ? clients.map(client => {
          const cws = client.client_workspace
          const isActive = activeClient?.id === client.id
          return (
            <div key={client.id}
              onClick={() => setActiveClient(isActive ? null : client)}
              style={{ marginBottom: 8, padding: '14px', background: isActive ? 'rgba(0,170,255,0.06)' : 'var(--glass)', border: `1px solid ${isActive ? 'var(--cline2)' : 'var(--line2)'}`, borderRadius: 12, cursor: 'pointer', transition: 'all .15s' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(0,170,255,0.1)', border: '1px solid var(--cline2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'var(--cyan)' }}>
                    {(cws?.brand_name || client.client_name)?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{cws?.brand_name || client.client_name}</div>
                    <div style={{ fontSize: 10, color: 'var(--t5)' }}>{client.client_email || 'No email'}</div>
                  </div>
                </div>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: client.status === 'active' ? '#00d68f' : 'var(--t5)', flexShrink: 0 }} />
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 3, background: 'var(--glass2)', color: 'var(--t5)' }}>{client.stats?.total_content || 0} pieces</span>
                {client.monthly_retainer > 0 && <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 3, background: 'rgba(0,214,143,0.08)', color: '#00d68f' }}>${client.monthly_retainer}/mo</span>}
                {client.stats?.connected_platforms?.map((p: string) => (
                  <span key={p} style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: `${PLATFORM_COLORS[p] || '#888'}15`, color: PLATFORM_COLORS[p] || 'var(--t4)' }}>{p.slice(0, 2).toUpperCase()}</span>
                ))}
              </div>
            </div>
          )
        }) : (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--t5)', fontSize: 12, lineHeight: 1.6 }}>
            No clients yet. Add your first client to get started.
          </div>
        )}

        {/* Pending invites */}
        {invites.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t5)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Pending invites</div>
            {invites.map(inv => (
              <div key={inv.id} style={{ padding: '10px 12px', background: 'rgba(255,170,0,0.05)', border: '1px solid rgba(255,170,0,0.2)', borderRadius: 8, marginBottom: 6 }}>
                <div style={{ fontSize: 12, color: 'var(--t2)' }}>{inv.client_name || inv.client_email}</div>
                <div style={{ fontSize: 10, color: 'var(--amber)' }}>Invite pending</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Client detail panel ── */}
      {activeClient && (
        <div style={{ overflowY: 'auto', padding: '24px 28px' }}>
          {(() => {
            const client = activeClient
            const cws = client.client_workspace
            return (
              <>
                {/* Client header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(0,170,255,0.1)', border: '1px solid var(--cline2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: 'var(--cyan)' }}>
                      {(cws?.brand_name || client.client_name)?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h2 style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 3 }}>{cws?.brand_name || client.client_name}</h2>
                      <div style={{ fontSize: 12, color: 'var(--t4)', display: 'flex', gap: 10 }}>
                        {client.client_email && <span>{client.client_email}</span>}
                        {client.monthly_retainer > 0 && <span style={{ color: '#00d68f', fontWeight: 600 }}>${client.monthly_retainer}/mo retainer</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => window.location.href = `/dashboard?switch=${cws?.id}`}
                      style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, background: 'var(--cyan)', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                      Manage brand →
                    </button>
                    <button onClick={() => removeClient(client.id)}
                      style={{ padding: '8px 12px', fontSize: 12, background: 'var(--glass)', border: '1px solid var(--line2)', color: 'var(--t5)', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                      Remove
                    </button>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
                  {[
                    { label: 'Content created', value: client.stats?.total_content ?? 0, color: 'var(--cyan)' },
                    { label: 'Published', value: client.stats?.published ?? 0, color: '#00d68f' },
                    { label: 'Credits left', value: (client.stats?.credits_balance ?? 0).toLocaleString(), color: 'var(--t1)' },
                    { label: 'Platforms', value: client.stats?.connected_platforms?.length ?? 0, color: '#8b5cf6' },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 12, padding: '14px' }}>
                      <div style={{ fontFamily: 'var(--display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t4)', marginTop: 4 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Brand profile */}
                <div style={{ background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 14, padding: '18px 20px', marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', marginBottom: 14 }}>Brand profile</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                      { label: 'Brand name', value: cws?.brand_name || '—' },
                      { label: 'Plan', value: cws?.plan || '—' },
                      { label: 'Brand voice', value: cws?.brand_voice || 'Not analyzed yet' },
                      { label: 'Status', value: client.status },
                    ].map(field => (
                      <div key={field.label}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--t5)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>{field.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--t2)' }}>{field.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Connected platforms */}
                <div style={{ background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 14, padding: '18px 20px', marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', marginBottom: 12 }}>Connected platforms</div>
                  {client.stats?.connected_platforms?.length > 0 ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      {client.stats.connected_platforms.map((p: string) => (
                        <div key={p} style={{ padding: '6px 12px', borderRadius: 8, background: `${PLATFORM_COLORS[p] || '#888'}15`, border: `1px solid ${PLATFORM_COLORS[p] || '#888'}30`, fontSize: 11, fontWeight: 700, color: PLATFORM_COLORS[p] || 'var(--t3)', textTransform: 'capitalize' }}>
                          {p}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--t5)' }}>No platforms connected. Click "Manage brand" to connect.</div>
                  )}
                </div>

                {/* Quick actions for this client */}
                <div style={{ background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 14, padding: '18px 20px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', marginBottom: 12 }}>Quick actions</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { label: 'Build brand profile', desc: 'Run AI analysis on their brand', icon: '🧠', href: `/dashboard/brand?ws=${cws?.id}` },
                      { label: 'Generate content', desc: 'Create posts in their brand voice', icon: '✍️', href: `/dashboard/studio?ws=${cws?.id}` },
                      { label: 'Build strategy', desc: 'Generate their content strategy', icon: '🎯', href: `/dashboard/strategy?ws=${cws?.id}` },
                      { label: 'View insights', desc: 'Check their performance data', icon: '📊', href: `/dashboard/insights?ws=${cws?.id}` },
                    ].map(action => (
                      <a key={action.label} href={action.href}
                        style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--line)', borderRadius: 10, textDecoration: 'none', display: 'block', transition: 'all .15s' }}>
                        <div style={{ fontSize: 18, marginBottom: 6 }}>{action.icon}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', marginBottom: 3 }}>{action.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--t5)' }}>{action.desc}</div>
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )
          })()}
        </div>
      )}

      {/* ── New client modal ── */}
      {showNewClient && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(6px)' }}>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--line2)', borderRadius: 18, padding: 32, width: 480, maxWidth: '90vw' }}>
            <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>Add client</div>
            <div style={{ fontSize: 12, color: 'var(--t4)', marginBottom: 22 }}>Create a separate brand workspace for your client. You'll be able to manage their brand, generate content, and run their strategy.</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Client / company name *</label>
                <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Acme Corporation" style={inp} />
              </div>
              <div>
                <label style={lbl}>Client email (optional)</label>
                <input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="client@company.com" style={inp} type="email" />
              </div>
              <div>
                <label style={lbl}>Brand name (if different)</label>
                <input value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="e.g. Acme (leave blank to use company name)" style={inp} />
              </div>
              <div>
                <label style={lbl}>Monthly retainer ($)</label>
                <input value={monthlyRetainer} onChange={e => setMonthlyRetainer(e.target.value)} placeholder="e.g. 2000" style={inp} type="number" />
              </div>
            </div>

            <div style={{ marginTop: 14, marginBottom: 20, padding: '10px 12px', background: 'rgba(0,170,255,0.04)', border: '1px solid var(--cline2)', borderRadius: 8, fontSize: 11, color: 'var(--t4)', lineHeight: 1.6 }}>
              This creates a separate workspace with 1,000 starter credits. You'll be able to manage everything from here.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowNewClient(false)} style={{ flex: 1, padding: '11px', fontSize: 13, fontWeight: 600, background: 'var(--glass)', color: 'var(--t3)', border: '1px solid var(--line2)', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--sans)' }}>Cancel</button>
              <button onClick={createClient_} disabled={!clientName.trim() || creating}
                style={{ flex: 2, padding: '11px', fontSize: 13, fontWeight: 700, background: clientName.trim() ? 'var(--cyan)' : 'var(--glass)', color: clientName.trim() ? '#000' : 'var(--t5)', border: 'none', borderRadius: 10, cursor: clientName.trim() ? 'pointer' : 'not-allowed', fontFamily: 'var(--sans)' }}>
                {creating ? 'Creating workspace...' : 'Create client workspace →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--t4)', marginBottom: 7 }
const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', fontSize: 13, fontFamily: 'var(--sans)', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 9, color: 'var(--t1)', outline: 'none' }
