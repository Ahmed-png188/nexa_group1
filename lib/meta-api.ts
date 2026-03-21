/**
 * meta-api.ts
 * All Meta Graph API calls in one place.
 * Every function is typed, throws on hard failure, returns null on soft failure.
 * Meta API version: v18.0
 */

const META_VERSION = 'v18.0'
const META_BASE    = `https://graph.facebook.com/${META_VERSION}`

// ─── CTA label → Meta enum ─────────────────────────────────────────────────
export const CTA_MAP: Record<string, string> = {
  'Learn More':   'LEARN_MORE',
  'Shop Now':     'SHOP_NOW',
  'Sign Up':      'SIGN_UP',
  'Book Now':     'BOOK_NOW',
  'Download':     'DOWNLOAD',
  'Get Quote':    'GET_QUOTE',
  'Contact Us':   'CONTACT_US',
  'Watch More':   'WATCH_MORE',
  'Apply Now':    'APPLY_NOW',
  'Subscribe':    'SUBSCRIBE',
}

// ─── Placement → Meta position spec ───────────────────────────────────────
// Meta requires publisher_platforms + position arrays
export function buildPositionSpec(placementIds: string[]): Record<string, any> {
  const spec: any = {
    facebook_positions:  [],
    instagram_positions: [],
    audience_network_positions: [],
    publisher_platforms: [],
  }

  for (const id of placementIds) {
    switch (id) {
      case 'fb_feed':
        spec.publisher_platforms.push('facebook')
        spec.facebook_positions.push('feed')
        break
      case 'fb_stories':
        spec.publisher_platforms.push('facebook')
        spec.facebook_positions.push('story')
        break
      case 'ig_feed':
        spec.publisher_platforms.push('instagram')
        spec.instagram_positions.push('stream')
        break
      case 'ig_stories':
        spec.publisher_platforms.push('instagram')
        spec.instagram_positions.push('story')
        break
      case 'ig_reels':
        spec.publisher_platforms.push('instagram')
        spec.instagram_positions.push('reels')
        break
      case 'audience_net':
        spec.publisher_platforms.push('audience_network')
        spec.audience_network_positions.push('classic')
        break
    }
  }

  // Deduplicate
  spec.publisher_platforms = Array.from(new Set(spec.publisher_platforms))
  spec.facebook_positions  = Array.from(new Set(spec.facebook_positions))
  spec.instagram_positions = Array.from(new Set(spec.instagram_positions))

  // Remove empty arrays
  if (!spec.facebook_positions.length)  delete spec.facebook_positions
  if (!spec.instagram_positions.length) delete spec.instagram_positions
  if (!spec.audience_network_positions.length) delete spec.audience_network_positions

  return spec
}

// ─── Gender → Meta targeting ──────────────────────────────────────────────
function genderToMeta(gender: string): number[] {
  if (gender === 'MALE')   return [1]
  if (gender === 'FEMALE') return [2]
  return []  // empty = all genders
}

// ─── Search Meta interest IDs for given keywords ──────────────────────────
export async function searchInterests(
  keywords: string[],
  accessToken: string
): Promise<{ id: string; name: string }[]> {
  const results: { id: string; name: string }[] = []
  const seen = new Set<string>()

  // Search top 5 keywords (avoid rate limits)
  for (const kw of keywords.slice(0, 5)) {
    try {
      const res = await fetch(
        `${META_BASE}/search?type=adinterest&q=${encodeURIComponent(kw)}&limit=3&access_token=${accessToken}`
      )
      const data = await res.json()
      if (data.data) {
        for (const item of data.data) {
          if (!seen.has(item.id)) {
            seen.add(item.id)
            results.push({ id: item.id, name: item.name })
          }
        }
      }
    } catch { /* skip failed searches */ }
  }

  return results
}

