-- Migration 001: Additions for segmentation, lead pages, Kit sync, and brief caching

-- workspaces: user segment (creator / freelancer / business / agency)
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS segment TEXT CHECK (segment IN ('creator', 'freelancer', 'business', 'agency'));

-- workspaces: morning brief server-side cache
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS weekly_brief JSONB;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS brief_generated_at TIMESTAMPTZ;

-- workspaces: lead page slug (URL identifier, unique)
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS workspaces_slug_idx ON workspaces (slug) WHERE slug IS NOT NULL;

-- workspaces: Kit/ConvertKit API key
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS kit_api_key TEXT;

-- workspaces: lead page configuration
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS lead_page_custom_question TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS lead_page_auto_enroll BOOLEAN DEFAULT FALSE;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS lead_page_sequence_id TEXT;

-- contacts: notes field for Typeform answers and lead page custom answers
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS notes TEXT;

-- contacts: source field (if not already present)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source TEXT;

-- contacts: ensure tags column exists as text array
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
