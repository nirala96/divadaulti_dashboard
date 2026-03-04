-- Diva Daulti Order Management - Complete Database Setup
-- Copy and paste this entire file into Supabase SQL Editor

-- Create clients table
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create designs table
CREATE TABLE designs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Sampling', 'Production')),
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'Sourcing' CHECK (status IN ('Sourcing', 'Pattern', 'Grading', 'Cutting', 'Stitching', 'Photoshoot', 'Dispatch')),
  images TEXT[] DEFAULT '{}',
  estimated_days JSONB,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create workforce_settings table
CREATE TABLE workforce_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  daily_unit_capacity INTEGER NOT NULL DEFAULT 10
);

-- Insert default workforce settings
INSERT INTO workforce_settings (daily_unit_capacity) VALUES (10);

-- Create indexes for better performance
CREATE INDEX idx_designs_client_id ON designs(client_id);
CREATE INDEX idx_designs_status ON designs(status);
CREATE INDEX idx_designs_type ON designs(type);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workforce_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON clients FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON designs FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON workforce_settings FOR SELECT USING (true);

-- Allow public insert/update
CREATE POLICY "Allow public insert" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON designs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON designs FOR UPDATE USING (true);
CREATE POLICY "Allow public update" ON workforce_settings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON designs FOR DELETE USING (true);
