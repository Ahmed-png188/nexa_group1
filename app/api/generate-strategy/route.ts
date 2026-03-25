import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBrandContext } from '@/lib/brand-context'
import Anthropic from '@anthropic-ai/sdk'
import { buildBrandSystemPrompt, strategyPrompt } from '@/lib/prompts'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  const supabase = createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      goal,
      audience,
      timeline = '3 months',
      lang = 'en',
    } = body

    if (!goal) return NextResponse.json({ error: 'Goal is required' }, { status: 400 })

    const brand = await getBrandContext(user.id)
    const brandContext = brand
      ? `${brand.brandName} — ${brand.workspace.brand_voice ?? ''} — ${brand.workspace.brand_audience ?? ''}`
      : ''

    const systemPrompt = buildBrandSystemPrompt(brand ?? {}, lang)
    const userPrompt = strategyPrompt(goal, audience ?? '', timeline, brandContext, lang)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const raw = (response.content[0] as any).text
    let strategy: any = {}

    try {
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) strategy = JSON.parse(match[0])
    } catch {
      return NextResponse.json({ error: 'Failed to parse strategy' }, { status: 500 })
    }

    // Save strategy to DB
    const { data: saved } = await supabase
      .from('strategy_plans')
      .insert({
        workspace_id: body.workspace_id ?? null,
        title: strategy.title ?? (lang === 'ar' ? 'استراتيجية جديدة' : 'New Strategy'),
        status: 'active',
        content_pillars: strategy.pillars,
        audience_map: strategy.audienceMap,
        platform_strategy: strategy.platformStrategy,
        daily_plan: strategy.weeklyPlan,
        insights: { actions: strategy.actions, kpis: strategy.kpis, nexaNote: strategy.nexaNote },
        generated_at: new Date().toISOString(),
      })
      .select()
      .single()

    return NextResponse.json({ success: true, strategy, id: saved?.id })

  } catch (error: unknown) {
    console.error('[generate-strategy]', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Strategy generation failed' }, { status: 500 })
  }
}
