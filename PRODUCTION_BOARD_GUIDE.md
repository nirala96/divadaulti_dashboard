# Production Status Board - Feature Guide

## Overview

The Production Status Board is a Kanban-style interface that provides a visual workflow for tracking designs through the entire production pipeline. Located on the **Dashboard** (`/`), it gives you a bird's-eye view of all active designs and their current stage.

## Features

### 1. 7-Stage Workflow Pipeline

Designs move through these stages from left to right:

```
Sourcing → Pattern → Grading → Cutting → Stitching → Photoshoot → Dispatch
```

Each stage is represented as a vertical column with:
- **Stage name** at the top
- **Count badge** showing number of designs
- **Progress bar** indicating percentage of total designs
- **Design cards** stacked vertically

### 2. Design Cards

Each card displays comprehensive design information:

```
┌─────────────────────────┐
│  [Design Image/Icon]    │
│─────────────────────────│
│  Client Name            │
│  Design Title           │
│  [Sampling] Qty: 1      │
│  [Move to Next Stage →] │
└─────────────────────────┘
```

**Card Elements:**
- **Image**: Primary design image from uploads (or placeholder icon)
- **Client Name**: Displays the associated client
- **Design Title**: The design's name/title
- **Type Badge**: Visual indicator for "Sampling" or "Production"
- **Quantity**: Number of units
- **Move Button**: Advances design to next stage (hidden on Dispatch)

### 3. Filtering System

Three filter options at the top:
- **All Designs**: Shows every design regardless of type
- **Sampling Only**: Shows only sampling orders (Qty = 1)
- **Production Only**: Shows only production runs

Total count updates dynamically based on active filter.

### 4. Real-time Status Updates

When you click "Move to Next Stage":
1. Card immediately moves to the next column
2. Database updates in Supabase
3. Stage counts refresh
4. Progress bars recalculate

## Color Coding

Each stage has a unique color scheme for quick visual identification:

| Stage       | Color  |
|-------------|--------|
| Sourcing    | Yellow |
| Pattern     | Blue   |
| Grading     | Purple |
| Cutting     | Orange |
| Stitching   | Pink   |
| Photoshoot  | Indigo |
| Dispatch    | Green  |

## Usage Workflow

### Typical User Journey:

1. **View Dashboard**: Navigate to `/` to see the board
2. **Filter if needed**: Click filter buttons to focus on specific design types
3. **Review stages**: Scroll horizontally to see all production stages
4. **Track progress**: Check which designs are where
5. **Move designs**: Click "Move to Next Stage" when work is completed
6. **Monitor completion**: Designs in "Dispatch" are marked as completed

### Example Scenario:

```
Designer creates new design → Starts in "Sourcing"
  ↓
Fabric sourced → Click "Move to Next Stage" → Now in "Pattern"
  ↓
Pattern created → Click "Move to Next Stage" → Now in "Grading"
  ↓
... continues through all stages ...
  ↓
Design dispatched → Marked as "✓ Completed" in Dispatch column
```

## Technical Details

### Data Fetching

The board performs a JOIN query to get design and client data:

```typescript
const { data } = await supabase
  .from('designs')
  .select('*, clients(name)')
  .order('created_at', { ascending: false })
```

This ensures each card can display the client name without additional queries.

### Status Update

Status changes are atomic and immediate:

```typescript
await supabase
  .from('designs')
  .update({ status: nextStatus })
  .eq('id', designId)
```

### Image Loading

- Primary image (first in array) displays on card
- Uses Next.js Image component for optimization
- Fallback to package icon if no images
- Images load from Supabase Storage public URLs

## Responsive Design

- **Desktop**: Full horizontal scroll with all columns visible
- **Tablet**: Horizontal scroll optimized for touch
- **Mobile**: Swipe to navigate between stages
- **Max height**: Scrollable card areas prevent page overflow

## Keyboard & Accessibility

- Semantic HTML structure
- Color contrast meets WCAG standards
- Keyboard navigable buttons
- Screen reader friendly labels

## Performance Considerations

1. **Lazy Loading**: Only images in viewport load initially
2. **Optimistic Updates**: UI updates before server confirms
3. **Minimal Re-renders**: React state optimized for performance
4. **Index Usage**: Database queries use indexed fields

## Common Use Cases

### Case 1: Daily Standup
Use the board to quickly review:
- What's in progress (count per stage)
- What's ready to move forward
- Where bottlenecks exist

### Case 2: Client Update
Filter by client (future feature) or:
- Manually scan for client name
- Track specific design progress
- Share visual status update

### Case 3: Capacity Planning
- See distribution across stages
- Identify overloaded stages
- Balance workload accordingly

## Future Enhancements

Planned features for the Production Status Board:

1. **Drag & Drop**: Drag cards between stages
2. **Bulk Actions**: Move multiple designs at once
3. **Stage History**: View when design entered each stage
4. **Time Tracking**: Auto-calculate days in each stage
5. **Notifications**: Alert when design moves
6. **Client Filter**: Filter by specific client
7. **Search**: Find designs by title/client
8. **Comments**: Add notes to design cards
9. **Assignments**: Assign team members to stages
10. **Real-time Sync**: Live updates when others make changes

## Troubleshooting

**Images not loading?**
- Check Supabase Storage bucket is public
- Verify image URLs are valid
- Check Next.js image domain whitelist

**Cards not moving?**
- Check Supabase connection
- Verify table permissions (RLS)
- Check browser console for errors

**Filter not working?**
- Ensure designs have correct `type` field
- Check data exists in database
- Verify filter state is updating

## Related Documentation

- [Database Schema](SCHEMA.md) - Table structure
- [Add Design Form](README.md#add-design-form) - Creating designs
- [Supabase Setup](README.md#set-up-supabase) - Configuration
