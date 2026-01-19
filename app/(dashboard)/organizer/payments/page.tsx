'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
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
  check_in_time: string | null
  check_out_time: string | null
  hours_worked: number | null
  amount_due: number | null
  platform_fee: number | null
  therapist_payout: number | null
  paid_at: string | null
  created_at: string
  shift: {
    id: string
    title: string
    date: string
    start_time: string
    end_time: string
    hourly_rate: number
    city: string
    province: string
  }
  therapist: {
    id: string
    user_id: string
    profile: {
      full_name: string
      email: string
    } | null
  } | null
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
    loadPayments()
  }, [filter])

  const loadPayments = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filter) params.set('status', filter)

      const response = await fetch(`/api/organizer/payments?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to load payments')
        setLoading(false)
        return
      }

      setPayments(data.payments)
      setStats(data.stats)
    } catch (err) {
      setError('An unexpected error occurred')
    }

    setLoading(false)
  }

  const getStatusBadge = (payment: Payment) => {
    if (payment.paid_at) {
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

  if (loading && payments.length === 0) {
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
                            {formatDate(payment.shift.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatTime(payment.shift.start_time)} - {formatTime(payment.shift.end_time)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4 text-primary-600" />
                            {payment.therapist?.profile?.full_name || 'Unknown Therapist'}
                          </span>
                        </div>

                        {payment.paid_at && (
                          <p className="text-xs text-gray-500 mt-2">
                            Paid on {formatDate(payment.paid_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Financial Info */}
                  <div className="lg:w-64 p-6 bg-gray-50 border-t lg:border-t-0 lg:border-l">
                    {payment.amount_due ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Hours Worked</span>
                          <span className="font-medium">{payment.hours_worked || 0}h</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Rate</span>
                          <span>{formatCurrency(payment.shift.hourly_rate)}/hr</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t">
                          <span className="text-gray-500">Therapist Pay</span>
                          <span className="text-primary-600">{formatCurrency(payment.therapist_payout || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Service Fee (20%)</span>
                          <span className="text-purple-600">+{formatCurrency(payment.platform_fee || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                          <span className="text-gray-700">Your Total</span>
                          <span className="text-gray-900">{formatCurrency(payment.amount_due)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 text-sm">
                        <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p>Awaiting checkout</p>
                        <p className="text-xs mt-1">Rate: {formatCurrency(payment.shift.hourly_rate)}/hr</p>
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
