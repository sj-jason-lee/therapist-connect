import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const type = searchParams.get('type') // For password reset, etc.

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth error:', error)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }

    if (data.user) {
      // Get the user's profile to redirect to the correct dashboard
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
      }

      // Determine user type: profile > metadata > default
      const userType = profile?.user_type || data.user.user_metadata?.user_type || 'therapist'
      const dashboardUrl = `/${userType}`

      // If this is a password reset, redirect to password change page
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password`)
      }

      // For email verification, show the nice welcome page
      return NextResponse.redirect(
        `${origin}/auth/verified?redirect=${encodeURIComponent(dashboardUrl)}&type=${userType}`
      )
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`)
}
