export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

import { Resend } from 'resend'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function GET(request: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY!)
  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const workspaceId = request.nextUrl.searchParams.get('workspace_id')
  if (!workspaceId) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })

  try {
    const { data: workspace } = await service
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single()

    if (!workspace) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [contentRes, emailsRes] = await Promise.all([
      service.from('content').select('id, platform, status').eq('workspace_id', workspaceId).gte('created_at', oneWeekAgo),
      service.from('emails_sent').select('id, opened_count, status').eq('workspace_id', workspaceId).gte('sent_at', oneWeekAgo),
    ])

    const contentCreated = contentRes.data?.length || 0
    const emailsSent = emailsRes.data?.length || 0
    const emailsOpened = emailsRes.data?.filter((e: any) => (e.opened_count || 0) > 0).length || 0
    const openRate = emailsSent > 0 ? Math.round((emailsOpened / emailsSent) * 100) : 0

    const insightMsg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Weekly performance insight for ${workspace.brand_name || workspace.name}.
This week: ${contentCreated} content pieces, ${emailsSent} emails sent, ${openRate}% open rate.
Write 2-3 sharp sentences: what went well, what to improve, one action to take.
Be specific. Sound like a smart advisor. Return only the insight text.`,
      }],
    })

    const insight = insightMsg.content[0].type === 'text' ? insightMsg.content[0].text.trim() : ''

    const { data: authUser } = await service.auth.admin.getUserById(workspace.owner_id || '')
    const userEmail = authUser?.user?.email
    if (!userEmail) return NextResponse.json({ error: 'No user email' }, { status: 400 })

    const firstName = authUser?.user?.user_metadata?.full_name?.split(' ')[0] || 'there'

    await resend.emails.send({
      from: 'Nexa <hello@nexaa.cc>',
      to: userEmail,
      subject: `Your week in review — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      html: `<div style="background:#000;color:#fff;font-family:sans-serif;padding:40px;max-width:560px;margin:0 auto">
        <div style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:24px">Weekly digest · Nexa</div>
        <h1 style="font-size:26px;font-weight:800;letter-spacing:-0.03em;color:#fff;margin-bottom:24px">Your week, ${firstName}.</h1>
        <div style="display:flex;gap:12px;margin-bottom:28px">
          <div style="flex:1;background:#0A0A0A;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:16px;text-align:center">
            <div style="font-size:28px;font-weight:300;color:#fff">${contentCreated}</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:4px;text-transform:uppercase;letter-spacing:0.08em">Created</div>
          </div>
          <div style="flex:1;background:#0A0A0A;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:16px;text-align:center">
            <div style="font-size:28px;font-weight:300;color:#fff">${emailsSent}</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:4px;text-transform:uppercase;letter-spacing:0.08em">Emails sent</div>
          </div>
          <div style="flex:1;background:#0A0A0A;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:16px;text-align:center">
            <div style="font-size:28px;font-weight:300;color:#4DABF7">${openRate}%</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:4px;text-transform:uppercase;letter-spacing:0.08em">Open rate</div>
          </div>
        </div>
        <div style="background:#0A0A0A;border:1px solid rgba(30,142,240,0.15);border-radius:12px;padding:20px;margin-bottom:24px">
          <div style="font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#4DABF7;margin-bottom:10px">Nexa insight</div>
          <p style="font-size:15px;color:rgba(255,255,255,0.75);line-height:1.75;margin:0">${insight}</p>
        </div>
        <a href="https://nexaa.cc/dashboard" style="display:inline-block;background:#fff;color:#000;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Open Nexa →</a>
      </div>`,
    })

    const { data: agent } = await service.from('agents').select('id').eq('workspace_id', workspaceId).eq('type', 'insights').single()
    if (agent) {
      await service.from('agent_runs').insert({
        agent_id: agent.id,
        workspace_id: workspaceId,
        status: 'success',
        result: { content_created: contentCreated, emails_sent: emailsSent, open_rate: openRate },
        ran_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ success: true, insight, stats: { contentCreated, emailsSent, openRate } })
  } catch (error) {
    console.error('[Insights Agent]', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Agent failed' }, { status: 500 })
  }
}
