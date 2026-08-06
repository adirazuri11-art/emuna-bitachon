// ============================================================
// CRM — קליטת סחורה מחשבונית ספק (Phase 2). ⚠️ פנימי בלבד.
// חשבונית מאושרת מוסיפה מלאי (PURCHASE_IN). מניעת חשבונית כפולה (ספק+מספר / hash).
// התאמה לפי קוד ספק = SKU (ART Judaica, למשל UK49849). server-only, defensive.
// ============================================================

import 'server-only';
import { prisma } from '@/lib/prisma';
import { productMeta } from '@/lib/crm/inventory';

const num = (v: unknown) => Number(v ?? 0);
export const DEFAULT_SUPPLIER = 'ART Judaica (israel-judaica.com)';

// ---- חיפוש מוצר לפי קוד ספק (live בזמן הקלדה) ----
export interface CodeLookup { found: boolean; sku?: string; title?: string; image?: string; currentStock?: number }
export async function lookupSupplierCode(code: string): Promise<CodeLookup> {
  const meta = productMeta(code);
  if (!meta) return { found: false };
  let currentStock = 0;
  try {
    const r = (await prisma.$queryRawUnsafe(`select quantity_on_hand from public.inventory_items where sku=$1 limit 1`, meta.sku)) as Array<{ quantity_on_hand: number }>;
    currentStock = num(r[0]?.quantity_on_hand);
  } catch { /* no row → 0 */ }
  return { found: true, sku: meta.sku, title: meta.title, image: meta.image, currentStock };
}

export interface IntakeLineInput { supplierCode: string; quantity: number; unitCost?: number; rawName?: string }
export interface IntakeInput {
  supplierName?: string;
  invoiceNumber: string;
  invoiceDate?: string | null;
  vat?: number | null;
  fileHash?: string | null;
  lines: IntakeLineInput[];
  user?: string;
}
export interface IntakeResult {
  ok: boolean;
  error?: string;
  duplicate?: boolean;
  invoiceId?: string;
  matched?: number;
  newProducts?: number;
  unitsTotal?: number;
}

