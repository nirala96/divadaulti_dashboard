# Database Migration Guide - Automated Scheduling

## Overview

This migration adds automated scheduling functionality based on workforce capacity. The system now calculates start and end dates for each design order using a FIFO (First-In, First-Out) queue system.

## Changes Made

### 1. Database Schema Updates

**New Columns Added to `designs` table:**
- `start_date` (DATE) - Calculated start date for the design
- `end_date` (DATE) - Calculated end date for the design

### 2. Scheduling Logic

**Automated Timeline Calculation:**
- Fetches `daily_unit_capacity` from `workforce_settings` table
- Calculates duration based on:
  - **Sampling**: Sum of estimated days per process (default: 7 days)
  - **Production**: (Quantity ÷ Daily Capacity) × Number of Stages
- Implements FIFO queue: New orders start when previous orders end

### 3. Implementation Details

**Formula for Production Orders:**
```
Duration per Stage = Quantity ÷ Daily Unit Capacity
Total Duration = Sum of all stage durations (or estimated days if provided)
Start Date = Previous Order's End Date + 1 day (or Today if no queue)
End Date = Start Date + Total Duration - 1
```

**Example:**
```
Workforce Capacity: 50 units/day
New Production Order: 200 units

If using automatic calculation:
  Duration per stage = 200 ÷ 50 = 4 days
  Total duration = 4 days × 7 stages = 28 days

If using estimated days (manual):
  Total duration = Sum of all estimated days entered in form
```

## Migration Steps

### Step 1: Update Database Schema

Run this SQL in your Supabase SQL Editor:

```sql
-- Add new columns to designs table
ALTER TABLE designs 
ADD COLUMN start_date DATE,
ADD COLUMN end_date DATE;

-- Add comment for documentation
COMMENT ON COLUMN designs.start_date IS 'Calculated start date based on FIFO queue';
COMMENT ON COLUMN designs.end_date IS 'Calculated end date based on duration';

-- Optional: Create index for better query performance
CREATE INDEX idx_designs_dates ON designs(start_date, end_date);
```

### Step 2: Verify Workforce Settings

Ensure you have workforce capacity configured:

```sql
-- Check existing settings
SELECT * FROM workforce_settings;

-- If no settings exist, insert default
INSERT INTO workforce_settings (daily_unit_capacity) 
VALUES (50)
ON CONFLICT DO NOTHING;

-- Update capacity if needed
UPDATE workforce_settings 
SET daily_unit_capacity = 50 
WHERE id = (SELECT id FROM workforce_settings LIMIT 1);
```

### Step 3: (Optional) Backfill Existing Designs

If you have existing designs without dates, you can backfill them:

```sql
-- This is a simple backfill - adjust based on your needs
-- It sets dates starting from today with 2-week intervals

WITH numbered_designs AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) - 1 as row_num
  FROM designs
  WHERE start_date IS NULL
)
UPDATE designs d
SET 
  start_date = CURRENT_DATE + (nd.row_num * 14),
  end_date = CURRENT_DATE + (nd.row_num * 14) + 13
FROM numbered_designs nd
WHERE d.id = nd.id;
```

**⚠️ Warning:** Review the backfill query carefully before running. You may want to adjust the logic based on your actual design types and quantities.

### Step 4: Verify Migration

Check that everything is working:

```sql
-- Verify new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'designs' 
AND column_name IN ('start_date', 'end_date');

-- Check sample data
SELECT id, title, type, quantity, start_date, end_date
FROM designs
ORDER BY start_date
LIMIT 10;
```

## How It Works

### Adding a New Design

1. **User fills the Add Design form** with:
   - Client selection
   - Design title
   - Type (Sampling/Production)
   - Quantity
   - Estimated days per process (optional)

2. **System calculates timeline automatically:**
   ```typescript
   const timeline = await calculateTimeline(
     quantity,
     type,
     estimated_days
   )
   ```

3. **Timeline calculation process:**
   - Fetches workforce `daily_unit_capacity` from settings
   - Calculates total duration:
     - Uses estimated_days if provided
     - Otherwise calculates: (quantity ÷ capacity) per stage
   - Queries for latest `end_date` in existing designs
   - Sets `start_date` = latest `end_date` + 1 (or today if no queue)
   - Sets `end_date` = start_date + duration

