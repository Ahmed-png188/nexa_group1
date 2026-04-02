// ── Landing Page Templates ───────────────────────────────────────────────────
// 6 master templates covering all brand types

export type SectionType =
  | 'hero'
  | 'products'
  | 'about'
  | 'features'
  | 'testimonials'
  | 'gallery'
  | 'cta_banner'
  | 'lead_form'
  | 'footer'

export interface LandingSection {
  id:      string
  type:    SectionType
  content: Record<string, any>
  hidden?: boolean
}

export interface LandingPageConfig {
  title:            string
  template_id:      string
  theme:            'dark' | 'light' | 'warm' | 'midnight'
  font:             'geist' | 'serif' | 'dm' | 'inter'
  accent:           string
  rtl:              boolean
  logo_url?:        string
  whatsapp?:        string
  nav_links?:       Array<{ label: string; href: string }>
  sections:         LandingSection[]
  seo_title?:       string
  seo_description?: string
}

export interface LandingTemplate {
  id:             string
  label:          string
  description:    string
  brandTypes:     string[]
  emoji:          string
  defaultTheme:   LandingPageConfig['theme']
  defaultFont:    LandingPageConfig['font']
  defaultAccent:  string
  sections:       LandingSection[]
}

// ── Unique ID generator for default sections ──────────────────
function sid(type: SectionType, n: number) { return `${type}-${n}` }

