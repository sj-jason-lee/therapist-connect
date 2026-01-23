'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/firebase/AuthContext'
import { getShiftsByOrganizer, Shift } from '@/lib/firebase/firestore'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  PlusCircle,
  Calendar,
  Loader2,
  MapPin,
  Clock,
  DollarSign,
  Users,
} from 'lucide-react'
import { EVENT_TYPE_LABELS } from '@/lib/constants'

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-100 text-green-800',
  filled: 'bg-blue-100 text-blue-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function OrganizerShiftsPage() {
  const { user, loading: authLoading } = useAuth()
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchShifts() {
      if (!user) return

      try {
        const fetchedShifts = await getShiftsByOrganizer(user.uid)
        // Sort by date descending (newest first)
        fetchedShifts.sort((a, b) => {
          const dateA = a.date?.toDate?.() || new Date(0)
          const dateB = b.date?.toDate?.() || new Date(0)
          return dateB.getTime() - dateA.getTime()
        })
        setShifts(fetchedShifts)
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
  }, [user, authLoading])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    )
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

      {shifts.length === 0 ? (
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
      ) : (
        <div className="space-y-4">
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
              <Link key={shift.id} href={`/organizer/shifts/${shift.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {shift.title}
                          </h3>
                          <Badge className={STATUS_COLORS[shift.status] || STATUS_COLORS.open}>
                            {shift.status.charAt(0).toUpperCase() + shift.status.slice(1)}
                          </Badge>
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

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            ${shift.hourlyRate}/hr
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {shift.therapistsNeeded} therapist{shift.therapistsNeeded !== 1 ? 's' : ''} needed
                          </span>
                          {shift.eventType && (
                            <Badge variant="outline">
                              {EVENT_TYPE_LABELS[shift.eventType] || shift.eventType}
                            </Badge>
                          )}
                        </div>
                      </div>
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
