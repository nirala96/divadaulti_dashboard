-- Railway PostgreSQL Schema
-- Run this after provisioning Railway database
-- Connect: psql "postgresql://..."
-- Execute: \i railway_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables (if re-running)
DROP TABLE IF EXISTS designs CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS work_points CASCADE;
DROP TABLE IF EXISTS workforce_settings CASCADE;

-- Clients table
CREATE TABLE clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  display_order DOUBLE PRECISION DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Designs table
CREATE TABLE designs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Sampling', 'Production')),
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'Payment Received',
  notes TEXT,
  images TEXT[],
  stage_status JSONB DEFAULT '{}'::jsonb,
  start_date DATE,
  end_date DATE,
  display_order DOUBLE PRECISION DEFAULT 0,
  is_priority BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work points table
CREATE TABLE work_points (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workforce settings table
CREATE TABLE workforce_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  daily_unit_capacity INTEGER NOT NULL DEFAULT 10
);

-- Create indexes for performance
CREATE INDEX idx_clients_display_order ON clients(display_order);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_designs_client_id ON designs(client_id);
CREATE INDEX idx_designs_status ON designs(status);
CREATE INDEX idx_designs_type ON designs(type);
CREATE INDEX idx_designs_display_order ON designs(display_order);
CREATE INDEX idx_designs_priority ON designs(is_priority);

-- Insert default workforce settings
INSERT INTO workforce_settings (daily_unit_capacity) VALUES (10);

-- Verify tables created
SELECT 
  tablename,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = t.tablename) as index_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY tablename;

-- Show table details
\dt+
