// ── Pure constants — safe to import in both client and server ──
// No server-only imports here. Used by DashboardShell and settings page.

export const CREDIT_THRESHOLDS = {
  LOW:      100,   // show yellow "Low" badge
  CRITICAL:  20,   // show red "Critical" badge + top-up prompt
  EMPTY:      0,   // block generation, show top-up modal
} as const

export const TOPUP_PACKS = [
  { credits: 100,  price: 500,   label: '100 credits',   tag: '' },
  { credits: 300,  price: 1200,  label: '300 credits',   tag: 'Popular' },
  { credits: 700,  price: 2500,  label: '700 credits',   tag: '' },
  { credits: 1500, price: 4500,  label: '1,500 credits', tag: 'Best value' },
  { credits: 3500, price: 8900,  label: '3,500 credits', tag: '' },
] as const

export const CREDIT_COSTS = {
  // Text
  post:       3,
  caption:    2,
  hook:       2,
  bio:        2,
  story:      2,
  thread:     5,
  email:      5,
  ad:         5,
  full_piece: 10,
  // Media
  image:      5,
  video_8s:   10,
  video_16s:  20,
  voice_30s:  5,
  voice_60s:  10,
  voice_3min: 20,
} as const

export const PLAN_CREDITS: Record<string, number> = {
  spark:  500,
  grow:   1500,
  scale:  4000,
  agency: 12000,
  trial:  150,
}


// ── Plan features + helpers (safe for client) ────────────────

export const PLAN_FEATURES = {
  spark: {
    label: 'Spark',
    tagline: 'The Creator',
    price: 4900,
    credits: 500,
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
    },
  },

  grow: {
    label: 'Grow',
    tagline: 'The Grower',
    price: 8900,
    credits: 1500,
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
    },
  },

  scale: {
    label: 'Scale',
    tagline: 'The Operator',
    price: 16900,
    credits: 4000,
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
    },
  },

  agency: {
    label: 'Agency',
    tagline: 'The Agency',
    price: 34900,
    credits: 12000,
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
    },
  },

  // Trial = 7-day limited access, 150 credits only
  trial: {
    label: 'Trial',
    tagline: 'Trial',
    price: 0,
    credits: 150,
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
