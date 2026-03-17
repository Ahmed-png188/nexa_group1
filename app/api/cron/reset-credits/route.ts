import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PLAN_FEATURES } from '@/lib/plan-gate'

// Monthly cron — resets workspace credits based on plan tier
// Schedule via Vercel Cron: 0 0 1 * * (first day of each month)
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()

  // Fetch all active workspaces with their plan info
  const { data: workspaces, error } = await supabase
    .from('workspaces')
    .select('id, plan, plan_status')
    .in('plan_status', ['active', 'trialing'])

  if (error) {
    console.error('Credit reset: failed to fetch workspaces', error)
    return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 })
  }

  let reset = 0
  let skipped = 0

  for (const ws of workspaces ?? []) {
    const plan = ws.plan ?? 'spark'
    const planConfig = PLAN_FEATURES[plan as keyof typeof PLAN_FEATURES]

    if (!planConfig) { skipped++; continue }

    // Trialing workspaces get trial credits
    const credits = ws.plan_status === 'trialing'
      ? PLAN_FEATURES.trial.credits
      : planConfig.credits

    const { error: updateError } = await supabase
      .from('credits')
      .upsert({
        workspace_id: ws.id,
        balance: credits,
        reset_at: new Date().toISOString(),
      }, { onConflict: 'workspace_id' })

    if (updateError) {
      console.error(`Credit reset: failed for workspace ${ws.id}`, updateError)
      skipped++
    } else {
      reset++
    }
  }

  console.log(`Credit reset complete: ${reset} reset, ${skipped} skipped`)
  return NextResponse.json({ success: true, reset, skipped, total: workspaces?.length ?? 0 })
}
