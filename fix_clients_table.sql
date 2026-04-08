-- Fix the clients table to allow nullable emails
-- Run this BEFORE importing CSV data

-- Drop existing clients table (this will clear any data)
DROP TABLE IF EXISTS clients CASCADE;

-- Recreate with flexible schema
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  display_order DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_clients_display_order ON clients(display_order);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access" ON clients FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON clients FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON clients FOR DELETE USING (true);

-- Add comment
COMMENT ON COLUMN clients.display_order IS 'Custom sort order for client groups. Lower numbers appear first.';
