-- Migration v7b: Add images column to existing tasks table
-- This adds image upload capability for tasks

-- Add images column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='tasks' AND column_name='images'
  ) THEN
    ALTER TABLE tasks ADD COLUMN images TEXT[];
  END IF;
END $$;

-- Verify
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks' AND column_name = 'images';
