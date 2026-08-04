import { NextRequest, NextResponse } from 'next/server';
import { getOrderForFulfillment, getOrder, saveReceipt } from '@/lib/orders';
import { createReceiptForTransaction, buildReceiptLines } from '@/lib/payments';
import { sendReceiptEmail } from '@/lib/order-email';

export const dynamic = 'force-dynamic';

// הפקת קבלה רטרואקטיבית להזמנה ששולמה — מוגן ב-MIGRATE_SECRET.
// GET /api/admin/issue-receipt?key=...&order=EB-...&tx=257618005
// tx אופציונלי — אם ההזמנה לא שומרת transaction_id (getOrderForFulfillment לא מחזיר אותו).
export async function GET(req: NextRequest) {
  const secret = process.env.MIGRATE_SECRET;
  const key = req.nextUrl.searchParams.get('key');
  if (!secret || key !== secret) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const orderNumber = req.nextUrl.searchParams.get('order');
  const txOverride = req.nextUrl.searchParams.get('tx');
  if (!orderNumber) return NextResponse.json({ ok: false, error: 'missing order' }, { status: 400 });

  // מצב רישום בלבד — שמירת פרטי קבלה שכבר הופקה (backfill), בלי הפקה חדשה.
  const recordNumber = req.nextUrl.searchParams.get('record');
  const recordUrl = req.nextUrl.searchParams.get('url');
  if (recordNumber) {
    await saveReceipt(orderNumber, recordNumber, recordUrl || '');
    return NextResponse.json({ ok: true, recorded: true, order: orderNumber, receiptNumber: recordNumber });
  }

  const order = await getOrderForFulfillment(orderNumber);
  if (!order) return NextResponse.json({ ok: false, error: 'order not found' }, { status: 404 });

  const paid = await getOrder(orderNumber);
  if (!paid?.paid) return NextResponse.json({ ok: false, error: 'order not paid — לא מפיקים קבלה להזמנה שלא שולמה' }, { status: 409 });

  const transactionId = txOverride || '';
  if (!transactionId) {
    return NextResponse.json({ ok: false, error: 'missing tx — ספק את מספר העסקה בפרמטר tx' }, { status: 400 });
  }

  // שורות הקבלה — זהות לזרימת ה-webhook (מוצרים + משלוח + אריזה − הנחה). סכומן = amount.
  const c = order.customer;
  const lines = buildReceiptLines(order);
  const linesSum = lines.reduce((s, l) => s + l.unitCost * l.quantity, 0);

  // sendCustomer=1 → אנחנו שולחים מייל מותג עם ה-PDF מצורף (בלי מספר בטקסט). Cardcom לא שולח.
  const sendCustomer = req.nextUrl.searchParams.get('email') === '1';
  const result = await createReceiptForTransaction({
    transactionId,
    customer: { name: c.name, email: c.email, phone: c.phone, city: c.city },
    lines,
    sendByEmail: false, // תמיד — אנחנו שולחים, לא Cardcom
  });

  // שמירת הקבלה על ההזמנה — נראית ב-CRM
  let emailSent: { ok: boolean; detail?: string } | undefined;
  if (result.ok && result.documentNumber != null) {
    const url = (result.raw as { DocumentUrl?: string } | undefined)?.DocumentUrl || '';
    await saveReceipt(orderNumber, String(result.documentNumber), url);
    if (sendCustomer && url) emailSent = await sendReceiptEmail(order, url);
  }

  return NextResponse.json({
    order: orderNumber,
    transactionId,
    amount: order.amount,
    linesSum,
    reconciles: Math.abs(linesSum - order.amount) < 0.01,
    receipt: result,
    emailSent,
  });
}
