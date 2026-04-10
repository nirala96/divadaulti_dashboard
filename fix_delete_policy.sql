-- IMPORTANT: Make sure you're in the RIGHT Supabase project!
-- URL should be: https://tgwrwwxbygygvbucqxwg.supabase.co
-- 
-- Run this in Supabase SQL Editor to fix delete permissions

-- First, check if the table exists and see current policies
SELECT 
  tablename,
  schemaname,
  (SELECT count(*) FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name = 'designs') as table_exists
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'designs'
LIMIT 1;

-- Show current policies on designs table
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'designs';

-- Drop and recreate the delete policy
DROP POLICY IF EXISTS "Allow public delete" ON designs;

CREATE POLICY "Allow public delete" ON designs
  FOR DELETE
  USING (true);

-- Verify it worked
SELECT policyname, cmd 
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'designs' AND cmd = 'DELETE';
