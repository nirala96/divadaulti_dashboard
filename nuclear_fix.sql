-- ============================================
-- NUCLEAR OPTION - Allow everything on design-images
-- ============================================
-- This creates the most permissive policies possible
-- ============================================

-- Step 1: Drop ALL policies on storage.objects
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON storage.objects';
    END LOOP;
END $$;

-- Step 2: Create super permissive policies that apply to ALL roles
-- (anon, authenticated, service_role, postgres, etc.)

CREATE POLICY "Allow all SELECT on design-images"
  ON storage.objects
  FOR SELECT
  USING ( bucket_id = 'design-images' );

CREATE POLICY "Allow all INSERT on design-images"
  ON storage.objects
  FOR INSERT
  WITH CHECK ( bucket_id = 'design-images' );

CREATE POLICY "Allow all UPDATE on design-images"
  ON storage.objects
  FOR UPDATE
  USING ( bucket_id = 'design-images' );

CREATE POLICY "Allow all DELETE on design-images"
  ON storage.objects
  FOR DELETE
  USING ( bucket_id = 'design-images' );

-- Verify
SELECT 
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;
