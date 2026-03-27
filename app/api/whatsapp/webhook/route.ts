export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const TWILIO_SID   = process.env.TWILIO_ACCOUNT_SID!
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN!
const TWILIO_FROM  = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'
const APP_URL      = process.env.NEXT_PUBLIC_APP_URL || 'https://nexaa.cc'

// Send WhatsApp text via Twilio
async function sendWA(to: string, body: string) {
  const toWa = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
  console.log('[wa] sending to:', toWa, '| body:', body.slice(0, 80))
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
    const data = await res.json() as { sid?: string; message?: string; code?: number }
    console.log('[wa] twilio response:', res.status, data.sid || data.message || JSON.stringify(data).slice(0, 100))
    return data.sid
  } catch (err: unknown) {
    console.error('[wa] sendWA error:', (err as Error).message)
    return null
  }
}

// Resolve phone to workspace
async function resolveWorkspace(phone: string) {
  const db = getDb()
  const normalized = phone.replace('whatsapp:', '').trim()
  console.log('[wa] resolving phone:', normalized)
  const { data, error } = await db
    .from('whatsapp_connections')
    .select('workspace_id, user_id, lang')
    .eq('phone_number', normalized)
    .eq('is_active', true)
    .limit(1)
    .single()
  if (error) console.error('[wa] resolve error:', error.message)
  console.log('[wa] resolved:', data ? `workspace=${(data as Record<string, string>).workspace_id}` : 'NOT FOUND')
  return data as { workspace_id: string; user_id: string; lang: string } | null
}

// Get brand name
async function getBrandName(workspace_id: string): Promise<string> {
  const db = getDb()
  const { data } = await db
    .from('workspaces')
    .select('brand_name, name')
    .eq('id', workspace_id)
    .single()
  return (data as Record<string, string> | null)?.brand_name || (data as Record<string, string> | null)?.name || 'your brand'
}

// Get credits
async function getCredits(workspace_id: string): Promise<number> {
  const db = getDb()
  const { data } = await db
    .from('credits')
    .select('balance')
    .eq('workspace_id', workspace_id)
    .single()
  return (data as Record<string, number> | null)?.balance ?? 0
}

// Simple intent detection without Claude (fast, reliable)
function detectIntent(body: string): string {
  const b = body.toLowerCase().trim()
  if (!b || b.length < 2) return 'greeting'
  if (/hi|hello|hey|مرحب|أهلا|هلا|صباح|مساء/.test(b)) return 'greeting'
  if (/credit|رصيد|كريديت|balance|كم عندي/.test(b)) return 'credits'
  if (/brief|ملخص|اليوم|today|صباح الخير/.test(b)) return 'brief'
  if (/post|منشور|اكتب|write|caption|كابشن/.test(b)) return 'create_post'
  if (/image|صورة|picture|photo(?!.*product)/.test(b)) return 'create_image'
  if (/video|فيديو|reel|ريل/.test(b)) return 'create_video'
  if (/yes|نعم|اوكي|ok|approve|موافق|انشر/.test(b)) return 'approval_yes'
  if (/no|لا|cancel|إلغاء/.test(b)) return 'approval_no'
  if (/ad|اعلان|إعلان|amplify|campaign/.test(b)) return 'check_ads'
  return 'general'
}

// GET: health check
export async function GET() {
  return NextResponse.json({ status: 'Nexa WhatsApp webhook active' })
}

const XML_EMPTY = '<?xml version="1.0"?><Response></Response>'
const XML_HEADERS = { 'Content-Type': 'text/xml' }

