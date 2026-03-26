import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nexa — Create. Automate. Dominate.',
  description: 'The AI platform that learns your brand voice, builds your strategy, and publishes your content — while you focus on your business.',
  openGraph: {
    title: 'Nexa — Create. Automate. Dominate.',
    description: 'The AI platform that learns your brand voice and runs your content marketing on autopilot.',
    url: 'https://nexaa.cc',
    siteName: 'Nexa',
    locale: 'en_US',
    type: 'website',
  },
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=Instrument+Serif:ital@1&family=DM+Sans:wght@300;400;500;600&family=Geist+Mono:wght@300;400;500&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  )
}
