export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { guardWorkspace } from '@/lib/workspace-guard'
import { updateCampaignStatus, updateAdSetBudget } from '@/lib/meta-api'


export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, campaign_id, action, value } = await request.json()
    // action: 'pause' | 'resume' | 'budget' | 'delete'
    // value: for budget → number (dollars)

    if (!workspace_id || !campaign_id || !action) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    // Get campaign
    const { data: camp } = await supabase
      .from('amplify_campaigns')
      .select('*')
      .eq('id', campaign_id)
      .eq('workspace_id', workspace_id)
      .single()

    if (!camp) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

    // Get Meta connection
    const { data: metaConn } = await supabase
      .from('meta_connections')
      .select('access_token, ad_account_id')
      .eq('workspace_id', workspace_id)
      .single()

    const hasMetaConn = !!(metaConn?.access_token && camp.meta_campaign_id)
    let metaSuccess = false
    let newStatus = camp.status

    if (action === 'pause') {
      if (hasMetaConn) {
        metaSuccess = await updateCampaignStatus(camp.meta_campaign_id, 'PAUSED', metaConn.access_token)
      }
      newStatus = 'PAUSED'
      await supabase.from('amplify_campaigns').update({ status: 'PAUSED' }).eq('id', campaign_id)

    } else if (action === 'resume') {
      if (hasMetaConn) {
        // Also activate the ad set — campaign + adset must both be ACTIVE
        if (camp.meta_adset_id) {
          await updateAdSetBudget(camp.meta_adset_id, camp.daily_budget, metaConn.access_token)
        }
        metaSuccess = await updateCampaignStatus(camp.meta_campaign_id, 'ACTIVE', metaConn.access_token)
      }
      // Set IN_REVIEW — Meta re-reviews creative on reactivation; sync cron will update to ACTIVE once approved
      newStatus = 'IN_REVIEW'
      await supabase.from('amplify_campaigns').update({ status: 'IN_REVIEW', rejection_reason: null }).eq('id', campaign_id)

    } else if (action === 'budget' && value) {
      const budget = parseFloat(value)
      if (hasMetaConn && camp.meta_adset_id) {
        metaSuccess = await updateAdSetBudget(camp.meta_adset_id, budget, metaConn.access_token)
      }
      await supabase.from('amplify_campaigns').update({ daily_budget: budget }).eq('id', campaign_id)

    } else if (action === 'delete') {
      if (hasMetaConn) {
        await updateCampaignStatus(camp.meta_campaign_id, 'DELETED', metaConn.access_token)
      }
      await supabase.from('amplify_campaigns').update({ status: 'DELETED' }).eq('id', campaign_id)
      newStatus = 'DELETED'
    }

    return NextResponse.json({
      success: true,
      status:  newStatus,
      meta_synced: metaSuccess,
      message: hasMetaConn && !metaSuccess
        ? 'Updated locally — Meta sync failed, check connection.'
        : hasMetaConn
          ? 'Synced with Meta.'
          : 'Updated locally — not connected to Meta.',
    })

  } catch (err) {
    console.error('[amplify/update]', err)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
