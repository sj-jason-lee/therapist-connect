'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/firebase/AuthContext'
import { getOpenShifts, Shift } from '@/lib/firebase/firestore'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ErrorAlert } from '@/components/ui/error-alert'
import { EmptyState } from '@/components/ui/empty-state'
import { SkeletonShiftCard } from '@/components/ui/skeleton'
import {
  MapPin,
  Calendar,
  Loader2,
  Clock,
  DollarSign,
  Users,
  ChevronRight,
  Search,
} from 'lucide-react'
import { EVENT_TYPE_LABELS, CANADIAN_PROVINCES, COMMON_SPORTS } from '@/lib/constants'
import { ShiftFilters } from './shift-filters'

export default function TherapistShiftsPage() {
  const { therapist, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get filter values from URL
  const filters = {
    city: searchParams.get('city') || '',
    province: searchParams.get('province') || '',
    event_type: searchParams.get('event_type') || '',
    sport: searchParams.get('sport') || '',
    min_rate: searchParams.get('min_rate') || '',
    my_area: searchParams.get('my_area') === 'true',
  }

  useEffect(() => {
    async function fetchShifts() {
      try {
        const fetchedShifts = await getOpenShifts()

        // Apply filters
        let filteredShifts = fetchedShifts

        if (filters.city) {
          filteredShifts = filteredShifts.filter(s =>
            s.city?.toLowerCase().includes(filters.city.toLowerCase())
          )
        }

        if (filters.province) {
          filteredShifts = filteredShifts.filter(s => s.province === filters.province)
        }

        if (filters.event_type) {
          filteredShifts = filteredShifts.filter(s => s.eventType === filters.event_type)
        }

        if (filters.sport) {
          filteredShifts = filteredShifts.filter(s => s.sport === filters.sport)
        }

        if (filters.min_rate) {
          const minRate = parseFloat(filters.min_rate)
          filteredShifts = filteredShifts.filter(s => s.hourlyRate >= minRate)
        }

        // Filter by therapist's area if enabled
        if (filters.my_area && therapist) {
          filteredShifts = filteredShifts.filter(s => {
            // Match city (case insensitive) or province
            const cityMatch = therapist.city && s.city?.toLowerCase() === therapist.city.toLowerCase()
            const provinceMatch = therapist.province && s.province === therapist.province
            return cityMatch || provinceMatch
          })
        }

        // Sort by date ascending (soonest first)
        filteredShifts.sort((a, b) => {
          const dateA = a.date?.toDate?.() || new Date(0)
          const dateB = b.date?.toDate?.() || new Date(0)
          return dateA.getTime() - dateB.getTime()
        })

        setShifts(filteredShifts)
      } catch (err) {
        console.error('Error fetching shifts:', err)
        setError('Failed to load shifts')
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchShifts()
    }
  }, [authLoading, therapist, filters.city, filters.province, filters.event_type, filters.sport, filters.min_rate, filters.my_area])

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Available Shifts</h1>
          <p className="text-gray-500 mt-1">Browse and apply to shifts in your area.</p>
        </div>
        <div className="space-y-4">
          <SkeletonShiftCard />
          <SkeletonShiftCard />
          <SkeletonShiftCard />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Available Shifts</h1>
          <p className="text-gray-500 mt-1">Browse and apply to shifts in your area.</p>
        </div>
        <ErrorAlert message={error} onDismiss={() => setError(null)} />
      </div>
    )
  }

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
        currentFilters={filters}
        therapistLocation={therapist ? { city: therapist.city, province: therapist.province } : undefined}
      />

      {/* Location Info */}
      {therapist?.city && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <MapPin className="h-5 w-5 text-blue-600" />
          <span className="text-blue-700">
            Your location: {therapist.city}, {therapist.province} (travel radius: {therapist.travelRadiusKm || 50}km)
          </span>
        </div>
      )}

      {/* Shifts List */}
      {shifts.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No available shifts"
          description={
            Object.values(filters).some(v => v)
              ? 'No shifts match your filters. Try adjusting your search criteria.'
              : 'There are no open shifts right now. Check back later!'
          }
        />
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{shifts.length} shift{shifts.length !== 1 ? 's' : ''} available</p>

          {shifts.map((shift) => {
            const shiftDate = shift.date?.toDate?.()
            const formattedDate = shiftDate
              ? shiftDate.toLocaleDateString('en-CA', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Date TBD'

            return (
              <Link key={shift.id} href={`/therapist/shifts/${shift.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {shift.title}
                          </h3>
                          {shift.eventType && (
                            <Badge variant="outline">
                              {EVENT_TYPE_LABELS[shift.eventType] || shift.eventType}
                            </Badge>
                          )}
                          {shift.sport && (
                            <Badge variant="secondary">{shift.sport}</Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formattedDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {shift.startTime} - {shift.endTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {shift.city}, {shift.province}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <DollarSign className="h-4 w-4" />
                            ${shift.hourlyRate}/hr
                          </span>
                          <span className="flex items-center gap-1 text-gray-600">
                            <Users className="h-4 w-4" />
                            {shift.therapistsNeeded} therapist{shift.therapistsNeeded !== 1 ? 's' : ''} needed
                          </span>
                        </div>

                        {shift.description && (
                          <p className="text-sm text-gray-500 line-clamp-2">{shift.description}</p>
                        )}
                      </div>

                      <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
