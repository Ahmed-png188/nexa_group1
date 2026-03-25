'use client'

import { useState, useEffect } from 'react'

// ── الثوابت ────────────────────────────────────────────────────
const F    = "'Tajawal', system-ui, sans-serif"
const MONO = "'Geist Mono', monospace"

// ── أنواع ──────────────────────────────────────────────────────
type Category = 'all' | 'publishing' | 'productivity' | 'automation' | 'crm' | 'analytics' | 'communication'

// ── قائمة الاتصالات ───────────────────────────────────────────
const INTEGRATIONS = [
  {
    id:       'instagram',
    name:     'Instagram',
    category: 'publishing',
    desc:     'انشر منشوراتك وريلز وستوريز مباشرةً من Nexa — جدوّل محتواك لأسابيع قادمة بضغطة واحدة.',
    cost:     'كريدت / منشور',
    status:   'beta',
    badge:    'نشر',
    color:    '#E1306C',
  },
  {
    id:       'linkedin',
    name:     'LinkedIn',
    category: 'publishing',
    desc:     'انشر مقالاتك ومنشوراتك تلقائياً على ملفك الشخصي أو صفحة شركتك في LinkedIn.',
    cost:     'كريدت / منشور',
    status:   'beta',
    badge:    'نشر',
    color:    '#0A66C2',
  },
  {
    id:       'x',
    name:     'X / Twitter',
    category: 'publishing',
    desc:     'جدوّل ثريداتك وانشرها في الوقت الأمثل بناءً على بيانات جمهورك الفعلي.',
    cost:     'كريدت / منشور',
    status:   'beta',
    badge:    'نشر',
    color:    '#E7E7E7',
  },
  {
    id:       'tiktok',
    name:     'TikTok',
    category: 'publishing',
    desc:     'جدوّل فيديوهاتك وانشرها على TikTok مباشرةً من Nexa Studio دون ما تفتح التطبيق.',
    cost:     'كريدت / منشور',
    status:   'beta',
    badge:    'نشر',
    color:    '#FF0050',
  },
  {
    id:       'notion',
    name:     'Notion',
    category: 'productivity',
    desc:     'زامن بريفاتك وأفكارك واستراتيجيتك مع مساحة Notion الخاصة بك — كل شيء في مكان واحد.',
    cost:     'مجاني',
    status:   'coming_soon',
    badge:    'إنتاجية',
    color:    '#ffffff',
  },
  {
    id:       'google-drive',
    name:     'Google Drive',
    category: 'productivity',
    desc:     'استورد وثائق هويتك وإرشاداتك وأصولك مباشرةً من Drive إلى Brand Brain.',
    cost:     'مجاني',
    status:   'coming_soon',
    badge:    'إنتاجية',
    color:    '#4285F4',
  },
  {
    id:       'asana',
    name:     'Asana',
    category: 'productivity',
    desc:     'حوّل تقويم محتواك إلى مهام في Asana — فريقك متزامن على كل قطعة محتوى.',
    cost:     'مجاني',
    status:   'coming_soon',
    badge:    'إنتاجية',
    color:    '#F06A6A',
  },
  {
    id:       'slack',
    name:     'Slack',
    category: 'communication',
    desc:     'استقبل ملخصك اليومي وتنبيهات المحتوى ونتائج الأداء مباشرةً في Slack.',
    cost:     'مجاني',
    status:   'coming_soon',
    badge:    'تواصل',
    color:    '#4A154B',
  },
  {
    id:       'whatsapp',
    name:     'WhatsApp Business',
    category: 'communication',
    desc:     'أرسل تسلسلات البريد عبر WhatsApp — تواصل مع عملائك حيث يردون فعلاً.',
    cost:     'مجاني',
    status:   'coming_soon',
    badge:    'تواصل',
    color:    '#25D366',
  },
  {
    id:       'hubspot',
    name:     'HubSpot',
    category: 'crm',
    desc:     'اربط تسلسلات البريد بـ HubSpot — حوّل تفاعل المحتوى إلى صفقات في pipeline مبيعاتك.',
    cost:     'مجاني',
    status:   'coming_soon',
    badge:    'CRM',
    color:    '#FF7A59',
  },
  {
    id:       'calendly',
    name:     'Calendly',
    category: 'crm',
    desc:     'أضف رابط حجزك للمحتوى تلقائياً — حوّل القراء إلى مواعيد مباشرة.',
    cost:     'مجاني',
    status:   'coming_soon',
    badge:    'مبيعات',
    color:    '#006BFF',
  },
  {
    id:       'google-analytics',
    name:     'Google Analytics',
    category: 'analytics',
    desc:     'شوف أي محتوى يجيب زيارات وتحويلات فعلية — اربط منشوراتك بأرقام الإيراد.',
    cost:     'مجاني',
    status:   'coming_soon',
    badge:    'تحليلات',
    color:    '#F9AB00',
  },
  {
    id:       'make',
    name:     'Make.com',
    category: 'automation',
    desc:     'وصّل Nexa بـ٢٠٠٠+ تطبيق — اجعل أي أداة خارجية تُطلق إنتاج المحتوى تلقائياً.',
    cost:     'مجاني',
    status:   'coming_soon',
    badge:    'أتمتة',
    color:    '#A855F7',
  },
  {
    id:       'zapier',
    name:     'Zapier',
    category: 'automation',
    desc:     'أتمت أي شيء — اجعل Nexa تستجيب لكل أداة متصلة بـ Zapier تلقائياً.',
    cost:     'مجاني',
    status:   'coming_soon',
    badge:    'أتمتة',
    color:    '#FF6B35',
  },
]

