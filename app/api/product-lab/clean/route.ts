export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { guardWorkspace } from '@/lib/workspace-guard'
import { checkCredits, CREDIT_COSTS } from '@/lib/plan-gate'
import { persistFile } from '@/lib/storage'
import { fal } from '@fal-ai/client'

fal.config({ credentials: process.env.FAL_KEY })

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, product_id, image_url } = await request.json()
    if (!workspace_id || !image_url) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    const { ok, error: creditErr } = await checkCredits(
      workspace_id, user.id, CREDIT_COSTS.product_clean,
      'product_clean', 'Product clean — background removal'
    )
    if (!ok) return creditErr!

    let cleanedUrl = image_url // fallback to original

    try {
      const bgResult = await fal.subscribe('fal-ai/birefnet', {
        input: {
          image_url,
          model: 'General Use (Light)',
          output_format: 'png',
        },
        logs: false,
        onQueueUpdate: () => {},
      })
      const bgUrl = (bgResult as any).data?.image?.url
        || (bgResult as any).image?.url
        || (bgResult as any).data?.image_url
      if (bgUrl) cleanedUrl = bgUrl
      else console.error('[clean] birefnet returned no URL, using original')
    } catch (bgErr) {
      console.error('[clean] birefnet failed:', bgErr)
      // Continue with original image — don't fail the whole route
    }

    // Upscale (optional — skip if fal fails)
    let finalUrl = cleanedUrl
    try {
      const upResult = await fal.subscribe('fal-ai/aura-sr', {
        input: {
          image_url: cleanedUrl,
          upscaling_factor: 2,
          overlapping_tiles: true,
        } as any,
        logs: false,
        onQueueUpdate: () => {},
      })
      const upUrl = (upResult as any).data?.image?.url
        || (upResult as any).image?.url
      if (upUrl) finalUrl = upUrl
    } catch (upErr) {
      console.error('[clean] upscale failed, using cleaned:', upErr)
    }

    // Persist to storage
    const permanentUrl = await persistFile(finalUrl, workspace_id, 'image', undefined)
      .catch(() => finalUrl) // if storage fails, use direct URL

    // Update product record if product_id provided
    if (product_id) {
      try {
        await supabase.from('products').update({ cleaned_url: permanentUrl }).eq('id', product_id)
      } catch (err) { console.error('[clean] product update failed:', err) }

      try {
        await supabase.from('product_assets').insert({
          product_id,
          workspace_id,
          asset_type: 'cleaned',
          url: permanentUrl,
          credits_used: CREDIT_COSTS.product_clean,
          metadata: {},
        })
      } catch (err) { console.error('[clean] asset insert failed:', err) }
    }

    return NextResponse.json({ cleaned_url: permanentUrl })

  } catch (err) {
    console.error('[product-lab/clean]', err)
    return NextResponse.json({ error: 'Product clean failed' }, { status: 500 })
  }
}
