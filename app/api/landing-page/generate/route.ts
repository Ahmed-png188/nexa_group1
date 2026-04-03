export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createService } from '@supabase/supabase-js'
import { guardWorkspace } from '@/lib/workspace-guard'
import { getBrandContext } from '@/lib/brand-context'
import { DESIGN_SYSTEMS, selectDesignSystem, resolveAccent, type DesignSystem } from '@/lib/landing-design-system'
import { buildCopywriterPrompt } from '@/lib/landing-copywriter'
import Anthropic from '@anthropic-ai/sdk'

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

function db() {
  return createService(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const {
      workspace_id,
      conversation,
      history = [],
      lang = 'en',
      design_system_override,
    } = await req.json()

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    // 1. Full brand intelligence
    const brand = await getBrandContext(workspace_id)
    if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 })

    // 2. Brand assets (logo, photos)
    const { data: brandAssets } = await db()
      .from('brand_assets')
      .select('type, file_url, file_name, analysis')
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false })

    // 3. Product Lab photos (table may not exist)
    let productAssets: any[] = []
    try {
      const { data } = await db()
        .from('product_assets')
        .select('url, asset_type, metadata')
        .eq('workspace_id', workspace_id)
        .order('created_at', { ascending: false })
        .limit(12)
      productAssets = data || []
    } catch {}

    // 4. Existing landing page (for editing context)
    const { data: existing } = await db()
      .from('landing_pages')
      .select('config, design_system')
      .eq('workspace_id', workspace_id)
      .maybeSingle()

    // Collect image URLs
    const logoUrl = (brandAssets || []).find(a => a.type === 'logo')?.file_url || null
    const productImages = [
      ...(brandAssets || []).filter(a => a.type === 'product_photo').map(a => a.file_url),
      ...productAssets.map((a: any) => a.url),
    ].filter(Boolean).slice(0, 8)

    // Detect brand identity
    const brandType   = (brand.workspace as any)?.segment || 'physical_product'
    const brandVoice  = brand.brandVoice || ''
    const brandColors = (brand.workspace as any)?.brand_colors

    // ── Brand completeness gate ──────────────────────────────────────────────
    const hasBrandBrain     = !!brand.profile
    const hasBrandVoice     = !!(brand.brandVoice || brand.profile?.voice?.primary_tone)

    // Critical gate: no brand context at all → ask for info instead of generating generic output
    if (!hasBrandBrain && !hasBrandVoice) {
      return NextResponse.json({
        success:      false,
        needs_info:   true,
        nexa_message: lang === 'ar'
          ? `لم أجد Brand Brain لهذه العلامة بعد.\n\nلو تريد صفحة هبوط تعكس علامتك الحقيقية، أحتاج أعرف أكثر. أخبرني:\n١. ماذا تبيع؟ (جملة واحدة)\n٢. من هو عميلك المثالي؟\n٣. ما الذي يجعلك مختلفاً عن المنافسين؟\n\nأو يمكنك رفع محتوى علامتك من لوحة الإعدادات وسأتعلم منه مباشرة.`
          : `I don't see a Brand Brain set up for this workspace yet.\n\nTo build a landing page that actually reflects your brand — not a generic template — I need to understand a few things first:\n\n1. What do you sell? (one sentence)\n2. Who is your ideal customer?\n3. What makes you different from everyone else selling the same thing?\n\nOr you can upload your brand content from Settings → Brand Brain and I'll learn directly from that.`,
      })
    }

    // Non-critical warnings passed to the AI
    const completenessWarnings: string[] = []
    if (!hasBrandBrain) completenessWarnings.push(
      'No Brand Brain detected — generating from basic workspace info only. Results will be generic.'
    )
    if (!(brandAssets || []).some((a: any) => a.type === 'logo')) completenessWarnings.push(
      'No logo uploaded — will use brand name as text in the nav and footer.'
    )
    if (productImages.length === 0) completenessWarnings.push(
      'No product photos from Product Lab — will use brand initial as placeholder.'
    )
    if (!hasBrandVoice) completenessWarnings.push(
      'No brand voice defined — will infer from brand name and type.'
    )
    // ────────────────────────────────────────────────────────────────────────

    // Select design system
    const dsKey = selectDesignSystem(
      brandType,
      brandVoice,
      design_system_override || existing?.design_system
    )
    const ds = DESIGN_SYSTEMS[dsKey]

    // Build full conversation context
    const conversationContext = history.length > 0
      ? `Previous conversation:\n${history.map((m: any) =>
          `${m.role === 'user' ? 'User' : 'Nexa'}: ${m.content}`
        ).join('\n')}\n\nLatest request: ${conversation}`
      : conversation

    const warningsBlock = completenessWarnings.length > 0
      ? `\n\nBRAND DATA LIMITATIONS:\n${completenessWarnings.join('\n')}\nDespite these limitations, generate the best possible page. Flag in copywriter_notes what was assumed vs what was known.`
      : ''

    const prompt = buildCopywriterPrompt({
      brand,
      designSystem: ds,
      conversation:   conversationContext + warningsBlock,
      existingConfig: existing?.config,
      lang:           lang as 'en' | 'ar',
    })

    const response = await ai.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 5000,
      system: `You are a world-class creative director and copywriter building landing pages.
You have the aesthetic taste of a Pentagram partner and the copy instincts of Seth Godin.
You reject mediocrity. Every word must earn its place.
You never produce generic output. You always read the brand first.
Output JSON only — no preamble, no explanation outside the JSON.`,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw   = (response.content[0] as any).text?.trim() || ''
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON in response')

    const generated = JSON.parse(match[0])

    // Resolve final design system and accent
    const finalDsKey = (generated.design_system && generated.design_system in DESIGN_SYSTEMS)
      ? generated.design_system as DesignSystem
      : dsKey
    const finalDs = DESIGN_SYSTEMS[finalDsKey]
    const accent  = resolveAccent(brandColors, brand.profile, finalDs, generated.accent)

    const copywriterNotes: string = generated.copywriter_notes || ''
    delete generated.copywriter_notes

    // Build complete page config
    const config = {
      ...generated,
      design_system:  finalDs.id,
      accent,
      lang,
      logo_url:       logoUrl,
      product_images: productImages,
      brand_name:     brand.brandName,
      brand_initial:  (brand.brandName[0] || 'B').toUpperCase(),
      workspace_id,
    }

    return NextResponse.json({
      success:       true,
      config,
      design_system: finalDs.id,
      nexa_message:  buildNexaResponse(finalDs, config, copywriterNotes, lang),
    })
  } catch (err: any) {
    console.error('[landing-page/generate]', err?.message || err)
    return NextResponse.json({ error: err?.message || 'Generation failed' }, { status: 500 })
  }
}

function buildNexaResponse(ds: any, config: any, notes: string, lang: string): string {
  const isAr = lang === 'ar'
  const sections = [
    config.hero      && (isAr ? 'قسم البطل'  : 'hero'),
    config.products  && (isAr ? 'المنتجات'    : 'products'),
    config.story     && (isAr ? 'قصة البراند' : 'brand story'),
    config.form      && (isAr ? 'نموذج العملاء' : 'lead form'),
  ].filter(Boolean).join(', ')

  if (isAr) return `تم بناء صفحتك بنظام **${ds.name}** — ${ds.description}

${notes}

الأقسام: ${sections}.

يمكنك الآن:
- "غيّر العنوان ليكون أكثر مباشرة"
- "اجعل قسم المنتجات أكثر تفصيلاً"
- "أضف ضمان راحة البال"
- "غيّر نظام التصميم إلى Minimal"

الصفحة جاهزة للمعاينة.`

  return `Built with **${ds.name}** — ${ds.description}

${notes}

Sections: ${sections}.

Want to refine anything? Try:
- "Make the headline more direct"
- "The story section feels too long — tighten it"
- "Add a guarantee section"
- "Switch to the Bold design system"
- "The CTA is too transactional — rewrite it"`
}
