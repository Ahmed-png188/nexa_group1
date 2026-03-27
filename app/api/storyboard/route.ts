export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { guardWorkspace } from '@/lib/workspace-guard'
import { checkCredits } from '@/lib/plan-gate'
import { getBrandContext } from '@/lib/brand-context'
import { persistFile } from '@/lib/storage'
import { enhanceStoryboardPrompts } from '@/lib/prompt-enhancer'
import { fal } from '@fal-ai/client'

fal.config({ credentials: process.env.FAL_KEY })

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const {
      workspace_id,
      product_image_url,
      story_direction = '',
      shot_count      = 4,
      duration_per_shot = 5,
      output_format   = '9:16',
      audio           = true,
      lang            = 'en',
    } = await request.json()

    if (!workspace_id || !product_image_url) {
      return NextResponse.json(
        { error: 'Missing workspace_id or product_image_url' },
        { status: 400 }
      )
    }

    // Validate shot_count
    const validShotCount = ([3, 4, 5] as const).includes(shot_count as 3|4|5)
      ? (shot_count as 3|4|5)
      : 4

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    // Credit cost
    const creditCosts: Record<number, number> = { 3: 258, 4: 344, 5: 430 }
    const creditCost = creditCosts[validShotCount] ?? 344

    const { ok, error: creditErr } = await checkCredits(
      workspace_id, user.id, creditCost,
      'storyboard', `Storyboard — ${validShotCount} shots × ${duration_per_shot}s`
    )
    if (!ok) return creditErr!

    // ── STEP 1: Load brand context ────────────────────────────────────────
    const brand = await getBrandContext(workspace_id)

    // ── STEP 2: Claude acts as Creative Director ──────────────────────────
    let storyboard: Awaited<ReturnType<typeof enhanceStoryboardPrompts>>
    try {
      storyboard = await enhanceStoryboardPrompts(
        story_direction,
        brand,
        validShotCount,
        duration_per_shot,
        output_format,
        lang
      )
    } catch (planErr) {
      console.error('[storyboard] planning failed:', planErr)
      // Refund credits
      try { await supabase.rpc('deduct_credits', {
        p_workspace_id: workspace_id, p_amount: -creditCost,
        p_action: 'storyboard_refund', p_user_id: user.id,
        p_description: 'Storyboard refund — planning failed',
      }) } catch {}
      return NextResponse.json(
        { error: 'Failed to plan the commercial. Please try again.' },
        { status: 500 }
      )
    }

    // ── STEP 3: Build Kling multi_prompt array ────────────────────────────
    const multiPrompt = storyboard.shots.map(shot => ({
      prompt: shot.prompt,
      duration: shot.duration,
    }))

    const totalDuration = multiPrompt.reduce((acc, s) => acc + (s.duration || 5), 0)

    // ── STEP 4: Single Kling v3 pro image-to-video call ──────────────────
    // product_image_url is the visual anchor (start_image_url) — product
    // identity is preserved across all shots via image conditioning.
    let videoUrl: string | null = null

    try {
      const result = await fal.subscribe(
        'fal-ai/kling-video/v3/pro/image-to-video',
        {
          input: {
            start_image_url: product_image_url,
            multi_prompt: multiPrompt,
            multi_prompt_mode: 'customize',
            generate_audio: audio,
          } as any,
          logs: false,
          onQueueUpdate: () => {},
        }
      )

      videoUrl = (result as any).data?.video?.url
        || (result as any).data?.url
        || (result as any).video?.url
        || null

    } catch (proErr) {
      console.error('[storyboard] kling v3 pro failed:', proErr)

      // Fallback: Kling v3 standard image-to-video
      try {
        const result2 = await fal.subscribe(
          'fal-ai/kling-video/v3/standard/image-to-video',
          {
            input: {
              start_image_url: product_image_url,
              multi_prompt: multiPrompt,
              multi_prompt_mode: 'customize',
              generate_audio: audio,
            } as any,
            logs: false,
            onQueueUpdate: () => {},
          }
        )
        videoUrl = (result2 as any).data?.video?.url
          || (result2 as any).data?.url
          || null
      } catch (stdErr) {
        console.error('[storyboard] kling v3 standard also failed:', stdErr)
      }
    }

    if (!videoUrl) {
      // Refund credits — nothing was produced
      try { await supabase.rpc('deduct_credits', {
        p_workspace_id: workspace_id, p_amount: -creditCost,
        p_action: 'storyboard_refund', p_user_id: user.id,
        p_description: 'Storyboard refund — Kling generation failed',
      }) } catch {}
      return NextResponse.json(
        { error: 'Commercial generation failed. Your credits have been refunded.' },
        { status: 500 }
      )
    }

    // ── STEP 5: Persist and save ──────────────────────────────────────────
    const permanentUrl = await persistFile(videoUrl, workspace_id, 'video', undefined)
      .catch(() => videoUrl!)

    const { data: saved } = await supabase.from('content').insert({
      workspace_id,
      created_by:   user.id,
      type:         'video',
      platform:     'general',
      status:       'draft',
      video_url:    permanentUrl,
      prompt:       storyboard.commercial_concept,
      credits_used: creditCost,
      ai_model:     'nexa-video',
      metadata: {
        type:               'storyboard',
        shot_count:         validShotCount,
        duration_per_shot,
        total_duration:     totalDuration,
        output_format,
        audio,
        commercial_concept: storyboard.commercial_concept,
        commercial_hook:    storyboard.commercial_hook,
        environment:        storyboard.environment,
        master_style:       storyboard.master_style,
        color_grade:        storyboard.color_grade,
        lighting_setup:     storyboard.lighting_setup,
      },
    }).select().single().then(r => r, () => ({ data: null }))

    return NextResponse.json({
      success:        true,
      video_url:      permanentUrl,
      content_id:     saved?.id,
      credits_used:   creditCost,
      total_duration: totalDuration,
      shot_count:     validShotCount,
      output_format,
      audio,
      storyboard: {
        commercial_concept: storyboard.commercial_concept,
        environment:        storyboard.environment,
        master_style:       storyboard.master_style,
        color_grade:        storyboard.color_grade,
        lighting_setup:     storyboard.lighting_setup,
        commercial_hook:    storyboard.commercial_hook,
        shots:              storyboard.shots,
      },
    })

  } catch (err) {
    console.error('[storyboard]', err)
    return NextResponse.json({ error: 'Storyboard failed' }, { status: 500 })
  }
}
