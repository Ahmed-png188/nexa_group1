import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function enhanceImagePrompt(userPrompt: string, brandContext: any): Promise<string> {
  const brand     = brandContext?.workspace?.brand_name || 'this brand'
  const visual    = brandContext?.profile?.visual?.aesthetic || 'premium, modern, professional'
  const colors    = brandContext?.profile?.visual?.color_mood || brandContext?.profile?.visual?.colors || 'rich, deep tones'
  const photoStyle= brandContext?.profile?.visual?.photography_style || 'professional brand photography'
  const composition = brandContext?.profile?.visual?.composition || 'clean, purposeful'
  const industry  = brandContext?.profile?.business?.industry || 'professional services'
  const customPfx = brandContext?.profile?.generation_instructions?.image_prompt_prefix || ''

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `You are a world-class commercial photographer and art director. Transform this basic image prompt into a professional photographic brief that produces results indistinguishable from a real professional photoshoot.

CRITICAL RULES — non-negotiable:
- Output must look like a real photograph, NOT AI-generated
- Human skin must look real: pores visible, natural imperfections, real texture, subsurface scattering
- Products must look real: actual material texture, real reflections, weight and depth
- No plastic-looking skin, no glowing edges, no dreamlike blur
- Light must have a real source — name it specifically
- Always include a specific camera and lens equivalent
- Always include a specific color grade or film stock reference
- Always include composition technique (rule of thirds, leading lines, negative space, etc.)

Brand: ${brand} | Aesthetic: ${visual} | Colors: ${colors} | Photography: ${photoStyle} | Composition: ${composition} | Industry: ${industry}${customPfx ? ' | ' + customPfx : ''}

Output ONLY the enhanced prompt. Maximum 140 words. No explanation. No preamble.

Basic prompt to enhance: "${userPrompt}"`,
    }],
  })

  return (response.content[0] as any).text.trim()
}

export async function enhanceVideoPrompt(userPrompt: string, brandContext: any): Promise<string> {
  const brand     = brandContext?.workspace?.brand_name || 'this brand'
  const industry  = brandContext?.profile?.business?.industry || 'professional services'
  const tone      = brandContext?.profile?.voice?.primary_tone || 'confident, premium'
  const aesthetic = brandContext?.profile?.visual?.aesthetic || 'premium and modern'
  const colorMood = brandContext?.profile?.visual?.color_mood || 'rich sophisticated tones'
  const vidStyle  = brandContext?.profile?.visual?.video_style || 'cinematic brand content'
  const audience  = brandContext?.profile?.audience?.primary || 'professional audience'
  const customPfx = brandContext?.profile?.generation_instructions?.video_prompt_prefix || ''

  const brandDNA = [
    `Brand: ${brand}`,
    `Industry: ${industry}`,
    `Tone: ${tone}`,
    `Visual aesthetic: ${aesthetic}`,
    `Color palette mood: ${colorMood}`,
    `Video style: ${vidStyle}`,
    `Audience: ${audience}`,
    customPfx ? `Custom brand direction: ${customPfx}` : ''
  ].filter(Boolean).join('\n')

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 350,
    messages: [{
      role: 'user',
      content: `You are a creative director who has shot campaigns for Nike, Apple, Chanel and Rolex. You don't just make beautiful videos — you make videos that feel unmistakably like a specific brand.

BRAND DNA (every creative decision must serve this):
${brandDNA}

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

Basic prompt: "${userPrompt}"`,
    }],
  })

  return (response.content[0] as any).text.trim()
}

export async function enhanceVoiceScript(script: string, brandContext: any): Promise<string> {
  const tone = brandContext?.profile?.voice?.primary_tone || 'confident, authoritative'

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `You are a voice director who has directed Morgan Freeman, David Attenborough style narrations, and premium brand campaigns. Add professional delivery notation to this script.

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

Script: "${script}"`,
    }],
  })

  return (response.content[0] as any).text.trim()
}

export async function enhanceImageToVideoPrompt(
  userPrompt: string,
  brandContext: any,
  mode: 'image' | 'frame'
): Promise<string> {
  const brand     = brandContext?.workspace?.brand_name || 'this brand'
  const industry  = brandContext?.profile?.business?.industry || 'professional services'
  const tone      = brandContext?.profile?.voice?.primary_tone || 'confident, premium'
  const aesthetic = brandContext?.profile?.visual?.aesthetic || 'premium and modern'
  const colorMood = brandContext?.profile?.visual?.color_mood || 'rich, sophisticated tones'
  const vidStyle  = brandContext?.profile?.visual?.video_style || 'cinematic brand content'
  const customPfx = brandContext?.profile?.generation_instructions?.video_prompt_prefix || ''

  // Brand visual DNA — this is what makes every video feel on-brand
  const brandDNA = `
Brand: ${brand}
Industry: ${industry}
Tone: ${tone}
Visual aesthetic: ${aesthetic}
Color palette mood: ${colorMood}
Video style: ${vidStyle}
${customPfx ? `Custom brand direction: ${customPfx}` : ''}
`.trim()

  const modeContext = mode === 'image'
    ? `The user is animating a STILL IMAGE into a video. The motion should feel intentional and premium — not random. Enhance with specific camera movement that respects the composition of the original image.`
    : `The user is creating a video that TRANSITIONS between a start frame and end frame. The motion should connect both frames naturally and cinematically.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 350,
    messages: [{
      role: 'user',
      content: `You are a creative director at a top-tier brand agency — the kind that shoots campaigns for Porsche, Apple, and Rolex. You understand brand identity deeply and translate it into cinematic motion.

${modeContext}

BRAND DNA (use this to ensure every creative decision is on-brand):
${brandDNA}

AS CREATIVE DIRECTOR, your job is to:
1. Take the user's basic prompt and elevate it with brand-appropriate motion language
2. Specify camera movement that matches the brand's aesthetic (luxury brands = slow, deliberate; energy brands = dynamic, kinetic)
3. Specify lighting that reinforces the color mood (warm amber for warmth, cool blue for tech, golden hour for aspiration)
4. Specify the ONE most important motion element — what moves, how it moves, why it moves
5. Reference the brand's visual tone in the motion style

RULES:
- Every word must serve the brand aesthetic
- Motion must feel INTENTIONAL, not random
- Specify: camera movement + lighting + color grade + key motion element
- Maximum 150 words
- Output ONLY the enhanced prompt — no explanation, no preamble

User's prompt: "${userPrompt || 'animate this brand image cinematically'}"`,
    }],
  })

  return (response.content[0] as any).text.trim()
}