// ─── Create Meta campaign ─────────────────────────────────────────────────
export async function createMetaCampaign(params: {
  adAccountId: string
  accessToken: string
  name: string
  objective: string
}): Promise<string> {
  const res = await fetch(`${META_BASE}/act_${params.adAccountId}/campaigns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name:                  params.name,
      objective:             params.objective,
      status:                'PAUSED',
      special_ad_categories: [],
      access_token:          params.accessToken,
    }),
  })
  const data = await res.json()
  if (!res.ok || !data.id) {
    throw new Error(`Meta campaign creation failed: ${data.error?.message || JSON.stringify(data)}`)
  }
  return data.id
}

// ─── Create Meta ad set ───────────────────────────────────────────────────
export async function createMetaAdSet(params: {
  adAccountId:    string
  accessToken:    string
  campaignId:     string
  name:           string
  dailyBudget:    number          // in dollars — we convert to cents
  startTime?:     string          // ISO date
  endTime?:       string
  objective:      string
  ageMin:         number
  ageMax:         number
  genders:        string          // 'ALL' | 'MALE' | 'FEMALE'
  locations:      string[]        // country codes
  interests:      { id: string; name: string }[]
  placements:     string[]        // our internal placement ids
  billingEvent:   string          // 'IMPRESSIONS' | 'LINK_CLICKS'
  optimizationGoal: string
  bidStrategy:    string          // 'LOWEST_COST_WITHOUT_CAP' | 'COST_CAP'
  bidAmount?:     number          // for COST_CAP, in dollars
  retargeting?:   { type: string; audienceId?: string }
  customAudienceId?: string
}): Promise<string> {

  const targeting: Record<string, any> = {
    age_min:          params.ageMin,
    age_max:          params.ageMax,
    geo_locations:    { countries: params.locations },
    ...buildPositionSpec(params.placements),
  }

  const genders = genderToMeta(params.genders)
  if (genders.length) targeting.genders = genders

  if (params.interests.length) {
    targeting.flexible_spec = [{ interests: params.interests.map(i => ({ id: i.id, name: i.name })) }]
  }

  if (params.customAudienceId) {
    targeting.custom_audiences = [{ id: params.customAudienceId }]
  }

  const body: Record<string, any> = {
    campaign_id:       params.campaignId,
    name:              params.name,
    status:            'PAUSED',
    daily_budget:      String(params.dailyBudget * 100),  // Meta uses cents
    billing_event:     params.billingEvent,
    optimization_goal: params.optimizationGoal,
    bid_strategy:      params.bidStrategy,
    targeting,
    access_token:      params.accessToken,
  }

  if (params.startTime) body.start_time = new Date(params.startTime).toISOString()
  if (params.endTime)   body.end_time   = new Date(params.endTime).toISOString()
  if (params.bidStrategy === 'COST_CAP' && params.bidAmount) {
    body.bid_amount = String(Math.round(params.bidAmount * 100))
  }

  const res = await fetch(`${META_BASE}/act_${params.adAccountId}/adsets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok || !data.id) {
    throw new Error(`Meta ad set creation failed: ${data.error?.message || JSON.stringify(data)}`)
  }
  return data.id
}

