# Production Status Board - Visual Layout

## Board Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Filter: [All Designs] [Sampling Only] [Production Only]    Total: 12      │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ Sourcing │ Pattern  │ Grading  │ Cutting  │Stitching │Photoshoot│ Dispatch │
│    2     │    3     │    1     │    2     │    2     │    1     │    1     │
│▓▓        │▓▓▓       │▓         │▓▓        │▓▓        │▓         │▓         │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│          │          │          │          │          │          │          │
│ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │
│ │ IMG  │ │ │ IMG  │ │ │ IMG  │ │ │ IMG  │ │ │ IMG  │ │ │ IMG  │ │ │ IMG  │ │
│ │      │ │ │      │ │ │      │ │ │      │ │ │      │ │ │      │ │ │      │ │
│ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │
│ Client A │ Client B │ Client C │ Client A │ Client D │ Client B │ Client E │
│ Design 1 │ Design 2 │ Design 3 │ Design 4 │ Design 5 │ Design 6 │ Design 7 │
│ [S] Q:1  │ [P] Q:50 │ [S] Q:1  │ [P] Q:100│ [P] Q:25 │ [S] Q:1  │ [P] Q:75 │
│ [Move →] │ [Move →] │ [Move →] │ [Move →] │ [Move →] │ [Move →] │ ✓ Done   │
│ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │
│          │          │          │          │          │          │          │
│ ┌──────┐ │ ┌──────┐ │          │ ┌──────┐ │ ┌──────┐ │          │          │
│ │ IMG  │ │ │ IMG  │ │          │ │ IMG  │ │ │ IMG  │ │          │          │
│ │      │ │ │      │ │          │ │      │ │ │      │ │          │          │
│ └──────┘ │ └──────┘ │          │ └──────┘ │ └──────┘ │          │          │
│ Client F │ Client G │          │ Client H │ Client I │          │          │
│ Design 8 │ Design 9 │          │ Design10 │ Design11 │          │          │
│ [S] Q:1  │ [P] Q:200│          │ [S] Q:1  │ [P] Q:30 │          │          │
│ [Move →] │ [Move →] │          │ [Move →] │ [Move →] │          │          │
│ └──────┘ │ └──────┘ │          │ └──────┘ │ └──────┘ │          │          │
│          │          │          │          │          │          │          │
│          │ ┌──────┐ │          │          │          │          │          │
│          │ │ IMG  │ │          │          │          │          │          │
│          │ │      │ │          │          │          │          │          │
│          │ └──────┘ │          │          │          │          │          │
│          │ Client J │          │          │          │          │          │
│          │ Design12 │          │          │          │          │          │
│          │ [S] Q:1  │          │          │          │          │          │
│          │ [Move →] │          │          │          │          │          │
│          │ └──────┘ │          │          │          │          │          │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘

← Scroll horizontally to view all stages →
```

Legend:
- `[S]` = Sampling
- `[P]` = Production
- `Q:X` = Quantity
- `IMG` = Design image/photo
- `▓` = Progress bar indicator

## Detailed Card Structure

```
┌─────────────────────────────────────┐
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │     [Design Photo/Image]      │  │
│  │         (320x160px)           │  │
│  │                               │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  ABC Fashion Co.                    │  ← Client Name (gray, small)
│                                     │
│  Summer Collection Dress            │  ← Design Title (bold, large)
│                                     │
│  ┌─────────┐  Qty: 50              │  ← Type Badge + Quantity
│  │Sampling │                        │
│  └─────────┘                        │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Move to Next Stage        →  │ │  ← Action Button
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Stage Colors (Visual Identity)

```
Sourcing      ████████  Yellow (#FEF3C7/#F59E0B)
Pattern       ████████  Blue   (#DBEAFE/#3B82F6)
Grading       ████████  Purple (#EDE9FE/#8B5CF6)
Cutting       ████████  Orange (#FED7AA/#F97316)
Stitching     ████████  Pink   (#FCE7F3/#EC4899)
Photoshoot    ████████  Indigo (#E0E7FF/#6366F1)
Dispatch      ████████  Green  (#D1FAE5/#10B981)
```

## Filter States

### All Designs (Active)
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ All Designs │  │Sampling Only│  │Production   │
│   (Dark)    │  │  (Outline)  │  │  (Outline)  │
└─────────────┘  └─────────────┘  └─────────────┘
```

### Sampling Only (Active)
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ All Designs │  │Sampling Only│  │Production   │
│  (Outline)  │  │   (Dark)    │  │  (Outline)  │
└─────────────┘  └─────────────┘  └─────────────┘
```

### Production Only (Active)
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ All Designs │  │Sampling Only│  │Production   │
│  (Outline)  │  │  (Outline)  │  │   (Dark)    │
└─────────────┘  └─────────────┘  └─────────────┘
```

## Responsive Behavior

### Desktop (1920px+)
```
All 7 columns visible side-by-side
Cards: 320px wide
Horizontal scroll only if needed
```

### Tablet (768px - 1919px)
```
3-4 columns visible at once
Smooth horizontal scroll
Touch-friendly swipe
```

### Mobile (< 768px)
```
1-2 columns visible
Full-width horizontal swipe
Optimized card size
```

## Empty State

When a stage has no designs:

```
┌──────────────────────┐
│      Pattern         │
│         0            │
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
├──────────────────────┤
│                      │
│                      │
│   📦                 │
│                      │
│  No designs in       │
│  this stage          │
│                      │
│                      │
└──────────────────────┘
```

## Loading State

When data is fetching:

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│         Loading designs...          │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

## User Interactions

### 1. Move Design Forward
```
User clicks "Move to Next Stage" on Design in Sourcing
  ↓
Card animates out of Sourcing column
  ↓
Database updates: status = 'Pattern'
  ↓
Card appears in Pattern column
  ↓
Counts update: Sourcing (2→1), Pattern (3→4)
  ↓
Progress bars recalculate
```

### 2. Filter Designs
```
User clicks "Sampling Only"
  ↓
Button style changes to active
  ↓
Board re-fetches with filter
  ↓
Only Sampling designs visible
  ↓
Total count updates
```

### 3. Scroll Stages
```
Desktop: Click/drag horizontal scrollbar
Tablet: Swipe left/right
Mobile: Swipe gesture
```

## Accessibility Features

- **Keyboard Navigation**: Tab through cards and buttons
- **Screen Readers**: Semantic HTML with labels
- **Color Contrast**: WCAG AA compliant
- **Focus Indicators**: Visible focus states
- **Alt Text**: Images have descriptive alt attributes

## Performance Optimization

1. **Image Lazy Loading**: Off-screen images load on demand
2. **Virtual Scrolling**: Only render visible cards (future)
3. **Debounced Updates**: Batch rapid changes
4. **Optimistic UI**: Update immediately, confirm later
5. **Indexed Queries**: Fast database lookups
