export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBrandContext } from '@/lib/brand-context'
import Anthropic from '@anthropic-ai/sdk'
import { buildBrandSystemPrompt, morningBriefPrompt } from '@/lib/prompts'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

/** Validate a cached brief has the expected v2 fields — reject old-format caches */
function isBriefValid(b: any): boolean {
  return b && typeof b === 'object' && typeof b.headline === 'string' && typeof b.todays_priority === 'string' && typeof b.one_thing === 'string'
}

async function generateBrief(workspaceIdFromBody: string | null, lang: 'en' | 'ar') {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Resolve workspace_id: prefer body param (validated against membership), else first membership
  let workspaceId: string | null = null

  if (workspaceIdFromBody) {
    // Verify the user is actually a member of the requested workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .eq('workspace_id', workspaceIdFromBody)
      .limit(1)
      .single()
    if (membership?.workspace_id) workspaceId = membership.workspace_id
  }

  if (!workspaceId) {
    // Fall back to first workspace membership
    const { data: member } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()
    workspaceId = member?.workspace_id ?? null
  }

  if (!workspaceId) {
    return NextResponse.json({ error: 'No workspace' }, { status: 400 })
  }

  // Cache check per language — reject stale format briefs
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('brief_generated_at, weekly_brief, weekly_brief_ar, top_angle, name, brand_voice, brand_audience, brand_tone, brand_name, weekly_priorities, weekly_priorities_ar')
    .eq('id', workspaceId)
    .single()

  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000)
  const cachedBrief = lang === 'ar' ? workspace?.weekly_brief_ar : workspace?.weekly_brief
  if (
    workspace?.brief_generated_at &&
    new Date(workspace.brief_generated_at) > sixHoursAgo &&
    isBriefValid(cachedBrief)
  ) {
    return NextResponse.json({ success: true, brief: cachedBrief, cached: true })
  }

  // Get brand context — non-blocking: proceed even if null (new users without brand data)
  const brand = await getBrandContext(workspaceId)

  // Build brand context string from whatever we have
  const brandName = brand?.brandName || workspace?.brand_name || workspace?.name || 'this brand'
  const brandVoice = brand?.workspace?.brand_voice || workspace?.brand_voice || ''
  const brandAudience = brand?.workspace?.brand_audience || workspace?.brand_audience || ''
  const brandContextStr = `${brandName}${brandVoice ? ` — ${brandVoice}` : ''}${brandAudience ? ` — ${brandAudience}` : ''}`

  // Recent content
  const { data: recentContent } = await supabase
    .from('content')
    .select('platform, body, status, likes, comments, shares, impressions, created_at')
    .eq('workspace_id', workspaceId)
    .in('status', ['published', 'ready'])
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: learnings } = await supabase
    .from('brand_learnings')
    .select('insight, insight_type')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(5)

  const recentContentStr = recentContent
    ?.map(c => `[${c.platform}] ${c.body?.slice(0, 100)}… | ❤️${c.likes} 💬${c.comments}`)
    .join('\n') || (lang === 'ar' ? 'لا محتوى سابق' : 'No previous content')

  const insightsStr = learnings
    ?.map(l => `[${l.insight_type}] ${l.insight}`)
    .join('\n') || (lang === 'ar' ? 'لا رؤى بعد' : 'No insights yet')

  // Build system prompt with CEO intelligence + unified briefing
  const systemPrompt = buildBrandSystemPrompt(brand ?? {}, lang, 'strategy')

  // Get weekly priorities from intelligence engine
  const weeklyPriorities = lang === 'ar'
    ? (workspace as any)?.weekly_priorities_ar
    : (workspace as any)?.weekly_priorities

  const prioritiesContext = weeklyPriorities?.priorities?.length
    ? (lang === 'ar'
      ? `\nأولويات هذا الأسبوع من المدير التنفيذي:\n${weeklyPriorities.priorities.map((p: any) => `• ${p.title}: ${p.action}`).join('\n')}\nالعائق الرئيسي: ${weeklyPriorities.main_constraint || ''}`
      : `\nThis week's CEO priorities:\n${weeklyPriorities.priorities.map((p: any) => `• ${p.title}: ${p.action}`).join('\n')}\nMain constraint: ${weeklyPriorities.main_constraint || ''}`)
    : ''

  const userPrompt = morningBriefPrompt(brandContextStr, recentContentStr, insightsStr + prioritiesContext, lang)

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1400,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const raw = (response.content[0] as any).text
  let brief: any = {}
  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) brief = JSON.parse(match[0])
  } catch {
    // Fallback: wrap raw text into the expected shape
    brief = {
      headline: brandName,
      status: 'just_starting',
      todays_priority: lang === 'ar' ? 'أنشئ أول محتوى لك اليوم' : 'Create your first piece of content today',
      todays_angle: '',
      todays_platform: '',
      one_thing: lang === 'ar' ? 'ابدأ بمنشور واحد — الحركة تبني الزخم' : 'Start with one post — motion builds momentum',
      insight: raw.slice(0, 200),
    }
  }

  // Validate that Claude returned the expected fields — fill any missing ones
  if (!brief.headline) brief.headline = brandName
  if (!brief.status) brief.status = 'just_starting'
  if (!brief.todays_priority) brief.todays_priority = lang === 'ar' ? 'أنشئ محتوى اليوم' : 'Create content today'
  if (!brief.one_thing) brief.one_thing = lang === 'ar' ? 'ابدأ الآن' : 'Start now'

  // Persist to lang-specific column
  const updateData: Record<string, any> = {
    brief_generated_at: new Date().toISOString(),
    top_angle: brief.todays_angle || brief.topAngle || null,
  }
  if (lang === 'ar') {
    updateData.weekly_brief_ar = brief
  } else {
    updateData.weekly_brief = brief
  }

  await supabase.from('workspaces').update(updateData).eq('id', workspaceId)

  return NextResponse.json({ success: true, brief, cached: false })
}

export async function GET(request: NextRequest) {
  try {
    const lang = (request.nextUrl.searchParams.get('lang') ?? 'en') as 'en' | 'ar'
    const workspaceId = request.nextUrl.searchParams.get('workspace_id')
    return await generateBrief(workspaceId, lang)
  } catch (error: unknown) {
    console.error('[morning-brief GET]', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Brief generation failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const lang = (body.lang ?? 'en') as 'en' | 'ar'
    const workspaceId = body.workspace_id ?? null
    return await generateBrief(workspaceId, lang)
  } catch (error: unknown) {
    console.error('[morning-brief POST]', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Brief generation failed' }, { status: 500 })
  }
}
