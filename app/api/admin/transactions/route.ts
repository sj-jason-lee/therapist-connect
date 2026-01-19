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
  const status = searchParams.get('status') // booking status filter
  const paid = searchParams.get('paid') // 'true', 'false', or null

  // Use admin client to bypass RLS
  const adminClient = createAdminClient()

  // Get all bookings with related data
  let bookingsQuery = adminClient
    .from('bookings')
    .select(`
      *,
      shift:shifts(
        id,
        title,
        date,
        start_time,
        end_time,
        hourly_rate,
        city,
        province,
        organizer:organizers(
          id,
          organization_name,
          user_id
        )
      ),
      therapist:therapists(
        id,
        user_id,
        profile:profiles(full_name, email)
      )
    `)
    .order('created_at', { ascending: false })

  if (status) {
    bookingsQuery = bookingsQuery.eq('status', status)
  }

  if (paid === 'true') {
    bookingsQuery = bookingsQuery.not('paid_at', 'is', null)
  } else if (paid === 'false') {
    bookingsQuery = bookingsQuery.is('paid_at', null)
  }

  const { data: bookings, error: bookingsError } = await bookingsQuery

  if (bookingsError) {
    return NextResponse.json({ error: bookingsError.message }, { status: 500 })
  }

  // Get organizer profiles
  const organizerUserIds = Array.from(new Set(bookings?.map(b => b.shift?.organizer?.user_id).filter(Boolean) || []))
  let organizerProfiles: Record<string, any> = {}

  if (organizerUserIds.length > 0) {
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('id, full_name, email')
      .in('id', organizerUserIds)

    organizerProfiles = (profiles || []).reduce((acc, p) => {
      acc[p.id] = p
      return acc
    }, {} as Record<string, any>)
  }

  // Enhance bookings with organizer profile
  const enhancedBookings = bookings?.map(booking => ({
    ...booking,
    shift: booking.shift ? {
      ...booking.shift,
      organizer: booking.shift.organizer ? {
        ...booking.shift.organizer,
        profile: organizerProfiles[booking.shift.organizer.user_id] || null
      } : null
    } : null
  })) || []

  // Calculate stats
  const allBookings = bookings || []
  const totalRevenue = allBookings.reduce((sum, b) => sum + (b.amount_due || 0), 0)
  const totalPlatformFees = allBookings.reduce((sum, b) => sum + (b.platform_fee || 0), 0)
  const totalPayouts = allBookings.reduce((sum, b) => sum + (b.therapist_payout || 0), 0)
  const paidBookings = allBookings.filter(b => b.paid_at).length
  const pendingPayments = allBookings.filter(b => !b.paid_at && b.status === 'completed').length

  return NextResponse.json({
    transactions: enhancedBookings,
    stats: {
      totalTransactions: allBookings.length,
      totalRevenue,
      totalPlatformFees,
      totalPayouts,
      paidBookings,
      pendingPayments,
    }
  })
}
