import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  PlusCircle,
  Calendar,
  Users,
  DollarSign,
  ClipboardList,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default async function OrganizerDashboardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get organizer profile
  const { data: organizer } = await supabase
    .from('organizers')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Get profile info
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get shift stats
  const { count: openShifts } = await supabase
    .from('shifts')
    .select('*', { count: 'exact', head: true })
    .eq('organizer_id', organizer?.id)
    .eq('status', 'open')

  const { count: filledShifts } = await supabase
    .from('shifts')
    .select('*', { count: 'exact', head: true })
    .eq('organizer_id', organizer?.id)
    .eq('status', 'filled')

  // Get pending applications count using a join (fixes N+1 query)
  const { count: pendingApplicationsCount } = await supabase
    .from('applications')
    .select('*, shifts!inner(organizer_id)', { count: 'exact', head: true })
    .eq('shifts.organizer_id', organizer?.id)
    .eq('status', 'pending')

  // Get recent shifts
  const { data: recentShifts } = await supabase
    .from('shifts')
    .select('*')
    .eq('organizer_id', organizer?.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Get total spent
  const { data: completedBookings } = await supabase
    .from('bookings')
    .select('amount_due, shifts!inner(organizer_id)')
    .eq('shifts.organizer_id', organizer?.id)
    .eq('status', 'completed')

  const totalSpent = completedBookings?.reduce(
    (sum, booking) => sum + (booking.amount_due || 0),
    0
  ) || 0

  const isProfileComplete = organizer?.organization_name && organizer?.city

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {organizer?.organization_name || profile?.full_name?.split(' ')[0] || 'Organizer'}
          </h1>
          <p className="text-gray-500 mt-1">Manage your shifts and find qualified therapists.</p>
        </div>
        <Link href="/organizer/shifts/new">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            Post New Shift
          </Button>
        </Link>
      </div>

      {/* Profile Alert */}
      {!isProfileComplete && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800">Complete your profile</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Add your organization details to start posting shifts.
            </p>
            <Link
              href="/organizer/profile"
              className="text-sm font-medium text-yellow-800 hover:text-yellow-900 mt-2 inline-flex items-center"
            >
              Complete profile <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      )}

      {/* Pending Applications Alert */}
      {(pendingApplicationsCount ?? 0) > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Users className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-800">
              {pendingApplicationsCount || 0} pending application{(pendingApplicationsCount ?? 0) > 1 ? 's' : ''}
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              Therapists are waiting to hear back about your shifts.
            </p>
            <Link
              href="/organizer/shifts"
              className="text-sm font-medium text-blue-800 hover:text-blue-900 mt-2 inline-flex items-center"
            >
              Review applications <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Open Shifts</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{openShifts || 0}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Filled Shifts</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{filledShifts || 0}</p>
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
                <p className="text-sm font-medium text-gray-500">Pending Applications</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{pendingApplicationsCount || 0}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalSpent)}</p>
              </div>
              <div className="h-12 w-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-secondary-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Recent Shifts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/organizer/shifts/new">
              <Button className="w-full justify-start" variant="outline">
                <PlusCircle className="h-4 w-4 mr-2" />
                Post a New Shift
              </Button>
            </Link>
            <Link href="/organizer/shifts">
              <Button className="w-full justify-start" variant="outline">
                <ClipboardList className="h-4 w-4 mr-2" />
                Manage My Shifts
              </Button>
            </Link>
            <Link href="/organizer/bookings">
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                View Bookings
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Shifts</CardTitle>
            <Link href="/organizer/shifts" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentShifts && recentShifts.length > 0 ? (
              <div className="space-y-3">
                {recentShifts.map((shift) => (
                  <Link
                    key={shift.id}
                    href={`/organizer/shifts/${shift.id}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{shift.title}</p>
                      <p className="text-sm text-gray-500">{shift.date}</p>
                    </div>
                    <Badge
                      variant={
                        shift.status === 'open'
                          ? 'info'
                          : shift.status === 'filled'
                          ? 'success'
                          : shift.status === 'completed'
                          ? 'default'
                          : 'error'
                      }
                    >
                      {shift.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No shifts yet</p>
                <Link
                  href="/organizer/shifts/new"
                  className="text-secondary-600 hover:text-secondary-700 text-sm"
                >
                  Post your first shift
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
