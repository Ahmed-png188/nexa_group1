// NEXA ARABIC EMAIL TEMPLATES
// Used in /api/notify/route.ts for Arabic users
// Direction: RTL, Font: Tajawal — https://fonts.google.com/share?selection.family=Tajawal:wght@200;300;400;500;700;800;900

export type EmailType =
  | 'welcome'
  | 'plan_activated'
  | 'plan_renewed'
  | 'morning_brief'
  | 'weekly_digest'
  | 'voice_drift_alert'

interface EmailData {
  type: EmailType
  name: string
  [key: string]: any
}

const TAJAWAL_FONT_URL = 'https://fonts.googleapis.com/css2?family=Tajawal:wght@200;300;400;500;700;800;900&display=swap'

const BASE_STYLES = `
  font-family: 'Tajawal', Arial, sans-serif;
  direction: rtl;
  text-align: right;
  background: #0C0C0C;
  color: #FFFFFF;
`

const CARD_STYLE = `
  background: #141414;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  padding: 28px;
  max-width: 560px;
  margin: 0 auto;
`

// ── WELCOME EMAIL (Arabic) ────────────────────────────────────────────────────
export const welcomeAr = (name: string) => ({
  subject: 'Nexa جاهزة. وأنت؟',
  html: `
    <div style="${BASE_STYLES} padding: 40px 20px;">
      <div style="${CARD_STYLE}">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;color:rgba(0,170,255,0.70);margin-bottom:20px">
          مرحباً بك في Nexa
        </div>
        <h1 style="font-size:26px;font-weight:800;letter-spacing:-0.03em;color:#FFFFFF;margin:0 0 16px;line-height:1.2">
          ${name}،<br/>علامتك تنتظرك.
        </h1>
        <p style="font-size:15px;color:rgba(255,255,255,0.60);line-height:1.80;margin:0 0 28px">
          Nexa تعلّمت أن تكتب. لكنها لم تتعلم علامتك بعد.<br/>
          ابدأ بتدريب عقل العلامة — وستتكفل Nexa بالباقي.
        </p>
        <div style="background:#0A0A0A;border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:18px;margin-bottom:24px">
          <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.30);margin-bottom:12px">
            الخطوات الأولى
          </div>
          ${['ارفع أصول علامتك في Brand Brain', 'أجب على ٤ أسئلة في الإعداد', 'اطلب من Nexa أول منشور لك'].map((step, i) => `
            <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
              <div style="width:22px;height:22px;border-radius:6px;background:rgba(0,170,255,0.10);border:1px solid rgba(0,170,255,0.20);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#00AAFF;flex-shrink:0">
                ${i + 1}
              </div>
              <span style="font-size:13px;color:rgba(255,255,255,0.65)">${step}</span>
            </div>
          `).join('')}
        </div>
        <a href="https://nexaa.cc/onboarding" style="display:inline-block;background:#00AAFF;color:#000;padding:13px 28px;border-radius:9px;text-decoration:none;font-weight:700;font-size:14px;font-family:'Tajawal',Arial,sans-serif">
          ابدأ الآن ←
        </a>
        <p style="font-size:11px;color:rgba(255,255,255,0.25);margin-top:20px">
          لديك ١٥٠ رصيداً مجانياً. لا تنتهي صلاحيتها.
        </p>
      </div>
      <div style="text-align:center;margin-top:24px;font-size:11px;color:rgba(255,255,255,0.18)">
        Nexa · hello@nexaa.cc
      </div>
    </div>
  `,
})

// ── PLAN ACTIVATED (Arabic) ───────────────────────────────────────────────────
export const planActivatedAr = (name: string, plan: string, credits: number) => ({
  subject: `خطة ${plan} مفعّلة — ${credits.toLocaleString('ar-SA')} رصيد جاهزة`,
  html: `
    <div style="${BASE_STYLES} padding: 40px 20px;">
      <div style="${CARD_STYLE}">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;color:rgba(0,170,255,0.70);margin-bottom:20px">
          ترقية ناجحة
        </div>
        <h1 style="font-size:24px;font-weight:800;letter-spacing:-0.03em;color:#FFFFFF;margin:0 0 16px">
          ${name}، خطة ${plan} مفعّلة.
        </h1>
        <p style="font-size:15px;color:rgba(255,255,255,0.60);line-height:1.80;margin:0 0 24px">
          رصيدك الجديد جاهز. لا حدود لما يمكن بناؤه.
        </p>
        <div style="background:#0A0A0A;border:1px solid rgba(0,170,255,0.15);border-radius:10px;padding:20px;margin-bottom:24px;text-align:center">
          <div style="font-size:36px;font-weight:800;color:#00AAFF;letter-spacing:-0.05em;line-height:1">
            ${credits.toLocaleString('ar-SA')}
          </div>
          <div style="font-size:11px;color:rgba(255,255,255,0.40);margin-top:4px;text-transform:uppercase;letter-spacing:0.08em">
            رصيد شهري
          </div>
        </div>
        <a href="https://nexaa.cc/dashboard" style="display:inline-block;background:#fff;color:#000;padding:13px 28px;border-radius:9px;text-decoration:none;font-weight:700;font-size:14px;font-family:'Tajawal',Arial,sans-serif">
          افتح Nexa ←
        </a>
      </div>
    </div>
  `,
})

