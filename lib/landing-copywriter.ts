import type {
  LandingPageConfig, DesignSystem, CreativeDirection,
  DesignSystemDef, WorkspaceProduct,
} from './landing-types'
import { DESIGN_SYSTEMS } from './landing-types'

// ─────────────────────────────────────────────────
// COPYWRITER PHILOSOPHY
// Applied to every single word generated
// ─────────────────────────────────────────────────

const COPYWRITER_PHILOSOPHY = `
You write like Seth Godin. You think like Dan Koe.
You respect the reader's intelligence completely.

SETH GODIN PRINCIPLES you apply without exception:
- Make a specific promise to a specific person
- The smallest viable audience gets the most specific copy
- Story earns the next sentence — or you cut the sentence
- Specificity is more believable than generality
- "Free shipping" is weaker than "Free shipping on every order, always"
- The headline is a promise. The body keeps it.
- Never write for everyone. Write for the one person who needs this.

DAN KOE PRINCIPLES you apply without exception:
- Challenge the belief the reader holds right now
- Give them a new lens to see through
- Make the alternative (your product) feel obvious
- Direct. Second person. Present tense.
- "You've been doing this wrong" > "Our product is better"
- Call out the industry problem before presenting the solution

WHAT YOU NEVER DO:
- Use superlatives without proof: "best", "world-class", "revolutionary"
- Generic claims: "high quality", "premium", "trusted"
- Anything the audience has heard from a competitor
- Filler words: "very", "really", "truly", "absolutely"
- Corporate speak: "leverage", "synergy", "best-in-class"
- Passive voice: "is designed to", "has been crafted"
- Fake urgency: "limited time", "act now", "don't miss out"

WHAT YOU ALWAYS DO:
- Use specific numbers: "14 days" not "fast results"
- Name real things: farm names, ingredient sources, specific outcomes
- Write CTAs that complete a thought: "Get my 20% off" not "Submit"
- Make the reader feel seen: address their specific situation
- End on conviction: the last word of a section should land
`

// ─────────────────────────────────────────────────
// CREATIVE DIRECTOR BRIEF
// How to make two brands on the same design system
// look genuinely different
// ─────────────────────────────────────────────────

const CREATIVE_DIRECTOR_BRIEF = `
You are a creative director who believes:
- Two brands on the same design system must feel completely different
- Visual DNA is a quality standard, not a template to copy
- Every design decision has a reason rooted in the brand

You decide CREATIVE DIRECTION for this specific brand:

HERO LAYOUT — choose based on what tells this brand's story best:
  headline_dominant: The words ARE the brand. Type fills the screen.
    Use for: brands with a manifesto, strong point of view, digital products
  product_dominant: The object speaks. Image leads, text supports.
    Use for: physical products with beautiful photography, artisan goods
  split_balanced: Equal conversation between product and story.
    Use for: most e-commerce brands, balanced narrative
  editorial_stack: Magazine energy. Stacked. Asymmetric. Type over image.
    Use for: fashion, lifestyle, editorial brands
  full_bleed: Immersive. One powerful image with minimal text overlay.
    Use for: luxury, hospitality, experience brands

TYPE SCALE — how dramatic is the size contrast:
  expressive: Massive contrast. 9px labels next to 110px headlines.
    Use for: editorial, fashion, lifestyle, brands with personality
  restrained: Subtle scale. Everything measured and purposeful.
    Use for: luxury, minimal, clinical, premium brands
  aggressive: Everything big. Dense. Loud. No subtlety.
    Use for: sport, performance, bold consumer brands
  literary: Long-form readable. Editorial density. Type carries the story.
    Use for: food, artisan, story-forward brands

SPACING — how generous the white space:
  tight: Every pixel used. Information dense. Urgent.
    Use for: e-commerce, product-heavy, sale-oriented
  breathing: Generous but purposeful. Room for ideas to land.
    Use for: most premium brands, beauty, wellness
  dramatic: Extreme white space. Silence as design.
    Use for: luxury, minimal, high-end, Bottega Veneta energy

COLOR APPLICATION — how the accent color is used:
  monochrome: Barely any accent. Everything neutral, accent only on price.
    Use for: ultra luxury, Aesop-level restraint
  accent_moments: Accent only on key conversion elements.
    Use for: premium brands, beauty, fashion
  accent_forward: Accent used liberally, part of the identity.
    Use for: brands with strong color identity, energetic brands
  inverted_sections: Some sections fully dark/inverted for contrast.
    Use for: most brands — creates rhythm and visual interest

IMAGE TREATMENT — how photos are used:
  product_pure: Clean product on neutral background. Product is hero.
    Use for: beauty, skincare, clean brands
  lifestyle_rich: Products shown in life context, aspirational.
    Use for: fashion, home, accessories, food in context
  editorial_crop: Dramatic crops. Partial images. Unexpected angles.
    Use for: fashion, art, editorial brands
  minimal_hint: Tiny images or none. Type and color do the work.
    Use for: digital products, services, SaaS
  no_image: Pure type and color. No photography.
    Use for: manifesto brands, digital products, concept-driven

SECTION DENSITY — which sections this brand actually needs:
  sparse: Few sections, each given room. Short page.
    Use for: luxury, minimal, one-hero-product brands
  layered: Many sections, building rhythm. Long scroll.
    Use for: brands with a full story to tell, food, artisan
  focused: One primary section dominates (hero + products + form).
    Use for: direct-response, high-conversion focus brands
`

