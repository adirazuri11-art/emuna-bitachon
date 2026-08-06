// ⚠️ בדיקה יזומה זמנית — מוגן ב-MIGRATE_SECRET. יימחק. בודק: קליטה (כולל מוצר לא-בקטלוג),
// הורדת מלאי בסימון "נשלחה", idempotency, וביטול.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { approveIntake } from '@/lib/crm/receiving';
import { deductOrderStock, reverseOrderStock } from '@/lib/crm/inventory';

export const dynamic = 'force-dynamic';

async function stock(sku: string): Promise<number | null> {
  const r = (await prisma.$queryRawUnsafe(`select quantity_on_hand from public.inventory_items where sku=$1`, sku)) as Array<{ quantity_on_hand: number }>;
  return r.length ? Number(r[0].quantity_on_hand) : null;
}
async function nameOf(sku: string): Promise<string | null> {
  const r = (await prisma.$queryRawUnsafe(`select name from public.inventory_items where sku=$1`, sku)) as Array<{ name: string | null }>;
  return r.length ? r[0].name : null;
}

export async function GET(req: NextRequest) {
  if (new URL(req.url).searchParams.get('key') !== process.env.MIGRATE_SECRET) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const SKU = 'UK67651';                       // מוצר קטלוג
  const rnd = Math.random().toString(36).slice(2, 8);
  const NEW = `ZZTEST${rnd.toUpperCase()}`;    // קוד שלא בקטלוג
  const INV = `TEST-INV-${rnd}`, ORD = `TEST-ORD-${rnd}`;
  const steps: Array<{ step: string; expected: unknown; actual: unknown; pass: boolean }> = [];
  const chk = (step: string, expected: unknown, actual: unknown) => steps.push({ step, expected, actual, pass: JSON.stringify(expected) === JSON.stringify(actual) });

  const cleanup = async () => {
    await prisma.$executeRawUnsafe(`delete from public.inventory_movements where sku in ($1,$2)`, SKU, NEW).catch(() => {});
    await prisma.$executeRawUnsafe(`delete from public.inventory_items where sku in ($1,$2)`, SKU, NEW).catch(() => {});
    await prisma.$executeRawUnsafe(`delete from public.supplier_invoice_lines where supplier_invoice_id in (select id from public.supplier_invoices where invoice_number=$1)`, INV).catch(() => {});
    await prisma.$executeRawUnsafe(`delete from public.supplier_invoices where invoice_number=$1`, INV).catch(() => {});
    await prisma.$executeRawUnsafe(`delete from public.orders where order_number=$1`, ORD).catch(() => {});
  };

  try {
    await cleanup();

    // A — קליטת חשבונית: מוצר קטלוג +10, מוצר חדש (לא בקטלוג) +5
    const a = await approveIntake({ invoiceNumber: INV, lines: [
      { supplierCode: SKU, quantity: 10, unitCost: 49.99 },
      { supplierCode: NEW, quantity: 5, unitCost: 12, rawName: 'מוצר בדיקה' },
    ] });
    chk('A: קליטה הצליחה', true, a.ok);
    if (!a.ok) steps.push({ step: 'A: שגיאה', expected: '(none)', actual: a.error, pass: false });
    chk('A: מוצר חדש נוסף (1)', 1, a.newProducts);
    chk('A: מלאי קטלוג = 10', 10, await stock(SKU));
    chk('A: מלאי מוצר חדש = 5', 5, await stock(NEW));
    chk('A: שם מוצר חדש נשמר', 'מוצר בדיקה', await nameOf(NEW));

    // הזמנת בדיקה (paid) — 3 יח' מהמוצר הקטלוגי
    await prisma.$executeRawUnsafe(
      `insert into public.orders (order_number, status, amount, items, customer) values ($1,'paid',100,$2::jsonb,'{}'::jsonb)`,
      ORD, JSON.stringify([{ id: 'art-uk67651', quantity: 3, unitPrice: 33 }]),
    );

    // B — הורדת מלאי בסימון "נשלחה": −3 → 7
    const b = await deductOrderStock(ORD);
    chk('B: הורדת מלאי בשליחה בוצעה', true, b.applied);
    chk('B: מלאי אחרי שליחה = 7', 7, await stock(SKU));

    // C — הורדה כפולה נמנעת: נשאר 7
    const c = await deductOrderStock(ORD);
    chk('C: הורדה כפולה נמנעה', false, c.applied);
    chk('C: מלאי נשאר = 7', 7, await stock(SKU));

    // D — ביטול/זיכוי: +3 → 10
    const d = await reverseOrderStock(ORD, 'בדיקה');
    chk('D: ביטול בוצע', true, d.ok);
    chk('D: מלאי אחרי ביטול = 10', 10, await stock(SKU));

    // E — ביטול כפול נמנע: נשאר 10
    const e = await reverseOrderStock(ORD, 'בדיקה');
    chk('E: ביטול כפול נמנע', false, e.ok);
    chk('E: מלאי נשאר = 10', 10, await stock(SKU));

    await cleanup();
    chk('ניקוי: אין שארית', null, await stock(SKU));

    return NextResponse.json({ ok: true, allPass: steps.every((s) => s.pass), passed: steps.filter((s) => s.pass).length, total: steps.length, steps });
  } catch (err) {
    await cleanup();
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'error', steps }, { status: 500 });
  }
}
