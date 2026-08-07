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
import supplierData from '@/lib/supplier-products.json';

const num = (v: unknown) => Number(v ?? 0);
const skuOf = (id: string) => (id || '').replace(/^art-/i, '').toUpperCase();
// תמונת ART אוטומטית לכל מוצר (proxy) — כשאין תמונה מקומית/מותאמת.
const artProxy = (sku: string) => `/api/crm/inventory/art-image/${encodeURIComponent(sku)}`;

// מחיר עלות ספק ליחידה (ARt/israel-judaica) לפי SKU — המקור ל"מחיר עלות" לפני קליטת חשבונית.
const SUPPLIER_COST = new Map<string, number>();
for (const it of (supplierData as { items: Array<{ id: string; cost: number }> }).items) {
  SUPPLIER_COST.set(it.id.toUpperCase(), num(it.cost));
}

interface Meta { title: string; image?: string; category: string; salePrice: number; cost?: number }
const META = new Map<string, Meta>();
for (const p of PRODUCTS) META.set(p.sku.toUpperCase(), { title: p.titleHe, image: p.imageUrl, category: p.category, salePrice: p.discountPrice ?? p.basePrice, cost: SUPPLIER_COST.get(p.sku.toUpperCase()) });

// חיפוש מוצר בקטלוג לפי קוד ספק (=SKU). משמש את קליטת החשבוניות (Phase 2).
export function productMeta(sku: string): { sku: string; title: string; image?: string; category: string; salePrice: number } | undefined {
  const S = (sku || '').trim().toUpperCase();
  const m = META.get(S);
  return m ? { sku: S, ...m } : undefined;
}

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
  lastPurchasePrice: number | null; // מחיר עלות בפועל (חשבונית) אם קיים, אחרת עלות ספק מהקטלוג
  salePrice: number | null;         // מחיר מכירה (מהקטלוג = המחיר באתר)
  supplierCost: number | null;      // עלות ספק ליחידה מהקטלוג (ART)
  margin: number | null;            // רווח ליחידה = מכירה − עלות
  marginPct: number | null;         // אחוז רווח
  avgCost: number | null;
  totalReceived: number;
  totalSold: number;
  lastReceivedAt: string | null;
  lastSoldAt: string | null;
  tracked: boolean;   // האם יש שורת מלאי (נקלט/נמכר) או רק מהקטלוג
  inCatalog: boolean; // false = נקלט מחשבונית עם קוד שלא בקטלוג האתר
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

function rowFromInv(sku: string, title: string, image: string | undefined, category: string, salePrice: number | null, r: Record<string, unknown> | undefined, inCatalog: boolean, catalogCost: number | null = null): InventoryRow {
  // מחיר עלות מוצג: עלות בפועל מחשבונית אם קיימת, אחרת עלות ספק מהקטלוג.
  const invoiceCost = r && r.last_purchase_price != null ? num(r.last_purchase_price) : null;
  const cost = invoiceCost != null ? invoiceCost : catalogCost;
  const margin = cost != null && salePrice != null ? Math.round((salePrice - cost) * 100) / 100 : null;
  const marginPct = margin != null && salePrice ? Math.round((margin / salePrice) * 100) : null;
  return {
    sku, title, image, category,
    quantityOnHand: r ? num(r.quantity_on_hand) : 0,
    lastPurchasePrice: cost,
    salePrice,
    supplierCost: catalogCost,
    margin,
    marginPct,
    avgCost: r && r.avg_cost != null ? num(r.avg_cost) : null,
    totalReceived: r ? num(r.total_received) : 0,
    totalSold: r ? num(r.total_sold) : 0,
    lastReceivedAt: r?.last_received_at ? new Date(r.last_received_at as string).toISOString() : null,
    lastSoldAt: r?.last_sold_at ? new Date(r.last_sold_at as string).toISOString() : null,
    tracked: !!r,
    inCatalog,
  };
}

