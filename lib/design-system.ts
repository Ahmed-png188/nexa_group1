/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║           NEXA DESIGN SYSTEM — SINGLE SOURCE OF TRUTH    ║
 * ║           Reference: ElevenLabs — warm, clean, premium   ║
 * ║           Never hardcode values. Always import from here. ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────
// COLORS
// ─────────────────────────────────────────────────────────────
export const colors = {

  // Backgrounds — warm black scale
  bg: {
    base:     '#0C0C0C',  // Page background — warm near-black
    surface:  '#141414',  // Cards, panels, sidebar
    elevated: '#1A1A1A',  // Hover states, dropdowns, modals
    overlay:  '#202020',  // Tooltips, popovers
  },

  // Borders
  border: {
    subtle:  'rgba(255,255,255,0.06)',  // Dividers, secondary
    default: 'rgba(255,255,255,0.10)',  // Cards — clean and visible
    strong:  'rgba(255,255,255,0.16)',  // Focused inputs, hover cards
    focus:   'rgba(255,255,255,0.28)',  // Active input ring
  },

  // Accent — Nexa identity color
  accent: {
    cyan:       '#00AAFF',
    cyanDim:    'rgba(0,170,255,0.10)',
    cyanBorder: 'rgba(0,170,255,0.20)',
    cyanStrong: 'rgba(0,170,255,0.30)',
  },

  // Text hierarchy — 4 levels
  text: {
    primary:   '#FFFFFF',                // Headlines, key values
    secondary: 'rgba(255,255,255,0.72)', // Body text, descriptions
    tertiary:  'rgba(255,255,255,0.42)', // Labels, metadata, placeholders
    disabled:  'rgba(255,255,255,0.20)', // Disabled states
  },

  // Semantic — status colors
  semantic: {
    success:       '#22C55E',
    successDim:    'rgba(34,197,94,0.10)',
    successBorder: 'rgba(34,197,94,0.20)',
    warning:       '#F59E0B',
    warningDim:    'rgba(245,158,11,0.10)',
    warningBorder: 'rgba(245,158,11,0.20)',
    error:         '#EF4444',
    errorDim:      'rgba(239,68,68,0.10)',
    errorBorder:   'rgba(239,68,68,0.20)',
    info:          '#00AAFF',
    infoDim:       'rgba(0,170,255,0.10)',
    infoBorder:    'rgba(0,170,255,0.20)',
  },

  // White CTA
  cta: {
    bg:       '#FFFFFF',
    text:     '#0C0C0C',
    hover:    'rgba(255,255,255,0.88)',
  },

} as const

// ─────────────────────────────────────────────────────────────
// TYPOGRAPHY
// ─────────────────────────────────────────────────────────────
export const typography = {

  // Font — Geist only
  font: {
    sans: "'Geist', -apple-system, sans-serif",
    mono: "'Geist Mono', monospace",
  },

  // Scale — every text size in Nexa
  size: {
    xs:   '11px',  // Badges, tags, metadata
    sm:   '12px',  // Labels, captions, helper text
    base: '13px',  // Body text, descriptions, inputs
    md:   '14px',  // Secondary headings, card titles
    lg:   '16px',  // Section headings
    xl:   '20px',  // Page sub-headings
    '2xl':'24px',  // Page titles
    '3xl':'32px',  // Hero numbers, display stats
    '4xl':'48px',  // Large hero text
  },

  // Weight
  weight: {
    regular: 400,
    medium:  500,
    semibold:600,
    bold:    700,
  },

  // Line height
  leading: {
    tight:   1.2,
    snug:    1.4,
    normal:  1.6,
    relaxed: 1.8,
  },

  // Letter spacing
  tracking: {
    tight:  '-0.03em',
    snug:   '-0.02em',
    normal: '-0.01em',
    wide:   '0.04em',
    wider:  '0.08em',
    widest: '0.12em',
  },

} as const

