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
