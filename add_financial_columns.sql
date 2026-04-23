-- Migration: Add financial tracking to designs table
-- Adds price, payment status, and payment date tracking

-- Add financial columns to designs table
ALTER TABLE designs 
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_received DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_date DATE,
ADD COLUMN IF NOT EXISTS notes_financial TEXT;

-- Create index for payment status filtering
CREATE INDEX IF NOT EXISTS idx_designs_payment_status ON designs(payment_status);

-- Update existing designs to have 'not-set' status for those with 0 price
UPDATE designs SET payment_status = 'not-set' WHERE price = 0 OR price IS NULL;

-- Verify columns
SELECT 
  column_name, 
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'designs' 
  AND column_name IN ('price', 'payment_received', 'payment_status', 'payment_date', 'notes_financial')
ORDER BY column_name;

-- Check sample data
SELECT id, title, price, payment_received, payment_status 
FROM designs 
LIMIT 5;
