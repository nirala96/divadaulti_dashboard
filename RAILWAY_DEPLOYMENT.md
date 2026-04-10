# Railway Deployment Guide

## Overview
Deploy Divadaulti production system on Railway with PostgreSQL + Cloudinary for images.

---

## Architecture

```
┌─────────────────────────────────────────┐
│         Railway Platform                │
│                                         │
│  ┌──────────────┐    ┌──────────────┐  │
│  │  PostgreSQL  │◄───│   Next.js    │  │
│  │   Database   │    │   Backend    │  │
│  └──────────────┘    └──────┬───────┘  │
│                              │          │
└──────────────────────────────┼──────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │   Cloudinary     │
                    │  Image Storage   │
                    └──────────────────┘
```

---

## Phase 1: Create Railway Project

### 1.1 Sign Up & Create Project
1. Go to https://railway.app
2. Sign up with GitHub
3. Click **New Project**
4. Select **Empty Project**
5. Name it: `divadaulti-production`

### 1.2 Add PostgreSQL Database
1. In project dashboard, click **+ New**
2. Select **Database** → **PostgreSQL**
3. Railway provisions a database with:
   - Auto-generated credentials
   - Public networking disabled by default
   - Automatic backups

### 1.3 Get Database Credentials
1. Click on PostgreSQL service
2. Go to **Variables** tab
3. Copy these values:
   ```
   DATABASE_URL (complete connection string)
   PGHOST
   PGPORT
   PGUSER
   PGPASSWORD
   PGDATABASE
   ```

---

## Phase 2: Migrate Data to Railway PostgreSQL

### 2.1 Export from Supabase

Create `export_supabase.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://tgwrwwxbygygvbucqxwg.supabase.co',
  'YOUR_SUPABASE_ANON_KEY'
);

async function exportData() {
  // Export clients
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('display_order');
  
  // Export designs
  const { data: designs } = await supabase
    .from('designs')
    .select('*')
    .order('client_id, display_order');
  
  // Export work_points
  const { data: workPoints } = await supabase
    .from('work_points')
    .select('*');
  
  // Export workforce_settings
  const { data: settings } = await supabase
    .from('workforce_settings')
    .select('*');
  
  fs.writeFileSync('data/clients.json', JSON.stringify(clients, null, 2));
  fs.writeFileSync('data/designs.json', JSON.stringify(designs, null, 2));
  fs.writeFileSync('data/workpoints.json', JSON.stringify(workPoints, null, 2));
  fs.writeFileSync('data/settings.json', JSON.stringify(settings, null, 2));
  
  console.log(`✅ Exported ${clients.length} clients`);
  console.log(`✅ Exported ${designs.length} designs`);
  console.log(`✅ Exported ${workPoints.length} work points`);
  console.log(`✅ Exported ${settings.length} settings`);
}

exportData().catch(console.error);
```

Run:
```bash
mkdir data
node export_supabase.js
```

### 2.2 Create Railway Database Schema

Create `railway_schema.sql`:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients table
CREATE TABLE clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  display_order DOUBLE PRECISION DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Designs table
CREATE TABLE designs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Sampling', 'Production')),
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'Payment Received',
  notes TEXT,
  images TEXT[],
  stage_status JSONB DEFAULT '{}'::jsonb,
  start_date DATE,
  end_date DATE,
  display_order DOUBLE PRECISION DEFAULT 0,
  is_priority BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work points table
CREATE TABLE work_points (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workforce settings table
CREATE TABLE workforce_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  daily_unit_capacity INTEGER NOT NULL DEFAULT 10
);

-- Indexes
CREATE INDEX idx_clients_display_order ON clients(display_order);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_designs_client_id ON designs(client_id);
CREATE INDEX idx_designs_status ON designs(status);
CREATE INDEX idx_designs_type ON designs(type);
CREATE INDEX idx_designs_display_order ON designs(display_order);
```

### 2.3 Connect to Railway Database

Install PostgreSQL client:
```bash
brew install postgresql  # macOS
# or
sudo apt install postgresql-client  # Linux
```

Connect using Railway credentials:
```bash
psql "postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

Run schema:
```sql
\i railway_schema.sql
```

### 2.4 Import Data to Railway

Create `import_to_railway.js`:

