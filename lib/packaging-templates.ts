export interface PackagingDimensions {
  width_mm:  number
  height_mm: number
  depth_mm:  number
  bleed_mm:  number
}

export interface PackagingTemplate {
  id:         string
  type:       'bag' | 'box' | 'label' | 'pouch' | 'sleeve'
  name_en:    string
  name_ar:    string
  desc_en:    string
  desc_ar:    string
  sizes:      { id: string; label_en: string; label_ar: string; dims: PackagingDimensions }[]
}

export const PACKAGING_TEMPLATES: PackagingTemplate[] = [
  {
    id: 'bag', type: 'bag',
    name_en: 'Retail bag', name_ar: 'كيس بيع',
    desc_en: 'Paper or plastic bags for retail', desc_ar: 'أكياس ورق أو بلاستيك للبيع بالتجزئة',
    sizes: [
      { id:'bag_xs', label_en:'Extra small (13×6×20cm)', label_ar:'صغير جداً (13×6×20 سم)', dims:{ width_mm:130, height_mm:200, depth_mm:60, bleed_mm:3 } },
      { id:'bag_sm', label_en:'Small (18×8×24cm)',       label_ar:'صغير (18×8×24 سم)',        dims:{ width_mm:180, height_mm:240, depth_mm:80, bleed_mm:3 } },
      { id:'bag_md', label_en:'Medium (25×10×32cm)',     label_ar:'متوسط (25×10×32 سم)',      dims:{ width_mm:250, height_mm:320, depth_mm:100, bleed_mm:3 } },
      { id:'bag_lg', label_en:'Large (32×12×40cm)',      label_ar:'كبير (32×12×40 سم)',       dims:{ width_mm:320, height_mm:400, depth_mm:120, bleed_mm:3 } },
    ],
  },
  {
    id: 'box', type: 'box',
    name_en: 'Product box', name_ar: 'صندوق منتج',
    desc_en: 'Folding carton or rigid box', desc_ar: 'علبة كرتون أو صندوق صلب',
    sizes: [
      { id:'box_xs',   label_en:'Gift box small (8×8×4cm)',    label_ar:'علبة هدايا صغيرة (8×8×4 سم)',    dims:{ width_mm:80,  height_mm:80,  depth_mm:40,  bleed_mm:3 } },
      { id:'box_sm',   label_en:'Standard (12×8×6cm)',         label_ar:'قياسي (12×8×6 سم)',               dims:{ width_mm:120, height_mm:80,  depth_mm:60,  bleed_mm:3 } },
      { id:'box_md',   label_en:'Medium (20×15×8cm)',          label_ar:'متوسط (20×15×8 سم)',              dims:{ width_mm:200, height_mm:150, depth_mm:80,  bleed_mm:3 } },
      { id:'box_lg',   label_en:'Large (30×20×10cm)',          label_ar:'كبير (30×20×10 سم)',              dims:{ width_mm:300, height_mm:200, depth_mm:100, bleed_mm:3 } },
      { id:'box_sq',   label_en:'Square (15×15×15cm)',         label_ar:'مربع (15×15×15 سم)',              dims:{ width_mm:150, height_mm:150, depth_mm:150, bleed_mm:3 } },
      { id:'box_shoe', label_en:'Shoe box (32×20×12cm)',       label_ar:'علبة أحذية (32×20×12 سم)',        dims:{ width_mm:320, height_mm:200, depth_mm:120, bleed_mm:3 } },
    ],
  },
  {
    id: 'label', type: 'label',
    name_en: 'Product label', name_ar: 'ملصق منتج',
    desc_en: 'Sticker labels for bottles and jars', desc_ar: 'ملصقات للزجاجات والبرطمانات',
    sizes: [
      { id:'label_round_sm', label_en:'Round 5cm',        label_ar:'دائري 5 سم',    dims:{ width_mm:50,  height_mm:50,  depth_mm:0, bleed_mm:2 } },
      { id:'label_round_md', label_en:'Round 8cm',        label_ar:'دائري 8 سم',    dims:{ width_mm:80,  height_mm:80,  depth_mm:0, bleed_mm:2 } },
      { id:'label_rect_sm',  label_en:'Rectangle 7×5cm', label_ar:'مستطيل 7×5 سم', dims:{ width_mm:70,  height_mm:50,  depth_mm:0, bleed_mm:2 } },
      { id:'label_rect_md',  label_en:'Rectangle 10×7cm',label_ar:'مستطيل 10×7 سم',dims:{ width_mm:100, height_mm:70,  depth_mm:0, bleed_mm:2 } },
      { id:'label_oval',     label_en:'Oval 9×6cm',       label_ar:'بيضاوي 9×6 سم', dims:{ width_mm:90,  height_mm:60,  depth_mm:0, bleed_mm:2 } },
      { id:'label_custom',   label_en:'Custom size',      label_ar:'مقاس مخصص',     dims:{ width_mm:0,   height_mm:0,   depth_mm:0, bleed_mm:2 } },
    ],
  },
  {
    id: 'pouch', type: 'pouch',
    name_en: 'Stand-up pouch', name_ar: 'كيس واقف',
    desc_en: 'Flexible pouches for food, coffee, cosmetics', desc_ar: 'أكياس مرنة للطعام والقهوة ومستحضرات التجميل',
    sizes: [
      { id:'pouch_sm', label_en:'Small (10×16cm)',  label_ar:'صغير (10×16 سم)',  dims:{ width_mm:100, height_mm:160, depth_mm:40, bleed_mm:3 } },
      { id:'pouch_md', label_en:'Medium (14×22cm)', label_ar:'متوسط (14×22 سم)', dims:{ width_mm:140, height_mm:220, depth_mm:60, bleed_mm:3 } },
      { id:'pouch_lg', label_en:'Large (18×28cm)',  label_ar:'كبير (18×28 سم)',  dims:{ width_mm:180, height_mm:280, depth_mm:80, bleed_mm:3 } },
    ],
  },
  {
    id: 'sleeve', type: 'sleeve',
    name_en: 'Wrap sleeve', name_ar: 'غلاف ملتفّ',
    desc_en: 'Wrap-around sleeve for boxes or bottles', desc_ar: 'غلاف يلتف حول العلب أو الزجاجات',
    sizes: [
      { id:'sleeve_bottle', label_en:'Bottle sleeve (8×12cm)',    label_ar:'غلاف زجاجة (8×12 سم)',    dims:{ width_mm:80,  height_mm:120, depth_mm:0, bleed_mm:2 } },
      { id:'sleeve_box_sm', label_en:'Box sleeve small (20×8cm)', label_ar:'غلاف علبة صغير (20×8 سم)',  dims:{ width_mm:200, height_mm:80,  depth_mm:0, bleed_mm:2 } },
      { id:'sleeve_box_md', label_en:'Box sleeve medium (30×10cm)',label_ar:'غلاف علبة متوسط (30×10 سم)',dims:{ width_mm:300, height_mm:100, depth_mm:0, bleed_mm:2 } },
    ],
  },
]

export function getTemplate(type: string): PackagingTemplate | undefined {
  return PACKAGING_TEMPLATES.find(t => t.id === type)
}

export function getSize(type: string, sizeId: string) {
  return getTemplate(type)?.sizes.find(s => s.id === sizeId)
}
