-- Merchandiser roster, moved from a hardcoded list to a DB-backed table so
-- it can be managed (add/remove) from the app instead of a code change.
CREATE TABLE IF NOT EXISTS merchandisers (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed with the roster that was previously hardcoded in lib/merchandisers.ts.
INSERT INTO merchandisers (name, display_order)
VALUES ('Anjali', 0), ('Ritu', 1), ('Allish', 2), ('Nisha', 3)
ON CONFLICT (name) DO NOTHING;
