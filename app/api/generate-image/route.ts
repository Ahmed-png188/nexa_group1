import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, prompt, style, aspect_ratio = '1:1', model = 'flux-pro' } = await request.json()

    // Deduct 5 credits
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

    // Fetch workspace brand context for style guidance
    const { data: workspace } = await supabase
      .from('workspaces').select('brand_voice, brand_tone, brand_name').eq('id', workspace_id).single()

    // Build enhanced prompt with brand context
    const enhancedPrompt = style
      ? `${prompt}, ${style} style, professional quality, brand photography`
      : `${prompt}, professional quality, clean composition, brand photography`

    // Call fal.ai Flux API
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
      console.error('Fal.ai error:', err)

      // Refund credits if API failed
      await supabase.from('credit_transactions').insert({
        workspace_id,
        user_id: user.id,
        amount: 5,
        action: 'refund',
        description: 'Image generation failed — credits refunded',
      })
      await supabase.from('credits').update({
        balance: supabase.rpc('increment_balance' as any, { amount: 5 }),
      }).eq('workspace_id', workspace_id)

      return NextResponse.json({ error: 'Image generation failed', details: err }, { status: 500 })
    }

    const falData = await falResponse.json()
    const imageUrl = falData.images?.[0]?.url

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image returned' }, { status: 500 })
    }

    // Save to content table
    const { data: savedContent } = await supabase.from('content').insert({
      workspace_id,
      created_by: user.id,
      type: 'image',
      platform: 'general',
      status: 'draft',
      image_url: imageUrl,
      prompt: enhancedPrompt,
      credits_used: 5,
      ai_model: `fal-ai/${model}`,
      metadata: {
        aspect_ratio,
        style,
        original_prompt: prompt,
        fal_seed: falData.seed,
      },
    }).select().single()

    // Log activity
    await supabase.from('activity').insert({
      workspace_id,
      user_id: user.id,
      type: 'image_generated',
      title: `Image generated — "${prompt.slice(0, 60)}${prompt.length > 60 ? '...' : ''}"`,
      metadata: { content_id: savedContent?.id, credits_used: 5 },
    })

    return NextResponse.json({
      success: true,
      image_url: imageUrl,
      content_id: savedContent?.id,
      credits_used: 5,
      seed: falData.seed,
    })

  } catch (error: any) {
    console.error('Image generation error:', error)
    return NextResponse.json({ error: 'Failed to generate image', details: error.message }, { status: 500 })
  }
}
