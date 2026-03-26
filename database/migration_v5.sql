-- Packaging designs table
create table if not exists public.packaging_designs (
  id              uuid    default gen_random_uuid() primary key,
  workspace_id    uuid    not null references public.workspaces(id) on delete cascade,
  product_id      uuid    references public.products(id) on delete set null,
  name            text    not null default 'Untitled packaging',
  packaging_type  text    not null,  -- bag | box | label | pouch | sleeve
  size_preset     text,              -- small_bag | medium_box | etc
  dimensions      jsonb   not null,  -- { width_mm, height_mm, depth_mm, bleed_mm }
  design_data     jsonb   default '{}',  -- { bg_color, text_color, logo_url, elements[] }
  preview_url     text,              -- generated preview image URL
  pdf_url         text,              -- generated PDF URL
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists idx_packaging_workspace on public.packaging_designs(workspace_id);
alter table public.packaging_designs enable row level security;
create policy "Members can manage packaging"
  on public.packaging_designs for all using (
    exists (select 1 from workspace_members where workspace_id = packaging_designs.workspace_id and user_id = auth.uid())
  );
