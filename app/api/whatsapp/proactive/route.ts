export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { waSendText, waSendVoiceNote, waUpdateContext } from '@/lib/whatsapp'
import { generateBrandQuestion } from '@/lib/whatsapp-intent'
import { getBrandContext } from '@/lib/brand-context'

export async function GET(request: NextRequest) {
  // Verify this is from Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase  = createClient()
  const now       = new Date()
  const dayOfWeek = now.getDay() // 0=Sun, 1=Mon...

  // Get all active WhatsApp connections
  const { data: connections } = await supabase
    .from('whatsapp_connections')
    .select('*, whatsapp_context(*)')
    .eq('is_active', true)

  if (!connections?.length) return NextResponse.json({ processed: 0 })

  let processed = 0

  for (const conn of connections) {
    try {
      const { workspace_id, phone_number, lang } = conn as {
        workspace_id: string
        phone_number: string
        lang:         string
      }
      const ctxArr = (conn as Record<string, unknown>).whatsapp_context as Array<Record<string, unknown>> | undefined
      const context = ctxArr?.[0]
      const brand   = await getBrandContext(workspace_id)
      const b = brand as Record<string, unknown> | null
      const ws = b?.workspace as Record<string, unknown> | null
      const brandName = (b?.brandName as string) || (ws?.brand_name as string) || 'your brand'
      const safeVoid = brandName // suppress unused warning

      // ── MONDAY: Weekly brand training question ──────────────────────────
      if (dayOfWeek === 1) {
        const lastQuestionAt = context?.last_question_at as string | undefined
        const daysSinceQuestion = lastQuestionAt
          ? (now.getTime() - new Date(lastQuestionAt).getTime()) / (1000 * 60 * 60 * 24)
          : 999

        if (daysSinceQuestion >= 6) {
          // Get previously asked questions from brand_learnings
          const { data: learnings } = await supabase
            .from('brand_learnings')
            .select('content')
            .eq('workspace_id', workspace_id)
            .eq('source', 'whatsapp_training')
            .order('created_at', { ascending: false })
            .limit(10)

          const askedQuestions = (learnings as Array<{ content: string }> | null)?.map(l => l.content) || []
          const question = await generateBrandQuestion(brand, askedQuestions, lang as 'en' | 'ar')

          await waSendText(phone_number, question)
          await waUpdateContext(workspace_id, {
            last_question_at: now.toISOString()
          })
          processed++
        }
      }

      // ── DAILY: Morning brief (only if not sent today) ───────────────────
      const lastBriefAt   = context?.last_brief_at as string | undefined
      const briefSentToday = lastBriefAt &&
        new Date(lastBriefAt).toDateString() === now.toDateString()

      if (!briefSentToday) {
        // Check credits first
        const { data: creds } = await supabase
          .from('credits')
          .select('balance')
          .eq('workspace_id', workspace_id)
          .single()
        const balance = (creds as Record<string, number> | null)?.balance ?? 0

        // Low credit alert (only if below 50)
        if (balance < 50 && balance > 0) {
          const alert = lang === 'ar'
            ? `تنبيه: رصيدك ${balance} كريديت فقط — قارب على الانتهاء 🔔\nشحّن من لوحة التحكم nexaa.cc`
            : `Heads up: you have ${balance} credits left — running low 🔔\nTop up at nexaa.cc`
          await waSendText(phone_number, alert)
        }

        // Send morning brief from cached workspace data
        try {
          const { data: workspaceData } = await supabase
            .from('workspaces')
            .select('weekly_brief, weekly_brief_ar')
            .eq('id', workspace_id)
            .single()

          const brief = lang === 'ar'
            ? (workspaceData as Record<string, unknown>)?.weekly_brief_ar
            : (workspaceData as Record<string, unknown>)?.weekly_brief

          if (brief && typeof brief === 'object') {
            const b2 = brief as Record<string, string>
            const briefText = `*${b2.headline || ''}*\n\n${b2.todays_priority || ''}\n\n💡 ${b2.one_thing || ''}`
            await waSendVoiceNote(phone_number, briefText, undefined, lang as 'en' | 'ar')
            await waUpdateContext(workspace_id, {
              last_brief_at: now.toISOString()
            })
            processed++
          }
        } catch (briefErr) {
          console.error(`[wa-proactive] brief failed for ${workspace_id}:`, briefErr)
        }
      }

      void safeVoid
    } catch (err) {
      console.error('[wa-proactive] error for connection:', err)
    }
  }

  return NextResponse.json({ processed, total: connections.length })
}
