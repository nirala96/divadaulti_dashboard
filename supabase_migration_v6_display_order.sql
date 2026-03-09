-- Migration: Add display_order field for drag-and-drop priority
-- Purpose: Allow users to manually reorder designs and clients with persistent ordering

-- Add display_order column to designs table
ALTER TABLE designs 
ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Initialize display_order based on creation date (oldest = smallest number)
-- This ensures existing designs maintain their chronological order
UPDATE designs 
SET display_order = (
  SELECT ROW_NUMBER() OVER (ORDER BY created_at ASC)
  FROM designs d2 
  WHERE d2.id = designs.id
)
WHERE display_order IS NULL;

-- Add display_order column to clients table for client-level ordering
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Initialize client display_order based on earliest design creation
UPDATE clients 
SET display_order = (
  SELECT ROW_NUMBER() OVER (ORDER BY MIN(d.created_at) ASC)
  FROM designs d
  WHERE d.client_id = clients.id
  GROUP BY d.client_id
)
WHERE display_order IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_designs_display_order ON designs(display_order);
CREATE INDEX IF NOT EXISTS idx_clients_display_order ON clients(display_order);

-- Comments
COMMENT ON COLUMN designs.display_order IS 'Custom sort order for drag-and-drop priority. Lower numbers appear first.';
COMMENT ON COLUMN clients.display_order IS 'Custom sort order for client groups. Lower numbers appear first.';
