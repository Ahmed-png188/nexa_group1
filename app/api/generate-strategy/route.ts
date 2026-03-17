import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { guardWorkspace } from '@/lib/workspace-guard'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

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

    const prompt = `You are a world-class brand strategist. Build a complete 30-day content strategy for this brand.

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
