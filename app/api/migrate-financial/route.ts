import { NextResponse } from 'next/server'
import pool from '@/lib/database'

export async function GET() {
  try {
    const client = await pool.connect()
    
    try {
      // Add price column to clients table
      await client.query(`
        ALTER TABLE clients 
        ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0
      `)
      
      // Verify column
      const result = await client.query(`
        SELECT 
          column_name, 
          data_type,
          column_default
        FROM information_schema.columns
        WHERE table_name = 'clients' 
          AND column_name = 'price'
        ORDER BY column_name
      `)
      
      return NextResponse.json({
        success: true,
        message: 'Price column added to clients table successfully',
        columns: result.rows
      })
      
    } finally {
      client.release()
    }
    
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
