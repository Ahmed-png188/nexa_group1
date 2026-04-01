export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fal } from '@fal-ai/client'
import Anthropic from '@anthropic-ai/sdk'

// ── Clients ───────────────────────────────────────────────────
function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

fal.config({ credentials: process.env.FAL_KEY })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const TWILIO_SID   = process.env.TWILIO_ACCOUNT_SID!
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN!
const TWILIO_FROM  = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'

const XML_EMPTY   = '<?xml version="1.0"?><Response></Response>'
const XML_HEADERS = { 'Content-Type': 'text/xml' }

// ── Send helpers ──────────────────────────────────────────────
async function sendWA(to: string, body: string): Promise<string | null> {
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
    console.log('[wa] sent text, status:', res.status, 'sid:', data.sid || data.message)
    return data.sid || null
  } catch (e: unknown) {
    console.error('[wa] sendWA error:', (e as Error).message)
    return null
  }
}

async function sendWAMedia(to: string, mediaUrl: string, body: string): Promise<void> {
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
    console.log('[wa] sent media, status:', res.status, 'sid:', data.sid || data.message)
  } catch (e: unknown) {
    console.error('[wa] sendWAMedia error:', (e as Error).message)
  }
}

async function sendVoiceNote(
  to: string,
  text: string,
  workspace_id: string,
  isAr: boolean
): Promise<boolean> {
  const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY

  // No key — send as text silently
  if (!ELEVEN_KEY) {
    await sendWA(to, text)
    return false
  }

  const cleanText = text
    .replace(/\*/g, '')
    .replace(/_/g, '')
    .replace(/#+/g, '')
    .replace(/💡/g, '')
    .trim()
    .slice(0, 500)

  const voiceId = isAr
    ? (process.env.ELEVENLABS_AR_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL')
    : 'EXAVITQu4vr4xnSDxMaL'

  try {
    const audioRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVEN_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.2,
            use_speaker_boost: true,
          },
        }),
      }
    )

    // Any failure — fall back to text silently
    if (!audioRes.ok) {
      console.log('[wa-voice] ElevenLabs unavailable, using text')
      await sendWA(to, text)
      return false
    }

    const audioBuffer = await audioRes.arrayBuffer()

    if (!audioBuffer.byteLength) {
      console.log('[wa-voice] empty audio, using text')
      await sendWA(to, text)
      return false
    }

    // Upload to Supabase storage
    const { createClient: sb } = await import('@supabase/supabase-js')
    const storage = sb(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const fileName = `whatsapp/voice/${workspace_id}/${Date.now()}.mp3`
    const { error: uploadErr } = await storage.storage
      .from('brand-assets')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: false,
      })

    if (uploadErr) {
      console.log('[wa-voice] upload failed, using text')
      await sendWA(to, text)
      return false
    }

    const { data: { publicUrl } } = storage.storage
      .from('brand-assets')
      .getPublicUrl(fileName)

    await sendWAMedia(to, publicUrl, '')
    console.log('[wa-voice] voice sent ✓')
    return true

  } catch {
    // Any unexpected error — fall back to text silently
    // Never expose voice errors to the user
    try {
      await sendWA(to, text)
    } catch {
      // Even text failed — nothing we can do, log only
      console.log('[wa-voice] both voice and text failed silently')
    }
    return false
  }
}

function shouldUseVoice(
  cleanReply: string,
  userMessage: string,
  actionType: string | null,
  isFirstMessage: boolean,
): boolean {
  if (!process.env.ELEVENLABS_API_KEY) return false
  if (cleanReply.length > 400) return false
  if (cleanReply.length < 20) return false

  const msg = userMessage.toLowerCase()

  // NEVER voice — functional content user needs to read
  const neverVoice = [
    actionType === 'create_post',
    actionType === 'create_image',
    actionType === 'create_video',
    actionType === 'show_credits',
    actionType === 'show_schedule',
    /\d{3,}/.test(cleanReply),           // numbers like credit balance
    cleanReply.includes('📅'),           // schedule lists
    cleanReply.includes('👉'),           // approval buttons
    cleanReply.includes('#'),            // hashtags in content
    cleanReply.toLowerCase().includes("couldn't"),
    cleanReply.includes('ما قدرت'),
    cleanReply.includes('خطأ'),
    cleanReply.toLowerCase().includes('error'),
    cleanReply.includes('nexaa.cc'),     // links — send as text
  ].some(Boolean)

  if (neverVoice) return false

  // ALWAYS voice — warm human moments
  const alwaysVoice = [
    msg.includes('brief') || msg.includes('ملخص'),
    msg.includes('good morning') || msg.includes('صباح'),
    isFirstMessage,
    cleanReply.includes('🎉') || cleanReply.includes('✨'),
  ].some(Boolean)

  if (alwaysVoice) return true

  // SOMETIMES voice — conversational questions
  const sometimesVoice = [
    msg.includes('hi') || msg.includes('hello') || msg.includes('hey'),
    msg.includes('مرحب') || msg.includes('أهلا') || msg.includes('هلا'),
    msg.includes('strategy') || msg.includes('استراتيجية'),
    msg.includes('what should') || msg.includes('ماذا أفعل'),
    msg.includes('advice') || msg.includes('نصيحة'),
    msg.includes('what do you think') || msg.includes('رأيك'),
    msg.includes('what can you') || msg.includes('ماذا تقدر'),
    msg.includes('who are') || msg.includes('من أنت') || msg.includes('what is nexa'),
    msg.includes('brand') && !msg.includes('write') && !msg.includes('post'),
  ].some(Boolean)

  return sometimesVoice
}

