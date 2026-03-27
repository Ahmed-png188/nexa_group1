import { createClient } from '@/lib/supabase/server'
import { getBrandContext } from '@/lib/brand-context'
import {
  waSendText,
  waSendMedia,
  waSendVoiceNote,
  waUpdateContext,
} from '@/lib/whatsapp'
import { generateNexaReply } from '@/lib/whatsapp-intent'
import type { IntentResult } from '@/lib/whatsapp-intent'

interface ActionContext {
  phone:        string
  workspace_id: string
  user_id:      string
  lang:         'en' | 'ar'
  intent:       IntentResult
  rawMessage:   string
  mediaUrl?:    string
  brand:        unknown
  context:      unknown  // whatsapp_context row
}

export async function handleAction(ctx: ActionContext): Promise<void> {
  const { phone, workspace_id, lang, intent, brand, context } = ctx
  const b = brand as Record<string, unknown> | null
  const ws = b?.workspace as Record<string, unknown> | null
  const brandName = (b?.brandName as string) || (ws?.brand_name as string) || 'your brand'
  const ctxRow = context as Record<string, unknown> | null

  // ── GREETING ────────────────────────────────────────────────────────────
  if (intent.intent === 'greeting') {
    const reply = await generateNexaReply(
      lang === 'ar'
        ? `المستخدم يحيّيك. رد بطريقة دافئة ومختصرة. اذكر اسم العلامة التجارية ${brandName}.`
        : `User greeted you. Reply warmly and briefly. Mention brand ${brandName}.`,
      brandName, lang, context
    )
    await waSendText(phone, reply)
    return
  }

  // ── CHECK CREDITS ────────────────────────────────────────────────────────
  if (intent.intent === 'check_credits') {
    const supabase = createClient()
    const { data: creds } = await supabase
      .from('credits')
      .select('balance')
      .eq('workspace_id', workspace_id)
      .single()

    const balance = (creds as Record<string, number> | null)?.balance ?? 0
    const msg = lang === 'ar'
      ? `رصيدك الحالي ${balance.toLocaleString()} كريديت 💳\n${balance < 50 ? 'الرصيد منخفض — تقدر تشحن من لوحة التحكم' : 'كافٍ للعمل بشكل طبيعي'}`
      : `Your current balance is ${balance.toLocaleString()} credits 💳\n${balance < 50 ? 'Running low — top up from the dashboard' : 'Good to go'}`
    await waSendText(phone, msg)
    return
  }

  // ── MORNING BRIEF ────────────────────────────────────────────────────────
  if (intent.intent === 'morning_brief') {
    try {
      const supabase = createClient()
      // Get brand context directly (avoid auth-gated API call)
      const brandCtx = await getBrandContext(workspace_id)
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('weekly_brief, weekly_brief_ar')
        .eq('id', workspace_id)
        .single()

      const cachedBrief = lang === 'ar'
        ? (workspace as Record<string, unknown>)?.weekly_brief_ar
        : (workspace as Record<string, unknown>)?.weekly_brief

      if (cachedBrief && typeof cachedBrief === 'object') {
        const brief = cachedBrief as Record<string, string>
        const briefText = lang === 'ar'
          ? `*${brief.headline || 'ملخص اليوم'}*\n\n${brief.todays_priority || ''}\n\n💡 ${brief.one_thing || ''}`
          : `*${brief.headline || "Today's Brief"}*\n\n${brief.todays_priority || ''}\n\n💡 ${brief.one_thing || ''}`

        await waSendVoiceNote(phone, briefText, undefined, lang)
        await waUpdateContext(workspace_id, { last_brief_at: new Date().toISOString() })
      } else {
        // Fallback: generate brief inline
        const brandName_ = (brandCtx?.brandName) || 'your brand'
        const fallback = lang === 'ar'
          ? `صباح الخير! اليوم يوم جديد لـ ${brandName_} 🌅\n\nلا يوجد ملخص محفوظ بعد. شغّل المساعدين من لوحة التحكم لتوليد ملخص يومي.`
          : `Good morning! New day for ${brandName_} 🌅\n\nNo brief cached yet. Run the agents from your dashboard to generate a daily brief.`
        await waSendText(phone, fallback)
      }
    } catch (err) {
      console.error('[wa-action] morning_brief failed:', err)
    }
    return
  }

  // ── CREATE POST ──────────────────────────────────────────────────────────
  if (intent.intent === 'create_post') {
    const platform    = intent.params.platform     || 'instagram'
    const contentType = intent.params.content_type || 'post'
    const topic       = intent.params.topic        || intent.summary

    try {
      // Send acknowledgment immediately
      const ack = await generateNexaReply(
        lang === 'ar'
          ? `المستخدم طلب كتابة منشور عن: ${topic}. أخبره أنك تعمل عليه.`
          : `User asked for a ${contentType} about: ${topic}. Tell them you're on it.`,
        brandName, lang, context
      )
      await waSendText(phone, ack)

      // Generate content via existing API
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/generate-content`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id,
          type: contentType,
          platform,
          prompt: topic,
          lang,
        }),
      })
      const data = await res.json() as Record<string, unknown>
      const content = (data.content || data.body || data.text) as string | undefined

      if (content) {
        // Save pending action for approval
        await waUpdateContext(workspace_id, {
          pending_action: {
            type:       'approve_post',
            content_id: data.content_id,
            platform,
            body:       content,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }
        })

        const deliveryMsg = lang === 'ar'
          ? `هذا المنشور جاهز 👇\n\n${content}\n\n———\nرد بـ *نعم* للنشر، *تعديل [ما تبيه]* للتغيير، أو *لا* للإلغاء`
          : `Here's your ${contentType} 👇\n\n${content}\n\n———\nReply *yes* to publish, *edit [what you want]* to change it, or *no* to cancel`
        await waSendText(phone, deliveryMsg)
      } else {
        await waSendText(phone, lang === 'ar' ? 'ما قدرت أنشئ المحتوى، حاول مرة ثانية' : "Couldn't generate the content, try again")
      }
    } catch (err) {
      console.error('[wa-action] create_post failed:', err)
    }
    return
  }

  // ── CREATE IMAGE ─────────────────────────────────────────────────────────
  if (intent.intent === 'create_image') {
    const topic = intent.params.topic || intent.summary

    try {
      const ack = await generateNexaReply(
        lang === 'ar'
          ? `المستخدم طلب صورة عن: ${topic}. أخبره أنك تولّدها.`
          : `User wants an image about: ${topic}. Tell them generating now.`,
        brandName, lang, context
      )
      await waSendText(phone, ack)

      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/generate-image`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id, prompt: topic, lang }),
      })
      const data = await res.json() as Record<string, unknown>

      if (data.image_url) {
        await waUpdateContext(workspace_id, {
          pending_action: {
            type:       'approve_image',
            content_id: data.content_id,
            image_url:  data.image_url,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }
        })
        const caption = lang === 'ar'
          ? 'هذه الصورة جاهزة 👆\n\nرد بـ *نعم* للحفظ، *تعديل* للتغيير، أو *لا* للإلغاء'
          : "Here's your image 👆\n\nReply *yes* to save, *edit* to change it, or *no* to cancel"
        await waSendMedia(phone, caption, data.image_url as string)
      } else {
        await waSendText(phone, lang === 'ar' ? 'ما قدرت أنشئ الصورة' : "Couldn't generate the image")
      }
    } catch (err) {
      console.error('[wa-action] create_image failed:', err)
    }
    return
  }

  // ── PRODUCT PHOTO ────────────────────────────────────────────────────────
  if (intent.intent === 'product_photo' && ctx.mediaUrl) {
    try {
      const ack = lang === 'ar'
        ? 'وصلتني الصورة 📸 أشتغل عليها وأرسلك النتيجة خلال دقيقة'
        : 'Got your photo 📸 Working on it, sending back professional shots in about a minute'
      await waSendText(phone, ack)

      // Step 1: Detect product
      const detectRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/product-lab/detect`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: ctx.mediaUrl, workspace_id }),
      })
      const detected = await detectRes.json() as Record<string, string>

      // Step 2: Clean background
      const cleanRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/product-lab/clean`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: ctx.mediaUrl, workspace_id }),
      })
      const cleaned = await cleanRes.json() as Record<string, string>

      // Step 3: Generate studio shot (hero only for WhatsApp — keep it fast)
      const shotRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/product-lab/studio-shots`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id,
          cleaned_url:      cleaned.cleaned_url || ctx.mediaUrl,
          product_type:     detected.type     || 'general',
          product_material: detected.material || 'general',
          product_color:    detected.color    || 'neutral',
          shot_styles:      ['hero'],  // just the hero shot for speed
        }),
      })
      const shots = await shotRes.json() as { shots?: Array<{ url: string }> }
      const heroUrl = shots.shots?.[0]?.url

      if (heroUrl) {
        await waUpdateContext(workspace_id, {
          pending_action: {
            type:      'product_photo_done',
            image_url: heroUrl,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }
        })

        const caption = lang === 'ar'
          ? `${detected.name || 'المنتج'} جاهز 👆\n\nرد بـ:\n*المزيد* — لقطات إضافية\n*فيديو* — حوّله لفيديو\n*نشر* — أنشره على إنستقرام\n*لا* — فقط احفظه`
          : `Your ${detected.name || 'product'} is ready 👆\n\nReply:\n*more* — generate more angles\n*video* — turn it into a reel\n*post* — publish to Instagram\n*no* — just keep it`
        await waSendMedia(phone, caption, heroUrl)
      } else {
        await waSendText(phone, lang === 'ar' ? 'ما قدرت أعالج الصورة، حاول مرة ثانية' : "Couldn't process the photo, try again")
      }
    } catch (err) {
      console.error('[wa-action] product_photo failed:', err)
    }
    return
  }

  // ── APPROVAL: YES ────────────────────────────────────────────────────────
  if (intent.intent === 'approval_yes' && ctxRow?.pending_action) {
    const action = ctxRow.pending_action as Record<string, unknown>

    if (action.type === 'approve_post' && action.content_id) {
      try {
        await waUpdateContext(workspace_id, { pending_action: null })
        const msg = lang === 'ar'
          ? 'تم الموافقة ✓ المنشور محفوظ في جدولك على Nexa'
          : 'Approved ✓ Post saved to your Nexa schedule'
        await waSendText(phone, msg)
      } catch (err) {
        console.error('[wa-action] approval failed:', err)
      }
    } else if (action.type === 'approve_image' || action.type === 'product_photo_done') {
      await waUpdateContext(workspace_id, { pending_action: null })
      const msg = lang === 'ar' ? 'تم الحفظ ✓ ستجده في لوحة Nexa' : 'Saved ✓ Find it in your Nexa dashboard'
      await waSendText(phone, msg)
    } else {
      await waUpdateContext(workspace_id, { pending_action: null })
      await waSendText(phone, lang === 'ar' ? 'تم ✓' : 'Done ✓')
    }
    return
  }

  // ── APPROVAL: NO ─────────────────────────────────────────────────────────
  if (intent.intent === 'approval_no') {
    await waUpdateContext(workspace_id, { pending_action: null })
    const msg = lang === 'ar' ? 'تم الإلغاء، ما اتحفظ شي' : 'Cancelled, nothing was saved'
    await waSendText(phone, msg)
    return
  }

  // ── BRAND UPDATE ─────────────────────────────────────────────────────────
  if (intent.intent === 'brand_update') {
    const info = intent.params.brand_info || ctx.rawMessage
    try {
      const supabase = createClient()
      await supabase.from('brand_learnings').insert({
        workspace_id,
        content:  info,
        source:   'whatsapp',
        topic:    'brand_update',
        metadata: { raw_message: ctx.rawMessage, lang },
      })
      const reply = await generateNexaReply(
        lang === 'ar'
          ? `المستخدم شارك معلومة جديدة عن علامته: "${info}". أخبره أنك سجّلتها وستستخدمها.`
          : `User shared new brand info: "${info}". Tell them you've noted it and will use it.`,
        brandName, lang, context
      )
      await waSendText(phone, reply)
    } catch (err) {
      console.error('[wa-action] brand_update failed:', err)
    }
    return
  }

  // ── BRAND QUESTION ANSWER ────────────────────────────────────────────────
  if (intent.intent === 'brand_question_answer') {
    const answer = intent.params.question_answer || ctx.rawMessage
    try {
      const supabase = createClient()
      await supabase.from('brand_learnings').insert({
        workspace_id,
        content:  answer,
        source:   'whatsapp_training',
        topic:    'brand_question_answer',
        metadata: { raw_message: ctx.rawMessage, lang },
      })
      const reply = await generateNexaReply(
        lang === 'ar'
          ? `المستخدم أجاب على سؤال التدريب بـ: "${answer}". اشكره واخبره كيف سيساعدك هذا.`
          : `User answered a training question with: "${answer}". Thank them and briefly explain how this will help.`,
        brandName, lang, context
      )
      await waSendText(phone, reply)
    } catch (err) {
      console.error('[wa-action] brand_question_answer failed:', err)
    }
    return
  }

  // ── GENERAL QUESTION ─────────────────────────────────────────────────────
  if (intent.intent === 'general_question') {
    const reply = await generateNexaReply(
      lang === 'ar'
        ? `المستخدم يسأل: "${ctx.rawMessage}". أجب بشكل مفيد ومباشر.`
        : `User asks: "${ctx.rawMessage}". Answer helpfully and directly.`,
      brandName, lang, context
    )
    await waSendText(phone, reply)
    return
  }

  // ── UNKNOWN ───────────────────────────────────────────────────────────────
  const fallback = await generateNexaReply(
    lang === 'ar'
      ? `المستخدم أرسل: "${ctx.rawMessage}". ما فهمت القصد. اطلب التوضيح بطريقة لطيفة.`
      : `User sent: "${ctx.rawMessage}". Intent unclear. Ask for clarification warmly.`,
    brandName, lang, context
  )
  await waSendText(phone, fallback)
}
