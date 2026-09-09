-- Add a nullable client tag column for internal segmentation
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS tag TEXT;
