'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/firebase/AuthContext'
import {
  getShiftsByOrganizer,
  getApplicationsByShift,
  getBookingsByShift,
  Shift,
} from '@/lib/firebase/firestore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SkeletonStats, Skeleton } from '@/components/ui/skeleton'
import { Calendar, Users, DollarSign, PlusCircle, ClipboardList, Loader2, Clock, MapPin } from 'lucide-react'
import Link from 'next/link'

export default function OrganizerDashboard() {
  const { user, profile, loading: authLoading } = useAuth()
  const [stats, setStats] = useState({
    openShifts: 0,
    pendingApplications: 0,
    upcomingEvents: 0,
    totalSpent: 0,
  })
  const [recentShifts, setRecentShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      if (!user) return

      try {
        const shifts = await getShiftsByOrganizer(user.uid)

        // Calculate stats
        const openShifts = shifts.filter(s => s.status === 'open').length

        // Count pending applications across all shifts
        let pendingApplications = 0
        let totalSpent = 0

        for (const shift of shifts) {
          const applications = await getApplicationsByShift(shift.id)
          pendingApplications += applications.filter(a => a.status === 'pending').length

          const bookings = await getBookingsByShift(shift.id)
          totalSpent += bookings
            .filter(b => b.status === 'completed')
            .reduce((sum, b) => sum + (b.amountDue || 0), 0)
        }

        // Count upcoming events
        const now = new Date()
        const upcomingEvents = shifts.filter(s => {
          const shiftDate = s.date?.toDate?.()
          return shiftDate && shiftDate >= now && s.status !== 'cancelled'
        }).length

        setStats({
          openShifts,
          pendingApplications,
          upcomingEvents,
          totalSpent,
        })

        // Get recent shifts (up to 3)
        const sortedShifts = [...shifts].sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0)
          const dateB = b.createdAt?.toDate?.() || new Date(0)
          return dateB.getTime() - dateA.getTime()
        })
        setRecentShifts(sortedShifts.slice(0, 3))
      } catch (err) {
        console.error('Error fetching stats:', err)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchStats()
    }
  }, [user, authLoading])

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <SkeletonStats />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {profile?.fullName?.split(' ')[0] || 'Organizer'}
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Open Shifts</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.openShifts}</p>
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
                <p className="text-sm font-medium text-gray-500">Pending Applications</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingApplications}</p>
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
                <p className="text-sm font-medium text-gray-500">Upcoming Events</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.upcomingEvents}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">${stats.totalSpent.toFixed(2)}</p>
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
            <Link href="/organizer/applications">
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Review Applications
                {stats.pendingApplications > 0 && (
                  <Badge className="ml-auto bg-yellow-100 text-yellow-800">
                    {stats.pendingApplications}
                  </Badge>
                )}
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
          <CardHeader>
            <CardTitle>Recent Shifts</CardTitle>
          </CardHeader>
          <CardContent>
            {recentShifts.length === 0 ? (
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
            ) : (
              <div className="space-y-3">
                {recentShifts.map((shift) => {
                  const shiftDate = shift.date?.toDate?.()
                  const formattedDate = shiftDate
                    ? shiftDate.toLocaleDateString('en-CA', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'TBD'

                  const statusColors: Record<string, string> = {
                    open: 'bg-green-100 text-green-800',
                    filled: 'bg-blue-100 text-blue-800',
                    completed: 'bg-gray-100 text-gray-800',
                    cancelled: 'bg-red-100 text-red-800',
                  }

                  return (
                    <Link key={shift.id} href={`/organizer/shifts/${shift.id}`}>
                      <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">{shift.title}</p>
                          <Badge className={statusColors[shift.status] || statusColors.open}>
                            {shift.status.charAt(0).toUpperCase() + shift.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formattedDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {shift.startTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {shift.city}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
                <Link href="/organizer/shifts" className="text-secondary-600 hover:text-secondary-700 text-sm block text-center">
                  View all shifts
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
