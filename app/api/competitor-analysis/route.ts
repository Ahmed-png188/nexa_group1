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

    const { workspace_id, competitors } = await request.json()
    const brand = await getBrandContext(workspace_id)

    const competitorList = competitors || brand?.profile?.positioning?.competitor_contrast || 'General competitors in this space'

    const prompt = `You are a world-class competitive intelligence analyst. Analyze the competitive landscape for this brand and provide actionable insights to help them stand out and win.

## This Brand
Name: ${brand?.brandName}
Voice: ${brand?.profile?.voice?.primary_tone || brand?.workspace?.brand_voice || 'Not defined'}
Audience: ${brand?.profile?.audience?.primary || brand?.workspace?.brand_audience || 'Not defined'}
Positioning: ${brand?.profile?.positioning?.unique_angle || 'Not defined'}
Content themes: ${brand?.profile?.content?.themes?.join(', ') || 'Not defined'}

## Competitors
${competitorList}

Return ONLY valid JSON:
{
  "market_position": "Where this brand sits in the competitive landscape",
  "competitors": [
    {
      "name": "Competitor name",
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1", "weakness 2"],
      "content_strategy": "how they create content",
      "differentiation_opportunity": "specific way to beat them"
    }
  ],
  "white_space": [
    {
      "opportunity": "Specific untapped content territory",
      "why_nobody_owns_it": "reason",
      "how_to_claim_it": "tactical approach"
    }
  ],
  "winning_angles": [
    {
      "angle": "Specific content angle competitors ignore",
      "example_hook": "Ready-to-use hook line",
      "why_it_wins": "psychological reason"
    }
  ],
  "differentiation_strategy": {
    "core_message": "The one thing that makes this brand impossible to ignore",
    "positioning_statement": "1 sentence brand positioning"
  },
  "quick_wins": [
    { "action": "specific thing to do this week", "impact": "expected result", "time_to_implement": "hours/days" }
  ]
}`

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (response.content[0] as any).text
    let competitorData: any = {}
    try {
      const match = text.match(/\{[\s\S]*\}/)
      if (match) competitorData = JSON.parse(match[0])
    } catch { competitorData = { raw: text } }

    // Save insights as brand learnings
    const learnings = []
    if (competitorData.white_space?.length > 0) {
      for (const w of competitorData.white_space.slice(0, 2)) {
        learnings.push({
          workspace_id,
          source: 'generation',
          source_name: 'Competitor Analysis',
          insight_type: 'strategy',
          insight: `White space: ${w.opportunity}`,
          confidence: 0.85,
        })
      }
    }
    if (competitorData.winning_angles?.length > 0) {
      for (const a of competitorData.winning_angles.slice(0, 2)) {
        learnings.push({
          workspace_id,
          source: 'generation',
          source_name: 'Competitor Analysis',
          insight_type: 'content',
          insight: `Winning angle: ${a.angle} — "${a.example_hook}"`,
          confidence: 0.9,
        })
      }
    }

    if (learnings.length > 0) {
      await supabase.from('brand_learnings').insert(learnings)
    }

    await supabase.from('activity').insert({
      workspace_id,
      user_id: user.id,
      type: 'competitor_analyzed',
      title: `Competitor analysis complete — ${competitorData.white_space?.length || 0} white space opportunities found`,
    })

    return NextResponse.json({ success: true, analysis: competitorData })
  } catch (error: any) {
    console.error('Competitor analysis error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
