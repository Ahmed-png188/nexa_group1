'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const DISPLAY = "'Bricolage Grotesque', sans-serif"
const MONO    = "'Geist Mono', monospace"
const SANS    = "'DM Sans', sans-serif"
const AR      = "'Tajawal', system-ui, sans-serif"
const CYAN    = '#00AAFF'
const LINE    = 'rgba(255,255,255,0.07)'
const LINE2   = 'rgba(255,255,255,0.12)'
const T1 = '#FFFFFF'
const T2 = 'rgba(255,255,255,0.65)'
const T4 = 'rgba(255,255,255,0.18)'

const SECTIONS_EN = [
  { title:'1. Information We Collect', body:`We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.\n\nAccount information: Name, email address, password, and billing information.\n\nContent data: Any content you upload to train Brand Brain, including text, images, and documents.\n\nUsage data: How you interact with Nexa, including features used, content created, and session duration.\n\nDevice information: IP address, browser type, operating system, and device identifiers.` },
  { title:'2. How We Use Your Information', body:`We use the information we collect to:\n\n— Provide, maintain, and improve our services\n— Process transactions and send related information\n— Train your Brand Brain voice model (your data is used only for your workspace)\n— Send technical notices, updates, and support messages\n— Respond to your comments and questions\n— Monitor and analyze usage patterns to improve the product` },
  { title:'3. Data Storage and Security', body:`All data is encrypted at rest using AES-256 encryption and in transit using TLS 1.3. We store data on Supabase infrastructure hosted on AWS.\n\nWe implement industry-standard security measures including access controls, audit logging, and regular security reviews. However, no method of transmission over the internet is 100% secure.` },
  { title:'4. Your Brand Brain Data', body:`Your Brand Brain training data — including any content, documents, or materials you upload — belongs entirely to you. We use this data solely to power your workspace's voice model.\n\nWe do not use your content to train our general AI models. We do not sell or share your brand data with third parties. You can delete your Brand Brain data at any time from your workspace settings.` },
  { title:'5. Third-Party Services', body:`Nexa integrates with third-party services to provide its functionality. These include:\n\n— Anthropic (Claude AI): Used for content generation\n— Google (Veo): Used for video generation\n— ElevenLabs: Used for voice generation\n— Fal.ai: Used for image generation\n— Stripe: Used for payment processing. We do not store payment card data\n— Supabase: Used for database and storage\n\nEach third party has its own privacy policy governing your data within their systems.` },
  { title:'6. Sharing of Information', body:`We do not sell, trade, or rent your personal information to third parties. We may share information in the following circumstances:\n\n— With service providers who help us operate our business (under strict confidentiality agreements)\n— If required by law, regulation, or legal process\n— In connection with a merger or acquisition (you will be notified in advance)\n— With your explicit consent` },
  { title:'7. Data Retention', body:`We retain your account data for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where we are required to retain it by law.\n\nContent you have created may be retained in anonymized, aggregated form for analytics purposes.` },
  { title:'8. Your Rights', body:`You have the right to:\n\n— Access the personal data we hold about you\n— Correct inaccurate data\n— Request deletion of your data\n— Export your data in a portable format\n— Opt out of marketing communications at any time\n\nTo exercise any of these rights, contact us at hello@nexaa.cc.` },
  { title:'9. Cookies', body:`We use cookies and similar tracking technologies to maintain your session, remember your preferences, and analyze usage. You can control cookies through your browser settings. Disabling cookies may affect the functionality of the service.` },
  { title:"10. Children's Privacy", body:`Nexa is not directed at children under the age of 16. We do not knowingly collect personal information from children. If we become aware that a child has provided us with personal information, we will delete it immediately.` },
  { title:'11. Changes to This Policy', body:`We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through a notice in the product. Your continued use of Nexa after changes constitutes acceptance of the new policy.` },
  { title:'12. Contact Us', body:`If you have questions about this Privacy Policy:\n\nEmail: hello@nexaa.cc\nCompany: Nexa, Dubai, UAE\n\nWe respond to all privacy-related inquiries within 48 hours.` },
]

