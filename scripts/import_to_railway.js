/**
 * Import exported data to Railway PostgreSQL
 * Prerequisites:
 *   1. Railway PostgreSQL provisioned
 *   2. railway_schema.sql executed
 *   3. Data exported via export_supabase.js
 * 
 * Run: DATABASE_URL="postgresql://..." node scripts/import_to_railway.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Railway database connection
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function importData() {
  console.log('🚀 Starting Railway data import...\n');
  
  const dataDir = path.join(__dirname, '../data');
  
  // Check if data files exist
  const requiredFiles = ['clients.json', 'designs.json', 'workpoints.json', 'settings.json'];
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(dataDir, file))) {
      console.error(`❌ Missing ${file}. Run export_supabase.js first.`);
      process.exit(1);
    }
  }
  
  try {
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL\n');
    
    // Read exported data
    const clients = JSON.parse(fs.readFileSync(path.join(dataDir, 'clients.json')));
    const designs = JSON.parse(fs.readFileSync(path.join(dataDir, 'designs.json')));
    const workPoints = JSON.parse(fs.readFileSync(path.join(dataDir, 'workpoints.json')));
    const settings = JSON.parse(fs.readFileSync(path.join(dataDir, 'settings.json')));
    
    // Import clients (preserve UUIDs for relationships)
    console.log('Importing clients...');
    for (const c of clients) {
      // Handle NULL values with defaults
      const contactPerson = c.contact_person || 'N/A';
      const email = c.email || `${c.id}@example.com`; // Generate unique email if missing
      
      await client.query(
        `INSERT INTO clients (id, name, contact_person, email, phone, display_order, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         contact_person = EXCLUDED.contact_person,
         email = EXCLUDED.email,
         phone = EXCLUDED.phone,
         display_order = EXCLUDED.display_order`,
        [c.id, c.name, contactPerson, email, c.phone, c.display_order, c.created_at]
      );
    }
    console.log(`✅ Imported ${clients.length} clients\n`);
    
    // Import designs (preserve UUIDs and client relationships)
    console.log('Importing designs...');
    for (const d of designs) {
      await client.query(
        `INSERT INTO designs (id, client_id, title, type, quantity, status, notes, images, stage_status, start_date, end_date, display_order, is_priority, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         type = EXCLUDED.type,
         quantity = EXCLUDED.quantity,
         status = EXCLUDED.status,
         notes = EXCLUDED.notes,
         images = EXCLUDED.images,
         stage_status = EXCLUDED.stage_status,
         start_date = EXCLUDED.start_date,
         end_date = EXCLUDED.end_date,
         display_order = EXCLUDED.display_order,
         is_priority = EXCLUDED.is_priority`,
        [
          d.id, d.client_id, d.title, d.type, d.quantity, d.status,
          d.notes, d.images, d.stage_status, d.start_date, d.end_date,
          d.display_order, d.is_priority, d.created_at
        ]
      );
    }
    console.log(`✅ Imported ${designs.length} designs\n`);
    
    // Import work_points
    console.log('Importing work points...');
    for (const w of workPoints) {
      await client.query(
        `INSERT INTO work_points (id, title, description, status, created_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         status = EXCLUDED.status`,
        [w.id, w.title, w.description, w.status, w.created_at]
      );
    }
    console.log(`✅ Imported ${workPoints.length} work points\n`);
    
    // Import workforce_settings
    console.log('Importing workforce settings...');
    if (settings.length > 0) {
      const s = settings[0];
      await client.query(
        `INSERT INTO workforce_settings (id, daily_unit_capacity)
         VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET
         daily_unit_capacity = EXCLUDED.daily_unit_capacity`,
        [s.id, s.daily_unit_capacity]
      );
    }
    console.log(`✅ Imported workforce settings\n`);
    
    // Verify import
    const { rows: clientCount } = await client.query('SELECT COUNT(*) FROM clients');
    const { rows: designCount } = await client.query('SELECT COUNT(*) FROM designs');
    
    console.log('\n📊 Import Summary:');
    console.log(`   Clients: ${clientCount[0].count}`);
    console.log(`   Designs: ${designCount[0].count}`);
    console.log(`   Work Points: ${workPoints.length}`);
    console.log(`   Settings: ${settings.length}`);
    
    console.log('\n✅ Import complete!');
    console.log('\nNext steps:');
    console.log('1. Setup Cloudinary account (https://cloudinary.com)');
    console.log('2. Run scripts/migrate_images.js to move images to Cloudinary');
    console.log('3. Update .env.local with Railway DATABASE_URL');
    console.log('4. Deploy to Railway');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

importData();
