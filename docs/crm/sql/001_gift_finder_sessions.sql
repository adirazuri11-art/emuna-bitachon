-- ============================================================
-- CRM Instrumentation · Migration 001 · gift_finder_sessions
-- ADDITIVE ONLY — creates a new table. Touches nothing existing.
-- Run once in Supabase → SQL Editor. Safe to re-run (IF NOT EXISTS).
-- Source of truth for מאתר המתנה analytics + Gift Finder Optimization Agent.
-- ============================================================

create table if not exists public.gift_finder_sessions (
  id                        uuid primary key default gen_random_uuid(),
  -- client-generated, used for idempotent upserts (no duplicate rows on retry)
  session_id                text not null unique,
  anonymous_id              text,
  customer_email            text,

  -- the user's answers (stable values, not display-only strings)
  audience                  text,           -- men | women | kids | family | null
  occasion                  text,           -- e.g. 'בר מצווה' | null
  budget_id                 text,           -- b100 | b250 | b600 | lux | null
  budget_max                numeric,
  want_custom               boolean,

  -- what the engine produced
  results_count             integer default 0,
  recommended_product_ids   text[] default '{}',
  recommended_categories    text[] default '{}',

  -- downstream engagement (updated by 'click' events)
  clicked_product_ids       text[] default '{}',
  added_to_cart_ids         text[] default '{}',

  -- context
  source                    text default 'website',
  user_agent                text,

  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists gfs_created_at_idx  on public.gift_finder_sessions (created_at desc);
create index if not exists gfs_occasion_idx    on public.gift_finder_sessions (occasion);
create index if not exists gfs_audience_idx    on public.gift_finder_sessions (audience);
create index if not exists gfs_email_idx       on public.gift_finder_sessions (customer_email);

-- Row Level Security: writes/reads happen only via the server (service-role),
-- which bypasses RLS. Enabling RLS with no public policy blocks the anon key,
-- so no client can read/write this table directly.
alter table public.gift_finder_sessions enable row level security;

comment on table public.gift_finder_sessions is
  'CRM instrumentation: one row per Gift Finder session. Written server-side only.';