async function handleDocumentTraining(
  from: string,
  workspace_id: string,
  user_id: string,
  mediaUrl: string,
  mediaType: string,
  isAr: boolean
): Promise<void> {
  console.log('[wa] brand doc training, type:', mediaType, 'url:', mediaUrl.slice(0, 60))

  const ack = isAr
    ? 'وصلني الملف 📄 أقرأه وأدرّب Brand Brain عليه... (دقيقة)'
    : 'Got your document 📄 Reading it and training Brand Brain... (a minute)'
  await sendWA(from, ack)

  try {
    const db = getDb()

    // Download the document from Twilio
    const docRes = await fetch(mediaUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(
          `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
        ).toString('base64'),
      }
    })

    if (!docRes.ok) {
      await sendWA(from, isAr ? 'ما قدرت أقرأ الملف' : "Couldn't read the document")
      return
    }

    const docBuffer = await docRes.arrayBuffer()
    const isPDF  = mediaType.includes('pdf')
    const isImage = mediaType.startsWith('image/')

    let extractedText = ''

    if (isImage) {
      const base64 = Buffer.from(docBuffer).toString('base64')
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: base64 }
            },
            {
              type: 'text',
              text: 'Extract all text and key brand information from this image. Include: brand name, products, taglines, values, target audience, pricing, any other brand details visible.'
            }
          ]
        }]
      })
      extractedText = ((response.content[0] as { type: string; text: string }).text)?.trim() || ''
    } else if (isPDF) {
      const base64 = Buffer.from(docBuffer).toString('base64')
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: base64 }
            } as unknown as { type: 'text'; text: string },
            {
              type: 'text',
              text: 'Extract all brand information from this document. Include: brand name, products/services, pricing, target audience, brand voice/tone, values, mission, any marketing copy or taglines. Be thorough.'
            }
          ]
        }]
      })
      extractedText = ((response.content[0] as { type: string; text: string }).text)?.trim() || ''
    } else {
      extractedText = new TextDecoder().decode(docBuffer).slice(0, 3000)
    }

    if (!extractedText || extractedText.length < 50) {
      await sendWA(from, isAr ? 'ما قدرت أستخرج معلومات من الملف' : "Couldn't extract information from this document")
      return
    }

    console.log('[wa] extracted text length:', extractedText.length)

    const { data: ws } = await db
      .from('workspaces')
      .select('brand_name, name, brand_voice, brand_audience')
      .eq('id', workspace_id)
      .single()

    const brandName = (ws as Record<string, string> | null)?.brand_name || (ws as Record<string, string> | null)?.name || 'the brand'

    const analysisResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: 'You are a brand intelligence analyst. Extract structured brand insights from documents. Always output valid JSON only. No preamble. No explanation.',
      messages: [{
        role: 'user',
        content: `Analyze this document for brand ${brandName} and extract brand intelligence.

Document content:
${extractedText.slice(0, 2000)}

Output JSON with any fields you can identify:
{
  "brand_name": "if found",
  "products": ["list of products/services if mentioned"],
  "pricing": "pricing info if found",
  "target_audience": "who they target",
  "brand_voice": "tone and communication style evident in the document",
  "brand_values": ["core values if mentioned"],
  "taglines": ["any taglines or slogans"],
  "unique_selling_points": ["what makes them different"],
  "key_insights": ["3-5 key things learned about this brand from this document"]
}`
      }]
    })

    const analysisRaw = ((analysisResponse.content[0] as { type: string; text: string }).text)?.trim()
    let insights: Record<string, unknown> = {}
    try {
      const match = analysisRaw?.match(/\{[\s\S]*\}/)
      if (match) insights = JSON.parse(match[0])
    } catch {
      insights = { key_insights: [extractedText.slice(0, 200)] }
    }

    // Save to brand_assets
    await db.from('brand_assets').insert({
      workspace_id,
      type: 'brand_doc',
      file_url: mediaUrl,
      file_name: `whatsapp_doc_${Date.now()}.${isPDF ? 'pdf' : 'img'}`,
      ai_analyzed: true,
      analysis: insights,
    }).then(() => {}, (e: Error) => console.error('[wa] brand_assets insert error:', e.message))

    // Save key insights to brand_learnings
    const learnings = (insights.key_insights as string[]) || []
    if (learnings.length > 0) {
      await db.from('brand_learnings').insert(
        learnings.map((insight: string) => ({
          workspace_id,
          insight_type: 'content',
          content: insight,
          source: 'whatsapp_document',
          metadata: { doc_type: isPDF ? 'pdf' : 'image', user_id },
        }))
      ).then(() => {}, (e: Error) => console.error('[wa] brand_learnings insert error:', e.message))
    }

    // Update workspace brand fields if missing
    const updates: Record<string, string> = {}
    if (insights.target_audience && !(ws as Record<string, string> | null)?.brand_audience) {
      updates.brand_audience = insights.target_audience as string
    }
    if (insights.brand_voice && !(ws as Record<string, string> | null)?.brand_voice) {
      updates.brand_voice = insights.brand_voice as string
    }
    if (insights.brand_name && !(ws as Record<string, string> | null)?.brand_name) {
      updates.brand_name = insights.brand_name as string
    }
    if (Object.keys(updates).length > 0) {
      await db.from('workspaces').update(updates).eq('id', workspace_id)
        .then(() => {}, (e: Error) => console.error('[wa] workspace update error:', e.message))
    }

    // Build confirmation
    const learned: string[] = []
    const insProducts = insights.products as string[] | undefined
    const insAudience = insights.target_audience as string | undefined
    const insVoice    = insights.brand_voice as string | undefined
    const insUSPs     = insights.unique_selling_points as string[] | undefined

    if (insProducts?.length) learned.push(isAr ? `المنتجات: ${insProducts.slice(0, 3).join('، ')}` : `Products: ${insProducts.slice(0, 3).join(', ')}`)
    if (insAudience)         learned.push(isAr ? `الجمهور: ${insAudience.slice(0, 80)}` : `Audience: ${insAudience.slice(0, 80)}`)
    if (insVoice)            learned.push(isAr ? `الصوت: ${insVoice.slice(0, 80)}` : `Voice: ${insVoice.slice(0, 80)}`)
    if (insUSPs?.length)     learned.push(isAr ? `التميز: ${insUSPs[0].slice(0, 80)}` : `USP: ${insUSPs[0].slice(0, 80)}`)

    const confirmation = isAr
      ? `✅ تم تدريب Brand Brain على هذا الملف!\n\nتعلّمت:\n${learned.map(l => `• ${l}`).join('\n')}\n\nكل المحتوى القادم سيعكس هذه المعلومات تلقائياً 🧠`
      : `✅ Brand Brain trained on this document!\n\nLearned:\n${learned.map(l => `• ${l}`).join('\n')}\n\nAll future content will reflect this automatically 🧠`

    await sendWA(from, confirmation)

  } catch (e: unknown) {
    console.error('[wa] brand doc training error:', (e as Error).message)
    await sendWA(from, isAr ? 'ما قدرت أدرّب Brand Brain على الملف' : "Couldn't train Brand Brain on this document")
  }
}

// Visual button simulation (real buttons need Twilio Content API + approved sender)
async function sendWAButtons(
  to: string,
  body: string,
  buttons: Array<{ id: string; title: string }>
): Promise<void> {
  const buttonText = buttons.map(b => `👉 *${b.title}*`).join('\n')
  await sendWA(to, `${body}\n\n${buttonText}`)
}

// Split long content across two messages if needed
async function sendLongContent(to: string, content: string, footer: string): Promise<void> {
  if (content.length + footer.length < 3500) {
    await sendWA(to, content + footer)
    return
  }
  await sendWA(to, content)
  await new Promise(r => setTimeout(r, 500))
  await sendWA(to, footer)
}

// ── Conversation history ──────────────────────────────────────
type ChatMessage = { role: 'user' | 'assistant'; content: string }

async function getConversationHistory(workspace_id: string): Promise<ChatMessage[]> {
  const db = getDb()
  const { data } = await db
    .from('whatsapp_messages')
    .select('direction, body, created_at')
    .eq('workspace_id', workspace_id)
    .in('direction', ['inbound', 'outbound'])
    .not('body', 'is', null)
    .not('body', 'eq', '')
    .order('created_at', { ascending: false })
    .limit(16)

  if (!data?.length) return []

  return (data as Array<{ direction: string; body: string }>)
    .reverse()
    .map(m => ({
      role:    (m.direction === 'inbound' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.body?.slice(0, 500) || '',
    }))
    .filter(m => m.content.length > 0)
}

async function logOutbound(workspace_id: string, phone: string, body: string) {
  const db = getDb()
  await db.from('whatsapp_messages').insert({
    workspace_id,
    phone_number: phone,
    direction:    'outbound',
    message_type: 'text',
    body:         body.slice(0, 1000),
  }).then(() => {}, (e: Error) => console.error('[wa] log outbound error:', e.message))
}

// ── Types ─────────────────────────────────────────────────────
type WorkspaceData = {
  brand_name?:    string
  brand_voice?:   string
  brand_audience?: string
  brand_tone?:    string
  name?:          string
  weekly_brief?:  unknown
  weekly_brief_ar?: unknown
  profile:        Record<string, unknown> | null
  brandContext:   string
  [key: string]:  unknown
}

// ── Workspace helpers ─────────────────────────────────────────
async function resolveWorkspace(phone: string) {
  const db = getDb()
  const normalized = phone.replace('whatsapp:', '').trim()
  const { data, error } = await db
    .from('whatsapp_connections')
    .select('workspace_id, user_id, lang')
    .eq('phone_number', normalized)
    .eq('is_active', true)
    .limit(1)
    .single()
  if (error) console.error('[wa] resolve error:', error.message)
  console.log('[wa] resolved:', data ? `ws=${(data as Record<string,string>).workspace_id}` : `NOT FOUND (${normalized})`)
  return data as { workspace_id: string; user_id: string; lang: string } | null
}

async function getWorkspace(workspace_id: string): Promise<WorkspaceData | null> {
  const db = getDb()
  const { data: ws, error } = await db
    .from('workspaces')
    .select('brand_name, brand_voice, brand_audience, brand_tone, name, weekly_brief, weekly_brief_ar')
    .eq('id', workspace_id)
    .single()
  console.log('[wa] getWorkspace:', (ws as Record<string,string> | null)?.brand_name, 'error:', error?.message)

  const { data: profileAsset } = await db
    .from('brand_assets')
    .select('analysis')
    .eq('workspace_id', workspace_id)
    .eq('file_name', 'nexa_brand_intelligence.json')
    .single()

  const profile = (profileAsset as Record<string, unknown> | null)?.analysis as Record<string, unknown> | null
  const w = ws as Record<string, unknown> | null

  const brandContext = profile ? `
Brand: ${w?.brand_name || w?.name}
Voice: ${(profile.voice as Record<string,string>)?.primary_tone || w?.brand_voice}
Writing style: ${(profile.voice as Record<string,string>)?.writing_style || 'clear and direct'}
Audience: ${(profile.audience as Record<string,string>)?.primary || w?.brand_audience}
Audience psychology: ${(profile.audience as Record<string,string>)?.psychology || ''}
Pain points: ${(profile.audience as Record<string,string[]>)?.pain_points?.join(', ') || ''}
Brand positioning: ${(profile.positioning as Record<string,string>)?.unique_angle || ''}
Visual aesthetic: ${(profile.visual as Record<string,string>)?.aesthetic || ''}
Content formats: ${(profile.content as Record<string,string[]>)?.formats?.join(', ') || ''}
Hook style: ${(profile.content as Record<string,string[]>)?.hooks?.join(', ') || ''}
` : `
Brand: ${w?.brand_name || w?.name}
Voice: ${w?.brand_voice || 'professional'}
Audience: ${w?.brand_audience || 'customers'}
Tone: ${w?.brand_tone || 'confident'}
`

  return { ...(w as WorkspaceData), profile, brandContext: brandContext.trim() }
}

async function getBrandName(workspace_id: string): Promise<string> {
  const db = getDb()
  const { data, error } = await db
    .from('workspaces')
    .select('brand_name, name')
    .eq('id', workspace_id)
    .single()
  console.log('[wa] getBrandName result:', JSON.stringify(data), 'error:', error?.message)
  return (data as Record<string,string> | null)?.brand_name || (data as Record<string,string> | null)?.name || 'your brand'
}

async function getCredits(workspace_id: string): Promise<number> {
  const db = getDb()
  const { data } = await db
    .from('credits').select('balance').eq('workspace_id', workspace_id).single()
  return (data as Record<string, number> | null)?.balance ?? 0
}

async function deductCredits(workspace_id: string, user_id: string, amount: number, action: string, desc: string) {
  const db = getDb()
  await db.rpc('deduct_credits', {
    p_workspace_id: workspace_id,
    p_amount:       amount,
    p_action:       action,
    p_user_id:      user_id,
    p_description:  desc,
  })
}

async function saveContent(workspace_id: string, user_id: string, params: {
  type:          string
  platform?:     string
  body?:         string
  image_url?:    string
  video_url?:    string
  prompt?:       string
  credits_used?: number
  metadata?:     Record<string, unknown>
}): Promise<string | null> {
  const db = getDb()
  const { data } = await db.from('content').insert({
    workspace_id,
    created_by:   user_id,
    type:         params.type,
    platform:     params.platform || 'general',
    status:       'draft',
    body:         params.body,
    image_url:    params.image_url,
    video_url:    params.video_url,
    prompt:       params.prompt,
    credits_used: params.credits_used || 0,
    ai_model:     'nexa-whatsapp',
    metadata:     { ...params.metadata, source: 'whatsapp' },
  }).select('id').single()
  return (data as Record<string, string> | null)?.id || null
}

// ── Pending actions ───────────────────────────────────────────
async function setPendingAction(workspace_id: string, action: Record<string, unknown>) {
  const db = getDb()
  await db.from('whatsapp_context').upsert({
    workspace_id,
    pending_action: { ...action, expires_at: new Date(Date.now() + 24*60*60*1000).toISOString() },
    updated_at:     new Date().toISOString(),
  }, { onConflict: 'workspace_id' })
}

async function getPendingAction(workspace_id: string): Promise<Record<string, unknown> | null> {
  const db = getDb()
  const { data } = await db
    .from('whatsapp_context').select('pending_action').eq('workspace_id', workspace_id).single()
  const action = (data as Record<string, unknown> | null)?.pending_action as Record<string, unknown> | null
  if (!action) return null
  if (action.expires_at && new Date(action.expires_at as string) < new Date()) {
    await clearPendingAction(workspace_id)
    return null
  }
  return action
}

async function clearPendingAction(workspace_id: string) {
  const db = getDb()
  await db.from('whatsapp_context')
    .update({ pending_action: null, updated_at: new Date().toISOString() })
    .eq('workspace_id', workspace_id)
}

// ── Audio transcription ───────────────────────────────────────
async function transcribeAudio(audioUrl: string): Promise<string | null> {
  const OPENAI_KEY = process.env.OPENAI_API_KEY
  if (!OPENAI_KEY) { console.log('[wa] no OpenAI key for transcription'); return null }
  try {
    const audioRes = await fetch(audioUrl, {
      headers: { 'Authorization': 'Basic ' + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64') }
    })
    if (!audioRes.ok) return null
    const audioBuffer = await audioRes.arrayBuffer()
    const formData = new FormData()
    formData.append('file', new Blob([audioBuffer], { type: 'audio/ogg' }), 'audio.ogg')
    formData.append('model', 'whisper-1')
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_KEY}` },
      body:    formData,
    })
    const data = await res.json() as { text?: string }
    console.log('[wa] transcribed:', data.text?.slice(0, 80))
    return data.text?.trim() || null
  } catch (e: unknown) {
    console.error('[wa] transcribe error:', (e as Error).message)
    return null
  }
}

