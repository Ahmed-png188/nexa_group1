import { createClient } from '@/lib/supabase/server'

/**
 * Fetches the brand intelligence profile for a workspace
 * and returns ready-to-inject context strings for each generation type
 */
export async function getBrandContext(workspaceId: string) {
  const supabase = createClient()

  // Get workspace basic brand info
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('brand_name, brand_tagline, brand_voice, brand_audience, brand_tone, brand_colors, name')
    .eq('id', workspaceId)
    .single()

  // Get full brand intelligence profile
  const { data: profileAsset } = await supabase
    .from('brand_assets')
    .select('analysis')
    .eq('workspace_id', workspaceId)
    .eq('file_name', 'nexa_brand_intelligence.json')
    .single()

  const profile = profileAsset?.analysis as any

  if (!workspace) return null

  const brandName = workspace.brand_name || workspace.name || 'this brand'

  // Build context for copy generation
  const copyContext = profile ? `
## Brand Intelligence for ${brandName}
Voice: ${profile.voice?.primary_tone || workspace.brand_voice || 'professional and confident'}
Writing style: ${profile.voice?.writing_style || 'clear and direct'}
Tone markers: ${profile.voice?.vocabulary?.join(', ') || workspace.brand_tone || 'engaging'}
Audience: ${profile.audience?.primary || workspace.brand_audience || 'target audience'}
Audience psychology: ${profile.audience?.psychology || 'motivated professionals'}
Pain points: ${profile.audience?.pain_points?.join(', ') || 'common challenges'}
Brand positioning: ${profile.positioning?.unique_angle || 'market leader'}
Content style: ${profile.content?.formats?.join(', ') || 'varied formats'}
Hook style: ${profile.content?.hooks?.join(', ') || 'engaging hooks'}
${profile.generation_instructions?.copy_prompt_prefix || ''}
` : `
## Brand: ${brandName}
Voice: ${workspace.brand_voice || 'professional and confident'}
Audience: ${workspace.brand_audience || 'target audience'}
Tone: ${workspace.brand_tone || 'engaging and authoritative'}
`

  // Build context for image generation
  const imageContext = profile ? `
Brand: ${brandName}
Visual aesthetic: ${profile.visual?.aesthetic || 'premium and professional'}
Photography style: ${profile.visual?.photography_style || 'high quality, professional'}
Color mood: ${profile.visual?.color_mood || 'sophisticated'}
Composition: ${profile.visual?.composition || 'clean and purposeful'}
${profile.generation_instructions?.image_prompt_prefix || ''}
` : `Brand: ${brandName}, professional brand photography`

  // Build context for video generation
  const videoContext = profile ? `
Brand: ${brandName}
Video aesthetic: ${profile.visual?.video_style || 'cinematic and premium'}
Visual style: ${profile.visual?.aesthetic || 'professional'}
${profile.generation_instructions?.video_prompt_prefix || ''}
` : `Brand: ${brandName}, professional brand video`

  // Build context for voice generation
  const voiceContext = profile ? `
Brand voice: ${profile.voice?.primary_tone || workspace.brand_voice || 'confident and professional'}
Delivery style: ${profile.generation_instructions?.voice_prompt_prefix || 'clear, confident, professional'}
` : `Brand voice: ${workspace.brand_voice || 'professional'}`

  return {
    workspace,
    profile,
    copyContext: copyContext.trim(),
    imageContext: imageContext.trim(),
    videoContext: videoContext.trim(),
    voiceContext: voiceContext.trim(),
    brandName,
  }
}

/**
 * Builds an enhanced prompt that incorporates brand context
 */
export function buildBrandedPrompt(
  userPrompt: string,
  brandContext: string,
  type: 'copy' | 'image' | 'video' | 'voice'
): string {
  if (type === 'copy') {
    return `${brandContext}\n\n## Content Request\n${userPrompt}\n\nGenerate content that perfectly embodies this brand's voice, speaks directly to their audience, and reflects their positioning. Make it feel like it was written by the brand founder themselves — not an AI.`
  }
  if (type === 'image') {
    return `${brandContext}, ${userPrompt}, professional brand photography, high quality`
  }
  if (type === 'video') {
    return `${brandContext}, ${userPrompt}, professional brand video production`
  }
  return userPrompt
}
