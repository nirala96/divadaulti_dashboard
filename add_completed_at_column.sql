-- Migration: Record the real moment an order finishes (all stages done,
-- status moved to Dispatch), distinct from end_date which is only the
-- estimated/calculated timeline date set at order creation. Lets us report
-- orders/pieces completed per month instead of guessing from the estimate.
ALTER TABLE designs
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
