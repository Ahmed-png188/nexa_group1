export const dynamic = 'force-dynamic'
import { createNotification } from '@/lib/notifications'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { guardWorkspace } from '@/lib/workspace-guard'
import { checkPlanAccess } from '@/lib/plan-gate'
import { getBrandContext } from '@/lib/brand-context'
import Anthropic from '@anthropic-ai/sdk'
import {

  createMetaCampaign,
  createMetaAdSet,
  uploadMetaImage,
  createMetaAdCreative,
  createMetaAd,
  createCustomAudience,
  createLookalikeAudience,
  searchInterests,
  getAdSetConfig,
  getReachEstimate,
} from '@/lib/meta-api'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      workspace_id,
      name,
      objective        = 'OUTCOME_TRAFFIC',
      daily_budget     = 20,
      start_date,
      end_date,
      content_id,
      audience_snapshot = {},
      creative_snapshot = {},
      mode             = 'simple',
      generate_copy    = false,
      ab_test          = false,
    } = body

    if (!workspace_id) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    const gateError = await checkPlanAccess(workspace_id!, 'amplify')
    if (gateError) return gateError

    // ── 1. Get Brand Brain context ────────────────────────────────────────
    const brand = await getBrandContext(workspace_id)
    const profile    = brand?.profile
    const brandName  = brand?.workspace?.brand_name || brand?.workspace?.name || 'the brand'
    const brandVoice = profile?.voice?.primary_tone || 'confident, direct'
    const audience   = profile?.audience?.primary   || 'ambitious professionals'
    const positioning = profile?.positioning?.unique_angle || ''
    const audienceInterests: string[] = profile?.audience?.interests || audience_snapshot?.interests || []
    const audienceLocations: string[] = audience_snapshot?.locations || ['AE']
    const ageMin     = audience_snapshot?.ageMin  || 22
    const ageMax     = audience_snapshot?.ageMax  || 45
    const genders    = audience_snapshot?.gender  || 'ALL'
    const bidStrategy = audience_snapshot?.bid_strategy || 'LOWEST_COST'
    const targetCpa   = audience_snapshot?.target_cpa   || null
    const retargeting = audience_snapshot?.retargeting  || null

    // ── 2. Get content item if provided ──────────────────────────────────
    let contentItem: any = null
    if (content_id) {
      const { data } = await supabase.from('content').select('*').eq('id', content_id).single()
      contentItem = data
    }

    // ── 3. AI-generate ad copy (always Brand Brain powered) ───────────────
    const sourceText = contentItem?.content || creative_snapshot?.adCopy || ''
    let finalCreative = { ...creative_snapshot }

    if (generate_copy || !creative_snapshot?.adCopy?.trim()) {
      const aiRes = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        system: `You are a world-class Meta Ads copywriter for ${brandName}.\nBrand voice: ${brandVoice}\nAudience: ${audience}\n${positioning ? `Positioning: ${positioning}` : ''}\n\nWrite ad copy that stops the scroll, speaks directly to the audience's desires, and drives action. Never sound like an ad. Sound like a person who genuinely loves this brand.`,
        messages: [{
          role: 'user',
          content: `Write Meta ad copy${sourceText ? ` based on: "${sourceText.slice(0, 500)}"` : ` for ${brandName}`}\n\nReturn ONLY valid JSON:\n{\n  "headline": "Max 40 chars — punchy, benefit or curiosity driven",\n  "primary_text": "Max 125 chars — first line is the hook. Speaks directly to ${audience}.",\n  "description": "Max 30 chars — supporting line"\n}`,
        }],
      })

      try {
        const raw = aiRes.content[0]?.type === 'text' ? aiRes.content[0].text : ''
        const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const parsed = JSON.parse(cleaned)
        finalCreative = {
          ...creative_snapshot,
          headline:     (parsed.headline     || creative_snapshot?.headline || name).slice(0, 40),
          adCopy:       (parsed.primary_text || creative_snapshot?.adCopy   || '').slice(0, 125),
          description:  (parsed.description  || '').slice(0, 30),
          cta:          creative_snapshot?.cta || 'Learn More',
          placements:   creative_snapshot?.placements || ['ig_feed', 'ig_stories', 'fb_feed'],
          ai_generated: true,
        }
      } catch {
        finalCreative = {
          ...creative_snapshot,
          headline: creative_snapshot?.headline || name,
          adCopy:   creative_snapshot?.adCopy   || '',
          cta:      creative_snapshot?.cta      || 'Learn More',
          placements: creative_snapshot?.placements || ['ig_feed', 'ig_stories', 'fb_feed'],
        }
      }
    }

    // ── 4. Check if Meta is connected ────────────────────────────────────
    const { data: metaConn } = await supabase
      .from('meta_connections')
      .select('*')
      .eq('workspace_id', workspace_id)
      .single()

    let metaCampaignId: string | null  = null
    let metaAdSetId: string | null     = null
    let metaAdSetId2: string | null    = null // A/B variant
    let metaAdId: string | null        = null
    let metaStatus = 'DRAFT'
    let metaErrors: string[]           = []

    const hasMetaConn = !!(metaConn?.access_token && metaConn?.ad_account_id)

    if (hasMetaConn) {
      const tk = metaConn.access_token
      const acct = metaConn.ad_account_id.replace('act_', '')
      const pageId = metaConn.page_id
      const pixelId = metaConn.pixel_id

      try {
        // ── Step A: Resolve interest IDs from Brand Brain keywords ──────
        const resolvedInterests = audienceInterests.length
          ? await searchInterests(audienceInterests, tk)
          : []

        // ── Step B: Handle retargeting — create custom audience ─────────
        let customAudienceId: string | undefined
        if (retargeting === 'website' && pixelId) {
          const caId = await createCustomAudience({
            adAccountId: acct, accessToken: tk,
            name: `${brandName} — Website Visitors`,
            type: 'website', pixelId,
          })
          if (caId) customAudienceId = caId
        } else if (retargeting === 'engagement') {
          const caId = await createCustomAudience({
            adAccountId: acct, accessToken: tk,
            name: `${brandName} — Page Engagement`,
            type: 'engagement',
          })
          if (caId) customAudienceId = caId
        } else if (retargeting === 'lookalike' && pixelId) {
          // First create a website audience, then a lookalike from it
          const sourceId = await createCustomAudience({
            adAccountId: acct, accessToken: tk,
            name: `${brandName} — Source for Lookalike`,
            type: 'website', pixelId,
          })
          if (sourceId) {
            const llId = await createLookalikeAudience({
              adAccountId: acct, accessToken: tk,
              sourceAudienceId: sourceId,
              countries: audienceLocations,
              name: `${brandName} — Lookalike 1%`,
            })
            if (llId) customAudienceId = llId
          }
        }

        // ── Step C: Create campaign shell ───────────────────────────────
        metaCampaignId = await createMetaCampaign({
          adAccountId: acct, accessToken: tk,
          name, objective,
        })

        // ── Step D: Map objective → billing + optimization ──────────────
        const { billingEvent, optimizationGoal } = getAdSetConfig(objective)

        const adSetParams = {
          adAccountId:      acct,
          accessToken:      tk,
          campaignId:       metaCampaignId,
          name:             `${name} — Ad Set`,
          dailyBudget:      daily_budget,
          startTime:        start_date,
          endTime:          end_date || undefined,
          objective,
          ageMin, ageMax, genders,
          locations:        audienceLocations,
          interests:        resolvedInterests,
          placements:       finalCreative.placements || ['ig_feed', 'ig_stories', 'fb_feed'],
          billingEvent,
          optimizationGoal,
          bidStrategy:      bidStrategy === 'COST_CAP' ? 'COST_CAP' : 'LOWEST_COST_WITHOUT_CAP',
          bidAmount:        targetCpa   || undefined,
          customAudienceId,
        }

        // ── Step E: Create primary ad set ───────────────────────────────
        metaAdSetId = await createMetaAdSet(adSetParams)

        // ── Step F: Create A/B variant ad set (if enabled) ──────────────
        if (ab_test) {
          metaAdSetId2 = await createMetaAdSet({
            ...adSetParams,
            name: `${name} — Ad Set B (Variant)`,
          }).catch(() => null)
        }

        // ── Step G: Upload image ─────────────────────────────────────────
        const imageUrl = finalCreative.image_url || contentItem?.image_url
        let imageHash: string | undefined
        if (imageUrl) {
          imageHash = await uploadMetaImage({
            adAccountId: acct, accessToken: tk, imageUrl,
          }) || undefined
        }

        // ── Step H: Create ad creative ──────────────────────────────────
        if (pageId) {
          const creativeId = await createMetaAdCreative({
            adAccountId:  acct,
            accessToken:  tk,
            pageId,
            name:         `${name} — Creative`,
            headline:     finalCreative.headline    || name,
            primaryText:  finalCreative.adCopy      || '',
            description:  finalCreative.description || '',
            callToAction: finalCreative.cta         || 'Learn More',
            linkUrl:      `https://nexaa.cc/${(brand?.workspace as any)?.slug || ''}`,
            imageHash,
          })

          // ── Step I: Create the ad itself ────────────────────────────
          metaAdId = await createMetaAd({
            adAccountId: acct,
            accessToken: tk,
            adSetId:     metaAdSetId,
            creativeId,
            name:        `${name} — Ad`,
          })

          // ── Step J: Activate campaign + ad set so Meta starts reviewing creative ──
          // We set to ACTIVE immediately — Meta's review system takes over.
          // Our sync cron will update status to ACTIVE or REJECTED based on Meta's decision.
          const META_V = 'https://graph.facebook.com/v18.0'
          await fetch(`${META_V}/${metaCampaignId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'ACTIVE', access_token: tk }),
          })
          await fetch(`${META_V}/${metaAdSetId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'ACTIVE', access_token: tk }),
          })

          // A/B variant ad
          if (ab_test && metaAdSetId2) {
            // Generate variant copy with slightly different angle
            const variantRes = await anthropic.messages.create({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 200,
              messages: [{
                role: 'user',
                content: `Write a variant headline (max 40 chars) and primary text (max 125 chars) for a Meta ad for ${brandName}. Same product, different angle — focus on ${retargeting ? 'urgency and social proof' : 'problem → solution'}.\n\nReturn ONLY JSON: {"headline": "...", "primary_text": "..."}`,
              }],
            })
            try {
              const vt = JSON.parse((variantRes.content[0] as any).text.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim())
              const variantCreativeId = await createMetaAdCreative({
                adAccountId:  acct,
                accessToken:  tk,
                pageId,
                name:         `${name} — Creative B`,
                headline:     (vt.headline     || finalCreative.headline).slice(0, 40),
                primaryText:  (vt.primary_text || finalCreative.adCopy).slice(0, 125),
                description:  finalCreative.description || '',
                callToAction: finalCreative.cta || 'Learn More',
                linkUrl:      `https://nexaa.cc/${(brand?.workspace as any)?.slug || ''}`,
                imageHash,
              })
              await createMetaAd({
                adAccountId: acct, accessToken: tk,
                adSetId: metaAdSetId2, creativeId: variantCreativeId,
                name: `${name} — Ad B (Variant)`,
              })
            } catch { /* A/B variant copy failed — skip, main ad still runs */ }
          }
        }

        metaStatus = 'IN_REVIEW'  // Meta is now reviewing the creative

      } catch (metaErr: any) {
        console.error('[amplify/create] Meta chain error:', metaErr?.message)
        metaErrors.push(metaErr?.message || 'Meta API error')
        // If campaign was created but later steps failed — try to clean up
        if (metaCampaignId && !metaAdSetId) {
          // Campaign exists but incomplete — still save so user can see it
          metaStatus = 'DRAFT'
        }
      }
    }

    // ── 5. Save to Supabase always ────────────────────────────────────────
    const { data: campaign, error: dbErr } = await supabase
      .from('amplify_campaigns')
      .insert({
        workspace_id,
        created_by:         user.id,
        meta_campaign_id:   metaCampaignId,
        meta_adset_id:      metaAdSetId,
        meta_ad_id:         metaAdId,
        name,
        objective,
        status:             metaStatus,
        daily_budget,
        start_date:         start_date || new Date().toISOString().split('T')[0],
        end_date:           end_date || null,
        content_id:         content_id || null,
        audience_snapshot:  {
          ...audience_snapshot,
          resolved_interests: [],  // will be populated on next sync
          retargeting,
          ab_test,
          bid_strategy: bidStrategy,
        },
        creative_snapshot:  finalCreative,
        mode,
      })
      .select()
      .single()

    if (dbErr) throw dbErr

    await createNotification({
      workspace_id,
      type: 'ad_live',
      message: `Campaign "${name}" submitted to Meta at $${daily_budget}/day — it's now in review and will go live once approved.`,
      link: '/dashboard/amplify',
    })

    await supabase.from('activity').insert({
      workspace_id, user_id: user.id,
      type:  'campaign_created',
      title: `Campaign "${name}" created — $${daily_budget}/day`,
      metadata: {
        campaign_id: campaign?.id, objective, mode,
        meta_campaign_id: metaCampaignId,
        meta_adset_id:    metaAdSetId,
        meta_ad_id:       metaAdId,
        ab_test,
        retargeting,
      },
    })

    const isFullyLive = !!(metaCampaignId && metaAdSetId && metaAdId)
    const isPartial   = !!(metaCampaignId && !metaAdId)

    return NextResponse.json({
      success:      true,
      campaign,
      creative:     finalCreative,
      meta_live:    isFullyLive,
      meta_partial: isPartial,
      meta_errors:  metaErrors,
      message: !hasMetaConn
        ? 'Campaign saved as draft. Connect Meta to publish.'
        : isFullyLive
          ? 'Campaign submitted to Meta for review. We\'ll update the status once Meta approves it — usually within minutes.'
          : isPartial
            ? 'Campaign shell created on Meta. A Facebook Page is required to complete the ad creative.'
            : `Saved as draft. Meta errors: ${metaErrors.join('; ')}`,
    })

  } catch (err: unknown) {
    console.error('[amplify/create]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to create campaign' }, { status: 500 })
  }
}
