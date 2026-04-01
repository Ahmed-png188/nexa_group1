import Anthropic from '@anthropic-ai/sdk'
import { CREATIVE_DIRECTOR_PROMPT } from './prompts'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE PROMPT ENHANCER — bilingual
// ─────────────────────────────────────────────────────────────────────────────
export async function enhanceImagePrompt(
  userPrompt: string,
  brandContext: any,
  lang: 'en' | 'ar' = 'en'
): Promise<string> {
  const brand       = brandContext?.workspace?.brand_name || 'this brand'
  const visual      = brandContext?.profile?.visual?.aesthetic || 'premium, modern, professional'
  const colors      = brandContext?.profile?.visual?.color_mood || brandContext?.profile?.visual?.colors || 'rich, deep tones'
  const photoStyle  = brandContext?.profile?.visual?.photography_style || 'professional brand photography'
  const composition = brandContext?.profile?.visual?.composition || 'clean, purposeful'
  const industry    = brandContext?.profile?.business?.industry || 'professional services'
  const customPfx   = brandContext?.profile?.generation_instructions?.image_prompt_prefix || ''

  const teamBriefing = brandContext?.unifiedBriefing
    ? (lang === 'ar' ? `\nموجز الفريق:\n${brandContext.unifiedBriefing}` : `\nTeam Briefing:\n${brandContext.unifiedBriefing}`)
    : ''

  const prompt = lang === 'ar'
    ? `أنت مصور تجاري ومدير فني على مستوى عالمي. حوّل هذا الوصف البسيط إلى موجّه احترافي ينتج صورة لا تُميَّز من التصوير الحقيقي.

قواعد غير قابلة للتفاوض:
- يجب أن تبدو الصورة وكأنها صورة فوتوغرافية حقيقية، لا صورة ذكاء اصطناعي
- البشرة البشرية: مسام مرئية، شوائب طبيعية، قوام حقيقي
- المنتجات: قوام مادي حقيقي، انعكاسات واقعية، وزن وعمق
- لا بشرة بلاستيكية، لا حواف مضيئة، لا ضبابية حالمة
- الضوء يجب أن يكون له مصدر حقيقي — سمِّه تحديداً
- دائماً حدد الكاميرا والعدسة
- دائماً حدد درجة الألوان أو مرجع فيلم
- دائماً حدد أسلوب التكوين

العلامة: ${brand} | الجماليات: ${visual} | الألوان: ${colors} | التصوير: ${photoStyle} | التكوين: ${composition} | القطاع: ${industry}${customPfx ? ' | ' + customPfx : ''}${teamBriefing}

أخرج الموجّه المحسَّن فقط. ١٤٠ كلمة كحد أقصى. بلا تفسير.
الوصف البسيط: "${userPrompt}"`
    : `You are a world-class commercial photographer and art director. Transform this basic image prompt into a professional photographic brief that produces results indistinguishable from a real professional photoshoot.

CRITICAL RULES — non-negotiable:
- Output must look like a real photograph, NOT AI-generated
- Human skin must look real: pores visible, natural imperfections, real texture, subsurface scattering
- Products must look real: actual material texture, real reflections, weight and depth
- No plastic-looking skin, no glowing edges, no dreamlike blur
- Light must have a real source — name it specifically
- Always include a specific camera and lens equivalent
- Always include a specific color grade or film stock reference
- Always include composition technique (rule of thirds, leading lines, negative space, etc.)

Brand: ${brand} | Aesthetic: ${visual} | Colors: ${colors} | Photography: ${photoStyle} | Composition: ${composition} | Industry: ${industry}${customPfx ? ' | ' + customPfx : ''}${teamBriefing}

Output ONLY the enhanced prompt. Maximum 140 words. No explanation. No preamble.
Basic prompt to enhance: "${userPrompt}"`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  })

  return (response.content[0] as any).text.trim()
}

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO PROMPT ENHANCER — bilingual
// ─────────────────────────────────────────────────────────────────────────────
export async function enhanceVideoPrompt(
  userPrompt: string,
  brandContext: any,
  lang: 'en' | 'ar' = 'en'
): Promise<string> {
  const brand     = brandContext?.workspace?.brand_name || 'this brand'
  const industry  = brandContext?.profile?.business?.industry || 'professional services'
  const tone      = brandContext?.profile?.voice?.primary_tone || 'confident, premium'
  const aesthetic = brandContext?.profile?.visual?.aesthetic || 'premium and modern'
  const colorMood = brandContext?.profile?.visual?.color_mood || 'rich sophisticated tones'
  const vidStyle  = brandContext?.profile?.visual?.video_style || 'cinematic brand content'
  const audience  = brandContext?.profile?.audience?.primary || 'professional audience'
  const customPfx = brandContext?.profile?.generation_instructions?.video_prompt_prefix || ''

  const brandDNA = lang === 'ar'
    ? [
        `العلامة: ${brand}`,
        `القطاع: ${industry}`,
        `النبرة: ${tone}`,
        `الجماليات البصرية: ${aesthetic}`,
        `مزاج الألوان: ${colorMood}`,
        `أسلوب الفيديو: ${vidStyle}`,
        `الجمهور: ${audience}`,
        customPfx ? `توجيه العلامة المخصص: ${customPfx}` : '',
      ].filter(Boolean).join('\n')
    : [
        `Brand: ${brand}`,
        `Industry: ${industry}`,
        `Tone: ${tone}`,
        `Visual aesthetic: ${aesthetic}`,
        `Color palette mood: ${colorMood}`,
        `Video style: ${vidStyle}`,
        `Audience: ${audience}`,
        customPfx ? `Custom brand direction: ${customPfx}` : '',
      ].filter(Boolean).join('\n')

  const videoBriefing = brandContext?.unifiedBriefing
    ? (lang === 'ar' ? `\nموجز الفريق:\n${brandContext.unifiedBriefing}` : `\nTeam Briefing:\n${brandContext.unifiedBriefing}`)
    : ''

  const prompt = lang === 'ar'
    ? `أنت مدير إبداعي صوّر حملات لـ Nike وApple وChanel وRolex. لا تصنع فيديوهات جميلة فحسب — تصنع فيديوهات لا تُخطئ هوية العلامة.

هوية العلامة البصرية (كل قرار إبداعي يخدم هذا):
${brandDNA}${videoBriefing}

قواعد غير قابلة للتفاوض:
- يجب أن يبدو الإنتاج حقيقياً، لا مُولَّداً بذكاء اصطناعي
- كل عنصر يعكس هوية العلامة: الألوان، الحركة، الطاقة، الإضاءة
- حدد حركة الكاميرا التي تناسب طاقة العلامة (فاخر = بطيء، طاقة = ديناميكي، تقني = ثابت)
- حدد الإضاءة التي تناسب مزاج الألوان
- حدد درجة الألوان التي تناسب الجماليات
- حدد الإيقاع الذي يناسب نبرة العلامة
- لا كلمات مبهمة — أظهر ما تعنيه "سينمائي" لهذه العلامة تحديداً

أخرج الموجّه المحسَّن فقط. ١٦٠ كلمة كحد أقصى. بلا تفسير.
الوصف البسيط: "${userPrompt}"`
    : `You are a creative director who has shot campaigns for Nike, Apple, Chanel and Rolex. You don't just make beautiful videos — you make videos that feel unmistakably like a specific brand.

BRAND DNA (every creative decision must serve this):
${brandDNA}${videoBriefing}

CRITICAL RULES — non-negotiable:
- Output must look like a REAL film production, not AI-generated
- Every element must reinforce the brand DNA above — color, motion style, energy level, and lighting must all align with the brand aesthetic
- Specify exact camera movement that matches the brand energy (luxury = slow orbit/dolly, energy brand = dynamic handheld, tech = clean locked-off)
- Specify lighting that matches the color mood (warm golden for warmth brands, cool blue-white for tech, dramatic key for bold brands)
- Specify color grade that matches the visual aesthetic
- Specify pace that matches brand tone
- Never use vague words — always show what "cinematic" or "premium" means specifically for THIS brand
- One specific film or campaign reference if relevant to the brand world

Output ONLY the enhanced prompt. Maximum 160 words. No explanation.
Basic prompt: "${userPrompt}"`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 350,
    system: CREATIVE_DIRECTOR_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  })

  return (response.content[0] as any).text.trim()
}

