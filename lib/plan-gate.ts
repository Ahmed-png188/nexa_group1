import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// ── Constants (re-exported from plan-constants for server use) ─
export { CREDIT_COSTS, TOPUP_PACKS, CREDIT_THRESHOLDS, PLAN_CREDITS } from '@/lib/plan-constants'
import { CREDIT_COSTS } from '@/lib/plan-constants'

// ── Plan definitions ──────────────────────────────────────────
export const PLAN_FEATURES = {
  spark: {
    label: 'Spark',
    tagline: 'The Creator',
    price: 4900,
    credits: 1000,
    trial_days: 7,
    features: {
      // Brand Brain — all plans
      brand_brain:          true,
      brand_assets_limit:   5,
      // Studio — all plans get all types, credits handle fairness
      copy_generation:      true,
      image_generation:     true,
      video_generation:     true,
      voice_generation:     true,
      studio_amplify_boost: false,   // needs Amplify
      // Strategy
      strategy:             true,
      competitor_analysis:  false,
      performance_learning: false,
      // Schedule
      schedule:             true,
      schedule_platforms:   2,
      schedule_posts_mo:    60,
      // Automate
      email_sequences:      false,
      contacts_limit:       0,
      emails_per_month:     0,
      behavioral_triggers:  false,
      ab_testing:           false,
      kit_integration:      false,
      typeform_webhook:      false,
      // Lead Page
      lead_page:            true,
      lead_magnet:          true,
      lead_add_contacts:    false,
      lead_auto_enroll:     false,
      lead_remove_branding: false,
      custom_sender_domain: false,
      // Landing Page & Products
      landing_page:          true,
      landing_page_products: 3,
      landing_custom_domain: false,
      // Amplify
      amplify:              false,
      amplify_ai_monitor:   false,
      // Insights
      insights_basic:       true,
      insights_full:        false,
      insights_export:      false,
      // Integrations
      custom_webhooks:      false,
      zapier:               false,
      // Workspace
      team_members:         1,
      // Agency
      agency_mode:          false,
      product_lab:          true,
    },
  },

  grow: {
    label: 'Grow',
    tagline: 'The Grower',
    price: 8900,
    credits: 3000,
    trial_days: 0,
    features: {
      brand_brain:          true,
      brand_assets_limit:   25,
      copy_generation:      true,
      image_generation:     true,
      video_generation:     true,
      voice_generation:     true,
      studio_amplify_boost: true,
      strategy:             true,
      competitor_analysis:  true,
      performance_learning: true,
      schedule:             true,
      schedule_platforms:   4,
      schedule_posts_mo:    9999,
      email_sequences:      true,
      contacts_limit:       2500,
      emails_per_month:     3000,
      behavioral_triggers:  false,
      ab_testing:           false,
      kit_integration:      true,
      typeform_webhook:      true,
      lead_page:            true,
      lead_magnet:          true,
      lead_add_contacts:    true,
      lead_auto_enroll:     true,
      lead_remove_branding: false,
      custom_sender_domain: false,
      // Landing Page & Products
      landing_page:          true,
      landing_page_products: 10,
      landing_custom_domain: true,
      amplify:              true,
      amplify_ai_monitor:   false,
      insights_basic:       true,
      insights_full:        true,
      insights_export:      false,
      custom_webhooks:      false,
      zapier:               false,
      team_members:         2,
      agency_mode:          false,
      product_lab:          true,
    },
  },

  scale: {
    label: 'Scale',
    tagline: 'The Operator',
    price: 16900,
    credits: 7000,
    trial_days: 0,
    features: {
      brand_brain:          true,
      brand_assets_limit:   100,
      copy_generation:      true,
      image_generation:     true,
      video_generation:     true,
      voice_generation:     true,
      studio_amplify_boost: true,
      strategy:             true,
      competitor_analysis:  true,
      performance_learning: true,
      schedule:             true,
      schedule_platforms:   9999,
      schedule_posts_mo:    9999,
      email_sequences:      true,
      contacts_limit:       15000,
      emails_per_month:     20000,
      behavioral_triggers:  true,
      ab_testing:           true,
      kit_integration:      true,
      typeform_webhook:      true,
      lead_page:            true,
      lead_magnet:          true,
      lead_add_contacts:    true,
      lead_auto_enroll:     true,
      lead_remove_branding: true,
      custom_sender_domain: true,
      // Landing Page & Products
      landing_page:          true,
      landing_page_products: -1,
      landing_custom_domain: true,
      amplify:              true,
      amplify_ai_monitor:   true,
      insights_basic:       true,
      insights_full:        true,
      insights_export:      true,
      custom_webhooks:      true,
      zapier:               true,
      team_members:         5,
      agency_mode:          false,
      product_lab:          true,
    },
  },

  agency: {
    label: 'Agency',
    tagline: 'The Agency',
    price: 34900,
    credits: 20000,
    trial_days: 0,
    features: {
      brand_brain:          true,
      brand_assets_limit:   9999,
      copy_generation:      true,
      image_generation:     true,
      video_generation:     true,
      voice_generation:     true,
      studio_amplify_boost: true,
      strategy:             true,
      competitor_analysis:  true,
      performance_learning: true,
      schedule:             true,
      schedule_platforms:   9999,
      schedule_posts_mo:    9999,
      email_sequences:      true,
      contacts_limit:       9999999,
      emails_per_month:     100000,
      behavioral_triggers:  true,
      ab_testing:           true,
      kit_integration:      true,
      typeform_webhook:      true,
      lead_page:            true,
      lead_magnet:          true,
      lead_add_contacts:    true,
      lead_auto_enroll:     true,
      lead_remove_branding: true,
      custom_sender_domain: true,
      // Landing Page & Products
      landing_page:          true,
      landing_page_products: -1,
      landing_custom_domain: true,
      amplify:              true,
      amplify_ai_monitor:   true,
      insights_basic:       true,
      insights_full:        true,
      insights_export:      true,
      custom_webhooks:      true,
      zapier:               true,
      team_members:         25,
      agency_mode:          true,
      product_lab:          true,
    },
  },

  // Trial = Grow features, time-limited
  trial: {
    label: 'Trial',
    tagline: 'Trial',
    price: 0,
    credits: 200,
    trial_days: 7,
    features: {
      brand_brain:          true,
      brand_assets_limit:   5,
      copy_generation:      true,
      image_generation:     true,
      video_generation:     true,
      voice_generation:     true,
      studio_amplify_boost: false,
      strategy:             true,
      competitor_analysis:  false,
      performance_learning: false,
      schedule:             true,
      schedule_platforms:   2,
      schedule_posts_mo:    20,
      email_sequences:      false,
      contacts_limit:       0,
      emails_per_month:     0,
      behavioral_triggers:  false,
      ab_testing:           false,
      kit_integration:      false,
      typeform_webhook:      false,
      lead_page:            true,
      lead_magnet:          false,
      lead_add_contacts:    false,
      lead_auto_enroll:     false,
      lead_remove_branding: false,
      custom_sender_domain: false,
      // Landing Page & Products
      landing_page:          true,
      landing_page_products: 3,
      landing_custom_domain: false,
      amplify:              false,
      amplify_ai_monitor:   false,
      insights_basic:       true,
      insights_full:        false,
      insights_export:      false,
      custom_webhooks:      false,
      zapier:               false,
      team_members:         1,
      agency_mode:          false,
      product_lab:          true,
    },
  },
} as const