```javascript
const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: 'PASTE_RAILWAY_DATABASE_URL_HERE'
});

async function importData() {
  await client.connect();
  
  // Read exported data
  const clients = JSON.parse(fs.readFileSync('data/clients.json'));
  const designs = JSON.parse(fs.readFileSync('data/designs.json'));
  const workPoints = JSON.parse(fs.readFileSync('data/workpoints.json'));
  const settings = JSON.parse(fs.readFileSync('data/settings.json'));
  
  // Import clients (preserve UUIDs)
  for (const c of clients) {
    await client.query(
      `INSERT INTO clients (id, name, contact_person, email, phone, display_order, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [c.id, c.name, c.contact_person, c.email, c.phone, c.display_order, c.created_at]
    );
  }
  console.log(`✅ Imported ${clients.length} clients`);
  
  // Import designs (preserve UUIDs and relationships)
  for (const d of designs) {
    await client.query(
      `INSERT INTO designs (id, client_id, title, type, quantity, status, notes, images, stage_status, start_date, end_date, display_order, is_priority, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        d.id, d.client_id, d.title, d.type, d.quantity, d.status, 
        d.notes, d.images, d.stage_status, d.start_date, d.end_date, 
        d.display_order, d.is_priority, d.created_at
      ]
    );
  }
  console.log(`✅ Imported ${designs.length} designs`);
  
  // Import work_points
  for (const w of workPoints) {
    await client.query(
      `INSERT INTO work_points (id, title, description, status, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [w.id, w.title, w.description, w.status, w.created_at]
    );
  }
  console.log(`✅ Imported ${workPoints.length} work points`);
  
  // Import settings
  if (settings.length > 0) {
    const s = settings[0];
    await client.query(
      `INSERT INTO workforce_settings (id, daily_unit_capacity)
       VALUES ($1, $2)`,
      [s.id, s.daily_unit_capacity]
    );
  }
  console.log(`✅ Imported settings`);
  
  await client.end();
}

importData().catch(console.error);
```

Install dependencies and run:
```bash
npm install pg
node import_to_railway.js
```

---

## Phase 3: Setup Cloudinary for Images

### 3.1 Create Cloudinary Account
1. Go to https://cloudinary.com
2. Sign up (free tier: 25GB storage, 25GB bandwidth/month)
3. Get credentials from dashboard:
   - Cloud Name
   - API Key
   - API Secret

### 3.2 Install Cloudinary SDK

```bash
npm install cloudinary
npm install @cloudinary/url-gen  # For URL generation
```

### 3.3 Create Cloudinary Helper

Create `lib/cloudinary.ts`:

```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: 'design-images',
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      }
    ).end(buffer);
  });
};

export const deleteImage = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};

export default cloudinary;
```

### 3.4 Update Environment Variables

Add to `.env.local`:
```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Phase 4: Update Code for Railway + Cloudinary

### 4.1 Replace Supabase Client with Direct PostgreSQL

Create `lib/database.ts`:

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export default pool;
```

### 4.2 Update API Routes

Example: Replace Supabase query with pg query

**Before (Supabase):**
```typescript
const { data } = await supabase
  .from('designs')
  .select('*, clients(name)')
  .order('display_order');
```

**After (pg):**
```typescript
import pool from '@/lib/database';

const result = await pool.query(`
  SELECT d.*, c.name as client_name
  FROM designs d
  LEFT JOIN clients c ON d.client_id = c.id
  ORDER BY d.display_order
`);
const designs = result.rows;
```

### 4.3 Update Image Upload Handler

In `components/ProductionStatusBoard.tsx`, replace Supabase upload:

**Before:**
```typescript
const { error } = await supabase.storage
  .from('design-images')
  .upload(filePath, file);
```

**After:**
```typescript
import { uploadImage } from '@/lib/cloudinary';

const imageUrl = await uploadImage(file);
newImageUrls.push(imageUrl);
```

---

## Phase 5: Deploy Next.js to Railway

### 5.1 Create Railway Service for Next.js

1. In Railway project, click **+ New**
2. Select **GitHub Repo**
3. Connect your repository
4. Railway auto-detects Next.js and configures:
   - Build command: `npm run build`
   - Start command: `npm start`
   - Port: 3000

### 5.2 Configure Environment Variables

In Railway Next.js service → **Variables** tab, add:

```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Reference Railway Postgres
NODE_ENV=production
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Variable Reference Syntax:**
- Railway allows referencing other services: `${{Postgres.DATABASE_URL}}`
- This auto-connects your Next.js app to the database

### 5.3 Deploy

1. Railway automatically deploys on Git push
2. First deployment may take 3-5 minutes
3. Railway provides a public URL: `divadaulti-production.up.railway.app`

### 5.4 Custom Domain (Optional)

