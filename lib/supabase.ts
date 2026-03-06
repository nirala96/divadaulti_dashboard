import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Client = {
  id: string
  name: string
  contact_person?: string | null
  email?: string | null
  created_at: string
}

export type DesignStatus = 
  | 'Payment Received'
  | 'Fabric Finalize'
  | 'Pattern' 
  | 'Grading' 
  | 'Cutting' 
  | 'Stitching'
  | 'Dye'
  | 'Print'
  | 'Embroidery'
  | 'Wash'
  | 'Kaaj'
  | 'Finishing'
  | 'Photoshoot'
  | 'Final Settlement'
  | 'Dispatch'

export type DesignType = 'Sampling' | 'Production'

export type StageState = 'vacant' | 'not-needed' | 'in-progress' | 'completed'

export type Design = {
  id: string
  client_id: string
  title: string
  type: DesignType
  quantity: number
  status: DesignStatus
  images: string[]
  notes: string
  stage_status: Record<DesignStatus, StageState>
  created_at: string
  start_date?: string | null
  end_date?: string | null
}

export type WorkforceSettings = {
  id: string
  daily_unit_capacity: number
}
