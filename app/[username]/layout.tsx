export default function UsernameLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
      />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=DM+Sans:wght@300;400;500;600&family=Instrument+Serif:ital@1&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  )
}
