import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, name, goal, audience, num_emails = 5, generate_with_ai = true } = await request.json()

    const { data: workspace } = await supabase
      .from('workspaces').select('*').eq('id', workspace_id).single()

    let steps = []

    if (generate_with_ai) {
      // Use Claude to generate the full sequence
      const prompt = `You are an expert email copywriter for ${workspace?.brand_name ?? workspace?.name}.

Brand voice: ${workspace?.brand_voice ?? 'Confident, direct, outcome-focused'}
Audience: ${workspace?.brand_audience ?? 'Ambitious professionals'}
Sequence goal: ${goal}
Target audience for this sequence: ${audience}
Number of emails: ${num_emails}

Write a complete ${num_emails}-email sequence. Return ONLY valid JSON (no markdown):

{
  "sequence_name": "Name for this sequence",
  "steps": [
    {
      "step_number": 1,
      "delay_days": 0,
      "subject": "Email subject line",
      "preview_text": "Preview text (shown in inbox)",
      "body": "Full email body — conversational, on-brand, with clear CTA. 150-250 words.",
      "cta": "Call to action text",
      "goal": "What this specific email achieves"
    }
  ]
}

Email 1: Immediate (day 0) — warm welcome, set expectations
Email 2: Day 2 — deliver value, build trust  
Email 3: Day 4 — address the main objection
Email 4: Day 7 — social proof / case study
Email 5: Day 10 — direct offer / CTA

Make every email feel personal, human, and specific to the goal. No fluff.`

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
      })

      const rawText = response.content
        .filter(b => b.type === 'text')
        .map(b => (b as any).text)
        .join('')

      try {
        const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const parsed = JSON.parse(cleaned)
        steps = parsed.steps ?? []
      } catch {
        // Fallback steps
        steps = Array.from({ length: num_emails }, (_, i) => ({
          step_number: i + 1,
          delay_days: [0, 2, 4, 7, 10][i] ?? i * 2,
          subject: `Email ${i + 1} — ${goal}`,
          preview_text: `A message from ${workspace?.brand_name}`,
          body: `Hi there,\n\nThis is email ${i + 1} of your ${goal} sequence.\n\nMore content coming soon.\n\nBest,\n${workspace?.brand_name}`,
          cta: 'Reply to this email',
          goal: `Step ${i + 1} objective`,
        }))
      }
    }

    // Create the agent
    const { data: agent } = await supabase.from('agents').insert({
      workspace_id,
      created_by: user.id,
      name,
      type: 'email_sequence',
      status: 'idle',
      config: { goal, audience, num_emails },
    }).select().single()

    // Save the sequence
    const { data: sequence } = await supabase.from('email_sequences').insert({
      workspace_id,
      agent_id: agent?.id,
      name,
      status: 'draft',
      steps,
    }).select().single()

    await supabase.from('activity').insert({
      workspace_id,
      user_id: user.id,
      type: 'sequence_created',
      title: `Email sequence "${name}" created — ${steps.length} emails`,
    })

    return NextResponse.json({ success: true, sequence, agent, steps })

  } catch (error: any) {
    console.error('Create sequence error:', error)
    return NextResponse.json({ error: 'Failed to create sequence' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const workspace_id = searchParams.get('workspace_id')

    const { data: sequences } = await supabase
      .from('email_sequences')
      .select('*, agents(status, progress, stats)')
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ sequences: sequences ?? [] })

  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to get sequences' }, { status: 500 })
  }
}