// ─── Upload image to Meta ad account ─────────────────────────────────────
export async function uploadMetaImage(params: {
  adAccountId: string
  accessToken: string
  imageUrl:    string             // public URL — we fetch and upload
}): Promise<string | null> {
  try {
    // Fetch image as buffer
    const imgRes = await fetch(params.imageUrl)
    if (!imgRes.ok) return null
    const arrayBuffer = await imgRes.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    const res = await fetch(`${META_BASE}/act_${params.adAccountId}/adimages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bytes:        base64,
        access_token: params.accessToken,
      }),
    })
    const data = await res.json()
    // Meta returns { images: { filename: { hash, url } } }
    if (data.images) {
      const firstKey = Object.keys(data.images)[0]
      return data.images[firstKey]?.hash || null
    }
    return null
  } catch {
    return null
  }
}

// ─── Create Meta ad creative ──────────────────────────────────────────────
export async function createMetaAdCreative(params: {
  adAccountId: string
  accessToken: string
  pageId:      string
  name:        string
  headline:    string
  primaryText: string
  description: string
  callToAction: string
  linkUrl:     string
  imageHash?:  string
  videoId?:    string
}): Promise<string> {
  const ctaType = CTA_MAP[params.callToAction] || 'LEARN_MORE'

  const objectStorySpec: Record<string, any> = {
    page_id: params.pageId,
    link_data: {
      message:     params.primaryText,
      name:        params.headline,
      description: params.description,
      link:        params.linkUrl,
      call_to_action: { type: ctaType, value: { link: params.linkUrl } },
    },
  }

  if (params.imageHash) {
    objectStorySpec.link_data.image_hash = params.imageHash
  }

  const res = await fetch(`${META_BASE}/act_${params.adAccountId}/adcreatives`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name:               params.name,
      object_story_spec:  objectStorySpec,
      access_token:       params.accessToken,
    }),
  })
  const data = await res.json()
  if (!res.ok || !data.id) {
    throw new Error(`Meta creative creation failed: ${data.error?.message || JSON.stringify(data)}`)
  }
  return data.id
}

// ─── Create Meta ad ───────────────────────────────────────────────────────
export async function createMetaAd(params: {
  adAccountId: string
  accessToken: string
  adSetId:     string
  creativeId:  string
  name:        string
}): Promise<string> {
  const res = await fetch(`${META_BASE}/act_${params.adAccountId}/ads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name:       params.name,
      adset_id:   params.adSetId,
      creative:   { creative_id: params.creativeId },
      status:     'PAUSED',
      access_token: params.accessToken,
    }),
  })
  const data = await res.json()
  if (!res.ok || !data.id) {
    throw new Error(`Meta ad creation failed: ${data.error?.message || JSON.stringify(data)}`)
  }
  return data.id
}

// ─── Create Custom Audience (retargeting) ─────────────────────────────────
export async function createCustomAudience(params: {
  adAccountId: string
  accessToken: string
  name:        string
  type:        'website' | 'lookalike' | 'engagement'
  pixelId?:    string
}): Promise<string | null> {
  try {
    if (params.type === 'website' && params.pixelId) {
      // Website Custom Audience — people who visited any page in last 30 days
      const res = await fetch(`${META_BASE}/act_${params.adAccountId}/customaudiences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:         params.name,
          subtype:      'WEBSITE',
          retention_days: 30,
          rule: {
            inclusions: {
              operator: 'or',
              rules: [{
                event_sources: [{ id: params.pixelId, type: 'pixel' }],
                retention_seconds: 2592000,  // 30 days
                filter: { operator: 'and', filters: [{ field: 'url', operator: 'i_contains', value: '' }] },
              }],
            },
          },
          access_token: params.accessToken,
        }),
      })
      const data = await res.json()
      return data.id || null

    } else if (params.type === 'engagement') {
      // Page engagement audience — people who interacted with FB/IG page in last 365 days
      const res = await fetch(`${META_BASE}/act_${params.adAccountId}/customaudiences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    params.name,
          subtype: 'ENGAGEMENT',
          retention_days: 365,
          access_token: params.accessToken,
        }),
      })
      const data = await res.json()
      return data.id || null
    }
    return null
  } catch {
    return null
  }
}