// ── التصنيفات ──────────────────────────────────────────────────
const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all',          label: 'الكل'          },
  { id: 'publishing',   label: 'النشر'          },
  { id: 'productivity', label: 'الإنتاجية'      },
  { id: 'automation',   label: 'الأتمتة'        },
  { id: 'crm',          label: 'CRM والمبيعات'  },
  { id: 'analytics',    label: 'التحليلات'      },
  { id: 'communication',label: 'التواصل'        },
]

// ── شعارات التطبيقات ──────────────────────────────────────────
function IntegrationLogo({ id, name, color }: { id: string; name: string; color: string }) {
  const logos: Record<string, React.ReactNode> = {
    instagram: (
      <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
          <rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="white" stroke="none"/>
        </svg>
      </div>
    ),
    linkedin: (
      <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#0A66C2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
        </svg>
      </div>
    ),
    x: (
      <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#0C0C0C', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L2.25 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </div>
    ),
    tiktok: (
      <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#010101', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="white">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.73a4.85 4.85 0 0 1-1.01-.04z"/>
        </svg>
      </div>
    ),
    notion: (
      <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#000">
          <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.887l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933z"/>
        </svg>
      </div>
    ),
    slack: (
      <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z" fill="#E01E5A"/>
          <path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="#E01E5A"/>
          <path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z" fill="#2EB67D"/>
          <path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z" fill="#2EB67D"/>
          <path d="M10 9.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z" fill="#ECB22E"/>
          <path d="M10 3.5C10 2.67 10.67 2 11.5 2S13 2.67 13 3.5V5h-1.5C10.67 5 10 4.33 10 3.5z" fill="#ECB22E"/>
          <path d="M14 14.5c0 .83-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5z" fill="#36C5F0"/>
          <path d="M14 20.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5V19h1.5c.83 0 1.5.67 1.5 1.5z" fill="#36C5F0"/>
        </svg>
      </div>
    ),
    hubspot: (
      <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#FF7A59', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M20.316 11.246l-3.196-1.566V7.684a2.03 2.03 0 0 0 1.13-1.82V5.82a2.03 2.03 0 0 0-2.03-2.03h-.052a2.03 2.03 0 0 0-2.03 2.03v.044c0 .793.46 1.482 1.13 1.82v1.996l-3.12-1.528a1.2 1.2 0 0 0-1.11.042L3.9 11.246a1.2 1.2 0 0 0 0 2.086l7.14 3.5a1.2 1.2 0 0 0 1.048 0l8.228-4.028a1.2 1.2 0 0 0 0-2.558z"/>
        </svg>
      </div>
    ),
    'google-drive': (
      <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="20" height="17" viewBox="0 0 87 78">
          <path d="M55.7 30L43.5 9 31.3 30z" fill="#FBBC05"/>
          <path d="M87 69L74.8 48H12.2L0 69z" fill="#4285F4"/>
          <path d="M31.3 30L0 69l12.2-21L43.5 9z" fill="#34A853"/>
          <path d="M55.7 30l31.3 39H74.8L43.5 9z" fill="#EA4335"/>
        </svg>
      </div>
    ),
    'google-analytics': (
      <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="12" width="4" height="9" rx="1" fill="#F9AB00"/>
          <rect x="10" y="7" width="4" height="14" rx="1" fill="#E37400"/>
          <rect x="17" y="3" width="4" height="18" rx="1" fill="#E37400"/>
        </svg>
      </div>
    ),
    asana: (
      <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#F06A6A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="5.5" r="3.5" fill="white"/>
          <circle cx="5" cy="15.5" r="3.5" fill="white"/>
          <circle cx="19" cy="15.5" r="3.5" fill="white"/>
        </svg>
      </div>
    ),
    calendly: (
      <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#006BFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4M16 2v4"/>
        </svg>
      </div>
    ),
    whatsapp: (
      <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.95-1.418A9.954 9.954 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="white"/>
          <path d="M8.5 9.5c.5 1 1.5 3 3.5 4s3-1 3-1-.5-1.5-1-1.5S13 11.5 13 11.5s-1-1.5-2-3c-.5-.75-1.5-.5-2 0s-.5 1.5 0 1" fill="#25D366"/>
        </svg>
      </div>
    ),
    make: (
      <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#A855F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="7" stroke="white" strokeWidth="1.5"/>
          <path d="M9 12h6M12 9v6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
    ),
    zapier: (
      <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#FF4A00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M13.5 2L3 13h7.5L9 22l12-11h-7.5L13.5 2z" fill="white"/>
        </svg>
      </div>
    ),
  }
  return (
    <>
      {logos[id] || (
        <div style={{ width: 40, height: 40, borderRadius: '10px', background: `${color}22`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color, fontFamily: F }}>
          {name[0]}
        </div>
      )}
    </>
  )
}

