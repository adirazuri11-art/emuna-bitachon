// ============================================================
// מוצרי הספק (ארט יודאיקה) — נגזרים מ-lib/supplier-products.json.
// מחיר באתר = מחיר עלות × 2 (מעוגל). לקוח מורשה.
// ⚠️ תמונות: placeholder ממותג עד החלפה בצילומי הספק (feed/CSV עם image URL).
// ============================================================

import type { CatalogProduct } from '@/lib/catalog';
import type { ProductIconKey } from '@/types';
import supplierData from '@/lib/supplier-products.json';
import { PLAIN_KIPPAH_EMBOSS } from '@/lib/customization-presets';
import { HIDDEN_VARIANT_CODES, groupForParent } from '@/lib/kippah-variants';

interface RawItem {
  id: string;
  t: string;
  cost: number;
  sz?: string;
  col?: string;
  mat?: string;
  c: string; // category slug
  s: string; // subcategory
  img?: string; // מזהה תמונה מרוחקת (ארט יודאיקה webp); קיים = תמונת hotlink + לוגו-שכבה
  imgFull?: string; // כתובת תמונה מלאה (למשל /big/<code>.jpg) — גובר על img
  pk?: number; // כמות יחידות במארז (המחיר הוא למארז שלם)
  nw?: number; // 1 = דגם כיפה חדש (סדר קטגוריה: מעל המארזים)
}

const RAW = (supplierData as { items: RawItem[] }).items;

// slug → שם קטגוריה בעברית (כמו ב-CatalogProduct.category). מונע תלות מעגלית.
const CAT_NAME: Record<string, string> = {
  'home-judaica': 'תשמישי קדושה לבית',
  mezuzot: 'מזוזות',
  'challah-covers': 'כיסויי חלה',
  havdalah: 'הבדלה',
  'washing-cups': 'נטלות ומים אחרונים',
  blessings: 'ברכות',
  'kiddush-cups': 'כוסות קידוש',
  candlesticks: 'פמוטים',
  'tzitzit-tallit': 'ציציות וטליתות',
  kippot: 'כיפות',
  headscarves: 'מטפחות מעוצבות',
  'gifts-events': 'מתנות ואירועים',
  'judaica-jewelry': 'תכשיטי יודאיקה',
  'jewish-art': 'אמנות ועיצוב יהודי',
  'books-siddurim': 'ספרים וסידורים',
  'holidays-moadim': 'חגים ומועדים',
  kids: 'מוצרים לילדים',
  'brit-newborn': 'ברית ולידה',
  'jerusalem-gifts': 'מזכרות מירושלים',
};

const CAT_ICON: Record<string, ProductIconKey> = {
  'home-judaica': 'mezuzah', mezuzot: 'mezuzah', 'challah-covers': 'textile',
  havdalah: 'candles', 'washing-cups': 'kiddush', blessings: 'gift',
  'kiddush-cups': 'kiddush', candlesticks: 'candles',
  'tzitzit-tallit': 'tallit', kippot: 'kippah', headscarves: 'textile',
  'gifts-events': 'gift', 'judaica-jewelry': 'gift', 'jewish-art': 'gift',
  'books-siddurim': 'gift', 'holidays-moadim': 'gift', kids: 'gift',
  'brit-newborn': 'gift', 'jerusalem-gifts': 'gift',
};

