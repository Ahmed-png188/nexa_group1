export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { guardWorkspace } from '@/lib/workspace-guard'
import { checkPlanAccess } from '@/lib/plan-gate'


const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, goal } = await request.json()
    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    // Plan gate
    const planError = await checkPlanAccess(workspace_id, 'lead_page')
    if (planError) return planError

    const { data: ws } = await supabase
      .from('workspaces')
      .select('brand_name,niche,brand_voice,brand_audience,segment,brand_tone')
      .eq('id', workspace_id)
      .single()

    const brandSummary = [
      ws?.brand_name     ? `Brand: ${ws.brand_name}`        : '',
      ws?.niche          ? `Niche: ${ws.niche}`             : '',
      ws?.brand_voice    ? `Voice: ${ws.brand_voice}`       : '',
      ws?.brand_audience ? `Audience: ${ws.brand_audience}` : '',
      ws?.brand_tone     ? `Tone: ${ws.brand_tone}`         : '',
      ws?.segment        ? `Segment: ${ws.segment}`         : '',
    ].filter(Boolean).join('\n')

    const prompt = `You are Nexa — a sharp business intelligence engine. Design a high-converting lead capture page.

BRAND CONTEXT:
${brandSummary || 'No brand context yet — use sensible defaults'}

GOAL: ${goal || 'Capture leads from content traffic'}

Return ONLY valid JSON — no markdown fences, no explanation, no extra text:
{
  "headline": "headline under 60 chars",
  "subline": "supporting line under 100 chars",
  "cta": "button label 2-5 words",
  "fields": [
    { "id": "f-email", "type": "email", "label": "Email address", "placeholder": "you@example.com", "required": true }
  ],
  "magnetEnabled": false,
  "magnetLabel": "Download the free guide",
  "magnetEmailSubject": "Here is your free resource",
  "magnetEmailBody": "Hi {{name}},\\n\\nHere is the link:\\n{{url}}\\n\\nEnjoy!",
  "theme": "dark",
  "accent": "#00AAFF",
  "reasoning": "1-2 sentences on these choices"
}

Rules:
- 2-4 fields max. Fewer = higher conversion.
- Add a custom question field ONLY if the business clearly benefits from qualifying leads
- magnetEnabled: true only if a lead magnet fits this business type
- theme: pick from dark/black/light/warm/midnight/rose based on brand vibe
- accent: pick a hex color that genuinely fits the brand (use brand colors if mentioned)
- Headline and subline must sound like THIS brand — never generic marketing copy`

    const response = await anthropic.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages:   [{ role: 'user', content: prompt }],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const result  = JSON.parse(cleaned)

    return NextResponse.json({ success: true, result })
  } catch (err: unknown) {
    console.error('[lead-page/generate]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
