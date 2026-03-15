import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY ?? 're_placeholder')
const FROM = `Nexa <hello@nexaa.cc>`

// ── Email templates ─────────────────────────────────────────────────────────

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Nexa</title>
</head>
<body style="margin:0;padding:0;background:#08080D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">

    <!-- Logo -->
    <div style="margin-bottom:40px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="background:#00AAFF;border-radius:6px;width:28px;height:28px;text-align:center;vertical-align:middle;">
            <span style="color:#000;font-weight:900;font-size:14px;letter-spacing:-0.04em;">N</span>
          </td>
          <td style="padding-left:10px;vertical-align:middle;">
            <span style="color:#F0EDE8;font-weight:800;font-size:16px;letter-spacing:-0.03em;">Nexa</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Card -->
    <div style="background:#0D0D14;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:36px;position:relative;overflow:hidden;">
      <!-- Cyan top line -->
      <div style="position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent 10%,rgba(0,170,255,0.35) 45%,rgba(0,170,255,0.12) 70%,transparent 90%);"></div>
      ${content}
    </div>

    <!-- Footer -->
    <div style="margin-top:32px;text-align:center;">
      <p style="color:rgba(240,237,232,0.3);font-size:12px;line-height:1.6;margin:0;">
        Nexa · The Creative Operating System<br>
        <a href="https://nexaa.cc" style="color:rgba(240,237,232,0.3);text-decoration:none;">nexaa.cc</a>
        &nbsp;·&nbsp;
        <a href="mailto:hello@nexaa.cc" style="color:rgba(240,237,232,0.3);text-decoration:none;">hello@nexaa.cc</a>
      </p>
    </div>

  </div>
