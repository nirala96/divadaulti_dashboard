-- Migration: let a completed design's thumbnail be dismissed from the main
-- dashboard's "N completed" row without affecting the Completed Orders page
-- or any other data - purely a dashboard display preference, same idea as
-- clients.hidden_from_orders.
ALTER TABLE designs ADD COLUMN IF NOT EXISTS hidden_from_dashboard BOOLEAN DEFAULT FALSE;
