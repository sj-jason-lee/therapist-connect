import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  FileCheck,
  ArrowRight,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default async function TherapistDashboardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get therapist profile
  const { data: therapist } = await supabase
    .from('therapists')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Get profile info
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get application stats
  const { count: pendingApplications } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('therapist_id', therapist?.id)
    .eq('status', 'pending')

  const { count: acceptedApplications } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('therapist_id', therapist?.id)
    .eq('status', 'accepted')

  // Get upcoming bookings
  const { data: upcomingBookings } = await supabase
    .from('bookings')
    .select(`
      *,
      shift:shifts(*)
    `)
    .eq('therapist_id', therapist?.id)
    .in('status', ['confirmed', 'checked_in'])
    .order('created_at', { ascending: true })
    .limit(5)

  // Get recent earnings
  const { data: recentEarnings } = await supabase
    .from('bookings')
    .select('therapist_payout')
    .eq('therapist_id', therapist?.id)
    .eq('status', 'completed')
    .not('therapist_payout', 'is', null)

  const totalEarnings = recentEarnings?.reduce(
    (sum, booking) => sum + (booking.therapist_payout || 0),
    0
  ) || 0

  // Check profile completion
  const isProfileComplete = therapist?.cata_number && therapist?.city && therapist?.province
  const isCredentialsVerified = therapist?.credentials_verified

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Therapist'}
        </h1>
        <p className="text-gray-500 mt-1">Here&apos;s what&apos;s happening with your account.</p>
      </div>

      {/* Alerts */}
      {(!isProfileComplete || !isCredentialsVerified) && (
        <div className="space-y-3">
          {!isProfileComplete && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800">Complete your profile</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Your profile is incomplete. Add your credentials and location to start applying for shifts.
                </p>
                <Link
                  href="/therapist/profile"
                  className="text-sm font-medium text-yellow-800 hover:text-yellow-900 mt-2 inline-flex items-center"
                >
                  Complete profile <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          )}

          {isProfileComplete && !isCredentialsVerified && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <FileCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800">Credentials pending verification</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Your credentials are being reviewed. You can browse shifts but can&apos;t apply until verified.
                </p>
                <Link
                  href="/therapist/credentials"
                  className="text-sm font-medium text-blue-800 hover:text-blue-900 mt-2 inline-flex items-center"
                >
                  View credentials <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Applications</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{pendingApplications || 0}</p>
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
                <p className="text-sm font-medium text-gray-500">Accepted Applications</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{acceptedApplications || 0}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Upcoming Shifts</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{upcomingBookings?.length || 0}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalEarnings)}</p>
              </div>
              <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/therapist/shifts">
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Browse Available Shifts
              </Button>
            </Link>
            <Link href="/therapist/applications">
              <Button className="w-full justify-start" variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                View My Applications
              </Button>
            </Link>
            <Link href="/therapist/profile">
              <Button className="w-full justify-start" variant="outline">
                <FileCheck className="h-4 w-4 mr-2" />
                Update Profile
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingBookings && upcomingBookings.length > 0 ? (
              <div className="space-y-3">
                {upcomingBookings.map((booking: any) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{booking.shift?.title}</p>
                      <p className="text-sm text-gray-500">
                        {booking.shift?.date} at {booking.shift?.start_time}
                      </p>
                    </div>
                    <Badge variant={booking.status === 'checked_in' ? 'success' : 'info'}>
                      {booking.status === 'checked_in' ? 'In Progress' : 'Confirmed'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No upcoming bookings</p>
                <Link href="/therapist/shifts" className="text-primary-600 hover:text-primary-700 text-sm">
                  Browse available shifts
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Verification Status */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {therapist?.cata_number ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium text-gray-900">CATA Certification</p>
                <p className="text-sm text-gray-500">
                  {therapist?.cata_number ? `#${therapist.cata_number}` : 'Not provided'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {therapist?.insurance_policy_number ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium text-gray-900">Liability Insurance</p>
                <p className="text-sm text-gray-500">
                  {therapist?.insurance_provider || 'Not provided'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {therapist?.bls_expiry ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium text-gray-900">BLS Certification</p>
                <p className="text-sm text-gray-500">
                  {therapist?.bls_expiry ? `Expires: ${therapist.bls_expiry}` : 'Not provided'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
