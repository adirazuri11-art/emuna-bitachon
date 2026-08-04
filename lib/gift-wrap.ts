// ============================================================
// אריזת מתנה + כרטיס ברכה — מקור אמת יחיד (Client + Server).
// מודול טהור ללא תלויות, כדי שספירת המילים וה-Validation יהיו זהים
// בדפדפן ובשרת, והמחיר ייקבע כאן בלבד (לעולם לא מה-Client).
// ============================================================

export const GIFT_WRAP_PRICE = 10; // ₪ — מחיר סופי, פעם אחת לכל הזמנה
export const GIFT_WRAP_MAX_WORDS = 100;
export const GIFT_WRAP_MAX_CHARS = 1000; // תקרת Payload פנימית (המילים הן הכלל המוצג)

export const GIFT_WRAP_ERRORS = {
  empty: 'יש לכתוב את הברכה שתרצו לצרף למתנה.',
  tooManyWords: 'הברכה יכולה לכלול עד 100 מילים. אנא קצרו את הטקסט כדי להמשיך.',
  tooLong: 'הברכה ארוכה מדי. אנא קצרו את הטקסט כדי להמשיך.',
} as const;

/**
 * נרמול בטוח של הטקסט: איחוד מעברי שורה, הסרת תווים בלתי-נראים
 * (zero-width / BOM / word-joiner) והמרת רווחים מיוחדים לרווח רגיל.
 * נשמר לצורך הדבקה מ-WhatsApp / Notes / Word.
 */
export function normalizeGiftText(input: string): string {
  return (input ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u200b-\u200d\ufeff\u2060]/g, '') // zero-width, BOM, word-joiner
    .replace(/[\u00a0\u2007\u202f]/g, ' '); // nbsp variants → רווח רגיל
}

/**
 * ספירת מילים תקינה בעברית ובאנגלית:
 * - trim בקצוות, רווחים כפולים = מפריד יחיד, מעבר שורה = מפריד.
 * - מילה עם פיסוק צמוד = מילה אחת. רווחים/שורות ריקות אינם נספרים.
 * - טקסט ריק / רווחים בלבד = 0.
 */
export function countWords(input: string): number {
  const norm = normalizeGiftText(input).trim();
  if (!norm) return 0;
  return norm.split(/\s+/).filter(Boolean).length;
}

/**
 * המרה ל-Plain Text בטוח: הסרת תגיות HTML ותווי בקרה,
 * תוך שמירה על מעברי שורה, עברית, אנגלית, מספרים, פיסוק ואימוג'ים.
 * (בנוסף ל-Output encoding של React בעת ההצגה — הגנה בשכבות.)
 */
export function sanitizeGiftMessage(input: string): string {
  return normalizeGiftText(input)
    .replace(/<[^>]*>/g, '') // הסרת כל תגית
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ''); // תווי בקרה (משאיר \n ו-\t)
}

export interface GiftValidation {
  ok: boolean;
  wordCount: number;
  sanitized: string;
  error?: string;
}

/** Validation מלא של הברכה. משמש גם ב-Client (נוחות) וגם בשרת (אכיפה). */
export function validateGiftMessage(input: string): GiftValidation {
  const sanitized = sanitizeGiftMessage(input);
  const wordCount = countWords(sanitized);
  if (wordCount === 0) return { ok: false, wordCount, sanitized, error: GIFT_WRAP_ERRORS.empty };
  if (wordCount > GIFT_WRAP_MAX_WORDS)
    return { ok: false, wordCount, sanitized, error: GIFT_WRAP_ERRORS.tooManyWords };
  if (sanitized.length > GIFT_WRAP_MAX_CHARS)
    return { ok: false, wordCount, sanitized, error: GIFT_WRAP_ERRORS.tooLong };
  return { ok: true, wordCount, sanitized };
}

/**
 * חיוב אריזת המתנה — מקור האמת של המחיר.
 * 10 ₪ פעם אחת בלבד כאשר השירות נבחר ויש פריטים בסל, אחרת 0.
 * לעולם אינו תלוי בכמות המוצרים או ביחידות.
 */
export function giftWrapCharge(selected: boolean, hasItems: boolean): number {
  return selected && hasItems ? GIFT_WRAP_PRICE : 0;
}