// POST: incoming message from Twilio — process synchronously
export async function POST(request: NextRequest) {
  console.log('[wa-webhook] POST received at', new Date().toISOString())

  let body: Record<string, string> = {}
  try {
    const formData = await request.formData()
    formData.forEach((v, k) => { body[k] = v.toString() })
  } catch (err: unknown) {
    console.error('[wa-webhook] formData parse error:', (err as Error).message)
    return new NextResponse(XML_EMPTY, { headers: XML_HEADERS })
  }

  const from      = body.From || ''
  const msgBody   = body.Body || ''
  const numMedia  = parseInt(body.NumMedia || '0')
  const mediaUrl  = body.MediaUrl0 || ''
  const mediaType = body.MediaContentType0 || ''

  console.log('[wa-webhook] from:', from, '| body:', msgBody.slice(0, 100), '| media:', numMedia)

  const phone = from.replace('whatsapp:', '').trim()

  // Handle unregistered user
  const connection = await resolveWorkspace(phone)
  if (!connection) {
    console.log('[wa-webhook] unregistered user, sending signup message')
    await sendWA(from,
      `Hey! I'm Nexa 🤖\n\nTo connect your number, open nexaa.cc → Settings → WhatsApp and enter your number.\n\nOnce connected you can control everything from WhatsApp!`
    )
    return new NextResponse(XML_EMPTY, { headers: XML_HEADERS })
  }

  const { workspace_id, lang } = connection
  const isAr = lang === 'ar'

  // Handle image — product photo
  if (numMedia > 0 && mediaType.startsWith('image/')) {
    console.log('[wa-webhook] image received, processing as product photo')
    const ack = isAr
      ? 'وصلتني الصورة 📸 أشتغل عليها...'
      : 'Got your photo 📸 Processing it now...'
    await sendWA(from, ack)
    // Longer processing — fire in background after ack
    processProductPhoto(from, workspace_id, mediaUrl, isAr).catch((e: Error) =>
      console.error('[wa] product photo error:', e.message)
    )
    return new NextResponse(XML_EMPTY, { headers: XML_HEADERS })
  }

  // Handle audio — transcribe
  if (numMedia > 0 && mediaType.startsWith('audio/')) {
    const transcribed = await transcribeAudio(mediaUrl)
    const processText = transcribed || msgBody
    console.log('[wa-webhook] audio transcribed to:', processText.slice(0, 100))
    await handleTextIntent(from, workspace_id, processText, isAr, lang)
    return new NextResponse(XML_EMPTY, { headers: XML_HEADERS })
  }

  // Handle text
  await handleTextIntent(from, workspace_id, msgBody, isAr, lang)

  return new NextResponse(XML_EMPTY, { headers: XML_HEADERS })
}

async function handleTextIntent(
  from: string,
  workspace_id: string,
  text: string,
  isAr: boolean,
  lang: string
) {
  const intent = detectIntent(text)
  console.log('[wa-webhook] intent:', intent, '| text:', text.slice(0, 60))

  const brandName = await getBrandName(workspace_id)

  switch (intent) {

    case 'greeting': {
      const reply = isAr
        ? `أهلاً! أنا Nexa لـ ${brandName} 🎯\n\nكلّمني وقت ما تبي. تقدر تقول:\n• "اكتب لي منشور"\n• "كم رصيدي؟"\n• "ملخص اليوم"\n• أو أرسل صورة منتجك`
        : `Hey! I'm Nexa for ${brandName} 🎯\n\nMessage me anytime. Try:\n• "Write me a post"\n• "How many credits do I have?"\n• "Today's brief"\n• Or send a product photo`
      await sendWA(from, reply)
      break
    }

    case 'credits': {
      const balance = await getCredits(workspace_id)
      const reply = isAr
        ? `رصيدك الحالي: *${balance.toLocaleString()} كريديت* 💳\n${balance < 50 ? '⚠️ الرصيد منخفض — شحّن من nexaa.cc' : '✅ كافٍ للعمل'}`
        : `Your balance: *${balance.toLocaleString()} credits* 💳\n${balance < 50 ? '⚠️ Running low — top up at nexaa.cc' : '✅ Good to go'}`
      await sendWA(from, reply)
      break
    }

    case 'brief': {
      await sendWA(from, isAr ? 'سأجلب ملخص اليوم... ⏳' : 'Fetching today\'s brief... ⏳')
      try {
        const res = await fetch(`${APP_URL}/api/morning-brief`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspace_id, lang }),
        })
        const data = await res.json() as { brief?: { headline: string; todays_priority: string; one_thing: string } }
        const brief = data.brief
        if (brief) {
          await sendWA(from, `*${brief.headline}*\n\n${brief.todays_priority}\n\n💡 ${brief.one_thing}`)
        } else {
          await sendWA(from, isAr ? 'ما قدرت أجلب الملخص الآن' : "Couldn't load the brief right now")
        }
      } catch (e: unknown) {
        console.error('[wa] brief error:', (e as Error).message)
        await sendWA(from, isAr ? 'صار خطأ في جلب الملخص' : 'Error fetching brief')
      }
      break
    }

    case 'create_post': {
      await sendWA(from, isAr ? 'يكتب... ✍️' : 'Writing your post... ✍️')
      try {
        const res = await fetch(`${APP_URL}/api/generate-content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspace_id,
            type: 'post',
            platform: 'instagram',
            prompt: text,
            lang,
          }),
        })
        const data = await res.json() as Record<string, unknown>
        const content = (data.content || data.body || data.text) as string | undefined
        if (content) {
          const msg = isAr
            ? `هذا منشورك 👇\n\n${content}\n\n———\nرد بـ *نعم* للحفظ أو أخبرني ما تبي تغيّره`
            : `Here's your post 👇\n\n${content}\n\n———\nReply *yes* to save or tell me what to change`
          await sendWA(from, msg)
        } else {
          await sendWA(from, isAr ? 'ما قدرت أكتب المنشور' : "Couldn't generate the post")
        }
      } catch (e: unknown) {
        console.error('[wa] create_post error:', (e as Error).message)
        await sendWA(from, isAr ? 'صار خطأ' : 'Something went wrong')
      }
      break
    }

    case 'approval_yes': {
      await sendWA(from, isAr ? 'تم الحفظ ✓' : 'Saved ✓')
      break
    }

    case 'approval_no': {
      await sendWA(from, isAr ? 'تم الإلغاء ✓' : 'Cancelled ✓')
      break
    }

    case 'check_ads': {
      await sendWA(from, isAr
        ? 'لمراجعة الإعلانات، افتح قسم Amplify في لوحة nexaa.cc'
        : 'To review your ads, open the Amplify section at nexaa.cc'
      )
      break
    }

    default: {
      // General question — use Claude for a smart reply
      try {
        const Anthropic = (await import('@anthropic-ai/sdk')).default
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
        const system = isAr
          ? `أنت Nexa، مساعد تسويق ذكي لـ${brandName}. رد بالعربية الخليجية، قصير ومفيد، ٣ جمل كحد أقصى.`
          : `You are Nexa, the AI marketing assistant for ${brandName}. Reply naturally, be helpful and brief, max 3 sentences.`
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 200,
          system,
          messages: [{ role: 'user', content: text }],
        })
        const reply = ((response.content[0] as { type: string; text: string }).text)?.trim()
        await sendWA(from, reply || (isAr ? 'كيف أقدر أساعدك؟' : 'How can I help?'))
      } catch (e: unknown) {
        console.error('[wa] claude error:', (e as Error).message)
        await sendWA(from, isAr ? 'كيف أقدر أساعدك؟' : 'How can I help?')
      }
      break
    }
  }
}

