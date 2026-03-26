export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'


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
  if (!workspaceId) {
    return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })
  }

  const now = new Date().toISOString()

  const { data: enrollments } = await service
    .from('sequence_enrollments')
    .select(`
      *,
      contacts(*),
      email_sequences!inner(*, workspace_id)
    `)
    .eq('email_sequences.workspace_id', workspaceId)
    .eq('status', 'active')
    .lte('next_send_at', now)
    .limit(50)

  if (!enrollments || enrollments.length === 0) {
    return NextResponse.json({ processed: 0, message: 'No emails due right now' })
  }

  const { data: emailAccount } = await service
    .from('email_accounts')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('provider', 'gmail')
    .single()

  if (!emailAccount) {
    return NextResponse.json({ error: 'No Gmail account connected' }, { status: 400 })
  }

  let processed = 0

  for (const enrollment of enrollments) {
    try {
      const contact = enrollment.contacts
      const sequence = enrollment.email_sequences
      if (!contact || !sequence) continue

      const { data: steps } = await service
        .from('sequence_steps')
        .select('*')
        .eq('sequence_id', sequence.id)
        .order('step_number', { ascending: true })

      if (!steps || steps.length === 0) continue

      const currentStep = steps.find((s: any) => s.step_number === enrollment.current_step)
      if (!currentStep) {
        await service.from('sequence_enrollments').update({ status: 'completed' }).eq('id', enrollment.id)
        continue
      }

      // Handle condition step
      if (currentStep.step_type === 'condition') {
        const { data: lastEmail } = await service
          .from('emails_sent')
          .select('status, opened_count')
          .eq('contact_id', contact.id)
          .eq('sequence_id', sequence.id)
          .order('sent_at', { ascending: false })
          .limit(1)
          .single()

        const condition = currentStep.condition
        let stop = false
        if (condition === 'replied' && lastEmail?.status === 'replied') stop = true

        if (stop) {
          await service.from('sequence_enrollments').update({ status: 'stopped' }).eq('id', enrollment.id)
          continue
        }

        const nextStep = steps.find((s: any) => s.step_number === enrollment.current_step + 1)
        if (!nextStep) {
          await service.from('sequence_enrollments').update({ status: 'completed' }).eq('id', enrollment.id)
          continue
        }

        await service.from('sequence_enrollments').update({
          current_step: nextStep.step_number,
          next_send_at: new Date(Date.now() + (nextStep.delay_days || 0) * 86400000).toISOString(),
        }).eq('id', enrollment.id)
        continue
      }

      // Handle wait step
      if (currentStep.step_type === 'wait') {
        const nextStep = steps.find((s: any) => s.step_number === enrollment.current_step + 1)
        if (!nextStep) {
          await service.from('sequence_enrollments').update({ status: 'completed' }).eq('id', enrollment.id)
          continue
        }
        await service.from('sequence_enrollments').update({
          current_step: nextStep.step_number,
          next_send_at: new Date(Date.now() + (currentStep.delay_days || 1) * 86400000).toISOString(),
        }).eq('id', enrollment.id)
        continue
      }

      // Send email step
      const subject = (currentStep.subject || '')
        .replace(/\{\{name\}\}/gi, contact.first_name || contact.name || 'there')

      const body = (currentStep.body || '')
        .replace(/\{\{name\}\}/gi, contact.first_name || contact.name || 'there')
        .replace(/\{\{email\}\}/gi, contact.email)

      const emailLines = [
        `From: "${emailAccount.name}" <${emailAccount.email}>`,
        `To: ${contact.name ? `"${contact.name}" <${contact.email}>` : contact.email}`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/plain; charset=UTF-8`,
        ``,
        body,
      ]

      const encodedEmail = Buffer.from(emailLines.join('\r\n'))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

      const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${emailAccount.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encodedEmail }),
      })

      const sendData = await sendRes.json()

      if (sendData.id) {
        await service.from('emails_sent').insert({
          workspace_id: workspaceId,
          contact_id: contact.id,
          sequence_id: sequence.id,
          sequence_step_id: currentStep.id,
          from_email: emailAccount.email,
          to_email: contact.email,
          subject,
          body,
          message_id: sendData.id,
          thread_id: sendData.threadId,
          status: 'sent',
          sent_at: new Date().toISOString(),
        })

        const nextStep = steps.find((s: any) => s.step_number === enrollment.current_step + 1)
        if (nextStep) {
          await service.from('sequence_enrollments').update({
            current_step: nextStep.step_number,
            next_send_at: new Date(Date.now() + (nextStep.delay_days || 0) * 86400000).toISOString(),
          }).eq('id', enrollment.id)
        } else {
          await service.from('sequence_enrollments').update({ status: 'completed' }).eq('id', enrollment.id)
        }

        processed++
      }
    } catch (error) {
      console.error('[Email Agent]', error instanceof Error ? error.message : 'Unknown')
    }
  }

  return NextResponse.json({ processed, total: enrollments.length, message: `Sent ${processed} emails` })
}
