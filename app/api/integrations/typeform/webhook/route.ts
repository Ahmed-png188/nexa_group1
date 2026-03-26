export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'


export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Typeform sends: form_response.answers + form_response.definition.fields
    const response = body?.form_response
    if (!response) {
      return NextResponse.json({ error: 'Invalid Typeform payload' }, { status: 400 })
    }

    // workspace_id passed as query param or hidden field
    const workspaceId = request.nextUrl.searchParams.get('workspace_id')
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspace_id' }, { status: 400 })
    }

    const fields: any[] = response.definition?.fields || []
    const answers: any[] = response.answers || []

    // Map field refs to values
    const fieldMap: Record<string, { label: string; value: string }> = {}
    for (const answer of answers) {
      const field = fields.find((f: any) => f.id === answer.field?.id)
      if (!field) continue
      const label = field.title?.toLowerCase() || ''
      let value = ''
      if (answer.type === 'text' || answer.type === 'short_text' || answer.type === 'long_text') {
        value = answer.text || answer.short_text || answer.long_text || ''
      } else if (answer.type === 'email') {
        value = answer.email || ''
      } else if (answer.type === 'choice') {
        value = answer.choice?.label || ''
      } else if (answer.type === 'choices') {
        value = answer.choices?.labels?.join(', ') || ''
      } else if (answer.type === 'phone_number') {
        value = answer.phone_number || ''
      } else {
        value = String(answer[answer.type] ?? '')
      }
      fieldMap[field.id] = { label, value }
    }

    // Extract email and name from answers
    let email = ''
    let firstName = ''
    let lastName = ''
    let notes = ''

    for (const { label, value } of Object.values(fieldMap)) {
      if (!email && (label.includes('email') || label.includes('e-mail'))) email = value
      if (!firstName && (label.includes('first') || label === 'name' || label.includes('your name'))) firstName = value
      if (!lastName && label.includes('last')) lastName = value
    }

    // Collect remaining answers as notes
    notes = Object.values(fieldMap)
      .filter(({ label }) => !label.includes('email') && !label.includes('first') && !label.includes('last') && label !== 'name')
      .map(({ label, value }) => `${label}: ${value}`)
      .join('\n')

    if (!email) {
      return NextResponse.json({ error: 'No email found in submission' }, { status: 400 })
    }

    const service = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Validate workspace exists to prevent data injection into arbitrary workspace IDs
    const { data: workspace } = await service
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId)
      .single()
    if (!workspace) {
      return NextResponse.json({ error: 'Invalid workspace' }, { status: 400 })
    }

    const name = `${firstName} ${lastName}`.trim() || email.split('@')[0]

    const { error } = await service.from('contacts').upsert({
      workspace_id: workspaceId,
      email: email.toLowerCase().trim(),
      name,
      first_name: firstName,
      last_name: lastName,
      source: 'typeform',
      tags: ['typeform'],
      notes: notes || null,
    }, { onConflict: 'workspace_id,email' })

    if (error) {
      console.error('[typeform/webhook] Upsert error:', error.message)
      return NextResponse.json({ error: 'Failed to save contact' }, { status: 500 })
    }

    // Log activity
    try {
      await service.from('activity').insert({
        workspace_id: workspaceId,
        type: 'lead_captured',
        title: `New Typeform submission: ${name}`,
      })
    } catch {}

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('[typeform/webhook] Error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
