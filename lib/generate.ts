// ─────────────────────────────────────────────────────────────
// NEXA GENERATION ENGINE
// Every AI generation in the product flows through here.
// Lang determines: system prompt, user prompt language,
// and tone of output. Not a single robotic Arabic string.
// ─────────────────────────────────────────────────────────────

import Anthropic from '@anthropic-ai/sdk'
import { ARABIC_VOICE_SYSTEM_PROMPT, ENGLISH_VOICE_SYSTEM_PROMPT } from '../lib/prompts'
import type { Lang } from '../lib/language-context'

const anthropic = new Anthropic()

type GenerationTask =
  | 'tagline'
  | 'bio'
  | 'insight'
  | 'strategy'
  | 'caption'
  | 'thread'
  | 'email'
  | 'blog'
  | 'ad'
  | 'script'
  | 'chat'

interface GenerateParams {
  lang: Lang
  task: GenerationTask
  brandName?: string
  industry?: string
  tone?: string
  audience?: string
  topic?: string
  platform?: string
  message?: string           // for chat
  brandContext?: string      // Brand Brain summary passed into every call
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
}

// ─── ARABIC PROMPT BUILDERS ──────────────────────────────────
// Every prompt is written IN Arabic — this is what forces
// the model to reason natively, not translate.

function buildArabicPrompt(params: GenerateParams): string {
  const { task, brandName, industry, tone, audience, topic, platform, message, brandContext } = params

  const context = brandContext
    ? `\nسياق العلامة:\n${brandContext}\n`
    : ''

  const prompts: Record<GenerationTask, string> = {
    tagline: `${context}
اكتب شعارًا واحدًا فقط لعلامة "${brandName}" في مجال ${industry}.
النبرة: ${tone ?? 'هادئة وواثقة'}.
شرط واحد: شعار واحد. بلا شرح. بلا خيارات. بلا نقطة في النهاية.
الوزن أهم من الطول.`,

    bio: `${context}
اكتب نبذة تعريفية قصيرة لعلامة "${brandName}" في مجال ${industry}.
جمهورها: ${audience ?? 'رواد الأعمال والمؤسسون'}.
النبرة: ${tone ?? 'هادئة وواثقة'}.
حد أقصى: ثلاث جمل. لا تبدأ بـ "نحن". لا وعود. فقط هوية واضحة.`,

    insight: `${context}
بناءً على مجال ${industry}،
اكتب رؤية واحدة عميقة تخص علامة "${brandName}".
جملة أو جملتان فقط. شيء يجعل القارئ يتوقف ويفكّر.
لا تعليمات. لا قوائم. رؤية واحدة فقط.`,

    strategy: `${context}
ضع توجهًا استراتيجيًا لعلامة "${brandName}" في مجال ${industry}.
الجمهور: ${audience ?? 'رواد الأعمال'}.
النبرة: ${tone ?? 'هادئة وواثقة'}.
ثلاث ركائز استراتيجية. كل ركيزة: عنوان قصير + جملة توضيحية واحدة.
لا تضخيم. لا كلام فارغ.`,

    caption: `${context}
اكتب تعليقًا لمنشور ${platform ?? 'إنستغرام'} لعلامة "${brandName}".
الموضوع: ${topic}.
النبرة: ${tone ?? 'هادئة وواثقة'}.
قصير. يحمل وزنًا. يجعل القارئ يتوقف.
لا هاشتاقات إلا إذا طُلبت.`,

    thread: `${context}
اكتب سلسلة تغريدات (٤–٦ تغريدات) لعلامة "${brandName}".
الموضوع: ${topic}.
النبرة: ${tone ?? 'هادئة وواثقة'}.
كل تغريدة تقف وحدها وتدفع القارئ للتالية.
رقّم كل تغريدة: ١/ ٢/ ٣/ ...`,

    email: `${context}
اكتب بريدًا إلكترونيًا تسويقيًا لعلامة "${brandName}".
الموضوع: ${topic}.
الجمهور: ${audience ?? 'رواد الأعمال'}.
النبرة: ${tone ?? 'هادئة وواثقة'}.
السطر الأول يجب أن يشدّ. الباقي يقود. النهاية تدعو لخطوة واحدة فقط.`,

    blog: `${context}
اكتب مقدمة مقالة لعلامة "${brandName}" في مجال ${industry}.
الموضوع: ${topic}.
النبرة: ${tone ?? 'هادئة وواثقة'}.
فقرتان إلى ثلاث. تفتح سؤالًا، تبني توتر، تدعو للقراءة.`,

    ad: `${context}
اكتب نصًا إعلانيًا لعلامة "${brandName}".
الموضوع/المنتج: ${topic}.
المنصة: ${platform ?? 'إنستغرام'}.
النبرة: ${tone ?? 'جريئة وواضحة'}.
العنوان + جملة واحدة + دعوة لإجراء. بلا مبالغة.`,

    script: `${context}
اكتب سكريبت فيديو قصير لعلامة "${brandName}".
الموضوع: ${topic}.
النبرة: ${tone ?? 'هادئة وواثقة'}.
٣٠–٦٠ ثانية. خطاف قوي. رسالة واحدة. نهاية واضحة.`,

    chat: `${context}
${message}`
  }

  return prompts[task]
}

