'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'

// ── الثوابت ────────────────────────────────────────────────────
const F    = "'Tajawal', system-ui, sans-serif"
const MONO = "'Geist Mono', monospace"

// ── مواصفات Meta ──────────────────────────────────────────────
const META_SPECS = {
  primary_text: { max: 125, warn: 90 },
  headline:     { max: 40,  warn: 30 },
  description:  { max: 30,  warn: 25 },
  image: { max_mb: 30, min_w: 500 },
}

// ── أهداف الحملة ──────────────────────────────────────────────
const OBJECTIVES = [
  { id: 'OUTCOME_AWARENESS',     label: 'الوعي بالعلامة',   desc: 'وصّل علامتك لأكبر عدد من المهتمين' },
  { id: 'OUTCOME_TRAFFIC',       label: 'الزيارات',          desc: 'اجلب نقرات لموقعك أو صفحتك' },
  { id: 'OUTCOME_ENGAGEMENT',    label: 'التفاعل',           desc: 'إعجابات وتعليقات ومشاركات أكثر' },
  { id: 'OUTCOME_LEADS',         label: 'العملاء المحتملون', desc: 'اجمع بيانات الاتصال من المهتمين' },
  { id: 'OUTCOME_SALES',         label: 'المبيعات',          desc: 'حوّل الزوار إلى مشترين' },
  { id: 'OUTCOME_APP_PROMOTION', label: 'تثبيت التطبيق',    desc: 'أضف مستخدمين جدد لتطبيقك' },
  { id: 'OUTCOME_VIDEO_VIEWS',   label: 'مشاهدات الفيديو',  desc: 'وسّع نطاق مشاهدة محتواك المرئي' },
]

// ── المواضع الإعلانية ─────────────────────────────────────────
const PLACEMENTS = [
  { id: 'ig_feed',      label: 'Instagram Feed',    ratio: '1:1',    w: 1080, h: 1080 },
  { id: 'ig_stories',   label: 'Instagram Stories', ratio: '9:16',   w: 1080, h: 1920 },
  { id: 'ig_reels',     label: 'Instagram Reels',   ratio: '9:16',   w: 1080, h: 1920 },
  { id: 'fb_feed',      label: 'Facebook Feed',     ratio: '1.91:1', w: 1200, h: 628  },
  { id: 'fb_stories',   label: 'Facebook Stories',  ratio: '9:16',   w: 1080, h: 1920 },
  { id: 'audience_net', label: 'Audience Network',  ratio: 'متنوع',  w: 320,  h: 50   },
]

// ── أزرار الدعوة للتصرف ───────────────────────────────────────
const CTA_OPTIONS = [
  { en: 'Learn More',   ar: 'اعرف المزيد'    },
  { en: 'Shop Now',     ar: 'تسوّق الآن'     },
  { en: 'Sign Up',      ar: 'سجّل الآن'      },
  { en: 'Book Now',     ar: 'احجز الآن'      },
  { en: 'Download',     ar: 'حمّل التطبيق'  },
  { en: 'Get Quote',    ar: 'احصل على عرض'  },
  { en: 'Contact Us',   ar: 'تواصل معنا'     },
  { en: 'Watch More',   ar: 'شاهد المزيد'   },
]

// ── أنواع البيانات ────────────────────────────────────────────
type Campaign = {
  id: string; name: string; status: string; daily_budget: number
  start_date?: string; end_date?: string; objective: string
  audience_snapshot?: any; creative_snapshot?: any; mode?: string
  rejection_reason?: string | null
  meta_campaign_id?: string
  insights?: { spend: number; reach: number; clicks: number; cpc: number; ctr?: number; impressions?: number }
}

// ── شارة الحالة ───────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; border: string; color: string }> = {
    ACTIVE:    { label: 'نشطة',        bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.25)',  color: '#4ADE80' },
    PAUSED:    { label: 'موقوفة',      bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)', color: '#FBB040' },
    DRAFT:     { label: 'مسودة',       bg: 'rgba(255,255,255,0.05)',border: 'rgba(255,255,255,0.12)',color: 'rgba(255,255,255,0.45)' },
    IN_REVIEW: { label: 'قيد المراجعة',bg: 'rgba(0,170,255,0.08)',  border: 'rgba(0,170,255,0.22)',  color: '#00AAFF' },
    REJECTED:  { label: 'مرفوض',       bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.22)',  color: '#EF4444' },
    ERROR:     { label: 'خطأ',         bg: 'rgba(239,68,68,0.05)',  border: 'rgba(239,68,68,0.15)',  color: 'rgba(239,68,68,0.70)' },
  }
  const s = map[status] || map.DRAFT
  return (
    <span style={{ padding: '3px 9px', borderRadius: '5px', fontSize: '10px', fontWeight: 700, fontFamily: F, letterSpacing: '0.02em', background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      {s.label}
    </span>
  )
}

// ── نتائج الحملة بلغة بسيطة ──────────────────────────────────
function PlainResult({ camp }: { camp: Campaign }) {
  const ins = camp.insights
  if (!ins || (!ins.spend && !ins.reach)) return null
  const ctrPct  = ins.ctr ? (ins.ctr * 100).toFixed(2) : ins.reach > 0 && ins.clicks > 0 ? ((ins.clicks / ins.reach) * 100).toFixed(2) : null
  const cpcGood = ins.cpc > 0 && ins.cpc < 1.5
  const ctrGood = ctrPct && parseFloat(ctrPct) > 1.5

  return (
    <div style={{ marginTop: 10, padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8 }}>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: F, lineHeight: 1.85 }}>
        {ins.reach > 0 && <span>وصل إعلانك إلى <strong style={{ color: '#FFFFFF' }}>{ins.reach.toLocaleString('ar-SA')} شخص</strong>. </span>}
        {ins.clicks > 0 && <span>نقر <strong style={{ color: '#FFFFFF' }}>{ins.clicks.toLocaleString('ar-SA')}</strong> منهم. </span>}
        {ins.cpc > 0 && <span>دفعت <strong style={{ color: cpcGood ? '#22C55E' : '#FBB040' }}>${ins.cpc.toFixed(2)} لكل نقرة</strong>{cpcGood ? ' — ممتاز' : ' — يمكن التحسين'}. </span>}
        {ctrPct && <span>نسبة النقر: <strong style={{ color: ctrGood ? '#22C55E' : 'rgba(255,255,255,0.70)' }}>{ctrPct}%</strong>{ctrGood ? ' — فوق المعدل الطبيعي.' : ' — المعدل الطبيعي ١–٢٪.'}  </span>}
        {ins.spend > 0 && <span>الإجمالي المنفق: <strong style={{ color: '#FFFFFF' }}>${ins.spend.toFixed(2)}</strong>.</span>}
      </div>
    </div>
  )
}