export async function listInventory(search = '', filter: InvFilter = 'all', limit = 300): Promise<InventoryRow[]> {
  const inv = await loadInventoryMap();
  const q = search.trim().toLowerCase();
  const pass = (title: string, sku: string, qty: number, tracked: boolean) => {
    if (q && !(`${title} ${sku}`.toLowerCase().includes(q))) return false;
    if (filter === 'low' && !(qty > 0 && qty <= 3)) return false;
    if (filter === 'zero' && qty !== 0) return false;
    if (filter === 'negative' && !(qty < 0)) return false;
    if (filter === 'tracked' && !tracked) return false;
    return true;
  };
  const rows: InventoryRow[] = [];
  // 1) מוצרי קטלוג (799) — שם/תמונה מהעריכה הידנית אם קיימת, אחרת מהקטלוג
  for (const p of PRODUCTS) {
    const sku = p.sku.toUpperCase();
    const r = inv.get(sku);
    const title = (r?.name as string) || p.titleHe;
    const image = (r?.image_url as string) || p.imageUrl || artProxy(p.sku);
    if (!pass(title, p.sku, r ? num(r.quantity_on_hand) : 0, !!r)) continue;
    rows.push(rowFromInv(p.sku, title, image, p.category, p.discountPrice ?? p.basePrice, r, true, SUPPLIER_COST.get(sku) ?? null));
  }
  // 2) מוצרים שנקלטו מחשבונית ואינם בקטלוג — שם/תמונה מהעריכה
  for (const [sku, r] of Array.from(inv)) {
    if (META.has(sku)) continue;
    const title = String(r.name ?? sku);
    if (!pass(title, sku, num(r.quantity_on_hand), true)) continue;
    rows.push(rowFromInv(sku, title, (r.image_url as string) || artProxy(sku), 'לא בקטלוג', null, r, false, null));
  }
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
  // מוצר לא בקטלוג ולא במלאי — לא קיים
  if (!meta && !r) return null;
  const title = (r?.name as string) || meta?.title || S;
  const image = (r?.image_url as string) || meta?.image || artProxy(S);
  return {
    ...rowFromInv(S, title, image, meta?.category ?? 'לא בקטלוג', meta ? meta.salePrice : null, r, !!meta, meta?.cost ?? SUPPLIER_COST.get(S) ?? null),
    notes: (r?.notes as string) ?? null,
    movements,
  };
}

// ---------- עריכת מוצר (שם + תמונה) — override על הקטלוג ----------
export async function updateProduct(sku: string, patch: { name?: string; imageUrl?: string }, user = 'admin'): Promise<{ ok: boolean; error?: string }> {
  const S = (sku || '').trim().toUpperCase();
  if (!S) return { ok: false, error: 'חסר קוד מוצר' };
  const name = patch.name != null ? patch.name.trim() : undefined;
  const imageUrl = patch.imageUrl != null ? patch.imageUrl.trim() : undefined;
  if (name === undefined && imageUrl === undefined) return { ok: false, error: 'אין מה לעדכן' };
  if (imageUrl && imageUrl.length > 3_500_000) return { ok: false, error: 'התמונה גדולה מדי' };
  try {
    await prisma.$executeRawUnsafe(`insert into public.inventory_items (sku, supplier_code) values ($1,$1) on conflict (sku) do nothing`, S);
    if (name !== undefined) await prisma.$executeRawUnsafe(`update public.inventory_items set name=$2, updated_at=now() where sku=$1`, S, name || null);
    if (imageUrl !== undefined) await prisma.$executeRawUnsafe(`update public.inventory_items set image_url=$2, updated_at=now() where sku=$1`, S, imageUrl || null);
    await auditLog(user, 'PRODUCT_EDITED', 'inventory_item', S, null, { name, hasImage: !!imageUrl });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 140) : 'שגיאת DB' };
  }
}

