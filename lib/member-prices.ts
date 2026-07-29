// ============================================================
// מחירי חבר-מועדון על פריטים נבחרים.
// מפתח = SKU של המוצר (למשל "UK41045"), ערך = מחיר החבר בש"ח.
// חל רק על גולשים שזוהו כחברי מועדון (קוד אישי תקף) — נאכף בקופה.
// אדיר קובע אילו פריטים בהמשך; מוסיפים כאן שורה לכל פריט.
// דוגמה:  'UK41045': 149,
// ============================================================

export const MEMBER_PRICES: Record<string, number> = {
  // (ריק בינתיים — יתמלא לפי הפריטים שתבחר)
};

/** מחזיר מחיר-חבר לפריט אם קיים ונמוך מהמחיר הרגיל, אחרת null. */
export function memberPriceFor(sku: string, regularPrice: number): number | null {
  const p = MEMBER_PRICES[sku];
  return typeof p === 'number' && p > 0 && p < regularPrice ? p : null;
}

/** האם קיימת בכלל הטבת-חבר על הפריט (לתגית "מחיר חבר" בכרטיס). */
export const hasMemberDeal = (sku: string) => sku in MEMBER_PRICES;
