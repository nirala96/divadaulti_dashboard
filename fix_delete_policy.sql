-- Fix delete policies for designs table
-- Run this in Supabase SQL Editor if delete is failing

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Allow public delete" ON designs;

-- Create new delete policy
CREATE POLICY "Allow public delete" ON designs
  FOR DELETE
  USING (true);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'designs';
