import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { getBrandContext } from '@/lib/brand-context'
import { guardWorkspace } from '@/lib/workspace-guard'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Called by Vercel Cron every Sunday at midnight
// Reads top performing content, extracts what worked, feeds back into Brand Brain
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()
  const results: any[] = []

  // Get all active workspaces
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, name, brand_name, brand_voice, brand_audience')
    .eq('plan_status', 'active')
    .limit(100)

  for (const ws of workspaces || []) {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()

      // Get all published content in last 30 days with engagement
      const { data: content } = await supabase
        .from('content')
        .select('id, type, platform, body, likes, comments, shares, impressions, reach, clicks, created_at, angle_tag')
        .eq('workspace_id', ws.id)
        .eq('status', 'published')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false })

      if (!content || content.length < 3) continue

      // Calculate engagement score for each piece
      const scored = content.map(c => ({
        ...c,
        engagementScore: (c.likes || 0) * 1 + (c.comments || 0) * 3 + (c.shares || 0) * 5 + (c.clicks || 0) * 2,
      })).sort((a, b) => b.engagementScore - a.engagementScore)

      const topPerformers = scored.slice(0, Math.min(5, Math.ceil(scored.length * 0.3)))
      const lowPerformers = scored.slice(-Math.min(3, Math.floor(scored.length * 0.3)))
      const avgScore = scored.reduce((s, c) => s + c.engagementScore, 0) / scored.length

      // Update performance scores in content table
      for (const c of scored) {
        const perfScore = avgScore > 0 ? Math.round((c.engagementScore / avgScore) * 50 + 50) : 50
        await supabase.from('content').update({ performance_score: Math.min(100, perfScore) }).eq('id', c.id)
      }

      // Only run AI analysis if we have meaningful engagement data
      const hasRealEngagement = topPerformers.some(c => c.engagementScore > 0)

      if (hasRealEngagement && topPerformers.length >= 2) {
        const brand = await getBrandContext(ws.id)

        const prompt = `You are a brand analyst. Analyze this brand's content performance and extract actionable insights that will improve future content.

## Brand
${brand?.copyContext || `Name: ${ws.brand_name}, Voice: ${ws.brand_voice}`}

## Top Performing Content (highest engagement)
${topPerformers.map((c, i) => `
Post ${i + 1} [Score: ${c.engagementScore}] [${c.platform}/${c.type}]:
"${c.body?.slice(0, 300)}"
Likes: ${c.likes}, Comments: ${c.comments}, Shares: ${c.shares}
`).join('\n')}

## Underperforming Content (lowest engagement)
${lowPerformers.map((c, i) => `
Post ${i + 1} [Score: ${c.engagementScore}] [${c.platform}/${c.type}]:
"${c.body?.slice(0, 200)}"
`).join('\n')}

Analyze patterns and return ONLY valid JSON:
{
  "top_angle": "The single most effective content angle this brand uses (5 words max)",
  "winning_patterns": [
    "Specific pattern observed in top performers (e.g. 'Opens with a counterintuitive claim')",
    "Second pattern",
    "Third pattern"
  ],
  "losing_patterns": [
    "What the low performers have in common"
  ],
  "voice_observations": "What the top content reveals about their authentic voice",
  "best_platform": "Which platform performed best",
  "best_format": "Which content type performed best",
  "recommended_angle_next_week": "Specific angle to lean into next week based on what worked",
  "avoid_next_week": "What to avoid based on what didn't work",
  "voice_match_avg": 78
}`

        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        })

        const text = (response.content[0] as any).text
        let analysis: any = {}
        try {
          const match = text.match(/\{[\s\S]*\}/)
          if (match) analysis = JSON.parse(match[0])
        } catch {}

        // Write insights back to brand_learnings
        const learnings = []

        if (analysis.winning_patterns?.length) {
          for (const pattern of analysis.winning_patterns) {
            learnings.push({
              workspace_id: ws.id,
              source: 'performance_analysis',
              source_name: 'Weekly Performance Review',
              insight_type: 'content',
              insight: `✓ What works: ${pattern}`,
              confidence: 0.9,
            })
          }
        }

        if (analysis.losing_patterns?.length) {
          learnings.push({
            workspace_id: ws.id,
            source: 'performance_analysis',
            source_name: 'Weekly Performance Review',
            insight_type: 'content',
            insight: `✗ What to avoid: ${analysis.losing_patterns[0]}`,
            confidence: 0.85,
          })
        }

        if (analysis.voice_observations) {
          learnings.push({
            workspace_id: ws.id,
            source: 'performance_analysis',
            source_name: 'Weekly Performance Review',
            insight_type: 'voice',
            insight: analysis.voice_observations,
            confidence: 0.88,
          })
        }

        if (analysis.recommended_angle_next_week) {
          learnings.push({
            workspace_id: ws.id,
            source: 'performance_analysis',
            source_name: 'Weekly Performance Review',
            insight_type: 'strategy',
            insight: `Next week angle: ${analysis.recommended_angle_next_week}`,
            confidence: 0.92,
          })
        }

        if (learnings.length > 0) {
          await supabase.from('brand_learnings').insert(learnings)
        }

        // Update workspace top_angle and avg voice score
        await supabase.from('workspaces').update({
          top_angle: analysis.top_angle || null,
          voice_score_avg: analysis.voice_match_avg || 0,
        }).eq('id', ws.id)

        results.push({ workspace: ws.id, learnings: learnings.length, top_angle: analysis.top_angle })
      }

      // Update streak regardless
      await updateStreak(ws.id, supabase)

    } catch (err: any) {
      results.push({ workspace: ws.id, error: err.message })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}

async function updateStreak(workspaceId: string, supabase: any) {
  // Get all published dates in last 60 days
  const { data: posts } = await supabase
    .from('content')
    .select('published_at')
    .eq('workspace_id', workspaceId)
    .eq('status', 'published')
    .gte('published_at', new Date(Date.now() - 60 * 86400000).toISOString())
    .order('published_at', { ascending: false })

  if (!posts?.length) return

  // Get unique posting days
  const days = (Array.from(new Set(posts.map((p: any) =>
    new Date(p.published_at).toISOString().split('T')[0]
  ))) as string[]).sort().reverse()

  // Calculate current streak (consecutive days from most recent)
  let streak = 0
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  // Streak starts only if posted today or yesterday
  if (days[0] !== today && days[0] !== yesterday) {
    streak = 0
  } else {
    streak = 1
    for (let i = 1; i < days.length; i++) {
      const prev = new Date(days[i - 1])
      const curr = new Date(days[i])
      const diff = (prev.getTime() - curr.getTime()) / 86400000
      if (diff <= 1.5) { streak++ } else { break }
    }
  }

  const { data: ws } = await supabase
    .from('workspaces').select('longest_streak').eq('id', workspaceId).single()

  await supabase.from('workspaces').update({
    posting_streak: streak,
    longest_streak: Math.max(streak, ws?.longest_streak || 0),
    last_posted_date: days[0] || null,
  }).eq('id', workspaceId)
}

// Also expose POST so it can be called manually
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workspace_id } = await request.json()

  const deny = await guardWorkspace(supabase, workspace_id, user.id)
  if (deny) return deny

  await updateStreak(workspace_id, supabase)

  return NextResponse.json({ success: true })
}
