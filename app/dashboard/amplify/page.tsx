'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Campaign {
  id: string
  name: string
  status: string
  daily_budget: number
  start_date: string
  end_date: string
  created_at: string
  insights?: { spend: number; reach: number; clicks: number; cpc: number }
}

interface ContentItem {
  id: string
  content: string
  image_url?: string
  platform?: string
  created_at?: string
}

const ctaOptions = ['Learn More', 'Shop Now', 'Sign Up', 'Get Quote', 'Book Now', 'Contact Us', 'Download']

const instagramPlacements = [
  { id:'ig_feed',    name:'Feed',    sub:'1:1 square · Most reach',  color:'#E1306C',
    icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg> },
  { id:'ig_stories', name:'Stories', sub:'9:16 fullscreen',          color:'#E1306C',
    icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="7" y="2" width="10" height="20" rx="3"/></svg> },
  { id:'ig_reels',   name:'Reels',   sub:'9:16 short video',         color:'#E1306C',
    icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/></svg> },
  { id:'ig_explore', name:'Explore', sub:'Discovery feed',           color:'#E1306C',
    icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
]

const facebookPlacements = [
  { id:'fb_feed',        name:'Feed',        sub:'Desktop + mobile',   color:'#0A66C2',
    icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> },
  { id:'fb_stories',     name:'Stories',     sub:'Facebook Stories',   color:'#0A66C2',
    icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="7" y="2" width="10" height="20" rx="3"/></svg> },
  { id:'fb_reels',       name:'Reels',       sub:'Facebook Reels',     color:'#0A66C2',
    icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/></svg> },
  { id:'fb_marketplace', name:'Marketplace', sub:'Shopping intent',    color:'#0A66C2',
    icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> },
]

const objectives = [
  { id:'OUTCOME_AWARENESS', name:'Awareness', desc:'Maximize reach',
    icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
  { id:'OUTCOME_TRAFFIC',   name:'Traffic',   desc:'Drive link clicks',
    icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg> },
  { id:'OUTCOME_LEADS',     name:'Leads',     desc:'Capture contact info',
    icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
]

const budgetPresets = [
  { val:10, label:'$10/day', reach:'800–2,200/day',   recommended:false },
  { val:20, label:'$20/day', reach:'1,800–4,500/day', recommended:true  },
  { val:50, label:'$50/day', reach:'4,200–10,000/day',recommended:false },
]

const estimatedReach: Record<number, { min:number; max:number }> = {
  10: { min:800,  max:2200  },
  20: { min:1800, max:4500  },
  50: { min:4200, max:10000 },
}

const STEPS = ['Creative', 'Placements', 'Objective', 'Audience', 'Budget', 'Review']

function PlacementCard({ p, selected, onToggle }: { p: typeof instagramPlacements[0]; selected: boolean; onToggle: () => void }) {
  const isIg = p.id.startsWith('ig')
  return (
    <div
      onClick={onToggle}
      style={{
        background: selected ? `rgba(${isIg ? '225,48,108' : '10,102,194'},0.06)` : '#0A0A0A',
        border: `1px solid ${selected ? p.color + '44' : 'rgba(255,255,255,0.07)'}`,
        borderRadius:9, padding:'12px 14px',
        cursor:'pointer', display:'flex', alignItems:'center', gap:10,
        transition:'all 0.15s',
      }}
    >
      <div style={{
        width:32, height:32, borderRadius:7,
        background: selected ? p.color + '18' : 'rgba(255,255,255,0.04)',
        display:'flex', alignItems:'center', justifyContent:'center',
        color: selected ? p.color : 'rgba(255,255,255,0.3)', flexShrink:0,
      }}>{p.icon}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:'var(--display)', fontSize:12, fontWeight:700, color: selected ? '#fff' : 'rgba(255,255,255,0.5)' }}>{p.name}</div>
        <div style={{ fontSize:10, color:'var(--t4)' }}>{p.sub}</div>
      </div>
      <div style={{
        width:16, height:16, borderRadius:'50%', flexShrink:0,
        background: selected ? p.color : 'transparent',
        border: `1.5px solid ${selected ? p.color : 'rgba(255,255,255,0.2)'}`,
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        {selected && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
      </div>
    </div>
  )
}

function AmplifyInner() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const boostContentId = searchParams.get('content_id')
  const isBoost = searchParams.get('boost') === 'true'
  const oauthConnected = searchParams.get('connected')
  const oauthError = searchParams.get('error')
  const oauthReason = searchParams.get('reason')

  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [connected, setConnected] = useState(false)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [brandProfile, setBrandProfile] = useState<Record<string, unknown> | null>(null)

  // Creator state
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null)
  const [adCopy, setAdCopy] = useState('')
  const [headline, setHeadline] = useState('')
  const [selectedCTA, setSelectedCTA] = useState('Learn More')
  const [selectedPlacements, setSelectedPlacements] = useState(['ig_feed', 'ig_stories', 'fb_feed'])
  const [selectedObjective, setSelectedObjective] = useState('OUTCOME_TRAFFIC')
  const [ageMin, setAgeMin] = useState(25)
  const [ageMax, setAgeMax] = useState(45)
  const [gender, setGender] = useState('ALL')
  const [locations, setLocations] = useState(['AE', 'SA'])
  const [locationInput, setLocationInput] = useState('')
  const [audienceTags, setAudienceTags] = useState<string[]>(['Entrepreneurs', 'Small business owners', 'Freelancers', 'Digital marketing', 'Content creation'])
  const [tagInput, setTagInput] = useState('')
  const [dailyBudget, setDailyBudget] = useState(20)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [launching, setLaunching] = useState(false)
  const [previewTab, setPreviewTab] = useState<'feed'|'story'|'reel'>('feed')
  const [recentContent, setRecentContent] = useState<ContentItem[]>([])
  const [connectError, setConnectError] = useState<string | null>(null)

  // Stats
  const totalSpend   = campaigns.reduce((sum, c) => sum + (c.insights?.spend  || 0), 0)
  const totalReach   = campaigns.reduce((sum, c) => sum + (c.insights?.reach  || 0), 0)
  const totalClicks  = campaigns.reduce((sum, c) => sum + (c.insights?.clicks || 0), 0)
  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length

  const days = endDate ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0
  const totalBudget = dailyBudget * days
  const reach = estimatedReach[dailyBudget] || { min: Math.round(dailyBudget * 80), max: Math.round(dailyBudget * 200) }

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [])

  useEffect(() => {
    if (oauthConnected === 'true') {
      loadData()
    }
    if (oauthError) {
      setConnectError(oauthError + (oauthReason ? ': ' + oauthReason : ''))
    }
  }, [oauthConnected, oauthError])

  useEffect(() => {
    if (isBoost && boostContentId) {
      setShowCreate(true)
      setCurrentStep(1)
      loadContentById(boostContentId)
    }
  }, [isBoost, boostContentId])

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

      const { data: connection } = await supabase
        .from('meta_connections')
        .select('id')
        .eq('workspace_id', member.workspace_id)
        .single()
      setConnected(!!connection)

      const { data: camps } = await supabase
        .from('amplify_campaigns')
        .select('*')
        .eq('workspace_id', member.workspace_id)
        .order('created_at', { ascending: false })

      const { data: workspace } = await supabase
        .from('workspaces')
        .select('brand_profile')
        .eq('id', member.workspace_id)
        .single()

      const bp = workspace?.brand_profile as Record<string, unknown> | null
      setBrandProfile(bp)
      const aud = bp?.audience as { interests?: string[] } | undefined
      if (aud?.interests?.length) setAudienceTags(aud.interests.slice(0, 8))

      // Load recent content
      const { data: content } = await supabase
        .from('content_items')
        .select('id, content, image_url, platform, created_at')
        .eq('workspace_id', member.workspace_id)
        .order('created_at', { ascending: false })
        .limit(6)
      if (content) setRecentContent(content)

      if (camps) {
        const campsWithInsights = await Promise.all(camps.map(async (camp) => {
          const { data: insights } = await supabase
            .from('amplify_insights')
            .select('spend, reach, clicks, cpc')
            .eq('campaign_id', camp.id)
            .order('date', { ascending: false })
            .limit(1)
            .single()
          return { ...camp, insights: insights || { spend:0, reach:0, clicks:0, cpc:0 } }
        }))
        setCampaigns(campsWithInsights)
      }
    } catch (e) {
      console.error('[Amplify] Load error:', e)
    } finally {
      setLoading(false)
    }
  }

  async function loadContentById(id: string) {
    try {
      const { data } = await supabase
        .from('content_items')
        .select('id, content, image_url, platform, created_at')
        .eq('id', id)
        .single()
      if (data) {
        setSelectedContent(data)
        setAdCopy(data.content?.slice(0, 125) || '')
      }
    } catch {}
  }

  function togglePlacement(id: string) {
    setSelectedPlacements(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  function nextStep() { if (currentStep < 6) setCurrentStep(s => s + 1) }
  function prevStep() { if (currentStep > 1) setCurrentStep(s => s - 1) }

  async function handleLaunch() {
    setLaunching(true)
    try {
      const res = await fetch('/api/amplify/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: headline || adCopy.slice(0, 40) || 'New Campaign',
          objective: selectedObjective,
          daily_budget: dailyBudget,
          start_date: startDate,
          end_date: endDate || null,
          content_id: selectedContent?.id || null,
          audience_snapshot: { interests: audienceTags, ageMin, ageMax, gender, locations },
          creative_snapshot: { adCopy, headline, cta: selectedCTA, placements: selectedPlacements },
        }),
      })
      if (res.ok) {
        setShowCreate(false)
        setCurrentStep(1)
        loadData()
      }
    } catch (e) {
      console.error('[Amplify] Launch error:', e)
    } finally {
      setLaunching(false)
    }
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - var(--topbar-h))', flexDirection:'column', gap:14, background:'#000' }}>
      <div className="nexa-spinner" style={{ width:20, height:20 }}/>
      <div style={{ fontSize:11, color:'var(--t4)', fontFamily:'var(--sans)', letterSpacing:'0.06em', textTransform:'uppercase' }}>Loading Amplify</div>
    </div>
  )

  return (
    <div style={{ padding:'24px', background:'#000', minHeight:'calc(100vh - var(--topbar-h))', opacity: mounted ? 1 : 0, transition:'opacity 0.3s ease' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'var(--display)', fontSize:24, fontWeight:800, letterSpacing:'-0.035em', color:'#fff', marginBottom:4 }}>Amplify</h1>
          <p style={{ fontSize:13, color:'var(--t4)', fontFamily:'var(--sans)' }}>Run Meta Ads from your Brand Brain — no agency, no confusion.</p>
        </div>
        <button
          onClick={() => { setShowCreate(!showCreate); if (!showCreate) setCurrentStep(1) }}
          style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'10px 20px', background:'var(--blue)', border:'none', borderRadius:8, fontFamily:'var(--display)', fontSize:13, fontWeight:700, color:'#fff', cursor:'pointer', boxShadow:'0 0 24px rgba(30,142,240,0.25)', letterSpacing:'-0.01em' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
          New campaign
        </button>
      </div>

      {/* Connect Meta banner */}
      {!connected && (
        <div style={{ background:'rgba(249,115,22,0.05)', border:'1px solid rgba(249,115,22,0.2)', borderRadius:12, padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:9, background:'rgba(249,115,22,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#F97316"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </div>
            <div>
              <div style={{ fontFamily:'var(--display)', fontSize:14, fontWeight:700, color:'#fff', marginBottom:2 }}>Connect your Meta account</div>
              <div style={{ fontSize:12, color:'var(--t4)' }}>Link your Facebook Business account to start running ads directly from Nexa</div>
            </div>
          </div>
          <button
            onClick={() => {
              const metaOAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.NEXT_PUBLIC_META_APP_ID}&redirect_uri=https%3A%2F%2Fnexaa.cc%2Fapi%2Fmeta%2Fconnect&scope=ads_management,ads_read,pages_read_engagement&response_type=code&state=${workspaceId}`
              window.open(metaOAuthUrl, '_blank')
            }}
            style={{ padding:'9px 18px', background:'#F97316', border:'none', borderRadius:7, fontFamily:'var(--display)', fontSize:12, fontWeight:700, color:'#fff', cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}
          >
            Connect Meta →
          </button>
        </div>
      )}
      {connectError && (
        <div style={{ marginTop:8, fontSize:12, color:'#FF5757', fontFamily:'var(--sans)' }}>
          {connectError}
        </div>
      )}

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        {[
          { label:'Total spent',      value: campaigns.length ? `$${totalSpend.toFixed(0)}`  : '—', sub:'This month',    sc:'var(--blue)' },
          { label:'People reached',   value: campaigns.length ? (totalReach >= 1000 ? `${(totalReach/1000).toFixed(1)}k` : String(totalReach)) : '—', sub:'Last 30 days', sc:'#22C55E' },
          { label:'Link clicks',      value: campaigns.length ? String(totalClicks) : '—', sub: campaigns.length && totalClicks > 0 ? `Avg $${(totalSpend/totalClicks).toFixed(2)} CPC` : 'No data yet', sc:'var(--blue2)' },
          { label:'Active campaigns', value: String(activeCampaigns), sub:`${campaigns.length - activeCampaigns} paused`, sc:'#FB923C' },
        ].map((s, i) => (
          <div key={i} style={{ background:'#0A0A0A', border:'1px solid var(--line)', borderRadius:10, padding:'14px 16px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', bottom:0, left:0, right:0, height:1, background:s.sc, opacity:0.25 }}/>
            <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase' as const, color:'var(--t4)', marginBottom:7, fontFamily:'var(--sans)' }}>{s.label}</div>
            <div style={{ fontFamily:'var(--mono)', fontSize:24, fontWeight:300, color:'#fff', letterSpacing:'-0.04em', lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:10, color:'var(--t4)', marginTop:5, fontFamily:'var(--sans)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Campaign creator — 2 col layout */}
      {showCreate && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:16, marginBottom:20 }}>

          {/* LEFT — Step editor */}
          <div style={{ background:'#0A0A0A', border:'1px solid rgba(30,142,240,0.18)', borderRadius:12, padding:20, boxShadow:'0 0 40px rgba(30,142,240,0.05)' }}>

            {/* Step indicator */}
            <div style={{ display:'flex', gap:4, marginBottom:20 }}>
              {STEPS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i + 1)}
                  style={{
                    flex:1, padding:'6px 0',
                    background: currentStep === i + 1 ? 'var(--blue)' : currentStep > i + 1 ? 'rgba(30,142,240,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${currentStep === i + 1 ? 'var(--blue)' : currentStep > i + 1 ? 'rgba(30,142,240,0.3)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius:6, cursor:'pointer',
                    fontFamily:'var(--sans)', fontSize:10, fontWeight:600,
                    color: currentStep === i + 1 ? '#fff' : currentStep > i + 1 ? 'var(--blue2)' : 'var(--t4)',
                    letterSpacing:'0.02em',
                    transition:'all 0.15s',
                  }}
                >{s}</button>
              ))}
            </div>

            {/* STEP 1 — Creative */}
            {currentStep === 1 && (
              <div>
                <div style={{ fontSize:9.5, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase' as const, color:'var(--t4)', fontFamily:'var(--sans)', marginBottom:14 }}>Step 1 · Creative</div>

                {/* Pick from content library */}
                {recentContent.length > 0 && (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:11, color:'var(--t4)', fontFamily:'var(--sans)', marginBottom:8 }}>Pick from your content library</div>
                    <div style={{ display:'flex', gap:8, overflowX:'auto' as const, paddingBottom:4 }}>
                      {recentContent.map(c => (
                        <div
                          key={c.id}
                          onClick={() => { setSelectedContent(c); setAdCopy(c.content?.slice(0, 125) || '') }}
                          style={{
                            flexShrink:0, width:80, height:80, borderRadius:8, cursor:'pointer',
                            background:'rgba(255,255,255,0.04)',
                            border: `1px solid ${selectedContent?.id === c.id ? 'rgba(30,142,240,0.5)' : 'rgba(255,255,255,0.08)'}`,
                            overflow:'hidden', position:'relative',
                            display:'flex', alignItems:'center', justifyContent:'center',
                          }}
                        >
                          {c.image_url
                            ? <img src={c.image_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="" />
                            : <div style={{ fontSize:9, color:'var(--t4)', padding:6, textAlign:'center', lineHeight:1.4, fontFamily:'var(--sans)' }}>{c.content?.slice(0, 40)}</div>
                          }
                          {selectedContent?.id === c.id && (
                            <div style={{ position:'absolute', inset:0, background:'rgba(30,142,240,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4DABF7" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ad copy */}
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, color:'var(--t4)', fontFamily:'var(--sans)', marginBottom:6 }}>Primary text</div>
                  <div style={{ position:'relative' }}>
                    <textarea
                      value={adCopy}
                      onChange={e => setAdCopy(e.target.value)}
                      placeholder="Write your ad copy in your brand voice..."
                      style={{ width:'100%', background:'#0A0A0A', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, padding:'12px 14px', fontSize:14, color:'#fff', fontFamily:'var(--sans)', lineHeight:1.75, minHeight:120, resize:'none', outline:'none', boxSizing:'border-box' as const }}
                    />
                    <div style={{ position:'absolute', bottom:10, right:12, fontSize:10, color: adCopy.length > 125 ? '#FF5757' : 'var(--t4)', fontFamily:'var(--mono)', fontWeight:300 }}>{adCopy.length}/125</div>
                  </div>
                </div>

                {/* Headline */}
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, color:'var(--t4)', fontFamily:'var(--sans)', marginBottom:6 }}>Headline</div>
                  <div style={{ position:'relative' }}>
                    <input
                      value={headline}
                      onChange={e => setHeadline(e.target.value)}
                      placeholder="Short, punchy headline..."
                      style={{ width:'100%', background:'#0A0A0A', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, padding:'10px 48px 10px 14px', fontSize:13, color:'#fff', fontFamily:'var(--sans)', outline:'none', boxSizing:'border-box' as const }}
                    />
                    <div style={{ position:'absolute', top:'50%', right:12, transform:'translateY(-50%)', fontSize:10, color: headline.length > 40 ? '#FF5757' : 'var(--t4)', fontFamily:'var(--mono)', fontWeight:300 }}>{headline.length}/40</div>
                  </div>
                </div>

                {/* CTA */}
                <div>
                  <div style={{ fontSize:11, color:'var(--t4)', fontFamily:'var(--sans)', marginBottom:8 }}>CTA button</div>
                  <div style={{ display:'flex', flexWrap:'wrap' as const, gap:6 }}>
                    {ctaOptions.map(cta => (
                      <button
                        key={cta}
                        onClick={() => setSelectedCTA(cta)}
                        style={{ padding:'5px 12px', background: selectedCTA === cta ? 'var(--blue)' : 'rgba(255,255,255,0.05)', border: `1px solid ${selectedCTA === cta ? 'var(--blue)' : 'rgba(255,255,255,0.1)'}`, borderRadius:6, fontSize:11, fontWeight:600, color: selectedCTA === cta ? '#fff' : 'var(--t3)', cursor:'pointer', fontFamily:'var(--sans)', transition:'all 0.15s' }}
                      >{cta}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 — Placements */}
            {currentStep === 2 && (
              <div>
                <div style={{ fontSize:9.5, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase' as const, color:'var(--t4)', fontFamily:'var(--sans)', marginBottom:14 }}>Step 2 · Placements</div>

                <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontFamily:'var(--sans)', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                  Instagram
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
                  {instagramPlacements.map(p => (
                    <PlacementCard key={p.id} p={p} selected={selectedPlacements.includes(p.id)} onToggle={() => togglePlacement(p.id)} />
                  ))}
                </div>

                <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontFamily:'var(--sans)', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0A66C2" strokeWidth="1.5" strokeLinecap="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                  Facebook
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {facebookPlacements.map(p => (
                    <PlacementCard key={p.id} p={p} selected={selectedPlacements.includes(p.id)} onToggle={() => togglePlacement(p.id)} />
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3 — Objective */}
            {currentStep === 3 && (
              <div>
                <div style={{ fontSize:9.5, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase' as const, color:'var(--t4)', fontFamily:'var(--sans)', marginBottom:14 }}>Step 3 · Objective</div>
                <div style={{ display:'flex', flexDirection:'column' as const, gap:8 }}>
                  {objectives.map(obj => (
                    <div
                      key={obj.id}
                      onClick={() => setSelectedObjective(obj.id)}
                      style={{
                        background: selectedObjective === obj.id ? 'rgba(30,142,240,0.07)' : '#0A0A0A',
                        border: `1px solid ${selectedObjective === obj.id ? 'rgba(30,142,240,0.3)' : 'rgba(255,255,255,0.07)'}`,
                        borderRadius:10, padding:'14px 16px',
                        cursor:'pointer', display:'flex', alignItems:'center', gap:12,
                        transition:'all 0.15s',
                      }}
                    >
                      <div style={{ width:40, height:40, borderRadius:9, background: selectedObjective === obj.id ? 'rgba(30,142,240,0.12)' : 'rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center', color: selectedObjective === obj.id ? 'var(--blue)' : 'rgba(255,255,255,0.3)', flexShrink:0 }}>
                        {obj.icon}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:'var(--display)', fontSize:14, fontWeight:700, color: selectedObjective === obj.id ? '#fff' : 'rgba(255,255,255,0.6)', marginBottom:2 }}>{obj.name}</div>
                        <div style={{ fontSize:12, color:'var(--t4)', fontFamily:'var(--sans)' }}>{obj.desc}</div>
                      </div>
                      <div style={{ width:18, height:18, borderRadius:'50%', background: selectedObjective === obj.id ? 'var(--blue)' : 'transparent', border: `1.5px solid ${selectedObjective === obj.id ? 'var(--blue)' : 'rgba(255,255,255,0.2)'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        {selectedObjective === obj.id && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4 — Audience */}
            {currentStep === 4 && (
              <div>
                <div style={{ fontSize:9.5, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase' as const, color:'var(--t4)', fontFamily:'var(--sans)', marginBottom:14 }}>Step 4 · Audience</div>

                {/* Brand Brain tags */}
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:11, color:'var(--t4)', fontFamily:'var(--sans)', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4DABF7" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                    Interests — auto-built by Brand Brain
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap' as const, gap:6, marginBottom:8 }}>
                    {audienceTags.map((tag, i) => (
                      <span
                        key={i}
                        onClick={() => setAudienceTags(prev => prev.filter((_, j) => j !== i))}
                        style={{ padding:'4px 10px', background:'rgba(30,142,240,0.08)', border:'1px solid rgba(30,142,240,0.18)', borderRadius:5, fontSize:11, fontWeight:500, color:'var(--blue2)', fontFamily:'var(--sans)', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}
                      >
                        {tag}
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </span>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <input
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && tagInput.trim()) { setAudienceTags(prev => [...prev, tagInput.trim()]); setTagInput('') } }}
                      placeholder="Add interest..."
                      style={{ flex:1, background:'#0A0A0A', border:'1px solid rgba(255,255,255,0.1)', borderRadius:7, padding:'7px 10px', fontSize:12, color:'#fff', fontFamily:'var(--sans)', outline:'none' }}
                    />
                    <button onClick={() => { if (tagInput.trim()) { setAudienceTags(prev => [...prev, tagInput.trim()]); setTagInput('') } }} style={{ padding:'7px 12px', background:'rgba(30,142,240,0.1)', border:'1px solid rgba(30,142,240,0.2)', borderRadius:7, fontSize:12, color:'var(--blue2)', cursor:'pointer', fontFamily:'var(--sans)' }}>Add</button>
                  </div>
                </div>

                {/* Age range */}
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:11, color:'var(--t4)', fontFamily:'var(--sans)', marginBottom:8 }}>Age range</div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:300, color:'#fff' }}>{ageMin}</span>
                    <span style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:300, color:'#fff' }}>{ageMax}</span>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:10, color:'var(--t4)', fontFamily:'var(--sans)', marginBottom:4 }}>Min</div>
                      <input type="range" min={18} max={65} value={ageMin} onChange={e => setAgeMin(Number(e.target.value))} style={{ width:'100%', accentColor:'var(--blue)' }} />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:10, color:'var(--t4)', fontFamily:'var(--sans)', marginBottom:4 }}>Max</div>
                      <input type="range" min={18} max={65} value={ageMax} onChange={e => setAgeMax(Number(e.target.value))} style={{ width:'100%', accentColor:'var(--blue)' }} />
                    </div>
                  </div>
                </div>

                {/* Gender */}
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:11, color:'var(--t4)', fontFamily:'var(--sans)', marginBottom:8 }}>Gender</div>
                  <div style={{ display:'flex', gap:6 }}>
                    {['ALL','MEN','WOMEN'].map(g => (
                      <button key={g} onClick={() => setGender(g)} style={{ flex:1, padding:'7px', background: gender === g ? 'rgba(30,142,240,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${gender === g ? 'rgba(30,142,240,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius:7, fontSize:12, fontWeight:600, color: gender === g ? 'var(--blue2)' : 'var(--t4)', cursor:'pointer', fontFamily:'var(--sans)', transition:'all 0.15s' }}>{g === 'ALL' ? 'All' : g === 'MEN' ? 'Men' : 'Women'}</button>
                    ))}
                  </div>
                </div>

                {/* Locations */}
                <div>
                  <div style={{ fontSize:11, color:'var(--t4)', fontFamily:'var(--sans)', marginBottom:8 }}>Locations</div>
                  <div style={{ display:'flex', flexWrap:'wrap' as const, gap:6, marginBottom:8 }}>
                    {locations.map((loc, i) => (
                      <span key={i} onClick={() => setLocations(prev => prev.filter((_, j) => j !== i))} style={{ padding:'4px 10px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:5, fontSize:11, fontWeight:600, color:'#fff', fontFamily:'var(--mono)', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                        {loc}
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </span>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <input value={locationInput} onChange={e => setLocationInput(e.target.value.toUpperCase())} onKeyDown={e => { if (e.key === 'Enter' && locationInput.trim()) { setLocations(prev => [...prev, locationInput.trim()]); setLocationInput('') } }} placeholder="Country code (e.g. US)" style={{ flex:1, background:'#0A0A0A', border:'1px solid rgba(255,255,255,0.1)', borderRadius:7, padding:'7px 10px', fontSize:12, color:'#fff', fontFamily:'var(--mono)', outline:'none' }} />
                    <button onClick={() => { if (locationInput.trim()) { setLocations(prev => [...prev, locationInput.trim()]); setLocationInput('') } }} style={{ padding:'7px 12px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:7, fontSize:12, color:'var(--t3)', cursor:'pointer', fontFamily:'var(--sans)' }}>Add</button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5 — Budget */}
            {currentStep === 5 && (
              <div>
                <div style={{ fontSize:9.5, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase' as const, color:'var(--t4)', fontFamily:'var(--sans)', marginBottom:14 }}>Step 5 · Budget & Schedule</div>

                <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                  {budgetPresets.map(b => (
                    <div
                      key={b.val}
                      onClick={() => setDailyBudget(b.val)}
                      style={{ flex:1, background: dailyBudget === b.val ? 'rgba(30,142,240,0.08)' : '#0A0A0A', border: `1px solid ${dailyBudget === b.val ? 'rgba(30,142,240,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius:10, padding:'12px 14px', cursor:'pointer', transition:'all 0.15s', position:'relative' as const }}
                    >
                      {b.recommended && <div style={{ position:'absolute', top:-8, left:'50%', transform:'translateX(-50%)', background:'var(--blue)', borderRadius:4, padding:'2px 6px', fontSize:9, fontWeight:700, color:'#fff', fontFamily:'var(--sans)', whiteSpace:'nowrap' as const }}>Recommended</div>}
                      <div style={{ fontFamily:'var(--display)', fontSize:16, fontWeight:800, color: dailyBudget === b.val ? '#fff' : 'rgba(255,255,255,0.6)', marginBottom:4 }}>{b.label}</div>
                      <div style={{ fontSize:10, color:'var(--t4)', fontFamily:'var(--sans)' }}>{b.reach}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                  <div>
                    <div style={{ fontSize:11, color:'var(--t4)', fontFamily:'var(--sans)', marginBottom:6 }}>Start date</div>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width:'100%', background:'#0A0A0A', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'9px 12px', fontSize:13, color:'#fff', fontFamily:'var(--sans)', outline:'none', boxSizing:'border-box' as const, colorScheme:'dark' as const }} />
                  </div>
                  <div>
                    <div style={{ fontSize:11, color:'var(--t4)', fontFamily:'var(--sans)', marginBottom:6 }}>End date</div>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width:'100%', background:'#0A0A0A', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'9px 12px', fontSize:13, color:'#fff', fontFamily:'var(--sans)', outline:'none', boxSizing:'border-box' as const, colorScheme:'dark' as const }} />
                  </div>
                </div>

                {days > 0 && (
                  <div style={{ background:'rgba(30,142,240,0.05)', border:'1px solid rgba(30,142,240,0.12)', borderRadius:9, padding:'12px 14px' }}>
                    <div style={{ fontFamily:'var(--mono)', fontSize:18, fontWeight:300, color:'#fff', letterSpacing:'-0.03em' }}>${totalBudget}</div>
                    <div style={{ fontSize:11, color:'var(--t4)', fontFamily:'var(--sans)', marginTop:2 }}>Total budget over {days} days · ${dailyBudget}/day</div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 6 — Review */}
            {currentStep === 6 && (
              <div>
                <div style={{ fontSize:9.5, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase' as const, color:'var(--t4)', fontFamily:'var(--sans)', marginBottom:14 }}>Step 6 · Review & Launch</div>

                <div style={{ display:'flex', flexDirection:'column' as const, gap:10, marginBottom:16 }}>
                  {[
                    { label:'Ad copy', value: adCopy ? `${adCopy.slice(0, 60)}${adCopy.length > 60 ? '…' : ''}` : '—' },
                    { label:'Headline', value: headline || '—' },
                    { label:'CTA', value: selectedCTA },
                    { label:'Objective', value: objectives.find(o => o.id === selectedObjective)?.name || selectedObjective },
                    { label:'Placements', value: selectedPlacements.length + ' selected' },
                    { label:'Audience', value: `${audienceTags.slice(0,2).join(', ')}${audienceTags.length > 2 ? ` +${audienceTags.length - 2} more` : ''}` },
                    { label:'Budget', value: `$${dailyBudget}/day${days > 0 ? ` · $${totalBudget} total` : ''}` },
                    { label:'Est. reach/day', value: `${reach.min.toLocaleString()}–${reach.max.toLocaleString()}` },
                  ].map((row, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', paddingBottom:10, borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize:11, color:'var(--t4)', fontFamily:'var(--sans)' }}>{row.label}</div>
                      <div style={{ fontSize:12, color:'#fff', fontFamily:'var(--sans)', fontWeight:500, textAlign:'right', maxWidth:'60%' }}>{row.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize:11, color: connected ? '#4ADE80' : '#F97316', fontFamily:'var(--sans)', marginBottom:14, display:'flex', alignItems:'center', gap:6 }}>
                  {connected
                    ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>Meta account connected</>
                    : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>Connect Meta to launch</>
                  }
                </div>

                <button
                  onClick={handleLaunch}
                  disabled={launching || !connected}
                  style={{ width:'100%', padding:'14px', background: (launching || !connected) ? 'rgba(30,142,240,0.4)' : 'var(--blue)', border:'none', borderRadius:9, fontFamily:'var(--display)', fontSize:15, fontWeight:800, color:'#fff', cursor: (launching || !connected) ? 'not-allowed' : 'pointer', letterSpacing:'-0.02em', boxShadow:'0 0 32px rgba(30,142,240,0.3)', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
                >
                  {launching ? (
                    <><div className="nexa-spinner" style={{ width:16, height:16 }}/>Launching campaign...</>
                  ) : (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>Launch on Meta →</>
                  )}
                </button>
              </div>
            )}

            {/* Step nav */}
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:24, paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display:'flex', gap:8 }}>
                {currentStep > 1 && (
                  <button onClick={prevStep} style={{ padding:'9px 20px', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, fontFamily:'var(--display)', fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.5)', cursor:'pointer' }}>← Back</button>
                )}
                <button onClick={() => setShowCreate(false)} style={{ padding:'9px 16px', background:'transparent', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, fontFamily:'var(--sans)', fontSize:12, color:'var(--t4)', cursor:'pointer' }}>Cancel</button>
              </div>
              {currentStep < 6 && (
                <button onClick={nextStep} style={{ padding:'9px 20px', background:'var(--blue)', border:'none', borderRadius:8, fontFamily:'var(--display)', fontSize:13, fontWeight:700, color:'#fff', cursor:'pointer' }}>Continue →</button>
              )}
            </div>
          </div>

          {/* RIGHT — Live preview */}
          <div>
            {/* Preview tab switcher */}
            <div style={{ display:'flex', gap:4, marginBottom:12 }}>
              {(['feed','story','reel'] as const).map(tab => (
                <button key={tab} onClick={() => setPreviewTab(tab)} style={{ flex:1, padding:'6px 0', background: previewTab === tab ? 'rgba(255,255,255,0.08)' : 'transparent', border: `1px solid ${previewTab === tab ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}`, borderRadius:6, fontFamily:'var(--sans)', fontSize:11, fontWeight:600, color: previewTab === tab ? '#fff' : 'var(--t4)', cursor:'pointer', textTransform:'capitalize' as const, transition:'all 0.15s' }}>{tab}</button>
              ))}
            </div>

            {/* Feed preview */}
            {previewTab === 'feed' && (
              <div style={{ background:'#111', borderRadius:16, overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ padding:'10px 12px', display:'flex', alignItems:'center', gap:8, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0, color:'#fff' }}>A</div>
                  <div>
                    <div style={{ fontSize:11, fontWeight:600, color:'#fff' }}>your_brand</div>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)' }}>Sponsored</div>
                  </div>
                  <div style={{ marginLeft:'auto', fontSize:16, color:'rgba(255,255,255,0.4)', letterSpacing:'0.05em' }}>···</div>
                </div>
                <div style={{ width:'100%', aspectRatio:'1', background:'linear-gradient(135deg,#050510,#07071A,#0A0720)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:-40, left:-20, width:200, height:150, borderRadius:'50%', background:'#5B21B6', filter:'blur(60px)', opacity:.25 }}/>
                  <div style={{ position:'absolute', top:-10, right:-30, width:160, height:120, borderRadius:'50%', background:'#C2410C', filter:'blur(60px)', opacity:.18 }}/>
                  {selectedContent?.image_url ? (
                    <img src={selectedContent.image_url} style={{ width:'100%', height:'100%', objectFit:'cover', position:'absolute', inset:0 }} alt="" />
                  ) : (
                    <div style={{ position:'relative', zIndex:1, fontFamily:'var(--display)', fontSize:16, fontWeight:800, color:'#fff', textAlign:'center', padding:16, letterSpacing:'-0.03em', lineHeight:1.2 }}>
                      {adCopy?.slice(0, 60) || 'Your ad copy appears here'}
                    </div>
                  )}
                </div>
                <div style={{ padding:'8px 12px', display:'flex', gap:12 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </div>
                <div style={{ padding:'0 12px 8px', fontSize:11, color:'rgba(255,255,255,0.75)', lineHeight:1.5 }}>
                  <strong>your_brand</strong> {adCopy?.slice(0, 100) || 'Ad copy preview'}
                </div>
                <div style={{ margin:'0 12px 12px', padding:'8px', background:'var(--blue)', borderRadius:6, fontSize:11, fontWeight:600, textAlign:'center' as const, color:'#fff', fontFamily:'var(--display)' }}>
                  {selectedCTA}
                </div>
              </div>
            )}

            {/* Story preview */}
            {previewTab === 'story' && (
              <div style={{ background:'#111', borderRadius:16, overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ width:'100%', aspectRatio:'9/16', background:'linear-gradient(180deg,#050510,#07071A)', position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ position:'absolute', top:10, left:10, right:10, display:'flex', gap:3 }}>
                    {[1,2,3].map(i => <div key={i} style={{ height:2, borderRadius:1, background: i===2 ? '#fff' : 'rgba(255,255,255,0.3)', flex:1 }}/>)}
                  </div>
                  <div style={{ position:'absolute', top:22, left:12, right:12, display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:24, height:24, borderRadius:'50%', background:'linear-gradient(45deg,#f09433,#dc2743)', flexShrink:0 }}/>
                    <div style={{ fontSize:10, fontWeight:600, color:'#fff' }}>your_brand</div>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.5)', marginLeft:2 }}>· Sponsored</div>
                  </div>
                  <div style={{ position:'absolute', top:-60, left:-30, width:200, height:200, borderRadius:'50%', background:'#5B21B6', filter:'blur(70px)', opacity:.3 }}/>
                  <div style={{ position:'absolute', bottom:-40, right:-20, width:160, height:160, borderRadius:'50%', background:'#C2410C', filter:'blur(60px)', opacity:.25 }}/>
                  <div style={{ position:'relative', zIndex:1, fontFamily:'var(--display)', fontSize:20, fontWeight:800, color:'#fff', textAlign:'center' as const, padding:20, letterSpacing:'-0.03em', lineHeight:1.2 }}>
                    {adCopy?.slice(0, 60) || 'Your ad copy'}
                  </div>
                  <div style={{ position:'absolute', bottom:16, left:16, right:16 }}>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.5)', textAlign:'center' as const, marginBottom:6 }}>Swipe up</div>
                    <div style={{ background:'#fff', color:'#000', padding:9, borderRadius:8, fontFamily:'var(--display)', fontSize:12, fontWeight:700, textAlign:'center' as const }}>{selectedCTA}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Reel preview */}
            {previewTab === 'reel' && (
              <div style={{ background:'#111', borderRadius:16, overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ width:'100%', aspectRatio:'9/16', background:'linear-gradient(180deg,#07071A,#0A0720)', position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.3)' }}/>
                  <div style={{ position:'absolute', top:-40, right:-20, width:180, height:180, borderRadius:'50%', background:'#C2410C', filter:'blur(60px)', opacity:.25 }}/>
                  <div style={{ position:'relative', zIndex:1, width:48, height:48, borderRadius:'50%', background:'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid rgba(255,255,255,0.3)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)" stroke="none"><polygon points="10 8 16 12 10 16 10 8"/></svg>
                  </div>
                  <div style={{ position:'absolute', bottom:60, left:12, right:50 }}>
                    <div style={{ fontFamily:'var(--display)', fontSize:13, fontWeight:700, color:'#fff', marginBottom:4 }}>your_brand · <span style={{ fontWeight:400, opacity:.6 }}>Sponsored</span></div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.8)', lineHeight:1.4, fontFamily:'var(--sans)' }}>{adCopy?.slice(0, 80) || 'Reel ad copy preview'}</div>
                  </div>
                  <div style={{ position:'absolute', bottom:16, left:12, right:12 }}>
                    <div style={{ background:'var(--blue)', color:'#fff', padding:'8px', borderRadius:8, fontFamily:'var(--display)', fontSize:12, fontWeight:700, textAlign:'center' as const }}>{selectedCTA}</div>
                  </div>
                  <div style={{ position:'absolute', right:12, bottom:120, display:'flex', flexDirection:'column' as const, gap:16, alignItems:'center' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </div>
                </div>
              </div>
            )}

            {/* Estimated performance */}
            <div style={{ marginTop:10, background:'#0A0A0A', border:'1px solid var(--line)', borderRadius:10, padding:'12px 14px' }}>
              <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase' as const, color:'var(--t4)', fontFamily:'var(--sans)', marginBottom:8 }}>Estimated daily reach</div>
              <div style={{ fontFamily:'var(--mono)', fontSize:18, fontWeight:300, color:'#fff', letterSpacing:'-0.03em' }}>
                {reach.min.toLocaleString()}–{reach.max.toLocaleString()}
              </div>
              <div style={{ fontSize:10, color:'var(--t4)', marginTop:3, fontFamily:'var(--sans)' }}>people · at ${dailyBudget}/day</div>
            </div>

            {/* Brand Brain insight */}
            <div style={{ marginTop:8, background:'rgba(30,142,240,0.04)', border:'1px solid rgba(30,142,240,0.12)', borderRadius:10, padding:'12px 14px', display:'flex', gap:10, alignItems:'flex-start' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4DABF7" strokeWidth="2.5" strokeLinecap="round" style={{ marginTop:1, flexShrink:0 }}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              <div style={{ fontSize:11, color:'var(--t3)', lineHeight:1.6, fontFamily:'var(--sans)' }}>
                <strong style={{ color:'#fff' }}>Brand Brain:</strong> This content matches your top-performing organic posts. High potential for paid amplification.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns list */}
      <div style={{ marginBottom:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:9.5, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase' as const, color:'var(--t4)', fontFamily:'var(--sans)' }}>Campaigns</div>
        <div style={{ fontSize:12, color:'var(--blue2)', fontFamily:'var(--sans)' }}>{campaigns.length} total</div>
      </div>

      {campaigns.length === 0 ? (
        <div style={{ background:'#0A0A0A', border:'1px solid var(--line)', borderRadius:12, padding:'48px 24px', textAlign:'center' as const }}>
          <div style={{ width:48, height:48, borderRadius:12, background:'rgba(249,115,22,0.08)', border:'1px solid rgba(249,115,22,0.16)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
          </div>
          <div style={{ fontFamily:'var(--display)', fontSize:18, fontWeight:700, color:'#fff', letterSpacing:'-0.02em', marginBottom:8 }}>No campaigns yet</div>
          <div style={{ fontSize:14, color:'var(--t4)', lineHeight:1.75, maxWidth:360, margin:'0 auto 20px', fontFamily:'var(--sans)' }}>
            Create your first Meta Ad campaign. Brand Brain builds the audience, writes the copy, and generates the creative automatically.
          </div>
          <button onClick={() => setShowCreate(true)} style={{ padding:'11px 24px', background:'var(--blue)', border:'none', borderRadius:8, fontFamily:'var(--display)', fontSize:13, fontWeight:700, color:'#fff', cursor:'pointer', letterSpacing:'-0.01em', boxShadow:'0 0 24px rgba(30,142,240,0.25)' }}>
            Create first campaign →
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column' as const, gap:8 }}>
          {campaigns.map((camp) => (
            <div key={camp.id} style={{ background:'#0A0A0A', border:'1px solid var(--line)', borderRadius:12, padding:'14px 18px', display:'flex', alignItems:'center', gap:14, cursor:'pointer', transition:'all 0.2s', position:'relative', overflow:'hidden' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', flexShrink:0, background: camp.status === 'ACTIVE' ? '#22C55E' : '#F59E0B' }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:'var(--display)', fontSize:13, fontWeight:700, color:'#fff', letterSpacing:'-0.01em', marginBottom:2 }}>{camp.name}</div>
                <div style={{ fontSize:11, color:'var(--t4)', fontFamily:'var(--sans)' }}>${camp.daily_budget}/day · {camp.start_date ? new Date(camp.start_date).toLocaleDateString('en-US', {month:'short', day:'numeric'}) : 'No date'}</div>
              </div>
              <div style={{ padding:'3px 8px', borderRadius:5, background: camp.status === 'ACTIVE' ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${camp.status === 'ACTIVE' ? 'rgba(34,197,94,0.16)' : 'rgba(245,158,11,0.16)'}`, fontSize:10, fontWeight:600, color: camp.status === 'ACTIVE' ? '#4ADE80' : '#FBB040', fontFamily:'var(--sans)' }}>
                {camp.status === 'ACTIVE' ? 'Active' : 'Paused'}
              </div>
              <div style={{ display:'flex', gap:16, marginLeft:'auto' }}>
                {[
                  { val:`$${(camp.insights?.spend || 0).toFixed(0)}`, lbl:'Spent' },
                  { val: camp.insights?.reach ? (camp.insights.reach >= 1000 ? `${(camp.insights.reach/1000).toFixed(1)}k` : String(camp.insights.reach)) : '—', lbl:'Reached' },
                  { val: camp.insights?.cpc ? `$${camp.insights.cpc.toFixed(2)}` : '—', lbl:'CPC' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign:'right' as const }}>
                    <div style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:300, color:'#fff', letterSpacing:'-0.03em' }}>{s.val}</div>
                    <div style={{ fontSize:9, color:'var(--t5)', textTransform:'uppercase' as const, letterSpacing:'0.08em', fontFamily:'var(--sans)' }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ))}
        </div>
      )}

      {/* Meta App Review notice */}
      <div style={{ marginTop:20, padding:'14px 16px', background:'rgba(255,255,255,0.02)', border:'1px solid var(--line)', borderRadius:10, display:'flex', gap:10, alignItems:'flex-start' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth="1.5" strokeLinecap="round" style={{ marginTop:1, flexShrink:0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div style={{ fontSize:12, color:'var(--t4)', lineHeight:1.65, fontFamily:'var(--sans)' }}>
          Amplify requires Meta App Review for full ads_management access. During review, you can test with your own ad account. <span style={{ color:'var(--blue2)', cursor:'pointer' }}>Learn more →</span>
        </div>
      </div>
    </div>
  )
}

export default function AmplifyPage() {
  return (
    <Suspense fallback={
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - var(--topbar-h))', flexDirection:'column', gap:14, background:'#000' }}>
        <div className="nexa-spinner" style={{ width:20, height:20 }}/>
        <div style={{ fontSize:11, color:'var(--t4)', fontFamily:'var(--sans)', letterSpacing:'0.06em', textTransform:'uppercase' }}>Loading Amplify</div>
      </div>
    }>
      <AmplifyInner />
    </Suspense>
  )
}
