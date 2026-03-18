import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBrandContext } from '@/lib/brand-context'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(
  request: NextRequest,
  { params }: { params: { secret: string } }
) {
  const supabase = createClient()
  try {
    const body = await request.json().catch(() => ({}))
    const { secret } = params

    // Find the webhook by secret
    const { data: webhook } = await supabase
      .from('webhooks')
      .select('*')
      .eq('webhook_secret', secret)
      .eq('is_active', true)
      .single()

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    // Update trigger stats
    await supabase.from('webhooks').update({
      last_triggered: new Date().toISOString(),
      trigger_count: (webhook.trigger_count ?? 0) + 1,
    }).eq('id', webhook.id)

    const brand = await getBrandContext(webhook.workspace_id)
    const results = []

    // Execute each action
    for (const action of webhook.actions || []) {
      try {
        if (action.type === 'generate_post') {
          const topic = body?.topic || action.default_topic || 'brand update'
          const platform = action.platform || 'instagram'

          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 500,
            system: `You are the content writer for ${brand?.brandName}. ${brand?.copyContext} Write only the content, nothing else.`,
            messages: [{ role: 'user', content: `Write a ${platform} post about: ${topic}` }],
          })

          const content = (response.content[0] as any).text

          const { data: saved } = await supabase.from('content').insert({
            workspace_id: webhook.workspace_id,
            type: 'post',
            platform,
            status: action.auto_schedule ? 'scheduled' : 'draft',
            body: content,
            prompt: `Webhook: ${topic}`,
            credits_used: 0,
            ai_model: 'webhook-agent',
            scheduled_for: action.auto_schedule
              ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
              : null,
          }).select().single()

          results.push({ action: 'generate_post', content_id: saved?.id, platform })

        } else if (action.type === 'add_to_sequence') {
          if (body?.email && action.sequence_id) {
            await supabase.from('email_subscribers').upsert({
              workspace_id: webhook.workspace_id,
              sequence_id: action.sequence_id,
              email: body.email,
              name: body.name || body.email.split('@')[0],
              status: 'active',
            }, { onConflict: 'workspace_id,sequence_id,email' })
            results.push({ action: 'add_to_sequence', email: body.email })
          }

        } else if (action.type === 'send_notification') {
          await supabase.from('activity').insert({
            workspace_id: webhook.workspace_id,
            type: 'webhook_triggered',
            title: `Webhook "${webhook.name}" triggered`,
            metadata: { webhook_id: webhook.id, trigger_data: body },
          })
          results.push({ action: 'notification', sent: true })
        }
      } catch (actionErr: any) {
        results.push({ action: action.type, error: actionErr.message })
      }
    }

    return NextResponse.json({ success: true, webhook: webhook.name, results })

  } catch (error: any) {
    console.error('Incoming webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Also handle GET (for webhook testing/verification)
export async function GET(
  request: NextRequest,
  { params }: { params: { secret: string } }
) {
  const supabase = createClient()
  const { data: webhook } = await supabase
    .from('webhooks')
    .select('name, is_active, trigger_count')
    .eq('webhook_secret', params.secret)
    .single()

  if (!webhook) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ webhook: webhook.name, active: webhook.is_active, triggers: webhook.trigger_count })
}
