import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
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

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id } = await request.json()

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    // Fetch workspace context
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspace_id)
      .single()

    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const segmentCtx = (workspace as any).segment ? (SEGMENT_CONTEXT[(workspace as any).segment as string] ?? '') : ''

    const prompt = `${NEXA_BRAIN}
${segmentCtx ? `\n${segmentCtx}\n` : ''}
You are a world-class brand strategist. Build a complete 30-day content strategy for this brand.

Brand: ${workspace.brand_name ?? workspace.name}
Voice: ${workspace.brand_voice ?? 'Confident and direct'}
Audience: ${workspace.brand_audience ?? 'Ambitious professionals'}
Tone: ${workspace.brand_tone ?? 'confident, direct, premium'}
Website: ${workspace.brand_website ?? 'Not provided'}

Return ONLY a valid JSON object with this exact structure (no markdown, no backticks):

{
  "audience_psychology": {
    "core_desire": "The single deepest desire your audience has",
    "core_fear": "The single biggest fear or frustration they have",
    "identity": "How they see themselves or want to be seen",
    "trigger_words": ["word1", "word2", "word3", "word4", "word5"],
    "content_they_hate": "What kind of content turns them off immediately",
    "content_they_love": "What kind of content makes them stop scrolling"
  },
  "content_pillars": [
    { "name": "Pillar name", "description": "What this pillar is about", "frequency": "3x per week", "example_angle": "Specific example post angle" },
    { "name": "Pillar name", "description": "What this pillar is about", "frequency": "2x per week", "example_angle": "Specific example post angle" },
    { "name": "Pillar name", "description": "What this pillar is about", "frequency": "2x per week", "example_angle": "Specific example post angle" },
    { "name": "Pillar name", "description": "What this pillar is about", "frequency": "1x per week", "example_angle": "Specific example post angle" }
  ],
  "weekly_schedule": {
    "monday": { "platform": "linkedin", "type": "post", "angle": "Specific angle for this day" },
    "tuesday": { "platform": "instagram", "type": "reel", "angle": "Specific angle for this day" },
    "wednesday": { "platform": "x", "type": "thread", "angle": "Specific angle for this day" },
    "thursday": { "platform": "linkedin", "type": "post", "angle": "Specific angle for this day" },
    "friday": { "platform": "instagram", "type": "post", "angle": "Specific angle for this day" }
  },
  "top_performing_angles": [
    { "angle": "Specific angle name", "why_it_works": "Psychology behind why this works for this audience", "example_hook": "Actual hook example" },
    { "angle": "Specific angle name", "why_it_works": "Psychology behind why this works for this audience", "example_hook": "Actual hook example" },
    { "angle": "Specific angle name", "why_it_works": "Psychology behind why this works for this audience", "example_hook": "Actual hook example" },
    { "angle": "Specific angle name", "why_it_works": "Psychology behind why this works for this audience", "example_hook": "Actual hook example" },
    { "angle": "Specific angle name", "why_it_works": "Psychology behind why this works for this audience", "example_hook": "Actual hook example" }
  ],
  "month_one_plan": [
    { "week": 1, "theme": "Week theme", "goal": "What this week accomplishes", "posts": ["Post angle 1", "Post angle 2", "Post angle 3", "Post angle 4", "Post angle 5"] },
    { "week": 2, "theme": "Week theme", "goal": "What this week accomplishes", "posts": ["Post angle 1", "Post angle 2", "Post angle 3", "Post angle 4", "Post angle 5"] },
    { "week": 3, "theme": "Week theme", "goal": "What this week accomplishes", "posts": ["Post angle 1", "Post angle 2", "Post angle 3", "Post angle 4", "Post angle 5"] },
    { "week": 4, "theme": "Week theme", "goal": "What this week accomplishes", "posts": ["Post angle 1", "Post angle 2", "Post angle 3", "Post angle 4", "Post angle 5"] }
  ],
  "key_insights": [
    "Specific, actionable insight 1 about this brand and audience",
    "Specific, actionable insight 2 about this brand and audience",
    "Specific, actionable insight 3 about this brand and audience"
  ]
}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as any).text)
      .join('')

    let strategy: any
    try {
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      strategy = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'Failed to parse strategy response' }, { status: 500 })
    }

    // Save or update strategy plan
    const { data: existing } = await supabase
      .from('strategy_plans')
      .select('id')
      .eq('workspace_id', workspace_id)
      .eq('status', 'active')
      .single()

    // Expand 4 weeks into 30 actual day objects
    const dailyPlan: any[] = []
    const weekSchedule = strategy.weekly_schedule || {}
    const dayNames = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
    let dayNum = 1
    for (let week = 0; week < 4; week++) {
      const weekData = strategy.month_one_plan?.[week] || {}
      const weekPosts: string[] = weekData.posts || []
      let postIdx = 0
      for (const dayName of dayNames) {
        if (dayNum > 30) break
        const schedDay = weekSchedule[dayName]
        const isPostDay = schedDay || (postIdx < weekPosts.length)
        if (isPostDay || dayNum <= 30) {
          dailyPlan.push({
            day: dayNum,
            date: dayName,
            week: week + 1,
            theme: weekData.theme || '',
            goal: weekData.goal || '',
            platform: schedDay?.platform || '',
            type: schedDay?.type || 'post',
            angle: schedDay?.angle || weekPosts[postIdx] || '',
            content: weekPosts[postIdx] || schedDay?.angle || '',
          })
          if (weekPosts[postIdx]) postIdx++
          dayNum++
        }
      }
    }

    const planData = {
      workspace_id,
      title: `${workspace.brand_name ?? workspace.name} — 30-Day Strategy`,
      status: 'active',
      audience_map: strategy.audience_psychology,
      content_pillars: strategy.content_pillars,
      platform_strategy: {
        ...strategy.weekly_schedule,
        timing: strategy.top_performing_angles,
      },
      daily_plan: dailyPlan,
      insights: {
        key_insights: strategy.key_insights,
        top_angles: strategy.top_performing_angles,
      },
      generated_at: new Date().toISOString(),
    }

    if (existing) {
      await supabase.from('strategy_plans').update(planData).eq('id', existing.id)
    } else {
      await supabase.from('strategy_plans').insert(planData)
    }

    // Log activity
    await supabase.from('activity').insert({
      workspace_id,
      user_id: user.id,
      type: 'strategy_generated',
      title: '30-day content strategy generated',
    })

    return NextResponse.json({ success: true, strategy })

  } catch (error: unknown) {
    console.error('[generate-strategy] Error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Strategy generation failed' }, { status: 500 })
  }
}
