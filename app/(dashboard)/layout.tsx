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

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // Try to get profile with timeout protection
  let { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // If profile doesn't exist, create it from user metadata
  if (profileError || !profile) {
    const userType = user.user_metadata?.user_type || 'therapist'
    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

    // Try to create profile
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: fullName,
        user_type: userType,
      }, { onConflict: 'id' })
      .select()
      .single()

    if (createError) {
      console.error('Failed to create profile:', createError)
      // Use fallback profile data instead of redirecting
      profile = {
        id: user.id,
        email: user.email || '',
        full_name: fullName,
        user_type: userType,
        phone: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    } else {
      profile = newProfile

      // Also create the role-specific record
      if (userType === 'therapist') {
        await supabase.from('therapists').upsert({ user_id: user.id }, { onConflict: 'user_id' }).select()
      } else if (userType === 'organizer') {
        await supabase.from('organizers').upsert({ user_id: user.id }, { onConflict: 'user_id' }).select()
      }
    }
  }

  // Get role-specific data (don't fail if not found)
  let roleData = null
  if (profile.user_type === 'therapist') {
    const { data: therapist } = await supabase
      .from('therapists')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    roleData = therapist
  } else if (profile.user_type === 'organizer') {
    const { data: organizer } = await supabase
      .from('organizers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
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
