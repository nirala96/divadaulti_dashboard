/**
 * Server Actions for Database Operations
 * These run on the server and can use PostgreSQL directly
 */

'use server'

import pool from '@/lib/database'
import { revalidatePath } from 'next/cache'

export type Client = {
  id: string
  name: string
  contact_person: string
  email: string
  phone: string | null
  display_order: number
  created_at: string
  tracking_token: string
}

export type Design = {
  id: string
  client_id: string
  title: string
  type: 'Sampling' | 'Production'
  quantity: number
  status: string
  notes: string | null
  images: string[] | null
  stage_status: Record<string, string>
  start_date: string | null
  end_date: string | null
  display_order: number
  is_priority: boolean
  created_at: string
  client_name?: string
}

export type WorkPoint = {
  id: string
  title: string
  description: string | null
  status: string
  created_at: string
}

// Clients
export async function getClients(): Promise<Client[]> {
  const result = await pool.query(`
    SELECT * FROM clients ORDER BY display_order
  `)
  return result.rows
}

export async function addClient(data: {
  name: string
  contact_person: string
  email: string
  phone?: string
}) {
  const result = await pool.query(
    `INSERT INTO clients (name, contact_person, email, phone, display_order)
     VALUES ($1, $2, $3, $4, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM clients))
     RETURNING *`,
    [data.name, data.contact_person, data.email, data.phone || null]
  )
  revalidatePath('/')
  return result.rows[0]
}

export async function updateClientOrder(id: string, display_order: number) {
  await pool.query(
    'UPDATE clients SET display_order = $1 WHERE id = $2',
    [display_order, id]
  )
  revalidatePath('/')
}

// Designs
export async function getDesignsWithClients(): Promise<Design[]> {
  const result = await pool.query(`
    SELECT 
      d.*,
      c.name as client_name
    FROM designs d
    LEFT JOIN clients c ON d.client_id = c.id
    ORDER BY c.display_order, d.display_order
  `)
  return result.rows
}

export async function getDesignsByClient(clientId: string): Promise<Design[]> {
  const result = await pool.query(
    `SELECT * FROM designs WHERE client_id = $1 ORDER BY display_order`,
    [clientId]
  )
  return result.rows
}

export async function addDesign(data: {
  client_id: string
  title: string
  type: 'Sampling' | 'Production'
  quantity: number
  status: string
  notes?: string
  images?: string[]
}) {
  const result = await pool.query(
    `INSERT INTO designs (
      client_id, title, type, quantity, status, notes, images, 
      stage_status, display_order
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 
      (SELECT COALESCE(MAX(display_order), 0) + 1 FROM designs WHERE client_id = $1)
    )
    RETURNING *`,
    [
      data.client_id,
      data.title,
      data.type,
      data.quantity,
      data.status,
      data.notes || null,
      data.images || null,
      JSON.stringify({ [data.status]: 'in-progress' })
    ]
  )
  revalidatePath('/')
  return result.rows[0]
}

export async function updateDesignStageStatus(
  designId: string,
  stage: string,
  status: string
) {
  await pool.query(
    `UPDATE designs 
     SET stage_status = jsonb_set(
       COALESCE(stage_status, '{}'::jsonb), 
       $2::text[], 
       $3::jsonb
     )
     WHERE id = $1`,
    [designId, `{${stage}}`, JSON.stringify(status)]
  )
  revalidatePath('/')
}

export async function updateDesignNotes(
  designId: string,
  notes: string,
  images?: string[]
) {
  const updateQuery = images
    ? 'UPDATE designs SET notes = $1, images = $2 WHERE id = $3'
    : 'UPDATE designs SET notes = $1 WHERE id = $2'
  
  const params = images
    ? [notes, images, designId]
    : [notes, designId]
  
  await pool.query(updateQuery, params)
  revalidatePath('/')
}

export async function updateDesignOrder(id: string, display_order: number) {
  await pool.query(
    'UPDATE designs SET display_order = $1 WHERE id = $2',
    [display_order, id]
  )
  revalidatePath('/')
}

export async function updateDesignImages(designId: string, images: string[]) {
  await pool.query(
    'UPDATE designs SET images = $1 WHERE id = $2',
    [images, designId]
  )
  revalidatePath('/')
}

export async function updateDesignStatus(designId: string, status: string) {
  await pool.query(
    'UPDATE designs SET status = $1 WHERE id = $2',
    [status, designId]
  )
  revalidatePath('/')
  revalidatePath('/orders')
  revalidatePath('/completed-orders')
}

export async function updateDesignPriority(designId: string, isPriority: boolean) {
  await pool.query(
    'UPDATE designs SET is_priority = $1 WHERE id = $2',
    [isPriority, designId]
  )
  revalidatePath('/')
}

