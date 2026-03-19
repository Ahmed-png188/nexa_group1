import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { getBrandContext } from '@/lib/brand-context'
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

    const brand = await getBrandContext(workspace_id)

    const { data: contentHistory } = await supabase
      .from('content')
      .select('platform, created_at, type')
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false })
      .limit(50)

    const prompt = `You are an expert social media timing strategist. Analyze this brand's audience and provide the most specific, data-backed posting time recommendations.

${brand?.copyContext}

Audience: ${brand?.profile?.audience?.primary || brand?.workspace?.brand_audience || 'Not defined'}
Audience psychology: ${brand?.profile?.audience?.psychology || 'Not defined'}

Based on the audience's psychology, profession, daily routine, and behavior patterns, provide SPECIFIC timing recommendations. Think deeply about when THESE SPECIFIC people are most receptive.

Return ONLY valid JSON:
{
  "analysis": "2-3 sentence explanation of why these times work for this specific audience",
  "platforms": {
    "instagram": {
      "best_times": [
        { "time": "7:00 AM", "day_type": "Weekdays", "reason": "specific psychological reason", "engagement_potential": "high" }
      ],
      "frequency": "X posts per week",
      "algorithm_tip": "specific tip for this platform"
    },
    "linkedin": {
      "best_times": [{ "time": "8:00 AM", "day_type": "Weekdays", "reason": "reason", "engagement_potential": "high" }],
      "frequency": "X posts per week",
      "algorithm_tip": "tip"
    },
    "x": {
      "best_times": [{ "time": "9:00 AM", "day_type": "Daily", "reason": "reason", "engagement_potential": "medium" }],
      "frequency": "X posts per week",
      "algorithm_tip": "tip"
    }
  },
  "weekly_calendar": [
    { "day": "Monday", "slots": [{ "time": "7:30 AM", "platform": "instagram", "content_type": "motivational", "why": "reason" }]},
    { "day": "Tuesday", "slots": [{ "time": "8:00 AM", "platform": "linkedin", "content_type": "insight", "why": "reason" }]},
    { "day": "Wednesday", "slots": [{ "time": "7:00 AM", "platform": "instagram", "content_type": "educational", "why": "reason" }]},
    { "day": "Thursday", "slots": [{ "time": "12:00 PM", "platform": "x", "content_type": "opinion", "why": "reason" }]},
    { "day": "Friday", "slots": [{ "time": "9:00 AM", "platform": "instagram", "content_type": "story", "why": "reason" }]},
    { "day": "Saturday", "slots": [{ "time": "10:00 AM", "platform": "instagram", "content_type": "casual", "why": "reason" }]},
    { "day": "Sunday", "slots": [{ "time": "7:00 PM", "platform": "instagram", "content_type": "reflective", "why": "reason" }]}
  ],
  "golden_hours": "The 2-3 absolute best moments to post anything this week",
  "consistency_tip": "The single most important timing principle for this brand"
}`

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (response.content[0] as any).text
    let timingData: any = {}
    try {
      const match = text.match(/\{[\s\S]*\}/)
      if (match) timingData = JSON.parse(match[0])
    } catch { timingData = { raw: text } }

    // Save to strategy plan
    const { data: existingPlan } = await supabase
      .from('strategy_plans')
      .select('id, platform_strategy')
      .eq('workspace_id', workspace_id)
      .eq('status', 'active')
      .single()

    if (existingPlan) {
      await supabase.from('strategy_plans').update({
        platform_strategy: { ...(existingPlan.platform_strategy || {}), timing: timingData }
      }).eq('id', existingPlan.id)
    }

    // Save as brand learning
    const { error: learnErr } = await supabase.from('brand_learnings').insert({
      workspace_id,
      source: 'generation',
      source_name: 'Timing Engine',
      insight_type: 'strategy',
      insight: `Optimal posting: ${timingData.golden_hours || 'See timing analysis'}`,
      confidence: 0.9,
    })

    await supabase.from('activity').insert({
      workspace_id,
      user_id: user.id,
      type: 'timing_analyzed',
      title: 'Timing Engine generated optimal posting schedule for your audience',
    })

    return NextResponse.json({ success: true, timing: timingData })
  } catch (error: unknown) {
    console.error('Timing error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
