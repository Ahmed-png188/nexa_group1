import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nexa — Create. Automate. Dominate.',
  description: 'The AI business intelligence platform that learns your brand voice and runs your content marketing on autopilot.',
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  )
}
