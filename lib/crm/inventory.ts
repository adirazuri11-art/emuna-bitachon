// ============================================================
// CRM — ניהול מלאי פנימי. ⚠️ פנימי בלבד: אפס כתיבה לאתר/Merchant/checkout.
// מקור אמת: public.inventory_items + inventory_movements (Neon).
// שם/תמונה/קטגוריה נגזרים מהקטלוג לפי SKU (לא משוכפלים).
// חוק ליבה: מלאי יורד רק בהפקת קבלה סופית (applyReceiptToInventory), idempotent.
// אין לשנות quantity_on_hand בלי ליצור inventory_movement.
// server-only, defensive.
// ============================================================

import 'server-only';
import { prisma } from '@/lib/prisma';
import { PRODUCTS } from '@/lib/catalog';

const num = (v: unknown) => Number(v ?? 0);
const skuOf = (id: string) => (id || '').replace(/^art-/i, '').toUpperCase();

interface Meta { title: string; image?: string; category: string }
const META = new Map<string, Meta>();
for (const p of PRODUCTS) META.set(p.sku.toUpperCase(), { title: p.titleHe, image: p.imageUrl, category: p.category });

export type MovementType =
  | 'PURCHASE_IN' | 'SALE_OUT' | 'CUSTOMER_RETURN_IN' | 'SUPPLIER_RETURN_OUT'
  | 'MANUAL_ADJUSTMENT_IN' | 'MANUAL_ADJUSTMENT_OUT' | 'DAMAGE_OUT' | 'CANCELLED_RECEIPT_REVERSAL';

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  PURCHASE_IN: 'קליטת סחורה',
  SALE_OUT: 'מכירה (קבלה)',
  CUSTOMER_RETURN_IN: 'החזרת לקוח',
  SUPPLIER_RETURN_OUT: 'החזרה לספק',
  MANUAL_ADJUSTMENT_IN: 'תיקון ידני (+)',
  MANUAL_ADJUSTMENT_OUT: 'תיקון ידני (−)',
  DAMAGE_OUT: 'פגם/בלאי',
  CANCELLED_RECEIPT_REVERSAL: 'ביטול קבלה',
};

// ---------- Audit ----------
async function auditLog(userId: string, action: string, entityType: string, entityId: string, before: unknown, after: unknown) {
  try {
    await prisma.$executeRawUnsafe(
      `insert into public.inventory_audit_logs (user_id, action, entity_type, entity_id, before_data, after_data)
       values ($1,$2,$3,$4,$5::jsonb,$6::jsonb)`,
      userId, action, entityType, entityId,
      before != null ? JSON.stringify(before) : null,
      after != null ? JSON.stringify(after) : null,
    );
  } catch { /* audit never blocks */ }
}

// ---------- Listing ----------
export interface InventoryRow {
  sku: string;
  title: string;
  image?: string;
  category: string;
  quantityOnHand: number;
  lastPurchasePrice: number | null;
  avgCost: number | null;
  totalReceived: number;
  totalSold: number;
  lastReceivedAt: string | null;
  lastSoldAt: string | null;
  tracked: boolean; // האם יש שורת מלאי (נקלט/נמכר) או רק מהקטלוג
}

export type InvFilter = 'all' | 'low' | 'zero' | 'negative' | 'tracked';

async function loadInventoryMap(): Promise<Map<string, Record<string, unknown>>> {
  try {
    const rows = (await prisma.$queryRawUnsafe(`select * from public.inventory_items`)) as Array<Record<string, unknown>>;
    return new Map(rows.map((r) => [String(r.sku).toUpperCase(), r]));
  } catch {
    return new Map();
  }
}

export async function listInventory(search = '', filter: InvFilter = 'all', limit = 300): Promise<InventoryRow[]> {
  const inv = await loadInventoryMap();
  const q = search.trim().toLowerCase();
  const rows: InventoryRow[] = [];
  for (const p of PRODUCTS) {
    const sku = p.sku.toUpperCase();
    const r = inv.get(sku);
    const qty = r ? num(r.quantity_on_hand) : 0;
    if (q && !(`${p.titleHe} ${p.sku}`.toLowerCase().includes(q))) continue;
    if (filter === 'low' && !(qty > 0 && qty <= 3)) continue;
    if (filter === 'zero' && qty !== 0) continue;
    if (filter === 'negative' && !(qty < 0)) continue;
    if (filter === 'tracked' && !r) continue;
    rows.push({
      sku: p.sku,
      title: p.titleHe,
      image: p.imageUrl,
      category: p.category,
      quantityOnHand: qty,
      lastPurchasePrice: r && r.last_purchase_price != null ? num(r.last_purchase_price) : null,
      avgCost: r && r.avg_cost != null ? num(r.avg_cost) : null,
      totalReceived: r ? num(r.total_received) : 0,
      totalSold: r ? num(r.total_sold) : 0,
      lastReceivedAt: r?.last_received_at ? new Date(r.last_received_at as string).toISOString() : null,
      lastSoldAt: r?.last_sold_at ? new Date(r.last_sold_at as string).toISOString() : null,
      tracked: !!r,
    });
  }
  // מיון: תקוע/שלילי קודם (דורש תשומת לב), ואז לפי מלאי עולה
  rows.sort((a, b) => a.quantityOnHand - b.quantityOnHand);
  return rows.slice(0, limit);
}

