import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { persistFile } from '@/lib/storage'

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

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, text, voice_id = 'rachel', stability = 0.5, similarity_boost = 0.75 } = await request.json()
    if (!text?.trim()) return NextResponse.json({ error: 'Text is required' }, { status: 400 })

    const { data: deducted } = await supabase.rpc('deduct_credits', {
      p_workspace_id: workspace_id,
      p_amount: 8,
      p_action: 'voice_gen',
      p_user_id: user.id,
      p_description: `Voice generation — ElevenLabs`,
    })

    if (!deducted) {
      return NextResponse.json({
        error: 'Insufficient credits',
        message: 'Voice generation costs 8 credits.',
      }, { status: 402 })
    }

    const resolvedVoiceId = VOICE_IDS[voice_id] ?? VOICE_IDS['rachel']

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${resolvedVoiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: text.slice(0, 5000),
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability,
          similarity_boost,
          style: 0.5,
          use_speaker_boost: true,
        },
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      const { data: cr } = await supabase.from('credits').select('balance').eq('workspace_id', workspace_id).single()
      await supabase.from('credits').update({ balance: (cr?.balance ?? 0) + 8 }).eq('workspace_id', workspace_id)
      throw new Error(`ElevenLabs error: ${errText}`)
    }

    // Save audio to Supabase Storage (not base64 — permanent file)
    const audioBuffer = await res.arrayBuffer()
    const filename = `${workspace_id}/voices/${Date.now()}.mp3`

    const { error: uploadError } = await supabase.storage
      .from('generated-content')
      .upload(filename, audioBuffer, { contentType: 'audio/mpeg', upsert: true })

    let audioUrl: string
    if (uploadError) {
      // Fallback to base64 if storage fails
      const base64 = Buffer.from(audioBuffer).toString('base64')
      audioUrl = `data:audio/mpeg;base64,${base64}`
    } else {
      const { data: urlData } = supabase.storage.from('generated-content').getPublicUrl(filename)
      audioUrl = urlData.publicUrl
    }

    // Save to content table
    const { data: savedContent } = await supabase.from('content').insert({
      workspace_id,
      created_by: user.id,
      type: 'voice',
      platform: 'general',
      status: 'draft',
      voice_url: audioUrl,
      body: text,
      credits_used: 8,
      ai_model: 'elevenlabs-multilingual-v2',
      metadata: { voice_id, stability, similarity_boost, char_count: text.length },
    }).select().single()

    await supabase.from('activity').insert({
      workspace_id,
      user_id: user.id,
      type: 'voice_generated',
      title: `Voiceover generated — ${text.slice(0, 50)}${text.length > 50 ? '...' : ''}`,
      metadata: { content_id: savedContent?.id, credits_used: 8 },
    })

    return NextResponse.json({
      success: true,
      audio_url: audioUrl,
      content_id: savedContent?.id,
      credits_used: 8,
    })

  } catch (error: any) {
    console.error('Voice generation error:', error)
    return NextResponse.json({ error: 'Failed to generate voice', details: error.message }, { status: 500 })
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
    ]
  })
}
