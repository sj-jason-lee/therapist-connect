'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase/AuthContext'
import {
  getShiftsByOrganizer,
  getBookingsByShift,
  getUserProfile,
  Shift,
} from '@/lib/firebase/firestore'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DollarSign,
  Clock,
  CheckCircle,
  Loader2,
  AlertCircle,
  Calendar,
  User,
  CreditCard,
  Receipt,
  Wallet,
} from 'lucide-react'
import { formatDate, formatTime, formatCurrency } from '@/lib/utils'

interface Payment {
  id: string
  status: string
  checkInTime: Date | null
  checkOutTime: Date | null
  hoursWorked: number | null
  amountDue: number | null
  platformFee: number | null
  therapistPayout: number | null
  paidAt: Date | null
  createdAt: Date
  shift: Shift
  therapistName: string
}

interface Stats {
  totalSpent: number
  paidAmount: number
  pendingAmount: number
  paidCount: number
  pendingCount: number
  totalBookings: number
}

export default function OrganizerPaymentsPage() {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<Stats>({
    totalSpent: 0,
    paidAmount: 0,
    pendingAmount: 0,
    paidCount: 0,
    pendingCount: 0,
    totalBookings: 0,
  })
  const [filter, setFilter] = useState('')

  useEffect(() => {
    if (!authLoading && user) {
      loadPayments()
    }
  }, [filter, user, authLoading])

  const loadPayments = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // Get all shifts for this organizer
      const shifts = await getShiftsByOrganizer(user.uid)
      const shiftsMap = new Map(shifts.map(s => [s.id, s]))

      // Get all bookings for all shifts
      const allPayments: Payment[] = []

      for (const shift of shifts) {
        const bookings = await getBookingsByShift(shift.id)

        for (const booking of bookings) {
          // Get therapist name
          let therapistName = 'Unknown Therapist'
          try {
            const therapistProfile = await getUserProfile(booking.therapistId)
            if (therapistProfile) {
              therapistName = therapistProfile.fullName
            }
          } catch (e) {
            // Ignore errors fetching therapist profile
          }

          allPayments.push({
            id: booking.id,
            status: booking.status,
            checkInTime: booking.checkInTime?.toDate() || null,
            checkOutTime: booking.checkOutTime?.toDate() || null,
            hoursWorked: booking.hoursWorked || null,
            amountDue: booking.amountDue || null,
            platformFee: booking.platformFee || null,
            therapistPayout: booking.therapistPayout || null,
            paidAt: booking.paidAt?.toDate() || null,
            createdAt: booking.createdAt?.toDate() || new Date(),
            shift,
            therapistName,
          })
        }
      }

      // Apply filter
      let filteredPayments = allPayments
      if (filter === 'paid') {
        filteredPayments = allPayments.filter(p => p.paidAt !== null)
      } else if (filter === 'pending') {
        filteredPayments = allPayments.filter(p =>
          p.paidAt === null && (p.status === 'completed' || p.status === 'checked_out')
        )
      }

      // Sort by date (newest first)
      filteredPayments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

      // Calculate stats
      const paidPayments = allPayments.filter(p => p.paidAt !== null)
      const pendingPayments = allPayments.filter(p =>
        p.paidAt === null && (p.status === 'completed' || p.status === 'checked_out')
      )

      setStats({
        totalBookings: allPayments.length,
        totalSpent: allPayments.reduce((sum, p) => sum + (p.amountDue || 0), 0),
        paidAmount: paidPayments.reduce((sum, p) => sum + (p.amountDue || 0), 0),
        pendingAmount: pendingPayments.reduce((sum, p) => sum + (p.amountDue || 0), 0),
        paidCount: paidPayments.length,
        pendingCount: pendingPayments.length,
      })

      setPayments(filteredPayments)
    } catch (err) {
      console.error('Error loading payments:', err)
      setError('An unexpected error occurred')
    }

    setLoading(false)
  }

  const getStatusBadge = (payment: Payment) => {
    if (payment.paidAt) {
      return (
        <Badge variant="success" className="text-xs">
          <CheckCircle className="h-3 w-3 mr-1" />
          Paid
        </Badge>
      )
    }
    if (payment.status === 'completed' || payment.status === 'checked_out') {
      return (
        <Badge variant="warning" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Payment Pending
        </Badge>
      )
    }
    return (
      <Badge variant="info" className="text-xs">
        In Progress
      </Badge>
    )
  }

  if (authLoading || (loading && payments.length === 0)) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-secondary-600" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-500 mt-1">View your payment history and pending payments.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card
          className={`cursor-pointer transition-all ${filter === '' ? 'ring-2 ring-secondary-500' : ''}`}
          onClick={() => setFilter('')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-secondary-100 rounded-full flex items-center justify-center">
                <Receipt className="h-5 w-5 text-secondary-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.totalBookings}</p>
                <p className="text-xs text-gray-500">Total Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{formatCurrency(stats.totalSpent)}</p>
                <p className="text-xs text-gray-500">Total Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${filter === 'paid' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => setFilter('paid')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{formatCurrency(stats.paidAmount)}</p>
                <p className="text-xs text-gray-500">Paid ({stats.paidCount})</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${filter === 'pending' ? 'ring-2 ring-yellow-500' : ''}`}
          onClick={() => setFilter('pending')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{formatCurrency(stats.pendingAmount)}</p>
                <p className="text-xs text-gray-500">Pending ({stats.pendingCount})</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 md:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xl font-bold">+20%</p>
                <p className="text-xs text-gray-500">Service Fee</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter controls */}
      {filter && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Showing: {filter === 'paid' ? 'Paid payments' : 'Pending payments'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilter('')}
          >
            Clear Filter
          </Button>
        </div>
      )}

      {/* Payments List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-secondary-600" />
        </div>
      ) : payments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No payments found</h3>
            <p className="text-gray-500 mt-1">
              {filter
                ? 'No payments match your filter.'
                : 'Payments will appear here once therapists complete shifts.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <Card key={payment.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row">
                  {/* Main Info */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">
                            {payment.shift.title}
                          </h3>
                          {getStatusBadge(payment)}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {payment.shift.date?.toDate ? formatDate(payment.shift.date.toDate().toISOString()) : 'TBD'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatTime(payment.shift.startTime)} - {formatTime(payment.shift.endTime)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4 text-primary-600" />
                            {payment.therapistName}
                          </span>
                        </div>

                        {payment.paidAt && (
                          <p className="text-xs text-gray-500 mt-2">
                            Paid on {formatDate(payment.paidAt.toISOString())}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Financial Info */}
                  <div className="lg:w-64 p-6 bg-gray-50 border-t lg:border-t-0 lg:border-l">
                    {payment.amountDue ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Hours Worked</span>
                          <span className="font-medium">{payment.hoursWorked || 0}h</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Rate</span>
                          <span>{formatCurrency(payment.shift.hourlyRate)}/hr</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t">
                          <span className="text-gray-500">Therapist Pay</span>
                          <span className="text-primary-600">{formatCurrency(payment.therapistPayout || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Service Fee (20%)</span>
                          <span className="text-purple-600">+{formatCurrency(payment.platformFee || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                          <span className="text-gray-700">Your Total</span>
                          <span className="text-gray-900">{formatCurrency(payment.amountDue)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 text-sm">
                        <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p>Awaiting checkout</p>
                        <p className="text-xs mt-1">Rate: {formatCurrency(payment.shift.hourlyRate)}/hr</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results count */}
      {!loading && payments.length > 0 && (
        <p className="text-sm text-gray-500 text-center">
          Showing {payments.length} payment{payments.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
