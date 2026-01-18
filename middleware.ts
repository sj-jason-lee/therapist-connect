import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes that don't require authentication
const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/api/auth/callback', '/terms', '/privacy']

// Routes that require specific user types
const therapistRoutes = ['/therapist']
const organizerRoutes = ['/organizer']
const adminRoutes = ['/admin']

export async function middleware(request: NextRequest) {
  const { response, user, supabase } = await updateSession(request)
  const { pathname } = request.nextUrl

  // Allow public routes
  const isPublicRoute = publicRoutes.some(route => {
    if (route === '/') {
      return pathname === '/'
    }
    return pathname === route || pathname.startsWith(route + '/')
  })

  if (isPublicRoute) {
    // If user is logged in and tries to access auth pages or homepage, redirect to dashboard
    if (user && (pathname === '/' || pathname === '/login' || pathname.startsWith('/register'))) {
      // Use metadata only to avoid database query delays
      const userType = user.user_metadata?.user_type || 'therapist'
      const dashboardUrl = `/${userType}`
      return NextResponse.redirect(new URL(dashboardUrl, request.url))
    }
    return response
  }

  // Check if user is authenticated for protected routes
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Use user metadata for role checking (faster, no DB query)
  // The page itself will handle profile creation if needed
  const userType = user.user_metadata?.user_type || 'therapist'

  // Check role-based access
  if (therapistRoutes.some(route => pathname.startsWith(route))) {
    if (userType !== 'therapist' && userType !== 'admin') {
      return NextResponse.redirect(new URL(`/${userType}`, request.url))
    }
  }

  if (organizerRoutes.some(route => pathname.startsWith(route))) {
    if (userType !== 'organizer' && userType !== 'admin') {
      return NextResponse.redirect(new URL(`/${userType}`, request.url))
    }
  }

  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (userType !== 'admin') {
      return NextResponse.redirect(new URL(`/${userType}`, request.url))
    }
  }

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
     * - api routes that don't need auth
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
