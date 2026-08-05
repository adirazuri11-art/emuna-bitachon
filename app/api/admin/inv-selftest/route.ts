// ⚠️ בדיקה יזומה זמנית למערכת המלאי — מוגן ב-MIGRATE_SECRET. יימחק אחרי הבדיקה.
// מריץ קליטת חשבונית → מכירה (קבלה) → כפילות → ביטול, מאמת מלאי, ומנקה הכל.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { approveIntake } from '@/lib/crm/receiving';
import { applyReceiptToInventory, reverseReceipt } from '@/lib/crm/inventory';

export const dynamic = 'force-dynamic';

async function stock(sku: string): Promise<number | null> {
  const r = (await prisma.$queryRawUnsafe(`select quantity_on_hand from public.inventory_items where sku=$1`, sku)) as Array<{ quantity_on_hand: number }>;
  return r.length ? Number(r[0].quantity_on_hand) : null;
}

export async function GET(req: NextRequest) {
  if (new URL(req.url).searchParams.get('key') !== process.env.MIGRATE_SECRET) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const SKU = 'UK67651';
  const rnd = Math.random().toString(36).slice(2, 8);
  const INV = `TEST-INV-${rnd}`, RCPT = `TEST-RCPT-${rnd}`, ORD = `TEST-ORD-${rnd}`;
  const steps: Array<{ step: string; expected: unknown; actual: unknown; pass: boolean }> = [];
  const chk = (step: string, expected: unknown, actual: unknown) => steps.push({ step, expected, actual, pass: JSON.stringify(expected) === JSON.stringify(actual) });

  try {
    // ניקוי מקדים
    await prisma.$executeRawUnsafe(`delete from public.inventory_movements where sku=$1 and source_document_number in ($2,$3)`, SKU, INV, RCPT);
    await prisma.$executeRawUnsafe(`delete from public.inventory_items where sku=$1`, SKU);
    await prisma.$executeRawUnsafe(`delete from public.processed_receipts where receipt_number=$1`, RCPT);
    await prisma.$executeRawUnsafe(`delete from public.supplier_invoices where invoice_number=$1`, INV);

    // A — קליטת חשבונית: +10
    const a = await approveIntake({ invoiceNumber: INV, lines: [{ supplierCode: SKU, quantity: 10, unitCost: 5 }] });
    chk('A: קליטת חשבונית הצליחה', true, a.ok);
    if (!a.ok) steps.push({ step: 'A: שגיאה מדויקת', expected: '(none)', actual: a.error, pass: false });
    chk('A: מלאי אחרי קליטה = 10', 10, await stock(SKU));

    // B — חשבונית כפולה: נדחית, מלאי נשאר 10
    const b = await approveIntake({ invoiceNumber: INV, lines: [{ supplierCode: SKU, quantity: 10, unitCost: 5 }] });
    chk('B: חשבונית כפולה נדחתה', true, b.duplicate === true);
    chk('B: מלאי לא השתנה = 10', 10, await stock(SKU));

    // הזמנת בדיקה (paid) עם 3 יחידות
    await prisma.$executeRawUnsafe(
      `insert into public.orders (order_number, status, amount, items, customer) values ($1,'paid',100,$2::jsonb,'{}'::jsonb)
       on conflict (order_number) do update set items=$2::jsonb, status='paid'`,
      ORD, JSON.stringify([{ id: 'art-uk67651', title: 'test', quantity: 3, unitPrice: 33 }]),
    );

    // C — מכירה/קבלה: −3 → 7
    const c = await applyReceiptToInventory(ORD, RCPT);
    chk('C: הורדת מלאי בקבלה בוצעה', true, c.applied);
    chk('C: מלאי אחרי מכירה = 7', 7, await stock(SKU));

    // D — קבלה כפולה: לא יורד שוב, נשאר 7
    const d = await applyReceiptToInventory(ORD, RCPT);
    chk('D: קבלה כפולה נמנעה', false, d.applied);
    chk('D: מלאי לא ירד שוב = 7', 7, await stock(SKU));

    // E — ביטול/זיכוי: +3 → 10
    const e = await reverseReceipt(RCPT, 'בדיקה');
    chk('E: ביטול קבלה בוצע', true, e.ok);
    chk('E: מלאי אחרי ביטול = 10', 10, await stock(SKU));

    // F — ביטול כפול: נדחה, נשאר 10
    const f = await reverseReceipt(RCPT, 'בדיקה');
    chk('F: ביטול כפול נמנע', false, f.ok);
    chk('F: מלאי נשאר = 10', 10, await stock(SKU));

    // ניקוי מלא — כאילו הבדיקה לא קרתה
    await prisma.$executeRawUnsafe(`delete from public.inventory_movements where sku=$1`, SKU);
    await prisma.$executeRawUnsafe(`delete from public.inventory_items where sku=$1`, SKU);
    await prisma.$executeRawUnsafe(`delete from public.processed_receipts where receipt_number=$1`, RCPT);
    await prisma.$executeRawUnsafe(`delete from public.supplier_invoice_lines where supplier_invoice_id in (select id from public.supplier_invoices where invoice_number=$1)`, INV);
    await prisma.$executeRawUnsafe(`delete from public.supplier_invoices where invoice_number=$1`, INV);
    await prisma.$executeRawUnsafe(`delete from public.orders where order_number=$1`, ORD);
    await prisma.$executeRawUnsafe(`delete from public.inventory_audit_logs where entity_id in ($1,$2)`, RCPT, INV);

    const cleanupStock = await stock(SKU);
    chk('ניקוי: אין שארית מלאי למוצר', null, cleanupStock);

    const allPass = steps.every((s) => s.pass);
    return NextResponse.json({ ok: true, allPass, passed: steps.filter((s) => s.pass).length, total: steps.length, steps });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'error', steps }, { status: 500 });
  }
}
