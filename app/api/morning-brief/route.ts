import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { getBrandContext } from '@/lib/brand-context'
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

  // Check if we already have a fresh brief (< 6 hours old)
  const { data: ws } = await supabase
    .from('workspaces')
    .select('*, brief_generated_at, weekly_brief, posting_streak, longest_streak, voice_score_avg, top_angle, last_posted_date, segment')
    .eq('id', workspace_id)
    .single()

  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  if (ws?.brief_generated_at && ws.brief_generated_at > sixHoursAgo && ws.weekly_brief) {
    return NextResponse.json({ success: true, brief: ws.weekly_brief, cached: true })
  }

  const brand = await getBrandContext(workspace_id)

  // Gather all the signals
  const today = new Date()
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString()

  const [contentRes, scheduledRes, activityRes, learningsRes, strategyRes] = await Promise.all([
    // Last 7 days content
    supabase.from('content').select('*')
      .eq('workspace_id', workspace_id)
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false }),
    // Upcoming scheduled
    supabase.from('content').select('*')
      .eq('workspace_id', workspace_id)
      .eq('status', 'scheduled')
      .gte('scheduled_for', today.toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(3),
    // Recent activity
    supabase.from('activity').select('type, title, created_at')
      .eq('workspace_id', workspace_id)
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })
      .limit(15),
    // Recent brand learnings
    supabase.from('brand_learnings').select('*')
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false })
      .limit(5),
    // Active strategy plan
    supabase.from('strategy_plans').select('content_pillars, insights, platform_strategy')
      .eq('workspace_id', workspace_id)
      .eq('status', 'active')
      .order('generated_at', { ascending: false })
      .limit(1).single(),
  ])

  const content = contentRes.data || []
  const scheduled = scheduledRes.data || []
  const activities = activityRes.data || []
  const learnings = learningsRes.data || []
  const strategy = strategyRes.data

  // Calculate real metrics
  const publishedThisWeek = content.filter(c => c.status === 'published').length
  const createdThisWeek = content.length
  const topContent = content
    .filter(c => c.status === 'published')
    .sort((a, b) => ((b.likes||0)+(b.comments||0)*3+(b.shares||0)*5) - ((a.likes||0)+(a.comments||0)*3+(a.shares||0)*5))
    [0]

  const nextScheduled = scheduled[0]
  const streak = ws?.posting_streak || 0
  const voiceScore = ws?.voice_score_avg || 0
  const topAngle = ws?.top_angle

  // Find today's strategy recommendation
  const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
  const todayKey = days[today.getDay()]
  const todayStrategy = (strategy?.platform_strategy as any)?.[todayKey]

  const segmentCtx = ws?.segment ? (SEGMENT_CONTEXT[ws.segment] ?? '') : ''

  const prompt = `${NEXA_BRAIN}
${segmentCtx ? `\n${segmentCtx}\n` : ''}
You are Nexa AI — the brand intelligence engine. Generate a sharp, intelligent morning brief for this brand.

## Brand
Name: ${brand?.brandName || ws?.brand_name}
Voice: ${brand?.profile?.voice?.primary_tone || ws?.brand_voice || 'not trained yet'}
Audience: ${brand?.profile?.audience?.primary || ws?.brand_audience}

## This Week's Activity
- Content created: ${createdThisWeek} pieces
- Published: ${publishedThisWeek} pieces
- Current posting streak: ${streak} days
- Voice match score: ${voiceScore > 0 ? `${voiceScore}%` : 'not measured yet'}
- Top performing angle: ${topAngle || 'not yet identified'}

## Best performing post this week
${topContent ? `"${topContent.body?.slice(0, 200)}" (${topContent.likes||0} likes, ${topContent.comments||0} comments, ${topContent.shares||0} shares)` : 'No published posts this week'}

## Next scheduled post
${nextScheduled ? `${nextScheduled.platform} post on ${new Date(nextScheduled.scheduled_for).toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}` : 'Nothing scheduled yet'}

## Today's strategy recommendation
${todayStrategy ? `Platform: ${todayStrategy.platform}, Type: ${todayStrategy.type}, Angle: ${todayStrategy.angle}` : 'No active strategy plan'}

## Recent brand learnings
${learnings.slice(0,3).map(l => `- ${l.insight}`).join('\n') || 'None yet'}

Generate a morning brief that feels like a sharp chief of staff giving you your daily debrief. Direct, specific, no fluff.

Return ONLY valid JSON:
{
  "headline": "One punchy sentence that captures the most important thing right now (max 12 words)",
  "status": "on_fire | building | needs_push | just_starting",
  "status_reason": "Why this status — one sentence",
  "todays_priority": "The single most important action for today (specific, actionable)",
  "todays_angle": "If they should create content today, the exact angle to use",
  "todays_platform": "Best platform to post on today",
  "streak_message": "${streak > 0 ? `Message about their ${streak}-day streak` : 'Message to start a streak today'}",
  "insight": "The sharpest observation about what's working or what to change (specific, not generic)",
  "warning": null,
  "momentum_score": 72,
  "next_milestone": "What the next meaningful milestone is (e.g. '7-day streak', 'first 100 impressions')",
  "one_thing": "If they do ONE thing today, it should be this"
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = (response.content[0] as any).text
  let brief: any = {}
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) brief = JSON.parse(match[0])
  } catch {
    brief = {
      headline: 'Your brand is ready to build.',
      status: 'building',
      todays_priority: 'Write one post today',
      todays_angle: strategy?.insights?.top_angles?.[0]?.angle || 'Share what you know that others don\'t',
      streak_message: streak > 0 ? `${streak} day streak — keep going` : 'Start your streak today',
      insight: 'Consistency is the product. Show up today.',
      momentum_score: 50,
      one_thing: 'Write and publish one post',
    }
  }

  // Save brief to workspace
  await supabase.from('workspaces').update({
    weekly_brief: brief,
    brief_generated_at: new Date().toISOString(),
  }).eq('id', workspace_id)

  return NextResponse.json({ success: true, brief, cached: false })
  } catch (error: unknown) {
    console.error('[morning-brief] Error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Failed to generate brief' }, { status: 500 })
  }
}
