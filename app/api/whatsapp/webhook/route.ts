export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import {
  waResolveWorkspace,
  waLogMessage,
  waGetContext,
  waSendText,
} from '@/lib/whatsapp'
import { classifyIntent } from '@/lib/whatsapp-intent'
import { handleAction } from '@/lib/whatsapp-actions'
import { getBrandContext } from '@/lib/brand-context'

// GET: Twilio webhook verification
export async function GET() {
  return NextResponse.json({ status: 'Nexa WhatsApp webhook active' })
}

// POST: Incoming WhatsApp message from Twilio
export async function POST(request: NextRequest) {
  // Return 200 IMMEDIATELY — Twilio requires <5s response
  // Process everything asynchronously

  let body: Record<string, string> = {}

  try {
    const formData = await request.formData()
    Array.from(formData.entries()).forEach(([key, value]) => {
      body[key] = value.toString()
    })
  } catch {
    return NextResponse.json({ received: true })
  }

  // Process asynchronously without blocking the response
  processIncomingMessage(body).catch(err => {
    console.error('[wa-webhook] async processing error:', err)
  })

  // Return 200 immediately
  return NextResponse.json({ received: true })
}

async function processIncomingMessage(body: Record<string, string>) {
  try {
    const from      = body.From || ''  // 'whatsapp:+971501234567'
    const msgBody   = body.Body || ''
    const numMedia  = parseInt(body.NumMedia || '0')
    const mediaUrl  = body.MediaUrl0 || ''
    const mediaType = body.MediaContentType0 || ''
    const twilioSid = body.MessageSid || ''

    // Normalize phone number
    const phone = from.replace('whatsapp:', '').trim()
    if (!phone) return

    // Determine message type
    let messageType = 'text'
    if (numMedia > 0) {
      if (mediaType.startsWith('image/'))      messageType = 'image'
      else if (mediaType.startsWith('audio/')) messageType = 'audio'
      else if (mediaType.startsWith('video/')) messageType = 'video'
      else                                     messageType = 'document'
    }

    // Resolve workspace from phone number
    const connection = await waResolveWorkspace(phone)

    // Handle unregistered users
    if (!connection) {
      await handleUnregisteredUser(phone, msgBody)
      return
    }

    const { workspace_id, user_id, lang } = connection

    // Log inbound message
    await waLogMessage({
      workspace_id,
      phone_number: phone,
      direction:    'inbound',
      message_type: messageType,
      body:         msgBody,
      media_url:    mediaUrl || undefined,
      media_type:   mediaType || undefined,
      twilio_sid:   twilioSid,
    })

    // Handle audio messages: transcribe first
    let processedText = msgBody
    if (messageType === 'audio' && mediaUrl) {
      const transcribed = await transcribeAudio(mediaUrl, lang)
      if (!transcribed) {
        const ack = lang === 'ar'
          ? 'ما قدرت أفهم الرسالة الصوتية، ممكن تكتب لي؟'
          : "Couldn't understand the voice message, could you type it?"
        await waSendText(from, ack)
        return
      }
      processedText = transcribed
    }

    // Get brand context and conversation context
    const [brand, context] = await Promise.all([
      getBrandContext(workspace_id),
      waGetContext(workspace_id),
    ])

    const b = brand as Record<string, unknown> | null
    const ws = b?.workspace as Record<string, unknown> | null
    const brandName = (b?.brandName as string) || (ws?.brand_name as string) || 'your brand'

    // Classify intent
    const intent = await classifyIntent(
      processedText || `[${messageType} message]`,
      messageType,
      context,
      lang,
      brandName,
    )

    // Log intent
    await waLogMessage({
      workspace_id,
      phone_number: phone,
      direction:    'inbound',
      message_type: 'intent',
      body:         intent.intent,
      intent:       intent.intent,
      metadata:     { summary: intent.summary },
    })

    // Handle the action
    await handleAction({
      phone,
      workspace_id,
      user_id,
      lang,
      intent,
      rawMessage: processedText || msgBody,
      mediaUrl:   mediaUrl || undefined,
      brand,
      context,
    })

  } catch (err) {
    console.error('[wa-webhook] processIncomingMessage error:', err)
  }
}

// Transcribe audio using Whisper via OpenAI
async function transcribeAudio(
  audioUrl: string,
  lang:     'en' | 'ar'
): Promise<string | null> {
  const OPENAI_KEY = process.env.OPENAI_API_KEY
  if (!OPENAI_KEY) return null

  try {
    // Download the audio from Twilio (requires auth)
    const authHeader = 'Basic ' + Buffer.from(
      `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
    ).toString('base64')

    const audioRes = await fetch(audioUrl, {
      headers: { Authorization: authHeader }
    })
    if (!audioRes.ok) return null

    const audioBuffer = await audioRes.arrayBuffer()
    const audioBlob   = new Blob([audioBuffer], { type: 'audio/ogg' })

    // Send to Whisper
    const formData = new FormData()
    formData.append('file', audioBlob, 'audio.ogg')
    formData.append('model', 'whisper-1')
    formData.append('language', lang === 'ar' ? 'ar' : 'en')

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method:  'POST',
      headers: { Authorization: `Bearer ${OPENAI_KEY}` },
      body:    formData,
    })

    if (!whisperRes.ok) return null
    const data = await whisperRes.json() as { text?: string }
    return data.text?.trim() || null

  } catch (err) {
    console.error('[wa] transcribeAudio failed:', err)
    return null
  }
}

// Handle users who message but aren't connected to Nexa yet
async function handleUnregisteredUser(phone: string, message: string) {
  const isArabic = /[\u0600-\u06FF]/.test(message)
  const welcome  = isArabic
    ? `مرحباً! أنا Nexa، مساعدك الذكي للمحتوى والتسويق 🤖\n\nلربط رقمك بـ Nexa، افتح لوحة التحكم على nexaa.cc وفعّل WhatsApp من الإعدادات.\n\nبعد الربط تقدر تتحكم بكل شي من هنا مباشرة!`
    : `Hey! I'm Nexa, your AI marketing assistant 🤖\n\nTo connect your number to Nexa, open your dashboard at nexaa.cc and activate WhatsApp in Settings.\n\nOnce connected, you can control everything from right here!`
  await waSendText(phone, welcome)
}
