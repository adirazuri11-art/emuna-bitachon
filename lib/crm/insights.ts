// ============================================================
// CRM — תובנות: ביצועי מוצרים (רבי-מכר / dead-stock) + פילוח לקוחות (RFM-lite).
// server-only, defensive. מקורות: public.orders (מכירות) + supplier-products.json (קטלוג).
// ============================================================

import 'server-only';
import { prisma } from '@/lib/prisma';
import supplierData from '@/lib/supplier-products.json';

const num = (v: unknown) => Number(v ?? 0);

interface RawItem { id: string; t: string; c: string }
const RAW = (supplierData as { items: RawItem[] }).items;
const TITLE = new Map<string, string>(RAW.map((it) => [it.id.toUpperCase(), it.t]));
const skuOf = (id: string) => (id || '').replace(/^art-/i, '').toUpperCase();

interface OrderItem { id?: string; title?: string; quantity?: number; unitPrice?: number }

export interface SellerRow { sku: string; title: string; units: number; revenue: number }
export interface ProductPerformance {
  ok: boolean;
  catalogSize: number;
  soldDistinct: number;
  deadStockCount: number;
  topSellers: SellerRow[];
  deadStockSample: { sku: string; title: string }[];
}

export interface Segment { label: string; count: number; value: number }
export interface VipRow { name: string; email: string; orders: number; spent: number; lastAt: string; daysSince: number }
export interface CustomerSegments {
  ok: boolean;
  buyers: number;
  repeatBuyers: number;
  oneTimers: number;
  repeatRate: number; // %
  segments: Segment[];
  vips: VipRow[];
  atRisk: VipRow[];
}

export async function getProductPerformance(): Promise<ProductPerformance> {
  const empty: ProductPerformance = { ok: false, catalogSize: RAW.length, soldDistinct: 0, deadStockCount: 0, topSellers: [], deadStockSample: [] };
  try {
    const rows = (await prisma.$queryRawUnsafe(
      `select items from public.orders where status='paid' order by paid_at desc limit 5000`,
    )) as Array<{ items: OrderItem[] }>;

    const sold = new Map<string, SellerRow>();
    for (const r of rows) {
      for (const it of Array.isArray(r.items) ? r.items : []) {
        const sku = skuOf(String(it.id ?? ''));
        if (!sku) continue;
        const qty = Math.max(1, Math.floor(num(it.quantity) || 1));
        const row = sold.get(sku) ?? { sku, title: TITLE.get(sku) ?? String(it.title ?? sku), units: 0, revenue: 0 };
        row.units += qty; row.revenue += num(it.unitPrice) * qty; sold.set(sku, row);
      }
    }
    const topSellers = Array.from(sold.values()).map((s) => ({ ...s, revenue: Math.round(s.revenue) })).sort((a, b) => b.units - a.units).slice(0, 15);
    // dead-stock = מוצרי קטלוג שמעולם לא נמכרו
    const dead = RAW.filter((it) => !sold.has(it.id.toUpperCase()));
    return {
      ok: true,
      catalogSize: RAW.length,
      soldDistinct: sold.size,
      deadStockCount: dead.length,
      topSellers,
      deadStockSample: dead.slice(0, 18).map((it) => ({ sku: it.id, title: it.t })),
    };
  } catch {
    return empty;
  }
}

export async function getCustomerSegments(): Promise<CustomerSegments> {
  const empty: CustomerSegments = { ok: false, buyers: 0, repeatBuyers: 0, oneTimers: 0, repeatRate: 0, segments: [], vips: [], atRisk: [] };
  try {
    const rows = (await prisma.$queryRawUnsafe(
      `select coalesce(nullif(customer->>'email',''), customer->>'phone') as key,
              max(customer->>'name') as name, max(customer->>'email') as email,
              count(*) as orders, sum(amount) as spent, max(paid_at) as last_at
       from public.orders
       where status='paid' and coalesce(customer->>'email', customer->>'phone') is not null
       group by 1 order by spent desc limit 2000`,
    )) as Array<Record<string, unknown>>;

    const now = Date.now();
    const buyers = rows.length;
    let repeatBuyers = 0;
    const enriched = rows.map((r) => {
      const orders = num(r.orders);
      if (orders > 1) repeatBuyers++;
      const lastIso = r.last_at ? new Date(r.last_at as string).toISOString() : '';
      const daysSince = lastIso ? Math.floor((now - new Date(lastIso).getTime()) / 8.64e7) : 9999;
      return { name: String(r.name ?? '—'), email: String(r.email ?? ''), orders, spent: Math.round(num(r.spent)), lastAt: lastIso, daysSince };
    });

    const oneTimers = buyers - repeatBuyers;
    // VIP = 3+ הזמנות או 800₪+ סה"כ. בסיכון = קנו בעבר, לא רכשו 60+ יום.
    const vips = enriched.filter((c) => c.orders >= 3 || c.spent >= 800).slice(0, 20);
    const atRisk = enriched.filter((c) => c.daysSince >= 60 && c.daysSince < 9999).sort((a, b) => b.spent - a.spent).slice(0, 20);
    const vipSpent = vips.reduce((s, c) => s + c.spent, 0);

    return {
      ok: true,
      buyers,
      repeatBuyers,
      oneTimers,
      repeatRate: buyers ? Math.round((repeatBuyers / buyers) * 100) : 0,
      segments: [
        { label: 'VIP', count: vips.length, value: vipSpent },
        { label: 'קונים חוזרים', count: repeatBuyers, value: 0 },
        { label: 'חד-פעמיים', count: oneTimers, value: 0 },
        { label: 'בסיכון (60+ יום)', count: atRisk.length, value: 0 },
      ],
      vips,
      atRisk,
    };
  } catch {
    return empty;
  }
}
