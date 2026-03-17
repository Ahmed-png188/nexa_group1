import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// ── Plan feature definitions ──────────────────────────────
// Each plan unlocks cumulative features
export const PLAN_FEATURES = {
  spark: {
    label: 'Spark',
    price: 39,
    credits: 500,
    trial_days: 7,
    features: {
      copy_generation:     true,
      brand_brain:         true,
      strategy:            true,
      schedule:            true,
      analytics_basic:     true,
      image_generation:    false,
      video_generation:    false,
      voice_generation:    false,
      email_sequences:     false,
      competitor_analysis: false,
      agency_mode:         false,
      webhooks:            false,
    },
    limits: {
      scheduled_posts:  10,
      brand_assets:     5,
      sequences:        0,
      team_members:     1,
    },
  },
  grow: {
    label: 'Grow',
    price: 89,
    credits: 1500,
    trial_days: 7,
    features: {
      copy_generation:     true,
      brand_brain:         true,
      strategy:            true,
      schedule:            true,
      analytics_basic:     true,
      image_generation:    true,
      video_generation:    false,
      voice_generation:    false,
      email_sequences:     true,
      competitor_analysis: false,
      agency_mode:         false,
      webhooks:            true,
    },
    limits: {
      scheduled_posts:  50,
      brand_assets:     20,
      sequences:        3,
      team_members:     3,
    },
  },
  scale: {
    label: 'Scale',
    price: 179,
    credits: 5000,
    trial_days: 7,
    features: {
      copy_generation:     true,
      brand_brain:         true,
      strategy:            true,
      schedule:            true,
      analytics_basic:     true,
      image_generation:    true,
      video_generation:    true,
      voice_generation:    true,
      email_sequences:     true,
      competitor_analysis: true,
      agency_mode:         false,
      webhooks:            true,
    },
    limits: {
      scheduled_posts:  200,
      brand_assets:     100,
      sequences:        20,
      team_members:     5,
    },
  },
  agency: {
    label: 'Agency',
    price: 349,
    credits: 15000,
    trial_days: 7,
    features: {
      copy_generation:     true,
      brand_brain:         true,
      strategy:            true,
      schedule:            true,
      analytics_basic:     true,
      image_generation:    true,
      video_generation:    true,
      voice_generation:    true,
      email_sequences:     true,
      competitor_analysis: true,
      agency_mode:         true,
      webhooks:            true,
    },
    limits: {
      scheduled_posts:  9999,
      brand_assets:     500,
      sequences:        999,
      team_members:     25,
    },
  },
  trial: {
    // Trial = Grow features, expires after trial_days
    label: 'Trial',
    price: 0,
    credits: 500,
    trial_days: 7,
    features: {
      copy_generation:     true,
      brand_brain:         true,
      strategy:            true,
      schedule:            true,
      analytics_basic:     true,
      image_generation:    true,   // trial gets a taste of images
      video_generation:    false,
      voice_generation:    false,
      email_sequences:     false,
      competitor_analysis: false,
      agency_mode:         false,
      webhooks:            false,
    },
    limits: {
      scheduled_posts:  5,
      brand_assets:     3,
      sequences:        0,
      team_members:     1,
    },
  },
}

export type PlanFeature = keyof typeof PLAN_FEATURES.spark.features

// ── Trial status ──────────────────────────────────────────
export function getTrialStatus(workspace: any): {
  isTrialing: boolean
  isExpired: boolean
  daysLeft: number
  trialEndDate: Date | null
} {
  if (workspace.plan_status !== 'trialing') {
    return { isTrialing: false, isExpired: false, daysLeft: 0, trialEndDate: null }
  }

  const createdAt   = new Date(workspace.created_at)
  const trialDays   = PLAN_FEATURES.trial.trial_days
  const trialEnd    = new Date(createdAt.getTime() + trialDays * 86400000)
  const now         = new Date()
  const daysLeft    = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000))
  const isExpired   = now > trialEnd

  return { isTrialing: true, isExpired, daysLeft, trialEndDate: trialEnd }
}