// ---------- יצירת מוצר חדש ידני ----------
export async function createProduct(input: { sku: string; name: string; imageUrl?: string; quantity?: number; cost?: number }, user = 'admin'): Promise<{ ok: boolean; error?: string }> {
  const S = (input.sku || '').trim().toUpperCase();
  const name = (input.name || '').trim();
  if (!S) return { ok: false, error: 'חסר קוד מוצר' };
  if (!name && !META.has(S)) return { ok: false, error: 'חסר שם מוצר' };
  const qty = Math.max(0, Math.round(num(input.quantity)));
  const cost = num(input.cost);
  try {
    const exists = (await prisma.$queryRawUnsafe(`select 1 from public.inventory_items where sku=$1`, S)) as unknown[];
    if (exists.length) return { ok: false, error: 'מוצר עם קוד זה כבר קיים במלאי' };
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `insert into public.inventory_items (sku, supplier_code, name, image_url, last_purchase_price) values ($1,$1,$2,$3,$4::numeric)`,
        S, name || null, input.imageUrl?.trim() || null, cost || null,
      );
      if (qty > 0) {
        await tx.$executeRawUnsafe(
          `update public.inventory_items set quantity_on_hand=$2::int, total_received=$2::int, last_received_at=now() where sku=$1`, S, qty,
        );
        await tx.$executeRawUnsafe(
          `insert into public.inventory_movements (sku, movement_type, quantity_change, quantity_before, quantity_after, source_type, reason, created_by)
           values ($1,'MANUAL_ADJUSTMENT_IN',$2::int,0,$2::int,'manual','יצירת מוצר חדש',$3)`, S, qty, user,
        );
      }
    });
    await auditLog(user, 'PRODUCT_CREATED', 'inventory_item', S, null, { name, qty });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 140) : 'שגיאת DB' };
  }
}

