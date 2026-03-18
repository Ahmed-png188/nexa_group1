'use client'

import { useState } from 'react'

type Category = 'all' | 'publishing' | 'productivity' | 'automation' | 'crm' | 'analytics' | 'communication'

const INTEGRATIONS = [
  {
    id: 'notion', name: 'Notion', category: 'productivity',
    desc: 'Sync your content briefs, ideas, and strategy directly with your Notion workspace.',
    cost: 'Free', status: 'coming_soon', badge: 'Productivity', color: '#ffffff',
    docs: 'https://notion.so'
  },
  {
    id: 'slack', name: 'Slack', category: 'communication',
    desc: 'Get your daily brief, content alerts, and performance updates delivered to Slack.',
    cost: 'Free', status: 'coming_soon', badge: 'Communication', color: '#4A154B',
    docs: 'https://slack.com'
  },
  {
    id: 'hubspot', name: 'HubSpot', category: 'crm',
    desc: 'Connect your email sequences to HubSpot. Turn content engagement into sales pipeline.',
    cost: 'Free', status: 'coming_soon', badge: 'CRM', color: '#FF7A59',
    docs: 'https://hubspot.com'
  },
  {
    id: 'google-drive', name: 'Google Drive', category: 'productivity',
    desc: 'Import brand documents, guidelines, and assets directly from Drive into Brand Brain.',
    cost: 'Free', status: 'coming_soon', badge: 'Productivity', color: '#4285F4',
    docs: 'https://drive.google.com'
  },
  {
    id: 'google-analytics', name: 'Google Analytics', category: 'analytics',
    desc: 'See which content drives real traffic and conversions. Close the loop between posts and revenue.',
    cost: 'Free', status: 'coming_soon', badge: 'Analytics', color: '#F9AB00',
    docs: 'https://analytics.google.com'
  },
  {
    id: 'asana', name: 'Asana', category: 'productivity',
    desc: 'Turn your content calendar into Asana tasks. Keep your team aligned on every piece.',
    cost: 'Free', status: 'coming_soon', badge: 'Productivity', color: '#F06A6A',
    docs: 'https://asana.com'
  },
  {
    id: 'calendly', name: 'Calendly', category: 'crm',
    desc: 'Attach your booking link to content automatically. Turn readers into booked calls.',
    cost: 'Free', status: 'coming_soon', badge: 'Sales', color: '#006BFF',
    docs: 'https://calendly.com'
  },
  {
    id: 'instagram', name: 'Instagram', category: 'publishing',
    desc: 'Publish posts, Reels, and Stories directly from Nexa. Schedule weeks in advance.',
    cost: '1 credit / post', status: 'beta', badge: 'Publishing', color: '#E1306C',
    docs: 'https://developers.facebook.com'
  },
  {
    id: 'linkedin', name: 'LinkedIn', category: 'publishing',
    desc: 'Auto-publish posts and articles to your LinkedIn profile or company page.',
    cost: '1 credit / post', status: 'beta', badge: 'Publishing', color: '#0A66C2',
    docs: 'https://developer.linkedin.com'
  },
  {
    id: 'x', name: 'X / Twitter', category: 'publishing',
    desc: 'Schedule and publish threads at optimal times based on your audience data.',
    cost: '1 credit / post', status: 'beta', badge: 'Publishing', color: '#000000',
    docs: 'https://developer.x.com'
  },
  {
    id: 'tiktok', name: 'TikTok', category: 'publishing',
    desc: 'Schedule and publish TikTok videos directly from Nexa Studio.',
    cost: '1 credit / post', status: 'beta', badge: 'Publishing', color: '#FF0050',
    docs: 'https://developers.tiktok.com'
  },
  {
    id: 'make', name: 'Make.com', category: 'automation',
    desc: 'Connect Nexa to 2000+ apps. Trigger content generation from any external tool.',
    cost: 'Free', status: 'active', badge: 'Automation', color: '#A855F7',
    docs: 'https://make.com'
  },
  {
    id: 'zapier', name: 'Zapier', category: 'automation',
    desc: 'Automate anything. Trigger Nexa actions from any Zapier-connected tool.',
    cost: 'Free', status: 'active', badge: 'Automation', color: '#FF6B35',
    docs: 'https://zapier.com'
  },
  {
    id: 'whatsapp', name: 'WhatsApp Business', category: 'communication',
    desc: 'Send email sequences via WhatsApp. Reach clients where they actually respond.',
    cost: 'Free', status: 'coming_soon', badge: 'Communication', color: '#25D366',
    docs: 'https://business.whatsapp.com'
  },
]

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all',           label: 'All' },
  { id: 'publishing',    label: 'Publishing' },
  { id: 'productivity',  label: 'Productivity' },
  { id: 'automation',    label: 'Automation' },
  { id: 'crm',           label: 'CRM & Sales' },
  { id: 'analytics',     label: 'Analytics' },
  { id: 'communication', label: 'Communication' },
]

