import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBrandContext } from '@/lib/brand-context'
import Anthropic from '@anthropic-ai/sdk'
import { chatSystemPrompt } from '@/lib/prompts'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  const supabase = createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { messages, lang = 'en', conversationId, workspace_id } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 })
    }

    const brand = await getBrandContext(user.id)
    const brandContext = brand
      ? [
          brand.brandName && `العلامة: ${brand.brandName}`,
          brand.workspace.brand_voice && `الصوت: ${brand.workspace.brand_voice}`,
          brand.workspace.brand_tone && `النبرة: ${brand.workspace.brand_tone}`,
          brand.workspace.brand_audience && `الجمهور: ${brand.workspace.brand_audience}`,
        ].filter(Boolean).join('\n')
      : lang === 'ar' ? 'لا يوجد سياق علامة تجارية بعد' : 'No brand context yet'

    const systemPrompt = chatSystemPrompt(brandContext, lang)

    // Build message history (max 20 messages for context window)
    const history = messages.slice(-20).map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: history,
    })

    const reply = (response.content[0] as any).text

    // Save conversation if we have a conversationId and workspace_id
    if (conversationId && workspace_id) {
      const lastUserMsg = messages[messages.length - 1]
      await supabase.from('messages').insert([
        {
          conversation_id: conversationId,
          workspace_id: workspace_id,
          role: 'user',
          content: lastUserMsg.content,
        },
        {
          conversation_id: conversationId,
          workspace_id: workspace_id,
          role: 'assistant',
          content: reply,
        },
      ])
    }

    return NextResponse.json({ success: true, reply })

  } catch (error: unknown) {
    console.error('[chat]', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 })
  }
}
