/**
 * Railway PostgreSQL Database Connection
 * Replace Supabase client with direct PostgreSQL pool
 */

import { Pool } from 'pg';

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false,
  max: 20, // Maximum connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ Connected to Railway PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on database client', err);
  process.exit(-1);
});

export default pool;

// Helper functions for common queries

/**
 * Get all designs with client names (JOIN)
 */
export async function getDesignsWithClients() {
  const result = await pool.query(`
    SELECT 
      d.*,
      c.name as client_name,
      c.contact_person,
      c.email as client_email
    FROM designs d
    LEFT JOIN clients c ON d.client_id = c.id
    ORDER BY c.display_order, d.display_order
  `);
  return result.rows;
}

/**
 * Get all clients with their design count
 */
export async function getClientsWithDesignCount() {
  const result = await pool.query(`
    SELECT 
      c.*,
      COUNT(d.id) as design_count
    FROM clients c
    LEFT JOIN designs d ON c.id = d.client_id
    GROUP BY c.id
    ORDER BY c.display_order
  `);
  return result.rows;
}

/**
 * Update design stage status
 */
export async function updateDesignStage(designId: string, stage: string, status: string) {
  const result = await pool.query(
    `UPDATE designs 
     SET stage_status = jsonb_set(stage_status, $2, $3)
     WHERE id = $1
     RETURNING *`,
    [designId, `{${stage}}`, JSON.stringify(status)]
  );
  return result.rows[0];
}

/**
 * Update design display order (for drag-drop)
 */
export async function updateDisplayOrder(
  tableName: string,
  id: string,
  newOrder: number
) {
  const result = await pool.query(
    `UPDATE ${tableName} SET display_order = $1 WHERE id = $2 RETURNING *`,
    [newOrder, id]
  );
  return result.rows[0];
}
