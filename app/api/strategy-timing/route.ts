import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { getBrandContext } from '@/lib/brand-context'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id } = await request.json()
    const brand = await getBrandContext(workspace_id)

    // Get content history for pattern analysis
    const { data: contentHistory } = await supabase
      .from('content')
      .select('platform, created_at, type, metadata')
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false })
      .limit(50)

    const contentPatterns = contentHistory?.reduce((acc: any, c) => {
      const hour = new Date(c.created_at).getHours()
      const day = new Date(c.created_at).toLocaleDateString('en', { weekday: 'long' })
      if (!acc[c.platform]) acc[c.platform] = { hours: [], days: [] }
      acc[c.platform].hours.push(hour)
      acc[c.platform].days.push(day)
      return acc
    }, {})

    const prompt = `You are an expert social media timing strategist. Analyze this brand's audience and provide the most specific, data-backed posting time recommendations possible.

${brand?.copyContext}

Audience psychology: ${brand?.profile?.audience?.psychology || brand?.workspace?.brand_audience || 'Not defined'}
Audience primary: ${brand?.profile?.audience?.primary || 'Not defined'}
Pain points: ${brand?.profile?.audience?.pain_points?.join(', ') || 'Not defined'}

Content history patterns: ${JSON.stringify(contentPatterns || {})}

Based on the audience's psychology, profession, daily routine, and behavior patterns, provide SPECIFIC timing recommendations. Don't be generic — if this is an audience of entrepreneurs, they check Instagram at 6am. If it's corporate professionals, LinkedIn at 8am and 12pm. Think deeply about when THESE SPECIFIC people are most receptive.

Return ONLY valid JSON:
{
  "analysis": "2-3 sentence explanation of why these times work for this specific audience",
  "platforms": {
    "instagram": {
      "best_times": [
        { "time": "7:00 AM", "day_type": "Weekdays", "reason": "specific psychological reason", "engagement_potential": "high/medium/low" }
      ],
      "worst_times": ["times to avoid with reason"],
      "frequency": "X posts per week",
      "content_mix": { "morning": "type of content", "midday": "type", "evening": "type" },
      "algorithm_tip": "specific tip for this platform's current algorithm"
    },
    "linkedin": { ... same structure },
    "x": { ... same structure },
    "tiktok": { ... same structure }
  },
  "weekly_calendar": [
    { "day": "Monday", "slots": [
      { "time": "7:30 AM", "platform": "instagram", "content_type": "motivational hook", "why": "Monday motivation resonates" }
    ]}
  ],
  "golden_hours": "The 2-3 absolute best moments to post anything this week",
  "consistency_tip": "The single most important timing principle for this brand"
}`

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 3000,
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
    await supabase.from('brand_learnings').insert({
      workspace_id,
      source: 'generation',
      source_name: 'Timing Engine',
      insight_type: 'strategy',
      insight: `Optimal posting: ${timingData.golden_hours || 'See timing analysis'}`,
      confidence: 0.9,
    }).catch(() => {})

    await supabase.from('activity').insert({
      workspace_id, user_id: user.id,
      type: 'timing_analyzed',
      title: 'Timing Engine generated optimal posting schedule for your audience',
    })

    return NextResponse.json({ success: true, timing: timingData })
  } catch (error: any) {
    console.error('Timing error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