// ── Action handlers ───────────────────────────────────────────

async function handleApprovalYes(
  from: string, workspace_id: string,
  isAr: boolean, pending: Record<string, unknown>
) {
  await clearPendingAction(workspace_id)

  if (pending.type === 'post') {
    if (pending.content_id) {
      await getDb().from('content').update({ status: 'ready' }).eq('id', pending.content_id)
    }
    await sendWA(from, isAr
      ? '✅ تم الحفظ كمسودة جاهزة في لوحة Nexa\nافتح nexaa.cc/dashboard/studio لجدولة النشر'
      : '✅ Saved as ready draft in your Nexa dashboard\nOpen nexaa.cc/dashboard/studio to schedule it')

  } else if (pending.type === 'image') {
    await sendWA(from, isAr ? '✅ تم حفظ الصورة في مكتبة Nexa' : '✅ Image saved to your Nexa library')

  } else if (pending.type === 'video') {
    await sendWA(from, isAr ? '✅ تم حفظ الفيديو في مكتبة Nexa' : '✅ Video saved to your Nexa library')

  } else if (pending.type === 'product_photo') {
    await sendWA(from, isAr
      ? '✅ تم حفظ الصور المهنية في مختبر المنتج\nهل تريد إنشاء فيديو أو منشور لهذا المنتج؟'
      : '✅ Professional photos saved to Product Lab\nWant me to create a video or post for this product?')

  } else {
    await sendWA(from, isAr ? '✅ تم' : '✅ Done')
  }
}

async function handleApprovalEdit(
  from: string, workspace_id: string, user_id: string,
  isAr: boolean, pending: Record<string, unknown>,
  editInstruction: string, originalText: string
) {
  if (pending.type !== 'post') return

  const ws = await getWorkspace(workspace_id)
  const brandName = (ws?.brand_name as string) || (ws?.name as string) || 'the brand'

  const credits = await getCredits(workspace_id)
  if (credits < 3) {
    await sendWA(from, isAr
      ? 'رصيد غير كافٍ للتعديل (يحتاج 3 كريديت)'
      : 'Insufficient credits to edit (needs 3 credits)')
    return
  }

  await sendWA(from, isAr ? 'يعدّل... ✍️' : 'Editing... ✍️')

  const response = await anthropic.messages.create({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: isAr
      ? `أنت كاتب محتوى لـ${brandName}. الصوت: ${ws?.brand_voice}. عدّل المنشور حسب التعليمات.`
      : `You are a content writer for ${brandName}. Voice: ${ws?.brand_voice}. Edit the post according to the instruction.`,
    messages: [{
      role:    'user',
      content: isAr
        ? `المنشور الحالي:\n${pending.body}\n\nالتعديل المطلوب: ${editInstruction || originalText}`
        : `Current post:\n${pending.body}\n\nEdit instruction: ${editInstruction || originalText}`
    }]
  })

  const newContent = ((response.content[0] as { type: string; text: string }).text)?.trim()
  if (!newContent) { await sendWA(from, isAr ? 'ما قدرت أعدّل' : "Couldn't edit"); return }

  const contentId = await saveContent(workspace_id, user_id, {
    type: 'post', platform: 'instagram',
    body: newContent, prompt: pending.topic as string,
    credits_used: 3,
  })
  await deductCredits(workspace_id, user_id, 3, 'post_edit_wa', 'Post edited via WhatsApp')

  await setPendingAction(workspace_id, {
    type: 'post', body: newContent, content_id: contentId, topic: pending.topic as string
  })

  const editFooter = isAr
    ? `\n\n———\n👉 *نعم* — احفظه\n👉 *تعديل [ما تريد]* — غيّره\n👉 *لا* — ألغِه`
    : `\n\n———\n👉 *yes* — save it\n👉 *edit [what]* — change it\n👉 *no* — cancel`
  await sendLongContent(from, (isAr ? 'المنشور المعدّل 👇\n\n' : 'Edited post 👇\n\n') + newContent, editFooter)
}

async function handleCreatePost(
  from: string, workspace_id: string, user_id: string,
  isAr: boolean, topic: string, platform = 'instagram'
) {
  const credits = await getCredits(workspace_id)
  if (credits < 3) {
    await sendWA(from, isAr
      ? 'رصيدك ما يكفي لكتابة منشور (يحتاج 3 كريديت). شحّن من nexaa.cc'
      : 'Not enough credits for a post (needs 3 credits). Top up at nexaa.cc')
    return
  }

  const ws = await getWorkspace(workspace_id)
  const brandName = (ws?.brand_name as string) || (ws?.name as string) || 'the brand'

  await sendWA(from, isAr ? 'يكتب... ✍️' : 'Writing your post... ✍️')

  const response = await anthropic.messages.create({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 600,
    system: isAr
      ? `أنت كاتب محتوى احترافي لـ${brandName}.\n${ws?.brandContext}\n\nقواعد التنسيق لواتساب:\n- الهوك: جملة واحدة تشدّ الانتباه\n- الجسم: ٢-٣ فقرات قصيرة، كل فقرة ٢-٣ أسطر\n- الدعوة للفعل: جملة واحدة\n- الهاشتاقات: في النهاية فقط، ١٠ كحد أقصى\n- لا جدران نص طويلة\n- سطر فارغ بين كل فقرة`
      : `You are a professional content writer for ${brandName}.\n${ws?.brandContext}\n\nFORMATTING RULES — strictly follow:\n- Hook: 1 punchy sentence that stops scrolling\n- Body: 2-3 SHORT paragraphs, max 3 lines each\n- ONE blank line between paragraphs\n- CTA: 1 short sentence\n- Hashtags: end only, max 10\n- NO walls of text\n- WhatsApp bold: *word* — use for emphasis only`,
    messages: [{
      role:    'user',
      content: isAr
        ? `اكتب منشور ${platform} احترافي عن: ${topic || 'العلامة التجارية'}`
        : `Write a professional ${platform} post about: ${topic || 'the brand'}`
    }]
  })

  const content = ((response.content[0] as { type: string; text: string }).text)?.trim()
  if (!content) {
    await sendWA(from, isAr ? 'ما قدرت أكتب المنشور، حاول مرة ثانية' : "Couldn't write the post, try again")
    return
  }

  const contentId = await saveContent(workspace_id, user_id, {
    type: 'post', platform,
    body: content, prompt: topic,
    credits_used: 3,
  })
  await deductCredits(workspace_id, user_id, 3, 'post_gen_wa', 'Post generated via WhatsApp')

  await setPendingAction(workspace_id, {
    type: 'post', body: content, content_id: contentId, topic, platform
  })

  const approvalFooter = isAr
    ? `\n\n———\n👉 *نعم* — احفظه\n👉 *تعديل [ما تريد]* — غيّره\n👉 *لا* — ألغِه`
    : `\n\n———\n👉 *yes* — save it\n👉 *edit [what]* — change it\n👉 *no* — cancel`

  const header = isAr ? 'هذا منشورك 👇\n\n' : 'Here\'s your post 👇\n\n'
  await sendLongContent(from, header + content, approvalFooter)
}

