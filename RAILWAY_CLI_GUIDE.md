# Railway CLI Deployment Guide

Complete terminal-based deployment using Railway CLI.

---

## Prerequisites

✅ Railway CLI installed: `brew install railway`  
✅ Cloudinary account: https://cloudinary.com  
✅ Git repo connected to GitHub  

---

## Quick Deploy (Automated)

Run the automated script:

```bash
chmod +x deploy_railway.sh
./deploy_railway.sh
```

**OR** follow manual steps below for more control.

---

## Manual Deployment Steps

### 1. Login to Railway

```bash
railway login
```

Opens browser for authentication. Sign in with GitHub.

---

### 2. Initialize Project

**Option A: Create New Project**
```bash
railway init
# Enter project name: divadaulti-production
```

**Option B: Link Existing Project**
```bash
railway link
# Select project from list
```

Verify:
```bash
railway status
```

---

### 3. Add PostgreSQL Database

```bash
railway add --database postgres
```

Wait 30 seconds for provisioning, then verify:
```bash
railway variables
```

Should show `DATABASE_URL` and other Postgres variables.

---

### 4. Get Database URL

```bash
# Get all variables
railway variables

# Or get specific variable
railway variables get DATABASE_URL
```

Copy the `DATABASE_URL` for next steps.

---

### 5. Create Database Schema

```bash
# Use Railway's psql connection
railway run psql \$DATABASE_URL < railway_schema.sql
```

Verify tables created:
```bash
railway run psql \$DATABASE_URL -c "\dt+"
```

Should show: `clients`, `designs`, `work_points`, `workforce_settings`

---

### 6. Export Data from Supabase

```bash
node scripts/export_supabase.js
```

**Output:**
```
✅ Exported 59 clients
✅ Exported 168 designs
✅ Exported 61 work points
✅ Exported 1 workforce settings
```

Creates `data/` folder with JSON files.

---

### 7. Import Data to Railway

```bash
# Set DATABASE_URL from Railway
export DATABASE_URL=$(railway variables get DATABASE_URL)

# Run import
node scripts/import_to_railway.js
```

**Output:**
```
✅ Imported 59 clients
✅ Imported 168 designs
✅ Imported 61 work points
✅ Imported settings
```

Verify:
```bash
railway run psql \$DATABASE_URL -c "SELECT COUNT(*) FROM designs;"
```

Should show: 168

---

### 8. Setup Cloudinary Credentials

Sign up at https://cloudinary.com and get credentials from dashboard.

Add to `.env.local`:
```bash
echo "DATABASE_URL=$(railway variables get DATABASE_URL)" > .env.local
echo "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name" >> .env.local
echo "CLOUDINARY_API_KEY=your_api_key" >> .env.local
echo "CLOUDINARY_API_SECRET=your_api_secret" >> .env.local
```

---

### 9. Migrate Images to Cloudinary

```bash
# Load environment variables
source .env.local

# Run migration
node scripts/migrate_images.js
```

**Output:**
```
[1/168] Migrating images for: Design Name
  📥 Downloading: https://supabase...
  📤 Uploading to Cloudinary...
  ✅ Migrated: https://res.cloudinary.com...
  💾 Updated database

✅ Successfully migrated: 504 images
```

This takes 5-10 minutes depending on image count.

---

### 10. Set Railway Environment Variables

```bash
# Database
railway variables set DATABASE_URL=$(railway variables get DATABASE_URL)

# Node environment
railway variables set NODE_ENV=production

# Cloudinary
railway variables set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
railway variables set CLOUDINARY_API_KEY=your_api_key
railway variables set CLOUDINARY_API_SECRET=your_api_secret
```

Verify:
```bash
railway variables
```

---

### 11. Deploy Application

**Deploy current directory:**
```bash
railway up
```

**Or link GitHub and deploy:**
```bash
# Connect to GitHub repo
railway link

# Trigger deployment
railway deploy
```

Railway auto-detects Next.js and runs:
- `npm install`
- `npm run build`
- `npm start`

---

### 12. Monitor Deployment

**View logs:**
```bash
railway logs
```

**Follow logs in real-time:**
```bash
railway logs -f
```

**Check status:**
```bash
railway status
```

---

### 13. Get Deployment URL

**Generate public domain:**
```bash
railway domain
```

Railway provides: `https://divadaulti-production.up.railway.app`