export type PlanId = keyof typeof PLAN_FEATURES
export type PlanFeature = keyof typeof PLAN_FEATURES.spark.features

// ── Trial status ──────────────────────────────────────────────
export function getTrialStatus(workspace: any) {
  if (workspace.plan_status !== 'trialing') {
    return { isTrialing: false, isExpired: false, daysLeft: 0, trialEndDate: null }
  }
  const createdAt  = new Date(workspace.created_at)
  const trialEnd   = new Date(createdAt.getTime() + 7 * 86400000)
  const now        = new Date()
  const daysLeft   = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000))
  return { isTrialing: true, isExpired: now > trialEnd, daysLeft, trialEndDate: trialEnd }
}

// ── Get plan features for a workspace ────────────────────────
export function getPlanFeatures(plan: string, planStatus: string, createdAt: string) {
  if (planStatus === 'trialing') {
    const trial = getTrialStatus({ plan_status: 'trialing', created_at: createdAt })
    if (!trial.isExpired) return PLAN_FEATURES.trial.features
  }
  return PLAN_FEATURES[plan as PlanId]?.features ?? PLAN_FEATURES.spark.features
}

// ── Main gate — checks plan feature access ───────────────────
export async function checkPlanAccess(
  workspaceId: string,
  feature: PlanFeature,
): Promise<NextResponse | null> {
  const supabase = createClient()
  const { data: ws } = await supabase
    .from('workspaces')
    .select('plan, plan_status, created_at')
    .eq('id', workspaceId)
    .single()

  if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const status = ws.plan_status ?? 'trialing'

  // Hard block canceled/past_due
  if (status === 'canceled' || status === 'past_due') {
    return NextResponse.json({
      error: 'Subscription required',
      code: 'SUBSCRIPTION_INACTIVE',
      message: status === 'past_due'
        ? 'Your payment failed. Please update your payment method.'
        : 'Your subscription has been canceled. Reactivate to continue.',
      upgrade_url: '/dashboard/settings?tab=billing',
    }, { status: 402 })
  }

  // Trial expiry
  if (status === 'trialing') {
    const trial = getTrialStatus(ws)
    if (trial.isExpired) {
      return NextResponse.json({
        error: 'Trial expired',
        code: 'TRIAL_EXPIRED',
        message: 'Your 7-day trial has ended. Choose a plan to continue.',
        upgrade_url: '/dashboard/settings?tab=billing',
      }, { status: 402 })
    }
    const allowed = PLAN_FEATURES.trial.features[feature]
    if (!allowed) {
      return NextResponse.json({
        error: 'Upgrade required',
        code: 'UPGRADE_REQUIRED',
        message: `${formatFeature(feature)} is not available on trial. Upgrade to unlock it.`,
        feature,
        upgrade_url: '/dashboard/settings?tab=billing',
      }, { status: 402 })
    }
    return null
  }

  // Active subscription
  const planFeatures = PLAN_FEATURES[ws.plan as PlanId]?.features
  if (!planFeatures) return null

  if (!planFeatures[feature]) {
    const requiredPlan = getRequiredPlan(feature)
    const currentLabel = PLAN_FEATURES[ws.plan as PlanId]?.label ?? ws.plan
    return NextResponse.json({
      error: 'Plan upgrade required',
      code: 'UPGRADE_REQUIRED',
      message: `${formatFeature(feature)} requires the ${requiredPlan} plan. You&apos;re on ${currentLabel}.`,
      feature,
      current_plan: ws.plan,
      required_plan: requiredPlan.toLowerCase(),
      upgrade_url: '/dashboard/settings?tab=billing',
    }, { status: 402 })
  }

  return null
}

