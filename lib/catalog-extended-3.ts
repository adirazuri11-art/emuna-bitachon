// ============================================================
// הקטלוג המורחב — אצווה 3 (z1–z14): חשמל ושבת, ברית ולידה, מזכרות מירושלים.
// מוצרים שקיימים אצל מתחרים והיו חסרים באתר. ⚠️ מחירים להדגמה — לאמת מול הספק.
// תמונות: scripts/generate-images-3.mjs
// ============================================================

import type { CatalogProduct } from '@/lib/catalog';
import { TALLIT_CUSTOMIZATION, PRINT_PERSONAL } from '@/lib/customization-presets';

const IMG = '/images/products';

type ProductInput = Omit<CatalogProduct, 'gallery' | 'isPlaceholderImage'> &
  Partial<Pick<CatalogProduct, 'gallery' | 'isPlaceholderImage'>>;

function def(data: ProductInput): CatalogProduct {
  const src = data.imageUrl!;
  return {
    isPlaceholderImage: true,
    gallery: [
      { src, label: 'מבט ראשי' },
      { src, label: 'תקריב', zoom: 1.7 },
      { src, label: 'פרט עיצוב', zoom: 2.4 },
    ],
    ...data,
  };
}

export const EXTENDED_PRODUCTS_3: CatalogProduct[] = [
  // ================= חשמל ושבת =================
  def({
    id: 'z1', sku: 'EB-EL-301', slug: 'plata-shabbat-large',
    titleHe: 'פלטת שבת חשמלית גדולה', imageUrl: `${IMG}/plata-shabbat.svg`,
    category: 'חשמל ושבת', subcategory: 'חשמל לשבת',
    material: 'משטח נירוסטה, גוף חימום מוגן', basePrice: 289, discountPrice: 249, isCustomizable: false, iconKey: 'candles',
    shortDescription: 'פלטת שבת רחבה לחימום אחיד של סירים ותבניות — שומרת על האוכל חם לאורך כל השבת.',
    longDescription: [
      'פלטת שבת חשמלית עם משטח נירוסטה רחב וחימום אחיד, מתאימה לכמה סירים ותבניות במקביל. גוף חימום מוגן ותרמוסטט בטיחות.',
      'מושלמת למשפחות ולאירוחי שבת. כבל חשמל תקני ואישור מכון התקנים.',
    ],
    materials: ['משטח נירוסטה', 'גוף חימום מוגן'], dimensions: '80×40 ס"מ',
    prepTimeDays: [1, 3], careInstructions: 'לנקות כשהפלטה קרה ומנותקת מהחשמל.',
    tags: ['שבת', 'פלטה', 'חשמל', 'אירוח'], relatedSlugs: ['urn-water-electric-30', 'shabbat-clock-digital', 'kettle-steel-premium'],
    stockStatus: 'in-stock', badges: ['bestseller'], audience: ['family'], occasions: ['שבת'],
  }),
  def({
    id: 'z2', sku: 'EB-EL-302', slug: 'urn-water-electric-30',
    titleHe: 'מיחם מים חשמלי 30 כוסות', imageUrl: `${IMG}/urn-water-electric.svg`,
    category: 'חשמל ושבת', subcategory: 'חשמל לשבת',
    material: 'נירוסטה, מד מים ותרמוסטט', basePrice: 349, isCustomizable: false, iconKey: 'kiddush',
    shortDescription: 'מיחם מים נירוסטה עם ברז נוח ומצב שבת — מים חמים זמינים לכל השבת והחגים.',
    longDescription: [
      'מיחם מים חשמלי מנירוסטה בנפח 30 כוסות, עם ברז זרימה נוח, מד מים, ידיות מבודדות ומצב שבת. שומר על חום קבוע לאורך זמן.',
      'מתאים לשבתות, לחגים ולאירועים. אישור מכון התקנים הישראלי.',
    ],
    materials: ['נירוסטה', 'ידיות מבודדות'], dimensions: 'קיבולת ~7.5 ליטר',
    prepTimeDays: [1, 3], careInstructions: 'להסיר אבנית מדי כמה חודשים.',
    tags: ['שבת', 'מיחם', 'מים חמים', 'חגים'], relatedSlugs: ['plata-shabbat-large', 'kettle-steel-premium', 'shabbat-clock-digital'],
    stockStatus: 'in-stock', badges: ['recommended'], audience: ['family'], occasions: ['שבת', 'חג'],
  }),
  def({
    id: 'z3', sku: 'EB-EL-303', slug: 'shabbat-clock-digital',
    titleHe: 'שעון שבת דיגיטלי', imageUrl: `${IMG}/shabbat-clock-timer.svg`,
    category: 'חשמל ושבת', subcategory: 'שעוני שבת',
    material: 'טיימר דיגיטלי לשקע', basePrice: 89, discountPrice: 69, isCustomizable: false, iconKey: 'candles',
    shortDescription: 'שעון שבת דיגיטלי לתכנות הדלקה וכיבוי אוטומטי של תאורה ומכשירים — פשוט ומדויק.',
    longDescription: [
      'שעון שבת (טיימר) דיגיטלי המתחבר לשקע ומאפשר לתכנת הדלקה וכיבוי אוטומטיים של תאורה, פלטה או מזגן. תצוגה ברורה וזיכרון גיבוי.',
      'פתרון נוח ומדויק לשמירת שבת בבית ובמשרד.',
    ],
    materials: ['פלסטיק כבה מאליו', 'מסך דיגיטלי'], dimensions: 'תקע סטנדרטי',
    prepTimeDays: [1, 2], tags: ['שבת', 'שעון שבת', 'טיימר', 'חשמל'], relatedSlugs: ['plata-shabbat-large', 'shabbat-lamp-adjustable', 'urn-water-electric-30'],
    stockStatus: 'in-stock', badges: ['bestseller'], audience: ['family'], occasions: ['שבת'],
  }),
  def({
    id: 'z4', sku: 'EB-EL-304', slug: 'shabbat-lamp-adjustable',
    titleHe: 'מנורת שבת עם אהיל נשלף', imageUrl: `${IMG}/shabbat-lamp.svg`,
    category: 'חשמל ושבת', subcategory: 'תאורת שבת',
    material: 'גוף מתכת, אהיל מתכוונן', basePrice: 240, isCustomizable: false, iconKey: 'candles',
    shortDescription: 'מנורת שבת עם אהיל נשלף לכיסוי האור — לקריאה נוחה ולשינה בחדר מואר בשבת.',
    longDescription: [
      'מנורת שבת עם אהיל מתכוונן שנשלף ומכסה את האור בלי לכבותו — כך אפשר "לכבות" את התאורה בחדר בשבת בהיתר. גוף יציב ותאורה חמה ונעימה.',
      'מתאימה לחדר שינה ולחדר עבודה.',
    ],
    materials: ['גוף מתכת', 'אהיל נשלף'], dimensions: 'גובה 42 ס"מ',
    prepTimeDays: [1, 3], tags: ['שבת', 'מנורה', 'תאורה'], relatedSlugs: ['shabbat-clock-digital', 'plata-shabbat-large', 'candlesticks-modern-silver'],
    stockStatus: 'in-stock', badges: [], audience: ['family'], occasions: ['שבת'],
  }),
  def({
    id: 'z5', sku: 'EB-EL-305', slug: 'kettle-steel-premium',
    titleHe: 'קומקום נירוסטה איכותי', imageUrl: `${IMG}/kettle-steel.svg`,
    category: 'חשמל ושבת', subcategory: 'מטבח',
    material: 'נירוסטה עם ידית מבודדת', basePrice: 159, isCustomizable: false, iconKey: 'kiddush',
    shortDescription: 'קומקום נירוסטה עם ידית מבודדת ורתיחה מהירה — לפינת החם של המטבח היהודי.',
    longDescription: ['קומקום חשמלי מנירוסטה איכותית עם ידית מבודדת, בסיס יציב וכיבוי אוטומטי. רתיחה מהירה ושקטה. משלים את פינת המשקאות החמים לצד המיחם.'],
    materials: ['נירוסטה', 'ידית מבודדת'], dimensions: 'קיבולת 1.7 ליטר',
    prepTimeDays: [1, 2], careInstructions: 'להסיר אבנית מעת לעת.',
    tags: ['מטבח', 'קומקום', 'נירוסטה'], relatedSlugs: ['urn-water-electric-30', 'plata-shabbat-large', 'natla-silver-engraved'],
    stockStatus: 'in-stock', badges: [], audience: ['family'],
  }),

  // ================= ברית ולידה =================
  def({
    id: 'z6', sku: 'EB-BR-306', slug: 'brit-pillow-embroidered',
    titleHe: 'כרית לברית מילה רקומה', imageUrl: `${IMG}/brit-pillow-embroidered.svg`,
    category: 'ברית ולידה', subcategory: 'ברית',
    material: 'קטיפה עם רקמת חוט זהב', basePrice: 180, isCustomizable: true, iconKey: 'textile',
    shortDescription: 'כרית קטיפה רקומה לברית המילה — עם שם הרך הנולד ותאריך, מזכרת לכל החיים.',
    longDescription: [
      'כרית קטיפה מהודרת לברית המילה, עם רקמת חוט זהב: "ברוך הבא", עיטור וברכה. ריפוד רך ותפירה איכותית.',
      'ניתן לרקום את שם התינוק ותאריך הברית — מזכרת מרגשת שנשמרת במשפחה.',
    ],
    materials: ['קטיפה', 'רקמת חוט זהב', 'ריפוד'], dimensions: '40×40 ס"מ',
    prepTimeDays: [4, 8], careInstructions: 'ניקוי יבש בלבד.',
    tags: ['ברית', 'רקמה אישית', 'מזכרת', 'תינוק'], relatedSlugs: ['brit-set-silver-tray', 'newborn-gift-box-mazal', 'baby-blessing-framed'],
    stockStatus: 'made-to-order', badges: ['handmade'], audience: ['family'], occasions: ['ברית'],
    customization: { ...TALLIT_CUSTOMIZATION, maxChars: 18, positions: [{ id: 'front', label: 'חזית הכרית' }] },
  }),
  def({
    id: 'z7', sku: 'EB-BR-307', slug: 'brit-set-silver-tray',
    titleHe: 'סט לברית מילה על מגש כסף', imageUrl: `${IMG}/brit-set-tray.svg`,
    category: 'ברית ולידה', subcategory: 'ברית',
    material: 'מגש בציפוי כסף עם כלים', basePrice: 320, isCustomizable: false, iconKey: 'kiddush',
    shortDescription: 'סט מכובד לברית המילה — מגש כסף, בקבוקון שמן, כוסית יין ומעמד לנר, ערוך ומוכן.',
    longDescription: ['סט לברית מילה על מגש בציפוי כסף, הכולל בקבוקון שמן, כוסית יין ומעמד לנר. ערוך ומכובד לרגע הברית. מגיע במארז.'],
    materials: ['ציפוי כסף'], dimensions: 'מגש קוטר 30 ס"מ',
    prepTimeDays: [2, 5], careInstructions: 'לנקות במטלית כסף.',
    tags: ['ברית', 'כסף', 'סט', 'מארח'], relatedSlugs: ['brit-pillow-embroidered', 'newborn-gift-box-mazal', 'kiddush-cup-jerusalem-925'],
    stockStatus: 'in-stock', badges: ['recommended'], audience: ['family'], occasions: ['ברית'],
  }),
  def({
    id: 'z8', sku: 'EB-BR-308', slug: 'newborn-gift-box-mazal',
    titleHe: 'מארז מתנה ליולדת', imageUrl: `${IMG}/newborn-gift-box.svg`,
    category: 'ברית ולידה', subcategory: 'לידה',
    material: 'מארז עם פריטי תינוק וברכה', basePrice: 149, isCustomizable: true, iconKey: 'gift',
    shortDescription: 'מארז "מזל טוב" ליולדת ולתינוק — פריטים רכים וברכה אישית, מוכן לשליחה.',
    longDescription: [
      'מארז מתנה מעוצב ליולדת: פריטי תינוק רכים, ברכה וקלף "ברכת הבנים". ארוז יפה ומוכן להענקה או למשלוח ישיר.',
      'ניתן לצרף ברכה אישית מודפסת.',
    ],
    materials: ['מארז מתנה', 'פריטי תינוק'], dimensions: '30×24 ס"מ',
    prepTimeDays: [2, 5], tags: ['לידה', 'יולדת', 'מתנה', 'תינוק'], relatedSlugs: ['baby-blessing-framed', 'brit-pillow-embroidered', 'brit-set-silver-tray'],
    stockStatus: 'in-stock', badges: ['new'], audience: ['women', 'family'], occasions: ['יולדת'],
    customization: { ...PRINT_PERSONAL, maxChars: 40, positions: [{ id: 'card', label: 'כרטיס הברכה' }] },
  }),
  def({
    id: 'z9', sku: 'EB-BR-309', slug: 'baby-blessing-framed',
    titleHe: 'ברכת הלידה ממוסגרת', imageUrl: `${IMG}/baby-blessing-frame.svg`,
    category: 'ברית ולידה', subcategory: 'לידה',
    material: 'הדפסת אמנות במסגרת זהב', basePrice: 120, isCustomizable: true, iconKey: 'gift',
    shortDescription: 'ברכת לידה מעוצבת במסגרת זהב, עם שם התינוק ותאריך — לתלייה בחדר הילד.',
    longDescription: [
      'ברכת לידה בעיצוב אמנותי, במסגרת בגימור זהב, לתלייה בחדר הרך הנולד. עיצוב חם ועדין.',
      'ניתן להוסיף את שם התינוק, תאריך הלידה וברכה אישית.',
    ],
    materials: ['הדפסת אמנות', 'מסגרת'], dimensions: '30×40 ס"מ',
    prepTimeDays: [3, 6], tags: ['לידה', 'אמנות', 'עיצוב אישי', 'חדר ילדים'], relatedSlugs: ['newborn-gift-box-mazal', 'birkat-habait-framed', 'brit-pillow-embroidered'],
    stockStatus: 'made-to-order', badges: [], audience: ['family'], occasions: ['יולדת'],
    customization: { ...PRINT_PERSONAL, maxChars: 30 },
  }),

  // ================= מזכרות מירושלים =================
  def({
    id: 'z10', sku: 'EB-JM-310', slug: 'temple-model-decorative',
    titleHe: 'דגם בית המקדש', imageUrl: `${IMG}/temple-model.svg`,
    category: 'מזכרות מירושלים', subcategory: 'דגמים ופסלונים',
    material: 'יציקת אבן מלאכותית בגימור זהב', basePrice: 260, isCustomizable: false, iconKey: 'gift',
    shortDescription: 'דגם מפורט של בית המקדש בגימור אבן וזהב — פריט נוי מרשים ומשמעותי לבית ולמשרד.',
    longDescription: ['דגם דקורטיבי של בית המקדש בעיצוב מפורט, יציקת אבן מלאכותית בגימור אבן ירושלמית וזהב. פריט נוי משמעותי לסלון, למשרד או כמתנה מכובדת.'],
    materials: ['יציקת אבן', 'גימור זהב'], dimensions: 'גובה 22 ס"מ',
    prepTimeDays: [2, 5], careInstructions: 'לנקות באבק במטלית יבשה.',
    tags: ['ירושלים', 'בית המקדש', 'דגם', 'נוי'], relatedSlugs: ['kotel-wall-framed', 'pomegranate-figurine-decor', 'jerusalem-magnets-set'],
    stockStatus: 'in-stock', badges: ['recommended'], audience: ['family'], occasions: ['בית חדש'],
  }),
  def({
    id: 'z11', sku: 'EB-JM-311', slug: 'jerusalem-magnets-set',
    titleHe: 'מארז מגנטים מירושלים', imageUrl: `${IMG}/jerusalem-magnets.svg`,
    category: 'מזכרות מירושלים', subcategory: 'מגנטים',
    material: 'מגנטים מעוצבים', basePrice: 45, isCustomizable: false, iconKey: 'gift',
    shortDescription: 'מארז ארבעה מגנטים עם סמלי ירושלים והיהדות — מזכרת נחמדה ומתנה קטנה ומרגשת.',
    longDescription: ['מארז ארבעה מגנטים מעוצבים עם סמלי ירושלים והיהדות: מגן דוד, "חי", הכותל ועיטורים. מזכרת נחמדה למקרר ומתנה קטנה ומרגשת לאורחים מחו"ל.'],
    materials: ['מגנט מעוצב'], dimensions: '5×5 ס"מ (×4)',
    prepTimeDays: [1, 2], tags: ['ירושלים', 'מגנטים', 'מזכרת', 'מתנה נגישה'], relatedSlugs: ['blessing-cards-set', 'temple-model-decorative', 'kotel-wall-framed'],
    stockStatus: 'in-stock', badges: [], audience: ['family'],
  }),
  def({
    id: 'z12', sku: 'EB-JM-312', slug: 'kotel-wall-framed',
    titleHe: 'הכותל המערבי ממוסגר', imageUrl: `${IMG}/kotel-frame.svg`,
    category: 'מזכרות מירושלים', subcategory: 'תמונות קיר',
    material: 'הדפסת אמנות במסגרת זהב', basePrice: 140, isCustomizable: false, iconKey: 'gift',
    shortDescription: 'תמונת הכותל המערבי בעיצוב אמנותי ובמסגרת זהב — פיסה מירושלים על קיר הבית.',
    longDescription: ['תמונת הכותל המערבי בעיצוב אמנותי חם, במסגרת בגימור זהב. מביאה את אווירת ירושלים והקדושה אל הבית. מתאימה לסלון, למשרד וכמתנה.'],
    materials: ['הדפסת אמנות', 'מסגרת'], dimensions: '40×50 ס"מ',
    prepTimeDays: [2, 5], tags: ['ירושלים', 'כותל', 'אמנות קיר', 'נוי'], relatedSlugs: ['temple-model-decorative', 'jerusalem-wall-art-gold', 'blessing-cards-set'],
    stockStatus: 'in-stock', badges: ['bestseller'], audience: ['family'], occasions: ['בית חדש'],
  }),
  def({
    id: 'z13', sku: 'EB-JM-313', slug: 'blessing-cards-set',
    titleHe: 'מארז גלויות ברכה', imageUrl: `${IMG}/blessing-cards-set.svg`,
    category: 'מזכרות מירושלים', subcategory: 'גלויות',
    material: 'גלויות איכות בהדפסת זהב', basePrice: 35, isCustomizable: false, iconKey: 'gift',
    shortDescription: 'מארז גלויות ברכה מעוצבות לכל אירוע — מזל טוב, רפואה שלמה וברכת הבית, מוכנות לכתיבה.',
    longDescription: ['מארז גלויות ברכה מעוצבות בהדפסת זהב, לכל אירוע: מזל טוב, רפואה שלמה, ברכת הבית ותודה. חלל פנימי לכתיבה אישית. מגיעות עם מעטפות.'],
    materials: ['קרטון איכות', 'הדפסת זהב'], dimensions: '11×15 ס"מ (מארז 8)',
    prepTimeDays: [1, 2], tags: ['גלויות', 'ברכה', 'מתנה נגישה'], relatedSlugs: ['jerusalem-magnets-set', 'kotel-wall-framed', 'gift-hostess-shabbat'],
    stockStatus: 'in-stock', badges: [], audience: ['family'],
  }),
  def({
    id: 'z14', sku: 'EB-JM-314', slug: 'pomegranate-figurine-decor',
    titleHe: 'פסלון רימון דקורטיבי', imageUrl: `${IMG}/pomegranate-figurine.svg`,
    category: 'מזכרות מירושלים', subcategory: 'דגמים ופסלונים',
    material: 'שרף יצוק עם עיטור זהב', basePrice: 95, isCustomizable: false, iconKey: 'gift',
    shortDescription: 'פסלון רימון — סמל התורה והמצוות — בגימור אדום עמוק וכתר זהב, פריט נוי מרשים.',
    longDescription: ['פסלון רימון דקורטיבי, סמל התורה והשפע, בגימור אדום עמוק וכתר זהב. פריט נוי יפהפה למדף, לשולחן או כמתנה משמעותית לראש השנה ולחנוכת בית.'],
    materials: ['שרף יצוק', 'עיטור זהב'], dimensions: 'גובה 16 ס"מ',
    prepTimeDays: [1, 3], tags: ['רימון', 'נוי', 'ראש השנה', 'בית חדש'], relatedSlugs: ['temple-model-decorative', 'rosh-hashana-plate-divided', 'kotel-wall-framed'],
    stockStatus: 'in-stock', badges: [], audience: ['family'], occasions: ['בית חדש', 'חג'],
  }),
];
