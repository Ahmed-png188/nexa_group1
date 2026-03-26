export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { ARABIC_VOICE_SYSTEM_PROMPT, ENGLISH_VOICE_SYSTEM_PROMPT, brandAnalysisPrompt } from '@/lib/prompts'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  const supabase = createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { assets, lang = 'en' } = body

    if (!assets || assets.length === 0) {
      return NextResponse.json({ error: 'No assets provided' }, { status: 400 })
    }

    // Get workspace
    const { data: member } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .single()

    if (!member) return NextResponse.json({ error: 'No workspace' }, { status: 403 })

    // Build assets string for analysis
    const assetsText = assets
      .map((a: any) => `[${a.type}]: ${a.content ?? a.file_name ?? 'asset'}`)
      .join('\n')

    const systemPrompt = lang === 'ar' ? ARABIC_VOICE_SYSTEM_PROMPT : ENGLISH_VOICE_SYSTEM_PROMPT
    const userPrompt = brandAnalysisPrompt(assetsText, lang)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const raw = (response.content[0] as any).text
    let analysis: any = {}

    try {
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) analysis = JSON.parse(match[0])
    } catch {
      return NextResponse.json({ error: 'Failed to parse analysis' }, { status: 500 })
    }

    // Update workspace with brand intelligence
    await supabase
      .from('workspaces')
      .update({
        brand_voice:    analysis.brandVoice,
        brand_tone:     analysis.brandTone,
        brand_audience: analysis.targetAudience,
        brand_onboarded: true,
        voice_score_avg: analysis.voiceMatchScore ?? 0,
      })
      .eq('id', member.workspace_id)

    // Store brand learnings
    const learnings = [
      { insight_type: 'voice',    insight: analysis.brandVoice,     source: 'brand_analysis' },
      { insight_type: 'audience', insight: analysis.targetAudience,  source: 'brand_analysis' },
      analysis.nexaInsight && { insight_type: 'voice', insight: analysis.nexaInsight, source: 'nexa_observation' },
    ].filter(Boolean)

    if (learnings.length) {
      await supabase.from('brand_learnings').insert(
        learnings.map(l => ({ ...l, workspace_id: member.workspace_id, confidence: 0.85 }))
      )
    }

    // Log activity
    await supabase.from('activity').insert({
      workspace_id: member.workspace_id,
      user_id: user.id,
      type: 'brand_analyzed',
      title: lang === 'ar'
        ? 'Nexa حلّلت علامتك التجارية'
        : 'Nexa analyzed your brand',
      metadata: { score: analysis.clarityScore },
    })

    return NextResponse.json({ success: true, analysis })

  } catch (error: unknown) {
    console.error('[analyze-brand]', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
