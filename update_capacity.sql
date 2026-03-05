-- Update workforce capacity to 9 samples per day
UPDATE workforce_settings SET daily_unit_capacity = 9 WHERE id = 1;

-- Verify the update
SELECT * FROM workforce_settings;
