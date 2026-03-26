'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_PLANS, type PlanConfig, type PromoCode } from '@/lib/use-admin-config'

// ─── Design tokens ───────────────────────────────────────────
const C = {
  bg: '#0C0C0C', surface: '#141414', elevated: '#1A1A1A', overlay: '#202020',
  border: 'rgba(255,255,255,0.10)', borderS: 'rgba(255,255,255,0.06)', borderSt: 'rgba(255,255,255,0.16)',
  cyan: '#00AAFF', cyanD: 'rgba(0,170,255,0.10)', cyanB: 'rgba(0,170,255,0.20)',
  t1: '#FFFFFF', t2: 'rgba(255,255,255,0.72)', t3: 'rgba(255,255,255,0.42)', t4: 'rgba(255,255,255,0.20)',
  success: '#22C55E', successD: 'rgba(34,197,94,0.10)',
  warning: '#F59E0B', warningD: 'rgba(245,158,11,0.10)',
  error: '#EF4444', errorD: 'rgba(239,68,68,0.10)',
  purple: '#A78BFA', purpleD: 'rgba(167,139,250,0.10)',
  orange: '#FF7A40', orangeD: 'rgba(255,122,64,0.10)',
}
const SANS = "'Geist', -apple-system, sans-serif"
const MONO = "'Geist Mono', monospace"

const TABS = ['Overview', 'Users', 'Plans & Pricing', 'Features', 'Discounts', 'Revenue']

const DEFAULT_FEATURES: Record<string, { label: string; desc: string; impact: 'high' | 'medium' | 'low' }> = {
  image_generation:    { label: 'Image Generation',      desc: 'AI image creation in Studio',               impact: 'high' },
  video_generation:    { label: 'Video Generation',      desc: 'AI video creation (8s, 16s)',               impact: 'high' },
  voice_generation:    { label: 'Voice Generation',      desc: 'AI voice cloning and synthesis',            impact: 'medium' },
  email_sequences:     { label: 'Email Sequences',       desc: 'Automated email flows (Grow+)',             impact: 'medium' },
  amplify:             { label: 'Amplify (Meta Ads)',     desc: 'Boost content to Meta Ads',                impact: 'high' },
  agency_mode:         { label: 'Agency Mode',           desc: 'Multi-client workspace management',         impact: 'high' },
  competitor_analysis: { label: 'Competitor Analysis',   desc: 'AI competitor intelligence (Grow+)',        impact: 'medium' },
  performance_learning:{ label: 'Performance Learning',  desc: 'AI learns from your best content',          impact: 'medium' },
  lead_page:           { label: 'Lead Page',             desc: 'Lead capture pages for all users',          impact: 'low' },
  ai_chat:             { label: 'Nexa AI Chat',          desc: 'Unlimited AI assistant in dashboard',       impact: 'medium' },
  strategy:            { label: 'Strategy',              desc: '30-day content strategy generator',          impact: 'medium' },
  schedule:            { label: 'Schedule',              desc: 'Social media scheduling & publishing',       impact: 'high' },
  insights:            { label: 'Insights',              desc: 'Analytics and performance data',             impact: 'medium' },
  integrations:        { label: 'Integrations',          desc: 'Kit, Typeform, Zapier connections',         impact: 'low' },
}

