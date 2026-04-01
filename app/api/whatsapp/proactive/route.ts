export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

function getDb() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const TWILIO_SID   = process.env.TWILIO_ACCOUNT_SID!
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN!
const TWILIO_FROM  = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'

// ── Send text ─────────────────────────────────────────────────
async function sendWA(to: string, body: string): Promise<boolean> {
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
    const data = await res.json() as { sid?: string }
    console.log('[proactive] sent to', to, '| status:', res.status, '| sid:', data.sid)
    return res.status === 201
  } catch (e: any) {
    console.error('[proactive] sendWA error:', e.message)
    return false
  }
}

// ── Send voice note ───────────────────────────────────────────
async function sendVoiceNote(
  to: string,
  text: string,
  workspace_id: string,
  isAr: boolean
): Promise<boolean> {
  const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY
  if (!ELEVEN_KEY) {
    await sendWA(to, text)
    return false
  }

  const cleanText = text.replace(/\*/g, '').replace(/_/g, '').replace(/💡/g, '').trim().slice(0, 500)
  const voiceId = isAr
    ? (process.env.ELEVENLABS_AR_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL')
    : 'EXAVITQu4vr4xnSDxMaL'

  try {
    const audioRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: { 'xi-api-key': ELEVEN_KEY, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
        body: JSON.stringify({
          text: cleanText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.2, use_speaker_boost: true },
        }),
      }
    )
    if (!audioRes.ok) { await sendWA(to, text); return false }

    const audioBuffer = await audioRes.arrayBuffer()
    if (!audioBuffer.byteLength) { await sendWA(to, text); return false }

    const { createClient: sb } = await import('@supabase/supabase-js')
    const storage = sb(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const fileName = `whatsapp/voice/${workspace_id}/${Date.now()}.mp3`

    const { error: uploadErr } = await storage.storage
      .from('brand-assets')
      .upload(fileName, audioBuffer, { contentType: 'audio/mpeg', upsert: false })

    if (uploadErr) { await sendWA(to, text); return false }

    const { data: { publicUrl } } = storage.storage.from('brand-assets').getPublicUrl(fileName)

    const toWa = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
    const mediaParams = new URLSearchParams({ From: TWILIO_FROM, To: toWa, Body: '', MediaUrl: publicUrl })
    await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: mediaParams.toString(),
      }
    )
    return true
  } catch {
    try { await sendWA(to, text) } catch {}
    return false
  }
}

