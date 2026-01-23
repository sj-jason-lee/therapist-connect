'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/firebase/AuthContext'
import {
  getShiftsByOrganizer,
  getBookingsByShift,
  getUserProfile,
  getTherapistProfile,
  getOrCreateConversation,
  getReviewByBooking,
  checkInBooking,
  checkOutBooking,
  completeBooking,
  resolveDispute,
  Booking,
  Shift,
  UserProfile,
  TherapistProfile,
  Review,
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
  CreditCard,
  DollarSign,
  MessageCircle,
  Star,
  AlertTriangle,
  Scale,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ReviewForm } from '@/components/reviews/review-form'
import { StarRating } from '@/components/reviews/review-display'
import { formatCurrency } from '@/lib/utils'

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
  review?: Review | null
}

export default function OrganizerBookingsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null)
  const [messageLoading, setMessageLoading] = useState<string | null>(null)
  const [statusLoading, setStatusLoading] = useState<string | null>(null)
  const [reviewingBooking, setReviewingBooking] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resolvingDispute, setResolvingDispute] = useState<BookingWithDetails | null>(null)
  const [resolveHours, setResolveHours] = useState('')
  const [resolveNotes, setResolveNotes] = useState('')
  const [resolveLoading, setResolveLoading] = useState(false)

  const paymentSuccess = searchParams.get('payment_success') === 'true'
  const paymentCancelled = searchParams.get('payment_cancelled') === 'true'

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
            const [therapistUser, therapistProfile, review] = await Promise.all([
              getUserProfile(booking.therapistId),
              getTherapistProfile(booking.therapistId),
              booking.status === 'completed' ? getReviewByBooking(booking.id) : Promise.resolve(null),
            ])

            allBookings.push({
              ...booking,
              review,
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

  const handlePayNow = async (booking: BookingWithDetails) => {
    if (!booking.shift || !booking.therapistProfile?.stripeAccountId) {
      setError('Unable to process payment. Therapist may not have set up payouts yet.')
      return
    }

    setPaymentLoading(booking.id)
    setError(null)

    try {
      const shift = booking.shift
      const shiftDate = shift.date?.toDate?.()
      const formattedDate = shiftDate
        ? shiftDate.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'TBD'

      // Calculate hours and base amount (therapist's pay)
      const hours = booking.hoursWorked || calculateShiftHours(shift.startTime, shift.endTime)
      const baseAmountCents = Math.round((booking.therapistPayout || (hours * shift.hourlyRate)) * 100)

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-session',
          bookingId: booking.id,
          shiftId: booking.shiftId,
          organizerId: user?.uid,
          therapistId: booking.therapistId,
          therapistStripeAccountId: booking.therapistProfile.stripeAccountId,
          baseAmountCents,
          shiftTitle: shift.title,
          shiftDate: formattedDate,
          hours,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (err) {
      console.error('Payment error:', err)
      setError('Failed to initiate payment. Please try again.')
    } finally {
      setPaymentLoading(null)
    }
  }

  const handleMessage = async (booking: BookingWithDetails) => {
    if (!user || !booking.shift) return

    setMessageLoading(booking.id)
    try {
      const conversation = await getOrCreateConversation(
        booking.therapistId,
        user.uid,
        booking.shiftId,
        booking.id
      )
      router.push(`/organizer/messages?conversation=${conversation.id}`)
    } catch (err) {
      console.error('Error starting conversation:', err)
      setError('Failed to open message thread. Please try again.')
    } finally {
      setMessageLoading(null)
    }
  }

  const handleCheckIn = async (booking: BookingWithDetails) => {
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

  const handleCheckOut = async (booking: BookingWithDetails) => {
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

  const handleComplete = async (booking: BookingWithDetails) => {
    if (!booking.shift || !user) return

    setStatusLoading(booking.id)
    setError(null)
    try {
      const hours = calculateShiftHours(booking.shift.startTime, booking.shift.endTime)
      await completeBooking(booking.id, hours, booking.shift.hourlyRate, user.uid)

      const therapistPayout = hours * booking.shift.hourlyRate
      const platformFee = therapistPayout * 0.20
      const amountDue = therapistPayout + platformFee
      setBookings(prev => prev.map(b =>
        b.id === booking.id ? { ...b, status: 'completed', hoursWorked: hours, amountDue, therapistPayout, platformFee } : b
      ))
    } catch (err) {
      console.error('Error completing booking:', err)
      setError('Failed to complete booking. Please try again.')
    } finally {
      setStatusLoading(null)
    }
  }

  function calculateShiftHours(startTime: string, endTime: string): number {
    try {
      const [startH, startM] = startTime.split(':').map(Number)
      const [endH, endM] = endTime.split(':').map(Number)
      const startMinutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM
      return Math.max(0, (endMinutes - startMinutes) / 60)
    } catch {
      return 0
    }
  }

  const handleResolveDispute = async () => {
    if (!user || !resolvingDispute || !resolvingDispute.shift) return
    const hours = parseFloat(resolveHours)
    if (isNaN(hours) || hours <= 0) {
      setError('Please enter valid hours')
      return
    }
    if (!resolveNotes.trim()) {
      setError('Please provide resolution notes')
      return
    }

    setResolveLoading(true)
    setError(null)
    try {
      await resolveDispute(
        resolvingDispute.id,
        user.uid,
        'organizer',
        hours,
        resolvingDispute.shift.hourlyRate,
        resolveNotes
      )

      const therapistPayout = hours * resolvingDispute.shift.hourlyRate
      const platformFee = Math.round(therapistPayout * 0.20 * 100) / 100
      const amountDue = therapistPayout + platformFee

      setBookings(prev => prev.map(b =>
        b.id === resolvingDispute.id ? {
          ...b,
          status: 'completed',
          hoursWorked: hours,
          therapistPayout,
          platformFee,
          amountDue,
        } : b
      ))
      setResolvingDispute(null)
      setResolveHours('')
      setResolveNotes('')
    } catch (err: any) {
      console.error('Error resolving dispute:', err)
      setError(err.message || 'Failed to resolve dispute. Please try again.')
    } finally {
      setResolveLoading(false)
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
  const disputedBookings = bookings.filter(b => b.status === 'disputed')
  const unpaidBookings = completedBookings.filter(b => !b.paidAt)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-gray-500 mt-1">View all confirmed therapist bookings for your shifts.</p>
      </div>

      {/* Payment Success/Cancelled Messages */}
      {paymentSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-800">Payment Successful!</h3>
            <p className="text-sm text-green-700">
              Your payment has been processed and the therapist will receive their payout.
            </p>
          </div>
        </div>
      )}

      {paymentCancelled && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-800">Payment Cancelled</h3>
            <p className="text-sm text-yellow-700">
              Your payment was cancelled. You can try again when ready.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{unpaidBookings.length}</p>
              <p className="text-sm text-gray-500">Awaiting Payment</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Disputed Bookings Alert */}
      {disputedBookings.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <h3 className="font-medium text-orange-800">
              {disputedBookings.length} booking{disputedBookings.length !== 1 ? 's' : ''} with hours disputes
            </h3>
          </div>
          <p className="text-sm text-orange-700 mt-1">
            Therapists have disputed the reported hours. Please review and resolve these disputes.
          </p>
        </div>
      )}

      {/* Unpaid Bookings Alert */}
      {unpaidBookings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-yellow-600" />
            <h3 className="font-medium text-yellow-800">
              {unpaidBookings.length} booking{unpaidBookings.length !== 1 ? 's' : ''} awaiting payment
            </h3>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            Please complete payment for completed shifts to ensure therapists are paid promptly.
          </p>
        </div>
      )}

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
            const needsPayment = booking.status === 'completed' && !booking.paidAt
            const hasTherapistStripe = !!booking.therapistProfile?.stripeAccountId

            return (
              <Card key={booking.id} className={needsPayment ? 'border-yellow-300' : isUpcoming ? 'border-blue-200' : ''}>
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
                        {needsPayment && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <DollarSign className="h-3 w-3 mr-1" />
                            Payment Due
                          </Badge>
                        )}
                        {booking.paidAt && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Paid
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

                      {/* Completed Info / Payment */}
                      {booking.status === 'completed' && shift && (
                        <div className="mt-3 text-sm">
                          <div className="flex items-center gap-4">
                            <span>
                              <span className="text-gray-500">Hours:</span>
                              <span className="ml-1 font-medium">
                                {booking.hoursWorked || calculateShiftHours(shift.startTime, shift.endTime).toFixed(1)}
                              </span>
                            </span>
                          </div>
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Therapist Pay:</span>
                              <span>{formatCurrency(booking.therapistPayout || ((booking.hoursWorked || calculateShiftHours(shift.startTime, shift.endTime)) * shift.hourlyRate))}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Service Fee (20%):</span>
                              <span>{formatCurrency(booking.platformFee || ((booking.therapistPayout || ((booking.hoursWorked || calculateShiftHours(shift.startTime, shift.endTime)) * shift.hourlyRate)) * 0.20))}</span>
                            </div>
                            <div className="flex justify-between font-medium border-t pt-1">
                              <span>Total Due:</span>
                              <span className="text-green-600">{formatCurrency(booking.amountDue || ((booking.therapistPayout || ((booking.hoursWorked || calculateShiftHours(shift.startTime, shift.endTime)) * shift.hourlyRate)) * 1.20))}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Disputed booking info */}
                      {booking.status === 'disputed' && shift && (
                        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm">
                          <div className="flex items-center gap-2 text-orange-800 font-medium mb-2">
                            <AlertTriangle className="h-4 w-4" />
                            Hours Disputed
                          </div>
                          <div className="space-y-1 text-orange-700">
                            <div className="flex justify-between">
                              <span>You reported:</span>
                              <span className="font-medium">{booking.organizerReportedHours || booking.hoursWorked} hours</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Therapist claims:</span>
                              <span className="font-medium">{booking.therapistClaimedHours} hours</span>
                            </div>
                          </div>
                          {booking.disputeReason && (
                            <p className="mt-2 text-xs text-orange-600 italic">
                              &ldquo;{booking.disputeReason}&rdquo;
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {/* Status Change Buttons */}
                      {booking.status === 'confirmed' && (
                        <Button
                          onClick={() => handleCheckIn(booking)}
                          disabled={statusLoading === booking.id}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {statusLoading === booking.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Check In
                        </Button>
                      )}
                      {booking.status === 'checked_in' && (
                        <Button
                          onClick={() => handleCheckOut(booking)}
                          disabled={statusLoading === booking.id}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {statusLoading === booking.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Clock className="h-4 w-4 mr-2" />
                          )}
                          Check Out
                        </Button>
                      )}
                      {booking.status === 'checked_out' && (
                        <Button
                          onClick={() => handleComplete(booking)}
                          disabled={statusLoading === booking.id}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {statusLoading === booking.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Mark Complete
                        </Button>
                      )}
                      {needsPayment && hasTherapistStripe && (
                        <Button
                          onClick={() => handlePayNow(booking)}
                          disabled={paymentLoading === booking.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {paymentLoading === booking.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <CreditCard className="h-4 w-4 mr-2" />
                          )}
                          Pay Now
                        </Button>
                      )}
                      {needsPayment && !hasTherapistStripe && (
                        <Button variant="outline" size="sm" disabled>
                          Awaiting Therapist Setup
                        </Button>
                      )}
                      {booking.status === 'disputed' && (
                        <Button
                          onClick={() => {
                            setResolvingDispute(booking)
                            setResolveHours(booking.therapistClaimedHours?.toString() || booking.hoursWorked?.toString() || '')
                          }}
                          size="sm"
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          <Scale className="h-4 w-4 mr-2" />
                          Resolve Dispute
                        </Button>
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
                      {booking.status === 'completed' && !booking.review && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReviewingBooking(booking.id)}
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                      )}
                      {booking.review && (
                        <div className="flex items-center gap-1 text-sm">
                          <StarRating rating={booking.review.rating} size="sm" />
                        </div>
                      )}
                      {shift && (
                        <Link href={`/organizer/shifts/${shift.id}`}>
                          <Button variant="outline" size="sm">View Shift</Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Review Form */}
                  {reviewingBooking === booking.id && user && (
                    <div className="mt-4 pt-4 border-t">
                      <ReviewForm
                        bookingId={booking.id}
                        shiftId={booking.shiftId}
                        therapistId={booking.therapistId}
                        organizerId={user.uid}
                        therapistName={booking.therapistUser?.fullName || 'the therapist'}
                        onSuccess={() => {
                          setReviewingBooking(null)
                          // Refetch to show the review
                          window.location.reload()
                        }}
                        onCancel={() => setReviewingBooking(null)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Resolve Dispute Modal */}
      {resolvingDispute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Scale className="h-5 w-5 text-orange-600" />
                Resolve Hours Dispute
              </h3>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 text-sm">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">You reported:</span>
                    <span className="font-medium">{resolvingDispute.organizerReportedHours || resolvingDispute.hoursWorked} hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Therapist claims:</span>
                    <span className="font-medium">{resolvingDispute.therapistClaimedHours} hours</span>
                  </div>
                </div>
                {resolvingDispute.disputeReason && (
                  <p className="mt-2 text-xs text-gray-600 italic border-t pt-2">
                    Reason: &ldquo;{resolvingDispute.disputeReason}&rdquo;
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <Input
                  label="Final Hours (agreed upon)"
                  type="number"
                  step="0.5"
                  min="0"
                  value={resolveHours}
                  onChange={(e) => setResolveHours(e.target.value)}
                  placeholder="e.g., 8.5"
                />

                <Textarea
                  label="Resolution Notes"
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Explain how the dispute was resolved..."
                  rows={3}
                />

                {resolveHours && resolvingDispute.shift && (
                  <div className="p-3 bg-gray-50 rounded-lg text-sm">
                    <p className="text-gray-600 mb-1">Updated payment:</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Therapist Pay:</span>
                        <span>{formatCurrency(parseFloat(resolveHours) * resolvingDispute.shift.hourlyRate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service Fee (20%):</span>
                        <span>{formatCurrency(parseFloat(resolveHours) * resolvingDispute.shift.hourlyRate * 0.20)}</span>
                      </div>
                      <div className="flex justify-between font-medium border-t pt-1">
                        <span>Total Due:</span>
                        <span className="text-green-600">{formatCurrency(parseFloat(resolveHours) * resolvingDispute.shift.hourlyRate * 1.20)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setResolvingDispute(null)
                      setResolveHours('')
                      setResolveNotes('')
                    }}
                    disabled={resolveLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleResolveDispute}
                    disabled={resolveLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {resolveLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Resolve & Complete
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
