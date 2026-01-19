import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  DollarSign,
  CheckCircle,
} from 'lucide-react'
import { formatDate, formatTime, formatCurrency } from '@/lib/utils'

export default async function OrganizerBookingsPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get organizer
  const { data: organizer, error: organizerError } = await supabase
    .from('organizers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  // If no organizer profile, redirect to complete profile
  if (!organizer || organizerError) {
    redirect('/organizer/profile')
  }

  // Get all bookings for organizer's shifts
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      shift:shifts!inner(
        *,
        organizer_id
      ),
      therapist:therapists(
        *,
        profile:profiles(full_name, email, phone)
      )
    `)
    .eq('shift.organizer_id', organizer.id)
    .order('created_at', { ascending: false })

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'info'
      case 'checked_in': return 'warning'
      case 'checked_out': return 'success'
      case 'completed': return 'success'
      case 'cancelled': return 'error'
      default: return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Upcoming'
      case 'checked_in': return 'In Progress'
      case 'checked_out': return 'Awaiting Payment'
      case 'completed': return 'Completed'
      case 'cancelled': return 'Cancelled'
      default: return status
    }
  }

  const upcomingBookings = bookings?.filter(b => b.status === 'confirmed') || []
  const activeBookings = bookings?.filter(b => b.status === 'checked_in') || []
  const completedBookings = bookings?.filter(b => ['checked_out', 'completed'].includes(b.status)) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-gray-500 mt-1">View all confirmed therapist bookings for your shifts.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{upcomingBookings.length}</p>
              <p className="text-sm text-gray-500">Upcoming</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{activeBookings.length}</p>
              <p className="text-sm text-gray-500">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{completedBookings.length}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Bookings */}
      {activeBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              In Progress ({activeBookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeBookings.map((booking) => (
              <div
                key={booking.id}
                className="p-4 bg-yellow-50 rounded-lg"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">{booking.shift?.title}</h4>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {booking.therapist?.profile?.full_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Checked in: {new Date(booking.check_in_time).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <Badge variant="warning">In Progress</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Upcoming ({upcomingBookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingBookings.map((booking) => (
              <div
                key={booking.id}
                className="p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">{booking.shift?.title}</h4>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {booking.therapist?.profile?.full_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(booking.shift?.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatTime(booking.shift?.start_time)} - {formatTime(booking.shift?.end_time)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {booking.shift?.city}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ${booking.shift?.hourly_rate}/hr
                    </p>
                    <Badge variant="info" className="mt-1">Confirmed</Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Completed Bookings */}
      {completedBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Completed ({completedBookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {completedBookings.map((booking) => (
              <div
                key={booking.id}
                className="p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">{booking.shift?.title}</h4>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {booking.therapist?.profile?.full_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(booking.shift?.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {booking.hours_worked} hours
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(booking.amount_due || 0)}
                    </p>
                    <Badge
                      variant={booking.status === 'completed' ? 'success' : 'warning'}
                      className="mt-1"
                    >
                      {booking.status === 'completed' ? 'Paid' : 'Pending Payment'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No Bookings */}
      {(!bookings || bookings.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No bookings yet</h3>
            <p className="text-gray-500 mt-1">
              When therapists are confirmed for your shifts, they&apos;ll appear here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
