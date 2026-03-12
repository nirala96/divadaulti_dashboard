-- Recalculate timelines for existing designs based on 9/day parallel capacity
-- Multiple designs (up to 9) can START on the same day and work in parallel

-- Step 1: Assign queue positions and calculate start dates based on capacity
WITH ordered_designs AS (
  SELECT 
    id,
    title,
    type,
    quantity,
    display_order,
    created_at,
    -- Calculate duration for each design (how long it takes from start to finish)
    CASE 
      WHEN type = 'Sampling' THEN 14
      WHEN type = 'Production' THEN CEILING(quantity::numeric / 9) * 15
      ELSE 14
    END as duration_days,
    -- Queue position (0-based: first design is position 0)
    (ROW_NUMBER() OVER (ORDER BY COALESCE(display_order, 999999), created_at) - 1) as queue_position
  FROM designs
),
timeline_calc AS (
  SELECT 
    id,
    title,
    type,
    quantity,
    duration_days,
    queue_position,
    -- Parallel capacity scheduling: 9 designs can start on the same day
    -- Day 0: positions 0-8 start
    -- Day 1: positions 9-17 start  
    -- Day 2: positions 18-26 start
    -- Formula: FLOOR(queue_position / 9) = days to wait
    CURRENT_DATE + FLOOR(queue_position / 9) as calculated_start,
    -- End date is start + duration - 1 (start day counts)
    CURRENT_DATE + FLOOR(queue_position / 9) + duration_days - 1 as calculated_end
  FROM ordered_designs
)

-- Step 2: Update the designs table with calculated dates
UPDATE designs d
SET 
  start_date = tc.calculated_start,
  end_date = tc.calculated_end
FROM timeline_calc tc
WHERE d.id = tc.id;

-- Verify the queue with capacity grouping
SELECT 
  queue_position,
  FLOOR(queue_position / 9) as start_day,
  COUNT(*) as designs_on_same_day,
  STRING_AGG(title, ', ' ORDER BY queue_position) as designs
FROM (
  SELECT 
    (ROW_NUMBER() OVER (ORDER BY start_date, created_at) - 1) as queue_position,
    title,
    start_date
  FROM designs
) subq
GROUP BY queue_position, start_day
ORDER BY queue_position
LIMIT 30;

-- Show detailed timeline
SELECT 
  (ROW_NUMBER() OVER (ORDER BY start_date, created_at) - 1) as queue_position,
  FLOOR((ROW_NUMBER() OVER (ORDER BY start_date, created_at) - 1) / 9) as batch_day,
  title,
  type,
  quantity,
  start_date,
  end_date,
  (end_date - start_date + 1) as total_days
FROM designs
ORDER BY start_date, created_at;
