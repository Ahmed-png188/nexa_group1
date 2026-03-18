'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Campaign {
  id: string
  name: string
  status: string
  daily_budget: number
  start_date: string
  end_date: string
  created_at: string
  insights?: {
    spend: number
    reach: number
    clicks: number
    cpc: number
  }
}

export default function AmplifyPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [connected, setConnected] = useState(false)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [brandProfile, setBrandProfile] = useState<Record<string, unknown> | null>(null)

  // Stats
  const totalSpend = campaigns.reduce((sum, c) => sum + (c.insights?.spend || 0), 0)
  const totalReach = campaigns.reduce((sum, c) => sum + (c.insights?.reach || 0), 0)
  const totalClicks = campaigns.reduce((sum, c) => sum + (c.insights?.clicks || 0), 0)
  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length

  useEffect(() => {
    setMounted(true)
    loadData()
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

      // Check Meta connection
      const { data: connection } = await supabase
        .from('meta_connections')
        .select('id')
        .eq('workspace_id', member.workspace_id)
        .single()

      setConnected(!!connection)

      // Load campaigns
      const { data: camps } = await supabase
        .from('amplify_campaigns')
        .select('*')
        .eq('workspace_id', member.workspace_id)
        .order('created_at', { ascending: false })

      // Load brand profile for audience auto-build
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('brand_profile')
        .eq('id', member.workspace_id)
        .single()

      setBrandProfile(workspace?.brand_profile ?? null)

      // Load insights for each campaign
      if (camps) {
        const campsWithInsights = await Promise.all(camps.map(async (camp) => {
          const { data: insights } = await supabase
            .from('amplify_insights')
            .select('spend, reach, clicks, cpc')
            .eq('campaign_id', camp.id)
            .order('date', { ascending: false })
            .limit(1)
            .single()
          return { ...camp, insights: insights || { spend: 0, reach: 0, clicks: 0, cpc: 0 } }
        }))
        setCampaigns(campsWithInsights)
      }
    } catch (e) {
      console.error('[Amplify] Load error:', e)
    } finally {
      setLoading(false)
    }
  }

  // Extract audience tags from brand profile
  const audience = brandProfile?.audience as { interests?: string[] } | undefined
  const audienceTags = audience?.interests?.slice(0, 5) ||
    ['Entrepreneurs', 'Small business owners', 'Freelancers', 'Digital marketing', 'Content creation']

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - var(--topbar-h))', flexDirection:'column', gap:14, background:'#000' }}>
      <div className="nexa-spinner" style={{ width:20, height:20 }}/>
      <div style={{ fontSize:11, color:'var(--t4)', fontFamily:'var(--sans)', letterSpacing:'0.06em', textTransform:'uppercase' }}>Loading Amplify</div>
    </div>
  )

  return (
    <div style={{
      padding: '24px',
      background: '#000',
      minHeight: 'calc(100vh - var(--topbar-h))',
      opacity: mounted ? 1 : 0,
      transition: 'opacity 0.3s ease',
    }}>

      {/* Page header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--display)',
            fontSize: 24, fontWeight: 800,
            letterSpacing: '-0.035em',
            color: '#fff', marginBottom: 4
          }}>Amplify</h1>
          <p style={{ fontSize:13, color:'var(--t4)', fontFamily:'var(--sans)' }}>
            Run Meta Ads from your Brand Brain — no agency, no confusion.
          </p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button
            onClick={() => setShowCreate(!showCreate)}
            style={{
              display:'inline-flex', alignItems:'center', gap:7,
              padding:'10px 20px',
              background:'var(--blue)', border:'none', borderRadius:8,
              fontFamily:'var(--display)', fontSize:13, fontWeight:700,
              color:'#fff', cursor:'pointer',
              boxShadow:'0 0 24px rgba(30,142,240,0.25)',
              letterSpacing:'-0.01em',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            New campaign
          </button>
        </div>
      </div>

      {/* Connect Meta banner */}
      {!connected && (
        <div style={{
          background: 'rgba(249,115,22,0.05)',
          border: '1px solid rgba(249,115,22,0.2)',
          borderRadius: 12, padding: '16px 20px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{
              width:36, height:36, borderRadius:9,
              background:'rgba(249,115,22,0.1)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#F97316"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </div>
            <div>
              <div style={{ fontFamily:'var(--display)', fontSize:14, fontWeight:700, color:'#fff', marginBottom:2 }}>
                Connect your Meta account
              </div>
              <div style={{ fontSize:12, color:'var(--t4)' }}>
                Link your Facebook Business account to start running ads directly from Nexa
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              const metaOAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.NEXT_PUBLIC_META_APP_ID}&redirect_uri=https%3A%2F%2Fnexaa.cc%2Fapi%2Fmeta%2Fconnect&scope=ads_management,ads_read,pages_read_engagement&response_type=code`
              window.open(metaOAuthUrl, '_blank')
            }}
            style={{
              padding:'9px 18px', background:'#F97316', border:'none',
              borderRadius:7, fontFamily:'var(--display)',
              fontSize:12, fontWeight:700, color:'#fff',
              cursor:'pointer', whiteSpace:'nowrap', flexShrink:0,
            }}
          >
            Connect Meta →
          </button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        {[
          { label:'Total spent', value: campaigns.length ? `${totalSpend.toFixed(0)}` : '—', sub:'This month', sc:'var(--blue)' },
          { label:'People reached', value: campaigns.length ? (totalReach >= 1000 ? `${(totalReach/1000).toFixed(1)}k` : totalReach.toString()) : '—', sub:'Last 30 days', sc:'#22C55E' },
          { label:'Link clicks', value: campaigns.length ? totalClicks.toString() : '—', sub: campaigns.length && totalClicks > 0 ? `Avg ${(totalSpend/totalClicks).toFixed(2)} CPC` : 'No data yet', sc:'var(--blue2)' },
          { label:'Active campaigns', value: activeCampaigns.toString(), sub:`${campaigns.length - activeCampaigns} paused`, sc:'#FB923C' },
        ].map((s, i) => (
          <div key={i} style={{
            background:'#0A0A0A', border:'1px solid var(--line)',
            borderRadius:10, padding:'14px 16px',
            position:'relative', overflow:'hidden',
          }}>
            <div style={{
              position:'absolute', bottom:0, left:0, right:0, height:1,
              background:s.sc, opacity:0.25,
            }}/>
            <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase' as const, color:'var(--t4)', marginBottom:7, fontFamily:'var(--sans)' }}>{s.label}</div>
            <div style={{ fontFamily:'var(--mono)', fontSize:24, fontWeight:300, color:'#fff', letterSpacing:'-0.04em', lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:10, color:'var(--t4)', marginTop:5, fontFamily:'var(--sans)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Create campaign flow */}
      {showCreate && (
        <div style={{
          background:'#0A0A0A', border:'1px solid rgba(30,142,240,0.2)',
          borderRadius:12, padding:20, marginBottom:20,
          boxShadow:'0 0 40px rgba(30,142,240,0.06)',
        }}>
          <div style={{
            fontFamily:'var(--display)', fontSize:15, fontWeight:700,
            color:'#fff', letterSpacing:'-0.02em',
            marginBottom:16, display:'flex', alignItems:'center', gap:8
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4DABF7" strokeWidth="2.5" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Brand Brain builds your campaign automatically
          </div>

          {[
            {
              num:'01', label:'Creative',
              desc:'Write ad copy in your voice and generate a brand-accurate visual — or pick from your content library.',
              tags: undefined,
            },
            {
              num:'02', label:'Audience — auto-built',
              desc:'Brand Brain translates your audience profile into Meta targeting. Review and adjust if needed.',
              tags: audienceTags,
            },
            {
              num:'03', label:'Budget',
              desc:'Set a daily budget. Nexa recommends the minimum for your goal. No bidding strategy, no attribution windows.',
              tags: undefined,
            },
            {
              num:'04', label:'Launch',
              desc:'One button. Campaign goes live on Meta. Performance tracked here in plain English.',
              tags: undefined,
            },
          ].map((step, i) => (
            <div key={i} style={{
              display:'flex', gap:12, marginBottom: i < 3 ? 16 : 0,
              paddingBottom: i < 3 ? 16 : 0,
              borderBottom: i < 3 ? '1px solid var(--line)' : 'none',
            }}>
              <div style={{
                fontFamily:'var(--mono)', fontSize:11, fontWeight:300,
                color:'var(--blue2)', flexShrink:0, marginTop:1, width:16
              }}>{step.num}</div>
              <div style={{ flex:1 }}>
                <div style={{
                  fontSize:9.5, fontWeight:600, letterSpacing:'0.1em',
                  textTransform:'uppercase' as const, color:'var(--t4)',
                  fontFamily:'var(--sans)', marginBottom:6
                }}>{step.label}</div>
                <div style={{ fontSize:13, color:'var(--t3)', lineHeight:1.65, fontFamily:'var(--sans)' }}>
                  {step.desc}
                </div>
                {step.tags && (
                  <div style={{ marginTop:8, display:'flex', flexWrap:'wrap' as const, gap:4 }}>
                    {step.tags.map((tag: string, j: number) => (
                      <span key={j} style={{
                        padding:'3px 8px',
                        background:'rgba(30,142,240,0.07)',
                        border:'1px solid rgba(30,142,240,0.14)',
                        borderRadius:5, fontSize:11, fontWeight:500,
                        color:'var(--blue2)', fontFamily:'var(--sans)'
                      }}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          <div style={{
            marginTop:16, paddingTop:16,
            borderTop:'1px solid var(--line)',
            display:'flex', justifyContent:'space-between', alignItems:'center'
          }}>
            <div style={{ fontSize:12, color:'var(--t4)', fontFamily:'var(--sans)' }}>
              {connected ? '✓ Meta account connected' : '⚠ Connect Meta first to launch'}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  padding:'9px 16px', background:'transparent',
                  border:'1px solid var(--line2)', borderRadius:8,
                  fontSize:12, color:'var(--t3)', cursor:'pointer',
                  fontFamily:'var(--sans)',
                }}
              >
                Cancel
              </button>
              <button
                disabled={!connected}
                style={{
                  padding:'9px 20px',
                  background: connected ? 'var(--blue)' : 'rgba(255,255,255,0.05)',
                  border:'none', borderRadius:8,
                  fontFamily:'var(--display)', fontSize:13, fontWeight:700,
                  color: connected ? '#fff' : 'var(--t5)',
                  cursor: connected ? 'pointer' : 'not-allowed',
                  letterSpacing:'-0.01em',
                }}
              >
                {connected ? 'Launch campaign →' : 'Connect Meta first'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns list */}
      <div style={{ marginBottom:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:9.5, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase' as const, color:'var(--t4)', fontFamily:'var(--sans)' }}>
          Campaigns
        </div>
        <div style={{ fontSize:12, color:'var(--blue2)', cursor:'pointer', fontFamily:'var(--sans)' }}>
          {campaigns.length} total
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div style={{
          background:'#0A0A0A', border:'1px solid var(--line)',
          borderRadius:12, padding:'48px 24px',
          textAlign:'center',
        }}>
          <div style={{
            width:48, height:48, borderRadius:12,
            background:'rgba(249,115,22,0.08)',
            border:'1px solid rgba(249,115,22,0.16)',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 16px',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <div style={{
            fontFamily:'var(--display)', fontSize:18, fontWeight:700,
            color:'#fff', letterSpacing:'-0.02em', marginBottom:8
          }}>No campaigns yet</div>
          <div style={{
            fontSize:14, color:'var(--t4)', lineHeight:1.75,
            maxWidth:360, margin:'0 auto 20px', fontFamily:'var(--sans)'
          }}>
            Create your first Meta Ad campaign. Brand Brain builds the audience, writes the copy, and generates the creative automatically.
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              padding:'11px 24px', background:'var(--blue)',
              border:'none', borderRadius:8,
              fontFamily:'var(--display)', fontSize:13, fontWeight:700,
              color:'#fff', cursor:'pointer', letterSpacing:'-0.01em',
              boxShadow:'0 0 24px rgba(30,142,240,0.25)',
            }}
          >
            Create first campaign →
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {campaigns.map((camp) => (
            <div key={camp.id} style={{
              background:'#0A0A0A', border:'1px solid var(--line)',
              borderRadius:12, padding:'14px 18px',
              display:'flex', alignItems:'center', gap:14,
              cursor:'pointer', transition:'all 0.2s',
              position:'relative', overflow:'hidden',
            }}>
              <div style={{
                width:8, height:8, borderRadius:'50%', flexShrink:0,
                background: camp.status === 'ACTIVE' ? '#22C55E' : '#F59E0B'
              }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{
                  fontFamily:'var(--display)', fontSize:13, fontWeight:700,
                  color:'#fff', letterSpacing:'-0.01em', marginBottom:2
                }}>{camp.name}</div>
                <div style={{ fontSize:11, color:'var(--t4)', fontFamily:'var(--sans)' }}>
                  ${camp.daily_budget}/day · {camp.start_date ? new Date(camp.start_date).toLocaleDateString('en-US', {month:'short', day:'numeric'}) : 'No date'}
                </div>
              </div>
              <div style={{
                padding:'3px 8px', borderRadius:5,
                background: camp.status === 'ACTIVE' ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)',
                border: `1px solid ${camp.status === 'ACTIVE' ? 'rgba(34,197,94,0.16)' : 'rgba(245,158,11,0.16)'}`,
                fontSize:10, fontWeight:600,
                color: camp.status === 'ACTIVE' ? '#4ADE80' : '#FBB040',
                fontFamily:'var(--sans)',
              }}>
                {camp.status === 'ACTIVE' ? 'Active' : 'Paused'}
              </div>
              <div style={{ display:'flex', gap:16, marginLeft:'auto' }}>
                {[
                  { val: `${(camp.insights?.spend || 0).toFixed(0)}`, lbl:'Spent' },
                  { val: camp.insights?.reach ? (camp.insights.reach >= 1000 ? `${(camp.insights.reach/1000).toFixed(1)}k` : camp.insights.reach.toString()) : '—', lbl:'Reached' },
                  { val: camp.insights?.cpc ? `${camp.insights.cpc.toFixed(2)}` : '—', lbl:'CPC' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign:'right' }}>
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
      <div style={{
        marginTop:20, padding:'14px 16px',
        background:'rgba(255,255,255,0.02)',
        border:'1px solid var(--line)',
        borderRadius:10,
        display:'flex', gap:10, alignItems:'flex-start'
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth="1.5" strokeLinecap="round" style={{marginTop:1, flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div style={{ fontSize:12, color:'var(--t4)', lineHeight:1.65, fontFamily:'var(--sans)' }}>
          Amplify requires Meta App Review for full ads_management access. During review, you can test with your own ad account. <span style={{ color:'var(--blue2)', cursor:'pointer' }}>Learn more →</span>
        </div>
      </div>

    </div>
  )
}
