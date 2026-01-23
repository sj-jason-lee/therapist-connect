import { NextResponse, type NextRequest } from 'next/server'

// Firebase Auth is client-side only, so we can't check auth in middleware
// Auth checks are done in client-side layouts using AuthContext

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const { pathname } = request.nextUrl

  // Set pathname header for components to access
  response.headers.set('x-pathname', pathname)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
