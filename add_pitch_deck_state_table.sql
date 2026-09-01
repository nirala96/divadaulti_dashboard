-- Migration: shared, server-persisted copy of the Sales Pitch Deck Q&A
-- script. A single row (id = 1) holds the whole document as JSONB, so
-- every sales rep edits the same live copy instead of a per-browser one.
CREATE TABLE IF NOT EXISTS pitch_deck_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT pitch_deck_state_singleton CHECK (id = 1)
);
