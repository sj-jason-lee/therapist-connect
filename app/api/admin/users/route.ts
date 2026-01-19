import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // First verify the user is an admin
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userType = user.user_metadata?.user_type
  if (userType !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get query params for filtering
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') // 'therapist', 'organizer', 'admin', or null for all
  const search = searchParams.get('search') // search by name or email
  const verified = searchParams.get('verified') // 'true', 'false', or null

  // Use admin client to bypass RLS
  const adminClient = createAdminClient()

  // Get all profiles
  let profilesQuery = adminClient
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (type) {
    profilesQuery = profilesQuery.eq('user_type', type)
  }

  if (search) {
    profilesQuery = profilesQuery.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data: profiles, error: profilesError } = await profilesQuery

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 })
  }

  // Get therapist data for therapist users
  const therapistUserIds = profiles?.filter(p => p.user_type === 'therapist').map(p => p.id) || []
  let therapistsData: Record<string, any> = {}

  if (therapistUserIds.length > 0) {
    let therapistsQuery = adminClient
      .from('therapists')
      .select('*')
      .in('user_id', therapistUserIds)

    if (verified === 'true') {
      therapistsQuery = therapistsQuery.eq('credentials_verified', true)
    } else if (verified === 'false') {
      therapistsQuery = therapistsQuery.eq('credentials_verified', false)
    }

    const { data: therapists } = await therapistsQuery
    therapistsData = (therapists || []).reduce((acc, t) => {
      acc[t.user_id] = t
      return acc
    }, {} as Record<string, any>)
  }

  // Get organizer data for organizer users
  const organizerUserIds = profiles?.filter(p => p.user_type === 'organizer').map(p => p.id) || []
  let organizersData: Record<string, any> = {}

  if (organizerUserIds.length > 0) {
    const { data: organizers } = await adminClient
      .from('organizers')
      .select('*')
      .in('user_id', organizerUserIds)

    organizersData = (organizers || []).reduce((acc, o) => {
      acc[o.user_id] = o
      return acc
    }, {} as Record<string, any>)
  }

  // Combine data
  let combinedUsers = profiles?.map(profile => ({
    ...profile,
    therapist: therapistsData[profile.id] || null,
    organizer: organizersData[profile.id] || null,
  })) || []

  // Filter by verified status if specified and type is therapist
  if (verified && type === 'therapist') {
    const verifiedBool = verified === 'true'
    combinedUsers = combinedUsers.filter(u =>
      u.therapist?.credentials_verified === verifiedBool
    )
  }

  // Get counts for stats
  const { count: totalUsers } = await adminClient
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const { count: totalTherapists } = await adminClient
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('user_type', 'therapist')

  const { count: totalOrganizers } = await adminClient
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('user_type', 'organizer')

  const { count: totalAdmins } = await adminClient
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('user_type', 'admin')

  return NextResponse.json({
    users: combinedUsers,
    stats: {
      total: totalUsers || 0,
      therapists: totalTherapists || 0,
      organizers: totalOrganizers || 0,
      admins: totalAdmins || 0,
    }
  })
}