async function handleCreateImage(
  from: string, workspace_id: string, user_id: string,
  isAr: boolean, topic: string
) {
  const credits = await getCredits(workspace_id)
  if (credits < 5) {
    await sendWA(from, isAr ? 'رصيد غير كافٍ (يحتاج 5 كريديت)' : 'Not enough credits (needs 5)')
    return
  }

  const ws = await getWorkspace(workspace_id)
  const brandName = (ws?.brand_name as string) || (ws?.name as string) || 'the brand'

  await sendWA(from, isAr ? 'يولّد الصورة... 🎨 (دقيقة تقريباً)' : 'Generating image... 🎨 (about a minute)')

  try {
    const promptResponse = await anthropic.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role:    'user',
        content: `You are a creative director for ${brandName}. Visual style: ${ws?.brand_voice}.
Transform this into a professional image generation prompt (English only, max 100 words):
"${topic}"
Output ONLY the prompt, no explanation.`
      }]
    })
    const enhancedPrompt = ((promptResponse.content[0] as { type: string; text: string }).text)?.trim() || topic

    const result = await fal.subscribe('fal-ai/nano-banana-2', {
      input: {
        prompt:        enhancedPrompt,
        resolution:    '1K',
        output_format: 'png',
        num_images:    1,
      },
      logs:          false,
      onQueueUpdate: () => {},
    })

    const imageUrl = ((result as unknown) as { data: { images: Array<{ url: string }> } }).data?.images?.[0]?.url
    if (!imageUrl) throw new Error('No image URL returned')

    const contentId = await saveContent(workspace_id, user_id, {
      type: 'image', image_url: imageUrl,
      prompt: topic, credits_used: 5,
    })
    await deductCredits(workspace_id, user_id, 5, 'image_gen_wa', 'Image generated via WhatsApp')

    await setPendingAction(workspace_id, {
      type: 'image', image_url: imageUrl, content_id: contentId, topic
    })

    await sendWAMedia(from, imageUrl, isAr
      ? 'صورتك جاهزة 👆\n\n👉 *نعم* — احفظها\n👉 *فيديو* — حرّكها\n👉 *لا* — ألغِ'
      : 'Your image is ready 👆\n\n👉 *yes* — save it\n👉 *video* — animate it\n👉 *no* — cancel')

  } catch (e: unknown) {
    console.error('[wa] image gen error:', (e as Error).message)
    await sendWA(from, isAr ? 'ما قدرت أولّد الصورة' : "Couldn't generate the image")
  }
}

async function handleCreateVideo(
  from: string, workspace_id: string, user_id: string,
  isAr: boolean, topic: string
) {
  const credits = await getCredits(workspace_id)
  if (credits < 103) {
    await sendWA(from, isAr
      ? `رصيد غير كافٍ للفيديو (يحتاج ١٠٣ كريديت، رصيدك ${credits})`
      : `Not enough credits for video (needs 103, you have ${credits})`)
    return
  }

  const ws = await getWorkspace(workspace_id)
  const brandName = (ws?.brand_name as string) || (ws?.name as string) || 'the brand'

  await sendWA(from, isAr
    ? 'يولّد الفيديو... 🎬 (هذا يأخذ ٢-٣ دقائق، سأرسل لك لما ينتهي)'
    : "Generating your video... 🎬 (this takes 2-3 minutes, I'll send it when ready)")

  try {
    const promptResponse = await anthropic.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role:    'user',
        content: `You are a creative director for ${brandName}. Brand voice: ${ws?.brand_voice}.
Create a cinematic video prompt for Kling AI (English, max 120 words, describe camera movement, lighting, mood):
"${topic}"
Output ONLY the prompt.`
      }]
    })
    const videoPrompt = ((promptResponse.content[0] as { type: string; text: string }).text)?.trim() || topic

    const result = await fal.subscribe('fal-ai/kling-video/v3/standard/text-to-video', {
      input: {
        prompt:       videoPrompt,
        duration:     '8',
        aspect_ratio: '9:16',
      },
      logs:          false,
      onQueueUpdate: () => {},
    })

    const r = (result as unknown) as { data: { video?: { url?: string } } }
    const videoUrl = r.data?.video?.url
    if (!videoUrl) throw new Error('No video URL')

    const contentId = await saveContent(workspace_id, user_id, {
      type: 'video', video_url: videoUrl,
      prompt: topic, credits_used: 103,
      metadata: { duration: 8, mode: 'text', quality: 'standard' }
    })
    await deductCredits(workspace_id, user_id, 103, 'video_gen_wa', 'Video generated via WhatsApp')

    await setPendingAction(workspace_id, {
      type: 'video', video_url: videoUrl, content_id: contentId, topic
    })

    await sendWAMedia(from, videoUrl, isAr
      ? 'الفيديو جاهز 🎬👆\n\n👉 *نعم* — احفظه\n👉 *لا* — ألغِ'
      : 'Your video is ready 🎬👆\n\n👉 *yes* — save it\n👉 *no* — cancel')

  } catch (e: unknown) {
    console.error('[wa] video gen error:', (e as Error).message)
    await sendWA(from, isAr ? 'ما قدرت أولّد الفيديو' : "Couldn't generate the video")
  }
}

async function handleProductPhoto(
  from: string, workspace_id: string, user_id: string,
  isAr: boolean, mediaUrl: string
) {
  await sendWA(from, isAr
    ? 'وصلتني الصورة 📸 أشتغل عليها... (دقيقة تقريباً)'
    : 'Got your photo 📸 Processing it... (about a minute)')

  try {
    // Step 1: Detect product type via Claude Vision
    const detectResponse = await anthropic.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 150,
      messages: [{
        role:    'user',
        content: [
          { type: 'image', source: { type: 'url', url: mediaUrl } },
          { type: 'text',  text: 'Analyze this product. Respond with JSON only: {"type":"fragrance|bottle|apparel|food|accessory|electronics|cosmetic|general","name":"short product name","material":"glass|fabric|plastic|metal|organic|ceramic|general","color":"dominant color"}' }
        ]
      }]
    })
    let detected = { type: 'general', name: 'product', material: 'general', color: 'neutral' }
    try {
      const raw   = ((detectResponse.content[0] as { type: string; text: string }).text)?.trim()
      const match = raw?.match(/\{[\s\S]*\}/)
      if (match) detected = JSON.parse(match[0])
    } catch { /* keep defaults */ }
    console.log('[wa] detected product:', detected)

    // Step 2: Remove background
    const bgResult = await fal.subscribe('fal-ai/birefnet', {
      input: { image_url: mediaUrl, model: 'General Use (Light)', output_format: 'png' },
      logs: false, onQueueUpdate: () => {},
    })
    const cleanedUrl = ((bgResult as unknown) as { data: { image: { url?: string } } }).data?.image?.url || mediaUrl

    // Step 3: Studio shot via Flux Kontext
    const studioPrompt = `Place this exact product on a pure white background. Professional studio photography lighting, soft boxes from both sides. Product centered, filling 70% of frame, perfectly straight front view. Remove all original background. Keep the product exactly as it appears. Ultra sharp focus, commercial product photography.`

    const shotResult = await fal.subscribe('fal-ai/flux-pro/kontext', {
      input: {
        prompt:           studioPrompt,
        image_url:        cleanedUrl,
        output_format:    'png',
        safety_tolerance: '5',
      },
      logs: false, onQueueUpdate: () => {},
    })
    const heroUrl = ((shotResult as unknown) as { data: { images: Array<{ url: string }> } }).data?.images?.[0]?.url || cleanedUrl

    // Save to products + product_assets
    const db = getDb()
    const { data: product } = await db.from('products').insert({
      workspace_id,
      name:               detected.name,
      type:               detected.type,
      original_photos:    [mediaUrl],
      cleaned_image_url:  cleanedUrl,
    }).select('id').single()

    if (product) {
      await db.from('product_assets').insert({
        product_id:   (product as Record<string, string>).id,
        workspace_id, asset_type: 'studio',
        url:          heroUrl, credits_used: 7,
        metadata:     { shot_style: 'hero', source: 'whatsapp' },
      })
    }

    await deductCredits(workspace_id, user_id, 7, 'product_photo_wa', 'Product photo via WhatsApp')

    await setPendingAction(workspace_id, {
      type:         'product_photo',
      image_url:    heroUrl,
      cleaned_url:  cleanedUrl,
      product_name: detected.name,
      product_type: detected.type,
      product_id:   (product as Record<string, string> | null)?.id,
    })

    await sendWAMedia(from, heroUrl, isAr
      ? `${detected.name} بخلفية احترافية ✨👆\n\n👉 *المزيد* — زوايا إضافية\n👉 *فيديو* — ريل للمنتج\n👉 *منشور* — منشور مع الصورة\n👉 *نعم* — حفظ فقط`
      : `${detected.name} on professional background ✨👆\n\n👉 *more* — extra angles\n👉 *video* — make a reel\n👉 *post* — create a post\n👉 *yes* — just save it`)

  } catch (e: unknown) {
    console.error('[wa] product photo error:', (e as Error).message)
    await sendWA(from, isAr ? 'ما قدرت أعالج الصورة، حاول مرة ثانية' : "Couldn't process the photo, try again")
  }
}

