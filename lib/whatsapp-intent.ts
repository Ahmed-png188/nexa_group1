import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export type Intent =
  | 'create_post'
  | 'create_image'
  | 'create_video'
  | 'create_reel'
  | 'product_photo'
  | 'morning_brief'
  | 'check_stats'
  | 'check_credits'
  | 'check_ads'
  | 'pause_ads'
  | 'increase_budget'
  | 'publish_content'
  | 'schedule_content'
  | 'brand_update'
  | 'brand_question_answer'
  | 'approval_yes'
  | 'approval_no'
  | 'approval_edit'
  | 'general_question'
  | 'greeting'
  | 'unknown'

export interface IntentResult {
  intent:     Intent
  confidence: 'high' | 'medium' | 'low'
  params:     Record<string, string>
  lang:       'en' | 'ar'
  reply_type: 'text' | 'voice' | 'media'
  summary:    string  // one line describing what was understood
}

export async function classifyIntent(
  message:     string,
  messageType: string,  // 'text' | 'audio' | 'image' | 'video' | 'document'
  context:     unknown,         // whatsapp_context row
  lang:        'en' | 'ar',
  brandName:   string,
): Promise<IntentResult> {

  const ctx = context as Record<string, unknown> | null
  const hasPending = ctx?.pending_action && (ctx.pending_action as Record<string, unknown>)?.type

  const systemPrompt = `You are Nexa's message intelligence system. You classify WhatsApp messages from business owners into actionable intents.

The user's brand is: ${brandName}
Their preferred language: ${lang}
Message type received: ${messageType}
${hasPending ? `IMPORTANT: There is a pending action awaiting approval: ${JSON.stringify((ctx!.pending_action as Record<string, unknown>)?.type)} — check if this message is approving, rejecting, or editing it.` : ''}

INTENT TYPES:
- create_post: wants a social media post written (text content)
- create_image: wants an AI image generated
- create_video: wants a video generated
- create_reel: wants a short video/reel
- product_photo: sent a product image, wants professional photos
- morning_brief: asking for today's content brief or strategy
- check_stats: asking about performance, views, engagement
- check_credits: asking about credit balance or plan
- check_ads: asking about ad campaign performance
- pause_ads: wants to pause running ads
- increase_budget: wants to increase ad budget
- publish_content: wants to publish something now
- schedule_content: wants to schedule something
- brand_update: sharing new info about their brand (new product, price change, etc.)
- brand_question_answer: answering one of Nexa's weekly brand training questions
- approval_yes: approving a pending action (says yes, approve, publish, looks good, etc.)
- approval_no: rejecting a pending action (says no, cancel, don't, etc.)
- approval_edit: wants to edit a pending action before approving
- general_question: asking a general question about their brand, marketing, etc.
- greeting: just saying hello, good morning, etc.
- unknown: cannot determine intent

LANGUAGE DETECTION: Detect language from the message itself. Arabic script = ar, Latin = en.

Return ONLY valid JSON:
{
  "intent": "the_intent",
  "confidence": "high|medium|low",
  "params": {
    "platform": "instagram|linkedin|x|tiktok if mentioned",
    "content_type": "post|reel|story|carousel if mentioned",
    "topic": "what the content should be about if mentioned",
    "edit_instruction": "what they want changed if approval_edit",
    "brand_info": "the new brand information if brand_update",
    "question_answer": "their answer to the brand question if brand_question_answer"
  },
  "lang": "en|ar",
  "reply_type": "voice for morning_brief and content delivery, text for everything else",
  "summary": "One line: what the user wants in plain English"
}`

  try {
    const response = await anthropic.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 400,
      system:     systemPrompt,
      messages: [{
        role:    'user',
        content: `Message: "${message}"\nMessage type: ${messageType}`,
      }],
    })

    const raw   = (response.content[0] as { type: string; text: string }).text?.trim()
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON')
    return JSON.parse(match[0]) as IntentResult

  } catch (err) {
    console.error('[intent] classification failed:', err)
    return {
      intent:     'unknown',
      confidence: 'low',
      params:     {},
      lang,
      reply_type: 'text',
      summary:    'Could not classify message',
    }
  }
}

