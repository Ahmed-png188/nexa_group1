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
  { title:'1. Acceptance of Terms', body:`By accessing or using Nexa ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.\n\nThese terms apply to all users, including visitors, registered users, and paying subscribers. Nexa reserves the right to modify these terms at any time. We will notify you of significant changes via email.` },
  { title:'2. Description of Service', body:`Nexa is an AI-powered business intelligence and content creation platform. The Service includes Brand Brain (voice modeling), Studio (content creation), Strategy (content planning), Agents (automated marketing), Sequences (email automation), and Amplify (advertising tools).\n\nNexa is provided "as is" and we reserve the right to modify, suspend, or discontinue any part of the Service at any time.` },
  { title:'3. Account Registration', body:`You must create an account to use Nexa. You agree to:\n\n— Provide accurate, current, and complete registration information\n— Maintain the security of your password\n— Accept responsibility for all activities under your account\n— Notify us immediately of any unauthorized account access\n\nYou must be at least 16 years old to create an account.` },
  { title:'4. Subscription and Payment', body:`Nexa offers paid subscription plans. Free trial: New accounts on the Spark plan receive 150 free credits. No credit card is required to start.\n\nPaid plans: Subscriptions begin when you enter payment information. Fees are charged in advance on a monthly basis.\n\nRefunds: We offer a 7-day refund on first-time subscriptions. After 7 days, all fees are non-refundable.\n\nCancellation: You may cancel at any time. Access continues until the end of the current billing period.` },
  { title:'5. Credits System', body:`Nexa uses a credits system to govern AI generation usage. Credits are allocated monthly based on your plan and do not roll over between billing periods.\n\nCredit costs:\n— Text content: 2–3 credits\n— Image generation: 5 credits\n— Video generation (8s): 10 credits\n— Video generation (16s): 20 credits\n— Voice generation: 5–20 credits depending on length\n\nChat, scheduling, and strategy features are always free.` },
  { title:'6. Intellectual Property', body:`Your content: You retain full ownership of all content you create using Nexa, including Brand Brain training data, generated posts, images, and videos.\n\nNexa IP: The Nexa platform, software, design, and related intellectual property belong to Nexa. You may not copy, modify, or reverse engineer any part of the platform.\n\nLicense to Nexa: By using the Service, you grant Nexa a limited license to process your content solely to provide the Service. We do not use your content to train general AI models.` },
  { title:'7. Acceptable Use', body:`You agree not to use Nexa to:\n\n— Generate content that is illegal, harmful, defamatory, or violates third-party rights\n— Spam, harass, or send unsolicited communications\n— Impersonate any person or entity\n— Resell or redistribute the Service without written permission\n\nViolation of these terms may result in immediate account termination.` },
  { title:'8. Agency Workspaces', body:`The Agency plan allows you to create separate workspaces for client brands. As an agency user, you are responsible for ensuring you have authorization to create content on behalf of your clients and complying with all applicable laws regarding client data.` },
  { title:'9. Disclaimer of Warranties', body:`The Service is provided "as is" without warranties of any kind. AI-generated content may contain errors or inaccuracies. You are responsible for reviewing all content before publishing. Nexa is not responsible for any consequences resulting from AI-generated content.` },
  { title:'10. Limitation of Liability', body:`To the maximum extent permitted by law, Nexa shall not be liable for any indirect, incidental, or consequential damages. Our total liability to you for any claim shall not exceed the amount you paid us in the 12 months preceding the claim.` },
  { title:'11. Governing Law', body:`These Terms of Service are governed by the laws of the United Arab Emirates. Any disputes will be subject to the exclusive jurisdiction of the courts of Dubai, UAE.` },
  { title:'12. Contact', body:`For questions about these Terms, contact us at hello@nexaa.cc. We respond to all legal inquiries within 5 business days.` },
]

