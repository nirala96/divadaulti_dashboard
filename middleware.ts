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
  
  if (authCookie?.value === ADMIN_PASSWORD) {
    return NextResponse.next()
  }
  
  // Redirect to login if not authenticated
  if (pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