// ─────────────────────────────────────────────────────────────
// SPACING — ElevenLabs style, spacious
// ─────────────────────────────────────────────────────────────
export const spacing = {
  px:   '1px',
  0.5:  '2px',
  1:    '4px',
  1.5:  '6px',
  2:    '8px',
  2.5:  '10px',
  3:    '12px',
  4:    '16px',
  5:    '20px',
  6:    '24px',
  7:    '28px',
  8:    '32px',
  10:   '40px',
  12:   '48px',
  16:   '64px',
  20:   '80px',

  // Semantic spacing
  cardPadding:      '24px',      // Inside every card
  cardGap:          '12px',      // Between cards in a grid
  pagePadding:      '32px 36px', // Page content padding
  sectionGap:       '32px',      // Between page sections
  elementGap:       '12px',      // Between elements inside a section
  inlineGap:        '8px',       // Between inline elements
  inputPadding:     '10px 14px', // Inside text inputs
  buttonPaddingSm:  '7px 14px',  // Small buttons
  buttonPaddingMd:  '9px 18px',  // Medium buttons (default)
  buttonPaddingLg:  '11px 24px', // Large buttons / CTAs

} as const

// ─────────────────────────────────────────────────────────────
// RADIUS — 10px system
// ─────────────────────────────────────────────────────────────
export const radius = {
  sm:   '6px',   // Tags, badges, small elements
  md:   '10px',  // Buttons, inputs, cards (default)
  lg:   '14px',  // Large cards, modals, panels
  xl:   '18px',  // Hero cards, feature sections
  full: '9999px', // Pills, avatars, tags
} as const

// ─────────────────────────────────────────────────────────────
// LAYOUT
// ─────────────────────────────────────────────────────────────
export const layout = {
  sidebarWidth:   '60px',   // Icon-only sidebar
  topbarHeight:   '54px',   // Top navigation bar
  chatWidth:      '340px',  // Right chat panel
  pageMaxWidth:   '1200px', // Max content width
  contentWidth:   '860px',  // Centered content max width
} as const

// ─────────────────────────────────────────────────────────────
// COMPONENT SPECS — exact rules for every component
// ─────────────────────────────────────────────────────────────

