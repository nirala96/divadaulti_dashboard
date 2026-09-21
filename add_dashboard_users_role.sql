-- Role-based access: merchandiser logins are restricted to a handful of
-- pages (Dashboard, Today's Plan, Daily Check-In, Timeline, Work Points);
-- sales and admin logins keep full access, same as the shared owner
-- password.
ALTER TABLE dashboard_users
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'merchandiser';
