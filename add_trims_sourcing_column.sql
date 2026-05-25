-- Migration: Add "Trims Sourcing" stage to all existing designs
-- This adds the new stage between "Fabric Finalize" and "Pattern"

UPDATE designs
SET stage_status = jsonb_set(
  stage_status,
  '{"Trims Sourcing"}',
  '"vacant"'
)
WHERE stage_status IS NOT NULL
  AND NOT stage_status ? 'Trims Sourcing';

-- Optional: Set to 'completed' for designs that have already completed Fabric Finalize
-- Uncomment the following if you want to mark it as completed for designs past this stage:
-- UPDATE designs
-- SET stage_status = jsonb_set(
--   stage_status,
--   '{"Trims Sourcing"}',
--   '"completed"'
-- )
-- WHERE stage_status->>'Fabric Finalize' = 'completed'
--   AND (stage_status ? 'Trims Sourcing') = false;
