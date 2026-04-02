-- ── Landing Pages Migration ──────────────────────────────────────────────────
-- Creates the landing_pages table and increment_page_views RPC

CREATE TABLE IF NOT EXISTS public.landing_pages (
  id           uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  title        text NOT NULL DEFAULT 'My Landing Page',
  slug         text UNIQUE NOT NULL,
  config       jsonb NOT NULL DEFAULT '{}',
  status       text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  views        integer NOT NULL DEFAULT 0,
  leads_count  integer NOT NULL DEFAULT 0,
  created_at   timestamptz DEFAULT now() NOT NULL,
  updated_at   timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_landing_pages_slug      ON public.landing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_landing_pages_workspace ON public.landing_pages(workspace_id);

ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

-- Published pages are publicly readable (no auth required)
CREATE POLICY "lp_public_read"
  ON public.landing_pages FOR SELECT
  USING (status = 'published');

-- Workspace members can read all their pages (including drafts)
CREATE POLICY "lp_member_read"
  ON public.landing_pages FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

-- Workspace members can insert, update, delete
CREATE POLICY "lp_member_insert"
  ON public.landing_pages FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "lp_member_update"
  ON public.landing_pages FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "lp_member_delete"
  ON public.landing_pages FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

-- RPC: atomic page view increment (called from server on each public page load)
CREATE OR REPLACE FUNCTION public.increment_page_views(page_id uuid)
RETURNS void AS $$
  UPDATE public.landing_pages
  SET views = views + 1, updated_at = now()
  WHERE id = page_id AND status = 'published';
$$ LANGUAGE sql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.increment_page_views TO anon;
GRANT EXECUTE ON FUNCTION public.increment_page_views TO authenticated;
