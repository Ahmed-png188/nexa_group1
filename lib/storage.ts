import { createClient } from '@/lib/supabase/server'

/**
 * Persists a file to Supabase Storage and returns a permanent public URL.
 *
 * Accepts either:
 *  - a URL string  → downloads the file first, then uploads (image / video)
 *  - an ArrayBuffer → uploads the binary directly (ElevenLabs voice MP3)
 */
export async function persistFile(
  source: string | ArrayBuffer,
  workspaceId: string,
  type: 'image' | 'video' | 'voice',
  contentId?: string
): Promise<string> {
  const supabase = createClient()

  try {
    let buffer: ArrayBuffer
    let contentType: string

    if (typeof source === 'string') {
      // URL path — download first
      const res = await fetch(source)
      if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`)
      buffer      = await res.arrayBuffer()
      contentType = res.headers.get('content-type') ?? getMimeType(type)
    } else {
      // Already have the binary (e.g. ElevenLabs MP3)
      buffer      = source
      contentType = getMimeType(type)
    }

    // Build storage path
    const ext      = getExtension(type)
    const filename = `${workspaceId}/${type}s/${contentId ?? Date.now()}.${ext}`

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('generated-content')
      .upload(filename, buffer, { contentType, upsert: true })

    if (error) throw error

    // Return permanent public URL
    const { data: urlData } = supabase.storage
      .from('generated-content')
      .getPublicUrl(filename)

    return urlData.publicUrl

  } catch (err) {
    // Return original URL as fallback (only meaningful when source is a string)
    return typeof source === 'string' ? source : ''
  }
}

function getMimeType(type: 'image' | 'video' | 'voice'): string {
  if (type === 'image') return 'image/jpeg'
  if (type === 'video') return 'video/mp4'
  return 'audio/mpeg'
}

function getExtension(type: 'image' | 'video' | 'voice'): string {
  if (type === 'image') return 'jpg'
  if (type === 'video') return 'mp4'
  return 'mp3'
}
