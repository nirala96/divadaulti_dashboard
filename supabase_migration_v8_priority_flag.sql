-- Migration v8: Add priority flag for designs
-- Simple priority system - priority designs appear at the top

-- Add is_priority column
ALTER TABLE designs ADD COLUMN IF NOT EXISTS is_priority BOOLEAN DEFAULT FALSE;

-- Create index for faster priority filtering
CREATE INDEX IF NOT EXISTS idx_designs_priority ON designs(is_priority);

-- Verify
SELECT 
  column_name, 
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'designs' AND column_name = 'is_priority';
