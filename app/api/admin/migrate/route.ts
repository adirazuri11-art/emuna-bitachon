import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// מיגרציה חד-פעמית ל-public.orders (Neon). מוגן ב-MIGRATE_SECRET.
// זהה ל-docs/crm/sql/003_orders.sql (ללא RLS — Neon, גישה דרך Prisma בלבד).
const STATEMENTS = [
  `create table if not exists public.orders (
    order_number   text primary key,
    status         text not null default 'pending_payment',
    amount         numeric(10,2) not null,
    currency       text not null default 'ILS',
    items          jsonb not null default '[]'::jsonb,
    customer       jsonb not null default '{}'::jsonb,
    gift_wrap      numeric(10,2) not null default 0,
    gift_message   text,
    coupon_code    text,
    discount       numeric(10,2) not null default 0,
    shipping       numeric(10,2) not null default 0,
    provider       text not null default 'cardcom',
    provider_ref   text,
    transaction_id text,
    paid_at        timestamptz,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
  )`,
  `create index if not exists orders_status_idx on public.orders (status)`,
  `create index if not exists orders_created_idx on public.orders (created_at desc)`,
];

export async function GET(req: NextRequest) {
  const secret = process.env.MIGRATE_SECRET;
  const key = req.nextUrl.searchParams.get('key');
  if (!secret || key !== secret) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  try {
    for (const stmt of STATEMENTS) await prisma.$executeRawUnsafe(stmt);

    // Self-test: insert → read → delete, כדי להוכיח שהשכבה עובדת מול ה-DB האמיתי.
    const testNo = `MIGRATE-TEST-${Date.now()}`;
    await prisma.$executeRawUnsafe(
      `insert into public.orders (order_number, amount) values ($1, 1)`,
      testNo,
    );
    const rows = (await prisma.$queryRawUnsafe(
      `select order_number, status from public.orders where order_number=$1`,
      testNo,
    )) as Array<{ order_number: string; status: string }>;
    await prisma.$executeRawUnsafe(`delete from public.orders where order_number=$1`, testNo);

    return NextResponse.json({
      ok: true,
      tableReady: true,
      selfTest: rows.length === 1 && rows[0].status === 'pending_payment',
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'migration failed' }, { status: 500 });
  }
}
