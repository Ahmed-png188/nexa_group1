import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

// Called by Vercel Cron daily — processes active email sequences

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY ?? 're_placeholder')

  try {
    const supabase = createClient()
    const now = new Date()

    const { data: sequences } = await supabase
      .from('email_sequences')
      .select('*')
      .eq('status', 'active')

    if (!sequences || sequences.length === 0) {
      return NextResponse.json({ processed: 0, message: 'No active sequences' })
    }

    const results = []

    for (const seq of sequences) {
      try {
        const steps: any[] = seq.steps || []
        const enrolledAt = new Date(seq.created_at)
        let updatedSteps = [...steps]
        let totalSent = 0

        for (let i = 0; i < steps.length; i++) {
          const step = steps[i]
          // Skip if already sent
          if (step.status === 'sent') continue

          const stepFireDate = new Date(enrolledAt)
          stepFireDate.setDate(stepFireDate.getDate() + (step.delay_days || 0))

          const hoursSinceFire = (now.getTime() - stepFireDate.getTime()) / (1000 * 60 * 60)
          if (hoursSinceFire < 0 || hoursSinceFire >= 24) continue

          // Get active contacts for this sequence
          const { data: contacts } = await supabase
            .from('sequence_contacts')
            .select('email, name')
            .eq('sequence_id', seq.id)
            .eq('status', 'active')

          if (!contacts || contacts.length === 0) continue

          let sent = 0
          let failed = 0

          for (const recipient of contacts) {
            try {
              const personalizedBody = (step.body || '')
                .replace(/\{\{name\}\}/g, recipient.name ?? 'there')
                .replace(/\{\{email\}\}/g, recipient.email)

              const unsubUrl = `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?token=${seq.id}`

              const { error } = await resend.emails.send({
                from: `${seq.from_name ?? 'Nexa'} <${process.env.RESEND_FROM_EMAIL ?? 'hello@nexaa.cc'}>`,
                to: recipient.email,
                subject: step.subject || '(no subject)',
                text: personalizedBody,
                html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#1a1a1a;line-height:1.6;">
                  ${personalizedBody.split('\n\n').map((p: string) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('')}
                  <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
                  <p style="font-size:12px;color:#999;">You're receiving this because you opted in. <a href="${unsubUrl}" style="color:#999;">Unsubscribe</a></p>
                </div>`,
                tags: [
                  { name: 'workspace_id', value: seq.workspace_id },
                  { name: 'sequence_id', value: seq.id },
                  { name: 'step', value: (step.step_number ?? i + 1).toString() },
                ],
              })

              if (error) { failed++ } else { sent++ }
            } catch { failed++ }
          }

          // Mark step as sent
          updatedSteps[i] = { ...step, status: 'sent', sent_at: now.toISOString(), sent_count: sent }
          totalSent += sent
          results.push({ sequence: seq.name, step: step.step_number ?? i + 1, sent, failed })
        }

        // Persist updated steps + emails_sent counter
        if (totalSent > 0) {
          await supabase.from('email_sequences').update({
            steps: updatedSteps,
            emails_sent: (seq.emails_sent ?? 0) + totalSent,
          }).eq('id', seq.id)
        }

      } catch (seqErr: any) {
        results.push({ sequence: seq.name, error: seqErr.message })
      }
    }

    return NextResponse.json({ processed: results.length, results })

  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
