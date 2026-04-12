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

    let result = await pool.query(
      'SELECT tracking_token FROM clients WHERE id = $1',
      [clientId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    let trackingToken = result.rows[0].tracking_token
    
    // If tracking token doesn't exist, generate one
    if (!trackingToken) {
      const crypto = require('crypto')
      trackingToken = crypto.randomBytes(16).toString('hex')
      
      await pool.query(
        'UPDATE clients SET tracking_token = $1 WHERE id = $2',
        [trackingToken, clientId]
      )
    }

    return NextResponse.json({ trackingToken })
  } catch (error) {
    console.error('Error fetching tracking token:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