async function handleBrief(from: string, workspace_id: string, isAr: boolean) {
  await sendWA(from, isAr ? 'يجهّز ملخص اليوم... ⏳' : "Preparing today's brief... ⏳")
  try {
    const ws = await getWorkspace(workspace_id)
    const cached = isAr ? ws?.weekly_brief_ar : ws?.weekly_brief
    if (cached && typeof cached === 'object') {
      const b = cached as Record<string, string>
      const briefText = `*${b.headline}*\n\n${b.todays_priority || ''}\n\n💡 ${b.one_thing || ''}`
      const briefVoice = briefText.replace(/\*/g, '').replace(/💡/g, '').trim()
      await sendVoiceNote(from, briefVoice, workspace_id, isAr)
      await new Promise(r => setTimeout(r, 1200))
      await sendWA(from, briefText)
      return
    }

    const response = await anthropic.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [{
        role:    'user',
        content: isAr
          ? `أنت مستشار تسويق خبير. إليك معلومات العلامة التجارية:\n${ws?.brandContext || ''}\n\nاكتب ملخصاً يومياً تسويقياً مخصصاً لهذه العلامة. أخرج JSON فقط:\n{"headline":"عنوان مشوّق ومرتبط بالعلامة","todays_priority":"الأولوية اليوم بناءً على هذه العلامة — جملة واحدة قوية","one_thing":"الشيء الواحد الأهم الذي يجب فعله اليوم"}`
          : `You are an expert marketing advisor. Here is the brand:\n${ws?.brandContext || ''}\n\nWrite a personalized daily marketing brief for this specific brand. JSON only:\n{"headline":"catchy headline relevant to this brand","todays_priority":"today's priority based on this brand — one powerful sentence","one_thing":"the single most important thing to do today for this brand"}`
      }]
    })
    const raw   = ((response.content[0] as { type: string; text: string }).text)?.trim()
    const match = raw?.match(/\{[\s\S]*\}/)
    if (match) {
      const brief = JSON.parse(match[0]) as Record<string, string>
      const briefText = `*${brief.headline}*\n\n${brief.todays_priority}\n\n💡 ${brief.one_thing}`
      const briefVoice = briefText.replace(/\*/g, '').replace(/💡/g, '').trim()
      await sendVoiceNote(from, briefVoice, workspace_id, isAr)
      await new Promise(r => setTimeout(r, 1200))
      await sendWA(from, briefText)
    } else {
      await sendWA(from, isAr ? 'ما قدرت أجهّز الملخص' : "Couldn't prepare the brief")
    }
  } catch (e: unknown) {
    console.error('[wa] brief error:', (e as Error).message)
    await sendWA(from, isAr ? 'صار خطأ في الملخص' : 'Error with brief')
  }
}

