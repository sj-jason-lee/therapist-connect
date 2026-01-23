'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/firebase/AuthContext'
import {
  getBookingsByTherapist,
  getShift,
  getTherapistProfile,
  updateTherapistProfile,
  Booking,
  Shift,
} from '@/lib/firebase/firestore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  Loader2,
  CheckCircle,
  ExternalLink,
  AlertCircle,
  CreditCard,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface BookingWithShift extends Booking {
  shift?: Shift | null
}

interface StripeAccountStatus {
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
}

export default function TherapistEarningsPage() {
  const searchParams = useSearchParams()
  const { user, profile, loading: authLoading } = useAuth()
  const [bookings, setBookings] = useState<BookingWithShift[]>([])
  const [loading, setLoading] = useState(true)
  const [stripeLoading, setStripeLoading] = useState(false)
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null)
  const [stripeStatus, setStripeStatus] = useState<StripeAccountStatus | null>(null)
  const [stats, setStats] = useState({
    totalEarnings: 0,
    paidOut: 0,
    pending: 0,
    totalHours: 0,
  })
  const [error, setError] = useState<string | null>(null)

  const stripeSuccess = searchParams.get('stripe_success') === 'true'
  const stripeRefresh = searchParams.get('stripe_refresh') === 'true'

  useEffect(() => {
    async function fetchData() {
      if (!user) return

      try {
        // Fetch therapist profile to get Stripe account ID
        const therapistProfile = await getTherapistProfile(user.uid)
        if (therapistProfile?.stripeAccountId) {
          setStripeAccountId(therapistProfile.stripeAccountId)

          // Fetch Stripe account status
          const response = await fetch('/api/stripe/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'status',
              accountId: therapistProfile.stripeAccountId,
            }),
          })

          if (response.ok) {
            const status = await response.json()
            setStripeStatus(status)
          }
        }

        // Fetch bookings
        const fetchedBookings = await getBookingsByTherapist(user.uid)

        // Fetch shift details for each booking
        const bookingsWithShifts = await Promise.all(
          fetchedBookings.map(async (booking) => {
            const shift = await getShift(booking.shiftId)
            return { ...booking, shift }
          })
        )

        // Calculate stats
        let totalEarnings = 0
        let paidOut = 0
        let pending = 0
        let totalHours = 0

        for (const booking of bookingsWithShifts) {
          if (booking.status === 'completed') {
            const payout = booking.therapistPayout || 0
            const hours = booking.hoursWorked || 0

            totalEarnings += payout
            totalHours += hours

            if (booking.paidAt) {
              paidOut += payout
            } else {
              pending += payout
            }
          }
        }

        setStats({
          totalEarnings,
          paidOut,
          pending,
          totalHours,
        })

        // Sort by completion date (newest first)
        const completedBookings = bookingsWithShifts
          .filter(b => b.status === 'completed')
          .sort((a, b) => {
            const dateA = a.updatedAt?.toDate?.() || new Date(0)
            const dateB = b.updatedAt?.toDate?.() || new Date(0)
            return dateB.getTime() - dateA.getTime()
          })

        setBookings(completedBookings)
      } catch (err) {
        console.error('Error fetching earnings:', err)
        setError('Failed to load earnings data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchData()
    }
  }, [user, authLoading])

  const handleConnectStripe = async () => {
    if (!user || !profile) return

    setStripeLoading(true)

    try {
      // Parse name into first and last
      const nameParts = profile.fullName.split(' ')
      const firstName = nameParts[0] || 'Unknown'
      const lastName = nameParts.slice(1).join(' ') || 'Unknown'

      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          therapistId: user.uid,
          email: profile.email,
          firstName,
          lastName,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create Stripe account')
      }

      const { accountId, onboardingUrl } = await response.json()

      // Save the account ID to the therapist profile
      await updateTherapistProfile(user.uid, { stripeAccountId: accountId })
      setStripeAccountId(accountId)

      // Redirect to Stripe onboarding
      window.location.href = onboardingUrl
    } catch (err) {
      console.error('Error connecting Stripe:', err)
      setError('Failed to set up payout account. Please try again.')
    } finally {
      setStripeLoading(false)
    }
  }

  const handleCompleteOnboarding = async () => {
    if (!stripeAccountId) return

    setStripeLoading(true)

    try {
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refresh',
          accountId: stripeAccountId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create onboarding link')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to continue onboarding. Please try again.')
    } finally {
      setStripeLoading(false)
    }
  }

  const handleViewDashboard = async () => {
    if (!stripeAccountId) return

    setStripeLoading(true)

    try {
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          accountId: stripeAccountId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create dashboard link')
      }

      const { url } = await response.json()
      window.open(url, '_blank')
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to open Stripe dashboard. Please try again.')
    } finally {
      setStripeLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const isStripeFullyConnected = stripeStatus?.chargesEnabled && stripeStatus?.payoutsEnabled
  const needsOnboarding = stripeAccountId && !stripeStatus?.detailsSubmitted

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
        <p className="text-gray-500 mt-1">Track your earnings and payment history.</p>
      </div>

      {/* Success/Refresh Messages */}
      {stripeSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-800">Payout Account Connected!</h3>
            <p className="text-sm text-green-700">
              Your Stripe account is now set up. You&apos;ll receive automatic payouts after completing shifts.
            </p>
          </div>
        </div>
      )}

      {stripeRefresh && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-800">Onboarding Incomplete</h3>
            <p className="text-sm text-yellow-700">
              Please complete your Stripe account setup to receive payouts.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats.totalEarnings)}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Paid Out</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats.paidOut)}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats.pending)}
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalHours.toFixed(1)}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout Account */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Account</CardTitle>
        </CardHeader>
        <CardContent>
          {!stripeAccountId ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">No Payout Account</p>
                  <p className="text-sm text-gray-500">Connect a Stripe account to receive payouts</p>
                </div>
              </div>
              <Button onClick={handleConnectStripe} disabled={stripeLoading}>
                {stripeLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Set Up Payouts
              </Button>
            </div>
          ) : needsOnboarding ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Onboarding Incomplete</p>
                  <p className="text-sm text-gray-500">Complete your Stripe setup to receive payouts</p>
                </div>
              </div>
              <Button onClick={handleCompleteOnboarding} disabled={stripeLoading}>
                {stripeLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Complete Setup
              </Button>
            </div>
          ) : isStripeFullyConnected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Stripe Connected</p>
                  <p className="text-sm text-gray-500">Payouts will be sent automatically after shifts</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success">Connected</Badge>
                <Button variant="outline" onClick={handleViewDashboard} disabled={stripeLoading}>
                  {stripeLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Dashboard
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Account Pending</p>
                  <p className="text-sm text-gray-500">Your account is being reviewed by Stripe</p>
                </div>
              </div>
              <Badge variant="warning">Pending</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings History</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p>No earnings yet</p>
              <p className="text-sm">Complete shifts to start earning</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const shift = booking.shift
                const shiftDate = shift?.date?.toDate?.()
                const formattedDate = shiftDate
                  ? shiftDate.toLocaleDateString('en-CA', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Unknown date'

                return (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{shift?.title || 'Unknown Shift'}</p>
                        <p className="text-sm text-gray-500">
                          {formattedDate} · {booking.hoursWorked || 0} hours
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        +{formatCurrency(booking.therapistPayout || 0)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {booking.paidAt ? 'Paid' : 'Pending'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
