-- ── Brand Type Migration ─────────────────────────────────────────────────────
-- Replaces the generic segment picker with 6 product-brand categories.
-- We keep writing to the existing `segment` column for compatibility,
-- but also add a typed `brand_type` column for future use.

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS brand_type text
  CHECK (brand_type IN (
    'physical_product',
    'digital_product',
    'food_beverage',
    'fashion_lifestyle',
    'beauty_wellness',
    'home_living'
  ));

-- Migrate existing segment values to brand_type
UPDATE public.workspaces
  SET brand_type = CASE
    WHEN segment IN ('physical_product','digital_product','food_beverage','fashion_lifestyle','beauty_wellness','home_living')
      THEN segment
    WHEN segment = 'creator'    THEN 'digital_product'
    WHEN segment = 'freelancer' THEN 'digital_product'
    WHEN segment = 'agency'     THEN 'physical_product'
    ELSE 'physical_product'
  END
  WHERE brand_type IS NULL;

-- Sync the segment column for existing rows that already have new values
-- (segment column is kept as the primary source for now)
