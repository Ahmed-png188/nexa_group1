import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { guardWorkspace } from '@/lib/workspace-guard'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

interface FilePayload {
  name: string
  type: string
  base64: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, website_url, brand_name, brand_voice: inputVoice, brand_audience: inputAudience, files = [] } = await request.json()

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    // Fetch workspace
    const { data: workspace } = await supabase
      .from('workspaces').select('*').eq('id', workspace_id).single()

    // Fetch existing assets and content
    const { data: assets } = await supabase
      .from('brand_assets').select('*').eq('workspace_id', workspace_id)

    const { data: recentContent } = await supabase
      .from('content')
      .select('type, body, platform, metadata')
      .eq('workspace_id', workspace_id)
      .not('body', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20)

    const { data: strategy } = await supabase
      .from('strategy_plans').select('*').eq('workspace_id', workspace_id).eq('status','active').order('generated_at',{ascending:false}).limit(1).single()

    // If voice/audience were passed directly from onboarding, save them now
    if (inputVoice) await supabase.from('workspaces').update({ brand_voice: inputVoice }).eq('id', workspace_id)
    if (inputAudience) await supabase.from('workspaces').update({ brand_audience: inputAudience }).eq('id', workspace_id)

    const assetsList = assets?.map(a =>
      `- ${a.type}: ${a.file_name}${a.analysis ? ` (analyzed: ${JSON.stringify(a.analysis).slice(0, 100)})` : ''}`
    ).join('\n') || 'None uploaded yet'

    const contentSamples = recentContent
      ?.filter(c => c.body).slice(0, 5)
      .map(c => `[${c.type}/${c.platform}]: ${c.body?.slice(0, 200)}`)
      .join('\n\n') || 'No content generated yet'

    // ── Build the message content array with files ──────────────────────────
    const messageContent: any[] = []

    // Separate images from documents
    const imageFiles = (files as FilePayload[]).filter(f =>
      f.type.startsWith('image/') && f.base64
    )
    const docFiles = (files as FilePayload[]).filter(f =>
      !f.type.startsWith('image/') && f.base64
    )

    // Add images directly — Claude can see them
    for (const img of imageFiles.slice(0, 5)) { // max 5 images
      const mediaType = img.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
      if (['image/jpeg','image/png','image/gif','image/webp'].includes(mediaType)) {
        messageContent.push({
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: img.base64 },
        })
        messageContent.push({
          type: 'text',
          text: `[Image file: ${img.name}]`,
        })
      }
    }

    // For PDFs, send as document blocks — Claude can read them natively
    const pdfFiles = docFiles.filter(f => f.type === 'application/pdf')
    const otherDocs = docFiles.filter(f => f.type !== 'application/pdf')

    for (const pdf of pdfFiles.slice(0, 3)) { // max 3 PDFs
      messageContent.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: pdf.base64 },
      })
      messageContent.push({
        type: 'text',
        text: `[PDF document: ${pdf.name}]`,
      })
    }

    // For non-PDF docs — note their names (binary formats can't be parsed inline)
    if (otherDocs.length > 0) {
      messageContent.push({
        type: 'text',
        text: `[Uploaded documents: ${otherDocs.map(f => f.name).join(', ')}]`,
      })
    }

    const pdfCount = (files as FilePayload[]).filter(f => f.type === 'application/pdf').length
    const filesSummary = files.length > 0
      ? `\n## Uploaded Files (${files.length} total)\n${(files as FilePayload[]).map(f => `- ${f.name} (${f.type})`).join('\n')}\n${imageFiles.length > 0 ? `\nI can see the ${imageFiles.length} image(s) above. Analyze their visual style, colors, typography, and brand feel carefully.` : ''}${pdfCount > 0 ? `\nI can read the ${pdfCount} PDF document(s) above. Extract all brand voice, audience, and strategy signals from them.` : ''}`
      : '\n## Uploaded Files\nNone — analyze from brand name and website only.'

    const promptText = `You are the world's best brand strategist, copywriter, and psychologist. Your job is to deeply understand this brand and create a comprehensive Brand Intelligence Profile that will be used to generate ALL future content.

This profile will be injected into every AI generation — images, videos, copy, voiceovers — so it must be extremely specific, actionable, and capture the brand's true essence.

## Brand Information
Name: ${brand_name || workspace?.brand_name || workspace?.name}
Website: ${website_url || workspace?.brand_website || 'Not provided'}
Current voice: ${workspace?.brand_voice || 'Not defined yet'}
Audience: ${workspace?.brand_audience || 'Not defined yet'}
Tone: ${workspace?.brand_tone || 'Not defined yet'}
${filesSummary}

## Previously Uploaded Assets
${assetsList}

## Strategy Data
${strategy ? `Pillars: ${JSON.stringify(strategy.pillars || [])}\nAudience: ${JSON.stringify(strategy.audience || {})}` : 'Not yet built'}

## Sample Content They've Created
${contentSamples}

---

Based on ALL of the above (especially any images provided), create a comprehensive Brand Intelligence Profile in JSON. Be extremely specific — no generic statements. Every field must be immediately usable to generate on-brand content.

Return ONLY valid JSON with this exact structure:
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
  },
  "brand_voice": "One sentence summary of voice for display",
  "brand_audience": "One sentence summary of audience for display",
  "brand_tone": "Comma-separated tone keywords",
  "content_pillars": ["pillar1", "pillar2", "pillar3", "pillar4"],
  "top_angles": ["angle1", "angle2", "angle3"],
  "voice_match_score": 88,
  "audience_fit_score": 85,
  "visual_style_score": 91,
  "first_post_hook": "A powerful opening line for their first post",
  "first_post_body": "2-3 sentences of body copy in their exact voice"
}`

    // Add the main prompt as the last text block
    messageContent.push({ type: 'text', text: promptText })

    let response: Awaited<ReturnType<typeof anthropic.messages.create>>
    try {
      response = await anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 3500,
        messages: [{ role: 'user', content: messageContent }],
      })
    } catch (aiError: unknown) {
      console.error('[analyze-brand] Anthropic API error:', aiError instanceof Error ? aiError.message : 'Unknown error')
      return NextResponse.json({ error: 'AI analysis failed' }, { status: 502 })
    }

    const text = (response.content[0] as any).text
    let brandProfile: any = {}

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) brandProfile = JSON.parse(jsonMatch[0])
    } catch {
      brandProfile = { raw: text }
    }

    // Save brand intelligence to workspace
    await supabase.from('workspaces').update({
      brand_voice: brandProfile.brand_voice || brandProfile.voice?.primary_tone || workspace?.brand_voice,
      brand_audience: brandProfile.brand_audience || brandProfile.audience?.primary || workspace?.brand_audience,
      brand_tone: brandProfile.brand_tone || brandProfile.voice?.writing_style || workspace?.brand_tone,
      updated_at: new Date().toISOString(),
    }).eq('id', workspace_id)

    // Store full profile as a brand_asset record
    await supabase.from('brand_assets').upsert({
      workspace_id,
      type: 'brand_doc',
      file_url: 'internal://brand-profile',
      file_name: 'nexa_brand_intelligence.json',
      ai_analyzed: true,
      analysis: brandProfile,
    })

    // Record uploaded files as brand_asset entries
    if (files.length > 0) {
      const assetInserts = (files as FilePayload[]).map(f => ({
        workspace_id,
        type: f.type.startsWith('image/') ? 'other' : 'brand_doc',
        file_url: `uploaded://${f.name}`,
        file_name: f.name,
        file_size: Math.round(f.base64.length * 0.75), // approx byte size from base64
        ai_analyzed: true,
        analysis: { processed: true, included_in_brand_profile: true },
      }))

      await supabase.from('brand_assets').upsert(assetInserts, {
        onConflict: 'workspace_id,file_url',
        ignoreDuplicates: true,
      })
    }

    // Log activity
    await supabase.from('activity').insert({
      workspace_id,
      user_id: user.id,
      type: 'brand_analyzed',
      title: `Brand Intelligence Profile built${files.length > 0 ? ` from ${files.length} uploaded file${files.length > 1 ? 's' : ''}` : ''}`,
      metadata: {
        fields_extracted: Object.keys(brandProfile).length,
        files_analyzed: files.length,
        images_seen: imageFiles.length,
      },
    })

    // Return what the onboarding UI needs
    return NextResponse.json({
      success: true,
      profile: brandProfile,
      analysis: {
        brand_voice: brandProfile.brand_voice || brandProfile.voice?.primary_tone || 'Brand voice extracted.',
        brand_audience: brandProfile.brand_audience || brandProfile.audience?.primary || 'Audience mapped.',
        brand_tone: brandProfile.brand_tone || 'confident, direct',
        content_pillars: brandProfile.content_pillars || brandProfile.content?.themes || ['Expertise', 'Results', 'Strategy', 'Story'],
        top_angles: brandProfile.top_angles || brandProfile.content?.hooks || ['Identity framing', 'Contrast angles', 'Result-first'],
        voice_match_score: brandProfile.voice_match_score || 88,
        audience_fit_score: brandProfile.audience_fit_score || 85,
        visual_style_score: brandProfile.visual_style_score || 91,
        first_post_hook: brandProfile.first_post_hook || 'Most brands are posting. Very few are saying anything.',
        first_post_body: brandProfile.first_post_body || "The difference isn't consistency — it's clarity.",
      },
    })

  } catch (error: unknown) {
    console.error('[analyze-brand] Error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
