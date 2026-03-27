'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const C = {
  bg:      '#0C0C0C',
  surface: '#141414',
  over:    '#1A1A1A',
  border:  'rgba(255,255,255,0.10)',
  borderS: 'rgba(255,255,255,0.06)',
  cyan:    '#00AAFF',
  cyanD:   'rgba(0,170,255,0.12)',
  cyanB:   'rgba(0,170,255,0.22)',
  t1:      '#FFFFFF',
  t2:      'rgba(255,255,255,0.65)',
  t3:      'rgba(255,255,255,0.35)',
  t4:      'rgba(255,255,255,0.20)',
  green:   '#22C55E',
  greenD:  'rgba(34,197,94,0.10)',
  greenB:  'rgba(34,197,94,0.20)',
}
const EN   = "'Geist', -apple-system, sans-serif"
const MONO = "'Geist Mono', monospace"
const NEXA_WHATSAPP = process.env.NEXT_PUBLIC_NEXA_WHATSAPP_NUMBER || '+1 415 523 8886'

export default function WhatsAppSettingsPage() {
  const supabase = createClient()
  const [wsId,      setWsId]      = useState<string | null>(null)
  const [phone,     setPhone]     = useState('')
  const [lang,      setLang]      = useState<'en' | 'ar'>('en')
  const [connected, setConnected] = useState<string | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [checking,  setChecking]  = useState(true)
  const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null)

  const toast_ = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1).single()
        .then(({ data: m }) => {
          if (!m) return
          setWsId(m.workspace_id)
          // Check existing connection
          supabase.from('whatsapp_connections')
            .select('phone_number, lang')
            .eq('workspace_id', m.workspace_id)
            .eq('is_active', true)
            .single()
            .then(({ data: conn }) => {
              if (conn) {
                setConnected((conn as Record<string, string>).phone_number)
                setLang(((conn as Record<string, string>).lang || 'en') as 'en' | 'ar')
              }
              setChecking(false)
            })
        })
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function connect() {
    if (!wsId || !phone.trim() || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/whatsapp/connect', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: wsId, phone_number: phone.trim(), lang }),
      })
      const data = await res.json() as Record<string, string>
      if (!res.ok) { toast_(data.error || 'Connection failed', false); return }
      setConnected(data.phone)
      toast_('Connected! Check WhatsApp for a welcome message')
    } catch { toast_('Something went wrong', false) }
    finally { setLoading(false) }
  }

  async function disconnect() {
    if (!wsId || loading) return
    setLoading(true)
    try {
      await fetch('/api/whatsapp/connect', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: wsId }),
      })
      setConnected(null)
      toast_('Disconnected')
    } catch { toast_('Failed', false) }
    finally { setLoading(false) }
  }

  if (checking) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      height:'50vh', background:C.bg }}>
      <div className="nexa-spinner" style={{ width:24, height:24 }}/>
    </div>
  )

  return (
    <div style={{ padding:'40px 32px', maxWidth:560, fontFamily:EN }}>

      {/* Header */}
      <div style={{ marginBottom:32 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.10em',
          color:'rgba(0,170,255,0.65)', textTransform:'uppercase' as const,
          marginBottom:8 }}>WHATSAPP</div>
        <div style={{ fontSize:24, fontWeight:700, color:C.t1,
          letterSpacing:'-0.03em', marginBottom:8 }}>
          Nexa on WhatsApp
        </div>
        <div style={{ fontSize:13, color:C.t3, lineHeight:1.7 }}>
          Control everything from WhatsApp — create content, check stats,
          process product photos, and get your morning brief. All without
          opening the dashboard.
        </div>
      </div>

      {connected ? (
        /* ── CONNECTED STATE ──────────────────────────────────────────────── */
        <div>
          <div style={{ padding:'20px', borderRadius:14,
            background:C.greenD, border:`1px solid ${C.greenB}`,
            marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10,
              marginBottom:12 }}>
              <div style={{ width:8, height:8, borderRadius:'50%',
                background:C.green }}/>
              <span style={{ fontSize:12, fontWeight:700, color:C.green }}>
                Connected
              </span>
            </div>
            <div style={{ fontSize:16, fontWeight:600, color:C.t1,
              fontFamily:MONO, marginBottom:4 }}>{connected}</div>
            <div style={{ fontSize:11, color:C.t3 }}>
              Language: {lang === 'ar' ? 'Arabic (Gulf)' : 'English'}
            </div>
          </div>

          {/* Nexa's number */}
          <div style={{ padding:'16px 20px', borderRadius:12,
            background:C.surface, border:`1px solid ${C.border}`,
            marginBottom:20 }}>
            <div style={{ fontSize:11, color:C.t4, marginBottom:6 }}>
              Nexa's WhatsApp number
            </div>
            <div style={{ fontSize:18, fontWeight:700, color:C.t1,
              fontFamily:MONO }}>{NEXA_WHATSAPP}</div>
            <div style={{ fontSize:11, color:C.t3, marginTop:4 }}>
              Save this contact and message it anytime
            </div>
          </div>

          {/* What you can do */}
          <div style={{ padding:'16px 20px', borderRadius:12,
            background:C.surface, border:`1px solid ${C.border}`,
            marginBottom:24 }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.t4,
              textTransform:'uppercase' as const, letterSpacing:'0.08em',
              marginBottom:12 }}>What you can say</div>
            {[
              { cmd: '"Write a post about our new product"',  desc: 'Creates and sends for approval' },
              { cmd: '"Send me today\'s brief"',              desc: 'Morning brief as voice note'    },
              { cmd: '"How are my ads doing?"',               desc: 'Performance summary'            },
              { cmd: '"How many credits do I have?"',         desc: 'Instant balance check'          },
              { cmd: 'Send a product photo',                  desc: 'Processed and returned professionally' },
              { cmd: 'Record a voice note',                   desc: 'Understood and acted on'        },
            ].map((item, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between',
                alignItems:'flex-start', padding:'8px 0',
                borderBottom: i < 5 ? `1px solid ${C.borderS}` : 'none' }}>
                <span style={{ fontSize:12, color:C.cyan, fontFamily:MONO,
                  flex:1, paddingRight:12 }}>{item.cmd}</span>
                <span style={{ fontSize:11, color:C.t4, flexShrink:0 }}>
                  {item.desc}
                </span>
              </div>
            ))}
          </div>

          <button onClick={disconnect} disabled={loading}
            style={{ padding:'10px 20px', borderRadius:10, fontSize:12,
              fontWeight:500, background:'rgba(239,68,68,0.08)',
              border:'1px solid rgba(239,68,68,0.18)',
              color:'rgba(239,68,68,0.70)', cursor:'pointer' }}>
            {loading ? 'Disconnecting...' : 'Disconnect WhatsApp'}
          </button>
        </div>
      ) : (
        /* ── CONNECT FORM ─────────────────────────────────────────────────── */
        <div>
          {/* Nexa's number first */}
          <div style={{ padding:'20px', borderRadius:14,
            background:C.cyanD, border:`1px solid ${C.cyanB}`,
            marginBottom:24 }}>
            <div style={{ fontSize:11, color:'rgba(0,170,255,0.65)',
              marginBottom:6, fontWeight:600 }}>Step 1 — Save Nexa's number</div>
            <div style={{ fontSize:22, fontWeight:700, color:C.t1,
              fontFamily:MONO, marginBottom:4 }}>{NEXA_WHATSAPP}</div>
            <div style={{ fontSize:12, color:C.t3 }}>
              Save this as "Nexa" in your contacts
            </div>
          </div>

          {/* Phone input */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, color:C.t4, marginBottom:8,
              fontWeight:500 }}>Step 2 — Enter your WhatsApp number</div>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+971 50 123 4567"
              style={{ width:'100%', padding:'12px 14px', borderRadius:10,
                background:'rgba(255,255,255,0.04)',
                border:`1px solid ${C.border}`,
                color:C.t1, fontSize:14, fontFamily:MONO,
                outline:'none', boxSizing:'border-box' as const }}
            />
          </div>

          {/* Language preference */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:11, color:C.t4, marginBottom:8,
              fontWeight:500 }}>Step 3 — Preferred language</div>
            <div style={{ display:'flex', gap:8 }}>
              {([
                { id:'en' as const, label:'English'  },
                { id:'ar' as const, label:'العربية' },
              ] as const).map(l => (
                <button key={l.id} onClick={() => setLang(l.id)}
                  style={{ flex:1, padding:'11px', borderRadius:10,
                    fontSize:13, fontWeight:600, border:'none',
                    cursor:'pointer', transition:'all 0.13s',
                    background: lang === l.id ? '#FFFFFF' : 'rgba(255,255,255,0.06)',
                    color:      lang === l.id ? '#0C0C0C' : C.t3,
                    fontFamily: l.id === 'ar' ? "'Tajawal',system-ui,sans-serif" : EN }}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={connect}
            disabled={!phone.trim() || loading}
            style={{ width:'100%', padding:'14px', borderRadius:12,
              fontSize:14, fontWeight:700, border:'none',
              cursor: phone.trim() && !loading ? 'pointer' : 'not-allowed',
              background: phone.trim() && !loading ? '#FFFFFF' : 'rgba(255,255,255,0.06)',
              color:      phone.trim() && !loading ? '#0C0C0C' : C.t4,
              transition:'all 0.15s' }}>
            {loading ? 'Connecting...' : 'Connect WhatsApp →'}
          </button>

          <div style={{ fontSize:11, color:C.t4, textAlign:'center' as const,
            marginTop:12 }}>
            You'll receive a welcome message on WhatsApp to confirm
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed' as const, bottom:24, right:24,
          padding:'11px 18px', borderRadius:10, fontSize:13, fontWeight:500,
          background: toast.ok ? C.greenD : 'rgba(239,68,68,0.08)',
          border:     toast.ok ? `1px solid ${C.greenB}` : '1px solid rgba(239,68,68,0.18)',
          color:      toast.ok ? C.green : '#EF4444',
          backdropFilter:'blur(16px)', zIndex:9999, fontFamily:EN }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
