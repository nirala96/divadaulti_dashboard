import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'
import { isAuthenticated } from '@/lib/apiAuth'

// Single shared planner (id = 1) holding the team and every order as JSONB,
// so the whole production floor sees the same board after a refresh.
// A 404 means nothing has been saved yet, so the client keeps its seed data.
async function ensureProductionPlannerTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS production_planner_state (
      id INTEGER PRIMARY KEY DEFAULT 1,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT production_planner_state_singleton CHECK (id = 1)
    )
  `)
}

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await ensureProductionPlannerTable()
  const result = await pool.query('SELECT data FROM production_planner_state WHERE id = 1')

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(result.rows[0].data)
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = await request.json()
  if (!Array.isArray(data?.tailors) || !Array.isArray(data?.tasks)) {
    return NextResponse.json({ error: 'Invalid planner data' }, { status: 400 })
  }

  await ensureProductionPlannerTable()
  await pool.query(
    `INSERT INTO production_planner_state (id, data, updated_at)
     VALUES (1, $1, NOW())
     ON CONFLICT (id) DO UPDATE
       SET data = EXCLUDED.data,
           updated_at = NOW()`,
    [JSON.stringify({ tailors: data.tailors, tasks: data.tasks })]
  )

  return NextResponse.json({ success: true })
}
