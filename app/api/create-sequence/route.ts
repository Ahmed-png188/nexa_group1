export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { checkPlanAccess } from '@/lib/plan-gate'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { guardWorkspace } from '@/lib/workspace-guard'
import { getBrandContext } from '@/lib/brand-context'


const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Smart delay schedules per sequence type
const DELAY_SCHEDULES: Record<string, number[]> = {
  welcome:  [0, 1, 3, 7, 14],
  nurture:  [0, 3, 7, 14, 21],
  reengage: [0, 2, 5, 10, 15],
  launch:   [0, 1, 2, 4, 7],
  sales:    [0, 2, 4, 7, 10],
  default:  [0, 2, 4, 7, 10],
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, name, goal, audience, sequence_type = 'default', num_emails = 5, generate_with_ai = true } = await request.json()

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    const gateError = await checkPlanAccess(workspace_id, 'email_sequences')
    if (gateError) return gateError

    const { data: workspace } = await supabase
      .from('workspaces').select('*').eq('id', workspace_id).single()

    let steps: any[] = []

    if (generate_with_ai) {
      // Full Brand Brain context
      const brand = await getBrandContext(workspace_id)
      const profile = brand?.profile

      const brandVoice   = profile?.voice?.primary_tone      || workspace?.brand_voice    || 'confident, direct, outcome-focused'
      const writingStyle = profile?.voice?.writing_style     || 'clear, punchy, no filler'
      const vocabulary   = profile?.voice?.vocabulary?.join(', ')      || ''
      const forbidden    = profile?.voice?.forbidden?.join(', ')        || ''
      const audiencePrimary = profile?.audience?.primary     || workspace?.brand_audience || 'ambitious professionals'
      const audiencePsych   = profile?.audience?.psychology  || ''
      const painPoints      = profile?.audience?.pain_points?.join(', ') || ''
      const desires         = profile?.audience?.desires?.join(', ')     || ''
      const positioning     = profile?.positioning?.unique_angle || ''
      const ctaStyle        = profile?.content?.cta_style    || 'clear and direct'
      const hookStyles      = profile?.content?.hooks?.join(', ') || ''
      const customPrefix    = profile?.generation_instructions?.copy_prompt_prefix || ''
      const brandName       = workspace?.brand_name || workspace?.name || 'the brand'

      const brandDNA = [
        `Brand: ${brandName}`,
        `Voice: ${brandVoice}`,
        `Writing style: ${writingStyle}`,
        vocabulary   ? `Vocabulary to USE: ${vocabulary}`   : '',
        forbidden    ? `Words FORBIDDEN: ${forbidden}`       : '',
        `Audience: ${audiencePrimary}`,
        audiencePsych  ? `Audience psychology: ${audiencePsych}` : '',
        painPoints     ? `Pain points: ${painPoints}`            : '',
        desires        ? `Desires: ${desires}`                   : '',
        positioning    ? `Unique positioning: ${positioning}`    : '',
        `CTA style: ${ctaStyle}`,
        hookStyles     ? `Hook styles that work: ${hookStyles}`  : '',
        customPrefix,
      ].filter(Boolean).join('\n')

      // Pick delay schedule
      const typeKey = Object.keys(DELAY_SCHEDULES).find(k =>
        (sequence_type + ' ' + (goal || '')).toLowerCase().includes(k)
      ) || 'default'
      const delays = DELAY_SCHEDULES[typeKey]
      const actualEmails = Math.min(num_emails, delays.length)

      const emailArchitecture = [
        `Email 1 (Day ${delays[0]}): Hook immediately. Why this matters to THEM right now. No fluff.`,
        actualEmails >= 2 ? `Email 2 (Day ${delays[1]}): Deliver the first value. One insight they can use today.` : '',
        actualEmails >= 3 ? `Email 3 (Day ${delays[2]}): Address the main objection. Acknowledge it, then dismantle it.` : '',
        actualEmails >= 4 ? `Email 4 (Day ${delays[3]}): Concrete result or social proof. Numbers beat adjectives.` : '',
        actualEmails >= 5 ? `Email 5 (Day ${delays[4]}): Clear ask. The CTA should feel earned, not forced.` : '',
      ].filter(Boolean).join('\n')

      const systemPrompt = `You are the head copywriter for ${brandName}. You write email sequences that feel like they came from a real human — not a marketing robot.

BRAND DNA — write EXACTLY in this voice, no exceptions:
${brandDNA}

WRITING RULES (non-negotiable):
- Every email sounds like the brand founder wrote it personally
- Subject lines: max 7 words, curiosity or benefit driven
- Bodies: 120-200 words max. Every sentence earns its place.
- End with a specific CTA matching the brand's CTA style
- No "I hope this email finds you well"
- No "In today's fast-paced world"
- No "game-changer", "leverage", "synergy"
- Use the vocabulary listed. Avoid the forbidden words.`

      const userPrompt = `Write a ${actualEmails}-email sequence for this goal:

Goal: ${goal}
Audience: ${audience || audiencePrimary}
Type: ${sequence_type}

EMAIL ARCHITECTURE:
${emailArchitecture}

Return ONLY valid JSON, no markdown, no backticks, no explanation:
{
  "sequence_name": "Short descriptive name",
  "steps": [
    {
      "step_number": 1,
      "delay_days": ${delays[0]},
      "subject": "Subject line — max 7 words",
      "preview_text": "Preview text 40-60 chars",
      "body": "Full email body 120-200 words. Human. On-brand. Direct.",
      "cta": "Specific call to action",
      "goal": "What this email achieves"
    }
  ]
}`

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      })

      const rawText = response.content
        .filter(b => b.type === 'text')
        .map(b => (b as any).text)
        .join('')

      try {
        const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const parsed = JSON.parse(cleaned)
        steps = (parsed.steps ?? []).map((s: any, i: number) => ({
          ...s,
          id: `step_${Date.now()}_${i}`,
          step_type: 'email',
          delay_days: s.delay_days ?? delays[i] ?? i * 2,
        }))
      } catch {
        // Fallback
        steps = Array.from({ length: actualEmails }, (_, i) => ({
          id: `step_${Date.now()}_${i}`,
          step_number: i + 1,
          step_type: 'email',
          delay_days: delays[i] ?? i * 2,
          subject: `Email ${i + 1} — ${goal}`,
          preview_text: `A message from ${brandName}`,
          body: `Hi there,\n\nThis is email ${i + 1} of your sequence.\n\nBest,\n${brandName}`,
          cta: 'Reply to this email',
          goal: `Step ${i + 1} objective`,
        }))
      }
    }

    const { data: agent } = await supabase.from('agents').insert({
      workspace_id, created_by: user.id,
      name, type: 'email_sequence', status: 'idle',
      config: { goal, audience, num_emails, sequence_type },
    }).select().single()

    const { data: sequence } = await supabase.from('email_sequences').insert({
      workspace_id, agent_id: agent?.id,
      name, status: 'draft', steps,
    }).select().single()

    await supabase.from('activity').insert({
      workspace_id, user_id: user.id,
      type: 'sequence_created',
      title: `Email sequence "${name}" created — ${steps.length} emails`,
      metadata: { sequence_id: sequence?.id, goal, sequence_type },
    })

    return NextResponse.json({ success: true, sequence, agent, steps })

  } catch (error: unknown) {
    console.error('[create-sequence]', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Failed to create sequence' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const workspace_id = new URL(request.url).searchParams.get('workspace_id')
    if (!workspace_id) return NextResponse.json({ error: 'Missing workspace_id' }, { status: 400 })

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    const { data: sequences } = await supabase
      .from('email_sequences')
      .select('*, agents(status, progress, stats)')
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ sequences: sequences ?? [] })
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Failed to get sequences' }, { status: 500 })
  }
}
