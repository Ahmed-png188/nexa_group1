export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { guardWorkspace } from '@/lib/workspace-guard'
import { checkPlanAccess } from '@/lib/plan-gate'
import { getBrandContext } from '@/lib/brand-context'
import { CMO_INTELLIGENCE_PROMPT, CREATIVE_DIRECTOR_PROMPT } from '@/lib/prompts'
import { getTemplateForBrandType, type LandingSection } from '@/lib/landing-templates'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, template_id, goal, lang = 'en' } = await request.json()

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    const planError = await checkPlanAccess(workspace_id, 'lead_page')
    if (planError) return planError

    // Get full brand context
    const ctx = await getBrandContext(workspace_id)
    if (!ctx) return NextResponse.json({ error: 'Brand context not found' }, { status: 404 })

    const template = getTemplateForBrandType(ctx.brandType || 'physical_product')
    const selectedTemplate = template_id
      ? (await import('@/lib/landing-templates')).LANDING_TEMPLATES.find(t => t.id === template_id) || template
      : template

    const isAr = lang === 'ar'

    // Build section structure for the prompt
    const sectionList = selectedTemplate.sections
      .map((s, i) => `${i + 1}. ${s.type}: ${JSON.stringify(s.content).slice(0, 120)}`)
      .join('\n')

    const systemPrompt = `${CMO_INTELLIGENCE_PROMPT}

${CREATIVE_DIRECTOR_PROMPT}

${ctx.unifiedBriefing || ''}

${ctx.brandTypeContext || ''}`

    const userPrompt = `Generate a complete, high-converting landing page for this brand.

BRAND: ${ctx.brandName}
${ctx.copyContext}

TEMPLATE: ${selectedTemplate.label}
GOAL: ${goal || 'Drive leads and sales'}
LANGUAGE: ${isAr ? 'Arabic — all text must be in Arabic' : 'English'}

SECTION STRUCTURE TO FILL (keep the same section order and types):
${sectionList}

Rules:
- Write copy that sounds like it came from this specific brand — not generic marketing
- Headlines under 8 words, punchy and specific
- CTAs that match the brand's action (Buy, Book, Enroll, Discover, etc.)
- Testimonial names and roles should match the brand's likely customer base
- Feature icons must be relevant emojis
- For food brands: include prices in the local currency context
- Keep testimonials under 25 words each — pithy, real-sounding

Return ONLY valid JSON — no markdown fences, no explanation:
{
  "title": "page meta title",
  "suggested_theme": "${selectedTemplate.defaultTheme}",
  "suggested_accent": "${selectedTemplate.defaultAccent}",
  "suggested_font": "${selectedTemplate.defaultFont}",
  "seo_title": "SEO title",
  "seo_description": "SEO meta description under 160 chars",
  "sections": [
    {
      "id": "hero-1",
      "type": "hero",
      "content": {
        "headline": "...",
        "subheadline": "...",
        "cta_label": "...",
        "cta_url": "#products",
        "cta2_label": "...",
        "cta2_url": "#about"
      }
    }
  ]
}

Match the section types and IDs exactly from the template structure above. Fill in content that is brand-specific and compelling.`

    const response = await anthropic.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userPrompt }],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const result  = JSON.parse(cleaned)

    // Merge generated content back with template structure for any sections AI missed
    const mergedSections: LandingSection[] = selectedTemplate.sections.map(tplSection => {
      const generated = (result.sections || []).find((s: any) => s.type === tplSection.type)
      if (generated) {
        return { ...tplSection, id: generated.id || tplSection.id, content: { ...tplSection.content, ...generated.content } }
      }
      return tplSection
    })

    return NextResponse.json({
      success: true,
      result: {
        ...result,
        sections: mergedSections,
        template_id: selectedTemplate.id,
      },
    })
  } catch (err: unknown) {
    console.error('[landing-page/generate]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
