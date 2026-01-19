import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// Public endpoint - no auth required
// Returns aggregate platform stats for the landing page

export async function GET() {
  const adminClient = createAdminClient()

  // Get counts in parallel
  const [
    { count: therapistCount },
    { count: verifiedTherapistCount },
    { count: organizerCount },
    { count: shiftCount },
    { count: completedBookingCount },
  ] = await Promise.all([
    adminClient
      .from('therapists')
      .select('*', { count: 'exact', head: true }),
    adminClient
      .from('therapists')
      .select('*', { count: 'exact', head: true })
      .eq('credentials_verified', true),
    adminClient
      .from('organizers')
      .select('*', { count: 'exact', head: true }),
    adminClient
      .from('shifts')
      .select('*', { count: 'exact', head: true }),
    adminClient
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('status', ['completed', 'checked_out']),
  ])

  // Get total hours worked and earnings
  const { data: bookingStats } = await adminClient
    .from('bookings')
    .select('hours_worked, therapist_payout')
    .in('status', ['completed', 'checked_out'])

  const totalHoursWorked = bookingStats?.reduce((sum, b) => sum + (b.hours_worked || 0), 0) || 0
  const totalEarnings = bookingStats?.reduce((sum, b) => sum + (b.therapist_payout || 0), 0) || 0

  return NextResponse.json({
    therapists: therapistCount || 0,
    verifiedTherapists: verifiedTherapistCount || 0,
    organizers: organizerCount || 0,
    shifts: shiftCount || 0,
    completedShifts: completedBookingCount || 0,
    hoursWorked: Math.round(totalHoursWorked),
    totalEarnings: Math.round(totalEarnings),
  })
}
