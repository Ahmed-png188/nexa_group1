export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { guardWorkspace } from '@/lib/workspace-guard'


// Prices in cents. Must match Stripe dashboard + lib/plan-gate.ts
const PLANS = {
  spark: {
    name: 'Spark',
    price: 4900,   // $49/mo
    credits: 500,
    priceId: process.env.STRIPE_PRICE_SPARK ?? '',
  },
  grow: {
    name: 'Grow',
    price: 8900,   // $89/mo
    credits: 1500,
    priceId: process.env.STRIPE_PRICE_GROW ?? '',
  },
  scale: {
    name: 'Scale',
    price: 16900,  // $169/mo
    credits: 4000,
    priceId: process.env.STRIPE_PRICE_SCALE ?? '',
  },
  agency: {
    name: 'Agency',
    price: 34900,  // $349/mo
    credits: 12000,
    priceId: process.env.STRIPE_PRICE_AGENCY ?? '',
  },
}

// Top-up packs — must match TOPUP_PACKS in lib/plan-gate.ts
const TOPUP_PRICES: Record<number, number> = {
  100:  500,   // $5
  300:  1200,  // $12
  700:  2500,  // $25
  1500: 4500,  // $45
  3500: 8900,  // $89
}

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder', {
    apiVersion: '2024-06-20',
  })

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, plan, top_up_credits } = await request.json()

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    const { data: workspace } = await supabase
      .from('workspaces').select('*').eq('id', workspace_id).single()

    const { data: profile } = await supabase
      .from('profiles').select('email').eq('id', user.id).single()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nexaa.cc'

    // Credit top-up (one-time payment)
    if (top_up_credits) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: profile?.email,
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${top_up_credits} Nexa Credits`,
              description: 'One-time credit top-up for Nexa',
            },
            unit_amount: TOPUP_PRICES[top_up_credits as keyof typeof TOPUP_PRICES] ?? Math.ceil(top_up_credits / 100) * 200,
          },
          quantity: 1,
        }],
        metadata: {
          workspace_id,
          type: 'top_up',
          credits: top_up_credits.toString(),
        },
        success_url: `${appUrl}/dashboard/settings?tab=billing&success=true`,
        cancel_url: `${appUrl}/dashboard/settings?tab=billing`,
      })
      return NextResponse.json({ url: session.url })
    }

    // Plan subscription
    const planConfig = PLANS[plan as keyof typeof PLANS]
    if (!planConfig) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

    // Get or create Stripe customer
    let customerId = workspace?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email,
        metadata: { workspace_id, user_id: user.id },
      })
      customerId = customer.id
      await supabase.from('workspaces').update({
        stripe_customer_id: customerId,
      }).eq('id', workspace_id)
    }

    // If priceId is set up, use subscription mode
    if (planConfig.priceId) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer: customerId,
        line_items: [{ price: planConfig.priceId, quantity: 1 }],
        metadata: { workspace_id, plan },
        subscription_data: { metadata: { workspace_id, plan } },
        success_url: `${appUrl}/dashboard/settings?tab=billing&success=true&plan=${plan}`,
        cancel_url: `${appUrl}/dashboard/settings?tab=billing`,
      })
      return NextResponse.json({ url: session.url })
    }

    // Fallback: one-time payment if price IDs not configured yet
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer: customerId,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Nexa ${planConfig.name} — 1 month`,
            description: `${planConfig.credits.toLocaleString()} credits/month`,
          },
          unit_amount: planConfig.price,
        },
        quantity: 1,
      }],
      metadata: { workspace_id, plan, type: 'plan' },
      success_url: `${appUrl}/dashboard/settings?tab=billing&success=true&plan=${plan}`,
      cancel_url: `${appUrl}/dashboard/settings?tab=billing`,
    })

    return NextResponse.json({ url: session.url })

  } catch (error: unknown) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
