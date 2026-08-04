import { NextRequest, NextResponse } from 'next/server';
import { getOrder } from '@/lib/orders';

export const dynamic = 'force-dynamic';

// סטטוס הזמנה לצורך עמוד ההצלחה — האמת מגיעה מה-DB (שמסומן ע"י ה-webhook המאומת בלבד).
export async function GET(req: NextRequest) {
  const orderNumber = req.nextUrl.searchParams.get('order') ?? '';
  if (!orderNumber) return NextResponse.json({ ok: false, error: 'missing order' }, { status: 400 });
  const order = await getOrder(orderNumber);
  if (!order) return NextResponse.json({ ok: false, status: 'unknown' });
  return NextResponse.json({ ok: true, status: order.status, paid: order.paid, amount: order.amount });
}
