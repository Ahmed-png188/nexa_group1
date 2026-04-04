// ─────────────────────────────────────────────
// DESIGN SYSTEMS
// ─────────────────────────────────────────────

export type DesignSystem =
  | 'editorial'
  | 'minimal'
  | 'bold'
  | 'warm'

// ─────────────────────────────────────────────
// CREATIVE DIRECTION
// ─────────────────────────────────────────────

export interface CreativeDirection {
  hero_layout:
    | 'headline_dominant'
    | 'product_dominant'
    | 'split_balanced'
    | 'editorial_stack'
    | 'full_bleed'

  type_scale:
    | 'expressive'
    | 'restrained'
    | 'aggressive'
    | 'literary'

  spacing:
    | 'tight'
    | 'breathing'
    | 'dramatic'

  color_application:
    | 'monochrome'
    | 'accent_moments'
    | 'accent_forward'
    | 'inverted_sections'

  font_personality:
    | 'serif_dominant'
    | 'sans_dominant'
    | 'display_heavy'
    | 'mixed_editorial'

  image_treatment:
    | 'product_pure'
    | 'lifestyle_rich'
    | 'editorial_crop'
    | 'minimal_hint'
    | 'no_image'

  section_density:
    | 'sparse'
    | 'layered'
    | 'focused'

  reasoning: string
}

// ─────────────────────────────────────────────
// SECTION TYPES
// ─────────────────────────────────────────────

export type SectionType =
  | 'hero'
  | 'marquee'
  | 'statement'
  | 'products'
  | 'pull_quote'
  | 'story'
  | 'features'
  | 'reviews'
  | 'form'
  | 'founder_note'
  | 'ingredients'
  | 'gallery'
  | 'cta_banner'
  | 'faq'
  | 'video'
  | 'stats'
  | 'footer'

// ─────────────────────────────────────────────
// SECTION DATA TYPES
// ─────────────────────────────────────────────

export interface HeroSection {
  eyebrow:            string
  headline_line1:     string
  headline_line2:     string
  headline_italic:    string
  body:               string
  cta_primary:        string
  cta_primary_href:   string
  cta_secondary:      string
  cta_secondary_href: string
  trust_items:        string[]
  image_url?:         string
}

export interface MarqueeSection {
  items: string[]
  speed: 'slow' | 'normal' | 'fast'
}

export interface StatementSection {
  number:         string
  left_headline:  string
  left_italic:    string
  body:           string
  stats: Array<{
    num:   string
    label: string
  }>
}

export interface ProductsSection {
  section_title:    string
  section_subtitle: string
  link_label:       string
  product_ids:      string[]
  layout:           'three_col' | 'two_col' | 'hero_center'
}

export interface PullQuoteSection {
  quote:    string
  author:   string
  location: string
}

export interface StorySection {
  tag:             string
  headline:        string
  headline_italic: string
  body:            string
  image_url?:      string
  values: Array<{
    title: string
    desc:  string
  }>
}

export interface FeaturesSection {
  headline: string
  items: Array<{
    icon:  string
    title: string
    desc:  string
  }>
}

export interface ReviewsSection {
  headline: string
  score:    string
  count:    string
  items: Array<{
    quote:    string
    author:   string
    location: string
  }>
}

export interface FormSection {
  tag:             string
  headline_line1:  string
  headline_line2:  string
  headline_italic: string
  body:            string
  cta:             string
  note:            string
  fields: Array<{
    id:          string
    type:        'text' | 'email' | 'phone'
    label:       string
    placeholder: string
    required:    boolean
  }>
}

export interface FounderNoteSection {
  text:       string
  name:       string
  role:       string
  image_url?: string
}

export interface IngredientsSection {
  headline:        string
  headline_italic: string
  desc:            string
  items: Array<{
    name:   string
    desc:   string
    source: string
    icon:   string
  }>
}

export interface GallerySection {
  headline:  string
  image_ids: string[]
}

export interface CTABannerSection {
  headline: string
  subline:  string
  cta:      string
  cta_href: string
}

export interface FAQSection {
  headline: string
  items: Array<{
    question: string
    answer:   string
  }>
}

export interface VideoSection {
  headline:  string
  embed_url: string
  caption:   string
}

export interface StatsSection {
  items: Array<{
    num:   string
    label: string
    desc:  string
  }>
}

export interface FooterSection {
  tagline: string
  cols: Array<{
    title: string
    links: string[]
  }>
}

// ─────────────────────────────────────────────
// COMPLETE PAGE CONFIG
// ─────────────────────────────────────────────

export interface LandingPageConfig {
  brand_name:    string
  brand_initial: string
  logo_url:      string | null
  lang:          'en' | 'ar'

  design_system:      DesignSystem
  accent:             string
  secondary_accent:   string
  bg_override:        string
  creative_direction: CreativeDirection

