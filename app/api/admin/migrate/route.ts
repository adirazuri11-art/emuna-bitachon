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
  // חותמות התראה — מונעות שליחה כפולה של מייל משלוח / בקשת ביקורת (idempotent).
  `alter table public.orders add column if not exists shipping_notified_at timestamptz`,
  `alter table public.orders add column if not exists review_requested_at timestamptz`,
  // קופונים מותאמים שנוצרים ב-CRM — נאכפים בסליקה (lib/promo.ts). מימושים/הכנסה נגזרים מ-orders.coupon_code.
  `create table if not exists public.promo_coupons (
     code text primary key,
     discount_type text not null default 'pct',
     discount_value numeric not null,
     label text,
     expires_at timestamptz,
     max_redemptions int,
     active boolean not null default true,
     created_at timestamptz not null default now()
   )`,
  `create index if not exists orders_coupon_idx on public.orders (coupon_code)`,
  // ========================================================
  // ניהול מלאי פנימי ב-CRM (feature/internal-crm-inventory-management).
  // ⚠️ פנימי בלבד — אפס כתיבה לאתר החי. מלאי יורד רק בהפקת קבלה סופית.
  // ========================================================
  `create table if not exists public.inventory_items (
    sku                 text primary key,
    supplier_code       text,
    barcode             text,
    quantity_on_hand    int not null default 0,
    last_purchase_price numeric(10,2),
    avg_cost            numeric(10,2),
    total_received      int not null default 0,
    total_sold          int not null default 0,
    last_received_at    timestamptz,
    last_sold_at        timestamptz,
    notes               text,
    is_active           boolean not null default true,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
  )`,
  `create index if not exists inv_items_low_idx on public.inventory_items (quantity_on_hand)`,
  // תנועות מלאי — מקור האמת לכל שינוי. אין לשנות quantity_on_hand בלי תנועה.
  `create table if not exists public.inventory_movements (
    id                   uuid primary key default gen_random_uuid(),
    sku                  text not null,
    movement_type        text not null,
    quantity_change      int not null,
    quantity_before      int not null,
    quantity_after       int not null,
    source_type          text,
    source_id            text,
    source_document_number text,
    reason               text,
    created_by           text,
    created_at           timestamptz not null default now()
  )`,
  `create index if not exists inv_moves_sku_idx on public.inventory_movements (sku, created_at desc)`,
  `create index if not exists inv_moves_created_idx on public.inventory_movements (created_at desc)`,
  // קבלות שעובדו — מפתח idempotency להורדת מלאי (קבלה מורידה מלאי פעם אחת בלבד).
  `create table if not exists public.processed_receipts (
    receipt_number         text primary key,
    order_number           text,
    issued_at              timestamptz,
    inventory_processed_at timestamptz,
    status                 text not null default 'processing',
    created_at             timestamptz not null default now()
  )`,
  // Audit log לכל שינוי מלאי (מי, מה, לפני/אחרי).
  `create table if not exists public.inventory_audit_logs (
    id          uuid primary key default gen_random_uuid(),
    user_id     text,
    action      text not null,
    entity_type text,
    entity_id   text,
    before_data jsonb,
    after_data  jsonb,
    created_at  timestamptz not null default now()
  )`,
  `create index if not exists inv_audit_created_idx on public.inventory_audit_logs (created_at desc)`,
  // ---- Phase 2: קליטת חשבונית ספק ----
  `create table if not exists public.suppliers (
    id              uuid primary key default gen_random_uuid(),
    name            text not null unique,
    business_number text,
    contact_name    text,
    phone           text,
    email           text,
    notes           text,
    created_at      timestamptz not null default now()
  )`,
  `create table if not exists public.supplier_invoices (
    id             uuid primary key default gen_random_uuid(),
    supplier_name  text not null,
    invoice_number text not null,
    invoice_date   date,
    subtotal       numeric(10,2),
    vat            numeric(10,2),
    total          numeric(10,2),
    file_hash      text,
    status         text not null default 'approved',
    line_count     int not null default 0,
    matched_count  int not null default 0,
    units_total    int not null default 0,
    approved_by    text,
    approved_at    timestamptz,
    created_at     timestamptz not null default now(),
    unique (supplier_name, invoice_number)
  )`,
  `create table if not exists public.supplier_invoice_lines (
    id                   uuid primary key default gen_random_uuid(),
    supplier_invoice_id  uuid not null references public.supplier_invoices(id) on delete cascade,
    supplier_product_code text,
    raw_product_name     text,
    product_sku          text,
    quantity             int not null,
    unit_cost            numeric(10,2),
    line_total           numeric(10,2),
    match_method         text,
    status               text not null default 'matched',
    created_at           timestamptz not null default now()
  )`,
  `create index if not exists sinv_lines_invoice_idx on public.supplier_invoice_lines (supplier_invoice_id)`,
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
