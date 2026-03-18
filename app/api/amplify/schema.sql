create table if not exists meta_connections (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces(id) on delete cascade,
  ad_account_id text,
  page_id text,
  access_token text,
  token_expires_at timestamptz,
  pixel_id text,
  business_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists amplify_campaigns (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces(id) on delete cascade,
  meta_campaign_id text,
  meta_adset_id text,
  meta_ad_id text,
  name text not null,
  objective text default 'OUTCOME_AWARENESS',
  status text default 'ACTIVE',
  daily_budget integer,
  start_date date,
  end_date date,
  content_id uuid,
  audience_snapshot jsonb,
  creative_snapshot jsonb,
  created_at timestamptz default now()
);

create table if not exists amplify_insights (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references amplify_campaigns(id) on delete cascade,
  date date,
  spend numeric(10,2) default 0,
  reach integer default 0,
  impressions integer default 0,
  clicks integer default 0,
  cpc numeric(10,4) default 0,
  cpm numeric(10,4) default 0,
  synced_at timestamptz default now()
);
