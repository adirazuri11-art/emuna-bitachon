// ============================================================
// lib/hebcal.ts — מנוע הפרסונליזציה הדינמי
// שואב תאריך עברי, זמני שבת וחגים קרובים מ-Hebcal API
// ומחליט איזה "מצב" דף הבית יציג (רגיל / ערב שבת / חג קרוב)
// ============================================================

const HEBCAL_BASE = 'https://www.hebcal.com';
const JERUSALEM_GEONAME_ID = 281184;

export interface ShabbatTimes {
  candleLighting: string | null; // "19:04"
  havdalah: string | null;
  parsha: string | null; // "פרשת פינחס"
}

export interface UpcomingHoliday {
  title: string; // English key from Hebcal
  titleHe: string;
  date: string; // ISO
  daysUntil: number;
}

export type HomepageMode = 'regular' | 'shabbat' | 'holiday';

export interface HomepageContext {
  mode: HomepageMode;
  hebrewDate: string | null;
  shabbat: ShabbatTimes | null;
  holiday: UpcomingHoliday | null;
  hero: {
    badge: string;
    title: string;
    highlight: string;
    subtitle: string;
    primaryCta: string;
  };
  collectionTitle: string;
}

interface HebcalItem {
  title: string;
  hebrew?: string;
  category: string;
  subcat?: string;
  date: string;
}

async function hebcalFetch<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null; // אין רשת / API נפל — האתר ממשיך לעבוד במצב רגיל
  }
}

/** תאריך עברי של היום, בעברית מלאה (למשל: ו׳ באב תשפ״ו) */
export async function getHebrewDate(date = new Date()): Promise<string | null> {
  const url = `${HEBCAL_BASE}/converter?cfg=json&gy=${date.getFullYear()}&gm=${
    date.getMonth() + 1
  }&gd=${date.getDate()}&g2h=1`;
  const data = await hebcalFetch<{ hebrew?: string }>(url);
  return data?.hebrew ?? null;
}

/** זמני שבת הקרובה (ברירת מחדל: ירושלים) */
export async function getShabbatTimes(
  geonameId = JERUSALEM_GEONAME_ID
): Promise<ShabbatTimes | null> {
  const url = `${HEBCAL_BASE}/shabbat?cfg=json&geonameid=${geonameId}&M=on`;
  const data = await hebcalFetch<{ items: HebcalItem[] }>(url);
  if (!data?.items) return null;

  const toTime = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleTimeString('he-IL', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Jerusalem',
        })
      : null;

  const candles = data.items.find((i) => i.category === 'candles');
  const havdalah = data.items.find((i) => i.category === 'havdalah');
  const parsha = data.items.find((i) => i.category === 'parashat');

  return {
    candleLighting: toTime(candles?.date),
    havdalah: toTime(havdalah?.date),
    parsha: parsha?.hebrew ?? null,
  };
}

// ימי צום ואבלות — לא מריצים עליהם קמפיין חגיגי
const NON_FESTIVE = [
  "Tish'a B'Av",
  'Tzom Tammuz',
  'Tzom Gedaliah',
  'Asara B\'Tevet',
  "Ta'anit Esther",
  "Ta'anit Bechorot",
  'Yom HaShoah',
  'Yom HaZikaron',
];

/** חגים מרכזיים ב-45 הימים הקרובים */
export async function getUpcomingHolidays(days = 45): Promise<UpcomingHoliday[]> {
  const now = new Date();
  const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const url = `${HEBCAL_BASE}/hebcal?v=1&cfg=json&maj=on&start=${fmt(now)}&end=${fmt(end)}`;

  const data = await hebcalFetch<{ items: HebcalItem[] }>(url);
  if (!data?.items) return [];

  return data.items
    .filter((i) => i.category === 'holiday')
    .map((i) => ({
      title: i.title,
      titleHe: i.hebrew ?? i.title,
      date: i.date,
      daysUntil: Math.max(
        0,
        Math.ceil((new Date(i.date).getTime() - now.getTime()) / 86400000)
      ),
    }));
}

// קמפיינים ממופים לפי חג — banners + קולקציות מודגשות
const HOLIDAY_CAMPAIGNS: Record<
  string,
  { badge: string; title: string; highlight: string; subtitle: string; collection: string }