async function handleCheckSchedule(from: string, workspace_id: string, isAr: boolean) {
  const db = getDb()
  const { data: scheduled } = await db
    .from('content')
    .select('type, platform, scheduled_for, body')
    .eq('workspace_id', workspace_id)
    .eq('status', 'scheduled')
    .order('scheduled_for', { ascending: true })
    .limit(5)

  if (!scheduled?.length) {
    await sendWA(from, isAr
      ? "ما عندك منشورات مجدولة حالياً.\n\nقل لي \"اكتب منشور\" وأجدوله لك!"
      : "You don't have any scheduled posts right now.\n\nTell me 'write a post' and I'll schedule it for you!")
    return
  }

  const lines = (scheduled as Array<Record<string, string>>).map(s => {
    const date = s.scheduled_for
      ? new Date(s.scheduled_for).toLocaleDateString(isAr ? 'ar' : 'en', {
          weekday: 'short', month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
      : 'unscheduled'
    const preview = s.body?.slice(0, 40) || s.type
    return `📅 ${date}\n${s.platform}: ${preview}...`
  }).join('\n\n')

  await sendWA(from, isAr
    ? `منشوراتك المجدولة القادمة:\n\n${lines}`
    : `Your upcoming scheduled posts:\n\n${lines}`)
}

async function handleCheckAds(
  from: string,
  workspace_id: string,
  isAr: boolean
): Promise<void> {
  const db = getDb()

  try {
    const { data: campaigns } = await db
      .from('amplify_campaigns')
      .select('id, name, status, daily_budget, objective, created_at')
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (!campaigns?.length) {
      const msg = isAr
        ? 'ما عندك حملات إعلانية نشطة حالياً.\n\nلبدء حملة، افتح قسم Amplify في nexaa.cc'
        : "You don't have any active ad campaigns right now.\n\nTo launch a campaign, open Amplify at nexaa.cc"
      await sendWA(from, msg)
      return
    }

    const campaignSummaries = await Promise.all(
      (campaigns as any[]).slice(0, 3).map(async (camp: any) => {
        const { data: insights } = await db
          .from('amplify_insights')
          .select('spend, reach, clicks, cpc, ctr, recorded_at')
          .eq('campaign_id', camp.id)
          .order('recorded_at', { ascending: false })
          .limit(1)
        return { camp, latest: insights?.[0] }
      })
    )

    const lines = campaignSummaries.map(({ camp, latest }: any) => {
      const statusEmoji = camp.status === 'ACTIVE' ? '🟢' : camp.status === 'PAUSED' ? '⏸️' : '🔴'
      if (!latest) {
        return isAr
          ? `${statusEmoji} *${camp.name}*\nميزانية: $${camp.daily_budget}/يوم — لا بيانات بعد`
          : `${statusEmoji} *${camp.name}*\nBudget: $${camp.daily_budget}/day — no data yet`
      }
      return isAr
        ? `${statusEmoji} *${camp.name}*\nالإنفاق: $${latest.spend || 0} | الوصول: ${(latest.reach || 0).toLocaleString()} | النقرات: ${latest.clicks || 0}\nتكلفة النقرة: $${(latest.cpc || 0).toFixed(2)} | CTR: ${(latest.ctr || 0).toFixed(1)}%`
        : `${statusEmoji} *${camp.name}*\nSpend: $${latest.spend || 0} | Reach: ${(latest.reach || 0).toLocaleString()} | Clicks: ${latest.clicks || 0}\nCPC: $${(latest.cpc || 0).toFixed(2)} | CTR: ${(latest.ctr || 0).toFixed(1)}%`
    }).join('\n\n')

    const header = isAr ? '📊 *أداء إعلاناتك*\n\n' : '📊 *Your Ads Performance*\n\n'
    const footer = isAr
      ? '\n\nقل *وقّف الإعلانات* لإيقافها، أو *زيادة الميزانية* للرفع'
      : '\n\nSay *pause ads* to pause, or *increase budget* to raise it'

    await sendWA(from, header + lines + footer)

  } catch (e: unknown) {
    console.error('[wa] check ads error:', (e as Error).message)
    await sendWA(from, isAr
      ? 'ما قدرت أجلب بيانات الإعلانات، جرّب من nexaa.cc/dashboard/amplify'
      : "Couldn't fetch ad data, try at nexaa.cc/dashboard/amplify")
  }
}

async function handlePauseAds(
  from: string,
  workspace_id: string,
  isAr: boolean
): Promise<void> {
  const db = getDb()
  try {
    const { data: campaigns } = await db
      .from('amplify_campaigns')
      .select('id, name')
      .eq('workspace_id', workspace_id)
      .eq('status', 'ACTIVE')

    if (!campaigns?.length) {
      await sendWA(from, isAr ? 'ما في حملات نشطة الآن' : 'No active campaigns right now')
      return
    }

    await db
      .from('amplify_campaigns')
      .update({ status: 'PAUSED' })
      .eq('workspace_id', workspace_id)
      .eq('status', 'ACTIVE')

    const names = (campaigns as any[]).map((c: any) => c.name).join('، ')
    const msg = isAr
      ? `✅ تم إيقاف ${campaigns.length} حملة: ${names}\n\nقل *شغّل الإعلانات* لاستئنافها`
      : `✅ Paused ${campaigns.length} campaign(s): ${names}\n\nSay *resume ads* to restart`
    await sendWA(from, msg)

  } catch (e: unknown) {
    console.error('[wa] pause ads error:', (e as Error).message)
    await sendWA(from, isAr ? 'ما قدرت أوقف الإعلانات' : "Couldn't pause the ads")
  }
}

// ── Billing plan data ─────────────────────────────────────────
const PLANS_INFO: Record<string, { label: string; price: number; credits: number; features: string[] }> = {
  trial: { label: 'Trial',  price: 0,   credits: 200,   features: ['Brand Brain', 'Studio', 'Strategy', '200 credits'] },
  spark: { label: 'Spark',  price: 49,  credits: 1000,  features: ['Everything in Trial', '1,000 credits/month', 'Schedule & publish', 'Email sequences'] },
  grow:  { label: 'Grow',   price: 89,  credits: 3000,  features: ['Everything in Spark', '3,000 credits/month', 'Competitor analysis', 'Performance learning'] },
  scale: { label: 'Scale',  price: 169, credits: 7000,  features: ['Everything in Grow', '7,000 credits/month', 'Agency tools', 'Priority support'] },
  agency:{ label: 'Agency', price: 349, credits: 20000, features: ['Everything in Scale', '20,000 credits/month', 'Multi-workspace', 'White label'] },
}

// Prices in dollars, aligned with lib/plan-constants.ts (which stores in cents)
const TOPUP_PACKS_WA: Record<string, Array<{ credits: number; price: number }>> = {
  trial: [
    { credits: 200,  price: 10 },
    { credits: 500,  price: 25 },
    { credits: 1000, price: 45 },
    { credits: 2500, price: 99 },
  ],
  spark: [
    { credits: 200,  price: 10 },
    { credits: 500,  price: 25 },
    { credits: 1000, price: 45 },
    { credits: 2500, price: 99 },
  ],
  grow: [
    { credits: 500,  price: 15 },
    { credits: 1500, price: 45 },
    { credits: 3000, price: 89 },
    { credits: 7500, price: 199 },
  ],
  scale: [
    { credits: 1000,  price: 24  },
    { credits: 3500,  price: 84  },
    { credits: 7000,  price: 169 },
    { credits: 15000, price: 329 },
  ],
  agency: [
    { credits: 2500,  price: 43  },
    { credits: 7500,  price: 130 },
    { credits: 20000, price: 349 },
    { credits: 50000, price: 799 },
  ],
}

async function handleBilling(
  from: string,
  workspace_id: string,
  isAr: boolean,
  subIntent: 'overview' | 'topup' | 'upgrade' | 'topup_confirm',
  param?: string
): Promise<void> {
  const db = getDb()

  try {
    const { data: ws } = await db
      .from('workspaces')
      .select('plan, plan_status, stripe_subscription_id, trial_ends_at, name, brand_name')
      .eq('id', workspace_id)
      .single()

    const { data: credits } = await db
      .from('credits')
      .select('balance, lifetime_used')
      .eq('workspace_id', workspace_id)
      .single()

    const plan         = (ws as Record<string, string> | null)?.plan || 'trial'
    const planStatus   = (ws as Record<string, string> | null)?.plan_status || 'active'
    const balance      = (credits as Record<string, number> | null)?.balance ?? 0
    const lifetimeUsed = (credits as Record<string, number> | null)?.lifetime_used ?? 0
    const trialEndsAt  = (ws as Record<string, string> | null)?.trial_ends_at
    const planInfo     = PLANS_INFO[plan] || PLANS_INFO.trial
    const APP_URL      = process.env.NEXT_PUBLIC_APP_URL || 'https://nexaa.cc'

    let daysRemaining: number | null = null
    if (trialEndsAt) {
      const diff = new Date(trialEndsAt).getTime() - Date.now()
      daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }

    // ── OVERVIEW ────────────────────────────────────────────
    if (subIntent === 'overview') {
      const statusLine = planStatus === 'active'
        ? (isAr ? '✅ نشط' : '✅ Active')
        : planStatus === 'trialing'
        ? (isAr ? '🔶 تجريبي' : '🔶 Trial')
        : (isAr ? '⚠️ منتهي' : '⚠️ Expired')

      const trialLine = daysRemaining !== null
        ? (isAr
          ? `\n⏳ ${daysRemaining} ${daysRemaining === 1 ? 'يوم' : 'أيام'} متبقية في التجربة`
          : `\n⏳ ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left in trial`)
        : ''

      const urgentLine = daysRemaining !== null && daysRemaining <= 3
        ? (isAr
          ? `\n\n⚠️ تجربتك تنتهي قريباً! اشترك الآن لتحافظ على عملك`
          : `\n\n⚠️ Trial ending soon! Subscribe now to keep your work`)
        : ''

      const lowCredLine = balance < 50
        ? (isAr ? `\n⚠️ رصيد منخفض — شحّن الآن` : `\n⚠️ Low credits — top up now`)
        : ''

      const msg = isAr
        ? `💳 *معلومات اشتراكك*\n\nالخطة: *${planInfo.label}*  ${statusLine}${trialLine}\nرصيدك: *${balance.toLocaleString()} كريديت*${lowCredLine}\nالمستخدم إجمالاً: ${lifetimeUsed.toLocaleString()} كريديت${urgentLine}\n\nقل:\n• *"شحن كريديت"* — لشراء حزمة كريديت\n• *"ترقية الخطة"* — لرؤية خطط أفضل`
        : `💳 *Your Subscription*\n\nPlan: *${planInfo.label}*  ${statusLine}${trialLine}\nBalance: *${balance.toLocaleString()} credits*${lowCredLine}\nLifetime used: ${lifetimeUsed.toLocaleString()} credits${urgentLine}\n\nSay:\n• *"top up credits"* — to buy a credit pack\n• *"upgrade plan"* — to see better plans`

      await sendWA(from, msg)
      return
    }

    // ── TOP-UP OPTIONS ──────────────────────────────────────
    if (subIntent === 'topup') {
      const packs = TOPUP_PACKS_WA[plan] || TOPUP_PACKS_WA.spark
      const packLines = packs.map((p, i) =>
        isAr
          ? `${i + 1}. *${p.credits.toLocaleString()} كريديت* — $${p.price}`
          : `${i + 1}. *${p.credits.toLocaleString()} credits* — $${p.price}`
      ).join('\n')

      const msg = isAr
        ? `⚡ *شحن كريديت*\n\nرصيدك الحالي: ${balance.toLocaleString()} كريديت\n\nالحزم المتاحة:\n${packLines}\n\nقل رقم الحزمة لتحصل على رابط الدفع\nمثال: *"١"* أو *"حزمة ١"`
        : `⚡ *Top Up Credits*\n\nCurrent balance: ${balance.toLocaleString()} credits\n\nAvailable packs:\n${packLines}\n\nReply with the pack number to get a payment link\nExample: *"1"* or *"pack 1"*`

      await sendWA(from, msg)
      return
    }

    // ── TOP-UP CONFIRM — send billing link ──────────────────
    if (subIntent === 'topup_confirm' && param) {
      const packs       = TOPUP_PACKS_WA[plan] || TOPUP_PACKS_WA.spark
      const packIndex   = parseInt(param) - 1
      const selectedPack = packs[packIndex]

      if (!selectedPack) {
        const msg = isAr
          ? 'رقم الحزمة غير صحيح، قل *"شحن كريديت"* مرة ثانية لرؤية الخيارات'
          : 'Invalid pack number, say *"top up credits"* again to see options'
        await sendWA(from, msg)
        return
      }

      const checkoutUrl = `${APP_URL}/dashboard/settings?tab=billing&topup=${selectedPack.credits}&workspace=${workspace_id}`

      const msg = isAr
        ? `💳 *${selectedPack.credits.toLocaleString()} كريديت — $${selectedPack.price}*\n\nاضغط الرابط لإتمام الدفع:\n${checkoutUrl}\n\nبعد الدفع يُضاف الرصيد فوراً تلقائياً ✅`
        : `💳 *${selectedPack.credits.toLocaleString()} credits — $${selectedPack.price}*\n\nTap the link to complete payment:\n${checkoutUrl}\n\nCredits are added instantly after payment ✅`

      await sendWA(from, msg)
      return
    }

    // ── UPGRADE OPTIONS ─────────────────────────────────────
    if (subIntent === 'upgrade') {
      const planOrder    = ['trial', 'spark', 'grow', 'scale', 'agency']
      const currentIndex = Math.max(0, planOrder.indexOf(plan))
      const upgradePlans = planOrder.slice(currentIndex + 1)

      if (!upgradePlans.length) {
        const msg = isAr
          ? '🏆 أنت على أعلى خطة متاحة — Agency!\nشكراً لثقتك بـ Nexa'
          : "🏆 You're on the highest plan — Agency!\nThank you for trusting Nexa"
        await sendWA(from, msg)
        return
      }

      const upgradeLines = upgradePlans.map(p => {
        const info = PLANS_INFO[p]
        return isAr
          ? `• *${info.label}* — $${info.price}/شهر — ${info.credits.toLocaleString()} كريديت`
          : `• *${info.label}* — $${info.price}/mo — ${info.credits.toLocaleString()} credits`
      }).join('\n')

      const nextPlan  = upgradePlans[0]
      const nextInfo  = PLANS_INFO[nextPlan]
      const upgradeUrl = `${APP_URL}/dashboard/settings?tab=billing&upgrade=${nextPlan}&workspace=${workspace_id}`

      const msg = isAr
        ? `🚀 *ترقية خطتك*\n\nخطتك الحالية: *${planInfo.label}* ($${planInfo.price}/شهر)\n\nالخيارات المتاحة:\n${upgradeLines}\n\nللترقية لـ *${nextInfo.label}*:\n${upgradeUrl}`
        : `🚀 *Upgrade Your Plan*\n\nCurrent plan: *${planInfo.label}* ($${planInfo.price}/mo)\n\nAvailable upgrades:\n${upgradeLines}\n\nTo upgrade to *${nextInfo.label}*:\n${upgradeUrl}`

      await sendWA(from, msg)
      return
    }

  } catch (e: unknown) {
    console.error('[wa] handleBilling error:', (e as Error).message)
    const msg = isAr
      ? 'ما قدرت أجلب معلومات الاشتراك، جرّب من nexaa.cc/dashboard/settings'
      : "Couldn't load subscription info, try at nexaa.cc/dashboard/settings"
    await sendWA(from, msg)
  }
}

async function handleBrandUpdate(
  from: string, workspace_id: string,
  isAr: boolean, info: string
) {
  const db = getDb()
  await db.from('brand_learnings').insert({
    workspace_id,
    content:  info,
    source:   'whatsapp',
    topic:    'brand_update',
    metadata: { raw: info, lang: isAr ? 'ar' : 'en' },
  }).then(() => {}, () => {})

  const reply = await anthropic.messages.create({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 150,
    messages: [{
      role:    'user',
      content: isAr
        ? `المستخدم شارك معلومة جديدة عن علامته: "${info}". رد بـ ١-٢ جمل تؤكد أنك سجّلتها وستستخدمها. بالعربية الخليجية.`
        : `User shared new brand info: "${info}". Reply in 1-2 sentences confirming you've noted it and will use it.`
    }]
  })
  const replyText = ((reply.content[0] as { type: string; text: string }).text)?.trim()
  await sendWA(from, replyText || (isAr ? 'تم التسجيل ✓' : 'Noted ✓'))
}

// ── XML response helper ───────────────────────────────────────
function xmlResponse() {
  return new NextResponse('<?xml version="1.0"?><Response></Response>', {
    headers: { 'Content-Type': 'text/xml' }
  })
}

// ── Nexa conversational brain ─────────────────────────────────
async function nexaBrain(
  from:        string,
  workspace_id: string,
  user_id:     string,
  userMessage: string,
  history:     ChatMessage[],
  ws:          WorkspaceData | null,
  pending:     Record<string, unknown> | null,
  isAr:        boolean,
  lang:        string,
): Promise<void> {
  const brandName = (ws?.brand_name as string) || (ws?.name as string) || 'the brand'
  const credits   = await getCredits(workspace_id)
  const phone     = from.replace('whatsapp:', '')

  // Handle top-up pack selection (user replied with a number after seeing topup options)
  if (pending?.type === 'topup_selection') {
    const num = userMessage.trim().match(/^[١٢٣٤1234]/)
    if (num) {
      const packNum = num[0]
        .replace('١', '1').replace('٢', '2')
        .replace('٣', '3').replace('٤', '4')
      await clearPendingAction(workspace_id)
      await handleBilling(from, workspace_id, isAr, 'topup_confirm', packNum)
      return
    }
  }

  const systemPrompt = isAr ? `
أنت Nexa — المساعد الذكي لعلامة ${brandName}. أنت لست بوتاً — أنت زميل ذكي يفهم التسويق ويعرف هذه العلامة جيداً.

معلومات العلامة التجارية:
${ws?.brandContext || `العلامة: ${brandName}`}

رصيد الكريديت الحالي: ${credits} كريديت

قدراتك — يمكنك فعل هذه الأشياء فعلياً:
- كتابة منشورات سوشيال ميديا (3 كريديت)
- توليد صور احترافية (5 كريديت)
- توليد فيديوهات وريلز (103 كريديت)
- معالجة صور المنتجات وإزالة الخلفية (7 كريديت)
- عرض ملخص اليوم التسويقي
- عرض الجدول والمنشورات المجدولة
- التحقق من الاشتراك والرصيد والخطة (show_billing)
- عرض خيارات شحن الكريديت (show_topup)
- عرض خيارات الترقية (show_upgrade)
- التحقق من أداء الإعلانات (check_ads)
- إيقاف الحملات الإعلانية (pause_ads)
- استئناف الحملات الموقوفة (resume_ads)
- الإجابة على أسئلة التسويق والاستراتيجية

${pending ? `يوجد إجراء معلق ينتظر موافقتك: ${JSON.stringify(pending)}` : ''}

قواعد المحادثة:
- تحدث بالعربية الخليجية الطبيعية — لا فصحى جافة
- اسأل سؤالاً واحداً فقط إذا احتجت توضيحاً
- إذا كان الطلب واضحاً — اعمل مباشرة بدون أسئلة
- الردود قصيرة: ٢-٣ جمل للمحادثة العادية
- لا تقل "أنا ذكاء اصطناعي" أو "لا أستطيع"
- أنت تعرف هذه العلامة جيداً — تصرف من هذا المنطلق

عندما تريد تنفيذ إجراء، أضف في نهاية ردك سطراً خاصاً:
ACTION:create_post:الموضوع هنا
ACTION:create_image:الموضوع هنا
ACTION:create_video:الموضوع هنا
ACTION:show_brief
ACTION:show_billing        ← نظرة عامة على الاشتراك والخطة والرصيد
ACTION:show_topup          ← خيارات شحن الكريديت
ACTION:show_upgrade        ← خيارات ترقية الخطة
ACTION:show_credits        ← رصيد الكريديت السريع فقط
ACTION:show_schedule
ACTION:approve_pending
ACTION:cancel_pending
ACTION:edit_pending:تعليمات التعديل
ACTION:check_ads
ACTION:pause_ads
ACTION:resume_ads

أمثلة: "اشتراكي" / "خطتي" / "كم باقي" → ACTION:show_billing | "شحن" / "أضف كريديت" → ACTION:show_topup | "ترقية" / "خطة أفضل" → ACTION:show_upgrade | "رصيد" / "كريديت" → ACTION:show_credits

سطر ACTION غير مرئي للمستخدم — يشغّل وظائف Nexa الحقيقية.
إذا لم يكن هناك إجراء، رد بشكل طبيعي فقط بدون سطر ACTION.
` : `
You are Nexa — the AI team member for ${brandName}. You are NOT a bot — you are a smart colleague who deeply understands marketing and knows this brand inside out.

Brand Intelligence:
${ws?.brandContext || `Brand: ${brandName}`}

Current credit balance: ${credits} credits

Your real capabilities — you can actually DO these things:
- Write social media posts (3 credits)
- Generate professional images (5 credits)
- Generate videos and reels (103 credits)
- Process product photos, remove backgrounds (7 credits)
- Show today's marketing brief
- Show scheduled content calendar
- Check credit balance and subscription details (show_billing)
- Show top-up credit pack options (show_topup)
- Show upgrade plan options (show_upgrade)
- Check ad performance and results (check_ads)
- Pause running ad campaigns (pause_ads)
- Resume paused ad campaigns (resume_ads)
- Answer marketing and strategy questions

${pending ? `There is a PENDING ACTION awaiting approval: ${JSON.stringify(pending)}` : ''}

Conversation rules:
- Sound like a smart friend who knows marketing — not a corporate bot
- Ask ONE clarifying question only if truly needed
- If the request is clear — act immediately without asking
- Keep conversational replies SHORT: 2-3 sentences max
- Never say "I'm an AI" or "I cannot"
- You KNOW this brand — speak from that knowledge
- Use *bold* sparingly for emphasis in WhatsApp

When you want to take an action, add a special line at the END of your reply:
ACTION:create_post:topic here
ACTION:create_image:topic here
ACTION:create_video:topic here
ACTION:show_brief
ACTION:show_billing        ← full subscription overview (plan, status, days left, lifetime usage)
ACTION:show_topup          ← credit top-up options with pack list
ACTION:show_upgrade        ← plan upgrade options with pricing
ACTION:show_credits        ← quick credit balance only
ACTION:show_schedule
ACTION:approve_pending
ACTION:cancel_pending
ACTION:edit_pending:edit instructions here
ACTION:check_ads
ACTION:pause_ads
ACTION:resume_ads

Examples: "what plan am i on?" / "subscription info" / "days left" → ACTION:show_billing | "top up" / "buy credits" / "recharge" → ACTION:show_topup | "upgrade" / "change plan" / "better plan" → ACTION:show_upgrade | "credits" / "balance" → ACTION:show_credits

The ACTION line is invisible to the user — it triggers real Nexa functions.
If no action needed, just reply naturally without any ACTION line.
`

  const messages: ChatMessage[] = [
    ...history,
    { role: 'user', content: userMessage },
  ]

  try {
    const response = await anthropic.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 600,
      system:     systemPrompt,
      messages,
    })

    const fullReply  = ((response.content[0] as { type: string; text: string }).text)?.trim() || ''
    const actionMatch = fullReply.match(/\nACTION:([^\n]+)/)
    const cleanReply  = fullReply.replace(/\nACTION:[^\n]+/g, '').trim()
    const actionFull  = actionMatch?.[1]?.trim() || ''
    const [actionType] = actionFull.split(':')

    // Decide voice vs text
    const isFirstMessage = history.length === 0
    const useVoice = shouldUseVoice(
      cleanReply,
      userMessage,
      actionType || null,
      isFirstMessage,
    )

    console.log('[wa-brain] reply length:', cleanReply.length, '| voice:', useVoice, '| action:', actionType || 'none')

    // Send the conversational reply
    if (cleanReply) {
      if (useVoice) {
        await sendVoiceNote(from, cleanReply, workspace_id, isAr)
      } else {
        await sendWA(from, cleanReply)
      }
      await logOutbound(workspace_id, phone, cleanReply)
    }

    // Execute action with small delay
    if (actionMatch && actionFull) {
      const [actionType2, ...actionParams] = actionFull.split(':')
      const actionParam = actionParams.join(':').trim()

      console.log('[wa] nexaBrain action:', actionType2, '|', actionParam)
      await new Promise(r => setTimeout(r, 800))

      switch (actionType2) {
        case 'create_post':
          await handleCreatePost(from, workspace_id, user_id, isAr, actionParam || userMessage, 'instagram')
          break
        case 'create_image':
          await handleCreateImage(from, workspace_id, user_id, isAr, actionParam || userMessage)
          break
        case 'create_video':
          await handleCreateVideo(from, workspace_id, user_id, isAr, actionParam || userMessage)
          break
        case 'show_brief':
          await handleBrief(from, workspace_id, isAr)
          break
        case 'show_billing':
          await handleBilling(from, workspace_id, isAr, 'overview')
          break

        case 'show_topup':
          await handleBilling(from, workspace_id, isAr, 'topup')
          await setPendingAction(workspace_id, {
            type: 'topup_selection',
            expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          })
          break

        case 'show_upgrade':
          await handleBilling(from, workspace_id, isAr, 'upgrade')
          break

        case 'show_credits': {
          const bal = await getCredits(workspace_id)
          const credMsg = isAr
            ? `رصيدك: *${bal.toLocaleString()} كريديت* 💳\n${bal < 50 ? '⚠️ منخفض — قل "شحن كريديت"' : '✅ كافٍ للعمل'}`
            : `Balance: *${bal.toLocaleString()} credits* 💳\n${bal < 50 ? '⚠️ Running low — say "top up credits"' : '✅ Good to go'}`
          await sendWA(from, credMsg)
          await logOutbound(workspace_id, phone, credMsg)
          break
        }
        case 'show_schedule':
          await handleCheckSchedule(from, workspace_id, isAr)
          break
        case 'approve_pending':
          if (pending) await handleApprovalYes(from, workspace_id, isAr, pending)
          break
        case 'cancel_pending':
          await clearPendingAction(workspace_id)
          await sendWA(from, isAr ? 'تم الإلغاء ✓' : 'Cancelled ✓')
          break
        case 'edit_pending':
          if (pending) await handleApprovalEdit(from, workspace_id, user_id, isAr, pending, actionParam, userMessage)
          break
        case 'check_ads':
          await handleCheckAds(from, workspace_id, isAr)
          break
        case 'pause_ads':
          await handlePauseAds(from, workspace_id, isAr)
          break
        case 'resume_ads': {
          const dbAds = getDb()
          await dbAds
            .from('amplify_campaigns')
            .update({ status: 'ACTIVE' })
            .eq('workspace_id', workspace_id)
            .eq('status', 'PAUSED')
          await sendWA(from, isAr ? '✅ تم تشغيل الحملات مرة ثانية' : '✅ Campaigns resumed')
          break
        }
        case 'brand_doc':
          // Handled at top of POST handler for media
          break
      }
    }

  } catch (e: unknown) {
    console.error('[wa] nexaBrain error:', (e as Error).message)
    const fallback = isAr ? 'صار خطأ ما، حاول مرة ثانية' : 'Something went wrong, try again'
    await sendWA(from, fallback)
    await logOutbound(workspace_id, phone, fallback)
  }
}

