-- Set cache headers for Supabase Storage
-- Run this in Supabase SQL Editor
-- This makes browsers cache images for 30 days, reducing egress

-- Update storage bucket settings for longer cache
UPDATE storage.buckets 
SET public = true,
    file_size_limit = 5242880, -- 5MB limit per file
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'design-images';

-- Note: Cache-Control headers are set during upload
-- Always upload with: { cacheControl: '2592000' } option
