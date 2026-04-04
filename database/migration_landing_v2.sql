-- ═══════════════════════════════════════════════
-- WORKSPACE PRODUCTS
-- Products are real entities, not config blobs
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.workspace_products (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL
    REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- Core product data
  name            text NOT NULL,
  short_desc      text,
  full_desc       text,
  price           text,
  price_value     numeric,
  currency        text DEFAULT 'USD',
  badge           text,
  featured        boolean DEFAULT false,
  active          boolean DEFAULT true,

  -- Media
  images          jsonb DEFAULT '[]',
    -- array of { url: string, alt: string, order: number }

  -- Variants
  variants        jsonb DEFAULT '[]',
    -- [{name: "Size", options: ["S","M","L"]}]

  -- Customer action
  action_type     text DEFAULT 'lead_form'
    CHECK (action_type IN
      ('whatsapp','stripe','external','lead_form')),
  action_value    text,
  whatsapp_number text,
  whatsapp_message text,

  -- Ordering
  sort_order      integer DEFAULT 0,

  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_workspace
  ON public.workspace_products(workspace_id);
CREATE INDEX IF NOT EXISTS idx_products_active
  ON public.workspace_products(workspace_id, active);

ALTER TABLE public.workspace_products
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members manage products"
  ON public.workspace_products FOR ALL
  USING (EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = workspace_products.workspace_id
    AND user_id = auth.uid()
  ));

-- Public can read products for published pages
CREATE POLICY "Public reads products for published pages"
  ON public.workspace_products FOR SELECT
  USING (active = true);

-- ═══════════════════════════════════════════════
-- LANDING PAGES
-- One per workspace (for now)
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.landing_pages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL
    REFERENCES public.workspaces(id) ON DELETE CASCADE,

  slug            text NOT NULL UNIQUE,

  -- Visual DNA
  design_system   text NOT NULL DEFAULT 'editorial'
    CHECK (design_system IN (
      'editorial','minimal','bold','warm'
    )),

  -- The complete page config (JSON)
  -- Does NOT contain product data — references product_ids
  config          jsonb NOT NULL DEFAULT '{}',

  -- Conversation history for the AI
  conversation    jsonb DEFAULT '[]',

  -- Status
  status          text DEFAULT 'draft'
    CHECK (status IN ('draft','published','archived')),

  -- Custom domain
  custom_domain         text UNIQUE,
  domain_status         text DEFAULT 'none'
    CHECK (domain_status IN (
      'none','pending','verifying','verified','failed'
    )),
  domain_verified_at    timestamptz,
  domain_vercel_id      text,

  -- SEO
  meta_title      text,
  meta_description text,

  -- Analytics
  views           integer DEFAULT 0,
  leads_count     integer DEFAULT 0,

  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  published_at    timestamptz
);

CREATE INDEX IF NOT EXISTS idx_lp_workspace
  ON public.landing_pages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_lp_slug
  ON public.landing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_lp_domain
  ON public.landing_pages(custom_domain)
  WHERE custom_domain IS NOT NULL;

ALTER TABLE public.landing_pages
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members manage landing pages"
  ON public.landing_pages FOR ALL
  USING (EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = landing_pages.workspace_id
    AND user_id = auth.uid()
  ));

CREATE POLICY "Public reads published pages"
  ON public.landing_pages FOR SELECT
  USING (status = 'published');

-- ═══════════════════════════════════════════════
-- DOMAIN VERIFICATIONS
-- Tracks pending Vercel domain verification polls
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.domain_verifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id uuid NOT NULL
    REFERENCES public.landing_pages(id) ON DELETE CASCADE,
  workspace_id    uuid NOT NULL,
  domain          text NOT NULL,
  vercel_domain_id text,
  cname_value     text,
  attempts        integer DEFAULT 0,
  last_attempted  timestamptz,
  verified        boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.domain_verifications
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members manage domain verifications"
  ON public.domain_verifications FOR ALL
  USING (EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = domain_verifications.workspace_id
    AND user_id = auth.uid()
  ));

-- ═══════════════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════════════

CREATE OR REPLACE FUNCTION increment_page_views(page_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.landing_pages
  SET views = views + 1
  WHERE id = page_id;
$$;

GRANT EXECUTE ON FUNCTION increment_page_views TO anon;
GRANT EXECUTE ON FUNCTION increment_page_views TO authenticated;

CREATE OR REPLACE FUNCTION increment_page_leads(page_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.landing_pages
  SET leads_count = leads_count + 1
  WHERE id = page_id;
$$;

GRANT EXECUTE ON FUNCTION increment_page_leads TO anon;
GRANT EXECUTE ON FUNCTION increment_page_leads TO authenticated;

-- ═══════════════════════════════════════════════
-- STORAGE
-- Public bucket for product images and page assets
-- ═══════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES ('landing-assets', 'landing-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read landing assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'landing-assets');

CREATE POLICY "Authenticated upload landing assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'landing-assets'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated update landing assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'landing-assets'
    AND auth.role() = 'authenticated'
  );
