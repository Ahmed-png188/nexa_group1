export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as svcClient } from '@supabase/supabase-js'
import { guardWorkspace } from '@/lib/workspace-guard'
import { getBrandContext } from '@/lib/brand-context'
import {
  DESIGN_SYSTEMS, resolveAccent, getDesignSystemForBrand,
  type LandingPageConfig, type WorkspaceProduct, type DesignSystem,
} from '@/lib/landing-types'
import {
  buildGenerationPrompt, buildNexaChatResponse, parseEditIntent,
} from '@/lib/landing-copywriter'
import Anthropic from '@anthropic-ai/sdk'

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

function svc() {
  return svcClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
      workspace_id,
      conversation,
      history = [],
      lang = 'en',
      design_system_override,
      section_only,
      existing_config,
    } = body

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    // 1. Get brand intelligence
    const brand = await getBrandContext(workspace_id)
    if (!brand)
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })

    // 2. Get real products
    const { data: productData } = await svc()
      .from('workspace_products')
      .select('*')
      .eq('workspace_id', workspace_id)
      .eq('active', true)
      .order('sort_order', { ascending: true })

    const products = (productData || []) as WorkspaceProduct[]

    // 3. Get logo from brand assets
    const { data: logoAsset } = await svc()
      .from('brand_assets')
      .select('file_url')
      .eq('workspace_id', workspace_id)
      .eq('type', 'logo')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const logoUrl = (logoAsset as any)?.file_url || null

    // 4. Get product images from brand assets
    const { data: productAssets } = await svc()
      .from('brand_assets')
      .select('file_url')
      .eq('workspace_id', workspace_id)
      .eq('type', 'product_photo')
      .order('created_at', { ascending: false })
      .limit(8)

    const productImages = (productAssets || [])
      .map((a: any) => a.file_url)
      .filter(Boolean)

    // 5. Get brand learnings for extra context
    const { data: learnings } = await svc()
      .from('brand_learnings')
      .select('insight_type, insight')
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false })
      .limit(8)

    // 6. Check if brand brain exists
    const hasBrandBrain = !!brand.profile
    const hasVoice = !!(brand.brandVoice || brand.profile?.voice)

    // 7. Brand completeness gate
    if (!hasBrandBrain && !hasVoice && !existing_config) {
      const msg = lang === 'ar'
        ? `ما لقيت Brand Brain لهذه العلامة بعد.

عشان أبني صفحة تعكس علامتك الحقيقية، أحتاج أعرف أكثر:

١. ماذا تبيع؟ (جملة واحدة)
٢. من هو عميلك المثالي؟
٣. ما الذي يجعلك مختلفاً عن المنافسين؟

أو ارفع محتوى علامتك من الإعدادات ← Brand Brain وسأتعلم منه مباشرة.`
        : `I don't see a Brand Brain set up yet.

To build a page that genuinely reflects your brand — not a generic template — I need to understand a few things first:

1. What do you sell? (one sentence)
2. Who is your ideal customer?
3. What makes you different from everyone else selling the same thing?

Or upload your brand content from Settings → Brand Brain and I'll learn directly from that.`

      return NextResponse.json({
        success: false,
        needs_info: true,
        nexa_message: msg,
      })
    }

    // 8. Add learnings to brand context
    if (learnings?.length && brand.profile) {
      ;(brand.profile as any)._learnings = learnings.map((l: any) => l.insight)
    }

    // 9. Parse edit intent for smarter handling
    const intent = parseEditIntent(conversation)

    // Handle style switch (no AI needed)
    if (intent.type === 'style_switch' && existing_config) {
      const newDs = intent.params.design_system as DesignSystem
      const dsInfo = DESIGN_SYSTEMS[newDs]
      const updatedConfig = {
        ...existing_config,
        design_system: newDs,
        accent: resolveAccent(
          (brand.workspace as any)?.brand_colors,
          brand.profile,
          dsInfo,
          (existing_config as any).accent,
        ),
      }
      return NextResponse.json({
        success: true,
        config: updatedConfig,
        nexa_message: lang === 'ar'
          ? `تم التحويل إلى **${dsInfo.nameAr}**. النصوص كما هي — فقط التصميم تغيّر.`
          : `Switched to **${dsInfo.name}** — ${dsInfo.description}. Copy is unchanged.`,
      })
    }

    // Handle field update (surgical, no AI needed)
    if (intent.type === 'field_update' && existing_config) {
      const { section, field, value } = intent.params
      const updatedConfig = {
        ...existing_config,
        [section]: {
          ...(existing_config as any)[section],
          [field]: value,
        },
      }
      return NextResponse.json({
        success: true,
        config: updatedConfig,
        nexa_message: lang === 'ar'
          ? `تم التحديث: "${value}"`
          : `Updated to: "${value}"`,
      })
    }

    // Handle section remove (no AI needed)
    if (intent.type === 'section_remove' && existing_config) {
      const sectionToRemove = intent.params.section
      const updatedOrder = ((existing_config as any).sections_order as string[] | undefined)
        ?.filter((s: string) => s !== sectionToRemove) || []
      const updatedConfig = {
        ...existing_config,
        sections_order: updatedOrder,
      }
      return NextResponse.json({
        success: true,
        config: updatedConfig,
        nexa_message: lang === 'ar'
          ? `تم حذف قسم ${sectionToRemove}.`
          : `Removed the ${sectionToRemove} section.`,
      })
    }

    // 10. Handle section_only (single section generation)
    if (section_only) {
      const sectionPrompt = buildGenerationPrompt({
        brand,
        products,
        conversation: `Generate only the ${section_only} section.`,
        history: [],
        lang: lang as 'en' | 'ar',
        existingConfig: existing_config,
        sectionOnly: section_only,
      })

      const response = await ai.messages.create({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `You are a world-class copywriter building a single landing page section.
Output JSON only. No preamble.`,
        messages: [{ role: 'user', content: sectionPrompt }],
      })

      const rawSection  = (response.content[0] as any).text?.trim() as string | undefined
      const matchSection = rawSection?.match(/\{[\s\S]*\}/)
      if (!matchSection)
        return NextResponse.json({ error: 'Generation failed' }, { status: 500 })

      const sectionData = JSON.parse(matchSection[0])
      return NextResponse.json({
        success:      true,
        section_type: section_only,
        section_data: sectionData,
        nexa_message: lang === 'ar'
          ? `تمت إضافة قسم ${section_only}.`
          : `Added ${section_only} section.`,
      })
    }

    // 11. Build the full generation prompt
    const prompt = buildGenerationPrompt({
      brand,
      products,
      conversation,
      history: history.slice(-6),
      lang: lang as 'en' | 'ar',
      existingConfig: existing_config,
      designSystemOverride: design_system_override,
    })

    // 12. Run the AI
    const isFirstGeneration = !existing_config
    const maxTokens = isFirstGeneration ? 8000 : 4000

    const aiResponse = await ai.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: `You are a world-class creative director and copywriter.
You have the aesthetic taste of a Pentagram partner.
You write with the precision of Seth Godin.
You make genuine creative decisions — not safe ones.
Every brand gets a page that is unique to their personality.
Output valid JSON only. No preamble. No explanation outside the JSON.`,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw  = (aiResponse.content[0] as any).text?.trim() as string | undefined
    const match = raw?.match(/\{[\s\S]*\}/)
    if (!match) {
      console.error('[generate] No JSON found in response')
      return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
    }

    let generated: any
    try {
      generated = JSON.parse(match[0])
    } catch (parseErr) {
      console.error('[generate] JSON parse error:', parseErr)
      return NextResponse.json({ error: 'Parse failed' }, { status: 500 })
    }

    // 13. Resolve design system and accent
    const brandColors = (brand.workspace as any)?.brand_colors

    const dsKey = (generated.design_system as DesignSystem | undefined)
      || (design_system_override as DesignSystem | undefined)
      || getDesignSystemForBrand(brand.brandType, brand.brandVoice, brandColors)
    const ds = DESIGN_SYSTEMS[dsKey] || DESIGN_SYSTEMS.editorial

    const accent = resolveAccent(
      brandColors,
      brand.profile,
      ds,
      generated.accent,
    )

    // 14. Build final config
    const copywriterNotes: string = generated.copywriter_notes || ''
    delete generated.copywriter_notes

    const finalConfig: LandingPageConfig = {
      ...generated,
      design_system:    dsKey,
      accent,
      secondary_accent: generated.secondary_accent || accent,
      bg_override:      generated.bg_override || '',
      logo_url:         logoUrl,
      product_images:   productImages,
      workspace_id,
      lang,
      brand_name:    generated.brand_name    || brand.brandName,
      brand_initial: (generated.brand_name   || brand.brandName)?.[0]?.toUpperCase() || 'B',
    }

    // 15. Build Nexa's chat response
    const nexaMessage = buildNexaChatResponse(
      finalConfig,
      copywriterNotes,
      lang as 'en' | 'ar',
    )

    return NextResponse.json({
      success:       true,
      config:        finalConfig,
      design_system: dsKey,
      nexa_message:  nexaMessage,
    })

  } catch (err: any) {
    console.error('[landing-page/generate]', err.message)
    return NextResponse.json(
      { error: 'Generation failed: ' + err.message },
      { status: 500 },
    )
  }
}
