/**
 * Nexa Notification System
 * 
 * Central helper for writing notifications to the notifications table.
 * Used by all API routes to fire real-time bell alerts.
 * 
 * Notification types and what they mean:
 *   content_created   — post/image/video/voice generated
 *   post_published    — scheduled post successfully published
 *   post_failed       — scheduled post failed to publish
 *   lead_captured     — someone submitted the lead page
 *   brand_analyzed    — Brand Brain analysis complete
 *   strategy_ready    — strategy generated
 *   sequence_sent     — email sequence step sent
 *   email_opened      — tracked email was opened
 *   credits_low       — balance below 50
 *   ad_live           — Meta ad campaign went ACTIVE
 *   ad_rejected       — Meta ad was rejected
 *   ad_performance    — daily ad performance alert (good/warning/critical)
 *   plan_upgraded     — user upgraded their plan
 *   platform_connected — social platform connected
 */

import { createClient } from '@supabase/supabase-js'

type NotifType =
  | 'content_created'
  | 'post_published'
  | 'post_failed'
  | 'lead_captured'
  | 'brand_analyzed'
  | 'strategy_ready'
  | 'sequence_sent'
  | 'email_opened'
  | 'credits_low'
  | 'ad_live'
  | 'ad_rejected'
  | 'ad_performance'
  | 'plan_upgraded'
  | 'platform_connected'

interface CreateNotifParams {
  workspace_id: string
  type: NotifType
  message: string
  link?: string
}

// Uses service role — safe to call from any server route
export async function createNotification(params: CreateNotifParams): Promise<void> {
  try {
    const service = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await service.from('notifications').insert({
      workspace_id: params.workspace_id,
      type:         params.type,
      message:      params.message,
      link:         params.link ?? null,
    })
  } catch (err) {
    // Never throw — notifications are fire-and-forget
  }
}

// Convenience: only fire if credits just crossed below threshold
export async function checkAndNotifyLowCredits(
  workspace_id: string,
  balance: number,
  previousBalance: number
): Promise<void> {
  const threshold = 50
  if (previousBalance > threshold && balance <= threshold) {
    await createNotification({
      workspace_id,
      type:    'credits_low',
      message: `You have ${balance} credits remaining. Top up to keep generating.`,
      link:    '/dashboard/settings?tab=billing',
    })
  }
}
