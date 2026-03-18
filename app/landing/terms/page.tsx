'use client'
import Link from 'next/link'
import Image from 'next/image'

export default function TermsPage() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--t1)', fontFamily: 'var(--sans)', minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(3,3,10,0.88)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,0.055)', padding: '0 40px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/landing" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <Image src="/favicon.png" alt="Nexa" width={20} height={20} style={{ borderRadius: 5 }} />
          <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--t1)' }}>Nexa</span>
        </Link>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/auth/login" style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--line2)', background: 'none', color: 'var(--t3)', fontSize: 13, textDecoration: 'none' }}>Sign in</Link>
          <Link href="/auth/signup" style={{ padding: '7px 16px', borderRadius: 8, background: 'var(--blue)', color: '#fff', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>Start free →</Link>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '64px 40px 100px' }}>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 42, fontWeight: 400, letterSpacing: '-0.02em', marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ fontSize: 13, color: 'var(--t4)', marginBottom: 48 }}>Last updated: March 18, 2026</p>

        {[
          {
            title: '1. Acceptance of Terms',
            body: `By accessing or using Nexa ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.\n\nThese terms apply to all users, including visitors, registered users, and paying subscribers. Nexa reserves the right to modify these terms at any time. We will notify you of significant changes via email.`,
          },
          {
            title: '2. Description of Service',
            body: `Nexa is an AI-powered business intelligence and content creation platform. The Service includes Brand Brain (voice modeling), Studio (content creation), Strategy (content planning), Agents (automated marketing), Sequences (email automation), and Amplify (advertising tools).\n\nNexa is provided "as is" and we reserve the right to modify, suspend, or discontinue any part of the Service at any time.`,
          },
          {
            title: '3. Account Registration',
            body: `You must create an account to use Nexa. You agree to:\n\n— Provide accurate, current, and complete registration information\n— Maintain the security of your password\n— Accept responsibility for all activities under your account\n— Notify us immediately of any unauthorized account access\n\nYou must be at least 16 years old to create an account. Business accounts may be created by authorized representatives of the company.`,
          },
          {
            title: '4. Subscription and Payment',
            body: `Nexa offers paid subscription plans. By subscribing, you agree to:\n\n— Pay the applicable subscription fee on a recurring monthly or annual basis\n— Provide valid payment information\n— Authorize us to charge your payment method for subscription fees\n\n**Free trial:** New accounts receive 500 free credits. No credit card is required for the free tier.\n\n**Paid plans:** Subscriptions begin when you enter payment information. Fees are charged in advance on a monthly basis.\n\n**Refunds:** We offer a 7-day refund on first-time subscriptions. After 7 days, all fees are non-refundable.`,
          },
          {
            title: '5. Credits System',
            body: `Nexa uses a credits system to govern AI generation usage. Credits are allocated monthly based on your plan and do not roll over between billing periods.\n\nCredit costs:\n— Text content: 3 credits\n— Image generation: 5 credits\n— Video generation: 20 credits\n— Voice generation: 10 credits per minute\n\nChat, scheduling, and strategy features are free and do not consume credits.`,
          },
          {
            title: '6. Cancellation',
            body: `You may cancel your subscription at any time from your account settings. Cancellation takes effect at the end of the current billing period. You will retain access to your plan until that date.\n\nUpon cancellation, your account will revert to the free tier. Your data will be retained for 90 days, after which it may be permanently deleted.`,
          },
          {
            title: '7. Intellectual Property',
            body: `**Your content:** You retain full ownership of all content you create using Nexa, including Brand Brain training data, generated posts, images, and videos.\n\n**Nexa's IP:** The Nexa platform, software, design, and all related intellectual property belong to Nexa. You may not copy, modify, distribute, or reverse engineer any part of the platform.\n\n**License to Nexa:** By using the Service, you grant Nexa a limited license to process your content solely to provide the Service. We do not use your content to train general AI models.`,
          },
          {
            title: '8. Acceptable Use',
            body: `You agree not to use Nexa to:\n\n— Generate content that is illegal, harmful, defamatory, or violates any third-party rights\n— Spam, harass, or send unsolicited communications\n— Impersonate any person or entity\n— Attempt to access systems or data you are not authorized to access\n— Use the Service in a way that could damage, disable, or impair it\n— Resell or commercially redistribute the Service without written permission\n\nViolation of these terms may result in immediate account termination.`,
          },
          {
            title: '9. Agency Workspaces',
            body: `The Agency plan allows you to create separate workspaces for client brands. As an agency user, you are responsible for:\n\n— Ensuring you have authorization to create content on behalf of your clients\n— Complying with all applicable laws regarding client data\n— Informing clients of how their data is processed through Nexa\n\nNexa is not responsible for your use of the platform on behalf of third parties.`,
          },
          {
            title: '10. Third-Party Integrations',
            body: `Nexa integrates with third-party platforms including social media networks, CRMs, and automation tools. Your use of these integrations is subject to the third party's own terms of service.\n\nNexa is not responsible for the availability, accuracy, or conduct of third-party platforms. We do not guarantee that integrations will remain available.`,
          },
          {
            title: '11. Disclaimer of Warranties',
            body: `The Service is provided "as is" without warranties of any kind, express or implied. Nexa does not warrant that the Service will be uninterrupted, error-free, or completely secure.\n\nAI-generated content may contain errors or inaccuracies. You are responsible for reviewing all content before publishing or distributing it. Nexa is not responsible for any consequences resulting from AI-generated content.`,
          },
          {
            title: '12. Limitation of Liability',
            body: `To the maximum extent permitted by law, Nexa shall not be liable for any indirect, incidental, special, consequential, or punitive damages — including loss of profits, data, or goodwill — arising from your use of the Service.\n\nOur total liability to you for any claim arising from these terms shall not exceed the amount you paid us in the 12 months preceding the claim.`,
          },
          {
            title: '13. Governing Law',
            body: `These Terms of Service are governed by the laws of the United Arab Emirates. Any disputes will be subject to the exclusive jurisdiction of the courts of Dubai, UAE.\n\nIf any provision of these terms is found to be unenforceable, the remaining provisions will remain in full force.`,
          },
          {
            title: '14. Contact',
            body: `For questions about these Terms of Service, contact us:\n\n**Email:** hello@nexaa.cc\n**Company:** Nexa\n\nWe will respond to all legal inquiries within 5 business days.`,
          },
        ].map((section, i) => (
          <div key={i} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--t1)', marginBottom: 12 }}>{section.title}</h2>
            {section.body.split('\n\n').map((para, j) => (
              <p key={j} style={{ fontSize: 14, color: 'var(--t3)', lineHeight: 1.8, marginBottom: 12 }}>{para}</p>
            ))}
          </div>
        ))}

        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 32, marginTop: 48 }}>
          <Link href="/landing" style={{ fontSize: 13, color: 'var(--blue2)', textDecoration: 'none' }}>← Back to Nexa</Link>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--line)', padding: '24px 40px', textAlign: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--t4)' }}>© 2026 Nexa. All rights reserved. · </span>
        <Link href="/landing/privacy" style={{ fontSize: 12, color: 'var(--t4)', textDecoration: 'none' }}>Privacy Policy</Link>
      </footer>
    </div>
  )
}
