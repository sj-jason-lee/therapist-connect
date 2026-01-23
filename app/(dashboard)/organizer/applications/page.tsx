'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/firebase/AuthContext'
import {
  getShiftsByOrganizer,
  getApplicationsByShift,
  getUserProfile,
  getTherapistProfile,
  getOrganizerProfile,
  updateApplication,
  acceptApplicationWithTransaction,
  Application,
  Shift,
  UserProfile,
  TherapistProfile,
} from '@/lib/firebase/firestore'
import { notifyApplicationStatus, notifyBookingConfirmed } from '@/lib/notifications-client'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  User,
  CreditCard,
  Star,
} from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-800',
}

interface ApplicationWithDetails extends Application {
  shift?: Shift | null
  therapistUser?: UserProfile | null
  therapistProfile?: TherapistProfile | null
}

export default function OrganizerApplicationsPage() {
  const { user, loading: authLoading } = useAuth()
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('pending')

  useEffect(() => {
    async function fetchApplications() {
      if (!user) return

      try {
        // Get all shifts for this organizer
        const shifts = await getShiftsByOrganizer(user.uid)

        // Get applications for all shifts
        const allApplications: ApplicationWithDetails[] = []

        for (const shift of shifts) {
          const shiftApplications = await getApplicationsByShift(shift.id)

          for (const app of shiftApplications) {
            const [therapistUser, therapistProfile] = await Promise.all([
              getUserProfile(app.therapistId),
              getTherapistProfile(app.therapistId),
            ])

            allApplications.push({
              ...app,
              shift,
              therapistUser,
              therapistProfile,
            })
          }
        }

        // Sort by creation date (newest first)
        allApplications.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0)
          const dateB = b.createdAt?.toDate?.() || new Date(0)
          return dateB.getTime() - dateA.getTime()
        })

        setApplications(allApplications)
      } catch (err) {
        console.error('Error fetching applications:', err)
        setError('Failed to load applications')
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchApplications()
    }
  }, [user, authLoading])

  const handleAccept = async (app: ApplicationWithDetails, confirmed: boolean = false) => {
    if (!user) return

    // Check if therapist has Stripe account set up
    const hasStripeAccount = !!app.therapistProfile?.stripeAccountId
    if (!hasStripeAccount && !confirmed) {
      const proceed = window.confirm(
        `${app.therapistUser?.fullName || 'This therapist'} has not set up their payout account yet. ` +
        `You won't be able to pay them until they complete Stripe setup.\n\n` +
        `Do you want to accept this application anyway?`
      )
      if (!proceed) return
    }

    setActionLoading(app.id)
    setError(null)

    try {
      // Use transaction-safe acceptance to prevent race conditions
      const result = await acceptApplicationWithTransaction(
        app.id,
        app.shiftId,
        app.therapistId
      )

      if (!result.success) {
        throw new Error(result.error || 'Failed to accept application')
      }

      setApplications(prev =>
        prev.map(a => a.id === app.id ? { ...a, status: 'accepted' } : a)
      )

      // Send notifications (don't block on these)
      const shift = app.shift
      if (shift && app.therapistUser?.email) {
        const shiftDate = shift.date?.toDate?.()
        const formattedDate = shiftDate
          ? shiftDate.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
          : 'Date TBD'
        const location = `${shift.city}, ${shift.province}`
        const address = shift.address || location

        // Get organizer profile for the name
        const organizerProfile = await getOrganizerProfile(user.uid)

        // Notify therapist about acceptance
        notifyApplicationStatus({
          therapistEmail: app.therapistUser.email,
          therapistName: app.therapistUser.fullName,
          shiftTitle: shift.title,
          shiftDate: formattedDate,
          shiftTime: `${shift.startTime} - ${shift.endTime}`,
          location,
          status: 'accepted',
        }).catch(console.error)

        // Send booking confirmation to therapist
        notifyBookingConfirmed({
          recipientEmail: app.therapistUser.email,
          recipientName: app.therapistUser.fullName,
          recipientType: 'therapist',
          shiftTitle: shift.title,
          shiftDate: formattedDate,
          shiftTime: `${shift.startTime} - ${shift.endTime}`,
          location,
          address,
          hourlyRate: shift.hourlyRate,
          otherPartyName: organizerProfile?.organizationName || 'Event Organizer',
        }).catch(console.error)
      }
    } catch (err) {
      console.error('Error accepting application:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to accept application: ${errorMessage}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (applicationId: string) => {
    setActionLoading(applicationId)
    setError(null)

    try {
      await updateApplication(applicationId, { status: 'rejected' })

      // Find the application to get therapist info for notification
      const app = applications.find(a => a.id === applicationId)

      setApplications(prev =>
        prev.map(a => a.id === applicationId ? { ...a, status: 'rejected' } : a)
      )

      // Send notification (don't block on this)
      const shift = app?.shift
      if (shift && app?.therapistUser?.email) {
        const shiftDate = shift.date?.toDate?.()
        const formattedDate = shiftDate
          ? shiftDate.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
          : 'Date TBD'
        const location = `${shift.city}, ${shift.province}`

        notifyApplicationStatus({
          therapistEmail: app.therapistUser.email,
          therapistName: app.therapistUser.fullName,
          shiftTitle: shift.title,
          shiftDate: formattedDate,
          shiftTime: `${shift.startTime} - ${shift.endTime}`,
          location,
          status: 'rejected',
        }).catch(console.error)
      }
    } catch (err) {
      console.error('Error rejecting application:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to reject application: ${errorMessage}`)
    } finally {
      setActionLoading(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const pendingCount = applications.filter(a => a.status === 'pending').length
  const acceptedCount = applications.filter(a => a.status === 'accepted').length
  const rejectedCount = applications.filter(a => a.status === 'rejected').length

  const filteredApplications = filter === 'all'
    ? applications
    : applications.filter(a => a.status === filter)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <p className="text-gray-500 mt-1">Review and manage therapist applications for your shifts.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              <p className="text-sm text-gray-500">Pending Review</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{acceptedCount}</p>
              <p className="text-sm text-gray-500">Accepted</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
              <p className="text-sm text-gray-500">Declined</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['pending', 'accepted', 'rejected', 'all'] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status === 'pending' && pendingCount > 0 && (
              <span className="ml-2 bg-yellow-500 text-white px-2 py-0.5 rounded-full text-xs">
                {pendingCount}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              {filter === 'all' ? 'No applications yet' : `No ${filter} applications`}
            </h3>
            <p className="text-gray-500 mt-1">
              {filter === 'all'
                ? 'Applications will appear here when therapists apply to your shifts.'
                : `You have no ${filter} applications at this time.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => {
            const shift = app.shift
            const shiftDate = shift?.date?.toDate?.()
            const formattedDate = shiftDate
              ? shiftDate.toLocaleDateString('en-CA', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Date TBD'

            return (
              <Card key={app.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Therapist Avatar */}
                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>

                    {/* Application Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {app.therapistUser?.fullName || 'Unknown Therapist'}
                        </h3>
                        <Badge className={STATUS_COLORS[app.status]}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </Badge>
                        {app.therapistProfile?.credentialsVerified && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        {!app.therapistProfile?.stripeAccountId && (
                          <Badge className="bg-orange-100 text-orange-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            No Payout Setup
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-gray-500 mt-1">
                        {app.therapistProfile?.city}, {app.therapistProfile?.province}
                        {app.therapistProfile?.hourlyRateMin && (
                          <span> · ${app.therapistProfile.hourlyRateMin}/hr min</span>
                        )}
                        {(app.therapistProfile as any)?.averageRating > 0 && (
                          <span className="inline-flex items-center ml-2">
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            <span className="ml-0.5">{(app.therapistProfile as any).averageRating.toFixed(1)}</span>
                            {(app.therapistProfile as any)?.totalReviews > 0 && (
                              <span className="text-gray-400 ml-1">({(app.therapistProfile as any).totalReviews})</span>
                            )}
                          </span>
                        )}
                      </p>

                      {/* Therapist Bio */}
                      {app.therapistProfile?.bio && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {app.therapistProfile.bio}
                        </p>
                      )}

                      {/* Shift Info */}
                      {shift && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="font-medium text-gray-900 text-sm">{shift.title}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formattedDate}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {shift.startTime} - {shift.endTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {shift.city}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Application Message */}
                      {app.message && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-700">{app.message}</p>
                        </div>
                      )}

                      <p className="text-xs text-gray-400 mt-2">
                        Applied {app.createdAt?.toDate?.().toLocaleDateString('en-CA')}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {app.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleAccept(app)}
                            disabled={actionLoading === app.id}
                          >
                            {actionLoading === app.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Accept
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(app.id)}
                            disabled={actionLoading === app.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </>
                      )}
                      {shift && (
                        <Link href={`/organizer/shifts/${shift.id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            View Shift
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
