-- ═══════════════════════════════════════════════════════════════════════════
-- NEXA — Migration v3: Rate Limiting Table
-- Run in: Supabase → SQL Editor → New Query → Run
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.rate_limits (
  id         uuid    default gen_random_uuid() primary key,
  key        text    not null unique,        -- namespace:ip_or_user_id
  count      integer not null default 1,
  reset_at   timestamptz not null,
  created_at timestamptz not null default now()
);

-- Index for fast lookups by key + expiry
create index if not exists idx_rate_limits_key_reset
  on public.rate_limits (key, reset_at);

-- Auto-clean expired records (runs on insert/update — keeps table tiny)
create or replace function clean_expired_rate_limits()
returns trigger as $$
begin
  delete from public.rate_limits where reset_at < now() - interval '1 hour';
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_clean_rate_limits on public.rate_limits;
create trigger trg_clean_rate_limits
  after insert on public.rate_limits
  for each statement execute procedure clean_expired_rate_limits();

-- RLS: this table is server-only (service role only)
alter table public.rate_limits enable row level security;

-- No public access — only service role key can touch this table
-- (service role bypasses RLS entirely, so no policy needed)

-- Done ✅
