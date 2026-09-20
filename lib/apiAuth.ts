import { cookies } from 'next/headers'
import { verifySession } from '@/lib/auth'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'divadaulti2024'

// Route Handlers under /api are not covered by middleware.ts (it exempts
// the whole /api prefix), so any handler touching sensitive data must check
// the same cookies the page middleware relies on - the shared admin-auth
// cookie, or a named user's signed session cookie.
export async function isAuthenticated(): Promise<boolean> {
  if (cookies().get('admin-auth')?.value === ADMIN_PASSWORD) return true
  const username = await verifySession(cookies().get('user-session')?.value)
  return !!username
}
