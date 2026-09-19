-- The employee roster for Work Points moved to the workpoint_employees
-- table (managed from the UI), but this leftover CHECK constraint still
-- restricted assigned_to to the original hardcoded names (Arun, Allish,
-- Nirjara) - silently blocking task assignment to any employee added
-- since. The roster table is now the source of truth, so drop it.
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assigned_to_check;
