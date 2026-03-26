-- ═══════════════════════════════════════════════════════════
-- NEXA — Complete Database Schema
-- Run this in: Supabase → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension (already on by default in Supabase)
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────
-- PROFILES
-- One row per user. Extends Supabase auth.users
-- ──────────────────────────────────────────
create table public.profiles (
  id                   uuid references auth.users on delete cascade primary key,
  email                text not null,
  full_name            text,
  avatar_url           text,
  active_workspace_id  uuid,
  created_at           timestamptz default now() not null,
  updated_at           timestamptz default now() not null
);

-- Auto-create a profile when someone signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ──────────────────────────────────────────
-- WORKSPACES
-- Each user can have one workspace (or multiple for Agency tier)
-- ──────────────────────────────────────────
create table public.workspaces (
  id            uuid default uuid_generate_v4() primary key,
  owner_id      uuid references public.profiles(id) on delete cascade not null,
  name          text not null,
  slug          text unique not null,
  -- Brand identity (filled during onboarding)
  brand_name        text,
  brand_tagline     text,
  brand_website     text,
  brand_voice       text,          -- AI-extracted voice description
  brand_audience    text,          -- AI-extracted audience description
  brand_tone        text,          -- e.g. "confident, direct, expert"
  brand_colors      jsonb,         -- { primary: "#00AAFF", secondary: "..." }
  brand_onboarded   boolean default false,
  -- Plan
  plan          text default 'spark' check (plan in ('spark','grow','scale','agency','trial')),
  plan_status   text default 'trialing' check (plan_status in ('active','trialing','canceled','past_due')),
  stripe_customer_id    text unique,
  stripe_subscription_id text unique,
  -- Engagement metrics (updated by agents)
  posting_streak        integer default 0,
  longest_streak        integer default 0,
  last_posted_date      date,
  voice_score_avg       numeric(5,2) default 0,
  -- Morning brief cache (avoid regenerating every load)
  brief_generated_at    timestamptz,
  weekly_brief          jsonb,
  top_angle             text,
  -- Timestamps
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

-- ──────────────────────────────────────────
-- WORKSPACE MEMBERS
-- Supports multi-user workspaces (Grow+)
-- ──────────────────────────────────────────
create table public.workspace_members (
  id            uuid default uuid_generate_v4() primary key,
  workspace_id  uuid references public.workspaces(id) on delete cascade not null,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  role          text default 'member' check (role in ('owner','admin','member')),
  invited_by    uuid references public.profiles(id),
  joined_at     timestamptz default now(),
  unique(workspace_id, user_id)
);

-- ──────────────────────────────────────────
-- CREDITS
-- One row per workspace, tracks balance
-- ──────────────────────────────────────────
create table public.credits (
  id            uuid default uuid_generate_v4() primary key,
  workspace_id  uuid references public.workspaces(id) on delete cascade not null unique,
  balance       integer default 0 not null,
  lifetime_used integer default 0 not null,
  updated_at    timestamptz default now() not null
);

-- Credit transaction log (every deduction/addition)
create table public.credit_transactions (
  id            uuid default uuid_generate_v4() primary key,
  workspace_id  uuid references public.workspaces(id) on delete cascade not null,
  user_id       uuid references public.profiles(id),
  amount        integer not null,  -- positive = add, negative = deduct
  action        text not null,     -- 'monthly_grant','image_gen','video_gen','voice_gen','email_seq','schedule_post','top_up'
  description   text,
  metadata      jsonb,             -- e.g. { content_id: "...", platform: "instagram" }
  created_at    timestamptz default now() not null
);

-- Function to safely deduct credits (returns false if insufficient)
create or replace function public.deduct_credits(
  p_workspace_id uuid,
  p_amount integer,
  p_action text,
  p_user_id uuid,
  p_description text default null
)
returns boolean as $$
declare
  current_balance integer;
begin
  select balance into current_balance
  from public.credits
  where workspace_id = p_workspace_id
  for update;

  if current_balance < p_amount then
    return false;
  end if;

  update public.credits
  set balance = balance - p_amount,
      lifetime_used = lifetime_used + p_amount,
      updated_at = now()
  where workspace_id = p_workspace_id;

  insert into public.credit_transactions
    (workspace_id, user_id, amount, action, description)
  values
    (p_workspace_id, p_user_id, -p_amount, p_action, p_description);

  return true;
end;
$$ language plpgsql security definer;

-- ──────────────────────────────────────────
-- BRAND ASSETS
-- Files uploaded during onboarding
-- ──────────────────────────────────────────
create table public.brand_assets (
  id            uuid default uuid_generate_v4() primary key,
  workspace_id  uuid references public.workspaces(id) on delete cascade not null,
  type          text not null check (type in ('logo','sample_post','product_photo','brand_doc','other')),
  file_url      text not null,     -- Supabase Storage URL
  file_name     text,
  file_size     integer,
  ai_analyzed   boolean default false,
  analysis      jsonb,             -- AI-extracted insights from this asset
  created_at    timestamptz default now() not null
);

-- ──────────────────────────────────────────
-- CONTENT PIECES
-- Everything generated or created in Studio
-- ──────────────────────────────────────────
create table public.content (
  id            uuid default uuid_generate_v4() primary key,
  workspace_id  uuid references public.workspaces(id) on delete cascade not null,
  created_by    uuid references public.profiles(id),
  type          text not null check (type in ('post','reel','story','email','thread','video','image','voice')),
  platform      text check (platform in ('instagram','linkedin','x','tiktok','email','multi')),
  status        text default 'draft' check (status in ('draft','ready','scheduled','published','failed')),
  -- Content body
  title         text,
  body          text,              -- The copy
  image_url     text,              -- Generated or uploaded image
  video_url     text,              -- Generated video
  voice_url     text,              -- Generated voiceover
  -- Scheduling
  scheduled_for timestamptz,
  published_at  timestamptz,
  -- Platform response
  platform_post_id  text,         -- ID returned by Instagram/LinkedIn/X API
  platform_url      text,
  -- Performance (synced by Insights)
  likes         integer default 0,
  comments      integer default 0,
  shares        integer default 0,
  reach         integer default 0,
  impressions   integer default 0,
  -- Credits used to generate this
  credits_used  integer default 0,
  -- Generation metadata
  prompt        text,              -- What the user asked for
  ai_model      text,              -- Which model generated it
  metadata      jsonb,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

-- ──────────────────────────────────────────
-- AI CONVERSATIONS
-- All Nexa AI chat history per workspace
-- ──────────────────────────────────────────
create table public.conversations (
  id            uuid default uuid_generate_v4() primary key,
  workspace_id  uuid references public.workspaces(id) on delete cascade not null,
  user_id       uuid references public.profiles(id),
  title         text,              -- Auto-generated from first message
  context       text,             -- Which section was open: 'home','studio','strategy', etc.
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

create table public.messages (
  id            uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  workspace_id  uuid references public.workspaces(id) on delete cascade not null,
  role          text not null check (role in ('user','assistant')),
  content       text not null,
  metadata      jsonb,            -- tool calls, content IDs referenced, etc.
  created_at    timestamptz default now() not null
);

-- ──────────────────────────────────────────
-- CONNECTED PLATFORMS
-- OAuth tokens for Instagram, LinkedIn, X, TikTok
-- ──────────────────────────────────────────
create table public.connected_platforms (
  id              uuid default uuid_generate_v4() primary key,
  workspace_id    uuid references public.workspaces(id) on delete cascade not null,
  platform        text not null check (platform in ('instagram','linkedin','x','tiktok')),
  platform_user_id    text,
  platform_username   text,
  platform_name       text,
  access_token        text not null,
  refresh_token       text,
  token_expires_at    timestamptz,
  is_active           boolean default true,
  connected_at        timestamptz default now() not null,
  last_synced_at      timestamptz,
  unique(workspace_id, platform)
);

-- ──────────────────────────────────────────
-- AGENTS
-- Background tasks/automations running for a workspace
-- ──────────────────────────────────────────
create table public.agents (
  id            uuid default uuid_generate_v4() primary key,
  workspace_id  uuid references public.workspaces(id) on delete cascade not null,
  created_by    uuid references public.profiles(id),
  name          text not null,
  type          text not null check (type in ('email_sequence','dm_flow','scheduler','follow_up','publisher')),
  status        text default 'idle' check (status in ('idle','running','paused','completed','failed')),
  config        jsonb not null,    -- Agent-specific settings
  progress      integer default 0, -- 0-100
  stats         jsonb default '{}', -- open rates, sends, etc.
  last_run_at   timestamptz,
  next_run_at   timestamptz,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

-- ──────────────────────────────────────────
-- EMAIL SEQUENCES
-- Apollo-style outreach sequences
-- ──────────────────────────────────────────
create table public.email_sequences (
  id            uuid default uuid_generate_v4() primary key,
  workspace_id  uuid references public.workspaces(id) on delete cascade not null,
  agent_id      uuid references public.agents(id) on delete set null,
  name          text not null,
  status        text default 'draft' check (status in ('draft','active','paused','completed')),
  total_contacts    integer default 0,
  emails_sent       integer default 0,
  emails_opened     integer default 0,
  emails_clicked    integer default 0,
  emails_replied    integer default 0,
  steps         jsonb not null default '[]',  -- Array of {delay_days, subject, body}
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

-- ──────────────────────────────────────────
-- ACTIVITY LOG
-- Every meaningful action in the workspace
-- ──────────────────────────────────────────
create table public.activity (
  id            uuid default uuid_generate_v4() primary key,
  workspace_id  uuid references public.workspaces(id) on delete cascade not null,
  user_id       uuid references public.profiles(id),
  type          text not null,     -- 'content_generated','post_published','agent_started', etc.
  title         text not null,
  description   text,
  icon          text,              -- icon name for UI
  metadata      jsonb,
  created_at    timestamptz default now() not null
);

-- ──────────────────────────────────────────
-- STRATEGY PLANS
-- 30-day AI-generated content blueprints
-- ──────────────────────────────────────────
create table public.strategy_plans (
  id            uuid default uuid_generate_v4() primary key,
  workspace_id  uuid references public.workspaces(id) on delete cascade not null,
  title         text not null,
  status        text default 'active' check (status in ('active','archived')),
  audience_map  jsonb,            -- AI-extracted audience psychology
  content_pillars jsonb,          -- Core content themes
  platform_strategy jsonb,        -- Per-platform approach
  daily_plan    jsonb,            -- Array of 30 days with content suggestions
  insights      jsonb,            -- Key recommendations
  generated_at  timestamptz default now() not null,
  valid_until   timestamptz
);

-- ══════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- Users can only see their own workspace data
-- ══════════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.credits enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.brand_assets enable row level security;
alter table public.content enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.connected_platforms enable row level security;
alter table public.agents enable row level security;
alter table public.email_sequences enable row level security;
alter table public.activity enable row level security;
alter table public.strategy_plans enable row level security;

-- Profiles: users see only their own
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Helper: check workspace membership
create or replace function public.is_workspace_member(p_workspace_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace_id
    and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Workspaces: visible to members
create policy "Members can view workspace"
  on public.workspaces for select
  using (is_workspace_member(id));
create policy "Owner can update workspace"
  on public.workspaces for update
  using (owner_id = auth.uid());

-- All workspace-scoped tables follow same pattern
create policy "Members can view workspace_members"
  on public.workspace_members for select
  using (is_workspace_member(workspace_id));

create policy "Members can view credits"
  on public.credits for select using (is_workspace_member(workspace_id));

create policy "Members can view transactions"
  on public.credit_transactions for select using (is_workspace_member(workspace_id));

create policy "Members can view brand_assets"
  on public.brand_assets for all using (is_workspace_member(workspace_id));

create policy "Members can view content"
  on public.content for all using (is_workspace_member(workspace_id));

create policy "Members can view conversations"
  on public.conversations for all using (is_workspace_member(workspace_id));

create policy "Members can view messages"
  on public.messages for all using (is_workspace_member(workspace_id));

create policy "Members can view connected_platforms"
  on public.connected_platforms for all using (is_workspace_member(workspace_id));

create policy "Members can view agents"
  on public.agents for all using (is_workspace_member(workspace_id));

create policy "Members can view email_sequences"
  on public.email_sequences for all using (is_workspace_member(workspace_id));

create policy "Members can view activity"
  on public.activity for select using (is_workspace_member(workspace_id));

create policy "Members can view strategy_plans"
  on public.strategy_plans for all using (is_workspace_member(workspace_id));

-- ══════════════════════════════════════════
-- STORAGE BUCKETS
-- Run these too, or create manually in Supabase → Storage
-- ══════════════════════════════════════════

-- Brand assets bucket
insert into storage.buckets (id, name, public)
values ('brand-assets', 'brand-assets', false);

-- Generated content bucket
insert into storage.buckets (id, name, public)
values ('generated-content', 'generated-content', false);

-- Storage policies
create policy "Authenticated users can upload brand assets"
  on storage.objects for insert
  with check (bucket_id = 'brand-assets' and auth.role() = 'authenticated');

create policy "Members can view brand assets"
  on storage.objects for select
  using (bucket_id = 'brand-assets' and auth.role() = 'authenticated');

-- ══════════════════════════════════════════
-- INDEXES for performance
-- ══════════════════════════════════════════

create index idx_workspace_members_user on public.workspace_members(user_id);
create index idx_workspace_members_workspace on public.workspace_members(workspace_id);
create index idx_content_workspace on public.content(workspace_id);
create index idx_content_status on public.content(status);
create index idx_content_scheduled on public.content(scheduled_for);
create index idx_messages_conversation on public.messages(conversation_id);
create index idx_activity_workspace on public.activity(workspace_id);
create index idx_credit_transactions_workspace on public.credit_transactions(workspace_id);
create index idx_agents_workspace on public.agents(workspace_id);

-- ══════════════════════════════════════════
-- MISSING TABLES (referenced in app code)
-- ══════════════════════════════════════════

-- Agent run history
create table if not exists public.agent_runs (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  agent_type    text not null,
  status        text not null default 'pending', -- pending | running | completed | failed
  result        jsonb,
  credits_used  integer default 0,
  created_at    timestamptz not null default now()
);
alter table public.agent_runs enable row level security;
create policy "Members can manage agent_runs"
  on public.agent_runs for all
  using (is_workspace_member(workspace_id));
create index idx_agent_runs_workspace on public.agent_runs(workspace_id);

-- Brand learning memories (what Nexa learns from content performance)
create table if not exists public.brand_learnings (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  insight_type  text not null, -- voice | audience | visual | engagement | content
  insight       text not null,
  source        text, -- performance_analysis | brand_analysis | user_feedback
  confidence    numeric(3,2) default 0.8,
  created_at    timestamptz not null default now()
);
alter table public.brand_learnings enable row level security;
create policy "Members can manage brand_learnings"
  on public.brand_learnings for all
  using (is_workspace_member(workspace_id));
create index idx_brand_learnings_workspace on public.brand_learnings(workspace_id);

-- Webhooks (incoming automation triggers)
create table if not exists public.webhooks (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  name            text not null,
  secret          text not null unique default encode(gen_random_bytes(32), 'hex'),
  trigger_type    text not null default 'incoming',
  sequence_id     uuid references public.email_sequences(id) on delete set null,
  status          text not null default 'active', -- active | paused
  total_received  integer default 0,
  last_received   timestamptz,
  created_at      timestamptz not null default now()
);
alter table public.webhooks enable row level security;
create policy "Members can manage webhooks"
  on public.webhooks for all
  using (is_workspace_member(workspace_id));
create index idx_webhooks_workspace on public.webhooks(workspace_id);

-- Email subscribers
create table if not exists public.email_subscribers (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  email         text not null,
  name          text,
  tags          text[] default '{}',
  status        text not null default 'active', -- active | unsubscribed | bounced
  source        text, -- webhook | manual | import
  metadata      jsonb default '{}',
  created_at    timestamptz not null default now(),
  unique(workspace_id, email)
);
alter table public.email_subscribers enable row level security;
create policy "Members can manage email_subscribers"
  on public.email_subscribers for all
  using (is_workspace_member(workspace_id));
create index idx_email_subscribers_workspace on public.email_subscribers(workspace_id);

-- Sequence contacts (tracks subscriber progress through sequences)
create table if not exists public.sequence_contacts (
  id            uuid primary key default gen_random_uuid(),
  sequence_id   uuid not null references public.email_sequences(id) on delete cascade,
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  subscriber_id uuid references public.email_subscribers(id) on delete set null,
  email         text not null,
  current_step  integer default 0,
  status        text not null default 'active', -- active | completed | unsubscribed | paused
  enrolled_at   timestamptz not null default now(),
  next_send_at  timestamptz,
  metadata      jsonb default '{}'
);
alter table public.sequence_contacts enable row level security;
create policy "Members can manage sequence_contacts"
  on public.sequence_contacts for all
  using (is_workspace_member(workspace_id));
create index idx_sequence_contacts_workspace on public.sequence_contacts(workspace_id);
create index idx_sequence_contacts_next_send on public.sequence_contacts(next_send_at) where status = 'active';

-- Client workspaces (agency → client relationships)
create table if not exists public.client_workspaces (
  id                    uuid primary key default gen_random_uuid(),
  agency_workspace_id   uuid not null references public.workspaces(id) on delete cascade,
  client_workspace_id   uuid not null references public.workspaces(id) on delete cascade,
  status                text not null default 'active', -- active | paused | ended
  retainer_amount       numeric(10,2),
  notes                 text,
  created_at            timestamptz not null default now(),
  unique(agency_workspace_id, client_workspace_id)
);
alter table public.client_workspaces enable row level security;
create policy "Agency members can manage client_workspaces"
  on public.client_workspaces for all
  using (is_workspace_member(agency_workspace_id));
create index idx_client_workspaces_agency on public.client_workspaces(agency_workspace_id);

-- Client invites (pending invitations sent by agency)
create table if not exists public.client_invites (
  id                    uuid primary key default gen_random_uuid(),
  agency_workspace_id   uuid not null references public.workspaces(id) on delete cascade,
  email                 text not null,
  name                  text,
  status                text not null default 'pending', -- pending | accepted | declined | expired
  token                 text not null unique default encode(gen_random_bytes(16), 'hex'),
  retainer_amount       numeric(10,2),
  message               text,
  expires_at            timestamptz default (now() + interval '7 days'),
  created_at            timestamptz not null default now()
);
alter table public.client_invites enable row level security;
create policy "Agency members can manage client_invites"
  on public.client_invites for all
  using (is_workspace_member(agency_workspace_id));
create index idx_client_invites_agency on public.client_invites(agency_workspace_id);

-- Agency activity log
create table if not exists public.agency_activity (
  id                  uuid primary key default gen_random_uuid(),
  agency_workspace_id uuid not null references public.workspaces(id) on delete cascade,
  type                text not null,
  title               text not null,
  metadata            jsonb default '{}',
  created_at          timestamptz not null default now()
);
alter table public.agency_activity enable row level security;
create policy "Agency members can view agency_activity"
  on public.agency_activity for all
  using (is_workspace_member(agency_workspace_id));
create index idx_agency_activity_workspace on public.agency_activity(agency_workspace_id);

-- Additional indexes for new tables
create index idx_agent_runs_created on public.agent_runs(created_at desc);
create index idx_brand_learnings_created on public.brand_learnings(created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION: Add lead_page_lang and avatar_url columns
-- Run in Supabase SQL Editor if upgrading from an existing schema
-- ─────────────────────────────────────────────────────────────────────────────

-- Lead page language preference (null = auto-detect from visitor browser)
alter table public.workspaces
  add column if not exists lead_page_lang text check (lead_page_lang in ('en','ar'));

-- Profile avatar URL (for user photo in settings)
alter table public.profiles
  add column if not exists avatar_url text;

-- Bio field for profile
alter table public.profiles
  add column if not exists bio text;
