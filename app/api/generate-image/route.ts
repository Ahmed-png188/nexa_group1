import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { persistFile } from '@/lib/storage'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, prompt, style, aspect_ratio = '1:1', model = 'flux-pro' } = await request.json()

    const { data: deducted } = await supabase.rpc('deduct_credits', {
      p_workspace_id: workspace_id,
      p_amount: 5,
      p_action: 'image_gen',
      p_user_id: user.id,
      p_description: `Image generation — ${model}`,
    })

    if (!deducted) {
      return NextResponse.json({
        error: 'Insufficient credits',
        message: 'Image generation costs 5 credits.',
      }, { status: 402 })
    }

    const enhancedPrompt = style
      ? `${prompt}, ${style} style, professional quality, brand photography`
      : `${prompt}, professional quality, clean composition, brand photography`

    const falResponse = await fetch('https://fal.run/fal-ai/flux/dev', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        image_size: aspect_ratio === '16:9' ? 'landscape_16_9' :
                    aspect_ratio === '9:16' ? 'portrait_16_9' :
                    aspect_ratio === '4:5' ? 'portrait_4_5' : 'square_hd',
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: true,
      }),
    })

    if (!falResponse.ok) {
      const err = await falResponse.text()
      const { data: cr } = await supabase.from('credits').select('balance').eq('workspace_id', workspace_id).single()
      await supabase.from('credits').update({ balance: (cr?.balance ?? 0) + 5 }).eq('workspace_id', workspace_id)
      return NextResponse.json({ error: 'Image generation failed', details: err }, { status: 500 })
    }

    const falData = await falResponse.json()
    const tempUrl = falData.images?.[0]?.url
    if (!tempUrl) return NextResponse.json({ error: 'No image returned' }, { status: 500 })

    // Save to DB first to get ID
    const { data: savedContent } = await supabase.from('content').insert({
      workspace_id,
      created_by: user.id,
      type: 'image',
      platform: 'general',
      status: 'draft',
      image_url: tempUrl,
      prompt: enhancedPrompt,
      credits_used: 5,
      ai_model: `fal-ai/${model}`,
      metadata: { aspect_ratio, style, original_prompt: prompt, fal_seed: falData.seed },
    }).select().single()

    // Persist to Supabase Storage (permanent URL)
    const permanentUrl = await persistFile(tempUrl, workspace_id, 'image', savedContent?.id)

    // Update with permanent URL
    if (savedContent?.id && permanentUrl !== tempUrl) {
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

  } catch (error: any) {
    console.error('Image generation error:', error)
    return NextResponse.json({ error: 'Failed to generate image', details: error.message }, { status: 500 })
  }
}
