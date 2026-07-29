// ============================================================
// lib/catalog.ts — שכבת הדאטה המרכזית של הקטלוג
//
// ⚠️ תוכן המחשה זמני: מוצרים, מחירים ומלאי הם דמו עד קבלת
// הסחורה האמיתית. כל מוצר הוא אובייקט אחד — מחליפים תמונה/מחיר/
// מלאי/תיאור כאן בלבד, בלי לגעת באף קומפוננטה.
// כשה-DB יחובר — הקובץ הזה מוחלף בשאילתות Prisma עם אותם טיפוסים.
// ============================================================

import type { ProductCardData } from '@/types';

// ---------- קטגוריות ----------

export interface CategoryInfo {
  slug: string;
  nameHe: string;
  tagline: string;
  description: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    slug: 'tzitzit-tallit',
    nameHe: 'ציציות וטליתות',
    tagline: 'עטיפה של קדושה, מצמר ועד תכלת',
    description:
      'טליתות צמר משובחות בקשירה לפי כל הנוסחים, עם אפשרות לרקמת שם והקדשה אישית על העטרה.',
  },
  {
    slug: 'kippot',
    nameHe: 'כיפות',
    tagline: 'סרוגות, מעוצבות, בהתאמה אישית מלאה',
    description:
      'כיפות סרוגות ואריגות איכות, כולל אריגת שם ועיצוב אישי — מושלם לאירועים, בר מצוות וחתונות.',
  },
  {
    slug: 'headscarves',
    nameHe: 'מטפחות מעוצבות',
    tagline: 'משי, סאטן ועיצוב עדין',
    description: 'מטפחות ראש ממשי טבעי ובדים משובחים, בעיצובים ייחודיים לכל אירוע ולכל יום.',
  },
  {
    slug: 'kiddush-cups',
    nameHe: 'כוסות קידוש',
    tagline: 'כסף טהור לשולחן השבת',
    description:
      'גביעי קידוש מכסף 925 בעבודת יד, עם אפשרות חריטת שם או הקדשה — מתנה שעוברת מדור לדור.',
  },
  {
    slug: 'candlesticks',
    nameHe: 'פמוטים',
    tagline: 'אור של שבת, עיצוב של נצח',
    description: 'פמוטי שבת וחג מכסף אמיתי, מקווים קלאסיים ועד מודרניים — לב הבית היהודי.',
  },
  {
    slug: 'home-judaica',
    nameHe: 'תשמישי קדושה לבית',
    tagline: 'מהמזוזה בפתח ועד החנוכייה בחלון',
    description:
      'מזוזות מהודרות, חנוכיות, סטי הבדלה, נטלות וכלי קודש לבית — הכל עם אישורי כשרות מאומתים.',
  },
  {
    slug: 'mezuzot',
    nameHe: 'מזוזות',
    tagline: 'שמירה בפתח, בכל סגנון',
    description:
      'בתי מזוזה מאלומיניום, אקריליק, זכוכית ומתכת — מגוון עיצובים ומידות לכל דלת בבית ובעסק.',
  },
  {
    slug: 'challah-covers',
    nameHe: 'כיסויי חלה',
    tagline: 'כבוד לשבת על השולחן',
    description:
      'כיסויי חלה מעוצבים בבד, קטיפה ורקמה — להשלמת שולחן השבת והחג במראה חגיגי ומכובד.',
  },
  {
    slug: 'havdalah',
    nameHe: 'הבדלה',
    tagline: 'פרידה מהשבת בטעם ובריח',
    description: 'סטי הבדלה, בשמים ונרות הבדלה מעוצבים — לרגע המפריד בין קודש לחול.',
  },
  {
    slug: 'washing-cups',
    nameHe: 'נטלות ומים אחרונים',
    tagline: 'טהרה של יום-יום',
    description: 'נטלות נטילת ידיים וכלי מים אחרונים בעיצובים קלאסיים ומודרניים לבית ולשולחן.',
  },
  {
    slug: 'blessings',
    nameHe: 'ברכות',
    tagline: 'ברכה לכל פינה בבית',
    description: 'ברכות הבית, ברכת העסק וברכות מעוצבות — למתנה מרגשת ולנוכחות של אמונה בבית.',
  },
  {
    slug: 'gifts-events',
    nameHe: 'מתנות ואירועים',
    tagline: 'המתנה הנכונה לרגעים הגדולים',
    description:
      'מתנות מרגשות לבר מצווה, חתונה, ברית וחנוכת בית — כולל התאמה אישית והזמנות בכמויות לאירועים.',
  },
  {
    slug: 'judaica-jewelry',
    nameHe: 'תכשיטי יודאיקה',
    tagline: 'סמלים של אמונה, קרוב ללב',
    description:
      'שרשראות מגן דוד, תליוני חי וחמסות — תכשיטי כסף וזהב לגברים, לנשים ולילדים, עם אפשרות חריטה.',
  },
  {
    slug: 'jewish-art',
    nameHe: 'אמנות ועיצוב יהודי',
    tagline: 'ברכה על הקיר, יופי בבית',
    description:
      'ברכות הבית, אמנות קיר ירושלמית, חמסות ופסוקים מעוצבים — יצירות שהופכות בית לבית יהודי.',
  },
  {
    slug: 'books-siddurim',
    nameHe: 'ספרים וסידורים',
    tagline: 'מילות התפילה, בכריכה שתחזיק שנים',
    description:
      'סידורים, תהילים, חומשים והגדות בכל הנוסחים — ממהדורות כיס נגישות ועד כריכות עור עם הטבעת שם אישית.',
  },
  {
    slug: 'holidays-moadim',
    nameHe: 'חגים ומועדים',
    tagline: 'מכל חג — היופי שנשאר',
    description:
      'סביבוני חנוכה, קופסות אתרוג, קערות ראש השנה, משלוחי מנות ומגילות — הכלים המהודרים שמלווים את מעגל השנה.',
  },
  {
    slug: 'kids',
    nameHe: 'מוצרים לילדים',
    tagline: 'מסורת שמתחילה בגובה העיניים',
    description:
      'סידורים מאוירים, נטלות צבעוניות, קופות צדקה ומשחקי אותיות — מוצרים שמכניסים ילדים לעולם המצוות באהבה.',
  },
  {
    slug: 'synagogue',
    nameHe: 'בית כנסת ומוסדות',
    tagline: 'כלי קודש ברמת ההידור של הקהילה',
    description:
      'פרוכות, מעילי ספר תורה, ידות, כתרים ולוחות הנצחה — עבודות אומן לבתי כנסת, ישיבות ומוסדות, בהתאמה מלאה.',
  },
  {
    slug: 'shabbat-electric',
    nameHe: 'חשמל ושבת',
    tagline: 'הבית מוכן לשבת — בלחיצת כפתור',
    description:
      'פלטות שבת, מיחמי מים, שעוני שבת ומנורות — מוצרי החשמל שהופכים את השבת לרגועה ומסודרת, באיכות שמחזיקה שנים.',
  },
  {
    slug: 'brit-newborn',
    nameHe: 'ברית ולידה',
    tagline: 'לקבל את הרך הנולד בכבוד',
    description:
      'סטים לברית מילה, כריות רקומות, מתנות ליולדת וברכות לידה ממוסגרות — לרגעים הראשונים והמרגשים של החיים.',
  },
  {
    slug: 'jerusalem-gifts',
    nameHe: 'מזכרות מירושלים',
    tagline: 'פיסה מירושלים, בכל בית',
    description:
      'דגמי בית המקדש, הכותל המערבי ממוסגר, פסלוני רימון, מגנטים וגלויות ברכה — מזכרות ומתנות ברוח ירושלים.',
  },
];