// ─── ENGLISH PROMPT BUILDERS ─────────────────────────────────

function buildEnglishPrompt(params: GenerateParams): string {
  const { task, brandName, industry, tone, audience, topic, platform, message, brandContext } = params

  const context = brandContext
    ? `\nBrand context:\n${brandContext}\n`
    : ''

  const prompts: Record<GenerationTask, string> = {
    tagline: `${context}Write one tagline for "${brandName}" in ${industry}. Tone: ${tone ?? 'calm and confident'}. One line. No explanation. No period.`,
    bio: `${context}Write a short brand bio for "${brandName}" in ${industry}. Audience: ${audience ?? 'entrepreneurs'}. Tone: ${tone ?? 'calm and confident'}. Max 3 sentences. Don't start with "We."`,
    insight: `${context}Write one sharp brand insight for "${brandName}" in ${industry}. One or two sentences. Make it stop the reader.`,
    strategy: `${context}Write 3 strategic pillars for "${brandName}" in ${industry}. Audience: ${audience ?? 'entrepreneurs'}. Tone: ${tone ?? 'calm and confident'}. Each: short title + one sentence. No filler.`,
    caption: `${context}Write a ${platform ?? 'Instagram'} caption for "${brandName}". Topic: ${topic}. Tone: ${tone ?? 'calm and confident'}. Short. Weighted. Makes them stop scrolling.`,
    thread: `${context}Write a 4–6 tweet thread for "${brandName}". Topic: ${topic}. Tone: ${tone ?? 'calm and confident'}. Each tweet stands alone and pulls to the next. Number them: 1/ 2/ 3/...`,
    email: `${context}Write a marketing email for "${brandName}". Subject: ${topic}. Audience: ${audience ?? 'entrepreneurs'}. Tone: ${tone ?? 'calm and confident'}. Hook in line one. One clear CTA at the end.`,
    blog: `${context}Write a blog intro for "${brandName}" in ${industry}. Topic: ${topic}. Tone: ${tone ?? 'calm and confident'}. 2–3 paragraphs. Opens a question, builds tension, earns the read.`,
    ad: `${context}Write ad copy for "${brandName}". Product/topic: ${topic}. Platform: ${platform ?? 'Instagram'}. Tone: ${tone ?? 'bold and clear'}. Headline + one line + CTA. No hype.`,
    script: `${context}Write a short video script for "${brandName}". Topic: ${topic}. Tone: ${tone ?? 'calm and confident'}. 30–60 seconds. Strong hook. One message. Clear ending.`,
    chat: `${context}${message}`
  }

  return prompts[task]
}

// ─── MAIN GENERATE FUNCTION ──────────────────────────────────

export async function generate(params: GenerateParams): Promise<string> {
  const { lang, task, conversationHistory } = params

  const systemPrompt = lang === 'ar'
    ? ARABIC_VOICE_SYSTEM_PROMPT
    : ENGLISH_VOICE_SYSTEM_PROMPT

  const userPrompt = lang === 'ar'
    ? buildArabicPrompt(params)
    : buildEnglishPrompt(params)

  // For chat: include full conversation history
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> =
    task === 'chat' && conversationHistory?.length
      ? [...conversationHistory, { role: 'user', content: userPrompt }]
      : [{ role: 'user', content: userPrompt }]

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: systemPrompt,
    messages
  })

  const block = response.content[0]
  return block.type === 'text' ? block.text.trim() : ''
}

// ─── STREAMING VERSION (for real-time chat feel) ─────────────

export async function generateStream(
  params: GenerateParams,
  onChunk: (chunk: string) => void,
  onDone: () => void
): Promise<void> {
  const { lang, task, conversationHistory } = params

  const systemPrompt = lang === 'ar'
    ? ARABIC_VOICE_SYSTEM_PROMPT
    : ENGLISH_VOICE_SYSTEM_PROMPT

  const userPrompt = lang === 'ar'
    ? buildArabicPrompt(params)
    : buildEnglishPrompt(params)

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> =
    task === 'chat' && conversationHistory?.length
      ? [...conversationHistory, { role: 'user', content: userPrompt }]
      : [{ role: 'user', content: userPrompt }]

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: systemPrompt,
    messages
  })

  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'text_delta'
    ) {
      onChunk(chunk.delta.text)
    }
  }

  onDone()
}
