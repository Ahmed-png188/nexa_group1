export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabase } from '@supabase/supabase-js'

function getDb() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const TWILIO_SID   = process.env.TWILIO_ACCOUNT_SID!
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN!
const TWILIO_FROM  = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'

async function sendWelcome(to: string, body: string): Promise<boolean> {
  const toWa = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
  const params = new URLSearchParams({ From: TWILIO_FROM, To: toWa, Body: body })
  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    )
    const data = await res.json() as { sid?: string; message?: string }
    console.log('[wa-connect] send status:', res.status, '| sid:', data.sid, '| error:', data.message || 'none')
    return res.status === 201
  } catch (e: any) {
    console.error('[wa-connect] sendWelcome error:', e.message)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb()
    const body = await request.json()
    const { workspace_id, phone_number, lang = 'en' } = body

    if (!workspace_id || !phone_number) {
      return NextResponse.json({ error: 'Missing workspace_id or phone_number' }, { status: 400 })
    }

    // Get workspace brand name
    const { data: ws, error: wsErr } = await db
      .from('workspaces')
      .select('brand_name, name')
      .eq('id', workspace_id)
      .single()

    console.log('[wa-connect] workspace:', ws, 'error:', wsErr?.message)
    if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const brandName = (ws as any).brand_name || (ws as any).name || 'your brand'

    // Get user_id from workspace_members
    const { data: member } = await db
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', workspace_id)
      .limit(1)
      .single()

    const userId = member?.user_id || '00000000-0000-0000-0000-000000000000'

    // Normalize phone to E.164
    let normalized = phone_number.toString().trim().replace(/[\s\-\(\)]/g, '')
    if (!normalized.startsWith('+')) normalized = `+${normalized}`

    console.log('[wa-connect] connecting:', normalized, 'for brand:', brandName, 'lang:', lang)

    // Upsert the connection
    const { error: upsertErr } = await db
      .from('whatsapp_connections')
      .upsert({
        workspace_id,
        user_id:          userId,
        phone_number:     normalized,
        phone_number_raw: phone_number.toString(),
        lang,
        is_active:        true,
        last_active_at:   new Date().toISOString(),
      }, { onConflict: 'phone_number' })

    if (upsertErr) {
      console.error('[wa-connect] upsert error:', upsertErr.message)
      return NextResponse.json({ error: 'Database error: ' + upsertErr.message }, { status: 500 })
    }

    // Build welcome message
    const welcome = lang === 'ar'
      ? `أهلاً وسهلاً! 🎯\n\nأنا Nexa، مساعدك الذكي لـ *${brandName}*\n\nمن الآن تقدر تتحكم بكل شي من هنا:\n\n• "اكتب منشور عن..."\n• "كم رصيدي؟"\n• "ملخص اليوم"\n• "ولّد صورة"\n• "ولّد فيديو"\n• أرسل صورة منتجك 📸\n\nكلّمني وقت ما تبي — أنا شغّال ٢٤/٧ 🚀`
      : `Welcome! 🎯\n\nI'm Nexa, your AI team member for *${brandName}*\n\nYou can control everything from here:\n\n• "Write a post about..."\n• "How many credits?"\n• "Today's brief"\n• "Generate an image"\n• "Generate a video"\n• Send a product photo 📸\n\nMessage me anytime — I'm here 24/7 🚀`

    // Send welcome — log result
    const sent = await sendWelcome(normalized, welcome)
    console.log('[wa-connect] welcome sent:', sent, 'to:', normalized)

    return NextResponse.json({
      success: true,
      phone: normalized,
      brand: brandName,
      lang,
      welcome_sent: sent,
    })

  } catch (err: any) {
    console.error('[wa-connect] fatal error:', err.message)
    return NextResponse.json({ error: 'Connection failed: ' + err.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = getDb()
    const { workspace_id } = await request.json()
    if (!workspace_id) {
      return NextResponse.json({ error: 'Missing workspace_id' }, { status: 400 })
    }
    await db
      .from('whatsapp_connections')
      .update({ is_active: false })
      .eq('workspace_id', workspace_id)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[wa-connect] delete error:', err.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
