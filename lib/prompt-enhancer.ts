import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function enhanceImagePrompt(userPrompt: string, brandContext: any): Promise<string> {
  const visual = brandContext?.profile?.visual?.aesthetic || 'premium, modern, professional'
  const colors = brandContext?.profile?.visual?.colors || 'rich, deep tones'
  const industry = brandContext?.profile?.business?.industry || 'professional services'

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
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

Brand context: ${visual}, colors: ${colors}, industry: ${industry}

Output ONLY the enhanced prompt. Maximum 140 words. No explanation. No preamble.

Basic prompt to enhance: "${userPrompt}"`,
    }],
  })

  return (response.content[0] as any).text.trim()
}

export async function enhanceVideoPrompt(userPrompt: string, brandContext: any): Promise<string> {
  const industry = brandContext?.profile?.business?.industry || 'professional services'
  const tone = brandContext?.profile?.voice?.primary_tone || 'confident, premium'

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `You are a cinematic director who has shot campaigns for Nike, Apple, and Chanel. Transform this basic video prompt into a professional director's brief that produces cinema-quality output.

CRITICAL RULES — non-negotiable:
- Output must look like a real film production, NOT AI-generated
- Always specify exact camera movement: slow dolly push, handheld verité, smooth orbit, locked off tripod, whip pan, crane descent — pick the one that serves the story
- Always specify lighting: golden hour backlight, soft overcast diffusion, dramatic side key with practical fill, neon reflected off wet street, etc.
- Always specify color grade: desaturated teal-orange blockbuster, warm Kodak Vision3 film, cold clinical blue-white, rich chocolate shadows with golden highlights
- Always specify aspect ratio: 9:16 for Reels/TikTok, 16:9 for YouTube/LinkedIn
- Always specify pace: slow 24fps cinematic, energetic quick cuts implied, single continuous take
- Motion must feel physical and real — specify if handheld adds tension or if smooth adds luxury
- Never use vague words like "cinematic" or "high quality" alone — always show what that means specifically
- Include one specific film or commercial reference if relevant

Brand tone: ${tone}, industry: ${industry}

Output ONLY the enhanced prompt. Maximum 160 words. No explanation. No preamble.

Basic prompt to enhance: "${userPrompt}"`,
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
