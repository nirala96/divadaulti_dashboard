import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple password protection for admin routes
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'divadaulti2024'

export function middleware(request: NextRequest) {
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
  
  // Check if user is authenticated
  const authCookie = request.cookies.get('admin-auth')
  const isAuthenticated = authCookie?.value === ADMIN_PASSWORD

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

  if (isAuthenticated) {
    return NextResponse.next()
  }

  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
