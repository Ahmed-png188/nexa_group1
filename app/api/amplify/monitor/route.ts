export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { guardWorkspace } from '@/lib/workspace-guard'
import { getBrandContext } from '@/lib/brand-context'
import Anthropic from '@anthropic-ai/sdk'


const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const workspace_id = new URL(request.url).searchParams.get('workspace_id')
    if (!workspace_id) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    // Get active campaigns with insights
    const { data: campaigns } = await supabase
      .from('amplify_campaigns')
      .select('*')
      .eq('workspace_id', workspace_id)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({ insights: [], message: 'No active campaigns to monitor.' })
    }

    // Get insights for each
    const campaignData = await Promise.all(campaigns.map(async (camp) => {
      const { data: ins } = await supabase
        .from('amplify_insights')
        .select('*')
        .eq('campaign_id', camp.id)
        .order('recorded_at', { ascending: false })
        .limit(7)
      return { ...camp, recent_insights: ins || [] }
    }))

    // Build summary for Claude
    const summary = campaignData.map(c => {
      const latest = c.recent_insights[0]
      const prev   = c.recent_insights[1]
      return {
        name:          c.name,
        budget:        `$${c.daily_budget}/day`,
        objective:     c.objective,
        spend:         latest?.spend || 0,
        reach:         latest?.reach || 0,
        clicks:        latest?.clicks || 0,
        cpc:           latest?.cpc || 0,
        cpm:           latest?.cpm || 0,
        ctr:           latest?.ctr || 0,
        spend_trend:   prev ? (latest?.spend || 0) - (prev.spend || 0) : 0,
        reach_trend:   prev ? (latest?.reach || 0) - (prev.reach || 0) : 0,
      }
    })

    const brand = await getBrandContext(workspace_id)
    const brandName = brand?.workspace?.brand_name || 'the brand'

    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      system: `You are the performance marketing analyst for ${brandName}. You review Meta Ads data daily and surface one clear, actionable insight per campaign. You write like a smart analyst texting the founder — direct, no jargon, no fluff.`,
      messages: [{
        role: 'user',
        content: `Today's campaign performance data:\n\n${JSON.stringify(summary, null, 2)}\n\nFor each campaign, give one specific actionable insight. Focus on: CPM vs CPC efficiency, reach vs engagement ratio, budget utilization, and what to do TODAY.\n\nReturn ONLY valid JSON:\n[\n  {\n    "campaign": "campaign name",\n    "status": "good" | "warning" | "critical",\n    "insight": "One sentence. Specific. Actionable.",\n    "action": "Exactly what to do — increase budget by X, change audience, pause and test new copy, etc."\n  }\n]`,
      }],
    })

    let insights: any[] = []
    try {
      const raw = (res.content[0] as any).text
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      insights = JSON.parse(cleaned)
    } catch {
      insights = campaigns.map(c => ({
        campaign: c.name,
        status: 'good',
        insight: 'Campaign is running. Check Meta Ads Manager for detailed breakdown.',
        action: 'No action needed today.',
      }))
    }

    return NextResponse.json({ insights, campaigns: summary })

  } catch (err: unknown) {
    console.error('[amplify/monitor]', err)
    return NextResponse.json({ error: 'Monitor failed' }, { status: 500 })
  }
}
