export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

// Do NOT use top-level revalidate — causes issues with dynamic server fetches

export async function GET() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'not_configured', voices: [] }, { status: 200 })
    }

    const res = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey,
        'Accept': 'application/json',
      },
      // No next.revalidate — plain fetch for reliability
    })

    if (!res.ok) {
      const body = await res.text()
      console.error('[/api/voices] ElevenLabs error:', res.status, body)
      return NextResponse.json({ error: `elevenlabs_${res.status}`, voices: [] }, { status: 200 })
    }

    const data = await res.json()
    const allVoices = data.voices || []

    console.log('[/api/voices] Total from ElevenLabs:', allVoices.length)
    console.log('[/api/voices] Categories:', [...new Set(allVoices.map((v: any) => v.category))])

    // Include premade voices — exclude user-cloned ones (category = 'cloned')
    // ElevenLabs premade category can be 'premade', 'professional', or missing
    const voices = allVoices
      .filter((v: any) => v.category !== 'cloned' && v.category !== 'generated')
      .map((v: any) => ({
        id:      v.voice_id  as string,
        name:    v.name      as string,
        preview: (v.preview_url || null) as string | null,
        gender:  (v.labels?.gender   || '') as string,
        accent:  (v.labels?.accent   || '') as string,
        age:     (v.labels?.age      || '') as string,
        style:   (v.labels?.use_case || v.labels?.description || '') as string,
      }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name))

    return NextResponse.json(
      { voices, total: voices.length },
      {
        headers: {
          // Cache for 1 hour at CDN/browser level
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    )
  } catch (err: unknown) {
    console.error('[/api/voices] Exception:', err)
    return NextResponse.json({ error: 'fetch_failed', voices: [] }, { status: 200 })
  }
}
