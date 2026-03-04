import { supabase, type DesignType } from './supabase'

export interface TimelineResult {
  start_date: string
  end_date: string
  total_days: number
}

/**
 * Calculate timeline for a new design based on workforce capacity
 * @param quantity - Number of units for the design
 * @param type - Design type ('Sampling' or 'Production')
 * @returns Timeline with start_date, end_date, and total_days
 */
export async function calculateTimeline(
  quantity: number,
  type: DesignType
): Promise<TimelineResult> {
  try {
    // 1. Fetch workforce capacity
    const { data: settings, error: settingsError } = await supabase
      .from('workforce_settings')
      .select('daily_unit_capacity')
      .single()

    if (settingsError) {
      console.error('Error fetching workforce settings:', settingsError)
      throw new Error('Unable to fetch workforce capacity')
    }

    const dailyCapacity = settings?.daily_unit_capacity || 10

    // 2. Calculate total duration
    let totalDays = 0

    if (type === 'Sampling') {
      // Sampling orders: flat 2 weeks (14 days) for all samples
      totalDays = 14
    } else {
      // Production orders: calculate based on quantity and capacity
      // Formula: (quantity / daily_capacity) * number_of_stages
      const daysPerStage = Math.ceil(quantity / dailyCapacity)
      totalDays = daysPerStage * 12 // 12 stages in the new workflow
    }

    // Ensure minimum 1 day
    if (totalDays < 1) totalDays = 1

    // 3. Find the latest end_date from existing designs (FIFO logic)
    const { data: latestDesign, error: latestError } = await supabase
      .from('designs')
      .select('end_date')
      .order('end_date', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle()

    if (latestError) {
      console.error('Error fetching latest design:', latestError)
    }

    // 4. Calculate start_date and end_date
    let startDate: Date

    if (latestDesign?.end_date) {
      // Start after the last order ends
      startDate = new Date(latestDesign.end_date)
      startDate.setDate(startDate.getDate() + 1) // Start the next day
    } else {
      // No previous orders, start today
      startDate = new Date()
    }

    // Calculate end_date
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + totalDays - 1) // Subtract 1 because start day counts

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
}14

/**
 * Calculate duration for a specific stage based on quantity and capacity
 * @param quantity - Number of units
 * @param dailyCapacity - Units per day capacity
 * @returns Number of days required for the stage
 */
export function calculateStageDuration(
  quantity: number,
  dailyCapacity: number
): number {
  if (quantity <= 0 || dailyCapacity <= 0) return 1
  return Math.ceil(quantity / dailyCapacity)
}

/**
 * Format date for display
 * @param dateString - ISO date string
 * @returns Formatted date (e.g., "Feb 21, 2026")
 */
export function formatDisplayDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Not scheduled'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Calculate days between two dates
 * @param startDate - Start date string
 * @param endDate - End date string
 * @returns Number of days
 */
export function calculateDaysBetween(
  startDate: string,
  endDate: string
): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1 // Include both start and end days
}
