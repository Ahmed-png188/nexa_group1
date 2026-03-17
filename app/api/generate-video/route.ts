import { NextRequest, NextResponse } from 'next/server'
import { checkPlanAccess } from '@/lib/plan-gate'
import { createClient } from '@/lib/supabase/server'
import { persistFile } from '@/lib/storage'
import { createHmac } from 'crypto'
import { getBrandContext } from '@/lib/brand-context'

function base64url(input: string): string {
  return input.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function getKlingToken(): string {
  const accessKey = process.env.KLING_ACCESS_KEY!
  const secretKey = process.env.KLING_SECRET_KEY!
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64'))
  const payload = base64url(Buffer.from(JSON.stringify({ iss: accessKey, iat: now, exp: now + 1800 })).toString('base64'))
  const signature = base64url(createHmac('sha256', secretKey).update(`${header}.${payload}`).digest('base64'))
  return `${header}.${payload}.${signature}`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const {
      workspace_id, prompt, style = 'cinematic',
      duration = 5, aspect_ratio = '16:9',
      image_url,           // image-to-video
      start_frame_url,     // start frame
      end_frame_url,       // end frame
      motion_strength = 0.5,
    } = await request.json()

    // ── Plan gate ──
    const gateError = await checkPlanAccess(workspace_id, 'video_generation')
    if (gateError) return gateError

    // ── Rate limit: max 10 video generations per hour per workspace ──
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: recentCount } = await supabase
      .from('content')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspace_id)
      .eq('type', 'video')
      .gte('created_at', oneHourAgo)
    if ((recentCount ?? 0) >= 10) {
      return NextResponse.json({
        error: 'Rate limit exceeded',
        message: 'Maximum 10 video generations per hour. Please wait before generating more.',
      }, { status: 429 })
    }

    if (!process.env.KLING_ACCESS_KEY || !process.env.KLING_SECRET_KEY) {
      return NextResponse.json({ error: 'Video generation not configured', message: 'KLING_ACCESS_KEY and KLING_SECRET_KEY not set. Add your Kling AI credentials to environment variables.' }, { status: 503 })
    }

    const { data: deducted } = await supabase.rpc('deduct_credits', {
      p_workspace_id: workspace_id,
      p_amount: 20,
      p_action: 'video_gen',
      p_user_id: user.id,
      p_description: `Video generation — Kling`,
    })

    if (!deducted) {
      return NextResponse.json({
        error: 'Insufficient credits',
        message: 'Video generation costs 20 credits.',
      }, { status: 402 })
    }

    const token = getKlingToken()

    // Get brand video context
    const brand = await getBrandContext(workspace_id)
    const brandVideo = brand?.videoContext ? `${brand.videoContext}, ` : ''

    // Determine endpoint and body based on mode
    let endpoint: string
    const body: any = {
      prompt: `${brandVideo}${prompt}, ${style} style, high quality, professional`,
      negative_prompt: 'blurry, low quality, distorted, watermark, text',
      cfg_scale: motion_strength,
      duration,
      aspect_ratio,
      mode: 'std',
    }

    if (start_frame_url && end_frame_url) {
      // Start + end frame mode
      endpoint = 'https://api.klingai.com/v1/videos/image2video'
      body.image_url = start_frame_url
      body.tail_image_url = end_frame_url
    } else if (image_url) {
      // Image-to-video mode
      endpoint = 'https://api.klingai.com/v1/videos/image2video'
      body.image_url = image_url
    } else {
      // Text-to-video mode
      endpoint = 'https://api.klingai.com/v1/videos/text2video'
    }

    const submitRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const submitData = await submitRes.json()

    if (!submitData.data?.task_id) {
      const { data: cr } = await supabase.from('credits').select('balance').eq('workspace_id', workspace_id).single()
      await supabase.from('credits').update({ balance: (cr?.balance ?? 0) + 20 }).eq('workspace_id', workspace_id)
      throw new Error(submitData.message ?? 'Failed to submit video task')
    }

    const taskId = submitData.data.task_id

    // Poll for completion
    let videoUrl = null
    let attempts = 0
    const isImageMode = !!(image_url || start_frame_url)

    while (attempts < 36) {
      await new Promise(r => setTimeout(r, 5000))
      attempts++

      const statusEndpoint = isImageMode
        ? `https://api.klingai.com/v1/videos/image2video/${taskId}`
        : `https://api.klingai.com/v1/videos/text2video/${taskId}`

      const statusRes = await fetch(statusEndpoint, {
        headers: { 'Authorization': `Bearer ${getKlingToken()}` },
      })
      const statusData = await statusRes.json()
      const task = statusData.data

      if (task?.task_status === 'succeed') {
        videoUrl = task.task_result?.videos?.[0]?.url
        break
      } else if (task?.task_status === 'failed') {
        throw new Error('Video generation failed')
      }
    }

    if (!videoUrl) throw new Error('Video generation timed out')

    // Save to DB
    const { data: savedContent } = await supabase.from('content').insert({
      workspace_id,
      created_by: user.id,
      type: 'video',
      platform: 'general',
      status: 'draft',
      video_url: videoUrl,
      prompt,
      credits_used: 20,
      ai_model: 'kling-v1',
      metadata: { aspect_ratio, duration, style, task_id: taskId, mode: isImageMode ? 'image2video' : 'text2video' },
    }).select().single()

    // Persist to Supabase Storage
    const permanentUrl = await persistFile(videoUrl, workspace_id, 'video', savedContent?.id)
    if (savedContent?.id && permanentUrl !== videoUrl) {
      await supabase.from('content').update({ video_url: permanentUrl }).eq('id', savedContent.id)
    }

    await supabase.from('activity').insert({
      workspace_id,
      user_id: user.id,
      type: 'video_generated',
      title: `Video generated — "${prompt.slice(0, 50)}${prompt.length > 50 ? '...' : ''}"`,
      metadata: { content_id: savedContent?.id, credits_used: 20 },
    })

    return NextResponse.json({
      success: true,
      video_url: permanentUrl,
      content_id: savedContent?.id,
      credits_used: 20,
      task_id: taskId,
    })

  } catch (error: any) {
    console.error('Video generation error:', error)
    return NextResponse.json({ error: 'Failed to generate video', details: error.message }, { status: 500 })
  }
}
