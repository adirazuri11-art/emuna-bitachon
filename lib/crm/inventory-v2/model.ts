// ============================================================
// Inventory "Million System" — שכבת קריאה עשירה (Phase 1). server-only, defensive.
// ⚠️ CRM בלבד. קורא: inventory_items (CRM) + קטלוג/עלות/מחיר-חבר (read-only מהאתר).
// מחשב: landed cost, רווח, מרווח, markup, שווי מלאי — בלי NaN/Infinity.
// מקור אמת לכמות = inventory_movements; כאן רק תצוגה מחושבת.
// ============================================================

import 'server-only';
import { prisma } from '@/lib/prisma';
import { PRODUCTS } from '@/lib/catalog';
import supplierData from '@/lib/supplier-products.json';
import { memberPriceFor } from '@/lib/member-prices';

const num = (v: unknown): number => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};
const round2 = (n: number) => Math.round(n * 100) / 100;
const artProxy = (sku: string) => `/api/crm/inventory/art-image/${encodeURIComponent(sku)}`;

// עלות ספק ליחידה מהקטלוג (fallback לעלות לפני קליטת חשבונית).
const SUPPLIER_COST = new Map<string, number>();
for (const it of (supplierData as { items: Array<{ id: string; cost: number }> }).items) {
  SUPPLIER_COST.set(it.id.toUpperCase(), num(it.cost));
}

interface CatMeta { title: string; image?: string; category: string; retail: number; cost?: number }
const META = new Map<string, CatMeta>();
for (const p of PRODUCTS) {
  META.set(p.sku.toUpperCase(), {
    title: p.titleHe,
    image: p.imageUrl,
    category: p.category,
    retail: p.discountPrice ?? p.basePrice,
    cost: SUPPLIER_COST.get(p.sku.toUpperCase()),
  });
}

export interface InvV2Row {
  sku: string;
  supplierCode: string | null;
  barcode: string | null;
  name: string;
  category: string;
  supplierName: string | null;
  brand: string | null;
  image?: string;
  warehouseLocation: string | null;
  // כמויות
  quantityOnHand: number;
  quantityGood: number;
  quantityDamaged: number;
  minimumStock: number | null;
  // עלות ומחיר
  lastPurchaseCost: number | null;
  landedCost: number | null;
  retailPrice: number | null;
  clubPrice: number | null;
  // רווחיות (null כשחסר נתון)
  profitAmount: number | null;
  profitMarginPercent: number | null;
  markupPercent: number | null;
  inventoryValueAtCost: number | null;
  inventoryValueAtRetail: number | null;
  // תאריכים + סטטוס
  lastReceivedAt: string | null;
  lastSoldAt: string | null;
  status: string;
  inCatalog: boolean;
  // דגלי איכות-נתונים
  missingImage: boolean;
  missingCost: boolean;
  missingRetail: boolean;
}

function iso(v: unknown): string | null {
  return v ? new Date(v as string).toISOString() : null;
}

