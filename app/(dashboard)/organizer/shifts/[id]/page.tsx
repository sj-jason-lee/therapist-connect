'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/firebase/AuthContext'
import {
  getShift,
  Shift,
  getApplicationsByShift,
  Application,
  updateApplication,
  createBooking,
  getUserProfile,
  getTherapistProfile,
  UserProfile,
  TherapistProfile,
} from '@/lib/firebase/firestore'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Edit,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Users,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Building,
  User,
} from 'lucide-react'
import { EVENT_TYPE_LABELS } from '@/lib/constants'

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-100 text-green-800',
  filled: 'bg-blue-100 text-blue-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
}

const APPLICATION_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-800',
}

interface ApplicationWithProfile extends Application {
  therapistUser?: UserProfile | null
  therapistProfile?: TherapistProfile | null
}

export default function ShiftDetailPage() {
  const params = useParams()
  const shiftId = params.id as string
  const { user, loading: authLoading } = useAuth()

  const [shift, setShift] = useState<Shift | null>(null)
  const [applications, setApplications] = useState<ApplicationWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (!shiftId) return

      try {
        const [fetchedShift, fetchedApplications] = await Promise.all([
          getShift(shiftId),
          getApplicationsByShift(shiftId),
        ])

        setShift(fetchedShift)

        // Fetch therapist profiles for each application
        const applicationsWithProfiles = await Promise.all(
          fetchedApplications.map(async (app) => {
            const [therapistUser, therapistProfile] = await Promise.all([
              getUserProfile(app.therapistId),
              getTherapistProfile(app.therapistId),
            ])
            return { ...app, therapistUser, therapistProfile }
          })
        )

        setApplications(applicationsWithProfiles)
      } catch (err) {
        console.error('Error fetching shift:', err)
        setError('Failed to load shift details')
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchData()
    }
  }, [shiftId, authLoading])

  const handleAcceptApplication = async (application: ApplicationWithProfile) => {
    setActionLoading(application.id)
    setError(null)

    try {
      // Update application status
      await updateApplication(application.id, { status: 'accepted' })

      // Create a booking
      await createBooking({
        shiftId: application.shiftId,
        therapistId: application.therapistId,
        applicationId: application.id,
      })

      // Update local state
      setApplications(prev =>
        prev.map(app =>
          app.id === application.id ? { ...app, status: 'accepted' } : app
        )
      )
    } catch (err) {
      console.error('Error accepting application:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to accept application: ${errorMessage}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectApplication = async (applicationId: string) => {
    setActionLoading(applicationId)
    setError(null)

    try {
      await updateApplication(applicationId, { status: 'rejected' })

      // Update local state
      setApplications(prev =>
        prev.map(app =>
          app.id === applicationId ? { ...app, status: 'rejected' } : app
        )
      )
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

  if (!shift) {
    return (
      <div className="space-y-6">
        <Link href="/organizer/shifts">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Shift not found</h2>
          <p className="text-gray-500 mt-2">This shift may have been deleted.</p>
        </div>
      </div>
    )
  }

  const shiftDate = shift.date?.toDate?.()
  const formattedDate = shiftDate
    ? shiftDate.toLocaleDateString('en-CA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Date TBD'

  const pendingApplications = applications.filter(app => app.status === 'pending')
  const acceptedApplications = applications.filter(app => app.status === 'accepted')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/organizer/shifts">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Shift Details</h1>
        </div>
        <Link href={`/organizer/shifts/${shiftId}/edit`}>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Shift Details */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{shift.title}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={STATUS_COLORS[shift.status] || STATUS_COLORS.open}>
                  {shift.status.charAt(0).toUpperCase() + shift.status.slice(1)}
                </Badge>
                {shift.eventType && (
                  <Badge variant="outline">
                    {EVENT_TYPE_LABELS[shift.eventType] || shift.eventType}
                  </Badge>
                )}
                {shift.sport && <Badge variant="secondary">{shift.sport}</Badge>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">${shift.hourlyRate}/hr</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="h-5 w-5 text-gray-400" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Clock className="h-5 w-5 text-gray-400" />
              <span>{shift.startTime} - {shift.endTime}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <MapPin className="h-5 w-5 text-gray-400" />
              <span>
                {shift.venueName && `${shift.venueName}, `}
                {shift.address && `${shift.address}, `}
                {shift.city}, {shift.province}
                {shift.postalCode && ` ${shift.postalCode}`}
              </span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Users className="h-5 w-5 text-gray-400" />
              <span>{shift.therapistsNeeded} therapist{shift.therapistsNeeded !== 1 ? 's' : ''} needed</span>
            </div>
          </div>

          {shift.description && (
            <div className="pt-4 border-t">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description
              </h3>
              <p className="text-gray-600 whitespace-pre-wrap">{shift.description}</p>
            </div>
          )}

          {shift.equipmentProvided && (
            <div className="pt-4 border-t">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Building className="h-4 w-4" />
                Equipment Provided
              </h3>
              <p className="text-gray-600">{shift.equipmentProvided}</p>
            </div>
          )}

          {shift.specialRequirements && (
            <div className="pt-4 border-t">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Special Requirements
              </h3>
              <p className="text-gray-600">{shift.specialRequirements}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accepted Therapists */}
      {acceptedApplications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Confirmed Therapists ({acceptedApplications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {acceptedApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-200 flex items-center justify-center">
                      <User className="h-5 w-5 text-green-700" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {app.therapistUser?.fullName || 'Unknown Therapist'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {app.therapistProfile?.city}, {app.therapistProfile?.province}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Applications */}
      <Card>
        <CardHeader>
          <CardTitle>Applications ({pendingApplications.length} pending)</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No applications yet.</p>
              <p className="text-sm">Therapists will appear here when they apply.</p>
            </div>
          ) : pendingApplications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No pending applications.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApplications.map((app) => (
                <div
                  key={app.id}
                  className="border border-gray-200 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {app.therapistUser?.fullName || 'Unknown Therapist'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {app.therapistProfile?.city}, {app.therapistProfile?.province}
                          {app.therapistProfile?.credentialsVerified && (
                            <span className="ml-2 text-green-600">✓ Verified</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Badge className={APPLICATION_STATUS_COLORS[app.status]}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </Badge>
                  </div>

                  {app.message && (
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-sm text-gray-600">{app.message}</p>
                    </div>
                  )}

                  {app.status === 'pending' && (
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptApplication(app)}
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
                        onClick={() => handleRejectApplication(app.id)}
                        disabled={actionLoading === app.id}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
