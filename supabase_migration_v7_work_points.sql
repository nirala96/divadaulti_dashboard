-- Migration v7: Work Points / Task Management
-- Create table for tasks with employee assignments and priority ordering

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT CHECK (assigned_to IN ('Arun', 'Allish', 'Nirjara')),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize display_order for any existing tasks (in case table already exists)
WITH numbered_tasks AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1 as new_order
  FROM tasks
  WHERE display_order IS NULL
)
UPDATE tasks t
SET display_order = nt.new_order
FROM numbered_tasks nt
WHERE t.id = nt.id;

-- Create index for faster ordering queries
CREATE INDEX IF NOT EXISTS idx_tasks_display_order ON tasks(display_order);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);

-- Create updated_at trigger
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

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now - adjust based on your auth setup)
CREATE POLICY "Enable all operations for tasks" ON tasks
  FOR ALL USING (true) WITH CHECK (true);

-- Verify
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks'
ORDER BY ordinal_position;