export const getCategory = (slug: string) => CATEGORIES.find((c) => c.slug === slug);

// ---------- טיפוסי מוצר מלאים ----------

export type StockStatus = 'in-stock' | 'made-to-order' | 'coming-soon';
export type ProductBadge =
  | 'new'
  | 'bestseller'
  | 'luxury'
  | 'recommended'
  | 'handmade'
  | 'exclusive'
  | 'limited';

export type Audience = 'men' | 'women' | 'kids' | 'family';

export const AUDIENCE_LABELS: Record<Audience, string> = {
  men: 'לגברים',
  women: 'לנשים',
  kids: 'לילדים',
  family: 'למשפחה',
};

export const OCCASIONS = ['בר מצווה', 'חתונה', 'בית חדש', 'יולדת', 'חג', 'שבת'] as const;

export interface VariantOption {
  id: string;
  label: string;
  priceDelta: number;
  hex?: string; // לאופציות צבע — מוצג כעיגול צבע וגם מזין את התצוגה המקדימה
}

export interface VariantGroup {
  id: string;
  label: string;
  options: VariantOption[];
}

export type CustomizationMethod = 'engraving' | 'embroidery' | 'weaving' | 'emboss' | 'print';

export const METHOD_LABELS: Record<CustomizationMethod, string> = {
  engraving: 'חריטה',
  embroidery: 'רקמה',
  weaving: 'אריגה',
  emboss: 'הטבעה',
  print: 'הדפסה אישית',
};

export interface CustomizationConfig {
  method: CustomizationMethod; // המונח המדויק ללקוח — לא "חריטה" על בד!
  maxChars: number;
  fonts: { id: string; label: string; cssFamily: string; cssWeight?: number }[];
  colors: { id: string; label: string; hex: string }[];
  positions: { id: string; label: string }[];
  symbols?: { id: string; label: string }[]; // מפתחות לגלריית הסמלים ב-SymbolIcon
  versePresets?: string[]; // פסוקים קצרים לרקמה
  eventTypes?: string[];
  allowLogoUpload: boolean;
  surcharges: {
    text: number;
    symbol: number;
    logo: number;
    giftWrap: number;
    matchingBag?: number; // רקמה תואמת על נרתיק (טליתות)
  };
  bulkDiscounts: { minQty: number; pct: number }[]; // הנחת כמות לאירועים
  minOrderQty?: number; // מינימום יחידות להזמנה עם התאמה אישית (למשל הטבעה על כיפות)
}

export interface GalleryView {
  src: string;
  label: string;
  zoom?: number; // תקריב מדומה מאותו placeholder — עד שיגיעו צילומים אמיתיים
}

export interface CatalogProduct extends ProductCardData {
  sku: string;
  shortDescription: string; // לעמוד קטגוריה / Quick View
  longDescription: string[]; // פסקאות לעמוד המוצר
  materials: string[];
  dimensions?: string;
  colors?: string[];
  prepTimeDays: [number, number]; // טווח ימי עסקים
  careInstructions?: string;
  tags: string[];
  relatedSlugs: string[];
  stockStatus: StockStatus;
  badges: ProductBadge[];
  subcategory?: string; // תת-קטגוריה בתוך המחלקה
  audience?: Audience[]; // קהל יעד — מזין את מאתר המתנות
  occasions?: string[]; // אירועים רלוונטיים — מזין את מאתר המתנות
  priceType?: 'fixed' | 'from' | 'quote'; // "החל מ־" / "לקבלת הצעת מחיר"
  variantGroups?: VariantGroup[];
  customization?: CustomizationConfig;
  gallery: GalleryView[];
  isPlaceholderImage: boolean; // true = איור המחשה זמני, יוחלף בצילום אמיתי
}

// ---------- קונפיגים משותפים להתאמה אישית (lib/customization-presets.ts) ----------

import {
  HEBREW_FONTS,
  EVENT_TYPES,
  KIPPAH_CUSTOMIZATION,
  TALLIT_CUSTOMIZATION,
  ENGRAVING_SILVER,
} from '@/lib/customization-presets';

export { KIPPAH_CUSTOMIZATION, TALLIT_CUSTOMIZATION, ENGRAVING_SILVER };

// ---------- הקטלוג ----------

const IMG = '/images/products';

// גלריה זמנית: אותו איור בזוויות "תצוגה" שונות, מסומן כהמחשה.
// כשיגיעו צילומים אמיתיים — מחליפים כאן שלוש כתובות לכל מוצר.
const placeholderGallery = (src: string): GalleryView[] => [
  { src, label: 'מבט ראשי' },
  { src, label: 'תקריב', zoom: 1.7 },
  { src, label: 'פרט עיצוב', zoom: 2.4 },
];

