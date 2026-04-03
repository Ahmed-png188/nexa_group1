-- !! RUN THIS IN SUPABASE SQL EDITOR BEFORE USING LANDING PAGE BUILDER !!
-- ── Landing Page Migration v2 ─────────────────────────────────────────────────
-- Drops previous version and creates with design_system, conversation, published_at
-- Run in: Supabase → SQL Editor → New Query → Run

DROP TABLE IF EXISTS public.landing_pages CASCADE;

CREATE TABLE public.landing_pages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     uuid NOT NULL
    REFERENCES public.workspaces(id) ON DELETE CASCADE,
  slug             text NOT NULL UNIQUE,
  design_system    text NOT NULL DEFAULT 'editorial'
    CHECK (design_system IN (
      'editorial','minimal_architect',
      'bold_expressionist','warm_storyteller'
    )),
  status           text DEFAULT 'draft'
    CHECK (status IN ('draft','published','archived')),
  config           jsonb NOT NULL DEFAULT '{}',
  conversation     jsonb DEFAULT '[]',
  meta_title       text,
  meta_description text,
  views            integer DEFAULT 0,
  leads_count      integer DEFAULT 0,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  published_at     timestamptz
);

CREATE INDEX IF NOT EXISTS idx_lp_workspace
  ON public.landing_pages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_lp_slug
  ON public.landing_pages(slug);

ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members access own pages"
  ON public.landing_pages FOR ALL
  USING (EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = landing_pages.workspace_id
    AND user_id = auth.uid()
  ));

CREATE POLICY "Public reads published pages"
  ON public.landing_pages FOR SELECT
  USING (status = 'published');

CREATE OR REPLACE FUNCTION increment_page_views(page_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.landing_pages
  SET views = views + 1 WHERE id = page_id;
$$;

GRANT EXECUTE ON FUNCTION increment_page_views TO anon;
GRANT EXECUTE ON FUNCTION increment_page_views TO authenticated;
