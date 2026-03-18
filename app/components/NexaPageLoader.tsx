'use client'
import { useState, useEffect } from 'react'

export function NexaPageLoader({ label = 'Loading' }: { label?: string }) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 2200)
    return () => clearTimeout(t)
  }, [])
  if (!visible) return null
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9999,
      background:'var(--bg)',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      gap:20,
    }}>
      <div style={{ position:'absolute', top:'-10%', left:'20%', width:500, height:350, borderRadius:'50%', background:'#5B21B6', filter:'blur(160px)', opacity:0.07, pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:'-10%', right:'15%', width:400, height:280, borderRadius:'50%', background:'#C2410C', filter:'blur(140px)', opacity:0.05, pointerEvents:'none' }}/>
      <img src="/favicon.png" alt="Nexa" style={{ width:36, height:36, borderRadius:8, objectFit:'contain', opacity:0.9 }} />
      <div style={{ display:'flex', alignItems:'center', gap:8, opacity:0, animation:'fadeUp 0.4s ease forwards 1.4s' }}>
        <div className="nexa-spinner" style={{ width:11, height:11 }}/>
        <span style={{ fontSize:11, color:'var(--t4)', letterSpacing:'0.02em' }}>{label}</span>
      </div>
    </div>
  )
}
