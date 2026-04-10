-- ============================================
-- FIX STORAGE POLICIES - Run this in SQL Editor
-- ============================================

-- First, completely remove all existing policies on storage.objects
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete" ON storage.objects;

-- Create new simple policies that allow EVERYTHING for design-images bucket
-- These will work with your anon key

-- Allow SELECT (viewing/downloading)
CREATE POLICY "Allow public read access"
  ON storage.objects
  FOR SELECT
  TO public
  USING ( bucket_id = 'design-images' );

-- Allow INSERT (uploading)
CREATE POLICY "Allow public upload"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK ( bucket_id = 'design-images' );

-- Allow UPDATE (modifying)
CREATE POLICY "Allow public update"
  ON storage.objects
  FOR UPDATE
  TO public
  USING ( bucket_id = 'design-images' )
  WITH CHECK ( bucket_id = 'design-images' );

-- Allow DELETE (removing)
CREATE POLICY "Allow public delete"
  ON storage.objects
  FOR DELETE
  TO public
  USING ( bucket_id = 'design-images' );

-- Verify policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%public%';
