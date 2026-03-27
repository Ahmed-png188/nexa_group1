// ── Pure constants — safe to import in both client and server ──
// No server-only imports here. Used by DashboardShell and settings page.

// ── Dynamic credit thresholds (plan-relative) ────────────────
export function getCreditThresholds(planCredits: number) {
  return {
    LOW:      Math.round(planCredits * 0.20),
    CRITICAL: Math.round(planCredits * 0.08),
    EMPTY:    0,
  }
}

// Legacy static thresholds — kept for backward compat; prefer getCreditThresholds
export const CREDIT_THRESHOLDS = {
  LOW:      200,
  CRITICAL:  80,
  EMPTY:      0,
} as const

// ── Plan-aware top-up packs ───────────────────────────────────
export const TOPUP_PACKS_BY_PLAN: Record<string, { credits: number; price: number; label: string; tag: string }[]> = {
  spark: [
    { credits: 200,  price: 1000, label: '200 credits',   tag: 'Quick boost' },
    { credits: 500,  price: 2500, label: '500 credits',   tag: '' },
    { credits: 1000, price: 4500, label: '1,000 credits', tag: 'Best value' },
    { credits: 2500, price: 9900, label: '2,500 credits', tag: 'Power pack' },
  ],
  grow: [
    { credits: 500,  price: 1500,  label: '500 credits',   tag: 'Quick boost' },
    { credits: 1500, price: 4500,  label: '1,500 credits', tag: '' },
    { credits: 3000, price: 8900,  label: '3,000 credits', tag: 'Best value' },
    { credits: 7500, price: 19900, label: '7,500 credits', tag: 'Power pack' },
  ],
  scale: [
    { credits: 1000,  price: 2400,  label: '1,000 credits',  tag: 'Quick boost' },
    { credits: 3500,  price: 8400,  label: '3,500 credits',  tag: '' },
    { credits: 7000,  price: 16900, label: '7,000 credits',  tag: 'Best value' },
    { credits: 15000, price: 32900, label: '15,000 credits', tag: 'Power pack' },
  ],
  agency: [
    { credits: 2500,  price: 4300,  label: '2,500 credits',  tag: 'Quick boost' },
    { credits: 7500,  price: 13000, label: '7,500 credits',  tag: '' },
    { credits: 20000, price: 34900, label: '20,000 credits', tag: 'Best value' },
    { credits: 50000, price: 79900, label: '50,000 credits', tag: 'Power pack' },
  ],
  trial: [
    { credits: 200,  price: 1000, label: '200 credits',   tag: 'Quick boost' },
    { credits: 500,  price: 2500, label: '500 credits',   tag: '' },
    { credits: 1000, price: 4500, label: '1,000 credits', tag: 'Best value' },
    { credits: 2500, price: 9900, label: '2,500 credits', tag: 'Power pack' },
  ],
}

// Backward compat: default pack list uses spark tier
export const TOPUP_PACKS = TOPUP_PACKS_BY_PLAN.spark

// ── Credit costs ─────────────────────────────────────────────
export const CREDIT_COSTS = {
  // Text
  post:       3,
  caption:    3,
  hook:       3,
  bio:        3,
  story:      3,
  thread:     5,
  email:      5,
  ad:         5,
  full_piece: 10,
  // Media
  image:      5,
  voice_30s:  5,
  voice_60s:  10,
  voice_3min: 39,
  // Product Lab — AI Photography
  product_clean:      2,
  product_studio:     5,
  product_lifestyle:  8,
  product_upscale:    3,
  product_edit:       4,
  // Storyboard — Kling v3 pro image-to-video, cinema quality per shot
  storyboard_3shot:   258,
  storyboard_4shot:   344,
  storyboard_5shot:   430,
} as const

// ── Video credit costs ────────────────────────────────────────
// Structure: VIDEO_CREDIT_COSTS[duration][mode][audio]
// duration: 5 | 8 | 10 | 16
// mode: 'standard' | 'cinema' | 'frame'
// audio: true (with audio) | false (silent)
export const VIDEO_CREDIT_COSTS: Record<number, Record<string, { silent: number; audio: number }>> = {
  5: {
    standard: { silent: 65,  audio: 97  },
    cinema:   { silent: 58,  audio: 86  },
    frame:    { silent: 49,  audio: 65  },
  },
  8: {
    standard: { silent: 103, audio: 155 },
    cinema:   { silent: 92,  audio: 138 },
    frame:    { silent: 78,  audio: 103 },
  },
  10: {
    standard: { silent: 129, audio: 193 },
    cinema:   { silent: 115, audio: 172 },
    frame:    { silent: 97,  audio: 129 },
  },
  16: {
    standard: { silent: 206, audio: 309 },
    cinema:   { silent: 184, audio: 276 },
    frame:    { silent: 155, audio: 206 },
  },
}

export function getVideoCreditCost(
  duration: 5 | 8 | 10 | 16,
  mode: 'standard' | 'cinema' | 'frame',
  audio: boolean
): number {
  const tier = VIDEO_CREDIT_COSTS[duration]?.[mode]
  if (!tier) return VIDEO_CREDIT_COSTS[8].standard.audio
  return audio ? tier.audio : tier.silent
}

// ── Plan credits ──────────────────────────────────────────────
export const PLAN_CREDITS: Record<string, number> = {
  trial:  200,
  spark:  1000,
  grow:   3000,
  scale:  7000,
  agency: 20000,
}

// ── Plan features + helpers (safe for client) ─────────────────

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
      // Product Lab
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

  // Trial = 7-day limited access, 200 credits only
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

export function getPlanFeatures(plan: string, planStatus: string, createdAt: string) {
  if (planStatus === 'trialing') {
    const trial = getTrialStatus({ plan_status: 'trialing', created_at: createdAt })
    if (!trial.isExpired) return PLAN_FEATURES.trial.features
  }
  return PLAN_FEATURES[plan as PlanId]?.features ?? PLAN_FEATURES.spark.features
}
