import { NextRequest, NextResponse } from 'next/server';
import { isCrmAuthed } from '@/lib/crm/auth';
import { updateOrderFulfillment, claimNotification, type Fulfillment } from '@/lib/crm/orders';
import { getOrderForFulfillment } from '@/lib/orders';
import { sendShippingNotification, sendReviewRequest } from '@/lib/order-email';
import { deductOrderStock } from '@/lib/crm/inventory';

export const dynamic = 'force-dynamic';

const VALID: Fulfillment[] = ['in_progress', 'shipping', 'completed'];

export async function POST(req: NextRequest) {
  if (!isCrmAuthed(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  let body: { orderNumber?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 });
  }
  const orderNumber = String(body.orderNumber ?? '');
  const status = String(body.status ?? '') as Fulfillment;
  if (!orderNumber || !VALID.includes(status)) {
    return NextResponse.json({ ok: false, error: 'invalid params' }, { status: 400 });
  }
  const ok = await updateOrderFulfillment(orderNumber, status);

  // ⭐ הורדת מלאי — ברגע שההזמנה מסומנת "נשלחה" (הכמות המדויקת). idempotent, best-effort.
  if (ok && status === 'shipping') {
    await deductOrderStock(orderNumber).catch(() => {});
  }

  // התראות אוטומטיות ללקוח — best-effort, אטומי (לא נשלח פעמיים), לא מפיל את הבקשה.
  if (ok && status === 'shipping' && (await claimNotification(orderNumber, 'shipping_notified_at'))) {
    const o = await getOrderForFulfillment(orderNumber);
    if (o) await sendShippingNotification(o).catch(() => {});
  } else if (ok && status === 'completed' && (await claimNotification(orderNumber, 'review_requested_at'))) {
    const o = await getOrderForFulfillment(orderNumber);
    if (o) await sendReviewRequest(o).catch(() => {});
  }

  return NextResponse.json({ ok });
}