export async function deleteDesign(designId: string) {
  await pool.query('DELETE FROM designs WHERE id = $1', [designId])
  revalidatePath('/')
  revalidatePath('/orders')
  revalidatePath('/completed-orders')
}

export async function completeDesign(designId: string) {
  // Set all stages to completed
  const allStages = {
    'Payment Received': 'completed',
    'Fabric Finalize': 'completed',
    'Pattern': 'completed',
    'Grading': 'completed',
    'Cutting': 'completed',
    'Stitching': 'completed',
    'Dye': 'completed',
    'Print': 'completed',
    'Embroidery': 'completed',
    'Wash': 'completed',
    'Kaaj': 'completed',
    'Finishing': 'completed',
    'Photoshoot': 'completed',
    'Final Settlement': 'completed',
    'Dispatch': 'completed'
  }
  
  await pool.query(
    `UPDATE designs 
     SET stage_status = $1, status = 'Dispatch'
     WHERE id = $2`,
    [JSON.stringify(allStages), designId]
  )
  revalidatePath('/')
}

// Work Points
export async function getWorkPoints(): Promise<WorkPoint[]> {
  const result = await pool.query(`
    SELECT * FROM work_points ORDER BY created_at DESC
  `)
  return result.rows
}

export async function addWorkPoint(data: {
  title: string
  description?: string
  status?: string
}) {
  const result = await pool.query(
    `INSERT INTO work_points (title, description, status)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [data.title, data.description || null, data.status || 'todo']
  )
  revalidatePath('/work-points')
  return result.rows[0]
}

export async function updateWorkPointStatus(id: string, status: string) {
  await pool.query(
    'UPDATE work_points SET status = $1 WHERE id = $2',
    [status, id]
  )
  revalidatePath('/work-points')
}

export async function deleteWorkPoint(id: string) {
  await pool.query('DELETE FROM work_points WHERE id = $1', [id])
  revalidatePath('/work-points')
}

// Tasks (for Work Points page)
export type Task = {
  id: string
  title: string
  description: string | null
  assigned_to: 'Arun' | 'Allish' | 'Nirjara' | null
  completed: boolean
  completed_at: string | null
  images: string[] | null
  display_order: number
  created_at: string
}

export async function getTasks(): Promise<Task[]> {
  const result = await pool.query(`
    SELECT * FROM tasks 
    ORDER BY display_order ASC NULLS LAST, created_at ASC
  `)
  return result.rows
}

export async function addTask(data: {
  title: string
  description?: string
  assigned_to?: 'Arun' | 'Allish' | 'Nirjara'
  images?: string[]
  display_order?: number
}) {
  const result = await pool.query(
    `INSERT INTO tasks (title, description, assigned_to, images, display_order, completed)
     VALUES ($1, $2, $3, $4, $5, FALSE)
     RETURNING *`,
    [
      data.title,
      data.description || null,
      data.assigned_to || null,
      data.images || null,
      data.display_order ?? 0
    ]
  )
  revalidatePath('/work-points')
  return result.rows[0]
}

export async function updateTask(id: string, data: {
  title?: string
  description?: string
  assigned_to?: 'Arun' | 'Allish' | 'Nirjara' | null
  images?: string[]
  completed?: boolean
  completed_at?: string | null
  display_order?: number
}) {
  const updates: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (data.title !== undefined) {
    updates.push(`title = $${paramIndex}`)
    values.push(data.title)
    paramIndex++
  }
  if (data.description !== undefined) {
    updates.push(`description = $${paramIndex}`)
    values.push(data.description || null)
    paramIndex++
  }
  if (data.assigned_to !== undefined) {
    updates.push(`assigned_to = $${paramIndex}`)
    values.push(data.assigned_to)
    paramIndex++
  }
  if (data.images !== undefined) {
    updates.push(`images = $${paramIndex}`)
    values.push(data.images)
    paramIndex++
  }
  if (data.completed !== undefined) {
    updates.push(`completed = $${paramIndex}`)
    values.push(data.completed)
    paramIndex++
  }
  if (data.completed_at !== undefined) {
    updates.push(`completed_at = $${paramIndex}`)
    values.push(data.completed_at)
    paramIndex++
  }
  if (data.display_order !== undefined) {
    updates.push(`display_order = $${paramIndex}`)
    values.push(data.display_order)
    paramIndex++
  }

  if (updates.length === 0) return

  values.push(id)
  await pool.query(
    `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
    values
  )
  revalidatePath('/work-points')
}

export async function deleteTask(id: string) {
  await pool.query('DELETE FROM tasks WHERE id = $1', [id])
  revalidatePath('/work-points')
}

