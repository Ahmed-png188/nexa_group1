import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function enhanceImagePrompt(userPrompt: string, brandContext: any): Promise<string> {
  const visual = brandContext?.profile?.visual?.aesthetic || 'premium, dark, modern'
  const colors = brandContext?.profile?.visual?.colors || 'dark, blue accents'

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 250,
    messages: [{
      role: 'user',
      content: `You are a world-class art director. Transform this basic image prompt into a professional visual brief. Keep the core idea. Add: camera lens (e.g. 85mm f/1.4), lighting setup, color grade, composition style, quality markers. Brand visual style: ${visual}. Brand colors: ${colors}. Output ONLY the enhanced prompt, max 120 words, no explanation.

Basic prompt: "${userPrompt}"`,
    }],
  })
  return (response.content[0] as any).text.trim()
}

export async function enhanceVideoPrompt(userPrompt: string, brandContext: any): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 250,
    messages: [{
      role: 'user',
      content: `You are a cinematic director. Transform this basic video prompt into a professional director's brief. Keep the core idea. Always include: camera movement (dolly in/out, pan, orbit, handheld, static), lighting (golden hour, studio, dramatic, soft natural), color grade (cinematic, warm, cold, neutral), aspect ratio (9:16 for reels, 16:9 for landscape), pace (slow, medium, fast cuts), film style reference. Output ONLY the enhanced prompt, max 150 words, no explanation.

Basic prompt: "${userPrompt}"`,
    }],
  })
  return (response.content[0] as any).text.trim()
}

export async function enhanceVoiceScript(script: string, brandContext: any): Promise<string> {
  const tone = brandContext?.profile?.voice?.primary_tone || 'confident, professional'

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `You are a voice director. Add professional pacing and delivery notes to this script. Add: [pause] for deliberate pauses, *word* for emphasis, (beat) for longer pauses, natural breathing points. Brand tone: ${tone}. Output ONLY the marked-up script, no explanation.

Script: "${script}"`,
    }],
  })
  return (response.content[0] as any).text.trim()
}