**Or add custom domain:**
```bash
railway domain add divadaulti.com
```

Follow DNS instructions shown.

---

## Post-Deployment Testing

### Test Database Connection

```bash
railway run psql \$DATABASE_URL -c "SELECT COUNT(*) FROM designs;"
```

### Test Application

```bash
# Open in browser
railway open

# Or visit URL
open https://your-app.up.railway.app
```

**Test checklist:**
- ✅ Dashboard loads
- ✅ Clients display
- ✅ Designs show with images
- ✅ Click design to edit
- ✅ Upload new image (tests Cloudinary)
- ✅ Update stage status
- ✅ Drag-drop client reordering
- ✅ Filter by type
- ✅ Mark design as complete

---

## Useful Railway CLI Commands

### Logs & Monitoring

```bash
# View recent logs
railway logs

# Follow logs in real-time
railway logs -f

# Filter logs by service
railway logs --service web
railway logs --service postgres

# Export logs
railway logs > deployment.log
```

### Variables

```bash
# List all variables
railway variables

# Get specific variable
railway variables get DATABASE_URL

# Set variable
railway variables set KEY=value

# Delete variable
railway variables delete KEY
```

### Database

```bash
# Connect to psql
railway run psql \$DATABASE_URL

# Run SQL file
railway run psql \$DATABASE_URL < schema.sql

# Run SQL command
railway run psql \$DATABASE_URL -c "SELECT * FROM clients LIMIT 5;"

# Backup database
railway run pg_dump \$DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### Deployments

```bash
# Deploy current directory
railway up

# Redeploy
railway deploy

# Rollback to previous deployment
railway rollback
```

### Project Management

```bash
# Open Railway dashboard
railway open

# Show project info
railway status

# Link different project
railway link

# Unlink project
railway unlink
```

### Domains

```bash
# Show current domain
railway domain

# Add custom domain
railway domain add yourdomain.com

# Remove domain
railway domain remove
```

---

## Troubleshooting

### "railway: command not found"

```bash
brew install railway
```

### Cannot connect to database

```bash
# Verify DATABASE_URL exists
railway variables get DATABASE_URL

# Test connection
railway run psql \$DATABASE_URL -c "SELECT 1;"
```

### Deployment fails

```bash
# Check logs
railway logs

# Common issues:
# 1. Missing environment variables
railway variables

# 2. Build errors
railway logs | grep "error"

# 3. Port issues (Railway uses PORT env var)
# Ensure Next.js uses: process.env.PORT || 3000
```

### Images not uploading

```bash
# Verify Cloudinary credentials
railway variables | grep CLOUDINARY

# Test Cloudinary connection
node -e "const c = require('cloudinary').v2; c.config({cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET}); c.api.ping().then(r => console.log('✅ Cloudinary connected'));"
```

---

## Rollback Plan

If deployment fails:

```bash
# 1. Rollback on Railway
railway rollback

# 2. Check previous deployments
railway status

# 3. Redeploy specific commit
git checkout <commit-hash>
railway up
```

Keep Netlify/Supabase active until Railway is validated!

---

## Cost Monitoring

```bash
# View usage (available in dashboard)
railway open

# Check metrics:
# - CPU usage
# - Memory usage
# - Network egress
# - Active time
```

**Free tier limits:**
- 512MB RAM
- 500 hours/month execution
- $5 credit/month

---

## Next Steps

1. **Setup Monitoring:**
   ```bash
   railway metrics
   ```

2. **Enable Auto-Deploy on Push:**
   - Railway auto-detects GitHub commits
   - Every push to `main` triggers deploy

3. **Add Custom Domain:**
   ```bash
   railway domain add divadaulti.com
   ```

4. **Setup Backups:**
   ```bash
   # Daily backup cron (run locally)
   railway run pg_dump \$DATABASE_URL > backup.sql
   ```

5. **Update Code:**
   - Replace Supabase calls with PostgreSQL
   - Replace storage uploads with Cloudinary
   - (I can help with this next!)

---

## Quick Reference

```bash
# Login
railway login

# Deploy
railway up

# Logs
railway logs -f

# Database
railway run psql \$DATABASE_URL

# Variables
railway variables

# Status
railway status

# Dashboard
railway open
```

---

**Support:** Run `railway help` or visit https://docs.railway.app