export const components = {

  // ── CARDS ──────────────────────────────────────────────────
  card: {
    // Default card — used everywhere
    default: {
      background:   '#141414',
      border:       '1px solid rgba(255,255,255,0.10)',
      borderRadius: '10px',
      padding:      '24px',
    },
    // Hover state
    hover: {
      border:      '1px solid rgba(255,255,255,0.16)',
      background:  '#181818',
    },
    // Active / selected card
    active: {
      border:      '1px solid rgba(0,170,255,0.30)',
      background:  'rgba(0,170,255,0.05)',
    },
    // Accent card — cyan tinted, for featured content
    accent: {
      background:   'rgba(0,170,255,0.05)',
      border:       '1px solid rgba(0,170,255,0.20)',
      borderRadius: '10px',
      padding:      '24px',
    },
    // Danger card — for errors, warnings
    danger: {
      background:   'rgba(239,68,68,0.05)',
      border:       '1px solid rgba(239,68,68,0.20)',
      borderRadius: '10px',
      padding:      '24px',
    },
  },

  // ── BUTTONS ────────────────────────────────────────────────
  button: {
    // Primary — white bg, black text
    primary: {
      background:   '#FFFFFF',
      color:        '#0C0C0C',
      border:       'none',
      borderRadius: '10px',
      padding:      '9px 18px',
      fontSize:     '13px',
      fontWeight:   600,
      hover: {
        background: 'rgba(255,255,255,0.88)',
      },
    },
    // Secondary — ghost with border
    secondary: {
      background:   'transparent',
      color:        'rgba(255,255,255,0.72)',
      border:       '1px solid rgba(255,255,255,0.10)',
      borderRadius: '10px',
      padding:      '9px 18px',
      fontSize:     '13px',
      fontWeight:   500,
      hover: {
        background:  'rgba(255,255,255,0.06)',
        borderColor: 'rgba(255,255,255,0.16)',
        color:       '#FFFFFF',
      },
    },
    // Accent — cyan tinted
    accent: {
      background:   'rgba(0,170,255,0.10)',
      color:        '#00AAFF',
      border:       '1px solid rgba(0,170,255,0.20)',
      borderRadius: '10px',
      padding:      '9px 18px',
      fontSize:     '13px',
      fontWeight:   600,
      hover: {
        background:  'rgba(0,170,255,0.16)',
        borderColor: 'rgba(0,170,255,0.30)',
      },
    },
    // Danger — red tinted
    danger: {
      background:   'rgba(239,68,68,0.08)',
      color:        '#EF4444',
      border:       '1px solid rgba(239,68,68,0.20)',
      borderRadius: '10px',
      padding:      '9px 18px',
      fontSize:     '13px',
      fontWeight:   600,
    },
    // Icon button — square, no label
    icon: {
      width:        '36px',
      height:       '36px',
      background:   'transparent',
      border:       '1px solid transparent',
      borderRadius: '10px',
      color:        'rgba(255,255,255,0.42)',
      hover: {
        background:  'rgba(255,255,255,0.06)',
        borderColor: 'rgba(255,255,255,0.10)',
        color:       'rgba(255,255,255,0.88)',
      },
      active: {
        background:  'rgba(0,170,255,0.10)',
        borderColor: 'rgba(0,170,255,0.20)',
        color:       '#00AAFF',
      },
    },
  },

  // ── INPUTS ─────────────────────────────────────────────────
  input: {
    default: {
      background:   'rgba(255,255,255,0.04)',
      border:       '1px solid rgba(255,255,255,0.10)',
      borderRadius: '10px',
      padding:      '10px 14px',
      fontSize:     '13px',
      color:        '#FFFFFF',
      placeholder:  'rgba(255,255,255,0.28)',
    },
    focus: {
      borderColor: 'rgba(255,255,255,0.28)',
      boxShadow:   '0 0 0 3px rgba(255,255,255,0.04)',
      background:  'rgba(255,255,255,0.06)',
    },
    error: {
      borderColor: 'rgba(239,68,68,0.40)',
      boxShadow:   '0 0 0 3px rgba(239,68,68,0.06)',
    },
  },

  // ── BADGES ─────────────────────────────────────────────────
  badge: {
    // Base badge — all badges share these
    base: {
      display:      'inline-flex',
      alignItems:   'center',
      gap:          '4px',
      padding:      '3px 8px',
      borderRadius: '6px',
      fontSize:     '11px',
      fontWeight:   600,
      letterSpacing:'0.02em',
    },
    // Variants
    default: {
      background: 'rgba(255,255,255,0.08)',
      color:      'rgba(255,255,255,0.60)',
      border:     '1px solid rgba(255,255,255,0.10)',
    },
    cyan: {
      background: 'rgba(0,170,255,0.10)',
      color:      '#00AAFF',
      border:     '1px solid rgba(0,170,255,0.20)',
    },
    success: {
      background: 'rgba(34,197,94,0.10)',
      color:      '#22C55E',
      border:     '1px solid rgba(34,197,94,0.20)',
    },
    warning: {
      background: 'rgba(245,158,11,0.10)',
      color:      '#F59E0B',
      border:     '1px solid rgba(245,158,11,0.20)',
    },
    error: {
      background: 'rgba(239,68,68,0.10)',
      color:      '#EF4444',
      border:     '1px solid rgba(239,68,68,0.20)',
    },
  },

  // ── NAVIGATION ─────────────────────────────────────────────
  nav: {
    sidebar: {
      width:      '60px',
      background: '#141414',
      border:     '1px solid rgba(255,255,255,0.08)',
    },
    item: {
      width:        '40px',
      height:       '40px',
      borderRadius: '10px',
      color:        'rgba(255,255,255,0.35)',
      background:   'transparent',
      border:       '1px solid transparent',
    },
    itemHover: {
      color:      'rgba(255,255,255,0.72)',
      background: 'rgba(255,255,255,0.06)',
    },
    itemActive: {
      color:      '#00AAFF',
      background: 'rgba(0,170,255,0.10)',
      border:     '1px solid rgba(0,170,255,0.20)',
    },
    activeBar: {
      width:        '2px',
      height:       '16px',
      background:   '#00AAFF',
      borderRadius: '0 2px 2px 0',
    },
  },

  // ── TOPBAR ─────────────────────────────────────────────────
  topbar: {
    height:     '54px',
    background: '#141414',
    border:     '1px solid rgba(255,255,255,0.08)',
    padding:    '0 28px',
  },

  // ── TABS ───────────────────────────────────────────────────
  tab: {
    bar: {
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      gap:          '0',
    },
    item: {
      padding:      '10px 16px',
      fontSize:     '13px',
      fontWeight:   500,
      color:        'rgba(255,255,255,0.42)',
      borderBottom: '2px solid transparent',
      marginBottom: '-1px',
    },
    itemHover: {
      color: 'rgba(255,255,255,0.72)',
    },
    itemActive: {
      color:        '#FFFFFF',
      fontWeight:   600,
      borderBottom: '2px solid #00AAFF',
    },
  },

  // ── DIVIDERS ───────────────────────────────────────────────
  divider: {
    default: '1px solid rgba(255,255,255,0.08)',
    strong:  '1px solid rgba(255,255,255,0.12)',
  },

  // ── MODALS ─────────────────────────────────────────────────
  modal: {
    overlay:      'rgba(0,0,0,0.70)',
    background:   '#141414',
    border:       '1px solid rgba(255,255,255,0.12)',
    borderRadius: '14px',
    padding:      '28px',
    shadow:       '0 24px 64px rgba(0,0,0,0.80)',
  },

  // ── TOOLTIPS ───────────────────────────────────────────────
  tooltip: {
    background:   '#202020',
    border:       '1px solid rgba(255,255,255,0.10)',
    borderRadius: '8px',
    padding:      '8px 12px',
    fontSize:     '12px',
    color:        'rgba(255,255,255,0.88)',
    shadow:       '0 8px 24px rgba(0,0,0,0.60)',
  },

  // ── DROPDOWNS ──────────────────────────────────────────────
  dropdown: {
    background:   '#1A1A1A',
    border:       '1px solid rgba(255,255,255,0.10)',
    borderRadius: '10px',
    padding:      '6px',
    shadow:       '0 16px 40px rgba(0,0,0,0.70)',
    item: {
      padding:      '8px 12px',
      borderRadius: '8px',
      fontSize:     '13px',
      color:        'rgba(255,255,255,0.72)',
    },
    itemHover: {
      background: 'rgba(255,255,255,0.06)',
      color:      '#FFFFFF',
    },
    itemDanger: {
      color: '#EF4444',
      hover: { background: 'rgba(239,68,68,0.08)' },
    },
  },

} as const

