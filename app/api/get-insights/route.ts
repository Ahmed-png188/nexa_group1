import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { guardWorkspace } from '@/lib/workspace-guard'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const workspace_id = searchParams.get('workspace_id')
    const period = searchParams.get('period') ?? '30' // days

    if (!workspace_id) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })
    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - parseInt(period))

    // Content performance
    const { data: content } = await supabase
      .from('content')
      .select('*')
      .eq('workspace_id', workspace_id)
      .gte('created_at', daysAgo.toISOString())
      .order('created_at', { ascending: false })

    // Email sequences
    const { data: sequences } = await supabase
      .from('email_sequences')
      .select('*')
      .eq('workspace_id', workspace_id)

    // Activity
    const { data: activity } = await supabase
      .from('activity')
      .select('*')
      .eq('workspace_id', workspace_id)
      .gte('created_at', daysAgo.toISOString())
      .order('created_at', { ascending: false })

    // Credits used
    const { data: transactions } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('workspace_id', workspace_id)
      .gte('created_at', daysAgo.toISOString())

    // Compute aggregates
    const totalContent = content?.length ?? 0
    const publishedContent = content?.filter(c => c.status === 'published') ?? []
    const scheduledContent = content?.filter(c => c.status === 'scheduled') ?? []

    const totalReach = publishedContent.reduce((sum, c) => sum + (c.reach ?? 0), 0)
    const totalEngagements = publishedContent.reduce((sum, c) => sum + (c.likes ?? 0) + (c.comments ?? 0) + (c.shares ?? 0), 0)
    const totalImpressions = publishedContent.reduce((sum, c) => sum + (c.impressions ?? 0), 0)

    const platformBreakdown = publishedContent.reduce((acc: any, c) => {
      if (!acc[c.platform]) acc[c.platform] = { count: 0, reach: 0, engagements: 0 }
      acc[c.platform].count++
      acc[c.platform].reach += c.reach ?? 0
      acc[c.platform].engagements += (c.likes ?? 0) + (c.comments ?? 0) + (c.shares ?? 0)
      return acc
    }, {})

    const contentTypeBreakdown = content?.reduce((acc: any, c) => {
      if (!acc[c.type]) acc[c.type] = 0
      acc[c.type]++
      return acc
    }, {}) ?? {}

    const emailStats = {
      total_sequences: sequences?.length ?? 0,
      active_sequences: sequences?.filter(s => s.status === 'active').length ?? 0,
      total_sent: sequences?.reduce((sum, s) => sum + (s.emails_sent ?? 0), 0) ?? 0,
      total_opened: sequences?.reduce((sum, s) => sum + (s.emails_opened ?? 0), 0) ?? 0,
      avg_open_rate: sequences && sequences.length > 0
        ? Math.round((sequences.reduce((sum, s) => sum + (s.emails_opened ?? 0), 0) /
            Math.max(sequences.reduce((sum, s) => sum + (s.emails_sent ?? 0), 0), 1)) * 100)
        : 0,
    }

    const creditsUsed = Math.abs(
      transactions?.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0) ?? 0
    )

    // Chart data — daily content creation for the period
    const chartData = []
    for (let i = parseInt(period) - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayContent = content?.filter(c => c.created_at.startsWith(dateStr)) ?? []
      chartData.push({
        date: dateStr,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        content: dayContent.length,
        published: dayContent.filter(c => c.status === 'published').length,
      })
    }

    // Top performing content
    const topContent = publishedContent
      .sort((a, b) => ((b.likes ?? 0) + (b.comments ?? 0) + (b.shares ?? 0)) - ((a.likes ?? 0) + (a.comments ?? 0) + (a.shares ?? 0)))
      .slice(0, 5)

    return NextResponse.json({
      overview: {
        total_content: totalContent,
        published: publishedContent.length,
        scheduled: scheduledContent.length,
        total_reach: totalReach,
        total_engagements: totalEngagements,
        total_impressions: totalImpressions,
        credits_used: creditsUsed,
        period_days: parseInt(period),
      },
      platform_breakdown: platformBreakdown,
      content_type_breakdown: contentTypeBreakdown,
      email_stats: emailStats,
      chart_data: chartData,
      top_content: topContent,
      recent_activity: activity?.slice(0, 10) ?? [],
    })

  } catch (error: unknown) {
    console.error('Get insights error:', error)
    return NextResponse.json({ error: 'Failed to get insights' }, { status: 500 })
  }
}
