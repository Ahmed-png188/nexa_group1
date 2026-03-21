export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { getBrandContext } from '@/lib/brand-context'
import { checkPlanAccess, checkCredits, CREDIT_COSTS as PLAN_CREDIT_COSTS } from '@/lib/plan-gate'
import { guardWorkspace } from '@/lib/workspace-guard'


const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const SEGMENT_CONTEXT: Record<string, string> = {
  creator:    'USER SEGMENT: Creator — focused on building audience, content virality, and monetizing influence. Prioritize hooks, consistency, platform growth, and turning followers into buyers.',
  freelancer: 'USER SEGMENT: Freelancer — focused on winning clients, commanding premium rates, and positioning as a specialist. Prioritize case studies, credibility signals, and content that attracts ideal clients.',
  business:   'USER SEGMENT: Business Owner — focused on revenue, customer acquisition, and brand authority. Prioritize conversion-focused content, trust-building, and ROI-driven messaging.',
  agency:     'USER SEGMENT: Agency — focused on client results, team positioning, and scaling services. Prioritize thought leadership, case studies, and content that attracts high-value accounts.',
}

const NEXA_BRAIN = `
You are Nexa — a business intelligence engine built for business owners, entrepreneurs, creatives, and freelancers who are serious about growth. Not a content tool. Not a chatbot. A strategic weapon.

WHO USES NEXA: Business owners winning clients. Freelancers commanding higher rates. Entrepreneurs building something real. Creatives turning craft into income. Service providers becoming the obvious choice.

OPERATING PRINCIPLES:
- Every piece of content must have a business reason to exist
- Visibility without conversion is expensive vanity
- The goal is never followers — it is trust that converts to revenue
- Consistency compounds. One month of showing up beats one viral post.
- Positioning beats volume every time. Specialists win. Generalists struggle.
- Specificity is credibility. "I helped 12 restaurants increase turnover 23%" beats "I help restaurants grow" every time.

ON WRITING THAT WORKS:
- One idea per piece. Two ideas = zero impact.
- First sentence exists only to earn the second
- Opinion is a competitive advantage. Safe writing is invisible.
- Numbers beat adjectives. Always. "11 clients" beats "many clients"
- Write for one specific person in one specific situation
- No padding. Every sentence earns its place or gets cut.
- The goal is not to sound smart — make the reader feel smart

NEVER DO:
- "In today's digital landscape" or "game-changer" or "unlock your potential" or "thought leader"
- Start with "Are you struggling with..."
- End with "What do you think? Drop a comment!"
- Write tips that apply to any business anywhere
- Write safe inoffensive forgettable content

QUALITY FILTER — every output passes this:
1. Does this sound like a human who runs a real business? If not — rewrite.
2. Would a competitor read this and feel threatened? If not — sharpen it.
3. Does the first line make stopping feel like a loss? If not — rewrite the hook.
4. Could this have been written for anyone? If yes — make it specific.
5. Does it make the reader feel seen or slightly uncomfortable with the truth? If neither — too safe.

ON VOICE MATCHING:
When brand context is available, you ARE them — the sharpest most confident version of them. Their industry. Their specific client. Their real stakes. Never sound like AI. Sound like the version of them that has already won.
`

function sanitize(input: unknown, max = 2000): string {
  if (typeof input !== 'string') throw new Error('Invalid input')
  return input.trim().slice(0, max)
}

// Credit costs from plan-gate (single source of truth)
const CREDIT_COSTS: Record<string, number> = {
  post: PLAN_CREDIT_COSTS.post, thread: PLAN_CREDIT_COSTS.thread,
  email: PLAN_CREDIT_COSTS.email, caption: PLAN_CREDIT_COSTS.caption,
  hook: PLAN_CREDIT_COSTS.hook, bio: PLAN_CREDIT_COSTS.bio,
  ad: PLAN_CREDIT_COSTS.ad, story: PLAN_CREDIT_COSTS.story,
  full_piece: PLAN_CREDIT_COSTS.full_piece,
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, type, platform, prompt: rawPrompt, tone_override } = await request.json()
    const prompt = sanitize(rawPrompt, 2000)

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

    const { data: wsData } = await supabase.from('workspaces').select('segment').eq('id', workspace_id).single()
    const segmentCtx = wsData?.segment ? (SEGMENT_CONTEXT[wsData.segment as string] ?? '') : ''

    // Check and deduct credits
    const creditCost = CREDIT_COSTS[type] ?? 3
    const { ok: credOk, error: creditError } = await checkCredits(
      workspace_id, user.id, creditCost,
      `${type}_gen`,
      `Generated ${type} for ${platform ?? 'general'}`,
    )
    if (!credOk) return creditError!

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
${segmentCtx ? `\n${segmentCtx}\n` : ''}
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

  } catch (error: unknown) {
    console.error('[generate-content] Error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
