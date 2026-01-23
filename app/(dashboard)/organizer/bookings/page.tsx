'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/firebase/AuthContext'
import {
  getShiftsByOrganizer,
  getBookingsByShift,
  getShift,
  getUserProfile,
  getTherapistProfile,
  Booking,
  Shift,
  UserProfile,
  TherapistProfile,
} from '@/lib/firebase/firestore'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  Loader2,
  Clock,
  MapPin,
  AlertCircle,
  User,
  CheckCircle,
} from 'lucide-react'

const BOOKING_STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-blue-100 text-blue-800',
  checked_in: 'bg-yellow-100 text-yellow-800',
  checked_out: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  disputed: 'bg-orange-100 text-orange-800',
}

const BOOKING_STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmed',
  checked_in: 'Checked In',
  checked_out: 'Checked Out',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
}

interface BookingWithDetails extends Booking {
  shift?: Shift | null
  therapistUser?: UserProfile | null
  therapistProfile?: TherapistProfile | null
}

export default function OrganizerBookingsPage() {
  const { user, loading: authLoading } = useAuth()
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBookings() {
      if (!user) return

      try {
        // Get all shifts for this organizer
        const shifts = await getShiftsByOrganizer(user.uid)

        // Get bookings for all shifts
        const allBookings: BookingWithDetails[] = []

        for (const shift of shifts) {
          const shiftBookings = await getBookingsByShift(shift.id)

          for (const booking of shiftBookings) {
            const [therapistUser, therapistProfile] = await Promise.all([
              getUserProfile(booking.therapistId),
              getTherapistProfile(booking.therapistId),
            ])

            allBookings.push({
              ...booking,
              shift,
              therapistUser,
              therapistProfile,
            })
          }
        }

        // Sort by shift date (upcoming first)
        allBookings.sort((a, b) => {
          const dateA = a.shift?.date?.toDate?.() || new Date(0)
          const dateB = b.shift?.date?.toDate?.() || new Date(0)
          return dateA.getTime() - dateB.getTime()
        })

        setBookings(allBookings)
      } catch (err) {
        console.error('Error fetching bookings:', err)
        setError('Failed to load bookings')
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchBookings()
    }
  }, [user, authLoading])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const now = new Date()
  const upcomingBookings = bookings.filter(b => {
    const shiftDate = b.shift?.date?.toDate?.()
    return shiftDate && shiftDate >= now && b.status === 'confirmed'
  })
  const activeBookings = bookings.filter(b =>
    b.status === 'checked_in' || b.status === 'checked_out'
  )
  const completedBookings = bookings.filter(b => b.status === 'completed')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-gray-500 mt-1">View all confirmed therapist bookings for your shifts.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

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

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No bookings yet</h3>
            <p className="text-gray-500 mt-1">
              When therapists are confirmed for your shifts, they&apos;ll appear here.
            </p>
            <Link href="/organizer/shifts/new" className="mt-4 inline-block">
              <Button>Post a New Shift</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const shift = booking.shift
            const shiftDate = shift?.date?.toDate?.()
            const formattedDate = shiftDate
              ? shiftDate.toLocaleDateString('en-CA', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Date TBD'

            const isUpcoming = shiftDate && shiftDate >= now

            return (
              <Card key={booking.id} className={isUpcoming ? 'border-blue-200' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Therapist Avatar */}
                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>

                    {/* Booking Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {booking.therapistUser?.fullName || 'Unknown Therapist'}
                        </h3>
                        <Badge className={BOOKING_STATUS_COLORS[booking.status]}>
                          {BOOKING_STATUS_LABELS[booking.status] || booking.status}
                        </Badge>
                        {booking.therapistProfile?.credentialsVerified && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-gray-500 mt-1">
                        {booking.therapistProfile?.city}, {booking.therapistProfile?.province}
                        {booking.therapistUser?.phone && (
                          <span> · {booking.therapistUser.phone}</span>
                        )}
                      </p>

                      {/* Shift Info */}
                      {shift && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="font-medium text-gray-900 text-sm">{shift.title}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formattedDate}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {shift.startTime} - {shift.endTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {shift.venueName || shift.city}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Completed Info */}
                      {booking.status === 'completed' && booking.hoursWorked && (
                        <div className="mt-3 flex items-center gap-4 text-sm">
                          <span>
                            <span className="text-gray-500">Hours:</span>
                            <span className="ml-1 font-medium">{booking.hoursWorked}</span>
                          </span>
                          <span>
                            <span className="text-gray-500">Amount:</span>
                            <span className="ml-1 font-medium text-green-600">
                              ${booking.amountDue?.toFixed(2) || '0.00'}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {shift && (
                        <Link href={`/organizer/shifts/${shift.id}`}>
                          <Button variant="outline" size="sm">View Shift</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
