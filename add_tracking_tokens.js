/**
 * Add tracking_token column to clients table and generate tokens
 */
const { Pool } = require('pg');
const crypto = require('crypto');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:KWyEFivuqeFPSxsbdUfoUmBAkMPncnTb@shinkansen.proxy.rlwy.net:15926/railway';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function generateToken() {
  return crypto.randomBytes(16).toString('hex'); // 32 char random string
}

async function addTrackingTokens() {
  try {
    console.log('🔧 Adding tracking_token column to clients table...');
    
    // Add column if it doesn't exist
    await pool.query(`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS tracking_token TEXT UNIQUE
    `);
    
    console.log('✅ Column added');
    
    // Get all clients without tracking tokens
    const result = await pool.query(`
      SELECT id, name FROM clients 
      WHERE tracking_token IS NULL OR tracking_token = ''
    `);
    
    console.log(`\n📊 Found ${result.rows.length} clients without tracking tokens`);
    
    // Generate tokens for each client
    for (const client of result.rows) {
      const token = generateToken();
      await pool.query(
        'UPDATE clients SET tracking_token = $1 WHERE id = $2',
        [token, client.id]
      );
      console.log(`✅ ${client.name}: https://divadaultidashboard-production.up.railway.app/track/${token}`);
    }
    
    console.log('\n🎉 All clients now have tracking tokens!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

addTrackingTokens();
