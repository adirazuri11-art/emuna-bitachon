-- הזמנות — מקור אמת לסטטוס תשלום. Service-role בלבד (אין policies => רק השרת).
create table if not exists public.orders (
  order_number   text primary key,
  status         text not null default 'pending_payment', -- pending_payment | paid | failed
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
  provider_ref   text,               -- LowProfileId
  transaction_id text,               -- TranzactionId מאומת
  paid_at        timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.orders enable row level security;
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_idx on public.orders (created_at desc);
