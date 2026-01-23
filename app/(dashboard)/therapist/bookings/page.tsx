'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/firebase/AuthContext'
import {
  getBookingsByTherapist,
  getShift,
  getOrCreateConversation,
  checkInBooking,
  checkOutBooking,
  disputeBookingHours,
  Booking,
  Shift,
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
  CheckCircle,
  MessageCircle,
  LogIn,
  LogOut,
  AlertTriangle,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { EVENT_TYPE_LABELS } from '@/lib/constants'

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

interface BookingWithShift extends Booking {
  shift?: Shift | null
}

export default function TherapistBookingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [bookings, setBookings] = useState<BookingWithShift[]>([])
  const [loading, setLoading] = useState(true)
  const [messageLoading, setMessageLoading] = useState<string | null>(null)
  const [statusLoading, setStatusLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [disputeBooking, setDisputeBooking] = useState<BookingWithShift | null>(null)
  const [disputeHours, setDisputeHours] = useState('')
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeLoading, setDisputeLoading] = useState(false)

  useEffect(() => {
    async function fetchBookings() {
      if (!user) return

      try {
        const fetchedBookings = await getBookingsByTherapist(user.uid)

        // Fetch shift details for each booking
        const bookingsWithShifts = await Promise.all(
          fetchedBookings.map(async (booking) => {
            const shift = await getShift(booking.shiftId)
            return { ...booking, shift }
          })
        )

        // Sort by shift date (upcoming first)
        bookingsWithShifts.sort((a, b) => {
          const dateA = a.shift?.date?.toDate?.() || new Date(0)
          const dateB = b.shift?.date?.toDate?.() || new Date(0)
          return dateA.getTime() - dateB.getTime()
        })

        setBookings(bookingsWithShifts)
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

  const handleMessage = async (booking: BookingWithShift) => {
    if (!user || !booking.shift) return

    setMessageLoading(booking.id)
    try {
      const conversation = await getOrCreateConversation(
        user.uid,
        booking.shift.organizerId,
        booking.shiftId,
        booking.id
      )
      router.push(`/therapist/messages?conversation=${conversation.id}`)
    } catch (err) {
      console.error('Error starting conversation:', err)
      setError('Failed to open message thread. Please try again.')
    } finally {
      setMessageLoading(null)
    }
  }

  const handleCheckIn = async (booking: BookingWithShift) => {
    if (!user) return
    setStatusLoading(booking.id)
    setError(null)
    try {
      await checkInBooking(booking.id, user.uid)
      setBookings(prev => prev.map(b =>
        b.id === booking.id ? { ...b, status: 'checked_in' } : b
      ))
    } catch (err) {
      console.error('Error checking in:', err)
      setError('Failed to check in. Please try again.')
    } finally {
      setStatusLoading(null)
    }
  }

  const handleCheckOut = async (booking: BookingWithShift) => {
    if (!user) return
    setStatusLoading(booking.id)
    setError(null)
    try {
      await checkOutBooking(booking.id, user.uid)
      setBookings(prev => prev.map(b =>
        b.id === booking.id ? { ...b, status: 'checked_out' } : b
      ))
    } catch (err) {
      console.error('Error checking out:', err)
      setError('Failed to check out. Please try again.')
    } finally {
      setStatusLoading(null)
    }
  }

  const handleDisputeSubmit = async () => {
    if (!user || !disputeBooking) return
    const hours = parseFloat(disputeHours)
    if (isNaN(hours) || hours <= 0) {
      setError('Please enter valid hours')
      return
    }
    if (!disputeReason.trim()) {
      setError('Please provide a reason for the dispute')
      return
    }

    setDisputeLoading(true)
    setError(null)
    try {
      await disputeBookingHours(disputeBooking.id, user.uid, hours, disputeReason)
      setBookings(prev => prev.map(b =>
        b.id === disputeBooking.id ? { ...b, status: 'disputed' } : b
      ))
      setDisputeBooking(null)
      setDisputeHours('')
      setDisputeReason('')
    } catch (err: any) {
      console.error('Error disputing hours:', err)
      setError(err.message || 'Failed to submit dispute. Please try again.')
    } finally {
      setDisputeLoading(false)
    }
  }

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
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-gray-500 mt-1">Manage your confirmed shifts.</p>
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
              When your applications are accepted, they&apos;ll appear here.
            </p>
            <Link href="/therapist/shifts" className="mt-4 inline-block">
              <Button>Browse Available Shifts</Button>
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
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'Date TBD'

            const isUpcoming = shiftDate && shiftDate >= now
            const estimatedHours = shift
              ? calculateHours(shift.startTime, shift.endTime)
              : 0
            const estimatedPay = shift ? estimatedHours * shift.hourlyRate : 0

            return (
              <Card key={booking.id} className={isUpcoming ? 'border-blue-200' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {shift?.title || 'Unknown Shift'}
                        </h3>
                        <Badge className={BOOKING_STATUS_COLORS[booking.status]}>
                          {BOOKING_STATUS_LABELS[booking.status] || booking.status}
                        </Badge>
                        {(() => {
                          if (!shiftDate || booking.status !== 'confirmed') return null
                          const today = new Date()
                          today.setHours(0, 0, 0, 0)
                          const tomorrow = new Date(today)
                          tomorrow.setDate(tomorrow.getDate() + 1)
                          const shiftDay = new Date(shiftDate)
                          shiftDay.setHours(0, 0, 0, 0)

                          if (shiftDay.getTime() === today.getTime()) {
                            return <Badge className="bg-red-100 text-red-800">Today!</Badge>
                          }
                          if (shiftDay.getTime() === tomorrow.getTime()) {
                            return <Badge className="bg-orange-100 text-orange-800">Tomorrow</Badge>
                          }
                          return null
                        })()}
                      </div>

                      {shift && (
                        <>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formattedDate}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {shift.startTime} - {shift.endTime}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {shift.venueName && `${shift.venueName}, `}
                              {shift.city}, {shift.province}
                            </span>
                            {shift.eventType && (
                              <Badge variant="outline">
                                {EVENT_TYPE_LABELS[shift.eventType] || shift.eventType}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-4 pt-2 border-t">
                            <div className="text-sm">
                              <span className="text-gray-500">Rate:</span>
                              <span className="ml-1 font-medium text-green-600">${shift.hourlyRate}/hr</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-500">Est. Hours:</span>
                              <span className="ml-1 font-medium">{estimatedHours.toFixed(1)}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-500">Est. Pay:</span>
                              <span className="ml-1 font-medium text-green-600">${estimatedPay.toFixed(2)}</span>
                            </div>
                          </div>
                        </>
                      )}

                      {booking.hoursWorked && (
                        <div className="flex items-center gap-2 text-sm bg-green-50 p-2 rounded">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>
                            Worked {booking.hoursWorked} hours · Earned ${booking.therapistPayout?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {/* Check-in/Check-out buttons */}
                      {booking.status === 'confirmed' && isUpcoming && (
                        <Button
                          size="sm"
                          onClick={() => handleCheckIn(booking)}
                          disabled={statusLoading === booking.id}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {statusLoading === booking.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <LogIn className="h-4 w-4 mr-2" />
                          )}
                          Check In
                        </Button>
                      )}
                      {booking.status === 'checked_in' && (
                        <Button
                          size="sm"
                          onClick={() => handleCheckOut(booking)}
                          disabled={statusLoading === booking.id}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {statusLoading === booking.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <LogOut className="h-4 w-4 mr-2" />
                          )}
                          Check Out
                        </Button>
                      )}
                      {booking.status === 'checked_out' && (
                        <Badge className="bg-purple-100 text-purple-800 justify-center py-2">
                          Awaiting Completion
                        </Badge>
                      )}
                      {booking.status === 'completed' && !booking.paidAt && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDisputeBooking(booking)
                            setDisputeHours(booking.hoursWorked?.toString() || '')
                          }}
                          className="border-orange-300 text-orange-700 hover:bg-orange-50"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Dispute Hours
                        </Button>
                      )}
                      {booking.status === 'disputed' && (
                        <Badge className="bg-orange-100 text-orange-800 justify-center py-2">
                          Dispute Pending
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMessage(booking)}
                        disabled={messageLoading === booking.id}
                      >
                        {messageLoading === booking.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <MessageCircle className="h-4 w-4 mr-2" />
                        )}
                        Message
                      </Button>
                      {shift && (
                        <Link href={`/therapist/shifts/${shift.id}`}>
                          <Button variant="outline" size="sm">View Details</Button>
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

      {/* Dispute Modal */}
      {disputeBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Dispute Hours Worked</h3>
              <p className="text-sm text-gray-600 mb-4">
                The organizer reported <strong>{disputeBooking.hoursWorked} hours</strong> for this shift.
                If this is incorrect, please enter the actual hours you worked.
              </p>

              <div className="space-y-4">
                <Input
                  label="Actual Hours Worked"
                  type="number"
                  step="0.5"
                  min="0"
                  value={disputeHours}
                  onChange={(e) => setDisputeHours(e.target.value)}
                  placeholder="e.g., 8.5"
                />

                <Textarea
                  label="Reason for Dispute"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Please explain why you believe the hours are incorrect..."
                  rows={3}
                />

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDisputeBooking(null)
                      setDisputeHours('')
                      setDisputeReason('')
                    }}
                    disabled={disputeLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDisputeSubmit}
                    disabled={disputeLoading}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {disputeLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 mr-2" />
                    )}
                    Submit Dispute
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function calculateHours(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)

  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  return (endMinutes - startMinutes) / 60
}
