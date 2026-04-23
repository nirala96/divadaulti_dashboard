const { Pool } = require('pg');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
let DATABASE_URL = '';
envContent.split('\n').forEach(line => {
  if (line.startsWith('DATABASE_URL=')) {
    DATABASE_URL = line.replace('DATABASE_URL=', '').trim();
  }
});

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Starting financial columns migration...\n');
    
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
    console.log('✅ Created payment_status index');
    
    // Update existing designs
    await client.query(`
      UPDATE designs SET payment_status = 'not-set' WHERE price = 0 OR price IS NULL
    `);
    console.log('✅ Updated existing designs to not-set status');
    
    // Verify columns
    const result = await client.query(`
      SELECT 
        column_name, 
        data_type,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'designs' 
        AND column_name IN ('price', 'payment_received', 'payment_status', 'payment_date', 'notes_financial')
      ORDER BY column_name
    `);
    
    console.log('\n📋 Verified columns:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type})`);
    });
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
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
