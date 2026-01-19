'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import {
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Building2,
  Users,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Briefcase,
  FileText,
} from 'lucide-react'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'
import { EVENT_TYPE_LABELS } from '@/lib/constants'

export default function ShiftDetailPage() {
  const router = useRouter()
  const params = useParams()
  const shiftId = params.id as string

  const [loading, setLoading] = useState(true)
  const [shift, setShift] = useState<any>(null)
  const [therapist, setTherapist] = useState<any>(null)
  const [existingApplication, setExistingApplication] = useState<any>(null)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applyMessage, setApplyMessage] = useState('')
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Get therapist
      const { data: therapistData } = await supabase
        .from('therapists')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setTherapist(therapistData)

      // Get shift details
      const { data: shiftData, error: shiftError } = await supabase
        .from('shifts')
        .select(`
          *,
          organizer:organizers(
            organization_name,
            organization_type,
            city,
            province,
            profile:profiles(full_name, email)
          )
        `)
        .eq('id', shiftId)
        .single()

      if (shiftError) {
        console.error('Error fetching shift:', shiftError)
      }

      setShift(shiftData)

      // Check for existing application
      if (therapistData) {
        const { data: applicationData } = await supabase
          .from('applications')
          .select('*')
          .eq('shift_id', shiftId)
          .eq('therapist_id', therapistData.id)
          .single()

        setExistingApplication(applicationData)
      }

      setLoading(false)
    }

    loadData()
  }, [shiftId, router])

  const handleApply = async () => {
    if (!therapist || !shift) return

    setApplying(true)
    setError(null)

    const supabase = createClient()

    const { error: applyError } = await supabase
      .from('applications')
      .insert({
        shift_id: shift.id,
        therapist_id: therapist.id,
        message: applyMessage || null,
        status: 'pending',
      })

    if (applyError) {
      setError(applyError.message)
      setApplying(false)
      return
    }

    setShowApplyModal(false)
    setExistingApplication({ status: 'pending', message: applyMessage })
    setApplying(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!shift) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Shift not found</h2>
        <Link href="/therapist/shifts" className="text-primary-600 mt-2 inline-block">
          Back to shifts
        </Link>
      </div>
    )
  }

  const canApply = !existingApplication && therapist?.credentials_verified && shift.status === 'open'
  const isNotVerified = !therapist?.credentials_verified

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/therapist/shifts"
        className="inline-flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to shifts
      </Link>

      {/* Shift Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{shift.title}</h1>
                <Badge variant="info">
                  {EVENT_TYPE_LABELS[shift.event_type as keyof typeof EVENT_TYPE_LABELS]}
                </Badge>
                {shift.sport && <Badge variant="default">{shift.sport}</Badge>}
              </div>
              <div className="flex items-center gap-1 mt-2 text-gray-600">
                <Building2 className="h-4 w-4" />
                <span>
                  {shift.organizer?.organization_name || shift.organizer?.profile?.full_name}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-2xl font-bold text-primary-600">
                <DollarSign className="h-6 w-6" />
                {shift.hourly_rate}/hr
              </div>
              <span className="text-sm text-gray-500">CAD</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Application Status */}
      {existingApplication && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              {existingApplication.status === 'pending' && (
                <>
                  <Clock className="h-6 w-6 text-yellow-600" />
                  <div>
                    <h3 className="font-medium text-gray-900">Application Pending</h3>
                    <p className="text-sm text-gray-600">
                      Your application is being reviewed by the organizer.
                    </p>
                  </div>
                </>
              )}
              {existingApplication.status === 'accepted' && (
                <>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <h3 className="font-medium text-gray-900">Application Accepted</h3>
                    <p className="text-sm text-gray-600">
                      Congratulations! Check your bookings for details.
                    </p>
                  </div>
                </>
              )}
              {existingApplication.status === 'rejected' && (
                <>
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  <div>
                    <h3 className="font-medium text-gray-900">Application Not Selected</h3>
                    <p className="text-sm text-gray-600">
                      The organizer has chosen another therapist for this shift.
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Not Verified Warning */}
      {isNotVerified && !existingApplication && (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shift Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{formatDate(shift.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium">
                      {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{shift.venue_name || 'TBD'}</p>
                    <p className="text-sm text-gray-600">
                      {shift.address && `${shift.address}, `}
                      {shift.city}, {shift.province}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Therapists Needed</p>
                    <p className="font-medium">{shift.therapists_needed}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {shift.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{shift.description}</p>
              </CardContent>
            </Card>
          )}

          {(shift.equipment_provided || shift.special_requirements) && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {shift.equipment_provided && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-700">Equipment Provided</span>
                    </div>
                    <p className="text-gray-600 ml-6">{shift.equipment_provided}</p>
                  </div>
                )}
                {shift.special_requirements && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-700">Special Requirements</span>
                    </div>
                    <p className="text-gray-600 ml-6">{shift.special_requirements}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Apply for this Shift</CardTitle>
            </CardHeader>
            <CardContent>
              {canApply ? (
                <Button className="w-full" onClick={() => setShowApplyModal(true)}>
                  Apply Now
                </Button>
              ) : existingApplication ? (
                <p className="text-gray-600 text-sm">You have already applied to this shift.</p>
              ) : isNotVerified ? (
                <Link href="/therapist/credentials">
                  <Button className="w-full" variant="outline">
                    Verify Credentials
                  </Button>
                </Link>
              ) : (
                <p className="text-gray-600 text-sm">This shift is no longer accepting applications.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organizer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-gray-900">
                {shift.organizer?.organization_name || shift.organizer?.profile?.full_name}
              </p>
              <p className="text-sm text-gray-600">
                {shift.organizer?.city}, {shift.organizer?.province}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Apply Modal */}
      <Modal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title="Apply for Shift"
        description="Add a message to introduce yourself to the organizer."
      >
        <div className="space-y-4">
          <Textarea
            label="Cover Message (Optional)"
            value={applyMessage}
            onChange={(e) => setApplyMessage(e.target.value)}
            placeholder="Tell the organizer why you're a great fit for this shift..."
            rows={4}
          />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowApplyModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply} loading={applying}>
              Submit Application
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
