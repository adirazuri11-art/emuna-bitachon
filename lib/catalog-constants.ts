// ============================================================
// lib/catalog-constants.ts — מטא-דאטה סטטי של הקטלוג (בלי נתוני מוצרים).
//
// ⚠️ מודול קליל בכוונה: אין כאן PRODUCTS ואין קוד העשרה כבד.
// גם `lib/catalog.ts` (צד שרת, מלא) וגם `lib/catalog-lite.ts` (צד לקוח, רזה)
// מייבאים מכאן — כך הקבועים הקטנים (קטגוריות/קהלים/אירועים) זמינים ללקוח
// בלי לגרור את 799 המוצרים אל ה-bundle.
// ============================================================

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

// ---------- טיפוסי מוצר בסיסיים ----------

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

// ---------- תוויות UI (Labels) ----------
// כאן (ולא ב-catalog.ts) כדי שקומפוננטות לקוח — ProductCard/QuickView/Customizer —
// יצרכו אותן בלי לגרור את כל הקטלוג ל-bundle.

export type CustomizationMethod = 'engraving' | 'embroidery' | 'weaving' | 'emboss' | 'print';

export const METHOD_LABELS: Record<CustomizationMethod, string> = {
  engraving: 'חריטה',
  embroidery: 'רקמה',
  weaving: 'אריגה',
  emboss: 'הטבעה',
  print: 'הדפסה אישית',
};

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