export interface InventoryStats {
  catalogSize: number;
  tracked: number;
  totalUnits: number;
  low: number;
  zero: number;
  negative: number;
  movementsToday: number;
  salesTodayUnits: number;
}

export async function getInventoryStats(): Promise<InventoryStats> {
  const empty: InventoryStats = { catalogSize: PRODUCTS.length, tracked: 0, totalUnits: 0, low: 0, zero: 0, negative: 0, movementsToday: 0, salesTodayUnits: 0 };
  try {
    const agg = (await prisma.$queryRawUnsafe(
      `select count(*)::int as tracked,
              coalesce(sum(quantity_on_hand),0)::int as units,
              count(*) filter (where quantity_on_hand > 0 and quantity_on_hand <= 3)::int as low,
              count(*) filter (where quantity_on_hand = 0)::int as zero,
              count(*) filter (where quantity_on_hand < 0)::int as negative
       from public.inventory_items`,
    )) as Array<Record<string, unknown>>;
    const mv = (await prisma.$queryRawUnsafe(
      `select count(*)::int as moves,
              coalesce(sum(case when movement_type='SALE_OUT' then -quantity_change else 0 end),0)::int as sold_units
       from public.inventory_movements where created_at::date = now()::date`,
    )) as Array<Record<string, unknown>>;
    const a = agg[0] ?? {}; const m = mv[0] ?? {};
    return {
      catalogSize: PRODUCTS.length,
      tracked: num(a.tracked),
      totalUnits: num(a.units),
      low: num(a.low),
      zero: num(a.zero),
      negative: num(a.negative),
      movementsToday: num(m.moves),
      salesTodayUnits: num(m.sold_units),
    };
  } catch {
    return empty;
  }
}

// ---------- Item detail + movements ----------
export interface MovementRow {
  id: string;
  type: MovementType;
  change: number;
  before: number;
  after: number;
  sourceType: string | null;
  sourceDocument: string | null;
  reason: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface InventoryItemDetail extends InventoryRow {
  notes: string | null;
  movements: MovementRow[];
}

export async function getInventoryItem(sku: string): Promise<InventoryItemDetail | null> {
  const S = sku.toUpperCase();
  const meta = META.get(S);
  if (!meta) return null;
  let r: Record<string, unknown> | undefined;
  let movements: MovementRow[] = [];
  try {
    const rows = (await prisma.$queryRawUnsafe(`select * from public.inventory_items where sku=$1 limit 1`, S)) as Array<Record<string, unknown>>;
    r = rows[0];
    const mv = (await prisma.$queryRawUnsafe(
      `select * from public.inventory_movements where sku=$1 order by created_at desc limit 200`, S,
    )) as Array<Record<string, unknown>>;
    movements = mv.map((m) => ({
      id: String(m.id),
      type: String(m.movement_type) as MovementType,
      change: num(m.quantity_change),
      before: num(m.quantity_before),
      after: num(m.quantity_after),
      sourceType: (m.source_type as string) ?? null,
      sourceDocument: (m.source_document_number as string) ?? null,
      reason: (m.reason as string) ?? null,
      createdBy: (m.created_by as string) ?? null,
      createdAt: m.created_at ? new Date(m.created_at as string).toISOString() : '',
    }));
  } catch { /* no DB → empty */ }
  return {
    sku: meta.title ? S : S,
    title: meta.title,
    image: meta.image,
    category: meta.category,
    quantityOnHand: r ? num(r.quantity_on_hand) : 0,
    lastPurchasePrice: r && r.last_purchase_price != null ? num(r.last_purchase_price) : null,
    avgCost: r && r.avg_cost != null ? num(r.avg_cost) : null,
    totalReceived: r ? num(r.total_received) : 0,
    totalSold: r ? num(r.total_sold) : 0,
    lastReceivedAt: r?.last_received_at ? new Date(r.last_received_at as string).toISOString() : null,
    lastSoldAt: r?.last_sold_at ? new Date(r.last_sold_at as string).toISOString() : null,
    tracked: !!r,
    notes: (r?.notes as string) ?? null,
    movements,
  };
}

// ---------- Manual adjustment (creates a movement — never a bare quantity edit) ----------
export async function adjustStock(
  sku: string, delta: number, type: MovementType, reason: string, user = 'admin',
): Promise<{ ok: boolean; error?: string; after?: number }> {
  const S = sku.toUpperCase();
  const d = Math.round(num(delta));
  if (!META.has(S)) return { ok: false, error: 'מוצר לא קיים בקטלוג' };
  if (!d) return { ok: false, error: 'שינוי חייב להיות שונה מ-0' };
  if (!reason.trim()) return { ok: false, error: 'חובה לציין סיבה' };
  try {
    const after = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`insert into public.inventory_items (sku, supplier_code) values ($1,$1) on conflict (sku) do nothing`, S);
      const upd = (await tx.$queryRawUnsafe(
        `update public.inventory_items
           set quantity_on_hand = quantity_on_hand + $2,
               total_received = total_received + case when $2 > 0 then $2 else 0 end,
               updated_at = now()
         where sku=$1 returning quantity_on_hand`,
        S, d,
      )) as Array<{ quantity_on_hand: number }>;
      const qAfter = num(upd[0]?.quantity_on_hand);
      const qBefore = qAfter - d;
      await tx.$executeRawUnsafe(
        `insert into public.inventory_movements (sku, movement_type, quantity_change, quantity_before, quantity_after, source_type, reason, created_by)
         values ($1,$2,$3,$4,$5,'manual',$6,$7)`,
        S, type, d, qBefore, qAfter, reason.trim(), user,
      );
      return qAfter;
    });
    await auditLog(user, 'MANUAL_ADJUSTMENT', 'inventory_item', S, null, { delta: d, type, reason, after });
    return { ok: true, after };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 140) : 'שגיאת DB' };
  }
}

