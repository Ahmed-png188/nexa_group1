import { rateLimit, LIMITS } from '@/lib/rate-limit'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enhanceVideoPrompt, enhanceImageToVideoPrompt } from '@/lib/prompt-enhancer'
import { getBrandContext } from '@/lib/brand-context'
import { guardWorkspace } from '@/lib/workspace-guard'
import { checkPlanAccess, checkCredits } from '@/lib/plan-gate'
import { persistFile } from '@/lib/storage'
import { getVideoCreditCost } from '@/lib/plan-constants'
import { fal } from '@fal-ai/client'

// Configure fal client
fal.config({ credentials: process.env.FAL_KEY })

function sanitize(input: unknown, max = 2000): string {
  if (typeof input !== 'string') throw new Error('Invalid input')
  return input.trim().slice(0, max)
}

// Resolve which fal model to call — server-side only, never exposed to client
function getVideoModel(
  mode: string,
  quality: string,
  audio: boolean,
  hasImage: boolean
): string {
  if (mode === 'frame') return 'fal-ai/kling-video/o3/standard/image-to-video'
  if (quality === 'cinema') {
    return hasImage
      ? 'fal-ai/veo3.1/image-to-video'
      : 'fal-ai/veo3.1/text-to-video'
  }
  // standard quality
  const variant = audio ? 'pro' : 'standard'
  return hasImage
    ? `fal-ai/kling-video/v3/${variant}/image-to-video`
    : `fal-ai/kling-video/v3/${variant}/text-to-video`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate limit: per user
    const _rl = await rateLimit({ key: user.id, ...LIMITS.videoGen })
    if (_rl.limited) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((_rl.resetAt.getTime() - Date.now()) / 1000)) } }
      )
    }

    const {
      workspace_id,
      prompt:          rawPrompt,
      mode         = 'text',    // 'text' | 'image' | 'frame'
      quality      = 'standard', // 'standard' | 'cinema'
      audio        = true,
      duration     = 8,
      image_url,
      start_frame_url,
      end_frame_url,
    } = await request.json()

    const prompt = sanitize(rawPrompt || '', 1000)

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    // Plan gate
    const gateError = await checkPlanAccess(workspace_id, 'video_generation')
    if (gateError) return gateError

    // Clamp duration to valid values
    const clampedDuration = ([5, 8, 10, 16] as const).includes(duration as 5|8|10|16)
      ? (duration as 5|8|10|16)
      : 8 as const

    // Determine effective mode for credit calculation
    const effectiveMode = mode === 'frame' ? 'frame' : (quality === 'cinema' ? 'cinema' : 'standard') as 'standard' | 'cinema' | 'frame'

    const creditCost = getVideoCreditCost(clampedDuration, effectiveMode, audio)

    const { ok, error: creditError } = await checkCredits(
      workspace_id, user.id, creditCost,
      'video_gen', `Video ${mode} ${clampedDuration}s`,
    )
    if (!ok) return creditError!

    // Get brand context for smart prompting
    const brand = await getBrandContext(workspace_id)

    // Build enhanced prompt
    let finalPrompt = prompt || 'cinematic brand video'
    try {
      if (mode === 'image' || mode === 'frame') {
        finalPrompt = await enhanceImageToVideoPrompt(prompt, brand, mode)
      } else {
        finalPrompt = await enhanceVideoPrompt(prompt, brand)
      }
    } catch {
      // Keep original if enhancer fails
    }

    const hasImage = mode === 'image' && !!image_url
    const modelId = getVideoModel(mode, quality, audio, hasImage)

    // Build fal input
    const falInput: Record<string, unknown> = {
      prompt: finalPrompt,
      duration: clampedDuration,
    }

    // Audio flag (cinema/veo models handle this natively)
    if (quality !== 'cinema') {
      // Kling models don't take an audio flag — silent variant chosen via model ID
    } else {
      falInput.audio = audio
    }

    if (image_url) falInput.image_url = image_url
    if (mode === 'frame') {
      if (start_frame_url) falInput.first_frame_image = start_frame_url
      if (end_frame_url)   falInput.last_frame_image  = end_frame_url
    }

    let videoUrl: string | null = null
    try {
      const result = await fal.subscribe(modelId, {
        input: falInput,
        logs: false,
        onQueueUpdate: () => {},
      })

      videoUrl = (result as any).data?.video?.url
        || (result as any).data?.url
        || (result as any).video?.url
        || null
    } catch (falErr: unknown) {
      console.error('[generate-video] fal error:', falErr instanceof Error ? falErr.message : falErr)
      // Refund credits on API failure
      await supabase.rpc('deduct_credits', {
        p_workspace_id: workspace_id, p_amount: -creditCost,
        p_action: 'video_gen_refund', p_user_id: user.id,
        p_description: 'Video generation refund — provider error',
      })
      return NextResponse.json({ error: 'Video generation failed' }, { status: 500 })
    }

    if (!videoUrl) {
      // Refund credits if no video returned
      await supabase.rpc('deduct_credits', {
        p_workspace_id: workspace_id, p_amount: -creditCost,
        p_action: 'video_gen_refund', p_user_id: user.id,
        p_description: 'Video generation refund — no output',
      })
      return NextResponse.json({ error: 'Video generation failed' }, { status: 500 })
    }

    const permanentUrl = await persistFile(videoUrl, workspace_id, 'video', undefined)

    const { data: savedContent } = await supabase.from('content').insert({
      workspace_id, created_by: user.id,
      type: 'video', platform: 'general', status: 'draft',
      video_url: permanentUrl || videoUrl,
      prompt: finalPrompt, credits_used: creditCost,
      ai_model: 'nexa-video',
      metadata: {
        duration: clampedDuration, mode, quality, audio,
        has_image: !!image_url,
        has_frames: mode === 'frame' && (!!start_frame_url || !!end_frame_url),
      },
    }).select().single()

    await supabase.from('activity').insert({
      workspace_id, user_id: user.id, type: 'video_generated',
      title: `Video generated (${mode}) — "${(prompt || 'brand video').slice(0, 50)}"`,
      metadata: { content_id: savedContent?.id, credits_used: creditCost, duration: clampedDuration, mode },
    })

    return NextResponse.json({
      success: true,
      video_url: permanentUrl || videoUrl,
      content_id: savedContent?.id,
      credits_used: creditCost,
      duration: clampedDuration,
      mode,
      enhanced_prompt: finalPrompt,
    })

  } catch (error: unknown) {
    console.error('[generate-video]', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Video generation failed' }, { status: 500 })
  }
}
