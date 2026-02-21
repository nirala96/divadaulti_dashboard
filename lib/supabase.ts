import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Client = {
  id: string
  name: string
  contact_person: string
  email: string
  created_at: string
}

export type DesignStatus = 
  | 'Sourcing' 
  | 'Pattern' 
  | 'Grading' 
  | 'Cutting' 
  | 'Stitching' 
  | 'Photoshoot' 
  | 'Dispatch'

export type DesignType = 'Sampling' | 'Production'

export type Design = {
  id: string
  client_id: string
  title: string
  type: DesignType
  quantity: number
  status: DesignStatus
  images: string[]
  created_at: string
  start_date?: string | null
  end_date?: string | null
  estimated_days?: {
    sourcing?: number
    pattern?: number
    grading?: number
    cutting?: number
    stitching?: number
    photoshoot?: number
    dispatch?: number
  }
}

export type WorkforceSettings = {
  id: string
  daily_unit_capacity: number
}