// ── Generate a conversational Nexa response ───────────────────────────────
// This is how Nexa "talks" — friendly, direct, like a team member
export async function generateNexaReply(
  situation: string,
  brandName: string,
  lang:      'en' | 'ar',
  context:   unknown,
): Promise<string> {

  const ctx = context as Record<string, unknown> | null
  const conversationHistory = (ctx?.conversation_summary as string) || ''

  const systemPrompt = lang === 'ar'
    ? `أنت Nexa — المساعد الذكي لـ${brandName}. تتحدث بالعربية الخليجية الدافئة، مثل صديق يفهم التسويق. لا تبدأ بـ "مرحباً" في كل رسالة. كن مباشراً ودافئاً وخفيفاً. الرسائل قصيرة — لا تتجاوز 3 جمل إلا عند الضرورة. لا تستخدم إيموجي أكثر من واحد في الرسالة.`
    : `You are Nexa — the AI team member for ${brandName}. You talk like a smart friend who really knows marketing. Don't start every message with "Hi" or "Hello". Be direct, warm, and natural. Messages are short — max 3 sentences unless delivering content. Max 1 emoji per message.`

  const userContent = lang === 'ar'
    ? `السياق: ${conversationHistory || 'بداية المحادثة'}\n\nالموقف: ${situation}\n\nاكتب رد Nexa الطبيعي على هذا الموقف. لا تكثر الكلام.`
    : `Context: ${conversationHistory || 'start of conversation'}\n\nSituation: ${situation}\n\nWrite Nexa's natural reply to this situation. Keep it tight.`

  try {
    const response = await anthropic.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 300,
      system:     systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    })
    return (response.content[0] as { type: string; text: string }).text?.trim()
      || (lang === 'ar' ? 'تم ✓' : 'Done ✓')
  } catch {
    return lang === 'ar' ? 'صار خطأ ما، حاول مرة ثانية' : 'Something went wrong, try again'
  }
}

// ── Generate brand training question ──────────────────────────────────────
export async function generateBrandQuestion(
  brand:          unknown,
  askedQuestions: string[],
  lang:           'en' | 'ar',
): Promise<string> {

  const b = brand as Record<string, unknown> | null
  const ws = b?.workspace as Record<string, unknown> | null
  const brandName = (b?.brandName as string) || (ws?.brand_name as string) || 'your brand'

  const systemPrompt = lang === 'ar'
    ? `أنت Nexa. تسأل أسئلة أسبوعية لفهم العلامة التجارية بشكل أعمق. السؤال يجب أن يكون محادثياً وطبيعياً — كصديق فضولي، لا استبياناً. جملة أو جملتان فقط. لا تكرر الأسئلة المسبقة.`
    : `You are Nexa. You ask weekly questions to better understand the brand. The question must feel conversational and natural — like a curious friend, not a survey. One or two sentences max. Never repeat a question already asked.`

  const prompt = lang === 'ar'
    ? `العلامة التجارية: ${brandName}
الأسئلة المطروحة مسبقاً: ${askedQuestions.slice(-5).join(' | ') || 'لا يوجد'}

اكتب سؤالاً جديداً ومفيداً عن العلامة التجارية. يجب أن يكون محادثياً ومباشراً. لا تذكر أنك "تتعلم" أو "تحلل". فقط اسأل بشكل طبيعي.`
    : `Brand: ${brandName}
Questions already asked: ${askedQuestions.slice(-5).join(' | ') || 'none yet'}

Write a new, useful brand question. Must feel conversational and direct. Don't mention that you're "learning" or "analyzing". Just ask naturally.`

  const questionBank = lang === 'ar' ? [
    `${brandName}، لو كان في شخص واحد يمثل عميلك المثالي — وصّفه لي`,
    `ما اللي تبي الناس تحس فيه لما تشوف منتجك؟`,
    `في منافس تتمنى لو كنت صاحبه — مين هو ولماذا؟`,
    `ما اللي يميزك عن كل الثاني في السوق؟ بكلامك أنت`,
    `لو عندك ميزانية غير محدودة وأسبوع كامل — ايش تسوي لعلامتك؟`,
    `أرسل لي ٣ صور تعبر عن الشعور اللي تبي علامتك تخليه`,
    `ما اللي ما تبي تشوفه أبداً في محتوى علامتك؟`,
    `مين عميلك اللي تفتخر فيه أكثر شي؟`,
    `وش المشكلة اللي يحلها منتجك في حياة الناس؟`,
    `لو Nexa ينشر محتوى بشكل مستقل — ما هو الشيء الوحيد اللي لازم تعرفه؟`,
  ] : [
    `If there was one person who perfectly represents your ideal customer — describe them to me`,
    `What do you want people to feel the moment they see your product?`,
    `Is there a competitor you secretly respect — who and why?`,
    `What genuinely sets you apart from everyone else? In your own words`,
    `If you had unlimited budget and a week — what would you do for your brand?`,
    `Send me 3 photos that capture the feeling you want your brand to create`,
    `What's one thing you never want to see in your brand's content?`,
    `Which customer are you most proud of? Tell me about them`,
    `What real problem does your product solve in someone's day?`,
    `If Nexa was posting on autopilot — what's the one thing it absolutely must know?`,
  ]

  // Return a question from the bank that hasn't been asked
  const unused = questionBank.filter(q => !askedQuestions.some(asked =>
    asked.toLowerCase().includes(q.slice(0, 20).toLowerCase())
  ))

  if (unused.length > 0) {
    return unused[Math.floor(Math.random() * unused.length)]
  }

  // If all used, generate a new one via Claude
  try {
    const response = await anthropic.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 150,
      system:     systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    })
    return (response.content[0] as { type: string; text: string }).text?.trim() || questionBank[0]
  } catch {
    return questionBank[0]
  }
}