export async function approveIntake(input: IntakeInput): Promise<IntakeResult> {
  const supplier = (input.supplierName || DEFAULT_SUPPLIER).trim();
  const invNo = (input.invoiceNumber || '').trim();
  const user = input.user || 'admin';
  if (!invNo) return { ok: false, error: 'חסר מספר חשבונית' };
  const lines = (input.lines || []).filter((l) => l.supplierCode?.trim() && Math.round(num(l.quantity)) > 0);
  if (lines.length === 0) return { ok: false, error: 'אין שורות תקינות לקליטה' };

  // מניעת כפילות — ספק+מספר חשבונית, או hash של קובץ
  try {
    const dup = (await prisma.$queryRawUnsafe(
      `select id from public.supplier_invoices where (supplier_name=$1 and invoice_number=$2) or ($3 <> '' and file_hash=$3) limit 1`,
      supplier, invNo, input.fileHash ?? '',
    )) as Array<{ id: string }>;
    if (dup.length) return { ok: false, error: 'חשבונית זו כבר נקלטה', duplicate: true, invoiceId: String(dup[0].id) };
  } catch { /* אם אין טבלה עוד — ימשיך וייכשל בהמשך */ }

  let subtotal = 0;
  for (const l of lines) subtotal += num(l.unitCost) * Math.round(num(l.quantity));
  const vat = input.vat != null ? num(input.vat) : Math.round(subtotal * 0.17 * 100) / 100;
  const total = Math.round((subtotal + vat) * 100) / 100;

  try {
    const res = await prisma.$transaction(async (tx) => {
      const invRows = (await tx.$queryRawUnsafe(
        `insert into public.supplier_invoices (supplier_name, invoice_number, invoice_date, subtotal, vat, total, file_hash, status, approved_by, approved_at)
         values ($1,$2,$3::date,$4::numeric,$5::numeric,$6::numeric,$7,'approved',$8,now()) returning id`,
        supplier, invNo, input.invoiceDate || null, subtotal, vat, total, input.fileHash || null, user,
      )) as Array<{ id: string }>;
      const invoiceId = String(invRows[0].id);

      let matched = 0, newProducts = 0, units = 0;
      for (const l of lines) {
        const qty = Math.round(num(l.quantity));
        const cost = num(l.unitCost);
        const meta = productMeta(l.supplierCode);
        // מוצר בקטלוג → SKU מהקטלוג. קוד שלא זוהה → נוסף כמוצר חדש עם הקוד עצמו כ-SKU.
        const sku = meta?.sku ?? l.supplierCode.trim().toUpperCase();
        const name = l.rawName || meta?.title || null;
        units += qty;
        if (meta) matched++; else newProducts++;

        await tx.$executeRawUnsafe(
          `insert into public.supplier_invoice_lines (supplier_invoice_id, supplier_product_code, raw_product_name, product_sku, quantity, unit_cost, line_total, match_method, status)
           values ($1::uuid,$2,$3,$4,$5::int,$6::numeric,$7::numeric,$8,'matched')`,
          invoiceId, l.supplierCode.trim(), name, sku, qty, cost, cost * qty,
          meta ? 'supplier_code' : 'new_product',
        );

        // מוצר בקטלוג: name נשאר null (מגיע מהקטלוג). מוצר חדש: שומרים את השם מהחשבונית.
        await tx.$executeRawUnsafe(
          `insert into public.inventory_items (sku, supplier_code, name) values ($1,$1,$2)
           on conflict (sku) do update set name = coalesce(public.inventory_items.name, excluded.name)`,
          sku, name,
        );
        // עלות ממוצעת משוקללת — כל ביטויי ה-SET רואים את ערכי השורה הישנים. casts מפורשים (Prisma שולח כ-text).
        const upd = (await tx.$queryRawUnsafe(
          `update public.inventory_items set
             avg_cost = case when (total_received + $2::int) > 0 then ((coalesce(avg_cost,0)*total_received) + ($3::numeric * $2::int)) / (total_received + $2::int) else $3::numeric end,
             quantity_on_hand = quantity_on_hand + $2::int,
             total_received   = total_received + $2::int,
             last_purchase_price = $3::numeric,
             last_received_at = now(),
             updated_at = now()
           where sku=$1 returning quantity_on_hand`,
          sku, qty, cost,
        )) as Array<{ quantity_on_hand: number }>;
        const after = num(upd[0]?.quantity_on_hand);
        const before = after - qty;
        await tx.$executeRawUnsafe(
          `insert into public.inventory_movements (sku, movement_type, quantity_change, quantity_before, quantity_after, source_type, source_id, source_document_number, created_by)
           values ($1,'PURCHASE_IN',$2::int,$3::int,$4::int,'supplier_invoice',$5,$6,$7)`,
          sku, qty, before, after, invoiceId, invNo, user,
        );
      }

      await tx.$executeRawUnsafe(
        `update public.supplier_invoices set line_count=$2::int, matched_count=$3::int, units_total=$4::int where id=$1::uuid`,
        invoiceId, lines.length, matched + newProducts, units,
      );
      return { invoiceId, matched, newProducts, unitsTotal: units };
    });

    try {
      await prisma.$executeRawUnsafe(
        `insert into public.inventory_audit_logs (user_id, action, entity_type, entity_id, after_data)
         values ($1,'STOCK_RECEIPT_APPROVED','supplier_invoice',$2,$3::jsonb)`,
        user, res.invoiceId, JSON.stringify({ supplier, invoiceNumber: invNo, ...res }),
      );
    } catch { /* audit never blocks */ }

    return { ok: true, ...res };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 160) : 'שגיאת DB' };
  }
}

// ---- רשימת חשבוניות אחרונות ----
export interface InvoiceRow {
  id: string;
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string | null;
  total: number;
  lineCount: number;
  matchedCount: number;
  unitsTotal: number;
  approvedAt: string | null;
}
export async function listInvoices(limit = 50): Promise<InvoiceRow[]> {
  try {
    const rows = (await prisma.$queryRawUnsafe(
      `select id, supplier_name, invoice_number, invoice_date, total, line_count, matched_count, units_total, approved_at
       from public.supplier_invoices order by created_at desc limit ${Math.min(200, Math.max(1, limit))}`,
    )) as Array<Record<string, unknown>>;
    return rows.map((r) => ({
      id: String(r.id),
      supplierName: String(r.supplier_name ?? ''),
      invoiceNumber: String(r.invoice_number ?? ''),
      invoiceDate: r.invoice_date ? new Date(r.invoice_date as string).toISOString() : null,
      total: num(r.total),
      lineCount: num(r.line_count),
      matchedCount: num(r.matched_count),
      unitsTotal: num(r.units_total),
      approvedAt: r.approved_at ? new Date(r.approved_at as string).toISOString() : null,
    }));
  } catch {
    return [];
  }
}