> = {
  'Rosh Hashana': {
    badge: 'נערכים לימים הנוראים',
    title: 'שנה חדשה,',
    highlight: 'שולחן של מלכות',
    subtitle: 'רימוני כסף, צלחות דבש מעוצבות ופמוטים — קולקציית ראש השנה היוקרתית.',
    collection: 'קולקציית הימים הנוראים',
  },
  Chanukah: {
    badge: 'אור החג מתקרב',
    title: 'חנוכה של',
    highlight: 'זהב ואור',
    subtitle: 'חנוכיות כסף בעבודת יד, עם אפשרות חריטה אישית לכל משפחה.',
    collection: 'קולקציית חנוכה',
  },
  Pesach: {
    badge: 'מתכוננים לליל הסדר',
    title: 'ליל סדר',
    highlight: 'שכולו הדר',
    subtitle: 'קערות סדר, גביעי אליהו וכיסויי מצה רקומים ברמה אחרת.',
    collection: 'קולקציית פסח',
  },
  Sukkot: {
    badge: 'זמן שמחתנו',
    title: 'סוכה של',
    highlight: 'אושפיזין',
    subtitle: 'סטים לארבעת המינים, קישוטי סוכה יוקרתיים וכלי הידור לחג.',
    collection: 'קולקציית סוכות',
  },
  Shavuot: {
    badge: 'לקראת מתן תורה',
    title: 'חג מתן',
    highlight: 'תורה',
    subtitle: 'עיטורי ספר תורה, כתרים ורימונים — הידור מצווה אמיתי.',
    collection: 'קולקציית שבועות',
  },
  Purim: {
    badge: 'ימי הפורים קרבים',
    title: 'משלוח מנות',
    highlight: 'מהודר',
    subtitle: 'מגילות אסתר בכתב סת"ם, רעשנים מכסף ומארזי יוקרה.',
    collection: 'קולקציית פורים',
  },
};

const DEFAULT_HERO = {
  badge: 'קולקציית תשפ"ו',
  title: 'יודאיקה שעוברת',
  highlight: 'מדור לדור',
  subtitle:
    'כלי קודש ותשמישי קדושה ברמת גימור בלתי מתפשרת — התאמה אישית מלאה, אישורי כשרות מאומתים ואחריות לכל החיים.',
  primaryCta: 'לקולקציה היוקרתית',
};

/**
 * הלב של המנוע הדינמי: מחזיר את מצב דף הבית לפי הלוח העברי.
 * עדיפות: חג מרכזי ב-30 הימים הקרובים > מצב ערב שבת (ה'-ו') > רגיל.
 */
export async function getHomepageContext(): Promise<HomepageContext> {
  const [hebrewDate, shabbat, holidays] = await Promise.all([
    getHebrewDate(),
    getShabbatTimes(),
    getUpcomingHolidays(),
  ]);

  const nextFestive = holidays.find(
    (h) =>
      h.daysUntil <= 30 &&
      !NON_FESTIVE.some((f) => h.title.startsWith(f)) &&
      HOLIDAY_CAMPAIGNS[Object.keys(HOLIDAY_CAMPAIGNS).find((k) => h.title.startsWith(k)) ?? '']
  );

  if (nextFestive) {
    const key = Object.keys(HOLIDAY_CAMPAIGNS).find((k) => nextFestive.title.startsWith(k))!;
    const c = HOLIDAY_CAMPAIGNS[key];
    return {
      mode: 'holiday',
      hebrewDate,
      shabbat,
      holiday: nextFestive,
      hero: { ...c, primaryCta: `ל${c.collection}` },
      collectionTitle: c.collection,
    };
  }

  // מצב ערב שבת: חמישי ושישי (שעון ישראל)
  const israelWeekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jerusalem',
    weekday: 'short',
  }).format(new Date());
  const isShabbatPrep = israelWeekday === 'Thu' || israelWeekday === 'Fri';

  if (isShabbatPrep && shabbat) {
    return {
      mode: 'shabbat',
      hebrewDate,
      shabbat,
      holiday: null,
      hero: {
        badge: shabbat.parsha ? `שבת ${shabbat.parsha}` : 'ערב שבת מתקרב',
        title: 'שולחן שבת של',
        highlight: 'מלכות',
        subtitle: `פמוטים, גביעי קידוש וכיסויי חלה בעיצוב יוקרתי. הדלקת נרות: ${
          shabbat.candleLighting ?? '—'
        } · משלוח אקספרס עד שישי בצהריים.`,
        primaryCta: 'לקולקציית השבת',
      },
      collectionTitle: 'מובחרי שולחן השבת',
    };
  }

  return {
    mode: 'regular',
    hebrewDate,
    shabbat,
    holiday: null,
    hero: DEFAULT_HERO,
    collectionTitle: 'הקולקציה הנבחרת',
  };
}
