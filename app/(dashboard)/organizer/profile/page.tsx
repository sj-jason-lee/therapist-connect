'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase/AuthContext'
import { updateUserProfile, updateOrganizerProfile, getOrganizerProfile, OrganizerProfile } from '@/lib/firebase/firestore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { CANADIAN_PROVINCES, ORGANIZATION_TYPE_LABELS } from '@/lib/constants'
import { Loader2, Save, CheckCircle, AlertCircle } from 'lucide-react'

export default function OrganizerProfilePage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [organizer, setOrganizer] = useState<OrganizerProfile | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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
    async function fetchOrganizer() {
      if (!user) return

      try {
        const org = await getOrganizerProfile(user.uid)
        setOrganizer(org)

        if (profile) {
          setFormData({
            full_name: profile.fullName || '',
            phone: profile.phone || '',
            organization_name: org?.organizationName || '',
            organization_type: org?.organizationType || '',
            address: org?.address || '',
            city: org?.city || '',
            province: org?.province || '',
            postal_code: org?.postalCode || '',
          })
        }
      } catch (err) {
        console.error('Error fetching organizer:', err)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchOrganizer()
    }
  }, [user, profile, authLoading])

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
    if (!user) return

    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      // Update user profile
      await updateUserProfile(user.uid, {
        fullName: formData.full_name,
        ...(formData.phone && { phone: formData.phone }),
      })

      // Build organizer profile update
      const organizerUpdate: Record<string, any> = {
        organizationName: formData.organization_name,
        organizationType: formData.organization_type,
        city: formData.city,
        province: formData.province,
      }

      if (formData.address) organizerUpdate.address = formData.address
      if (formData.postal_code) organizerUpdate.postalCode = formData.postal_code

      await updateOrganizerProfile(user.uid, organizerUpdate)

      setSaved(true)
    } catch (err) {
      console.error('Error saving profile:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to save profile: ${errorMessage}`)
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

        {/* Organization Details */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
            <CardDescription>Information about your organization.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Organization Name"
              name="organization_name"
              value={formData.organization_name}
              onChange={handleChange}
              placeholder="Toronto Youth Hockey League"
              required
            />
            <Select
              label="Organization Type"
              name="organization_type"
              value={formData.organization_type}
              onChange={handleChange}
              options={organizationTypeOptions}
              placeholder="Select type"
            />
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
            <CardDescription>Your organization&apos;s primary location.</CardDescription>
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
                required
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
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
      </form>
    </div>
  )
}
