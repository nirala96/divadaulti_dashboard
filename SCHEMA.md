# Diva Daulti Order Management - Database Schema

## Supabase Setup Instructions

### Step 1: Create Tables

Run the following SQL commands in your Supabase SQL Editor:

```sql
-- Create clients table
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create designs table
CREATE TABLE designs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Sampling', 'Production')),
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'Sourcing' CHECK (status IN ('Sourcing', 'Pattern', 'Grading', 'Cutting', 'Stitching', 'Photoshoot', 'Dispatch')),
  images TEXT[] DEFAULT '{}',
  estimated_days JSONB,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create workforce_settings table
CREATE TABLE workforce_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  daily_unit_capacity INTEGER NOT NULL DEFAULT 10
);

-- Insert default workforce settings
INSERT INTO workforce_settings (daily_unit_capacity) VALUES (10);

-- Create indexes for better performance
CREATE INDEX idx_designs_client_id ON designs(client_id);
CREATE INDEX idx_designs_status ON designs(status);
CREATE INDEX idx_designs_type ON designs(type);
```

### Step 2: Set up Storage Bucket

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `design-images`
3. Set the bucket to **Public** (or configure RLS policies as needed)
4. Make the bucket publicly accessible if you want images to be viewable without authentication

### Step 3: Configure Row Level Security (Optional)

If you're using authentication, you can set up RLS policies:

```sql
-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workforce_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (modify based on your auth requirements)
CREATE POLICY "Allow public read access" ON clients FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON designs FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON workforce_settings FOR SELECT USING (true);

-- Allow public insert/update (modify based on your auth requirements)
CREATE POLICY "Allow public insert" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON designs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON designs FOR UPDATE USING (true);
CREATE POLICY "Allow public update" ON workforce_settings FOR UPDATE USING (true);
```

### Step 4: Update Environment Variables

Update your `.env.local` file with your actual Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
```

## Database Schema Overview

### Clients Table
- **id**: UUID (Primary Key)
- **name**: Text (Client company/business name)
- **contact_person**: Text (Name of main contact)
- **email**: Text (Unique email address)
- **created_at**: Timestamp

### Designs Table
- **id**: UUID (Primary Key)
- **client_id**: UUID (Foreign Key to clients)
- **title**: Text (Design name/title)
- **type**: Text ('Sampling' or 'Production')
- **quantity**: Integer (1 for Sampling, custom for Production)
- **status**: Text (Sourcing, Pattern, Grading, Cutting, Stitching, Photoshoot, Dispatch)
- **images**: Text Array (URLs from Supabase Storage)
- **estimated_days**: JSONB (Object containing days for each process)
- **start_date**: Date (Calculated start date based on workforce capacity)
- **end_date**: Date (Calculated end date based on duration)
- **created_at**: Timestamp

### Workforce Settings Table
- **id**: UUID (Primary Key)
- **daily_unit_capacity**: Integer (Units that can be processed per day)
