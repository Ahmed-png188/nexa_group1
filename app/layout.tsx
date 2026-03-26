import type { Metadata } from 'next'
import '../styles/globals.css'
import { LanguageProvider } from '@/lib/language-context'

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
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@300;400;500&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@200;300;400;500;700;800;900&display=swap" rel="stylesheet"/>
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var lang = localStorage.getItem('nexa_lang') || 'en';
              var html = document.documentElement;
              if (lang === 'ar') {
                html.setAttribute('lang', 'ar');
                html.setAttribute('dir', 'rtl');
                html.setAttribute('data-lang', 'ar');
              } else {
                html.setAttribute('lang', 'en');
                html.setAttribute('dir', 'ltr');
                html.setAttribute('data-lang', 'en');
              }
            } catch(e){}
          })();
        `}}/>
      </head>
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
