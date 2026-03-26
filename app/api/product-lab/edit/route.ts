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

    const { workspace_id, product_id, image_url, edit_prompt } = await request.json()
    if (!workspace_id || !image_url || !edit_prompt) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    const { ok, error: creditErr } = await checkCredits(
      workspace_id, user.id, CREDIT_COSTS.product_edit,
      'product_edit', 'Product edit — AI art direction'
    )
    if (!ok) return creditErr!

    try {
      const result = await fal.subscribe('fal-ai/flux-pro/kontext', {
        input: {
          prompt: edit_prompt.trim().slice(0, 800),
          image_url,
          aspect_ratio: '1:1',
          num_images: 1,
          output_format: 'png',
          guidance_scale: 3.5,
        },
        logs: false,
        onQueueUpdate: () => {},
      })

      const url = (result as any).data?.images?.[0]?.url
      if (!url) throw new Error('No image returned from Kontext')

      const permanentUrl = await persistFile(url, workspace_id, 'image', undefined)
      const finalUrl = permanentUrl || url

      let assetId: string | undefined
      if (product_id) {
        const { data: asset } = await supabase.from('product_assets').insert({
          product_id,
          workspace_id,
          asset_type: 'edit',
          url: finalUrl,
          edit_prompt,
          credits_used: CREDIT_COSTS.product_edit,
          metadata: {},
        }).select('id').single()
        assetId = asset?.id
      }

      return NextResponse.json({ edited_url: finalUrl, asset_id: assetId })
    } catch (err) {
      console.error('[product-lab/edit] generation failed:', err)
      await supabase.rpc('deduct_credits', {
        p_workspace_id: workspace_id,
        p_amount:       -CREDIT_COSTS.product_edit,
        p_action:       'product_edit_refund',
        p_user_id:      user.id,
        p_description:  'Refund: product edit failed',
      })
      return NextResponse.json({ error: 'Product edit failed' }, { status: 500 })
    }

  } catch (err) {
    console.error('[product-lab/edit]', err)
    return NextResponse.json({ error: 'Product edit failed' }, { status: 500 })
  }
}
