export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { persistFile } from '@/lib/storage'
import { getBrandContext } from '@/lib/brand-context'
import { guardWorkspace } from '@/lib/workspace-guard'
import { checkPlanAccess, checkCredits, CREDIT_COSTS } from '@/lib/plan-gate'
import { enhanceImagePrompt } from '@/lib/prompt-enhancer'
import { fal } from '@fal-ai/client'


// Configure fal client
fal.config({ credentials: process.env.FAL_KEY })

function sanitize(input: unknown, max = 2000): string {
  if (typeof input !== 'string') throw new Error('Invalid input')
  return input.trim().slice(0, max)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, prompt: rawPrompt, style, aspect_ratio = '1:1' } = await request.json()
    const prompt = sanitize(rawPrompt, 1000)

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    // ── Plan gate ──
    const gateError = await checkPlanAccess(workspace_id, 'image_generation')
    if (gateError) return gateError

    // ── Rate limit: max 10 image generations per hour per workspace ──
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: recentCount } = await supabase
      .from('content')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspace_id)
      .eq('type', 'image')
      .gte('created_at', oneHourAgo)
    if ((recentCount ?? 0) >= 10) {
      return NextResponse.json({
        error: 'Rate limit exceeded',
        message: 'Maximum 10 image generations per hour. Please wait before generating more.',
      }, { status: 429 })
    }

    if (!process.env.FAL_KEY) {
      return NextResponse.json({ error: 'Image generation not configured', message: 'FAL_KEY not set. Add your Fal.ai API key to environment variables.' }, { status: 503 })
    }

    const { ok: credOk, error: creditError } = await checkCredits(
      workspace_id, user.id, CREDIT_COSTS.image,
      'image_gen', 'Image generation — Nano Banana 2',
    )
    if (!credOk) return creditError!

    // Enhance prompt with brand context and AI art direction
    const brand = await getBrandContext(workspace_id)
    const basePrompt = style ? `${prompt}, ${style} style` : prompt
    let finalPrompt = basePrompt
    try {
      finalPrompt = await enhanceImagePrompt(basePrompt, brand)
    } catch (e) {
      console.error('[generate-image] Enhancer failed, using original prompt')

      finalPrompt = basePrompt
    }

    // Call Nano Banana 2 via fal SDK
    const result = await fal.subscribe('fal-ai/nano-banana-2', {
      input: {
        prompt: finalPrompt,
        resolution: '1K',
        output_format: 'png',
        num_images: 1,
      },
      logs: false,
      onQueueUpdate: () => {},
    })

    const imageUrl = (result as any).data?.images?.[0]?.url
    if (!imageUrl) throw new Error('No image returned from Nano Banana 2')

    // Save to DB first to get ID
    const { data: savedContent } = await supabase.from('content').insert({
      workspace_id,
      created_by: user.id,
      type: 'image',
      platform: 'general',
      status: 'draft',
      image_url: imageUrl,
      prompt: finalPrompt,
      credits_used: 5,
      ai_model: 'fal-ai/nano-banana-2',
      metadata: { aspect_ratio, style, original_prompt: prompt },
    }).select().single()

    // Persist to Supabase Storage (permanent URL)
    const permanentUrl = await persistFile(imageUrl, workspace_id, 'image', savedContent?.id)

    // Update with permanent URL
    if (savedContent?.id && permanentUrl !== imageUrl) {
      await supabase.from('content').update({ image_url: permanentUrl }).eq('id', savedContent.id)
    }

    await supabase.from('activity').insert({
      workspace_id,
      user_id: user.id,
      type: 'image_generated',
      title: `Image generated — "${prompt.slice(0, 60)}${prompt.length > 60 ? '...' : ''}"`,
      metadata: { content_id: savedContent?.id, credits_used: 5 },
    })

    return NextResponse.json({
      success: true,
      image_url: permanentUrl,
      content_id: savedContent?.id,
      credits_used: 5,
    })

  } catch (error: unknown) {
    console.error('[generate-image] Error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 })
  }
}