// ── الصفحة الرئيسية ───────────────────────────────────────────
export default function IntegrationsAr() {
  const [category,  setCategory]  = useState<Category>('all')
  const [search,    setSearch]    = useState('')
  const [connected, setConnected] = useState<string[]>([])
  const [mounted,   setMounted]   = useState(false)
  const [notified,  setNotified]  = useState<string[]>([])

  useEffect(() => {
    setMounted(true)
    try {
      const s = localStorage.getItem('nexa_connected_ar')
      if (s) setConnected(JSON.parse(s))
      const n = localStorage.getItem('nexa_notified_ar')
      if (n) setNotified(JSON.parse(n))
    } catch {}
  }, [])

  function handleConnect(id: string) {
    const next = [...connected, id]
    setConnected(next)
    try { localStorage.setItem('nexa_connected_ar', JSON.stringify(next)) } catch {}
  }

  function handleNotify(id: string) {
    if (notified.includes(id)) return
    const next = [...notified, id]
    setNotified(next)
    try { localStorage.setItem('nexa_notified_ar', JSON.stringify(next)) } catch {}
  }

  const filtered = INTEGRATIONS.filter(i => {
    const matchCat    = category === 'all' || i.category === category
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) ||
                        i.desc.includes(search)
    return matchCat && matchSearch
  })

  const betaCount   = INTEGRATIONS.filter(i => i.status === 'beta').length
  const comingCount = INTEGRATIONS.filter(i => i.status === 'coming_soon').length

  return (
    <div
      dir="rtl"
      style={{
        height: 'calc(100vh - var(--topbar-h))',
        overflowY: 'auto',
        background: '#0C0C0C',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.3s ease',
        fontFamily: F,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .int-card:hover       { border-color: rgba(255,255,255,0.16) !important; background: #181818 !important; }
        .int-card-live:hover  { border-color: rgba(0,170,255,0.30)  !important; }
        @keyframes intFadeUp  { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .int-grid             { animation: intFadeUp 0.35s cubic-bezier(0.22,1,0.36,1) both; }
        .cat-btn:hover        { color: rgba(255,255,255,0.80) !important; }
        .notify-btn:hover     { background: rgba(255,255,255,0.06) !important; border-color: rgba(255,255,255,0.18) !important; color: rgba(255,255,255,0.70) !important; }
        .connect-btn:hover    { background: rgba(0,170,255,0.16) !important; border-color: rgba(0,170,255,0.32) !important; }
        .search-input:focus   { border-color: rgba(0,170,255,0.30) !important; outline: none; }
        ::-webkit-scrollbar   { width: 4px; }
        ::-webkit-scrollbar-track  { background: transparent; }
        ::-webkit-scrollbar-thumb  { background: rgba(255,255,255,0.10); border-radius: 4px; }
      `}}/>

      {/* ── رأس الصفحة ── */}
      <div style={{
        backgroundImage: 'url(/cyan-header.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        padding: '40px 0 28px',
      }}>
        <div style={{
          padding: '0 36px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '20px',
        }}>
          <div>
            <h1 style={{
              fontSize: '36px',
              fontWeight: 700,
              letterSpacing: 0,
              color: '#0A0A0A',
              lineHeight: 1,
              marginBottom: '10px',
              fontFamily: F,
            }}>
              الاتصالات
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(0,110,0,0.65)' }}/>
                <span style={{ fontSize: '13px', color: 'rgba(0,0,0,0.55)', fontWeight: 500, fontFamily: F }}>
                  {betaCount} متاح الآن
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(0,0,0,0.28)' }}/>
                <span style={{ fontSize: '13px', color: 'rgba(0,0,0,0.42)', fontWeight: 400, fontFamily: F }}>
                  {comingCount} قريباً
                </span>
              </div>
            </div>
          </div>
          <p style={{
            fontSize: '13px',
            color: 'rgba(0,0,0,0.52)',
            maxWidth: '320px',
            lineHeight: 1.65,
            textAlign: 'left' as const,
            fontFamily: F,
          }}>
            الأدوات اللي شغّالة عندك أصلاً — متصلة بمحرك محتواك بالكامل.
          </p>
        </div>
      </div>

      {/* ── شريط الفلترة ── */}
      <div style={{
        background: '#141414',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '0 36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}>
        {/* تبويبات التصنيف */}
        <div style={{ display: 'flex', gap: 0 }}>
          {CATEGORIES.map(cat => {
            const active = category === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className="cat-btn"
                style={{
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${active ? '#00AAFF' : 'transparent'}`,
                  marginBottom: '-1px',
                  color: active ? '#FFFFFF' : 'rgba(255,255,255,0.38)',
                  cursor: 'pointer',
                  fontFamily: F,
                  fontSize: '13px',
                  fontWeight: active ? 600 : 400,
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap' as const,
                }}
              >
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* البحث */}
        <div style={{ position: 'relative', width: '220px', flexShrink: 0 }}>
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" strokeLinecap="round"
            style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث…"
            className="search-input"
            style={{
              width: '100%',
              padding: '8px 34px 8px 12px',
              fontSize: '12px',
              fontFamily: F,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: '8px',
              color: '#FFFFFF',
              outline: 'none',
              boxSizing: 'border-box' as const,
              transition: 'border-color 0.15s',
              textAlign: 'right' as const,
            }}
          />
        </div>
      </div>

      {/* ── شبكة البطاقات ── */}
      <div style={{ padding: '28px 36px 48px' }}>
        {filtered.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '64px 20px',
            color: 'rgba(255,255,255,0.22)',
            fontSize: '13px',
            fontFamily: F,
          }}>
            ما في اتصالات بهذا الاسم
          </div>
        ) : (
          <div
            className="int-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}
          >
            {filtered.map(integration => {
              const isLive      = integration.status === 'beta'
              const isConnected = connected.includes(integration.id)
              const isNotified  = notified.includes(integration.id)

              return (
                <div
                  key={integration.id}
                  className={`int-card${isLive ? ' int-card-live' : ''}`}
                  style={{
                    background: '#141414',
                    border: `1px solid ${isConnected ? 'rgba(0,170,255,0.22)' : isLive ? 'rgba(0,170,255,0.14)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '10px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0,
                    transition: 'all 0.15s',
                  }}
                >
                  {/* الصف العلوي — الشعار والاسم والشارة */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ flexShrink: 0 }}>
                        <IntegrationLogo id={integration.id} name={integration.name} color={integration.color}/>
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', letterSpacing: 0, marginBottom: '3px', fontFamily: F }}>
                          {integration.name}
                        </div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', fontFamily: F, letterSpacing: 0 }}>
                          {integration.badge}
                        </div>
                      </div>
                    </div>

                    {/* شارة الحالة */}
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: 600,
                      fontFamily: F,
                      flexShrink: 0,
                      letterSpacing: 0,
                      background:  isConnected ? 'rgba(34,197,94,0.10)'  : isLive ? 'rgba(0,170,255,0.10)'  : 'rgba(255,255,255,0.05)',
                      border:      isConnected ? '1px solid rgba(34,197,94,0.20)' : isLive ? '1px solid rgba(0,170,255,0.20)' : '1px solid rgba(255,255,255,0.08)',
                      color:       isConnected ? '#22C55E'                : isLive ? '#00AAFF'                : 'rgba(255,255,255,0.32)',
                    }}>
                      {isConnected ? 'متصل' : isLive ? 'Beta' : 'قريباً'}
                    </span>
                  </div>

                  {/* الوصف */}
                  <p style={{
                    fontSize: '12px',
                    lineHeight: 1.7,
                    color: 'rgba(255,255,255,0.48)',
                    fontFamily: F,
                    flex: 1,
                    marginBottom: '16px',
                  }}>
                    {integration.desc}
                  </p>

                  {/* التذييل — التكلفة والزر */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '14px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: integration.cost === 'مجاني' ? 'rgba(255,255,255,0.28)' : '#00AAFF',
                      fontFamily: MONO,
                      direction: 'ltr',
                    }}>
                      {integration.cost === 'مجاني' ? 'مجاني' : `1 cr / منشور`}
                    </span>

                    {isConnected ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, color: '#22C55E', fontFamily: F }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        متصل
                      </span>
                    ) : isLive ? (
                      <button
                        onClick={() => handleConnect(integration.id)}
                        className="connect-btn"
                        style={{
                          padding: '5px 12px',
                          background: 'rgba(0,170,255,0.08)',
                          border: '1px solid rgba(0,170,255,0.20)',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#00AAFF',
                          cursor: 'pointer',
                          fontFamily: F,
                          transition: 'all 0.15s',
                        }}
                      >
                        اتصال
                      </button>
                    ) : isNotified ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.35)', fontFamily: F }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        سيتم إشعارك
                      </span>
                    ) : (
                      <button
                        onClick={() => handleNotify(integration.id)}
                        className="notify-btn"
                        style={{
                          padding: '5px 12px',
                          background: 'transparent',
                          border: '1px solid rgba(255,255,255,0.10)',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 500,
                          color: 'rgba(255,255,255,0.32)',
                          cursor: 'pointer',
                          fontFamily: F,
                          transition: 'all 0.15s',
                        }}
                      >
                        أشعرني
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── بانر طلب اتصال جديد ── */}
        <div style={{
          marginTop: '28px',
          padding: '20px 24px',
          background: 'rgba(0,170,255,0.04)',
          border: '1px solid rgba(0,170,255,0.14)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
        }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', marginBottom: '5px', fontFamily: F, letterSpacing: 0 }}>
              تحتاج اتصال معين؟
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.38)', fontFamily: F, lineHeight: 1.6 }}>
              نضيف اتصالات جديدة كل أسبوع بناءً على ما يطلبه مستخدمونا فعلاً.
            </div>
          </div>
          <a
            href="mailto:hello@nexaa.cc?subject=طلب اتصال جديد"
            style={{
              padding: '9px 20px',
              fontSize: '13px',
              fontWeight: 600,
              background: '#FFFFFF',
              color: '#0C0C0C',
              borderRadius: '10px',
              textDecoration: 'none',
              fontFamily: F,
              whiteSpace: 'nowrap' as const,
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.88)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#FFFFFF'}
          >
            ← اطلب اتصالاً
          </a>
        </div>
      </div>
    </div>
  )
}
