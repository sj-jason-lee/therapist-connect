'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/firebase/AuthContext'
import { getBookingsByTherapist, getShift, Booking, Shift } from '@/lib/firebase/firestore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  Loader2,
  CheckCircle,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface BookingWithShift extends Booking {
  shift?: Shift | null
}

export default function TherapistEarningsPage() {
  const { user, loading: authLoading } = useAuth()
  const [bookings, setBookings] = useState<BookingWithShift[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEarnings: 0,
    paidOut: 0,
    pending: 0,
    totalHours: 0,
  })

  useEffect(() => {
    async function fetchEarnings() {
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

            // Check if payment has been processed
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
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchEarnings()
    }
  }, [user, authLoading])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
        <p className="text-gray-500 mt-1">Track your earnings and payment history.</p>
      </div>

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900">No Payout Account</p>
                <p className="text-sm text-gray-500">Connect a Stripe account to receive payouts</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Not Connected
            </Badge>
          </div>
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