const CORE_PRODUCTS: CatalogProduct[] = [
  {
    id: 'p1',
    sku: 'EB-KC-001',
    slug: 'kiddush-cup-jerusalem-925',
    titleHe: 'גביע קידוש "ירושלים" — כסף טהור 925',
    imageUrl: `${IMG}/kiddush-cup.svg`,
    category: 'כוסות קידוש',
    material: 'כסף סטרלינג 925, עבודת יד',
    basePrice: 1890,
    discountPrice: 1590,
    certification: 'חדד כלי כסף',
    isCustomizable: true,
    iconKey: 'kiddush',
    isNew: true,
    stockLeft: 2,
    shortDescription: 'גביע קידוש קלאסי מכסף טהור עם חגורת עיטור מוזהבת — כולל אפשרות חריטת שם.',
    longDescription: [
      'גביע הקידוש "ירושלים" מיוצר בעבודת יד מכסף סטרלינג 925 מוחתם, עם חגורת עיטור מוזהבת בהשראת חומות העיר העתיקה. הצורה הקלאסית והמשקל הנעים ביד הופכים אותו לגביע שמלווה את שולחן השבת שנים ארוכות.',
      'ניתן להוסיף חריטת שם, תאריך או הקדשה בחזית הגביע או על הבסיס — מתנה מושלמת לחתן, לבר מצווה או לחנוכת בית.',
    ],
    materials: ['כסף סטרלינג 925 מוחתם', 'ציפוי זהב בחגורת העיטור'],
    dimensions: 'גובה 14 ס"מ · קוטר פיה 7 ס"מ · נפח 130 מ"ל',
    prepTimeDays: [3, 7],
    careInstructions: 'לניקוי במטלית כסף רכה בלבד. לא להכניס למדיח. לאחסן בבד נטול חומצה.',
    tags: ['כסף 925', 'חריטה אישית', 'מתנה לחתן', 'שולחן שבת'],
    relatedSlugs: ['candlesticks-modern-silver', 'havdalah-set-silver', 'natla-silver-engraved'],
    stockStatus: 'in-stock',
    badges: ['new', 'bestseller'],
    customization: ENGRAVING_SILVER,
    gallery: placeholderGallery(`${IMG}/kiddush-cup.svg`),
    isPlaceholderImage: true,
  },
  {
    id: 'p2',
    sku: 'EB-CS-002',
    slug: 'candlesticks-modern-silver',
    titleHe: 'פמוטי שבת "הדר" — קו מודרני',
    imageUrl: `${IMG}/candlesticks.svg`,
    category: 'פמוטים',
    material: 'כסף 925 בגימור מוברש',
    basePrice: 2400,
    certification: 'חדד כלי כסף',
    isCustomizable: true,
    iconKey: 'candles',
    shortDescription: 'זוג פמוטים בקו נקי ומודרני, כסף מוברש — לשולחן שבת עכשווי.',
    longDescription: [
      'פמוטי "הדר" מביאים את היופי של הדלקת הנרות לעיצוב עכשווי: קו מתעגל נקי, גימור כסף מוברש ובסיס רחב ויציב. זוג הפמוטים מגיע במארז בד מרופד.',
      'אפשר להוסיף חריטת שם או תאריך על הבסיס — מתנה קלאסית לכלה, לעולים לבית חדש או ליום נישואין.',
    ],
    materials: ['כסף סטרלינג 925', 'גימור מוברש בעבודת יד'],
    dimensions: 'גובה 24 ס"מ · בסיס 9 ס"מ (לכל פמוט)',
    prepTimeDays: [3, 7],
    careInstructions: 'להסיר שעווה בעדינות לאחר שהתקררה. לנקות במטלית כסף ייעודית.',
    tags: ['כסף 925', 'שבת', 'מתנה לכלה', 'עיצוב מודרני'],
    relatedSlugs: ['kiddush-cup-jerusalem-925', 'challah-set-silver-board', 'challah-cover-satin-vine'],
    stockStatus: 'in-stock',
    badges: ['luxury'],
    customization: ENGRAVING_SILVER,
    gallery: placeholderGallery(`${IMG}/candlesticks.svg`),
    isPlaceholderImage: true,
  },
  {
    id: 'p3',
    sku: 'EB-TL-003',
    slug: 'tallit-beit-yosef-sefard',
    titleHe: 'טלית צמר "בית יוסף" — נוסח ספרד',
    imageUrl: `${IMG}/tallit.svg`,
    category: 'ציציות וטליתות',
    material: 'צמר טהור, קשירה ספרדית',
    basePrice: 1150,
    certification: 'משכן התכלת',
    isCustomizable: true,
    iconKey: 'tallit',
    stockLeft: 3,
    shortDescription: 'טלית צמר משובחת עם ציציות קשורות נוסח ספרד — ורקמת שם אישית על העטרה.',
    longDescription: [
      'טלית "בית יוסף" נטווית מצמר טהור משובח, עם אריגה צפופה שנופלת יפה על הכתפיים ומחזיקה שנים. הציציות מגיעות קשורות בקשירה ספרדית ע"פ פסיקת מרן הבית יוסף, באישור משכן התכלת.',
      'ניתן לרקום על העטרה שם מלא, תאריך או פסוק קצר, לבחור צבע פסים ולהתאים נרתיק עם רקמה תואמת — מתנה מרגשת לחתן ולבר מצווה.',
    ],
    materials: ['100% צמר טהור', 'עטרה ארוגה', 'ציציות צמר לשמה'],
    colors: ['פסים שחורים', 'פסים לבנים', 'פסים כחולים', 'פסי זהב'],
    prepTimeDays: [5, 12],
    careInstructions: 'ניקוי יבש בלבד אצל מכבסה המתמחה בטליתות. לתלות לאוורור לאחר שימוש.',
    tags: ['צמר טהור', 'נוסח ספרד', 'רקמה אישית', 'מתנה לחתן', 'בר מצווה'],
    relatedSlugs: ['tallit-bag-velvet-embroidery', 'knitted-kippah-custom', 'tefillin-beit-yosef-mehudarot'],
    stockStatus: 'in-stock',
    badges: ['bestseller', 'recommended'],
    variantGroups: [
      {
        id: 'size',
        label: 'מידה',
        options: [
          { id: '50', label: 'מידה 50 (נער)', priceDelta: -150 },
          { id: '60', label: 'מידה 60', priceDelta: 0 },
          { id: '70', label: 'מידה 70', priceDelta: 120 },
          { id: '80', label: 'מידה 80 (גדול)', priceDelta: 240 },
        ],
      },
      {
        id: 'stripes',
        label: 'צבע פסים',
        options: [
          { id: 'black', label: 'שחור קלאסי', priceDelta: 0, hex: '#1A2238' },
          { id: 'white', label: 'לבן על לבן', priceDelta: 60, hex: '#E9E5D8' },
          { id: 'blue', label: 'תכלת', priceDelta: 60, hex: '#5B8DD9' },
          { id: 'gold', label: 'פסי זהב', priceDelta: 140, hex: '#D4AF37' },
        ],
      },
      {
        id: 'fabric',
        label: 'סוג בד',
        options: [
          { id: 'standard', label: 'צמר קלאסי', priceDelta: 0 },
          { id: 'premium', label: 'צמר פרימיום קל', priceDelta: 220 },
        ],
      },
    ],
    customization: TALLIT_CUSTOMIZATION,
    gallery: placeholderGallery(`${IMG}/tallit.svg`),
    isPlaceholderImage: true,
  },
  {
    id: 'p4',
    sku: 'EB-MZ-004',
    slug: 'mezuzah-klaf-beit-yosef-12',
    titleHe: 'מזוזה מהודרת 12 ס"מ + בית מעוצב',
    imageUrl: `${IMG}/mezuzah.svg`,
    category: 'תשמישי קדושה לבית',
    material: 'קלף עבודת סופר סת"ם, כתב בית יוסף',
    basePrice: 680,
    certification: 'בד"ץ סת"ם',
    isCustomizable: false,
    iconKey: 'mezuzah',
    shortDescription: 'קלף מהודר 12 ס"מ בכתב בית יוסף, נבדק פעמיים, עם בית מזוזה מעוצב.',
    longDescription: [
      'מזוזה מהודרת הכתובה ביד על ידי סופר סת"ם ירא שמיים, בכתב בית יוסף על קלף עור איכותי. הקלף עובר הגהה כפולה — בדיקת סופר ובדיקת מחשב — ומגיע עם תעודת בדיקה.',
      'הבית המעוצב עשוי מתכת בגימור זהב עם פס כסף מרכזי, עמיד לפנים הבית ולמסגרות דלת מוגנות. להתקנה חיצונית מומלץ להוסיף כיסוי הגנה.',
    ],
    materials: ['קלף עור מעובד לשמה', 'דיו סת"ם', 'בית מתכת בגימור זהב'],
    dimensions: 'קלף 12 ס"מ · בית 15 ס"מ',
    prepTimeDays: [2, 5],
    careInstructions: 'מומלץ להביא את הקלף לבדיקה אחת לשלוש וחצי שנים.',
    tags: ['סת"ם', 'כתב בית יוסף', 'חנוכת בית', 'קלף מהודר'],
    relatedSlugs: ['hanukkiah-silver-925-mikdash', 'natla-silver-engraved', 'siddur-leather-custom-emboss'],
    stockStatus: 'in-stock',
    badges: ['recommended'],
    gallery: placeholderGallery(`${IMG}/mezuzah.svg`),
    isPlaceholderImage: true,
  },
  {
    id: 'p5',
    sku: 'EB-TB-005',
    slug: 'tallit-bag-velvet-embroidery',
    titleHe: 'תיק טלית קטיפה עם רקמת זהב אישית',
    imageUrl: `${IMG}/tallit-bag.svg`,
    category: 'מתנות ואירועים',
    material: 'קטיפה מלכותית, רקמת חוט זהב',
    basePrice: 320,
    isCustomizable: true,
    iconKey: 'gift',
    isNew: true,
    shortDescription: 'נרתיק קטיפה מרופד עם רקמת שם בחוט זהב — משלים מושלם לטלית.',
    longDescription: [
      'נרתיק טלית מקטיפה כחולה עמוקה עם ריפוד פנימי רך ורוכסן איכותי. בחזית — מסגרת רקומה בחוט זהב עם מגן דוד וכתר, ומקום לרקמת שם אישית.',
      'הרקמה נעשית במכונת רקמה מקצועית בחוט מטאלי עמיד. אפשר להזמין סט תואם עם תיק תפילין.',
    ],
    materials: ['קטיפה איכותית', 'ריפוד פנימי', 'חוט רקמה מטאלי'],
    dimensions: '38×31 ס"מ',
    prepTimeDays: [4, 8],
    careInstructions: 'ניקוי במברשת רכה. להרחיק מלחות.',
    tags: ['רקמה אישית', 'בר מצווה', 'קטיפה', 'סט לחתן'],
    relatedSlugs: ['tallit-beit-yosef-sefard', 'tefillin-beit-yosef-mehudarot', 'knitted-kippah-custom'],
    stockStatus: 'in-stock',
    badges: ['new'],
    customization: {
      ...TALLIT_CUSTOMIZATION,
      maxChars: 18,
      positions: [{ id: 'front', label: 'חזית התיק' }],
      surcharges: { text: 0, symbol: 20, logo: 45, giftWrap: 20 }, // רקמת שם כלולה במחיר
    },
    gallery: placeholderGallery(`${IMG}/tallit-bag.svg`),
    isPlaceholderImage: true,
  },
  {
    id: 'p6',
    sku: 'EB-HS-006',
    slug: 'silk-headscarf-designed',
    titleHe: 'מטפחת משי מעוצבת — קולקציית "פנינה"',
    imageUrl: `${IMG}/silk-scarf.svg`,
    category: 'מטפחות מעוצבות',
    material: 'משי טבעי 100%',
    basePrice: 280,
    discountPrice: 240,
    isCustomizable: false,
    iconKey: 'textile',
    shortDescription: 'מטפחת משי טבעי בגוונים חמים עם שולי זהב — קלה, נעימה ומחזיקה קשירה.',
    longDescription: [
      'מטפחת מקולקציית "פנינה" — משי טבעי 100% בצביעה ידנית בגווני שמנת חמים, עם שוליים בגימור זהב עדין. המשי נושם, קל ומחזיק קשירה לאורך כל היום.',
      'מידה נדיבה המתאימה למגוון סגנונות קשירה. נארזת בקופסת מתנה ממותגת.',
    ],
    materials: ['משי טבעי 100%', 'שוליים בתפירה נסתרת'],
    dimensions: '110×110 ס"מ',
    colors: ['שמנת וזהב', 'ורוד עתיק', 'תכלת פודרה'],
    prepTimeDays: [1, 3],
    careInstructions: 'כביסה ידנית עדינה במים קרים או ניקוי יבש. גיהוץ בטמפרטורה נמוכה מצד הפנים.',
    tags: ['משי טבעי', 'כיסוי ראש', 'מתנה לאישה'],
    relatedSlugs: ['challah-cover-satin-vine', 'candlesticks-modern-silver', 'siddur-leather-custom-emboss'],
    stockStatus: 'in-stock',
    badges: [],
    gallery: placeholderGallery(`${IMG}/silk-scarf.svg`),
    isPlaceholderImage: true,
  },
  {
    id: 'p7',
    sku: 'EB-CH-007',
    slug: 'challah-set-silver-board',
    titleHe: 'סט חלה מפואר — מגש, סכין וכיסוי רקום',
    imageUrl: `${IMG}/challah-set.svg`,
    category: 'תשמישי קדושה לבית',
    material: 'ציפוי כסף + רקמה בעבודת יד',
    basePrice: 450,
    isCustomizable: true,
    iconKey: 'textile',
    shortDescription: 'סט שלם לשולחן השבת: מגש עץ מהודר, סכין חלה וכיסוי רקום תואם.',
    longDescription: [
      'סט החלה כולל מגש עץ אלון בגימור כהה, סכין חלה עם ידית בציפוי זהב וכיסוי חלה רקום תואם. סט מארח שמרים את שולחן השבת בלי מאמץ.',
      'אפשר להוסיף רקמת שם משפחה על הכיסוי — מתנה פופולרית לחתונות ולחנוכת בית.',
    ],
    materials: ['עץ אלון מלא', 'להב נירוסטה', 'ידית בציפוי זהב', 'כיסוי סאטן רקום'],
    dimensions: 'מגש 40×28 ס"מ',
    prepTimeDays: [3, 7],
    careInstructions: 'את המגש לנגב בלבד (לא להשרות). הכיסוי בכביסה עדינה.',
    tags: ['שולחן שבת', 'רקמה אישית', 'מתנה לחתונה', 'סט מארח'],
    relatedSlugs: ['challah-cover-satin-vine', 'candlesticks-modern-silver', 'natla-silver-engraved'],
    stockStatus: 'made-to-order',
    badges: ['recommended'],
    customization: {
      ...TALLIT_CUSTOMIZATION,
      maxChars: 16,
      positions: [{ id: 'cover', label: 'על הכיסוי' }],
      versePresets: ['לכבוד שבת קודש', 'שבת שלום ומבורך'],
      surcharges: { text: 45, symbol: 25, logo: 0, giftWrap: 30 },
    },
    gallery: placeholderGallery(`${IMG}/challah-set.svg`),
    isPlaceholderImage: true,
  },
  {
    id: 'p8',
    sku: 'EB-KP-008',
    slug: 'knitted-kippah-custom',
    titleHe: 'כיפה סרוגה בהתאמה אישית מלאה',
    imageUrl: `${IMG}/kippah.svg`,
    category: 'כיפות',
    material: 'סריגה צפופה, טקסט ארוג לבחירה',
    basePrice: 120,
    isCustomizable: true,
    iconKey: 'kippah',
    shortDescription: 'כיפה סרוגה איכותית עם אריגת שם, סמל וצבעים לבחירה — מושלמת לאירועים.',
    longDescription: [
      'כיפה סרוגה בסריגה צפופה ואחידה שמחזיקה צורה. בוחרים צבע רקע, צבע חוט, גופן ואריגת שם או טקסט לבחירתכם — ואפשר גם סמל מהגלריה או לוגו לאירוע עסקי.',
      'להזמנות לאירועים (בר מצווה, חתונה, שבת חתן) — הנחת כמות מדורגת החל מ-10 יחידות, כולל אריזה אחידה.',
    ],
    materials: ['חוט כותנה קשיח', 'סריגת מכונה צפופה'],
    dimensions: 'קוטר לבחירה: 20 / 22 / 24 ס"מ',
    colors: ['נייבי', 'לבן', 'שחור', 'בורדו', 'אפור'],
    prepTimeDays: [7, 14],
    careInstructions: 'כביסה ידנית במים קרים, ייבוש בצל על משטח ישר.',
    tags: ['אריגת שם', 'בר מצווה', 'אירועים', 'הנחת כמות', 'התאמה אישית'],
    relatedSlugs: ['tallit-beit-yosef-sefard', 'tallit-bag-velvet-embroidery', 'siddur-leather-custom-emboss'],
    stockStatus: 'made-to-order',
    badges: ['bestseller'],
    variantGroups: [
      {
        id: 'base-color',
        label: 'צבע הכיפה',
        options: [
          { id: 'navy', label: 'נייבי', priceDelta: 0, hex: '#1B2A5E' },
          { id: 'white', label: 'לבן', priceDelta: 0, hex: '#F2EFE6' },
          { id: 'black', label: 'שחור', priceDelta: 0, hex: '#1A1A1E' },
          { id: 'bordeaux', label: 'בורדו', priceDelta: 0, hex: '#6E1F2C' },
        ],
      },
      {
        id: 'size',
        label: 'קוטר',
        options: [
          { id: '20', label: '20 ס"מ', priceDelta: 0 },
          { id: '22', label: '22 ס"מ', priceDelta: 8 },
          { id: '24', label: '24 ס"מ', priceDelta: 14 },
        ],
      },
    ],
    customization: KIPPAH_CUSTOMIZATION,
    gallery: placeholderGallery(`${IMG}/kippah.svg`),
    isPlaceholderImage: true,
  },
  {
    id: 'p9',
    sku: 'EB-HK-009',
    slug: 'hanukkiah-silver-925-mikdash',
    titleHe: 'חנוכיית כסף 925 "בית המקדש" — 9 קנים',
    imageUrl: `${IMG}/hanukkiah.svg`,
    category: 'תשמישי קדושה לבית',
    material: 'כסף סטרלינג 925, עבודת אומן',
    basePrice: 3200,
    certification: 'חדד כלי כסף',
    isCustomizable: true,
    iconKey: 'candles',
    shortDescription: 'חנוכייה קלאסית בקנים מתעגלים, כסף טהור בעבודת אומן — פריט מרכזי לדורות.',
    longDescription: [
      'חנוכיית "בית המקדש" נבנית בעבודת אומן מכסף סטרלינג 925: שמונה קנים מתעגלים סימטריים ושמש מוגבה, על בסיס מדורג עם עיטור מגן דוד. מתאימה לנרות שעווה סטנדרטיים.',
      'ניתן לחרוט הקדשה על הבסיס. נמכרת עם תעודת אחריות ומגיעה במארז מרופד לאחסון בין החגים.',
    ],
    materials: ['כסף סטרלינג 925 מוחתם'],
    dimensions: 'גובה 27 ס"מ · רוחב 31 ס"מ',
    prepTimeDays: [5, 10],
    careInstructions: 'להסיר שעווה לאחר התקררות מלאה. לנקות במטלית כסף ולאחסן במארז.',
    tags: ['כסף 925', 'חנוכה', 'עבודת יד', 'פריט אספנות'],
    relatedSlugs: ['candlesticks-modern-silver', 'kiddush-cup-jerusalem-925', 'havdalah-set-silver'],
    stockStatus: 'made-to-order',
    badges: ['luxury'],
    customization: ENGRAVING_SILVER,
    gallery: placeholderGallery(`${IMG}/hanukkiah.svg`),
    isPlaceholderImage: true,
  },
  {
    id: 'p10',
    sku: 'EB-HV-010',
    slug: 'havdalah-set-silver',
    titleHe: 'סט הבדלה מכסף — גביע, מגדל בשמים ופמוט',
    imageUrl: `${IMG}/havdalah-set.svg`,
    category: 'תשמישי קדושה לבית',
    material: 'כסף 925 על מגש תואם',
    basePrice: 1450,
    discountPrice: 1290,
    certification: 'חדד כלי כסף',
    isCustomizable: false,
    iconKey: 'kiddush',
    shortDescription: 'סט הבדלה שלם על מגש כסף: גביע, מגדל בשמים מעוטר ומעמד לנר.',
    longDescription: [
      'סט ההבדלה כולל גביע יין, מגדל בשמים בעיטור חלונות מסורתי עם דגלון, ומעמד לנר הבדלה קלוע — הכל מכסף 925 על מגש תואם.',
      'הסט מגיע ארוז במארז מתנה מהודר. נר הבדלה קלוע ראשון מצורף מתנה.',
    ],
    materials: ['כסף סטרלינג 925', 'מגש בציפוי כסף'],
    dimensions: 'מגש קוטר 31 ס"מ · מגדל בשמים גובה 17 ס"מ',
    prepTimeDays: [3, 7],
    careInstructions: 'לנקות במטלית כסף לאחר שימוש. לא לשטוף במים חמים.',
    tags: ['הבדלה', 'כסף 925', 'סט מתנה', 'מוצאי שבת'],
    relatedSlugs: ['kiddush-cup-jerusalem-925', 'candlesticks-modern-silver', 'hanukkiah-silver-925-mikdash'],
    stockStatus: 'in-stock',
    badges: ['recommended'],
    gallery: placeholderGallery(`${IMG}/havdalah-set.svg`),
    isPlaceholderImage: true,
  },
  {
    id: 'p11',
    sku: 'EB-NT-011',
    slug: 'natla-silver-engraved',
    titleHe: 'נטלה מהודרת עם עיטור חריטה',
    imageUrl: `${IMG}/natla.svg`,
    category: 'תשמישי קדושה לבית',
    material: 'ציפוי כסף, ידיות מעוצבות',
    basePrice: 520,
    isCustomizable: true,
    iconKey: 'kiddush',
    shortDescription: 'נטלת יד כבדה ויציבה בציפוי כסף עם חיטוב קלאסי וידיות נוחות.',
    longDescription: [
      'נטלה מהודרת בציפוי כסף עמיד למים, עם גוף מחוטב בקווים אנכיים קלאסיים ושתי ידיות רחבות ונוחות לאחיזה. בסיס מוגבה ששומר על השיש יבש.',
      'אפשרות לחריטת שם משפחה על חגורת הזהב — מתנה שימושית ויפה לחנוכת בית.',
    ],
    materials: ['נחושת בציפוי כסף עמיד', 'חגורת עיטור מוזהבת'],
    dimensions: 'גובה 15 ס"מ · נפח 1 ליטר',
    prepTimeDays: [2, 5],
    careInstructions: 'לייבש לאחר שימוש. אין צורך בהברקה תכופה — הציפוי עמיד.',
    tags: ['נטילת ידיים', 'חנוכת בית', 'חריטה אישית'],
    relatedSlugs: ['mezuzah-klaf-beit-yosef-12', 'challah-set-silver-board', 'havdalah-set-silver'],
    stockStatus: 'in-stock',
    badges: [],
    customization: { ...ENGRAVING_SILVER, maxChars: 15, surcharges: { text: 60, symbol: 30, logo: 0, giftWrap: 25 } },
    gallery: placeholderGallery(`${IMG}/natla.svg`),
    isPlaceholderImage: true,
  },
  {
    id: 'p12',
    sku: 'EB-SD-012',
    slug: 'siddur-leather-custom-emboss',
    titleHe: 'סידור עור איטלקי עם הטבעת שם אישית',
    imageUrl: `${IMG}/siddur.svg`,
    category: 'מתנות ואירועים',
    material: 'עור אמיתי, הטבעת זהב 24K',
    basePrice: 240,
    isCustomizable: true,
    iconKey: 'gift',
    isNew: true,
    shortDescription: 'סידור בכריכת עור איטלקי עם הטבעת שם בזהב — לבחירה בכל הנוסחים.',
    longDescription: [
      'סידור שלם בכריכת עור איטלקי רך עם דפי שוליים מוזהבים, סימנייה ומסגרת עיטור מוטבעת. את השם מטביעים בפויל זהב אמיתי בחזית הכריכה.',
      'זמין בנוסח אשכנז, ספרד ועדות המזרח. מתנה קלאסית לבר מצווה, לחתן ולעדי קידושין.',
    ],
    materials: ['עור איטלקי אמיתי', 'דפים בשוליים מוזהבים', 'פויל זהב להטבעה'],
    dimensions: '12×17 ס"מ',
    prepTimeDays: [3, 6],
    careInstructions: 'להרחיק מלחות ושמש ישירה. העור מתרכך ומתיישן יפה עם הזמן.',
    tags: ['הטבעת שם', 'בר מצווה', 'עור אמיתי', 'כל הנוסחים'],
    relatedSlugs: ['tallit-bag-velvet-embroidery', 'knitted-kippah-custom', 'tefillin-beit-yosef-mehudarot'],
    stockStatus: 'in-stock',
    badges: ['new', 'bestseller'],
    variantGroups: [
      {
        id: 'nusach',
        label: 'נוסח',
        options: [
          { id: 'ashkenaz', label: 'אשכנז', priceDelta: 0 },
          { id: 'sefard', label: 'ספרד', priceDelta: 0 },
          { id: 'edot', label: 'עדות המזרח', priceDelta: 0 },
        ],
      },
      {
        id: 'leather-color',
        label: 'צבע עור',
        options: [
          { id: 'brown', label: 'חום קוניאק', priceDelta: 0, hex: '#6B4423' },
          { id: 'black', label: 'שחור', priceDelta: 0, hex: '#1A1A1E' },
          { id: 'navy', label: 'כחול לילה', priceDelta: 15, hex: '#1B2A5E' },
          { id: 'cream', label: 'שמנת', priceDelta: 15, hex: '#EDE5D4' },
        ],
      },
    ],
    customization: {
      method: 'emboss', // הטבעה בפויל זהב על הכריכה
      maxChars: 16,
      fonts: HEBREW_FONTS,
      colors: [
        { id: 'gold', label: 'זהב', hex: '#D4AF37' },
        { id: 'silver', label: 'כסף', hex: '#C7D0DB' },
        { id: 'blind', label: 'הטבעה עיוורת', hex: '#7A6A50' },
      ],
      positions: [
        { id: 'front-bottom', label: 'חזית — למטה' },
        { id: 'front-center', label: 'חזית — מרכז' },
      ],
      eventTypes: EVENT_TYPES,
      allowLogoUpload: false,
      surcharges: { text: 0, symbol: 15, logo: 0, giftWrap: 15 }, // הטבעת שם כלולה
      bulkDiscounts: [
        { minQty: 10, pct: 12 },
        { minQty: 25, pct: 20 },
      ],
    },
    gallery: placeholderGallery(`${IMG}/siddur.svg`),
    isPlaceholderImage: true,
  },
  {
    id: 'p13',
    sku: 'EB-TF-013',
    slug: 'tefillin-beit-yosef-mehudarot',
    titleHe: 'תפילין מהודרות כתב בית יוסף — עור גסות',
    imageUrl: `${IMG}/tefillin.svg`,
    category: 'מתנות ואירועים',
    material: 'בתים מרובעים עור בהמה גסה',
    basePrice: 2850,
    certification: 'בד"ץ סת"ם',
    isCustomizable: false,
    iconKey: 'mezuzah',
    shortDescription: 'תפילין מהודרות: בתים גסות מעור אחד, פרשיות כתב בית יוסף עם תעודת בדיקה.',
    longDescription: [
      'תפילין מהודרות ברמת "גסות" — הבתים מיוצרים מעור בהמה אחד בריבוע מדויק, והפרשיות נכתבות ביד ע"י סופר סת"ם מוסמך בכתב בית יוסף. כל סט עובר הגהת מחשב והגהת סופר שני, ומגיע עם תעודת בדיקה.',
      'רצועות עור עבודת יד בצביעה שחורה עמידה. זמין בקשירת יד ימין ושמאל, בנוסח אשכנז וספרד. ליווי טלפוני של סופר הסת"ם לכל שאלה.',
    ],
    materials: ['בתים: עור בהמה גסה', 'פרשיות: קלף לשמה', 'רצועות עור בצביעה עמידה'],
    prepTimeDays: [10, 21],
    careInstructions: 'לאחסן בנרתיק במקום יבש. מומלצת בדיקה אחת למספר שנים.',
    tags: ['סת"ם', 'בר מצווה', 'כתב בית יוסף', 'תעודת בדיקה'],
    relatedSlugs: ['tallit-beit-yosef-sefard', 'tallit-bag-velvet-embroidery', 'siddur-leather-custom-emboss'],
    stockStatus: 'made-to-order',
    badges: ['luxury', 'recommended'],
    variantGroups: [
      {
        id: 'hand',
        label: 'יד כותבת',
        options: [
          { id: 'right', label: 'ימני (הנחה על יד שמאל)', priceDelta: 0 },
          { id: 'left', label: 'איטר (הנחה על יד ימין)', priceDelta: 0 },
        ],
      },
      {
        id: 'nusach',
        label: 'נוסח',
        options: [
          { id: 'ashkenaz', label: 'אשכנז', priceDelta: 0 },
          { id: 'sefard', label: 'ספרד', priceDelta: 0 },
        ],
      },
    ],
    gallery: placeholderGallery(`${IMG}/tefillin.svg`),
    isPlaceholderImage: true,
  },
  {
    id: 'p14',
    sku: 'EB-CC-014',
    slug: 'challah-cover-satin-vine',
    titleHe: 'כיסוי חלה סאטן — רקמת גפן וחיטה בזהב',
    imageUrl: `${IMG}/challah-cover.svg`,
    category: 'תשמישי קדושה לבית',
    material: 'סאטן משובח, רקמה עדינה',
    basePrice: 180,
    discountPrice: 150,
    isCustomizable: true,
    iconKey: 'textile',
    shortDescription: 'כיסוי חלה מסאטן שמנת עם רקמת גפן וחיטה בחוט זהב ומסגרת כפולה.',
    longDescription: [
      'כיסוי חלה מסאטן שמנת כבד ואיכותי, עם רקמת אשכול ענבים ושיבולי חיטה בחוט זהב — סמלי הברכה של שולחן השבת. מסגרת רקומה כפולה ופינות עם גדילים.',
      'אפשר להוסיף רקמת שם משפחה או "שבת שלום" בתחתית הכיסוי.',
    ],
    materials: ['סאטן כבד', 'חוט רקמה מטאלי', 'בטנה מלאה'],
    dimensions: '52×42 ס"מ',
    prepTimeDays: [3, 6],
    careInstructions: 'כביסה עדינה בשק כביסה או ניקוי יבש. גיהוץ מצד הבטנה.',
    tags: ['שולחן שבת', 'רקמה אישית', 'מתנה'],
    relatedSlugs: ['challah-set-silver-board', 'candlesticks-modern-silver', 'silk-headscarf-designed'],
    stockStatus: 'in-stock',
    badges: [],
    customization: {
      ...TALLIT_CUSTOMIZATION,
      maxChars: 16,
      positions: [{ id: 'bottom', label: 'תחתית הכיסוי' }],
      versePresets: ['שבת שלום', 'לכבוד שבת קודש'],
      surcharges: { text: 40, symbol: 20, logo: 0, giftWrap: 20 },
    },
    gallery: placeholderGallery(`${IMG}/challah-cover.svg`),
    isPlaceholderImage: true,
  },
  {
    id: 'p15',
    sku: 'EB-RM-015',
    slug: 'torah-rimonim-silver-bells',
    titleHe: 'רימונים לספר תורה — כסף טהור עם פעמונים',
    imageUrl: `${IMG}/torah-rimonim.svg`,
    category: 'תשמישי קדושה לבית',
    material: 'כסף 925, עבודת אומן ירושלמית',
    basePrice: 6800,
    certification: 'חדד כלי כסף',
    isCustomizable: false,
    iconKey: 'gift',
    stockLeft: 1,
    shortDescription: 'זוג רימונים לעצי החיים: גוף מחורץ, כתר זהב ופעמוני כסף — עבודת אומן.',
    longDescription: [
      'זוג רימונים לספר תורה בעבודת אומן ירושלמית: גוף רימון מחורץ מכסף 925, כתר בציפוי זהב ופעמונים תלויים המצלצלים בהגבהה. פנים הגביע מרופד להגנה על עצי החיים.',
      'פריט הקדשה מבוקש לבתי כנסת — אפשרות לחריטת לוחית הקדשה על הבסיס ללא עלות. מיוצר לפי הזמנה כשהמלאי אוזל.',
    ],
    materials: ['כסף סטרלינג 925', 'כתר בציפוי זהב', 'ריפוד פנימי'],
    dimensions: 'גובה 32 ס"מ (לכל רימון)',
    prepTimeDays: [14, 30],
    careInstructions: 'לנקות במטלית כסף. לאחסן במארז המרופד המצורף.',
    tags: ['בית כנסת', 'הקדשה', 'כסף 925', 'עבודת אומן'],
    relatedSlugs: ['hanukkiah-silver-925-mikdash', 'kiddush-cup-jerusalem-925', 'tefillin-beit-yosef-mehudarot'],
    stockStatus: 'in-stock',
    badges: ['luxury'],
    gallery: placeholderGallery(`${IMG}/torah-rimonim.svg`),
    isPlaceholderImage: true,
  },
  {
    id: 'p16',
    sku: 'EB-SH-016',
    slug: 'shofar-ram-polished-classic',
    titleHe: 'שופר איל מהודר — ליטוש קלאסי',
    imageUrl: `${IMG}/shofar.svg`,
    category: 'מתנות ואירועים',
    material: 'קרן איל טבעית, מוכשר לתקיעה',
    basePrice: 380,
    isCustomizable: false,
    iconKey: 'gift',
    isNew: true,
    shortDescription: 'שופר איל טבעי בליטוש חצי-מבריק, נבדק לתקיעה תקינה וכשרות מלאה.',
    longDescription: [
      'שופר מקרן איל טבעית בליטוש קלאסי חצי-מבריק ששומר על מראה הקרן הטבעי. כל שופר נבדק ידנית לתקיעה נוחה וצליל מלא, ומגיע עם אישור כשרות.',
      'בשל היותו מוצר טבע — כל שופר ייחודי בגוונו ובעיקולו. האורך הנקוב הוא ממוצע לדגם.',
    ],
    materials: ['קרן איל טבעית', 'ליטוש ידני'],
    dimensions: 'אורך 30–35 ס"מ (לאורך הקשת)',
    prepTimeDays: [1, 4],
    careInstructions: 'לאוורר לאחר שימוש. לא לשטוף במים — ניגוב יבש בלבד. לאחסן במקום יבש.',
    tags: ['ראש השנה', 'אלול', 'מוכשר לתקיעה'],
    relatedSlugs: ['siddur-leather-custom-emboss', 'kiddush-cup-jerusalem-925', 'mezuzah-klaf-beit-yosef-12'],
    stockStatus: 'in-stock',
    badges: ['new'],
    gallery: placeholderGallery(`${IMG}/shofar.svg`),
    isPlaceholderImage: true,
  },
];

