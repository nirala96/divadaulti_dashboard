import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyDashboardUser } from '@/lib/actions'
import { signSession } from '@/lib/auth'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'divadaulti2024'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Named login first, so a merchandiser's own username/password works.
    const user = username ? await verifyDashboardUser(username, password) : null
    if (user) {
      cookies().set('user-session', await signSession(user.username, user.role), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE,
      })
      return NextResponse.json({ success: true })
    }

    // Fall back to the original shared owner password, unchanged.
    if (password === ADMIN_PASSWORD) {
      cookies().set('admin-auth', ADMIN_PASSWORD, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE,
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
