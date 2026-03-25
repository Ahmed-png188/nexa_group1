import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBrandContext } from '@/lib/brand-context'
import Anthropic from '@anthropic-ai/sdk'
import { buildBrandSystemPrompt, morningBriefPrompt } from '@/lib/prompts'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

async function generateBrief(request: NextRequest, lang: 'en' | 'ar') {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Look up workspace_id from user_id
  const { data: member } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()
  if (!member?.workspace_id) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const brand = await getBrandContext(member.workspace_id)
  if (!brand) return NextResponse.json({ error: 'No brand context' }, { status: 400 })

  const workspaceId = member.workspace_id

  // Cache is per-language — Arabic users get Arabic brief
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('brief_generated_at, weekly_brief, weekly_brief_ar, top_angle')
    .eq('id', workspaceId)
    .single()

  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000)
  const cachedBrief = lang === 'ar' ? workspace?.weekly_brief_ar : workspace?.weekly_brief
  if (
    workspace?.brief_generated_at &&
    new Date(workspace.brief_generated_at) > sixHoursAgo &&
    cachedBrief
  ) {
    return NextResponse.json({ success: true, brief: cachedBrief, cached: true })
  }

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

  const brandContext = `${brand.brandName} — ${brand.workspace.brand_voice ?? ''} — ${brand.workspace.brand_audience ?? ''}`
  const recentContentStr = recentContent
    ?.map(c => `[${c.platform}] ${c.body?.slice(0, 100)}… | ❤️${c.likes} 💬${c.comments}`)
    .join('\n') || (lang === 'ar' ? 'لا محتوى سابق' : 'No previous content')

  const insightsStr = learnings
    ?.map(l => `[${l.insight_type}] ${l.insight}`)
    .join('\n') || (lang === 'ar' ? 'لا رؤى بعد' : 'No insights yet')

  const systemPrompt = buildBrandSystemPrompt(brand, lang)
  const userPrompt = morningBriefPrompt(brandContext, recentContentStr, insightsStr, lang)

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const raw = (response.content[0] as any).text
  let brief: any = {}
  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) brief = JSON.parse(match[0])
  } catch {
    brief = { nexaRead: raw }
  }

  // Save to lang-specific column
  const updateData: Record<string, any> = {
    brief_generated_at: new Date().toISOString(),
    top_angle: brief.topAngle,
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
    return await generateBrief(request, lang)
  } catch (error: unknown) {
    console.error('[morning-brief GET]', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Brief generation failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const lang = (body.lang ?? 'en') as 'en' | 'ar'
    return await generateBrief(request, lang)
  } catch (error: unknown) {
    console.error('[morning-brief POST]', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Brief generation failed' }, { status: 500 })
  }
}


