/**
 * Timeline utility functions
 * Pure functions with no database dependencies
 */

export interface TimelineResult {
  start_date: string
  end_date: string
  total_days: number
}

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
