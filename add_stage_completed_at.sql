-- Migration: record when each stage was finished (completed or marked not
-- needed), alongside stage_started_at. Used to tell how long a design has
-- been waiting at its next stage (the red "!" stage-delay markers).
-- Backfilled from the history we already have: the Activity Log (every
-- stage completion since 21 Sep 2026) and stage work logs (Pattern, Cutting
-- and Stitching since Jul 2026), for stages that are currently finished.
BEGIN;

ALTER TABLE designs ADD COLUMN IF NOT EXISTS stage_completed_at JSONB NOT NULL DEFAULT '{}'::jsonb;

WITH finished AS (
  SELECT design_id, stage, MAX(ts) AS ts
  FROM (
    SELECT design_id, stage, created_at AS ts
    FROM activity_log
    WHERE design_id IS NOT NULL AND stage NOT IN ('DELETED', 'DISPATCHED', 'RESTORED')
    UNION ALL
    SELECT design_id, stage, completed_at
    FROM stage_work_logs
    WHERE design_id IS NOT NULL
  ) history
  GROUP BY design_id, stage
),
per_design AS (
  SELECT f.design_id, jsonb_object_agg(f.stage, to_jsonb(f.ts)) AS times
  FROM finished f
  JOIN designs d ON d.id = f.design_id
  WHERE d.stage_status ->> f.stage IN ('completed', 'not-needed')
  GROUP BY f.design_id
)
UPDATE designs d
SET stage_completed_at = per_design.times || d.stage_completed_at
FROM per_design
WHERE d.id = per_design.design_id;

COMMIT;
