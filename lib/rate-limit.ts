/**
 * NEXA — IP-based rate limiter using Supabase
 * Zero external dependencies. No Upstash needed.
 *
 * How it works:
 * - Each request increments a counter in the rate_limits table
 * - Counters expire after `windowSeconds`
 * - If count exceeds `max`, returns { limited: true }
 * - Works for both public endpoints (IP-based) and authenticated (user-based)
 */

import { createClient } from '@supabase/supabase-js'

interface RateLimitOptions {
  /** Identifier: IP address or user ID */
  key: string
  /** Max requests allowed in the window */
  max: number
  /** Window duration in seconds */
  windowSeconds: number
  /** Namespace to separate limits for different endpoints */
  namespace: string
}

interface RateLimitResult {
  limited: boolean
  remaining: number
  resetAt: Date
}

export async function rateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const { key, max, windowSeconds, namespace } = opts

  // Use service role to bypass RLS — rate_limits table is server-only
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now     = new Date()
  const resetAt = new Date(now.getTime() + windowSeconds * 1000)
  const limitKey = `${namespace}:${key}`

  try {
    // Try to increment existing counter
    const { data: existing } = await supabase
      .from('rate_limits')
      .select('id, count, reset_at')
      .eq('key', limitKey)
      .gt('reset_at', now.toISOString())
      .single()

    if (existing) {
      // Window is active — increment
      const newCount = (existing.count as number) + 1
      await supabase
        .from('rate_limits')
        .update({ count: newCount })
        .eq('id', existing.id)

      const existingReset = new Date(existing.reset_at as string)
      return {
        limited:   newCount > max,
        remaining: Math.max(0, max - newCount),
        resetAt:   existingReset,
      }
    } else {
      // No active window — create new
      await supabase.from('rate_limits').upsert({
        key:      limitKey,
        count:    1,
        reset_at: resetAt.toISOString(),
      }, { onConflict: 'key' })

      return {
        limited:   false,
        remaining: max - 1,
        resetAt,
      }
    }
  } catch {
    // If rate limit table doesn't exist or any error, fail open (allow request)
    // This prevents the rate limiter itself from breaking the app
    return { limited: false, remaining: max, resetAt }
  }
}

/**
 * Get the real IP address from a Next.js request
 * Works on Vercel (x-forwarded-for) and locally
 */
export function getIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list — take the first (client IP)
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') ?? '127.0.0.1'
}

/**
 * Pre-built rate limit configs for common endpoints
 */
export const LIMITS = {
  /** Public lead capture form — 5 submissions per 10 minutes per IP */
  leadCapture: { max: 5, windowSeconds: 600, namespace: 'lead_capture' },

  /** AI content generation — 20 per minute per user */
  aiGenerate:  { max: 20, windowSeconds: 60,  namespace: 'ai_generate'  },

  /** Image generation — 10 per minute per user (expensive) */
  imageGen:    { max: 10, windowSeconds: 60,  namespace: 'image_gen'    },

  /** Video generation — 5 per minute per user (most expensive) */
  videoGen:    { max: 5,  windowSeconds: 60,  namespace: 'video_gen'    },

  /** Voice generation — 10 per minute per user */
  voiceGen:    { max: 10, windowSeconds: 60,  namespace: 'voice_gen'    },

  /** Auth attempts — 10 per 15 minutes per IP */
  auth:        { max: 10, windowSeconds: 900, namespace: 'auth'         },
} as const
