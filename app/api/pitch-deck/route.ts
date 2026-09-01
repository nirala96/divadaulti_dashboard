import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'
import { isAuthenticated } from '@/lib/apiAuth'

// Single shared document (id = 1) - everyone edits the same live copy.
// A 404 here means nothing has been saved yet, so the client falls back
// to the seed content baked into the page itself.
export async function GET() {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await pool.query('SELECT data FROM pitch_deck_state WHERE id = 1')

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(result.rows[0].data)
}

export async function POST(request: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = await request.json()

  await pool.query(
    `INSERT INTO pitch_deck_state (id, data, updated_at)
     VALUES (1, $1, NOW())
     ON CONFLICT (id) DO UPDATE
       SET data = EXCLUDED.data,
           updated_at = NOW()`,
    [JSON.stringify(data)]
  )

  return NextResponse.json({ success: true })
}
