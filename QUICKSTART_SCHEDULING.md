# Quick Start - Automated Scheduling

## Database Update Required! ⚠️

Before running the app, update your Supabase database:

### 1. Add New Columns

Run this in your Supabase SQL Editor:

```sql
-- Add start_date and end_date to designs table
ALTER TABLE designs 
ADD COLUMN start_date DATE,
ADD COLUMN end_date DATE;

-- Create index for better performance
CREATE INDEX idx_designs_dates ON designs(start_date, end_date);
```

### 2. Verify Workforce Settings

```sql
-- Check if you have workforce settings
SELECT * FROM workforce_settings;

-- If empty, insert default capacity (50 units/day)
INSERT INTO workforce_settings (daily_unit_capacity) 
VALUES (50)
ON CONFLICT DO NOTHING;
```

## How to Use

### Creating a New Design

1. Go to `/orders` (Add Design page)
2. Fill in the form as usual
3. **NEW**: See the blue "Automated Schedule" preview box
   - Shows calculated start date
   - Shows calculated end date
   - Shows total duration in days
4. Submit the form
5. Success message will show the scheduled timeline

### Viewing Timeline

1. Go to `/` (Dashboard - Production Status Board)
2. Look at any design card
3. **NEW**: See start and end dates at the bottom of each card
4. Dates show when production is scheduled to begin and complete

## Calculation Examples

### Example 1: First Production Order
```
Input: 200 units Production
Capacity: 50 units/day
Queue: Empty

Result:
  Duration: 28 days (200÷50=4 days × 7 stages)
  Start: Today
  End: 28 days from today
```

### Example 2: With Queue
```
Input: 100 units Production
Capacity: 50 units/day
Queue: Previous order ends March 20

Result:
  Duration: 14 days (100÷50=2 days × 7 stages)
  Start: March 21 (day after previous)
  End: April 3
```

### Example 3: Sampling Order
```
Input: 1 unit Sampling
Estimated Days: Total 10 days manually entered
Queue: Empty

Result:
  Duration: 10 days (from manual entry)
  Start: Today
  End: 10 days from today
```

## Settings

### Adjusting Workforce Capacity

Run in Supabase SQL Editor:

```sql
-- Change to 100 units per day
UPDATE workforce_settings 
SET daily_unit_capacity = 100;

-- Or 25 units per day
UPDATE workforce_settings 
SET daily_unit_capacity = 25;
```

Changes take effect immediately for new designs.

## Features

✅ **Automatic Calculation**: No manual date entry needed  
✅ **FIFO Queue**: Fair scheduling - first in, first out  
✅ **Real-time Preview**: See timeline before submitting  
✅ **Visual Display**: Dates shown on design cards  
✅ **Configurable**: Adjust capacity anytime  

## Troubleshooting

**Problem: Timeline not showing**
- Check database columns were added
- Verify workforce_settings has a row
- Check browser console for errors

**Problem: Dates seem wrong**
- Verify daily_unit_capacity is correct
- Check if previous orders have end_dates set
- Review estimated_days inputs

**Problem: All designs start today**
- This is normal if no previous orders exist
- Or if previous orders don't have end_dates
- Can backfill old orders (see MIGRATION_SCHEDULING.md)

## Documentation

- [SCHEDULING_SUMMARY.md](SCHEDULING_SUMMARY.md) - Complete overview
- [MIGRATION_SCHEDULING.md](MIGRATION_SCHEDULING.md) - Detailed migration guide
- [lib/timeline.ts](lib/timeline.ts) - Source code

## That's It!

The system now automatically:
1. ✅ Calculates production timelines
2. ✅ Schedules orders in FIFO queue
3. ✅ Respects workforce capacity
4. ✅ Shows dates in UI
5. ✅ Stores timeline in database

**Ready to use immediately after database update!**
