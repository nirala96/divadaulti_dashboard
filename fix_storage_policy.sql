-- Fix Storage Bucket Policies for design-images
-- This allows anyone to upload, view, and manage files in the design-images bucket

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for design-images bucket (if any)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete images" ON storage.objects;

-- Create policy to allow anyone to INSERT (upload) files
CREATE POLICY "Anyone can upload images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'design-images');

-- Create policy to allow anyone to SELECT (view) files
CREATE POLICY "Anyone can view images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'design-images');

-- Create policy to allow anyone to DELETE files
CREATE POLICY "Anyone can delete images"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'design-images');

-- Create policy to allow anyone to UPDATE files
CREATE POLICY "Anyone can update images"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'design-images')
WITH CHECK (bucket_id = 'design-images');
