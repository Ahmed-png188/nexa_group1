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
      'product_clean', 'Background removal'
    )
    if (!ok) return creditErr!

    try {
      const result = await fal.subscribe('fal-ai/birefnet', {
        input: {
          image_url,
          model: 'General Use (Light)',
          operating_resolution: '1024x1024',
          output_format: 'png',
        },
        logs: false,
        onQueueUpdate: () => {},
      })

      const url = (result as any).data?.image?.url
      if (!url) throw new Error('No image returned')

      const permanentUrl = await persistFile(url, workspace_id, 'image', undefined)
      const finalUrl = permanentUrl || url

      // Update product's cleaned_image_url if product_id provided
      if (product_id) {
        await supabase.from('products').update({ cleaned_image_url: finalUrl }).eq('id', product_id)

        await supabase.from('product_assets').insert({
          product_id,
          workspace_id,
          asset_type: 'cleaned',
          url: finalUrl,
          credits_used: CREDIT_COSTS.product_clean,
          metadata: {},
        })
      }

      return NextResponse.json({ url: finalUrl })
    } catch (err) {
      console.error('[product-lab/remove-background] generation failed:', err)
      // Refund credit
      await supabase.rpc('deduct_credits', {
        p_workspace_id:  workspace_id,
        p_amount:        -CREDIT_COSTS.product_clean,
        p_action:        'product_clean_refund',
        p_user_id:       user.id,
        p_description:   'Refund: background removal failed',
      })
      return NextResponse.json({ error: 'Background removal failed' }, { status: 500 })
    }

  } catch (err) {
    console.error('[product-lab/remove-background]', err)
    return NextResponse.json({ error: 'Background removal failed' }, { status: 500 })
  }
}
