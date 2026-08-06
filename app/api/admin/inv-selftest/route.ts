// ⚠️ בדיקה זמנית — MIGRATE_SECRET. בודקת יצירת מוצר, עריכת שם/תמונה, override על קטלוג.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createProduct, updateProduct, listInventory } from '@/lib/crm/inventory';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (new URL(req.url).searchParams.get('key') !== process.env.MIGRATE_SECRET) return NextResponse.json({ ok: false }, { status: 401 });
  const rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
  const NEW = `ZZNEW${rnd}`;
  const CAT = 'UK67651';
  const steps: Array<{ step: string; expected: unknown; actual: unknown; pass: boolean }> = [];
  const chk = (s: string, e: unknown, a: unknown) => steps.push({ step: s, expected: e, actual: a, pass: JSON.stringify(e) === JSON.stringify(a) });
  const clean = async () => {
    await prisma.$executeRawUnsafe(`delete from public.inventory_movements where sku in ($1,$2)`, NEW, CAT).catch(() => {});
    await prisma.$executeRawUnsafe(`delete from public.inventory_items where sku in ($1,$2)`, NEW, CAT).catch(() => {});
  };
  try {
    await clean();
    // A — יצירת מוצר חדש עם כמות
    const a = await createProduct({ sku: NEW, name: 'מוצר ידני', quantity: 3, cost: 20 });
    chk('A: יצירה', true, a.ok);
    const listA = await listInventory(NEW, 'all', 50);
    const rowA = listA.find((r) => r.sku === NEW);
    chk('A: מופיע ברשימה', true, !!rowA);
    chk('A: שם', 'מוצר ידני', rowA?.title);
    chk('A: מלאי', 3, rowA?.quantityOnHand);
    chk('A: לא בקטלוג', false, rowA?.inCatalog);
    // B — עריכת שם + תמונה
    const b = await updateProduct(NEW, { name: 'מוצר ידני מעודכן', imageUrl: 'data:image/png;base64,iVBORw0KGgo=' });
    chk('B: עריכה', true, b.ok);
    const rowB = (await listInventory(NEW, 'all', 50)).find((r) => r.sku === NEW);
    chk('B: שם עודכן', 'מוצר ידני מעודכן', rowB?.title);
    chk('B: תמונה נשמרה', true, !!rowB?.image);
    // C — override על מוצר קטלוג
    const c = await updateProduct(CAT, { name: 'שם מותאם לקטלוג' });
    chk('C: override', true, c.ok);
    const rowC = (await listInventory('שם מותאם', 'all', 50)).find((r) => r.sku === CAT);
    chk('C: שם קטלוג נדרס', 'שם מותאם לקטלוג', rowC?.title);
    await clean();
    return NextResponse.json({ ok: true, allPass: steps.every((s) => s.pass), passed: steps.filter((s) => s.pass).length, total: steps.length, steps });
  } catch (e) {
    await clean();
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'err', steps }, { status: 500 });
  }
}
