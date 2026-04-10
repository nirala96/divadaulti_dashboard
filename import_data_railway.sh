#!/bin/bash
# Import data from Supabase to Railway
# Run after setup_railway_db.sh completes

set -e

echo "📦 Import Data to Railway"
echo "========================="
echo ""

# Check if DATABASE_URL is provided
if [ -z "$1" ]; then
  echo "Please provide DATABASE_URL as argument"
  echo ""
  echo "Usage:"
  echo "  ./import_data_railway.sh 'postgresql://user:pass@host:port/db'"
  echo ""
  exit 1
fi

DATABASE_URL="$1"

echo "✅ DATABASE_URL received"
echo ""

# Export data from Supabase first
if [ ! -d "data" ]; then
  echo "📥 Exporting data from Supabase..."
  node scripts/export_supabase.js
  echo ""
fi

# Check if data files exist
if [ ! -f "data/clients.json" ]; then
  echo "❌ data/clients.json not found!"
  echo "Run export first: node scripts/export_supabase.js"
  exit 1
fi

echo "📤 Importing data to Railway..."
export DATABASE_URL="$DATABASE_URL"
node scripts/import_to_railway.js

echo ""
echo "✅ Data import complete!"
echo ""
echo "📊 Verify import:"
echo "  psql '$DATABASE_URL' -c 'SELECT COUNT(*) FROM clients;'"
echo "  psql '$DATABASE_URL' -c 'SELECT COUNT(*) FROM designs;'"
echo ""
echo "🖼️  Next step: Migrate images to Cloudinary"
echo ""
echo "1. Sign up at https://cloudinary.com"
echo "2. Get credentials from dashboard"
echo "3. Run: ./migrate_images_cloudinary.sh '<cloud_name>' '<api_key>' '<api_secret>' '$DATABASE_URL'"
