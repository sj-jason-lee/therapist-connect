'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  Mail,
  Phone,
  FileCheck,
  ClipboardList,
  Eye,
  ChevronRight,
} from 'lucide-react'
import { formatDate, formatTime, formatRelativeTime } from '@/lib/utils'
import { EVENT_TYPE_LABELS } from '@/lib/constants'

interface Application {
  id: string
  status: string
  message: string | null
  created_at: string
  therapist_id: string
  shift_id: string
  therapist: {
    id: string
    credentials_verified: boolean
    city: string | null
    province: string | null
    bio: string | null
    profile: {
      full_name: string
      email: string
      phone: string | null
    }
  }
  shift: {
    id: string
    title: string
    date: string
    start_time: string
    end_time: string
    hourly_rate: number
    city: string
    province: string
    venue_name: string | null
    event_type: string
    therapists_needed: number
    status: string
  }
}

export default function OrganizerApplicationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<Application[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'pending' | 'accepted' | 'rejected' | 'all'>('pending')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Get organizer
    const { data: organizer } = await supabase
      .from('organizers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!organizer) {
      setLoading(false)
      return
    }

    // Get all applications for organizer's shifts
    const { data: applicationsData, error } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        message,
        created_at,
        therapist_id,
        shift_id,
        therapist:therapists(
          id,
          credentials_verified,
          city,
          province,
          bio,
          profile:profiles(full_name, email, phone)
        ),
        shift:shifts!inner(
          id,
          title,
          date,
          start_time,
          end_time,
          hourly_rate,
          city,
          province,
          venue_name,
          event_type,
          therapists_needed,
          status,
          organizer_id
        )
      `)
      .eq('shift.organizer_id', organizer.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading applications:', error)
    } else {
      setApplications((applicationsData as unknown as Application[]) || [])
    }

    setLoading(false)
  }

  const handleAcceptApplication = async (application: Application) => {
    setProcessingId(application.id)
    const supabase = createClient()

    // Update application status
    const { error: appError } = await supabase
      .from('applications')
      .update({ status: 'accepted' })
      .eq('id', application.id)

    if (appError) {
      console.error('Error accepting application:', appError)
      setProcessingId(null)
      return
    }

    // Create booking
    const { error: bookingError } = await supabase
      .from('bookings')
      .insert({
        shift_id: application.shift_id,
        therapist_id: application.therapist_id,
        application_id: application.id,
        status: 'confirmed',
      })

    if (bookingError) {
      console.error('Error creating booking:', bookingError)
      setProcessingId(null)
      return
    }

    // Check if shift is now filled
    const shiftApplications = applications.filter(a => a.shift_id === application.shift_id)
    const acceptedCount = shiftApplications.filter(a => a.status === 'accepted').length + 1

    if (acceptedCount >= application.shift.therapists_needed) {
      // Update shift status to filled
      await supabase
        .from('shifts')
        .update({ status: 'filled' })
        .eq('id', application.shift_id)

      // Reject remaining pending applications for this shift
      await supabase
        .from('applications')
        .update({ status: 'rejected' })
        .eq('shift_id', application.shift_id)
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

  const filteredApplications = applications.filter(a => {
    if (filter === 'all') return true
    return a.status === filter
  })

  const pendingCount = applications.filter(a => a.status === 'pending').length
  const acceptedCount = applications.filter(a => a.status === 'accepted').length
  const rejectedCount = applications.filter(a => a.status === 'rejected').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-secondary-600" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <p className="text-gray-500 mt-1">
          Review and manage therapist applications for your shifts.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          className={`cursor-pointer transition-all ${filter === 'pending' ? 'ring-2 ring-yellow-500' : ''}`}
          onClick={() => setFilter('pending')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${filter === 'accepted' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => setFilter('accepted')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{acceptedCount}</p>
                <p className="text-sm text-gray-500">Accepted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${filter === 'rejected' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => setFilter('rejected')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rejectedCount}</p>
                <p className="text-sm text-gray-500">Declined</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${filter === 'all' ? 'ring-2 ring-gray-500' : ''}`}
          onClick={() => setFilter('all')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{applications.length}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              {filter === 'pending' ? 'No pending applications' :
               filter === 'accepted' ? 'No accepted applications' :
               filter === 'rejected' ? 'No declined applications' :
               'No applications yet'}
            </h3>
            <p className="text-gray-500 mt-1">
              {filter === 'pending'
                ? 'New applications will appear here when therapists apply to your shifts.'
                : 'Applications matching this filter will appear here.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <Card key={application.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row">
                  {/* Therapist Info */}
                  <div className="flex-1 p-6 border-b lg:border-b-0 lg:border-r">
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-7 w-7 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {application.therapist?.profile?.full_name || 'Unnamed Therapist'}
                          </h3>
                          {application.therapist?.credentials_verified && (
                            <Badge variant="success" className="text-xs">
                              <FileCheck className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                          {application.therapist?.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {application.therapist.city}, {application.therapist.province}
                            </span>
                          )}
                          {application.therapist?.profile?.email && (
                            <a
                              href={`mailto:${application.therapist.profile.email}`}
                              className="flex items-center gap-1 hover:text-secondary-600"
                            >
                              <Mail className="h-3 w-3" />
                              {application.therapist.profile.email}
                            </a>
                          )}
                          {application.therapist?.profile?.phone && (
                            <a
                              href={`tel:${application.therapist.profile.phone}`}
                              className="flex items-center gap-1 hover:text-secondary-600"
                            >
                              <Phone className="h-3 w-3" />
                              {application.therapist.profile.phone}
                            </a>
                          )}
                        </div>

                        {application.message && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 italic">
                              &ldquo;{application.message}&rdquo;
                            </p>
                          </div>
                        )}

                        <p className="text-xs text-gray-400 mt-3">
                          Applied {formatRelativeTime(application.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Shift Info */}
                  <div className="w-full lg:w-80 p-6 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        For Shift
                      </span>
                      <Badge variant="info" className="text-xs">
                        {EVENT_TYPE_LABELS[application.shift.event_type as keyof typeof EVENT_TYPE_LABELS]}
                      </Badge>
                    </div>

                    <Link
                      href={`/organizer/shifts/${application.shift.id}`}
                      className="block group"
                    >
                      <h4 className="font-medium text-gray-900 group-hover:text-secondary-600 transition-colors">
                        {application.shift.title}
                      </h4>
                    </Link>

                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(application.shift.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(application.shift.start_time)} - {formatTime(application.shift.end_time)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>{application.shift.venue_name || application.shift.city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3 w-3" />
                        <span>${application.shift.hourly_rate}/hr</span>
                      </div>
                    </div>

                    <Link
                      href={`/organizer/shifts/${application.shift.id}`}
                      className="inline-flex items-center text-sm text-secondary-600 hover:text-secondary-700 mt-3"
                    >
                      View Shift
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="px-6 py-4 bg-white border-t flex items-center justify-between">
                  <Badge
                    variant={
                      application.status === 'pending' ? 'warning' :
                      application.status === 'accepted' ? 'success' :
                      'error'
                    }
                  >
                    {application.status === 'pending' ? 'Pending Review' :
                     application.status === 'accepted' ? 'Accepted' :
                     'Declined'}
                  </Badge>

                  {application.status === 'pending' && application.shift.status === 'open' && (
                    <div className="flex items-center gap-2">
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
                        onClick={() => handleAcceptApplication(application)}
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
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