1. Go to Next.js service → **Settings** → **Public Networking**
2. Click **Generate Domain** or **Custom Domain**
3. Add your domain: `divadaulti.com`
4. Update DNS records as shown

---

## Phase 6: Migrate Images from Supabase to Cloudinary

Create `migrate_images.js`:

```javascript
const cloudinary = require('cloudinary').v2;
const pool = require('./lib/database').default;
const fetch = require('node-fetch');

cloudinary.config({
  cloud_name: 'YOUR_CLOUD_NAME',
  api_key: 'YOUR_API_KEY',
  api_secret: 'YOUR_API_SECRET'
});

async function migrateImages() {
  const result = await pool.query('SELECT id, images FROM designs WHERE images IS NOT NULL');
  const designs = result.rows;
  
  for (const design of designs) {
    if (!design.images || design.images.length === 0) continue;
    
    const newImageUrls = [];
    
    for (const oldUrl of design.images) {
      try {
        // Download from Supabase
        const response = await fetch(oldUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: 'design-images' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });
        
        newImageUrls.push(result.secure_url);
        console.log(`✅ Migrated: ${oldUrl} → ${result.secure_url}`);
      } catch (error) {
        console.error(`❌ Failed to migrate ${oldUrl}:`, error);
        newImageUrls.push(oldUrl); // Keep old URL if migration fails
      }
    }
    
    // Update database with new URLs
    await pool.query(
      'UPDATE designs SET images = $1 WHERE id = $2',
      [newImageUrls, design.id]
    );
  }
  
  console.log('✅ Image migration complete');
  process.exit(0);
}

migrateImages().catch(console.error);
```

Run after Railway database is populated:
```bash
node migrate_images.js
```

---

## Cost Breakdown

### Railway Free Tier (Hobby Plan)
- **Database**: 512MB PostgreSQL (free)
- **Web Service**: 512MB RAM, 1 vCPU (free)
- **Execution Time**: 500 hours/month (free)
- **Egress**: 100GB/month (free)

**Upgrade to Developer Plan ($5/month):**
- 8GB RAM
- 8 vCPU
- Unlimited execution time
- 100GB egress

### Cloudinary Free Tier
- **Storage**: 25GB
- **Bandwidth**: 25GB/month
- **Transformations**: 25 credits/month

**Current Usage Estimate:**
- 168 designs × 3 images avg = 504 images
- Avg image size: 500KB
- Total: 504 × 0.5MB = ~250MB storage ✅ Well within free tier

---

## Monitoring & Logs

### Railway Logs
1. Click on service (Next.js or Postgres)
2. Go to **Logs** tab
3. Real-time streaming logs
4. Filter by level: Info, Warn, Error

### Database Monitoring
1. Click on PostgreSQL service
2. **Metrics** tab shows:
   - CPU usage
   - Memory usage
   - Connections
   - Query performance

---

## Backup Strategy

### Railway Postgres Backups
- Automatic daily backups (retained 7 days on free tier)
- Manual backup:
  ```bash
  railway run pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
  ```

### Cloudinary Backups
- Images automatically replicated across CDN
- Download all images:
  ```javascript
  const result = await cloudinary.api.resources({
    type: 'upload',
    prefix: 'design-images/',
    max_results: 500
  });
  // Download each result.resources[].secure_url
  ```

---

## Troubleshooting

### Database Connection Issues
```bash
# Test connection
railway run psql $DATABASE_URL
```

If connection fails:
- Check if DATABASE_URL is set in Railway variables
- Verify SSL settings in connection string
- Enable public networking in Railway (Settings → Public Networking)

### Image Upload Failures
- Check Cloudinary credentials are set
- Verify file size < 10MB
- Check Cloudinary dashboard for quota usage

### Build Failures
- Check Railway logs for error messages
- Verify `package.json` has correct build scripts
- Ensure all dependencies are in `dependencies` (not `devDependencies`)

---

## Next Steps After Deployment

1. ✅ Test all features:
   - Add client
   - Add design with images
   - Update stage status
   - Drag-drop reordering
   - Mark as completed

2. ✅ Set up monitoring:
   - Railway metrics
   - Cloudinary usage dashboard

3. ✅ Configure custom domain

4. ✅ Enable authentication (future):
   - Railway supports OAuth
   - Add login/logout to Next.js app

---

## Rollback Plan

If Railway deployment fails:

1. **Keep Netlify deployment active** during migration
2. **Test Railway on staging domain first**
3. **Switch DNS only after validation**
4. **Rollback**: Change DNS back to Netlify

---

**END OF DEPLOYMENT GUIDE**
