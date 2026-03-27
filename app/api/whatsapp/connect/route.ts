export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { guardWorkspace } from '@/lib/workspace-guard'
import { waSendText } from '@/lib/whatsapp'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, phone_number, lang = 'en' } = await request.json()
    if (!workspace_id || !phone_number) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    // Normalize phone: ensure E.164 format
    const normalized = phone_number.startsWith('+')
      ? phone_number
      : `+${phone_number}`

    // Check if already connected
    const { data: existing } = await supabase
      .from('whatsapp_connections')
      .select('id')
      .eq('phone_number', normalized)
      .single()

    if (existing) {
      // Update existing connection
      await supabase
        .from('whatsapp_connections')
        .update({ workspace_id, user_id: user.id, lang, is_active: true })
        .eq('phone_number', normalized)
    } else {
      // Create new connection
      await supabase.from('whatsapp_connections').insert({
        workspace_id,
        user_id:      user.id,
        phone_number: normalized,
        lang,
      })
    }

    // Get workspace name
    const { data: ws } = await supabase
      .from('workspaces')
      .select('brand_name, name')
      .eq('id', workspace_id)
      .single()
    const brandName = (ws as Record<string, string> | null)?.brand_name
      || (ws as Record<string, string> | null)?.name
      || 'your brand'

    // Send welcome message
    const welcome = lang === 'ar'
      ? `أهلاً! أنا Nexa لـ ${brandName} 🎯\n\nمن الآن تقدر تتحكم بكل شي من هنا:\n• أطلب مني أكتب منشور\n• أرسل صورة منتجك\n• اسأل عن أداء إعلاناتك\n• اطلب ملخص اليوم\n\nأنا شغّال ٢٤/٧ — كلّمني وقت ما تبي 🚀`
      : `Hey! I'm Nexa for ${brandName} 🎯\n\nFrom now you can control everything from here:\n• Ask me to write a post\n• Send me a product photo\n• Ask about your ad performance\n• Ask for today's brief\n\nI'm here 24/7 — message me anytime 🚀`

    await waSendText(normalized, welcome)

    return NextResponse.json({ success: true, phone: normalized })

  } catch (err) {
    console.error('[wa-connect]', err)
    return NextResponse.json({ error: 'Connection failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id } = await request.json()
    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    await supabase
      .from('whatsapp_connections')
      .update({ is_active: false })
      .eq('workspace_id', workspace_id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[wa-disconnect]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
