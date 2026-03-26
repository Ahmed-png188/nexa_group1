export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { guardWorkspace } from '@/lib/workspace-guard'
import { checkCredits, CREDIT_COSTS } from '@/lib/plan-gate'
import { persistFile } from '@/lib/storage'
import { fal } from '@fal-ai/client'

fal.config({ credentials: process.env.FAL_KEY })

const SHOT_CONFIGS: Record<string, { label: string }> = {
  hero:         { label: 'Hero' },
  angle_34:     { label: '3/4 Angle' },
  top_down:     { label: 'Top Down' },
  detail:       { label: 'Detail' },
  side_profile: { label: 'Side' },
  floating:     { label: 'Floating' },
}

const KONTEXT_PROMPTS: Record<string, string> = {
  hero: `Place this exact product on a pure white background. Professional studio photography lighting, soft boxes from both sides. Product centered, filling 70% of frame, perfectly straight front view. Remove all original background. Keep the product exactly as it appears.`,
  angle_34: `Place this exact product on a pure white background. Rotate the view to show a three-quarter angle perspective. Professional studio lighting, product sharp and clear. Remove all original background. Keep every detail of the product identical.`,
  top_down: `Place this exact product on a pure white background shot from directly above. Flat lay composition, perfectly overhead bird's eye view. Even diffused lighting, no shadows. Remove original background. Keep the product exactly as it appears.`,
  detail: `Show an extreme close-up macro photograph of the most interesting detail of this product. Pure white background, ring light, razor sharp focus. Remove original background. Keep product details identical.`,
  side_profile: `Place this exact product on a pure white background. Rotate to show the exact side profile at 90 degrees. Professional studio lighting. Remove all original background. Keep every detail of the product identical.`,
  floating: `Place this exact product floating against a pure white background. Slight upward angle view, dramatic overhead studio lighting. Soft shadow directly below the product. Remove original background. Keep product identical.`,
}

async function generateShot(
  cleanedUrl: string,
  shotStyle: string,
  productType: string,
  productMaterial: string,
  productColor: string,
): Promise<string | null> {
  const prompt = KONTEXT_PROMPTS[shotStyle] || KONTEXT_PROMPTS.hero

  // Try Flux Kontext first — best for image consistency
  try {
    const result = await fal.subscribe('fal-ai/flux-pro/kontext', {
      input: {
        prompt,
        image_url: cleanedUrl,
        output_format: 'png',
        safety_tolerance: '5',
      } as any,
      logs: false,
      onQueueUpdate: () => {},
    })
    const url = (result as any).data?.images?.[0]?.url
      || (result as any).images?.[0]?.url
    if (url) return url
  } catch (e1) {
    console.error(`[studio-shots] kontext failed for ${shotStyle}:`, e1)
  }

  // Fallback: Flux Pro with image conditioning
  try {
    const result = await fal.subscribe('fal-ai/flux-pro/v1.1', {
      input: {
        prompt: `Professional product photography studio shot. ${prompt} Product type: ${productType}, material: ${productMaterial}, color: ${productColor}.`,
        image_url: cleanedUrl,
        image_prompt_strength: 0.85,
        num_images: 1,
        output_format: 'png',
        aspect_ratio: '1:1',
        safety_tolerance: '5',
      } as any,
      logs: false,
      onQueueUpdate: () => {},
    })
    const url = (result as any).data?.images?.[0]?.url
      || (result as any).images?.[0]?.url
    if (url) return url
  } catch (e2) {
    console.error(`[studio-shots] flux-pro/v1.1 failed for ${shotStyle}:`, e2)
  }

  // Last fallback: Nano Banana with reference image
  try {
    const result = await fal.subscribe('fal-ai/nano-banana-2', {
      input: {
        prompt: `Professional product photography, pure white background, studio lighting, ${shotStyle} view of ${productColor} ${productType}. Sharp focus, commercial quality, isolated product.`,
        image_url: cleanedUrl,
        resolution: '1K',
        output_format: 'png',
        num_images: 1,
      } as any,
      logs: false,
      onQueueUpdate: () => {},
    })
    return (result as any).data?.images?.[0]?.url
      || (result as any).images?.[0]?.url
      || null
  } catch (e3) {
    console.error(`[studio-shots] all models failed for ${shotStyle}:`, e3)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, product_id, image_url, product_type, product_material, product_color, shots } = await request.json()
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

      const url = await generateShot(
        image_url,
        shotId,
        product_type || 'general',
        product_material || 'unknown',
        product_color || 'unknown',
      )

      if (!url) {
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
            prompt: KONTEXT_PROMPTS[shotId] || '',
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
    return NextResponse.json({ shots: [] })
  }
}
