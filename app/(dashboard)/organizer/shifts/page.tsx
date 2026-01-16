import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  PlusCircle,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Users,
  Eye,
} from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import { EVENT_TYPE_LABELS, SHIFT_STATUS } from '@/lib/constants'

export default async function OrganizerShiftsPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get organizer
  const { data: organizer } = await supabase
    .from('organizers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  // Get all shifts for this organizer
  const { data: shifts } = await supabase
    .from('shifts')
    .select('*')
    .eq('organizer_id', organizer?.id)
    .order('date', { ascending: false })

  // Get application counts for each shift
  const shiftIds = shifts?.map(s => s.id) || []
  let applicationCounts: Record<string, number> = {}

  if (shiftIds.length > 0) {
    const { data: applications } = await supabase
      .from('applications')
      .select('shift_id')
      .in('shift_id', shiftIds)
      .eq('status', 'pending')

    applications?.forEach(app => {
      applicationCounts[app.shift_id] = (applicationCounts[app.shift_id] || 0) + 1
    })
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'open':
        return 'info'
      case 'filled':
        return 'success'
      case 'completed':
        return 'default'
      case 'cancelled':
        return 'error'
      default:
        return 'default'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Shifts</h1>
          <p className="text-gray-500 mt-1">Manage your posted shifts and review applications.</p>
        </div>
        <Link href="/organizer/shifts/new">
          <Button variant="secondary">
            <PlusCircle className="h-4 w-4 mr-2" />
            Post New Shift
          </Button>
        </Link>
      </div>

      {/* Shifts List */}
      {shifts && shifts.length > 0 ? (
        <div className="grid gap-4">
          {shifts.map((shift) => {
            const pendingCount = applicationCounts[shift.id] || 0

            return (
              <Card key={shift.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {shift.title}
                        </h3>
                        <Badge variant={getStatusVariant(shift.status)}>
                          {shift.status}
                        </Badge>
                        <Badge variant="info">
                          {EVENT_TYPE_LABELS[shift.event_type as keyof typeof EVENT_TYPE_LABELS]}
                        </Badge>
                        {pendingCount > 0 && (
                          <Badge variant="warning">
                            {pendingCount} pending application{pendingCount > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">{formatDate(shift.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">
                            {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">
                            {shift.city}, {shift.province}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-sm">${shift.hourly_rate}/hr</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right mr-4">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Users className="h-4 w-4" />
                          <span className="text-sm">{shift.therapists_needed} needed</span>
                        </div>
                      </div>
                      <Link href={`/organizer/shifts/${shift.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No shifts yet</h3>
            <p className="text-gray-500 mt-1">
              Post your first shift to start finding qualified athletic therapists.
            </p>
            <Link href="/organizer/shifts/new" className="mt-4 inline-block">
              <Button variant="secondary">
                <PlusCircle className="h-4 w-4 mr-2" />
                Post Your First Shift
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
