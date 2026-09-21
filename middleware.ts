import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth'
import { MERCHANDISER_ALLOWED_PATHS } from '@/lib/roles'

// Simple password protection for admin routes
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'divadaulti2024'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect all routes except /track/*, API routes, and PWA assets
  // (manifest/icons/service worker must always be fetchable so Chrome can
  // evaluate installability and Android can render the app icon, even
  // before the visitor has logged in)
  if (
    pathname.startsWith('/track') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/sw.js' ||
    pathname.startsWith('/icons')
  ) {
    return NextResponse.next()
  }

  // Two independent ways in: the original shared owner password
  // (admin-auth cookie, untouched, always full access), or a named login
  // (user-session cookie, a "<username>:<role>.<hmac>" token verified here
  // with no DB round-trip since Edge middleware can't reach Postgres).
  const isOwner = request.cookies.get('admin-auth')?.value === ADMIN_PASSWORD
  const session = isOwner ? null : await verifySession(request.cookies.get('user-session')?.value)
  const isAuthenticated = isOwner || !!session

  // The PWA manifest's start_url points here (rather than "/") specifically
  // because it must return 200 for a logged-out fetch: Android's real
  // "Install app" flow has Google's WebAPK service fetch start_url with no
  // cookies to verify and package the app, and "/" redirecting it to
  // /login broke that silently, so the app never actually installed. An
  // already-authenticated visitor just gets bounced straight through.
  if (pathname === '/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Merchandiser logins are fenced to a handful of pages. Owner and any
  // named "sales"/"admin" login are unrestricted.
  if (session?.role === 'merchandiser' && !MERCHANDISER_ALLOWED_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Identify who's making the request (and their role) so server actions
  // and the Sidebar can read it without re-verifying the session
  // themselves.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-actor-username', isOwner ? 'admin' : session!.username)
  requestHeaders.set('x-actor-role', isOwner ? 'admin' : session!.role)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
