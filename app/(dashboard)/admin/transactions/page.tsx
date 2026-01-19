'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Calendar,
  User,
  Building2,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { formatDate, formatTime, formatCurrency } from '@/lib/utils'

interface Transaction {
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
    organizer: {
      id: string
      organization_name: string | null
      profile: {
        full_name: string
        email: string
      } | null
    } | null
  } | null
  therapist: {
    id: string
    profile: {
      full_name: string
      email: string
    } | null
  } | null
}

interface Stats {
  totalTransactions: number
  totalRevenue: number
  totalPlatformFees: number
  totalPayouts: number
  paidBookings: number
  pendingPayments: number
}

export default function AdminTransactionsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<Stats>({
    totalTransactions: 0,
    totalRevenue: 0,
    totalPlatformFees: 0,
    totalPayouts: 0,
    paidBookings: 0,
    pendingPayments: 0,
  })
  const [filters, setFilters] = useState({
    status: '',
    paid: '',
  })

  useEffect(() => {
    loadTransactions()
  }, [filters])

  const loadTransactions = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.paid) params.set('paid', filters.paid)

      const response = await fetch(`/api/admin/transactions?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to load transactions')
        setLoading(false)
        return
      }

      setTransactions(data.transactions)
      setStats(data.stats)
    } catch (err) {
      setError('An unexpected error occurred')
    }

    setLoading(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="info">Confirmed</Badge>
      case 'checked_in':
        return <Badge variant="warning">In Progress</Badge>
      case 'checked_out':
        return <Badge variant="success">Checked Out</Badge>
      case 'completed':
        return <Badge variant="success">Completed</Badge>
      case 'cancelled':
        return <Badge variant="error">Cancelled</Badge>
      default:
        return <Badge variant="default">{status}</Badge>
    }
  }

  const getPaymentBadge = (transaction: Transaction) => {
    if (transaction.paid_at) {
      return (
        <Badge variant="success" className="text-xs">
          <CheckCircle className="h-3 w-3 mr-1" />
          Paid
        </Badge>
      )
    }
    if (transaction.status === 'completed' || transaction.status === 'checked_out') {
      return (
        <Badge variant="warning" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      )
    }
    return null
  }

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-500 mt-1">View all platform bookings and payments.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.totalTransactions}</p>
                <p className="text-xs text-gray-500">Total Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-xs text-gray-500">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{formatCurrency(stats.totalPlatformFees)}</p>
                <p className="text-xs text-gray-500">Service Fees</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{formatCurrency(stats.totalPayouts)}</p>
                <p className="text-xs text-gray-500">Therapist Payouts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.paidBookings}</p>
                <p className="text-xs text-gray-500">Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.pendingPayments}</p>
                <p className="text-xs text-gray-500">Pending Payment</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Select
              name="status"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              options={[
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'checked_in', label: 'In Progress' },
                { value: 'checked_out', label: 'Checked Out' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
              placeholder="All Statuses"
            />

            <Select
              name="paid"
              value={filters.paid}
              onChange={(e) => setFilters(prev => ({ ...prev, paid: e.target.value }))}
              options={[
                { value: 'true', label: 'Paid Only' },
                { value: 'false', label: 'Unpaid Only' },
              ]}
              placeholder="All Payment Status"
            />

            {(filters.status || filters.paid) && (
              <Button
                variant="outline"
                onClick={() => setFilters({ status: '', paid: '' })}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </div>
      ) : transactions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No transactions found</h3>
            <p className="text-gray-500 mt-1">Bookings will appear here once created.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <Card key={transaction.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row">
                  {/* Main Info */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">
                            {transaction.shift?.title || 'Unknown Shift'}
                          </h3>
                          {getStatusBadge(transaction.status)}
                          {getPaymentBadge(transaction)}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {transaction.shift ? formatDate(transaction.shift.date) : 'N/A'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {transaction.shift ? `${formatTime(transaction.shift.start_time)} - ${formatTime(transaction.shift.end_time)}` : 'N/A'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4 text-primary-600" />
                            {transaction.therapist?.profile?.full_name || 'Unknown Therapist'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4 text-secondary-600" />
                            {transaction.shift?.organizer?.organization_name || transaction.shift?.organizer?.profile?.full_name || 'Unknown Organizer'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Info */}
                  <div className="lg:w-64 p-6 bg-gray-50 border-t lg:border-t-0 lg:border-l">
                    {transaction.amount_due ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Therapist Payout</span>
                          <span className="text-green-600">{formatCurrency(transaction.therapist_payout || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Service Fee (20%)</span>
                          <span className="text-blue-600">+{formatCurrency(transaction.platform_fee || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                          <span className="text-gray-500">Organizer Total</span>
                          <span className="font-medium">{formatCurrency(transaction.amount_due)}</span>
                        </div>
                        {transaction.hours_worked && (
                          <div className="flex justify-between text-sm pt-2 border-t">
                            <span className="text-gray-500">Hours Worked</span>
                            <span>{transaction.hours_worked}h</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 text-sm">
                        <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p>Not yet checked out</p>
                        <p className="text-xs mt-1">Rate: {formatCurrency(transaction.shift?.hourly_rate || 0)}/hr</p>
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
      {!loading && transactions.length > 0 && (
        <p className="text-sm text-gray-500 text-center">
          Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