// ---------- מיזוג הקטלוג המורחב ----------

import { EXTENDED_PRODUCTS } from '@/lib/catalog-extended';
import { EXTENDED_PRODUCTS_2 } from '@/lib/catalog-extended-2';
import { EXTENDED_PRODUCTS_3 } from '@/lib/catalog-extended-3';
import { BOOK_PRODUCTS } from '@/lib/catalog-books';
import { SUPPLIER_PRODUCTS } from '@/lib/catalog-supplier';

// תת-קטגוריות למוצרי הליבה המקוריים
const LEGACY_SUBCATS: Record<string, string> = {
  p1: 'גביעי קידוש',
  p2: 'פמוטים קלאסיים',
  p3: 'טליתות צמר',
  p4: 'מזוזות',
  p5: 'תיקי טלית ותפילין',
  p6: 'מטפחות משי',
  p7: 'שולחן שבת',
  p8: 'כיפות סרוגות',
  p9: 'חנוכה',
  p10: 'הבדלה',
  p11: 'כלי קודש',
  p12: 'ספרים וסידורים',
  p13: 'בר מצווה',
  p14: 'שולחן שבת',
  p15: 'בית כנסת',
  p16: 'ראש השנה',
};

// ⚠️ לפני עלייה לאוויר: מציגים רק מוצרים אמיתיים עם צילום ספק אמיתי.
// מוצרי הדמו (CORE/EXTENDED/BOOK) נשמרים בקוד אך אינם ממוזגים לחנות.
// להחזרתם — להוסיף חזרה למערך. (המשתנים למטה נשארים כדי לא לשבור imports.)
void CORE_PRODUCTS;
void EXTENDED_PRODUCTS;
void EXTENDED_PRODUCTS_2;
void EXTENDED_PRODUCTS_3;
void BOOK_PRODUCTS;
void LEGACY_SUBCATS;