// ─────────────────────────────────────────────────────────────────────────────
// VOICE SCRIPT ENHANCER — bilingual
// The Arabic version adds tajweed-style delivery notation
// ─────────────────────────────────────────────────────────────────────────────
export async function enhanceVoiceScript(
  script: string,
  brandContext: any,
  lang: 'en' | 'ar' = 'en'
): Promise<string> {
  const tone = brandContext?.profile?.voice?.primary_tone || 'confident, authoritative'

  const prompt = lang === 'ar'
    ? `أنت مخرج صوتي يفهم الإيقاع العربي والنبرة الخليجية. أضف علامات التوصيل الاحترافية لهذا النص.

نظام علامات التوصيل:
- [توقف] = توقف نصف ثانية متعمد
- [نبضة] = توقف ثانية للوقع والتأثير
- [توقف طويل] = توقف ثانيتين للدراما
- *كلمة* = تأكيد — أبطأ وأعلى قليلاً
- (بهدوء) = خفض الصوت والدفء
- (بناء) = زيادة الطاقة تدريجياً
- (هبوط) = تباطؤ ودع الكلمة تنزل

قواعد:
- لا تزيد على ٤ علامات في الجملة الواحدة
- التوقفات تُكسَب، لا تُفرض
- التأكيد يكشف المعنى، لا يزينه
- السطر الأول دائماً يعقبه [نبضة]
- السطر الأخير دائماً يتباطأ
- النبرة: ${tone}
- احتفظ بالروح الخليجية — لا تحوّله إلى فصحى جافة

أخرج النص مع العلامات فقط. بلا تفسير.
النص: "${script}"`
    : `You are a voice director who has directed Morgan Freeman, David Attenborough style narrations, and premium brand campaigns. Add professional delivery notation to this script.

DELIVERY NOTATION SYSTEM:
- [pause] = 0.5 second deliberate pause
- [beat] = 1 second pause for weight
- [long pause] = 2 second pause for drama
- *word* = emphasized word, slightly louder and slower
- (softer) = drop volume and intimacy
- (building) = gradually increase energy
- (landing) = slow down, let it land

RULES:
- Never add more than 4 notations per sentence
- Pauses should feel earned, not mechanical
- Emphasis should reveal meaning, not decorate
- The opening line should always have one beat after it
- The closing line should always slow down
- Brand tone: ${tone}

Output ONLY the marked-up script with delivery notations. No explanation.
Script: "${script}"`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  })

  return (response.content[0] as any).text.trim()
}

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE-TO-VIDEO PROMPT ENHANCER — bilingual
// ─────────────────────────────────────────────────────────────────────────────
export async function enhanceImageToVideoPrompt(
  userPrompt: string,
  brandContext: any,
  mode: 'image' | 'frame',
  lang: 'en' | 'ar' = 'en'
): Promise<string> {
  const brand     = brandContext?.workspace?.brand_name || 'this brand'
  const industry  = brandContext?.profile?.business?.industry || 'professional services'
  const tone      = brandContext?.profile?.voice?.primary_tone || 'confident, premium'
  const aesthetic = brandContext?.profile?.visual?.aesthetic || 'premium and modern'
  const colorMood = brandContext?.profile?.visual?.color_mood || 'rich, sophisticated tones'
  const vidStyle  = brandContext?.profile?.visual?.video_style || 'cinematic brand content'
  const customPfx = brandContext?.profile?.generation_instructions?.video_prompt_prefix || ''

  const brandDNA = lang === 'ar'
    ? `العلامة: ${brand}\nالقطاع: ${industry}\nالنبرة: ${tone}\nالجماليات البصرية: ${aesthetic}\nمزاج الألوان: ${colorMood}\nأسلوب الفيديو: ${vidStyle}${customPfx ? `\nتوجيه مخصص: ${customPfx}` : ''}`
    : `Brand: ${brand}\nIndustry: ${industry}\nTone: ${tone}\nVisual aesthetic: ${aesthetic}\nColor palette mood: ${colorMood}\nVideo style: ${vidStyle}${customPfx ? `\nCustom brand direction: ${customPfx}` : ''}`

  const modeContext = lang === 'ar'
    ? mode === 'image'
      ? 'المستخدم يحوّل صورة ثابتة إلى فيديو. الحركة يجب أن تكون مقصودة وراقية — لا عشوائية. حدد حركة كاميرا تحترم تكوين الصورة الأصلية.'
      : 'المستخدم يصنع فيديو ينتقل بين إطار بداية وإطار نهاية. الحركة يجب أن تربط الإطارين بشكل طبيعي وسينمائي.'
    : mode === 'image'
      ? 'The user is animating a STILL IMAGE into a video. The motion should feel intentional and premium — not random. Enhance with specific camera movement that respects the composition of the original image.'
      : 'The user is creating a video that TRANSITIONS between a start frame and end frame. The motion should connect both frames naturally and cinematically.'

  const prompt = lang === 'ar'
    ? `أنت مدير إبداعي في وكالة من الدرجة الأولى — النوع الذي يصنع حملات بورش وآبل ورولكس. تفهم الهوية البصرية وتترجمها إلى حركة سينمائية.

${modeContext}

هوية العلامة البصرية:
${brandDNA}

مهمتك كمدير إبداعي:
- خذ وصف المستخدم وارفعه بلغة حركة تناسب العلامة
- حدد حركة كاميرا تناسب جماليات العلامة (فاخر = بطيء متعمد؛ طاقة = ديناميكي)
- حدد إضاءة تعزز مزاج الألوان
- حدد عنصر الحركة الأهم الواحد — ماذا يتحرك، كيف، ولماذا
- ١٥٠ كلمة كحد أقصى
- أخرج الموجّه المحسَّن فقط — بلا تفسير

وصف المستخدم: "${userPrompt || 'حرّك هذه الصورة بأسلوب سينمائي'}"`
    : `You are a creative director at a top-tier brand agency — the kind that shoots campaigns for Porsche, Apple, and Rolex. You understand brand identity deeply and translate it into cinematic motion.

${modeContext}

BRAND DNA (use this to ensure every creative decision is on-brand):
${brandDNA}

AS CREATIVE DIRECTOR, your job is to:
1. Take the user's basic prompt and elevate it with brand-appropriate motion language
2. Specify camera movement that matches the brand's aesthetic (luxury = slow, deliberate; energy brands = dynamic, kinetic)
3. Specify lighting that reinforces the color mood
4. Specify the ONE most important motion element — what moves, how it moves, why it moves
5. Reference the brand's visual tone in the motion style

RULES:
- Every word must serve the brand aesthetic
- Motion must feel INTENTIONAL, not random
- Maximum 150 words
- Output ONLY the enhanced prompt — no explanation, no preamble

User's prompt: "${userPrompt || 'animate this brand image cinematically'}"`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 350,
    messages: [{ role: 'user', content: prompt }],
  })

  return (response.content[0] as any).text.trim()
}

