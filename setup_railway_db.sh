#!/bin/bash
# Setup Railway Database Schema
# Run after PostgreSQL is added in Railway dashboard

set -e

echo "🗄️  Railway Database Setup"
echo "========================="
echo ""

# Check if DATABASE_URL is provided
if [ -z "$1" ]; then
  echo "Please provide DATABASE_URL as argument"
  echo ""
  echo "Get it from:"
  echo "1. Open: https://railway.com/project/d47fa477-a934-4662-a039-f5007b32e0fc"
  echo "2. Click PostgreSQL service → Variables tab → Copy DATABASE_URL"
  echo ""
  echo "Usage:"
  echo "  ./setup_railway_db.sh 'postgresql://user:pass@host:port/db'"
  echo ""
  exit 1
fi

DATABASE_URL="$1"

echo "✅ DATABASE_URL received"
echo ""

# Test connection
echo "Testing connection..."
psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Connection successful"
else
  echo "❌ Connection failed"
  echo ""
  echo "Make sure PostgreSQL client is installed:"
  echo "  brew install postgresql"
  exit 1
fi

echo ""
echo "Creating database schema..."
psql "$DATABASE_URL" < railway_schema.sql

echo ""
echo "✅ Database schema created!"
echo ""
echo "Tables created:"
psql "$DATABASE_URL" -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"

echo ""
echo "📊 Next step: Import data"
echo "Run: ./import_data_railway.sh '$DATABASE_URL'"
