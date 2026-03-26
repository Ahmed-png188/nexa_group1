// Packaging design archetype system

export type DesignArchetype =
  | 'luxury'
  | 'minimal'
  | 'bold'
  | 'organic'
  | 'tech'
  | 'playful'
  | 'classic'

export interface FullDesignSpec {
  archetype:         DesignArchetype
  bg_color:          string
  text_color:        string
  accent_color:      string
  brand_name_display: string
  tagline_display?:  string
  main_copy?:        string
  secondary_copy?:   string
  design_style:      string
  layout:            string
  font_weight:       string
  special_elements?: string[]
  print_notes?:      string
  logo_url?:         string
  dims?: {
    width_mm:  number
    height_mm: number
    depth_mm:  number
    bleed_mm:  number
  }
}

export interface ArchetypeProfile {
  id:          DesignArchetype
  name:        string
  description: string
  bg_default:  string
  text_default: string
  accent_default: string
  font_weight: string
  design_style: string
}

export const ARCHETYPE_PROFILES: Record<DesignArchetype, ArchetypeProfile> = {
  luxury: {
    id:           'luxury',
    name:         'Luxury',
    description:  'Premium black & gold, refined typography',
    bg_default:   '#0A0A0A',
    text_default: '#F5E6C0',
    accent_default: '#C9A84C',
    font_weight:  'thin',
    design_style: 'minimal-luxury',
  },
  minimal: {
    id:           'minimal',
    name:         'Minimal',
    description:  'Clean white space, understated elegance',
    bg_default:   '#FAFAFA',
    text_default: '#111111',
    accent_default: '#000000',
    font_weight:  'light',
    design_style: 'clean-minimal',
  },
  bold: {
    id:           'bold',
    name:         'Bold',
    description:  'High contrast, strong typography',
    bg_default:   '#111111',
    text_default: '#FFFFFF',
    accent_default: '#FF3300',
    font_weight:  'black',
    design_style: 'bold-graphic',
  },
  organic: {
    id:           'organic',
    name:         'Organic',
    description:  'Earth tones, natural feel',
    bg_default:   '#F2EDE0',
    text_default: '#2C2416',
    accent_default: '#6B8A4E',
    font_weight:  'regular',
    design_style: 'organic-natural',
  },
  tech: {
    id:           'tech',
    name:         'Tech',
    description:  'Dark, precise, futuristic',
    bg_default:   '#0D0D14',
    text_default: '#E0E8FF',
    accent_default: '#00AAFF',
    font_weight:  'medium',
    design_style: 'tech-precision',
  },
  playful: {
    id:           'playful',
    name:         'Playful',
    description:  'Bright colours, fun energy',
    bg_default:   '#FFF4E0',
    text_default: '#1A1A1A',
    accent_default: '#FF6B35',
    font_weight:  'bold',
    design_style: 'playful-vibrant',
  },
  classic: {
    id:           'classic',
    name:         'Classic',
    description:  'Timeless, traditional, trustworthy',
    bg_default:   '#F8F4EC',
    text_default: '#1C1410',
    accent_default: '#8B1A1A',
    font_weight:  'regular',
    design_style: 'classic-heritage',
  },
}

// Detect archetype from brand voice/tone keywords
export function detectArchetype(brandVoice: string, brandTone: string): DesignArchetype {
  const text = `${brandVoice} ${brandTone}`.toLowerCase()
  if (/luxury|premium|exclusive|elegant|refined/.test(text)) return 'luxury'
  if (/minimal|clean|simple|pure|white/.test(text)) return 'minimal'
  if (/bold|strong|powerful|impact|energy/.test(text)) return 'bold'
  if (/organic|natural|eco|earth|green|sustainable/.test(text)) return 'organic'
  if (/tech|digital|smart|innovative|future/.test(text)) return 'tech'
  if (/fun|playful|joy|happy|bright|colorful/.test(text)) return 'playful'
  if (/classic|traditional|heritage|trust|quality/.test(text)) return 'classic'
  return 'minimal'
}
