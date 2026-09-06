-- Migration: Per-department capacity settings powering the capacity-based
-- Timeline scheduler (backlog, "finishing today", day-by-day forecast,
-- efficiency). Where the real-world number is a range, the default is the
-- midpoint - all of these are meant to be tuned from the Timeline tab
-- itself, not treated as permanent.
ALTER TABLE workforce_settings
ADD COLUMN IF NOT EXISTS pattern_per_day NUMERIC NOT NULL DEFAULT 2,
ADD COLUMN IF NOT EXISTS cutting_sample_per_day NUMERIC NOT NULL DEFAULT 12.5,
ADD COLUMN IF NOT EXISTS cutting_production_per_day NUMERIC NOT NULL DEFAULT 75,
ADD COLUMN IF NOT EXISTS stitching_sample_per_day NUMERIC NOT NULL DEFAULT 12.5,
ADD COLUMN IF NOT EXISTS stitching_production_per_day NUMERIC NOT NULL DEFAULT 24,
ADD COLUMN IF NOT EXISTS embroidery_sampling_per_day NUMERIC NOT NULL DEFAULT 2,
ADD COLUMN IF NOT EXISTS fabric_finalize_days NUMERIC NOT NULL DEFAULT 2.5,
ADD COLUMN IF NOT EXISTS dye_days NUMERIC NOT NULL DEFAULT 3,
ADD COLUMN IF NOT EXISTS embroidery_production_days NUMERIC NOT NULL DEFAULT 7,
ADD COLUMN IF NOT EXISTS print_days NUMERIC NOT NULL DEFAULT 18;
