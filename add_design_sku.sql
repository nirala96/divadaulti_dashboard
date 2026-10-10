-- Migration: a unique, permanent SKU for every design (SKU1001, SKU1002, ...).
-- New designs get the next number automatically from a sequence (so two
-- people adding designs at once can never get the same SKU). Existing
-- designs are numbered in the order they were created. Numbers are never
-- reused, even if a design is deleted.
BEGIN;

CREATE SEQUENCE IF NOT EXISTS design_sku_seq START 1001;

ALTER TABLE designs ADD COLUMN IF NOT EXISTS sku TEXT;

WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) AS rn
  FROM designs
  WHERE sku IS NULL
)
UPDATE designs d
SET sku = 'SKU' || (
  COALESCE((SELECT MAX(substring(sku FROM 4)::int) FROM designs WHERE sku ~ '^SKU[0-9]+$'), 1000) + ordered.rn
)
FROM ordered
WHERE d.id = ordered.id;

SELECT setval('design_sku_seq', GREATEST(1000, (SELECT COALESCE(MAX(substring(sku FROM 4)::int), 1000) FROM designs WHERE sku ~ '^SKU[0-9]+$')));

ALTER TABLE designs ALTER COLUMN sku SET DEFAULT 'SKU' || nextval('design_sku_seq');
ALTER TABLE designs ALTER COLUMN sku SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'designs_sku_unique') THEN
    ALTER TABLE designs ADD CONSTRAINT designs_sku_unique UNIQUE (sku);
  END IF;
END $$;

COMMIT;
