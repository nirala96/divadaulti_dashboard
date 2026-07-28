-- Migration: Add "Finishing" as the final production stage
-- New stage order: Fabric Finalize -> Trims Sourcing -> Dye -> Print -> Pattern
--                  -> Embroidery -> Cutting -> Stitching -> Finishing
--
-- Designs already dispatched (status = 'Dispatch') are, by definition, fully
-- through every stage including Finishing, so backfill them as 'completed'
-- rather than 'vacant' - otherwise the Completed Orders page's
-- all-stages-completed check would filter them out.
UPDATE designs
SET stage_status = jsonb_set(stage_status, '{Finishing}', '"completed"')
WHERE status = 'Dispatch'
  AND stage_status IS NOT NULL
  AND NOT stage_status ? 'Finishing';

-- Active (non-dispatched) designs don't need a migration: the app already
-- treats a missing stage_status key as 'vacant' by default.
