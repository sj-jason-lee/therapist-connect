import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Building2,
  CheckCircle,
  XCircle,
  ClipboardList,
  Eye,
} from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import { EVENT_TYPE_LABELS } from '@/lib/constants'

export default async function TherapistApplicationsPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get therapist
  const { data: therapist } = await supabase
    .from('therapists')
    .select('id')
    .eq('user_id', user.id)
    .single()

  // Get all applications with shift details
  const { data: applications } = await supabase
    .from('applications')
    .select(`
      *,
      shift:shifts(
        *,
        organizer:organizers(
          organization_name,
          profile:profiles(full_name)
        )
      )
    `)
    .eq('therapist_id', therapist?.id)
    .order('created_at', { ascending: false })

  const pendingApplications = applications?.filter(a => a.status === 'pending') || []
  const acceptedApplications = applications?.filter(a => a.status === 'accepted') || []
  const rejectedApplications = applications?.filter(a => a.status === 'rejected') || []
  const withdrawnApplications = applications?.filter(a => a.status === 'withdrawn') || []

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'accepted': return 'success'
      case 'rejected': return 'error'
      case 'withdrawn': return 'default'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'accepted': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      default: return null
    }
  }

  const ApplicationCard = ({ application }: { application: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-gray-900">
                {application.shift?.title}
              </h3>
              <Badge variant={getStatusVariant(application.status)}>
                {getStatusIcon(application.status)}
                <span className="ml-1 capitalize">{application.status}</span>
              </Badge>
              <Badge variant="info">
                {EVENT_TYPE_LABELS[application.shift?.event_type as keyof typeof EVENT_TYPE_LABELS]}
              </Badge>
            </div>
            <div className="flex items-center gap-1 mt-1 text-gray-600">
              <Building2 className="h-4 w-4" />
              <span className="text-sm">
                {application.shift?.organizer?.organization_name ||
                 application.shift?.organizer?.profile?.full_name}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">{formatDate(application.shift?.date)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  {formatTime(application.shift?.start_time)} - {formatTime(application.shift?.end_time)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">
                  {application.shift?.city}, {application.shift?.province}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">${application.shift?.hourly_rate}/hr</span>
              </div>
            </div>

            {application.message && (
              <p className="mt-3 text-sm text-gray-600 italic">
                Your message: &ldquo;{application.message}&rdquo;
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link href={`/therapist/shifts/${application.shift_id}`}>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Shift
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
        <p className="text-gray-500 mt-1">Track the status of your shift applications.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{pendingApplications.length}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{acceptedApplications.length}</p>
              <p className="text-sm text-gray-500">Accepted</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{rejectedApplications.length}</p>
              <p className="text-sm text-gray-500">Not Selected</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{applications?.length || 0}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Applications */}
      {pendingApplications.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            Pending ({pendingApplications.length})
          </h2>
          <div className="space-y-4">
            {pendingApplications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        </div>
      )}

      {/* Accepted Applications */}
      {acceptedApplications.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Accepted ({acceptedApplications.length})
          </h2>
          <div className="space-y-4">
            {acceptedApplications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        </div>
      )}

      {/* Rejected Applications */}
      {rejectedApplications.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Not Selected ({rejectedApplications.length})
          </h2>
          <div className="space-y-4">
            {rejectedApplications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        </div>
      )}

      {/* No Applications */}
      {(!applications || applications.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No applications yet</h3>
            <p className="text-gray-500 mt-1">
              Start applying to shifts to see your applications here.
            </p>
            <Link href="/therapist/shifts" className="mt-4 inline-block">
              <Button>Browse Available Shifts</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
