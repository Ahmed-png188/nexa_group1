-- Products table
create table if not exists public.products (
  id                uuid    default gen_random_uuid() primary key,
  workspace_id      uuid    not null references public.workspaces(id) on delete cascade,
  name              text    not null default 'Untitled product',
  type              text    default 'general',
  original_photos   text[]  default '{}',
  cleaned_image_url text,
  created_at        timestamptz default now()
);

-- Product assets table
create table if not exists public.product_assets (
  id           uuid    default gen_random_uuid() primary key,
  product_id   uuid    not null references public.products(id) on delete cascade,
  workspace_id uuid    not null,
  asset_type   text    not null,
  url          text    not null,
  prompt       text,
  credits_used integer default 0,
  metadata     jsonb   default '{}',
  created_at   timestamptz default now()
);

create index if not exists idx_products_workspace     on public.products(workspace_id);
create index if not exists idx_product_assets_product on public.product_assets(product_id);

alter table public.products       enable row level security;
alter table public.product_assets enable row level security;

-- RLS policies: workspace members can manage their products
create policy "workspace members manage products"
  on public.products
  using (workspace_id in (
    select workspace_id from public.workspace_members where user_id = auth.uid()
  ));

create policy "workspace members manage product assets"
  on public.product_assets
  using (workspace_id in (
    select workspace_id from public.workspace_members where user_id = auth.uid()
  ));
