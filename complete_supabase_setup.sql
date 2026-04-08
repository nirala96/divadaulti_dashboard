-- ============================================
-- Diva Daulti Order Management System
-- Complete Database Setup for NEW Supabase Project
-- ============================================
-- Run this ENTIRE file in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- Create clients table
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  display_order DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create designs table
CREATE TABLE designs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Sampling', 'Production')),
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'Payment Received',
  images TEXT[] DEFAULT '{}',
  stage_status JSONB DEFAULT '{}',
  estimated_days JSONB,
  start_date DATE,
  end_date DATE,
  display_order INTEGER,
  is_priority BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tasks table (work points)
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT CHECK (assigned_to IN ('Arun', 'Allish', 'Nirjara')),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  images TEXT[],
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create workforce_settings table
CREATE TABLE workforce_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  daily_unit_capacity INTEGER NOT NULL DEFAULT 10
);

-- ============================================
-- 2. INSERT DEFAULT DATA
-- ============================================

INSERT INTO workforce_settings (daily_unit_capacity) VALUES (10);

-- ============================================
-- 3. CREATE INDEXES
-- ============================================

-- Clients indexes
CREATE INDEX idx_clients_display_order ON clients(display_order);

-- Designs indexes
CREATE INDEX idx_designs_client_id ON designs(client_id);
CREATE INDEX idx_designs_status ON designs(status);
CREATE INDEX idx_designs_type ON designs(type);
CREATE INDEX idx_designs_display_order ON designs(display_order);
CREATE INDEX idx_designs_priority ON designs(is_priority);

-- Tasks indexes
CREATE INDEX idx_tasks_display_order ON tasks(display_order);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_completed ON tasks(completed);

-- ============================================
-- 4. CREATE TRIGGERS
-- ============================================

-- Auto-update updated_at for tasks
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_tasks_updated_at();

-- ============================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE workforce_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. CREATE SECURITY POLICIES
-- ============================================

-- Clients policies
CREATE POLICY "Allow public read access" ON clients FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON clients FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON clients FOR DELETE USING (true);

-- Designs policies
CREATE POLICY "Allow public read access" ON designs FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON designs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON designs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON designs FOR DELETE USING (true);

-- Tasks policies
CREATE POLICY "Enable all operations for tasks" ON tasks
  FOR ALL USING (true) WITH CHECK (true);

-- Workforce settings policies
CREATE POLICY "Allow public read access" ON workforce_settings FOR SELECT USING (true);
CREATE POLICY "Allow public update" ON workforce_settings FOR UPDATE USING (true);

-- ============================================
-- 7. ADD COLUMN COMMENTS
-- ============================================

COMMENT ON COLUMN designs.stage_status IS 'JSON object tracking status of each stage: vacant, in-progress, or completed';
COMMENT ON COLUMN designs.display_order IS 'Custom sort order for drag-and-drop priority. Lower numbers appear first.';
COMMENT ON COLUMN clients.display_order IS 'Custom sort order for client groups. Lower numbers appear first.';

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Next steps:
-- 1. Import your CSV data for clients
-- 2. Import your CSV data for designs
-- 3. Import your CSV data for tasks (if any)
-- ============================================
