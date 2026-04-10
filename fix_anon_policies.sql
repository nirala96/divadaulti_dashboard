-- ============================================
-- ULTIMATE FIX - Storage Policies for Anon Key
-- ============================================
-- This removes ALL policies and creates new ones
-- that specifically work with your anon API key
-- ============================================

-- Step 1: Drop ALL existing policies
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'objects') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON storage.objects';
    END LOOP;
END $$;

-- Step 2: Create policies that work with ANON role (your public API key)
-- Allow anon users to SELECT (view/download)
CREATE POLICY "Anon users can read design images"
  ON storage.objects
  FOR SELECT
  TO anon
  USING ( bucket_id = 'design-images' );

-- Allow anon users to INSERT (upload)
CREATE POLICY "Anon users can upload design images"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK ( bucket_id = 'design-images' );

-- Allow anon users to UPDATE (modify)
CREATE POLICY "Anon users can update design images"
  ON storage.objects
  FOR UPDATE
  TO anon
  USING ( bucket_id = 'design-images' )
  WITH CHECK ( bucket_id = 'design-images' );

-- Allow anon users to DELETE (remove)
CREATE POLICY "Anon users can delete design images"
  ON storage.objects
  FOR DELETE
  TO anon
  USING ( bucket_id = 'design-images' );

-- Verify the policies
SELECT 
  'Policy: ' || policyname as policy,
  'Roles: ' || array_to_string(roles, ', ') as allowed_roles,
  'Command: ' || cmd as operation
FROM pg_policies
WHERE tablename = 'objects'
ORDER BY policyname;
