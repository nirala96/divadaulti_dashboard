-- =====================================================
-- STORAGE BUCKET SETUP FOR DESIGN IMAGES
-- =====================================================
-- IMPORTANT: Run this in Supabase SQL Editor
-- Go to: Dashboard → SQL Editor → New Query → Paste & Run
-- =====================================================

-- Step 1: Create the storage bucket
-- Note: If this fails, create the bucket manually via Storage UI
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'design-images',
  'design-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

-- Step 2: Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;

-- Step 3: Create policies for PUBLIC access (works with anon key)
-- Allow anyone to read/view images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'design-images' );

-- Allow anyone to upload images (works with your anon key)
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'design-images' );

-- Allow anyone to update images
CREATE POLICY "Public Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'design-images' );

-- Allow anyone to delete images
CREATE POLICY "Public Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'design-images' );

-- Verify setup
SELECT 
  'Bucket created: ' || name as status,
  'Public: ' || public::text as access,
  'Size limit: ' || (file_size_limit / 1024 / 1024)::text || 'MB' as size_limit
FROM storage.buckets 
WHERE id = 'design-images';
