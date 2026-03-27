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

async function getWorkspace(workspace_id: string) {
  const db = getDb()
  const { data } = await db
    .from('workspaces')
    .select('brand_name, brand_voice, brand_audience, brand_tone, name, weekly_brief, weekly_brief_ar')
    .eq('id', workspace_id)
    .single()
  return data as Record<string, unknown> | null
}

async function getBrandName(workspace_id: string): Promise<string> {
  const ws = await getWorkspace(workspace_id)
  return (ws?.brand_name as string) || (ws?.name as string) || 'your brand'
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

// ── Smart intent classifier ───────────────────────────────────
type Intent = 'greeting' | 'credits' | 'brief' | 'create_post' | 'create_image'
  | 'create_video' | 'product_photo' | 'approval_yes' | 'approval_no'
  | 'approval_edit' | 'check_ads' | 'check_schedule' | 'schedule_post'
  | 'brand_update' | 'general'

function quickIntent(b: string): Intent | null {
  const t = b.toLowerCase().trim()
  if (!t || t.length < 2) return 'greeting'
  if (/^(hi|hello|hey|مرحب|أهلا|هلا|السلام|صباح|مساء|كيف حالك)/.test(t)) return 'greeting'
  if (/^(yes|نعم|اوكي|ok|okay|اي|ايوه|تمام|وافق|انشر|نشر|publish|approve|موافق)$/.test(t)) return 'approval_yes'
  if (/^(no|لا|cancel|إلغاء|الغِ|لأ|ما ابي)$/.test(t)) return 'approval_no'
  if (/^(redo|أعد|اعد|أعيد|غيّر|اكتب ثاني)/.test(t)) return 'create_post'
  if (/credit|رصيد|كريديت|balance|كم عندي|كم رصيد/.test(t)) return 'credits'
  if (/schedule|جدول|متى ينشر|مواعيد/.test(t)) return 'check_schedule'
  return null
}

async function classifyIntent(text: string, hasPending: boolean, isAr: boolean): Promise<{ intent: Intent; params: Record<string, string> }> {
  const quick = quickIntent(text)
  if (quick) return { intent: quick, params: {} }

  try {
    const response = await anthropic.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 200,
      system: `Classify the intent of this WhatsApp message to a marketing AI assistant.
${hasPending ? 'IMPORTANT: There is a pending approval waiting. Check if this is approving, rejecting, or editing it.' : ''}

Respond with JSON only:
{
  "intent": "greeting|credits|brief|create_post|create_image|create_video|product_photo|approval_yes|approval_no|approval_edit|check_ads|check_schedule|schedule_post|brand_update|general",
  "params": {
    "topic": "what to create about (if creation intent)",
    "platform": "instagram|linkedin|tiktok (if mentioned)",
    "edit_instruction": "what to change (if approval_edit)",
    "brand_info": "new brand information (if brand_update)",
    "schedule_time": "when to post (if schedule_post)"
  }
}`,
      messages: [{ role: 'user', content: text }],
    })
    const raw   = ((response.content[0] as { type: string; text: string }).text)?.trim()
    const match = raw?.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0]) as { intent: Intent; params: Record<string, string> }
  } catch (e: unknown) {
    console.error('[wa] intent classify error:', (e as Error).message)
  }
  return { intent: 'general', params: {} }
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

  await sendWA(from, isAr
    ? `المنشور المعدّل 👇\n\n${newContent}\n\n———\nرد بـ *نعم* للحفظ أو اطلب تعديلاً آخر`
    : `Edited post 👇\n\n${newContent}\n\n———\nReply *yes* to save or request another edit`)
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
      ? `أنت كاتب محتوى احترافي لـ${brandName}. الصوت: ${ws?.brand_voice || 'مهني وجذاب'}. الجمهور: ${ws?.brand_audience || 'العملاء المحتملون'}. النبرة: ${ws?.brand_tone || 'واثق'}. اكتب بالعربية الخليجية الطبيعية. المنشور يجب أن يبدأ بهوك قوي.`
      : `You are a professional content writer for ${brandName}. Voice: ${ws?.brand_voice || 'professional, engaging'}. Audience: ${ws?.brand_audience || 'target customers'}. Tone: ${ws?.brand_tone || 'confident'}. Start with a strong hook. End with a call to action. Hashtags at the end only.`,
    messages: [{
      role:    'user',
      content: isAr
        ? `اكتب منشور ${platform} احترافي عن: ${topic || 'العلامة التجارية وقيمتها'}`
        : `Write a professional ${platform} post about: ${topic || 'the brand and its value'}`
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

  await sendWA(from, isAr
    ? `هذا منشورك 👇\n\n${content}\n\n———\nرد بـ:\n*نعم* — للحفظ كمسودة جاهزة\n*تعديل [ما تريد]* — لتغييره\n*لا* — للإلغاء`
    : `Here's your post 👇\n\n${content}\n\n———\nReply:\n*yes* — save as ready draft\n*edit [what you want]* — to change it\n*no* — to cancel`)
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
      ? 'صورتك جاهزة 👆\n\nرد بـ *نعم* للحفظ، *فيديو* لتحريكها، أو *لا* للإلغاء'
      : 'Your image is ready 👆\n\nReply *yes* to save, *video* to animate it, or *no* to cancel')

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
      ? 'الفيديو جاهز 🎬👆\n\nرد بـ *نعم* للحفظ أو *لا* للإلغاء'
      : 'Your video is ready 🎬👆\n\nReply *yes* to save or *no* to cancel')

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
      ? `${detected.name} بخلفية احترافية ✨👆\n\nرد بـ:\n*المزيد* — لقطات إضافية (جانب، من أعلى)\n*فيديو* — ريل لهذا المنتج\n*منشور* — منشور مع هذه الصورة\n*نعم* — حفظ فقط`
      : `${detected.name} on professional background ✨👆\n\nReply:\n*more* — additional angles (side, top)\n*video* — make a reel for this product\n*post* — create a post with this image\n*yes* — just save it`)

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
      await sendWA(from, `*${b.headline}*\n\n${b.todays_priority || ''}\n\n💡 ${b.one_thing || ''}`)
      return
    }

    const brandName = (ws?.brand_name as string) || (ws?.name as string) || 'your brand'
    const response = await anthropic.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [{
        role:    'user',
        content: isAr
          ? `أنت مستشار تسويق لـ${brandName} (${ws?.brand_voice || 'مهني'}). الجمهور: ${ws?.brand_audience || 'عملاء'}. اكتب ملخصاً يومياً تسويقياً. أخرج JSON فقط: {"headline":"عنوان مشوّق","todays_priority":"الأولوية اليوم — جملة واحدة قوية","one_thing":"الشيء الواحد الذي يجب فعله اليوم"}`
          : `You are a marketing advisor for ${brandName} (${ws?.brand_voice || 'professional'}). Audience: ${ws?.brand_audience}. Write a daily marketing brief. JSON only: {"headline":"catchy headline","todays_priority":"today's priority — one strong sentence","one_thing":"the one thing to do today"}`
      }]
    })
    const raw   = ((response.content[0] as { type: string; text: string }).text)?.trim()
    const match = raw?.match(/\{[\s\S]*\}/)
    if (match) {
      const brief = JSON.parse(match[0]) as Record<string, string>
      await sendWA(from, `*${brief.headline}*\n\n${brief.todays_priority}\n\n💡 ${brief.one_thing}`)
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

  const pending = await getPendingAction(workspace_id)
  console.log('[wa-webhook] pending:', pending?.type || 'none')

  // Handle image — product photo
  if (numMedia > 0 && mediaType.startsWith('image/')) {
    await handleProductPhoto(from, workspace_id, user_id, isAr, mediaUrl)
    return new NextResponse(XML_EMPTY, { headers: XML_HEADERS })
  }

  // Handle audio — transcribe first
  let processText = msgBody
  if (numMedia > 0 && mediaType.startsWith('audio/')) {
    const transcribed = await transcribeAudio(mediaUrl)
    if (transcribed) {
      processText = transcribed
      console.log('[wa-webhook] audio→text:', processText.slice(0, 80))
    } else {
      await sendWA(from, isAr
        ? 'ما قدرت أفهم الرسالة الصوتية، ممكن تكتب لي؟'
        : "Couldn't understand the voice message, could you type it?")
      return new NextResponse(XML_EMPTY, { headers: XML_HEADERS })
    }
  }

  // Classify intent
  const { intent, params } = await classifyIntent(processText, !!pending, isAr)
  console.log('[wa-webhook] intent:', intent, '| params:', JSON.stringify(params))

  // Handle pending approval
  if (pending) {
    if (intent === 'approval_yes') {
      await handleApprovalYes(from, workspace_id, isAr, pending)
      return new NextResponse(XML_EMPTY, { headers: XML_HEADERS })
    }
    if (intent === 'approval_no') {
      await clearPendingAction(workspace_id)
      await sendWA(from, isAr ? 'تم الإلغاء ✓' : 'Cancelled ✓')
      return new NextResponse(XML_EMPTY, { headers: XML_HEADERS })
    }
    if (intent === 'approval_edit'
      || processText.toLowerCase().startsWith('edit')
      || /^تعديل|^عدّل/.test(processText)) {
      await handleApprovalEdit(from, workspace_id, user_id, isAr, pending, params.edit_instruction || processText, processText)
      return new NextResponse(XML_EMPTY, { headers: XML_HEADERS })
    }
  }

  // Product photo follow-up
  if (pending?.type === 'product_photo') {
    const t = processText.toLowerCase()
    if (/more|المزيد|زيادة/.test(t)) {
      await sendWA(from, isAr ? 'يولّد المزيد من الزوايا...' : 'Generating more angles...')
      try {
        const sideResult = await fal.subscribe('fal-ai/flux-pro/kontext', {
          input: {
            prompt:           'Place this exact product on a pure white background showing exact side profile at 90 degrees. Professional studio lighting. Remove all original background.',
            image_url:        pending.cleaned_url as string || pending.image_url as string,
            output_format:    'png',
            safety_tolerance: '5',
          },
          logs: false, onQueueUpdate: () => {},
        })
        const sideUrl = ((sideResult as unknown) as { data: { images: Array<{ url: string }> } }).data?.images?.[0]?.url
        if (sideUrl) await sendWAMedia(from, sideUrl, isAr ? 'الصورة الجانبية 👆' : 'Side profile 👆')
      } catch (e: unknown) { console.error('[wa] side shot error:', (e as Error).message) }
      return new NextResponse(XML_EMPTY, { headers: XML_HEADERS })
    }
    if (/video|فيديو|reel|ريل/.test(t)) {
      await handleCreateVideo(from, workspace_id, user_id, isAr, `professional product video for ${pending.product_name || 'this product'}`)
      return new NextResponse(XML_EMPTY, { headers: XML_HEADERS })
    }
    if (/post|منشور/.test(t)) {
      await handleCreatePost(from, workspace_id, user_id, isAr, `product showcase post for ${pending.product_name || 'this product'}`, 'instagram')
      return new NextResponse(XML_EMPTY, { headers: XML_HEADERS })
    }
  }

  // Main intent routing
  switch (intent) {

    case 'greeting': {
      const brandName = await getBrandName(workspace_id)
      await sendWA(from, isAr
        ? `أهلاً! أنا Nexa لـ ${brandName} 🎯\n\nكلّمني وقت ما تبي:\n• "اكتب لي منشور"\n• "كم رصيدي؟"\n• "ملخص اليوم"\n• "ولّد صورة"\n• "ولّد فيديو"\n• أو أرسل صورة منتجك`
        : `Hey! I'm Nexa for ${brandName} 🎯\n\nTell me anytime:\n• "Write me a post"\n• "How many credits?"\n• "Today's brief"\n• "Generate an image"\n• "Generate a video"\n• Or send a product photo`)
      break
    }

    case 'credits': {
      const balance = await getCredits(workspace_id)
      await sendWA(from, isAr
        ? `رصيدك: *${balance.toLocaleString()} كريديت* 💳\n${balance < 50 ? '⚠️ منخفض — شحّن من nexaa.cc' : '✅ كافٍ'}`
        : `Balance: *${balance.toLocaleString()} credits* 💳\n${balance < 50 ? '⚠️ Low — top up at nexaa.cc' : '✅ Good to go'}`)
      break
    }

    case 'brief':
      await handleBrief(from, workspace_id, isAr)
      break

    case 'create_post':
      await handleCreatePost(from, workspace_id, user_id, isAr,
        params.topic || processText, params.platform || 'instagram')
      break

    case 'create_image':
      await handleCreateImage(from, workspace_id, user_id, isAr,
        params.topic || processText)
      break

    case 'create_video':
      await handleCreateVideo(from, workspace_id, user_id, isAr,
        params.topic || processText)
      break

    case 'check_schedule':
      await handleCheckSchedule(from, workspace_id, isAr)
      break

    case 'brand_update':
      await handleBrandUpdate(from, workspace_id, isAr,
        params.brand_info || processText)
      break

    case 'check_ads':
      await sendWA(from, isAr
        ? "لمراجعة الإعلانات وأداءها، افتح قسم Amplify في nexaa.cc\n\nقريباً ستتمكن من مراقبة الإعلانات مباشرة من هنا!"
        : "To review your ads performance, open the Amplify section at nexaa.cc\n\nSoon you'll be able to monitor and control ads directly from here!")
      break

    default: {
      try {
        const ws = await getWorkspace(workspace_id)
        const bn = (ws?.brand_name as string) || (ws?.name as string) || 'the brand'
        const response = await anthropic.messages.create({
          model:      'claude-sonnet-4-20250514',
          max_tokens: 300,
          system: isAr
            ? `أنت Nexa، مساعد تسويق ذكي لـ${bn}. الصوت: ${ws?.brand_voice || 'مهني'}. رد بالعربية الخليجية الطبيعية، مفيد ومختصر، ٣ جمل كحد أقصى. إذا طلب المستخدم شيئاً تستطيع فعله (منشور، صورة، فيديو) — أخبره كيف يطلبه بشكل أوضح.`
            : `You are Nexa, AI marketing assistant for ${bn}. Voice: ${ws?.brand_voice || 'professional'}. Be helpful and brief, max 3 sentences. If the user wants something you can do (post, image, video) — tell them how to ask more clearly.`,
          messages: [{ role: 'user', content: processText }],
        })
        const reply = ((response.content[0] as { type: string; text: string }).text)?.trim()
        await sendWA(from, reply || (isAr ? 'كيف أقدر أساعدك؟' : 'How can I help?'))
      } catch (e: unknown) {
        console.error('[wa] general reply error:', (e as Error).message)
        await sendWA(from, isAr ? 'كيف أقدر أساعدك؟' : 'How can I help?')
      }
      break
    }
  }

  return new NextResponse(XML_EMPTY, { headers: XML_HEADERS })
}
