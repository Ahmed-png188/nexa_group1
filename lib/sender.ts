/**
 * Gets the "from" address for any email sent on behalf of a workspace.
 * Priority:
 *  1. Verified custom domain (e.g. hello@whiskerwoo.com)
 *  2. Custom sender_email with nexaa.cc domain (displayed name only — Resend requires verified domain)
 *  3. Fallback to hello@nexaa.cc with brand name
 */
export function getSenderFrom(ws: {
  brand_name?: string | null
  name?: string
  sender_name?: string | null
  sender_email?: string | null
  sender_domain?: string | null
  sender_domain_verified?: boolean | null
}): string {
  const brandName = ws.sender_name || ws.brand_name || ws.name || 'Nexa'
  const NEXA_FROM = process.env.RESEND_FROM_EMAIL || 'hello@nexaa.cc'

  // If they have a verified custom domain, send from it
  if (ws.sender_domain_verified && ws.sender_domain && ws.sender_email) {
    return `${brandName} <${ws.sender_email}>`
  }

  // Otherwise send from nexaa.cc but with their brand name
  return `${brandName} <${NEXA_FROM}>`
}

/**
 * Gets the reply-to address for emails.
 * When user has a custom verified domain — reply-to matches their sender (already correct).
 * When sending via nexaa.cc — set reply-to to the workspace owner's account email
 * so replies land in their real inbox, not hello@nexaa.cc.
 */
export function getReplyTo(ws: {
  sender_domain?: string | null
  sender_domain_verified?: boolean | null
  sender_email?: string | null
  owner_email?: string | null
}): string | null {
  // Custom domain — reply-to same as from, no extra header needed
  if (ws.sender_domain_verified && ws.sender_email) return null

  // Nexaa.cc sender — route replies to workspace owner's real email
  return ws.owner_email || null
}