// Completed Orders
export async function getCompletedDesigns(): Promise<Design[]> {
  const result = await pool.query(`
    SELECT 
      d.*,
      c.name as client_name
    FROM designs d
    LEFT JOIN clients c ON d.client_id = c.id
    WHERE d.status = 'Dispatch'
    ORDER BY d.end_date DESC
  `)
  return result.rows
}

export async function restoreDesign(designId: string) {
  // Reset all stages to vacant and status to Payment Received
  const vacantStageStatus = {
    'Payment Received': 'vacant',
    'Fabric Finalize': 'vacant',
    'Pattern': 'vacant',
    'Grading': 'vacant',
    'Cutting': 'vacant',
    'Stitching': 'vacant',
    'Dye': 'vacant',
    'Print': 'vacant',
    'Embroidery': 'vacant',
    'Wash': 'vacant',
    'Kaaj': 'vacant',
    'Finishing': 'vacant',
    'Photoshoot': 'vacant',
    'Final Settlement': 'vacant',
    'Dispatch': 'vacant'
  }
  
  await pool.query(
    `UPDATE designs 
     SET stage_status = $1, status = 'Payment Received'
     WHERE id = $2`,
    [JSON.stringify(vacantStageStatus), designId]
  )
  revalidatePath('/completed-orders')
  revalidatePath('/')
}

export async function updateDesignDates(designId: string, startDate: string, endDate: string) {
  await pool.query(
    'UPDATE designs SET start_date = $1, end_date = $2 WHERE id = $3',
    [startDate, endDate, designId]
  )
  revalidatePath('/timeline')
  revalidatePath('/')
}

// Workforce Settings
export async function getWorkforceSettings() {
  const result = await pool.query('SELECT * FROM workforce_settings LIMIT 1')
  return result.rows[0] || { daily_unit_capacity: 10 }
}

export async function getDesignCount(): Promise<number> {
  const result = await pool.query('SELECT COUNT(*) as count FROM designs')
  return parseInt(result.rows[0].count)
}

// Timeline Calculation
export interface TimelineResult {
  start_date: string
  end_date: string
  total_days: number
}

export async function calculateTimeline(
  quantity: number,
  type: 'Sampling' | 'Production'
): Promise<TimelineResult> {
  try {
    // 1. Fetch workforce capacity
    const settings = await getWorkforceSettings()
    const dailyCapacity = settings?.daily_unit_capacity || 10

    // 2. Calculate total duration
    let totalDays = 0

    if (type === 'Sampling') {
      // Sampling orders: flat 2 weeks (14 days) for all samples
      totalDays = 14
    } else {
      // Production orders: calculate based on quantity and capacity
      const daysPerStage = Math.ceil(quantity / dailyCapacity)
      totalDays = daysPerStage * 15 // 15 stages in the workflow
    }

    // Ensure minimum 1 day
    if (totalDays < 1) totalDays = 1

    // 3. Find queue position based on capacity
    const queueCount = await getDesignCount()

    // 4. Calculate start_date based on queue position and capacity
    let startDate: Date
    const currentQueuePosition = queueCount || 0
    const daysToWait = Math.floor(currentQueuePosition / dailyCapacity)
    
    startDate = new Date()
    startDate.setDate(startDate.getDate() + daysToWait)

    // Calculate end_date
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + totalDays - 1)

    // Format dates as YYYY-MM-DD
    const formatDate = (date: Date): string => {
      return date.toISOString().split('T')[0]
    }

    return {
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
      total_days: totalDays,
    }
  } catch (error) {
    console.error('Error calculating timeline:', error)
    // Fallback: start today, duration based on type
    const today = new Date()
    const defaultDays = type === 'Sampling' ? 7 : 30
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + defaultDays - 1)

    return {
      start_date: today.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      total_days: defaultDays,
    }
  }
}

// Client Tracking (Public - for clients to view their orders)
export type ClientTrackingData = {
  client: Client & { tracking_token: string }
  designs: Design[]
}

export async function getClientByTrackingToken(token: string): Promise<ClientTrackingData | null> {
  try {
    // Get client by tracking token
    const clientResult = await pool.query(
      'SELECT * FROM clients WHERE tracking_token = $1',
      [token]
    )
    
    if (clientResult.rows.length === 0) {
      return null
    }
    
    const client = clientResult.rows[0]
    
    // Get all designs for this client
    const designsResult = await pool.query(
      `SELECT * FROM designs 
       WHERE client_id = $1 
       AND status NOT IN ('Completed', 'Cancelled', 'Dispatched')
       ORDER BY is_priority DESC, created_at DESC`,
      [client.id]
    )
    
    return {
      client,
      designs: designsResult.rows
    }
  } catch (error) {
    console.error('Error fetching client by tracking token:', error)
    return null
  }
}
