import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { GROWTH_STAGES, buildUnifiedBriefing } from './prompts'

async function detectClientStage(
  supabase: any,
  workspaceId: string
): Promise<string> {
  try {
    const { data: ws } = await supabase
      .from('workspaces')
      .select('client_stage')
      .eq('id', workspaceId)
      .single()

    if ((ws as any)?.client_stage) return (ws as any).client_stage

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()

    const [contentResult, adsResult] = await Promise.all([
      supabase
        .from('content')
        .select('id, performance_score')
        .eq('workspace_id', workspaceId)
        .eq('status', 'published')
        .gte('created_at', thirtyDaysAgo),
      supabase
        .from('amplify_campaigns')
        .select('id, status')
        .eq('workspace_id', workspaceId)
        .eq('status', 'ACTIVE'),
    ])

    const publishedCount = contentResult.data?.length || 0
    const hasActiveAds = (adsResult.data?.length || 0) > 0
    const avgPerformance = publishedCount > 0
      ? (contentResult.data || []).reduce((s: number, c: any) => s + (c.performance_score || 50), 0) / publishedCount
      : 0

    if (hasActiveAds && avgPerformance > 60) return 'amplify'
    if (publishedCount >= 20 && avgPerformance > 50) return 'momentum'
    if (publishedCount >= 5) return 'foundation'
    return 'foundation'
  } catch {
    return 'foundation'
  }
}

/**
 * Fetches the brand intelligence profile for a workspace
 * and returns ready-to-inject context strings for each generation type
 */
export async function getBrandContext(userIdOrWorkspaceId: string) {
  const supabase = createClient()

  // Accept either a user_id (UUID) or workspace_id — look up workspace if needed
  let workspaceId = userIdOrWorkspaceId
  
  // Try treating as user_id first — if workspace lookup succeeds, use that workspace_id
  try {
    const { data: member } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userIdOrWorkspaceId)
      .limit(1)
      .single()
    if (member?.workspace_id) workspaceId = member.workspace_id
  } catch { /* not a user_id, treat as workspace_id directly */ }

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

  // Fetch recent brand learnings
  const { data: learnings } = await supabase
    .from('brand_learnings')
    .select('insight_type, insight, source, confidence')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(20)

  // Detect client stage
  const clientStage = await detectClientStage(supabase, workspaceId)
  const stageInfo = GROWTH_STAGES[clientStage as keyof typeof GROWTH_STAGES] || GROWTH_STAGES.foundation

  // Build learnings context string
  const learningsContext = (learnings as any[])?.length
    ? (learnings as any[]).map((l: any) => `[${l.insight_type}] ${l.insight}`).join('\n')
    : ''

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

  // Build unified briefing
  const unifiedBriefing = buildUnifiedBriefing(
    { profile, workspace, brandName },
    clientStage
  )

  return {
    workspace,
    profile,
    copyContext: copyContext.trim(),
    imageContext: imageContext.trim(),
    videoContext: videoContext.trim(),
    voiceContext: voiceContext.trim(),
    brandName,
    workspaceId,
    brandVoice: workspace.brand_voice || '',
    brandTone: workspace.brand_tone || '',
    brandAudience: workspace.brand_audience || '',
    learnings: (learnings as any[]) || [],
    learningsContext,
    clientStage,
    stageInfo,
    unifiedBriefing,
  }
}

/**
 * Service-role version of getBrandContext — safe to call from async background
 * processing (webhook handlers, crons) where Next.js cookies() is unavailable.
 * Always takes a workspaceId directly (never a userId).
 */
export async function getBrandContextService(workspaceId: string) {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('brand_name, brand_tagline, brand_voice, brand_audience, brand_tone, brand_colors, name')
    .eq('id', workspaceId)
    .single()

  const { data: profileAsset } = await supabase
    .from('brand_assets')
    .select('analysis')
    .eq('workspace_id', workspaceId)
    .eq('file_name', 'nexa_brand_intelligence.json')
    .single()

  const profile = profileAsset?.analysis as any

  if (!workspace) return null

  const brandName = workspace.brand_name || workspace.name || 'this brand'

  // Fetch recent brand learnings
  const { data: learningsService } = await supabase
    .from('brand_learnings')
    .select('insight_type, insight, source, confidence')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(20)

  // Detect client stage
  const clientStageService = await detectClientStage(supabase, workspaceId)
  const stageInfoService = GROWTH_STAGES[clientStageService as keyof typeof GROWTH_STAGES] || GROWTH_STAGES.foundation

  const learningsContextService = (learningsService as any[])?.length
    ? (learningsService as any[]).map((l: any) => `[${l.insight_type}] ${l.insight}`).join('\n')
    : ''

  const copyContext = profile ? `
## Brand Intelligence for ${brandName}
Voice: ${profile.voice?.primary_tone || workspace.brand_voice || 'professional and confident'}
Audience: ${profile.audience?.primary || workspace.brand_audience || 'target audience'}
Tone: ${profile.voice?.primary_tone || workspace.brand_tone || 'engaging'}
` : `
## Brand: ${brandName}
Voice: ${workspace.brand_voice || 'professional and confident'}
Audience: ${workspace.brand_audience || 'target audience'}
`

  const unifiedBriefingService = buildUnifiedBriefing(
    { profile, workspace, brandName },
    clientStageService
  )

  return {
    workspace,
    profile,
    copyContext:      copyContext.trim(),
    brandName,
    workspaceId,
    brandVoice:       workspace.brand_voice    || '',
    brandTone:        workspace.brand_tone     || '',
    brandAudience:    workspace.brand_audience || '',
    learnings:        (learningsService as any[]) || [],
    learningsContext: learningsContextService,
    clientStage:      clientStageService,
    stageInfo:        stageInfoService,
    unifiedBriefing:  unifiedBriefingService,
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
