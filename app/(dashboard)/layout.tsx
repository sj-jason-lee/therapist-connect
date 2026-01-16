import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // If profile doesn't exist, create it from user metadata
  if (!profile) {
    const userType = user.user_metadata?.user_type || 'therapist'
    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: fullName,
        user_type: userType,
      })
      .select()
      .single()

    if (createError) {
      console.error('Failed to create profile:', createError)
      redirect('/login?error=Profile creation failed')
    }

    profile = newProfile

    // Also create the role-specific record
    if (userType === 'therapist') {
      await supabase.from('therapists').insert({ user_id: user.id })
    } else if (userType === 'organizer') {
      await supabase.from('organizers').insert({ user_id: user.id })
    }
  }

  // Get role-specific data
  let roleData = null
  if (profile.user_type === 'therapist') {
    const { data: therapist } = await supabase
      .from('therapists')
      .select('*')
      .eq('user_id', user.id)
      .single()
    roleData = therapist
  } else if (profile.user_type === 'organizer') {
    const { data: organizer } = await supabase
      .from('organizers')
      .select('*')
      .eq('user_id', user.id)
      .single()
    roleData = organizer
  }

  const userData = {
    ...profile,
    roleData,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar userType={profile.user_type} />
      <div className="lg:pl-64">
        <Navbar user={userData} />
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
