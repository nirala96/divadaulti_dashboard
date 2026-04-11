#!/bin/bash
# Check if new deployment is live

echo "🔍 Checking production deployment..."
echo ""

# Check if the production site returns the new code (without supabase dependency)
response=$(curl -s "https://divadaultidashboard-production.up.railway.app")

if echo "$response" | grep -q "supabase"; then
    echo "❌ OLD CODE - Still has Supabase references"
    echo "⏳ Wait another minute and try again"
else
    echo "✅ NEW CODE - Supabase removed!"
    echo "🎉 Safe to test image uploads now"
fi

echo ""
echo "Current Railway deployment:"
railway status
