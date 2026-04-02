export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { getBrandContext } from '@/lib/brand-context'
import { guardWorkspace } from '@/lib/workspace-guard'
import { checkPlanAccess } from '@/lib/plan-gate'
import {
  CEO_INTELLIGENCE_PROMPT,
  CMO_INTELLIGENCE_PROMPT,
  CREATIVE_DIRECTOR_PROMPT,
  buildBrandSystemPrompt,
  getBrandTypeContext,
  BRAND_TYPES,
  type BrandType,
} from '@/lib/prompts'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const {
      workspace_id,
      agent_type,
      comments: bodyComments,
      lang = 'en',
      platform = 'instagram',
    } = await request.json()

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    const planError = await checkPlanAccess(workspace_id, 'brand_brain')
    if (planError) return planError

    // ── Full intelligence context ──────────────────────────────────────
    const brand = await getBrandContext(workspace_id)
    if (!brand) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const [
      strategyRes,
      recentRes,
      topRes,
      allRes,
      weekRes,
      learningsRes,
    ] = await Promise.all([
      supabase.from('strategy_plans').select('*')
        .eq('workspace_id', workspace_id).eq('status', 'active')
        .order('generated_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('content')
        .select('type, body, platform, created_at, metadata, performance_score, status')
        .eq('workspace_id', workspace_id)
        .order('created_at', { ascending: false }).limit(20),
      supabase.from('content')
        .select('type, body, platform, created_at, performance_score, status')
        .eq('workspace_id', workspace_id)
        .order('performance_score', { ascending: false }).limit(15),
      supabase.from('content')
        .select('id, platform, status, performance_score')
        .eq('workspace_id', workspace_id),
      supabase.from('content')
        .select('type, body, platform, created_at')
        .eq('workspace_id', workspace_id)
        .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
      supabase.from('brand_learnings')
        .select('insight_type, insight, source, confidence, created_at')
        .eq('workspace_id', workspace_id)
        .order('created_at', { ascending: false }).limit(20),
    ])

    const strategy      = strategyRes.data
    const recentContent = recentRes.data   as any[] | null
    const topContent    = topRes.data      as any[] | null
    const allContent    = allRes.data      as any[] | null
    const weekContent   = weekRes.data     as any[] | null
    const learnings     = learningsRes.data as any[] | null

    const b               = brand as any
    const weeklyPriorities = b.workspace?.weekly_priorities as any
    const stageInfo        = b.stageInfo        as any
    const unifiedBriefing  = (b.unifiedBriefing  as string) || ''
    const clientStage      = (b.clientStage      as string) || 'foundation'
    const brandTypeCtx     = getBrandTypeContext(
      (b.workspace as any)?.segment || 'physical_product',
      lang as 'en' | 'ar'
    )

    // ── Performance data helpers ───────────────────────────────────────
    const winningLearnings = (learnings || [])
      .filter((l: any) => l.insight_type === 'content' && l.insight?.startsWith('✓'))
      .slice(0, 5).map((l: any) => l.insight).join('\n') || 'No performance data yet — build a foundation'

    const losingLearnings = (learnings || [])
      .filter((l: any) => l.insight_type === 'content' && l.insight?.startsWith('✗'))
      .slice(0, 3).map((l: any) => l.insight).join('\n') || 'No avoidance data yet'

    const nextWeekAngle = (learnings || [])
      .find((l: any) => l.insight?.includes('Next week angle'))?.insight
      || 'Not yet determined — use strongest brand angle'

    const highPerformers = (topContent || [])
      .filter((c: any) => (c.performance_score || 0) > 65).slice(0, 5)
      .map((c: any) => `Score ${c.performance_score}: [${c.platform}] "${(c.body || '').slice(0, 100)}"`)
      .join('\n') || 'No high performers yet — brand is in early stage'

    const lowPerformers = (topContent || [])
      .filter((c: any) => (c.performance_score || 0) < 40 && c.performance_score != null).slice(0, 3)
      .map((c: any) => `Score ${c.performance_score}: [${c.platform}] "${(c.body || '').slice(0, 100)}"`)
      .join('\n') || 'No low-performer data yet'

    const recentThemes = (recentContent || []).slice(0, 5)
      .map((c: any) => `- ${c.metadata?.theme || c.type}: "${(c.body || '').slice(0, 60)}"`)
      .join('\n') || 'No recent content'

    const publishedCount   = (allContent || []).filter((c: any) => c.status === 'published').length
    const activePlatforms  = Array.from(new Set((allContent || []).map((c: any) => c.platform as string))).join(', ') || 'none'

    const realTimingData = (recentContent || [])
      .filter((c: any) => (c.performance_score || 0) > 60)
      .map((c: any) => {
        const d = new Date(c.created_at)
        return `High performer: ${c.platform} | ${d.toLocaleDateString('en', { weekday: 'short' })} ${d.getHours()}:00 | Score: ${c.performance_score}`
      }).slice(0, 8).join('\n') || 'No performance data yet — making audience-based recommendations'

    const postingHistory = (recentContent || []).slice(0, 5)
      .map((c: any) => {
        const d = new Date(c.created_at)
        return `${c.platform} | ${d.toLocaleDateString('en', { weekday: 'short' })} ${d.getHours()}:00`
      }).join('\n') || 'No posting history yet'

    let result: any = {}

    // ══════════════════════════════════════════════════════════════════
    // CONTENT AGENT — Narrative arc, stage-aware, CEO-aligned
    // ══════════════════════════════════════════════════════════════════
    if (agent_type === 'content') {

      const contentPrompt = `${CEO_INTELLIGENCE_PROMPT}
${CMO_INTELLIGENCE_PROMPT}
${CREATIVE_DIRECTOR_PROMPT}

You are the Content Team for ${b.brandName}.
Today your CEO, CMO, and Creative Director are aligned
on the same briefing before you write a single word.

${unifiedBriefing}

BRAND TYPE CONTEXT:
${brandTypeCtx}

PERFORMANCE DATA — what's working:
${winningLearnings}

PERFORMANCE DATA — what to avoid:
${losingLearnings}

THIS WEEK'S CEO PRIORITY:
${weeklyPriorities?.priorities?.[0]?.action || stageInfo?.cmo_focus || 'Build consistent brand presence'}

RECOMMENDED ANGLE THIS WEEK (from intelligence engine):
${nextWeekAngle}

RECENT CONTENT (do not repeat these themes):
${recentThemes}

STRATEGY PILLARS:
${strategy?.pillars ? JSON.stringify(strategy.pillars) : 'Not defined — use general brand content'}

YOUR TASK:
Create a 7-day content calendar that serves a deliberate
narrative arc this week. Every post connects to the others.
Every post serves the CEO's priority. Every post is written
at the standard of the Creative Director.

The narrative arc means: by Sunday, the audience has gone
on a journey. They know something they didn't know on Monday.
They feel something about ${b.brandName} they didn't feel before.

Use these thematic slots as a guide — but adapt based on what
THIS brand, at THIS stage, with THIS week's priorities needs:
Monday: Brand positioning / authority
Tuesday: Audience problem / pain point
Wednesday: Product/service as solution
Thursday: Social proof / story
Friday: Engagement / question / community
Saturday: Behind the scenes / humanity
Sunday: Value / education / insight

For each day think:
- What does the audience need to think/feel by end of week?
- How does today's post move them one step closer?
- What's the most effective format for THIS audience?

PLATFORM: ${platform}
STAGE: ${clientStage} — ${stageInfo?.cmo_focus || ''}

CREATIVE DIRECTOR STANDARD:
Every hook must stop the scroll. Test it: would YOU stop
scrolling for this? If not, rewrite it.
Every post must have a reason to exist beyond filling a slot.
What is the one thing this post makes the reader think, feel, or do?

OUTPUT — JSON array only, no preamble:
[
  {
    "day": "Monday",
    "narrative_role": "what this post does in the week arc",
    "theme": "2-3 word theme",
    "angle": "the specific angle — not generic",
    "hook": "first line — scroll-stopper, max 12 words",
    "body": "full post — brand voice, no filler, punchy paragraphs",
    "cta": "the one thing you want them to do",
    "hashtags": ["#relevant", "#specific", "#nogeneric"],
    "platform_note": "why this format works for this platform",
    "ceo_alignment": "how this serves this week's priority"
  }
]`

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 5000,
        system: buildBrandSystemPrompt(brand, lang, 'creative'),
        messages: [{ role: 'user', content: contentPrompt }],
      })

      const text = (response.content[0] as any).text
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        result.posts = jsonMatch ? JSON.parse(jsonMatch[0]) : []
      } catch {
        result.posts = []
        result.raw = text
      }

      if (result.posts?.length > 0) {
        const today = new Date().toISOString().split('T')[0]
        const inserts = result.posts.map((post: any) => ({
          workspace_id,
          created_by: user.id,
          type:    'post',
          platform: post.platform || platform,
          status:  'draft',
          body:    `${post.hook}\n\n${post.body}\n\n${post.hashtags?.join(' ') || ''}`.trim(),
          prompt:  `Agent: ${post.theme} — ${post.angle}`,
          credits_used: 0,
          ai_model: 'claude-content-agent-v2',
          metadata: {
            agent:          'content',
            day:            post.day,
            theme:          post.theme,
            angle:          post.angle,
            hook:           post.hook,
            narrative_role: post.narrative_role,
            ceo_alignment:  post.ceo_alignment,
            week_generated: today,
          },
        }))
        await supabase.from('content').insert(inserts)
      }

      result.agent   = 'content'
      result.message = `Generated ${result.posts?.length || 0} posts — narrative arc for the week`

    // ══════════════════════════════════════════════════════════════════
    // TIMING AGENT — Real performance data, audience psychology
    // ══════════════════════════════════════════════════════════════════
    } else if (agent_type === 'timing') {

      const timingPrompt = `${CEO_INTELLIGENCE_PROMPT}

You are the Distribution Intelligence for ${b.brandName}.
Your job: find the precise windows when this specific audience
is most receptive, and build a schedule that compounds over time.

${unifiedBriefing}

REAL PERFORMANCE DATA (high-performing posts by time):
${realTimingData}

AUDIENCE PROFILE:
Primary: ${b.profile?.audience?.primary || b.workspace?.brand_audience || 'Not defined'}
Psychology: ${b.profile?.audience?.psychology || 'professional, goal-oriented'}
Pain points: ${b.profile?.audience?.pain_points?.join(', ') || 'not yet mapped'}
Location/timezone: ${b.profile?.audience?.geography || 'Gulf region — UTC+3'}

CURRENT POSTING BEHAVIOR:
${postingHistory}

BRAND TYPE: ${BRAND_TYPES[(b.workspace as any)?.segment as BrandType]?.label || 'Product Brand'}
STAGE: ${clientStage} — ${stageInfo?.cmo_focus || ''}
PLATFORMS ACTIVE: ${activePlatforms}

YOUR ANALYSIS MUST:
1. Identify actual patterns from performance data (or explain
   audience-based reasoning if no data exists)
2. Recommend specific times with specific reasoning — not
   "mornings are good" but "7:15 AM because this audience
   checks phones during school run, before work focus sets in"
3. Identify the ONE posting slot that matters most if they
   can only post once this week
4. Flag which platform is underperforming relative to potential

Return ONLY JSON:
{
  "analysis": "2-3 sentences on what the data reveals",
  "primary_recommendation": "the single most important posting window and why",
  "platform_schedule": {
    "instagram": {
      "best_days": ["Tuesday", "Thursday"],
      "best_times": ["7:15 AM", "7:30 PM"],
      "reasoning": "specific audience-based reasoning",
      "frequency": "X times per week"
    },
    "linkedin": {
      "best_days": [],
      "best_times": [],
      "reasoning": "",
      "frequency": ""
    }
  },
  "weekly_schedule": [
    {
      "day": "Monday",
      "time": "7:15 AM",
      "platform": "instagram",
      "content_type": "authority",
      "reasoning": "why this slot for this content type"
    }
  ],
  "optimization_insight": "one thing they should change immediately",
  "data_confidence": "high/medium/low — explain why"
}`

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2500,
        system: buildBrandSystemPrompt(brand, lang, 'strategy'),
        messages: [{ role: 'user', content: timingPrompt }],
      })

      const text = (response.content[0] as any).text
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        result.schedule = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
      } catch {
        result.schedule = {}
        result.raw = text
      }
      result.agent   = 'timing'
      result.message = 'Optimal posting schedule generated from real performance data'

    // ══════════════════════════════════════════════════════════════════
    // ENGAGEMENT AGENT — CMO-governed, relationship-deepening
    // ══════════════════════════════════════════════════════════════════
    } else if (agent_type === 'engagement') {
      const comments: any[] = bodyComments ?? []

      const engagementPrompt = `${CMO_INTELLIGENCE_PROMPT}

You are the Engagement Director for ${b.brandName}.

Seth Godin's principle applies here: the goal of engagement
is not to reply to comments. The goal is to deepen the
relationship between this brand and its community.
Every reply either builds or wastes that relationship.

${unifiedBriefing}

BRAND VOICE IN CONVERSATION:
${b.profile?.voice?.primary_tone || b.brandVoice || 'direct and genuine'}
Vocabulary: ${b.profile?.voice?.vocabulary?.join(', ') || 'natural, direct'}
What to avoid: ${b.profile?.voice?.avoid?.join(', ') || 'corporate speak, hollow enthusiasm'}

${comments.length > 0 ? `
COMMENTS TO REPLY TO:
${comments.map((c: any, i: number) =>
  `${i + 1}. "${c.text}" — on post about: "${c.post_preview || 'brand content'}" | Commenter type: ${c.commenter_type || 'follower'}`
).join('\n')}

For each reply:
- Sound like a real human who cares, not a brand account
- Match the energy of the comment (playful → playful, serious → thoughtful)
- If they asked a question, answer it completely
- If they complimented, receive it with warmth not corporate gratitude
- If they are a potential customer, create curiosity without selling
- If they are critical, acknowledge genuinely before responding
- Never use: "Thank you for your kind words!" or "We appreciate your support!"

Return ONLY JSON array:
[
  {
    "original": "the comment",
    "reply": "your reply — human, brand-aligned, purposeful",
    "intent": "what this reply is designed to make them feel/do",
    "tone_note": "why you chose this tone"
  }
]` : `
No specific comments provided.
Generate a comprehensive engagement playbook for ${b.brandName}:

1. Reply framework for 5 comment types this brand will commonly receive
2. How to handle: praise, questions, objections, complaints, DM inquiries
3. 3 example replies for each type that sound like this brand
4. Phrases that are perfectly on-brand for ${b.brandName}
5. Phrases to never say

Return ONLY JSON:
{
  "playbook": {
    "praise":              { "approach": "...", "examples": ["...", "...", "..."], "never_say": "..." },
    "questions":           { "approach": "...", "examples": ["...", "...", "..."], "never_say": "..." },
    "objections":          { "approach": "...", "examples": ["...", "...", "..."], "never_say": "..." },
    "complaints":          { "approach": "...", "examples": ["...", "...", "..."], "never_say": "..." },
    "potential_customers": { "approach": "...", "examples": ["...", "...", "..."], "never_say": "..." }
  },
  "brand_phrases": ["phrase that feels like ${b.brandName}"],
  "forbidden_phrases": ["phrase to never use"]
}`}`

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2500,
        system: buildBrandSystemPrompt(brand, lang, 'marketing'),
        messages: [{ role: 'user', content: engagementPrompt }],
      })

      const text = (response.content[0] as any).text
      try {
        const isReplies = comments.length > 0
        const jsonMatch = isReplies
          ? text.match(/\[[\s\S]*\]/)
          : text.match(/\{[\s\S]*\}/)
        if (isReplies) {
          result.replies  = jsonMatch ? JSON.parse(jsonMatch[0]) : []
        } else {
          result.playbook = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
        }
      } catch {
        result.raw = text
      }
      result.agent   = 'engagement'
      result.message = comments.length > 0
        ? `Drafted ${result.replies?.length || 0} on-brand replies`
        : 'Engagement playbook generated for your brand'

    // ══════════════════════════════════════════════════════════════════
    // INSIGHTS AGENT — Honest CMO-level strategic assessment
    // ══════════════════════════════════════════════════════════════════
    } else if (agent_type === 'insights') {

      const allLearnings = (learnings || []).slice(0, 10)
        .map((l: any) => `[${l.insight_type}] ${l.insight}`).join('\n') || 'No learnings accumulated yet'

      const insightsPrompt = `${CEO_INTELLIGENCE_PROMPT}
${CMO_INTELLIGENCE_PROMPT}

You are the Strategic Intelligence Report for ${b.brandName}.
This is not a summary. This is the honest assessment a great CMO
would give after reviewing the last 30 days.

${unifiedBriefing}

BRAND TYPE CONTEXT:
${brandTypeCtx}

PERFORMANCE DATA (last 30 days):
High performers:
${highPerformers}

Low performers:
${lowPerformers}

ACCUMULATED LEARNINGS:
${allLearnings}

STAGE: ${clientStage} — milestone: ${stageInfo?.milestone || ''}
STAGE FOCUS: CEO: ${stageInfo?.ceo_focus || ''} | CMO: ${stageInfo?.cmo_focus || ''}

THIS WEEK'S CEO PRIORITY:
${weeklyPriorities?.priorities?.[0]?.action || 'Not yet set — run intelligence engine'}

CONTENT ACTIVITY:
Created this week: ${weekContent?.length || 0} pieces
Published total: ${publishedCount} pieces
Platforms active: ${activePlatforms}

YOUR REPORT MUST:
1. Be honest — if something is not working, say so directly
2. Identify ONE specific thing holding this brand back
3. Praise specifically — not "your content is great" but
   "your Tuesday posts consistently outperform by 40% — here is why"
4. Give ONE recommendation for next week that is specific,
   actionable, and implementable in under 1 hour

Return ONLY JSON:
{
  "headline": "one sentence capturing the most important thing about this period",
  "honest_assessment": "2-3 sentence CMO-level assessment — direct, specific, no fluff",
  "what_is_working": [
    { "observation": "specific thing working", "evidence": "what data supports this", "double_down": "how to capitalize" }
  ],
  "what_is_not_working": [
    { "observation": "specific thing not working", "why": "honest diagnosis", "fix": "specific fix" }
  ],
  "main_constraint": "the single thing holding them back most right now",
  "next_week_priority": {
    "action": "specific, implementable action",
    "time_required": "X hours",
    "expected_impact": "what should improve and by roughly how much",
    "why_now": "why this week specifically"
  },
  "stage_progress": {
    "assessment": "advancing / stalling / regressing",
    "milestone_progress": "how close to the current milestone?",
    "at_current_pace": "when will they hit the milestone?"
  },
  "one_thing": "if they do nothing else — the one action that matters most"
}`

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: buildBrandSystemPrompt(brand, lang, 'strategy'),
        messages: [{ role: 'user', content: insightsPrompt }],
      })

      const text = (response.content[0] as any).text
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        result.insights = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
      } catch {
        result.insights = {}
        result.raw = text
      }

      // ── Save key learnings to brand_learnings ──────────────────────
      const ins = result.insights
      if (ins) {
        const toSave: any[] = []

        if (ins.what_is_working?.length) {
          for (const w of ins.what_is_working as any[]) {
            if (w.observation) {
              toSave.push({
                workspace_id,
                insight_type: 'content',
                insight:      `✓ What is working: ${w.observation}${w.evidence ? ' — ' + w.evidence : ''}`,
                source:       'insights_agent',
                confidence:   0.80,
              })
            }
          }
        }

        if (ins.main_constraint) {
          toSave.push({
            workspace_id,
            insight_type: 'engagement',
            insight:      ins.main_constraint,
            source:       'insights_agent',
            confidence:   0.85,
          })
        }

        if (ins.next_week_priority?.action) {
          toSave.push({
            workspace_id,
            insight_type: 'strategy',
            insight:      `Next week angle: ${ins.next_week_priority.action}`,
            source:       'insights_agent',
            confidence:   0.80,
          })
        }

        if (toSave.length > 0) {
          await supabase.from('brand_learnings').insert(toSave).then(() => {}, () => {})
        }
      }

      result.agent   = 'insights'
      result.message = 'Strategic intelligence report generated'
    }

    // ── Log activity ───────────────────────────────────────────────────
    await supabase.from('activity').insert({
      workspace_id,
      user_id: user.id,
      type:    'agent_run',
      title:   `${agent_type.charAt(0).toUpperCase() + agent_type.slice(1)} Agent — ${result.message}`,
      metadata: { agent_type, result_summary: result.message },
    })

    try {
      await supabase.from('agent_runs').insert({
        workspace_id,
        agent_type,
        status:     'completed',
        result:     { message: result.message, summary: result.posts?.length || result.replies?.length || 0 },
        created_at: new Date().toISOString(),
      })
    } catch {}

    return NextResponse.json({ success: true, ...result })

  } catch (error: unknown) {
    console.error('[agents]', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Agent failed' }, { status: 500 })
  }
}