// ── Main gate function ────────────────────────────────────
// Returns null if access is allowed, or a NextResponse error if blocked
export async function checkPlanAccess(
  workspaceId: string,
  feature: PlanFeature,
): Promise<NextResponse | null> {
  const supabase = createClient()

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('plan, plan_status, created_at')
    .eq('id', workspaceId)
    .single()

  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const plan   = workspace.plan ?? 'spark'
  const status = workspace.plan_status ?? 'trialing'

  // ── CANCELED: hard block ──
  if (status === 'canceled' || status === 'past_due') {
    return NextResponse.json({
      error: 'Subscription required',
      code: 'SUBSCRIPTION_INACTIVE',
      message: status === 'past_due'
        ? 'Your payment failed. Please update your payment method to continue.'
        : 'Your subscription has been canceled. Reactivate to access Nexa.',
      upgrade_url: '/dashboard/settings?tab=billing',
    }, { status: 402 })
  }

  // ── TRIALING: check expiry ──
  if (status === 'trialing') {
    const trial = getTrialStatus(workspace)

    if (trial.isExpired) {
      return NextResponse.json({
        error: 'Trial expired',
        code: 'TRIAL_EXPIRED',
        message: 'Your 7-day trial has ended. Upgrade to continue building your brand.',
        days_left: 0,
        upgrade_url: '/dashboard/settings?tab=billing',
      }, { status: 402 })
    }

    // Trial is active — check trial feature set
    const trialFeatures = PLAN_FEATURES.trial.features
    if (!trialFeatures[feature]) {
      const requiredPlan = getRequiredPlan(feature)
      return NextResponse.json({
        error: 'Feature not available on trial',
        code: 'UPGRADE_REQUIRED',
        message: `${formatFeature(feature)} requires the ${requiredPlan} plan. Your trial includes copy, images, strategy, and scheduling.`,
        feature,
        required_plan: requiredPlan,
        trial_days_left: trial.daysLeft,
        upgrade_url: `/dashboard/settings?tab=billing`,
      }, { status: 402 })
    }

    return null // trial access granted
  }

  // ── ACTIVE subscription: check plan tier ──
  const planFeatures = PLAN_FEATURES[plan as keyof typeof PLAN_FEATURES]?.features
  if (!planFeatures) return null // unknown plan, allow

  if (!planFeatures[feature]) {
    const requiredPlan = getRequiredPlan(feature)
    return NextResponse.json({
      error: 'Plan upgrade required',
      code: 'UPGRADE_REQUIRED',
      message: `${formatFeature(feature)} requires the ${requiredPlan} plan. You're on ${PLAN_FEATURES[plan as keyof typeof PLAN_FEATURES]?.label ?? plan}.`,
      feature,
      current_plan: plan,
      required_plan: requiredPlan,
      upgrade_url: `/dashboard/settings?tab=billing`,
    }, { status: 402 })
  }

  return null // access granted
}

// ── Helpers ───────────────────────────────────────────────
function getRequiredPlan(feature: PlanFeature): string {
  const tiers = ['spark', 'grow', 'scale', 'agency'] as const
  for (const tier of tiers) {
    if (PLAN_FEATURES[tier].features[feature]) return tier
  }
  return 'scale'
}

function formatFeature(feature: PlanFeature): string {
  const map: Partial<Record<PlanFeature, string>> = {
    image_generation:    'Image generation',
    video_generation:    'Video generation',
    voice_generation:    'Voice generation',
    email_sequences:     'Email sequences',
    competitor_analysis: 'Competitor analysis',
    agency_mode:         'Agency mode',
    webhooks:            'Webhooks & automations',
    strategy:            'Strategy builder',
  }
  return map[feature] ?? feature.replace(/_/g, ' ')
}

// ── Expose plan info for UI ───────────────────────────────
export async function getWorkspacePlanInfo(workspaceId: string) {
  const supabase = createClient()
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('plan, plan_status, created_at')
    .eq('id', workspaceId)
    .single()

  if (!workspace) return null

  const plan   = workspace.plan ?? 'spark'
  const status = workspace.plan_status ?? 'trialing'
  const trial  = getTrialStatus(workspace)
  const config = PLAN_FEATURES[plan as keyof typeof PLAN_FEATURES] ?? PLAN_FEATURES.spark

  return {
    plan,
    status,
    config,
    trial,
    isActive: status === 'active',
    isTrialing: trial.isTrialing && !trial.isExpired,
    isExpired: trial.isExpired,
    isCanceled: status === 'canceled' || status === 'past_due',
    features: status === 'trialing' && !trial.isExpired
      ? PLAN_FEATURES.trial.features
      : config.features,
  }
}
