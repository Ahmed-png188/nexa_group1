export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { guardWorkspace } from '@/lib/workspace-guard'
import { checkCredits, CREDIT_COSTS } from '@/lib/plan-gate'
import { persistFile } from '@/lib/storage'
import { fal } from '@fal-ai/client'

fal.config({ credentials: process.env.FAL_KEY })

const SCENES: Record<string, { label: string; prompt: string }> = {
  marble_minimal:  { label: 'Marble Minimal',   prompt: 'product on polished white marble surface, minimal composition, soft natural side light, luxury editorial photography' },
  golden_hour:     { label: 'Golden Hour',       prompt: 'product bathed in warm golden hour sunlight, dreamy bokeh background, lifestyle photography' },
  dark_luxury:     { label: 'Dark Luxury',       prompt: 'product on dark slate surface, dramatic low-key lighting, gold accents, premium luxury editorial' },
  garden_fresh:    { label: 'Garden Fresh',      prompt: 'product surrounded by fresh botanicals and flowers, soft natural light, garden editorial photography' },
  home_cozy:       { label: 'Home & Cozy',       prompt: 'product styled in cozy home interior, warm ambient light, lifestyle home photography' },
  tech_dark:       { label: 'Tech Dark',         prompt: 'product on dark carbon fiber surface with subtle RGB accent lighting, tech lifestyle photography' },
  beach_summer:    { label: 'Beach Summer',      prompt: 'product on sandy beach surface, bright summer sun, lifestyle summer photography' },
  cafe_morning:    { label: 'Café Morning',      prompt: 'product on café table with morning light, coffee and pastries nearby, lifestyle editorial photography' },
  urban_concrete:  { label: 'Urban Concrete',    prompt: 'product on raw concrete surface with urban texture, editorial lifestyle photography' },
  fashion_studio:  { label: 'Fashion Studio',    prompt: 'product styled in minimalist fashion studio, directional spotlight, editorial fashion photography' },
  pastel_dream:    { label: 'Pastel Dream',      prompt: 'product on soft pastel background with delicate props, dreamy editorial photography, soft light' },
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, product_id, image_url, product_type, scenes } = await request.json()
    if (!workspace_id || !image_url) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    const requestedScenes: string[] = Array.isArray(scenes) && scenes.length > 0
      ? scenes.slice(0, 4)
      : ['marble_minimal']

    const totalCredits = CREDIT_COSTS.product_lifestyle * requestedScenes.length

    const { ok, error: creditErr } = await checkCredits(
      workspace_id, user.id, totalCredits,
      'product_lifestyle', `Lifestyle scenes x${requestedScenes.length}`
    )
    if (!ok) return creditErr!

    const results = await Promise.all(requestedScenes.map(async (sceneId) => {
      const scene = SCENES[sceneId] ?? SCENES.home_cozy
      const scenePrompt = scene.prompt

      const kontextPrompt = `Take this exact product and place it naturally into this scene: ${scenePrompt}. CRITICAL: The product must remain completely identical — same shape, same colors, same materials, same details. Only the background and environment change. The product is the hero of the image. Photorealistic, professional commercial photography, 8K quality.`

      let resultUrl: string | null = null

      // Try Flux Kontext first
      try {
        const result = await fal.subscribe('fal-ai/flux-pro/kontext', {
          input: {
            prompt: kontextPrompt,
            image_url,
            output_format: 'jpeg',
            safety_tolerance: '5',
          } as any,
          logs: false,
          onQueueUpdate: () => {},
        })
        resultUrl = (result as any).data?.images?.[0]?.url
          || (result as any).images?.[0]?.url
          || null
      } catch (e1) {
        console.error('[lifestyle] kontext failed:', e1)
      }

      // Fallback to Flux Pro with image conditioning
      if (!resultUrl) {
        try {
          const result = await fal.subscribe('fal-ai/flux-pro/v1.1', {
            input: {
              prompt: kontextPrompt,
              image_url,
              image_prompt_strength: 0.75,
              num_images: 1,
              output_format: 'jpeg',
              aspect_ratio: '1:1',
              safety_tolerance: '5',
            } as any,
            logs: false,
            onQueueUpdate: () => {},
          })
          resultUrl = (result as any).data?.images?.[0]?.url
            || (result as any).images?.[0]?.url
            || null
        } catch (e2) {
          console.error('[lifestyle] flux-pro failed:', e2)
        }
      }

      // Last fallback — Nano Banana with reference
      if (!resultUrl) {
        try {
          const result = await fal.subscribe('fal-ai/nano-banana-2', {
            input: {
              prompt: `${scenePrompt}. The product shown in the reference image must appear prominently in this scene, exactly as it looks.`,
              image_url,
              resolution: '1K',
              output_format: 'jpeg',
              num_images: 1,
            } as any,
            logs: false,
            onQueueUpdate: () => {},
          })
          resultUrl = (result as any).data?.images?.[0]?.url
            || (result as any).images?.[0]?.url
            || null
        } catch (e3) {
          console.error('[lifestyle] all models failed:', e3)
        }
      }

      if (!resultUrl) {
        try {
          await supabase.rpc('deduct_credits', {
            p_workspace_id: workspace_id,
            p_amount:       -CREDIT_COSTS.product_lifestyle,
            p_action:       'product_lifestyle_refund',
            p_user_id:      user.id,
            p_description:  `Refund: lifestyle scene ${sceneId} failed`,
          })
        } catch {}
        return null
      }

      const permanentUrl = await persistFile(resultUrl, workspace_id, 'image', undefined)
        .catch(() => resultUrl as string)
      const finalUrl = permanentUrl || resultUrl

      if (product_id) {
        try {
          await supabase.from('product_assets').insert({
            product_id,
            workspace_id,
            asset_type: 'lifestyle',
            url: finalUrl,
            prompt: scenePrompt,
            credits_used: CREDIT_COSTS.product_lifestyle,
            metadata: { scene_id: sceneId, product_type },
          })
        } catch (err) { console.error('[lifestyle] asset insert failed:', err) }
      }

      return { id: sceneId, url: finalUrl, scene: sceneId, label: scene.label }
    }))

    return NextResponse.json({
      scenes: results.filter((r): r is { id: string; url: string; scene: string; label: string } => r !== null)
    })

  } catch (err) {
    console.error('[product-lab/lifestyle]', err)
    return NextResponse.json({ scenes: [] })
  }
}
