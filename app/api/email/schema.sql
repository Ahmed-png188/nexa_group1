create table if not exists email_accounts (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces(id) on delete cascade,
  provider text not null, -- 'gmail' | 'outlook'
  email text not null,
  name text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists contacts (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces(id) on delete cascade,
  email text not null,
  name text,
  first_name text,
  last_name text,
  company text,
  tags text[] default '{}',
  source text default 'manual', -- 'csv' | 'hubspot' | 'manual' | 'gmail'
  status text default 'active', -- 'active' | 'unsubscribed' | 'bounced'
  notes text,
  created_at timestamptz default now(),
  unique(workspace_id, email)
);

create table if not exists email_sequences (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  status text default 'draft', -- 'draft' | 'active' | 'paused'
  trigger_type text default 'manual', -- 'manual' | 'tag' | 'date'
  trigger_value text,
  created_at timestamptz default now()
);

create table if not exists sequence_steps (
  id uuid default gen_random_uuid() primary key,
  sequence_id uuid references email_sequences(id) on delete cascade,
  step_number integer not null,
  delay_days integer default 0,
  delay_hours integer default 0,
  subject text not null,
  body text not null,
  created_at timestamptz default now()
);

create table if not exists sequence_enrollments (
  id uuid default gen_random_uuid() primary key,
  sequence_id uuid references email_sequences(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  current_step integer default 1,
  status text default 'active', -- 'active' | 'completed' | 'stopped'
  enrolled_at timestamptz default now(),
  next_send_at timestamptz,
  unique(sequence_id, contact_id)
);

create table if not exists emails_sent (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces(id) on delete cascade,
  contact_id uuid references contacts(id),
  sequence_id uuid references email_sequences(id),
  sequence_step_id uuid references sequence_steps(id),
  from_email text not null,
  to_email text not null,
  subject text not null,
  body text not null,
  thread_id text, -- Gmail thread ID for reply tracking
  message_id text, -- Gmail message ID
  status text default 'sent', -- 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced'
  opened_count integer default 0,
  clicked_count integer default 0,
  opened_at timestamptz,
  replied_at timestamptz,
  sent_at timestamptz default now()
);

create table if not exists email_replies (
  id uuid default gen_random_uuid() primary key,
  sent_email_id uuid references emails_sent(id) on delete cascade,
  from_email text not null,
  subject text,
  body text not null,
  gmail_message_id text,
  received_at timestamptz default now(),
  read_at timestamptz
);

-- RLS
alter table email_accounts enable row level security;
alter table contacts enable row level security;
alter table email_sequences enable row level security;
alter table sequence_steps enable row level security;
alter table sequence_enrollments enable row level security;
alter table emails_sent enable row level security;
alter table email_replies enable row level security;

-- Service role policies
create policy "service_role_email_accounts" on email_accounts for all using (auth.role() = 'service_role');
create policy "service_role_contacts" on contacts for all using (auth.role() = 'service_role');
create policy "service_role_sequences" on email_sequences for all using (auth.role() = 'service_role');
create policy "service_role_steps" on sequence_steps for all using (auth.role() = 'service_role');
create policy "service_role_enrollments" on sequence_enrollments for all using (auth.role() = 'service_role');
create policy "service_role_sent" on emails_sent for all using (auth.role() = 'service_role');
create policy "service_role_replies" on email_replies for all using (auth.role() = 'service_role');

-- User policies
create policy "users_email_accounts" on email_accounts for all using (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()));
create policy "users_contacts" on contacts for all using (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()));
create policy "users_sequences" on email_sequences for all using (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()));
create policy "users_sent" on emails_sent for all using (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()));
