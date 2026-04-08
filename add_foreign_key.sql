-- Add foreign key constraint to designs table
-- This enables Supabase to do JOINs between designs and clients
-- Run this in Supabase SQL Editor

-- Add the foreign key constraint
ALTER TABLE designs 
  ADD CONSTRAINT designs_client_id_fkey 
  FOREIGN KEY (client_id) 
  REFERENCES clients(id) 
  ON DELETE CASCADE;

-- Refresh Supabase schema cache
NOTIFY pgrst, 'reload schema';
