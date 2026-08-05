// ============================================================
// CRM — דשבורד רווח. הקלף הייחודי: יש לנו מחיר עלות ספק (supplier-products.json).
// רווח גולמי = הכנסת פריטים − עלות ספק × כמות. join בין items של ההזמנה לעלות
// לפי SKU. server-only, defensive. הערכה: לפני משלוח/קופונים (רווח מוצרים בלבד).
// ============================================================

import 'server-only';
import { prisma } from '@/lib/prisma';
import supplierData from '@/lib/supplier-products.json';

const num = (v: unknown) => Number(v ?? 0);

interface RawItem { id: string; t: string; cost: number; c: string; s?: string }
const RAW = (supplierData as { items: RawItem[] }).items;

// slug → שם קטגוריה עברי (זהה ל-CAT_NAME ב-catalog-supplier).
const CAT_NAME: Record<string, string> = {
  'home-judaica': 'תשמישי קדושה לבית', mezuzot: 'מזוזות', 'challah-covers': 'כיסויי חלה',
  havdalah: 'הבדלה', 'washing-cups': 'נטלות ומים אחרונים', blessings: 'ברכות',
  'kiddush-cups': 'כוסות קידוש', candlesticks: 'פמוטים', 'tzitzit-tallit': 'ציציות וטליתות',
  kippot: 'כיפות', headscarves: 'מטפחות מעוצבות', 'gifts-events': 'מתנות ואירועים',
  'judaica-jewelry': 'תכשיטי יודאיקה', 'jewish-art': 'אמנות ועיצוב יהודי',
  'books-siddurim': 'ספרים וסידורים', 'holidays-moadim': 'חגים ומועדים', kids: 'מוצרים לילדים',
  'brit-newborn': 'ברית ולידה', 'jerusalem-gifts': 'מזכרות מירושלים',
};

// SKU → {cost, title, category}. cost = עלות ספק ליחידה.
const INFO = new Map<string, { cost: number; title: string; category: string }>();
for (const it of RAW) {
  INFO.set(it.id.toUpperCase(), { cost: num(it.cost), title: it.t, category: CAT_NAME[it.c] ?? 'מתנות ואירועים' });
}

const skuOf = (id: string) => (id || '').replace(/^art-/i, '').toUpperCase();

interface OrderItem { id?: string; title?: string; quantity?: number; unitPrice?: number }

export interface ProfitLine { key: string; label: string; revenue: number; cost: number; profit: number; margin: number; units: number }
export interface ProfitOverview {
  ok: boolean;
  ordersCount: number;
  revenue: number;      // הכנסת פריטים (unitPrice×qty)
  cost: number;         // עלות ספק כוללת
  grossProfit: number;  // revenue − cost
  margin: number;       // אחוז רווח
  byCategory: ProfitLine[];
  topProducts: ProfitLine[]; // הרווחיים ביותר
}

export async function getProfitOverview(days = 0, capOrders = 3000): Promise<ProfitOverview> {
  const empty: ProfitOverview = { ok: false, ordersCount: 0, revenue: 0, cost: 0, grossProfit: 0, margin: 0, byCategory: [], topProducts: [] };
  try {
    const dateFilter = days > 0 ? `and paid_at > now() - interval '${Math.min(365, days)} days'` : '';
    const rows = (await prisma.$queryRawUnsafe(
      `select items from public.orders where status='paid' ${dateFilter} order by paid_at desc limit ${Math.min(5000, capOrders)}`,
    )) as Array<{ items: OrderItem[] }>;

    let revenue = 0, cost = 0;
    const cat = new Map<string, ProfitLine>();
    const prod = new Map<string, ProfitLine>();

    for (const r of rows) {
      const items = Array.isArray(r.items) ? r.items : [];
      for (const it of items) {
        const qty = Math.max(1, Math.floor(num(it.quantity) || 1));
        const lineRev = num(it.unitPrice) * qty;
        const info = INFO.get(skuOf(String(it.id ?? '')));
        // עלות ידועה מהספק; אם לא נמצא — הערכה שמרנית (~44% מהמחיר) כדי לא לנפח רווח.
        const unitCost = info ? info.cost : num(it.unitPrice) * 0.44;
        const lineCost = unitCost * qty;
        revenue += lineRev; cost += lineCost;

        const catName = info?.category ?? 'אחר';
        const cl = cat.get(catName) ?? { key: catName, label: catName, revenue: 0, cost: 0, profit: 0, margin: 0, units: 0 };
        cl.revenue += lineRev; cl.cost += lineCost; cl.units += qty; cat.set(catName, cl);

        const pKey = skuOf(String(it.id ?? '')) || String(it.title ?? '?');
        const pl = prod.get(pKey) ?? { key: pKey, label: info?.title ?? String(it.title ?? pKey), revenue: 0, cost: 0, profit: 0, margin: 0, units: 0 };
        pl.revenue += lineRev; pl.cost += lineCost; pl.units += qty; prod.set(pKey, pl);
      }
    }

    const finish = (l: ProfitLine) => { l.profit = Math.round(l.revenue - l.cost); l.revenue = Math.round(l.revenue); l.cost = Math.round(l.cost); l.margin = l.revenue ? Math.round((l.profit / l.revenue) * 100) : 0; return l; };
    const byCategory = Array.from(cat.values()).map(finish).sort((a, b) => b.profit - a.profit);
    const topProducts = Array.from(prod.values()).map(finish).sort((a, b) => b.profit - a.profit).slice(0, 15);

    const grossProfit = Math.round(revenue - cost);
    return {
      ok: true,
      ordersCount: rows.length,
      revenue: Math.round(revenue),
      cost: Math.round(cost),
      grossProfit,
      margin: revenue ? Math.round((grossProfit / revenue) * 100) : 0,
      byCategory,
      topProducts,
    };
  } catch {
    return empty;
  }
}
