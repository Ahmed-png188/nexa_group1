'use client'
import { useState, useEffect } from 'react'

type FieldType = 'text'|'email'|'phone'|'textarea'|'select'|'multiselect'|'checkbox'|'radio'|'number'|'url'

interface FormField {
  id:string; type:FieldType; label:string; placeholder?:string
  required:boolean; options?:string[]
}

interface Workspace {
  id:string; name:string; brand_name:string|null; segment:string|null
  lead_page_fields?:string|null; lead_page_lang?:string|null
  lead_page_theme?:string|null; lead_page_font?:string|null; lead_page_accent?:string|null
  lead_page_logo_url?:string|null; lead_page_headline?:string|null; lead_page_subline?:string|null
  lead_page_cta?:string|null; lead_page_show_powered_by?:boolean|null
  lead_page_button_style?:string|null; lead_page_layout?:string|null
  lead_magnet_enabled?:boolean|null; lead_magnet_url?:string|null; lead_magnet_label?:string|null
}

const THEMES: Record<string,{bg:string;surface:string;border:string;text1:string;text2:string;text3:string}> = {
  dark:     {bg:'#0C0C0C',surface:'#141414',border:'rgba(255,255,255,0.10)',text1:'#FFFFFF', text2:'rgba(255,255,255,0.72)',text3:'rgba(255,255,255,0.40)'},
  black:    {bg:'#000000',surface:'#0a0a0a',border:'rgba(255,255,255,0.08)',text1:'#FFFFFF', text2:'rgba(255,255,255,0.65)',text3:'rgba(255,255,255,0.35)'},
  light:    {bg:'#F5F5F5',surface:'#FFFFFF',border:'rgba(0,0,0,0.10)',      text1:'#0C0C0C', text2:'rgba(0,0,0,0.65)',      text3:'rgba(0,0,0,0.40)'     },
  warm:     {bg:'#FDF8F0',surface:'#FFFFFF',border:'rgba(0,0,0,0.08)',      text1:'#1a1208', text2:'rgba(26,18,8,0.65)',    text3:'rgba(26,18,8,0.40)'   },
  midnight: {bg:'#070B14',surface:'#0E1420',border:'rgba(100,160,255,0.12)',text1:'#E8F0FF', text2:'rgba(200,220,255,0.65)',text3:'rgba(160,190,255,0.38)'},
  rose:     {bg:'#0f0508',surface:'#1a0a10',border:'rgba(255,100,150,0.12)',text1:'#FFE8F0', text2:'rgba(255,220,235,0.65)',text3:'rgba(255,180,210,0.40)'},
}
const FONTS:Record<string,string> = {
  geist:   "'Geist',-apple-system,sans-serif",
  inter:   "'Inter',system-ui,sans-serif",
  dm:      "'DM Sans',sans-serif",
  mono:    "'Geist Mono',monospace",
  serif:   "Georgia,'Times New Roman',serif",
  tajawal: "'Tajawal',system-ui,sans-serif",
}

const SEGMENT_CTA_EN:Record<string,string> = {
  creator:"I'm in →", freelancer:'Start the conversation →', business:'Send →', agency:"Let's talk →"
}
const SEGMENT_CTA_AR:Record<string,string> = {
  creator:"أنا داخل ←", freelancer:'ابدأ المحادثة ←', business:'أرسل ←', agency:"لنتحدث ←"
}

const DEFAULT_FIELDS_EN:FormField[] = [
  {id:'f-name', type:'text',     label:'Your name',                             placeholder:'First name',      required:false},
  {id:'f-email',type:'email',    label:'Email address',                         placeholder:'you@example.com', required:true },
  {id:'f-q',    type:'textarea', label:"What's your biggest challenge right now?", placeholder:'Your answer…', required:false},
]
const DEFAULT_FIELDS_AR:FormField[] = [
  {id:'f-name', type:'text',     label:'اسمك',                       placeholder:'الاسم الأول',     required:false},
  {id:'f-email',type:'email',    label:'البريد الإلكتروني',          placeholder:'you@example.com', required:true },
  {id:'f-q',    type:'textarea', label:'ما أكبر تحدٍّ تواجهه الآن؟', placeholder:'إجابتك…',        required:false},
]