function buildRow(sku: string, r: Record<string, unknown> | undefined, meta: CatMeta | undefined): InvV2Row {
  const S = sku.toUpperCase();
  const inCatalog = !!meta;
  const name = (r?.name as string) || meta?.title || S;
  const image = (r?.crm_main_image_url as string) || (r?.image_url as string) || meta?.image || artProxy(S);

  const onHand = r ? num(r.quantity_on_hand) : 0;
  const damaged = r ? num(r.quantity_damaged) : 0;
  const good = Math.max(onHand - damaged, 0);

  // עלות: חשבונית (incl VAT / last_purchase_price) → קטלוג. + עלות נוספת ליחידה.
  const invoiceCost = r && r.purchase_cost_including_vat != null ? num(r.purchase_cost_including_vat)
    : r && r.last_purchase_price != null ? num(r.last_purchase_price) : null;
  const baseCost = invoiceCost != null ? invoiceCost : (meta?.cost ?? null);
  const addCost = r ? num(r.additional_unit_cost) : 0;
  const landedCost = baseCost != null ? round2(baseCost + addCost) : null;

  // מחיר: override פנימי → קטלוג. מחיר חבר: override → memberPriceFor.
  const retail = r && r.retail_price_override != null ? num(r.retail_price_override)
    : meta ? meta.retail : null;
  const club = r && r.club_price_override != null ? num(r.club_price_override)
    : retail != null ? memberPriceFor(S, retail) : null;

  const profit = landedCost != null && retail != null ? round2(retail - landedCost) : null;
  const marginPct = profit != null && retail ? Math.round((profit / retail) * 100) : null;
  const markupPct = profit != null && landedCost ? Math.round((profit / landedCost) * 100) : null;
  const valueAtCost = landedCost != null ? round2(good * landedCost) : null;
  const valueAtRetail = retail != null ? round2(good * retail) : null;

  return {
    sku: S,
    supplierCode: (r?.supplier_code as string) || (inCatalog ? S : null),
    barcode: (r?.barcode as string) || null,
    name,
    category: (r?.category_name as string) || meta?.category || 'לא בקטלוג',
    supplierName: (r?.supplier_name as string) || (inCatalog ? 'ART Judaica' : null),
    brand: (r?.brand as string) || null,
    image,
    warehouseLocation: (r?.warehouse_location as string) || null,
    quantityOnHand: onHand,
    quantityGood: good,
    quantityDamaged: damaged,
    minimumStock: r && r.minimum_stock != null ? num(r.minimum_stock) : null,
    lastPurchaseCost: r && r.last_purchase_price != null ? num(r.last_purchase_price) : (meta?.cost ?? null),
    landedCost,
    retailPrice: retail,
    clubPrice: club,
    profitAmount: profit,
    profitMarginPercent: marginPct,
    markupPercent: markupPct,
    inventoryValueAtCost: valueAtCost,
    inventoryValueAtRetail: valueAtRetail,
    lastReceivedAt: iso(r?.last_received_at),
    lastSoldAt: iso(r?.last_sold_at),
    status: (r?.product_status as string) || 'active',
    inCatalog,
    missingImage: !((r?.crm_main_image_url) || (r?.image_url) || meta?.image),
    missingCost: landedCost == null,
    missingRetail: retail == null,
  };
}

async function loadInvMap(): Promise<Map<string, Record<string, unknown>>> {
  try {
    const rows = (await prisma.$queryRawUnsafe(`select * from public.inventory_items`)) as Array<Record<string, unknown>>;
    return new Map(rows.map((r) => [String(r.sku).toUpperCase(), r]));
  } catch {
    return new Map();
  }
}

export type InvV2Filter = 'all' | 'low' | 'zero' | 'negative' | 'damaged' | 'no_image' | 'no_cost' | 'no_retail' | 'tracked';

function passesFilter(row: InvV2Row, filter: InvV2Filter): boolean {
  switch (filter) {
    case 'low': return row.quantityGood > 0 && row.minimumStock != null && row.quantityGood <= row.minimumStock;
    case 'zero': return row.quantityOnHand === 0;
    case 'negative': return row.quantityOnHand < 0;
    case 'damaged': return row.quantityDamaged > 0;
    case 'no_image': return row.missingImage;
    case 'no_cost': return row.missingCost;
    case 'no_retail': return row.missingRetail;
    case 'tracked': return row.quantityOnHand !== 0 || row.lastReceivedAt != null || row.lastSoldAt != null;
    default: return true;
  }
}

