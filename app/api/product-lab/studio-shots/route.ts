export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { guardWorkspace } from '@/lib/workspace-guard'
import { checkCredits, CREDIT_COSTS } from '@/lib/plan-gate'
import { persistFile } from '@/lib/storage'
import { fal } from '@fal-ai/client'

fal.config({ credentials: process.env.FAL_KEY })

const SHOT_CONFIGS: Record<string, { label: string; prompt: string }> = {
  hero:         { label: 'Hero',       prompt: 'hero product shot, front-facing, pure white background, dramatic studio lighting, commercial photography, ultra sharp' },
  angle_34:     { label: '3/4 Angle', prompt: 'three-quarter angle product shot, pure white background, soft directional light, professional commercial photography' },
  top_down:     { label: 'Top Down',  prompt: 'overhead top-down flat lay product shot, pure white background, even lighting, minimal composition' },
  detail:       { label: 'Detail',    prompt: 'extreme close-up detail product shot, pure white background, macro lens, ultra sharp focus, commercial photography' },
  side_profile: { label: 'Side',      prompt: 'side profile product shot, pure white background, clean studio lighting, sharp commercial photography' },
  floating:     { label: 'Floating',  prompt: 'product floating on pure white background, soft drop shadow, levitating product shot, professional studio photography' },
}

async function generateShot(prompt: string): Promise<string | null> {
  // Try flux-pro/v1.1 first
  try {
    const result = await fal.subscribe('fal-ai/flux-pro/v1.1', {
      input: {
        prompt,
        num_images: 1,
        output_format: 'png',
        image_size: 'square_hd',
      } as any,
      logs: false,
      onQueueUpdate: () => {},
    })
    return (result as any).data?.images?.[0]?.url
      || (result as any).images?.[0]?.url
      || null
  } catch {
    // Fallback to nano-banana-2 which is confirmed working
    try {
      const result2 = await fal.subscribe('fal-ai/nano-banana-2', {
        input: {
          prompt,
          resolution: '1K',
          output_format: 'png',
          num_images: 1,
        },
        logs: false,
        onQueueUpdate: () => {},
      })
      return (result2 as any).data?.images?.[0]?.url
        || (result2 as any).images?.[0]?.url
        || null
    } catch (e2) {
      console.error('[studio-shots] both models failed:', e2)
      return null
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, product_id, image_url, product_type, shots } = await request.json()
    if (!workspace_id || !image_url) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    const requestedShots: string[] = Array.isArray(shots) && shots.length > 0
      ? shots.slice(0, 6)
      : ['hero', 'angle_34', 'top_down', 'detail']

    const totalCredits = CREDIT_COSTS.product_studio * requestedShots.length

    const { ok, error: creditErr } = await checkCredits(
      workspace_id, user.id, totalCredits,
      'product_studio', `Studio shots x${requestedShots.length}`
    )
    if (!ok) return creditErr!

    const results = await Promise.all(requestedShots.map(async (shotId) => {
      const config = SHOT_CONFIGS[shotId] ?? SHOT_CONFIGS.hero
      const prompt = `Professional product photography: ${config.prompt}. Product type: ${product_type || 'general'}. Isolated product, no text, no watermarks, no people.`

      const url = await generateShot(prompt)

      if (!url) {
        // Refund credit for this shot
        try {
          await supabase.rpc('deduct_credits', {
            p_workspace_id: workspace_id,
            p_amount:       -CREDIT_COSTS.product_studio,
            p_action:       'product_studio_refund',
            p_user_id:      user.id,
            p_description:  `Refund: studio shot ${shotId} failed`,
          })
        } catch {}
        return null
      }

      const permanentUrl = await persistFile(url, workspace_id, 'image', undefined)
        .catch(() => url)
      const finalUrl = permanentUrl || url

      if (product_id) {
        try {
          await supabase.from('product_assets').insert({
            product_id,
            workspace_id,
            asset_type: 'studio',
            url: finalUrl,
            prompt: config.prompt,
            credits_used: CREDIT_COSTS.product_studio,
            metadata: { shot_id: shotId, product_type },
          })
        } catch (err) { console.error('[studio-shots] asset insert failed:', err) }
      }

      return { id: shotId, url: finalUrl, style: shotId, label: config.label }
    }))

    const successfulShots = results.filter((r): r is { id: string; url: string; style: string; label: string } => r !== null)
    return NextResponse.json({ shots: successfulShots })

  } catch (err) {
    console.error('[product-lab/studio-shots]', err)
    return NextResponse.json({ shots: [] }) // Never throw — always return
  }
}