export default function LeadForm({workspace}:{workspace:Workspace}) {
  const [isAr, setIsAr] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Priority: workspace language setting > visitor's Nexa preference > browser language
    if (workspace.lead_page_lang === 'ar') { setIsAr(true); setReady(true); return }
    if (workspace.lead_page_lang === 'en') { setIsAr(false); setReady(true); return }
    try {
      const stored = localStorage.getItem('nexa_lang')
      if (stored === 'ar') { setIsAr(true); setReady(true); return }
      if (stored === 'en') { setIsAr(false); setReady(true); return }
    } catch {}
    if (typeof navigator !== 'undefined' && navigator.language?.startsWith('ar')) {
      setIsAr(true)
    }
    setReady(true)
  }, [workspace.lead_page_lang])

  let fields:FormField[] = isAr ? DEFAULT_FIELDS_AR : DEFAULT_FIELDS_EN
  try {
    if (workspace.lead_page_fields) {
      const parsed = JSON.parse(workspace.lead_page_fields)
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((f:any) => f.id && f.type && f.label)) {
        fields = parsed
      }
    }
  } catch {}

  const [values,    setValues]    = useState<Record<string,string|string[]>>({})
  const [submitting,setSubmitting] = useState(false)
  const [submitted, setSubmitted]  = useState(false)
  const [error,     setError]      = useState('')
  const [magnetUrl, setMagnetUrl]  = useState<string|null>(null)

  // Re-init values when fields/language changes
  useEffect(() => {
    setValues(Object.fromEntries(fields.map(f=>[f.id, f.type==='multiselect'?[]:'' ])))
  }, [isAr])

  const brandName = workspace.brand_name||workspace.name
  const th = THEMES[workspace.lead_page_theme||'dark']||THEMES.dark
  const isLight = ['light','warm'].includes(workspace.lead_page_theme||'dark')
  const ff  = isAr ? "'Tajawal',system-ui,sans-serif" : (FONTS[workspace.lead_page_font||'geist']||FONTS.geist)
  const a   = workspace.lead_page_accent||'#00AAFF'
  const dir = isAr ? 'rtl' : 'ltr'

  const segCTA   = isAr ? SEGMENT_CTA_AR : SEGMENT_CTA_EN
  const headline = workspace.lead_page_headline||(brandName ? (isAr ? `تواصل مع ${brandName}` : `Get in touch with ${brandName}`) : (isAr ? 'تواصل معنا' : 'Get in touch'))
  const subline  = workspace.lead_page_subline  ||(isAr ? 'اتركِ بياناتك وسنتواصل معك قريباً.' : "Drop your details and we'll be in touch soon.")
  const cta      = workspace.lead_page_cta      ||(segCTA[workspace.segment||'business']||(isAr ? 'أرسل ←' : 'Send →'))
  const layout   = workspace.lead_page_layout   ||'centered'
  const showPwr  = workspace.lead_page_show_powered_by ?? true

  const btnBg    = workspace.lead_page_button_style==='filled' ? a : workspace.lead_page_button_style==='soft' ? `${a}18` : 'transparent'
  const btnColor = workspace.lead_page_button_style==='filled' ? (isLight?'#fff':'#000') : a
  const btnBorder= workspace.lead_page_button_style==='outline' ? `1.5px solid ${a}` : 'none'

  const inp=(extra?:React.CSSProperties):React.CSSProperties=>({
    width:'100%', padding:'11px 14px', fontSize:14,
    background:isLight?'rgba(0,0,0,0.04)':'rgba(255,255,255,0.06)',
    border:`1px solid ${th.border}`, borderRadius:10, color:th.text1,
    fontFamily:ff, outline:'none', transition:'border-color 0.15s', boxSizing:'border-box',
    textAlign:isAr?'right':'left', direction:dir, ...extra,
  })

  function setValue(id:string,val:string|string[]){setValues(p=>({...p,[id]:val}))}
  function toggleMulti(id:string,opt:string){
    const cur=((values[id]||[])) as string[]
    setValue(id,cur.includes(opt)?cur.filter(x=>x!==opt):[...cur,opt])
  }

  async function handleSubmit() {
    for (const f of fields) {
      if (!f.required) continue
      const v = values[f.id]
      if (!v||(Array.isArray(v)&&v.length===0)||(typeof v==='string'&&!v.trim())) {
        setError(isAr ? `يرجى تعبئة: ${f.label}` : `Please fill in: ${f.label}`); return
      }
    }
    const emailField = fields.find(f=>f.type==='email')
    const emailVal   = emailField?(values[emailField.id] as string)||'':''
    if (!emailVal||!emailVal.includes('@')) {
      setError(isAr ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address'); return
    }
    setSubmitting(true); setError('')
    try {
      const res = await fetch('/api/lead-capture',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({workspace_id:workspace.id, form_values:values, fields, source:'lead_page', lang:isAr?'ar':'en'}),
      })
      if (res.ok) {
        const d = await res.json()
        if (d.magnet_url) setMagnetUrl(d.magnet_url)
        setSubmitted(true)
      } else setError(isAr ? 'حدث خطأ. يرجى المحاولة مرة أخرى.' : 'Something went wrong. Please try again.')
    } catch { setError(isAr ? 'حدث خطأ. يرجى المحاولة مرة أخرى.' : 'Something went wrong. Please try again.') }
    finally { setSubmitting(false) }
  }

  function renderField(field:FormField) {
    const val = values[field.id]||''
    if (field.type==='textarea') return (
      <textarea value={val as string} onChange={e=>setValue(field.id,e.target.value)}
        placeholder={field.placeholder||''} rows={3}
        style={{...inp(), resize:'vertical' as const, lineHeight:1.65}}/>
    )
    if (field.type==='select') return (
      <select value={val as string} onChange={e=>setValue(field.id,e.target.value)} style={{...inp(),cursor:'pointer'}}>
        <option value="">{isAr?'اختر…':'Select…'}</option>
        {(field.options||[]).map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    )
    if (field.type==='radio') return (
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {(field.options||[]).map(o=>(
          <label key={o} style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',flexDirection:isAr?'row-reverse':'row',justifyContent:isAr?'flex-end':'flex-start'}}>
            <div onClick={()=>setValue(field.id,o)} style={{width:18,height:18,borderRadius:'50%',border:`2px solid ${val===o?a:th.border}`,background:val===o?a:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.15s',cursor:'pointer'}}>
              {val===o&&<div style={{width:7,height:7,borderRadius:'50%',background:'#000'}}/>}
            </div>
            <span style={{fontSize:14,color:th.text1,fontFamily:ff}}>{o}</span>
          </label>
        ))}
      </div>
    )
    if (field.type==='multiselect') return (
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {(field.options||[]).map(o=>{
          const checked=((val as string[])||[]).includes(o)
          return (
            <label key={o} style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',flexDirection:isAr?'row-reverse':'row',justifyContent:isAr?'flex-end':'flex-start'}}>
              <div onClick={()=>toggleMulti(field.id,o)} style={{width:18,height:18,borderRadius:4,border:`2px solid ${checked?a:th.border}`,background:checked?a:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.15s',cursor:'pointer'}}>
                {checked&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              <span style={{fontSize:14,color:th.text1,fontFamily:ff}}>{o}</span>
            </label>
          )
        })}
      </div>
    )
    if (field.type==='checkbox') return (
      <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',flexDirection:isAr?'row-reverse':'row'}}>
        <div onClick={()=>setValue(field.id,val?'':'checked')} style={{width:18,height:18,borderRadius:4,border:`2px solid ${val?a:th.border}`,background:val?a:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.15s',cursor:'pointer'}}>
          {val&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
        </div>
        <span style={{fontSize:14,color:th.text1,fontFamily:ff}}>{field.label}</span>
      </label>
    )
    return (
      <input type={field.type} value={val as string} onChange={e=>setValue(field.id,e.target.value)}
        placeholder={field.placeholder||''} style={inp()}/>
    )
  }

  if (!ready) return (
    <div style={{minHeight:'100vh',background:'#0C0C0C',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:20,height:20,border:'2px solid rgba(255,255,255,0.1)',borderTopColor:'#00AAFF',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
    </div>
  )

  const initial = (brandName||'N')[0].toUpperCase()

  return (
    <div dir={dir} style={{minHeight:'100vh',background:th.bg,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 20px',position:'relative',overflow:'hidden',fontFamily:ff}}>
      <div style={{position:'fixed',top:'12%',left:'50%',transform:'translateX(-50%)',width:500,height:350,borderRadius:'50%',background:`radial-gradient(ellipse,${a}12 0%,transparent 70%)`,pointerEvents:'none'}}/>
      <style dangerouslySetInnerHTML={{__html:`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
        *{box-sizing:border-box}
        input,textarea,select{font-family:${ff}}
        input::placeholder,textarea::placeholder{color:${th.text3}}
        input:focus,textarea:focus,select:focus{border-color:${a}70!important;box-shadow:0 0 0 3px ${a}12!important;outline:none}
        @keyframes lf-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .lf-in{animation:lf-up 0.45s cubic-bezier(0.22,1,0.36,1) both}
      `}}/>

      <div className="lf-in" style={{position:'relative',zIndex:1,width:'100%',maxWidth:420,textAlign:layout==='left'?(isAr?'right':'left'):'center'}}>

        {/* Logo / avatar */}
        <div style={{marginBottom:24}}>
          {workspace.lead_page_logo_url
            ?<img src={workspace.lead_page_logo_url} alt={brandName||'logo'} style={{width:64,height:64,borderRadius:16,objectFit:'cover',display:layout==='left'?'block':'inline-block',marginBottom:16,border:`1px solid ${th.border}`}}/>
            :<div style={{width:64,height:64,borderRadius:18,background:`${a}20`,border:`1px solid ${a}35`,display:'flex',alignItems:'center',justifyContent:'center',margin:layout==='left'?'0 auto 16px':'0 auto 16px',fontSize:24,fontWeight:700,color:a}}>
              {initial}
            </div>
          }
          <h1 style={{fontSize:24,fontWeight:700,color:th.text1,letterSpacing:isAr?0:'-0.03em',marginBottom:8,lineHeight:1.3,fontFamily:ff}}>{headline}</h1>
          <p style={{fontSize:14,color:th.text2,lineHeight:1.75,fontFamily:ff}}>{subline}</p>
        </div>

        {/* Form card */}
        <div style={{background:th.surface,border:`1px solid ${th.border}`,borderRadius:18,padding:'28px 24px',position:'relative',overflow:'hidden',boxShadow:`0 24px 64px rgba(0,0,0,0.3),0 0 0 1px ${a}08`}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${a}60,transparent)`}}/>

          {submitted?(
            <div style={{textAlign:'center',padding:'24px 0'}}>
              <div style={{width:56,height:56,borderRadius:'50%',background:'rgba(34,197,94,0.12)',border:'1px solid rgba(34,197,94,0.30)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div style={{fontSize:22,fontWeight:700,color:th.text1,marginBottom:8,letterSpacing:isAr?0:'-0.03em',fontFamily:ff}}>
                {isAr ? 'تمّ! أنت الآن داخل.' : "You're in."}
              </div>
              <div style={{fontSize:14,color:th.text2,lineHeight:1.7,marginBottom:magnetUrl?20:0,fontFamily:ff}}>
                {isAr ? `سيتواصل معك ${brandName} قريباً.` : `Expect to hear from ${brandName} soon.`}
              </div>
              {magnetUrl&&(
                <a href={magnetUrl} target="_blank" rel="noreferrer"
                  style={{display:'inline-flex',alignItems:'center',gap:9,padding:'12px 24px',background:a,color:isLight?'#fff':'#000',borderRadius:10,textDecoration:'none',fontWeight:700,fontSize:14,marginTop:4,fontFamily:ff}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  {workspace.lead_magnet_label||(isAr ? 'حمّل موردك المجاني' : 'Download your resource')}
                </a>
              )}
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {fields.map(field=>(
                <div key={field.id}>
                  {field.type!=='checkbox'&&(
                    <div style={{fontSize:11,fontWeight:600,letterSpacing:isAr?0:'0.06em',textTransform:'uppercase' as const,color:th.text3,marginBottom:7,lineHeight:1.3,textAlign:isAr?'right':'left',fontFamily:ff}}>
                      {field.label}{field.required&&<span style={{color:a,[isAr?'marginRight':'marginLeft']:3}}>*</span>}
                    </div>
                  )}
                  {renderField(field)}
                </div>
              ))}

              {workspace.lead_magnet_enabled&&workspace.lead_magnet_url&&(
                <div style={{padding:'10px 14px',background:`${a}10`,border:`1px solid ${a}25`,borderRadius:9,display:'flex',alignItems:'center',gap:9,flexDirection:isAr?'row-reverse':'row'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={a} strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  <span style={{fontSize:12,fontWeight:600,color:a,fontFamily:ff}}>
                    {workspace.lead_magnet_label||(isAr ? 'مورد مجاني بعد الإرسال' : 'Free resource unlocked after submission')}
                  </span>
                </div>
              )}

              {error&&<div style={{fontSize:12,color:'#EF4444',padding:'9px 12px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.18)',borderRadius:8,fontFamily:ff,textAlign:isAr?'right':'left'}}>{error}</div>}

              <button onClick={handleSubmit} disabled={submitting}
                style={{width:'100%',padding:'13px',background:btnBg,color:btnColor,border:btnBorder,borderRadius:10,fontFamily:ff,fontSize:14,fontWeight:700,cursor:'pointer',transition:'all 0.18s',letterSpacing:isAr?0:'-0.01em',boxShadow:workspace.lead_page_button_style==='filled'?`0 4px 18px ${a}35`:'none'}}>
                {submitting?(isAr?'...جارٍ الإرسال':'Submitting…'):cta}
              </button>
            </div>
          )}
        </div>

        {showPwr&&(
          <div style={{textAlign:'center',marginTop:18,fontSize:11,color:th.text3,fontFamily:ff}}>
            {isAr?'مدعوم بـ ':'Powered by '}
            <a href="https://nexaa.cc" style={{color:a,textDecoration:'none',fontWeight:600,opacity:0.8}}>nexaa.cc</a>
          </div>
        )}
      </div>
    </div>
  )
}
