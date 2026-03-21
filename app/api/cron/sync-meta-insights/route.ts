export const dynamic = 'force-dynamic'

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
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
          await service
            .from('amplify_campaigns')
            .update(updatePayload)
            .eq('id', camp.id)
          statusUpdates++
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
