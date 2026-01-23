'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/firebase/AuthContext'
import { createShift } from '@/lib/firebase/firestore'
import { Timestamp } from 'firebase/firestore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CANADIAN_PROVINCES, EVENT_TYPE_LABELS, COMMON_SPORTS } from '@/lib/constants'
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react'

export default function NewShiftPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setError('You must be logged in to post a shift')
      return
    }

    // Validate required fields
    const missingFields: string[] = []
    if (!formData.title) missingFields.push('Shift Title')
    if (!formData.eventType) missingFields.push('Event Type')
    if (!formData.date) missingFields.push('Date')
    if (!formData.startTime) missingFields.push('Start Time')
    if (!formData.endTime) missingFields.push('End Time')
    if (!formData.hourlyRate) missingFields.push('Hourly Rate')
    if (!formData.city) missingFields.push('City')
    if (!formData.province) missingFields.push('Province')

    if (missingFields.length > 0) {
      setError(`Please fill in: ${missingFields.join(', ')}`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Convert date string to Timestamp
      const dateTimestamp = Timestamp.fromDate(new Date(formData.date))

      const shiftData: Record<string, unknown> = {
        title: formData.title,
        eventType: formData.eventType as 'tournament' | 'game' | 'practice' | 'corporate' | 'other',
        date: dateTimestamp,
        startTime: formData.startTime,
        endTime: formData.endTime,
        hourlyRate: parseFloat(formData.hourlyRate),
        therapistsNeeded: parseInt(formData.therapistsNeeded) || 1,
        city: formData.city,
        province: formData.province,
      }

      // Only add optional fields if they have values (Firebase doesn't accept undefined)
      if (formData.sport) shiftData.sport = formData.sport
      if (formData.description) shiftData.description = formData.description
      if (formData.venueName) shiftData.venueName = formData.venueName
      if (formData.address) shiftData.address = formData.address
      if (formData.postalCode) shiftData.postalCode = formData.postalCode
      if (formData.equipmentProvided) shiftData.equipmentProvided = formData.equipmentProvided
      if (formData.specialRequirements) shiftData.specialRequirements = formData.specialRequirements

      await createShift(user.uid, shiftData)

      router.push('/organizer/shifts')
    } catch (err) {
      console.error('Error creating shift:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to create shift: ${errorMessage}`)
    }

    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/organizer/shifts">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Post New Shift</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Shift Details</CardTitle>
            <CardDescription>Fill in the details for your shift posting.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shift Title <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g., Tournament Coverage - Hockey"
                value={formData.title}
                onChange={handleChange('title')}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type <span className="text-red-500">*</span>
                </label>
                <Select
                  options={Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                  placeholder="Select event type"
                  value={formData.eventType}
                  onChange={handleChange('eventType')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sport</label>
                <Select
                  options={COMMON_SPORTS.map((sport) => ({ value: sport, label: sport }))}
                  placeholder="Select sport"
                  value={formData.sport}
                  onChange={handleChange('sport')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <Textarea
                placeholder="Describe the event and any special requirements..."
                rows={4}
                value={formData.description}
                onChange={handleChange('description')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={handleChange('date')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={handleChange('startTime')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time <span className="text-red-500">*</span>
                </label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={handleChange('endTime')}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hourly Rate (CAD) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min={1}
                  placeholder="50"
                  value={formData.hourlyRate}
                  onChange={handleChange('hourlyRate')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Therapists Needed <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min={1}
                  value={formData.therapistsNeeded}
                  onChange={handleChange('therapistsNeeded')}
                  required
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Location</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name</label>
                  <Input
                    placeholder="e.g., Scotiabank Arena"
                    value={formData.venueName}
                    onChange={handleChange('venueName')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                  <Input
                    placeholder="123 Main St"
                    value={formData.address}
                    onChange={handleChange('address')}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Toronto"
                      value={formData.city}
                      onChange={handleChange('city')}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Province <span className="text-red-500">*</span>
                    </label>
                    <Select
                      options={CANADIAN_PROVINCES.map((p) => ({ value: p.value, label: p.label }))}
                      placeholder="Select province"
                      value={formData.province}
                      onChange={handleChange('province')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                    <Input
                      placeholder="M5V 1J2"
                      value={formData.postalCode}
                      onChange={handleChange('postalCode')}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Provided</label>
                  <Input
                    placeholder="e.g., Treatment table, ice, tape"
                    value={formData.equipmentProvided}
                    onChange={handleChange('equipmentProvided')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Requirements</label>
                  <Textarea
                    placeholder="Any special requirements or notes for therapists..."
                    rows={3}
                    value={formData.specialRequirements}
                    onChange={handleChange('specialRequirements')}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Link href="/organizer/shifts">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Post Shift
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
