# Diva Daulti Order Management System

A modern order management system built with Next.js, Tailwind CSS, Shadcn UI, and Supabase for managing fashion design orders.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Shadcn UI
- **Database/Auth**: Supabase (PostgreSQL + Storage)
- **Icons**: Lucide React
- **Language**: TypeScript

## Features

- ✅ **Automated Scheduling** - Timeline calculation based on workforce capacity (FIFO queue)
- ✅ **Production Status Board** (Kanban-style) - Track designs across 7 production stages
- ✅ Client Management (Add/View Clients)
- ✅ Design Order Management
- ✅ Multi-image upload to Supabase Storage
- ✅ Sampling vs Production toggle (auto-locks quantity for sampling)
- ✅ Estimated days tracking per process
- ✅ Real-time status updates with Supabase
- ✅ Filtering by design type (All/Sampling/Production)
- ✅ Responsive sidebar navigation
- ✅ Modern UI with Shadcn components

## Folder Structure

```
divadautli_maangement_website/
├── app/
│   ├── clients/
│   │   └── page.tsx              # Clients page with Add Client modal
│   ├── orders/
│   │   └── page.tsx              # Orders page with Add Design form
│   ├── timeline/
│   │   └── page.tsx              # Timeline view (placeholder)
│   ├── globals.css               # Global styles with Tailwind
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home/Dashboard page
│adge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   └── switch.tsx
│   ├── AddClientModal.tsx        # Client creation modal
│   ├── AddDesignForm.tsx         # Design form with image upload
│   ├── ProductionStatusBoard.tsx # Kanban board for production tracking
│   │   └── switch.tsx
│   ├── AddClientModal.tsx        # Client creation modal
│   ├── AddDesignForm.tsx         # Design form with image upload
│   └── Sidebar.tsx               # Navigation sidebar
│
├── lib/
│   ├── supabase.ts               # Supabase client & type definitions
│   └── utils.ts                  # Utility functions (cn)
│
├── .env.local                    # Environment variables
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── SCHEMA.md                     # Database schema documentation
└── README.md
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL commands from `SCHEMA.md` in your Supabase SQL Editor
3. Create a storage bucket named `design-images` and make it public
4. Copy your project URL and anon key

### 3. Configure Environment Variables

Update `.env.local` with your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
Production Status Board (Kanban)

The Production Status Board (`/` - Dashboard) provides a visual Kanban-style interface to track all designs:

**Features:**
- **7-Stage Pipeline**: Horizontal scrolling board with columns for each stage:
  - Sourcing → Pattern → Grading → Cutting → Stitching → Photoshoot → Dispatch
- **Design Cards**: Each card displays:
  - Primary design image (or placeholder)
  - Client name
  - Design title
  - Type badge (Sampling/Production)
  - Quantity
  - "Move to Next Stage" button (except for Dispatch)
- **Filtering**: Toggle between viewing:
  - All Designs
  - Sampling Only
  - Production Only
- **Real-time Updates**: Status changes immediately update the Supabase database
- **Visual Progress**: 
  - Color-coded stage headers
  - Progress bar showing distribution
  - Card count per stage

**Technical Implementation:**
```typescript
// Fetches designs with client data using JOIN
const { data } = await supabase
  .from('designs')
  .select('*, clients(name)')

// Updates status in real-time
await supabase
  .from('designs')
  .update({ status: nextStatus })
  .eq('drag-and-drop functionality for moving cards between stages
2. Add client list view with edit/delete functionality
3. Add design list view with filters and search
4. Implement timeline view with Gantt chart
5. Add authentication with Supabase Auth
6. Implement real-time subscriptions (Supabase Realtime)
7. Add edit/delete functionality for designs
8. Build reporting and analytics dashboard
9. Add workforce capacity calculator
10. Implement notifications for stage changes
The Add Design form (`/orders`) includes:

- **Client Selection**: Dropdown to select from existing clients
- **Design Title**: Text input for design name
- **Type Toggle**: Switch between Sampling (quantity=1) and Production (custom quantity)
- **Quantity Input**: Visible only for Production type
- **Status Selection**: Choose initial status from process steps
- **Estimated Days**: Input fields for each process step (Sourcing, Pattern, Grading, Cutting, Stitching, Photoshoot, Dispatch)
- **Image Upload**: Multi-image upload with live preview and remove functionality
- **Form Actions**: Submit and Reset buttons

### Image Upload Features

- Multiple image selection
- Live image previews in a grid
- Individual image removal
- Automatic upload to Supabase Storage
- Public URL generation for stored images

## Database Schema

The system uses three main tables:

1. **clients**: Stores client information
2. **designs**: Stores design orders with images and estimated days
3. **workforce_settings**: Stores capacity settings

See `SCHEMA.md` for detailed schema and setup instructions.

## Next Steps

To extend this project:

1. Add client list view with edit/delete functionality
2. Add design list view with filters and search
3. Implement timeline view with Gantt chart
4. Add authentication with Supabase Auth
5. Implement real-time updates
6. Add status update functionality for designs
7. Build reporting and analytics dashboard
8. Add workforce capacity calculator

## License

MIT