export const PRODUCTS: CatalogProduct[] = [...SUPPLIER_PRODUCTS];

// ---------- Helpers ----------

export const getProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);

export const getSubcategories = (categorySlug: string): string[] => {
  const list = getProductsByCategory(categorySlug)
    .map((p) => p.subcategory)
    .filter((s): s is string => Boolean(s));
  return Array.from(new Set(list));
};

export const getProductsByCategory = (categorySlug: string) => {
  const cat = getCategory(categorySlug);
  if (!cat) return [];
  return PRODUCTS.filter((p) => p.category === cat.nameHe);
};

// קטגוריות פעילות בלבד — כאלה שיש בהן מוצרים (מסתיר קטגוריות ריקות מהניווט/דף הבית).
export const ACTIVE_CATEGORIES = CATEGORIES.filter(
  (c) => PRODUCTS.some((p) => p.category === c.nameHe)
);

// תמונת נציג לקטגוריה — הצילום האמיתי של המוצר הראשון בקטגוריה.
export const getCategoryImage = (categorySlug: string): string | undefined =>
  getProductsByCategory(categorySlug).find((p) => p.imageUrl)?.imageUrl;

export const getRelatedProducts = (product: CatalogProduct) =>
  product.relatedSlugs.map(getProduct).filter((p): p is CatalogProduct => Boolean(p));

export const STOCK_LABELS: Record<StockStatus, string> = {
  'in-stock': 'במלאי — משלוח מיידי',
  'made-to-order': 'בייצור לפי הזמנה',
  'coming-soon': 'בקרוב',
};

export const BADGE_LABELS: Record<ProductBadge, string> = {
  new: 'חדש',
  bestseller: 'רב-מכר',
  luxury: 'קולקציית יוקרה',
  recommended: 'מומלץ',
  handmade: 'עבודת יד',
  exclusive: 'בלעדי',
  limited: 'מהדורה מוגבלת',
};
