'use client'
/**
 * useAdminConfig — single source of truth hook
 * Reads plans, feature flags, and active promo codes from Supabase admin tables.
 * Used by: landing page, pricing page, settings page, admin panel.
 *
 * Place this file at: lib/use-admin-config.ts
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ───────────────────────────────────────────────────
export interface PlanConfig {
  id: string
  label: string
  tagline: string
  tagline_ar: string
  price: number          // dollars (display)
  price_cents: number    // cents (Stripe)
  credits: number
  color: string
  popular: boolean
  enabled: boolean
  cta_en: string
  cta_ar: string
  trial_credits: number  // 0 = no trial badge
  stripe_price_id: string
  features: Record<string, boolean | string | number>
}

export interface FeatureFlags {
  [key: string]: boolean
}

export interface PromoCode {
  id: string
  code: string
  type: 'percent' | 'fixed'
  value: number
  plan: string           // 'all' or specific plan id
  active: boolean
  expires_at: string | null
  uses: number
  use_limit: number
  show_banner: boolean   // show discount tag on landing/pricing?
  banner_text_en: string
  banner_text_ar: string
}

export interface AdminConfig {
  plans: PlanConfig[]
  features: FeatureFlags
  activeCodes: PromoCode[]
  loading: boolean
  error: string | null
}

// ─── Default fallback (mirrors your current plan-constants.ts) ────────────────
export const DEFAULT_PLANS: PlanConfig[] = [
  {
    id: 'spark', label: 'Spark', tagline: 'The Creator', tagline_ar: 'للمبدع',
    price: 49, price_cents: 4900, credits: 1000,
    color: 'rgba(255,255,255,0.75)', popular: false, enabled: true,
    cta_en: 'Start with Spark', cta_ar: 'ابدأ بـ Spark',
    trial_credits: 200, stripe_price_id: '',
    features: {},
  },
  {
    id: 'grow', label: 'Grow', tagline: 'The Grower', tagline_ar: 'للنمو',
    price: 89, price_cents: 8900, credits: 3000,
    color: '#00AAFF', popular: true, enabled: true,
    cta_en: 'Start with Grow', cta_ar: 'ابدأ بـ Grow',
    trial_credits: 0, stripe_price_id: '',
    features: {},
  },
  {
    id: 'scale', label: 'Scale', tagline: 'The Operator', tagline_ar: 'للمحترف',
    price: 169, price_cents: 16900, credits: 7000,
    color: '#A78BFA', popular: false, enabled: true,
    cta_en: 'Start with Scale', cta_ar: 'ابدأ بـ Scale',
    trial_credits: 0, stripe_price_id: '',
    features: {},
  },
  {
    id: 'agency', label: 'Agency', tagline: 'The Agency', tagline_ar: 'للوكالة',
    price: 349, price_cents: 34900, credits: 20000,
    color: '#FF7A40', popular: false, enabled: true,
    cta_en: 'Start with Agency', cta_ar: 'ابدأ بـ Agency',
    trial_credits: 0, stripe_price_id: '',
    features: {},
  },
]

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useAdminConfig(): AdminConfig {
  const [plans, setPlans] = useState<PlanConfig[]>(DEFAULT_PLANS)
  const [features, setFeatures] = useState<FeatureFlags>({})
  const [activeCodes, setActiveCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      try {
        // Load all three in parallel
        const [plansRes, featuresRes, promoRes] = await Promise.all([
          supabase
            .from('admin_plans')
            .select('*')
            .order('sort_order', { ascending: true }),
          supabase
            .from('admin_feature_flags')
            .select('key, enabled'),
          supabase
            .from('admin_promo_codes')
            .select('*')
            .eq('active', true)
            .eq('show_banner', true),
        ])

        // Plans
        if (plansRes.data && plansRes.data.length > 0) {
          setPlans(plansRes.data.filter((p: PlanConfig) => p.enabled))
        }

        // Feature flags
        if (featuresRes.data) {
          const flags: FeatureFlags = {}
          featuresRes.data.forEach((f: { key: string; enabled: boolean }) => {
            flags[f.key] = f.enabled
          })
          setFeatures(flags)
        }

        // Active promo codes with banners
        if (promoRes.data) {
          setActiveCodes(promoRes.data)
        }

      } catch (e: any) {
        setError(e.message)
        // Fall through — defaults already set
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return { plans, features, activeCodes, loading, error }
}

// ─── Server-side version (for RSC / API routes) ──────────────────────────────
export async function getAdminConfig(supabase: any) {
  const [plansRes, featuresRes, promoRes] = await Promise.all([
    supabase.from('admin_plans').select('*').order('sort_order', { ascending: true }),
    supabase.from('admin_feature_flags').select('key, enabled'),
    supabase.from('admin_promo_codes').select('*').eq('active', true),
  ])

  const plans: PlanConfig[] = (plansRes.data && plansRes.data.length > 0)
    ? plansRes.data
    : DEFAULT_PLANS

  const features: FeatureFlags = {}
  if (featuresRes.data) {
    featuresRes.data.forEach((f: { key: string; enabled: boolean }) => {
      features[f.key] = f.enabled
    })
  }

  return { plans, features, promoCodes: promoRes.data ?? [] }
}

// ─── Helper: compute discounted price ───────────────────────────────────────
export function applyDiscount(price: number, code: PromoCode): number {
  if (code.type === 'percent') return Math.round(price * (1 - code.value / 100))
  if (code.type === 'fixed')   return Math.max(0, price - code.value)
  return price
}
