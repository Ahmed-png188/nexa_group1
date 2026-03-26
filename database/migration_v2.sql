-- ═══════════════════════════════════════════════════════════════════════════
-- NEXA — Migration v2
-- Run this in: Supabase → SQL Editor → New Query → Run
-- Safe to run on existing databases (uses IF NOT EXISTS / IF NOT EXISTS)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Lead page language preference
--    Lets workspace owners force the public form to render in a specific language.
--    NULL = auto-detect from visitor's browser/preference.
alter table public.workspaces
  add column if not exists lead_page_lang text check (lead_page_lang in ('en','ar'));

-- 2. Profile avatar URL
--    Stores the uploaded profile photo URL from Supabase storage.
alter table public.profiles
  add column if not exists avatar_url text;

-- 3. Profile bio
--    One-liner bio shown in workspace profile.
alter table public.profiles
  add column if not exists bio text;

-- 4. Atomic credits addition RPC (prevents race conditions in Stripe webhook)
create or replace function public.add_credits(
  p_workspace_id uuid,
  p_amount integer
)
returns void
language sql security definer
as $$
  update public.credits
  set balance = balance + p_amount,
      updated_at = now()
  where workspace_id = p_workspace_id;
$$;

-- 5. Atomic webhook trigger increment RPC
create or replace function public.increment_webhook_trigger(webhook_id uuid)
returns void
language sql security definer
as $$
  update public.webhooks
  set trigger_count = coalesce(trigger_count, 0) + 1,
      last_triggered = now()
  where id = webhook_id;
$$;

-- 5. stripe_event_id index on credit_transactions metadata
--    Speeds up idempotency check in Stripe webhook handler.
create index if not exists idx_credit_transactions_stripe_event
  on public.credit_transactions ((metadata->>'stripe_event_id'))
  where metadata->>'stripe_event_id' is not null;

-- Done. ✅
