-- Migration V3: Add notes field and make quantity optional
-- This adds a notes field for storing custom information about each design

-- Add notes column to designs table
ALTER TABLE designs 
ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- Make quantity nullable and set default to 1
ALTER TABLE designs 
ALTER COLUMN quantity SET DEFAULT 1;

-- Update existing designs to have empty notes if null
UPDATE designs 
SET notes = '' 
WHERE notes IS NULL;

-- Add comment
COMMENT ON COLUMN designs.notes IS 'Custom notes for design: status updates, sizes, client instructions, meeting notes, etc.';