// ─────────────────────────────────────────────────
// MAIN PROMPT BUILDER
// ─────────────────────────────────────────────────

export function buildGenerationPrompt(params: {
  brand: any
  products: WorkspaceProduct[]
  conversation: string
  history: Array<{ role: string; content: string }>
  lang: 'en' | 'ar'
  existingConfig?: Partial<LandingPageConfig>
  designSystemOverride?: DesignSystem
  sectionOnly?: string
}): string {
  const {
    brand, products, conversation, history,
    lang, existingConfig, designSystemOverride, sectionOnly,
  } = params

  const isAr = lang === 'ar'
  const brandName = brand.brandName || 'this brand'
  const profile   = brand.profile
  const workspace = brand.workspace

  // Build brand intelligence summary
  const brandIntel = `
BRAND: ${brandName}
TYPE: ${(workspace as any)?.segment || 'product brand'}
VOICE: ${profile?.voice?.primary_tone || workspace?.brand_voice || 'not defined'}
WRITING STYLE: ${profile?.voice?.writing_style || 'direct and clear'}
VOCABULARY: ${profile?.voice?.vocabulary?.join(', ') || 'not defined'}
AVOID: ${profile?.voice?.avoid?.join(', ') || 'generic marketing speak'}
AUDIENCE: ${profile?.audience?.primary || workspace?.brand_audience || 'not defined'}
AUDIENCE PSYCHOLOGY: ${profile?.audience?.psychology || 'motivated by quality and authenticity'}
PAIN POINTS: ${profile?.audience?.pain_points?.join(', ') || 'not defined'}
DESIRES: ${profile?.audience?.desires?.join(', ') || 'not defined'}
POSITIONING: ${profile?.positioning?.unique_angle || 'not defined'}
BRAND COLORS: ${JSON.stringify((workspace as any)?.brand_colors || {})}
CONTENT HOOKS: ${profile?.content?.hooks?.join(', ') || 'not defined'}
GENERATION INSTRUCTIONS: ${profile?.generation_instructions?.copy_prompt_prefix || ''}
`

  // Build products summary
  const productsSummary = products.length > 0
    ? `
REAL PRODUCTS (use these — do not invent products):
${products.map((p, i) => `
Product ${i + 1}: ${p.name}
  Price: ${p.price}
  Short desc: ${p.short_desc}
  Full desc: ${p.full_desc}
  Action: ${p.action_type}${p.action_value ? ` → ${p.action_value}` : ''}
  ${p.featured ? '★ FEATURED PRODUCT' : ''}
`).join('')}
`
    : `NO PRODUCTS ADDED YET.
Generate 3 placeholder product descriptions based on the brand type and voice.
Label them clearly in copywriter_notes as placeholders.
Include a message to the user: "I've created example products — add your real products in the Products section."`

  // Build conversation history
  const historyText = history.length > 0
    ? `\nPREVIOUS CONVERSATION:\n${
        history.map(m =>
          `${m.role === 'user' ? 'User' : 'Nexa'}: ${m.content}`
        ).join('\n')
      }\n`
    : ''

  // Build existing config context
  const existingContext = existingConfig
    ? `\nEXISTING PAGE CONFIG (you may be editing this):\n${
        JSON.stringify({
          design_system:    existingConfig.design_system,
          creative_direction: existingConfig.creative_direction,
          sections_order:   existingConfig.sections_order,
        }, null, 2)
      }\n`
    : ''

  if (isAr) {
    return buildArabicPrompt({
      brandName, brandIntel, productsSummary,
      historyText, existingContext, conversation,
      designSystemOverride, sectionOnly, products,
    })
  }

  return `
${COPYWRITER_PHILOSOPHY}

${CREATIVE_DIRECTOR_BRIEF}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BRAND INTELLIGENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${brandIntel}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRODUCTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${productsSummary}
${historyText}
${existingContext}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE REQUEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${conversation}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${sectionOnly
  ? buildSectionOnlyPrompt(sectionOnly, brandName)
  : buildFullPagePrompt(brandName, designSystemOverride, products)}
`
}