  sections_order: SectionType[]

  hero?:         HeroSection
  marquee?:      MarqueeSection
  statement?:    StatementSection
  products?:     ProductsSection
  pull_quote?:   PullQuoteSection
  story?:        StorySection
  features?:     FeaturesSection
  reviews?:      ReviewsSection
  form?:         FormSection
  founder_note?: FounderNoteSection
  ingredients?:  IngredientsSection
  gallery?:      GallerySection
  cta_banner?:   CTABannerSection
  faq?:          FAQSection
  video?:        VideoSection
  stats?:        StatsSection
  footer?:       FooterSection

  product_images:  string[]

  meta_title:       string
  meta_description: string

  workspace_id: string
}

// ─────────────────────────────────────────────
// PRODUCT TYPE (matches workspace_products table)
// ─────────────────────────────────────────────

export interface ProductImage {
  url:   string
  alt:   string
  order: number
}

export interface ProductVariant {
  name:    string
  options: string[]
}

export interface WorkspaceProduct {
  id:               string
  workspace_id:     string
  name:             string
  short_desc:       string
  full_desc:        string
  price:            string
  price_value:      number
  currency:         string
  badge:            string
  featured:         boolean
  active:           boolean
  images:           ProductImage[]
  variants:         ProductVariant[]
  action_type:      'whatsapp' | 'stripe' | 'external' | 'lead_form'
  action_value:     string
  whatsapp_number:  string
  whatsapp_message: string
  sort_order:       number
  created_at?:      string
  updated_at?:      string
}

// ─────────────────────────────────────────────
// DESIGN SYSTEM DEFINITIONS
// ─────────────────────────────────────────────

export interface DesignSystemDef {
  id:          DesignSystem
  name:        string
  nameAr:      string
  description: string
  brandTypes:  string[]

  fonts: {
    serif:       string
    sans:        string
    display:     string
    arabic:      string
    googleFonts: string
  }

  defaultPalette: {
    bg:      string
    bg2:     string
    bg3:     string
    ink:     string
    ink2:    string
    ink3:    string
    ink4:    string
    dark:    string
    accent:  string
    isLight: boolean
  }

  personality:     string
  copyTone:        string
  defaultSections: SectionType[]
}

