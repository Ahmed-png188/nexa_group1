// ── Landing Page Design Systems ──────────────────────────────────────────────
// Four complete visual philosophies — not themes with colour swaps.

export type DesignSystem =
  | 'editorial'
  | 'minimal_architect'
  | 'bold_expressionist'
  | 'warm_storyteller'

export interface DesignSystemDef {
  id:          DesignSystem
  name:        string
  description: string
  brandTypes:  string[]
  fonts: {
    serif:       string
    sans:        string
    googleFonts: string
  }
  palette: {
    bg:      string
    bg2:     string
    bg3:     string
    ink:     string
    ink2:    string
    ink3:    string
    ink4:    string
    dark:    string
    accent:  string   // default — overridden by brand colors
    isLight: boolean
  }
  personality: string   // used in AI prompt
  copyTone:    string   // used in copywriter prompt
  sections:    string[] // default section order
}

export const DESIGN_SYSTEMS: Record<DesignSystem, DesignSystemDef> = {
  editorial: {
    id:          'editorial',
    name:        'Editorial',
    description: 'Magazine aesthetic. Asymmetric grids. Type as art. For brands with a point of view.',
    brandTypes:  ['beauty_wellness','fashion_lifestyle','digital_product'],
    fonts: {
      serif:       "'Playfair Display', Georgia, serif",
      sans:        "'Syne', system-ui, sans-serif",
      googleFonts: 'Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Syne:wght@400;500;600;700;800',
    },
    palette: {
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
    personality: 'editorial magazine — asymmetric, typographic, opinionated. Ghost watermark text. Serif headlines. Oversized numbers. Staggered layouts.',
    copyTone:    'founder with conviction. First person. Short sentences. Each sentence earns the next.',
    sections:    ['hero','marquee','statement','products','pull_quote','story','reviews','form','footer'],
  },

  minimal_architect: {
    id:          'minimal_architect',
    name:        'Minimal Architect',
    description: 'Luxury restraint. 1px borders as design. Objects over words.',
    brandTypes:  ['beauty_wellness','home_living','fashion_lifestyle'],
    fonts: {
      serif:       "'Cormorant Garamond', Georgia, serif",
      sans:        "'Inter', system-ui, sans-serif",
      googleFonts: 'Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Inter:wght@300;400;500',
    },
    palette: {
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
    personality: 'Swiss precision. Everything at weight 300. 1px borders as the whole grid. Roman numerals. Uppercase tracking. The product is the hero — text is secondary.',
    copyTone:    'understated authority. No adjectives that do not earn their place. Facts over claims. The product speaks.',
    sections:    ['hero','strip','products','philosophy','pull_quote_dark','story','reviews','form','footer'],
  },

  bold_expressionist: {
    id:          'bold_expressionist',
    name:        'Bold Expressionist',
    description: 'Energy. Confidence. Bebas Neue display type. Black and red.',
    brandTypes:  ['physical_product','digital_product'],
    fonts: {
      serif:       "'Bebas Neue', Impact, sans-serif",
      sans:        "'Space Grotesk', system-ui, sans-serif",
      googleFonts: 'Bebas+Neue&family=Space+Grotesk:wght@300;400;500;600;700',
    },
    palette: {
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
    personality: 'sport and performance. Bebas Neue display type. Outline type mixing with solid. Ghost brand name bleeding behind sections. Stat bar. Red is the only colour that matters.',
    copyTone:    'direct challenge. No fluff. Second person. The brand has a position and defends it. Calls out what is wrong with the industry.',
    sections:    ['hero','marquee','products','statement','story','reviews','form','footer'],
  },

  warm_storyteller: {
    id:          'warm_storyteller',
    name:        'Warm Storyteller',
    description: 'The founder is present. Craft. Origin. Small batch. Human.',
    brandTypes:  ['food_beverage','home_living','physical_product'],
    fonts: {
      serif:       "'Lora', Georgia, serif",
      sans:        "'Jost', system-ui, sans-serif",
      googleFonts: 'Lora:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Jost:wght@300;400;500;600',
    },
    palette: {
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
    personality: 'artisan warmth with intention. Founder note card with wax seal. Ingredient sourcing section. Stacked product visuals. Pulsing live dot. The person behind the brand is always visible.',
    copyTone:    'founder writing to a friend. Specific details — farm names, harvest dates, exact ingredients. Story over claims.',
    sections:    ['hero','band','intro','products','founder_note','ingredients','reviews','form','footer'],
  },
}

export function selectDesignSystem(
  brandType: string,
  brandVoice: string,
  aiChoice?: string | null
): DesignSystem {
  if (aiChoice && aiChoice in DESIGN_SYSTEMS) return aiChoice as DesignSystem

  const v = (brandVoice || '').toLowerCase()
  if (v.includes('luxury') || v.includes('premium') || v.includes('clinical'))
    return 'minimal_architect'
  if (v.includes('bold') || v.includes('energetic') || v.includes('powerful') || v.includes('performance'))
    return 'bold_expressionist'
  if (v.includes('warm') || v.includes('artisan') || v.includes('craft') || v.includes('honest'))
    return 'warm_storyteller'

  const defaults: Record<string, DesignSystem> = {
    beauty_wellness:   'editorial',
    fashion_lifestyle: 'editorial',
    food_beverage:     'warm_storyteller',
    physical_product:  'bold_expressionist',
    digital_product:   'editorial',
    home_living:       'minimal_architect',
  }
  return (defaults[brandType] as DesignSystem) || 'editorial'
}

export function resolveAccent(
  brandColors: any,
  designSystem: DesignSystemDef,
  aiAccent?: string
): string {
  if (aiAccent && /^#[0-9A-Fa-f]{6}$/.test(aiAccent)) return aiAccent
  if (brandColors?.primary && /^#[0-9A-Fa-f]{6}$/.test(brandColors.primary))
    return brandColors.primary
  return designSystem.palette.accent
}
