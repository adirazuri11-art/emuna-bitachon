// ============================================================
// מאתר מתנה מבוסס AI — בחירת מועמדים מהקטלוג + קריאה ל-Claude שבוחר
// את המתנות המתאימות ומנמק. רץ בצד-שרת בלבד (הקטלוג לא נשלח ל-client).
// נכשל בחן: אם אין מפתח/שגיאה/פרסינג נכשל → { ok:false } וה-client נופל
// חזרה למאתר ה-rule-based הקיים. לא שובר שום דבר.
// ============================================================

import { PRODUCTS, type CatalogProduct } from '@/lib/catalog';

const MODEL = 'claude-sonnet-5';

export interface GiftQuery {
  audience?: string | null; // men | women | kids | family
  occasion?: string | null; // חתונה / בר מצווה / ...
  budgetMin?: number;
  budgetMax?: number;
  freeText?: string; // טקסט חופשי מהלקוח — הכוח של ה-AI
}

export interface GiftRecommendation {
  id: string;
  reason: string; // נימוק אישי קצר למה זה מתאים
}
export interface GiftAiResult {
  ok: boolean;
  intro?: string; // משפט פתיחה חם ואישי
  recommendations: GiftRecommendation[];
  error?: string;
}

const priceOf = (p: CatalogProduct) => p.discountPrice ?? p.basePrice;
const norm = (s: string) => (s || '').replace(/["'׳״]/g, '').toLowerCase();

const OCCASION_KW: Record<string, string[]> = {
  חתונה: ['זוג', 'סט', 'קידוש', 'גביע', 'כוס', 'פמוט', 'ברכת הבית', 'מגן דוד', 'שרשרת', 'צמיד', 'חמסה'],
  'בר מצווה': ['תפילין', 'טלית', 'ציצית', 'כיפה', 'סידור', 'תהילים', 'שמע ישראל', 'מגן דוד'],
  יולדת: ['תינוק', 'לידה', 'ברית', 'כרית', 'מזל טוב', 'חמסה', 'לרך הנולד'],
  'בית חדש': ['מזוזה', 'ברכת הבית', 'חמסה', 'ירושלים', 'כותל', 'פרנסה'],
  שבת: ['פמוט', 'נרות', 'חלה', 'קידוש', 'גביע', 'מפית', 'פלטה', 'הבדלה', 'נטל', 'מלחי'],
  חג: ['דבש', 'כוורת', 'שנה טובה', 'סדר', 'מגיל', 'חנוכי', 'סביבון', 'אתרוג'],
};
const AUDIENCE_KW: Record<string, string[]> = {
  women: ['שרשרת', 'צמיד', 'עגיל', 'תכשיט', 'מטפחת', 'פמוט', 'אשת חיל', 'כרית'],
  men: ['תפילין', 'טלית', 'ציצית', 'כיפה', 'מפתחות', 'ארנק'],
  kids: ['ילד', 'תינוק', 'צבעוני', 'ראשית', 'סביבון'],
  family: [],
};

// בחירת ~45 מועמדים רלוונטיים לפי תקציב + מילות-מפתח + איכות, כדי לשמור
// על prompt קצר. Claude עושה את הבחירה והנימוק הסופיים מתוך אלה.
function selectCandidates(q: GiftQuery, limit = 45): CatalogProduct[] {
  const min = q.budgetMin ?? 0;
  const max = q.budgetMax ?? Infinity;
  const occKw = (q.occasion && OCCASION_KW[q.occasion]) || [];
  const audKw = (q.audience && AUDIENCE_KW[q.audience]) || [];
  const freeWords = norm(q.freeText || '').split(/\s+/).filter((w) => w.length >= 2);

  const inBudget = PRODUCTS.filter((p) => {
    const pr = priceOf(p);
    return pr >= min && pr <= max && p.stockStatus !== 'coming-soon';
  });
  const pool = inBudget.length >= 12 ? inBudget : PRODUCTS.filter((p) => p.stockStatus !== 'coming-soon');

  const scored = pool.map((p) => {
    const hay = norm(`${p.titleHe} ${p.subcategory ?? ''} ${p.category} ${(p.tags ?? []).join(' ')}`);
    let s = 0;
    for (const kw of occKw) if (hay.includes(norm(kw))) s += 3;
    for (const kw of audKw) if (hay.includes(norm(kw))) s += 2;
    for (const w of freeWords) if (hay.includes(w)) s += 4; // הטקסט החופשי — משקל גבוה
    if ((p.badges ?? []).includes('bestseller')) s += 1.5;
    if ((p.badges ?? []).includes('recommended')) s += 1;
    return { p, s };
  });

  scored.sort((a, b) => b.s - a.s || priceOf(b.p) - priceOf(a.p));
  return scored.slice(0, limit).map((x) => x.p);
}

function candidateLine(p: CatalogProduct): string {
  const parts = [
    `id:${p.id}`,
    p.titleHe,
    `[${p.category}${p.subcategory ? '/' + p.subcategory : ''}]`,
    `₪${priceOf(p)}`,
    (p.shortDescription || '').replace(/\s+/g, ' ').slice(0, 90),
  ];
  return parts.join(' | ');
}

export async function recommendGifts(q: GiftQuery): Promise<GiftAiResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: false, recommendations: [], error: 'no-key' };

  const candidates = selectCandidates(q);
  if (candidates.length === 0) return { ok: false, recommendations: [], error: 'no-candidates' };

  const budgetTxt =
    q.budgetMax === Infinity || q.budgetMax == null
      ? q.budgetMin
        ? `מעל ₪${q.budgetMin}`
        : 'ללא הגבלה'
      : `₪${q.budgetMin ?? 0}–${q.budgetMax}`;

  const system = `אתה יועץ מתנות מומחה בחנות היודאיקה היוקרתית "אמונה וביטחון".
המשימה: לבחור מתוך רשימת המוצרים המצורפת בלבד את 6 המתנות המתאימות ביותר למי שהלקוח מתאר, ולנמק כל בחירה במשפט אישי אחד וחם.

כללי ברזל:
- בחר אך ורק מתוך רשימת המוצרים (לפי ה-id המדויק). אל תמציא מוצרים או id.
- דרג מהמתאים ביותר לפחות. אם פחות מ-6 באמת מתאימים — החזר פחות.
- הנימוק: קצר (עד ~12 מילים), אישי, מסביר *למה זה מתאים דווקא למקבל הזה*. בעברית חמה, בלי סופרלטיבים ריקים.
- כתוב משפט פתיחה ("intro") אישי וקצר (1–2 משפטים) שמראה שהבנת את הבקשה.
- החזר JSON תקין בלבד, ללא טקסט מסביב, בפורמט:
{"intro":"...","recommendations":[{"id":"art-XX","reason":"..."}]}`;

  const userMsg = `הלקוח מחפש מתנה עבור: ${q.audience ? `קהל=${q.audience}` : 'לא צוין'} · אירוע=${q.occasion || 'לא צוין'} · תקציב=${budgetTxt}.
${q.freeText ? `תיאור חופשי מהלקוח: "${q.freeText}"` : 'הלקוח לא הוסיף תיאור חופשי.'}

רשימת המוצרים לבחירה (id | שם | [קטגוריה] | מחיר | תיאור):
${candidates.map(candidateLine).join('\n')}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 900,
        system,
        messages: [{ role: 'user', content: userMsg }],
      }),
    });
    if (!res.ok) return { ok: false, recommendations: [], error: `http-${res.status}` };
    const data = await res.json();
    const text = Array.isArray(data?.content) ? data.content.map((c: { text?: string }) => c.text ?? '').join('') : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { ok: false, recommendations: [], error: 'no-json' };
    const parsed = JSON.parse(jsonMatch[0]) as { intro?: string; recommendations?: GiftRecommendation[] };

    const valid = new Set(PRODUCTS.map((p) => p.id));
    const recs = (parsed.recommendations ?? [])
      .filter((r) => r?.id && valid.has(r.id))
      .slice(0, 6)
      .map((r) => ({ id: r.id, reason: String(r.reason ?? '').slice(0, 120) }));

    if (recs.length === 0) return { ok: false, recommendations: [], error: 'empty' };
    return { ok: true, intro: String(parsed.intro ?? '').slice(0, 240), recommendations: recs };
  } catch (e) {
    return { ok: false, recommendations: [], error: e instanceof Error ? e.message.slice(0, 80) : 'exception' };
  }
}
