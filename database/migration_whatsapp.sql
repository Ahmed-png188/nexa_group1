-- WhatsApp connections: links workspace to a WhatsApp phone number
create table if not exists public.whatsapp_connections (
  id               uuid        default gen_random_uuid() primary key,
  workspace_id     uuid        not null references public.workspaces(id) on delete cascade,
  user_id          uuid        not null references public.profiles(id),
  phone_number     text        not null unique,  -- E.164 format e.g. +971501234567
  phone_number_raw text,                         -- as received from Twilio
  lang             text        default 'en',     -- 'en' | 'ar'
  is_active        boolean     default true,
  connected_at     timestamptz default now(),
  last_active_at   timestamptz default now(),
  created_at       timestamptz default now()
);

-- WhatsApp messages: full conversation log
create table if not exists public.whatsapp_messages (
  id               uuid        default gen_random_uuid() primary key,
  workspace_id     uuid        references public.workspaces(id) on delete cascade,
  phone_number     text        not null,
  direction        text        not null check (direction in ('inbound','outbound')),
  message_type     text        not null default 'text',  -- 'text'|'image'|'audio'|'video'|'document'|'button'
  body             text,
  media_url        text,
  media_type       text,
  twilio_sid       text,
  intent           text,        -- classified intent
  handled          boolean     default false,
  metadata         jsonb       default '{}',
  created_at       timestamptz default now()
);

-- WhatsApp context: rolling conversation memory per workspace
create table if not exists public.whatsapp_context (
  id               uuid        default gen_random_uuid() primary key,
  workspace_id     uuid        not null references public.workspaces(id) on delete cascade unique,
  conversation_summary text    default '',  -- rolling summary Claude updates
  pending_action   jsonb,      -- action awaiting approval { type, data, expires_at }
  brand_training_queue jsonb   default '[]', -- questions to ask this week
  last_question_at timestamptz,
  last_brief_at    timestamptz,
  last_summary_at  timestamptz,
  metadata         jsonb       default '{}',
  updated_at       timestamptz default now()
);

-- WhatsApp scheduled proactive messages
create table if not exists public.whatsapp_scheduled (
  id               uuid        default gen_random_uuid() primary key,
  workspace_id     uuid        not null references public.workspaces(id) on delete cascade,
  phone_number     text        not null,
  scheduled_for    timestamptz not null,
  message_type     text        not null,  -- 'morning_brief'|'weekly_summary'|'brand_question'|'ad_alert'|'credit_alert'
  payload          jsonb       default '{}',
  sent             boolean     default false,
  sent_at          timestamptz,
  created_at       timestamptz default now()
);

create index if not exists idx_wa_connections_phone    on public.whatsapp_connections(phone_number);
create index if not exists idx_wa_connections_ws       on public.whatsapp_connections(workspace_id);
create index if not exists idx_wa_messages_phone       on public.whatsapp_messages(phone_number);
create index if not exists idx_wa_messages_ws          on public.whatsapp_messages(workspace_id);
create index if not exists idx_wa_scheduled_due        on public.whatsapp_scheduled(scheduled_for) where sent = false;

alter table public.whatsapp_connections enable row level security;
alter table public.whatsapp_messages     enable row level security;
alter table public.whatsapp_context      enable row level security;
alter table public.whatsapp_scheduled    enable row level security;

create policy "Members access whatsapp_connections"
  on public.whatsapp_connections for all using (
    exists (select 1 from workspace_members
            where workspace_id = whatsapp_connections.workspace_id
            and user_id = auth.uid())
  );

create policy "Members access whatsapp_messages"
  on public.whatsapp_messages for all using (
    exists (select 1 from workspace_members
            where workspace_id = whatsapp_messages.workspace_id
            and user_id = auth.uid())
  );

create policy "Members access whatsapp_context"
  on public.whatsapp_context for all using (
    exists (select 1 from workspace_members
            where workspace_id = whatsapp_context.workspace_id
            and user_id = auth.uid())
  );

create policy "Members access whatsapp_scheduled"
  on public.whatsapp_scheduled for all using (
    exists (select 1 from workspace_members
            where workspace_id = whatsapp_scheduled.workspace_id
            and user_id = auth.uid())
  );