// ─── Small components ────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width: 36, height: 20, borderRadius: 10, background: value ? C.cyan : C.overlay, border: `1px solid ${value ? C.cyan : C.border}`, cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0 }}>
      <div style={{ width: 14, height: 14, borderRadius: 7, background: '#fff', position: 'absolute', top: 2, left: value ? 18 : 2, transition: 'left 0.2s' }} />
    </div>
  )
}
function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = { spark: 'rgba(255,255,255,0.7)', grow: C.cyan, scale: C.purple, agency: C.orange, trial: C.t3 }
  const c = colors[plan] ?? C.t3
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 6, background: c + '18', border: `1px solid ${c}30`, fontSize: 11, fontWeight: 600, color: c, fontFamily: MONO }}>{plan}</span>
}
function StatCard({ icon, label, value, sub, color = C.cyan }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.borderS}`, borderRadius: 12, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.t3, fontSize: 12, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        <span style={{ color }}>{icon}</span>{label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: C.t1, letterSpacing: '-0.02em', fontFamily: MONO }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.t3 }}>{sub}</div>}
    </div>
  )
}
function Input({ label, value, onChange, type = 'text', prefix }: { label: string; value: string | number; onChange: (v: string) => void; type?: string; prefix?: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: C.t3, marginBottom: 6, fontWeight: 500 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', background: C.overlay, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
        {prefix && <span style={{ padding: '0 10px', color: C.t3, fontSize: 13, borderRight: `1px solid ${C.border}`, height: 38, display: 'flex', alignItems: 'center' }}>{prefix}</span>}
        <input type={type} value={value} onChange={e => onChange(e.target.value)} style={{ background: 'transparent', border: 'none', outline: 'none', color: C.t1, fontSize: 13, padding: '0 12px', height: 38, width: '100%', fontFamily: MONO }} />
      </div>
    </div>
  )
}
function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: type === 'success' ? C.successD : C.errorD, border: `1px solid ${type === 'success' ? C.success : C.error}30`, borderRadius: 10, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(12px)', fontSize: 13, color: type === 'success' ? C.success : C.error, fontWeight: 500 }}>
      {type === 'success' ? '✓' : '✕'} {message}
    </div>
  )
}

// ─── Icons ───────────────────────────────────────────────────
const Ic = {
  users:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  dollar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  trend:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  chart:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>,
  plus:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  copy:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  trash:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  gift:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  shield: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
}

// ═══════════════════════════════════════════════════════════
export default function AdminPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState('Overview')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // ── DB data ──
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [credits, setCredits] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)

  // ── Plans (from admin_plans table) ──
  const [plans, setPlans] = useState<PlanConfig[]>(DEFAULT_PLANS)
  const [newPlan, setNewPlan] = useState({ label: '', tagline: '', tagline_ar: '', price: '', credits: '', color: '#00AAFF', popular: false, cta_en: '', cta_ar: '' })
  const [showNewPlan, setShowNewPlan] = useState(false)

  // ── Feature flags ──
  const [features, setFeatures] = useState<Record<string, boolean>>(
    Object.fromEntries(Object.keys(DEFAULT_FEATURES).map(k => [k, true]))
  )

  // ── Promo codes ──
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [newCode, setNewCode] = useState({ code: '', type: 'percent', value: '', plan: 'all', limit: '', expires: '', banner_text_en: '', banner_text_ar: '', show_banner: true })

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Load everything ──
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [wsRes, crRes, plansRes, flagsRes, promoRes] = await Promise.all([
        supabase.from('workspaces').select('*, profiles(id,email,full_name,created_at)').order('created_at', { ascending: false }),
        supabase.from('credits').select('*'),
        supabase.from('admin_plans').select('*').order('sort_order', { ascending: true }),
        supabase.from('admin_feature_flags').select('*'),
        supabase.from('admin_promo_codes').select('*').order('created_at', { ascending: false }),
      ])
      setWorkspaces(wsRes.data ?? [])
      setCredits(crRes.data ?? [])
      if (plansRes.data && plansRes.data.length > 0) setPlans(plansRes.data)
      if (flagsRes.data && flagsRes.data.length > 0) {
        const f: Record<string, boolean> = {}
        flagsRes.data.forEach((r: any) => { f[r.key] = r.enabled })
        setFeatures(f)
      }
      setPromoCodes(promoRes.data ?? [])
    } catch (e: any) {
      showToast('Failed to load data', 'error')
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ─────────────────────────────────────────────
  // PLANS — save to admin_plans table
  // ─────────────────────────────────────────────
  async function savePlans() {
    setSaving(true)
    try {
      // Upsert each plan
      for (let i = 0; i < plans.length; i++) {
        const plan = { ...plans[i], sort_order: i, updated_at: new Date().toISOString() }
        const { error } = await supabase.from('admin_plans').upsert(plan, { onConflict: 'id' })
        if (error) throw error
      }
      showToast('Pricing saved — landing & settings pages updated instantly ✓')
    } catch (e: any) {
      showToast(e.message, 'error')
    }
    setSaving(false)
  }

  async function deletePlan(planId: string) {
    if (!confirm(`Delete the "${planId}" plan? Existing users won't be affected.`)) return
    await supabase.from('admin_plans').delete().eq('id', planId)
    setPlans(p => p.filter(x => x.id !== planId))
    showToast(`Plan "${planId}" removed from landing page`)
  }

  async function addNewPlan() {
    if (!newPlan.label || !newPlan.price || !newPlan.credits) return showToast('Fill in label, price and credits', 'error')
    const id = newPlan.label.toLowerCase().replace(/\s+/g, '-')
    const plan: PlanConfig = {
      id, label: newPlan.label,
      tagline: newPlan.tagline || 'The ' + newPlan.label,
      tagline_ar: newPlan.tagline_ar || newPlan.label,
      price: Number(newPlan.price), price_cents: Number(newPlan.price) * 100,
      credits: Number(newPlan.credits),
      color: newPlan.color, popular: newPlan.popular, enabled: true,
      cta_en: newPlan.cta_en || `Start with ${newPlan.label}`,
      cta_ar: newPlan.cta_ar || `ابدأ بـ ${newPlan.label}`,
      trial_credits: 0, stripe_price_id: '', features: {},
    }
    const { error } = await supabase.from('admin_plans').insert({ ...plan, sort_order: plans.length })
    if (error) return showToast(error.message, 'error')
    setPlans(p => [...p, plan])
    setShowNewPlan(false)
    setNewPlan({ label: '', tagline: '', tagline_ar: '', price: '', credits: '', color: '#00AAFF', popular: false, cta_en: '', cta_ar: '' })
    showToast(`"${plan.label}" plan added — it's now live on the pricing page!`)
  }

  // ─────────────────────────────────────────────
  // FEATURE FLAGS — save to admin_feature_flags
  // ─────────────────────────────────────────────
  async function saveFeatures() {
    setSaving(true)
    try {
      const rows = Object.entries(features).map(([key, enabled]) => ({ key, enabled, updated_at: new Date().toISOString() }))
      const { error } = await supabase.from('admin_feature_flags').upsert(rows, { onConflict: 'key' })
      if (error) throw error
      showToast('Feature flags saved — takes effect immediately for all users ✓')
    } catch (e: any) {
      showToast(e.message, 'error')
    }
    setSaving(false)
  }

  async function toggleFeature(key: string, val: boolean) {
    setFeatures(f => ({ ...f, [key]: val }))
    // Save immediately on toggle
    await supabase.from('admin_feature_flags').upsert({ key, enabled: val, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    showToast(`${DEFAULT_FEATURES[key]?.label ?? key} ${val ? 'enabled' : 'disabled'}`)
  }

  // ─────────────────────────────────────────────
  // PROMO CODES — save to admin_promo_codes
  // ─────────────────────────────────────────────
  async function createCode() {
    if (!newCode.code || !newCode.value) return showToast('Fill in code and discount value', 'error')
    const row = {
      code: newCode.code.toUpperCase(),
      type: newCode.type,
      value: Number(newCode.value),
      plan: newCode.plan,
      use_limit: Number(newCode.limit) || 0,
      expires_at: newCode.expires || null,
      active: true,
      show_banner: newCode.show_banner,
      banner_text_en: newCode.banner_text_en,
      banner_text_ar: newCode.banner_text_ar,
      uses: 0,
    }
    const { data, error } = await supabase.from('admin_promo_codes').insert(row).select().single()
    if (error) return showToast(error.message, 'error')
    setPromoCodes(p => [data, ...p])
    setNewCode({ code: '', type: 'percent', value: '', plan: 'all', limit: '', expires: '', banner_text_en: '', banner_text_ar: '', show_banner: true })
    showToast(`Code ${row.code} is live${row.show_banner ? ' — banner will appear on landing & pricing pages' : ''}`)
  }

  async function toggleCode(id: string, active: boolean) {
    await supabase.from('admin_promo_codes').update({ active }).eq('id', id)
    setPromoCodes(p => p.map(c => c.id === id ? { ...c, active } : c))
    showToast(active ? 'Code activated' : 'Code deactivated')
  }

  async function toggleBanner(id: string, show_banner: boolean) {
    await supabase.from('admin_promo_codes').update({ show_banner }).eq('id', id)
    setPromoCodes(p => p.map(c => c.id === id ? { ...c, show_banner } : c))
    showToast(show_banner ? 'Banner will now show on landing & pricing pages' : 'Banner hidden')
  }

  async function deleteCode(id: string) {
    await supabase.from('admin_promo_codes').delete().eq('id', id)
    setPromoCodes(p => p.filter(c => c.id !== id))
    showToast('Code deleted')
  }

  // ─────────────────────────────────────────────
  // USER ACTIONS
  // ─────────────────────────────────────────────
  async function updateUserPlan(wsId: string, plan: string) {
    await supabase.from('workspaces').update({ plan, plan_status: 'active' }).eq('id', wsId)
    showToast(`Plan updated to ${plan}`)
    load(); setSelectedUser(null)
  }

  async function giveFreeAccess(wsId: string, planId: string) {
    const plan = plans.find(p => p.id === planId)
    await supabase.from('workspaces').update({ plan: planId, plan_status: 'active', stripe_subscription_id: null }).eq('id', wsId)
    if (plan) {
      const existing = credits.find(c => c.workspace_id === wsId)
      if (existing) await supabase.from('credits').update({ balance: existing.balance + plan.credits }).eq('workspace_id', wsId)
      else await supabase.from('credits').insert({ workspace_id: wsId, balance: plan.credits })
    }
    showToast(`Free ${planId} access granted!`)
    load(); setSelectedUser(null)
  }

  async function addCredits(wsId: string, amount: number) {
    const existing = credits.find(c => c.workspace_id === wsId)
    if (existing) await supabase.from('credits').update({ balance: existing.balance + amount, updated_at: new Date().toISOString() }).eq('workspace_id', wsId)
    else await supabase.from('credits').insert({ workspace_id: wsId, balance: amount })
    await supabase.from('credit_transactions').insert({ workspace_id: wsId, amount, action: 'admin_topup', description: `Admin added ${amount} credits` })
    showToast(`${amount} credits added`)
    load(); setSelectedUser(null)
  }

  // ─────────────────────────────────────────────
  // Computed stats
  // ─────────────────────────────────────────────
  const planPriceMap = Object.fromEntries(plans.map(p => [p.id, p.price]))
  const totalRevenue = workspaces.filter(w => w.plan_status === 'active').reduce((s, w) => s + (planPriceMap[w.plan] ?? 0), 0)
  const planCounts   = workspaces.reduce((acc, w) => { acc[w.plan] = (acc[w.plan] || 0) + 1; return acc }, {} as Record<string, number>)
  const activeUsers  = workspaces.filter(w => w.plan_status === 'active').length
  const trialUsers   = workspaces.filter(w => w.plan_status === 'trialing').length
  const canceledUsers = workspaces.filter(w => w.plan_status === 'canceled').length
  const filtered     = workspaces.filter(w => !search || w.name?.toLowerCase().includes(search.toLowerCase()) || w.profiles?.email?.toLowerCase().includes(search.toLowerCase()))

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════
  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: SANS, color: C.t1 }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.borderS}`, padding: '0 32px', display: 'flex', alignItems: 'center', gap: 16, height: 58, background: C.surface, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: C.cyanD, border: `1px solid ${C.cyanB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.cyan }}>{Ic.shield}</div>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.t1 }}>Nexa Admin</span>
          <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 5, background: C.errorD, border: `1px solid ${C.error}30`, color: C.error, fontWeight: 600, fontFamily: MONO }}>PRIVATE</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {saving && <span style={{ fontSize: 12, color: C.cyan }}>Saving…</span>}
          <span style={{ fontSize: 12, color: C.t3 }}>{loading ? 'Loading…' : `${workspaces.length} workspaces`}</span>
          <button onClick={load} style={{ padding: '6px 14px', borderRadius: 7, background: C.overlay, border: `1px solid ${C.border}`, color: C.t2, fontSize: 12, cursor: 'pointer', fontFamily: SANS }}>Refresh</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: `1px solid ${C.borderS}`, padding: '0 32px', display: 'flex', gap: 2, background: C.surface }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: activeTab === tab ? C.cyan : C.t3, background: 'transparent', border: 'none', borderBottom: `2px solid ${activeTab === tab ? C.cyan : 'transparent'}`, cursor: 'pointer', fontFamily: SANS, transition: 'color 0.15s', marginBottom: -1 }}>
            {tab}
          </button>
        ))}
      </div>

      <div style={{ padding: '32px', maxWidth: 1200, margin: '0 auto' }}>

        {/* ───── OVERVIEW ───── */}
        {activeTab === 'Overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.t1, margin: 0 }}>Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              <StatCard icon={Ic.dollar} label="MRR" value={`$${totalRevenue.toLocaleString()}`} sub="Monthly recurring" color={C.success} />
              <StatCard icon={Ic.users} label="Total Users" value={workspaces.length} sub={`${activeUsers} active · ${trialUsers} trial`} color={C.cyan} />
              <StatCard icon={Ic.trend} label="Paid Users" value={activeUsers} sub={`${canceledUsers} canceled`} color={C.purple} />
              <StatCard icon={Ic.chart} label="ARPU" value={activeUsers > 0 ? `$${Math.round(totalRevenue / activeUsers)}` : '$0'} sub="Avg per paying user" color={C.orange} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: C.surface, border: `1px solid ${C.borderS}`, borderRadius: 12, padding: 22 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.t1, marginBottom: 20 }}>Users by Plan</div>
                {plans.map(p => {
                  const count = planCounts[p.id] || 0
                  const pct = workspaces.length > 0 ? (count / workspaces.length) * 100 : 0
                  return (
                    <div key={p.id} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, color: C.t2 }}>{p.label}</span>
                        <span style={{ fontSize: 13, color: C.t1, fontFamily: MONO }}>{count}</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: C.overlay }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: p.color, borderRadius: 2, transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ background: C.surface, border: `1px solid ${C.borderS}`, borderRadius: 12, padding: 22 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.t1, marginBottom: 20 }}>Revenue by Plan</div>
                {plans.map(p => {
                  const count = planCounts[p.id] ?? 0
                  const rev = count * p.price
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: p.color, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span style={{ color: C.t2 }}>{p.label}</span>
                          <span style={{ color: C.t1, fontFamily: MONO }}>${rev}/mo</span>
                        </div>
                        <div style={{ fontSize: 11, color: C.t3 }}>{count} users × ${p.price}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.borderS}`, borderRadius: 12, padding: 22 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.t1, marginBottom: 16 }}>Recent Signups</div>
              {workspaces.slice(0, 8).map((ws, i) => (
                <div key={ws.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < 7 ? `1px solid ${C.borderS}` : 'none' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: C.elevated, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: C.cyan }}>{(ws.name||'W')[0].toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.t1 }}>{ws.name||'Unnamed'}</div>
                    <div style={{ fontSize: 11, color: C.t3 }}>{ws.profiles?.email}</div>
                  </div>
                  <PlanBadge plan={ws.plan} />
                  <div style={{ fontSize: 11, color: C.t4, fontFamily: MONO }}>{ws.created_at ? new Date(ws.created_at).toLocaleDateString() : '—'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ───── USERS ───── */}
        {activeTab === 'Users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.t1, margin: 0 }}>User Database — {workspaces.length} users</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: '0 14px', height: 40 }}>
              <span style={{ color: C.t3 }}>{Ic.search}</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…" style={{ background: 'transparent', border: 'none', outline: 'none', color: C.t1, fontSize: 13, flex: 1, fontFamily: SANS }} />
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.borderS}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 120px 110px 90px 160px', padding: '10px 20px', borderBottom: `1px solid ${C.borderS}` }}>
                {['User', 'Email', 'Plan', 'Status', 'Credits', 'Actions'].map(h => (
                  <div key={h} style={{ fontSize: 11, color: C.t4, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</div>
                ))}
              </div>
              {filtered.map((ws, i) => {
                const bal = credits.find(c => c.workspace_id === ws.id)?.balance ?? 0
                return (
                  <div key={ws.id} style={{ display: 'grid', gridTemplateColumns: '1fr 160px 120px 110px 90px 160px', padding: '14px 20px', borderBottom: i < filtered.length - 1 ? `1px solid ${C.borderS}` : 'none', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.t1 }}>{ws.name || 'Unnamed'}</div>
                      <div style={{ fontSize: 11, color: C.t3 }}>{ws.profiles?.full_name || '—'}</div>
                    </div>
                    <div style={{ fontSize: 12, color: C.t3, fontFamily: MONO, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ws.profiles?.email}</div>
                    <div><PlanBadge plan={ws.plan} /></div>
                    <div><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 5, background: ws.plan_status === 'active' ? C.successD : ws.plan_status === 'trialing' ? C.warningD : C.errorD, color: ws.plan_status === 'active' ? C.success : ws.plan_status === 'trialing' ? C.warning : C.error, fontFamily: MONO, fontWeight: 600 }}>{ws.plan_status}</span></div>
                    <div style={{ fontSize: 13, fontFamily: MONO, color: bal > 100 ? C.t1 : bal > 0 ? C.warning : C.error }}>{bal.toLocaleString()}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setSelectedUser(ws)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: C.cyanD, border: `1px solid ${C.cyanB}`, color: C.cyan, cursor: 'pointer', fontFamily: SANS }}>Manage</button>
                      <button onClick={() => addCredits(ws.id, 500)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: C.elevated, border: `1px solid ${C.border}`, color: C.t2, cursor: 'pointer', fontFamily: SANS }}>+500cr</button>
                    </div>
                  </div>
                )
              })}
              {filtered.length === 0 && <div style={{ padding: '32px 20px', textAlign: 'center', color: C.t3, fontSize: 13 }}>{search ? 'No users match' : 'No users yet'}</div>}
            </div>
          </div>
        )}

        {/* ───── PLANS & PRICING ───── */}
        {activeTab === 'Plans & Pricing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.t1, margin: 0 }}>Plans & Pricing</h2>
                <p style={{ fontSize: 13, color: C.t3, marginTop: 4 }}>Changes save to Supabase and reflect instantly on landing, pricing, and settings pages — both EN and AR.</p>
              </div>
              <button onClick={() => setShowNewPlan(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, background: C.cyanD, border: `1px solid ${C.cyanB}`, color: C.cyan, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: SANS }}>
                {Ic.plus} Add Plan
              </button>
            </div>

            {/* New plan form */}
            {showNewPlan && (
              <div style={{ background: C.surface, border: `1px solid ${C.cyanB}`, borderRadius: 14, padding: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.cyan, marginBottom: 20 }}>New Plan</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 12 }}>
                  <Input label="Plan Name (EN)" value={newPlan.label} onChange={v => setNewPlan(p => ({ ...p, label: v }))} />
                  <Input label="Tagline (EN)" value={newPlan.tagline} onChange={v => setNewPlan(p => ({ ...p, tagline: v }))} />
                  <Input label="Tagline (AR)" value={newPlan.tagline_ar} onChange={v => setNewPlan(p => ({ ...p, tagline_ar: v }))} />
                  <Input label="Price ($/mo)" type="number" value={newPlan.price} prefix="$" onChange={v => setNewPlan(p => ({ ...p, price: v }))} />
                  <Input label="Credits/mo" type="number" value={newPlan.credits} onChange={v => setNewPlan(p => ({ ...p, credits: v }))} />
                  <div>
                    <div style={{ fontSize: 12, color: C.t3, marginBottom: 6, fontWeight: 500 }}>Accent Color</div>
                    <input type="color" value={newPlan.color} onChange={e => setNewPlan(p => ({ ...p, color: e.target.value }))} style={{ width: '100%', height: 38, borderRadius: 8, border: `1px solid ${C.border}`, background: C.overlay, cursor: 'pointer' }} />
                  </div>
                  <Input label="CTA Button (EN)" value={newPlan.cta_en} onChange={v => setNewPlan(p => ({ ...p, cta_en: v }))} />
                  <Input label="CTA Button (AR)" value={newPlan.cta_ar} onChange={v => setNewPlan(p => ({ ...p, cta_ar: v }))} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 22 }}>
                    <Toggle value={newPlan.popular} onChange={v => setNewPlan(p => ({ ...p, popular: v }))} />
                    <span style={{ fontSize: 13, color: C.t2 }}>Mark as "Most Popular"</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={addNewPlan} style={{ padding: '10px 20px', borderRadius: 8, background: C.cyan, border: 'none', color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: SANS }}>Create Plan</button>
                  <button onClick={() => setShowNewPlan(false)} style={{ padding: '10px 20px', borderRadius: 8, background: C.elevated, border: `1px solid ${C.border}`, color: C.t2, fontSize: 13, cursor: 'pointer', fontFamily: SANS }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Existing plans */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
              {plans.map((plan, idx) => (
                <div key={plan.id} style={{ background: C.surface, border: `1px solid ${plan.enabled ? C.borderS : C.error + '30'}`, borderRadius: 14, padding: 24, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: plan.color, opacity: plan.enabled ? 1 : 0.2 }} />
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: plan.color }}>{plan.label}</div>
                      <div style={{ fontSize: 12, color: C.t3, marginTop: 2 }}>{planCounts[plan.id] ?? 0} current users</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, color: plan.enabled ? C.success : C.error }}>{plan.enabled ? 'Visible' : 'Hidden'}</span>
                      <Toggle value={plan.enabled} onChange={v => setPlans(p => p.map((x, i) => i === idx ? { ...x, enabled: v } : x))} />
                      <button onClick={() => deletePlan(plan.id)} title="Remove plan" style={{ color: C.error, background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>{Ic.trash}</button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <Input label="Price ($/mo)" type="number" value={plan.price} prefix="$" onChange={v => setPlans(p => p.map((x, i) => i === idx ? { ...x, price: Number(v), price_cents: Number(v) * 100 } : x))} />
                    <Input label="Credits/mo" type="number" value={plan.credits} onChange={v => setPlans(p => p.map((x, i) => i === idx ? { ...x, credits: Number(v) } : x))} />
                    <Input label="CTA (EN)" value={plan.cta_en} onChange={v => setPlans(p => p.map((x, i) => i === idx ? { ...x, cta_en: v } : x))} />
                    <Input label="CTA (AR)" value={plan.cta_ar} onChange={v => setPlans(p => p.map((x, i) => i === idx ? { ...x, cta_ar: v } : x))} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Toggle value={plan.popular} onChange={v => setPlans(p => p.map((x, i) => i === idx ? { ...x, popular: v } : x))} />
                    <span style={{ fontSize: 12, color: C.t2 }}>Most Popular badge</span>
                  </div>
                  <div style={{ padding: '10px 14px', background: C.elevated, borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: C.t3 }}>Monthly revenue from plan</span>
                    <span style={{ fontSize: 13, fontWeight: 600, fontFamily: MONO, color: C.t1 }}>${((planCounts[plan.id] ?? 0) * plan.price).toLocaleString()}/mo</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={savePlans} disabled={saving} style={{ padding: '11px 22px', borderRadius: 9, background: saving ? C.t4 : C.cyan, border: 'none', color: saving ? C.t2 : '#000', fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer', fontFamily: SANS }}>
                {saving ? 'Saving…' : 'Save All Pricing Changes'}
              </button>
            </div>

            <div style={{ padding: '14px 16px', background: C.cyanD, border: `1px solid ${C.cyanB}`, borderRadius: 10, fontSize: 13, color: C.t2, lineHeight: 1.6 }}>
              <strong style={{ color: C.cyan }}>How it works:</strong> Plans are stored in the <code style={{ fontFamily: MONO, fontSize: 12, color: C.cyan }}>admin_plans</code> Supabase table. The pricing page, landing page, and settings page all read from this table in real-time. Adding or removing a plan here adds or removes it everywhere — including the Arabic version.
            </div>
          </div>
        )}

        {/* ───── FEATURES ───── */}
        {activeTab === 'Features' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.t1, margin: 0 }}>Feature Flags</h2>
              <p style={{ fontSize: 13, color: C.t3, marginTop: 4 }}>Toggle any feature globally — takes effect immediately for all users, both EN and AR. Saved to Supabase on every toggle.</p>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.borderS}`, borderRadius: 12, overflow: 'hidden' }}>
              {Object.entries(DEFAULT_FEATURES).map(([key, info], i, arr) => {
                const enabled = features[key] ?? true
                const impactColor = info.impact === 'high' ? C.error : info.impact === 'medium' ? C.warning : C.success
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 22px', borderBottom: i < arr.length - 1 ? `1px solid ${C.borderS}` : 'none' }}>
                    <Toggle value={enabled} onChange={v => toggleFeature(key, v)} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: enabled ? C.t1 : C.t3 }}>{info.label}</div>
                      <div style={{ fontSize: 12, color: C.t3, marginTop: 2 }}>{info.desc}</div>
                    </div>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: impactColor + '15', color: impactColor, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: MONO }}>{info.impact} impact</span>
                    <span style={{ fontSize: 11, fontFamily: MONO, color: enabled ? C.success : C.error, minWidth: 50, textAlign: 'right' }}>{enabled ? 'ON' : 'OFF'}</span>
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { Object.keys(DEFAULT_FEATURES).forEach(k => toggleFeature(k, true)) }} style={{ padding: '10px 20px', borderRadius: 8, background: C.successD, border: `1px solid ${C.success}30`, color: C.success, fontSize: 13, cursor: 'pointer', fontFamily: SANS }}>Enable All</button>
              <button onClick={() => { Object.keys(DEFAULT_FEATURES).forEach(k => toggleFeature(k, false)) }} style={{ padding: '10px 20px', borderRadius: 8, background: C.errorD, border: `1px solid ${C.error}30`, color: C.error, fontSize: 13, cursor: 'pointer', fontFamily: SANS }}>Disable All</button>
            </div>
          </div>
        )}

        {/* ───── DISCOUNTS ───── */}
        {activeTab === 'Discounts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.t1, margin: 0 }}>Discount Codes</h2>
              <p style={{ fontSize: 13, color: C.t3, marginTop: 4 }}>Codes with "Show Banner" enabled appear as a dismissible tag on the landing page and pricing page — in both English and Arabic.</p>
            </div>

            {/* Active codes table */}
            <div style={{ background: C.surface, border: `1px solid ${C.borderS}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 90px 80px 70px 70px 80px 70px 100px', padding: '10px 20px', borderBottom: `1px solid ${C.borderS}` }}>
                {['Code', 'Discount', 'Plan', 'Uses', 'Limit', 'Expires', 'Active', 'Banner'].map(h => (
                  <div key={h} style={{ fontSize: 11, color: C.t4, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</div>
                ))}
              </div>
              {promoCodes.map((c, i) => (
                <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '140px 90px 80px 70px 70px 80px 70px 100px', padding: '14px 20px', borderBottom: i < promoCodes.length - 1 ? `1px solid ${C.borderS}` : 'none', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: C.cyan }}>{c.code}</span>
                    <button onClick={() => { navigator.clipboard.writeText(c.code); showToast('Copied!') }} style={{ color: C.t4, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{Ic.copy}</button>
                  </div>
                  <div style={{ fontSize: 12, fontFamily: MONO, color: C.t1 }}>{c.type === 'percent' ? `${c.value}%` : `$${c.value}`} off</div>
                  <div style={{ fontSize: 12, color: C.t3 }}>{c.plan}</div>
                  <div style={{ fontSize: 13, fontFamily: MONO, color: C.t2 }}>{c.uses}</div>
                  <div style={{ fontSize: 13, fontFamily: MONO, color: C.t2 }}>{c.use_limit || '∞'}</div>
                  <div style={{ fontSize: 11, color: C.t3 }}>{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'Never'}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Toggle value={c.active} onChange={v => toggleCode(c.id, v)} />
                    <button onClick={() => deleteCode(c.id)} style={{ color: C.error, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{Ic.trash}</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Toggle value={c.show_banner} onChange={v => toggleBanner(c.id, v)} />
                    <span style={{ fontSize: 10, color: c.show_banner ? C.success : C.t4 }}>{c.show_banner ? 'Showing' : 'Hidden'}</span>
                  </div>
                </div>
              ))}
              {promoCodes.length === 0 && <div style={{ padding: '24px 20px', color: C.t3, fontSize: 13 }}>No promo codes yet</div>}
            </div>

            {/* Create new code */}
            <div style={{ background: C.surface, border: `1px solid ${C.borderS}`, borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.t1, marginBottom: 20 }}>Create Promo Code</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 14 }}>
                <Input label="Code" value={newCode.code} onChange={v => setNewCode(d => ({ ...d, code: v.toUpperCase() }))} />
                <Input label={newCode.type === 'percent' ? 'Discount %' : 'Amount ($)'} type="number" value={newCode.value} onChange={v => setNewCode(d => ({ ...d, value: v }))} />
                <div>
                  <div style={{ fontSize: 12, color: C.t3, marginBottom: 6, fontWeight: 500 }}>Type</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['percent', 'fixed'].map(t => (
                      <button key={t} onClick={() => setNewCode(d => ({ ...d, type: t }))} style={{ flex: 1, padding: '9px 0', borderRadius: 7, background: newCode.type === t ? C.cyanD : C.overlay, border: `1px solid ${newCode.type === t ? C.cyanB : C.border}`, color: newCode.type === t ? C.cyan : C.t2, fontSize: 12, cursor: 'pointer', fontFamily: SANS }}>
                        {t === 'percent' ? '% Off' : '$ Off'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 12, color: C.t3, marginBottom: 6, fontWeight: 500 }}>Apply to Plan</div>
                  <select value={newCode.plan} onChange={e => setNewCode(d => ({ ...d, plan: e.target.value }))} style={{ width: '100%', height: 38, borderRadius: 8, background: C.overlay, border: `1px solid ${C.border}`, color: C.t1, fontSize: 13, padding: '0 12px', outline: 'none', fontFamily: SANS }}>
                    <option value="all">All Plans</option>
                    {plans.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>
                <Input label="Max Uses (0 = unlimited)" type="number" value={newCode.limit} onChange={v => setNewCode(d => ({ ...d, limit: v }))} />
                <Input label="Expires (blank = never)" type="date" value={newCode.expires} onChange={v => setNewCode(d => ({ ...d, expires: v }))} />
              </div>

              {/* Banner options */}
              <div style={{ padding: 16, background: C.elevated, borderRadius: 10, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <Toggle value={newCode.show_banner} onChange={v => setNewCode(d => ({ ...d, show_banner: v }))} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>Show discount banner on landing & pricing pages</div>
                    <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>A dismissible banner appears at the top of both pages when this is on. Works in EN and AR.</div>
                  </div>
                </div>
                {newCode.show_banner && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Input label="Banner text (EN) — leave blank for auto" value={newCode.banner_text_en} onChange={v => setNewCode(d => ({ ...d, banner_text_en: v }))} />
                    <Input label="Banner text (AR) — leave blank for auto" value={newCode.banner_text_ar} onChange={v => setNewCode(d => ({ ...d, banner_text_ar: v }))} />
                  </div>
                )}
              </div>

              <button onClick={createCode} style={{ padding: '11px 22px', borderRadius: 9, background: C.cyan, border: 'none', color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: SANS }}>
                {Ic.plus} Create Code
              </button>
            </div>
          </div>
        )}

        {/* ───── REVENUE ───── */}
        {activeTab === 'Revenue' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.t1, margin: 0 }}>Revenue & Financials</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              <StatCard icon={Ic.dollar} label="MRR" value={`$${totalRevenue.toLocaleString()}`} sub="Monthly recurring revenue" color={C.success} />
              <StatCard icon={Ic.trend} label="ARR" value={`$${(totalRevenue * 12).toLocaleString()}`} sub="Annual run rate" color={C.cyan} />
              <StatCard icon={Ic.chart} label="ARPU" value={activeUsers > 0 ? `$${Math.round(totalRevenue / activeUsers)}` : '$0'} sub="Avg revenue per user" color={C.purple} />
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.borderS}`, borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.t1, marginBottom: 20 }}>Revenue Breakdown by Plan</div>
              {plans.map(p => {
                const count = planCounts[p.id] ?? 0
                const rev = count * p.price
                const pct = totalRevenue > 0 ? (rev / totalRevenue) * 100 : 0
                return (
                  <div key={p.id} style={{ marginBottom: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: C.t1 }}>{p.label}</span>
                        <span style={{ fontSize: 11, color: C.t3 }}>{count} users × ${p.price}/mo</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 12, color: C.t3, fontFamily: MONO }}>{Math.round(pct)}%</span>
                        <span style={{ fontSize: 14, fontWeight: 600, fontFamily: MONO, color: C.t1 }}>${rev.toLocaleString()}/mo</span>
                      </div>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: C.overlay }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: p.color, borderRadius: 3, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              {[
                { label: 'Active', count: activeUsers, color: C.success, bg: C.successD },
                { label: 'Trialing', count: trialUsers, color: C.warning, bg: C.warningD },
                { label: 'Canceled', count: canceledUsers, color: C.error, bg: C.errorD },
                { label: 'Past Due', count: workspaces.filter(w => w.plan_status === 'past_due').length, color: C.orange, bg: C.orangeD },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}25`, borderRadius: 12, padding: '18px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: MONO }}>{s.count}</div>
                  <div style={{ fontSize: 12, color: s.color, marginTop: 4, fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.borderS}`, borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.t1, marginBottom: 16 }}>Key Metrics</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
                {[
                  { label: 'Trial → Paid Conversion', value: trialUsers + activeUsers > 0 ? `${Math.round((activeUsers / (trialUsers + activeUsers)) * 100)}%` : '—' },
                  { label: 'Churn Rate', value: workspaces.length > 0 ? `${Math.round((canceledUsers / workspaces.length) * 100)}%` : '—' },
                  { label: 'Total Credits Balance', value: credits.reduce((s, c) => s + (c.balance || 0), 0).toLocaleString() },
                ].map(m => (
                  <div key={m.label}>
                    <div style={{ fontSize: 11, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6 }}>{m.label}</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: C.t1, fontFamily: MONO }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── USER MANAGE MODAL ─── */}
      {selectedUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }} onClick={() => setSelectedUser(null)}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, width: 520, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.t1 }}>{selectedUser.name}</div>
                <div style={{ fontSize: 13, color: C.t3, marginTop: 3 }}>{selectedUser.profiles?.email}</div>
              </div>
              <button onClick={() => setSelectedUser(null)} style={{ color: C.t3, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>
            <div style={{ background: C.elevated, borderRadius: 10, padding: '14px 16px', marginBottom: 24, display: 'flex', gap: 20 }}>
              <div><div style={{ fontSize: 11, color: C.t3, marginBottom: 4 }}>PLAN</div><PlanBadge plan={selectedUser.plan} /></div>
              <div><div style={{ fontSize: 11, color: C.t3, marginBottom: 4 }}>STATUS</div><span style={{ fontSize: 12, color: selectedUser.plan_status === 'active' ? C.success : C.warning }}>{selectedUser.plan_status}</span></div>
              <div><div style={{ fontSize: 11, color: C.t3, marginBottom: 4 }}>CREDITS</div><span style={{ fontFamily: MONO, fontSize: 13, color: C.t1 }}>{credits.find(c => c.workspace_id === selectedUser.id)?.balance ?? 0}</span></div>
            </div>
            {/* Change plan */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.t1, marginBottom: 12 }}>Change Plan</div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(plans.length, 4)},1fr)`, gap: 8 }}>
                {plans.map(p => (
                  <button key={p.id} onClick={() => updateUserPlan(selectedUser.id, p.id)} style={{ padding: '10px 0', borderRadius: 8, background: selectedUser.plan === p.id ? p.color + '20' : C.overlay, border: `1px solid ${selectedUser.plan === p.id ? p.color + '40' : C.border}`, color: selectedUser.plan === p.id ? p.color : C.t2, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: SANS }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Free access */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.t1, marginBottom: 12 }}>Give Free Access + Credits</div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(plans.length, 4)},1fr)`, gap: 8 }}>
                {plans.map(p => (
                  <button key={p.id} onClick={() => giveFreeAccess(selectedUser.id, p.id)} style={{ padding: '10px 0', borderRadius: 8, background: C.successD, border: `1px solid ${C.success}25`, color: C.success, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, fontFamily: SANS }}>
                    <span>{Ic.gift}</span><span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* Add credits */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.t1, marginBottom: 12 }}>Add Credits</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                {[100, 500, 1000, 5000].map(n => (
                  <button key={n} onClick={() => addCredits(selectedUser.id, n)} style={{ padding: '10px 0', borderRadius: 8, background: C.cyanD, border: `1px solid ${C.cyanB}`, color: C.cyan, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: MONO }}>+{n.toLocaleString()}</button>
                ))}
              </div>
            </div>
            {/* Danger zone */}
            <div style={{ borderTop: `1px solid ${C.borderS}`, paddingTop: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.t1, marginBottom: 12 }}>Danger Zone</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={async () => { await supabase.from('workspaces').update({ plan: 'spark', plan_status: 'active' }).eq('id', selectedUser.id); showToast('Downgraded to Spark'); load(); setSelectedUser(null) }} style={{ flex: 1, padding: '10px 0', borderRadius: 8, background: C.warningD, border: `1px solid ${C.warning}25`, color: C.warning, fontSize: 12, cursor: 'pointer', fontFamily: SANS }}>
                  Downgrade to Spark
                </button>
                <button onClick={async () => { await supabase.from('workspaces').update({ plan_status: 'canceled' }).eq('id', selectedUser.id); showToast('Account canceled', 'error'); load(); setSelectedUser(null) }} style={{ flex: 1, padding: '10px 0', borderRadius: 8, background: C.errorD, border: `1px solid ${C.error}25`, color: C.error, fontSize: 12, cursor: 'pointer', fontFamily: SANS }}>
                  Cancel Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
