import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
    }

    const result = await pool.query(
      'SELECT tracking_token FROM clients WHERE id = $1',
      [clientId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json({ trackingToken: result.rows[0].tracking_token })
  } catch (error) {
    console.error('Error fetching tracking token:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
