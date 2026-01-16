import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  Building2,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export default async function TherapistEarningsPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get therapist
  const { data: therapist } = await supabase
    .from('therapists')
    .select('id, stripe_account_id')
    .eq('user_id', user.id)
    .single()

  // Get all completed/paid bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      shift:shifts(
        title,
        date,
        hourly_rate,
        organizer:organizers(
          organization_name
        )
      )
    `)
    .eq('therapist_id', therapist?.id)
    .in('status', ['checked_out', 'completed'])
    .order('created_at', { ascending: false })

  // Calculate totals
  const totalEarnings = bookings?.reduce((sum, b) => sum + (b.therapist_payout || 0), 0) || 0
  const totalHours = bookings?.reduce((sum, b) => sum + (b.hours_worked || 0), 0) || 0
  const paidEarnings = bookings?.filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + (b.therapist_payout || 0), 0) || 0
  const pendingEarnings = bookings?.filter(b => b.status === 'checked_out')
    .reduce((sum, b) => sum + (b.therapist_payout || 0), 0) || 0

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
                  {formatCurrency(totalEarnings)}
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
                  {formatCurrency(paidEarnings)}
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
                  {formatCurrency(pendingEarnings)}
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
                  {totalHours.toFixed(1)}
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
          {therapist?.stripe_account_id ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Stripe Connected</p>
                  <p className="text-sm text-gray-500">Your payouts will be sent to your connected bank account</p>
                </div>
              </div>
              <Badge variant="success">Connected</Badge>
            </div>
          ) : (
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
              <Badge variant="warning">Not Connected</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings && bookings.length > 0 ? (
            <div className="divide-y">
              {bookings.map((booking) => (
                <div key={booking.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center mt-1">
                        <Building2 className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{booking.shift?.title}</p>
                        <p className="text-sm text-gray-500">
                          {booking.shift?.organizer?.organization_name}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>{formatDate(booking.shift?.date)}</span>
                          <span>{booking.hours_worked} hours</span>
                          <span>${booking.shift?.hourly_rate}/hr</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        {formatCurrency(booking.therapist_payout || 0)}
                      </p>
                      <Badge
                        variant={booking.status === 'completed' ? 'success' : 'warning'}
                        className="mt-1"
                      >
                        {booking.status === 'completed' ? 'Paid' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p>No earnings yet</p>
              <p className="text-sm">Complete shifts to start earning</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
