'use client'

import { useState, useEffect } from 'react'

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
    cost: 'Free', status: 'coming_soon', badge: 'Automation', color: '#A855F7',
    docs: 'https://make.com'
  },
  {
    id: 'zapier', name: 'Zapier', category: 'automation',
    desc: 'Automate anything. Trigger Nexa actions from any Zapier-connected tool.',
    cost: 'Free', status: 'coming_soon', badge: 'Automation', color: '#FF6B35',
    docs: 'https://zapier.com'
  },
  {
    id: 'whatsapp', name: 'WhatsApp Business', category: 'communication',
    desc: 'Send email sequences via WhatsApp. Reach clients where they actually respond.',
    cost: 'Free', status: 'coming_soon', badge: 'Communication', color: '#25D366',
    docs: 'https://business.whatsapp.com'
  },
]

function IntegrationLogo({ id, name, color }: { id: string; name: string; color: string }) {
  const logos: Record<string, React.ReactNode> = {
    instagram: <div style={{ width:40, height:40, borderRadius:9, background:'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="white" stroke="none"/></svg></div>,
    linkedin: <div style={{ width:40, height:40, borderRadius:9, background:'#0A66C2', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></div>,
    x: <div style={{ width:40, height:40, borderRadius:9, background:'#000', border:'1px solid rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L2.25 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></div>,
    tiktok: <div style={{ width:40, height:40, borderRadius:9, background:'#010101', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="19" height="19" viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.73a4.85 4.85 0 0 1-1.01-.04z"/></svg></div>,
    notion: <div style={{ width:40, height:40, borderRadius:9, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="#000"><path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.887l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933z"/></svg></div>,
    slack: <div style={{ width:40, height:40, borderRadius:9, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="20" height="20" viewBox="0 0 24 24"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z" fill="#E01E5A"/><path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="#E01E5A"/><path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z" fill="#2EB67D"/><path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z" fill="#2EB67D"/><path d="M10 9.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z" fill="#ECB22E"/><path d="M10 3.5C10 2.67 10.67 2 11.5 2S13 2.67 13 3.5V5h-1.5C10.67 5 10 4.33 10 3.5z" fill="#ECB22E"/><path d="M14 14.5c0 .83-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5z" fill="#36C5F0"/><path d="M14 20.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5V19h1.5c.83 0 1.5.67 1.5 1.5z" fill="#36C5F0"/></svg></div>,
    hubspot: <div style={{ width:40, height:40, borderRadius:9, background:'#FF7A59', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M20.316 11.246l-3.196-1.566V7.684a2.03 2.03 0 0 0 1.13-1.82V5.82a2.03 2.03 0 0 0-2.03-2.03h-.052a2.03 2.03 0 0 0-2.03 2.03v.044c0 .793.46 1.482 1.13 1.82v1.996l-3.12-1.528a1.2 1.2 0 0 0-1.11.042L3.9 11.246a1.2 1.2 0 0 0 0 2.086l7.14 3.5a1.2 1.2 0 0 0 1.048 0l8.228-4.028a1.2 1.2 0 0 0 0-2.558z"/></svg></div>,
    'google-drive': <div style={{ width:40, height:40, borderRadius:9, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="20" height="17" viewBox="0 0 87 78"><path d="M55.7 30L43.5 9 31.3 30z" fill="#FBBC05"/><path d="M87 69L74.8 48H12.2L0 69z" fill="#4285F4"/><path d="M31.3 30L0 69l12.2-21L43.5 9z" fill="#34A853"/><path d="M55.7 30l31.3 39H74.8L43.5 9z" fill="#EA4335"/></svg></div>,
    'google-analytics': <div style={{ width:40, height:40, borderRadius:9, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="12" width="4" height="9" rx="1" fill="#F9AB00"/><rect x="10" y="7" width="4" height="14" rx="1" fill="#E37400"/><rect x="17" y="3" width="4" height="18" rx="1" fill="#E37400"/></svg></div>,
    asana: <div style={{ width:40, height:40, borderRadius:9, background:'#F06A6A', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5.5" r="3.5" fill="white"/><circle cx="5" cy="15.5" r="3.5" fill="white"/><circle cx="19" cy="15.5" r="3.5" fill="white"/></svg></div>,
    calendly: <div style={{ width:40, height:40, borderRadius:9, background:'#006BFF', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4M16 2v4"/></svg></div>,
    whatsapp: <div style={{ width:40, height:40, borderRadius:9, background:'#25D366', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.95-1.418A9.954 9.954 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="white"/><path d="M8.5 9.5c.5 1 1.5 3 3.5 4s3-1 3-1-.5-1.5-1-1.5S13 11.5 13 11.5s-1-1.5-2-3c-.5-.75-1.5-.5-2 0s-.5 1.5 0 1" fill="#25D366"/></svg></div>,
    make: <div style={{ width:40, height:40, borderRadius:9, background:'#A855F7', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="7" stroke="white" strokeWidth="1.5"/><path d="M9 12h6M12 9v6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg></div>,
    zapier: <div style={{ width:40, height:40, borderRadius:9, background:'#FF4A00', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M13.5 2L3 13h7.5L9 22l12-11h-7.5L13.5 2z" fill="white"/></svg></div>,
  }
  const logo = logos[id]
  if (logo) return <>{logo}</>
  return (
    <div style={{ width:40, height:40, borderRadius:9, background:`${color}22`, border:`1px solid ${color}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color, fontFamily:'var(--display)' }}>
      {name[0]}
    </div>
  )
}

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
  const [connected, setConnected] = useState<string[]>([])
  const [notified, setNotified] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('nexa_connected_integrations')
      if (stored) setConnected(JSON.parse(stored))
    } catch {}
  }, [])

  function handleConnect(id: string) {
    const newConnected = [...connected, id]
    setConnected(newConnected)
    try { localStorage.setItem('nexa_connected_integrations', JSON.stringify(newConnected)) } catch {}
  }

  function handleNotify(name: string) {
    setNotified(prev => [...prev, name])
    alert(`We'll email you when ${name} is available.`)
  }

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
        <h1 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.03em', marginBottom: 4 }}>Integrations</h1>
        <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--t4)', marginBottom: 16 }}>
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
            <button key={cat.id} onClick={() => setCategory(cat.id)} style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: category === cat.id ? 'var(--glass2)' : 'transparent', color: category === cat.id ? 'var(--t1)' : 'var(--t4)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>
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
                  <div style={{ width:40, height:40, borderRadius:9, overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <IntegrationLogo id={integration.id} name={integration.name} color={integration.color} />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em', color: 'var(--t1)', lineHeight: 1.2 }}>{integration.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--t5)', marginTop: 1 }}>{integration.badge}</div>
                  </div>
                </div>
                <span style={{ fontFamily: 'var(--sans)', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 100, background: statusConf.bg, color: statusConf.color, border: `1px solid ${statusConf.border}`, flexShrink: 0 }}>
                  {statusConf.label}
                </span>
              </div>

              {/* Description */}
              <p style={{ fontFamily: 'var(--sans)', fontSize: 13, lineHeight: 1.65, color: 'var(--t4)', marginBottom: 14, minHeight: 54 }}>
                {integration.desc}
              </p>

              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 300, fontSize: 12, color: integration.cost === 'Built in' ? '#00d68f' : integration.cost === 'Free' || integration.cost === 'Free connector' ? '#00d68f' : 'var(--cyan)' }}>
                  {integration.cost}
                </span>
                {integration.status === 'active' ? (
                  <a href={integration.docs} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 700, color: '#00d68f', textDecoration: 'none' }}>
                    View docs →
                  </a>
                ) : integration.status === 'beta' ? (
                  connected.includes(integration.id) ? (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#34D399', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Connected
                    </span>
                  ) : (
                    <button onClick={() => handleConnect(integration.id)} style={{ fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 500, color: 'var(--cyan)', background: 'rgba(30,142,240,0.08)', border: '1px solid rgba(30,142,240,0.2)', borderRadius: 7, padding: '4px 10px', cursor: 'pointer' }}>
                      Connect
                    </button>
                  )
                ) : (
                  <button onClick={() => handleNotify(integration.name)} style={{ fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 500, color: 'var(--t4)', background: 'var(--glass)', border: '1px solid var(--line2)', borderRadius: 7, padding: '4px 10px', cursor: 'pointer' }}>
                    Notify me
                  </button>
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