// תיאור מקצועי בגובה העיניים לכל קטגוריה — short למכירה קצרה, long לעמוד המוצר.
// המטרה: שהלקוח יבין בדיוק מה הוא קונה ובאיזו רמה, בלי הגזמות.
const CAT_ABOUT: Record<string, { short: string; long: string }> = {
  kippot: {
    short: 'כיפה נוחה וקלה שיושבת יפה על הראש — לשימוש יומיומי, לבית הכנסת ולאירועים.',
    long: 'הגימור מוקפד והתפרים נקיים, כך שהכיפה שומרת על צורתה ועל המראה שלה לאורך זמן. בחירה נכונה לשימוש יום-יומי, לשבתות וחגים ולאירועים משפחתיים.',
  },
  mezuzot: {
    short: 'בית מזוזה בעיצוב נקי שמשתלב יפה בכל פתח.',
    long: 'עשוי בגימור מוקפד ועמיד, נעים למגע ומחזיק מעמד לאורך שנים בכל תנאי מזג אוויר. משתלב יפה בפתחי הבית והעסק.',
  },
  'challah-covers': {
    short: 'כיסוי חלה שמוסיף כבוד וחגיגיות לשולחן השבת והחג.',
    long: 'בד נעים בגימור מוקפד ובמראה שנשאר יפה כביסה אחר כביסה — פרט קטן שעושה הבדל גדול בשולחן השבת. מתאים גם כמתנה מכובדת.',
  },
  'kiddush-cups': {
    short: 'גביע קידוש מכובד לרגע המיוחד של השבת — כלי שמלווה את המשפחה שנים.',
    long: 'משקל נעים לאחיזה, בסיס יציב וגימור מוקפד. גביע שנעים לקדש עליו בכל שבת וחג, ומתנה מרגשת לחתן, לבר מצווה או לחנוכת בית.',
  },
  candlesticks: {
    short: 'פמוטים שמביאים את אור השבת לשולחן, בעיצוב שנשאר יפה לאורך שנים.',
    long: 'מבנה יציב וגימור מוקפד שמכבד את הדלקת הנרות. עיצוב על-זמני שמשתלב בכל שולחן שבת וחג — ומתנה שנשמרת לדורות.',
  },
  havdalah: {
    short: 'סט הבדלה מכובד ושלם לרגע המפריד בין קודש לחול בסוף השבת.',
    long: 'נוח לשימוש ובמראה מוקפד שמלווה יפה את סדר ההבדלה. פריט שנעים להחזיק בו כל מוצאי שבת, ומתנה מחושבת לכל בית.',
  },
  'washing-cups': {
    short: 'נטלת נטילת ידיים יציבה ונוחה לאחיזה, לשימוש יומיומי בבית.',
    long: 'שתי אוזני אחיזה נוחות, בסיס יציב וגימור נקי שנשאר יפה לאורך זמן. כלי בסיסי ומכובד לכל בית יהודי.',
  },
  blessings: {
    short: 'ברכה מעוצבת שמוסיפה נוכחות חמה ואמונה לבית.',
    long: 'עבודת עיצוב מוקפדת שמתאימה לתלייה בסלון, במטבח, בכניסה או בעסק — ומעניקה תחושה של ברכה והגנה. גם מתנה מרגשת לחנוכת בית ולכל שמחה.',
  },
  'books-siddurim': {
    short: 'ברכון מהודר ונוח לאחיזה — יפה על שולחן השבת ומושלם לאירועים.',
    long: 'כריכה מוקפדת ועיצוב נעים לעין. מתאים לשימוש אישי, לשולחן השבת ולחלוקה מכובדת באירועים ושמחות.',
  },
  'brit-newborn': {
    short: 'פריט עדין ומכובד לרגע הברית — נשמר כמזכרת לשנים.',
    long: 'עבודה מוקפדת במראה רך ומרגש, שמכבד את הרגע המיוחד. מתנה שנשארת עם המשפחה כמזכרת יקרה.',
  },
  'holidays-moadim': {
    short: 'פריט שמוסיף לחג נוכחות ומראה חגיגי סביב השולחן ובבית.',
    long: 'עיצוב מוקפד שמכניס אווירת חג הביתה. פריט שמשלים את השולחן והבית לקראת המועד — ומתנה תואמת לעונה.',
  },
  kids: {
    short: 'פריט צבעוני, עמיד ומזמין — מתוכנן במיוחד לילדים.',
    long: 'בטוח, נעים לשימוש ובצבעים שילדים אוהבים. דרך יפה לחבר את הילדים למסורת ולמצוות מגיל צעיר.',
  },
  'tzitzit-tallit': {
    short: 'עבודת אריגה וקשירה מוקפדת, בנוחות ובמראה מכובד.',
    long: 'בד איכותי, קשירה לפי הנוסח וגימור נקי. פריט שמלווה את המתפלל שנים, ומתאים גם כמתנה משמעותית.',
  },
  headscarves: {
    short: 'מטפחת בעיצוב עדין מבד נעים — לכל יום ולאירועים.',
    long: 'בד איכותי בגימור מוקפד ובמראה מחמיא. משתלבת יפה בלבוש היום-יומי ומתאימה גם לאירועים.',
  },
  'gifts-events': {
    short: 'מתנה מחושבת ומכובדת לרגעים הגדולים.',
    long: 'עיצוב מוקפד ומראה שנעים לתת ולקבל. בחירה בטוחה לבר מצווה, חתונה, ברית וחנוכת בית — עם אפשרות להזמנות בכמויות.',
  },
};
const DEFAULT_ABOUT = {
  short: 'פריט יודאיקה איכותי לבית היהודי, בגימור מוקפד ובמראה מכובד.',
  long: 'עבודת גימור מוקפדת ובחירת חומרים איכותית, במראה שמכבד את הבית היהודי. מתאים לשימוש יום-יומי ולמתנה כאחד.',
};

