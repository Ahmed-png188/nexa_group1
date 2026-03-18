import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enhanceVideoPrompt } from '@/lib/prompt-enhancer'
import { getBrandContext } from '@/lib/brand-context'
import { guardWorkspace } from '@/lib/workspace-guard'
import { persistFile } from '@/lib/storage'

function sanitize(input: unknown, max = 2000): string {
  if (typeof input !== 'string') throw new Error('Invalid input')
  return input.trim().slice(0, max)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, prompt: rawPrompt, aspect_ratio = '9:16', duration = 8, mode = 'text' } = await request.json()
    const prompt = sanitize(rawPrompt, 1000)
    if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 })

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    // Check and deduct credits
    const { data: deducted } = await supabase.rpc('deduct_credits', {
      p_workspace_id: workspace_id,
      p_amount: 20,
      p_action: 'video_gen',
      p_user_id: user.id,
      p_description: 'Video generation — Veo 3.1 Fast',
    })
    if (!deducted) return NextResponse.json({ error: 'Insufficient credits. Video generation costs 20 credits.' }, { status: 402 })

    // Get brand context for enhancer
    const brand = await getBrandContext(workspace_id)

    // Enhance prompt cinematically
    let finalPrompt = prompt
    try {
      finalPrompt = await enhanceVideoPrompt(prompt, brand)
    } catch (e) {
      console.error('[generate-video] Enhancer failed, using original prompt')
      finalPrompt = prompt
    }

    // Call Veo 3.1 Fast via Gemini API
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not configured')

    // Submit generation request
    const submitRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-fast-generate-preview:predictLongRunning?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: finalPrompt }],
          parameters: {
            aspectRatio: aspect_ratio,
            durationSeconds: Math.min(duration, 8),
            generateAudio: true,
            resolution: '720p',
          }
        })
      }
    )

    if (!submitRes.ok) {
      const err = await submitRes.text()
      console.error('[generate-video] Veo API error:', submitRes.status)
      // Refund credits on API error
      await supabase.rpc('deduct_credits', {
        p_workspace_id: workspace_id,
        p_amount: -20,
        p_action: 'video_gen_refund',
        p_user_id: user.id,
        p_description: 'Video generation refund — Veo API error',
      })
      throw new Error(`Veo API error: ${submitRes.status} — ${err}`)
    }

    const operation = await submitRes.json()
    const operationName = operation.name
    if (!operationName) throw new Error('No operation name returned from Veo')

    // Poll for completion — max 3 minutes, every 8 seconds
    let videoUrl: string | null = null
    const maxAttempts = 22

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 8000))

      const pollRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`
      )
      if (!pollRes.ok) continue

      const pollData = await pollRes.json()

      if (pollData.done) {
        const samples = pollData.response?.predictions?.[0]?.videos ||
                        pollData.response?.generateVideoResponse?.generatedSamples ||
                        pollData.response?.predictions

        if (samples?.[0]?.video?.uri) {
          videoUrl = samples[0].video.uri
        } else if (samples?.[0]?.bytesBase64Encoded) {
          const videoBuffer = Buffer.from(samples[0].bytesBase64Encoded, 'base64')
          const fileName = `video_${user.id}_${Date.now()}.mp4`
          const { data: upload } = await supabase.storage
            .from('generated-content')
            .upload(fileName, videoBuffer, { contentType: 'video/mp4' })
          if (upload) {
            const { data: { publicUrl } } = supabase.storage
              .from('generated-content')
              .getPublicUrl(fileName)
            videoUrl = publicUrl
          }
        }
        break
      }
    }

    if (!videoUrl) {
      // Refund credits on timeout
      await supabase.rpc('deduct_credits', {
        p_workspace_id: workspace_id,
        p_amount: -20,
        p_action: 'video_gen_refund',
        p_user_id: user.id,
        p_description: 'Video generation refund — timeout',
      })
      throw new Error('Video generation timed out. Please try again.')
    }

    // Persist to Supabase storage
    const permanentUrl = await persistFile(videoUrl, workspace_id, 'video', undefined)

    // Save to content table
    const { data: savedContent } = await supabase.from('content').insert({
      workspace_id,
      created_by: user.id,
      type: 'video',
      platform: 'general',
      status: 'draft',
      video_url: permanentUrl || videoUrl,
      prompt: finalPrompt,
      credits_used: 20,
      ai_model: 'veo-3.1-fast',
      metadata: {
        aspect_ratio,
        duration,
        mode,
        original_prompt: prompt,
        enhanced_prompt: finalPrompt,
        provider: 'google-veo',
        has_audio: true,
      },
    }).select().single()

    await supabase.from('activity').insert({
      workspace_id,
      user_id: user.id,
      type: 'video_generated',
      title: `Video generated — "${prompt.slice(0, 50)}${prompt.length > 50 ? '...' : ''}"`,
      metadata: { content_id: savedContent?.id, credits_used: 20 },
    })

    return NextResponse.json({
      success: true,
      video_url: permanentUrl || videoUrl,
      content_id: savedContent?.id,
      provider: 'veo-3.1-fast',
      enhanced_prompt: finalPrompt,
    })

  } catch (error: unknown) {
    console.error('[generate-video] Error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Video generation failed' }, { status: 500 })
  }
}