// ─────────────────────────────────────────────────────────────────────────────
// TEXT CONTENT ANTI-ROBOT REFINER — Arabic only
// Runs AFTER generation to humanize Arabic output
// ─────────────────────────────────────────────────────────────────────────────
export async function humanizeArabicContent(
  content: string,
  brandContext: any
): Promise<string> {
  const brandName = brandContext?.workspace?.brand_name || 'هذه العلامة'
  const tone      = brandContext?.profile?.voice?.primary_tone || 'واثق، مباشر'
  const audience  = brandContext?.profile?.audience?.primary || 'عملاء محتملون'

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `أنت محرر لغوي خبير في الكتابة الإبداعية العربية. مهمتك: اجعل هذا المحتوى يبدو وكأنه كتبه إنسان يعرف ما يفعل — لا آلة تقلّد الكتابة.

علامة: ${brandName} | النبرة: ${tone} | الجمهور: ${audience}

قواعد التحرير:
١. احذف أي جملة تبدأ بـ "في عالم..." أو "في ظل..." أو "لا شك أن..." — مبتذلة
٢. احذف: "بكل تأكيد" / "يسعدنا" / "نفخر بتقديم" / "الحل الأمثل" / "المتكامل"
٣. قصّر الجمل الطويلة — إذا تجاوزت ٢٠ كلمة، اكسرها
٤. افتح بجملة تشدّ الانتباه، لا بتعريف
٥. احتفظ بنبرة خليجية دافئة — لا تحوّله إلى فصحى جافة
٦. لا تغير المعنى — فقط اجعله أكثر إنسانية
٧. إذا كان المحتوى جيداً بالفعل، أعده كما هو بلا تعديل مبالغ فيه

أخرج المحتوى المحرَّر فقط. بلا تفسير.
المحتوى: "${content}"`,
    }],
  })

  return (response.content[0] as any).text.trim()
}

