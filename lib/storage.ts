import { createClient } from '@/lib/supabase/server'

/**
 * Downloads a file from a URL and uploads it to Supabase Storage
 * Returns a permanent public URL
 */
export async function persistFile(
  url: string,
  workspaceId: string,
  type: 'image' | 'video' | 'voice',
  contentId?: string
): Promise<string> {
  const supabase = createClient()

  try {
    // Download the file
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`)

    const buffer = await res.arrayBuffer()
    const contentType = res.headers.get('content-type') ?? getMimeType(type)

    // Build storage path
    const ext = getExtension(type)
    const filename = `${workspaceId}/${type}s/${contentId ?? Date.now()}.${ext}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('generated-content')
      .upload(filename, buffer, {
        contentType,
        upsert: true,
      })

    if (error) throw error

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('generated-content')
      .getPublicUrl(filename)

    return urlData.publicUrl

  } catch (err) {
    console.error('Failed to persist file:', err)
    // Return original URL as fallback
    return url
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
