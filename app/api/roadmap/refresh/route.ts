export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { CEO_INTELLIGENCE_PROMPT, CMO_INTELLIGENCE_PROMPT, GROWTH_STAGES } from '@/lib/prompts'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

function getDb() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id } = await request.json()
    if (!workspace_id) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })

    // Verify membership
    const { data: member } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .eq('workspace_id', workspace_id)
      .single()
    if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const db = getDb()

    // Fetch workspace
    const { data: ws } = await db.from('workspaces').select('*').eq('id', workspace_id).single()
    if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const brandName = (ws as any).brand_name || (ws as any).name || 'this brand'

    // Fetch brand intelligence
    const { data: profileAsset } = await db
      .from('brand_assets').select('analysis')
      .eq('workspace_id', workspace_id).eq('file_name', 'nexa_brand_intelligence.json').single()
    const profile = (profileAsset as any)?.analysis

    // Recent content
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()
    const { data: content } = await db.from('content')
      .select('type, platform, body, performance_score, created_at, status')
      .eq('workspace_id', workspace_id).gte('created_at', thirtyDaysAgo)
      .order('performance_score', { ascending: false }).limit(10)

    // Ad campaigns
    const { data: campaigns } = await db.from('amplify_campaigns')
      .select('id, name, status, daily_budget').eq('workspace_id', workspace_id)

    const { data: insights } = campaigns?.length
      ? await db.from('amplify_insights').select('spend, reach, clicks, cpc, ctr')
          .in('campaign_id', (campaigns || []).map((c: any) => c.id))
          .order('recorded_at', { ascending: false }).limit(5)
      : { data: [] }

    // Brand learnings
    const { data: learnings } = await db.from('brand_learnings')
      .select('insight_type, insight').eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false }).limit(10)

    // Detect stage
    const publishedCount = (content || []).filter((c: any) => c.status === 'published').length
    const hasActiveAds   = (campaigns || []).some((c: any) => c.status === 'ACTIVE')
    const avgPerf        = publishedCount > 0
      ? (content || []).filter((c: any) => c.status === 'published')
          .reduce((s: number, c: any) => s + (c.performance_score || 50), 0) / publishedCount
      : 0

    let detectedStage = (ws as any).client_stage || 'foundation'
    if (hasActiveAds && avgPerf > 60)       detectedStage = 'amplify'
    else if (publishedCount >= 20 && avgPerf > 50) detectedStage = 'momentum'
    else if (publishedCount >= 5)           detectedStage = 'foundation'

    const stageInfo = GROWTH_STAGES[detectedStage as keyof typeof GROWTH_STAGES]

    const contentSummary = (content || []).slice(0, 5)
      .map((c: any) => `${c.platform} ${c.type} — score: ${c.performance_score || '?'} — "${(c.body || '').slice(0, 60)}"`)
      .join('\n') || 'No content data yet'

    const adsSummary = (insights as any[])?.length
      ? `Spend: $${(insights as any[])[0]?.spend} | Reach: ${(insights as any[])[0]?.reach} | CTR: ${(insights as any[])[0]?.ctr}%`
      : 'No ad data'

    const learningsSummary = (learnings || [])
      .map((l: any) => `[${l.insight_type}] ${l.insight}`).join('\n') || 'No learnings yet'

    // CEO + CMO analysis
    const ceoRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `${CEO_INTELLIGENCE_PROMPT}\n\n${CMO_INTELLIGENCE_PROMPT}`,
      messages: [{
        role: 'user',
        content: `Analyze this brand and generate weekly priorities.

Brand: ${brandName}
Stage: ${detectedStage} (${stageInfo?.name})
Goal: ${stageInfo?.milestone}
Voice/Audience: ${(ws as any).brand_voice || 'Not defined'} / ${(ws as any).brand_audience || 'Not defined'}
Brand positioning: ${profile?.positioning?.unique_angle || 'Not defined'}

Content performance (last 30 days):
${contentSummary}

Ad performance: ${adsSummary}

Brand learnings:
${learningsSummary}

Generate as CEO and CMO:
1. Honest 2-sentence assessment
2. The ONE constraint holding them back
3. This week's 3 priorities (specific, actionable, 7-day horizon)
4. The 90-day milestone

Output JSON only:
{
  "assessment": "...",
  "main_constraint": "...",
  "priorities": [
    {"title": "...", "action": "...", "why": "..."},
    {"title": "...", "action": "...", "why": "..."},
    {"title": "...", "action": "...", "why": "..."}
  ],
  "ninety_day_goal": "..."
}`,
      }],
    })

    const rawEn = (ceoRes.content[0] as any).text?.trim()
    let analysis: any = {}
    try { const m = rawEn?.match(/\{[\s\S]*\}/); if (m) analysis = JSON.parse(m[0]) } catch {}

    // Arabic version
    const ceoResAr = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: `أنت مدير تنفيذي ومسوق عالمي المستوى. ${CEO_INTELLIGENCE_PROMPT}`,
      messages: [{
        role: 'user',
        content: `بناءً على هذا التحليل، أنشئ نسخة عربية من الأولويات الأسبوعية لـ${brandName}.

المرحلة: ${stageInfo?.nameAr}
الهدف: ${stageInfo?.milestoneAr}

الأولويات الإنجليزية:
${JSON.stringify(analysis.priorities || [], null, 2)}

أخرج JSON فقط:
{
  "assessment": "تقييم صادق بجملتين",
  "main_constraint": "العائق الرئيسي الواحد",
  "priorities": [
    {"title": "...", "action": "إجراء محدد", "why": "لماذا هذا مهم الآن"},
    {"title": "...", "action": "إجراء محدد", "why": "لماذا هذا مهم الآن"},
    {"title": "...", "action": "إجراء محدد", "why": "لماذا هذا مهم الآن"}
  ],
  "ninety_day_goal": "هدف محدد وقابل للقياس"
}`,
      }],
    })

    let analysisAr: any = {}
    try {
      const rawAr = (ceoResAr.content[0] as any).text?.trim()
      const mAr = rawAr?.match(/\{[\s\S]*\}/)
      if (mAr) analysisAr = JSON.parse(mAr[0])
    } catch {}

    const now = new Date().toISOString()
    const weekly_priorities = {
      generated_at: now, stage: detectedStage,
      assessment: analysis.assessment,
      main_constraint: analysis.main_constraint,
      priorities: analysis.priorities || [],
      ninety_day_goal: analysis.ninety_day_goal,
    }
    const weekly_priorities_ar = {
      generated_at: now, stage: detectedStage,
      assessment: analysisAr.assessment,
      main_constraint: analysisAr.main_constraint,
      priorities: analysisAr.priorities || [],
      ninety_day_goal: analysisAr.ninety_day_goal,
    }

    await db.from('workspaces').update({
      client_stage: detectedStage,
      weekly_priorities,
      weekly_priorities_ar,
      priorities_generated_at: now,
    }).eq('id', workspace_id)

    // Create milestone if none for this stage
    if (analysis.ninety_day_goal) {
      const { data: existing } = await db.from('roadmap_milestones')
        .select('id').eq('workspace_id', workspace_id).eq('stage', detectedStage).eq('status', 'active').single()
      if (!existing) {
        await db.from('roadmap_milestones').insert({
          workspace_id, stage: detectedStage,
          title: analysis.ninety_day_goal,
          title_ar: analysisAr.ninety_day_goal,
          description: stageInfo?.milestone,
          target_metric: stageInfo?.milestone,
          status: 'active',
          due_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }).then(() => {}, () => {})
      }
    }

    return NextResponse.json({
      success: true,
      workspace: { client_stage: detectedStage, weekly_priorities, weekly_priorities_ar },
    })

  } catch (err: unknown) {
    console.error('[roadmap/refresh]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
