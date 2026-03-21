export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enhanceVideoPrompt, enhanceImageToVideoPrompt } from '@/lib/prompt-enhancer'
import { getBrandContext } from '@/lib/brand-context'
import { guardWorkspace } from '@/lib/workspace-guard'
import { checkPlanAccess, checkCredits, CREDIT_COSTS } from '@/lib/plan-gate'
import { persistFile } from '@/lib/storage'


function sanitize(input: unknown, max = 2000): string {
  if (typeof input !== 'string') throw new Error('Invalid input')
  return input.trim().slice(0, max)
}

// Fetch image URL and convert to base64 for Veo API
async function urlToBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const mimeType = contentType.split(';')[0].trim()
    const buf = await res.arrayBuffer()
    const base64 = Buffer.from(buf).toString('base64')
    return { data: base64, mimeType }
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const {
      workspace_id,
      prompt:          rawPrompt,
      aspect_ratio = '9:16',
      duration     = 8,
      mode         = 'text',  // 'text' | 'image' | 'frame'
      image_url,              // for image-to-video
      start_frame_url,        // for frame-to-frame
      end_frame_url,
    } = await request.json()

    const prompt = sanitize(rawPrompt || '', 1000)

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    // Plan gate
    const gateError = await checkPlanAccess(workspace_id, 'video_generation')
    if (gateError) return gateError

    // Duration-based credit cost — all 4 durations
    const clampedDuration = [5,8,10,16].includes(duration) ? duration : 8
    // Credit costs: 5s=6cr, 8s=10cr, 10s=12cr, 16s=20cr
    const creditCost = clampedDuration===5 ? 6
      : clampedDuration===8  ? CREDIT_COSTS.video_8s
      : clampedDuration===10 ? 12
      : CREDIT_COSTS.video_16s

    const { ok, error: creditError } = await checkCredits(
      workspace_id, user.id, creditCost,
      'video_gen', `Video ${mode} ${clampedDuration}s — Veo 3.1 Fast`,
    )
    if (!ok) return creditError!

    // Get brand context for smart prompting
    const brand = await getBrandContext(workspace_id)

    // Build the enhanced prompt — different logic per mode
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

    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not configured')

    // Build the Veo API instance payload
    const instance: Record<string, any> = { prompt: finalPrompt }

    // Image-to-video: attach reference image
    if (mode === 'image' && image_url) {
      const img = await urlToBase64(image_url)
      if (img) {
        instance.image = {
          bytesBase64Encoded: img.data,
          mimeType: img.mimeType,
        }
      }
    }

    // Frame-to-frame: attach start and end frames
    if (mode === 'frame') {
      if (start_frame_url) {
        const startImg = await urlToBase64(start_frame_url)
        if (startImg) {
          instance.startImage = {
            bytesBase64Encoded: startImg.data,
            mimeType: startImg.mimeType,
          }
        }
      }
      if (end_frame_url) {
        const endImg = await urlToBase64(end_frame_url)
        if (endImg) {
          instance.endImage = {
            bytesBase64Encoded: endImg.data,
            mimeType: endImg.mimeType,
          }
        }
      }
    }

    const submitRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-fast-generate-preview:predictLongRunning?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [instance],
          parameters: {
            aspectRatio:     aspect_ratio,
            durationSeconds: clampedDuration,
            generateAudio:   true,
            resolution:      '720p',
          }
        })
      }
    )

    if (!submitRes.ok) {
      const errText = await submitRes.text()
      console.error('[generate-video] Veo error:', submitRes.status, errText)
      await supabase.rpc('deduct_credits', {
        p_workspace_id: workspace_id, p_amount: -creditCost,
        p_action: 'video_gen_refund', p_user_id: user.id,
        p_description: 'Video generation refund — Veo API error',
      })
      throw new Error(`Veo API error: ${submitRes.status}`)
    }

    const operation = await submitRes.json()
    const operationName = operation.name
    if (!operationName) throw new Error('No operation name from Veo')

    // Poll for completion — max ~3 minutes
    let videoUrl: string | null = null
    for (let i = 0; i < 22; i++) {
      await new Promise(r => setTimeout(r, 8000))
      const pollRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`)
      if (!pollRes.ok) continue
      const pollData = await pollRes.json()
      if (pollData.done) {
        const samples = pollData.response?.predictions?.[0]?.videos ||
                        pollData.response?.generateVideoResponse?.generatedSamples ||
                        pollData.response?.predictions
        if (samples?.[0]?.video?.uri) {
          videoUrl = samples[0].video.uri
        } else if (samples?.[0]?.bytesBase64Encoded) {
          const buf = Buffer.from(samples[0].bytesBase64Encoded, 'base64')
          const fileName = `video_${user.id}_${Date.now()}.mp4`
          const { data: upload } = await supabase.storage
            .from('generated-content').upload(fileName, buf, { contentType: 'video/mp4' })
          if (upload) {
            const { data: { publicUrl } } = supabase.storage
              .from('generated-content').getPublicUrl(fileName)
            videoUrl = publicUrl
          }
        }
        break
      }
    }

    if (!videoUrl) {
      await supabase.rpc('deduct_credits', {
        p_workspace_id: workspace_id, p_amount: -creditCost,
        p_action: 'video_gen_refund', p_user_id: user.id,
        p_description: 'Video generation refund — timeout',
      })
      throw new Error('Video generation timed out')
    }

    const permanentUrl = await persistFile(videoUrl, workspace_id, 'video', undefined)

    const { data: savedContent } = await supabase.from('content').insert({
      workspace_id, created_by: user.id,
      type: 'video', platform: 'general', status: 'draft',
      video_url: permanentUrl || videoUrl,
      prompt: finalPrompt, credits_used: creditCost,
      ai_model: 'veo-3.1-fast',
      metadata: {
        aspect_ratio, duration: clampedDuration, mode,
        original_prompt: prompt, enhanced_prompt: finalPrompt,
        provider: 'google-veo', has_audio: true,
        has_reference_image: mode === 'image' && !!image_url,
        has_frames: mode === 'frame' && (!!start_frame_url || !!end_frame_url),
      },
    }).select().single()

    await supabase.from('activity').insert({
      workspace_id, user_id: user.id, type: 'video_generated',
      title: `Video generated (${mode}) — "${(prompt||'brand video').slice(0,50)}"`,
      metadata: { content_id: savedContent?.id, credits_used: creditCost, duration: clampedDuration, mode },
    })

    return NextResponse.json({
      success: true,
      video_url: permanentUrl || videoUrl,
      content_id: savedContent?.id,
      credits_used: creditCost,
      duration: clampedDuration,
      mode,
      provider: 'veo-3.1-fast',
      enhanced_prompt: finalPrompt,
    })

  } catch (error: unknown) {
    console.error('[generate-video]', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Video generation failed' }, { status: 500 })
  }
}
