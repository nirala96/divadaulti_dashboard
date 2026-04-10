#!/bin/bash
# Migrate images from Supabase to Cloudinary
# Run after import_data_railway.sh completes

set -e

echo "🖼️  Migrate Images to Cloudinary"
echo "================================"
echo ""

# Check arguments
if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ] || [ -z "$4" ]; then
  echo "Please provide all Cloudinary credentials and DATABASE_URL"
  echo ""
  echo "Usage:"
  echo "  ./migrate_images_cloudinary.sh <cloud_name> <api_key> <api_secret> <database_url>"
  echo ""
  echo "Example:"
  echo "  ./migrate_images_cloudinary.sh 'mycloud' 'abc123' 'xyz789' 'postgresql://...'"
  echo ""
  echo "Get Cloudinary credentials:"
  echo "1. Go to https://cloudinary.com"
  echo "2. Sign up / Login"
  echo "3. Copy from dashboard:"
  echo "   - Cloud Name"
  echo "   - API Key"
  echo "   - API Secret"
  exit 1
fi

CLOUD_NAME="$1"
API_KEY="$2"
API_SECRET="$3"
DATABASE_URL="$4"

echo "✅ Credentials received"
echo "   Cloud Name: $CLOUD_NAME"
echo "   API Key: ${API_KEY:0:6}..."
echo ""

# Set environment variables
export NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="$CLOUD_NAME"
export CLOUDINARY_API_KEY="$API_KEY"
export CLOUDINARY_API_SECRET="$API_SECRET"
export DATABASE_URL="$DATABASE_URL"

echo "🚀 Starting image migration..."
echo "This may take 5-10 minutes depending on image count..."
echo ""

node scripts/migrate_images.js

echo ""
echo "✅ Image migration complete!"
echo ""
echo "🚀 Next step: Deploy to Railway"
echo ""
echo "In Railway Dashboard:"
echo "1. Open: https://railway.com/project/d47fa477-a934-4662-a039-f5007b32e0fc"
echo "2. Click '+ New' → 'GitHub Repo'"
echo "3. Connect your repository"
echo "4. Railway auto-detects Next.js"
echo "5. Go to Next.js service → Variables tab"
echo "6. Add these variables:"
echo "   DATABASE_URL: \${{Postgres.DATABASE_URL}}"
echo "   NODE_ENV: production"
echo "   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: $CLOUD_NAME"
echo "   CLOUDINARY_API_KEY: $API_KEY"
echo "   CLOUDINARY_API_SECRET: $API_SECRET"
echo "7. Deploy will start automatically"
echo ""
