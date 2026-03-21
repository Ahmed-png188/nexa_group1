'use client'
// Renders children if plan feature is available, otherwise shows upgrade prompt
// Usage: wrap page content with <UpgradeGate feature="amplify" plan={workspace.plan} status={workspace.plan_status} createdAt={workspace.created_at}>

import { PLAN_FEATURES, CREDIT_THRESHOLDS, getTrialStatus, getPlanFeatures } from '@/lib/plan-constants'
import Link from 'next/link'

type PlanFeature = keyof typeof PLAN_FEATURES.spark.features

interface Props {
  feature: PlanFeature
  plan: string
  status: string
  createdAt: string
  requiredPlanLabel?: string
  children: React.ReactNode
}

export default function UpgradeGate({ feature, plan, status, createdAt, requiredPlanLabel, children }: Props) {
  const features = getPlanFeatures(plan, status, createdAt)
  const hasAccess = features[feature]

  if (hasAccess) return <>{children}</>

  // Find which plan unlocks this
  const tiers = ['spark', 'grow', 'scale', 'agency'] as const
  const requiredPlan = tiers.find(t => PLAN_FEATURES[t].features[feature]) ?? 'grow'
  const planLabel = requiredPlanLabel ?? PLAN_FEATURES[requiredPlan].label
  const planPrice = PLAN_FEATURES[requiredPlan].price / 100

  const isTrialExpired = status === 'trialing' && getTrialStatus({ plan_status: status, created_at: createdAt }).isExpired

  return (
    <div className="nexa-page" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div style={{ maxWidth:400, textAlign:'center', padding:'0 20px' }}>
        {/* Lock icon */}
        <div style={{ width:56, height:56, borderRadius:16, background:'rgba(0,170,255,0.08)', border:'1px solid rgba(0,170,255,0.20)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="1.5" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <div style={{ fontSize:20, fontWeight:700, letterSpacing:'-0.03em', color:'var(--text-1)', marginBottom:8 }}>
          {isTrialExpired ? 'Trial ended' : `Upgrade to ${planLabel}`}
        </div>

        <div style={{ fontSize:13, color:'var(--text-3)', lineHeight:1.65, marginBottom:24 }}>
          {isTrialExpired
            ? 'Your 7-day trial has ended. Choose a plan to keep building your brand.'
            : `This feature is available on the ${planLabel} plan and above. Upgrade to unlock it — starting at $${planPrice}/mo.`}
        </div>

        <Link href="/dashboard/settings?tab=billing"
          style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'11px 24px', background:'var(--cyan)', color:'#000', borderRadius:10, fontWeight:700, fontSize:13, textDecoration:'none', letterSpacing:'-0.01em' }}>
          {isTrialExpired ? 'Choose a plan →' : `Upgrade to ${planLabel} →`}
        </Link>

        <div style={{ marginTop:14, fontSize:11, color:'var(--text-4)' }}>
          7-day free trial on Spark · Cancel anytime
        </div>
      </div>
    </div>
  )
}