4. **User sees preview** of calculated timeline before submission

5. **Design is saved** with calculated dates to database

### Viewing Timeline

- **Add Design Form**: Shows real-time preview of calculated schedule
- **Production Status Board**: Displays start/end dates on each design card
- **Timeline calculations update** as you change quantity or estimated days

## Configuration

### Adjusting Workforce Capacity

Update the daily unit capacity in Supabase:

```sql
UPDATE workforce_settings 
SET daily_unit_capacity = 100 
WHERE id = (SELECT id FROM workforce_settings LIMIT 1);
```

Or create a settings page in the application (future enhancement).

### Default Duration Values

Currently set in `lib/timeline.ts`:
- **Sampling fallback**: 7 days (1 per stage)
- **Production fallback**: 30 days

You can adjust these in the `calculateTimeline` function.

## Troubleshooting

### Issue: Dates not calculating

**Solution:**
1. Check that `workforce_settings` table has data
2. Verify `daily_unit_capacity` is > 0
3. Check browser console for errors
4. Ensure Supabase connection is working

### Issue: Queue not respecting FIFO

**Solution:**
1. Check query for latest `end_date`:
   ```sql
   SELECT end_date FROM designs 
   ORDER BY end_date DESC NULLS LAST 
   LIMIT 1;
   ```
2. Verify `start_date` and `end_date` are being saved
3. Check for NULL dates in existing records

### Issue: Duration seems incorrect

**Solution:**
1. Verify `estimated_days` values in form
2. Check `daily_unit_capacity` setting
3. Review calculation logic in `lib/timeline.ts`
4. For Production: (quantity ÷ capacity) × 7 stages

## Testing

### Test Case 1: First Design (No Queue)

1. Add a new Sampling design
2. Expected: Starts today or tomorrow
3. Duration: ~7 days

### Test Case 2: Second Design (Queue Exists)

1. Add Design A (100 units Production, capacity 50)
   - Expected duration: ~28 days
2. Add Design B (50 units Production)
   - Expected: Starts day after Design A ends
   - Check: `start_date` = Design A's `end_date` + 1

### Test Case 3: Custom Estimated Days

1. Add design with estimated days: 2,2,2,2,2,2,2 (14 total)
2. Expected duration: 14 days
3. Verify timeline preview shows correct dates

## Rollback

If you need to rollback this migration:

```sql
-- Remove the new columns
ALTER TABLE designs 
DROP COLUMN start_date,
DROP COLUMN end_date;

-- Drop the index if created
DROP INDEX IF EXISTS idx_designs_dates;
```

**Note:** This will permanently delete all calculated timeline data.

## Future Enhancements

Potential improvements to the scheduling system:

1. **Buffer Days**: Add configurable buffer between orders
2. **Stage-Specific Capacity**: Different capacity for each stage
3. **Working Days Only**: Skip weekends/holidays
4. **Manual Override**: Allow manual date adjustment
5. **Capacity Warnings**: Alert when overbooked
6. **Timeline Visualization**: Gantt chart view
7. **Historical Tracking**: Track actual vs. estimated dates
8. **Multi-Resource Scheduling**: Account for different resources
9. **Priority Queue**: Priority-based scheduling (not just FIFO)
10. **Real-time Adjustments**: Auto-adjust when orders complete early/late

## Support

If you encounter issues:

1. Check [SCHEMA.md](SCHEMA.md) for database structure
2. Review [lib/timeline.ts](lib/timeline.ts) for calculation logic
3. Inspect browser console for client-side errors
4. Check Supabase logs for database errors
5. Verify environment variables are set correctly

## Summary

✅ Database schema updated with `start_date` and `end_date`  
✅ Automatic timeline calculation implemented  
✅ FIFO queue logic working  
✅ Visual preview in Add Design form  
✅ Timeline display on Production Status Board  
✅ Workforce capacity integration complete  

The scheduling system is now fully operational!
