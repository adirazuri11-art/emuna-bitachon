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
  // סטטוס טיפול: in_progress (בעבודה) → shipping (במשלוח) → completed (הושלמה)
  `alter table public.orders add column if not exists fulfillment_status text not null default 'in_progress'`,
  `create index if not exists orders_fulfillment_idx on public.orders (fulfillment_status)`,
  // קבלה — מספר מסמך, קישור להורדה, ומועד הפקה (לשקיפות פנימית ב-CRM)
  `alter table public.orders add column if not exists receipt_number text`,
  `alter table public.orders add column if not exists receipt_url text`,
  `alter table public.orders add column if not exists receipt_at timestamptz`,
  // תור פרסום אוטומטי לרשתות (בנק התוכן) — 3 פוסטים/יום, דילוג בשבת
  `create table if not exists public.social_queue (
    idx           int primary key,
    image_url     text not null,
    caption       text not null,
    category      text,
    status        text not null default 'pending',
    fb_post_id    text,
    ig_post_id    text,
    error         text,
    published_at  timestamptz,
    created_at    timestamptz not null default now()
  )`,
  `create index if not exists social_queue_status_idx on public.social_queue (status, idx)`,
  // מאתר המתנה — סשנים לאנליטיקה + סוכן אופטימיזציה
  `create table if not exists public.gift_finder_sessions (
    id                      uuid primary key default gen_random_uuid(),
    session_id              text not null unique,
    anonymous_id            text,
    customer_email          text,
    audience                text,
    occasion                text,
    budget_id               text,
    budget_max              numeric,
    want_custom             boolean,
    results_count           integer default 0,
    recommended_product_ids text[] default '{}',
    recommended_categories  text[] default '{}',
    clicked_product_ids     text[] default '{}',
    added_to_cart_ids       text[] default '{}',
    source                  text default 'website',
    user_agent              text,
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now()
  )`,
  `create index if not exists gfs_created_at_idx on public.gift_finder_sessions (created_at desc)`,
  `create index if not exists gfs_occasion_idx on public.gift_finder_sessions (occasion)`,
  // חיבור Meta — טוקן + מזהים, נשמר במסד (מוגדר דרך תיבת החיבור ב-CRM)
  `create table if not exists public.meta_config (
    id            int primary key default 1,
    access_token  text,
    ig_user_id    text,
    page_id       text,
    updated_at    timestamptz not null default now(),
    constraint meta_config_single check (id = 1)
  )`,
  // ביקורות מוצר — מנוהלות במלואן בתוך ה-CRM (מודרציה לפני הצגה).
  // רק status='approved' מוצג בעמוד המוצר ונספר ב-aggregateRating.
  `create table if not exists public.product_reviews (
    id           uuid primary key default gen_random_uuid(),
    product_slug text not null,
    product_id   text,
    author_name  text not null,
    rating       int not null check (rating between 1 and 5),
    title        text,
    body         text not null,
    email        text,
    status       text not null default 'pending',
    created_at   timestamptz not null default now()
  )`,
  `create index if not exists reviews_slug_status_idx on public.product_reviews (product_slug, status)`,
  `create index if not exists reviews_status_created_idx on public.product_reviews (status, created_at desc)`,
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