function buildSectionOnlyPrompt(
  sectionType: string,
  brandName: string,
): string {
  const schemas: Record<string, string> = {
    reviews: `{
  "headline": "review section headline — not just 'Reviews'",
  "score": "4.9",
  "count": "X,XXX+ verified buyers",
  "items": [
    { "quote": "specific result testimonial — sounds like a real person", "author": "name", "location": "Gulf city · Verified buyer" },
    { "quote": "different angle on value", "author": "name", "location": "city · Verified buyer" },
    { "quote": "third distinct perspective", "author": "name", "location": "city · Verified buyer" }
  ]
}`,
    features: `{
  "headline": "why section headline",
  "items": [
    { "icon": "shield", "title": "Feature name", "desc": "Two sentences. Benefit not spec." },
    { "icon": "lightning", "title": "Feature name", "desc": "Two sentences." },
    { "icon": "heart", "title": "Feature name", "desc": "Two sentences." },
    { "icon": "users", "title": "Feature name", "desc": "Two sentences." }
  ]
}`,
    faq: `{
  "headline": "FAQ headline",
  "items": [
    { "question": "real customer question", "answer": "direct honest answer" },
    { "question": "real customer question", "answer": "direct honest answer" },
    { "question": "real customer question", "answer": "direct honest answer" },
    { "question": "real customer question", "answer": "direct honest answer" },
    { "question": "real customer question", "answer": "direct honest answer" }
  ]
}`,
    cta_banner: `{
  "headline": "short action-driving headline",
  "subline": "supporting line",
  "cta": "button text",
  "cta_href": "#lp-form"
}`,
    gallery: `{ "headline": "gallery section headline" }`,
    founder_note: `{
  "text": "founder letter — first person, specific moment, 3-4 sentences",
  "name": "Founder Name",
  "role": "Founder, ${brandName} — City"
}`,
    ingredients: `{
  "headline": "What goes into every",
  "headline_italic": "product.",
  "desc": "2-3 sentences on sourcing philosophy",
  "items": [
    { "name": "Ingredient name", "desc": "Why it matters", "source": "Origin" },
    { "name": "Ingredient name", "desc": "Why it matters", "source": "Origin" },
    { "name": "Ingredient name", "desc": "Why it matters", "source": "Origin" },
    { "name": "Ingredient name", "desc": "Why it matters", "source": "Origin" }
  ]
}`,
    pull_quote: `{
  "quote": "specific customer quote — sounds human, not effusive",
  "author": "Customer Name",
  "location": "Gulf city · Verified buyer"
}`,
    statement: `{
  "number": "01",
  "left_headline": "industry problem in one sentence",
  "left_italic": "the part that stings",
  "body": "3-4 sentences on the brand position",
  "stats": [
    { "num": "specific number", "label": "what it means" },
    { "num": "specific number", "label": "what it means" },
    { "num": "specific number", "label": "what it means" }
  ]
}`,
  }

  const schema = schemas[sectionType] || `{ "headline": "section headline", "items": [] }`

  return `Generate ONLY the ${sectionType} section for ${brandName}.
Apply the same brand voice and copywriter standards as always.
Return JSON matching this exact structure:
${schema}

Output ONLY valid JSON. No preamble. No explanation.`
}

