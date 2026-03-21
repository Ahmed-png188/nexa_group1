export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'


export async function POST(request: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY ?? '')
  const secret = request.headers.get('x-internal-secret')
  if (secret !== (process.env.INTERNAL_API_SECRET ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { type, to, name, plan, credits: planCredits } = await request.json()

    if (type === 'welcome') {
      const firstName = name?.split(' ')[0] || to.split('@')[0]
      await resend.emails.send({
        from: `Nexa <hello@nexaa.cc>`,
        to,
        subject: `Welcome to Nexa, ${firstName}`,
        html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Welcome to Nexa</title>
</head>
<body style="margin:0;padding:0;background:#03030A;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#F0EEF8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#03030A;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#070712;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">

          <!-- Header with cinematic gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,rgba(91,33,182,0.4) 0%,rgba(7,7,18,1) 50%,rgba(194,65,12,0.2) 100%);padding:40px 40px 32px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
              <img src="https://nexaa.cc/favicon.png" width="40" height="40" style="border-radius:10px;display:block;margin:0 auto 16px;" alt="Nexa">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#F0EEF8;letter-spacing:-0.03em;">Welcome to Nexa</h1>
              <p style="margin:8px 0 0;font-size:14px;color:rgba(240,238,248,0.5);letter-spacing:0.01em;">Your business intelligence engine is ready</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 20px;font-size:15px;color:rgba(240,238,248,0.8);line-height:1.7;">Hey ${firstName},</p>
              <p style="margin:0 0 20px;font-size:15px;color:rgba(240,238,248,0.65);line-height:1.75;">You just made a decision that most business owners never make — you invested in your market presence. Nexa is built to make sure that investment pays off.</p>

              <!-- What to do next -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td style="background:rgba(30,142,240,0.06);border:1px solid rgba(30,142,240,0.14);border-radius:12px;padding:24px;">
                    <p style="margin:0 0 16px;font-size:11px;font-weight:600;color:rgba(77,171,247,0.8);letter-spacing:0.1em;text-transform:uppercase;">Start here</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                          <p style="margin:0;font-size:14px;color:rgba(240,238,248,0.85);">① Train your Brand Brain — upload your best content</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                          <p style="margin:0;font-size:14px;color:rgba(240,238,248,0.85);">② Build your 30-day content strategy</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <p style="margin:0;font-size:14px;color:rgba(240,238,248,0.85);">③ Create your first piece of content</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 28px;font-size:14px;color:rgba(240,238,248,0.5);line-height:1.75;">You have 500 credits and 7 days to explore everything. No pressure — but the businesses that train their Brand Brain in the first 24 hours see the biggest results.</p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://nexaa.cc/dashboard" style="display:inline-block;background:#1E8EF0;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;letter-spacing:-0.01em;">Open your workspace →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="margin:0;font-size:12px;color:rgba(240,238,248,0.25);line-height:1.6;">Nexa · The business intelligence engine · <a href="https://nexaa.cc" style="color:rgba(30,142,240,0.6);text-decoration:none;">nexaa.cc</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      })
    } else if (type === 'plan_activated' || type === 'plan_renewed') {
      const firstName = name?.split(' ')[0] || to.split('@')[0]
      const planName = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'your'
      const subject = type === 'plan_activated'
        ? `You're on the ${planName} plan — ${planCredits?.toLocaleString()} credits added`
        : `${planName} plan renewed — ${planCredits?.toLocaleString()} credits added`
      await resend.emails.send({
        from: `Nexa <hello@nexaa.cc>`,
        to,
        subject,
        html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#03030A;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#F0EEF8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#03030A;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#070712;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,rgba(77,159,255,0.3) 0%,rgba(7,7,18,1) 60%,rgba(52,211,153,0.15) 100%);padding:36px 40px 28px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
            <img src="https://nexaa.cc/favicon.png" width="40" height="40" style="border-radius:10px;display:block;margin:0 auto 16px;" alt="Nexa">
            <h1 style="margin:0;font-size:26px;font-weight:700;color:#F0EEF8;letter-spacing:-0.03em;">${subject}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 16px;font-size:15px;color:rgba(240,238,248,0.8);line-height:1.7;">Hey ${firstName},</p>
            <p style="margin:0 0 20px;font-size:15px;color:rgba(240,238,248,0.65);line-height:1.75;">
              ${type === 'plan_activated'
                ? `Your <strong style="color:#4D9FFF;">${planName} plan</strong> is now active. ${planCredits?.toLocaleString()} credits have been added to your workspace.`
                : `Your <strong style="color:#4D9FFF;">${planName} plan</strong> has renewed. ${planCredits?.toLocaleString()} fresh credits are ready to use.`}
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr>
                <td style="background:rgba(77,159,255,0.06);border:1px solid rgba(77,159,255,0.16);border-radius:12px;padding:20px;text-align:center;">
                  <div style="font-size:11px;font-weight:600;color:rgba(77,159,255,0.7);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px;">Credits added</div>
                  <div style="font-size:32px;font-weight:300;color:#4D9FFF;letter-spacing:-0.04em;">${planCredits?.toLocaleString()}</div>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <a href="https://nexaa.cc/dashboard" style="display:inline-block;background:#1E8EF0;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">Open your workspace →</a>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="margin:0;font-size:12px;color:rgba(240,238,248,0.25);">Nexa · <a href="https://nexaa.cc" style="color:rgba(30,142,240,0.6);text-decoration:none;">nexaa.cc</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('[notify] error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
