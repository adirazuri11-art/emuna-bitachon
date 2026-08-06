// ============================================================
// Inventory v2 — כתיבות. server-only. ⚠️ CRM בלבד — אפס כתיבה לאתר.
// כל כתיבה: transaction + audit. תמונות נשמרות ב-product_image_versions + crm_main_image_url.
// ============================================================
import 'server-only';
import { prisma } from '@/lib/prisma';

async function audit(userId: string, action: string, sku: string, after: unknown) {
  try {
    await prisma.$executeRawUnsafe(
      `insert into public.inventory_audit_logs (user_id, action, entity_type, entity_id, after_data)
       values ($1,$2,'inventory_item',$3,$4::jsonb)`,
      userId, action, sku, after != null ? JSON.stringify(after) : null,
    );
  } catch { /* audit never blocks */ }
}

async function ensureItem(sku: string) {
  await prisma.$executeRawUnsafe(
    `insert into public.inventory_items (sku, supplier_code) values ($1,$1) on conflict (sku) do nothing`, sku,
  );
}

// ---- שמירת תמונה חדשה (data-URI/URL) — CRM בלבד, לא נוגע בתמונת האתר ----
export async function saveProductImage(sku: string, imageUrl: string, setMain = true, user = 'admin'): Promise<{ ok: boolean; error?: string; versionId?: string }> {
  const S = (sku || '').trim().toUpperCase();
  const url = (imageUrl || '').trim();
  if (!S) return { ok: false, error: 'חסר קוד מוצר' };
  if (!url) return { ok: false, error: 'חסרה תמונה' };
  if (url.length > 4_000_000) return { ok: false, error: 'התמונה גדולה מדי' };
  try {
    const versionId = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`insert into public.inventory_items (sku, supplier_code) values ($1,$1) on conflict (sku) do nothing`, S);
      if (setMain) await tx.$executeRawUnsafe(`update public.product_image_versions set is_main=false where sku=$1`, S);
      const ins = (await tx.$queryRawUnsafe(
        `insert into public.product_image_versions (sku, image_url, is_main, source, created_by)
         values ($1,$2,$3,'crm_upload',$4) returning id`, S, url, setMain, user,
      )) as Array<{ id: string }>;
      if (setMain) await tx.$executeRawUnsafe(`update public.inventory_items set crm_main_image_url=$2, updated_at=now() where sku=$1`, S, url);
      return ins[0]?.id;
    });
    await audit(user, 'IMAGE_SAVED', S, { setMain });
    return { ok: true, versionId: versionId ? String(versionId) : undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 140) : 'שגיאת DB' };
  }
}

// ---- קביעת גרסת תמונה קיימת כראשית (שחזור גרסה) ----
export async function setMainImageVersion(sku: string, versionId: string, user = 'admin'): Promise<{ ok: boolean; error?: string }> {
  const S = (sku || '').trim().toUpperCase();
  try {
    const ok = await prisma.$transaction(async (tx) => {
      const rows = (await tx.$queryRawUnsafe(`select image_url from public.product_image_versions where id=$1::uuid and sku=$2`, versionId, S)) as Array<{ image_url: string }>;
      if (!rows.length) return false;
      await tx.$executeRawUnsafe(`update public.product_image_versions set is_main=false where sku=$1`, S);
      await tx.$executeRawUnsafe(`update public.product_image_versions set is_main=true where id=$1::uuid`, versionId);
      await tx.$executeRawUnsafe(`update public.inventory_items set crm_main_image_url=$2, updated_at=now() where sku=$1`, S, rows[0].image_url);
      return true;
    });
    if (!ok) return { ok: false, error: 'גרסה לא נמצאה' };
    await audit(user, 'IMAGE_MAIN_SET', S, { versionId });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 140) : 'שגיאת DB' };
  }
}

// ---- שמירת הערות פנימיות ----
export async function saveNotes(sku: string, notes: string, user = 'admin'): Promise<{ ok: boolean; error?: string }> {
  const S = (sku || '').trim().toUpperCase();
  try {
    await ensureItem(S);
    await prisma.$executeRawUnsafe(`update public.inventory_items set notes=$2, updated_at=now() where sku=$1`, S, notes.slice(0, 5000) || null);
    await audit(user, 'NOTES_SAVED', S, null);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 140) : 'שגיאת DB' };
  }
}

// ---- עריכת שדות כרטיס (שם/מותג/מיקום/מינ׳/עלות נוספת/override מחירים) ----
const FIELD_MAP: Record<string, string> = {
  name: 'name', shortName: 'short_name', brand: 'brand', category: 'category_name',
  barcode: 'barcode', warehouseLocation: 'warehouse_location', shelfLocation: 'shelf_location',
  supplierName: 'supplier_name', internalDescription: 'internal_description',
};
const NUM_FIELD_MAP: Record<string, string> = {
  minimumStock: 'minimum_stock', reorderPoint: 'reorder_point', targetStock: 'target_stock',
  additionalUnitCost: 'additional_unit_cost', retailPriceOverride: 'retail_price_override', clubPriceOverride: 'club_price_override',
};

export async function updateProductFields(sku: string, patch: Record<string, unknown>, user = 'admin'): Promise<{ ok: boolean; error?: string }> {
  const S = (sku || '').trim().toUpperCase();
  const sets: string[] = [];
  const vals: unknown[] = [S];
  for (const [k, col] of Object.entries(FIELD_MAP)) {
    if (k in patch) { vals.push(patch[k] != null && String(patch[k]).trim() !== '' ? String(patch[k]).trim() : null); sets.push(`${col}=$${vals.length}`); }
  }
  for (const [k, col] of Object.entries(NUM_FIELD_MAP)) {
    if (k in patch) { const n = patch[k]; vals.push(n === '' || n == null ? null : Number(n)); sets.push(`${col}=$${vals.length}::numeric`); }
  }
  if (!sets.length) return { ok: false, error: 'אין מה לעדכן' };
  try {
    await ensureItem(S);
    await prisma.$executeRawUnsafe(`update public.inventory_items set ${sets.join(', ')}, updated_at=now() where sku=$1`, ...vals);
    await audit(user, 'PRODUCT_FIELDS_EDITED', S, { fields: Object.keys(patch) });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 140) : 'שגיאת DB' };
  }
}
