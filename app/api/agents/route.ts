import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { getBrandContext } from '@/lib/brand-context'
import { guardWorkspace } from '@/lib/workspace-guard'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, agent_type } = await request.json()

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    const brand = await getBrandContext(workspace_id)
    if (!brand) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const { data: strategy } = await supabase.from('strategy_plans').select('*').eq('workspace_id', workspace_id).eq('status','active').order('generated_at',{ascending:false}).limit(1).single()
    const { data: recentContent } = await supabase.from('content')
      .select('type, body, platform, created_at, metadata')
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false })
      .limit(10)

    let result: any = {}

    if (agent_type === 'content') {
      // Content Agent — generates a full week of posts
      const prompt = `You are the Content Agent for ${brand.brandName}. Generate a complete 7-day content calendar with ready-to-publish posts.

${brand.copyContext}

Recent content (for variety): ${recentContent?.map(c => c.body?.slice(0, 100)).filter(Boolean).slice(0, 3).join(' | ')}

Strategy pillars: ${strategy?.pillars ? JSON.stringify(strategy.pillars) : 'Not defined — use general brand content'}

Generate 7 posts — one per day — for Instagram. Each post should:
- Be completely different in angle and format
- Use the brand voice perfectly
- Have a strong hook in the first line
- Include 2-3 relevant hashtags
- Be ready to copy-paste and publish

Return ONLY a JSON array:
[
  {
    "day": "Monday",
    "platform": "instagram",
    "theme": "one-word theme",
    "hook": "first line only",
    "body": "full post body",
    "hashtags": ["#tag1", "#tag2", "#tag3"]
  }
]`

      const response = await anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      })

      const text = (response.content[0] as any).text
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        result.posts = jsonMatch ? JSON.parse(jsonMatch[0]) : []
      } catch {
        result.posts = []
        result.raw = text
      }

      // Save generated posts to content table
      if (result.posts?.length > 0) {
        const inserts = result.posts.map((post: any) => ({
          workspace_id,
          created_by: user.id,
          type: 'post',
          platform: post.platform || 'instagram',
          status: 'draft',
          body: `${post.body}\n\n${post.hashtags?.join(' ') || ''}`,
          prompt: `Agent generated: ${post.theme}`,
          credits_used: 0,
          ai_model: 'claude-content-agent',
          metadata: { agent: 'content', day: post.day, theme: post.theme, hook: post.hook },
        }))
        await supabase.from('content').insert(inserts)
      }

      result.agent = 'content'
      result.message = `Generated ${result.posts?.length || 0} posts for your content calendar`

    } else if (agent_type === 'timing') {
      // Timing Agent — analyzes and recommends posting times
      const prompt = `You are the Timing Agent for ${brand.brandName}. Analyze their content and audience to recommend the optimal posting schedule.

${brand.copyContext}

Audience: ${brand.profile?.audience?.primary || brand.workspace?.brand_audience || 'Not defined'}
Platforms: Instagram, LinkedIn, X, TikTok

Based on the brand's audience psychology and content style, provide specific posting time recommendations.

Return ONLY JSON:
{
  "instagram": {
    "best_days": ["Tuesday", "Thursday", "Friday"],
    "best_times": ["7:00 AM", "12:00 PM", "7:00 PM"],
    "rationale": "why these times work for this audience",
    "frequency": "how many times per week"
  },
  "linkedin": { ... },
  "x": { ... },
  "tiktok": { ... },
  "weekly_schedule": [
    { "day": "Monday", "platform": "instagram", "time": "7:00 AM", "content_type": "motivational" },
    ...
  ]
}`

      const response = await anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      })

      const text = (response.content[0] as any).text
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        result.schedule = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
      } catch {
        result.schedule = {}
        result.raw = text
      }
      result.agent = 'timing'
      result.message = 'Optimal posting schedule generated for your audience'

    } else if (agent_type === 'engagement') {
      // Engagement Agent — drafts replies to comments
      let comments: any[] = []
try { const body = await request.json(); comments = body.comments ?? [] } catch {}

      const prompt = `You are the Engagement Agent for ${brand.brandName}. Draft authentic, brand-aligned replies to these comments/DMs.

${brand.copyContext}

${comments?.length > 0 ? `Comments to reply to:\n${comments.map((c: any, i: number) => `${i+1}. "${c.text}" — on post: "${c.post_preview}"`).join('\n')}` : 'Draft 3 example engagement replies for typical comments on this brand\'s content.'}

Write replies that:
- Sound like a real human, not a brand robot
- Match the brand voice exactly
- Build genuine connection
- Sometimes ask a follow-up question
- Are concise (1-3 sentences max)

Return ONLY JSON:
[
  {
    "comment": "original comment text",
    "reply": "your reply",
    "tone": "warm/playful/professional"
  }
]`

      const response = await anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      })

      const text = (response.content[0] as any).text
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        result.replies = jsonMatch ? JSON.parse(jsonMatch[0]) : []
      } catch {
        result.replies = []
        result.raw = text
      }
      result.agent = 'engagement'
      result.message = `Drafted ${result.replies?.length || 0} engagement replies`

    } else if (agent_type === 'insights') {
      // Insights Agent — weekly performance summary
      const { data: weekContent } = await supabase.from('content')
        .select('*')
        .eq('workspace_id', workspace_id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      const prompt = `You are the Insights Agent for ${brand.brandName}. Analyze their content activity and provide strategic recommendations.

${brand.copyContext}

This week's content (${weekContent?.length || 0} pieces created):
${weekContent?.map(c => `- ${c.type} for ${c.platform}: "${c.body?.slice(0, 80)}..."`).join('\n') || 'No content this week'}

Provide:
1. What's working (patterns in content that tends to perform)
2. Gaps in their content strategy
3. 3 specific recommendations for next week
4. One big opportunity they're missing

Return ONLY JSON:
{
  "summary": "2-3 sentence overview",
  "whats_working": ["insight 1", "insight 2"],
  "gaps": ["gap 1", "gap 2"],
  "recommendations": [
    { "action": "specific thing to do", "why": "reason", "impact": "high/medium/low" }
  ],
  "big_opportunity": "the one thing they should focus on"
}`

      const response = await anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      })

      const text = (response.content[0] as any).text
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        result.insights = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
      } catch {
        result.insights = {}
        result.raw = text
      }
      result.agent = 'insights'
      result.message = 'Weekly insights report generated'
    }

    // Log activity
    await supabase.from('activity').insert({
      workspace_id,
      user_id: user.id,
      type: 'agent_run',
      title: `${agent_type.charAt(0).toUpperCase() + agent_type.slice(1)} Agent completed — ${result.message}`,
      metadata: { agent_type, result_summary: result.message },
    })

    // Also write to agent_runs so home page counter works
    try {
      await supabase.from('agent_runs').insert({
        workspace_id,
        agent_type,
        status: 'completed',
        result: { message: result.message, summary: result.posts?.length || result.replies?.length || 0 },
        created_at: new Date().toISOString(),
      })
    } catch {}

    return NextResponse.json({ success: true, ...result })

  } catch (error: any) {
    console.error('Agent error:', error)
    return NextResponse.json({ error: 'Agent failed', details: error.message }, { status: 500 })
  }
}