const SECTIONS_AR = [
  { title:'١. القبول بالشروط', body:`بدخولك أو استخدامك لـ Nexa ("الخدمة")، أنت توافق على الالتزام بشروط الخدمة هذه. إذا ما وافقت على هذه الشروط، لا تستخدم الخدمة.\n\nهذه الشروط تنطبق على جميع المستخدمين، بما فيهم الزوار والمستخدمين المسجلين والمشتركين المدفوعين. تحتفظ Nexa بحق تعديل هذه الشروط في أي وقت. سنُبلغك بأي تغييرات جوهرية عبر الإيميل.` },
  { title:'٢. وصف الخدمة', body:`Nexa منصة ذكاء أعمال وإنشاء محتوى مدعومة بالذكاء الاصطناعي. تشمل الخدمة: Brand Brain (نمذجة الصوت)، الاستوديو (إنشاء المحتوى)، الاستراتيجية (تخطيط المحتوى)، الوكلاء (التسويق الآلي)، السيكوانسات (أتمتة الإيميل)، وAmplify (أدوات الإعلان).\n\nتُقدَّم Nexa "كما هي" ونحتفظ بالحق في تعديل أو تعليق أو إيقاف أي جزء من الخدمة في أي وقت.` },
  { title:'٣. إنشاء الحساب', body:`يجب إنشاء حساب لاستخدام Nexa. أنت توافق على:\n\n— تقديم معلومات تسجيل دقيقة وحديثة وكاملة\n— المحافظة على أمان كلمة المرور\n— قبول المسؤولية عن جميع الأنشطة تحت حسابك\n— إبلاغنا فوراً عن أي وصول غير مصرح به لحسابك\n\nيجب أن يكون عمرك ١٦ سنة على الأقل لإنشاء حساب.` },
  { title:'٤. الاشتراك والدفع', body:`تقدم Nexa خطط اشتراك مدفوعة. التجربة المجانية: الحسابات الجديدة على خطة Spark تحصل على ١٥٠ رصيد مجانياً. لا حاجة لبطاقة ائتمانية للبدء.\n\nالخطط المدفوعة: تبدأ الاشتراكات عند إدخال بيانات الدفع. الرسوم تُحصَّل مسبقاً على أساس شهري.\n\nالاسترداد: نقدم استرداداً خلال ٧ أيام للاشتراكات لأول مرة. بعد ٧ أيام، جميع الرسوم غير قابلة للاسترداد.\n\nالإلغاء: يمكنك الإلغاء في أي وقت. يستمر الوصول حتى نهاية فترة الفوترة الحالية.` },
  { title:'٥. نظام الأرصدة', body:`تستخدم Nexa نظام أرصدة لإدارة استخدام إنتاج الذكاء الاصطناعي. تُخصَّص الأرصدة شهرياً بناءً على خطتك ولا تُرحَّل بين فترات الفوترة.\n\nتكاليف الأرصدة:\n— المحتوى النصي: ٢–٣ أرصدة\n— توليد الصور: ٥ أرصدة\n— توليد الفيديو (٨ ثوانٍ): ١٠ أرصدة\n— توليد الفيديو (١٦ ثانية): ٢٠ رصيداً\n— توليد الصوت: ٥–٢٠ رصيداً حسب الطول\n\nالمحادثة والجدولة والاستراتيجية مجانية دائماً.` },
  { title:'٦. الملكية الفكرية', body:`محتواك: أنت تحتفظ بالملكية الكاملة لجميع المحتوى الذي تنشئه باستخدام Nexa، بما فيه بيانات تدريب Brand Brain والمنشورات والصور والفيديوهات المولّدة.\n\nملكية Nexa: منصة Nexa والبرمجيات والتصميم والملكية الفكرية ذات الصلة تعود لـ Nexa. لا يحق لك نسخ أو تعديل أو هندسة عكسية لأي جزء من المنصة.\n\nترخيص لـ Nexa: باستخدامك للخدمة، تمنح Nexa ترخيصاً محدوداً لمعالجة محتواك لغرض تقديم الخدمة فقط. نحن لا نستخدم محتواك لتدريب نماذج ذكاء اصطناعي عامة.` },
  { title:'٧. الاستخدام المقبول', body:`أنت توافق على عدم استخدام Nexa لـ:\n\n— توليد محتوى غير قانوني أو ضار أو تشهيري أو ينتهك حقوق الآخرين\n— الإزعاج أو المضايقة أو إرسال اتصالات غير مرغوب فيها\n— انتحال شخصية أي شخص أو جهة\n— إعادة بيع أو توزيع الخدمة بدون إذن كتابي\n\nانتهاك هذه الشروط قد يؤدي إلى إنهاء الحساب فوراً.` },
  { title:'٨. مساحات عمل الوكالة', body:`خطة الوكالة تسمح بإنشاء مساحات عمل منفصلة لعلامات العملاء التجارية. كمستخدم وكالة، أنت مسؤول عن التأكد من أن لديك الصلاحية لإنشاء محتوى نيابة عن عملائك والامتثال لجميع القوانين المعمول بها فيما يخص بيانات العملاء.` },
  { title:'٩. إخلاء المسؤولية عن الضمانات', body:`تُقدَّم الخدمة "كما هي" بدون أي ضمانات. قد يحتوي المحتوى المولَّد بالذكاء الاصطناعي على أخطاء أو معلومات غير دقيقة. أنت مسؤول عن مراجعة جميع المحتوى قبل النشر. Nexa غير مسؤولة عن أي عواقب ناتجة عن المحتوى المولَّد بالذكاء الاصطناعي.` },
  { title:'١٠. تحديد المسؤولية', body:`بالقدر الأقصى المسموح به قانوناً، لن تكون Nexa مسؤولة عن أي أضرار غير مباشرة أو عرضية أو تبعية. إجمالي مسؤوليتنا تجاهك في أي مطالبة لن تتجاوز المبلغ الذي دفعته لنا في الـ ١٢ شهراً السابقة للمطالبة.` },
  { title:'١١. القانون الحاكم', body:`تخضع شروط الخدمة هذه لقوانين الإمارات العربية المتحدة. أي نزاعات ستخضع للاختصاص القضائي الحصري لمحاكم دبي، الإمارات.` },
  { title:'١٢. التواصل', body:`لأي أسئلة حول هذه الشروط، تواصل معنا على hello@nexaa.cc. نرد على جميع الاستفسارات القانونية خلال ٥ أيام عمل.` },
]

