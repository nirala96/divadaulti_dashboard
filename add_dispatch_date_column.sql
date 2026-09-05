-- Migration: Let staff manually mark the date an order should ship from
-- our end, separate from end_date (which is only an auto-calculated
-- production estimate). Powers the internal Dispatch Schedule board.
ALTER TABLE designs
ADD COLUMN IF NOT EXISTS dispatch_date DATE;
