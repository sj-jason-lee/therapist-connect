'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/firebase/AuthContext'
import { getShift, Shift, createApplication, getApplicationsByTherapist, getUserProfile, getOrganizerProfile } from '@/lib/firebase/firestore'
import { notifyApplicationSubmitted, notifyNewApplication } from '@/lib/notifications-client'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Users,
  CheckCircle,
  Building,
  FileText,
} from 'lucide-react'
import { EVENT_TYPE_LABELS } from '@/lib/constants'

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-100 text-green-800',
  filled: 'bg-blue-100 text-blue-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function ShiftDetailPage() {
  const params = useParams()
  const shiftId = params.id as string
  const { user, therapist, loading: authLoading } = useAuth()

  const [shift, setShift] = useState<Shift | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)
  const [applicationMessage, setApplicationMessage] = useState('')
  const [hasApplied, setHasApplied] = useState(false)
  const [applicationSuccess, setApplicationSuccess] = useState(false)

  useEffect(() => {
    async function fetchData() {
      if (!shiftId) return

      try {
        const [fetchedShift, applications] = await Promise.all([
          getShift(shiftId),
          user ? getApplicationsByTherapist(user.uid) : Promise.resolve([]),
        ])

        setShift(fetchedShift)

        // Check if already applied to this shift
        if (applications.some(app => app.shiftId === shiftId)) {
          setHasApplied(true)
        }
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
  }, [shiftId, user, authLoading])

  const handleApply = async () => {
    if (!user || !shiftId || !shift) return

    setApplying(true)
    setError(null)

    try {
      await createApplication(shiftId, user.uid, applicationMessage || undefined)
      setHasApplied(true)
      setApplicationSuccess(true)

      // Send email notifications (don't block on these)
      const shiftDate = shift.date?.toDate?.()
      const formattedDateForEmail = shiftDate
        ? shiftDate.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
        : 'Date TBD'

      // Get organizer info for notification
      const [organizerUser, organizerProfile] = await Promise.all([
        getUserProfile(shift.organizerId),
        getOrganizerProfile(shift.organizerId),
      ])

      const therapistUser = await getUserProfile(user.uid)
      const location = `${shift.city}, ${shift.province}`

      // Notify therapist
      if (therapistUser?.email) {
        notifyApplicationSubmitted({
          therapistEmail: therapistUser.email,
          therapistName: therapistUser.fullName,
          shiftTitle: shift.title,
          shiftDate: formattedDateForEmail,
          shiftTime: `${shift.startTime} - ${shift.endTime}`,
          location,
          organizerName: organizerProfile?.organizationName || 'Event Organizer',
        }).catch(console.error)
      }

      // Notify organizer
      if (organizerUser?.email) {
        notifyNewApplication({
          organizerEmail: organizerUser.email,
          organizerName: organizerProfile?.organizationName || organizerUser.fullName,
          therapistName: therapistUser?.fullName || 'A therapist',
          shiftTitle: shift.title,
          shiftDate: formattedDateForEmail,
          message: applicationMessage || undefined,
        }).catch(console.error)
      }
    } catch (err) {
      console.error('Error applying to shift:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to submit application: ${errorMessage}`)
    } finally {
      setApplying(false)
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
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href="/therapist/shifts"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to shifts
        </Link>

        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Shift not found</h2>
          <p className="text-gray-500 mt-2">This shift may no longer be available.</p>
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

  const isNotVerified = !therapist?.credentialsVerified
  const canApply = !isNotVerified && shift.status === 'open' && !hasApplied

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/therapist/shifts"
        className="inline-flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to shifts
      </Link>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {applicationSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-800">Application Submitted!</h3>
            <p className="text-sm text-green-700">
              Your application has been sent to the organizer. You&apos;ll be notified when they respond.
            </p>
          </div>
        </div>
      )}

      {/* Not Verified Warning */}
      {isNotVerified && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-800">Credentials Not Verified</h3>
                <p className="text-sm text-yellow-700">
                  Your credentials need to be verified before you can apply to shifts.{' '}
                  <Link href="/therapist/credentials" className="underline">
                    Upload credentials
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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

      {/* Application Section */}
      {shift.status === 'open' && (
        <Card>
          <CardHeader>
            <CardTitle>Apply for this Shift</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasApplied ? (
              <div className="flex items-center gap-3 text-green-700 bg-green-50 p-4 rounded-lg">
                <CheckCircle className="h-5 w-5" />
                <span>You have already applied to this shift. The organizer will review your application.</span>
              </div>
            ) : isNotVerified ? (
              <div className="flex items-center gap-3 text-yellow-700 bg-yellow-50 p-4 rounded-lg">
                <AlertCircle className="h-5 w-5" />
                <span>You must have verified credentials to apply.</span>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message to Organizer (optional)
                  </label>
                  <Textarea
                    placeholder="Introduce yourself and explain why you're a good fit for this shift..."
                    rows={4}
                    value={applicationMessage}
                    onChange={(e) => setApplicationMessage(e.target.value)}
                  />
                </div>
                <Button onClick={handleApply} disabled={applying} className="w-full">
                  {applying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