// ניקוי עברי לחיפוש — גרשיים, מקפים, רווחים כפולים, סימנים.
function normalize(s: string): string {
  return (s || '').toLowerCase().replace(/["'`׳״\-–—]/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function listInventoryV2(search = '', filter: InvV2Filter = 'all', limit = 1000): Promise<InvV2Row[]> {
  const inv = await loadInvMap();
  const rows: InvV2Row[] = [];
  const seen = new Set<string>();
  for (const p of PRODUCTS) {
    const S = p.sku.toUpperCase();
    seen.add(S);
    rows.push(buildRow(S, inv.get(S), META.get(S)));
  }
  for (const [S, r] of Array.from(inv)) {
    if (seen.has(S)) continue;
    rows.push(buildRow(S, r, undefined));
  }
  const q = normalize(search);
  const filtered = rows.filter((row) => {
    if (!passesFilter(row, filter)) return false;
    if (!q) return true;
    const hay = normalize(`${row.name} ${row.sku} ${row.supplierCode ?? ''} ${row.barcode ?? ''} ${row.category} ${row.supplierName ?? ''}`);
    return q.split(' ').every((t) => hay.includes(t));
  });
  filtered.sort((a, b) => a.quantityOnHand - b.quantityOnHand);
  return filtered.slice(0, limit);
}

// שורה עשירה למוצר בודד (לכרטיס המוצר).
export async function getRowV2(sku: string): Promise<InvV2Row | null> {
  const S = (sku || '').trim().toUpperCase();
  if (!S) return null;
  const meta = META.get(S);
  let r: Record<string, unknown> | undefined;
  try {
    const rows = (await prisma.$queryRawUnsafe(`select * from public.inventory_items where sku=$1 limit 1`, S)) as Array<Record<string, unknown>>;
    r = rows[0];
  } catch { /* no DB */ }
  if (!meta && !r) return null;
  return buildRow(S, r, meta);
}

export interface InvV2Kpis {
  totalProducts: number;
  totalUnits: number;
  valueAtCost: number;
  valueAtRetail: number;
  potentialProfit: number;
  lowStock: number;
  zeroStock: number;
  negativeStock: number;
  damaged: number;
  missingImage: number;
  missingCost: number;
  missingRetail: number;
  pendingSupplierInvoices: number;
  unmatchedLines: number;
}

export async function getInvV2Kpis(): Promise<InvV2Kpis> {
  const rows = await listInventoryV2('', 'all', 100000);
  const k: InvV2Kpis = {
    totalProducts: rows.length, totalUnits: 0, valueAtCost: 0, valueAtRetail: 0, potentialProfit: 0,
    lowStock: 0, zeroStock: 0, negativeStock: 0, damaged: 0, missingImage: 0, missingCost: 0, missingRetail: 0,
    pendingSupplierInvoices: 0, unmatchedLines: 0,
  };
  for (const r of rows) {
    k.totalUnits += r.quantityOnHand;
    k.valueAtCost += r.inventoryValueAtCost ?? 0;
    k.valueAtRetail += r.inventoryValueAtRetail ?? 0;
    if (r.quantityOnHand === 0) k.zeroStock++;
    if (r.quantityOnHand < 0) k.negativeStock++;
    if (r.quantityGood > 0 && r.minimumStock != null && r.quantityGood <= r.minimumStock) k.lowStock++;
    if (r.quantityDamaged > 0) k.damaged++;
    if (r.missingImage) k.missingImage++;
    if (r.missingCost) k.missingCost++;
    if (r.missingRetail) k.missingRetail++;
  }
  k.valueAtCost = round2(k.valueAtCost);
  k.valueAtRetail = round2(k.valueAtRetail);
  k.potentialProfit = round2(k.valueAtRetail - k.valueAtCost);
  try {
    const inv = (await prisma.$queryRawUnsafe(
      `select count(*) filter (where status='pending')::int as pend from public.supplier_invoices`,
    )) as Array<{ pend: number }>;
    k.pendingSupplierInvoices = num(inv[0]?.pend);
    const lines = (await prisma.$queryRawUnsafe(
      `select count(*)::int as c from public.supplier_invoice_lines where status <> 'matched'`,
    )) as Array<{ c: number }>;
    k.unmatchedLines = num(lines[0]?.c);
  } catch { /* tables may be empty */ }
  return k;
}
