'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/firebase/AuthContext'
import { getShift, updateShift, Shift } from '@/lib/firebase/firestore'
import { Timestamp } from 'firebase/firestore'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CANADIAN_PROVINCES, EVENT_TYPE_LABELS, COMMON_SPORTS } from '@/lib/constants'
import { ArrowLeft, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

export default function EditShiftPage() {
  const params = useParams()
  const router = useRouter()
  const shiftId = params.id as string
  const { user, loading: authLoading } = useAuth()

  const [shift, setShift] = useState<Shift | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    eventType: '',
    sport: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    hourlyRate: '',
    therapistsNeeded: '1',
    venueName: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    equipmentProvided: '',
    specialRequirements: '',
  })

  useEffect(() => {
    async function fetchShift() {
      if (!shiftId) return

      try {
        const fetchedShift = await getShift(shiftId)
        if (!fetchedShift) {
          setError('Shift not found')
          return
        }

        setShift(fetchedShift)

        // Populate form data
        const shiftDate = fetchedShift.date?.toDate?.()
        setFormData({
          title: fetchedShift.title || '',
          eventType: fetchedShift.eventType || '',
          sport: fetchedShift.sport || '',
          description: fetchedShift.description || '',
          date: shiftDate ? shiftDate.toISOString().split('T')[0] : '',
          startTime: fetchedShift.startTime || '',
          endTime: fetchedShift.endTime || '',
          hourlyRate: fetchedShift.hourlyRate?.toString() || '',
          therapistsNeeded: fetchedShift.therapistsNeeded?.toString() || '1',
          venueName: fetchedShift.venueName || '',
          address: fetchedShift.address || '',
          city: fetchedShift.city || '',
          province: fetchedShift.province || '',
          postalCode: fetchedShift.postalCode || '',
          equipmentProvided: fetchedShift.equipmentProvided || '',
          specialRequirements: fetchedShift.specialRequirements || '',
        })
      } catch (err) {
        console.error('Error fetching shift:', err)
        setError('Failed to load shift')
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchShift()
    }
  }, [shiftId, authLoading])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shiftId || !user) return

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      // Build update data
      const updateData: Record<string, unknown> = {
        title: formData.title,
        eventType: formData.eventType,
        startTime: formData.startTime,
        endTime: formData.endTime,
        hourlyRate: parseFloat(formData.hourlyRate),
        therapistsNeeded: parseInt(formData.therapistsNeeded) || 1,
        city: formData.city,
        province: formData.province,
      }

      // Add date as Timestamp
      if (formData.date) {
        updateData.date = Timestamp.fromDate(new Date(formData.date + 'T00:00:00'))
      }

      // Only add optional fields if they have values
      if (formData.sport) updateData.sport = formData.sport
      if (formData.description) updateData.description = formData.description
      if (formData.venueName) updateData.venueName = formData.venueName
      if (formData.address) updateData.address = formData.address
      if (formData.postalCode) updateData.postalCode = formData.postalCode
      if (formData.equipmentProvided) updateData.equipmentProvided = formData.equipmentProvided
      if (formData.specialRequirements) updateData.specialRequirements = formData.specialRequirements

      await updateShift(shiftId, updateData)
      setSuccess(true)

      // Redirect after short delay
      setTimeout(() => {
        router.push(`/organizer/shifts/${shiftId}`)
      }, 1500)
    } catch (err) {
      console.error('Error updating shift:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to update shift: ${errorMessage}`)
    } finally {
      setSaving(false)
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
      <div className="space-y-6">
        <Link href="/organizer/shifts">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Shift not found</h2>
          <p className="text-gray-500 mt-2">{error || 'This shift may have been deleted.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/organizer/shifts/${shiftId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Shift</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">Shift updated successfully! Redirecting...</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Shift Details</CardTitle>
            <CardDescription>Update your shift information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Input
              label="Shift Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Tournament Coverage - Hockey"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Event Type"
                name="eventType"
                value={formData.eventType}
                onChange={handleChange}
                options={Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
                placeholder="Select event type"
              />
              <Select
                label="Sport"
                name="sport"
                value={formData.sport}
                onChange={handleChange}
                options={COMMON_SPORTS.map((sport) => ({ value: sport, label: sport }))}
                placeholder="Select sport"
              />
            </div>

            <Textarea
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the event and any special requirements..."
              rows={4}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
              <Input
                label="Start Time"
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleChange}
                required
              />
              <Input
                label="End Time"
                name="endTime"
                type="time"
                value={formData.endTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Hourly Rate (CAD)"
                name="hourlyRate"
                type="number"
                value={formData.hourlyRate}
                onChange={handleChange}
                min={1}
                placeholder="50"
                required
              />
              <Input
                label="Therapists Needed"
                name="therapistsNeeded"
                type="number"
                value={formData.therapistsNeeded}
                onChange={handleChange}
                min={1}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Venue Name"
                name="venueName"
                value={formData.venueName}
                onChange={handleChange}
                placeholder="e.g., Scotiabank Arena"
              />
              <Input
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Main St"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Toronto"
                required
              />
              <Select
                label="Province"
                name="province"
                value={formData.province}
                onChange={handleChange}
                options={CANADIAN_PROVINCES.map((p) => ({ value: p.value, label: p.label }))}
                placeholder="Select province"
              />
              <Input
                label="Postal Code"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                placeholder="M5V 1A1"
              />
            </div>

            <Textarea
              label="Equipment Provided"
              name="equipmentProvided"
              value={formData.equipmentProvided}
              onChange={handleChange}
              placeholder="List any equipment that will be provided..."
              rows={2}
            />

            <Textarea
              label="Special Requirements"
              name="specialRequirements"
              value={formData.specialRequirements}
              onChange={handleChange}
              placeholder="Any special requirements or certifications needed..."
              rows={2}
            />

            <div className="flex justify-end gap-3">
              <Link href={`/organizer/shifts/${shiftId}`}>
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
