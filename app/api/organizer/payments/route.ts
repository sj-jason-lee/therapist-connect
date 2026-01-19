import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get organizer profile
  const { data: organizer, error: organizerError } = await supabase
    .from('organizers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (organizerError || !organizer) {
    return NextResponse.json({ error: 'Organizer profile not found' }, { status: 404 })
  }

  // Get query params for filtering
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') // 'paid', 'pending', or null for all

  // Get all shifts for this organizer with their bookings
  const { data: shifts, error: shiftsError } = await supabase
    .from('shifts')
    .select(`
      id,
      title,
      date,
      start_time,
      end_time,
      hourly_rate,
      city,
      province,
      bookings(
        id,
        status,
        check_in_time,
        check_out_time,
        hours_worked,
        amount_due,
        platform_fee,
        therapist_payout,
        paid_at,
        created_at,
        therapist:therapists(
          id,
          user_id,
          profile:profiles(full_name, email)
        )
      )
    `)
    .eq('organizer_id', organizer.id)
    .order('date', { ascending: false })

  if (shiftsError) {
    return NextResponse.json({ error: shiftsError.message }, { status: 500 })
  }

  // Flatten bookings with shift info for easier display
  let payments: any[] = []

  shifts?.forEach(shift => {
    if (shift.bookings && Array.isArray(shift.bookings)) {
      shift.bookings.forEach((booking: any) => {
        // Only include bookings that have financial data (checked out or completed)
        if (booking.amount_due || booking.status === 'completed' || booking.status === 'checked_out') {
          payments.push({
            id: booking.id,
            shift: {
              id: shift.id,
              title: shift.title,
              date: shift.date,
              start_time: shift.start_time,
              end_time: shift.end_time,
              hourly_rate: shift.hourly_rate,
              city: shift.city,
              province: shift.province,
            },
            therapist: booking.therapist,
            status: booking.status,
            check_in_time: booking.check_in_time,
            check_out_time: booking.check_out_time,
            hours_worked: booking.hours_worked,
            amount_due: booking.amount_due,
            platform_fee: booking.platform_fee,
            therapist_payout: booking.therapist_payout,
            paid_at: booking.paid_at,
            created_at: booking.created_at,
          })
        }
      })
    }
  })

  // Apply status filter
  if (status === 'paid') {
    payments = payments.filter(p => p.paid_at !== null)
  } else if (status === 'pending') {
    payments = payments.filter(p => p.paid_at === null && (p.status === 'completed' || p.status === 'checked_out'))
  }

  // Calculate stats
  const allPayments = payments
  const totalSpent = allPayments.reduce((sum, p) => sum + (p.amount_due || 0), 0)
  const paidAmount = allPayments.filter(p => p.paid_at).reduce((sum, p) => sum + (p.amount_due || 0), 0)
  const pendingAmount = allPayments.filter(p => !p.paid_at).reduce((sum, p) => sum + (p.amount_due || 0), 0)
  const paidCount = allPayments.filter(p => p.paid_at).length
  const pendingCount = allPayments.filter(p => !p.paid_at && (p.status === 'completed' || p.status === 'checked_out')).length

  return NextResponse.json({
    payments,
    stats: {
      totalSpent,
      paidAmount,
      pendingAmount,
      paidCount,
      pendingCount,
      totalBookings: allPayments.length,
    }
  })
}
