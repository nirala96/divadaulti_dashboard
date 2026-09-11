-- The new "Consultation" stage gates every other stage: nothing can start
-- until it's marked complete. Existing designs already went through
-- requirement gathering informally before this stage existed, so mark it
-- completed for them - only new designs going forward start in
-- Consultation and need it explicitly cleared.
UPDATE designs
SET stage_status = stage_status || '{"Consultation": "completed"}'::jsonb
WHERE NOT (stage_status ? 'Consultation');
