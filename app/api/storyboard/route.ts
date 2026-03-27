export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { guardWorkspace } from '@/lib/workspace-guard'
import { getBrandContext } from '@/lib/brand-context'
import { checkCredits } from '@/lib/plan-gate'
import { persistFile } from '@/lib/storage'
import { CREDIT_COSTS } from '@/lib/plan-constants'
import Anthropic from '@anthropic-ai/sdk'
import { fal } from '@fal-ai/client'

fal.config({ credentials: process.env.FAL_KEY })

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const {
      workspace_id,
      product_image_url,
      story_direction,
      shot_count = 4,
      duration_per_shot = 5,
      output_format = '9:16',
      audio = true,
      lang = 'en',
    } = await request.json()

    if (!workspace_id || !product_image_url) {
      return NextResponse.json({ error: 'Missing workspace_id or product_image_url' }, { status: 400 })
    }

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    // Credit cost
    const creditKey = `storyboard_${shot_count}shot` as keyof typeof CREDIT_COSTS
    const creditCost = (CREDIT_COSTS as any)[creditKey] ?? CREDIT_COSTS.storyboard_4shot

    const creditCheck = await checkCredits(workspace_id, user.id, creditCost, 'storyboard', `${shot_count}-shot commercial`)
    if (creditCheck) return creditCheck

    const brand = await getBrandContext(workspace_id)
    const brandName     = brand?.workspace?.brand_name    || 'the brand'
    const brandVoice    = brand?.workspace?.brand_voice   || 'premium, modern'
    const brandAudience = brand?.workspace?.brand_audience || 'modern consumers'
    const brandTone     = brand?.workspace?.brand_tone    || 'sophisticated'
    const visualStyle   = brand?.profile?.visual?.aesthetic          || 'cinematic, premium'
    const colorMood     = brand?.profile?.visual?.color_mood         || 'rich, deep tones'
    const photoStyle    = brand?.profile?.visual?.photography_style  || 'professional commercial'
    const industry      = brand?.profile?.business?.industry         || 'consumer goods'

    const aspectRatio = output_format === '9:16' ? '9:16'
      : output_format === '16:9' ? '16:9'
      : '1:1'

    // ── Step 1: Claude plans the shot list as multi_prompt array ──────────────
    const systemPrompt = `You are a commercial film director. Generate a ${shot_count}-shot product commercial plan.
The product image is attached as @Element1 in the video generator. Reference it in EVERY shot prompt as "@Element1" to ensure product consistency.

RULES:
- Every shot prompt MUST contain "@Element1" so the product appears consistently
- Maintain same environment, lighting, and mood across all shots
- Logical narrative: establish → introduce product → detail → close
- Each prompt: 60-90 words, cinematic language, specific camera/lighting/action details
- Output ONLY valid JSON, no other text`

    const userPrompt = `Design a ${shot_count}-shot product commercial storyboard.

Brand: ${brandName}
Voice: ${brandVoice}
Audience: ${brandAudience}
Tone: ${brandTone}
Aesthetic: ${visualStyle}
Color mood: ${colorMood}
Photography style: ${photoStyle}
Industry: ${industry}
Creative direction: ${story_direction || 'Make it premium, aspirational, and brand-aligned'}
Duration per shot: ${duration_per_shot}s
Aspect ratio: ${output_format}

Output this exact JSON:
{
  "concept": "One-sentence director's concept",
  "environment": "Consistent environment across all shots",
  "shots": [
    {
      "shot_number": 1,
      "purpose": "establish/introduce/detail/close",
      "prompt": "Cinematic commercial shot. [scene description]. @Element1 [product action/placement]. [camera movement]. [lighting]. [mood]. [60-90 words total]"
    }
  ]
}`

    const planResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const rawPlan = (planResponse.content[0] as any).text?.trim()
    let plan: any
    try {
      const match = rawPlan.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('No JSON found')
      plan = JSON.parse(match[0])
    } catch (parseErr) {
      console.error('[storyboard] plan parse failed:', parseErr)
      return NextResponse.json({ error: 'Failed to plan commercial' }, { status: 500 })
    }

    if (!plan.shots || plan.shots.length === 0) {
      return NextResponse.json({ error: 'No shots generated in plan' }, { status: 500 })
    }

    // ── Step 2: Build multi_prompt array for Kling ────────────────────────────
    const multiPrompt = plan.shots.map((s: any) => ({
      prompt: s.prompt,
      duration: duration_per_shot,
    }))

    // ── Step 3: Single Kling v3 call with multi_prompt ────────────────────────
    let videoUrl: string | null = null

    const klingInput = {
      multi_prompt: multiPrompt,
      multi_prompt_mode: 'customize',
      elements: [{ image_url: product_image_url }],
      aspect_ratio: aspectRatio,
      generate_audio: audio,
    }

    try {
      const result: any = await fal.subscribe('fal-ai/kling-video/v3/pro/text-to-video', {
        input: klingInput as any,
        pollInterval: 8000,
      })
      videoUrl = result?.video?.url ?? result?.video_url ?? null
    } catch (proErr) {
      console.warn('[storyboard] kling-pro failed, trying standard:', proErr)
      try {
        const result: any = await fal.subscribe('fal-ai/kling-video/v3/standard/text-to-video', {
          input: klingInput as any,
          pollInterval: 8000,
        })
        videoUrl = result?.video?.url ?? result?.video_url ?? null
      } catch (stdErr) {
        console.error('[storyboard] kling-standard also failed:', stdErr)
        return NextResponse.json({ error: 'Video generation failed' }, { status: 500 })
      }
    }

    if (!videoUrl) {
      return NextResponse.json({ error: 'No video URL returned' }, { status: 500 })
    }

    // ── Step 4: Persist video + deduct credits ────────────────────────────────
    const persistedUrl = await persistFile(videoUrl, workspace_id, 'video', undefined).catch(() => videoUrl)

    try {
      await supabase.rpc('deduct_credits', { p_workspace_id: workspace_id, p_amount: creditCost })
    } catch (creditErr) {
      console.error('[storyboard] credit deduction failed:', creditErr)
    }

    try {
      await supabase.from('content').insert({
        workspace_id,
        type: 'video',
        body: `${shot_count}-shot commercial: ${plan.concept || story_direction || brandName}`,
        image_url: persistedUrl,
        credits_used: creditCost,
        platform: 'general',
      })
    } catch (logErr) {
      console.error('[storyboard] content log failed:', logErr)
    }

    return NextResponse.json({
      video_url: persistedUrl,
      plan,
      shot_count: plan.shots.length,
      total_duration: plan.shots.length * duration_per_shot,
      output_format,
      audio,
      credits_used: creditCost,
    })

  } catch (err) {
    console.error('[storyboard]', err)
    return NextResponse.json({ error: 'Storyboard generation failed' }, { status: 500 })
  }
}
