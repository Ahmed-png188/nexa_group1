import type { Metadata } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'Nexa — The Creative Operating System',
  description: 'Create. Automate. Dominate. One AI workspace for your entire brand.',
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/favicon.png"/>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
      </head>
      <body>{children}</body>
    </html>
  )
}
