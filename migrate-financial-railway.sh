#!/bin/bash
# Run this script on Railway to add financial columns to the database

echo "Running financial columns migration on Railway database..."
echo ""

# Run migration using Railway's DATABASE_URL environment variable
railway run node - <<'EOF'
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Starting migration...\n');
    
    // Add columns
    await client.query(`
      ALTER TABLE designs 
      ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS payment_received DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS payment_date DATE,
      ADD COLUMN IF NOT EXISTS notes_financial TEXT
    `);
    console.log('✅ Added financial columns');
    
    // Create index
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_designs_payment_status ON designs(payment_status)
    `);
    console.log('✅ Created index');
    
    // Update existing
    await client.query(`
      UPDATE designs SET payment_status = 'not-set' WHERE price = 0 OR price IS NULL
    `);
    console.log('✅ Updated existing designs');
    
    console.log('\n✅ Migration completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(err => {
  console.error(err);
  process.exit(1);
});
EOF

echo ""
echo "Migration complete! You can now use the Finance Dashboard."
