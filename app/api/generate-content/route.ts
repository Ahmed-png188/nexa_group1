import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Credit costs per action
const CREDIT_COSTS: Record<string, number> = {
  post: 3,
  thread: 5,
  email: 5,
  caption: 2,
  hook: 2,
  bio: 2,
  ad: 5,
  story: 2,
  full_piece: 10,
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, type, platform, prompt, tone_override } = await request.json()

    // Fetch workspace brand context
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspace_id)
      .single()

    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    // Check and deduct credits
    const creditCost = CREDIT_COSTS[type] ?? 3
    const { data: deducted } = await supabase.rpc('deduct_credits', {
      p_workspace_id: workspace_id,
      p_amount: creditCost,
      p_action: `${type}_gen`,
      p_user_id: user.id,
      p_description: `Generated ${type} for ${platform ?? 'general'}`,
    })

    if (!deducted) {
      return NextResponse.json({
        error: 'Insufficient credits',
        message: `This action costs ${creditCost} credits. Please top up your balance.`,
      }, { status: 402 })
    }

    // Platform-specific formatting guidance
    const platformGuide: Record<string, string> = {
      instagram: 'Instagram caption: Hook in first line, line breaks for readability, 3-5 relevant hashtags at end, max 300 words',
      linkedin: 'LinkedIn post: Bold hook, short paragraphs, no hashtag spam, professional but human, 150-300 words',
      x: 'X/Twitter post: Under 280 characters, punchy, no hashtags unless essential, conversational',
      email: 'Email: Subject line first (labeled "Subject:"), then body. Personal, direct, one clear CTA',
      tiktok: 'TikTok caption: Very short, energetic, 2-3 hashtags max, hook people to watch',
      general: 'Clear, engaging, on-brand copy',
    }

    const contentTypes: Record<string, string> = {
      post: 'a complete social media post',
      thread: 'a 5-7 tweet thread with each tweet numbered and separated by ---',
      email: 'a complete email with subject line and body',
      caption: 'a punchy caption',
      hook: 'just a strong opening hook (1-2 lines)',
      bio: 'a compelling bio (2-3 sentences)',
      ad: 'ad copy with headline, body, and CTA',
      story: 'a short story-format post (3-4 paragraphs)',
      full_piece: 'a complete, long-form content piece',
    }

    const systemPrompt = `You are the content writer for ${workspace.name ?? 'this brand'}.

Brand voice: ${workspace.brand_voice ?? 'Confident, direct, and outcome-focused'}
Brand audience: ${workspace.brand_audience ?? 'Ambitious professionals who want real results'}
Tone: ${tone_override ?? workspace.brand_tone ?? 'confident, direct, premium'}

Platform: ${platform ?? 'general'}
Format guide: ${platformGuide[platform ?? 'general']}

Write ${contentTypes[type] ?? 'content'} that sounds EXACTLY like this brand. 
Do NOT add any labels, explanations, or meta-commentary.
Return ONLY the content itself — nothing else.
Make it feel human, specific, and psychologically compelling.
Never start with "I" as the first word.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    })

    const generatedContent = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as any).text)
      .join('')

    // Save to content table
    const { data: savedContent } = await supabase.from('content').insert({
      workspace_id,
      created_by: user.id,
      type,
      platform: platform ?? 'general',
      status: 'draft',
      body: generatedContent,
      prompt,
      credits_used: creditCost,
      ai_model: 'claude-sonnet-4-20250514',
    }).select().single()

    // Log activity
    await supabase.from('activity').insert({
      workspace_id,
      user_id: user.id,
      type: 'content_generated',
      title: `Generated ${type} for ${platform ?? 'general'}`,
      metadata: { content_id: savedContent?.id, credits_used: creditCost },
    })

    return NextResponse.json({
      success: true,
      content: generatedContent,
      content_id: savedContent?.id,
      credits_used: creditCost,
    })

  } catch (error: any) {
    console.error('Content generation error:', error)
    return NextResponse.json({ error: 'Generation failed', details: error.message }, { status: 500 })
  }
}
