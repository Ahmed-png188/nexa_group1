'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const DISPLAY = "'Bricolage Grotesque', sans-serif"
const SERIF   = "'Instrument Serif', serif"
const MONO    = "'Geist Mono', monospace"
const SANS    = "'DM Sans', sans-serif"
const AR      = "'Tajawal', system-ui, sans-serif"
const CYAN    = '#00AAFF'
const LINE    = 'rgba(255,255,255,0.07)'
const LINE2   = 'rgba(255,255,255,0.12)'
const T1 = '#FFFFFF'
const T2 = 'rgba(255,255,255,0.65)'
const T3 = 'rgba(255,255,255,0.35)'
const T4 = 'rgba(255,255,255,0.18)'

const PILLARS_EN = [
  { num:'01', title:'Brand Brain', body:'Voice modeling that learns from your actual writing. Not prompts — your real content, your real personality.' },
  { num:'02', title:'Studio', body:'Text, images, video, and voice — all generated in your brand style, ready to publish without leaving the platform.' },
  { num:'03', title:'Strategy & Schedule', body:'A complete 30-day plan with topics, formats, and timing. Connects directly to Instagram, LinkedIn, X, and TikTok.' },
  { num:'04', title:'Automate', body:'Email sequences that convert. Agents that post, monitor, and report. Marketing that runs without you.' },
  { num:'05', title:'Amplify', body:'Turn your best content into Meta ads in one click. AI-written copy, AI creatives, direct publishing.' },
  { num:'06', title:'Insights', body:'All your performance data in one place. Explained by AI so you know exactly what to do next week.' },
]
const PILLARS_AR = [
  { num:'٠١', title:'Brand Brain', body:'نموذج صوتي يتعلم من كتاباتك الفعلية — مو من بروبتات، من محتواك الحقيقي وشخصيتك الأصيلة.' },
  { num:'٠٢', title:'الاستوديو', body:'نصوص، صور، فيديو، وصوت — كلها تخرج بأسلوب علامتك، جاهزة للنشر بدون ما تغادر المنصة.' },
  { num:'٠٣', title:'الاستراتيجية والجدول', body:'خطة ٣٠ يوم كاملة بالمواضيع والأشكال والتوقيت. متصلة مباشرة بـ Instagram وLinkedIn وX وTikTok.' },
  { num:'٠٤', title:'الأتمتة', body:'سيكوانسات إيميل تحوّل. وكلاء ينشرون، يراقبون، ويرفعون تقارير. تسويق يشتغل حتى وأنت نايم.' },
  { num:'٠٥', title:'Amplify', body:'حوّل أفضل محتواك لإعلانات Meta بنقرة واحدة. كوبي بالذكاء الاصطناعي، كريتيف بالذكاء الاصطناعي، نشر مباشر.' },
  { num:'٠٦', title:'الإنسايتس', body:'كل بيانات أدائك في مكان واحد. مشروحة بالذكاء الاصطناعي عشان تعرف بالضبط إيش تسوي الأسبوع الجاي.' },
]
const VALUES_EN = [
  { principle:'No hype.', detail:'We do not promise things AI cannot deliver. Voice matching is real, but it takes training. Automation is real, but results take time. We are honest about what works and when.' },
  { principle:'No jargon.', detail:'Marketing psychology is powerful. But it only works when people understand it. Everything on Nexa — every interface, every explanation, every output — is written in plain English.' },
  { principle:'Your voice, always.', detail:'Every generation uses your Brand Brain. We do not have a "Nexa voice" that bleeds into your content. What comes out should be unmistakably you.' },
  { principle:'Consistency over virality.', detail:'We are not building a viral content machine. We are building a system for showing up every day, for years. That is how authority is built.' },
  { principle:'Built for builders.', detail:'Nexa is designed for people who are serious about their business and their brand. Not beginners looking for shortcuts — operators looking for leverage.' },
]
const VALUES_AR = [
  { principle:'بلا مبالغة.', detail:'ما نَعِد بشي الذكاء الاصطناعي ما يقدر يوفّره. مطابقة الصوت حقيقية، لكن تحتاج تدريباً. الأتمتة حقيقية، لكن النتائج تأخذ وقتها. نحن صادقين في إيش يشتغل ومتى.' },
  { principle:'بلا تعقيد.', detail:'علم نفس التسويق قوي، لكنه يشتغل بس لما الناس تفهمه. كل شي في Nexa — كل واجهة، كل شرح، كل إخراج — مكتوب بلغة واضحة وبسيطة.' },
  { principle:'صوتك دايماً.', detail:'كل إنتاج يستخدم Brand Brain الخاص فيك. ما عندنا "صوت Nexa" يتسرب لمحتواك. اللي يطلع من المنصة لازم يكون أنت بالضبط.' },
  { principle:'الاتساق فوق الفيرالية.', detail:'ما نبني آلة محتوى فيرال. نبني نظام للظهور كل يوم، لسنوات. هكذا تُبنى السلطة.' },
  { principle:'للجادّين بشغلهم.', detail:'Nexa مصممة للي يأخذ بيزنسه وعلامته التجارية بجدية. مو للمبتدئين اللي يدورون اختصارات — للعقول اللي تدور رافعة.' },
]

