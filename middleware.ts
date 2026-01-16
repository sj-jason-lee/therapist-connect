import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes that don't require authentication
const publicRoutes = ['/', '/login', '/register', '/api/auth/callback']

// Routes that require specific user types
const therapistRoutes = ['/therapist']
const organizerRoutes = ['/organizer']
const adminRoutes = ['/admin']

export async function middleware(request: NextRequest) {
  const { response, user, supabase } = await updateSession(request)
  const { pathname } = request.nextUrl

  // Allow public routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith('/register/'))) {
    // If user is logged in and tries to access auth pages, redirect to dashboard
    if (user && (pathname === '/login' || pathname.startsWith('/register'))) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single()

      // Use profile user_type, fallback to metadata, then default to therapist
      const userType = profile?.user_type || user.user_metadata?.user_type || 'therapist'
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

  // Get user profile to check role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .single()

  // Fallback to user metadata if profile doesn't exist or query fails
  const userType = profile?.user_type || user.user_metadata?.user_type || 'therapist'

  if (profileError) {
    console.error('Middleware profile fetch error:', profileError)
  }

  // Create a virtual profile object for role checking
  const effectiveProfile = { user_type: userType }

  // Check role-based access
  if (therapistRoutes.some(route => pathname.startsWith(route))) {
    if (effectiveProfile.user_type !== 'therapist' && effectiveProfile.user_type !== 'admin') {
      return NextResponse.redirect(new URL(`/${effectiveProfile.user_type}`, request.url))
    }
  }

  if (organizerRoutes.some(route => pathname.startsWith(route))) {
    if (effectiveProfile.user_type !== 'organizer' && effectiveProfile.user_type !== 'admin') {
      return NextResponse.redirect(new URL(`/${effectiveProfile.user_type}`, request.url))
    }
  }

  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (effectiveProfile.user_type !== 'admin') {
      return NextResponse.redirect(new URL(`/${effectiveProfile.user_type}`, request.url))
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
