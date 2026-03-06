-- Migration v5: Add new stages (Fabric Finalize, Dye, Print) and reorder stages
-- Run this in Supabase SQL Editor

-- Step 1: Drop existing constraint
ALTER TABLE designs DROP CONSTRAINT IF EXISTS designs_status_check;

-- Step 2: Update existing data (if any) - map old statuses to new workflow
-- No changes needed as we're adding new stages, old ones remain valid

-- Step 3: Add new constraint with updated 15 stages
ALTER TABLE designs ADD CONSTRAINT designs_status_check 
  CHECK (status IN (
    'Payment Received',
    'Fabric Finalize',
    'Pattern',
    'Grading',
    'Cutting',
    'Stitching',
    'Dye',
    'Print',
    'Embroidery',
    'Wash',
    'Kaaj',
    'Finishing',
    'Photoshoot',
    'Final Settlement',
    'Dispatch'
  ));

-- Step 4: Update default status (remains as Payment Received)
ALTER TABLE designs ALTER COLUMN status SET DEFAULT 'Payment Received';

-- Step 5: Recreate RLS policies (if they were dropped)
-- Enable RLS if not already enabled
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Anyone can view designs" ON designs;
DROP POLICY IF EXISTS "Anyone can insert designs" ON designs;
DROP POLICY IF EXISTS "Anyone can update designs" ON designs;
DROP POLICY IF EXISTS "Anyone can delete designs" ON designs;

-- Recreate policies
CREATE POLICY "Anyone can view designs" ON designs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert designs" ON designs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update designs" ON designs FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete designs" ON designs FOR DELETE USING (true);

-- Note: stage_status JSONB field will automatically accept the new stages
-- No migration needed for existing records as new stages will default to 'vacant'

COMMENT ON COLUMN designs.status IS 'Current primary status of the design (15 stages total)';
COMMENT ON COLUMN designs.stage_status IS 'JSONB tracking individual stage states: vacant, not-needed, in-progress, completed';
