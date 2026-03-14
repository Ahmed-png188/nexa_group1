import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY ?? 're_placeholder')
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const {
      workspace_id,
      sequence_id,
      to_emails,       // array of { email, name } objects
      step_number,
      subject,
      body,
      from_name,
      from_email,
    } = await request.json()

    // Check credits (15 per 100 sends)
    const batchSize = to_emails.length
    const creditCost = Math.ceil(batchSize / 100) * 15

    const { data: deducted } = await supabase.rpc('deduct_credits', {
      p_workspace_id: workspace_id,
      p_amount: creditCost,
      p_action: 'email_sequence',
      p_user_id: user.id,
      p_description: `Email sequence step ${step_number} — ${batchSize} recipients`,
    })

    if (!deducted) {
      return NextResponse.json({
        error: 'Insufficient credits',
        message: `Sending to ${batchSize} recipients costs ${creditCost} credits.`,
      }, { status: 402 })
    }

    const results = []
    let sent = 0
    let failed = 0

    // Send in batches of 50
    for (let i = 0; i < to_emails.length; i += 50) {
      const batch = to_emails.slice(i, i + 50)

      for (const recipient of batch) {
        try {
          // Personalize the email
          const personalizedBody = body
            .replace(/\{\{name\}\}/g, recipient.name ?? 'there')
            .replace(/\{\{email\}\}/g, recipient.email)

          const { data, error } = await resend.emails.send({
            from: `${from_name ?? 'Nexa'} <${from_email ?? process.env.RESEND_FROM_EMAIL ?? 'hello@nexaa.cc'}>`,
            to: recipient.email,
            subject,
            text: personalizedBody,
            html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a; line-height: 1.6;">
              ${personalizedBody.split('\n\n').map((p: string) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('')}
              <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
              <p style="font-size: 12px; color: #999;">You're receiving this because you opted in. <a href="#" style="color: #999;">Unsubscribe</a></p>
            </div>`,
            tags: [
              { name: 'workspace_id', value: workspace_id },
              { name: 'sequence_id', value: sequence_id ?? 'manual' },
              { name: 'step', value: step_number?.toString() ?? '1' },
            ],
          })

          if (error) { failed++; } else { sent++; results.push({ email: recipient.email, id: data?.id }) }

        } catch {
          failed++
        }
      }

      // Small delay between batches
      if (i + 50 < to_emails.length) {
        await new Promise(r => setTimeout(r, 500))
      }
    }

    // Update sequence stats
    if (sequence_id) {
      const { data: seq } = await supabase
        .from('email_sequences').select('emails_sent').eq('id', sequence_id).single()

      await supabase.from('email_sequences').update({
        emails_sent: (seq?.emails_sent ?? 0) + sent,
        status: 'active',
      }).eq('id', sequence_id)
    }

    await supabase.from('activity').insert({
      workspace_id,
      user_id: user.id,
      type: 'emails_sent',
      title: `${sent} emails sent — step ${step_number ?? 1}`,
      metadata: { sent, failed, sequence_id, credits_used: creditCost },
    })

    return NextResponse.json({ success: true, sent, failed, credits_used: creditCost })

  } catch (error: any) {
    console.error('Send email error:', error)
    return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 })
  }
}
