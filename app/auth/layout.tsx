export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      position: 'relative',
    }}>
      {/* Cinematic bg */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:0 }}>
        <div style={{ position:'absolute', top:'-15%', left:'10%', width:'55%', height:'70%', borderRadius:'50%', background:'#5B21B6', filter:'blur(160px)', opacity:0.06 }}/>
        <div style={{ position:'absolute', bottom:'-15%', right:'5%', width:'45%', height:'60%', borderRadius:'50%', background:'#C2410C', filter:'blur(140px)', opacity:0.045 }}/>
      </div>
      <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'center', width:'100%', minHeight:'100vh', padding:'24px' }}>
        {children}
      </div>
    </div>
  )
}