async function processProductPhoto(
  from: string,
  workspace_id: string,
  mediaUrl: string,
  isAr: boolean
) {
  try {
    const cleanRes = await fetch(`${APP_URL}/api/product-lab/clean`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: mediaUrl, workspace_id }),
    })
    const cleanData = await cleanRes.json() as { cleaned_url?: string }
    const cleanedUrl = cleanData.cleaned_url || mediaUrl

    const shotRes = await fetch(`${APP_URL}/api/product-lab/studio-shots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspace_id,
        cleaned_url: cleanedUrl,
        product_type: 'general',
        product_material: 'general',
        product_color: 'neutral',
        shot_styles: ['hero'],
      }),
    })
    const shotData = await shotRes.json() as { shots?: Array<{ url: string }> }
    const heroUrl = shotData.shots?.[0]?.url

    if (heroUrl) {
      await sendWAMedia(from, heroUrl,
        isAr
          ? 'صورة منتجك الاحترافية 👆\n\nرد بـ *فيديو* لتحويلها لريل، أو *نشر* لنشرها على إنستقرام'
          : 'Your professional product photo 👆\n\nReply *video* to make a reel, or *post* to share on Instagram'
      )
    } else {
      await sendWA(from, isAr ? 'ما قدرت أعالج الصورة' : "Couldn't process the photo")
    }
  } catch (e: unknown) {
    console.error('[wa] processProductPhoto error:', (e as Error).message)
    await sendWA(from, isAr ? 'ما قدرت أعالج الصورة' : "Couldn't process the photo")
  }
}

async function sendWAMedia(to: string, mediaUrl: string, body: string) {
  const toWa = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
  const params = new URLSearchParams({ From: TWILIO_FROM, To: toWa, Body: body, MediaUrl: mediaUrl })
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
    console.log('[wa] sendWAMedia response:', res.status, data.sid || data.message)
  } catch (e: unknown) {
    console.error('[wa] sendWAMedia error:', (e as Error).message)
  }
}

async function transcribeAudio(audioUrl: string): Promise<string | null> {
  const OPENAI_KEY = process.env.OPENAI_API_KEY
  if (!OPENAI_KEY) return null
  try {
    const audioRes = await fetch(audioUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64')
      }
    })
    if (!audioRes.ok) return null
    const audioBuffer = await audioRes.arrayBuffer()
    const formData = new FormData()
    formData.append('file', new Blob([audioBuffer], { type: 'audio/ogg' }), 'audio.ogg')
    formData.append('model', 'whisper-1')
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_KEY}` },
      body: formData,
    })
    const data = await res.json() as { text?: string }
    return data.text?.trim() || null
  } catch { return null }
}
