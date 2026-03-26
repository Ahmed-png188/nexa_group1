export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'


const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const workspaceId = request.nextUrl.searchParams.get('workspace_id')
  if (!workspaceId) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })

  try {
    const { data: recentContent } = await service
      .from('content')
      .select('platform, created_at, status')
      .eq('workspace_id', workspaceId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(30)

    if (!recentContent || recentContent.length < 3) {
      return NextResponse.json({ message: 'Not enough data yet — need at least 3 published posts' })
    }

    const timingData = recentContent.map((c: any) => {
      const d = new Date(c.created_at)
      return {
        platform: c.platform,
        day: d.toLocaleDateString('en-US', { weekday: 'long' }),
        hour: d.getHours(),
      }
    })

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Based on this posting history, recommend 3 optimal posting times.
Data: ${JSON.stringify(timingData)}
Return JSON only: {"best_times": ["9am Monday", "7pm Wednesday", "12pm Friday"], "reasoning": "one sentence"}`,
      }],
    })

    const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '{}'
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())

    if (parsed.best_times) {
      await service.from('workspaces').update({
        optimal_posting_times: parsed.best_times,
      }).eq('id', workspaceId)
    }

    const { data: agent } = await service.from('agents').select('id').eq('workspace_id', workspaceId).eq('type', 'timing').single()
    if (agent) {
      await service.from('agent_runs').insert({
        agent_id: agent.id,
        workspace_id: workspaceId,
        status: 'success',
        result: parsed,
        ran_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ success: true, best_times: parsed.best_times, reasoning: parsed.reasoning })
  } catch (error) {
    console.error('[Timing Agent]', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Agent failed' }, { status: 500 })
  }
}
