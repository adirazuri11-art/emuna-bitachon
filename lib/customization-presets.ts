// קונפיגי התאמה אישית משותפים — נצרכים גם ע"י הקטלוג הבסיסי וגם המורחב.
import type { CustomizationConfig } from '@/lib/catalog';

export const HEBREW_FONTS = [
  { id: 'classic', label: 'קלאסי (פרנק-ריהל)', cssFamily: 'var(--font-frank)', cssWeight: 500 },
  { id: 'modern', label: 'מודרני (אסיסטנט)', cssFamily: 'var(--font-assistant)', cssWeight: 600 },
  { id: 'bold', label: 'מסורתי מודגש', cssFamily: 'var(--font-frank)', cssWeight: 700 },
];

export const EVENT_TYPES = [
  'בר מצווה',
  'בת מצווה',
  'חתונה',
  'שבת חתן',
  'ברית',
  'חג',
  'מתנה',
  'אירוע עסקי',
];

export const KIPPAH_CUSTOMIZATION: CustomizationConfig = {
  method: 'embroidery', // רקמה אישית על כיפות בד — לא "חריטה"
  maxChars: 20,
  fonts: HEBREW_FONTS,
  colors: [
    { id: 'gold', label: 'זהב', hex: '#D4AF37' },
    { id: 'silver', label: 'כסף', hex: '#C7D0DB' },
    { id: 'white', label: 'לבן', hex: '#F8F6F0' },
    { id: 'tchelet', label: 'תכלת', hex: '#5B8DD9' },
    { id: 'bordeaux', label: 'בורדו', hex: '#8E2434' },
  ],
  positions: [
    { id: 'edge', label: 'שוליים (מסביב)' },
    { id: 'back', label: 'אחורי' },
    { id: 'side', label: 'צד' },
  ],
  symbols: [
    { id: 'magen-david', label: 'מגן דוד' },
    { id: 'crown', label: 'כתר' },
    { id: 'chai', label: 'חי' },
    { id: 'olive', label: 'ענף זית' },
    { id: 'pomegranate', label: 'רימון' },
  ],
  eventTypes: EVENT_TYPES,
  allowLogoUpload: true,
  surcharges: { text: 15, symbol: 10, logo: 25, giftWrap: 18 },
  bulkDiscounts: [
    { minQty: 10, pct: 10 },
    { minQty: 30, pct: 18 },
    { minQty: 50, pct: 25 },
  ],
};

// הטבעה/הקדשה אישית על כיפות פשוטות (פריק/סאטן) — הזמנת כמות לאירועים.
// מינימום 100 יחידות. מתאים לבר מצווה, חתונה, אירוע.
export const PLAIN_KIPPAH_EMBOSS: CustomizationConfig = {
  method: 'emboss', // הטבעת שם/הקדשה על כיפה — "הטבעה"
  maxChars: 24,
  fonts: HEBREW_FONTS,
  colors: [
    { id: 'gold', label: 'הטבעת זהב', hex: '#D4AF37' },
    { id: 'silver', label: 'הטבעת כסף', hex: '#C7D0DB' },
    { id: 'white', label: 'לבן', hex: '#F8F6F0' },
  ],
  positions: [
    { id: 'edge', label: 'שוליים (מסביב)' },
    { id: 'back', label: 'אחורי' },
  ],
  symbols: [
    { id: 'magen-david', label: 'מגן דוד' },
    { id: 'crown', label: 'כתר' },
    { id: 'chai', label: 'חי' },
  ],
  eventTypes: EVENT_TYPES,
  allowLogoUpload: true,
  surcharges: { text: 4, symbol: 3, logo: 6, giftWrap: 0 }, // תוספת ליחידה
  minOrderQty: 100, // מינימום 100 יחידות להזמנת הטבעה
  // הנחת כמות מדורגת — עד 20% מקסימום
  bulkDiscounts: [
    { minQty: 100, pct: 10 },
    { minQty: 300, pct: 15 },
    { minQty: 500, pct: 20 },
  ],
};

export const TALLIT_CUSTOMIZATION: CustomizationConfig = {
  method: 'embroidery',
  maxChars: 30,
  fonts: HEBREW_FONTS,
  colors: [
    { id: 'gold', label: 'רקמת זהב', hex: '#D4AF37' },
    { id: 'silver', label: 'רקמת כסף', hex: '#C7D0DB' },
    { id: 'white', label: 'לבן', hex: '#F8F6F0' },
    { id: 'tchelet', label: 'תכלת', hex: '#5B8DD9' },
  ],
  positions: [
    { id: 'atara', label: 'על העטרה' },
    { id: 'corner', label: 'פינת הטלית' },
  ],
  versePresets: ['עוטה אור כשלמה', 'זה אלי ואנוהו', 'ליהודים היתה אורה'],
  eventTypes: EVENT_TYPES,
  allowLogoUpload: true,
  surcharges: { text: 60, symbol: 30, logo: 80, giftWrap: 35, matchingBag: 180 },
  bulkDiscounts: [{ minQty: 5, pct: 8 }],
};

export const ENGRAVING_SILVER: CustomizationConfig = {
  method: 'engraving',
  maxChars: 25,
  fonts: HEBREW_FONTS,
  colors: [{ id: 'engraved', label: 'חריטה טבעית', hex: '#8A9AAD' }],
  positions: [
    { id: 'front', label: 'חזית' },
    { id: 'base', label: 'בסיס' },
  ],
  eventTypes: EVENT_TYPES,
  allowLogoUpload: false,
  surcharges: { text: 90, symbol: 45, logo: 0, giftWrap: 45 },
  bulkDiscounts: [],
};

export const EMBOSS_LEATHER: CustomizationConfig = {
  method: 'emboss', // הטבעה בחום על עור
  maxChars: 16,
  fonts: HEBREW_FONTS,
  colors: [
    { id: 'gold', label: 'פויל זהב', hex: '#D4AF37' },
    { id: 'blind', label: 'הטבעה עיוורת', hex: '#7A6A50' },
  ],
  positions: [
    { id: 'front-center', label: 'מרכז' },
    { id: 'front-bottom', label: 'למטה' },
  ],
  eventTypes: EVENT_TYPES,
  allowLogoUpload: false,
  surcharges: { text: 35, symbol: 15, logo: 0, giftWrap: 18 },
  bulkDiscounts: [{ minQty: 10, pct: 12 }],
};

export const PRINT_PERSONAL: CustomizationConfig = {
  method: 'print', // הדפסה אישית — כתובות, ברכות ופסוקים
  maxChars: 40,
  fonts: HEBREW_FONTS,
  colors: [
    { id: 'gold', label: 'זהב', hex: '#D4AF37' },
    { id: 'navy', label: 'כחול עמוק', hex: '#1B2A5E' },
    { id: 'black', label: 'שחור', hex: '#1A1A1E' },
  ],
  positions: [{ id: 'bottom', label: 'שורת ההקדשה התחתונה' }],
  eventTypes: EVENT_TYPES,
  allowLogoUpload: false,
  surcharges: { text: 0, symbol: 0, logo: 0, giftWrap: 30 }, // ההתאמה כלולה במחיר
  bulkDiscounts: [],
};