const SECTIONS_AR = [
  { title:'١. المعلومات التي نجمعها', body:`نجمع المعلومات التي تزودنا بها مباشرة، مثل عند إنشاء حساب أو استخدام خدماتنا أو التواصل معنا للدعم.\n\nمعلومات الحساب: الاسم، عنوان الإيميل، كلمة المرور، ومعلومات الفوترة.\n\nبيانات المحتوى: أي محتوى تحمّله لتدريب Brand Brain، بما في ذلك النصوص والصور والمستندات.\n\nبيانات الاستخدام: كيفية تفاعلك مع Nexa، بما في ذلك الميزات المستخدمة والمحتوى المنشأ ومدة الجلسة.\n\nمعلومات الجهاز: عنوان IP، نوع المتصفح، نظام التشغيل، ومعرّفات الجهاز.` },
  { title:'٢. كيف نستخدم معلوماتك', body:`نستخدم المعلومات التي نجمعها لـ:\n\n— تقديم خدماتنا وصيانتها وتحسينها\n— معالجة المعاملات وإرسال المعلومات ذات الصلة\n— تدريب نموذج صوت Brand Brain الخاص بك (بياناتك تُستخدم فقط لمساحة عملك)\n— إرسال الإشعارات التقنية والتحديثات ورسائل الدعم\n— الرد على تعليقاتك وأسئلتك\n— مراقبة وتحليل أنماط الاستخدام لتحسين المنتج` },
  { title:'٣. تخزين البيانات والأمان', body:`جميع البيانات مشفرة في حالة السكون باستخدام تشفير AES-256 وأثناء النقل باستخدام TLS 1.3. نخزّن البيانات على بنية تحتية Supabase مستضافة على AWS.\n\nنطبّق إجراءات أمان معيارية في الصناعة تشمل ضوابط الوصول وسجلات المراجعة والمراجعات الأمنية المنتظمة. مع ذلك، لا توجد طريقة نقل عبر الإنترنت آمنة بنسبة ١٠٠٪.` },
  { title:'٤. بيانات Brand Brain الخاصة بك', body:`بيانات تدريب Brand Brain الخاصة بك — بما في ذلك أي محتوى أو مستندات أو مواد تحمّلها — تعود لك بالكامل. نستخدم هذه البيانات فقط لتشغيل نموذج الصوت لمساحة عملك.\n\nنحن لا نستخدم محتواك لتدريب نماذج ذكاء اصطناعي عامة. لا نبيع بيانات علامتك التجارية ولا نشاركها مع أطراف ثالثة. يمكنك حذف بيانات Brand Brain في أي وقت من إعدادات مساحة العمل.` },
  { title:'٥. خدمات الطرف الثالث', body:`تتكامل Nexa مع خدمات طرف ثالث لتوفير وظائفها. تشمل هذه الخدمات:\n\n— Anthropic (Claude AI): يُستخدم لإنشاء المحتوى\n— Google (Veo): يُستخدم لتوليد الفيديو\n— ElevenLabs: يُستخدم لتوليد الصوت\n— Fal.ai: يُستخدم لتوليد الصور\n— Stripe: يُستخدم لمعالجة الدفع. نحن لا نخزّن بيانات بطاقة الدفع\n— Supabase: يُستخدم لقاعدة البيانات والتخزين\n\nلكل طرف ثالث سياسة خصوصية خاصة به تحكم بياناتك داخل أنظمته.` },
  { title:'٦. مشاركة المعلومات', body:`نحن لا نبيع معلوماتك الشخصية أو نتبادلها أو نؤجرها لأطراف ثالثة. قد نشارك المعلومات في الحالات التالية:\n\n— مع مزودي الخدمات الذين يساعدوننا في إدارة أعمالنا (بموجب اتفاقيات سرية صارمة)\n— إذا كان ذلك مطلوباً بموجب القانون أو اللوائح أو الإجراءات القانونية\n— في سياق الاندماج أو الاستحواذ (ستُبلَّغ مسبقاً)\n— بموافقتك الصريحة` },
  { title:'٧. الاحتفاظ بالبيانات', body:`نحتفظ ببيانات حسابك طالما كان حسابك نشطاً. إذا حذفت حسابك، سنحذف بياناتك الشخصية خلال ٣٠ يوماً، إلا حيث يُطلب منا الاحتفاظ بها قانوناً.\n\nالمحتوى الذي أنشأته قد يُحتفظ به بشكل مجهول ومجمّع لأغراض التحليل.` },
  { title:'٨. حقوقك', body:`لديك الحق في:\n\n— الوصول إلى البيانات الشخصية التي نحتفظ بها عنك\n— تصحيح البيانات غير الدقيقة\n— طلب حذف بياناتك\n— تصدير بياناتك بصيغة قابلة للنقل\n— إلغاء الاشتراك في الاتصالات التسويقية في أي وقت\n\nلممارسة أي من هذه الحقوق، تواصل معنا على hello@nexaa.cc.` },
  { title:'٩. ملفات تعريف الارتباط', body:`نستخدم ملفات تعريف الارتباط وتقنيات التتبع المماثلة للحفاظ على جلستك وتذكّر تفضيلاتك وتحليل الاستخدام. يمكنك التحكم في ملفات تعريف الارتباط من خلال إعدادات متصفحك. قد يؤثر تعطيلها على وظائف الخدمة.` },
  { title:'١٠. خصوصية الأطفال', body:`Nexa غير موجّهة للأطفال دون سن ١٦ عاماً. نحن لا نجمع معلومات شخصية من الأطفال عن علم. إذا علمنا أن طفلاً قدّم لنا معلومات شخصية، سنحذفها فوراً.` },
  { title:'١١. التغييرات على هذه السياسة', body:`قد نحدّث سياسة الخصوصية هذه من وقت لآخر. سنُبلغك بالتغييرات الجوهرية عبر الإيميل أو من خلال إشعار في المنتج. استمرارك في استخدام Nexa بعد التغييرات يُعدّ قبولاً للسياسة الجديدة.` },
  { title:'١٢. تواصل معنا', body:`إذا كان لديك أسئلة حول سياسة الخصوصية هذه:\n\nالإيميل: hello@nexaa.cc\nالشركة: Nexa، دبي، الإمارات العربية المتحدة\n\nنرد على جميع استفسارات الخصوصية خلال ٤٨ ساعة.` },
]