// ─── Create Lookalike Audience ────────────────────────────────────────────
export async function createLookalikeAudience(params: {
  adAccountId:     string
  accessToken:     string
  sourceAudienceId: string
  countries:       string[]
  name:            string
}): Promise<string | null> {
  try {
    const res = await fetch(`${META_BASE}/act_${params.adAccountId}/customaudiences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:            params.name,
        subtype:         'LOOKALIKE',
        origin_audience_id: params.sourceAudienceId,
        lookalike_spec:  {
          type:    'similarity',
          country: params.countries[0] || 'US',
        },
        access_token: params.accessToken,
      }),
    })
    const data = await res.json()
    return data.id || null
  } catch {
    return null
  }
}

// ─── Fetch real campaign status from Meta ────────────────────────────────
// Meta effective_status values:
//   ACTIVE, PAUSED, DELETED, ARCHIVED, IN_PROCESS, WITH_ISSUES,
//   CAMPAIGN_PAUSED, ADSET_PAUSED, DISAPPROVED, PENDING_REVIEW,
//   PREAPPROVED, PENDING_BILLING_INFO, ERROR
export async function fetchCampaignStatus(
  campaignId: string,
  adId: string | null,
  accessToken: string
): Promise<{
  campaignStatus: string
  adStatus: string | null
  effectiveStatus: string
  nexaStatus: string
  rejectionReason: string | null
}> {
  try {
    // Fetch campaign effective status
    const campRes = await fetch(
      `${META_BASE}/${campaignId}?fields=effective_status,status&access_token=${accessToken}`
    )
    const campData = await campRes.json()
    const campaignStatus = campData.effective_status || campData.status || 'UNKNOWN'

    let adStatus: string | null = null
    let rejectionReason: string | null = null

    // Fetch ad status + rejection reason if ad exists
    if (adId) {
      const adRes = await fetch(
        `${META_BASE}/${adId}?fields=effective_status,status,review_feedback&access_token=${accessToken}`
      )
      const adData = await adRes.json()
      adStatus = adData.effective_status || adData.status || null

      // Extract rejection reason from review_feedback
      if (adData.review_feedback) {
        const feedback = adData.review_feedback
        const reasons: string[] = []
        if (feedback.global) {
          for (const item of Object.values(feedback.global) as any[]) {
            if (item?.title) reasons.push(item.title)
          }
        }
        if (reasons.length) rejectionReason = reasons.join('; ')
      }
    }

    // Map Meta statuses → Nexa statuses
    const effective = adStatus || campaignStatus
    let nexaStatus = 'DRAFT'

    if (['ACTIVE'].includes(effective)) {
      nexaStatus = 'ACTIVE'
    } else if (['PAUSED', 'CAMPAIGN_PAUSED', 'ADSET_PAUSED'].includes(effective)) {
      nexaStatus = 'PAUSED'
    } else if (['PENDING_REVIEW', 'IN_PROCESS', 'PREAPPROVED'].includes(effective)) {
      nexaStatus = 'IN_REVIEW'
    } else if (['DISAPPROVED', 'WITH_ISSUES'].includes(effective)) {
      nexaStatus = 'REJECTED'
    } else if (['ERROR', 'PENDING_BILLING_INFO'].includes(effective)) {
      nexaStatus = 'ERROR'
    } else if (['DELETED', 'ARCHIVED'].includes(effective)) {
      nexaStatus = 'DELETED'
    }

    return { campaignStatus, adStatus, effectiveStatus: effective, nexaStatus, rejectionReason }
  } catch {
    return { campaignStatus: 'UNKNOWN', adStatus: null, effectiveStatus: 'UNKNOWN', nexaStatus: 'DRAFT', rejectionReason: null }
  }
}


export async function updateCampaignStatus(
  campaignId: string,
  status: 'ACTIVE' | 'PAUSED' | 'DELETED',
  accessToken: string
): Promise<boolean> {
  try {
    const res = await fetch(`${META_BASE}/${campaignId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, access_token: accessToken }),
    })
    return res.ok
  } catch {
    return false
  }
}

