'use client'
import { useLang } from '@/lib/language-context'

import { useState, useEffect } from 'react'

type Category = 'all' | 'publishing' | 'productivity' | 'automation' | 'crm' | 'analytics' | 'communication'

const F_DEFAULT = "'Geist', -apple-system, sans-serif"
const MONO = "'Geist Mono', monospace"

const INTEGRATIONS = [
  { id:'instagram',        name:'Instagram',         category:'publishing',    desc:'Publish posts, Reels, and Stories directly from Nexa. Schedule weeks in advance.',                          cost:'1 cr / post', status:'beta',        badge:'Publishing',    color:'#E1306C' },
  { id:'linkedin',         name:'LinkedIn',          category:'publishing',    desc:'Auto-publish posts and articles to your LinkedIn profile or company page.',                                 cost:'1 cr / post', status:'beta',        badge:'Publishing',    color:'#0A66C2' },
  { id:'x',                name:'X / Twitter',       category:'publishing',    desc:'Schedule and publish threads at optimal times based on your audience data.',                                 cost:'1 cr / post', status:'beta',        badge:'Publishing',    color:'#E7E7E7' },
  { id:'tiktok',           name:'TikTok',            category:'publishing',    desc:'Schedule and publish TikTok videos directly from Nexa Studio.',                                              cost:'1 cr / post', status:'beta',        badge:'Publishing',    color:'#FF0050' },
  { id:'notion',           name:'Notion',            category:'productivity',  desc:'Sync your content briefs, ideas, and strategy directly with your Notion workspace.',                        cost:'Free',        status:'coming_soon', badge:'Productivity',  color:'#ffffff' },
  { id:'google-drive',     name:'Google Drive',      category:'productivity',  desc:'Import brand documents, guidelines, and assets directly from Drive into Brand Brain.',                     cost:'Free',        status:'coming_soon', badge:'Productivity',  color:'#4285F4' },
  { id:'asana',            name:'Asana',             category:'productivity',  desc:'Turn your content calendar into Asana tasks. Keep your team aligned on every piece.',                      cost:'Free',        status:'coming_soon', badge:'Productivity',  color:'#F06A6A' },
  { id:'slack',            name:'Slack',             category:'communication', desc:'Get your daily brief, content alerts, and performance updates delivered to Slack.',                         cost:'Free',        status:'coming_soon', badge:'Communication', color:'#4A154B' },
  { id:'whatsapp',         name:'WhatsApp Business', category:'communication', desc:'Send email sequences via WhatsApp. Reach clients where they actually respond.',                             cost:'Free',        status:'coming_soon', badge:'Communication', color:'#25D366' },
  { id:'hubspot',          name:'HubSpot',           category:'crm',           desc:'Connect your email sequences to HubSpot. Turn content engagement into sales pipeline.',                    cost:'Free',        status:'coming_soon', badge:'CRM',           color:'#FF7A59' },
  { id:'calendly',         name:'Calendly',          category:'crm',           desc:'Attach your booking link to content automatically. Turn readers into booked calls.',                       cost:'Free',        status:'coming_soon', badge:'Sales',         color:'#006BFF' },
  { id:'google-analytics', name:'Google Analytics',  category:'analytics',     desc:'See which content drives real traffic and conversions. Close the loop between posts and revenue.',         cost:'Free',        status:'coming_soon', badge:'Analytics',     color:'#F9AB00' },
  { id:'make',             name:'Make.com',          category:'automation',    desc:'Connect Nexa to 2000+ apps. Trigger content generation from any external tool.',                           cost:'Free',        status:'coming_soon', badge:'Automation',    color:'#A855F7' },
  { id:'zapier',           name:'Zapier',            category:'automation',    desc:'Automate anything. Trigger Nexa actions from any Zapier-connected tool.',                                  cost:'Free',        status:'coming_soon', badge:'Automation',    color:'#FF6B35' },
]

const CATEGORIES: { id: Category; label: string }[] = [
  { id:'all' as Category,           label: 'All'           },
  { id:'publishing' as Category,    label: 'Publishing'    },
  { id:'productivity' as Category,  label: 'Productivity'  },
  { id:'automation' as Category,    label: 'Automation'    },
  { id:'crm',           label:'CRM & Sales'   },
  { id:'analytics',     label:'Analytics'     },
  { id:'communication' as Category, label: 'Communication' },
]

