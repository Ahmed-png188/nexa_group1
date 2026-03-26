export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { guardWorkspace } from '@/lib/workspace-guard'
import { checkCredits, CREDIT_COSTS } from '@/lib/plan-gate'
import { persistFile } from '@/lib/storage'
import { fal } from '@fal-ai/client'

fal.config({ credentials: process.env.FAL_KEY })

// Shot configs: id → prompt suffix
const SHOT_CONFIGS: Record<string, { label: string; prompt: string }> = {
  hero:          { label: 'Hero',        prompt: 'hero product shot, front-facing, pure white background, dramatic studio lighting, commercial photography, ultra sharp' },
  angle_34:      { label: '3/4 Angle',   prompt: 'three-quarter angle product shot, pure white background, soft directional light, professional commercial photography' },
  top_down:      { label: 'Top Down',    prompt: 'overhead top-down flat lay product shot, pure white background, even lighting, minimal composition' },
  detail:        { label: 'Detail',      prompt: 'extreme close-up detail product shot, pure white background, macro lens, ultra sharp focus, commercial photography' },
  side_profile:  { label: 'Side',        prompt: 'side profile product shot, pure white background, clean studio lighting, sharp commercial photography' },
  floating:      { label: 'Floating',    prompt: 'product floating on pure white background, soft drop shadow, levitating product shot, professional studio photography' },
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
      try {
        const result = await fal.subscribe('fal-ai/flux-pro/v1.1', {
          input: {
            prompt: `Professional product photography: ${config.prompt}. Product type: ${product_type || 'general'}. Isolated product, no text, no watermarks, no people.`,
            image_size: 'square_hd',
            num_images: 1,
            output_format: 'png',
            guidance_scale: 3.5,
          } as any,
          logs: false,
          onQueueUpdate: () => {},
        })

        const url = (result as any).data?.images?.[0]?.url
        if (!url) throw new Error('No image returned')

        const permanentUrl = await persistFile(url, workspace_id, 'image', undefined)
        const finalUrl = permanentUrl || url

        if (product_id) {
          await supabase.from('product_assets').insert({
            product_id,
            workspace_id,
            asset_type: 'studio',
            url: finalUrl,
            prompt: config.prompt,
            credits_used: CREDIT_COSTS.product_studio,
            metadata: { shot_id: shotId, product_type },
          })
        }

        return { id: shotId, url: finalUrl, style: shotId, label: config.label }
      } catch (err) {
        console.error(`[product-lab/studio-shots] ${shotId} failed:`, err)
        await supabase.rpc('deduct_credits', {
          p_workspace_id: workspace_id,
          p_amount:       -CREDIT_COSTS.product_studio,
          p_action:       'product_studio_refund',
          p_user_id:      user.id,
          p_description:  `Refund: studio shot ${shotId} failed`,
        })
        return null
      }
    }))

    return NextResponse.json({
      shots: results.filter((r): r is { id: string; url: string; style: string; label: string } => r !== null)
    })

  } catch (err) {
    console.error('[product-lab/studio-shots]', err)
    return NextResponse.json({ error: 'Studio shots failed' }, { status: 500 })
  }
}