// ---------- Manual adjustment (creates a movement — never a bare quantity edit) ----------
export async function adjustStock(
  sku: string, delta: number, type: MovementType, reason: string, user = 'admin',
): Promise<{ ok: boolean; error?: string; after?: number }> {
  const S = sku.toUpperCase();
  const d = Math.round(num(delta));
  if (!d) return { ok: false, error: 'שינוי חייב להיות שונה מ-0' };
  if (!reason.trim()) return { ok: false, error: 'חובה לציין סיבה' };
  if (!META.has(S)) {
    // מותר גם למוצר שנקלט מחשבונית (קיים ב-inventory_items), לא רק לקטלוג
    try {
      const ex = (await prisma.$queryRawUnsafe(`select 1 from public.inventory_items where sku=$1 limit 1`, S)) as unknown[];
      if (!ex.length) return { ok: false, error: 'מוצר לא קיים' };
    } catch { return { ok: false, error: 'מוצר לא קיים' }; }
  }
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

// עזר: איחוד כמויות שנקנו לפי SKU מתוך פריטי הזמנה.
function orderQtyBySku(items: Array<{ id?: string; quantity?: number }>): Map<string, number> {
  const bySku = new Map<string, number>();
  for (const it of items) {
    const sku = skuOf(String(it.id ?? ''));
    // כל SKU בקטלוג (כולל וריאנטי-מידה מוסתרים) — SUPPLIER_COST מכיל את כולם, META רק ראשיים.
    if (!sku || !SUPPLIER_COST.has(sku)) continue;
    bySku.set(sku, (bySku.get(sku) ?? 0) + Math.max(1, Math.floor(num(it.quantity) || 1)));
  }
  return bySku;
}

// ---------- ⭐ הורדת מלאי בסימון הזמנה "נשלחה" — idempotent ברמת הזמנה ----------
// נקרא מ-fulfill route כשההזמנה עוברת ל-status='shipping'. הכמות המדויקת שנקנתה
// יורדת מהמלאי. אותה הזמנה מורידה מלאי פעם אחת בלבד (orders.stock_deducted_at).
export async function deductOrderStock(orderNumber: string): Promise<{ applied: boolean; reason?: string; lines?: number }> {
  const on = (orderNumber || '').trim();
  if (!on) return { applied: false, reason: 'no order number' };
  try {
    const result = await prisma.$transaction(async (tx) => {
      // תפיסת idempotency אטומית — רק אם ההזמנה שולמה וטרם הורד ממנה מלאי
      const claim = (await tx.$queryRawUnsafe(
        `update public.orders set stock_deducted_at=now()
         where order_number=$1 and status='paid' and stock_deducted_at is null returning items`,
        on,
      )) as Array<{ items: Array<{ id?: string; quantity?: number }> }>;
      if (claim.length === 0) return { applied: false, reason: 'כבר הורד מלאי / הזמנה לא משולמת' as const };
      const bySku = orderQtyBySku(Array.isArray(claim[0].items) ? claim[0].items : []);
      for (const [sku, qty] of Array.from(bySku)) {
        await tx.$executeRawUnsafe(`insert into public.inventory_items (sku, supplier_code) values ($1,$1) on conflict (sku) do nothing`, sku);
        const upd = (await tx.$queryRawUnsafe(
          `update public.inventory_items set quantity_on_hand = quantity_on_hand - $2::int, total_sold = total_sold + $2::int, last_sold_at = now(), updated_at = now() where sku=$1 returning quantity_on_hand`,
          sku, qty,
        )) as Array<{ quantity_on_hand: number }>;
        const after = num(upd[0]?.quantity_on_hand);
        await tx.$executeRawUnsafe(
          `insert into public.inventory_movements (sku, movement_type, quantity_change, quantity_before, quantity_after, source_type, source_id, source_document_number, created_by)
           values ($1,'SALE_OUT',$2::int,$3::int,$4::int,'order_shipped',$5,$5,'system')`,
          sku, -qty, after + qty, after, on,
        );
      }
      return { applied: true as const, lines: bySku.size };
    });
    if (result.applied) await auditLog('system', 'ORDER_SHIPPED_STOCK_OUT', 'order', on, null, { lines: result.lines });
    return result;
  } catch (e) {
    return { applied: false, reason: e instanceof Error ? e.message.slice(0, 140) : 'error' };
  }
}

// ---------- ↩︎ החזרת מלאי בעקבות זיכוי/ביטול הזמנה — idempotent ----------
export async function reverseOrderStock(orderNumber: string, reason = 'זיכוי/ביטול', user = 'admin'): Promise<{ ok: boolean; reason?: string; lines?: number }> {
  const on = (orderNumber || '').trim();
  if (!on) return { ok: false, reason: 'no order number' };
  try {
    const result = await prisma.$transaction(async (tx) => {
      // רק אם ירד מלאי (stock_deducted_at) וטרם הוחזר (stock_reversed_at) — אטומי
      const claim = (await tx.$queryRawUnsafe(
        `update public.orders set stock_reversed_at=now()
         where order_number=$1 and stock_deducted_at is not null and stock_reversed_at is null returning items`,
        on,
      )) as Array<{ items: Array<{ id?: string; quantity?: number }> }>;
      if (claim.length === 0) return { ok: false, reason: 'לא ניתן לבטל — לא ירד מלאי או כבר הוחזר' as const };
      const bySku = orderQtyBySku(Array.isArray(claim[0].items) ? claim[0].items : []);
      for (const [sku, qty] of Array.from(bySku)) {
        const upd = (await tx.$queryRawUnsafe(
          `update public.inventory_items set quantity_on_hand = quantity_on_hand + $2::int, total_sold = greatest(total_sold - $2::int, 0), updated_at=now() where sku=$1 returning quantity_on_hand`,
          sku, qty,
        )) as Array<{ quantity_on_hand: number }>;
        const after = num(upd[0]?.quantity_on_hand);
        await tx.$executeRawUnsafe(
          `insert into public.inventory_movements (sku, movement_type, quantity_change, quantity_before, quantity_after, source_type, source_id, source_document_number, reason, created_by)
           values ($1,'CANCELLED_RECEIPT_REVERSAL',$2::int,$3::int,$4::int,'order_reversal',$5,$5,$6,$7)`,
          sku, qty, after - qty, after, on, reason, user,
        );
      }
      return { ok: true as const, lines: bySku.size };
    });
    if (result.ok) await auditLog(user, 'ORDER_STOCK_REVERSED', 'order', on, null, { reason, lines: result.lines });
    return result;
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message.slice(0, 140) : 'error' };
  }
}
