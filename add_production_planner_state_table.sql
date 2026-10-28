-- Migration: shared, server-persisted Production Stitching planner. A single
-- row (id = 1) holds the team and all orders as JSONB, so the board survives
-- a refresh and everyone sees the same schedule. The API route also creates
-- this table on first use, so running this by hand is optional.
CREATE TABLE IF NOT EXISTS production_planner_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT production_planner_state_singleton CHECK (id = 1)
);
