export const dynamic = 'force-dynamic'

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
    const {
      messages: messagesBody,
      message,
      history: historyBody = [],
      lang = 'en',
      conversationId,
      workspace_id,
    } = body

    // Support both {messages:[]} array format and {message, history:[]} format
    const rawMessages: any[] = messagesBody ?? [
      ...historyBody,
      ...(message ? [{ role: 'user', content: message }] : []),
    ]

    if (!rawMessages.length) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    const brand = await getBrandContext(user.id)
    const brandContext = brand
      ? [
          brand.brandName && (lang === 'ar' ? `العلامة: ${brand.brandName}` : `Brand: ${brand.brandName}`),
          brand.brandVoice && (lang === 'ar' ? `الصوت: ${brand.brandVoice}` : `Voice: ${brand.brandVoice}`),
          brand.brandTone && (lang === 'ar' ? `النبرة: ${brand.brandTone}` : `Tone: ${brand.brandTone}`),
          brand.brandAudience && (lang === 'ar' ? `الجمهور: ${brand.brandAudience}` : `Audience: ${brand.brandAudience}`),
        ].filter(Boolean).join('\n')
      : lang === 'ar' ? 'لا يوجد سياق علامة تجارية بعد' : 'No brand context yet'

    const systemPrompt = chatSystemPrompt(brandContext, lang)

    // Build message history (max 20 messages for context window)
    // Filter to only valid roles Anthropic accepts
    const history = rawMessages.slice(-20)
      .filter((m: any) => m.role === 'user' || m.role === 'assistant')
      .map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content ?? '',
      }))
      .filter((m: any) => m.content.length > 0)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: history,
    })

    const reply = (response.content[0] as any).text

    // Save conversation if we have a conversationId
    const wsId = workspace_id ?? brand?.workspaceId
    if (conversationId && wsId) {
      const lastUserMsg = history[history.length - 1]
      await supabase.from('messages').insert([
        {
          conversation_id: conversationId,
          workspace_id: wsId,
          role: 'user',
          content: lastUserMsg?.content ?? message ?? '',
        },
        {
          conversation_id: conversationId,
          workspace_id: wsId,
          role: 'assistant',
          content: reply,
        },
      ]) // Non-critical — errors captured silently by outer catch
    }

    return NextResponse.json({ success: true, reply })

  } catch (error: unknown) {
    console.error('[chat]', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 })
  }
}