export const DESIGN_SYSTEMS: Record<DesignSystem, DesignSystemDef> = {
  editorial: {
    id: 'editorial',
    name: 'Editorial',
    nameAr: 'إبداعي',
    description: 'Magazine aesthetic. Type as art. Asymmetric. Opinionated.',
    brandTypes: ['beauty_wellness','fashion_lifestyle','digital_product'],
    fonts: {
      serif:      "'Playfair Display', Georgia, serif",
      sans:       "'Syne', system-ui, sans-serif",
      display:    "'Playfair Display', Georgia, serif",
      arabic:     "'Tajawal', system-ui, sans-serif",
      googleFonts: 'Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Syne:wght@400;500;600;700;800',
    },
    defaultPalette: {
      bg:      '#F7F3ED',
      bg2:     '#EDE8E0',
      bg3:     '#E2DBD0',
      ink:     '#0F0D0A',
      ink2:    'rgba(15,13,10,0.55)',
      ink3:    'rgba(15,13,10,0.28)',
      ink4:    'rgba(15,13,10,0.10)',
      dark:    '#13110E',
      accent:  '#8B6914',
      isLight: true,
    },
    personality: 'magazine editorial — asymmetric grids, ghost watermark text, oversized numbers, staggered layouts, type that stops the scroll',
    copyTone: 'founder with conviction. First person. Short sentences that earn the next. Specific details. No filler.',
    defaultSections: ['hero','marquee','statement','products','pull_quote','story','reviews','form','footer'],
  },

  minimal: {
    id: 'minimal',
    name: 'Minimal',
    nameAr: 'أنيق',
    description: 'Swiss precision. Restraint as luxury. Objects speak.',
    brandTypes: ['beauty_wellness','home_living','fashion_lifestyle'],
    fonts: {
      serif:      "'Cormorant Garamond', Georgia, serif",
      sans:       "'Inter', system-ui, sans-serif",
      display:    "'Cormorant Garamond', Georgia, serif",
      arabic:     "'Tajawal', system-ui, sans-serif",
      googleFonts: 'Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Inter:wght@300;400;500',
    },
    defaultPalette: {
      bg:      '#FAFAF8',
      bg2:     '#F2F0EC',
      bg3:     '#E8E4DE',
      ink:     '#0A0907',
      ink2:    'rgba(10,9,7,0.45)',
      ink3:    'rgba(10,9,7,0.22)',
      ink4:    'rgba(10,9,7,0.10)',
      dark:    '#0A0907',
      accent:  '#9A7B3C',
      isLight: true,
    },
    personality: 'Swiss precision — everything at weight 300, 1px borders as the entire design system, roman numerals, subtle grid lines, the product is the hero',
    copyTone: 'understated authority. No adjectives that dont earn their place. Facts over claims. The product speaks — copy stays out of the way.',
    defaultSections: ['hero','products','pull_quote','story','reviews','form','footer'],
  },

  bold: {
    id: 'bold',
    name: 'Bold',
    nameAr: 'جريء',
    description: 'Energy. Confidence. Display type. High contrast.',
    brandTypes: ['physical_product','digital_product'],
    fonts: {
      serif:      "'Bebas Neue', Impact, sans-serif",
      sans:       "'Space Grotesk', system-ui, sans-serif",
      display:    "'Bebas Neue', Impact, sans-serif",
      arabic:     "'Tajawal', system-ui, sans-serif",
      googleFonts: 'Bebas+Neue&family=Space+Grotesk:wght@300;400;500;600;700',
    },
    defaultPalette: {
      bg:      '#080808',
      bg2:     '#101010',
      bg3:     '#181818',
      ink:     '#F5F4F0',
      ink2:    'rgba(245,244,240,0.65)',
      ink3:    'rgba(245,244,240,0.25)',
      ink4:    'rgba(245,244,240,0.08)',
      dark:    '#040404',
      accent:  '#E8200A',
      isLight: false,
    },
    personality: 'sport and performance — Bebas Neue display type, outline type mixing with solid, ghost brand name bleeding behind sections, stat bars, red is the only accent that matters',
    copyTone: 'direct challenge. Second person. The brand has a position and defends it. Calls out what is wrong with the industry.',
    defaultSections: ['hero','marquee','products','statement','story','reviews','form','footer'],
  },

  warm: {
    id: 'warm',
    name: 'Warm',
    nameAr: 'دافئ',
    description: 'The founder is present. Craft. Origin. Human.',
    brandTypes: ['food_beverage','home_living','physical_product'],
    fonts: {
      serif:      "'Lora', Georgia, serif",
      sans:       "'Jost', system-ui, sans-serif",
      display:    "'Lora', Georgia, serif",
      arabic:     "'Tajawal', system-ui, sans-serif",
      googleFonts: 'Lora:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Jost:wght@300;400;500;600',
    },
    defaultPalette: {
      bg:      '#F5EFE2',
      bg2:     '#EDE4D0',
      bg3:     '#E0D4BB',
      ink:     '#2C1F0E',
      ink2:    'rgba(44,31,14,0.55)',
      ink3:    'rgba(44,31,14,0.28)',
      ink4:    'rgba(44,31,14,0.10)',
      dark:    '#2C1F0E',
      accent:  '#8C5E1A',
      isLight: true,
    },
    personality: 'artisan warmth — founder note card with wax seal, ingredient sourcing with provenance, stacked product visuals, pulsing live dot, the person behind the brand is always visible',
    copyTone: 'founder writing to a friend. Specific details — farm names, harvest dates, exact ingredients. Story over claims. The why matters more than the what.',
    defaultSections: ['hero','products','founder_note','ingredients','reviews','form','footer'],
  },
}

// ─────────────────────────────────────────────
// AI DECISION HELPERS
// ─────────────────────────────────────────────

export function getDesignSystemForBrand(
  brandType: string,
  brandVoice: string,
  _brandColors: unknown
): DesignSystem {
  const voice = (brandVoice || '').toLowerCase()

  if (voice.includes('luxury') || voice.includes('clinical')
    || voice.includes('minimal') || voice.includes('refined'))
    return 'minimal'
  if (voice.includes('bold') || voice.includes('energetic')
    || voice.includes('powerful') || voice.includes('direct'))
    return 'bold'
  if (voice.includes('warm') || voice.includes('artisan')
    || voice.includes('craft') || voice.includes('honest')
    || voice.includes('founder'))
    return 'warm'

  const map: Record<string, DesignSystem> = {
    beauty_wellness:   'editorial',
    fashion_lifestyle: 'editorial',
    food_beverage:     'warm',
    physical_product:  'bold',
    digital_product:   'editorial',
    home_living:       'minimal',
  }
  return map[brandType] || 'editorial'
}

export function resolveAccent(
  brandColors: Record<string, string> | null | undefined,
  profile: Record<string, any> | null | undefined,
  designSystem: DesignSystemDef,
  aiAccent?: string
): string {
  if (brandColors?.primary
    && /^#[0-9A-Fa-f]{6}$/.test(brandColors.primary))
    return brandColors.primary
  if (profile?.visual?.accent_color
    && /^#[0-9A-Fa-f]{6}$/.test(profile.visual.accent_color))
    return profile.visual.accent_color
  if (aiAccent && /^#[0-9A-Fa-f]{6}$/.test(aiAccent))
    return aiAccent
  return designSystem.defaultPalette.accent
}
