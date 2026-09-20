-- Named logins for the dashboard (in addition to the existing shared
-- admin password), and an activity log recording who marked which stage
-- completed for which client/design.
CREATE TABLE IF NOT EXISTS dashboard_users (
  username TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_username TEXT NOT NULL,
  actor_display_name TEXT NOT NULL,
  stage TEXT NOT NULL,
  design_id UUID,
  design_title TEXT,
  client_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