// מחיר מכירה — markup מדורג + תמחור פסיכולוגי (מסתיים ב-9).
// ספק (ארט יודאיקה) = סיטונאי; קמעונאות רגילה ביודאיקה ~×2.5–3.
// כאן ×2.25–2.4 → רווחי אך עקבית זול יותר מהמתחרים.
function retail(cost: number): number {
  const mult = cost <= 25 ? 2.4 : cost <= 80 ? 2.3 : 2.25;
  let p = cost * mult;
  if (p < 30) p = Math.round(p);              // מחירים נמוכים — שקל שלם
  else if (p < 100) p = Math.round(p / 5) * 5 - 1; // ...9 / ...4
  else p = Math.round(p / 10) * 10 - 1;       // ...9
  return Math.max(1, Math.round(p));
}

// תיוג ידני של פריטים בולטים — מזין את רצועות דף הבית
const BESTSELLER = new Set(['UK41045', 'UK45337', 'UK24455', 'UK60964', 'UK16221', 'UK80975', 'UK83398', 'UK62291', 'UK89672', 'UK48105', 'UK18964', 'UK40873']);
const RECOMMENDED = new Set(['UK82709', 'UK40066', 'UK42846', 'UK81496', 'UK59565', 'UK41856', 'UK80970', 'UK81736', 'UK66992', 'UK47600', 'UK67676', 'UK42374']);
const NEWLY_ADDED = new Set(['UK81693', 'UK81689', 'UK81667', 'UK81737', 'UK81735', 'UK55718', 'UK55721']);

function related(item: RawItem): string[] {
  return RAW.filter((o) => o.s === item.s && o.id !== item.id)
    .slice(0, 3)
    .map((o) => `art-${o.id.toLowerCase()}`);
}

// ============================================================
// סטנדים הנמכרים כמארז שלם — המחיר באתר צריך לשקף את הסטנד כולו,
// לא יחידה בודדת. המפתח הוא ה-SKU המדויק (4 מוצרים בלבד).
// המחיר מחושב כ: retail(cost) × מספר היחידות בסטנד.
// ⚠️ idempotent — נגזר תמיד מחדש מ-retail(cost); לעולם לא מוכפל פעמיים.
// יחידת המכירה/מלאי נשארת "סטנד אחד" (כמות 1 בעגלה = סטנד שלם).
// ============================================================
const STAND_PACKS: Record<string, number> = {
  UK82037: 24, // סטנד כלי בשמים זכוכית עם ציפורן מעורב
  UK82038: 24, // סטנד כלי בשמים זכוכית עם תערובת פרחים מעורב
  UK46232: 12, // סטנד פקקים מעורב לבקבוק יין
  UK47495: 72, // סטנד מעורב צמידים עם אורנמנטים
  UK83062: 24, // סטנד 24 יח מעורב של ברכות פרספקס לרכב
};

// מוצרים שאצל הספק מסומנים "מגיע בקרוב". הערך = תאריך הגעה משוער (כפי שמופיע
// אצל הספק), או '' כאשר אין תאריך. מסמן stockStatus='coming-soon' ומציג הערה.
const COMING_SOON: Record<string, string> = {
  UK67961: '09/08/2026',
  UK67963: '09/08/2026',
  UK67964: '09/08/2026',
  UK59877: '21/08/2026',
  UK59878: '21/08/2026',
  UK59202: '',
  UK59217: '',
  UK12424: '09/08/2026',
  UK12429: '09/08/2026',
  UK12430: '09/08/2026',
  UK12414: '09/08/2026',
  UK12422: '09/08/2026',
  UK40299: '21/08/2026',
  UK40300: '21/08/2026',
  UK40301: '21/08/2026',
  UK40302: '21/08/2026',
  UK40303: '21/08/2026',
  UK49179: '21/08/2026',
};

