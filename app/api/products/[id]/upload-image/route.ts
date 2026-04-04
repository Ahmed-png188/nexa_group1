export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as svcClient } from '@supabase/supabase-js'

function svc() {
  return svcClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file)
      return NextResponse.json({ error: 'No file' }, { status: 400 })

    const ext = file.name.split('.').pop() || 'jpg'
    const path = `products/${params.id}/${Date.now()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await svc()
      .storage
      .from('landing-assets')
      .upload(path, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) throw uploadError

    const { data: urlData } = svc()
      .storage
      .from('landing-assets')
      .getPublicUrl(path)

    const publicUrl = urlData.publicUrl

    const { data: product } = await svc()
      .from('workspace_products')
      .select('images')
      .eq('id', params.id)
      .single()

    const images: Array<{ url: string; alt: string; order: number }> =
      (product?.images as any[] || [])
    images.push({
      url:   publicUrl,
      alt:   file.name.replace(/\.[^/.]+$/, ''),
      order: images.length,
    })

    await svc()
      .from('workspace_products')
      .update({ images, updated_at: new Date().toISOString() })
      .eq('id', params.id)

    return NextResponse.json({ url: publicUrl, images })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
