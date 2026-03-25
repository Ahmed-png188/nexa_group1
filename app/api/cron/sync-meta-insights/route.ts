export const dynamic = 'force-dynamic'
import { createNotification } from '@/lib/notifications'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchCampaignInsights, fetchCampaignStatus } from '@/lib/meta-api'


/**
 * Runs every 2 hours via Vercel Cron.
 * For every campaign with a meta_campaign_id:
 *   1. Fetches real status from Meta (effective_status + rejection reason)
 *   2. Maps to Nexa status: ACTIVE | PAUSED | IN_REVIEW | REJECTED | ERROR | DELETED
 *   3. Updates amplify_campaigns.status to match Meta — single source of truth
 *   4. Fetches insights and upserts into amplify_insights
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Sync all non-deleted campaigns that have a Meta campaign ID
    const { data: campaigns } = await service
      .from('amplify_campaigns')
      .select('id, workspace_id, meta_campaign_id, meta_ad_id, name, status')
      .not('meta_campaign_id', 'is', null)
      .not('status', 'in', '("DELETED","DRAFT")')

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({ synced: 0, message: 'No campaigns to sync' })
    }

    // Load all Meta connections for those workspaces
    const wsIds = Array.from(new Set(campaigns.map((c: any) => c.workspace_id)))
    const { data: connections } = await service
      .from('meta_connections')
      .select('workspace_id, access_token')
      .in('workspace_id', wsIds)

    const connMap = Object.fromEntries(
      (connections || []).map((c: any) => [c.workspace_id, c.access_token])
    )

    let synced = 0
    let statusUpdates = 0
    const today = new Date().toISOString().split('T')[0]

    for (const camp of campaigns as any[]) {
      const tk = connMap[camp.workspace_id]
      if (!tk) continue

      try {
        // ── 1. Sync status from Meta (always — this is the source of truth) ──
        const statusResult = await fetchCampaignStatus(
          camp.meta_campaign_id,
          camp.meta_ad_id || null,
          tk
        )

        const statusChanged = statusResult.nexaStatus !== camp.status

        if (statusChanged || statusResult.rejectionReason) {
          const updatePayload: Record<string, any> = {
            status:     statusResult.nexaStatus,
            updated_at: new Date().toISOString(),
          }
          if (statusResult.rejectionReason) {
            updatePayload.rejection_reason = statusResult.rejectionReason
          }
          await service.from('amplify_campaigns').update(updatePayload).eq('id', camp.id)
          statusUpdates++

          if (statusChanged) {
            if (statusResult.nexaStatus === 'ACTIVE' && camp.status === 'IN_REVIEW') {
              await createNotification({
                workspace_id: camp.workspace_id,
                type: 'ad_live',
                message: `"${camp.name}" is now live — your ad is running on Meta.`,
                link: '/dashboard/amplify',
              })
            } else if (statusResult.nexaStatus === 'REJECTED') {
              const reason = statusResult.rejectionReason || 'Review your creative and resubmit.'
              await createNotification({
                workspace_id: camp.workspace_id,
                type: 'ad_rejected',
                message: `"${camp.name}" was rejected by Meta. ${reason}`,
                link: '/dashboard/amplify',
              })
            }
          }
        }

        // ── 2. Sync insights (only for active/paused — not for rejected/review) ──
        if (['ACTIVE', 'PAUSED'].includes(statusResult.nexaStatus)) {
          const insights = await fetchCampaignInsights(camp.meta_campaign_id, tk, 'last_7d')

          if (insights) {
            const { data: existing } = await service
              .from('amplify_insights')
              .select('id')
              .eq('campaign_id', camp.id)
              .eq('date', today)
              .maybeSingle()

            const insightRow = {
              spend:       insights.spend,
              reach:       insights.reach,
              impressions: insights.impressions,
              clicks:      insights.clicks,
              cpc:         insights.cpc,
              cpm:         insights.cpm,
              ctr:         insights.ctr,
              synced_at:   new Date().toISOString(),
            }

            if (existing) {
              await service.from('amplify_insights').update(insightRow).eq('id', existing.id)
            } else {
              await service.from('amplify_insights').insert({
                campaign_id: camp.id,
                date: today,
                ...insightRow,
              })
            }
          }
        }

        // Daily performance alert
        try {
          const { data: latestIns } = await service
            .from('amplify_insights')
            .select('spend, reach, clicks, cpc, ctr')
            .eq('campaign_id', camp.id)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (latestIns && latestIns.spend > 0) {
            const cpc = latestIns.cpc || 0
            const ctrPct = latestIns.ctr ? (latestIns.ctr * 100) : 0
            const todayStr = new Date().toISOString().split('T')[0]
            const { data: alreadyNotified } = await service
              .from('notifications')
              .select('id')
              .eq('workspace_id', camp.workspace_id)
              .eq('type', 'ad_performance')
              .gte('created_at', todayStr + 'T00:00:00')
              .maybeSingle()

            if (!alreadyNotified) {
              const isGreat = cpc < 1.0 && ctrPct > 2.0
              const isBad   = cpc > 2.5 || ctrPct < 0.5
              const signal  = isGreat ? 'Strong performance' : isBad ? 'Needs attention' : 'Running normally'
              await createNotification({
                workspace_id: camp.workspace_id,
                type: 'ad_performance',
                message: `"${camp.name}" — ${signal}. $${latestIns.spend.toFixed(2)} spent, ${latestIns.reach?.toLocaleString() || 0} reached, ${ctrPct.toFixed(2)}% CTR, $${cpc.toFixed(2)} CPC.`,
                link: '/dashboard/amplify',
              })
            }
          }
        } catch {}

        synced++
      } catch (campErr: any) {
        console.error(`[sync-meta] Campaign ${camp.id}:`, campErr?.message)
      }
    }

    return NextResponse.json({
      synced,
      status_updates: statusUpdates,
      total: campaigns.length,
    })

  } catch (err: unknown) {
    console.error('[sync-meta-insights]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Sync failed' }, { status: 500 })
  }
}
