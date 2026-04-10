# Divadaulti Production Management System - Product Requirements Document (PRD)

**Version:** 2.0  
**Last Updated:** April 10, 2026  
**Document Owner:** Development Team  
**Status:** Active Production System

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [User Personas](#3-user-personas)
4. [Core Features](#4-core-features)
5. [Database Schema](#5-database-schema)
6. [User Workflows](#6-user-workflows)
7. [Technical Architecture](#7-technical-architecture)
8. [UI/UX Specifications](#8-uiux-specifications)
9. [Firebase Migration Plan](#9-firebase-migration-plan)

---

## 1. Executive Summary

### 1.1 Purpose
Divadaulti is a comprehensive production management system designed for fashion/textile manufacturing businesses to track orders from initial payment through final dispatch across 15 distinct production stages.

### 1.2 Key Metrics
- **Current Data**: 59 clients, 168 active designs, 61 task items
- **Production Stages**: 15 sequential workflow steps
- **Design Types**: Sampling (fixed quantity: 1) and Production (variable quantity)
- **User Actions**: 200+ daily status updates, 50+ new designs per month

### 1.3 Core Value Proposition
- **Centralized Visibility**: Single dashboard showing all client orders and their progress
- **Real-time Tracking**: Live status updates across all production stages
- **Client Organization**: Hierarchical view grouping designs by client
- **Drag-and-Drop Workflow**: Intuitive visual priority management
- **Image Documentation**: Multi-image support for each design
- **Timeline Management**: Automatic scheduling based on workforce capacity

---

## 2. Product Overview

### 2.1 Problem Statement
Fashion production businesses struggle with:
- **Scattered Information**: Orders tracked in spreadsheets, notebooks, WhatsApp
- **Lost Context**: No clear view of which client needs what and when
- **Status Confusion**: Unclear production progress leads to delayed deliveries
- **Priority Chaos**: No systematic way to sequence orders
- **Image Loss**: Design references get lost across devices

### 2.2 Solution
A web-based production dashboard that provides:
- **Unified View**: All orders in one CRM-style interface
- **Visual Progress**: Color-coded stage indicators for each design
- **Client Grouping**: Collapsible sections per client
- **Priority Control**: Drag-and-drop ordering of clients and designs
- **Image Gallery**: Multiple images per design with preview
- **Notes System**: Rich text documentation per design

### 2.3 Success Criteria
- ✅ 100% of designs visible on one screen (scroll-based navigation)
- ✅ < 2 seconds to update any stage status
- ✅ Zero data loss during image uploads
- ✅ Mobile-responsive for on-floor usage
- ✅ Support for 200+ concurrent designs

---

## 3. User Personas

### 3.1 Primary User: Production Manager
- **Name**: Rajesh Kumar
- **Role**: Oversees entire production floor
- **Goals**: 
  - Track all orders at a glance
  - Prioritize urgent clients
  - Update stage progress as work completes
  - Communicate design details to workers
- **Pain Points**:
  - Forgets which client is waiting longest
  - Can't quickly find a specific design
  - Needs to show clients their order status

### 3.2 Secondary User: Design Team
- **Name**: Priya Sharma
- **Role**: Creates and uploads design mockups
- **Goals**:
  - Upload multiple design angles/variations
  - Add notes about fabric/measurements
  - Mark designs as priority for rush orders
- **Pain Points**:
  - Images don't upload or get lost
  - No easy way to annotate designs
  - Can't see which designs need attention

### 3.3 Tertiary User: Client Service
- **Name**: Amit Patel
- **Role**: Handles client communications
- **Goals**:
  - Quickly check order status for client calls
  - Show timeline estimates to clients
  - Add new orders for existing clients
- **Pain Points**:
  - Can't access system from mobile
  - Takes too long to find a specific order
  - No way to leave client-specific notes

---

## 4. Core Features

### 4.1 Production Status Board (Main Dashboard)

#### 4.1.1 Overview
- **Purpose**: Primary interface showing all active designs grouped by client
- **Layout**: Vertical scrolling table with 15 horizontal stage columns
- **View**: CRM-style expandable client rows

#### 4.1.2 Components

**A. Client Header Row**
```
[▼ Icon] [Client Name] [X products] [+ Add Design]
```

**Features**:
- Click-to-expand/collapse
- Shows total design count
- Draggable for priority reordering
- Quick-add design button

**B. Design Row (when client expanded)**
```
[Image Thumbnail] [+ Icon] [Design Title] [Type Badge] [Notes Icon] | [Stage 1] [Stage 2] ... [Stage 15] | [Timeline] [Actions]
```

**Features**:
- **Image Thumbnail** (48x48px): First image or placeholder icon
- **+ Icon** (Blue button): Opens edit dialog with image upload
- **Design Title**: Clickable to open notes editor
- **Type Badge**: "Sampling" (gray) or "Production" (blue)
- **Notes Icon**: Shows if notes exist (blue file icon)
- **Stage Indicators**: 15 columns with status icons:
  - ⚪ Vacant (gray circle)
  - 🔵 In Progress (blue filled circle)
  - ✅ Completed (green checkmark)
- **Timeline**: Start date → End date
- **Actions**: Complete button, Delete button

**C. Stage Status Indicators**
Each of the 15 stages has a clickable status cell:
- Click cycles through: Vacant → In Progress → Completed
- Color coding per stage (Payment: green, Pattern: blue, Cutting: orange, etc.)
- Hover shows stage name

#### 4.1.3 Production Stages (15 Total)
1. **Payment Received** (Green)
2. **Fabric Finalize** (Slate)
3. **Pattern** (Blue)
4. **Grading** (Purple)
5. **Cutting** (Orange)
6. **Stitching** (Pink)
7. **Dye** (Rose)
8. **Print** (Lime)
9. **Embroidery** (Violet)
10. **Wash** (Cyan)
11. **Kaaj** (Indigo)
12. **Finishing** (Teal)
13. **Photoshoot** (Fuchsia)
14. **Final Settlement** (Amber)
15. **Dispatch** (Emerald)

#### 4.1.4 Filtering System
- **Type Filter**: All / Sampling Only / Production Only
- **Stage Filter**: Click any stage header to filter designs with that stage incomplete
- **Active Count**: Shows "Total: X designs" dynamically

#### 4.1.5 Drag-and-Drop
- **Client Reordering**: Drag client rows up/down to change priority
- **Design Reordering**: Drag designs within a client to prioritize
- **Visual Feedback**: Border highlight on drag-over target
- **Persistence**: Saves `display_order` field using midpoint algorithm

---

### 4.2 Image Upload & Management

#### 4.2.1 Upload Interface
- **Location**: Edit Design dialog (opened via + icon or design title click)
- **UI**: Blue "Upload Images" button with file picker
- **Formats**: PNG, JPEG, JPG, WEBP, GIF
- **Size Limit**: 5MB per file
- **Multiple**: Yes, unlimited images per design

#### 4.2.2 Image Preview
- **Current Images Grid**: 4-column responsive grid showing existing images
- **New Images Preview**: Shows selected files before upload
- **Actions**:
  - Click existing image → Full-size preview modal
  - Hover new image → Show X button to remove before upload

#### 4.2.3 Image Storage
- **Path Format**: `design-images/{timestamp}_{random}.{ext}`
- **Public Access**: Yes, all images publicly readable via URL
- **Associat**: Array of URLs stored in `designs.images` field

#### 4.2.4 Image Compression (Feature Ready)
- **Library**: `lib/imageUtils.ts` (compressImage function)
- **Max Width**: 1200px
- **Quality**: 80%
- **Output**: JPEG format

---

### 4.3 Notes & Documentation

#### 4.3.1 Notes Editor
- **Access**: Click design title or + icon
- **UI**: Large textarea (150px min-height)
- **Purpose**: 
  - Size/measurement specs
  - Client instructions
  - Fabric details
  - Meeting notes
  - Progress updates

#### 4.3.2 Notes Display
- **Indicator**: Blue file icon shows if notes exist
- **Title Hover**: "Has notes" tooltip
- **Full View**: Opens in edit dialog with design metadata

---

### 4.4 Client Management

#### 4.4.1 Clients Page (`/clients`)
- **View**: Table of all clients
- **Columns**: Name, Contact Person, Email, Phone, Created Date
- **Actions**: Add new client (via modal)
- **Sorting**: By display_order (drag-drop priority from main board)

#### 4.4.2 Add Client Modal
- **Fields**:
  - Name (required)
  - Contact Person (required)
  - Email (required, unique validation)
  - Phone (optional)
- **Validation**: Email format check, duplicate prevention
- **Auto-assignment**: Sets display_order to max + 1

---

### 4.5 Design Order Management

#### 4.5.1 Add Design Form
- **Location**: Via + button on client header row
- **Fields**:
  - **Title** (required): Design name
  - **Type** (required): Radio buttons - Sampling / Production
  - **Quantity** (conditionally required):
    - Locked to 1 for Sampling
    - Editable for Production (min: 1)
  - **Status** (required): Dropdown of 15 stages (default: Payment Received)
  - **Notes** (optional): Large textarea
  - **Images** (optional): Multi-file upload

#### 4.5.2 Initial State
- **Stage Status**: All stages set to "vacant" except first stage ("in-progress")
- **Timeline**: Auto-calculated based on quantity and type
- **Display Order**: Appended to end of client's designs
- **Created At**: Auto-timestamped

#### 4.5.3 Timeline Calculation
```
Formula: 
- Sampling: 5 days fixed
- Production: (quantity / daily_capacity) * processing_multiplier

Example:
- Quantity: 100 units
- Daily Capacity: 10 units/day
- Processing Days: 100/10 = 10 days
- Start Date: Next available slot (FIFO queue)
- End Date: Start + 10 days
```

---

### 4.6 Completed Orders

#### 4.6.1 Completion Criteria
- All 15 stages marked as "completed"
- Status = "Dispatch"
- End date <= today

#### 4.6.2 Completed Orders Page (`/completed-orders`)
- **View**: Read-only table of finished designs
- **Columns**: Client, Title, Type, Quantity, Completion Date
- **Filter**: By date range, client, type
- **Export**: (Future) CSV download

#### 4.6.3 Completion Action
- **Trigger**: Click "Mark as Completed" button on design row
- **Confirmation**: Modal with design details
- **Effect**: 
  - Sets all 15 stage_status to "completed"
  - Sets status to "Dispatch"
  - Removes from main board (filtered out)
  - Appears in Completed Orders

---

### 4.7 Timeline View

#### 4.7.1 Gantt Chart (`/timeline`)
- **Library**: Frappe Gantt
- **Display**: Horizontal timeline showing all designs
- **Bars**: Colored by client, length = duration
- **Interactions**: Click bar → Opens design in edit modal
- **Dependencies**: (Future) Link dependent stages

#### 4.7.2 Timeline Features
- **Start/End Dates**: Pulled from `designs.start_date` and `end_date`
- **Today Marker**: Vertical line showing current date
- **Zoom Levels**: Day, Week, Month views
- **Overdue Highlighting**: Red bars if end_date < today and not complete

---

### 4.8 Work Points (Tasks)

#### 4.8.1 Work Points Page (`/work-points`)
- **Purpose**: Task management separate from designs
- **Data Source**: `work_points` collection (NOT `tasks`)
- **Display**: Kanban-style task board
- **Categories**: To Do, In Progress, Done

#### 4.8.2 Task Features
- **Add Task**: Quick-add via button
- **Drag-and-Drop**: Move between columns
- **Edit**: Click task to edit title/description
- **Delete**: X button on task card
- **Assignee**: (Future) User assignment

---

## 5. Database Schema

### 5.1 Clients Table

```sql
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  display_order DOUBLE PRECISION DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
```sql
CREATE INDEX idx_clients_display_order ON clients(display_order);
CREATE INDEX idx_clients_email ON clients(email);
```

**Constraints**:
- Email must be unique
- Name and contact_person required

---

### 5.2 Designs Table

```sql
CREATE TABLE designs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Sampling', 'Production')),
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'Payment Received',
  notes TEXT,
  images TEXT[],
  stage_status JSONB DEFAULT '{}',
  start_date DATE,
  end_date DATE,
  display_order DOUBLE PRECISION DEFAULT 0,
  is_priority BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
```sql
CREATE INDEX idx_designs_client_id ON designs(client_id);
CREATE INDEX idx_designs_status ON designs(status);
CREATE INDEX idx_designs_type ON designs(type);
CREATE INDEX idx_designs_display_order ON designs(display_order);
CREATE INDEX idx_designs_priority ON designs(is_priority);
```

**Constraints**:
- Foreign key to clients (cascade delete)
- type must be 'Sampling' or 'Production'
- status must be one of the 15 stage names

**stage_status JSONB Format**:
```json
{
  "Payment Received": "in-progress",
  "Fabric Finalize": "vacant",
  "Pattern": "vacant",
  "Grading": "vacant",
  "Cutting": "vacant",
  "Stitching": "vacant",
  "Dye": "vacant",
  "Print": "vacant",
  "Embroidery": "vacant",
  "Wash": "vacant",
  "Kaaj": "vacant",
  "Finishing": "vacant",
  "Photoshoot": "vacant",
  "Final Settlement": "vacant",
  "Dispatch": "vacant"
}
```

**images Array Format**:
```json
[
  "https://storage.url/design-images/1775811219521_0.700.png",
  "https://storage.url/design-images/1775811219522_0.823.jpg"
]
```

---

### 5.3 Work Points Table

```sql
CREATE TABLE work_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Status Values**: 'todo', 'in-progress', 'done'

---

### 5.4 Workforce Settings Table

```sql
CREATE TABLE workforce_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  daily_unit_capacity INTEGER NOT NULL DEFAULT 10
);
```

**Purpose**: Stores production capacity for timeline calculations  
**Single Row**: Only one settings record exists

---

### 5.5 Storage Bucket

**Bucket Name**: `design-images`  
**Configuration**:
- Public: Yes
- File Size Limit: 5MB
- Allowed MIME Types: image/png, image/jpeg, image/jpg, image/webp, image/gif

**Access Policies** (RLS):
```sql
-- Allow public read
CREATE POLICY "Public read" ON storage.objects 
FOR SELECT USING (bucket_id = 'design-images');

-- Allow anon upload
CREATE POLICY "Anon upload" ON storage.objects 
FOR INSERT TO anon 
WITH CHECK (bucket_id = 'design-images');

-- Allow anon update
CREATE POLICY "Anon update" ON storage.objects 
FOR UPDATE TO anon 
USING (bucket_id = 'design-images');

-- Allow anon delete
CREATE POLICY "Anon delete" ON storage.objects 
FOR DELETE TO anon 
USING (bucket_id = 'design-images');
```

---

## 6. User Workflows

### 6.1 Add New Client & First Design

**Actor**: Production Manager

**Steps**:
1. Navigate to `/clients` page
2. Click "Add Client" button
3. Fill form:
   - Name: "Zara Fashion Pvt Ltd"
   - Contact: "Rahul Mehta"
   - Email: "rahul@zarafashion.com"
   - Phone: "+91 98765 43210"
4. Click "Add Client"
5. System creates client with auto-assigned `display_order`
6. Navigate back to `/` (main dashboard)
7. Find "Zara Fashion Pvt Ltd" client row
8. Click blue "+" button on client header
9. Add Design dialog opens
10. Fill form:
    - Title: "Summer Floral Dress"
    - Type: Production (radio)
    - Quantity: 50
    - Status: Payment Received
    - Notes: "Client wants pastel colors, size S-XXL"
11. Click "Upload Images"
12. Select 3 design mockup images
13. Preview shows thumbnails
14. Click "Save Changes"
15. System uploads images to storage
16. Creates design record with:
    - `images`: [url1, url2, url3]
    - `stage_status`: Payment Received = "in-progress", rest = "vacant"
    - `start_date`: Calculated (next available)
    - `end_date`: start_date + (50/10 days)
    - `display_order`: 0
17. Design appears under Zara in collapsed client row
18. Expand Zara row to see design

**Result**: Client and design created, visible on board

---

### 6.2 Update Production Stage

**Actor**: Production Manager

**Steps**:
1. On main dashboard, locate "Summer Floral Dress"
2. Expand Zara client row
3. Find "Pattern" stage column (3rd column)
4. Click the gray vacant circle
5. Circle turns blue (in-progress)
6. Click again
7. Circle turns green with checkmark (completed)
8. Click "Grading" column (4th)
9. Set to in-progress
10. System updates `stage_status` JSON:
```json
{
  "Payment Received": "completed",
  "Fabric Finalize": "completed",
  "Pattern": "completed",
  "Grading": "in-progress",
  ...
}
```

**Result**: Progress visible to all users, stage updated in database

---

### 6.3 Reorder Client Priority

**Actor**: Production Manager

**Steps**:
1. On main dashboard, see client order:
   - ABC Textiles (top)
   - Zara Fashion (middle)
   - XYZ Boutique (bottom)
2. Decide Zara is most urgent
3. Click and hold on Zara client header row
4. Drag upward
5. Blue border highlights drop zone above ABC
6. Release mouse
7. Zara row moves to top
8. System calculates midpoint:
   - ABC was `display_order = 1.0`
   - Zara was `display_order = 2.0`
   - New Zara `display_order = 0.5` (below 0, above 1)
9. Database updated
10. Order persists on page reload

**Result**: Clients reordered without full reindex

---

### 6.4 Filter by Design Type

**Actor**: Production Manager

**Steps**:
1. Dashboard shows 168 designs (59 Sampling, 109 Production)
2. Click "Sampling Only" button
3. View instantly filters to show only 59 designs
4. Counter updates: "Total: 59 designs"
5. All Production designs hidden
6. Click "All Designs"
7. All 168 designs reappear

**Result**: Quick view toggling without page reload

---

### 6.5 Mark Design as Completed

**Actor**: Production Manager

**Steps**:
1. Locate "Summer Floral Dress" on board
2. Verify all 15 stages show green checkmarks
3. Click "Complete" button (checkmark icon) on design row
4. Confirmation modal appears:
   ```
   Mark as Completed
   
   Design: Summer Floral Dress
   Client: Zara Fashion Pvt Ltd
   Type: Production
   
   [Cancel] [Mark as Completed]
   ```
5. Click "Mark as Completed"
6. System updates:
   - ALL `stage_status` fields = "completed"
   - `status` = "Dispatch"
7. Design disappears from main board
8. Navigate to `/completed-orders`
9. Design appears in completed list

**Result**: Design archived, board decluttered

---

### 6.6 Add Images to Existing Design

**Actor**: Design Team

**Steps**:
1. On main board, find "Summer Floral Dress"
2. Click blue + icon next to image thumbnail
3. Edit Design dialog opens
4. See "Current Images (3)" section showing existing mockups
5. Click "Upload Images" button
6. Select 2 new photos (fabric swatches)
7. "New Images to Upload" section shows 2 previews
8. Hover over one preview, click X to remove (changed mind)
9. 1 new image remains
10. Click "Save Changes"
11. System uploads new image to storage
12. Updates `images` array: [url1, url2, url3, url4]
13. Dialog closes
14. Thumbnail on board updates to show 4th image

**Result**: Design now has 4 images total

---

## 7. Technical Architecture

### 7.1 Frontend Stack

**Framework**: Next.js 14 (App Router)
- Server Components for data fetching
- Client Components for interactivity
- Image optimization with next/image

**Styling**:
- Tailwind CSS (utility-first)
- Shadcn UI components
- Custom CSS for drag-drop effects

**State Management**:
- React useState/useEffect hooks
- Local component state (no Redux)
- Optimistic UI updates

**Libraries**:
- `@supabase/supabase-js`: Database client
- `lucide-react`: Icon library
- `frappe-gantt`: Timeline visualization
- `@dnd-kit` (planned): Drag-and-drop enhancement

---

### 7.2 Backend (Current: Supabase)

**Database**: PostgreSQL via Supabase
- Hosted database with REST API
- Real-time subscriptions (not actively used)
- Auto-generated TypeScript types

**Storage**: Supabase Storage
- Object storage for images
- CDN-backed public URLs
- 5MB file size limit
- RLS policies for access control

**Authentication**: None (currently)
- Public access via anon key
- Future: Email/password auth

---

### 7.3 Deployment

**Platform**: Netlify
- Automatic deploys from Git
- Environment variables configured
- Edge caching for static assets

**Domain**: divadaulti.netlify.app

**Build Process**:
```bash
npm run build
# Generates optimized production build in .next/
```

---

### 7.4 File Structure

```
divadautli_maangement_website/
├── app/
│   ├── globals.css              # Tailwind directives
│   ├── layout.tsx               # Root layout with Sidebar
│   ├── page.tsx                 # Dashboard (ProductionStatusBoard)
│   ├── clients/page.tsx         # Clients list + Add Client
│   ├── completed-orders/page.tsx# Completed designs archive
│   ├── orders/page.tsx          # Add Design form
│   ├── timeline/page.tsx        # Gantt chart view
│   └── work-points/page.tsx     # Task board
│
├── components/
│   ├── ProductionStatusBoard.tsx # Main dashboard (1900+ lines)
│   ├── AddClientModal.tsx       # Client creation dialog
│   ├── AddDesignForm.tsx        # Design creation form
│   ├── CompletedOrders.tsx      # Completed designs table
│   ├── Sidebar.tsx              # App navigation
│   ├── TimelineGanttView.tsx    # Gantt chart wrapper
│   ├── WorkPoints.tsx           # Task Kanban board
│   └── ui/                      # Shadcn components
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── switch.tsx
│       └── textarea.tsx
│
├── lib/
│   ├── supabase.ts              # Supabase client + types
│   ├── timeline.ts              # Timeline calculation logic
│   ├── utils.ts                 # Utility functions (cn, etc.)
│   └── imageUtils.ts            # Image compression helper
│
├── types/
│   └── frappe-gantt.d.ts        # TypeScript definitions
│
├── public/
│   └── (static assets)
│
├── .env.local                   # Environment variables
├── next.config.js               # Next.js configuration
├── tailwind.config.ts           # Tailwind customization
├── tsconfig.json                # TypeScript config
└── package.json                 # Dependencies
```

---

### 7.5 Key Dependencies

```json
{
  "dependencies": {
    "next": "14.1.0",
    "react": "^18",
    "react-dom": "^18",
    "@supabase/supabase-js": "^2.11.0",
    "lucide-react": "^0.309.0",
    "frappe-gantt": "^0.6.1",
    "tailwindcss": "^3.3.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18"
  }
}
```

---

### 7.6 Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tgwrwwxbygygvbucqxwg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# (For Firebase migration, will become:)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

---

## 8. UI/UX Specifications

### 8.1 Color Palette

**Primary Colors**:
- Blue 500: `#3B82F6` (buttons, links, active states)
- Green 600: `#059669` (success, completed stages)
- Red 500: `#EF4444` (delete, errors)

**Stage Colors** (see section 4.1.3 for full list):
- Each of 15 stages has unique color
- Backgrounds: 100-level (light)
- Text: 800-level (dark)

**Neutral**:
- Gray 50-900 scale for backgrounds, borders, text

---

### 8.2 Typography

**Font Family**: System font stack (Inter fallback)
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
  'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
```

**Text Sizes**:
- `text-xs`: 0.75rem (12px) - badges, labels
- `text-sm`: 0.875rem (14px) - body text, table cells
- `text-base`: 1rem (16px) - inputs, buttons
- `text-lg`: 1.125rem (18px) - section headers
- `text-2xl`: 1.5rem (24px) - page titles

---

### 8.3 Spacing

**Padding**:
- `p-2`: 0.5rem (8px) - tight spacing
- `p-4`: 1rem (16px) - standard component padding
- `p-6`: 1.5rem (24px) - section padding

**Gaps**:
- `gap-2`: 0.5rem - icon-text pairs
- `gap-3`: 0.75rem - design row elements
- `gap-4`: 1rem - form fields

---

### 8.4 Responsive Breakpoints

```css
/* Mobile-first approach */
sm: 640px   /* Small devices */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

**Responsive Behaviors**:
- **< 640px**: Sidebar collapses, table scrolls horizontally
- **640px - 1024px**: Standard view, reduced padding
- **> 1024px**: Full layout with sidebars, optimal spacing

---

### 8.5 Interaction States

**Buttons**:
- Hover: Brightness +10%, cursor pointer
- Active: Brightness -10%, scale 0.98
- Disabled: Opacity 50%, cursor not-allowed

**Drag-and-Drop**:
- Dragging: Opacity 50%
- Drop Target: Blue border-top-4, background blue-50
- Drag End: Reset opacity, remove borders

**Stage Indicators**:
- Vacant: Gray border circle, hover cursor pointer
- In-Progress: Blue filled circle, hover cursor pointer
- Completed: Green checkmark, click to go back to in-progress

---

### 8.6 Modals & Dialogs

**Structure**:
```
┌─────────────────────────────┐
│ [Icon] Dialog Title      [X]│
│ Description text            │
├─────────────────────────────┤
│                             │
│   Content Area              │
│                             │
├─────────────────────────────┤
│        [Cancel] [Primary]   │
└─────────────────────────────┘
```

**Behavior**:
- Backdrop: Semi-transparent black (bg-black/50)
- Close: Via X, Cancel, or click backdrop
- Max Width: 2xl (672px) for forms, 4xl (896px) for image previews
- Vertical Center: Always centered on screen

---

### 8.7 Loading States

**Initial Load**:
```jsx
<div className="text-center py-12">
  <p className="text-gray-500">Loading designs...</p>
</div>
```

**Saving**:
- Button text changes: "Save Changes" → "Saving..."
- Button disabled during save
- Spinner icon rotates (optional)

---

### 8.8 Empty States

**No Designs in Client**:
```
No designs yet. Click + to add one.
```

**No Clients**:
```
No clients found. Add your first client to get started.
```

**Filtered View Empty**:
```
No designs match this filter.
[Clear Filter]
```

---

### 8.9 Error Handling

**Upload Failure**:
```javascript
alert('Failed to save: ' + error.message)
// Shows browser alert with error details
```

**Network Error**:
```
Unable to load data. Please check your connection and refresh.
```

**Validation Errors**:
- Red border on invalid fields
- Helper text below field: "Email is required" (text-red-500)

---

## 9. Firebase Migration Plan

### 9.1 Why Firebase?

**Advantages Over Supabase**:
- ✅ Better RLS policy management (Firestore Rules are clearer)
- ✅ Simpler storage setup (Cloud Storage works out-of-box)
- ✅ More generous free tier (1GB storage vs 500MB)
- ✅ Better SDK documentation and community support
- ✅ Integrated authentication without policy headaches

**Current Pain Points**:
- ❌ Storage RLS policies constantly failing (403 errors)
- ❌ Confusing anon vs public policy syntax
- ❌ Need to manually create buckets via SQL
- ❌ No clear UI for policy management

---

### 9.2 Firebase Services to Use

| **Service** | **Purpose** | **Replaces** |
|-------------|-------------|--------------|
| **Firestore** | NoSQL database for clients, designs, tasks | Supabase PostgreSQL |
| **Cloud Storage** | Image hosting with public URLs | Supabase Storage |
| **Authentication** (Optional) | User login (future feature) | None (currently public) |
| **Hosting** (Optional) | Alternative to Netlify | Netlify |

---

### 9.3 Firestore Data Model

#### 9.3.1 Clients Collection

**Collection Path**: `/clients`

**Document Structure**:
```javascript
{
  id: "auto-generated-id",
  name: "Zara Fashion Pvt Ltd",
  contactPerson: "Rahul Mehta",
  email: "rahul@zarafashion.com",
  phone: "+91 98765 43210",
  displayOrder: 0.5,
  createdAt: Timestamp
}
```

**Firestore Rules**:
```javascript
match /clients/{clientId} {
  allow read: if true; // Public read
  allow write: if true; // Public write (or add auth later)
}
```

**Indexes**:
```javascript
// Create composite index in Firebase Console:
// Collection: clients
// Fields: displayOrder (Ascending), __name__ (Ascending)
```

---

#### 9.3.2 Designs Collection

**Collection Path**: `/designs`

**Document Structure**:
```javascript
{
  id: "auto-generated-id",
  clientId: "client-doc-id", // Reference to clients collection
  title: "Summer Floral Dress",
  type: "Production", // or "Sampling"
  quantity: 50,
  status: "Pattern", // Current stage
  notes: "Client wants pastel colors...",
  images: [
    "https://storage.googleapis.com/bucket/designs/img1.jpg",
    "https://storage.googleapis.com/bucket/designs/img2.jpg"
  ],
  stageStatus: {
    "Payment Received": "completed",
    "Fabric Finalize": "completed",
    "Pattern": "in-progress",
    "Grading": "vacant",
    // ... all 15 stages
  },
  startDate: Timestamp,
  endDate: Timestamp,
  displayOrder: 1.0,
  isPriority: false,
  createdAt: Timestamp
}
```

**Firestore Rules**:
```javascript
match /designs/{designId} {
  allow read: if true;
  allow create: if true;
  allow update: if true;
  allow delete: if true;
}
```

**Indexes**:
```javascript
// Composite indexes needed:
1. clientId (Ascending) + displayOrder (Ascending)
2. type (Ascending) + createdAt (Descending)
3. status (Ascending) + createdAt (Descending)
```

---

#### 9.3.3 Work Points Collection

**Collection Path**: `/workPoints`

**Document Structure**:
```javascript
{
  id: "auto-generated-id",
  title: "Update production schedule",
  description: "Review Q2 capacity",
  status: "todo", // "todo" | "in-progress" | "done"
  createdAt: Timestamp
}
```

---

#### 9.3.4 Settings Collection (Single Doc)

**Collection Path**: `/settings`  
**Document ID**: `workforce`

**Document Structure**:
```javascript
{
  dailyUnitCapacity: 10
}
```

---

### 9.4 Cloud Storage Structure

**Bucket**: Default Firebase Storage bucket  
**Path Structure**: `/design-images/{filename}`

**Filename Format**: `{timestamp}_{random}.{ext}`  
**Example**: `1775812345678_0.7234156.png`

**Storage Rules**:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /design-images/{filename} {
      // Allow anyone to read
      allow read: if true;
      
      // Allow anyone to upload (or add auth check)
      allow write: if true;
    }
  }
}
```

**Upload Code** (React):
```javascript
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

const uploadImage = async (file) => {
  const ext = file.name.split('.').pop();
  const filename = `${Date.now()}_${Math.random()}.${ext}`;
  const storageRef = ref(storage, `design-images/${filename}`);
  
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return url;
};
```

---

### 9.5 Migration Steps

#### Phase 1: Setup (Day 1)

**Tasks**:
1. Create Firebase project in console
2. Enable Firestore Database
3. Enable Cloud Storage
4. Copy Firebase config credentials
5. Install Firebase SDK:
```bash
npm install firebase
npm install firebase-admin # For server-side if needed
```

6. Create `lib/firebase.ts`:
```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

7. Update `.env.local` with Firebase credentials

---

#### Phase 2: Data Migration (Day 2)

**Export from Supabase**:
```javascript
// Run this script to export all data
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function exportData() {
  const { data: clients } = await supabase.from('clients').select('*');
  const { data: designs } = await supabase.from('designs').select('*');
  const { data: workPoints } = await supabase.from('work_points').select('*');
  
  fs.writeFileSync('export_clients.json', JSON.stringify(clients, null, 2));
  fs.writeFileSync('export_designs.json', JSON.stringify(designs, null, 2));
  fs.writeFileSync('export_workpoints.json', JSON.stringify(workPoints, null, 2));
  
  console.log('✅ Exported:', clients.length, 'clients');
  console.log('✅ Exported:', designs.length, 'designs');
  console.log('✅ Exported:', workPoints.length, 'work points');
}

exportData();
```

**Import to Firebase**:
```javascript
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import clientsData from './export_clients.json';
import designsData from './export_designs.json';

async function importData() {
  // Import clients
  for (const client of clientsData) {
    await addDoc(collection(db, 'clients'), {
      name: client.name,
      contactPerson: client.contact_person,
      email: client.email,
      phone: client.phone || '',
      displayOrder: client.display_order || 0,
      createdAt: new Date(client.created_at)
    });
  }
  
  // Import designs
  for (const design of designsData) {
    await addDoc(collection(db, 'designs'), {
      clientId: design.client_id,
      title: design.title,
      type: design.type,
      quantity: design.quantity,
      status: design.status,
      notes: design.notes || '',
      images: design.images || [],
      stageStatus: design.stage_status || {},
      startDate: design.start_date ? new Date(design.start_date) : null,
      endDate: design.end_date ? new Date(design.end_date) : null,
      displayOrder: design.display_order || 0,
      isPriority: design.is_priority || false,
      createdAt: new Date(design.created_at)
    });
  }
  
  console.log('✅ Import complete!');
}

importData();
```

**Challenge**: Image URLs from Supabase won't work in Firebase  
**Solution**: 
- Option A: Re-upload images manually (small count)
- Option B: Download all images and re-upload to Firebase Storage:

```javascript
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './lib/firebase';
import fetch from 'node-fetch';

async function migrateImages() {
  const designs = await getDocs(collection(db, 'designs'));
  
  for (const designDoc of designs.docs) {
    const design = designDoc.data();
    const newImageUrls = [];
    
    for (const oldUrl of design.images) {
      // Download from Supabase
      const response = await fetch(oldUrl);
      const blob = await response.blob();
      
      // Upload to Firebase
      const filename = `${Date.now()}_${Math.random()}.${blob.type.split('/')[1]}`;
      const storageRef = ref(storage, `design-images/${filename}`);
      await uploadBytes(storageRef, blob);
      const newUrl = await getDownloadURL(storageRef);
      
      newImageUrls.push(newUrl);
    }
    
    // Update design with new URLs
    await updateDoc(doc(db, 'designs', designDoc.id), {
      images: newImageUrls
    });
  }
}
```

---

#### Phase 3: Code Migration (Days 3-5)

**Update Components** - Replace all Supabase queries with Firestore:

**Before (Supabase)**:
```typescript
const { data: designs } = await supabase
  .from('designs')
  .select('*, clients(name)')
  .eq('type', 'Sampling');
```

**After (Firebase)**:
```typescript
import { collection, query, where, getDocs } from 'firebase/firestore';

const designsRef = collection(db, 'designs');
const q = query(designsRef, where('type', '==', 'Sampling'));
const snapshot = await getDocs(q);
const designs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

// Join with clients (manual):
const designsWithClients = await Promise.all(
  designs.map(async design => {
    const clientDoc = await getDoc(doc(db, 'clients', design.clientId));
    return { ...design, clientName: clientDoc.data()?.name };
  })
);
```

**Key Changes**:

1. **ProductionStatusBoard.tsx** (1900 lines):
   - Replace `supabase.from('designs').select()` with Firestore queries
   - Replace `.update()` with `updateDoc()`
   - Replace `.delete()` with `deleteDoc()`
   - Add manual client JOIN logic

2. **AddClientModal.tsx**:
   - Replace `supabase.from('clients').insert()` with `addDoc()`

3. **Add Design Form**:
   - Replace `supabase.storage.upload()` with Firebase Storage upload
   - Replace `supabase.from('designs').insert()` with `addDoc()`

4. **WorkPoints.tsx**:
   - Replace `collection(db, 'work_points')` ✅ (already uses Firestore naming!)
   - Just update import paths

---

#### Phase 4: Testing (Days 6-7)

**Test Scenarios**:
1. ✅ Add new client
2. ✅ Add design with images
3. ✅ Update stage status (click vacant → in-progress → completed)
4. ✅ Drag-drop client reordering
5. ✅ Drag-drop design reordering
6. ✅ Filter by type (Sampling/Production)
7. ✅ Filter by stage
8. ✅ Edit notes
9. ✅ Add more images to existing design
10. ✅ Mark design as complete
11. ✅ Delete design
12. ✅ View completed orders
13. ✅ Timeline view

**Performance Testing**:
- Load time with 200+ designs
- Image upload speed
- Filter response time
- Drag-drop lag

---

#### Phase 5: Deploy (Day 8)

**Option A: Keep Netlify**
- Push Firebase code to Git
- Netlify auto-deploys
- Update environment variables in Netlify

**Option B: Firebase Hosting**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Select Firebase project
# Set public directory: .next
# Configure as single-page app: No
# Set up automatic builds: No

npm run build
firebase deploy
```

**DNS**: Update domain to point to Firebase Hosting

---

### 9.6 Cost Comparison

**Supabase Free Tier**:
- 500MB database
- 1GB storage
- 2GB bandwidth

**Firebase Free Tier (Spark Plan)**:
- 1GB Firestore storage
- 5GB Cloud Storage
- 10GB bandwidth per month
- 50K reads, 20K writes per day

**Current Usage** (59 clients, 168 designs):
- Database: ~5MB
- Storage: ~200MB images (old Supabase had quota issues!)
- Bandwidth: ~10GB/month

**Verdict**: Firebase free tier is sufficient, with room to grow

---

### 9.7 Rollback Plan

If Firebase migration fails:

1. **Keep Supabase credentials** in separate branch
2. **Run export script** before migrating
3. **Test locally** before deploying
4. **Dual-write strategy**: Write to both Supabase and Firebase for 1 week, then cut over
5. **Backup images** to local storage before migration

**Rollback Command**:
```bash
git checkout supabase-backup-branch
npm install
npm run dev
# Verify old functionality works
git push origin main --force # Restore production
```

---

## 10. Future Enhancements

### 10.1 Authentication & Roles
- **User Login**: Email/password via Firebase Auth
- **Roles**: Admin, Manager, Viewer
- **Permissions**: Admins can delete, Viewers read-only

### 10.2 Real-time Collaboration
- **Live Updates**: Firestore `onSnapshot()` for real-time board updates
- **Presence**: Show who's viewing/editing

### 10.3 Notifications
- **Email**: Send alerts when design completes stage
- **SMS**: WhatsApp integration for client updates
- **In-App**: Toast notifications for status changes

### 10.4 Analytics
- **Production Metrics**: Average days per stage
- **Client Reports**: Order history, most common issues
- **Worker Efficiency**: Time tracking per stage

### 10.5 Advanced Features
- **Bulk Upload**: CSV import for designs
- **Templates**: Save design configurations
- **Dependencies**: Link stages (e.g., Cutting can't start until Pattern done)
- **Inventory**: Track fabric/material usage
- **Invoicing**: Generate bills from completed orders

---

## 11. Glossary

- **Design**: A single order/product to be manufactured
- **Sampling**: Test/prototype design with fixed quantity of 1
- **Production**: Full order with custom quantity
- **Stage**: One of 15 production steps (Pattern, Cutting, etc.)
- **Stage Status**: State of a stage - vacant, in-progress, or completed
- **Client**: Business placing orders
- **Display Order**: Float value determining sort priority
- **Midpoint Algorithm**: Calculates new order between two items without reindexing
- **Timeline**: Calculated date range for design completion
- **Work Points**: Task management separate from designs
- **FIFO**: First In First Out - scheduling strategy

---

## 12. Appendix

### 12.1 Current Data Statistics
- **Total Clients**: 59
- **Total Designs**: 168 (59 Sampling, 109 Production)
- **Total Work Points**: 61
- **Average Designs per Client**: 2.8
- **Most Common Stage**: Pattern (35 designs in progress)
- **Average Quantity**: 42 units (Production only)

### 12.2 Contact & Support
- **Developer**: GitHub Copilot AI Agent
- **Repository**: (Private)
- **Documentation**: This PRD + inline code comments
- **Support**: Via GitHub Issues (post-migration)

---

**END OF PRD**

*This document serves as the complete specification for rebuilding Divadaulti with Firebase. All features, workflows, and technical details are documented for reference.*
