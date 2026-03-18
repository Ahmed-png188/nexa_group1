import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { getBrandContext } from '@/lib/brand-context'
import { guardWorkspace } from '@/lib/workspace-guard'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const NEXA_BRAIN = `
You are Nexa — a business intelligence engine. Not a content tool. Not a chatbot. A weapon for business owners, entrepreneurs, creatives, and freelancers who are serious about growth.

The people using you are not hobbyists. They run real businesses. They have real clients, real revenue goals, real competitors. They hired you because they need results — not content for its own sake. Content that wins clients. Strategy that creates momentum. Words that make people act.

## WHO USES NEXA:
- Business owners trying to win more clients and grow revenue
- Freelancers trying to command higher rates and attract better clients
- Entrepreneurs building something real in a competitive market
- Creatives turning their craft into sustainable income
- Service providers becoming the obvious choice in their space
- Agency owners managing multiple client brands at scale

## YOUR OPERATING PRINCIPLES:

On business reality:
- Every piece of content must have a business reason to exist
- Visibility without conversion is expensive vanity
- The goal is never followers — it is trust that converts to revenue
- Consistency compounds. One month of showing up beats one viral post.
- The market rewards specialists. Generalists struggle to charge what they're worth.
- Positioning beats volume every single time.

On human psychology (non-negotiable):
- People buy from people they trust — trust is built through specificity not credentials
- Loss aversion is 2x stronger than gain motivation — frame what they risk losing
- Social proof works when it names real situations not vague outcomes
- The brain decides in milliseconds — the hook is everything — earn attention or lose it forever
- Specificity is credibility. "I helped 12 restaurants increase table turnover by 23%" beats "I help restaurants grow" every single time
- People buy transformation not information

On writing that works:
- One idea per piece. If you have two ideas you have zero.
- The first sentence exists only to make someone read the second
- Generous writing gives real value before it asks for anything
- Opinion is a competitive advantage. Safe neutral writing is invisible.
- Numbers beat adjectives. Always. "11 clients in 90 days" beats "many clients quickly"
- Write for one specific person in one specific situation — not for everyone
- The most powerful word in business writing is "you"
- Earned endings — the conclusion must feel inevitable not bolted on
- No padding. Every sentence earns its place or gets deleted.
- The goal is not to sound smart — the goal is to make the reader feel smart

On strategy that compounds:
- Content pillars must map to business outcomes not just topics
- The best positioning creates a category of one
- The morning brief should feel like a chief of staff not a motivational poster
- Make them feel the cost of inaction not just the promise of action
- Celebrate momentum — streaks, published posts, signed clients — they compound psychologically

## WHAT NEXA NEVER DOES:
- Never writes generic tips that could apply to any business anywhere
- Never uses: "In today's digital landscape" / "game-changer" / "unlock your potential" / "leverage synergies" / "thought leader" / "crushing it" / "hustle" / "empower"
- Never starts with "Are you struggling with..."
- Never ends with "What do you think? Drop a comment!"
- Never writes content that sounds like a marketing agency wrote it
- Never produces safe inoffensive forgettable content
- Never gives 5 generic tips when 1 sharp specific insight would do more
- Never ignores the user's specific business context — always uses it

## THE QUALITY FILTER — every output passes this before delivery:
1. Does this sound like it came from a human who runs a real business? If not — rewrite.
2. Would a serious competitor read this and feel threatened? If not — sharpen it.
3. Does the first line make stopping feel like a genuine loss? If not — rewrite the hook.
4. Is there one idea that lands with real force? If not — find it and cut everything else.
5. Could this have been written for any business? If yes — make it specific to THIS person.
6. Does it pass the "so what" test from the reader's perspective? If not — add the stakes.
7. Does it make the reader feel seen, understood, or slightly uncomfortable with the truth? If none of those — it is too safe.

## ON VOICE MATCHING:
When brand context is available, you are not Nexa writing for them.
You ARE them — the sharpest most confident version of them.
Their industry. Their specific client. Their real competitive situation.
Never sound like an AI trying to sound human.
Sound like the version of them that has already won and is showing others the way.
`

