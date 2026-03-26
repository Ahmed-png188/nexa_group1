export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBrandContext } from '@/lib/brand-context'
import Anthropic from '@anthropic-ai/sdk'
import {
  buildBrandSystemPrompt,
  contentPrompts,
} from '@/lib/prompts'
import { rateLimit, LIMITS } from '@/lib/rate-limit'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  const supabase = createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate limit: 20 AI generations per minute per user
    const rl = await rateLimit({ key: user.id, ...LIMITS.aiGenerate })
    if (rl.limited) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt.getTime() - Date.now()) / 1000)) } }
      )
    }

    const body = await request.json()
    const {
      type = 'post',
      platform = 'instagram',
      topic: topicRaw,
      prompt: promptRaw,
      tone = 'bold',
      lang = 'en',
      additionalContext = '',
      workspace_id: workspaceIdFromBody,
    } = body

    const topic = topicRaw || promptRaw

    if (!topic) return NextResponse.json({ error: 'Topic is required' }, { status: 400 })

    // Get brand context
    const brand = await getBrandContext(user.id)
    const systemPrompt = buildBrandSystemPrompt(brand ?? {}, lang)

    // Build the user prompt based on type and language
    let userPrompt = ''

    switch (type) {
      case 'post':
      case 'caption':
        userPrompt = contentPrompts.post(platform, topic, tone, lang)
        break
      case 'thread':
        userPrompt = contentPrompts.thread(topic, 7, lang)
        break
      case 'email':
        userPrompt = contentPrompts.email(topic, additionalContext, lang)
        break
      case 'blog':
        userPrompt = contentPrompts.blog(topic, brand?.brandAudience ?? '', lang)
        break
      case 'ad':
        userPrompt = contentPrompts.ad(brand?.brandName ?? '', topic, platform, lang)
        break
      case 'bio':
        userPrompt = contentPrompts.bio(
          brand?.brandName ?? '',
          topic,
          brand?.brandAudience ?? '',
          lang
        )
        break
      case 'tagline':
        userPrompt = contentPrompts.tagline(brand?.brandName ?? '', topic, lang)
        break
      case 'script':
        userPrompt = contentPrompts.script(topic, '60s', platform, lang)
        break
      default:
        userPrompt = contentPrompts.post(platform, topic, tone, lang)
    }

    if (additionalContext && type !== 'email') {
      userPrompt += lang === 'ar'
        ? `\n\nسياق إضافي: ${additionalContext}`
        : `\n\nAdditional context: ${additionalContext}`
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const content = (response.content[0] as any).text

    // Save to DB as draft
    const wsId = workspaceIdFromBody ?? brand?.workspaceId
    const { data: saved, error: saveError } = await supabase
      .from('content')
      .insert({
        workspace_id: wsId,
        created_by: user.id,
        type: type === 'caption' ? 'post' : type,
        platform,
        status: 'draft',
        body: content,
        prompt: topic,
        ai_model: 'claude-sonnet-4-20250514',
        metadata: { lang, tone, type },
      })
      .select()
      .single()

    return NextResponse.json({
      success: true,
      content,
      id: saved?.id,
    })

  } catch (error: unknown) {
    console.error('[generate-content]', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