// ── MORNING BRIEF (Arabic) ────────────────────────────────────────────────────
export const morningBriefAr = (
  name: string,
  topAngle: string,
  contentIdea: string,
  nexaRead: string
) => ({
  subject: `ملخص ${name} الصباحي — ${new Date().toLocaleDateString('ar-SA', { weekday:'long' })}`,
  html: `
    <div style="${BASE_STYLES} padding: 40px 20px;">
      <div style="${CARD_STYLE}">
        <div style="font-size:10px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin-bottom:20px">
          ${new Date().toLocaleDateString('ar-SA', { weekday:'long', day:'numeric', month:'long' })}
        </div>
        <h1 style="font-size:22px;font-weight:800;letter-spacing:-0.03em;color:#FFFFFF;margin:0 0 24px">
          صباح الخير، ${name}.
        </h1>

        <div style="background:#0A0A0A;border:1px solid rgba(0,170,255,0.15);border-radius:10px;padding:18px;margin-bottom:14px">
          <div style="font-size:10px;font-weight:600;letter-spacing:0.10em;text-transform:uppercase;color:#00AAFF;margin-bottom:8px">
            أفضل زاوية اليوم
          </div>
          <p style="font-size:15px;color:rgba(255,255,255,0.85);line-height:1.70;margin:0;font-weight:500">
            ${topAngle}
          </p>
        </div>

        <div style="background:#0A0A0A;border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:18px;margin-bottom:14px">
          <div style="font-size:10px;font-weight:600;letter-spacing:0.10em;text-transform:uppercase;color:rgba(255,255,255,0.30);margin-bottom:8px">
            فكرة محتوى
          </div>
          <p style="font-size:14px;color:rgba(255,255,255,0.65);line-height:1.75;margin:0">
            ${contentIdea}
          </p>
        </div>

        <div style="background:#0A0A0A;border:1px solid rgba(0,170,255,0.12);border-radius:10px;padding:18px;margin-bottom:24px">
          <div style="font-size:10px;font-weight:600;letter-spacing:0.10em;text-transform:uppercase;color:#00AAFF;margin-bottom:8px">
            ما تراه Nexa
          </div>
          <p style="font-size:13px;color:rgba(255,255,255,0.60);line-height:1.75;margin:0">
            ${nexaRead}
          </p>
        </div>

        <a href="https://nexaa.cc/dashboard" style="display:inline-block;background:#fff;color:#000;padding:12px 26px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;font-family:'Tajawal',Arial,sans-serif">
          افتح Nexa ←
        </a>
      </div>
      <div style="text-align:center;margin-top:20px;font-size:11px;color:rgba(255,255,255,0.18)">
        Nexa · hello@nexaa.cc
      </div>
    </div>
  `,
})

// ── VOICE DRIFT ALERT (Arabic) ────────────────────────────────────────────────
export const voiceDriftAlertAr = (
  name: string,
  score: number,
  recommendation: string
) => ({
  subject: `⚠ Nexa رصدت انحرافاً في نبرة ${name}`,
  html: `
    <div style="${BASE_STYLES} padding: 40px 20px;">
      <div style="${CARD_STYLE}">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;color:rgba(255,181,71,0.80);margin-bottom:20px">
          تنبيه نبرة الصوت
        </div>
        <h1 style="font-size:22px;font-weight:800;letter-spacing:-0.03em;color:#FFFFFF;margin:0 0 16px">
          Nexa رصدت انحرافاً في نبرتك.
        </h1>
        <p style="font-size:14px;color:rgba(255,255,255,0.55);line-height:1.80;margin:0 0 24px">
          درجة تطابق النبرة الأخيرة: <strong style="color:#FFB547">${score}%</strong><br/>
          ${recommendation}
        </p>
        <a href="https://nexaa.cc/dashboard/brand" style="display:inline-block;background:#FFB547;color:#000;padding:12px 26px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;font-family:'Tajawal',Arial,sans-serif">
          إعادة المعايرة ←
        </a>
      </div>
    </div>
  `,
})

// ── FACTORY ───────────────────────────────────────────────────────────────────
export function buildArabicEmail(data: EmailData) {
  switch (data.type) {
    case 'welcome':
      return welcomeAr(data.name)
    case 'plan_activated':
      return planActivatedAr(data.name, data.plan, data.credits)
    case 'morning_brief':
      return morningBriefAr(data.name, data.topAngle, data.contentIdea, data.nexaRead)
    case 'voice_drift_alert':
      return voiceDriftAlertAr(data.name, data.score, data.recommendation)
    default:
      return welcomeAr(data.name)
  }
}