// ── 6 Master Templates ────────────────────────────────────────
export const LANDING_TEMPLATES: LandingTemplate[] = [
  // 1. Hero Product
  {
    id: 'hero-product',
    label: 'Hero Product',
    description: 'Bold hero with product grid and social proof',
    brandTypes: ['physical_product', 'home_living'],
    emoji: '📦',
    defaultTheme: 'dark',
    defaultFont: 'geist',
    defaultAccent: '#00AAFF',
    sections: [
      { id: sid('hero',1), type: 'hero', content: {
        headline: 'The Product That Changes Everything',
        subheadline: 'Premium quality. Built to last. Made for you.',
        cta_label: 'Shop Now', cta_url: '#products',
        cta2_label: 'Learn More', cta2_url: '#about',
      }},
      { id: sid('products',1), type: 'products', content: {
        headline: 'Our Products',
        items: [
          { id:'p1', name:'Product One',   price:'$49',  description:'The original. The best.',       image:'' },
          { id:'p2', name:'Product Two',   price:'$79',  description:'Next level performance.',       image:'' },
          { id:'p3', name:'Product Three', price:'$129', description:'The complete package.',         image:'' },
        ],
      }},
      { id: sid('testimonials',1), type: 'testimonials', content: {
        headline: 'What Customers Say',
        testimonials: [
          { name:'Sarah K.',    role:'Verified Buyer',  text:'Absolutely love it. Exceeded my expectations.' },
          { name:'Mohammed A.', role:'Loyal Customer',  text:'Best purchase I made this year.' },
          { name:'Lisa T.',     role:'5-Star Review',   text:'Premium quality, fast shipping, great support.' },
        ],
      }},
      { id: sid('cta_banner',1), type: 'cta_banner', content: {
        headline: 'Ready to experience the difference?',
        subline: 'Join thousands of happy customers.',
        cta_label: 'Get Started', cta_url: '#products',
      }},
      { id: sid('footer',1), type: 'footer', content: { copyright: '© 2025 Brand. All rights reserved.' }},
    ],
  },

  // 2. Food & Menu
  {
    id: 'food-menu',
    label: 'Food & Menu',
    description: 'Warm editorial with menu showcase and gallery',
    brandTypes: ['food_beverage'],
    emoji: '🍽️',
    defaultTheme: 'warm',
    defaultFont: 'dm',
    defaultAccent: '#D97706',
    sections: [
      { id: sid('hero',2), type: 'hero', content: {
        headline: 'Food Made With Love',
        subheadline: 'Fresh ingredients, bold flavors, unforgettable moments.',
        cta_label: 'See Our Menu', cta_url: '#products',
        cta2_label: 'Reserve a Table', cta2_url: '#lead_form',
      }},
      { id: sid('about',2), type: 'about', content: {
        headline: 'Our Story',
        text: 'Born from a passion for authentic flavors and a love for bringing people together. Every dish tells a story.',
        image: '',
      }},
      { id: sid('products',2), type: 'products', content: {
        headline: 'Featured Menu',
        items: [
          { id:'m1', name:'Signature Dish',    price:'45 SAR', description:'Our most beloved creation.',    image:'' },
          { id:'m2', name:'Chef Special',      price:'65 SAR', description:'Crafted with seasonal ingredients.', image:'' },
          { id:'m3', name:"Fan Favorite",      price:'35 SAR', description:'Always a crowd-pleaser.',       image:'' },
          { id:'m4', name:'New This Season',   price:'55 SAR', description:'Fresh and exciting.',           image:'' },
        ],
      }},
      { id: sid('gallery',2), type: 'gallery', content: { headline: 'From Our Kitchen', images: [] }},
      { id: sid('lead_form',2), type: 'lead_form', content: {
        headline: 'Reserve Your Table',
        subline: "We'll confirm your booking within 2 hours.",
        cta: 'Book Now',
        fields: [
          { id:'f-name',  type:'text',  label:'Full name',              placeholder:'Your name',           required:true  },
          { id:'f-phone', type:'phone', label:'Phone number',           placeholder:'+966 5X XXX XXXX',   required:true  },
          { id:'f-date',  type:'text',  label:'Preferred date & time',  placeholder:'e.g. Saturday 7pm',  required:false },
        ],
      }},
      { id: sid('footer',2), type: 'footer', content: { copyright: '© 2025 Restaurant. All rights reserved.' }},
    ],
  },

  // 3. Digital Course
  {
    id: 'digital-course',
    label: 'Digital Course',
    description: 'High-converting course or digital product page',
    brandTypes: ['digital_product'],
    emoji: '💻',
    defaultTheme: 'dark',
    defaultFont: 'geist',
    defaultAccent: '#7C3AED',
    sections: [
      { id: sid('hero',3), type: 'hero', content: {
        headline: 'Master The Skills That Matter',
        subheadline: 'A complete program to take you from beginner to professional.',
        cta_label: 'Enroll Now', cta_url: '#lead_form',
        cta2_label: "What's Inside", cta2_url: '#features',
      }},
      { id: sid('features',3), type: 'features', content: {
        headline: "What You'll Learn",
        features: [
          { icon:'🎯', title:'Clear Curriculum',    desc:'Step-by-step lessons designed for real results.' },
          { icon:'🚀', title:'Lifetime Access',     desc:'Learn at your own pace, revisit anytime.' },
          { icon:'💬', title:'Community Support',   desc:'Join a private group of motivated learners.' },
          { icon:'📜', title:'Certificate',         desc:'Earn a certificate upon completion.' },
        ],
      }},
      { id: sid('testimonials',3), type: 'testimonials', content: {
        headline: 'Student Success Stories',
        testimonials: [
          { name:'Ahmed R.',  role:'Course Graduate', text:'This course changed my career trajectory completely.' },
          { name:'Fatima S.', role:'Entrepreneur',    text:'Worth every riyal. The ROI has been incredible.' },
          { name:'Khalid M.', role:'Freelancer',      text:'Clear, practical, and immediately applicable.' },
        ],
      }},
      { id: sid('cta_banner',3), type: 'cta_banner', content: {
        headline: 'Limited spots available',
        subline: 'Join over 2,000 students already enrolled.',
        cta_label: 'Claim Your Spot', cta_url: '#lead_form',
      }},
      { id: sid('lead_form',3), type: 'lead_form', content: {
        headline: 'Enroll Today',
        subline: 'Start your journey. Cancel anytime.',
        cta: 'Enroll Now →',
        fields: [
          { id:'f-name',  type:'text',  label:'Full name',      placeholder:'Your name',         required:true },
          { id:'f-email', type:'email', label:'Email address',  placeholder:'you@example.com',   required:true },
        ],
      }},
      { id: sid('footer',3), type: 'footer', content: { copyright: '© 2025 Course. All rights reserved.' }},
    ],
  },

  // 4. Lifestyle Editorial
  {
    id: 'lifestyle-editorial',
    label: 'Lifestyle Editorial',
    description: 'Editorial-style layout for fashion and lifestyle brands',
    brandTypes: ['fashion_lifestyle'],
    emoji: '✨',
    defaultTheme: 'light',
    defaultFont: 'serif',
    defaultAccent: '#DB2777',
    sections: [
      { id: sid('hero',4), type: 'hero', content: {
        headline: 'Define Your Style',
        subheadline: 'Curated pieces for the modern life.',
        cta_label: 'Shop Collection', cta_url: '#products',
      }},
      { id: sid('gallery',4), type: 'gallery', content: { headline: 'New Arrivals', images: [] }},
      { id: sid('about',4), type: 'about', content: {
        headline: 'The Brand Story',
        text: 'Crafted with intention. Worn with confidence. Every piece in our collection is designed to make you feel effortlessly put-together.',
        image: '',
      }},
      { id: sid('products',4), type: 'products', content: {
        headline: 'Shop the Look',
        items: [
          { id:'i1', name:'The Classic Piece', price:'$89',  description:'A wardrobe essential.', image:'' },
          { id:'i2', name:'The Statement',     price:'$129', description:'Wear it loud.',         image:'' },
          { id:'i3', name:'The Everyday',      price:'$69',  description:'For the real moments.', image:'' },
        ],
      }},
      { id: sid('footer',4), type: 'footer', content: { copyright: '© 2025 Brand. All rights reserved.' }},
    ],
  },

  // 5. Sport & Active
  {
    id: 'sport-active',
    label: 'Sport & Active',
    description: 'High-energy page for fitness and sports brands',
    brandTypes: ['fashion_lifestyle', 'physical_product'],
    emoji: '⚡',
    defaultTheme: 'midnight',
    defaultFont: 'inter',
    defaultAccent: '#059669',
    sections: [
      { id: sid('hero',5), type: 'hero', content: {
        headline: 'Perform At Your Peak',
        subheadline: 'Engineered for athletes. Built for champions.',
        cta_label: 'Shop Now', cta_url: '#products',
        cta2_label: 'Our Mission', cta2_url: '#about',
      }},
      { id: sid('features',5), type: 'features', content: {
        headline: 'Built Different',
        features: [
          { icon:'⚡', title:'High Performance',   desc:'Engineered to perform in every condition.' },
          { icon:'🔥', title:'Premium Materials',  desc:'Sourced for durability and comfort.' },
          { icon:'🛡️', title:'Tested & Proven',    desc:'Trusted by 10,000+ athletes.' },
          { icon:'♻️', title:'Sustainable',        desc:'Performance with a conscience.' },
        ],
      }},
      { id: sid('products',5), type: 'products', content: {
        headline: 'The Collection',
        items: [
          { id:'s1', name:'Pro Series',       price:'$120', description:'For the serious athlete.', image:'' },
          { id:'s2', name:'Active Everyday',  price:'$85',  description:'Train daily. Recover fast.', image:'' },
          { id:'s3', name:'Limited Edition',  price:'$150', description:'Exclusive performance.',  image:'' },
        ],
      }},
      { id: sid('testimonials',5), type: 'testimonials', content: {
        headline: 'From Athletes',
        testimonials: [
          { name:'Omar H.', role:'Marathon Runner', text:'These are the only shoes I race in. Game changer.' },
          { name:'Nour A.', role:'CrossFit Coach',  text:'My entire gym switched to this brand. Says everything.' },
          { name:'Saad K.', role:'Pro Cyclist',     text:'The materials and fit are unmatched at this price.' },
        ],
      }},
      { id: sid('cta_banner',5), type: 'cta_banner', content: {
        headline: 'Start your performance journey',
        subline: 'Free shipping on orders over $100.',
        cta_label: 'Shop Now', cta_url: '#products',
      }},
      { id: sid('footer',5), type: 'footer', content: { copyright: '© 2025 Brand. All rights reserved.' }},
    ],
  },

  // 6. Premium Minimal
  {
    id: 'premium-minimal',
    label: 'Premium Minimal',
    description: 'Ultra-clean layout for luxury and premium brands',
    brandTypes: ['beauty_wellness', 'home_living'],
    emoji: '🌿',
    defaultTheme: 'light',
    defaultFont: 'serif',
    defaultAccent: '#059669',
    sections: [
      { id: sid('hero',6), type: 'hero', content: {
        headline: 'Crafted For The Conscious',
        subheadline: 'Pure ingredients. Proven results. Premium experience.',
        cta_label: 'Discover', cta_url: '#products',
      }},
      { id: sid('about',6), type: 'about', content: {
        headline: 'Why We Exist',
        text: 'We believe that what you put on your body matters as much as what you put in it. Every formulation is backed by science and made with purpose.',
        image: '',
      }},
      { id: sid('gallery',6), type: 'gallery', content: { headline: 'The Range', images: [] }},
      { id: sid('features',6), type: 'features', content: {
        headline: 'The Difference',
        features: [
          { icon:'🌿', title:'100% Natural',      desc:'No harsh chemicals. Ever.' },
          { icon:'🔬', title:'Lab Tested',        desc:'Every batch verified.' },
          { icon:'🌍', title:'Sustainably Sourced', desc:'Good for you and the planet.' },
          { icon:'💚', title:'Cruelty Free',      desc:'Always. No exceptions.' },
        ],
      }},
      { id: sid('cta_banner',6), type: 'cta_banner', content: {
        headline: 'Your ritual starts here',
        subline: '30-day satisfaction guarantee.',
        cta_label: 'Shop Now', cta_url: '#products',
      }},
      { id: sid('footer',6), type: 'footer', content: { copyright: '© 2025 Brand. All rights reserved.' }},
    ],
  },
]

export function getTemplateForBrandType(brandType: string): LandingTemplate {
  return LANDING_TEMPLATES.find(t => t.brandTypes.includes(brandType)) || LANDING_TEMPLATES[0]
}

export const SECTION_LABELS: Record<SectionType, string> = {
  hero:         'Hero',
  products:     'Products / Menu',
  about:        'About',
  features:     'Features',
  testimonials: 'Testimonials',
  gallery:      'Gallery',
  cta_banner:   'CTA Banner',
  lead_form:    'Lead Form',
  footer:       'Footer',
}

export const SECTION_ICONS: Record<SectionType, string> = {
  hero:         '🏠',
  products:     '🛍️',
  about:        '📖',
  features:     '✅',
  testimonials: '💬',
  gallery:      '🖼️',
  cta_banner:   '📣',
  lead_form:    '📋',
  footer:       '🔗',
}
