# Project Structure

## Complete Folder Tree

```
divadautli_maangement_website/
│
├── 📁 app/                          # Next.js App Router
│   ├── 📁 clients/
│   │   └── page.tsx                 # Clients page with Add Client modal
│   ├── 📁 orders/
│   │   └── page.tsx                 # Orders page with Add Design form ⭐
│   ├── 📁 timeline/
│   │   └── page.tsx                 # Timeline view (placeholder)
│   ├── globals.css                  # Global styles + Tailwind directives
│   ├── layout.tsx                   # Root layout with metadata
│   └── page.tsx                     # Dashboard homepage
│
├── 📁 components/                   # React Components
│   ├── 📁 ui/                       # Shadcn UI Components
│   │   ├── badge.tsx                # Badge component (NEW)
│   │   ├── button.tsx               # Button component
│   │   ├── card.tsx                 # Card component (NEW) ⭐
│   │   ├── dialog.tsx               # Modal/Dialog component
│   │   ├── input.tsx                # Input field component
│   │   ├── label.tsx                # Label component
│   │   ├── select.tsx               # Dropdown select component
│   │   └── switch.tsx               # Toggle switch component
│   │
│   ├── AddClientModal.tsx           # Client creation modal ⭐
│   ├── AddDesignForm.tsx            # Design form with image upload ⭐
│   ├── ProductionStatusBoard.tsx    # Kanban board for production tracking ⭐⭐
│   └── Sidebar.tsx                  # Navigation sidebar ⭐
│
├── 📁 lib/                          # Utilities & Configuration
│   ├── supabase.ts                  # Supabase client + TypeScript types
│   └── utils.ts                     # Utility functions (cn helper)
│
├── .env.local                       # Environment variables (Supabase keys)
├── .gitignore                       # Git ignore rules
├── next.config.js                   # Next.js configuration
├── package.json                     # Dependencies & scripts
├── postcss.config.js                # PostCSS configuration
├── tailwind.config.ts               # Tailwind CSS configuration
├── tsconfig.json                    # TypeScript configuration
├── README.md                        # Project documentation
└── SCHEMA.md                        # Database schema & setup guide

⭐ = Key functional components
```

## Route StructureProduction Status Board (Kanban View) ⭐⭐

```
/                    → Dashboard (Homepage)
/clients             → Client Management (with Add Client modal)
/orders              → Design Management (with Add Design form)
/timeline            → Timeline View (placeholder)
```

## Component Breakdown

### Core Components (4 custom components)

1. **Sidebar.tsx** (64 lines)
   - Navigation with 4 menu items
   - Active state highlighting
   - Responsive sidebar layout

2. **AddClientModal.tsx** (103 lines)
   - Dialog-based modal
   - Form validation
   - Supabase integration
   - Success/Error handling

3. **AddDesignForm.tsx** (387 lines) ⭐ DESIGN CREATION
   - Client dropdown selection
   - Sampling/Production toggle
   - Quantity management
   - Status selection
   - Estimated days for 7 processes
   - Multi-image upload with preview
   - Image removal functionality
   - Form reset capability

4. **ProductionStatusBoard.tsx** (260 lines) ⭐⭐ KANBAN BOARD
   - 7-stage horizontal Kanban board
   - Design cards with images
   - Client data JOIN queries
   - Real-time status updates
   - Filter by All/Sampling/Production
   - Move to next stage functionality
   - Color-coded stage columns
   - Progress visualization
   - Responsive scrolling layout

### Shadcn UI Components (8 components)

All fully configured and ready to use:
- Badge (new - for type tags and counts)
- Button (variants: default, destructive, outline, secondary, ghost, link)
- Card (new - for design cards) ⭐
- Dialog (modal system)
- Input (text fields)
- Label (form labels)
- Select (dropdown menus)
- Switch (toggle switches)

## Database Integration

**Supabase Configuration:**
- PostgreSQL database with 3 tables
- Storage bucket for images
- TypeScript types in lib/supabase.ts

**Tables:**
1. `clients` - Client information
2. `designs` - Design orders with images array
3. `workforce_settings` - Daily capacity settings

## Styling System

**Tailwind CSS with:**
- Custom color variables (CSS variables)
- Dark mode support (class-based)
- Custom border radius
- Animations (accordion-down, accordion-up)
- Shadcn UI theme integration

## Type Safety

Full TypeScript coverage with:
- Supabase type definitions
- Component prop types
- Form data types
- Status enums