// ─── Update ad set budget ─────────────────────────────────────────────────
export async function updateAdSetBudget(
  adSetId: string,
  dailyBudgetDollars: number,
  accessToken: string
): Promise<boolean> {
  try {
    const res = await fetch(`${META_BASE}/${adSetId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        daily_budget: String(dailyBudgetDollars * 100),
        access_token: accessToken,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

// ─── Fetch campaign insights ──────────────────────────────────────────────
export async function fetchCampaignInsights(
  campaignId: string,
  accessToken: string,
  datePreset = 'last_7d'
): Promise<{
  spend: number; reach: number; impressions: number
  clicks: number; cpc: number; cpm: number; ctr: number
} | null> {
  try {
    const res = await fetch(
      `${META_BASE}/${campaignId}/insights?fields=spend,reach,impressions,clicks,cpc,cpm,ctr&date_preset=${datePreset}&access_token=${accessToken}`
    )
    const data = await res.json()
    const row = data.data?.[0]
    if (!row) return null
    return {
      spend:       parseFloat(row.spend       || '0'),
      reach:       parseInt  (row.reach       || '0'),
      impressions: parseInt  (row.impressions || '0'),
      clicks:      parseInt  (row.clicks      || '0'),
      cpc:         parseFloat(row.cpc         || '0'),
      cpm:         parseFloat(row.cpm         || '0'),
      ctr:         parseFloat(row.ctr         || '0'),
    }
  } catch {
    return null
  }
}

// ─── Get real reach estimate from Meta ───────────────────────────────────
export async function getReachEstimate(params: {
  adAccountId:   string
  accessToken:   string
  ageMin:        number
  ageMax:        number
  genders:       string
  locations:     string[]
  interests:     { id: string; name: string }[]
  placements:    string[]
  dailyBudget:   number
  optimizationGoal: string
}): Promise<{ min: number; max: number } | null> {
  try {
    const targeting: Record<string, any> = {
      age_min:       params.ageMin,
      age_max:       params.ageMax,
      geo_locations: { countries: params.locations },
      ...buildPositionSpec(params.placements),
    }
    const genders = genderToMeta(params.genders)
    if (genders.length) targeting.genders = genders
    if (params.interests.length) {
      targeting.flexible_spec = [{ interests: params.interests.map(i => ({ id: i.id })) }]
    }

    const res = await fetch(`${META_BASE}/act_${params.adAccountId}/delivery_estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targeting_spec:    targeting,
        optimization_goal: params.optimizationGoal,
        daily_budget:      String(params.dailyBudget * 100),
        access_token:      params.accessToken,
      }),
    })
    const data = await res.json()
    const est = data.data?.[0]?.estimate_mau_upper_bound
    const lower = data.data?.[0]?.estimate_mau_lower_bound
    if (!est && !lower) return null
    return { min: parseInt(lower || '0'), max: parseInt(est || '0') }
  } catch {
    return null
  }
}

// ─── Map objective to billing event and optimization goal ─────────────────
export function getAdSetConfig(objective: string): {
  billingEvent: string
  optimizationGoal: string
} {
  const map: Record<string, { billingEvent: string; optimizationGoal: string }> = {
    OUTCOME_AWARENESS:    { billingEvent: 'IMPRESSIONS',  optimizationGoal: 'REACH' },
    OUTCOME_TRAFFIC:      { billingEvent: 'IMPRESSIONS',  optimizationGoal: 'LINK_CLICKS' },
    OUTCOME_ENGAGEMENT:   { billingEvent: 'IMPRESSIONS',  optimizationGoal: 'POST_ENGAGEMENT' },
    OUTCOME_LEADS:        { billingEvent: 'IMPRESSIONS',  optimizationGoal: 'LEAD_GENERATION' },
    OUTCOME_SALES:        { billingEvent: 'IMPRESSIONS',  optimizationGoal: 'OFFSITE_CONVERSIONS' },
    OUTCOME_APP_PROMOTION:{ billingEvent: 'IMPRESSIONS',  optimizationGoal: 'APP_INSTALLS' },
    OUTCOME_VIDEO_VIEWS:  { billingEvent: 'VIDEO_VIEWS',  optimizationGoal: 'THRUPLAY' },
  }
  return map[objective] || { billingEvent: 'IMPRESSIONS', optimizationGoal: 'LINK_CLICKS' }
}
