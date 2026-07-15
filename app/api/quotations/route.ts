import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'
import { isAuthenticated } from '@/lib/apiAuth'

// Snapshots older than this fall off automatically - keeps the saved list
// to a rolling window instead of growing forever.
const RETENTION_SQL = "DELETE FROM quotation_snapshots WHERE saved_at < NOW() - INTERVAL '7 days'"

export async function GET() {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await pool.query(RETENTION_SQL)

  const result = await pool.query(
    'SELECT quote_no, customer_name, grand_total, saved_at FROM quotation_snapshots ORDER BY saved_at DESC'
  )
  return NextResponse.json(result.rows)
}

export async function POST(request: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = await request.json()
  const quoteNo: string | undefined = data?.quoteNo
  if (!quoteNo || !quoteNo.trim()) {
    return NextResponse.json({ error: 'quoteNo is required' }, { status: 400 })
  }

  await pool.query(RETENTION_SQL)

  await pool.query(
    `INSERT INTO quotation_snapshots (quote_no, customer_name, grand_total, data, saved_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (quote_no) DO UPDATE
       SET customer_name = EXCLUDED.customer_name,
           grand_total = EXCLUDED.grand_total,
           data = EXCLUDED.data,
           saved_at = NOW()`,
    [quoteNo.trim(), data.customerName || null, data.grandTotal || null, JSON.stringify(data)]
  )

  return NextResponse.json({ success: true })
}