// ── Generate brief for a workspace ───────────────────────────
async function generateBrief(workspace_id: string, lang: 'en' | 'ar'): Promise<string | null> {
  const db = getDb()
  const isAr = lang === 'ar'

  const { data: ws } = await db
    .from('workspaces')
    .select('brand_name, brand_voice, brand_audience, brand_tone, name, weekly_brief, weekly_brief_ar')
    .eq('id', workspace_id)
    .single()

  if (!ws) return null
  const brandName = (ws as any).brand_name || (ws as any).name || 'your brand'

  // Use cached brief if fresh (within 6 hours)
  const cached = isAr ? (ws as any).weekly_brief_ar : (ws as any).weekly_brief
  if (cached?.headline && cached?.generated_at) {
    const age = Date.now() - new Date(cached.generated_at).getTime()
    if (age < 6 * 60 * 60 * 1000) {
      return `*${cached.headline}*\n\n${cached.todays_priority || ''}\n\n💡 ${cached.one_thing || ''}`
    }
  }

  // Get brand intelligence
  const { data: profileAsset } = await db
    .from('brand_assets')
    .select('analysis')
    .eq('workspace_id', workspace_id)
    .eq('file_name', 'nexa_brand_intelligence.json')
    .single()
  const profile = (profileAsset as any)?.analysis as any

  // Get recent content for context
  const { data: recentContent } = await db
    .from('content')
    .select('type, platform, body, created_at')
    .eq('workspace_id', workspace_id)
    .order('created_at', { ascending: false })
    .limit(3)

  const contentSummary = recentContent?.map((c: any) =>
    `${c.platform}: ${(c.body || '').slice(0, 80)}`
  ).join(' | ') || 'no recent content'

  const brandContext = profile ? `
Voice: ${profile.voice?.primary_tone || (ws as any).brand_voice}
Audience: ${profile.audience?.primary || (ws as any).brand_audience}
Positioning: ${profile.positioning?.unique_angle || ''}
Content style: ${profile.content?.formats?.join(', ') || ''}
` : `Voice: ${(ws as any).brand_voice || 'professional'}\nAudience: ${(ws as any).brand_audience || 'customers'}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: isAr
          ? `أنت مستشار تسويق خبير لـ${brandName}.\n${brandContext}\nالمحتوى الأخير: ${contentSummary}\n\nاكتب ملخصاً يومياً تسويقياً مخصصاً لهذه العلامة. أخرج JSON فقط:\n{"headline":"عنوان مشوّق يعكس صوت العلامة","todays_priority":"الأولوية اليوم — جملة واحدة قوية ومحددة للعلامة","one_thing":"الشيء الواحد الأهم الذي يجب فعله اليوم لهذه العلامة تحديداً"}`
          : `You are an expert marketing advisor for ${brandName}.\n${brandContext}\nRecent content: ${contentSummary}\n\nWrite a personalized daily marketing brief. JSON only:\n{"headline":"catchy headline that reflects the brand voice","todays_priority":"today's priority — one powerful specific sentence for this brand","one_thing":"the single most important thing to do today specifically for this brand"}`
      }]
    })

    const raw = (response.content[0] as any).text?.trim()
    const match = raw?.match(/\{[\s\S]*\}/)
    if (!match) return null
    const brief = JSON.parse(match[0])
    return `*${brief.headline}*\n\n${brief.todays_priority}\n\n💡 ${brief.one_thing}`
  } catch (e: any) {
    console.error('[proactive] brief generation error:', e.message)
    return null
  }
}

// ── Check if brief was sent today ────────────────────────────
async function briefSentToday(workspace_id: string): Promise<boolean> {
  const db = getDb()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data } = await db
    .from('whatsapp_messages')
    .select('id')
    .eq('workspace_id', workspace_id)
    .eq('direction', 'outbound')
    .ilike('body', '%💡%')
    .gte('created_at', todayStart.toISOString())
    .limit(1)

  return (data?.length || 0) > 0
}

// ── Main cron handler ─────────────────────────────────────────
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getDb()
  console.log('[proactive] cron started at', new Date().toISOString())

  const { data: connections, error } = await db
    .from('whatsapp_connections')
    .select('workspace_id, phone_number, lang, user_id')
    .eq('is_active', true)

  if (error) {
    console.error('[proactive] fetch connections error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!connections?.length) {
    console.log('[proactive] no active connections')
    return NextResponse.json({ sent: 0, total: 0 })
  }

  console.log('[proactive] processing', connections.length, 'connections')
  let sent = 0

  for (const conn of connections) {
    try {
      const { workspace_id, phone_number, lang } = conn as {
        workspace_id: string
        phone_number: string
        lang: string
      }
      const isAr = lang === 'ar'

      // Skip if already sent brief today
      const alreadySent = await briefSentToday(workspace_id)
      if (alreadySent) {
        console.log('[proactive] brief already sent today for ws:', workspace_id)
        continue
      }

      // Check credits
      const { data: credits } = await db
        .from('credits')
        .select('balance')
        .eq('workspace_id', workspace_id)
        .single()
      const balance = (credits as any)?.balance ?? 0

      // Low credit warning
      if (balance > 0 && balance < 50) {
        const lowMsg = isAr
          ? `⚠️ تنبيه: رصيدك ${balance} كريديت فقط\nشحّن من nexaa.cc قبل ما ينتهي`
          : `⚠️ Heads up: you have ${balance} credits left\nTop up at nexaa.cc`
        await sendWA(phone_number, lowMsg)
        await new Promise(r => setTimeout(r, 1000))
      }

      if (balance === 0) {
        const emptyMsg = isAr
          ? `رصيدك انتهى ⚡\nشحّن من nexaa.cc لمواصلة إنشاء المحتوى`
          : `Your credits are empty ⚡\nTop up at nexaa.cc to keep creating content`
        await sendWA(phone_number, emptyMsg)
        continue
      }

      // Generate brief
      const briefText = await generateBrief(workspace_id, lang as 'en' | 'ar')
      if (!briefText) {
        console.log('[proactive] brief generation failed for ws:', workspace_id)
        continue
      }

      // Greeting prefix
      const hour = new Date().getHours()
      const greeting = isAr
        ? (hour < 12 ? 'صباح الخير ☀️' : hour < 17 ? 'مساء الخير 🌤️' : 'مساء النور 🌙')
        : (hour < 12 ? 'Good morning ☀️' : hour < 17 ? 'Good afternoon 🌤️' : 'Good evening 🌙')

      const fullBrief = `${greeting}\n\n${briefText}`

      // Send as voice note first, then text for reference
      const voiceSent = await sendVoiceNote(phone_number, fullBrief, workspace_id, isAr)
      await new Promise(r => setTimeout(r, voiceSent ? 1500 : 0))
      await sendWA(phone_number, fullBrief)

      // Log to whatsapp_messages
      await db.from('whatsapp_messages').insert({
        workspace_id,
        phone_number,
        direction: 'outbound',
        message_type: 'text',
        body: fullBrief.slice(0, 1000),
        metadata: { type: 'morning_brief', auto_sent: true },
      }).then(() => {}, () => {})

      sent++
      console.log('[proactive] brief sent to', phone_number)

      // Rate limit between messages
      await new Promise(r => setTimeout(r, 1000))

    } catch (e: any) {
      console.error('[proactive] error for connection:', (conn as any).phone_number, e.message)
    }
  }

  console.log('[proactive] done. sent:', sent, '/', connections.length)
  return NextResponse.json({ sent, total: connections.length })
}