// ---------- ⭐ הורדת מלאי בהפקת קבלה סופית — idempotent ----------
// נקרא מ-lib/orders.saveReceipt (הרגע שבו הלקוח מקבל מייל אישור + נרשם מספר קבלה).
// אותה קבלה מורידה מלאי פעם אחת בלבד (processed_receipts.receipt_number PK).
export async function applyReceiptToInventory(orderNumber: string, receiptNumber: string): Promise<{ applied: boolean; reason?: string; lines?: number }> {
  const rn = (receiptNumber || '').trim();
  if (!rn) return { applied: false, reason: 'no receipt number' };
  try {
    const orows = (await prisma.$queryRawUnsafe(`select items from public.orders where order_number=$1 limit 1`, orderNumber)) as Array<{ items: Array<{ id?: string; quantity?: number }> }>;
    const items = Array.isArray(orows?.[0]?.items) ? orows[0].items : [];
    // איחוד כמויות לפי SKU (מספר שורות לאותו מוצר → ירידה אחת מדויקת)
    const bySku = new Map<string, number>();
    for (const it of items) {
      const sku = skuOf(String(it.id ?? ''));
      if (!sku || !META.has(sku)) continue;
      bySku.set(sku, (bySku.get(sku) ?? 0) + Math.max(1, Math.floor(num(it.quantity) || 1)));
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1) תפיסת idempotency אטומית — אם הקבלה כבר עובדה, claim=0
      const claim = await tx.$executeRawUnsafe(
        `insert into public.processed_receipts (receipt_number, order_number, issued_at, status)
         values ($1,$2,now(),'processing') on conflict (receipt_number) do nothing`,
        rn, orderNumber,
      );
      if (claim === 0) return { applied: false, reason: 'already processed' as const };

      // 2) הורדה אטומית לכל SKU + תנועת SALE_OUT
      for (const [sku, qty] of Array.from(bySku)) {
        await tx.$executeRawUnsafe(`insert into public.inventory_items (sku, supplier_code) values ($1,$1) on conflict (sku) do nothing`, sku);
        const upd = (await tx.$queryRawUnsafe(
          `update public.inventory_items
             set quantity_on_hand = quantity_on_hand - $2, total_sold = total_sold + $2, last_sold_at = now(), updated_at = now()
           where sku=$1 returning quantity_on_hand`,
          sku, qty,
        )) as Array<{ quantity_on_hand: number }>;
        const after = num(upd[0]?.quantity_on_hand);
        const before = after + qty;
        await tx.$executeRawUnsafe(
          `insert into public.inventory_movements (sku, movement_type, quantity_change, quantity_before, quantity_after, source_type, source_id, source_document_number, created_by)
           values ($1,'SALE_OUT',$2,$3,$4,'receipt',$5,$6,'system')`,
          sku, -qty, before, after, orderNumber, rn,
        );
      }

      // 3) סימון הקבלה כעובדה
      await tx.$executeRawUnsafe(`update public.processed_receipts set inventory_processed_at=now(), status='done' where receipt_number=$1`, rn);
      return { applied: true as const, lines: bySku.size };
    });

    if (result.applied) {
      await auditLog('system', 'RECEIPT_STOCK_OUT', 'receipt', rn, null, { orderNumber, lines: result.lines });
    } else {
      await auditLog('system', 'RECEIPT_DUPLICATE_SKIPPED', 'receipt', rn, null, { orderNumber });
    }
    return result;
  } catch (e) {
    return { applied: false, reason: e instanceof Error ? e.message.slice(0, 140) : 'error' };
  }
}
