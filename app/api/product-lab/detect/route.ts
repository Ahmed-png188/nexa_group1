export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { guardWorkspace } from '@/lib/workspace-guard'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { image_url, workspace_id } = await request.json()
    if (!image_url || !workspace_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'url', url: image_url } },
          { type: 'text', text: 'Analyze this product image. Respond with JSON only, no other text: { "type": "fragrance|apparel|flower|accessory|food|electronics|general", "suggested_name": "short product name", "notes": "one sentence photography tip" }' }
        ]
      }]
    })

    const text = (response.content[0] as any)?.text ?? ''
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found')
      const parsed = JSON.parse(jsonMatch[0])
      return NextResponse.json({
        type:           parsed.type           || 'general',
        suggested_name: parsed.suggested_name || 'My product',
        notes:          parsed.notes          || '',
      })
    } catch {
      return NextResponse.json({ type: 'general', suggested_name: 'My product', notes: '' })
    }

  } catch (err) {
    console.error('[product-lab/detect]', err)
    return NextResponse.json({ type: 'general', suggested_name: 'My product', notes: '' })
  }
}
