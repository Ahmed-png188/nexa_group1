import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
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

    const prompt = `${NEXA_BRAIN}

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

  } catch (error: any) {
    console.error('Strategy generation error:', error)
    return NextResponse.json({ error: 'Strategy generation failed', details: error.message }, { status: 500 })
  }
}
