export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import {
  CEO_INTELLIGENCE_PROMPT,
  CMO_INTELLIGENCE_PROMPT,
  GROWTH_STAGES,
  buildUnifiedBriefing,
} from '@/lib/prompts'

function getDb() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getDb()
  const results: any[] = []

  // Get all active workspaces
  const { data: workspaces } = await db
    .from('workspaces')
    .select('id, brand_name, name, brand_voice, brand_audience, brand_tone, client_stage, plan, plan_status')
    .in('plan_status', ['active', 'trialing'])

  for (const ws of workspaces || []) {
    try {
      const workspace_id = ws.id
      const brandName = (ws as any).brand_name || (ws as any).name || 'this brand'

      // Get brand intelligence profile
      const { data: profileAsset } = await db
        .from('brand_assets')
        .select('analysis')
        .eq('workspace_id', workspace_id)
        .eq('file_name', 'nexa_brand_intelligence.json')
        .single()
      const profile = (profileAsset as any)?.analysis

      // Get recent content performance
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()
      const { data: content } = await db
        .from('content')
        .select('type, platform, body, performance_score, created_at, status')
        .eq('workspace_id', workspace_id)
        .gte('created_at', thirtyDaysAgo)
        .order('performance_score', { ascending: false })
        .limit(10)

      // Get ad performance
      const { data: campaigns } = await db
        .from('amplify_campaigns')
        .select('id, name, status, daily_budget')
        .eq('workspace_id', workspace_id)

      const { data: insights } = campaigns?.length
        ? await db
          .from('amplify_insights')
          .select('spend, reach, clicks, cpc, ctr')
          .in('campaign_id', (campaigns || []).map((c: any) => c.id))
          .order('recorded_at', { ascending: false })
          .limit(5)
        : { data: [] }

      // Get recent brand learnings
      const { data: learnings } = await db
        .from('brand_learnings')
        .select('insight_type, insight')
        .eq('workspace_id', workspace_id)
        .order('created_at', { ascending: false })
        .limit(10)

      // Detect current stage
      const publishedCount = (content || []).filter((c: any) => c.status === 'published').length
      const hasActiveAds = (campaigns || []).some((c: any) => c.status === 'ACTIVE')
      const avgPerf = publishedCount > 0
        ? (content || []).filter((c: any) => c.status === 'published')
            .reduce((s: number, c: any) => s + (c.performance_score || 50), 0) / publishedCount
        : 0

      let detectedStage = (ws as any).client_stage || 'foundation'
      if (hasActiveAds && avgPerf > 60) detectedStage = 'amplify'
      else if (publishedCount >= 20 && avgPerf > 50) detectedStage = 'momentum'
      else if (publishedCount >= 5) detectedStage = 'foundation'

      const stageInfo = GROWTH_STAGES[detectedStage as keyof typeof GROWTH_STAGES]

      // Build full context for CEO analysis
      const contentSummary = (content || [])
        .slice(0, 5)
        .map((c: any) => `${c.platform} ${c.type} — score: ${c.performance_score || '?'} — "${(c.body || '').slice(0, 60)}"`)
        .join('\n') || 'No content data yet'

      const adsSummary = insights?.length
        ? `Spend: $${(insights as any[])[0]?.spend} | Reach: ${(insights as any[])[0]?.reach} | CTR: ${(insights as any[])[0]?.ctr}%`
        : 'No ad data'

      const learningsSummary = (learnings || [])
        .map((l: any) => `[${l.insight_type}] ${l.insight}`)
        .join('\n') || 'No learnings yet'

      // CEO + CMO analysis: assess position and generate weekly priorities
      const ceoAnalysis = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `${CEO_INTELLIGENCE_PROMPT}\n\n${CMO_INTELLIGENCE_PROMPT}`,
        messages: [{
          role: 'user',
          content: `Analyze this brand and generate weekly priorities.

Brand: ${brandName}
Current Stage: ${detectedStage} (${stageInfo?.name})
Stage Goal: ${stageInfo?.milestone}

Voice/Audience: ${(ws as any).brand_voice || 'Not defined'} / ${(ws as any).brand_audience || 'Not defined'}
Brand positioning: ${profile?.positioning?.unique_angle || 'Not defined'}

Content performance (last 30 days):
${contentSummary}

Ad performance:
${adsSummary}

Brand learnings:
${learningsSummary}

As the CEO and CMO of this brand, generate:
1. Honest assessment: Where are they really? What's working, what's not?
2. The ONE constraint holding them back right now
3. This week's 3 priorities (specific, actionable, achievable in 7 days)
4. The 90-day milestone they should be working toward
5. Stage update: Should they advance to the next stage? (yes/no + reason)

Output JSON only:
{
  "assessment": "honest 2-sentence assessment",
  "main_constraint": "the one thing holding them back",
  "priorities": [
    {"title": "...", "action": "specific action", "why": "why this matters now"},
    {"title": "...", "action": "specific action", "why": "why this matters now"},
    {"title": "...", "action": "specific action", "why": "why this matters now"}
  ],
  "ninety_day_goal": "specific measurable goal",
  "advance_stage": false,
  "advance_reason": "reason for stage change or why staying"
}`,
        }],
      })

      const rawAnalysis = (ceoAnalysis.content[0] as any).text?.trim()
      let analysis: any = {}
      try {
        const match = rawAnalysis?.match(/\{[\s\S]*\}/)
        if (match) analysis = JSON.parse(match[0])
      } catch { analysis = {} }

      // Generate Arabic version
      const ceoAnalysisAr = await anthropic.messages.create({
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
        const rawAr = (ceoAnalysisAr.content[0] as any).text?.trim()
        const matchAr = rawAr?.match(/\{[\s\S]*\}/)
        if (matchAr) analysisAr = JSON.parse(matchAr[0])
      } catch { analysisAr = {} }

      // Update workspace with new stage + priorities
      await db.from('workspaces').update({
        client_stage: detectedStage,
        weekly_priorities: {
          generated_at: new Date().toISOString(),
          stage: detectedStage,
          assessment: analysis.assessment,
          main_constraint: analysis.main_constraint,
          priorities: analysis.priorities || [],
          ninety_day_goal: analysis.ninety_day_goal,
        },
        weekly_priorities_ar: {
          generated_at: new Date().toISOString(),
          stage: detectedStage,
          assessment: analysisAr.assessment,
          main_constraint: analysisAr.main_constraint,
          priorities: analysisAr.priorities || [],
          ninety_day_goal: analysisAr.ninety_day_goal,
        },
        priorities_generated_at: new Date().toISOString(),
      }).eq('id', workspace_id)

      // Write CEO insights to brand_learnings
      if (analysis.main_constraint) {
        await db.from('brand_learnings').insert({
          workspace_id,
          insight_type: 'engagement',
          insight: `CEO Assessment: ${analysis.assessment} Main constraint: ${analysis.main_constraint}`,
          source: 'intelligence_engine',
          confidence: 0.90,
        }).then(() => {}, () => {})
      }

      // Create roadmap milestone if none exists for this stage
      if (analysis.ninety_day_goal) {
        const { data: existingMilestone } = await db
          .from('roadmap_milestones')
          .select('id')
          .eq('workspace_id', workspace_id)
          .eq('stage', detectedStage)
          .eq('status', 'active')
          .single()

        if (!existingMilestone) {
          await db.from('roadmap_milestones').insert({
            workspace_id,
            stage: detectedStage,
            title: analysis.ninety_day_goal,
            title_ar: analysisAr.ninety_day_goal,
            description: stageInfo?.milestone,
            target_metric: stageInfo?.milestone,
            status: 'active',
            due_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          }).then(() => {}, () => {})
        }
      }

      results.push({ workspace_id, brand: brandName, stage: detectedStage, done: true })
      console.log('[intelligence-engine] processed:', brandName, '| stage:', detectedStage)
      await new Promise(r => setTimeout(r, 1000))

    } catch (e: any) {
      console.error('[intelligence-engine] error for workspace:', (ws as any).id, e.message)
      results.push({ workspace_id: (ws as any).id, error: e.message })
    }
  }

  console.log('[intelligence-engine] done. processed:', results.length)
  return NextResponse.json({ processed: results.length, results })
}
