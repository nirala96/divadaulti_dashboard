/**
 * Migration Script: Add tasks table to Railway PostgreSQL
 * Run with: DATABASE_URL="your-connection-string" node add_tasks_table.js
 */

const { Pool } = require('pg');

// Read DATABASE_URL from environment or use the value from .env.local
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:KWyEFivuqeFPSxsbdUfoUmBAkMPncnTb@shinkansen.proxy.rlwy.net:15926/railway';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Creating tasks table...');
    
    // Create tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        assigned_to TEXT CHECK (assigned_to IN ('Arun', 'Allish', 'Nirjara')),
        completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMPTZ,
        images TEXT[],
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    console.log('✅ Tasks table created');
    
    // Create indexes
    console.log('🔄 Creating indexes...');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_display_order ON tasks(display_order)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)
    `);
    
    console.log('✅ Indexes created');
    
    // Create update trigger
    console.log('🔄 Creating update trigger...');
    
    await client.query(`
      CREATE OR REPLACE FUNCTION update_tasks_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS tasks_updated_at ON tasks
    `);
    
    await client.query(`
      CREATE TRIGGER tasks_updated_at
        BEFORE UPDATE ON tasks
        FOR EACH ROW
        EXECUTE FUNCTION update_tasks_updated_at()
    `);
    
    console.log('✅ Trigger created');
    
    // Verify
    const result = await client.query(`
      SELECT COUNT(*) as count FROM tasks
    `);
    
    console.log(`\n✅ Migration complete! Tasks table has ${result.rows[0].count} rows.`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
