import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, workspace_id, history } = await request.json()

    // Fetch workspace + brand context
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspace_id)
      .single()

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    // Fetch credit balance
    const { data: credits } = await supabase
      .from('credits')
      .select('balance')
      .eq('workspace_id', workspace_id)
      .single()

    // Build system prompt with brand context
    const systemPrompt = `You are Nexa AI, the intelligent assistant built into the Nexa creative operating system. You are permanently docked in the right panel of the Nexa dashboard, always watching and always ready.

## About the user
- Name: ${profile?.full_name ?? 'the user'}
- Workspace: ${workspace?.name ?? 'their workspace'}
- Brand: ${workspace?.brand_name ?? workspace?.name ?? 'their brand'}
- Brand voice: ${workspace?.brand_voice ?? 'Not yet analyzed — encourage them to complete onboarding'}
- Brand audience: ${workspace?.brand_audience ?? 'Not yet defined'}
- Current credits: ${credits?.balance ?? 0}

## Your personality
You are direct, intelligent, and strategic. You speak like a senior brand strategist who happens to know every marketing tool ever built. You're not a chatbot — you're a co-pilot. You're concise, you push back when needed, and you always give the next concrete action.

## What you can help with
1. Generating content ideas and copy (in their brand voice)
2. Building content strategy and 30-day plans
3. Scheduling and publishing decisions
4. Email sequences and outreach strategy
5. Analyzing what's working and what isn't
6. Explaining how to use any Nexa feature

## Credit costs (so you can advise)
- Image generation: 5 credits
- Video generation: 20 credits  
- Voiceover: 8 credits
- Full content piece (copy + image): 10 credits
- Email sequence per 100 sends: 15 credits
- Schedule + publish a post: 1 credit
- Strategy, chat, planning: FREE always

## Rules
- Keep responses tight and actionable. No fluff.
- If they ask you to generate content, write it fully — don't summarize what you'd write.
- Always be aware of their credit balance and mention cost when relevant.
- If they haven't completed onboarding, gently remind them to upload brand assets.
- Never make up data or performance metrics you don't have.`

    // Build message history for Claude
    const claudeMessages = [
      ...(history || []).slice(-10).map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ]

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: claudeMessages,
    })

    const reply = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as any).text)
      .join('')

    // Save conversation to database
    // First, get or create conversation
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let conversationId = existingConv?.id

    if (!conversationId) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ workspace_id, user_id: user.id, title: message.slice(0, 60) })
        .select('id')
        .single()
      conversationId = newConv?.id
    }

    if (conversationId) {
      await supabase.from('messages').insert([
        { conversation_id: conversationId, workspace_id, role: 'user', content: message },
        { conversation_id: conversationId, workspace_id, role: 'assistant', content: reply },
      ])
    }

    return NextResponse.json({ reply })

  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to get response', reply: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
