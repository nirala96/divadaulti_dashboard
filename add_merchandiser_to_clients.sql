-- Migration: Add merchandiser field to clients table
-- Lets each client be tagged with the merchandiser handling them, for
-- filtering and planning (e.g. "show me all of Anjali's clients").

ALTER TABLE clients ADD COLUMN IF NOT EXISTS merchandiser TEXT;

CREATE INDEX IF NOT EXISTS idx_clients_merchandiser ON clients(merchandiser);

COMMENT ON COLUMN clients.merchandiser IS 'Name of the merchandiser tagged to this client, for filtering/planning';