</body>
</html>`
}

function welcomeEmail(name: string) {
  const firstName = name?.split(' ')[0] || 'there'
  return baseTemplate(`
    <h1 style="color:#F0EDE8;font-size:26px;font-weight:800;letter-spacing:-0.04em;line-height:1.1;margin:0 0 8px;">
      Welcome to Nexa, ${firstName}.
    </h1>
    <p style="color:rgba(240,237,232,0.55);font-size:15px;line-height:1.7;margin:0 0 28px;">
      Your creative operating system is ready. Let's get your brand running on autopilot.
    </p>

    <!-- Steps -->
    <div style="margin-bottom:28px;">
      ${[
        ['01', 'Set up your workspace', 'Name your workspace and tell Nexa about your brand.'],
        ['02', 'Upload your brand DNA', 'Drop your logo, brand doc, or sample posts — Nexa reads everything and builds your Brand Intelligence Profile.'],
        ['03', 'Generate your first content', 'Let Nexa write in your exact voice, then schedule it with one click.'],
      ].map(([n, title, desc]) => `
      <div style="display:flex;gap:14px;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.06);">
        <div style="background:rgba(0,170,255,0.08);border:1px solid rgba(0,170,255,0.18);border-radius:7px;width:28px;height:28px;min-width:28px;display:flex;align-items:center;justify-content:center;text-align:center;line-height:28px;">
          <span style="color:#00AAFF;font-size:11px;font-weight:700;">${n}</span>
        </div>
        <div>
          <div style="color:#F0EDE8;font-size:13px;font-weight:700;margin-bottom:3px;letter-spacing:-0.01em;">${title}</div>
          <div style="color:rgba(240,237,232,0.45);font-size:12.5px;line-height:1.55;">${desc}</div>
        </div>
      </div>`).join('')}
    </div>

    <!-- CTA -->
    <a href="https://nexaa.cc/dashboard" style="display:block;background:#00AAFF;color:#000;text-align:center;padding:14px 24px;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:-0.01em;">
      Open your dashboard →
    </a>

    <p style="color:rgba(240,237,232,0.3);font-size:12px;text-align:center;margin:20px 0 0;">
      Questions? Reply to this email — we read everything.
    </p>
  `)
}

function planActivatedEmail(name: string, plan: string, credits: number) {
  const firstName = name?.split(' ')[0] || 'there'
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1)
  return baseTemplate(`
    <div style="margin-bottom:20px;">
      <div style="display:inline-block;background:rgba(0,170,255,0.1);border:1px solid rgba(0,170,255,0.2);border-radius:6px;padding:3px 10px;font-size:11px;font-weight:700;color:#00AAFF;letter-spacing:0.04em;text-transform:uppercase;">
        ${planLabel} Plan Active
      </div>
    </div>
    <h1 style="color:#F0EDE8;font-size:26px;font-weight:800;letter-spacing:-0.04em;line-height:1.1;margin:0 0 8px;">
      You're on <span style="color:#00AAFF;">${planLabel}</span>, ${firstName}.
    </h1>
    <p style="color:rgba(240,237,232,0.55);font-size:15px;line-height:1.7;margin:0 0 28px;">
      Your account has been upgraded. ${credits.toLocaleString()} credits are loaded and ready.
    </p>

    <!-- Credit summary -->
    <div style="background:rgba(0,170,255,0.05);border:1px solid rgba(0,170,255,0.12);border-radius:12px;padding:20px 22px;margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="color:rgba(240,237,232,0.5);font-size:11px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:4px;">Credits this month</div>
          <div style="color:#F0EDE8;font-size:28px;font-weight:800;letter-spacing:-0.04em;line-height:1;">${credits.toLocaleString()}</div>
        </div>
        <div style="text-align:right;">
          <div style="color:rgba(240,237,232,0.5);font-size:11px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:4px;">Plan</div>
          <div style="color:#00AAFF;font-size:16px;font-weight:700;">${planLabel}</div>
        </div>
      </div>
    </div>

    <!-- What you can do -->
    <p style="color:rgba(240,237,232,0.55);font-size:13px;margin:0 0 14px;font-weight:600;">What you can create with ${credits.toLocaleString()} credits:</p>
    ${[
      ['~' + Math.floor(credits / 3) + ' posts', 'Copy generation'],
      ['~' + Math.floor(credits / 5) + ' images', 'Flux image generation'],
      ['~' + Math.floor(credits / 8) + ' voiceovers', 'ElevenLabs voice'],
      ['~' + Math.floor(credits / 20) + ' video clips', 'Kling video generation'],
    ].map(([amount, label]) => `
    <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
      <span style="color:#F0EDE8;font-size:13px;font-weight:600;">${amount}</span>
      <span style="color:rgba(240,237,232,0.4);font-size:13px;">${label}</span>
    </div>`).join('')}

    <div style="margin-top:24px;">
      <a href="https://nexaa.cc/dashboard" style="display:block;background:#00AAFF;color:#000;text-align:center;padding:14px 24px;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:-0.01em;">
        Start creating →
      </a>
    </div>
  `)
}

function planRenewedEmail(name: string, plan: string, credits: number) {
  const firstName = name?.split(' ')[0] || 'there'
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1)
  return baseTemplate(`
    <h1 style="color:#F0EDE8;font-size:26px;font-weight:800;letter-spacing:-0.04em;line-height:1.1;margin:0 0 8px;">
      Fresh credits, ${firstName}.
    </h1>
    <p style="color:rgba(240,237,232,0.55);font-size:15px;line-height:1.7;margin:0 0 24px;">
      Your ${planLabel} plan has renewed. ${credits.toLocaleString()} credits are back in your account.
    </p>
    <div style="background:rgba(0,170,255,0.05);border:1px solid rgba(0,170,255,0.12);border-radius:12px;padding:20px 22px;margin-bottom:24px;text-align:center;">
      <div style="color:rgba(240,237,232,0.5);font-size:11px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:4px;">Credits renewed</div>
      <div style="color:#00AAFF;font-size:36px;font-weight:800;letter-spacing:-0.04em;line-height:1;">${credits.toLocaleString()}</div>
    </div>
    <a href="https://nexaa.cc/dashboard" style="display:block;background:#00AAFF;color:#000;text-align:center;padding:14px 24px;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:-0.01em;">
      Back to dashboard →
    </a>
  `)
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Verify it's an internal call (from our own API routes)
  const authHeader = request.headers.get('x-internal-secret')
  if (authHeader !== process.env.INTERNAL_API_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { type, to, name, plan, credits } = await request.json()

    if (!to) return NextResponse.json({ error: 'Missing recipient' }, { status: 400 })

    let subject = ''
    let html = ''

    switch (type) {
      case 'welcome':
        subject = `Welcome to Nexa, ${name?.split(' ')[0] || 'there'} 👋`
        html = welcomeEmail(name ?? '')
        break

      case 'plan_activated':
        subject = `Your ${plan} plan is active — ${credits?.toLocaleString()} credits loaded`
        html = planActivatedEmail(name ?? '', plan ?? 'spark', credits ?? 500)
        break

      case 'plan_renewed':
        subject = `Credits renewed — ${credits?.toLocaleString()} ready to use`
        html = planRenewedEmail(name ?? '', plan ?? 'spark', credits ?? 500)
        break

      default:
        return NextResponse.json({ error: 'Unknown email type' }, { status: 400 })
    }

    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: 'Failed to send email', detail: error }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id })

  } catch (err: any) {
    console.error('Notify route error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
