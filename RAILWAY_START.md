# Railway Terminal Deployment - Quick Commands

## ✅ Railway CLI Installed: v4.36.1

---

## 🚀 Two Options to Deploy

### Option 1: Automated Script (Easiest)
```bash
./deploy_railway.sh
```
Runs entire deployment automatically with prompts.

### Option 2: Manual Step-by-Step
Follow commands in `RAILWAY_CLI_GUIDE.md` for full control.

---

## 📋 Quick Start (Manual)

### 1. Login
```bash
railway login
```

### 2. Initialize Project
```bash
railway init
# Enter: divadaulti-production
```

### 3. Add Database
```bash
railway add --database postgres
```

### 4. Create Schema
```bash
railway run psql \$DATABASE_URL < railway_schema.sql
```

### 5. Export Supabase Data
```bash
node scripts/export_supabase.js
```

### 6. Import to Railway
```bash
export DATABASE_URL=$(railway variables get DATABASE_URL)
node scripts/import_to_railway.js
```

### 7. Setup Cloudinary
Get credentials from https://cloudinary.com dashboard
```bash
railway variables set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
railway variables set CLOUDINARY_API_KEY=your_api_key
railway variables set CLOUDINARY_API_SECRET=your_api_secret
```

### 8. Migrate Images
```bash
export NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
export CLOUDINARY_API_KEY=your_api_key
export CLOUDINARY_API_SECRET=your_api_secret
node scripts/migrate_images.js
```

### 9. Deploy
```bash
railway up
```

### 10. Get URL
```bash
railway domain
```

---

## 🔍 Essential Commands

```bash
railway login              # Authenticate
railway init               # Create new project
railway link               # Link existing project
railway up                 # Deploy
railway logs -f            # Watch logs
railway variables          # List env vars
railway status             # Check status
railway open               # Open dashboard
railway domain             # Get/manage URLs
```

---

## 🗂️ Files Created

- ✅ `deploy_railway.sh` - Automated deployment script
- ✅ `RAILWAY_CLI_GUIDE.md` - Complete manual guide
- ✅ `RAILWAY_DEPLOYMENT.md` - Full documentation
- ✅ `railway_schema.sql` - Database schema
- ✅ `scripts/export_supabase.js` - Export data
- ✅ `scripts/import_to_railway.js` - Import data
- ✅ `scripts/migrate_images.js` - Migrate images
- ✅ `lib/database.ts` - PostgreSQL helper
- ✅ `lib/cloudinary.ts` - Image upload helper

---

## ⏱️ Time Estimates

- Setup Railway: 2 min
- Database migration: 5 min
- Image migration: 10 min
- Deployment: 5 min
- **Total: ~20 minutes**

---

## 🆘 Need Help?

```bash
railway help                    # CLI help
railway logs                    # Check errors
railway variables               # Verify config
railway run psql \$DATABASE_URL # Test database
```

**Full Guides:**
- 📖 Complete guide: `RAILWAY_CLI_GUIDE.md`
- 📖 Detailed docs: `RAILWAY_DEPLOYMENT.md`

---

## 🎯 Next Step

Choose your path:

**For automatic deployment:**
```bash
./deploy_railway.sh
```

**For manual control:**
```bash
railway login
railway init
```

Then follow steps in `RAILWAY_CLI_GUIDE.md`
