-- Migration: Add is_on_hold field to clients table
-- This allows marking clients as unresponsive/on hold

-- Add is_on_hold column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_on_hold BOOLEAN DEFAULT FALSE;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_clients_on_hold ON clients(is_on_hold);

-- Optional: Add a timestamp to track when client was put on hold
ALTER TABLE clients ADD COLUMN IF NOT EXISTS hold_date TIMESTAMPTZ;

COMMENT ON COLUMN clients.is_on_hold IS 'True if client is unresponsive and on hold';
COMMENT ON COLUMN clients.hold_date IS 'Timestamp when client was placed on hold';
