# Railway Deployment Quick Start

## Prerequisites
- ✅ Railway account (https://railway.app)
- ✅ Cloudinary account (https://cloudinary.com)
- ✅ Git repository connected

## Step 1: Export Data from Supabase

```bash
node scripts/export_supabase.js
```

This creates `data/` folder with:
- clients.json
- designs.json
- workpoints.json
- settings.json

## Step 2: Create Railway Project

1. Go to https://railway.app/new
2. Click **Empty Project**
3. Name: `divadaulti-production`

## Step 3: Add PostgreSQL Database

1. Click **+ New** → **Database** → **PostgreSQL**
2. Railway auto-provisions database
3. Click on PostgreSQL service → **Variables** tab
4. Copy `DATABASE_URL`

## Step 4: Create Schema

```bash
# Connect to Railway database
railway link  # Select your project
railway run psql $DATABASE_URL

# In psql:
\i railway_schema.sql
\q
```

Or use TablePlus/pgAdmin to connect and run `railway_schema.sql`

## Step 5: Import Data

```bash
export DATABASE_URL="postgresql://..." # Paste Railway DATABASE_URL
node scripts/import_to_railway.js
```

## Step 6: Setup Cloudinary

1. Sign up at https://cloudinary.com
2. Go to Dashboard
3. Copy credentials:
   - Cloud Name
   - API Key
   - API Secret

## Step 7: Migrate Images

Update `.env.local`:
```bash
DATABASE_URL=postgresql://...railway...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Run migration:
```bash
node scripts/migrate_images.js
```

## Step 8: Deploy Next.js to Railway

1. In Railway project, click **+ New**
2. Select **GitHub Repo**
3. Connect your repository
4. Railway auto-detects Next.js

Add environment variables:
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
NODE_ENV=production
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

5. Click **Deploy**

## Step 9: Get Public URL

1. Go to Next.js service → **Settings** → **Public Networking**
2. Click **Generate Domain**
3. Railway gives you: `yourapp.up.railway.app`

## Step 10: Test Deployment

Visit your Railway URL and test:
- ✅ Dashboard loads
- ✅ Clients/designs display
- ✅ Image upload works
- ✅ Stage updates work
- ✅ Drag-drop works

---

## Cost Estimate

**Railway Hobby (Free):**
- 512MB RAM
- 500 hours/month execution
- $5/month credit included

**Railway Developer ($5/month):**
- 8GB RAM
- Unlimited execution
- 100GB egress

**Cloudinary Free:**
- 25GB storage
- 25GB bandwidth/month

**Your usage:** ~250MB images + 5MB database = Well within free tiers ✅

---

## Troubleshooting

**Database connection failed:**
```bash
railway run psql $DATABASE_URL
# Test connection
```

**Image upload fails:**
- Check Cloudinary credentials in Railway variables
- Verify API keys are correct
- Check Cloudinary dashboard for quota

**Build fails:**
```bash
railway logs
# Check deployment logs
```

---

## Rollback Plan

1. Keep Supabase active during migration
2. Keep Netlify deployment live
3. Test Railway on staging domain first
4. Switch DNS only after validation

---

## Next Steps After Deployment

1. ✅ Configure custom domain
2. ✅ Setup monitoring (Railway Metrics)
3. ✅ Enable automatic backups
4. ✅ Add authentication (future)

---

**Support:** Check RAILWAY_DEPLOYMENT.md for detailed guide