const STATUS_CONFIG = {
  active:       { label: 'Active',       color: '#00d68f',       bg: 'rgba(0,214,143,0.08)',  border: 'rgba(0,214,143,0.2)' },
  beta:         { label: 'Beta',         color: 'var(--amber)',  bg: 'rgba(255,184,0,0.07)',  border: 'rgba(255,184,0,0.2)' },
  coming_soon:  { label: 'Coming soon',  color: 'var(--t4)',     bg: 'var(--glass)',           border: 'var(--line)' },
}

export default function IntegrationsPage() {
  const [category, setCategory] = useState<Category>('all' as Category)
  const [search, setSearch] = useState('')

  const filtered = INTEGRATIONS.filter(i => {
    const matchCat = category === 'all' || i.category === category
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) ||
                       i.desc.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const active = INTEGRATIONS.filter(i => i.status === 'active').length
  const beta = INTEGRATIONS.filter(i => i.status === 'beta').length
  const coming = INTEGRATIONS.filter(i => i.status === 'coming_soon').length

  return (
    <div style={{ padding: '28px', maxWidth: 1000 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 4 }}>Integrations</h1>
        <p style={{ fontSize: 13, color: 'var(--t4)', marginBottom: 16 }}>
          The tools your business already uses, connected to your content engine.
        </p>
        <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
          <span style={{ color: '#00d68f', fontWeight: 600 }}>● {active} active</span>
          <span style={{ color: 'var(--amber)', fontWeight: 600 }}>● {beta} beta</span>
          <span style={{ color: 'var(--t4)' }}>● {coming} coming soon</span>
        </div>
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--t5)" strokeWidth="1.5" strokeLinecap="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search integrations..."
            style={{ width: '100%', padding: '9px 12px 9px 34px', fontSize: 13, fontFamily: 'var(--sans)', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 9, color: 'var(--t1)', outline: 'none' }}
            onFocus={e => (e.target.style.borderColor = 'var(--cyan-line)')}
            onBlur={e => (e.target.style.borderColor = 'var(--line2)')}
          />
        </div>
        <div style={{ display: 'flex', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 9, padding: 3, gap: 2, flexShrink: 0 }}>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setCategory(cat.id)} style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: category === cat.id ? 'var(--glass2)' : 'transparent', color: category === cat.id ? 'var(--t1)' : 'var(--t4)', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--sans)', whiteSpace: 'nowrap' }}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {filtered.map(integration => {
          const statusConf = STATUS_CONFIG[integration.status as keyof typeof STATUS_CONFIG]
          return (
            <div key={integration.id} style={{ padding: '20px', background: 'var(--glass)', border: `1px solid ${integration.status === 'active' ? 'var(--cyan-line)' : 'var(--line2)'}`, borderRadius: 14, position: 'relative', transition: 'border-color .15s, transform .15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.18)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = integration.status === 'active' ? 'var(--cyan-line)' : 'var(--line2)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${integration.color}18`, border: `1px solid ${integration.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: integration.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.2 }}>{integration.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--t5)', marginTop: 1 }}>{integration.badge}</div>
                  </div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 100, background: statusConf.bg, color: statusConf.color, border: `1px solid ${statusConf.border}`, flexShrink: 0 }}>
                  {statusConf.label}
                </span>
              </div>

              {/* Description */}
              <p style={{ fontSize: 12.5, color: 'var(--t4)', lineHeight: 1.65, marginBottom: 14, minHeight: 54 }}>
                {integration.desc}
              </p>

              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: integration.cost === 'Built in' ? '#00d68f' : integration.cost === 'Free' || integration.cost === 'Free connector' ? '#00d68f' : 'var(--cyan)' }}>
                  {integration.cost}
                </span>
                {integration.status === 'active' ? (
                  <a href={integration.category === 'automation' ? '/dashboard/automate' : integration.category === 'publishing' ? '/dashboard/schedule' : '/dashboard/studio'} style={{ fontSize: 11, fontWeight: 700, color: '#00d68f', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Active →
                  </a>
                ) : integration.status === 'beta' ? (
                  <a href="/dashboard/studio" style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Use in Studio →
                  </a>
                ) : (
                  <a href={integration.docs} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--t5)', textDecoration: 'none' }}>
                    Docs →
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom CTA */}
      <div style={{ marginTop: 28, padding: '20px 24px', background: 'rgba(0,170,255,0.04)', border: '1px solid var(--cyan-line)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>Need a specific integration?</div>
          <div style={{ fontSize: 12, color: 'var(--t4)' }}>We add new ones every week based on what our users actually use.</div>
        </div>
        <a href="mailto:hello@nexaa.cc?subject=Integration request" style={{ padding: '9px 18px', fontSize: 13, fontWeight: 700, background: 'var(--cyan)', color: '#000', borderRadius: 9, textDecoration: 'none', fontFamily: 'var(--sans)', whiteSpace: 'nowrap', flexShrink: 0 }}>
          Request integration →
        </a>
      </div>
    </div>
  )
}