// ── Credit gate — blocks generation when credits = 0 ─────────
export async function checkCredits(
  workspaceId: string,
  userId: string,
  amount: number,
  action: string,
  description: string,
): Promise<{ ok: boolean; error?: NextResponse }> {
  const supabase = createClient()

  const { data: deducted } = await supabase.rpc('deduct_credits', {
    p_workspace_id: workspaceId,
    p_amount:       amount,
    p_action:       action,
    p_user_id:      userId,
    p_description:  description,
  })

  if (!deducted) {
    return {
      ok: false,
      error: NextResponse.json({
        error: 'Insufficient credits',
        code: 'NO_CREDITS',
        message: `This action costs ${amount} credits. Top up to continue.`,
        credits_needed: amount,
        topup_url: '/dashboard/settings?tab=billing',
      }, { status: 402 }),
    }
  }

  return { ok: true }
}

// ── Helpers ───────────────────────────────────────────────────
function getRequiredPlan(feature: PlanFeature): string {
  const tiers = ['spark', 'grow', 'scale', 'agency'] as const
  for (const tier of tiers) {
    if (PLAN_FEATURES[tier].features[feature]) return PLAN_FEATURES[tier].label
  }
  return 'Scale'
}

function formatFeature(feature: PlanFeature): string {
  const map: Partial<Record<PlanFeature, string>> = {
    image_generation:     'Image generation',
    video_generation:     'Video generation',
    voice_generation:     'Voice generation',
    email_sequences:      'Email sequences',
    competitor_analysis:  'Competitor analysis',
    agency_mode:          'Agency mode',
    custom_webhooks:      'Custom webhooks',
    amplify:              'Amplify (Meta Ads)',
    amplify_ai_monitor:   'AI ad monitor',
    lead_remove_branding: 'Remove Nexa branding',
    custom_sender_domain: 'Custom sender domain',
    landing_page:         'Landing page',
    landing_custom_domain:'Custom domain for landing page',
    behavioral_triggers:  'Behavioral triggers',
    ab_testing:           'A/B testing',
    insights_full:        'Full analytics',
    insights_export:      'Analytics export',
    studio_amplify_boost: 'Boost to Amplify',
    lead_add_contacts:    'Add leads to contacts',
    lead_auto_enroll:     'Auto-enroll leads',
    zapier:               'Zapier integration',
  }
  return map[feature] ?? feature.replace(/_/g, ' ')
}

// ── Expose for UI ─────────────────────────────────────────────
export async function getWorkspacePlanInfo(workspaceId: string) {
  const supabase = createClient()
  const { data: ws } = await supabase
    .from('workspaces')
    .select('plan, plan_status, created_at')
    .eq('id', workspaceId)
    .single()

  if (!ws) return null

  const plan    = ws.plan ?? 'spark'
  const status  = ws.plan_status ?? 'trialing'
  const trial   = getTrialStatus(ws)
  const config  = PLAN_FEATURES[plan as PlanId] ?? PLAN_FEATURES.spark

  return {
    plan, status, config, trial,
    isActive:   status === 'active',
    isTrialing: trial.isTrialing && !trial.isExpired,
    isExpired:  trial.isExpired,
    isCanceled: status === 'canceled' || status === 'past_due',
    features:   getPlanFeatures(plan, status, ws.created_at),
  }
}
