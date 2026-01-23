'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/firebase/AuthContext'
import {
  getApplicationsByTherapist,
  getShift,
  updateApplication,
  Application,
  Shift,
} from '@/lib/firebase/firestore'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ClipboardList,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  AlertCircle,
  XCircle,
} from 'lucide-react'
import { EVENT_TYPE_LABELS } from '@/lib/constants'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-800',
}

interface ApplicationWithShift extends Application {
  shift?: Shift | null
}

export default function TherapistApplicationsPage() {
  const { user, loading: authLoading } = useAuth()
  const [applications, setApplications] = useState<ApplicationWithShift[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchApplications() {
      if (!user) return

      try {
        const fetchedApplications = await getApplicationsByTherapist(user.uid)

        // Fetch shift details for each application
        const applicationsWithShifts = await Promise.all(
          fetchedApplications.map(async (app) => {
            const shift = await getShift(app.shiftId)
            return { ...app, shift }
          })
        )

        // Sort by creation date (newest first)
        applicationsWithShifts.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0)
          const dateB = b.createdAt?.toDate?.() || new Date(0)
          return dateB.getTime() - dateA.getTime()
        })

        setApplications(applicationsWithShifts)
      } catch (err) {
        console.error('Error fetching applications:', err)
        setError('Failed to load applications')
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchApplications()
    }
  }, [user, authLoading])

  const handleWithdraw = async (applicationId: string) => {
    setWithdrawingId(applicationId)
    try {
      await updateApplication(applicationId, { status: 'withdrawn' })
      setApplications(prev =>
        prev.map(app =>
          app.id === applicationId ? { ...app, status: 'withdrawn' } : app
        )
      )
    } catch (err) {
      console.error('Error withdrawing application:', err)
      setError('Failed to withdraw application')
    } finally {
      setWithdrawingId(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const pendingCount = applications.filter(a => a.status === 'pending').length
  const acceptedCount = applications.filter(a => a.status === 'accepted').length
  const rejectedCount = applications.filter(a => a.status === 'rejected').length
  const totalCount = applications.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
        <p className="text-gray-500 mt-1">Track the status of your shift applications.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{acceptedCount}</p>
              <p className="text-sm text-gray-500">Accepted</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
              <p className="text-sm text-gray-500">Not Selected</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{totalCount}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
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
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const shift = app.shift
            const shiftDate = shift?.date?.toDate?.()
            const formattedDate = shiftDate
              ? shiftDate.toLocaleDateString('en-CA', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Date TBD'

            return (
              <Card key={app.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {shift?.title || 'Unknown Shift'}
                        </h3>
                        <Badge className={STATUS_COLORS[app.status]}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </Badge>
                      </div>

                      {shift && (
                        <>
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
                            <span className="flex items-center gap-1 text-green-600 font-medium">
                              <DollarSign className="h-4 w-4" />
                              ${shift.hourlyRate}/hr
                            </span>
                          </div>

                          {shift.eventType && (
                            <Badge variant="outline">
                              {EVENT_TYPE_LABELS[shift.eventType] || shift.eventType}
                            </Badge>
                          )}
                        </>
                      )}

                      {app.message && (
                        <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-600">
                          <span className="font-medium">Your message:</span> {app.message}
                        </div>
                      )}

                      <p className="text-xs text-gray-400">
                        Applied {app.createdAt?.toDate?.().toLocaleDateString('en-CA') || 'Unknown date'}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      {shift && (
                        <Link href={`/therapist/shifts/${shift.id}`}>
                          <Button variant="outline" size="sm">View Shift</Button>
                        </Link>
                      )}
                      {app.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleWithdraw(app.id)}
                          disabled={withdrawingId === app.id}
                          className="text-red-600 hover:text-red-700"
                        >
                          {withdrawingId === app.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-1" />
                              Withdraw
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
