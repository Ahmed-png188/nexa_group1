export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { guardWorkspace } from '@/lib/workspace-guard'
import { searchInterests, getReachEstimate, getAdSetConfig } from '@/lib/meta-api'


export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const {
      workspace_id, ageMin = 22, ageMax = 45, genders = 'ALL',
      locations = ['AE'], interests = [], placements = ['ig_feed','ig_stories','fb_feed'],
      daily_budget = 20, objective = 'OUTCOME_TRAFFIC',
    } = await request.json()

    if (!workspace_id) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    const { data: metaConn } = await supabase
      .from('meta_connections')
      .select('access_token, ad_account_id')
      .eq('workspace_id', workspace_id)
      .single()

    if (!metaConn?.access_token || !metaConn?.ad_account_id) {
      // Return rough fallback estimate without Meta connection
      const base = daily_budget * 150
      return NextResponse.json({ min: Math.round(base * 0.6), max: Math.round(base * 1.4), estimated: false })
    }

    const acct = metaConn.ad_account_id.replace('act_', '')
    const tk   = metaConn.access_token

    // Resolve interest IDs
    const resolvedInterests = interests.length ? await searchInterests(interests.slice(0, 5), tk) : []
    const { optimizationGoal } = getAdSetConfig(objective)

    const estimate = await getReachEstimate({
      adAccountId: acct, accessToken: tk,
      ageMin, ageMax, genders, locations,
      interests: resolvedInterests, placements,
      dailyBudget: daily_budget, optimizationGoal,
    })

    if (!estimate) {
      const base = daily_budget * 150
      return NextResponse.json({ min: Math.round(base * 0.6), max: Math.round(base * 1.4), estimated: false })
    }

    return NextResponse.json({ ...estimate, estimated: true })

  } catch (err) {
    console.error('[amplify/reach]', err)
    return NextResponse.json({ error: 'Reach estimate failed' }, { status: 500 })
  }
}