function buildFullPagePrompt(
  brandName: string,
  designSystemOverride?: string,
  products?: WorkspaceProduct[],
): string {
  return `Generate a COMPLETE landing page configuration for ${brandName}.

PHASE 1 — READ THE BRAND
Before writing a single word, understand:
- What does this brand actually sell and to whom?
- What does the audience believe right now that needs challenging?
- What is the ONE thing that makes this brand different?
- What would make someone stop scrolling for this?

PHASE 2 — CREATIVE DIRECTION DECISIONS
Make genuine design decisions for THIS brand.
Two brands on Editorial must look completely different.
Choose creative_direction values that make this brand unique.
Explain your reasoning in the reasoning field.

${designSystemOverride
  ? `DESIGN SYSTEM: Use "${designSystemOverride}" — this was specifically requested.`
  : `Choose the design_system that best fits this brand's personality.`}

PHASE 3 — WRITE THE COPY
Apply Seth Godin and Dan Koe principles to every word.
Test every headline: would someone screenshot this? If not, rewrite it.
Test every CTA: does it complete a sentence the visitor is thinking? If not, rewrite it.
Use real product details if provided. Never invent specs.

OUTPUT — Complete JSON only. No preamble. No explanation outside JSON.

{
  "brand_name": "${brandName}",
  "brand_initial": "${brandName[0]?.toUpperCase() || 'B'}",
  "logo_url": null,
  "lang": "en",
  "design_system": "editorial|minimal|bold|warm",
  "accent": "#hex — from brand colors if available, else best fit",
  "secondary_accent": "#hex",
  "bg_override": "",
  "creative_direction": {
    "hero_layout": "headline_dominant|product_dominant|split_balanced|editorial_stack|full_bleed",
    "type_scale": "expressive|restrained|aggressive|literary",
    "spacing": "tight|breathing|dramatic",
    "color_application": "monochrome|accent_moments|accent_forward|inverted_sections",
    "font_personality": "serif_dominant|sans_dominant|display_heavy|mixed_editorial",
    "image_treatment": "product_pure|lifestyle_rich|editorial_crop|minimal_hint|no_image",
    "section_density": "sparse|layered|focused",
    "reasoning": "2-3 sentences explaining WHY these choices fit THIS brand specifically"
  },
  "sections_order": ["hero","marquee","statement","products","pull_quote","story","reviews","form","footer"],
  "hero": {
    "eyebrow": "3-5 words — specific context, not category label",
    "headline_line1": "first line — stops the scroll",
    "headline_line2": "second line",
    "headline_italic": "the italic/accent word or phrase",
    "body": "2-3 sentences. Specific. Earned. Brand voice.",
    "cta_primary": "CTA that completes a thought visitor is already having",
    "cta_primary_href": "#lp-products",
    "cta_secondary": "softer alternative or empty string",
    "cta_secondary_href": "#lp-story",
    "trust_items": ["Specific proof point", "Another specific proof", "Third"]
  },
  "marquee": {
    "items": ["6 specific brand proof points — facts not vibes"],
    "speed": "normal"
  },
  "statement": {
    "number": "01",
    "left_headline": "industry problem as a headline",
    "left_italic": "the part that challenges",
    "body": "3-4 sentences expanding the position. Confident. No hedging.",
    "stats": [
      { "num": "specific", "label": "what it means" },
      { "num": "specific", "label": "what it means" },
      { "num": "specific", "label": "what it means" }
    ]
  },
  "products": {
    "section_title": "collection or service name",
    "section_subtitle": "one supporting line",
    "link_label": "View all",
    "product_ids": ${products?.length
      ? JSON.stringify(products.map(p => p.id))
      : '[]'},
    "layout": "three_col"
  },
  "pull_quote": {
    "quote": "real customer result — specific, not effusive, sounds human",
    "author": "Customer Name",
    "location": "Gulf city · Verified buyer"
  },
  "story": {
    "tag": "2-3 word section label",
    "headline": "story headline line 1",
    "headline_italic": "the italic part — honest, poetic",
    "body": "3-4 sentences founder voice. Specific moment. The thing they couldn't find, so they made it.",
    "values": [
      { "title": "Commitment name", "desc": "One sentence — what this constraint creates" },
      { "title": "Commitment name", "desc": "One sentence" },
      { "title": "Commitment name", "desc": "One sentence" }
    ]
  },
  "reviews": {
    "headline": "reviews section headline — not just 'Reviews'",
    "score": "4.9",
    "count": "X,XXX+ verified buyers",
    "items": [
      { "quote": "specific result — sounds like a real person, not a testimonial", "author": "Name", "location": "Gulf city · Verified buyer" },
      { "quote": "different angle", "author": "Name", "location": "City · Verified buyer" },
      { "quote": "third perspective", "author": "Name", "location": "City · Verified buyer" }
    ]
  },
  "form": {
    "tag": "3-4 word section label",
    "headline_line1": "form headline — makes them want to submit",
    "headline_line2": "line 2",
    "headline_italic": "italic part",
    "body": "2-3 sentences. What they get. Why now. No pressure.",
    "cta": "CTA that completes a sentence they're thinking",
    "note": "Privacy reassurance — max 6 words",
    "fields": [
      { "id": "f-name",  "type": "text",  "label": "Your name",       "placeholder": "First name",        "required": false },
      { "id": "f-email", "type": "email", "label": "Email address",    "placeholder": "you@example.com",   "required": true  },
      { "id": "f-phone", "type": "phone", "label": "Phone (optional)", "placeholder": "+971 5X XXX XXXX",  "required": false }
    ]
  },
  "footer": {
    "tagline": "one sentence that sums up the brand — a truth, not a slogan",
    "cols": [
      { "title": "Column", "links": ["link1", "link2", "link3"] },
      { "title": "Column", "links": ["link1", "link2", "link3"] },
      { "title": "Column", "links": ["link1", "link2", "link3"] }
    ]
  },
  "product_images": [],
  "meta_title": "SEO title under 60 chars — not salesy",
  "meta_description": "SEO description under 160 chars — a real sentence",
  "copywriter_notes": "2-3 sentences: what creative decisions were made and why. What's unique about this page vs a generic version.",
  "workspace_id": ""
}`
}

function buildArabicPrompt(params: {
  brandName:            string
  brandIntel:           string
  productsSummary:      string
  historyText:          string
  existingContext:      string
  conversation:         string
  designSystemOverride?: string
  sectionOnly?:         string
  products?:            WorkspaceProduct[]
}): string {
  const {
    brandName, brandIntel, productsSummary,
    historyText, existingContext, conversation,
    designSystemOverride, sectionOnly, products,
  } = params

  return `
أنت كاتب إبداعي ومخرج فني من أعلى المستويات.
تكتب بالعربية الخليجية الطبيعية — لا عربية فصحى جامدة.
كل كلمة تكسبها. لا حشو. لا كليشيهات تسويقية.

${brandIntel}
${productsSummary}
${historyText}
${existingContext}

الطلب: ${conversation}

${sectionOnly
  ? `أنشئ قسم "${sectionOnly}" فقط لـ${brandName}. أخرج JSON فقط.`
  : `أنشئ صفحة هبوط كاملة لـ${brandName}.

اتخذ قرارات إبداعية حقيقية تعكس هذه العلامة تحديداً.
اكتب كل كلمة كمؤسس يتحدث إلى عميله المثالي.
استخدم تفاصيل حقيقية — أرقام محددة، أماكن حقيقية، نتائج ملموسة.

أخرج JSON فقط — بنفس الهيكل الإنجليزي تماماً لكن:
- جميع النصوص بالعربية الخليجية
- lang: "ar"
- العناوين أقصر (العربية تحتاج مساحة أقل)
- CTAs طبيعية بالعربي (لا ترجمة حرفية)
- أسماء عملاء من دول الخليج
- المدن: الرياض، دبي، الكويت، جدة، أبوظبي، المنامة
- الأسعار بالعملة المناسبة (ريال/درهم/دينار)
- product_ids: ${products?.length ? JSON.stringify(products.map(p => p.id)) : '[]'}
`}
`
}

// ─────────────────────────────────────────────────
// CHAT RESPONSE BUILDER
// What Nexa says back in the chat after generating
// ─────────────────────────────────────────────────

export function buildNexaChatResponse(
  config: Partial<LandingPageConfig>,
  copywriterNotes: string,
  lang: 'en' | 'ar',
): string {
  const ds = DESIGN_SYSTEMS[config.design_system as DesignSystem]

  if (lang === 'ar') {
    return `بنيت صفحتك بنظام **${ds?.nameAr || config.design_system}**.

${copywriterNotes}

تريد تعديل شيء؟ فقط قل:
- "غيّر العنوان الرئيسي إلى..."
- "المنتجات تحتاج وصفاً أقوى"
- "حوّل التصميم إلى Bold"
- "أضف قسم الأسئلة الشائعة"
- "الـCTA يبدو تسويقياً — أعد كتابته"
- "اجعل الصفحة أكثر دفئاً"`
  }

  return `Built with **${ds?.name || config.design_system}** — ${ds?.description || ''}.

${copywriterNotes}

Want to refine anything? Just say:
- "Change the headline to..."
- "The story section feels too long"
- "Switch to Minimal design"
- "Add a FAQ section"
- "The CTA is too salesy — rewrite it"
- "Make the spacing more dramatic"
- "The products section needs stronger descriptions"`
}

// ─────────────────────────────────────────────────
// EDIT INTENT PARSER
// Understands natural language edit requests
// without requiring exact field names
// ─────────────────────────────────────────────────

export function parseEditIntent(message: string): {
  type: 'regenerate' | 'section_update' | 'style_switch' | 'section_add' | 'section_remove' | 'field_update' | 'unknown'
  params: Record<string, any>
} {
  const lower = message.toLowerCase()

  // Style switch
  if (lower.includes('switch to') || lower.includes('change to') || lower.includes('use ')) {
    if (lower.includes('editorial'))
      return { type: 'style_switch', params: { design_system: 'editorial' } }
    if (lower.includes('minimal'))
      return { type: 'style_switch', params: { design_system: 'minimal' } }
    if (lower.includes('bold'))
      return { type: 'style_switch', params: { design_system: 'bold' } }
    if (lower.includes('warm'))
      return { type: 'style_switch', params: { design_system: 'warm' } }
  }

  // Section add
  if (lower.includes('add') || lower.includes('include')) {
    if (lower.includes('faq'))
      return { type: 'section_add', params: { section: 'faq' } }
    if (lower.includes('testimonial') || lower.includes('review'))
      return { type: 'section_add', params: { section: 'reviews' } }
    if (lower.includes('gallery') || lower.includes('photo'))
      return { type: 'section_add', params: { section: 'gallery' } }
    if (lower.includes('founder') || lower.includes('note'))
      return { type: 'section_add', params: { section: 'founder_note' } }
    if (lower.includes('feature') || lower.includes('benefit'))
      return { type: 'section_add', params: { section: 'features' } }
    if (lower.includes('ingredient'))
      return { type: 'section_add', params: { section: 'ingredients' } }
    if (lower.includes('cta') || lower.includes('banner'))
      return { type: 'section_add', params: { section: 'cta_banner' } }
    if (lower.includes('video'))
      return { type: 'section_add', params: { section: 'video' } }
  }

  // Section remove
  if (lower.includes('remove') || lower.includes('delete') || lower.includes('get rid')) {
    if (lower.includes('marquee') || lower.includes('ticker'))
      return { type: 'section_remove', params: { section: 'marquee' } }
    if (lower.includes('statement'))
      return { type: 'section_remove', params: { section: 'statement' } }
    if (lower.includes('faq'))
      return { type: 'section_remove', params: { section: 'faq' } }
    if (lower.includes('quote'))
      return { type: 'section_remove', params: { section: 'pull_quote' } }
  }

  // Field updates
  if (lower.includes('headline') || lower.includes('title')) {
    const match = message.match(/(?:to|:)\s+"?([^"]+)"?\s*$/i)
    if (match)
      return {
        type: 'field_update',
        params: { section: 'hero', field: 'headline_line1', value: match[1].trim() },
      }
  }

  if (lower.includes('cta') || lower.includes('button')) {
    const match = message.match(/(?:to|:)\s+"?([^"]+)"?\s*$/i)
    if (match)
      return {
        type: 'field_update',
        params: { section: 'hero', field: 'cta_primary', value: match[1].trim() },
      }
  }

  // Default: full regenerate with conversation context
  return { type: 'regenerate', params: {} }
}
