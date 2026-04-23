-- Migration: Add price tracking to clients table
-- Simple client-level pricing

-- Add price column to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0;

-- Verify column
SELECT 
  column_name, 
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'clients' 
  AND column_name = 'price'
ORDER BY column_name;

-- Check sample data
SELECT id, name, price 
FROM clients 
LIMIT 5;
