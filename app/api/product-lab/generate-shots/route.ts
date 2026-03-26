export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { guardWorkspace } from '@/lib/workspace-guard'
import { checkCredits, CREDIT_COSTS } from '@/lib/plan-gate'
import { persistFile } from '@/lib/storage'
import { fal } from '@fal-ai/client'

fal.config({ credentials: process.env.FAL_KEY })

const SHOT_PROMPTS: Record<string, string[]> = {
  fragrance: [
    'front view, pure white background, studio lighting, sharp focus, luxury product photography',
    'three-quarter angle, pure white background, soft directional light, commercial photography',
    'top-down flat lay, pure white background, even lighting, product photography',
    'dramatic side lighting, pure white background, light refraction, premium fragrance shot',
  ],
  apparel: [
    'front view ghost mannequin, pure white background, studio lighting, fashion photography',
    'back view ghost mannequin, pure white background, clean commercial shot',
    'flat lay top-down, pure white background, minimal styling, apparel photography',
    'detail close-up texture, pure white background, macro fashion photography',
  ],
  flower: [
    'full arrangement, pure white background, natural soft light, botanical photography',
    'overhead bird\'s eye view, pure white background, floral photography',
    'side profile, pure white background, macro detail, flower photography',
    'single stem detail, pure white background, minimalist botanical',
  ],
  accessory: [
    'front view, pure white background, macro studio lighting, product photography',
    'three-quarter angle, pure white background, soft shadow, accessory shot',
    'flat lay arrangement, pure white background, commercial product photography',
    'detail close-up, pure white background, macro photography, sharp focus',
  ],
  food: [
    'hero shot overhead, pure white background, appetite appeal lighting, food photography',
    'side profile, pure white background, commercial food photography',
    'close-up detail texture, pure white background, macro food shot',
    'styled presentation, pure white background, professional food photography',
  ],
  electronics: [
    'front straight-on, pure white background, tech product photography, studio lighting',
    'three-quarter angle, pure white background, clean tech shot',
    'detail close-up, pure white background, macro electronics photography',
    'top-down flat lay, pure white background, minimal tech photography',
  ],
  general: [
    'front view, pure white background, studio lighting, commercial product photography',
    'three-quarter angle, pure white background, soft lighting, professional shot',
    'top-down, pure white background, flat lay product photography',
    'detail close-up, pure white background, macro product photography',
  ],
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, product_id, cleaned_image_url, product_type, count } = await request.json()
    if (!workspace_id || !product_id || !cleaned_image_url) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    const shotCount = Math.min(Math.max(Number(count) || 4, 1), 4)
    const totalCredits = CREDIT_COSTS.product_shot * shotCount

    const { ok, error: creditErr } = await checkCredits(
      workspace_id, user.id, totalCredits,
      'product_shots', `Product shots x${shotCount}`
    )
    if (!ok) return creditErr!

    const prompts = (SHOT_PROMPTS[product_type] || SHOT_PROMPTS.general).slice(0, shotCount)

    const results = await Promise.all(prompts.map(async (prompt, i) => {
      try {
        const result = await fal.subscribe('fal-ai/nano-banana-2', {
          input: {
            prompt: `Professional product photography, ${prompt}, isolated product, no text, no people`,
            image_url: cleaned_image_url,
            resolution: '1K',
            output_format: 'png',
            num_images: 1,
          },
          logs: false,
          onQueueUpdate: () => {},
        })

        const url = (result as any).data?.images?.[0]?.url
        if (!url) throw new Error('No image returned')

        const permanentUrl = await persistFile(url, workspace_id, 'image', undefined)

        const { data: asset } = await supabase.from('product_assets').insert({
          product_id,
          workspace_id,
          asset_type: 'shot',
          url: permanentUrl || url,
          prompt,
          credits_used: CREDIT_COSTS.product_shot,
          metadata: { product_type, shot_index: i },
        }).select('id, url').single()

        return { id: asset?.id ?? `shot-${i}`, url: permanentUrl || url }
      } catch (err) {
        console.error(`[product-lab/generate-shots] shot ${i} failed:`, err)
        await supabase.rpc('deduct_credits', {
          p_workspace_id:  workspace_id,
          p_amount:        -CREDIT_COSTS.product_shot,
          p_action:        'product_shot_refund',
          p_user_id:       user.id,
          p_description:   `Refund: product shot ${i + 1} failed`,
        })
        return null
      }
    }))

    return NextResponse.json({ shots: results.filter((r): r is { id: string; url: string } => r !== null) })

  } catch (err) {
    console.error('[product-lab/generate-shots]', err)
    return NextResponse.json({ error: 'Shot generation failed' }, { status: 500 })
  }
}
