// ============================================================
// קופונים מותאמים (promo_coupons ב-Neon) — נאכפים בשרת בלבד.
// מקור אמת יחיד לקופונים שנוצרים ב-CRM. משמש גם את הסליקה (charged) וגם את
// אימות הקוד בסל. מימושים/הכנסה נגזרים מ-orders.coupon_code (לא counter נפרד).
// server-only, defensive: אין טבלה/DB → null (לא מחילים הנחה לא מאומתת).
// ============================================================

import 'server-only';
import { prisma } from '@/lib/prisma';

export interface PromoResolved {
  code: string;
  type: 'pct' | 'fixed';
  value: number;
  label: string;
  discount: number; // הסכום בפועל לפי ה-subtotal
}

// מאמת קופון מותאם ומחזיר את ההנחה לפי subtotal. null = לא תקף/לא קיים/פג/מוצה.
export async function resolvePromoDiscount(code: string, subtotal: number): Promise<PromoResolved | null> {
  const clean = (code || '').trim();
  if (!clean || !(subtotal > 0)) return null;
  try {
    const rows = (await prisma.$queryRawUnsafe(
      `select code, discount_type, discount_value, label, expires_at, max_redemptions, active
       from public.promo_coupons where code=$1 limit 1`,
      clean,
    )) as Array<Record<string, unknown>>;
    const r = rows?.[0];
    if (!r) return null;
    if (r.active === false) return null;
    if (r.expires_at && new Date(r.expires_at as string).getTime() < Date.now()) return null;

    // מגבלת מימושים — נספרת מהזמנות ששולמו עם הקוד (מקור אמת יחיד).
    if (r.max_redemptions != null) {
      const used = (await prisma.$queryRawUnsafe(
        `select count(*)::int as n from public.orders where status='paid' and coupon_code=$1`,
        clean,
      )) as Array<{ n: number }>;
      if (Number(used?.[0]?.n ?? 0) >= Number(r.max_redemptions)) return null;
    }

    const type = r.discount_type === 'fixed' ? 'fixed' : 'pct';
    const value = Number(r.discount_value) || 0;
    if (!(value > 0)) return null;
    const discount = type === 'pct' ? Math.round((subtotal * value) / 100) : Math.min(Math.round(value), subtotal);
    if (discount <= 0) return null;

    const label = String(r.label || '') || (type === 'pct' ? `${value}% הנחה` : `₪${value} הנחה`);
    return { code: clean, type, value, label, discount };
  } catch {
    return null;
  }
}
