-- Add tasks table to Railway PostgreSQL
-- This table is used by the Work Points page
-- Run this migration: psql "your-railway-connection-string" < add_tasks_table_railway.sql

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT CHECK (assigned_to IN ('Arun', 'Allish', 'Nirjara')),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  images TEXT[],
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_display_order ON tasks(display_order);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_tasks_updated_at();

-- Verify table created
SELECT 
  'tasks' as table_name,
  COUNT(*) as row_count
FROM tasks;

SELECT 
  'Tasks table created successfully!' as status;
