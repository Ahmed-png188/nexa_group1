// Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Get service role key from Supabase → Settings → API → service_role key
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const TWILIO_ACCOUNT_SID   = process.env.TWILIO_ACCOUNT_SID!
const TWILIO_AUTH_TOKEN    = process.env.TWILIO_AUTH_TOKEN!
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_NUMBER! // 'whatsapp:+14155238886'

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── Send a text message ────────────────────────────────────────────────────
export async function waSendText(
  to: string,
  body: string,
): Promise<string | null> {
  const toWa = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`

  const params = new URLSearchParams({
    From: TWILIO_WHATSAPP_FROM,
    To:   toWa,
    Body: body,
  })

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    )
    const data = await res.json()
    return data.sid || null
  } catch (err) {
    console.error('[wa] sendText failed:', err)
    return null
  }
}

// ── Send a message with media (image, video, audio) ───────────────────────
export async function waSendMedia(
  to: string,
  body: string,
  mediaUrl: string,
): Promise<string | null> {
  const toWa = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`

  const params = new URLSearchParams({
    From:     TWILIO_WHATSAPP_FROM,
    To:       toWa,
    Body:     body,
    MediaUrl: mediaUrl,
  })

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    )
    const data = await res.json()
    return data.sid || null
  } catch (err) {
    console.error('[wa] sendMedia failed:', err)
    return null
  }
}

// ── Send a voice note using ElevenLabs ────────────────────────────────────
// Generates TTS audio and sends as WhatsApp audio message
export async function waSendVoiceNote(
  to: string,
  text: string,
  voiceId: string = 'EXAVITQu4vr4xnSDxMaL', // Bella — warm female voice
  lang: 'en' | 'ar' = 'en',
): Promise<string | null> {
  const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY
  if (!ELEVEN_KEY) {
    console.error('[wa] No ElevenLabs API key')
    return waSendText(to, text) // fallback to text
  }

  const finalVoiceId = lang === 'ar'
    ? (process.env.ELEVENLABS_AR_VOICE_ID || voiceId)
    : voiceId

  try {
    const audioRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${finalVoiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVEN_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    )

    if (!audioRes.ok) {
      console.error('[wa] ElevenLabs failed:', await audioRes.text())
      return waSendText(to, text)
    }

    const audioBuffer = await audioRes.arrayBuffer()
    const supabase    = getServiceClient()
    const fileName    = `whatsapp/voice/${Date.now()}.mp3`

    const { error: uploadErr } = await supabase.storage
      .from('brand-assets')
      .upload(fileName, audioBuffer, { contentType: 'audio/mpeg', upsert: false })

    if (uploadErr) {
      console.error('[wa] Voice upload failed:', uploadErr)
      return waSendText(to, text)
    }

    const { data: { publicUrl } } = supabase.storage
      .from('brand-assets')
      .getPublicUrl(fileName)

    return waSendMedia(to, '', publicUrl)

  } catch (err) {
    console.error('[wa] waSendVoiceNote failed:', err)
    return waSendText(to, text)
  }
}

// ── Log message to DB ──────────────────────────────────────────────────────
export async function waLogMessage(params: {
  workspace_id:  string | null
  phone_number:  string
  direction:     'inbound' | 'outbound'
  message_type:  string
  body?:         string
  media_url?:    string
  media_type?:   string
  twilio_sid?:   string
  intent?:       string
  metadata?:     Record<string, unknown>
}) {
  try {
    const supabase = getServiceClient()
    await supabase.from('whatsapp_messages').insert({
      workspace_id: params.workspace_id,
      phone_number: params.phone_number,
      direction:    params.direction,
      message_type: params.message_type,
      body:         params.body,
      media_url:    params.media_url,
      media_type:   params.media_type,
      twilio_sid:   params.twilio_sid,
      intent:       params.intent,
      metadata:     params.metadata || {},
    })
  } catch (err) {
    console.error('[wa] logMessage failed:', err)
  }
}

// ── Resolve phone number to workspace ─────────────────────────────────────
export async function waResolveWorkspace(phone: string): Promise<{
  workspace_id: string
  user_id:      string
  lang:         'en' | 'ar'
} | null> {
  const supabase = getServiceClient()

  const normalized = phone
    .replace('whatsapp:', '')
    .replace(/\s/g, '')

  const { data } = await supabase
    .from('whatsapp_connections')
    .select('workspace_id, user_id, lang')
    .or(`phone_number.eq.${normalized},phone_number_raw.eq.${phone}`)
    .eq('is_active', true)
    .limit(1)
    .single()

  if (!data) return null
  return {
    workspace_id: data.workspace_id,
    user_id:      data.user_id,
    lang:         (data.lang as 'en' | 'ar') || 'en',
  }
}

// ── Update conversation context ────────────────────────────────────────────
export async function waUpdateContext(
  workspace_id: string,
  updates: Partial<{
    conversation_summary: string
    pending_action:       unknown
    last_question_at:     string
    last_brief_at:        string
    metadata:             Record<string, unknown>
  }>
) {
  const supabase = getServiceClient()
  await supabase
    .from('whatsapp_context')
    .upsert({
      workspace_id,
      ...updates,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'workspace_id' })
}

// ── Get conversation context ───────────────────────────────────────────────
export async function waGetContext(workspace_id: string) {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('whatsapp_context')
    .select('*')
    .eq('workspace_id', workspace_id)
    .single()
  return data
}

// ── Format phone for display ───────────────────────────────────────────────
export function waFormatPhone(phone: string): string {
  return phone.replace('whatsapp:', '').trim()
}
