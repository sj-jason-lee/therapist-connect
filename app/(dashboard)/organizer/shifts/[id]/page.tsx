'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import {
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Users,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  Star,
  Mail,
  Phone,
  Edit,
  Trash2,
} from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import { EVENT_TYPE_LABELS } from '@/lib/constants'

export default function OrganizerShiftDetailPage() {
  const router = useRouter()
  const params = useParams()
  const shiftId = params.id as string

  const [loading, setLoading] = useState(true)
  const [shift, setShift] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    loadData()
  }, [shiftId])

  const loadData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Get shift details
    const { data: shiftData } = await supabase
      .from('shifts')
      .select('*')
      .eq('id', shiftId)
      .single()

    setShift(shiftData)

    // Get applications with therapist info
    const { data: applicationsData } = await supabase
      .from('applications')
      .select(`
        *,
        therapist:therapists(
          *,
          profile:profiles(full_name, email, phone)
        )
      `)
      .eq('shift_id', shiftId)
      .order('created_at', { ascending: true })

    setApplications(applicationsData || [])
    setLoading(false)
  }

  const handleAcceptApplication = async (applicationId: string, therapistId: string) => {
    setProcessingId(applicationId)
    const supabase = createClient()

    // Update application status
    const { error: appError } = await supabase
      .from('applications')
      .update({ status: 'accepted' })
      .eq('id', applicationId)

    if (appError) {
      console.error('Error accepting application:', appError)
      setProcessingId(null)
      return
    }

    // Create booking
    const { error: bookingError } = await supabase
      .from('bookings')
      .insert({
        shift_id: shiftId,
        therapist_id: therapistId,
        application_id: applicationId,
        status: 'confirmed',
      })

    if (bookingError) {
      console.error('Error creating booking:', bookingError)
      setProcessingId(null)
      return
    }

    // Check if shift is now filled
    const acceptedCount = applications.filter(a => a.status === 'accepted').length + 1
    if (acceptedCount >= shift.therapists_needed) {
      // Update shift status to filled
      await supabase
        .from('shifts')
        .update({ status: 'filled' })
        .eq('id', shiftId)

      // Reject remaining pending applications
      await supabase
        .from('applications')
        .update({ status: 'rejected' })
        .eq('shift_id', shiftId)
        .eq('status', 'pending')
    }

    setProcessingId(null)
    loadData()
  }

  const handleRejectApplication = async (applicationId: string) => {
    setProcessingId(applicationId)
    const supabase = createClient()

    const { error } = await supabase
      .from('applications')
      .update({ status: 'rejected' })
      .eq('id', applicationId)

    if (error) {
      console.error('Error rejecting application:', error)
    }

    setProcessingId(null)
    loadData()
  }

  const handleCancelShift = async () => {
    setCancelling(true)
    const supabase = createClient()

    // Update shift status
    const { error: shiftError } = await supabase
      .from('shifts')
      .update({ status: 'cancelled' })
      .eq('id', shiftId)

    if (shiftError) {
      console.error('Error cancelling shift:', shiftError)
      setCancelling(false)
      return
    }

    // Cancel all pending applications
    await supabase
      .from('applications')
      .update({ status: 'rejected' })
      .eq('shift_id', shiftId)
      .eq('status', 'pending')

    // Cancel any bookings
    await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('shift_id', shiftId)
      .in('status', ['confirmed', 'checked_in'])

    setShowCancelModal(false)
    setCancelling(false)
    router.push('/organizer/shifts')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-secondary-600" />
      </div>
    )
  }

  if (!shift) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Shift not found</h2>
        <Link href="/organizer/shifts" className="text-secondary-600 mt-2 inline-block">
          Back to shifts
        </Link>
      </div>
    )
  }

  const pendingApplications = applications.filter(a => a.status === 'pending')
  const acceptedApplications = applications.filter(a => a.status === 'accepted')
  const rejectedApplications = applications.filter(a => a.status === 'rejected')

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'open': return 'info'
      case 'filled': return 'success'
      case 'completed': return 'default'
      case 'cancelled': return 'error'
      default: return 'default'
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/organizer/shifts"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to shifts
        </Link>
        <div className="flex items-center gap-2">
          {shift.status === 'open' && (
            <>
              <Link href={`/organizer/shifts/${shiftId}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowCancelModal(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Cancel Shift
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Shift Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{shift.title}</h1>
                <Badge variant={getStatusVariant(shift.status)}>
                  {shift.status}
                </Badge>
                <Badge variant="info">
                  {EVENT_TYPE_LABELS[shift.event_type as keyof typeof EVENT_TYPE_LABELS]}
                </Badge>
              </div>
              {shift.sport && (
                <p className="text-gray-600 mt-1">{shift.sport}</p>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-2xl font-bold text-secondary-600">
                <DollarSign className="h-6 w-6" />
                {shift.hourly_rate}/hr
              </div>
              <div className="flex items-center gap-1 text-gray-600 mt-1">
                <Users className="h-4 w-4" />
                <span>{acceptedApplications.length}/{shift.therapists_needed} filled</span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(shift.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{formatTime(shift.start_time)} - {formatTime(shift.end_time)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 col-span-2">
              <MapPin className="h-4 w-4" />
              <span>
                {shift.venue_name && `${shift.venue_name}, `}
                {shift.address && `${shift.address}, `}
                {shift.city}, {shift.province}
              </span>
            </div>
          </div>

          {shift.description && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-gray-700">{shift.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Applications */}
      {pendingApplications.length > 0 && shift.status === 'open' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Pending Applications ({pendingApplications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingApplications.map((application) => (
                <div
                  key={application.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-lg gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {application.therapist?.profile?.full_name || 'Unnamed Therapist'}
                      </h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        {application.therapist?.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {application.therapist.city}, {application.therapist.province}
                          </span>
                        )}
                        {application.therapist?.credentials_verified && (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            Verified
                          </span>
                        )}
                      </div>
                      {application.message && (
                        <p className="mt-2 text-sm text-gray-600 italic">
                          &ldquo;{application.message}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:ml-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRejectApplication(application.id)}
                      disabled={processingId === application.id}
                    >
                      {processingId === application.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-1" />
                          Decline
                        </>
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAcceptApplication(application.id, application.therapist_id)}
                      disabled={processingId === application.id}
                    >
                      {processingId === application.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Accept
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accepted Applications */}
      {acceptedApplications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Confirmed Therapists ({acceptedApplications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {acceptedApplications.map((application) => (
                <div
                  key={application.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-green-50 rounded-lg gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 bg-green-200 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-green-700" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {application.therapist?.profile?.full_name || 'Unnamed Therapist'}
                      </h4>
                      <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-gray-600">
                        {application.therapist?.profile?.email && (
                          <a
                            href={`mailto:${application.therapist.profile.email}`}
                            className="flex items-center gap-1 hover:text-primary-600"
                          >
                            <Mail className="h-3 w-3" />
                            {application.therapist.profile.email}
                          </a>
                        )}
                        {application.therapist?.profile?.phone && (
                          <a
                            href={`tel:${application.therapist.profile.phone}`}
                            className="flex items-center gap-1 hover:text-primary-600"
                          >
                            <Phone className="h-3 w-3" />
                            {application.therapist.profile.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant="success">Confirmed</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Applications State */}
      {applications.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No applications yet</h3>
            <p className="text-gray-500 mt-1">
              Therapists will appear here when they apply to your shift.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Shift"
        description="Are you sure you want to cancel this shift? This action cannot be undone."
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Cancelling this shift will notify all applicants and confirmed therapists.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>
              Keep Shift
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelShift}
              loading={cancelling}
            >
              Cancel Shift
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
