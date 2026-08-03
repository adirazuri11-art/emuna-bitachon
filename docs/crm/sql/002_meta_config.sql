-- Meta credentials store (single row). Lets the token auto-refresh cron persist
-- a fresh long-lived token without touching Vercel env vars.
-- Service-role only; never exposed to the client.
create table if not exists public.meta_config (
  id integer primary key default 1,
  access_token text not null,
  ig_user_id text,
  page_id text,
  token_expires_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint meta_config_singleton check (id = 1)
);

alter table public.meta_config enable row level security;
-- No policies => only the service-role key (server) can read/write. Good.