export default function TermsPage() {
  const [isAr, setIsAr] = useState(false)

  useEffect(() => {
    try { setIsAr(localStorage.getItem('nexa_lang') === 'ar') } catch {}
  }, [])

  const F   = isAr ? AR : SANS
  const H   = isAr ? AR : DISPLAY
  const dir = isAr ? 'rtl' : 'ltr'
  const sections = isAr ? SECTIONS_AR : SECTIONS_EN

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
        .toc-link{color:rgba(255,255,255,0.35);text-decoration:none;font-size:12px;display:block;padding:5px 0;transition:color 0.15s;font-family:${F}}
        .toc-link:hover{color:#FFFFFF}
        .lang-btn{background:none;border:0.5px solid rgba(255,255,255,0.12);border-radius:6px;color:rgba(255,255,255,0.40);font-size:13px;padding:5px 12px;cursor:pointer;transition:color 0.2s,border-color 0.2s}
        .lang-btn:hover{color:rgba(255,255,255,0.85);border-color:rgba(255,255,255,0.28)}
        @media(max-width:768px){.terms-grid{grid-template-columns:1fr!important}.terms-sidebar{display:none!important}}
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

      <div className="terms-grid" style={{maxWidth:1000,margin:'0 auto',padding:'80px 40px 120px',display:'grid',gridTemplateColumns:'200px 1fr',gap:60,alignItems:'start'}}>

        {/* TOC sidebar */}
        <div className="fade-in terms-sidebar" style={{position:'sticky',top:80}}>
          <div style={{fontSize:10,fontFamily:MONO,color:T4,letterSpacing:'0.10em',textTransform:'uppercase',marginBottom:16}}>
            {isAr?'المحتويات':'Contents'}
          </div>
          {sections.map((s,i)=>(
            <a key={i} href={`#section-${i}`} className="toc-link">{s.title}</a>
          ))}
          <div style={{marginTop:24,paddingTop:20,borderTop:`1px solid ${LINE}`}}>
            <Link href="/landing/privacy" style={{fontSize:12,color:T4,textDecoration:'none',fontFamily:MONO,display:'block',marginBottom:8}}>
              {isAr?'← سياسة الخصوصية':'Privacy Policy →'}
            </Link>
            <Link href="/landing" style={{fontSize:12,color:T4,textDecoration:'none',fontFamily:MONO,display:'block'}}>
              {isAr?'→ العودة لـ Nexa':'← Back to Nexa'}
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="fade-in">
          <div style={{fontSize:11,fontFamily:MONO,color:T4,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:16}}>
            {isAr?'قانوني':'Legal'}
          </div>
          <h1 style={{fontFamily:H,fontWeight:800,fontSize:'clamp(40px,6vw,72px)',letterSpacing:isAr?0:'-0.05em',color:T1,lineHeight:isAr?1.2:0.90,marginBottom:16}}>
            {isAr?<>شروط<br/>الخدمة</>:<>Terms of<br/>Service</>}
          </h1>
          <p style={{fontFamily:MONO,fontSize:12,color:T4,marginBottom:60}}>
            {isAr?'آخر تحديث: ١٨ مارس ٢٠٢٦':'Last updated: March 18, 2026'}
          </p>

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
        <Link href="/landing/privacy" style={{fontSize:12,color:T4,fontFamily:MONO,textDecoration:'none'}}>
          {isAr?'← سياسة الخصوصية':'Privacy Policy →'}
        </Link>
      </footer>
    </div>
  )
}