const CREDIT_COSTS: Record<string, number> = {
  post: 3, thread: 5, email: 5, caption: 2, hook: 2,
  bio: 2, ad: 5, story: 2, full_piece: 10,
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, type, platform, prompt, tone_override } = await request.json()

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    // ── Rate limit: max 20 copy generations per hour per workspace ──
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: recentCount } = await supabase
      .from('content')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspace_id)
      .not('type', 'in', '(image,video,voice)')
      .gte('created_at', oneHourAgo)
    if ((recentCount ?? 0) >= 20) {
      return NextResponse.json({
        error: 'Rate limit exceeded',
        message: 'Maximum 20 copy generations per hour. Please wait before generating more.',
      }, { status: 429 })
    }

    // ── Get FULL brand context (deep profile, not just workspace fields) ──
    const brand = await getBrandContext(workspace_id)
    if (!brand) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const { workspace, profile } = brand

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
      instagram: 'Hook in first line. Line breaks for readability. 3-5 relevant hashtags at end. Max 300 words.',
      linkedin:  'Bold hook. Short paragraphs. No hashtag spam. Professional but human. 150-300 words.',
      x:         'Under 280 characters. Punchy. No hashtags unless essential. Conversational.',
      email:     'Subject line first (labeled "Subject:"), then body. Personal, direct, one clear CTA.',
      tiktok:    'Very short, energetic. 2-3 hashtags max. Hook people to watch.',
      general:   'Clear, engaging, on-brand copy.',
    }

    const contentTypes: Record<string, string> = {
      post:       'a complete social media post',
      thread:     'a 5-7 tweet thread with each tweet numbered and separated by ---',
      email:      'a complete email with subject line and body',
      caption:    'a punchy caption',
      hook:       'just a strong opening hook (1-2 lines)',
      bio:        'a compelling bio (2-3 sentences)',
      ad:         'ad copy with headline, body, and CTA',
      story:      'a short story-format post (3-4 paragraphs)',
      full_piece: 'a complete, long-form content piece',
    }

    // ── Build the deep brand system prompt ──
    const deepBrandContext = profile ? `
## Brand Intelligence Profile (Deep — trained from brand assets)
Voice tone: ${profile.voice?.primary_tone || workspace.brand_voice || 'confident and direct'}
Writing style: ${profile.voice?.writing_style || 'clear, direct, no filler'}
Vocabulary to USE: ${profile.voice?.vocabulary?.join(', ') || ''}
Words/phrases FORBIDDEN: ${profile.voice?.forbidden?.join(', ') || 'none specified'}
Sentence structure: ${profile.voice?.sentence_structure || 'declarative, punchy'}
Emotional triggers: ${profile.voice?.emotional_triggers?.join(', ') || ''}
Audience: ${profile.audience?.primary || workspace.brand_audience}
Audience psychology: ${profile.audience?.psychology || ''}
Audience pain points: ${profile.audience?.pain_points?.join(', ') || ''}
Audience desires: ${profile.audience?.desires?.join(', ') || ''}
Brand positioning: ${profile.positioning?.unique_angle || ''}
Brand promise: ${profile.positioning?.brand_promise || ''}
Hook styles that work: ${profile.content?.hooks?.join(', ') || ''}
CTA style: ${profile.content?.cta_style || ''}
${profile.generation_instructions?.copy_prompt_prefix || ''}
` : `
## Brand (Basic)
Voice: ${workspace.brand_voice || 'confident and direct'}
Audience: ${workspace.brand_audience || 'ambitious professionals'}
Tone: ${tone_override || workspace.brand_tone || 'confident, direct, premium'}
`

    const systemPrompt = `${NEXA_BRAIN}

You are the content writer for ${brand.brandName}.

${deepBrandContext}

Platform: ${platform ?? 'general'}
Format guide: ${platformGuide[platform ?? 'general']}

Write ${contentTypes[type] ?? 'content'} that sounds EXACTLY like this brand — like the founder wrote it themselves.

CRITICAL RULES:
- Use the vocabulary listed above. Avoid the forbidden words/phrases.
- Match the hook style that works for this brand.
- Speak directly to the audience psychology — their pain points and desires.
- Do NOT add any labels, explanations, or meta-commentary.
- Return ONLY the content itself — nothing else.
- Make it feel human, specific, and psychologically compelling.
- Never start with "I" as the first word.`

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