function IntegrationLogo({ id, name, color }: { id: string; name: string; color: string }) {
  const logos: Record<string, React.ReactNode> = {
    instagram:        <div style={{ width:40, height:40, borderRadius:'10px', background:'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="white" stroke="none"/></svg></div>,
    linkedin:         <div style={{ width:40, height:40, borderRadius:'10px', background:'#0A66C2', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></div>,
    x:                <div style={{ width:40, height:40, borderRadius:'10px', background:'#0C0C0C', border:'1px solid rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L2.25 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></div>,
    tiktok:           <div style={{ width:40, height:40, borderRadius:'10px', background:'#010101', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="19" height="19" viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.73a4.85 4.85 0 0 1-1.01-.04z"/></svg></div>,
    notion:           <div style={{ width:40, height:40, borderRadius:'10px', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="#000"><path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.887l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933z"/></svg></div>,
    slack:            <div style={{ width:40, height:40, borderRadius:'10px', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="20" height="20" viewBox="0 0 24 24"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z" fill="#E01E5A"/><path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="#E01E5A"/><path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z" fill="#2EB67D"/><path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z" fill="#2EB67D"/><path d="M10 9.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z" fill="#ECB22E"/><path d="M10 3.5C10 2.67 10.67 2 11.5 2S13 2.67 13 3.5V5h-1.5C10.67 5 10 4.33 10 3.5z" fill="#ECB22E"/><path d="M14 14.5c0 .83-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5z" fill="#36C5F0"/><path d="M14 20.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5V19h1.5c.83 0 1.5.67 1.5 1.5z" fill="#36C5F0"/></svg></div>,
    hubspot:          <div style={{ width:40, height:40, borderRadius:'10px', background:'#FF7A59', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M20.316 11.246l-3.196-1.566V7.684a2.03 2.03 0 0 0 1.13-1.82V5.82a2.03 2.03 0 0 0-2.03-2.03h-.052a2.03 2.03 0 0 0-2.03 2.03v.044c0 .793.46 1.482 1.13 1.82v1.996l-3.12-1.528a1.2 1.2 0 0 0-1.11.042L3.9 11.246a1.2 1.2 0 0 0 0 2.086l7.14 3.5a1.2 1.2 0 0 0 1.048 0l8.228-4.028a1.2 1.2 0 0 0 0-2.558z"/></svg></div>,
    'google-drive':   <div style={{ width:40, height:40, borderRadius:'10px', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="20" height="17" viewBox="0 0 87 78"><path d="M55.7 30L43.5 9 31.3 30z" fill="#FBBC05"/><path d="M87 69L74.8 48H12.2L0 69z" fill="#4285F4"/><path d="M31.3 30L0 69l12.2-21L43.5 9z" fill="#34A853"/><path d="M55.7 30l31.3 39H74.8L43.5 9z" fill="#EA4335"/></svg></div>,
    'google-analytics':<div style={{ width:40, height:40, borderRadius:'10px', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="12" width="4" height="9" rx="1" fill="#F9AB00"/><rect x="10" y="7" width="4" height="14" rx="1" fill="#E37400"/><rect x="17" y="3" width="4" height="18" rx="1" fill="#E37400"/></svg></div>,
    asana:            <div style={{ width:40, height:40, borderRadius:'10px', background:'#F06A6A', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5.5" r="3.5" fill="white"/><circle cx="5" cy="15.5" r="3.5" fill="white"/><circle cx="19" cy="15.5" r="3.5" fill="white"/></svg></div>,
    calendly:         <div style={{ width:40, height:40, borderRadius:'10px', background:'#006BFF', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4M16 2v4"/></svg></div>,
    whatsapp:         <div style={{ width:40, height:40, borderRadius:'10px', background:'#25D366', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.95-1.418A9.954 9.954 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="white"/><path d="M8.5 9.5c.5 1 1.5 3 3.5 4s3-1 3-1-.5-1.5-1-1.5S13 11.5 13 11.5s-1-1.5-2-3c-.5-.75-1.5-.5-2 0s-.5 1.5 0 1" fill="#25D366"/></svg></div>,
    make:             <div style={{ width:40, height:40, borderRadius:'10px', background:'#A855F7', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="7" stroke="white" strokeWidth="1.5"/><path d="M9 12h6M12 9v6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg></div>,
    zapier:           <div style={{ width:40, height:40, borderRadius:'10px', background:'#FF4A00', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M13.5 2L3 13h7.5L9 22l12-11h-7.5L13.5 2z" fill="white"/></svg></div>,
  }
  return <>{logos[id] || <div style={{ width:40, height:40, borderRadius:'10px', background:`${color}22`, border:`1px solid ${color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:700, color, fontFamily:F_DEFAULT }}>{name[0]}</div>}</>
}

export default function IntegrationsPage() {
  const { isArabic } = useLang()
  const F = isArabic ? "'Tajawal', system-ui, sans-serif" : F_DEFAULT
  const [category, setCategory]   = useState<Category>('all')
  const [search,   setSearch]     = useState('')
  const [connected, setConnected] = useState<string[]>([])
  const [mounted,   setMounted]   = useState(false)

  useEffect(() => {
    setMounted(true)
    try { const s = localStorage.getItem('nexa_connected'); if (s) setConnected(JSON.parse(s)) } catch {}
  }, [])

  function handleConnect(id: string) {
    const next = [...connected, id]
    setConnected(next)
    try { localStorage.setItem('nexa_connected', JSON.stringify(next)) } catch {}
  }

  const filtered = INTEGRATIONS.filter(i => {
    const matchCat    = category === 'all' || i.category === category
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.desc.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const betaCount   = INTEGRATIONS.filter(i => i.status === 'beta').length
  const comingCount = INTEGRATIONS.filter(i => i.status === 'coming_soon').length

  return (
    <div style={{ height:'calc(100vh - var(--topbar-h))', overflowY:'auto', background:'#0C0C0C', opacity:mounted?1:0, transition:'opacity 0.3s ease', fontFamily:F }}>
      <style dangerouslySetInnerHTML={{ __html:`
        .int-card:hover { border-color: rgba(255,255,255,0.16) !important; background: #181818 !important; }
        .int-card-active:hover { border-color: rgba(0,170,255,0.30) !important; }
        @keyframes intUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .int-in { animation: intUp 0.35s cubic-bezier(0.22,1,0.36,1) both; }
        .cat-btn:hover { color: rgba(255,255,255,0.72) !important; }
        .notify-btn:hover { background: rgba(255,255,255,0.06) !important; border-color: rgba(255,255,255,0.16) !important; color: rgba(255,255,255,0.72) !important; }
        .connect-btn:hover { background: rgba(0,170,255,0.16) !important; border-color: rgba(0,170,255,0.30) !important; }
      `}}/>

      {/* ── GRADIENT HERO ── */}
      <div style={{ backgroundImage:'url(/cyan-header.png)', backgroundSize:'cover', backgroundPosition:'center top', padding:'40px 0 28px' }}>
        <div style={{ padding:'0 36px', display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:'20px' }}>
          <div>
            <h1 style={{ fontSize:'36px', fontWeight:700, letterSpacing:'-0.04em', color:'#0A0A0A', lineHeight:1, marginBottom:'8px' }}>{isArabic ? 'الاتصالات' : 'Integrations'}</h1>
            <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'rgba(0,100,0,0.60)' }}/>
                <span style={{ fontSize:'13px', color:'rgba(0,0,0,0.55)', fontWeight:500 }}>{betaCount} {isArabic?'متاح':'live'}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'rgba(0,0,0,0.30)' }}/>
                <span style={{ fontSize:'13px', color:'rgba(0,0,0,0.45)', fontWeight:400 }}>{comingCount} {isArabic?'قريباً':'coming soon'}</span>
              </div>
            </div>
          </div>
          <p style={{ fontSize:'13px', color:'rgba(0,0,0,0.55)', maxWidth:'340px', lineHeight:1.6, textAlign:'right' as const }}>
            {isArabic ? 'الأدوات اللي تستخدمها أصلاً، متصلة بمحرك محتواك.' : 'The tools your business already uses, connected to your content engine.'}
          </p>
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div style={{ background:'#141414', borderBottom:'1px solid rgba(255,255,255,0.08)', padding:'0 36px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px' }}>
        {/* Category tabs */}
        <div style={{ display:'flex', gap:'0' }}>
          {CATEGORIES.map(cat => {
            const active = category === cat.id
            return (
              <button key={cat.id} onClick={() => setCategory(cat.id)} className="cat-btn"
                style={{ padding:'12px 16px', background:'none', border:'none', borderBottom:`2px solid ${active?'#00AAFF':'transparent'}`, marginBottom:'-1px', color:active?'#FFFFFF':'rgba(255,255,255,0.42)', cursor:'pointer', fontFamily:F, fontSize:'13px', fontWeight:active?600:400, transition:'all 0.15s', whiteSpace:'nowrap' as const }}>
                {cat.label}
              </button>
            )
          })}
        </div>
        {/* Search */}
        <div style={{ position:'relative', width:'220px', flexShrink:0 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" strokeLinecap="round" style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            style={{ width:'100%', padding:'8px 12px 8px 30px', fontSize:'12px', fontFamily:F, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'8px', color:'#FFFFFF', outline:'none', boxSizing:'border-box' as const, transition:'border-color 0.15s' }}
            onFocus={e => e.target.style.borderColor='rgba(0,170,255,0.30)'}
            onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.10)'}/>
        </div>
      </div>

      {/* ── GRID ── */}
      <div style={{ padding:'28px 36px 48px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'64px 20px', color:'rgba(255,255,255,0.25)', fontSize:'13px', fontFamily:F }}>
            No integrations found
          </div>
        ) : (
          <div className="int-in" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
            {filtered.map(integration => {
              const isActive   = integration.status === 'beta'
              const isConnected = connected.includes(integration.id)

              return (
                <div key={integration.id}
                  className={`int-card${isActive?' int-card-active':''}`}
                  style={{ background:'#141414', border:`1px solid ${isConnected?'rgba(0,170,255,0.22)':isActive?'rgba(0,170,255,0.14)':'rgba(255,255,255,0.08)'}`, borderRadius:'10px', padding:'20px', display:'flex', flexDirection:'column', gap:'0', transition:'all 0.15s' }}>

                  {/* Top row — logo + name + badge */}
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                      <div style={{ flexShrink:0 }}>
                        <IntegrationLogo id={integration.id} name={integration.name} color={integration.color}/>
                      </div>
                      <div>
                        <div style={{ fontSize:'14px', fontWeight:600, color:'#FFFFFF', letterSpacing:'-0.01em', marginBottom:'2px', fontFamily:F }}>{integration.name}</div>
                        <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.30)', fontFamily:F, textTransform:'uppercase' as const, letterSpacing:'0.05em' }}>{integration.badge}</div>
                      </div>
                    </div>
                    {/* Status badge */}
                    <span style={{
                      padding:'3px 8px', borderRadius:'6px', fontSize:'10px', fontWeight:600, fontFamily:F, flexShrink:0, letterSpacing:'0.02em',
                      background: isConnected?'rgba(34,197,94,0.10)': isActive?'rgba(0,170,255,0.10)':'rgba(255,255,255,0.05)',
                      border:     isConnected?'1px solid rgba(34,197,94,0.20)': isActive?'1px solid rgba(0,170,255,0.20)':'1px solid rgba(255,255,255,0.08)',
                      color:      isConnected?'#22C55E': isActive?'#00AAFF':'rgba(255,255,255,0.35)',
                    }}>
                      {isConnected ? (isArabic?'متصل':'Connected') : isActive ? 'Beta' : (isArabic?'قريباً':'Coming soon')}
                    </span>
                  </div>

                  {/* Description */}
                  <p style={{ fontSize:'12px', lineHeight:1.65, color:'rgba(255,255,255,0.50)', fontFamily:F, flex:1, marginBottom:'16px' }}>
                    {integration.desc}
                  </p>

                  {/* Footer — cost + action */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:'14px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize:'11px', fontWeight:500, color: integration.cost === 'Free' ? 'rgba(255,255,255,0.30)' : '#00AAFF', fontFamily:MONO }}>
                      {integration.cost}
                    </span>

                    {isConnected ? (
                      <span style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', fontWeight:600, color:'#22C55E', fontFamily:F }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Connected
                      </span>
                    ) : isActive ? (
                      <button onClick={() => handleConnect(integration.id)} className="connect-btn"
                        style={{ padding:'5px 12px', background:'rgba(0,170,255,0.08)', border:'1px solid rgba(0,170,255,0.20)', borderRadius:'6px', fontSize:'11px', fontWeight:600, color:'#00AAFF', cursor:'pointer', fontFamily:F, transition:'all 0.15s' }}>
                        Connect
                      </button>
                    ) : (
                      <button className="notify-btn"
                        style={{ padding:'5px 12px', background:'transparent', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'6px', fontSize:'11px', fontWeight:500, color:'rgba(255,255,255,0.35)', cursor:'pointer', fontFamily:F, transition:'all 0.15s' }}>
                        Notify me
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── BOTTOM CTA ── */}
        <div style={{ marginTop:'28px', padding:'20px 24px', background:'rgba(0,170,255,0.04)', border:'1px solid rgba(0,170,255,0.14)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'20px' }}>
          <div>
            <div style={{ fontSize:'14px', fontWeight:600, color:'#FFFFFF', marginBottom:'4px', fontFamily:F, letterSpacing:'-0.01em' }}>{isArabic?'تحتاج اتصال معين؟':'Need a specific integration?'}</div>
            <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.40)', fontFamily:F }}>We add new ones every week based on what our users actually use.</div>
          </div>
          <a href="mailto:hello@nexaa.cc?subject=Integration request"
            style={{ padding:'9px 20px', fontSize:'13px', fontWeight:600, background:'#FFFFFF', color:'#0C0C0C', borderRadius:'10px', textDecoration:'none', fontFamily:F, whiteSpace:'nowrap' as const, flexShrink:0, transition:'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.88)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='#FFFFFF'}>
            Request integration →
          </a>
        </div>
      </div>
    </div>
  )
}