// ─────────────────────────────────────────────────────────────
// STATES — every interactive state in the system
// ─────────────────────────────────────────────────────────────

export const states = {

  // Loading skeleton
  skeleton: {
    background: 'rgba(255,255,255,0.06)',
    highlight:  'rgba(255,255,255,0.10)',
    borderRadius: '8px',
    animation:  'shimmer 1.5s ease-in-out infinite',
  },

  // Empty state — when no data exists
  empty: {
    iconSize:       '40px',
    iconColor:      'rgba(255,255,255,0.15)',
    titleSize:      '15px',
    titleWeight:    600,
    titleColor:     'rgba(255,255,255,0.72)',
    descSize:       '13px',
    descColor:      'rgba(255,255,255,0.35)',
    gap:            '12px',
    padding:        '48px 24px',
    textAlign:      'center',
  },

  // Error state
  error: {
    iconColor:   '#EF4444',
    titleColor:  '#FFFFFF',
    descColor:   'rgba(255,255,255,0.42)',
    background:  'rgba(239,68,68,0.05)',
    border:      '1px solid rgba(239,68,68,0.15)',
    borderRadius:'10px',
    padding:     '20px 24px',
  },

  // Success state
  success: {
    iconColor:   '#22C55E',
    background:  'rgba(34,197,94,0.05)',
    border:      '1px solid rgba(34,197,94,0.15)',
    borderRadius:'10px',
    padding:     '16px 20px',
  },

  // Processing / AI generating
  processing: {
    dotColor:   '#00AAFF',
    dotSize:    '5px',
    dotGap:     '4px',
    labelColor: 'rgba(255,255,255,0.35)',
    labelSize:  '12px',
  },

  // Disabled
  disabled: {
    opacity: 0.38,
    cursor:  'not-allowed',
  },

} as const

// ─────────────────────────────────────────────────────────────
// PAGE TEMPLATES — layout rules per page type
// ─────────────────────────────────────────────────────────────

export const pageTemplates = {

  // Standard content page
  standard: {
    padding:       '36px 40px',
    maxWidth:      '100%',
    sectionGap:    '32px',
    cardGap:       '12px',
  },

  // Split page — sidebar + main content
  split: {
    sidebarWidth:  '240px',
    gap:           '24px',
    padding:       '32px 36px',
  },

  // Full bleed — no padding, edge to edge (e.g. schedule calendar)
  fullBleed: {
    padding:       '0',
    headerPadding: '24px 32px',
  },

  // Settings page
  settings: {
    padding:       '36px 40px',
    maxWidth:      '720px',
    sectionGap:    '40px',
    labelGap:      '8px',
    fieldGap:      '16px',
  },

} as const

