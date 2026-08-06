// ============================================================
// Inventory v2 — אגרגטור כרטיס מוצר. server-only. ⚠️ קריאה בלבד (CRM).
// ============================================================
import 'server-only';
import { prisma } from '@/lib/prisma';
import { getRowV2, type InvV2Row } from './model';

const num = (v: unknown) => { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; };
const iso = (v: unknown) => (v ? new Date(v as string).toISOString() : null);

export interface V2Movement {
  id: string; type: string; change: number; before: number; after: number;
  sourceType: string | null; document: string | null; reason: string | null;
  unitCost: number | null; createdBy: string | null; createdAt: string;
}
export interface V2ImageVersion { id: string; imageUrl: string; isMain: boolean; source: string; createdBy: string | null; createdAt: string }
export interface V2AuditEntry { id: string; action: string; userId: string | null; createdAt: string }
export interface V2InvoiceLine { id: string; invoiceId: string; supplierName: string | null; invoiceNumber: string | null; quantity: number; unitCost: number | null; createdAt: string }

export interface InvV2Item {
  row: InvV2Row;
  notes: string | null;
  movements: V2Movement[];
  imageVersions: V2ImageVersion[];
  audit: V2AuditEntry[];
  invoiceLines: V2InvoiceLine[];
}

export async function getInvV2Item(sku: string): Promise<InvV2Item | null> {
  const S = (sku || '').trim().toUpperCase();
  const row = await getRowV2(S);
  if (!row) return null;

  let notes: string | null = null;
  let movements: V2Movement[] = [];
  let imageVersions: V2ImageVersion[] = [];
  let audit: V2AuditEntry[] = [];
  let invoiceLines: V2InvoiceLine[] = [];

  try {
    const nr = (await prisma.$queryRawUnsafe(`select notes from public.inventory_items where sku=$1`, S)) as Array<{ notes: string | null }>;
    notes = nr[0]?.notes ?? null;

    const mv = (await prisma.$queryRawUnsafe(
      `select * from public.inventory_movements where sku=$1 order by created_at desc limit 200`, S,
    )) as Array<Record<string, unknown>>;
    movements = mv.map((m) => ({
      id: String(m.id), type: String(m.movement_type), change: num(m.quantity_change),
      before: num(m.quantity_before), after: num(m.quantity_after),
      sourceType: (m.source_type as string) ?? null, document: (m.source_document_number as string) ?? null,
      reason: (m.reason as string) ?? null, unitCost: m.unit_cost != null ? num(m.unit_cost) : null,
      createdBy: (m.created_by as string) ?? null, createdAt: iso(m.created_at) ?? '',
    }));

    const iv = (await prisma.$queryRawUnsafe(
      `select * from public.product_image_versions where sku=$1 order by created_at desc limit 50`, S,
    )) as Array<Record<string, unknown>>;
    imageVersions = iv.map((v) => ({
      id: String(v.id), imageUrl: String(v.image_url), isMain: !!v.is_main,
      source: String(v.source), createdBy: (v.created_by as string) ?? null, createdAt: iso(v.created_at) ?? '',
    }));

    const au = (await prisma.$queryRawUnsafe(
      `select id, action, user_id, created_at from public.inventory_audit_logs where entity_id=$1 order by created_at desc limit 100`, S,
    )) as Array<Record<string, unknown>>;
    audit = au.map((a) => ({ id: String(a.id), action: String(a.action), userId: (a.user_id as string) ?? null, createdAt: iso(a.created_at) ?? '' }));

    const il = (await prisma.$queryRawUnsafe(
      `select l.id, l.supplier_invoice_id, l.quantity, l.unit_cost, l.created_at, i.supplier_name, i.invoice_number
       from public.supplier_invoice_lines l left join public.supplier_invoices i on i.id = l.supplier_invoice_id
       where upper(l.product_sku)=$1 order by l.created_at desc limit 100`, S,
    )) as Array<Record<string, unknown>>;
    invoiceLines = il.map((l) => ({
      id: String(l.id), invoiceId: String(l.supplier_invoice_id), supplierName: (l.supplier_name as string) ?? null,
      invoiceNumber: (l.invoice_number as string) ?? null, quantity: num(l.quantity),
      unitCost: l.unit_cost != null ? num(l.unit_cost) : null, createdAt: iso(l.created_at) ?? '',
    }));
  } catch { /* tables may be empty */ }

  return { row, notes, movements, imageVersions, audit, invoiceLines };
}
