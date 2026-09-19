-- Tracks whether a merchandiser has talked to a client today. Only the last
-- tick's timestamp is stored - a client counts as "checked" only if that
-- timestamp falls on today's IST calendar date, so it resets automatically
-- every midnight without needing a scheduled job.
CREATE TABLE IF NOT EXISTS client_checkins (
  client_id UUID PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
  checked_at TIMESTAMPTZ
);
