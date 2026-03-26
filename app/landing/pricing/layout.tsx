import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — Nexa',
  description: 'Simple, transparent pricing for every stage. Start free with 150 credits. Spark $49/mo · Grow $89/mo · Scale $169/mo · Agency $349/mo.',
  openGraph: {
    title: 'Nexa Pricing — Plans for every stage',
    description: 'Start free with 150 credits. No card required. Full Brand Brain on every plan.',
    url: 'https://nexaa.cc/landing/pricing',
    siteName: 'Nexa',
    type: 'website',
  },
  alternates: {
    canonical: 'https://nexaa.cc/landing/pricing',
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=Instrument+Serif:ital@1&family=DM+Sans:wght@300;400;500;600&family=Geist+Mono:wght@300;400;500&family=Tajawal:wght@400;500;700;800;900&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  )
}