const TLDR_EN = [
  'Your Brand Brain data belongs to you. We never use it to train general AI models.',
  'We do not sell your data to anyone. Ever.',
  'You can delete everything, anytime, in one click.',
  'We encrypt all data at rest and in transit.',
]
const TLDR_AR = [
  'بيانات Brand Brain ملكك. لا نستخدمها أبداً لتدريب نماذج ذكاء اصطناعي عامة.',
  'نحن لا نبيع بياناتك لأي أحد. أبداً.',
  'تقدر تحذف كل شيء، في أي وقت، بنقرة واحدة.',
  'نشفّر جميع البيانات في حالة السكون وأثناء النقل.',
]

export default function PrivacyPage() {
  const [isAr, setIsAr] = useState(false)

  useEffect(() => {
    try { setIsAr(localStorage.getItem('nexa_lang') === 'ar') } catch {}
  }, [])

  const F   = isAr ? AR : SANS
  const H   = isAr ? AR : DISPLAY
  const dir = isAr ? 'rtl' : 'ltr'
  const sections = isAr ? SECTIONS_AR : SECTIONS_EN
  const tldr     = isAr ? TLDR_AR     : TLDR_EN

  function toggleLang() {
    const next = isAr ? 'en' : 'ar'
    try { localStorage.setItem('nexa_lang', next) } catch {}
    setIsAr(!isAr)
  }

  return (
    <div dir={dir} style={{ background:'#080808', color:T1, fontFamily:F, minHeight:'100vh' }}>
      <style dangerouslySetInnerHTML={{ __html:`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=DM+Sans:wght@300;400;500;600&family=Geist+Mono:wght@300;400;500&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .fade-in{animation:fadeUp 0.6s ease both}
        .toc-link{color:rgba(255,255,255,0.35);text-decoration:none;font-size:12px;display:block;padding:5px 0;transition:color 0.15s}
        .toc-link:hover{color:#FFFFFF}
        .lang-btn{background:none;border:0.5px solid rgba(255,255,255,0.12);border-radius:6px;color:rgba(255,255,255,0.40);font-size:13px;padding:5px 12px;cursor:pointer;transition:color 0.2s,border-color 0.2s}
        .lang-btn:hover{color:rgba(255,255,255,0.85);border-color:rgba(255,255,255,0.28)}
        @media(max-width:768px){.priv-grid{grid-template-columns:1fr!important}.priv-sidebar{display:none!important}}
      `}}/>

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

      <div className="priv-grid" style={{maxWidth:1000,margin:'0 auto',padding:'80px 40px 120px',display:'grid',gridTemplateColumns:'200px 1fr',gap:60,alignItems:'start'}}>

        <div className="fade-in priv-sidebar" style={{position:'sticky',top:80}}>
          <div style={{fontSize:10,fontFamily:MONO,color:T4,letterSpacing:'0.10em',textTransform:'uppercase',marginBottom:16}}>
            {isAr?'المحتويات':'Contents'}
          </div>
          {sections.map((s,i)=>(
            <a key={i} href={`#section-${i}`} className="toc-link" style={{fontFamily:F}}>{s.title}</a>
          ))}
          <div style={{marginTop:24,paddingTop:20,borderTop:`1px solid ${LINE}`}}>
            <Link href="/landing/terms" style={{fontSize:12,color:T4,textDecoration:'none',fontFamily:MONO,display:'block',marginBottom:8}}>
              {isAr?'← شروط الخدمة':'Terms of Service →'}
            </Link>
            <Link href="/landing" style={{fontSize:12,color:T4,textDecoration:'none',fontFamily:MONO,display:'block'}}>
              {isAr?'→ العودة لـ Nexa':'← Back to Nexa'}
            </Link>
          </div>
        </div>

        <div className="fade-in">
          <div style={{fontSize:11,fontFamily:MONO,color:T4,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:16}}>
            {isAr?'قانوني':'Legal'}
          </div>
          <h1 style={{fontFamily:H,fontWeight:800,fontSize:'clamp(40px,6vw,72px)',letterSpacing:isAr?0:'-0.05em',color:T1,lineHeight:isAr?1.2:0.90,marginBottom:16}}>
            {isAr?<>سياسة<br/>الخصوصية</>:<>Privacy<br/>Policy</>}
          </h1>
          <p style={{fontFamily:MONO,fontSize:12,color:T4,marginBottom:60}}>
            {isAr?'آخر تحديث: ١٨ مارس ٢٠٢٦':'Last updated: March 18, 2026'}
          </p>

          {/* TL;DR card */}
          <div style={{padding:'20px 24px',background:'rgba(0,170,255,0.05)',border:`1px solid rgba(0,170,255,0.18)`,borderRadius:12,marginBottom:56}}>
            <div style={{fontSize:10,fontFamily:MONO,color:CYAN,letterSpacing:'0.10em',textTransform:'uppercase',marginBottom:12,opacity:0.8}}>
              {isAr?'الخلاصة — النسخة المختصرة':'TL;DR — The short version'}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {tldr.map((item,i)=>(
                <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,fontSize:13,color:T2,fontFamily:F,flexDirection:isAr?'row-reverse':'row'}}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0,marginTop:2}}><polyline points="20 6 9 17 4 12"/></svg>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {sections.map((section,i)=>(
            <div key={i} id={`section-${i}`} style={{marginBottom:52,paddingBottom:52,borderBottom:i<sections.length-1?`1px solid ${LINE}`:'none',scrollMarginTop:80}}>
              <h2 style={{fontFamily:H,fontWeight:800,fontSize:20,color:T1,marginBottom:18,letterSpacing:isAr?0:'-0.03em'}}>{section.title}</h2>
              {section.body.split('\n\n').map((para,j)=>(
                <p key={j} style={{fontSize:14,color:T2,lineHeight:isAr?1.95:1.85,marginBottom:12,fontFamily:F}}>{para}</p>
              ))}
            </div>
          ))}
        </div>
      </div>

      <footer style={{borderTop:`1px solid ${LINE}`,padding:'28px 40px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
        <span style={{fontSize:12,color:T4,fontFamily:MONO}}>
          {isAr?'© ٢٠٢٦ Nexa. جميع الحقوق محفوظة.':'© 2026 Nexa. All rights reserved.'}
        </span>
        <span style={{fontSize:12,color:T4,fontFamily:MONO}}>Dubai, UAE · hello@nexaa.cc</span>
        <Link href="/landing/terms" style={{fontSize:12,color:T4,fontFamily:MONO,textDecoration:'none'}}>
          {isAr?'← شروط الخدمة':'Terms of Service →'}
        </Link>
      </footer>
    </div>
  )
}
