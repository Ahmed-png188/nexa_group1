import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHmac } from 'crypto'

function base64url(input: Buffer | string): string {
  const str = typeof input === 'string' ? input : input.toString('base64')
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function getKlingToken(): string {
  const accessKey = process.env.KLING_ACCESS_KEY!
  const secretKey = process.env.KLING_SECRET_KEY!
  const now = Math.floor(Date.now() / 1000)

  const header = base64url(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64'))
  const payload = base64url(Buffer.from(JSON.stringify({
    iss: accessKey,
    iat: now,
    exp: now + 1800, // 30 minutes
  })).toString('base64'))

  const signature = base64url(
    createHmac('sha256', secretKey).update(`${header}.${payload}`).digest('base64')
  )

  return `${header}.${payload}.${signature}`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, prompt, style = 'cinematic', duration = 5, aspect_ratio = '16:9', image_url } = await request.json()

    // Deduct 20 credits
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

    const body: any = {
      prompt: `${prompt}, ${style} style, high quality, professional`,
      negative_prompt: 'blurry, low quality, distorted, watermark',
      cfg_scale: 0.5,
      duration,
      aspect_ratio,
      mode: 'std',
    }

    const endpoint = image_url
      ? 'https://api.klingai.com/v1/videos/image2video'
      : 'https://api.klingai.com/v1/videos/text2video'

    if (image_url) body.image_url = image_url

    // Submit generation task
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
      // Refund credits on failure
      const { data: cr } = await supabase.from('credits').select('balance').eq('workspace_id', workspace_id).single()
      await supabase.from('credits').update({ balance: (cr?.balance ?? 0) + 20 }).eq('workspace_id', workspace_id)
      throw new Error(submitData.message ?? 'Failed to submit video task')
    }

    const taskId = submitData.data.task_id

    // Poll for completion (max 3 minutes)
    let videoUrl = null
    let attempts = 0
    const maxAttempts = 36

    while (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 5000))
      attempts++

      const statusEndpoint = image_url
        ? `https://api.klingai.com/v1/videos/image2video/${taskId}`
        : `https://api.klingai.com/v1/videos/text2video/${taskId}`

      const freshToken = getKlingToken()
      const statusRes = await fetch(statusEndpoint, {
        headers: { 'Authorization': `Bearer ${freshToken}` },
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

    // Save to content table
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
      metadata: { aspect_ratio, duration, style, task_id: taskId },
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
      video_url: videoUrl,
      content_id: savedContent?.id,
      credits_used: 20,
      task_id: taskId,
    })

  } catch (error: any) {
    console.error('Video generation error:', error)
    return NextResponse.json({ error: 'Failed to generate video', details: error.message }, { status: 500 })
  }
}
