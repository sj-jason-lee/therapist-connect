import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Building2,
  Users,
} from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import { EVENT_TYPE_LABELS, CANADIAN_PROVINCES, COMMON_SPORTS } from '@/lib/constants'
import { ShiftFilters } from './shift-filters'

interface PageProps {
  searchParams: {
    city?: string
    province?: string
    event_type?: string
    sport?: string
    min_rate?: string
  }
}

export default async function TherapistShiftsPage({ searchParams }: PageProps) {
  const supabase = createClient()
  const params = searchParams

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get therapist data for location filtering
  const { data: therapist } = await supabase
    .from('therapists')
    .select('id, city, province, travel_radius_km')
    .eq('user_id', user.id)
    .single()

  // Build query with filters
  let query = supabase
    .from('shifts')
    .select(`
      *,
      organizer:organizers(
        organization_name,
        user_id,
        profile:profiles(full_name)
      )
    `)
    .eq('status', 'open')
    .gte('date', new Date().toISOString().split('T')[0])

  // Apply filters from search params
  if (params.city) {
    query = query.ilike('city', `%${params.city}%`)
  }
  if (params.province) {
    query = query.eq('province', params.province)
  }
  if (params.event_type) {
    query = query.eq('event_type', params.event_type)
  }
  if (params.sport) {
    query = query.eq('sport', params.sport)
  }
  if (params.min_rate) {
    query = query.gte('hourly_rate', parseFloat(params.min_rate))
  }

  const { data: shifts } = await query.order('date', { ascending: true })

  // Get therapist's existing applications to filter out already-applied shifts
  const { data: applications } = await supabase
    .from('applications')
    .select('shift_id')
    .eq('therapist_id', therapist?.id)

  const appliedShiftIds = new Set(applications?.map((a) => a.shift_id) || [])

  // Filter shifts that haven't been applied to
  const availableShifts = shifts?.filter((shift) => !appliedShiftIds.has(shift.id)) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Available Shifts</h1>
          <p className="text-gray-500 mt-1">Browse and apply to shifts in your area.</p>
        </div>
      </div>

      {/* Filters */}
      <ShiftFilters
        provinces={CANADIAN_PROVINCES}
        eventTypes={Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
        sports={COMMON_SPORTS}
        currentFilters={params}
      />

      {/* Location Info */}
      {therapist?.city && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <MapPin className="h-5 w-5 text-blue-600" />
          <span className="text-blue-700">
            Showing shifts near {therapist.city}, {therapist.province} (within {therapist.travel_radius_km}km)
          </span>
        </div>
      )}

      {/* Shifts List */}
      {availableShifts.length > 0 ? (
        <div className="grid gap-4">
          {availableShifts.map((shift) => (
            <Card key={shift.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {shift.title}
                          </h3>
                          <Badge variant="info">
                            {EVENT_TYPE_LABELS[shift.event_type as keyof typeof EVENT_TYPE_LABELS]}
                          </Badge>
                          {shift.sport && (
                            <Badge variant="default">{shift.sport}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-gray-600">
                          <Building2 className="h-4 w-4" />
                          <span className="text-sm">
                            {shift.organizer?.organization_name || shift.organizer?.profile?.full_name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
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
                        <Users className="h-4 w-4" />
                        <span className="text-sm">
                          {shift.therapists_needed} therapist{shift.therapists_needed > 1 ? 's' : ''} needed
                        </span>
                      </div>
                    </div>

                    {shift.description && (
                      <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                        {shift.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xl font-bold text-primary-600">
                        <DollarSign className="h-5 w-5" />
                        {shift.hourly_rate}/hr
                      </div>
                      <span className="text-sm text-gray-500">CAD</span>
                    </div>
                    <Link href={`/therapist/shifts/${shift.id}`}>
                      <Button>View & Apply</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No available shifts</h3>
            <p className="text-gray-500 mt-1">
              There are no open shifts in your area right now. Check back later!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
