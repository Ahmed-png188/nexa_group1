import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBrandContext } from '@/lib/brand-context'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// GET — list webhooks for workspace
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const workspace_id = searchParams.get('workspace_id')

  const { data } = await supabase.from('webhooks')
    .select('*')
    .eq('workspace_id', workspace_id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ webhooks: data ?? [] })
}

// POST — create webhook OR receive incoming webhook
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  // Incoming webhook from Make/Zapier
  if (action === 'trigger') {
    return handleIncomingWebhook(request)
  }

  // Create new webhook
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workspace_id, name, trigger, actions } = await request.json()

  // Generate a unique webhook URL
  const webhookSecret = crypto.randomUUID().replace(/-/g, '')

  const { data, error } = await supabase.from('webhooks').insert({
    workspace_id,
    name,
    trigger,
    actions,
    webhook_secret: webhookSecret,
    webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/incoming/${webhookSecret}`,
    is_active: true,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ webhook: data })
}

// DELETE — delete webhook
export async function DELETE(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  await supabase.from('webhooks').delete().eq('id', id)
  return NextResponse.json({ success: true })
}

async function handleIncomingWebhook(request: NextRequest) {
  const supabase = createClient()
  try {
    const body = await request.json()
    const { webhook_secret, data: triggerData } = body

    // Find the webhook
    const { data: webhook } = await supabase.from('webhooks')
      .select('*')
      .eq('webhook_secret', webhook_secret)
      .eq('is_active', true)
      .single()

    if (!webhook) return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })

    const brand = await getBrandContext(webhook.workspace_id)
    const results = []

    // Execute each action
    for (const action of webhook.actions || []) {
      if (action.type === 'generate_post') {
        const topic = triggerData?.topic || action.default_topic || 'brand update'
        const platform = action.platform || 'instagram'

        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          system: `You are the content writer for ${brand?.brandName}. ${brand?.copyContext}`,
          messages: [{ role: 'user', content: `Write a ${platform} post about: ${topic}. Brand voice only. Ready to publish.` }],
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
          scheduled_for: action.auto_schedule ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null,
        }).select().single()

        results.push({ action: 'generate_post', content_id: saved?.id, platform })

      } else if (action.type === 'send_notification') {
        // Log to activity
        await supabase.from('activity').insert({
          workspace_id: webhook.workspace_id,
          type: 'webhook_triggered',
          title: `Webhook "${webhook.name}" triggered — ${action.message || 'notification sent'}`,
          metadata: { webhook_id: webhook.id, trigger_data: triggerData },
        })
        results.push({ action: 'notification', sent: true })

      } else if (action.type === 'add_to_sequence') {
        // Add contact to email sequence
        if (triggerData?.email && action.sequence_id) {
          results.push({ action: 'add_to_sequence', email: triggerData.email, sequence_id: action.sequence_id })
        }
      }
    }

    // Update webhook stats
    await supabase.from('webhooks').update({
      last_triggered_at: new Date().toISOString(),
      trigger_count: (webhook.trigger_count || 0) + 1,
    }).eq('id', webhook.id)

    await supabase.from('activity').insert({
      workspace_id: webhook.workspace_id,
      type: 'webhook_triggered',
      title: `Webhook "${webhook.name}" executed — ${results.length} action${results.length !== 1 ? 's' : ''} completed`,
      metadata: { webhook_id: webhook.id, results },
    })

    return NextResponse.json({ success: true, results })

  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
