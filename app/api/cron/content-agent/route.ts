import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function GET(request: NextRequest) {
  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const workspaceId = request.nextUrl.searchParams.get('workspace_id')
  if (!workspaceId) {
    return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })
  }

  try {
    const { data: workspace } = await service
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single()

    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const today = new Date()
    const { data: strategy } = await service
      .from('strategy_plans')
      .select('content_calendar')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const calendar = strategy?.content_calendar as any[]
    const todayEntry = calendar?.find((day: any) => {
      const dayDate = new Date(day.date)
      return dayDate.toDateString() === today.toDateString()
    })

    const angle = todayEntry?.angle || todayEntry?.topic || `Share a valuable insight about ${workspace.niche || 'your industry'}`
    const platform = todayEntry?.platform || 'linkedin'
    const segment = workspace.segment || 'business'
    const brandProfile = workspace.brand_profile || {}
    const brandVoice = brandProfile.brand_voice || 'Professional and direct'

    const SEGMENT_CONTEXT: Record<string, string> = {
      creator:    'Focus on storytelling, personal brand, audience growth, virality.',
      freelancer: 'Focus on expertise, client attraction, positioning, case studies.',
      business:   'Focus on customer value, trust building, conversion, revenue.',
      agency:     'Focus on results delivered, thought leadership, client success.',
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: `You are the content writer for ${workspace.brand_name || workspace.name}.
Voice: ${brandVoice}
${SEGMENT_CONTEXT[segment] || ''}
Write authentic, specific content. Never generic.`,
      messages: [{
        role: 'user',
        content: `Write a ${platform} post about: ${angle}

Requirements:
- Sound exactly like the brand voice
- Platform limits: X=280 chars, LinkedIn=3000, Instagram=2200
- No generic hashtags
- End with a question or CTA
- Return ONLY the post content`,
      }],
    })

    const content = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    if (!content) return NextResponse.json({ error: 'Generation failed' }, { status: 500 })

    const { data: savedContent } = await service.from('content').insert({
      workspace_id: workspaceId,
      content,
      platform,
      format: 'post',
      status: 'draft',
      source: 'content_agent',
      created_at: new Date().toISOString(),
    }).select().single()

    const { data: agent } = await service
      .from('agents')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('type', 'content')
      .single()

    if (agent) {
      await service.from('agent_runs').insert({
        agent_id: agent.id,
        workspace_id: workspaceId,
        status: 'success',
        result: { content_id: savedContent?.id, platform, angle },
        ran_at: new Date().toISOString(),
      })
    }

    // Fire notification
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.INTERNAL_API_SECRET || '' },
        body: JSON.stringify({ workspace_id: workspaceId, type: 'content', message: `Content agent created a draft for ${platform}`, link: '/dashboard/studio' }),
      })
    } catch {}

    return NextResponse.json({
      success: true,
      content: savedContent,
      message: `Draft created for ${platform}: "${angle}"`,
    })
  } catch (error) {
    console.error('[Content Agent]', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Agent failed' }, { status: 500 })
  }
}
