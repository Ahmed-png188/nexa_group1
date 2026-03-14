import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const PLAN_CREDITS: Record<string, number> = {
  spark: 500,
  grow: 1500,
  scale: 5000,
  agency: 15000,
}

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder', {
    apiVersion: '2024-06-20',
  })

  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET ?? 'whsec_placeholder'
    )
  } catch (err: any) {
    console.error('Webhook signature failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createClient()

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const { workspace_id, plan, type, credits } = session.metadata ?? {}

        if (!workspace_id) break

        if (type === 'top_up' && credits) {
          // Add credits to balance
          const creditAmount = parseInt(credits)
          await supabase.from('credits')
            .update({ balance: supabase.rpc('add_credits' as any, { amount: creditAmount }) })
            .eq('workspace_id', workspace_id)

          // Simpler approach — fetch and update
          const { data: current } = await supabase
            .from('credits').select('balance').eq('workspace_id', workspace_id).single()
          await supabase.from('credits')
            .update({ balance: (current?.balance ?? 0) + creditAmount })
            .eq('workspace_id', workspace_id)

          await supabase.from('credit_transactions').insert({
            workspace_id,
            amount: creditAmount,
            action: 'top_up',
            description: `Credit top-up — ${creditAmount} credits`,
          })

          await supabase.from('activity').insert({
            workspace_id,
            type: 'credits_added',
            title: `${creditAmount} credits added via top-up`,
          })

        } else if (plan) {
          // Plan purchase — add monthly credits
          const planCredits = PLAN_CREDITS[plan] ?? 500

          const { data: current } = await supabase
            .from('credits').select('balance').eq('workspace_id', workspace_id).single()
          await supabase.from('credits')
            .update({ balance: (current?.balance ?? 0) + planCredits })
            .eq('workspace_id', workspace_id)

          await supabase.from('workspaces').update({
            plan,
            plan_status: 'active',
            stripe_subscription_id: session.subscription as string ?? null,
          }).eq('id', workspace_id)

          await supabase.from('credit_transactions').insert({
            workspace_id,
            amount: planCredits,
            action: 'monthly_grant',
            description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan — monthly credits`,
          })

          await supabase.from('activity').insert({
            workspace_id,
            type: 'plan_upgraded',
            title: `Upgraded to ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan`,
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const { workspace_id, plan } = sub.metadata ?? {}
        if (!workspace_id) break

        await supabase.from('workspaces').update({
          plan_status: sub.status,
        }).eq('id', workspace_id)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const { workspace_id } = sub.metadata ?? {}
        if (!workspace_id) break

        await supabase.from('workspaces').update({
          plan: 'spark',
          plan_status: 'canceled',
        }).eq('id', workspace_id)

        await supabase.from('activity').insert({
          workspace_id,
          type: 'plan_canceled',
          title: 'Subscription canceled',
        })
        break
      }

      case 'invoice.payment_succeeded': {
        // Monthly renewal — add credits
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const { data: workspace } = await supabase
          .from('workspaces').select('id, plan').eq('stripe_customer_id', customerId).single()

        if (workspace && invoice.billing_reason === 'subscription_cycle') {
          const planCredits = PLAN_CREDITS[workspace.plan ?? 'spark']
          const { data: current } = await supabase
            .from('credits').select('balance').eq('workspace_id', workspace.id).single()
          await supabase.from('credits')
            .update({ balance: (current?.balance ?? 0) + planCredits })
            .eq('workspace_id', workspace.id)

          await supabase.from('credit_transactions').insert({
            workspace_id: workspace.id,
            amount: planCredits,
            action: 'monthly_grant',
            description: `Monthly renewal — ${planCredits} credits`,
          })
        }
        break
      }
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