// ── معاينة الإعلان ────────────────────────────────────────────
function AdPreview({ creative, placement }: { creative: any; placement: typeof PLACEMENTS[0] }) {
  const img   = creative?.uploadedImage || creative?.image_url || null
  const text  = creative?.adCopy    || creative?.primary_text || ''
  const head  = creative?.headline  || ''
  const cta   = creative?.ctaAr     || creative?.cta || 'اعرف المزيد'
  const brand = creative?.brandName || 'علامتك'
  const initial = brand.charAt(0).toUpperCase()

  const Avatar = () => (
    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,170,255,0.22)', border: '1.5px solid rgba(0,170,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#00AAFF', flexShrink: 0, fontFamily: F }}>
      {initial}
    </div>
  )

  const ImageArea = ({ height, borderRadius = 0 }: { height: number; borderRadius?: number }) => (
    <div style={{ width: '100%', height, background: img ? `url(${img}) center/cover no-repeat` : '#1e1e1e', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius, flexShrink: 0 }}>
      {!img && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.20)', fontFamily: F, textAlign: 'center' as const }}>
            {placement.w}×{placement.h}px<br/>{placement.ratio}
          </div>
        </div>
      )}
    </div>
  )

  const CTABar = () => (
    <div style={{ padding: '10px 12px', background: '#242424', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <div style={{ minWidth: 0 }}>
        {head && <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, fontFamily: F }}>{head}</div>}
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.30)', fontFamily: MONO, marginTop: 1 }}>nexaa.cc</div>
      </div>
      <div style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: 5, fontSize: 11, fontWeight: 700, color: '#FFFFFF', flexShrink: 0, whiteSpace: 'nowrap' as const, fontFamily: F }}>{cta}</div>
    </div>
  )

  // Facebook Feed
  if (placement.id === 'fb_feed') {
    return (
      <div style={{ width: 300, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, overflow: 'hidden', fontFamily: F }}>
        <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 9 }}>
          <Avatar/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#FFFFFF', lineHeight: 1.2 }}>{brand}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)' }}>مموّل · 🌐</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        </div>
        {text && <div style={{ padding: '0 12px 8px', fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, fontFamily: F, direction: 'rtl' }}>{text.slice(0, 90)}{text.length > 90 ? '…' : ''}</div>}
        <ImageArea height={157}/>
        <CTABar/>
        <div style={{ padding: '8px 12px', display: 'flex', gap: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {['إعجاب', 'تعليق', 'مشاركة'].map(a => (
            <div key={a} style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: F }}>{a}</div>
          ))}
        </div>
      </div>
    )
  }

  // Stories / Reels (9:16)
  if (placement.id === 'ig_stories' || placement.id === 'fb_stories' || placement.id === 'ig_reels') {
    const isReel = placement.id === 'ig_reels'
    return (
      <div style={{ width: 160, height: 284, background: '#111', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, overflow: 'hidden', position: 'relative', fontFamily: F }}>
        <ImageArea height={284}/>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '10px 10px 6px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)', display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,170,255,0.22)', border: '2px solid #00AAFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#00AAFF', flexShrink: 0 }}>{initial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#FFFFFF', fontFamily: F }}>{brand}</div>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.55)', fontFamily: F }}>مموّل</div>
          </div>
          {isReel && <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.55)', fontFamily: F }}>Reel</div>}
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 10px 10px', background: 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, transparent 100%)' }}>
          {text && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4, marginBottom: 8, fontFamily: F, direction: 'rtl' }}>{text.slice(0, 60)}{text.length > 60 ? '…' : ''}</div>}
          <div style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.30)', borderRadius: 20, fontSize: 10, fontWeight: 700, color: '#FFFFFF', textAlign: 'center' as const, fontFamily: F }}>{cta}</div>
        </div>
        {isReel && (
          <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.60)" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.60)" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.60)" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </div>
        )}
      </div>
    )
  }

  // Instagram Feed (1:1)
  if (placement.id === 'ig_feed') {
    return (
      <div style={{ width: 220, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, overflow: 'hidden', fontFamily: F }}>
        <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,170,255,0.22)', border: '2px solid #833ab4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#00AAFF', flexShrink: 0 }}>{initial}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#FFFFFF', fontFamily: F }}>{brand}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.40)', fontFamily: F }}>مموّل</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        </div>
        <ImageArea height={220}/>
        <div style={{ padding: '8px 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </div>
          {text && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.45, fontFamily: F, direction: 'rtl' }}><span style={{ fontWeight: 700, color: '#FFFFFF' }}>{brand}</span> {text.slice(0, 55)}{text.length > 55 ? '…' : ''}</div>}
          <div style={{ marginTop: 6, padding: '6px 10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 5, fontSize: 11, fontWeight: 600, color: '#FFFFFF', textAlign: 'center' as const, fontFamily: F }}>{cta}</div>
        </div>
      </div>
    )
  }

  // Audience Network (banner)
  if (placement.id === 'audience_net') {
    return (
      <div style={{ width: 280, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden', fontFamily: F }}>
        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.20)', textAlign: 'left' as const, padding: '2px 6px', background: 'rgba(255,255,255,0.03)' }}>Ad</div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 50, height: 50, background: img ? `url(${img}) center/cover no-repeat` : 'rgba(255,255,255,0.06)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!img && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>}
          </div>
          <div style={{ flex: 1, padding: '6px 8px', minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, fontFamily: F }}>{head || brand}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, fontFamily: F }}>{text.slice(0, 35)}{text.length > 35 ? '…' : ''}</div>
          </div>
          <div style={{ padding: '0 10px', fontSize: 9, fontWeight: 700, color: '#00AAFF', fontFamily: F, flexShrink: 0 }}>{cta}</div>
        </div>
      </div>
    )
  }

  // Fallback
  return (
    <div style={{ width: 220, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}><Avatar/></div>
      <ImageArea height={220}/>
      <CTABar/>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// المكوّن الداخلي
// ══════════════════════════════════════════════════════════════
function AmplifyInner() {
  const supabase     = createClient()
  const searchParams = useSearchParams()
  const uploadRef    = useRef<HTMLInputElement>(null)

  // ── حالات التحميل ─────────────────────────────────────────
  const [loading,        setLoading]        = useState(true)
  const [mounted,        setMounted]        = useState(false)
  const [campaigns,      setCampaigns]      = useState<Campaign[]>([])
  const [workspaceId,    setWorkspaceId]    = useState<string | null>(null)
  const [hasAmplify,     setHasAmplify]     = useState(false)
  const [connected,      setConnected]      = useState(false)
  const [brandName,      setBrandName]      = useState('علامتك')
  const [activeTab,      setActiveTab]      = useState<'campaigns' | 'monitor'>('campaigns')

  // ── إنشاء حملة ────────────────────────────────────────────
  const [showCreate,     setShowCreate]     = useState(false)
  const [adMode,         setAdMode]         = useState<'simple' | 'advanced'>('simple')
  const [currentStep,    setCurrentStep]    = useState(1)
  const [launchError,    setLaunchError]    = useState<string | null>(null)
  const [launching,      setLaunching]      = useState(false)
  const [generatingCopy, setGeneratingCopy] = useState(false)

  // ── المحتوى الإبداعي ──────────────────────────────────────
  const [adCopy,           setAdCopy]           = useState('')
  const [headline,         setHeadline]         = useState('')
  const [description,      setDescription]      = useState('')
  const [selectedCTA,      setSelectedCTA]      = useState('Learn More')
  const [selectedCTAAr,    setSelectedCTAAr]    = useState('اعرف المزيد')
  const [uploadedImage,    setUploadedImage]    = useState<string | null>(null)
  const [imageError,       setImageError]       = useState<string | null>(null)
  const [previewPlacement, setPreviewPlacement] = useState<string>('ig_feed')
  const [copyWarning,      setCopyWarning]      = useState<string | null>(null)
  const [headWarning,      setHeadWarning]      = useState<string | null>(null)

  // ── الاستهداف ─────────────────────────────────────────────
  const [selectedObjective,  setSelectedObjective]  = useState('OUTCOME_TRAFFIC')
  const [selectedPlacements, setSelectedPlacements] = useState(['ig_feed', 'ig_stories', 'ig_reels', 'fb_feed'])
  const [ageMin,             setAgeMin]             = useState(22)
  const [ageMax,             setAgeMax]             = useState(45)
  const [gender,             setGender]             = useState('ALL')
  const [locations,          setLocations]          = useState(['AE', 'SA'])
  const [locationInput,      setLocationInput]      = useState('')
  const [audienceTags,       setAudienceTags]       = useState<string[]>(['ريادة أعمال', 'أصحاب المشاريع', 'التسويق الرقمي', 'التجارة الإلكترونية', 'صناعة المحتوى'])
  const [tagInput,           setTagInput]           = useState('')

  // ── متقدم ─────────────────────────────────────────────────
  const [retargetingEnabled, setRetargetingEnabled] = useState(false)
  const [retargetingType,    setRetargetingType]    = useState<'website' | 'lookalike' | 'engagement'>('website')
  const [abEnabled,          setAbEnabled]          = useState(false)
  const [bidStrategy,        setBidStrategy]        = useState<'LOWEST_COST' | 'COST_CAP'>('LOWEST_COST')
  const [targetCpa,          setTargetCpa]          = useState(10)

  // ── الميزانية ─────────────────────────────────────────────
  const [dailyBudget, setDailyBudget] = useState(20)
  const [startDate,   setStartDate]   = useState(new Date().toISOString().split('T')[0])
  const [endDate,     setEndDate]     = useState('')

  // ── المحتوى الأخير ────────────────────────────────────────
  const [recentContent,   setRecentContent]   = useState<any[]>([])
  const [selectedContent, setSelectedContent] = useState<any>(null)

  // ── إدارة الحملات ─────────────────────────────────────────
  const [expandedCamp, setExpandedCamp] = useState<string | null>(null)
  const [editingCamp,  setEditingCamp]  = useState<string | null>(null)
  const [editBudget,   setEditBudget]   = useState(0)

  // ── المونيتور ─────────────────────────────────────────────
  const [monitorData,    setMonitorData]    = useState<any[]>([])
  const [monitorLoading, setMonitorLoading] = useState(false)
  const [monitorLoaded,  setMonitorLoaded]  = useState(false)

  // ── تقدير الوصول ──────────────────────────────────────────
  const [reachEstimate, setReachEstimate] = useState<{ min: number; max: number; estimated: boolean } | null>(null)
  const [reachLoading,  setReachLoading]  = useState(false)

  useEffect(() => {
    setMounted(true)
    const boostContent = searchParams.get('content')
    if (boostContent) setAdCopy(decodeURIComponent(boostContent).slice(0, 125))
    if (searchParams.get('boost') === 'true') setShowCreate(true)
    init()
  }, [])

  // التحقق من طول النص
  useEffect(() => {
    if (adCopy.length > META_SPECS.primary_text.max) {
      setCopyWarning(`النص طويل جداً — Meta يقطع عند ${META_SPECS.primary_text.max} حرف`)
    } else if (adCopy.length > META_SPECS.primary_text.warn) {
      setCopyWarning(`تبقّى ${META_SPECS.primary_text.max - adCopy.length} حرف قبل القطع`)
    } else { setCopyWarning(null) }
  }, [adCopy])

  useEffect(() => {
    if (headline.length > META_SPECS.headline.max) {
      setHeadWarning(`العنوان طويل — الحد الأقصى ${META_SPECS.headline.max} حرف`)
    } else { setHeadWarning(null) }
  }, [headline])

  // تقدير الوصول (مؤجّل ١.٥ ثانية)
  useEffect(() => {
    if (!workspaceId || !showCreate) return
    const t = setTimeout(() => { fetchReach() }, 1500)
    return () => clearTimeout(t)
  }, [dailyBudget, ageMin, ageMax, gender, locations, audienceTags, selectedPlacements, selectedObjective, showCreate, workspaceId])

  // ── تهيئة البيانات ────────────────────────────────────────
  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: member } = await supabase.from('workspace_members').select('workspace_id').eq('user_id', user.id).single()
    if (!member) return
    const wsId = (member as any).workspace_id
    setWorkspaceId(wsId)

    const [{ data: ws }, { data: conn }, { data: camps }, { data: content }] = await Promise.all([
      supabase.from('workspaces').select('brand_name,name,brand_voice,brand_audience,plan,plan_status,created_at').eq('id', wsId).single(),
      supabase.from('meta_connections').select('id').eq('workspace_id', wsId).single(),
      supabase.from('amplify_campaigns').select('*').eq('workspace_id', wsId).order('created_at', { ascending: false }),
      supabase.from('content').select('id,type,content,image_url,video_url,platform').eq('workspace_id', wsId).order('created_at', { ascending: false }).limit(12),
    ])

    const plan = (ws as any)?.plan ?? 'spark'
    const status = (ws as any)?.plan_status ?? 'trialing'
    const isTrial = status === 'trialing'
    const trialExpired = isTrial && (new Date() > new Date(new Date((ws as any)?.created_at).getTime() + 7 * 86400000))
    setHasAmplify(!trialExpired && ['grow','scale','agency'].includes(plan))

    setConnected(!!conn)
    setBrandName((ws as any)?.brand_name || (ws as any)?.name || 'علامتك')
    setRecentContent(content ?? [])

    const campsWithIns = await Promise.all((camps ?? []).map(async (camp: any) => {
      const { data: ins } = await supabase.from('amplify_insights').select('*').eq('campaign_id', camp.id).order('recorded_at', { ascending: false }).limit(1).single()
      return { ...camp, insights: ins || { spend: 0, reach: 0, clicks: 0, cpc: 0 } }
    }))

    setCampaigns(campsWithIns as Campaign[])
    setLoading(false)
  }

  async function handleImageUpload(file: File) {
    setImageError(null)
    const mb = file.size / 1024 / 1024
    if (mb > META_SPECS.image.max_mb) { setImageError(`الصورة كبيرة جداً — الحد ${META_SPECS.image.max_mb}MB`); return }
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      if (img.width < META_SPECS.image.min_w) { setImageError(`الصورة صغيرة — الحد الأدنى ${META_SPECS.image.min_w}px`); URL.revokeObjectURL(url) }
      else { setUploadedImage(url) }
    }
    img.src = url
  }

  async function generateAdCopy() {
    if (!workspaceId) return
    setGeneratingCopy(true)
    try {
      const res = await fetch('/api/amplify/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId, name: '__preview__', generate_copy: true, content_id: selectedContent?.id || null, creative_snapshot: { adCopy }, mode: 'simple', daily_budget: 0 }),
      })
      const d = await res.json()
      if (d.creative?.headline)    setHeadline(d.creative.headline)
      if (d.creative?.adCopy)      setAdCopy(d.creative.adCopy.slice(0, META_SPECS.primary_text.max))
      if (d.creative?.description) setDescription(d.creative.description)
    } catch {}
    setGeneratingCopy(false)
  }

  async function handleLaunch() {
    if (!workspaceId) return
    if (!adCopy.trim() && !uploadedImage && !selectedContent) { setLaunchError('أضف نصاً أو اختر محتوى أولاً'); return }
    if (adCopy.length > META_SPECS.primary_text.max) { setLaunchError(`النص طويل — الحد الأقصى ${META_SPECS.primary_text.max} حرف`); return }
    if (headline.length > META_SPECS.headline.max) { setLaunchError(`العنوان طويل — الحد الأقصى ${META_SPECS.headline.max} حرف`); return }
    setLaunching(true); setLaunchError(null)
    try {
      const res = await fetch('/api/amplify/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id:  workspaceId,
          name:          headline || adCopy.slice(0, 40) || 'حملة',
          objective:     adMode === 'simple' ? 'OUTCOME_TRAFFIC' : selectedObjective,
          daily_budget:  dailyBudget,
          start_date:    startDate,
          end_date:      endDate || null,
          content_id:    selectedContent?.id || null,
          mode:          adMode,
          generate_copy: adMode === 'simple' && !adCopy.trim(),
          audience_snapshot: {
            interests: audienceTags, ageMin, ageMax, gender, locations,
            ...(adMode === 'advanced' && retargetingEnabled ? { retargeting: retargetingType } : {}),
            ...(adMode === 'advanced' ? { bid_strategy: bidStrategy, target_cpa: targetCpa } : {}),
          },
          creative_snapshot: {
            adCopy, headline, description, cta: selectedCTA,
            placements: selectedPlacements,
            image_url: uploadedImage || selectedContent?.image_url || null,
            brandName,
          },
          ...(adMode === 'advanced' && abEnabled ? { ab_test: true } : {}),
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'فشل الإطلاق')
      setShowCreate(false); setCurrentStep(1); setAdCopy(''); setHeadline(''); setUploadedImage(null); setSelectedContent(null)
      await init()
    } catch (e: any) {
      setLaunchError(e.message || 'حدث خطأ ما')
    }
    setLaunching(false)
  }

  async function toggleCampaignStatus(camp: Campaign, newStatus: 'ACTIVE' | 'PAUSED') {
    setCampaigns(prev => prev.map(c => c.id === camp.id ? { ...c, status: newStatus } : c))
    try {
      await fetch('/api/amplify/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId, campaign_id: camp.id, action: newStatus === 'ACTIVE' ? 'resume' : 'pause' }),
      })
    } catch {}
  }

  async function updateCampaignBudget(campId: string, budget: number) {
    setCampaigns(prev => prev.map(c => c.id === campId ? { ...c, daily_budget: budget } : c))
    setEditingCamp(null)
    try {
      await fetch('/api/amplify/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId, campaign_id: campId, action: 'budget', value: budget }),
      })
    } catch {}
  }

  async function fetchReach() {
    if (!workspaceId || reachLoading) return
    setReachLoading(true)
    try {
      const res = await fetch('/api/amplify/reach', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId, ageMin, ageMax, genders: gender, locations, interests: audienceTags, placements: adMode === 'simple' ? ['ig_feed', 'ig_stories', 'fb_feed'] : selectedPlacements, daily_budget: dailyBudget, objective: adMode === 'simple' ? 'OUTCOME_TRAFFIC' : selectedObjective }),
      })
      const d = await res.json()
      if (d.min !== undefined) setReachEstimate({ min: d.min, max: d.max, estimated: d.estimated })
    } catch {}
    setReachLoading(false)
  }

  async function loadMonitor() {
    if (!workspaceId || monitorLoading) return
    setMonitorLoading(true)
    try {
      const res = await fetch('/api/amplify/monitor?workspace_id=' + workspaceId)
      const d = await res.json()
      setMonitorData(d.insights || [])
    } catch {}
    setMonitorLoading(false); setMonitorLoaded(true)
  }

  // ── الإحصائيات الإجمالية ──────────────────────────────────
  const totalSpend  = campaigns.reduce((s, c) => s + (c.insights?.spend || 0), 0)
  const totalReach  = campaigns.reduce((s, c) => s + (c.insights?.reach || 0), 0)
  const totalClicks = campaigns.reduce((s, c) => s + (c.insights?.clicks || 0), 0)
  const activeCamps = campaigns.filter(c => c.status === 'ACTIVE').length

  const prevPlacement = PLACEMENTS.find(p => p.id === previewPlacement) || PLACEMENTS[0]
  const creative = { adCopy, headline, description, ctaAr: selectedCTAAr, cta: selectedCTA, image_url: uploadedImage || selectedContent?.image_url, brandName }

  const stepLabels = ['المحتوى', 'الهدف', 'الجمهور', 'إعادة الاستهداف', 'الميزانية', 'المراجعة']

  if (!mounted || loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - var(--topbar-h))', flexDirection: 'column', gap: 14, background: '#0C0C0C' }}>
      <div className="nexa-spinner" style={{ width: 20, height: 20 }}/>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', fontFamily: F }}>جاري التحميل…</div>
    </div>
  )

  /* ─── بوابة الخطة — Amplify يحتاج Grow+ ─── */
  if (!hasAmplify) return (
    <div dir="rtl" style={{ height:'calc(100vh - var(--topbar-h))', overflowY:'auto', backgroundImage:'url(/cyan-header.png)', backgroundSize:'cover', backgroundPosition:'center', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 32px', position:'relative' }}>
      <div style={{ position:'relative', zIndex:1, textAlign:'center', maxWidth:620, animation:'pageUp 0.4s cubic-bezier(0.22,1,0.36,1) both' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'6px 14px', borderRadius:999, background:'rgba(0,0,0,0.12)', border:'1px solid rgba(0,0,0,0.16)', marginBottom:32, backdropFilter:'blur(8px)' }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'rgba(0,0,0,0.45)' }}/>
          <span style={{ fontSize:12, fontWeight:600, color:'rgba(0,0,0,0.65)', letterSpacing:'0.02em', fontFamily:F }}>Amplify · غير مفعّل</span>
        </div>
        <h1 style={{ fontSize:'clamp(32px,5vw,52px)', fontWeight:800, color:'#0C0C0C', lineHeight:1.2, marginBottom:16, fontFamily:F }}>
          حوّل محتواك<br/>إلى إعلانات تبيع.
        </h1>
        <p style={{ fontSize:16, color:'rgba(0,0,0,0.52)', lineHeight:1.85, maxWidth:480, margin:'0 auto 40px', fontFamily:F }}>
          حوّل أفضل منشوراتك لإعلانات Meta بنقرة واحدة. كوبي بالذكاء الاصطناعي، كريتيف يعكس براندك، ونشر مباشر. متاح من خطة Grow.
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:40 }}>
          {[
            { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>, title:'بنقرة واحدة', desc:'حوّل أي منشور من الاستوديو لإعلان Meta في ثوانٍ' },
            { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>, title:'كوبي بـ AI', desc:'Nexa تكتب نسخة الإعلان بصوتك وتحسّنه تلقائياً' },
            { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, title:'مراقبة الأداء', desc:'تقارير يومية على الإنفاق والوصول والتحويلات' },
          ].map(f => (
            <div key={f.title} style={{ padding:'20px 18px', borderRadius:14, background:'rgba(255,255,255,0.72)', border:'1px solid rgba(255,255,255,0.90)', backdropFilter:'blur(16px)', textAlign:'right' }}>
              <div style={{ color:'rgba(0,0,0,0.55)', marginBottom:12, display:'flex', justifyContent:'flex-end' }}>{f.icon}</div>
              <div style={{ fontSize:14, fontWeight:700, color:'#0C0C0C', marginBottom:6, fontFamily:F }}>{f.title}</div>
              <div style={{ fontSize:12, color:'rgba(0,0,0,0.50)', lineHeight:1.7, fontFamily:F }}>{f.desc}</div>
            </div>
          ))}
        </div>
        <a href="/dashboard/settings?tab=billing"
          style={{ display:'inline-flex', alignItems:'center', gap:9, padding:'14px 32px', fontSize:15, fontWeight:700, fontFamily:F, background:'#0C0C0C', color:'#ffffff', borderRadius:12, textDecoration:'none', transition:'all 0.18s', boxShadow:'0 4px 24px rgba(0,0,0,0.30)' }}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='#1a1a1a';(e.currentTarget as HTMLElement).style.transform='translateY(-2px)'}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#0C0C0C';(e.currentTarget as HTMLElement).style.transform='none'}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          طوّر إلى Grow ←
        </a>
        <div style={{ marginTop:14, fontSize:12, color:'rgba(0,0,0,0.45)', fontFamily:F }}>$89/شهر · إلغاء في أي وقت · بدون رسوم إعداد</div>
      </div>
    </div>
  )

  // ══════════════════════════════════════════════════════════
  // الواجهة
  // ══════════════════════════════════════════════════════════
  return (
    <div dir="rtl" style={{ height: 'calc(100vh - var(--topbar-h))', overflowY: 'auto', background: '#0C0C0C', fontFamily: F }}>

      {/* ── الرأس ─────────────────────────────────────────── */}
      <div style={{ padding: '28px 36px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: F, fontSize: '22px', fontWeight: 700, letterSpacing: '-0.01em', color: '#FFFFFF', marginBottom: '4px' }}>Amplify</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.42)', fontFamily: F }}>إعلانات Meta مدعومة بـ Brand Brain. بدون وكالة.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* تبديل الأقسام */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 3, gap: 3 }}>
            {(['campaigns', 'monitor'] as const).map(tab => (
              <button key={tab} onClick={() => { setActiveTab(tab); setShowCreate(false); if (tab === 'monitor' && !monitorLoaded) loadMonitor() }}
                style={{ padding: '5px 14px', borderRadius: 6, fontSize: '11px', fontWeight: 600, fontFamily: F, cursor: 'pointer', border: 'none', background: activeTab === tab ? 'rgba(255,255,255,0.10)' : 'transparent', color: activeTab === tab ? '#FFFFFF' : 'rgba(255,255,255,0.35)', transition: 'all 0.15s' }}>
                {tab === 'campaigns' ? 'الحملات' : 'المونيتور'}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setShowCreate(!showCreate); if (!showCreate) { setCurrentStep(1); setLaunchError(null); setUploadedImage(null) } }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 18px', background: '#FFFFFF', border: 'none', borderRadius: '10px', fontFamily: F, fontSize: '13px', fontWeight: 700, color: '#0C0C0C', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.88)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#FFFFFF'}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
            حملة جديدة
          </button>
        </div>
      </div>

      {/* ── ربط Meta ──────────────────────────────────────── */}
      {!connected && (
        <div style={{ background: 'rgba(0,170,255,0.05)', border: '1px solid rgba(0,170,255,0.20)', borderRadius: '10px', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 36px 20px', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: '10px', background: 'rgba(0,170,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#00AAFF"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginBottom: 2 }}>وصّل حساب Meta</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontFamily: F }}>اربط Facebook Business لنشر الإعلانات مباشرة. بدونه تُحفظ الحملات كمسودة.</div>
            </div>
          </div>
          <button
            onClick={() => {
              const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.NEXT_PUBLIC_META_APP_ID}&redirect_uri=https%3A%2F%2Fnexaa.cc%2Fapi%2Fmeta%2Fconnect&scope=ads_management,ads_read,pages_read_engagement&response_type=code&state=${workspaceId}`
              window.open(url, '_blank')
            }}
            style={{ padding: '9px 18px', background: '#FFFFFF', border: 'none', borderRadius: '10px', fontFamily: F, fontSize: '12px', fontWeight: 700, color: '#0C0C0C', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
            وصّل Meta ←
          </button>
        </div>
      )}

      {/* ── الإحصائيات ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '24px', padding: '0 36px' }}>
        {[
          { label: 'إجمالي الإنفاق', value: totalSpend > 0 ? `$${totalSpend.toFixed(0)}` : '—',  sub: 'هذا الشهر',     color: '#00AAFF' },
          { label: 'الوصول',         value: totalReach > 0 ? (totalReach >= 1000 ? `${(totalReach / 1000).toFixed(1)}k` : String(totalReach)) : '—', sub: 'شخص فريد',  color: '#22C55E' },
          { label: 'النقرات',        value: totalClicks > 0 ? String(totalClicks) : '—', sub: totalClicks > 0 && totalSpend > 0 ? `معدل $${(totalSpend / totalClicks).toFixed(2)}/نقرة` : 'لا نقرات بعد', color: '#00AAFF' },
          { label: 'حملات نشطة',     value: String(activeCamps), sub: `${campaigns.length} إجمالي`, color: '#FB923C' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px', padding: '18px 20px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)', marginBottom: '10px', fontFamily: F }}>{s.label}</div>
            <div style={{ fontFamily: MONO, fontSize: '26px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '6px' }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: F }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ══ منشئ الحملة ══════════════════════════════════════ */}
      {showCreate && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '16px', marginBottom: '28px', padding: '0 36px' }}>

          {/* ── المحرر ──────────────────────────────────── */}
          <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '12px', padding: '24px' }}>

            {/* تبديل الوضع */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)', fontFamily: F }}>
                {adMode === 'simple' ? 'إطلاق سريع — الذكاء يختار الجمهور والنص' : 'الوضع المتقدم — تحكم كامل'}
              </div>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: 3, gap: 3 }}>
                {(['simple', 'advanced'] as const).map(m => (
                  <button key={m} onClick={() => { setAdMode(m); setCurrentStep(1); setLaunchError(null) }}
                    style={{ padding: '4px 12px', borderRadius: 5, fontSize: '11px', fontWeight: 700, fontFamily: F, cursor: 'pointer', border: 'none', background: adMode === m ? 'rgba(255,255,255,0.10)' : 'transparent', color: adMode === m ? '#FFFFFF' : 'rgba(255,255,255,0.35)', transition: 'all 0.15s' }}>
                    {m === 'simple' ? 'سريع' : 'متقدم'}
                  </button>
                ))}
              </div>
            </div>

            {/* ──── الوضع السريع ──── */}
            {adMode === 'simple' && (
              <div>
                {/* ١. المحتوى */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'rgba(0,170,255,0.70)', fontFamily: F, marginBottom: 10 }}>١. اختر أو ارفع صورة</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' as const }}>
                    <button onClick={() => uploadRef.current?.click()}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 7, fontSize: '12px', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontFamily: F }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      ارفع صورة
                    </button>
                    <input ref={uploadRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]) }}/>
                  </div>
                  {imageError && <div style={{ fontSize: '12px', color: '#EF4444', fontFamily: F, marginBottom: 8 }}>{imageError}</div>}
                  {uploadedImage && (
                    <div style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '2px solid #00AAFF', marginBottom: 10 }}>
                      <img src={uploadedImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                      <button onClick={() => setUploadedImage(null)} style={{ position: 'absolute', top: 2, left: 2, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.80)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                  )}
                  {recentContent.length > 0 && (
                    <div style={{ display: 'flex', gap: '7px', overflowX: 'auto', paddingBottom: 4 }}>
                      {recentContent.map((c: any) => (
                        <div key={c.id} onClick={() => { setSelectedContent(c); if (!adCopy) setAdCopy((c.content || '').slice(0, 125)) }}
                          style={{ flexShrink: 0, width: 68, height: 68, borderRadius: 9, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: `2px solid ${selectedContent?.id === c.id ? '#00AAFF' : 'rgba(255,255,255,0.08)'}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                          {c.image_url || c.video_url ? <img src={c.image_url || c.video_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.30)', padding: '5px', textAlign: 'center' as const, lineHeight: 1.3, fontFamily: F }}>{(c.content || '').slice(0, 30)}</div>}
                          {selectedContent?.id === c.id && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,170,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 16, height: 16, borderRadius: '50%', background: '#00AAFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div></div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ٢. نص الإعلان */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'rgba(0,170,255,0.70)', fontFamily: F }}>٢. نص الإعلان</div>
                    <button onClick={generateAdCopy} disabled={generatingCopy || (!selectedContent && !adCopy.trim() && !uploadedImage)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'rgba(0,170,255,0.08)', border: '1px solid rgba(0,170,255,0.20)', borderRadius: 6, fontSize: '11px', fontWeight: 700, color: generatingCopy ? 'rgba(255,255,255,0.25)' : '#00AAFF', cursor: generatingCopy ? 'not-allowed' : 'pointer', fontFamily: F }}>
                      {generatingCopy ? <><div className="nexa-spinner" style={{ width: 9, height: 9 }}/> يكتب…</> : <>اكتب بالذكاء</>}
                    </button>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <textarea value={adCopy} onChange={e => setAdCopy(e.target.value.slice(0, META_SPECS.primary_text.max))} rows={3}
                      placeholder="النص الرئيسي — السطر الأول هو الشرارة. الحد الأقصى ١٢٥ حرف قبل القطع."
                      dir="rtl"
                      style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${copyWarning ? 'rgba(245,158,11,0.40)' : 'rgba(255,255,255,0.10)'}`, borderRadius: 8, padding: '10px 12px', fontSize: '13px', color: '#FFFFFF', fontFamily: F, outline: 'none', resize: 'none' as const, lineHeight: 1.75, boxSizing: 'border-box' as const }}
                      onFocus={e => e.target.style.borderColor = 'rgba(0,170,255,0.30)'} onBlur={e => e.target.style.borderColor = copyWarning ? 'rgba(245,158,11,0.40)' : 'rgba(255,255,255,0.10)'}/>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      {copyWarning ? <span style={{ fontSize: '11px', color: '#FBB040', fontFamily: F }}>{copyWarning}</span> : <span/>}
                      <span style={{ fontSize: '11px', color: adCopy.length > META_SPECS.primary_text.warn ? '#FBB040' : 'rgba(255,255,255,0.25)', fontFamily: MONO }}>{adCopy.length}/{META_SPECS.primary_text.max}</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <input value={headline} onChange={e => setHeadline(e.target.value.slice(0, META_SPECS.headline.max))} placeholder={`العنوان (حد ${META_SPECS.headline.max} حرف)`}
                        dir="rtl"
                        style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${headWarning ? 'rgba(245,158,11,0.40)' : 'rgba(255,255,255,0.10)'}`, borderRadius: 7, padding: '8px 12px', fontSize: '12px', color: '#FFFFFF', fontFamily: F, outline: 'none', boxSizing: 'border-box' as const }}
                        onFocus={e => e.target.style.borderColor = 'rgba(0,170,255,0.30)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.10)'}/>
                      {headWarning && <div style={{ fontSize: '10px', color: '#FBB040', fontFamily: F, marginTop: 2 }}>{headWarning}</div>}
                    </div>
                    <select
                      value={selectedCTA}
                      onChange={e => {
                        setSelectedCTA(e.target.value)
                        const found = CTA_OPTIONS.find(c => c.en === e.target.value)
                        if (found) setSelectedCTAAr(found.ar)
                      }}
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 7, padding: '8px 12px', fontSize: '12px', color: '#FFFFFF', fontFamily: F, outline: 'none', cursor: 'pointer' }}>
                      {CTA_OPTIONS.map(c => <option key={c.en} value={c.en} style={{ background: '#141414' }}>{c.ar}</option>)}
                    </select>
                  </div>
                </div>

                {/* ٣. الميزانية */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'rgba(0,170,255,0.70)', fontFamily: F, marginBottom: 10 }}>٣. الميزانية اليومية</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                    {[10, 20, 50, 100, 200].map(b => (
                      <button key={b} onClick={() => setDailyBudget(b)}
                        style={{ padding: '7px 14px', borderRadius: 8, fontSize: '13px', fontWeight: 500, background: dailyBudget === b ? 'rgba(0,170,255,0.10)' : 'rgba(255,255,255,0.04)', border: `1px solid ${dailyBudget === b ? 'rgba(0,170,255,0.30)' : 'rgba(255,255,255,0.08)'}`, color: dailyBudget === b ? '#00AAFF' : 'rgba(255,255,255,0.50)', cursor: 'pointer', fontFamily: MONO, transition: 'all 0.15s' }}>
                        ${b}/يوم
                      </button>
                    ))}
                    <input type="number" value={dailyBudget} onChange={e => setDailyBudget(parseInt(e.target.value) || 5)} min={5}
                      style={{ width: 80, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, padding: '7px 10px', fontSize: '13px', color: '#FFFFFF', fontFamily: MONO, outline: 'none', textAlign: 'center' as const }}/>
                  </div>
                </div>

                {launchError && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 8, fontSize: '12px', color: 'rgba(239,68,68,0.85)', marginBottom: 14, fontFamily: F }}>{launchError}</div>}

                <button onClick={handleLaunch} disabled={launching || !workspaceId}
                  style={{ width: '100%', padding: '13px', background: launching || !workspaceId ? 'rgba(255,255,255,0.06)' : '#FFFFFF', border: 'none', borderRadius: 9, fontSize: '13px', fontWeight: 700, color: launching || !workspaceId ? 'rgba(255,255,255,0.25)' : '#0C0C0C', cursor: launching || !workspaceId ? 'not-allowed' : 'pointer', fontFamily: F, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {launching ? <><div className="nexa-spinner" style={{ width: 13, height: 13, borderColor: 'rgba(0,0,0,0.15)', borderTopColor: '#0C0C0C' }}/> يطلق…</> : <>أطلق الحملة — ${dailyBudget}/يوم ←</>}
                </button>
                <div style={{ marginTop: 8, fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontFamily: F, textAlign: 'center' as const }}>
                  الذكاء يحدد الجمهور والمواضع بناءً على Brand Brain
                </div>
              </div>
            )}

            {/* ──── الوضع المتقدم ──── */}
            {adMode === 'advanced' && (
              <div>
                {/* شرائط الخطوات */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 20, overflowX: 'auto' }}>
                  {stepLabels.map((s, i) => (
                    <button key={i} onClick={() => setCurrentStep(i + 1)}
                      style={{ flex: 1, padding: '7px 4px', background: currentStep === i + 1 ? '#00AAFF' : currentStep > i + 1 ? 'rgba(0,170,255,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${currentStep === i + 1 ? '#00AAFF' : currentStep > i + 1 ? 'rgba(0,170,255,0.30)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '6px', cursor: 'pointer', fontFamily: F, fontSize: '10px', fontWeight: 700, color: currentStep === i + 1 ? '#fff' : currentStep > i + 1 ? '#00AAFF' : 'rgba(255,255,255,0.35)', transition: 'all 0.15s', whiteSpace: 'nowrap' as const, minWidth: 60 }}>
                      {s}
                    </button>
                  ))}
                </div>

                {/* الخطوة ١ — المحتوى الإبداعي */}
                {currentStep === 1 && (
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'rgba(0,170,255,0.70)', fontFamily: F, marginBottom: 14 }}>المحتوى الإبداعي — النص والصورة</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <button onClick={() => uploadRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 7, fontSize: '12px', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontFamily: F }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        ارفع صورة
                      </button>
                    </div>
                    {imageError && <div style={{ fontSize: '12px', color: '#EF4444', fontFamily: F, marginBottom: 8 }}>{imageError}</div>}
                    {uploadedImage && <div style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '2px solid #00AAFF', marginBottom: 12 }}><img src={uploadedImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/><button onClick={() => setUploadedImage(null)} style={{ position: 'absolute', top: 2, left: 2, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.80)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button></div>}
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: F, marginBottom: 6 }}>النص الرئيسي (حد {META_SPECS.primary_text.max} حرف)</div>
                      <textarea value={adCopy} onChange={e => setAdCopy(e.target.value.slice(0, META_SPECS.primary_text.max))} rows={3} dir="rtl"
                        style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${copyWarning ? 'rgba(245,158,11,0.40)' : 'rgba(255,255,255,0.10)'}`, borderRadius: 8, padding: '10px 12px', fontSize: '13px', color: '#FFFFFF', fontFamily: F, outline: 'none', resize: 'none' as const, lineHeight: 1.75, boxSizing: 'border-box' as const }}/>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                        {copyWarning ? <span style={{ fontSize: '10px', color: '#FBB040', fontFamily: F }}>{copyWarning}</span> : <span/>}
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', fontFamily: MONO }}>{adCopy.length}/{META_SPECS.primary_text.max}</span>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: F, marginBottom: 5 }}>العنوان (حد {META_SPECS.headline.max})</div>
                        <input value={headline} onChange={e => setHeadline(e.target.value.slice(0, META_SPECS.headline.max))} dir="rtl"
                          style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 7, padding: '8px 12px', fontSize: '12px', color: '#FFFFFF', fontFamily: F, outline: 'none', boxSizing: 'border-box' as const }}/>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: F, marginBottom: 5 }}>زر الدعوة</div>
                        <select value={selectedCTA} onChange={e => { setSelectedCTA(e.target.value); const f = CTA_OPTIONS.find(c => c.en === e.target.value); if (f) setSelectedCTAAr(f.ar) }} style={{ width: '100%', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 7, padding: '8px 12px', fontSize: '12px', color: '#FFFFFF', fontFamily: F, outline: 'none' }}>
                          {CTA_OPTIONS.map(c => <option key={c.en} value={c.en} style={{ background: '#141414' }}>{c.ar}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: F, marginBottom: 8 }}>المواضع الإعلانية</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                        {PLACEMENTS.map(p => (
                          <button key={p.id} onClick={() => setSelectedPlacements(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                            style={{ padding: '7px 8px', borderRadius: 7, fontSize: '10px', fontWeight: 500, background: selectedPlacements.includes(p.id) ? 'rgba(0,170,255,0.10)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedPlacements.includes(p.id) ? 'rgba(0,170,255,0.30)' : 'rgba(255,255,255,0.08)'}`, color: selectedPlacements.includes(p.id) ? '#00AAFF' : 'rgba(255,255,255,0.45)', cursor: 'pointer', fontFamily: F, textAlign: 'right' as const }}>
                            {p.label}
                            <div style={{ fontSize: '9px', opacity: 0.6, marginTop: 1 }}>{p.ratio} · {p.w}×{p.h}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <button onClick={generateAdCopy} disabled={generatingCopy}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(0,170,255,0.08)', border: '1px solid rgba(0,170,255,0.20)', borderRadius: 7, fontSize: '12px', fontWeight: 700, color: '#00AAFF', cursor: generatingCopy ? 'not-allowed' : 'pointer', fontFamily: F, marginBottom: 14 }}>
                      {generatingCopy ? <><div className="nexa-spinner" style={{ width: 10, height: 10 }}/>يكتب…</> : <>اكتب النص بـ Brand Brain</>}
                    </button>
                  </div>
                )}

                {/* الخطوة ٢ — الهدف */}
                {currentStep === 2 && (
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'rgba(0,170,255,0.70)', fontFamily: F, marginBottom: 14 }}>هدف الحملة</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {OBJECTIVES.map(obj => (
                        <button key={obj.id} onClick={() => setSelectedObjective(obj.id)}
                          style={{ padding: '12px 14px', borderRadius: 9, background: selectedObjective === obj.id ? 'rgba(0,170,255,0.10)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedObjective === obj.id ? 'rgba(0,170,255,0.30)' : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer', fontFamily: F, textAlign: 'right' as const, display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s' }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: selectedObjective === obj.id ? '#00AAFF' : 'rgba(255,255,255,0.20)' }}/>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: selectedObjective === obj.id ? '#FFFFFF' : 'rgba(255,255,255,0.65)' }}>{obj.label}</div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{obj.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* الخطوة ٣ — الجمهور */}
                {currentStep === 3 && (
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'rgba(0,170,255,0.70)', fontFamily: F, marginBottom: 14 }}>استهداف الجمهور</div>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: F, marginBottom: 8 }}>الاهتمامات — مبنية تلقائياً من Brand Brain</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 8 }}>
                        {audienceTags.map(tag => (
                          <span key={tag} onClick={() => setAudienceTags(prev => prev.filter(t => t !== tag))}
                            style={{ padding: '4px 10px', background: 'rgba(0,170,255,0.10)', border: '1px solid rgba(0,170,255,0.22)', borderRadius: 100, fontSize: '11px', color: '#00AAFF', cursor: 'pointer', fontFamily: F }}>
                            {tag} ×
                          </span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 7 }}>
                        <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && tagInput.trim()) { setAudienceTags(prev => [...prev, tagInput.trim()]); setTagInput('') } }} placeholder="أضف اهتماماً…" dir="rtl"
                          style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 7, padding: '7px 12px', fontSize: '12px', color: '#FFFFFF', fontFamily: F, outline: 'none' }}/>
                        <button onClick={() => { if (tagInput.trim()) { setAudienceTags(prev => [...prev, tagInput.trim()]); setTagInput('') } }} style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, fontSize: '12px', color: 'rgba(255,255,255,0.60)', cursor: 'pointer', fontFamily: F }}>إضافة</button>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: F, marginBottom: 6 }}>الفئة العمرية</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input type="number" value={ageMin} onChange={e => setAgeMin(parseInt(e.target.value) || 18)} min={13} max={65} style={{ width: 60, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 7, padding: '6px 8px', fontSize: '12px', color: '#FFFFFF', fontFamily: MONO, outline: 'none', textAlign: 'center' as const }}/>
                          <span style={{ color: 'rgba(255,255,255,0.30)', fontFamily: F, fontSize: 12 }}>إلى</span>
                          <input type="number" value={ageMax} onChange={e => setAgeMax(parseInt(e.target.value) || 65)} min={13} max={65} style={{ width: 60, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 7, padding: '6px 8px', fontSize: '12px', color: '#FFFFFF', fontFamily: MONO, outline: 'none', textAlign: 'center' as const }}/>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: F, marginBottom: 6 }}>الجنس</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {[{ v: 'ALL', l: 'الكل' }, { v: 'MALE', l: 'ذكر' }, { v: 'FEMALE', l: 'أنثى' }].map(g => (
                            <button key={g.v} onClick={() => setGender(g.v)} style={{ padding: '6px 12px', borderRadius: 7, fontSize: '11px', background: gender === g.v ? 'rgba(0,170,255,0.10)' : 'rgba(255,255,255,0.04)', border: `1px solid ${gender === g.v ? 'rgba(0,170,255,0.30)' : 'rgba(255,255,255,0.08)'}`, color: gender === g.v ? '#00AAFF' : 'rgba(255,255,255,0.45)', cursor: 'pointer', fontFamily: F }}>
                              {g.l}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: F, marginBottom: 6 }}>الدول</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 8 }}>
                        {locations.map(loc => (
                          <span key={loc} onClick={() => setLocations(prev => prev.filter(l => l !== loc))} style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 100, fontSize: '11px', color: 'rgba(255,255,255,0.60)', cursor: 'pointer', fontFamily: MONO }}>{loc} ×</span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 7 }}>
                        <input value={locationInput} onChange={e => setLocationInput(e.target.value.toUpperCase())} onKeyDown={e => { if (e.key === 'Enter' && locationInput.trim()) { setLocations(prev => [...prev, locationInput.trim()]); setLocationInput('') } }} placeholder="كود الدولة (مثال: SA, AE, EG)"
                          dir="ltr"
                          style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 7, padding: '7px 12px', fontSize: '12px', color: '#FFFFFF', fontFamily: MONO, outline: 'none' }}/>
                        <button onClick={() => { if (locationInput.trim()) { setLocations(prev => [...prev, locationInput.trim()]); setLocationInput('') } }} style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, fontSize: '12px', color: 'rgba(255,255,255,0.60)', cursor: 'pointer', fontFamily: F }}>إضافة</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* الخطوة ٤ — إعادة الاستهداف */}
                {currentStep === 4 && (
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'rgba(0,170,255,0.70)', fontFamily: F, marginBottom: 14 }}>إعادة الاستهداف والجماهير المتقدمة</div>
                    <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: retargetingEnabled ? 12 : 0 }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.80)', fontFamily: F }}>إعادة الاستهداف</div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: F, marginTop: 2 }}>اعرض إعلاناتك لمن تفاعل مع علامتك سابقاً</div>
                        </div>
                        <button onClick={() => setRetargetingEnabled(p => !p)}
                          style={{ width: 40, height: 22, borderRadius: 11, background: retargetingEnabled ? '#00AAFF' : 'rgba(255,255,255,0.10)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                          <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#FFFFFF', position: 'absolute', top: 3, left: retargetingEnabled ? 21 : 3, transition: 'left 0.2s' }}/>
                        </button>
                      </div>
                      {retargetingEnabled && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                          {([
                            { v: 'website',   l: 'زوار الموقع',            d: 'من زاروا موقعك من قبل' },
                            { v: 'lookalike', l: 'جمهور مشابه',            d: 'أشخاص شبيهون بعملائك الحاليين' },
                            { v: 'engagement',l: 'المتفاعلون مع منشوراتك', d: 'من أعجبوا أو علّقوا أو شاركوا' },
                          ] as const).map(r => (
                            <button key={r.v} onClick={() => setRetargetingType(r.v)}
                              style={{ padding: '10px 12px', borderRadius: 8, background: retargetingType === r.v ? 'rgba(0,170,255,0.10)' : 'rgba(255,255,255,0.02)', border: `1px solid ${retargetingType === r.v ? 'rgba(0,170,255,0.30)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', fontFamily: F, textAlign: 'right' as const }}>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: retargetingType === r.v ? '#FFFFFF' : 'rgba(255,255,255,0.60)' }}>{r.l}</div>
                              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.30)', marginTop: 2 }}>{r.d}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.80)', fontFamily: F }}>اختبار A/B</div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: F, marginTop: 2 }}>اختبر نسختين من إعلانك تلقائياً</div>
                        </div>
                        <button onClick={() => setAbEnabled(p => !p)} style={{ width: 40, height: 22, borderRadius: 11, background: abEnabled ? '#00AAFF' : 'rgba(255,255,255,0.10)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                          <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#FFFFFF', position: 'absolute', top: 3, left: abEnabled ? 21 : 3, transition: 'left 0.2s' }}/>
                        </button>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: F, marginBottom: 8 }}>استراتيجية المزايدة</div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: bidStrategy === 'COST_CAP' ? 12 : 0 }}>
                        {([
                          { v: 'LOWEST_COST', l: 'أقل تكلفة',    d: 'Meta يحسّن لأكبر نتائج' },
                          { v: 'COST_CAP',    l: 'حد التكلفة',   d: 'حدد أقصى تكلفة لكل نتيجة' },
                        ] as const).map(b => (
                          <button key={b.v} onClick={() => setBidStrategy(b.v)} style={{ flex: 1, padding: '10px 12px', borderRadius: 8, background: bidStrategy === b.v ? 'rgba(0,170,255,0.10)' : 'rgba(255,255,255,0.03)', border: `1px solid ${bidStrategy === b.v ? 'rgba(0,170,255,0.30)' : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer', fontFamily: F, textAlign: 'right' as const }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: bidStrategy === b.v ? '#FFFFFF' : 'rgba(255,255,255,0.60)' }}>{b.l}</div>
                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.30)', marginTop: 1 }}>{b.d}</div>
                          </button>
                        ))}
                      </div>
                      {bidStrategy === 'COST_CAP' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.50)', fontFamily: F }}>أقصى تكلفة للنتيجة: $</span>
                          <input type="number" value={targetCpa} onChange={e => setTargetCpa(parseInt(e.target.value) || 1)} min={1} style={{ width: 70, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 7, padding: '7px 10px', fontSize: '13px', color: '#FFFFFF', fontFamily: MONO, outline: 'none', textAlign: 'center' as const }}/>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* الخطوة ٥ — الميزانية */}
                {currentStep === 5 && (
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'rgba(0,170,255,0.70)', fontFamily: F, marginBottom: 14 }}>الميزانية والجدول الزمني</div>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: F, marginBottom: 8 }}>الميزانية اليومية</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 8 }}>
                        {[10, 20, 50, 100, 200, 500].map(b => (
                          <button key={b} onClick={() => setDailyBudget(b)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: '13px', fontWeight: 500, background: dailyBudget === b ? 'rgba(0,170,255,0.10)' : 'rgba(255,255,255,0.04)', border: `1px solid ${dailyBudget === b ? 'rgba(0,170,255,0.30)' : 'rgba(255,255,255,0.08)'}`, color: dailyBudget === b ? '#00AAFF' : 'rgba(255,255,255,0.50)', cursor: 'pointer', fontFamily: MONO }}>${b}/يوم</button>
                        ))}
                      </div>
                      <input type="number" value={dailyBudget} onChange={e => setDailyBudget(parseInt(e.target.value) || 5)} min={5} style={{ width: 120, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, padding: '8px 12px', fontSize: '13px', color: '#FFFFFF', fontFamily: MONO, outline: 'none' }}/>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: F, marginBottom: 6 }}>تاريخ البداية</div>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 7, padding: '8px 12px', fontSize: '12px', color: '#FFFFFF', fontFamily: F, outline: 'none', width: '100%', boxSizing: 'border-box' as const, colorScheme: 'dark' }}/>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: F, marginBottom: 6 }}>تاريخ الانتهاء (اختياري)</div>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 7, padding: '8px 12px', fontSize: '12px', color: '#FFFFFF', fontFamily: F, outline: 'none', width: '100%', boxSizing: 'border-box' as const, colorScheme: 'dark' }}/>
                      </div>
                    </div>
                    {/* تقدير الوصول */}
                    <div style={{ padding: '14px 16px', background: 'rgba(0,170,255,0.04)', border: '1px solid rgba(0,170,255,0.12)', borderRadius: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.40)', fontFamily: F }}>الوصول اليومي المتوقع بـ ${dailyBudget}/يوم</div>
                        {reachLoading && <div className="nexa-spinner" style={{ width: 10, height: 10 }}/>}
                      </div>
                      <div style={{ fontFamily: MONO, fontSize: '22px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.03em', marginTop: 6 }}>
                        {reachLoading ? '—' : `${(reachEstimate?.min || Math.round(dailyBudget * 80)).toLocaleString()} – ${(reachEstimate?.max || Math.round(dailyBudget * 220)).toLocaleString()}`}
                      </div>
                      <div style={{ fontSize: '11px', color: reachEstimate?.estimated ? 'rgba(34,197,94,0.60)' : 'rgba(255,255,255,0.35)', fontFamily: F, marginTop: 2 }}>
                        {reachEstimate?.estimated ? 'تقدير حي من Meta — يتحدث مع تغيير الجمهور' : 'شخص يومياً · تقدير تقريبي'}
                      </div>
                    </div>
                  </div>
                )}

                {/* الخطوة ٦ — المراجعة */}
                {currentStep === 6 && (
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'rgba(0,170,255,0.70)', fontFamily: F, marginBottom: 14 }}>راجع قبل الإطلاق</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                      {[
                        { label: 'الهدف',       value: OBJECTIVES.find(o => o.id === selectedObjective)?.label || selectedObjective },
                        { label: 'الميزانية',   value: `$${dailyBudget}/يوم${endDate ? ` · ينتهي ${endDate}` : ' · بدون تاريخ انتهاء'}` },
                        { label: 'الجمهور',     value: `${ageMin}–${ageMax} · ${gender === 'ALL' ? 'الكل' : gender === 'MALE' ? 'ذكور' : 'إناث'} · ${locations.join(', ')}` },
                        { label: 'الاهتمامات', value: audienceTags.slice(0, 4).join('، ') + (audienceTags.length > 4 ? ` +${audienceTags.length - 4} أخرى` : '') },
                        { label: 'المواضع',     value: selectedPlacements.length + ' موضع إعلاني' },
                        ...(retargetingEnabled ? [{ label: 'إعادة الاستهداف', value: retargetingType === 'website' ? 'زوار الموقع' : retargetingType === 'lookalike' ? 'جمهور مشابه' : 'المتفاعلون' }] : []),
                        ...(abEnabled ? [{ label: 'اختبار A/B', value: 'مفعّل' }] : []),
                      ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.40)', fontFamily: F }}>{item.label}</span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.75)', fontFamily: F }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                    {!connected && <div style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.20)', borderRadius: 8, fontSize: '12px', color: '#FBB040', fontFamily: F, marginBottom: 14 }}>Meta غير مرتبط — ستُحفظ الحملة كمسودة حتى تربط حسابك.</div>}
                    {launchError && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 8, fontSize: '12px', color: 'rgba(239,68,68,0.85)', marginBottom: 14, fontFamily: F }}>{launchError}</div>}
                    <button onClick={handleLaunch} disabled={launching || !workspaceId}
                      style={{ width: '100%', padding: '13px', background: launching ? 'rgba(255,255,255,0.06)' : '#FFFFFF', border: 'none', borderRadius: 9, fontSize: '13px', fontWeight: 700, color: launching ? 'rgba(255,255,255,0.25)' : '#0C0C0C', cursor: launching ? 'not-allowed' : 'pointer', fontFamily: F, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      {launching ? <><div className="nexa-spinner" style={{ width: 13, height: 13, borderColor: 'rgba(0,0,0,0.15)', borderTopColor: '#0C0C0C' }}/> يطلق…</> : <>أطلق الحملة ←</>}
                    </button>
                  </div>
                )}

                {/* أزرار التنقل */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                  {currentStep > 1 ? <button onClick={() => setCurrentStep(s => s - 1)} style={{ padding: '9px 18px', background: 'transparent', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, fontSize: '12px', color: 'rgba(255,255,255,0.40)', cursor: 'pointer', fontFamily: F }}>→ رجوع</button> : <span/>}
                  {currentStep < 6 && <button onClick={() => setCurrentStep(s => s + 1)} style={{ padding: '9px 20px', background: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: '12px', fontWeight: 700, color: '#0C0C0C', cursor: 'pointer', fontFamily: F }}>التالي ←</button>}
                </div>
              </div>
            )}
          </div>

          {/* ── معاينة حية ──────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '12px', overflow: 'hidden' }}>
              {/* تبويبات المواضع */}
              <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' as const }}>
                {PLACEMENTS.filter(p => adMode === 'simple' || selectedPlacements.includes(p.id)).map(p => (
                  <button key={p.id} onClick={() => setPreviewPlacement(p.id)}
                    style={{ padding: '5px 11px', borderRadius: 6, fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap' as const, background: previewPlacement === p.id ? 'rgba(0,170,255,0.12)' : 'transparent', border: `1px solid ${previewPlacement === p.id ? 'rgba(0,170,255,0.30)' : 'rgba(255,255,255,0.08)'}`, color: previewPlacement === p.id ? '#00AAFF' : 'rgba(255,255,255,0.35)', cursor: 'pointer', fontFamily: F, flexShrink: 0, transition: 'all 0.15s' }}>
                    {p.label}
                  </button>
                ))}
              </div>
              {/* إطار المعاينة */}
              <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', background: '#0f0f0f' }}>
                <AdPreview creative={creative} placement={prevPlacement}/>
              </div>
              {/* مواصفات الموضع */}
              <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.20)', fontFamily: MONO }}>{prevPlacement.w}×{prevPlacement.h}px · {prevPlacement.ratio}</span>
                {!uploadedImage && !selectedContent?.image_url && (
                  <span style={{ fontSize: '9px', color: 'rgba(245,158,11,0.60)', fontFamily: F }}>ارفع صورة لرؤية المعاينة الكاملة</span>
                )}
              </div>
            </div>
            {/* تقدير الوصول */}
            <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '12px', padding: '14px 16px' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.28)', marginBottom: 8, fontFamily: F, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>الوصول اليومي المتوقع</span>
                {reachLoading && <div className="nexa-spinner" style={{ width: 10, height: 10 }}/>}
                {!reachLoading && reachEstimate?.estimated && <span style={{ color: 'rgba(0,170,255,0.40)', fontSize: '8px' }}>مباشر من Meta</span>}
              </div>
              <div style={{ fontFamily: MONO, fontSize: '22px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.03em' }}>
                {reachLoading ? '—' : `${(reachEstimate?.min || Math.round(dailyBudget * 80)).toLocaleString()}–${(reachEstimate?.max || Math.round(dailyBudget * 220)).toLocaleString()}`}
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.30)', marginTop: 4, fontFamily: F }}>شخص يومياً · ميزانية ${dailyBudget}/يوم</div>
            </div>
          </div>
        </div>
      )}

      {/* ══ تبويب المونيتور ══════════════════════════════════ */}
      {activeTab === 'monitor' && (
        <div style={{ padding: '0 36px 36px' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.70)', fontFamily: F, marginBottom: 4 }}>مونيتور الحملات اليومي</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.30)', fontFamily: F }}>الذكاء يراجع حملاتك النشطة يومياً ويخبرك بالضبط ماذا تفعل.</div>
          </div>
          {monitorLoading && <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0', color: 'rgba(255,255,255,0.35)', fontFamily: F, fontSize: '13px' }}><div className="nexa-spinner" style={{ width: 14, height: 14 }}/> يحلل الحملات…</div>}
          {!monitorLoading && !monitorLoaded && (
            <div style={{ padding: '40px 24px', textAlign: 'center' as const, color: 'rgba(255,255,255,0.25)', fontFamily: F, fontSize: '13px', background: '#141414', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
              <div style={{ marginBottom: 12, color: 'rgba(255,255,255,0.20)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div style={{ marginBottom: 8, fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.40)' }}>مونيتور الذكاء</div>
              <div style={{ marginBottom: 16, lineHeight: 1.75 }}>يراجع كل حملة نشطة ويخبرك بما عليك فعله اليوم.</div>
              <button onClick={loadMonitor} style={{ padding: '9px 20px', background: 'rgba(0,170,255,0.08)', border: '1px solid rgba(0,170,255,0.22)', borderRadius: 8, fontSize: '12px', fontWeight: 700, color: '#00AAFF', cursor: 'pointer', fontFamily: F }}>
                شغّل التحليل
              </button>
            </div>
          )}
          {!monitorLoading && monitorLoaded && monitorData.length === 0 && <div style={{ padding: '32px', textAlign: 'center' as const, color: 'rgba(255,255,255,0.25)', fontFamily: F, fontSize: '13px', background: '#141414', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>لا توجد حملات نشطة للمراقبة.</div>}
          {!monitorLoading && monitorData.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {monitorData.map((item: any, i: number) => (
                <div key={i} style={{ background: '#141414', border: `1px solid ${item.status === 'critical' ? 'rgba(239,68,68,0.25)' : item.status === 'warning' ? 'rgba(245,158,11,0.20)' : 'rgba(34,197,94,0.15)'}`, borderRadius: 10, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.status === 'critical' ? '#EF4444' : item.status === 'warning' ? '#F59E0B' : '#22C55E', flexShrink: 0 }}/>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', fontFamily: F }}>{item.campaign}</div>
                    <StatusBadge status={item.status === 'critical' ? 'REJECTED' : item.status === 'warning' ? 'PAUSED' : 'ACTIVE'}/>
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', fontFamily: F, lineHeight: 1.7, marginBottom: 10 }}>{item.insight}</div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, padding: '9px 12px', background: 'rgba(0,170,255,0.05)', border: '1px solid rgba(0,170,255,0.12)', borderRadius: 8 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#00AAFF" strokeWidth="2.5" strokeLinecap="round" style={{ marginTop: 2, flexShrink: 0 }}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                    <div style={{ fontSize: '12px', color: 'rgba(0,170,255,0.80)', fontFamily: F, lineHeight: 1.65 }}><strong>الإجراء المطلوب:</strong> {item.action}</div>
                  </div>
                </div>
              ))}
              <button onClick={loadMonitor} style={{ padding: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: '12px', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontFamily: F }}>تحديث التحليل</button>
            </div>
          )}
        </div>
      )}

      {/* ══ قائمة الحملات ════════════════════════════════════ */}
      {activeTab === 'campaigns' && (
        <div style={{ padding: '0 36px 36px' }}>
          <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)', fontFamily: F }}>الحملات</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontFamily: F }}>{campaigns.length} إجمالي</div>
          </div>

          {campaigns.length === 0 ? (
            <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px', padding: '48px 24px', textAlign: 'center' as const }}>
              <div style={{ width: 48, height: 48, borderRadius: '10px', background: 'rgba(0,170,255,0.08)', border: '1px solid rgba(0,170,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00AAFF" strokeWidth="1.5" strokeLinecap="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
              </div>
              <div style={{ fontFamily: F, fontSize: '18px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: 8 }}>ما في حملات بعد</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', lineHeight: 1.85, maxWidth: 380, margin: '0 auto 20px', fontFamily: F }}>
                أنشئ أول حملة Meta. Brand Brain يبني الجمهور ويكتب النص ويتولى الاستهداف تلقائياً.
              </div>
              <button onClick={() => setShowCreate(true)} style={{ padding: '10px 24px', background: '#FFFFFF', border: 'none', borderRadius: '10px', fontFamily: F, fontSize: '13px', fontWeight: 700, color: '#0C0C0C', cursor: 'pointer' }}>
                أنشئ أول حملة ←
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {campaigns.map((camp: Campaign) => (
                <div key={camp.id}>
                  <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px', padding: '16px 20px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.18)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.10)'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }} onClick={() => setExpandedCamp(expandedCamp === camp.id ? null : camp.id)}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: camp.status === 'ACTIVE' ? '#22C55E' : camp.status === 'PAUSED' ? '#F59E0B' : camp.status === 'IN_REVIEW' ? '#00AAFF' : camp.status === 'REJECTED' || camp.status === 'ERROR' ? '#EF4444' : 'rgba(255,255,255,0.25)' }}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: F, fontSize: '13px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.01em', marginBottom: '3px' }}>{camp.name}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: F }}>
                          ${camp.daily_budget}/يوم · {camp.start_date ? new Date(camp.start_date).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }) : 'بدون بداية'} · وضع {camp.mode === 'simple' ? 'سريع' : 'متقدم'}
                        </div>
                      </div>
                      <StatusBadge status={camp.status}/>
                      <div style={{ display: 'flex', gap: 16 }}>
                        {[
                          { v: `$${(camp.insights?.spend || 0).toFixed(0)}`, l: 'الإنفاق' },
                          { v: camp.insights?.reach ? (camp.insights.reach >= 1000 ? `${(camp.insights.reach / 1000).toFixed(1)}k` : String(camp.insights.reach)) : '—', l: 'الوصول' },
                          { v: camp.insights?.cpc ? `$${camp.insights.cpc.toFixed(2)}` : '—', l: 'CPC' },
                        ].map((s, i) => (
                          <div key={i} style={{ textAlign: 'left' as const }}>
                            <div style={{ fontFamily: MONO, fontSize: '13px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em' }}>{s.v}</div>
                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', fontFamily: F }}>{s.l}</div>
                          </div>
                        ))}
                      </div>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" style={{ transition: 'transform 0.2s', transform: expandedCamp === camp.id ? 'rotate(90deg)' : 'none' }}><polyline points="9 18 15 12 9 6"/></svg>
                    </div>

                    {/* تفاصيل الحملة */}
                    {expandedCamp === camp.id && (
                      <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <PlainResult camp={camp}/>

                        {camp.audience_snapshot && (
                          <div style={{ marginTop: 10, fontSize: '11px', color: 'rgba(255,255,255,0.30)', fontFamily: F, lineHeight: 1.7 }}>
                            الاستهداف: {camp.audience_snapshot.ageMin}–{camp.audience_snapshot.ageMax} · {camp.audience_snapshot.gender === 'ALL' ? 'الكل' : camp.audience_snapshot.gender === 'MALE' ? 'ذكور' : 'إناث'} · {(camp.audience_snapshot.locations || []).join(', ')}
                            {(camp.audience_snapshot.interests || []).length > 0 && <> · {camp.audience_snapshot.interests.slice(0, 3).join(', ')}</>}
                          </div>
                        )}

                        {camp.status === 'REJECTED' && camp.rejection_reason && (
                          <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 8 }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#EF4444', fontFamily: F, marginBottom: 4 }}>رفض Meta هذا الإعلان</div>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.60)', fontFamily: F, lineHeight: 1.7 }}>{camp.rejection_reason}</div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.30)', fontFamily: F, marginTop: 6 }}>عدّل النص أو الصورة وأعد التقديم — معظم حالات الرفض تُحلّ بتعديل المحتوى الإبداعي.</div>
                          </div>
                        )}

                        {camp.status === 'IN_REVIEW' && (
                          <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(0,170,255,0.05)', border: '1px solid rgba(0,170,255,0.15)', borderRadius: 8 }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#00AAFF', fontFamily: F, marginBottom: 3 }}>Meta يراجع إعلانك</div>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.50)', fontFamily: F, lineHeight: 1.7 }}>هذا يستغرق عادة دقائق إلى ساعات قليلة. نيكسا ستحدّث الحالة تلقائياً بعد الموافقة.</div>
                          </div>
                        )}

                        {/* أزرار الإجراءات */}
                        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' as const }}>
                          {camp.status === 'ACTIVE' && (
                            <button onClick={() => toggleCampaignStatus(camp, 'PAUSED')}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)', borderRadius: 8, fontSize: '12px', fontFamily: F, fontWeight: 700, color: '#FBB040', cursor: 'pointer' }}>
                              إيقاف مؤقت
                            </button>
                          )}
                          {camp.status === 'PAUSED' && (
                            <button onClick={() => toggleCampaignStatus(camp, 'ACTIVE')}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.22)', borderRadius: 8, fontSize: '12px', fontFamily: F, fontWeight: 700, color: '#22C55E', cursor: 'pointer' }}>
                              استئناف
                            </button>
                          )}
                          {camp.status === 'REJECTED' && (
                            <button onClick={() => toggleCampaignStatus(camp, 'ACTIVE')}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 8, fontSize: '12px', fontFamily: F, fontWeight: 700, color: '#EF4444', cursor: 'pointer' }}>
                              تعديل وإعادة التقديم
                            </button>
                          )}
                          {camp.status === 'IN_REVIEW' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(0,170,255,0.04)', border: '1px solid rgba(0,170,255,0.12)', borderRadius: 8, fontSize: '12px', fontFamily: F, color: 'rgba(0,170,255,0.50)' }}>
                              <div className="nexa-spinner" style={{ width: 10, height: 10, borderColor: 'rgba(0,170,255,0.20)', borderTopColor: '#00AAFF' }}/>
                              في انتظار موافقة Meta
                            </div>
                          )}

                          {camp.status !== 'DELETED' && (
                            editingCamp === camp.id ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.40)', fontFamily: F }}>$</span>
                                <input type="number" value={editBudget} onChange={e => setEditBudget(parseInt(e.target.value) || 5)} min={5}
                                  style={{ width: 70, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '6px 10px', fontSize: '13px', color: '#FFFFFF', fontFamily: MONO, outline: 'none', textAlign: 'center' as const }}/>
                                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.40)', fontFamily: F }}>/يوم</span>
                                <button onClick={() => updateCampaignBudget(camp.id, editBudget)} style={{ padding: '6px 12px', background: '#FFFFFF', border: 'none', borderRadius: 6, fontSize: '12px', fontWeight: 700, color: '#0C0C0C', cursor: 'pointer', fontFamily: F }}>حفظ</button>
                                <button onClick={() => setEditingCamp(null)} style={{ padding: '6px 10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 6, fontSize: '12px', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontFamily: F }}>إلغاء</button>
                              </div>
                            ) : (
                              <button onClick={() => { setEditingCamp(camp.id); setEditBudget(camp.daily_budget) }}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, fontSize: '12px', fontFamily: F, fontWeight: 500, color: 'rgba(255,255,255,0.55)', cursor: 'pointer' }}>
                                تعديل الميزانية
                              </button>
                            )
                          )}

                          {camp.meta_campaign_id && (
                            <a href={`https://business.facebook.com/adsmanager/manage/campaigns?act=${camp.meta_campaign_id}`} target="_blank" rel="noopener noreferrer"
                              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, fontSize: '12px', fontFamily: F, color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>
                              عرض في Meta ←
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ملاحظة Meta */}
          <div style={{ marginTop: '24px', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" style={{ marginTop: 1, flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.75, fontFamily: F }}>
              تتزامن حالات الحملات من Meta كل ساعتين. <strong style={{ color: 'rgba(255,255,255,0.50)' }}>قيد المراجعة</strong> يعني أن Meta تفحص محتواك — عادةً دقائق إلى ساعات. <strong style={{ color: 'rgba(255,255,255,0.50)' }}>نشطة</strong> يعني أن إعلانك يعمل. في حالة الرفض، نيكسا تعرض السبب وتتيح التعديل وإعادة التقديم بدون مغادرة التطبيق.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// التصدير مع Suspense
// ══════════════════════════════════════════════════════════════
const F_FALLBACK = "'Tajawal', system-ui, sans-serif"
export default function AmplifyPageAr() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - var(--topbar-h))', flexDirection: 'column', gap: 14, background: '#0C0C0C' }}>
        <div className="nexa-spinner" style={{ width: 20, height: 20 }}/>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', fontFamily: F_FALLBACK }}>جاري التحميل…</div>
      </div>
    }>
      <AmplifyInner/>
    </Suspense>
  )
}
