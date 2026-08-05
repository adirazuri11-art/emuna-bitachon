// ============================================================
// CRM — שחזור קופות נטושות (pending_payment).
// לקוחות שהתחילו קופה, השאירו שם/טלפון, ולא השלימו תשלום — הדאטה כבר קיים
// ב-public.orders. אין מערכת מעקב חדשה: רק שליפה + קישורי וואטסאפ/מייל לשחזור.
// server-only, defensive: אין טבלה/DB → מחזיר ריק.
// ============================================================

import 'server-only';
import { prisma } from '@/lib/prisma';

const num = (v: unknown) => Number(v ?? 0);

export interface AbandonedRow {
  orderNumber: string;
  name: string;
  phone: string;
  email: string;
  amount: number;
  itemCount: number;
  items: string[]; // שמות/מזהי פריטים לתצוגה
  createdAt: string;
  hoursAgo: number;
  waHref: string | null; // קישור וואטסאפ מוכן עם הודעת שחזור
  mailHref: string | null;
}

export interface AbandonedStats {
  count: number;
  valueAtRisk: number; // סך הכסף ה"תלוי" בקופות שלא הושלמו
  recoverableCount: number; // כאלה עם טלפון או מייל ליצירת קשר
}

// נירמול טלפון ישראלי ל-E.164 ללא + עבור wa.me (972...). מחזיר null אם לא תקין.
function waPhone(raw: string): string | null {
  const d = (raw || '').replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('972')) return d.length >= 11 ? d : null;
  if (d.startsWith('0')) return '972' + d.slice(1);
  if (d.length === 9) return '972' + d; // ללא 0 מוביל
  return null;
}

function firstName(name: string): string {
  return (name || '').trim().split(/\s+/)[0] || '';
}

function recoveryMessage(name: string, orderNumber: string): string {
  const hi = firstName(name) ? `היי ${firstName(name)}, ` : 'שלום, ';
  return (
    `${hi}כאן אמונה וביטחון 🕎\n` +
    `שמנו לב שהתחלת הזמנה באתר ולא הספקת להשלים אותה — רצינו לוודא שהכול תקין ולעזור אם צריך.\n` +
    `נשמח להשלים עבורך את ההזמנה או לענות על כל שאלה. אנחנו כאן 🙂`
  );
}

export async function getAbandonedCheckouts(days = 30, limit = 100): Promise<{ rows: AbandonedRow[]; stats: AbandonedStats }> {
  const empty = { rows: [], stats: { count: 0, valueAtRisk: 0, recoverableCount: 0 } };
  try {
    const rows = (await prisma.$queryRawUnsafe(
      `select order_number, amount,
              customer->>'name' as name, customer->>'phone' as phone, customer->>'email' as email,
              jsonb_array_length(items) as item_count, items, created_at
       from public.orders
       where status='pending_payment' and created_at > now() - interval '${Math.max(1, Math.min(365, days))} days'
       order by created_at desc limit ${Math.min(300, Math.max(1, limit))}`,
    )) as Array<Record<string, unknown>>;

    let valueAtRisk = 0;
    let recoverableCount = 0;
    const out: AbandonedRow[] = rows.map((r) => {
      const amount = num(r.amount);
      valueAtRisk += amount;
      const name = String(r.name ?? '');
      const phone = String(r.phone ?? '');
      const email = String(r.email ?? '');
      const orderNumber = String(r.order_number);
      const createdIso = r.created_at ? new Date(r.created_at as string).toISOString() : '';
      const hoursAgo = createdIso ? Math.round((Date.now() - new Date(createdIso).getTime()) / 3.6e6) : 0;
      const itemsRaw = (r.items as Array<{ title?: string; id?: string; quantity?: number }>) ?? [];
      const items = itemsRaw.map((it) => (it.title || it.id || 'פריט') + (it.quantity && it.quantity > 1 ? ` ×${it.quantity}` : ''));

      const wp = waPhone(phone);
      const waHref = wp ? `https://wa.me/${wp}?text=${encodeURIComponent(recoveryMessage(name, orderNumber))}` : null;
      const mailHref = email
        ? `mailto:${email}?subject=${encodeURIComponent('השלמת ההזמנה שלך — אמונה וביטחון')}&body=${encodeURIComponent(recoveryMessage(name, orderNumber))}`
        : null;
      if (waHref || mailHref) recoverableCount++;

      return { orderNumber, name: name || '—', phone, email, amount, itemCount: num(r.item_count), items, createdAt: createdIso, hoursAgo, waHref, mailHref };
    });

    return { rows: out, stats: { count: out.length, valueAtRisk: Math.round(valueAtRisk), recoverableCount } };
  } catch {
    return empty;
  }
}
