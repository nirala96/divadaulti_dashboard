/**
 * Export all data from current Supabase instance
 * Run: node scripts/export_supabase.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase credentials
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function exportData() {
  console.log('🚀 Starting Supabase data export...\n');
  
  // Create data directory
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  try {
    // Export clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .order('display_order');
    
    if (clientsError) throw clientsError;
    fs.writeFileSync(
      path.join(dataDir, 'clients.json'),
      JSON.stringify(clients, null, 2)
    );
    console.log(`✅ Exported ${clients.length} clients`);
    
    // Export designs
    const { data: designs, error: designsError } = await supabase
      .from('designs')
      .select('*')
      .order('client_id, display_order');
    
    if (designsError) throw designsError;
    fs.writeFileSync(
      path.join(dataDir, 'designs.json'),
      JSON.stringify(designs, null, 2)
    );
    console.log(`✅ Exported ${designs.length} designs`);
    
    // Export work_points (optional - may not exist)
    let workPoints = [];
    const { data: wpData, error: workPointsError } = await supabase
      .from('work_points')
      .select('*');
    
    if (!workPointsError && wpData) {
      workPoints = wpData;
      console.log(`✅ Exported ${workPoints.length} work points`);
    } else {
      console.log(`⚠️  work_points table not found, skipping...`);
    }
    fs.writeFileSync(
      path.join(dataDir, 'workpoints.json'),
      JSON.stringify(workPoints, null, 2)
    );
    
    // Export workforce_settings
    const { data: settings, error: settingsError } = await supabase
      .from('workforce_settings')
      .select('*');
    
    if (settingsError) throw settingsError;
    fs.writeFileSync(
      path.join(dataDir, 'settings.json'),
      JSON.stringify(settings, null, 2)
    );
    console.log(`✅ Exported ${settings.length} workforce settings`);
    
    console.log('\n✅ Export complete! Files saved to data/ directory');
    console.log('\nNext steps:');
    console.log('1. Create Railway PostgreSQL database');
    console.log('2. Run railway_schema.sql to create tables');
    console.log('3. Run scripts/import_to_railway.js to import data');
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

exportData();
