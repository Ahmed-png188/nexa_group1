'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

type Tab = 'profile' | 'workspace' | 'billing' | 'password'

const IconUser = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const IconWs = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
const IconCard = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
const IconLock = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
const IconOut = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
const IconOk = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>

const PLANS = [
  { id: 'spark',  name: 'Spark',  price: '$39/mo',  credits: '500 cr',   users: '1 user',   features: ['Studio + Strategy + Schedule', '3 platforms', 'AI chat'] },
  { id: 'grow',   name: 'Grow',   price: '$89/mo',  credits: '1,500 cr', users: '3 users',  features: ['Everything in Spark', 'Automate', 'Insights', 'TikTok'], popular: true },
  { id: 'scale',  name: 'Scale',  price: '$179/mo', credits: '5,000 cr', users: '10 users', features: ['Everything in Grow', 'All integrations', 'API access'] },
  { id: 'agency', name: 'Agency', price: '$349/mo', credits: '15,000 cr', users: 'Unlimited', features: ['Everything in Scale', 'Client workspaces', 'White-label'] },
]

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'profile')
  const [user, setUser] = useState<any>(null)
  const [workspace, setWorkspace] = useState<any>(null)
  const [credits, setCredits] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [wsName, setWsName] = useState('')
  const [website, setWebsite] = useState('')
  const [voice, setVoice] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [pwErr, setPwErr] = useState('')
  const [checkingOut, setCheckingOut] = useState<string | null>(null)
  const [upgradeSuccess, setUpgradeSuccess] = useState(false)

  useEffect(() => {
    if (searchParams.get('success') === 'true') setUpgradeSuccess(true)
    load()
  }, [])

  async function load() {
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) { router.push('/auth/login'); return }
    const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single()
    const { data: m } = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id', u.id).limit(1).single()
    const ws = (m as any)?.workspaces
    const { data: cr } = await supabase.from('credits').select('balance, lifetime_used').eq('workspace_id', ws?.id).single()
    setUser(p); setWorkspace(ws); setCredits(cr)
    setFullName(p?.full_name ?? ''); setEmail(u.email ?? '')
    setWsName(ws?.name ?? ''); setWebsite(ws?.brand_website ?? ''); setVoice(ws?.brand_voice ?? '')
    setLoading(false)
  }

  const save = async (fn: () => Promise<void>) => {
    setSaving(true); await fn(); setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  async function handleUpgrade(plan: string) {
    setCheckingOut(plan)
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspace.id, plan }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert('Stripe is not configured yet. Add STRIPE_SECRET_KEY to your environment variables.')
    } catch (err) {
      alert('Payment setup not configured yet. Add Stripe keys to continue.')
    }
    setCheckingOut(null)
  }

  async function handleTopUp(amount: number) {
    setCheckingOut('topup')
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspace.id, top_up_credits: amount }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert('Stripe is not configured yet.')
    } catch {
      alert('Payment setup not configured yet.')
    }
    setCheckingOut(null)
  }

  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'80vh' }}><div style={{ fontSize:13,color:'var(--t4)' }}>Loading...</div></div>

  const TABS = [
    { id: 'profile' as Tab,   label: 'Profile',          icon: <IconUser /> },
    { id: 'workspace' as Tab, label: 'Workspace',         icon: <IconWs /> },
    { id: 'billing' as Tab,   label: 'Billing & Credits', icon: <IconCard /> },
    { id: 'password' as Tab,  label: 'Password',          icon: <IconLock /> },
  ]

  const l: React.CSSProperties = { display:'block',fontSize:12,fontWeight:600,color:'var(--t4)',marginBottom:7 }
  const i: React.CSSProperties = { width:'100%',padding:'11px 14px',fontSize:13,fontFamily:'var(--sans)',background:'rgba(255,255,255,0.04)',border:'1px solid var(--line2)',borderRadius:9,color:'var(--t1)',outline:'none',transition:'border-color 0.18s' }
  const b: React.CSSProperties = { padding:'11px 20px',fontSize:13,fontWeight:700,fontFamily:'var(--sans)',background:'var(--cyan)',color:'#000',border:'none',borderRadius:9,cursor:'pointer',display:'flex',alignItems:'center',gap:6 }

  return (
    <div style={{ padding:'32px',maxWidth:860 }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:'var(--display)',fontSize:24,fontWeight:800,letterSpacing:'-0.04em',marginBottom:4 }}>Settings</h1>
        <p style={{ fontSize:13,color:'var(--t4)' }}>Manage your profile, workspace, and billing.</p>
      </div>

      {upgradeSuccess && (
        <div style={{ marginBottom:20,padding:'14px 18px',background:'rgba(0,214,143,0.07)',border:'1px solid rgba(0,214,143,0.2)',borderRadius:10,fontSize:13,color:'#00d68f',display:'flex',alignItems:'center',gap:8 }}>
          <IconOk /> Plan upgraded successfully! Your credits have been added.
        </div>
      )}

      <div style={{ display:'grid',gridTemplateColumns:'200px 1fr',gap:20 }}>
        <div style={{ display:'flex',flexDirection:'column',gap:2 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display:'flex',alignItems:'center',gap:9,padding:'9px 12px',borderRadius:9,fontSize:13,fontWeight:tab===t.id?700:500,color:tab===t.id?'var(--t1)':'var(--t4)',background:tab===t.id?'var(--glass2)':'transparent',border:tab===t.id?'1px solid var(--line2)':'1px solid transparent',cursor:'pointer',fontFamily:'var(--sans)',textAlign:'left' as const }}>
              <span style={{ color:tab===t.id?'var(--cyan)':'var(--t5)',display:'flex' }}>{t.icon}</span>{t.label}
            </button>
          ))}
          <div style={{ height:1,background:'var(--line)',margin:'8px 0' }} />
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }} style={{ display:'flex',alignItems:'center',gap:9,padding:'9px 12px',borderRadius:9,fontSize:13,color:'var(--red)',background:'transparent',border:'1px solid transparent',cursor:'pointer',fontFamily:'var(--sans)',textAlign:'left' as const }}>
            <span style={{ display:'flex',color:'var(--red)' }}><IconOut /></span>Sign out
          </button>
        </div>

        <div style={{ background:'var(--glass)',border:'1px solid var(--line2)',borderRadius:14,padding:24 }}>

          {/* PROFILE */}
          {tab === 'profile' && (
            <div>
              <h2 style={{ fontFamily:'var(--display)',fontSize:17,fontWeight:700,letterSpacing:'-0.02em',marginBottom:20 }}>Profile</h2>
              <div style={{ display:'flex',alignItems:'center',gap:16,marginBottom:24,padding:16,background:'rgba(0,0,0,0.2)',borderRadius:10,border:'1px solid var(--line)' }}>
                <div style={{ width:52,height:52,borderRadius:'50%',background:'rgba(0,170,255,0.1)',border:'1px solid var(--cline2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700,color:'var(--cyan)' }}>{fullName[0]?.toUpperCase()??'?'}</div>
                <div><div style={{ fontSize:14,fontWeight:700,color:'var(--t1)',marginBottom:2 }}>{fullName||'Your Name'}</div><div style={{ fontSize:12,color:'var(--t4)' }}>{email}</div></div>
              </div>
              <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
                <div><label style={l}>Full name</label><input value={fullName} onChange={e=>setFullName(e.target.value)} style={i} onFocus={e=>(e.target.style.borderColor='var(--cline2)')} onBlur={e=>(e.target.style.borderColor='var(--line2)')}/></div>
                <div><label style={l}>Email</label><input value={email} disabled style={{...i,opacity:0.5,cursor:'not-allowed'}}/><p style={{fontSize:11,color:'var(--t5)',marginTop:5}}>Email cannot be changed.</p></div>
                <button onClick={()=>save(async()=>{await supabase.from('profiles').update({full_name:fullName}).eq('id',user.id)})} disabled={saving} style={b}>{saved?<><IconOk/>Saved</>:saving?'Saving...':'Save changes'}</button>
              </div>
            </div>
          )}

          {/* WORKSPACE */}
          {tab === 'workspace' && (
            <div>
              <h2 style={{ fontFamily:'var(--display)',fontSize:17,fontWeight:700,letterSpacing:'-0.02em',marginBottom:20 }}>Workspace</h2>
              <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
                <div><label style={l}>Workspace name</label><input value={wsName} onChange={e=>setWsName(e.target.value)} style={i} onFocus={e=>(e.target.style.borderColor='var(--cline2)')} onBlur={e=>(e.target.style.borderColor='var(--line2)')}/></div>
                <div><label style={l}>Brand website</label><input value={website} onChange={e=>setWebsite(e.target.value)} placeholder="https://yourbrand.com" style={i} onFocus={e=>(e.target.style.borderColor='var(--cline2)')} onBlur={e=>(e.target.style.borderColor='var(--line2)')}/></div>
                <div>
                  <label style={l}>Brand voice <span style={{color:'var(--t5)',fontWeight:400}}>(used by Nexa AI)</span></label>
                  <textarea value={voice} onChange={e=>setVoice(e.target.value)} rows={4} style={{...i,resize:'vertical' as const,lineHeight:1.6}} onFocus={e=>(e.target.style.borderColor='var(--cline2)')} onBlur={e=>(e.target.style.borderColor='var(--line2)')}/>
                </div>
                <button onClick={()=>save(async()=>{await supabase.from('workspaces').update({name:wsName,brand_website:website,brand_voice:voice}).eq('id',workspace.id)})} disabled={saving} style={b}>{saved?<><IconOk/>Saved</>:saving?'Saving...':'Save workspace'}</button>
              </div>
            </div>
          )}

          {/* BILLING */}
          {tab === 'billing' && (
            <div>
              <h2 style={{ fontFamily:'var(--display)',fontSize:17,fontWeight:700,letterSpacing:'-0.02em',marginBottom:20 }}>Billing & Credits</h2>

              {/* Current plan */}
              <div style={{ padding:'14px 16px',background:'rgba(0,170,255,0.04)',border:'1px solid var(--cline2)',borderRadius:10,marginBottom:20,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:13,fontWeight:700,color:'var(--t1)',marginBottom:2 }}>
                    {workspace?.plan === 'trial' ? 'Free Trial' : (workspace?.plan?.charAt(0).toUpperCase()+(workspace?.plan?.slice(1)))||'Free'} Plan
                  </div>
                  <div style={{ fontSize:11,color:'var(--t4)' }}>{credits?.balance?.toLocaleString()??0} credits remaining</div>
                </div>
                <span style={{ fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:100,background:'var(--cglow2)',color:'var(--cyan)',border:'1px solid var(--cline2)' }}>
                  {workspace?.plan_status??'trialing'}
                </span>
              </div>

              {/* Credit stats */}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20 }}>
                <div style={{ padding:'14px 16px',background:'rgba(0,0,0,0.2)',border:'1px solid var(--line)',borderRadius:10 }}>
                  <div style={{ fontFamily:'var(--display)',fontSize:28,fontWeight:800,letterSpacing:'-0.04em',color:'var(--cyan)',lineHeight:1 }}>{credits?.balance?.toLocaleString()??0}</div>
                  <div style={{ fontSize:11,color:'var(--t4)',marginTop:5 }}>Credits remaining</div>
                </div>
                <div style={{ padding:'14px 16px',background:'rgba(0,0,0,0.2)',border:'1px solid var(--line)',borderRadius:10 }}>
                  <div style={{ fontFamily:'var(--display)',fontSize:28,fontWeight:800,letterSpacing:'-0.04em',color:'var(--t1)',lineHeight:1 }}>{credits?.lifetime_used?.toLocaleString()??0}</div>
                  <div style={{ fontSize:11,color:'var(--t4)',marginTop:5 }}>Credits used total</div>
                </div>
              </div>

              {/* Top-up */}
              <div style={{ marginBottom:24,padding:'14px 16px',background:'var(--glass)',border:'1px solid var(--line2)',borderRadius:10 }}>
                <div style={{ fontSize:12,fontWeight:700,color:'var(--t2)',marginBottom:10 }}>Top up credits · $12 per 500</div>
                <div style={{ display:'flex',gap:7 }}>
                  {[500,1000,2500,5000].map(amt => (
                    <button key={amt} onClick={()=>handleTopUp(amt)} disabled={checkingOut==='topup'} style={{ flex:1,padding:'9px 6px',borderRadius:9,background:'var(--glass)',border:'1px solid var(--line2)',color:'var(--t3)',cursor:'pointer',fontFamily:'var(--sans)',fontSize:12,fontWeight:600,transition:'all .15s' }}
                      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--cline2)';(e.currentTarget as HTMLElement).style.color='var(--cyan)'}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--line2)';(e.currentTarget as HTMLElement).style.color='var(--t3)'}}
                    >
                      <div style={{ fontFamily:'var(--display)',fontSize:14,fontWeight:800,letterSpacing:'-0.03em',marginBottom:1 }}>{amt}</div>
                      <div style={{ fontSize:10,opacity:0.7 }}>${(amt/500*12).toFixed(0)}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Plans */}
              <div style={{ fontSize:12,fontWeight:700,color:'var(--t4)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:12 }}>Upgrade plan</div>
              <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                {PLANS.map(plan => {
                  const isCurrent = workspace?.plan === plan.id
                  return (
                    <div key={plan.id} style={{ padding:'16px',background:plan.popular?'rgba(0,170,255,0.04)':'var(--glass)',border:`1px solid ${plan.popular?'var(--cline)':'var(--line2)'}`,borderRadius:11,display:'flex',alignItems:'center',gap:14 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
                          <span style={{ fontSize:14,fontWeight:700,color:'var(--t1)',fontFamily:'var(--display)' }}>{plan.name}</span>
                          {plan.popular && <span style={{ fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:100,background:'var(--cglow2)',color:'var(--cyan)',border:'1px solid var(--cline2)' }}>Popular</span>}
                          {isCurrent && <span style={{ fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:100,background:'rgba(0,214,143,0.08)',color:'#00d68f',border:'1px solid rgba(0,214,143,0.2)' }}>Current</span>}
                        </div>
                        <div style={{ fontSize:11,color:'var(--t4)' }}>{plan.credits} · {plan.users}</div>
                      </div>
                      <div style={{ fontSize:16,fontWeight:800,fontFamily:'var(--display)',letterSpacing:'-0.03em',color:'var(--t1)',flexShrink:0 }}>{plan.price}</div>
                      <button
                        onClick={()=>handleUpgrade(plan.id)}
                        disabled={isCurrent||checkingOut===plan.id}
                        style={{ padding:'8px 18px',fontSize:12,fontWeight:700,fontFamily:'var(--sans)',background:isCurrent?'var(--glass)':plan.popular?'var(--cyan)':'var(--glass2)',color:isCurrent?'var(--t5)':plan.popular?'#000':'var(--t2)',border:isCurrent?'1px solid var(--line)':'none',borderRadius:8,cursor:isCurrent?'not-allowed':'pointer',flexShrink:0,display:'flex',alignItems:'center',gap:6 }}
                      >
                        {checkingOut===plan.id?'Loading...':(isCurrent?'Current plan':'Upgrade →')}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* PASSWORD */}
          {tab === 'password' && (
            <div>
              <h2 style={{ fontFamily:'var(--display)',fontSize:17,fontWeight:700,letterSpacing:'-0.02em',marginBottom:20 }}>Change Password</h2>
              <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
                <div><label style={l}>New password</label><input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="At least 8 characters" style={i} onFocus={e=>(e.target.style.borderColor='var(--cline2)')} onBlur={e=>(e.target.style.borderColor='var(--line2)')}/></div>
                <div><label style={l}>Confirm password</label><input type="password" value={pw2} onChange={e=>setPw2(e.target.value)} style={i} onFocus={e=>(e.target.style.borderColor='var(--cline2)')} onBlur={e=>(e.target.style.borderColor='var(--line2)')}/></div>
                {pwErr && <div style={{ padding:'10px 14px',background:'rgba(255,107,107,0.07)',border:'1px solid rgba(255,107,107,0.2)',borderRadius:8,fontSize:13,color:'var(--red)' }}>{pwErr}</div>}
                <button onClick={async()=>{
                  setPwErr('')
                  if(pw!==pw2){setPwErr('Passwords do not match.');return}
                  if(pw.length<8){setPwErr('At least 8 characters.');return}
                  await save(async()=>{const{error}=await supabase.auth.updateUser({password:pw});if(error){setPwErr(error.message);throw error}setPw('');setPw2('')})
                }} disabled={saving} style={b}>{saved?<><IconOk/>Updated</>:saving?'Updating...':'Update password'}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
