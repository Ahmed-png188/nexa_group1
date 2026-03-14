import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, force_reanalyze } = await request.json()

    // Fetch workspace
    const { data: workspace } = await supabase.from('workspaces').select('*').eq('id', workspace_id).single()

    // Fetch all brand assets
    const { data: assets } = await supabase.from('brand_assets').select('*').eq('workspace_id', workspace_id)

    // Fetch recent content (to learn from what they've already made)
    const { data: recentContent } = await supabase.from('content')
      .select('type, body, platform, metadata')
      .eq('workspace_id', workspace_id)
      .not('body', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20)

    // Fetch strategy if exists
    const { data: strategy } = await supabase.from('strategies')
      .select('*')
      .eq('workspace_id', workspace_id)
      .single()

    const assetsList = assets?.map(a => `- ${a.type}: ${a.file_name}${a.analysis ? ` (analyzed: ${JSON.stringify(a.analysis).slice(0, 100)})` : ''}`).join('\n') || 'None uploaded yet'

    const contentSamples = recentContent?.filter(c => c.body).slice(0, 5).map(c => `[${c.type}/${c.platform}]: ${c.body?.slice(0, 200)}`).join('\n\n') || 'No content generated yet'

    const prompt = `You are the world's best brand strategist, copywriter, and psychologist. Your job is to deeply understand this brand and create a comprehensive Brand Intelligence Profile that will be used to generate ALL future content.

This profile will be injected into every AI generation — images, videos, copy, voiceovers — so it must be extremely specific, actionable, and capture the brand's true essence.

## Brand Information
Name: ${workspace?.brand_name || workspace?.name}
Tagline: ${workspace?.brand_tagline || 'Not provided'}
Website: ${workspace?.brand_website || 'Not provided'}
Current voice description: ${workspace?.brand_voice || 'Not defined yet'}
Audience: ${workspace?.brand_audience || 'Not defined yet'}
Tone: ${workspace?.brand_tone || 'Not defined yet'}

## Uploaded Assets
${assetsList}

## Strategy Data
${strategy ? `Pillars: ${JSON.stringify(strategy.pillars || [])}\nAudience: ${JSON.stringify(strategy.audience || {})}` : 'Not yet built'}

## Sample Content They've Created
${contentSamples}

---

Based on ALL of the above, create a comprehensive Brand Intelligence Profile in JSON format. Be extremely specific — no generic statements. Every field should be immediately usable to generate content.

Return ONLY valid JSON with this structure:
{
  "voice": {
    "primary_tone": "e.g. confident and direct without being arrogant",
    "writing_style": "e.g. short punchy sentences, minimal fluff, data-backed claims",
    "vocabulary": ["words they use", "power words", "words to avoid"],
    "sentence_structure": "e.g. declarative statements, questions that provoke thought",
    "emotional_triggers": ["what emotions their content evokes"],
    "forbidden": ["words/phrases/styles that feel off-brand"]
  },
  "audience": {
    "primary": "specific description of who they speak to",
    "psychology": "what drives them, their fears, aspirations",
    "pain_points": ["specific problems they have"],
    "desires": ["what they want to achieve"],
    "language": "how the audience speaks to each other"
  },
  "content": {
    "themes": ["main topics they cover"],
    "formats": ["content formats that work for them"],
    "hooks": ["types of opening lines that work"],
    "cta_style": "how they drive action",
    "posting_rhythm": "recommended frequency and cadence"
  },
  "visual": {
    "aesthetic": "overall visual feel and style",
    "photography_style": "type of imagery that fits the brand",
    "color_mood": "emotional feel of their palette",
    "composition": "how their visuals should be composed",
    "video_style": "motion and video aesthetic"
  },
  "positioning": {
    "unique_angle": "what makes this brand different from competitors",
    "authority_signals": ["how they establish credibility"],
    "brand_promise": "the core transformation they offer",
    "competitor_contrast": "how to position against alternatives"
  },
  "generation_instructions": {
    "copy_prompt_prefix": "A ready-to-use prefix for all copy generation prompts that encodes the full brand context",
    "image_prompt_prefix": "A ready-to-use prefix for all image generation prompts",
    "video_prompt_prefix": "A ready-to-use prefix for all video generation prompts",
    "voice_prompt_prefix": "Instructions for voiceover generation"
  }
}`

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (response.content[0] as any).text
    let brandProfile: any = {}

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) brandProfile = JSON.parse(jsonMatch[0])
    } catch {
      brandProfile = { raw: text }
    }

    // Update workspace with extracted brand intelligence
    await supabase.from('workspaces').update({
      brand_voice: brandProfile.voice?.primary_tone || workspace?.brand_voice,
      brand_audience: brandProfile.audience?.primary || workspace?.brand_audience,
      brand_tone: brandProfile.voice?.writing_style || workspace?.brand_tone,
      updated_at: new Date().toISOString(),
    }).eq('id', workspace_id)

    // Store full profile in brand_assets as a special record
    await supabase.from('brand_assets').upsert({
      workspace_id,
      type: 'brand_doc',
      file_url: 'internal://brand-profile',
      file_name: 'nexa_brand_intelligence.json',
      ai_analyzed: true,
      analysis: brandProfile,
    }, { onConflict: 'workspace_id,file_name' })

    // Log activity
    await supabase.from('activity').insert({
      workspace_id,
      user_id: user.id,
      type: 'brand_analyzed',
      title: 'Nexa AI analyzed your brand and built your Brand Intelligence Profile',
      metadata: { fields_extracted: Object.keys(brandProfile).length },
    })

    return NextResponse.json({ success: true, profile: brandProfile })

  } catch (error: any) {
    console.error('Brand analysis error:', error)
    return NextResponse.json({ error: 'Analysis failed', details: error.message }, { status: 500 })
  }
}
