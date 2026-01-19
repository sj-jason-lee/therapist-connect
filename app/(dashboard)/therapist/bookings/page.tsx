'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Building2,
  CheckCircle,
  LogIn,
  LogOut,
  Loader2,
} from 'lucide-react'
import { formatDate, formatTime, formatCurrency } from '@/lib/utils'

export default function TherapistBookingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<any[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Get therapist
    const { data: therapist, error: therapistError } = await supabase
      .from('therapists')
      .select('id')
      .eq('user_id', user.id)
      .single()

    // If no therapist profile, redirect to complete profile
    if (!therapist || therapistError) {
      router.push('/therapist/profile')
      return
    }

    // Get bookings with shift details
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        shift:shifts(
          *,
          organizer:organizers(
            organization_name,
            profile:profiles(full_name, phone)
          )
        )
      `)
      .eq('therapist_id', therapist.id)
      .order('created_at', { ascending: false })

    if (bookingsError) {
      console.error('Error loading bookings:', bookingsError)
    }
    console.log('Bookings loaded:', bookingsData)

    setBookings(bookingsData || [])
    setLoading(false)
  }

  const handleCheckIn = async (bookingId: string) => {
    setProcessingId(bookingId)
    const supabase = createClient()

    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'checked_in',
        check_in_time: new Date().toISOString(),
      })
      .eq('id', bookingId)

    if (error) {
      console.error('Check-in error:', error)
    }

    setProcessingId(null)
    loadBookings()
  }

  const handleCheckOut = async (bookingId: string, shift: any, checkInTime: string) => {
    setProcessingId(bookingId)
    const supabase = createClient()

    const checkOut = new Date()
    const checkIn = new Date(checkInTime)
    const hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)
    const roundedHours = Math.max(0.5, Math.round(hoursWorked * 4) / 4) // Round to nearest 15 min, minimum 0.5 hours

    // Go4-style pricing: therapist gets 100% of rate, organizer pays rate + 20% fee
    const therapistPayout = roundedHours * shift.hourly_rate // Therapist gets full rate
    const platformFee = therapistPayout * 0.20 // 20% service fee charged to organizer
    const amountDue = therapistPayout + platformFee // Total organizer pays

    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'checked_out',
        check_out_time: checkOut.toISOString(),
        hours_worked: roundedHours,
        amount_due: amountDue,
        platform_fee: platformFee,
        therapist_payout: therapistPayout,
      })
      .eq('id', bookingId)

    if (error) {
      console.error('Check-out error:', error)
    }

    setProcessingId(null)
    loadBookings()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

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

  const upcomingBookings = bookings.filter(b => b.status === 'confirmed')
  const activeBookings = bookings.filter(b => b.status === 'checked_in')
  const completedBookings = bookings.filter(b => ['checked_out', 'completed'].includes(b.status))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-gray-500 mt-1">Manage your confirmed shifts and check in/out.</p>
      </div>

      {/* Active Bookings - Check-in/out needed */}
      {activeBookings.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            Currently Working ({activeBookings.length})
          </h2>
          <div className="space-y-4">
            {activeBookings.map((booking) => (
              <Card key={booking.id} className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {booking.shift?.title}
                        </h3>
                        <Badge variant="warning">In Progress</Badge>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-gray-600">
                        <Building2 className="h-4 w-4" />
                        <span className="text-sm">
                          {booking.shift?.organizer?.organization_name}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        Checked in: {new Date(booking.check_in_time).toLocaleTimeString()}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleCheckOut(booking.id, booking.shift, booking.check_in_time)}
                      disabled={processingId === booking.id}
                      variant="secondary"
                    >
                      {processingId === booking.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <LogOut className="h-4 w-4 mr-2" />
                      )}
                      Check Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Upcoming ({upcomingBookings.length})
          </h2>
          <div className="space-y-4">
            {upcomingBookings.map((booking) => {
              const shiftDate = new Date(booking.shift?.date)
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              const isToday = shiftDate.toDateString() === today.toDateString()

              return (
                <Card key={booking.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {booking.shift?.title}
                          </h3>
                          <Badge variant="info">Confirmed</Badge>
                          {isToday && <Badge variant="warning">Today</Badge>}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-gray-600">
                          <Building2 className="h-4 w-4" />
                          <span className="text-sm">
                            {booking.shift?.organizer?.organization_name}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm">{formatDate(booking.shift?.date)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">
                              {formatTime(booking.shift?.start_time)} - {formatTime(booking.shift?.end_time)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm">
                              {booking.shift?.city}, {booking.shift?.province}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <DollarSign className="h-4 w-4" />
                            <span className="text-sm">${booking.shift?.hourly_rate}/hr</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {isToday && (
                          <Button
                            onClick={() => handleCheckIn(booking.id)}
                            disabled={processingId === booking.id}
                          >
                            {processingId === booking.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <LogIn className="h-4 w-4 mr-2" />
                            )}
                            Check In
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Completed Bookings */}
      {completedBookings.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Completed ({completedBookings.length})
          </h2>
          <div className="space-y-4">
            {completedBookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {booking.shift?.title}
                        </h3>
                        <Badge variant={getStatusVariant(booking.status)}>
                          {getStatusLabel(booking.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-gray-600">
                        <Building2 className="h-4 w-4" />
                        <span className="text-sm">
                          {booking.shift?.organizer?.organization_name}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        {formatDate(booking.shift?.date)} | {booking.hours_worked} hours worked
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(booking.therapist_payout || 0)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.status === 'completed' ? 'Paid' : 'Pending payment'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Bookings */}
      {bookings.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No bookings yet</h3>
            <p className="text-gray-500 mt-1">
              When your applications are accepted, they&apos;ll appear here.
            </p>
            <Link href="/therapist/shifts" className="mt-4 inline-block">
              <Button>Browse Available Shifts</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
