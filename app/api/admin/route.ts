import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ADMIN_EMAILS = [
  'ahamedday221@gmail.com',
]

async function verifyAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    throw new Error('Unauthorized')
  }
  return supabase
}

// ─────────────────────────────────────────────────────
// POST /api/admin
// Actions: update_plan, give_free_access, add_credits,
//          cancel_account, update_plan_pricing,
//          create_discount, toggle_discount
// ─────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const supabase = await verifyAdmin()
    const body = await req.json()
    const { action, workspace_id, plan, credits, amount } = body

    switch (action) {

      case 'update_plan': {
        const { error } = await supabase
          .from('workspaces')
          .update({ plan, plan_status: 'active', updated_at: new Date().toISOString() })
          .eq('id', workspace_id)
        if (error) throw error
        return NextResponse.json({ ok: true, message: `Plan updated to ${plan}` })
      }

      case 'give_free_access': {
        // Update plan + status, remove stripe subscription reference
        const { error: wsErr } = await supabase
          .from('workspaces')
          .update({ plan, plan_status: 'active', stripe_subscription_id: null, updated_at: new Date().toISOString() })
          .eq('id', workspace_id)
        if (wsErr) throw wsErr

        // Grant plan credits
        const { error: crErr } = await supabase
          .from('credits')
          .upsert({ workspace_id, balance: credits ?? 0, updated_at: new Date().toISOString() }, { onConflict: 'workspace_id' })
        if (crErr) throw crErr

        // Log the grant
        await supabase.from('credit_transactions').insert({
          workspace_id,
          amount: credits ?? 0,
          action: 'admin_grant',
          description: `Admin granted free ${plan} access`,
        })

        return NextResponse.json({ ok: true, message: `Free ${plan} access granted` })
      }

      case 'add_credits': {
        // Get current balance
        const { data: existing } = await supabase
          .from('credits')
          .select('balance')
          .eq('workspace_id', workspace_id)
          .single()

        const newBalance = (existing?.balance ?? 0) + (amount ?? 0)

        const { error } = await supabase
          .from('credits')
          .upsert({ workspace_id, balance: newBalance, updated_at: new Date().toISOString() }, { onConflict: 'workspace_id' })
        if (error) throw error

        await supabase.from('credit_transactions').insert({
          workspace_id,
          amount: amount ?? 0,
          action: 'admin_topup',
          description: `Admin added ${amount} credits`,
        })

        return NextResponse.json({ ok: true, message: `${amount} credits added` })
      }

      case 'cancel_account': {
        const { error } = await supabase
          .from('workspaces')
          .update({ plan_status: 'canceled', updated_at: new Date().toISOString() })
          .eq('id', workspace_id)
        if (error) throw error
        return NextResponse.json({ ok: true, message: 'Account canceled' })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[Admin API Error]', err)
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}

// GET /api/admin — fetch full admin stats
export async function GET() {
  try {
    const supabase = await verifyAdmin()

    const [
      { data: workspaces },
      { data: credits },
      { data: transactions },
    ] = await Promise.all([
      supabase.from('workspaces').select('*, profiles(id, email, full_name, created_at)').order('created_at', { ascending: false }),
      supabase.from('credits').select('*'),
      supabase.from('credit_transactions').select('*').order('created_at', { ascending: false }).limit(100),
    ])

    // Compute MRR
    const PLAN_PRICES: Record<string, number> = { spark: 49, grow: 89, scale: 169, agency: 349 }
    const mrr = (workspaces ?? [])
      .filter(w => w.plan_status === 'active')
      .reduce((sum, w) => sum + (PLAN_PRICES[w.plan] ?? 0), 0)

    return NextResponse.json({
      workspaces,
      credits,
      transactions,
      stats: {
        total_users: workspaces?.length ?? 0,
        active_users: workspaces?.filter(w => w.plan_status === 'active').length ?? 0,
        trial_users: workspaces?.filter(w => w.plan_status === 'trialing').length ?? 0,
        canceled_users: workspaces?.filter(w => w.plan_status === 'canceled').length ?? 0,
        mrr,
        arr: mrr * 12,
      },
    })

  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
