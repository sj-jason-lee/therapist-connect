'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/firebase/AuthContext'
import {
  getApplicationsByTherapist,
  getBookingsByTherapist,
  getShift,
  Application,
  Booking,
  Shift,
} from '@/lib/firebase/firestore'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SkeletonStats, Skeleton } from '@/components/ui/skeleton'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  FileCheck,
  ArrowRight,
  Loader2,
  MapPin,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface BookingWithShift extends Booking {
  shift?: Shift | null
}

export default function TherapistDashboardPage() {
  const { user, profile, therapist, loading: authLoading } = useAuth()
  const [stats, setStats] = useState({
    pendingApplications: 0,
    acceptedApplications: 0,
    upcomingBookings: 0,
    totalEarnings: 0,
  })
  const [upcomingBookings, setUpcomingBookings] = useState<BookingWithShift[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      if (!user) return

      try {
        const [applications, bookings] = await Promise.all([
          getApplicationsByTherapist(user.uid),
          getBookingsByTherapist(user.uid),
        ])

        const pendingApplications = applications.filter(a => a.status === 'pending').length
        const acceptedApplications = applications.filter(a => a.status === 'accepted').length

        // Fetch shift details for bookings
        const bookingsWithShifts = await Promise.all(
          bookings.map(async (booking) => {
            const shift = await getShift(booking.shiftId)
            return { ...booking, shift }
          })
        )

        const now = new Date()
        const upcoming = bookingsWithShifts.filter(b => {
          const shiftDate = b.shift?.date?.toDate?.()
          return shiftDate && shiftDate >= now && b.status === 'confirmed'
        })

        const totalEarnings = bookings
          .filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + (b.therapistPayout || 0), 0)

        setStats({
          pendingApplications,
          acceptedApplications,
          upcomingBookings: upcoming.length,
          totalEarnings,
        })

        // Sort upcoming by date and take first 3
        upcoming.sort((a, b) => {
          const dateA = a.shift?.date?.toDate?.() || new Date(0)
          const dateB = b.shift?.date?.toDate?.() || new Date(0)
          return dateA.getTime() - dateB.getTime()
        })
        setUpcomingBookings(upcoming.slice(0, 3))
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
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
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
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const isProfileComplete = therapist?.cataNumber && therapist?.city && therapist?.province
  const isCredentialsVerified = therapist?.credentialsVerified

  // Check for expiring/expired credentials
  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const getExpiryStatus = (expiryDate: any) => {
    if (!expiryDate) return null
    const date = expiryDate?.toDate?.() || new Date(expiryDate)
    if (isNaN(date.getTime())) return null
    if (date < now) return 'expired'
    if (date < thirtyDaysFromNow) return 'expiring'
    return 'valid'
  }

  const cataStatus = getExpiryStatus(therapist?.cataExpiry)
  const insuranceStatus = getExpiryStatus(therapist?.insuranceExpiry)
  const blsStatus = getExpiryStatus(therapist?.blsExpiry)

  const hasExpiryWarning = cataStatus === 'expired' || cataStatus === 'expiring' ||
    insuranceStatus === 'expired' || insuranceStatus === 'expiring' ||
    blsStatus === 'expired' || blsStatus === 'expiring'

  const expiredCredentials = [
    cataStatus === 'expired' && 'CATA Certification',
    insuranceStatus === 'expired' && 'Liability Insurance',
    blsStatus === 'expired' && 'BLS Certification',
  ].filter(Boolean)

  const expiringCredentials = [
    cataStatus === 'expiring' && 'CATA Certification',
    insuranceStatus === 'expiring' && 'Liability Insurance',
    blsStatus === 'expiring' && 'BLS Certification',
  ].filter(Boolean)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.fullName?.split(' ')[0] || 'Therapist'}
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
                  href="/therapist/onboarding"
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

      {/* Credential Expiry Warnings */}
      {hasExpiryWarning && (
        <div className="space-y-3">
          {expiredCredentials.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Expired Credentials</h3>
                <p className="text-sm text-red-700 mt-1">
                  The following credentials have expired: {expiredCredentials.join(', ')}.
                  Please update them to continue accepting shifts.
                </p>
                <Link
                  href="/therapist/credentials"
                  className="text-sm font-medium text-red-800 hover:text-red-900 mt-2 inline-flex items-center"
                >
                  Update credentials <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          )}

          {expiringCredentials.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-orange-800">Credentials Expiring Soon</h3>
                <p className="text-sm text-orange-700 mt-1">
                  The following credentials will expire within 30 days: {expiringCredentials.join(', ')}.
                  Please renew them to avoid interruption.
                </p>
                <Link
                  href="/therapist/credentials"
                  className="text-sm font-medium text-orange-800 hover:text-orange-900 mt-2 inline-flex items-center"
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
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingApplications}</p>
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
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.acceptedApplications}</p>
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
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.upcomingBookings}</p>
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
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalEarnings)}</p>
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
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No upcoming bookings</p>
                <Link href="/therapist/shifts" className="text-primary-600 hover:text-primary-700 text-sm">
                  Browse available shifts
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => {
                  const shift = booking.shift
                  const shiftDate = shift?.date?.toDate?.()
                  const formattedDate = shiftDate
                    ? shiftDate.toLocaleDateString('en-CA', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'TBD'

                  // Calculate urgency badge
                  const getUrgencyBadge = () => {
                    if (!shiftDate) return null
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const tomorrow = new Date(today)
                    tomorrow.setDate(tomorrow.getDate() + 1)
                    const shiftDay = new Date(shiftDate)
                    shiftDay.setHours(0, 0, 0, 0)

                    if (shiftDay.getTime() === today.getTime()) {
                      return <Badge className="bg-red-100 text-red-800 text-xs">Today</Badge>
                    }
                    if (shiftDay.getTime() === tomorrow.getTime()) {
                      return <Badge className="bg-orange-100 text-orange-800 text-xs">Tomorrow</Badge>
                    }
                    return null
                  }

                  const urgencyBadge = getUrgencyBadge()

                  return (
                    <Link key={booking.id} href="/therapist/bookings">
                      <div className={`p-3 rounded-lg hover:shadow-sm transition-shadow cursor-pointer ${
                        urgencyBadge ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-start justify-between">
                          <p className="font-medium text-gray-900">{shift?.title || 'Unknown Shift'}</p>
                          {urgencyBadge}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formattedDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {shift?.startTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {shift?.city}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
                <Link href="/therapist/bookings" className="text-primary-600 hover:text-primary-700 text-sm block text-center">
                  View all bookings
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Verification Status */}
      <Card>
        <CardHeader>
          <CardTitle>Credential Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              cataStatus === 'expired' ? 'bg-red-50' :
              cataStatus === 'expiring' ? 'bg-orange-50' :
              therapist?.cataNumber ? 'bg-green-50' : 'bg-gray-50'
            }`}>
              {cataStatus === 'expired' ? (
                <AlertCircle className="h-5 w-5 text-red-600" />
              ) : cataStatus === 'expiring' ? (
                <AlertCircle className="h-5 w-5 text-orange-600" />
              ) : therapist?.cataNumber ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium text-gray-900">CATA Certification</p>
                <p className={`text-sm ${
                  cataStatus === 'expired' ? 'text-red-600 font-medium' :
                  cataStatus === 'expiring' ? 'text-orange-600' : 'text-gray-500'
                }`}>
                  {therapist?.cataNumber ? `#${therapist.cataNumber}` : 'Not provided'}
                  {therapist?.cataExpiry && (
                    <span className="block">
                      {cataStatus === 'expired' ? 'Expired' : 'Expires'}: {therapist.cataExpiry?.toDate?.()?.toLocaleDateString('en-CA') || 'N/A'}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              insuranceStatus === 'expired' ? 'bg-red-50' :
              insuranceStatus === 'expiring' ? 'bg-orange-50' :
              therapist?.insurancePolicyNumber ? 'bg-green-50' : 'bg-gray-50'
            }`}>
              {insuranceStatus === 'expired' ? (
                <AlertCircle className="h-5 w-5 text-red-600" />
              ) : insuranceStatus === 'expiring' ? (
                <AlertCircle className="h-5 w-5 text-orange-600" />
              ) : therapist?.insurancePolicyNumber ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium text-gray-900">Liability Insurance</p>
                <p className={`text-sm ${
                  insuranceStatus === 'expired' ? 'text-red-600 font-medium' :
                  insuranceStatus === 'expiring' ? 'text-orange-600' : 'text-gray-500'
                }`}>
                  {therapist?.insuranceProvider || 'Not provided'}
                  {therapist?.insuranceExpiry && (
                    <span className="block">
                      {insuranceStatus === 'expired' ? 'Expired' : 'Expires'}: {therapist.insuranceExpiry?.toDate?.()?.toLocaleDateString('en-CA') || 'N/A'}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              blsStatus === 'expired' ? 'bg-red-50' :
              blsStatus === 'expiring' ? 'bg-orange-50' :
              therapist?.blsExpiry ? 'bg-green-50' : 'bg-gray-50'
            }`}>
              {blsStatus === 'expired' ? (
                <AlertCircle className="h-5 w-5 text-red-600" />
              ) : blsStatus === 'expiring' ? (
                <AlertCircle className="h-5 w-5 text-orange-600" />
              ) : therapist?.blsExpiry ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium text-gray-900">BLS Certification</p>
                <p className={`text-sm ${
                  blsStatus === 'expired' ? 'text-red-600 font-medium' :
                  blsStatus === 'expiring' ? 'text-orange-600' : 'text-gray-500'
                }`}>
                  {therapist?.blsExpiry ? (
                    <>
                      {blsStatus === 'expired' ? 'Expired' : 'Expires'}: {therapist.blsExpiry?.toDate?.()?.toLocaleDateString('en-CA') || 'N/A'}
                    </>
                  ) : 'Not provided'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
