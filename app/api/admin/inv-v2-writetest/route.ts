// ⚠️ זמני — MIGRATE_SECRET. מאמת read+write של inventory-v2 מול ה-DB האמיתי, ומנקה אחריו. יימחק.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getInvV2Kpis } from '@/lib/crm/inventory-v2/model';
import { getInvV2Item } from '@/lib/crm/inventory-v2/item';
import { saveNotes, saveProductImage, updateProductFields } from '@/lib/crm/inventory-v2/mutations';

export const dynamic = 'force-dynamic';
const SKU = 'ZZ-V2-WRITETEST';
const TINY = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('key') !== process.env.MIGRATE_SECRET) return NextResponse.json({ ok: false }, { status: 401 });
  const out: Record<string, unknown> = {};
  try {
    const kpis = await getInvV2Kpis();
    out.readKpis = { totalProducts: kpis.totalProducts, totalUnits: kpis.totalUnits, valueAtCost: kpis.valueAtCost };

    out.saveNotes = await saveNotes(SKU, 'בדיקת כתיבה');
    out.updateFields = await updateProductFields(SKU, { name: 'מוצר בדיקה v2', minimumStock: 7 });
    out.saveImage = await saveProductImage(SKU, TINY, true);

    const item = await getInvV2Item(SKU);
    out.readback = item && {
      name: item.row.name, minimumStock: item.row.minimumStock, notes: item.notes,
      imageVersions: item.imageVersions.length, image: item.row.image?.slice(0, 24), audit: item.audit.length,
    };
  } catch (e) {
    out.error = e instanceof Error ? e.message.slice(0, 200) : 'error';
  } finally {
    // ניקוי מוחלט של נתוני הבדיקה
    try {
      await prisma.$executeRawUnsafe(`delete from public.product_image_versions where sku=$1`, SKU);
      await prisma.$executeRawUnsafe(`delete from public.inventory_audit_logs where entity_id=$1`, SKU);
      await prisma.$executeRawUnsafe(`delete from public.inventory_items where sku=$1`, SKU);
      out.cleaned = true;
    } catch { out.cleaned = false; }
  }
  return NextResponse.json({ ok: !out.error, ...out });
}
