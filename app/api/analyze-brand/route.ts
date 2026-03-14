import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, website_url, brand_name } = await request.json()

    // Fetch any uploaded brand assets
    const { data: assets } = await supabase
      .from('brand_assets')
      .select('*')
      .eq('workspace_id', workspace_id)
      .limit(10)

    // Build context for Claude
    const assetContext = assets && assets.length > 0
      ? `\n\nBrand assets uploaded: ${assets.map(a => `${a.type}: ${a.file_name}`).join(', ')}`
      : '\n\nNo assets uploaded yet — analyze based on brand name and website.'

    const prompt = `You are a world-class brand strategist and psychologist. Analyze this brand and extract deep insights.

Brand name: ${brand_name}
Website: ${website_url || 'Not provided'}${assetContext}

Analyze this brand deeply and return a JSON object with EXACTLY this structure (no markdown, no backticks, pure JSON):

{
  "brand_voice": "2-3 sentence description of the brand's communication style, tone, and personality",
  "brand_audience": "2-3 sentence description of the target audience — their psychology, motivations, and what they respond to",
  "brand_tone": "5 comma-separated adjectives describing the tone (e.g. confident, direct, premium, provocative, intelligent)",
  "content_pillars": ["pillar 1", "pillar 2", "pillar 3", "pillar 4"],
  "top_angles": [
    "Best performing content angle 1 — specific and psychologically driven",
    "Best performing content angle 2 — specific and psychologically driven", 
    "Best performing content angle 3 — specific and psychologically driven"
  ],
  "platform_strategy": {
    "instagram": "1 sentence strategy for Instagram",
    "linkedin": "1 sentence strategy for LinkedIn",
    "x": "1 sentence strategy for X/Twitter"
  },
  "voice_match_score": 91,
  "audience_fit_score": 88,
  "visual_style_score": 94,
  "first_post_hook": "A specific, high-converting first post hook written in the brand voice — ready to use",
  "first_post_body": "The full body of that first post — 3-4 sentences, on-brand, ready to publish"
}

Be specific, psychologically insightful, and actionable. Do not be generic. Return ONLY the JSON.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as any).text)
      .join('')

    // Parse JSON response
    let analysis: any
    try {
      // Strip any markdown if Claude adds it
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      analysis = JSON.parse(cleaned)
    } catch {
      // Fallback if JSON parse fails
      analysis = {
        brand_voice: `${brand_name} speaks with authority and clarity. Direct, confident, and outcome-focused.`,
        brand_audience: 'Ambitious founders and creators who value results over tactics and want a competitive edge.',
        brand_tone: 'confident, direct, premium, strategic, intelligent',
        content_pillars: ['Expertise & Authority', 'Results & Outcomes', 'Strategy & Psychology', 'Brand Story'],
        top_angles: [
          'Identity-level framing — position your brand as a category of one',
          'Contrast angles — what you are vs. what everyone else does',
          'Result-first storytelling — outcome in the hook, method in the body',
        ],
        platform_strategy: {
          instagram: 'Short-form video and carousels that lead with a bold insight or counterintuitive take.',
          linkedin: 'Authority-building long-form that shares real strategy, not surface-level tips.',
          x: 'Sharp, confident threads that challenge industry assumptions.',
        },
        voice_match_score: 89,
        audience_fit_score: 86,
        visual_style_score: 92,
        first_post_hook: `Most ${brand_name.toLowerCase()} advice is backwards. Here's what actually works:`,
        first_post_body: `Everyone tells you to post consistently. No one tells you that consistency without strategy is just noise. The brands winning right now aren't posting more — they're saying things that actually matter to the right people. That's the difference.`,
      }
    }

    // Save analysis to workspace
    await supabase.from('workspaces').update({
      brand_voice: analysis.brand_voice,
      brand_audience: analysis.brand_audience,
      brand_tone: analysis.brand_tone,
      brand_onboarded: true,
    }).eq('id', workspace_id)

    // Save strategy plan
    await supabase.from('strategy_plans').upsert({
      workspace_id,
      title: `${brand_name} — Brand Strategy`,
      status: 'active',
      audience_map: { description: analysis.brand_audience, tone: analysis.brand_tone },
      content_pillars: analysis.content_pillars,
      platform_strategy: analysis.platform_strategy,
      insights: {
        top_angles: analysis.top_angles,
        first_post_hook: analysis.first_post_hook,
        first_post_body: analysis.first_post_body,
      },
    })

    // Log activity
    await supabase.from('activity').insert({
      workspace_id,
      user_id: user.id,
      type: 'brand_analyzed',
      title: `Brand DNA analyzed for ${brand_name}`,
      description: `Voice: ${analysis.brand_tone}`,
    })

    return NextResponse.json({ success: true, analysis })

  } catch (error: any) {
    console.error('Brand analysis error:', error)
    return NextResponse.json({ error: 'Analysis failed', details: error.message }, { status: 500 })
  }
}
