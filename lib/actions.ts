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
