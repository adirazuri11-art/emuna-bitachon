// ============================================================
// CRM — ניהול קופונים מותאמים (promo_coupons ב-Neon).
// יצירה/רשימה+ביצועים/הפעלה/מחיקה. ביצועים נגזרים מ-orders.coupon_code.
// server-only, defensive.
// ============================================================

import 'server-only';
import { prisma } from '@/lib/prisma';

const num = (v: unknown) => Number(v ?? 0);

export interface PromoRow {
  code: string;
  type: 'pct' | 'fixed';
  value: number;
  label: string;
  expiresAt: string | null;
  maxRedemptions: number | null;
  active: boolean;
  createdAt: string;
  // ביצועים (מ-orders)
  redemptions: number;
  revenue: number;      // הכנסה מהזמנות ששולמו עם הקופון
  discountGiven: number; // סך ההנחה שניתנה
  expired: boolean;
}

export interface CreatePromoInput {
  code: string;
  type: 'pct' | 'fixed';
  value: number;
  label?: string;
  expiresAt?: string | null; // ISO או null
  maxRedemptions?: number | null;
}

export interface CreateResult { ok: boolean; error?: string }

export async function createPromoCoupon(input: CreatePromoInput): Promise<CreateResult> {
  const code = (input.code || '').trim();
  const type = input.type === 'fixed' ? 'fixed' : 'pct';
  const value = Math.round(num(input.value));
  if (!code) return { ok: false, error: 'חסר קוד קופון' };
  if (code.length > 40) return { ok: false, error: 'הקוד ארוך מדי (עד 40 תווים)' };
  if (type === 'pct' && (value < 1 || value > 90)) return { ok: false, error: 'אחוז הנחה חייב להיות בין 1 ל-90' };
  if (type === 'fixed' && (value < 1 || value > 10000)) return { ok: false, error: 'סכום הנחה חייב להיות בין 1 ל-10000' };
  const max = input.maxRedemptions != null && Number(input.maxRedemptions) > 0 ? Math.round(Number(input.maxRedemptions)) : null;
  const expires = input.expiresAt ? new Date(input.expiresAt) : null;
  if (expires && Number.isNaN(expires.getTime())) return { ok: false, error: 'תאריך תוקף לא תקין' };
  const label = (input.label || '').trim() || (type === 'pct' ? `${value}% הנחה` : `₪${value} הנחה`);

  try {
    // מונע דריסת קופון קיים (ולכן גם דריסת היסטוריית מימושים)
    const existing = (await prisma.$queryRawUnsafe(
      `select 1 from public.promo_coupons where code=$1 limit 1`, code,
    )) as unknown[];
    if (existing.length) return { ok: false, error: 'קוד קופון כזה כבר קיים' };

    await prisma.$executeRawUnsafe(
      `insert into public.promo_coupons (code, discount_type, discount_value, label, expires_at, max_redemptions, active)
       values ($1,$2,$3,$4,$5,$6,true)`,
      code, type, value, label, expires ? expires.toISOString() : null, max,
    );
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 120) : 'שגיאת DB' };
  }
}

export async function listPromoCouponsWithPerf(): Promise<PromoRow[]> {
  try {
    const rows = (await prisma.$queryRawUnsafe(
      `select p.code, p.discount_type, p.discount_value, p.label, p.expires_at, p.max_redemptions, p.active, p.created_at,
              count(o.order_number) filter (where o.status='paid')                as redemptions,
              coalesce(sum(o.amount) filter (where o.status='paid'),0)            as revenue,
              coalesce(sum(o.discount) filter (where o.status='paid'),0)          as discount_given
       from public.promo_coupons p
       left join public.orders o on o.coupon_code = p.code
       group by p.code, p.discount_type, p.discount_value, p.label, p.expires_at, p.max_redemptions, p.active, p.created_at
       order by p.created_at desc`,
    )) as Array<Record<string, unknown>>;
    return rows.map((r) => {
      const expIso = r.expires_at ? new Date(r.expires_at as string).toISOString() : null;
      return {
        code: String(r.code),
        type: r.discount_type === 'fixed' ? 'fixed' : 'pct',
        value: num(r.discount_value),
        label: String(r.label ?? ''),
        expiresAt: expIso,
        maxRedemptions: r.max_redemptions != null ? num(r.max_redemptions) : null,
        active: r.active !== false,
        createdAt: r.created_at ? new Date(r.created_at as string).toISOString() : '',
        redemptions: num(r.redemptions),
        revenue: Math.round(num(r.revenue)),
        discountGiven: Math.round(num(r.discount_given)),
        expired: Boolean(expIso && new Date(expIso).getTime() < Date.now()),
      };
    });
  } catch {
    return [];
  }
}

export async function setPromoActive(code: string, active: boolean): Promise<boolean> {
  try {
    const n = await prisma.$executeRawUnsafe(
      `update public.promo_coupons set active=$2 where code=$1`, code.trim(), active,
    );
    return n > 0;
  } catch {
    return false;
  }
}

export async function deletePromoCoupon(code: string): Promise<boolean> {
  try {
    const n = await prisma.$executeRawUnsafe(
      `delete from public.promo_coupons where code=$1`, code.trim(),
    );
    return n > 0;
  } catch {
    return false;
  }
}
