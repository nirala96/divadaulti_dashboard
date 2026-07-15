import { cookies } from 'next/headers'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'divadaulti2024'

// Route Handlers under /api are not covered by middleware.ts (it exempts
// the whole /api prefix), so any handler touching sensitive data must check
// the same admin-auth cookie the page middleware relies on.
export function isAuthenticated(): boolean {
  return cookies().get('admin-auth')?.value === ADMIN_PASSWORD
}
