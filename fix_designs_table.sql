-- Fix the designs table to match CSV import structure
-- Run this in Supabase SQL Editor

-- Drop existing designs table
DROP TABLE IF EXISTS designs CASCADE;

-- Recreate with flexible schema (all fields optional except id)
CREATE TABLE designs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID,
  title TEXT,
  type TEXT,
  quantity INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Payment Received',
  images TEXT[],
  estimated_days JSONB,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  stage_status JSONB DEFAULT '{}',
  display_order INTEGER,
  is_priority BOOLEAN DEFAULT FALSE
);

-- Create indexes
CREATE INDEX idx_designs_client_id ON designs(client_id);
CREATE INDEX idx_designs_status ON designs(status);
CREATE INDEX idx_designs_type ON designs(type);
CREATE INDEX idx_designs_display_order ON designs(display_order);
CREATE INDEX idx_designs_priority ON designs(is_priority);

-- Enable RLS
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access" ON designs FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON designs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON designs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON designs FOR DELETE USING (true);

-- Add comments
COMMENT ON COLUMN designs.stage_status IS 'JSON object tracking status of each stage: vacant, in-progress, or completed';
COMMENT ON COLUMN designs.display_order IS 'Custom sort order for drag-and-drop priority. Lower numbers appear first.';
