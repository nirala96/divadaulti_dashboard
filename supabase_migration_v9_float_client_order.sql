-- Migration v9: Use float ordering for client drag-and-drop
-- Purpose: Allow midpoint-based ordering updates without reindexing all rows

ALTER TABLE clients
  ALTER COLUMN display_order TYPE DOUBLE PRECISION
  USING display_order::double precision;

-- Optional: ensure no NULLs if you want consistent ordering
-- UPDATE clients SET display_order = 0 WHERE display_order IS NULL;

-- Recreate index (optional if already exists and Postgres handles it)
DROP INDEX IF EXISTS idx_clients_display_order;
CREATE INDEX IF NOT EXISTS idx_clients_display_order ON clients(display_order);