// ─────────────────────────────────────────────────────────────
// TYPOGRAPHY PRESETS — ready to use text styles
// ─────────────────────────────────────────────────────────────

export const textStyles = {

  // Page title — "Studio", "Brand Brain"
  pageTitle: {
    fontSize:      '22px',
    fontWeight:    700,
    letterSpacing: '-0.02em',
    color:         '#FFFFFF',
    lineHeight:    1.2,
  },

  // Page subtitle — "writing on your voice"
  pageSubtitle: {
    fontSize:   '13px',
    fontWeight: 400,
    color:      'rgba(255,255,255,0.42)',
    lineHeight: 1.5,
    marginTop:  '4px',
  },

  // Section heading — "Agents", "Queue"
  sectionHeading: {
    fontSize:      '16px',
    fontWeight:    600,
    letterSpacing: '-0.02em',
    color:         '#FFFFFF',
  },

  // Card title
  cardTitle: {
    fontSize:      '14px',
    fontWeight:    600,
    letterSpacing: '-0.01em',
    color:         '#FFFFFF',
  },

  // Body text
  body: {
    fontSize:   '13px',
    fontWeight: 400,
    color:      'rgba(255,255,255,0.72)',
    lineHeight: 1.65,
  },

  // Label — "TODAY'S PRIORITY"
  label: {
    fontSize:      '10px',
    fontWeight:    600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color:         'rgba(255,255,255,0.35)',
  },

  // Stat number — "489", "89%"
  statNumber: {
    fontSize:      '28px',
    fontWeight:    700,
    letterSpacing: '-0.04em',
    color:         '#FFFFFF',
    lineHeight:    1,
    fontFamily:    "'Geist', sans-serif",
  },

  // Stat label — "CREDITS", "BUILT"
  statLabel: {
    fontSize:      '10px',
    fontWeight:    500,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    color:         'rgba(255,255,255,0.35)',
    marginTop:     '4px',
  },

  // Meta / caption text
  meta: {
    fontSize:   '11px',
    fontWeight: 400,
    color:      'rgba(255,255,255,0.28)',
    lineHeight: 1.5,
  },

  // Link
  link: {
    fontSize:       '13px',
    fontWeight:     500,
    color:          '#00AAFF',
    textDecoration: 'none',
    hover: { textDecoration: 'underline' },
  },

} as const

// ─────────────────────────────────────────────────────────────
// CSS VARIABLES STRING — paste into globals.css
// ─────────────────────────────────────────────────────────────
export const cssVariables = `
  /* ── Nexa Design System — CSS Variables ── */

  /* Backgrounds */
  --bg:         #0C0C0C;
  --surface:    #141414;
  --elevated:   #1A1A1A;
  --overlay:    #202020;

  /* Borders */
  --border-subtle:  rgba(255,255,255,0.06);
  --border:         rgba(255,255,255,0.10);
  --border-strong:  rgba(255,255,255,0.16);
  --border-focus:   rgba(255,255,255,0.28);

  /* Accent */
  --cyan:        #00AAFF;
  --cyan-dim:    rgba(0,170,255,0.10);
  --cyan-border: rgba(0,170,255,0.20);
  --cyan-strong: rgba(0,170,255,0.30);

  /* Text */
  --text-1: #FFFFFF;
  --text-2: rgba(255,255,255,0.72);
  --text-3: rgba(255,255,255,0.42);
  --text-4: rgba(255,255,255,0.20);

  /* Semantic */
  --success:        #22C55E;
  --success-dim:    rgba(34,197,94,0.10);
  --success-border: rgba(34,197,94,0.20);
  --warning:        #F59E0B;
  --warning-dim:    rgba(245,158,11,0.10);
  --warning-border: rgba(245,158,11,0.20);
  --error:          #EF4444;
  --error-dim:      rgba(239,68,68,0.10);
  --error-border:   rgba(239,68,68,0.20);

  /* Layout */
  --sidebar-w:  60px;
  --topbar-h:   54px;
  --chat-w:     340px;

  /* Radius */
  --r-sm: 6px;
  --r:    10px;
  --r-lg: 14px;
  --r-xl: 18px;

  /* Font */
  --sans: 'Geist', -apple-system, sans-serif;
  --mono: 'Geist Mono', monospace;
`

export default {
  colors,
  typography,
  spacing,
  radius,
  components,
  states,
  pageTemplates,
  textStyles,
  cssVariables,
}