// ─────────────────────────────────────────────────────────────────────────────
// STORYBOARD / COMMERCIAL DIRECTOR — bilingual
// Returns structured shot plan for Kling multi_prompt image-to-video
// ─────────────────────────────────────────────────────────────────────────────
export async function enhanceStoryboardPrompts(
  userDirection: string,
  brandContext: any,
  shotCount: number,
  durationPerShot: number,
  outputFormat: string,
  lang: 'en' | 'ar' = 'en'
): Promise<{
  commercial_concept: string
  environment: string
  master_style: string
  color_grade: string
  lighting_setup: string
  shots: Array<{ prompt: string; duration: number; shot_label: string }>
  commercial_hook: string
}> {
  const brand     = brandContext?.workspace?.brand_name     || 'the brand'
  const voice     = brandContext?.workspace?.brand_voice    || 'premium, confident'
  const audience  = brandContext?.workspace?.brand_audience || 'modern consumers'
  const tone      = brandContext?.workspace?.brand_tone     || 'sophisticated'
  const aesthetic = brandContext?.profile?.visual?.aesthetic || 'cinematic, premium'
  const colorMood = brandContext?.profile?.visual?.color_mood || 'rich, warm tones'
  const vidStyle  = brandContext?.profile?.visual?.video_style || 'luxury brand film'
  const industry  = brandContext?.profile?.business?.industry || 'consumer goods'
  const customPfx = brandContext?.profile?.generation_instructions?.video_prompt_prefix || ''

  const formatLabel = outputFormat === '9:16'
    ? 'vertical 9:16 (Stories/Reels)'
    : outputFormat === '16:9'
      ? 'cinematic widescreen 16:9'
      : 'square 1:1 (feed post)'

  const systemPrompt = `You are the Creative Director at a world-class production house.
You have directed commercial campaigns for Chanel, Apple, Nike, and Rolex.
You think in narrative arcs, not individual shots.

Your job: given a product and a brand, write a complete ${shotCount}-shot
commercial that feels like a $500,000 production — not AI-generated content.

ABSOLUTE RULES for every shot prompt you write:
- Write in English always (Kling performs best in English)
- Every shot MUST feel like it belongs to the same commercial — same world, same light, same energy
- Be specific: name the lens (35mm, 85mm), name the lighting (golden key light, diffused overhead), name the movement (slow push, aerial orbit, locked-off hero)
- Reference real filmmaking technique — this is a brief for a real DP
- The product is always the hero — it must appear prominently in every shot
- No generic words like "beautiful" or "amazing" — show the technique
- Each shot prompt must start with the camera/movement, then product placement, then environment, then mood
- Format: "[Camera movement]. [Product appearance]. [Environment detail]. [Lighting]. [Mood/atmosphere]. Shot on [lens equivalent], [color reference]."
- Maximum 80 words per shot prompt

SHOT FLOW LAW — always follow this narrative arc:
Shot 1: Establish the world (environment, mood, brand universe)
Shot 2: Introduce the hero (product enters the scene)
Shot 3: Intimacy/detail (close-up, texture, the product's soul)
${shotCount > 3 ? `Shot 4: Aspiration (product in context, lifestyle moment)` : ''}
${shotCount === 5 ? 'Shot 5: Brand close (tagline moment, emotional peak)' : ''}`

  const userPrompt = `Brand DNA:
Brand: ${brand}
Industry: ${industry}
Voice: ${voice}
Audience: ${audience}
Tone: ${tone}
Visual aesthetic: ${aesthetic}
Color mood: ${colorMood}
Video style: ${vidStyle}
${customPfx ? `Custom direction: ${customPfx}` : ''}

Commercial specifications:
- ${shotCount} shots
- ${durationPerShot} seconds per shot (${shotCount * durationPerShot} seconds total)
- Format: ${formatLabel}
- User's creative direction: "${userDirection || 'Premium brand commercial — let the brand DNA guide you'}"

Output ONLY valid JSON. No preamble. No explanation. No markdown.
{
  "commercial_concept": "One sentence. The director's vision for this commercial. Make it specific and evocative.",
  "environment": "The physical world of this commercial — specific location, time of day, surfaces, atmosphere",
  "master_style": "The cinematography language — specific camera style, movement philosophy, lens choice",
  "color_grade": "Specific color grade and film reference (e.g. 'Fuji 400H push-1, warm highlights, teal shadows')",
  "lighting_setup": "The consistent lighting approach across all shots",
  "shots": [
    {
      "shot_label": "Shot name (e.g. 'Wide Establish', 'Hero Reveal', 'Macro Detail')",
      "prompt": "Complete shot prompt following the format rules above. 60-80 words.",
      "duration": ${durationPerShot}
    }
  ],
  "commercial_hook": "The emotional truth or tagline of this commercial. 8 words max."
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const raw = (response.content[0] as any).text?.trim()

  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON found')
    const parsed = JSON.parse(match[0])
    if (!parsed.shots || !Array.isArray(parsed.shots)) throw new Error('No shots array')
    parsed.shots = parsed.shots.slice(0, shotCount)
    return parsed
  } catch {
    return {
      commercial_concept: `Premium ${brand} commercial`,
      environment: 'Luxury studio environment with dramatic lighting',
      master_style: 'Slow, deliberate camera movements on 85mm equivalent',
      color_grade: 'Kodak Vision3 500T, warm highlights, rich shadows',
      lighting_setup: 'Single large soft source from upper left, practical fill',
      shots: Array.from({ length: shotCount }, (_, i) => ({
        shot_label: ['Wide Establish', 'Hero Reveal', 'Macro Detail', 'Lifestyle', 'Brand Close'][i] || `Shot ${i + 1}`,
        prompt: `Slow push forward on ${brand} product. Luxury environment. Soft directional lighting. Cinematic atmosphere. Shot on 85mm equivalent, warm color grade.`,
        duration: durationPerShot,
      })),
      commercial_hook: `${brand}. Crafted for those who know.`,
    }
  }
}
