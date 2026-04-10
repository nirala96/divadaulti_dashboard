#!/bin/bash
# Railway Deployment Script - Complete Terminal Workflow
# Run: chmod +x deploy_railway.sh && ./deploy_railway.sh

set -e  # Exit on error

echo "🚀 Railway Deployment - Terminal Workflow"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Login to Railway
echo -e "${BLUE}Step 1: Login to Railway${NC}"
echo "This will open your browser for authentication..."
railway login
echo -e "${GREEN}✅ Logged in${NC}\n"

# Step 2: Create new project or link existing
echo -e "${BLUE}Step 2: Create/Link Railway Project${NC}"
read -p "Do you have an existing Railway project? (y/n): " has_project

if [ "$has_project" = "y" ]; then
  echo "Linking to existing project..."
  railway link
else
  echo "Creating new project..."
  read -p "Project name (divadaulti-production): " project_name
  project_name=${project_name:-divadaulti-production}
  railway init --name "$project_name"
fi
echo -e "${GREEN}✅ Project linked${NC}\n"

# Step 3: Add PostgreSQL
echo -e "${BLUE}Step 3: Add PostgreSQL Database${NC}"
railway add --database postgres
echo "Waiting for database to provision (30 seconds)..."
sleep 30
echo -e "${GREEN}✅ PostgreSQL added${NC}\n"

# Step 4: Get database credentials
echo -e "${BLUE}Step 4: Getting Database Credentials${NC}"
DATABASE_URL=$(railway variables get DATABASE_URL 2>/dev/null || echo "")

if [ -z "$DATABASE_URL" ]; then
  echo -e "${YELLOW}⚠️  DATABASE_URL not found. Trying with service name...${NC}"
  DATABASE_URL=$(railway variables get DATABASE_URL --service postgres 2>/dev/null || echo "")
fi

if [ -z "$DATABASE_URL" ]; then
  echo -e "${YELLOW}⚠️  Could not auto-fetch DATABASE_URL${NC}"
  echo "Go to Railway dashboard and copy DATABASE_URL from Postgres service"
  read -p "Paste DATABASE_URL here: " DATABASE_URL
fi

echo "DATABASE_URL obtained"
echo -e "${GREEN}✅ Credentials retrieved${NC}\n"

# Step 5: Create database schema
echo -e "${BLUE}Step 5: Creating Database Schema${NC}"
echo "Running railway_schema.sql..."
railway run psql "$DATABASE_URL" < railway_schema.sql
echo -e "${GREEN}✅ Schema created${NC}\n"

# Step 6: Export data from Supabase
echo -e "${BLUE}Step 6: Exporting Data from Supabase${NC}"
node scripts/export_supabase.js
echo -e "${GREEN}✅ Data exported to data/ folder${NC}\n"

# Step 7: Import data to Railway
echo -e "${BLUE}Step 7: Importing Data to Railway${NC}"
export DATABASE_URL="$DATABASE_URL"
node scripts/import_to_railway.js
echo -e "${GREEN}✅ Data imported${NC}\n"

# Step 8: Setup Cloudinary
echo -e "${BLUE}Step 8: Cloudinary Configuration${NC}"
echo "Sign up at https://cloudinary.com if you haven't already"
echo ""
read -p "Enter Cloudinary Cloud Name: " CLOUDINARY_CLOUD_NAME
read -p "Enter Cloudinary API Key: " CLOUDINARY_API_KEY
read -p "Enter Cloudinary API Secret: " CLOUDINARY_API_SECRET
echo -e "${GREEN}✅ Cloudinary credentials saved${NC}\n"

# Step 9: Migrate images
echo -e "${BLUE}Step 9: Migrating Images to Cloudinary${NC}"
export NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="$CLOUDINARY_CLOUD_NAME"
export CLOUDINARY_API_KEY="$CLOUDINARY_API_KEY"
export CLOUDINARY_API_SECRET="$CLOUDINARY_API_SECRET"
node scripts/migrate_images.js
echo -e "${GREEN}✅ Images migrated${NC}\n"

# Step 10: Set Railway environment variables
echo -e "${BLUE}Step 10: Setting Railway Environment Variables${NC}"
railway variables set DATABASE_URL="$DATABASE_URL"
railway variables set NODE_ENV=production
railway variables set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="$CLOUDINARY_CLOUD_NAME"
railway variables set CLOUDINARY_API_KEY="$CLOUDINARY_API_KEY"
railway variables set CLOUDINARY_API_SECRET="$CLOUDINARY_API_SECRET"
echo -e "${GREEN}✅ Environment variables set${NC}\n"

# Step 11: Deploy
echo -e "${BLUE}Step 11: Deploying to Railway${NC}"
echo "This will trigger a build and deployment..."
railway up
echo -e "${GREEN}✅ Deployment initiated${NC}\n"

# Step 12: Get deployment URL
echo -e "${BLUE}Step 12: Getting Deployment URL${NC}"
sleep 10
RAILWAY_URL=$(railway domain 2>/dev/null || echo "Check Railway dashboard for URL")
echo "Your app will be available at: $RAILWAY_URL"
echo -e "${GREEN}✅ Deployment complete!${NC}\n"

# Summary
echo "=========================================="
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "✅ Database: PostgreSQL on Railway"
echo "✅ Images: Cloudinary"
echo "✅ App: Deployed to Railway"
echo ""
echo "Next steps:"
echo "1. Visit: $RAILWAY_URL"
echo "2. Test all features (clients, designs, images)"
echo "3. Setup custom domain: railway domain add <your-domain>"
echo "4. Monitor logs: railway logs"
echo ""
echo "Commands:"
echo "  railway logs          - View deployment logs"
echo "  railway logs -f       - Follow logs in real-time"
echo "  railway status        - Check service status"
echo "  railway open          - Open Railway dashboard"
echo ""
