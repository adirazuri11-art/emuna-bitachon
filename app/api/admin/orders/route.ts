import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// בדיקת הזמנות אחרונות — מוגן ב-MIGRATE_SECRET. לאימות בלבד.
export async function GET(req: NextRequest) {
  const secret = process.env.MIGRATE_SECRET;
  const key = req.nextUrl.searchParams.get('key');
  if (!secret || key !== secret) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  try {
    const rows = (await prisma.$queryRawUnsafe(
      `select order_number, status, amount, currency, transaction_id, coupon_code, discount, shipping, gift_wrap,
              customer->>'name' as cust_name, customer->>'phone' as cust_phone, customer->>'city' as cust_city,
              jsonb_array_length(items) as item_count, paid_at, created_at
       from public.orders order by created_at desc limit 15`,
    )) as unknown[];
    return NextResponse.json({ ok: true, count: rows.length, orders: rows });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'query failed' }, { status: 500 });
  }
}
