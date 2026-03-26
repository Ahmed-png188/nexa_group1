export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { guardWorkspace } from '@/lib/workspace-guard'
import { checkCredits, CREDIT_COSTS } from '@/lib/plan-gate'
import { persistFile } from '@/lib/storage'
import { fal } from '@fal-ai/client'

fal.config({ credentials: process.env.FAL_KEY })

type SceneStyle = 'minimal' | 'luxury' | 'outdoor' | 'home' | 'fashion' | 'abstract'

// LIFESTYLE_PROMPTS[product_type][scene_style]
const LIFESTYLE_PROMPTS: Record<string, Record<SceneStyle, string>> = {
  fragrance: {
    minimal:  'fragrance bottle on clean white marble surface, soft side light, minimalist luxury editorial',
    luxury:   'fragrance bottle on velvet draped surface, gold accents, cinematic lighting, high-end perfume editorial',
    outdoor:  'fragrance bottle among fresh botanicals and flowers in soft natural light, garden editorial',
    home:     'fragrance bottle on wooden vanity tray, warm ambient light, lifestyle home photography',
    fashion:  'fragrance bottle styled with silk fabric and pearls, fashion editorial photography',
    abstract: 'fragrance bottle with floating petals and light prism effects, artistic editorial photography',
  },
  apparel: {
    minimal:  'garment laid flat on clean white surface, minimal props, editorial fashion photography',
    luxury:   'garment displayed in upscale boutique setting, warm spotlight, luxury fashion editorial',
    outdoor:  'garment styled outdoors in natural daylight, fresh lifestyle fashion photography',
    home:     'garment draped over elegant chair in bright airy room, lifestyle editorial',
    fashion:  'garment on ghost mannequin in fashion studio, dramatic directional lighting',
    abstract: 'garment detail with geometric shadows, artistic editorial fashion photography',
  },
  flower: {
    minimal:  'floral arrangement on clean white surface, soft diffused light, minimal botanical photography',
    luxury:   'floral arrangement in crystal vase on marble, opulent lifestyle photography',
    outdoor:  'flowers in natural garden setting, soft golden hour light, botanical photography',
    home:     'floral arrangement on dining table, warm home lifestyle photography',
    fashion:  'flowers styled with ribbon and tissue paper, gift presentation photography',
    abstract: 'flowers with painterly bokeh background, artistic botanical photography',
  },
  accessory: {
    minimal:  'accessory on clean stone surface, minimal shadow, product editorial photography',
    luxury:   'accessory displayed on velvet surface with silk scarf, luxury editorial',
    outdoor:  'accessory in natural light outdoor setting, lifestyle editorial photography',
    home:     'accessory styled on dresser with soft morning light, home lifestyle photography',
    fashion:  'accessory paired with fashion props, styled editorial photography',
    abstract: 'accessory with geometric mirror reflections, artistic editorial photography',
  },
  food: {
    minimal:  'food item on clean ceramic plate, white background, minimal food styling',
    luxury:   'food item styled with premium garnish on slate, fine dining editorial photography',
    outdoor:  'food item styled on wooden table in natural light, rustic lifestyle photography',
    home:     'food item on kitchen counter with warm ambient light, home cooking editorial',
    fashion:  'food item styled with elegant tableware, lifestyle food photography',
    abstract: 'food item with artistic overhead composition, creative food photography',
  },
  electronics: {
    minimal:  'electronics on clean white surface, soft studio lighting, minimal tech product photography',
    luxury:   'electronics on dark carbon fiber surface, dramatic accent lighting, premium tech editorial',
    outdoor:  'electronics on concrete surface with natural light, urban lifestyle photography',
    home:     'electronics in home office setting, warm ambient light, lifestyle editorial',
    fashion:  'electronics styled with modern workspace accessories, tech lifestyle photography',
    abstract: 'electronics with light streak effects, artistic tech editorial photography',
  },
  general: {
    minimal:  'product on clean minimal surface, soft studio lighting, editorial product photography',
    luxury:   'product styled in premium luxury setting, cinematic lighting, high-end editorial',
    outdoor:  'product in natural outdoor setting, lifestyle photography with soft natural light',
    home:     'product styled in modern home environment, warm ambient lifestyle photography',
    fashion:  'product styled with lifestyle props, editorial lifestyle photography',
    abstract: 'product with artistic light and shadow composition, creative editorial photography',
  },
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, product_id, cleaned_image_url, product_type, scene_style, count } = await request.json()
    if (!workspace_id || !product_id || !cleaned_image_url) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    const shotCount = Math.min(Math.max(Number(count) || 1, 1), 4)
    const totalCredits = CREDIT_COSTS.product_lifestyle * shotCount

    const { ok, error: creditErr } = await checkCredits(
      workspace_id, user.id, totalCredits,
      'product_lifestyle', `Lifestyle shots x${shotCount}`
    )
    if (!ok) return creditErr!

    const style: SceneStyle = (['minimal','luxury','outdoor','home','fashion','abstract'] as const).includes(scene_style)
      ? scene_style as SceneStyle
      : 'minimal'

    const typePrompts = LIFESTYLE_PROMPTS[product_type] || LIFESTYLE_PROMPTS.general
    const basePrompt = typePrompts[style]

    const results = await Promise.all(Array.from({ length: shotCount }, async (_, i) => {
      try {
        const result = await fal.subscribe('fal-ai/nano-banana-2', {
          input: {
            prompt: `Professional lifestyle product photography, ${basePrompt}, no text, no people`,
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
          asset_type: 'lifestyle',
          url: permanentUrl || url,
          prompt: basePrompt,
          credits_used: CREDIT_COSTS.product_lifestyle,
          metadata: { product_type, scene_style: style, shot_index: i },
        }).select('id, url').single()

        return { id: asset?.id ?? `lifestyle-${i}`, url: permanentUrl || url }
      } catch (err) {
        console.error(`[product-lab/generate-lifestyle] shot ${i} failed:`, err)
        await supabase.rpc('deduct_credits', {
          p_workspace_id:  workspace_id,
          p_amount:        -CREDIT_COSTS.product_lifestyle,
          p_action:        'product_lifestyle_refund',
          p_user_id:       user.id,
          p_description:   `Refund: lifestyle shot ${i + 1} failed`,
        })
        return null
      }
    }))

    return NextResponse.json({ shots: results.filter((r): r is { id: string; url: string } => r !== null) })

  } catch (err) {
    console.error('[product-lab/generate-lifestyle]', err)
    return NextResponse.json({ error: 'Lifestyle generation failed' }, { status: 500 })
  }
}
