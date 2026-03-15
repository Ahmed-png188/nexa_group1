'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type Tab = 'overview'|'voice'|'audience'|'visual'|'assets'

const Ic = {
  bolt:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  upload:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  refresh: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  trash:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  star:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  check:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  arrow:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  file:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
}

const TABS = [
  { id:'overview' as Tab, label:'Overview',    color:'#4D9FFF' },
  { id:'voice'    as Tab, label:'Voice',       color:'#A78BFA' },
  { id:'audience' as Tab, label:'Audience',    color:'#34D399' },
  { id:'visual'   as Tab, label:'Visual',      color:'#FF7A40' },
  { id:'assets'   as Tab, label:'Assets',      color:'#FFB547' },
]

const ASSET_TYPES = ['logo','sample_post','product_photo','brand_doc','other'] as const

function InfoRow({ label, value }: { label:string; value?:string }) {
  if (!value) return null
  return (
    <div style={{ padding:'12px 14px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,borderLeft:'2px solid rgba(167,139,250,0.4)' }}>
      <div style={{ fontSize:9,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',color:'rgba(255,255,255,0.28)',marginBottom:5 }}>{label}</div>
      <div style={{ fontSize:13,color:'rgba(255,255,255,0.68)',lineHeight:1.65 }}>{value}</div>
    </div>
  )
}

function ScoreBar({ label, score, color }: { label:string; score:number; color:string }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
        <span style={{ fontSize:12,color:'rgba(255,255,255,0.55)' }}>{label}</span>
        <span style={{ fontSize:12,fontWeight:700,color:'rgba(255,255,255,0.8)' }}>{score}%</span>
      </div>
      <div style={{ height:3,background:'rgba(255,255,255,0.06)',borderRadius:3,overflow:'hidden' }}>
        <div style={{ height:'100%',width:`${score}%`,background:color,borderRadius:3,transition:'width 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}/>
      </div>
    </div>
  )
}

export default function BrandPage() {
  const supabase  = createClient()
  const fileRef   = useRef<HTMLInputElement>(null)

  const [ws,         setWs]        = useState<any>(null)
  const [tab,        setTab]       = useState<Tab>('overview')
  const [profile,    setProfile]   = useState<any>(null)
  const [learnings,  setLearnings] = useState<any[]>([])
  const [assets,     setAssets]    = useState<any[]>([])
  const [loading,    setLoading]   = useState(true)
  const [analyzing,  setAnalyzing] = useState(false)
  const [uploading,  setUploading] = useState(false)
  const [assetType,  setAssetType] = useState<string>('logo')
  const [dragOver,   setDragOver]  = useState(false)
  const [toast,      setToast]     = useState<{msg:string;type:'success'|'error'}|null>(null)

  function showToast(msg:string, type:'success'|'error'='success') { setToast({msg,type}); setTimeout(()=>setToast(null),4000) }

  useEffect(() => { load() }, [])

  async function load() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return
    const { data:m } = await supabase.from('workspace_members').select('workspace_id, workspaces(*)').eq('user_id',user.id).limit(1).single()
    const w = (m as any)?.workspaces; setWs(w)
    const [{ data:ba }, { data:lg }, { data:aa }] = await Promise.all([
      supabase.from('brand_assets').select('analysis').eq('workspace_id',w?.id).eq('file_name','nexa_brand_intelligence.json').single(),
      supabase.from('brand_learnings').select('*').eq('workspace_id',w?.id).order('created_at',{ascending:false}).limit(20),
      supabase.from('brand_assets').select('*').eq('workspace_id',w?.id).neq('file_name','nexa_brand_intelligence.json').order('created_at',{ascending:false}),
    ])
    if (ba?.analysis) setProfile(ba.analysis)
    setLearnings(lg??[]); setAssets(aa??[]); setLoading(false)
  }

  async function analyze() {
    if (!ws||analyzing) return; setAnalyzing(true)
    try {
      const r = await fetch('/api/analyze-brand',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspace_id:ws.id})})
      const d = await r.json()
      if (d.success){setProfile(d.profile);showToast('Brand Brain updated')}
      else showToast(d.error||'Failed','error')
    } catch { showToast('Error','error') }
    setAnalyzing(false)
  }

  async function uploadAsset(file:File) {
    if (!ws||uploading) return; setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path= `${ws.id}/${assetType}/${Date.now()}.${ext}`
      const { error:upErr } = await supabase.storage.from('brand-assets').upload(path,file)
      if (upErr) { showToast('Upload failed','error'); return }
      const { data:{ publicUrl } } = supabase.storage.from('brand-assets').getPublicUrl(path)
      await supabase.from('brand_assets').insert({ workspace_id:ws.id, file_name:file.name, file_type:assetType, file_url:publicUrl, file_size:file.size })
      showToast('Asset uploaded'); load()
    } catch { showToast('Error','error') }
    setUploading(false)
  }

  async function deleteAsset(id:string) {
    await supabase.from('brand_assets').delete().eq('id',id)
    showToast('Deleted'); load()
  }

  const voice  = profile?.voice_profile||{}
  const aud    = profile?.audience_profile||{}
  const visual = profile?.visual_identity||{}
  const scores = profile?.brand_scores||{}

  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'rgba(255,255,255,0.3)',fontSize:13 }}>Loading Brand Brain…</div>

  return (
    <>
      <style>{`@keyframes brandUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes brandSpin{to{transform:rotate(360deg)}}.btab:hover{background:rgba(255,255,255,0.05)!important;}.a-card:hover{border-color:rgba(255,255,255,0.13)!important;background:rgba(255,255,255,0.05)!important;}.l-row:hover{background:rgba(255,255,255,0.04)!important;}`}</style>

      <div style={{ padding:'24px 28px',overflowY:'auto',height:'calc(100vh - var(--topbar-h))' }}>

        {/* Header */}
        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:20,animation:'brandUp .4s ease both' }}>
          <div>
            <h1 style={{ fontFamily:'var(--display)',fontSize:22,fontWeight:800,letterSpacing:'-0.04em',color:'rgba(255,255,255,0.92)',lineHeight:1,marginBottom:4 }}>Brand Brain</h1>
            <p style={{ fontSize:12,color:'rgba(255,255,255,0.3)' }}>{assets.length} assets · {learnings.length} learnings · {profile?'Profile active':'No profile yet'}</p>
          </div>
          <button onClick={analyze} disabled={analyzing}
            style={{ display:'flex',alignItems:'center',gap:7,padding:'8px 16px',fontSize:13,fontWeight:700,background:analyzing?'rgba(255,255,255,0.04)':'#A78BFA',color:analyzing?'rgba(255,255,255,0.3)':'#000',border:'none',borderRadius:10,cursor:'pointer',fontFamily:'var(--sans)',boxShadow:analyzing?'none':'0 4px 16px rgba(167,139,250,0.3)',letterSpacing:'-0.01em',transition:'all .2s' }}>
            {analyzing?<><div style={{ width:13,height:13,border:'2px solid rgba(255,255,255,0.2)',borderTopColor:'rgba(255,255,255,0.6)',borderRadius:'50%',animation:'brandSpin .8s linear infinite' }}/>Analyzing…</>:<><span style={{ display:'flex' }}>{Ic.bolt}</span>Analyze brand</>}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex',gap:2,marginBottom:22,background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:4,animation:'brandUp .4s ease .05s both' }}>
          {TABS.map(t=>{
            const on=tab===t.id
            return (
              <button key={t.id} className="btab" onClick={()=>setTab(t.id)}
                style={{ flex:1,padding:'8px 4px',borderRadius:9,border:`1px solid ${on?`${t.color}28`:'transparent'}`,background:on?`${t.color}10`:'transparent',color:on?t.color:'rgba(255,255,255,0.32)',cursor:'pointer',fontSize:12,fontWeight:on?700:500,fontFamily:'var(--sans)',transition:'all .15s',whiteSpace:'nowrap' }}>
                {t.label}
              </button>
            )
          })}
        </div>

        {/* No profile state */}
        {!profile && tab!=='assets' && (
          <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'50vh',textAlign:'center',padding:'40px 20px',animation:'brandUp .3s ease both' }}>
            <div style={{ width:58,height:58,borderRadius:16,background:'rgba(167,139,250,0.07)',border:'1px solid rgba(167,139,250,0.18)',display:'flex',alignItems:'center',justifyContent:'center',color:'#A78BFA',marginBottom:20 }}>{Ic.star}</div>
            <h3 style={{ fontFamily:'var(--display)',fontSize:18,fontWeight:800,letterSpacing:'-0.03em',marginBottom:8,color:'rgba(255,255,255,0.88)' }}>Build your Brand Brain</h3>
            <p style={{ fontSize:13,color:'rgba(255,255,255,0.35)',lineHeight:1.7,maxWidth:420,marginBottom:22 }}>
              Upload assets — logos, sample posts, product photos, brand docs — then run an analysis. Nexa builds a deep profile that powers every generation.
            </p>
            <div style={{ display:'flex',gap:10 }}>
              <button onClick={()=>setTab('assets')} style={{ display:'flex',alignItems:'center',gap:7,padding:'11px 20px',fontSize:13,fontWeight:700,background:'rgba(167,139,250,0.1)',border:'1px solid rgba(167,139,250,0.25)',color:'#A78BFA',borderRadius:10,cursor:'pointer',fontFamily:'var(--sans)' }}>
                <span style={{ display:'flex' }}>{Ic.upload}</span>Upload assets
              </button>
              <button onClick={analyze} disabled={analyzing} style={{ display:'flex',alignItems:'center',gap:7,padding:'11px 20px',fontSize:13,fontWeight:700,background:'#A78BFA',color:'#000',border:'none',borderRadius:10,cursor:'pointer',fontFamily:'var(--sans)',boxShadow:'0 4px 16px rgba(167,139,250,0.3)' }}>
                <span style={{ display:'flex' }}>{Ic.bolt}</span>Analyze brand
              </button>
            </div>
          </div>
        )}

        {/* ── OVERVIEW ── */}
        {tab==='overview' && profile && (
          <div style={{ animation:'brandUp .3s ease both' }}>
            {/* Score bars */}
            <div style={{ padding:'18px 20px',background:'rgba(167,139,250,0.05)',border:'1px solid rgba(167,139,250,0.15)',borderRadius:14,marginBottom:16 }}>
              <div style={{ fontSize:9,fontWeight:700,color:'#A78BFA',letterSpacing:'.09em',textTransform:'uppercase',marginBottom:14 }}>Brand health scores</div>
              <ScoreBar label="Voice consistency"   score={scores.voice_match_score||profile.voice_match_score||88}  color="linear-gradient(90deg,#4D9FFF,#A78BFA)"/>
              <ScoreBar label="Audience alignment"  score={scores.audience_fit_score||profile.audience_fit_score||85} color="linear-gradient(90deg,#34D399,#4D9FFF)"/>
              <ScoreBar label="Visual coherence"    score={scores.visual_style_score||profile.visual_style_score||92} color="linear-gradient(90deg,#A78BFA,#FF7A40)"/>
            </div>

            {/* Summary */}
            {profile.brand_summary && (
              <div style={{ padding:'16px 18px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,marginBottom:16 }}>
                <div style={{ fontSize:9,fontWeight:700,letterSpacing:'.09em',textTransform:'uppercase',color:'rgba(255,255,255,0.28)',marginBottom:8 }}>Brand summary</div>
                <div style={{ fontSize:13,color:'rgba(255,255,255,0.65)',lineHeight:1.7 }}>{profile.brand_summary}</div>
              </div>
            )}

            {/* Recent learnings */}
            {learnings.length>0 && (
              <div>
                <div style={{ fontSize:9,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'rgba(255,255,255,0.25)',marginBottom:12 }}>Recent learnings</div>
                {learnings.slice(0,6).map(l=>(
                  <div key={l.id} className="l-row" style={{ display:'flex',gap:10,padding:'10px 12px',borderRadius:10,transition:'background .15s',marginBottom:4 }}>
                    <span style={{ fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:4,background:'rgba(255,107,43,0.08)',border:'1px solid rgba(255,107,43,0.18)',color:'#FF7A40',flexShrink:0,height:'fit-content',textTransform:'uppercase',letterSpacing:'.04em' }}>{l.insight_type||'insight'}</span>
                    <div style={{ fontSize:12,color:'rgba(255,255,255,0.55)',lineHeight:1.55 }}>{l.insight}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── VOICE ── */}
        {tab==='voice' && profile && (
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:10,animation:'brandUp .3s ease both' }}>
            <InfoRow label="Brand voice"       value={voice.tone||ws?.brand_voice}/>
            <InfoRow label="Writing style"     value={voice.style}/>
            <InfoRow label="Key phrases"       value={voice.key_phrases?.join(', ')}/>
            <InfoRow label="Topics to avoid"   value={voice.avoid?.join(', ')}/>
            <InfoRow label="Personality"       value={voice.personality}/>
            <InfoRow label="Content approach"  value={voice.content_approach}/>
            {!Object.keys(voice).length && !ws?.brand_voice && (
              <div style={{ gridColumn:'1/-1',textAlign:'center',padding:'32px',color:'rgba(255,255,255,0.25)',fontSize:13,border:'1px dashed rgba(255,255,255,0.07)',borderRadius:12 }}>
                Run a brand analysis to build your voice profile.
              </div>
            )}
          </div>
        )}

        {/* ── AUDIENCE ── */}
        {tab==='audience' && profile && (
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:10,animation:'brandUp .3s ease both' }}>
            <InfoRow label="Primary audience"    value={aud.primary||aud.demographics}/>
            <InfoRow label="Pain points"         value={aud.pain_points?.join(', ')||aud.pain_points}/>
            <InfoRow label="Goals & desires"     value={aud.goals?.join(', ')||aud.goals}/>
            <InfoRow label="Psychographics"      value={aud.psychographics}/>
            <InfoRow label="Platforms they use"  value={aud.platforms?.join(', ')}/>
            <InfoRow label="Content they love"   value={aud.content_preferences}/>
          </div>
        )}

        {/* ── VISUAL ── */}
        {tab==='visual' && profile && (
          <div style={{ animation:'brandUp .3s ease both' }}>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:10,marginBottom:16 }}>
              <InfoRow label="Color palette"   value={visual.colors?.join(', ')||visual.color_palette}/>
              <InfoRow label="Typography"      value={visual.typography||visual.fonts?.join(', ')}/>
              <InfoRow label="Visual style"    value={visual.style||visual.aesthetic}/>
              <InfoRow label="Image guidance"  value={visual.image_guidelines}/>
            </div>
            {assets.filter(a=>a.file_type==='logo'||a.file_type==='product_photo').length>0 && (
              <div>
                <div style={{ fontSize:9,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'rgba(255,255,255,0.25)',marginBottom:12 }}>Visual assets</div>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:8 }}>
                  {assets.filter(a=>a.file_type==='logo'||a.file_type==='product_photo').map(a=>(
                    <div key={a.id} style={{ borderRadius:10,overflow:'hidden',border:'1px solid rgba(255,255,255,0.08)',aspectRatio:'1',background:'rgba(255,255,255,0.03)' }}>
                      <img src={a.file_url} alt={a.file_name} style={{ width:'100%',height:'100%',objectFit:'cover',display:'block' }}/>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ASSETS ── */}
        {tab==='assets' && (
          <div style={{ animation:'brandUp .3s ease both' }}>
            {/* Upload area */}
            <div
              onDragOver={e=>{e.preventDefault();setDragOver(true)}}
              onDragLeave={()=>setDragOver(false)}
              onDrop={e=>{e.preventDefault();setDragOver(false);const f=e.dataTransfer.files[0];if(f)uploadAsset(f)}}
              onClick={()=>fileRef.current?.click()}
              style={{ padding:'32px',border:`1px dashed ${dragOver?'rgba(255,181,71,0.4)':'rgba(255,255,255,0.1)'}`,borderRadius:14,textAlign:'center',cursor:'pointer',background:dragOver?'rgba(255,181,71,0.04)':'rgba(255,255,255,0.02)',transition:'all .15s',marginBottom:20 }}>
              <div style={{ display:'flex',justifyContent:'center',marginBottom:12 }}>
                <div style={{ width:44,height:44,borderRadius:12,background:'rgba(255,181,71,0.08)',border:'1px solid rgba(255,181,71,0.2)',display:'flex',alignItems:'center',justifyContent:'center',color:'#FFB547' }}>{Ic.upload}</div>
              </div>
              <div style={{ fontSize:14,fontWeight:700,color:'rgba(255,255,255,0.75)',marginBottom:4,fontFamily:'var(--display)',letterSpacing:'-0.02em' }}>
                {uploading?'Uploading…':'Drop files or click to upload'}
              </div>
              <div style={{ fontSize:12,color:'rgba(255,255,255,0.35)' }}>Logos, posts, product photos, brand docs — anything that defines your brand</div>
              <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx,.txt" style={{ display:'none' }} onChange={e=>e.target.files?.[0]&&uploadAsset(e.target.files[0])}/>
            </div>

            {/* Asset type selector */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:9,fontWeight:700,letterSpacing:'.09em',textTransform:'uppercase',color:'rgba(255,255,255,0.28)',marginBottom:10 }}>Upload as</div>
              <div style={{ display:'flex',gap:5,flexWrap:'wrap' }}>
                {ASSET_TYPES.map(t=>(
                  <button key={t} onClick={()=>setAssetType(t)}
                    style={{ padding:'5px 13px',borderRadius:100,fontSize:12,fontWeight:600,background:assetType===t?'rgba(255,181,71,0.12)':'rgba(255,255,255,0.04)',border:`1px solid ${assetType===t?'rgba(255,181,71,0.3)':'rgba(255,255,255,0.08)'}`,color:assetType===t?'#FFB547':'rgba(255,255,255,0.4)',cursor:'pointer',fontFamily:'var(--sans)',transition:'all .15s',textTransform:'capitalize' }}>
                    {t.replace('_',' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Asset grid */}
            {assets.length>0 && (
              <div>
                <div style={{ fontSize:9,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'rgba(255,255,255,0.25)',marginBottom:12 }}>{assets.length} assets</div>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:8 }}>
                  {assets.map(a=>(
                    <div key={a.id} className="a-card" style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,overflow:'hidden',transition:'all .15s' }}>
                      {a.file_url&&(a.file_type==='logo'||a.file_type==='product_photo'||a.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) ? (
                        <div style={{ height:100,background:'rgba(255,255,255,0.04)',overflow:'hidden' }}>
                          <img src={a.file_url} alt={a.file_name} style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                        </div>
                      ) : (
                        <div style={{ height:60,background:'rgba(255,181,71,0.04)',display:'flex',alignItems:'center',justifyContent:'center',color:'#FFB547' }}>{Ic.file}</div>
                      )}
                      <div style={{ padding:'10px 12px',display:'flex',alignItems:'center',gap:8 }}>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.75)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{a.file_name}</div>
                          <div style={{ fontSize:10,color:'rgba(255,255,255,0.3)',marginTop:1,textTransform:'capitalize' }}>{a.file_type?.replace('_',' ')||'asset'}</div>
                        </div>
                        <button onClick={()=>deleteAsset(a.id)} style={{ width:26,height:26,borderRadius:6,background:'transparent',border:'1px solid rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.28)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all .15s' }}
                          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(255,87,87,0.3)';(e.currentTarget as HTMLElement).style.color='#FF5757'}}
                          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.07)';(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.28)'}}>
                          {Ic.trash}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {toast && (
        <div style={{ position:'fixed',bottom:24,right:24,zIndex:9999,padding:'12px 18px',borderRadius:11,background:toast.type==='error'?'rgba(255,87,87,0.12)':'rgba(52,211,153,0.1)',border:`1px solid ${toast.type==='error'?'rgba(255,87,87,0.3)':'rgba(52,211,153,0.25)'}`,color:toast.type==='error'?'#FF5757':'#34D399',fontSize:13,fontWeight:600,backdropFilter:'blur(16px)',boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
          {toast.msg}
        </div>
      )}
    </>
  )
}
