-- Migration: Update Schema for New Workflow
-- Run this in Supabase SQL Editor

-- 1. Drop existing policies and constraints
DROP POLICY IF EXISTS "Allow public read access" ON designs;
DROP POLICY IF EXISTS "Allow public insert" ON designs;
DROP POLICY IF EXISTS "Allow public update" ON designs;
DROP POLICY IF EXISTS "Allow public delete" ON designs;

-- 2. Drop old constraint first
ALTER TABLE designs DROP CONSTRAINT IF EXISTS designs_status_check;

-- 3. Update existing rows to map old statuses to new statuses
UPDATE designs SET status = 'Payment Received' WHERE status = 'Sourcing';
-- Keep Pattern, Grading, Cutting, Stitching as they are (they exist in both)
-- Map old Photoshoot and Dispatch to new locations
-- (these already exist in new schema, so no update needed)

-- 4. Add new status check constraint with updated workflow
ALTER TABLE designs ADD CONSTRAINT designs_status_check 
CHECK (status IN ('Payment Received', 'Pattern', 'Grading', 'Cutting', 'Stitching', 'Kaaj', 'Embroidery', 'Wash', 'Finishing', 'Photoshoot', 'Final Settlement', 'Dispatch'));

-- 5. Update default status to 'Payment Received'
ALTER TABLE designs ALTER COLUMN status SET DEFAULT 'Payment Received';

-- 6. Recreate RLS policies
CREATE POLICY "Allow public read access" ON designs FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON designs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON designs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON designs FOR DELETE USING (true);

-- 7. Simplify clients table (make email and contact_person optional)
ALTER TABLE clients ALTER COLUMN email DROP NOT NULL;
ALTER TABLE clients ALTER COLUMN contact_person DROP NOT NULL;
