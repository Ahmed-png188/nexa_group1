export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { getBrandContext } from '@/lib/brand-context'
import { guardWorkspace } from '@/lib/workspace-guard'
import { checkPlanAccess } from '@/lib/plan-gate'


const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Scores recent content against brand profile to detect voice drift
// Called after content generation and by morning-brief
export async function POST(request: NextRequest) {
  try {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workspace_id, content_ids } = await request.json()

  const deny = await guardWorkspace(supabase, workspace_id, user.id)
  if (deny) return deny

    // Plan gate
    const planError = await checkPlanAccess(workspace_id, 'brand_brain')
    if (planError) return planError

  const brand = await getBrandContext(workspace_id)
  if (!brand?.profile) {
    // No brand profile trained yet — nothing to drift from
    return NextResponse.json({ drift: false, score: null, message: 'Brand Brain not trained yet' })
  }

  // Get the last 10 pieces of generated copy
  const query = supabase
    .from('content')
    .select('id, body, type, platform, created_at')
    .eq('workspace_id', workspace_id)
    .in('type', ['post', 'thread', 'caption', 'hook', 'email'])
    .not('body', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: recentContent } = await query

  if (!recentContent || recentContent.length < 3) {
    return NextResponse.json({ drift: false, score: null, message: 'Not enough content to analyze yet' })
  }

  const prompt = `You are a brand voice analyst. Score how closely this recent content matches the brand's trained voice profile.

## Brand Voice Profile (the standard to measure against)
Primary tone: ${brand.profile.voice?.primary_tone || brand.workspace?.brand_voice}
Writing style: ${brand.profile.voice?.writing_style}
Vocabulary they USE: ${brand.profile.voice?.vocabulary?.join(', ')}
Words/phrases FORBIDDEN: ${brand.profile.voice?.forbidden?.join(', ')}
Hook style: ${brand.profile.content?.hooks?.join(', ')}
Sentence structure: ${brand.profile.voice?.sentence_structure}
Emotional triggers: ${brand.profile.voice?.emotional_triggers?.join(', ')}

## Recent Content (last ${recentContent.length} pieces)
${recentContent.map((c, i) => `
[${i + 1}] ${c.type} for ${c.platform}:
"${c.body?.slice(0, 250)}..."
`).join('\n')}

Score each piece and detect drift. Return ONLY valid JSON:
{
  "overall_score": 84,
  "pieces": [
    { "index": 1, "score": 88, "note": "Strong hook, uses brand vocabulary well" },
    { "index": 2, "score": 71, "note": "Feels generic, missing the provocative edge" }
  ],
  "drift_detected": false,
  "drift_direction": "becoming more generic / less direct / too formal / etc (null if no drift)",
  "drift_severity": "none",
  "alert_message": null,
  "recommendation": "Keep leaning into the contrast angles — they're staying on brand",
  "forbidden_words_found": ["any forbidden words spotted in the content"],
  "best_piece_index": 1,
  "worst_piece_index": 3
}

drift_detected = true if overall_score < 72 OR last 3 pieces average < 70
drift_severity = "none" | "mild" | "moderate" | "significant"
alert_message = specific, actionable message if drift_detected (null otherwise)`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = (response.content[0] as any).text
  let analysis: any = {}
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) analysis = JSON.parse(match[0])
  } catch {}

  // Update voice_match_score on each content piece
  if (analysis.pieces?.length) {
    for (const piece of analysis.pieces) {
      const contentItem = recentContent[piece.index - 1]
      if (contentItem) {
        await supabase.from('content')
          .update({ voice_match_score: piece.score })
          .eq('id', contentItem.id)
      }
    }
  }

  // Update workspace voice score average
  if (analysis.overall_score) {
    await supabase.from('workspaces')
      .update({ voice_score_avg: analysis.overall_score })
      .eq('id', workspace_id)
  }

  // If drift detected, write a learning
  if (analysis.drift_detected && analysis.drift_direction) {
    await supabase.from('brand_learnings').insert({
      workspace_id,
      source: 'voice_drift_detection',
      source_name: 'Voice Drift Alert',
      insight_type: 'voice',
      insight: `⚠️ Voice drift detected: ${analysis.drift_direction}. ${analysis.recommendation}`,
      confidence: 0.9,
    })

    // Write activity notification
    await supabase.from('activity').insert({
      workspace_id,
      user_id: user.id,
      type: 'voice_drift_alert',
      title: `Voice drift alert — ${analysis.alert_message || 'Your recent content is drifting from your brand voice'}`,
      metadata: { score: analysis.overall_score, severity: analysis.drift_severity },
    })
  }

  return NextResponse.json({
    success: true,
    overall_score: analysis.overall_score,
    drift_detected: analysis.drift_detected || false,
    drift_severity: analysis.drift_severity || 'none',
    drift_direction: analysis.drift_direction,
    alert_message: analysis.alert_message,
    recommendation: analysis.recommendation,
    forbidden_words_found: analysis.forbidden_words_found || [],
    pieces: analysis.pieces || [],
    best_piece_index: analysis.best_piece_index,
    worst_piece_index: analysis.worst_piece_index,
  })
  } catch (error: unknown) {
    console.error('Voice drift error:', error)
    return NextResponse.json({ error: 'Voice drift analysis failed' }, { status: 500 })
  }
}
