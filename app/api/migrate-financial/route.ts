import { NextResponse } from 'next/server'
import pool from '@/lib/database'

export async function GET() {
  try {
    const client = await pool.connect()
    
    try {
      // Add financial columns
      await client.query(`
        ALTER TABLE designs 
        ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS payment_received DECIMAL(10, 2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS payment_date DATE,
        ADD COLUMN IF NOT EXISTS notes_financial TEXT
      `)
      
      // Create index
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_designs_payment_status ON designs(payment_status)
      `)
      
      // Update existing designs
      await client.query(`
        UPDATE designs SET payment_status = 'not-set' 
        WHERE price = 0 OR price IS NULL
      `)
      
      // Verify columns
      const result = await client.query(`
        SELECT 
          column_name, 
          data_type
        FROM information_schema.columns
        WHERE table_name = 'designs' 
          AND column_name IN ('price', 'payment_received', 'payment_status', 'payment_date', 'notes_financial')
        ORDER BY column_name
      `)
      
      return NextResponse.json({
        success: true,
        message: 'Financial columns migration completed successfully',
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
