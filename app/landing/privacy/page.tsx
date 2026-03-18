'use client'
import Link from 'next/link'
import Image from 'next/image'

export default function PrivacyPage() {
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
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 42, fontWeight: 400, letterSpacing: '-0.02em', marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ fontSize: 13, color: 'var(--t4)', marginBottom: 48 }}>Last updated: March 18, 2026</p>

        {[
          {
            title: '1. Information We Collect',
            body: `We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.\n\n**Account information:** Name, email address, password, and billing information.\n\n**Content data:** Any content you upload to train Brand Brain, including text, images, and documents.\n\n**Usage data:** How you interact with Nexa, including features used, content created, and session duration.\n\n**Device information:** IP address, browser type, operating system, and device identifiers.`,
          },
          {
            title: '2. How We Use Your Information',
            body: `We use the information we collect to:\n\n— Provide, maintain, and improve our services\n— Process transactions and send related information\n— Train your Brand Brain voice model (your data is used only for your workspace)\n— Send technical notices, updates, and support messages\n— Respond to your comments and questions\n— Monitor and analyze usage patterns to improve the product`,
          },
          {
            title: '3. Data Storage and Security',
            body: `All data is encrypted at rest using AES-256 encryption and in transit using TLS 1.3. We store data on Supabase infrastructure hosted on AWS in the EU-West region.\n\nWe implement industry-standard security measures including access controls, audit logging, and regular security reviews. However, no method of transmission over the internet is 100% secure.`,
          },
          {
            title: '4. Your Brand Brain Data',
            body: `Your Brand Brain training data — including any content, documents, or materials you upload — belongs entirely to you. We use this data solely to power your workspace's voice model.\n\nWe do not use your content to train our general AI models. We do not sell or share your brand data with third parties. You can delete your Brand Brain data at any time from your workspace settings.`,
          },
          {
            title: '5. Third-Party Services',
            body: `Nexa integrates with third-party services to provide its functionality. These include:\n\n— **Anthropic** (Claude AI): Used for content generation. Governed by Anthropic's usage policies.\n— **Google (Veo)**: Used for video generation.\n— **ElevenLabs**: Used for voice generation.\n— **Fal.ai**: Used for image generation.\n— **Stripe**: Used for payment processing. We do not store payment card data.\n— **Supabase**: Used for database and storage.\n\nEach third party has its own privacy policy governing the use of your data within their systems.`,
          },
          {
            title: '6. Sharing of Information',
            body: `We do not sell, trade, or rent your personal information to third parties. We may share information in the following circumstances:\n\n— With service providers who help us operate our business (under strict confidentiality agreements)\n— If required by law, regulation, or legal process\n— In connection with a merger, acquisition, or sale of assets (you will be notified in advance)\n— With your explicit consent`,
          },
          {
            title: '7. Data Retention',
            body: `We retain your account data for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where we are required to retain it by law.\n\nContent you have created may be retained in anonymized, aggregated form for analytics purposes.`,
          },
          {
            title: '8. Your Rights',
            body: `You have the right to:\n\n— Access the personal data we hold about you\n— Correct inaccurate data\n— Request deletion of your data\n— Export your data in a portable format\n— Opt out of marketing communications at any time\n\nTo exercise any of these rights, contact us at hello@nexaa.cc.`,
          },
          {
            title: '9. Cookies',
            body: `We use cookies and similar tracking technologies to maintain your session, remember your preferences, and analyze usage. You can control cookies through your browser settings. Disabling cookies may affect the functionality of our service.`,
          },
          {
            title: '10. Children\'s Privacy',
            body: `Nexa is not directed at children under the age of 16. We do not knowingly collect personal information from children. If we become aware that a child has provided us with personal information, we will delete it.`,
          },
          {
            title: '11. Changes to This Policy',
            body: `We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through a notice in the product. Your continued use of Nexa after changes are made constitutes your acceptance of the new policy.`,
          },
          {
            title: '12. Contact Us',
            body: `If you have questions about this Privacy Policy, please contact us:\n\n**Email:** hello@nexaa.cc\n**Company:** Nexa\n\nWe will respond to all privacy-related inquiries within 48 hours.`,
          },
        ].map((section, i) => (
          <div key={i} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--t1)', marginBottom: 12 }}>{section.title}</h2>
            {section.body.split('\n\n').map((para, j) => (
              <p key={j} style={{ fontSize: 14, color: 'var(--t3)', lineHeight: 1.8, marginBottom: 12 }}>
                {para.startsWith('—') ? para : para}
              </p>
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
        <Link href="/landing/terms" style={{ fontSize: 12, color: 'var(--t4)', textDecoration: 'none' }}>Terms of Service</Link>
      </footer>
    </div>
  )
}