// ── GET handler ───────────────────────────────────────────────
export async function GET() {
  return NextResponse.json({ status: 'Nexa WhatsApp active' })
}

// ── POST handler — main entry point ───────────────────────────
export async function POST(request: NextRequest) {
  console.log('[wa-webhook] POST at', new Date().toISOString())

  let body: Record<string, string> = {}
  try {
    const formData = await request.formData()
    formData.forEach((v, k) => { body[k] = v.toString() })
  } catch (e: unknown) {
    console.error('[wa-webhook] formData error:', (e as Error).message)
    return new NextResponse(XML_EMPTY, { headers: XML_HEADERS })
  }

  const from      = body.From || ''
  const msgBody   = body.Body || ''
  const numMedia  = parseInt(body.NumMedia || '0')
  const mediaUrl  = body.MediaUrl0 || ''
  const mediaType = body.MediaContentType0 || ''

  console.log('[wa-webhook] from:', from, '| body:', msgBody.slice(0, 80), '| media:', numMedia)

  const phone = from.replace('whatsapp:', '').trim()

  const conn = await resolveWorkspace(phone)
  if (!conn) {
    await sendWA(from,
      `Hey! I'm Nexa 🤖\n\nTo connect your number, go to nexaa.cc → Settings → WhatsApp and enter your number.\n\nOnce connected you control everything from WhatsApp!`)
    return new NextResponse(XML_EMPTY, { headers: XML_HEADERS })
  }

  const { workspace_id, user_id, lang } = conn
  const isAr = lang === 'ar'

  // Handle all media types
  let processText = msgBody
  if (numMedia > 0) {
    const isPDF   = mediaType.includes('pdf')
    const isDoc   = mediaType.includes('msword') ||
                    mediaType.includes('document') ||
                    mediaType.includes('text/plain') ||
                    isPDF
    const isImage = mediaType.startsWith('image/')
    const isAudio = mediaType.startsWith('audio/')

    if (isAudio) {
      const transcribed = await transcribeAudio(mediaUrl)
      if (transcribed) {
        processText = transcribed
        console.log('[wa-webhook] audio→text:', processText.slice(0, 80))
      } else {
        const msg = isAr
          ? 'ما قدرت أفهم الرسالة الصوتية، ممكن تكتب؟'
          : "Couldn't understand the voice message, could you type it?"
        await sendWA(from, msg)
        return xmlResponse()
      }
    } else if (isDoc || isPDF) {
      await handleDocumentTraining(from, workspace_id, user_id, mediaUrl, mediaType, isAr)
      return xmlResponse()
    } else if (isImage) {
      // Check message body for context — brand-related = training, else = product photo
      const bodyLower = (msgBody || '').toLowerCase()
      const isBrandDoc = /brand|logo|document|catalogue|catalog|كتالوج|وثيقة|شعار/.test(bodyLower)
      if (isBrandDoc) {
        await handleDocumentTraining(from, workspace_id, user_id, mediaUrl, mediaType, isAr)
      } else {
        await handleProductPhoto(from, workspace_id, user_id, isAr, mediaUrl)
      }
      return xmlResponse()
    }
  }

  // Log inbound message
  const db = getDb()
  await db.from('whatsapp_messages').insert({
    workspace_id,
    phone_number:  phone,
    direction:     'inbound',
    message_type:  numMedia > 0 ? (mediaType.startsWith('image') ? 'image' : 'audio') : 'text',
    body:          processText?.slice(0, 1000) || msgBody?.slice(0, 1000),
  }).then(() => {}, () => {})

  // Fetch history, workspace data, pending action in parallel
  const [history, ws, pending] = await Promise.all([
    getConversationHistory(workspace_id),
    getWorkspace(workspace_id),
    getPendingAction(workspace_id),
  ])

  console.log('[wa-webhook] history length:', history.length, '| pending:', pending?.type || 'none')

  // Run the conversational brain — handles everything
  await nexaBrain(from, workspace_id, user_id, processText, history, ws, pending, isAr, lang)

  return xmlResponse()
}
