'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { CANADIAN_PROVINCES, ORGANIZATION_TYPE_LABELS } from '@/lib/constants'
import { Loader2, Save, CheckCircle } from 'lucide-react'

export default function OrganizerProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    organization_name: '',
    organization_type: '',
    address: '',
    city: '',
    province: '',
    postal_code: '',
  })

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // Get organizer data
      const { data: organizer } = await supabase
        .from('organizers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profile && organizer) {
        setFormData({
          full_name: profile.full_name || '',
          phone: profile.phone || '',
          organization_name: organizer.organization_name || '',
          organization_type: organizer.organization_type || '',
          address: organizer.address || '',
          city: organizer.city || '',
          province: organizer.province || '',
          postal_code: organizer.postal_code || '',
        })
      }

      setLoading(false)
    }

    loadProfile()
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setSaved(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Not authenticated')
      setSaving(false)
      return
    }

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        phone: formData.phone,
      })
      .eq('id', user.id)

    if (profileError) {
      setError(profileError.message)
      setSaving(false)
      return
    }

    // Update organizer
    const { error: organizerError } = await supabase
      .from('organizers')
      .update({
        organization_name: formData.organization_name || null,
        organization_type: formData.organization_type || null,
        address: formData.address || null,
        city: formData.city || null,
        province: formData.province || null,
        postal_code: formData.postal_code || null,
      })
      .eq('user_id', user.id)

    if (organizerError) {
      setError(organizerError.message)
      setSaving(false)
      return
    }

    setSaved(true)
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-secondary-600" />
      </div>
    )
  }

  const provinceOptions = CANADIAN_PROVINCES.map((p) => ({
    value: p.value,
    label: p.label,
  }))

  const organizationTypeOptions = Object.entries(ORGANIZATION_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }))

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organization Profile</h1>
        <p className="text-gray-500 mt-1">Update your organization information.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Your personal contact details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="John Smith"
                required
              />
              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(416) 555-0123"
              />
            </div>
          </CardContent>
        </Card>

        {/* Organization Information */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
            <CardDescription>Information about your organization or business.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Organization Name"
                name="organization_name"
                value={formData.organization_name}
                onChange={handleChange}
                placeholder="e.g., Toronto Youth Hockey League"
              />
              <Select
                label="Organization Type"
                name="organization_type"
                value={formData.organization_type}
                onChange={handleChange}
                options={organizationTypeOptions}
                placeholder="Select type"
              />
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
            <CardDescription>Your organization&apos;s primary address.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Street Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Main St"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Toronto"
              />
              <Select
                label="Province"
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
                placeholder="M5V 1A1"
              />
            </div>
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
          {saved && (
            <span className="flex items-center text-green-600 text-sm">
              <CheckCircle className="h-4 w-4 mr-1" />
              Saved successfully
            </span>
          )}
          <Button type="submit" variant="secondary" loading={saving}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
