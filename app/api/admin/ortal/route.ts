// ⚠️ זמני — MIGRATE_SECRET. איתור הזמנת אורטל + שליחת מייל דירוג/התראת עסק. יימחק.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrderForFulfillment } from '@/lib/orders';
import { sendReviewRequest, sendOrderCompletedBusiness } from '@/lib/order-email';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const u = new URL(req.url);
  if (u.searchParams.get('key') !== process.env.MIGRATE_SECRET) return NextResponse.json({ ok: false }, { status: 401 });
  const mode = u.searchParams.get('mode') || 'find';

  if (mode === 'find') {
    const rows = (await prisma.$queryRawUnsafe(
      `select order_number, status, amount,
              customer->>'name' as name, customer->>'email' as email, customer->>'phone' as phone,
              created_at
       from public.orders
       where customer->>'name' ilike '%אורטל%' or customer->>'name' ilike '%ortal%'
       order by created_at desc limit 10`,
    )) as Array<Record<string, unknown>>;
    return NextResponse.json({ ok: true, count: rows.length, orders: rows });
  }

  if (mode === 'send') {
    const orderNumber = u.searchParams.get('order') || '';
    const o = await getOrderForFulfillment(orderNumber);
    if (!o) return NextResponse.json({ ok: false, error: 'order not found' }, { status: 404 });
    const review = await sendReviewRequest(o);
    const biz = await sendOrderCompletedBusiness(o);
    return NextResponse.json({ ok: true, to: o.customer.email, review, business: biz });
  }

  return NextResponse.json({ ok: false, error: 'bad mode' }, { status: 400 });
}
