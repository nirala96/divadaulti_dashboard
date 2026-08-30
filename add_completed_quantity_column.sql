-- Migration: Track how many of a design's total pieces are completed so far
-- (distinct from the stage-based vacant/in-progress/completed status, which
-- is all-or-nothing per stage). Lets the floor record partial progress on
-- a large production run, e.g. 200 of 500 pieces done.
ALTER TABLE designs
ADD COLUMN IF NOT EXISTS completed_quantity INTEGER NOT NULL DEFAULT 0;
