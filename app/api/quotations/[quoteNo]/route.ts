import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'
import { isAuthenticated } from '@/lib/apiAuth'

export async function GET(
  request: NextRequest,
  { params }: { params: { quoteNo: string } }
) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await pool.query(
    'SELECT data FROM quotation_snapshots WHERE quote_no = $1',
    [decodeURIComponent(params.quoteNo)]
  )

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(result.rows[0].data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { quoteNo: string } }
) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await pool.query(
    'DELETE FROM quotation_snapshots WHERE quote_no = $1',
    [decodeURIComponent(params.quoteNo)]
  )

  return NextResponse.json({ success: true })
}
