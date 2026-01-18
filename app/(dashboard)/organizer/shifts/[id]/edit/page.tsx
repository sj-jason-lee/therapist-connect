'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CANADIAN_PROVINCES, EVENT_TYPE_LABELS, COMMON_SPORTS } from '@/lib/constants'
import { Loader2, ArrowLeft, Save } from 'lucide-react'

export default function EditShiftPage() {
  const router = useRouter()
  const params = useParams()
  const shiftId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: '',
    sport: '',
    venue_name: '',
    address: '',
    city: '',
    province: '',
    postal_code: '',
    date: '',
    start_time: '',
    end_time: '',
    hourly_rate: '',
    therapists_needed: '1',
    equipment_provided: '',
    special_requirements: '',
  })

  useEffect(() => {
    const loadShift = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Get organizer to verify ownership
      const { data: organizer } = await supabase
        .from('organizers')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!organizer) {
        router.push('/organizer')
        return
      }

      // Load shift data
      const { data: shift, error: shiftError } = await supabase
        .from('shifts')
        .select('*')
        .eq('id', shiftId)
        .eq('organizer_id', organizer.id)
        .single()

      if (shiftError || !shift) {
        setNotFound(true)
        setLoading(false)
        return
      }

      // Can only edit open shifts
      if (shift.status !== 'open') {
        setError('Only open shifts can be edited')
        setLoading(false)
        return
      }

      setFormData({
        title: shift.title || '',
        description: shift.description || '',
        event_type: shift.event_type || '',
        sport: shift.sport || '',
        venue_name: shift.venue_name || '',
        address: shift.address || '',
        city: shift.city || '',
        province: shift.province || '',
        postal_code: shift.postal_code || '',
        date: shift.date || '',
        start_time: shift.start_time || '',
        end_time: shift.end_time || '',
        hourly_rate: shift.hourly_rate?.toString() || '',
        therapists_needed: shift.therapists_needed?.toString() || '1',
        equipment_provided: shift.equipment_provided || '',
        special_requirements: shift.special_requirements || '',
      })

      setLoading(false)
    }

    loadShift()
  }, [router, shiftId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    // Validation
    if (!formData.title || !formData.event_type || !formData.city || !formData.province ||
        !formData.date || !formData.start_time || !formData.end_time || !formData.hourly_rate) {
      setError('Please fill in all required fields')
      setSaving(false)
      return
    }

    // Validate end time is after start time
    if (formData.end_time <= formData.start_time) {
      setError('End time must be after start time')
      setSaving(false)
      return
    }

    // Validate hourly rate is positive
    const hourlyRate = parseFloat(formData.hourly_rate)
    if (hourlyRate <= 0) {
      setError('Hourly rate must be greater than 0')
      setSaving(false)
      return
    }

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('shifts')
      .update({
        title: formData.title,
        description: formData.description || null,
        event_type: formData.event_type,
        sport: formData.sport || null,
        venue_name: formData.venue_name || null,
        address: formData.address || null,
        city: formData.city,
        province: formData.province,
        postal_code: formData.postal_code || null,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        hourly_rate: hourlyRate,
        therapists_needed: parseInt(formData.therapists_needed) || 1,
        equipment_provided: formData.equipment_provided || null,
        special_requirements: formData.special_requirements || null,
      })
      .eq('id', shiftId)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    router.push(`/organizer/shifts/${shiftId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-secondary-600" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Shift not found</h2>
        <p className="mt-2 text-gray-600">This shift doesn&apos;t exist or you don&apos;t have permission to edit it.</p>
        <Link href="/organizer/shifts" className="mt-4 inline-block text-secondary-600 hover:text-secondary-500">
          Back to shifts
        </Link>
      </div>
    )
  }

  const provinceOptions = CANADIAN_PROVINCES.map((p) => ({
    value: p.value,
    label: p.label,
  }))

  const eventTypeOptions = Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }))

  const sportOptions = COMMON_SPORTS.map((sport) => ({
    value: sport,
    label: sport,
  }))

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/organizer/shifts/${shiftId}`}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Shift</h1>
          <p className="text-gray-500 mt-1">Update the shift details.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Shift Details</CardTitle>
            <CardDescription>Basic information about the shift.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Shift Title *"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Weekend Tournament Coverage"
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Event Type *"
                name="event_type"
                value={formData.event_type}
                onChange={handleChange}
                options={eventTypeOptions}
                placeholder="Select event type"
              />
              <Select
                label="Sport"
                name="sport"
                value={formData.sport}
                onChange={handleChange}
                options={sportOptions}
                placeholder="Select sport (optional)"
              />
            </div>
            <Textarea
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the event and what the therapist will be doing..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
            <CardDescription>Where the shift will take place.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Venue Name"
              name="venue_name"
              value={formData.venue_name}
              onChange={handleChange}
              placeholder="e.g., Scotiabank Arena"
            />
            <Input
              label="Street Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="40 Bay Street"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="City *"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Toronto"
                required
              />
              <Select
                label="Province *"
                name="province"
                value={formData.province}
                onChange={handleChange}
                options={provinceOptions}
                placeholder="Select province"
              />
              <Input
                label="Postal Code"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                placeholder="M5J 2X2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
            <CardDescription>When the shift will take place.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Date *"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                required
              />
              <Input
                label="Start Time *"
                name="start_time"
                type="time"
                value={formData.start_time}
                onChange={handleChange}
                required
              />
              <Input
                label="End Time *"
                name="end_time"
                type="time"
                value={formData.end_time}
                onChange={handleChange}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Compensation & Staffing */}
        <Card>
          <CardHeader>
            <CardTitle>Compensation & Staffing</CardTitle>
            <CardDescription>Pay rate and number of therapists needed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Hourly Rate (CAD) *"
                name="hourly_rate"
                type="number"
                value={formData.hourly_rate}
                onChange={handleChange}
                min={1}
                step={5}
                placeholder="50"
                required
              />
              <Input
                label="Number of Therapists Needed"
                name="therapists_needed"
                type="number"
                value={formData.therapists_needed}
                onChange={handleChange}
                min={1}
                max={10}
              />
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Optional details for therapists.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              label="Equipment Provided"
              name="equipment_provided"
              value={formData.equipment_provided}
              onChange={handleChange}
              placeholder="List any equipment that will be provided (e.g., treatment table, ice, tape)..."
              rows={3}
            />
            <Textarea
              label="Special Requirements"
              name="special_requirements"
              value={formData.special_requirements}
              onChange={handleChange}
              placeholder="Any special requirements or qualifications needed..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4">
          <Link href={`/organizer/shifts/${shiftId}`}>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" variant="secondary" loading={saving}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
