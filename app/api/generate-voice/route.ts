import { rateLimit, LIMITS } from '@/lib/rate-limit'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { checkPlanAccess, checkCredits, CREDIT_COSTS } from '@/lib/plan-gate'
import { createClient } from '@/lib/supabase/server'
import { persistFile } from '@/lib/storage'
import { guardWorkspace } from '@/lib/workspace-guard'
import { getBrandContext } from '@/lib/brand-context'
import { enhanceVoiceScript } from '@/lib/prompt-enhancer'


function sanitize(input: unknown, max = 2000): string {
  if (typeof input !== 'string') throw new Error('Invalid input')
  return input.trim().slice(0, max)
}

const VOICE_IDS: Record<string, string> = {
  'rachel':  '21m00Tcm4TlvDq8ikWAM',
  'drew':    '29vD33N1ost6f7gBRAFC',
  'clyde':   '2EiwWnXFnvU5JabPnv8n',
  'paul':    '5Q0t7uMcjvnagumLfvZi',
  'domi':    'AZnzlk1XvdvUeBnXmlld',
  'bella':   'EXAVITQu4vr4xnSDxMaL',
  'Antoni':  'ErXwobaYiN019PkySvjV',
  'elli':    'MF3mGyEYCl7XYWbV9V6O',
}

// Duration-based credit cost
// ~150 chars ≈ 30s, ~300 chars ≈ 60s, ~900 chars ≈ 3min
function voiceCreditCost(charCount: number): { credits: number; label: string } {
  if (charCount <= 200)  return { credits: CREDIT_COSTS.voice_30s,  label: 'short (~30s)'  }
  if (charCount <= 600)  return { credits: CREDIT_COSTS.voice_60s,  label: 'medium (~60s)' }
  return                        { credits: CREDIT_COSTS.voice_3min, label: 'long (~3min)'  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate limit: per user
    const _rl = await rateLimit({ key: user.id, ...LIMITS.voiceGen })
    if (_rl.limited) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((_rl.resetAt.getTime() - Date.now()) / 1000)) } }
      )
    }

    const { workspace_id, text: rawText, voice_id = 'rachel', stability = 0.5, similarity_boost = 0.75 } = await request.json()
    const text = sanitize(rawText, 3000)
    if (!text) return NextResponse.json({ error: 'Text is required' }, { status: 400 })

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    const gateError = await checkPlanAccess(workspace_id, 'voice_generation')
    if (gateError) return gateError

    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: 'Voice generation not configured' }, { status: 503 })
    }

    // Duration-based credits
    const { credits: creditCost, label: durationLabel } = voiceCreditCost(text.length)

    const { ok, error: creditError } = await checkCredits(
      workspace_id, user.id, creditCost,
      'voice_gen',
      `Voice generation ${durationLabel} — ElevenLabs`,
    )
    if (!ok) return creditError!

    const resolvedVoiceId = VOICE_IDS[voice_id] ?? VOICE_IDS['rachel']
    const brand = await getBrandContext(workspace_id)
    let finalScript = text
    try { finalScript = await enhanceVoiceScript(text, brand) } catch {}

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${resolvedVoiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: finalScript.slice(0, 5000),
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability, similarity_boost, style: 0.5, use_speaker_boost: true },
      }),
    })

    if (!res.ok) {
      // Refund on error
      await supabase.rpc('deduct_credits', {
        p_workspace_id: workspace_id, p_amount: -creditCost,
        p_action: 'voice_gen_refund', p_user_id: user.id,
        p_description: 'Voice generation refund — ElevenLabs error',
      })
      throw new Error(`ElevenLabs error: ${res.status}`)
    }

    const audioBuffer = await res.arrayBuffer()
    const audioUrl = await persistFile(audioBuffer, workspace_id, 'voice')
    if (!audioUrl) throw new Error('Failed to save audio')

    const { data: savedContent } = await supabase.from('content').insert({
      workspace_id, created_by: user.id,
      type: 'voice', platform: 'general', status: 'draft',
      audio_url: audioUrl, body: text,
      credits_used: creditCost, ai_model: 'elevenlabs-multilingual-v2',
      metadata: { voice_id, stability, similarity_boost, char_count: text.length, duration_label: durationLabel },
    }).select().single()

    await supabase.from('activity').insert({
      workspace_id, user_id: user.id, type: 'voice_generated',
      title: `Voiceover generated — ${text.slice(0, 50)}${text.length > 50 ? '...' : ''}`,
      metadata: { content_id: savedContent?.id, credits_used: creditCost },
    })

    return NextResponse.json({ success: true, audio_url: audioUrl, content_id: savedContent?.id, credits_used: creditCost })

  } catch (error: unknown) {
    console.error('[generate-voice]', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Failed to generate voice' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    voices: [
      { id: 'rachel', name: 'Rachel', desc: 'Warm · Professional · Female' },
      { id: 'drew',   name: 'Drew',   desc: 'Confident · Clear · Male' },
      { id: 'clyde',  name: 'Clyde',  desc: 'Expressive · Dynamic · Male' },
      { id: 'paul',   name: 'Paul',   desc: 'Authoritative · Deep · Male' },
      { id: 'domi',   name: 'Domi',   desc: 'Strong · Direct · Female' },
      { id: 'bella',  name: 'Bella',  desc: 'Soft · Warm · Female' },
      { id: 'Antoni', name: 'Antoni', desc: 'Balanced · Natural · Male' },
      { id: 'elli',   name: 'Elli',   desc: 'Emotional · Engaging · Female' },
    ],
    credit_costs: {
      'short (~30s, up to 200 chars)': CREDIT_COSTS.voice_30s,
      'medium (~60s, up to 600 chars)': CREDIT_COSTS.voice_60s,
      'long (~3min, 600+ chars)': CREDIT_COSTS.voice_3min,
    }
  })
}
