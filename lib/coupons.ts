// ============================================================
// מערכת קופונים — קופונים סטטיים + קופונים אישיים (localStorage).
// תומך אחוז/סכום קבוע, תוקף, שימוש חד-פעמי.
// ⚠️ אכיפה מלאה "לאדם אחד בלבד" דורשת שרת/DB; כאן מימוש בצד-לקוח
//    (קופון קשור לדפדפן, חד-פעמי, מוגבל בזמן) — מוכן להחלפה ב-DB.
// ============================================================

export interface Coupon {
  code: string;
  type: 'pct' | 'fixed';
  value: number;
  label: string;
}

export interface PersonalCoupon extends Coupon {
  expires: number; // timestamp
  firstOrderOnly?: boolean;
  used?: boolean;
}

const STATIC: Coupon[] = [{ code: 'ברוכים10', type: 'pct', value: 10, label: 'הנחת הצטרפות 10%' }];
const KEY = 'emuna-personal-coupons';

function readPersonal(): PersonalCoupon[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

function writePersonal(list: PersonalCoupon[]) {
  if (typeof window !== 'undefined') localStorage.setItem(KEY, JSON.stringify(list));
}

export function savePersonalCoupon(c: PersonalCoupon) {
  const list = readPersonal();
  if (!list.some((x) => x.code === c.code)) {
    list.push(c);
    writePersonal(list);
  }
}

/** קופונים אישיים תקפים (לתצוגה, למשל בסל) */
export function activePersonalCoupons(): PersonalCoupon[] {
  const now = Date.now();
  return readPersonal().filter((c) => !c.used && c.expires > now);
}

const calcDiscount = (c: Coupon, subtotal: number) =>
  c.type === 'pct' ? Math.round((subtotal * c.value) / 100) : Math.min(c.value, subtotal);

// קופון שהוחל בסל — מטא-דאטה שנשמר, כדי שהסל והקופה יחשבו הנחה זהה.
// server=true → קוד מועדון שאומת בשרת; צריך redeem אטומי בסיום ההזמנה.
export interface AppliedCoupon {
  code: string;
  type: 'pct' | 'fixed';
  value: number;
  label: string;
  server: boolean;
}

/** הנחה מתוך קופון מוחל לפי סכום נוכחי (זהה בסל ובקופה). */
export const couponDiscount = (c: AppliedCoupon, subtotal: number) =>
  c.type === 'pct' ? Math.round((subtotal * c.value) / 100) : Math.min(c.value, subtotal);

export type Resolved =
  | { ok: true; coupon: Coupon; label: string; discount: number }
  | { ok: false; error: string };

export function resolveCoupon(code: string, subtotal: number): Resolved {
  const clean = code.trim();
  if (!clean) return { ok: false, error: 'הזינו קוד קופון' };

  const stat = STATIC.find((c) => c.code === clean);
  if (stat) return { ok: true, coupon: stat, label: stat.label, discount: calcDiscount(stat, subtotal) };

  const personal = readPersonal().find((c) => c.code === clean);
  if (!personal) return { ok: false, error: 'קוד קופון לא תקין' };
  if (personal.used) return { ok: false, error: 'הקופון כבר נוצל' };
  if (personal.expires < Date.now()) return { ok: false, error: 'תוקף הקופון פג' };
  return { ok: true, coupon: personal, label: personal.label, discount: calcDiscount(personal, subtotal) };
}

/** קופון קאשבק 3% מסכום ההזמנה — נוצר בסיום רכישה, להזמנה הבאה. תוקף 90 יום.
 *  קוד נקי: "קאשבק-" + 4 ספרות (בלי אותיות אנגלית). */
export function generateCashbackCoupon(orderTotal: number): PersonalCoupon {
  const value = Math.max(1, Math.round(orderTotal * 0.03));
  const num = String(1000 + Math.floor(Math.random() * 9000));
  return {
    code: `קאשבק-${num}`,
    type: 'fixed',
    value,
    label: `קאשבק 3% — ₪${value} להזמנה הבאה`,
    expires: Date.now() + 90 * 24 * 3600 * 1000,
  };
}