// המרת תאריך ספק 'DD/MM/YYYY' → ISO 8601 (אזור זמן ישראל) ל-availability_date.
// ריק/לא-תקין → הערכה של +21 יום מהיום (הפריט בדרך; גוגל דורשת תאריך ל-preorder).
function comingSoonIso(cs: string): string {
  const m = cs.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}T09:00:00+03:00`;
  const d = new Date();
  d.setDate(d.getDate() + 21);
  return `${d.toISOString().slice(0, 10)}T09:00:00+03:00`;
}

function toProduct(item: RawItem): CatalogProduct {
  // כל התמונות מאוחסנות אצלנו: /images/supplier-real/<SKU>.jpg (אין hotlink לספק).
  // remote = היה מקור מרוחק (משפיע רק על זמני אספקה/טקסט, לא על התמונה עצמה).
  const remote = Boolean(item.img) || Boolean(item.imgFull);
  const src = `/images/supplier-real/${item.id}.jpg`;
  // ⚠️ רק כיפות סרוגות נמכרות במארז; כל שאר הכיפות — ביחידה בלבד.
  const isSruga = item.c === 'kippot' && item.s === 'כיפות סרוגות';
  // הטבעה אישית (מינ' 100 יח') — כיפות חלקות (פריק/סאטן/אירועים), לא סרוגות.
  const engravable = item.c === 'kippot' && item.cost < 9 && !isSruga;
  // המחיר למארז חל אך ורק על סרוגות; אחרת המחיר הוא ליחידה.
  const packQty = isSruga && item.pk && item.pk > 1 ? item.pk : 1;
  // מינ' 5 יח' רק לכיפות בסיס זולות (פריק/סאטן/רגילות) — לא לזמש/עור/קטיפה/סרוגות
  // שהן כיפות איכות הנמכרות ביחידה. מחיר היחידה נשאר ה-basePrice (מיון מזול ליקר).
  const basicBulk = item.c === 'kippot' && !/עור|זמש|קטיפה|סרוג/.test(item.s);
  const minOrderUnits = basicBulk && item.cost <= 8 ? 5 : undefined;
  const price = retail(item.cost * packQty);
  // סטנד מלא — מכפילים את מחיר היחידה במספר היחידות בסטנד (רק ל-4 ה-SKU שהוגדרו).
  const standUnits = STAND_PACKS[item.id];
  const finalPrice = standUnits ? price * standUnits : price;
  const standNote = standUnits
    ? `המחיר עבור סטנד מלא הכולל ${standUnits} יחידות. המוצר אינו נמכר כיחידה בודדת.`
    : '';
  // "מגיע בקרוב" — לפי סימון הספק. cs=תאריך, ''=בקרוב ללא תאריך, undefined=במלאי.
  const cs = COMING_SOON[item.id];
  const isComingSoon = cs !== undefined;
  const comingNote = isComingSoon ? (cs ? `יגיע למלאי בתאריך ${cs}. ` : 'יגיע למלאי בקרוב. ') : '';
  // תאריך הגעה משוער (ISO) לשדה availability_date בפיד Merchant — נדרש ל-preorder.
  const availabilityDate = isComingSoon ? comingSoonIso(cs) : undefined;
  // כל מוצר מזוזה (בכל קטגוריה) — הבהרה שהמזוזה מגיעה ללא קלף.
  const isMezuzah = item.c === 'mezuzot' || /מזוז/.test(item.t);
  const mezuzahNote = isMezuzah
    ? 'שימו לב: המזוזה מגיעה ללא קלף. מי שמעוניין בקלף בנוסף — מוזמן לפנות אלינו. '
    : '';
  const packNote = standUnits ? `סטנד ${standUnits} יח'` : packQty > 1 ? `מארז ${packQty} יח'` : '';
  const dims = item.sz && /^\d/.test(item.sz) ? `${item.sz} ס"מ` : item.sz;
  const details = [item.mat && `חומר: ${item.mat}`, item.col && `צבע: ${item.col}`, dims && `מידה: ${dims}`]
    .filter(Boolean)
    .join(' · ');
  // זמן אספקה — פריטים חדשים (מרוחקים) נשלחים עד 4 ימי עסקים.
  const deliveryShort = remote ? 'נשלח עד 4 ימי עסקים.' : 'זמין במלאי ומוכן למשלוח.';
  const deliveryLong = remote
    ? 'זמין להזמנה — נשלח עד 4 ימי עסקים. ניתן לצרף אריזת מתנה.'
    : 'זמין במלאי ונשלח תוך 1–3 ימי עסקים. ניתן לצרף אריזת מתנה.';
  const about = CAT_ABOUT[item.c] ?? DEFAULT_ABOUT;

  return {
    id: `art-${item.id}`,
    sku: item.id,
    slug: `art-${item.id.toLowerCase()}`,
    titleHe: item.t,
    imageUrl: src,
    category: CAT_NAME[item.c] ?? 'מתנות ואירועים',
    subcategory: item.s,
    material: [item.mat, packNote].filter(Boolean).join(' · ') || undefined,
    basePrice: finalPrice,
    ...(minOrderUnits ? { minOrderUnits } : {}),
    // סדר קטגוריית כיפות: מארז (packQty>1/סטנד/מינ׳-הזמנה) בתחתית; דגם חדש מעליהם.
    isPack: packQty > 1 || !!minOrderUnits || !!standUnits,
    isNewModel: !!item.nw,
    isCustomizable: engravable,
    ...(engravable ? { customization: PLAIN_KIPPAH_EMBOSS } : {}),
    iconKey: CAT_ICON[item.c] ?? 'gift',
    shortDescription: `${comingNote}${mezuzahNote}${standNote ? `${standNote} ` : ''}${about.short}${details ? ` ${details}.` : ''} ${packNote ? `${packNote} · ` : ''}${deliveryShort}`,
    longDescription: [
      `${item.t}.${details ? ` ${details}.` : ''}`,
      `${about.short} ${about.long}`,
      mezuzahNote ? mezuzahNote.trim() : '',
      packNote ? `שימו לב: המחיר הוא ל${packNote} (מארז שלם).` : '',
      minOrderUnits ? `נמכר ביחידות, במינימום הזמנה של ${minOrderUnits} יחידות.` : '',
      deliveryLong,
    ].filter(Boolean),
    materials: item.mat ? [item.mat] : ['—'],
    ...(dims ? { dimensions: dims } : {}),
    ...(item.col ? { colors: [item.col] } : {}),
    prepTimeDays: remote ? [1, 4] : [1, 3],
    isNew: NEWLY_ADDED.has(item.id),
    tags: [item.s, ...(item.mat ? [item.mat] : [])],
    relatedSlugs: related(item),
    stockStatus: isComingSoon ? 'coming-soon' : 'in-stock',
    badges: [
      ...(BESTSELLER.has(item.id) ? (['bestseller'] as const) : []),
      ...(RECOMMENDED.has(item.id) ? (['recommended'] as const) : []),
      ...(NEWLY_ADDED.has(item.id) ? (['new'] as const) : []),
    ],
    audience: ['family'],
    gallery: [
      { src, label: 'מבט ראשי' },
      { src, label: 'תקריב', zoom: 1.5 },
    ],
    isPlaceholderImage: false,
    logoOverlay: remote, // תמונות ספק (568) — לוגו כשכבה; הישנות (231) עם לוגו צרוב
    ...(availabilityDate ? { availabilityDate } : {}),
  };
}

export const SUPPLIER_PRODUCTS: CatalogProduct[] = RAW
  // מסתירים קודי-בן של וריאנטי מידה — מוצג רק המוצר הראשי (301 מפנה מהבן לראשי).
  .filter((item) => !HIDDEN_VARIANT_CODES.has(item.id.toUpperCase()))
  .map(toProduct)
  // מצרפים למוצר ראשי את וריאנטי המידה + שם-דגם נקי (בלי מידה) + תמחור "החל מ־".
  .map((p) => {
    const g = groupForParent(p.sku);
    if (!g) return p;
    const prices = g.variants.map((v) => v.price);
    const varied = prices.some((x) => x !== prices[0]);
    return {
      ...p,
      titleHe: g.baseName || p.titleHe,
      sizeVariants: g.variants.map((v) => ({ code: v.code, size: v.size, price: v.price, slug: v.slug, unit: v.unit, ...(v.diameterCm ? { diameterCm: v.diameterCm } : {}) })),
      sizes: g.variants.map((v) => v.size),
      basePrice: Math.min(...prices),
      priceType: (varied ? 'from' : 'fixed') as CatalogProduct['priceType'],
    };
  });