export default function AboutPage() {
  const [isAr, setIsAr] = useState(false)

  useEffect(() => {
    try { setIsAr(localStorage.getItem('nexa_lang') === 'ar') } catch {}
  }, [])

  const F   = isAr ? AR : SANS
  const H   = isAr ? AR : DISPLAY
  const dir = isAr ? 'rtl' : 'ltr'

  function toggleLang() {
    const next = isAr ? 'en' : 'ar'
    try { localStorage.setItem('nexa_lang', next) } catch {}
    setIsAr(!isAr)
  }

  const pillars = isAr ? PILLARS_AR : PILLARS_EN
  const values  = isAr ? VALUES_AR  : VALUES_EN

  return (
    <div dir={dir} style={{ background:'#080808', color:T1, fontFamily:F, minHeight:'100vh', overflowX:'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html:`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=DM+Sans:wght@300;400;500;600&family=Instrument+Serif:ital@1&family=Geist+Mono:wght@300;400;500&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes orb-a{0%,100%{transform:translate(0,0)}50%{transform:translate(8%,-10%)}}
        @keyframes orb-b{0%,100%{transform:translate(0,0)}50%{transform:translate(-6%,8%)}}
        .fade-1{animation:fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both}
        .fade-2{animation:fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.25s both}
        .fade-3{animation:fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.4s both}
        .lang-btn{background:none;border:0.5px solid rgba(255,255,255,0.12);border-radius:6px;color:rgba(255,255,255,0.40);font-size:13px;padding:5px 12px;cursor:pointer;transition:color 0.2s,border-color 0.2s}
        .lang-btn:hover{color:rgba(255,255,255,0.85);border-color:rgba(255,255,255,0.28)}
        @media(max-width:640px){.about-pad{padding:60px 24px 60px!important}.about-grid{grid-template-columns:1fr!important}}
      `}}/>

      <div style={{position:'fixed',inset:0,zIndex:0,overflow:'hidden',pointerEvents:'none'}}>
        <div style={{position:'absolute',top:'-15%',right:'-10%',width:'55vw',height:'55vw',borderRadius:'50%',background:'radial-gradient(ellipse,rgba(0,170,255,0.08) 0%,transparent 65%)',animation:'orb-a 14s ease infinite',filter:'blur(60px)'}}/>
        <div style={{position:'absolute',bottom:'-10%',left:'-5%',width:'45vw',height:'45vw',borderRadius:'50%',background:'radial-gradient(ellipse,rgba(0,110,255,0.06) 0%,transparent 65%)',animation:'orb-b 18s ease infinite',filter:'blur(70px)'}}/>
      </div>

      <nav style={{position:'sticky',top:0,zIndex:100,background:'rgba(8,8,8,0.92)',backdropFilter:'blur(24px)',borderBottom:`1px solid ${LINE}`,padding:'0 40px',height:60,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <Link href="/landing" style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none'}}>
          <Image src="/favicon.png" alt="Nexa" width={22} height={22} style={{borderRadius:6}}/>
          <span style={{fontFamily:H,fontWeight:800,fontSize:16,color:T1,letterSpacing:isAr?0:'-0.03em'}}>Nexa</span>
        </Link>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <button onClick={toggleLang} className="lang-btn" style={{fontFamily:isAr?SANS:AR,letterSpacing:isAr?'0.04em':0}}>
            {isAr?'English':'عربي'}
          </button>
          <Link href="/auth/login" style={{padding:'7px 14px',borderRadius:8,border:`1px solid ${LINE2}`,background:'none',color:T2,fontSize:13,fontFamily:F,textDecoration:'none'}}>
            {isAr?'دخول':'Sign in'}
          </Link>
          <Link href="/auth/signup" style={{padding:'7px 18px',borderRadius:8,background:CYAN,color:'#000',fontSize:13,fontWeight:700,fontFamily:H,textDecoration:'none',letterSpacing:isAr?0:'-0.02em'}}>
            {isAr?'ابدأ مجاناً ←':'Start free →'}
          </Link>
        </div>
      </nav>

      <div style={{position:'relative',zIndex:1}}>
        {/* Hero */}
        <div className="about-pad" style={{maxWidth:820,margin:'0 auto',padding:'100px 40px 80px'}}>
          <div className="fade-1" style={{fontSize:11,fontFamily:MONO,color:T4,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:24}}>
            {isAr?'عن Nexa':'About Nexa'}
          </div>
          <h1 className="fade-2" style={{fontFamily:H,fontWeight:800,fontSize:'clamp(44px,7vw,88px)',letterSpacing:isAr?0:'-0.05em',color:T1,lineHeight:isAr?1.2:0.90,marginBottom:40}}>
            {isAr
              ? <>{`بُنيت لصاحب`}<br/>{`العمل الذي`}<br/><span style={{background:`linear-gradient(135deg,#fff 0%,${CYAN} 60%,#fff 100%)`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>يتولى كل شيء.</span></>
              : <>Built for the<br/>business owner<br/><span style={{background:`linear-gradient(135deg,#fff 0%,${CYAN} 60%,#fff 100%)`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',backgroundSize:'200%'}}>who does it all.</span></>
            }
          </h1>
          <p className="fade-3" style={{fontFamily:isAr?AR:SERIF,fontStyle:isAr?'normal':'italic',fontSize:'clamp(17px,2.5vw,22px)',color:T3,lineHeight:1.75,maxWidth:620}}>
            {isAr
              ?'Nexa هي المنصة اللي كنّا نتمنى وجودها لما بدأنا — منصة تتعلم مين أنت، تحكي بصوتك، وتسوي الشغل الذي ما يصير ينجز.'
              :'Nexa is the platform we wish existed when we started — one that learns who you are, speaks in your voice, and does the work that never gets done.'
            }
          </p>
        </div>

        <div className="about-pad" style={{maxWidth:820,margin:'0 auto',padding:'0 40px 80px'}}>
          <div style={{height:1,background:`linear-gradient(90deg,transparent,rgba(0,170,255,0.3),transparent)`,marginBottom:80}}/>

          <div style={{fontSize:10,fontFamily:MONO,color:CYAN,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:24,opacity:0.7}}>
            {isAr?'المنتج':'The product'}
          </div>
          <h2 style={{fontFamily:H,fontWeight:800,fontSize:'clamp(28px,4vw,44px)',letterSpacing:isAr?0:'-0.04em',color:T1,lineHeight:isAr?1.3:1.05,marginBottom:28}}>
            {isAr?'إيش هي Nexa فعلاً':'What Nexa actually is'}
          </h2>

          {isAr?<>
            <p style={{fontSize:16,color:T2,lineHeight:1.9,fontFamily:AR,marginBottom:24}}>Nexa مو أداة محتوى. أدوات المحتوى تنتج كلام عام يشبه كل أحد. تنتهي تقضي وقت أكثر في التعديل مما وفّرته.</p>
            <p style={{fontSize:16,color:T2,lineHeight:1.9,fontFamily:AR,marginBottom:24}}>Nexa نظام ذكاء علامة تجارية. تبدأ ببناء نموذج عميق عنك — صوتك، نبرتك، مفرداتك، آراءك، جمهورك، عروضك. نسميه Brand Brain. لما يتدرّب، يصير الأساس لكل شيء: كل منشور، كل إيميل، كل إعلان، كل استراتيجية.</p>
            <p style={{fontSize:16,color:T2,lineHeight:1.9,fontFamily:AR,marginBottom:40}}>النتيجة محتوى يبدو كأنك كتبته في أفضل يوم عندك — مو روبوت يقلّد أسلوبك.</p>
          </>:<>
            <p style={{fontSize:16,color:T2,lineHeight:1.85,fontFamily:SANS,marginBottom:24}}>Nexa is not a content tool. Content tools generate generic output that sounds like everyone else. You end up spending more time editing than you saved.</p>
            <p style={{fontSize:16,color:T2,lineHeight:1.85,fontFamily:SANS,marginBottom:24}}>Nexa is a brand intelligence system. It starts by building a deep model of who you are — your voice, your tone, your vocabulary, your opinions, your audience, your offers. We call it Brand Brain. Once trained, Brand Brain becomes the foundation for everything: every post, every email, every ad, every strategy.</p>
            <p style={{fontSize:16,color:T2,lineHeight:1.85,fontFamily:SANS,marginBottom:40}}>The result is content that sounds like you wrote it on your best day — not like a robot approximating your style.</p>
          </>}

          <div className="about-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:60}}>
            {pillars.map(({num,title,body})=>(
              <div key={num} style={{padding:'22px 20px',background:'rgba(255,255,255,0.02)',border:`1px solid ${LINE}`,borderRadius:12}}>
                <div style={{fontFamily:MONO,fontSize:11,color:T4,marginBottom:10}}>{num}</div>
                <div style={{fontFamily:H,fontWeight:800,fontSize:16,color:T1,letterSpacing:isAr?0:'-0.02em',marginBottom:8}}>{title}</div>
                <p style={{fontSize:13,color:T3,lineHeight:1.7,fontFamily:F}}>{body}</p>
              </div>
            ))}
          </div>

          <div style={{height:1,background:`linear-gradient(90deg,transparent,rgba(0,170,255,0.3),transparent)`,marginBottom:80}}/>

          <div style={{fontSize:10,fontFamily:MONO,color:CYAN,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:24,opacity:0.7}}>
            {isAr?'المؤسس':'The founder'}
          </div>
          <h2 style={{fontFamily:H,fontWeight:800,fontSize:'clamp(28px,4vw,44px)',letterSpacing:isAr?0:'-0.04em',color:T1,lineHeight:isAr?1.3:1.05,marginBottom:32}}>
            {isAr?<>بناها شخص عاش<br/>المشكلة بنفسه.</>:<>Built by someone who<br/>lived the problem.</>}
          </h2>

          <div style={{display:'flex',alignItems:'flex-start',gap:20,marginBottom:40,padding:'24px',background:'rgba(0,170,255,0.04)',border:`1px solid rgba(0,170,255,0.15)`,borderRadius:14,borderLeft:isAr?'none':`3px solid ${CYAN}`,borderRight:isAr?`3px solid ${CYAN}`:'none'}}>
            <div style={{width:52,height:52,borderRadius:14,background:`rgba(0,170,255,0.12)`,border:`1px solid rgba(0,170,255,0.25)`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:H,fontWeight:800,fontSize:18,color:CYAN,flexShrink:0}}>A</div>
            <div>
              <div style={{fontFamily:H,fontWeight:800,fontSize:17,color:T1,letterSpacing:isAr?0:'-0.02em',marginBottom:2}}>Ahmed Adil</div>
              <div style={{fontSize:12,color:T4,fontFamily:MONO,marginBottom:4}}>{isAr?'خبير علم نفس التسويق · دبي، الإمارات':'Marketing Psychologist · Dubai, UAE'}</div>
              <div style={{fontSize:12,color:T3,fontFamily:F}}>{isAr?'المؤسس، Nexa':'Founder, Nexa'}</div>
            </div>
          </div>

          {isAr?<>
            <p style={{fontSize:16,color:T2,lineHeight:1.9,fontFamily:AR,marginBottom:24}}>أنا مو متخصص تسويق تعلّم علم النفس. أنا متخصص علم نفس فهم الأسواق.</p>
            <p style={{fontSize:16,color:T2,lineHeight:1.9,fontFamily:AR,marginBottom:24}}>لسنوات اشتغلت على تقاطع سلوك الإنسان واستراتيجية الأعمال — أدرس ليش الناس تشتري، إيش يبني ثقة العلامة، وكيف التواصل المتسق يبني سلطة مع الوقت. العلم كان واضحاً. التنفيذ كان المشكلة.</p>
            <p style={{fontSize:16,color:T2,lineHeight:1.9,fontFamily:AR,marginBottom:24}}>كل صاحب عمل اشتغلت معه كان يعرف المحتوى مهم. عنده المعرفة. عنده آراء تستحق تتشارك. لكن المحتوى كان يخسر دايماً لشغل العملاء والعمليات والحياة. ولما وجدوا وقت، الأدوات العامة تنتج إخراجاً عاماً يحتاج تعديلاً ثقيلاً.</p>
            <p style={{fontSize:16,color:T2,lineHeight:1.9,fontFamily:AR,marginBottom:24}}>عشت هذا أنا أيضاً. وأنا أبني علامتي الشخصية كخبير علم نفس تسويق، وجدت نفسي في نفس الفخ: أعرف بالضبط إيش يحتاج يسمعه جمهوري، لكن ما عندي النظام لأقوله باتساق.</p>
          </>:<>
            <p style={{fontSize:16,color:T2,lineHeight:1.85,fontFamily:SANS,marginBottom:24}}>I am not a marketer who learned psychology. I am a psychologist who understood markets.</p>
            <p style={{fontSize:16,color:T2,lineHeight:1.85,fontFamily:SANS,marginBottom:24}}>For years I worked at the intersection of human behavior and business strategy — studying why people buy, what makes a brand trusted, and how consistent communication builds authority over time. The science was clear. The execution was the problem.</p>
            <p style={{fontSize:16,color:T2,lineHeight:1.85,fontFamily:SANS,marginBottom:24}}>Every entrepreneur I worked with understood content was important. They had the knowledge. They had opinions worth sharing. But content kept losing to everything else — client work, operations, life. And when they did find time, generic AI tools would produce generic output that needed heavy editing to become usable.</p>
            <p style={{fontSize:16,color:T2,lineHeight:1.85,fontFamily:SANS,marginBottom:24}}>I lived this too. Building my personal brand as a marketing psychologist, I found myself in the same trap: knowing exactly what my audience needed to hear, but never having the system to say it consistently.</p>
          </>}

          <div style={{margin:'40px 0',padding:'28px 32px',position:'relative'}}>
            <div style={{position:'absolute',top:0,[isAr?'right':'left']:0,width:3,height:'100%',background:`linear-gradient(to bottom,${CYAN},transparent)`}}/>
            <p style={{fontFamily:isAr?AR:SERIF,fontStyle:isAr?'normal':'italic',fontSize:'clamp(17px,2.5vw,22px)',color:T1,lineHeight:1.7}}>
              {isAr
                ?"«الشركات اللي تظهر باستمرار — بصوت واضح، للجمهور الصح — تنجح. مو لأنها تشتغل أكثر. لأنها فهمت النظام وبنته.»"
                :'"The businesses that show up consistently — with a clear voice, for the right audience — win. Not because they work harder. Because they understood the system and built one."'
              }
            </p>
          </div>

          {isAr?<>
            <p style={{fontSize:16,color:T2,lineHeight:1.9,fontFamily:AR,marginBottom:24}}>Nexa هو ذلك النظام. مبني على مبدأ أن محتواك يشتغل بنفس قوتك — ويبدو مثلك بالضبط. بلا مبالغة. بلا جرجون. تفكير واضح، يتسلّم باتساق.</p>
            <p style={{fontSize:16,color:T2,lineHeight:1.9,fontFamily:AR,marginBottom:40}}>بنيت Nexa للمؤسس الذي يبني بشفافية. للاستشاري الذي يستحق ٥٠ ألف متابع لكن ما وصل. لصاحب الوكالة العبقري في شغل العملاء لكن ما عنده نظام لتسويق نفسه. للناس اللي أقوى من أن يظلوا غير مرئيين.</p>
          </>:<>
            <p style={{fontSize:16,color:T2,lineHeight:1.85,fontFamily:SANS,marginBottom:24}}>Nexa is that system. Built on the principle that your content should work as hard as you do — and it should sound exactly like you while doing it. Not hype. Not jargon. Just clear thinking, delivered consistently.</p>
            <p style={{fontSize:16,color:T2,lineHeight:1.85,fontFamily:SANS,marginBottom:40}}>I built Nexa for the founder building in public. The consultant who should have 50,000 followers but does not. The agency owner who is brilliant at client work but has no system for their own marketing. People who are too good at what they do to be this invisible.</p>
          </>}

          <div style={{height:1,background:`linear-gradient(90deg,transparent,rgba(0,170,255,0.3),transparent)`,marginBottom:80}}/>

          <div style={{fontSize:10,fontFamily:MONO,color:CYAN,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:24,opacity:0.7}}>
            {isAr?'ما نؤمن به':'What we believe'}
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:0}}>
            {values.map(({principle,detail},i)=>(
              <div key={i} style={{padding:'24px 0',borderBottom:i<values.length-1?`1px solid ${LINE}`:'none',display:'flex',gap:20,flexDirection:isAr?'row-reverse':'row'}}>
                <div style={{fontFamily:H,fontWeight:800,fontSize:16,color:T1,letterSpacing:isAr?0:'-0.02em',minWidth:isAr?130:160,flexShrink:0,paddingTop:2,textAlign:isAr?'right':'left'}}>{principle}</div>
                <p style={{fontSize:14,color:T3,lineHeight:1.8,fontFamily:F,textAlign:isAr?'right':'left'}}>{detail}</p>
              </div>
            ))}
          </div>

          <div style={{height:1,background:`linear-gradient(90deg,transparent,rgba(0,170,255,0.3),transparent)`,margin:'80px 0 60px'}}/>

          <div style={{textAlign:'center'}}>
            <h2 style={{fontFamily:H,fontWeight:800,fontSize:'clamp(32px,5vw,56px)',letterSpacing:isAr?0:'-0.04em',color:T1,lineHeight:isAr?1.3:1,marginBottom:16}}>
              {isAr?<>إذا هذا يلامس شيئاً فيك —<br/>أنت من بنينا هذا من أجله.</>:<>If this resonates —<br/>you are who we built this for.</>}
            </h2>
            <p style={{fontFamily:isAr?AR:SERIF,fontStyle:isAr?'normal':'italic',fontSize:18,color:T3,marginBottom:36}}>
              {isAr?'ابدأ بـ ١٥٠ رصيد مجاناً. بدون بطاقة.':'Start with 150 free credits. No credit card.'}
            </p>
            <Link href="/auth/signup" style={{display:'inline-block',padding:'16px 40px',borderRadius:12,background:CYAN,color:'#000',fontSize:15,fontWeight:800,fontFamily:H,textDecoration:'none',letterSpacing:isAr?0:'-0.03em'}}>
              {isAr?'ابدأ الآن ←':'Start building →'}
            </Link>
            <p style={{fontSize:12,color:T4,fontFamily:MONO,marginTop:14}}>
              {isAr?<>تواصل معنا على <a href="mailto:hello@nexaa.cc" style={{color:T4,textDecoration:'none'}}>hello@nexaa.cc</a></>:<>Or reach us at <a href="mailto:hello@nexaa.cc" style={{color:T4,textDecoration:'none'}}>hello@nexaa.cc</a></>}
            </p>
          </div>
        </div>

        <footer style={{borderTop:`1px solid ${LINE}`,padding:'28px 40px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
          <Link href="/landing" style={{fontSize:13,fontFamily:MONO,color:T4,textDecoration:'none'}}>
            {isAr?'→ العودة لـ Nexa':'← Back to Nexa'}
          </Link>
          <span style={{fontSize:12,color:T4,fontFamily:MONO}}>© 2026 Nexa · Dubai, UAE</span>
          <div style={{display:'flex',gap:20}}>
            <Link href="/landing/pricing" style={{fontSize:12,color:T4,fontFamily:MONO,textDecoration:'none'}}>{isAr?'الأسعار':'Pricing'}</Link>
            <Link href="/landing/terms" style={{fontSize:12,color:T4,fontFamily:MONO,textDecoration:'none'}}>{isAr?'شروط الخدمة':'Terms'}</Link>
            <Link href="/landing/privacy" style={{fontSize:12,color:T4,fontFamily:MONO,textDecoration:'none'}}>{isAr?'سياسة الخصوصية':'Privacy'}</Link>
          </div>
        </footer>
      </div>
    </div>
  )
}
